import type {Point} from '../makeupAdvisor/faceAnalysis';

export type Size={width:number;height:number};
export function containImage(image:Size,viewport:Size){
 if(![image.width,image.height,viewport.width,viewport.height].every(n=>Number.isFinite(n)&&n>0))return undefined;
 const scale=Math.min(viewport.width/image.width,viewport.height/image.height);
 const width=image.width*scale,height=image.height*scale;
 return {scale,width,height,left:(viewport.width-width)/2,top:(viewport.height-height)/2};
}
// Studio uses the already rasterized JPEG, including EXIF mirroring. Never mirror it again.
export function imagePointToView(point:Point,image:Size,viewport:Size){
 const fit=containImage(image,viewport);
 return fit?{x:fit.left+point.x*fit.scale,y:fit.top+point.y*fit.scale}:undefined;
}
