import { useEffect, useRef, useState, type PointerEvent } from "react";
import { Expand, LocateFixed, Minus, Plus } from "lucide-react";

type SourceMapProps = { src: string; title: string; source: string };
export default function ProjectSourceMap({ src, title, source }: SourceMapProps) {
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [expanded, setExpanded] = useState(false);
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
  const sheet = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!expanded) return;
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") setExpanded(false); };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [expanded]);
  const start = (e: PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
  };
  const move = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if(d) setOffset({x:d.ox+e.clientX-d.x,y:d.oy+e.clientY-d.y});
  };
  const zoom = (factor: number) => setScale(v=>Math.max(1,Math.min(5,v*factor)));
  return <div ref={sheet} className={`dmp-source-map${expanded?" is-expanded":""}`}>
    <div className="dmp-source-title"><strong>{title}</strong><span>제공 자료의 실제 항공 위치도</span></div>
    <div className="dmp-source-viewport" onPointerDown={start} onPointerMove={move} onPointerUp={()=>{drag.current=null;}} onPointerCancel={()=>{drag.current=null;}} aria-label="드래그하여 이동할 수 있는 원본 사업 위치도">
      <img src={src} alt={`${title} · 중로2-3, 중로2-2 회전교차로, 소로1-7, 소로1-8, 소로2-1 노선 표시`} draggable={false} style={{transform:`translate(${offset.x}px,${offset.y}px) scale(${scale})`}}/>
    </div>
    <div className="dmp-source-controls"><button onClick={()=>zoom(1.3)} aria-label="원본 위치도 확대"><Plus size={18}/></button><span>{Math.round(scale*100)}%</span><button onClick={()=>zoom(1/1.3)} aria-label="원본 위치도 축소"><Minus size={18}/></button><button onClick={()=>{setScale(1);setOffset({x:0,y:0});}} aria-label="원본 위치도 전체 보기"><LocateFixed size={18}/></button><button aria-label={expanded?"위치도 확대 닫기":"위치도 크게 보기"} aria-pressed={expanded} onClick={()=>setExpanded(v=>!v)}><Expand size={18}/></button></div>
    <p className="dmp-source-credit">{source}</p>
  </div>;
}
