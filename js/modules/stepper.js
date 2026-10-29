import { template } from "../lib/dom.js";

export function initStepper() {
  for (const steps of document.querySelectorAll(".steps")) {
    const list = steps.querySelector("ol");
    if (!list) continue;

    const items = [...list.children];
    if (items.length < 2) continue;

    const fragment = template("tpl-stepper");
    const stepper = fragment.querySelector(".stepper");
    const dots = [...fragment.querySelectorAll(".dot")];
    const prev = fragment.querySelector(".prev");
    const next = fragment.querySelector(".next");
    const counter = fragment.querySelector(".cnt");

    items.forEach((li, i) => (li.dataset.n = String(i + 1).padStart(2, "0")));
    list.classList.add("stepper-ol");

    let index = 0;
    const go = (n) => {
      index = Math.min(items.length - 1, Math.max(0, n));
      items.forEach((li, i) => (li.hidden = i !== index));
      dots.forEach((dot, i) => dot.classList.toggle("on", i <= index));
      if (counter) counter.textContent = `Paso ${index + 1} de ${items.length}`;
      if (prev) prev.disabled = index === 0;
      if (next) next.textContent = index === items.length - 1 ? "Listo" : "Siguiente";
    };

    prev?.addEventListener("click", () => go(index - 1));
    next?.addEventListener("click", () => go(index === items.length - 1 ? 0 : index + 1));

    list.before(stepper); 
    stepper.insertBefore(list, stepper.querySelector(".snav")); 
    go(0);
  }
}
