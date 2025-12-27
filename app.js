const { useState, useEffect, useRef } = React;

// --- 语言包定义 ---
const translations = {
    zh: {
        title: "无人艇控制终端",
        subtitle: "系统运行正常",
        target: "目标地址",
        ws_link: "前端连接",
        tcp_link: "小艇连接",
        btn_connect: "连接设备",
        btn_connecting: "连接中...",
        btn_disconnect: "断开连接",
        status_monitor: "状态监控",
        waiting_data: "等待数据",
        current_heading: "当前航向",
        latitude: "纬度",
        longitude: "经度",
        system_config: "系统配置",
        deploy_config: "部署配置",
        manual_override: "手动控制",
        main_camera: "主摄像头",
        map_view: "地图视图",
        no_signal: "无信号输入",
        system_logs: "系统终端", // 改名体现控制台属性
        cmd_placeholder: "输入指令...",
        toggle_logs: "终端 / 日志", // 按钮文字
        // 日志与提示
        log_ws_disconnect: "Backend 连接已断开 (请手动刷新页面)",
        log_tcp_online: "小艇连接成功！",
        log_tcp_offline: "小艇连接已断开",
        log_tcp_failed: "连接失败，请检查 IP/端口",
        alert_failed: "连接失败！无法连接到目标设备。",
        alert_timeout: "连接超时！后端没有响应。",
        log_connecting: "正在连接",
        log_timeout: "连接请求超时 (无响应)",
        // 配置按钮
        stream_on: "推流: 开启",
        stream_off: "推流: 关闭",
        recv_on: "接收: 开启",
        recv_off: "接收: 关闭",
        mode_auto: "模式: 自动 (#)",
        mode_manual: "模式: 手动 (@)",
        loop_on: "巡航: 开启 (1)",
        loop_off: "巡航: 关闭 (0)"
    },
    en: {
        title: "USV CONTROL TERMINAL",
        subtitle: "SYSTEM STABLE",
        target: "TARGET",
        ws_link: "WS_LINK",
        tcp_link: "TCP_LINK",
        btn_connect: "CONNECT DEVICE",
        btn_connecting: "CONNECTING...",
        btn_disconnect: "DISCONNECT",
        status_monitor: "STATUS MONITOR",
        waiting_data: "WAITING_DATA",
        current_heading: "CURRENT HEADING",
        latitude: "LATITUDE",
        longitude: "LONGITUDE",
        system_config: "SYSTEM CONFIG",
        deploy_config: "DEPLOY CONFIG",
        manual_override: "MANUAL OVERRIDE",
        main_camera: "MAIN CAMERA",
        map_view: "MAP VIEW",
        no_signal: "NO SIGNAL INPUT",
        system_logs: "SYSTEM TERMINAL",
        cmd_placeholder: "Execute command...",
        toggle_logs: "TERMINAL / LOGS",
        // Logs & Alerts
        log_ws_disconnect: "Backend disconnected (Please refresh)",
        log_tcp_online: "USV Connected Successfully!",
        log_tcp_offline: "USV Disconnected",
        log_tcp_failed: "Connection Failed. Check IP/Port",
        alert_failed: "Connection Failed! Cannot reach target.",
        alert_timeout: "Timeout! No response from backend.",
        log_connecting: "Connecting to",
        log_timeout: "Connection Request Timeout",
        // Config Buttons
        stream_on: "STREAM: ON",
        stream_off: "STREAM: OFF",
        recv_on: "RECV: ON",
        recv_off: "RECV: OFF",
        mode_auto: "MODE: AUTO (#)",
        mode_manual: "MODE: MANUAL (@)",
        loop_on: "LOOP: ON (1)",
        loop_off: "LOOP: OFF (0)"
    }
};

