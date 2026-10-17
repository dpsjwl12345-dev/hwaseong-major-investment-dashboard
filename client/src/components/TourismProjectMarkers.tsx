import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import maplibregl from "maplibre-gl";
import TourismSiteObject, { type TourismObjectKind } from "./TourismSiteObject";
import { placeMapLabel, mapLabelRectsOverlap, type MapLabelRect } from "../lib/mapLabelLayout";

export type TourismMapSite = {
  key: string; projectId: string; number: number; name: string; label: string;
  feature: string; kind: TourismObjectKind; point: [number, number];
};
type Entry = { site: TourismMapSite; element: HTMLDivElement; marker: maplibregl.Marker };
export default function TourismProjectMarkers({map,sites,activeId,activeSiteKey,onSelect}:{map:maplibregl.Map|null;sites:TourismMapSite[];activeId:string|null;activeSiteKey:string|null;onSelect:(site:TourismMapSite)=>void}) {
  const [entries,setEntries]=useState<Entry[]>([]);
  const active=useRef(activeSiteKey); active.current=activeSiteKey;
  const layout=useRef<()=>void>(()=>{});
  useEffect(()=>{
    if(!map)return;
    const items=sites.map(site=>{
      const element=document.createElement("div");element.className="tdb-site-marker";
      const marker=new maplibregl.Marker({element,anchor:"center"}).setLngLat(site.point).addTo(map);
      return {site,element,marker};
    });
    setEntries(items);
    let frame=0;let disposed=false;
    const arrange=()=>{
      const canvas=map.getCanvas().getBoundingClientRect();
      const viewport={width:canvas.width,height:canvas.height};
      const occupied:MapLabelRect[]=[];
      const visible=items.filter(item=>{
        const p=map.project(item.site.point);const inside=p.x>12&&p.y>12&&p.x<viewport.width-12&&p.y<viewport.height-12;
        item.element.style.visibility=inside?"visible":"hidden";
        item.element.classList.toggle("is-selected",item.site.key===active.current);
        item.element.classList.remove("is-expanded");

        return inside;
      });
      // Spread only the screen symbols, never their geographic coordinates.
      // A tether keeps the geographic anchor visible when close sites overlap.
      for(const item of visible){
        const p=map.project(item.site.point);
        const candidates:[[number,number],...[number,number][]]=[[0,0]];
        for(const radius of [34,60,86])for(let i=0;i<12;i++){const a=i*Math.PI/6;candidates.push([Math.cos(a)*radius,Math.sin(a)*radius]);}
        const offset=candidates.find(([x,y])=>{const r={x:p.x+x-14,y:p.y+y-14,width:28,height:28};return r.x>6&&r.y>6&&r.x+28<viewport.width-6&&r.y+28<viewport.height-6&&!occupied.some(o=>mapLabelRectsOverlap(r,o,3));})??[0,0];
        item.marker.setOffset(offset);
        item.element.style.setProperty("--tether-length",`${Math.hypot(...offset)}px`);
        item.element.style.setProperty("--tether-angle",`${Math.atan2(-offset[1],-offset[0])}rad`);
        occupied.push({x:p.x+offset[0]-14,y:p.y+offset[1]-14,width:28,height:28});
      }
      if(map.getZoom()<12)return;
      visible.sort((a,b)=>Number(b.site.key===active.current)-Number(a.site.key===active.current));
      for(const item of visible){
        const card=item.element.querySelector<HTMLElement>(".tdb-site-object");if(!card)continue;
        const projected=map.project(item.site.point);const offset=item.marker.getOffset();const p={x:projected.x+offset.x,y:projected.y+offset.y};
        const placed=placeMapLabel(p,{width:card.offsetWidth,height:card.offsetHeight},viewport,occupied,"top",[30,65,105]);
        if(!placed)continue;
        const end={x:Math.max(placed.rect.x,Math.min(p.x,placed.rect.x+placed.rect.width)),y:Math.max(placed.rect.y,Math.min(p.y,placed.rect.y+placed.rect.height))};
        item.element.style.setProperty("--object-link-length",`${Math.hypot(end.x-p.x,end.y-p.y)}px`);
        item.element.style.setProperty("--object-link-angle",`${Math.atan2(end.y-p.y,end.x-p.x)}rad`);
        card.style.left=`${placed.rect.x-p.x+14}px`;card.style.top=`${placed.rect.y-p.y+14}px`;
        item.element.classList.add("is-expanded");occupied.push(placed.rect);
      }
    };
    const schedule=()=>{if(disposed)return;if(!frame)frame=requestAnimationFrame(()=>{frame=0;arrange();});};
    layout.current=schedule;
    map.on("move",schedule);map.on("resize",schedule);
    document.fonts.ready.then(schedule);schedule();
    return ()=>{disposed=true;cancelAnimationFrame(frame);layout.current=()=>{};map.off("move",schedule);map.off("resize",schedule);items.forEach(i=>i.marker.remove());};
  },[map,sites]);
  useEffect(()=>{layout.current();},[activeId,activeSiteKey,entries]);
  return <>{entries.map(({site,element})=>createPortal(<>
    <i className="tdb-object-link" aria-hidden="true"/>
    <i className="tdb-site-tether" aria-hidden="true"/>
    <button className="tdb-site-pin" aria-label={`${site.label} 사업 위치 확대`} aria-pressed={activeSiteKey===site.key} onClick={()=>onSelect(site)} title={site.label}><b>{site.number}</b></button>
    <button className="tdb-site-object" aria-label={`${site.label} 사업 오브젝트 선택`} onClick={()=>onSelect(site)}>
      <TourismSiteObject kind={site.kind}/>
      <strong>{site.name}</strong>{site.label!==site.name&&<small>{site.label}</small>}<p>{site.feature}</p>
    </button>
  </>,element,site.key))}</>;
}
