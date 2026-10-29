export function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [name, value] of Object.entries(attrs)) {
    if (value == null || value === false) continue;
    if (name === "class") node.className = value;
    else if (name === "html") node.innerHTML = value; 
    else if (name === "dataset") Object.assign(node.dataset, value);
    else if (name.startsWith("on") && typeof value === "function") {
      node.addEventListener(name.slice(2).toLowerCase(), value);
    } else node.setAttribute(name, value === true ? "" : String(value));
  }
  for (const child of children.flat()) {
    if (child == null || child === false) continue;
    node.append(child);
  }
  return node;
}

export function template(id) {
  const tpl = document.getElementById(id);
  if (!(tpl instanceof HTMLTemplateElement)) {
    throw new Error(`Template #${id} no encontrado`);
  }
  return tpl.content.cloneNode(true);
}

export const normalize = (s) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
