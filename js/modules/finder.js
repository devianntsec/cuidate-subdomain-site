import { normalize, template } from "../lib/dom.js";

export function initFinder() {
  const section = document.getElementById("s7");
  if (!section) return;

  const fragment = template("tpl-finder");
  const search = fragment.querySelector("search");
  const input = fragment.querySelector("input");
  const message = fragment.querySelector(".finder-msg");
  section.querySelector(".key")?.after(fragment);

  const folds = [...section.querySelectorAll("details.fold")].map((fold) => ({
    fold,
    summary: normalize(fold.querySelector("summary")?.textContent ?? ""),
    pairs: [...fold.querySelectorAll(".pair")],
  }));

  input?.addEventListener("input", () => {
    const query = normalize(input.value.trim());
    let shown = 0;

    for (const { fold, summary, pairs } of folds) {
      let matches = 0;
      for (const pair of pairs) {
        const hit = !query || normalize(pair.textContent).includes(query);
        pair.hidden = !hit;
        if (hit) matches++;
      }

      const titleHit = !query || summary.includes(query);
      fold.hidden = !(matches || titleHit);
      if (fold.hidden) continue;

      shown++;
      if (query) fold.open = true;
      if (titleHit && !matches) {
        for (const pair of pairs) pair.hidden = false;
      }
    }

    if (message) {
      message.textContent = !query
        ? ""
        : shown
          ? `Resultados en ${shown} categoría(s).`
          : "Sin resultados. Prueba con otra palabra.";
    }
  });
}
