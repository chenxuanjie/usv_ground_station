var { useState, useEffect, useRef } = React;

// HUDBox 组件 (从 1.js 移植)
const HUDBox = ({ children, className = "", noGlow = false, variant = "cyber" }) => {
    const isIos = variant === 'ios';
    const base = isIos
        ? 'relative bg-white/85 backdrop-blur-2xl border border-white/60'
        : 'relative bg-slate-950/90 backdrop-blur-md border border-cyan-500/30';
    const shadow = noGlow
        ? 'shadow-none'
        : (isIos ? 'shadow-[0_8px_30px_-10px_rgba(0,0,0,0.2)]' : 'shadow-[0_0_15px_-3px_rgba(6,182,212,0.15)]');

    return (
        <div className={`${base} ${shadow} ${className}`}>
            {!isIos && (
                <>
                    <div className="absolute top-0 left-0 w-2 h-2 border-l-2 border-t-2 border-cyan-400"></div>
                    <div className="absolute top-0 right-0 w-2 h-2 border-r-2 border-t-2 border-cyan-400"></div>
                    <div className="absolute bottom-0 left-0 w-2 h-2 border-l-2 border-b-2 border-cyan-400"></div>
                    <div className="absolute bottom-0 right-0 w-2 h-2 border-r-2 border-b-2 border-cyan-400"></div>
                </>
            )}
            {children}
        </div>
    );
};

// Setting Item 组件 (紧凑版)
const SettingRow = ({ icon: Icon, title, desc, children, variant = "cyber" }) => {
    const isIos = variant === 'ios';
    return (
        <div className={`flex flex-col gap-2 p-3 border transition-colors group ${isIos ? 'rounded-[18px] border-white/60 bg-white/70 hover:bg-white/85 shadow-[0_4px_20px_-8px_rgba(0,0,0,0.05)]' : 'rounded border-slate-800/50 bg-slate-900/50 hover:bg-slate-800/80'}`}>
            <div className="flex items-center gap-2">
                <div className={`${isIos ? 'text-[#007AFF]' : 'text-cyan-500 group-hover:text-cyan-400'} transition-colors`}><Icon size={16} /></div>
                <h3 className={`text-xs font-bold uppercase tracking-wider transition-colors ${isIos ? 'text-slate-900' : 'text-slate-300 group-hover:text-cyan-100'}`}>{title}</h3>
            </div>
            <div className="flex items-center justify-between gap-3 pl-6">
                <p className="text-[10px] text-slate-500 leading-tight flex-1">{desc}</p>
                <div className="flex-shrink-0">
                    {children}
                </div>
            </div>
        </div>
    );
};

