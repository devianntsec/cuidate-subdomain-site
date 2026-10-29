import { el, template } from "../lib/dom.js";

export function initTabs() {
  document.querySelectorAll(".tabs-src").forEach((grid, gi) => {
    const cards = [...grid.children].filter((c) => c.matches(".card"));
    if (cards.length < 2) return;

    const bar = template("tpl-tabs");
    const tablist = bar.querySelector('[role="tablist"]');

    cards.forEach((card, i) => {
      card.id ||= `tabpanel-${gi + 1}-${i + 1}`;
      card.setAttribute("role", "tabpanel");
      card.setAttribute("aria-labelledby", `tab-${gi + 1}-${i + 1}`);
      card.tabIndex = -1; 

      tablist.append(
        el(
          "button",
          {
            type: "button",
            role: "tab",
            id: `tab-${gi + 1}-${i + 1}`,
            "aria-controls": card.id,
            "aria-selected": i === 0 ? "true" : "false",
            tabindex: i === 0 ? 0 : -1,
            onclick: () => show(i),
            onkeydown: (event) => move(event, i),
          },
          card.querySelector("h3")?.textContent ?? `Panel ${i + 1}`,
        ),
      );
    });

    grid.before(bar);

    function show(active) {
      for (const [i, card] of [...cards].entries()) card.hidden = i !== active;
      for (const [i, tab] of [...tablist.children].entries()) {
        tab.setAttribute("aria-selected", i === active ? "true" : "false");
        tab.tabIndex = i === active ? 0 : -1;
        tab.classList.toggle("on", i === active);
      }
    }

    function move(event, i) {
      const last = cards.length - 1;
      const next =
        event.key === "ArrowRight" ? (i + 1) % cards.length
        : event.key === "ArrowLeft" ? (i - 1 + cards.length) % cards.length
        : event.key === "Home" ? 0
        : event.key === "End" ? last
        : null;
      if (next == null) return;
      event.preventDefault();
      tablist.children[next].focus();
      show(next);
    }

    show(0);
  });
}
