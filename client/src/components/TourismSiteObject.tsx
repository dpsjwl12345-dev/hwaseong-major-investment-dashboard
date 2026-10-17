import type { CSSProperties } from "react";
export type TourismObjectKind = "marina"|"rock"|"rest"|"trail"|"park"|"deck"|"parking"|"tourism"|"road"|"train";
type Block={x:number;y:number;w:number;d:number;h:number;color:string};
const blocks:Record<TourismObjectKind,Block[]>={
  marina:[{x:12,y:27,w:76,d:7,h:4,color:"#b68b55"},{x:18,y:8,w:10,d:21,h:7,color:"#e5e3d6"},{x:47,y:34,w:11,d:22,h:8,color:"#d9d8cc"},{x:74,y:8,w:10,d:21,h:7,color:"#d9d8cc"}],
  rock:[{x:18,y:22,w:23,d:18,h:39,color:"#9a7554"},{x:49,y:29,w:17,d:15,h:27,color:"#927057"},{x:75,y:35,w:12,d:12,h:19,color:"#b08c62"}],
  rest:[{x:20,y:20,w:56,d:29,h:23,color:"#418bad"},{x:12,y:17,w:74,d:9,h:28,color:"#cc9a44"}],
  trail:[{x:7,y:30,w:90,d:12,h:7,color:"#c08b45"},{x:7,y:28,w:90,d:2,h:13,color:"#d9c29c"},{x:7,y:43,w:90,d:2,h:13,color:"#d9c29c"}],
  deck:[{x:7,y:30,w:90,d:16,h:7,color:"#a76e2c"},{x:7,y:28,w:90,d:2,h:14,color:"#d6c4a0"},{x:7,y:46,w:90,d:2,h:14,color:"#d6c4a0"}],
  park:[{x:6,y:29,w:92,d:12,h:9,color:"#ba8242"},{x:23,y:25,w:4,d:4,h:35,color:"#e5d8b3"},{x:23,y:43,w:4,d:4,h:35,color:"#e5d8b3"},{x:75,y:25,w:4,d:4,h:35,color:"#e5d8b3"},{x:75,y:43,w:4,d:4,h:35,color:"#e5d8b3"}],
  parking:[{x:13,y:15,w:14,d:8,h:6,color:"#367faf"},{x:38,y:15,w:14,d:8,h:6,color:"#e4a632"},{x:63,y:15,w:14,d:8,h:6,color:"#378c76"},{x:13,y:43,w:14,d:8,h:6,color:"#378c76"},{x:38,y:43,w:14,d:8,h:6,color:"#508cae"},{x:63,y:43,w:14,d:8,h:6,color:"#cc7951"}],
  tourism:[{x:13,y:18,w:35,d:24,h:30,color:"#6199af"},{x:53,y:23,w:31,d:22,h:18,color:"#cfa154"}],
  road:[{x:7,y:24,w:90,d:22,h:2,color:"#657580"},{x:7,y:22,w:90,d:3,h:4,color:"#d9d3bf"},{x:7,y:47,w:90,d:3,h:4,color:"#d9d3bf"}],
  train:[{x:8,y:25,w:25,d:18,h:14,color:"#e6a52a"},{x:8,y:25,w:13,d:18,h:23,color:"#e6a52a"},{x:27,y:29,w:5,d:6,h:24,color:"#5a6b70"},{x:38,y:25,w:25,d:18,h:17,color:"#278c87"},{x:69,y:25,w:25,d:18,h:17,color:"#278c87"}],
};
export default function TourismSiteObject({kind}:{kind:TourismObjectKind}) {
  return <div className={`tdb-object-scene object-${kind}`} aria-hidden="true"><div className="tdb-object-stage">
    <div className="tdb-object-ground"/>
    {blocks[kind].map((b,i)=><div key={i} className="tdb-object-block" style={{left:b.x,top:b.y,width:b.w,height:b.d,"--block-height":`${b.h}px`,"--block-color":b.color} as CSSProperties}><i className="object-roof"/><i className="object-front"/><i className="object-side"/></div>)}
    {kind==="park"&&<><div className="object-bridge-island island-west"/><div className="object-bridge-island island-east"/>{[0,1].map(i=><svg key={i} className={`object-bridge-cables cable-${i}`} viewBox="0 0 104 28"><path d="M2 23 L25 2 Q51 25 77 2 L102 23" fill="none" stroke="#8c6331" strokeWidth="1.5"/>{[11,18,25,32,39,46,53,60,67,77,84,91].map(x=><path key={x} d={`M${x} ${x<25?23-(x-2)*21/23:x>77?2+(x-77)*21/25:2+23*(1-Math.pow((x-51)/26,2))/2} V27`} stroke="#b99357" strokeWidth=".7"/>)}</svg>)}{[23,75].map(x=><i key={x} className="object-bridge-tower-top" style={{left:x}}/>)}</>}
    {kind==="train"&&<><div className="object-train-coupling"/>{[12,27,42,57,73,88].map(x=><i key={x} className="object-train-wheel" style={{left:x}}/>)}</>}
    {kind==="parking"&&<><div className="object-parking-lines"/><div className="object-parking-sign"><span className="parking-sign-front">P</span><span className="parking-sign-back">P</span></div></>}
    {kind==="marina"&&[19,48,75].map((x,i)=><i key={x} className="object-yacht-sail" style={{left:x,top:i===1?44:19}}/>)}
    {kind==="road"&&<div className="object-road-markings"/>}
    {["deck","trail"].includes(kind)&&[13,35,57,79].map(x=><i key={x} className="object-railing-post" style={{left:x}}/>)}
    {["park","tourism","rest"].includes(kind)&&[0,1].map(i=><div className="tdb-object-tree" key={i} style={{left:83-i*72,top:46-i*31}}><i/><b/></div>)}
  </div></div>;
}
