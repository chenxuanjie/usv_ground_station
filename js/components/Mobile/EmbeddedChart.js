(function() {
    const { useEffect, useRef, useState, useCallback, memo } = React;

    const CHART_CONFIG_CYBER = [
        { key: 'batL', labelKey: 'chart_bat_l', color: '#06b6d4', unit: 'V', yAxisIndex: 0 },
        { key: 'batR', labelKey: 'chart_bat_r', color: '#10b981', unit: 'V', yAxisIndex: 0 },
        { key: 'heading', labelKey: 'chart_heading', color: '#a855f7', unit: '°', yAxisIndex: 0 }
    ];

    const CHART_CONFIG_IOS = [
        { key: 'batL', labelKey: 'chart_bat_l', color: '#007AFF', unit: 'V', yAxisIndex: 0 },
        { key: 'batR', labelKey: 'chart_bat_r', color: '#34C759', unit: 'V', yAxisIndex: 0 },
        { key: 'heading', labelKey: 'chart_heading', color: '#5856D6', unit: '°', yAxisIndex: 0 }
    ];

    const ActionIcons = {
        Save: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>,
        Zoom: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><path d="M8 11h6"/><path d="M11 8v6"/></svg>,
        Reset: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
    };

    const EmbeddedChart = memo(({ dataRef, fps, t, tcpStatus, persistedChannelExpanded, persistedChannelEnabled, onPersistConfig, uiStyle }) => {
        const ui = window.MobileUtils && typeof window.MobileUtils.getMobileTheme === 'function'
            ? window.MobileUtils.getMobileTheme(uiStyle)
            : null;
        const isIos = ui?.key === 'ios';
        const chartConfig = isIos ? CHART_CONFIG_IOS : CHART_CONFIG_CYBER;

        const chartRef = useRef(null);
        const chartCardRef = useRef(null);
        const echartsInstance = useRef(null);
        const echartsThemeKeyRef = useRef(null);
        
        const [isPaused, setIsPaused] = useState(false);
        const [isZoomMode, setIsZoomMode] = useState(false);
        const [isZoomLock, setIsZoomLock] = useState(false);
        const [isFullscreen, setIsFullscreen] = useState(false);
        const [zoomPoints, setZoomPoints] = useState(300);
        const [isChannelExpanded, setIsChannelExpanded] = useState(() => {
            if (typeof persistedChannelExpanded === 'boolean') return persistedChannelExpanded;
            try {
                const v = window.localStorage ? window.localStorage.getItem('embedded_channel_expanded') : null;
                if (v == null) return true;
                const s = String(v).trim().toLowerCase();
                return s === '1' || s === 'true' || s === 'yes' || s === 'on';
            } catch (_) {
                return true;
            }
        });
        const [isHudDragging, setIsHudDragging] = useState(false);
        const isPausedRef = useRef(isPaused);
        
        const isZoomModeRef = useRef(false); 
        const zoomLockRef = useRef(false);
        const isInteractingRef = useRef(false);
        const lastMousePosRef = useRef(null);
        const lastAppliedZoomRef = useRef({ points: 300, len: 0 });
        const zoomPointsRef = useRef(zoomPoints);
        const dataRefLive = useRef(dataRef);
        const chartViewportRef = useRef(null);
        const hudStripRef = useRef(null);
        const hudDragRef = useRef({ active: false, pointerId: null, startX: 0, startScrollLeft: 0 });
        
        const [hudData, setHudData] = useState({ batL: 0, batR: 0, heading: 0 });
        const [activeKeys, setActiveKeys] = useState(() => {
            const enabled = persistedChannelEnabled && typeof persistedChannelEnabled === 'object' ? persistedChannelEnabled : null;
            const s = new Set();
            if (enabled) {
                if (enabled.heading) s.add('heading');
                if (enabled.batL) s.add('batL');
                if (enabled.batR) s.add('batR');
                return s;
            }
            try {
                const readFlag = (k) => {
                    const v = window.localStorage ? window.localStorage.getItem(k) : null;
                    if (v == null) return null;
                    const t = String(v).trim().toLowerCase();
                    return t === '1' || t === 'true' || t === 'yes' || t === 'on';
                };
                const hdg = readFlag('embedded_channel_enabled_heading');
                const bl = readFlag('embedded_channel_enabled_batL');
                const br = readFlag('embedded_channel_enabled_batR');
                if (hdg) s.add('heading');
                if (bl) s.add('batL');
                if (br) s.add('batR');
            } catch (_) {}
            return s;
        });
        const lastHudUpdateRef = useRef(0);
        const [axisTicks, setAxisTicks] = useState({ y: [], x: [] });
        const axisTicksKeyRef = useRef('');
        const zoomWindowRef = useRef({ start: 0, end: 100 });
        const didApplyPersistedRef = useRef(false);
        const activeKeysRef = useRef(activeKeys);
        const isChannelExpandedRef = useRef(isChannelExpanded);

        const isConnected = tcpStatus === 'ONLINE';

        useEffect(() => {
            isPausedRef.current = isPaused;
        }, [isPaused]);

        useEffect(() => {
            activeKeysRef.current = activeKeys;
        }, [activeKeys]);

        useEffect(() => {
            isChannelExpandedRef.current = isChannelExpanded;
        }, [isChannelExpanded]);

        useEffect(() => {
            zoomPointsRef.current = zoomPoints;
        }, [zoomPoints]);

        useEffect(() => {
            dataRefLive.current = dataRef;
        }, [dataRef]);

        const computeEnabledFlags = useCallback((keys) => {
            return {
                heading: !!(keys && keys.has && keys.has('heading')),
                batL: !!(keys && keys.has && keys.has('batL')),
                batR: !!(keys && keys.has && keys.has('batR'))
            };
        }, []);

        useEffect(() => {
            if (didApplyPersistedRef.current) return;
            const hasExpanded = typeof persistedChannelExpanded === 'boolean';
            const hasEnabled = persistedChannelEnabled && typeof persistedChannelEnabled === 'object';
            if (hasExpanded) setIsChannelExpanded(!!persistedChannelExpanded);
            if (hasEnabled) {
                const s = new Set();
                if (persistedChannelEnabled.heading) s.add('heading');
                if (persistedChannelEnabled.batL) s.add('batL');
                if (persistedChannelEnabled.batR) s.add('batR');
                setActiveKeys(s);
            }

            if (!hasExpanded && !hasEnabled) {
                try {
                    const v = window.localStorage ? window.localStorage.getItem('embedded_channel_expanded') : null;
                    if (v != null) {
                        const s = String(v).trim().toLowerCase();
                        setIsChannelExpanded(s === '1' || s === 'true' || s === 'yes' || s === 'on');
                    }

                    const readFlag = (k) => {
                        const v = window.localStorage ? window.localStorage.getItem(k) : null;
                        if (v == null) return null;
                        const t = String(v).trim().toLowerCase();
                        return t === '1' || t === 'true' || t === 'yes' || t === 'on';
                    };
                    const hdg = readFlag('embedded_channel_enabled_heading');
                    const bl = readFlag('embedded_channel_enabled_batL');
                    const br = readFlag('embedded_channel_enabled_batR');
                    if (hdg != null || bl != null || br != null) {
                        const set2 = new Set();
                        if (hdg) set2.add('heading');
                        if (bl) set2.add('batL');
                        if (br) set2.add('batR');
                        setActiveKeys(set2);
                    }
                } catch (_) {}
            }
            didApplyPersistedRef.current = true;
        }, [persistedChannelExpanded, persistedChannelEnabled]);

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
            zoomWindowRef.current = { start, end: 100 };
        }, []);

        const syncEchartsSize = useCallback(() => {
            if (!echartsInstance.current || !chartViewportRef.current) return;
            const w = Math.round(chartViewportRef.current.clientWidth || 0);
            const h = Math.round(chartViewportRef.current.clientHeight || 0);
            if (w <= 0 || h <= 0) return;
            echartsInstance.current.resize({ width: w, height: h });
        }, []);

        const initEchartsIfNeeded = useCallback(() => {
            if (!chartRef.current || !window.echarts) return;

            const currentDom = chartRef.current;
            const existingDom = echartsInstance.current && typeof echartsInstance.current.getDom === 'function'
                ? echartsInstance.current.getDom()
                : null;

            const desiredThemeKey = isIos ? 'light' : 'dark';
            const shouldReinit = !!echartsInstance.current && (existingDom !== currentDom || echartsThemeKeyRef.current !== desiredThemeKey);
            if (!shouldReinit && echartsInstance.current && existingDom === currentDom) return;

            if (echartsInstance.current) {
                echartsInstance.current.dispose();
                echartsInstance.current = null;
            }

            const themeArg = isIos ? null : 'dark';
            echartsInstance.current = window.echarts.init(currentDom, themeArg, { renderer: 'canvas', devicePixelRatio: window.devicePixelRatio || 1 });
            echartsThemeKeyRef.current = desiredThemeKey;

            const baseOption = {
                backgroundColor: 'transparent',
                animation: false,
                hoverLayerThreshold: Infinity,
                toolbox: {
                    show: false,
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
                    backgroundColor: isIos ? 'rgba(255, 255, 255, 0.9)' : 'rgba(50, 50, 50, 0.9)',
                    borderColor: isIos ? 'rgba(148, 163, 184, 0.35)' : undefined,
                    borderWidth: isIos ? 1 : 0,
                    textStyle: { color: isIos ? '#0f172a' : '#fff', fontSize: 10 }
                },
                legend: { show: false },
                dataZoom: [
                    { type: 'inside', xAxisIndex: [0], start: 0, end: 100 }
                ],
                grid: { left: 0, right: 0, bottom: 0, top: 0, containLabel: false },
                yAxis: [{
                    type: 'value',
                    position: 'left',
                    splitLine: { lineStyle: { color: isIos ? 'rgba(148, 163, 184, 0.25)' : '#1e293b' } },
                    axisLabel: { show: false },
                    axisTick: { show: false },
                    axisLine: { lineStyle: { color: isIos ? 'rgba(148, 163, 184, 0.35)' : '#334155' } }
                }],
                xAxis: {
                    type: 'category',
                    boundaryGap: false,
                    axisLine: { lineStyle: { color: isIos ? 'rgba(148, 163, 184, 0.35)' : '#334155' } },
                    axisLabel: { show: false },
                    axisTick: { show: false },
                    data: []
                },
                series: []
            };

            echartsInstance.current.setOption(baseOption);

            const zr = echartsInstance.current.getZr();
            zr.on('mousemove', function(e) {
                lastMousePosRef.current = { x: e.offsetX, y: e.offsetY };
            });
            zr.on('mousedown', function() {
                isInteractingRef.current = true;
            });
            zr.on('mouseup', function() {
                setTimeout(() => { isInteractingRef.current = false; }, 100);
            });
            zr.on('globalout', function() {
                lastMousePosRef.current = null;
                isInteractingRef.current = false;
            });

            echartsInstance.current.on('dataZoom', () => {
                if (echartsInstance.current) {
                    const opt = echartsInstance.current.getOption && echartsInstance.current.getOption();
                    const dz = opt && opt.dataZoom && opt.dataZoom[0] ? opt.dataZoom[0] : null;
                    const start = dz && Number.isFinite(Number(dz.start)) ? Number(dz.start) : 0;
                    const end = dz && Number.isFinite(Number(dz.end)) ? Number(dz.end) : 100;
                    zoomWindowRef.current = { start, end };
                }
                if (isZoomModeRef.current && !zoomLockRef.current) {
                    exitZoomMode();
                }
            });

            syncEchartsSize();

            const liveRef = dataRefLive.current;
            const len = liveRef && liveRef.current && Array.isArray(liveRef.current) ? liveRef.current.length : 0;
            applyTimeZoom(zoomPointsRef.current, len);

            const tryRender = () => {
                if (!echartsInstance.current) return;
                const fn = renderChartFrameRef.current;
                if (isPausedRef.current && typeof fn === 'function') fn();
            };
            window.setTimeout(tryRender, 0);
            window.requestAnimationFrame(tryRender);
        }, [exitZoomMode, applyTimeZoom, isIos, syncEchartsSize]);

        useEffect(() => {
            if (!echartsInstance.current) return;
            let raf1 = 0;
            let raf2 = 0;
            const t1 = window.setTimeout(() => syncEchartsSize(), 60);
            const t2 = window.setTimeout(() => syncEchartsSize(), 180);
            const t3 = window.setTimeout(() => syncEchartsSize(), 420);

            raf1 = window.requestAnimationFrame(() => {
                raf2 = window.requestAnimationFrame(() => {
                    syncEchartsSize();
                });
            });

            const onResize = () => syncEchartsSize();
            window.addEventListener('resize', onResize);
            window.addEventListener('orientationchange', onResize);

            return () => {
                window.removeEventListener('resize', onResize);
                window.removeEventListener('orientationchange', onResize);
                window.cancelAnimationFrame(raf1);
                window.cancelAnimationFrame(raf2);
                window.clearTimeout(t1);
                window.clearTimeout(t2);
                window.clearTimeout(t3);
            };
        }, [isFullscreen, syncEchartsSize]);

        useEffect(() => {
            const prev = document.body.style.overflow;
            const prevHtml = document.documentElement.style.overflow;
            if (isFullscreen) {
                document.body.style.overflow = 'hidden';
                document.documentElement.style.overflow = 'hidden';
            }
            return () => {
                document.body.style.overflow = prev;
                document.documentElement.style.overflow = prevHtml;
            };
        }, [isFullscreen]);

        useEffect(() => {
            let raf1 = 0;
            let raf2 = 0;
            const t1 = window.setTimeout(() => initEchartsIfNeeded(), 50);
            const t2 = window.setTimeout(() => initEchartsIfNeeded(), 180);

            raf1 = window.requestAnimationFrame(() => {
                raf2 = window.requestAnimationFrame(() => {
                    initEchartsIfNeeded();
                });
            });

            const handleResize = () => syncEchartsSize();
            window.addEventListener('resize', handleResize);

            return () => {
                window.clearTimeout(t1);
                window.clearTimeout(t2);
                window.cancelAnimationFrame(raf1);
                window.cancelAnimationFrame(raf2);
                window.removeEventListener('resize', handleResize);
                if (echartsInstance.current) {
                    echartsInstance.current.dispose();
                    echartsInstance.current = null;
                }
            };
        }, [initEchartsIfNeeded, syncEchartsSize]);

        useEffect(() => {
            let raf1 = 0;
            let raf2 = 0;
            const t1 = window.setTimeout(() => initEchartsIfNeeded(), 60);
            const t2 = window.setTimeout(() => initEchartsIfNeeded(), 200);
            const t3 = window.setTimeout(() => initEchartsIfNeeded(), 460);

            raf1 = window.requestAnimationFrame(() => {
                raf2 = window.requestAnimationFrame(() => {
                    initEchartsIfNeeded();
                });
            });

            return () => {
                window.clearTimeout(t1);
                window.clearTimeout(t2);
                window.clearTimeout(t3);
                window.cancelAnimationFrame(raf1);
                window.cancelAnimationFrame(raf2);
            };
        }, [isFullscreen, initEchartsIfNeeded]);

        useEffect(() => {
            const len = dataRef && dataRef.current && Array.isArray(dataRef.current) ? dataRef.current.length : 0;
            applyTimeZoom(zoomPoints, len);
        }, [applyTimeZoom, dataRef, zoomPoints]);

        const renderChartFrame = useCallback(() => {
            if (isZoomModeRef.current || isInteractingRef.current) return;

            if (!echartsInstance.current || !dataRef || !dataRef.current) return;
            const fullData = dataRef.current;
            if (fullData.length === 0) return;

            const now = Date.now();
            if (now - lastHudUpdateRef.current > 100) {
                setHudData(fullData[fullData.length - 1]);
                lastHudUpdateRef.current = now;
            }

            const activeSeriesKeys = [];
            for (let i = 0; i < chartConfig.length; i++) {
                const key = chartConfig[i].key;
                if (activeKeys.has(key)) activeSeriesKeys.push(key);
            }

            let yMin = Infinity;
            let yMax = -Infinity;
            for (let i = 0; i < fullData.length; i++) {
                const row = fullData[i];
                for (let k = 0; k < activeSeriesKeys.length; k++) {
                    const v = Number(row[activeSeriesKeys[k]]);
                    if (!Number.isFinite(v)) continue;
                    if (v < yMin) yMin = v;
                    if (v > yMax) yMax = v;
                }
            }
            if (yMin === Infinity || yMax === -Infinity) return;

            const centerZero = yMin < 0 && yMax > 0;
            const span = Math.max(1e-6, yMax - yMin);
            const pad = span * 0.08;

            let nextMin = yMin - pad;
            let nextMax = yMax + pad;
            if (centerZero) {
                const absMax = Math.max(Math.abs(yMin), Math.abs(yMax));
                const lim = absMax + Math.max(absMax * 0.08, 1e-6);
                nextMin = -lim;
                nextMax = lim;
            }

            const rangeForStep = nextMax - nextMin;
            const step = rangeForStep <= 5 ? 0.1 : (rangeForStep <= 50 ? 1 : 5);
            const niceMin = Math.floor(nextMin / step) * step;
            const niceMax = Math.ceil(nextMax / step) * step;

            const yTickCount = 5;
            const ySpan = Math.max(1e-9, niceMax - niceMin);
            const yDecimals = ySpan <= 5 ? 1 : 0;
            const nextYTicks = [];
            for (let i = 0; i < yTickCount; i++) {
                const v = niceMax - (ySpan * i) / (yTickCount - 1);
                nextYTicks.push(Number(v).toFixed(yDecimals));
            }

            const len = fullData.length;
            const dz = zoomWindowRef.current || { start: 0, end: 100 };
            const a = Math.max(0, Math.min(len - 1, Math.floor(((Number(dz.start) || 0) / 100) * (len - 1))));
            const b = Math.max(0, Math.min(len - 1, Math.floor(((Number(dz.end) || 100) / 100) * (len - 1))));
            const left = Math.min(a, b);
            const right = Math.max(a, b);

            const xTickCount = 4;
            const nextXTicks = [];
            for (let i = 0; i < xTickCount; i++) {
                const idx = Math.round(left + ((right - left) * i) / (xTickCount - 1));
                const tRaw = fullData[idx] && fullData[idx].time ? String(fullData[idx].time) : '';
                nextXTicks.push(tRaw ? tRaw.split(' ').pop() : '');
            }

            const nextAxisKey = nextYTicks.join('|') + '~~' + nextXTicks.join('|');
            if (nextAxisKey !== axisTicksKeyRef.current) {
                axisTicksKeyRef.current = nextAxisKey;
                setAxisTicks({ y: nextYTicks, x: nextXTicks });
            }

            const zeroLine = centerZero ? {
                silent: true,
                symbol: 'none',
                label: { show: false },
                lineStyle: { color: isIos ? 'rgba(148, 163, 184, 0.75)' : '#475569', type: 'dashed', width: 1 },
                data: [{ yAxis: 0 }]
            } : null;

            const dynamicSeries = chartConfig.map(config => {
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
                    } : null,
                    markLine: zeroLine
                };
            }).filter(s => s !== null);

            echartsInstance.current.setOption({
                xAxis: { data: fullData.map(item => item.time) },
                yAxis: [{ min: niceMin, max: niceMax }],
                series: dynamicSeries
            }, { lazyUpdate: false, replaceMerge: ['series'] });

            const nextLen = fullData.length;
            const applied = lastAppliedZoomRef.current;
            if (applied.points !== zoomPoints || applied.len !== nextLen) {
                applyTimeZoom(zoomPoints, nextLen);
                lastAppliedZoomRef.current = { points: zoomPoints, len: nextLen };
            }
        }, [activeKeys, chartConfig, isIos, t, dataRef, zoomPoints, applyTimeZoom]);

        const renderChartFrameRef = useRef(renderChartFrame);
        useEffect(() => {
            renderChartFrameRef.current = renderChartFrame;
        }, [renderChartFrame]);

        useEffect(() => {
            let renderTimer;
            if (!isPaused) {
                const fpsNum = Number.isFinite(Number(fps)) ? Number(fps) : 60; // Mobile lower FPS default
                const clampedFps = Math.min(60, Math.max(5, fpsNum));
                const intervalMs = Math.max(16, Math.round(1000 / clampedFps));
                renderTimer = setInterval(renderChartFrame, intervalMs);
            } else {
                renderChartFrame();
            }

            return () => {
                if (renderTimer) clearInterval(renderTimer);
            };

        }, [isPaused, fps, renderChartFrame]);

        const persistConfig = useCallback((nextExpanded, nextKeys) => {
            const expanded = !!nextExpanded;
            const enabled = computeEnabledFlags(nextKeys);
            try {
                if (window.localStorage) {
                    window.localStorage.setItem('embedded_channel_expanded', expanded ? '1' : '0');
                    window.localStorage.setItem('embedded_channel_enabled_heading', enabled.heading ? '1' : '0');
                    window.localStorage.setItem('embedded_channel_enabled_batL', enabled.batL ? '1' : '0');
                    window.localStorage.setItem('embedded_channel_enabled_batR', enabled.batR ? '1' : '0');
                }
            } catch (_) {}

            if (!onPersistConfig) return;
            onPersistConfig({ embeddedChannelExpanded: expanded, embeddedChannelEnabled: enabled });
        }, [computeEnabledFlags, onPersistConfig]);

        const toggleChannel = useCallback((key) => {
            didApplyPersistedRef.current = true;
            setActiveKeys((prev) => {
                const newSet = new Set(prev);
                if (newSet.has(key)) newSet.delete(key); else newSet.add(key);
                persistConfig(isChannelExpandedRef.current, newSet);
                return newSet;
            });
        }, [isChannelExpanded, persistConfig]);

        const toggleExpanded = useCallback(() => {
            didApplyPersistedRef.current = true;
            setIsChannelExpanded((prev) => {
                const next = !prev;
                persistConfig(next, activeKeysRef.current);
                return next;
            });
        }, [persistConfig]);

        const handleClear = () => {
            if(dataRef) dataRef.current = [];
            if(echartsInstance.current) echartsInstance.current.setOption({ xAxis: { data: [] }, series: [] });
            setHudData({ batL: 0, batR: 0, heading: 0 });
            setZoomPoints(300);
            lastAppliedZoomRef.current = { points: 300, len: 0 };
            applyTimeZoom(300, 0);
        };

        const onHudPointerDown = useCallback((e) => {
            if (e.pointerType === 'touch') return;
            if (e.button != null && e.button !== 0) return;
            const el = hudStripRef.current;
            if (!el) return;

            hudDragRef.current = {
                active: true,
                pointerId: e.pointerId,
                startX: e.clientX,
                startScrollLeft: el.scrollLeft
            };
            setIsHudDragging(true);
            try { el.setPointerCapture(e.pointerId); } catch (_) {}
        }, []);

        const onHudPointerMove = useCallback((e) => {
            const el = hudStripRef.current;
            const st = hudDragRef.current;
            if (!el || !st.active || st.pointerId !== e.pointerId) return;
            el.scrollLeft = st.startScrollLeft - (e.clientX - st.startX);
        }, []);

        const endHudDrag = useCallback((e) => {
            const el = hudStripRef.current;
            const st = hudDragRef.current;
            if (!st.active) return;
            if (e && st.pointerId != null && e.pointerId != null && st.pointerId !== e.pointerId) return;
            hudDragRef.current = { active: false, pointerId: null, startX: 0, startScrollLeft: 0 };
            setIsHudDragging(false);
            if (el && e && e.pointerId != null) {
                try { el.releasePointerCapture(e.pointerId); } catch (_) {}
            }
        }, []);

        const chartCard = (
            <section ref={chartCardRef} className={`embedded-canvas-container group ${isFullscreen ? 'embedded-fullscreen-card' : ''}`}>
                <div
                    ref={hudStripRef}
                    className={`flex-none flex items-center px-3 py-2 z-10 gap-2 overflow-x-auto embedded-no-scrollbar select-none ${
                        isIos
                            ? 'bg-white/70 backdrop-blur-xl border-b border-slate-200/60'
                            : 'bg-slate-900/50 backdrop-blur-md border-b border-slate-800'
                    } ${isHudDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
                    onPointerDown={onHudPointerDown}
                    onPointerMove={onHudPointerMove}
                    onPointerUp={endHudDrag}
                    onPointerCancel={endHudDrag}
                    onPointerLeave={endHudDrag}
                >
                    <div className={`flex-none w-28 flex flex-col items-center justify-center px-2 py-1.5 transition-all duration-300 border ${activeKeys.has('heading') ? '' : 'opacity-40'} ${
                        isIos
                            ? 'rounded-[18px] bg-[#5856D6]/10 border-[#5856D6]/15'
                            : 'bg-purple-900/10 rounded-lg border-purple-500/10'
                    }`}>
                        <span className={`${isIos ? 'text-[11px] font-semibold tracking-tight text-[#5856D6]' : 'text-[10px] text-purple-300 font-bold uppercase tracking-wider'} mb-0.5`}>{t ? t('heading') : 'HEADING'}</span>
                        <div className="flex items-baseline">
                            <span className={`font-mono text-sm font-bold ${isIos ? 'text-slate-900' : 'text-purple-200'}`}>{Number.isFinite(Number(hudData.heading)) ? Number(hudData.heading).toFixed(0) : 0}</span>
                            <span className={`${isIos ? 'text-[11px] text-[#5856D6]' : 'text-[10px] text-purple-300'} ml-0.5`}>°</span>
                        </div>
                    </div>

                    <div className={`flex-none w-28 flex flex-col items-center justify-center px-2 py-1.5 transition-all duration-300 border ${activeKeys.has('batL') ? '' : 'opacity-40'} ${
                        isIos
                            ? 'rounded-[18px] bg-[#007AFF]/10 border-[#007AFF]/15'
                            : 'bg-cyan-900/10 rounded-lg border-cyan-500/10'
                    }`}>
                        <span className={`${isIos ? 'text-[11px] font-semibold tracking-tight text-[#007AFF]' : 'text-[10px] text-cyan-300 font-bold uppercase tracking-wider'} mb-0.5`}>{t ? t('batL') : 'L. BAT'}</span>
                        <div className="flex items-baseline">
                            <span className={`font-mono text-sm font-bold ${isIos ? 'text-slate-900' : 'text-cyan-200'}`}>{Number.isFinite(Number(hudData.batL)) ? Number(hudData.batL).toFixed(1) : 0}</span>
                            <span className={`${isIos ? 'text-[11px] text-[#007AFF]' : 'text-[10px] text-cyan-300'} ml-0.5`}>V</span>
                        </div>
                    </div>

                    <div className={`flex-none w-28 flex flex-col items-center justify-center px-2 py-1.5 transition-all duration-300 border ${activeKeys.has('batR') ? '' : 'opacity-40'} ${
                        isIos
                            ? 'rounded-[18px] bg-[#34C759]/12 border-[#34C759]/18'
                            : 'bg-emerald-900/10 rounded-lg border-emerald-500/10'
                    }`}>
                        <span className={`${isIos ? 'text-[11px] font-semibold tracking-tight text-[#34C759]' : 'text-[10px] text-emerald-300 font-bold uppercase tracking-wider'} mb-0.5`}>{t ? t('batR') : 'R. BAT'}</span>
                        <div className="flex items-baseline">
                            <span className={`font-mono text-sm font-bold ${isIos ? 'text-slate-900' : 'text-emerald-200'}`}>{Number.isFinite(Number(hudData.batR)) ? Number(hudData.batR).toFixed(1) : 0}</span>
                            <span className={`${isIos ? 'text-[11px] text-[#34C759]' : 'text-[10px] text-emerald-300'} ml-0.5`}>V</span>
                        </div>
                    </div>

                    <div className="flex-none w-1"></div>
                </div>

                <div ref={chartViewportRef} className={`relative flex-1 w-full min-h-0 ${isIos ? 'bg-transparent' : 'bg-slate-950'}`}>
                    {!isIos && (
                        <div
                            className="absolute inset-0 pointer-events-none opacity-20"
                            style={{
                                backgroundImage: 'linear-gradient(rgba(34,211,238,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.8) 1px, transparent 1px)',
                                backgroundSize: '20px 20px'
                            }}
                        ></div>
                    )}

                    <div ref={chartRef} className="absolute inset-0 w-full h-full"></div>

                    <div className={`absolute left-0 top-0 bottom-6 w-12 pr-2 py-1 flex flex-col justify-between text-[10px] font-mono pointer-events-none ${
                        isIos ? 'text-slate-500 bg-gradient-to-r from-[#F2F2F7]/95 to-transparent' : 'text-slate-500 bg-gradient-to-r from-slate-950/80 to-transparent'
                    }`}>
                        {axisTicks.y.map((v, idx) => (
                            <div key={idx} className="leading-none text-right">{v}</div>
                        ))}
                    </div>

                    <div className={`absolute left-12 right-0 bottom-0 h-6 pl-1 pr-2 pb-1 flex items-end justify-between text-[10px] font-mono pointer-events-none ${
                        isIos ? 'text-slate-500 bg-gradient-to-t from-[#F2F2F7]/95 to-transparent' : 'text-slate-500 bg-gradient-to-t from-slate-950/80 to-transparent'
                    }`}>
                        {axisTicks.x.map((v, idx) => (
                            <div key={idx} className="leading-none">{v}</div>
                        ))}
                    </div>

                    <button
                        onClick={() => setIsFullscreen(v => !v)}
                        className={`absolute top-2 right-2 p-1.5 rounded-lg transition-colors z-20 shadow-sm border backdrop-blur-sm ${
                            isIos
                                ? 'bg-white/70 hover:bg-white/85 text-slate-700 border-white/60'
                                : 'bg-slate-950/60 hover:bg-slate-950/80 text-slate-200 border-slate-700'
                        }`}
                        aria-label={t ? t('toggle_fullscreen') : 'Toggle fullscreen'}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${isFullscreen ? 'hidden' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                        </svg>
                        <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${isFullscreen ? '' : 'hidden'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </section>
        );

        return (
            <div className={`w-full h-full overflow-hidden flex flex-col ${isIos ? 'bg-[#F2F2F7] text-slate-900 font-sans' : 'bg-slate-950 text-slate-200'}`}>
                <style>{`
                    .embedded-canvas-container {
                        display: flex;
                        flex-direction: column;
                        position: relative;
                        height: clamp(260px, 52vh, 620px);
                        width: 100%;
                        background-color: ${isIos ? 'rgba(255, 255, 255, 0.78)' : 'rgba(15, 23, 42, 0.55)'};
                        border-radius: ${isIos ? '22px' : '16px'};
                        overflow: hidden;
                        box-shadow: ${isIos ? '0 8px 30px rgba(0,0,0,0.10)' : '0 8px 24px rgba(0,0,0,0.35)'};
                        backdrop-filter: ${isIos ? 'blur(24px)' : 'none'};
                        -webkit-backdrop-filter: ${isIos ? 'blur(24px)' : 'none'};
                        transition: all 0.3s ease-in-out;
                        border: 1px solid ${isIos ? 'rgba(255, 255, 255, 0.6)' : 'rgba(51, 65, 85, 0.7)'};
                    }
                    .embedded-fullscreen-layer {
                        position: fixed;
                        inset: 0;
                        z-index: 99999;
                        background-color: ${isIos ? '#F2F2F7' : '#020617'};
                    }
                    .embedded-fullscreen-card {
                        position: absolute;
                        top: 50%;
                        left: 50%;
                        width: 100vw;
                        height: 100vh;
                        border-radius: 0;
                        margin: 0;
                        box-shadow: none;
                        border: 0;
                        background-color: ${isIos ? '#F2F2F7' : '#020617'};
                        transform-origin: center;
                        transform: translate(-50%, -50%);
                    }
                    @media (orientation: portrait) {
                        .embedded-fullscreen-card {
                            width: 100vh;
                            height: 100vw;
                            transform: translate(-50%, -50%) rotate(90deg);
                        }
                    }

                    .embedded-no-scrollbar::-webkit-scrollbar { display: none; }
                    .embedded-no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

                    .embedded-dropdown-content {
                        transition: max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease;
                        max-height: 0;
                        opacity: 0;
                        overflow-y: hidden;
                    }
                    .embedded-dropdown-content.expanded {
                        max-height: 200px;
                        opacity: 1;
                        overflow-y: auto;
                        -webkit-overflow-scrolling: touch;
                    }

                    .embedded-toggle-checkbox {
                        top: 0;
                        left: 0;
                    }
                    .embedded-toggle-checkbox:checked {
                        left: auto;
                        right: 0;
                        border-color: #22d3ee;
                    }
                    .embedded-toggle-checkbox:checked + .embedded-toggle-label {
                        background-color: rgba(34, 211, 238, 0.75);
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
                        background: ${isIos ? '#ffffff' : '#f8fafc'};
                        box-shadow: ${isIos ? '0 6px 18px rgba(0,0,0,0.18)' : '0 6px 18px rgba(0,0,0,0.45)'};
                        margin-top: -12px;
                        cursor: pointer;
                    }
                    .embedded-controls input[type=range]::-webkit-slider-runnable-track {
                        width: 100%;
                        height: 4px;
                        cursor: pointer;
                        background: ${isIos ? 'rgba(148, 163, 184, 0.55)' : '#1e293b'};
                        border-radius: 2px;
                    }
                `}</style>

                {isFullscreen && typeof document !== 'undefined' && document.body
                    ? ReactDOM.createPortal(
                        <div className="embedded-fullscreen-layer">
                            {chartCard}
                        </div>,
                        document.body
                    )
                    : null}

                <header className={`flex-none z-40 ${isIos ? 'bg-white/70 backdrop-blur-xl border-b border-slate-200/50' : 'bg-gradient-to-b from-slate-900 via-slate-900/80 to-transparent border-b border-cyan-500/20'}`} style={{ paddingTop: 'env(safe-area-inset-top)' }}>
                    <div className="w-full max-w-md mx-auto px-4 h-16 flex items-center justify-between">
                        <h1 className={`${isIos ? 'font-sans font-bold text-[17px] tracking-tight text-slate-900' : 'text-sm font-mono font-bold text-cyan-100 tracking-wider'}`}>{t ? t('robot_monitor') : 'ROBOT MONITOR'}</h1>
                        <div className={`flex items-center gap-2 px-2.5 py-1 rounded-full border ${
                            isIos
                                ? (isConnected ? 'border-[#34C759]/25 bg-[#34C759]/10' : 'border-slate-200/60 bg-white/60')
                                : (isConnected ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-slate-800 bg-slate-950/20')
                        }`}>
                            <span className={`w-2 h-2 rounded-full ${isConnected ? (isIos ? 'bg-[#34C759]' : 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.55)]') : 'bg-slate-500 shadow-none'}`}></span>
                            <span className={`${isIos ? 'text-[11px] font-semibold tracking-wide' : 'text-[10px] font-mono font-bold uppercase tracking-wide'} ${isConnected ? (isIos ? 'text-[#34C759]' : 'text-emerald-400') : 'text-slate-500'}`}>{isConnected ? 'LIVE' : 'OFFLINE'}</span>
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto embedded-no-scrollbar">
                    <div className="max-w-md mx-auto p-4 pb-24 min-h-full flex flex-col">
                        <div className="flex-1 flex items-center">
                            <div className="w-full">
                                {!isFullscreen ? chartCard : null}
                            </div>
                        </div>

                        <section className="space-y-3 mt-4">
                            <div className={`${isIos ? 'bg-white/80 backdrop-blur-xl border border-white/60 rounded-[26px] shadow-[0_4px_20px_-8px_rgba(0,0,0,0.06)]' : 'bg-slate-900/40 border border-slate-800 rounded-2xl shadow-sm'} overflow-hidden transition-shadow`}>
                                <button
                                    onClick={toggleExpanded}
                                    className={`w-full flex justify-between items-center p-4 transition-colors z-10 relative ${isIos ? 'bg-transparent active:bg-slate-100/60' : 'bg-slate-900/40 active:bg-slate-900/60'}`}
                                    aria-label={t ? t('toggle_channel_config') : 'Toggle channel config'}
                                >
                                    <div className="flex items-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${isIos ? 'text-[#007AFF]' : 'text-cyan-400'}`} viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                                        </svg>
                                        <span className={`${isIos ? 'font-semibold text-slate-900' : 'font-semibold text-slate-200'}`}>{t ? t('show_channels') : '显示通道配置'}</span>
                                    </div>
                                    <div className={`flex items-center gap-2 ${isIos ? 'text-slate-500' : 'text-slate-400'}`}>
                                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${isIos ? 'bg-slate-100/80 border-slate-200/70 text-slate-600' : 'bg-slate-800/70 border-slate-700'}`}>{activeKeys.size} {t ? t('channels_on') : '开启'}</span>
                                        <svg className={`w-5 h-5 transition-transform ${isChannelExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </button>

                                <div className={`embedded-dropdown-content ${isIos ? 'bg-[#F2F2F7]/70 border-t border-slate-200/60' : 'bg-slate-950/40 border-t border-slate-800'} ${isChannelExpanded ? 'expanded' : ''} embedded-no-scrollbar`}>
                                    <div className="p-4 space-y-4">
                                        {isIos ? (
                                            <>
                                                <div className="flex justify-between items-center">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-3 h-3 rounded-full bg-[#5856D6] shadow-sm"></div>
                                                        <span className="text-[15px] font-medium text-slate-900">{t ? t('heading') : '航向角'}</span>
                                                    </div>
                                                    <div
                                                        onClick={() => toggleChannel('heading')}
                                                        className={`w-11 h-6 rounded-full flex items-center px-0.5 transition-colors cursor-pointer ${activeKeys.has('heading') ? 'bg-[#34C759]' : 'bg-slate-300'}`}
                                                        role="switch"
                                                        aria-checked={activeKeys.has('heading')}
                                                    >
                                                        <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${activeKeys.has('heading') ? 'translate-x-5' : 'translate-x-0'}`}></div>
                                                    </div>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-3 h-3 rounded-full bg-[#007AFF] shadow-sm"></div>
                                                        <span className="text-[15px] font-medium text-slate-900">{t ? t('batL') : '左电池'}</span>
                                                    </div>
                                                    <div
                                                        onClick={() => toggleChannel('batL')}
                                                        className={`w-11 h-6 rounded-full flex items-center px-0.5 transition-colors cursor-pointer ${activeKeys.has('batL') ? 'bg-[#34C759]' : 'bg-slate-300'}`}
                                                        role="switch"
                                                        aria-checked={activeKeys.has('batL')}
                                                    >
                                                        <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${activeKeys.has('batL') ? 'translate-x-5' : 'translate-x-0'}`}></div>
                                                    </div>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-3 h-3 rounded-full bg-[#34C759] shadow-sm"></div>
                                                        <span className="text-[15px] font-medium text-slate-900">{t ? t('batR') : '右电池'}</span>
                                                    </div>
                                                    <div
                                                        onClick={() => toggleChannel('batR')}
                                                        className={`w-11 h-6 rounded-full flex items-center px-0.5 transition-colors cursor-pointer ${activeKeys.has('batR') ? 'bg-[#34C759]' : 'bg-slate-300'}`}
                                                        role="switch"
                                                        aria-checked={activeKeys.has('batR')}
                                                    >
                                                        <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${activeKeys.has('batR') ? 'translate-x-5' : 'translate-x-0'}`}></div>
                                                    </div>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div className="flex justify-between items-center">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-3 h-3 rounded-full bg-purple-400 shadow-sm"></div>
                                                        <span className="text-sm font-medium text-slate-200">{t ? t('heading') : '航向角'}</span>
                                                    </div>
                                                    <div className="relative inline-block w-10 align-middle select-none">
                                                        <input
                                                            type="checkbox"
                                                            checked={activeKeys.has('heading')}
                                                            onChange={() => toggleChannel('heading')}
                                                            id="embedded-toggle-hdg"
                                                            className="embedded-toggle-checkbox absolute block w-5 h-5 rounded-full bg-slate-950 border-4 appearance-none cursor-pointer border-slate-600 transition-all duration-300"
                                                        />
                                                        <label htmlFor="embedded-toggle-hdg" className="embedded-toggle-label block overflow-hidden h-5 rounded-full bg-slate-700 cursor-pointer transition-colors duration-300"></label>
                                                    </div>
                                                </div>

                                                <div className="flex justify-between items-center">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-3 h-3 rounded-full bg-cyan-400 shadow-sm"></div>
                                                        <span className="text-sm font-medium text-slate-200">{t ? t('batL') : '左电池'}</span>
                                                    </div>
                                                    <div className="relative inline-block w-10 align-middle select-none">
                                                        <input
                                                            type="checkbox"
                                                            checked={activeKeys.has('batL')}
                                                            onChange={() => toggleChannel('batL')}
                                                            id="embedded-toggle-left"
                                                            className="embedded-toggle-checkbox absolute block w-5 h-5 rounded-full bg-slate-950 border-4 appearance-none cursor-pointer border-slate-600 transition-all duration-300"
                                                        />
                                                        <label htmlFor="embedded-toggle-left" className="embedded-toggle-label block overflow-hidden h-5 rounded-full bg-slate-700 cursor-pointer transition-colors duration-300"></label>
                                                    </div>
                                                </div>

                                                <div className="flex justify-between items-center">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-3 h-3 rounded-full bg-emerald-400 shadow-sm"></div>
                                                        <span className="text-sm font-medium text-slate-200">{t ? t('batR') : '右电池'}</span>
                                                    </div>
                                                    <div className="relative inline-block w-10 align-middle select-none">
                                                        <input
                                                            type="checkbox"
                                                            checked={activeKeys.has('batR')}
                                                            onChange={() => toggleChannel('batR')}
                                                            id="embedded-toggle-right"
                                                            className="embedded-toggle-checkbox absolute block w-5 h-5 rounded-full bg-slate-950 border-4 appearance-none cursor-pointer border-slate-600 transition-all duration-300"
                                                        />
                                                        <label htmlFor="embedded-toggle-right" className="embedded-toggle-label block overflow-hidden h-5 rounded-full bg-slate-700 cursor-pointer transition-colors duration-300"></label>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className={`${isIos ? 'bg-white/80 backdrop-blur-xl border border-white/60 rounded-[26px] shadow-[0_4px_20px_-8px_rgba(0,0,0,0.06)]' : 'bg-slate-900/40 border border-slate-800 rounded-2xl shadow-sm'} p-4 space-y-5 embedded-controls`}>
                                <div>
                                    <div className="flex justify-between mb-3 items-center">
                                        <span className={`${isIos ? 'text-[13px] font-semibold text-slate-600 tracking-tight' : 'text-xs font-semibold text-slate-400 uppercase tracking-wider'} flex items-center gap-1`}>
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                            </svg>
                                            {t ? t('chart_time_zoom') : '时间轴缩放'}
                                        </span>
                                        <span className={`text-xs px-2 py-0.5 rounded font-mono border ${isIos ? 'bg-slate-100/80 text-slate-600 border-slate-200/70' : 'bg-slate-800/70 text-slate-300 border-slate-700'}`}>{(300 / zoomPoints).toFixed(1)}x</span>
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
                                    <div className={`flex justify-between text-[10px] mt-1 px-1 ${isIos ? 'text-slate-400' : 'text-slate-400'}`}>
                                        <span>全览</span>
                                        <span>细节</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        onClick={() => setIsPaused(v => !v)}
                                        className={`w-full font-semibold py-3 rounded-xl transition-colors border ${isIos ? 'bg-white/70 active:bg-white/90 text-[#007AFF] border-white/60 shadow-[0_4px_16px_-10px_rgba(0,0,0,0.15)]' : 'bg-slate-950/30 active:bg-slate-950/50 text-cyan-300 border-slate-800'}`}
                                    >
                                        {isPaused ? (t ? t('chart_resume_show') : '继续显示') : (t ? t('chart_pause_show') : '暂停显示')}
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (window.confirm(t ? t('chart_clear_confirm') : 'Are you sure to clear data?')) {
                                                handleClear();
                                            }
                                        }}
                                        className={`w-full font-semibold py-3 rounded-xl transition-colors border ${isIos ? 'bg-[#FF3B30]/10 active:bg-[#FF3B30]/15 text-[#FF3B30] border-[#FF3B30]/30' : 'bg-red-900/10 active:bg-red-900/20 text-red-300 border-red-500/20'}`}
                                    >
                                        {t ? t('clear_btn') : '清空数据'}
                                    </button>
                                </div>
                            </div>
                        </section>
                    </div>
                </main>
            </div>
        );
    });

    window.MobileComponents = window.MobileComponents || {};
    window.MobileComponents.EmbeddedChart = EmbeddedChart;
})();
