// js/components/SettingsModal.js
const { useState, useEffect, useRef } = React;

function SettingsModal({ isOpen, onClose, currentIp, currentPort, currentChartFps, onSave, t }) {
    const [ip, setIp] = useState(currentIp);
    const [port, setPort] = useState(currentPort);
    const [chartFps, setChartFps] = useState(currentChartFps);
    const [statusMsg, setStatusMsg] = useState('');
    const closeTimerRef = useRef(null);

    // 当打开弹窗时，同步当前的 IP 和 端口
    useEffect(() => {
        if (isOpen) {
            if (closeTimerRef.current) {
                clearTimeout(closeTimerRef.current);
                closeTimerRef.current = null;
            }
            setIp(currentIp);
            setPort(currentPort);
            setChartFps(currentChartFps);
            setStatusMsg('');
        }
    }, [isOpen, currentIp, currentPort, currentChartFps]);

    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                if (closeTimerRef.current) {
                    clearTimeout(closeTimerRef.current);
                    closeTimerRef.current = null;
                }
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose]);

    const handleSave = () => {
        const fpsNum = Number(chartFps);
        if (!ip || !port || !Number.isFinite(fpsNum) || fpsNum < 5 || fpsNum > 240) {
            setStatusMsg('❌ ' + (t ? t('err_invalid_input') : "Invalid Input"));
            return;
        }
        onSave(ip, port, Math.round(fpsNum));
        setStatusMsg('✅ ' + (t ? t('msg_save_success') : "Saved!"));
        
        // 延迟关闭
        if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
        closeTimerRef.current = setTimeout(() => {
            onClose();
            closeTimerRef.current = null;
        }, 800);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
            <div className="w-96 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl overflow-hidden flex flex-col">
                {/* 标题栏 */}
                <div className="px-6 py-4 border-b border-slate-700 bg-slate-800/50 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <Icons.Settings className="w-5 h-5 text-cyan-400"/>
                        {t ? t('settings_title') : 'System Settings'}
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <Icons.X size={20}/>
                    </button>
                </div>

                {/* 内容区 */}
                <div className="p-6 space-y-4">
                    <div className="space-y-1">
                        <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                            {t ? t('set_boat_ip') : 'Target IP'}
                        </label>
                        <input 
                            type="text" 
                            value={ip}
                            onChange={(e) => setIp(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm text-cyan-100 focus:border-cyan-500 outline-none transition-colors font-mono"
                            placeholder="127.0.0.1"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                            {t ? t('set_boat_port') : 'Target Port'}
                        </label>
                        <input 
                            type="number" 
                            value={port}
                            onChange={(e) => setPort(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm text-cyan-100 focus:border-cyan-500 outline-none transition-colors font-mono"
                            placeholder="6202"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                            {t ? t('chart_fps') : 'Chart FPS'}
                        </label>
                        <input 
                            type="number" 
                            min="5"
                            max="240"
                            step="5"
                            value={chartFps}
                            onChange={(e) => setChartFps(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm text-cyan-100 focus:border-cyan-500 outline-none transition-colors font-mono"
                            placeholder="120"
                        />
                        <div className="text-[10px] text-slate-500">
                            {t ? t('chart_fps_hint') : 'Higher is smoother, but uses more CPU/GPU.'}
                        </div>
                    </div>

                    {/* 状态提示 */}
                    <div className="h-6 flex items-center justify-center">
                        <span className="text-xs font-bold text-cyan-400 animate-pulse">{statusMsg}</span>
                    </div>
                </div>

                {/* 底部按钮 */}
                <div className="px-6 py-4 bg-slate-800/30 border-t border-slate-700 flex justify-end gap-3">
                    <button 
                        onClick={onClose}
                        className="px-4 py-2 rounded text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                    >
                        {t ? t('btn_cancel') : 'Cancel'}
                    </button>
                    <button 
                        onClick={handleSave}
                        className="px-6 py-2 rounded bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-lg shadow-cyan-900/50 transition-all active:scale-95"
                    >
                        {t ? t('btn_save') : 'Save Config'}
                    </button>
                </div>
            </div>
        </div>
    );
}
