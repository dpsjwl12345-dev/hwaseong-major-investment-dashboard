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
const coastBounds: [[number,number],[number,number]] = [[126.515,37.035],[126.745,37.22]];
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
export type TourismMapHandle = { reset:()=>void; zoom:(direction:number)=>void; focus:(regions:TourismRegion[])=>void };
type Props = {counts:Record<TourismRegion,number>; highlights:TourismRegion[]; onSelect:(region:TourismRegion)=>void};

const TourismSatelliteMap = forwardRef<TourismMapHandle,Props>(function TourismSatelliteMap({counts,highlights,onSelect},ref){
  const container=useRef<HTMLDivElement>(null);
  const map=useRef<maplibregl.Map|null>(null);
  const markers=useRef<{region:TourismRegion; marker:maplibregl.Marker; button:HTMLButtonElement}[]>([]);
  const callback=useRef(onSelect); callback.current=onSelect;
  const [status,setStatus]=useState<"loading"|"ready"|"error">("loading");
  const [sourceView,setSourceView]=useState(false);
  useEffect(()=>{if(status==="error")setSourceView(true);},[status]);
  const [imageView,setImageView]=useState({scale:1,x:0,y:0});
  const sourceContainer=useRef<HTMLDivElement>(null);
  useEffect(()=>{
    if(!sourceView){map.current?.resize();return;}
    const element=sourceContainer.current;
    if(!element)return;
    const wheel=(event:WheelEvent)=>{event.preventDefault();setImageView(v=>({...v,scale:Math.max(1,Math.min(5,v.scale*(event.deltaY<0?1.12:1/1.12)))}));};
    element.addEventListener("wheel",wheel,{passive:false});
    return()=>element.removeEventListener("wheel",wheel);
  },[sourceView]);
  const drag=useRef<{x:number;y:number;left:number;top:number}|null>(null);
  const reduced=()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  useImperativeHandle(ref,()=>({
    reset(){setImageView({scale:1,x:0,y:0});map.current?.fitBounds(coastBounds,{padding:65,duration:reduced()?0:450});},
    zoom(direction){if(sourceView)setImageView(v=>({...v,scale:Math.max(1,Math.min(5,v.scale*(direction>0?1.3:1/1.3)))}));else map.current?.easeTo({zoom:map.current.getZoom()+direction,duration:200});},
    focus(regions){if(!regions.length)return;setSourceView(false);const bounds=new maplibregl.LngLatBounds();regions.forEach(region=>bounds.extend(CENTERS[region]));map.current?.fitBounds(bounds,{padding:100,maxZoom:13,duration:reduced()?0:650});},
  }),[sourceView]);
  useEffect(()=>{
    if(!container.current)return;
    let disposed=false;
    let instance:maplibregl.Map;
    try {instance=new maplibregl.Map({container:container.current,center:[126.63,37.13],zoom:10.7,
      minZoom:9,maxZoom:18,maxBounds:[[126.46,36.98],[127.18,37.39]],
      attributionControl:{compact:true},dragRotate:false,touchPitch:false,
      style:{version:8,sources:{imagery:{type:"raster",tiles:["https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"],tileSize:256,maxzoom:19,attribution:'Tiles © Esri, Maxar, Earthstar Geographics'},city:{type:"geojson",data:{type:"Feature",properties:{},geometry:{type:"MultiLineString",coordinates:lines}}}},layers:[
        {id:"sea",type:"background",paint:{"background-color":"#1b2833"}},
        {id:"satellite",type:"raster",source:"imagery",paint:{"raster-saturation":-.15,"raster-brightness-max":.88}},
        {id:"city-boundary",type:"line",source:"city",paint:{"line-color":"#f4ead0","line-width":1.2,"line-opacity":.65}},
      ]},
    });} catch {setStatus("error");return;}
    map.current=instance;
    instance.fitBounds(coastBounds,{padding:65,duration:0});
    instance.on("sourcedata",event=>{if(event.sourceId==='imagery'&&event.sourceDataType==='content'&&event.tile?.state==='loaded'&&!disposed)setStatus("ready");});
    instance.on("error",event=>{if(!disposed)setStatus(value=>value==='ready'?value:'error');});
    for(const region of TOURISM_REGIONS){
      const button=document.createElement('button');button.type='button';button.className='tdb-satellite-marker';button.setAttribute('aria-label',`${region} 권역 사업 보기`);
      const number=document.createElement('b');number.textContent=String(counts[region]);
      const label=document.createElement('span');label.textContent=region;
      button.append(number,label);button.onclick=()=>callback.current(region);
      const marker=new maplibregl.Marker({element:button,anchor:'left'}).setLngLat(CENTERS[region]).addTo(instance);
      markers.current.push({region,button,marker});
    }
    const observer=new ResizeObserver(()=>instance.resize());observer.observe(container.current);
    const timeout=window.setTimeout(()=>{if(!disposed)setStatus(value=>value==='loading'?'error':value);},12000);
    return()=>{disposed=true;clearTimeout(timeout);observer.disconnect();markers.current.forEach(m=>m.marker.remove());markers.current=[];instance.remove();map.current=null;};
  },[]);
  useEffect(()=>{markers.current.forEach(({region,button})=>{button.classList.toggle('is-active',highlights.includes(region));button.setAttribute('aria-pressed',String(highlights.includes(region)));button.querySelector('b')!.textContent=String(counts[region]);});},[highlights,counts]);
  return <>
    <div ref={container} className="tdb-satellite-canvas" aria-label="화성시 서해안 위성지도" style={{display:sourceView?'none':'block'}}/>
    {sourceView&&<div className="tdb-source-view" ref={sourceContainer} onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);drag.current={x:e.clientX,y:e.clientY,left:imageView.x,top:imageView.y};}} onPointerMove={e=>{if(drag.current){const d=drag.current;setImageView(v=>({...v,x:d.left+e.clientX-d.x,y:d.top+e.clientY-d.y}));}}} onPointerUp={()=>{drag.current=null;}} onPointerCancel={()=>{drag.current=null;}}><img src="/renderings/tourism-8/1.png" alt="제부도부터 궁평항까지 주차장과 도로 계획이 표시된 제공자료 위성 위치도" draggable={false} style={{transform:`translate(${imageView.x}px,${imageView.y}px) scale(${imageView.scale})`}}/></div>}
    <div className="tdb-map-mode"><button className={!sourceView?'is-active':''} onClick={()=>setSourceView(false)}>위성지도</button><button className={sourceView?'is-active':''} onClick={()=>setSourceView(true)}>자료 위치도</button></div>
    {!sourceView&&status==='loading'&&<div className="tdb-satellite-status">위성지도 불러오는 중</div>}
    {!sourceView&&status==='error'&&<div className="tdb-satellite-status is-error"><strong>위성지도 연결을 확인해 주세요.</strong><button onClick={()=>setSourceView(true)}>제공자료 위치도 보기</button></div>}
    {sourceView&&<span className="tdb-source-caption">{status==="error"?"위성지도 연결 불가 · 제공자료 위치도 표시 중":"제공자료 · 송교리~궁평 위치도"}</span>}
  </>;
});
export default TourismSatelliteMap;
