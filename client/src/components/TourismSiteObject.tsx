import type { CSSProperties } from "react";
export type TourismObjectKind = "marina"|"rock"|"rest"|"trail"|"park"|"deck"|"parking"|"tourism"|"road"|"train";
type Block={x:number;y:number;w:number;d:number;h:number;color:string};
const blocks:Record<TourismObjectKind,Block[]>={
  marina:[{x:12,y:27,w:76,d:7,h:4,color:"#8a7761"},{x:18,y:8,w:10,d:21,h:7,color:"#d9ddd9"},{x:47,y:34,w:11,d:22,h:8,color:"#c6cdcc"},{x:74,y:8,w:10,d:21,h:7,color:"#c6cdcc"}],
  rock:[{x:18,y:22,w:23,d:18,h:39,color:"#91877a"},{x:49,y:29,w:17,d:15,h:27,color:"#776f65"},{x:75,y:35,w:12,d:12,h:19,color:"#a29888"}],
  rest:[{x:20,y:20,w:56,d:29,h:23,color:"#60747e"},{x:12,y:17,w:74,d:9,h:28,color:"#b4a58a"}],
  trail:[{x:7,y:30,w:90,d:12,h:7,color:"#8f7962"},{x:7,y:28,w:90,d:2,h:13,color:"#b6b4a8"},{x:7,y:43,w:90,d:2,h:13,color:"#b6b4a8"}],
  deck:[{x:7,y:30,w:90,d:16,h:7,color:"#80705b"},{x:7,y:28,w:90,d:2,h:14,color:"#aeb5b5"},{x:7,y:46,w:90,d:2,h:14,color:"#aeb5b5"}],
  park:[{x:6,y:29,w:92,d:12,h:9,color:"#8e7d66"},{x:23,y:25,w:4,d:4,h:35,color:"#bdc4c1"},{x:23,y:43,w:4,d:4,h:35,color:"#bdc4c1"},{x:75,y:25,w:4,d:4,h:35,color:"#bdc4c1"},{x:75,y:43,w:4,d:4,h:35,color:"#bdc4c1"}],
  parking:[{x:13,y:15,w:14,d:8,h:6,color:"#536570"},{x:38,y:15,w:14,d:8,h:6,color:"#b4ab98"},{x:63,y:15,w:14,d:8,h:6,color:"#6d7775"},{x:13,y:43,w:14,d:8,h:6,color:"#6d7775"},{x:38,y:43,w:14,d:8,h:6,color:"#8d989b"},{x:63,y:43,w:14,d:8,h:6,color:"#8e8171"}],
  tourism:[{x:13,y:18,w:35,d:24,h:30,color:"#9aabae"},{x:53,y:23,w:31,d:22,h:18,color:"#b6aa95"}],
  road:[{x:7,y:24,w:90,d:22,h:2,color:"#4f5d63"},{x:7,y:22,w:90,d:3,h:4,color:"#bbbdb4"},{x:7,y:47,w:90,d:3,h:4,color:"#bbbdb4"}],
  train:[{x:8,y:25,w:25,d:18,h:14,color:"#8a7860"},{x:8,y:25,w:13,d:18,h:23,color:"#8a7860"},{x:27,y:29,w:5,d:6,h:24,color:"#5a6b70"},{x:38,y:25,w:25,d:18,h:17,color:"#4c6168"},{x:69,y:25,w:25,d:18,h:17,color:"#4c6168"}],
};
// Small faceted meshes keep the rocks volumetric during rotation rather than
// using square building faces with a rock-colored texture.
type V3=[number,number,number];
const minus=(a:V3,b:V3):V3=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]];
const dot=(a:V3,b:V3)=>a.reduce((n,x,i)=>n+x*b[i],0);
const unit=(v:V3):V3=>{const length=Math.hypot(...v);return v.map(x=>x/length) as V3;};
function rockFaces(w:number,d:number,h:number){
  const ring=(z:number,scale:number)=>Array.from({length:5},(_,i):V3=>{const a=i*Math.PI*2/5;return [w/2+Math.cos(a)*w*.5*scale,d/2+Math.sin(a)*d*.5*scale,z*(i%2?.92:1)];});
  const rings=[ring(0,1),ring(h*.55,.85),ring(h*.9,.54)];const triangles:V3[][]=[];
  for(let r=0;r<2;r++)for(let i=0;i<5;i++){const j=(i+1)%5;triangles.push([rings[r][i],rings[r][j],rings[r+1][j]],[rings[r][i],rings[r+1][j],rings[r+1][i]]);}
  for(let i=0;i<5;i++)triangles.push([rings[2][i],rings[2][(i+1)%5],[w*.57,d*.43,h]]);
  return triangles.map(([a,b,c],i)=>{
    const ab=minus(b,a),ac=minus(c,a),u=unit(ab),cx=dot(ac,u),v=unit(ac.map((x,j)=>x-cx*u[j]) as V3);
    const n:V3=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];
    const length=Math.hypot(...ab),cy=dot(ac,v),left=Math.min(0,cx),width=Math.max(length,cx)-left;
    const origin=a.map((x,j)=>x+u[j]*left);
    const shade=.70+.22*Math.abs(dot(n,[-.45,-.35,.82]));const rgb=[153,145,130].map(x=>Math.round(x*shade));
    const style:CSSProperties={position:"absolute",left:0,top:0,width,height:cy,transformOrigin:"0 0",background:`rgb(${rgb.join(",")})`,clipPath:`polygon(${-left/width*100}% 0%,${(length-left)/width*100}% 0%,${(cx-left)/width*100}% 100%)`,transform:`matrix3d(${[...u,0,...v,0,...n,0,...origin,1].join(",")})`};
    return <i key={i} className="object-rock-facet" style={style}/>;
  });
}
export default function TourismSiteObject({kind}:{kind:TourismObjectKind}) {
  return <div className={`tdb-object-scene object-${kind}`} aria-hidden="true"><div className="tdb-object-stage">
    <div className="tdb-object-ground"/>
    {blocks[kind].map((b,i)=><div key={i} className="tdb-object-block" style={{left:b.x,top:b.y,width:b.w,height:b.d,"--block-height":`${b.h}px`,"--block-color":b.color} as CSSProperties}>{kind==="rock"?rockFaces(b.w,b.d,b.h):<><i className="object-roof"/><i className="object-front"/><i className="object-side"/></>}</div>)}
    {kind==="park"&&<><div className="object-bridge-island island-west"/><div className="object-bridge-island island-east"/>{[0,1].map(i=><svg key={i} className={`object-bridge-cables cable-${i}`} viewBox="0 0 104 28"><path d="M2 23 L25 2 Q51 25 77 2 L102 23" fill="none" stroke="#abb8ba" strokeWidth="1.5"/>{[11,18,25,32,39,46,53,60,67,77,84,91].map(x=><path key={x} d={`M${x} ${x<25?23-(x-2)*21/23:x>77?2+(x-77)*21/25:2+23*(1-Math.pow((x-51)/26,2))/2} V27`} stroke="#88989e" strokeWidth=".7"/>)}</svg>)}{[23,75].map(x=><i key={x} className="object-bridge-tower-top" style={{left:x}}/>)}</>}
    {kind==="train"&&<><div className="object-train-coupling"/>{[12,27,42,57,73,88].map(x=><i key={x} className="object-train-wheel" style={{left:x}}/>)}</>}
    {kind==="parking"&&<><div className="object-parking-lines"/><div className="object-parking-sign"><span className="parking-sign-front">P</span><span className="parking-sign-back">P</span></div></>}
    {kind==="marina"&&[19,48,75].map((x,i)=><i key={x} className="object-yacht-sail" style={{left:x,top:i===1?44:19}}/>)}
    {kind==="road"&&<div className="object-road-markings"/>}
    {["deck","trail"].includes(kind)&&[13,35,57,79].map(x=><i key={x} className="object-railing-post" style={{left:x}}/>)}
    {["tourism","rest"].includes(kind)&&[0,1].map(i=><div className="tdb-object-tree" key={i} style={{left:83-i*72,top:46-i*31}}><i/><b/></div>)}
  </div></div>;
}
