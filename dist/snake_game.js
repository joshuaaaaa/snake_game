const SNAKE_CARD_VERSION = "2.0.0";

const DIRS = {
  UP: { x: 0, y: -1 },
  DOWN: { x: 0, y: 1 },
  LEFT: { x: -1, y: 0 },
  RIGHT: { x: 1, y: 0 },
};

const OPPOSITE = { UP: "DOWN", DOWN: "UP", LEFT: "RIGHT", RIGHT: "LEFT" };

const KEYMAP = {
  ArrowUp: "UP", w: "UP", W: "UP",
  ArrowDown: "DOWN", s: "DOWN", S: "DOWN",
  ArrowLeft: "LEFT", a: "LEFT", A: "LEFT",
  ArrowRight: "RIGHT", d: "RIGHT", D: "RIGHT",
};

const BOARD_SIZE = 420; // logická velikost plátna v px
const BEST_KEY = "snake-card-best";
const START_SPEED = 170; // ms na jeden krok
const MIN_SPEED = 70;
const BONUS_DURATION = 6000; // ms

class SnakeCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.particles = [];
    this.floaters = [];
    this.rafId = null;
  }

  setConfig(config) {
    this.config = config || {};
    const grid = parseInt(this.config.grid_size, 10);
    this.grid = Number.isFinite(grid) ? Math.min(30, Math.max(8, grid)) : 15;
    this.cell = BOARD_SIZE / this.grid;
    if (this.isConnected && this.canvas) {
      this.render();
      this.initializeGame();
    }
  }

  static getStubConfig() {
    return {};
  }

  getCardSize() {
    return 8;
  }

  connectedCallback() {
    if (!this.grid) this.setConfig({});
    if (!this.canvas) {
      this.render();
      this.initializeGame();
    }
    this.setupEventListeners();
    this.startLoop();
  }

  disconnectedCallback() {
    this.stopLoop();
    this.removeEventListeners();
    if (this.state === "running") this.setState("paused");
  }

  // ---------- Stav hry ----------

  initializeGame() {
    const mid = Math.floor(this.grid / 2);
    this.snake = [
      { x: mid, y: mid },
      { x: mid - 1, y: mid },
      { x: mid - 2, y: mid },
    ];
    this.prevSnake = this.snake.map((s) => ({ ...s }));
    this.direction = "RIGHT";
    this.dirQueue = [];
    this.score = 0;
    this.eaten = 0;
    this.speed = START_SPEED;
    this.acc = 0;
    this.bonus = null;
    this.particles = [];
    this.floaters = [];
    this.shake = 0;
    this.deathTime = 0;
    this.newRecord = false;
    this.best = this.loadBest();
    this.generateFood();
    this.setState("ready");
    this.updateHud();
  }

  setState(state) {
    this.state = state;
    if (this.pauseBtn) {
      this.pauseBtn.textContent = state === "paused" ? "▶ Resume" : "❚❚ Pause";
      this.pauseBtn.disabled = state === "ready" || state === "over";
    }
  }

  start() {
    if (this.state === "ready") {
      this.acc = 0;
      this.setState("running");
    }
  }

  togglePause() {
    if (this.state === "running") this.setState("paused");
    else if (this.state === "paused") this.setState("running");
  }

  restart() {
    this.initializeGame();
  }

  loadBest() {
    try {
      return parseInt(localStorage.getItem(BEST_KEY), 10) || 0;
    } catch (e) {
      return 0;
    }
  }

  saveBest(value) {
    try {
      localStorage.setItem(BEST_KEY, String(value));
    } catch (e) {
      // localStorage nemusí být dostupné
    }
  }

  get level() {
    return Math.floor(this.eaten / 5) + 1;
  }

  queueDirection(dir) {
    const last = this.dirQueue.length
      ? this.dirQueue[this.dirQueue.length - 1]
      : this.direction;
    if (dir === last || dir === OPPOSITE[last]) return;
    if (this.dirQueue.length < 3) this.dirQueue.push(dir);
  }

  // ---------- Vstupy ----------

  setupEventListeners() {
    if (this.keyHandler) return;

    this.keyHandler = (e) => {
      const target = e.composedPath ? e.composedPath()[0] : e.target;
      const tag = target && target.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || (target && target.isContentEditable)) return;
      if (!this.isConnected) return;

      const dir = KEYMAP[e.key];
      if (dir) {
        if (this.state === "over" || this.state === "paused") return;
        e.preventDefault();
        if (this.state === "ready") this.start();
        this.queueDirection(dir);
        return;
      }

      if (e.key === " " || e.key === "p" || e.key === "P") {
        if (this.state === "running" || this.state === "paused") {
          e.preventDefault();
          this.togglePause();
        } else if (this.state === "ready") {
          e.preventDefault();
          this.start();
        }
      } else if (e.key === "Enter" && this.state === "over") {
        e.preventDefault();
        this.restart();
      }
    };
    document.addEventListener("keydown", this.keyHandler);
  }

  removeEventListeners() {
    if (this.keyHandler) {
      document.removeEventListener("keydown", this.keyHandler);
      this.keyHandler = null;
    }
  }

  handleTap() {
    if (this.state === "ready") this.start();
    else if (this.state === "over") this.restart();
    else this.togglePause();
  }

  bindCanvasInput() {
    let startX = 0;
    let startY = 0;
    let touching = false;

    this.canvas.addEventListener("touchstart", (e) => {
      const t = e.changedTouches[0];
      startX = t.clientX;
      startY = t.clientY;
      touching = true;
    }, { passive: true });

    this.canvas.addEventListener("touchmove", (e) => {
      if (this.state === "running" || this.state === "ready") e.preventDefault();
    }, { passive: false });

    this.canvas.addEventListener("touchend", (e) => {
      if (!touching) return;
      touching = false;
      e.preventDefault();
      const t = e.changedTouches[0];
      const dx = t.clientX - startX;
      const dy = t.clientY - startY;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) {
        this.handleTap();
        return;
      }
      const dir = Math.abs(dx) > Math.abs(dy)
        ? (dx > 0 ? "RIGHT" : "LEFT")
        : (dy > 0 ? "DOWN" : "UP");
      if (this.state === "ready") this.start();
      if (this.state === "running") this.queueDirection(dir);
    }, { passive: false });

    this.canvas.addEventListener("click", () => this.handleTap());
  }

  // ---------- Herní logika ----------

  step() {
    if (this.dirQueue.length) this.direction = this.dirQueue.shift();
    const d = DIRS[this.direction];
    const head = { x: this.snake[0].x + d.x, y: this.snake[0].y + d.y };

    const eatsFood = head.x === this.food.x && head.y === this.food.y;
    const eatsBonus = this.bonus && head.x === this.bonus.x && head.y === this.bonus.y;
    const grows = eatsFood || eatsBonus;
    // Ocas se v tomto kroku posune, pokud had neroste
    const body = grows ? this.snake : this.snake.slice(0, -1);

    if (
      head.x < 0 || head.y < 0 ||
      head.x >= this.grid || head.y >= this.grid ||
      body.some((s) => s.x === head.x && s.y === head.y)
    ) {
      this.die();
      return;
    }

    this.prevSnake = this.snake.map((s) => ({ ...s }));
    this.snake.unshift(head);
    if (!grows) this.snake.pop();

    if (eatsFood) {
      this.eaten++;
      this.addScore(1, head, "#ff6b6b");
      this.burst(head, ["#ff6b6b", "#ffd166", "#ff9f43"], 18);
      this.speed = Math.max(MIN_SPEED, START_SPEED - this.eaten * 5);
      this.generateFood();
      if (this.eaten % 5 === 0) this.spawnBonus();
    }
    if (eatsBonus) {
      this.addScore(5, head, "#ffd700");
      this.burst(head, ["#ffd700", "#fff3b0", "#ffb700"], 30);
      this.bonus = null;
    }
  }

  addScore(points, cell, color) {
    const oldLevel = this.level;
    this.score += points;
    this.floaters.push({
      x: (cell.x + 0.5) * this.cell,
      y: (cell.y + 0.2) * this.cell,
      text: `+${points}`,
      color,
      life: 900,
      max: 900,
    });
    if (this.score > this.best) {
      this.best = this.score;
      this.newRecord = true;
      this.saveBest(this.best);
    }
    this.updateHud();
    if (this.level > oldLevel) {
      this.floaters.push({
        x: BOARD_SIZE / 2,
        y: BOARD_SIZE / 2,
        text: `LEVEL ${this.level}`,
        color: "#7cff6b",
        life: 1400,
        max: 1400,
        big: true,
      });
    }
  }

  die() {
    this.prevSnake = this.snake.map((s) => ({ ...s }));
    this.setState("over");
    this.deathTime = performance.now();
    this.shake = 350;
    const head = this.snake[0];
    this.burst(head, ["#7cff6b", "#2ecc71", "#ffffff"], 40);
    this.updateHud();
  }

  freeCell() {
    const taken = new Set(this.snake.map((s) => `${s.x},${s.y}`));
    if (this.food) taken.add(`${this.food.x},${this.food.y}`);
    if (this.bonus) taken.add(`${this.bonus.x},${this.bonus.y}`);
    const free = [];
    for (let x = 0; x < this.grid; x++) {
      for (let y = 0; y < this.grid; y++) {
        if (!taken.has(`${x},${y}`)) free.push({ x, y });
      }
    }
    return free.length ? free[Math.floor(Math.random() * free.length)] : null;
  }

  generateFood() {
    this.food = null;
    this.food = this.freeCell() || { x: -1, y: -1 };
    this.food.born = performance.now();
  }

  spawnBonus() {
    const cell = this.freeCell();
    if (!cell) return;
    this.bonus = { ...cell, timeLeft: BONUS_DURATION };
  }

  burst(cell, colors, count) {
    const cx = (cell.x + 0.5) * this.cell;
    const cy = (cell.y + 0.5) * this.cell;
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = 40 + Math.random() * 140;
      this.particles.push({
        x: cx,
        y: cy,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v,
        size: 1.5 + Math.random() * 3,
        color: colors[i % colors.length],
        life: 500 + Math.random() * 500,
        max: 1000,
      });
    }
  }

  // ---------- Smyčka ----------

  startLoop() {
    if (this.rafId) return;
    this.lastTime = performance.now();
    const frame = (now) => {
      const dt = Math.min(100, now - this.lastTime);
      this.lastTime = now;
      this.update(dt, now);
      this.draw(now);
      this.rafId = requestAnimationFrame(frame);
    };
    this.rafId = requestAnimationFrame(frame);
  }

  stopLoop() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  update(dt, now) {
    if (this.state === "running") {
      this.acc += dt;
      while (this.acc >= this.speed && this.state === "running") {
        this.acc -= this.speed;
        this.step();
      }
      if (this.bonus) {
        this.bonus.timeLeft -= dt;
        if (this.bonus.timeLeft <= 0) {
          this.burst(this.bonus, ["#8a7a3a", "#5c5230"], 10);
          this.bonus = null;
        }
      }
    }

    const s = dt / 1000;
    this.particles = this.particles.filter((p) => {
      p.life -= dt;
      p.x += p.vx * s;
      p.y += p.vy * s;
      p.vx *= 0.94;
      p.vy = p.vy * 0.94 + 60 * s;
      return p.life > 0;
    });
    this.floaters = this.floaters.filter((f) => {
      f.life -= dt;
      if (!f.big) f.y -= 30 * s;
      return f.life > 0;
    });
    if (this.shake > 0) this.shake = Math.max(0, this.shake - dt);
  }

  // ---------- Vykreslování ----------

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          font-family: var(--ha-font-family, var(--paper-font-body1_-_font-family, system-ui, sans-serif));
        }
        ha-card {
          overflow: hidden;
          padding: 16px;
          background:
            radial-gradient(120% 80% at 50% 0%, rgba(124, 255, 107, 0.08), transparent 60%),
            var(--ha-card-background, var(--card-background-color, #1c1c1c));
        }
        .header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          margin-bottom: 12px;
          flex-wrap: wrap;
        }
        .title {
          font-size: 20px;
          font-weight: 700;
          letter-spacing: 0.5px;
          color: var(--primary-text-color, #fff);
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .stats {
          display: flex;
          gap: 6px;
        }
        .pill {
          display: flex;
          flex-direction: column;
          align-items: center;
          min-width: 54px;
          padding: 4px 10px;
          border-radius: 10px;
          background: rgba(127, 127, 127, 0.12);
          border: 1px solid rgba(127, 127, 127, 0.18);
        }
        .pill .label {
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: var(--secondary-text-color, #aaa);
        }
        .pill .value {
          font-size: 17px;
          font-weight: 700;
          color: var(--primary-text-color, #fff);
          font-variant-numeric: tabular-nums;
        }
        .pill.score .value { color: #7cff6b; }
        .pill.best .value { color: #ffd166; }
        .pill.bump { animation: bump 0.3s ease; }
        @keyframes bump {
          50% { transform: scale(1.15); }
        }
        .board {
          position: relative;
          width: 100%;
          max-width: ${BOARD_SIZE}px;
          margin: 0 auto;
          border-radius: 14px;
          padding: 3px;
          background: linear-gradient(135deg, #7cff6b, #1e8f4e 40%, #0b3d2a 60%, #7cff6b);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.45), 0 0 24px rgba(124, 255, 107, 0.15);
        }
        canvas {
          display: block;
          width: 100%;
          height: auto;
          aspect-ratio: 1 / 1;
          border-radius: 11px;
          touch-action: none;
          cursor: pointer;
        }
        .controls {
          display: flex;
          justify-content: center;
          gap: 10px;
          margin-top: 14px;
        }
        button {
          padding: 9px 18px;
          border: none;
          border-radius: 999px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          font-family: inherit;
          color: #fff;
          background: var(--primary-color, #03a9f4);
          box-shadow: 0 3px 10px rgba(0, 0, 0, 0.25);
          transition: transform 0.1s ease, filter 0.15s ease;
        }
        button.secondary {
          background: rgba(127, 127, 127, 0.25);
          color: var(--primary-text-color, #fff);
        }
        button:hover:not(:disabled) { filter: brightness(1.12); }
        button:active:not(:disabled) { transform: scale(0.95); }
        button:disabled { opacity: 0.4; cursor: default; }
        .dpad {
          display: none;
          grid-template-columns: repeat(3, 52px);
          grid-template-rows: repeat(3, 52px);
          gap: 6px;
          justify-content: center;
          margin-top: 14px;
        }
        .dpad button {
          padding: 0;
          border-radius: 14px;
          font-size: 20px;
          background: rgba(127, 127, 127, 0.22);
          color: var(--primary-text-color, #fff);
        }
        .dpad .up { grid-column: 2; grid-row: 1; }
        .dpad .left { grid-column: 1; grid-row: 2; }
        .dpad .right { grid-column: 3; grid-row: 2; }
        .dpad .down { grid-column: 2; grid-row: 3; }
        @media (pointer: coarse) {
          .dpad { display: grid; }
        }
        .hint {
          text-align: center;
          margin-top: 10px;
          font-size: 12px;
          color: var(--secondary-text-color, #999);
        }
        @media (pointer: coarse) {
          .hint { display: none; }
        }
      </style>
      <ha-card>
        <div class="header">
          <div class="title">🐍 ${this.escape(this.config.title || "Snake")}</div>
          <div class="stats">
            <div class="pill score"><span class="label">Score</span><span class="value" id="score">0</span></div>
            <div class="pill best"><span class="label">Best</span><span class="value" id="best">0</span></div>
            <div class="pill level"><span class="label">Level</span><span class="value" id="level">1</span></div>
          </div>
        </div>
        <div class="board">
          <canvas id="snake-canvas"></canvas>
        </div>
        <div class="dpad">
          <button class="up" data-dir="UP" aria-label="Up">▲</button>
          <button class="left" data-dir="LEFT" aria-label="Left">◀</button>
          <button class="right" data-dir="RIGHT" aria-label="Right">▶</button>
          <button class="down" data-dir="DOWN" aria-label="Down">▼</button>
        </div>
        <div class="controls">
          <button id="pause-btn" class="secondary">❚❚ Pause</button>
          <button id="restart-btn">↻ Restart</button>
        </div>
        <div class="hint">Arrows / WASD to move · Space to pause · Enter to restart</div>
      </ha-card>
    `;

    this.canvas = this.shadowRoot.getElementById("snake-canvas");
    this.scoreEl = this.shadowRoot.getElementById("score");
    this.bestEl = this.shadowRoot.getElementById("best");
    this.levelEl = this.shadowRoot.getElementById("level");
    this.pauseBtn = this.shadowRoot.getElementById("pause-btn");

    this.dpr = Math.min(3, window.devicePixelRatio || 1);
    this.canvas.width = BOARD_SIZE * this.dpr;
    this.canvas.height = BOARD_SIZE * this.dpr;
    this.ctx = this.canvas.getContext("2d");
    this.bg = this.buildBackground();

    this.shadowRoot.getElementById("restart-btn").onclick = () => this.restart();
    this.pauseBtn.onclick = () => this.togglePause();
    this.shadowRoot.querySelectorAll(".dpad button").forEach((btn) => {
      btn.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        if (this.state === "over") return;
        if (this.state === "ready") this.start();
        if (this.state === "paused") this.togglePause();
        this.queueDirection(btn.dataset.dir);
      });
    });
    this.bindCanvasInput();
  }

  escape(text) {
    return String(text).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    }[c]));
  }

  updateHud() {
    if (!this.scoreEl) return;
    const bump = (el, value) => {
      if (el.textContent === String(value)) return;
      el.textContent = value;
      const pill = el.parentElement;
      pill.classList.remove("bump");
      void pill.offsetWidth; // restart animace
      pill.classList.add("bump");
    };
    bump(this.scoreEl, this.score);
    bump(this.bestEl, this.best);
    bump(this.levelEl, this.level);
  }

  buildBackground() {
    const c = document.createElement("canvas");
    c.width = this.canvas.width;
    c.height = this.canvas.height;
    const g = c.getContext("2d");
    g.scale(this.dpr, this.dpr);

    const base = g.createLinearGradient(0, 0, BOARD_SIZE, BOARD_SIZE);
    base.addColorStop(0, "#12261b");
    base.addColorStop(1, "#0a1711");
    g.fillStyle = base;
    g.fillRect(0, 0, BOARD_SIZE, BOARD_SIZE);

    // Šachovnice
    for (let x = 0; x < this.grid; x++) {
      for (let y = 0; y < this.grid; y++) {
        if ((x + y) % 2 === 0) {
          g.fillStyle = "rgba(255, 255, 255, 0.028)";
          g.fillRect(x * this.cell, y * this.cell, this.cell, this.cell);
        }
      }
    }

    // Tečky v rozích políček
    g.fillStyle = "rgba(124, 255, 107, 0.07)";
    for (let x = 1; x < this.grid; x++) {
      for (let y = 1; y < this.grid; y++) {
        g.beginPath();
        g.arc(x * this.cell, y * this.cell, 1.2, 0, Math.PI * 2);
        g.fill();
      }
    }

    // Vinětace
    const v = g.createRadialGradient(
      BOARD_SIZE / 2, BOARD_SIZE / 2, BOARD_SIZE * 0.3,
      BOARD_SIZE / 2, BOARD_SIZE / 2, BOARD_SIZE * 0.75
    );
    v.addColorStop(0, "rgba(0, 0, 0, 0)");
    v.addColorStop(1, "rgba(0, 0, 0, 0.45)");
    g.fillStyle = v;
    g.fillRect(0, 0, BOARD_SIZE, BOARD_SIZE);
    return c;
  }

  draw(now) {
    const ctx = this.ctx;
    if (!ctx) return;

    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, BOARD_SIZE, BOARD_SIZE);
    ctx.save();
    if (this.shake > 0) {
      const k = (this.shake / 350) * 6;
      ctx.translate((Math.random() - 0.5) * k, (Math.random() - 0.5) * k);
    }

    ctx.drawImage(this.bg, 0, 0, BOARD_SIZE, BOARD_SIZE);
    this.drawFood(ctx, now);
    if (this.bonus) this.drawBonus(ctx, now);
    this.drawSnake(ctx, now);
    this.drawParticles(ctx);
    ctx.restore();

    this.drawOverlay(ctx, now);
  }

  snakePoints() {
    const t = this.state === "running" || this.state === "paused"
      ? Math.min(1, this.acc / this.speed)
      : 1;
    const ease = t * t * (3 - 2 * t) * 0.35 + t * 0.65;
    const prev = this.prevSnake;
    return this.snake.map((s, i) => {
      const p = prev[i] || prev[prev.length - 1] || s;
      return {
        x: (p.x + (s.x - p.x) * ease + 0.5) * this.cell,
        y: (p.y + (s.y - p.y) * ease + 0.5) * this.cell,
      };
    });
  }

  drawSnake(ctx, now) {
    const pts = this.snakePoints();
    const n = pts.length;
    const dead = this.state === "over";
    const flash = dead && Math.floor((now - this.deathTime) / 120) % 2 === 0
      && now - this.deathTime < 720;
    const width = (i) => this.cell * (0.78 - 0.3 * (i / Math.max(1, n - 1)));
    const color = (i, light = 0) => {
      const k = i / Math.max(1, n - 1);
      if (dead) return flash ? "#ffffff" : `hsl(140, 12%, ${42 - k * 14 + light}%)`;
      const hue = 105 + k * 50;
      const l = 58 - k * 22 + light + (i % 2 === 0 ? 3 : 0);
      return `hsl(${hue}, 80%, ${l}%)`;
    };

    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // Stín
    ctx.save();
    ctx.translate(3, 5);
    ctx.strokeStyle = "rgba(0, 0, 0, 0.35)";
    for (let i = n - 1; i >= 1; i--) {
      ctx.lineWidth = width(i);
      ctx.beginPath();
      ctx.moveTo(pts[i].x, pts[i].y);
      ctx.lineTo(pts[i - 1].x, pts[i - 1].y);
      ctx.stroke();
    }
    ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
    ctx.beginPath();
    ctx.arc(pts[0].x, pts[0].y, this.cell * 0.46, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Tělo
    for (let i = n - 1; i >= 1; i--) {
      ctx.strokeStyle = color(i);
      ctx.lineWidth = width(i);
      ctx.beginPath();
      ctx.moveTo(pts[i].x, pts[i].y);
      ctx.lineTo(pts[i - 1].x, pts[i - 1].y);
      ctx.stroke();
    }

    // Lesk a šupiny
    for (let i = n - 1; i >= 1; i--) {
      const w = width(i);
      ctx.fillStyle = "rgba(255, 255, 255, 0.18)";
      ctx.beginPath();
      ctx.arc(pts[i].x - w * 0.15, pts[i].y - w * 0.18, w * 0.18, 0, Math.PI * 2);
      ctx.fill();
      if (!dead && i % 2 === 1) {
        ctx.fillStyle = "rgba(0, 40, 10, 0.18)";
        ctx.beginPath();
        ctx.arc(pts[i].x + w * 0.12, pts[i].y + w * 0.12, w * 0.14, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    this.drawHead(ctx, pts, now, dead, color(0));
  }

  drawHead(ctx, pts, now, dead, headColor) {
    const head = pts[0];
    let angle;
    if (pts.length > 1 && (pts[0].x !== pts[1].x || pts[0].y !== pts[1].y)) {
      angle = Math.atan2(pts[0].y - pts[1].y, pts[0].x - pts[1].x);
    } else {
      const d = DIRS[this.direction];
      angle = Math.atan2(d.y, d.x);
    }
    const c = this.cell;

    ctx.save();
    ctx.translate(head.x, head.y);
    ctx.rotate(angle);

    // Jazyk
    if (!dead && this.state !== "ready" && Math.floor(now / 180) % 7 === 0) {
      ctx.strokeStyle = "#ff3b5c";
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(c * 0.4, 0);
      ctx.lineTo(c * 0.68, 0);
      ctx.lineTo(c * 0.8, -c * 0.08);
      ctx.moveTo(c * 0.68, 0);
      ctx.lineTo(c * 0.8, c * 0.08);
      ctx.stroke();
    }

    // Hlava
    if (!dead) {
      ctx.shadowColor = "rgba(124, 255, 107, 0.6)";
      ctx.shadowBlur = 14;
    }
    const hg = ctx.createRadialGradient(-c * 0.1, -c * 0.15, c * 0.05, 0, 0, c * 0.5);
    hg.addColorStop(0, dead ? "#9aa59e" : "#b6ff9e");
    hg.addColorStop(1, headColor);
    ctx.fillStyle = hg;
    ctx.beginPath();
    ctx.ellipse(c * 0.04, 0, c * 0.48, c * 0.42, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Nozdry
    ctx.fillStyle = "rgba(0, 40, 10, 0.5)";
    ctx.beginPath();
    ctx.arc(c * 0.36, -c * 0.08, c * 0.03, 0, Math.PI * 2);
    ctx.arc(c * 0.36, c * 0.08, c * 0.03, 0, Math.PI * 2);
    ctx.fill();

    // Oči
    const blink = !dead && now % 3200 < 120;
    [-1, 1].forEach((side) => {
      const ex = c * 0.1;
      const ey = side * c * 0.2;
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      if (blink) ctx.ellipse(ex, ey, c * 0.13, c * 0.03, 0, 0, Math.PI * 2);
      else ctx.arc(ex, ey, c * 0.13, 0, Math.PI * 2);
      ctx.fill();

      if (dead) {
        ctx.strokeStyle = "#222";
        ctx.lineWidth = 2;
        const r = c * 0.07;
        ctx.beginPath();
        ctx.moveTo(ex - r, ey - r); ctx.lineTo(ex + r, ey + r);
        ctx.moveTo(ex + r, ey - r); ctx.lineTo(ex - r, ey + r);
        ctx.stroke();
      } else if (!blink) {
        ctx.fillStyle = "#111";
        ctx.beginPath();
        ctx.arc(ex + c * 0.04, ey, c * 0.07, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.arc(ex + c * 0.06, ey - c * 0.03, c * 0.025, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    ctx.restore();
  }

  drawFood(ctx, now) {
    if (!this.food || this.food.x < 0) return;
    const c = this.cell;
    const cx = (this.food.x + 0.5) * c;
    const age = Math.min(1, (now - this.food.born) / 250);
    const pop = age < 1 ? 1 - Math.pow(1 - age, 3) * 1.0 : 1;
    const pulse = 1 + Math.sin(now / 220) * 0.06;
    const s = pop * pulse;
    const cy = (this.food.y + 0.5) * c + Math.sin(now / 300) * 1.5;

    // Záře
    const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, c * 0.9);
    glow.addColorStop(0, "rgba(255, 80, 80, 0.35)");
    glow.addColorStop(1, "rgba(255, 80, 80, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(cx - c, cy - c, c * 2, c * 2);

    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(s, s);

    // Stín
    ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
    ctx.beginPath();
    ctx.ellipse(2, c * 0.36, c * 0.3, c * 0.08, 0, 0, Math.PI * 2);
    ctx.fill();

    // Jablko
    const r = c * 0.34;
    const ag = ctx.createRadialGradient(-r * 0.35, -r * 0.35, r * 0.1, 0, 0, r * 1.1);
    ag.addColorStop(0, "#ff8a8a");
    ag.addColorStop(0.5, "#e8384f");
    ag.addColorStop(1, "#9b1c2e");
    ctx.fillStyle = ag;
    ctx.beginPath();
    ctx.arc(-r * 0.32, r * 0.05, r * 0.78, 0, Math.PI * 2);
    ctx.arc(r * 0.32, r * 0.05, r * 0.78, 0, Math.PI * 2);
    ctx.fill();

    // Odlesk
    ctx.fillStyle = "rgba(255, 255, 255, 0.55)";
    ctx.beginPath();
    ctx.ellipse(-r * 0.45, -r * 0.3, r * 0.18, r * 0.28, -0.5, 0, Math.PI * 2);
    ctx.fill();

    // Stopka
    ctx.strokeStyle = "#6b4226";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.6);
    ctx.quadraticCurveTo(r * 0.05, -r * 0.95, r * 0.2, -r * 1.1);
    ctx.stroke();

    // List
    ctx.fillStyle = "#4cd964";
    ctx.beginPath();
    ctx.ellipse(r * 0.42, -r * 0.92, r * 0.32, r * 0.14, -0.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  drawBonus(ctx, now) {
    const c = this.cell;
    const cx = (this.bonus.x + 0.5) * c;
    const cy = (this.bonus.y + 0.5) * c;
    const frac = this.bonus.timeLeft / BONUS_DURATION;
    const blinking = frac < 0.3 && Math.floor(now / 120) % 2 === 0;

    const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, c);
    glow.addColorStop(0, "rgba(255, 215, 0, 0.45)");
    glow.addColorStop(1, "rgba(255, 215, 0, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(cx - c, cy - c, c * 2, c * 2);

    // Odpočet
    ctx.strokeStyle = "rgba(255, 215, 0, 0.8)";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.arc(cx, cy, c * 0.48, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * frac);
    ctx.stroke();

    if (blinking) return;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(now / 900);
    const outer = c * 0.34;
    const inner = outer * 0.45;
    const sg = ctx.createRadialGradient(0, 0, 0, 0, 0, outer);
    sg.addColorStop(0, "#fff6c2");
    sg.addColorStop(0.6, "#ffd700");
    sg.addColorStop(1, "#e0a100");
    ctx.fillStyle = sg;
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const r = i % 2 === 0 ? outer : inner;
      const a = (i * Math.PI) / 5 - Math.PI / 2;
      ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  drawParticles(ctx) {
    this.particles.forEach((p) => {
      ctx.globalAlpha = Math.max(0, p.life / p.max);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    this.floaters.forEach((f) => {
      const k = f.life / f.max;
      ctx.globalAlpha = Math.min(1, k * 2);
      if (f.big) {
        const scale = 1 + (1 - k) * 0.3;
        ctx.font = `800 ${Math.round(34 * scale)}px system-ui, sans-serif`;
        ctx.lineWidth = 5;
        ctx.strokeStyle = "rgba(0, 0, 0, 0.6)";
        ctx.strokeText(f.text, f.x, f.y);
      } else {
        ctx.font = "800 16px system-ui, sans-serif";
        ctx.lineWidth = 3;
        ctx.strokeStyle = "rgba(0, 0, 0, 0.6)";
        ctx.strokeText(f.text, f.x, f.y);
      }
      ctx.fillStyle = f.color;
      ctx.fillText(f.text, f.x, f.y);
    });
    ctx.globalAlpha = 1;
  }

  drawOverlay(ctx, now) {
    if (this.state === "running") return;
    if (this.state === "over" && now - this.deathTime < 600) return;

    const fade = this.state === "over" ? Math.min(1, (now - this.deathTime - 600) / 300) : 1;
    ctx.globalAlpha = fade;
    ctx.fillStyle = "rgba(5, 12, 8, 0.62)";
    ctx.fillRect(0, 0, BOARD_SIZE, BOARD_SIZE);

    const cx = BOARD_SIZE / 2;
    const cy = BOARD_SIZE / 2;
    const pw = 280;
    const ph = this.state === "over" ? 190 : 150;

    ctx.fillStyle = "rgba(18, 38, 27, 0.92)";
    ctx.strokeStyle = "rgba(124, 255, 107, 0.45)";
    ctx.lineWidth = 2;
    this.roundRect(ctx, cx - pw / 2, cy - ph / 2, pw, ph, 18);
    ctx.fill();
    ctx.stroke();

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const font = (w, s) => `${w} ${s}px system-ui, sans-serif`;
    const bob = Math.sin(now / 400) * 3;

    if (this.state === "ready") {
      ctx.font = font(800, 36);
      ctx.fillStyle = "#7cff6b";
      ctx.shadowColor = "rgba(124, 255, 107, 0.7)";
      ctx.shadowBlur = 16;
      ctx.fillText("SNAKE", cx, cy - 30 + bob);
      ctx.shadowBlur = 0;
      ctx.font = font(500, 14);
      ctx.fillStyle = "#d8f5dc";
      ctx.fillText("Press an arrow key or tap to start", cx, cy + 16);
      ctx.fillStyle = "#8fb89a";
      ctx.font = font(500, 12);
      ctx.fillText("🍎 +1   ⭐ +5 (bonus)", cx, cy + 42);
    } else if (this.state === "paused") {
      ctx.font = font(800, 32);
      ctx.fillStyle = "#ffffff";
      ctx.fillText("PAUSED", cx, cy - 16 + bob);
      ctx.font = font(500, 14);
      ctx.fillStyle = "#d8f5dc";
      ctx.fillText("Press Space or tap to continue", cx, cy + 24);
    } else if (this.state === "over") {
      ctx.font = font(800, 32);
      ctx.fillStyle = "#ff5c6c";
      ctx.shadowColor = "rgba(255, 92, 108, 0.6)";
      ctx.shadowBlur = 14;
      ctx.fillText("GAME OVER", cx, cy - 55);
      ctx.shadowBlur = 0;
      ctx.font = font(700, 20);
      ctx.fillStyle = "#ffffff";
      ctx.fillText(`Score: ${this.score}`, cx, cy - 12);
      if (this.newRecord) {
        ctx.font = font(800, 16);
        ctx.fillStyle = `hsl(${(now / 8) % 360}, 90%, 65%)`;
        ctx.fillText("★ NEW BEST! ★", cx, cy + 18 + bob);
      } else {
        ctx.font = font(500, 14);
        ctx.fillStyle = "#ffd166";
        ctx.fillText(`Best: ${this.best}`, cx, cy + 18);
      }
      ctx.font = font(500, 13);
      ctx.fillStyle = "#8fb89a";
      ctx.fillText("Press Enter or tap to play again", cx, cy + 55);
    }
    ctx.globalAlpha = 1;
  }

  roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
}

// Registrace custom elementu
if (!customElements.get("snake-card")) {
  customElements.define("snake-card", SnakeCard);
}

// Registrace do výběru karet v Lovelace
window.customCards = window.customCards || [];
if (!window.customCards.some((c) => c.type === "snake-card")) {
  window.customCards.push({
    type: "snake-card",
    name: "Snake Card",
    description: "A graphical Snake game for your dashboard.",
    preview: true,
  });
}

console.info(
  `%c SNAKE-CARD %c v${SNAKE_CARD_VERSION} `,
  "color: #0a1711; background: #7cff6b; font-weight: 700;",
  "color: #7cff6b; background: #0a1711;"
);
