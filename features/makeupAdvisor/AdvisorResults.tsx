import React,{useState} from 'react';
import {Modal,ScrollView,StyleSheet,Text,TouchableOpacity,View,useWindowDimensions} from 'react-native';
import {LinearGradient} from 'expo-linear-gradient';
import {ArrowRight,Sparkles,X} from 'lucide-react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import type {AdvisorResult,MakeupRecommendation} from './advisorRecommendation';
import type {ExploreHome,ExploreStyle} from '../../types/explore';
import {presentationAliasesFor,catalogIntensityLabel,catalogLabels,catalogValidation,conditionalTipsFor,presentationCatalog,presentationStyle,presentRecommendation,type CatalogStyle} from './presentationCatalog';
import type {Extraction} from './faceFeatures/extractor';
import type {LibraryPreferences} from './styleLibrary';
import {resolveStyles} from './recommendations';
import {AdvisorImage,MakeupStyleImage,MakeupStylePalette} from './ResultVisuals';
import {AdvisorMarketplace} from './AdvisorMarketplace';
import {AdvisorEffects} from './AdvisorEffects';
import {AdvisorPreferences} from './AdvisorPreferences';
import {AdvisorDisclosure} from './AdvisorDisclosure';
import {suggestionLabels,type MakeupEffect} from './effects';
import {advisorTheme as t} from './advisorTheme';

export function AdvisorButton({title,onPress,disabled=false,primary=false,resultStyle=false}:{title:string;onPress:()=>void;disabled?:boolean;primary?:boolean;resultStyle?:boolean}){
 return <TouchableOpacity accessibilityRole="button" accessibilityState={{disabled}} disabled={disabled} onPress={onPress} style={[styles.button,resultStyle&&{borderRadius:16},primary&&{padding:0,overflow:'hidden'},disabled&&{opacity:.45}]}>{primary?<LinearGradient colors={['#B82760','#A72155']} start={{x:0,y:0}} end={{x:1,y:1}} style={ui.primary}><Text style={[styles.buttonText,{color:'#fff'}]}>{title}</Text></LinearGradient>:<Text style={styles.buttonText}>{title}</Text>}</TouchableOpacity>;
}
function Tags({tags}:{tags:string[]}){return <View style={ui.tags}>{[...new Set(tags)].map(tag=><View key={tag} style={ui.tag}><Text style={ui.tagText}>{tag}</Text></View>)}</View>;}
export function AdvisorResultHeader({photoUri}:{photoUri?:string}){return <View style={ui.header}>
 <View style={ui.headerCopy}><View style={ui.eyebrow}><Sparkles size={14} color={t.accent}/><Text style={ui.eyebrowText}>GỢI Ý DÀNH CHO BẠN</Text></View><Text style={ui.title}>3 phong cách makeup cho bạn</Text><Text style={styles.body}>Khám phá phong cách từ đường nét của bạn. Chọn một gợi ý để xem hướng dẫn.</Text></View>
 {photoUri&&<View style={ui.selfieFrame}><AdvisorImage source={{uri:photoUri}} label="Selfie của bạn trong phiên này" style={ui.selfie}/><Text style={ui.selfieLabel}>Ảnh của bạn</Text></View>}
 </View>;}
