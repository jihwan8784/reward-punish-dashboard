const fileInput = document.getElementById("fileInput");
const dropZone = document.getElementById("dropZone");
const uploadBox = document.getElementById("uploadBox");
const uploadStatus = document.getElementById("uploadStatus");
const periodBox = document.getElementById("periodBox");
const periodStartInput = document.getElementById("periodStartInput");
const periodEndInput = document.getElementById("periodEndInput");
const periodApplyBtn = document.getElementById("periodApplyBtn");
const periodResetBtn = document.getElementById("periodResetBtn");
const periodActions = document.getElementById("periodActions");
const periodStatusText = document.getElementById("periodStatusText");
const updatedAt = document.getElementById("updatedAt");
const topMeta = document.getElementById("topMeta");
const studentCount = document.getElementById("studentCount");
const repeatThresholdBadge = document.getElementById("repeatThresholdBadge");
const rankingBody = document.getElementById("rankingBody");
const rankingGradeFilterRow = document.getElementById("rankingGradeFilterRow");
const repeatGradeFilterRow = document.getElementById("repeatGradeFilterRow");
const meritRankingGradeFilterRow = document.getElementById("meritRankingGradeFilterRow");
const classGradeSelect = document.getElementById("classGradeSelect");
const classRoomSelect = document.getElementById("classRoomSelect");
const classStudentBadge = document.getElementById("classStudentBadge");
const classStatusBody = document.getElementById("classStatusBody");
const classSummary = document.getElementById("classSummary");
const classSummaryMerit = document.getElementById("classSummaryMerit");
const classSummaryDemerit = document.getElementById("classSummaryDemerit");
const classSummaryNet = document.getElementById("classSummaryNet");
const kakaoSendBtn = document.getElementById("kakaoSendBtn");
const kakaoSendStatus = document.getElementById("kakaoSendStatus");
const kakaoLinkBadge = document.getElementById("kakaoLinkBadge");
const kakaoLinkBtn = document.getElementById("kakaoLinkBtn");
let classStatusSelection = { grade: null, room: null };
let rankingGradeState = "all";
let repeatGradeState = "all";
let meritRankingGradeState = "all";
const meritStudentCount = document.getElementById("meritStudentCount");
const repeatBody = document.getElementById("repeatBody");
const gradeRankingBody = document.getElementById("gradeRankingBody");
const gradeCountBadge = document.getElementById("gradeCountBadge");
const summaryStudentCount = document.getElementById("summaryStudentCount");
const summaryRepeatThreshold = document.getElementById("summaryRepeatThreshold");
const megaNav = document.getElementById("megaNav");
const calYearSelect = document.getElementById("calYearSelect");
const calMonthSelect = document.getElementById("calMonthSelect");
const calTodayBtn = document.getElementById("calTodayBtn");
const calendarGrid = document.getElementById("calendarGrid");
const calendarSummary = document.getElementById("calendarSummary");
const calendarDesc = document.getElementById("calendarDesc");
const studentSearchInput = document.getElementById("studentSearchInput");
const studentSearchBtn = document.getElementById("studentSearchBtn");
const studentSearchSuggestions = document.getElementById("studentSearchSuggestions");
const studentModalOverlay = document.getElementById("studentModalOverlay");
const studentModalClose = document.getElementById("studentModalClose");
const studentModalBody = document.getElementById("studentModalBody");
const tierPasswordOverlay = document.getElementById("tierPasswordOverlay");
const tierPasswordInput = document.getElementById("tierPasswordInput");
const tierPasswordError = document.getElementById("tierPasswordError");
const tierPasswordSubmit = document.getElementById("tierPasswordSubmit");
const tierPasswordCancel = document.getElementById("tierPasswordCancel");
const tierPasswordClose = document.getElementById("tierPasswordClose");
const tierAdminBtn = document.getElementById("tierAdminBtn");
const downloadBtn = document.getElementById("downloadBtn");
const downloadPanel = document.getElementById("downloadPanel");
const downloadCancelBtn = document.getElementById("downloadCancelBtn");
const downloadConfirmBtn = document.getElementById("downloadConfirmBtn");
const downloadError = document.getElementById("downloadError");
const adminNameOverlay = document.getElementById("adminNameOverlay");
const adminNameInput = document.getElementById("adminNameInput");
const adminNameError = document.getElementById("adminNameError");
const adminNameSubmit = document.getElementById("adminNameSubmit");
const adminNameCancel = document.getElementById("adminNameCancel");
const adminNameClose = document.getElementById("adminNameClose");
const adminSetPasswordOverlay = document.getElementById("adminSetPasswordOverlay");
const adminNewPasswordInput = document.getElementById("adminNewPasswordInput");
const adminNewPasswordConfirm = document.getElementById("adminNewPasswordConfirm");
const adminSetPasswordError = document.getElementById("adminSetPasswordError");
const adminSetPasswordSuccess = document.getElementById("adminSetPasswordSuccess");
const adminSetPasswordSubmit = document.getElementById("adminSetPasswordSubmit");
const adminSetPasswordCancel = document.getElementById("adminSetPasswordCancel");
const adminSetPasswordClose = document.getElementById("adminSetPasswordClose");

const DEFAULT_PAGE_SIZE = 10;
const PAGE_SIZE_OPTIONS = [10, 20, 30, 50, 100];

let latestRenderedData = null;
let latestStudentMetrics = [];
let currentTierFilter = "all";
let thresholds = {
  attentionCount: 2,
  attentionRecent: 2,
  guideCount: 3,
  guideSameItem: 3,
  focusCount: 5,
  focusRecent: 3,
};

const paginationState = {
  ranking: { page: 1, pageSize: DEFAULT_PAGE_SIZE },
  repeat: { page: 1, pageSize: DEFAULT_PAGE_SIZE },
  items: { page: 1, pageSize: DEFAULT_PAGE_SIZE },
  repeatDetail: { page: 1, pageSize: DEFAULT_PAGE_SIZE },
  meritRanking: { page: 1, pageSize: DEFAULT_PAGE_SIZE },
  meritItems: { page: 1, pageSize: DEFAULT_PAGE_SIZE },
};

let calendarState = { year: null, month: null, selectedDate: null };

function $(id) { return document.getElementById(id); }
function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
function setText(id, text) { const el = $(id); if (el) el.textContent = text; }
/* ------------------------------------------------------------------ */
/* 벌점 항목명 축약 라벨 + 호버 툴팁 유틸리티                          */
/* 예: "복장 위반: 교복, 체육복, 운동부 전용 복장 등 미착용 및 혼용    */
/*      착용 (-1)" -> "복장위반(-1)" 로 축약, 마우스 오버 시 원문 표시 */
/* ------------------------------------------------------------------ */
function extractItemScoreSuffix(text) {
  const match = text.match(/[(（]\s*[+-]?\d+\s*[)）]\s*$/);
  if (!match) return "";
  return match[0].replace(/\s+/g, "").replace(/（/g, "(").replace(/）/g, ")");
}
function shortItemLabel(fullText) {
  const text = String(fullText ?? "").trim();
  if (!text) return "-";
  const scoreSuffix = extractItemScoreSuffix(text);
  const base = scoreSuffix ? text.slice(0, text.length - scoreSuffix.length).trim() : text;
  const colonMatch = base.match(/[:：]/);
  let category = colonMatch ? base.slice(0, colonMatch.index) : base;
  category = category.replace(/\s+/g, "");
  if (!category) category = base.replace(/\s+/g, "");
  if (category.length > 12) category = `${category.slice(0, 12)}…`;
  return category + scoreSuffix;
}
function violationLabelHtml(fullText, alignRight = false) {
  const text = String(fullText ?? "").trim();
  if (!text) return "-";
  const label = shortItemLabel(text);
  const cls = alignRight ? "violation-label align-right" : "violation-label";
  return `<span class="${cls}" data-full="${esc(text)}" tabindex="0">${esc(label)}</span>`;
}
function formatScore(value) { return Number(value || 0).toLocaleString("ko-KR"); }
function pct(n, d) { return d > 0 ? Math.round((n / d) * 1000) / 10 : 0; }
function formatDateTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleString("ko-KR");
}
function formatDateOnly(date) {
  if (!date) return "-";
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return "-";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function parseRecordDate(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}
function startOfWeek(date) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const mondayBased = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - mondayBased);
  return d;
}
function daysBetween(a, b) {
  const aa = new Date(a.getFullYear(), a.getMonth(), a.getDate());
  const bb = new Date(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((aa - bb) / 86400000);
}
function getRecords(data) { return Array.isArray(data.records) ? data.records : []; }

/* ------------------------------------------------------------------ */
/* 기간 선택 필터                                                       */
/* 서버에서 받은 원본 데이터(rawFullData)는 그대로 보관하고,             */
/* 화면에는 선택된 기간으로 다시 집계한 데이터를 렌더링한다.              */
/* ------------------------------------------------------------------ */
let rawFullData = {};
let periodFilter = { start: null, end: null }; // Date(자정 기준) | null

function hasActivePeriodFilter() {
  return !!(periodFilter.start || periodFilter.end);
}

// 서버(server.cjs)의 processExcel 집계 로직과 동일한 방식으로,
// (필터링된) records 배열로부터 ranking/gradeRanking/repeatOffenders 등을 다시 계산한다.
function computeAggregatesFromRecords(records, repeatThreshold, columnInfo, updatedAt) {
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
    const points = Number(record.points || 0);
    if (record.type === "merit") { student.totalReward += points; student.rewardCount += 1; }
    else { student.totalPenalty += points; student.penaltyCount += 1; }
    if (!student.recentReason) {
      student.recentReason = record.reason || record.item || "";
      student.recentDate = record.date || "";
    }
  });

  const students = Object.values(studentsMap).map((s) => ({ ...s, netScore: s.totalReward - s.totalPenalty }));

  const ranking = students
    .slice()
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
    updatedAt: updatedAt || null,
    totalStudents: students.length,
    totalRows: records.length,
    totalMeritCount: records.filter((r) => r.type === "merit").length,
    totalDemeritCount: records.filter((r) => r.type === "demerit").length,
    ranking,
    gradeRanking,
    topGrade: gradeRanking.length > 0 ? gradeRanking[0] : null,
    repeatOffenders,
    repeatThreshold,
    records,
    columnInfo: columnInfo || null,
  };
}

function isRecordWithinPeriod(dateIso) {
  if (!hasActivePeriodFilter()) return true;
  const d = parseRecordDate(dateIso);
  // 날짜 정보가 없는 기록은 특정 기간에 속하는지 판단할 수 없으므로,
  // 기간이 선택되어 있는 동안에는 집계에서 제외한다.
  if (!d) return false;
  const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  if (periodFilter.start && dayStart < periodFilter.start) return false;
  if (periodFilter.end && dayStart > periodFilter.end) return false;
  return true;
}

// 기간 필터가 적용된, 화면에 그릴 최종 데이터를 만든다.
function getPeriodFilteredData() {
  const base = rawFullData || {};
  if (!hasActivePeriodFilter()) return base;
  const records = getRecords(base).filter((r) => isRecordWithinPeriod(r.date));
  return computeAggregatesFromRecords(records, base.repeatThreshold || 3, base.columnInfo, base.updatedAt);
}

function updatePeriodStatusText() {
  if (!periodStatusText) return;
  if (periodBox) periodBox.classList.toggle("active", hasActivePeriodFilter());
  periodStatusText.hidden = true;
  periodStatusText.textContent = "";
}

// 새로운 원본 데이터를 받았을 때 호출: 저장 후 현재 선택된 기간으로 다시 렌더링한다.
function setRawData(data) {
  rawFullData = data || {};
  refreshWithPeriod();
}

function refreshWithPeriod() {
  render(getPeriodFilteredData());
}

function getRefDate(records) {
  const times = records.map((r) => parseRecordDate(r.date)).filter(Boolean).map((d) => d.getTime());
  return times.length ? new Date(Math.max(...times)) : null;
}
function setRows(tbodyId, rows, colspan, emptyMessage = "표시할 데이터가 없습니다.") {
  const tbody = $(tbodyId);
  if (!tbody) return;
  tbody.innerHTML = rows && rows.length ? rows.join("") : `<tr><td colspan="${colspan}" class="empty-row">${emptyMessage}</td></tr>`;
}
function groupList(list, keyFn) {
  const map = new Map();
  list.forEach((item) => {
    const key = keyFn(item);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(item);
  });
  return map;
}

