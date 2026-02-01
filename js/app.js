// js/app.js
var { useState, useEffect, useRef, useCallback } = React;

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

function NotificationCenter({ items, onDismiss }) {
    const [, forceUpdate] = useState({});

    useEffect(() => {
        const timer = window.setInterval(() => forceUpdate({}), 50);
        return () => window.clearInterval(timer);
    }, []);

    const now = Date.now();

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
    const keyStateRef = useRef({ w: false, a: false, s: false, d: false });

    const [isMobile, setIsMobile] = useState(() => {
        if (window.matchMedia) return window.matchMedia('(max-width: 768px)').matches;
        return (window.innerWidth || 0) <= 768;
    });

    useEffect(() => {
        if (window.matchMedia) {
            const mql = window.matchMedia('(max-width: 768px)');
            const onChange = (e) => setIsMobile(!!e.matches);
            if (typeof mql.addEventListener === 'function') mql.addEventListener('change', onChange);
            else if (typeof mql.addListener === 'function') mql.addListener(onChange);
            setIsMobile(!!mql.matches);
            return () => {
                if (typeof mql.removeEventListener === 'function') mql.removeEventListener('change', onChange);
                else if (typeof mql.removeListener === 'function') mql.removeListener(onChange);
            };
        }

        const onResize = () => setIsMobile((window.innerWidth || 0) <= 768);
        window.addEventListener('resize', onResize);
        onResize();
        return () => window.removeEventListener('resize', onResize);
    }, []);

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
        if (window.MobileToast && typeof window.MobileToast.dismiss === 'function') {
            window.MobileToast.dismiss(id);
            return;
        }
        setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, []);

    const updateToast = useCallback((id, patch) => {
        if (window.MobileToast && typeof window.MobileToast.update === 'function') {
            window.MobileToast.update(id, patch || {});
            return;
        }
        setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, ...patch } : n)));
    }, []);

    const showToast = useCallback((opts) => {
        if (window.MobileToast && typeof window.MobileToast.show === 'function') {
             return window.MobileToast.show(opts);
        }

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
        toastTimersRef.current.delete(id);

        if (window.MobileToast && typeof window.MobileToast.resolve === 'function') {
            window.MobileToast.resolve(id, opts || {});
            return;
        }

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
            showToast({ type: 'warning', message: t('toast_add_waypoints_first'), durationMs: 3500 });
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
        addLog('SYS', lang === 'zh'
            ? `已下发 ${waypoints.length} 个航点任务`
            : `Sent ${waypoints.length} waypoint(s)`, 'info');
        showToast({ type: 'success', message: t('toast_waypoints_sent'), durationMs: 2500 });
    };

    const sendSCommand = () => {
        const ok = sendData(`S,${streamOn ? '1':'0'},${recvOn ? '3':'2'},q,${controlMode},${cruiseMode},`);
        if (ok && !devMode) addLog('SYS', t('log_config_updated'), 'info');
        return ok;
    };

    // K command protocol:
    // - New: `K,x,y,` where x/y are normalized in [-1.00, 1.00]
    // - Backward compatible: if called with (w,a,s,d), convert to x=d-a, y=w-s
    const sendKCommand = (...args) => {
        const toNum = (v) => {
            if (typeof v === 'number') return v;
            const n = parseFloat(v);
            return Number.isFinite(n) ? n : 0;
        };
        const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

        let x = 0;
        let y = 0;
        if (args.length >= 4) {
            const w = toNum(args[0]);
            const a = toNum(args[1]);
            const s = toNum(args[2]);
            const d = toNum(args[3]);
            x = d - a;
            y = w - s;
        } else {
            x = toNum(args[0]);
            y = toNum(args[1]);
        }

        x = clamp(x, -1, 1);
        y = clamp(y, -1, 1);

        return sendData(`K,${x.toFixed(2)},${y.toFixed(2)},`);
    };

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
                    const parseBool = (raw, fallback = false) => {
                        if (raw == null) return fallback;
                        const v = String(raw).trim().toLowerCase();
                        return v === '1' || v === 'true' || v === 'yes' || v === 'on';
                    };
                    if (parts.length >= 3) { setServerIp(parts[1]); setServerPort(parts[2]); }
                    if (parts.length >= 4) {
                        setAutoReconnect(parseBool(parts[3], false));
                    }
                    if (parts.length >= 5) setBoatStyle(parts[4].trim());
                    if (parts.length >= 6) setWaypointStyle(parts[5].trim());
                    if (parts.length >= 11) {
                        const nextUiStyleRaw = String(parts[10] || '').trim() || 'cyber';
                        const nextUiStyle = nextUiStyleRaw.toLowerCase();
                        if (nextUiStyle === 'ios' && window.MobileUtils && typeof window.MobileUtils.loadTheme === 'function') {
                            window.MobileUtils.loadTheme('ios')
                                .then(() => setUiStyle('ios'))
                                .catch(() => setUiStyle('cyber'));
                        } else {
                            setUiStyle(nextUiStyle || 'cyber');
                        }
                    }
                    if (parts.length >= 7) setEmbeddedChannelExpanded(parseBool(parts[6], true));
                    if (parts.length >= 10) {
                        setEmbeddedChannelEnabled({
                            heading: parseBool(parts[7], false),
                            batL: parseBool(parts[8], false),
                            batR: parseBool(parts[9], false)
                        });
                    }
                    if (parts.length >= 3 && (parts.length < 7 || parts.length < 10)) {
                        try {
                            const readFlag = (k) => {
                                const v = window.localStorage ? window.localStorage.getItem(k) : null;
                                if (v == null) return null;
                                const t = String(v).trim().toLowerCase();
                                return t === '1' || t === 'true' || t === 'yes' || t === 'on';
                            };
                            const exp = readFlag('embedded_channel_expanded');
                            const hdg = readFlag('embedded_channel_enabled_heading');
                            const bl = readFlag('embedded_channel_enabled_batL');
                            const br = readFlag('embedded_channel_enabled_batR');

                            if (exp != null || hdg != null || bl != null || br != null) {
                                const nextExpanded = exp == null ? true : exp;
                                const nextEnabled = {
                                    heading: hdg == null ? false : hdg,
                                    batL: bl == null ? false : bl,
                                    batR: br == null ? false : br
                                };
                                setEmbeddedChannelExpanded(nextExpanded);
                                setEmbeddedChannelEnabled(nextEnabled);

                                const nextAuto = parts.length >= 4 ? parseBool(parts[3], false) : false;
                                const nextBoatStyle = parts.length >= 5 ? String(parts[4] || '').trim() : 'default';
                                const nextWpStyle = parts.length >= 6 ? String(parts[5] || '').trim() : 'default';
                                const nextUiStyle = parts.length >= 11 ? String(parts[10] || '').trim() : 'cyber';

                                ws.send(
                                    `CMD,SET_CONFIG,${parts[1]},${parts[2]},${nextAuto ? '1' : '0'},${nextBoatStyle || 'default'},${nextWpStyle || 'default'},${nextExpanded ? '1' : '0'},${nextEnabled.heading ? '1' : '0'},${nextEnabled.batL ? '1' : '0'},${nextEnabled.batR ? '1' : '0'},${nextUiStyle || 'cyber'}`
                                );
                            }
                        } catch (_) {}
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
                keyStateRef.current = { ...keyStateRef.current, [key]: true };
                setKeyState({ ...keyStateRef.current });

                const x = (keyStateRef.current.d ? 1 : 0) - (keyStateRef.current.a ? 1 : 0);
                const y = (keyStateRef.current.w ? 1 : 0) - (keyStateRef.current.s ? 1 : 0);
                sendKCommand(x, y);
            }
        };
        const handleKeyUp = (e) => {
            const key = e.key.toLowerCase();
            if (['w', 'a', 's', 'd'].includes(key)) {
                keyStateRef.current = { ...keyStateRef.current, [key]: false };
                setKeyState({ ...keyStateRef.current });

                const x = (keyStateRef.current.d ? 1 : 0) - (keyStateRef.current.a ? 1 : 0);
                const y = (keyStateRef.current.w ? 1 : 0) - (keyStateRef.current.s ? 1 : 0);
                sendKCommand(x, y);
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

    const [boatStyle, setBoatStyle] = useState('default');
    const [waypointStyle, setWaypointStyle] = useState('default');
    const [uiStyle, setUiStyle] = useState('cyber');
    const [embeddedChannelExpanded, setEmbeddedChannelExpanded] = useState(true);
    const [embeddedChannelEnabled, setEmbeddedChannelEnabled] = useState({ heading: false, batL: false, batR: false });
    const pendingEmbeddedChartConfigRef = useRef(null);

    const sendSetConfig = useCallback((opts = {}) => {
        if (!wsRef.current || !webConnected) return false;

        const nextIp = Object.prototype.hasOwnProperty.call(opts, 'ip') ? opts.ip : serverIp;
        const nextPort = Object.prototype.hasOwnProperty.call(opts, 'port') ? opts.port : serverPort;
        if (!nextIp || !nextPort) return false;
        const nextAutoReconnect = Object.prototype.hasOwnProperty.call(opts, 'autoReconnect') ? opts.autoReconnect : autoReconnect;
        const nextBoatStyle = Object.prototype.hasOwnProperty.call(opts, 'boatStyle') ? opts.boatStyle : boatStyle;
        const nextWaypointStyle = Object.prototype.hasOwnProperty.call(opts, 'waypointStyle') ? opts.waypointStyle : waypointStyle;
        const nextUiStyle = Object.prototype.hasOwnProperty.call(opts, 'uiStyle') ? opts.uiStyle : uiStyle;
        const nextExpanded = Object.prototype.hasOwnProperty.call(opts, 'embeddedChannelExpanded') ? opts.embeddedChannelExpanded : embeddedChannelExpanded;
        const nextEnabled = Object.prototype.hasOwnProperty.call(opts, 'embeddedChannelEnabled') ? opts.embeddedChannelEnabled : embeddedChannelEnabled;

        wsRef.current.send(
            `CMD,SET_CONFIG,${nextIp},${nextPort},${nextAutoReconnect ? '1' : '0'},${nextBoatStyle || 'default'},${nextWaypointStyle || 'default'},${nextExpanded ? '1' : '0'},${nextEnabled.heading ? '1' : '0'},${nextEnabled.batL ? '1' : '0'},${nextEnabled.batR ? '1' : '0'},${nextUiStyle || 'cyber'}`
        );
        return true;
    }, [
        autoReconnect,
        boatStyle,
        embeddedChannelEnabled,
        embeddedChannelExpanded,
        serverIp,
        serverPort,
        uiStyle,
        waypointStyle,
        webConnected
    ]);

    const handleSaveConfig = (newIp, newPort, newChartFps, newAutoReconnect, newBoatStyle, newWaypointStyle, newUiStyle) => {
        const nextUiStyleRaw = (typeof newUiStyle === 'string' && newUiStyle.trim())
            ? newUiStyle.trim()
            : (typeof uiStyle === 'string' && uiStyle.trim() ? uiStyle.trim() : 'cyber');
        const nextUiStyle = nextUiStyleRaw.toLowerCase() || 'cyber';

        const applySave = () => {
            // 1. 更新本地状态
            setServerIp(newIp);
            setServerPort(newPort);
            setAutoReconnect(!!newAutoReconnect);
            if (newBoatStyle) setBoatStyle(newBoatStyle);
            if (newWaypointStyle) setWaypointStyle(newWaypointStyle);
            setUiStyle(nextUiStyle);

            if (newChartFps !== undefined) {
                const fps = Math.min(240, Math.max(5, Math.round(Number(newChartFps))));
                setChartFps(fps);
                if (window.localStorage) window.localStorage.setItem('chart_fps', String(fps));
            }
            
            // 2. 发送指令给后端保存到 config.ini
            if (sendSetConfig({
                ip: newIp,
                port: newPort,
                autoReconnect: !!newAutoReconnect,
                boatStyle: newBoatStyle || 'default',
                waypointStyle: newWaypointStyle || 'default',
                uiStyle: nextUiStyle
            })) {
                addLog('SYS', `配置已保存: ${newIp}:${newPort}`, 'info');
            } else {
                addLog('ERR', "前端未连接，无法保存配置到文件", 'error');
            }
        };

        if (nextUiStyle === 'ios' && window.MobileUtils && typeof window.MobileUtils.loadTheme === 'function') {
            return window.MobileUtils.loadTheme('ios').then(() => {
                applySave();
            });
        }

        applySave();
    };

    useEffect(() => {
        if (typeof document === 'undefined') return;
        const canUseMobile = isMobile && typeof window.MobileStationApp === 'function';
        const normalized = (canUseMobile && uiStyle === 'ios') ? 'ios' : 'cyber';
        document.documentElement.dataset.uiStyle = normalized;
        document.documentElement.style.colorScheme = normalized === 'ios' ? 'light' : 'dark';

        const meta = document.getElementById('meta-theme-color');
        if (meta) meta.setAttribute('content', normalized === 'ios' ? '#F2F2F7' : '#020617');
    }, [uiStyle, isMobile]);

    const handlePersistEmbeddedChartConfig = useCallback((patch = {}) => {
        const nextExpanded = Object.prototype.hasOwnProperty.call(patch, 'embeddedChannelExpanded')
            ? !!patch.embeddedChannelExpanded
            : embeddedChannelExpanded;
        const nextEnabled = Object.prototype.hasOwnProperty.call(patch, 'embeddedChannelEnabled')
            ? {
                heading: !!patch.embeddedChannelEnabled?.heading,
                batL: !!patch.embeddedChannelEnabled?.batL,
                batR: !!patch.embeddedChannelEnabled?.batR
            }
            : embeddedChannelEnabled;

        setEmbeddedChannelExpanded(nextExpanded);
        setEmbeddedChannelEnabled(nextEnabled);
        const ok = sendSetConfig({ embeddedChannelExpanded: nextExpanded, embeddedChannelEnabled: nextEnabled });
        if (!ok) pendingEmbeddedChartConfigRef.current = { embeddedChannelExpanded: nextExpanded, embeddedChannelEnabled: nextEnabled };
    }, [embeddedChannelEnabled, embeddedChannelExpanded, sendSetConfig]);

    useEffect(() => {
        if (!webConnected) return;
        if (!serverIp || !serverPort) return;
        const pending = pendingEmbeddedChartConfigRef.current;
        if (!pending) return;
        const ok = sendSetConfig(pending);
        if (ok) pendingEmbeddedChartConfigRef.current = null;
    }, [sendSetConfig, serverIp, serverPort, webConnected]);

    const MobileStationApp = window.MobileStationApp;
    const shouldUseMobile = !!isMobile && typeof MobileStationApp === 'function';
    const isMobileIos = shouldUseMobile && uiStyle === 'ios';

    return (
        <div
            className={`flex flex-col app-height overflow-hidden relative ${
                isMobileIos ? 'bg-[#F2F2F7] text-slate-900 font-sans' : 'bg-slate-950 text-slate-200 font-mono bg-grid'
            }`}
        >
            {!isMobileIos && <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-cyan-900/10 to-transparent pointer-events-none"></div>}

            {!shouldUseMobile && <NotificationCenter items={notifications} onDismiss={dismissToast} />}

            {shouldUseMobile ? (
                <MobileStationApp
                    uiStyle={uiStyle}
                    boatStyle={boatStyle}
                    setBoatStyle={setBoatStyle}
                    waypointStyle={waypointStyle}
                    setWaypointStyle={setWaypointStyle}
                    lang={lang}
                    setLang={setLang}
                    tcpStatus={tcpStatus}
                    serverIp={serverIp}
                    setServerIp={setServerIp}
                    serverPort={serverPort}
                    setServerPort={setServerPort}
                    toggleConnection={toggleConnection}
                    boatStatus={boatStatus}
                    waypoints={waypoints}
                    setWaypoints={setWaypoints}
                    cruiseMode={cruiseMode}
                    setCruiseMode={setCruiseMode}
                    streamOn={streamOn}
                    setStreamOn={setStreamOn}
                    recvOn={recvOn}
                    setRecvOn={setRecvOn}
                    controlMode={controlMode}
                    setControlMode={setControlMode}
                    sendSCommand={sendSCommand}
                    sendWaypointsCommand={sendWaypointsCommand}
                    sendKCommand={sendKCommand}
                    setShowChart={setShowChart}
                    chartDataRef={chartDataRef}
                    chartFps={chartFps}
                    embeddedChannelExpanded={embeddedChannelExpanded}
                    embeddedChannelEnabled={embeddedChannelEnabled}
                    onPersistEmbeddedChartConfig={handlePersistEmbeddedChartConfig}
                    setShowSettings={setShowSettings}
                    showLogs={showLogs}
                    setShowLogs={setShowLogs}
                    logs={logs}
                    setLogs={setLogs}
                    devMode={devMode}
                    setDevMode={setDevModeSafe}
                    sendData={sendData}
                    t={t}
                />
            ) : (
                <>
                    <Header 
                        lang={lang} setLang={setLang}
                        webConnected={webConnected} tcpStatus={tcpStatus}
                        serverIp={serverIp} setServerIp={setServerIp}
                        serverPort={serverPort} setServerPort={setServerPort}
                        toggleConnection={toggleConnection} btnConfig={getBtnConfig()}
                        showLogs={showLogs} setShowLogs={setShowLogs}
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
                                boatStyle={boatStyle}
                                waypointStyle={waypointStyle}
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
                            devMode={devMode} setDevMode={setDevModeSafe}
                            sendData={sendData}
                            t={t}
                            uiStyle={uiStyle}
                        />
                    </div>
                </>
            )}
            
            {!shouldUseMobile && (
                <ChartModal 
                    isOpen={showChart}
                    onClose={() => setShowChart(false)}
                    dataRef={chartDataRef}
                    onClear={() => { chartDataRef.current = []; }}
                    fps={chartFps}
                    t={t}
                />
            )}

            {showSettings && (
                <SettingsModal 
                    isOpen={true}
                    onClose={() => setShowSettings(false)}
                    currentIp={serverIp}
                    currentPort={serverPort}
                    currentChartFps={chartFps}
                    currentAutoReconnect={autoReconnect}
                    currentBoatStyle={boatStyle}
                    currentWaypointStyle={waypointStyle}
                    currentUiStyle={uiStyle}
                    onSave={handleSaveConfig}
                    t={t}
                    isMobile={shouldUseMobile}
                />
            )}
        </div>
    );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<BoatGroundStation />);
