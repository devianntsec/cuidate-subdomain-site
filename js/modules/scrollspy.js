export function initScrollSpy() {
  const links = [...document.querySelectorAll(".navbar .links a")];
  if (!links.length || !("IntersectionObserver" in window)) return;

  const linkById = new Map(links.map((a) => [a.hash.slice(1), a]));
  const sections = [...linkById.keys()]
    .map((id) => document.getElementById(id))
    .filter(Boolean);

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const active = linkById.get(entry.target.id);
        for (const link of links) {
          const on = link === active;
          link.classList.toggle("active", on);
          if (on) link.setAttribute("aria-current", "true");
          else link.removeAttribute("aria-current");
        }
        active?.scrollIntoView({ block: "nearest", inline: "center" });
      }
    },
    { rootMargin: "-30% 0px -60% 0px" },
  );

  for (const section of sections) observer.observe(section);
}