function getPageData(items, key) {
  const list = Array.isArray(items) ? items : [];
  const state = paginationState[key];
  const totalPages = Math.max(1, Math.ceil(list.length / state.pageSize));
  state.page = Math.min(Math.max(state.page, 1), totalPages);
  const start = (state.page - 1) * state.pageSize;
  const end = start + state.pageSize;
  return {
    items: list.slice(start, end),
    totalItems: list.length,
    totalPages,
    currentPage: state.page,
    pageSize: state.pageSize,
    startIndex: list.length === 0 ? 0 : start + 1,
    endIndex: Math.min(end, list.length),
  };
}
function createPageSizeOptions(selectedSize) {
  return PAGE_SIZE_OPTIONS.map((size) => `<option value="${size}" ${Number(selectedSize) === size ? "selected" : ""}>${size}개</option>`).join("");
}
function buildPageNumbers(currentPage, totalPages) {
  const pages = [];
  const add = (value) => { if (!pages.includes(value)) pages.push(value); };
  add(1);
  for (let page = currentPage - 2; page <= currentPage + 2; page += 1) if (page > 1 && page < totalPages) add(page);
  if (totalPages > 1) add(totalPages);
  return pages.sort((a, b) => a - b);
}
function renderPageSizeControl(key, pageInfo, label) {
  const container = $(`${key}PageSize`);
  if (!container) return;
  if (pageInfo.totalItems === 0) { container.innerHTML = ""; return; }
  container.innerHTML = `
    <label class="page-size-label">한 페이지
      <select class="page-size-select" data-list="${key}" aria-label="${label} 한 페이지 표시 개수 선택">${createPageSizeOptions(pageInfo.pageSize)}</select>
    </label>
    <span class="page-info">${formatScore(pageInfo.startIndex)}-${formatScore(pageInfo.endIndex)} / ${formatScore(pageInfo.totalItems)}개 표시</span>`;
}
function renderPagination(key, pageInfo, label) {
  const container = $(`${key}Pagination`);
  if (!container) return;
  if (pageInfo.totalItems === 0) { container.innerHTML = ""; return; }
  let prev = 0;
  const numbers = buildPageNumbers(pageInfo.currentPage, pageInfo.totalPages).map((page) => {
    const gap = page - prev > 1 ? '<span class="page-gap">...</span>' : "";
    prev = page;
    return `${gap}<button type="button" class="page-number ${page === pageInfo.currentPage ? "active" : ""}" data-page="${page}">${page}</button>`;
  }).join("");
  container.innerHTML = `
    <div class="pagination-right" aria-label="${label} 페이지 이동">
      <button type="button" class="page-button" data-page="prev" ${pageInfo.currentPage === 1 ? "disabled" : ""}>이전</button>
      ${numbers}
      <button type="button" class="page-button" data-page="next" ${pageInfo.currentPage === pageInfo.totalPages ? "disabled" : ""}>다음</button>
    </div>`;
}
function resetPages() {
  Object.keys(paginationState).forEach((key) => { paginationState[key].page = 1; });
  calendarState = { year: null, month: null, selectedDate: null };
  rankingGradeState = "all";
  repeatGradeState = "all";
  meritRankingGradeState = "all";
}

/* ------------------------------------------------------------------ */
/* 표 ↔ 그래프 전환 — SVG로 직접 막대그래프를 그린다.                    */
/* (canvas + Chart.js 대신 SVG를 쓰면 컨테이너가 숨겨진 상태에서 그려도  */
/*  크기가 0으로 잘못 계산되는 문제 자체가 생기지 않는다.)              */
/* ------------------------------------------------------------------ */
const SEABORN = { blue: "#4c72b0", red: "#c44e52", green: "#55a868", orange: "#dd8452", gray: "#8c8c8c" };

function svgChartEmptyState(container) {
  if (!container) return;
  container.innerHTML = '<div class="chart-empty">표시할 데이터가 없습니다. 엑셀 파일을 업로드해 주세요.</div>';
}

// 세로 그룹 막대그래프. categories: string[], series: [{ label, color, values: number[] }]
function drawGroupedBarChart(container, categories, series) {
  if (!container) return;
  if (!categories.length || !series.some((s) => s.values.some((v) => v > 0))) {
    svgChartEmptyState(container);
    return;
  }
  const width = 640;
  const height = 210;
  const pad = { top: 22, right: 16, bottom: 32, left: 46 };
  const chartW = width - pad.left - pad.right;
  const chartH = height - pad.top - pad.bottom;
  const maxV = Math.max(1, ...series.flatMap((s) => s.values));
  const groupW = chartW / categories.length;
  const barGap = 6;
  const barW = Math.max(6, (groupW - barGap * (series.length + 1)) / series.length);

  let bars = "";
  categories.forEach((cat, ci) => {
    const groupX = pad.left + ci * groupW;
    series.forEach((s, si) => {
      const v = s.values[ci] || 0;
      const barH = (v / maxV) * chartH;
      const bx = groupX + barGap + si * (barW + barGap);
      const by = pad.top + chartH - barH;
      bars += `<rect class="bar" x="${bx.toFixed(1)}" y="${by.toFixed(1)}" width="${barW.toFixed(1)}" height="${barH.toFixed(1)}" rx="3" fill="${s.color}"><title>${esc(cat)} ${esc(s.label)}: ${formatScore(v)}</title></rect>`;
      if (v > 0) bars += `<text class="bar-value" x="${(bx + barW / 2).toFixed(1)}" y="${(by - 5).toFixed(1)}" text-anchor="middle">${formatScore(v)}</text>`;
    });
    bars += `<text class="x-tick" x="${(groupX + groupW / 2).toFixed(1)}" y="${(height - pad.bottom + 18).toFixed(1)}" text-anchor="middle">${esc(cat)}</text>`;
  });

  let grid = "";
  const yTicks = 4;
  for (let i = 0; i <= yTicks; i += 1) {
    const v = (maxV / yTicks) * i;
    const gy = pad.top + chartH - (v / maxV) * chartH;
    grid += `<line class="grid-line" x1="${pad.left}" y1="${gy.toFixed(1)}" x2="${width - pad.right}" y2="${gy.toFixed(1)}" />`;
    grid += `<text class="y-tick" x="${pad.left - 8}" y="${(gy + 4).toFixed(1)}" text-anchor="end">${formatScore(Math.round(v))}</text>`;
  }

  const legend = series.map((s) => `<span class="legend-item"><span class="legend-dot" style="background:${s.color}"></span>${esc(s.label)}</span>`).join("");

  container.innerHTML = `
    <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="막대그래프" preserveAspectRatio="xMidYMid meet">
      ${grid}
      ${bars}
    </svg>
    <div class="chart-legend">${legend}</div>`;
}

// 가로 막대그래프. items: [{ label, value, color }]
const PIE_PALETTE = ["#4c72b0", "#c44e52", "#55a868", "#dd8452", "#8172b2", "#937860", "#da8bc3", "#8c8c8c", "#ccb974", "#64b5cd"];
const PIE_MAX_LABELS = 4;

function polarToCartesian(cx, cy, r, angleDeg) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describePieSlice(cx, cy, r, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  return `M ${cx} ${cy} L ${start.x.toFixed(2)} ${start.y.toFixed(2)} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x.toFixed(2)} ${end.y.toFixed(2)} Z`;
}

// items: [{ label, value, type }] - 원 그래프로 비율을 보여준다.
// 비중이 큰 조각 위에는 항목 이름 + 비율을 직접 표시하고, 나머지는 마우스 오버(제목 툴팁)로 확인한다.
function drawPieChart(container, items) {
  if (!container) return;
  const total = items.reduce((sum, i) => sum + i.value, 0);
  if (!items.length || total <= 0) { svgChartEmptyState(container); return; }

  const size = 260;
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 6;
  const labelR = r * 0.62;
  let angle = 0;
  const slices = items.map((item, idx) => {
    const pct = (item.value / total) * 100;
    const sweep = (item.value / total) * 360;
    const midAngle = angle + sweep / 2;
    const path = sweep >= 359.999
      ? `M ${cx - r} ${cy} A ${r} ${r} 0 1 0 ${cx + r} ${cy} A ${r} ${r} 0 1 0 ${cx - r} ${cy} Z`
      : describePieSlice(cx, cy, r, angle, angle + sweep);
    const labelPos = polarToCartesian(cx, cy, labelR, midAngle);
    angle += sweep;
    return { ...item, pct, path, labelPos, color: PIE_PALETTE[idx % PIE_PALETTE.length] };
  });

  const paths = slices.map((s) => `<path class="pie-slice" d="${s.path}" fill="${s.color}"><title>${esc(s.label)} (${s.type === "merit" ? "상점" : "벌점"}): ${formatScore(s.value)}건 · ${s.pct.toFixed(1)}%</title></path>`).join("");

  const topLabelSlices = new Set([...slices].sort((a, b) => b.pct - a.pct).slice(0, PIE_MAX_LABELS));
  const labels = slices.filter((s) => topLabelSlices.has(s)).map((s) => `
    <text class="pie-label-name" x="${s.labelPos.x.toFixed(1)}" y="${(s.labelPos.y - 5).toFixed(1)}" text-anchor="middle">${esc(shortItemLabel(s.label))}</text>
    <text class="pie-label-pct" x="${s.labelPos.x.toFixed(1)}" y="${(s.labelPos.y + 11).toFixed(1)}" text-anchor="middle">${s.pct.toFixed(0)}%</text>`).join("");

  const hasHiddenLabels = slices.length > topLabelSlices.size;

  container.innerHTML = `
    <svg viewBox="0 0 ${size} ${size}" class="pie-svg" role="img" aria-label="원 그래프">
      ${paths}
      ${labels}
    </svg>
    ${hasHiddenLabels ? '<div class="chart-note">비중이 작은 항목은 라벨 없이 표시됩니다. 조각에 마우스를 올리거나 "표"에서 정확한 수치를 확인하세요.</div>' : ""}`;
}

// groups: [{ title, slices: [{ label, value, type }] }] - 그룹마다 작은 원 그래프를 하나씩 나란히 그린다.
function drawMultiPieChart(container, groups) {
  if (!container) return;
  if (!groups.length) { svgChartEmptyState(container); return; }

  const size = 108;
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 3;

  const cards = groups.map((g) => {
    const total = g.slices.reduce((sum, s) => sum + s.value, 0);
    if (total <= 0) {
      return `<div class="mini-pie"><div class="mini-pie-title">${esc(g.title)}</div><div class="chart-empty small">데이터 없음</div></div>`;
    }
    let angle = 0;
    const slices = g.slices.map((s) => {
      const pct = (s.value / total) * 100;
      const sweep = (s.value / total) * 360;
      const path = sweep >= 359.999
        ? `M ${cx - r} ${cy} A ${r} ${r} 0 1 0 ${cx + r} ${cy} A ${r} ${r} 0 1 0 ${cx - r} ${cy} Z`
        : describePieSlice(cx, cy, r, angle, angle + sweep);
      angle += sweep;
      const color = s.type === "merit" ? SEABORN.blue : SEABORN.red;
      return { ...s, pct, path, color };
    });
    const paths = slices.map((s) => `<path class="pie-slice" d="${s.path}" fill="${s.color}"><title>${esc(g.title)} ${esc(s.label)}: ${formatScore(s.value)}건 · ${s.pct.toFixed(1)}%</title></path>`).join("");
    const legend = slices.map((s) => {
      const full = `${g.title} ${s.label}: ${formatScore(s.value)}건 · ${s.pct.toFixed(1)}%`;
      return `<div class="pie-legend-item"><span class="legend-dot" style="background:${s.color}"></span><span class="violation-label" data-full="${esc(full)}" tabindex="0">${esc(s.label)} ${s.pct.toFixed(0)}%</span></div>`;
    }).join("");
    return `
      <div class="mini-pie">
        <div class="mini-pie-title">${esc(g.title)}</div>
        <svg viewBox="0 0 ${size} ${size}" class="pie-svg mini" role="img" aria-label="${esc(g.title)} 원 그래프">${paths}</svg>
        <div class="pie-legend small">${legend}</div>
      </div>`;
  }).join("");

  container.innerHTML = `<div class="mini-pie-grid">${cards}</div>`;
}

const chartDataCache = {};
const activeViewMode = {};

function setChartData(key, rows) {
  chartDataCache[key] = rows;
  if (activeViewMode[key] === "chart") renderChartForKey(key);
}

