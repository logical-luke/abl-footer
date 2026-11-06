#!/usr/bin/env node
import { parseArgs } from 'node:util';
import { copyFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SLOT_ORDER, renderFooter } from '../src/index.js';

const ASSETS = ['footer.css', 'geist-latin-wght-normal.woff2', 'Geist-OFL.txt'];
const USAGE = `Usage:
  abl-footer copy <publicDir>
  abl-footer html --product <name> [--privacy url] [--terms url] [--refund url] [--contact url] [--status url] [--year n] [--home]`;

/**
 * @param {string} message
 * @returns {never}
 */
function fail(message) {
  process.stderr.write(`abl-footer: ${message}\n${USAGE}\n`);
  process.exit(1);
}

const [command, ...rest] = process.argv.slice(2);

try {
  if (command === 'copy') {
    const { positionals } = parseArgs({ args: rest, allowPositionals: true });
    if (positionals.length !== 1) fail('copy needs exactly one <publicDir>');
    const target = join(positionals[0], 'abl-footer');
    mkdirSync(target, { recursive: true });
    for (const name of ASSETS) {
      copyFileSync(fileURLToPath(new URL(`../assets/${name}`, import.meta.url)), join(target, name));
    }
  } else if (command === 'html') {
    const { values } = parseArgs({
      args: rest,
      options: {
        product: { type: 'string' },
        year: { type: 'string' },
        home: { type: 'boolean' },
        ...Object.fromEntries(SLOT_ORDER.map((key) => [key, { type: 'string' }])),
      },
    });
    if (!values.product) fail('--product is required');
    const options = /** @type {Parameters<typeof renderFooter>[0]} */ ({
      product: values.product,
      links: Object.fromEntries(SLOT_ORDER.filter((key) => values[key]).map((key) => [key, values[key]])),
      home: Boolean(values.home),
    });
    if (values.year !== undefined) {
      if (!/^\d{4}$/.test(values.year)) fail('--year must be a four digit number');
      options.year = Number(values.year);
    }
    process.stdout.write(`${renderFooter(options)}\n`);
  } else {
    fail(command ? `unknown command "${command}"` : 'missing command');
  }
} catch (error) {
  fail(error instanceof Error ? error.message : String(error));
}
