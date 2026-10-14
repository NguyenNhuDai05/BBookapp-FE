import type {ValidationCode} from '../scanState';
import type {Analysis,Point} from '../faceAnalysis';

export type Feature = {value:number;source:'face_mesh'|'face_detection';points:string;formula:string;range:readonly [number,number];use:string;share:boolean};
export type DetectionContext = {faceCount:number;boundingBox:{x:number;y:number;width:number;height:number};pose:{yaw:number;pitch:number;roll:number}};
export type FaceFeatureSummaryV3 = {schemaVersion:3;analysisMethod:'face_mesh'|'face_detection';quality:{frontal:boolean;singleFace:boolean;expressionLimited:boolean};detection:DetectionContext|null;features:Record<string,number>;featureSources:Record<string,'face_mesh'|'face_detection'>;missing:string[];limitations:string[]};
export type Extraction = {status:'valid'|'blocked';reason?:string;errorCode?:ValidationCode;features:Record<string,Feature>;summary:FaceFeatureSummaryV3;qualityContext?:{eyesClosed:boolean|null}};
const limits=['Số đo tương đối 2D của ảnh, chưa hiệu chuẩn; không phải phân loại dáng mặt.', 'Không đo undertone, giới tính, tình trạng da hoặc độ sâu giải phẫu.', 'Ánh sáng, che mặt và biểu cảm có thể ảnh hưởng số đo.'];
const mean=(ps:Point[]):Point=>({x:ps.reduce((s,p)=>s+p.x,0)/ps.length,y:ps.reduce((s,p)=>s+p.y,0)/ps.length});
const span=(ns:number[])=>Math.max(...ns)-Math.min(...ns);
const distance=(a:Point,b:Point)=>Math.hypot(a.x-b.x,a.y-b.y);
const names=['outlineAspect','eyeSpacing','leftEyeWidth','rightEyeWidth','leftEyeAspect','rightEyeAspect','leftEyeTilt','rightEyeTilt','eyeWidthDifference','leftEyePosition','rightEyePosition','leftBrowLength','rightBrowLength','leftBrowArch','rightBrowArch','leftBrowTilt','rightBrowTilt','leftBrowEyeGap','rightBrowEyeGap','noseBridgeLength','noseBaseWidth','mouthWidth','mouthAspect','upperLipThickness','lowerLipThickness','mouthPosition','lowerFaceHeight','outlineUpperWidth','outlineMiddleWidth','outlineLowerWidth','chinWidth','outlineCompactness','meshProjectedArea','meshRelativeZSpan'];

