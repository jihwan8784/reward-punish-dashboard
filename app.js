(function() {
  'use strict';

  var $ = function(id) { return document.getElementById(id); };

  // ===== 폐기물 종류와 기준 단가 (kg당) =====
  var wasteBasePrice = {
    '철': 250,
    '생철': 400,
    '스테인리스': 1200,
    '알루미늄': 1000,
    '알루미늄캔': 750,
    '구리': 9000,
    '피복전선': 1500,
    '황동': 4800,
    '납': 1800,
    '폐지': 80,
    '신문지': 100,
    'PET병': 400,
    'PP플라스틱': 300,
    '폐비닐': 70
  };

  var wasteDisplayName = {
    '철': '고철 (일반 철)',
    '생철': '생철 (두꺼운 철)',
    '스테인리스': '스테인리스',
    '알루미늄': '알루미늄',
    '알루미늄캔': '알루미늄 캔',
    '구리': '구리',
    '피복전선': '피복전선',
    '황동': '황동',
    '납': '납',
    '폐지': '폐지',
    '신문지': '신문지',
    'PET병': 'PET병',
    'PP플라스틱': 'PP/PE 플라스틱',
    '폐비닐': '폐비닐'
  };

  // ===== 비전문가도 쉽게 찾을 수 있도록 아이콘/예시/검색어를 붙인 메타 정보 =====
  // unit: 'kg' | 'g' | 'count' - 품목마다 실제로 가늠하기 쉬운 단위로 입력받는다.
  // gramsPerUnit: count 단위일 때 개당 평균 무게(g) - 가격 계산은 항상 kg 기준으로 환산해서 사용.
  var wasteMeta = {
    '철':          { icon: '🔩', category: 'metal',   examples: '못, 철사, 낡은 프라이팬',   keywords: ['철', '고철', '못', '철사', '프라이팬', '자물쇠', '앵글'],
                     unit: 'kg', min: 0.1, max: 100, step: 0.1, default: 1 },
    '생철':        { icon: '🛢️', category: 'metal',   examples: '두꺼운 철판, 파이프, 드럼통', keywords: ['생철', '철판', '파이프', '드럼통', '앵글철'],
                     unit: 'kg', min: 0.1, max: 100, step: 0.1, default: 1 },
    '스테인리스':  { icon: '🍳', category: 'metal',   examples: '냄비, 수저, 싱크대',         keywords: ['스테인리스', '냄비', '수저', '싱크대', 'sus'],
                     unit: 'kg', min: 0.1, max: 50, step: 0.1, default: 1 },
    '알루미늄':    { icon: '🪟', category: 'metal',   examples: '샷시, 호일, 사다리',         keywords: ['알루미늄', '알미늄', '샷시', '호일', '사다리', '새시'],
                     unit: 'kg', min: 0.1, max: 50, step: 0.1, default: 1 },
    '알루미늄캔':  { icon: '🥫', category: 'metal',   examples: '음료수 캔, 맥주캔',          keywords: ['캔', '음료수캔', '맥주캔', '알루미늄캔', '알미늄캔'],
                     unit: 'count', min: 1, max: 300, step: 1, default: 10, gramsPerUnit: 15 },
    '구리':        { icon: '🔶', category: 'metal',   examples: '동파이프, 전선 속 빨간 선',  keywords: ['구리', '동선', '동파이프', '빨간선', '동'],
                     unit: 'g', min: 10, max: 5000, step: 10, default: 100 },
    '피복전선':    { icon: '🔌', category: 'metal',   examples: '겉이 비닐로 싸인 전선, 코드', keywords: ['전선', '피복', '케이블', '코드', '충전선'],
                     unit: 'g', min: 10, max: 5000, step: 10, default: 300 },
    '황동':        { icon: '🚪', category: 'metal',   examples: '문고리, 수도꼭지, 놋그릇',   keywords: ['황동', '놋쇠', '문고리', '수도꼭지', '놋그릇'],
                     unit: 'g', min: 10, max: 5000, step: 10, default: 200 },
    '납':          { icon: '⚙️', category: 'metal',   examples: '배터리 속 납, 낚시추',       keywords: ['납', '배터리', '낚시추', '축전지'],
                     unit: 'g', min: 10, max: 5000, step: 10, default: 200 },
    '폐지':        { icon: '📦', category: 'paper',   examples: '택배박스, 종이상자',         keywords: ['박스', '종이', '상자', '골판지', '택배', '종이박스'],
                     unit: 'kg', min: 0.5, max: 100, step: 0.5, default: 5 },
    '신문지':      { icon: '📰', category: 'paper',   examples: '신문, 전단지, 광고지',       keywords: ['신문', '전단지', '광고지'],
                     unit: 'kg', min: 0.5, max: 50, step: 0.5, default: 3 },
    'PET병':       { icon: '🧴', category: 'plastic', examples: '생수병, 음료수병',           keywords: ['페트병', '생수병', '음료수병', '물병', 'pet'],
                     unit: 'count', min: 1, max: 300, step: 1, default: 10, gramsPerUnit: 30 },
    'PP플라스틱':  { icon: '🪣', category: 'plastic', examples: '바구니, 세제통, 플라스틱 통', keywords: ['플라스틱', '바구니', '세제통', '플라스틱통', 'pp', 'pe'],
                     unit: 'kg', min: 0.1, max: 50, step: 0.1, default: 1 },
    '폐비닐':      { icon: '🛍️', category: 'plastic', examples: '비닐봉지, 포장 비닐',        keywords: ['비닐', '봉지', '포장비닐', '비닐봉투'],
                     unit: 'g', min: 50, max: 10000, step: 50, default: 500 }
  };

  var wasteCategoryLabel = { metal: '금속류', paper: '종이류', plastic: '플라스틱·비닐' };

  var DEFAULT_UNIT_CONFIG = { unit: 'kg', min: 0.1, max: 100, step: 0.1, default: 1 };

  function unitSuffix(unit) { return unit === 'count' ? '개' : unit; }

  // 입력 단위(개/g/kg)를 계산용 kg으로 환산
  function amountToKg(key, amount) {
    var cfg = wasteMeta[key];
    if (cfg.unit === 'count') return amount * cfg.gramsPerUnit / 1000;
    if (cfg.unit === 'g') return amount / 1000;
    return amount;
  }

  // 저장된 kg을 품목에 맞는 단위 문자열로 환산해서 보여준다
  function formatWasteAmount(key, kgValue) {
    var cfg = wasteMeta[key];
    if (cfg.unit === 'count') return Math.round(kgValue * 1000 / cfg.gramsPerUnit) + '개';
    if (cfg.unit === 'g') return Math.round(kgValue * 1000) + 'g';
    return (Math.round(kgValue * 10) / 10) + 'kg';
  }

  // kg당 단가를 품목의 표시 단위(개/g/kg) 기준 단가로 환산
  function formatUnitPrice(key, pricePerKg) {
    var cfg = wasteMeta[key];
    if (cfg.unit === 'count') return Math.round(pricePerKg * cfg.gramsPerUnit / 1000).toLocaleString() + '원/개';
    if (cfg.unit === 'g') return (Math.round(pricePerKg / 10) / 100).toLocaleString() + '원/g';
    return pricePerKg.toLocaleString() + '원/kg';
  }

  // 선택한 품목에 맞춰 무게/개수 입력 슬라이더와 라벨을 갱신
  function updateAmountControls(key) {
    var cfg = key && wasteMeta[key] ? wasteMeta[key] : DEFAULT_UNIT_CONFIG;

    var labelEl = $('waste-amount-label');
    var unitEl = $('waste-amount-unit');
    var slider = $('waste-kg-slider');
    var input = $('waste-kg-input');

    var labelText = cfg.unit === 'count' ? '개수 (개)' : cfg.unit === 'g' ? '무게 (g)' : '무게 (kg)';
    if (labelEl) labelEl.textContent = labelText;
    if (unitEl) unitEl.textContent = unitSuffix(cfg.unit);

    if (slider) { slider.min = cfg.min; slider.max = cfg.max; slider.step = cfg.step; slider.value = cfg.default; }
    if (input) { input.min = cfg.min; input.max = cfg.max; input.step = cfg.step; input.value = cfg.default; }
  }

  // ===== 업체 데이터 생성 =====
  function randRange(min, max) {
    return Math.random() * (max - min) + min;
  }

  function randInt(min, max) {
    return Math.floor(randRange(min, max + 1));
  }

  function generateVendorPrices(basePrice) {
    var factor = randRange(0.7, 1.3);
    return Math.round(basePrice * factor);
  }

  var allViolations = [
    { date: '2024.03.15', desc: '폐기물 보관 기준 위반 - 지정된 장소 외 보관 적발' },
    { date: '2023.11.02', desc: '처리 용량 초과 운영 - 허가 용량 대비 120% 처리' },
    { date: '2024.06.08', desc: '폐수 배출 기준 초과 - BOD 기준치 1.5배 검출' },
    { date: '2023.08.21', desc: '미신고 폐기물 수집 - 허가되지 않은 품목 수거' },
    { date: '2024.01.10', desc: '운반 차량 관리 소홀 - 적재함 덮개 미사용' },
    { date: '2024.04.22', desc: '소음 기준 초과 - 야간 작업 소음 민원 다수' },
    { date: '2023.09.30', desc: '대기오염 배출시설 관리 미흡 - 방지시설 가동 중단' },
    { date: '2024.02.14', desc: '중량 표시 위반 - 계량 증명서 허위 기재' },
    { date: '2023.12.05', desc: '악취 방지 조치 미흡 - 주변 지역 악취 민원 발생' },
    { date: '2024.05.18', desc: '지정 폐기물 혼합 보관 - 분리보관 원칙 위반' },
  ];

  function generateVendors() {
    var vendorNames = [
      { name: '에코리싸이클링', addr: '서울시 성동구 성수동 123-45' },
      { name: '그린자원', addr: '서울시 강서구 화곡동 678-90' },
      { name: '한국폐기물수거', addr: '서울시 구로구 가리봉동 234-56' },
      { name: '클린환경센터', addr: '서울시 도봉구 도봉동 789-12' },
      { name: '자원순환파트너스', addr: '서울시 은평구 불광동 345-67' },
    ];

    var vendors = [];
    for (var i = 0; i < vendorNames.length; i++) {
      var v = vendorNames[i];
      var prices = {};
      var wasteKeys = Object.keys(wasteBasePrice);
      for (var j = 0; j < wasteKeys.length; j++) {
        prices[wasteKeys[j]] = generateVendorPrices(wasteBasePrice[wasteKeys[j]]);
      }

      var ecoScore = randInt(30, 98);
      var violations = [];
      // 점수가 낮을수록 위반이 많을 확률
      var violationCount = 0;
      if (ecoScore < 50) violationCount = randInt(2, 4);
      else if (ecoScore < 75) violationCount = randInt(1, 2);
      else violationCount = randInt(0, 1);

      var shuffled = allViolations.slice().sort(function() { return 0.5 - Math.random(); });
      for (var k = 0; k < violationCount && k < shuffled.length; k++) {
        violations.push(shuffled[k]);
      }

      vendors.push({
        id: 'v' + i,
        name: v.name,
        address: v.addr,
        prices: prices,
        ecoScore: ecoScore,
        violations: violations
      });
    }
    return vendors;
  }

  var vendors = generateVendors();

  // ===== 상태 =====
  var state = {
    bin: {} // { '철': 3.5, '알루미늄': 1.2, ... }
  };

  var selectedWasteType = '';
  var activeWasteCategory = 'all';

  // 검색어와 카테고리에 맞는 폐기물 종류만 골라 그리드로 보여준다 (전문 용어를 몰라도 예시로 찾을 수 있도록)
  function matchesWasteQuery(key, query) {
    if (!query) return true;
    var meta = wasteMeta[key];
    var haystack = [key, wasteDisplayName[key], meta.examples].concat(meta.keywords).join(' ').toLowerCase();
    return haystack.indexOf(query) !== -1;
  }

  function renderWastePicker() {
    var grid = $('waste-picker-grid');
    if (!grid) return;
    var searchInput = $('waste-search');
    var query = searchInput ? searchInput.value.trim().toLowerCase() : '';
    var keys = Object.keys(wasteMeta);
    var html = '';
    var shown = 0;

    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      var meta = wasteMeta[key];
      if (activeWasteCategory !== 'all' && meta.category !== activeWasteCategory) continue;
      if (!matchesWasteQuery(key, query)) continue;

      shown++;
      var selectedClass = key === selectedWasteType ? ' selected' : '';
      html += '<button type="button" class="waste-picker-card' + selectedClass + '" data-key="' + key + '">' +
        '<span class="waste-picker-icon">' + meta.icon + '</span>' +
        '<span class="waste-picker-name">' + wasteDisplayName[key] + '</span>' +
        '<span class="waste-picker-examples">' + meta.examples + '</span>' +
      '</button>';
    }

    grid.innerHTML = html;
    var emptyMsg = $('waste-picker-empty');
    if (emptyMsg) emptyMsg.classList.toggle('hidden', shown > 0);

    grid.querySelectorAll('.waste-picker-card').forEach(function(card) {
      card.addEventListener('click', function() {
        selectedWasteType = this.dataset.key;
        renderWastePicker();
        updateAmountControls(selectedWasteType);
        var tag = $('selected-waste-tag');
        if (tag) {
          tag.textContent = wasteMeta[selectedWasteType].icon + ' ' + wasteDisplayName[selectedWasteType];
          tag.classList.add('active');
        }
      });
    });
  }

  var wasteSearchInput = $('waste-search');
  if (wasteSearchInput) {
    wasteSearchInput.addEventListener('input', function() { renderWastePicker(); });
  }

  var categoryTabs = $('waste-category-tabs');
  if (categoryTabs) {
    categoryTabs.querySelectorAll('.cat-tab').forEach(function(tab) {
      tab.addEventListener('click', function() {
        activeWasteCategory = this.dataset.cat;
        categoryTabs.querySelectorAll('.cat-tab').forEach(function(t) { t.classList.remove('active'); });
        this.classList.add('active');
        renderWastePicker();
      });
    });
  }

  renderWastePicker();
  updateAmountControls();

  // ===== 토스트 =====
  function toast(msg, duration) {
    var el = $('toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.remove('hidden');
    clearTimeout(el._timer);
    el._timer = setTimeout(function() { el.classList.add('hidden'); }, duration || 2000);
  }

  // ===== 모달 =====
  function openModal(id) {
    var el = $(id);
    if (!el) return;
    el.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  function closeModal(id) {
    var el = $(id);
    if (!el) return;
    el.classList.add('hidden');
    document.body.style.overflow = '';
  }

  document.querySelectorAll('.modal-backdrop, .modal-close').forEach(function(el) {
    el.addEventListener('click', function() {
      var modal = this.closest('.modal');
      if (modal) closeModal(modal.id);
    });
  });

  // ===== 쓰레기통 =====
  function getBinTotalKg() {
    var total = 0;
    var keys = Object.keys(state.bin);
    for (var i = 0; i < keys.length; i++) {
      total += state.bin[keys[i]];
    }
    return total;
  }

  function getBinCount() {
    return Object.keys(state.bin).length;
  }

  var addWasteBtn = $('btn-add-waste');
  if (addWasteBtn) {
    addWasteBtn.addEventListener('click', function() {
    var type = selectedWasteType;
    if (!type) { toast('폐기물 종류를 먼저 선택해주세요'); return; }

    var cfg = wasteMeta[type];
    var amount = parseFloat($('waste-kg-input').value);
    if (!amount || amount < cfg.min) {
      toast('수량을 ' + cfg.min + unitSuffix(cfg.unit) + ' 이상 입력해주세요');
      return;
    }

    var kg = amountToKg(type, amount);
    if (state.bin[type]) {
      state.bin[type] += kg;
    } else {
      state.bin[type] = kg;
    }
    // g 단위 정밀도(소수점 셋째 자리)까지 유지
    state.bin[type] = Math.round(state.bin[type] * 1000) / 1000;

    toast(wasteDisplayName[type] + ' ' + amount + unitSuffix(cfg.unit) + ' 추가했어요');

    selectedWasteType = '';
    renderWastePicker();
    updateAmountControls();
    var tag = $('selected-waste-tag');
    if (tag) {
      tag.textContent = '아직 선택하지 않았어요';
      tag.classList.remove('active');
    }

    renderBinItems();
    renderVendors();
    });
  }

  // kg 슬라이더와 입력창 동기화
  var kgSlider = $('waste-kg-slider');
  if (kgSlider) {
    kgSlider.addEventListener('input', function() {
      var kgInput = $('waste-kg-input');
      if (kgInput) kgInput.value = parseFloat(this.value);
    });
  }

  var kgInput = $('waste-kg-input');
  if (kgInput) {
    kgInput.addEventListener('input', function() {
    var val = parseFloat(this.value);
    var min = parseFloat(this.min);
    var max = parseFloat(this.max);
    if (!isNaN(val) && val >= min && val <= max) {
      var slider = $('waste-kg-slider');
      if (slider) slider.value = val;
    }
    });
  }

  function renderBinItems() {
    var container = $('bin-items');
    if (!container) return;
    var keys = Object.keys(state.bin);
    var totalKg = getBinTotalKg();
    var totalKgEl = $('bin-total-kg');
    if (totalKgEl) totalKgEl.textContent = Math.round(totalKg * 10) / 10;

    if (keys.length === 0) {
      container.innerHTML = '<p style="color:var(--text-muted);font-size:0.85em;">아직 추가된 폐기물이 없어요</p>';
      var clearBtn = $('btn-clear-bin');
      if (clearBtn) clearBtn.classList.add('hidden');
      return;
    }

    var clearBtn = $('btn-clear-bin');
    if (clearBtn) clearBtn.classList.remove('hidden');

    var html = '';
    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      html += '<div class="bin-item">' +
        '<div><span class="bin-item-name">' + wasteDisplayName[key] + '</span>' +
        '<span class="bin-item-kg">' + formatWasteAmount(key, state.bin[key]) + '</span></div>' +
        '<button class="bin-item-remove" data-key="' + key + '" title="제거">&times;</button>' +
      '</div>';
    }
    container.innerHTML = html;

    container.querySelectorAll('.bin-item-remove').forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        var key = this.dataset.key;
        delete state.bin[key];
        renderBinItems();
        renderVendors();
        toast(wasteDisplayName[key] + '를 제거했어요');
      });
    });
  }

  // ===== 업체 목록 =====
  function renderVendors() {
    var listEl = $('vendor-list');
    if (!listEl) return;
    var binKeys = Object.keys(state.bin);
    var totalKg = getBinTotalKg();
    var summary = $('bin-summary');
    var emptyMsg = $('empty-bin-msg');

    if (binKeys.length === 0) {
      if (summary) summary.classList.add('hidden');
      if (emptyMsg) emptyMsg.style.display = 'block';
      listEl.innerHTML = '';
      return;
    }

    if (summary) summary.classList.remove('hidden');
    if (emptyMsg) emptyMsg.style.display = 'none';
    var binCount = $('bin-count');
    if (binCount) binCount.textContent = getBinCount() + '종 / ' + Math.round(totalKg * 10) / 10 + 'kg';

    var html = '';
    for (var i = 0; i < vendors.length; i++) {
      var v = vendors[i];
      var totalPrice = 0;

      for (var j = 0; j < binKeys.length; j++) {
        var key = binKeys[j];
        var kg = state.bin[key];
        var pricePerKg = v.prices[key] || wasteBasePrice[key];
        totalPrice += kg * pricePerKg;
      }
      totalPrice = Math.round(totalPrice);

      var ecoLevel = v.ecoScore >= 75 ? 'high' : v.ecoScore >= 50 ? 'mid' : 'low';

      html += '<div class="vendor-card">' +
        '<div class="vendor-top">' +
          '<span class="vendor-name">' + v.name + '</span>' +
          '<span class="vendor-price" data-vendor-id="' + v.id + '">' + totalPrice.toLocaleString() + '원</span>' +
        '</div>' +
        '<div class="vendor-mid">' +
          '<span class="vendor-address">📍 ' + v.address + '</span>' +
          '<button class="vendor-eco ' + ecoLevel + '" data-vendor-id="' + v.id + '">환경 신뢰도 ' + v.ecoScore + '점</button>' +
        '</div>' +
      '</div>';
    }
    listEl.innerHTML = html;

    // 환경 신뢰도 버튼 이벤트
    listEl.querySelectorAll('.vendor-eco').forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        openEcoModal(this.dataset.vendorId);
      });
    });

    // 매입 가격 클릭 이벤트
    listEl.querySelectorAll('.vendor-price').forEach(function(el) {
      el.addEventListener('click', function(e) {
        e.stopPropagation();
        openReceipt(this.dataset.vendorId);
      });
    });
  }

  // ===== 환경 신뢰도 모달 =====
  function openEcoModal(vendorId) {
    var v = null;
    for (var i = 0; i < vendors.length; i++) {
      if (vendors[i].id === vendorId) { v = vendors[i]; break; }
    }
    if (!v) return;

    var nameEl = $('eco-vendor-name');
    if (nameEl) nameEl.textContent = v.name + ' - 환경 신뢰도';

    var ecoLevel = v.ecoScore >= 75 ? 'high' : v.ecoScore >= 50 ? 'mid' : 'low';
    var scoreEl = $('eco-score');
    if (scoreEl) {
      scoreEl.className = 'eco-score ' + ecoLevel;
      scoreEl.innerHTML = '<span class="score-value">' + v.ecoScore + '점</span> / 100점';
    }

    var vioEl = $('eco-violations');
    if (!vioEl) { openModal('modal-eco'); return; }
    if (v.violations.length === 0) {
      vioEl.innerHTML = '<p class="empty">위반 내역이 없는 깨끗한 업체예요</p>';
    } else {
      var vioHtml = '';
      for (var j = 0; j < v.violations.length; j++) {
        var vio = v.violations[j];
        vioHtml += '<div class="violation-item"><div class="vio-date">' + vio.date + '</div>' + vio.desc + '</div>';
      }
      vioEl.innerHTML = vioHtml;
    }

    openModal('modal-eco');
  }

  // ===== 영수증 모달 =====
  function openReceipt(vendorId) {
    var v = null;
    for (var i = 0; i < vendors.length; i++) {
      if (vendors[i].id === vendorId) { v = vendors[i]; break; }
    }
    if (!v) return;

    var binKeys = Object.keys(state.bin);
    var nameEl = $('receipt-name');
    var addrEl = $('receipt-addr');
    var dateEl = $('receipt-date');
    if (nameEl) nameEl.textContent = v.name;
    if (addrEl) addrEl.textContent = v.address;
    if (dateEl) dateEl.textContent = '작성일: ' + new Date().toLocaleDateString('ko-KR');

    var totalPrice = 0;
    var rowsHtml = '';
    for (var j = 0; j < binKeys.length; j++) {
      var key = binKeys[j];
      var kg = state.bin[key];
      var pricePerKg = v.prices[key] || wasteBasePrice[key];
      var subtotal = Math.round(kg * pricePerKg);
      totalPrice += subtotal;
      rowsHtml += '<tr>' +
        '<td>' + wasteDisplayName[key] + '</td>' +
        '<td>' + formatUnitPrice(key, pricePerKg) + '</td>' +
        '<td>' + formatWasteAmount(key, kg) + '</td>' +
        '<td class="r-align">' + subtotal.toLocaleString() + '원</td>' +
      '</tr>';
    }
    var itemsEl = $('receipt-items');
    var totalEl = $('receipt-total');
    if (itemsEl) itemsEl.innerHTML = rowsHtml;
    if (totalEl) totalEl.textContent = Math.round(totalPrice).toLocaleString() + '원';

    openModal('modal-receipt');
  }

  // ===== 이벤트 =====
  var fabBtn = $('btn-trash-fab');
  if (fabBtn) {
    fabBtn.addEventListener('click', function() {
      renderBinItems();
      openModal('modal-bin');
      updateAmountControls(selectedWasteType);
    });
  }

  var openBinBtn = $('btn-open-bin');
  if (openBinBtn) {
    openBinBtn.addEventListener('click', function() {
      renderBinItems();
      openModal('modal-bin');
      updateAmountControls(selectedWasteType);
    });
  }

  var clearBinBtn = $('btn-clear-bin');
  if (clearBinBtn) {
    clearBinBtn.addEventListener('click', function() {
      if (getBinCount() === 0) return;
      if (confirm('쓰레기통에 있는 모든 폐기물을 비울까요?')) {
        state.bin = {};
        renderBinItems();
        renderVendors();
        toast('쓰레기통을 비웠어요');
      }
    });
  }

  // 영수증 이미지 저장
  var downloadBtn = $('btn-download-receipt');
  if (downloadBtn) {
    downloadBtn.addEventListener('click', function() {
    var box = $('receipt-content');
    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d');

    var style = window.getComputedStyle(box);
    var width = box.offsetWidth;
    var height = box.offsetHeight;

    // 여백 추가
    canvas.width = width + 40;
    canvas.height = height + 40;
    ctx.fillStyle = '#fdfdfd';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#1a202c';
    ctx.font = '14px sans-serif';

    var lines = [];
    var texts = box.querySelectorAll('*');
    for (var i = 0; i < texts.length; i++) {
      var t = texts[i];
      if (t.children.length === 0 && t.textContent.trim()) {
        var rect = t.getBoundingClientRect();
        var boxRect = box.getBoundingClientRect();
        var x = rect.left - boxRect.left + 20;
        var y = rect.top - boxRect.top + 20;
        var fontSize = parseFloat(style.fontSize || '14');
        var fontWeight = window.getComputedStyle(t).fontWeight;

        ctx.font = (fontWeight === '700' || fontWeight === '800' ? 'bold ' : '') + fontSize + 'px sans-serif';
        ctx.fillStyle = window.getComputedStyle(t).color || '#1a202c';
        ctx.textBaseline = 'top';
        ctx.fillText(t.textContent.trim(), x, y + 4);
      }
    }

    var link = document.createElement('a');
    link.download = '매입계산서_' + $('receipt-name').textContent + '.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
    toast('계산서를 이미지로 저장했어요');
    });
  }

  // ===== 초기화 =====
  function init() {
    renderVendors();
  }

  init();
})();
