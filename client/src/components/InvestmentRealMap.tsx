import { useCallback, useEffect, useMemo, useRef } from "react";
import maplibregl, { type Map as MapLibreMap, type Marker as MapLibreMarker } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import dongLonLat from "../data/hwaseong-dong-lonlat.json";
import coastalLonLat from "../data/hwaseong-coastal-lonlat.json";

const STREET_STYLE = {
  version: 8 as const,
  sources: {
    carto: {
      type: "raster" as const,
      tiles: ["https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"],
      tileSize: 256,
      attribution: "Tiles © Esri — Source: Esri, Maxar, Earthstar Geographics",
    },
  },
  layers: [{ id: "carto-dark-basemap", type: "raster" as const, source: "carto" }],
};
// Centered on Hwaseong's mainland/coastal project belt rather than the far-west coast.
const INITIAL_CENTER: [number, number] = [126.84, 37.16];
const INITIAL_ZOOM = 9.85;

const CATEGORY_COLORS: Record<string, string> = {
  문화관광시설: "#d97706",
  체육시설: "#0891b2",
  공공시설: "#7c3aed",
  "교육 및 도서관": "#2563eb",
  "도로1(시도·농어촌)": "#ea580c",
  기타: "#475569",
};

export type RealMapProject = {
  id: string;
  project_name: string;
  category: string;
  department: string;
  district?: string;
  town?: string;
  overview: string;
};

type MapPosition = {
  x: number;
  y: number;
  screenX: number;
  screenY: number;
};

type InvestmentRealMapProps = {
  projects: RealMapProject[];
  selectedProjectId?: string;
  onSelectProject: (project: RealMapProject, position: MapPosition) => void;
  onHoverProject: (project: RealMapProject, position: MapPosition) => void;
  onLeaveProject: () => void;
};

type LngLat = [number, number];

const pointForProject = (project: RealMapProject): LngLat => {
  const text = `${project.project_name} ${project.district ?? ""} ${project.town ?? ""} ${project.overview}`;
  const landmarkMap: Record<string, keyof typeof coastalLonLat> = {
    궁평: "궁평항",
    제부: "제부도",
    국화도: "국화도",
    입파도: "입파도",
  };
  const landmark = Object.keys(landmarkMap).find((keyword) => text.includes(keyword));
  if (landmark) {
    const point = coastalLonLat[landmarkMap[landmark]];
    if (point) return [point[0], point[1]];
  }

  const names = (project.district ?? "")
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean);
  const matches = names
    .map((name) => (dongLonLat as unknown as Record<string, LngLat>)[name])
    .filter((point): point is LngLat => Array.isArray(point) && point.length === 2);
  if (matches.length) {
    return [
      matches.reduce((sum, point) => sum + point[0], 0) / matches.length,
      matches.reduce((sum, point) => sum + point[1], 0) / matches.length,
    ];
  }

  return INITIAL_CENTER;
};

const colorForProject = (project: RealMapProject) => CATEGORY_COLORS[project.category] ?? CATEGORY_COLORS.기타;
const labelForProject = (project: RealMapProject) => {
  if (/주차장/.test(project.project_name)) return "P";
  if (/도로/.test(project.project_name) || project.category.includes("도로")) return "D";
  if (project.category === "문화관광시설") return "C";
  if (project.category === "체육시설") return "S";
  if (project.category === "공공시설") return "B";
  if (project.category === "교육 및 도서관") return "L";
  return "I";
};

