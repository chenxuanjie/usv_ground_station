const { useState, useEffect, useRef } = React;

// HUDBox 组件 (从 1.js 移植)
const HUDBox = ({ children, className = "", noGlow = false }) => (
    <div className={`relative bg-slate-950/90 backdrop-blur-md border border-cyan-500/30 ${noGlow ? '' : 'shadow-[0_0_15px_-3px_rgba(6,182,212,0.15)]'} ${className}`}>
      <div className="absolute top-0 left-0 w-2 h-2 border-l-2 border-t-2 border-cyan-400"></div>
      <div className="absolute top-0 right-0 w-2 h-2 border-r-2 border-t-2 border-cyan-400"></div>
      <div className="absolute bottom-0 left-0 w-2 h-2 border-l-2 border-b-2 border-cyan-400"></div>
      <div className="absolute bottom-0 right-0 w-2 h-2 border-r-2 border-b-2 border-cyan-400"></div>
      {children}
    </div>
);

// Setting Item 组件 (紧凑版)
const SettingRow = ({ icon: Icon, title, desc, children }) => (
    <div className="flex flex-col gap-2 p-3 rounded border border-slate-800/50 bg-slate-900/50 hover:bg-slate-800/80 transition-colors group">
        <div className="flex items-center gap-2">
            <div className="text-cyan-500 group-hover:text-cyan-400 transition-colors"><Icon size={16} /></div>
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider group-hover:text-cyan-100 transition-colors">{title}</h3>
        </div>
        <div className="flex items-center justify-between gap-3 pl-6">
            <p className="text-[10px] text-slate-500 leading-tight flex-1">{desc}</p>
            <div className="flex-shrink-0">
                {children}
            </div>
        </div>
    </div>
);

