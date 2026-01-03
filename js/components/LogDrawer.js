function LogDrawer({ show, setShow, logs, setLogs, devMode, setDevMode, sendData, t, topOffsetPx = 56, fullWidth = false }) {
    const { useState, useRef } = React;
    const [inputCmd, setInputCmd] = useState('');
    const logEndRef = useRef(null);

    return (
        <div 
            className={`fixed right-0 bottom-0 ${fullWidth ? 'w-full' : 'w-80'} bg-slate-950/95 flex flex-col text-xs border-l border-cyan-900/50 backdrop-blur-md shadow-2xl transition-transform duration-300 ease-in-out z-30 ${show ? 'translate-x-0' : 'translate-x-full'}`}
            style={{ top: `${Number.isFinite(Number(topOffsetPx)) ? Number(topOffsetPx) : 56}px` }}
        >
            <div className="h-16 px-4 border-b border-cyan-500/20 flex justify-between items-center bg-gradient-to-b from-slate-900 via-slate-900/80 to-transparent">
                <span className="font-mono font-bold text-cyan-100 tracking-wider flex items-center gap-2 text-sm">
                    <Icons.Activity className="w-5 h-5 text-cyan-400"/> {t('system_logs')}
                </span>
                <div className="flex gap-3 items-center">
                    {/* 开发者模式开关 */}
                    <label className="flex items-center gap-1.5 cursor-pointer group">
                        <span className={`text-[10px] font-bold ${devMode ? 'text-cyan-400' : 'text-slate-500 group-hover:text-slate-400'}`}>{t('dev_mode')}</span>
                        <div className="relative inline-flex items-center">
                            <input type="checkbox" checked={devMode} onChange={e=>setDevMode(e.target.checked)} className="sr-only peer"/>
                            <div className="w-6 h-3 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-2 after:w-2 after:transition-all peer-checked:bg-cyan-600"></div>
                        </div>
                    </label>
                    
                    <div className="w-[1px] h-3 bg-slate-700"></div>
                    
                    <button onClick={()=>setLogs([])} className="text-slate-500 hover:text-white transition-colors" title="Clear Logs"><Icons.RefreshCw size={12}/></button>
                    <button onClick={()=>setShow(false)} className="text-slate-500 hover:text-white transition-colors" title="Close"><Icons.X size={14}/></button>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto p-3 font-mono space-y-2">
                {logs.filter(log => devMode || log.level === 'info').map(log => (
                    <div key={log.id} className="break-all border-l-2 pl-2 text-[10px] leading-relaxed transition-all animate-[fadeIn_0.3s_ease-out]" 
                            style={{borderColor: log.dir==='TX'?'#10b981':(log.dir==='ERR'?'#ef4444':(log.dir==='RX'?'#3b82f6':'#64748b'))}}>
                        <div className="flex justify-between opacity-50 mb-0.5">
                            <span>{log.time}</span>
                            {devMode && <span className="text-[9px] uppercase border border-slate-700 px-1 rounded">{log.dir}</span>}
                        </div>
                        <span className={
                            log.dir==='TX' ? 'text-green-400' : 
                            (log.dir==='ERR' ? 'text-red-400' : 
                            (log.dir==='RX' ? 'text-blue-300' : 'text-slate-300'))
                        }>
                            {log.msg}
                        </span>
                    </div>
                ))}
                {/* 空状态提示 */}
                {logs.length === 0 && <div className="text-center text-slate-600 mt-10 italic">System Ready</div>}
                <div ref={logEndRef}></div>
            </div>
            <div className="p-3 border-t border-cyan-900/30 bg-slate-900/90">
                <div className="flex items-center bg-slate-950 border border-slate-800 rounded px-2 py-1 focus-within:border-cyan-500/50 transition-colors">
                    <span className="text-cyan-500 mr-2">$</span>
                    <input 
                        value={inputCmd} 
                        onChange={e=>setInputCmd(e.target.value)} 
                        onKeyDown={e=>{if(e.key==='Enter'){sendData(inputCmd);setInputCmd('')}}}
                        className="flex-1 bg-transparent outline-none p-1 text-cyan-100 placeholder-slate-700" 
                        placeholder={t('cmd_placeholder')} 
                    />
                    <button onClick={()=>{sendData(inputCmd);setInputCmd('')}} className="text-cyan-500 hover:text-cyan-300"><Icons.Send size={14}/></button>
                </div>
            </div>
        </div>
    );
}
