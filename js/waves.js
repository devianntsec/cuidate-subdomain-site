const CONFIG = {
  GRID_SIZE: 14,
  SPEED: 0.0012,
  WAVE_RADIUS: 1.5,
  TARGET_FPS: 30,
  TARGET_FPS_LOW_END: 20,
  MAX_DPR: 2,
  COLORS: {
    BASE_BLUE: [37, 99, 235],  
    WHITE: [11, 18, 32],       
  },
  ANIMATION: {
    START_OFFSET: 800,
    FADE_POWER_BR: 2,
    FADE_POWER_TL: 5,
  },
};

const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, min = 0, max = 1) => Math.min(max, Math.max(min, v));

class WaveField {
  constructor(canvas, origin, dpr) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.origin = origin;
    this.dpr = dpr;
    this.rect = canvas.getBoundingClientRect();
    this.phaseOffset = origin === "br" ? 0 : CONFIG.ANIMATION.START_OFFSET;
    this.#rowColors = null;
    this.#rowColorRows = 0;
    this.resize();
  }

  #rowColors;
  #rowColorRows;

  resize() {
    this.rect = this.canvas.getBoundingClientRect();
    this.canvas.width = this.rect.width * this.dpr;
    this.canvas.height = this.rect.height * this.dpr;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.#rowColors = null;
  }

  
  #getRowColors(rows) {
    if (this.#rowColors && this.#rowColorRows === rows) return this.#rowColors;
    const power = this.origin === "br"
      ? CONFIG.ANIMATION.FADE_POWER_BR
      : CONFIG.ANIMATION.FADE_POWER_TL;
    const [wr, wg, wb] = CONFIG.COLORS.WHITE;
    const [br, bg, bb] = CONFIG.COLORS.BASE_BLUE;
    const colors = new Array(rows);
    for (let y = 0; y < rows; y++) {
      const t = this.origin === "br" ? y / rows : (rows - y) / rows;
      const fade = clamp(t ** power);
      colors[y] = `rgb(${Math.round(lerp(wr, br, fade))},${Math.round(lerp(wg, bg, fade))},${Math.round(lerp(wb, bb, fade))})`;
    }
    this.#rowColors = colors;
    this.#rowColorRows = rows;
    return colors;
  }

  draw(now) {
    const { ctx, canvas, dpr } = this;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const phase = (now + this.phaseOffset) * CONFIG.SPEED;
    const cols = Math.ceil(canvas.width / CONFIG.GRID_SIZE);
    const rows = Math.ceil(canvas.height / CONFIG.GRID_SIZE);
    const maxDist = Math.hypot(cols, rows);
    const rowColors = this.#getRowColors(rows);

    
    const xMax = Math.min(cols, Math.ceil(this.rect.width / CONFIG.GRID_SIZE) + 1);
    const yMax = Math.min(rows, Math.ceil(this.rect.height / CONFIG.GRID_SIZE) + 1);
    const br = this.origin === "br";

    for (let y = 0; y < yMax; y++) {
      const py = y * CONFIG.GRID_SIZE;
      const dyBase = br ? rows - y : y;

      for (let x = 0; x < xMax; x++) {
        const dxBase = br ? cols - x : x;
        const delay = (Math.hypot(dxBase, dyBase) / maxDist) * 4.2;
        const wave = Math.sin(phase - delay) * 0.5 + 0.5;
        const scale = 1 - wave ** 2 * 0.6 * CONFIG.WAVE_RADIUS;

        const offset = (CONFIG.GRID_SIZE * (1 - scale)) / 2;
        ctx.fillStyle = rowColors[y];
        ctx.fillRect(
          x * CONFIG.GRID_SIZE + offset,
          py + offset,
          CONFIG.GRID_SIZE * scale,
          CONFIG.GRID_SIZE * scale,
        );
      }
    }
  }
}

let fields = [];

let resizeObserver = null;
let rafId = 0;
let lastFrame = 0;
let frameInterval = 1000 / CONFIG.TARGET_FPS;
let initialized = false;
let running = false;

const motionQuery = matchMedia("(prefers-reduced-motion: reduce)");
const onMotionChange = () => {
  if (!initialized) return;
  
  
  if (motionQuery.matches) {
    stop();
    for (const field of fields) field.draw(performance.now() + field.phaseOffset);
  } else {
    start();
  }
};

const isLowEnd = () =>
  navigator.connection?.saveData === true ||
  (navigator.hardwareConcurrency ?? 8) <= 4;

function frame(now) {
  rafId = requestAnimationFrame(frame);
  if (now - lastFrame < frameInterval) return;
  lastFrame = now;
  for (const field of fields) field.draw(now);
}

function start() {
  if (running) return;
  running = true;
  lastFrame = 0;
  rafId = requestAnimationFrame(frame);
}

function stop() {
  running = false;
  cancelAnimationFrame(rafId);
}

export function initWaves() {
  if (initialized) return;
  const dpr = Math.min(window.devicePixelRatio || 1, CONFIG.MAX_DPR);
  const specs = [
    ["bg-wave", "br"],
    ["bg-wave-tl", "tl"],
  ];
  fields = specs
    .map(([id, origin]) => {
      const canvas = document.getElementById(id);
      return canvas ? new WaveField(canvas, origin, dpr) : null;
    })
    .filter(Boolean);
  if (!fields.length) return;

  frameInterval = 1000 / (isLowEnd() ? CONFIG.TARGET_FPS_LOW_END : CONFIG.TARGET_FPS);

  resizeObserver = new ResizeObserver(() => {
    for (const field of fields) field.resize();
  });
  for (const field of fields) resizeObserver.observe(field.canvas);

  motionQuery.addEventListener("change", onMotionChange);
  initialized = true; 
  onMotionChange();
}

export function destroyWaves() {
  stop();
  motionQuery.removeEventListener("change", onMotionChange);
  resizeObserver?.disconnect();
  resizeObserver = null;
  fields = [];
  initialized = false;
}
