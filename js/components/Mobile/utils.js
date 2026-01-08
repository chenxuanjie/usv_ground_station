(function() {
  const NullIcon = (p) => (
    <svg {...p} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" opacity="0.35"></circle>
      <path d="M8 12h8" opacity="0.55"></path>
    </svg>
  );

  const Icon = (name, fallback = NullIcon) => (window.Icons && window.Icons[name]) ? window.Icons[name] : fallback;

  const normalizeUiStyle = (uiStyle) => {
    if (typeof uiStyle !== 'string') return 'cyber';
    const key = uiStyle.trim().toLowerCase();
    return key || 'cyber';
  };

  const THEME_SCRIPTS = {
    ios: 'js/components/Mobile/iosTheme.js'
  };

  const themeRegistry = {};
  const themeLoadPromises = {};

  const registerTheme = (key, theme) => {
    const normalized = normalizeUiStyle(key);
    if (!theme || typeof theme !== 'object') return;
    themeRegistry[normalized] = { ...theme, key: normalized };
  };

  const MOBILE_UI_THEMES = {
    cyber: {
      key: 'cyber',
      root: 'bg-slate-950 text-slate-200',
      overlay: 'bg-black/60 backdrop-blur-sm',
      divider: 'bg-cyan-900/30',
      accentText: 'text-cyan-400',
      accentStrongText: 'text-cyan-100',
      statusBar: {
        wrapper: 'bg-gradient-to-b from-slate-900 via-slate-900/80 to-transparent',
        iconBtn: 'w-10 h-10 flex items-center justify-center border border-cyan-500/50 bg-slate-900/40 rounded hover:bg-cyan-500/10 active:scale-95 transition-all',
        icon: 'text-cyan-400',
        title: 'font-mono font-bold text-lg tracking-wider flex items-center gap-2 text-cyan-50 drop-shadow-[0_0_5px_rgba(34,211,238,0.8)]',
        meta: 'text-[10px] font-mono',
        metaMuted: 'text-cyan-300/70',
      },
      bottomNav: {
        wrapper: 'bg-slate-950/95 backdrop-blur-xl border-t border-cyan-500/20',
        divider: 'bg-cyan-900/30',
        btnActive: 'text-cyan-400 bg-cyan-500/5',
        btnInactive: 'text-slate-500 hover:text-cyan-200 hover:bg-slate-900',
        indicator: 'bg-cyan-400 shadow-[0_0_10px_cyan]',
      },
      drawer: {
        panel: 'bg-slate-950/95 border-r border-cyan-500/30',
        header: 'border-b border-cyan-500/20 bg-gradient-to-b from-slate-900 via-slate-900/80 to-transparent',
        headerIcon: 'text-cyan-400',
        headerTitle: 'text-cyan-100',
        sectionTitle: 'text-cyan-100',
        sectionSub: 'text-cyan-500/60',
        card: 'bg-slate-900/50 border border-slate-800',
        segment: 'flex bg-slate-900 rounded p-1 border border-slate-800',
        segmentBtnActive: 'bg-cyan-600 text-white shadow-lg',
        segmentBtnInactive: 'text-slate-400 hover:text-white',
        input: 'bg-slate-950 border-slate-700 text-cyan-100 font-mono text-xs px-2 py-1.5 rounded focus:outline-none focus:border-cyan-500 transition-colors placeholder-slate-600',
        inputLocked: 'border-green-500/30 text-green-100 opacity-80 cursor-not-allowed',
        actionPrimary: 'bg-cyan-600 hover:bg-cyan-500 text-white border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.3)]',
        actionDanger: 'bg-red-500/10 border-red-500/50 text-red-400 hover:bg-red-500/20',
      },
      hudBox: {
        wrapper: 'relative bg-slate-950/90 backdrop-blur-md border border-cyan-500/30 shadow-[0_0_15px_-3px_rgba(6,182,212,0.15)]',
        corner: 'border-cyan-400',
      },
      joystick: {
        base: 'border border-cyan-500/20 bg-slate-900/40 backdrop-blur-sm shadow-[inset_0_0_20px_rgba(6,182,212,0.1)]',
        ring: 'border-cyan-500/30',
        thumbActive: 'bg-cyan-500/20 border-cyan-400',
        thumbInactive: 'bg-slate-800/80 border-cyan-800',
        arrow: 'text-cyan-500/50',
      },
      toast: {
        wrapper: 'bg-cyan-950/90 border border-cyan-500 text-cyan-100 shadow-[0_0_20px_rgba(6,182,212,0.4)]',
        close: 'text-cyan-100/60 hover:text-cyan-50 hover:bg-white/5',
      }
    }
  };

  registerTheme('cyber', MOBILE_UI_THEMES.cyber);

  const getMobileTheme = (uiStyle) => {
    const normalized = normalizeUiStyle(uiStyle);
    return themeRegistry[normalized] || themeRegistry.cyber;
  };

  const hasTheme = (uiStyle) => {
    const normalized = normalizeUiStyle(uiStyle);
    return !!themeRegistry[normalized];
  };

  const loadTheme = (uiStyle) => {
    const normalized = normalizeUiStyle(uiStyle);
    if (themeRegistry[normalized]) return Promise.resolve(themeRegistry[normalized]);
    if (themeLoadPromises[normalized]) return themeLoadPromises[normalized];

    const assetPrefixRaw = (typeof window !== 'undefined' && typeof window.__APP_ASSET_PREFIX__ === 'string')
      ? window.__APP_ASSET_PREFIX__
      : '';
    const assetPrefix = assetPrefixRaw && !assetPrefixRaw.endsWith('/') ? `${assetPrefixRaw}/` : assetPrefixRaw;
    const src = assetPrefix + THEME_SCRIPTS[normalized];
    if (!src) return Promise.reject(new Error(`Unknown theme: ${normalized}`));
    if (typeof document === 'undefined') return Promise.reject(new Error('Theme loading requires a browser document.'));

    themeLoadPromises[normalized] = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.onload = () => {
        delete themeLoadPromises[normalized];
        if (themeRegistry[normalized]) resolve(themeRegistry[normalized]);
        else reject(new Error(`Theme loaded but not registered: ${normalized}`));
      };
      script.onerror = () => {
        delete themeLoadPromises[normalized];
        reject(new Error(`Failed to load theme script: ${src}`));
      };
      document.head.appendChild(script);
    });

    return themeLoadPromises[normalized];
  };

  window.MobileUtils = {
    Icon,
    NullIcon,
    normalizeUiStyle,
    getMobileTheme,
    registerTheme,
    hasTheme,
    loadTheme
  };
})();
