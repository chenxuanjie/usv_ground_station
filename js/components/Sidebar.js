function Sidebar({ boatStatus, configState, setConfigState, keyState, sendSCommand, sendKCommand, sendWaypointsCommand, waypointsCount, t }) {
    const { streamOn, setStreamOn, recvOn, setRecvOn, controlMode, setControlMode, cruiseMode, setCruiseMode } = configState;

    // 逻辑：未连接(无数据)时，不旋转(图标默认45度)；连接后，减去45度以校准正北
    const isDataActive = !!boatStatus.lastUpdate;
    const compassRotation = isDataActive ? (boatStatus.heading - 45) : 0;

    return (
        <div className="w-80 bg-slate-950/80 border-r border-cyan-900/30 flex flex-col p-4 gap-4 overflow-y-auto backdrop-blur-sm scrollbar-hide z-10">
            
            {/* HUD Monitor */}
            <div className="relative p-4 rounded-lg border border-cyan-500/30 bg-slate-900/90 shadow-[0_0_20px_rgba(6,182,212,0.05)] overflow-hidden group">
                <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-cyan-400"></div>
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-cyan-400"></div>
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"></div>
                
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xs font-bold text-cyan-500 tracking-widest uppercase flex items-center gap-2">
                        <Icons.MapPin size={14}/> {t('status_monitor')}
                    </h3>
                    {!boatStatus.lastUpdate && <span className="text-[10px] text-yellow-500 animate-pulse">{t('waiting_data')}</span>}
                </div>

                <div className="flex items-center justify-between mb-6">
                    <div className="relative w-16 h-16 border-2 border-slate-700 rounded-full flex items-center justify-center bg-slate-950 shadow-inner">
                        <div className="absolute top-0 w-1 h-2 bg-cyan-400 z-10"></div>
                        <div className="absolute inset-1 border border-dashed border-slate-600 rounded-full opacity-50"></div>
                        {/* 动态罗盘 */}
                        <div 
                            style={{ transform: `rotate(${compassRotation}deg)`, transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)' }} 
                            className={`w-full h-full flex items-center justify-center ${!isDataActive ? 'opacity-60' : ''}`}
                        >
                            <Icons.Navigation className="text-cyan-400 drop-shadow-[0_0_5px_rgba(34,211,238,0.8)]" size={24} />
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-4xl font-black text-white tracking-tighter drop-shadow-md">
                            {boatStatus.heading.toFixed(1)}<span className="text-lg text-cyan-600 ml-1">°</span>
                        </div>
                        <div className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">{t('current_heading')}</div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-slate-950/50 p-2 rounded border border-slate-800 mb-4">
                    <div className="flex flex-col">
                        <span className="text-[10px] text-slate-500 mb-1">{t('latitude')}</span>
                        <span className="text-cyan-100 font-bold">{boatStatus.latitude.toFixed(6)}</span>
                    </div>
                    <div className="flex flex-col text-right">
                        <span className="text-[10px] text-slate-500 mb-1">{t('longitude')}</span>
                        <span className="text-cyan-100 font-bold">{boatStatus.longitude.toFixed(6)}</span>
                    </div>
                </div>

                <div className="space-y-3 pt-3 border-t border-slate-800/50">
                    <div className="space-y-1">
                        <div className="flex justify-between text-[10px] text-cyan-300 font-bold">
                            <span>PWR_L</span>
                            <span>{boatStatus.batteryL.toFixed(2)}V</span>
                        </div>
                        <div className="h-1.5 bg-slate-800 rounded-sm overflow-hidden relative">
                            <div className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.5)] transition-all duration-1000" style={{width: `${(boatStatus.batteryL/14)*100}%`}}></div>
                        </div>
                    </div>
                    <div className="space-y-1">
                        <div className="flex justify-between text-[10px] text-cyan-300 font-bold">
                            <span>PWR_R</span>
                            <span>{boatStatus.batteryR.toFixed(2)}V</span>
                        </div>
                        <div className="h-1.5 bg-slate-800 rounded-sm overflow-hidden relative">
                            <div className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.5)] transition-all duration-1000" style={{width: `${(boatStatus.batteryR/14)*100}%`}}></div>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* System Config */}
            <div className="p-4 rounded-lg border border-slate-800 bg-slate-900/50 hover:border-slate-700 transition-colors">
                <h3 className="text-xs font-bold text-slate-400 mb-3 flex items-center gap-2 uppercase tracking-wider">
                    <Icons.Settings size={14}/> {t('system_config')}
                </h3>
                <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => setStreamOn(!streamOn)} className={`p-1.5 rounded border text-[10px] font-bold transition-all ${streamOn?'bg-cyan-500/20 border-cyan-500 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.2)]':'border-slate-700 text-slate-500 hover:border-slate-500'}`}>{streamOn?t('stream_on'):t('stream_off')}</button>
                        <button onClick={() => setRecvOn(!recvOn)} className={`p-1.5 rounded border text-[10px] font-bold transition-all ${recvOn?'bg-cyan-500/20 border-cyan-500 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.2)]':'border-slate-700 text-slate-500 hover:border-slate-500'}`}>{recvOn?t('recv_on'):t('recv_off')}</button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => setControlMode('#')} className={`p-1.5 rounded border text-[10px] font-bold transition-all ${controlMode==='#'?'bg-cyan-500/20 border-cyan-500 text-cyan-300':'border-slate-700 text-slate-500 hover:border-slate-500'}`}>{t('mode_auto')}</button>
                        <button onClick={() => setControlMode('@')} className={`p-1.5 rounded border text-[10px] font-bold transition-all ${controlMode==='@'?'bg-cyan-500/20 border-cyan-500 text-cyan-300':'border-slate-700 text-slate-500 hover:border-slate-500'}`}>{t('mode_manual')}</button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => setCruiseMode('1')} className={`p-1.5 rounded border text-[10px] font-bold transition-all ${cruiseMode==='1'?'bg-cyan-500/20 border-cyan-500 text-cyan-300':'border-slate-700 text-slate-500 hover:border-slate-500'}`}>{t('loop_on')}</button>
                        <button onClick={() => setCruiseMode('0')} className={`p-1.5 rounded border text-[10px] font-bold transition-all ${cruiseMode==='0'?'bg-cyan-500/20 border-cyan-500 text-cyan-300':'border-slate-700 text-slate-500 hover:border-slate-500'}`}>{t('loop_off')}</button>
                    </div>
                    <button onClick={sendSCommand} className="w-full mt-2 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white text-xs py-2 rounded font-bold shadow-lg tracking-wide">{t('deploy_config')}</button>
                </div>
            </div>

            {/* Mission / Waypoints */}
            <div className="p-4 rounded-lg border border-slate-800 bg-slate-900/50 hover:border-slate-700 transition-colors">
                <div className="flex justify-between items-center mb-3">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                         <Icons.Navigation size={14}/> {t('mission_title')}
                    </h3>
                    <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-cyan-300 border border-slate-700">
                        {waypointsCount || 0} {t('mission_pts')}
                    </span>
                </div>
                <button 
                    onClick={sendWaypointsCommand}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white text-xs py-2 rounded font-bold shadow-lg tracking-wide disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!waypointsCount || waypointsCount === 0}
                >
                    <Icons.Send size={12}/> {t('send_waypoints')}
                </button>
                <div className="text-[9px] text-slate-500 mt-2 text-center">
                    {t('mission_instruction')}
                </div>
            </div>

            {/* Remote Control */}
            <div className="p-4 rounded-lg border border-slate-800 bg-slate-900/50 flex flex-col items-center relative">
                <div className="absolute top-2 left-2 text-[10px] text-slate-600 font-bold uppercase tracking-widest">{t('manual_override')}</div>
                <div className="grid grid-cols-3 gap-2 mt-4">
                    <div/>
                    <button 
                        onMouseDown={()=>sendKCommand(1,0,0,0)} 
                        onMouseUp={()=>sendKCommand(0,0,0,0)} 
                        className={`w-14 h-14 border-2 rounded-lg flex items-center justify-center transition-all duration-100 ${keyState.w ? 'bg-cyan-500 border-cyan-300 text-white shadow-[0_0_15px_rgba(6,182,212,0.6)] scale-95' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700 hover:border-slate-500'}`}
                    >
                        <Icons.ArrowUp size={24}/>
                    </button>
                    <div/>
                    
                    <button 
                        onMouseDown={()=>sendKCommand(0,1,0,0)} 
                        onMouseUp={()=>sendKCommand(0,0,0,0)} 
                        className={`w-14 h-14 border-2 rounded-lg flex items-center justify-center transition-all duration-100 ${keyState.a ? 'bg-cyan-500 border-cyan-300 text-white shadow-[0_0_15px_rgba(6,182,212,0.6)] scale-95' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700 hover:border-slate-500'}`}
                    >
                        <Icons.ArrowLeft size={24}/>
                    </button>
                    
                    <button 
                        onMouseDown={()=>sendKCommand(0,0,1,0)} 
                        onMouseUp={()=>sendKCommand(0,0,0,0)} 
                        className={`w-14 h-14 border-2 rounded-lg flex items-center justify-center transition-all duration-100 ${keyState.s ? 'bg-cyan-500 border-cyan-300 text-white shadow-[0_0_15px_rgba(6,182,212,0.6)] scale-95' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700 hover:border-slate-500'}`}
                    >
                        <Icons.ArrowDown size={24}/>
                    </button>
                    
                    <button 
                        onMouseDown={()=>sendKCommand(0,0,0,1)} 
                        onMouseUp={()=>sendKCommand(0,0,0,0)} 
                        className={`w-14 h-14 border-2 rounded-lg flex items-center justify-center transition-all duration-100 ${keyState.d ? 'bg-cyan-500 border-cyan-300 text-white shadow-[0_0_15px_rgba(6,182,212,0.6)] scale-95' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700 hover:border-slate-500'}`}
                    >
                        <Icons.ArrowRight size={24}/>
                    </button>
                </div>
            </div>
        </div>
    );
}