// js/components/ChartModal.js
const { useEffect, useRef } = React;

function ChartModal({ isOpen, onClose, data, onClear, t }) {
    const chartRef = useRef(null);
    const echartsInstance = useRef(null);

    // 1. 初始化和销毁 ECharts 实例
    useEffect(() => {
        if (!isOpen || !chartRef.current || !window.echarts) return;

        // 初始化
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

    // 2. 更新图表数据
    useEffect(() => {
        if (!echartsInstance.current || !data) return;

        const option = {
            backgroundColor: 'transparent',
            tooltip: {
                trigger: 'axis',
                axisPointer: { type: 'cross' }
            },
            legend: {
                data: ['Battery L', 'Battery R'],
                textStyle: { color: '#94a3b8' },
                top: 10
            },
            grid: {
                left: '3%',
                right: '4%',
                bottom: '15%',
                top: '15%',
                containLabel: true
            },
            dataZoom: [
                {
                    type: 'slider',
                    show: true,
                    xAxisIndex: [0],
                    start: 0,
                    end: 100,
                    textStyle: { color: '#94a3b8' },
                    borderColor: '#334155'
                },
                {
                    type: 'inside',
                    xAxisIndex: [0],
                    start: 0,
                    end: 100
                }
            ],
            xAxis: {
                type: 'category',
                boundaryGap: false,
                data: data.map(item => item.time),
                axisLine: { lineStyle: { color: '#475569' } },
                axisLabel: { color: '#94a3b8' }
            },
            yAxis: {
                type: 'value',
                name: 'Voltage (V)',
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
                    lineStyle: { color: '#f59e0b', width: 2 },
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
    }, [data, isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
            <div className="w-[90%] h-[80%] bg-slate-900 border border-slate-700 rounded-lg shadow-2xl flex flex-col relative overflow-hidden">
                {/* Header */}
                <div className="h-12 bg-slate-800/50 border-b border-slate-700 flex items-center justify-between px-4 shrink-0">
                    <div className="flex items-center gap-2">
                        <Icons.Activity className="w-5 h-5 text-cyan-400" />
                        <span className="font-bold text-slate-200 tracking-wider">{t ? t('chart_title') : 'DATA CHART'}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={onClear}
                            className="flex items-center gap-1 px-3 py-1 bg-slate-800 hover:bg-red-900/30 border border-slate-700 hover:border-red-500/50 text-slate-400 hover:text-red-400 rounded text-xs transition-all group"
                        >
                            <Icons.Trash className="w-3.5 h-3.5" />
                            <span>{t ? t('chart_clear') : "Clear"}</span>
                        </button>

                        <div className="w-[1px] h-4 bg-slate-700 mx-2"></div>

                        <button 
                            onClick={onClose}
                            className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors"
                        >
                            <Icons.X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Chart Area */}
                <div className="flex-1 relative bg-slate-950/50">
                    <div ref={chartRef} className="w-full h-full"></div>
                </div>
                
                {/* Footer */}
                <div className="h-6 bg-slate-900 border-t border-slate-800 flex items-center px-4 text-[10px] text-slate-500 gap-4">
                    <span>{t ? t('chart_status') : 'RECORDING...'}</span>
                    <span>POINTS: {data ? data.length : 0}</span>
                    <span className="ml-auto">{t ? t('chart_zoom_hint') : 'SCROLL TO ZOOM'}</span>
                </div>
            </div>
        </div>
    );
}