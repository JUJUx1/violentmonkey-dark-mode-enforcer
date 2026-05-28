// ==UserScript==
// @name         Dark Mode Enforcer
// @namespace    https://example.com/userscripts
// @version      0.1.0
// @description  Force a dark theme on websites with a toggle and per-site settings.
// @author       You
// @match        *://*/*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_addStyle
// @run-at       document-start
// ==/UserScript==

(async function () {
  'use strict';

  const SITE_LIST_KEY = 'dme_sites';
  const GLOBAL_KEY = 'dme_global_enabled';
  const BUTTON_ID = 'dme-toggle-btn';
  const PANEL_ID = 'dme-panel';

  const hostname = location.hostname;

  // helpers for storage
  async function getSites() {
    const v = await GM_getValue(SITE_LIST_KEY, null);
    return v || {};
  }

  async function setSites(obj) {
    await GM_setValue(SITE_LIST_KEY, obj);
  }

  async function getGlobal() {
    return await GM_getValue(GLOBAL_KEY, false);
  }

  async function setGlobal(b) {
    await GM_setValue(GLOBAL_KEY, !!b);
  }

  // Core dark CSS using invert technique (robust/simple)
  const darkCss = `
  html.dme-dark {
    filter: invert(0.95) hue-rotate(180deg) !important;
    background-color: #111 !important;
  }
  html.dme-dark img, html.dme-dark video, html.dme-dark iframe, html.dme-dark svg {
    filter: invert(1) hue-rotate(180deg) !important;
  }
  /* Basic controls styling */
  #${BUTTON_ID} {
    position: fixed;
    right: 12px;
    bottom: 12px;
    z-index: 2147483647;
    background: rgba(0,0,0,0.6);
    color: #fff;
    border: 1px solid rgba(255,255,255,0.08);
    padding: 8px 10px;
    border-radius: 6px;
    font-family: sans-serif;
    font-size: 13px;
    cursor: pointer;
    backdrop-filter: blur(6px);
  }
  #${PANEL_ID} {
    position: fixed;
    right: 12px;
    bottom: 56px;
    z-index: 2147483647;
    background: rgba(0,0,0,0.75);
    color: #fff;
    border: 1px solid rgba(255,255,255,0.08);
    padding: 10px;
    border-radius: 8px;
    width: 220px;
    font-family: sans-serif;
    font-size: 13px;
  }
  #${PANEL_ID} label { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
  `;

  GM_addStyle(darkCss);

  // apply or remove dark class
  function applyDark() {
    document.documentElement.classList.add('dme-dark');
  }
  function removeDark() {
    document.documentElement.classList.remove('dme-dark');
  }

  // Keep dark state across SPA navigations
  let lastHref = location.href;
  function monitorUrlChanges(onChange) {
    setInterval(() => {
      if (location.href !== lastHref) {
        lastHref = location.href;
        onChange();
      }
    }, 500);
  }

  // Build UI (runs after DOM is ready)
  async function buildUI() {
    if (document.getElementById(BUTTON_ID)) return;

    const panel = document.createElement('div');
    panel.id = PANEL_ID;
    panel.style.display = 'none';

    const sites = await getSites();
    const globalEnabled = await getGlobal();
    const siteEnabled = (sites[hostname] === undefined) ? null : !!sites[hostname];

    const siteChecked = siteEnabled === null ? globalEnabled : siteEnabled;

    panel.innerHTML = `
      <div style="margin-bottom:8px;font-weight:600">Dark Mode Enforcer</div>
      <label>Enable on this site
        <input id="dme-site-toggle" type="checkbox" ${siteChecked ? 'checked' : ''} />
      </label>
      <label style="margin-top:6px">Enable globally
        <input id="dme-global-toggle" type="checkbox" ${globalEnabled ? 'checked' : ''} />
      </label>
      <div style="margin-top:8px;font-size:12px;opacity:0.9">Hostname: ${hostname}</div>
    `;

    const btn = document.createElement('button');
    btn.id = BUTTON_ID;
    btn.title = 'Dark Mode Enforcer';
    btn.textContent = siteChecked ? '🌙 On' : '☀️ Off';

    document.addEventListener('click', (e) => {
      // close panel when clicking outside
      if (!panel.contains(e.target) && e.target !== btn) panel.style.display = 'none';
    });

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    });

    panel.querySelector('#dme-site-toggle').addEventListener('change', async (ev) => {
      const v = ev.target.checked;
      const s = await getSites();
      s[hostname] = v;
      await setSites(s);
      if (v) applyDark(); else removeDark();
      btn.textContent = v ? '🌙 On' : '☀️ Off';
    });

    panel.querySelector('#dme-global-toggle').addEventListener('change', async (ev) => {
      const v = ev.target.checked;
      await setGlobal(v);
      // if site has no explicit preference, apply global
      const s = await getSites();
      const siteHas = (s[hostname] !== undefined);
      if (!siteHas) {
        if (v) applyDark(); else removeDark();
        btn.textContent = v ? '🌙 On' : '☀️ Off';
      }
    });

    document.body.appendChild(panel);
    document.body.appendChild(btn);
  }

  // initialize: decide whether to enable dark mode on load
  (async function init() {
    const sites = await getSites();
    const globalEnabled = await getGlobal();
    const sitePref = (sites[hostname] === undefined) ? null : !!sites[hostname];
    const enabled = sitePref === null ? globalEnabled : sitePref;

    if (enabled) applyDark();

    // add UI after DOM ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', buildUI);
    } else {
      buildUI();
    }

    // keep applying on SPA navigations
    monitorUrlChanges(async () => {
      const s = await getSites();
      const g = await getGlobal();
      const sp = (s[location.hostname] === undefined) ? null : !!s[location.hostname];
      const en = sp === null ? g : sp;
      if (en) applyDark(); else removeDark();
      // refresh UI if present
      const btn = document.getElementById(BUTTON_ID);
      if (btn) btn.textContent = en ? '🌙 On' : '☀️ Off';
    });
  })();

})();
