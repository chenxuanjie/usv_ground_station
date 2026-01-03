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
        const [isFullscreen, setIsFullscreen] = useState(false);
        const [zoomPoints, setZoomPoints] = useState(300);
        
        const isZoomModeRef = useRef(false); 
        const zoomLockRef = useRef(false);
        const isInteractingRef = useRef(false);
        const lastMousePosRef = useRef(null);
        const lastAppliedZoomRef = useRef({ points: 300, len: 0 });
        
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

        const applyTimeZoom = useCallback((nextPoints, dataLen) => {
            if (!echartsInstance.current) return;
            const len = Number.isFinite(Number(dataLen)) ? Number(dataLen) : 0;
            const points = Math.max(50, Math.min(600, Math.round(Number(nextPoints) || 300)));
            const percent = len > 0 ? Math.min(100, Math.max(1, (points / len) * 100)) : 100;
            const start = Math.max(0, 100 - percent);
            echartsInstance.current.dispatchAction({
                type: 'dataZoom',
                start,
                end: 100
            });
        }, []);

        useEffect(() => {
            if (!echartsInstance.current) return;
            const timer = setTimeout(() => {
                if (echartsInstance.current) echartsInstance.current.resize();
            }, 80);
            return () => clearTimeout(timer);
        }, [isFullscreen]);

        useEffect(() => {
            const prev = document.body.style.overflow;
            if (isFullscreen) document.body.style.overflow = 'hidden';
            return () => {
                document.body.style.overflow = prev;
            };
        }, [isFullscreen]);

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
                applyTimeZoom(zoomPoints, (dataRef && dataRef.current && Array.isArray(dataRef.current)) ? dataRef.current.length : 0);
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
        }, [exitZoomMode, applyTimeZoom]);

        useEffect(() => {
            const len = dataRef && dataRef.current && Array.isArray(dataRef.current) ? dataRef.current.length : 0;
            applyTimeZoom(zoomPoints, len);
        }, [applyTimeZoom, dataRef, zoomPoints]);

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

                const nextLen = fullData.length;
                const applied = lastAppliedZoomRef.current;
                if (applied.points !== zoomPoints || applied.len !== nextLen) {
                    applyTimeZoom(zoomPoints, nextLen);
                    lastAppliedZoomRef.current = { points: zoomPoints, len: nextLen };
                }
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

        }, [isPaused, activeKeys, fps, t, dataRef, zoomPoints, applyTimeZoom]);

        const toggleChannel = (key) => {
            const newSet = new Set(activeKeys);
            if (newSet.has(key)) newSet.delete(key); else newSet.add(key);
            setActiveKeys(newSet);
        };

        const handleClear = () => {
            if(dataRef) dataRef.current = [];
            if(echartsInstance.current) echartsInstance.current.setOption({ xAxis: { data: [] }, series: [] });
            setHudData({ batL: 0, batR: 0, heading: 0 });
            setZoomPoints(300);
            lastAppliedZoomRef.current = { points: 300, len: 0 };
            applyTimeZoom(300, 0);
        };

        return (
            <div className="w-full h-full bg-[#F2F2F7] text-gray-900 overflow-y-auto">
                <style>{`
                    .embedded-canvas-container {
                        position: relative;
                        height: 280px;
                        width: 100%;
                        background-color: #ffffff;
                        border-radius: 16px;
                        overflow: hidden;
                        box-shadow: 0 4px 12px rgba(0,0,0,0.05);
                        transition: all 0.3s ease-in-out;
                    }
                    .embedded-canvas-container.fullscreen-active {
                        position: fixed;
                        z-index: 9999;
                        top: 0;
                        left: 0;
                        border-radius: 0;
                        margin: 0;
                        box-shadow: none;
                        background-color: #ffffff;
                    }
                    @media (orientation: portrait) {
                        .embedded-canvas-container.fullscreen-active {
                            width: 100vh;
                            height: 100vw;
                            transform-origin: top left;
                            transform: rotate(90deg) translateY(-100%);
                            left: 100vw;
                            top: 0;
                        }
                    }
                    @media (orientation: landscape) {
                        .embedded-canvas-container.fullscreen-active {
                            width: 100vw;
                            height: 100vh;
                        }
                    }

                    .embedded-controls input[type=range] {
                        -webkit-appearance: none;
                        width: 100%;
                        background: transparent;
                    }
                    .embedded-controls input[type=range]::-webkit-slider-thumb {
                        -webkit-appearance: none;
                        height: 28px;
                        width: 28px;
                        border-radius: 50%;
                        background: #ffffff;
                        box-shadow: 0 2px 6px rgba(0,0,0,0.2);
                        margin-top: -12px;
                        cursor: pointer;
                    }
                    .embedded-controls input[type=range]::-webkit-slider-runnable-track {
                        width: 100%;
                        height: 4px;
                        cursor: pointer;
                        background: #E5E5EA;
                        border-radius: 2px;
                    }
                `}</style>

                <main className="max-w-md mx-auto px-4 py-4 space-y-4">
                    <section className={`embedded-canvas-container relative group ${isFullscreen ? 'fullscreen-active' : ''}`}>
                        <div
                            className="absolute inset-0 pointer-events-none opacity-20"
                            style={{
                                backgroundImage: 'linear-gradient(#007AFF 1px, transparent 1px), linear-gradient(90deg, #007AFF 1px, transparent 1px)',
                                backgroundSize: '20px 20px'
                            }}
                        ></div>

                        <div ref={chartRef} className="absolute inset-0 w-full h-full"></div>

                        <div className="absolute top-3 right-12 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full shadow-sm border border-gray-100 z-10 pointer-events-none">
                            <span className="text-xs text-gray-400 mr-1">Hdg:</span>
                            <span className="font-mono text-blue-600 font-bold">{Number.isFinite(Number(hudData.heading)) ? Number(hudData.heading).toFixed(0) : 0}</span>
                            <span className="text-xs text-gray-400">°</span>
                        </div>

                        <button
                            onClick={() => setIsFullscreen(v => !v)}
                            className="absolute top-2 right-2 p-2 bg-black/5 hover:bg-black/10 rounded-full text-gray-500 transition-colors z-20 backdrop-blur-sm"
                            aria-label="Toggle fullscreen"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${isFullscreen ? 'hidden' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                            </svg>
                            <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${isFullscreen ? '' : 'hidden'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </section>

                    <div className="grid grid-cols-3 gap-3">
                        <div className="bg-white p-3 rounded-2xl shadow-sm text-center">
                            <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">左电池</div>
                            <div className="flex items-end justify-center gap-0.5">
                                <div className="font-mono font-medium text-lg leading-none text-gray-800">{Number.isFinite(Number(hudData.batL)) ? Number(hudData.batL).toFixed(1) : '-'}</div>
                                <span className="text-[10px] text-gray-400 mb-0.5">V</span>
                            </div>
                        </div>
                        <div className="bg-white p-3 rounded-2xl shadow-sm text-center">
                            <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">右电池</div>
                            <div className="flex items-end justify-center gap-0.5">
                                <div className="font-mono font-medium text-lg leading-none text-gray-800">{Number.isFinite(Number(hudData.batR)) ? Number(hudData.batR).toFixed(1) : '-'}</div>
                                <span className="text-[10px] text-gray-400 mb-0.5">V</span>
                            </div>
                        </div>
                        <div className="bg-white p-3 rounded-2xl shadow-sm text-center">
                            <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">航向角</div>
                            <div className="flex items-end justify-center gap-0.5">
                                <div className="font-mono font-medium text-lg leading-none text-blue-600">{Number.isFinite(Number(hudData.heading)) ? Number(hudData.heading).toFixed(0) : '-'}</div>
                                <span className="text-[10px] text-gray-400 mb-0.5">°</span>
                            </div>
                        </div>
                    </div>

                    <section className="bg-white rounded-2xl shadow-sm overflow-hidden embedded-controls">
                        <div className="p-5 space-y-6">
                            <div>
                                <div className="flex justify-between mb-2 items-center">
                                    <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                                        </svg>
                                        {t ? t('chart_time_zoom') : '时间轴缩放'}
                                    </label>
                                    <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-500">{(300 / zoomPoints).toFixed(1)}x</span>
                                </div>
                                <input
                                    type="range"
                                    min="50"
                                    max="600"
                                    step="10"
                                    value={zoomPoints}
                                    onChange={(e) => {
                                        const next = Math.max(50, Math.min(600, Math.round(Number(e.target.value) || 300)));
                                        const len = dataRef && dataRef.current && Array.isArray(dataRef.current) ? dataRef.current.length : 0;
                                        setZoomPoints(next);
                                        lastAppliedZoomRef.current = { points: next, len };
                                        applyTimeZoom(next, len);
                                    }}
                                    className="w-full"
                                />
                                <div className="flex justify-between text-[10px] text-gray-400 mt-1 px-1">
                                    <span>缩小 (更多数据)</span>
                                    <span>放大 (细节)</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-2">
                                <button
                                    onClick={() => setIsPaused(v => !v)}
                                    className="w-full bg-gray-100 active:bg-gray-200 text-blue-600 font-semibold py-3 rounded-xl transition-colors"
                                >
                                    {isPaused ? (t ? t('chart_resume_show') : '继续显示') : (t ? t('chart_pause_show') : '暂停显示')}
                                </button>
                                <button
                                    onClick={handleClear}
                                    className="w-full bg-red-50 active:bg-red-100 text-red-500 font-semibold py-3 rounded-xl transition-colors"
                                >
                                    {t ? t('chart_clear') : '清空数据'}
                                </button>
                            </div>
                        </div>
                    </section>
                </main>
            </div>
        );
    });

    window.MobileComponents = window.MobileComponents || {};
    window.MobileComponents.EmbeddedChart = EmbeddedChart;
})();
