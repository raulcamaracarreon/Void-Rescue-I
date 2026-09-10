import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { pilot } from '../helpers/pilot';

const output = 'docs/screenshots';
const getState = (page: Page) => page.evaluate(() => window.__VOID_RESCUE__!.getState());

test.beforeEach(async ({ page }, info) => {
  await page.addInitScript(() => Object.defineProperty(navigator, 'getGamepads', { configurable: true, value: () => [] }));
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  (page as Page & { combatErrors: string[] }).combatErrors = errors;
  await page.goto(info.project.metadata.backend === 'webgl2' ? '/?backend=webgl2' : '/');
  await page.waitForFunction(() => Boolean(window.__VOID_RESCUE__));
  for (let i = 1; i <= 3; i++) await page.getByRole('combobox', { name: `Inicial ${i}` }).selectOption('A');
  await page.getByRole('button', { name: /INICIAR VUELO/ }).click();
  await mkdir(output, { recursive: true });
});
test.afterEach(async ({ page }) => { expect((page as Page & { combatErrors: string[] }).combatErrors).toEqual([]); });

test('abducción, destrucción del captor, rescate y entrega con teclado', async ({ page }, info) => {
  await page.evaluate(() => window.__VOID_RESCUE__!.loadScenario('abduction-start'));
  await page.waitForFunction(() => window.__VOID_RESCUE__!.getState().colonists[0]!.status === 'captured');
  await page.screenshot({ path: `${output}/${info.project.name}-abduction.png` });
  // Fly toward the lifted victim while firing; bomb only destroys the captor, rescue still uses contact.
  await page.keyboard.down('KeyD');
  await page.waitForFunction(() => window.__VOID_RESCUE__!.getState().player.x > 384);
  await page.keyboard.up('KeyD');
  await page.keyboard.press('ShiftLeft');
  await page.waitForFunction(() => window.__VOID_RESCUE__!.getState().colonists[0]!.status === 'falling');
  await page.keyboard.down('KeyS');
  await page.waitForFunction(() => window.__VOID_RESCUE__!.getState().colonists[0]!.status === 'carried');
  await page.keyboard.up('KeyS');
  await page.screenshot({ path: `${output}/${info.project.name}-rescue.png` });
  await page.keyboard.down('KeyS');
  await page.waitForFunction(() => window.__VOID_RESCUE__!.getState().delivered === 1);
  await page.keyboard.up('KeyS');
  await expect(page.getByRole('heading', { name: 'Oleada completada.' })).toBeVisible();
  const s = await getState(page);
  expect(s.colonists[0]!.status).toBe('safe'); expect(s.portal.ready).toBe(true);
  expect(s.summary?.rescued).toBe(1); expect(s.bombs).toBe(1);
  await page.screenshot({ path: `${output}/${info.project.name}-wave-complete.png` });
});

test('seis escenarios obligatorios, combate real y rendimiento', async ({ page }, info) => {
  for (const name of ['combat-basic', 'abduction-start', 'falling-colonist', 'portal-ready', 'wave-near-complete', 'player-near-death']) {
    await page.evaluate(name => { window.__VOID_RESCUE__!.loadScenario(name, 8042); window.__VOID_RESCUE__!.setPaused(true); }, name);
    expect((await getState(page)).scenario).toBe(name);
  }
  await page.evaluate(() => { window.__VOID_RESCUE__!.loadScenario('combat-basic'); });
  expect((await getState(page)).colonists).toHaveLength(8);
  await page.keyboard.down('KeyD');
  await page.waitForFunction(() => window.__VOID_RESCUE__!.getState().player.x > 411);
  await page.keyboard.up('KeyD');
  await page.waitForFunction(() => window.__VOID_RESCUE__!.getState().frame > 240);
  await page.screenshot({ path: `${output}/${info.project.name}-combat.png` });
  const metrics = await page.evaluate(() => window.__VOID_RESCUE__!.getMetrics());
  expect(metrics.entities.enemies).toBeGreaterThan(0); expect(metrics.drawCalls).toBeLessThan(300);
  await writeFile(`${output}/${info.project.name}-combat-metrics.json`, JSON.stringify(metrics, null, 2));
});

