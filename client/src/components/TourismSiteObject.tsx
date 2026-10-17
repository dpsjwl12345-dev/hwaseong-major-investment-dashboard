import { useId, type CSSProperties } from "react";
import gukhwa from "../data/gukhwa-object-outline.json";
export type TourismObjectKind = "marina"|"rock"|"rest"|"trail"|"park"|"deck"|"parking"|"tourism"|"road"|"train"|"culture"|"heritage"|"memorial"|"library"|"sports"|"stadium"|"tennis"|"baseball";
type Block={x:number;y:number;w:number;d:number;h:number;color:string};
const blocks:Record<TourismObjectKind,Block[]>={
  culture:[{x:9,y:22,w:55,d:30,h:20,color:"#9c94ad"},{x:55,y:12,w:37,d:40,h:32,color:"#c1b8b2"}],
  heritage:[{x:13,y:21,w:78,d:29,h:17,color:"#9a8167"},{x:7,y:17,w:90,d:37,h:20,color:"#69797b"},{x:18,y:24,w:6,d:24,h:20,color:"#b5a18a"},{x:79,y:24,w:6,d:24,h:20,color:"#b5a18a"}],
  memorial:[{x:14,y:16,w:76,d:40,h:4,color:"#727f77"},{x:40,y:26,w:24,d:20,h:12,color:"#a7aea7"},{x:48,y:30,w:8,d:12,h:55,color:"#c4c7bc"}],
  library:[{x:9,y:16,w:38,d:38,h:24,color:"#b0b49c"},{x:55,y:16,w:38,d:38,h:24,color:"#c0b69f"},{x:47,y:20,w:8,d:30,h:19,color:"#758783"}],
  tennis:[{x:7,y:12,w:90,d:46,h:3,color:"#5c827a"}],
  baseball:[{x:8,y:10,w:88,d:48,h:3,color:"#6a826b"}],
  sports:[{x:7,y:12,w:90,d:46,h:3,color:"#587e77"},{x:5,y:10,w:94,d:3,h:6,color:"#b8c5bf"},{x:5,y:57,w:94,d:3,h:6,color:"#b8c5bf"}],
  stadium:[{x:9,y:12,w:86,d:5,h:15,color:"#9eabb6"},{x:9,y:53,w:86,d:5,h:15,color:"#9eabb6"},{x:7,y:17,w:9,d:36,h:12,color:"#b6bfc3"},{x:88,y:17,w:9,d:36,h:12,color:"#b6bfc3"},{x:19,y:20,w:64,d:29,h:3,color:"#537d70"}],
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
function GoldenCoastWalk() {
  const samples=Array.from({length:29},(_,i)=>{
    const t=i/28,x=7+t*90,y=39-17*Math.sin(t*Math.PI),dy=-17*Math.PI*Math.cos(t*Math.PI)/90;
    const length=Math.hypot(1,dy),half=7+6*Math.exp(-Math.pow((t-.56)/.19,2));
    return {x,y,nx:-dy/length,ny:1/length,half,angle:Math.atan(dy)*180/Math.PI};
  });
  const edge=(side:number)=>samples.map(p=>[p.x+p.nx*p.half*side,p.y+p.ny*p.half*side]);
  const path=(side:number)=>edge(side).map(([x,y],i)=>`${i?'L':'M'}${x.toFixed(2)} ${y.toFixed(2)}`).join(' ');
  return <>
    <svg className="coast-shore" viewBox="0 0 104 64"><path d="M2 5 L29 8 L42 4 L62 10 L83 6 L103 13 L99 23 L83 19 L64 22 L44 16 L27 22 L8 19 Z" fill="#6d756b"/><path d="M8 19 L27 22 L44 16 L64 22 L83 19 L99 23" fill="none" stroke="#a2a08e" strokeWidth="2"/></svg>
    {samples.map((p,i)=><div key={i} className="tdb-object-block coast-plank" style={{left:p.x-1.7,top:p.y-p.half,width:3.2,height:p.half*2,"--block-height":"6px","--block-color":i%3===0?"#a48b69":"#8d7557",transform:`rotateZ(${p.angle}deg)`} as CSSProperties}><i className="object-roof"/><i className="object-front"/><i className="object-side"/></div>)}
    {[-1,1].flatMap(side=>samples.filter((_,i)=>i%4===0).map((p,i)=><div className="tdb-object-block coast-post" key={`${side}-${i}`} style={{left:p.x+p.nx*p.half*side-.45,top:p.y+p.ny*p.half*side-.45,width:.9,height:.9,"--block-height":"18px","--block-color":"#b8c3c1"} as CSSProperties}><i className="object-roof"/><i className="object-front"/><i className="object-side"/></div>))}
    {[18,12].map(z=><svg key={z} className="coast-handrails" viewBox="0 0 104 64" style={{transform:`translateZ(${z}px)`}}><path d={path(-1)} fill="none" stroke={z===18?"#b8c3c1":"#849491"} strokeWidth={z===18?.8:.45}/><path d={path(1)} fill="none" stroke={z===18?"#b8c3c1":"#849491"} strokeWidth={z===18?.8:.45}/></svg>)}
    {samples.filter((_,i)=>i%7===0).map((p,i)=><div className="coast-foundation" key={i} style={{left:p.x-1,top:p.y-1}}/>)}
  </>;
}
function GukhwaIslandDeck() {
  const clipId="gukhwa-relief-"+useId().replace(/:/g,"");
  const shore=gukhwa.points;
  const ring=(scale:number)=>shore.map(([x,y])=>[52+(x-52)*scale,32+(y-32)*scale]);
  const path=(points:number[][])=>points.map(([x,y],i)=>`${i?'L':'M'}${x} ${y}`).join(' ')+' Z';
  const land=path(shore),deck=path(ring(1.13));
  const planks: {x:number;y:number;nx:number;ny:number}[]=[];
  const edge=ring(1.13);
  for(let i=0;i<edge.length-1;i++){
    const a=edge[i],b=edge[i+1],dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy),steps=Math.max(1,Math.ceil(length/2.6));
    for(let j=0;j<steps;j++){const t=j/steps;planks.push({x:a[0]+dx*t,y:a[1]+dy*t,nx:-dy/length,ny:dx/length});}
  }
  return <>
    <svg className="island-outline island-stone" viewBox="0 0 104 64"><path d={land} fill="#536054" stroke="#384c46" strokeWidth="1.5"/></svg>
    <svg className="island-outline island-land" viewBox="0 0 104 64"><defs><clipPath id={clipId}><path d={land}/></clipPath></defs><path d={land} fill="#77866b" stroke="#9caa8a" strokeWidth=".7"/><path d="M43 35 Q48 25 57 27 Q62 32 56 40 Q47 44 43 35" clipPath={`url(#${clipId})`} fill="#5d735b"/></svg>
    <svg className="island-outline island-deck" viewBox="0 0 104 64"><path d={deck} fill="none" stroke="#9c8768" strokeWidth="4" strokeLinejoin="round"/>{planks.map((p,i)=><path key={i} d={`M${p.x-p.nx*1.8} ${p.y-p.ny*1.8} L${p.x+p.nx*1.8} ${p.y+p.ny*1.8}`} stroke="#635643" strokeWidth=".35"/>)}</svg>
    <svg className="island-outline island-rails" viewBox="0 0 104 64"><path d={path(ring(1.21))} fill="none" stroke="#b1bfba" strokeWidth=".65"/><path d={path(ring(1.05))} fill="none" stroke="#879e94" strokeWidth=".55"/></svg>
    {planks.filter((_,i)=>i%5===0).map((p,i)=><div className="tdb-object-block coast-post" key={i} style={{left:p.x+p.nx*2,top:p.y+p.ny*2,width:.65,height:.65,"--block-height":"13px","--block-color":"#a7b8b0"} as CSSProperties}><i className="object-roof"/><i className="object-front"/><i className="object-side"/></div>)}
  </>;
}
export default function TourismSiteObject({kind}:{kind:TourismObjectKind}) {
  return <div className={`tdb-object-scene object-${kind}`} aria-hidden="true"><div className="tdb-object-stage">
    <div className="tdb-object-ground"/>
    {kind==="trail"?<GoldenCoastWalk/>:kind==="deck"?<GukhwaIslandDeck/>:blocks[kind].map((b,i)=><div key={i} className="tdb-object-block" style={{left:b.x,top:b.y,width:b.w,height:b.d,"--block-height":`${b.h}px`,"--block-color":b.color} as CSSProperties}>{kind==="rock"?rockFaces(b.w,b.d,b.h):<><i className="object-roof"/><i className="object-front"/><i className="object-side"/></>}</div>)}
    {kind==="park"&&<><div className="object-bridge-island island-west"/><div className="object-bridge-island island-east"/>{[0,1].map(i=><svg key={i} className={`object-bridge-cables cable-${i}`} viewBox="0 0 104 28"><path d="M2 23 L25 2 Q51 25 77 2 L102 23" fill="none" stroke="#abb8ba" strokeWidth="1.5"/>{[11,18,25,32,39,46,53,60,67,77,84,91].map(x=><path key={x} d={`M${x} ${x<25?23-(x-2)*21/23:x>77?2+(x-77)*21/25:2+23*(1-Math.pow((x-51)/26,2))/2} V27`} stroke="#88989e" strokeWidth=".7"/>)}</svg>)}{[23,75].map(x=><i key={x} className="object-bridge-tower-top" style={{left:x}}/>)}</>}
    {kind==="train"&&<><div className="object-train-coupling"/>{[12,27,42,57,73,88].map(x=><i key={x} className="object-train-wheel" style={{left:x}}/>)}</>}
    {kind==="parking"&&<><div className="object-parking-lines"/><div className="object-parking-sign"><span className="parking-sign-front">P</span><span className="parking-sign-back">P</span></div></>}
    {kind==="marina"&&[19,48,75].map((x,i)=><i key={x} className="object-yacht-sail" style={{left:x,top:i===1?44:19}}/>)}
    {["sports","stadium"].includes(kind)&&<div className="department-court-lines"><i/></div>}
    {kind==="tennis"&&<><div className="department-tennis-court"><i/></div><div className="department-tennis-net"/></>}
    {kind==="baseball"&&<svg className="department-baseball-diamond" viewBox="0 0 104 64"><path d="M52 51 24 29 Q52 2 80 29Z" fill="#b49b79"/><path d="m52 49-15-14 15-14 15 14Z" fill="#718b70" stroke="#e0e6d7" strokeWidth=".8"/><path d="M52 51 13 20 M52 51 91 20" stroke="#e0e6d7" fill="none" strokeWidth="1"/></svg>}
    {kind==="library"&&<div className="department-library-spines">{[0,1,2,3,4].map(i=><i key={i}/>)}</div>}
    {kind==="culture"&&<div className="department-culture-windows"/>}
    {kind==="road"&&<div className="object-road-markings"/>}
    {["tourism","rest"].includes(kind)&&[0,1].map(i=><div className="tdb-object-tree" key={i} style={{left:83-i*72,top:46-i*31}}><i/><b/></div>)}
  </div></div>;
}
