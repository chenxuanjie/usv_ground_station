(function () {
  const { useCallback, useEffect, useMemo, useRef, useState, memo } = React;

  const NullIcon = (p) => (
    <svg {...p} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" opacity="0.35"></circle>
      <path d="M8 12h8" opacity="0.55"></path>
    </svg>
  );

  const Icon = (name, fallback = NullIcon) => (window.Icons && window.Icons[name]) ? window.Icons[name] : fallback;
  const MapIcon = Icon('Map');
  const Video = Icon('Video');
  const FileText = Icon('FileText');
  const Settings = Icon('Settings');
  const Plus = Icon('Plus');
  const Wifi = Icon('Wifi');
  const Target = Icon('Target');
  const Home = Icon('Home');
  const ChevronUp = Icon('ChevronUp');
  const Activity = Icon('Activity');
  const Zap = Icon('Zap');
  const X = Icon('X');
  const Check = Icon('Check');
  const LineChart = Icon('LineChart');
  const UploadCloud = Icon('UploadCloud');
  const Menu = Icon('Menu');
  const Globe = Icon('Globe');
  const Ship = Icon('Ship');
  const RefreshCw = Icon('RefreshCw');
  const Network = Icon('Network');
  const Link = Icon('Link');
  const Unplug = Icon('Unplug');

  const TRANSLATIONS = {
    en: {
      system_status: "SYSTEM STATUS",
      manual: "MANUAL",
      auto: "AUTO",
      cruise: "CRUISE",
      connected: "CONNECTED",
      disconnected: "DISCONNECTED",
      deploy_mission: "DEPLOY MISSION",
      language: "LANGUAGE",
      mode_switch: "MODE SWITCH",
      map: "MAP",
      video: "VIDEO",
      data: "DATA",
      log: "LOG",
      connection: "CONNECTION CONFIG",
      ip: "TARGET IP",
      port: "PORT",
      connect_btn: "CONNECT DEVICE",
      disconnect_btn: "DISCONNECT",
      connecting: "CONNECTING..."
    },
    zh: {
      system_status: "系统状态",
      manual: "手动控制",
      auto: "自动航行",
      cruise: "定速巡航",
      connected: "已连接",
      disconnected: "未连接",
      deploy_mission: "下发任务",
      language: "语言设置",
      mode_switch: "模式切换",
      map: "地图",
      video: "图传",
      data: "数据",
      log: "日志",
      connection: "连接配置",
      ip: "目标 IP 地址",
      port: "端口",
      connect_btn: "连接设备",
      disconnect_btn: "断开连接",
      connecting: "正在连接..."
    }
  };

  const HUDBox = ({ children, className = "", noGlow = false }) => (
    <div className={`relative bg-slate-950/90 backdrop-blur-md border border-cyan-500/30 ${noGlow ? '' : 'shadow-[0_0_15px_-3px_rgba(6,182,212,0.15)]'} ${className}`}>
      <div className="absolute top-0 left-0 w-2 h-2 border-l-2 border-t-2 border-cyan-400"></div>
      <div className="absolute top-0 right-0 w-2 h-2 border-r-2 border-t-2 border-cyan-400"></div>
      <div className="absolute bottom-0 left-0 w-2 h-2 border-l-2 border-b-2 border-cyan-400"></div>
      <div className="absolute bottom-0 right-0 w-2 h-2 border-r-2 border-b-2 border-cyan-400"></div>
      {children}
    </div>
  );

  const StatusBar = memo(({ title, signal, tcpStatus, setSideDrawerOpen, onOpenSettings }) => (
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
              TCP_{tcpStatus}
            </span>
            <span className="flex items-center gap-1 text-cyan-300/70">
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse"></div>
              WS
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
            <Wifi className="w-3 h-3" /> LINK: {signal.toFixed(0)}%
          </div>
          <span className="text-[10px] text-slate-400 font-mono">RTK_FLOAT</span>
        </div>
      </div>
    </div>
  ));

  const NavButton = ({ id, icon, label, active, onClick }) => (
    <button
      onClick={() => onClick(id)}
      className={`flex-1 flex flex-col items-center justify-center h-full transition-all duration-300 group relative ${active ? 'text-cyan-400 bg-cyan-500/5' : 'text-slate-500 hover:text-cyan-200 hover:bg-slate-900'}`}
    >
      <div className={`transition-transform duration-300 ${active ? '-translate-y-1' : ''}`}>
        {icon}
      </div>
      <span className={`text-[9px] font-bold mt-1 tracking-widest transition-opacity duration-300 ${active ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'}`}>
        {label}
      </span>
      {active && <div className="absolute top-0 w-12 h-[2px] bg-cyan-400 shadow-[0_0_10px_cyan]"></div>}
    </button>
  );

  const BottomNav = ({ activeTab, setActiveTab, lang }) => {
    const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
    return (
      <div className="absolute bottom-0 left-0 w-full z-40 bg-slate-950/95 backdrop-blur-xl border-t border-cyan-500/20" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="flex items-center justify-around h-16 px-2">
          <NavButton id="map" icon={<MapIcon className="w-5 h-5" />} label={t.map} active={activeTab === 'map'} onClick={setActiveTab} />
          <div className="w-px h-6 bg-cyan-900/30"></div>
          <NavButton id="video" icon={<Video className="w-5 h-5" />} label={t.video} active={activeTab === 'video'} onClick={setActiveTab} />
          <div className="w-px h-6 bg-cyan-900/30"></div>
          <NavButton id="charts" icon={<LineChart className="w-5 h-5" />} label={t.data} active={activeTab === 'charts'} onClick={setActiveTab} />
          <div className="w-px h-6 bg-cyan-900/30"></div>
          <NavButton id="logs" icon={<FileText className="w-5 h-5" />} label={t.log} active={activeTab === 'logs'} onClick={setActiveTab} />
        </div>
        <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent"></div>
      </div>
    );
  };

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
    sendWaypointsCommand,
    onOpenSettings
  }) => {
    const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
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
              <button onClick={onOpenSettings} className="w-full py-3 px-4 border border-slate-700 bg-slate-900 text-slate-300 rounded font-mono text-xs font-bold tracking-wider hover:bg-slate-800 transition-colors flex items-center justify-center gap-2">
                <Settings className="w-4 h-4" /> SYSTEM_SETTINGS
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
                  />
                </div>
              </div>

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
                      <button onClick={() => { setShowChart(true); setQuickMenuOpen(false); }} className="flex items-center justify-end gap-2 group pointer-events-auto">
                        <span className="text-[10px] font-mono text-purple-200 bg-black/60 px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity">DATA</span>
                        <div className="w-10 h-10 flex items-center justify-center border border-slate-700 bg-slate-900/90 hover:border-purple-500/50 hover:bg-purple-900/20 text-purple-400 transition-all active:scale-90" style={{ clipPath: 'polygon(20% 0%, 80% 0%, 100% 20%, 100% 80%, 80% 100%, 20% 100%, 0% 80%, 0% 20%)' }}><LineChart className="w-[18px] h-[18px]" /></div>
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

              <div className={`absolute bottom-24 right-6 z-20 transition-opacity ${joystickDisabled ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
                <div
                  className="w-32 h-32 rounded-full border border-cyan-500/20 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center relative touch-none shadow-[inset_0_0_20px_rgba(6,182,212,0.1)] cursor-move pointer-events-auto"
                  onPointerDown={(e) => {
                    if (joystickDisabled) return;
                    e.currentTarget.setPointerCapture(e.pointerId);
                    setJoystickActive(true);
                    const rect = e.currentTarget.getBoundingClientRect();
                    handleJoyMove(e.clientX, e.clientY, rect);
                  }}
                  onPointerMove={(e) => {
                    if (!joystickActive) return;
                    const rect = e.currentTarget.getBoundingClientRect();
                    handleJoyMove(e.clientX, e.clientY, rect);
                  }}
                  onPointerUp={() => { setJoystickActive(false); setJoystickPosition({ x: 0, y: 0 }); }}
                  onPointerCancel={() => { setJoystickActive(false); setJoystickPosition({ x: 0, y: 0 }); }}
                >
                  <div className="absolute inset-2 rounded-full border border-dashed border-cyan-500/30 animate-[spin_10s_linear_infinite]"></div>
                  <div className="absolute inset-8 rounded-full border border-cyan-500/10"></div>
                  <div className={`w-14 h-14 rounded-full border-2 shadow-[0_0_15px_rgba(6,182,212,0.4)] flex items-center justify-center transition-transform duration-75 relative z-10 ${joystickActive ? 'bg-cyan-500/20 border-cyan-400 scale-95' : 'bg-slate-800/80 border-cyan-800'}`} style={{ transform: `translate(${joystickPosition.x}px, ${joystickPosition.y}px)` }}>
                    <div className={`w-2 h-2 rounded-full ${joystickActive ? 'bg-white shadow-[0_0_10px_white]' : 'bg-cyan-600'}`}></div>
                  </div>
                  <ChevronUp className="absolute top-3 text-cyan-500/50 w-4 h-4" />
                  <ChevronUp className="absolute bottom-3 text-cyan-500/50 w-4 h-4 rotate-180" />
                  <ChevronUp className="absolute left-3 text-cyan-500/50 w-4 h-4 -rotate-90" />
                  <ChevronUp className="absolute right-3 text-cyan-500/50 w-4 h-4 rotate-90" />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'video' && <FeaturePending title="OPTICAL_FEED" />}

          {activeTab === 'charts' && (
            <div className="w-full h-full bg-slate-950 relative">
              <div className="absolute top-0 w-full h-16 z-30 px-4 flex items-center bg-gradient-to-b from-slate-900 via-slate-900/80 to-transparent pointer-events-none">
                <div className="text-cyan-400 font-mono font-bold text-lg flex items-center gap-2">DATA_CORE</div>
              </div>
              <div className="absolute inset-0 pt-20 pb-24 px-4 overflow-y-auto">
                <HUDBox className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-mono text-slate-400">CHART</div>
                    <button onClick={() => setShowChart(true)} className="px-3 py-2 border border-cyan-500/40 bg-cyan-500/10 text-cyan-200 rounded font-mono text-xs font-bold hover:bg-cyan-500/15 transition-colors flex items-center gap-2">
                      <LineChart className="w-4 h-4" /> OPEN
                    </button>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    <div className="bg-slate-900/60 border border-slate-800 rounded p-3">
                      <div className="text-[10px] font-mono text-slate-500">BAT_V</div>
                      <div className="text-lg font-mono font-bold text-cyan-200">{batteryV ? batteryV.toFixed(2) : '0.00'}</div>
                    </div>
                    <div className="bg-slate-900/60 border border-slate-800 rounded p-3">
                      <div className="text-[10px] font-mono text-slate-500">HDG</div>
                      <div className="text-lg font-mono font-bold text-purple-200">{heading.toFixed(0)}</div>
                    </div>
                    <div className="bg-slate-900/60 border border-slate-800 rounded p-3">
                      <div className="text-[10px] font-mono text-slate-500">LINK</div>
                      <div className="text-lg font-mono font-bold text-green-200">{signal.toFixed(0)}%</div>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button onClick={() => setShowSettings(true)} className="flex-1 px-3 py-3 border border-slate-800 bg-slate-900/60 text-slate-200 rounded font-mono text-xs font-bold hover:bg-slate-800 transition-colors flex items-center justify-center gap-2">
                      <Settings className="w-4 h-4 text-cyan-400" /> SETTINGS
                    </button>
                    <button onClick={() => { if (setLogs) setLogs([]); }} className="flex-1 px-3 py-3 border border-slate-800 bg-slate-900/60 text-slate-200 rounded font-mono text-xs font-bold hover:bg-slate-800 transition-colors flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 text-cyan-400" /> CLEAR_LOG
                    </button>
                  </div>
                </HUDBox>
              </div>
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
