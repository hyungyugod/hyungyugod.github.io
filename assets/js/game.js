(function () {
  'use strict';

  // 수간호사 색상 팔레트 캐시 — 테마 전환 시 무효화 (아래 drawNurseChief에서 사용)
  let chiefPaletteCache = null;
  // 김간호(플레이어) 번(Bun) 머리 팔레트 캐시 — 테마 전환 시 무효화 (drawNurse에서 사용)
  let nursePaletteCache = null;

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
      // 수간호사 팔레트 캐시 무효화 — 테마 전환 시 CSS 변수 재해석 필요
      chiefPaletteCache = null;
      // 김간호 번 팔레트 캐시 무효화 — 동일 이유
      nursePaletteCache = null;
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

  // 성공 판정 목표 점수 (절대값) — F 즉사 룰 하에서 반복 플레이로 점진적 달성
  const TARGET_SCORE = { easy: 40, normal: 30, hard: 30 };

  // 난이도별 기초/최대 속도 + 추가 스폰 주기 + F 상한
  // baseSpeed → maxSpeed: 시간 경과에 따라 선형 보간
  // throwBurst: 수간호사가 한 번 투척 시 동시에 던지는 F 개수
  const DIFFICULTY = {
    easy:   { baseSpeed: 140, maxSpeed: 210, notes: 5, noteTtl: Infinity, obstacles: 1, obsBaseSpeed: 60,  obsMaxSpeed: 110, stun: 400, map: 'easy',   spawnInterval: [3.5, 2.0], maxObstacles: 2,  throwBurst: 1 },
    normal: { baseSpeed: 150, maxSpeed: 230, notes: 5, noteTtl: 5500,     obstacles: 3, obsBaseSpeed: 120, obsMaxSpeed: 210, stun: 500, map: 'normal', spawnInterval: [1.6, 0.6], maxObstacles: 6,  throwBurst: 2 },
    hard:   { baseSpeed: 160, maxSpeed: 250, notes: 4, noteTtl: 3500,     obstacles: 5, obsBaseSpeed: 170, obsMaxSpeed: 290, stun: 700, map: 'hard',   spawnInterval: [1.0, 0.35], maxObstacles: 10, throwBurst: 3 }
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
  // '.'=투명, 'S'=피부, 'H'=머리카락/번, 'b'=번 내부 음영, 'W'=흰옷, 'C'=코럴십자
  // 'E'=눈 동공, 'L'=눈 하이라이트(흰자), 'R'=볼터치, 'M'=입, 'P'=하의, 'B'=신발
  // (캡→번 변경으로 'D' 키 제거됨)
  // 방향(dir): 'down','up','left','right', 프레임(frame): 0 idle, 1/2 step
  const NURSE_W = 16;
  const NURSE_H = 20;
  function nurseSprite(dir, frame) {
    // 16x20 — 번(행 1-3) + 헤어라인/이마(행 4-5) + 얼굴(행 6-10) + 몸통/다리(행 11-19)
    const base = [
      '................', // 0
      '......HHHH......', // 1 번 꼭대기 (4픽셀 둥근 윗면)
      '.....HbbbbH.....', // 2 번 본체 + 음영
      '....HHbbbbHH....', // 3 번 밑단 + 베이스
      '..HHHHHHHHHHHH..', // 4 두상 윗라인 (헤어라인)
      '..HHSSSSSSSSHH..', // 5 잔머리 옆 + 이마
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
      // 뒷모습 — 번 실루엣(행 1-3) 유지 + 얼굴 자리 전체를 머리카락으로
      base[1] = '......HHHH......'; // 번 꼭대기 (정면과 동일)
      base[2] = '.....HbbbbH.....'; // 번 본체 + 음영
      base[3] = '....HHbbbbHH....'; // 번 밑단
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

  // 김간호 팔레트 빌더 — H/b만 CSS 변수에서 읽어 테마 반응형.
  // 나머지 키(S/W/C/P/B/E/L/R/M)는 하드코딩 유지 (테마와 무관한 고유 피부/옷/눈 색).
  function getNursePalette() {
    if (nursePaletteCache) return nursePaletteCache;
    const rootStyle = getComputedStyle(document.documentElement);
    const readVar = (name, fallback) => {
      const v = rootStyle.getPropertyValue(name).trim();
      return v || fallback;
    };
    nursePaletteCache = {
      'S': '#fbe0d0',                                 // 피부
      'H': readVar('--nurse-bun', '#3a2a20'),         // 머리카락/번 본체 (흑갈)
      'b': readVar('--nurse-bun-shadow', '#5a4230'),  // 번 내부 음영
      'W': '#ffffff',                                 // 흰옷
      'C': '#c4847a',                                 // 코럴 십자
      'P': readVar('--nurse-pants', '#9ec9e8'),       // 하의
      'B': '#a85f56',                                 // 신발
      'E': '#2a1f25',                                 // 눈 동공
      'L': '#ffffff',                                 // 흰자 하이라이트
      'R': '#f5a8a0',                                 // 볼터치
      'M': '#c4847a'                                  // 입
    };
    return nursePaletteCache;
  }

  function drawNurse(x, y, dir, frame) {
    const sprite = nurseSprite(dir, frame);
    const palette = getNursePalette();
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

  // 픽셀 수간호사 (16x20) — 백발 + 안경 + 간호사 캡 + 흰 간호사복 + 얼굴 주름 — 나이 든 수간호사
  // '.'=투명, 'S'=피부, 'N'=주름/피부 음영, 'H'=백발, 'h'=백발 음영,
  // 'K'=간호사 캡, 'k'=캡 음영, 'X'=캡 코럴 십자,
  // 'G'=안경테, 'g'=안경 렌즈 내부(피부 변형), 'U'=흰 간호사복, 'V'=흰옷 음영,
  // 'C'=코럴 악센트(옷깃 중앙), 'P'=하의(간호사복과 동일색), 'B'=검정 구두, 'M'=입
  function nurseChiefSprite(dir, frame, throwArm) {
    const base = [
      '................', // 0
      '....KKKKKKKK....', // 1 간호사 캡 상단
      '...KKKKXXKKKK...', // 2 캡 + 코럴 십자
      '..KkkkkkkkkkkK..', // 3 캡 밑단(음영)
      '..HHSSSSSSSSHH..', // 4 이마 + 백발 옆선
      '..HhSSSSSSSShH..', // 5 백발 음영
      '..hSGGSSSSGGSh..', // 6 안경테
      '..hSGgSSSSgGSh..', // 7 안경 렌즈(눈)
      '..hSSNSSSSNSSh..', // 8 눈 밑 주름
      '..hSSSSMMSSSSh..', // 9 입
      '..hhSSNNNNSSHh..', // 10 팔자 주름 + 턱선
      '...UUUUUUUUUU...', // 11 흰 간호사복 어깨
      '..UUUUVCCVUUUU..', // 12 옷깃 + 코럴 십자
      '..UUVVVVVVVVUU..', // 13 상의 음영
      '...UUUUUUUUUU...', // 14 상의 밑단
      '....UUUUUUUU....', // 15 하의(흰 간호사복)
      '....UUU..UUU....', // 16
      '....UUU..UUU....', // 17
      '....BB....BB....', // 18 구두
      '....BB....BB....'  // 19
    ];

    // 방향별 얼굴 — 뒷통수(up)는 캡·백발로 덮고, 좌우는 안경·주름을 편향
    if (dir === 'up') {
      // 캡 행 1–3 유지, 얼굴 영역(4–10)만 백발로 덮음
      base[4] = '..HHHHHHHHHHHH..';
      base[5] = '..HhHHHHHHHHhH..';
      base[6] = '..hHHHHHHHHHHh..';
      base[7] = '..hHHHHHHHHHHh..';
      base[8] = '..hHHHHHHHHHHh..';
      base[9] = '..hHHHHHHHHHHh..';
      base[10] = '..hhHHHHHHHHHh..';
    } else if (dir === 'left') {
      base[6] = '..hSSSSSSSGGSh..';
      base[7] = '..hSSSSSSSgGSh..';
      base[8] = '..hSSSSSSSNSSh..';
      base[9] = '..hSSSSMMSSSSh..';
      base[10] = '..hhSSNNNNSSHh..';
    } else if (dir === 'right') {
      base[6] = '..hSGGSSSSSSSh..';
      base[7] = '..hSGgSSSSSSSh..';
      base[8] = '..hSSNSSSSSSSh..';
      base[9] = '..hSSSSMMSSSSh..';
      base[10] = '..hhSSNNNNSSHh..';
    }

    // 걷기 프레임 — 발만 교차
    if (frame === 1) {
      base[18] = '....BB...BBB....';
      base[19] = '....BBB...BB....';
    } else if (frame === 2) {
      base[18] = '....BBB...BB....';
      base[19] = '....BB...BBB....';
    }

    // 투척 팔 올림 — 상의 측면에 흰 소매(U) 한 줄 올림
    if (throwArm) {
      // 상반신 어깨 위로 팔을 들어올린 실루엣
      if (dir === 'left') {
        base[10] = '..UUhhNNNNSSHh..';
        base[11] = '..UUUUUUUUUU....';
      } else if (dir === 'right') {
        base[10] = '..hhSSNNNNhhUU..';
        base[11] = '....UUUUUUUUUU..';
      } else {
        base[10] = '..UUhSNNNNShUU..';
        base[11] = '..UUUUUUUUUUUU..';
      }
    }

    return base;
  }

  // CSS 변수로 정의된 수간호사 색상 캐시 — 매 프레임 getComputedStyle 호출 방지
  // 테마 전환 시 재계산 필요 (테마 토글 핸들러에서 invalidate)
  // 나이 든 간호사: 캡(K/k/X) + 백발(H/h) + 안경(G/g) + 주름(N) + 흰 간호사복(U/V) + 코럴 악센트(C)
  function getChiefPalette() {
    if (chiefPaletteCache) return chiefPaletteCache;
    const rootStyle = getComputedStyle(document.documentElement);
    const readVar = (name, fallback) => {
      const v = rootStyle.getPropertyValue(name).trim();
      return v || fallback;
    };
    chiefPaletteCache = {
      'S': '#f5d5c0',                                                  // 피부
      'N': readVar('--nurse-chief-wrinkle', '#c08878'),                // 주름/피부 음영
      'H': readVar('--nurse-chief-hair', '#e8e4e8'),                   // 백발
      'h': readVar('--nurse-chief-hair-shadow', '#c8c4cc'),            // 백발 음영
      'K': readVar('--nurse-chief-cap', '#ffffff'),                    // 간호사 캡
      'k': readVar('--nurse-chief-cap-shadow', '#e6dde6'),             // 캡 음영
      'X': readVar('--nurse-chief-cap-cross', '#ff7b7b'),              // 캡 코럴 십자
      'G': readVar('--nurse-chief-glass', '#1f1a1f'),                  // 안경테
      'g': '#e8c8b8',                                                  // 렌즈 안(피부 변형, 눈이 보이는 인상)
      'U': readVar('--nurse-chief-uniform', '#f4f0ee'),                // 흰 간호사복
      'V': readVar('--nurse-chief-uniform-shadow', '#d8d2d0'),         // 흰옷 음영
      'C': readVar('--nurse-chief-accent', '#ff7b7b'),                 // 코럴 악센트
      'P': readVar('--nurse-chief-uniform', '#f4f0ee'),                // 하의(간호사복 통일)
      'B': '#1a1214',                                                  // 구두
      'M': '#6b3a3a'                                                   // 입술
    };
    return chiefPaletteCache;
  }

  function drawNurseChief(x, y, dir, frame, throwArm) {
    const sprite = nurseChiefSprite(dir, frame, throwArm);
    const palette = getChiefPalette();
    const SCALE = 2;
    const ox = Math.round(x) - 8;
    let oy = Math.round(y) - 24;
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

  /**
   * 투척 텔레그래프(!)를 수간호사 머리 위에 0.4s 그린다
   * reduced-motion이면 깜빡임 대신 정적 표시 (호출 자체는 update에서 가드)
   */
  function drawTelegraph(x, y, now) {
    const ox = Math.round(x);
    const oy = Math.round(y) - 42;
    const red = isLightTheme() ? '#e8283a' : '#ff3b4e';
    // reduced-motion 환경에선 깜빡이지 않고 계속 표시
    if (!reducedMotion && Math.floor(now / 120) % 2 === 0) return;
    // 외곽 하이라이트
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(ox - 2, oy, 6, 8);
    ctx.fillRect(ox - 1, oy + 9, 4, 3);
    // 느낌표 본체
    ctx.fillStyle = red;
    ctx.fillRect(ox - 1, oy + 1, 4, 6);
    ctx.fillRect(ox, oy + 10, 2, 2);
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
    best: { easy: 0, normal: 0, hard: 0 },
    gameoverReason: null,     // 'time' | 'hit' — endGame 분기용
    // 수간호사 NPC — 맵 가장자리를 순찰하며 플레이어 방향으로 F 투척
    nurseChief: {
      x: 0, y: 0,
      dir: 'down',
      frameAcc: 0,
      frame: 0,
      patrolPath: [],      // [{x,y}, ...] 순환 경로 (픽셀)
      patrolIdx: 0,        // 현재 목표 포인트 인덱스
      throwTimer: 0,       // 다음 투척까지 남은 초
      telegraphUntil: 0,   // 느낌표(!) 텔레그래프 종료 시각(ms)
      throwArmUntil: 0,    // 팔 올림 프레임 종료 시각(ms)
      active: false
    }
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
  const btnBackToDifficulty = document.getElementById('btnBackToDifficulty');
  // 성공 엔딩 전용 — HG 실습 작곡 트랙으로 이어지는 외부 링크 버튼
  const btnListenTrack = document.getElementById('btnListenTrack');
  const endCta = overlayEnd ? overlayEnd.querySelector('.game-cta') : null;
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
      // 시작 오버레이 뒤 프리뷰를 새 난이도 맵으로 갱신
      if (overlayStart && !overlayStart.classList.contains('is-hidden')) {
        renderPreview();
      }
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

  // 난이도 다시 선택 — 종료 오버레이 닫고 시작 오버레이 재노출, 캔버스 프리뷰 재그리기
  if (btnBackToDifficulty) {
    btnBackToDifficulty.addEventListener('click', () => {
      // 진행 중인 루프 정리
      state.running = false;
      if (state.rafId) {
        cancelAnimationFrame(state.rafId);
        state.rafId = null;
      }
      // 비네트/셰이크 잔존 클래스 정리
      if (canvasWrap) {
        canvasWrap.classList.remove('is-shake', 'is-gameover');
      }
      // 상태 초기화 (best와 현재 난이도는 유지)
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
      state.gameoverReason = null;
      state.nurseChief.active = false;
      // HUD 리셋
      hudTime.textContent = String(GAME_DURATION);
      hudTime.classList.remove('is-warning');
      hudScore.textContent = '0';
      if (hudCombo) {
        hudCombo.textContent = '0';
        hudCombo.classList.remove('is-combo-hot', 'is-combo-bump');
      }
      // 오버레이 전환
      overlayEnd.classList.add('is-hidden');
      // 성공 엔딩 전용 상태 리셋 — 링크 버튼 숨김 + CTA 레이아웃 초기화
      if (btnListenTrack) btnListenTrack.classList.add('is-hidden');
      if (endCta) endCta.classList.remove('game-cta--success');
      const cutOverlay = document.getElementById('overlayCutscene');
      if (cutOverlay) cutOverlay.classList.add('is-hidden');
      overlayStart.classList.remove('is-hidden');
      // 프리뷰 재그리기
      renderPreview();
      // 난이도 버튼에 포커스 복귀 (접근성)
      const activeDiff = document.querySelector('.game-difficulty__btn[aria-checked="true"]');
      if (activeDiff) activeDiff.focus({ preventScroll: true });
    });
  }

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
    state.gameoverReason = null;
    state.player.x = TILE * 2 + 3;
    state.player.y = TILE * 2 + 3;
    state.player.dir = 'down';
    state.player.frame = 0;
    state.player.frameAcc = 0;
    state.player.stunUntil = 0;

    // 컷씬 추적 Set 초기화
    state.cutscenesShown = new Set();

    // 수간호사 NPC 초기화 — 난이도별 패트롤 경로
    initNurseChief();

    // 비네트/셰이크 잔존 클래스 정리
    if (canvasWrap) {
      canvasWrap.classList.remove('is-shake', 'is-gameover');
    }

    // 초기 음표 스폰 (플레이어 주변 회피)
    for (let i = 0; i < diff.notes; i++) spawnNote();
    // 장애물(F) 초기 스폰 — 수간호사가 이미 던져놓은 것으로 해석, 플레이어 주변 금지
    for (let i = 0; i < diff.obstacles; i++) spawnObstacle();

    // 다음 추가 스폰 예정 시각 — 첫 주기는 baseInterval(spawnInterval[0])
    state.nextSpawnAt = performance.now() + diff.spawnInterval[0] * 1000;

    overlayStart.classList.add('is-hidden');
    overlayEnd.classList.add('is-hidden');
    // 성공 엔딩 전용 상태 리셋 — 새 게임 시작 시 이전 성공 UI 잔존 방지
    if (btnListenTrack) btnListenTrack.classList.add('is-hidden');
    if (endCta) endCta.classList.remove('game-cta--success');
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

    // 성공 엔딩 전용 UI 기본 리셋 — 이후 success 분기에서만 재활성화
    if (btnListenTrack) btnListenTrack.classList.add('is-hidden');
    if (endCta) endCta.classList.remove('game-cta--success');

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

      const hitEnd = state.gameoverReason === 'hit';

      if (hitEnd && !success) {
        // F 즉사 종료 (목표 미달) — 수간호사에게 걸린 서사
        endTitle.textContent = '수간호사에게 걸렸어요!';
        endStory.textContent = 'F 한 장에 노래가 멈췄다. 김간호는 오늘만큼은 작곡을 포기하고 차트를 정리한다.';
        endStory.classList.add('game-overlay__ending--fail');
        playTone(165, 0.3);
      } else if (success) {
        endTitle.textContent = '노래를 무사히 만들었어요!';
        if (newRecord) {
          endStory.textContent = `음표 ${score}개로 신곡 완성. 수간호사도 모르는 김간호의 첫 트랙이 태어났다.`;
        } else {
          endStory.textContent = `${score}개. 좋은 후렴이지만, 김간호는 더 높은 코드를 원한다.`;
        }
        playTone(988, 0.22);
        // 성공 엔딩 — HG가 실습 기간에 만든 실제 트랙 링크 노출 (CTA 2×2 재구성)
        if (btnListenTrack) btnListenTrack.classList.remove('is-hidden');
        if (endCta) endCta.classList.add('game-cta--success');
      } else {
        // 시간 초과 + 미달
        endTitle.textContent = '수간호사에게 붙잡혔어요…';
        if (score >= target - 1) {
          endStory.textContent = `${score}점. 한 음만 더 있었으면… 다음 교대 시간엔 반드시.`;
        } else {
          endStory.textContent = `수간호사의 눈을 피해가며 모은 ${score}점. 오늘의 후렴은 여기까지. (목표 ${target}점 / 획득 ${score}점)`;
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

  // =====================================================
  // 수간호사 NPC — 패트롤 & F 투척
  // =====================================================
  /**
   * 난이도별 패트롤 경로 & 초기 상태 설정 (기능 3)
   * - easy: 상단 좌우 왕복
   * - normal: 대각선 이동 (Z 패턴)
   * - hard: 4모서리 순환
   */
  function initNurseChief() {
    const chief = state.nurseChief;
    const diff = state.difficulty;
    // 기본 위치 — 맵 중앙 상단 (맵 가장자리 순찰)
    const leftX = TILE * 3;
    const rightX = TILE * (COLS - 4);
    const topY = TILE * 3;
    const bottomY = TILE * (ROWS - 4);

    if (diff === 'easy') {
      chief.patrolPath = [
        { x: leftX, y: topY },
        { x: rightX, y: topY }
      ];
      chief.speed = 40;
    } else if (diff === 'normal') {
      chief.patrolPath = [
        { x: leftX, y: topY },
        { x: rightX, y: bottomY },
        { x: rightX, y: topY },
        { x: leftX, y: bottomY }
      ];
      chief.speed = 60;
    } else {
      chief.patrolPath = [
        { x: leftX, y: topY },
        { x: rightX, y: topY },
        { x: rightX, y: bottomY },
        { x: leftX, y: bottomY }
      ];
      chief.speed = 80;
    }

    // 플레이어 스폰 지점과 가장 먼 순찰 포인트에서 시작 — 첫 프레임 본체 충돌 즉사 방지
    const spawnPx = state.player.x + state.player.w / 2;
    const spawnPy = state.player.y + state.player.h / 2;
    let farIdx = 0;
    let farDist = -1;
    for (let i = 0; i < chief.patrolPath.length; i++) {
      const pt = chief.patrolPath[i];
      const d = Math.hypot(pt.x - spawnPx, pt.y - spawnPy);
      if (d > farDist) { farDist = d; farIdx = i; }
    }
    chief.patrolIdx = farIdx;
    chief.x = chief.patrolPath[farIdx].x;
    chief.y = chief.patrolPath[farIdx].y;
    chief.dir = 'down';
    chief.frame = 0;
    chief.frameAcc = 0;
    chief.telegraphUntil = 0;
    chief.throwArmUntil = 0;
    chief.active = true;
    // 첫 투척까지 base 주기 (spawnInterval[0]) 대기
    chief.throwTimer = DIFFICULTY[diff].spawnInterval[0];
  }

  /**
   * 수간호사 업데이트 — 패트롤 & 투척 타이머
   * @param {number} dt - 델타타임(s)
   * @param {number} now - 현재 시각(ms, performance.now)
   */
  function updateNurseChief(dt, now) {
    const chief = state.nurseChief;
    if (!chief.active || !chief.patrolPath.length) return;

    // --- 패트롤 이동: 현재 목표점까지 선형 이동, 도달하면 다음 포인트 ---
    const target = chief.patrolPath[chief.patrolIdx];
    const dx = target.x - chief.x;
    const dy = target.y - chief.y;
    const dist = Math.hypot(dx, dy);
    const step = chief.speed * dt;

    if (dist <= step || dist < 0.5) {
      chief.x = target.x;
      chief.y = target.y;
      chief.patrolIdx = (chief.patrolIdx + 1) % chief.patrolPath.length;
    } else {
      chief.x += (dx / dist) * step;
      chief.y += (dy / dist) * step;
      // 방향 갱신 (주이동축 기준)
      if (Math.abs(dx) > Math.abs(dy)) {
        chief.dir = dx > 0 ? 'right' : 'left';
      } else {
        chief.dir = dy > 0 ? 'down' : 'up';
      }
    }

    // --- 걷기 프레임 ---
    if (!reducedMotion) {
      chief.frameAcc += dt;
      if (chief.frameAcc > 0.18) {
        chief.frameAcc = 0;
        chief.frame = chief.frame === 1 ? 2 : 1;
      }
    } else {
      chief.frame = 0;
    }

    // --- 투척 타이머 ---
    const diff = DIFFICULTY[state.difficulty];

    // 텔레그래프 만료 시점에 실제 투척
    if (chief.telegraphUntil > 0 && now >= chief.telegraphUntil) {
      chief.telegraphUntil = 0;
      // F 상한 체크
      if (state.obstacles.length < diff.maxObstacles) {
        spawnObstacleFromChief();
      }
      // 팔 올림은 짧게 유지 후 내림
      chief.throwArmUntil = now + 180;
      // 다음 투척까지 대기 시간 — 난이도 곡선 보간
      const intervalSec = lerp(diff.spawnInterval[0], diff.spawnInterval[1], curveT());
      chief.throwTimer = intervalSec;
    } else if (chief.telegraphUntil === 0) {
      chief.throwTimer -= dt;
      if (chief.throwTimer <= 0) {
        // 텔레그래프 시작 — 0.4s 후 실제 투척
        chief.telegraphUntil = now + 400;
      }
    }
  }

  /**
   * 수간호사가 플레이어 방향으로 F 투척 (기능 3)
   * - chief.x/y 기준 플레이어 방향 벡터 생성
   * - throwBurst만큼 동시 투척, ±15° 스프레드
   */
  function spawnObstacleFromChief() {
    const chief = state.nurseChief;
    const diff = DIFFICULTY[state.difficulty];
    const p = state.player;
    // 플레이어 중심 기준 방향
    const px = p.x + p.w / 2;
    const py = p.y + p.h / 2;
    const baseDx = px - chief.x;
    const baseDy = py - chief.y;
    const baseLen = Math.hypot(baseDx, baseDy) || 1;
    const baseAngle = Math.atan2(baseDy, baseDx);

    const burst = Math.max(1, diff.throwBurst | 0);
    const spread = 15 * Math.PI / 180; // ±15°

    for (let i = 0; i < burst; i++) {
      // 상한 체크 — 이번 burst 중에도 상한 도달 시 중단
      if (state.obstacles.length >= diff.maxObstacles) break;
      // 스프레드: burst=1이면 0, burst>1이면 균등 분포 + 작은 랜덤
      const t = burst === 1 ? 0 : (i / (burst - 1)) * 2 - 1; // -1..1
      const angle = baseAngle + t * spread + (Math.random() - 0.5) * 0.05;
      const dx = Math.cos(angle);
      const dy = Math.sin(angle);
      // F 시작 위치 — 수간호사 바로 앞(플레이어 방향 12px 오프셋)
      let sx = chief.x + dx * 12;
      let sy = chief.y + dy * 12;
      // 맵 경계 안쪽 클램프
      sx = Math.max(TILE, Math.min(CANVAS_W - TILE - 12, sx));
      sy = Math.max(TILE, Math.min(CANVAS_H - TILE - 12, sy));
      // 벽 위면 findEmptyTile 폴백
      if (state.map && isWallAt(state.map, sx, sy, 12, 12)) {
        const tile = findEmptyTile(state.map, Math.random, [playerTile()]);
        sx = tile.c * TILE + (TILE - 12) / 2;
        sy = tile.r * TILE + (TILE - 12) / 2;
      }
      state.obstacles.push({ x: sx, y: sy, dx: dx, dy: dy });
    }
    // 투척 순간 팔 올림 플래그 (이미 updateNurseChief에서도 처리되나 즉시 반영)
    // 효과음 — 공기 가르는 얕은 톤
    playTone(220, 0.06);
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

    // 수간호사 NPC 업데이트 — 패트롤 이동 + 투척 타이머 처리
    updateNurseChief(dt, now);

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

    // 수간호사 본체 직접 충돌 — 즉사 처리 (F 충돌과 동등, SPEC 기능 2)
    // F에만 의존하던 회피 부담을 순찰 경로 읽기로 확장한다.
    if (state.nurseChief.active) {
      const chief = state.nurseChief;
      const CHIEF_HB = 14;
      const cx = chief.x - CHIEF_HB / 2;
      const cy = chief.y - CHIEF_HB / 2;
      if (p.x < cx + CHIEF_HB && p.x + p.w > cx &&
          p.y < cy + CHIEF_HB && p.y + p.h > cy) {
        state.hits += 1;
        state.combo = 0;
        updateComboHud(false);

        // F 충돌과 동일 연출 — 저음 2연타
        playTone(110, 0.25);
        setTimeout(() => playTone(82, 0.35), 100);

        // 캔버스 셰이크 + 즉사 비네트 — reduced-motion 비활성
        if (canvasWrap && !reducedMotion) {
          canvasWrap.classList.remove('is-shake');
          void canvasWrap.offsetWidth; // 재생 재시작용 reflow
          canvasWrap.classList.add('is-shake', 'is-gameover');
        }

        state.gameoverReason = 'hit';
        endGame();
        return;
      }
    }

    // 장애물(F) 충돌 — 즉사 처리 (SPEC 기능 6)
    // 한 번이라도 F에 닿으면 즉시 endGame
    for (const o of state.obstacles) {
      if (p.x < o.x + 12 && p.x + p.w > o.x &&
          p.y < o.y + 12 && p.y + p.h > o.y) {
        state.hits += 1;
        state.combo = 0;
        updateComboHud(false);

        // 저음 2연타 — 스케일 무너짐
        playTone(110, 0.25);
        setTimeout(() => playTone(82, 0.35), 100);

        // 캔버스 셰이크 + 즉사 비네트 — reduced-motion 비활성
        if (canvasWrap && !reducedMotion) {
          canvasWrap.classList.remove('is-shake');
          void canvasWrap.offsetWidth; // 재생 재시작용 reflow
          canvasWrap.classList.add('is-shake', 'is-gameover');
        }

        state.gameoverReason = 'hit';
        endGame();
        return;
      }
    }

    // 파티클 물리 업데이트
    if (state.particles.length > 0) updateParticles(dt);

    // 타이머
    state.timeLeft -= dt;
    if (state.timeLeft <= 0) {
      hudTime.textContent = '0';
      state.gameoverReason = 'time';
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

    // 수간호사 NPC (플레이어보다 먼저 — 층 순서 유지)
    const chief = state.nurseChief;
    if (chief.active) {
      const throwArm = now < chief.throwArmUntil || chief.telegraphUntil > 0;
      drawNurseChief(chief.x, chief.y, chief.dir, chief.frame, throwArm);
      // 텔레그래프(!) — 투척 전 0.4s 머리 위에 표시
      if (chief.telegraphUntil > 0 && now < chief.telegraphUntil) {
        drawTelegraph(chief.x, chief.y, now);
      }
    }

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

  /**
   * 시작 오버레이 뒤 캔버스 프리뷰 — 김간호 + 수간호사 + F 한 장
   * 초기 로드 시 / "난이도 다시 선택" 복귀 시 호출
   */
  function renderPreview() {
    const previewMap = buildMap(state.difficulty || 'easy');
    ctx.fillStyle = isLightTheme() ? '#e8e7ec' : '#09080f';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    drawMap(previewMap);
    // 김간호 (우측 중앙)
    drawNurse(TILE * 20 + 2, TILE * 9 + 2, 'left', 0);
    // 수간호사 (좌측 중앙) + F 한 장 — 던지기 직전 구도
    drawNurseChief(TILE * 11 + 2, TILE * 9 + 2, 'right', 0, true);
    drawObstacle(TILE * 15 + 4, TILE * 9 + 4);
  }

  // 기본 난이도 easy 활성 표시는 이미 HTML에서 aria-checked="true"
  renderPreview();
})();
