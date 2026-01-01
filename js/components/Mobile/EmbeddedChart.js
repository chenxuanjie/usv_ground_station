(function() {
    const { useEffect, useRef, useState, useCallback, memo } = React;

    const CHART_CONFIG = [
        { key: 'batL', labelKey: 'chart_bat_l', color: '#06b6d4', unit: 'V', yAxisIndex: 0 },
        { key: 'batR', labelKey: 'chart_bat_r', color: '#10b981', unit: 'V', yAxisIndex: 0 },
        { key: 'heading', labelKey: 'chart_heading', color: '#a855f7', unit: '°', yAxisIndex: 0 }
    ];

    const ActionIcons = {
        Save: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>,
        Zoom: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><path d="M8 11h6"/><path d="M11 8v6"/></svg>,
        Reset: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
    };

    const EmbeddedChart = memo(({ dataRef, fps, t }) => {
        const chartRef = useRef(null);
        const echartsInstance = useRef(null);
        
        const [isPaused, setIsPaused] = useState(false);
        const [isZoomMode, setIsZoomMode] = useState(false);
        const [isZoomLock, setIsZoomLock] = useState(false);
        
        const isZoomModeRef = useRef(false); 
        const zoomLockRef = useRef(false);
        const isInteractingRef = useRef(false);
        const lastMousePosRef = useRef(null);
        
        const [hudData, setHudData] = useState({ batL: 0, batR: 0, heading: 0 });
        const [activeKeys, setActiveKeys] = useState(new Set(CHART_CONFIG.map(c => c.key)));
        const lastHudUpdateRef = useRef(0);

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

        useEffect(() => {
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
                        show: false, // 隐藏自带工具栏
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
                        textStyle: { color: '#fff', fontSize: 10 }
                    },
                    legend: { show: false },
                    dataZoom: [
                        { type: 'inside', xAxisIndex: [0], start: 0, end: 100 }
                    ],
                    grid: { left: 40, right: 10, bottom: 20, top: 10, containLabel: false },
                    yAxis: [{ 
                        type: 'value', 
                        position: 'left', 
                        splitLine: { lineStyle: { color: '#1e293b' } }, 
                        axisLabel: { color: '#64748b', fontSize: 9 } 
                    }],
                    xAxis: { 
                        type: 'category', 
                        boundaryGap: false, 
                        axisLine: { lineStyle: { color: '#334155' } }, 
                        axisLabel: { color: '#64748b', fontSize: 9 }, 
                        data: [] 
                    },
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
        }, [exitZoomMode]);

        useEffect(() => {
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
                        name: t ? t(config.labelKey) : config.key, 
                        type: 'line',
                        smooth: true,
                        symbol: 'none',
                        yAxisIndex: config.yAxisIndex,
                        data: fullData.map(item => item[config.key]),
                        lineStyle: { color: config.color, width: 2 },
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
            };

            let renderTimer;
            if (!isPaused) {
                const fpsNum = Number.isFinite(Number(fps)) ? Number(fps) : 60; // Mobile lower FPS default
                const clampedFps = Math.min(60, Math.max(5, fpsNum));
                const intervalMs = Math.max(16, Math.round(1000 / clampedFps));
                renderTimer = setInterval(renderFrame, intervalMs);
            } else {
                renderFrame();
            }

            return () => {
                if (renderTimer) clearInterval(renderTimer);
            };

        }, [isPaused, activeKeys, fps, t, dataRef]);

        const toggleChannel = (key) => {
            const newSet = new Set(activeKeys);
            if (newSet.has(key)) newSet.delete(key); else newSet.add(key);
            setActiveKeys(newSet);
        };

        const handleClear = () => {
            if(dataRef) dataRef.current = [];
            if(echartsInstance.current) echartsInstance.current.setOption({ xAxis: { data: [] }, series: [] });
            setHudData({ batL: 0, batR: 0, heading: 0 });
        };

        return (
            <div className="flex flex-col h-full w-full bg-slate-950">
                {/* 顶部控制栏 - 优化为横向滚动 */}
                <div className="flex items-center gap-2 p-2 border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm overflow-x-auto scrollbar-hide shrink-0">
                    <div className="flex gap-2">
                         {CHART_CONFIG.map(config => {
                            const isActive = activeKeys.has(config.key);
                            const value = hudData[config.key] !== undefined ? hudData[config.key] : 0;
                            return (
                                <button 
                                    key={config.key} 
                                    onClick={() => toggleChannel(config.key)} 
                                    className={`flex flex-col items-center px-3 py-1.5 rounded border transition-all min-w-[70px] ${isActive ? 'bg-slate-800 border-slate-600' : 'bg-slate-900 border-slate-800 opacity-60'}`}
                                    style={{ borderColor: isActive ? config.color : undefined }}
                                >
                                    <span className="text-[9px] text-slate-400 font-bold uppercase" style={{ color: isActive ? config.color : undefined }}>{config.key}</span>
                                    <span className="text-sm font-mono font-bold text-white">
                                        {typeof value === 'number' ? value.toFixed(1) : value}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                    
                    <div className="w-px h-8 bg-slate-800 shrink-0"></div>

                    <div className="flex items-center gap-1">
                        <button onClick={() => setIsPaused(!isPaused)} className={`p-2 rounded border ${isPaused ? 'bg-yellow-500/20 border-yellow-500 text-yellow-400' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
                            {isPaused ? <span className="text-[10px] font-bold">PLAY</span> : <span className="text-[10px] font-bold">PAUSE</span>}
                        </button>
                        <button onClick={handleClear} className="p-2 rounded border border-slate-700 bg-slate-800 text-slate-400">
                             <span className="text-[10px] font-bold">CLR</span>
                        </button>
                    </div>
                </div>

                {/* 图表区域 */}
                <div className="flex-1 relative min-h-0 w-full">
                    <div ref={chartRef} className="absolute inset-0 w-full h-full"></div>
                    {(isPaused || isZoomMode) && (
                        <div className="absolute top-2 right-2 px-2 py-1 rounded bg-black/50 backdrop-blur text-[10px] font-bold text-yellow-500 border border-yellow-500/30 pointer-events-none">
                            {isZoomMode ? "ZOOM MODE" : "PAUSED"}
                        </div>
                    )}
                </div>
            </div>
        );
    });

    window.MobileComponents = window.MobileComponents || {};
    window.MobileComponents.EmbeddedChart = EmbeddedChart;
})();
