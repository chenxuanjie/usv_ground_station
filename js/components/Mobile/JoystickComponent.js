(function() {
  const { Icon } = window.MobileUtils;
  const ChevronUp = Icon('ChevronUp');

  const JoystickComponent = ({ joystickActive, setJoystickActive, joystickPosition, setJoystickPosition, handleJoyMove, joystickDisabled, uiStyle }) => {
    const ui = window.MobileUtils && typeof window.MobileUtils.getMobileTheme === 'function'
      ? window.MobileUtils.getMobileTheme(uiStyle)
      : null;
    const isIos = ui && ui.key === 'ios';
    const base = ui?.joystick?.base || 'border border-cyan-500/20 bg-slate-900/40 backdrop-blur-sm shadow-[inset_0_0_20px_rgba(6,182,212,0.1)]';
    const ring = ui?.joystick?.ring || 'border-cyan-500/30';
    const thumbActive = ui?.joystick?.thumbActive || 'bg-cyan-500/20 border-cyan-400';
    const thumbInactive = ui?.joystick?.thumbInactive || 'bg-slate-800/80 border-cyan-800';
    const arrow = ui?.joystick?.arrow || 'text-cyan-500/50';
    const thumbShadow = isIos ? 'shadow-[0_10px_25px_-15px_rgba(0,0,0,0.35)]' : 'shadow-[0_0_15px_rgba(6,182,212,0.4)]';
    const dotInactive = isIos ? 'bg-[#007AFF]' : 'bg-cyan-600';

    return (
      <div className={`absolute bottom-24 right-6 z-20 transition-opacity ${joystickDisabled ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
      <div
        className={`w-32 h-32 rounded-full flex items-center justify-center relative touch-none cursor-move pointer-events-auto ${base}`}
        onPointerDown={(e) => {
          if (joystickDisabled) return;
          e.preventDefault();
          try { e.currentTarget.setPointerCapture(e.pointerId); } catch (_) {}
          setJoystickActive(true);
          const rect = e.currentTarget.getBoundingClientRect();
          handleJoyMove(e.clientX, e.clientY, rect);
        }}
        onPointerMove={(e) => {
          if (joystickDisabled) return;
          if (!joystickActive && !(e.buttons === 1 || e.pressure > 0)) return;
          e.preventDefault();
          const rect = e.currentTarget.getBoundingClientRect();
          handleJoyMove(e.clientX, e.clientY, rect);
        }}
        onPointerUp={() => { setJoystickActive(false); setJoystickPosition({ x: 0, y: 0 }); }}
        onPointerCancel={() => { setJoystickActive(false); setJoystickPosition({ x: 0, y: 0 }); }}
      >
        <div className={`absolute inset-2 rounded-full border border-dashed ${ring} animate-[spin_10s_linear_infinite]`}></div>
        <div className="absolute inset-8 rounded-full border border-cyan-500/10"></div>
        <div
          className={`w-14 h-14 rounded-full border-2 ${thumbShadow} flex items-center justify-center transition-transform duration-75 relative z-10 ${
            joystickActive ? `${thumbActive} scale-95` : thumbInactive
          }`}
          style={{ transform: `translate(${joystickPosition.x}px, ${joystickPosition.y}px)` }}
        >
          <div className={`w-2 h-2 rounded-full ${joystickActive ? 'bg-white shadow-[0_0_10px_white]' : dotInactive}`}></div>
        </div>
        <ChevronUp className={`absolute top-3 ${arrow} w-4 h-4`} />
        <ChevronUp className={`absolute bottom-3 ${arrow} w-4 h-4 rotate-180`} />
        <ChevronUp className={`absolute left-3 ${arrow} w-4 h-4 -rotate-90`} />
        <ChevronUp className={`absolute right-3 ${arrow} w-4 h-4 rotate-90`} />
      </div>
    </div>
    );
  };

  window.MobileComponents = window.MobileComponents || {};
  window.MobileComponents.JoystickComponent = JoystickComponent;
})();
