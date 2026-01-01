// js/components/SettingsModal.js
const { useState, useEffect, useRef } = React;

// --------------------------------------------------------
// Setting Item 组件 (抽离单行样式)
// --------------------------------------------------------
const SettingRow = ({ icon: Icon, title, desc, children }) => (
    <div className="flex items-start gap-4 p-4 rounded-xl hover:bg-slate-800/30 transition-colors border border-transparent hover:border-slate-800/50 group">
        <div className="mt-1 p-2 bg-slate-800 rounded-lg text-slate-400 group-hover:text-cyan-400 group-hover:bg-cyan-950/30 transition-colors">
            <Icon size={20} />
        </div>
        <div className="flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h3 className="text-sm font-bold text-slate-200">{title}</h3>
                    <p className="text-xs text-slate-500 max-w-[200px] leading-relaxed">{desc}</p>
                </div>
                <div className="flex items-center min-w-[180px] justify-end">
                    {children}
                </div>
            </div>
        </div>
    </div>
);

function SettingsModal({ isOpen, onClose, currentIp, currentPort, currentChartFps, currentAutoReconnect, onSave, t }) {
    const [ip, setIp] = useState(currentIp);
    const [port, setPort] = useState(currentPort);
    const [chartFps, setChartFps] = useState(currentChartFps);
    const [autoReconnect, setAutoReconnect] = useState(!!currentAutoReconnect);
    
    const [saveStatus, setSaveStatus] = useState('idle');
    const [errorMsg, setErrorMsg] = useState('');
    const closeTimerRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
            setIp(currentIp);
            setPort(currentPort);
            setChartFps(currentChartFps);
            setAutoReconnect(!!currentAutoReconnect);
            setSaveStatus('idle');
            setErrorMsg('');
        }
    }, [isOpen]);

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
        setTimeout(() => {
            onSave(ip, port, Math.round(fpsNum), !!autoReconnect);
            setSaveStatus('success');
            
            if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
            closeTimerRef.current = setTimeout(() => {
                onClose();
            }, 800);
        }, 600);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* 遮罩 */}
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
            
            {/* 弹窗 */}
            <div className="relative w-full max-w-[36rem] glass-panel border border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden animate-modal-enter ring-1 ring-white/10 flex flex-col max-h-[90vh]">
                
                {/* 装饰顶条 */}
                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-cyan-500 via-purple-500 to-cyan-500 opacity-80"></div>

                {/* 头部 */}
                <div className="px-6 py-5 border-b border-slate-800/50 flex justify-between items-center bg-slate-900/50">
                    <div>
                        <h2 className="text-base font-bold text-white flex items-center gap-2">
                            <Icons.Settings className="text-cyan-400" size={20} />
                            {t ? t('settings_title') : 'System Configuration'}
                        </h2>
                        <p className="text-xs text-slate-500 mt-1 font-mono tracking-tight">USV-GCS // VERSION 2.5.0</p>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                    >
                        <Icons.X size={20}/>
                    </button>
                </div>

                {/* 滚动内容区 */}
                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                    
                    {/* 分组：连接设置 */}
                    <section>
                        <div className="px-4 pb-2 text-xs font-bold text-cyan-500 uppercase tracking-widest flex items-center gap-2">
                            <span>Core Connection</span>
                            <div className="h-[1px] flex-1 bg-cyan-900/50"></div>
                        </div>
                        <div className="space-y-1">
                            <SettingRow 
                                icon={Icons.Server} 
                                title={t ? t('set_boat_ip') : "Target IP Address"}
                                desc={t ? t('desc_ip') : "IPv4 address of the USV onboard computer (e.g., 192.168.1.10)."}
                            >
                                <div className="relative w-full">
                                    <input 
                                        type="text" 
                                        value={ip}
                                        onChange={(e) => setIp(e.target.value)}
                                        className="w-full bg-slate-950/80 border border-slate-700 rounded-lg px-3 py-2 text-sm text-cyan-400 font-mono focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 outline-none transition-all placeholder-slate-700 text-right"
                                        placeholder="0.0.0.0"
                                    />
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-600 font-bold pointer-events-none">IPV4</div>
                                </div>
                            </SettingRow>

                            <SettingRow 
                                icon={Icons.Anchor} 
                                title={t ? t('set_boat_port') : "Communication Port"}
                                desc={t ? t('desc_port') : "TCP/WebSocket port for telemetry data stream."}
                            >
                                <div className="relative w-full">
                                    <input 
                                        type="number" 
                                        value={port}
                                        onChange={(e) => setPort(e.target.value)}
                                        className="w-full bg-slate-950/80 border border-slate-700 rounded-lg px-3 py-2 text-sm text-cyan-400 font-mono focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 outline-none transition-all placeholder-slate-700 text-right"
                                        placeholder="6202"
                                    />
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-600 font-bold pointer-events-none">TCP</div>
                                </div>
                            </SettingRow>
                        </div>
                    </section>

                    {/* 分组：性能与行为 */}
                    <section>
                        <div className="px-4 pb-2 text-xs font-bold text-purple-500 uppercase tracking-widest flex items-center gap-2">
                            <span>Performance & Behavior</span>
                            <div className="h-[1px] flex-1 bg-purple-900/50"></div>
                        </div>
                        <div className="space-y-1">
                            <SettingRow 
                                icon={Icons.Activity} 
                                title={t ? t('chart_fps') : "Chart Refresh Rate"}
                                desc={t ? t('desc_fps') : "Limit data visualization refresh rate to save CPU."}
                            >
                                <div className="w-full flex flex-col items-end gap-2">
                                    <div className="flex items-center gap-2 bg-slate-950/50 px-2 py-1 rounded border border-slate-800">
                                        <span className={`text-sm font-mono font-bold ${Number(chartFps) > 60 ? 'text-purple-400' : 'text-slate-300'}`}>{chartFps}</span>
                                        <span className="text-[10px] text-slate-500">FPS</span>
                                    </div>
                                    <input 
                                        type="range" 
                                        min="30" max="240" step="10"
                                        value={chartFps}
                                        onChange={(e) => setChartFps(e.target.value)}
                                        className="w-full max-w-[140px]"
                                    />
                                </div>
                            </SettingRow>

                            <SettingRow 
                                icon={Icons.Zap} 
                                title={t ? t('auto_reconnect') : "Auto Reconnect"}
                                desc={t ? t('desc_reconnect') : "Automatically attempt to restore connection if lost."}
                            >
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" checked={autoReconnect} onChange={e=>setAutoReconnect(e.target.checked)} className="sr-only peer"/>
                                    <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500 shadow-inner"></div>
                                </label>
                            </SettingRow>
                        </div>
                    </section>
                </div>

                {/* 底部 */}
                <div className="px-6 py-4 bg-slate-900/80 border-t border-slate-800 flex justify-between items-center shrink-0">
                    <div className={`text-xs font-bold text-red-400 flex items-center gap-2 transition-opacity duration-300 ${saveStatus === 'error' ? 'opacity-100' : 'opacity-0'}`}>
                        <Icons.Help size={14}/> {errorMsg}
                    </div>

                    <div className="flex gap-3">
                        <button 
                            onClick={onClose}
                            className="px-4 py-2 rounded-lg text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors uppercase tracking-wide border border-transparent hover:border-slate-700"
                        >
                            {t ? t('btn_cancel') : 'Cancel'}
                        </button>
                        <button 
                            onClick={handleSave}
                            disabled={saveStatus === 'saving' || saveStatus === 'success'}
                            className={`
                                relative px-6 py-2 rounded-lg text-xs font-bold text-white shadow-lg transition-all duration-300 flex items-center gap-2 uppercase tracking-wide overflow-hidden border border-white/10
                                ${saveStatus === 'success' 
                                    ? 'bg-green-600 shadow-green-900/50 hover:bg-green-500' 
                                    : 'bg-cyan-600 hover:bg-cyan-500 shadow-cyan-900/50 active:scale-95'
                                }
                                ${saveStatus === 'saving' ? 'opacity-80 cursor-wait' : ''}
                            `}
                        >
                            {saveStatus === 'saving' && (
                                <svg className="animate-spin -ml-1 mr-1 h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            )}
                            {saveStatus === 'success' && <Icons.Check className="w-4 h-4" />}
                            <span>
                                {saveStatus === 'saving' ? 'Applying...' : (saveStatus === 'success' ? 'Saved' : (t ? t('btn_save') : 'Save Changes'))}
                            </span>
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}