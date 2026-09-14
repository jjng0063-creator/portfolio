import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import React from 'react';
import { act, create } from 'react-test-renderer';
import { createServer } from 'vite';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
globalThis.window = {
  location: { hash: '' },
  matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {} }),
  addEventListener() {}, removeEventListener() {},
  requestIdleCallback: () => 1, cancelIdleCallback() {},
  setTimeout: () => 1, clearTimeout() {}, scrollY: 0,
};
globalThis.document = {
  getElementById: () => null,
  documentElement: { dataset: {}, setAttribute() {} }, body: { style: {} },
};
globalThis.requestAnimationFrame = () => 1;
globalThis.cancelAnimationFrame = () => {};
globalThis.ResizeObserver = class { observe() {} disconnect() {} };
globalThis.confirm = () => true;

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
after(() => server.close());
const load = (path) => server.ssrLoadModule(`/src/${path}`);
const { PORTFOLIO_DATA } = await load('data/portfolioData.ts');

test('simulated POST rejects invalid JSON and accepts objects without sending a request', async () => {
  const { simulateRequest } = await load('lib/playground.ts');
  assert.equal(simulateRequest('{broken', { ok: true }).status, 400);
  assert.equal(simulateRequest('[]', { ok: true }).status, 400);
  assert.deepEqual(simulateRequest('{"message":"Hello"}', { ok: true }), {
    status: 200, body: { ok: true },
  });
});

test('project gallery switches screenshots and exposes an inline case study', async () => {
  const { ProjectFile } = await load('components/sections/ProjectFile.tsx');
  const project = { ...PORTFOLIO_DATA.projects[0], image: '/first.png', imageAlt: 'First screen',
    screenshots: [{ src: '/second.png', alt: 'Second screen' }], role: 'Developer', lessons: 'Test early.' };
  let view;
  try {
    await act(() => { view = create(React.createElement(ProjectFile, { project })); });
    await act(() => view.root.findByProps({ 'aria-label': 'Screenshot 2: Second screen' }).props.onClick());
    assert.ok(view.root.findAllByType('img').some(n => n.props.src === '/second.png'));
    assert.ok(view.root.findAllByType('details').length > 0);
    assert.ok(JSON.stringify(view.toJSON()).includes('Test early.'));
  } finally { if (view) await act(() => view.unmount()); }
});

test('project carousel controls update the announced and selected project', async () => {
  const { Projects } = await load('components/sections/Projects.tsx');
  let view;
  try {
    await act(() => { view = create(React.createElement(Projects, {
      filter: 'All', onFilterChange() {},
    })); });
    const total = PORTFOLIO_DATA.projects.length;
    const secondId = view.root.findAllByProps({ className: 'project-carousel-slide' })[1].props['data-project-id'];
    assert.equal(view.root.findByProps({ role: 'status' }).children.join(''), `01 / ${String(total).padStart(2, '0')}`);
    await act(() => view.root.findByProps({ 'aria-label': 'Next project' }).props.onClick());
    assert.equal(view.root.findByProps({ role: 'status' }).children.join(''), `02 / ${String(total).padStart(2, '0')}`);
    const selectedSlides = view.root.findAllByProps({ className: 'project-carousel-slide', 'data-active': true });
    assert.equal(selectedSlides.length, 1);
    assert.equal(selectedSlides[0].props['data-project-id'], secondId);
  } finally { if (view) await act(() => view.unmount()); }
});

