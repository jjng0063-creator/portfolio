import assert from 'node:assert/strict';
import { chromium } from 'playwright-core';
import { createServer } from 'vite';

const server = await createServer({ server: { host: '127.0.0.1', port: 5175, strictPort: true }, plugins: [{
  name: 'gallery-test-fixture', configureServer(devServer) {
// A gallery fixture exercises images without inventing screenshots for the portfolio.
devServer.middlewares.use(async (req, res, next) => {
  if (req.url !== '/portfolio-v2/__gallery') return next();
  res.setHeader('Content-Type', 'text/html');
  res.end(await devServer.transformIndexHtml('/__gallery', `<html><head></head><body><div id="root"></div><script type="module">
    import React from 'react';
    import {createRoot} from 'react-dom/client';
    import {ProjectFile} from '/src/components/sections/ProjectFile.tsx';
    import '/src/index.css'; import '/src/features.css';
    createRoot(document.getElementById('root')).render(React.createElement(ProjectFile,{project:{
      id:'fixture',title:'Gallery fixture',tags:[],approach:'Test fixture',image:'/portfolio-v2/me.jpeg',imageAlt:'First image',
      screenshots:[{src:'/portfolio-v2/me.jpeg',alt:'Second image'}]
    }}));
  </script></body></html>`));
});
  },
}] });
let browser;
try {
  await server.listen();
  browser = await chromium.launch({ headless: true,
    ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : { channel: 'chrome' }),
    args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.setDefaultTimeout(10000);
  const errors = [];
  page.on('pageerror', error => { errors.push(error.message); console.error(error.message); });
  await page.goto('http://127.0.0.1:5175/portfolio-v2/');
  await page.getByRole('heading', { level: 1 }).waitFor();
  await page.getByRole('button', { name: 'Reduce motion', exact: true }).click();
  assert.equal(await page.locator('canvas').count(), 0);
  await page.reload();
  await page.getByRole('button', { name: 'Enable motion', exact: true }).waitFor();
  await page.setViewportSize({ width: 375, height: 900 });
  await page.getByRole('button', { name: 'Next project' }).click();
  assert.equal((await page.locator('#projects [aria-live="polite"]').textContent()).trim(), '02 / 05');
  assert.ok(await page.locator('#projects .project-carousel-track').evaluate(el => el.scrollLeft > 0));
  assert.equal(await page.locator('#projects .project-carousel-tab[aria-current="true"]').textContent(), 'CharityLink');
  for (const position of ['03', '04', '05']) {
    await page.getByRole('button', { name: 'Next project' }).click();
    await page.waitForFunction(value => document.querySelector('#projects [aria-live="polite"]')?.textContent?.trim() === `${value} / 05`, position);
  }
  assert.ok(await page.locator('#projects .project-carousel-tab[aria-current="true"]').evaluate((tab) => {
    const viewport = tab.parentElement.getBoundingClientRect();
    const bounds = tab.getBoundingClientRect();
    return bounds.left >= viewport.left && bounds.right <= viewport.right;
  }));
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.locator('#projects .project-carousel-slide').nth(1).locator('.project-file summary').click();
  assert.ok(await page.locator('#projects .project-carousel-slide').nth(1).locator('.project-file').evaluate(el => el.open));
  await page.getByRole('button', { name: 'Backend / API', exact: true }).click();
  assert.equal((await page.locator('#projects [aria-live="polite"]').textContent()).trim(), '01 / 02');
  assert.ok(await page.getByRole('button', { name: 'Backend / API', exact: true }).evaluate(el => el === document.activeElement));
  await page.locator('.cabinet-index summary').click();
  assert.equal(await page.locator('.cabinet-index a[href^="#project-"]').count(), 2);
  const javaEvidence = page.locator('#skills .skill-evidence').filter({ hasText: /^Java\s/ });
  await javaEvidence.locator('summary').click();
  await javaEvidence.locator('a').click();
  assert.equal(await page.getByRole('button', { name: 'All', exact: true }).getAttribute('aria-pressed'), 'true');
  await page.waitForFunction(() => document.querySelector('#projects .project-carousel-tab[aria-current="true"]')?.textContent === 'Stock Management System');
  await page.getByRole('button', { name: /POST.*\/api\/contact/ }).click();
  await page.getByLabel('Request body (JSON)').fill('{bad');
  await page.getByRole('button', { name: 'Run simulated request' }).click();
  await page.getByText('400 Bad Request', { exact: false }).waitFor();
  await page.getByLabel('Request body (JSON)').fill('{"message":"Hello"}');
  await page.getByRole('button', { name: 'Run simulated request' }).click();
  await page.getByText('200 OK', { exact: false }).waitFor();
  for (const width of [375, 768, 1280, 1440, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    if (!(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))) {
      console.log(await page.evaluate(() => [...document.querySelectorAll('main *')].filter(el => el.getBoundingClientRect().right > innerWidth + 1).slice(0, 15).map(el => ({ tag: el.tagName, class: el.className, width: el.getBoundingClientRect().width }))));
    }
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Overflow at ${width}px`);
  }
  await page.setViewportSize({ width: 375, height: 812 });
  await page.getByRole('navigation', { name: 'Quick links' }).getByRole('link', { name: 'Contact' }).click();
  await page.locator('#contact').waitFor();
  if (process.env.SCREENSHOT_DIR) {
    await page.screenshot({ path: `${process.env.SCREENSHOT_DIR}/portfolio-mobile.png` });
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('http://127.0.0.1:5175/portfolio-v2/#projects');
    await page.screenshot({ path: `${process.env.SCREENSHOT_DIR}/portfolio-projects.png` });
  }
  await page.goto('http://127.0.0.1:5175/portfolio-v2/__gallery');
  await page.getByRole('button', { name: 'Screenshot 2: Second image' }).click();
  await page.getByRole('button', { name: 'Enlarge screenshot: Second image' }).click();
  await page.getByRole('dialog').waitFor();
  await page.keyboard.press('Tab');
  assert.ok(await page.evaluate(() => document.querySelector('dialog').contains(document.activeElement)));
  await page.keyboard.press('Escape');
  assert.equal(await page.getByRole('dialog').count(), 0);
  assert.equal(await page.getByRole('button', { name: 'Enlarge screenshot: Second image' }).evaluate(el => el === document.activeElement), true);
  const reduced = await browser.newContext({ reducedMotion: 'reduce', colorScheme: 'dark', viewport: { width: 1440, height: 900 } });
  const reducedPage = await reduced.newPage();
  reducedPage.on('pageerror', error => errors.push(error.message));
  await reducedPage.goto('http://127.0.0.1:5175/portfolio-v2/');
  await reducedPage.getByRole('button', { name: 'Enable motion', exact: true }).waitFor();
  assert.equal(await reducedPage.locator('canvas').count(), 0);
  await reducedPage.getByRole('button', { name: 'Enable motion', exact: true }).click();
  await reducedPage.locator('canvas').waitFor();
  if (process.env.SCREENSHOT_DIR) {
    await reducedPage.screenshot({ path: `${process.env.SCREENSHOT_DIR}/portfolio-dark.png` });
  }
  await reduced.close();
  assert.deepEqual(errors, []);
  console.log('Browser checks passed: carousel navigation, motion persistence, project files, skill links, cabinet filters, simulated POST, five viewport widths, mobile shortcuts, and gallery dialog keyboard behavior.');
} finally {
  await browser?.close();
  await server.close();
}
