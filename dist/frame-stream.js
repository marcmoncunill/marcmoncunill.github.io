/* Original WebPs, batched without re-encoding. Encoded data and decoded pixels
 * have separate lifetimes: a reverse scroll never needs to download them again. */
(()=>{
 function create({manifestURL,source,onReady=()=>{},onError=()=>{},onStats=()=>{},budget=72*1024*1024}){
  const media=window.portfolioMotionMedia,controller=new AbortController();
  const directory=manifestURL.slice(0,manifestURL.lastIndexOf('/')+1);
  const chunks=new Map(),early=new Map(),downloads=new Map(),decoded=new Map(),decoding=new Set(),failed=new Map();
  let alive=true,active=true,manifest=null,target=1,shown=0,direction=1,limit=20,pumpTimer=0,manifestTimer=0;
  let encodedBytes=0;
  let requests=0,decodes=0,decodeMs=0,decodeMax=0,misses=0,hits=0;
  const clamp=n=>Math.max(1,Math.min(manifest?.count||1,n));
  function stats(){onStats({chunks:chunks.size,requests,cache:decoded.size,limit,pending:downloads.size,decoding:decoding.size,
   encodedBytes,decodedBytes:decoded.size*(manifest?.width||0)*(manifest?.height||0)*4,
   hits,misses,decodeMean:decodes?+(decodeMs/decodes).toFixed(2):0,decodeMax:+decodeMax.toFixed(2)});}
  function desiredFrames(){
   const ahead=Math.max(1,Math.round((limit-2)*.7)),behind=limit-2-ahead;
   return [target,...Array.from({length:ahead},(_,i)=>target+(i+1)*direction),...Array.from({length:behind},(_,i)=>target-(i+1)*direction)]
    .filter((n,i,a)=>n>=1&&n<=manifest.count&&a.indexOf(n)===i);
  }
  function trim(){
   const wanted=new Set(desiredFrames());
   while(decoded.size>limit){
    const candidates=[...decoded.keys()].filter(n=>n!==shown&&n!==target);
    candidates.sort((a,b)=>Number(wanted.has(a))-Number(wanted.has(b))||Math.abs(b-target)-Math.abs(a-target));
    const n=candidates[0];if(n===undefined)break;
    decoded.get(n)?.close?.();decoded.delete(n);
   }
  }
  function later(){if(alive&&active&&!pumpTimer)pumpTimer=setTimeout(()=>{pumpTimer=0;pump();},1000);}
  async function receive(response,n,signal){
   if(!response.body?.getReader)return response.blob();
   const info=manifest.chunks[n],data=new Uint8Array(info.bytes),reader=response.body.getReader();
   let length=0,frame=info.first;
   try{
    while(true){
     const packet=await reader.read();if(packet.done)break;
     if(!alive||signal.aborted)throw new DOMException('Cancelled','AbortError');
     if(length+packet.value.length>data.length)throw Error('Oversized frame block');
     data.set(packet.value,length);length+=packet.value.length;let changed=false;
     while(frame<=info.last){
      const f=manifest.frames[frame];if(f.offset+f.length>length)break;
      // A complete WebP can decode immediately, before the rest of its block
      // arrives. This avoids a whole-block startup wait on a slower connection.
      early.set(frame,new Blob([data.slice(f.offset,f.offset+f.length)],{type:'image/webp'}));frame++;changed=true;
     }
     if(changed)pump();
    }
    if(length!==info.bytes)throw Error('Incomplete frame block');
    return new Blob([data]);
   }finally{reader.releaseLock();}
  }
  function pump(){
   if(!alive||!active||!manifest)return;
   const current=manifest.frames[target].chunk;
   // Two block downloads, ordered around the playhead. Save-data loads only neighbours.
   const all=manifest.chunks.map((_,i)=>i);
   all.sort((a,b)=>a===current?-1:b===current?1:Math.abs(a-current)-Math.abs(b-current)||((b-a)*direction));
   for(const n of all){
    if(downloads.size>=2)break;
    if(chunks.has(n)||downloads.has(n)||(failed.get('c'+n)||0)>Date.now())continue;
    if(navigator.connection?.saveData&&Math.abs(n-current)>1)continue;
    const request=new AbortController();downloads.set(n,request);requests++;
    media.read(directory+manifest.chunks[n].file,{signal:request.signal,timeoutMs:30000,consume:r=>receive(r,n,request.signal)})
     .then(blob=>{if(!alive||request.signal.aborted)return;if(blob.size!==manifest.chunks[n].bytes)throw Error('Incomplete frame block');chunks.set(n,blob);encodedBytes+=blob.size;failed.delete('c'+n);for(let f=manifest.chunks[n].first;f<=manifest.chunks[n].last;f++)early.delete(f);})
     .catch(error=>{if(alive&&error.name!=='AbortError'){failed.set('c'+n,Date.now()+5000);onError(error);later();}})
     .finally(()=>{downloads.delete(n);if(alive){stats();pump();}});
   }
   const frames=desiredFrames();
   for(const n of frames){
    if(decoding.size>=2)break;
    if(decoded.has(n)||decoding.has(n)||(failed.get(n)||0)>Date.now())continue;
    const frame=manifest.frames[n],chunk=chunks.get(frame.chunk);
    // A blocked/broken binary request must not disable the animation. Retry the
    // exact original single-frame URL for the playhead while the block recovers.
    const partial=early.get(n),fallback=!chunk&&!partial&&n===target&&failed.has('c'+frame.chunk);
    if(!chunk&&!partial&&!fallback)continue;
    decoding.add(n);const started=performance.now();
    const blob=chunk||partial?Promise.resolve(partial||chunk.slice(frame.offset,frame.offset+frame.length,'image/webp')):
     media.read(source(n),{signal:controller.signal,consume:r=>r.blob()});
    blob.then(media.decodeImage)
     .then(image=>{if(!alive||!active){image?.close?.();return;}failed.delete(n);decoded.set(n,image);decodes++;const ms=performance.now()-started;decodeMs+=ms;decodeMax=Math.max(decodeMax,ms);trim();onReady();})
     .catch(error=>{if(alive&&active){failed.set(n,Date.now()+1000);onError(error);later();}})
     .finally(()=>{decoding.delete(n);if(alive){stats();pump();}});
   }
   for(const n of failed.keys())if(typeof n==='number'&&!frames.includes(n))failed.delete(n);
   if(failed.size)later();
   stats();
  }
  function loadManifest(){media.read(manifestURL,{signal:controller.signal,consume:r=>r.json()}).then(data=>{
   if(!alive)return;manifest=data;limit=Math.max(4,Math.min(32,Math.floor(budget/(data.width*data.height*4))));target=clamp(target);pump();onReady();
  }).catch(error=>{if(alive&&error.name!=='AbortError'){onError(error);manifestTimer=setTimeout(loadManifest,3000);}});}
  loadManifest();
  return {
   target(n){n=Math.round(n);if(n===target)return;direction=Math.sign(n-target)||direction;target=n;if(manifest){target=clamp(target);pump();}},
   take(n){const image=decoded.get(n);if(image){shown=n;hits++;}else misses++;return image;},
   active(value){active=value;if(!active){downloads.forEach(c=>c.abort());early.clear();decoded.forEach(i=>i?.close?.());decoded.clear();}else pump();stats();},
   destroy(){alive=false;clearTimeout(pumpTimer);clearTimeout(manifestTimer);controller.abort();downloads.forEach(c=>c.abort());downloads.clear();decoded.forEach(i=>i?.close?.());decoded.clear();chunks.clear();early.clear();}
  };
 }
 window.portfolioFrameStream={create};
})();
