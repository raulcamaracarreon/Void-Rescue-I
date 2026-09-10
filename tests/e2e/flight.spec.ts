import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';

const output = 'docs/screenshots';

async function state(page: Page) { return page.evaluate(() => window.__VOID_RESCUE__!.getState()); }

test.beforeEach(async ({ page }, info) => {
  await page.addInitScript(() => Object.defineProperty(navigator, 'getGamepads', { configurable: true, value: () => [] }));
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('crash', () => errors.push('Chromium page crashed'));
  await page.goto(info.project.metadata.backend === 'webgl2' ? '/?backend=webgl2' : '/');
  await page.waitForFunction(() => Boolean(window.__VOID_RESCUE__));
  (page as Page & { flightErrors: string[] }).flightErrors = errors;
});

test.afterEach(async ({ page }) => {
  expect((page as Page & { flightErrors: string[] }).flightErrors ?? []).toEqual([]);
});

test('inicio explícito, vuelo real, disparo y métricas a 1080p', async ({ page }, info) => {
  await mkdir(output, { recursive: true });
  await expect(page.getByRole('heading', { name: /VOID/ })).toBeVisible();
  expect((await state(page)).mode).toBe('title');
  expect((await state(page)).audio.initialized).toBe(false);
  await page.screenshot({ path: `${output}/${info.project.name}-title.png` });
  // Activate a native focused control with the keyboard, then operate real flight keys.
  await page.getByRole('button', { name: /INICIAR VUELO/ }).focus();
  await page.keyboard.press('Enter');
  await expect.poll(async () => (await state(page)).mode).toBe('playing');
  const start = await state(page);
  await page.keyboard.down('KeyD');
  await expect.poll(async () => (await state(page)).player.x).toBeGreaterThan(start.player.x + 10);
  await page.keyboard.down('KeyW');
  await page.keyboard.down('Space');
  await expect.poll(async () => (await state(page)).shotsFired).toBeGreaterThan(3);
  await page.keyboard.up('KeyW');
  await page.keyboard.up('Space');
  await page.keyboard.up('KeyD');
  const moved = await state(page);
  expect(moved.player.y).toBeGreaterThan(start.player.y + 5);
  expect(moved.player.vx).toBeGreaterThan(0);
  expect(moved.audio.initialized).toBe(true);
  await page.keyboard.down('KeyA');
  await expect.poll(async () => (await state(page)).player.facing).toBe(-1);
  await page.keyboard.down('Space');
  await expect.poll(async () => (await state(page)).shots.some(shot => shot.vx < 0)).toBe(true);
  await page.keyboard.up('Space');
  await page.keyboard.up('KeyA');
  await page.waitForFunction(() => window.__VOID_RESCUE__!.getState().frame >= 240);
  const metrics = await page.evaluate(() => window.__VOID_RESCUE__!.getMetrics());
  expect(metrics.width).toBe(1920); expect(metrics.height).toBe(1080);
  expect(metrics.drawCalls).toBeGreaterThan(0); expect(metrics.drawCalls).toBeLessThan(300);
  expect(metrics.triangles).toBeGreaterThan(0);
  if (info.project.metadata.backend === 'webgl2') expect(metrics.backend).toBe('webgl2');
  await writeFile(`${output}/${info.project.name}-metrics.json`, JSON.stringify(metrics, null, 2));
  await page.screenshot({ path: `${output}/${info.project.name}-flight.png` });
});

test('pausa real, preferencias, reinicio y regreso al menú', async ({ page }) => {
  await page.getByRole('button', { name: /INICIAR VUELO/ }).click();
  await page.keyboard.down('KeyD');
  await expect.poll(async () => (await state(page)).player.vx).toBeGreaterThan(20);
  await page.keyboard.up('KeyD');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toBeVisible();
  const paused = await state(page);
  await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
  expect((await state(page)).frame).toBe(paused.frame);
  await page.getByRole('checkbox', { name: 'Silenciar audio', exact: true }).check();
  await page.getByLabel('Reducir movimiento y destellos').check();
  await page.getByLabel('Volumen', { exact: true }).fill('25');
  expect((await state(page)).preferences).toMatchObject({ muted: true, volume: 0.25, reducedMotion: true });
  await page.getByRole('button', { name: /CONTINUAR VUELO/ }).click();
  await expect.poll(async () => (await state(page)).frame).toBeGreaterThan(paused.frame);
  await page.keyboard.press('KeyR');
  await expect.poll(async () => (await state(page)).distance).toBe(0);
  expect((await state(page)).player.x).toBe(360);
  expect((await state(page)).audio.muted).toBe(true);
  await page.keyboard.press('KeyM');
  await expect.poll(async () => (await state(page)).audio.muted).toBe(false);
  await page.keyboard.press('KeyM');
  await expect.poll(async () => (await state(page)).audio.muted).toBe(true);
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Volver al menú' }).click();
  await expect(page.getByRole('heading', { name: /VOID/ })).toBeVisible();
  await page.reload();
  await page.waitForFunction(() => Boolean(window.__VOID_RESCUE__));
  expect((await state(page)).preferences).toMatchObject({ muted: true, volume: 0.25, reducedMotion: true });
});

