// js/components/MapComponent.js
const { useEffect, useRef } = React;

function MapComponent({ lng, lat, heading }) {
    const mapRef = useRef(null);      // 地图实例
    const markerRef = useRef(null);   // 小艇标记
    const polylineRef = useRef(null); // 轨迹线
    const pathRef = useRef([]);       // 轨迹点数组缓存
    const containerRef = useRef(null);// DOM 容器

    // --- 坐标转换算法 (WGS84 -> BD09) ---
    // 为了不依赖外部文件，直接内嵌在这里
    const wgs84tobd09 = (lng, lat) => {
        const x_pi = 3.14159265358979324 * 3000.0 / 180.0;
        // WGS84 -> GCJ02
        let dLat = transformLat(lng - 105.0, lat - 35.0);
        let dLng = transformLng(lng - 105.0, lat - 35.0);
        const radLat = lat / 180.0 * Math.PI;
        let magic = Math.sin(radLat);
        magic = 1 - 0.00669342162296594323 * magic * magic;
        const sqrtMagic = Math.sqrt(magic);
        dLat = (dLat * 180.0) / ((6378245.0 * (1 - 0.00669342162296594323)) / (magic * sqrtMagic) * Math.PI);
        dLng = (dLng * 180.0) / (6378245.0 / sqrtMagic * Math.cos(radLat) * Math.PI);
        const mgLat = lat + dLat;
        const mgLng = lng + dLng;

        // GCJ02 -> BD09
        const z = Math.sqrt(mgLng * mgLng + mgLat * mgLat) + 0.00002 * Math.sin(mgLat * x_pi);
        const theta = Math.atan2(mgLat, mgLng) + 0.000003 * Math.cos(mgLng * x_pi);
        const bd_lng = z * Math.cos(theta) + 0.0065;
        const bd_lat = z * Math.sin(theta) + 0.006;
        return [bd_lng, bd_lat];
    };

    const transformLat = (x, y) => {
        let ret = -100.0 + 2.0 * x + 3.0 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x));
        ret += (20.0 * Math.sin(6.0 * x * Math.PI) + 20.0 * Math.sin(2.0 * x * Math.PI)) * 2.0 / 3.0;
        ret += (20.0 * Math.sin(y * Math.PI) + 40.0 * Math.sin(y / 3.0 * Math.PI)) * 2.0 / 3.0;
        ret += (160.0 * Math.sin(y / 12.0 * Math.PI) + 320 * Math.sin(y * Math.PI / 30.0)) * 2.0 / 3.0;
        return ret;
    };

    const transformLng = (x, y) => {
        let ret = 300.0 + x + 2.0 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x));
        ret += (20.0 * Math.sin(6.0 * x * Math.PI) + 20.0 * Math.sin(2.0 * x * Math.PI)) * 2.0 / 3.0;
        ret += (20.0 * Math.sin(x * Math.PI) + 40.0 * Math.sin(x / 3.0 * Math.PI)) * 2.0 / 3.0;
        ret += (150.0 * Math.sin(x / 12.0 * Math.PI) + 300.0 * Math.sin(x / 30.0 * Math.PI)) * 2.0 / 3.0;
        return ret;
    };

    // --- 1. 初始化地图 ---
    useEffect(() => {
        if (!window.BMap) return;

        // 创建地图实例
        const map = new BMap.Map(containerRef.current);
        const initPoint = new BMap.Point(113.3957, 23.0344); // 默认坐标
        map.centerAndZoom(initPoint, 18);
        map.enableScrollWheelZoom();
        
        // 设置深色个性化地图 (可选，配合你的UI风格)
        map.setMapStyleV2({     
            styleId: '55610b642646c054e0c441c2d334863c' // 百度地图官方深色模板ID，如果加载失败会显示默认
        });

        // 创建小艇图标
        const boatIcon = new BMap.Symbol(window.BMap_Symbol_SHAPE_FORWARD_CLOSED_ARROW, {
            scale: 1.5,
            strokeWeight: 1,
            fillColor: "#06b6d4", // Cyan-500
            fillOpacity: 0.9,
            strokeColor: "#fff"
        });
        const marker = new BMap.Marker(initPoint, { icon: boatIcon });
        map.addOverlay(marker);

        // 创建轨迹线
        const polyline = new BMap.Polyline([], {
            strokeColor: "#22d3ee", // Cyan-400
            strokeWeight: 2,
            strokeOpacity: 0.6
        });
        map.addOverlay(polyline);

        // 保存引用
        mapRef.current = map;
        markerRef.current = marker;
        polylineRef.current = polyline;

        // 清理函数
        return () => {
            // 组件卸载时不需要销毁 map 实例，DOM 移除即可
        };
    }, []);

    // --- 2. 数据更新 ---
    useEffect(() => {
        if (!mapRef.current || !lng || !lat) return;

        // 1. 坐标转换 WGS84 -> BD09
        const [bdLng, bdLat] = wgs84tobd09(lng, lat);
        const pt = new BMap.Point(bdLng, bdLat);

        // 2. 更新小艇位置和角度
        markerRef.current.setPosition(pt);
        // 获取 Symbol 并更新旋转角度
        const icon = markerRef.current.getIcon();
        icon.setRotation(heading || 0);
        markerRef.current.setIcon(icon);

        // 3. 只有当这是第一个有效点时，才自动居中
        if (pathRef.current.length === 0 && lng !== 0) {
            mapRef.current.panTo(pt);
        }

        // 4. 绘制轨迹 (简单的过滤，避免静止时点过多)
        const lastPt = pathRef.current[pathRef.current.length - 1];
        if (!lastPt || (Math.abs(lastPt.lng - bdLng) > 0.00001 || Math.abs(lastPt.lat - bdLat) > 0.00001)) {
            pathRef.current.push(pt);
            polylineRef.current.setPath(pathRef.current);
        }

    }, [lng, lat, heading]);

    return (
        <div className="w-full h-full relative group">
            <div ref={containerRef} className="w-full h-full rounded bg-slate-900" />
            
            {/* 地图遮罩层 (装饰用) */}
            <div className="absolute inset-0 pointer-events-none border border-cyan-500/20 rounded shadow-[inset_0_0_20px_rgba(6,182,212,0.1)]"></div>
            
            {/* 左下角状态显示 */}
            <div className="absolute bottom-2 left-2 bg-slate-950/80 backdrop-blur px-2 py-1 rounded border border-slate-700 text-[10px] text-cyan-300 font-mono pointer-events-none z-10">
                BD09 MAP SYSTEM ACTIVE
            </div>
        </div>
    );
}