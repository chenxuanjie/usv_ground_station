// js/components/Header.js
function Header({ lang, setLang, webConnected, tcpStatus, serverIp, setServerIp, serverPort, setServerPort, toggleConnection, btnConfig, showLogs, setShowLogs, onOpenSettings, t }) {
    return (
        <header className="h-16 bg-slate-900/90 border-b border-cyan-500/30 flex items-center px-4 justify-between shrink-0 backdrop-blur-md relative z-20 shadow-lg">
            {/* 左侧 Logo 区域 */}
            <div className="flex items-center gap-3">
                <div className="p-2 bg-cyan-500/10 border border-cyan-500/50 rounded-lg shadow-[0_0_10px_rgba(6,182,212,0.2)]">
                    <Icons.Activity className="w-6 h-6 text-cyan-400" />
                </div>
                <div>
                    <h1 className="text-xl font-black text-white tracking-wider italic">USV<span className="text-cyan-500">TERMINAL</span></h1>
                    <p className="text-[10px] text-cyan-500/60 -mt-1 tracking-[0.2em] uppercase">{t('subtitle')}</p>
                </div>
                <button 
                    onClick={() => setLang(prev => prev === 'zh' ? 'en' : 'zh')}
                    className="ml-6 flex items-center gap-1 px-2 py-1 border border-cyan-500/30 rounded bg-slate-800/50 text-[10px] text-cyan-400 hover:bg-cyan-500/10 hover:border-cyan-400 transition-all"
                >
                    <Icons.Globe size={12} />
                    {lang === 'zh' ? '中 / EN' : 'ZH / EN'}
                </button>
            </div>
            
            {/* 右侧控制栏 */}
            <div className="flex items-center gap-4">
                
                {/* [修改] 目标地址栏：整体加大、更显眼 */}
                <div className="flex items-center bg-slate-950 border border-slate-700 rounded-md overflow-hidden group hover:border-cyan-500/80 transition-all shadow-inner">
                    {/* 标签：加粗、青色高亮、字号加大 */}
                    <span className="text-xs font-black text-cyan-500 px-3 py-2 bg-slate-900 border-r border-slate-800 tracking-wide uppercase">
                        {t('target')}
                    </span>
                    
                    {/* IP 输入框：字号变大(text-sm)、宽度变宽(w-32)、字体加粗、纯白文字 */}
                    <input 
                        className="bg-transparent text-sm font-mono font-bold w-32 text-center focus:outline-none text-white disabled:opacity-50 py-1 placeholder-slate-700" 
                        value={serverIp} 
                        onChange={e => setServerIp(e.target.value)} 
                        disabled={tcpStatus !== 'OFFLINE'}
                        placeholder="Loading..." 
                    />
                    
                    <div className="w-[1px] h-5 bg-slate-700"></div>
                    
                    {/* 端口输入框：同上调整 */}
                    <input 
                        className="bg-transparent text-sm font-mono font-bold w-16 text-center focus:outline-none text-white disabled:opacity-50 py-1 placeholder-slate-700" 
                        value={serverPort} 
                        onChange={e => setServerPort(e.target.value)} 
                        disabled={tcpStatus !== 'OFFLINE'}
                        placeholder="..."
                    />
                </div>

                {/* 连接按钮 */}
                <button 
                    onClick={toggleConnection}
                    disabled={!webConnected || btnConfig.disabled}
                    className={`${btnConfig.color} text-xs px-5 py-2 rounded border transition-all duration-300 min-w-[100px] font-bold shadow-[0_0_15px_rgba(0,0,0,0.3)] tracking-wide uppercase hover:scale-105 active:scale-95`}
                >
                    {btnConfig.text}
                </button>

                <div className="w-[1px] h-8 bg-slate-700 mx-2"></div>

                {/* [修改] 设置按钮：只保留齿轮图标 */}
                <button 
                    onClick={onOpenSettings}
                    className="flex items-center justify-center w-10 h-10 rounded-lg border border-slate-600 bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 hover:border-cyan-500 transition-all shadow-md group"
                    title={t('btn_settings')}
                >
                    {/* 图标稍微加大到 20，添加旋转动画 */}
                    <Icons.Settings size={20} className="group-hover:rotate-90 transition-transform duration-500"/>
                </button>

                {/* 日志按钮 */}
                <button 
                    onClick={() => setShowLogs(!showLogs)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-xs font-bold transition-all h-10 ${showLogs ? 'bg-cyan-600 text-white border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.4)]' : 'bg-slate-800 border-slate-600 text-slate-400 hover:text-white hover:border-slate-500'}`}
                >
                    <Icons.Sidebar size={16} />
                    {t('toggle_logs')}
                </button>
            </div>
        </header>
    );
}