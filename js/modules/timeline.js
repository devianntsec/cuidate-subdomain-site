import { template } from "../lib/dom.js";

const VISIBLE = 4;

export function initTimeline() {
  for (const timeline of document.querySelectorAll(".timeline")) {
    const rows = [...timeline.querySelectorAll(".tl")];
    if (rows.length <= VISIBLE + 1) continue; 

    const rest = rows.slice(VISIBLE);
    for (const row of rest) row.hidden = true;

    const fragment = template("tpl-more");
    const button = fragment.querySelector("button");
    const label = () => {
      button.textContent = rows[VISIBLE].hidden
        ? `Ver los otros ${rest.length} casos`
        : "Ocultar";
    };

    button.addEventListener("click", () => {
      const expand = rows[VISIBLE].hidden;
      for (const row of rest) row.hidden = !expand;
      label();
    });

    label();
    timeline.after(fragment);
  }
}
