// Minimal DOM shim so kami-render.js can be executed and asserted on without a
// browser or jsdom. kami-render.js only touches:
//   - `document.querySelector(selector)` (for the target)
//   - `document.body` (default target)
//   - `document.body.classList` (dense-mode toggle for the 2-page discipline)
//   - `element.innerHTML = ...`
// so a tiny fake is enough to exercise the real rendering + escaping logic.

import fs from 'node:fs';

function createClassList(el) {
  const set = new Set();
  return {
    add(name) {
      set.add(name);
      el._classes = [...set];
    },
    remove(name) {
      set.delete(name);
      el._classes = [...set];
    },
    contains(name) {
      return set.has(name);
    },
    toString() {
      return [...set].join(' ');
    },
  };
}

function createElement() {
  const el = { innerHTML: '', _classes: [] };
  el.classList = createClassList(el);
  return el;
}

export function createDom() {
  const body = createElement();
  const registry = new Map([['body', body]]);
  const document = {
    body,
    querySelector(selector) {
      if (selector === 'body') return body;
      return registry.get(selector) || null;
    },
    register(selector, el) {
      registry.set(selector, el);
    },
  };
  const window = { document };
  return { window, document, body, createElement };
}

/**
 * Load templates/shared/kami-render.js and return the global renderKamiResume.
 * The file is an IIFE of the form `(function (global) { ... })(window)`, so we
 * evaluate it with a function scope that injects `window` and `document`.
 */
export function loadRenderer(renderJsPath) {
  const code = fs.readFileSync(renderJsPath, 'utf8');
  const { window, document, createElement } = createDom();
  // eslint-disable-next-line no-new-func
  const factory = new Function('window', 'document', code);
  factory(window, document);
  if (typeof window.renderKamiResume !== 'function') {
    throw new Error('kami-render.js did not export renderKamiResume on window');
  }
  return { render: window.renderKamiResume, window, document, createElement };
}

/** Render a Resume View and return the produced HTML string. */
export function renderToHtml(renderJsPath, resumeView) {
  const { render, createElement } = loadRenderer(renderJsPath);
  const target = createElement();
  render({ target, data: resumeView });
  return target.innerHTML;
}
