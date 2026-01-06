(function() {
  const NullIcon = (p) => (
    <svg {...p} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" opacity="0.35"></circle>
      <path d="M8 12h8" opacity="0.55"></path>
    </svg>
  );

  const Icon = (name, fallback = NullIcon) => (window.Icons && window.Icons[name]) ? window.Icons[name] : fallback;

  const normalizeUiStyle = (uiStyle) => (uiStyle === 'ios' ? 'ios' : 'cyber');

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
        segment: 'bg-slate-900 rounded p-1 border border-slate-800',
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
    },
    ios: {
      key: 'ios',
      root: 'bg-[#F2F2F7] text-slate-900 overflow-x-hidden selection:bg-blue-100 selection:text-blue-600',
      overlay: 'bg-black/20 backdrop-blur-[2px]',
      divider: 'bg-slate-200/60',
      accentText: 'text-[#007AFF]',
      accentStrongText: 'text-slate-900',
      statusBar: {
        wrapper: 'bg-white/70 backdrop-blur-xl border-b border-slate-200/50',
        iconBtn: 'w-10 h-10 flex items-center justify-center rounded-full active:bg-slate-200/50 transition-colors',
        icon: 'text-[#007AFF]',
        title: 'font-sans font-bold text-[17px] tracking-tight text-slate-900',
        meta: 'text-[10px] font-mono',
        metaMuted: 'text-slate-500',
      },
      bottomNav: {
        wrapper: 'bg-white/80 backdrop-blur-xl border-t border-slate-200/60',
        divider: 'bg-slate-200/60',
        btnActive: 'text-[#007AFF] bg-[#007AFF]/5',
        btnInactive: 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/60',
        indicator: 'bg-[#007AFF] shadow-[0_0_10px_rgba(0,122,255,0.35)]',
      },
      drawer: {
        panel: 'bg-white/85 backdrop-blur-2xl border-r border-white/40 shadow-2xl',
        header: 'border-b border-slate-200/50 bg-white/70 backdrop-blur-xl',
        headerIcon: 'text-[#007AFF]',
        headerTitle: 'text-slate-900',
        sectionTitle: 'text-slate-500',
        sectionSub: 'text-slate-400',
        card: 'bg-white/80 border border-white/50 shadow-[0_4px_20px_-8px_rgba(0,0,0,0.05)]',
        segment: 'bg-[#767680]/10 rounded-[10px] p-1 border border-white/50',
        segmentBtnActive: 'bg-white text-slate-900 shadow-[0_4px_12px_-6px_rgba(0,0,0,0.18)]',
        segmentBtnInactive: 'text-slate-500 hover:text-slate-900',
        input: 'bg-[#767680]/10 border border-transparent text-slate-900 font-sans text-sm px-3 py-2 rounded-[10px] focus:outline-none focus:border-[#007AFF]/30 focus:bg-[#767680]/15 transition-all placeholder:text-slate-500',
        inputLocked: 'opacity-70 cursor-not-allowed',
        actionPrimary: 'bg-[#007AFF] hover:bg-[#1b86ff] text-white border border-transparent shadow-[0_8px_30px_-10px_rgba(0,122,255,0.35)]',
        actionDanger: 'bg-[#FF3B30]/10 border border-[#FF3B30]/40 text-[#FF3B30] hover:bg-[#FF3B30]/15',
      },
      hudBox: {
        wrapper: 'relative bg-white/80 backdrop-blur-xl border border-white/50 shadow-[0_4px_20px_-8px_rgba(0,0,0,0.1)]',
        corner: 'border-transparent',
      },
      joystick: {
        base: 'border border-slate-200/60 bg-white/70 backdrop-blur-xl shadow-[inset_0_0_20px_rgba(0,0,0,0.05)]',
        ring: 'border-slate-300/40',
        thumbActive: 'bg-[#007AFF]/15 border-[#007AFF]/40',
        thumbInactive: 'bg-white/80 border-slate-300/50',
        arrow: 'text-slate-400',
      },
      toast: {
        wrapper: 'bg-white/85 border border-white/50 text-slate-900 shadow-[0_8px_30px_-10px_rgba(0,0,0,0.2)]',
        close: 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/40',
      }
    }
  };

  const getMobileTheme = (uiStyle) => MOBILE_UI_THEMES[normalizeUiStyle(uiStyle)];

  window.MobileUtils = {
    Icon,
    NullIcon,
    normalizeUiStyle,
    getMobileTheme
  };
})();
