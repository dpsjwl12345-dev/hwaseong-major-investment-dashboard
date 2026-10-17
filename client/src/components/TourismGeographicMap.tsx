import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

export const TOURISM_REGIONS = ["제부도", "궁평항", "국화도", "입파도"] as const;
export type TourismRegion = typeof TOURISM_REGIONS[number];
// The supplied tourism guide is an illustrated map. Preserve its geometry and
// island inset, using Mercator only as a zoom/pan canvas, not as GPS data.
const guidePoint=(point:[number,number]):[number,number]=>[
  126.5+(point[0]-240)*.0004,
  Math.atan(Math.sinh(Math.asinh(Math.tan(37.34*Math.PI/180))-(point[1]-20)*.0004*Math.PI/180))*180/Math.PI,
];
const CENTERS:Record<TourismRegion,[number,number]>={
  제부도:guidePoint([322,545]),궁평항:guidePoint([461,747]),
  국화도:guidePoint([316,1122]),입파도:guidePoint([310,1000]),
};
// Render the original PDF map rectangle without tracing, smoothing, recoloring,
// repositioning islands, or stretching its 1543:1178 aspect ratio.
const MAP_CORNERS:[[number,number],[number,number],[number,number],[number,number]]=[guidePoint([240,17]),guidePoint([1783,17]),guidePoint([1783,1195]),guidePoint([240,1195])];
const wholeCityBounds = new maplibregl.LngLatBounds(MAP_CORNERS[3],MAP_CORNERS[1]);
export type TourismMapHandle = { reset:()=>void; zoom:(direction:number)=>void; focus:(regions:TourismRegion[])=>void };
type Props = {counts:Record<TourismRegion,number>; highlights:TourismRegion[]; onSelect:(region:TourismRegion)=>void};

const TourismGeographicMap = forwardRef<TourismMapHandle,Props>(function TourismGeographicMap({counts,highlights,onSelect},ref){
  const container=useRef<HTMLDivElement>(null);
  const map=useRef<maplibregl.Map|null>(null);
  const markers=useRef<{region:TourismRegion; marker:maplibregl.Marker; button:HTMLButtonElement}[]>([]);
  const callback=useRef(onSelect); callback.current=onSelect;
  const [status,setStatus]=useState<"loading"|"ready"|"error">("loading");
  const reduced=()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  useImperativeHandle(ref,()=>({
    reset(){map.current?.fitBounds(wholeCityBounds,{padding:24,duration:reduced()?0:450});},
    zoom(direction){map.current?.easeTo({zoom:map.current.getZoom()+direction,duration:200});},
    focus(regions){if(!regions.length)return;const bounds=new maplibregl.LngLatBounds();regions.forEach(region=>bounds.extend(CENTERS[region]));map.current?.fitBounds(bounds,{padding:100,maxZoom:13,duration:reduced()?0:650});},
  }),[]);
  useEffect(()=>{
    if(!container.current)return;
    let disposed=false;
    let instance:maplibregl.Map;
    try {instance=new maplibregl.Map({container:container.current,center:[126.63,37.13],zoom:10.7,
      minZoom:8,maxZoom:18,dragPan:true,
      attributionControl:{compact:true},dragRotate:false,touchPitch:false,
      style:{version:8,sources:{"original-guide":{type:"image",url:"/maps/hwaseong-tourism-guide-original.png",coordinates:MAP_CORNERS}},layers:[
        {id:"background",type:"background",paint:{"background-color":"#c5d5d6"}},
        {id:"original-guide",type:"raster",source:"original-guide",paint:{"raster-fade-duration":0}},
      ]},
    });} catch {setStatus("error");return;}
    map.current=instance;
    instance.fitBounds(wholeCityBounds,{padding:24,duration:0});
    instance.on("load",()=>{if(!disposed)setStatus("ready");});
    instance.on("error",()=>{if(!disposed)setStatus("error");});
    for(const region of TOURISM_REGIONS){
      const button=document.createElement('button');button.type='button';button.className='tdb-geographic-marker';button.setAttribute('aria-label',`${region} 권역 사업 보기`);
      const number=document.createElement('b');number.textContent=String(counts[region]);
      const label=document.createElement('span');label.textContent=region;
      button.append(number,label);button.onclick=()=>callback.current(region);
      const marker=new maplibregl.Marker({element:button,anchor:'left'}).setLngLat(CENTERS[region]).addTo(instance);
      button.setAttribute('aria-label',`${region} 권역 사업 보기`);
      markers.current.push({region,button,marker});
    }
    const observer=new ResizeObserver(()=>instance.resize());observer.observe(container.current);
    return()=>{disposed=true;observer.disconnect();markers.current.forEach(m=>m.marker.remove());markers.current=[];instance.remove();map.current=null;};
  },[]);
  useEffect(()=>{markers.current.forEach(({region,button})=>{button.classList.toggle('is-active',highlights.includes(region));button.setAttribute('aria-pressed',String(highlights.includes(region)));button.querySelector('b')!.textContent=String(counts[region]);});},[highlights,counts]);
  return <>
    <div ref={container} className="tdb-geographic-canvas" aria-label="화성시 전체 관광사업 권역 지도"/>
    <div className="tdb-map-key"><span><b/>투자사업 권역</span></div>
    {status==='error'&&<div className="tdb-geographic-status">지도 표시를 지원하는 브라우저에서 다시 열어 주세요.</div>}
  </>;
});
export default TourismGeographicMap;
