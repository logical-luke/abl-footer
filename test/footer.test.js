import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SLOT_ORDER, renderFooter } from '../src/index.js';

const BIN = fileURLToPath(new URL('../bin/abl-footer.js', import.meta.url));
const all = { status: '/s', contact: '/c', refund: '/r', terms: '/t', privacy: '/p' };

test('slot order is fixed', () => {
  assert.deepEqual(SLOT_ORDER, ['privacy', 'terms', 'refund', 'contact', 'status']);
  const html = renderFooter({ product: 'X', links: all });
  const hrefs = [...html.matchAll(/<li><a href="([^"]+)"/g)].map((m) => m[1]);
  assert.deepEqual(hrefs, ['/p', '/t', '/r', '/c', '/s']);
  const labels = [...html.matchAll(/<li><a [^>]*>([^<]+)</g)].map((m) => m[1]);
  assert.deepEqual(labels, ['Privacy', 'Terms', 'Refund', 'Contact', 'Status']);
});

test('brand link comes first', () => {
  const html = renderFooter({ product: 'X', links: all });
  assert.ok(html.indexOf('class="made"') < html.indexOf('class="links"'));
  assert.ok(html.includes('<a class="made" href="https://appsbyluke.com">'));
  assert.ok(html.includes('Made by AppsByLuke'));
  assert.ok(html.includes('aria-hidden="true" focusable="false"'));
  assert.ok(html.includes('fill="currentColor"'));
});

test('missing links are omitted', () => {
  const html = renderFooter({ product: 'X', links: { terms: '/t' } });
  assert.equal(html.match(/<li>/g).length, 1);
  assert.ok(!html.includes('Privacy'));
  assert.equal(renderFooter({ product: 'X' }).match(/<li>/g), null);
});

test('labels can be overridden', () => {
  const html = renderFooter({ product: 'X', links: { privacy: '/p' }, labels: { privacy: 'Prywatność' } });
  assert.ok(html.includes('>Prywatność<'));
});

test('values are escaped', () => {
  const html = renderFooter({
    product: '<x>&"',
    links: { privacy: 'javascript:alert("1")', terms: '"><script>1</script>' },
    labels: { privacy: '<b>p</b>' },
  });
  assert.ok(html.includes('&lt;x&gt;&amp;&quot;'));
  assert.ok(html.includes('href="javascript:alert(&quot;1&quot;)"'));
  assert.ok(html.includes('&lt;b&gt;p&lt;/b&gt;'));
  assert.ok(!html.includes('<script'));
  assert.ok(!html.includes('<x>'));
});

test('home mode', () => {
  const html = renderFooter({ product: 'AppsByLuke', home: true });
  assert.ok(html.includes('<a class="made" href="/">'));
  assert.ok(html.includes('</svg>AppsByLuke</a>'));
  assert.ok(!html.includes('Made by'));
  assert.ok(!html.includes('https://appsbyluke.com'));
});

test('year defaults to the current year', () => {
  assert.ok(renderFooter({ product: 'X' }).includes(`© ${new Date().getFullYear()} X`));
  assert.ok(renderFooter({ product: 'X', year: 2030 }).includes('© 2030 X'));
});

test('product is required', () => {
  assert.throws(() => renderFooter({}), /product/);
  assert.throws(() => renderFooter({ product: '' }), /product/);
});

test('no inline styles', () => {
  const html = renderFooter({ product: 'X', links: all });
  assert.ok(!/style\s*=/i.test(html));
  assert.ok(!/<style/i.test(html));
});

test('asset base and structure', () => {
  const html = renderFooter({ product: 'X', assetBase: '/a&b' });
  assert.ok(html.startsWith('<link rel="stylesheet" href="/a&amp;b/font.css"><abl-footer><template shadowrootmode="open"><link rel="stylesheet" href="/a&amp;b/footer.css"><footer class="foot">'));
  assert.ok(html.endsWith('</footer></template></abl-footer>'));
});

test('cli html equals renderFooter', () => {
  const out = execFileSync(
    process.execPath,
    [BIN, 'html', '--product', 'Acme & Co', '--privacy', '/p', '--status', 'https://s.example', '--year', '2031', '--home'],
    { encoding: 'utf8' },
  );
  const expected = renderFooter({
    product: 'Acme & Co',
    links: { privacy: '/p', status: 'https://s.example' },
    year: 2031,
    home: true,
  });
  assert.equal(out, `${expected}\n`);
});

test('cli rejects bad input', () => {
  for (const args of [['html'], ['nope'], [], ['copy'], ['html', '--product', 'X', '--year', 'abc'], ['html', '--product', 'X', '--bogus']]) {
    assert.throws(() => execFileSync(process.execPath, [BIN, ...args], { stdio: 'pipe' }), (e) => e.status === 1);
  }
});

test('cli copy writes the four files', () => {
  const dir = mkdtempSync(join(tmpdir(), 'abl-footer-'));
  try {
    execFileSync(process.execPath, [BIN, 'copy', join(dir, 'public')]);
    for (const name of ['font.css', 'footer.css', 'geist-latin-wght-normal.woff2', 'Geist-OFL.txt']) {
      assert.ok(existsSync(join(dir, 'public', 'abl-footer', name)), name);
    }
  } finally {
    rmSync(dir, { recursive: true });
  }
});

test('the document stylesheet holds only the font and the host element rule', async () => {
  const { readFile } = await import('node:fs/promises');
  const doc = await readFile(new URL('../assets/font.css', import.meta.url), 'utf8');
  const selectors = doc.replace(/@font-face\s*{[^}]*}/g, '').match(/[^{}]+(?={)/g).map((s) => s.trim());
  assert.deepEqual(selectors, ['abl-footer']);
});