function renderChartForKey(key) {
  const rows = chartDataCache[key];
  const container = $(`${key}Chart`);
  if (!rows || rows.length === 0) { svgChartEmptyState(container); return; }
  if (key === "gradeRanking") {
    drawGroupedBarChart(container, rows.map((g) => g.gradeName), [
      { label: "벌점", color: SEABORN.red, values: rows.map((g) => g.totalPenalty) },
      { label: "상점", color: SEABORN.blue, values: rows.map((g) => g.totalReward) },
    ]);
  } else if (key === "gradeStatus") {
    drawGroupedBarChart(container, rows.map((g) => g.grade), [
      { label: "벌점", color: SEABORN.red, values: rows.map((g) => g.demerit) },
      { label: "상점", color: SEABORN.blue, values: rows.map((g) => g.merit) },
    ]);
  } else if (key === "itemStatus") {
    drawPieChart(container, rows.map((i) => ({ label: i.item, value: i.count, type: i.type })));
  } else if (key === "meritBalance") {
    const groups = rows.map((g) => ({
      title: g.grade,
      slices: [
        { label: "상점", value: g.merit, type: "merit" },
        { label: "벌점", value: g.demerit, type: "demerit" },
      ],
    }));
    drawMultiPieChart(container, groups);
  } else if (key === "meritItemStatus") {
    drawPieChart(container, rows.map((i) => ({ label: i.item, value: i.count, type: "merit" })));
  }
}

// 그래프 토글이 있는 항목별 표 중, 페이지네이션과 짝지어진 것들의 매핑
// (그래프 모드에서는 페이지네이션이 의미가 없으므로 같이 숨긴다.)
const TOGGLE_PAGINATION_KEY = { itemStatus: "items", meritItemStatus: "meritItems" };

document.querySelectorAll(".view-toggle[data-toggle]").forEach((toggle) => {
  const key = toggle.dataset.toggle;
  activeViewMode[key] = "table";
  toggle.addEventListener("click", (e) => {
    const btn = e.target.closest(".toggle-btn");
    if (!btn) return;
    const mode = btn.dataset.mode;
    if (mode === activeViewMode[key]) return;
    activeViewMode[key] = mode;
    toggle.querySelectorAll(".toggle-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    const tableWrap = $(`${key}TableWrap`);
    const chartWrap = $(`${key}ChartWrap`);
    if (tableWrap) tableWrap.hidden = mode !== "table";
    if (chartWrap) chartWrap.hidden = mode !== "chart";
    const pagePrefix = TOGGLE_PAGINATION_KEY[key];
    if (pagePrefix) {
      const pageSizeRow = $(`${pagePrefix}PageSize`);
      const paginationRow = $(`${pagePrefix}Pagination`);
      if (pageSizeRow) pageSizeRow.hidden = mode !== "table";
      if (paginationRow) paginationRow.hidden = mode !== "table";
    }
    if (mode === "chart") renderChartForKey(key);
  });
});

function renderSummary(data) {
  const totalStudents = data.totalStudents || 0;
  const threshold = data.repeatThreshold || 3;
  summaryStudentCount.textContent = `${formatScore(totalStudents)}명`;
  summaryRepeatThreshold.textContent = `${threshold}회 이상`;
}

function renderGradeRanking(data) {
  const gradeRanking = data.gradeRanking || [];
  gradeCountBadge.textContent = `학년 ${gradeRanking.length}개`;
  setRows("gradeRankingBody", gradeRanking.map((g) => `
    <tr class="${g.rank === 1 ? "top-row" : ""}">
      <td class="rank-cell">${g.rank}</td><td><strong>${esc(g.gradeName || "-")}</strong></td><td>${formatScore(g.studentCount)}명</td>
      <td class="penalty">${formatScore(g.totalPenalty)}</td><td>${formatScore(g.averagePenalty)}</td><td>${formatScore(g.penaltyCount)}회</td>
      <td class="reward">${formatScore(g.totalReward)}</td><td>${formatScore(g.netScore)}</td>
    </tr>`), 8, "데이터가 없습니다. 파일을 업로드해주세요.");
  setChartData("gradeRanking", gradeRanking.slice().sort((a, b) => (a.gradeName || "").localeCompare(b.gradeName || "", "ko")));
}

function getStudentMetrics(data) {
  const records = getRecords(data);
  const refDate = getRefDate(records);
  const map = new Map();
  function ensure(id, base = {}) {
    const key = id || base.name || "미상";
    if (!map.has(key)) {
      map.set(key, {
        id: id || base.id || "-", name: base.name || "-", gradeName: base.gradeName || "미분류", className: base.className || "-",
        totalReward: 0, totalPenalty: 0, rewardCount: 0, penaltyCount: 0, netScore: 0,
        itemCounts: {}, lastPenaltyDate: null, recent7: 0, recent14: 0,
      });
    }
    return map.get(key);
  }
  records.forEach((r) => {
    const s = ensure(r.id, r);
    s.name = r.name || s.name;
    s.gradeName = r.gradeName || s.gradeName;
    s.className = r.className || s.className;
    const points = Number(r.points || 0);
    if (r.type === "merit") { s.totalReward += points; s.rewardCount += 1; }
    else {
      s.totalPenalty += points;
      s.penaltyCount += 1;
      const item = r.item || "기타";
      s.itemCounts[item] = (s.itemCounts[item] || 0) + 1;
      const d = parseRecordDate(r.date);
      if (d) {
        if (!s.lastPenaltyDate || d > s.lastPenaltyDate) s.lastPenaltyDate = d;
        if (refDate) {
          const diff = daysBetween(refDate, d);
          if (diff >= 0 && diff <= 6) s.recent7 += 1;
          if (diff >= 0 && diff <= 13) s.recent14 += 1;
        }
      }
    }
  });
  (data.ranking || []).forEach((r) => {
    if (map.has(r.id)) return;
    const s = ensure(r.id, r);
    s.totalReward = r.totalReward || 0;
    s.totalPenalty = r.totalPenalty || 0;
    s.rewardCount = r.rewardCount || 0;
    s.penaltyCount = r.penaltyCount || 0;
  });
  return Array.from(map.values()).map((s) => {
    const top = Object.entries(s.itemCounts).sort((a, b) => b[1] - a[1])[0] || ["-", 0];
    s.topItem = top[0];
    s.topItemCount = top[1];
    s.netScore = s.totalReward - s.totalPenalty;
    if (s.penaltyCount >= thresholds.focusCount || s.recent14 >= thresholds.focusRecent) s.tier = "집중지도";
    else if (s.penaltyCount >= thresholds.guideCount || s.topItemCount >= thresholds.guideSameItem) s.tier = "지도필요";
    else if (s.penaltyCount >= thresholds.attentionCount || s.recent14 >= thresholds.attentionRecent) s.tier = "관심";
    else s.tier = "정상";
    return s;
  });
}

function getRepeatList(data) {
  return getStudentMetrics(data)
    .filter((s) => s.penaltyCount >= (data.repeatThreshold || 3) || s.tier !== "정상")
    .sort((a, b) => b.penaltyCount - a.penaltyCount || b.totalPenalty - a.totalPenalty || a.name.localeCompare(b.name, "ko"));
}

function findStudentRecords(data, student) {
  const records = getRecords(data);
  const hasId = student.id && student.id !== "-";
  return records
    .filter((r) => (hasId ? r.id === student.id : r.name === student.name))
    .slice()
    .sort((a, b) => {
      const da = parseRecordDate(a.date);
      const db = parseRecordDate(b.date);
      if (da && db) return db - da;
      if (da) return -1;
      if (db) return 1;
      return 0;
    });
}

function renderStudentSearchSuggestions(query) {
  if (!studentSearchSuggestions) return;
  const q = query.trim();
  if (!q) {
    studentSearchSuggestions.classList.remove("open");
    studentSearchSuggestions.innerHTML = "";
    studentSearchSuggestions._matches = [];
    return;
  }
  const matches = latestStudentMetrics.filter((s) => (s.name || "").includes(q) || (s.id || "").includes(q)).slice(0, 8);
  studentSearchSuggestions._matches = matches;
  if (!matches.length) {
    studentSearchSuggestions.innerHTML = `<div class="topbar-search-empty">일치하는 학생이 없습니다.</div>`;
  } else {
    studentSearchSuggestions.innerHTML = matches.map((s, idx) => `
      <button type="button" data-idx="${idx}">
        <span>${esc(s.name || "-")} <span class="suggestion-meta">${esc(s.gradeName || "-")} · ${esc(s.id || "-")}</span></span>
        <span class="suggestion-meta">벌점 ${formatScore(s.totalPenalty)}</span>
      </button>`).join("");
  }
  studentSearchSuggestions.classList.add("open");
}

function openStudentModal(student) {
  if (!studentModalOverlay || !studentModalBody || !latestRenderedData || !student) return;
  const records = findStudentRecords(latestRenderedData, student).slice(0, 15);
  const recordRows = records.map((r) => `
    <tr><td>${formatDateOnly(parseRecordDate(r.date))}</td><td>${violationLabelHtml(r.item || "기타", true)}</td>
    <td class="${r.type === "merit" ? "reward" : "penalty"}">${r.type === "merit" ? "상점" : "벌점"}</td><td>${formatScore(r.points)}</td></tr>`).join("");
  studentModalBody.innerHTML = `
    <h3 class="student-modal-name" id="studentModalName">${esc(student.name || "-")}</h3>
    <p class="student-modal-sub">${esc(student.gradeName || "-")} · 학번 ${esc(student.id || "-")}</p>
    <div class="student-modal-tier"><span class="tier-badge tier-${esc(student.tier)}">${esc(student.tier)}</span></div>
    <div class="student-modal-kpis">
      <article class="kpi-card penalty-kpi"><span>벌점 합계</span><strong>${formatScore(student.totalPenalty)}</strong></article>
      <article class="kpi-card reward-kpi"><span>상점 합계</span><strong>${formatScore(student.totalReward)}</strong></article>
      <article class="kpi-card"><span>순점수</span><strong>${formatScore(student.netScore)}</strong></article>
      <article class="kpi-card"><span>벌점 횟수</span><strong>${formatScore(student.penaltyCount)}회</strong></article>
    </div>
    <div class="student-modal-section">
      <h4>최다 위반 항목</h4>
      <p>${violationLabelHtml(student.topItem || "-")} (${formatScore(student.topItemCount || 0)}건) · 최근7일 ${formatScore(student.recent7 || 0)}건 · 최근14일 ${formatScore(student.recent14 || 0)}건</p>
    </div>
    <div class="student-modal-section">
      <h4>최근 상벌점 내역</h4>
      <div class="table-scroll"><table class="data-table compact-table">
        <thead><tr><th>날짜</th><th>항목</th><th>구분</th><th>점수</th></tr></thead>
        <tbody>${recordRows || '<tr><td colspan="4" class="empty-row">내역이 없습니다.</td></tr>'}</tbody>
      </table></div>
    </div>`;
  studentModalOverlay.classList.add("open");
}

function closeStudentModal() {
  if (studentModalOverlay) studentModalOverlay.classList.remove("open");
}

function buildGradeButtons(row, grades, currentValue) {
  if (!row) return currentValue;
  const value = grades.includes(currentValue) ? currentValue : "all";
  const buttons = ['<button class="filter-btn' + (value === "all" ? " active" : "") + '" data-grade="all">전체</button>'].concat(
    grades.map((g) => `<button class="filter-btn${value === g ? " active" : ""}" data-grade="${esc(g)}">${esc(g)}</button>`)
  );
  row.innerHTML = buttons.join("");
  return value;
}

function populateRankingGradeFilter(data) {
  const grades = (data.gradeRanking || [])
    .map((g) => g.gradeName)
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b, "ko"));
  rankingGradeState = buildGradeButtons(rankingGradeFilterRow, grades, rankingGradeState);
}

function populateRepeatGradeFilter(data) {
  const grades = (data.gradeRanking || [])
    .map((g) => g.gradeName)
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b, "ko"));
  repeatGradeState = buildGradeButtons(repeatGradeFilterRow, grades, repeatGradeState);
}

function populateMeritRankingGradeFilter(data) {
  const grades = (data.gradeRanking || [])
    .map((g) => g.gradeName)
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b, "ko"));
  meritRankingGradeState = buildGradeButtons(meritRankingGradeFilterRow, grades, meritRankingGradeState);
}

function renderMeritRanking(data) {
  if (!meritStudentCount) return;
  const fullRanking = (data.ranking || []).slice().sort((a, b) => b.totalReward - a.totalReward || a.name.localeCompare(b.name, "ko"));
  const gradeFilter = meritRankingGradeState;
  let ranking = gradeFilter === "all" ? fullRanking : fullRanking.filter((s) => s.gradeName === gradeFilter);
  ranking = ranking.map((s, idx) => ({ ...s, rank: idx + 1 }));
  const pageInfo = getPageData(ranking, "meritRanking");
  meritStudentCount.textContent = `학생 ${formatScore(ranking.length)}명`;
  setRows("meritRankingBody", pageInfo.items.map((s) => `
    <tr><td class="rank-cell">${s.rank}</td><td>${esc(s.name || "-")}</td><td>${esc(s.id || "-")}</td>
    <td class="reward">${formatScore(s.totalReward)}</td><td class="penalty">${formatScore(s.totalPenalty)}</td><td>${formatScore(s.netScore)}</td></tr>`), 6, "데이터가 없습니다. 파일을 업로드해주세요.");
  renderPageSizeControl("meritRanking", pageInfo, "상점 순위");
  renderPagination("meritRanking", pageInfo, "상점 순위");
}

