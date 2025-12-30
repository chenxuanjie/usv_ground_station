// js/components/ChartModal.js
const { useEffect, useRef, useState } = React;

// ====================================================================
// 1. 核心配置区域
// ====================================================================
const CHART_CONFIG = [
    { key: 'batL', label: 'BAT L', color: '#06b6d4', unit: 'V', yAxisIndex: 0 },
    { key: 'batR', label: 'BAT R', color: '#10b981', unit: 'V', yAxisIndex: 0 },
    { key: 'heading', label: 'HEADING', color: '#a855f7', unit: '°', yAxisIndex: 1 }
];

function ChartModalComponent({ isOpen, onClose, dataRef, onClear, t }) {
    const chartRef = useRef(null);
    const echartsInstance = useRef(null);
    const [isPaused, setIsPaused] = useState(false);
    
    // HUD 状态
    const [hudData, setHudData] = useState({ batL: 0, batR: 0, heading: 0 });
    const [activeKeys, setActiveKeys] = useState(new Set(CHART_CONFIG.map(c => c.key)));
    const lastHudUpdateRef = useRef(0);

    // 2. 初始化 ECharts (静态)
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
                // === 关键修改：开启轻量级动画，找回"丝滑感" ===
                animation: true,  
                animationDuration: 300, // 300ms 的过渡时间，既平滑又不拖沓
                animationEasing: 'cubicOut', // 缓动效果
                
                tooltip: {
                    trigger: 'axis',
                    axisPointer: { type: 'cross' },
                    confine: true,
                    backgroundColor: 'rgba(50, 50, 50, 0.9)',
                    textStyle: { color: '#fff' }
                },
                legend: { show: false },
                toolbox: {
                    show: true,
                    feature: {
                        dataZoom: { yAxisIndex: 'none', title: { zoom: '框选缩放', back: '复原' } },
                        saveAsImage: { title: '保存图片' }
                    },
                    iconStyle: { borderColor: '#94a3b8' },
                    right: 20
                },
                dataZoom: [
                    { type: 'slider', show: true, xAxisIndex: [0], start: 0, end: 100, height: 24, bottom: 10, borderColor: '#334155', textStyle: { color: '#94a3b8' }, handleStyle: { color: '#06b6d4' }, fillerColor: 'rgba(6, 182, 212, 0.1)' },
                    { type: 'inside', xAxisIndex: [0], start: 0, end: 100 }
                ],
                grid: { left: '3%', right: '4%', bottom: '15%', top: '15%', containLabel: true },
                yAxis: [
                    { type: 'value', position: 'left', splitLine: { lineStyle: { color: '#1e293b' } }, axisLabel: { color: '#94a3b8' } },
                    { type: 'value', position: 'right', splitLine: { show: false }, axisLabel: { color: '#94a3b8' }, min: 0, max: 360 }
                ],
                xAxis: { type: 'category', boundaryGap: false, axisLine: { lineStyle: { color: '#475569' } }, axisLabel: { color: '#94a3b8' }, data: [] },
                series: []
            };
            
            echartsInstance.current.setOption(baseOption);
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
    }, [isOpen]);

    // 3. 刷新循环 (配合动画，使用 50ms 左右的刷新率即可，太快了动画看不清)
    useEffect(() => {
        if (!isOpen || isPaused) return;

        const renderTimer = setInterval(() => {
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
                    name: config.label,
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
                yAxis: [
                    { min: (v) => Math.floor(v.min), max: (v) => Math.ceil(v.max) },
                    { min: 0, max: 360 }
                ],
                series: dynamicSeries
            }, { lazyUpdate: true, replaceMerge: ['series'] });

        }, 50); // 改为 50ms (20fps)，留出时间给动画展示

        return () => clearInterval(renderTimer);
    }, [isOpen, isPaused, activeKeys]);

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
                            <span className="font-bold text-slate-200 tracking-wider text-lg">DATA ANALYSIS</span>
                        </div>
                        <button onClick={() => setIsPaused(!isPaused)} className={`flex items-center justify-center gap-2 px-4 py-1 rounded-full text-xs font-bold border transition-all ${isPaused ? 'bg-yellow-500/20 border-yellow-500 text-yellow-400' : 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600'}`}>
                            {isPaused ? <span>▶ 继续 (Resume)</span> : <span>⏸ 暂停 (Pause)</span>}
                        </button>
                    </div>
                    <div className="flex flex-1 justify-center gap-3 overflow-x-auto px-2 scrollbar-hide">
                        {CHART_CONFIG.map(config => {
                            const isActive = activeKeys.has(config.key);
                            const baseStyle = isActive ? { borderColor: config.color, backgroundColor: config.color + '1A' } : { borderColor: '#334155', backgroundColor: '#1e293b' };
                            const textClass = isActive ? 'text-white' : 'text-slate-500';
                            const value = hudData[config.key] !== undefined ? hudData[config.key] : 0;
                            return (
                                <button key={config.key} onClick={() => toggleChannel(config.key)} onDoubleClick={() => soloChannel(config.key)} className={`flex flex-col items-center px-4 py-2 rounded border transition-all min-w-[100px] select-none hover:scale-105 active:scale-95 duration-200`} style={{ ...baseStyle, opacity: isActive ? 1 : 0.5, filter: isActive ? 'none' : 'grayscale(100%)' }} title="单击切换 / 双击独奏">
                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{config.label}</span>
                                    <span className={`text-xl font-black font-mono ${textClass}`} style={{ color: isActive ? config.color : undefined }}>
                                        {typeof value === 'number' ? value.toFixed(1) : value}
                                        <span className="text-xs ml-0.5 opacity-60">{config.unit}</span>
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                        <button onClick={() => setActiveKeys(new Set(CHART_CONFIG.map(c=>c.key)))} className="text-[10px] underline text-slate-500 hover:text-white mr-2">Reset View</button>
                        <button onClick={handleClear} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-red-900/30 border border-slate-700 hover:border-red-500/50 text-slate-400 hover:text-red-400 rounded text-xs transition-all">
                            <Icons.Trash className="w-3.5 h-3.5" /> <span>{t ? t('chart_clear') : "Clear"}</span>
                        </button>
                        <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition-colors"><Icons.X className="w-6 h-6" /></button>
                    </div>
                </div>
                <div className="flex-1 relative bg-slate-950/50 w-full h-full p-2">
                    <div ref={chartRef} className="w-full h-full"></div>
                    {isPaused && (
                        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-yellow-500/10 border border-yellow-500/30 text-yellow-500 px-4 py-1 rounded-full text-xs font-bold pointer-events-none backdrop-blur-sm">
                            ⚠️ PAUSED - SCROLL TO ZOOM & ANALYZE
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// React.memo 隔离
const ChartModal = React.memo(ChartModalComponent, (prev, next) => {
    return prev.isOpen === next.isOpen && prev.dataRef === next.dataRef;
});