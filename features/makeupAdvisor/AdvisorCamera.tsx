import React,{useCallback,useEffect,useRef,useState} from 'react';
import {ActivityIndicator,AppState,Linking,Modal,ScrollView,StyleSheet,Text,TouchableOpacity,View} from 'react-native';
import {CameraView,useCameraPermissions,type CameraType} from 'expo-camera';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useIsFocused} from 'expo-router/react-navigation';
import {useFocusEffect} from 'expo-router';
import {LinearGradient} from 'expo-linear-gradient';
import {StatusBar} from 'expo-status-bar';
import {ArrowLeft,CircleHelp,ImagePlus,RefreshCw} from 'lucide-react-native';
import Svg,{Path} from 'react-native-svg';
import {diagnosticSession,scanDiagnostic} from './scanDiagnostics';
import {beginCameraObservation,cameraMemoryCheckpoint,type Photo} from './faceAnalysis';
import {discardCameraPhoto} from './cameraPhoto';
import {AdvisorButton,styles as shared} from './AdvisorResults';
export function AdvisorCamera({onBack,onGallery,onPhoto}:{onBack:()=>void;onGallery:()=>void;onPhoto:(photo:Photo)=>void}){
 const [permission,requestPermission,getPermission]=useCameraPermissions();const focused=useIsFocused(),insets=useSafeAreaInsets();
 const [foreground,setForeground]=useState(AppState.currentState==='active'),[facing,setFacing]=useState<CameraType>('front');
 const [ready,setReady]=useState(false),[taking,setTaking]=useState(false),[error,setError]=useState(''),[help,setHelp]=useState(false),[attempt,setAttempt]=useState(0);
 const [frame,setFrame]=useState({width:0,height:0});const camera=useRef<CameraView>(null),alive=useRef(true),epoch=useRef(0),gate=useRef(false);
 const [pictureSize,setPictureSize]=useState<string>();
 const switching=useRef(false),readyRef=useRef(false),sizing=useRef(false),session=useRef(''),started=useRef(0);
 useEffect(()=>{beginCameraObservation();session.current=diagnosticSession();started.current=Date.now();},[]);
 const log=useCallback((event:Parameters<typeof scanDiagnostic>[1],state?:string)=>{scanDiagnostic(session.current,event,started.current,{state});if(['camera_mount','camera_ready','capture_start','capture_success','camera_unmount'].includes(event))cameraMemoryCheckpoint(session.current,event);},[]);
 const markReady=useCallback((value:boolean)=>{readyRef.current=value;setReady(value);},[]);
 const invalidate=useCallback(()=>{epoch.current++;sizing.current=false;readyRef.current=false;},[]);
 useEffect(()=>{alive.current=true;const subscription=AppState.addEventListener('change',state=>{invalidate();markReady(false);setForeground(state==='active');if(state==='active')void getPermission().catch(()=>{if(alive.current)setError('Chưa kiểm tra được quyền camera. Hãy thử lại.');});});return()=>{alive.current=false;invalidate();subscription.remove();};},[getPermission,invalidate,markReady]);
 useFocusEffect(useCallback(()=>()=>{invalidate();markReady(false);},[invalidate,markReady]));
 async function request(){setError('');try{await requestPermission();}catch{if(alive.current)setError('Chưa cấp được quyền camera. Hãy mở cài đặt hoặc thử lại.');}}
 async function cameraReady(){
  const id=epoch.current;if(sizing.current)return;sizing.current=true;
  try{
   const sizes=await camera.current?.getAvailablePictureSizesAsync();
   if(!alive.current||id!==epoch.current)return;
   const candidates=(sizes||[]).map(size=>{const [w,h]=size.split('x').map(Number);return {size,w,h,area:w*h};}).filter(s=>Number.isFinite(s.area)&&s.w>=640&&s.h>=640&&Math.max(s.w,s.h)<=1920).sort((a,b)=>b.area-a.area);
   if(!candidates.length){setError('Camera chưa cung cấp kích thước ảnh phù hợp. Hãy thử camera khác hoặc chọn ảnh từ thư viện.');return;}
   // Bound capture output before Expo allocates a bitmap; ML Kit normalization is unchanged.
   const next=candidates[0].size;
   // Changing pictureSize binds CameraX again. Wait for that bind's real OPEN event.
   if(pictureSize!==next){setPictureSize(next);return;}
   markReady(true);log('camera_ready',facing);if(switching.current){switching.current=false;log('flip_completed',facing);}
  }catch{if(alive.current&&id===epoch.current)setError('Chưa chuẩn bị được camera. Hãy thử lại hoặc chọn ảnh.');}
  finally{if(id===epoch.current)sizing.current=false;}
 }
 async function shoot(){
  if(gate.current||!readyRef.current||!foreground||!focused||!camera.current)return;
  gate.current=true;log('capture_start');setTaking(true);setError('');const id=epoch.current;let photo:Photo|undefined;
  try{
   photo=await camera.current.takePictureAsync({quality:1,base64:false,exif:false,skipProcessing:false});
   if(!alive.current||id!==epoch.current){await discardCameraPhoto(photo);return;}
   await camera.current?.pausePreview();markReady(false);
   if(!alive.current||id!==epoch.current){await discardCameraPhoto(photo);return;}
   log('capture_success');onPhoto(photo);photo=undefined;
  }catch{log('capture_error');await discardCameraPhoto(photo);if(alive.current&&id===epoch.current){markReady(false);setError('Chưa chụp được ảnh. Hãy thử lại hoặc chọn ảnh từ thư viện.');}}
  finally{gate.current=false;if(alive.current)setTaking(false);}
 }
 useEffect(()=>{log('facing_changed',facing);},[facing,log]);
 const usable=permission?.granted&&foreground&&focused&&!error;
 useEffect(()=>{if(!usable)return;log('camera_mount');return()=>log('camera_unmount');},[usable,attempt,log]);
 useEffect(()=>{if(!usable||ready)return;const timer=setTimeout(()=>{invalidate();switching.current=false;markReady(false);log('camera_error','readiness_timeout');setError('Camera phản hồi quá lâu. Hãy thử lại hoặc chọn ảnh từ thư viện.');},12000);return()=>clearTimeout(timer);},[usable,ready,facing,pictureSize,attempt,invalidate,markReady,log]);
 useEffect(()=>{if(!taking)return;const timer=setTimeout(()=>{invalidate();markReady(false);log('camera_error','capture_timeout');setError('Camera chưa hoàn tất chụp. Bạn có thể quay về; ảnh trả về muộn sẽ được xóa.');},20000);return()=>clearTimeout(timer);},[taking,invalidate,markReady,log]);
 async function gallery(){if(gate.current)return;gate.current=true;const id=epoch.current;const timer=setTimeout(()=>{if(alive.current&&id===epoch.current){invalidate();markReady(false);log('camera_error','gallery_release_timeout');setError('Camera chưa dừng. Hãy quay về rồi mở thư viện lại.');}},12000);log('gallery_pressed');try{if(camera.current)await camera.current.pausePreview();if(alive.current&&id===epoch.current){markReady(false);onGallery();}}catch{if(alive.current){markReady(false);setError('Chưa dừng được camera. Hãy quay về rồi mở thư viện lại.');}}finally{clearTimeout(timer);gate.current=false;}}
 function flip(){if(gate.current||switching.current||!readyRef.current)return;switching.current=true;invalidate();markReady(false);log('flip_requested',facing);setFacing(v=>v==='front'?'back':'front');}
 const retry=()=>{if(gate.current)return;switching.current=false;invalidate();setError('');markReady(false);setAttempt(v=>v+1);};
 return <View style={s.page}><StatusBar style="light"/>
  {usable&&<CameraView key={attempt} ref={camera} style={StyleSheet.absoluteFill} facing={facing} mirror={false} mode="picture" pictureSize={pictureSize} flash="off" enableTorch={false} onCameraReady={()=>void cameraReady()} onMountError={()=>{invalidate();log('camera_error','mount_error');markReady(false);setError('Camera chưa sẵn sàng trên thiết bị này. Bạn có thể thử lại hoặc chọn ảnh.');}}/>}
  <LinearGradient pointerEvents="none" colors={['#130B17BB','#130B1700']} style={[s.topShade,{height:insets.top+190}]}/>
  <View style={[s.header,{paddingTop:insets.top+8}]}><TouchableOpacity accessibilityRole="button" accessibilityLabel="Quay về" style={s.icon} onPress={onBack}><ArrowLeft color="#fff" size={22}/></TouchableOpacity><View style={{flex:1}}/><TouchableOpacity accessibilityRole="button" accessibilityLabel="Hướng dẫn chụp" style={s.icon} onPress={()=>setHelp(true)}><CircleHelp color="#fff" size={22}/></TouchableOpacity></View>
  <View style={s.intro}><Text style={s.title}>Chụp ảnh khuôn mặt</Text><Text style={s.subtitle}>Đặt khuôn mặt vào khung để chụp ảnh rõ nét</Text></View>
  <View style={s.middle} onLayout={e=>setFrame(e.nativeEvent.layout)}>
   {usable?<View pointerEvents="none" style={StyleSheet.absoluteFill}><Svg width="100%" height="100%" viewBox={`0 0 ${Math.max(1,frame.width)} ${Math.max(1,frame.height)}`}>
    <Path d={`M${frame.width*.12+20},${frame.height*.07}h-8q-12,0 -12,12v8 M${frame.width*.88-20},${frame.height*.07}h8q12,0 12,12v8 M${frame.width*.12},${frame.height*.93-20}v8q0,12 12,12h8 M${frame.width*.88},${frame.height*.93-20}v8q0,12 -12,12h-8`} stroke="#FFA7CB" strokeWidth={2} fill="none"/>
   </Svg>{!ready&&<ActivityIndicator color="#FFD6E5" style={StyleSheet.absoluteFill}/>}</View>:<ScrollView contentContainerStyle={s.notice}>
    {!permission?<ActivityIndicator color="#FFD6E5"/>:<><Text accessibilityLiveRegion="polite" style={s.noticeTitle}>{error||(!permission.granted?'Cho phép BBook sử dụng camera':!foreground?'Camera đang tạm dừng':'Camera chưa sẵn sàng')}</Text><Text style={s.subtitle}>Bạn có thể chọn selfie từ thư viện. Ảnh chỉ được phân tích sau khi chọn.</Text>
    {!permission.granted&&<AdvisorButton title={permission.canAskAgain?'Cho phép camera':'Mở cài đặt quyền camera'} primary onPress={()=>permission.canAskAgain?void request():void Linking.openSettings()}/>}
    {!!error&&permission.granted&&<><AdvisorButton title="Thử lại camera" onPress={retry}/><AdvisorButton title="Thử camera khác" onPress={()=>{if(gate.current)return;invalidate();markReady(false);setError('');setFacing(v=>v==='front'?'back':'front');}}/></>}</>}
   </ScrollView>}
  </View>
  <LinearGradient pointerEvents="none" colors={['#130B1700','#130B17CC']} style={s.bottomShade}/>
  <View style={[s.bottom,{paddingBottom:Math.max(insets.bottom,12)+10}]}>
   <View style={s.guides}>{['Nhìn thẳng','Một khuôn mặt','Không filter mạnh'].map(t=><Text key={t} style={s.guide}>{t}</Text>)}</View>
   <View style={s.controls}>
    <TouchableOpacity accessibilityRole="button" accessibilityLabel="Chọn từ thư viện" disabled={taking} style={s.sideControl} onPress={()=>void gallery()}><ImagePlus color="#fff" size={24}/><Text style={s.controlLabel}>Thư viện</Text></TouchableOpacity>
    <TouchableOpacity accessibilityRole="button" accessibilityLabel="Chụp ảnh" accessibilityState={{disabled:!ready||taking}} disabled={!ready||taking} style={[s.shutter,(!ready||taking)&&{opacity:.5}]} onPress={()=>void shoot()}>{taking?<ActivityIndicator color="#bd4b79"/>:<View style={s.shutterInner}/>}</TouchableOpacity>
    <TouchableOpacity accessibilityRole="button" accessibilityLabel="Đổi camera" disabled={!ready||taking} style={s.sideControl} onPress={flip}><RefreshCw color="#fff" size={24}/><Text style={s.controlLabel}>Đổi camera</Text></TouchableOpacity>
   </View><Text style={s.frameNote}>{taking?'Đang chụp ảnh...':'Khung chỉ để căn mặt · phân tích sau khi chụp'}</Text>
  </View>
  <Modal visible={help} transparent animationType="fade" onRequestClose={()=>setHelp(false)}><View style={shared.scrim}><View accessibilityViewIsModal style={shared.sheet}><ScrollView contentContainerStyle={{padding:24,paddingBottom:24+insets.bottom,gap:16}}><Text style={shared.heading}>Một selfie rõ nét</Text><Text style={shared.body}>Nhìn thẳng và lấy trọn một khuôn mặt. Tránh filter mạnh. Khung hồng chỉ giúp căn ảnh, không nhận diện khuôn mặt liên tục.</Text><Text style={shared.note}>Ảnh được xử lý trên thiết bị, không tự động upload.</Text><AdvisorButton title="Đã hiểu" primary onPress={()=>setHelp(false)}/></ScrollView></View></View></Modal>
 </View>;
}
const s=StyleSheet.create({page:{flex:1,backgroundColor:'#181019'},topShade:{position:'absolute',top:0,left:0,right:0},header:{flexDirection:'row',paddingHorizontal:20,gap:12,alignItems:'center'},icon:{width:44,height:44,borderRadius:22,backgroundColor:'#20132166',alignItems:'center',justifyContent:'center'},intro:{paddingHorizontal:28,paddingTop:18,paddingBottom:14,gap:8},title:{color:'#fff',fontSize:27,fontWeight:'600',lineHeight:34,letterSpacing:-.5},subtitle:{color:'#F4DEE9',fontSize:13,lineHeight:20},middle:{flex:1,marginHorizontal:20,minHeight:0},notice:{padding:20,gap:16,flexGrow:1,justifyContent:'center'},noticeTitle:{color:'#fff',fontSize:19,lineHeight:27,fontWeight:'600'},bottomShade:{position:'absolute',bottom:0,left:0,right:0,height:250},bottom:{paddingHorizontal:20,paddingTop:12,gap:12},guides:{flexDirection:'row',justifyContent:'space-evenly',gap:6,flexWrap:'wrap'},guide:{fontSize:11,color:'#F4DEE9',paddingVertical:5},controls:{flexDirection:'row',alignItems:'center',justifyContent:'space-around',paddingVertical:18,paddingHorizontal:10,borderRadius:28,backgroundColor:'#110C15B8'},sideControl:{minWidth:64,minHeight:54,alignItems:'center',justifyContent:'center',gap:8},controlLabel:{color:'#fff',fontSize:10},shutter:{height:76,width:76,borderRadius:38,borderWidth:2,borderColor:'#FFA7CB',justifyContent:'center',alignItems:'center'},shutterInner:{height:62,width:62,borderRadius:31,backgroundColor:'#fff'},frameNote:{color:'#E2C4D4',fontSize:10,lineHeight:16,textAlign:'center'}});