function renderRanking(data) {
  const fullRanking = data.ranking || [];
  const gradeFilter = rankingGradeState;
  let ranking = gradeFilter === "all" ? fullRanking : fullRanking.filter((s) => s.gradeName === gradeFilter);
  if (gradeFilter !== "all") ranking = ranking.map((s, idx) => ({ ...s, rank: idx + 1 }));
  const pageInfo = getPageData(ranking, "ranking");
  studentCount.textContent = `학생 ${formatScore(ranking.length)}명`;
  setRows("rankingBody", pageInfo.items.map((s) => `
    <tr><td class="rank-cell">${s.rank}</td><td>${esc(s.name || "-")}</td><td>${esc(s.id || "-")}</td>
    <td class="penalty">${formatScore(s.totalPenalty)}</td><td class="reward">${formatScore(s.totalReward)}</td><td>${formatScore(s.netScore)}</td></tr>`), 6, "데이터가 없습니다. 파일을 업로드해주세요.");
  renderPageSizeControl("ranking", pageInfo, "벌점 랭킹");
  renderPagination("ranking", pageInfo, "벌점 랭킹");
}

function renderRepeatOffenders(data) {
  const fullList = getRepeatList(data);
  const gradeFilter = repeatGradeState;
  const repeatList = gradeFilter === "all" ? fullList : fullList.filter((s) => s.gradeName === gradeFilter);
  const pageInfo = getPageData(repeatList, "repeat");
  repeatThresholdBadge.textContent = `기준: ${data.repeatThreshold || 3}회 이상`;
  setRows("repeatBody", pageInfo.items.map((s, idx) => `
    <tr class="warning-row"><td class="rank-cell">${pageInfo.startIndex + idx}</td><td>${esc(s.name || "-")}</td><td>${esc(s.id || "-")}</td>
    <td>${formatScore(s.penaltyCount)}회</td><td class="penalty">${formatScore(s.totalPenalty)}</td><td><span class="tier-badge tier-${s.tier}">${s.tier}</span></td></tr>`), 6, "반복 벌점 학생이 없습니다.");
  renderPageSizeControl("repeat", pageInfo, "반복 벌점 학생");
  renderPagination("repeat", pageInfo, "반복 벌점 학생");
}

function renderOverviewStats(data) {
  const records = getRecords(data);
  const merit = records.filter((r) => r.type === "merit");
  const demerit = records.filter((r) => r.type === "demerit");
  const rewardSum = merit.reduce((sum, r) => sum + Number(r.points || 0), 0);
  const penaltySum = demerit.reduce((sum, r) => sum + Number(r.points || 0), 0);
  const ref = getRefDate(records);
  setText("kpiTotal", formatScore(records.length || data.totalRows || 0));
  setText("kpiMerit", formatScore(merit.length));
  setText("kpiDemerit", formatScore(demerit.length));
  setText("kpiDemeritRatio", `${pct(demerit.length, records.length)}%`);
  setText("kpiMeritRatio", `${pct(merit.length, records.length)}%`);
  setText("kpiNet", formatScore(rewardSum - penaltySum));
  setText("refDateBadge", ref ? `기준일 ${formatDateOnly(ref)}` : "기준일 미설정");
  topMeta.textContent = ref ? `기준일: ${formatDateOnly(ref)}` : "데이터를 업로드해 주세요";
}

function renderGradeAndItemStats(data) {
  const records = getRecords(data);
  const gradeMap = new Map();
  records.forEach((r) => {
    const key = r.gradeName || "미분류";
    if (!gradeMap.has(key)) gradeMap.set(key, { grade: key, merit: 0, demerit: 0, total: 0 });
    const g = gradeMap.get(key);
    if (r.type === "merit") g.merit += 1;
    else g.demerit += 1;
    g.total += 1;
  });
  const grades = Array.from(gradeMap.values()).sort((a, b) => a.grade.localeCompare(b.grade, "ko"));
  setRows("gradeTableBody", grades.map((g) => `<tr><td>${esc(g.grade)}</td><td class="reward">${g.merit}</td><td class="penalty">${g.demerit}</td><td>${g.total}</td></tr>`), 4);
  setChartData("gradeStatus", grades);
  const itemMap = new Map();
  records.filter((r) => r.type !== "merit").forEach((r) => {
    const key = r.item || "기타";
    if (!itemMap.has(key)) itemMap.set(key, { item: key, type: "demerit", count: 0 });
    itemMap.get(key).count += 1;
  });
  const allItems = Array.from(itemMap.values()).sort((a, b) => b.count - a.count);
  const itemPageInfo = getPageData(allItems, "items");
  const demeritTotal = records.filter((r) => r.type !== "merit").length;
  setRows("itemTableBody", itemPageInfo.items.map((i) => `<tr><td>${violationLabelHtml(i.item)}</td><td>${i.count}</td><td>${pct(i.count, demeritTotal)}%</td></tr>`), 3);
  renderPageSizeControl("items", itemPageInfo, "벌점 항목별 현황");
  renderPagination("items", itemPageInfo, "벌점 항목별 현황");
  setChartData("itemStatus", allItems.slice(0, 10));
}

function buildDayMap(records) {
  const map = new Map();
  records.forEach((r) => {
    const d = parseRecordDate(r.date);
    if (!d) return;
    const key = formatDateOnly(d);
    if (!map.has(key)) map.set(key, { merit: 0, demerit: 0, records: [] });
    const entry = map.get(key);
    if (r.type === "merit") entry.merit += 1;
    else entry.demerit += 1;
    entry.records.push(r);
  });
  return map;
}

function renderCalendarSummary(dayMap, monthStats) {
  if (!calendarSummary) return;
  if (calendarState.selectedDate && dayMap.has(calendarState.selectedDate)) {
    const entry = dayMap.get(calendarState.selectedDate);
    const rows = entry.records
      .slice()
      .sort((a, b) => (a.type === b.type ? 0 : a.type === "merit" ? -1 : 1))
      .map((r) => `<li>${esc(r.name || "-")} · ${violationLabelHtml(r.item || "기타")} (${r.type === "merit" ? "상점" : "벌점"} ${formatScore(r.points)}점)</li>`)
      .join("");
    calendarSummary.innerHTML = `<strong>${esc(calendarState.selectedDate)} 상세 내역</strong><ul>${rows || "<li>내역이 없습니다.</li>"}</ul>`;
    return;
  }
  if (!monthStats.daysWithData) {
    calendarSummary.innerHTML = "이 달에는 데이터가 없습니다.";
    return;
  }
  const topItem = Array.from(monthStats.itemMap.entries()).sort((a, b) => b[1] - a[1])[0];
  calendarSummary.innerHTML = `이번 달 상점 <strong class="reward">${monthStats.merit}</strong>건, 벌점 <strong class="penalty">${monthStats.demerit}</strong>건 (데이터 있는 날 ${monthStats.daysWithData}일)` +
    (topItem ? `<ul><li>최다 벌점 항목: ${violationLabelHtml(topItem[0])} (${topItem[1]}건)</li></ul>` : "");
}

function renderCalendar(data) {
  if (!calendarGrid || !calYearSelect || !calMonthSelect) return;
  const records = getRecords(data);
  const refDate = getRefDate(records);
  const dayMap = buildDayMap(records);

  if (calendarState.year === null || calendarState.month === null) {
    const base = refDate || new Date();
    calendarState.year = base.getFullYear();
    calendarState.month = base.getMonth();
  }

  const hasDateColumn = !data.columnInfo || !!data.columnInfo.date;
  if (calendarDesc) {
    calendarDesc.textContent = (!hasDateColumn || dayMap.size === 0)
      ? "날짜 컬럼이 필요합니다."
      : "데이터가 있는 날짜를 클릭하면 상세 내역을 확인할 수 있습니다.";
  }

  const dataYears = Array.from(dayMap.keys()).map((k) => Number(k.slice(0, 4))).filter((y) => !Number.isNaN(y));
  const baseYear = refDate ? refDate.getFullYear() : new Date().getFullYear();
  const minYear = Math.min(baseYear - 2, ...(dataYears.length ? dataYears : [baseYear]));
  const maxYear = Math.max(baseYear + 2, ...(dataYears.length ? dataYears : [baseYear]));
  if (calYearSelect.dataset.minYear !== String(minYear) || calYearSelect.dataset.maxYear !== String(maxYear)) {
    const yearOptions = [];
    for (let y = maxYear; y >= minYear; y -= 1) yearOptions.push(`<option value="${y}">${y}년</option>`);
    calYearSelect.innerHTML = yearOptions.join("");
    calYearSelect.dataset.minYear = String(minYear);
    calYearSelect.dataset.maxYear = String(maxYear);
  }
  if (!calMonthSelect.dataset.populated) {
    calMonthSelect.innerHTML = Array.from({ length: 12 }, (_, i) => `<option value="${i}">${i + 1}월</option>`).join("");
    calMonthSelect.dataset.populated = "1";
  }
  calYearSelect.value = String(calendarState.year);
  calMonthSelect.value = String(calendarState.month);

  const firstDay = new Date(calendarState.year, calendarState.month, 1);
  const daysInMonth = new Date(calendarState.year, calendarState.month + 1, 0).getDate();
  const startWeekday = firstDay.getDay();

  let cells = "";
  for (let i = 0; i < startWeekday; i += 1) cells += `<div class="cal-day empty"></div>`;

  const monthStats = { merit: 0, demerit: 0, daysWithData: 0, itemMap: new Map() };

  for (let day = 1; day <= daysInMonth; day += 1) {
    const dateObj = new Date(calendarState.year, calendarState.month, day);
    const key = formatDateOnly(dateObj);
    const entry = dayMap.get(key);
    const weekday = dateObj.getDay();
    const isWeekend = weekday === 0 || weekday === 6;
    const isRefDate = !!refDate && formatDateOnly(refDate) === key;
    const isSelected = calendarState.selectedDate === key;
    const hasData = !!entry;

    if (hasData) {
      monthStats.merit += entry.merit;
      monthStats.demerit += entry.demerit;
      monthStats.daysWithData += 1;
      entry.records.forEach((r) => {
        if (r.type !== "merit") {
          const item = r.item || "기타";
          monthStats.itemMap.set(item, (monthStats.itemMap.get(item) || 0) + 1);
        }
      });
    }

    const classes = ["cal-day"];
    if (isWeekend) classes.push("weekend");
    if (hasData) classes.push("has-data");
    if (isRefDate) classes.push("is-refdate");
    if (isSelected) classes.push("selected");

    const pills = hasData
      ? `<div class="cal-day-counts">${entry.merit ? `<span class="cal-pill merit">상 ${entry.merit}</span>` : ""}${entry.demerit ? `<span class="cal-pill demerit">벌 ${entry.demerit}</span>` : ""}</div>`
      : "";

    cells += `<div class="${classes.join(" ")}" ${hasData ? `data-date="${key}"` : ""}><span class="cal-date-num">${day}</span>${pills}</div>`;
  }

  calendarGrid.innerHTML = cells;
  renderCalendarSummary(dayMap, monthStats);
}

function getThisLastWeekItems(records) {
  const ref = getRefDate(records);
  if (!ref) return { thisMap: new Map(), lastMap: new Map() };
  const thisStart = startOfWeek(ref);
  const lastStart = new Date(thisStart); lastStart.setDate(thisStart.getDate() - 7);
  const lastEnd = new Date(thisStart); lastEnd.setDate(thisStart.getDate() - 1);
  const thisMap = new Map();
  const lastMap = new Map();
  records.filter((r) => r.type === "demerit").forEach((r) => {
    const d = parseRecordDate(r.date);
    if (!d) return;
    const item = r.item || "기타";
    if (d >= thisStart && d <= ref) thisMap.set(item, (thisMap.get(item) || 0) + 1);
    if (d >= lastStart && d <= lastEnd) lastMap.set(item, (lastMap.get(item) || 0) + 1);
  });
  return { thisMap, lastMap };
}