// 图标组件
const Icons = {
    Activity: (p) => <svg {...p} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>,
    Battery: (p) => <svg {...p} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="16" height="10" x="2" y="7" rx="2" ry="2"/><line x1="22" x2="22" y1="11" y2="13"/></svg>,
    Settings: (p) => <svg {...p} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.09a2 2 0 0 1-1-1.74v-.47a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.39a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>,
    Send: (p) => <svg {...p} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>,
    RefreshCw: (p) => <svg {...p} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>,
    ArrowUp: (p) => <svg {...p} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 7-7 7 7"/><path d="M12 19V5"/></svg>,
    ArrowDown: (p) => <svg {...p} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14"/><path d="m19 12-7 7-7-7"/></svg>,
    ArrowLeft: (p) => <svg {...p} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>,
    ArrowRight: (p) => <svg {...p} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>,
    Navigation: (p) => <svg {...p} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>,
    MapPin: (p) => <svg {...p} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>,
    Video: (p) => <svg {...p} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2" ry="2"/></svg>,
    Globe: (p) => <svg {...p} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" x2="22" y1="12" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
    Sidebar: (p) => <svg {...p} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><line x1="15" x2="15" y1="3" y2="21"/></svg>,
    X: (p) => <svg {...p} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 18 18"/></svg>
};