test('costura circular con controles reales y radar dividido', async ({ page }, info) => {
  await page.evaluate(() => window.__VOID_RESCUE__!.loadScenario('world-seam', 8042));
  expect((await state(page)).camera.radarSegments).toHaveLength(2);
  await page.locator('#game').focus();
  const before = await state(page);
  await page.keyboard.down('KeyD');
  await expect.poll(async () => (await state(page)).laps).toBe(1);
  await page.keyboard.up('KeyD');
  const after = await state(page);
  expect(after.player.x).toBeLessThan(35);
  // The ship now moves to the first quarter of the view while facing right;
  // continuity through the seam matters, not the former centered offset.
  expect(Math.abs(after.camera.x - before.camera.x)).toBeLessThan(85);
  expect(after.camera.radarSegments).toHaveLength(2);
  await page.screenshot({ path: `${output}/${info.project.name}-seam.png` });
});

test('diagnóstico determinista, errores explícitos y pausa al perder foco', async ({ page }) => {
  await page.evaluate(() => {
    const api = window.__VOID_RESCUE__!;
    api.loadScenario('flight-basic', 19);
    api.setPaused(true);
    api.step(60);
  });
  expect((await state(page)).frame).toBe(60);
  expect((await state(page)).time).toBe(1);
  const snapshot = await state(page);
  await page.evaluate(() => {
    const api = window.__VOID_RESCUE__!;
    api.loadScenario('flight-basic', 19); api.setPaused(true); api.step(60);
  });
  expect((await state(page)).player).toEqual(snapshot.player);
  expect(await page.evaluate(() => {
    try { window.__VOID_RESCUE__!.loadScenario('unknown-scenario'); return ''; }
    catch (error) { return (error as Error).message; }
  })).toContain('no implementado');
  await page.getByRole('button', { name: /CONTINUAR VUELO/ }).click();
  await page.keyboard.down('KeyD');
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  expect((await state(page)).mode).toBe('paused');
  await page.keyboard.up('KeyD');
});

test('presentación a 720p y ventana cuadrada sin desbordamiento', async ({ page }, info) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.getByRole('button', { name: /INICIAR VUELO/ }).click();
  await expect.poll(async () => page.evaluate(() => window.__VOID_RESCUE__!.getMetrics().width)).toBe(1280);
  await page.screenshot({ path: `${output}/${info.project.name}-720p.png` });
  await page.setViewportSize({ width: 1000, height: 1000 });
  await expect.poll(async () => page.evaluate(() => window.__VOID_RESCUE__!.getMetrics().height)).toBe(563);
  const rect = await page.locator('#game').boundingBox();
  expect(rect?.width).toBe(1000);
  expect(rect?.height).toBeCloseTo(562.5, 0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
});

test('mando emulado recorre InputManager, pausa y desconecta sin entrada residual', async ({ page }) => {
  // This verifies browser integration; it is explicitly not a physical gamepad test.
  await page.evaluate(() => {
    const pad = {
      axes: [0, 0], buttons: Array.from({ length: 16 }, () => ({ pressed: false, touched: false, value: 0 })),
      connected: true, mapping: 'standard', id: 'VOID RESCUE test gamepad', index: 0, timestamp: 0,
    };
    Object.defineProperty(navigator, 'getGamepads', { configurable: true, value: () => [pad] });
    pad.buttons[9]!.pressed = true;
  });
  await expect.poll(async () => (await state(page)).mode).toBe('playing');
  await page.evaluate(() => {
    const pad = navigator.getGamepads()[0]!;
    (pad.buttons[9] as { pressed: boolean }).pressed = false;
    (pad.axes as number[])[0] = 1;
    (pad.buttons[0] as { pressed: boolean }).pressed = true;
  });
  await expect.poll(async () => (await state(page)).shotsFired).toBeGreaterThan(2);
  expect((await state(page)).player.vx).toBeGreaterThan(0);
  await page.evaluate(() => { (navigator.getGamepads()[0]!.buttons[9] as { pressed: boolean }).pressed = true; });
  await expect.poll(async () => (await state(page)).mode).toBe('paused');
  await page.evaluate(() => Object.defineProperty(navigator, 'getGamepads', { configurable: true, value: () => [] }));
  await page.getByRole('button', { name: /CONTINUAR VUELO/ }).click();
  const shots = (await state(page)).shotsFired;
  await expect.poll(async () => (await state(page)).player.thrust).toBe(0);
  expect((await state(page)).shotsFired).toBe(shots);
});