test('project carousel keeps one selected detail panel outside moving covers', async () => {
  const { Projects } = await load('components/sections/Projects.tsx');
  let view;
  try {
    await act(() => { view = create(React.createElement(Projects, {
      filter: 'All', onFilterChange() {},
    })); });
    const [first, second] = PORTFOLIO_DATA.projects;
    const stage = view.root.findByProps({ className: 'project-carousel-stage' });
    const detail = view.root.findByProps({ className: 'project-detail-panel' });
    assert.equal(stage.findAllByType('article').length, 0);
    assert.equal(view.root.findAllByProps({ className: 'project-file' }).length, 1);
    assert.equal(detail.props.id, undefined);
    assert.deepEqual(
      view.root.findAllByProps({ 'data-project-anchor': true }).map((anchor) => anchor.props.id),
      PORTFOLIO_DATA.projects.map((project) => `project-${project.id}`)
    );
    assert.equal(detail.findByProps({ className: 'project-detail-heading', 'data-active': true }).findByProps({ className: 'project-detail-title' }).children.join(''), first.title);
    await act(() => view.root.findByProps({ 'aria-label': 'Next project' }).props.onClick());
    const updatedDetail = view.root.findByProps({ className: 'project-detail-panel' });
    assert.equal(updatedDetail.props.id, undefined);
    assert.equal(updatedDetail.findByProps({ className: 'project-detail-heading', 'data-active': true }).findByProps({ className: 'project-detail-title' }).children.join(''), second.title);
  } finally { if (view) await act(() => view.unmount()); }
});

test('motion control switches to the static cabinet and mobile shortcuts remain available', async () => {
  const { App } = await load('App.tsx');
  const { CabinetStage } = await load('components/cabinet/CabinetStage.tsx');
  let view;
  try {
    await act(() => { view = create(React.createElement(App)); });
    await act(() => view.root.findByProps({ 'aria-label': 'Reduce motion' }).props.onClick());
    assert.equal(view.root.findByType(CabinetStage).props.motionEnabled, false);
    assert.equal(view.root.findByProps({ 'aria-label': 'Quick links' }).findAllByType('a').length, 3);
  } finally { if (view) await act(() => view.unmount()); }
});

test('empty playground does not crash the page', async () => {
  const { Playground } = await load('components/sections/Playground.tsx');
  const original = PORTFOLIO_DATA.apiEndpoints;
  PORTFOLIO_DATA.apiEndpoints = [];
  let view;
  try {
    await act(() => { view = create(React.createElement(Playground)); });
    assert.equal(view.root.findAllByType('pre').length, 0);
  } finally {
    PORTFOLIO_DATA.apiEndpoints = original;
    if (view) await act(() => view.unmount());
  }
});

test('response drafts follow reordered, deleted, and reloaded endpoints', async () => {
  const { EditorProvider } = await load('admin/state.tsx');
  const { PlaygroundPanel } = await load('admin/panels.tsx');
  function Editor() {
    const [data, setData] = React.useState({ apiEndpoints: [
      { method: 'GET', path: '/a', description: '', response: { name: 'A' } },
      { method: 'GET', path: '/b', description: '', response: { name: 'B' } },
    ] });
    return React.createElement(EditorProvider, { data, onChange: setData }, React.createElement(PlaygroundPanel));
  }
  let view;
  try {
    await act(() => { view = create(React.createElement(Editor)); });
    await act(() => view.root.findAllByType('button').find(b => b.props.title === 'Expand').props.onClick());
    await act(() => view.root.findAllByType('button').find(b => b.props.title === 'Move down').props.onClick());
    const fields = view.root.findAllByType('textarea');
    assert.equal(JSON.parse(fields[0].props.value).name, 'B');
    assert.equal(JSON.parse(fields[1].props.value).name, 'A');
    await act(() => fields[0].props.onChange({ target: { value: '{"name":"B edited"}' } }));
    const saved = view.root.findByType(EditorProvider).props.data;
    assert.equal(saved.apiEndpoints[0].response.name, 'B edited');
    assert.equal(saved.apiEndpoints[1].response.name, 'A');
    await act(() => fields[0].props.onChange({ target: { value: '{invalid' } }));
    assert.equal(view.root.findAllByType('textarea')[0].props.value, '{invalid');
    await act(() => view.root.findAllByType('button').find(b => b.props.title === 'Delete').props.onClick());
    assert.equal(JSON.parse(view.root.findAllByType('textarea')[0].props.value).name, 'A');
    await act(() => view.root.findByType(EditorProvider).props.onChange(data => ({
      ...data,
      apiEndpoints: [{ ...data.apiEndpoints[0], response: { name: 'Reloaded' } }],
    })));
    assert.equal(JSON.parse(view.root.findAllByType('textarea')[0].props.value).name, 'Reloaded');
  } finally {
    if (view) await act(() => view.unmount());
  }
});