export function MakeupRecommendationCard({row,index,onDetail}:{row:MakeupRecommendation;index:number;onDetail:()=>void}){
 row=presentRecommendation(row);const entry=presentationStyle(row.styleKey);
 const tags=(row.scoringMetadataVersion?row.occasionFit:entry?catalogLabels(entry,'tagLabels'):row.occasionFit).filter(Boolean);
 return <View style={[ui.recommendation,index===0&&ui.featured]}>
  <View style={ui.thumbnailColumn}><TouchableOpacity accessibilityRole="button" accessibilityLabel={`Hạng ${index+1}, ${row.title}, mở hướng dẫn makeup`} onPress={onDetail} style={ui.thumbnailButton}><MakeupStyleImage styleKey={row.styleKey} style={ui.thumbnail}/></TouchableOpacity><Text style={ui.rank}>{String(index+1).padStart(2,'0')}</Text></View>
  <View style={ui.cardCopy}><Text style={ui.name}>{row.title}</Text><Text numberOfLines={2} style={ui.description}>{row.shortDescription}</Text><Tags tags={[...new Set(tags)].slice(0,2)}/><TouchableOpacity accessibilityRole="button" accessibilityLabel={`Xem chi tiết ${row.title}`} onPress={onDetail} style={ui.detailButton}><Text style={ui.detailText}>Khám phá</Text><ArrowRight size={16} color={t.accent}/></TouchableOpacity></View>
 </View>;
}
type Props={result:AdvisorResult;catalog?:ExploreHome;onStyle:(s:ExploreStyle)=>void;onReset:()=>void;onNewPhoto?:()=>void;onTryMakeup?:()=>void;busy?:boolean;catalogLoading?:boolean;photoUri?:string;extraction?:Extraction;effects?:MakeupEffect[];onEffects?:(v:MakeupEffect[])=>void;preferences?:LibraryPreferences;onPreferences?:(p:LibraryPreferences)=>void};
export function AdvisorResults({result,catalog,onStyle,onReset,onNewPhoto,onTryMakeup,busy=false,catalogLoading=false,photoUri,extraction,effects,onEffects,preferences,onPreferences}:Props){
 const [detail,setDetail]=useState<MakeupRecommendation|CatalogStyle>(),[browse,setBrowse]=useState(false);
 const insets=useSafeAreaInsets(),{height}=useWindowDimensions();
 const recommendation=detail&&'styleKey' in detail?presentRecommendation(detail):undefined;
 const library=detail?('key' in detail?detail:presentationStyle(detail.styleKey)):undefined;
 const detailLabels=library?result.scoringLabels?.[library.key]:undefined;
 const key=recommendation?.styleKey||library?.key||'';
 const close=()=>setDetail(undefined);
 const selectedCount=(effects?.length||0)+(preferences?.occasion?1:0)+(preferences?.intensity?1:0);
 const detailTags=library?[...catalogLabels(library,'tagLabels'),...(detailLabels?.occasions||(recommendation?.scoringMetadataVersion?recommendation.occasionFit:catalogLabels(library,'occasionLabels'))),...(detailLabels?[detailLabels.intensity]:recommendation?.scoringMetadataVersion&&recommendation.scoringIntensityLabel?[recommendation.scoringIntensityLabel]:catalogIntensityLabel(library))]:[];
 return <>
  <AdvisorResultHeader photoUri={photoUri}/>
  {onTryMakeup&&<AdvisorButton resultStyle primary title="Thử makeup trên tôi" disabled={busy} onPress={onTryMakeup}/>}
  {((effects&&onEffects)||(preferences&&onPreferences))&&<AdvisorDisclosure title="Tùy chỉnh gợi ý · Không bắt buộc" summary={selectedCount?`${selectedCount} lựa chọn · Có thể thay đổi hoặc xóa`:'Không cần chọn gì để nhận đủ 3 gợi ý'}>
   {effects&&onEffects&&<AdvisorEffects embedded value={effects} onChange={onEffects} disabled={busy} conflict={result.effectConflict}/>}
   {preferences&&onPreferences&&<AdvisorPreferences embedded value={preferences} disabled={busy} onChange={onPreferences}/>}
  </AdvisorDisclosure>}
  {result.effectConflict&&<Text accessibilityLiveRegion="polite" style={styles.note}>Chưa có phong cách khớp đầy đủ hiệu ứng. BBook giữ gợi ý ban đầu.</Text>}
  <View style={ui.list}>{result.recommendations.slice(0,3).map((r,i)=><MakeupRecommendationCard key={r.styleKey} row={r} index={i} onDetail={()=>setDetail(r)}/>)}</View>
  <Text style={styles.note}>Gợi ý trên thiết bị, chỉ để tham khảo. Ảnh và bảng màu minh họa phong cách, không mô phỏng trên selfie.{result.localEvidence==='experimental'?' Dữ liệu quét thử nghiệm, chưa được hiệu chuẩn.':''}</Text>
  <AdvisorMarketplace catalog={catalog} recommendations={result.recommendations} catalogLoading={catalogLoading}/>
  <AdvisorButton resultStyle title="Thử phân tích lại" disabled={busy} onPress={onNewPhoto||onReset}/><AdvisorButton resultStyle title="Khám phá phong cách khác" onPress={()=>setBrowse(true)}/>
  <Modal visible={browse&&!detail} animationType="slide" transparent onRequestClose={()=>setBrowse(false)}><View style={styles.scrim}><View accessibilityViewIsModal style={styles.sheet}><View style={ui.sheetHeader}><Text style={[styles.heading,ui.flex]}>Khám phá phong cách</Text><TouchableOpacity accessibilityRole="button" accessibilityLabel="Đóng catalog" onPress={()=>setBrowse(false)} style={ui.close}><X size={22} color={t.text}/></TouchableOpacity></View><ScrollView contentContainerStyle={{padding:20,paddingBottom:20+insets.bottom,gap:10}}>{browse&&!detail&&presentationCatalog.map(s=><AdvisorButton resultStyle key={s.key} title={s.displayName} onPress={()=>setDetail(s)}/>)}</ScrollView></View></View></Modal>
  <Modal visible={!!detail} animationType="slide" onRequestClose={close} transparent><View style={styles.scrim}><View accessibilityViewIsModal style={styles.sheet}>
   <View style={ui.sheetHeader}><Text style={[styles.heading,ui.flex]}>{recommendation?.title||library?.displayName}</Text><TouchableOpacity accessibilityRole="button" accessibilityLabel="Đóng hướng dẫn" style={ui.close} onPress={close}><X size={22} color={t.text}/></TouchableOpacity></View>
   {detail&&<ScrollView contentContainerStyle={{gap:16,padding:20,paddingBottom:20+insets.bottom}}>
    <MakeupStyleImage styleKey={key} style={{maxHeight:Math.min(420,height*.46)}}/>
    <Text style={styles.body}>{library?.shortDescription||recommendation?.shortDescription}</Text>
    {library&&<><Text style={styles.heading}>Dấu ấn phong cách</Text><Text style={styles.body}>{library.signatureLook}</Text></>}
    {!!recommendation?.whyItFits&&<><Text style={styles.heading}>Lý do gợi ý</Text><Text style={styles.body}>{recommendation.whyItFits}</Text></>}
    <Text style={styles.heading}>Bảng màu gợi ý</Text><MakeupStylePalette colors={recommendation?.colorSuggestions||(library?catalogLabels(library,'colorPaletteLabels'):[])}/>
    {!!detailTags.length&&<Tags tags={detailTags}/>}
    {recommendation?.suggestionSource&&<Text style={styles.note}>{suggestionLabels[recommendation.suggestionSource]}</Text>}
    <AdvisorDisclosure key={key} title="Kỹ thuật và các bước thực hiện">
     <Text style={styles.label}>KỸ THUẬT TRANG ĐIỂM</Text>{(library?Object.values(library.techniques):recommendation?.makeupFocus||[]).map((text,i)=><Text key={`${i}-${text}`} style={styles.body}>{text}</Text>)}
     <Text style={styles.heading}>Các bước thực hiện</Text>{(recommendation?.quickSteps||library?.quickSteps||[]).map((text,i)=><Text key={`${i}-${text}`} style={styles.body}>{i+1}. {text}</Text>)}
     {library&&<><Text style={styles.body}>{library.whyTry}</Text>{conditionalTipsFor(library,extraction).map(tip=><View key={tip.feature+tip.observation}><Text style={styles.body}>{tip.tip}</Text><Text style={styles.note}>{tip.reason}</Text></View>)}</>}
    </AdvisorDisclosure>
    {library&&catalogValidation.issues.some(i=>i.styleKey===library.key)&&<Text style={styles.note}>Một số nhãn đang được cập nhật.</Text>}
    {resolveStyles(presentationAliasesFor(key,effects!==undefined),catalog?.styles||[]).map(s=><AdvisorButton resultStyle key={s.id} title={`Tìm MUA · ${library?.displayName||s.name}`} primary onPress={()=>{close();setBrowse(false);onStyle(s);}}/>)}
    <AdvisorButton resultStyle title={browse?'Quay về catalog':'Quay về Top 3'} onPress={close}/>
   </ScrollView>}
  </View></View></Modal>
 </>;
}
const ui=StyleSheet.create({primary:{alignSelf:'stretch',padding:14,alignItems:'center',justifyContent:'center',minHeight:50},header:{flexDirection:'row',gap:12,alignItems:'flex-start'},headerCopy:{flex:1,gap:8},eyebrow:{flexDirection:'row',alignItems:'center',gap:6},eyebrowText:{fontSize:10,lineHeight:16,letterSpacing:.7,fontWeight:'700',color:t.accent,flexShrink:1},title:{fontSize:25,lineHeight:32,fontWeight:'700',letterSpacing:-.5,color:t.text},selfieFrame:{width:64,gap:4},selfie:{width:'100%',aspectRatio:4/5,borderRadius:12},selfieLabel:{fontSize:10,lineHeight:15,textAlign:'center',color:t.body},list:{gap:10},recommendation:{flexDirection:'row',alignItems:'flex-start',padding:10,gap:12,borderRadius:16,backgroundColor:t.surface,borderWidth:1,borderColor:t.border},featured:{borderColor:'#E7B1C5'},thumbnailColumn:{width:84,gap:5,alignItems:'center'},thumbnailButton:{width:84},thumbnail:{width:84,height:112,aspectRatio:undefined,borderRadius:10},cardCopy:{flex:1,minWidth:0,gap:5},rank:{fontSize:11,lineHeight:16,color:t.body,fontWeight:'600'},name:{fontSize:15,lineHeight:21,fontWeight:'700',color:t.text},description:{fontSize:12,lineHeight:18,color:t.body},tags:{flexDirection:'row',flexWrap:'wrap',gap:6},tag:{backgroundColor:t.accentSoft,borderRadius:10,paddingHorizontal:8,paddingVertical:4,maxWidth:'100%'},tagText:{fontSize:11,lineHeight:16,color:t.accent},detailButton:{alignSelf:'flex-start',minHeight:44,flexDirection:'row',gap:6,alignItems:'center'},detailText:{fontSize:12,lineHeight:18,fontWeight:'600',color:t.accent},close:{minHeight:44,minWidth:44,alignItems:'center',justifyContent:'center'},sheetHeader:{flexDirection:'row',alignItems:'center',gap:8,paddingHorizontal:20,paddingVertical:10,borderBottomWidth:1,borderBottomColor:t.border},flex:{flex:1}});
export const styles=StyleSheet.create({page:{flex:1,backgroundColor:t.background},content:{padding:20,gap:14},card:{padding:16,gap:12,borderRadius:16,backgroundColor:t.surface,borderWidth:1,borderColor:t.border},heading:{fontSize:17,lineHeight:24,fontWeight:'700',color:t.text},body:{fontSize:14,lineHeight:22,color:t.body},label:{fontSize:10,lineHeight:16,fontWeight:'700',letterSpacing:1,color:t.accent},note:{fontSize:12,lineHeight:18,color:t.body},button:{padding:12,borderRadius:16,backgroundColor:t.accentSoft,alignItems:'center',justifyContent:'center',minHeight:48},buttonText:{color:t.accent,fontWeight:'600',fontSize:14,lineHeight:21,textAlign:'center'},cover:{width:'100%',height:160,borderRadius:12},scrim:{flex:1,justifyContent:'flex-end',backgroundColor:'#2B1B2A66'},sheet:{maxHeight:'90%',width:'100%',maxWidth:600,alignSelf:'center',backgroundColor:t.background,borderTopLeftRadius:20,borderTopRightRadius:20},row:{flexDirection:'row',gap:12,alignItems:'center',flexWrap:'wrap'}});
