// js/components/MapComponent.js
const { useEffect, useRef, useState } = React;

function MapComponent({ lng, lat, heading, waypoints, setWaypoints, cruiseMode, t, showLogs, controlledMapMode, hideToolbar, locateNonce, boatStyle = 'default', waypointStyle = 'default' }) {
    const mapRef = useRef(null);
    const markerRef = useRef(null);
    const boatTrackRef = useRef(null);
    const missionPathRef = useRef(null);
    const pathRef = useRef([]);
    const containerRef = useRef(null);
    const distanceToolRef = useRef(null);
    const waypointMarkersRef = useRef([]);
    const contextMenuRef = useRef(null);
    const suppressAddUntilRef = useRef(0);
    
    const [internalMapMode, setInternalMapMode] = useState('pan');
    const mapMode = controlledMapMode || internalMapMode;

    // --- 坐标转换算法集 ---
    const PI = 3.1415926535897932384626;
    const x_pi = 3.14159265358979324 * 3000.0 / 180.0;
    const a = 6378245.0;
    const ee = 0.00669342162296594323;

    const wgs84tobd09 = (lng, lat) => { const [gcjLng, gcjLat] = wgs84togcj02(lng, lat); return gcj02tobd09(gcjLng, gcjLat); };
    const bd09towgs84 = (bd_lng, bd_lat) => { const [gcjLng, gcjLat] = bd09togcj02(bd_lng, bd_lat); return gcj02towgs84(gcjLng, gcjLat); };
    const wgs84togcj02 = (lng, lat) => { if (out_of_china(lng, lat)) return [lng, lat]; let dLat = transformLat(lng - 105.0, lat - 35.0); let dLng = transformLng(lng - 105.0, lat - 35.0); const radLat = lat / 180.0 * PI; let magic = Math.sin(radLat); magic = 1 - ee * magic * magic; const sqrtMagic = Math.sqrt(magic); dLat = (dLat * 180.0) / ((a * (1 - ee)) / (magic * sqrtMagic) * PI); dLng = (dLng * 180.0) / (a / sqrtMagic * Math.cos(radLat) * PI); return [lng + dLng, lat + dLat]; };
    const gcj02tobd09 = (lng, lat) => { const z = Math.sqrt(lng * lng + lat * lat) + 0.00002 * Math.sin(lat * x_pi); const theta = Math.atan2(lat, lng) + 0.000003 * Math.cos(lng * x_pi); return [z * Math.cos(theta) + 0.0065, z * Math.sin(theta) + 0.006]; };
    const bd09togcj02 = (bd_lng, bd_lat) => { const x = bd_lng - 0.0065; const y = bd_lat - 0.006; const z = Math.sqrt(x * x + y * y) - 0.00002 * Math.sin(y * x_pi); const theta = Math.atan2(y, x) - 0.000003 * Math.cos(x * x_pi); return [z * Math.cos(theta), z * Math.sin(theta)]; };
    const gcj02towgs84 = (lng, lat) => { if (out_of_china(lng, lat)) return [lng, lat]; let dlat = transformLat(lng - 105.0, lat - 35.0); let dlng = transformLng(lng - 105.0, lat - 35.0); const radlat = lat / 180.0 * PI; let magic = Math.sin(radlat); magic = 1 - ee * magic * magic; const sqrtmagic = Math.sqrt(magic); dlat = (dlat * 180.0) / ((a * (1 - ee)) / (magic * sqrtmagic) * PI); dlng = (dlng * 180.0) / (a / sqrtmagic * Math.cos(radlat) * PI); const mglat = lat + dlat; const mglng = lng + dlng; return [lng * 2 - mglng, lat * 2 - mglat]; };
    const transformLat = (x, y) => { let ret = -100.0 + 2.0 * x + 3.0 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x)); ret += (20.0 * Math.sin(6.0 * x * PI) + 20.0 * Math.sin(2.0 * x * PI)) * 2.0 / 3.0; ret += (20.0 * Math.sin(y * PI) + 40.0 * Math.sin(y / 3.0 * PI)) * 2.0 / 3.0; ret += (160.0 * Math.sin(y / 12.0 * PI) + 320 * Math.sin(y * PI / 30.0)) * 2.0 / 3.0; return ret; };
    const transformLng = (x, y) => { let ret = 300.0 + x + 2.0 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x)); ret += (20.0 * Math.sin(6.0 * x * PI) + 20.0 * Math.sin(2.0 * x * PI)) * 2.0 / 3.0; ret += (20.0 * Math.sin(x * PI) + 40.0 * Math.sin(x / 3.0 * PI)) * 2.0 / 3.0; ret += (150.0 * Math.sin(x / 12.0 * PI) + 300.0 * Math.sin(x / 30.0 * PI)) * 2.0 / 3.0; return ret; };
    const out_of_china = (lng, lat) => (lng < 72.004 || lng > 137.8347) || ((lat < 0.8293 || lat > 55.8271) || false);

    // --- 1. 初始化地图 ---
    useEffect(() => {
        if (!window.BMap) return;

        const map = new BMap.Map(containerRef.current, {enableMapClick: false});
        const initPoint = new BMap.Point(113.3957, 23.0344);
        const isMobile = window.matchMedia ? window.matchMedia('(max-width: 768px)').matches : false;
        map.centerAndZoom(initPoint, isMobile ? 19 : 18);
        map.enableScrollWheelZoom();
        map.disableDoubleClickZoom(); 
        map.setMapStyleV2({ styleId: '55610b642646c054e0c441c2d334863c' });
        map.addControl(new BMap.ScaleControl({ anchor: window.BMAP_ANCHOR_BOTTOM_LEFT, offset: new BMap.Size(80, 25) }));
        
        // --- Custom SVG Icons Definitions ---
        const cyberBoatSVG = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 80" width="40" height="80">
            <defs>
                <linearGradient id="beam" x1="0" y1="1" x2="0" y2="0">
                    <stop offset="0%" stop-color="#22d3ee" stop-opacity="0.5" />
                    <stop offset="100%" stop-color="#22d3ee" stop-opacity="0" />
                </linearGradient>
                <filter id="triangleGlow" x="-50%" y="-50%" width="200%" height="200%">
                    <feDropShadow dx="0" dy="0" stdDeviation="3" flood-color="rgba(6,182,212,0.8)" />
                </filter>
            </defs>
            <rect x="19.5" y="0" width="1" height="55" fill="url(#beam)" />
            <path d="M20 35 L30 65 L10 65 Z" fill="#06b6d4" filter="url(#triangleGlow)" />
            <circle cx="20" cy="67" r="2" fill="#ffffff">
                <animate attributeName="opacity" values="0.4;1;0.4" dur="1.2s" repeatCount="indefinite" />
                <animate attributeName="r" values="1.6;2.2;1.6" dur="1.2s" repeatCount="indefinite" />
            </circle>
        </svg>
        `;

        const cyberWaypointSVG = (index) => `
        <div style="position: relative; width: 40px; height: 40px; display: flex; flex-direction: column; align-items: center; justify-content: center;">
             <div style="width: 16px; height: 16px; border: 2px solid #ef4444; transform: rotate(45deg); background-color: rgba(239,68,68,0.2); box-shadow: 0 0 10px rgba(239,68,68,0.5);"></div>
             <span style="font-size: 10px; color: #f87171; font-family: monospace; margin-top: 4px; background-color: rgba(0,0,0,0.5); padding: 0 4px; border-radius: 2px;">WP_${index + 1}</span>
        </div>
        `;

        // Store these for later use
        map.customIcons = { cyberBoatSVG, cyberWaypointSVG };

        const boatIcon = new BMap.Symbol(window.BMap_Symbol_SHAPE_FORWARD_CLOSED_ARROW, { scale: 1.5, strokeWeight: 1, fillColor: "#06b6d4", fillOpacity: 0.9, strokeColor: "#fff" });
        const marker = new BMap.Marker(initPoint, { icon: boatIcon });
        map.addOverlay(marker);

        const trackPolyline = new BMap.Polyline([], { strokeColor: "#22d3ee", strokeWeight: 2, strokeOpacity: 0.6 });
        map.addOverlay(trackPolyline);

        const missionPolyline = new BMap.Polyline([], { strokeColor: "#10b981", strokeWeight: 3, strokeOpacity: 0.8, strokeStyle: 'dashed' });
        map.addOverlay(missionPolyline);

        if (window.BMapLib && window.BMapLib.DistanceTool) {
            distanceToolRef.current = new BMapLib.DistanceTool(map);
        }

        mapRef.current = map;
        markerRef.current = marker;
        boatTrackRef.current = trackPolyline;
        missionPathRef.current = missionPolyline;

        return () => {};
    }, []);

    // --- 2. 动态创建右键菜单 ---
    useEffect(() => {
        if (!mapRef.current) return;
        if (contextMenuRef.current) mapRef.current.removeContextMenu(contextMenuRef.current);

        const contextMenu = new BMap.ContextMenu();
        const rulerText = `<div style="font-size:13px; font-weight:bold; padding:2px 5px; width:100%; text-align:left;">${t ? t('menu_ruler') : '📏 开启测距'}</div>`;
        contextMenu.addItem(new BMap.MenuItem(rulerText, () => distanceToolRef.current && distanceToolRef.current.open(), { width: 160 }));
        contextMenu.addSeparator();
        const clearText = `<div style="font-size:13px; padding:2px 5px; width:100%; text-align:left;">${t ? t('menu_clear') : '🗑️ 清除所有航点'}</div>`;
        contextMenu.addItem(new BMap.MenuItem(clearText, () => setWaypoints && setWaypoints([]), { width: 160 }));

        mapRef.current.addContextMenu(contextMenu);
        contextMenuRef.current = contextMenu;
    }, [t]);

    // --- 3. 监听地图点击添加航点 ---
    useEffect(() => {
        if (!mapRef.current) return;

        let lastAddTimestamp = 0;

        const handleAddPoint = (point, options = {}) => {
            if (!options.force && Date.now() < suppressAddUntilRef.current) return;
            
            const now = Date.now();
            if (now - lastAddTimestamp < 300) return; // Debounce 300ms
            lastAddTimestamp = now;

            if (mapMode === 'add') {
                const [wgsLng, wgsLat] = bd09towgs84(point.lng, point.lat);
                if (setWaypoints) setWaypoints(prev => [...prev, {lng: wgsLng, lat: wgsLat}]);
            }
        };

        const handleMapClick = (e) => handleAddPoint(e.point);

        mapRef.current.addEventListener("click", handleMapClick);
        
        const el = containerRef.current;
        const tapMoveTolerancePx = 10;
        const tapMaxDurationMs = 600;
        const suppressAfterAddMs = 500;
        const touchState = {
            tracking: false,
            moved: false,
            startX: 0,
            startY: 0,
            startAt: 0
        };

        const getPixel = (touch) => {
            const rect = el.getBoundingClientRect();
            return {
                x: touch.clientX - rect.left,
                y: touch.clientY - rect.top
            };
        };

        const onTouchStart = (ev) => {
            if (mapMode !== 'add') return;
            if (!el || !mapRef.current) return;
            if (Date.now() < suppressAddUntilRef.current) return;
            if (!ev.touches || ev.touches.length !== 1) {
                touchState.tracking = false;
                return;
            }
            const t0 = ev.touches[0];
            const { x, y } = getPixel(t0);
            touchState.tracking = true;
            touchState.moved = false;
            touchState.startX = x;
            touchState.startY = y;
            touchState.startAt = Date.now();
        };

        const onTouchMove = (ev) => {
            if (!touchState.tracking) return;
            if (!ev.touches || ev.touches.length !== 1) {
                touchState.tracking = false;
                return;
            }
            const t0 = ev.touches[0];
            const { x, y } = getPixel(t0);
            const dx = x - touchState.startX;
            const dy = y - touchState.startY;
            if ((dx * dx + dy * dy) > (tapMoveTolerancePx * tapMoveTolerancePx)) {
                touchState.moved = true;
            }
        };

        const onTouchEnd = (ev) => {
            if (!touchState.tracking) return;
            touchState.tracking = false;
            if (touchState.moved) return;
            if (Date.now() - touchState.startAt > tapMaxDurationMs) return;
            if (!ev.changedTouches || ev.changedTouches.length < 1) return;
            if (!mapRef.current) return;
            if (Date.now() < suppressAddUntilRef.current) return;
            if (mapMode !== 'add') return;

            const t0 = ev.changedTouches[0];
            const { x, y } = getPixel(t0);
            const pixel = new BMap.Pixel(x, y);
            const point = mapRef.current.pixelToPoint(pixel);
            if (point) {
                suppressAddUntilRef.current = Date.now() + suppressAfterAddMs;
                handleAddPoint(point, { force: true });
            }
        };

        const onTouchCancel = () => {
            touchState.tracking = false;
        };

        if (el) {
            el.addEventListener('touchstart', onTouchStart, { passive: true, capture: true });
            el.addEventListener('touchmove', onTouchMove, { passive: true, capture: true });
            el.addEventListener('touchend', onTouchEnd, { passive: true, capture: true });
            el.addEventListener('touchcancel', onTouchCancel, { passive: true, capture: true });
        }

        return () => { 
            if (mapRef.current) {
                mapRef.current.removeEventListener("click", handleMapClick);
            }
            if (el) {
                el.removeEventListener('touchstart', onTouchStart, true);
                el.removeEventListener('touchmove', onTouchMove, true);
                el.removeEventListener('touchend', onTouchEnd, true);
                el.removeEventListener('touchcancel', onTouchCancel, true);
            }
        };
    }, [mapMode, setWaypoints]);

    // --- 4. 绘制航点和虚线 ---
    useEffect(() => {
        if (!mapRef.current || !waypoints) return;
        
        waypointMarkersRef.current.forEach(m => mapRef.current.removeOverlay(m));
        waypointMarkersRef.current = [];

        const missionPathPoints = [];

        waypoints.forEach((wp, index) => {
            const [bdLng, bdLat] = wgs84tobd09(wp.lng, wp.lat);
            const pt = new BMap.Point(bdLng, bdLat);
            missionPathPoints.push(pt);
            
            const marker = new BMap.Marker(pt, {
                icon: new BMap.Symbol(window.BMap_Symbol_SHAPE_CIRCLE, { scale: 0, fillOpacity: 0 })
            });

            if (waypointStyle === 'cyber' && mapRef.current && mapRef.current.customIcons && typeof mapRef.current.customIcons.cyberWaypointSVG === 'function') {
                const content = mapRef.current.customIcons.cyberWaypointSVG(index);
                const label = new BMap.Label(content, { offset: new BMap.Size(-20, -20) });
                label.setStyle({
                    border: "none",
                    backgroundColor: "transparent"
                });
                marker.setLabel(label);
            } else {
                const label = new BMap.Label(`${index + 1}`, { offset: new BMap.Size(-12, -12) });
                label.setStyle({
                    color: "#fff",
                    backgroundColor: "#ef4444",
                    border: "2px solid #fff",
                    borderRadius: "50%",
                    width: "24px",
                    height: "24px",
                    lineHeight: "20px",
                    textAlign: "center",
                    fontSize: "12px",
                    fontWeight: "bold",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
                    cursor: "pointer",
                    fontFamily: "Arial, sans-serif"
                });
                marker.setLabel(label);
            }

            marker.enableDragging();
            marker.addEventListener("dragstart", function() {
                suppressAddUntilRef.current = Date.now() + 800;
            });
            marker.addEventListener("click", function() {
                suppressAddUntilRef.current = Date.now() + 500;
            });

            marker.addEventListener("dragging", function(e) {
                const currentPt = e.point; 
                const currentPath = missionPathRef.current.getPath();
                if (currentPath.length > index) {
                    currentPath[index] = currentPt;
                    if (cruiseMode === '1' && currentPath.length > 2 && index === 0) {
                        currentPath[currentPath.length - 1] = currentPt;
                    }
                    missionPathRef.current.setPath(currentPath);
                }
            });

            marker.addEventListener("dragend", function(e) {
                suppressAddUntilRef.current = Date.now() + 800;
                const newPt = e.point;
                const [newWgsLng, newWgsLat] = bd09towgs84(newPt.lng, newPt.lat);
                if (setWaypoints) {
                    setWaypoints(prev => {
                        const newList = [...prev];
                        newList[index] = { lng: newWgsLng, lat: newWgsLat };
                        return newList;
                    });
                }
            });

            marker.addEventListener("dblclick", function(e) {
                if (e.domEvent) e.domEvent.stopPropagation();
                if (setWaypoints) {
                    setWaypoints(prev => prev.filter((_, i) => i !== index));
                }
            });

            const markerMenu = new BMap.ContextMenu();
            const delText = `<div style="font-size:12px; padding:0 5px; width:100%; text-align:left;">${t ? t('menu_delete_point') : '❌ 删除此点'}</div>`;
            markerMenu.addItem(new BMap.MenuItem(delText, () => {
                setWaypoints(prev => prev.filter((_, i) => i !== index));
            }, { width: 120 }));
            marker.addContextMenu(markerMenu);

            mapRef.current.addOverlay(marker);
            waypointMarkersRef.current.push(marker);
        });

        if (missionPathPoints.length > 0) {
            if (cruiseMode === '1' && missionPathPoints.length > 2) {
                missionPathPoints.push(missionPathPoints[0]);
            }
            missionPathRef.current.setPath(missionPathPoints);
        } else {
            missionPathRef.current.setPath([]);
        }

    }, [waypoints, cruiseMode, t, waypointStyle]);

    // --- 5. 实时更新 ---
    useEffect(() => {
        if (!mapRef.current || !markerRef.current) return;

        const hasGps = Number.isFinite(lng) && Number.isFinite(lat) && !(lng === 0 && lat === 0);

        let pt = null;
        let bdLng = null;
        let bdLat = null;
        if (hasGps) {
            [bdLng, bdLat] = wgs84tobd09(lng, lat);
            pt = new BMap.Point(bdLng, bdLat);
            markerRef.current.setPosition(pt);
        }

        let icon;
        if (boatStyle === 'cyber') {
            const svgString = mapRef.current.customIcons.cyberBoatSVG;
            const encodedSVG = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svgString);
            icon = new BMap.Icon(encodedSVG, new BMap.Size(26, 52));
            icon.setAnchor(new BMap.Size(13, 42));
        } else {
            icon = new BMap.Symbol(window.BMap_Symbol_SHAPE_FORWARD_CLOSED_ARROW, { scale: 1.5, strokeWeight: 1, fillColor: "#06b6d4", fillOpacity: 0.9, strokeColor: "#fff" });
        }

        markerRef.current.setIcon(icon);
        if (typeof markerRef.current.setRotation === 'function') {
            markerRef.current.setRotation(heading ? -heading : 0);
        }

        if (hasGps && pt) {
            if (pathRef.current.length === 0) mapRef.current.panTo(pt);

            const lastPt = pathRef.current[pathRef.current.length - 1];
            if (!lastPt || (Math.abs(lastPt.lng - bdLng) > 0.00001 || Math.abs(lastPt.lat - bdLat) > 0.00001)) {
                pathRef.current.push(pt);
                if (boatTrackRef.current) boatTrackRef.current.setPath(pathRef.current);
            }
        }
    }, [lng, lat, heading, boatStyle]);

    const handleLocateBoat = () => {
        if(mapRef.current && lng && lat) {
            const [bdLng, bdLat] = wgs84tobd09(lng, lat);
            mapRef.current.panTo(new BMap.Point(bdLng, bdLat));
        }
    };

    useEffect(() => {
        if (!locateNonce) return;
        handleLocateBoat();
    }, [locateNonce]);

    const MapIcons = {
        Hand: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"/><path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2"/><path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/></svg>,
        Pin: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/><line x1="12" y1="22" x2="12" y2="10" strokeOpacity="0.5"/></svg>,
        Target: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="22" y1="12" x2="18" y2="12"/><line x1="6" y1="12" x2="2" y2="12"/><line x1="12" y1="6" x2="12" y2="2"/><line x1="12" y1="22" x2="12" y2="18"/></svg>
    };

    return (
        <div className="w-full h-full relative group">
            <div ref={containerRef} className="w-full h-full rounded bg-slate-900" />
            
            <div className="absolute inset-0 pointer-events-none border border-cyan-500/20 rounded shadow-[inset_0_0_20px_rgba(6,182,212,0.1)]"></div>
            
            {/* 上方工具栏 (移除了定位按钮) */}
            {!hideToolbar && (
            <div 
                className={`absolute top-4 z-20 flex bg-slate-900/90 backdrop-blur border border-slate-700 rounded-lg overflow-hidden shadow-lg transition-all duration-300 ease-in-out ${showLogs ? 'right-[21rem]' : 'right-4'}`}
            >
                <button 
                    onClick={() => setInternalMapMode('pan')}
                    className={`p-2 flex items-center gap-2 text-xs font-bold transition-colors ${mapMode === 'pan' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                    title={t ? t('map_browse') : "Browse"}
                >
                    <MapIcons.Hand /> {t ? t('map_browse') : "Browse"}
                </button>
                <div className="w-[1px] bg-slate-700"></div>
                <button 
                    onClick={() => setInternalMapMode('add')}
                    className={`p-2 flex items-center gap-2 text-xs font-bold transition-colors ${mapMode === 'add' ? 'bg-yellow-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                    title={t ? t('map_add_mode') : "Add WP"}
                >
                    <MapIcons.Pin /> {t ? t('map_add_mode') : "Add WP"}
                </button>
            </div>
            )}

            {/* 下方悬浮定位按钮 (新增) */}
            <div className={`absolute bottom-8 z-20 transition-all duration-300 ease-in-out ${showLogs ? 'right-[21rem]' : 'right-4'}`}>
                <button 
                    onClick={handleLocateBoat}
                    className="p-2 bg-slate-900/90 backdrop-blur border border-slate-700 rounded-lg shadow-lg text-cyan-400 hover:text-white hover:bg-slate-800 transition-all hover:scale-110 active:scale-95"
                    title={t ? t('map_locate') : "Locate"}
                >
                    <MapIcons.Target />
                </button>
            </div>

            <div className="absolute bottom-2 left-2 bg-slate-950/80 backdrop-blur px-2 py-1 rounded border border-slate-700 text-[10px] text-cyan-300 font-mono pointer-events-none z-10 flex flex-col gap-1">
                <span>{t ? t('map_system_active') : "BD09 MAP SYSTEM ACTIVE"}</span>
                <span className="text-slate-500">
                    {mapMode === 'add' 
                        ? (t ? t('map_instruction_add') : 'Click map to add waypoint') 
                        : (t ? t('map_instruction_pan') : 'Right-click for options')}
                </span>
            </div>
        </div>
    );
}
