(function () {
  if (!window.MobileUtils || typeof window.MobileUtils.registerTheme !== 'function') return;

  window.MobileUtils.registerTheme('ios', {
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
      segment: 'flex gap-1 bg-[#767680]/10 rounded-[10px] p-1 border border-white/50',
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
  });
})();

