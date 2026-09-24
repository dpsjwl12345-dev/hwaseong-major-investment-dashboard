import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

// VITE_VWORLD_KEY(브이월드 WMTS 인증키, 서비스 URL에 대시보드 도메인 등록 필요)가 있으면
// 브이월드 야간지도를 쓰고, 없으면 HwaseongGLMap과 같은 CartoDB 다크 벡터 스타일로 대체한다.
const VWORLD_KEY = import.meta.env.VITE_VWORLD_KEY as string | undefined;

const vworldStyle = (layer: "midnight"): maplibregl.StyleSpecification => ({
  version: 8,
  sources: {
    vworld: {
      type: "raster",
      tiles: [`https://api.vworld.kr/req/wmts/1.0.0/${VWORLD_KEY}/${layer}/{z}/{y}/{x}.png`],
      tileSize: 256,
      maxzoom: 19,
      attribution: "© 브이월드(국토교통부)",
    },
  },
  layers: [{ id: "vworld", type: "raster", source: "vworld" }],
});

const MAP_STYLE = VWORLD_KEY ? vworldStyle("midnight") : "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

type LngLat = [number, number];

const PIN_SVG = `<svg class="plm-pin" viewBox="0 0 12 18" aria-hidden="true"><circle cx="6" cy="5" r="4.2"/><rect x="5.1" y="8" width="1.8" height="9" rx=".9"/></svg>`;

export type ProjectLocationMapData = {
  center: LngLat;
  zoom?: number;
  // 대상지 경계(닫지 않은 꼭짓점 목록). 없으면 마커만 찍는다.
  boundary?: LngLat[];
  // labelBelow: 라벨이 옆 마커와 겹칠 때 라벨을 점 아래로 내린다.
  markers: { name: string; lnglat: LngLat; primary?: boolean; note?: string; labelBelow?: boolean }[];
};

// 두 점 사이 거리(m) — 팝업에 "예정지에서 약 0.7km"를 적기 위한 근사값.
const distanceMeters = (a: LngLat, b: LngLat) => {
  const rad = Math.PI / 180;
  const dLat = (b[1] - a[1]) * rad;
  const dLng = (b[0] - a[0]) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a[1] * rad) * Math.cos(b[1] * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.sqrt(h));
};

const formatDistance = (meters: number) => (meters < 1000 ? `${Math.round(meters / 10) * 10}m` : `${(meters / 1000).toFixed(1)}km`);

const boundaryGeoJSON = (boundary: LngLat[]) => ({
  type: "Feature" as const,
  properties: {},
  geometry: { type: "Polygon" as const, coordinates: [[...boundary, boundary[0]]] },
});

export function ProjectLocationMap({ data, projectName }: { data: ProjectLocationMapData; projectName: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    if (!containerRef.current) return;
    let cancelled = false;
    setStatus("loading");

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE,
      center: data.center,
      zoom: data.zoom ?? 14.2,
      attributionControl: { compact: true },
      cooperativeGestures: true,
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");

    map.on("style.load", () => {
      if (!data.boundary?.length || map.getSource("plm-boundary")) return;
      map.addSource("plm-boundary", { type: "geojson", data: boundaryGeoJSON(data.boundary) });
      map.addLayer({ id: "plm-boundary-fill", type: "fill", source: "plm-boundary", paint: { "fill-color": "#ef4444", "fill-opacity": 0.12 } });
      map.addLayer({ id: "plm-boundary-line", type: "line", source: "plm-boundary", paint: { "line-color": "#ef4444", "line-width": 2, "line-dasharray": [2, 1.4] } });
    });

    const primary = data.markers.find((marker) => marker.primary)?.lnglat ?? data.center;
    data.markers.forEach((marker) => {
      const el = document.createElement("button");
      el.type = "button";
      el.className = `plm-marker${marker.primary ? " is-primary" : ""}${marker.labelBelow ? " is-below" : ""}`;
      el.setAttribute("aria-label", marker.name);
      el.innerHTML = `<span class="plm-dot"></span><span class="plm-leader"></span><span class="plm-tag">${PIN_SVG}<span class="plm-tag-text"></span></span>`;
      el.querySelector(".plm-tag-text")!.textContent = marker.name;

      const popup = new maplibregl.Popup({ offset: 14, anchor: marker.labelBelow ? "bottom" : "top", closeButton: false, className: "plm-popup" });
      const body = document.createElement("div");
      const title = document.createElement("strong");
      title.textContent = marker.name;
      body.appendChild(title);
      const detail = marker.note ?? (marker.primary ? "" : `예정지에서 약 ${formatDistance(distanceMeters(primary, marker.lnglat))}`);
      if (detail) {
        const p = document.createElement("p");
        p.textContent = detail;
        body.appendChild(p);
      }
      popup.setDOMContent(body);

      new maplibregl.Marker({ element: el, anchor: "center" }).setLngLat(marker.lnglat).setPopup(popup).addTo(map);
    });

    map.on("load", () => {
      if (cancelled) return;
      setStatus("ready");
      const bounds = new maplibregl.LngLatBounds();
      (data.boundary ?? []).forEach((point) => bounds.extend(point));
      data.markers.forEach((marker) => bounds.extend(marker.lnglat));
      if (!bounds.isEmpty()) map.fitBounds(bounds, { padding: { top: 100, bottom: 90, left: 90, right: 90 }, duration: 0, maxZoom: 16 }); // 위쪽은 알약 라벨 높이만큼 더 비운다(아래 라벨도 고려)
    });
    map.on("error", () => {
      if (!cancelled) setStatus((current) => (current === "loading" ? "error" : current));
    });
    // 외부 CDN이 막힌 망에서 "불러오는 중"에 멈춰 있지 않도록.
    const timeout = setTimeout(() => {
      if (!cancelled) setStatus((current) => (current === "loading" ? "error" : current));
    }, 8000);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
      map.remove();
    };
  }, [data]);

  return (
    <div className="plm" aria-label={`${projectName} 위치도`}>
      <div ref={containerRef} className={`plm-canvas${status === "ready" ? " is-ready" : ""}`} />
      {status !== "ready" && (
        <div className="plm-status">
          <span>{status === "error" ? "지도를 불러오지 못했습니다" : "지도 불러오는 중"}</span>
        </div>
      )}
    </div>
  );
}
