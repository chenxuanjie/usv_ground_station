(function () {
  const { useCallback, useEffect, useMemo, useRef, useState, memo } = React;

  // Import helpers and components
  const { Icon } = window.MobileUtils;
  const { HUDBox, StatusBar, BottomNav, SideDrawer, JoystickComponent, EmbeddedChart } = window.MobileComponents;

  // Icons
  const MapIcon = Icon('Map');
  const Video = Icon('Video');
  const Plus = Icon('Plus');
  const Target = Icon('Target');
  const Home = Icon('Home');
  const Check = Icon('Check');
  const LineChart = Icon('LineChart');
  const UploadCloud = Icon('UploadCloud');
  const Settings = Icon('Settings');
  const Zap = Icon('Zap');
  const RefreshCw = Icon('RefreshCw');
  const Activity = Icon('Activity');

  const FeaturePending = ({ title }) => (
    <div className="w-full h-full bg-slate-950 relative flex items-center justify-center">
      <div className="absolute top-0 w-full h-16 z-30 px-4 flex items-center bg-gradient-to-b from-slate-900 via-slate-900/80 to-transparent pointer-events-none">
        <div className="text-cyan-400 font-mono font-bold text-lg flex items-center gap-2">{title}</div>
      </div>
      <HUDBox className="p-6 w-[90%] max-w-sm">
        <div className="flex flex-col items-center justify-center text-slate-500 space-y-3">
          <Activity className="w-8 h-8 text-cyan-500/60 animate-pulse" />
          <div className="text-center space-y-1">
            <span className="font-mono text-xs block text-slate-400">FEATURE_PENDING</span>
            <span className="text-xs text-amber-500/80">待开发</span>
          </div>
        </div>
      </HUDBox>
    </div>
  );

  function MobileStationApp(props) {
    const {
      lang,
      setLang,
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
      setShowChart,
      chartDataRef, // [Added]
      chartFps,     // [Added]
      setShowSettings,
      showLogs,
      setShowLogs,
      logs,
      setLogs,
      devMode,
      setDevMode,
      sendData
    } = props;

    const [activeTab, setActiveTab] = useState('map');
    const [quickMenuOpen, setQuickMenuOpen] = useState(false);
    const [sideDrawerOpen, setSideDrawerOpen] = useState(false);
    const [joystickActive, setJoystickActive] = useState(false);
    const [joystickPosition, setJoystickPosition] = useState({ x: 0, y: 0 });
    const [mapMode, setMapMode] = useState('pan');

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
      const clamp = (v) => Math.max(-40, Math.min(40, v));
      setJoystickPosition({ x: clamp(dx), y: clamp(dy) });
    }, []);

    const joystickDisabled = tcpStatus !== 'ONLINE' || controlMode !== '@';

    return (
      <div className="relative w-full h-full bg-slate-950 flex flex-col overflow-hidden font-sans select-none">
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
              <StatusBar title="USV_OP_CORE" signal={signal} tcpStatus={tcpStatus} setSideDrawerOpen={setSideDrawerOpen} onOpenSettings={() => setShowSettings(true)} />

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
                    t={props.t}
                    showLogs={false}
                    controlledMapMode={mapMode}
                    hideToolbar={true}
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
                    {props.t ? props.t('finish_add') : (lang === 'zh' ? '添加完成' : 'Done')}
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
                        <span className="text-[10px] font-mono text-yellow-200 bg-black/60 px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity">ADD WP</span>
                        <div className="w-10 h-10 flex items-center justify-center border border-slate-700 bg-slate-900/90 hover:border-yellow-500/50 hover:bg-yellow-900/20 text-yellow-400 transition-all active:scale-90" style={{ clipPath: 'polygon(20% 0%, 80% 0%, 100% 20%, 100% 80%, 80% 100%, 20% 100%, 0% 80%, 0% 20%)' }}><MapIcon className="w-[18px] h-[18px]" /></div>
                      </button>
                      <button onClick={() => { sendWaypointsCommand && sendWaypointsCommand(); setQuickMenuOpen(false); }} className="flex items-center justify-end gap-2 group pointer-events-auto">
                        <span className="text-[10px] font-mono text-green-200 bg-black/60 px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity">UPLOAD</span>
                        <div className="w-10 h-10 flex items-center justify-center border border-slate-700 bg-slate-900/90 hover:border-green-500/50 hover:bg-green-900/20 text-green-400 transition-all active:scale-90" style={{ clipPath: 'polygon(20% 0%, 80% 0%, 100% 20%, 100% 80%, 80% 100%, 20% 100%, 0% 80%, 0% 20%)' }}><UploadCloud className="w-[18px] h-[18px]" /></div>
                      </button>
                      <button onClick={() => { setWaypoints([]); setQuickMenuOpen(false); }} className="flex items-center justify-end gap-2 group pointer-events-auto">
                        <span className="text-[10px] font-mono text-cyan-200 bg-black/60 px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity">CLEAR</span>
                        <div className="w-10 h-10 flex items-center justify-center border border-slate-700 bg-slate-900/90 hover:border-cyan-500/50 hover:bg-cyan-900/20 text-cyan-400 transition-all active:scale-90" style={{ clipPath: 'polygon(20% 0%, 80% 0%, 100% 20%, 100% 80%, 80% 100%, 20% 100%, 0% 80%, 0% 20%)' }}><Target className="w-[18px] h-[18px]" /></div>
                      </button>
                      <button onClick={() => { sendSCommand && sendSCommand(); setQuickMenuOpen(false); }} className="flex items-center justify-end gap-2 group pointer-events-auto">
                        <span className="text-[10px] font-mono text-cyan-200 bg-black/60 px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity">DEPLOY</span>
                        <div className="w-10 h-10 flex items-center justify-center border border-slate-700 bg-slate-900/90 hover:border-cyan-500/50 hover:bg-cyan-900/20 text-cyan-400 transition-all active:scale-90" style={{ clipPath: 'polygon(20% 0%, 80% 0%, 100% 20%, 100% 80%, 80% 100%, 20% 100%, 0% 80%, 0% 20%)' }}><Home className="w-[18px] h-[18px]" /></div>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="absolute bottom-24 left-4 z-20 w-44 pointer-events-none">
                <HUDBox className="p-3">
                  <div className="space-y-3">
                    <div className="space-y-1 font-mono">
                      <div className="flex justify-between text-[10px] text-cyan-600">
                        <span>LAT</span>
                        <span className="text-cyan-100">{lat ? lat.toFixed(6) : '0.000000'}</span>
                      </div>
                      <div className="flex justify-between text-[10px] text-cyan-600">
                        <span>LNG</span>
                        <span className="text-cyan-100">{lng ? lng.toFixed(6) : '0.000000'}</span>
                      </div>
                    </div>
                    <div className="h-px bg-cyan-900/50 w-full"></div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="text-center">
                        <div className="text-[9px] text-slate-400 mb-1">HDG</div>
                        <div className="text-lg font-mono font-bold text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]">{heading.toFixed(0)}°</div>
                      </div>
                      <div className="text-center">
                        <div className="text-[9px] text-slate-400 mb-1">WP</div>
                        <div className="text-lg font-mono font-bold text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]">{Array.isArray(waypoints) ? waypoints.length : 0}</div>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px]">
                        <span className="text-slate-400 flex items-center gap-1"><Zap className="w-3 h-3" /> BAT</span>
                        <span className={`${batteryPct < 30 ? 'text-red-400' : 'text-cyan-400'}`}>{batteryV ? batteryV.toFixed(2) : '0.00'}V</span>
                      </div>
                      <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                        <div className={`h-full shadow-[0_0_10px_currentColor] transition-all duration-500 ${batteryPct < 30 ? 'bg-red-500 text-red-500' : 'bg-cyan-500 text-cyan-500'}`} style={{ width: `${batteryPct}%` }}></div>
                      </div>
                      <div className="flex justify-between text-[9px] font-mono text-slate-500">
                        <span>L:{batL ? batL.toFixed(2) : '0.00'}</span>
                        <span>R:{batR ? batR.toFixed(2) : '0.00'}</span>
                      </div>
                    </div>
                  </div>
                </HUDBox>
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
              <FeaturePending title="OPTICAL_FEED" />
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
                  t={props.t}
                  tcpStatus={tcpStatus}
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
          t={props.t}
          topOffsetPx={0}
          fullWidth={true}
        />
      </div>
    );
  }

  window.MobileStationApp = MobileStationApp;
})();
