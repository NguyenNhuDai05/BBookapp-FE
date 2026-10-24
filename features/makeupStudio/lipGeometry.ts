import type {Analysis,Photo,Point} from '../makeupAdvisor/faceAnalysis';

export type LipGeometry={supported:true;path:string;source:'contours'}|{supported:false;reason:string};
const unavailable='Chưa thể thử son trên ảnh này. Hãy chọn selfie chính diện, rõ và không che môi.';
const distance=(a:Point,b:Point)=>Math.hypot(a.x-b.x,a.y-b.y);
const cross=(a:Point,b:Point,c:Point)=>(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);
const area=(p:Point[])=>Math.abs(p.reduce((s,a,i)=>{const b=p[(i+1)%p.length];return s+a.x*b.y-b.x*a.y;},0))/2;
function onSegment(p:Point,a:Point,b:Point){return Math.abs(cross(a,b,p))<.00001&&p.x>=Math.min(a.x,b.x)-.00001&&p.x<=Math.max(a.x,b.x)+.00001&&p.y>=Math.min(a.y,b.y)-.00001&&p.y<=Math.max(a.y,b.y)+.00001;}
function intersects(a:Point,b:Point,c:Point,d:Point){
 return (cross(a,b,c)*cross(a,b,d)<0&&cross(c,d,a)*cross(c,d,b)<0)||onSegment(a,c,d)||onSegment(b,c,d)||onSegment(c,a,b)||onSegment(d,a,b);
}
function simple(p:Point[]){
 for(let i=0;i<p.length;i++)for(let j=i+1;j<p.length;j++){
  if(j===i+1||(i===0&&j===p.length-1))continue;
  if(intersects(p[i],p[(i+1)%p.length],p[j],p[(j+1)%p.length]))return false;
 }
 return true;
}
function inside(p:Point,polygon:Point[]){
 let result=false;
 for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){
  const a=polygon[j],b=polygon[i];if(onSegment(p,a,b))return true;
  if((a.y>p.y)!==(b.y>p.y)&&p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x)result=!result;
 }
 return result;
}
// Each ML Kit contour is a polyline. Match its endpoints rather than assuming
// left-to-right direction or treating unordered mesh region indices as a polygon.
function join(top:Point[],bottom:Point[],maxGap:number){
 const direct=distance(top[top.length-1],bottom[0])+distance(bottom[bottom.length-1],top[0]);
 const reverse=distance(top[top.length-1],bottom[bottom.length-1])+distance(bottom[0],top[0]);
 const b=direct<=reverse?bottom:[...bottom].reverse();
 if(distance(top[top.length-1],b[0])>maxGap||distance(b[b.length-1],top[0])>maxGap)return undefined;
 const polygon=[...top,...b].filter((p,i,all)=>i===0||distance(p,all[i-1])>.00001);
 if(distance(polygon[0],polygon[polygon.length-1])<.00001)polygon.pop();
 return polygon;
}
const path=(p:Point[])=>`M${p.map(v=>`${v.x},${v.y}`).join('L')}Z`;
export function extractLipGeometry(photo?:Photo,a?:Analysis):LipGeometry{
 const fail=():LipGeometry=>({supported:false,reason:unavailable});
 // Only CompletedScan's normalized local JPEG is accepted. Dimensions from the
 // bitmap analyzer must agree; picker dimensions/original EXIF images cannot enter.
 if(!photo||!/^file:\/\/\/.*\/bbook-normalized-[a-zA-Z0-9_-]+\.jpg$/.test(photo.uri)||!a||
  ![photo.width,photo.height].every(n=>Number.isInteger(n)&&n>=128&&n<=1280)||photo.width!==a.width||photo.height!==a.height||a.faceCount!==1||a.faces?.length!==1)return fail();
 const {box,angles}=a.faces[0];
 if(!box||!angles||![box.x,box.y,box.width,box.height,angles.x,angles.y,angles.z].every(Number.isFinite)||box.width<100||box.height<100||box.x<0||box.y<0||box.x+box.width>a.width||box.y+box.height>a.height||Math.abs(angles.x)>15||Math.abs(angles.y)>15||Math.abs(angles.z)>10)return fail();
 const counts=[11,9,9,9],lines:Point[][]=[];
 for(let i=0;i<4;i++){
  const matches=a.contours?.filter(c=>c.type===8+i);
  const ps=matches?.[0]?.points;
  if(matches?.length!==1||!ps||ps.length!==counts[i]||!ps.every(p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y)&&p.x>0&&p.y>0&&p.x<a.width&&p.y<a.height&&p.x>=box.x&&p.x<=box.x+box.width&&p.y>=box.y+box.height*.45&&p.y<=box.y+box.height)||ps.some((p,j)=>j>0&&distance(p,ps[j-1])<.00001))return fail();
  lines.push(ps);
 }
 const all=lines.flat(),width=Math.max(...all.map(p=>p.x))-Math.min(...all.map(p=>p.x));
 const height=Math.max(...all.map(p=>p.y))-Math.min(...all.map(p=>p.y));
 if(width<12||width>box.width*.8||height<2||height>width*.8)return fail();
 const outer=join(lines[0],lines[3],width*.2),inner=join(lines[1],lines[2],width*.2);
 if(!outer||!inner||!simple(outer)||area(outer)<width*width*.01)return fail();
 // Require both inner contours even for a closed mouth. Never silently fill a
 // missing mouth opening. A degenerate opening is retained as a zero-area hole.
 if(!inner.every(p=>inside(p,outer)))return fail();
 for(let i=0;i<inner.length;i++){
  const p=inner[i],q=inner[(i+1)%inner.length];
  if(!inside({x:(p.x+q.x)/2,y:(p.y+q.y)/2},outer))return fail();
  for(let j=0;j<outer.length;j++){
   const u=outer[j],v=outer[(j+1)%outer.length];
   if(cross(p,q,u)*cross(p,q,v)<0&&cross(u,v,p)*cross(u,v,q)<0)return fail();
  }
 }
 const innerArea=area(inner);
 if(innerArea>.01){if(!simple(inner))return fail();}
 else {
  // Zero signed area alone is not proof of a closed mouth (a bow-tie can
  // cancel itself). Accept it only when both observed inner curves coincide.
  const follows=(p:Point,line:Point[])=>line.some((q,i)=>i>0&&onSegment(p,line[i-1],q));
  if(!lines[1].every(p=>follows(p,lines[2]))||!lines[2].every(p=>follows(p,lines[1])))return fail();
 }
 if(innerArea>=area(outer)*.9)return fail();
 return {supported:true,source:'contours',path:path(outer)+path(inner)};
}
