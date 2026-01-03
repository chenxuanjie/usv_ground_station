(function() {
  const { useEffect, useState } = React;
  const { Icon } = window.MobileUtils;
  const Ship = Icon('Ship');
  const Globe = Icon('Globe');
  const Network = Icon('Network');
  const Unplug = Icon('Unplug');
  const Link = Icon('Link');
  const Anchor = Icon('Anchor');
  const Video = Icon('Video');
  const CloudDownload = Icon('CloudDownload');
  const Repeat = Icon('Repeat');
  const Save = Icon('Save');

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
    const deployTrans = (() => {
      const curLang = lang === 'zh' ? 'zh' : 'en';
      if (typeof AppTranslations !== 'undefined' && AppTranslations && AppTranslations[curLang]) return AppTranslations[curLang];
      return null;
    })();

    const [keyboardSelected, setKeyboardSelected] = useState(false);

    useEffect(() => {
      if (controlMode !== '@') setKeyboardSelected(false);
    }, [controlMode]);

    const handleDeployClick = () => {
      const ok = typeof sendSCommand === 'function' ? sendSCommand() : false;
      if (ok) {
        if (window.SystemToast && typeof window.SystemToast.show === 'function') {
          window.SystemToast.show(deployTrans ? deployTrans.toast_deploy_success : (lang === 'zh' ? '部署配置成功' : 'Deploy config succeeded'), { type: 'success', durationMs: 2500 });
        }
        return;
      }

      if (window.SystemToast && typeof window.SystemToast.show === 'function') {
        window.SystemToast.show(deployTrans ? deployTrans.toast_deploy_failed : (lang === 'zh' ? '部署配置失败：未连接设备' : 'Deploy config failed: not connected'), { type: 'error', durationMs: 4500 });
      }
    };

    const TechHeader = ({ icon: IconComp, title, sub }) => (
      <div className="flex items-end justify-between border-b border-cyber-primary/30 pb-1 mb-4 mt-6">
        <div className="flex items-center gap-2 text-cyber-primary">
          <IconComp className="w-4 h-4" />
          <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-cyan-100">{title}</h3>
        </div>
        {sub && <span className="text-[10px] font-mono text-cyan-500/60">{sub}</span>}
      </div>
    );

    const ModeButton = ({ active, label, sub, onClick, colorClass = "cyan" }) => {
      const activeTheme = (() => {
        if (colorClass === 'purple') return 'bg-purple-500/10 border-purple-400 text-purple-400 shadow-[0_0_15px_rgba(6,182,212,0.15)]';
        if (colorClass === 'emerald') return 'bg-emerald-500/10 border-emerald-400 text-emerald-400 shadow-[0_0_15px_rgba(6,182,212,0.15)]';
        return 'bg-cyan-500/10 border-cyan-400 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.15)]';
      })();

      const activeOverlay = (() => {
        if (colorClass === 'purple') return 'bg-purple-400/5';
        if (colorClass === 'emerald') return 'bg-emerald-400/5';
        return 'bg-cyan-400/5';
      })();

      const activeCorner = (() => {
        if (colorClass === 'purple') return 'border-purple-400';
        if (colorClass === 'emerald') return 'border-emerald-400';
        return 'border-cyan-400';
      })();

      return (
        <button
          onClick={onClick}
          className={`
            relative flex flex-col items-center justify-center py-3 border transition-all duration-200 clip-path-slant
            ${active ? activeTheme : 'bg-transparent border-slate-700 text-slate-500 hover:border-slate-500 hover:text-slate-300'}
          `}
        >
          {active && <div className={`absolute inset-0 ${activeOverlay} animate-pulse`}></div>}
          <span className="text-sm font-bold z-10">{label}</span>
          <span className="text-[9px] font-mono opacity-70 z-10">{sub}</span>
          {active && (
            <>
              <div className={`absolute top-0 left-0 w-1.5 h-1.5 border-t border-l ${activeCorner}`}></div>
              <div className={`absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r ${activeCorner}`}></div>
            </>
          )}
        </button>
      );
    };

    const TechToggle = ({ label, icon: IconComp, checked, onChange, activeColor = "text-cyan-400" }) => (
      <div
        onClick={() => onChange(!checked)}
        className={`
          flex items-center justify-between p-3 mb-2 rounded border cursor-pointer transition-all duration-300
          ${checked ? 'bg-cyan-900/20 border-cyan-500/50 shadow-glow-inset' : 'bg-transparent border-white/5 hover:border-white/10 hover:bg-white/5'}
        `}
      >
        <div className="flex items-center gap-3">
          <IconComp className={`w-4 h-4 ${checked ? activeColor : 'text-slate-500'}`} />
          <span className={`text-xs font-bold uppercase tracking-wider ${checked ? 'text-white' : 'text-slate-400'}`}>{label}</span>
        </div>

        <div className="flex items-center gap-2">
          <span aria-hidden="true" className={`text-[9px] font-mono w-6 text-right ${checked ? 'text-cyan-400' : 'text-slate-600'}`}></span>
          <div className={`w-8 h-1 rounded-sm ${checked ? 'bg-cyan-400 shadow-glow' : 'bg-slate-700'}`}></div>
        </div>
      </div>
    );

    return (
      <>
        {open && <div className="absolute inset-0 bg-black/60 z-50 backdrop-blur-sm transition-opacity" onClick={onClose} />}
        <div className={`absolute top-0 left-0 h-full w-72 bg-slate-950/95 border-r border-cyan-500/30 z-[55] transform transition-transform duration-300 ease-out flex flex-col ${open ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="h-16 flex items-center px-4 border-b border-cyan-500/20 bg-gradient-to-b from-slate-900 via-slate-900/80 to-transparent">
            <Ship className="text-cyan-400 mr-2 w-5 h-5" />
            <span className="text-cyan-100 font-mono font-bold tracking-wider text-sm">USV CONTROL</span>
          </div>

          <div className="flex-1 p-4 space-y-6 overflow-y-auto">
            <div>
              <TechHeader icon={Globe} title={t.language} />
              <div className="flex bg-slate-900 rounded p-1 border border-slate-800">
                <button onClick={() => setLang('en')} className={`flex-1 py-1.5 text-xs font-mono rounded transition-colors ${lang === 'en' ? 'bg-cyan-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>EN</button>
                <button onClick={() => setLang('zh')} className={`flex-1 py-1.5 text-xs font-mono rounded transition-colors ${lang === 'zh' ? 'bg-cyan-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>中文</button>
              </div>
            </div>

            <div className="h-px bg-cyan-900/30 w-full"></div>

            <div>
              <TechHeader icon={Network} title={t.connection} />
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
              <TechHeader icon={Anchor} title="Deployment" sub="OP_MODE" />

              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-2">
                  <ModeButton
                    label={lang === 'zh' ? '手动' : 'MANUAL'}
                    sub="MANUAL"
                    active={controlMode === '@' && !keyboardSelected}
                    onClick={() => {
                      setKeyboardSelected(false);
                      setControlMode && setControlMode('@');
                    }}
                    colorClass="cyan"
                  />
                  <ModeButton
                    label={lang === 'zh' ? '键盘' : 'KEYBOARD'}
                    sub="KEYBOARD"
                    active={controlMode === '@' && keyboardSelected}
                    onClick={() => {
                      setKeyboardSelected(true);
                      setControlMode && setControlMode('@');
                    }}
                    colorClass="purple"
                  />
                  <ModeButton
                    label={lang === 'zh' ? '自动' : 'AUTO'}
                    sub="AUTO"
                    active={controlMode === '#'}
                    onClick={() => {
                      setKeyboardSelected(false);
                      setControlMode && setControlMode('#');
                    }}
                    colorClass="emerald"
                  />
                </div>

                <div className="tech-border p-2">
                  <TechToggle
                    label="Video Feed (图传)"
                    icon={Video}
                    checked={!!streamOn}
                    onChange={() => setStreamOn && setStreamOn(!streamOn)}
                    activeColor="text-blue-400"
                  />
                  <TechToggle
                    label="Telemetry (数据)"
                    icon={CloudDownload}
                    checked={!!recvOn}
                    onChange={() => setRecvOn && setRecvOn(!recvOn)}
                    activeColor="text-purple-400"
                  />
                  <TechToggle
                    label="循环模式 (Loop Mode)"
                    icon={Repeat}
                    checked={cruiseMode === '1'}
                    onChange={() => setCruiseMode && setCruiseMode(cruiseMode === '1' ? '0' : '1')}
                    activeColor="text-yellow-400"
                  />
                </div>

                <div className="hidden tech-border p-4">
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-2 text-cyan-500">
                      <span className="text-[10px] font-bold uppercase tracking-wider">Speed Limit</span>
                    </div>
                    <div className="font-mono text-cyan-300 text-lg">
                      0 <span className="text-xs text-slate-500">m/s</span>
                    </div>
                  </div>
                  <input type="range" min="0" max="10" step="0.1" value={0} readOnly className="w-full" />
                </div>

                <div className="pt-4 pb-2">
                  <button
                    onClick={handleDeployClick}
                    className="w-full py-3 bg-cyan-600/90 hover:bg-cyan-500 text-white font-bold text-xs tracking-[0.15em] uppercase flex items-center justify-center gap-2 clip-path-slant transition-colors shadow-glow"
                  >
                    <Save className="w-4 h-4" />
                    {lang === 'zh' ? (deployTrans ? deployTrans.deploy_config : '部署配置') : 'Deploy setting'}
                  </button>
                </div>
              </div>
            </div>

            <div className="h-px bg-cyan-900/30 w-full"></div>
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
