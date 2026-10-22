try {
  require("dotenv").config();
} catch (err) {
  console.warn("dotenv 모듈을 찾을 수 없어 .env 파일을 불러오지 못했습니다. 'npm install'을 실행해주세요. (카카오톡 API 키 등은 기본값으로 동작합니다)");
}

const express = require("express");
const http = require("http");
const os = require("os");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const xlsx = require("xlsx");

const app = express();
const server = http.createServer(app);

const DATA_DIR = path.join(__dirname, "data");
const LATEST_FILE = path.join(DATA_DIR, "latest.xlsx");

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const REPEAT_THRESHOLD = 3;

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, DATA_DIR),
    filename: (req, file, cb) => cb(null, "latest.xlsx"),
  }),
});

function getLocalIPs() {
  const interfaces = os.networkInterfaces();
  const ips = [];
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === "IPv4" && !iface.internal) ips.push(iface.address);
    }
  }
  return ips.length > 0 ? ips : ["127.0.0.1"];
}

const PORT = Number(process.env.PORT) || 3030;
const HOST = "0.0.0.0";
const localIPs = getLocalIPs();

function emptyData() {
  return {
    updatedAt: null,
    totalStudents: 0,
    totalRows: 0,
    totalMeritCount: 0,
    totalDemeritCount: 0,
    ranking: [],
    gradeRanking: [],
    topGrade: null,
    repeatOffenders: [],
    repeatThreshold: REPEAT_THRESHOLD,
    records: [],
    columnInfo: null,
  };
}

function normalizeHeader(value) {
  return String(value || "").replace(/\s/g, "").trim();
}

const HEADER_ALIASES = {
  date: ["날짜", "일자", "발생일", "등록일", "일시"],
  id: ["학번", "학생번호", "학생아이디", "아이디"],
  name: ["이름", "성명", "학생명"],
  classRoom: ["반", "학급", "소속"],
  grade: ["학년"],
  type: ["구분", "유형", "상벌구분", "상벌", "종류"],
  item: ["항목", "위반항목", "사유항목", "분류"],
  reason: ["상벌점내역", "내역", "사유", "내용", "비고", "상세"],
  score: ["점수", "배점", "점"],
};

function findHeader(headers, aliases) {
  return headers.find((header) => {
    const normalized = normalizeHeader(header);
    return aliases.some((alias) => normalized.includes(alias));
  }) || null;
}

function detectColumns(headers) {
  const map = {};
  for (const [key, aliases] of Object.entries(HEADER_ALIASES)) {
    map[key] = findHeader(headers, aliases);
  }

  // “상벌점 내역”처럼 점이라는 글자가 들어간 설명 컬럼이 점수/구분으로 오인되지 않게 보정
  const exactScore = headers.find((h) => ["점수", "배점", "점"].includes(normalizeHeader(h)))
    || headers.find((h) => ["가점", "감점", "합산점수"].includes(normalizeHeader(h)))
    || headers.find((h) => normalizeHeader(h).includes("점수") && !normalizeHeader(h).includes("내역"));
  if (exactScore) map.score = exactScore;

  const exactType = headers.find((h) => ["구분", "유형", "상벌구분", "상벌", "종류"].includes(normalizeHeader(h)));
  map.type = exactType || null;

  return map;
}

function classFromId(id) {
  const s = String(id || "").trim();
  if (!/^\d{4,7}$/.test(s)) return "-";
  const grade = s[0];
  let classNum = "-";
  if (s.length >= 5) classNum = String(parseInt(s.slice(1, 3), 10));
  else if (s.length === 4) classNum = String(parseInt(s.slice(1, 2), 10));
  return classNum === "NaN" ? `${grade}학년` : `${grade}학년 ${classNum}반`;
}

function gradeFromId(id) {
  const s = String(id || "").trim();
  if (!/^\d{4,7}$/.test(s)) return "미분류";
  return `${s[0]}학년`;
}

function extractGrade(value, fallbackId) {
  const raw = String(value || "").trim();
  const match = raw.match(/\d+/);
  if (match) return `${Number(match[0])}학년`;
  return gradeFromId(fallbackId);
}

