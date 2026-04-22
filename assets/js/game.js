(function () {
  'use strict';

  // 수간호사 색상 팔레트 캐시 — 테마 전환 시 무효화 (아래 drawNurseChief에서 사용)
  let chiefPaletteCache = null;
  // 플레이어 간호사 팔레트 캐시 — 테마 전환/캐릭터 전환 시 무효화 (charId별 맵)
  const nursePaletteCache = Object.create(null);
  // 이교수 색상 팔레트 캐시 — 테마 전환 시 무효화 (drawProfessor / drawStethoscope에서 사용)
  let professorPaletteCache = null;
  // 석조무사 색상 팔레트 캐시 — 테마 전환 시 무효화 (drawStoneGuard에서 사용)
  let stoneGuardPaletteCache = null;

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
      // 플레이어 간호사 팔레트 캐시 전체 무효화 — 동일 이유 (charId별 맵 클리어)
      for (const k in nursePaletteCache) delete nursePaletteCache[k];
      // 이교수 팔레트 캐시 무효화 — 동일 이유
      professorPaletteCache = null;
      // 석조무사 팔레트 캐시 무효화 — 동일 이유
      stoneGuardPaletteCache = null;
      // 선택창의 카드 canvas 재렌더 — 새 테마 팔레트로 정면 스프라이트 갱신
      const cardCanvases = document.querySelectorAll('.game-character-card');
      cardCanvases.forEach((card) => {
        const cv = card.querySelector('.game-character-card__avatar-canvas');
        const id = card.dataset.char;
        if (cv && id) drawCharacterCardAvatar(cv, id);
      });
      // 스킬 오버레이가 열려 있으면 아바타/악센트 재렌더 (새 테마 팔레트 반영)
      const skillOv = document.getElementById('overlaySkill');
      if (skillOv && !skillOv.classList.contains('is-hidden')) {
        if (typeof renderSkillOverlay === 'function') renderSkillOverlay();
      }
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
  const CHARACTER_STORAGE_KEY = 'pixelNurseChar';

  // 선택 가능한 5명 캐릭터 — 능력치는 전원 동일, 외형·이름만 차별화.
  // `id`는 화이트리스트이자 스프라이트 분기 키로 사용된다.
  const CHARACTERS = [
    { id: 'kim',  name: '김간호', tag: '번머리 실습생' },
    { id: 'jung', name: '정간호', tag: '곡괭이 근육' },
    { id: 'geon', name: '건간호', tag: '안경과 책' },
    { id: 'im',   name: '임간호', tag: '긴머리 냥' },
    { id: 'lee',  name: '이간호', tag: '단발 댕댕' }
  ];
  const CHARACTER_IDS = CHARACTERS.map(c => c.id);

  // 성공 판정 목표 점수 (절대값) — F 즉사 룰 하에서 반복 플레이로 점진적 달성
  // 하/상 +10 갱신 — 진입 곡선과 최종 도전치를 모두 강화. 중은 구 상값(30) 유지.
  const TARGET_SCORE = { easy: 50, normal: 30, hard: 130 };

  // 난이도별 기초/최대 속도 + 추가 스폰 주기 + F 상한
  // baseSpeed → maxSpeed: 시간 경과에 따라 선형 보간
  // throwBurst: 수간호사가 한 번 투척 시 동시에 던지는 F 개수
  // ※ 'normal' 분기: 구 'hard' 파라미터를 격하 수용. 새 'hard'는 강화된 신규 값 + 이교수 등장.
  const DIFFICULTY = {
    easy:   { baseSpeed: 140, maxSpeed: 210, notes: 5, noteTtl: Infinity, obstacles: 1, obsBaseSpeed: 60,  obsMaxSpeed: 110, stun: 400, map: 'easy', spawnInterval: [3.5, 2.0],  maxObstacles: 2,  throwBurst: 1 },
    normal: { baseSpeed: 160, maxSpeed: 250, notes: 4, noteTtl: 3500,     obstacles: 5, obsBaseSpeed: 170, obsMaxSpeed: 290, stun: 700, map: 'hard', spawnInterval: [1.0, 0.35], maxObstacles: 10, throwBurst: 3 },
    hard:   { baseSpeed: 160, maxSpeed: 250, notes: 4, noteTtl: 2800,     obstacles: 6, obsBaseSpeed: 200, obsMaxSpeed: 340, stun: 700, map: 'hard', spawnInterval: [0.8, 0.25], maxObstacles: 14, throwBurst: 4 }
  };

  // 이교수(Professor Lee) — 상 난이도 전용 듀얼 보스 NPC.
  // 청진기를 던져 플레이어를 2초간 그 자리에 묶어두는 "협공 압박" 메커닉의 핵심.
  const PROFESSOR = {
    patrolSpeed: 70,            // px/s — 수간호사보다 살짝 느리고, 새 hard 수간호사(100)와 차등
    throwInterval: [2.5, 1.4],  // sec — 시간 경과 보간 (curveT)
    stethoSpeed: 220,           // px/s — 청진기 투사체 속도
    stethoMax: 4,               // 동시 투사체 상한
    freezeDuration: 2000        // ms — 피격 시 정지 디버프 시간
  };

  // 석조무사 — 중(normal) 난이도 전용 조무래기 NPC (수간호사 밑 남학생).
  // 투사체를 던지지 않고 4지점 사각 순환만 수행한다. 접촉 시 즉사.
  const STONE_GUARD = {
    patrolSpeed: 55,   // px/s — 수간호사(normal baseSpeed/curve 기반)·이교수(70)보다 느리게
    hitbox: 14         // 플레이어 본체 히트박스 크기 (수간호사/이교수와 동일)
  };

  // 콤보 단계별 수집 사운드 — C장조 스케일 (C4→D4→E4→G4→A4→C5→D5→E5→G5→A5)
  const SCALE_FREQS = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25, 783.99, 880.00];

  // 화캉스 보너스 변기 아이템 — 저확률 희소 이벤트
  // DIFFICULTY 스키마와 독립된 전역 상수 (난이도별 차등 없음)
  const TOILET = {
    spawnInterval: 12,   // sec — 주기 판정 간격
    spawnChance: 0.15,   // 0~1 — 주기마다 굴림
    ttl: 8000,           // ms — 미수집 자동 소멸
    bonusMultiplier: 2,  // 음표 N개어치 (콤보도 N 증가)
    toastDuration: 900   // ms — "화캉스 보너스!" 토스트 표시
  };

  // 콤보 안전지대 최소 맨해튼 거리 (타일)
  const SPAWN_SAFE_DIST = 4;

  // =====================================================
  // 스킬 시스템 — 캐릭터별 능동 스킬 5종
  //  - durationMs: 효과 지속 시간 (무적/슬로우/돌진 등). 0이면 즉발.
  //  - cooldownMs: 재사용 대기 시간.
  //  - abbr: HUD 쿨다운 링 안쪽 표시용 짧은 라벨.
  // =====================================================
  // 김간호(kim)는 기본 캐릭터로 스킬 없음 — SKILLS 맵에 엔트리 없음.
  const SKILLS = {
    jung: { name: '암벽등반 돌진', desc: '바라보는 방향으로 3타일 돌진하며 앞을 막는 벽 1칸을 부순다.', durationMs: 260,  cooldownMs: 22000, abbr: '돌진' },
    geon: { name: '북클럽 소집', desc: '주변 6타일 안의 음표를 한번에 끌어와 수집한다.',     durationMs: 0,    cooldownMs: 20000, abbr: '소집' },
    im:   { name: '벼락치기',   desc: '수간호사를 매혹시켜 F 대신 A를 던지게 한다. A를 먹으면 점수 2배.', durationMs: 4000, cooldownMs: 25000, abbr: '매혹' },
    lee:  { name: '대만여행',   desc: '가장 먼 빈 타일로 순간 이동하고 0.5초 착지 무적.',    durationMs: 500,  cooldownMs: 22000, abbr: '여행' }
  };
  const hasSkill = (id) => Boolean(SKILLS[id]);
  // 임간호 "벼락치기" 활성 판정 — 수간호사가 매혹 상태(F→A)로 전환되는 동안 true.
  const isImCharmed = (now) => state.characterId === 'im'
    && state.skill && state.skill.activeUntil > 0
    && now < state.skill.activeUntil;
  const JUNG_DASH_TILES = 3;
  const JUNG_DASH_PX = JUNG_DASH_TILES * TILE;
  const JUNG_BREAK_RADIUS = 18;
  const GEON_MAGNET_RADIUS = 6 * TILE;

  // 컷씬 사전 — 정적 상수이므로 textContent로 안전하게 주입
  const CUTSCENES = {
    intro: {
      title: '어느 한적한 병동의 오후',
      // 난이도별 분기 — hard는 이교수 청진기 내러티브로 전환
      textByDiff: {
        easy: '수간호사가 순찰을 돈다. 그 틈을 타, {NAME}는 주머니 속 작곡 노트를 슬쩍 꺼낸다… 음표를 모으자.',
        normal: '수간호사가 순찰을 돈다. 그 틈을 타, {NAME}는 주머니 속 작곡 노트를 슬쩍 꺼낸다… 음표를 모으자.',
        hard: '학교에서 나온 깐깐한 이교수가 오늘따라 청진기를 휘두른다. 날아오는 청진기를 피하며 음표를 모으자. 수간호사는 언제나 그렇듯 순찰을 돈다.'
      }
    },
    mid1: {
      title: '{NAME}의 속마음 · 15초',
      // 캐릭터별 속마음 분기 — state.characterId에 따라 선택
      textByChar: {
        kim:  '"후렴구에 들어갈 코드를 아직 못 찾았어… 조금만 더!"',
        jung: '"빨리 만들고 산 가야 하는데… 오늘 날씨 완벽한데!"',
        lee:  '"빨리 만들고 대만 가야 하는데… 비행기 시간이 촉박해."',
        geon: '"빨리 만들고 북클럽 가야 하는데… 이번 주 책 아직 반도 못 읽었어."',
        im:   '"빨리 만들고 토리 보러 가야 하는데… 우리 애기 밥시간이야."'
      }
    },
    mid2: {
      title: '수간호사의 눈초리 · 30초',
      text: '"{NAME} 학생, 거기서 뭐 하나?" 수간호사의 F가 더 거세게 날아든다.'
    },
    introStoneGuard: {
      title: '경고 · 석조무사 출현',
      text: '수간호사의 충실한 부하 석조무사가 출현합니다! 마주치면 잡혀갑니다. 절대 만나지 마세요.'
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
  // 추가 키(charId 분기용):
  //   'K1'/'K2' — 곡괭이(자루/헤드), 'G'=안경테, 'g'=렌즈, 'O'=책 표지, 'T'=고양이귀, 'D'=강아지귀, 'h'=머리 음영
  // 매트릭스는 문자(char) 단위지만, 상기 2글자 키는 아래 분기에서 별도 행을 통째로 교체하는 방식으로만 사용한다.
  // 방향(dir): 'down','up','left','right', 프레임(frame): 0 idle, 1/2 step
  const NURSE_W = 16;
  const NURSE_H = 20;
  /**
   * 플레이어 스프라이트 매트릭스 생성 (16×20)
   * @param {string} dir - 'down'|'up'|'left'|'right'
   * @param {number} frame - 0 idle, 1/2 walk
   * @param {string} [charId] - 선택된 캐릭터 ID (기본 'kim')
   */
  function nurseSprite(dir, frame, charId) {
    const id = CHARACTER_IDS.indexOf(charId) >= 0 ? charId : 'kim';
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

    // --- 캐릭터별 머리·소품 오버레이 ---
    // 'kim'은 기본 번머리(이미 base에 반영)이므로 추가 변형 없음.
    // 그 외 캐릭터는 헤더 영역(행 1~5) 전체를 자기 실루엣으로 덮어쓴다.
    // up(뒷모습)에서도 정수리 실루엣이 드러나야 자연스럽다.
    if (id === 'jung') {
      // 근육질 짧은머리 — 각진 넓은 머리 + 상의 어깨 2px 확장 + 오른손 곡괭이(세로)
      // 'J'=짧은머리 본체, 'j'=음영. 어깨 행(11)을 넓혀 근육질 인상.
      base[1] = '................';
      base[2] = '....JJJJJJJJ....';
      base[3] = '...JJJJJJJJJJ...';
      base[4] = '..JJJJJJJJJJJJ..';
      base[5] = '..jjSSSSSSSSjj..';
      if (dir === 'up') {
        base[6] = '..JJJJJJJJJJJJ..';
        base[7] = '..JJJJJJJJJJJJ..';
        base[8] = '..JJJJJJJJJJJJ..';
        base[9] = '..JJJJJJJJJJJJ..';
        base[10] = '...JJJJJJJJJJ...';
      }
      // 어깨 확장 (좌우 1px씩)
      base[11] = '...WWWWWWWWWW...';
      base[14] = '...WWWWWWWWWW...';
      // 곡괭이 — 오른쪽 옆구리, 세로 자루(K1) + 헤드(K2) 2픽셀
      // 행 11~17 오른쪽에 자루, 행 10에 헤드
      base[10] = base[10].substring(0, 14) + 'KK';      // 헤드 우상단
      base[11] = base[11].substring(0, 14) + 'kK';
      base[12] = base[12].substring(0, 14) + '.K';
      base[13] = base[13].substring(0, 14) + '.K';
      base[14] = base[14].substring(0, 14) + '.K';
      base[15] = base[15].substring(0, 14) + '.K';
    } else if (id === 'geon') {
      // 단정 머리 + 안경 + 책 — 뿔테 안경(G/g), 오른손 책(O/p)
      base[1] = '................';
      base[2] = '.....GGGGGGGG...';
      base[3] = '....GGGGGGGGGG..';
      base[4] = '..GGGGGGGGGGGG..';
      base[5] = '..GGSSSSSSSSGG..';
      if (dir === 'up') {
        base[6] = '..GGGGGGGGGGGG..';
        base[7] = '..GGGGGGGGGGGG..';
        base[8] = '..GGGGGGGGGGGG..';
        base[9] = '..GGGGGGGGGGGG..';
        base[10] = '...GGGGGGGGGG...';
      } else {
        // 눈 자리에 안경 (E→F 테, L→f 렌즈) — left/right에서 한쪽만 덮이도록 별도 처리
        if (dir === 'down') {
          base[6] = '..SSFFSSSSFFSS..'; // 안경테
          base[7] = '..SSFfSSSSfFSS..'; // 렌즈
        } else if (dir === 'left') {
          base[6] = '..SSSSSSSSFFSS..';
          base[7] = '..SSSSSSSSfFSS..';
        } else if (dir === 'right') {
          base[6] = '..SSFFSSSSSSSS..';
          base[7] = '..SSFfSSSSSSSS..';
        }
      }
      // 오른손 책 — 갈색 표지(O) + 속지(p). 몸통 오른쪽 옆.
      base[12] = base[12].substring(0, 14) + 'OO';
      base[13] = base[13].substring(0, 14) + 'Op';
      base[14] = base[14].substring(0, 14) + 'OO';
    } else if (id === 'im') {
      // 긴머리 + 고양이귀 머리띠 — 머리가 어깨 아래까지 내려온다. 정수리 삼각 귀 2칸.
      // 'I'=긴머리, 'i'=음영, 'T'=고양이귀
      base[1] = '....T......T....';
      base[2] = '...TT.IIII.TT...';
      base[3] = '....IIIIIIII....';
      base[4] = '..IIIIIIIIIIII..';
      base[5] = '..IISSSSSSSSII..';
      if (dir === 'up') {
        base[6] = '..IIIIIIIIIIII..';
        base[7] = '..IIIIIIIIIIII..';
        base[8] = '..IIIIIIIIIIII..';
        base[9] = '..IIIIIIIIIIII..';
        base[10] = '..IIIIIIIIIIII..';
      }
      // 어깨 아래 긴머리 — 상의 양옆에 2줄 머리 (행 11~14)
      base[11] = 'II..WWWWWWWW..II'.replace('II..', 'iI..').replace('..II', '..Ii');
      base[12] = 'iI.WWWWCCWWWW.Ii';
      base[13] = 'iI.WWWCCCCWWW.Ii';
      base[14] = 'iI..WWWWWWWW..Ii';
    } else if (id === 'lee') {
      // 단발 웨이브 + 강아지 귀 — 턱선 길이 단발. 'L'=단발본체, 'l'=웨이브 음영, 'D'=강아지귀
      base[1] = '................';
      base[2] = '.....QQQQQQQQ...';
      base[3] = '....QQQQQQQQQQ..';
      base[4] = '..QQQQQQQQQQQQ..';
      base[5] = '..QQSSSSSSSSQQ..';
      if (dir === 'up') {
        base[6] = '..QQQQQQQQQQQQ..';
        base[7] = '..QQQQQQQQQQQQ..';
        base[8] = '..QQQQQQQQQQQQ..';
        base[9] = '..QQQQQQQQQQQQ..';
        base[10] = '...QQQQQQQQQQ...';
      } else {
        // 좌우 웨이브 음영 — 행 6~8 가장자리
        // 기존 face 행에 q 음영을 가장자리에 얹는다.
        const overlayEdge = (row) => 'qq' + row.substring(2, 14) + 'qq';
        base[6] = overlayEdge(base[6]);
        base[7] = overlayEdge(base[7]);
        base[8] = overlayEdge(base[8]);
      }
      // 강아지 귀 — 정수리 양쪽 아래로 처진 2×2 블록 (행 2~3)
      // base[2]/base[3]의 좌·우 끝에 D 덮어쓰기
      base[2] = '...DD' + base[2].substring(5, 11) + 'DD...';
      base[3] = '...DD' + base[3].substring(5, 11) + 'DD...';
    }

    return base;
  }

  /**
   * 플레이어 팔레트 빌더 — charId별 캐싱.
   * 공통 키(S/W/C/P/B/E/L/R/M)는 전 캐릭터 공유.
   * 캐릭터 전용 키(H/b/J/j/G/f/F/I/i/T/L/l/D/K/k/O/p)는 id에 따라 CSS 변수 매핑.
   */
  function getNursePalette(charId) {
    const id = CHARACTER_IDS.indexOf(charId) >= 0 ? charId : 'kim';
    if (nursePaletteCache[id]) return nursePaletteCache[id];
    const rootStyle = getComputedStyle(document.documentElement);
    const readVar = (name, fallback) => {
      const v = rootStyle.getPropertyValue(name).trim();
      return v || fallback;
    };
    const common = {
      'S': '#fbe0d0',                                 // 피부
      'W': '#ffffff',                                 // 흰옷
      'C': '#c4847a',                                 // 코럴 십자
      'P': readVar('--nurse-pants', '#9ec9e8'),       // 하의
      'B': '#a85f56',                                 // 신발
      'E': '#2a1f25',                                 // 눈 동공
      'L': '#ffffff',                                 // 흰자 하이라이트
      'R': '#f5a8a0',                                 // 볼터치
      'M': '#c4847a'                                  // 입
    };
    let charMap;
    if (id === 'jung') {
      charMap = {
        'J': readVar('--nurse-hair-jung', '#2a1a12'),
        'j': readVar('--nurse-hair-jung-shadow', '#180c08'),
        'K': readVar('--nurse-pick-head', '#9aa0a8'),   // 헤드(금속)
        'k': readVar('--nurse-pick-handle', '#7a4f2a')  // 자루(갈색)
      };
    } else if (id === 'geon') {
      charMap = {
        'G': readVar('--nurse-hair-geon', '#30221c'),
        'g': readVar('--nurse-hair-geon-shadow', '#1a0f0a'),
        'F': readVar('--nurse-glass-frame', '#1f1a1f'),  // 안경테
        'f': '#e8f0f8',                                  // 렌즈(반사)
        'O': readVar('--nurse-book', '#8a5a32'),         // 책 표지
        'p': '#f6ebd9'                                   // 책 속지
      };
    } else if (id === 'im') {
      charMap = {
        'I': readVar('--nurse-hair-im', '#3a2618'),
        'i': readVar('--nurse-hair-im-shadow', '#22150c'),
        'T': readVar('--nurse-earband-im', '#ff9db0')
      };
    } else if (id === 'lee') {
      // 공통 'L'(흰자)와 키 충돌을 피해 단발은 'Q'/'q', 강아지귀는 'D'로 분리.
      charMap = {
        'Q': readVar('--nurse-hair-lee', '#5a3a22'),
        'q': readVar('--nurse-hair-lee-shadow', '#3a2414'),
        'D': readVar('--nurse-earband-lee', '#b07a58')
      };
    } else {
      // kim — 기본 번머리
      charMap = {
        'H': readVar('--nurse-bun', '#3a2a20'),
        'b': readVar('--nurse-bun-shadow', '#5a4230')
      };
    }
    const merged = Object.assign({}, common, charMap);
    // lee 예외: 'L' 키가 두 번 쓰이므로 charMap의 값이 common('L'=흰자 #ffffff)을 덮음.
    //         머리색이 우선되는 것이 의도된 동작(단발 실루엣 렌더). 흰자는 'L'이 눈 행에서만 쓰이지만
    //         lee의 머리 오버레이도 그 행을 다시 쓰지 않으므로 문제없음.
    nursePaletteCache[id] = merged;
    return merged;
  }

  /**
   * 플레이어 간호사 렌더 — 선택된 charId에 따라 스프라이트/팔레트 분기.
   * @param {number} x - 히트박스 중심 x
   * @param {number} y - 히트박스 중심 y
   * @param {string} dir
   * @param {number} frame
   * @param {string} [charId] - 미지정 시 state.characterId 사용
   */
  function drawNurse(x, y, dir, frame, charId) {
    const id = charId || state.characterId || 'kim';
    const sprite = nurseSprite(dir, frame, id);
    const palette = getNursePalette(id);
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

  /**
   * 변기(화캉스 보너스) 16×16 픽셀 드로잉.
   * 상단 물탱크 + 하단 시트 + 물방울 포인트. 라이트/다크 공통 가독성.
   */
  function drawToilet(x, y, bob) {
    const ox = Math.round(x);
    const oy = Math.round(y + bob);
    // 외곽 섀도 (가독성)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.fillRect(ox + 1, oy + 1, 16, 16);
    // 물탱크 (상단 흰색)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(ox + 3, oy + 1, 10, 5);
    // 물탱크 뚜껑 (상단 1px 연회색)
    ctx.fillStyle = '#cfd3da';
    ctx.fillRect(ox + 3, oy + 1, 10, 1);
    // 시트 (하단 타원형 흰색)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(ox + 1, oy + 8, 14, 5);
    ctx.fillRect(ox + 2, oy + 13, 12, 1);
    // 시트 테두리 (연회색)
    ctx.fillStyle = '#cfd3da';
    ctx.fillRect(ox + 1, oy + 8, 14, 1);
    // 물 하이라이트 (옅은 파랑)
    ctx.fillStyle = '#a9d6ef';
    ctx.fillRect(ox + 5, oy + 11, 6, 1);
    // 중앙 구멍 (검정 2×2)
    ctx.fillStyle = '#1a1a22';
    ctx.fillRect(ox + 7, oy + 11, 2, 2);
  }

  function drawObstacle(x, y, type) {
    // 12x12 투사체. type='F'(기본, 치명) 또는 'A'(매혹 상태, 수집물 + 점수 2배).
    const ox = Math.round(x);
    const oy = Math.round(y);
    // 외곽 섀도
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.fillRect(ox + 1, oy + 1, 12, 12);
    // 흰 테두리
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(ox, oy, 12, 12);
    if (type === 'A') {
      // A 본체 — 분홍 (매혹/보상 시그널)
      const pink = isLightTheme() ? '#e84d8d' : '#ff6fa8';
      ctx.fillStyle = pink;
      // 삼각 윤곽
      ctx.fillRect(ox + 5, oy + 1, 2, 2);          // 꼭짓점
      ctx.fillRect(ox + 4, oy + 3, 1, 2);          // 좌 경사
      ctx.fillRect(ox + 7, oy + 3, 1, 2);          // 우 경사
      ctx.fillRect(ox + 3, oy + 5, 1, 6);          // 좌 다리
      ctx.fillRect(ox + 8, oy + 5, 1, 6);          // 우 다리
      ctx.fillRect(ox + 4, oy + 7, 4, 2);          // 가로획
      return;
    }
    // 기본 F
    const red = isLightTheme() ? '#e8283a' : '#ff3b4e';
    ctx.fillStyle = red;
    ctx.fillRect(ox + 2, oy + 1, 8, 2);
    ctx.fillRect(ox + 2, oy + 1, 2, 10);
    ctx.fillRect(ox + 2, oy + 5, 6, 2);
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

  function drawNurseChief(x, y, dir, frame, throwArm, hearted) {
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
    // 매혹 상태 — 안경 렌즈 위에 핑크 하트눈 오버레이 (3×3 sprite 픽셀)
    if (hearted) {
      ctx.fillStyle = '#ff4d8d';
      const heart = (hc, hr) => {
        const hx = ox + hc * SCALE;
        const hy = oy + hr * SCALE;
        ctx.fillRect(hx,             hy,             SCALE, SCALE);
        ctx.fillRect(hx + 2 * SCALE, hy,             SCALE, SCALE);
        ctx.fillRect(hx,             hy + SCALE,     3 * SCALE, SCALE);
        ctx.fillRect(hx + SCALE,     hy + 2 * SCALE, SCALE, SCALE);
      };
      heart(3, 6);  // 좌측 눈 (안경 렌즈 위)
      heart(9, 6);  // 우측 눈
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
    // 선택된 플레이어 캐릭터 ID — CHARACTER_IDS 중 하나. 기본 'kim'(기존 김간호).
    characterId: 'kim',
    map: null,
    player: { x: 0, y: 0, w: 14, h: 14, dir: 'down', frameAcc: 0, frame: 0, stunUntil: 0, frozenUntil: 0, invincibleUntil: 0 },
    // 스킬 상태 — readyAt(재사용 가능 시각), activeUntil(효과 종료 시각), lastUsedAt(마지막 발동), flashUntil(HUD 플래시 종료)
    skill: { readyAt: 0, activeUntil: 0, lastUsedAt: 0, flashUntil: 0 },
    notes: [],         // {x, y, born, bobSeed}
    obstacles: [],     // {x, y, dx, dy}
    stethoscopes: [],  // {x, y, dx, dy, born} — 이교수 청진기 투사체
    toilets: [],       // {x, y, born, bobSeed} — 화캉스 보너스 변기 (최대 1개)
    nextToiletAt: 0,   // 다음 변기 스폰 판정 시각(ms)
    toiletToastUntil: 0, // "화캉스 보너스!" 토스트 만료 시각(ms), 0=비표시
    particles: [],     // {x, y, vx, vy, life, maxLife}
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
    },
    // 이교수 NPC — 상 난이도에서만 active=true. 청진기를 투척해 플레이어를 2초간 정지시킨다.
    professor: {
      x: 0, y: 0,
      dir: 'down',
      frameAcc: 0,
      frame: 0,
      patrolPath: [],
      patrolIdx: 0,
      throwTimer: 0,
      telegraphUntil: 0,
      throwArmUntil: 0,
      active: false
    },
    // 석조무사 NPC — 중 난이도에서만 active=true. 순수 이동형(투척 없음), 접촉 시 즉사.
    stoneGuard: {
      x: 0, y: 0,
      dir: 'down',
      frameAcc: 0,
      frame: 0,
      patrolPath: [],
      patrolIdx: 0,
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
  // 캐릭터 선택 — 영속 저장 / 이름 치환 유틸
  // =====================================================
  /**
   * localStorage에서 선택된 캐릭터 ID를 복원한다. 5개 화이트리스트 외 값은 무시.
   * Safari private mode 등 저장소 접근 실패 시 기본 'kim' 유지.
   */
  function loadCharacter() {
    try {
      const raw = localStorage.getItem(CHARACTER_STORAGE_KEY);
      if (raw && CHARACTER_IDS.indexOf(raw) >= 0) {
        state.characterId = raw;
      }
    } catch (e) { /* 무시 */ }
  }

  function saveCharacter() {
    try {
      localStorage.setItem(CHARACTER_STORAGE_KEY, state.characterId);
    } catch (e) { /* 무시 */ }
  }

  /**
   * 현재 선택된 캐릭터 이름을 반환한다. 유효 ID가 아니면 기본 '김간호'.
   */
  function currentNurseName() {
    const found = CHARACTERS.find(c => c.id === state.characterId);
    return found ? found.name : '김간호';
  }

  /**
   * 정적 DOM의 .js-nurse-name 엘리먼트에 현재 캐릭터 이름을 주입한다.
   * textContent만 사용 (XSS 차단).
   */
  function applyNurseNameToDom() {
    const name = currentNurseName();
    const nodes = document.querySelectorAll('.js-nurse-name');
    nodes.forEach((n) => { n.textContent = name; });
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
  // 캐릭터 선택 오버레이 관련 DOM
  const overlayCharacter = document.getElementById('overlayCharacter');
  const characterGrid = document.getElementById('characterGrid');
  const btnCharacterBack = document.getElementById('btnCharacterBack');
  const btnCharacterConfirm = document.getElementById('btnCharacterConfirm');
  // 스킬 오버레이 관련 DOM
  const overlaySkill = document.getElementById('overlaySkill');
  const skillCard = document.getElementById('skillCard');
  const btnSkillBack = document.getElementById('btnSkillBack');
  const btnSkillStart = document.getElementById('btnSkillStart');
  const hudSkill = document.getElementById('hudSkill');
  const hudSkillLabel = document.getElementById('hudSkillLabel');
  const hudSkillSlot = document.getElementById('hudSkillSlot');
  const keypadSkillBtn = document.getElementById('keypadSkill');

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
    // 기존 직행(startGame) 대신 캐릭터 선택 오버레이로 전환
    openCharacterOverlay();
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
      state.stethoscopes = [];
      state.toilets = [];
      state.nextToiletAt = performance.now() + TOILET.spawnInterval * 1000;
      state.toiletToastUntil = 0;
      state.particles = [];
      state.keys = Object.create(null);
      state.gameoverReason = null;
      state.nurseChief.active = false;
      state.professor.active = false;
      state.stoneGuard.active = false;
      state.player.frozenUntil = 0;
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

  // =====================================================
  // 캐릭터 선택 오버레이 — 5인 카드 그리드 + 키보드 내비게이션
  // =====================================================
  /**
   * 카드 아바타 canvas에 인게임 정면 스프라이트 렌더 (SCALE=3, 16×20 → 48×60).
   * nurseSprite/getNursePalette를 재사용하여 인게임과 픽셀 단위 동일한 외형 보장.
   * @param {HTMLCanvasElement} canvas - 대상 canvas
   * @param {string} charId - 캐릭터 id (kim/jung/geon/im/lee)
   */
  function drawCharacterCardAvatar(canvas, charId) {
    const SCALE = 3;
    canvas.width = 16 * SCALE;
    canvas.height = 20 * SCALE;
    const cctx = canvas.getContext('2d');
    if (!cctx) return;
    cctx.imageSmoothingEnabled = false;
    cctx.clearRect(0, 0, canvas.width, canvas.height);
    const sprite = nurseSprite('down', 0, charId);
    const palette = getNursePalette(charId);
    for (let r = 0; r < 20; r++) {
      const row = sprite[r];
      for (let c = 0; c < 16; c++) {
        const ch = row[c];
        if (ch === '.' || !palette[ch]) continue;
        cctx.fillStyle = palette[ch];
        cctx.fillRect(c * SCALE, r * SCALE, SCALE, SCALE);
      }
    }
  }

  /**
   * 5명 캐릭터 카드를 DOM API로 렌더 (innerHTML 금지, XSS 안전).
   * 각 카드는 role="radio" + aria-checked 라디오그룹 패턴.
   */
  function initCharacterGrid() {
    if (!characterGrid) return;
    // 기존 자식 제거 (재호출 대비)
    while (characterGrid.firstChild) characterGrid.removeChild(characterGrid.firstChild);

    CHARACTERS.forEach((ch) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'game-character-card';
      btn.setAttribute('role', 'radio');
      btn.setAttribute('aria-checked', ch.id === state.characterId ? 'true' : 'false');
      btn.dataset.char = ch.id;

      const avatar = document.createElement('span');
      avatar.className = 'game-character-card__avatar is-' + ch.id;
      avatar.setAttribute('aria-hidden', 'true');
      // 인게임 정면 스프라이트(`nurseSprite('down', 0, charId)`)를 canvas에 SCALE=3로 렌더
      const canvas = document.createElement('canvas');
      canvas.className = 'game-character-card__avatar-canvas';
      canvas.setAttribute('aria-hidden', 'true');
      avatar.appendChild(canvas);
      drawCharacterCardAvatar(canvas, ch.id);

      const name = document.createElement('span');
      name.className = 'game-character-card__name';
      name.textContent = ch.name;

      const tag = document.createElement('span');
      tag.className = 'game-character-card__tag';
      tag.textContent = ch.tag;

      btn.appendChild(avatar);
      btn.appendChild(name);
      btn.appendChild(tag);

      btn.addEventListener('click', () => selectCharacterCard(ch.id));
      btn.addEventListener('keydown', handleCharacterCardKey);

      characterGrid.appendChild(btn);
    });
  }

  /**
   * 카드 선택 — aria-checked 상태 갱신 + state.characterId 임시 변경 (확정은 btnCharacterConfirm에서).
   */
  function selectCharacterCard(id) {
    if (CHARACTER_IDS.indexOf(id) < 0) return;
    state.characterId = id;
    const cards = characterGrid ? characterGrid.querySelectorAll('.game-character-card') : [];
    cards.forEach((c) => {
      c.setAttribute('aria-checked', c.dataset.char === id ? 'true' : 'false');
    });
    // 스킬 HUD/키패드 악센트를 새 캐릭터로 즉시 갱신
    if (typeof updateSkillHud === 'function') updateSkillHud(performance.now());
  }

  /**
   * ArrowKey / Enter / Space 라디오그룹 접근성 내비게이션
   */
  function handleCharacterCardKey(e) {
    const key = e.key;
    if (key === 'Enter' || key === ' ') {
      e.preventDefault();
      const id = e.currentTarget.dataset.char;
      selectCharacterCard(id);
      return;
    }
    if (key !== 'ArrowLeft' && key !== 'ArrowRight' && key !== 'ArrowUp' && key !== 'ArrowDown') return;
    e.preventDefault();
    const cards = Array.from(characterGrid.querySelectorAll('.game-character-card'));
    const idx = cards.indexOf(e.currentTarget);
    if (idx < 0) return;
    let next = idx;
    if (key === 'ArrowLeft' || key === 'ArrowUp') next = (idx - 1 + cards.length) % cards.length;
    else next = (idx + 1) % cards.length;
    const nextCard = cards[next];
    if (nextCard) {
      selectCharacterCard(nextCard.dataset.char);
      nextCard.focus({ preventScroll: true });
    }
  }

  /**
   * 시작 오버레이 → 캐릭터 선택 오버레이 전환.
   * 현재 선택된 카드에 포커스를 우선 배치, 없으면 첫 카드.
   */
  function openCharacterOverlay() {
    if (!overlayCharacter) {
      // 폴백: 오버레이 DOM이 없으면 기존 방식대로 즉시 시작
      startGame();
      return;
    }
    if (overlayStart) overlayStart.classList.add('is-hidden');
    overlayCharacter.classList.remove('is-hidden');
    // 포커스 — 현재 선택된 카드 우선
    const activeCard = characterGrid
      ? characterGrid.querySelector(`.game-character-card[data-char="${state.characterId}"]`)
      : null;
    const firstCard = characterGrid ? characterGrid.querySelector('.game-character-card') : null;
    const target = activeCard || firstCard;
    if (target) target.focus({ preventScroll: true });
  }

  if (btnCharacterConfirm) {
    btnCharacterConfirm.addEventListener('click', () => {
      saveCharacter();
      applyNurseNameToDom();
      if (overlayCharacter) overlayCharacter.classList.add('is-hidden');
      if (overlaySkill && hasSkill(state.characterId)) {
        renderSkillOverlay();
        overlaySkill.classList.remove('is-hidden');
        if (btnSkillStart) btnSkillStart.focus({ preventScroll: true });
      } else {
        startGame();
      }
    });
  }

  // =====================================================
  // 스킬 오버레이 — 아바타 + 캐릭터명 + 스킬명/설명/쿨다운
  // 플로우: 캐릭터 오버레이 → 스킬 오버레이 → startGame
  // 렌더는 DOM API만 사용 (innerHTML 금지) — XSS 안전
  // =====================================================
  /**
   * 스킬 카드(#skillCard)를 선택된 캐릭터 기준으로 재구성한다.
   * 기존 자식을 removeChild로 전량 제거한 뒤 DOM API로 트리 재구축.
   * 아바타는 기존 `drawCharacterCardAvatar(canvas, charId)`를 재사용 (스프라이트/팔레트 동일 보장).
   */
  function renderSkillOverlay() {
    if (!skillCard || !overlaySkill) return;
    const id = state.characterId || 'kim';
    const def = SKILLS[id];
    if (!def) return; // 김간호(스킬 없음) 방어

    const nurse = CHARACTERS.find(c => c.id === id);
    const nurseName = nurse ? nurse.name : '김간호';

    // 패널에 data-char 주입 — CSS 악센트 변수 스코프 발동
    const panel = overlaySkill.querySelector('.game-overlay__panel--skill');
    if (panel) panel.setAttribute('data-char', id);
    if (hudSkillSlot) hudSkillSlot.setAttribute('data-char', id);
    if (keypadSkillBtn) keypadSkillBtn.setAttribute('data-char', id);

    // 기존 자식 제거
    while (skillCard.firstChild) skillCard.removeChild(skillCard.firstChild);

    // 아바타 컨테이너 + canvas
    const avatar = document.createElement('span');
    avatar.className = 'game-skill-card__avatar';
    avatar.setAttribute('aria-hidden', 'true');
    const canvas = document.createElement('canvas');
    canvas.className = 'game-skill-card__avatar-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    avatar.appendChild(canvas);
    skillCard.appendChild(avatar);
    drawCharacterCardAvatar(canvas, id);

    // 캐릭터명
    const nameEl = document.createElement('span');
    nameEl.className = 'game-skill-card__name';
    nameEl.textContent = nurseName;
    skillCard.appendChild(nameEl);

    // 스킬명 (악센트 컬러 + 글로우)
    const skillNameEl = document.createElement('span');
    skillNameEl.className = 'game-skill-card__skill-name';
    skillNameEl.id = 'skillDesc';
    skillNameEl.textContent = def.name;
    skillCard.appendChild(skillNameEl);

    // 설명
    const descEl = document.createElement('p');
    descEl.className = 'game-skill-card__desc';
    descEl.textContent = def.desc;
    skillCard.appendChild(descEl);

    // 쿨다운
    const cdEl = document.createElement('p');
    cdEl.className = 'game-skill-card__cooldown';
    const cdLabel = document.createElement('span');
    cdLabel.textContent = '쿨다운 ';
    const cdValue = document.createElement('b');
    cdValue.textContent = String(Math.round(def.cooldownMs / 1000)) + '초';
    cdEl.appendChild(cdLabel);
    cdEl.appendChild(cdValue);
    skillCard.appendChild(cdEl);
  }

  if (btnSkillStart) {
    btnSkillStart.addEventListener('click', () => {
      if (overlaySkill) overlaySkill.classList.add('is-hidden');
      startGame();
    });
  }

  if (btnSkillBack) {
    btnSkillBack.addEventListener('click', () => {
      if (overlaySkill) overlaySkill.classList.add('is-hidden');
      if (overlayCharacter) {
        overlayCharacter.classList.remove('is-hidden');
        const activeCard = characterGrid
          ? characterGrid.querySelector('.game-character-card[data-char="' + state.characterId + '"]')
          : null;
        if (activeCard) activeCard.focus({ preventScroll: true });
      }
    });
  }

  // 스킬 오버레이 Esc — Back과 동일 동작
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (overlaySkill && !overlaySkill.classList.contains('is-hidden')) {
      e.preventDefault();
      if (btnSkillBack) btnSkillBack.click();
    }
  });

  if (btnCharacterBack) {
    btnCharacterBack.addEventListener('click', () => {
      if (overlayCharacter) overlayCharacter.classList.add('is-hidden');
      if (overlayStart) overlayStart.classList.remove('is-hidden');
      // 난이도 버튼으로 포커스 복귀
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
           (overlayCharacter && !overlayCharacter.classList.contains('is-hidden')) ||
           (overlaySkill && !overlaySkill.classList.contains('is-hidden')) ||
           (cutOverlay && !cutOverlay.classList.contains('is-hidden'));
  }

  // 스킬 발동 키 — Shift (좌/우 모두). 오버레이 중이면 무시.
  window.addEventListener('keydown', (e) => {
    if (e.code !== 'ShiftLeft' && e.code !== 'ShiftRight') return;
    if (e.repeat) return;
    if (isAnyOverlayOpen() || !state.running) return;
    e.preventDefault();
    tryActivateSkill();
  });

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
    state.stethoscopes = [];
    state.toilets = [];
    state.nextToiletAt = performance.now() + TOILET.spawnInterval * 1000;
    state.toiletToastUntil = 0;
    state.particles = [];
    state.keys = Object.create(null);
    clearDpadPressed();
    state.gameoverReason = null;
    state.player.x = TILE * 2 + 3;
    state.player.y = TILE * 2 + 3;
    state.player.dir = 'down';
    state.player.frame = 0;
    state.player.frameAcc = 0;
    state.player.stunUntil = 0;
    state.player.frozenUntil = 0;
    state.player.invincibleUntil = 0;

    // 스킬 상태 초기화 — 게임 시작과 동시에 사용 가능 (readyAt = now)
    const nowSkillInit = performance.now();
    state.skill.readyAt = nowSkillInit;
    state.skill.activeUntil = 0;
    state.skill.lastUsedAt = 0;
    state.skill.flashUntil = 0;
    updateSkillHud(nowSkillInit);

    // 컷씬 추적 Set 초기화
    state.cutscenesShown = new Set();

    // 수간호사 NPC 초기화 — 난이도별 패트롤 경로
    initNurseChief();

    // 이교수 NPC 초기화 — 상 난이도 전용. 그 외 난이도는 명시적으로 비활성화.
    if (state.difficulty === 'hard') {
      initProfessor();
    } else {
      state.professor.active = false;
    }

    // 석조무사 NPC 초기화 — 중 난이도 전용. 그 외 난이도는 명시적으로 비활성화.
    if (state.difficulty === 'normal') {
      initStoneGuard();
    } else {
      state.stoneGuard.active = false;
    }

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
    clearDpadPressed();

    // HUD 콤보 초기 톤 정리 (다음 게임 대비)
    if (hudCombo) {
      hudCombo.classList.remove('is-combo-bump', 'is-combo-hot');
    }

    // 스킬 상태/HUD 정리 — 잔존 브레싱/플래시 클래스 제거
    state.skill.readyAt = 0;
    state.skill.activeUntil = 0;
    state.skill.flashUntil = 0;
    state.player.invincibleUntil = 0;
    if (hudSkillSlot) {
      hudSkillSlot.classList.remove('is-skill-ready', 'is-skill-cooling', 'is-skill-flash');
    }
    if (keypadSkillBtn) {
      keypadSkillBtn.classList.remove('is-skill-ready', 'is-skill-cooling', 'is-skill-flash', 'is-pressed');
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

      const nurseName = currentNurseName();
      if (hitEnd && !success) {
        // F 즉사 종료 (목표 미달) — 수간호사에게 걸린 서사
        endTitle.textContent = '수간호사에게 걸렸어요!';
        endStory.textContent = `F 한 장에 노래가 멈췄다. ${nurseName}는 오늘만큼은 작곡을 포기하고 EMR을 받아쓴다.`;
        endStory.classList.add('game-overlay__ending--fail');
        playTone(165, 0.3);
      } else if (success) {
        endTitle.textContent = '노래를 무사히 만들었어요!';
        if (newRecord) {
          endStory.textContent = `음표 ${score}개로 신곡 완성. 수간호사도 모르는 ${nurseName}의 첫 트랙이 태어났다.`;
        } else {
          endStory.textContent = `${score}개. 좋은 후렴이지만, ${nurseName}는 더 높은 코드를 원한다.`;
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
   * @param {'intro'|'mid1'|'mid2'|'introStoneGuard'} id - 컷씬 식별자
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
    const cut = CUTSCENES[id];
    // 텍스트 소스 우선순위: 캐릭터별(textByChar) → 난이도별(textByDiff) → 단일(text)
    let rawText;
    if (cut.textByChar) {
      rawText = cut.textByChar[state.characterId] || cut.textByChar.kim || cut.text || '';
    } else if (cut.textByDiff) {
      rawText = cut.textByDiff[state.difficulty] || cut.textByDiff.easy;
    } else {
      rawText = cut.text || '';
    }
    // {NAME} 플레이스홀더를 현재 선택된 캐릭터 이름으로 치환 (textContent라 XSS 안전)
    const name = currentNurseName();
    const text = rawText.replace(/\{NAME\}/g, name);
    titleEl.textContent = cut.title.replace(/\{NAME\}/g, name);
    textEl.textContent = text;

    // 인트로 컷씬 — "목표 N점 · 45초"를 본문 아래 덧붙인다.
    // 그 외 컷씬(mid1/mid2)에서는 숨긴다.
    const goalEl = document.getElementById('cutsceneGoal');
    if (goalEl) {
      if (id === 'intro') {
        goalEl.textContent = '목표 ' + TARGET_SCORE[state.difficulty] + '점 · ' + GAME_DURATION + '초';
        goalEl.hidden = false;
      } else {
        goalEl.textContent = '';
        goalEl.hidden = true;
      }
    }

    overlay.classList.remove('is-hidden');

    const btn = document.getElementById('btnCutsceneContinue');
    if (btn) btn.focus({ preventScroll: true });
  }

  function resumeFromCutscene() {
    const overlay = document.getElementById('overlayCutscene');
    if (!overlay || overlay.classList.contains('is-hidden')) return;
    overlay.classList.add('is-hidden');
    // intro 컷씬 종료 후 normal 난이도면 석조무사 안내문을 연이어 노출
    const chainStoneGuard = state.difficulty === 'normal'
      && state.cutscenesShown
      && state.cutscenesShown.has('intro')
      && !state.cutscenesShown.has('introStoneGuard');
    if (chainStoneGuard) {
      setTimeout(() => triggerCutscene('introStoneGuard'), 150);
      return;
    }
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
    // 플레이어 주변 안전지대 회피 (Major #10) + 석조무사 타일 주변 회피 (불공정 즉사 방지)
    const avoid = state.map ? [playerTile()] : [];
    if (state.stoneGuard.active) {
      avoid.push({
        c: Math.floor(state.stoneGuard.x / TILE),
        r: Math.floor(state.stoneGuard.y / TILE)
      });
    }
    const tile = findEmptyTile(state.map, Math.random, avoid);
    state.notes.push({
      x: tile.c * TILE + (TILE - 12) / 2,
      y: tile.r * TILE + (TILE - 12) / 2,
      born: performance.now(),
      bobSeed: Math.random() * Math.PI * 2
    });
  }

  /**
   * 변기(화캉스 보너스) 스폰 — 맵에 최대 1개. 12초 주기 15% 확률 판정.
   * 기존 findEmptyTile 재사용, 플레이어 현재 타일 회피.
   */
  function spawnToilet() {
    if (state.toilets.length >= 1) return;
    const avoid = state.map ? [playerTile()] : [];
    const tile = findEmptyTile(state.map, Math.random, avoid);
    state.toilets.push({
      x: tile.c * TILE + (TILE - 16) / 2,
      y: tile.r * TILE + (TILE - 16) / 2,
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
      dy: d[1],
      type: isImCharmed(performance.now()) ? 'A' : 'F'
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
      // 상 난이도 강화 — 80→100 (이교수와 협공 시 압박 가중)
      chief.speed = 100;
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
      state.obstacles.push({ x: sx, y: sy, dx: dx, dy: dy, type: isImCharmed(performance.now()) ? 'A' : 'F' });
    }
    // 투척 순간 팔 올림 플래그 (이미 updateNurseChief에서도 처리되나 즉시 반영)
    // 효과음 — 공기 가르는 얕은 톤
    playTone(220, 0.06);
  }

  // =====================================================
  // 이교수(Professor Lee) NPC — 상 난이도 전용 듀얼 보스
  //   · 16×20 픽셀 스프라이트 (수간호사와 동일 사이즈)
  //   · 검정 뽀글머리 + 안경 + V넥 검정 자켓 + 흰 셔츠 — 흰옷 백발 수간호사와 시각적 대비
  //   · 청진기 투척으로 플레이어를 2초간 정지(frozenUntil)
  // =====================================================
  function professorSprite(dir, frame, throwArm) {
    const base = [
      '................', // 0
      '....HHHHHHHH....', // 1 머리 윗단
      '...HcHHHHHHcH...', // 2 뽀글 컬 하이라이트
      '..HcHHHHHHHHcH..', // 3 머리 폭 최대 (뽀글 인상)
      '..HHHSSSSSSHHH..', // 4 헤어라인 + 이마
      '..HHSSSSSSSSHH..', // 5
      '..HhSGGSSGGShH..', // 6 안경테
      '..HhSGgSSgGShH..', // 7 안경 렌즈
      '..HhSSNSSNSShH..', // 8 눈 밑 음영
      '..HhSSSMMSSShH..', // 9 입 (얇은 한 줄)
      '..HhhSNNNNShhH..', // 10 턱 + 머리 어깨까지 흘러내림
      '...JJAAWWAAJJ...', // 11 자켓 어깨 + V넥 + 흰 셔츠
      '..JJJJAWWAJJJJ..', // 12
      '..JjjjAWWAjjjJ..', // 13 자켓 음영
      '..JJJJJJJJJJJJ..', // 14
      '...JJJJJJJJJJ...', // 15
      '....JJJ..JJJ....', // 16 하의
      '....JJJ..JJJ....', // 17
      '....BB....BB....', // 18 구두
      '....BB....BB....'  // 19
    ];

    // 방향별 얼굴 — up은 뒷통수 (안경/입 제거), 좌우는 안경/입을 편향
    if (dir === 'up') {
      base[4] = '..HHHHHHHHHHHH..';
      base[5] = '..HhHHHHHHHHhH..';
      base[6] = '..HhHHHHHHHHhH..';
      base[7] = '..HhHHHHHHHHhH..';
      base[8] = '..HhHHHHHHHHhH..';
      base[9] = '..HhHHHHHHHHhH..';
      base[10] = '..HhhHHHHHHHhH..';
    } else if (dir === 'left') {
      base[6] = '..HhSSSSSSGGSH..';
      base[7] = '..HhSSSSSSgGSH..';
      base[8] = '..HhSSSSSSNSSH..';
      base[9] = '..HhSSSMMSSSSH..';
    } else if (dir === 'right') {
      base[6] = '..HSGGSSSSSShH..';
      base[7] = '..HSGgSSSSSShH..';
      base[8] = '..HSSNSSSSSShH..';
      base[9] = '..HSSSSMMSSShH..';
    }

    // 걷기 프레임 — 발만 교차
    if (frame === 1) {
      base[18] = '....BB...BBB....';
      base[19] = '....BBB...BB....';
    } else if (frame === 2) {
      base[18] = '....BBB...BB....';
      base[19] = '....BB...BBB....';
    }

    // 투척 자세 — 자켓 소매(J)를 어깨 위로 올린 실루엣
    if (throwArm) {
      if (dir === 'left') {
        base[10] = '..JJhSNNNNShhH..';
        base[11] = '..JJJJAAWWAAJJ..';
      } else if (dir === 'right') {
        base[10] = '..HhhSNNNNShJJ..';
        base[11] = '..JJAAWWAAJJJJ..';
      } else {
        base[10] = '..JJhSNNNNShJJ..';
        base[11] = '..JJJAAWWAAJJJ..';
      }
    }

    return base;
  }

  /**
   * 이교수 팔레트 — CSS 변수에서 읽어 테마 반응형 (캐시 + 테마 토글 시 무효화)
   */
  function getProfessorPalette() {
    if (professorPaletteCache) return professorPaletteCache;
    const rootStyle = getComputedStyle(document.documentElement);
    const readVar = (name, fallback) => {
      const v = rootStyle.getPropertyValue(name).trim();
      return v || fallback;
    };
    professorPaletteCache = {
      'S': '#f5d5c0',                                          // 피부
      'N': '#c08878',                                          // 피부 음영
      'H': readVar('--prof-hair', '#1a1216'),                  // 검정 뽀글머리
      'h': readVar('--prof-hair-shadow', '#0c080a'),           // 머리 음영
      'c': readVar('--prof-hair-curl', '#2a1e22'),             // 컬 하이라이트
      'G': readVar('--prof-glass-frame', '#1f1a1f'),           // 안경테
      'g': '#e8c8b8',                                          // 렌즈 안 (피부 톤)
      'M': '#5a3030',                                          // 입
      'J': readVar('--prof-coat', '#181418'),                  // 검정 자켓
      'j': readVar('--prof-coat-shadow', '#0a0608'),           // 자켓 음영
      'A': readVar('--prof-coat-accent', '#3a2e34'),           // V넥 칼라
      'W': '#e8e4e8',                                          // 흰 셔츠
      'B': '#0a0608'                                           // 검정 구두
    };
    return professorPaletteCache;
  }

  function drawProfessor(x, y, dir, frame, throwArm) {
    const sprite = professorSprite(dir, frame, throwArm);
    const palette = getProfessorPalette();
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
   * 청진기 투사체 — 14×8 픽셀 도트 스프라이트, 비행 중 자체 회전
   * @param {number} x - 중심 x
   * @param {number} y - 중심 y
   * @param {number} rot - 라디안 회전 (reduced-motion 시 0 권장)
   */
  function drawStethoscope(x, y, rot) {
    const palette = getProfessorPalette();
    const tubeColor = palette['J'] || '#181418';
    const bellColor = getComputedStyle(document.documentElement).getPropertyValue('--prof-stethoscope-bell').trim() || '#d8d4dc';
    const rimColor = getComputedStyle(document.documentElement).getPropertyValue('--prof-stethoscope').trim() || '#c8c8d0';
    const tubeStrong = getComputedStyle(document.documentElement).getPropertyValue('--prof-stethoscope-tube').trim() || '#2a2228';

    // 14×8 도트 매트릭스 (t=튜브, B=벨, m=림)
    const sprite = [
      '..tt......tt..',
      '..tt......tt..',
      '..tt......tt..',
      '...tt....tt...',
      '....tttttt....',
      '....tBBBBt....',
      '....BBBBBB....',
      '.....mmmm.....'
    ];
    const SCALE = 2;
    const W = 14, H = 8;
    const halfW = (W * SCALE) / 2;
    const halfH = (H * SCALE) / 2;

    ctx.save();
    ctx.translate(Math.round(x), Math.round(y));
    if (rot && !reducedMotion) ctx.rotate(rot);
    for (let r = 0; r < H; r++) {
      const row = sprite[r];
      for (let c = 0; c < W; c++) {
        const ch = row[c];
        if (ch === '.') continue;
        if (ch === 't') ctx.fillStyle = tubeStrong || tubeColor;
        else if (ch === 'B') ctx.fillStyle = bellColor;
        else if (ch === 'm') ctx.fillStyle = rimColor;
        ctx.fillRect(-halfW + c * SCALE, -halfH + r * SCALE, SCALE, SCALE);
      }
    }
    ctx.restore();
  }

  /**
   * 이교수 텔레그래프(!) — 코럴핑크로 표시하여 수간호사(빨강)와 시각적 구분
   */
  function drawProfessorTelegraph(x, y, now) {
    const ox = Math.round(x);
    const oy = Math.round(y) - 42;
    const coral = isLightTheme() ? '#e85a6a' : '#ff7b7b';
    if (!reducedMotion && Math.floor(now / 120) % 2 === 0) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(ox - 2, oy, 6, 8);
    ctx.fillRect(ox - 1, oy + 9, 4, 3);
    ctx.fillStyle = coral;
    ctx.fillRect(ox - 1, oy + 1, 4, 6);
    ctx.fillRect(ox, oy + 10, 2, 2);
  }

  /**
   * 이교수 초기화 — 상 난이도 startGame에서만 호출
   * 패트롤 경로: 수간호사(외곽 4모서리)와 다른 내부 8자 경로로 협공 동선 형성
   * 첫 진입 위치: 플레이어 spawn에서 가장 먼 점 (첫 프레임 즉사 방지)
   */
  function initProfessor() {
    const prof = state.professor;
    const leftX = TILE * 6;
    const rightX = TILE * (COLS - 7);
    const topY = TILE * 5;
    const bottomY = TILE * (ROWS - 6);

    // 8자(figure-8) 패트롤 — 4모서리 순환의 수간호사와 다른 동선
    prof.patrolPath = [
      { x: leftX,  y: topY },
      { x: rightX, y: bottomY },
      { x: rightX, y: topY },
      { x: leftX,  y: bottomY }
    ];

    // 플레이어 spawn에서 가장 먼 포인트 선택 (farthest-first)
    const spawnPx = state.player.x + state.player.w / 2;
    const spawnPy = state.player.y + state.player.h / 2;
    let farIdx = 0;
    let farDist = -1;
    for (let i = 0; i < prof.patrolPath.length; i++) {
      const pt = prof.patrolPath[i];
      const d = Math.hypot(pt.x - spawnPx, pt.y - spawnPy);
      if (d > farDist) { farDist = d; farIdx = i; }
    }
    prof.patrolIdx = farIdx;
    prof.x = prof.patrolPath[farIdx].x;
    prof.y = prof.patrolPath[farIdx].y;
    prof.dir = 'down';
    prof.frame = 0;
    prof.frameAcc = 0;
    prof.telegraphUntil = 0;
    prof.throwArmUntil = 0;
    prof.active = true;
    // 첫 청진기 투척까지 3.0s 대기 (게임 시작 직후 스턴 방지)
    prof.throwTimer = 3.0;
  }

  /**
   * 이교수 업데이트 — 패트롤 + 청진기 투척 타이머 (drawNurseChief의 패턴 미러링)
   * @param {number} dt - 델타타임(s)
   * @param {number} now - 현재 시각(ms)
   */
  function updateProfessor(dt, now) {
    const prof = state.professor;
    if (!prof.active || !prof.patrolPath.length) return;

    // 패트롤 이동
    const target = prof.patrolPath[prof.patrolIdx];
    const dx = target.x - prof.x;
    const dy = target.y - prof.y;
    const dist = Math.hypot(dx, dy);
    const step = PROFESSOR.patrolSpeed * dt;

    if (dist <= step || dist < 0.5) {
      prof.x = target.x;
      prof.y = target.y;
      prof.patrolIdx = (prof.patrolIdx + 1) % prof.patrolPath.length;
    } else {
      prof.x += (dx / dist) * step;
      prof.y += (dy / dist) * step;
      if (Math.abs(dx) > Math.abs(dy)) {
        prof.dir = dx > 0 ? 'right' : 'left';
      } else {
        prof.dir = dy > 0 ? 'down' : 'up';
      }
    }

    // 걷기 프레임
    if (!reducedMotion) {
      prof.frameAcc += dt;
      if (prof.frameAcc > 0.18) {
        prof.frameAcc = 0;
        prof.frame = prof.frame === 1 ? 2 : 1;
      }
    } else {
      prof.frame = 0;
    }

    // 청진기 투척 타이머 — 0.4s 텔레그래프 후 발사
    if (prof.telegraphUntil > 0 && now >= prof.telegraphUntil) {
      prof.telegraphUntil = 0;
      // 동시 청진기 상한 체크
      if (state.stethoscopes.length < PROFESSOR.stethoMax) {
        spawnStethoscopeFromProfessor();
      }
      prof.throwArmUntil = now + 180;
      // 다음 투척 — 시간 경과 보간
      const intervalSec = lerp(PROFESSOR.throwInterval[0], PROFESSOR.throwInterval[1], curveT());
      prof.throwTimer = intervalSec;
    } else if (prof.telegraphUntil === 0) {
      prof.throwTimer -= dt;
      if (prof.throwTimer <= 0) {
        prof.telegraphUntil = now + 400;
      }
    }
  }

  /**
   * 청진기 투사체 발사 — 발사 시점 플레이어 중심을 향한 단위 벡터 × stethoSpeed
   */
  function spawnStethoscopeFromProfessor() {
    const prof = state.professor;
    const p = state.player;
    const px = p.x + p.w / 2;
    const py = p.y + p.h / 2;
    const dx = px - prof.x;
    const dy = py - prof.y;
    const len = Math.hypot(dx, dy) || 1;
    const ndx = dx / len;
    const ndy = dy / len;
    // 시작 위치 — 이교수 바로 앞 12px 오프셋
    const sx = prof.x + ndx * 12;
    const sy = prof.y + ndy * 12;
    state.stethoscopes.push({
      x: sx,
      y: sy,
      dx: ndx,
      dy: ndy,
      born: performance.now()
    });
    // 효과음 — 약간 더 무거운 톤 (수간호사 F와 구분)
    playTone(180, 0.07);
  }

  // =====================================================
  // 석조무사 NPC — 중 난이도 전용 조무래기
  //  - 수간호사 밑에서 심부름하는 남학생. 투척 없음. 접촉 즉사.
  //  - 이교수의 패트롤 로직을 차용하되 청진기/텔레그래프/정지 필드는 전부 제거.
  // =====================================================
  /**
   * 석조무사 스프라이트 — 16×20 픽셀 도트.
   * 짧은 검정 머리(H) + 피부(K) + 눈(E) + 남색 교복 상의(U, 음영 u, 세로 단추 라인) + 짙은 회색 바지(P) + 검정 구두(B).
   * 수간호사의 캡/십자, 이교수의 안경/V자 라펠은 의도적으로 배제하여 "남학생 조무래기" 실루엣 확보.
   * @param {'up'|'down'|'left'|'right'} dir
   * @param {number} frame - 0(정지) / 1 / 2 (걷기 발 교차)
   */
  function stoneGuardSprite(dir, frame) {
    // 정면 기본형
    const base = [
      '................', // 0
      '.....HHHHHH.....', // 1 머리 윗단
      '....HHHHHHHH....', // 2 짧은 검정 머리 폭 최대
      '....HHHHHHHH....', // 3
      '....HKKKKKKH....', // 4 이마 + 헤어라인
      '....KKKKKKKK....', // 5 얼굴 상단
      '....KEKKKKEK....', // 6 날카로운 눈 두 점
      '....KKKKKKKK....', // 7 코 음영 없음(단순)
      '....KKKKKKKK....', // 8 입은 생략 (단호한 표정)
      '....KKKKKKKK....', // 9 턱
      '...UUUUUUUUUU...', // 10 교복 상의 어깨
      '..UUUuUUUUuUUU..', // 11 교복 폭 + 중앙 단추 라인 음영
      '..UUUuUUUUuUUU..', // 12
      '..UUUuUUUUuUUU..', // 13
      '..UUUUUUUUUUUU..', // 14 교복 하단(셔츠 밑단)
      '...UUUUUUUUUU...', // 15
      '....PPPP.PPPP...', // 16 바지 — 가운데 한 픽셀 빈 공간으로 두 다리 구분
      '....PPPP.PPPP...', // 17
      '....BBBB.BBBB...', // 18 검정 구두
      '....BBBB.BBBB...'  // 19
    ];

    // 방향별 얼굴 — up은 뒷통수(눈 제거), 좌/우는 눈을 한쪽으로 치우침
    if (dir === 'up') {
      base[4] = '....HHHHHHHH....';
      base[5] = '....HHHHHHHH....';
      base[6] = '....HHHHHHHH....';
      base[7] = '....HHHHHHHH....';
      base[8] = '....HHHHHHHH....';
      base[9] = '....HKKKKKKH....';
    } else if (dir === 'left') {
      base[6] = '....KEKKKKKK....';
    } else if (dir === 'right') {
      base[6] = '....KKKKKKEK....';
    }

    // 걷기 프레임 — 발만 교차
    if (frame === 1) {
      base[18] = '....BBB...BBB...';
      base[19] = '....BBBB.BBB....';
    } else if (frame === 2) {
      base[18] = '....BBB.BBBB....';
      base[19] = '....BBB...BBB...';
    }

    return base;
  }

  /**
   * 석조무사 팔레트 — CSS 변수 7개(U/u/P/K/H/E/B) 읽어 캐시.
   * 테마 토글 시 stoneGuardPaletteCache=null로 무효화되어 재해석된다.
   */
  function getStoneGuardPalette() {
    if (stoneGuardPaletteCache) return stoneGuardPaletteCache;
    const rootStyle = getComputedStyle(document.documentElement);
    const readVar = (name, fallback) => {
      const v = rootStyle.getPropertyValue(name).trim();
      return v || fallback;
    };
    stoneGuardPaletteCache = {
      'U': readVar('--stone-guard-uniform', '#2a3550'),
      'u': readVar('--stone-guard-uniform-dark', '#1a2238'),
      'P': readVar('--stone-guard-pants', '#1f2533'),
      'K': readVar('--stone-guard-skin', '#e8c9a6'),
      'H': readVar('--stone-guard-hair', '#1a1418'),
      'E': readVar('--stone-guard-eye', '#2a2228'),
      'B': readVar('--stone-guard-shoe', '#0f0f12')
    };
    return stoneGuardPaletteCache;
  }

  /**
   * 석조무사 렌더 — drawProfessor의 단순 버전 (텔레그래프/투척팔 없음).
   */
  function drawStoneGuard(x, y, dir, frame) {
    const sprite = stoneGuardSprite(dir, frame);
    const palette = getStoneGuardPalette();
    const SCALE = 2;
    const ox = Math.round(x) - 8;
    let oy = Math.round(y) - 24;
    // 걷기 프레임일 때 몸체 1px 보빙 — 이교수와 동일 규칙 (reducedMotion 시 고정)
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
   * 석조무사 초기화 — 중 난이도 startGame에서만 호출.
   * 4지점 사각 순환 경로, farthest-first로 플레이어 spawn에서 가장 먼 포인트 선택(첫 프레임 즉사 방지).
   * 벽 타일이면 인접 빈 셀로 클램프.
   */
  function initStoneGuard() {
    const sg = state.stoneGuard;
    const leftX = TILE * 4;
    const rightX = TILE * (COLS - 5);
    const topY = TILE * 4;
    const bottomY = TILE * (ROWS - 5);

    // 4지점 사각 순환 (수간호사/이교수와 다른 경로로 협공 동선 형성)
    const rawPath = [
      { x: leftX,  y: topY },
      { x: rightX, y: topY },
      { x: rightX, y: bottomY },
      { x: leftX,  y: bottomY }
    ];

    // 벽 타일이면 인접 빈 셀로 클램프 (SPEC 주의사항)
    sg.patrolPath = rawPath.map((pt) => {
      const c = Math.floor(pt.x / TILE);
      const r = Math.floor(pt.y / TILE);
      if (state.map && state.map[r] && state.map[r][c] === 0) {
        return { x: pt.x, y: pt.y };
      }
      // BFS 없이 가장 가까운 빈 셀 선형 탐색
      let best = null;
      let bestD = Infinity;
      for (let rr = 1; rr < ROWS - 1; rr++) {
        for (let cc = 1; cc < COLS - 1; cc++) {
          if (!state.map || state.map[rr][cc] !== 0) continue;
          const d = Math.abs(cc - c) + Math.abs(rr - r);
          if (d < bestD) { bestD = d; best = { c: cc, r: rr }; }
        }
      }
      if (!best) return { x: pt.x, y: pt.y };
      return { x: best.c * TILE + TILE / 2, y: best.r * TILE + TILE / 2 };
    });

    // 플레이어 spawn에서 가장 먼 포인트 선택 (farthest-first)
    const spawnPx = state.player.x + state.player.w / 2;
    const spawnPy = state.player.y + state.player.h / 2;
    let farIdx = 0;
    let farDist = -1;
    for (let i = 0; i < sg.patrolPath.length; i++) {
      const pt = sg.patrolPath[i];
      const d = Math.hypot(pt.x - spawnPx, pt.y - spawnPy);
      if (d > farDist) { farDist = d; farIdx = i; }
    }
    sg.patrolIdx = farIdx;
    sg.x = sg.patrolPath[farIdx].x;
    sg.y = sg.patrolPath[farIdx].y;
    sg.dir = 'down';
    sg.frame = 0;
    sg.frameAcc = 0;
    sg.active = true;
  }

  /**
   * 석조무사 업데이트 — 순수 이동형. 투척 타이머/텔레그래프 없음.
   * @param {number} dt - 델타타임(s)
   * @param {number} now - 현재 시각(ms)
   */
  function updateStoneGuard(dt, now) {
    const sg = state.stoneGuard;
    if (!sg.active || !sg.patrolPath.length) return;

    // 패트롤 이동
    const target = sg.patrolPath[sg.patrolIdx];
    const dx = target.x - sg.x;
    const dy = target.y - sg.y;
    const dist = Math.hypot(dx, dy);
    const step = STONE_GUARD.patrolSpeed * dt;

    if (dist <= step || dist < 0.5) {
      sg.x = target.x;
      sg.y = target.y;
      sg.patrolIdx = (sg.patrolIdx + 1) % sg.patrolPath.length;
    } else {
      sg.x += (dx / dist) * step;
      sg.y += (dy / dist) * step;
      if (Math.abs(dx) > Math.abs(dy)) {
        sg.dir = dx > 0 ? 'right' : 'left';
      } else {
        sg.dir = dy > 0 ? 'down' : 'up';
      }
    }

    // 걷기 프레임 — reducedMotion 시 정지
    if (!reducedMotion) {
      sg.frameAcc += dt;
      if (sg.frameAcc > 0.22) {
        sg.frameAcc = 0;
        sg.frame = sg.frame === 1 ? 2 : 1;
      }
    } else {
      sg.frame = 0;
    }
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
  // 스킬 발동 & 효과 처리
  //  - tryActivateSkill: 쿨다운 판정 + 실행 + 상태/사운드/파티클
  //  - executeSkill: 캐릭터별 실제 효과 분기. 발동 불가(예: geon 수집 0개)는 false 반환.
  //  - updateSkillHud: HUD 링/라벨/상태 클래스 + keypad 버튼 동기화.
  // =====================================================
  /**
   * 스킬 발동 시도. 쿨다운/오버레이 상태 확인 후 executeSkill에 위임.
   */
  function tryActivateSkill() {
    if (!state.running) return;
    if (isAnyOverlayOpen()) return;
    if (!hasSkill(state.characterId)) return; // 김간호는 스킬 없음
    const now = performance.now();
    if (now < state.skill.readyAt) return;
    const def = SKILLS[state.characterId];
    const fired = executeSkill(state.characterId, now);
    if (!fired) return; // 예: geon 수집 0개 → 쿨다운 미소모
    state.skill.lastUsedAt = now;
    state.skill.readyAt = now + def.cooldownMs;
    state.skill.activeUntil = now + def.durationMs;
    state.skill.flashUntil = now + 400;
    // 발동 사운드 — 2음 상승
    playTone(660, 0.08);
    setTimeout(() => playTone(880, 0.1), 70);
    // 파티클 — 플레이어 중심에서 확산 (reduced-motion 비활성)
    if (!reducedMotion) {
      spawnParticles(state.player.x + 7, state.player.y + 7, 12);
    }
    updateSkillHud(now);
  }

  /**
   * 캐릭터별 스킬 효과 실행.
   * @param {string} id - state.characterId
   * @param {number} now - performance.now()
   * @returns {boolean} 발동 성공 여부 (false면 쿨다운 미소모)
   */
  function executeSkill(id, now) {
    const p = state.player;

    if (id === 'jung') {
      // 암벽등반 돌진 — 현재 dir 벡터로 3타일 전진, 벽에 막히면 전방 벽 1칸을 부수고 중단
      let vx = 0, vy = 0;
      if (p.dir === 'up') vy = -1;
      else if (p.dir === 'down') vy = 1;
      else if (p.dir === 'left') vx = -1;
      else vx = 1;
      const STEP = TILE / 2;
      let traveled = 0;
      while (traveled < JUNG_DASH_PX) {
        const nx = p.x + vx * STEP;
        const ny = p.y + vy * STEP;
        if (state.map && isWallAt(state.map, nx, ny, p.w, p.h)) {
          // 전방 벽 1칸 분쇄 — 바운딩 박스 4 코너 중 첫 벽 타일
          const corners = [
            [nx, ny],
            [nx + p.w - 1, ny],
            [nx, ny + p.h - 1],
            [nx + p.w - 1, ny + p.h - 1]
          ];
          for (const [cx, cy] of corners) {
            const col = Math.floor(cx / TILE);
            const row = Math.floor(cy / TILE);
            if (state.map[row] && state.map[row][col] === 1) {
              state.map[row][col] = 0;
              if (!reducedMotion) {
                spawnParticles(col * TILE + TILE / 2, row * TILE + TILE / 2, 14);
              }
              playTone(180, 0.12);
              break;
            }
          }
          break;
        }
        p.x = nx;
        p.y = ny;
        traveled += STEP;
      }
      p.invincibleUntil = now + 260;
      return true;
    }

    if (id === 'geon') {
      // 북클럽 소집 — 주변 6타일 이내 음표 일괄 수집. 0개면 실패.
      const pcx = p.x + p.w / 2;
      const pcy = p.y + p.h / 2;
      const collected = [];
      for (let i = state.notes.length - 1; i >= 0; i--) {
        const n = state.notes[i];
        const nx = n.x + 6;
        const ny = n.y + 6;
        const d = Math.hypot(nx - pcx, ny - pcy);
        if (d <= GEON_MAGNET_RADIUS) {
          collected.push({ x: n.x, y: n.y });
          state.notes.splice(i, 1);
        }
      }
      if (collected.length === 0) return false;

      // 기존 음표 수집 공식 그대로 N회 적용 (combo/score/hud/scale 동기)
      for (let k = 0; k < collected.length; k++) {
        state.combo += 1;
        if (state.combo > state.maxCombo) state.maxCombo = state.combo;
        state.collected += 1;
        let gain = 1;
        if (state.combo >= 7) gain += 3;
        else if (state.combo >= 5) gain += 2;
        else if (state.combo >= 3) gain += 1;
        state.score += gain;
      }
      hudScore.textContent = String(state.score);
      updateComboHud(true);
      // 사운드는 마지막 1회 — 다중 재생 오버플로 방지
      const freqIdx = Math.min(state.combo - 1, SCALE_FREQS.length - 1);
      playTone(SCALE_FREQS[freqIdx], 0.12);
      // 파티클 — 각 위치에 4개
      if (!reducedMotion) {
        for (const c of collected) spawnParticles(c.x + 6, c.y + 6, 4);
      }
      return true;
    }

    if (id === 'im') {
      // 벼락치기 — 매혹. 필드의 기존 F를 즉시 A로 전환하고, 지속시간 동안 신규 투척도 A로.
      for (const o of state.obstacles) o.type = 'A';
      return true;
    }

    if (id === 'lee') {
      // 워프 — 가장 먼 빈 타일로 순간 이동 + 0.5s 무적
      const CHIEF_SAFE = SPAWN_SAFE_DIST;
      const pcTile = playerTile();
      const hasChief = state.nurseChief.active;
      const chiefTile = hasChief ? {
        c: Math.floor(state.nurseChief.x / TILE),
        r: Math.floor(state.nurseChief.y / TILE)
      } : null;
      const hasProf = state.professor.active;
      const profTile = hasProf ? {
        c: Math.floor(state.professor.x / TILE),
        r: Math.floor(state.professor.y / TILE)
      } : null;

      let bestTile = null;
      let bestScore = -1;
      for (let r = 1; r < ROWS - 1; r++) {
        for (let c = 1; c < COLS - 1; c++) {
          if (!state.map || state.map[r][c] !== 0) continue;
          // NPC 안전 거리
          if (chiefTile && Math.abs(chiefTile.c - c) + Math.abs(chiefTile.r - r) < CHIEF_SAFE) continue;
          if (profTile && Math.abs(profTile.c - c) + Math.abs(profTile.r - r) < CHIEF_SAFE) continue;
          const d = Math.abs(pcTile.c - c) + Math.abs(pcTile.r - r);
          if (d > bestScore) {
            bestScore = d;
            bestTile = { c, r };
          }
        }
      }
      if (!bestTile) return false;

      // 출발 파티클
      if (!reducedMotion) {
        spawnParticles(p.x + p.w / 2, p.y + p.h / 2, 10);
      }
      p.x = bestTile.c * TILE + 3;
      p.y = bestTile.r * TILE + 3;
      p.invincibleUntil = now + 500;
      // 도착 파티클
      if (!reducedMotion) {
        spawnParticles(p.x + p.w / 2, p.y + p.h / 2, 10);
      }
      return true;
    }

    return false;
  }

  /**
   * HUD 스킬 슬롯 + 모바일 스킬 버튼 상태 동기화.
   * conic-gradient 진행률(--skill-prog 0~1)과 ready/cooling/flash 클래스 토글.
   */
  function updateSkillHud(now) {
    const id = state.characterId || 'kim';
    // 김간호(스킬 없음): HUD 슬롯/모바일 버튼 숨김
    if (!hasSkill(id)) {
      if (hudSkillSlot) hudSkillSlot.classList.add('is-hidden');
      if (keypadSkillBtn) keypadSkillBtn.classList.add('is-hidden');
      return;
    }
    if (hudSkillSlot) hudSkillSlot.classList.remove('is-hidden');
    if (keypadSkillBtn) keypadSkillBtn.classList.remove('is-hidden');
    const def = SKILLS[id];
    if (hudSkillLabel) hudSkillLabel.textContent = def.abbr;
    // 패널/HUD/키패드 악센트 동기화 — 캐릭터 변경 시 data-char 재주입
    if (hudSkillSlot && hudSkillSlot.getAttribute('data-char') !== id) {
      hudSkillSlot.setAttribute('data-char', id);
    }
    if (keypadSkillBtn && keypadSkillBtn.getAttribute('data-char') !== id) {
      keypadSkillBtn.setAttribute('data-char', id);
    }

    const cd = def.cooldownMs;
    const remaining = Math.max(0, state.skill.readyAt - now);
    const prog = cd > 0 ? (1 - Math.max(0, Math.min(1, remaining / cd))) : 1;
    if (hudSkill) hudSkill.style.setProperty('--skill-prog', String(prog));

    const ready = remaining <= 0;
    const flashing = now < state.skill.flashUntil;

    const applyState = (el) => {
      if (!el) return;
      el.classList.toggle('is-skill-ready', ready && !flashing);
      el.classList.toggle('is-skill-cooling', !ready);
      el.classList.toggle('is-skill-flash', flashing);
    };
    applyState(hudSkillSlot);
    applyState(keypadSkillBtn);
  }

  // =====================================================
  // 매 프레임 업데이트
  // =====================================================
  function update(dt, now) {
    const diff = DIFFICULTY[state.difficulty];
    const p = state.player;
    const stunned = now < p.stunUntil;
    // 청진기 피격 시 2초간 자리에 묶임 — stun과 별개 필드 (즉사 X, 입력만 차단)
    const frozen = now < p.frozenUntil;
    const immobile = stunned || frozen;

    // 이동
    let vx = 0, vy = 0;
    if (!immobile) {
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

    // (임간호 벼락치기는 슬로우에서 "F→A 매혹 전환"으로 변경됨. dtSlow는 dt와 동일.)
    const dtSlow = dt;

    // 장애물(F) 이동 — 속도 보간, 히트박스 12×12
    const oStep = currentObsSpeed() * dtSlow;
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

    // 수간호사 NPC 업데이트 — 패트롤 이동 + 투척 타이머 처리 (im 슬로우 반영)
    updateNurseChief(dtSlow, now);

    // 이교수 NPC 업데이트 — 상 난이도 전용 (active=false면 함수 내부 가드)
    updateProfessor(dtSlow, now);

    // 석조무사 NPC 업데이트 — 중 난이도 전용 (active=false면 함수 내부 가드)
    updateStoneGuard(dtSlow, now);

    // 청진기 투사체 이동 — 직선 비행, 벽/화면 밖 도달 시 소멸 (관통 X)
    {
      const sStep = PROFESSOR.stethoSpeed * dtSlow;
      for (let i = state.stethoscopes.length - 1; i >= 0; i--) {
        const s = state.stethoscopes[i];
        s.x += s.dx * sStep;
        s.y += s.dy * sStep;
        // 화면 밖 또는 벽 충돌 → 소멸
        if (s.x < TILE / 2 || s.x > CANVAS_W - TILE / 2 ||
            s.y < TILE / 2 || s.y > CANVAS_H - TILE / 2 ||
            (state.map && isWallAt(state.map, s.x - 6, s.y - 6, 12, 12))) {
          state.stethoscopes.splice(i, 1);
        }
      }
    }

    // 음표 만료 & 보충
    if (diff.noteTtl !== Infinity) {
      state.notes = state.notes.filter(n => (now - n.born) < diff.noteTtl);
    }
    while (state.notes.length < diff.notes) spawnNote();

    // 변기(화캉스 보너스) — TTL 만료 정리 + 주기 스폰 판정
    state.toilets = state.toilets.filter(t => (now - t.born) < TOILET.ttl);
    if (now >= state.nextToiletAt) {
      state.nextToiletAt = now + TOILET.spawnInterval * 1000;
      if (Math.random() < TOILET.spawnChance) spawnToilet();
    }

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

    // 변기(화캉스 보너스) 수집 판정 — 음표 2개어치 (콤보 +2, 각 단계 gain 합산)
    for (let i = state.toilets.length - 1; i >= 0; i--) {
      const t = state.toilets[i];
      if (p.x < t.x + 16 && p.x + p.w > t.x &&
          p.y < t.y + 16 && p.y + p.h > t.y) {
        state.toilets.splice(i, 1);

        // 음표 1개분 gain 로직을 bonusMultiplier(=2)회 적용
        let totalGain = 0;
        for (let k = 0; k < TOILET.bonusMultiplier; k++) {
          state.combo += 1;
          if (state.combo > state.maxCombo) state.maxCombo = state.combo;
          state.collected += 1;
          let gain = 1;
          if (state.combo >= 7) gain += 3;
          else if (state.combo >= 5) gain += 2;
          else if (state.combo >= 3) gain += 1;
          totalGain += gain;
        }
        state.score += totalGain;
        hudScore.textContent = String(state.score);
        updateComboHud(true);

        // 사운드 2연타 — 살짝 높은 음
        const freqIdx = Math.min(state.combo - 1, SCALE_FREQS.length - 1);
        const freqIdx2 = Math.min(freqIdx + 1, SCALE_FREQS.length - 1);
        playTone(SCALE_FREQS[freqIdx], 0.09);
        setTimeout(() => playTone(SCALE_FREQS[freqIdx2], 0.09), 70);

        // 파티클
        if (!reducedMotion) spawnParticles(t.x + 8, t.y + 8, 16);

        // 토스트
        state.toiletToastUntil = now + TOILET.toastDuration;
      }
    }

    // 수간호사 본체 직접 충돌 — 즉사 처리 (F 충돌과 동등, SPEC 기능 2)
    // F에만 의존하던 회피 부담을 순찰 경로 읽기로 확장한다.
    // 스킬 무적(invincibleUntil) 중에는 충돌 판정 전체 스킵.
    if (state.nurseChief.active && now >= p.invincibleUntil) {
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

    // 이교수 본체 충돌 — 수간호사와 동일하게 즉사 처리 (무적 중 스킵)
    if (state.professor.active && now >= p.invincibleUntil) {
      const prof = state.professor;
      const PROF_HB = 14;
      const cx = prof.x - PROF_HB / 2;
      const cy = prof.y - PROF_HB / 2;
      if (p.x < cx + PROF_HB && p.x + p.w > cx &&
          p.y < cy + PROF_HB && p.y + p.h > cy) {
        state.hits += 1;
        state.combo = 0;
        updateComboHud(false);

        playTone(110, 0.25);
        setTimeout(() => playTone(82, 0.35), 100);

        if (canvasWrap && !reducedMotion) {
          canvasWrap.classList.remove('is-shake');
          void canvasWrap.offsetWidth;
          canvasWrap.classList.add('is-shake', 'is-gameover');
        }

        state.gameoverReason = 'hit';
        endGame();
        return;
      }
    }

    // 석조무사 본체 충돌 — 수간호사/이교수와 동일하게 즉사 처리 (무적 중 스킵)
    if (state.stoneGuard.active && now >= p.invincibleUntil) {
      const sg = state.stoneGuard;
      const HB = STONE_GUARD.hitbox;
      const cx = sg.x - HB / 2;
      const cy = sg.y - HB / 2;
      if (p.x < cx + HB && p.x + p.w > cx &&
          p.y < cy + HB && p.y + p.h > cy) {
        state.hits += 1;
        state.combo = 0;
        updateComboHud(false);

        playTone(110, 0.25);
        setTimeout(() => playTone(82, 0.35), 100);

        if (canvasWrap && !reducedMotion) {
          canvasWrap.classList.remove('is-shake');
          void canvasWrap.offsetWidth;
          canvasWrap.classList.add('is-shake', 'is-gameover');
        }

        state.gameoverReason = 'hit';
        endGame();
        return;
      }
    }

    // 청진기 투사체 충돌 — 즉사 X, 2초 정지(frozenUntil) + 콤보 리셋 + 청진기 소멸
    // hits를 증가시키지 않으므로 정확도 통계가 디버프로 인해 깎이지 않는다.
    // 스킬 무적 중에는 스킵 (청진기는 관통하지 않고 그대로 비행 계속).
    const stethoSkip = now < p.invincibleUntil;
    for (let i = state.stethoscopes.length - 1; i >= 0; i--) {
      if (stethoSkip) break;
      const s = state.stethoscopes[i];
      // 충돌 박스 12×12 (스프라이트 14×8보다 약간 넉넉하게)
      const sx = s.x - 6;
      const sy = s.y - 6;
      if (p.x < sx + 12 && p.x + p.w > sx &&
          p.y < sy + 12 && p.y + p.h > sy) {
        state.stethoscopes.splice(i, 1);
        p.frozenUntil = now + PROFESSOR.freezeDuration;
        // 콤보 끊김 — F 피격과 동일하게 흐름 단절감 부여
        state.combo = 0;
        updateComboHud(false);
        // 효과음 — 둔탁한 2연타 (F의 110/82 저음 2연타와 구분되는 중역대)
        playTone(440, 0.08);
        setTimeout(() => playTone(220, 0.15), 100);
      }
    }

    // 매혹 중 A 수집 — F 충돌보다 먼저 처리. 각 A는 점수 2배(콤보 포함).
    for (let i = state.obstacles.length - 1; i >= 0; i--) {
      const o = state.obstacles[i];
      if (o.type !== 'A') continue;
      if (p.x < o.x + 12 && p.x + p.w > o.x &&
          p.y < o.y + 12 && p.y + p.h > o.y) {
        state.obstacles.splice(i, 1);
        state.combo += 1;
        if (state.combo > state.maxCombo) state.maxCombo = state.combo;
        state.collected += 1;
        let gain = 1;
        if (state.combo >= 7) gain += 3;
        else if (state.combo >= 5) gain += 2;
        else if (state.combo >= 3) gain += 1;
        state.score += gain * 2; // 점수 2배
        hudScore.textContent = String(state.score);
        updateComboHud(true);
        const freqIdx = Math.min(state.combo - 1, SCALE_FREQS.length - 1);
        playTone(SCALE_FREQS[freqIdx], 0.1);
        setTimeout(() => playTone(SCALE_FREQS[freqIdx] * 1.26, 0.09), 60);
        if (!reducedMotion) spawnParticles(o.x + 6, o.y + 6, 12);
      }
    }

    // 장애물(F) 충돌 — 즉사 처리 (SPEC 기능 6)
    // 한 번이라도 F에 닿으면 즉시 endGame
    // 스킬 무적(invincibleUntil) 중에는 충돌 루프 전체를 스킵하여 F를 흘려보낸다.
    const fSkip = now < p.invincibleUntil;
    for (const o of state.obstacles) {
      if (fSkip) break;
      if (o.type === 'A') continue; // A는 위 블록에서 이미 처리
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

    // 스킬 HUD — 쿨다운 링/라벨/브레싱/플래시 상태 동기화
    updateSkillHud(now);

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

    // 변기(화캉스 보너스) — TTL 말기 1초 깜빡임
    for (const t of state.toilets) {
      const left = TOILET.ttl - (now - t.born);
      if (left < 1000 && !reducedMotion && Math.floor(now / 120) % 2 === 0) continue;
      const bob = reducedMotion ? 0 : Math.sin((now / 220) + t.bobSeed) * 1.2;
      drawToilet(t.x, t.y, bob);
    }

    // 장애물
    for (const o of state.obstacles) drawObstacle(o.x, o.y, o.type);

    // 수간호사 NPC (플레이어보다 먼저 — 층 순서 유지)
    const chief = state.nurseChief;
    if (chief.active) {
      const throwArm = now < chief.throwArmUntil || chief.telegraphUntil > 0;
      drawNurseChief(chief.x, chief.y, chief.dir, chief.frame, throwArm, isImCharmed(now));
      // 텔레그래프(!) — 투척 전 0.4s 머리 위에 표시
      if (chief.telegraphUntil > 0 && now < chief.telegraphUntil) {
        drawTelegraph(chief.x, chief.y, now);
      }
    }

    // 이교수 NPC — 수간호사 다음 층(겹칠 시 위에 그림)
    const prof = state.professor;
    if (prof.active) {
      const profThrowArm = now < prof.throwArmUntil || prof.telegraphUntil > 0;
      drawProfessor(prof.x, prof.y, prof.dir, prof.frame, profThrowArm);
      if (prof.telegraphUntil > 0 && now < prof.telegraphUntil) {
        drawProfessorTelegraph(prof.x, prof.y, now);
      }
    }

    // 석조무사 NPC — 중 난이도 전용 (투척 없음, 순수 이동)
    const sg = state.stoneGuard;
    if (sg.active) {
      drawStoneGuard(sg.x, sg.y, sg.dir, sg.frame);
    }

    // 청진기 투사체 — 비행 중 자체 회전 (reduced-motion 시 회전 비활성)
    if (state.stethoscopes.length > 0) {
      const rot = reducedMotion ? 0 : (now / 100) % (Math.PI * 2);
      for (const s of state.stethoscopes) {
        drawStethoscope(s.x, s.y, rot);
      }
    }

    // 플레이어 — stun(F 즉사 잔상)/frozen(청진기 정지) 시 깜빡임
    const p = state.player;
    const stunned = now < p.stunUntil;
    const frozen = now < p.frozenUntil;
    // reduced-motion: 깜빡임 비활성, 항상 그림
    const blinkVisible = reducedMotion || (!stunned && !frozen) || Math.floor(now / 80) % 2 === 0;
    if (blinkVisible) {
      drawNurse(p.x, p.y, p.dir, p.frame, state.characterId);
      // frozen 중일 때 발 밑 청진기 정지 인디케이터 — 코럴톤 작은 호
      if (frozen) {
        const coral = isLightTheme() ? '#e85a6a' : '#ff7b7b';
        const cx = Math.round(p.x + p.w / 2);
        const cy = Math.round(p.y + p.h + 4);
        ctx.save();
        ctx.fillStyle = coral;
        // 8×4 작은 청진기 잔상 (도트)
        ctx.fillRect(cx - 4, cy, 1, 1);
        ctx.fillRect(cx + 3, cy, 1, 1);
        ctx.fillRect(cx - 3, cy + 1, 6, 1);
        ctx.fillRect(cx - 2, cy + 2, 4, 1);
        ctx.restore();
      }
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

    // 화캉스 보너스 토스트 — HUD보다 위 레이어. 정적 상수 텍스트이므로 XSS 무관.
    if (now < state.toiletToastUntil) {
      const remain = state.toiletToastUntil - now;
      const alpha = Math.min(1, remain / 300); // 마지막 300ms 페이드아웃
      ctx.save();
      ctx.globalAlpha = alpha;
      const text = '화캉스 보너스!';
      ctx.font = 'bold 18px "Pretendard", system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const cx = CANVAS_W / 2;
      const cy = 40;
      // 외곽 그림자
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(cx - 110, cy - 18, 220, 36);
      // 본체 배경
      ctx.fillStyle = isLightTheme() ? '#fff5d6' : '#3a2a10';
      ctx.fillRect(cx - 108, cy - 16, 216, 32);
      // 텍스트
      ctx.fillStyle = isLightTheme() ? '#8a5a00' : '#ffd580';
      ctx.fillText(text, cx, cy);
      ctx.restore();
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

  /**
   * 터치 디바이스 전용 초기화.
   * 기존 D-pad 버튼 바인딩을 제거하고, 캔버스 탭 기반 상대방향 이동으로 대체한다.
   */
  function initTouchControls() {
    if (!canvas) return;
    const controlsHint = document.querySelector('.game-controls');
    if (controlsHint) controlsHint.style.display = 'none';
    // 캔버스 위에서의 기본 스크롤/줌 제스처 차단
    canvas.addEventListener('touchmove', e => e.preventDefault(), { passive: false });
    initCanvasTapMove();
    initKeypad();
  }

  // 키패드/키보드/캔버스 탭이 동일 dir을 공유하므로, 한쪽을 떼도 다른 입력이
  // 여전히 눌려 있다면 `state.keys[dir]`을 유지하기 위한 레퍼런스 카운터.
  // `clearDpadPressed()`에서 함께 0으로 리셋한다.
  const dpadPressCount = { up: 0, down: 0, left: 0, right: 0 };

  /**
   * 모바일 하단 키패드(세로 전용) 초기화.
   * 캔버스 아래 고정된 4방향 D-Pad 버튼을 Pointer Events로 바인딩해
   * `state.keys[dir]` 레일에 직접 반영한다. 두 버튼 동시 터치로 대각선 이동 지원.
   */
  function initKeypad() {
    const root = document.getElementById('gameKeypad');
    if (!root) return;
    root.hidden = false;
    root.setAttribute('aria-hidden', 'false');

    // 중앙 스킬 버튼 — 방향 버튼과 달리 단발성 발동 (pointerdown)
    if (keypadSkillBtn) {
      let skillPointerId = null;
      keypadSkillBtn.addEventListener('pointerdown', (e) => {
        if (isAnyOverlayOpen() || !state.running) return;
        if (skillPointerId !== null) return;
        e.preventDefault();
        skillPointerId = e.pointerId;
        try { keypadSkillBtn.setPointerCapture(e.pointerId); } catch (_) { /* 무시 */ }
        keypadSkillBtn.classList.add('is-pressed');
        tryActivateSkill();
      });
      const releaseSkill = (e) => {
        if (skillPointerId === null) return;
        if (e && e.pointerId !== skillPointerId) return;
        skillPointerId = null;
        keypadSkillBtn.classList.remove('is-pressed');
      };
      keypadSkillBtn.addEventListener('pointerup', releaseSkill);
      keypadSkillBtn.addEventListener('pointercancel', releaseSkill);
      keypadSkillBtn.addEventListener('pointerleave', releaseSkill);
      keypadSkillBtn.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    const btns = root.querySelectorAll('.game-keypad__btn');
    btns.forEach((btn) => {
      const dir = btn.dataset.dir;
      if (!dir) return;
      let activePointerId = null;

      const release = () => {
        activePointerId = null;
        dpadPressCount[dir] = Math.max(0, dpadPressCount[dir] - 1);
        if (dpadPressCount[dir] === 0) state.keys[dir] = false;
        btn.classList.remove('is-pressed');
      };

      btn.addEventListener('pointerdown', (e) => {
        if (isAnyOverlayOpen()) return;
        if (activePointerId !== null) return; // 같은 버튼 중복 포인터 가드
        e.preventDefault();
        activePointerId = e.pointerId;
        try { btn.setPointerCapture(e.pointerId); } catch (_) { /* capture 실패 무시 */ }
        dpadPressCount[dir] += 1;
        state.keys[dir] = true;
        btn.classList.add('is-pressed');
      });

      const onEnd = (e) => {
        if (activePointerId === null) return;
        if (e.pointerId !== activePointerId) return;
        release();
      };
      btn.addEventListener('pointerup', onEnd);
      btn.addEventListener('pointercancel', onEnd);
      btn.addEventListener('pointerleave', onEnd);
      btn.addEventListener('contextmenu', (e) => e.preventDefault());
    });
  }

  /**
   * 오버레이 전환 시 키패드의 `is-pressed` 잔존 상태와 프레스 카운터를 동시에 리셋.
   * 카운터를 리셋하지 않으면 오버레이 해제 후 팬텀 입력이 남을 수 있다.
   */
  function clearDpadPressed() {
    const pressed = document.querySelectorAll('#gameKeypad .game-keypad__btn.is-pressed');
    pressed.forEach((b) => b.classList.remove('is-pressed'));
    dpadPressCount.up = 0;
    dpadPressCount.down = 0;
    dpadPressCount.left = 0;
    dpadPressCount.right = 0;
    // 스킬 버튼 is-pressed 잔존 방지 — 팬텀 입력 차단
    if (keypadSkillBtn) keypadSkillBtn.classList.remove('is-pressed');
  }

  /**
   * 캔버스 탭/드래그로 플레이어를 상대 방향으로 이동시킨다.
   * 플레이어 중심 대비 포인터 좌표의 우세 축을 4방향으로 판정하여 state.keys에 반영.
   * 데드존(TILE*0.4) 내에서는 정지, 오버레이 활성 중에는 무시.
   */
  function initCanvasTapMove() {
    if (!canvas) return;

    const DEAD_ZONE = TILE * 0.4;
    let activePointerId = null;

    const clearKeys = () => {
      state.keys.up = false;
      state.keys.down = false;
      state.keys.left = false;
      state.keys.right = false;
    };

    const resolveDir = (clientX, clientY) => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return null;
      const scaleX = CANVAS_W / rect.width;
      const scaleY = CANVAS_H / rect.height;
      const tx = (clientX - rect.left) * scaleX;
      const ty = (clientY - rect.top) * scaleY;
      const p = state.player;
      if (!p) return null;
      const px = p.x + p.w / 2;
      const py = p.y + p.h / 2;
      const dx = tx - px;
      const dy = ty - py;
      if (Math.abs(dx) < DEAD_ZONE && Math.abs(dy) < DEAD_ZONE) return null;
      // 우세 축 기반 4방향 결정
      if (Math.abs(dx) >= Math.abs(dy)) {
        return dx > 0 ? 'right' : 'left';
      }
      return dy > 0 ? 'down' : 'up';
    };

    const applyDir = (dir) => {
      clearKeys();
      if (dir) state.keys[dir] = true;
    };

    const onDown = (e) => {
      if (isAnyOverlayOpen()) return;
      e.preventDefault();
      activePointerId = e.pointerId;
      applyDir(resolveDir(e.clientX, e.clientY));
    };

    const onMove = (e) => {
      if (activePointerId === null || e.pointerId !== activePointerId) return;
      if (isAnyOverlayOpen()) { clearKeys(); return; }
      e.preventDefault();
      applyDir(resolveDir(e.clientX, e.clientY));
    };

    const onEnd = (e) => {
      if (activePointerId !== null && e.pointerId !== activePointerId) return;
      activePointerId = null;
      clearKeys();
    };

    canvas.addEventListener('pointerdown', onDown, { passive: false });
    canvas.addEventListener('pointermove', onMove, { passive: false });
    canvas.addEventListener('pointerup', onEnd, { passive: false });
    canvas.addEventListener('pointercancel', onEnd, { passive: false });
    canvas.addEventListener('pointerleave', onEnd, { passive: false });
    canvas.addEventListener('contextmenu', e => e.preventDefault());
  }

  // =====================================================
  // 초기화
  // =====================================================
  loadBest();
  // 기본값은 항상 김간호 — 이전 선택을 복원하지 않는다.
  initCharacterGrid();
  applyNurseNameToDom();
  updateBestHud();
  updateStartGoal();
  if (isTouchDevice()) initTouchControls();
  // 스킬 HUD 라벨 초기화 — 게임 시작 전에도 "회피" 등 캐릭터별 abbr을 표기
  updateSkillHud(performance.now());

  /**
   * 시작 오버레이 뒤 캔버스 프리뷰 — 김간호 + 수간호사 + F 한 장
   * 초기 로드 시 / "난이도 다시 선택" 복귀 시 호출
   */
  function renderPreview() {
    const diff = state.difficulty || 'easy';
    const previewMap = buildMap(DIFFICULTY[diff] ? DIFFICULTY[diff].map : 'easy');
    ctx.fillStyle = isLightTheme() ? '#e8e7ec' : '#09080f';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    drawMap(previewMap);
    // 플레이어(선택된 캐릭터) — 우측 중앙
    drawNurse(TILE * 20 + 2, TILE * 9 + 2, 'left', 0, state.characterId);
    // 수간호사 (좌측 중앙) + F 한 장 — 던지기 직전 구도
    drawNurseChief(TILE * 11 + 2, TILE * 9 + 2, 'right', 0, true);
    drawObstacle(TILE * 15 + 4, TILE * 9 + 4);
    // 상 난이도 — 이교수도 함께 표시하여 신규 적의 존재를 사전 예고
    if (diff === 'hard') {
      drawProfessor(TILE * 6 + 2, TILE * 5 + 2, 'right', 0, true);
      // 청진기 한 장 — 비행 중 회전 0 (정지 미리보기)
      drawStethoscope(TILE * 9, TILE * 7, 0);
    }
  }

  // 기본 난이도 easy 활성 표시는 이미 HTML에서 aria-checked="true"
  renderPreview();
})();