export function extractFaceFeatures(a:Analysis,onPhase?:(phase:'validating'|'analyzing')=>void):Extraction {
 onPhase?.('validating');
 const features:Record<string,Feature>={};
 const face=a.faces?.[0];
 const mesh=a.mesh;
 const validPoint=(p:Point)=>!!p&&Number.isFinite(p.x)&&Number.isFinite(p.y)&&p.x>=0&&p.y>=0&&p.x<=a.width&&p.y<=a.height;
 const meshValid=!!mesh&&mesh.points.length===468&&new Set(mesh.points.map(p=>p.index)).size===468&&mesh.points.every(p=>validPoint(p)&&Number.isFinite(p.z)&&Number.isInteger(p.index)&&p.index>=0&&p.index<468);
 const method=meshValid?'face_mesh':'face_detection';
 const smiling=face?.probabilities?.smiling;
 const expressionLimited=typeof smiling==='number'&&Number.isFinite(smiling)&&smiling>.55;
 const summary:FaceFeatureSummaryV3={schemaVersion:3,analysisMethod:method,quality:{singleFace:a.faceCount===1,frontal:false,expressionLimited},detection:null,features:{},featureSources:{},missing:[...names],limitations:[...limits]};
 const blocked=(reason:string,errorCode:ValidationCode='PROCESSING_ERROR'):Extraction=>({status:'blocked',reason,errorCode,features:{},summary});
 if(a.faceCount===0)return blocked('Không tìm thấy khuôn mặt trong ảnh. Hãy chọn ảnh có một khuôn mặt rõ nét.','FACE_NOT_FOUND');
 if(Number.isInteger(a.faceCount)&&a.faceCount>1)return blocked('Ảnh có nhiều khuôn mặt. Hãy chọn ảnh chỉ có một người.','MULTIPLE_FACES');
 if(!Number.isInteger(a.width)||!Number.isInteger(a.height)||a.width<128||a.height<128||a.faceCount!==1||a.faces?.length!==1||!face) return blocked('Dữ liệu ảnh hoặc khuôn mặt chưa đầy đủ. Hãy chọn ảnh rõ hơn.');
 const b=face.box, angles=face.angles;
 if(!b||!angles||![b.x,b.y,b.width,b.height,angles.x,angles.y,angles.z].every(Number.isFinite)||b.x<0||b.y<0||b.x+b.width>a.width||b.y+b.height>a.height||Math.min(b.width,b.height)<200) return blocked('Hãy chụp gần hơn và lấy trọn khuôn mặt.',b&&angles&&[b.x,b.y,b.width,b.height,angles.x,angles.y,angles.z].every(Number.isFinite)&&b.x>=0&&b.y>=0&&b.width>0&&b.height>0&&b.x+b.width<=a.width&&b.y+b.height<=a.height&&Math.min(b.width,b.height)<200?'FACE_TOO_SMALL':'PROCESSING_ERROR');
 if(Math.abs(angles.x)>15||Math.abs(angles.y)>15||Math.abs(angles.z)>10)return blocked('Hãy nhìn thẳng và giữ đầu ngay để đường nét rõ hơn.','FACE_NOT_FRONTAL');
 summary.quality.frontal=true;
 // Detector box normalized to image dimensions; Euler X=pitch, Y=yaw, Z=roll.
 // Never share image dimensions, point arrays, URI, probabilities or mesh Z.
 summary.detection={faceCount:a.faceCount,boundingBox:{x:b.x/a.width,y:b.y/a.height,width:b.width/a.width,height:b.height/a.height},pose:{yaw:angles.y,pitch:angles.x,roll:angles.z}};
 const byIndex=new Map(meshValid?mesh!.points.map(p=>[p.index,p] as const):[]);
 const contours=new Map((a.contours||[]).map(c=>[c.type,c.points] as const));
 const counts:Record<number,number>={1:36,2:5,3:5,4:5,5:5,6:16,7:16,8:11,9:9,10:9,11:9,12:2,13:3,14:1,15:1};
 const regionSources=new Map<string,'face_mesh'|'face_detection'>();
 if(new Set((a.contours||[]).map(c=>c.type)).size!==(a.contours||[]).length)return blocked('Ảnh chưa cung cấp đường nét nhất quán; hãy thử ảnh khác.');
 function region(name:string,type:number):Point[]{
  const indices=meshValid?mesh!.regions?.[name]:undefined;
  if(indices&&indices.length>1&&new Set(indices).size===indices.length){const ps=indices.map(i=>byIndex.get(i));if(ps.every(p=>!!p&&validPoint(p))){regionSources.set(name,'face_mesh');return ps as Point[];}}
  const ps=contours.get(type)||[];
  regionSources.set(name,'face_detection');return ps.length===counts[type]&&ps.every(validPoint)?ps:[];
 }
 const outline=region('outline',1), left=region('leftEye',6), right=region('rightEye',7);
 if(outline.length<3||left.length<3||right.length<3)return blocked('Chưa thấy rõ đường viền và hai mắt. Hãy thử ảnh rõ hơn.');
 if(outline.some(p=>p.x<=2||p.y<=2||p.x>=a.width-2||p.y>=a.height-2||p.x<b.x-b.width*.25||p.x>b.x+b.width*1.25||p.y<b.y-b.height*.25||p.y>b.y+b.height*1.25))return blocked('Hãy lấy trọn khuôn mặt và tránh che đường viền.');
 const eyes=[mean(left),mean(right)].sort((p,q)=>p.x-q.x),dx=eyes[1].x-eyes[0].x,dy=eyes[1].y-eyes[0].y,ed=Math.hypot(dx,dy);
 if(ed<1||Math.abs(Math.atan2(dy,dx))>15*Math.PI/180)return blocked('Hãy giữ đầu ngay và chụp lại.','FACE_NOT_FRONTAL');
 onPhase?.('analyzing');
 const x=(p:Point)=>(p.x*dx+p.y*dy)/ed,y=(p:Point)=>(-p.x*dy+p.y*dx)/ed;
 const w=span(outline.map(x)),h=span(outline.map(y)),top=Math.min(...outline.map(y)),bottom=top+h;
 if(w<200||h<=0||ed>=w||[left,right].some(ps=>span(ps.map(x))<=0||span(ps.map(y))<=0))return blocked('Đường nét trong ảnh chưa đủ ổn định.');
 const within=(p:Point)=>x(p)>=Math.min(...outline.map(x))&&x(p)<=Math.max(...outline.map(x))&&y(p)>=top&&y(p)<=bottom;
 if(![...left,...right].every(within))return blocked('Vị trí mắt chưa khớp đường viền mặt.');
 function add(name:string,value:number,ps:string,formula:string,use:string,range:readonly[number,number]=[0,1],share=true){
  if(/(Width|Length|Thickness|Aspect|Height)$/.test(name)&&value<=0)return;
  // Coordinate axes/denominators also depend on outline and both eyes. Record
  // detection conservatively whenever any of those prerequisites falls back.
  const source=ps.startsWith('FaceContour')?'face_detection':ps.startsWith('all ')?'face_mesh':
   ['outline','leftEye','rightEye',...ps.split(/[ ,]/)].some(p=>regionSources.get(p)==='face_detection')?'face_detection':method;
  if(Number.isFinite(value)&&value>=range[0]&&value<=range[1]){features[name]={value,source,points:ps,formula,range,use,share};if(share){summary.features[name]=value;summary.featureSources[name]=source;}}
 }
 function tilt(ps:Point[]){const sorted=[...ps].sort((p,q)=>x(p)-x(q));const first=sorted[0],last=sorted[sorted.length-1];return Math.abs(Math.atan2(y(last)-y(first),x(last)-x(first)))/Math.PI;}
 add('outlineAspect',h/w,'outline','span(Y)/span(X)','bố trí má và điểm nhấn',[.5,2.5]);
 add('eyeSpacing',ed/w,'leftEye,rightEye','distance(centroids)/outline width','eyeliner');
 const closed=(face.probabilities?.leftEyeOpen!=null&&face.probabilities.leftEyeOpen<.4)||(face.probabilities?.rightEyeOpen!=null&&face.probabilities.rightEyeOpen<.4);
 const eyeWidths=[span(left.map(x)),span(right.map(x))];
 for(const [i,ps] of [left,right].entries()){
  const side=i===0?'left':'right';
  add(`${side}EyeWidth`,eyeWidths[i]/w,`${side}Eye`,'span(X)/outline width','phấn mắt');
  if(!closed)add(`${side}EyeTilt`,tilt(ps),`${side}Eye`,'abs(atan2(endpoint delta Y, endpoint delta X))/pi','hướng eyeliner tham khảo',[0,.25]);
  if(!closed)add(`${side}EyeAspect`,span(ps.map(y))/eyeWidths[i],`${side}Eye`,'span(Y)/span(X)','eyeliner',[0,1]);
  add(`${side}EyePosition`,(y(mean(ps))-top)/h,`${side}Eye,outline`,'(centroid Y-top)/height','vị trí điểm nhấn', [0,1],false);
  const brow=region(`${side}BrowTop`,i===0?2:4);
  if(brow.length>1&&brow.every(within)){
   const length=span(brow.map(x));
   add(`${side}BrowLength`,length/w,`${side}BrowTop`,'span(X)/width','kẻ mày');
   add(`${side}BrowTilt`,tilt(brow),`${side}BrowTop`,'abs(atan2(endpoint delta Y, endpoint delta X))/pi','hướng mày tham khảo',[0,.25]);
   // Arch is distance from the chord joining horizontal extrema, independent of point order.
   const sorted=[...brow].sort((p,q)=>x(p)-x(q)),a0=sorted[0],a1=sorted[sorted.length-1],chord=distance(a0,a1);
   const arch=Math.max(...brow.map(p=>Math.abs((a1.x-a0.x)*(a0.y-p.y)-(a0.x-p.x)*(a1.y-a0.y))/chord));
   add(`${side}BrowArch`,arch/length,`${side}BrowTop`,'max distance to endpoint chord / brow width','mày mềm',[0,1]);
   add(`${side}BrowEyeGap`,(y(mean(ps))-y(mean(brow)))/h,`${side}BrowTop,${side}Eye`,'eye centroid Y minus brow centroid Y / height','khoảng tán phấn mắt');
  }
 }
 add('eyeWidthDifference',Math.abs(eyeWidths[0]-eyeWidths[1])/w,'leftEye,rightEye','abs(width L-width R)/outline width','chỉ so sánh ảnh; không đánh giá ngoại hình',[0,1],false);
 const bridge=region('noseBridge',12),base=contours.get(13)||[];
 if(bridge.length>1&&bridge.every(within))add('noseBridgeLength',span(bridge.map(y))/h,'noseBridge','span(Y)/height','highlight tham khảo');
 if(base.length===3&&base.every(p=>validPoint(p)&&within(p)))add('noseBaseWidth',span(base.map(x))/w,'FaceContour.NOSE_BOTTOM[0..2]','span(X)/width','tạo khối tham khảo');
 const upper=region('upperLipTop',8),upperInner=region('upperLipBottom',9),lowerInner=region('lowerLipTop',10),lower=region('lowerLipBottom',11);
 const mouth=[...upper,...lower];
 if(upper.length>1&&lower.length>1&&mouth.every(within)&&!expressionLimited){
  const mw=span(mouth.map(x));
  add('mouthWidth',mw/w,'upperLipTop,lowerLipBottom','span(X)/width','son');
  add('mouthAspect',span(mouth.map(y))/mw,'upperLipTop,lowerLipBottom','span(Y)/mouth width','viền môi',[0,1]);
  if(upperInner.length>1&&upperInner.every(within))add('upperLipThickness',Math.abs(y(mean(upperInner))-y(mean(upper)))/h,'upperLipTop,upperLipBottom','abs(centroid Y difference)/height','son',[0,1]);
  if(lowerInner.length>1&&lowerInner.every(within))add('lowerLipThickness',Math.abs(y(mean(lowerInner))-y(mean(lower)))/h,'lowerLipTop,lowerLipBottom','abs(centroid Y difference)/height','son',[0,1]);
  add('mouthPosition',(y(mean(mouth))-top)/h,'lips,outline','(mouth centroid Y-top)/height','vị trí môi',[0,1],false);
  add('lowerFaceHeight',(bottom-y(mean(mouth)))/h,'lips,outline','(bottom-mouth centroid Y)/height','highlight cằm tham khảo');
 }
 for(const [name,fraction] of [['outlineUpperWidth',.25],['outlineMiddleWidth',.5],['outlineLowerWidth',.75],['chinWidth',.9]] as const){
  const ps=outline.filter(p=>Math.abs((y(p)-top)/h-fraction)<=.08);
  if(ps.length>=2)add(name,span(ps.map(x))/w,'outline band '+fraction,'span(X) within Y band +/- .08 / width','má/tạo khối tham khảo',[0,1]);
 }
 let perimeter=0,area=0;
 outline.forEach((p,i)=>{const q=outline[(i+1)%outline.length];perimeter+=distance(p,q);area+=p.x*q.y-q.x*p.y;});
 add('outlineCompactness',4*Math.PI*Math.abs(area/2)/(perimeter*perimeter),'ordered outline','4*pi*polygon area/perimeter squared','chẩn đoán đường viền',[0,1],false);
 if(meshValid){
  let area=0;let trianglesValid=!!mesh!.triangles.length;
  for(const t of mesh!.triangles){if(t.length!==3||new Set(t).size!==3||!t.every(i=>byIndex.has(i))){trianglesValid=false;break;}const [p,q,r]=t.map(i=>byIndex.get(i)!);area+=Math.abs((q.x-p.x)*(r.y-p.y)-(q.y-p.y)*(r.x-p.x))/2;}
  if(trianglesValid)add('meshProjectedArea',area/(w*h),'all SDK triangles','sum projected triangle areas/(width*height)','chẩn đoán mesh',[0,4],false);
  add('meshRelativeZSpan',span(mesh!.points.map(p=>p.z))/w,'all 468 points','span(relative Z)/width; NOT physical depth','chẩn đoán mesh',[0,4],false);
 }
 summary.missing=names.filter(n=>!features[n]);
 if(closed)summary.limitations.push('Mắt nhắm hoặc chưa rõ: bỏ tỷ lệ độ mở mắt.');
 if(expressionLimited)summary.limitations.push('Biểu cảm cười: bỏ các tỷ lệ môi nhạy với biểu cảm.');
 const eyeProbabilities=[face.probabilities?.leftEyeOpen,face.probabilities?.rightEyeOpen];
 return {status:'valid',features,summary,qualityContext:{eyesClosed:closed?true:eyeProbabilities.every(v=>typeof v==='number'&&Number.isFinite(v))?false:null}};
}
