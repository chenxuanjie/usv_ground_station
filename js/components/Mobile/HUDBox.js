(function() {
  const HUDBox = ({ children, className = "", noGlow = false }) => (
    <div className={`relative bg-slate-950/90 backdrop-blur-md border border-cyan-500/30 ${noGlow ? '' : 'shadow-[0_0_15px_-3px_rgba(6,182,212,0.15)]'} ${className}`}>
      <div className="absolute top-0 left-0 w-2 h-2 border-l-2 border-t-2 border-cyan-400"></div>
      <div className="absolute top-0 right-0 w-2 h-2 border-r-2 border-t-2 border-cyan-400"></div>
      <div className="absolute bottom-0 left-0 w-2 h-2 border-l-2 border-b-2 border-cyan-400"></div>
      <div className="absolute bottom-0 right-0 w-2 h-2 border-r-2 border-b-2 border-cyan-400"></div>
      {children}
    </div>
  );

  window.MobileComponents = window.MobileComponents || {};
  window.MobileComponents.HUDBox = HUDBox;
})();
