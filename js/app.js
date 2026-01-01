// js/app.js
const { useState, useEffect, useRef, useCallback } = React;

function NotificationCenter({ items, onDismiss }) {
    const [, forceUpdate] = useState({});

    useEffect(() => {
        const timer = window.setInterval(() => forceUpdate({}), 50);
        return () => window.clearInterval(timer);
    }, []);

    const now = Date.now();

    const CheckCircle2 = ({ className }) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M8 12l2.5 2.5L16 9"></path>
        </svg>
    );

    const AlertTriangle = ({ className }) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12" y2="17"></line>
        </svg>
    );

    const XCircle = ({ className }) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="15" y1="9" x2="9" y2="15"></line>
            <line x1="9" y1="9" x2="15" y2="15"></line>
        </svg>
    );

    const Info = ({ className }) => (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12" y2="8"></line>
        </svg>
    );

    const Loader2 = ({ className }) => (
        <svg className={className} viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.25"></circle>
            <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"></path>
        </svg>
    );

    const getTheme = (type) => {
        const base = "backdrop-blur-md border shadow-lg transition-all duration-300";

        if (type === 'success') {
            return {
                wrapper: `${base} bg-emerald-950/60 border-emerald-500/30 shadow-emerald-900/20`,
                icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" />,
                titleColor: "text-emerald-100",
                msgColor: "text-emerald-200/70",
                progress: "bg-emerald-500",
                glow: "shadow-[0_0_15px_-3px_rgba(16,185,129,0.3)]"
            };
        }
        if (type === 'warning') {
            return {
                wrapper: `${base} bg-amber-950/60 border-amber-500/30 shadow-amber-900/20`,
                icon: <AlertTriangle className="w-5 h-5 text-amber-400" />,
                titleColor: "text-amber-100",
                msgColor: "text-amber-200/70",
                progress: "bg-amber-500",
                glow: "shadow-[0_0_15px_-3px_rgba(245,158,11,0.3)]"
            };
        }
        if (type === 'error') {
            return {
                wrapper: `${base} bg-rose-950/60 border-rose-500/30 shadow-rose-900/20`,
                icon: <XCircle className="w-5 h-5 text-rose-400" />,
                titleColor: "text-rose-100",
                msgColor: "text-rose-200/70",
                progress: "bg-rose-500",
                glow: "shadow-[0_0_15px_-3px_rgba(244,63,94,0.3)]"
            };
        }

        return {
            wrapper: `${base} bg-slate-900/80 border-cyan-500/30 shadow-cyan-900/20`,
            icon: <Info className="w-5 h-5 text-cyan-400" />,
            titleColor: "text-cyan-100",
            msgColor: "text-cyan-200/70",
            progress: "bg-cyan-500",
            glow: "shadow-[0_0_15px_-3px_rgba(6,182,212,0.3)]"
        };
    };

    if (!items || items.length === 0) return null;

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col-reverse gap-3 w-[380px] max-w-[calc(100vw-2rem)] pointer-events-none">
            {items.map((item) => {
                const theme = getTheme(item.type);
                const showTimer = Number.isFinite(item.durationMs) && item.durationMs > 0 && Number.isFinite(item.dismissAt);
                const fractionLeft = showTimer ? Math.max(0, Math.min(1, (item.dismissAt - now) / item.durationMs)) : 0;
                const percent = Number.isFinite(item.progress) ? Math.max(0, Math.min(100, item.progress)) : null;

                return (
                    <div
                        key={item.id}
                        className={`pointer-events-auto group relative overflow-hidden rounded-lg p-3 ${theme.wrapper} ${theme.glow}`}
                        style={{ animation: 'slideInRight 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)' }}
                    >
                        <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 mt-0.5">
                                {item.loading ? (
                                    <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
                                ) : (
                                    theme.icon
                                )}
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className={`text-sm font-semibold font-mono tracking-wide ${theme.titleColor}`}>
                                    {String(item.type || 'info').toUpperCase()}
                                </div>
                                <div className={`text-sm mt-0.5 leading-5 break-words ${theme.msgColor}`}>{item.message}</div>

                                {item.loading && percent !== null && (
                                    <div className="mt-2 flex items-center justify-between text-xs font-mono text-slate-400">
                                        <span>PROCESSING...</span>
                                        <span>{percent.toFixed(0)}%</span>
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={() => onDismiss(item.id)}
                                className="flex-shrink-0 text-slate-500 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                                aria-label="Close"
                            >
                                <Icons.X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="absolute bottom-0 left-0 w-full h-[2px] bg-slate-800/50">
                            {item.loading && percent !== null ? (
                                <div
                                    className={`h-full ${theme.progress} transition-all duration-150 ease-linear shadow-[0_0_8px_rgba(255,255,255,0.5)]`}
                                    style={{ width: `${percent}%` }}
                                ></div>
                            ) : showTimer ? (
                                <div
                                    className={`h-full ${theme.progress} opacity-60`}
                                    style={{ width: `${fractionLeft * 100}%`, transition: 'width 0.1s linear' }}
                                ></div>
                            ) : null}
                        </div>

                        <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-white/5 to-transparent rounded-bl-3xl pointer-events-none"></div>
                    </div>
                );
            })}
            <style>{`
                @keyframes slideInRight {
                    from { opacity: 0; transform: translateY(20px) scale(0.95); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
            `}</style>
        </div>
    );
}