function BoatGroundStation() {
    // 语言状态: 'zh' 或 'en'
    const [lang, setLang] = useState('zh');
    const [showLogs, setShowLogs] = useState(false); // 抽屉开关状态
    
    // 翻译辅助函数
    const t = (key) => translations[lang][key] || key;

    const [webConnected, setWebConnected] = useState(false);
    const [tcpStatus, setTcpStatus] = useState('OFFLINE'); 
    
    // 船的状态数据
    const [boatStatus, setBoatStatus] = useState({
        longitude: 0, latitude: 0, heading: 0,
        batteryL: 0, batteryR: 0,
        lastUpdate: null,
    });
    
    const [logs, setLogs] = useState([]);
    const [inputCmd, setInputCmd] = useState('');
    const wsRef = useRef(null);
    const logEndRef = useRef(null); // 用于自动滚动日志
    
    // 连接配置
    const [serverIp, setServerIp] = useState('120.77.0.8');
    const [serverPort, setServerPort] = useState('6202');
    const connectTimeoutRef = useRef(null);

    // 控制指令状态
    const [streamOn, setStreamOn] = useState(false);
    const [recvOn, setRecvOn] = useState(true);
    const [controlMode, setControlMode] = useState('@');
    const [cruiseMode, setCruiseMode] = useState('0');
    
    // 键盘按键状态
    const [keyState, setKeyState] = useState({ w: false, a: false, s: false, d: false });

    // 1. WebSocket 连接与数据处理逻辑
    useEffect(() => {
        const connectToBridge = () => {
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const wsUrl = `${protocol}//${window.location.host}`; 
            const ws = new WebSocket(wsUrl);
            
            ws.onopen = () => {
                setWebConnected(true);
                ws.send("GET_CONFIG");
                ws.send("CMD,QUERY_STATUS"); 
            };

            ws.onclose = () => {
                setWebConnected(false);
                setTcpStatus('OFFLINE');
                addLog('SYS', translations['zh'].log_ws_disconnect);
            };

            ws.onmessage = (event) => {
                const msg = event.data;
                
                if (msg.startsWith('CURRENT_CONFIG')) {
                    const parts = msg.split(',');
                    if (parts.length >= 3) {
                        setServerIp(parts[1]);
                        setServerPort(parts[2]);
                    }
                } 
                else if (msg.startsWith('TCP_STATUS')) {
                    const status = msg.split(',')[1]; 
                    clearTimeout(connectTimeoutRef.current);
                    
                    if (status === 'ONLINE') {
                        setTcpStatus('ONLINE');
                        addLog('SYS', translations[lang === 'zh' ? 'zh' : 'en'].log_tcp_online);
                    } else if (status === 'OFFLINE') {
                        setTcpStatus('OFFLINE');
                        addLog('SYS', translations[lang === 'zh' ? 'zh' : 'en'].log_tcp_offline);
                    } else if (status === 'FAILED') {
                        setTcpStatus('OFFLINE');
                        addLog('ERR', translations[lang === 'zh' ? 'zh' : 'en'].log_tcp_failed);
                        alert(translations[lang === 'zh' ? 'zh' : 'en'].alert_failed);
                    }
                }
                else if (msg.startsWith('R')) {
                    const parts = msg.split(',');
                    if (parts.length >= 6) {
                        setBoatStatus({
                            longitude: parseFloat(parts[1]) || 0,
                            latitude: parseFloat(parts[2]) || 0,
                            heading: parseFloat(parts[3]) || 0,
                            batteryL: parseFloat(parts[4]) || 0,
                            batteryR: parseFloat(parts[5]) || 0,
                            lastUpdate: new Date()
                        });
                    }
                } else {
                    addLog('RX', msg);
                }
            };
            wsRef.current = ws;
        };

        connectToBridge();

        return () => { 
            if (wsRef.current) wsRef.current.close(); 
            clearTimeout(connectTimeoutRef.current);
        };
    }, []); 

    // 日志辅助函数
    const addLog = (dir, msg) => {
        setLogs(prev => {
            const newLogs = [{id: Date.now(), time: new Date().toLocaleTimeString(), dir, msg}, ...prev].slice(0, 50);
            return newLogs;
        });
        // 收到日志时如果抽屉关闭，可以考虑显示一个小红点，这里暂不实现，保持简洁
    };

    const sendData = (cmd) => {
        if (tcpStatus !== 'ONLINE' || !wsRef.current) return;
        const finalCmd = cmd.endsWith(',') ? cmd : cmd + ',';
        wsRef.current.send(finalCmd);
        addLog('TX', finalCmd);
    };

    const sendSCommand = () => sendData(`S,${streamOn ? '1':'0'},${recvOn ? '3':'2'},q,${controlMode},${cruiseMode},`);
    const sendKCommand = (w,a,s,d) => sendData(`K,${w},${a},${s},${d},`);

    // 2. 键盘监听逻辑
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.repeat) return; 
            // 如果焦点在输入框，不触发WASD控制
            if (document.activeElement.tagName === 'INPUT') return;

            const key = e.key.toLowerCase();
            
            if (['w', 'a', 's', 'd'].includes(key)) {
                setKeyState(prev => ({ ...prev, [key]: true }));
                if (key === 'w') sendKCommand(1, 0, 0, 0);
                if (key === 'a') sendKCommand(0, 1, 0, 0);
                if (key === 's') sendKCommand(0, 0, 1, 0);
                if (key === 'd') sendKCommand(0, 0, 0, 1);
            }
        };

        const handleKeyUp = (e) => {
            const key = e.key.toLowerCase();
            if (['w', 'a', 's', 'd'].includes(key)) {
                setKeyState(prev => ({ ...prev, [key]: false }));
                sendKCommand(0, 0, 0, 0);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [tcpStatus]); 

    // 连接按钮逻辑
    const toggleConnection = () => {
        if (!wsRef.current) return;

        if (tcpStatus === 'ONLINE') {
            wsRef.current.send("CMD,DISCONNECT");
        } else if (tcpStatus === 'OFFLINE') {
            setTcpStatus('CONNECTING');
            addLog('SYS', `${t('log_connecting')} ${serverIp}:${serverPort}...`);
            wsRef.current.send(`CMD,CONNECT,${serverIp},${serverPort}`);
            
            if (connectTimeoutRef.current) clearTimeout(connectTimeoutRef.current);
            connectTimeoutRef.current = setTimeout(() => {
                if (tcpStatus !== 'ONLINE') {
                    setTcpStatus('OFFLINE');
                    addLog('ERR', t('log_timeout'));
                    alert(t('alert_timeout'));
                }
            }, 5000);
        }
    };

    const getBtnConfig = () => {
        if (tcpStatus === 'ONLINE') {
            return { text: t('btn_disconnect'), color: 'bg-red-600/90 hover:bg-red-700 border-red-500 shadow-red-900/50', disabled: false };
        }
        if (tcpStatus === 'CONNECTING') {
            return { text: t('btn_connecting'), color: 'bg-yellow-600/90 border-yellow-500 shadow-yellow-900/50', disabled: true };
        }
        return { text: t('btn_connect'), color: 'bg-cyan-600/90 hover:bg-cyan-500 border-cyan-400 shadow-cyan-900/50', disabled: false };
    };
    const btnConfig = getBtnConfig();

    return (
        <div className="flex flex-col h-screen bg-slate-950 text-slate-200 font-mono overflow-hidden relative bg-grid">
            {/* 背景装饰光 */}
            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-cyan-900/10 to-transparent pointer-events-none"></div>

            {/* Header */}
            <header className="h-14 bg-slate-900/80 border-b border-cyan-500/30 flex items-center px-4 justify-between shrink-0 backdrop-blur-md relative z-20">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-cyan-500/10 border border-cyan-500/50 rounded">
                        <Icons.Activity className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                        <h1 className="text-lg font-black text-white tracking-wider italic">USV<span className="text-cyan-500">TERMINAL</span></h1>
                        <p className="text-[10px] text-cyan-500/60 -mt-1 tracking-widest uppercase">{t('subtitle')}</p>
                    </div>
                    {/* 语言切换按钮 */}
                    <button 
                        onClick={() => setLang(prev => prev === 'zh' ? 'en' : 'zh')}
                        className="ml-4 flex items-center gap-1 px-2 py-0.5 border border-cyan-500/30 rounded bg-slate-800/50 text-[10px] text-cyan-400 hover:bg-cyan-500/10 hover:border-cyan-400 transition-all"
                    >
                        <Icons.Globe size={10} />
                        {lang === 'zh' ? '中 / EN' : 'ZH / EN'}
                    </button>
                </div>
                
                <div className="flex items-center gap-4">
                    {/* IP 输入框组 */}
                    <div className="flex items-center bg-slate-950/50 border border-slate-700/50 rounded overflow-hidden group hover:border-cyan-500/50 transition-colors">
                        <span className="text-[10px] text-slate-500 px-2 bg-slate-900 border-r border-slate-800">{t('target')}</span>
                        <input 
                            className="bg-transparent text-xs w-28 text-center focus:outline-none text-cyan-100 disabled:opacity-50 py-1" 
                            value={serverIp} 
                            onChange={e => setServerIp(e.target.value)} 
                            disabled={tcpStatus !== 'OFFLINE'}
                        />
                        <div className="w-[1px] h-4 bg-slate-800"></div>
                        <input 
                            className="bg-transparent text-xs w-14 text-center focus:outline-none text-cyan-100 disabled:opacity-50 py-1" 
                            value={serverPort} 
                            onChange={e => setServerPort(e.target.value)} 
                            disabled={tcpStatus !== 'OFFLINE'}
                        />
                    </div>

                    <button 
                        onClick={toggleConnection}
                        disabled={!webConnected || btnConfig.disabled}
                        className={`${btnConfig.color} text-xs px-4 py-1.5 rounded border transition-all duration-300 min-w-[90px] font-bold shadow-[0_0_15px_rgba(0,0,0,0.3)] tracking-wide uppercase`}
                    >
                        {btnConfig.text}
                    </button>

                    {/* 分隔线 */}
                    <div className="w-[1px] h-6 bg-slate-700 mx-1"></div>

                    {/* 日志抽屉开关按钮 */}
                    <button 
                        onClick={() => setShowLogs(!showLogs)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded border text-xs font-bold transition-all ${showLogs ? 'bg-cyan-500 text-white border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.4)]' : 'bg-slate-800 border-slate-600 text-slate-400 hover:text-white hover:border-slate-500'}`}
                    >
                        <Icons.Sidebar size={14} />
                        {t('toggle_logs')}
                    </button>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden relative z-0">
                {/* === Left Sidebar === */}
                <div className="w-80 bg-slate-950/80 border-r border-cyan-900/30 flex flex-col p-4 gap-4 overflow-y-auto backdrop-blur-sm scrollbar-hide z-10">
                    
                    {/* Module 1: HUD Monitor */}
                    <div className="relative p-4 rounded-lg border border-cyan-500/30 bg-slate-900/90 shadow-[0_0_20px_rgba(6,182,212,0.05)] overflow-hidden group">
                        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-cyan-400"></div>
                        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-cyan-400"></div>
                        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"></div>
                        
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xs font-bold text-cyan-500 tracking-widest uppercase flex items-center gap-2">
                                <Icons.MapPin size={14}/> {t('status_monitor')}
                            </h3>
                            {!boatStatus.lastUpdate && <span className="text-[10px] text-yellow-500 animate-pulse">{t('waiting_data')}</span>}
                        </div>

                        <div className="flex items-center justify-between mb-6">
                            <div className="relative w-16 h-16 border-2 border-slate-700 rounded-full flex items-center justify-center bg-slate-950 shadow-inner">
                                <div className="absolute top-0 w-1 h-2 bg-cyan-400 z-10"></div>
                                <div className="absolute inset-1 border border-dashed border-slate-600 rounded-full opacity-50"></div>
                                <div style={{ transform: `rotate(${boatStatus.heading}deg)`, transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)' }} className="w-full h-full flex items-center justify-center">
                                    <Icons.Navigation className="text-cyan-400 drop-shadow-[0_0_5px_rgba(34,211,238,0.8)]" size={24} />
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-4xl font-black text-white tracking-tighter drop-shadow-md">
                                    {boatStatus.heading.toFixed(1)}<span className="text-lg text-cyan-600 ml-1">°</span>
                                </div>
                                <div className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">{t('current_heading')}</div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-slate-950/50 p-2 rounded border border-slate-800 mb-4">
                            <div className="flex flex-col">
                                <span className="text-[10px] text-slate-500 mb-1">{t('latitude')}</span>
                                <span className="text-cyan-100 font-bold">{boatStatus.latitude.toFixed(6)}</span>
                            </div>
                            <div className="flex flex-col text-right">
                                <span className="text-[10px] text-slate-500 mb-1">{t('longitude')}</span>
                                <span className="text-cyan-100 font-bold">{boatStatus.longitude.toFixed(6)}</span>
                            </div>
                        </div>

                        <div className="space-y-3 pt-3 border-t border-slate-800/50">
                            <div className="space-y-1">
                                <div className="flex justify-between text-[10px] text-cyan-300 font-bold">
                                    <span>PWR_L</span>
                                    <span>{boatStatus.batteryL.toFixed(2)}V</span>
                                </div>
                                <div className="h-1.5 bg-slate-800 rounded-sm overflow-hidden relative">
                                    <div className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.5)] transition-all duration-1000" style={{width: `${(boatStatus.batteryL/14)*100}%`}}></div>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <div className="flex justify-between text-[10px] text-cyan-300 font-bold">
                                    <span>PWR_R</span>
                                    <span>{boatStatus.batteryR.toFixed(2)}V</span>
                                </div>
                                <div className="h-1.5 bg-slate-800 rounded-sm overflow-hidden relative">
                                    <div className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.5)] transition-all duration-1000" style={{width: `${(boatStatus.batteryR/14)*100}%`}}></div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Module 2: Controls Config */}
                    <div className="p-4 rounded-lg border border-slate-800 bg-slate-900/50 hover:border-slate-700 transition-colors">
                        <h3 className="text-xs font-bold text-slate-400 mb-3 flex items-center gap-2 uppercase tracking-wider">
                            <Icons.Settings size={14}/> {t('system_config')}
                        </h3>
                        <div className="space-y-2">
                            <div className="grid grid-cols-2 gap-2">
                                <button onClick={() => setStreamOn(!streamOn)} className={`p-1.5 rounded border text-[10px] font-bold transition-all ${streamOn?'bg-cyan-500/20 border-cyan-500 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.2)]':'border-slate-700 text-slate-500 hover:border-slate-500'}`}>{streamOn?t('stream_on'):t('stream_off')}</button>
                                <button onClick={() => setRecvOn(!recvOn)} className={`p-1.5 rounded border text-[10px] font-bold transition-all ${recvOn?'bg-cyan-500/20 border-cyan-500 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.2)]':'border-slate-700 text-slate-500 hover:border-slate-500'}`}>{recvOn?t('recv_on'):t('recv_off')}</button>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <button onClick={() => setControlMode('#')} className={`p-1.5 rounded border text-[10px] font-bold transition-all ${controlMode==='#'?'bg-cyan-500/20 border-cyan-500 text-cyan-300':'border-slate-700 text-slate-500 hover:border-slate-500'}`}>{t('mode_auto')}</button>
                                <button onClick={() => setControlMode('@')} className={`p-1.5 rounded border text-[10px] font-bold transition-all ${controlMode==='@'?'bg-cyan-500/20 border-cyan-500 text-cyan-300':'border-slate-700 text-slate-500 hover:border-slate-500'}`}>{t('mode_manual')}</button>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <button onClick={() => setCruiseMode('1')} className={`p-1.5 rounded border text-[10px] font-bold transition-all ${cruiseMode==='1'?'bg-cyan-500/20 border-cyan-500 text-cyan-300':'border-slate-700 text-slate-500 hover:border-slate-500'}`}>{t('loop_on')}</button>
                                <button onClick={() => setCruiseMode('0')} className={`p-1.5 rounded border text-[10px] font-bold transition-all ${cruiseMode==='0'?'bg-cyan-500/20 border-cyan-500 text-cyan-300':'border-slate-700 text-slate-500 hover:border-slate-500'}`}>{t('loop_off')}</button>
                            </div>
                            <button onClick={sendSCommand} className="w-full mt-2 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white text-xs py-2 rounded font-bold shadow-lg tracking-wide">{t('deploy_config')}</button>
                        </div>
                    </div>

                    {/* Module 3: Remote Control */}
                    <div className="p-4 rounded-lg border border-slate-800 bg-slate-900/50 flex flex-col items-center relative">
                        <div className="absolute top-2 left-2 text-[10px] text-slate-600 font-bold uppercase tracking-widest">{t('manual_override')}</div>
                        <div className="grid grid-cols-3 gap-2 mt-4">
                            <div/>
                            <button 
                                onMouseDown={()=>sendKCommand(1,0,0,0)} 
                                onMouseUp={()=>sendKCommand(0,0,0,0)} 
                                className={`w-14 h-14 border-2 rounded-lg flex items-center justify-center transition-all duration-100 ${keyState.w ? 'bg-cyan-500 border-cyan-300 text-white shadow-[0_0_15px_rgba(6,182,212,0.6)] scale-95' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700 hover:border-slate-500'}`}
                            >
                                <Icons.ArrowUp size={24}/>
                            </button>
                            <div/>
                            
                            <button 
                                onMouseDown={()=>sendKCommand(0,1,0,0)} 
                                onMouseUp={()=>sendKCommand(0,0,0,0)} 
                                className={`w-14 h-14 border-2 rounded-lg flex items-center justify-center transition-all duration-100 ${keyState.a ? 'bg-cyan-500 border-cyan-300 text-white shadow-[0_0_15px_rgba(6,182,212,0.6)] scale-95' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700 hover:border-slate-500'}`}
                            >
                                <Icons.ArrowLeft size={24}/>
                            </button>
                            
                            <button 
                                onMouseDown={()=>sendKCommand(0,0,1,0)} 
                                onMouseUp={()=>sendKCommand(0,0,0,0)} 
                                className={`w-14 h-14 border-2 rounded-lg flex items-center justify-center transition-all duration-100 ${keyState.s ? 'bg-cyan-500 border-cyan-300 text-white shadow-[0_0_15px_rgba(6,182,212,0.6)] scale-95' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700 hover:border-slate-500'}`}
                            >
                                <Icons.ArrowDown size={24}/>
                            </button>
                            
                            <button 
                                onMouseDown={()=>sendKCommand(0,0,0,1)} 
                                onMouseUp={()=>sendKCommand(0,0,0,0)} 
                                className={`w-14 h-14 border-2 rounded-lg flex items-center justify-center transition-all duration-100 ${keyState.d ? 'bg-cyan-500 border-cyan-300 text-white shadow-[0_0_15px_rgba(6,182,212,0.6)] scale-95' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700 hover:border-slate-500'}`}
                            >
                                <Icons.ArrowRight size={24}/>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Center Area (Auto expands when logs are closed) */}
                <div className="flex-1 bg-slate-900/50 relative flex items-center justify-center border-x border-cyan-900/10 scan-effect overflow-hidden z-0">
                        {/* 这里可以放视频流 */}
                        <div className="absolute top-4 left-4 flex gap-2">
                            <div className="bg-black/40 backdrop-blur border border-white/10 px-3 py-1 text-xs rounded text-slate-400">{t('main_camera')}</div>
                            <div className="bg-black/40 backdrop-blur border border-white/10 px-3 py-1 text-xs rounded text-slate-400">{t('map_view')}</div>
                        </div>
                        
                        <div className="text-center opacity-30 pointer-events-none">
                        <Icons.Video size={64} className="mx-auto text-cyan-800 mb-4"/>
                        <div className="text-xl font-bold text-cyan-800 tracking-widest">{t('no_signal')}</div>
                        </div>
                </div>

                {/* === Right Drawer: Logs (Slide in/out) === */}
                <div 
                    className={`fixed right-0 top-14 bottom-0 w-80 bg-slate-950/95 flex flex-col text-xs border-l border-cyan-900/50 backdrop-blur-md shadow-2xl transition-transform duration-300 ease-in-out z-30 ${showLogs ? 'translate-x-0' : 'translate-x-full'}`}
                >
                    <div className="p-3 border-b border-cyan-900/30 flex justify-between items-center bg-slate-900/50">
                        <span className="font-bold text-cyan-500 tracking-wider flex items-center gap-2"><Icons.Activity size={14}/> {t('system_logs')}</span>
                        <div className="flex gap-2">
                            <button onClick={()=>setLogs([])} className="text-slate-500 hover:text-white transition-colors"><Icons.RefreshCw size={12}/></button>
                            <button onClick={()=>setShowLogs(false)} className="text-slate-500 hover:text-white transition-colors"><Icons.X size={14}/></button>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-3 font-mono space-y-2">
                        {logs.map(log => (
                            <div key={log.id} className="break-all border-l-2 pl-2 text-[10px] leading-relaxed transition-all animate-[fadeIn_0.3s_ease-out]" 
                                    style={{borderColor: log.dir==='TX'?'#10b981':(log.dir==='ERR'?'#ef4444':(log.dir==='RX'?'#3b82f6':'#64748b'))}}>
                                <div className="flex justify-between opacity-50 mb-0.5">
                                    <span>{log.time}</span>
                                    <span>{log.dir}</span>
                                </div>
                                <span className={log.dir==='TX'?'text-green-400':(log.dir==='ERR'?'text-red-400':(log.dir==='RX'?'text-blue-300':'text-slate-300'))}> {log.msg}</span>
                            </div>
                        ))}
                        <div ref={logEndRef}></div>
                    </div>
                    <div className="p-3 border-t border-cyan-900/30 bg-slate-900/90">
                        <div className="flex items-center bg-slate-950 border border-slate-800 rounded px-2 py-1 focus-within:border-cyan-500/50 transition-colors">
                            <span className="text-cyan-500 mr-2">$</span>
                            <input value={inputCmd} onChange={e=>setInputCmd(e.target.value)} className="flex-1 bg-transparent outline-none p-1 text-cyan-100 placeholder-slate-700" placeholder={t('cmd_placeholder')} />
                            <button onClick={()=>{sendData(inputCmd);setInputCmd('')}} className="text-cyan-500 hover:text-cyan-300"><Icons.Send size={14}/></button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<BoatGroundStation />);