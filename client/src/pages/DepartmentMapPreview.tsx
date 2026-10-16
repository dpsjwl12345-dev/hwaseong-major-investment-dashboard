import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowUpRight, Anchor, Footprints, Leaf, MapPin, ParkingCircle, Route, TrainFront, X, LocateFixed, Search } from "lucide-react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import guOutlines from "../data/hwaseong-gu-outlines.json";
import boundary from "../data/hwaseong-boundary.json";
import coastalPoints from "../data/hwaseong-coastal-points.json";
import dataset from "../data/dashboard_projects.json";
import "./DepartmentMapPreview.css";

type Region = keyof typeof coastalPoints;
const JEBUDO_ROAD_ID = "관광진흥과_총괄데이터.xlsx:Sheet1:10";
const ROAD_SEGMENTS = [
  { number: "①", name: "중로2-3호선", length: 885, width: 15 },
  { number: "③", name: "중로2-2호선", length: 102, width: 15, note: "회전교차로 설치구간" },
  { number: "②", name: "소로1-7호선", length: 71, width: 10 },
  { number: "④", name: "소로1-8호선", length: 308, width: 10 },
  { number: "⑤", name: "소로2-1호선", length: 664, width: 8, note: "일부 구간" },
];
const REGIONS: Region[] = ["제부도", "궁평항", "국화도", "입파도"];
const COLORS: Record<string, string> = { "만세구": "#e3eed9", "효행구": "#f2e4ca", "병점구": "#c9e3eb", "동탄구": "#e4d6eb" };
const projectRegions = (name: string): Region[] => /계류시설/.test(name) ? ["국화도", "입파도"] : /주차장 및 도로/.test(name) ? ["제부도", "궁평항"] : /국화도/.test(name) ? ["국화도"] : /궁평|황금해안길/.test(name) ? ["궁평항"] : ["제부도"];
const kindOf = (name: string) => /열차/.test(name) ? { Icon: TrainFront, label: "관광교통" } : /계류/.test(name) ? { Icon: Anchor, label: "해양레저" } : /주차/.test(name) ? { Icon: ParkingCircle, label: "주차·접근시설" } : /도로/.test(name) ? { Icon: Route, label: "관광도로" } : /데크|해안길/.test(name) ? { Icon: Footprints, label: "해안산책" } : { Icon: Leaf, label: "관광거점" };
// Inverse of the original Mercator projection: preserve geographic positions and proportions.
const lonlat = (x: number, y: number): [number, number] => [
  (x - boundary.translate[0]) / boundary.scale * 180 / Math.PI,
  Math.atan(Math.sinh((boundary.translate[1] - y) / boundary.scale)) * 180 / Math.PI,
];
const ringsFor = (path: string) => path.split("M").filter(Boolean).map(ring => {
  const n = (ring.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number); const points: [number, number][] = [];
  for(let i=0;i+1<n.length;i+=2) points.push(lonlat(n[i],n[i+1]));
  if(points.length) points.push(points[0]); return points;
}).filter(r => r.length >= 4);
const guFeatures: GeoJSON.FeatureCollection = { type: "FeatureCollection", features: Object.entries(guOutlines).map(([name, shape]) => ({ type: "Feature", properties: { name, color: COLORS[name] }, geometry: { type: "MultiPolygon", coordinates: ringsFor(shape.d).map(r => [r]) } })) };
const regionPosition = (region: Region) => lonlat(coastalPoints[region].x * 10, coastalPoints[region].y * boundary.height / 100);
const extent = new maplibregl.LngLatBounds();
guFeatures.features.forEach(feature => { if(feature.geometry.type === "MultiPolygon") feature.geometry.coordinates.forEach(p => p[0].forEach(c => extent.extend(c as [number,number]))); });
REGIONS.forEach(r => extent.extend(regionPosition(r)));
const cityMask: GeoJSON.Feature = {
  type: "Feature", properties: {},
  geometry: { type: "Polygon", coordinates: [
    [[-180,-85],[180,-85],[180,85],[-180,85],[-180,-85]],
    ...ringsFor(boundary.d).map(ring => {
      const area=ring.reduce((sum,p,i)=>{const next=ring[(i+1)%ring.length];return sum+p[0]*next[1]-next[0]*p[1];},0);
      return area>0?[...ring].reverse():ring;
    }),
  ] },
};
const cityBounds = new maplibregl.LngLatBounds(
  [extent.getWest()-.025,extent.getSouth()-.025],
  [extent.getEast()+.025,extent.getNorth()+.025],
);

