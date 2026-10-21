import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { transformWithOxc } from 'vite';

const source = await readFile(new URL('../src/api/client.ts', import.meta.url), 'utf8');
const { code } = await transformWithOxc(source, 'src/api/client.ts');
const loadClient = suffix => import(`data:text/javascript;base64,${Buffer.from(code + suffix).toString('base64')}`);
let checks = 0;
const check = (description, fn) => { fn(); checks++; console.log(`[PASS] ${description}`); };
globalThis.window = {
  qrStudioData: { isWp: true, isAdmin: true, siteUrl: 'https://example.org/site/', restUrl: 'https://example.org/site/wp-json/qr-studio/v1/', nonce: 'test-nonce' },
};
let lastRequest;
let response;
globalThis.fetch = async (url, options) => { lastRequest = { url, options }; return response; };
const jsonResponse = (value, status = 200) => new Response(JSON.stringify(value), { status });
const wp = await loadClient('// wordpress');
response = jsonResponse({ success: true, data: [{ id: '12', slug: 'saved-link', scans_count: '7', is_active: '0' }] });
const list = await wp.api.getCodes();
check('WordPress IDs and counters become numbers', () => { assert.equal(list[0].id, 12); assert.equal(list[0].scans_count, 7); });
check('Paused database values remain false in the UI', () => assert.equal(list[0].is_active, false));
check('Authenticated request includes the WordPress nonce', () => assert.equal(lastRequest.options.headers['X-WP-Nonce'], 'test-nonce'));
check('Short URLs preserve subdirectory installations', () => assert.equal(wp.buildShortUrl('menu'), 'https://example.org/site/q/menu'));
response = jsonResponse({ success: true, data: { id: 12, slug: 'new-link', scans_count: 7, is_active: true } });
const saved = await wp.api.saveCode({ id: 12, slug: 'new-link', target_url: 'https://example.org/menu' });
check('Renames send the original ID and requested link', () => {
  assert.equal(saved.id, 12);
  assert.equal(lastRequest.options.method, 'POST');
  assert.equal(JSON.parse(lastRequest.options.body).slug, 'new-link');
});
for (const [status, message, operation] of [
  [409, 'This QR Code Link is already in use.', () => wp.api.saveCode({ slug: 'taken' })],
  [500, 'Could not save this QR code.', () => wp.api.saveCode({ slug: 'failed' })],
  [403, 'Your session expired.', () => wp.api.getCodes()],
  [403, 'Deletion denied.', () => wp.api.deleteCode(12)],
]) {
  response = jsonResponse({ message }, status);
  await assert.rejects(operation, { message });
  checks++; console.log(`[PASS] HTTP ${status} is surfaced: ${message}`);
}
response = jsonResponse({ success: true });
check('Simulation is absent from the production API', () => assert.equal(wp.api.simulateScan, undefined));
assert.equal(await wp.api.deleteCode(12), true);
check('Deletion uses the correct authenticated endpoint', () => {
  assert.equal(lastRequest.url, 'https://example.org/site/wp-json/qr-studio/v1/codes/12');
  assert.equal(lastRequest.options.method, 'DELETE');
});

const storage = new Map();
globalThis.localStorage = { getItem: key => storage.get(key) || null, setItem: (key, value) => storage.set(key, value) };
globalThis.window = { location: { origin: 'http://localhost:5173' } };
const local = await loadClient('// standalone');
const first = await local.api.saveCode({ slug: 'local-menu', target_url: 'https://example.org/menu', style_config: { encodeMode: 'direct' } });
const renamed = await local.api.saveCode({ ...first, slug: 'new-menu' });
check('Development renames update the saved URL and retain mode', () => {
  assert.equal(renamed.short_url, 'http://localhost:5173/q/new-menu');
  assert.equal(renamed.style_config.encodeMode, 'direct');
});
await assert.rejects(() => local.api.saveCode({ slug: 'NEW-MENU' }), /already in use/);
checks++; console.log('[PASS] Development collisions match server behavior');
await assert.rejects(() => local.api.saveCode({ slug: 'bad link' }), /1–64/);
checks++; console.log('[PASS] Development invalid links are rejected');
console.log(`API checks: ${checks} passed`);
