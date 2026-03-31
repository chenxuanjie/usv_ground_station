(function() {
  const { useEffect, useState, useRef } = React;
  const { Icon } = window.MobileUtils;
  const MOBILE_STORAGE_KEYS = Object.freeze({
    autoExecLevel: 'mobile_auto_exec_level',
    deploymentMode: 'mobile_deployment_mode',
    deploymentKeyboardSelected: 'mobile_deployment_keyboard_selected',
    waypointGuidance: 'mobile_waypoint_guidance',
    waypointController: 'mobile_waypoint_controller'
  });
  const DEPLOY_CONTROL_PLANNER_MAP = Object.freeze({
    'A*': '2',
    'Hybrid A*': '3',
    'DWA': '4'
  });
  const Ship = Icon('Ship');
  const Globe = Icon('Globe');
  const Wifi = Icon('Wifi');
  const Help = Icon('Help');
  const Unplug = Icon('Unplug');
  const Link = Icon('Link');
  const Anchor = Icon('Anchor');
  const Waypoints = Icon('Waypoints');
  const FileText = Icon('FileText');
  const Video = Icon('Video');
  const CloudDownload = Icon('CloudDownload');
  const Repeat = Icon('Repeat');
  const Save = Icon('Save');
  const Send = Icon('Send');
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
    waypointsCount,
    sendSCommand,
    controlFrameConfig,
    sendCCommand,
    onOpenRouteManager,
    onOpenSaveRoute
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
    const [keyboardSelectedInternal, setKeyboardSelectedInternal] = useState(false);
    const [activePathAlgorithm, setActivePathAlgorithm] = useState('A*');
    const [waypointGuidance, setWaypointGuidance] = useState(() => {
      try {
        const stored = window.localStorage ? window.localStorage.getItem(MOBILE_STORAGE_KEYS.waypointGuidance) : null;
        return stored === 'los' ? 'los' : 'p2p';
      } catch (_) {
        return 'p2p';
      }
    });
    const [waypointController, setWaypointController] = useState(() => {
      try {
        const stored = window.localStorage ? window.localStorage.getItem(MOBILE_STORAGE_KEYS.waypointController) : null;
        return stored === 'ai_pid' ? 'ai_pid' : 'pid';
      } catch (_) {
        return 'pid';
      }
    });
    const [autoExecLevel, setAutoExecLevel] = useState(() => {
      try {
        const stored = window.localStorage ? window.localStorage.getItem(MOBILE_STORAGE_KEYS.autoExecLevel) : null;
        return stored === 'mission' ? 'mission' : 'debug';
      } catch (_) {
        return 'debug';
      }
    });
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
      try {
        if (!window.localStorage) return;
        const storedMode = window.localStorage.getItem(MOBILE_STORAGE_KEYS.deploymentMode);
        const storedKeyboard = window.localStorage.getItem(MOBILE_STORAGE_KEYS.deploymentKeyboardSelected);
        const nextMode = storedMode === '@' || storedMode === 'W' || storedMode === '#' ? storedMode : '';
        if (!nextMode) return;
        const nextKeyboardSelected = nextMode === '@' && (storedKeyboard === '1' || storedKeyboard === 'true');
        if (typeof setControlMode === 'function') setControlMode(nextMode);
        setKeyboardSelected(nextKeyboardSelected);
      } catch (_) {}
    }, [setControlMode, setKeyboardSelected]);

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
    }, [activePathAlgorithm, controlMode, cruiseMode, recvOn, streamOn, waypointsCount]);

    useEffect(() => {
      if (!open) {
        setDeployStatus('idle');
        if (deployCloseTimerRef.current) {
          window.clearTimeout(deployCloseTimerRef.current);
          deployCloseTimerRef.current = null;
        }
      }
    }, [open]);

    const buildDeployControlConfig = () => {
      const baseConfig = controlFrameConfig && typeof controlFrameConfig === 'object' ? controlFrameConfig : {};
      const isTaskMode = controlMode === '#';
      const hasWaypointTask = Number(waypointsCount) > 0;
      const plannerValue = DEPLOY_CONTROL_PLANNER_MAP[activePathAlgorithm] || '0';

      // 移动端先按已有可见状态隐式映射 C 报文，其余字段继续走当前默认值。
      return {
        ...baseConfig,
        src: '0',
        mode: isTaskMode ? '1' : '0',
        task: isTaskMode && hasWaypointTask ? '1' : '0',
        planner: isTaskMode && hasWaypointTask ? plannerValue : '0',
        guidance: isTaskMode && hasWaypointTask ? String(baseConfig.guidance ?? '0') : '0',
        controller: String(baseConfig.controller ?? '1')
      };
    };

    useEffect(() => {
      try {
        if (window.localStorage) window.localStorage.setItem(MOBILE_STORAGE_KEYS.autoExecLevel, autoExecLevel);
      } catch (_) {}
    }, [autoExecLevel]);

    useEffect(() => {
      try {
        if (window.localStorage) {
          window.localStorage.setItem(MOBILE_STORAGE_KEYS.deploymentMode, String(controlMode || '@'));
          window.localStorage.setItem(MOBILE_STORAGE_KEYS.deploymentKeyboardSelected, keyboardSelected ? '1' : '0');
        }
      } catch (_) {}
    }, [controlMode, keyboardSelected]);

    useEffect(() => {
      try {
        if (window.localStorage) window.localStorage.setItem(MOBILE_STORAGE_KEYS.waypointGuidance, waypointGuidance);
      } catch (_) {}
    }, [waypointGuidance]);

    useEffect(() => {
      try {
        if (window.localStorage) window.localStorage.setItem(MOBILE_STORAGE_KEYS.waypointController, waypointController);
      } catch (_) {}
    }, [waypointController]);

    const handleDeployClick = () => {
      const configOk = typeof sendSCommand === 'function' ? sendSCommand() : false;
      const controlOk = configOk && typeof sendCCommand === 'function'
        ? sendCCommand(buildDeployControlConfig(), { showToast: false })
        : configOk;

      if (configOk && controlOk) {
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
        const iosActiveTheme = (() => {
          if (colorClass === 'orange') return 'bg-[#FF9500] text-white border-[#FF9500]/35 shadow-[0_8px_30px_-10px_rgba(255,149,0,0.38)]';
          if (colorClass === 'purple') return 'bg-[#5856D6] text-white border-[#5856D6]/35 shadow-[0_8px_30px_-10px_rgba(88,86,214,0.38)]';
          if (colorClass === 'emerald') return 'bg-[#34C759] text-white border-[#34C759]/35 shadow-[0_8px_30px_-10px_rgba(52,199,89,0.38)]';
          return 'bg-[#007AFF] text-white border-[#007AFF]/30 shadow-[0_8px_30px_-10px_rgba(0,122,255,0.35)]';
        })();
        return (
          <button
            onClick={onClick}
            className={`snap-start shrink-0 min-w-[86px] relative flex flex-col items-center justify-center py-3 px-3 border transition-all duration-200 rounded-[14px] active:scale-[0.98] ${
              active
                ? iosActiveTheme
                : 'bg-white/70 border-white/50 text-slate-600 hover:bg-white/80'
            }`}
          >
            <span className="text-sm font-semibold z-10">{label}</span>
            <span className="text-[9px] font-mono opacity-70 z-10">{sub}</span>
          </button>
        );
      }

      const activeTheme = (() => {
        if (colorClass === 'orange') return 'bg-amber-500/14 border-amber-400 text-amber-300 shadow-[0_0_15px_rgba(251,191,36,0.22)]';
        if (colorClass === 'purple') return 'bg-purple-500/10 border-purple-400 text-purple-400 shadow-[0_0_15px_rgba(6,182,212,0.15)]';
        if (colorClass === 'emerald') return 'bg-emerald-500/10 border-emerald-400 text-emerald-400 shadow-[0_0_15px_rgba(6,182,212,0.15)]';
        return 'bg-cyan-500/10 border-cyan-400 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.15)]';
      })();

      const activeOverlay = (() => {
        if (colorClass === 'orange') return 'bg-amber-400/5';
        if (colorClass === 'purple') return 'bg-purple-400/5';
        if (colorClass === 'emerald') return 'bg-emerald-400/5';
        return 'bg-cyan-400/5';
      })();

      const activeCorner = (() => {
        if (colorClass === 'orange') return 'border-amber-400';
        if (colorClass === 'purple') return 'border-purple-400';
        if (colorClass === 'emerald') return 'border-emerald-400';
        return 'border-cyan-400';
      })();

      return (
        <button
          onClick={onClick}
          className={`
            snap-start shrink-0 min-w-[86px] relative flex flex-col items-center justify-center py-3 px-3 border transition-all duration-200 clip-path-slant
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

    const CapsuleButton = ({ active, label, onClick, accent = 'orange' }) => {
      const iosActive = accent === 'orange'
        ? 'bg-[#FF9500] text-white border-[#FF9500]/35'
        : 'bg-[#007AFF] text-white border-[#007AFF]/35';
      const iosInactive = 'bg-white/70 text-slate-600 border-slate-200/70 hover:bg-white/85';

      const cyberActive = accent === 'orange'
        ? 'bg-amber-500/14 border-amber-400/70 text-amber-200 shadow-[0_0_12px_rgba(251,191,36,0.24)]'
        : 'bg-cyan-500/14 border-cyan-400/70 text-cyan-200 shadow-[0_0_12px_rgba(6,182,212,0.24)]';
      const cyberInactive = 'bg-slate-900/60 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-300';

      return (
        <button
          type="button"
          onClick={onClick}
          className={`px-3 py-1.5 text-[11px] font-semibold rounded-full border transition-all ${isIos ? (active ? iosActive : iosInactive) : (active ? cyberActive : cyberInactive)}`}
        >
          {label}
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
            <style>{`
              @keyframes sideDrawerShimmer {
                0% { transform: translateX(-100%); }
                100% { transform: translateX(100%); }
              }
              @keyframes sideDrawerPulseGlowGreen {
                0%, 100% { box-shadow: 0 0 8px rgba(16,185,129,0.15); }
                50% { box-shadow: 0 0 18px rgba(16,185,129,0.4); }
              }
            `}</style>

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
                <div className="overflow-x-auto -mx-1 px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  <div className="flex gap-2 snap-x snap-mandatory">
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
                    label={lang === 'zh' ? tZh.waypoint_mission : tEn.waypoint_mission}
                    sub={lang === 'zh' ? tEn.waypoint_sub : tZh.waypoint_sub}
                    active={controlMode === 'W'}
                    onClick={() => {
                      setKeyboardSelected(false);
                      setControlMode && setControlMode('W');
                    }}
                    colorClass="orange"
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
                  </div>
                </div>

                {controlMode === '#' && (
                  <>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`${isIos ? 'text-[11px] text-slate-500 font-semibold tracking-wider' : 'text-[10px] text-slate-500 font-bold tracking-wider'}`}>{t.exec_level_label}</span>
                      <div className={`relative flex p-1 border w-[150px] ${isIos ? 'bg-white/70 rounded-[12px] border-slate-200/70' : 'bg-[#0d131f] rounded border-[#1e2a3b]'}`}>
                        <div
                          className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded transition-all duration-300 ease-out ${
                            autoExecLevel === 'mission'
                              ? (isIos
                                ? 'translate-x-[calc(100%+0px)] bg-cyan-500/18 border border-cyan-500/45'
                                : 'translate-x-[calc(100%+0px)] bg-cyan-500/20 border border-cyan-500/50')
                              : (isIos
                                ? 'translate-x-0 bg-yellow-500/18 border border-yellow-500/45'
                                : 'translate-x-0 bg-yellow-500/20 border border-yellow-500/50')
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setAutoExecLevel('debug')}
                          className={`flex-1 relative z-10 text-xs py-1.5 font-bold transition-colors ${
                            autoExecLevel === 'debug'
                              ? (isIos ? 'text-[#B45309]' : 'text-yellow-500')
                              : 'text-slate-500 hover:text-slate-300'
                          }`}
                        >
                          {t.exec_level_debug}
                        </button>
                        <button
                          type="button"
                          onClick={() => setAutoExecLevel('mission')}
                          className={`flex-1 relative z-10 text-xs py-1.5 font-bold transition-colors ${
                            autoExecLevel === 'mission'
                              ? (isIos ? 'text-[#0369A1]' : 'text-cyan-400')
                              : 'text-slate-500 hover:text-slate-300'
                          }`}
                        >
                          {t.exec_level_mission}
                        </button>
                      </div>
                    </div>

                    <div
                      className={`grid transition-all duration-500 ease-in-out ${
                        autoExecLevel === 'mission' ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                      }`}
                    >
                      <div className="overflow-hidden">
                        <div className="pb-1">
                          <div className={isIos ? `${cardBase} ${cardRadiusClass} p-3` : 'tech-border p-3'}>
                            <div className={`text-[10px] font-bold uppercase mb-2 tracking-wider flex items-center gap-2 ${isIos ? 'text-slate-500' : 'text-slate-500'}`}>
                              <Waypoints className={`w-4 h-4 ${isIos ? 'text-[#007AFF]' : 'text-cyan-400'}`} />
                              <span>{lang === 'zh' ? `${tZh.path_planning} (${tEn.path_planning})` : `${tEn.path_planning} (${tZh.path_planning})`}</span>
                            </div>
                            <div className="grid grid-cols-3 gap-1">
                              {['A*', 'Hybrid A*', 'DWA'].map(algo => (
                                <button
                                  key={algo}
                                  type="button"
                                  onClick={() => setActivePathAlgorithm(algo)}
                                  className={`py-2 text-[10px] font-bold border transition-colors ${
                                    isIos
                                      ? (activePathAlgorithm === algo
                                        ? 'bg-[#007AFF]/10 border-[#007AFF]/40 text-slate-900 rounded-[12px] shadow-[0_6px_16px_-10px_rgba(0,122,255,0.35)]'
                                        : 'bg-white/60 border-slate-200/60 text-slate-500 rounded-[12px] hover:bg-white/80'
                                      )
                                      : (activePathAlgorithm === algo
                                        ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-400'
                                        : 'border-[#1e2a3b] text-gray-500 hover:border-gray-600'
                                      )
                                  }`}
                                >
                                  {algo}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {controlMode === 'W' && (
                  <div className={isIos ? `${cardBase} ${cardRadiusClass} p-3 space-y-3` : 'tech-border p-3 space-y-3'}>
                    <div className={`text-[10px] font-bold uppercase tracking-wider ${isIos ? 'text-slate-500' : 'text-slate-500'}`}>{t.waypoint_mission}</div>
                    <div className="flex items-center justify-between gap-3">
                      <span className={`${isIos ? 'text-[12px] text-slate-600 font-semibold' : 'text-[10px] text-slate-400 font-bold uppercase tracking-wider'}`}>{t.guidance_label}</span>
                      <div className="flex items-center gap-2">
                        <CapsuleButton
                          active={waypointGuidance === 'p2p'}
                          label={t.guidance_p2p}
                          onClick={() => setWaypointGuidance('p2p')}
                          accent="orange"
                        />
                        <CapsuleButton
                          active={waypointGuidance === 'los'}
                          label={t.guidance_los}
                          onClick={() => setWaypointGuidance('los')}
                          accent="orange"
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className={`${isIos ? 'text-[12px] text-slate-600 font-semibold' : 'text-[10px] text-slate-400 font-bold uppercase tracking-wider'}`}>{t.controller_label}</span>
                      <div className="flex items-center gap-2">
                        <CapsuleButton
                          active={waypointController === 'pid'}
                          label={t.controller_pid}
                          onClick={() => setWaypointController('pid')}
                          accent="orange"
                        />
                        <CapsuleButton
                          active={waypointController === 'ai_pid'}
                          label={t.controller_ai_pid}
                          onClick={() => setWaypointController('ai_pid')}
                          accent="orange"
                        />
                      </div>
                    </div>

                    <div className={`flex w-full ${isIos ? 'mt-4 gap-2' : 'mt-6 gap-2'}`}>
                      <button
                        type="button"
                        onClick={() => {
                          if (typeof onClose === 'function') onClose();
                          if (typeof onOpenRouteManager === 'function') {
                            window.setTimeout(() => onOpenRouteManager({ returnToMobileDrawerOnCancel: true }), 120);
                          }
                        }}
                        className={isIos
                          ? 'flex-1 py-2.5 flex items-center justify-center gap-2 bg-white/80 border border-white/70 text-[#007AFF] rounded-[12px] shadow-[0_8px_30px_-16px_rgba(0,0,0,0.2)] active:scale-[0.98] active:bg-white/90 transition-all'
                          : 'flex-1 py-2.5 flex items-center justify-center gap-2 bg-[#162031] border border-[#2a3a50] text-gray-300 rounded-sm active:scale-[0.98] active:bg-[#1c2a41] transition-all'
                        }
                      >
                        <FileText className={`w-3.5 h-3.5 ${isIos ? 'text-[#007AFF]' : 'text-cyan-500'}`} />
                        <span className={`text-xs font-bold ${isIos ? 'tracking-tight' : ''}`}>{t.load_route}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (typeof onClose === 'function') onClose();
                          if (typeof onOpenSaveRoute === 'function') {
                            window.setTimeout(() => onOpenSaveRoute({ returnToMobileDrawerOnCancel: true }), 120);
                          }
                        }}
                        className={isIos
                          ? 'flex-1 py-2.5 flex items-center justify-center gap-2 bg-white/80 border border-white/70 text-[#007AFF] rounded-[12px] shadow-[0_8px_30px_-16px_rgba(0,0,0,0.2)] active:scale-[0.98] active:bg-white/90 transition-all'
                          : 'flex-1 py-2.5 flex items-center justify-center gap-2 bg-[#162031] border border-[#2a3a50] text-gray-300 rounded-sm active:scale-[0.98] active:bg-[#1c2a41] transition-all'
                        }
                      >
                        <Save className={`w-3.5 h-3.5 ${isIos ? 'text-[#007AFF]' : 'text-cyan-500'}`} />
                        <span className={`text-xs font-bold ${isIos ? 'tracking-tight' : ''}`}>{t.save_route}</span>
                      </button>
                    </div>

                    <div className="flex justify-center mt-4 mb-1">
                      <button
                        type="button"
                        onClick={() => {
                          if (typeof onClose === 'function') onClose();
                          if (typeof sendWaypointsCommand === 'function') {
                            window.setTimeout(() => sendWaypointsCommand(), 120);
                          }
                        }}
                        className={isIos
                          ? 'w-[75%] py-2.5 flex items-center justify-center gap-2 bg-[#34C759]/18 border border-[#34C759]/55 text-[#1d8a46] font-bold rounded-[12px] active:scale-[0.95] active:bg-[#34C759]/30 transition-all duration-200 relative overflow-hidden shadow-[0_10px_30px_-16px_rgba(52,199,89,0.45)]'
                          : 'w-[75%] py-2.5 flex items-center justify-center gap-2 bg-emerald-600/20 border border-emerald-500/60 text-emerald-400 font-bold tracking-widest active:scale-[0.95] active:bg-emerald-600/40 transition-all duration-200 relative overflow-hidden rounded-sm'
                        }
                        style={isIos ? undefined : { animation: 'sideDrawerPulseGlowGreen 2s infinite' }}
                      >
                        <div
                          className={isIos ? 'absolute inset-0 bg-gradient-to-r from-transparent via-[#34C759]/20 to-transparent' : 'absolute inset-0 bg-gradient-to-r from-transparent via-emerald-300/20 to-transparent'}
                          style={{ animation: 'sideDrawerShimmer 3s infinite linear' }}
                        />
                        <Send className={`relative z-10 w-4 h-4 -rotate-12 -translate-y-[1px] ${isIos ? 'text-[#1d8a46]' : ''}`} />
                        <span className={`relative z-10 ${isIos ? 'text-[13px] tracking-tight' : 'text-sm'}`}>{t.track_route}</span>
                      </button>
                    </div>
                  </div>
                )}

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
