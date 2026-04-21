(function () {
  'use strict';

  // =====================================================
  // 테마 토글 (main.js initThemeToggle과 동일 로직 재현)
  // =====================================================
  const themeBtn = document.querySelector('.js-theme-toggle');
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      const isLight = document.documentElement.classList.toggle('light');
      try {
        localStorage.setItem('theme', isLight ? 'light' : 'dark');
      } catch (e) { /* 저장 실패 무시 */ }
    });
  }

  // =====================================================
  // 상수 & 설정
  //  - 김간호 = 간호 실습생 (플레이어)
  //  - 적 = 수간호사 (장애물)
  //  - 투사체 = 빨간 F (구 "주사기 방울")
  //  - 음표 = 작곡 재료 (수집물)
  // =====================================================
  const TILE = 20;
  const COLS = 32;
  const ROWS = 20;
  const CANVAS_W = COLS * TILE; // 640
  const CANVAS_H = ROWS * TILE; // 400
  const GAME_DURATION = 45; // 초 (30→45로 연장)
  const STORAGE_KEY = 'pixelNurseBest';

  // 성공 판정 목표 점수 (절대값) — 콤보 보너스로 점수 인플레 보정
  const TARGET_SCORE = { easy: 22, normal: 16, hard: 12 };

  // 난이도별 기초/최대 속도 + 추가 스폰 주기 + F 상한
  // baseSpeed → maxSpeed: 시간 경과에 따라 선형 보간
  const DIFFICULTY = {
    easy:   { baseSpeed: 140, maxSpeed: 210, notes: 5, noteTtl: Infinity, obstacles: 1, obsBaseSpeed: 60,  obsMaxSpeed: 110, stun: 400, map: 'easy',   spawnInterval: [3.5, 2.0], maxObstacles: 2 },
    normal: { baseSpeed: 150, maxSpeed: 230, notes: 4, noteTtl: 6000,     obstacles: 2, obsBaseSpeed: 90,  obsMaxSpeed: 160, stun: 500, map: 'normal', spawnInterval: [2.8, 1.2], maxObstacles: 4 },
    hard:   { baseSpeed: 160, maxSpeed: 250, notes: 3, noteTtl: 4000,     obstacles: 3, obsBaseSpeed: 120, obsMaxSpeed: 210, stun: 700, map: 'hard',   spawnInterval: [2.0, 0.7], maxObstacles: 6 }
  };

  // 콤보 단계별 수집 사운드 — C장조 스케일 (C4→D4→E4→G4→A4→C5→D5→E5→G5→A5)
  const SCALE_FREQS = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25, 783.99, 880.00];

  // 콤보 안전지대 최소 맨해튼 거리 (타일)
  const SPAWN_SAFE_DIST = 4;

  // 컷씬 사전 — 정적 상수이므로 textContent로 안전하게 주입
  const CUTSCENES = {
    intro: {
      title: '어느 한적한 병동의 오후',
      text: '수간호사가 순찰을 돈다. 그 틈을 타, 김간호는 주머니 속 작곡 노트를 슬쩍 꺼낸다… 음표를 모으자.'
    },
    mid1: {
      title: '김간호의 속마음 · 15초',
      text: '"후렴구에 들어갈 코드를 아직 못 찾았어… 조금만 더!"'
    },
    mid2: {
      title: '수간호사의 눈초리 · 30초',
      text: '"김간호 학생, 거기서 뭐 하나?" 수간호사의 F가 더 거세게 날아든다.'
    }
  };

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // =====================================================
  // 난이도 보간 헬퍼
  //  - curveT(): 0(시작) → 1(종료)의 정규화된 경과 시간
  //  - lerp(): [a, b] 선형 보간 (0~1 클램프)
  //  - reduced-motion이어도 난이도 곡선은 유지(시각 효과만 줄임)
  // =====================================================
  function lerp(a, b, t) {
    return a + (b - a) * Math.max(0, Math.min(1, t));
  }
  function curveT() {
    return 1 - (state.timeLeft / GAME_DURATION);
  }
  function currentPlayerSpeed() {
    const d = DIFFICULTY[state.difficulty];
    return lerp(d.baseSpeed, d.maxSpeed, curveT());
  }
  function currentObsSpeed() {
    const d = DIFFICULTY[state.difficulty];
    return lerp(d.obsBaseSpeed, d.obsMaxSpeed, curveT());
  }

  // =====================================================
  // 맵 생성 — 0=빈칸, 1=벽
  // =====================================================
  function buildMap(kind) {
    const m = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
    // 외곽 벽
    for (let c = 0; c < COLS; c++) { m[0][c] = 1; m[ROWS - 1][c] = 1; }
    for (let r = 0; r < ROWS; r++) { m[r][0] = 1; m[r][COLS - 1] = 1; }

    if (kind === 'easy') {
      // 중앙 기둥 한 개
      for (let r = 8; r <= 11; r++) {
        for (let c = 15; c <= 16; c++) m[r][c] = 1;
      }
    } else if (kind === 'normal') {
      // 중앙 가로 복도 + 방 2개 (좌상, 우하)
      // 좌상 방: 벽으로 둘러싸인 구역 (복도 개방구 있음)
      for (let c = 4; c <= 10; c++) m[5][c] = 1;
      for (let r = 2; r <= 5; r++) m[r][10] = 1;
      m[3][10] = 0; // 문

      // 우하 방
      for (let c = 21; c <= 27; c++) m[14][c] = 1;
      for (let r = 14; r <= 17; r++) m[r][21] = 1;
      m[16][21] = 0; // 문

      // 중앙 기둥
      for (let r = 9; r <= 10; r++) {
        for (let c = 15; c <= 16; c++) m[r][c] = 1;
      }
    } else {
      // hard: 모서리 방 4개 + 기둥 다수
      // 좌상
      for (let c = 4; c <= 9; c++) m[5][c] = 1;
      for (let r = 2; r <= 5; r++) m[r][9] = 1;
      m[3][9] = 0;
      // 우상
      for (let c = 22; c <= 27; c++) m[5][c] = 1;
      for (let r = 2; r <= 5; r++) m[r][22] = 1;
      m[3][22] = 0;
      // 좌하
      for (let c = 4; c <= 9; c++) m[14][c] = 1;
      for (let r = 14; r <= 17; r++) m[r][9] = 1;
      m[16][9] = 0;
      // 우하
      for (let c = 22; c <= 27; c++) m[14][c] = 1;
      for (let r = 14; r <= 17; r++) m[r][22] = 1;
      m[16][22] = 0;
      // 중앙 기둥들
      for (let r = 9; r <= 10; r++) { m[r][12] = 1; m[r][19] = 1; }
      m[7][15] = 1; m[7][16] = 1;
      m[12][15] = 1; m[12][16] = 1;
    }

    return m;
  }

  function isWallAt(map, px, py, w, h) {
    // 픽셀 AABB → 타일 충돌
    const left = Math.floor(px / TILE);
    const right = Math.floor((px + w - 1) / TILE);
    const top = Math.floor(py / TILE);
    const bottom = Math.floor((py + h - 1) / TILE);
    for (let r = top; r <= bottom; r++) {
      for (let c = left; c <= right; c++) {
        if (r < 0 || c < 0 || r >= ROWS || c >= COLS) return true;
        if (map[r][c] === 1) return true;
      }
    }
    return false;
  }

  /**
   * 빈 타일 탐색
   * @param {number[][]} map - 타일 맵
   * @param {() => number} rng - 난수 생성기
   * @param {{c:number,r:number}[]} [avoid] - 회피 대상 타일 배열 (맨해튼 거리 SPAWN_SAFE_DIST 이상 확보)
   * @returns {{c:number,r:number}}
   */
  function findEmptyTile(map, rng, avoid) {
    const hasAvoid = Array.isArray(avoid) && avoid.length > 0;
    // 1차: 안전지대 조건 만족하는 타일 우선
    if (hasAvoid) {
      for (let tries = 0; tries < 200; tries++) {
        const c = 1 + Math.floor(rng() * (COLS - 2));
        const r = 1 + Math.floor(rng() * (ROWS - 2));
        if (map[r][c] !== 0) continue;
        let ok = true;
        for (const a of avoid) {
          if (Math.abs(a.c - c) + Math.abs(a.r - r) < SPAWN_SAFE_DIST) { ok = false; break; }
        }
        if (ok) return { c, r };
      }
    }
    // 2차: 일반 탐색
    for (let tries = 0; tries < 200; tries++) {
      const c = 1 + Math.floor(rng() * (COLS - 2));
      const r = 1 + Math.floor(rng() * (ROWS - 2));
      if (map[r][c] === 0) return { c, r };
    }
    // fallback 선형 탐색
    for (let r = 1; r < ROWS - 1; r++) {
      for (let c = 1; c < COLS - 1; c++) {
        if (map[r][c] === 0) return { c, r };
      }
    }
    return { c: 1, r: 1 };
  }

  /**
   * 플레이어가 현재 점유한 타일 좌표 반환 (스폰 안전지대 avoid용)
   */
  function playerTile() {
    const p = state.player;
    return {
      c: Math.floor((p.x + p.w / 2) / TILE),
      r: Math.floor((p.y + p.h / 2) / TILE)
    };
  }

  // =====================================================
  // 사운드 (WebAudio) — 짧은 사인파 톤
  // =====================================================
  let audioCtx = null;
  function playTone(freq, duration) {
    try {
      if (!audioCtx) {
        const Ctor = window.AudioContext || window.webkitAudioContext;
        if (!Ctor) return;
        audioCtx = new Ctor();
      }
      if (audioCtx.state === 'suspended') audioCtx.resume();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.15, audioCtx.currentTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
      osc.connect(gain).connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + duration + 0.02);
    } catch (e) { /* 오디오 실패 무시 */ }
  }

  // =====================================================
  // 렌더링
  // =====================================================
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  function isLightTheme() {
    return document.documentElement.classList.contains('light');
  }

  function themeColors() {
    const light = isLightTheme();
    return {
      floorA: light ? '#eceaf0' : '#1a1825',
      floorB: light ? '#e2dfe8' : '#15131e',
      wall:   light ? '#d4ccd6' : '#2a2233',
      wallHi: light ? '#bfb6c0' : '#3a3245',
      brand:  light ? '#b07068' : '#c4847a',
      brandHi:light ? '#c48a82' : '#d4a49c'
    };
  }

  function drawMap(map) {
    const col = themeColors();
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const x = c * TILE, y = r * TILE;
        if (map[r][c] === 1) {
          ctx.fillStyle = col.wall;
          ctx.fillRect(x, y, TILE, TILE);
          // 블록 하이라이트 (위·왼쪽 1px)
          ctx.fillStyle = col.wallHi;
          ctx.fillRect(x, y, TILE, 2);
          ctx.fillRect(x, y, 2, TILE);
        } else {
          // 체크 바닥
          ctx.fillStyle = ((r + c) & 1) ? col.floorA : col.floorB;
          ctx.fillRect(x, y, TILE, TILE);
        }
      }
    }
  }

  // 픽셀 간호사 (16x20) — 치비/SD 비율 (2.2등신)
  // '.'=투명, 'S'=피부, 'H'=머리카락, 'W'=흰옷, 'D'=모자 음영, 'C'=코럴십자
  // 'E'=눈 동공, 'L'=눈 하이라이트(흰자), 'R'=볼터치, 'M'=입, 'P'=하의, 'B'=신발
  // 방향(dir): 'down','up','left','right', 프레임(frame): 0 idle, 1/2 step
  const NURSE_W = 16;
  const NURSE_H = 20;
  function nurseSprite(dir, frame) {
    // 16x20 — 머리(행 1-10, 50%) + 몸통/다리(행 11-19)
    const base = [
      '................', // 0
      '....WWWWWWWW....', // 1 모자 상단
      '...WWWWCCWWWW...', // 2 모자 중단 + 코럴 십자
      '..WDDDDDDDDDDW..', // 3 모자 그림자 라인
      '..HHSSSSSSSSHH..', // 4 앞머리 + 이마
      '..HSSSSSSSSSSH..', // 5
      '..SSEESSSSEESS..', // 6 눈 동공
      '..SSELSSSSELSS..', // 7 눈 하이라이트
      '..RSSSSMMSSSSR..', // 8 볼터치 + 작은 입
      '..SSSSSSSSSSSS..', // 9
      '...SSSSSSSSSS...', // 10 턱
      '....WWWWWWWW....', // 11 어깨/상의 시작
      '...WWWWCCWWWW...', // 12 가슴 십자 상단
      '...WWWCCCCWWW...', // 13 가슴 십자 중단
      '....WWWWWWWW....', // 14 상의 밑단
      '....PPPPPPPP....', // 15 하의 시작
      '....PPP..PPP....', // 16
      '....PPP..PPP....', // 17
      '....BB....BB....', // 18 발
      '....BB....BB....'  // 19
    ];

    // 방향별 얼굴 처리
    if (dir === 'up') {
      // 뒷모습 — 얼굴 자리 전체를 머리카락으로
      base[4] = '..HHHHHHHHHHHH..';
      base[5] = '..HHHHHHHHHHHH..';
      base[6] = '..HHHHHHHHHHHH..';
      base[7] = '..HHHHHHHHHHHH..';
      base[8] = '..HHHHHHHHHHHH..';
      base[9] = '..HHHHHHHHHHHH..';
      base[10] = '...HHHHHHHHHH...';
    } else if (dir === 'left') {
      // 오른쪽 눈만 + 오른쪽 볼
      base[6] = '..SSSSSSSSEESS..';
      base[7] = '..SSSSSSSSELSS..';
      base[8] = '..SSSSSMMSSSSR..';
    } else if (dir === 'right') {
      // 왼쪽 눈만 + 왼쪽 볼
      base[6] = '..SSEESSSSSSSS..';
      base[7] = '..SSELSSSSSSSS..';
      base[8] = '..RSSSSMMSSSSS..';
    }

    // 걷기 프레임 — 발만 교차 (행 18-19)
    if (frame === 1) {
      base[18] = '....BB...BBB....';
      base[19] = '....BBB...BB....';
    } else if (frame === 2) {
      base[18] = '....BBB...BB....';
      base[19] = '....BB...BBB....';
    }

    return base;
  }

  function drawNurse(x, y, dir, frame) {
    const sprite = nurseSprite(dir, frame);
    const palette = {
      'S': '#fbe0d0', // 피부
      'H': '#2e2020', // 머리카락
      'W': '#ffffff', // 흰옷/모자
      'D': '#e6dde6', // 모자 음영
      'C': '#c4847a', // 코럴 십자
      'P': '#e8bcb4', // 하의
      'B': '#a85f56', // 신발
      'E': '#2a1f25', // 눈 동공
      'L': '#ffffff', // 흰자 하이라이트
      'R': '#f5a8a0', // 볼터치
      'M': '#c4847a'  // 입
    };
    const SCALE = 2;
    // 히트박스(14x14) 기준 중앙 정렬. 머리가 커졌으므로 oy를 -24로 내림.
    const ox = Math.round(x) - 8;
    let oy = Math.round(y) - 24;
    // 걷기 바운스 — reduced-motion 비활성
    if (frame !== 0 && !reducedMotion) oy -= 1;
    for (let r = 0; r < 20; r++) {
      const row = sprite[r];
      for (let c = 0; c < 16; c++) {
        const ch = row[c];
        if (ch === '.' || !palette[ch]) continue;
        ctx.fillStyle = palette[ch];
        ctx.fillRect(ox + c * SCALE, oy + r * SCALE, SCALE, SCALE);
      }
    }
  }

  function drawNote(x, y, bob) {
    const col = themeColors();
    const ox = Math.round(x);
    const oy = Math.round(y + bob);
    // 12x12 8분 음표
    // 머리 (타원형 블록)
    ctx.fillStyle = col.brand;
    ctx.fillRect(ox + 1, oy + 7, 6, 4);
    ctx.fillRect(ox + 2, oy + 6, 4, 1);
    ctx.fillRect(ox + 2, oy + 11, 4, 1);
    // 하이라이트
    ctx.fillStyle = col.brandHi;
    ctx.fillRect(ox + 2, oy + 7, 1, 1);
    // 기둥
    ctx.fillStyle = col.brand;
    ctx.fillRect(ox + 6, oy + 1, 1, 7);
    // 깃발
    ctx.fillRect(ox + 6, oy + 1, 4, 1);
    ctx.fillRect(ox + 9, oy + 1, 1, 3);
    ctx.fillRect(ox + 7, oy + 4, 2, 1);
  }

  function drawObstacle(x, y) {
    // 12x12 빨간 'F' 투사체 — 수간호사가 던지는 낙제점
    const ox = Math.round(x);
    const oy = Math.round(y);
    const red = isLightTheme() ? '#e8283a' : '#ff3b4e';
    // 외곽 섀도
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.fillRect(ox + 1, oy + 1, 12, 12);
    // 흰 테두리 (가독성 확보)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(ox, oy, 12, 12);
    // F 본체
    ctx.fillStyle = red;
    ctx.fillRect(ox + 2, oy + 1, 8, 2); // 상단 가로
    ctx.fillRect(ox + 2, oy + 1, 2, 10); // 세로 줄기
    ctx.fillRect(ox + 2, oy + 5, 6, 2); // 중단 가로
  }

  // =====================================================
  // 게임 상태
  // =====================================================
  const state = {
    running: false,
    difficulty: 'easy',
    map: null,
    player: { x: 0, y: 0, w: 14, h: 14, dir: 'down', frameAcc: 0, frame: 0, stunUntil: 0 },
    notes: [],      // {x, y, born, bobSeed}
    obstacles: [],  // {x, y, dx, dy}
    particles: [],  // {x, y, vx, vy, life, maxLife}
    keys: Object.create(null),
    score: 0,
    combo: 0,
    maxCombo: 0,
    hits: 0,
    collected: 0,
    timeLeft: GAME_DURATION,
    lastTs: 0,
    rafId: null,
    nextSpawnAt: 0,           // 다음 수간호사 F 스폰 예정 시각(ms)
    cutscenesShown: null,     // Set — 이미 본 컷씬 id 기록
    best: { easy: 0, normal: 0, hard: 0 }
  };

  function loadBest() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        state.best.easy = Number(parsed.easy) || 0;
        state.best.normal = Number(parsed.normal) || 0;
        state.best.hard = Number(parsed.hard) || 0;
      }
    } catch (e) { /* 무시 */ }
  }

  function saveBest() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.best));
    } catch (e) { /* 무시 */ }
  }

  // =====================================================
  // DOM 참조 & UI
  // =====================================================
  const hudTime = document.getElementById('hudTime');
  const hudScore = document.getElementById('hudScore');
  const hudCombo = document.getElementById('hudCombo');
  const hudBest = document.getElementById('hudBest');
  const overlayStart = document.getElementById('overlayStart');
  const overlayEnd = document.getElementById('overlayEnd');
  const endScore = document.getElementById('endScore');
  const endRecord = document.getElementById('endRecord');
  const btnStart = document.getElementById('btnStart');
  const btnReplay = document.getElementById('btnReplay');
  const diffBtns = document.querySelectorAll('.game-difficulty__btn');
  const canvasWrap = document.querySelector('.game-canvas-wrap');
  const startGoalEl = document.getElementById('startGoal');
  const statMaxCombo = document.getElementById('statMaxCombo');
  const statHits = document.getElementById('statHits');
  const statAccuracy = document.getElementById('statAccuracy');

  function updateBestHud() {
    if (hudBest) hudBest.textContent = String(state.best[state.difficulty] || 0);
  }

  /**
   * 시작 오버레이 목표 점수 표시 갱신 (C12)
   * 난이도 변경 / 초기 로드 시 호출
   */
  function updateStartGoal() {
    if (!startGoalEl) return;
    const strongEl = startGoalEl.querySelector('strong');
    if (strongEl) strongEl.textContent = String(TARGET_SCORE[state.difficulty]);
  }

  /**
   * HUD 콤보 슬롯 갱신 + 애니메이션/상태 클래스 (C7)
   * @param {boolean} bump - 수집 성공 시 true → bump 애니메이션
   */
  function updateComboHud(bump) {
    if (!hudCombo) return;
    hudCombo.textContent = String(state.combo);

    // 3연쇄 이상이면 hot 톤, 미만이면 제거
    if (state.combo >= 3) hudCombo.classList.add('is-combo-hot');
    else hudCombo.classList.remove('is-combo-hot');

    // 바운스 애니메이션 — reduced-motion 비활성
    if (bump && !reducedMotion) {
      // 기존 클래스 제거 후 재부여하여 재생 가능하도록
      hudCombo.classList.remove('is-combo-bump');
      // 강제 reflow — 애니메이션 재시작 트리거
      // eslint-disable-next-line no-unused-expressions
      void hudCombo.offsetWidth;
      hudCombo.classList.add('is-combo-bump');
      hudCombo.addEventListener('animationend', () => {
        hudCombo.classList.remove('is-combo-bump');
      }, { once: true });
    }
  }

  diffBtns.forEach(b => {
    b.addEventListener('click', () => {
      // 게임 진행 중에는 난이도 전환 차단 (Critical #3)
      if (state.running) return;
      diffBtns.forEach(x => x.setAttribute('aria-checked', 'false'));
      b.setAttribute('aria-checked', 'true');
      state.difficulty = b.dataset.diff;
      updateBestHud();
      updateStartGoal();
    });
  });

  btnStart.addEventListener('click', () => {
    // iOS 오디오 언락 — 첫 유저 제스처에서 무음 톤
    playTone(0, 0.001);
    startGame();
  });
  // 리플레이 — 시작 오버레이를 다시 거치지 않고 즉시 재시작 (Critical #1)
  btnReplay.addEventListener('click', () => {
    overlayEnd.classList.add('is-hidden');
    startGame();
  });

  // 키보드 입력
  const KEY_MAP = {
    'ArrowUp': 'up', 'KeyW': 'up',
    'ArrowDown': 'down', 'KeyS': 'down',
    'ArrowLeft': 'left', 'KeyA': 'left',
    'ArrowRight': 'right', 'KeyD': 'right'
  };

  /**
   * 오버레이(시작/종료/컷씬) 중 하나라도 열려있는지 여부 (C2)
   */
  function isAnyOverlayOpen() {
    const cutOverlay = document.getElementById('overlayCutscene');
    return (overlayStart && !overlayStart.classList.contains('is-hidden')) ||
           (overlayEnd && !overlayEnd.classList.contains('is-hidden')) ||
           (cutOverlay && !cutOverlay.classList.contains('is-hidden'));
  }

  window.addEventListener('keydown', (e) => {
    const dir = KEY_MAP[e.code];
    if (!dir) return;

    // 오버레이가 열려 있으면 키 누적 차단 + 화살표 스크롤 방지 (Critical #2)
    if (isAnyOverlayOpen()) {
      state.keys[dir] = false;
      e.preventDefault();
      return;
    }

    state.keys[dir] = true;
    // 스크롤 방지
    if (state.running) e.preventDefault();
  });
  window.addEventListener('keyup', (e) => {
    const dir = KEY_MAP[e.code];
    if (dir) state.keys[dir] = false;
  });

  // =====================================================
  // 게임 시작 / 종료
  // =====================================================
  function startGame() {
    const diff = DIFFICULTY[state.difficulty];
    state.map = buildMap(diff.map);
    state.score = 0;
    state.combo = 0;
    state.maxCombo = 0;
    state.hits = 0;
    state.collected = 0;
    state.timeLeft = GAME_DURATION;
    state.notes = [];
    state.obstacles = [];
    state.particles = [];
    state.keys = Object.create(null);
    state.player.x = TILE * 2 + 3;
    state.player.y = TILE * 2 + 3;
    state.player.dir = 'down';
    state.player.frame = 0;
    state.player.frameAcc = 0;
    state.player.stunUntil = 0;

    // 컷씬 추적 Set 초기화
    state.cutscenesShown = new Set();

    // 초기 음표 스폰 (플레이어 주변 회피)
    for (let i = 0; i < diff.notes; i++) spawnNote();
    // 장애물(F) 초기 스폰 (플레이어 주변 4타일 내 금지)
    for (let i = 0; i < diff.obstacles; i++) spawnObstacle();

    // 다음 추가 스폰 예정 시각 — 첫 주기는 baseInterval(spawnInterval[0])
    state.nextSpawnAt = performance.now() + diff.spawnInterval[0] * 1000;

    overlayStart.classList.add('is-hidden');
    overlayEnd.classList.add('is-hidden');
    const cutOverlay = document.getElementById('overlayCutscene');
    if (cutOverlay) cutOverlay.classList.add('is-hidden');

    hudTime.textContent = String(GAME_DURATION);
    hudTime.classList.remove('is-warning');
    hudScore.textContent = '0';
    if (hudCombo) {
      hudCombo.textContent = '0';
      hudCombo.classList.remove('is-combo-hot', 'is-combo-bump');
    }
    updateBestHud();

    state.running = true;
    state.lastTs = performance.now();
    if (state.rafId) cancelAnimationFrame(state.rafId);
    state.rafId = requestAnimationFrame(loop);

    // 인트로 컷씬 — 스폰/상태 초기화가 끝난 직후 노출
    setTimeout(() => triggerCutscene('intro'), 250);
  }

  function endGame() {
    state.running = false;
    if (state.rafId) cancelAnimationFrame(state.rafId);
    state.rafId = null;

    // HUD 콤보 초기 톤 정리 (다음 게임 대비)
    if (hudCombo) {
      hudCombo.classList.remove('is-combo-bump', 'is-combo-hot');
    }

    const prevBest = state.best[state.difficulty] || 0;
    let newRecord = false;
    if (state.score > prevBest) {
      state.best[state.difficulty] = state.score;
      saveBest();
      newRecord = true;
    }
    updateBestHud();

    // 목표 점수 대비 성공/실패 판정
    const target = TARGET_SCORE[state.difficulty];
    const score = state.score;
    const success = score >= target;
    const endTitle = document.getElementById('endTitle');
    const endStory = document.getElementById('endStory');

    if (endTitle && endStory) {
      // 기본 클래스 초기화 후 분기
      endStory.classList.remove('game-overlay__ending--fail');
      endStory.classList.add('game-overlay__ending');

      if (success) {
        endTitle.textContent = '노래를 무사히 만들었어요!';
        if (newRecord) {
          endStory.textContent = `음표 ${score}개로 신곡 완성. 수간호사도 모르는 김간호의 첫 트랙이 태어났다.`;
        } else {
          endStory.textContent = `${score}개. 좋은 후렴이지만, 김간호는 더 높은 코드를 원한다.`;
        }
        playTone(988, 0.22);
      } else {
        endTitle.textContent = '수간호사에게 붙잡혔어요…';
        // 목표 -2점 이상이면 아쉬움 문구
        if (score >= target - 2) {
          endStory.textContent = `${score}점. 한 음만 더 있었으면… 다음 교대 시간엔 반드시.`;
        } else {
          endStory.textContent = `수간호사의 F를 다 피하지 못했다. 김간호는 오늘 F학점을 맞아버렸다. (목표 ${target}점 / 획득 ${score}점)`;
        }
        endStory.classList.add('game-overlay__ending--fail');
        playTone(165, 0.3);
      }
    }

    // 통계 갱신 (C10)
    if (statMaxCombo) statMaxCombo.textContent = String(state.maxCombo);
    if (statHits) statHits.textContent = String(state.hits);
    if (statAccuracy) {
      const denom = state.collected + state.hits;
      const accuracy = denom === 0 ? 100 : Math.round((state.collected / denom) * 100);
      statAccuracy.textContent = `${accuracy}%`;
    }

    endScore.textContent = String(score);
    endRecord.textContent = newRecord ? '신기록!' : '';
    overlayEnd.classList.remove('is-hidden');
  }

  // =====================================================
  // 컷씬 — 게임 루프 일시정지 후 스토리 문구 표시
  // =====================================================
  /**
   * 컷씬 표시 + 게임 루프 정지
   * @param {'intro'|'mid1'|'mid2'} id - 컷씬 식별자
   */
  function triggerCutscene(id) {
    if (!CUTSCENES[id] || !state.cutscenesShown || state.cutscenesShown.has(id)) return;
    const overlay = document.getElementById('overlayCutscene');
    const titleEl = document.getElementById('cutsceneTitle');
    const textEl = document.getElementById('cutsceneText');
    if (!overlay || !titleEl || !textEl) return;

    state.cutscenesShown.add(id);
    state.running = false;
    if (state.rafId) {
      cancelAnimationFrame(state.rafId);
      state.rafId = null;
    }
    // 재개 시 오작동 방지 — 입력 초기화
    state.keys = Object.create(null);

    // 동적 텍스트는 textContent로만 주입 (XSS 차단)
    titleEl.textContent = CUTSCENES[id].title;
    textEl.textContent = CUTSCENES[id].text;
    overlay.classList.remove('is-hidden');

    const btn = document.getElementById('btnCutsceneContinue');
    if (btn) btn.focus({ preventScroll: true });
  }

  function resumeFromCutscene() {
    const overlay = document.getElementById('overlayCutscene');
    if (!overlay || overlay.classList.contains('is-hidden')) return;
    overlay.classList.add('is-hidden');
    state.running = true;
    const now = performance.now();
    state.lastTs = now; // dt 폭주 방지
    // 컷씬 중 흐른 시간 동안 누적된 F 스폰 타이머 보정 (Critical #5)
    // → 재개 직후 한 주기 분 만큼 대기
    const diff = DIFFICULTY[state.difficulty];
    const intervalSec = lerp(diff.spawnInterval[0], diff.spawnInterval[1], curveT());
    state.nextSpawnAt = now + intervalSec * 1000;
    state.rafId = requestAnimationFrame(loop);
  }

  // 컷씬 닫기 이벤트 — "계속하기" 버튼 + Esc
  const btnCutsceneContinue = document.getElementById('btnCutsceneContinue');
  if (btnCutsceneContinue) {
    btnCutsceneContinue.addEventListener('click', resumeFromCutscene);
  }
  // 컷씬 닫기 키 확장 — Escape / Enter / Space (Major #7)
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' && e.key !== 'Enter' && e.key !== ' ') return;
    const overlay = document.getElementById('overlayCutscene');
    if (overlay && !overlay.classList.contains('is-hidden')) {
      e.preventDefault();
      resumeFromCutscene();
    }
  });

  // =====================================================
  // 스폰 로직
  // =====================================================
  function spawnNote() {
    // 플레이어 주변 안전지대 회피 (Major #10)
    const avoid = state.map ? [playerTile()] : [];
    const tile = findEmptyTile(state.map, Math.random, avoid);
    state.notes.push({
      x: tile.c * TILE + (TILE - 12) / 2,
      y: tile.r * TILE + (TILE - 12) / 2,
      born: performance.now(),
      bobSeed: Math.random() * Math.PI * 2
    });
  }

  function spawnObstacle() {
    // 플레이어 주변 4타일 내 F 스폰 금지 (Major #9, Major #10)
    const avoid = state.map ? [playerTile()] : [];
    const tile = findEmptyTile(state.map, Math.random, avoid);
    const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
    const d = dirs[Math.floor(Math.random() * 4)];
    state.obstacles.push({
      x: tile.c * TILE + (TILE - 12) / 2,
      y: tile.r * TILE + (TILE - 12) / 2,
      dx: d[0],
      dy: d[1]
    });
  }

  /**
   * 파티클 스폰 — 수집 쾌감 시각화 (C8)
   * reduced-motion에선 호출 측에서 생략
   * @param {number} cx - 중심 x
   * @param {number} cy - 중심 y
   * @param {number} count - 파티클 개수
   */
  function spawnParticles(cx, cy, count) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 60 + Math.random() * 90;
      const maxLife = 0.4 + Math.random() * 0.3;
      state.particles.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 30, // 초기 상향
        life: maxLife,
        maxLife: maxLife
      });
    }
  }

  /**
   * 파티클 업데이트 — 중력 가속 + life 감소
   * @param {number} dt - 델타타임(s)
   */
  function updateParticles(dt) {
    const arr = state.particles;
    for (let i = arr.length - 1; i >= 0; i--) {
      const p = arr[i];
      p.life -= dt;
      if (p.life <= 0) {
        arr.splice(i, 1);
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 120 * dt; // 중력
    }
  }

  // =====================================================
  // 매 프레임 업데이트
  // =====================================================
  function update(dt, now) {
    const diff = DIFFICULTY[state.difficulty];
    const p = state.player;
    const stunned = now < p.stunUntil;

    // 이동
    let vx = 0, vy = 0;
    if (!stunned) {
      if (state.keys.up) { vy -= 1; p.dir = 'up'; }
      if (state.keys.down) { vy += 1; p.dir = 'down'; }
      if (state.keys.left) { vx -= 1; p.dir = 'left'; }
      if (state.keys.right) { vx += 1; p.dir = 'right'; }
      if (vx !== 0 && vy !== 0) { vx *= 0.7071; vy *= 0.7071; }
    }

    // 시간 경과에 따른 플레이어 속도 보간
    const pSpeed = currentPlayerSpeed();
    const dx = vx * pSpeed * dt;
    const dy = vy * pSpeed * dt;

    // X축 이동 → 충돌
    if (dx !== 0) {
      const nx = p.x + dx;
      if (!isWallAt(state.map, nx, p.y, p.w, p.h)) p.x = nx;
    }
    if (dy !== 0) {
      const ny = p.y + dy;
      if (!isWallAt(state.map, p.x, ny, p.w, p.h)) p.y = ny;
    }

    // 걷기 애니메이션 프레임
    if (!reducedMotion && (vx !== 0 || vy !== 0)) {
      p.frameAcc += dt;
      if (p.frameAcc > 0.15) {
        p.frameAcc = 0;
        p.frame = p.frame === 1 ? 2 : 1;
      }
    } else {
      p.frame = 0;
    }

    // 장애물(F) 이동 — 속도 보간, 히트박스 12×12
    const oStep = currentObsSpeed() * dt;
    for (const o of state.obstacles) {
      let tries = 0;
      let moved = false;
      while (tries < 4 && !moved) {
        const nx = o.x + o.dx * oStep;
        const ny = o.y + o.dy * oStep;
        if (!isWallAt(state.map, nx, ny, 12, 12)) {
          o.x = nx; o.y = ny; moved = true;
        } else {
          // 방향 전환 (랜덤)
          const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
          const d = dirs[Math.floor(Math.random() * 4)];
          o.dx = d[0]; o.dy = d[1];
          tries++;
        }
      }
    }

    // 수간호사 추가 스폰 — 난이도 곡선에 따라 주기 보간, 상한까지만
    if (now >= state.nextSpawnAt) {
      if (state.obstacles.length < diff.maxObstacles) {
        spawnObstacle();
      }
      // 상한 초과 시에도 주기 재설정(다음 기회에 다시 시도)
      const intervalSec = lerp(diff.spawnInterval[0], diff.spawnInterval[1], curveT());
      state.nextSpawnAt = now + intervalSec * 1000;
    }

    // 음표 만료 & 보충
    if (diff.noteTtl !== Infinity) {
      state.notes = state.notes.filter(n => (now - n.born) < diff.noteTtl);
    }
    while (state.notes.length < diff.notes) spawnNote();

    // 수집 판정 — 콤보 시스템 + 점수 보너스 + 스케일 사운드 + 파티클 (C7, C8)
    // 같은 프레임 다중 수집 시 spawnNote는 다음 프레임의 while 보충 루프가 처리 (Critical #4 중복 제거)
    for (let i = state.notes.length - 1; i >= 0; i--) {
      const n = state.notes[i];
      if (p.x < n.x + 12 && p.x + p.w > n.x &&
          p.y < n.y + 12 && p.y + p.h > n.y) {
        state.notes.splice(i, 1);

        // 콤보 증가 & 통계
        state.combo += 1;
        if (state.combo > state.maxCombo) state.maxCombo = state.combo;
        state.collected += 1;

        // 점수 가산 — 콤보 보너스 (3+:+1, 5+:+2, 7+:+3)
        let gain = 1;
        if (state.combo >= 7) gain += 3;
        else if (state.combo >= 5) gain += 2;
        else if (state.combo >= 3) gain += 1;
        state.score += gain;
        hudScore.textContent = String(state.score);

        // HUD 콤보 슬롯 갱신 (바운스 애니메이션)
        updateComboHud(true);

        // 수집 사운드 — 콤보 단계별 C장조 스케일
        const freqIdx = Math.min(state.combo - 1, SCALE_FREQS.length - 1);
        playTone(SCALE_FREQS[freqIdx], 0.09);

        // 파티클 — 3+: 10개, 7+: 14개, 기본 6개
        if (!reducedMotion) {
          let pCount = 6;
          if (state.combo >= 7) pCount = 14;
          else if (state.combo >= 3) pCount = 10;
          spawnParticles(n.x + 6, n.y + 6, pCount);
        }
      }
    }

    // 장애물(F) 충돌 — 스턴 + 점수 -1 + 콤보 리셋 + 저음 2연타 + 셰이크 (C7)
    if (!stunned) {
      for (const o of state.obstacles) {
        if (p.x < o.x + 12 && p.x + p.w > o.x &&
            p.y < o.y + 12 && p.y + p.h > o.y) {
          p.stunUntil = now + diff.stun;
          state.score = Math.max(0, state.score - 1);
          state.hits += 1;
          state.combo = 0;
          hudScore.textContent = String(state.score);
          updateComboHud(false);

          // 저음 2연타 — 스케일 무너짐
          playTone(196, 0.12);
          setTimeout(() => playTone(147, 0.18), 90);

          // 캔버스 셰이크 — reduced-motion 비활성
          if (canvasWrap && !reducedMotion) {
            canvasWrap.classList.remove('is-shake');
            void canvasWrap.offsetWidth; // 재생 재시작용 reflow
            canvasWrap.classList.add('is-shake');
            canvasWrap.addEventListener('animationend', () => {
              canvasWrap.classList.remove('is-shake');
            }, { once: true });
          }

          // 살짝 밀어내기
          p.x = Math.max(TILE, Math.min(CANVAS_W - TILE - p.w, p.x - (o.dx * 6)));
          p.y = Math.max(TILE, Math.min(CANVAS_H - TILE - p.h, p.y - (o.dy * 6)));
          break;
        }
      }
    }

    // 파티클 물리 업데이트
    if (state.particles.length > 0) updateParticles(dt);

    // 타이머
    state.timeLeft -= dt;
    if (state.timeLeft <= 0) {
      hudTime.textContent = '0';
      endGame();
      return;
    }
    const tSec = Math.ceil(state.timeLeft);
    hudTime.textContent = String(tSec);
    if (tSec <= 10) hudTime.classList.add('is-warning');
    else hudTime.classList.remove('is-warning');

    // 컷씬 트리거 — 경과 15초(mid1) / 경과 30초(mid2)
    // 경과 15s = timeLeft <= 30, 경과 30s = timeLeft <= 15
    if (state.cutscenesShown) {
      if (state.timeLeft <= 30 && !state.cutscenesShown.has('mid1')) {
        triggerCutscene('mid1');
        return;
      }
      if (state.timeLeft <= 15 && !state.cutscenesShown.has('mid2')) {
        triggerCutscene('mid2');
        return;
      }
    }
  }

  function render(now) {
    ctx.fillStyle = isLightTheme() ? '#e8e7ec' : '#09080f';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    drawMap(state.map);

    // 음표 (bob 애니메이션)
    for (const n of state.notes) {
      const bob = reducedMotion ? 0 : Math.sin((now / 220) + n.bobSeed) * 1.2;
      // TTL이 유한일 때 마지막 1초 깜빡임
      const diff = DIFFICULTY[state.difficulty];
      if (diff.noteTtl !== Infinity && !reducedMotion) {
        const left = diff.noteTtl - (now - n.born);
        if (left < 1000 && Math.floor(now / 120) % 2 === 0) continue;
      }
      drawNote(n.x, n.y, bob);
    }

    // 장애물
    for (const o of state.obstacles) drawObstacle(o.x, o.y);

    // 플레이어
    const p = state.player;
    const stunned = now < p.stunUntil;
    if (!stunned || Math.floor(now / 80) % 2 === 0) {
      drawNurse(p.x, p.y, p.dir, p.frame);
    }

    // 파티클 — 3~4px 네모, 수명에 따라 알파 감쇠 (C8)
    if (state.particles.length > 0) {
      const col = themeColors();
      ctx.fillStyle = col.brandHi;
      for (const pt of state.particles) {
        const alpha = Math.max(0, Math.min(1, pt.life / pt.maxLife));
        ctx.globalAlpha = alpha;
        ctx.fillRect(Math.round(pt.x) - 1, Math.round(pt.y) - 1, 3, 3);
      }
      ctx.globalAlpha = 1;
    }
  }

  function loop(ts) {
    if (!state.running) return;
    const now = ts;
    const dt = Math.min(0.05, (now - state.lastTs) / 1000); // 최대 50ms 클램프
    state.lastTs = now;

    update(dt, now);
    if (!state.running) {
      // endGame에서 이미 렌더가 필요하면 한 번 더
      render(now);
      return;
    }
    render(now);
    state.rafId = requestAnimationFrame(loop);
  }

  // =====================================================
  // 모바일 터치 컨트롤
  // =====================================================
  function isTouchDevice() {
    return window.matchMedia('(pointer: coarse)').matches || ('ontouchstart' in window);
  }

  function initTouchControls() {
    const pad = document.getElementById('gameTouchpad');
    if (!pad) return;
    pad.hidden = false;
    pad.setAttribute('aria-hidden', 'false');
    const controlsHint = document.querySelector('.game-controls');
    if (controlsHint) controlsHint.style.display = 'none';
    const btns = pad.querySelectorAll('.game-touchpad__btn');
    btns.forEach(btn => {
      const dir = btn.dataset.dir;
      const press = (e) => {
        e.preventDefault();
        state.keys[dir] = true;
        btn.classList.add('is-pressed');
      };
      const release = (e) => {
        e.preventDefault();
        state.keys[dir] = false;
        btn.classList.remove('is-pressed');
      };
      btn.addEventListener('pointerdown', press, { passive: false });
      btn.addEventListener('pointerup', release, { passive: false });
      btn.addEventListener('pointercancel', release, { passive: false });
      btn.addEventListener('pointerleave', release, { passive: false });
      btn.addEventListener('contextmenu', e => e.preventDefault());
    });
    canvas.addEventListener('touchmove', e => e.preventDefault(), { passive: false });
  }

  // =====================================================
  // 초기화
  // =====================================================
  loadBest();
  updateBestHud();
  updateStartGoal();
  if (isTouchDevice()) initTouchControls();

  // 기본 난이도 easy 활성 표시는 이미 HTML에서 aria-checked="true"
  // 초기에는 캔버스에 easy 맵을 스냅샷으로 그려 놓는다 (미리보기)
  (function initPreview() {
    const previewMap = buildMap('easy');
    ctx.fillStyle = isLightTheme() ? '#e8e7ec' : '#09080f';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    drawMap(previewMap);
    // 중앙에 간호사 한 명 그려두기 + 옆에 빨간 F 한 개(신규 컨셉 힌트)
    drawNurse(TILE * 15 + 2, TILE * 9 + 2, 'down', 0);
    drawObstacle(TILE * 19 + 4, TILE * 9 + 4);
  })();
})();
