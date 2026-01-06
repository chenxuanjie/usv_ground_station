function LogDrawer({ show, setShow, logs, setLogs, devMode, setDevMode, sendData, t, uiStyle = 'cyber', topOffsetPx = 56, fullWidth = false }) {
    const { useState, useRef } = React;
    const [inputCmd, setInputCmd] = useState('');
    const logEndRef = useRef(null);
    const isIos = uiStyle === 'ios' && !!fullWidth;

    return (
        <div 
            className={`fixed right-0 bottom-0 ${fullWidth ? 'w-full' : 'w-80'} flex flex-col text-xs shadow-2xl transition-transform duration-300 ease-in-out z-30 ${show ? 'translate-x-0' : 'translate-x-full'} ${
                isIos
                    ? 'bg-white/85 border-l border-white/40 text-slate-900 backdrop-blur-2xl'
                    : 'bg-slate-950/95 border-l border-cyan-900/50 text-slate-200 backdrop-blur-md'
            }`}
            style={{ top: `${Number.isFinite(Number(topOffsetPx)) ? Number(topOffsetPx) : 56}px` }}
        >
            <div className={`h-16 px-4 flex justify-between items-center ${isIos ? 'bg-white/70 backdrop-blur-xl border-b border-slate-200/60' : 'border-b border-cyan-500/20 bg-gradient-to-b from-slate-900 via-slate-900/80 to-transparent'}`}>
                <span className={`${isIos ? 'font-sans font-bold text-[17px] tracking-tight text-slate-900' : 'font-mono font-bold text-cyan-100 tracking-wider text-sm'} flex items-center gap-2`}>
                    <Icons.Activity className={`w-5 h-5 ${isIos ? 'text-[#007AFF]' : 'text-cyan-400'}`}/> {t('system_logs')}
                </span>
                <div className="flex gap-3 items-center">
                    {/* 开发者模式开关 */}
                    <label className="flex items-center gap-1.5 cursor-pointer group">
                        <span className={`${isIos ? 'text-[12px] font-semibold' : 'text-[10px] font-bold'} ${devMode ? (isIos ? 'text-slate-700' : 'text-cyan-400') : (isIos ? 'text-slate-500 group-hover:text-slate-600' : 'text-slate-500 group-hover:text-slate-400')}`}>{t('dev_mode')}</span>
                        <div className="relative inline-flex items-center">
                            <input type="checkbox" checked={devMode} onChange={e=>setDevMode(e.target.checked)} className="sr-only peer"/>
                            <div className={`${isIos ? 'w-11 h-6 bg-slate-300 peer-checked:bg-[#34C759]' : 'w-6 h-3 bg-slate-700 peer-checked:bg-cyan-600'} peer-focus:outline-none rounded-full peer after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:transition-all ${isIos ? 'after:h-5 after:w-5 peer-checked:after:translate-x-5' : 'after:h-2 after:w-2 peer-checked:after:translate-x-full'}`}></div>
                        </div>
                    </label>
                    
                    <div className={`w-[1px] h-3 ${isIos ? 'bg-slate-200/70' : 'bg-slate-700'}`}></div>
                    
                    <button onClick={()=>setLogs([])} className={`${isIos ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/40 rounded-full w-8 h-8 flex items-center justify-center transition-colors' : 'text-slate-500 hover:text-white transition-colors'}`} title={t('clear_logs')}><Icons.RefreshCw size={12}/></button>
                    <button onClick={()=>setShow(false)} className={`${isIos ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/40 rounded-full w-8 h-8 flex items-center justify-center transition-colors' : 'text-slate-500 hover:text-white transition-colors'}`} title={t('close')}><Icons.X size={14}/></button>
                </div>
            </div>
            <div className={`flex-1 overflow-y-auto p-3 space-y-2 ${isIos ? 'font-mono' : 'font-mono'}`}>
                {logs.filter(log => devMode || log.level === 'info').map(log => (
                    <div
                        key={log.id}
                        className={`break-all border-l-2 pl-2 leading-relaxed transition-all animate-[fadeIn_0.3s_ease-out] ${isIos ? 'text-[11px]' : 'text-[10px]'}`}
                        style={{
                            borderColor: log.dir === 'TX'
                                ? (isIos ? '#34C759' : '#10b981')
                                : (log.dir === 'ERR'
                                    ? (isIos ? '#FF3B30' : '#ef4444')
                                    : (log.dir === 'RX'
                                        ? (isIos ? '#007AFF' : '#3b82f6')
                                        : '#64748b'))
                        }}
                    >
                        <div className={`flex justify-between mb-0.5 ${isIos ? 'text-slate-400' : 'opacity-50'}`}>
                            <span>{log.time}</span>
                            {devMode && <span className={`text-[9px] uppercase border px-1 rounded ${isIos ? 'border-slate-200/70 text-slate-500 bg-white/40' : 'border-slate-700'}`}>{log.dir}</span>}
                        </div>
                        <span className={
                            log.dir==='TX' ? (isIos ? 'text-[#34C759]' : 'text-green-400') :
                            (log.dir==='ERR' ? (isIos ? 'text-[#FF3B30]' : 'text-red-400') :
                            (log.dir==='RX' ? (isIos ? 'text-[#007AFF]' : 'text-blue-300') : (isIos ? 'text-slate-700' : 'text-slate-300')))
                        }>
                            {log.msg}
                        </span>
                    </div>
                ))}
                {/* 空状态提示 */}
                {logs.length === 0 && <div className={`text-center mt-10 ${isIos ? 'text-slate-400' : 'text-slate-600 italic'}`}>{t('system_ready')}</div>}
                <div ref={logEndRef}></div>
            </div>
            <div className={`p-3 ${isIos ? 'border-t border-slate-200/60 bg-white/70' : 'border-t border-cyan-900/30 bg-slate-900/90'}`}>
                <div className={`flex items-center border px-2 py-1 transition-colors ${isIos ? 'bg-[#767680]/10 border-transparent rounded-[14px] focus-within:border-[#007AFF]/30' : 'bg-slate-950 border-slate-800 rounded focus-within:border-cyan-500/50'}`}>
                    <span className={`${isIos ? 'text-slate-500' : 'text-cyan-500'} mr-2`}>$</span>
                    <input
                        value={inputCmd}
                        onChange={e=>setInputCmd(e.target.value)}
                        onKeyDown={e=>{if(e.key==='Enter'){sendData(inputCmd);setInputCmd('')}}}
                        className={`flex-1 bg-transparent outline-none p-1 ${isIos ? 'text-slate-900 placeholder:text-slate-500' : 'text-cyan-100 placeholder-slate-700'}`}
                        placeholder={t('cmd_placeholder')}
                    />
                    <button onClick={()=>{sendData(inputCmd);setInputCmd('')}} className={`${isIos ? 'text-[#007AFF] hover:text-[#005BB5]' : 'text-cyan-500 hover:text-cyan-300'}`}><Icons.Send size={14}/></button>
                </div>
            </div>
        </div>
    );
}
