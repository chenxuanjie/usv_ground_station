(function() {
  const { memo } = React;
  const { Icon } = window.MobileUtils;
  const Menu = Icon('Menu');
  const Settings = Icon('Settings');
  const Wifi = Icon('Wifi');

  const StatusBar = memo(({ title, signal, tcpStatus, setSideDrawerOpen, onOpenSettings, t }) => {
    const tcpText = `TCP ${tcpStatus === 'ONLINE' ? 'ONLINE' : (tcpStatus === 'CONNECTING' ? 'CONNECTING' : 'OFFLINE')}`;
    const wsText = 'WS';
    const linkText = 'LINK';
    const rtkText = 'RTK FLOAT';

    return (
      <div className="absolute top-0 w-full h-16 z-30 px-4 flex justify-between items-center bg-gradient-to-b from-slate-900 via-slate-900/80 to-transparent pointer-events-none">
      <div className="flex items-center gap-3 pointer-events-auto">
        <button
          onClick={() => setSideDrawerOpen(true)}
          className="w-10 h-10 flex items-center justify-center border border-cyan-500/50 bg-cyan-900/20 rounded hover:bg-cyan-500/20 active:scale-95 transition-all"
        >
          <Menu className="text-cyan-400 w-5 h-5" />
        </button>
        <div>
          <h1 className="font-mono font-bold text-lg text-cyan-50 tracking-wider flex items-center gap-2 drop-shadow-[0_0_5px_rgba(34,211,238,0.8)]">
            {title}
          </h1>
          <div className="flex items-center gap-3 text-[10px] font-mono">
            <span className={`flex items-center gap-1 ${tcpStatus === 'ONLINE' ? 'text-green-400' : (tcpStatus === 'CONNECTING' ? 'text-amber-400' : 'text-red-400')}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${tcpStatus === 'ONLINE' ? 'bg-green-500 animate-pulse' : (tcpStatus === 'CONNECTING' ? 'bg-amber-500 animate-pulse' : 'bg-red-500')}`}></div>
              {tcpText}
            </span>
            <span className="flex items-center gap-1 text-cyan-300/70">
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse"></div>
              {wsText}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 pointer-events-auto">
        <button
          onClick={onOpenSettings}
          className="w-10 h-10 flex items-center justify-center border border-cyan-500/50 bg-slate-900/40 rounded hover:bg-cyan-500/10 active:scale-95 transition-all"
        >
          <Settings className="text-cyan-400 w-5 h-5" />
        </button>
        <div className="flex flex-col items-end">
          <div className="flex items-center gap-1 text-xs font-mono font-bold text-cyan-400">
            <Wifi className="w-3 h-3" /> {linkText}: {signal.toFixed(0)}%
          </div>
          <span className="text-[10px] text-slate-400 font-mono">{rtkText}</span>
        </div>
      </div>
    </div>
    );
  });

  window.MobileComponents = window.MobileComponents || {};
  window.MobileComponents.StatusBar = StatusBar;
})();
