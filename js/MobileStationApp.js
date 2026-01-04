(function () {
  const { useCallback, useEffect, useMemo, useRef, useState } = React;

  // Import helpers and components
  const { Icon } = window.MobileUtils;
  const { HUDBox, StatusBar, BottomNav, SideDrawer, JoystickComponent, EmbeddedChart } = window.MobileComponents;

  // Icons
  const Plus = Icon('Plus');
  const Home = Icon('Home');
  const Check = Icon('Check');
  const Zap = Icon('Zap');
  const Activity = Icon('Activity');
  const List = Icon('List');
  const X = Icon('X');
  const Trash = Icon('Trash');
  const MapPin = Icon('MapPin');
  const Send = Icon('Send');
  const Trash2 = Icon('Trash2');

  const FeaturePending = ({ title, t }) => (
    <div className="w-full h-full bg-slate-950 relative flex items-center justify-center">
      <div className="absolute top-0 w-full h-16 z-30 px-4 flex items-center bg-gradient-to-b from-slate-900 via-slate-900/80 to-transparent pointer-events-none">
        <div className="text-cyan-400 font-mono font-bold text-lg flex items-center gap-2">{t ? t(title.toLowerCase()) : title}</div>
      </div>
      <HUDBox className="p-6 w-[90%] max-w-sm">
        <div className="flex flex-col items-center justify-center text-slate-500 space-y-3">
          <Activity className="w-8 h-8 text-cyan-500/60 animate-pulse" />
          <div className="text-center space-y-1">
            <span className="font-mono text-xs block text-slate-400">FEATURE_PENDING</span>
            <span className="text-xs text-amber-500/80">待开发...</span>
          </div>
        </div>
      </HUDBox>
    </div>
  );

  // --- Global Toast Component (Adapted from 1.js) ---
  const ToastOverlay = ({ toast, onDismiss }) => {
    if (!toast) return null;
    // toast can be a string or an object { message, loading, type, durationMs }
    const msg = typeof toast === 'object' ? toast.message : toast;
    const isLoading = typeof toast === 'object' && toast.loading;
    const isError = typeof toast === 'object' && toast.type === 'error';
    const isSuccess = typeof toast === 'object' && toast.type === 'success';

    return (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-[60] animate-in fade-in zoom-in duration-200 pointer-events-none w-full max-w-xs flex justify-center">
            <div className={`relative pointer-events-auto bg-cyan-950/90 border ${isError ? 'border-red-500 text-red-100' : 'border-cyan-500 text-cyan-100'} px-6 py-3 rounded shadow-[0_0_20px_rgba(6,182,212,0.4)] flex items-center gap-3 font-mono text-sm`}>
                {isLoading ? (
                     <div className="w-4 h-4 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                     <Activity size={18} className={`${isError ? 'text-red-400' : isSuccess ? 'text-green-400' : 'text-cyan-400 animate-pulse'}`} />
                )}
                <div className="flex-1 min-w-0 pr-6">{msg}</div>
                <button
                  type="button"
                  onClick={onDismiss}
                  className="absolute right-1.5 top-1.5 w-6 h-6 flex items-center justify-center rounded text-cyan-100/60 hover:text-cyan-50 hover:bg-white/5 active:scale-95 transition-all"
                  aria-label="Close"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
            </div>
        </div>
    );
  };

  function MobileStationApp(props) {
    const {
      lang,
      setLang,
      boatStyle,
      setBoatStyle,
      waypointStyle,
      setWaypointStyle,
      tcpStatus,
      serverIp,
      setServerIp,
      serverPort,
      setServerPort,
      toggleConnection,
      boatStatus,
      waypoints,
      setWaypoints,
      cruiseMode,
      setCruiseMode,
      streamOn,
      setStreamOn,
      recvOn,
      setRecvOn,
      controlMode,
      setControlMode,
      sendSCommand,
      sendWaypointsCommand,
      sendKCommand,
      chartDataRef, // [Added]
      chartFps,     // [Added]
      embeddedChannelExpanded,
      embeddedChannelEnabled,
      onPersistEmbeddedChartConfig,
      setShowSettings,
      showLogs,
      setShowLogs,
      logs,
      setLogs,
      devMode,
      setDevMode,
      sendData
    } = props;

    const t = useCallback((key) => {
      const mobileTrans = window.MobileTranslations && window.MobileTranslations[lang]
        ? window.MobileTranslations[lang]
        : (window.MobileTranslations && window.MobileTranslations.en ? window.MobileTranslations.en : null);

      if (mobileTrans && Object.prototype.hasOwnProperty.call(mobileTrans, key)) return mobileTrans[key];
      if (typeof AppTranslations !== 'undefined' && AppTranslations && AppTranslations[lang] && Object.prototype.hasOwnProperty.call(AppTranslations[lang], key)) {
        return AppTranslations[lang][key];
      }
      if (typeof AppTranslations !== 'undefined' && AppTranslations && AppTranslations.en && Object.prototype.hasOwnProperty.call(AppTranslations.en, key)) {
        return AppTranslations.en[key];
      }
      return key;
    }, [lang]);

    const [activeTab, setActiveTab] = useState('map');
    const [quickMenuOpen, setQuickMenuOpen] = useState(false);
    const [sideDrawerOpen, setSideDrawerOpen] = useState(false);
    const [joystickActive, setJoystickActive] = useState(false);
    const [joystickPosition, setJoystickPosition] = useState({ x: 0, y: 0 });
    const [mapMode, setMapMode] = useState('pan');
    const [toast, setToast] = useState(null);
    const [showWaypointList, setShowWaypointList] = useState(false);
    const [locateNonce, setLocateNonce] = useState(0);

    const toastTimerRef = useRef(null);
    const toastIdRef = useRef(null);
    const deployReminderShownRef = useRef(false);

    const clearToastTimer = useCallback(() => {
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
        toastTimerRef.current = null;
      }
    }, []);

    const computeMobileDurationMs = useCallback((durationMs) => {
      if (durationMs === null) return null;
      const base = Number.isFinite(durationMs) ? durationMs : 2500;
      if (base <= 0) return 0;
      const reduced = base - 2000;
      return Math.max(1200, reduced);
    }, []);

    const showToast = useCallback((messageOrOpts, options = {}) => {
      const opts = typeof messageOrOpts === 'string'
        ? { ...(options || {}), message: messageOrOpts }
        : { ...(messageOrOpts || {}) };

      const id = opts.id || `mtoast_${Date.now()}_${Math.random().toString(16).slice(2)}`;
      toastIdRef.current = id;

      clearToastTimer();

      const durationMs = computeMobileDurationMs(Object.prototype.hasOwnProperty.call(opts, 'durationMs') ? opts.durationMs : undefined);
      const toastObj = {
        id,
        type: opts.type || 'info',
        message: opts.message || '',
        loading: !!opts.loading,
        progress: Number.isFinite(opts.progress) ? opts.progress : null,
        durationMs
      };

      setToast(toastObj);

      if (!toastObj.loading && durationMs && durationMs > 0) {
        toastTimerRef.current = window.setTimeout(() => {
          if (toastIdRef.current === id) setToast(null);
        }, durationMs);
      }

      return id;
    }, [clearToastTimer, computeMobileDurationMs]);

    const dismissToast = useCallback((id) => {
      clearToastTimer();
      setToast((prev) => {
        if (!prev) return null;
        if (id && prev.id && prev.id !== id) return prev;
        return null;
      });
    }, [clearToastTimer]);

    const updateToast = useCallback((id, patch) => {
      if (!id) return;
      setToast((prev) => {
        if (!prev || prev.id !== id) return prev;
        return { ...prev, ...(patch || {}) };
      });
    }, []);

    const resolveToast = useCallback((id, options = {}) => {
      clearToastTimer();

      setToast((prev) => {
        const target = prev && prev.id === id ? prev : null;
        const durationMs = computeMobileDurationMs(Object.prototype.hasOwnProperty.call(options, 'durationMs') ? options.durationMs : undefined);

        const next = {
          id: target ? target.id : `mtoast_${Date.now()}_${Math.random().toString(16).slice(2)}`,
          type: options.type || (target ? target.type : 'info'),
          message: options.message || (target ? target.message : ''),
          loading: false,
          progress: null,
          durationMs
        };

        if (durationMs && durationMs > 0) {
          toastTimerRef.current = window.setTimeout(() => {
            if (toastIdRef.current === next.id) setToast(null);
          }, durationMs);
        }
        toastIdRef.current = next.id;
        return next;
      });
    }, [clearToastTimer, computeMobileDurationMs]);

    useEffect(() => {
        const originalToast = window.SystemToast;
        const mobileToastInterface = {
            show: (messageOrOpts, options) => showToast(messageOrOpts, options),
            showLoading: (message, options) => showToast(message, { ...(options || {}), loading: true, durationMs: null }),
            update: (id, patch) => updateToast(id, patch || {}),
            resolve: (id, options) => resolveToast(id, options || {}),
            dismiss: (id) => dismissToast(id)
        };

        window.SystemToast = mobileToastInterface;
        window.MobileToast = mobileToastInterface; // Also expose as MobileToast for app.js to find explicitly

        return () => {
            window.SystemToast = originalToast;
            delete window.MobileToast;
        }
    }, [dismissToast, resolveToast, showToast, updateToast]);

    useEffect(() => {
      if (tcpStatus === 'ONLINE') {
        if (deployReminderShownRef.current) return;
        deployReminderShownRef.current = true;
        showToast(t('deploy_reminder'), { type: 'info', durationMs: 4500 });
        return;
      }
      deployReminderShownRef.current = false;
    }, [showToast, t, tcpStatus]);

    const signal = useMemo(() => {
      if (tcpStatus !== 'ONLINE') return 0;
      if (!boatStatus || !boatStatus.lastUpdate) return 60;
      const ts = boatStatus.lastUpdate instanceof Date ? boatStatus.lastUpdate.getTime() : new Date(boatStatus.lastUpdate).getTime();
      const age = Math.max(0, Date.now() - ts);
      return Math.max(0, Math.min(100, 100 - age / 40));
    }, [boatStatus, tcpStatus]);

    const lat = Number(boatStatus && boatStatus.latitude) || 0;
    const lng = Number(boatStatus && boatStatus.longitude) || 0;
    const heading = Number(boatStatus && boatStatus.heading) || 0;
    const posReady = lat !== 0 || lng !== 0;
    const batL = Number(boatStatus && boatStatus.batteryL) || 0;
    const batR = Number(boatStatus && boatStatus.batteryR) || 0;
    const batteryV = (batL + batR) / 2;
    const batteryPct = Math.max(0, Math.min(100, (batteryV / 14) * 100));

    const setTab = useCallback((id) => {
      setActiveTab(id);
      setQuickMenuOpen(false);
      if (id === 'logs') setShowLogs(true);
      else setShowLogs(false);
    }, [setShowLogs]);

    useEffect(() => {
      if (!showLogs && activeTab === 'logs') setActiveTab('map');
    }, [activeTab, showLogs]);

    useEffect(() => {
      if (mapMode === 'add') setShowWaypointList(true);
      else setShowWaypointList(false);
    }, [mapMode]);

    const lastCmdRef = useRef({ w: 0, a: 0, s: 0, d: 0 });
    useEffect(() => {
      if (!joystickActive) return;
      if (tcpStatus !== 'ONLINE') return;
      if (controlMode !== '@') return;
      if (!sendKCommand) return;

      const tick = () => {
        const threshold = 12;
        const w = joystickPosition.y < -threshold ? 1 : 0;
        const s = joystickPosition.y > threshold ? 1 : 0;
        const a = joystickPosition.x < -threshold ? 1 : 0;
        const d = joystickPosition.x > threshold ? 1 : 0;

        const prev = lastCmdRef.current;
        if (prev.w !== w || prev.a !== a || prev.s !== s || prev.d !== d) {
          lastCmdRef.current = { w, a, s, d };
          sendKCommand(w, a, s, d);
        }
      };

      tick();
      const timer = setInterval(tick, 120);
      return () => clearInterval(timer);
    }, [joystickActive, joystickPosition, tcpStatus, controlMode, sendKCommand]);

    useEffect(() => {
      if (joystickActive) return;
      if (!sendKCommand) return;
      const prev = lastCmdRef.current;
      if (prev.w || prev.a || prev.s || prev.d) {
        lastCmdRef.current = { w: 0, a: 0, s: 0, d: 0 };
        sendKCommand(0, 0, 0, 0);
      }
    }, [joystickActive, sendKCommand]);

    const handleJoyMove = useCallback((clientX, clientY, rect) => {
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = clientX - cx;
      const dy = clientY - cy;
      const knobRadiusPx = 28; // matches w-14/h-14
      const maxRadius = Math.max(0, rect.width / 2 - knobRadiusPx);
      const baseLimit = 40;
      const limit = Math.max(0, Math.min(baseLimit, maxRadius));
      const magnitude = Math.hypot(dx, dy);
      const scale = magnitude > limit && magnitude > 0 ? (limit / magnitude) : 1;
      setJoystickPosition({ x: dx * scale, y: dy * scale });
    }, []);

    const joystickDisabled = tcpStatus !== 'ONLINE' || controlMode !== '@';

    return (
      <div className="relative w-full h-full bg-slate-950 flex flex-col overflow-hidden font-sans select-none">
        <ToastOverlay toast={toast} onDismiss={() => dismissToast(toast && toast.id)} />
        <SideDrawer
          open={sideDrawerOpen}
          onClose={() => setSideDrawerOpen(false)}
          lang={lang}
          setLang={setLang}
          serverIp={serverIp}
          setServerIp={setServerIp}
          serverPort={serverPort}
          setServerPort={setServerPort}
          tcpStatus={tcpStatus}
          toggleConnection={toggleConnection}
          streamOn={streamOn}
          setStreamOn={setStreamOn}
          recvOn={recvOn}
          setRecvOn={setRecvOn}
          controlMode={controlMode}
          setControlMode={setControlMode}
          cruiseMode={cruiseMode}
          setCruiseMode={setCruiseMode}
          sendSCommand={sendSCommand}
          sendWaypointsCommand={sendWaypointsCommand}
          onOpenSettings={() => setShowSettings(true)}
        />

        <div className="flex-1 relative overflow-hidden">
          {activeTab === 'map' && (
            <div className="relative w-full h-full bg-[#0f172a] overflow-hidden">
              <StatusBar title={t('usv_op_core')} signal={signal} tcpStatus={tcpStatus} posReady={posReady} setSideDrawerOpen={setSideDrawerOpen} onOpenSettings={() => setShowSettings(true)} t={t} />

              <div className="absolute inset-0 z-0">
                <div className="w-full h-full opacity-20" style={{ backgroundImage: 'radial-gradient(circle, #06b6d4 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
                <div className="absolute inset-0 z-10">
                  <MapComponent
                    lng={lng}
                    lat={lat}
                    heading={heading}
                    waypoints={waypoints}
                    setWaypoints={setWaypoints}
                    cruiseMode={cruiseMode}
                    t={t}
                    showLogs={false}
                    controlledMapMode={mapMode}
                    hideToolbar={true}
                    locateNonce={locateNonce}
                    boatStyle={boatStyle}
                    waypointStyle={waypointStyle}
                  />
                </div>
              </div>

              {mapMode === 'add' && (
                <div className="absolute top-20 left-0 w-full z-20 flex justify-center pointer-events-none">
                  <button 
                    onClick={() => setMapMode('pan')}
                    className="pointer-events-auto bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-6 rounded-full shadow-lg border-2 border-green-400 animate-in fade-in zoom-in duration-300 flex items-center gap-2"
                  >
                    <Check className="w-5 h-5" />
                    {t('finish_add')}
                  </button>
                </div>
              )}

              <div className="absolute top-20 right-4 z-20 flex flex-col items-end gap-3 pointer-events-none">
                <div className="pointer-events-auto flex flex-col items-end gap-3">
                  <button
                    onClick={() => setQuickMenuOpen(!quickMenuOpen)}
                    className={`w-12 h-12 flex items-center justify-center border border-cyan-500/50 bg-slate-900/80 backdrop-blur shadow-[0_0_10px_rgba(6,182,212,0.2)] transition-all active:scale-90 ${quickMenuOpen ? 'text-cyan-400 rotate-45 border-cyan-400' : 'text-slate-400'}`}
                    style={{ clipPath: 'polygon(20% 0%, 80% 0%, 100% 20%, 100% 80%, 80% 100%, 20% 100%, 0% 80%, 0% 20%)' }}
                  >
                    <Plus className="w-6 h-6" />
                  </button>
                  {quickMenuOpen && (
                    <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-right-4">
                      <button onClick={() => { setMapMode('add'); setQuickMenuOpen(false); }} className="flex items-center justify-end gap-2 group pointer-events-auto">
                        <span className="text-[10px] font-mono text-yellow-200 bg-black/60 px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity">{t('add_wp_btn')}</span>
                        <div className="w-10 h-10 flex items-center justify-center border border-slate-700 bg-slate-900/90 hover:border-yellow-500/50 hover:bg-yellow-900/20 text-yellow-400 transition-all active:scale-90" style={{ clipPath: 'polygon(20% 0%, 80% 0%, 100% 20%, 100% 80%, 80% 100%, 20% 100%, 0% 80%, 0% 20%)' }}><MapPin className="w-[18px] h-[18px]" /></div>
                      </button>
                      <button onClick={() => { sendWaypointsCommand && sendWaypointsCommand(); setQuickMenuOpen(false); }} className="flex items-center justify-end gap-2 group pointer-events-auto">
                        <span className="text-[10px] font-mono text-green-200 bg-black/60 px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity">{t('upload_btn')}</span>
                        <div className="w-10 h-10 flex items-center justify-center border border-slate-700 bg-slate-900/90 hover:border-green-500/50 hover:bg-green-900/20 text-green-400 transition-all active:scale-90" style={{ clipPath: 'polygon(20% 0%, 80% 0%, 100% 20%, 100% 80%, 80% 100%, 20% 100%, 0% 80%, 0% 20%)' }}><Send className="w-[18px] h-[18px]" /></div>
                      </button>
                      <button onClick={() => { setWaypoints([]); setQuickMenuOpen(false); }} className="flex items-center justify-end gap-2 group pointer-events-auto">
                        <span className="text-[10px] font-mono text-red-200 bg-black/60 px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity">{t('clear_btn')}</span>
                        <div className="w-10 h-10 flex items-center justify-center border border-slate-700 bg-slate-900/90 hover:border-red-500/50 hover:bg-red-900/20 text-red-400 transition-all active:scale-90" style={{ clipPath: 'polygon(20% 0%, 80% 0%, 100% 20%, 100% 80%, 80% 100%, 20% 100%, 0% 80%, 0% 20%)' }}><Trash2 className="w-[18px] h-[18px]" /></div>
                      </button>
                      <button onClick={() => { setLocateNonce(v => v + 1); setQuickMenuOpen(false); }} className="flex items-center justify-end gap-2 group pointer-events-auto">
                        <span className="text-[10px] font-mono text-cyan-200 bg-black/60 px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity">{t('map_locate')}</span>
                        <div className="w-10 h-10 flex items-center justify-center border border-slate-700 bg-slate-900/90 hover:border-cyan-500/50 hover:bg-cyan-900/20 text-cyan-400 transition-all active:scale-90" style={{ clipPath: 'polygon(20% 0%, 80% 0%, 100% 20%, 100% 80%, 80% 100%, 20% 100%, 0% 80%, 0% 20%)' }}><Home className="w-[18px] h-[18px]" /></div>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="absolute bottom-24 left-4 z-20 w-36 flex flex-col-reverse gap-2 pointer-events-none">
                <HUDBox className="p-2 pointer-events-auto">
                  <div className="space-y-2">
                    <div className="space-y-1 font-mono">
                      <div className="flex justify-between text-[10px] text-cyan-600">
                        <span>{t('latitude')}</span>
                        <span className="text-cyan-100">{lat ? lat.toFixed(6) : '0.000000'}</span>
                      </div>
                      <div className="flex justify-between text-[10px] text-cyan-600">
                        <span>{t('longitude')}</span>
                        <span className="text-cyan-100">{lng ? lng.toFixed(6) : '0.000000'}</span>
                      </div>
                    </div>
                    <div className="h-px bg-cyan-900/50 w-full"></div>
                    <div className="grid grid-cols-2 gap-1">
                      <div className="text-center">
                        <div className="text-[9px] text-slate-400 mb-1">{t('heading')}</div>
                        <div className="text-base font-mono font-bold text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]">{heading.toFixed(0)}°</div>
                      </div>
                      <div className="text-center">
                        <div className="text-[9px] text-slate-400 mb-1">{t('waypoint')}</div>
                        <div className="text-base font-mono font-bold text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]">{Array.isArray(waypoints) ? waypoints.length : 0}</div>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px]">
                        <span className="text-slate-400 flex items-center gap-1"><Zap className="w-3 h-3" /> {t('battery')}</span>
                        <span className={`${batteryPct < 30 ? 'text-red-400' : 'text-cyan-400'}`}>{batteryV ? batteryV.toFixed(2) : '0.00'}V</span>
                      </div>
                      <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                        <div className={`h-full shadow-[0_0_10px_currentColor] transition-all duration-500 ${batteryPct < 30 ? 'bg-red-500 text-red-500' : 'bg-cyan-500 text-cyan-500'}`} style={{ width: `${batteryPct}%` }}></div>
                      </div>
                    </div>
                  </div>
                </HUDBox>

                {mapMode === 'add' && showWaypointList && (
                  <HUDBox className="pointer-events-auto flex flex-col max-h-40 animate-in slide-in-from-left-4 fade-in">
                    <style>{`
                      .custom-scrollbar::-webkit-scrollbar { width: 3px; }
                      .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                      .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(6, 182, 212, 0.4); border-radius: 2px; }
                    `}</style>

                    <div className="p-2 border-b border-cyan-500/20 flex justify-between items-center bg-cyan-950/50 backdrop-blur">
                      <div className="flex items-center gap-2 text-cyan-400">
                        <List className="w-3 h-3" />
                        <span className="text-[10px] font-mono font-bold tracking-wider">{t('mission_wps')} ({Array.isArray(waypoints) ? waypoints.length : 0})</span>
                      </div>
                      <button
                        onClick={() => setShowWaypointList(false)}
                        className="text-slate-500 hover:text-red-400 transition-colors"
                        aria-label="Close waypoint list"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-1 space-y-0.5 custom-scrollbar">
                      {(Array.isArray(waypoints) ? waypoints : []).map((wp, idx) => (
                        <div key={`${idx}-${wp.lng}-${wp.lat}`} className="flex items-center justify-between px-2 py-1.5 rounded-sm bg-slate-900/30 border-l-2 border-transparent transition-all">
                          <div className="flex items-center gap-3">
                            <span className="text-[9px] font-mono text-slate-500 w-3 text-right">{String(idx + 1).padStart(2, '0')}</span>
                            <span className="text-[10px] font-mono text-cyan-100/80 tracking-wide">{t('waypoint')}_{idx + 1}</span>
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); setWaypoints && setWaypoints(prev => (Array.isArray(prev) ? prev : []).filter((_, i) => i !== idx)); }}
                            className="text-slate-600 hover:text-red-400 transition-all transform hover:scale-110"
                            aria-label="Delete waypoint"
                          >
                            <Trash className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                      {(!Array.isArray(waypoints) || waypoints.length === 0) && (
                        <div className="p-3 text-center text-[9px] text-slate-600 font-mono italic">
                          {t('no_waypoints')}
                        </div>
                      )}
                    </div>
                  </HUDBox>
                )}
              </div>

              <JoystickComponent 
                joystickActive={joystickActive} 
                setJoystickActive={setJoystickActive} 
                joystickPosition={joystickPosition} 
                setJoystickPosition={setJoystickPosition} 
                handleJoyMove={handleJoyMove} 
                joystickDisabled={joystickDisabled} 
              />
            </div>
          )}

          {activeTab === 'video' && (
            <div className="relative w-full h-full bg-black overflow-hidden">
              <FeaturePending title="OPTICAL_FEED" t={t} />
              <JoystickComponent 
                joystickActive={joystickActive} 
                setJoystickActive={setJoystickActive} 
                joystickPosition={joystickPosition} 
                setJoystickPosition={setJoystickPosition} 
                handleJoyMove={handleJoyMove} 
                joystickDisabled={joystickDisabled} 
              />
            </div>
          )}

          {activeTab === 'charts' && (
            <div className="w-full h-full bg-slate-950 relative">
               <EmbeddedChart 
                  dataRef={chartDataRef}
                  fps={chartFps}
                  t={t}
                  tcpStatus={tcpStatus}
                  persistedChannelExpanded={embeddedChannelExpanded}
                  persistedChannelEnabled={embeddedChannelEnabled}
                  onPersistConfig={onPersistEmbeddedChartConfig}
               />
            </div>
          )}
        </div>

        <BottomNav activeTab={activeTab} setActiveTab={setTab} lang={lang} />

        <LogDrawer
          show={!!showLogs}
          setShow={setShowLogs}
          logs={logs}
          setLogs={setLogs}
          devMode={devMode}
          setDevMode={setDevMode}
          sendData={sendData}
          t={t}
          topOffsetPx={0}
          fullWidth={true}
        />
      </div>
    );
  }

  window.MobileStationApp = MobileStationApp;
})();
