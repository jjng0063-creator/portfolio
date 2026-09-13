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
    const secondTitle = view.root.findAllByProps({ className: 'project-carousel-tab' })[1].children.join('');
    assert.equal(view.root.findByProps({ role: 'status' }).children.join(''), `01 / ${String(total).padStart(2, '0')}`);
    await act(() => view.root.findByProps({ 'aria-label': 'Next project' }).props.onClick());
    assert.equal(view.root.findByProps({ role: 'status' }).children.join(''), `02 / ${String(total).padStart(2, '0')}`);
    const selectedTabs = view.root.findAllByProps({ className: 'project-carousel-tab', 'aria-current': 'true' });
    assert.equal(selectedTabs.length, 1);
    assert.equal(selectedTabs[0].children.join(''), secondTitle);
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