export function InvestmentRealMap({ projects, selectedProjectId, onSelectProject, onHoverProject, onLeaveProject }: InvestmentRealMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<MapLibreMarker[]>([]);
  const initialBoundsRef = useRef<maplibregl.LngLatBounds | null>(null);

  const projectPoints = useMemo(() => {
    const groups = new Map<string, number>();
    return projects.map((project) => {
      const base = pointForProject(project);
      const key = `${base[0].toFixed(4)},${base[1].toFixed(4)}`;
      const slot = groups.get(key) ?? 0;
      groups.set(key, slot + 1);
      if (slot === 0) return { project, point: base };
      const angle = (slot * Math.PI) / 3;
      return {
        project,
        point: [base[0] + Math.cos(angle) * 0.0022, base[1] + Math.sin(angle) * 0.0015] as LngLat,
      };
    });
  }, [projects]);

  const positionFor = useCallback((point: LngLat): MapPosition | null => {
    const map = mapRef.current;
    const container = containerRef.current;
    if (!map || !container) return null;
    const projected = map.project(point);
    const rect = container.getBoundingClientRect();
    return {
      x: projected.x,
      y: projected.y,
      screenX: rect.left + projected.x,
      screenY: rect.top + projected.y,
    };
  }, []);

  const resetCamera = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    if (initialBoundsRef.current && !initialBoundsRef.current.isEmpty()) {
      map.fitBounds(initialBoundsRef.current, { padding: 70, duration: 450, maxZoom: INITIAL_ZOOM });
    } else {
      map.flyTo({ center: INITIAL_CENTER, zoom: INITIAL_ZOOM, duration: 450 });
    }
  }, []);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: STREET_STYLE,
      center: INITIAL_CENTER,
      zoom: INITIAL_ZOOM,
      minZoom: 8.5,
      maxZoom: 17,
      attributionControl: { compact: true },
      dragRotate: false,
      touchPitch: false,
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    mapRef.current = map;
    map.once("load", () => {
      resetCamera();
      map.resize();
    });
    const resizeObserver = new ResizeObserver(() => map.resize());
    resizeObserver.observe(containerRef.current);
    return () => {
      resizeObserver.disconnect();
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
  }, [resetCamera]);

  useEffect(() => {
    const map = mapRef.current;
    const container = containerRef.current;
    if (!map || !container) return;
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    if (projectPoints.length) {
      const bounds = new maplibregl.LngLatBounds();
      projectPoints.forEach(({ point }) => bounds.extend(point));
      initialBoundsRef.current = bounds;
      // The first map load can occur before markers are mounted. Fit here as
      // well so the full Hwaseong project range is visible on first render.
      if (map.isStyleLoaded()) {
        map.fitBounds(bounds, { padding: 70, duration: 0, maxZoom: INITIAL_ZOOM });
      }
    }

    projectPoints.forEach(({ project, point }) => {
      const markerElement = document.createElement("button");
      markerElement.type = "button";
      markerElement.className = `investment-real-marker${project.id === selectedProjectId ? " is-selected" : ""}`;
      markerElement.style.setProperty("--marker-color", colorForProject(project));
      markerElement.setAttribute("aria-label", `${project.project_name} 위치 보기`);
      markerElement.innerHTML = `<span class="investment-real-marker-pulse"></span><span class="investment-real-marker-dot"><b>${labelForProject(project)}</b></span>`;
      const marker = new maplibregl.Marker({ element: markerElement, anchor: "center" }).setLngLat(point).addTo(map);
      const emitPosition = (callback: (project: RealMapProject, position: MapPosition) => void) => {
        const position = positionFor(point);
        if (position) callback(project, position);
      };
      markerElement.addEventListener("mouseenter", () => emitPosition(onHoverProject));
      markerElement.addEventListener("mouseleave", onLeaveProject);
      markerElement.addEventListener("focus", () => emitPosition(onHoverProject));
      markerElement.addEventListener("blur", onLeaveProject);
      markerElement.addEventListener("click", () => emitPosition(onSelectProject));
      markersRef.current.push(marker);
    });
  }, [onHoverProject, onLeaveProject, onSelectProject, positionFor, projectPoints, selectedProjectId]);

  return (
    <div ref={containerRef} className="investment-real-map" role="application" aria-label="화성시 주요 투자사업 실지도">
      <div className="investment-real-map-topbar">
        <span className="investment-real-map-badge">실지도 기반</span>
        <span className="investment-real-map-hint">도로·해안선·행정구역을 기준으로 사업 위치를 표시합니다</span>
      </div>
      <div className="investment-real-map-controls" aria-label="지도 조작">
        <button type="button" onClick={() => mapRef.current?.zoomIn({ duration: 220 })} aria-label="지도 확대">+</button>
        <button type="button" onClick={() => mapRef.current?.zoomOut({ duration: 220 })} aria-label="지도 축소">−</button>
        <button type="button" className="is-reset" onClick={resetCamera} aria-label="지도 초기화">초기화</button>
      </div>
      <div className="investment-real-map-legend" aria-label="사업 분야 범례">
        {Object.entries(CATEGORY_COLORS).slice(0, 5).map(([label, color]) => (
          <span key={label}><i style={{ backgroundColor: color }} />{label.replace("도로1(시도·농어촌)", "도로")}</span>
        ))}
      </div>
    </div>
  );
}
