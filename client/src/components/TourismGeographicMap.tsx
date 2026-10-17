import { createElement, forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Anchor, Landmark, Church, Flower2, Trees, Shell, House } from "lucide-react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { placeMapLabel, mapLabelRectsOverlap, type MapLabelRect, type MapLabelSide } from "../lib/mapLabelLayout";
import { tourismAttractions } from "../data/tourism-attractions";
import geography from "../data/hwaseong-map-metadata.json";

export const TOURISM_REGIONS = ["제부도", "궁평항", "국화도", "입파도"] as const;
export type TourismRegion = typeof TOURISM_REGIONS[number];
// Named islands use their original WGS84 polygon centers, identified by the
// guide's island names and north/south locations, not by ranking and guessing.
// 궁평항 is a representative harbor point, not a surveyed project parcel.
const CENTERS: Record<TourismRegion, [number, number]> = {
  제부도: [126.61996914392513, 37.16794090190677],
  궁평항: [126.683, 37.116],
  국화도: [126.55692916127481, 37.06210373671743],
  입파도: [126.53922474495708, 37.10764374760446],
};
const attractionIcons = { harbor: Anchor, heritage: Landmark, church: Church, temple: House, garden: Flower2, park: Trees, fossil: Shell };
const cityBounds = new maplibregl.LngLatBounds(
  [geography.bounds[0], geography.bounds[1]],
  [geography.bounds[2], geography.bounds[3]],
);
export type TourismMapHandle = {
  reset: () => void;
  zoom: (direction: number) => void;
  focus: (regions: TourismRegion[]) => void;
};
type Props = {
  counts: Record<TourismRegion, number>;
  highlights: TourismRegion[];
  onSelect: (region: TourismRegion) => void;
  onZoomChange?: (zoom: number) => void;
};
const GEOGRAPHY_URL = "/maps/hwaseong-20260701.geojson";
const BOUNDARY_ATTRIBUTION = '<a href="https://sgis.kostat.go.kr" target="_blank" rel="noopener noreferrer">SGIS</a> · <a href="https://github.com/vuski/admdongkor" target="_blank" rel="noopener noreferrer">admdongkor</a> (CC BY 4.0)';
// OpenStreetMap Standard tiles require no account or API key.
const tiles = ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"];

