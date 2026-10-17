import maplibregl from "maplibre-gl";
import { toneTourismMapPixels } from "./tourismMapPalette";
let registered=false;
export function registerTourismMapTiles() {
  if(registered)return;
  maplibregl.addProtocol("hwaseong-toned",async(request,controller)=>{
    const url=request.url.replace(/^hwaseong-toned:\/\//,"https://");
    const response=await fetch(url,{signal:controller.signal});
    if(!response.ok)throw new Error(`Map tile HTTP ${response.status}`);
    const bitmap=await createImageBitmap(await response.blob());
    try {
      const canvas=document.createElement("canvas");canvas.width=bitmap.width;canvas.height=bitmap.height;
      const ctx=canvas.getContext("2d",{willReadFrequently:true});
      if(!ctx)throw new Error("Map tile canvas unavailable");
      ctx.drawImage(bitmap,0,0);
      const image=ctx.getImageData(0,0,canvas.width,canvas.height);
      toneTourismMapPixels(image.data);ctx.putImageData(image,0,0);
      const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error("Map tile encoding failed")),"image/png"));
      controller.signal.throwIfAborted();
      return {data:await blob.arrayBuffer(),cacheControl:response.headers.get("cache-control")??undefined,expires:response.headers.get("expires")??undefined};
    } finally { bitmap.close(); }
  });
  registered=true;
}
