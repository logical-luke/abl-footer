export const SLOT_ORDER = ['privacy', 'terms', 'refund', 'contact', 'status'];

const DEFAULT_LABELS = {
  privacy: 'Privacy',
  terms: 'Terms',
  refund: 'Refund',
  contact: 'Contact',
  status: 'Status',
};

const MARK =
  '<svg class="mark" viewBox="0 0 32 32" aria-hidden="true" focusable="false"><path fill="currentColor" d="M14.95 6 18.55 6 18.55 22.4 28.25 22.4 28.25 26 14.95 26 14.95 13.5 7.95 26 3.75 26Z"/></svg>';

/**
 * @param {unknown} value
 * @returns {string}
 */
function esc(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

/**
 * @param {object} options
 * @param {string} options.product
 * @param {{ privacy?: string, terms?: string, refund?: string, contact?: string, status?: string }} [options.links]
 * @param {number} [options.year]
 * @param {boolean} [options.home]
 * @param {{ privacy?: string, terms?: string, refund?: string, contact?: string, status?: string }} [options.labels]
 * @param {string} [options.assetBase]
 * @returns {string}
 */
export function renderFooter({
  product,
  links = {},
  year = new Date().getFullYear(),
  home = false,
  labels = {},
  assetBase = '/abl-footer',
} = /** @type {any} */ ({})) {
  if (typeof product !== 'string' || product.trim() === '') {
    throw new Error('renderFooter: product is required');
  }
  const css = `${esc(assetBase)}/footer.css`;
  const items = SLOT_ORDER.filter((key) => links[key])
    .map((key) => `<li><a href="${esc(links[key])}">${esc(labels[key] ?? DEFAULT_LABELS[key])}</a></li>`)
    .join('');
  const brand = home
    ? `<a class="made" href="/">${MARK}AppsByLuke</a>`
    : `<a class="made" href="https://appsbyluke.com">${MARK}Made by AppsByLuke</a>`;
  return (
    `<link rel="stylesheet" href="${css}">` +
    `<abl-footer><template shadowrootmode="open"><link rel="stylesheet" href="${css}">` +
    `<footer class="foot">${brand}<ul class="links">${items}</ul>` +
    `<small class="copy">© ${esc(year)} ${esc(product)}</small></footer></template></abl-footer>`
  );
}
