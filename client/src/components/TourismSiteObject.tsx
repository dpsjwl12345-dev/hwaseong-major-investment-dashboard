import type { CSSProperties } from "react";
export type TourismObjectKind = "marina"|"rest"|"trail"|"park"|"deck"|"parking"|"tourism"|"road"|"train";
type Block={x:number;y:number;w:number;d:number;h:number;color:string};
const blocks:Record<TourismObjectKind,Block[]>={
  marina:[{x:12,y:27,w:76,d:7,h:4,color:"#b68b55"},{x:18,y:8,w:10,d:21,h:7,color:"#e5e3d6"},{x:47,y:34,w:11,d:22,h:8,color:"#d9d8cc"},{x:74,y:8,w:10,d:21,h:7,color:"#d9d8cc"}],
  rest:[{x:20,y:20,w:56,d:29,h:23,color:"#7eafbc"},{x:12,y:17,w:74,d:9,h:28,color:"#d3c4a5"}],
  trail:[{x:7,y:30,w:90,d:12,h:7,color:"#c6a370"},{x:7,y:28,w:90,d:2,h:13,color:"#d9c29c"},{x:7,y:43,w:90,d:2,h:13,color:"#d9c29c"}],
  deck:[{x:7,y:30,w:90,d:16,h:7,color:"#b38a58"},{x:7,y:28,w:90,d:2,h:14,color:"#d6c4a0"},{x:7,y:46,w:90,d:2,h:14,color:"#d6c4a0"}],
  park:[{x:33,y:24,w:29,d:22,h:18,color:"#d8bd8b"},{x:29,y:20,w:37,d:30,h:22,color:"#699092"}],
  parking:[{x:13,y:15,w:14,d:8,h:6,color:"#bbd1db"},{x:38,y:15,w:14,d:8,h:6,color:"#d6bf91"},{x:63,y:15,w:14,d:8,h:6,color:"#a0b9ac"},{x:13,y:43,w:14,d:8,h:6,color:"#a0b9ac"},{x:38,y:43,w:14,d:8,h:6,color:"#a7bfce"},{x:63,y:43,w:14,d:8,h:6,color:"#cfad91"}],
  tourism:[{x:13,y:18,w:35,d:24,h:30,color:"#bac9cb"},{x:53,y:23,w:31,d:22,h:18,color:"#d8c3a3"}],
  road:[{x:7,y:24,w:90,d:22,h:2,color:"#657580"},{x:7,y:22,w:90,d:3,h:4,color:"#d9d3bf"},{x:7,y:47,w:90,d:3,h:4,color:"#d9d3bf"}],
  train:[{x:12,y:25,w:23,d:18,h:17,color:"#d3ad65"},{x:40,y:25,w:23,d:18,h:15,color:"#8db2ae"},{x:68,y:25,w:23,d:18,h:15,color:"#8db2ae"}],
};
export default function TourismSiteObject({kind}:{kind:TourismObjectKind}) {
  return <div className={`tdb-object-scene object-${kind}`} aria-hidden="true"><div className="tdb-object-stage">
    <div className="tdb-object-ground"/>
    {blocks[kind].map((b,i)=><div key={i} className="tdb-object-block" style={{left:b.x,top:b.y,width:b.w,height:b.d,"--block-height":`${b.h}px`,"--block-color":b.color} as CSSProperties}><i className="object-roof"/><i className="object-front"/><i className="object-side"/></div>)}
    {["park","tourism","rest"].includes(kind)&&[0,1].map(i=><div className="tdb-object-tree" key={i} style={{left:83-i*72,top:46-i*31}}><i/><b/></div>)}
  </div></div>;
}