function renderBehaviorTab(data) {
  const records = getRecords(data);
  const demerit = records.filter((r) => r.type === "demerit");
  const itemMap = new Map();
  demerit.forEach((r) => itemMap.set(r.item || "기타", (itemMap.get(r.item || "기타") || 0) + 1));
  const topItems = Array.from(itemMap.entries()).map(([item, count]) => ({ item, count })).sort((a, b) => b.count - a.count);
  $("top3Badges").innerHTML = topItems.slice(0, 3).length ? topItems.slice(0, 3).map((i, idx) => `<span class="top3-badge">${idx + 1}위 · ${violationLabelHtml(i.item)} (${i.count}건)</span>`).join("") : "데이터가 없습니다.";
  const { thisMap, lastMap } = getThisLastWeekItems(records);
  const items = new Set([...thisMap.keys(), ...lastMap.keys()]);
  const changes = Array.from(items).map((item) => ({ item, thisWeek: thisMap.get(item) || 0, last: lastMap.get(item) || 0 })).map((c) => ({ ...c, diff: c.thisWeek - c.last })).sort((a, b) => b.diff - a.diff);
  setRows("increaseTableBody", changes.filter((c) => c.diff > 0).map((c) => `<tr><td>${violationLabelHtml(c.item)}</td><td>${c.last}</td><td>${c.thisWeek}</td><td class="up">+${c.diff}</td></tr>`), 4);
  const gradeMap = new Map();
  demerit.forEach((r) => {
    const grade = r.gradeName || "미분류";
    if (!gradeMap.has(grade)) gradeMap.set(grade, new Map());
    const m = gradeMap.get(grade);
    const item = r.item || "기타";
    m.set(item, (m.get(item) || 0) + 1);
  });
  const gradeMain = Array.from(gradeMap.entries()).map(([grade, m]) => {
    const top = Array.from(m.entries()).sort((a, b) => b[1] - a[1])[0] || ["-", 0];
    return { grade, item: top[0], count: top[1] };
  }).sort((a, b) => a.grade.localeCompare(b.grade, "ko"));
  setRows("gradeItemTableBody", gradeMain.map((g) => `<tr><td>${esc(g.grade)}</td><td>${violationLabelHtml(g.item)}</td><td>${g.count}</td></tr>`), 3);
  const studentMetrics = getStudentMetrics(data);
  const sameItemMap = new Map();
  studentMetrics.forEach((s) => {
    Object.entries(s.itemCounts).forEach(([item, count]) => {
      if (count < 2) return;
      if (!sameItemMap.has(item)) sameItemMap.set(item, { item, repeatStudents: 0, total: 0 });
      const row = sameItemMap.get(item);
      row.repeatStudents += 1;
      row.total += count;
    });
  });
  const sameItems = Array.from(sameItemMap.values()).sort((a, b) => b.repeatStudents - a.repeatStudents || b.total - a.total);
  setRows("sameItemTableBody", sameItems.map((s) => `<tr><td>${violationLabelHtml(s.item)}</td><td>${s.repeatStudents}</td><td>${s.total}</td></tr>`), 3);
}

function renderTierLadder(data) {
  const counts = { 관심: 0, 지도필요: 0, 집중지도: 0 };
  getRepeatList(data).forEach((s) => { if (counts[s.tier] !== undefined) counts[s.tier] += 1; });
  const steps = [
    ["tier-s1", "관심", `벌점 ${thresholds.attentionCount}회 이상 또는 최근14일 ${thresholds.attentionRecent}회`, "담임 확인, 구두 지도"],
    ["tier-s2", "지도필요", `벌점 ${thresholds.guideCount}회 이상 또는 동일항목 ${thresholds.guideSameItem}회`, "담임 상담, 생활지도 기록"],
    ["tier-s3", "집중지도", `벌점 ${thresholds.focusCount}회 이상 또는 최근14일 ${thresholds.focusRecent}회`, "학년부·생활지도부 공유"],
  ];
  $("tierLadder").innerHTML = steps.map(([cls, name, crit, action]) => `<div class="tier-step ${cls}"><div class="step-name">${name}</div><div class="step-count">${counts[name] || 0}명</div><div class="step-crit">${esc(crit)}</div><div class="step-action">후속조치: ${esc(action)}</div></div>`).join("");
}

function renderRepeatDetail(data) {
  const all = getRepeatList(data);
  const filtered = currentTierFilter === "all" ? all : all.filter((s) => s.tier === currentTierFilter);
  setText("repeatCountBadge", `${filtered.length}명`);
  const pageInfo = getPageData(filtered, "repeatDetail");
  setRows("repeatTableBody", pageInfo.items.map((s) => `<tr><td>${esc(s.id)}</td><td>${esc(s.name)}</td><td>${esc(s.gradeName)}</td><td>${s.penaltyCount}회</td><td class="penalty">${formatScore(s.totalPenalty)}</td><td>${s.rewardCount}회</td><td>${formatScore(s.netScore)}</td><td>${violationLabelHtml(s.topItem)}</td><td>${s.topItemCount}</td><td>${s.recent7}</td><td>${s.recent14}</td><td>${formatDateOnly(s.lastPenaltyDate)}</td><td><span class="tier-badge tier-${s.tier}">${s.tier}</span></td></tr>`), 13, "해당 등급의 학생이 없습니다.");
  renderPageSizeControl("repeatDetail", pageInfo, "반복 위반 학생");
  renderPagination("repeatDetail", pageInfo, "반복 위반 학생");
}

function renderMeritTab(data) {
  const records = getRecords(data);
  const merit = records.filter((r) => r.type === "merit");
  const demerit = records.filter((r) => r.type === "demerit");
  setText("meritKpiCount", formatScore(merit.length));
  setText("meritKpiRatio", `${pct(merit.length, demerit.length)}%`);
  const itemMap = new Map();
  merit.forEach((r) => itemMap.set(r.item || "기타", (itemMap.get(r.item || "기타") || 0) + 1));
  const top3 = Array.from(itemMap.entries()).map(([item, count]) => ({ item, count })).sort((a, b) => b.count - a.count).slice(0, 3);
  $("meritTop3Badges").innerHTML = top3.length ? top3.map((i, idx) => `<span class="top3-badge merit">${idx + 1}위 · ${violationLabelHtml(i.item)} (${i.count}건)</span>`).join("") : "데이터가 없습니다.";
  const allMeritItems = Array.from(itemMap.entries()).map(([item, count]) => ({ item, count })).sort((a, b) => b.count - a.count);
  const meritItemPageInfo = getPageData(allMeritItems, "meritItems");
  setRows("meritItemTableBody", meritItemPageInfo.items.map((i) => `<tr><td>${violationLabelHtml(i.item)}</td><td>${i.count}</td><td>${pct(i.count, merit.length)}%</td></tr>`), 3);
  renderPageSizeControl("meritItems", meritItemPageInfo, "상점 항목별 비율");
  renderPagination("meritItems", meritItemPageInfo, "상점 항목별 비율");
  setChartData("meritItemStatus", allMeritItems.slice(0, 10));
  const gradeMap = new Map();
  records.forEach((r) => {
    const grade = r.gradeName || "미분류";
    if (!gradeMap.has(grade)) gradeMap.set(grade, { grade, merit: 0, demerit: 0 });
    const row = gradeMap.get(grade);
    if (r.type === "merit") row.merit += 1;
    else row.demerit += 1;
  });
  const grades = Array.from(gradeMap.values()).sort((a, b) => a.grade.localeCompare(b.grade, "ko"));
  setRows("meritDistTableBody", grades.map((g) => {
    const noMerit = g.merit === 0 && g.demerit > 0;
    return `<tr class="${noMerit ? "warning-row" : ""}"><td>${esc(g.grade)}</td><td class="reward">${g.merit}</td><td class="penalty">${g.demerit}</td><td>${g.demerit ? `${pct(g.merit, g.demerit)}%` : (g.merit ? "∞" : "0%")}</td></tr>`;
  }), 4);
  setChartData("meritBalance", grades);
}

function render(data) {
  latestRenderedData = data;
  latestStudentMetrics = getStudentMetrics(data);
  updatedAt.textContent = data.updatedAt ? `마지막 업데이트: ${formatDateTime(data.updatedAt)}` : "엑셀 파일을 업로드하면 자동으로 정리됩니다.";
  renderSummary(data);
  renderOverviewStats(data);
  renderGradeRanking(data);
  populateRankingGradeFilter(data);
  renderRanking(data);
  populateRepeatGradeFilter(data);
  renderRepeatOffenders(data);
  renderGradeAndItemStats(data);
  renderCalendar(data);
  renderTierLadder(data);
  renderRepeatDetail(data);
  renderBehaviorTab(data);
  renderMeritTab(data);
  populateMeritRankingGradeFilter(data);
  renderMeritRanking(data);
  renderClassStatus(data);
}

/* ------------------------------------------------------------------ */
/* 반별 현황 (학년/반 드롭다운 선택 → 학생 표 + 요약)                    */
/* ------------------------------------------------------------------ */

// 반 식별 키: className을 우선 사용하되, 학년 내에서 정렬 가능한 라벨로 정규화한다.
function classLabelOf(record) {
  const raw = (record.className || "").toString().trim();
  if (raw && raw !== "-") return raw;
  return "미분류";
}

// 목록에 보여줄 짧은 라벨. 서버는 "1학년 3반" 형식으로 주는데 "1-3"으로 표시한다.
function classDisplayLabel(className) {
  const raw = (className || "").toString().trim();
  const gc = raw.match(/(\d+)\s*학년\s*(\d+)\s*반/);
  if (gc) return `${Number(gc[1])}-${Number(gc[2])}`;
  const co = raw.match(/(\d+)\s*반/);
  if (co) return `${Number(co[1])}반`;
  return raw || "미분류";
}

// 반 라벨을 숫자 기준으로 자연 정렬(1-1, 1-2, ... 1-10 순서 보장)
function compareClassLabel(a, b) {
  const na = (a.match(/\d+/g) || []).map(Number);
  const nb = (b.match(/\d+/g) || []).map(Number);
  const len = Math.max(na.length, nb.length);
  for (let i = 0; i < len; i += 1) {
    const va = na[i] === undefined ? -1 : na[i];
    const vb = nb[i] === undefined ? -1 : nb[i];
    if (va !== vb) return va - vb;
  }
  return a.localeCompare(b, "ko");
}

// 학년 -> 반 목록 맵을 만든다.
function buildGradeRoomMap(data) {
  const records = getRecords(data);
  const map = new Map();
  records.forEach((r) => {
    const grade = r.gradeName || "미분류";
    const room = classLabelOf(r);
    if (!map.has(grade)) map.set(grade, new Set());
    map.get(grade).add(room);
  });
  const result = new Map();
  Array.from(map.keys())
    .sort((a, b) => a.localeCompare(b, "ko"))
    .forEach((grade) => {
      result.set(grade, Array.from(map.get(grade)).sort(compareClassLabel));
    });
  return result;
}

function fillGradeSelect(gradeRoomMap) {
  if (!classGradeSelect) return;
  const grades = Array.from(gradeRoomMap.keys());
  if (grades.length === 0) {
    classGradeSelect.innerHTML = `<option value="">데이터 없음</option>`;
    classGradeSelect.disabled = true;
    return;
  }
  classGradeSelect.disabled = false;
  if (!classStatusSelection.grade || !gradeRoomMap.has(classStatusSelection.grade)) {
    classStatusSelection.grade = grades[0];
  }
  classGradeSelect.innerHTML = grades
    .map((g) => `<option value="${esc(g)}" ${g === classStatusSelection.grade ? "selected" : ""}>${esc(g)}</option>`)
    .join("");
}

function fillRoomSelect(gradeRoomMap) {
  if (!classRoomSelect) return;
  const rooms = gradeRoomMap.get(classStatusSelection.grade) || [];
  if (rooms.length === 0) {
    classRoomSelect.innerHTML = `<option value="">-</option>`;
    classRoomSelect.disabled = true;
    return;
  }
  classRoomSelect.disabled = false;
  if (!classStatusSelection.room || !rooms.includes(classStatusSelection.room)) {
    classStatusSelection.room = rooms[0];
  }
  classRoomSelect.innerHTML = rooms
    .map((room) => `<option value="${esc(room)}" ${room === classStatusSelection.room ? "selected" : ""}>${esc(classDisplayLabel(room))}</option>`)
    .join("");
}

function renderClassStatusTable() {
  if (!classStatusBody) return;
  const grade = classStatusSelection.grade;
  const room = classStatusSelection.room;

  if (!grade || !room) {
    setRows("classStatusBody", [], 6, "학년과 반을 선택해 주세요.");
    if (classStudentBadge) classStudentBadge.textContent = "학생 0명";
    if (classSummary) classSummary.hidden = true;
    return;
  }

  const students = (latestStudentMetrics || [])
    .filter((s) => (s.gradeName || "미분류") === grade && classLabelOf(s) === room)
    .sort((a, b) => (b.totalPenalty - a.totalPenalty) || (a.name || "").localeCompare(b.name || "", "ko"));

  if (classStudentBadge) classStudentBadge.textContent = `학생 ${formatScore(students.length)}명`;

  const meritSum = students.reduce((sum, s) => sum + Number(s.totalReward || 0), 0);
  const demeritSum = students.reduce((sum, s) => sum + Number(s.totalPenalty || 0), 0);
  if (classSummary) {
    if (students.length) {
      classSummary.hidden = false;
      if (classSummaryMerit) classSummaryMerit.textContent = formatScore(meritSum);
      if (classSummaryDemerit) classSummaryDemerit.textContent = formatScore(demeritSum);
      if (classSummaryNet) classSummaryNet.textContent = formatScore(meritSum - demeritSum);
    } else {
      classSummary.hidden = true;
    }
  }

  const rows = students.map((s) => `
    <tr data-id="${esc(s.id || "")}">
      <td>${esc(s.name || "-")}</td>
      <td>${esc(s.id || "-")}</td>
      <td class="num reward">${formatScore(s.totalReward)}</td>
      <td class="num penalty">${formatScore(s.totalPenalty)}</td>
      <td><span class="tier-badge tier-${esc(s.tier || "정상")}">${esc(s.tier || "정상")}</span></td>
      <td class="num">${formatScore(s.netScore)}</td>
    </tr>`);
  setRows("classStatusBody", rows, 6, "이 반에 기록된 학생이 없습니다.");
  refreshKakaoLinkStatus();
}