function BoatGroundStation() {
    const [lang, setLang] = useState('zh');
    const langRef = useRef(lang);
    const [showLogs, setShowLogs] = useState(false);
    // [新增] 设置弹窗状态
    const [showSettings, setShowSettings] = useState(false);
    const [devMode, setDevMode] = useState(false);
    const devModeRef = useRef(devMode);
    const setDevModeSafe = useCallback((checked) => {
        devModeRef.current = checked;
        setDevMode(checked);
    }, []);

    useEffect(() => {
        devModeRef.current = devMode;
    }, [devMode]);

    useEffect(() => {
        langRef.current = lang;
    }, [lang]);

    // 图表数据 Ref (全速)
    const [showChart, setShowChart] = useState(false);
    const chartDataRef = useRef([]); 
    const [chartFps, setChartFps] = useState(() => {
        const stored = window.localStorage ? window.localStorage.getItem('chart_fps') : null;
        const parsed = stored ? Number(stored) : NaN;
        const fallback = 120;
        const value = Number.isFinite(parsed) ? parsed : fallback;
        return Math.min(240, Math.max(5, Math.round(value)));
    });
    
    // UI 更新节流阀 (关键优化)
    const lastUiUpdateRef = useRef(0);
    
    const t = useCallback((key) => {
        return AppTranslations && AppTranslations[lang] ? (AppTranslations[lang][key] || key) : key;
    }, [lang]);
    
    const [webConnected, setWebConnected] = useState(false);
    const [tcpStatus, setTcpStatus] = useState('OFFLINE'); 
    const [serverIp, setServerIp] = useState('');
    const [serverPort, setServerPort] = useState('');
    const [autoReconnect, setAutoReconnect] = useState(false);
    const [isAutoReconnectLooping, setIsAutoReconnectLooping] = useState(false); // [新增] 状态用于UI显示取消按钮

    const [boatStatus, setBoatStatus] = useState({
        longitude: 0, latitude: 0, heading: 0,
        batteryL: 0, batteryR: 0,
        lastUpdate: null,
    });
    
    const [waypoints, setWaypoints] = useState([]);
    const [logs, setLogs] = useState([]);
    const wsRef = useRef(null);
    const connectTimeoutRef = useRef(null);
    const reconnectTimerRef = useRef(null);
    const lastConnectAttemptAtRef = useRef(0);
    const userInitiatedConnectRef = useRef(false);
    const connectAttemptManualRef = useRef(false);

    const [streamOn, setStreamOn] = useState(false);
    const [recvOn, setRecvOn] = useState(true);
    const [controlMode, setControlMode] = useState('@');
    const [cruiseMode, setCruiseMode] = useState('0');
    
    const [keyState, setKeyState] = useState({ w: false, a: false, s: false, d: false });

    // --- 核心逻辑 ---

    const [notifications, setNotifications] = useState([]);
    const toastTimersRef = useRef(new Map());

    const dismissToast = useCallback((id) => {
        const t = toastTimersRef.current.get(id);
        if (t) {
            if (t.timeoutId) window.clearTimeout(t.timeoutId);
            if (t.progressTimerId) window.clearInterval(t.progressTimerId);
            toastTimersRef.current.delete(id);
        }
        setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, []);

    const updateToast = useCallback((id, patch) => {
        setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, ...patch } : n)));
    }, []);

    const showToast = useCallback((opts) => {
        const id = `toast_${Date.now()}_${Math.random().toString(16).slice(2)}`;
        const createdAt = Date.now();
        const durationMs = opts && Object.prototype.hasOwnProperty.call(opts, 'durationMs') ? opts.durationMs : 4500;
        const dismissAt = Number.isFinite(durationMs) && durationMs > 0 ? createdAt + durationMs : null;
        const toast = {
            id,
            type: opts?.type || 'info',
            message: opts?.message || '',
            loading: !!opts?.loading,
            progress: Number.isFinite(opts?.progress) ? opts.progress : null,
            createdAt,
            durationMs: Number.isFinite(durationMs) ? durationMs : null,
            dismissAt
        };

        setNotifications((prev) => {
            const next = [toast, ...prev];
            const trimmed = next.slice(0, 5);
            const removed = next.slice(5);
            removed.forEach((r) => {
                const t = toastTimersRef.current.get(r.id);
                if (t) {
                    if (t.timeoutId) window.clearTimeout(t.timeoutId);
                    if (t.progressTimerId) window.clearInterval(t.progressTimerId);
                    toastTimersRef.current.delete(r.id);
                }
            });
            return trimmed;
        });

        if (dismissAt) {
            const timeoutId = window.setTimeout(() => dismissToast(id), durationMs);
            toastTimersRef.current.set(id, { timeoutId });
        }

        return id;
    }, [dismissToast]);

    const resolveToast = useCallback((id, opts) => {
        const t = toastTimersRef.current.get(id);
        if (t && t.progressTimerId) window.clearInterval(t.progressTimerId);
        if (t && t.timeoutId) window.clearTimeout(t.timeoutId);

        const createdAt = Date.now();
        const durationMs = opts && Object.prototype.hasOwnProperty.call(opts, 'durationMs') ? opts.durationMs : 4500;
        const dismissAt = Number.isFinite(durationMs) && durationMs > 0 ? createdAt + durationMs : null;

        updateToast(id, {
            type: opts?.type || 'info',
            message: opts?.message || '',
            loading: false,
            progress: null,
            createdAt,
            durationMs: Number.isFinite(durationMs) ? durationMs : null,
            dismissAt
        });

        if (dismissAt) {
            const timeoutId = window.setTimeout(() => dismissToast(id), durationMs);
            toastTimersRef.current.set(id, { timeoutId });
        } else {
            toastTimersRef.current.delete(id);
        }
    }, [dismissToast, updateToast]);

    const connectToastRef = useRef({ id: null });

    const addLog = (dir, msg, level = 'info') => {
        setLogs(prev => [{id: Date.now() + Math.random(), time: new Date().toLocaleTimeString(), dir, msg, level}, ...prev].slice(0, 100));
    };

    const sendData = (cmd) => {
        if (tcpStatus !== 'ONLINE' || !wsRef.current) {
            addLog('ERR', t('err_not_connected'), 'error');
            return false;
        }
        const finalCmd = cmd.endsWith(',') ? cmd : cmd + ',';
        wsRef.current.send(finalCmd);
        
        if (finalCmd.startsWith('K,')) {
            addLog('TX', finalCmd, 'debug');
        } else {
            addLog('TX', finalCmd, 'info');
        }
        return true;
    };

    const sendWaypointsCommand = () => {
        if (waypoints.length === 0) {
            showToast({ type: 'warning', message: "请先在地图上右键添加航点！", durationMs: 3500 });
            return;
        }
        let cmd = "P";
        waypoints.forEach(wp => {
            cmd += `,${wp.lng.toFixed(7)},${wp.lat.toFixed(7)}`;
        });
        cmd += ",";
        const ok = sendData(cmd);
        if (!ok) {
            showToast({ type: 'error', message: t('toast_waypoints_failed'), durationMs: 4500 });
            return;
        }
        addLog('SYS', `已下发 ${waypoints.length} 个航点任务`, 'info');
        showToast({ type: 'success', message: t('toast_waypoints_sent'), durationMs: 2500 });
    };

    const sendSCommand = () => {
        const ok = sendData(`S,${streamOn ? '1':'0'},${recvOn ? '3':'2'},q,${controlMode},${cruiseMode},`);
        if (ok && !devMode) addLog('SYS', t('log_config_updated'), 'info');
        return ok;
    };

    const sendKCommand = (w,a,s,d) => sendData(`K,${w},${a},${s},${d},`);

    const RECONNECT_INTERVAL_MS = 3000;

    const clearReconnectTimer = () => {
        if (reconnectTimerRef.current) {
            clearTimeout(reconnectTimerRef.current);
            reconnectTimerRef.current = null;
        }
    };

    const cancelAutoReconnect = useCallback(() => {
        clearReconnectTimer();
        userInitiatedConnectRef.current = false;
        connectAttemptManualRef.current = false;
        setIsAutoReconnectLooping(false);
        addLog('SYS', t('cancel_auto_reconnect'), 'info');
    }, [t]);

    const scheduleReconnect = () => {
        if (!autoReconnect || !userInitiatedConnectRef.current) return;
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
        if (tcpStatus !== 'OFFLINE') return;
        if (reconnectTimerRef.current) return;

        const now = Date.now();
        const sinceLast = now - lastConnectAttemptAtRef.current;
        const delay = Math.max(RECONNECT_INTERVAL_MS - sinceLast, RECONNECT_INTERVAL_MS);

        const seconds = Math.max(1, Math.round(delay / 1000));
        addLog('SYS', lang === 'zh'
            ? `自动重连：${seconds} 秒后重试连接...`
            : `Auto reconnect: retrying in ${seconds}s...`, 'info');

        reconnectTimerRef.current = setTimeout(() => {
            reconnectTimerRef.current = null;
            startConnect({ manual: false });
        }, delay);
    };

    const startConnect = ({ manual }) => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
        if (tcpStatus !== 'OFFLINE') return;

        clearReconnectTimer();
        connectAttemptManualRef.current = !!manual;
        if (manual) {
            userInitiatedConnectRef.current = true;
            setIsAutoReconnectLooping(true);
        }

        const now = Date.now();
        const sinceLast = now - lastConnectAttemptAtRef.current;
        if (sinceLast < RECONNECT_INTERVAL_MS) {
            scheduleReconnect();
            return;
        }
        lastConnectAttemptAtRef.current = now;

        setTcpStatus('CONNECTING');
        const msg = `${t('log_connecting')} ${serverIp}:${serverPort}...`;
        addLog('SYS', msg, 'info');

        // Toast & Progress
        const toastId = showToast({ type: 'info', message: msg, loading: true, progress: 0, durationMs: null });
        connectToastRef.current.id = toastId;
        const startAt = Date.now();
        const progressTimerId = window.setInterval(() => {
            const elapsed = Date.now() - startAt;
            const p = Math.min(99, Math.max(0, (elapsed / 5000) * 100));
            updateToast(toastId, { progress: p });
        }, 120);
        toastTimersRef.current.set(toastId, { progressTimerId });

        wsRef.current.send(`CMD,CONNECT,${serverIp},${serverPort}`);

        if (connectTimeoutRef.current) clearTimeout(connectTimeoutRef.current);
        connectTimeoutRef.current = setTimeout(() => {
             // 超时逻辑: 通过检查 tcpStatus 是否仍未 ONLINE
             // 注意: 这里取不到最新的 state (闭包), 但可以通过 setState 的回调形式或 ref
             // 简单起见，我们依赖 onmessage 里清除 timer。如果 timer 触发，说明 onmessage 没来
             setTcpStatus(prev => {
                 if (prev !== 'ONLINE') {
                     addLog('ERR', t('log_timeout'), 'info');
                     if (connectToastRef.current.id) {
                         resolveToast(connectToastRef.current.id, { type: 'error', message: t('alert_timeout'), durationMs: 5000 });
                         connectToastRef.current.id = null;
                     } else if (manual) {
                         showToast({ type: 'error', message: t('alert_timeout'), durationMs: 5000 });
                     }
                     return 'OFFLINE';
                 }
                 return prev;
             });
        }, 5000);
    };

    const disconnectFromBoat = () => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
        clearReconnectTimer();
        userInitiatedConnectRef.current = false;
        connectAttemptManualRef.current = false;
        setIsAutoReconnectLooping(false);
        wsRef.current.send("CMD,DISCONNECT");
    };

    const toggleConnection = () => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

        if (autoReconnect && isAutoReconnectLooping && tcpStatus === 'OFFLINE') {
            cancelAutoReconnect();
            return;
        }

        if (tcpStatus === 'ONLINE') disconnectFromBoat();
        else if (tcpStatus === 'OFFLINE') startConnect({ manual: true });
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
                const curLang = langRef.current === 'zh' ? 'zh' : 'en';
                addLog('SYS', AppTranslations[curLang].log_ws_disconnect, 'info');
            };
            ws.onmessage = (event) => {
                const msg = event.data;
                if (msg.startsWith('CURRENT_CONFIG')) {
                    const parts = msg.split(',');
                    if (parts.length >= 3) { setServerIp(parts[1]); setServerPort(parts[2]); }
                    if (parts.length >= 4) {
                        const v = String(parts[3]).trim().toLowerCase();
                        setAutoReconnect(v === '1' || v === 'true' || v === 'yes' || v === 'on');
                    }
                } 
                else if (msg.startsWith('TCP_STATUS')) {
                    const curLang = langRef.current === 'zh' ? 'zh' : 'en';
                    const trans = AppTranslations[curLang];
                    const status = msg.split(',')[1]; 
                    clearTimeout(connectTimeoutRef.current);
                    if (status === 'ONLINE') {
                        setTcpStatus('ONLINE');
                        connectAttemptManualRef.current = false;
                        clearReconnectTimer();
                        addLog('SYS', trans.log_tcp_online, 'info');
                        if (connectToastRef.current.id) {
                            resolveToast(connectToastRef.current.id, { type: 'success', message: trans.log_tcp_online, durationMs: 2500 });
                            connectToastRef.current.id = null;
                        }
                    } else if (status === 'OFFLINE') {
                        setTcpStatus('OFFLINE');
                        connectAttemptManualRef.current = false;
                        addLog('SYS', trans.log_tcp_offline, 'info');
                    } else if (status === 'FAILED') {
                        setTcpStatus('OFFLINE');
                        connectAttemptManualRef.current = false;
                        addLog('ERR', trans.log_tcp_failed, 'info');
                        if (connectToastRef.current.id) {
                            resolveToast(connectToastRef.current.id, { type: 'error', message: trans.alert_failed, durationMs: 5500 });
                            connectToastRef.current.id = null;
                        } else {
                            showToast({ type: 'error', message: trans.alert_failed, durationMs: 5500 });
                        }
                    }
                }
                else if (msg.startsWith('R')) {
                    const parts = msg.split(',');
                    if (parts.length >= 6) {
                        const bL = parseFloat(parts[4]) || 0;
                        const bR = parseFloat(parts[5]) || 0;
                        const heading = parseFloat(parts[3]) || 0;
                        
                        // === 1. 数据收集：始终全速运行，保证图表数据完整 ===
                        const newPoint = {
                            time: new Date().toLocaleTimeString('en-GB'),
                            batL: bL,
                            batR: bR,
                            heading: heading
                        };
                        chartDataRef.current.push(newPoint);
                        if (chartDataRef.current.length > 1000) chartDataRef.current.shift();

                        // === 2. UI 渲染：节流 (Throttle) ===
                        // 限制界面更新频率为每 100ms 一次 (10 FPS)，
                        // 避免地图和侧边栏过度渲染阻塞主线程，
                        // 从而让图表组件有足够的 CPU 资源跑满 60FPS 动画。
                        const now = Date.now();
                        if (now - lastUiUpdateRef.current > 100) {
                            setBoatStatus({
                                longitude: parseFloat(parts[1]) || 0,
                                latitude: parseFloat(parts[2]) || 0,
                                heading: heading,
                                batteryL: bL,
                                batteryR: bR,
                                lastUpdate: new Date()
                            });
                            lastUiUpdateRef.current = now;
                        }
                    }
                    // 日志建议也少打一点，或者只在 devMode 下打，这里暂且保留
                    if (devModeRef.current) addLog('RX', msg, 'debug');
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
        if (!autoReconnect) {
            clearReconnectTimer();
            return;
        }
        if (tcpStatus === 'OFFLINE') scheduleReconnect();
        if (tcpStatus === 'ONLINE') clearReconnectTimer();
        if (tcpStatus === 'CONNECTING') clearReconnectTimer();
    }, [tcpStatus, autoReconnect]);

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

    useEffect(() => {
        const ownerId = `owner_${Date.now()}_${Math.random().toString(16).slice(2)}`;
        window.SystemToast = {
            __owner: ownerId,
            show: (message, options) => showToast({ ...(options || {}), message, loading: false }),
            showLoading: (message, options) => showToast({ ...(options || {}), message, loading: true, durationMs: null }),
            update: (id, patch) => updateToast(id, patch || {}),
            resolve: (id, options) => resolveToast(id, options || {}),
            dismiss: (id) => dismissToast(id)
        };
        return () => {
            if (window.SystemToast && window.SystemToast.__owner === ownerId) {
                delete window.SystemToast;
            }
        };
    }, [dismissToast, resolveToast, showToast, updateToast]);

    const getBtnConfig = () => {
        if (tcpStatus === 'ONLINE') return { text: t('btn_disconnect'), color: 'bg-red-600/90 hover:bg-red-700 border-red-500 shadow-red-900/50', disabled: false };
        if (autoReconnect && isAutoReconnectLooping && tcpStatus === 'OFFLINE') {
            return { text: t('btn_cancel_reconnect'), color: 'bg-orange-600/90 hover:bg-orange-700 border-orange-500 shadow-orange-900/50', disabled: false };
        }
        if (tcpStatus === 'CONNECTING') return { text: t('btn_connecting'), color: 'bg-yellow-600/90 border-yellow-500 shadow-yellow-900/50', disabled: true };
        return { text: t('btn_connect'), color: 'bg-cyan-600/90 hover:bg-cyan-500 border-cyan-400 shadow-cyan-900/50', disabled: false };
    };

    const handleSaveConfig = (newIp, newPort, newChartFps, newAutoReconnect) => {
        // 1. 更新本地状态
        setServerIp(newIp);
        setServerPort(newPort);
        setAutoReconnect(!!newAutoReconnect);
        if (newChartFps !== undefined) {
            const fps = Math.min(240, Math.max(5, Math.round(Number(newChartFps))));
            setChartFps(fps);
            if (window.localStorage) window.localStorage.setItem('chart_fps', String(fps));
        }
        
        // 2. 发送指令给后端保存到 config.ini
        // 协议: CMD,SET_CONFIG,IP,PORT
        if (wsRef.current && webConnected) {
            wsRef.current.send(`CMD,SET_CONFIG,${newIp},${newPort},${newAutoReconnect ? '1' : '0'}`);
            addLog('SYS', `配置已保存: ${newIp}:${newPort}`, 'info');
        } else {
            addLog('ERR', "前端未连接，无法保存配置到文件", 'error');
        }
    };

    return (
        <div className="flex flex-col h-screen bg-slate-950 text-slate-200 font-mono overflow-hidden relative bg-grid">
            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-cyan-900/10 to-transparent pointer-events-none"></div>

            <NotificationCenter items={notifications} onDismiss={dismissToast} />

            <Header 
                lang={lang} setLang={setLang}
                webConnected={webConnected} tcpStatus={tcpStatus}
                serverIp={serverIp} setServerIp={setServerIp}
                serverPort={serverPort} setServerPort={setServerPort}
                toggleConnection={toggleConnection} btnConfig={getBtnConfig()}
                showLogs={showLogs} setShowLogs={setShowLogs}
                // [新增] 传入打开设置的回调
                onOpenSettings={() => setShowSettings(true)}
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
                    sendWaypointsCommand={sendWaypointsCommand}
                    waypointsCount={waypoints.length}
                    t={t}
                    tcpStatus={tcpStatus}
                />

                <div className="flex-1 bg-slate-900 relative border-x border-cyan-900/10 overflow-hidden z-0">
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
                    
                    <div className={`absolute bottom-24 z-20 transition-all duration-300 ease-in-out ${showLogs ? 'right-[21rem]' : 'right-4'}`}>
                        <button 
                            onClick={() => setShowChart(true)}
                            className="w-10 h-10 flex items-center justify-center bg-cyan-600 hover:bg-cyan-500 border border-cyan-400 rounded-full shadow-lg shadow-cyan-900/50 transition-all hover:scale-110 active:scale-95 group"
                            title="Open Data Chart"
                        >
                            <Icons.Plus className="text-white w-6 h-6" />
                        </button>
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
            
            {/* 图表弹窗 */}
            <ChartModal 
                isOpen={showChart}
                onClose={() => setShowChart(false)}
                dataRef={chartDataRef}
                onClear={() => { chartDataRef.current = []; }}
                fps={chartFps}
                t={t}
            />

            {/* [新增] 设置弹窗 (占位) */}
            <SettingsModal 
                isOpen={showSettings}
                onClose={() => setShowSettings(false)}
                currentIp={serverIp}
                currentPort={serverPort}
                currentChartFps={chartFps}
                currentAutoReconnect={autoReconnect}
                onSave={handleSaveConfig}
                t={t}
            />
        </div>
    );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<BoatGroundStation />);