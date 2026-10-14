// ==========================================================================
// WAVES.JS - Efecto de ondas de fondo - DARK THEME
// ==========================================================================

const Waves = (function() {
  'use strict';

  // ==========================================================================
  // CONFIGURACIÓN
  // ==========================================================================
  const CONFIG = {
    GRID_SIZE: 14,
    SPEED: 0.0012,
    WAVE_RADIUS: 1.5,
    MOUSE_DECAY: 0.02,
    MAX_PERTURBATIONS: 20,
    TARGET_FPS: 30,          // el efecto es lento y suave: 30fps es indistinguible de 60 y gasta la mitad
    TARGET_FPS_LOW_END: 20,  // equipos con pocos núcleos / modo ahorro de datos
    COLORS: {
      // Dark theme: fondo negro → azul oscuro profundo
      BASE_BLUE: [37, 99, 235],   // #2563EB
      WHITE:     [11, 18, 32]     // #0B1220 (bg-deep)
    },
    ANIMATION: {
      START_OFFSET: 800,
      FADE_POWER_BR: 2,
      FADE_POWER_TL: 5
    }
  };

  // ==========================================================================
  // ESTADO PRIVADO
  // ==========================================================================
  let state = {
    canvasBR: null,
    ctxBR: null,
    canvasTL: null,
    ctxTL: null,
    perturbationsBR: [],
    perturbationsTL: [],
    startBR: 0,
    startTL: 0,
    animationFrame: null,
    isInitialized: false,
    isVisible: true,
    handlers: null,
    lastFrame: 0,
    frameInterval: 1000 / 30,
    inViewBR: true,
    inViewTL: true,
    observer: null,
    rowColorsBR: null,
    rowColorsTL: null,
    rowColorsRows: { br: 0, tl: 0 }
  };

  // ==========================================================================
  // MÉTODOS PRIVADOS
  // ==========================================================================
  function setupCanvas() {
    state.canvasBR = document.getElementById("bg-wave");
    state.canvasTL = document.getElementById("bg-wave-tl");

    if (!state.canvasBR || !state.canvasTL) return false;

    state.ctxBR = state.canvasBR.getContext("2d");
    state.ctxTL = state.canvasTL.getContext("2d");

    state.startBR = performance.now();
    state.startTL = performance.now() + CONFIG.ANIMATION.START_OFFSET;

    return true;
  }

  function setupEvents() {
    if (!state.canvasBR || !state.canvasTL) return;

    const handlers = {
      br: (e) => handleMouseMove('br', e),
      tl: (e) => handleMouseMove('tl', e)
    };

    state.canvasBR.addEventListener("mousemove", handlers.br);
    state.canvasBR.addEventListener("mousedown", handlers.br);
    state.canvasTL.addEventListener("mousemove", handlers.tl);
    state.canvasTL.addEventListener("mousedown", handlers.tl);

    state.handlers = handlers;
  }

  function handleMouseMove(origin, e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const perturbation = { x, y, strength: 1.0 };

    if (origin === "br") {
      state.perturbationsBR.push(perturbation);
      if (state.perturbationsBR.length > CONFIG.MAX_PERTURBATIONS) {
        state.perturbationsBR.shift();
      }
    } else {
      state.perturbationsTL.push(perturbation);
      if (state.perturbationsTL.length > CONFIG.MAX_PERTURBATIONS) {
        state.perturbationsTL.shift();
      }
    }
  }

  function resizeCanvas(canvas, ctx) {
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    canvas.width  = rect.width  * dpr;
    canvas.height = rect.height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function resizeAll() {
    if (!state.ctxBR || !state.ctxTL) return;
    resizeCanvas(state.canvasBR, state.ctxBR);
    resizeCanvas(state.canvasTL, state.ctxTL);
    state.rowColorsBR = state.rowColorsTL = null;
  }

  function lerp(a, b, t) { return a + (b - a) * t; }

  function clamp(v, min = 0, max = 1) { return Math.min(max, Math.max(min, v)); }

  // El color de una celda depende SOLO de su fila (fade depende de y), así que se
  // calcula una vez por fila en vez de una vez por celda y por frame (antes: miles
  // de lerp + template strings por frame).
  function getRowColors(origin, rows) {
    const key = origin === "br" ? "rowColorsBR" : "rowColorsTL";
    if (state[key] && state.rowColorsRows[origin] === rows) return state[key];
    const fadePower = origin === "br" ? CONFIG.ANIMATION.FADE_POWER_BR : CONFIG.ANIMATION.FADE_POWER_TL;
    const colors = new Array(rows);
    for (let y = 0; y < rows; y++) {
      const fade = origin === "br"
        ? clamp(Math.pow(y / rows, fadePower))
        : clamp(Math.pow((rows - y) / rows, fadePower));
      colors[y] = `rgb(${Math.round(lerp(CONFIG.COLORS.WHITE[0], CONFIG.COLORS.BASE_BLUE[0], fade))},` +
                  `${Math.round(lerp(CONFIG.COLORS.WHITE[1], CONFIG.COLORS.BASE_BLUE[1], fade))},` +
                  `${Math.round(lerp(CONFIG.COLORS.WHITE[2], CONFIG.COLORS.BASE_BLUE[2], fade))})`;
    }
    state[key] = colors;
    state.rowColorsRows[origin] = rows;
    return colors;
  }

  function drawWave(ctx, canvas, now, origin) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const start        = origin === "br" ? state.startBR : state.startTL;
    const phase        = (now - start) * CONFIG.SPEED;
    const perturbations = origin === "br" ? state.perturbationsBR : state.perturbationsTL;

    const cols    = Math.ceil(canvas.width  / CONFIG.GRID_SIZE);
    const rows    = Math.ceil(canvas.height / CONFIG.GRID_SIZE);
    const maxDist = Math.hypot(cols, rows);
    const rowColors = getRowColors(origin, rows);

    // canvas.width/height están en píxeles de dispositivo (x dpr) pero se dibuja en
    // coordenadas CSS (setTransform(dpr)). cols/rows se mantienen tal cual porque
    // definen la fase de la ola (el look no cambia), pero solo se recorren las celdas
    // que caen dentro del área visible: en pantallas dpr=2 son ~4x menos fillRect.
    const dpr  = window.devicePixelRatio || 1;
    const xMax = Math.min(cols, Math.ceil(canvas.width  / dpr / CONFIG.GRID_SIZE) + 1);
    const yMax = Math.min(rows, Math.ceil(canvas.height / dpr / CONFIG.GRID_SIZE) + 1);

    for (let y = 0; y < yMax; y++) {
      for (let x = 0; x < xMax; x++) {
        const px = x * CONFIG.GRID_SIZE;
        const py = y * CONFIG.GRID_SIZE;

        const dxBase   = origin === "br" ? cols - x : x;
        const dyBase   = origin === "br" ? rows - y : y;
        const distBase = Math.hypot(dxBase, dyBase) / maxDist;

        const delay = distBase * 4.2;
        let wave = Math.sin(phase - delay);
        wave = Math.pow(wave * 0.5 + 0.5, 2);
        let scale = 1 - wave * 0.6 * CONFIG.WAVE_RADIUS;

        for (let i = 0; i < perturbations.length; i++) {
          const p    = perturbations[i];
          const dx   = x * CONFIG.GRID_SIZE - p.x;
          const dy   = y * CONFIG.GRID_SIZE - p.y;
          const dist = Math.hypot(dx, dy) / 200;
          scale -= (Math.cos(dist * Math.PI) * 0.3 * p.strength) || 0;
        }

        ctx.fillStyle = rowColors[y];
        const offset = (CONFIG.GRID_SIZE - CONFIG.GRID_SIZE * scale) / 2;
        ctx.fillRect(px + offset, py + offset, CONFIG.GRID_SIZE * scale, CONFIG.GRID_SIZE * scale);
      }
    }

    // Decaimiento de perturbaciones
    let i = perturbations.length;
    while (i--) {
      perturbations[i].strength -= CONFIG.MOUSE_DECAY;
      if (perturbations[i].strength <= 0) {
        perturbations.splice(i, 1);
      }
    }
  }

  function animate(now) {
    if (!state.ctxBR || !state.ctxTL) return;

    state.animationFrame = requestAnimationFrame(animate);

    // Limitar FPS y no pintar si la pestaña está oculta o el canvas fuera de viewport.
    if (now - state.lastFrame < state.frameInterval) return;
    state.lastFrame = now;
    if (!state.isVisible) return;

    if (state.inViewBR) drawWave(state.ctxBR, state.canvasBR, now, "br");
    if (state.inViewTL) drawWave(state.ctxTL, state.canvasTL, now, "tl");
  }

  function setupObserver() {
    if (!('IntersectionObserver' in window)) return;
    state.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.target === state.canvasBR) state.inViewBR = entry.isIntersecting;
        if (entry.target === state.canvasTL) state.inViewTL = entry.isIntersecting;
      });
    });
    state.observer.observe(state.canvasBR);
    state.observer.observe(state.canvasTL);
  }

  function isLowEnd() {
    const conn = navigator.connection;
    return (conn && conn.saveData) || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4);
  }

  function handleVisibilityChange() {
    state.isVisible = !document.hidden;
  }

  // ==========================================================================
  // API PÚBLICA
  // ==========================================================================
  return {
    init() {
      if (state.isInitialized) return;
      if (!setupCanvas()) return;

      state.frameInterval = 1000 / (isLowEnd() ? CONFIG.TARGET_FPS_LOW_END : CONFIG.TARGET_FPS);
      setupEvents();
      setupObserver();
      resizeAll();
      window.addEventListener("resize", resizeAll);
      document.addEventListener("visibilitychange", handleVisibilityChange);

      // prefers-reduced-motion: las olas son puramente decorativas, así
      // que en vez de correr el loop de rAF para siempre, pintamos un
      // único frame estático (queda el fondo con textura, sin el efecto
      // de ola perpetuo) y no arrancamos la animación.
      const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      if (prefersReducedMotion) {
        drawWave(state.ctxBR, state.canvasBR, state.startBR, "br");
        drawWave(state.ctxTL, state.canvasTL, state.startTL, "tl");
        state.isInitialized = true;
        return;
      }

      state.animationFrame = requestAnimationFrame(animate);
      state.isInitialized  = true;
    },

    destroy() {
      if (state.animationFrame) {
        cancelAnimationFrame(state.animationFrame);
      }

      if (state.handlers) {
        state.canvasBR?.removeEventListener("mousemove", state.handlers.br);
        state.canvasBR?.removeEventListener("mousedown", state.handlers.br);
        state.canvasTL?.removeEventListener("mousemove", state.handlers.tl);
        state.canvasTL?.removeEventListener("mousedown", state.handlers.tl);
      }

      if (state.observer) { state.observer.disconnect(); state.observer = null; }
      window.removeEventListener("resize", resizeAll);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      state.isInitialized = false;
    }
  };
})();

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.waves = Waves;
    window.waves.init();
  });
} else {
  window.waves = Waves;
  window.waves.init();
}