function SettingsModal({ isOpen, onClose, currentIp, currentPort, currentChartFps, currentAutoReconnect, currentBoatStyle, currentWaypointStyle, currentUiStyle, onSave, t }) {
    const [ip, setIp] = useState(currentIp);
    const [port, setPort] = useState(currentPort);
    const [chartFps, setChartFps] = useState(currentChartFps);
    const [autoReconnect, setAutoReconnect] = useState(!!currentAutoReconnect);
    const [boatStyle, setBoatStyle] = useState(currentBoatStyle || 'default');
    const [waypointStyle, setWaypointStyle] = useState(currentWaypointStyle || 'default');
    const [uiStyle, setUiStyle] = useState(typeof currentUiStyle === 'string' && currentUiStyle ? currentUiStyle : 'cyber');
    
    const [saveStatus, setSaveStatus] = useState('idle');
    const [errorMsg, setErrorMsg] = useState('');
    const [activeTab, setActiveTab] = useState('connection'); // 'connection' | 'system'
    const closeTimerRef = useRef(null);
    const saveTimerRef = useRef(null);

    useEffect(() => {
        return () => {
            if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
            if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        };
    }, []);

    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    const handleSave = () => {
        const fpsNum = Number(chartFps);
        
        if (!ip || !port) {
            setSaveStatus('error');
            setErrorMsg(t ? t('err_invalid_ip') : "Please verify the IP and Port.");
            return;
        }
        if (!Number.isFinite(fpsNum) || fpsNum < 5 || fpsNum > 240) {
            setSaveStatus('error');
            setErrorMsg(t ? t('err_invalid_fps') : "FPS must be between 5 and 240.");
            return;
        }

        setSaveStatus('saving');
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        saveTimerRef.current = setTimeout(() => {
            onSave(ip, port, Math.round(fpsNum), !!autoReconnect, boatStyle, waypointStyle, uiStyle);
            setSaveStatus('success');
            
            if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
            closeTimerRef.current = setTimeout(() => {
                onClose();
            }, 800);
        }, 600);
    };

    if (!isOpen) return null;

    const uiStyleOptions = [
        { value: 'cyber', labelKey: 'style_cyber', fallback: 'CYBER' },
        { value: 'ios', labelKey: 'style_ios', fallback: 'iOS' }
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <HUDBox className="w-full max-w-sm p-0 overflow-hidden shadow-2xl shadow-cyan-900/50 flex flex-col max-h-[85vh]">
                
                {/* 头部 */}
                <div className="h-16 px-4 bg-gradient-to-b from-slate-900 via-slate-900/80 to-transparent border-b border-cyan-500/20 flex justify-between items-center shrink-0">
                    <h3 className="font-mono font-bold text-cyan-100 flex items-center gap-2 text-sm tracking-wider">
                        <Icons.Settings className="text-cyan-400 w-5 h-5" />
                        {t ? t('settings_title') : 'SYSTEM_CONFIG'}
                    </h3>
                    <button onClick={onClose} className="text-cyan-500 hover:text-white transition-colors">
                        <Icons.X size={20} />
                    </button>
                </div>

                {/* 标签页切换 */}
                <div className="flex border-b border-cyan-500/20 shrink-0">
                    <button 
                        onClick={() => setActiveTab('connection')} 
                        className={`flex-1 py-3 text-xs font-mono font-bold tracking-wider transition-colors ${activeTab === 'connection' ? 'bg-cyan-500/20 text-cyan-100 shadow-[inset_0_-2px_0_0_rgba(6,182,212,1)]' : 'text-slate-500 hover:bg-slate-800'}`}
                    >
                        {t ? t('connection_tab') : 'CONNECTION'}
                    </button>
                    <div className="w-px bg-cyan-900/50"></div>
                    <button 
                        onClick={() => setActiveTab('system')} 
                        className={`flex-1 py-3 text-xs font-mono font-bold tracking-wider transition-colors ${activeTab === 'system' ? 'bg-cyan-500/20 text-cyan-100 shadow-[inset_0_-2px_0_0_rgba(6,182,212,1)]' : 'text-slate-500 hover:bg-slate-800'}`}
                    >
                        {t ? t('system_tab') : 'SYSTEM'}
                    </button>
                </div>

                {/* 内容区 */}
                <div className="p-4 space-y-4 bg-slate-900/90 overflow-y-auto flex-1 custom-scrollbar">
                    {activeTab === 'connection' && (
                        <div className="space-y-3 animate-in slide-in-from-left-4 fade-in duration-300">
                            <SettingRow 
                                icon={Icons.Server} 
                                title={t ? t('set_boat_ip') : "Target IP"}
                                desc={t ? t('desc_ip') : "IPv4 address of the USV"}
                            >
                                <div className="relative w-36">
                                    <input 
                                        type="text" 
                                        value={ip}
                                        onChange={(e) => setIp(e.target.value)}
                                        className="w-full bg-slate-950/80 border border-slate-700 rounded px-2 py-1 text-xs text-cyan-400 font-mono focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 outline-none transition-all placeholder-slate-700 text-right"
                                        placeholder="0.0.0.0"
                                    />
                                </div>
                            </SettingRow>

                            <SettingRow 
                                icon={Icons.Anchor} 
                                title={t ? t('set_boat_port') : "Port"}
                                desc={t ? t('desc_port') : "Communication Port (TCP)"}
                            >
                                <div className="relative w-24">
                                    <input 
                                        type="number" 
                                        value={port}
                                        onChange={(e) => setPort(e.target.value)}
                                        className="w-full bg-slate-950/80 border border-slate-700 rounded px-2 py-1 text-xs text-cyan-400 font-mono focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 outline-none transition-all placeholder-slate-700 text-right"
                                        placeholder="6202"
                                    />
                                </div>
                            </SettingRow>
                        </div>
                    )}

                    {activeTab === 'system' && (
                        <div className="space-y-3 animate-in slide-in-from-right-4 fade-in duration-300">
                            <SettingRow 
                                icon={Icons.Activity} 
                                title={t ? t('chart_fps') : "Chart FPS"}
                                desc={t ? t('desc_fps') : "Visualization refresh rate"}
                            >
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-mono font-bold text-cyan-400 w-8 text-right">{chartFps}</span>
                                    <input 
                                        type="range" 
                                        min="30" max="240" step="10"
                                        value={chartFps}
                                        onChange={(e) => setChartFps(e.target.value)}
                                        className="w-24 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500 outline-none"
                                    />
                                </div>
                            </SettingRow>

                            <SettingRow 
                                icon={Icons.Zap} 
                                title={t ? t('auto_reconnect') : "Auto Reconnect"}
                                desc={t ? t('desc_reconnect') : "Restore connection if lost"}
                            >
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" checked={autoReconnect} onChange={e=>setAutoReconnect(e.target.checked)} className="sr-only peer"/>
                                    <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-500 shadow-inner"></div>
                                </label>
                            </SettingRow>

                            <SettingRow
                                icon={Icons.Sidebar}
                                title={t ? t('ui_style') : "UI STYLE"}
                                desc={t ? t('desc_ui_style') : "Switch UI theme"}
                            >
                                <div className="flex bg-slate-900 rounded p-1 border border-slate-800 w-40">
                                    {uiStyleOptions.map((opt) => (
                                        <button
                                            key={opt.value}
                                            onClick={() => setUiStyle(opt.value)}
                                            className={`flex-1 py-1 text-[10px] font-mono rounded transition-colors ${uiStyle === opt.value ? 'bg-cyan-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                                        >
                                            {t ? t(opt.labelKey) : opt.fallback}
                                        </button>
                                    ))}
                                </div>
                            </SettingRow>

                            <SettingRow
                                icon={Icons.Navigation}
                                title={t ? t('boat_style') : "BOAT STYLE"}
                                desc={t ? t('desc_boat_style') : "Select boat icon style"}
                            >
                                <div className="flex bg-slate-900 rounded p-1 border border-slate-800 w-32">
                                    <button onClick={() => setBoatStyle('default')} className={`flex-1 py-1 text-[10px] font-mono rounded transition-colors ${boatStyle === 'default' ? 'bg-cyan-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>{t ? t('default') : 'DEFAULT'}</button>
                                    <button onClick={() => setBoatStyle('cyber')} className={`flex-1 py-1 text-[10px] font-mono rounded transition-colors ${boatStyle === 'cyber' ? 'bg-cyan-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>{t ? t('cyber') : 'CYBER'}</button>
                                </div>
                            </SettingRow>

                            <SettingRow
                                icon={Icons.MapPin}
                                title={t ? t('wp_style') : "WP STYLE"}
                                desc={t ? t('desc_wp_style') : "Select waypoint marker style"}
                            >
                                <div className="flex bg-slate-900 rounded p-1 border border-slate-800 w-32">
                                    <button onClick={() => setWaypointStyle('default')} className={`flex-1 py-1 text-[10px] font-mono rounded transition-colors ${waypointStyle === 'default' ? 'bg-cyan-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>{t ? t('default') : 'DEFAULT'}</button>
                                    <button onClick={() => setWaypointStyle('cyber')} className={`flex-1 py-1 text-[10px] font-mono rounded transition-colors ${waypointStyle === 'cyber' ? 'bg-cyan-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>{t ? t('cyber') : 'CYBER'}</button>
                                </div>
                            </SettingRow>
                        </div>
                    )}
                </div>

                {/* 底部按钮 */}
                <div className="p-4 border-t border-cyan-900/30 bg-slate-900/95 shrink-0">
                    {errorMsg && (
                        <div className="mb-3 flex items-center justify-center gap-2 text-[10px] text-red-400 font-mono bg-red-950/20 py-1 px-2 rounded border border-red-500/20">
                            <Icons.Help size={12}/> {errorMsg}
                        </div>
                    )}
                    
                    <button 
                        onClick={handleSave}
                        disabled={saveStatus === 'saving' || saveStatus === 'success'}
                        className={`w-full py-3 font-mono text-sm font-bold tracking-widest shadow-[0_0_15px_rgba(6,182,212,0.4)] active:scale-[0.98] transition-all flex items-center justify-center gap-2 border border-transparent
                            ${saveStatus === 'success' 
                                ? 'bg-green-600 hover:bg-green-500 text-white shadow-green-900/50' 
                                : 'bg-cyan-600 hover:bg-cyan-500 text-white'}
                            ${saveStatus === 'saving' ? 'opacity-80 cursor-wait' : ''}
                        `}
                    >
                        {saveStatus === 'saving' && (
                            <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        )}
                        {saveStatus === 'success' && <Icons.Check className="w-4 h-4" />}
                        <span>
                            {saveStatus === 'saving' ? (t ? t('saving') : 'APPLYING...') : (saveStatus === 'success' ? (t ? t('saved') : 'SAVED') : (t ? t('btn_save') : 'SAVE CHANGES'))}
                        </span>
                    </button>
                </div>

            </HUDBox>
        </div>
    );
}
