// js/components/ChartModal.js
const { useEffect, useRef, useState, useCallback } = React;

// 1. 核心配置 (修改 label -> labelKey)
const CHART_CONFIG = [
    { key: 'batL', labelKey: 'chart_bat_l', color: '#06b6d4', unit: 'V', yAxisIndex: 0 },
    { key: 'batR', labelKey: 'chart_bat_r', color: '#10b981', unit: 'V', yAxisIndex: 0 },
    { key: 'heading', labelKey: 'chart_heading', color: '#a855f7', unit: '°', yAxisIndex: 0 }
];

// 内联 SVG 图标
const ActionIcons = {
    Save: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>,
    Zoom: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><path d="M8 11h6"/><path d="M11 8v6"/></svg>,
    Reset: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
};

// 定义内部组件
function ChartModalComponent({ isOpen, onClose, dataRef, onClear, t }) {
    const chartRef = useRef(null);
    const echartsInstance = useRef(null);
    
    // [UI 状态]
    const [isPaused, setIsPaused] = useState(false);
    const [isZoomMode, setIsZoomMode] = useState(false);
    const [isZoomLock, setIsZoomLock] = useState(false);
    
    // [逻辑 Refs]
    const isZoomModeRef = useRef(false); 
    const zoomLockRef = useRef(false);
    const isInteractingRef = useRef(false);
    const lastMousePosRef = useRef(null);
    
    // HUD 状态
    const [hudData, setHudData] = useState({ batL: 0, batR: 0, heading: 0 });
    const [activeKeys, setActiveKeys] = useState(new Set(CHART_CONFIG.map(c => c.key)));
    const lastHudUpdateRef = useRef(0);

    // 退出缩放模式
    const exitZoomMode = useCallback(() => {
        isZoomModeRef.current = false;
        setIsZoomMode(false);
        zoomLockRef.current = false;
        setIsZoomLock(false);

        if (echartsInstance.current) {
            echartsInstance.current.dispatchAction({
                type: 'takeGlobalCursor',
                key: 'dataZoomSelect',
                dataZoomSelectActive: false 
            });
            echartsInstance.current.getZr().setCursorStyle('default');
        }
    }, []);

    // 2. 初始化 ECharts
    useEffect(() => {
        if (!isOpen) return;
        if (echartsInstance.current) {
            echartsInstance.current.dispose();
            echartsInstance.current = null;
        }

        const timer = setTimeout(() => {
            if (!chartRef.current || !window.echarts) return;

            echartsInstance.current = window.echarts.init(chartRef.current, 'dark', { renderer: 'canvas' });

            const baseOption = {
                backgroundColor: 'transparent',
                animation: false, 
                hoverLayerThreshold: Infinity,
                
                toolbox: {
                    show: true,
                    top: -100, 
                    feature: {
                        dataZoom: { yAxisIndex: 'none' }
                    }
                },
                
                tooltip: {
                    trigger: 'axis',
                    animation: false, 
                    transitionDuration: 0, 
                    axisPointer: { type: 'cross', animation: false, snap: false },
                    confine: true,
                    backgroundColor: 'rgba(50, 50, 50, 0.9)',
                    textStyle: { color: '#fff' }
                },
                legend: { show: false },
                dataZoom: [
                    { type: 'slider', show: true, xAxisIndex: [0], start: 0, end: 100, height: 24, bottom: 10, borderColor: '#334155', textStyle: { color: '#94a3b8' }, handleStyle: { color: '#06b6d4' }, fillerColor: 'rgba(6, 182, 212, 0.1)', showDataShadow: true },
                    { type: 'inside', xAxisIndex: [0], start: 0, end: 100 }
                ],
                grid: { left: '3%', right: '4%', bottom: '15%', top: '15%', containLabel: true },
                yAxis: [{ 
                    type: 'value', 
                    position: 'left', 
                    splitLine: { lineStyle: { color: '#1e293b' } }, 
                    axisLabel: { color: '#94a3b8' } 
                }],
                xAxis: { type: 'category', boundaryGap: false, axisLine: { lineStyle: { color: '#475569' } }, axisLabel: { color: '#94a3b8' }, data: [] },
                series: []
            };
            
            echartsInstance.current.setOption(baseOption);

            const zr = echartsInstance.current.getZr();
            zr.on('mousemove', function(e) {
                lastMousePosRef.current = { x: e.offsetX, y: e.offsetY };
            });
            zr.on('mousedown', function(e) {
                isInteractingRef.current = true;
            });
            zr.on('mouseup', function(e) {
                setTimeout(() => { isInteractingRef.current = false; }, 100);
            });
            zr.on('globalout', function() {
                lastMousePosRef.current = null;
                isInteractingRef.current = false;
            });

            // 监听缩放事件：如果是单次模式，缩放结束后自动退出
            echartsInstance.current.on('dataZoom', () => {
                if (isZoomModeRef.current && !zoomLockRef.current) {
                    exitZoomMode();
                }
            });

            echartsInstance.current.resize();
        }, 50);

        const handleResize = () => echartsInstance.current && echartsInstance.current.resize();
        window.addEventListener('resize', handleResize);

        return () => {
            clearTimeout(timer);
            window.removeEventListener('resize', handleResize);
            if (echartsInstance.current) {
                echartsInstance.current.dispose();
                echartsInstance.current = null;
            }
        };
    }, [isOpen, exitZoomMode]);

    // 3. 极速刷新循环
    useEffect(() => {
        if (!isOpen) return;

        const renderFrame = () => {
            if (isZoomModeRef.current || isInteractingRef.current) return;

            if (!echartsInstance.current || !dataRef || !dataRef.current) return;
            const fullData = dataRef.current;
            if (fullData.length === 0) return;

            const now = Date.now();
            if (now - lastHudUpdateRef.current > 100) {
                setHudData(fullData[fullData.length - 1]); 
                lastHudUpdateRef.current = now;
            }

            const dynamicSeries = CHART_CONFIG.map(config => {
                if (!activeKeys.has(config.key)) return null;
                return {
                    // [修改] 动态翻译 series 名称
                    name: t ? t(config.labelKey) : config.key, 
                    type: 'line',
                    smooth: true,
                    symbol: 'none',
                    yAxisIndex: config.yAxisIndex,
                    data: fullData.map(item => item[config.key]),
                    lineStyle: { color: config.color, width: 3 },
                    itemStyle: { color: config.color },
                    areaStyle: config.unit === 'V' ? {
                        color: new window.echarts.graphic.LinearGradient(0, 0, 0, 1, [
                            { offset: 0, color: config.color + '4D' }, 
                            { offset: 1, color: config.color + '03' }
                        ])
                    } : null
                };
            }).filter(s => s !== null);

            echartsInstance.current.setOption({
                xAxis: {
                    data: fullData.map(item => item.time),
                    axisLabel: { hideOverlap: true, formatter: (v) => v.split(' ').pop() }
                },
                yAxis: [{
                    min: (v) => Math.floor(v.min), 
                    max: (v) => Math.ceil(v.max)
                }],
                series: dynamicSeries
            }, { lazyUpdate: false, replaceMerge: ['series'] });

            if (!isPaused && lastMousePosRef.current) {
                echartsInstance.current.dispatchAction({
                    type: 'showTip',
                    x: lastMousePosRef.current.x,
                    y: lastMousePosRef.current.y
                });
            }
        };

        let renderTimer;
        if (!isPaused) {
            renderTimer = setInterval(renderFrame, 10);
        } else {
            renderFrame();
        }

        return () => {
            if (renderTimer) clearInterval(renderTimer);
        };

    }, [isOpen, isPaused, activeKeys, t]); // 添加 t 依赖

    // === 工具栏功能 ===
    
    // 单击：开启单次模式
    const handleZoomToggle = useCallback(() => {
        if (!echartsInstance.current) return;

        if (isZoomMode) {
            exitZoomMode();
        } else {
            isZoomModeRef.current = true; 
            setIsZoomMode(true);          
            
            zoomLockRef.current = false;
            setIsZoomLock(false);

            setTimeout(() => {
                if(echartsInstance.current) {
                    echartsInstance.current.dispatchAction({
                        type: 'takeGlobalCursor',
                        key: 'dataZoomSelect',
                        dataZoomSelectActive: true
                    });
                }
            }, 20);
        }
    }, [isZoomMode, exitZoomMode]);

    // 双击：开启锁定模式
    const handleZoomDouble = useCallback(() => {
        if (!echartsInstance.current) return;
        
        isZoomModeRef.current = true;
        setIsZoomMode(true);
        
        zoomLockRef.current = true;
        setIsZoomLock(true);

        setTimeout(() => {
            if(echartsInstance.current) {
                echartsInstance.current.dispatchAction({
                    type: 'takeGlobalCursor',
                    key: 'dataZoomSelect',
                    dataZoomSelectActive: true
                });
            }
        }, 20);
    }, []);

    const handleSaveImage = () => {
        if (!echartsInstance.current) return;
        const url = echartsInstance.current.getDataURL({
            type: 'png', backgroundColor: '#0f172a', pixelRatio: 2
        });
        const a = document.createElement('a');
        a.href = url;
        a.download = `USV_Chart_${new Date().toLocaleTimeString().replace(/:/g, '-')}.png`;
        a.click();
    };

    const handleResetView = () => {
        if (!echartsInstance.current) return;
        echartsInstance.current.dispatchAction({
            type: 'dataZoom',
            start: 0,
            end: 100
        });
        if (isZoomMode && !zoomLockRef.current) {
             exitZoomMode();
        }
    };

    const toggleChannel = (key) => {
        const newSet = new Set(activeKeys);
        if (newSet.has(key)) newSet.delete(key); else newSet.add(key);
        setActiveKeys(newSet);
    };
    const soloChannel = (key) => setActiveKeys(new Set([key]));
    
    const handleClear = () => {
        if(onClear) onClear();
        if(echartsInstance.current) echartsInstance.current.setOption({ xAxis: { data: [] }, series: [] });
        setHudData({ batL: 0, batR: 0, heading: 0 });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
            <div className="w-[95%] h-[90%] bg-slate-900 border border-slate-700 rounded-lg shadow-2xl flex flex-col relative overflow-hidden">
                <div className="h-24 bg-slate-800/80 border-b border-slate-700 flex items-center justify-between px-6 shrink-0 backdrop-blur gap-4">
                    <div className="flex flex-col gap-2 shrink-0">
                        <div className="flex items-center gap-2">
                            <Icons.Activity className="w-5 h-5 text-cyan-400" />
                            {/* [修改] 标题翻译 */}
                            <span className="font-bold text-slate-200 tracking-wider text-lg">{t ? t('chart_title') : 'DATA ANALYSIS'}</span>
                        </div>
                        {/* [修改] 暂停按钮翻译 */}
                        <button onClick={() => setIsPaused(!isPaused)} className={`flex items-center justify-center gap-2 px-4 py-1 rounded-full text-xs font-bold border transition-all ${isPaused ? 'bg-yellow-500/20 border-yellow-500 text-yellow-400' : 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600'}`}>
                            {isPaused ? <span>{t ? t('chart_resume') : '▶ RESUME'}</span> : <span>{t ? t('chart_pause') : '⏸ PAUSE'}</span>}
                        </button>
                    </div>

                    <div className="flex flex-1 justify-center gap-3 overflow-x-auto px-2 scrollbar-hide">
                        {CHART_CONFIG.map(config => {
                            const isActive = activeKeys.has(config.key);
                            const baseStyle = isActive ? { borderColor: config.color, backgroundColor: config.color + '1A' } : { borderColor: '#334155', backgroundColor: '#1e293b' };
                            const textClass = isActive ? 'text-white' : 'text-slate-500';
                            const value = hudData[config.key] !== undefined ? hudData[config.key] : 0;
                            return (
                                <button key={config.key} onClick={() => toggleChannel(config.key)} onDoubleClick={() => soloChannel(config.key)} className={`flex flex-col items-center px-4 py-2 rounded border transition-all min-w-[100px] select-none hover:scale-105 active:scale-95 duration-200`} style={{ ...baseStyle, opacity: isActive ? 1 : 0.5, filter: isActive ? 'none' : 'grayscale(100%)' }} title={t ? t('chart_tip_toggle') : "Toggle/Solo"}>
                                    {/* [修改] 按钮标签翻译 */}
                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{t ? t(config.labelKey) : config.key}</span>
                                    <span className={`text-xl font-black font-mono ${textClass}`} style={{ color: isActive ? config.color : undefined }}>
                                        {typeof value === 'number' ? value.toFixed(1) : value}
                                        <span className="text-xs ml-0.5 opacity-60">{config.unit}</span>
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        <div className="flex items-center bg-slate-800 rounded border border-slate-700 mr-2">
                            <button 
                                onClick={handleZoomToggle} 
                                onDoubleClick={handleZoomDouble}
                                className={`p-2 transition-colors ${isZoomMode ? (isZoomLock ? 'text-red-400 bg-red-500/20 animate-pulse' : 'text-yellow-400 bg-yellow-500/20') : 'text-slate-400 hover:text-yellow-400 hover:bg-slate-700'}`} 
                                // [修改] 提示文字翻译
                                title={isZoomMode ? (t?t('chart_tip_zoom_active'):"Cancel") : (t?t('chart_tip_zoom_hint'):"Click/DblClick")}
                            >
                                <ActionIcons.Zoom className="w-4 h-4" />
                            </button>
                            
                            <div className="w-[1px] h-4 bg-slate-700"></div>
                            
                            <button onClick={handleResetView} className="p-2 text-slate-400 hover:text-green-400 hover:bg-slate-700 transition-colors" title={t ? t('chart_tip_reset') : "Reset"}>
                                <ActionIcons.Reset className="w-4 h-4" />
                            </button>
                            
                            <div className="w-[1px] h-4 bg-slate-700"></div>
                            
                            <button onClick={handleSaveImage} className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-slate-700 transition-colors" title={t ? t('chart_tip_save') : "Save"}>
                                <ActionIcons.Save className="w-4 h-4" />
                            </button>
                        </div>

                        <button onClick={handleClear} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-red-900/30 border border-slate-700 hover:border-red-500/50 text-slate-400 hover:text-red-400 rounded text-xs transition-all">
                            <Icons.Trash className="w-3.5 h-3.5" /> <span>{t ? t('chart_clear') : "Clear"}</span>
                        </button>
                        <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition-colors"><Icons.X className="w-6 h-6" /></button>
                    </div>
                </div>
                <div className="flex-1 relative bg-slate-950/50 w-full h-full p-2">
                    <div ref={chartRef} className="w-full h-full"></div>
                    {(isPaused || isZoomMode) && (
                        <div className={`absolute top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold pointer-events-none backdrop-blur-sm z-10 flex items-center gap-2 border ${
                            isZoomMode ? (isZoomLock ? 'bg-red-500/10 border-red-500/30 text-red-500' : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-500') : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-500'
                        }`}>
                             {/* [修改] 状态提示翻译 */}
                             {isZoomMode 
                                ? (isZoomLock ? <span>{t?t('chart_msg_locked'):"LOCKED"}</span> : <span>{t?t('chart_msg_active'):"ACTIVE"}</span>)
                                : <span>{t?t('chart_msg_paused'):"PAUSED"}</span>}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// 4. 组件隔离
const ChartModal = React.memo(ChartModalComponent, (prev, next) => {
    return prev.isOpen === next.isOpen && prev.dataRef === next.dataRef && prev.t === next.t; // 添加 t 对比
});