test('jumping to an item never scrolls past the end of its section', async () => {
  const { jumpTo } = await load('lib/jump.ts');
  const saved = { getElementById: document.getElementById, innerHeight: window.innerHeight, scrollTo: window.scrollTo };
  let scrolled;
  const at = (top, bottom) => () => ({ top, bottom });
  const itemAt = (top) => ({ getBoundingClientRect: at(top, top + 100), closest: () => section });
  // Section spans 1000–2000 in a 800px viewport with 100px top padding.
  const section = { getBoundingClientRect: at(1000, 2000) };
  globalThis.getComputedStyle = () => ({ scrollPaddingTop: '100px', scrollPaddingBottom: '0px' });
  Object.assign(window, { innerHeight: 800, scrollTo: (o) => { scrolled = o.top; } });
  try {
    document.getElementById = () => itemAt(1100);
    assert.equal(jumpTo('first'), true);
    assert.equal(scrolled, 1000, 'an early item still lands under the header');
    document.getElementById = () => itemAt(1850);
    jumpTo('last');
    assert.equal(scrolled, 1200, 'the last item stops at the section end');
    section.getBoundingClientRect = at(1000, 1400);
    jumpTo('short');
    assert.equal(scrolled, 900, 'a section shorter than the screen pins to its top');
    assert.equal(window.location.hash, 'short');
  } finally {
    Object.assign(document, { getElementById: saved.getElementById });
    Object.assign(window, { innerHeight: saved.innerHeight, scrollTo: saved.scrollTo, location: { hash: '' } });
    delete globalThis.getComputedStyle;
  }
});

test('a card a jump lands on stays fully shown until it leaves the screen', async () => {
  const { registerEmerge, revealLanding } = await load('lib/emerge.ts');
  let io;
  const frames = [];
  globalThis.IntersectionObserver = class { constructor(cb) { io = cb; } observe() {} unobserve() {} };
  globalThis.requestAnimationFrame = (cb) => frames.push(cb);
  const run = () => { for (let i = 0; i < 50 && frames.length; i++) frames.shift()(0); };
  Object.assign(window, { innerHeight: 800, scrollY: 0 });
  // Top at 650 of 800: below the 52% line, so normally still mid-entrance.
  const card = { style: {}, getBoundingClientRect: () => ({ top: 650, bottom: 750, height: 100 }) };
  const off = registerEmerge(card);
  try {
    io([{ target: card, isIntersecting: true }]); run();
    assert.match(card.style.filter, /blur/);
    const y = revealLanding(() => {
      assert.equal(card.style.transform, '', 'the jump is measured without entrance transforms');
      return 0;
    });
    assert.equal(y, 0);
    run();
    assert.equal(card.style.transform, '');
    assert.equal(card.style.filter, '');
    io([{ target: card, isIntersecting: false }]);
    io([{ target: card, isIntersecting: true }]); run();
    assert.notEqual(card.style.transform, '', 'animates normally again after leaving the screen');
  } finally {
    off();
    globalThis.requestAnimationFrame = () => 1;
    delete globalThis.IntersectionObserver;
  }
});

test('cabinet folders match rendered projects after filtering and resetting', async () => {
  const { App } = await load('App.tsx');
  const { CabinetStage } = await load('components/cabinet/CabinetStage.tsx');
  let view;
  try {
    await act(() => { view = create(React.createElement(App)); });
    for (const category of ['Backend / API', 'All']) {
      const button = view.root.findAllByType('button').find(b => b.children.includes(category));
      await act(() => button.props.onClick());
      const folders = view.root.findByType(CabinetStage).props.drawers.find(d => d.id === 'projects').files;
      const rendered = view.root.findAllByProps({ 'data-project-anchor': true });
      assert.deepEqual(folders.map(f => f.targetId).sort(), rendered.map(n => n.props.id).sort());
    }
  } finally {
    if (view) await act(() => view.unmount());
  }
});
