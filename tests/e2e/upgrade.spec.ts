import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';

test.beforeEach(async ({ page }, info) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  (page as Page & { errors: string[] }).errors = errors;
  await page.addInitScript(() => {
    const p = { axes: [0, 0, 0, 0, 0, 0, 0, 0, 0, 3.2857], buttons: Array.from({ length: 12 }, () => ({ pressed: false, value: 0 })), mapping: '', connected: true, id: 'USB Joystick test 0079:0006', index: 1 };
    Object.defineProperty(navigator, 'getGamepads', { configurable: true, value: () => [null, p] });
  });
  await page.goto(info.project.metadata.backend === 'webgl2' ? '/?backend=webgl2' : '/');
  await page.waitForFunction(() => Boolean(window.__VOID_RESCUE__));
  await mkdir('docs/screenshots', { recursive: true });
});
test.afterEach(async ({ page }) => expect((page as Page & { errors: string[] }).errors).toEqual([]));

async function input(page: Page, button = -1, x = 0, y = 0) {
  await page.evaluate(({ button, x, y }) => {
    const p = navigator.getGamepads()[1]!;
    (p.axes as number[])[0] = x; (p.axes as number[])[1] = y;
    for (let i = 0; i < p.buttons.length; i++) (p.buttons[i] as { pressed: boolean }).pressed = i === button;
  }, { button, x, y });
  await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
}

test('USB original, calibración completa, guardado y vuelo con botones asignados', async ({ page }, info) => {
  await expect(page.locator('.title-screen .controller-status')).toContainText('USB DETECTADO');
  await page.getByRole('button', { name: /CONFIGURAR MANDO USB/ }).click();
  await input(page, 4);
  await expect(page.locator('#controller-activity')).toContainText('Botón 5');
  await input(page);
  await page.getByRole('button', { name: 'CALIBRAR DIRECCIONES Y BOTONES' }).click();
  const signals = [[-1, -1, 0], [-1, 1, 0], [-1, 0, -1], [-1, 0, 1], [3, 0, 0], [2, 0, 0], [1, 0, 0], [9, 0, 0], [8, 0, 0]];
  for (let step = 0; step < signals.length; step++) {
    await expect(page.locator('#controller-instruction')).toContainText(`${step + 1} / 9`);
    const signal = signals[step]!; await input(page, signal[0]!, signal[1]!, signal[2]!); await input(page);
  }
  await expect(page.locator('#controller-instruction')).toContainText('Perfil guardado');
  await page.screenshot({ path: `docs/screenshots/${info.project.name}-usb-calibrated.png` });
  await page.getByRole('button', { name: 'LISTO / VOLVER' }).click();
  await page.reload(); await page.waitForFunction(() => Boolean(window.__VOID_RESCUE__));
  expect(await page.evaluate(() => window.__VOID_RESCUE__!.getMetrics().controller.calibrated)).toBe(true);
  await input(page, 9); await input(page); // Start using physical-style input.
  await expect.poll(() => page.evaluate(() => window.__VOID_RESCUE__!.getState().mode)).toBe('playing');
  await input(page, 3, 1);
  await page.waitForFunction(() => window.__VOID_RESCUE__!.getState().shotsFired > 3);
  const s = await page.evaluate(() => window.__VOID_RESCUE__!.getState());
  expect(s.player.x).toBeGreaterThan(365);
  await input(page); await input(page, 9); await input(page);
  await expect(page.getByRole('heading', { name: 'Vuelo en pausa.' })).toBeVisible();
});

test('dificultad cambia velocidad real, persiste y se ajusta en pausa con mando', async ({ page }) => {
  await page.getByRole('combobox', { name: 'Dificultad', exact: true }).selectOption('expert');
  await page.getByRole('button', { name: /INICIAR VUELO/ }).click();
  await page.waitForFunction(() => window.__VOID_RESCUE__!.getState().frame > 90);
  const sample = () => page.evaluate(async () => {
    const start = performance.now(), frame = window.__VOID_RESCUE__!.getState().frame;
    await new Promise(resolve => setTimeout(resolve, 750));
    return (window.__VOID_RESCUE__!.getState().frame - frame) / ((performance.now() - start) / 1000);
  });
  expect(await sample()).toBeGreaterThan(80);
  await page.keyboard.press('Escape');
  await page.getByRole('combobox', { name: 'Dificultad', exact: true }).focus();
  await input(page, -1, -1); await input(page);
  expect(await page.getByRole('combobox', { name: 'Dificultad', exact: true }).inputValue()).toBe('hard');
  await page.getByRole('combobox', { name: 'Dificultad', exact: true }).selectOption('relaxed');
  await page.getByRole('button', { name: /CONTINUAR VUELO/ }).click();
  const slow = await sample(); expect(slow).toBeGreaterThan(40); expect(slow).toBeLessThan(55);
  await page.reload(); await page.waitForFunction(() => Boolean(window.__VOID_RESCUE__));
  await expect(page.getByRole('combobox', { name: 'Dificultad', exact: true })).toHaveValue('relaxed');
});

