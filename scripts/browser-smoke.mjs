import assert from 'node:assert/strict';
import { chromium } from 'playwright-core';
import { createServer } from 'vite';

const server = await createServer({ server: { host: '127.0.0.1', port: 5175, strictPort: true }, plugins: [{
  name: 'gallery-test-fixture', configureServer(devServer) {
// A gallery fixture exercises images without inventing screenshots for the portfolio.
devServer.middlewares.use(async (req, res, next) => {
  if (req.url !== '/portfolio/__gallery') return next();
  res.setHeader('Content-Type', 'text/html');
  res.end(await devServer.transformIndexHtml('/__gallery', `<html><head></head><body><div id="root"></div><script type="module">
    import React from 'react';
    import {createRoot} from 'react-dom/client';
    import {ProjectFile} from '/src/components/sections/ProjectFile.tsx';
    import '/src/index.css'; import '/src/features.css';
    createRoot(document.getElementById('root')).render(React.createElement(ProjectFile,{project:{
      id:'fixture',title:'Gallery fixture',tags:[],approach:'Test fixture',image:'/portfolio/me.jpeg',imageAlt:'First image',
      screenshots:[{src:'/portfolio/me.jpeg',alt:'Second image'}]
    }}));
  </script></body></html>`));
});
  },
}, {
  // Project images live in content.json, which the admin panel edits. Pin them so
  // these checks do not change meaning whenever a new image is published.
  name: 'project-image-fixture', enforce: 'pre',
  transform(code, id) {
    if (!id.split('?')[0].endsWith('/src/data/content.json')) return;
    const content = JSON.parse(code);
    content.projects.forEach((project, index) => Object.assign(project, {
      image: index === 0 ? 'me.jpeg' : '', imageAlt: index === 0 ? 'Fixture cover' : '', screenshots: [],
    }));
    return JSON.stringify(content);
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
  await page.goto('http://127.0.0.1:5175/portfolio/');
  await page.getByRole('heading', { level: 1 }).waitFor();
  await page.getByRole('button', { name: 'Reduce motion', exact: true }).click();
  assert.equal(await page.locator('canvas').count(), 0);
  await page.reload();
  await page.getByRole('button', { name: 'Enable motion', exact: true }).waitFor();
  await page.setViewportSize({ width: 375, height: 900 });
  await page.getByRole('button', { name: 'Next project' }).click();
  assert.equal((await page.locator('#projects [role="status"]').textContent()).trim(), '02 / 05');
  assert.equal(await page.locator('#projects [role="status"]').getAttribute('aria-label'), 'Project 2 of 5: CharityLink');
  assert.equal(await page.locator('#projects .project-carousel-slide[data-active="true"]').count(), 1);
  assert.equal(await page.locator('[data-project-stage]').evaluate(el => getComputedStyle(el).touchAction), 'pan-y');
  const activeCoverText = await page.locator('.project-carousel-slide[data-active="true"] [data-project-cover]').textContent();
  assert.ok(activeCoverText.includes('Full-Stack'));
  assert.equal(activeCoverText.includes('CharityLink'), false);
  assert.equal(await page.locator('#projects .project-carousel-tab[aria-current="true"]').textContent(), 'CharityLink');
  const headingHeight = () => page.locator('[data-project-summary] .project-detail-heading[data-active="true"]').evaluate(el => el.getBoundingClientRect().height);
  const firstHeadingHeight = await headingHeight();
  for (const position of ['03', '04', '05']) {
    await page.getByRole('button', { name: 'Next project' }).click();
    await page.waitForFunction(value => document.querySelector('#projects [role="status"]')?.textContent?.trim() === `${value} / 05`, position);
    assert.equal(await headingHeight(), firstHeadingHeight, 'Project summaries keep one reserved height on mobile');
  }
  assert.ok(await page.getByRole('button', { name: 'Next project' }).isDisabled());
  assert.ok(await page.locator('#projects .project-carousel-tab[aria-current="true"]').evaluate((tab) => {
    const viewport = tab.parentElement.getBoundingClientRect();
    const bounds = tab.getBoundingClientRect();
    return bounds.left >= viewport.left && bounds.right <= viewport.right;
  }));
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.getByRole('button', { name: 'CharityLink', exact: true }).click();
  // Page coordinates, so a scroll caused by focusing or clicking is not mistaken for a layout shift.
  const measureLayout = () => page.locator('#projects').evaluate((section) => {
    const box = (selector) => {
      const { y, height } = section.querySelector(selector).getBoundingClientRect();
      return { y: y + scrollY, height };
    };
    return { stage: box('[data-project-stage]'), navigation: box('[data-project-navigation]') };
  });
  const layoutBefore = await measureLayout();
  assert.ok(layoutBefore.stage.height >= 270 && layoutBefore.stage.height <= 330);
  assert.ok(layoutBefore.navigation.y >= layoutBefore.stage.y + layoutBefore.stage.height);
  assert.ok(layoutBefore.navigation.y <= layoutBefore.stage.y + layoutBefore.stage.height + 32);
  const projectStage = page.locator('[data-project-stage]');
  await projectStage.focus();
  await page.keyboard.press('ArrowRight');
  assert.equal(await page.locator('[data-project-summary] .project-detail-heading[data-active="true"] .project-detail-title').textContent(), 'Student Co-curricular Management System');
  await page.keyboard.press('ArrowLeft');
  assert.equal(await page.locator('[data-project-summary] .project-detail-heading[data-active="true"] .project-detail-title').textContent(), 'CharityLink');
  await page.locator('[data-project-summary] .project-file summary').click();
  assert.ok(await page.locator('[data-project-summary] .project-file').evaluate(el => el.open));
  await page.getByRole('button', { name: 'Student Co-curricular Management System', exact: true }).click();
  assert.equal(await page.locator('[data-project-summary] .project-detail-heading[data-active="true"] .project-detail-title').textContent(), 'Student Co-curricular Management System');
  assert.equal(await page.locator('[data-project-summary] .project-file').evaluate(el => el.open), false);
  const layoutAfter = await measureLayout();
  assert.equal(layoutAfter.stage.y, layoutBefore.stage.y);
  assert.equal(layoutAfter.stage.height, layoutBefore.stage.height);
  assert.equal(layoutAfter.navigation.y, layoutBefore.navigation.y);
  await page.locator('.project-carousel-slide[data-position="next"] [data-project-cover]').click();
  assert.equal((await page.locator('#projects [role="status"]').textContent()).trim(), '04 / 05');
  assert.match(await page.locator('.project-carousel-slide[data-position="previous"]').evaluate(el => getComputedStyle(el).filter), /blur/);
  assert.equal(await page.locator('.project-carousel-slide[data-position="active"]').evaluate(el => getComputedStyle(el).filter), 'none');
  await page.getByRole('button', { name: 'Face Recognition Attendance System', exact: true }).click();
  await page.getByRole('button', { name: 'View full size: Face Recognition Attendance System' }).click();
  const viewer = page.getByRole('dialog', { name: 'Face Recognition Attendance System image viewer' });
  await viewer.waitFor();
  const viewerImageWidth = () => viewer.getByRole('img').evaluate(img => img.getBoundingClientRect().width);
  const fittedWidth = await viewerImageWidth();
  await viewer.getByRole('button', { name: 'Zoom in' }).click();
  assert.ok(Math.abs(await viewerImageWidth() - fittedWidth * 2) < 1, 'Zoom doubles the fitted image');
  await viewer.getByRole('img').click();
  assert.ok(Math.abs(await viewerImageWidth() - fittedWidth) < 1, 'Clicking the zoomed image zooms back out');
  await page.keyboard.press('Escape');
  assert.equal(await page.getByRole('dialog').count(), 0);
  await page.getByRole('button', { name: 'Backend / API', exact: true }).click();
  assert.equal((await page.locator('#projects [role="status"]').textContent()).trim(), '01 / 02');
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
    await page.goto('http://127.0.0.1:5175/portfolio/#projects');
    await page.screenshot({ path: `${process.env.SCREENSHOT_DIR}/portfolio-projects.png` });
  }
  await page.goto('http://127.0.0.1:5175/portfolio/__gallery');
  await page.getByRole('button', { name: 'Next screenshot', exact: true }).click();
  await page.getByRole('button', { name: 'Screenshot 2: Second image' }).waitFor();
  assert.equal(await page.getByRole('button', { name: 'Screenshot 2: Second image' }).getAttribute('aria-pressed'), 'true');
  await page.keyboard.press('ArrowLeft');
  assert.equal(await page.getByRole('button', { name: 'Screenshot 1: First image' }).getAttribute('aria-pressed'), 'true');
  if (process.env.SCREENSHOT_DIR) {
    await page.locator('.gallery-card[data-active="true"]').evaluate(el => Promise.all(el.getAnimations().map(animation => animation.finished)));
    await page.screenshot({ path: `${process.env.SCREENSHOT_DIR}/gallery-desktop.png` });
  }
  await page.setViewportSize({ width: 375, height: 812 });
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Gallery fits mobile');
  const stage = page.locator('.gallery-stage');
  await stage.dispatchEvent('pointerdown', { clientX: 270 });
  await stage.dispatchEvent('pointerup', { clientX: 100 });
  assert.equal(await page.getByRole('button', { name: 'Screenshot 2: Second image' }).getAttribute('aria-pressed'), 'true');
  await stage.dispatchEvent('pointerdown', { clientX: 100 });
  await stage.dispatchEvent('pointerup', { clientX: 100 });
  if (process.env.SCREENSHOT_DIR) {
    await page.locator('.gallery-card[data-active="true"]').evaluate(el => Promise.all(el.getAnimations().map(animation => animation.finished)));
    await page.screenshot({ path: `${process.env.SCREENSHOT_DIR}/gallery-mobile.png` });
  }
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
  await reducedPage.goto('http://127.0.0.1:5175/portfolio/');
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
