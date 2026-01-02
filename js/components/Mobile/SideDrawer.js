(function() {
  const { Icon } = window.MobileUtils;
  const Ship = Icon('Ship');
  const Globe = Icon('Globe');
  const Network = Icon('Network');
  const RefreshCw = Icon('RefreshCw');
  const UploadCloud = Icon('UploadCloud');
  const Unplug = Icon('Unplug');
  const Link = Icon('Link');

  const SideDrawer = ({
    open,
    onClose,
    lang,
    setLang,
    serverIp,
    setServerIp,
    serverPort,
    setServerPort,
    tcpStatus,
    toggleConnection,
    streamOn,
    setStreamOn,
    recvOn,
    setRecvOn,
    controlMode,
    setControlMode,
    cruiseMode,
    setCruiseMode,
    sendSCommand,
    sendWaypointsCommand
  }) => {
    const t = window.MobileTranslations[lang] || window.MobileTranslations.en;
    const isConnected = tcpStatus === 'ONLINE';
    const isLocked = tcpStatus === 'ONLINE' || tcpStatus === 'CONNECTING';

    return (
      <>
        {open && <div className="absolute inset-0 bg-black/60 z-50 backdrop-blur-sm transition-opacity" onClick={onClose} />}
        <div className={`absolute top-0 left-0 h-full w-72 bg-slate-950/95 border-r border-cyan-500/30 z-[55] transform transition-transform duration-300 ease-out flex flex-col ${open ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="h-16 flex items-center px-4 border-b border-cyan-500/20 bg-cyan-900/10">
            <Ship className="text-cyan-400 mr-2 w-5 h-5" />
            <span className="text-cyan-100 font-mono font-bold tracking-wider">USV CONTROL</span>
          </div>

          <div className="flex-1 p-4 space-y-6 overflow-y-auto">
            <div>
              <div className="text-[10px] text-slate-500 font-mono mb-2 flex items-center gap-1">
                <Globe className="w-3 h-3" /> {t.language}
              </div>
              <div className="flex bg-slate-900 rounded p-1 border border-slate-800">
                <button onClick={() => setLang('en')} className={`flex-1 py-1.5 text-xs font-mono rounded transition-colors ${lang === 'en' ? 'bg-cyan-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>EN</button>
                <button onClick={() => setLang('zh')} className={`flex-1 py-1.5 text-xs font-mono rounded transition-colors ${lang === 'zh' ? 'bg-cyan-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>中文</button>
              </div>
            </div>

            <div className="h-px bg-cyan-900/30 w-full"></div>

            <div>
              <div className="text-[10px] text-slate-500 font-mono mb-2 flex items-center gap-1">
                <Network className="w-3 h-3" /> {t.connection}
              </div>
              <div className={`bg-slate-900/50 p-3 rounded border ${isConnected ? 'border-green-500/30' : 'border-slate-800'} space-y-3`}>
                <div className="space-y-1">
                  <label className="text-[9px] text-cyan-600 font-mono block">{t.ip}</label>
                  <input
                    type="text"
                    value={serverIp}
                    onChange={(e) => setServerIp(e.target.value)}
                    disabled={isLocked}
                    className={`w-full bg-slate-950 border text-cyan-100 font-mono text-xs px-2 py-1.5 rounded focus:outline-none focus:border-cyan-500 transition-colors ${isLocked ? 'border-green-500/30 text-green-100 opacity-80 cursor-not-allowed' : 'border-slate-700'}`}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] text-cyan-600 font-mono block">{t.port}</label>
                  <input
                    type="text"
                    value={serverPort}
                    onChange={(e) => setServerPort(e.target.value)}
                    disabled={isLocked}
                    className={`w-full bg-slate-950 border text-cyan-100 font-mono text-xs px-2 py-1.5 rounded focus:outline-none focus:border-cyan-500 transition-colors ${isLocked ? 'border-green-500/30 text-green-100 opacity-80 cursor-not-allowed' : 'border-slate-700'}`}
                  />
                </div>
                <button
                  onClick={toggleConnection}
                  className={`w-full py-2 mt-2 font-mono text-xs font-bold border rounded flex items-center justify-center gap-2 transition-all duration-300 ${
                    isConnected
                      ? 'bg-red-500/10 border-red-500/50 text-red-400 hover:bg-red-500/20'
                      : 'bg-cyan-600 hover:bg-cyan-500 text-white border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                  }`}
                >
                  {isConnected ? (
                    <><Unplug className="w-4 h-4" /> {t.disconnect_btn}</>
                  ) : (
                    <><Link className="w-4 h-4" /> {t.connect_btn}</>
                  )}
                </button>
              </div>
            </div>

            <div className="h-px bg-cyan-900/30 w-full"></div>

            <div>
              <div className="text-[10px] text-slate-500 font-mono mb-2 flex items-center gap-1">
                <RefreshCw className="w-3 h-3" /> {t.mode_switch}
              </div>
              <div className="space-y-2">
                <button onClick={() => setControlMode('@')} className={`w-full py-3 px-4 border rounded flex items-center justify-between transition-all ${controlMode === '@' ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.2)]' : 'border-slate-800 bg-slate-900 text-slate-400'}`}>
                  <span className="font-mono text-xs font-bold">{t.manual}</span>
                  <div className={`w-2 h-2 rounded-full ${controlMode === '@' ? 'bg-cyan-400' : 'bg-slate-600'}`}></div>
                </button>
                <button onClick={() => setControlMode('#')} className={`w-full py-3 px-4 border rounded flex items-center justify-between transition-all ${controlMode === '#' ? 'border-purple-500 bg-purple-500/10 text-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.2)]' : 'border-slate-800 bg-slate-900 text-slate-400'}`}>
                  <span className="font-mono text-xs font-bold">{t.auto}</span>
                  <div className={`w-2 h-2 rounded-full ${controlMode === '#' ? 'bg-purple-400' : 'bg-slate-600'}`}></div>
                </button>
                <button onClick={() => setCruiseMode(cruiseMode === '1' ? '0' : '1')} className={`w-full py-3 px-4 border rounded flex items-center justify-between transition-all ${cruiseMode === '1' ? 'border-green-500 bg-green-500/10 text-green-400 shadow-[0_0_10px_rgba(34,197,94,0.2)]' : 'border-slate-800 bg-slate-900 text-slate-400'}`}>
                  <span className="font-mono text-xs font-bold">{t.cruise}</span>
                  <div className={`w-2 h-2 rounded-full ${cruiseMode === '1' ? 'bg-green-400' : 'bg-slate-600'}`}></div>
                </button>
              </div>
            </div>

            <div className="h-px bg-cyan-900/30 w-full"></div>

            <div className="space-y-2">
              <button onClick={() => sendSCommand && sendSCommand()} className="w-full py-3 px-4 border border-cyan-500/40 bg-cyan-500/10 text-cyan-300 rounded font-mono text-xs font-bold tracking-wider hover:bg-cyan-500/15 transition-colors">
                DEPLOY_CONFIG (S)
              </button>
              <button onClick={() => sendWaypointsCommand && sendWaypointsCommand()} className="w-full py-3 px-4 border border-green-500/40 bg-green-500/10 text-green-300 rounded font-mono text-xs font-bold tracking-wider hover:bg-green-500/15 transition-colors flex items-center justify-center gap-2">
                <UploadCloud className="w-4 h-4" /> {t.deploy_mission}
              </button>
              <div className="grid grid-cols-2 gap-2 pt-2">
                <button onClick={() => setStreamOn && setStreamOn(!streamOn)} className={`py-2 border rounded text-[10px] font-mono font-bold tracking-wider transition-colors ${streamOn ? 'border-cyan-500/50 bg-cyan-500/10 text-cyan-300' : 'border-slate-800 bg-slate-900 text-slate-500'}`}>
                  STREAM_{streamOn ? 'ON' : 'OFF'}
                </button>
                <button onClick={() => setRecvOn && setRecvOn(!recvOn)} className={`py-2 border rounded text-[10px] font-mono font-bold tracking-wider transition-colors ${recvOn ? 'border-cyan-500/50 bg-cyan-500/10 text-cyan-300' : 'border-slate-800 bg-slate-900 text-slate-500'}`}>
                  RECV_{recvOn ? 'ON' : 'OFF'}
                </button>
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-cyan-900/30 bg-slate-900/50 text-[10px] text-slate-600 font-mono text-center">
            USV_GCS MOBILE
          </div>
        </div>
      </>
    );
  };

  window.MobileComponents = window.MobileComponents || {};
  window.MobileComponents.SideDrawer = SideDrawer;
})();
