import Constants from 'expo-constants';
// Fixed scalar fields only. Never log URIs, image content, geometry or native messages.
export type ScanEvent = 'camera_mount'|'camera_unmount'|'camera_ready'|'camera_error'|'flip_requested'|'facing_changed'|'flip_completed'|'capture_start'|'capture_success'|'capture_error'|'gallery_pressed'|'picker_launch'|'picker_cancel'|'picker_selected'|'picker_error'|'camera_availability_wait'|'camera_availability_confirmed'|'camera_availability_not_required'|'camera_availability_legacy'|'admission_start'|'admission_allowed'|'preprocess_start'|'preprocess_end'|'mlkit_start'|'mlkit_end'|'recommend_start'|'recommend_end'|'scan_error'|'scan_cancel'|'scan_cleanup';
let serial=0;
export function diagnosticSession(){return `s${++serial}`;}
export function scanDiagnostic(session:string,event:ScanEvent,started:number,fields:{state?:string;code?:string;width?:number;height?:number}={}){
 if(!__DEV__&&Constants.expoConfig?.extra?.advisorDiagnosticMode!==true)return;
 console.info('BBookScan',JSON.stringify({session,event,timestampMs:Date.now(),elapsedMs:Date.now()-started,...fields}));
}
