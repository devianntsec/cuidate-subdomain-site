import { initWaves } from "./waves.js";
import { initScrollSpy } from "./modules/scrollspy.js";
import { initChecklist } from "./modules/checklist.js";
import { initQuiz } from "./modules/quiz.js";
import { initTabs } from "./modules/tabs.js";
import { initTimeline } from "./modules/timeline.js";
import { initFinder } from "./modules/finder.js";
import { initStepper } from "./modules/stepper.js";

function initMailObfuscation() {
  for (const a of document.querySelectorAll("a.mail-obf")) {
    const { u, d } = a.dataset;
    if (!u || !d) continue;
    const addr = `${u}@${d}`;
    a.href = `mailto:${addr}`;
    a.textContent = addr;
  }
}

const initializers = [
  initWaves,
  initScrollSpy,
  initChecklist,
  initQuiz,
  initTabs,
  initTimeline,
  initFinder,
  initStepper,
  initMailObfuscation,
];

for (const init of initializers) {
  try {
    init();
  } catch (error) {
    console.error(`[cuidate] ${init.name} falló:`, error);
  }
}

if ("serviceWorker" in navigator && location.protocol === "https:") {
  addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  });
}
