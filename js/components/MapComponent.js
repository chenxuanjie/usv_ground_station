// js/components/MapComponent.js
const { useEffect, useRef, useState } = React;

// 1. 在参数中增加 showLogs
function MapComponent({ lng, lat, heading, waypoints, setWaypoints, cruiseMode, t, showLogs }) {
    const mapRef = useRef(null);
    const markerRef = useRef(null);
    const boatTrackRef = useRef(null);
    const missionPathRef = useRef(null);
    const pathRef = useRef([]);
    const containerRef = useRef(null);
    const distanceToolRef = useRef(null);
    const waypointMarkersRef = useRef([]);
    const contextMenuRef = useRef(null);
    
    const [mapMode, setMapMode] = useState('pan');

    // --- 坐标转换算法集 (WGS84 <-> BD09) ---
    const PI = 3.1415926535897932384626;
    const x_pi = 3.14159265358979324 * 3000.0 / 180.0;
    const a = 6378245.0;
    const ee = 0.00669342162296594323;

    const wgs84tobd09 = (lng, lat) => {
        const [gcjLng, gcjLat] = wgs84togcj02(lng, lat);
        return gcj02tobd09(gcjLng, gcjLat);
    };
    const bd09towgs84 = (bd_lng, bd_lat) => {
        const [gcjLng, gcjLat] = bd09togcj02(bd_lng, bd_lat);
        return gcj02towgs84(gcjLng, gcjLat);
    };
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
        map.centerAndZoom(initPoint, 18);
        map.enableScrollWheelZoom();
        map.setMapStyleV2({ styleId: '55610b642646c054e0c441c2d334863c' });

        map.addControl(new BMap.ScaleControl({ anchor: window.BMAP_ANCHOR_BOTTOM_LEFT, offset: new BMap.Size(80, 25) }));
        
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

    // --- 2. 动态创建右键菜单 (依赖 t 变化) ---
    useEffect(() => {
        if (!mapRef.current) return;

        if (contextMenuRef.current) {
            mapRef.current.removeContextMenu(contextMenuRef.current);
        }

        const contextMenu = new BMap.ContextMenu();
        
        const rulerText = `<div style="font-size:13px; font-weight:bold; padding:2px 5px; width:100%; text-align:left;">${t ? t('menu_ruler') : '📏 开启测距'}</div>`;
        const rulerItem = new BMap.MenuItem(
            rulerText, 
            () => distanceToolRef.current && distanceToolRef.current.open(),
            { width: 160 } 
        );
        contextMenu.addItem(rulerItem);

        contextMenu.addSeparator();

        const clearText = `<div style="font-size:13px; padding:2px 5px; width:100%; text-align:left;">${t ? t('menu_clear') : '🗑️ 清除所有航点'}</div>`;
        const clearItem = new BMap.MenuItem(
            clearText, 
            () => setWaypoints && setWaypoints([]),
            { width: 160 }
        );
        contextMenu.addItem(clearItem);

        mapRef.current.addContextMenu(contextMenu);
        contextMenuRef.current = contextMenu;

    }, [t]);

    // --- 3. 监听地图点击 ---
    useEffect(() => {
        if (!mapRef.current) return;

        const handleMapClick = (e) => {
            if (mapMode === 'add') {
                const [wgsLng, wgsLat] = bd09towgs84(e.point.lng, e.point.lat);
                if (setWaypoints) {
                    setWaypoints(prev => [...prev, {lng: wgsLng, lat: wgsLat}]);
                }
            }
        };

        mapRef.current.addEventListener("click", handleMapClick);
        return () => {
            if (mapRef.current) mapRef.current.removeEventListener("click", handleMapClick);
        };
    }, [mapMode, setWaypoints]);

    // --- 4. 绘制航点和虚线航线 ---
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
            marker.enableDragging();

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

            marker.addEventListener("dragend", function(e) {
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

    }, [waypoints, cruiseMode, t]);

    // --- 5. 实时船位更新 ---
    useEffect(() => {
        if (!mapRef.current || !lng || !lat) return;

        const [bdLng, bdLat] = wgs84tobd09(lng, lat);
        const pt = new BMap.Point(bdLng, bdLat);

        markerRef.current.setPosition(pt);
        const icon = markerRef.current.getIcon();
        icon.setRotation(heading || 0);
        markerRef.current.setIcon(icon);

        if (pathRef.current.length === 0 && lng !== 0) {
            mapRef.current.panTo(pt);
        }

        const lastPt = pathRef.current[pathRef.current.length - 1];
        if (!lastPt || (Math.abs(lastPt.lng - bdLng) > 0.00001 || Math.abs(lastPt.lat - bdLat) > 0.00001)) {
            pathRef.current.push(pt);
            boatTrackRef.current.setPath(pathRef.current);
        }
    }, [lng, lat, heading]);

    const handleLocateBoat = () => {
        if(mapRef.current && lng && lat) {
            const [bdLng, bdLat] = wgs84tobd09(lng, lat);
            mapRef.current.panTo(new BMap.Point(bdLng, bdLat));
        }
    };

    const MapIcons = {
        Hand: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"/><path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2"/><path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/></svg>,
        Pin: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/><line x1="12" y1="22" x2="12" y2="10" strokeOpacity="0.5"/></svg>,
        Target: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="22" y1="12" x2="18" y2="12"/><line x1="6" y1="12" x2="2" y2="12"/><line x1="12" y1="6" x2="12" y2="2"/><line x1="12" y1="22" x2="12" y2="18"/></svg>
    };

    return (
        <div className="w-full h-full relative group">
            <div ref={containerRef} className="w-full h-full rounded bg-slate-900" />
            
            <div className="absolute inset-0 pointer-events-none border border-cyan-500/20 rounded shadow-[inset_0_0_20px_rgba(6,182,212,0.1)]"></div>
            
            {/* 2. 右上角工具栏：根据 showLogs 动态调整 right 值 */}
            <div 
                className={`absolute top-4 z-20 flex bg-slate-900/90 backdrop-blur border border-slate-700 rounded-lg overflow-hidden shadow-lg transition-all duration-300 ease-in-out ${showLogs ? 'right-[21rem]' : 'right-4'}`}
            >
                <button 
                    onClick={() => setMapMode('pan')}
                    className={`p-2 flex items-center gap-2 text-xs font-bold transition-colors ${mapMode === 'pan' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                    title={t ? t('map_browse') : "Browse"}
                >
                    <MapIcons.Hand /> {t ? t('map_browse') : "Browse"}
                </button>
                <div className="w-[1px] bg-slate-700"></div>
                <button 
                    onClick={() => setMapMode('add')}
                    className={`p-2 flex items-center gap-2 text-xs font-bold transition-colors ${mapMode === 'add' ? 'bg-yellow-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                    title={t ? t('map_add_mode') : "Add WP"}
                >
                    <MapIcons.Pin /> {t ? t('map_add_mode') : "Add WP"}
                </button>
                <div className="w-[1px] bg-slate-700"></div>
                <button 
                    onClick={handleLocateBoat}
                    className="p-2 flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
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