function renderClassStatus(data) {
  if (!classGradeSelect || !classRoomSelect) return;
  const gradeRoomMap = buildGradeRoomMap(data);
  fillGradeSelect(gradeRoomMap);
  fillRoomSelect(gradeRoomMap);
  renderClassStatusTable();
}

if (classGradeSelect) {
  classGradeSelect.addEventListener("change", () => {
    classStatusSelection.grade = classGradeSelect.value;
    classStatusSelection.room = null; // 학년 변경 시 반은 첫 반으로
    const gradeRoomMap = buildGradeRoomMap(latestRenderedData || {});
    fillRoomSelect(gradeRoomMap);
    renderClassStatusTable();
  });
}
if (classRoomSelect) {
  classRoomSelect.addEventListener("change", () => {
    classStatusSelection.room = classRoomSelect.value;
    renderClassStatusTable();
  });
}
// 학생 행 클릭 → 기존 학생 상세 모달 열기
if (classStatusBody) {
  classStatusBody.addEventListener("click", (e) => {
    const tr = e.target.closest("tr[data-id]");
    if (!tr) return;
    const id = tr.dataset.id;
    const student = (latestStudentMetrics || []).find((s) => (s.id || "") === id);
    if (student) openStudentModal(student);
  });
}

// 현재 선택된 학년·반 기준으로 담임 선생님께 카톡 전송
async function refreshKakaoLinkStatus() {
  if (!kakaoLinkBadge) return;
  const grade = classStatusSelection.grade;
  const room = classStatusSelection.room;
  if (!grade || !room) {
    kakaoLinkBadge.textContent = "학년/반을 선택하세요";
    kakaoLinkBadge.className = "kakao-link-badge";
    if (kakaoSendBtn) kakaoSendBtn.disabled = true;
    return;
  }
  kakaoLinkBadge.textContent = "확인 중...";
  kakaoLinkBadge.className = "kakao-link-badge";
  try {
    const res = await fetch(`/api/kakao-status?grade=${encodeURIComponent(grade)}&room=${encodeURIComponent(room)}`);
    const data = await res.json();
    if (data.linked) {
      kakaoLinkBadge.textContent = "카카오 연동됨";
      kakaoLinkBadge.className = "kakao-link-badge linked";
      if (kakaoSendBtn) kakaoSendBtn.disabled = false;
      if (kakaoLinkBtn) kakaoLinkBtn.textContent = "다시 연동하기";
    } else {
      kakaoLinkBadge.textContent = data.configured ? "연동 안 됨" : "카카오 API 미설정";
      kakaoLinkBadge.className = "kakao-link-badge not-linked";
      if (kakaoSendBtn) kakaoSendBtn.disabled = true;
      if (kakaoLinkBtn) kakaoLinkBtn.textContent = "카카오 연동하기";
    }
  } catch (err) {
    kakaoLinkBadge.textContent = "상태 확인 실패";
    kakaoLinkBadge.className = "kakao-link-badge not-linked";
    if (kakaoSendBtn) kakaoSendBtn.disabled = true;
  }
}

if (kakaoLinkBtn) {
  kakaoLinkBtn.addEventListener("click", () => {
    const grade = classStatusSelection.grade;
    const room = classStatusSelection.room;
    if (!grade || !room) return;
    const url = `/auth/kakao/start?grade=${encodeURIComponent(grade)}&room=${encodeURIComponent(room)}`;
    const popup = window.open(url, "kakaoLogin", "width=480,height=640");
    const timer = setInterval(() => {
      if (!popup || popup.closed) {
        clearInterval(timer);
        refreshKakaoLinkStatus();
      }
    }, 700);
  });
}
window.addEventListener("message", (e) => {
  if (e.data && e.data.type === "kakao-link-result") refreshKakaoLinkStatus();
});

if (kakaoSendBtn) {
  kakaoSendBtn.addEventListener("click", async () => {
    const grade = classStatusSelection.grade;
    const className = classStatusSelection.room;
    if (!grade || !className) return;
    const originalText = kakaoSendBtn.textContent;
    kakaoSendBtn.disabled = true;
    kakaoSendBtn.textContent = "보내는 중...";
    if (kakaoSendStatus) { kakaoSendStatus.textContent = ""; kakaoSendStatus.className = "kakao-send-status"; }
    try {
      const res = await fetch("/api/send-kakao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ grade, className }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.error || "전송에 실패했습니다.");
      if (kakaoSendStatus) { kakaoSendStatus.textContent = "전송 완료!"; kakaoSendStatus.className = "kakao-send-status success"; }
    } catch (err) {
      if (kakaoSendStatus) { kakaoSendStatus.textContent = err.message; kakaoSendStatus.className = "kakao-send-status error"; }
    } finally {
      kakaoSendBtn.textContent = originalText;
      refreshKakaoLinkStatus();
    }
  });
}

fetch("/api/data")
  .then((r) => {
    if (!r.ok) throw new Error("서버 응답 오류(" + r.status + ")");
    return r.json();
  })
  .then(setRawData)
  .catch((err) => {
    console.error("초기 데이터 로드 실패:", err);
    if (uploadStatus) {
      uploadStatus.textContent =
        "서버에서 데이터를 불러오지 못했습니다. server.cjs가 실행 중인지 확인해 주세요.";
      uploadStatus.className = "upload-status error";
    }
    // 데이터가 없어도 표/그래프 자리에 빈 상태를 그려 둔다.
    setRawData({});
  });

let evtSource = null;
try {
  evtSource = new EventSource("/api/events");
  evtSource.onmessage = (e) => {
    try {
      setRawData(JSON.parse(e.data));
    } catch (parseErr) {
      console.error("실시간 데이터 파싱 실패:", parseErr);
    }
  };
  evtSource.onerror = () => {
    // SSE가 끊겨도 화면은 그대로 유지한다(자동 재연결은 브라우저가 처리).
    console.warn("실시간 업데이트 연결이 끊겼습니다. 재연결을 시도합니다.");
  };
} catch (sseErr) {
  console.error("실시간 업데이트를 시작할 수 없습니다:", sseErr);
}

async function uploadFile(file) {
  if (!file) return;
  uploadStatus.textContent = "업로드 중...";
  uploadStatus.className = "upload-status loading";
  const formData = new FormData();
  formData.append("file", file);
  try {
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "업로드 실패");
    uploadStatus.textContent = "업로드 완료! 자동으로 분석되었습니다.";
    uploadStatus.className = "upload-status success";
    resetPages();
    periodFilter = { start: null, end: null };
    if (periodStartInput) periodStartInput.value = "";
    if (periodEndInput) periodEndInput.value = "";
    updatePeriodStatusText();
    setRawData(data.data);
  } catch (err) {
    uploadStatus.textContent = "오류: " + err.message;
    uploadStatus.className = "upload-status error";
  }
}

if (fileInput) fileInput.addEventListener("change", (e) => uploadFile(e.target.files[0]));
if (dropZone) {
  ["dragover", "dragleave", "drop"].forEach((eventName) => dropZone.addEventListener(eventName, (e) => e.preventDefault()));
  dropZone.addEventListener("dragover", () => { if (uploadBox) uploadBox.classList.add("dragover"); });
  dropZone.addEventListener("dragleave", () => { if (uploadBox) uploadBox.classList.remove("dragover"); });
  dropZone.addEventListener("drop", (e) => { if (uploadBox) uploadBox.classList.remove("dragover"); uploadFile(e.dataTransfer.files[0]); });
}

const resetBtn = $("resetBtn");
if (resetBtn) resetBtn.addEventListener("click", async () => {
  try {
    const res = await fetch("/api/reset", { method: "POST" });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "초기화 실패");
    uploadStatus.textContent = "데이터를 초기화했습니다.";
    uploadStatus.className = "upload-status loading";
    resetPages();
    periodFilter = { start: null, end: null };
    if (periodStartInput) periodStartInput.value = "";
    if (periodEndInput) periodEndInput.value = "";
    updatePeriodStatusText();
    setRawData(data.data);
  } catch (err) {
    uploadStatus.textContent = "오류: " + err.message;
    uploadStatus.className = "upload-status error";
  }
});

function showView(viewId) {
  document.querySelectorAll(".view-section").forEach((sec) => sec.classList.remove("active"));
  document.querySelectorAll(".mega-nav-dropdown li").forEach((li) => li.classList.remove("active"));
  document.querySelectorAll(".mega-nav-label.active").forEach((lbl) => lbl.classList.remove("active"));
  document.querySelectorAll(".mega-nav-item").forEach((item) => item.classList.remove("open"));
  const target = $(viewId);
  if (!target) return;
  target.classList.add("active");
  const activeLi = document.querySelector(`.mega-nav-dropdown li[data-view="${viewId}"]`);
  if (activeLi) activeLi.classList.add("active");
  const activeLabel = document.querySelector(`.mega-nav-label[data-view="${viewId}"]`);
  if (activeLabel) activeLabel.classList.add("active");
  if (uploadBox) uploadBox.hidden = viewId !== "view-home";
}
const MAX_TIER_PASSWORD_ATTEMPTS = 5;
let tierSettingsUnlocked = false;
let tierPasswordAttempts = 0;
let pendingProtectedView = null;
let verifiedAdminName = null;

function closeTierPasswordModal() {
  if (tierPasswordOverlay) tierPasswordOverlay.classList.remove("open");
  if (tierPasswordInput) tierPasswordInput.value = "";
  if (tierPasswordError) tierPasswordError.hidden = true;
  pendingProtectedView = null;
}

function openTierPasswordModal(viewId) {
  pendingProtectedView = viewId;
  if (tierPasswordError) tierPasswordError.hidden = true;
  if (tierPasswordInput) tierPasswordInput.value = "";
  if (tierPasswordOverlay) tierPasswordOverlay.classList.add("open");
  if (tierPasswordInput) tierPasswordInput.focus();
}

function lockOutTierPassword() {
  if (tierPasswordInput) tierPasswordInput.disabled = true;
  if (tierPasswordSubmit) tierPasswordSubmit.disabled = true;
  if (tierPasswordError) {
    tierPasswordError.hidden = false;
    tierPasswordError.textContent = "시도 횟수를 초과했습니다. 페이지를 종료합니다.";
  }
  setTimeout(() => {
    window.close();
    setTimeout(() => { location.href = "about:blank"; }, 300);
  }, 1200);
}

async function submitTierPassword() {
  if (!tierPasswordInput) return;
  let ok = false;
  let serverError = false;
  try {
    const res = await fetch("/api/tier-password/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: tierPasswordInput.value }),
    });
    if (!res.ok) { serverError = true; }
    else {
      const data = await res.json();
      ok = !!data.ok;
    }
  } catch (err) {
    serverError = true;
  }
  if (serverError) {
    if (tierPasswordError) {
      tierPasswordError.hidden = false;
      tierPasswordError.textContent = "서버에 연결할 수 없습니다. server.cjs를 최신 버전으로 교체하고 서버를 재시작했는지 확인하세요.";
    }
    return;
  }
  if (ok) {
    tierSettingsUnlocked = true;
    tierPasswordAttempts = 0;
    const viewId = pendingProtectedView;
    closeTierPasswordModal();
    if (viewId) showView(viewId);
  } else {
    tierPasswordAttempts += 1;
    if (tierPasswordAttempts >= MAX_TIER_PASSWORD_ATTEMPTS) {
      lockOutTierPassword();
      return;
    }
    if (tierPasswordError) {
      tierPasswordError.hidden = false;
      tierPasswordError.textContent = `비밀번호가 올바르지 않습니다. (${tierPasswordAttempts}/${MAX_TIER_PASSWORD_ATTEMPTS}회 실패)`;
    }
    tierPasswordInput.value = "";
    tierPasswordInput.focus();
  }
}

