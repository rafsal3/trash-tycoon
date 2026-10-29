/*
 * Thin, defensive wrapper around the YouTube Playables SDK (window.ytgame).
 * Outside of YouTube (local dev) it falls back to localStorage so the game is fully playable.
 */
(function () {
  'use strict';

  const yt = (typeof window.ytgame !== 'undefined') ? window.ytgame : null;
  const inEnv = !!(yt && yt.IN_PLAYABLES_ENV);
  const LS_KEY = 'trashTycoon_save_v1';

  function safe(fn, fallback) {
    try { return fn(); } catch (e) { console.warn('[SDK]', e); return fallback; }
  }

  const SDK = {
    inEnv,
    /** True only after loadData() has resolved successfully. saveData() is blocked until then. */
    loaded: false,

    firstFrameReady() {
      safe(() => yt && yt.game.firstFrameReady());
    },

    gameReady() {
      safe(() => yt && yt.game.gameReady());
    },

    async load() {
      if (inEnv) {
        for (let attempt = 0; attempt < 3; attempt++) {
          try {
            const data = await yt.game.loadData();
            this.loaded = true;
            return data || '';
          } catch (e) {
            console.warn('[SDK] loadData failed', e);
            this.logWarning();
            await new Promise(r => setTimeout(r, 600));
          }
        }
        // Could not load: keep `loaded` false so we never overwrite existing cloud progress.
        return '';
      }
      this.loaded = true;
      return safe(() => localStorage.getItem(LS_KEY), '') || '';
    },

    async save(str) {
      if (!this.loaded) return;
      if (inEnv) {
        try { await yt.game.saveData(str); } catch (e) { console.warn('[SDK] saveData failed', e); this.logWarning(); }
        return;
      }
      safe(() => localStorage.setItem(LS_KEY, str));
    },

    sendScore(value) {
      if (!inEnv) return;
      try {
        const p = yt.engagement.sendScore({ value: Math.floor(value) });
        if (p && p.catch) p.catch(e => console.warn('[SDK] sendScore failed', e));
      } catch (e) { console.warn('[SDK] sendScore', e); }
    },

    isAudioEnabled() {
      if (!yt || !yt.system) return true;
      return safe(() => yt.system.isAudioEnabled(), true);
    },

    onAudioEnabledChange(cb) {
      safe(() => yt && yt.system.onAudioEnabledChange(cb));
    },

    onPause(cb) {
      safe(() => yt && yt.system.onPause(cb));
    },

    onResume(cb) {
      safe(() => yt && yt.system.onResume(cb));
    },

    logError() {
      safe(() => yt && yt.health && yt.health.logError());
    },

    logWarning() {
      safe(() => yt && yt.health && yt.health.logWarning());
    },
  };

  window.addEventListener('error', () => SDK.logError());
  window.addEventListener('unhandledrejection', () => SDK.logError());

  window.SDK = SDK;
})();