test('oleada principal completa con teclado sin modificar la simulación', async ({ page }, info) => {
  test.setTimeout(200_000);
  const held = new Set<string>();
  let s = await getState(page);
  for (let attempt = 0; attempt < 1800 && s.outcome === 'active'; attempt++) {
    const input = pilot(s);
    const desired = new Set<string>();
    if (input.x > 0) desired.add('KeyD'); else if (input.x < 0) desired.add('KeyA');
    if (input.y > 0) desired.add('KeyW'); else if (input.y < 0) desired.add('KeyS');
    if (input.fire) desired.add('Space');
    if (input.bomb) desired.add('ShiftLeft');
    for (const key of held) if (!desired.has(key)) { await page.keyboard.up(key); held.delete(key); }
    for (const key of desired) if (!held.has(key)) { await page.keyboard.down(key); held.add(key); }
    await page.waitForFunction(frame => window.__VOID_RESCUE__!.getState().frame >= frame + 5 || window.__VOID_RESCUE__!.getState().outcome !== 'active', s.frame);
    s = await getState(page);
  }
  for (const key of held) await page.keyboard.up(key);
  await writeFile(`${output}/${info.project.name}-full-wave.json`, JSON.stringify({ outcome: s.outcome, summary: s.summary,
    kills: s.kills, spawnIndex: s.spawnIndex, totalSpawns: s.schedule.length, lives: s.lives }, null, 2));
  expect(s.outcome).toBe('victory'); expect(s.spawnIndex).toBe(s.schedule.length);
  await expect(page.getByRole('heading', { name: 'Oleada completada.' })).toBeVisible();
  await page.screenshot({ path: `${output}/${info.project.name}-full-wave.png` });
  await page.getByRole('button', { name: 'VER RÉCORDS' }).click();
  const records = page.getByRole('dialog', { name: /Récords de pilotos/ });
  await expect(records.locator('tbody tr')).toHaveCount(1);
  await expect(records.locator('tbody')).toContainText('AAA');
  await page.screenshot({ path: `${output}/${info.project.name}-records.png` });
  await records.locator('button').click();
  await page.getByRole('button', { name: /SIGUIENTE OLEADA/ }).focus();
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => window.__VOID_RESCUE__!.getState().wave === 2);
  const next = await getState(page);
  expect(next.score).toBe(s.score); expect(next.lives).toBe(s.lives);
  expect(next.bombs).toBe(Math.min(3, s.bombs + 1)); expect(next.schedule).toHaveLength(11);
  expect(next.spawnIndex).toBe(0); expect(next.colonists.every(c => c.status === 'ground')).toBe(true);
  await page.waitForFunction(() => window.__VOID_RESCUE__!.getState().spawnIndex === 1);
  await page.screenshot({ path: `${output}/${info.project.name}-wave-two.png` });
  await page.keyboard.press('Escape');
  await page.getByRole('combobox', { name: 'Dificultad', exact: true }).selectOption('relaxed');
  await page.getByRole('button', { name: 'Volver al menú' }).click();
  await page.reload(); await page.waitForFunction(() => Boolean(window.__VOID_RESCUE__));
  await expect(page.getByRole('combobox', { name: 'Inicial 1' })).toHaveValue('A');
  await page.getByRole('button', { name: /VER RÉCORDS/ }).click();
  await expect(records.locator('tbody tr')).toHaveCount(1);
  await expect(records.locator('tbody tr td').nth(3)).toHaveText('2');
  await expect(records.locator('tbody')).toContainText('Relajado');
});

test('siluetas de todas las familias, portal y efectos durante combate', async ({ page }, info) => {
  await page.evaluate(() => window.__VOID_RESCUE__!.loadScenario('combat-showcase'));
  await page.waitForFunction(() => window.__VOID_RESCUE__!.getState().frame >= 8);
  expect(new Set((await getState(page)).enemies.map(e => e.kind)).size).toBe(6);
  await page.screenshot({ path: `${output}/${info.project.name}-enemy-families.png` });
  await page.keyboard.down('Space');
  await page.waitForFunction(() => window.__VOID_RESCUE__!.getState().frame > 240);
  await page.keyboard.up('Space');
  const metrics = await page.evaluate(() => window.__VOID_RESCUE__!.getMetrics());
  expect(metrics.drawCalls).toBeLessThan(300);
  await writeFile(`${output}/${info.project.name}-showcase-metrics.json`, JSON.stringify(metrics, null, 2));
  await page.screenshot({ path: `${output}/${info.project.name}-effects.png` });
});