function closeAdminNameModal() {
  if (adminNameOverlay) adminNameOverlay.classList.remove("open");
  if (adminNameInput) adminNameInput.value = "";
  if (adminNameError) adminNameError.hidden = true;
}
function openAdminNameModal() {
  closeTierPasswordModal();
  if (adminNameError) adminNameError.hidden = true;
  if (adminNameInput) adminNameInput.value = "";
  if (adminNameOverlay) adminNameOverlay.classList.add("open");
  if (adminNameInput) adminNameInput.focus();
}
async function submitAdminName() {
  if (!adminNameInput) return;
  const name = adminNameInput.value.trim();
  if (!name) return;
  let ok = false;
  let serverError = false;
  try {
    const res = await fetch("/api/admin/verify-name", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) { serverError = true; }
    else {
      const data = await res.json();
      ok = !!data.ok;
    }
  } catch (err) {
    serverError = true;
  }
  if (ok) {
    verifiedAdminName = name;
    closeAdminNameModal();
    openAdminSetPasswordModal();
  } else if (adminNameError) {
    adminNameError.hidden = false;
    adminNameError.textContent = serverError
      ? "서버에 연결할 수 없습니다. server.cjs를 최신 버전으로 교체하고 서버를 재시작했는지 확인하세요."
      : "권한이 없는 이름입니다.";
  }
}

function closeAdminSetPasswordModal() {
  if (adminSetPasswordOverlay) adminSetPasswordOverlay.classList.remove("open");
  if (adminNewPasswordInput) adminNewPasswordInput.value = "";
  if (adminNewPasswordConfirm) adminNewPasswordConfirm.value = "";
  if (adminSetPasswordError) adminSetPasswordError.hidden = true;
  if (adminSetPasswordSuccess) adminSetPasswordSuccess.hidden = true;
}
function openAdminSetPasswordModal() {
  if (adminSetPasswordError) adminSetPasswordError.hidden = true;
  if (adminSetPasswordSuccess) adminSetPasswordSuccess.hidden = true;
  if (adminNewPasswordInput) adminNewPasswordInput.value = "";
  if (adminNewPasswordConfirm) adminNewPasswordConfirm.value = "";
  if (adminSetPasswordOverlay) adminSetPasswordOverlay.classList.add("open");
  if (adminNewPasswordInput) adminNewPasswordInput.focus();
}
async function submitAdminSetPassword() {
  if (!adminNewPasswordInput || !adminNewPasswordConfirm || !verifiedAdminName) return;
  const pw = adminNewPasswordInput.value;
  const confirmPw = adminNewPasswordConfirm.value;
  if (adminSetPasswordError) adminSetPasswordError.hidden = true;
  if (pw.length < 4) {
    if (adminSetPasswordError) { adminSetPasswordError.hidden = false; adminSetPasswordError.textContent = "비밀번호는 4자 이상이어야 합니다."; }
    return;
  }
  if (pw !== confirmPw) {
    if (adminSetPasswordError) { adminSetPasswordError.hidden = false; adminSetPasswordError.textContent = "비밀번호 확인이 일치하지 않습니다."; }
    return;
  }
  try {
    const res = await fetch("/api/admin/set-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: verifiedAdminName, newPassword: pw }),
    });
    if (!res.ok && res.status !== 400 && res.status !== 403) throw new Error("서버에 연결할 수 없습니다. server.cjs를 최신 버전으로 교체하고 서버를 재시작했는지 확인하세요.");
    const data = await res.json();
    if (!data.ok) throw new Error(data.error || "변경 실패");
    if (adminSetPasswordSuccess) adminSetPasswordSuccess.hidden = false;
    tierSettingsUnlocked = true;
    tierPasswordAttempts = 0;
    setTimeout(() => {
      closeAdminSetPasswordModal();
      verifiedAdminName = null;
      const viewId = pendingProtectedView || "view-tier-settings";
      pendingProtectedView = null;
      showView(viewId);
    }, 900);
  } catch (err) {
    if (adminSetPasswordError) { adminSetPasswordError.hidden = false; adminSetPasswordError.textContent = err.message; }
  }
}

if (tierAdminBtn) tierAdminBtn.addEventListener("click", openAdminNameModal);
if (adminNameSubmit) adminNameSubmit.addEventListener("click", submitAdminName);
if (adminNameCancel) adminNameCancel.addEventListener("click", closeAdminNameModal);
if (adminNameClose) adminNameClose.addEventListener("click", closeAdminNameModal);
if (adminNameInput) {
  adminNameInput.addEventListener("keydown", (e) => { if (e.key === "Enter") submitAdminName(); });
}
if (adminNameOverlay) {
  adminNameOverlay.addEventListener("click", (e) => { if (e.target === adminNameOverlay) closeAdminNameModal(); });
}
if (adminSetPasswordSubmit) adminSetPasswordSubmit.addEventListener("click", submitAdminSetPassword);
if (adminSetPasswordCancel) adminSetPasswordCancel.addEventListener("click", closeAdminSetPasswordModal);
if (adminSetPasswordClose) adminSetPasswordClose.addEventListener("click", closeAdminSetPasswordModal);
if (adminNewPasswordConfirm) {
  adminNewPasswordConfirm.addEventListener("keydown", (e) => { if (e.key === "Enter") submitAdminSetPassword(); });
}
if (adminSetPasswordOverlay) {
  adminSetPasswordOverlay.addEventListener("click", (e) => { if (e.target === adminSetPasswordOverlay) closeAdminSetPasswordModal(); });
}

function closeDownloadPanel() {
  if (downloadPanel) downloadPanel.hidden = true;
}
function openDownloadPanel() {
  if (!latestRenderedData || !latestRenderedData.totalRows) {
    if (uploadStatus) {
      uploadStatus.textContent = "다운로드할 데이터가 없습니다. 먼저 엑셀 파일을 업로드해주세요.";
      uploadStatus.className = "upload-status error";
    }
    return;
  }
  if (downloadError) downloadError.hidden = true;
  if (downloadPanel) downloadPanel.hidden = false;
}

/* ------------------------------------------------------------------ */
/* PDF는 서버(브라우저 자동화) 대신, 지금 보고 있는 이 브라우저의       */
/* 인쇄 기능으로 만든다 — 별도 엔진 설치/호환성 문제가 생기지 않는다.   */
/* ------------------------------------------------------------------ */
function buildPrintSectionsHtml(sections, data) {
  const defs = {
    ranking: {
      name: "학생별 순위",
      headers: ["순위", "이름", "학번", "학년", "반", "벌점합계", "벌점횟수", "상점합계", "상점횟수", "순점수"],
      rows: (data.ranking || []).map((s) => [s.rank, s.name, s.id, s.gradeName, s.className, s.totalPenalty, s.penaltyCount, s.totalReward, s.rewardCount, s.netScore]),
    },
    grade: {
      name: "학년별 현황",
      headers: ["순위", "학년", "학생수", "벌점합계", "평균벌점", "벌점횟수", "상점합계", "상점횟수", "순점수"],
      rows: (data.gradeRanking || []).map((g) => [g.rank, g.gradeName, g.studentCount, g.totalPenalty, g.averagePenalty, g.penaltyCount, g.totalReward, g.rewardCount, g.netScore]),
    },
    repeat: {
      name: `반복위반학생(${data.repeatThreshold || 3}회+)`,
      headers: ["이름", "학번", "학년", "벌점횟수", "벌점합계", "상점횟수", "순점수"],
      rows: (data.repeatOffenders || []).map((s) => [s.name, s.id, s.gradeName, s.penaltyCount, s.totalPenalty, s.rewardCount, s.netScore]),
    },
    records: {
      name: "원본 기록",
      headers: ["날짜", "이름", "학번", "학년", "반", "구분", "항목", "사유", "점수"],
      rows: getRecords(data).map((r) => {
        const d = parseRecordDate(r.date);
        return [d ? formatDateOnly(d) : "", r.name, r.id, r.gradeName, r.className, r.type === "merit" ? "상점" : "벌점", r.item, r.reason, r.points];
      }),
    },
  };
  return sections.map((key) => {
    const def = defs[key];
    if (!def) return "";
    const thead = `<tr>${def.headers.map((h) => `<th>${esc(h)}</th>`).join("")}</tr>`;
    const tbody = def.rows.length
      ? def.rows.map((row) => `<tr>${row.map((v) => `<td>${esc(v === null || v === undefined ? "" : v)}</td>`).join("")}</tr>`).join("")
      : `<tr><td colspan="${def.headers.length}" class="empty-row">데이터가 없습니다.</td></tr>`;
    return `<section class="report-section"><h2>${esc(def.name)}</h2><table class="data-table"><thead>${thead}</thead><tbody>${tbody}</tbody></table></section>`;
  }).join("");
}

function buildPrintChartsHtml(data) {
  const scratch = document.createElement("div");
  scratch.style.cssText = "position:absolute;left:-9999px;top:-9999px;width:640px;";
  document.body.appendChild(scratch);

  const makeBox = () => { const div = document.createElement("div"); div.className = "chart-box"; scratch.appendChild(div); return div; };
  const gradeRanking = data.gradeRanking || [];
  const records = getRecords(data);

  const gradeRankingBox = makeBox();
  drawGroupedBarChart(gradeRankingBox, gradeRanking.map((g) => g.gradeName), [
    { label: "벌점", color: SEABORN.red, values: gradeRanking.map((g) => g.totalPenalty) },
    { label: "상점", color: SEABORN.blue, values: gradeRanking.map((g) => g.totalReward) },
  ]);

  const gradeTypeMap = new Map();
  records.forEach((r) => {
    const grade = r.gradeName || "미분류";
    if (!gradeTypeMap.has(grade)) gradeTypeMap.set(grade, { merit: 0, demerit: 0 });
    const row = gradeTypeMap.get(grade);
    if (r.type === "merit") row.merit += 1; else row.demerit += 1;
  });
  const balanceGroups = Array.from(gradeTypeMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0], "ko"))
    .map(([grade, v]) => ({ title: grade, slices: [{ label: "상점", value: v.merit, type: "merit" }, { label: "벌점", value: v.demerit, type: "demerit" }] }));
  const balanceBox = makeBox();
  drawMultiPieChart(balanceBox, balanceGroups);

  const demeritMap = new Map();
  records.filter((r) => r.type !== "merit").forEach((r) => { const k = r.item || "기타"; demeritMap.set(k, (demeritMap.get(k) || 0) + 1); });
  const demeritItems = Array.from(demeritMap.entries()).map(([item, count]) => ({ label: item, value: count, type: "demerit" })).sort((a, b) => b.value - a.value).slice(0, 10);
  const demeritBox = makeBox();
  drawPieChart(demeritBox, demeritItems);

  const meritMap = new Map();
  records.filter((r) => r.type === "merit").forEach((r) => { const k = r.item || "기타"; meritMap.set(k, (meritMap.get(k) || 0) + 1); });
  const meritItems = Array.from(meritMap.entries()).map(([item, count]) => ({ label: item, value: count, type: "merit" })).sort((a, b) => b.value - a.value).slice(0, 10);
  const meritBox = makeBox();
  drawPieChart(meritBox, meritItems);

  const html = `
    <section class="report-section">
      <h2>현황 그래프</h2>
      <div class="chart-card"><div class="chart-title">학년별 벌점 랭킹</div>${gradeRankingBox.outerHTML}</div>
      <div class="chart-card"><div class="chart-title">학년별 상점/벌점 균형</div>${balanceBox.outerHTML}</div>
      <div class="chart-card"><div class="chart-title">벌점 항목별 비율</div>${demeritBox.outerHTML}</div>
      <div class="chart-card"><div class="chart-title">상점 항목별 비율</div>${meritBox.outerHTML}</div>
    </section>`;
  scratch.remove();
  return html;
}

function openPrintReport(sections) {
  const data = getPeriodFilteredData();
  const periodLabel = hasActivePeriodFilter()
    ? `${periodFilter.start ? formatDateOnly(periodFilter.start) : "처음"} ~ ${periodFilter.end ? formatDateOnly(periodFilter.end) : "지금"}`
    : null;

  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    if (downloadError) { downloadError.hidden = false; downloadError.textContent = "팝업이 차단되었습니다. 브라우저에서 팝업을 허용한 뒤 다시 시도해주세요."; }
    return;
  }

  const html = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8" />