function extractClass(value, fallbackId) {
  const raw = String(value || "").trim();
  const gradeClass = raw.match(/(\d+)\s*학년\s*(\d+)\s*반/);
  if (gradeClass) return `${Number(gradeClass[1])}학년 ${Number(gradeClass[2])}반`;
  const classOnly = raw.match(/(\d+)\s*반/);
  if (classOnly) {
    const grade = gradeFromId(fallbackId);
    return grade === "미분류" ? `${Number(classOnly[1])}반` : `${grade} ${Number(classOnly[1])}반`;
  }
  return classFromId(fallbackId);
}

function parseDateValue(value) {
  if (value === null || value === undefined || value === "") return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value === "number") {
    const d = new Date(Math.round((value - 25569) * 86400 * 1000));
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const str = String(value).trim();
  if (!str) return null;
  const replaced = str.replace(/\./g, "-").replace(/년|월/g, "-").replace(/일/g, "");
  const d = new Date(replaced);
  return Number.isNaN(d.getTime()) ? null : d;
}

function normalizeRecord(row, columns) {
  const id = columns.id ? String(row[columns.id] || "").trim() : "";
  const name = columns.name ? String(row[columns.name] || "").trim() : "";
  const scoreRaw = columns.score ? row[columns.score] : 0;
  const numericScore = Number(scoreRaw);
  const typeRaw = columns.type ? String(row[columns.type] || "").trim() : "";
  const reason = columns.reason ? String(row[columns.reason] || "").trim() : "";
  const itemCandidate = columns.item ? String(row[columns.item] || "").trim() : "";
  const item = itemCandidate || reason || "기타";
  const date = columns.date ? parseDateValue(row[columns.date]) : null;

  let type = "demerit";
  if (typeRaw.includes("상")) type = "merit";
  else if (typeRaw.includes("벌")) type = "demerit";
  else if (!Number.isNaN(numericScore)) type = numericScore > 0 ? "merit" : "demerit";

  const points = Number.isNaN(numericScore) || numericScore === 0 ? 1 : Math.abs(numericScore);
  const gradeRaw = columns.grade ? row[columns.grade] : "";
  const classRaw = columns.classRoom ? row[columns.classRoom] : "";

  return {
    id,
    name,
    gradeName: extractGrade(gradeRaw, id),
    className: extractClass(classRaw, id),
    type,
    item,
    reason,
    points,
    rawScore: Number.isNaN(numericScore) ? 0 : numericScore,
    date: date ? date.toISOString() : null,
  };
}

// records 배열로부터 ranking/gradeRanking/repeatOffenders 등을 계산한다.
// (processExcel에서도 쓰고, 다운로드 시 기간 필터가 적용된 records로도 재사용한다.)
function aggregateRecords(records, repeatThreshold) {
  const studentsMap = {};
  records.forEach((record) => {
    const key = record.id || record.name;
    if (!key) return;
    if (!studentsMap[key]) {
      studentsMap[key] = {
        id: record.id || "-",
        name: record.name || "-",
        className: record.className || "-",
        gradeName: record.gradeName || "미분류",
        totalReward: 0,
        totalPenalty: 0,
        penaltyCount: 0,
        rewardCount: 0,
        recentReason: "",
        recentDate: "",
      };
    }

    const student = studentsMap[key];
    student.name = record.name || student.name;
    student.className = record.className || student.className;
    student.gradeName = record.gradeName || student.gradeName;

    if (record.type === "merit") {
      student.totalReward += record.points;
      student.rewardCount += 1;
    } else {
      student.totalPenalty += record.points;
      student.penaltyCount += 1;
    }

    if (!student.recentReason) {
      student.recentReason = record.reason || record.item || "";
      student.recentDate = record.date || "";
    }
  });

  const students = Object.values(studentsMap).map((s) => ({ ...s, netScore: s.totalReward - s.totalPenalty }));

  const ranking = [...students]
    .sort((a, b) => b.totalPenalty - a.totalPenalty || b.penaltyCount - a.penaltyCount || a.name.localeCompare(b.name, "ko"))
    .map((s, idx) => ({ rank: idx + 1, ...s }));

  const gradeMap = {};
  students.forEach((s) => {
    const key = s.gradeName || "미분류";
    if (!gradeMap[key]) {
      gradeMap[key] = { gradeName: key, studentCount: 0, totalReward: 0, totalPenalty: 0, penaltyCount: 0, rewardCount: 0 };
    }
    const grade = gradeMap[key];
    grade.studentCount += 1;
    grade.totalReward += s.totalReward;
    grade.totalPenalty += s.totalPenalty;
    grade.penaltyCount += s.penaltyCount;
    grade.rewardCount += s.rewardCount;
  });

  const gradeRanking = Object.values(gradeMap)
    .map((g) => ({
      ...g,
      netScore: g.totalReward - g.totalPenalty,
      averagePenalty: g.studentCount ? Number((g.totalPenalty / g.studentCount).toFixed(1)) : 0,
    }))
    .sort((a, b) => b.totalPenalty - a.totalPenalty || b.averagePenalty - a.averagePenalty)
    .map((g, idx) => ({ rank: idx + 1, ...g }));

  const repeatOffenders = students
    .filter((s) => s.penaltyCount >= repeatThreshold)
    .sort((a, b) => b.penaltyCount - a.penaltyCount || b.totalPenalty - a.totalPenalty);

  return {
    totalStudents: students.length,
    totalRows: records.length,
    ranking,
    gradeRanking,
    repeatOffenders,
  };
}

