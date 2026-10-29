import { el } from "../lib/dom.js";

export function initQuiz() {
  for (const quiz of document.querySelectorAll("[data-quiz]")) {
    const items = [...quiz.querySelectorAll(".qi")];
    const score = quiz.querySelector(".quiz-score");

    for (const item of items) {
      const buttons = [...item.querySelectorAll(".qb button")];
      const verdict = item.querySelector(".qw");

      for (const button of buttons) {
        button.addEventListener("click", () => {
          if (item.dataset.done) return;
          item.dataset.done = "1";

          const correct = button.dataset.v === item.dataset.ans;
          item.classList.add(correct ? "ok" : "no");
          for (const b of buttons) {
            b.disabled = true;
            b.classList.toggle("pick", b === button);
            b.classList.toggle("right", b.dataset.v === item.dataset.ans);
          }

          if (verdict) {
            verdict.hidden = false;
            verdict.prepend(el("b", {}, correct ? "Correcto. " : "Casi. "));
          }

          const answered = quiz.querySelectorAll(".qi[data-done]").length;
          if (score && answered === items.length) {
            const right = quiz.querySelectorAll(".qi.ok").length;
            score.textContent = `Resultado: ${right} de ${items.length} correctas.`;
          }
        });
      }
    }
  }
}