export default function DepartmentMapPreview() {
  const projects = useMemo(() => dataset.projects.filter(p => p.department === "관광진흥과"), []);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [mapReady, setMapReady] = useState(false);
  const [tileUnavailable, setTileUnavailable] = useState(false);
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markers = useRef<{ region: Region; element: HTMLButtonElement; marker: maplibregl.Marker }[]>([]);
  const selected = projects.find(p => p.id === selectedId);
  const selectedRegions = selected ? projectRegions(selected.project_name) : [];
  const selectedKind = selected ? kindOf(selected.project_name) : null;
  const filtered = projects.filter(p => p.project_name.includes(query.trim()));
  useEffect(() => {
    if (!mapContainer.current) return;
    const instance = new maplibregl.Map({ container: mapContainer.current, center: [126.79,37.17], zoom: 10, maxBounds:cityBounds, pitch: 0, bearing: 0, attributionControl:{compact:true}, style: {
      version:8, sources:{
        basemap:{type:"raster",tiles:["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],tileSize:256,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap contributors</a>'},
        districts:{type:"geojson",data:guFeatures},
        "city-mask":{type:"geojson",data:cityMask},
      }, layers:[
        {id:"sea",type:"background",paint:{"background-color":"#2c8b9a"}},
        {id:"actual-basemap",type:"raster",source:"basemap",paint:{"raster-saturation":-.2,"raster-opacity":.9}},
        {id:"gu-fill",type:"fill",source:"districts",paint:{"fill-color":["get","color"],"fill-opacity":.12}},
        {id:"outside-city",type:"fill",source:"city-mask",paint:{"fill-color":"#15232a","fill-opacity":1}},
        {id:"gu-boundary",type:"line",source:"districts",paint:{"line-color":"#647f75","line-width":1.4,"line-opacity":.5}},
      ]
    }});
    map.current=instance;
    instance.addControl(new maplibregl.NavigationControl({showCompass:false}),"top-right");
    instance.fitBounds(extent,{padding:{top:45,right:45,bottom:60,left:45},duration:0});
    const observer=new ResizeObserver(()=>instance.resize());observer.observe(mapContainer.current);
    instance.on("load",()=>setMapReady(true));
    let fallbackUsed = false;
    instance.on("error",e=>{
      if (!("sourceId" in e) || e.sourceId!=="basemap") return;
      if (!fallbackUsed) {
        fallbackUsed=true;
        const source=instance.getSource("basemap") as maplibregl.RasterTileSource | undefined;
        source?.setTiles(["https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png"]);
        const attribution=instance.getContainer().querySelector(".maplibregl-ctrl-attrib-inner");
        if(attribution) attribution.innerHTML='© OpenStreetMap contributors · © CARTO';
      } else setTileUnavailable(true);
    });
    instance.on("sourcedata",e=>{if(e.sourceId==="basemap" && e.sourceDataType==="content")setTileUnavailable(false);});
    for(const region of REGIONS){
      const button=document.createElement("button");button.type="button";button.className="dmp-region-marker";
      const members=projects.filter(p=>projectRegions(p.project_name).includes(region));
      const count=document.createElement("b");count.textContent=String(members.length);
      const label=document.createElement("span");label.textContent=region==="궁평항"?"궁평 권역":region;
      button.append(count,label);button.setAttribute("aria-label",`${region} 권역 ${members.length}개 사업`);
      button.onclick=()=>{setQuery("");setSelectedId(members[0]?.id ?? null);};
      const marker=new maplibregl.Marker({element:button,anchor:"bottom"}).setLngLat(regionPosition(region)).addTo(instance);
      markers.current.push({region,element:button,marker});
    }
    // The labels follow the same geographic boundary, without skew or decorative displacement.
    Object.entries(guOutlines).forEach(([name,shape])=>{
      const ring=ringsFor(shape.d).sort((a,b)=>b.length-a.length)[0];
      if(!ring)return;
      const xs=ring.map(p=>p[0]),ys=ring.map(p=>p[1]);
      const label=document.createElement("span");label.className="dmp-gu-map-label";label.textContent=name;
      new maplibregl.Marker({element:label}).setLngLat([(Math.min(...xs)+Math.max(...xs))/2,(Math.min(...ys)+Math.max(...ys))/2]).addTo(instance);
    });
    return()=>{observer.disconnect();markers.current=[];map.current=null;instance.remove();};
  },[projects]);
  useEffect(()=>{
    markers.current.forEach(({region,element})=>element.classList.toggle("is-selected",selectedRegions.includes(region)));
    if(selected && map.current){
      const bounds=new maplibregl.LngLatBounds();selectedRegions.forEach(r=>bounds.extend(regionPosition(r)));
      map.current.fitBounds(bounds,{maxZoom:12,padding:{top:100,right:65,bottom:80,left:65},duration:window.matchMedia('(prefers-reduced-motion: reduce)').matches?0:650});
    }
  },[selectedId]);
  return <main className="dmp-page dmp-v3">
    <header className="dmp-header"><a href="/" className="dmp-back"><ArrowLeft size={17}/> 돌아가기</a><div className="dmp-brand"><b>HIB.</b><span>화성시 주요투자사업</span></div><span/></header>
    <section className="dmp-heading"><div><p>TOURISM INVESTMENT MAP</p><h1>관광진흥과 <span>주요투자사업</span></h1></div><div className="dmp-summary"><div className="dmp-project-count"><b>{projects.length}</b><span>개사업</span></div><p className="dmp-tourism-brand">바다를 잇고, 화성을 누리다</p></div></section>
    <section className="dmp-workspace" aria-label="관광진흥과 사업 목록과 지도">
      <aside className="dmp-sidebar"><div className="dmp-sidebar-heading"><h2>전체 사업 <span>{projects.length}</span></h2></div><label className="dmp-search"><Search size={15}/><input aria-label="지도 사업 검색" placeholder="사업명 검색" value={query} onChange={e=>setQuery(e.target.value)}/></label><div className="dmp-business-list">{filtered.map(p=>{const {Icon,label}=kindOf(p.project_name);return <button key={p.id} aria-pressed={selectedId===p.id} className={selectedId===p.id?"is-selected":""} onClick={()=>setSelectedId(p.id)}><span className="dmp-business-icon"><Icon size={24}/></span><span className="dmp-business-copy"><strong>{p.project_name}</strong><span className="dmp-business-kind">{label}</span><span><MapPin size={12}/>{projectRegions(p.project_name).map(r=>r==="궁평항"?"궁평 권역":r).join(" · ")}</span></span><ArrowUpRight size={16}/></button>})}{!filtered.length&&<p className="dmp-no-results">일치하는 사업이 없습니다.</p>}</div></aside>
      <section className="dmp-map" aria-label="관광사업 일반지도"><div ref={mapContainer} className="dmp-real-map"/>
        <div className="dmp-map-caption"><span className="dmp-live"/>{selected?"선택 사업 위치":"전체 사업 분포"}</div>
        <button className="dmp-reset" onClick={()=>{setSelectedId(null);map.current?.fitBounds(extent,{padding:45,duration:500});}}><LocateFixed size={16}/> 전체 보기</button>
        {!mapReady&&<span className="dmp-loading">지도 불러오는 중</span>}
        {tileUnavailable&&<span className="dmp-network-note">배경지도 연결을 확인해 주세요.</span>}
        {!selected&&<div className="dmp-start-hint"><MapPin size={18}/><span>왼쪽 사업명을 선택하세요</span></div>}

        <footer className="dmp-map-footer"><span>마커는 권역 대표 위치 · 부지 경계 아님</span></footer>
      </section>
      <aside className="dmp-progress-panel" aria-label="사업 진척도 및 추진현황">
        <div className="dmp-progress-heading"><span>PROJECT STATUS</span><h2>추진현황</h2>{selected && <button onClick={()=>setSelectedId(null)} aria-label="전체 진척도 보기"><X size={17}/></button>}</div>
        {selected && selectedKind ? <>
          <div className={`dmp-status-project${selectedKind.label === "해안산책" ? " is-walking" : ""}`}><selectedKind.Icon size={32}/><small>{selectedKind.label}</small><h3>{selected.project_name}</h3><p>{selected.current_stage || "추진단계 확인 중"}</p></div>
          <div className="dmp-progress-number"><span>전체 사업 진척도</span>{selected.progress_rate == null ? <strong className="is-unknown">자료 미등록</strong> : <strong>{selected.progress_rate}<small>%</small></strong>}<div className="dmp-status-track" role="progressbar" aria-label="전체 사업 진척도" aria-valuemin={0} aria-valuemax={100} aria-valuenow={selected.progress_rate ?? undefined}><i style={{width:`${Math.max(0,Math.min(100,selected.progress_rate??0))}%`}}/></div></div>
          {selectedId===JEBUDO_ROAD_ID&&<section className="dmp-road-segments"><header><h4>노선별 규모</h4><span>총 2,030m</span></header>{ROAD_SEGMENTS.map(segment=><div key={segment.number}><b>{segment.number}</b><span><strong>{segment.name}</strong>{segment.note&&<small>{segment.note}</small>}</span><em>{segment.length.toLocaleString()}m<small>폭 {segment.width}m</small></em></div>)}<p>노선별 길이·폭은 제공된 사업자료 기준입니다.</p></section>}
          <div className="dmp-status-detail"><h4>위치</h4><p>{selected.overview.split('\n').find(l=>l.includes('사업위치:'))?.replace('○ 사업위치:','').trim() || "세부사업별 위치"}</p></div>
          <div className="dmp-status-detail"><h4>최근 추진경과</h4>{selected.progress_status?.trim() ? selected.progress_status.split('\n').filter(l=>l.trim()).slice(-3).map((line,i)=><p key={i}>{line.replace(/^○\s*/, '')}</p>) : <p>등록된 추진경과가 없습니다.</p>}</div>
          <div className="dmp-status-detail is-next"><h4>향후 추진계획</h4>{selected.future_plan?.trim() ? selected.future_plan.split('\n').filter(l=>l.trim()).slice(0,3).map((line,i)=><p key={i}>{line.replace(/^○\s*/, '')}</p>) : <p>등록된 추진계획이 없습니다.</p>}</div>
        </> : <><p className="dmp-progress-caption">사업을 선택하면 세부 추진현황이 표시됩니다.</p><div className="dmp-progress-overview">{projects.map(project=><button key={project.id} onClick={()=>setSelectedId(project.id)}><span>{project.project_name}</span><b>{project.progress_rate == null ? "미등록" : `${project.progress_rate}%`}</b><div className="dmp-status-track"><i style={{width:`${Math.max(0,Math.min(100,project.progress_rate??0))}%`}}/></div></button>)}</div></>}
        <p className="dmp-progress-basis">진척도는 등록된 사업 자료 기준입니다. 미등록 사업은 0%로 계산하지 않습니다.</p>
      </aside>
    </section>
  </main>;
}
