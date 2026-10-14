// Presentation only: native inference/provider run immediately and release their resources normally.
export const SCAN_PRESENTATION_MS=10000;
export const INVALID_SCAN_PRESENTATION_MS=5000;
export const SCAN_SWEEP_MS=1800;
export function waitForScanPresentation(startedAt:number,signal:AbortSignal,duration=SCAN_PRESENTATION_MS):Promise<void>{
 const remaining=Math.max(0,duration-(Date.now()-startedAt));
 if(signal.aborted||remaining===0)return Promise.resolve();
 return new Promise(resolve=>{
  const finish=()=>{clearTimeout(timer);signal.removeEventListener('abort',finish);resolve();};
  const timer=setTimeout(finish,remaining);
  signal.addEventListener('abort',finish,{once:true});
 });
}