function SettingsModal({ isOpen, onClose, currentIp, currentPort, currentChartFps, currentAutoReconnect, currentBoatStyle, currentWaypointStyle, currentUiStyle, onSave, t, isMobile }) {
    const [ip, setIp] = useState(currentIp);
    const [port, setPort] = useState(currentPort);
    const [chartFps, setChartFps] = useState(currentChartFps);
    const [autoReconnect, setAutoReconnect] = useState(!!currentAutoReconnect);
    const [boatStyle, setBoatStyle] = useState(currentBoatStyle || 'default');
    const [waypointStyle, setWaypointStyle] = useState(currentWaypointStyle || 'default');
    const [uiStyle, setUiStyle] = useState(typeof currentUiStyle === 'string' && currentUiStyle ? currentUiStyle : 'cyber');
    const isIosModal = !!isMobile && uiStyle === 'ios';
    const variant = isIosModal ? 'ios' : 'cyber';
    
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
        setErrorMsg('');
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        saveTimerRef.current = setTimeout(() => {
            let result;
            try {
                result = onSave(ip, port, Math.round(fpsNum), !!autoReconnect, boatStyle, waypointStyle, uiStyle);
            } catch (err) {
                setSaveStatus('error');
                setErrorMsg((err && err.message) ? String(err.message) : (t ? t('err_invalid_ip') : "Save failed."));
                return;
            }

            Promise.resolve(result).then(() => {
                setSaveStatus('success');
                if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
                closeTimerRef.current = setTimeout(() => {
                    onClose();
                }, 800);
            }).catch((err) => {
                setSaveStatus('error');
                setErrorMsg((err && err.message) ? String(err.message) : (t ? t('err_invalid_ip') : "Save failed."));
            });
        }, 600);
    };

    if (!isOpen) return null;

    const uiStyleOptions = [
        { value: 'cyber', labelKey: 'style_cyber', fallback: 'CYBER' },
        { value: 'ios', labelKey: 'style_ios', fallback: 'iOS' }
    ];

    return (
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200 ${isIosModal ? 'bg-black/20 backdrop-blur-[2px]' : 'bg-black/80 backdrop-blur-sm'}`}>
            <HUDBox variant={variant} className={`w-full max-w-sm p-0 overflow-hidden flex flex-col max-h-[85vh] ${isIosModal ? 'rounded-[26px]' : ''}`}>
                
                {/* 头部 */}
                <div className={`h-16 px-4 flex justify-between items-center shrink-0 ${isIosModal ? 'bg-white/70 backdrop-blur-xl border-b border-slate-200/50' : 'bg-gradient-to-b from-slate-900 via-slate-900/80 to-transparent border-b border-cyan-500/20'}`}>
                    <h3 className={`${isIosModal ? 'font-sans font-bold text-[17px] tracking-tight text-slate-900' : 'font-mono font-bold text-cyan-100 text-sm tracking-wider'} flex items-center gap-2`}>
                        <Icons.Settings className={`${isIosModal ? 'text-[#007AFF]' : 'text-cyan-400'} w-5 h-5`} />
                        {t ? t('settings_title') : 'SYSTEM_CONFIG'}
                    </h3>
                    <button onClick={onClose} className={`${isIosModal ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/40 rounded-full w-10 h-10 flex items-center justify-center transition-colors' : 'text-cyan-500 hover:text-white transition-colors'}`}>
                        <Icons.X size={20} />
                    </button>
                </div>

                {/* 标签页切换 */}
                <div className={`flex shrink-0 ${isIosModal ? 'border-b border-slate-200/60 bg-white/40' : 'border-b border-cyan-500/20'}`}>
                    <button 
                        onClick={() => setActiveTab('connection')} 
                        className={`flex-1 py-3 text-xs font-bold transition-colors ${isIosModal ? 'font-sans tracking-tight' : 'font-mono tracking-wider'} ${activeTab === 'connection' ? (isIosModal ? 'bg-[#007AFF] text-white shadow-[0_6px_18px_-8px_rgba(0,122,255,0.45)]' : 'bg-cyan-500/20 text-cyan-100 shadow-[inset_0_-2px_0_0_rgba(6,182,212,1)]') : (isIosModal ? 'text-slate-600 hover:bg-white/60' : 'text-slate-500 hover:bg-slate-800')}`}
                    >
                        {t ? t('connection_tab') : 'CONNECTION'}
                    </button>
                    <div className={`w-px ${isIosModal ? 'bg-slate-200/60' : 'bg-cyan-900/50'}`}></div>
                    <button 
                        onClick={() => setActiveTab('system')} 
                        className={`flex-1 py-3 text-xs font-bold transition-colors ${isIosModal ? 'font-sans tracking-tight' : 'font-mono tracking-wider'} ${activeTab === 'system' ? (isIosModal ? 'bg-[#007AFF] text-white shadow-[0_6px_18px_-8px_rgba(0,122,255,0.45)]' : 'bg-cyan-500/20 text-cyan-100 shadow-[inset_0_-2px_0_0_rgba(6,182,212,1)]') : (isIosModal ? 'text-slate-600 hover:bg-white/60' : 'text-slate-500 hover:bg-slate-800')}`}
                    >
                        {t ? t('system_tab') : 'SYSTEM'}
                    </button>
                </div>

                {/* 内容区 */}
                <div className={`p-4 space-y-4 overflow-y-auto flex-1 custom-scrollbar ${isIosModal ? 'bg-white/30' : 'bg-slate-900/90'}`}>
                    {activeTab === 'connection' && (
                        <div className="space-y-3 animate-in slide-in-from-left-4 fade-in duration-300">
		                            <SettingRow
		                                icon={Icons.Server}
		                                title={t ? t('set_boat_ip') : "Target IP"}
		                                desc={t ? t('desc_ip') : "IPv4 address of the USV"}
		                                variant={variant}
		                            >
		                                <div className="relative w-36">
		                                    <input
		                                        type="text"
		                                        value={ip}
		                                        onChange={(e) => setIp(e.target.value)}
		                                        className={`w-full border px-2 py-1 text-xs outline-none transition-all text-right ${isIosModal ? 'bg-[#767680]/10 border-transparent rounded-[10px] text-slate-900 font-sans focus:border-[#007AFF]/30 focus:bg-[#767680]/15 placeholder:text-slate-500' : 'bg-slate-950/80 border-slate-700 rounded text-cyan-400 font-mono focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 placeholder-slate-700'}`}
		                                        placeholder="0.0.0.0"
		                                    />
		                                </div>
		                            </SettingRow>
		                            <SettingRow
		                                icon={Icons.Anchor}
		                                title={t ? t('set_boat_port') : "Port"}
		                                desc={t ? t('desc_port') : "Communication Port (TCP)"}
		                                variant={variant}
		                            >
		                                <div className="relative w-24">
		                                    <input
		                                        type="number"
		                                        value={port}
		                                        onChange={(e) => setPort(e.target.value)}
		                                        className={`w-full border px-2 py-1 text-xs outline-none transition-all text-right ${isIosModal ? 'bg-[#767680]/10 border-transparent rounded-[10px] text-slate-900 font-sans focus:border-[#007AFF]/30 focus:bg-[#767680]/15 placeholder:text-slate-500' : 'bg-slate-950/80 border-slate-700 rounded text-cyan-400 font-mono focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 placeholder-slate-700'}`}
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
		                                variant={variant}
		                            >
		                                <div className="flex items-center gap-2">
		                                    <span className={`text-xs font-mono font-bold w-8 text-right ${isIosModal ? 'text-slate-700' : 'text-cyan-400'}`}>{chartFps}</span>
		                                    <input
		                                        type="range"
		                                        min="30" max="240" step="10"
		                                        value={chartFps}
		                                        onChange={(e) => setChartFps(e.target.value)}
		                                        className={`w-24 h-1 rounded-lg appearance-none cursor-pointer outline-none ${isIosModal ? 'bg-slate-300 accent-[#007AFF]' : 'bg-slate-700 accent-cyan-500'}`}
		                                    />
		                                </div>
		                            </SettingRow>
		                            <SettingRow
		                                icon={Icons.Zap}
		                                title={t ? t('auto_reconnect') : "Auto Reconnect"}
		                                desc={t ? t('desc_reconnect') : "Restore connection if lost"}
		                                variant={variant}
		                            >
	                                <label className="relative inline-flex items-center cursor-pointer">
	                                    <input type="checkbox" checked={autoReconnect} onChange={e=>setAutoReconnect(e.target.checked)} className="sr-only peer"/>
	                                    <div className={`w-9 h-5 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all shadow-inner ${isIosModal ? 'bg-slate-300 peer-checked:bg-[#34C759]' : 'bg-slate-700 peer-checked:bg-cyan-500'}`}></div>
	                                </label>
	                            </SettingRow>

	                            <SettingRow
	                                icon={Icons.Sidebar}
	                                title={t ? t('ui_style') : "UI STYLE"}
	                                desc={t ? t('desc_ui_style') : "Switch UI theme"}
	                                variant={variant}
	                            >
	                                <div className={`${isIosModal ? 'flex bg-[#767680]/10 rounded-[10px] p-1 border border-white/50 w-40' : 'flex bg-slate-900 rounded p-1 border border-slate-800 w-40'}`}>
	                                    {uiStyleOptions.map((opt) => (
	                                        <button
	                                            key={opt.value}
	                                            onClick={() => setUiStyle(opt.value)}
	                                            className={`flex-1 py-1 text-[10px] rounded transition-colors ${isIosModal ? 'font-semibold' : 'font-mono'} ${uiStyle === opt.value ? (isIosModal ? 'bg-white text-slate-900 shadow-[0_4px_12px_-6px_rgba(0,0,0,0.18)]' : 'bg-cyan-600 text-white shadow-lg') : (isIosModal ? 'text-slate-500 hover:text-slate-900' : 'text-slate-400 hover:text-white')}`}
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
	                                variant={variant}
	                            >
	                                <div className={`${isIosModal ? 'flex bg-[#767680]/10 rounded-[10px] p-1 border border-white/50 w-32' : 'flex bg-slate-900 rounded p-1 border border-slate-800 w-32'}`}>
	                                    <button onClick={() => setBoatStyle('default')} className={`flex-1 py-1 text-[10px] rounded transition-colors ${isIosModal ? 'font-semibold' : 'font-mono'} ${boatStyle === 'default' ? (isIosModal ? 'bg-white text-slate-900 shadow-[0_4px_12px_-6px_rgba(0,0,0,0.18)]' : 'bg-cyan-600 text-white shadow-lg') : (isIosModal ? 'text-slate-500 hover:text-slate-900' : 'text-slate-400 hover:text-white')}`}>{t ? t('default') : 'DEFAULT'}</button>
	                                    <button onClick={() => setBoatStyle('cyber')} className={`flex-1 py-1 text-[10px] rounded transition-colors ${isIosModal ? 'font-semibold' : 'font-mono'} ${boatStyle === 'cyber' ? (isIosModal ? 'bg-white text-slate-900 shadow-[0_4px_12px_-6px_rgba(0,0,0,0.18)]' : 'bg-cyan-600 text-white shadow-lg') : (isIosModal ? 'text-slate-500 hover:text-slate-900' : 'text-slate-400 hover:text-white')}`}>{t ? t('cyber') : 'CYBER'}</button>
	                                </div>
	                            </SettingRow>

	                            <SettingRow
	                                icon={Icons.MapPin}
	                                title={t ? t('wp_style') : "WP STYLE"}
	                                desc={t ? t('desc_wp_style') : "Select waypoint marker style"}
	                                variant={variant}
	                            >
	                                <div className={`${isIosModal ? 'flex bg-[#767680]/10 rounded-[10px] p-1 border border-white/50 w-32' : 'flex bg-slate-900 rounded p-1 border border-slate-800 w-32'}`}>
	                                    <button onClick={() => setWaypointStyle('default')} className={`flex-1 py-1 text-[10px] rounded transition-colors ${isIosModal ? 'font-semibold' : 'font-mono'} ${waypointStyle === 'default' ? (isIosModal ? 'bg-white text-slate-900 shadow-[0_4px_12px_-6px_rgba(0,0,0,0.18)]' : 'bg-cyan-600 text-white shadow-lg') : (isIosModal ? 'text-slate-500 hover:text-slate-900' : 'text-slate-400 hover:text-white')}`}>{t ? t('default') : 'DEFAULT'}</button>
	                                    <button onClick={() => setWaypointStyle('cyber')} className={`flex-1 py-1 text-[10px] rounded transition-colors ${isIosModal ? 'font-semibold' : 'font-mono'} ${waypointStyle === 'cyber' ? (isIosModal ? 'bg-white text-slate-900 shadow-[0_4px_12px_-6px_rgba(0,0,0,0.18)]' : 'bg-cyan-600 text-white shadow-lg') : (isIosModal ? 'text-slate-500 hover:text-slate-900' : 'text-slate-400 hover:text-white')}`}>{t ? t('cyber') : 'CYBER'}</button>
	                                </div>
	                            </SettingRow>
                        </div>
                    )}
                </div>

                {/* 底部按钮 */}
                <div className={`p-4 shrink-0 ${isIosModal ? 'border-t border-slate-200/60 bg-white/70' : 'border-t border-cyan-900/30 bg-slate-900/95'}`}>
                    {errorMsg && (
                        <div className={`mb-3 flex items-center justify-center gap-2 text-[10px] font-mono py-1 px-2 rounded border ${isIosModal ? 'text-[#FF3B30] bg-[#FF3B30]/10 border-[#FF3B30]/20' : 'text-red-400 bg-red-950/20 border-red-500/20'}`}>
                            <Icons.Help size={12}/> {errorMsg}
                        </div>
                    )}
                    
                    <button 
                        onClick={handleSave}
                        disabled={saveStatus === 'saving' || saveStatus === 'success'}
                        className={`w-full py-3 text-sm font-bold ${isIosModal ? 'font-sans tracking-tight rounded-[16px] shadow-[0_8px_30px_-10px_rgba(0,122,255,0.35)]' : 'font-mono tracking-widest shadow-[0_0_15px_rgba(6,182,212,0.4)]'} active:scale-[0.98] transition-all flex items-center justify-center gap-2 border border-transparent
                            ${saveStatus === 'success' 
	                                ? (isIosModal ? 'bg-[#34C759] hover:bg-[#2fd157] text-white' : 'bg-green-600 hover:bg-green-500 text-white shadow-green-900/50')
	                                : (isIosModal ? 'bg-[#007AFF] hover:bg-[#1b86ff] text-white' : 'bg-cyan-600 hover:bg-cyan-500 text-white')}
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
