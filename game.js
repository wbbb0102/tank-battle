(() => {
  'use strict';

  // ---------------------------------------------------------------------------
  // Canvas & constants
  // ---------------------------------------------------------------------------

  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d', { alpha: false });
  const TILE = 48;
  const COLS = 13;
  const ROWS = 13;
  const WIDTH = COLS * TILE;
  const HEIGHT = ROWS * TILE;
  const TAU = Math.PI * 2;
  let renderScale = 1;

  function resizeCanvas() {
    const renderedWidth = canvas.getBoundingClientRect().width || WIDTH;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const scale = Math.max(1, (renderedWidth / WIDTH) * dpr);
    renderScale = scale;
    canvas.width = Math.round(WIDTH * scale);
    canvas.height = Math.round(HEIGHT * scale);
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
  }

  const EMPTY = 0;
  const BRICK = 1;
  const STEEL = 2;
  const WATER = 3;
  const BUSH = 4;

  const DIRECTIONS = {
    up: { x: 0, y: -1, angle: 0, opposite: 'down' },
    right: { x: 1, y: 0, angle: Math.PI / 2, opposite: 'left' },
    down: { x: 0, y: 1, angle: Math.PI, opposite: 'up' },
    left: { x: -1, y: 0, angle: -Math.PI / 2, opposite: 'right' }
  };
  const DIRECTION_NAMES = ['up', 'right', 'down', 'left'];
  const SPAWN_CELLS = [
    { col: 0, row: 0 },
    { col: 6, row: 0 },
    { col: 12, row: 0 }
  ];

  const LEVELS = [
    {
      name: '灰烬街区',
      code: 'ASH DISTRICT',
      player: { col: 2, row: 12 },
      rows: [
        '.............',
        '.##.##.##.##.',
        '.#...@.@...#.',
        '...#.....#...',
        '.##..###..##.',
        '.....#.#.....',
        '.~....#....~.',
        '.~....#....~.',
        '.....#.#.....',
        '.##..###..##.',
        '...#.....#...',
        '....#####....',
        '.....#B#.....'
      ]
    },
    {
      name: '断桥河谷',
      code: 'BROKEN RIVER',
      player: { col: 2, row: 12 },
      rows: [
        '.............',
        '.#..#...#..#.',
        '.#..#...#..#.',
        '.~~~~...~~~~.',
        '.~~~~...~~~~.',
        '.#..#...#..#.',
        '.#..#...#..#.',
        '.~~~~...~~~~.',
        '.~~~~...~~~~.',
        '.#..#...#..#.',
        '###.......###',
        '....#####....',
        '.....#B#.....'
      ]
    },
    {
      name: '钢铁要塞',
      code: 'IRON FORTRESS',
      player: { col: 3, row: 12 },
      rows: [
        '.............',
        '.@#..###..#@.',
        '.@#..#.#..#@.',
        '.....#.#.....',
        '.##..#.#..##.',
        '.###.....###.',
        '....#TTT#....',
        '.###.....###.',
        '.##..#.#..##.',
        '.....#.#.....',
        '.@#..#.#..#@.',
        '.@#.#####.#@.',
        '.....#B#.....'
      ]
    },
    {
      name: '幽暗花园',
      code: 'NIGHT GARDEN',
      player: { col: 2, row: 12 },
      rows: [
        '.............',
        '..##.....##..',
        '...T.....T...',
        '.###..@..###.',
        '.....###.....',
        '~~..#...#..~~',
        '~~..#...#..~~',
        '.....###.....',
        '.###.....###.',
        '...T.....T...',
        '..##.....##..',
        '....#####....',
        '.....#B#.....'
      ]
    },
    {
      name: '零点核心',
      code: 'ZERO CORE',
      player: { col: 2, row: 12 },
      rows: [
        '.............',
        '.##.@@@@@.##.',
        '.##.......##.',
        '....#.#.#....',
        '.@#.#...#.#@.',
        '.@#.......#@.',
        '....~~.~~....',
        '.@#.......#@.',
        '.@#.#...#.#@.',
        '....#.#.#....',
        '.##.......##.',
        '....#####....',
        '.....#B#.....'
      ]
    }
  ];

  const PLAYER_PALETTE = {
    body: '#4be7d4',
    bodyDark: '#127f7b',
    accent: '#d7fff8',
    track: '#0b3537',
    trackLine: '#50a9a3',
    barrel: '#bafff6',
    glow: 'rgba(93, 232, 214, 0.34)'
  };

  const ENEMY_TYPES = {
    scout: {
      hp: 1,
      speed: 74,
      fireRate: 2.35,
      bulletSpeed: 238,
      score: 100,
      palette: {
        body: '#e18b46',
        bodyDark: '#8b431f',
        accent: '#ffd6a2',
        track: '#35251a',
        trackLine: '#b57b4a',
        barrel: '#ffc27e',
        glow: 'rgba(225, 139, 70, 0.3)'
      }
    },
    raider: {
      hp: 1,
      speed: 116,
      fireRate: 2.15,
      bulletSpeed: 288,
      score: 200,
      palette: {
        body: '#e3c83e',
        bodyDark: '#81701a',
        accent: '#fff4ae',
        track: '#35321b',
        trackLine: '#b7a541',
        barrel: '#ffe878',
        glow: 'rgba(227, 200, 62, 0.3)'
      }
    },
    heavy: {
      hp: 3,
      speed: 57,
      fireRate: 2.65,
      bulletSpeed: 228,
      score: 400,
      palette: {
        body: '#c4514b',
        bodyDark: '#6f2726',
        accent: '#ffb0a3',
        track: '#351d1c',
        trackLine: '#a35b56',
        barrel: '#ff8d80',
        glow: 'rgba(196, 81, 75, 0.32)'
      }
    },
    hunter: {
      hp: 1,
      speed: 94,
      fireRate: 1.58,
      bulletSpeed: 320,
      score: 300,
      palette: {
        body: '#9173e2',
        bodyDark: '#453284',
        accent: '#ddccff',
        track: '#251e3b',
        trackLine: '#7865b5',
        barrel: '#c5aeff',
        glow: 'rgba(145, 115, 226, 0.3)'
      }
    }
  };

  const POWERUP_TYPES = {
    shield: { color: '#5de8d6', glyph: 'S', label: '能量护盾', toast: '能量护盾启动 · 9 秒无敌' },
    rapid: { color: '#f7b955', glyph: 'R', label: '急速装填', toast: '急速装填启动 · 10 秒速射' },
    life: { color: '#82df8b', glyph: '+', label: '备用装甲', toast: '备用装甲已接入 · 生命 +1' },
    bomb: { color: '#ff8574', glyph: 'B', label: '轨道冲击', toast: '轨道冲击确认 · 全场敌军清除' }
  };

  // ---------------------------------------------------------------------------
  // DOM
  // ---------------------------------------------------------------------------

  const els = {
    score: document.getElementById('score'),
    best: document.getElementById('best'),
    level: document.getElementById('level'),
    enemies: document.getElementById('enemies'),
    lives: document.getElementById('lives'),
    overlay: document.getElementById('overlay'),
    toast: document.getElementById('toast'),
    shieldBadge: document.getElementById('shieldBadge'),
    shieldTime: document.getElementById('shieldTime'),
    rapidBadge: document.getElementById('rapidBadge'),
    rapidTime: document.getElementById('rapidTime'),
    sectorLabel: document.getElementById('sectorLabel'),
    soundBtn: document.getElementById('soundBtn'),
    soundLabel: document.getElementById('soundLabel'),
    pauseBtn: document.getElementById('pauseBtn'),
    pauseLabel: document.getElementById('pauseLabel'),
    pauseGlyph: document.querySelector('.pause-glyph'),
    touchFire: document.getElementById('touchFire')
  };

  // ---------------------------------------------------------------------------
  // Persistence & formatting
  // ---------------------------------------------------------------------------

  function storageGet(key, fallback) {
    try {
      const value = window.localStorage.getItem(key);
      return value === null ? fallback : value;
    } catch (error) {
      return fallback;
    }
  }

  function storageSet(key, value) {
    try {
      window.localStorage.setItem(key, String(value));
    } catch (error) {
      /* Storage can be unavailable in private browsing. */
    }
  }

  function formatScore(value) {
    return String(Math.max(0, Math.floor(value))).padStart(6, '0');
  }

  function formatNumber(value) {
    return Math.max(0, Math.floor(value)).toLocaleString('en-US');
  }

  function pad2(value) {
    return String(value).padStart(2, '0');
  }

  const BEST_KEY = 'steelFront.best';
  const MUTED_KEY = 'steelFront.muted';
  let best = Math.max(0, Number(storageGet(BEST_KEY, 0)) || 0);

  // ---------------------------------------------------------------------------
  // Sound (Web Audio, no external files)
  // ---------------------------------------------------------------------------

  const Sound = {
    ctx: null,
    master: null,
    noiseBuffer: null,
    enabled: storageGet(MUTED_KEY, '0') !== '1',

    init() {
      if (!this.enabled) return;
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) {
        this.enabled = false;
        updateSoundUI();
        return;
      }

      if (!this.ctx) {
        this.ctx = new AudioContextClass();
        this.master = this.ctx.createGain();
        this.master.gain.value = 0.6;
        this.master.connect(this.ctx.destination);

        const length = Math.floor(this.ctx.sampleRate * 0.8);
        this.noiseBuffer = this.ctx.createBuffer(1, length, this.ctx.sampleRate);
        const data = this.noiseBuffer.getChannelData(0);
        for (let i = 0; i < length; i += 1) data[i] = Math.random() * 2 - 1;
      }

      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
    },

    tone(frequency, endFrequency, duration, type = 'square', volume = 0.04, delay = 0) {
      if (!this.enabled || !this.ctx || !this.master) return;
      const start = this.ctx.currentTime + Math.max(0, delay);
      const oscillator = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(Math.max(20, frequency), start);
      oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, endFrequency), start + duration);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, volume), start + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      oscillator.connect(gain);
      gain.connect(this.master);
      oscillator.start(start);
      oscillator.stop(start + duration + 0.03);
    },

    noise(duration = 0.25, volume = 0.12, cutoff = 700) {
      if (!this.enabled || !this.ctx || !this.master || !this.noiseBuffer) return;
      const start = this.ctx.currentTime;
      const source = this.ctx.createBufferSource();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();
      source.buffer = this.noiseBuffer;
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(cutoff, start);
      filter.frequency.exponentialRampToValueAtTime(Math.max(80, cutoff * 0.28), start + duration);
      gain.gain.setValueAtTime(volume, start);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      source.connect(filter);
      filter.connect(gain);
      gain.connect(this.master);
      source.start(start);
      source.stop(start + duration + 0.02);
    },

    start() {
      this.init();
      this.tone(240, 520, 0.12, 'triangle', 0.035);
      this.tone(480, 780, 0.16, 'square', 0.022, 0.09);
    },

    shoot(isPlayer) {
      if (isPlayer) {
        this.tone(720, 130, 0.085, 'square', 0.032);
        this.noise(0.06, 0.04, 2100);
      } else {
        this.tone(380, 90, 0.09, 'sawtooth', 0.018);
      }
    },

    hitMetal() {
      this.tone(1550, 720, 0.055, 'square', 0.018);
      this.noise(0.08, 0.045, 2400);
    },

    brick() {
      this.noise(0.12, 0.06, 900);
      this.tone(180, 70, 0.08, 'triangle', 0.02);
    },

    explosion(scale = 1) {
      this.noise(0.32 + scale * 0.16, 0.12 * scale, 520);
      this.tone(105, 36, 0.28 + scale * 0.1, 'triangle', 0.05 * scale);
    },

    pickup() {
      this.tone(520, 660, 0.08, 'sine', 0.045);
      this.tone(780, 1040, 0.12, 'sine', 0.04, 0.075);
    },

    shieldHit() {
      this.tone(1200, 300, 0.09, 'sine', 0.035);
    },

    levelClear() {
      [392, 523, 659, 784].forEach((note, index) => {
        this.tone(note, note * 1.01, 0.2, 'triangle', 0.042, index * 0.095);
      });
    },

    victory() {
      [392, 523, 659, 784, 1046, 1318].forEach((note, index) => {
        this.tone(note, note, 0.24, 'triangle', 0.04, index * 0.1);
      });
    },

    gameOver() {
      [260, 208, 156, 104].forEach((note, index) => {
        this.tone(note, note * 0.96, 0.34, 'sawtooth', 0.032, index * 0.16);
      });
      this.noise(0.65, 0.07, 360);
    },

    toggle() {
      this.enabled = !this.enabled;
      storageSet(MUTED_KEY, this.enabled ? '0' : '1');
      if (this.enabled) {
        this.init();
        this.tone(560, 880, 0.12, 'sine', 0.04);
      }
      updateSoundUI();
    }
  };

  function updateSoundUI() {
    els.soundBtn.classList.toggle('is-muted', !Sound.enabled);
    els.soundBtn.setAttribute('aria-pressed', String(Sound.enabled));
    els.soundBtn.setAttribute('aria-label', Sound.enabled ? '关闭声音' : '开启声音');
    els.soundLabel.textContent = Sound.enabled ? '声音 On' : '声音 Off';
  }

  // ---------------------------------------------------------------------------
  // Game state
  // ---------------------------------------------------------------------------

  let state = 'menu';
  let level = 1;
  let score = 0;
  let lives = 3;
  let kills = 0;
  let killsThisLevel = 0;
  let lastBonus = 0;
  let gameOverReason = 'armor';

  let grid = [];
  let base = null;
  let player = null;
  let playerSpawn = { col: 2, row: 12 };
  let enemies = [];
  let bullets = [];
  let particles = [];
  let powerups = [];
  let spawnQueue = [];
  let spawnPointCursor = 0;

  let maxActive = 3;
  let spawnInterval = 1.8;
  let spawnTimer = 0;
  let levelClearTimer = -1;
  let gameOverTimer = 0;
  let respawnTimer = 0;

  let shake = 0;
  let visualTime = 0;
  let hudClock = 0;
  let toastTimeout = null;

  const inputStack = [];
  let keyboardFireHeld = false;
  let touchFireHeld = false;
  const padPointers = new Map();
  const firePointers = new Set();

  // ---------------------------------------------------------------------------
  // Small helpers
  // ---------------------------------------------------------------------------

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function randomBetween(min, max) {
    return min + Math.random() * (max - min);
  }

  function choice(list) {
    return list[Math.floor(Math.random() * list.length)];
  }

  function cellCenterX(col) {
    return col * TILE + TILE / 2;
  }

  function cellCenterY(row) {
    return row * TILE + TILE / 2;
  }

  function inBounds(col, row) {
    return col >= 0 && col < COLS && row >= 0 && row < ROWS;
  }

  function roundRectPath(g, x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);
    g.beginPath();
    g.moveTo(x + r, y);
    g.arcTo(x + width, y, x + width, y + height, r);
    g.arcTo(x + width, y + height, x, y + height, r);
    g.arcTo(x, y + height, x, y, r);
    g.arcTo(x, y, x + width, y, r);
    g.closePath();
  }

  function mulberry32(seed) {
    let a = seed >>> 0;
    return function random() {
      a += 0x6d2b79f5;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // ---------------------------------------------------------------------------
  // Offscreen artwork
  // ---------------------------------------------------------------------------

  let backgroundTexture = null;
  let brickSprite = null;
  let steelSprite = null;
  let bushSprite = null;

  function makeSurface(width, height, scale = 2) {
    const surface = document.createElement('canvas');
    surface.width = Math.ceil(width * scale);
    surface.height = Math.ceil(height * scale);
    const g = surface.getContext('2d');
    g.scale(scale, scale);
    return { canvas: surface, g };
  }

  function makeTileSprite(draw) {
    const surface = makeSurface(TILE, TILE, 2);
    draw(surface.g);
    return surface.canvas;
  }

  function buildArtwork() {
    const background = makeSurface(WIDTH, HEIGHT, 2);
    const g = background.g;
    const random = mulberry32(721034);

    const gradient = g.createLinearGradient(0, 0, WIDTH, HEIGHT);
    gradient.addColorStop(0, '#0a171c');
    gradient.addColorStop(0.5, '#071216');
    gradient.addColorStop(1, '#050d10');
    g.fillStyle = gradient;
    g.fillRect(0, 0, WIDTH, HEIGHT);

    const glow = g.createRadialGradient(WIDTH * 0.28, HEIGHT * 0.22, 8, WIDTH * 0.28, HEIGHT * 0.22, WIDTH * 0.65);
    glow.addColorStop(0, 'rgba(93, 232, 214, 0.055)');
    glow.addColorStop(0.55, 'rgba(93, 232, 214, 0.012)');
    glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    g.fillStyle = glow;
    g.fillRect(0, 0, WIDTH, HEIGHT);

    for (let row = 0; row < ROWS; row += 1) {
      for (let col = 0; col < COLS; col += 1) {
        if ((row + col) % 2 === 0) {
          g.fillStyle = 'rgba(180, 230, 225, 0.008)';
          g.fillRect(col * TILE, row * TILE, TILE, TILE);
        }
      }
    }

    g.lineWidth = 1;
    for (let x = 0; x <= WIDTH; x += TILE / 2) {
      g.strokeStyle = x % TILE === 0 ? 'rgba(145, 202, 202, 0.035)' : 'rgba(145, 202, 202, 0.014)';
      g.beginPath();
      g.moveTo(x + 0.5, 0);
      g.lineTo(x + 0.5, HEIGHT);
      g.stroke();
    }
    for (let y = 0; y <= HEIGHT; y += TILE / 2) {
      g.strokeStyle = y % TILE === 0 ? 'rgba(145, 202, 202, 0.035)' : 'rgba(145, 202, 202, 0.014)';
      g.beginPath();
      g.moveTo(0, y + 0.5);
      g.lineTo(WIDTH, y + 0.5);
      g.stroke();
    }

    for (let i = 0; i < 440; i += 1) {
      const x = random() * WIDTH;
      const y = random() * HEIGHT;
      const size = 0.4 + random() * 1.2;
      g.fillStyle = `rgba(170, 220, 215, ${0.015 + random() * 0.035})`;
      g.fillRect(x, y, size, size);
    }

    g.strokeStyle = 'rgba(93, 232, 214, 0.07)';
    g.lineWidth = 1;
    g.strokeRect(8.5, 8.5, WIDTH - 17, HEIGHT - 17);

    backgroundTexture = background.canvas;

    brickSprite = makeTileSprite((sprite) => {
      const colors = ['#8c4c34', '#7b402b', '#965239', '#81442e'];
      sprite.fillStyle = '#24130e';
      sprite.fillRect(0, 0, TILE, TILE);

      for (let row = 0; row < 4; row += 1) {
        const y = row * 12;
        const offset = row % 2 === 0 ? -12 : 0;
        for (let x = offset; x < TILE; x += 24) {
          const bx = x + 1;
          const by = y + 1.5;
          sprite.fillStyle = colors[(row + Math.abs(x / 24)) % colors.length];
          sprite.fillRect(bx, by, 22, 9);
          sprite.fillStyle = 'rgba(255, 191, 138, 0.13)';
          sprite.fillRect(bx, by, 22, 1.2);
          sprite.fillStyle = 'rgba(20, 8, 5, 0.28)';
          sprite.fillRect(bx, by + 7.5, 22, 1.5);
        }
      }

      sprite.strokeStyle = 'rgba(31, 14, 9, 0.42)';
      sprite.lineWidth = 0.8;
      sprite.beginPath();
      sprite.moveTo(11, 4);
      sprite.lineTo(18, 13);
      sprite.lineTo(13, 25);
      sprite.moveTo(34, 26);
      sprite.lineTo(29, 37);
      sprite.stroke();

      const topShade = sprite.createLinearGradient(0, 0, 0, TILE);
      topShade.addColorStop(0, 'rgba(255, 220, 170, 0.06)');
      topShade.addColorStop(0.55, 'rgba(0, 0, 0, 0)');
      topShade.addColorStop(1, 'rgba(0, 0, 0, 0.23)');
      sprite.fillStyle = topShade;
      sprite.fillRect(0, 0, TILE, TILE);
    });

    steelSprite = makeTileSprite((sprite) => {
      sprite.fillStyle = '#101b20';
      sprite.fillRect(0, 0, TILE, TILE);
      const plate = sprite.createLinearGradient(2, 2, 46, 46);
      plate.addColorStop(0, '#34464c');
      plate.addColorStop(0.38, '#202f35');
      plate.addColorStop(0.7, '#2c3d43');
      plate.addColorStop(1, '#152228');
      sprite.fillStyle = plate;
      roundRectPath(sprite, 2.5, 2.5, 43, 43, 4);
      sprite.fill();
      sprite.strokeStyle = '#596d72';
      sprite.lineWidth = 1.2;
      sprite.stroke();

      sprite.strokeStyle = 'rgba(168, 196, 200, 0.2)';
      sprite.lineWidth = 1;
      sprite.beginPath();
      sprite.moveTo(8, 8);
      sprite.lineTo(40, 8);
      sprite.lineTo(40, 40);
      sprite.moveTo(8, 8);
      sprite.lineTo(8, 40);
      sprite.stroke();

      sprite.strokeStyle = 'rgba(6, 12, 14, 0.52)';
      sprite.lineWidth = 2.4;
      sprite.beginPath();
      sprite.moveTo(12, 12);
      sprite.lineTo(36, 36);
      sprite.moveTo(36, 12);
      sprite.lineTo(12, 36);
      sprite.stroke();

      sprite.strokeStyle = 'rgba(160, 188, 190, 0.18)';
      sprite.lineWidth = 0.8;
      sprite.beginPath();
      sprite.moveTo(11, 11);
      sprite.lineTo(37, 11);
      sprite.stroke();

      for (const [x, y] of [[8, 8], [40, 8], [8, 40], [40, 40]]) {
        sprite.beginPath();
        sprite.arc(x, y, 1.6, 0, TAU);
        sprite.fillStyle = '#788d91';
        sprite.fill();
        sprite.beginPath();
        sprite.arc(x - 0.4, y - 0.4, 0.65, 0, TAU);
        sprite.fillStyle = '#c2d3d4';
        sprite.fill();
      }
    });

    bushSprite = makeTileSprite((sprite) => {
      const randomLeaves = mulberry32(9137);
      sprite.clearRect(0, 0, TILE, TILE);
      sprite.fillStyle = 'rgba(5, 17, 13, 0.45)';
      sprite.beginPath();
      sprite.ellipse(24, 27, 22, 18, 0, 0, TAU);
      sprite.fill();

      const leafColors = ['#163e2b', '#1f5437', '#2a6743', '#34784e', '#1b4832'];
      for (let i = 0; i < 22; i += 1) {
        const x = 3 + randomLeaves() * 42;
        const y = 5 + randomLeaves() * 40;
        const radiusX = 4.5 + randomLeaves() * 6.5;
        const radiusY = 3.5 + randomLeaves() * 5.5;
        const angle = randomLeaves() * Math.PI;
        sprite.fillStyle = leafColors[Math.floor(randomLeaves() * leafColors.length)];
        sprite.beginPath();
        sprite.ellipse(x, y, radiusX, radiusY, angle, 0, TAU);
        sprite.fill();
      }

      for (let i = 0; i < 8; i += 1) {
        const x = 7 + randomLeaves() * 34;
        const y = 7 + randomLeaves() * 30;
        sprite.fillStyle = 'rgba(111, 161, 105, 0.24)';
        sprite.beginPath();
        sprite.ellipse(x, y, 2.5 + randomLeaves() * 3, 1.5 + randomLeaves() * 2, -0.5, 0, TAU);
        sprite.fill();
      }
    });
  }

  // ---------------------------------------------------------------------------
  // Map / level lifecycle
  // ---------------------------------------------------------------------------

  function parseLevel(levelIndex) {
    const definition = LEVELS[levelIndex];
    const parsedGrid = definition.rows.map((row) => {
      const parsed = [];
      for (let col = 0; col < COLS; col += 1) {
        const char = row[col] || '.';
        if (char === '#') parsed.push(BRICK);
        else if (char === '@') parsed.push(STEEL);
        else if (char === '~') parsed.push(WATER);
        else if (char === 'T') parsed.push(BUSH);
        else parsed.push(EMPTY);
      }
      return parsed;
    });

    let baseCell = { col: 6, row: 12 };
    for (let row = 0; row < ROWS; row += 1) {
      for (let col = 0; col < COLS; col += 1) {
        if (definition.rows[row][col] === 'B') {
          baseCell = { col, row };
          parsedGrid[row][col] = EMPTY;
        }
      }
    }

    playerSpawn = {
      col: clamp(definition.player.col, 0, COLS - 1),
      row: clamp(definition.player.row, 0, ROWS - 1)
    };

    return {
      grid: parsedGrid,
      base: {
        col: baseCell.col,
        row: baseCell.row,
        x: cellCenterX(baseCell.col),
        y: cellCenterY(baseCell.row),
        alive: true
      }
    };
  }

  function createPlayer(col, row) {
    return {
      kind: 'player',
      x: cellCenterX(col),
      y: cellCenterY(row),
      cell: { col, row },
      targetCell: null,
      fromX: cellCenterX(col),
      fromY: cellCenterY(row),
      toX: cellCenterX(col),
      toY: cellCenterY(row),
      moving: false,
      moveT: 0,
      moveDuration: 0,
      dir: 'up',
      speed: 156,
      alive: true,
      cooldown: 0,
      invincible: 2.3,
      shieldTimer: 0,
      rapidTimer: 0,
      muzzle: 0,
      flash: 0,
      recoil: 0,
      tread: 0
    };
  }

  function buildSpawnQueue(levelNumber) {
    const total = 6 + levelNumber * 2;
    const queue = [];
    for (let i = 0; i < total; i += 1) {
      const roll = Math.random() * 100;
      let type = 'scout';
      if (levelNumber === 1) {
        type = roll < 72 ? 'scout' : 'raider';
      } else if (levelNumber === 2) {
        type = roll < 50 ? 'scout' : roll < 86 ? 'raider' : 'heavy';
      } else if (levelNumber === 3) {
        type = roll < 35 ? 'scout' : roll < 67 ? 'raider' : roll < 88 ? 'hunter' : 'heavy';
      } else {
        type = roll < 25 ? 'scout' : roll < 55 ? 'raider' : roll < 79 ? 'hunter' : 'heavy';
      }
      queue.push(type);
    }

    if (levelNumber === 1) queue[queue.length - 1] = 'raider';
    if (levelNumber >= 2) queue[Math.floor(total * 0.55)] = 'heavy';
    if (levelNumber >= 3) queue[Math.floor(total * 0.78)] = 'hunter';
    return queue;
  }

  function loadLevel(levelNumber) {
    level = clamp(levelNumber, 1, LEVELS.length);
    const parsed = parseLevel(level - 1);
    grid = parsed.grid;
    base = parsed.base;

    player = createPlayer(playerSpawn.col, playerSpawn.row);
    enemies = [];
    bullets = [];
    particles = [];
    powerups = [];
    spawnQueue = buildSpawnQueue(level);
    spawnPointCursor = 0;
    spawnTimer = 0.65;
    maxActive = Math.min(2 + Math.ceil(level / 2), 5);
    spawnInterval = Math.max(0.8, 1.75 - level * 0.11);
    levelClearTimer = -1;
    gameOverTimer = 0;
    gameOverReason = 'armor';
    respawnTimer = 0;
    killsThisLevel = 0;
    lastBonus = 0;
    shake = 0;
    hudClock = 0;
    clearInputs();
    updateHUD();
    syncChrome();
  }

  function startGame() {
    Sound.init();
    score = 0;
    lives = 3;
    kills = 0;
    state = 'playing';
    loadLevel(1);
    hideOverlay();
    syncChrome();
    canvas.focus({ preventScroll: true });
    showToast(`战区 ${pad2(level)} · ${LEVELS[level - 1].name} — 守住基地`, 2400);
    Sound.start();
  }

  function nextLevel() {
    if (state !== 'levelClear' || level >= LEVELS.length) return;
    state = 'playing';
    loadLevel(level + 1);
    hideOverlay();
    syncChrome();
    canvas.focus({ preventScroll: true });
    showToast(`战区 ${pad2(level)} · ${LEVELS[level - 1].name}`, 2000);
    Sound.start();
  }

  function pauseGame() {
    if (state !== 'playing') return;
    state = 'paused';
    clearInputs();
    showOverlay('paused');
    syncChrome();
  }

  function resumeGame() {
    if (state !== 'paused') return;
    state = 'playing';
    hideOverlay();
    syncChrome();
    canvas.focus({ preventScroll: true });
  }

  function togglePause() {
    if (state === 'playing') pauseGame();
    else if (state === 'paused') resumeGame();
  }

  function completeLevel() {
    if (state !== 'playing') return;
    lastBonus = 1000 + lives * 250;
    score += lastBonus;
    commitBest();
    clearInputs();
    state = level >= LEVELS.length ? 'victory' : 'levelClear';
    updateHUD();
    showOverlay(state);
    syncChrome();
    if (state === 'victory') {
      Sound.victory();
      celebrate();
    } else {
      Sound.levelClear();
    }
  }

  function endGame(reason) {
    if (state === 'gameOver' || state === 'victory') return;
    gameOverReason = reason;
    state = 'gameOver';
    clearInputs();
    commitBest();
    updateHUD();
    showOverlay('gameOver');
    syncChrome();
    Sound.gameOver();
  }

  function scheduleGameOver(reason, delay) {
    if (reason === 'base' || gameOverReason !== 'base') gameOverReason = reason;
    gameOverTimer = Math.max(gameOverTimer, delay);
  }

  function commitBest() {
    if (score > best) {
      best = score;
      storageSet(BEST_KEY, best);
    }
  }

  // ---------------------------------------------------------------------------
  // Collision helpers
  // ---------------------------------------------------------------------------

  function tankOccupiesCell(tank, col, row) {
    if (!tank || !tank.alive) return false;
    if (tank.cell.col === col && tank.cell.row === row) return true;
    if (tank.targetCell && tank.targetCell.col === col && tank.targetCell.row === row) return true;
    return false;
  }

  function canTankEnter(tank, col, row) {
    if (!inBounds(col, row)) return false;
    const tile = grid[row][col];
    if (tile === BRICK || tile === STEEL || tile === WATER) return false;
    if (base && base.col === col && base.row === row) return false;
    if (player && player !== tank && tankOccupiesCell(player, col, row)) return false;
    for (const enemy of enemies) {
      if (enemy !== tank && tankOccupiesCell(enemy, col, row)) return false;
    }
    return true;
  }

  function isSpawnCellFree(cell) {
    if (!inBounds(cell.col, cell.row)) return false;
    if (grid[cell.row][cell.col] !== EMPTY) return false;
    if (base && base.col === cell.col && base.row === cell.row) return false;
    if (tankOccupiesCell(player, cell.col, cell.row)) return false;
    for (const enemy of enemies) {
      if (tankOccupiesCell(enemy, cell.col, cell.row)) return false;
    }
    return true;
  }

  function tryStartStep(tank, dirName) {
    const direction = DIRECTIONS[dirName];
    const nextCol = tank.cell.col + direction.x;
    const nextRow = tank.cell.row + direction.y;
    if (!canTankEnter(tank, nextCol, nextRow)) return false;

    tank.dir = dirName;
    tank.fromX = tank.x;
    tank.fromY = tank.y;
    tank.toX = cellCenterX(nextCol);
    tank.toY = cellCenterY(nextRow);
    tank.targetCell = { col: nextCol, row: nextRow };
    tank.moveT = 0;
    tank.moveDuration = TILE / tank.speed;
    tank.moving = true;
    return true;
  }

  function advanceMotion(tank, dt) {
    if (!tank.moving) return;
    tank.moveT += dt / tank.moveDuration;
    const t = Math.min(1, tank.moveT);
    tank.x = tank.fromX + (tank.toX - tank.fromX) * t;
    tank.y = tank.fromY + (tank.toY - tank.fromY) * t;
    tank.tread += tank.speed * dt;

    if (t >= 1) {
      tank.x = tank.toX;
      tank.y = tank.toY;
      tank.cell = tank.targetCell;
      tank.targetCell = null;
      tank.moving = false;
      tank.moveT = 0;
    }
  }

  // ---------------------------------------------------------------------------
  // Input
  // ---------------------------------------------------------------------------

  const MOVE_KEYS = {
    ArrowUp: 'up',
    KeyW: 'up',
    ArrowRight: 'right',
    KeyD: 'right',
    ArrowDown: 'down',
    KeyS: 'down',
    ArrowLeft: 'left',
    KeyA: 'left'
  };

  function addDirectionToken(token, dir) {
    removeDirectionToken(token);
    inputStack.push({ token, dir });
  }

  function removeDirectionToken(token) {
    const index = inputStack.findIndex((entry) => entry.token === token);
    if (index >= 0) inputStack.splice(index, 1);
  }

  function currentInputDirection() {
    return inputStack.length ? inputStack[inputStack.length - 1].dir : null;
  }

  function clearInputs() {
    inputStack.length = 0;
    keyboardFireHeld = false;
    touchFireHeld = false;
    padPointers.clear();
    firePointers.clear();
    document.querySelectorAll('.pad.is-pressed, .fire-btn.is-pressed').forEach((element) => {
      element.classList.remove('is-pressed');
    });
  }

  function handleKeyDown(event) {
    const code = event.code;
    const moveDir = MOVE_KEYS[code];
    const isFireKey = code === 'Space' || code === 'KeyJ';
    const overlayAccept = code === 'Enter' || code === 'NumpadEnter' || code === 'Space';

    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(code)) {
      event.preventDefault();
    }

    if (event.repeat) return;

    if (code === 'KeyM') {
      event.preventDefault();
      Sound.toggle();
      return;
    }

    if (code === 'KeyP' || code === 'Escape') {
      if (state === 'playing' || state === 'paused') {
        event.preventDefault();
        togglePause();
      }
      return;
    }

    if (state === 'menu' || state === 'gameOver' || state === 'victory') {
      if (overlayAccept) {
        event.preventDefault();
        startGame();
      }
      return;
    }

    if (state === 'levelClear') {
      if (overlayAccept) {
        event.preventDefault();
        nextLevel();
      }
      return;
    }

    if (state === 'paused') {
      if (overlayAccept) {
        event.preventDefault();
        resumeGame();
      }
      return;
    }

    if (state !== 'playing') return;

    if (code === 'KeyR') {
      event.preventDefault();
      startGame();
      return;
    }

    if (moveDir) {
      addDirectionToken(`key:${code}`, moveDir);
    }

    if (isFireKey) {
      event.preventDefault();
      keyboardFireHeld = true;
      Sound.init();
    }
  }

  function handleKeyUp(event) {
    const moveDir = MOVE_KEYS[event.code];
    if (moveDir) removeDirectionToken(`key:${event.code}`);
    if (event.code === 'Space' || event.code === 'KeyJ') keyboardFireHeld = false;
  }

  function bindTouchControls() {
    document.querySelectorAll('[data-pad]').forEach((button) => {
      const dir = button.dataset.pad;

      button.addEventListener('pointerdown', (event) => {
        event.preventDefault();
        if (state !== 'playing') return;
        Sound.init();
        const token = `pad:${dir}:${event.pointerId}`;
        padPointers.set(event.pointerId, token);
        addDirectionToken(token, dir);
        button.classList.add('is-pressed');
        try {
          button.setPointerCapture(event.pointerId);
        } catch (error) {
          /* Pointer capture is a progressive enhancement. */
        }
      });

      const release = (event) => {
        const token = padPointers.get(event.pointerId);
        if (token) {
          removeDirectionToken(token);
          padPointers.delete(event.pointerId);
        }
        const stillPressed = [...padPointers.values()].some((value) => value.startsWith(`pad:${dir}:`));
        if (!stillPressed) button.classList.remove('is-pressed');
      };

      button.addEventListener('pointerup', release);
      button.addEventListener('pointercancel', release);
      button.addEventListener('lostpointercapture', release);
    });

    els.touchFire.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      if (state !== 'playing') return;
      Sound.init();
      firePointers.add(event.pointerId);
      touchFireHeld = true;
      els.touchFire.classList.add('is-pressed');
      try {
        els.touchFire.setPointerCapture(event.pointerId);
      } catch (error) {
        /* Ignore pointer capture errors. */
      }
    });

    const releaseFire = (event) => {
      firePointers.delete(event.pointerId);
      if (firePointers.size === 0) {
        touchFireHeld = false;
        els.touchFire.classList.remove('is-pressed');
      }
    };

    els.touchFire.addEventListener('pointerup', releaseFire);
    els.touchFire.addEventListener('pointercancel', releaseFire);
    els.touchFire.addEventListener('lostpointercapture', releaseFire);

    document.addEventListener('contextmenu', (event) => {
      if (event.target.closest('.mobile-controls')) event.preventDefault();
    });
  }

  // ---------------------------------------------------------------------------
  // Player actions
  // ---------------------------------------------------------------------------

  function updatePlayer(dt) {
    advanceMotion(player, dt);

    if (!player.moving) {
      const desiredDir = currentInputDirection();
      if (desiredDir) {
        player.dir = desiredDir;
        tryStartStep(player, desiredDir);
      }
    }

    if ((keyboardFireHeld || touchFireHeld) && player.cooldown <= 0) {
      playerShoot();
    }
  }

  function playerShoot() {
    if (!player || !player.alive) return;
    const limit = player.rapidTimer > 0 ? 4 : 2;
    const activePlayerBullets = bullets.reduce((count, bullet) => {
      return count + (bullet.ownerType === 'player' && !bullet.dead ? 1 : 0);
    }, 0);
    if (activePlayerBullets >= limit) {
      player.cooldown = 0.08;
      return;
    }

    fireBullet(player, 'player', 448, PLAYER_PALETTE.accent);
    player.cooldown = player.rapidTimer > 0 ? 0.16 : 0.33;
    player.muzzle = 0.085;
    player.recoil = 1;
    Sound.shoot(true);
  }

  function fireBullet(tank, ownerType, speed, color) {
    const direction = DIRECTIONS[tank.dir];
    const muzzleDistance = 26;
    const x = tank.x + direction.x * muzzleDistance;
    const y = tank.y + direction.y * muzzleDistance;
    bullets.push({
      x,
      y,
      vx: direction.x * speed,
      vy: direction.y * speed,
      speed,
      owner: tank,
      ownerType,
      color,
      dead: false
    });

    for (let i = 0; i < 3; i += 1) {
      addParticle({
        type: 'spark',
        x: x + randomBetween(-3, 3),
        y: y + randomBetween(-3, 3),
        vx: direction.x * randomBetween(30, 90) + randomBetween(-25, 25),
        vy: direction.y * randomBetween(30, 90) + randomBetween(-25, 25),
        life: randomBetween(0.08, 0.18),
        maxLife: 0.18,
        size: randomBetween(1, 2.2),
        color
      });
    }
  }

  function tryRespawnPlayer() {
    if (!player || player.alive || lives <= 0) return;
    if (!isSpawnCellFree({ col: playerSpawn.col, row: playerSpawn.row })) {
      respawnTimer = 0.35;
      return;
    }

    player = createPlayer(playerSpawn.col, playerSpawn.row);
    player.invincible = 2.7;
    shake = Math.max(shake, 3);
    Sound.start();
    updateHUD();
    showToast('装甲重新部署 · 短暂护盾已激活', 1600);
  }

  function damagePlayer() {
    if (!player || !player.alive) return;

    if (player.shieldTimer > 0 || player.invincible > 0) {
      addShieldSparks(player.x, player.y, '#bafff6');
      Sound.shieldHit();
      return;
    }

    player.alive = false;
    player.moving = false;
    player.targetCell = null;
    lives = Math.max(0, lives - 1);
    const deathX = player.x;
    const deathY = player.y;
    clearInputs();
    spawnExplosion(deathX, deathY, 1.25, '#ffb35c');
    addFloatingText(deathX, deathY - 18, '装甲损失', '#ffb3a8');
    shake = Math.max(shake, 10);

    if (lives <= 0) {
      scheduleGameOver('armor', 1.35);
    } else {
      respawnTimer = 1.45;
    }

    updateHUD();
  }

  // ---------------------------------------------------------------------------
  // Enemy AI
  // ---------------------------------------------------------------------------

  function createEnemy(type, cell) {
    const data = ENEMY_TYPES[type];
    const mode = Math.random() < (type === 'heavy' ? 0.62 : type === 'hunter' ? 0.18 : 0.34) ? 'base' : 'hunt';
    return {
      kind: 'enemy',
      type,
      hp: data.hp,
      maxHp: data.hp,
      speed: data.speed,
      x: cellCenterX(cell.col),
      y: cellCenterY(cell.row),
      cell: { col: cell.col, row: cell.row },
      targetCell: null,
      fromX: cellCenterX(cell.col),
      fromY: cellCenterY(cell.row),
      toX: cellCenterX(cell.col),
      toY: cellCenterY(cell.row),
      moving: false,
      moveT: 0,
      moveDuration: 0,
      dir: 'down',
      alive: true,
      mode,
      cooldown: randomBetween(1.1, 2),
      thinkTimer: randomBetween(0.45, 1),
      spawnTimer: 0.8,
      spawnProtect: 1.7,
      muzzle: 0,
      flash: 0,
      recoil: 0,
      tread: 0
    };
  }

  function chooseEnemyDirection(enemy) {
    const target = enemy.mode === 'base' && base.alive
      ? { col: base.col, row: base.row }
      : player && player.alive
        ? player.cell
        : { col: base.col, row: base.row };

    const options = DIRECTION_NAMES.filter((dir) => {
      const direction = DIRECTIONS[dir];
      return canTankEnter(
        enemy,
        enemy.cell.col + direction.x,
        enemy.cell.row + direction.y
      );
    });
    if (!options.length) return null;

    const reverse = DIRECTIONS[enemy.dir].opposite;
    const forwardOptions = options.filter((dir) => dir !== reverse);
    const candidates = forwardOptions.length ? forwardOptions : options;

    const scored = candidates.map((dir) => {
      const direction = DIRECTIONS[dir];
      const nextCol = enemy.cell.col + direction.x;
      const nextRow = enemy.cell.row + direction.y;
      const distance = Math.abs(target.col - nextCol) + Math.abs(target.row - nextRow);
      let value = -distance * 2.6 + Math.random() * 2.7;
      if (dir === enemy.dir) value += 1.15;
      return { dir, value };
    });

    scored.sort((a, b) => b.value - a.value);
    if (scored.length > 1 && Math.random() < 0.21) return scored[1].dir;
    return scored[0].dir;
  }

  function maybeEnemyFire(enemy) {
    if (!enemy.alive || enemy.spawnTimer > 0 || enemy.cooldown > 0 || gameOverTimer > 0) return;
    if (bullets.some((bullet) => bullet.owner === enemy && !bullet.dead)) return;

    const target = enemy.mode === 'base' || !player || !player.alive
      ? { col: base.col, row: base.row }
      : player.cell;

    const direction = DIRECTIONS[enemy.dir];
    const deltaCol = target.col - enemy.cell.col;
    const deltaRow = target.row - enemy.cell.row;
    const facingTarget =
      (deltaRow === 0 && direction.y === 0 && Math.sign(deltaCol) === direction.x) ||
      (deltaCol === 0 && direction.x === 0 && Math.sign(deltaRow) === direction.y);

    const frontCol = enemy.cell.col + direction.x;
    const frontRow = enemy.cell.row + direction.y;
    const frontTile = inBounds(frontCol, frontRow) ? grid[frontRow][frontCol] : STEEL;

    let chance = 0.025 + level * 0.004;
    if (facingTarget) chance = 0.62;
    if (frontTile === BRICK) chance = Math.max(chance, 0.34);
    if (enemy.type === 'hunter') chance += 0.1;
    if (enemy.type === 'heavy' && facingTarget) chance += 0.12;

    if (Math.random() > chance) return;

    const data = ENEMY_TYPES[enemy.type];
    fireBullet(enemy, 'enemy', data.bulletSpeed, data.palette.accent);
    enemy.cooldown = data.fireRate * randomBetween(0.82, 1.22);
    enemy.muzzle = 0.075;
    enemy.recoil = 1;
    Sound.shoot(false);
  }

  function updateEnemies(dt) {
    for (const enemy of enemies) {
      if (!enemy.alive) continue;

      enemy.muzzle = Math.max(0, enemy.muzzle - dt);
      enemy.flash = Math.max(0, enemy.flash - dt);
      enemy.recoil = Math.max(0, enemy.recoil - dt * 7);
      enemy.cooldown = Math.max(0, enemy.cooldown - dt);
      enemy.spawnProtect = Math.max(0, enemy.spawnProtect - dt);

      if (enemy.spawnTimer > 0) {
        enemy.spawnTimer -= dt;
        continue;
      }

      advanceMotion(enemy, dt);

      if (!enemy.moving && gameOverTimer <= 0) {
        const dir = chooseEnemyDirection(enemy);
        if (dir) {
          enemy.dir = dir;
          tryStartStep(enemy, dir);
        }
      }

      enemy.thinkTimer -= dt;
      if (enemy.thinkTimer <= 0) {
        enemy.thinkTimer = randomBetween(0.3, 0.65);
        maybeEnemyFire(enemy);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Spawning
  // ---------------------------------------------------------------------------

  function updateSpawner(dt) {
    if (spawnTimer > 0) spawnTimer -= dt;
    if (gameOverTimer > 0 || !base.alive) return;
    if (!spawnQueue.length || spawnTimer > 0) return;

    const activeCount = enemies.reduce((count, enemy) => count + (enemy.alive ? 1 : 0), 0);
    if (activeCount >= maxActive) return;

    let chosenCell = null;
    for (let i = 0; i < SPAWN_CELLS.length; i += 1) {
      const index = (spawnPointCursor + i) % SPAWN_CELLS.length;
      const cell = SPAWN_CELLS[index];
      if (isSpawnCellFree(cell)) {
        chosenCell = cell;
        spawnPointCursor = (index + 1) % SPAWN_CELLS.length;
        break;
      }
    }

    if (!chosenCell) {
      spawnTimer = 0.25;
      return;
    }

    const type = spawnQueue.shift();
    const enemy = createEnemy(type, chosenCell);
    enemies.push(enemy);
    spawnTimer = spawnInterval;

    for (let i = 0; i < 10; i += 1) {
      const angle = Math.random() * TAU;
      addParticle({
        type: 'spark',
        x: enemy.x + Math.cos(angle) * 18,
        y: enemy.y + Math.sin(angle) * 18,
        vx: Math.cos(angle) * randomBetween(20, 55),
        vy: Math.sin(angle) * randomBetween(20, 55),
        life: randomBetween(0.2, 0.45),
        maxLife: 0.45,
        size: randomBetween(1, 2.4),
        color: ENEMY_TYPES[type].palette.accent
      });
    }

    updateHUD();
  }

  // ---------------------------------------------------------------------------
  // Bullets & damage
  // ---------------------------------------------------------------------------

  function updateBullets(dt) {
    for (const bullet of bullets) {
      if (bullet.dead) continue;
      const distance = bullet.speed * dt;
      const steps = Math.max(1, Math.ceil(distance / 7));
      const stepX = (bullet.vx * dt) / steps;
      const stepY = (bullet.vy * dt) / steps;

      for (let step = 0; step < steps; step += 1) {
        bullet.x += stepX;
        bullet.y += stepY;
        if (bulletHitsWorld(bullet) || bulletHitsTank(bullet) || bulletHitsBase(bullet)) {
          bullet.dead = true;
          break;
        }
      }
    }

    for (let i = 0; i < bullets.length; i += 1) {
      const first = bullets[i];
      if (first.dead) continue;
      for (let j = i + 1; j < bullets.length; j += 1) {
        const second = bullets[j];
        if (second.dead || first.ownerType === second.ownerType) continue;
        if (Math.abs(first.x - second.x) < 10 && Math.abs(first.y - second.y) < 10) {
          first.dead = true;
          second.dead = true;
          addSparks((first.x + second.x) / 2, (first.y + second.y) / 2, '#fff2c8', 6, 80);
          Sound.hitMetal();
          break;
        }
      }
    }

    bullets = bullets.filter((bullet) => !bullet.dead);
  }

  function bulletHitsWorld(bullet) {
    if (bullet.x < 0 || bullet.x > WIDTH || bullet.y < 0 || bullet.y > HEIGHT) return true;
    const col = Math.floor(bullet.x / TILE);
    const row = Math.floor(bullet.y / TILE);
    if (!inBounds(col, row)) return true;
    const tile = grid[row][col];

    if (tile === BRICK) {
      grid[row][col] = EMPTY;
      spawnBrickDebris(bullet.x, bullet.y);
      Sound.brick();
      return true;
    }

    if (tile === STEEL) {
      addSparks(bullet.x, bullet.y, '#e5f3f0', 7, 90);
      Sound.hitMetal();
      return true;
    }

    return false;
  }

  function bulletHitsTank(bullet) {
    if (bullet.ownerType === 'player') {
      for (const enemy of enemies) {
        if (!enemy.alive) continue;
        if (Math.abs(bullet.x - enemy.x) < 21 && Math.abs(bullet.y - enemy.y) < 21) {
          if (enemy.spawnProtect > 0) {
            addShieldSparks(bullet.x, bullet.y, '#ffd894');
            Sound.shieldHit();
          } else {
            addSparks(bullet.x, bullet.y, ENEMY_TYPES[enemy.type].palette.accent, 6, 80);
            damageEnemy(enemy, 1);
          }
          return true;
        }
      }
      return false;
    }

    if (!player || !player.alive) return false;
    if (Math.abs(bullet.x - player.x) >= 21 || Math.abs(bullet.y - player.y) >= 21) return false;

    if (player.shieldTimer > 0 || player.invincible > 0) {
      addShieldSparks(bullet.x, bullet.y, '#bafff6');
      Sound.shieldHit();
    } else {
      addSparks(bullet.x, bullet.y, '#ffd09a', 7, 100);
      damagePlayer();
    }
    return true;
  }

  function bulletHitsBase(bullet) {
    if (!base.alive) return false;
    if (Math.abs(bullet.x - base.x) >= 21 || Math.abs(bullet.y - base.y) >= 21) return false;

    if (bullet.ownerType === 'enemy') {
      destroyBase();
    } else {
      addSparks(bullet.x, bullet.y, '#ffd27a', 5, 60);
      Sound.hitMetal();
    }
    return true;
  }

  function damageEnemy(enemy, amount) {
    if (!enemy.alive || enemy.spawnProtect > 0) return;
    enemy.hp -= amount;
    enemy.flash = 0.12;

    if (enemy.hp > 0) {
      addSparks(enemy.x, enemy.y - 4, '#fff0c8', 4, 55);
      Sound.hitMetal();
      return;
    }

    destroyEnemy(enemy, true);
  }

  function destroyEnemy(enemy, allowDrop = true) {
    if (!enemy.alive) return;
    const data = ENEMY_TYPES[enemy.type];
    enemy.alive = false;
    enemy.moving = false;
    enemy.targetCell = null;
    score += data.score;
    kills += 1;
    killsThisLevel += 1;

    spawnExplosion(enemy.x, enemy.y, enemy.type === 'heavy' ? 1.15 : 0.82, data.palette.accent);
    addFloatingText(enemy.x, enemy.y - 13, `+${data.score}`, data.palette.accent);
    shake = Math.max(shake, enemy.type === 'heavy' ? 8 : 5);
    Sound.explosion(enemy.type === 'heavy' ? 1.1 : 0.75);

    if (allowDrop && Math.random() < 0.2) {
      spawnPowerup(enemy.x, enemy.y);
    }

    updateHUD();
  }

  function destroyBase() {
    if (!base.alive) return;
    base.alive = false;
    spawnExplosion(base.x, base.y, 1.8, '#ffb25a');
    addFloatingText(base.x, base.y - 22, '核心失守', '#ffaea1');
    shake = Math.max(shake, 15);
    Sound.explosion(1.7);
    Sound.noise(0.9, 0.16, 340);
    scheduleGameOver('base', 1.5);
    updateHUD();
  }

  // ---------------------------------------------------------------------------
  // Power-ups
  // ---------------------------------------------------------------------------

  function spawnPowerup(x, y) {
    const roll = Math.random();
    let type = 'shield';
    if (roll > 0.37 && roll <= 0.72) type = 'rapid';
    else if (roll > 0.72 && roll <= 0.88) type = 'life';
    else if (roll > 0.88) type = 'bomb';

    powerups.push({
      x,
      y,
      type,
      age: 0,
      life: 13,
      phase: Math.random() * TAU
    });
  }

  function collectPowerup(powerup) {
    const data = POWERUP_TYPES[powerup.type];
    score += 50;

    if (powerup.type === 'shield') {
      player.shieldTimer = Math.max(player.shieldTimer, 9);
    } else if (powerup.type === 'rapid') {
      player.rapidTimer = Math.max(player.rapidTimer, 10);
    } else if (powerup.type === 'life') {
      lives = Math.min(9, lives + 1);
    } else if (powerup.type === 'bomb') {
      triggerBomb();
    }

    spawnPickupBurst(powerup.x, powerup.y, data.color);
    addFloatingText(powerup.x, powerup.y - 18, '+50', data.color);
    showToast(data.toast, 2200);
    Sound.pickup();
    updateHUD();
  }

  function triggerBomb() {
    shake = Math.max(shake, 13);
    for (const enemy of enemies.slice()) {
      if (!enemy.alive) continue;
      enemy.spawnProtect = 0;
      destroyEnemy(enemy, false);
    }
    for (let i = 0; i < 28; i += 1) {
      addParticle({
        type: 'spark',
        x: base.x + randomBetween(-24, 24),
        y: base.y + randomBetween(-24, 24),
        vx: randomBetween(-160, 160),
        vy: randomBetween(-160, 160),
        life: randomBetween(0.2, 0.7),
        maxLife: 0.7,
        size: randomBetween(1, 2.4),
        color: '#ffba78'
      });
    }
  }

  function updatePowerups(dt) {
    for (const powerup of powerups) {
      powerup.age += dt;
      powerup.life -= dt;
      if (player && player.alive) {
        if (Math.abs(player.x - powerup.x) < 29 && Math.abs(player.y - powerup.y) < 29) {
          collectPowerup(powerup);
          powerup.life = 0;
        }
      }
    }
    powerups = powerups.filter((powerup) => powerup.life > 0);
  }

  // ---------------------------------------------------------------------------
  // Particles
  // ---------------------------------------------------------------------------

  function addParticle(particle) {
    if (particles.length > 420) return;
    particles.push({
      vx: 0,
      vy: 0,
      drag: 0.94,
      ...particle
    });
  }

  function addSparks(x, y, color, count, speed) {
    for (let i = 0; i < count; i += 1) {
      const angle = Math.random() * TAU;
      const velocity = randomBetween(speed * 0.25, speed);
      addParticle({
        type: 'spark',
        x,
        y,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity,
        life: randomBetween(0.16, 0.42),
        maxLife: 0.42,
        size: randomBetween(1, 2.2),
        color
      });
    }
  }

  function addShieldSparks(x, y, color) {
    for (let i = 0; i < 8; i += 1) {
      const angle = Math.random() * TAU;
      addParticle({
        type: 'spark',
        x: x + Math.cos(angle) * 20,
        y: y + Math.sin(angle) * 20,
        vx: Math.cos(angle) * randomBetween(15, 60),
        vy: Math.sin(angle) * randomBetween(15, 60),
        life: randomBetween(0.15, 0.35),
        maxLife: 0.35,
        size: randomBetween(1, 2),
        color
      });
    }
  }

  function spawnExplosion(x, y, scale = 1, color = '#ffae5c') {
    addParticle({
      type: 'ring',
      x,
      y,
      life: 0.42,
      maxLife: 0.42,
      size: 10 * scale,
      color
    });

    addParticle({
      type: 'flash',
      x,
      y,
      life: 0.14,
      maxLife: 0.14,
      size: 23 * scale,
      color: '#fff4d5'
    });

    for (let i = 0; i < Math.round(11 * scale); i += 1) {
      const angle = Math.random() * TAU;
      const velocity = randomBetween(30, 180) * scale;
      addParticle({
        type: 'spark',
        x,
        y,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity,
        life: randomBetween(0.24, 0.7),
        maxLife: 0.7,
        size: randomBetween(1, 3),
        color: i % 3 === 0 ? '#ffe8b0' : color
      });
    }

    for (let i = 0; i < Math.round(7 * scale); i += 1) {
      addParticle({
        type: 'smoke',
        x: x + randomBetween(-12, 12) * scale,
        y: y + randomBetween(-12, 12) * scale,
        vx: randomBetween(-24, 24),
        vy: randomBetween(-32, 8),
        life: randomBetween(0.45, 1.05),
        maxLife: 1.05,
        size: randomBetween(5, 12) * scale,
        color: '#3d4645'
      });
    }
  }

  function spawnBrickDebris(x, y) {
    for (let i = 0; i < 8; i += 1) {
      const angle = Math.random() * TAU;
      addParticle({
        type: 'spark',
        x,
        y,
        vx: Math.cos(angle) * randomBetween(25, 95),
        vy: Math.sin(angle) * randomBetween(25, 95),
        life: randomBetween(0.15, 0.45),
        maxLife: 0.45,
        size: randomBetween(1.2, 2.6),
        color: i % 2 ? '#b96b4b' : '#e09a70'
      });
    }
    for (let i = 0; i < 3; i += 1) {
      addParticle({
        type: 'smoke',
        x: x + randomBetween(-5, 5),
        y: y + randomBetween(-5, 5),
        vx: randomBetween(-16, 16),
        vy: randomBetween(-22, 4),
        life: randomBetween(0.25, 0.55),
        maxLife: 0.55,
        size: randomBetween(4, 8),
        color: '#4f3d34'
      });
    }
  }

  function spawnPickupBurst(x, y, color) {
    addParticle({
      type: 'ring',
      x,
      y,
      life: 0.45,
      maxLife: 0.45,
      size: 15,
      color
    });
    for (let i = 0; i < 14; i += 1) {
      const angle = Math.random() * TAU;
      addParticle({
        type: 'spark',
        x,
        y,
        vx: Math.cos(angle) * randomBetween(35, 115),
        vy: Math.sin(angle) * randomBetween(35, 115),
        life: randomBetween(0.2, 0.5),
        maxLife: 0.5,
        size: randomBetween(1, 2.2),
        color
      });
    }
  }

  function addFloatingText(x, y, text, color) {
    addParticle({
      type: 'text',
      x,
      y,
      vx: randomBetween(-4, 4),
      vy: -28,
      life: 0.95,
      maxLife: 0.95,
      size: 12,
      color,
      text
    });
  }

  function updateParticles(dt) {
    for (const particle of particles) {
      particle.life -= dt;
      if (particle.type === 'text') {
        particle.x += particle.vx * dt;
        particle.y += particle.vy * dt;
        continue;
      }
      if (particle.type === 'ring' || particle.type === 'flash') continue;
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      const friction = Math.pow(particle.drag, dt * 60);
      particle.vx *= friction;
      particle.vy *= friction;
    }
    particles = particles.filter((particle) => particle.life > 0);
  }

  function celebrate() {
    for (let i = 0; i < 55; i += 1) {
      const angle = Math.random() * TAU;
      const speed = randomBetween(40, 190);
      addParticle({
        type: 'spark',
        x: WIDTH / 2 + randomBetween(-70, 70),
        y: HEIGHT / 2 + randomBetween(-40, 40),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: randomBetween(0.4, 1.4),
        maxLife: 1.4,
        size: randomBetween(1, 2.8),
        color: choice(['#ffd68f', '#5de8d6', '#ffffff', '#ffaf6b'])
      });
    }
  }

  // ---------------------------------------------------------------------------
  // Main update
  // ---------------------------------------------------------------------------

  function update(dt) {
    if (gameOverTimer > 0) {
      gameOverTimer -= dt;
      if (gameOverTimer <= 0) {
        endGame(gameOverReason);
        return;
      }
    }

    if (player) {
      player.cooldown = Math.max(0, player.cooldown - dt);
      player.muzzle = Math.max(0, player.muzzle - dt);
      player.flash = Math.max(0, player.flash - dt);
      player.recoil = Math.max(0, player.recoil - dt * 7);
      player.shieldTimer = Math.max(0, player.shieldTimer - dt);
      player.rapidTimer = Math.max(0, player.rapidTimer - dt);
      player.invincible = Math.max(0, player.invincible - dt);

      if (player.alive) {
        updatePlayer(dt);
      } else if (lives > 0 && gameOverTimer <= 0) {
        respawnTimer -= dt;
        if (respawnTimer <= 0) tryRespawnPlayer();
      }
    }

    updateEnemies(dt);
    updateBullets(dt);
    updatePowerups(dt);
    updateSpawner(dt);
    updateParticles(dt);

    enemies = enemies.filter((enemy) => enemy.alive);
    shake = Math.max(0, shake - dt * 26);

    if (
      state === 'playing' &&
      base.alive &&
      gameOverTimer <= 0 &&
      spawnQueue.length === 0 &&
      enemies.length === 0
    ) {
      if (levelClearTimer < 0) levelClearTimer = 1.15;
      levelClearTimer -= dt;
      if (levelClearTimer <= 0) completeLevel();
    }

    hudClock += dt;
    if (hudClock >= 0.1) {
      updateHUD();
      hudClock = 0;
    }
  }

  // ---------------------------------------------------------------------------
  // Drawing
  // ---------------------------------------------------------------------------

  function draw(time) {
    ctx.save();
    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    if (shake > 0) {
      ctx.translate(randomBetween(-shake, shake) * 0.7, randomBetween(-shake, shake) * 0.7);
    }

    ctx.drawImage(backgroundTexture, 0, 0, WIDTH, HEIGHT);
    drawSpawnMarkers(time);
    drawTerrain(time);
    drawBase(time);
    drawTanks(time);
    drawBushes();
    drawPowerups(time);
    drawBullets();
    drawParticles();
    ctx.restore();
  }

  function drawTerrain(time) {
    for (let row = 0; row < ROWS; row += 1) {
      for (let col = 0; col < COLS; col += 1) {
        const tile = grid[row][col];
        const x = col * TILE;
        const y = row * TILE;
        if (tile === BRICK) {
          ctx.drawImage(brickSprite, x, y, TILE, TILE);
        } else if (tile === STEEL) {
          ctx.drawImage(steelSprite, x, y, TILE, TILE);
        } else if (tile === WATER) {
          drawWater(x, y, col, row, time);
        }
      }
    }
  }

  function drawWater(x, y, col, row, time) {
    ctx.fillStyle = '#082a39';
    ctx.fillRect(x, y, TILE, TILE);
    const shimmer = ctx.createLinearGradient(x, y, x, y + TILE);
    shimmer.addColorStop(0, 'rgba(46, 129, 153, 0.28)');
    shimmer.addColorStop(0.5, 'rgba(9, 46, 62, 0.08)');
    shimmer.addColorStop(1, 'rgba(19, 82, 105, 0.2)');
    ctx.fillStyle = shimmer;
    ctx.fillRect(x, y, TILE, TILE);

    ctx.lineWidth = 1.1;
    for (let line = 0; line < 3; line += 1) {
      const waveY = y + 11 + line * 13 + Math.sin(time * 1.7 + col * 0.65 + row * 0.4 + line) * 2;
      ctx.strokeStyle = line % 2 === 0 ? 'rgba(112, 210, 217, 0.24)' : 'rgba(67, 156, 179, 0.18)';
      ctx.beginPath();
      ctx.moveTo(x + 4, waveY);
      ctx.bezierCurveTo(x + 15, waveY - 3, x + 28, waveY + 3, x + 44, waveY - 1);
      ctx.stroke();
    }

    const glint = (Math.sin(time * 2.2 + col * 1.3 + row * 0.7) + 1) / 2;
    ctx.fillStyle = `rgba(180, 255, 248, ${0.06 + glint * 0.1})`;
    ctx.fillRect(x + 8 + (col % 3) * 9, y + 8 + (row % 2) * 22, 5, 1);
  }

  function drawSpawnMarkers(time) {
    ctx.save();
    ctx.strokeStyle = 'rgba(247, 185, 85, 0.16)';
    ctx.lineWidth = 1;
    for (const cell of SPAWN_CELLS) {
      const x = cellCenterX(cell.col);
      const y = cellCenterY(cell.row);
      const pulse = 0.8 + Math.sin(time * 2 + cell.col) * 0.2;
      ctx.globalAlpha = pulse;
      ctx.beginPath();
      ctx.moveTo(x - 12, y);
      ctx.lineTo(x - 6, y - 6);
      ctx.lineTo(x, y);
      ctx.lineTo(x + 6, y - 6);
      ctx.lineTo(x + 12, y);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawBase(time) {
    const x = base.x;
    const y = base.y;

    if (!base.alive) {
      ctx.save();
      ctx.translate(x, y);
      ctx.fillStyle = '#120d0b';
      ctx.beginPath();
      ctx.ellipse(0, 2, 21, 18, 0.3, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#261611';
      for (let i = 0; i < 7; i += 1) {
        const angle = i * 1.7;
        ctx.beginPath();
        ctx.arc(Math.cos(angle) * 11, Math.sin(angle) * 9, 2 + (i % 3), 0, TAU);
        ctx.fill();
      }
      const ember = (Math.sin(time * 4) + 1) / 2;
      ctx.fillStyle = `rgba(255, 112, 62, ${0.16 + ember * 0.22})`;
      ctx.beginPath();
      ctx.arc(0, 0, 12, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = 'rgba(86, 55, 39, 0.5)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 4; i += 1) {
        const angle = i * 1.57 + 0.4;
        ctx.beginPath();
        ctx.moveTo(Math.cos(angle) * 5, Math.sin(angle) * 5);
        ctx.lineTo(Math.cos(angle) * 20, Math.sin(angle) * 16);
        ctx.stroke();
      }
      ctx.restore();
      return;
    }

    ctx.save();
    ctx.translate(x, y);

    const aura = 0.18 + (Math.sin(time * 2.4) + 1) * 0.07;
    ctx.strokeStyle = `rgba(247, 185, 85, ${aura})`;
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 5]);
    ctx.beginPath();
    ctx.arc(0, 0, 23, time * 0.35, time * 0.35 + TAU);
    ctx.stroke();
    ctx.setLineDash([]);

    const plate = ctx.createLinearGradient(-20, -20, 20, 20);
    plate.addColorStop(0, '#344246');
    plate.addColorStop(0.55, '#17262a');
    plate.addColorStop(1, '#0e1a1e');
    ctx.fillStyle = plate;
    roundRectPath(ctx, -21, -21, 42, 42, 5);
    ctx.fill();
    ctx.strokeStyle = 'rgba(247, 197, 105, 0.5)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.strokeStyle = 'rgba(169, 195, 195, 0.16)';
    roundRectPath(ctx, -17, -17, 34, 34, 3);
    ctx.stroke();

    ctx.shadowColor = 'rgba(247, 185, 85, 0.4)';
    ctx.shadowBlur = 9;
    ctx.fillStyle = '#e3b257';

    ctx.beginPath();
    ctx.moveTo(0, -13);
    ctx.lineTo(5, -8);
    ctx.lineTo(14, -7);
    ctx.lineTo(8, -3);
    ctx.lineTo(17, 1);
    ctx.lineTo(7, 3);
    ctx.lineTo(3, 10);
    ctx.lineTo(0, 6);
    ctx.lineTo(-3, 10);
    ctx.lineTo(-7, 3);
    ctx.lineTo(-17, 1);
    ctx.lineTo(-8, -3);
    ctx.lineTo(-14, -7);
    ctx.lineTo(-5, -8);
    ctx.closePath();
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.fillStyle = '#2b3029';
    ctx.beginPath();
    ctx.moveTo(0, -4);
    ctx.lineTo(4, 0);
    ctx.lineTo(0, 5);
    ctx.lineTo(-4, 0);
    ctx.closePath();
    ctx.fill();

    const corePulse = (Math.sin(time * 3.2) + 1) / 2;
    ctx.fillStyle = `rgba(255, 220, 141, ${0.3 + corePulse * 0.45})`;
    ctx.beginPath();
    ctx.arc(0, -1, 2.2, 0, TAU);
    ctx.fill();

    ctx.restore();
  }

  function drawBushes() {
    for (let row = 0; row < ROWS; row += 1) {
      for (let col = 0; col < COLS; col += 1) {
        if (grid[row][col] !== BUSH) continue;
        ctx.save();
        ctx.translate(
          col * TILE + (col % 2 === 0 ? 0 : TILE),
          row * TILE + (row % 2 === 0 ? 0 : TILE)
        );
        ctx.scale(col % 2 === 0 ? 1 : -1, row % 2 === 0 ? 1 : -1);
        ctx.drawImage(bushSprite, 0, 0, TILE, TILE);
        ctx.restore();
      }
    }
  }

  function drawTanks(time) {
    for (const enemy of enemies) {
      if (!enemy.alive) continue;
      if (enemy.spawnTimer > 0) drawSpawnPortal(enemy, time);
      drawTank(enemy, time);
    }
    if (player && player.alive) {
      drawTank(player, time);
    }
  }

  function drawSpawnPortal(tank, time) {
    const progress = 1 - clamp(tank.spawnTimer / 0.8, 0, 1);
    const radius = 27 - progress * 9;
    const alpha = 0.28 + progress * 0.55;
    ctx.save();
    ctx.translate(tank.x, tank.y);
    ctx.rotate(time * 2.3);
    ctx.strokeStyle = `rgba(255, 183, 92, ${alpha})`;
    ctx.lineWidth = 1.4;
    ctx.setLineDash([4, 7]);
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, TAU);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.rotate(-time * 3.4);
    ctx.strokeStyle = `rgba(255, 220, 160, ${alpha * 0.7})`;
    ctx.beginPath();
    for (let i = 0; i < 4; i += 1) {
      const angle = i * (Math.PI / 2);
      ctx.moveTo(Math.cos(angle) * (radius + 2), Math.sin(angle) * (radius + 2));
      ctx.lineTo(Math.cos(angle) * (radius + 7), Math.sin(angle) * (radius + 7));
    }
    ctx.stroke();
    ctx.restore();
  }

  function drawTank(tank, time) {
    const isPlayer = tank.kind === 'player';
    const palette = isPlayer ? PLAYER_PALETTE : ENEMY_TYPES[tank.type].palette;
    const spawnAlpha = isPlayer ? 1 : clamp(1 - tank.spawnTimer / 0.8, 0.25, 1);
    let alpha = spawnAlpha;

    if (isPlayer && tank.invincible > 0 && tank.shieldTimer <= 0) {
      alpha *= 0.68 + Math.sin(time * 22) * 0.22;
    }

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(tank.x, tank.y);
    ctx.rotate(DIRECTIONS[tank.dir].angle);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.36)';
    roundRectPath(ctx, -17, -15, 34, 35, 8);
    ctx.fill();

    ctx.fillStyle = palette.track;
    roundRectPath(ctx, -21, -18, 10, 36, 4);
    ctx.fill();
    roundRectPath(ctx, 11, -18, 10, 36, 4);
    ctx.fill();

    const trackOffset = (tank.tread / 2.5) % 6;
    ctx.strokeStyle = palette.trackLine;
    ctx.globalAlpha = alpha * 0.55;
    ctx.lineWidth = 1;
    for (let y = -16 + trackOffset; y < 17; y += 6) {
      ctx.beginPath();
      ctx.moveTo(-20, y);
      ctx.lineTo(-12, y);
      ctx.moveTo(12, y);
      ctx.lineTo(20, y);
      ctx.stroke();
    }
    ctx.globalAlpha = alpha;

    const bodyGradient = ctx.createLinearGradient(0, -17, 0, 17);
    bodyGradient.addColorStop(0, palette.body);
    bodyGradient.addColorStop(0.56, palette.body);
    bodyGradient.addColorStop(1, palette.bodyDark);
    ctx.fillStyle = bodyGradient;
    roundRectPath(ctx, -14, -16, 28, 32, 4);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(-11, -12);
    ctx.lineTo(-11, 10);
    ctx.moveTo(12, -8);
    ctx.lineTo(12, 13);
    ctx.stroke();

    ctx.fillStyle = palette.accent;
    ctx.globalAlpha = alpha * 0.75;
    ctx.fillRect(-15, 8, 4, 2);
    ctx.fillRect(11, 8, 4, 2);
    ctx.globalAlpha = alpha;

    if (!isPlayer) {
      ctx.fillStyle = palette.accent;
      ctx.globalAlpha = alpha * 0.55;
      ctx.beginPath();
      ctx.moveTo(0, -17);
      ctx.lineTo(4, -12);
      ctx.lineTo(-4, -12);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = alpha;
    } else {
      ctx.fillStyle = palette.accent;
      ctx.beginPath();
      ctx.moveTo(0, -13);
      ctx.lineTo(3.5, -8);
      ctx.lineTo(0, -3);
      ctx.lineTo(-3.5, -8);
      ctx.closePath();
      ctx.fill();
    }

    const recoil = tank.recoil * 3;
    ctx.fillStyle = palette.barrel;
    roundRectPath(ctx, -3.2, -28 + recoil, 6.4, 17, 1.6);
    ctx.fill();
    ctx.fillStyle = 'rgba(7, 18, 18, 0.48)';
    ctx.fillRect(-1.1, -26 + recoil, 2.2, 12);

    const turretGradient = ctx.createRadialGradient(-2, -4, 1, 0, 0, 13);
    turretGradient.addColorStop(0, palette.accent);
    turretGradient.addColorStop(0.38, palette.body);
    turretGradient.addColorStop(1, palette.bodyDark);
    ctx.fillStyle = turretGradient;
    ctx.beginPath();
    ctx.arc(0, 0, 10, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = 'rgba(3, 13, 15, 0.34)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = 'rgba(5, 16, 17, 0.42)';
    ctx.beginPath();
    ctx.arc(0, 0, 3.2, 0, TAU);
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.beginPath();
    ctx.arc(-2.2, -2.5, 1.2, 0, TAU);
    ctx.fill();

    if (tank.muzzle > 0) {
      const flashAlpha = clamp(tank.muzzle / 0.08, 0, 1);
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = flashAlpha;
      ctx.fillStyle = '#fff7d1';
      ctx.shadowColor = palette.accent;
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.moveTo(-7, -30);
      ctx.lineTo(0, -38);
      ctx.lineTo(7, -30);
      ctx.lineTo(2.5, -27);
      ctx.lineTo(-2.5, -27);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.globalCompositeOperation = 'source-over';
    }

    if (tank.flash > 0) {
      ctx.globalAlpha = (tank.flash / 0.12) * 0.65;
      ctx.fillStyle = '#ffffff';
      roundRectPath(ctx, -14, -16, 28, 32, 4);
      ctx.fill();
    }

    ctx.restore();

    const shieldActive = isPlayer ? tank.shieldTimer > 0 : tank.spawnProtect > 0;
    if (shieldActive) {
      drawShieldRing(tank, isPlayer ? '#79fff0' : '#ffca7a', time, isPlayer);
    } else if (isPlayer && tank.invincible > 0) {
      drawInvincibleRing(tank, time);
    }

    if (!isPlayer && tank.maxHp > 1) {
      const pipWidth = tank.maxHp * 6 - 2;
      const startX = tank.x - pipWidth / 2;
      const y = tank.y - 27;
      ctx.fillStyle = 'rgba(3, 11, 13, 0.75)';
      ctx.fillRect(startX - 1, y - 1, pipWidth + 2, 4);
      for (let i = 0; i < tank.maxHp; i += 1) {
        ctx.fillStyle = i < tank.hp ? '#ffd28c' : 'rgba(255, 210, 140, 0.2)';
        ctx.fillRect(startX + i * 6, y, 4, 2);
      }
    }
  }

  function drawShieldRing(tank, color, time, strong) {
    ctx.save();
    ctx.translate(tank.x, tank.y);
    ctx.rotate(time * 1.9);
    ctx.strokeStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = strong ? 12 : 6;
    ctx.globalAlpha = strong ? 0.72 : 0.42;
    ctx.lineWidth = strong ? 1.6 : 1;
    ctx.setLineDash([7, 5]);
    ctx.beginPath();
    ctx.arc(0, 0, 26, 0, TAU);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.shadowBlur = 0;
    ctx.rotate(-time * 3.1);
    ctx.globalAlpha = strong ? 0.3 : 0.16;
    ctx.beginPath();
    ctx.arc(0, 0, 24, 0.3, 1.7);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, 24, Math.PI + 0.3, Math.PI + 1.7);
    ctx.stroke();
    ctx.restore();
  }

  function drawInvincibleRing(tank, time) {
    ctx.save();
    ctx.translate(tank.x, tank.y);
    ctx.rotate(-time * 1.6);
    ctx.strokeStyle = 'rgba(188, 255, 246, 0.52)';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 8]);
    ctx.beginPath();
    ctx.arc(0, 0, 25, 0, TAU);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  function drawPowerups(time) {
    for (const powerup of powerups) {
      const data = POWERUP_TYPES[powerup.type];
      const bob = Math.sin(time * 3.4 + powerup.phase) * 3;
      const glowPulse = 0.72 + Math.sin(time * 4 + powerup.phase) * 0.16;
      let alpha = 1;
      if (powerup.life < 3) alpha = Math.floor(time * 8) % 2 === 0 ? 0.22 : 1;

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(powerup.x, powerup.y + bob);

      const aura = ctx.createRadialGradient(0, 0, 2, 0, 0, 24);
      aura.addColorStop(0, `${data.color}33`);
      aura.addColorStop(1, `${data.color}00`);
      ctx.fillStyle = aura;
      ctx.beginPath();
      ctx.arc(0, 0, 24, 0, TAU);
      ctx.fill();

      ctx.rotate(time * 0.7 + powerup.phase);
      ctx.beginPath();
      for (let i = 0; i < 6; i += 1) {
        const angle = -Math.PI / 2 + (i / 6) * TAU;
        const px = Math.cos(angle) * 14;
        const py = Math.sin(angle) * 14;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fillStyle = 'rgba(4, 14, 17, 0.88)';
      ctx.fill();
      ctx.strokeStyle = data.color;
      ctx.globalAlpha = alpha * glowPulse;
      ctx.shadowColor = data.color;
      ctx.shadowBlur = 10;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.rotate(-time * 0.7 - powerup.phase);

      ctx.fillStyle = data.color;
      ctx.globalAlpha = alpha;
      ctx.font = '800 13px "Cascadia Mono", Consolas, monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(data.glyph, 0, 0.5);

      ctx.restore();
    }
  }

  function drawBullets() {
    for (const bullet of bullets) {
      if (bullet.dead) continue;
      const angle = Math.atan2(bullet.vy, bullet.vx) + Math.PI / 2;
      ctx.save();
      ctx.translate(bullet.x, bullet.y);
      ctx.rotate(angle);
      ctx.globalCompositeOperation = 'lighter';

      const trail = ctx.createLinearGradient(0, 7, 0, 19);
      trail.addColorStop(0, `${bullet.color}bb`);
      trail.addColorStop(1, `${bullet.color}00`);
      ctx.strokeStyle = trail;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 7);
      ctx.lineTo(0, 19);
      ctx.stroke();

      ctx.shadowColor = bullet.color;
      ctx.shadowBlur = 11;
      ctx.fillStyle = bullet.color;
      ctx.beginPath();
      ctx.ellipse(0, 0, 2.5, 4.8, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#fffdf3';
      ctx.beginPath();
      ctx.ellipse(0, -0.6, 1.25, 2.6, 0, 0, TAU);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.restore();
    }
  }

  function drawParticles() {
    for (const particle of particles) {
      const lifeRatio = clamp(particle.life / particle.maxLife, 0, 1);
      if (particle.type === 'spark') {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = lifeRatio;
        ctx.strokeStyle = particle.color;
        ctx.lineWidth = particle.size;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(particle.x, particle.y);
        ctx.lineTo(particle.x - particle.vx * 0.045, particle.y - particle.vy * 0.045);
        ctx.stroke();
        ctx.restore();
      } else if (particle.type === 'smoke') {
        const age = 1 - lifeRatio;
        ctx.save();
        ctx.globalAlpha = lifeRatio * 0.25;
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size * (0.7 + age * 1.35), 0, TAU);
        ctx.fill();
        ctx.restore();
      } else if (particle.type === 'ring') {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = lifeRatio * 0.7;
        ctx.strokeStyle = particle.color;
        ctx.lineWidth = 1.3 + lifeRatio;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size + (1 - lifeRatio) * 27, 0, TAU);
        ctx.stroke();
        ctx.restore();
      } else if (particle.type === 'flash') {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = lifeRatio * 0.68;
        const flash = ctx.createRadialGradient(
          particle.x,
          particle.y,
          1,
          particle.x,
          particle.y,
          particle.size
        );
        flash.addColorStop(0, particle.color);
        flash.addColorStop(0.4, 'rgba(255, 190, 100, 0.34)');
        flash.addColorStop(1, 'rgba(255, 130, 40, 0)');
        ctx.fillStyle = flash;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, TAU);
        ctx.fill();
        ctx.restore();
      } else if (particle.type === 'text') {
        ctx.save();
        ctx.globalAlpha = Math.min(1, lifeRatio * 1.8);
        ctx.fillStyle = particle.color;
        ctx.font = `700 ${particle.size}px "Cascadia Mono", Consolas, monospace`;
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        ctx.shadowBlur = 4;
        ctx.fillText(particle.text, particle.x, particle.y);
        ctx.restore();
      }
    }
  }

  // ---------------------------------------------------------------------------
  // HUD & overlays
  // ---------------------------------------------------------------------------

  function updateHUD() {
    const displayBest = Math.max(best, score);
    els.score.textContent = formatScore(score);
    els.best.textContent = formatScore(displayBest);
    els.level.innerHTML = `${pad2(level)}<span class="stat-sub">/${pad2(LEVELS.length)}</span>`;
    els.enemies.textContent = pad2(spawnQueue.length + enemies.filter((enemy) => enemy.alive).length);
    els.lives.textContent = `×${lives}`;
    els.sectorLabel.textContent = `SECTOR ${pad2(level)} · ${LEVELS[level - 1].name}`;

    const shieldActive = Boolean(player && player.shieldTimer > 0);
    const rapidActive = Boolean(player && player.rapidTimer > 0);
    els.shieldBadge.classList.toggle('is-hidden', !shieldActive);
    els.rapidBadge.classList.toggle('is-hidden', !rapidActive);
    if (shieldActive) els.shieldTime.textContent = `${Math.ceil(player.shieldTimer)}s`;
    if (rapidActive) els.rapidTime.textContent = `${Math.ceil(player.rapidTimer)}s`;
  }

  function syncChrome() {
    const canPause = state === 'playing' || state === 'paused';
    els.pauseBtn.disabled = !canPause;
    els.pauseLabel.textContent = state === 'paused' ? '继续' : '暂停';
    els.pauseGlyph.textContent = state === 'paused' ? '▶' : 'Ⅱ';
    els.pauseBtn.setAttribute('aria-label', state === 'paused' ? '继续游戏' : '暂停游戏');
  }

  function showToast(message, duration = 1900) {
    els.toast.textContent = message;
    els.toast.classList.add('is-visible');
    if (toastTimeout) clearTimeout(toastTimeout);
    toastTimeout = window.setTimeout(() => {
      els.toast.classList.remove('is-visible');
      toastTimeout = null;
    }, duration);
  }

  function hideToast() {
    els.toast.classList.remove('is-visible');
    if (toastTimeout) {
      clearTimeout(toastTimeout);
      toastTimeout = null;
    }
  }

  const SHARE_URL = 'https://wbbb0102.github.io/tank-battle/';
  const SHARE_TITLE = '钢铁前线 · STEEL FRONT';
  const SHARE_TEXT = '五个战区，一支孤军。守住指挥核心，击退装甲部队——打开浏览器就能开战。';

  async function shareGame() {
    if (typeof navigator.share === 'function' && navigator.maxTouchPoints > 0) {
      try {
        await navigator.share({ title: SHARE_TITLE, text: SHARE_TEXT, url: SHARE_URL });
        return;
      } catch (error) {
        if (error && error.name === 'AbortError') return;
      }
    }

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(`${SHARE_TEXT} ${SHARE_URL}`);
        showToast('分享链接已复制，发给朋友就能开战', 2400);
        return;
      }
    } catch (error) {
      // fall back to the manual prompt below
    }

    window.prompt('复制下面的链接分享给朋友：', SHARE_URL);
  }

  function overlayMarkup(kind) {
    const info = LEVELS[level - 1];
    const displayBest = Math.max(best, score);

    if (kind === 'menu') {
      return `
        <div class="overlay-card">
          <p class="overlay-kicker"><span>MISSION BRIEF // 任务简报</span><span>01—05</span></p>
          <h2>守住防线<span class="accent">。</span></h2>
          <p class="lede">五个战区，一支孤军。击毁全部入侵坦克，保护底线的指挥核心。基地告破，任务立即终止。</p>
          <div class="key-grid">
            <div class="key-cell"><span class="keycap">WASD / ↑↓←→</span><small>移动</small></div>
            <div class="key-cell"><span class="keycap">SPACE</span><small>开火</small></div>
            <div class="key-cell"><span class="keycap">P / ESC</span><small>暂停</small></div>
            <div class="key-cell"><span class="keycap">M</span><small>声音</small></div>
          </div>
          <button class="action" type="button" data-action="start">开始作战<span class="arrow">→</span></button>
          <button class="text-action overlay-share" type="button" data-action="share">分享给朋友 <span aria-hidden="true">↗</span></button>
          <p class="overlay-foot"><span>最高记录 <strong>${formatScore(best)}</strong></span><span>触屏设备可使用下方控制键</span></p>
        </div>
      `;
    }

    if (kind === 'paused') {
      return `
        <div class="overlay-card">
          <p class="overlay-kicker"><span>TACTICAL HOLD // 战术暂停</span><span>SECTOR ${pad2(level)}</span></p>
          <h2>战场暂停<span class="accent">_</span></h2>
          <p class="lede">所有单位已停止行动。调整呼吸，然后继续推进。</p>
          <div class="action-row">
            <button class="action" type="button" data-action="resume">继续战斗<span class="arrow">→</span></button>
            <button class="text-action" type="button" data-action="restart">重新开始</button>
          </div>
          <p class="overlay-foot"><span>当前得分 <strong>${formatScore(score)}</strong></span><span>P / ESC 返回战场</span></p>
        </div>
      `;
    }

    if (kind === 'levelClear') {
      const next = LEVELS[level];
      return `
        <div class="overlay-card">
          <p class="overlay-kicker"><span>SECTOR CLEAR // 区域肃清</span><span>${pad2(level)} / ${pad2(LEVELS.length)}</span></p>
          <h2>区域肃清<span class="accent">。</span></h2>
          <p class="lede">“${info.name}”已无活动敌军。装甲部队继续推进，下一个战区已经在线。</p>
          <div class="result-grid">
            <div class="result-cell"><span>关卡奖励</span><b class="amber">+${formatNumber(lastBonus)}</b></div>
            <div class="result-cell"><span>累计得分</span><b>${formatScore(score)}</b></div>
            <div class="result-cell"><span>本关击毁</span><b>${killsThisLevel}</b></div>
            <div class="result-cell"><span>剩余装甲</span><b class="amber">×${lives}</b></div>
          </div>
          <button class="action" type="button" data-action="next">进入 ${next.name}<span class="arrow">→</span></button>
          <p class="overlay-foot"><span>下一战区 ${pad2(level + 1)} · ${next.code}</span><span>得分已记录</span></p>
        </div>
      `;
    }

    if (kind === 'victory') {
      return `
        <div class="overlay-card">
          <p class="overlay-kicker"><span>ALL SECTORS SECURED</span><span>05 / 05</span></p>
          <h2>全境收复<span class="accent">。</span></h2>
          <p class="lede">零点核心仍在运转，钢铁前线守住了最后的底线。五个战区全部肃清，任务完成。</p>
          <div class="result-grid">
            <div class="result-cell"><span>最终得分</span><b>${formatScore(score)}</b></div>
            <div class="result-cell"><span>最高记录</span><b class="amber">${formatScore(displayBest)}</b></div>
            <div class="result-cell"><span>总击毁</span><b>${kills}</b></div>
            <div class="result-cell"><span>保留装甲</span><b class="amber">×${lives}</b></div>
          </div>
          <div class="action-row">
            <button class="action" type="button" data-action="restart">再战一轮<span class="arrow">↻</span></button>
            <button class="text-action" type="button" data-action="share">分享战绩 <span aria-hidden="true">↗</span></button>
          </div>
          <p class="overlay-foot"><span>STEEL FRONT // MISSION COMPLETE</span><span>最高分自动保存在本地</span></p>
        </div>
      `;
    }

    const baseLost = gameOverReason === 'base';
    return `
      <div class="overlay-card">
        <p class="overlay-kicker failure"><span>MISSION FAILED // 任务失败</span><span>SECTOR ${pad2(level)}</span></p>
        <h2 class="danger">${baseLost ? '基地失守' : '装甲耗尽'}<span class="accent">。</span></h2>
        <p class="reason-line">${baseLost ? '指挥核心被摧毁，防线彻底崩溃。下次务必优先拦截接近底线的敌军。' : '最后一辆指挥坦克被击毁。敌人的下一轮攻势仍在继续。'}</p>
        <div class="result-grid">
          <div class="result-cell"><span>本次得分</span><b>${formatScore(score)}</b></div>
          <div class="result-cell"><span>最高记录</span><b class="amber">${formatScore(displayBest)}</b></div>
          <div class="result-cell"><span>击毁敌军</span><b>${kills}</b></div>
          <div class="result-cell"><span>抵达战区</span><b>${pad2(level)} / ${pad2(LEVELS.length)}</b></div>
        </div>
        <button class="action" type="button" data-action="restart">再次出击<span class="arrow">↻</span></button>
        <p class="overlay-foot"><span>SPACE / ENTER 快速重开</span><span>最高分自动保存在本地</span></p>
      </div>
    `;
  }

  function showOverlay(kind) {
    els.overlay.innerHTML = overlayMarkup(kind);
    els.overlay.classList.add('is-open');
    els.overlay.setAttribute('aria-hidden', 'false');
    hideToast();
    syncChrome();
    window.requestAnimationFrame(() => {
      const primary = els.overlay.querySelector('.action');
      if (primary) primary.focus({ preventScroll: true });
    });
  }

  function hideOverlay() {
    els.overlay.classList.remove('is-open');
    els.overlay.setAttribute('aria-hidden', 'true');
  }

  function handleOverlayClick(event) {
    const button = event.target.closest('[data-action]');
    if (!button) return;
    const action = button.dataset.action;
    Sound.init();
    if (action === 'start' || action === 'restart') startGame();
    else if (action === 'resume') resumeGame();
    else if (action === 'next') nextLevel();
    else if (action === 'share') shareGame();
  }

  // ---------------------------------------------------------------------------
  // Loop & boot
  // ---------------------------------------------------------------------------

  let previousTime = performance.now();

  function loop(now) {
    visualTime = now / 1000;
    const dt = Math.min(0.05, Math.max(0, (now - previousTime) / 1000));
    previousTime = now;

    if (state === 'playing') {
      update(dt);
    } else if (state !== 'paused' && state !== 'menu') {
      updateParticles(dt);
      shake = Math.max(0, shake - dt * 26);
    }

    draw(visualTime);
    window.requestAnimationFrame(loop);
  }

  function bootMenu() {
    score = 0;
    lives = 3;
    kills = 0;
    state = 'menu';
    loadLevel(1);
    updateSoundUI();
    showOverlay('menu');
    syncChrome();
  }

  function bindEvents() {
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    window.addEventListener('resize', resizeCanvas);
    els.soundBtn.addEventListener('click', () => {
      Sound.toggle();
    });
    els.pauseBtn.addEventListener('click', () => {
      if (state === 'playing' || state === 'paused') togglePause();
    });
    els.overlay.addEventListener('click', handleOverlayClick);
    bindTouchControls();

    window.addEventListener('blur', () => {
      clearInputs();
      if (state === 'playing') pauseGame();
    });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        clearInputs();
        if (state === 'playing') pauseGame();
      }
    });

    window.addEventListener('pagehide', () => {
      commitBest();
    });
  }

  buildArtwork();
  resizeCanvas();
  bindEvents();
  bootMenu();
  updateSoundUI();
  window.requestAnimationFrame(loop);
})();
