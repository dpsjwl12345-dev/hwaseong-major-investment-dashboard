import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import maplibregl from "maplibre-gl";
import TourismSiteObject, { type TourismObjectKind } from "./TourismSiteObject";
import { mapLabelRectsOverlap, type MapLabelRect } from "../lib/mapLabelLayout";

export type TourismMapSite = {
  key: string; projectId: string; number: number; name: string; label: string;
  kind: TourismObjectKind; point: [number, number];
};
type Entry = { site: TourismMapSite; element: HTMLDivElement; marker: maplibregl.Marker };
export default function TourismProjectMarkers({map,sites,activeId,activeSiteKey,onSelect}:{map:maplibregl.Map|null;sites:TourismMapSite[];activeId:string|null;activeSiteKey:string|null;onSelect:(site:TourismMapSite)=>void}) {
  const [entries,setEntries]=useState<Entry[]>([]);
  const active=useRef(activeSiteKey); active.current=activeSiteKey;
  const layout=useRef<()=>void>(()=>{});
  useEffect(()=>{
    if(!map)return;
    const items=sites.map(site=>{
      const element=document.createElement("div");element.className="tdb-site-marker";element.dataset.kind=site.kind;
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
        const p=map.project(item.site.point);const inside=p.x>24&&p.y>24&&p.x<viewport.width-24&&p.y<viewport.height-38;
        item.element.style.visibility=inside?"visible":"hidden";
        item.element.classList.toggle("is-selected",item.site.key===active.current);
        item.element.classList.remove("is-expanded");

        return inside;
      });
      visible.sort((a,b)=>Number(b.site.key===active.current)-Number(a.site.key===active.current));
      // Spread only the screen symbols, never their geographic coordinates.
      for(const item of visible){
        const p=map.project(item.site.point);
        const candidates:[[number,number],...[number,number][]]=[[0,0]];
        for(const radius of [34,60,86])for(let i=0;i<12;i++){const a=i*Math.PI/6;candidates.push([Math.cos(a)*radius,Math.sin(a)*radius]);}
        const offset=candidates.find(([x,y])=>{const r={x:p.x+x-23,y:p.y+y-23,width:64,height:70};return r.x>6&&r.y>6&&r.x+64<viewport.width-6&&r.y+70<viewport.height-6&&!occupied.some(o=>mapLabelRectsOverlap(r,o,3));})??[0,0];
        item.marker.setOffset(offset);
        occupied.push({x:p.x+offset[0]-23,y:p.y+offset[1]-23,width:64,height:70});
        if(item.site.key===active.current)occupied.push({x:p.x+offset[0]-105,y:p.y+offset[1]+(item.site.kind==="train"?-72:42),width:210,height:42});
      }
      if(map.getZoom()<12)return;
      visible.sort((a,b)=>Number(b.site.key===active.current)-Number(a.site.key===active.current));
      for(const item of visible){
        const card=item.element.querySelector<HTMLElement>(".tdb-site-object");if(!card)continue;
        const projected=map.project(item.site.point);const offset=item.marker.getOffset();const p={x:projected.x+offset.x,y:projected.y+offset.y};
        // Keep the object directly over its numbered pin; never shift it sideways.
        const rect={x:p.x-card.offsetWidth/2,y:item.site.kind==="train"?p.y+46:p.y-30-card.offsetHeight,width:card.offsetWidth,height:card.offsetHeight};
        const inside=rect.x>=6&&rect.y>=6&&rect.x+rect.width<=viewport.width-6&&rect.y+rect.height<=viewport.height-6;
        const blocked=occupied.some(other=>mapLabelRectsOverlap(rect,other,3));
        if(!inside||(blocked&&item.site.key!==active.current))continue;
        card.style.left=`${14-card.offsetWidth/2}px`;card.style.top=item.site.kind==="train"?"60px":`${-16-card.offsetHeight}px`;
        item.element.classList.add("is-expanded");occupied.push(rect);
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
    <button className="tdb-site-pin" aria-label={`${site.label} 사업 위치 확대`} aria-pressed={activeSiteKey===site.key} onClick={()=>onSelect(site)} title={site.label}>
      <svg className="tdb-investment-pin-shape" viewBox="0 0 28 34" aria-hidden="true"><path fillRule="evenodd" d="M14 2C7.9 2 3 6.8 3 12.8c0 7.1 8.4 16.4 10.1 18.1a1.3 1.3 0 0 0 1.8 0C16.6 29.2 25 19.9 25 12.8 25 6.8 20.1 2 14 2ZM14 8.3a4.2 4.2 0 1 1 0 8.4 4.2 4.2 0 0 1 0-8.4Z" fill="currentColor"/></svg>
      <b>{site.number}</b>
    </button>
    <button className="tdb-site-object" aria-label={`${site.label} 사업 오브젝트 선택`} onClick={()=>onSelect(site)}>
      <TourismSiteObject kind={site.kind}/>
    </button>
    <strong className="tdb-site-name">{site.name}</strong>
  </>,element,site.key))}</>;
}
