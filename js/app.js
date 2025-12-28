const { useState, useEffect, useRef, useCallback } = React;

function BoatGroundStation() {
    const [lang, setLang] = useState('zh');
    const [showLogs, setShowLogs] = useState(false);
    const [devMode, setDevMode] = useState(false);
    
    const t = useCallback((key) => {
        return AppTranslations && AppTranslations[lang] ? (AppTranslations[lang][key] || key) : key;
    }, [lang]);
    
    // 连接状态
    const [webConnected, setWebConnected] = useState(false);
    const [tcpStatus, setTcpStatus] = useState('OFFLINE'); 
    const [serverIp, setServerIp] = useState('120.77.0.8');
    const [serverPort, setServerPort] = useState('6202');

    // 船的状态
    const [boatStatus, setBoatStatus] = useState({
        longitude: 0, latitude: 0, heading: 0,
        batteryL: 0, batteryR: 0,
        lastUpdate: null,
    });
    
    // === 新增：航点列表状态 ===
    // 格式: [{lng: 113.xxx, lat: 23.xxx}, ...]
    const [waypoints, setWaypoints] = useState([]);

    const [logs, setLogs] = useState([]);
    const wsRef = useRef(null);
    const connectTimeoutRef = useRef(null);

    // 控制配置
    const [streamOn, setStreamOn] = useState(false);
    const [recvOn, setRecvOn] = useState(true);
    const [controlMode, setControlMode] = useState('@');
    const [cruiseMode, setCruiseMode] = useState('0');
    
    const [keyState, setKeyState] = useState({ w: false, a: false, s: false, d: false });

    // --- 核心逻辑 ---

    const addLog = (dir, msg, level = 'info') => {
        setLogs(prev => [{id: Date.now() + Math.random(), time: new Date().toLocaleTimeString(), dir, msg, level}, ...prev].slice(0, 100));
    };

    const sendData = (cmd) => {
        if (tcpStatus !== 'ONLINE' || !wsRef.current) {
            addLog('ERR', "未连接设备，无法发送指令", 'error');
            return;
        }
        const finalCmd = cmd.endsWith(',') ? cmd : cmd + ',';
        wsRef.current.send(finalCmd);
        
        if (finalCmd.startsWith('K,')) {
            addLog('TX', finalCmd, 'debug');
        } else {
            addLog('TX', finalCmd, 'info');
        }
    };

    // === 新增：发送航点 (P协议) ===
    const sendWaypointsCommand = () => {
        if (waypoints.length === 0) {
            alert("请先在地图上右键添加航点！");
            return;
        }

        // 拼接 P 报文: P,lng0,lat0,lng1,lat1,...,
        let cmd = "P";
        waypoints.forEach(wp => {
            cmd += `,${wp.lng.toFixed(7)},${wp.lat.toFixed(7)}`;
        });
        cmd += ","; // 协议结尾

        sendData(cmd);
        addLog('SYS', `已下发 ${waypoints.length} 个航点任务`, 'info');
    };

    const sendSCommand = () => {
        sendData(`S,${streamOn ? '1':'0'},${recvOn ? '3':'2'},q,${controlMode},${cruiseMode},`);
        if (!devMode) addLog('SYS', "配置已更新", 'info');
    };

    const sendKCommand = (w,a,s,d) => sendData(`K,${w},${a},${s},${d},`);

    const toggleConnection = () => {
        if (!wsRef.current) return;
        if (tcpStatus === 'ONLINE') {
            wsRef.current.send("CMD,DISCONNECT");
        } else if (tcpStatus === 'OFFLINE') {
            setTcpStatus('CONNECTING');
            addLog('SYS', `${t('log_connecting')} ${serverIp}:${serverPort}...`, 'info');
            wsRef.current.send(`CMD,CONNECT,${serverIp},${serverPort}`);
            
            if (connectTimeoutRef.current) clearTimeout(connectTimeoutRef.current);
            connectTimeoutRef.current = setTimeout(() => {
                if (tcpStatus !== 'ONLINE') {
                    setTcpStatus('OFFLINE');
                    addLog('ERR', t('log_timeout'), 'info');
                    alert(t('alert_timeout'));
                }
            }, 5000);
        }
    };

    // --- Effects ---

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
                addLog('SYS', AppTranslations['zh'].log_ws_disconnect, 'info');
            };
            ws.onmessage = (event) => {
                const msg = event.data;
                if (msg.startsWith('CURRENT_CONFIG')) {
                    const parts = msg.split(',');
                    if (parts.length >= 3) { setServerIp(parts[1]); setServerPort(parts[2]); }
                } 
                else if (msg.startsWith('TCP_STATUS')) {
                    const status = msg.split(',')[1]; 
                    clearTimeout(connectTimeoutRef.current);
                    if (status === 'ONLINE') {
                        setTcpStatus('ONLINE');
                        addLog('SYS', AppTranslations[lang === 'zh' ? 'zh' : 'en'].log_tcp_online, 'info');
                    } else if (status === 'OFFLINE') {
                        setTcpStatus('OFFLINE');
                        addLog('SYS', AppTranslations[lang === 'zh' ? 'zh' : 'en'].log_tcp_offline, 'info');
                    } else if (status === 'FAILED') {
                        setTcpStatus('OFFLINE');
                        addLog('ERR', AppTranslations[lang === 'zh' ? 'zh' : 'en'].log_tcp_failed, 'info');
                        alert(AppTranslations[lang === 'zh' ? 'zh' : 'en'].alert_failed);
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
                    addLog('RX', msg, 'debug');
                } else {
                    addLog('RX', msg, 'debug');
                }
            };
            wsRef.current = ws;
        };
        connectToBridge();
        return () => { if (wsRef.current) wsRef.current.close(); clearTimeout(connectTimeoutRef.current); };
    }, []); 

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.repeat || document.activeElement.tagName === 'INPUT') return;
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

    const getBtnConfig = () => {
        if (tcpStatus === 'ONLINE') return { text: t('btn_disconnect'), color: 'bg-red-600/90 hover:bg-red-700 border-red-500 shadow-red-900/50', disabled: false };
        if (tcpStatus === 'CONNECTING') return { text: t('btn_connecting'), color: 'bg-yellow-600/90 border-yellow-500 shadow-yellow-900/50', disabled: true };
        return { text: t('btn_connect'), color: 'bg-cyan-600/90 hover:bg-cyan-500 border-cyan-400 shadow-cyan-900/50', disabled: false };
    };

    return (
        <div className="flex flex-col h-screen bg-slate-950 text-slate-200 font-mono overflow-hidden relative bg-grid">
            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-cyan-900/10 to-transparent pointer-events-none"></div>

            <Header 
                lang={lang} setLang={setLang}
                webConnected={webConnected} tcpStatus={tcpStatus}
                serverIp={serverIp} setServerIp={setServerIp}
                serverPort={serverPort} setServerPort={setServerPort}
                toggleConnection={toggleConnection} btnConfig={getBtnConfig()}
                showLogs={showLogs} setShowLogs={setShowLogs}
                t={t}
            />

            <div className="flex-1 flex overflow-hidden relative z-0">
                <Sidebar 
                    boatStatus={boatStatus}
                    configState={{streamOn, setStreamOn, recvOn, setRecvOn, controlMode, setControlMode, cruiseMode, setCruiseMode}}
                    setConfigState={()=>{}} 
                    keyState={keyState}
                    sendSCommand={sendSCommand}
                    sendKCommand={sendKCommand}
                    // === 传递给 Sidebar 航点发送功能 ===
                    sendWaypointsCommand={sendWaypointsCommand}
                    waypointsCount={waypoints.length}
                    t={t}
                />

                <div className="flex-1 bg-slate-900 relative border-x border-cyan-900/10 overflow-hidden z-0">
                    {/* 地图组件：传入航点列表和修改函数 */}
                    <MapComponent 
                        lng={boatStatus.longitude} 
                        lat={boatStatus.latitude} 
                        heading={boatStatus.heading} 
                        waypoints={waypoints}
                        setWaypoints={setWaypoints}
                        cruiseMode={cruiseMode}
                        t={t}
                        showLogs={showLogs}
                    />

                    <div className="absolute top-4 left-4 flex gap-2 z-10">
                        <div className="bg-slate-950/80 backdrop-blur border border-cyan-500/30 px-3 py-1 text-xs rounded text-cyan-400 font-bold shadow-lg">Map View</div>
                        <div className="bg-black/40 backdrop-blur border border-white/10 px-3 py-1 text-xs rounded text-slate-400">Main Camera</div>
                    </div>
                    
                    {boatStatus.longitude === 0 && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-20 pointer-events-none">
                            <div className="text-center">
                                <Icons.MapPin className="w-8 h-8 text-yellow-500 mx-auto animate-bounce"/>
                                <span className="text-xs text-yellow-500 font-bold mt-2 block">WAITING FOR GPS FIX...</span>
                            </div>
                        </div>
                    )}
                </div>

                <LogDrawer 
                    show={showLogs} setShow={setShowLogs}
                    logs={logs} setLogs={setLogs}
                    devMode={devMode} setDevMode={setDevMode}
                    sendData={sendData}
                    t={t}
                />
            </div>
        </div>
    );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<BoatGroundStation />);