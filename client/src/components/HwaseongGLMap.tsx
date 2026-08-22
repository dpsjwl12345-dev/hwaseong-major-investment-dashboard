import { useEffect, useRef, useState } from "react";
import { Map as MapLibreMap, Marker, Popup, NavigationControl } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

// CartoDB's free public basemap style — no API key, no account, no domain
// registration. The only thing that leaves the browser is the lon/lat
// center (to fetch map tiles for that area), never the project's address
// text — coordinates come from our own offline dong-centroid data, not from
// geocoding the address through an outside service.
const DARK_STYLE = "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

export function HwaseongGLMap({
  longitude,
  latitude,
  label,
  zoom = 13,
}: {
  longitude: number;
  latitude: number;
  label?: string;
  zoom?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    if (!containerRef.current) return;
    let cancelled = false;
    setStatus("loading");

    const map = new MapLibreMap({
      container: containerRef.current,
      style: DARK_STYLE,
      center: [longitude, latitude],
      zoom,
      attributionControl: { compact: true },
    });
    map.addControl(new NavigationControl({ showCompass: false }), "top-right");

    const marker = new Marker({ color: "#79eef0" }).setLngLat([longitude, latitude]);
    if (label) marker.setPopup(new Popup({ offset: 18, closeButton: false }).setText(label));
    marker.addTo(map);

    map.on("load", () => {
      if (!cancelled) setStatus("ready");
    });
    map.on("error", () => {
      if (!cancelled) setStatus("error");
    });

    return () => {
      cancelled = true;
      map.remove();
    };
  }, [longitude, latitude, zoom, label]);

  return (
    <div className="hwaseong-gl-map">
      <div ref={containerRef} className={`hwaseong-gl-map-canvas ${status === "ready" ? "is-ready" : ""}`} />
      {status !== "ready" && (
        <div className="hwaseong-gl-map-status">
          <span>{status === "error" ? "지도를 불러오지 못했습니다" : "지도 불러오는 중"}</span>
        </div>
      )}
    </div>
  );
}