test('bomba y destrucción propia producen partículas con opción de reducción', async ({ page }, info) => {
  await page.getByRole('button', { name: /INICIAR VUELO/ }).click();
  await page.evaluate(() => window.__VOID_RESCUE__!.loadScenario('combat-showcase'));
  await page.keyboard.press('ShiftLeft');
  await page.waitForFunction(() => window.__VOID_RESCUE__!.getState().events.some(e => e.kind === 'bomb'));
  await page.screenshot({ path: `docs/screenshots/${info.project.name}-explosion-upgrade.png` });
  const metrics = await page.evaluate(() => window.__VOID_RESCUE__!.getMetrics());
  expect(metrics.entities.particles).toBeGreaterThan(120); expect(metrics.drawCalls).toBeLessThan(300);
  await writeFile(`docs/screenshots/${info.project.name}-explosion-metrics.json`, JSON.stringify(metrics, null, 2));
  await page.waitForTimeout(1500);
  const expanding = await page.evaluate(() => window.__VOID_RESCUE__!.getMetrics());
  expect(expanding.entities.particles).toBeGreaterThan(100);
  await page.screenshot({ path: `docs/screenshots/${info.project.name}-explosion-expansion.png` });
  await page.evaluate(() => window.__VOID_RESCUE__!.loadScenario('player-near-death'));
  await page.waitForFunction(() => !window.__VOID_RESCUE__!.getState().player.alive);
  await page.screenshot({ path: `docs/screenshots/${info.project.name}-player-explosion.png` });
  await page.keyboard.press('Escape');
  await page.getByLabel('Reducir movimiento y destellos').check();
  await page.evaluate(() => window.__VOID_RESCUE__!.loadScenario('combat-showcase'));
  await page.keyboard.press('ShiftLeft');
  await page.waitForFunction(() => window.__VOID_RESCUE__!.getState().events.some(e => e.kind === 'bomb'));
  const reduced = await page.evaluate(() => window.__VOID_RESCUE__!.getMetrics());
  expect(reduced.entities.particles).toBeLessThan(metrics.entities.particles / 2);
});

test('mezcla de audio offline: señal estéreo finita con picos acotados', async ({ page }, info) => {
  const result = await page.evaluate(async () => {
    const path = '/src/audio/CombatSound.ts';
    const { CombatSound, masterBus } = await import(path);
    const context = new OfflineAudioContext(2, 48000 * 3, 48000);
    const bus = masterBus(context, context.destination), synth = new CombatSound(context, bus);
    for (let i = 0; i < 10; i++) synth.play(i % 3 ? 'explosion' : 'bomb', i % 2 ? -0.7 : 0.7, i, () => {}, 0.1 + i * 0.04);
    for (let i = 0; i < 6; i++) synth.play('shot', 0, i, () => {}, 0.6 + i * 0.09);
    const buffer = await context.startRendering(); let peak = 0, sum = 0, finite = true;
    for (let channel = 0; channel < 2; channel++) for (const v of buffer.getChannelData(channel)) { peak = Math.max(peak, Math.abs(v)); sum += v * v; finite &&= Number.isFinite(v); }
    return { peak, rms: Math.sqrt(sum / (buffer.length * 2)), finite, sampleRate: buffer.sampleRate, channels: buffer.numberOfChannels };
  });
  expect(result.finite).toBe(true); expect(result.peak).toBeLessThan(1); expect(result.rms).toBeGreaterThan(0.005);
  await writeFile(`docs/screenshots/${info.project.name}-audio-mix.json`, JSON.stringify(result, null, 2));
});
