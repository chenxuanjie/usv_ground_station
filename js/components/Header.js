// js/components/Header.js
function Header({ lang, setLang, webConnected, tcpStatus, serverIp, setServerIp, serverPort, setServerPort, toggleConnection, btnConfig, showLogs, setShowLogs, onOpenSettings, t }) {
    return (
        <header className="h-14 bg-slate-900/80 border-b border-cyan-500/30 flex items-center px-4 justify-between shrink-0 backdrop-blur-md relative z-20">
            <div className="flex items-center gap-2">
                <div className="p-1.5 bg-cyan-500/10 border border-cyan-500/50 rounded">
                    <Icons.Activity className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                    <h1 className="text-lg font-black text-white tracking-wider italic">USV<span className="text-cyan-500">TERMINAL</span></h1>
                    <p className="text-[10px] text-cyan-500/60 -mt-1 tracking-widest uppercase">{t('subtitle')}</p>
                </div>
                <button 
                    onClick={() => setLang(prev => prev === 'zh' ? 'en' : 'zh')}
                    className="ml-4 flex items-center gap-1 px-2 py-0.5 border border-cyan-500/30 rounded bg-slate-800/50 text-[10px] text-cyan-400 hover:bg-cyan-500/10 hover:border-cyan-400 transition-all"
                >
                    <Icons.Globe size={10} />
                    {lang === 'zh' ? '中 / EN' : 'ZH / EN'}
                </button>
            </div>
            
            <div className="flex items-center gap-4">
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

                <div className="w-[1px] h-6 bg-slate-700 mx-1"></div>

                {/* [新增] 设置按钮 */}
                <button 
                    onClick={onOpenSettings}
                    className="flex items-center gap-2 px-3 py-1.5 rounded border text-xs font-bold bg-slate-800 border-slate-600 text-slate-400 hover:text-white hover:border-slate-500 transition-all"
                    title={t('btn_settings')}
                >
                    <Icons.Settings size={14} />
                    <span className="hidden xl:inline">{t('btn_settings')}</span>
                </button>

                <button 
                    onClick={() => setShowLogs(!showLogs)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded border text-xs font-bold transition-all ${showLogs ? 'bg-cyan-500 text-white border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.4)]' : 'bg-slate-800 border-slate-600 text-slate-400 hover:text-white hover:border-slate-500'}`}
                >
                    <Icons.Sidebar size={14} />
                    {t('toggle_logs')}
                </button>
            </div>
        </header>
    );
}