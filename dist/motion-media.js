/* Small, abortable media recovery. A temporary network/decode error is not a
 * permanent animation preference. No dependencies and no autonomous downloads. */
(()=>{
 const cancelled=()=>new DOMException('Cancelled','AbortError');
 function wait(ms,signal){
  return new Promise((resolve,reject)=>{
   if(signal?.aborted){reject(cancelled());return;}
   const finish=()=>{signal?.removeEventListener('abort',abort);resolve();};
   const timer=setTimeout(finish,ms);
   const abort=()=>{clearTimeout(timer);signal.removeEventListener('abort',abort);reject(cancelled());};
   signal?.addEventListener('abort',abort,{once:true});
  });
 }
 async function read(url,{signal,consume=r=>r.blob(),onRetry,timeoutMs=5000}={}){
  for(let attempt=0;attempt<3;attempt++){
   if(signal?.aborted)throw cancelled();
   const request=new AbortController(),abort=()=>request.abort();
   signal?.addEventListener('abort',abort,{once:true});
   const timer=setTimeout(abort,timeoutMs);
   try{
    const response=await fetch(url,{signal:request.signal,cache:attempt?'reload':'force-cache'});
    if(!response.ok)throw new Error('Media '+response.status);
    return await consume(response);
   }catch(error){
    if(signal?.aborted)throw cancelled();
    if(attempt===2)throw error;
    onRetry?.(attempt+1);
   }finally{clearTimeout(timer);signal?.removeEventListener('abort',abort);}
   await wait(200*2**attempt,signal);
  }
 }
 async function decodeImage(blob){
  if(typeof createImageBitmap==='function')try{return await createImageBitmap(blob);}catch{}
  const url=URL.createObjectURL(blob),image=new Image();
  try{image.src=url;await image.decode();return image;}finally{URL.revokeObjectURL(url);}
 }
 window.portfolioMotionMedia={read,decodeImage};
})();
