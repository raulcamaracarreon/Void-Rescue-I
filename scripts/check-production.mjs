import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';
import { writeFile } from 'node:fs/promises';

const browser = await chromium.launch({ channel: 'chromium', headless: true });
const results = [];
try {
  for (const backend of ['auto', 'webgl2']) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    await page.goto(`http://127.0.0.1:4173/${backend === 'webgl2' ? '?backend=webgl2' : ''}`);
    await page.locator('#loading').waitFor({ state: 'detached' });
    assert.equal(await page.evaluate(() => typeof window.__VOID_RESCUE__), 'undefined');
    await page.getByRole('button', { name: /INICIAR VUELO/ }).click();
    await page.keyboard.down('KeyD');
    await page.waitForFunction(() => Number(document.querySelector('#speed').textContent) > 20);
    await page.keyboard.up('KeyD');
    await page.keyboard.press('Escape');
    await page.getByRole('dialog').waitFor({ state: 'visible' });
    await page.getByRole('button', { name: /CONTINUAR VUELO/ }).click();
    await page.getByRole('dialog').waitFor({ state: 'hidden' });
    const activeBackend = await page.locator('#backend').textContent();
    if (backend === 'webgl2') assert.equal(activeBackend, 'WEBGL2');
    assert.deepEqual(errors, []);
    results.push({ requested: backend, activeBackend, errors, passed: true });
    await page.close();
  }
  await writeFile('docs/screenshots/production-check.json', JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results, null, 2));
} finally {
  await browser.close();
}
