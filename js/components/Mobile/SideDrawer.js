(function() {
  const { useEffect, useState, useRef } = React;
  const { Icon } = window.MobileUtils;
  const Ship = Icon('Ship');
  const Globe = Icon('Globe');
  const Wifi = Icon('Wifi');
  const Help = Icon('Help');
  const Unplug = Icon('Unplug');
  const Link = Icon('Link');
  const Anchor = Icon('Anchor');
  const Video = Icon('Video');
  const CloudDownload = Icon('CloudDownload');
  const Repeat = Icon('Repeat');
  const Save = Icon('Save');
  const Check = Icon('Check');

  const SideDrawer = ({
    open,
    onClose,
    lang,
    setLang,
    uiStyle,
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
    keyboardSelected: keyboardSelectedProp,
    setKeyboardSelected: setKeyboardSelectedProp,
    cruiseMode,
    setCruiseMode,
    sendSCommand,
    sendWaypointsCommand
  }) => {
    const ui = window.MobileUtils && typeof window.MobileUtils.getMobileTheme === 'function'
      ? window.MobileUtils.getMobileTheme(uiStyle)
      : null;
    const isIos = ui && ui.key === 'ios';

    const t = window.MobileTranslations[lang] || window.MobileTranslations.en;
    const tZh = window.MobileTranslations && window.MobileTranslations.zh ? window.MobileTranslations.zh : (window.MobileTranslations && window.MobileTranslations.en ? window.MobileTranslations.en : {});
    const tEn = window.MobileTranslations && window.MobileTranslations.en ? window.MobileTranslations.en : {};
    const isConnected = tcpStatus === 'ONLINE';
    const isLocked = tcpStatus === 'ONLINE' || tcpStatus === 'CONNECTING';
    const deployTrans = (() => {
      const curLang = lang === 'zh' ? 'zh' : 'en';
      if (typeof AppTranslations !== 'undefined' && AppTranslations && AppTranslations[curLang]) return AppTranslations[curLang];
      return null;
    })();

    const [keyboardSelectedInternal, setKeyboardSelectedInternal] = useState(false);
    const keyboardSelected = typeof keyboardSelectedProp === 'boolean' ? keyboardSelectedProp : keyboardSelectedInternal;
    const setKeyboardSelected = typeof setKeyboardSelectedProp === 'function' ? setKeyboardSelectedProp : setKeyboardSelectedInternal;
    const [hasDeployedThisSession, setHasDeployedThisSession] = useState(false);
    const [deployStatus, setDeployStatus] = useState('idle'); // 'idle' | 'dispatched'
    const prevTcpStatusRef = useRef(tcpStatus);
    const deployCloseTimerRef = useRef(null);

    useEffect(() => {
      return () => {
        if (deployCloseTimerRef.current) window.clearTimeout(deployCloseTimerRef.current);
      };
    }, []);

    useEffect(() => {
      if (controlMode !== '@') setKeyboardSelected(false);
    }, [controlMode, setKeyboardSelected]);

    useEffect(() => {
      const prev = prevTcpStatusRef.current;
      prevTcpStatusRef.current = tcpStatus;
      if (tcpStatus !== 'ONLINE') {
        setHasDeployedThisSession(false);
        setDeployStatus('idle');
        return;
      }
      if (prev !== 'ONLINE') setHasDeployedThisSession(false);
    }, [tcpStatus]);

    useEffect(() => {
      setHasDeployedThisSession(false);
    }, [streamOn, recvOn, controlMode, cruiseMode]);

    useEffect(() => {
      if (!open) {
        setDeployStatus('idle');
        if (deployCloseTimerRef.current) {
          window.clearTimeout(deployCloseTimerRef.current);
          deployCloseTimerRef.current = null;
        }
      }
    }, [open]);

    const handleDeployClick = () => {
      const ok = typeof sendSCommand === 'function' ? sendSCommand() : false;
      if (ok) {
        setDeployStatus('dispatched');
        setHasDeployedThisSession(true);
        if (window.SystemToast && typeof window.SystemToast.show === 'function') {
          window.SystemToast.show(t.toast_deploy_success, { type: 'success', durationMs: 2500 });
        }
        if (typeof onClose === 'function') {
          if (deployCloseTimerRef.current) window.clearTimeout(deployCloseTimerRef.current);
          deployCloseTimerRef.current = window.setTimeout(() => {
            deployCloseTimerRef.current = null;
            onClose();
          }, 160);
        }
        return;
      }

      if (window.SystemToast && typeof window.SystemToast.show === 'function') {
        window.SystemToast.show(t.toast_deploy_failed, { type: 'error', durationMs: 4500 });
      }
    };

    const TechHeader = ({ icon: IconComp, title, sub }) => (
      <div className={`flex items-end justify-between pb-1 mb-4 ${isIos ? 'mt-5 border-b border-slate-200/60' : 'mt-6 border-b border-cyan-500/20'}`}>
        <div className={`flex items-center gap-2 ${ui?.accentText || 'text-cyan-400'}`}>
          <IconComp className="w-4 h-4" />
          <h3 className={`text-xs font-bold uppercase tracking-[0.15em] ${ui?.drawer?.sectionTitle || (isIos ? 'text-slate-600' : 'text-cyan-100/80')}`}>{title}</h3>
        </div>
        {sub && <span className={`text-[10px] ${isIos ? 'font-sans' : 'font-mono'} ${ui?.drawer?.sectionSub || 'text-cyan-500/60'}`}>{sub}</span>}
      </div>
    );

    const ModeButton = ({ active, label, sub, onClick, colorClass = "cyan" }) => {
      if (isIos) {
        return (
          <button
            onClick={onClick}
            className={`relative flex flex-col items-center justify-center py-3 px-2 border transition-all duration-200 rounded-[14px] active:scale-[0.98] ${
              active
                ? 'bg-[#007AFF] text-white border-[#007AFF]/30 shadow-[0_8px_30px_-10px_rgba(0,122,255,0.35)]'
                : 'bg-white/70 border-white/50 text-slate-600 hover:bg-white/80'
            }`}
          >
            <span className="text-sm font-semibold z-10">{label}</span>
            <span className="text-[9px] font-mono opacity-70 z-10">{sub}</span>
          </button>
        );
      }

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
      isIos ? (
        <div
          onClick={() => onChange(!checked)}
          className={`flex items-center justify-between px-4 py-3 mb-2 rounded-[14px] border border-white/50 bg-white/80 shadow-[0_4px_20px_-8px_rgba(0,0,0,0.05)] cursor-pointer transition-all duration-200 active:scale-[0.99] ${checked ? '' : 'hover:bg-white/90'}`}
        >
          <div className="flex items-center gap-3">
            <IconComp className={`w-4 h-4 ${checked ? 'text-[#007AFF]' : 'text-slate-400'}`} />
            <span className="text-[13px] font-medium text-slate-900">{label}</span>
          </div>
          <div className={`w-11 h-6 rounded-full flex items-center px-0.5 transition-colors ${checked ? 'bg-[#34C759]' : 'bg-slate-300'}`}>
            <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`}></div>
          </div>
        </div>
      ) : (
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
      )
    );

    const drawerWidthClass = isIos ? 'w-[82%] max-w-[320px]' : 'w-72';
    const cardRadiusClass = isIos ? 'rounded-[22px]' : 'rounded';
    const cardBase = ui?.drawer?.card || 'bg-slate-900/50 border border-slate-800';

    return (
      <>
        {open && <div className={`absolute inset-0 z-50 transition-opacity ${ui?.overlay || 'bg-black/60 backdrop-blur-sm'}`} onClick={onClose} />}
        <div className={`absolute top-0 left-0 h-full ${drawerWidthClass} z-[55] transform transition-transform duration-300 ease-out flex flex-col ${ui?.drawer?.panel || 'bg-slate-950/95 border-r border-cyan-500/30'} ${open ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className={`h-16 flex items-center px-4 ${ui?.drawer?.header || 'border-b border-cyan-500/20 bg-gradient-to-b from-slate-900 via-slate-900/80 to-transparent'}`}>
            <Ship className={`${ui?.drawer?.headerIcon || 'text-cyan-400'} mr-2 w-5 h-5`} />
            <span className={`${isIos ? 'font-sans font-bold tracking-tight text-[15px]' : 'font-mono font-bold tracking-wider text-sm'} ${ui?.drawer?.headerTitle || 'text-cyan-100'}`}>{t.usv_control}</span>
          </div>

          <div className="flex-1 p-4 space-y-6 overflow-y-auto">
            <div>
              <TechHeader icon={Globe} title={t.language} />
              <div className={ui?.drawer?.segment || "flex bg-slate-900 rounded p-1 border border-slate-800"}>
                <button
                  onClick={() => setLang('en')}
                  className={`flex-1 py-1.5 text-xs rounded transition-colors ${isIos ? 'font-semibold' : 'font-mono'} ${lang === 'en' ? (ui?.drawer?.segmentBtnActive || 'bg-cyan-600 text-white shadow-lg') : (ui?.drawer?.segmentBtnInactive || 'text-slate-400 hover:text-white')}`}
                >
                  EN
                </button>
                <button
                  onClick={() => setLang('zh')}
                  className={`flex-1 py-1.5 text-xs rounded transition-colors ${isIos ? 'font-semibold' : 'font-mono'} ${lang === 'zh' ? (ui?.drawer?.segmentBtnActive || 'bg-cyan-600 text-white shadow-lg') : (ui?.drawer?.segmentBtnInactive || 'text-slate-400 hover:text-white')}`}
                >
                  中文
                </button>
              </div>
            </div>

            <div className={`h-px w-full ${ui?.divider || 'bg-cyan-900/30'}`}></div>

            <div>
              <TechHeader icon={Wifi} title={t.connection} />
              <div className={`${cardBase} ${cardRadiusClass} p-3 space-y-3 ${isConnected ? 'border-green-500/30' : ''}`}>
                {isIos ? (
                  <>
                    <div className="space-y-1">
                      <label className="text-[11px] text-slate-400 font-semibold tracking-wider uppercase block">{t.ip}</label>
                      <input
                        type="text"
                        value={serverIp}
                        onChange={(e) => setServerIp(e.target.value)}
                        disabled={isLocked}
                        className={`w-full border transition-colors ${ui?.drawer?.input || 'bg-slate-950 border-slate-700 text-cyan-100 font-mono text-xs px-2 py-1.5 rounded focus:outline-none focus:border-cyan-500'} ${isLocked ? (ui?.drawer?.inputLocked || 'border-green-500/30 text-green-100 opacity-80 cursor-not-allowed') : ''}`}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] text-slate-400 font-semibold tracking-wider uppercase block">{t.port}</label>
                      <input
                        type="text"
                        value={serverPort}
                        onChange={(e) => setServerPort(e.target.value)}
                        disabled={isLocked}
                        className={`w-full border transition-colors ${ui?.drawer?.input || 'bg-slate-950 border-slate-700 text-cyan-100 font-mono text-xs px-2 py-1.5 rounded focus:outline-none focus:border-cyan-500'} ${isLocked ? (ui?.drawer?.inputLocked || 'border-green-500/30 text-green-100 opacity-80 cursor-not-allowed') : ''}`}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="relative group">
                      <div
                        className={`
                          flex items-center rounded px-3 py-2 border transition-all duration-300
                          ${isLocked ? 'bg-slate-950/40 border-green-500/30 opacity-85' : 'bg-slate-950/40 border-cyan-500/20'}
                          ${!isLocked ? 'focus-within:border-cyan-400 focus-within:shadow-[0_0_8px_rgba(6,182,212,0.25)]' : ''}
                        `}
                      >
                        <span className="text-[10px] font-bold text-slate-500 uppercase mr-3 min-w-[62px]">{t.ip}</span>
                        <input
                          type="text"
                          value={serverIp}
                          onChange={(e) => setServerIp(e.target.value)}
                          disabled={isLocked}
                          className={`flex-1 bg-transparent border-none font-mono text-sm focus:outline-none ${isLocked ? 'text-green-100 cursor-not-allowed' : 'text-cyan-400'}`}
                        />
                      </div>
                      <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-cyan-400/70 opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
                    </div>

                    <div className="relative group">
                      <div
                        className={`
                          flex items-center rounded px-3 py-2 border transition-all duration-300
                          ${isLocked ? 'bg-slate-950/40 border-green-500/30 opacity-85' : 'bg-slate-950/40 border-cyan-500/20'}
                          ${!isLocked ? 'focus-within:border-cyan-400 focus-within:shadow-[0_0_8px_rgba(6,182,212,0.25)]' : ''}
                        `}
                      >
                        <span className="text-[10px] font-bold text-slate-500 uppercase mr-3 min-w-[62px]">{t.port}</span>
                        <input
                          type="text"
                          value={serverPort}
                          onChange={(e) => setServerPort(e.target.value)}
                          disabled={isLocked}
                          className={`flex-1 bg-transparent border-none font-mono text-sm focus:outline-none ${isLocked ? 'text-green-100 cursor-not-allowed' : 'text-cyan-400'}`}
                        />
                      </div>
                      <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-cyan-400/70 opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
                    </div>
                  </>
                )}
                <button
                  onClick={toggleConnection}
                  className={`w-full py-2 mt-2 font-mono text-xs font-bold border rounded flex items-center justify-center gap-2 transition-all duration-300 ${isIos ? 'rounded-[14px]' : ''} ${
                    isConnected
                      ? (ui?.drawer?.actionDanger || 'bg-red-500/10 border-red-500/50 text-red-400 hover:bg-red-500/20')
                      : (ui?.drawer?.actionPrimary || 'bg-cyan-600 hover:bg-cyan-500 text-white border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.3)]')
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

            {isConnected && !hasDeployedThisSession && (
              <div className={`px-3 py-2 rounded border text-[10px] ${isIos ? 'font-sans' : 'font-mono'} border-amber-500/30 bg-amber-500/10 text-amber-100/80`}>
                <div className="flex items-start gap-2">
                  <Help className="w-4 h-4 text-amber-400 flex-none mt-0.5" />
                  <div className="min-w-0">
                    <div className="font-bold tracking-wider text-amber-200/90">{t.deploy_reminder_title}</div>
                    <div className="mt-0.5 text-amber-200/60">{t.deploy_reminder_desc}</div>
                  </div>
                </div>
              </div>
            )}

            <div className={`h-px w-full ${ui?.divider || 'bg-cyan-900/30'}`}></div>

            <div>
              <TechHeader icon={Anchor} title={t.deployment} sub={t.op_mode} />

              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-2">
                  <ModeButton
                    label={lang === 'zh' ? tZh.manual : tEn.manual}
                    sub={lang === 'zh' ? tEn.manual_sub : tZh.manual_sub}
                    active={controlMode === '@' && !keyboardSelected}
                    onClick={() => {
                      setKeyboardSelected(false);
                      setControlMode && setControlMode('@');
                    }}
                    colorClass="cyan"
                  />
                  <ModeButton
                    label={lang === 'zh' ? tZh.keyboard : tEn.keyboard}
                    sub={lang === 'zh' ? tEn.keyboard_sub : tZh.keyboard_sub}
                    active={controlMode === '@' && keyboardSelected}
                    onClick={() => {
                      setKeyboardSelected(true);
                      setControlMode && setControlMode('@');
                    }}
                    colorClass="purple"
                  />
                  <ModeButton
                    label={lang === 'zh' ? tZh.auto : tEn.auto}
                    sub={lang === 'zh' ? tEn.auto_sub : tZh.auto_sub}
                    active={controlMode === '#'}
                    onClick={() => {
                      setKeyboardSelected(false);
                      setControlMode && setControlMode('#');
                    }}
                    colorClass="emerald"
                  />
                </div>

                <div className={isIos ? `${cardBase} rounded-[22px] p-3` : 'tech-border p-2'}>
                  <TechToggle
                    label={t.video_feed}
                    icon={Video}
                    checked={!!streamOn}
                    onChange={() => setStreamOn && setStreamOn(!streamOn)}
                    activeColor="text-blue-400"
                  />
                  <TechToggle
                    label={t.telemetry}
                    icon={CloudDownload}
                    checked={!!recvOn}
                    onChange={() => setRecvOn && setRecvOn(!recvOn)}
                    activeColor="text-purple-400"
                  />
                  <TechToggle
                    label={t.loop_mode}
                    icon={Repeat}
                    checked={cruiseMode === '1'}
                    onChange={() => setCruiseMode && setCruiseMode(cruiseMode === '1' ? '0' : '1')}
                    activeColor="text-yellow-400"
                  />
                </div>

                <div className="hidden tech-border p-4">
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-2 text-cyan-500">
                      <span className="text-[10px] font-bold uppercase tracking-wider">{t.speed_limit}</span>
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
                    className={`w-full py-3 text-white font-bold text-xs tracking-[0.15em] uppercase flex items-center justify-center gap-2 transition-all ${
                      isIos
                        ? (deployStatus === 'dispatched'
                          ? 'bg-[#34C759] hover:bg-[#2fd157] rounded-[14px] shadow-[0_10px_36px_-14px_rgba(52,199,89,0.45)] active:scale-[0.99]'
                          : 'bg-[#007AFF] hover:bg-[#1b86ff] rounded-[14px] shadow-[0_8px_30px_-10px_rgba(0,122,255,0.35)] active:scale-[0.99]'
                        )
                        : (deployStatus === 'dispatched'
                          ? 'bg-green-600/90 hover:bg-green-500 clip-path-slant transition-colors shadow-[0_0_18px_rgba(34,197,94,0.35)]'
                          : 'bg-cyan-600/90 hover:bg-cyan-500 clip-path-slant transition-colors shadow-glow'
                        )
                    }`}
                  >
                    {deployStatus === 'dispatched' ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                    {deployStatus === 'dispatched' ? (t.deploy_dispatched || t.saved) : t.deploy_config}
                  </button>
                </div>
              </div>
            </div>

            <div className="h-px bg-cyan-900/30 w-full"></div>

            <div className="pt-6 pb-2">
              <div className="pt-4 flex flex-col items-center gap-2">
                <a
                  href="https://github.com/chenxuanjie/usv_ground_station"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={isIos
                    ? "group inline-flex items-center gap-2 px-3 py-2 rounded-[14px] border border-white/60 bg-white/70 backdrop-blur-xl text-[13px] font-sans text-slate-700 hover:text-[#007AFF] hover:bg-white/85 transition-colors shadow-[0_8px_30px_-18px_rgba(0,0,0,0.25)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007AFF]/30"
                    : "group inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-800 bg-slate-950/30 text-xs text-slate-400 hover:text-cyan-100 hover:border-cyan-400/60 hover:bg-cyan-500/10 hover:shadow-[0_0_18px_rgba(6,182,212,0.28)] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50"
                  }
                  title="https://github.com/chenxuanjie/usv_ground_station"
                  aria-label="Open usv_ground_station on GitHub"
                >
                  <svg className="w-4 h-4 opacity-70 group-hover:opacity-100 transition-opacity" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      fill="currentColor"
                      d="M12 .5a12 12 0 0 0-3.79 23.4c.6.11.82-.26.82-.58v-2.02c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.1-.75.08-.74.08-.74 1.21.09 1.85 1.25 1.85 1.25 1.08 1.84 2.83 1.31 3.52 1 .11-.78.42-1.31.76-1.61-2.66-.3-5.46-1.33-5.46-5.93 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.53.12-3.18 0 0 1.01-.32 3.3 1.23a11.4 11.4 0 0 1 6 0c2.29-1.55 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.61-2.8 5.62-5.47 5.92.43.37.81 1.1.81 2.22v3.29c0 .32.22.69.82.58A12 12 0 0 0 12 .5z"
                    />
                  </svg>
                  <span className="tracking-wider">GitHub · usv_ground_station</span>
                </a>
                <div className={`${isIos ? 'text-[11px] text-slate-500 font-sans' : 'text-[10px] text-slate-600 font-mono'} text-center`}>{t.mobile_footer}</div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  };

  window.MobileComponents = window.MobileComponents || {};
  window.MobileComponents.SideDrawer = SideDrawer;
})();