// 기간(YYYY-MM-DD ~ YYYY-MM-DD)으로 records를 걸러낸다. start/end가 없으면 그대로 반환.
function filterRecordsByPeriod(records, start, end) {
  if (!start && !end) return records;
  const startTime = start ? new Date(`${start}T00:00:00`).getTime() : null;
  const endTime = end ? new Date(`${end}T00:00:00`).getTime() : null;
  return records.filter((r) => {
    if (!r.date) return false;
    const d = new Date(r.date);
    if (Number.isNaN(d.getTime())) return false;
    const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    if (startTime !== null && dayStart < startTime) return false;
    if (endTime !== null && dayStart > endTime) return false;
    return true;
  });
}

function processExcel(filePath) {
  const workbook = xlsx.readFile(filePath, { cellDates: true });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json(sheet, { defval: "" });

  if (rows.length === 0) return { ...emptyData(), updatedAt: new Date().toISOString() };

  const headers = Object.keys(rows[0]);
  const columns = detectColumns(headers);
  const records = rows
    .map((row) => normalizeRecord(row, columns))
    .filter((record) => record.id || record.name);

  const { totalStudents, totalRows, ranking, gradeRanking, repeatOffenders } = aggregateRecords(records, REPEAT_THRESHOLD);

  return {
    updatedAt: new Date().toISOString(),
    totalStudents,
    totalRows,
    totalMeritCount: records.filter((r) => r.type === "merit").length,
    totalDemeritCount: records.filter((r) => r.type === "demerit").length,
    ranking,
    gradeRanking,
    topGrade: gradeRanking.length > 0 ? gradeRanking[0] : null,
    repeatOffenders,
    repeatThreshold: REPEAT_THRESHOLD,
    records,
    columnInfo: {
      headers,
      date: columns.date,
      id: columns.id,
      name: columns.name,
      classRoom: columns.classRoom,
      grade: columns.grade,
      type: columns.type,
      item: columns.item,
      reason: columns.reason,
      score: columns.score,
    },
  };
}

let latestData = emptyData();
const sseClients = [];

// 후속지도 등급 기준 화면 비밀번호 - .env 파일의 TIER_PASSWORD 값을 사용한다.
// (.env에 없으면 서버를 켤 때마다 임시 비밀번호를 만들어 콘솔에 보여준다.)
let tierPassword = process.env.TIER_PASSWORD || String(Math.floor(10000000 + Math.random() * 90000000));
const TIER_PASSWORD_IS_TEMP = !process.env.TIER_PASSWORD;
// 비밀번호를 재설정할 권한이 있는 선생님 이름 목록 - .env의 ADMIN_NAMES (쉼표로 구분)
const ADMIN_NAMES = String(process.env.ADMIN_NAMES || "")
  .split(",")
  .map((name) => name.trim())
  .filter(Boolean);