test('el cañón cierra la oleada, reaparición y derrota tienen estados distintos', async ({ page }) => {
  await page.evaluate(() => window.__VOID_RESCUE__!.loadScenario('wave-near-complete'));
  await page.keyboard.down('Space');
  await expect(page.getByRole('heading', { name: 'Oleada completada.' })).toBeVisible();
  await page.keyboard.up('Space');
  expect((await getState(page)).kills).toBe(1);
  await page.evaluate(() => window.__VOID_RESCUE__!.loadScenario('player-near-death'));
  await page.waitForFunction(() => !window.__VOID_RESCUE__!.getState().player.alive);
  expect((await getState(page)).lives).toBe(1);
  await page.waitForFunction(() => window.__VOID_RESCUE__!.getState().player.alive);
  expect((await getState(page)).player.invulnerable).toBeGreaterThan(0);
  await page.evaluate(() => window.__VOID_RESCUE__!.loadScenario('last-life'));
  await expect(page.getByRole('heading', { name: 'Misión terminada.' })).toBeVisible();
  expect((await getState(page)).lives).toBe(0);
});

async function pad(page: Page, button: number | null, x = 0, y = 0): Promise<void> {
  await page.evaluate(({ button, x, y }) => {
    const p = navigator.getGamepads()[0]!;
    for (let i = 0; i < p.buttons.length; i++) (p.buttons[i] as { pressed: boolean }).pressed = i === button;
    (p.axes as number[])[0] = x; (p.axes as number[])[1] = y;
  }, { button, x, y });
  await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
}

test('joypad navega opciones, ajusta volumen, usa bomba/portal y vuelve desde resumen', async ({ page }) => {
  await page.evaluate(() => {
    const p = { axes: [0, 0], buttons: Array.from({ length: 16 }, () => ({ pressed: false, touched: false, value: 0 })), connected: true, mapping: 'standard', id: 'Emulated joypad', index: 0, timestamp: 0 };
    Object.defineProperty(navigator, 'getGamepads', { configurable: true, value: () => [p] });
  });
  await pad(page, 9); await pad(page, null);
  await expect(page.getByRole('dialog', { name: /Vuelo en pausa/ })).toBeVisible();
  await pad(page, null, 1, 0); await pad(page, null);
  expect((await getState(page)).preferences.volume).toBe(0.5);
  await pad(page, null, 0, 1); await pad(page, null); // mute
  await pad(page, 0); await pad(page, null);
  expect((await getState(page)).preferences.muted).toBe(true);
  await pad(page, null, 0, 1); await pad(page, null); // reduced motion
  await pad(page, 0); await pad(page, null);
  expect((await getState(page)).preferences.reducedMotion).toBe(true);
  await pad(page, 1); await pad(page, null);
  expect((await getState(page)).mode).toBe('playing');
  await pad(page, 2); await pad(page, null);
  await expect.poll(async () => (await getState(page)).bombs).toBe(1);
  await page.evaluate(() => window.__VOID_RESCUE__!.loadScenario('portal-ready'));
  await pad(page, 3); await pad(page, null);
  await expect.poll(async () => (await getState(page)).portal.used).toBe(true);
  expect((await getState(page)).outcome).toBe('active');
  await page.evaluate(() => window.__VOID_RESCUE__!.loadScenario('wave-near-complete'));
  await pad(page, 0);
  await expect(page.getByRole('heading', { name: 'Oleada completada.' })).toBeVisible();
  await pad(page, null); await pad(page, 1); await pad(page, null);
  expect((await getState(page)).mode).toBe('title');
  await pad(page, 0); await pad(page, null);
  expect((await getState(page)).mode).toBe('playing');
  await page.evaluate(() => Object.defineProperty(navigator, 'getGamepads', { configurable: true, value: () => [] }));
  await expect.poll(async () => (await getState(page)).mode).toBe('paused');
  await expect(page.getByText(/Joypad desconectado/)).toBeVisible();
});
