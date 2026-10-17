import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { TourismLandmarkArt } from "./TourismLandmarkArt";
import { tourismLandmarks } from "../data/tourism-landmarks";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import guideRoads from "../data/tourism-guide-roads.json";
import guideOutline from "../data/tourism-guide-outline.json";

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
const districtColors:Record<string,string>={만세구:"#ece9df",효행구:"#ece9df",병점구:"#ece9df",동탄구:"#ece9df"};
const districtShapes:Record<string,[number,number][]>=Object.fromEntries(Object.entries(guideOutline.districts).map(([name,points])=>[name,points.map(point=>guidePoint(point as [number,number]))]));
const lines=Object.values(districtShapes).map(ring=>[...ring,ring[0]]);
const districts:GeoJSON.FeatureCollection={type:"FeatureCollection",features:Object.entries(districtShapes).map(([name,ring])=>({type:"Feature",properties:{name,color:districtColors[name]},geometry:{type:"Polygon",coordinates:[[...ring,ring[0]]]}}))};
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
      minZoom:8,maxZoom:18,dragPan:true,
      attributionControl:{compact:true},dragRotate:false,touchPitch:false,
      style:{version:8,sources:{city:{type:"geojson",data:{type:"Feature",properties:{},geometry:{type:"MultiPolygon",coordinates:lines.filter(r=>r.length>=4).map(r=>[r])}}},districts:{type:"geojson",data:districts},roads:{type:"geojson",data:{type:"Feature",properties:{},geometry:{type:"MultiLineString",coordinates:guideRoads.lines.map(line=>line.map(point=>guidePoint(point as [number,number])))}}},"main-roads":{type:"geojson",data:{type:"Feature",properties:{},geometry:{type:"MultiLineString",coordinates:guideRoads.majorLines.map(line=>line.map(point=>guidePoint(point as [number,number])))}}},"island-points":{type:"geojson",data:{type:"FeatureCollection",features:(["국화도","입파도"] as TourismRegion[]).map(region=>({type:"Feature",properties:{},geometry:{type:"Point",coordinates:CENTERS[region]}}))}}},layers:[
        {id:"sea",type:"background",paint:{"background-color":"#c5d5d6"}},
        {id:"land",type:"fill",source:"city",paint:{"fill-color":"#ece9df","fill-opacity":1}},
        {id:"district-land",type:"fill",source:"districts",paint:{"fill-color":["get","color"],"fill-opacity":1}},
        {id:"islands",type:"circle",source:"island-points",paint:{"circle-radius":7,"circle-color":"#ece9df","circle-stroke-color":"#c8c2a7","circle-stroke-width":1}},
        {id:"roads-casing",type:"line",source:"roads",layout:{"line-cap":"round","line-join":"round"},paint:{"line-color":"#d9d5ca","line-width":["interpolate",["linear"],["zoom"],8,1,12,4],"line-opacity":.55}},
        {id:"roads",type:"line",source:"roads",layout:{"line-cap":"round","line-join":"round"},paint:{"line-color":"#ffffff","line-width":["interpolate",["linear"],["zoom"],8,.6,12,2.6],"line-opacity":.95}},
        {id:"main-roads-case",type:"line",source:"main-roads",layout:{"line-cap":"round","line-join":"round"},paint:{"line-color":"#c9c5b8","line-width":["interpolate",["linear"],["zoom"],8,1.5,12,5],"line-opacity":.65}},
        {id:"main-roads",type:"line",source:"main-roads",layout:{"line-cap":"round","line-join":"round"},paint:{"line-color":"#fffdf4","line-width":["interpolate",["linear"],["zoom"],8,.8,12,3.3]}},
        {id:"district-boundaries",type:"line",source:"districts",paint:{"line-color":"#9aa6a1","line-width":1.3,"line-opacity":.8,"line-dasharray":[3,2]}},
        {id:"city-boundary",type:"line",source:"city",paint:{"line-color":"#adb9b2","line-width":1,"line-opacity":.75}},
      ]},
    });} catch {setStatus("error");return;}
    map.current=instance;
    instance.fitBounds(wholeCityBounds,{padding:65,duration:0});
    instance.on("load",()=>{if(!disposed)setStatus("ready");});
    instance.on("error",()=>{if(!disposed)setStatus("error");});
    const districtMarkers:maplibregl.Marker[]=[];
    const artRoots:ReturnType<typeof createRoot>[]=[];
    const popups:maplibregl.Popup[]=[];
    const districtNames:Record<string,[number,number]>={만세구:[750,810],효행구:[1080,500],병점구:[1450,365],동탄구:[1680,475]};
    for(const [name,point] of Object.entries(districtNames)){
      const label=document.createElement('span');label.className='tdb-gu-label';label.textContent=name;
      const marker=new maplibregl.Marker({element:label}).setLngLat(guidePoint(point)).addTo(instance);
      label.setAttribute('aria-hidden','true');districtMarkers.push(marker);
    }
    const towns:Record<string,[number,number]>={송산면:[600,310],마도면:[700,460],남양읍:[820,300],서신면:[610,585],우정읍:[760,750],장안면:[850,1020],비봉면:[995,235],매송면:[1145,180],봉담읍:[1170,320],팔탄면:[975,600],정남면:[1260,540],향남읍:[1110,700],양감면:[1190,875]};
    const townLabels:HTMLElement[]=[];
    for(const [name,point] of Object.entries(towns)){
      const label=document.createElement('span');label.className='tdb-town-label';label.textContent=name;
      const marker=new maplibregl.Marker({element:label}).setLngLat(guidePoint(point)).addTo(instance);
      label.setAttribute('aria-hidden','true');districtMarkers.push(marker);townLabels.push(label);
    }
    const updateTownLabels=()=>townLabels.forEach(label=>{label.style.visibility=instance.getZoom()>=9.8?'visible':'hidden';});
    instance.on('zoom',updateTownLabels);updateTownLabels();
    for(const landmark of tourismLandmarks){
      const element=document.createElement('button');element.type='button';element.className=`tdb-landmark is-${landmark.kind}`;
      const art=document.createElement('span');art.className='tdb-landmark-art';
      const root=createRoot(art);root.render(<TourismLandmarkArt kind={landmark.kind}/>);artRoots.push(root);
      const name=document.createElement('span');name.className='tdb-landmark-name';name.textContent=landmark.name;
      element.append(art,name);
      const marker=new maplibregl.Marker({element,anchor:'bottom'}).setLngLat(guidePoint(landmark.point)).addTo(instance);
      element.setAttribute('aria-label',`${landmark.name} 관광명소 정보`);
      const content=document.createElement('div');const heading=document.createElement('strong');heading.textContent=landmark.name;
      const category=document.createElement('small');category.textContent=landmark.category;
      const text=document.createElement('p');text.textContent=landmark.description;
      content.append(category,heading,text);
      const popup=new maplibregl.Popup({offset:32,closeButton:true,closeOnClick:true,className:'tdb-landmark-popup',maxWidth:'240px'}).setDOMContent(content);
      marker.setPopup(popup);districtMarkers.push(marker);popups.push(popup);
    }
    for(const region of TOURISM_REGIONS){
      const button=document.createElement('button');button.type='button';button.className='tdb-geographic-marker';button.setAttribute('aria-label',`${region} 권역 사업 보기`);
      const number=document.createElement('b');number.textContent=String(counts[region]);
      const art=document.createElement('i');art.className='tdb-region-art';const root=createRoot(art);root.render(<TourismLandmarkArt kind={region==='궁평항'?'harbor':'island'}/>);artRoots.push(root);
      const label=document.createElement('span');label.textContent=region;
      button.append(art,number,label);button.onclick=()=>callback.current(region);
      const marker=new maplibregl.Marker({element:button,anchor:'left'}).setLngLat(CENTERS[region]).addTo(instance);
      button.setAttribute('aria-label',`${region} 권역 사업 보기`);
      markers.current.push({region,button,marker});
    }
    const observer=new ResizeObserver(()=>instance.resize());observer.observe(container.current);
    return()=>{disposed=true;popups.forEach(p=>p.remove());artRoots.forEach(root=>root.unmount());districtMarkers.forEach(m=>m.remove());observer.disconnect();markers.current.forEach(m=>m.marker.remove());markers.current=[];instance.remove();map.current=null;};
  },[]);
  useEffect(()=>{markers.current.forEach(({region,button})=>{button.classList.toggle('is-active',highlights.includes(region));button.setAttribute('aria-pressed',String(highlights.includes(region)));button.querySelector('b')!.textContent=String(counts[region]);});},[highlights,counts]);
  return <>
    <div ref={container} className="tdb-geographic-canvas" aria-label="화성시 전체 관광사업 권역 지도"/>
    <div className="tdb-map-key"><span><i/>관광명소</span><span><b/>투자사업 권역</span></div>
    <div className="tdb-map-watermark" aria-hidden="true">WEST SEA<span>서해</span></div>
    {status==='error'&&<div className="tdb-geographic-status">지도 표시를 지원하는 브라우저에서 다시 열어 주세요.</div>}
  </>;
});
export default TourismGeographicMap;
