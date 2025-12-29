// js/components/ChartModal.js
const { useEffect, useRef, useState } = React;

function ChartModal({ isOpen, onClose, data, onClear, t }) {
    const chartRef = useRef(null);
    const echartsInstance = useRef(null);

    // === 新增状态 ===
    const [isPaused, setIsPaused] = useState(false);
    // 记录每条曲线的显示/隐藏状态
    const [legendState, setLegendState] = useState({ 'Battery L': true, 'Battery R': true });

    // 获取最新的一帧数据用于顶部大字显示 (如果 data 为空则显示 0)
    const currentData = data && data.length > 0 ? data[data.length - 1] : { batL: 0, batR: 0 };

    // 1. 初始化 ECharts 实例
    useEffect(() => {
        if (!isOpen || !chartRef.current || !window.echarts) return;

        if (!echartsInstance.current) {
            echartsInstance.current = window.echarts.init(chartRef.current, 'dark', {
                renderer: 'canvas'
            });
        }

        const handleResize = () => {
            if (echartsInstance.current) echartsInstance.current.resize();
        };
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            if (echartsInstance.current) {
                echartsInstance.current.dispose();
                echartsInstance.current = null;
            }
        };
    }, [isOpen]);

    // 2. 更新图表数据 (核心逻辑：加入暂停判断)
    useEffect(() => {
        if (!echartsInstance.current || !data) return;

        // === 关键点：如果处于暂停状态，直接返回，不更新图表 ===
        if (isPaused) return;

        const option = {
            backgroundColor: 'transparent',
            tooltip: {
                trigger: 'axis',
                axisPointer: { type: 'cross' }
            },
            // 隐藏 ECharts 原生图例，改用顶部 HTML 按钮控制
            legend: {
                show: false,
                data: ['Battery L', 'Battery R']
            },
            grid: {
                left: '3%', right: '4%', bottom: '15%', top: '10%', // 调整边距适配布局
                containLabel: true
            },
            dataZoom: [
                {
                    type: 'slider', show: true, xAxisIndex: [0], start: 0, end: 100,
                    textStyle: { color: '#94a3b8' }, borderColor: '#334155', height: 25
                },
                {
                    type: 'inside', xAxisIndex: [0], start: 0, end: 100
                }
            ],
            xAxis: {
                type: 'category',
                boundaryGap: false,
                data: data.map(item => item.time),
                axisLine: { lineStyle: { color: '#475569' } },
                axisLabel: { 
                    color: '#94a3b8',
                    hideOverlap: true, // 防止横轴时间文字重叠
                    formatter: (value) => value.split(' ').pop() // 只显示时间部分
                }
            },
            yAxis: {
                type: 'value',
                name: 'Voltage (V)',
                // 动态调整 Y 轴范围，让微小的电压波动看起来更明显
                min: (value) => Math.floor(value.min - 1),
                max: (value) => Math.ceil(value.max + 1),
                splitLine: { lineStyle: { color: '#1e293b' } },
                axisLine: { lineStyle: { color: '#475569' } },
                axisLabel: { color: '#94a3b8' }
            },
            series: [
                {
                    name: 'Battery L',
                    type: 'line',
                    smooth: true,
                    symbol: 'none',
                    data: data.map(item => item.batL),
                    lineStyle: { color: '#06b6d4', width: 2 },
                    areaStyle: {
                        color: new window.echarts.graphic.LinearGradient(0, 0, 0, 1, [
                            { offset: 0, color: 'rgba(6, 182, 212, 0.3)' },
                            { offset: 1, color: 'rgba(6, 182, 212, 0.01)' }
                        ])
                    }
                },
                {
                    name: 'Battery R',
                    type: 'line',
                    smooth: true,
                    symbol: 'none',
                    data: data.map(item => item.batR),
                    lineStyle: { color: '#f59e0b', width: 2 }, // 橙色
                    areaStyle: {
                        color: new window.echarts.graphic.LinearGradient(0, 0, 0, 1, [
                            { offset: 0, color: 'rgba(245, 158, 11, 0.3)' },
                            { offset: 1, color: 'rgba(245, 158, 11, 0.01)' }
                        ])
                    }
                }
            ]
        };

        echartsInstance.current.setOption(option);
    }, [data, isOpen, isPaused]); // 依赖项包含 isPaused

    // === 切换曲线显示/隐藏 ===
    const toggleSeries = (name) => {
        if (!echartsInstance.current) return;
        echartsInstance.current.dispatchAction({
            type: 'legendToggleSelect',
            name: name
        });
        setLegendState(prev => ({ ...prev, [name]: !prev[name] }));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
            <div className="w-[95%] h-[90%] bg-slate-900 border border-slate-700 rounded-lg shadow-2xl flex flex-col relative overflow-hidden">
                
                {/* === Header (集成 HUD 和 控制器) === */}
                <div className="h-20 bg-slate-800/80 border-b border-slate-700 flex items-center justify-between px-6 shrink-0 backdrop-blur">
                    
                    {/* 左侧：标题与暂停按钮 */}
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                            <Icons.Activity className="w-5 h-5 text-cyan-400" />
                            <span className="font-bold text-slate-200 tracking-wider text-lg">{t ? t('chart_title') : 'DATA CHART'}</span>
                        </div>
                        
                        {/* === 暂停按钮 === */}
                        <button 
                            onClick={() => setIsPaused(!isPaused)}
                            className={`flex items-center justify-center gap-2 px-6 py-1 rounded-full text-xs font-bold border transition-all ${
                                isPaused 
                                ? 'bg-yellow-500/20 border-yellow-500 text-yellow-400 animate-pulse' 
                                : 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600'
                            }`}
                        >
                            {isPaused ? <span>⏸ 已暂停 (PAUSED)</span> : <span>▶ 实时监控中 (LIVE)</span>}
                        </button>
                    </div>

                    {/* 中间：HUD 实时数值 (点击可切换图例) === */}
                    <div className="flex gap-4">
                        {/* Battery L Card */}
                        <button 
                            onClick={() => toggleSeries('Battery L')}
                            className={`flex flex-col items-center px-6 py-2 rounded border transition-all min-w-[120px] ${
                                legendState['Battery L'] 
                                ? 'bg-cyan-900/20 border-cyan-500/50 hover:bg-cyan-900/30' 
                                : 'bg-slate-800 border-slate-700 opacity-40 grayscale'
                            }`}
                        >
                            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Battery L</span>
                            <span className={`text-2xl font-black font-mono ${legendState['Battery L'] ? 'text-cyan-400' : 'text-slate-500'}`}>
                                {currentData.batL.toFixed(1)} <span className="text-xs">V</span>
                            </span>
                        </button>

                        {/* Battery R Card */}
                        <button 
                            onClick={() => toggleSeries('Battery R')}
                            className={`flex flex-col items-center px-6 py-2 rounded border transition-all min-w-[120px] ${
                                legendState['Battery R'] 
                                ? 'bg-amber-900/20 border-amber-500/50 hover:bg-amber-900/30' 
                                : 'bg-slate-800 border-slate-700 opacity-40 grayscale'
                            }`}
                        >
                            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Battery R</span>
                            <span className={`text-2xl font-black font-mono ${legendState['Battery R'] ? 'text-amber-400' : 'text-slate-500'}`}>
                                {currentData.batR.toFixed(1)} <span className="text-xs">V</span>
                            </span>
                        </button>
                    </div>
                    
                    {/* 右侧：操作按钮 */}
                    <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-500 font-mono mr-2">
                            {data ? data.length : 0} POINTS
                        </span>
                        
                        <div className="h-6 w-[1px] bg-slate-700"></div>

                        <button 
                            onClick={onClear}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-red-900/30 border border-slate-700 hover:border-red-500/50 text-slate-400 hover:text-red-400 rounded text-xs transition-all group"
                        >
                            <Icons.Trash className="w-3.5 h-3.5" />
                            <span>{t ? t('chart_clear') : "Clear"}</span>
                        </button>

                        <button 
                            onClick={onClose}
                            className="p-2 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition-colors"
                        >
                            <Icons.X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Chart Area */}
                <div className="flex-1 relative bg-slate-950/50 w-full h-full p-2">
                    <div ref={chartRef} className="w-full h-full"></div>
                    
                    {/* 暂停状态下的屏幕中央提示 */}
                    {isPaused && (
                        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-yellow-500/10 border border-yellow-500/30 text-yellow-500 px-4 py-1 rounded-full text-xs font-bold pointer-events-none backdrop-blur-sm">
                            ⚠️ 图表已暂停 - 现在可以滚动鼠标缩放分析
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}