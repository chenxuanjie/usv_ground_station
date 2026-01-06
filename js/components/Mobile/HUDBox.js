(function() {
  const HUDBox = ({ children, className = "", noGlow = false, uiStyle }) => {
    const ui = window.MobileUtils && typeof window.MobileUtils.getMobileTheme === 'function'
      ? window.MobileUtils.getMobileTheme(uiStyle)
      : null;
    const isIos = ui && ui.key === 'ios';
    const wrapper = ui?.hudBox?.wrapper || 'relative bg-slate-950/90 backdrop-blur-md border border-cyan-500/30 shadow-[0_0_15px_-3px_rgba(6,182,212,0.15)]';
    const corner = ui?.hudBox?.corner || 'border-cyan-400';

    return (
      <div className={`${wrapper} ${noGlow ? 'shadow-none' : ''} ${className}`}>
        {!isIos && (
          <>
            <div className={`absolute top-0 left-0 w-2 h-2 border-l-2 border-t-2 ${corner}`}></div>
            <div className={`absolute top-0 right-0 w-2 h-2 border-r-2 border-t-2 ${corner}`}></div>
            <div className={`absolute bottom-0 left-0 w-2 h-2 border-l-2 border-b-2 ${corner}`}></div>
            <div className={`absolute bottom-0 right-0 w-2 h-2 border-r-2 border-b-2 ${corner}`}></div>
          </>
        )}
        {children}
      </div>
    );
  };

  window.MobileComponents = window.MobileComponents || {};
  window.MobileComponents.HUDBox = HUDBox;
})();
