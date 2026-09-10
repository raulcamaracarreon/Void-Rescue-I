import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

async function pad(page: Page, button: number | null, x = 0, y = 0) {
  await page.evaluate(({ button, x, y }) => {
    const p = navigator.getGamepads()[0]!;
    p.buttons.forEach((b, i) => { (b as { pressed: boolean }).pressed = i === button; });
    (p.axes as number[])[0] = x; (p.axes as number[])[1] = y;
  }, { button, x, y });
  await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
}
async function tap(page: Page, button: number | null, x = 0, y = 0) { await pad(page, button, x, y); await pad(page, null); }

test('joypad elige iniciales, consulta récords y continúa oleada; diagnóstico no puntúa', async ({ page }, info) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.addInitScript(() => {
    const p = { axes: [0, 0], buttons: Array.from({ length: 16 }, () => ({ pressed: false, touched: false, value: 0 })), connected: true, mapping: 'standard', id: 'Endless test joypad', index: 0, timestamp: 0 };
    Object.defineProperty(navigator, 'getGamepads', { configurable: true, value: () => [p] });
  });
  await page.goto(info.project.metadata.backend === 'webgl2' ? '/?backend=webgl2' : '/');
  await page.waitForFunction(() => Boolean(window.__VOID_RESCUE__));
  await tap(page, null, 0, -1); // Start -> records
  await tap(page, null, 0, -1); // Third initial
  await tap(page, null, 1); await expect(page.getByRole('combobox', { name: 'Inicial 3' })).toHaveValue('2');
  await tap(page, null, 0, -1); await tap(page, null, 1);
  await tap(page, null, 0, -1); await tap(page, null, 1);
  await expect(page.getByRole('combobox', { name: 'Inicial 1' })).toHaveValue('W');
  await expect(page.getByRole('combobox', { name: 'Inicial 2' })).toHaveValue('S');
  await page.setViewportSize({ width: 1280, height: 720 });
  await mkdir('docs/screenshots', { recursive: true });
  await page.screenshot({ path: `docs/screenshots/${info.project.name}-endless-title-720p.png` });
  const note = await page.locator('.gamepad-note').boundingBox(), footer = await page.locator('.title-footer').boundingBox();
  expect(note!.y + note!.height).toBeLessThan(footer!.y);
  for (let i = 0; i < 3; i++) await tap(page, null, 0, 1);
  await tap(page, 0);
  await expect(page.getByRole('dialog', { name: /Récords de pilotos/ })).toBeVisible();
  await tap(page, 1);
  await tap(page, null, 0, 1); await tap(page, 0);
  await page.waitForFunction(() => window.__VOID_RESCUE__!.getState().mode === 'playing');
  await page.evaluate(() => window.__VOID_RESCUE__!.loadScenario('wave-near-complete'));
  await pad(page, 0);
  await expect(page.getByRole('heading', { name: 'Oleada completada.' })).toBeVisible();
  await pad(page, null);
  await expect(page.locator('#record-status')).toContainText('no registra récords');
  expect(await page.evaluate(() => localStorage.getItem('void-rescue.records.v1'))).toBeNull();
  await tap(page, 0); // Confirm advances instead of resetting to wave one.
  await page.waitForFunction(() => window.__VOID_RESCUE__!.getState().wave === 2);
  await page.evaluate(() => window.__VOID_RESCUE__!.loadScenario('last-life'));
  await expect(page.getByRole('heading', { name: 'Misión terminada.' })).toBeVisible();
  await tap(page, 9); // Start restarts after defeat.
  const state = await page.evaluate(() => window.__VOID_RESCUE__!.getState());
  expect(state).toMatchObject({ wave: 1, score: 0, lives: 3, mode: 'playing' });
  expect(errors).toEqual([]);
});

test('récords corruptos no bloquean el inicio y almacenamiento lleno mantiene tabla de sesión', async ({ page }, info) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'getGamepads', { configurable: true, value: () => [] });
    localStorage.setItem('void-rescue.records.v1', '{corrupt');
    localStorage.setItem('void-rescue.pilot', '<b>');
    Storage.prototype.setItem = () => { throw new DOMException('Full', 'QuotaExceededError'); };
  });
  await page.goto(info.project.metadata.backend === 'webgl2' ? '/?backend=webgl2' : '/');
  await page.waitForFunction(() => Boolean(window.__VOID_RESCUE__));
  await expect(page.getByRole('combobox', { name: 'Inicial 1' })).toHaveValue('V');
  await page.getByRole('combobox', { name: 'Inicial 1' }).selectOption('R');
  await page.getByRole('button', { name: /VER RÉCORDS/ }).click();
  await expect(page.getByText('Almacenamiento no disponible: los récords solo durarán esta sesión.')).toBeVisible();
  await page.locator('.records-dialog button').click();
  await page.getByRole('button', { name: /INICIAR VUELO/ }).click();
  await page.keyboard.down('Space');
  await page.waitForFunction(() => window.__VOID_RESCUE__!.getState().shotsFired > 3);
  await page.keyboard.up('Space');
  expect(errors).toEqual([]);
});