/* ------------------------------------------------------------------ */
/* 카카오톡 메시지 발송 — 방법 A: 반별 담임 선생님이 각자 카카오 로그인으로 */
/* "나에게 보내기" 권한에 동의하면, 그 이후로는 서버가 저장해둔 토큰으로   */
/* 그 선생님에게 자동으로 카카오톡 메시지를 보낼 수 있다.                 */
/* ------------------------------------------------------------------ */
const KAKAO_REST_API_KEY = process.env.KAKAO_REST_API_KEY || "";
const KAKAO_ADMIN_KEY = process.env.KAKAO_ADMIN_KEY || "";
const KAKAO_CLIENT_SECRET = process.env.KAKAO_CLIENT_SECRET || "";
const KAKAO_CONFIGURED = Boolean(KAKAO_REST_API_KEY) && !KAKAO_REST_API_KEY.startsWith("REPLACE_WITH");

const KAKAO_TOKEN_FILE = path.join(DATA_DIR, "kakao-tokens.json");

function loadKakaoTokens() {
  try {
    if (!fs.existsSync(KAKAO_TOKEN_FILE)) return {};
    return JSON.parse(fs.readFileSync(KAKAO_TOKEN_FILE, "utf8"));
  } catch (err) {
    console.error("카카오 토큰 파일을 읽지 못했습니다:", err.message);
    return {};
  }
}

function saveKakaoTokens(tokens) {
  fs.writeFileSync(KAKAO_TOKEN_FILE, JSON.stringify(tokens, null, 2), "utf8");
}

function kakaoTeacherKey(grade, room) {
  return `${grade}__${room}`;
}

// 이 서버가 실제로 접속된 주소를 기준으로 리다이렉트 URI를 만든다.
// (KAKAO_REDIRECT_URI를 .env에 직접 지정해두면 그 값을 우선 사용한다.)
function getKakaoRedirectUri(req) {
  if (process.env.KAKAO_REDIRECT_URI) return process.env.KAKAO_REDIRECT_URI;
  return `${req.protocol}://${req.get("host")}/auth/kakao/callback`;
}

async function exchangeKakaoToken(params) {
  const body = new URLSearchParams(params);
  if (KAKAO_CLIENT_SECRET) body.set("client_secret", KAKAO_CLIENT_SECRET);
  const res = await fetch("https://kauth.kakao.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded;charset=utf-8" },
    body,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error_description || data.error || "카카오 토큰 발급에 실패했습니다.");
  return data;
}

async function refreshKakaoTokenIfNeeded(tokenData) {
  if (tokenData.expiresAt && tokenData.expiresAt > Date.now() + 60000) return tokenData;
  const refreshed = await exchangeKakaoToken({
    grant_type: "refresh_token",
    client_id: KAKAO_REST_API_KEY,
    refresh_token: tokenData.refreshToken,
  });
  return {
    accessToken: refreshed.access_token,
    refreshToken: refreshed.refresh_token || tokenData.refreshToken,
    expiresAt: Date.now() + (refreshed.expires_in || 0) * 1000,
    linkedAt: tokenData.linkedAt,
  };
}

async function sendKakaoMessage({ grade, className, message }) {
  if (!KAKAO_CONFIGURED) {
    const err = new Error("카카오톡 API가 아직 설정되지 않았습니다. .env 파일에 실제 발급받은 키를 넣어주세요.");
    err.code = "KAKAO_NOT_CONFIGURED";
    throw err;
  }
  const key = kakaoTeacherKey(grade, className);
  const tokens = loadKakaoTokens();
  let tokenData = tokens[key];
  if (!tokenData) {
    const err = new Error("이 반 담임 선생님의 카카오 연동이 되어 있지 않습니다. 먼저 '카카오 연동하기'를 눌러 로그인해주세요.");
    err.code = "KAKAO_NOT_LINKED";
    throw err;
  }
  try {
    tokenData = await refreshKakaoTokenIfNeeded(tokenData);
    tokens[key] = tokenData;
    saveKakaoTokens(tokens);
  } catch (err) {
    delete tokens[key];
    saveKakaoTokens(tokens);
    const linkErr = new Error("카카오 연동이 만료되었습니다. 다시 연동해주세요.");
    linkErr.code = "KAKAO_NOT_LINKED";
    throw linkErr;
  }

  const templateObject = {
    object_type: "text",
    text: message,
    link: { web_url: "https://developers.kakao.com", mobile_web_url: "https://developers.kakao.com" },
  };
  const res = await fetch("https://kapi.kakao.com/v2/api/talk/memo/default/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${tokenData.accessToken}`,
      "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
    },
    body: new URLSearchParams({ template_object: JSON.stringify(templateObject) }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.result_code !== 0) {
    const err = new Error(data.msg || "카카오톡 전송에 실패했습니다.");
    err.code = "KAKAO_SEND_FAILED";
    throw err;
  }
}

