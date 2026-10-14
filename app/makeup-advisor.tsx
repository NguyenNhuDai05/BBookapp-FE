import React,{useCallback,useEffect,useRef,useState} from 'react';
import {ActivityIndicator,AppState,BackHandler,Image,Modal,ScrollView,StyleSheet,Switch,Text,TouchableOpacity,View} from 'react-native';
import {SafeAreaView,useSafeAreaInsets} from 'react-native-safe-area-context';
import {ArrowLeft,ShieldCheck} from 'lucide-react-native';
import {useFocusEffect,useRouter} from 'expo-router';
import {useQuery} from '@tanstack/react-query';
import {MemoryDiagnostics} from '../features/makeupAdvisor/MemoryDiagnostics';
import {DynamicScanStatus,ScanSuccessTransition} from '../features/makeupAdvisor/DynamicScanStatus';
import {ScanPhoto} from '../features/makeupAdvisor/ScanPhoto';
import {advisorEnabled} from '../features/makeupAdvisor/flags';
import {useAdvisor} from '../features/makeupAdvisor/useAdvisor';
import {AdvisorResults,AdvisorButton,styles as s} from '../features/makeupAdvisor/AdvisorResults';
import {AdvisorMatching} from '../features/makeupAdvisor/AdvisorMatching';
import {AdvisorLanding} from '../features/makeupAdvisor/AdvisorLanding';
import {exploreService} from '../services/exploreService';
import type {ExploreStyle} from '../types/explore';
import {AdvisorPreferences} from '../features/makeupAdvisor/AdvisorPreferences';
import {AdvisorCamera} from '../features/makeupAdvisor/AdvisorCamera';
import {discardCameraPhoto} from '../features/makeupAdvisor/cameraPhoto';
import type {Photo} from '../features/makeupAdvisor/faceAnalysis';
import {RecommendationDebug} from '../features/makeupAdvisor/RecommendationDebug';
export default function MakeupAdvisor(){
 const router=useRouter(),ai=useAdvisor(),insets=useSafeAreaInsets();
 const [consent,setConsent]=useState(false),[chosen,setChosen]=useState<ExploreStyle>();
 const [privacy,setPrivacy]=useState(false),[capture,setCapture]=useState(false),[matching,setMatching]=useState(false);
 const [pendingAcquisition,setPendingAcquisition]=useState<boolean>();
 const home=useQuery({queryKey:['customer-explore','home'],queryFn:({signal})=>exploreService.home(signal),enabled:advisorEnabled&&ai.stage==='results',retry:false,staleTime:60000});
 const acquire=(camera:boolean)=>{if(ai.busy)return;ai.prepareRetry?.();if(!consent)setPendingAcquisition(camera);else if(camera)setCapture(true);else{const fromCamera=capture;setCapture(false);setChosen(undefined);setMatching(false);void Promise.resolve(ai.pick(false)).then(outcome=>{if(outcome==='cancelled'&&fromCamera&&mounted.current&&AppState.currentState==='active')setCapture(true);});}};
 const mounted=useRef(true),pendingCapture=useRef<Photo|undefined>(undefined);
 const discardPending=useCallback(()=>{const photo=pendingCapture.current;pendingCapture.current=undefined;void discardCameraPhoto(photo);},[]);
 useEffect(()=>{mounted.current=true;const sub=AppState.addEventListener('change',state=>{if(state!=='active')discardPending();});return()=>{mounted.current=false;discardPending();sub.remove();};},[discardPending]);
 useFocusEffect(useCallback(()=>()=>{discardPending();setCapture(false);},[discardPending]));
 useEffect(()=>{if(!capture)return;const sub=BackHandler.addEventListener('hardwareBackPress',()=>{setCapture(false);return true;});return()=>sub.remove();},[capture]);
 const receivedPhoto=async(photo:Photo)=>{
  pendingCapture.current=photo;setCapture(false);setChosen(undefined);setMatching(false);
  // Let the CameraView unmount before the existing bounded normalizer starts.
  await new Promise<void>(resolve=>requestAnimationFrame(()=>resolve()));
  if(!mounted.current||pendingCapture.current!==photo||AppState.currentState!=='active'){await discardCameraPhoto(photo);return;}
  pendingCapture.current=undefined;
  await ai.pickPhoto(photo);
 };
 const reset=()=>{ai.reset();setChosen(undefined);setMatching(false);};
 const isResults=ai.stage==='results'&&!!ai.result;
 if(!advisorEnabled)return <SafeAreaView style={s.page}><Text>Makeup Advisor chưa được bật trong bản này.</Text><AdvisorButton title="Quay về" onPress={()=>router.back()}/></SafeAreaView>;
 return <SafeAreaView edges={capture?[]:['top','bottom']} style={s.page}>
  {capture?<AdvisorCamera onBack={()=>setCapture(false)} onGallery={()=>acquire(false)} onPhoto={photo=>void receivedPhoto(photo)}/>:<>
  <View style={ui.header}><TouchableOpacity accessibilityRole="button" accessibilityLabel={matching?'Quay về Top 3':'Quay về Khám phá'} style={ui.icon} onPress={()=>matching?setMatching(false):ai.stage==='error'?reset():router.back()}><ArrowLeft size={21} color="#2B1B2A"/></TouchableOpacity><Text style={[s.label,{flex:1,fontSize:9,letterSpacing:1}]}>BBOOK · AI MAKEUP ADVISOR</Text><TouchableOpacity accessibilityRole="button" accessibilityLabel="Quyền xử lý ảnh" style={ui.icon} onPress={()=>setPrivacy(true)}><ShieldCheck size={20} color="#a45879"/></TouchableOpacity></View>
  <ScrollView key={`${ai.stage}-${matching?'matching':'advisor'}`} removeClippedSubviews={false} contentContainerStyle={[s.content,{paddingTop:8,paddingBottom:24},isResults&&{width:'100%',maxWidth:760,alignSelf:'center',paddingHorizontal:20}]}>
   {!isResults&&ai.stage!=='scanning'&&ai.stage!=='error'&&<>
    <AdvisorLanding/>
    {!ai.scanAvailable&&<Text style={s.note}>Hãy dùng bản Android có hỗ trợ quét khuôn mặt để trải nghiệm.</Text>}
    {ai.photo&&!ai.busy&&<><ScanPhoto photo={ai.photo} analysis={ai.analysis} scanning={false}/><AdvisorButton title="Phân tích lại ảnh này" disabled={!consent} onPress={()=>void ai.scan()}/><AdvisorButton title="Xóa ảnh" onPress={reset}/></>}
   </>}
   {(ai.stage==='scanning'||ai.stage==='error')&&<>
    <Text style={ui.title}>{ai.stage==='error'?'Chưa hoàn tất lần quét':'Đang khám phá đường nét của bạn'}</Text>
    {ai.photo&&(ai.stage==='error'?<Image source={{uri:ai.photo.uri}} style={ui.selfie} accessibilityLabel="Selfie của lần quét này"/>:<ScanPhoto photo={ai.photo} analysis={ai.analysis} scanning showStatus={false}/>)}
    <DynamicScanStatus phase={ai.phase} failure={ai.failure}/>
    {ai.stage==='error'&&<MemoryDiagnostics snapshot={ai.diagnosticSnapshot} code={ai.failure?.code}/>}
    {ai.stage==='error'?<><AdvisorButton title="Chụp lại" disabled={ai.busy} primary onPress={()=>acquire(true)}/><AdvisorButton title="Chọn ảnh khác" disabled={ai.busy} onPress={()=>acquire(false)}/></>:<AdvisorButton title="Hủy quét / chụp lại" onPress={reset}/>}
   </>}
   {isResults&&ai.result&&(matching?<AdvisorMatching chosen={chosen} recommendations={ai.result.recommendations} catalog={home.data} onStyle={setChosen}/>:<>
    <AdvisorResults result={ai.result} catalog={home.data} onStyle={style=>{setChosen(style);setMatching(true);}} onReset={reset} onNewPhoto={()=>acquire(true)} busy={ai.busy} photoUri={ai.photo?.uri} catalogLoading={home.isLoading} extraction={ai.extraction} effects={ai.effectsEnabled?ai.effects:undefined} onEffects={ai.effectsEnabled?e=>{setChosen(undefined);ai.setEffects(e);}:undefined}/>
    {home.isError&&<AdvisorButton title="Thử tải catalog lại" onPress={()=>void home.refetch()}/>}
    {ai.preferences&&<AdvisorPreferences value={ai.preferences} disabled={ai.busy} onChange={p=>{setChosen(undefined);ai.setPreferences(p);}}/>}
    <RecommendationDebug trace={ai.result.rankingTrace}/>
   </>)}
   {ai.busy&&ai.phase==='initializing'&&ai.stage!=='scanning'&&ai.stage!=='error'&&<View style={s.row}><ActivityIndicator color="#FF5C9A"/><Text accessibilityLiveRegion="polite" style={s.note}>Đang chuẩn bị ảnh...</Text></View>}
  </ScrollView>
  {!isResults&&ai.stage!=='scanning'&&ai.stage!=='error'&&<View style={ui.footer}><AdvisorButton title="Bắt đầu khám phá" primary disabled={ai.busy||!ai.scanAvailable} onPress={()=>acquire(true)}/></View>}
  </>}
  <Modal visible={pendingAcquisition!==undefined||privacy} transparent animationType="slide" onRequestClose={()=>{setPendingAcquisition(undefined);setPrivacy(false);}}>
   <View style={s.scrim}><View accessibilityViewIsModal style={s.sheet}><ScrollView contentContainerStyle={{padding:24,paddingBottom:24+insets.bottom,gap:16}}>
    <Text style={s.heading}>{privacy?'Quyền xử lý ảnh':'Trước khi chọn selfie'}</Text><Text style={s.body}>BBook xử lý ảnh trên thiết bị. Ảnh tạm do Advisor tạo được xóa khi đổi ảnh hoặc rời luồng. Gợi ý chỉ để tham khảo; không xác định undertone hay dáng mặt chắc chắn.</Text>
    <View style={[s.row,{flexWrap:'nowrap'}]}><Switch accessibilityLabel="Đồng ý xử lý ảnh trên thiết bị" value={consent} onValueChange={v=>{setConsent(v);if(!v){reset();}}}/><Text style={[s.body,{flex:1}]}>Tôi đồng ý xử lý ảnh trên thiết bị.</Text></View>
    {pendingAcquisition!==undefined&&<AdvisorButton title="Tiếp tục chọn ảnh" primary disabled={!consent} onPress={()=>{const camera=pendingAcquisition===true;setPendingAcquisition(undefined);setCapture(false);setChosen(undefined);setMatching(false);if(camera)setCapture(true);else void ai.pick(false);}}/>}
    {privacy&&ai.photo&&<AdvisorButton title="Xóa ảnh" onPress={()=>{reset();setPrivacy(false);}}/>}
    {privacy&&<AdvisorButton title="Gửi góp ý về trải nghiệm" onPress={()=>{setPrivacy(false);router.push('/feedback');}}/>}
    <AdvisorButton title={privacy?'Đóng':'Để sau'} onPress={()=>{setPendingAcquisition(undefined);setPrivacy(false);}}/>
   </ScrollView></View></View>
  </Modal>
  {isResults&&ai.phase==='success'&&ai.photo&&<ScanSuccessTransition photo={ai.photo} analysis={ai.analysis}/>}
 </SafeAreaView>;
}
const ui=StyleSheet.create({header:{flexDirection:'row',alignItems:'center',gap:10,paddingHorizontal:14,paddingVertical:6},icon:{minWidth:44,minHeight:44,alignItems:'center',justifyContent:'center'},title:{fontSize:28,lineHeight:35,fontWeight:'700',letterSpacing:-.6,color:'#2B1B2A'},selfie:{width:62,height:76,borderRadius:18},footer:{paddingHorizontal:24,paddingTop:12,paddingBottom:12,backgroundColor:'#FFF7FA'}});