const TourismGeographicMap = forwardRef<TourismMapHandle, Props>(function TourismGeographicMap({ counts, highlights, onSelect, onZoomChange }, ref) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markers = useRef<{ region: TourismRegion; button: HTMLButtonElement; marker: maplibregl.Marker }[]>([]);
  const overview = useRef(true);
  const relayout = useRef<() => void>(() => {});
  const callback = useRef(onSelect);
  callback.current = onSelect;
  const zoomCallback = useRef(onZoomChange);
  zoomCallback.current = onZoomChange;
  const [status, setStatus] = useState<"loading" | "ready" | "unavailable" | "error">("loading");
  useEffect(() => { relayout.current(); });
  const duration = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 450;
  useImperativeHandle(ref, () => ({
    reset() { overview.current = true; map.current?.fitBounds(cityBounds, { padding: { top: 55, right: 55, bottom: 55, left: 75 }, duration: duration() }); },
    zoom(direction) { overview.current = false; const instance = map.current; if (instance) instance.easeTo({ zoom: instance.getZoom() + direction, duration: duration() ? 200 : 0 }); },
    focus(regions) {
      if (!regions.length) return;
      overview.current = false;
      const bounds = new maplibregl.LngLatBounds();
      regions.forEach(region => bounds.extend(CENTERS[region]));
      map.current?.fitBounds(bounds, { padding: 100, maxZoom: 12.5, duration: duration() });
    },
  }), []);

  useEffect(() => {
    if (!container.current) return;
    let disposed = false;
    let rasterReady = false;
    let hoveredRegion: TourismRegion | null = null;
    let layoutFrame = 0;
    const scheduleLabels = () => {
      if (layoutFrame) return;
      layoutFrame = requestAnimationFrame(() => { layoutFrame = 0; if (!disposed) relayout.current(); });
    };
    let instance: maplibregl.Map;
    try {
      instance = new maplibregl.Map({
        container: container.current,
        center: [126.84, 37.15], zoom: 10, minZoom: 5, maxZoom: 17,
        dragPan: true, dragRotate: false, touchPitch: false, renderWorldCopies: false,
        attributionControl: { compact: true },
        style: {
          version: 8,
          sources: {
            geography: { type: "geojson", data: GEOGRAPHY_URL, attribution: BOUNDARY_ATTRIBUTION },
            basemap: { type: "raster", tiles, tileSize: 256, attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>' },
          },
          layers: [
            { id: "water", type: "background", paint: { "background-color": "#c9d7d8" } },
            // Locally available real-coordinate context remains if raster tiles
            // are unavailable. It does not masquerade as a complete road map.
            { id: "land-context", type: "fill", source: "geography", filter: ["==", ["get", "kind"], "city"], paint: { "fill-color": "#edece4" } },
            { id: "basemap", type: "raster", source: "basemap", paint: { "raster-fade-duration": 150, "raster-saturation": -.8, "raster-contrast": -.15, "raster-opacity": .7 } },
            // An opaque geographic mask keeps adjacent cities, roads and labels
            // out of the dashboard, without cropping or deforming city geometry.
            { id: "outside-city", type: "fill", source: "geography", filter: ["==", ["get", "kind"], "outside"], paint: { "fill-color": "#c9d7d8", "fill-opacity": 1 } },
            { id: "town-boundaries", minzoom: 11.5, type: "line", source: "geography", filter: ["==", ["get", "kind"], "town"], paint: { "line-color": "#8b9c96", "line-width": .6, "line-opacity": .18 } },
            { id: "district-boundaries", type: "line", source: "geography", filter: ["==", ["get", "kind"], "district"], paint: { "line-color": "#6d8383", "line-width": .9, "line-opacity": .5, "line-dasharray": [4, 3] } },
            { id: "city-boundary", type: "line", source: "geography", filter: ["==", ["get", "kind"], "city"], paint: { "line-color": "#718b88", "line-width": 1.1, "line-opacity": .5 } },
          ],
        },
      });
    } catch { setStatus("error"); return; }
    map.current = instance;
    instance.fitBounds(cityBounds, { padding: { top: 55, right: 55, bottom: 55, left: 75 }, duration: 0 });
    instance.on("movestart", event => { if (event.originalEvent) overview.current = false; });
    instance.on("sourcedata", event => {
      if (event.sourceId === "basemap" && event.tile?.state === "loaded" && !disposed) {
        rasterReady = true;
        setStatus("ready");
        scheduleLabels();
      }
    });
    instance.on("error", event => {
      if (disposed) return;
      if ((event as { sourceId?: string }).sourceId === "geography") setStatus("error");
      else if (!rasterReady) setStatus("unavailable");
    });
    const attractions: { button: HTMLButtonElement; marker: maplibregl.Marker }[] = [];
    const labels: { element: HTMLElement; marker: maplibregl.Marker; district: boolean }[] = [];
    for (const label of geography.labels) {
      const element = document.createElement("span");
      element.className = label.kind === "district" ? "tdb-gu-label" : "tdb-town-label";
      element.textContent = label.name;
      const marker = new maplibregl.Marker({ element }).setLngLat(label.point as [number, number]).addTo(instance);
      element.setAttribute("aria-hidden", "true");
      labels.push({ element, marker, district: label.kind === "district" });
    }
    // Raster tiles already contain their own place names. Avoid painting a
    // second set of administrative names over them. Our project labels get
    // opaque backgrounds and collision-aware positions, anchored to real points.
    const layoutLabels = () => {
      const canvasRect = instance.getCanvas().getBoundingClientRect();
      const viewport = { width: canvasRect.width, height: canvasRect.height };
      const occupied: MapLabelRect[] = [];
      const toRect = (rect: DOMRect): MapLabelRect => ({ x: rect.left - canvasRect.left, y: rect.top - canvasRect.top, width: rect.width, height: rect.height });
      container.current?.parentElement?.querySelectorAll('.tdb-map-key,.tdb-zoom,.tdb-map-selection,.tdb-map-network-note,.tdb-project-previews').forEach(element => occupied.push(toRect(element.getBoundingClientRect())));
      const visibleMarkers = markers.current.filter(item => {
        const point = instance.project(item.marker.getLngLat());
        const inside = point.x >= 0 && point.y >= 0 && point.x <= viewport.width && point.y <= viewport.height;
        if (!inside) item.button.classList.add('is-label-collapsed');
        return inside;
      });
      for (const item of visibleMarkers) {
        const point = instance.project(item.marker.getLngLat());
        occupied.push({ x: point.x - 15, y: point.y - 15, width: 30, height: 30 });
      }
      for (const item of attractions) {
        const point = instance.project(item.marker.getLngLat());
        occupied.push({ x: point.x - 13, y: point.y - 13, width: 26, height: 26 });
      }
      const priority = (region: TourismRegion, button: HTMLElement) => region === hoveredRegion ? 2 : button.classList.contains('is-active') ? 1 : 0;
      for (const item of [...visibleMarkers].sort((a,b)=>priority(b.region,b.button)-priority(a.region,a.button))) {
        const text = item.button.querySelector('span')!;
        const point = instance.project(item.marker.getLngLat());
        const placed = placeMapLabel(point, { width: text.offsetWidth, height: text.offsetHeight }, viewport, occupied, item.button.dataset.labelSide as MapLabelSide | undefined, priority(item.region,item.button) ? [23,45,67,89] : [23]);
        item.button.classList.toggle('is-label-collapsed', !placed);
        if (placed) {
          item.button.dataset.labelSide = placed.side;
          item.button.classList.toggle('is-offset-label', placed.distance > 23);
          item.button.style.setProperty('--tdb-label-gap', `${placed.distance - 14}px`);
          occupied.push(placed.rect);
        }
      }
      for (const item of attractions) {
        const point = instance.project(item.marker.getLngLat());
        const text = item.button.querySelector('span')!;
        const inside = point.x > 10 && point.y > 10 && point.x < viewport.width - 10 && point.y < viewport.height - 10;
        item.button.style.visibility = inside ? 'visible' : 'hidden';
        const placed = inside ? placeMapLabel(point, { width: text.offsetWidth, height: text.offsetHeight }, viewport, occupied, item.button.dataset.labelSide as MapLabelSide | undefined, [23]) : null;
        item.button.classList.toggle('is-label-collapsed', !placed);
        if (placed) {
          item.button.dataset.labelSide = placed.side;
          occupied.push(placed.rect);
        }
      }
      for (const label of labels) {
        const point = instance.project(label.marker.getLngLat());
        const rect = { x: point.x - label.element.offsetWidth / 2, y: point.y - label.element.offsetHeight / 2, width: label.element.offsetWidth, height: label.element.offsetHeight };
        const inside = rect.x > 10 && rect.y > 10 && rect.x + rect.width < viewport.width - 10 && rect.y + rect.height < viewport.height - 10;
        const allowed = !rasterReady && inside && (label.district || instance.getZoom() > 11.5) && !occupied.some(other => mapLabelRectsOverlap(rect, other, 5));
        label.element.style.visibility = allowed ? "visible" : "hidden";
        if (allowed) occupied.push(rect);
      }
    };
    relayout.current = layoutLabels;
    instance.on("move", scheduleLabels);
    instance.on("moveend", () => {
      zoomCallback.current?.(instance.getZoom());
      layoutLabels();
      const center=instance.getCenter();
      const lng=Math.max(cityBounds.getWest(),Math.min(cityBounds.getEast(),center.lng));
      const lat=Math.max(cityBounds.getSouth(),Math.min(cityBounds.getNorth(),center.lat));
      if(Math.abs(center.lng-lng)>1e-7||Math.abs(center.lat-lat)>1e-7)instance.panTo([lng,lat],{duration:duration()?200:0});
    });
    instance.on("load", layoutLabels);
    layoutLabels();
    for (const region of TOURISM_REGIONS) {
      const button = document.createElement("button");
      button.type = "button"; button.className = "tdb-geographic-marker";
      const count = document.createElement("b"); count.textContent = String(counts[region]);
      const label = document.createElement("span"); label.textContent = region;
      button.append(count, label);
      button.onclick = () => callback.current(region);
      button.onmouseenter = button.onfocus = () => { hoveredRegion = region; scheduleLabels(); };
      button.onmouseleave = button.onblur = () => { if (hoveredRegion === region) hoveredRegion = null; scheduleLabels(); };
      const marker = new maplibregl.Marker({ element: button, anchor: "center" }).setLngLat(CENTERS[region]).addTo(instance);
      button.setAttribute("aria-label", `${region} 권역 사업 보기`);
      markers.current.push({ region, button, marker });
    }
    for (const attraction of tourismAttractions) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'tdb-geographic-marker tdb-attraction-marker';
      button.dataset.category = attraction.category;
      const dot = document.createElement('b'); dot.setAttribute('aria-hidden', 'true');
      dot.innerHTML = renderToStaticMarkup(createElement(attractionIcons[attraction.category], { size: 15, strokeWidth: 1.7 }));
      const label = document.createElement('span'); label.textContent = attraction.name;
      button.append(dot, label);
      button.title = `${attraction.name} · 관광안내도 기반 대략 위치`;
      button.onclick = () => {
        overview.current = false;
        instance.easeTo({ center: attraction.point, zoom: Math.max(instance.getZoom(), 12.5), duration: duration() });
      };
      const marker = new maplibregl.Marker({ element: button, anchor: 'center' }).setLngLat(attraction.point).addTo(instance);
      button.setAttribute('aria-label', `${attraction.name} 대략 위치 확대`);
      attractions.push({ button, marker });
    }
    scheduleLabels();
    document.fonts.ready.then(() => { if (!disposed) scheduleLabels(); });
    const resize = new ResizeObserver(() => {
      instance.resize();
      // Flex/grid layout can resize the canvas after initialization. Keep the
      // entire city inside the final viewport until the user pans or zooms.
      if (overview.current) instance.fitBounds(cityBounds, { padding: { top: 55, right: 55, bottom: 55, left: 75 }, duration: 0 });
      layoutLabels();
    });
    resize.observe(container.current);
    const timeout = window.setTimeout(() => { if (!disposed && !rasterReady) setStatus("unavailable"); }, 10000);
    return () => {
      disposed = true; clearTimeout(timeout); cancelAnimationFrame(layoutFrame); relayout.current = () => {}; resize.disconnect();
      attractions.forEach(item => item.marker.remove());
      labels.forEach(label => label.marker.remove());
      markers.current.forEach(marker => marker.marker.remove()); markers.current = [];
      instance.remove(); map.current = null;
    };
  }, []);
  useEffect(() => {
    markers.current.forEach(({ region, button }) => {
      button.classList.toggle("is-active", highlights.includes(region));
      button.setAttribute("aria-pressed", String(highlights.includes(region)));
      button.querySelector("b")!.textContent = String(counts[region]);
    });
    relayout.current();
  }, [counts, highlights]);
  return <>
    <div ref={container} className="tdb-geographic-canvas" aria-label="실제 지형과 행정경계에 기반한 화성시 관광사업 지도" />
    {status === "unavailable" && <div className="tdb-map-network-note">배경지도 연결 지연 · 실제 행정경계 표시 중</div>}
    {status === "error" && <div className="tdb-geographic-status">지도를 불러오지 못했습니다.</div>}
  </>;
});
export default TourismGeographicMap;