function broadcastUpdate() {
  const payload = `data: ${JSON.stringify(latestData)}\n\n`;
  sseClients.forEach((res) => res.write(payload));
}

function reloadFromDisk() {
  if (!fs.existsSync(LATEST_FILE)) return;
  try {
    latestData = processExcel(LATEST_FILE);
    console.log(`[엑셀 처리 완료] 학생 ${latestData.totalStudents}명 / 행 ${latestData.totalRows}개`);
    broadcastUpdate();
  } catch (err) {
    console.error("엑셀 처리 오류:", err.message);
  }
}

reloadFromDisk();

let watchTimer = null;
fs.watch(DATA_DIR, (eventType, filename) => {
  if (filename !== "latest.xlsx") return;
  clearTimeout(watchTimer);
  watchTimer = setTimeout(reloadFromDisk, 300);
});

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => res.render("home", { data: latestData }));
app.get("/api/data", (req, res) => res.json(latestData));

app.get("/api/events", (req, res) => {
  res.set({ "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" });
  res.flushHeaders();
  res.write(`data: ${JSON.stringify(latestData)}\n\n`);
  sseClients.push(res);
  req.on("close", () => {
    const idx = sseClients.indexOf(res);
    if (idx !== -1) sseClients.splice(idx, 1);
  });
});

app.post("/api/upload", upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "파일이 업로드되지 않았습니다." });
  try {
    reloadFromDisk();
    res.json({ success: true, data: latestData });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/reset", (req, res) => {
  try {
    if (fs.existsSync(LATEST_FILE)) fs.unlinkSync(LATEST_FILE);
    latestData = emptyData();
    broadcastUpdate();
    res.json({ success: true, data: latestData });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/tier-password/verify", (req, res) => {
  const { password } = req.body || {};
  res.json({ ok: typeof password === "string" && password === tierPassword });
});

app.post("/api/admin/verify-name", (req, res) => {
  const name = String((req.body || {}).name || "").trim();
  res.json({ ok: ADMIN_NAMES.includes(name) });
});

app.post("/api/admin/set-password", (req, res) => {
  const name = String((req.body || {}).name || "").trim();
  const newPassword = String((req.body || {}).newPassword || "");
  if (!ADMIN_NAMES.includes(name)) {
    return res.status(403).json({ ok: false, error: "권한이 없는 이름입니다." });
  }
  if (newPassword.length < 4) {
    return res.status(400).json({ ok: false, error: "비밀번호는 4자 이상이어야 합니다." });
  }
  tierPassword = newPassword;
  res.json({ ok: true });
});