<title>상벌점 관리 리포트</title>
<link rel="stylesheet" href="/home.css" />
<style>
  body { background: white; padding: 24px; max-width: 900px; margin: 0 auto; }
  h1 { font-size: 20px; margin: 0 0 4px; }
  .report-meta { color: #6b7280; font-size: 12px; margin-bottom: 20px; }
  .report-section { margin-bottom: 26px; page-break-inside: avoid; }
  .report-section h2 { font-size: 15px; border-bottom: 2px solid #1f2937; padding-bottom: 6px; margin-bottom: 10px; }
  .chart-card { margin-bottom: 16px; page-break-inside: avoid; }
  .chart-title { font-size: 12px; font-weight: 800; margin-bottom: 6px; color: #1f2937; }
  .print-toolbar { position: sticky; top: 0; background: #eff6ff; padding: 10px 16px; margin: -24px -24px 20px; text-align: center; }
  @media print { .print-toolbar { display: none; } body { padding: 0; max-width: none; } }
</style>
</head>
<body>
  <div class="print-toolbar">이 창은 인쇄 미리보기입니다 — 오른쪽 위 인쇄 대화상자에서 "PDF로 저장"을 선택하면 PDF로 저장됩니다. <button onclick="window.print()">인쇄/PDF 저장</button></div>
  <h1>상벌점 관리 리포트</h1>
  <p class="report-meta">생성일: ${esc(formatDateOnly(new Date()))}${periodLabel ? ` · 대상 기간: ${esc(periodLabel)}` : ""}</p>
  ${buildPrintChartsHtml(data)}
  ${buildPrintSectionsHtml(sections, data)}
  <script>window.addEventListener("load", () => setTimeout(() => window.print(), 400));</script>
</body>
</html>`;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}

async function submitDownload() {
  if (!downloadPanel) return;
  const sections = Array.from(downloadPanel.querySelectorAll('input[type="checkbox"]:checked')).map((el) => el.value);
  const formatEl = downloadPanel.querySelector('input[name="downloadFormat"]:checked');
  const format = formatEl ? formatEl.value : "pdf";
  if (!sections.length) {
    if (downloadError) { downloadError.hidden = false; downloadError.textContent = "포함할 내용을 하나 이상 선택하세요."; }
    return;
  }
  if (downloadError) downloadError.hidden = true;

  if (format === "pdf") {
    openPrintReport(sections);
    if (!downloadError || downloadError.hidden) closeDownloadPanel();
    return;
  }

  const originalText = downloadConfirmBtn ? downloadConfirmBtn.textContent : "";
  if (downloadConfirmBtn) { downloadConfirmBtn.disabled = true; downloadConfirmBtn.textContent = "생성 중..."; }
  try {
    const res = await fetch("/api/export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sections,
        format,
        periodStart: periodFilter.start ? formatDateOnly(periodFilter.start) : null,
        periodEnd: periodFilter.end ? formatDateOnly(periodFilter.end) : null,
      }),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || "다운로드에 실패했습니다.");
    }
    const blob = await res.blob();
    const disposition = res.headers.get("Content-Disposition") || "";
    const match = disposition.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i);
    const filename = match ? decodeURIComponent(match[1]) : `상벌점_리포트.${format}`;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    closeDownloadPanel();
  } catch (err) {
    if (downloadError) { downloadError.hidden = false; downloadError.textContent = err.message; }
  } finally {
    if (downloadConfirmBtn) { downloadConfirmBtn.disabled = false; downloadConfirmBtn.textContent = originalText; }
  }
}
if (downloadBtn) {
  downloadBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    if (downloadPanel && !downloadPanel.hidden) { closeDownloadPanel(); return; }
    openDownloadPanel();
  });
}
if (downloadCancelBtn) downloadCancelBtn.addEventListener("click", closeDownloadPanel);
if (downloadConfirmBtn) downloadConfirmBtn.addEventListener("click", submitDownload);
document.addEventListener("click", (e) => {
  if (downloadPanel && !downloadPanel.hidden && !e.target.closest(".topbar-download")) closeDownloadPanel();
});

if (tierPasswordSubmit) tierPasswordSubmit.addEventListener("click", submitTierPassword);
if (tierPasswordCancel) tierPasswordCancel.addEventListener("click", closeTierPasswordModal);
if (tierPasswordClose) tierPasswordClose.addEventListener("click", closeTierPasswordModal);
if (tierPasswordOverlay) {
  tierPasswordOverlay.addEventListener("click", (e) => {
    if (e.target === tierPasswordOverlay) closeTierPasswordModal();
  });
}
if (tierPasswordInput) {
  tierPasswordInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") submitTierPassword();
  });
}

if (megaNav) {
  megaNav.addEventListener("click", (e) => {
    const li = e.target.closest(".mega-nav-dropdown li[data-view]");
    if (li) {
      const viewId = li.dataset.view;
      document.querySelectorAll(".mega-nav-item").forEach((it) => it.classList.remove("open"));
      if (viewId === "view-tier-settings" && !tierSettingsUnlocked) { openTierPasswordModal(viewId); return; }
      showView(viewId);
      return;
    }
    const label = e.target.closest(".mega-nav-label");
    if (label) {
      if (label.dataset.view) { showView(label.dataset.view); return; }
      const item = label.closest(".mega-nav-item");
      const wasOpen = item.classList.contains("open");
      document.querySelectorAll(".mega-nav-item").forEach((it) => it.classList.remove("open"));
      if (!wasOpen) item.classList.add("open");
    }
  });
  document.addEventListener("click", (e) => {
    if (!megaNav.contains(e.target)) {
      document.querySelectorAll(".mega-nav-item").forEach((it) => it.classList.remove("open"));
    }
  });
}

const tierFilterRow = $("tierFilterRow");
if (tierFilterRow) tierFilterRow.addEventListener("click", (e) => {
  const btn = e.target.closest(".filter-btn");
  if (!btn) return;
  document.querySelectorAll("#tierFilterRow .filter-btn").forEach((b) => b.classList.remove("active"));
  btn.classList.add("active");
  currentTierFilter = btn.dataset.tier;
  paginationState.repeatDetail.page = 1;
  if (latestRenderedData) renderRepeatDetail(latestRenderedData);
});

const thresholdIds = ["attentionCount", "attentionRecent", "guideCount", "guideSameItem", "focusCount", "focusRecent"];
thresholdIds.forEach((key) => {
  const el = $(`th-${key}`);
  if (!el) return;
  el.addEventListener("change", () => {
    thresholds[key] = Math.max(1, Number(el.value) || thresholds[key]);
    el.value = thresholds[key];
    resetPages();
    if (latestRenderedData) render(latestRenderedData);
  });
});
if (calendarGrid) {
  calendarGrid.addEventListener("click", (e) => {
    const cell = e.target.closest(".cal-day.has-data");
    if (!cell) return;
    const date = cell.dataset.date;
    calendarState.selectedDate = calendarState.selectedDate === date ? null : date;
    if (latestRenderedData) renderCalendar(latestRenderedData);
  });
}
if (calYearSelect) {
  calYearSelect.addEventListener("change", () => {
    calendarState.year = Number(calYearSelect.value);
    calendarState.selectedDate = null;
    if (latestRenderedData) renderCalendar(latestRenderedData);
  });
}
if (calMonthSelect) {
  calMonthSelect.addEventListener("change", () => {
    calendarState.month = Number(calMonthSelect.value);
    calendarState.selectedDate = null;
    if (latestRenderedData) renderCalendar(latestRenderedData);
  });
}
if (calTodayBtn) {
  calTodayBtn.addEventListener("click", () => {
    const records = getRecords(latestRenderedData || {});
    const refDate = getRefDate(records) || new Date();
    calendarState.year = refDate.getFullYear();
    calendarState.month = refDate.getMonth();
    calendarState.selectedDate = null;
    if (latestRenderedData) renderCalendar(latestRenderedData);
  });
}
document.addEventListener("click", (e) => {
  const btn = e.target.closest("[id$='Pagination'] .page-button, [id$='Pagination'] .page-number");
  if (!btn) return;
  const container = btn.closest("[id$='Pagination']");
  const key = container.id.replace("Pagination", "");
  if (!paginationState[key]) return;
  const target = btn.dataset.page;
  if (target === "prev") paginationState[key].page -= 1;
  else if (target === "next") paginationState[key].page += 1;
  else paginationState[key].page = Number(target) || 1;
  if (latestRenderedData) render(latestRenderedData);
});
document.addEventListener("change", (e) => {
  const select = e.target.closest(".page-size-select[data-list]");
  if (!select) return;
  const key = select.dataset.list;
  if (!paginationState[key]) return;
  paginationState[key].pageSize = Number(select.value) || DEFAULT_PAGE_SIZE;
  paginationState[key].page = 1;
  if (latestRenderedData) render(latestRenderedData);
});

function bindGradeFilterRow(row, getState, setState, pageKey, renderFn) {
  if (!row) return;
  row.addEventListener("click", (e) => {
    const btn = e.target.closest(".filter-btn[data-grade]");
    if (!btn) return;
    setState(btn.dataset.grade);
    row.querySelectorAll(".filter-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    paginationState[pageKey].page = 1;
    if (latestRenderedData) renderFn(latestRenderedData);
  });
}
bindGradeFilterRow(rankingGradeFilterRow, () => rankingGradeState, (v) => { rankingGradeState = v; }, "ranking", renderRanking);
bindGradeFilterRow(repeatGradeFilterRow, () => repeatGradeState, (v) => { repeatGradeState = v; }, "repeat", renderRepeatOffenders);
bindGradeFilterRow(meritRankingGradeFilterRow, () => meritRankingGradeState, (v) => { meritRankingGradeState = v; }, "meritRanking", renderMeritRanking);

function selectStudentSuggestion(idx) {
  const matches = studentSearchSuggestions ? studentSearchSuggestions._matches || [] : [];
  const student = matches[idx];
  if (!student) return;
  openStudentModal(student);
  if (studentSearchSuggestions) {
    studentSearchSuggestions.classList.remove("open");
    studentSearchSuggestions.innerHTML = "";
  }
  if (studentSearchInput) studentSearchInput.value = "";
}

if (studentSearchInput) {
  studentSearchInput.addEventListener("input", (e) => renderStudentSearchSuggestions(e.target.value));
  studentSearchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const matches = studentSearchSuggestions ? studentSearchSuggestions._matches || [] : [];
      if (matches.length) selectStudentSuggestion(0);
    } else if (e.key === "Escape") {
      if (studentSearchSuggestions) studentSearchSuggestions.classList.remove("open");
    }
  });
  studentSearchInput.addEventListener("focus", () => {
    if (studentSearchInput.value.trim()) renderStudentSearchSuggestions(studentSearchInput.value);
  });
}
if (studentSearchBtn) {
  studentSearchBtn.addEventListener("click", () => {
    if (studentSearchInput) renderStudentSearchSuggestions(studentSearchInput.value);
  });
}
if (studentSearchSuggestions) {
  studentSearchSuggestions.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-idx]");
    if (!btn) return;
    selectStudentSuggestion(Number(btn.dataset.idx));
  });
}
document.addEventListener("click", (e) => {
  if (studentSearchSuggestions && !e.target.closest(".topbar-search")) {
    studentSearchSuggestions.classList.remove("open");
  }
});
if (studentModalClose) studentModalClose.addEventListener("click", closeStudentModal);
if (studentModalOverlay) {
  studentModalOverlay.addEventListener("click", (e) => {
    if (e.target === studentModalOverlay) closeStudentModal();
  });
}
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") { closeStudentModal(); closeTierPasswordModal(); closeAdminNameModal(); closeAdminSetPasswordModal(); closeDownloadPanel(); }
});

if (periodApplyBtn) {
  periodApplyBtn.addEventListener("click", () => {
    const startVal = periodStartInput ? periodStartInput.value : "";
    const endVal = periodEndInput ? periodEndInput.value : "";
    if (startVal && endVal && startVal > endVal) {
      if (periodStatusText) {
        periodStatusText.hidden = false;
        periodStatusText.textContent = "시작일이 종료일보다 늦을 수 없습니다.";
      }
      return;
    }
    periodFilter.start = startVal ? new Date(`${startVal}T00:00:00`) : null;
    periodFilter.end = endVal ? new Date(`${endVal}T00:00:00`) : null;
    resetPages();
    updatePeriodStatusText();
    refreshWithPeriod();
  });
}
if (periodResetBtn) {
  periodResetBtn.addEventListener("click", () => {
    periodFilter = { start: null, end: null };
    if (periodStartInput) periodStartInput.value = "";
    if (periodEndInput) periodEndInput.value = "";
    resetPages();
    updatePeriodStatusText();
    refreshWithPeriod();
  });
}

const resetThresholdsBtn = $("resetThresholdsBtn");
if (resetThresholdsBtn) resetThresholdsBtn.addEventListener("click", () => {
  thresholds = { attentionCount: 2, attentionRecent: 2, guideCount: 3, guideSameItem: 3, focusCount: 5, focusRecent: 3 };
  thresholdIds.forEach((key) => { const el = $(`th-${key}`); if (el) el.value = thresholds[key]; });
  resetPages();
  if (latestRenderedData) render(latestRenderedData);
});
