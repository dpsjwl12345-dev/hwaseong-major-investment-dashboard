import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import guOutlines from "../data/hwaseong-gu-outlines.json";
import boundary from "../data/hwaseong-boundary.json";

export const TOURISM_REGIONS = ["제부도", "궁평항", "국화도", "입파도"] as const;
export type TourismRegion = typeof TOURISM_REGIONS[number];
// Geographic landmark centers, not surveyed project parcels. Keep the island
// names paired with their actual north/south positions (입파도 north of 국화도).
const CENTERS: Record<TourismRegion, [number, number]> = {
  제부도: [126.617, 37.169], 궁평항: [126.682, 37.116],
  국화도: [126.556, 37.061], 입파도: [126.539, 37.106],
};
const ringsFor = (path:string) => path.split("M").filter(Boolean).map(ring => {
  const values = (ring.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number);
  const points: [number,number][]=[];
  for(let i=0;i+1<values.length;i+=2) points.push([
    (values[i]-boundary.translate[0])/boundary.scale*180/Math.PI,
    Math.atan(Math.sinh((boundary.translate[1]-values[i+1])/boundary.scale))*180/Math.PI,
  ]);
  if(points.length) points.push(points[0]);
  return points;
});
const lines=ringsFor(boundary.d);
const districts:GeoJSON.FeatureCollection={type:"FeatureCollection",features:Object.entries(guOutlines).map(([name,shape])=>({type:"Feature",properties:{name},geometry:{type:"MultiPolygon",coordinates:ringsFor(shape.d).filter(r=>r.length>=4).map(r=>[r])}}))};
const wholeCityBounds = new maplibregl.LngLatBounds();
lines.forEach(ring=>ring.forEach(point=>wholeCityBounds.extend(point)));
Object.values(CENTERS).forEach(point=>wholeCityBounds.extend(point));
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
      style:{version:8,sources:{city:{type:"geojson",data:{type:"Feature",properties:{},geometry:{type:"MultiPolygon",coordinates:lines.filter(r=>r.length>=4).map(r=>[r])}}},districts:{type:"geojson",data:districts}},layers:[
        {id:"sea",type:"background",paint:{"background-color":"#1b2833"}},
        {id:"land",type:"fill",source:"city",paint:{"fill-color":"#475d70","fill-opacity":1}},
        {id:"district-boundaries",type:"line",source:"districts",paint:{"line-color":"#aab8c9","line-width":1,"line-opacity":.45}},
        {id:"city-boundary",type:"line",source:"city",paint:{"line-color":"#f4ead0","line-width":1.2,"line-opacity":.65}},
      ]},
    });} catch {setStatus("error");return;}
    map.current=instance;
    instance.fitBounds(wholeCityBounds,{padding:65,duration:0});
    instance.on("load",()=>{if(!disposed)setStatus("ready");});
    instance.on("error",()=>{if(!disposed)setStatus("error");});
    const districtMarkers:maplibregl.Marker[]=[];
    for(const [name,shape] of Object.entries(guOutlines)){
      const rings=ringsFor(shape.d);
      const ring=rings.reduce((best,current)=>current.length>best.length?current:best,[] as [number,number][]);
      if(!ring.length)continue;
      let area=0,x=0,y=0;
      for(let i=0;i<ring.length-1;i++){const a=ring[i],b=ring[i+1],cross=a[0]*b[1]-b[0]*a[1];area+=cross;x+=(a[0]+b[0])*cross;y+=(a[1]+b[1])*cross;}
      if(!area)continue;
      const label=document.createElement('span');label.className='tdb-gu-label';label.textContent=name;
      const marker=new maplibregl.Marker({element:label}).setLngLat([x/(3*area),y/(3*area)]).addTo(instance);
      label.setAttribute('aria-hidden','true');districtMarkers.push(marker);
    }
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
    return()=>{disposed=true;districtMarkers.forEach(m=>m.remove());observer.disconnect();markers.current.forEach(m=>m.marker.remove());markers.current=[];instance.remove();map.current=null;};
  },[]);
  useEffect(()=>{markers.current.forEach(({region,button})=>{button.classList.toggle('is-active',highlights.includes(region));button.setAttribute('aria-pressed',String(highlights.includes(region)));button.querySelector('b')!.textContent=String(counts[region]);});},[highlights,counts]);
  return <>
    <div ref={container} className="tdb-geographic-canvas" aria-label="화성시 전체 관광사업 권역 지도"/>
    {status==='error'&&<div className="tdb-geographic-status">지도 표시를 지원하는 브라우저에서 다시 열어 주세요.</div>}
  </>;
});
export default TourismGeographicMap;
