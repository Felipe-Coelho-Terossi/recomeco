/* Ícones em SVG inline (traço), herdam a cor do texto. */
const P = {
  hoje: '<path d="M5 3v7a3 3 0 0 0 3 3v8"/><path d="M8 3v7"/><path d="M11 3v7a3 3 0 0 1-3 3"/><path d="M18 3c-2.2 1.6-3.2 4.2-3.2 7.5h3.2V21"/>',
  semana: '<rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  compras: '<path d="M3 4h2.2l2.3 11h10.3L20.2 8H6.3"/><circle cx="9.2" cy="19" r="1.3"/><circle cx="17" cy="19" r="1.3"/>',
  evol: '<path d="M3 17l6-6 4 4 8-9"/><path d="M15 6h6v6"/>',
  treino: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3v18"/><path d="M5.6 5.6c3 3 3 9.8 0 12.8M18.4 5.6c-3 3-3 9.8 0 12.8"/>',
  ajustes: '<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>',
  prev: '<path d="M14.5 5.5L8 12l6.5 6.5"/>',
  next: '<path d="M9.5 5.5L16 12l-6.5 6.5"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  swap: '<path d="M4 8h13l-3-3M20 16H7l3 3"/>',
  book: '<path d="M5 4.5h8a3 3 0 0 1 3 3V20a2.5 2.5 0 0 0-2.5-2.5H5z"/><path d="M16 7.5h3v12h-5"/>',
  chevron: '<path d="M6 9.5l6 6 6-6"/>',
  trash: '<path d="M5 7h14M10 7V4.5h4V7M7 7l.8 12.5h8.4L17 7"/>',
  download: '<path d="M12 4v11M7.5 10.5L12 15l4.5-4.5M5 19.5h14"/>',
  upload: '<path d="M12 15V4M7.5 8.5L12 4l4.5 4.5M5 19.5h14"/>',
  car: '<path d="M4 15v-3l2-5h12l2 5v3zM4 15v3M20 15v3"/><circle cx="7.5" cy="13.5" r=".8"/><circle cx="16.5" cy="13.5" r=".8"/>',
  out: '<path d="M7 3v8M10 3v8M7 7h3M8.5 11v10M17 3c-2 1.5-3 4-3 7h3v11"/>'
};
export function icon(name, size) {
  const s = size || 24;
  return '<svg class="ic" width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + (P[name] || '') + '</svg>';
}
