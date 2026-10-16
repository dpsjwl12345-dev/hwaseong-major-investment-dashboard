import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import boundary from "../data/hwaseong-boundary.json";

export const TOURISM_REGIONS = ["제부도", "궁평항", "국화도", "입파도"] as const;
export type TourismRegion = typeof TOURISM_REGIONS[number];
// Geographic landmark centers, not surveyed project parcels. Keep the island
// names paired with their actual north/south positions (입파도 north of 국화도).
const CENTERS: Record<TourismRegion, [number, number]> = {
  제부도: [126.617, 37.169], 궁평항: [126.682, 37.116],
  국화도: [126.556, 37.061], 입파도: [126.539, 37.106],
};
const SATELLITE_TILES = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
const lines = boundary.d.split("M").filter(Boolean).map(ring => {
  const values = (ring.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number);
  const points: [number,number][]=[];
  for(let i=0;i+1<values.length;i+=2) points.push([
    (values[i]-boundary.translate[0])/boundary.scale*180/Math.PI,
    Math.atan(Math.sinh((boundary.translate[1]-values[i+1])/boundary.scale))*180/Math.PI,
  ]);
  if(points.length) points.push(points[0]);
  return points;
});
const wholeCityBounds = new maplibregl.LngLatBounds();
lines.forEach(ring=>ring.forEach(point=>wholeCityBounds.extend(point)));
Object.values(CENTERS).forEach(point=>wholeCityBounds.extend(point));
export type TourismMapHandle = { reset:()=>void; zoom:(direction:number)=>void; focus:(regions:TourismRegion[])=>void };
type Props = {counts:Record<TourismRegion,number>; highlights:TourismRegion[]; onSelect:(region:TourismRegion)=>void};

const TourismSatelliteMap = forwardRef<TourismMapHandle,Props>(function TourismSatelliteMap({counts,highlights,onSelect},ref){
  const container=useRef<HTMLDivElement>(null);
  const map=useRef<maplibregl.Map|null>(null);
  const markers=useRef<{region:TourismRegion; marker:maplibregl.Marker; button:HTMLButtonElement}[]>([]);
  const callback=useRef(onSelect); callback.current=onSelect;
  const [status,setStatus]=useState<"loading"|"ready"|"error">("loading");
  const retryTimer=useRef<number|undefined>(undefined);
  const reduced=()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  useImperativeHandle(ref,()=>({
    reset(){map.current?.fitBounds(wholeCityBounds,{padding:65,duration:reduced()?0:450});},
    zoom(direction){map.current?.easeTo({zoom:map.current.getZoom()+direction,duration:200});},
    focus(regions){if(!regions.length)return;const bounds=new maplibregl.LngLatBounds();regions.forEach(region=>bounds.extend(CENTERS[region]));map.current?.fitBounds(bounds,{padding:100,maxZoom:13,duration:reduced()?0:650});},
  }),[]);
  useEffect(()=>{
    if(!container.current)return;
    let disposed=false;
    let instance:maplibregl.Map;
    try {instance=new maplibregl.Map({container:container.current,center:[126.63,37.13],zoom:10.7,
      minZoom:9,maxZoom:18,maxBounds:[[126.46,36.98],[127.18,37.39]],
      attributionControl:{compact:true},dragRotate:false,touchPitch:false,
      style:{version:8,sources:{imagery:{type:"raster",tiles:[SATELLITE_TILES],tileSize:256,maxzoom:19,attribution:'Tiles © Esri, Maxar, Earthstar Geographics'},city:{type:"geojson",data:{type:"Feature",properties:{},geometry:{type:"MultiPolygon",coordinates:lines.filter(r=>r.length>=4).map(r=>[r])}}}},layers:[
        {id:"sea",type:"background",paint:{"background-color":"#1b2833"}},
        {id:"land",type:"fill",source:"city",paint:{"fill-color":"#475d70","fill-opacity":1}},
        {id:"satellite",type:"raster",source:"imagery",paint:{"raster-saturation":-.15,"raster-brightness-max":.88}},
        {id:"city-boundary",type:"line",source:"city",paint:{"line-color":"#f4ead0","line-width":1.2,"line-opacity":.65}},
      ]},
    });} catch {setStatus("error");return;}
    map.current=instance;
    instance.fitBounds(wholeCityBounds,{padding:65,duration:0});
    instance.on("sourcedata",event=>{if(event.sourceId==='imagery'&&event.sourceDataType==='content'&&event.tile?.state==='loaded'&&!disposed)setStatus("ready");});
    instance.on("error",event=>{if(!disposed)setStatus(value=>value==='ready'?value:'error');});
    for(const region of TOURISM_REGIONS){
      const button=document.createElement('button');button.type='button';button.className='tdb-satellite-marker';button.setAttribute('aria-label',`${region} 권역 사업 보기`);
      const number=document.createElement('b');number.textContent=String(counts[region]);
      const label=document.createElement('span');label.textContent=region;
      button.append(number,label);button.onclick=()=>callback.current(region);
      const marker=new maplibregl.Marker({element:button,anchor:'left'}).setLngLat(CENTERS[region]).addTo(instance);
      button.setAttribute('aria-label',`${region} 권역 사업 보기`);
      markers.current.push({region,button,marker});
    }
    const observer=new ResizeObserver(()=>instance.resize());observer.observe(container.current);
    const timeout=window.setTimeout(()=>{if(!disposed)setStatus(value=>value==='loading'?'error':value);},12000);
    return()=>{disposed=true;clearTimeout(timeout);clearTimeout(retryTimer.current);observer.disconnect();markers.current.forEach(m=>m.marker.remove());markers.current=[];instance.remove();map.current=null;};
  },[]);
  useEffect(()=>{markers.current.forEach(({region,button})=>{button.classList.toggle('is-active',highlights.includes(region));button.setAttribute('aria-pressed',String(highlights.includes(region)));button.querySelector('b')!.textContent=String(counts[region]);});},[highlights,counts]);
  const retry=()=>{
    const source=map.current?.getSource('imagery') as maplibregl.RasterTileSource|undefined;
    if(!source)return;
    setStatus('loading');
    source.setTiles([`${SATELLITE_TILES}?retry=${Date.now()}`]);
    clearTimeout(retryTimer.current);
    retryTimer.current=window.setTimeout(()=>setStatus(value=>value==='loading'?'error':value),12000);
  };
  return <>
    <div ref={container} className="tdb-satellite-canvas" aria-label="화성시 전체 관광사업 권역 지도"/>
    {status==='loading'&&<div className="tdb-satellite-status">위성영상 불러오는 중 · 전체 사업 권역 표시</div>}
    {status==='error'&&<div className="tdb-satellite-status is-error"><strong>위성영상 연결 불가 · 화성시 경계와 전체 사업 권역 표시 중</strong><button onClick={retry}>위성영상 다시 연결</button></div>}
  </>;
});
export default TourismSatelliteMap;
