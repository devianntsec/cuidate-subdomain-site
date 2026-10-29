import { template } from "../lib/dom.js";
import { loadJSON, saveJSON } from "../lib/storage.js";

const KEY = "cuidate:checklist:v1";

export function initChecklist() {
  const boxes = [...document.querySelectorAll('.chk input[type="checkbox"]')];
  if (!boxes.length) return;

  
  const bars = new Map();
  for (const section of new Set(boxes.map((b) => b.closest(".sec")))) {
    if (!section) continue;
    section.querySelector(".sec-head")?.after(template("tpl-progress"));
    const bar = section.querySelector(".prog");
    if (bar) bars.set(section, bar);
  }

  const update = () => {
    for (const [section, bar] of bars) {
      const own = boxes.filter((b) => section.contains(b));
      const done = own.filter((b) => b.checked).length;
      bar.querySelector("span").textContent =
        `${done} de ${own.length}${done === own.length ? " · listo" : " hechos"}`;
      bar.querySelector("b").style.width = `${(100 * done) / own.length}%`;
    }
    saveJSON(KEY, boxes.flatMap((b, i) => (b.checked ? [i] : [])));
  };

  const saved = new Set(loadJSON(KEY, []));
  boxes.forEach((box, i) => {
    box.checked = saved.has(i);
    box.addEventListener("change", update);
  });
  update();
}