function formatDateForSheet(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

app.post("/api/export", async (req, res) => {
  if (!latestData.totalRows) {
    return res.status(400).json({ error: "다운로드할 데이터가 없습니다. 먼저 엑셀 파일을 업로드해주세요." });
  }
  const body = req.body || {};
  const chosenSections = Array.isArray(body.sections) && body.sections.length
    ? body.sections
    : ["ranking", "grade", "repeat", "records"];

  const periodStart = typeof body.periodStart === "string" && body.periodStart ? body.periodStart : null;
  const periodEnd = typeof body.periodEnd === "string" && body.periodEnd ? body.periodEnd : null;
  const hasPeriod = Boolean(periodStart || periodEnd);

  const filteredRecords = hasPeriod
    ? filterRecordsByPeriod(latestData.records || [], periodStart, periodEnd)
    : (latestData.records || []);
  const aggregates = hasPeriod
    ? aggregateRecords(filteredRecords, latestData.repeatThreshold || REPEAT_THRESHOLD)
    : {
        ranking: latestData.ranking,
        gradeRanking: latestData.gradeRanking,
        repeatOffenders: latestData.repeatOffenders,
      };

  const sheetDefs = {
    ranking: {
      name: "학생별 순위",
      rows: aggregates.ranking.map((s) => ({
        순위: s.rank, 이름: s.name, 학번: s.id, 학년: s.gradeName, 반: s.className,
        벌점합계: s.totalPenalty, 벌점횟수: s.penaltyCount, 상점합계: s.totalReward, 상점횟수: s.rewardCount, 순점수: s.netScore,
      })),
    },
    grade: {
      name: "학년별 현황",
      rows: aggregates.gradeRanking.map((g) => ({
        순위: g.rank, 학년: g.gradeName, 학생수: g.studentCount, 벌점합계: g.totalPenalty, 평균벌점: g.averagePenalty,
        벌점횟수: g.penaltyCount, 상점합계: g.totalReward, 상점횟수: g.rewardCount, 순점수: g.netScore,
      })),
    },
    repeat: {
      name: `반복위반학생(${latestData.repeatThreshold}회+)`,
      rows: aggregates.repeatOffenders.map((s) => ({
        이름: s.name, 학번: s.id, 학년: s.gradeName, 벌점횟수: s.penaltyCount, 벌점합계: s.totalPenalty,
        상점횟수: s.rewardCount, 순점수: s.netScore,
      })),
    },
    records: {
      name: "원본 기록",
      rows: filteredRecords.map((r) => ({
        날짜: formatDateForSheet(r.date), 이름: r.name, 학번: r.id, 학년: r.gradeName, 반: r.className,
        구분: r.type === "merit" ? "상점" : "벌점", 항목: r.item, 사유: r.reason, 점수: r.points,
      })),
    },
  };

  try {
    const wb = xlsx.utils.book_new();
    chosenSections.forEach((key) => {
      const def = sheetDefs[key];
      if (!def) return;
      const sheet = xlsx.utils.json_to_sheet(def.rows);
      xlsx.utils.book_append_sheet(wb, sheet, def.name.slice(0, 31));
    });
    if (wb.SheetNames.length === 0) {
      return res.status(400).json({ error: "포함할 내용을 하나 이상 선택해주세요." });
    }
    const buffer = xlsx.write(wb, { type: "buffer", bookType: "xlsx" });
    const filename = `상벌점_리포트_${formatDateForSheet(new Date().toISOString())}.xlsx`;
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`);
    res.send(buffer);
  } catch (err) {
    console.error("엑셀 생성 오류:", err);
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/send-kakao", async (req, res) => {
  const grade = String((req.body || {}).grade || "").trim();
  const className = String((req.body || {}).className || "").trim();
  if (!grade || !className) {
    return res.status(400).json({ ok: false, error: "학년/반 정보가 없습니다." });
  }
  const classRecords = (latestData.records || []).filter(
    (r) => (r.gradeName || "미분류") === grade && (r.className || "미분류") === className
  );
  const meritCount = classRecords.filter((r) => r.type === "merit").length;
  const demeritCount = classRecords.length - meritCount;
  const message =
    `[${grade} ${className} 상벌점 현황]\n` +
    `상점 ${meritCount}건 · 벌점 ${demeritCount}건\n` +
    `(자동 발송 · 상벌점 관리 대시보드)`;

  try {
    await sendKakaoMessage({ grade, className, message });
    res.json({ ok: true });
  } catch (err) {
    res.status(503).json({ ok: false, error: err.message, code: err.code || null });
  }
});

// 특정 학년/반의 담임 선생님이 카카오 연동을 완료했는지 확인
app.get("/api/kakao-status", (req, res) => {
  const grade = String(req.query.grade || "").trim();
  const room = String(req.query.room || "").trim();
  if (!grade || !room) return res.json({ linked: false, configured: KAKAO_CONFIGURED });
  const tokens = loadKakaoTokens();
  const tokenData = tokens[kakaoTeacherKey(grade, room)];
  res.json({ linked: Boolean(tokenData), configured: KAKAO_CONFIGURED });
});

// 담임 선생님용 카카오 로그인 시작 (팝업으로 열림)
app.get("/auth/kakao/start", (req, res) => {
  const grade = String(req.query.grade || "").trim();
  const room = String(req.query.room || "").trim();
  if (!KAKAO_CONFIGURED) {
    return res.status(500).send("카카오 API가 아직 설정되지 않았습니다. .env 파일을 확인해주세요.");
  }
  if (!grade || !room) {
    return res.status(400).send("학년/반 정보가 없습니다.");
  }
  const redirectUri = getKakaoRedirectUri(req);
  const state = Buffer.from(JSON.stringify({ grade, room })).toString("base64url");
  const authUrl =
    `https://kauth.kakao.com/oauth/authorize?client_id=${encodeURIComponent(KAKAO_REST_API_KEY)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=talk_message&state=${encodeURIComponent(state)}`;
  res.redirect(authUrl);
});

// 카카오 로그인 완료 후 돌아오는 주소
app.get("/auth/kakao/callback", async (req, res) => {
  const { code, error, state } = req.query;
  const closeScript = (message, ok) =>
    `<!DOCTYPE html><html><body style="font-family:sans-serif;padding:24px;">
      <p>${message}</p>
      <script>
        if (window.opener) { window.opener.postMessage({ type: "kakao-link-result", ok: ${ok} }, "*"); }
        setTimeout(function(){ window.close(); }, 800);
      </script>
    </body></html>`;

  if (error) {
    return res.send(closeScript("카카오 연동이 취소되었습니다. 창을 닫아주세요.", false));
  }
  let grade = "";
  let room = "";
  try {
    const parsed = JSON.parse(Buffer.from(String(state), "base64url").toString("utf8"));
    grade = parsed.grade;
    room = parsed.room;
  } catch (err) {
    return res.send(closeScript("연동 정보가 올바르지 않습니다. 다시 시도해주세요.", false));
  }

  try {
    const redirectUri = getKakaoRedirectUri(req);
    const tokenData = await exchangeKakaoToken({
      grant_type: "authorization_code",
      client_id: KAKAO_REST_API_KEY,
      redirect_uri: redirectUri,
      code: String(code),
    });
    const tokens = loadKakaoTokens();
    tokens[kakaoTeacherKey(grade, room)] = {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresAt: Date.now() + (tokenData.expires_in || 0) * 1000,
      linkedAt: new Date().toISOString(),
    };
    saveKakaoTokens(tokens);
    res.send(closeScript(`${grade} ${room} 담임 선생님 카카오 연동이 완료되었습니다! 이 창은 자동으로 닫힙니다.`, true));
  } catch (err) {
    console.error("카카오 연동 오류:", err);
    res.send(closeScript(`카카오 연동에 실패했습니다: ${err.message}`, false));
  }
});

server.on("error", (err) => console.error("서버 실행 중 오류 발생:", err.message));

server.listen(PORT, HOST, () => {
  console.log("========================================");
  console.log("상벌점 관리 대시보드 서버 실행 완료");
  console.log(`이 컴퓨터에서 접속: http://localhost:${PORT}`);
  console.log("다른 컴퓨터/휴대폰에서 접속 가능한 주소:");
  localIPs.forEach((ip) => console.log(` - http://${ip}:${PORT}`));
  console.log("※ 접속할 기기는 서버를 켠 컴퓨터와 같은 와이파이/네트워크에 있어야 합니다.");
  console.log("※ 학교 와이파이에서 안 열리면 핫스팟/ngrok/Cloudflare Tunnel을 사용하세요.");
  console.log(KAKAO_CONFIGURED ? "카카오톡 API: 설정됨" : "카카오톡 API: 아직 미설정 (.env에 실제 키를 넣어주세요)");
  if (TIER_PASSWORD_IS_TEMP) console.log(`등급 기준 비밀번호: .env에 TIER_PASSWORD가 없어 임시 비밀번호 ${tierPassword} 사용 중`);
  if (ADMIN_NAMES.length === 0) console.log("관리자 이름: .env에 ADMIN_NAMES가 없어 비밀번호 재설정 기능이 꺼져 있습니다.");
  console.log("========================================");
});

process.on("SIGINT", () => process.exit(0));
process.on("SIGTERM", () => process.exit(0));
