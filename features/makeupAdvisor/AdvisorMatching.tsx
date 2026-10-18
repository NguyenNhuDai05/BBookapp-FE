import React,{useState} from 'react';
import {ActivityIndicator,StyleSheet,Text,TextInput,TouchableOpacity,View} from 'react-native';
import {useAdvisorMatches} from './useAdvisorMatches';
import {useRouter} from 'expo-router';
import type {ExploreArtist,ExploreHome,ExploreService,ExploreStyle} from '../../types/explore';
import type {MakeupRecommendation} from './advisorRecommendation';
import {displayTitle,presentationCatalog} from './presentationCatalog';
import {aliasesFor} from './styleLibrary';
import {resolveStyles,hasServiceStyleTag} from './recommendations';
import {AdvisorButton,styles} from './AdvisorResults';
import {AdvisorImage} from './ResultVisuals';
import {advisorTheme as t} from './advisorTheme';
export function AdvisorMatching({chosen,catalog,recommendations=[],onStyle}:{chosen?:ExploreStyle;catalog?:ExploreHome;recommendations?:MakeupRecommendation[];onStyle:(s:ExploreStyle)=>void}){
 const router=useRouter();const [filtersOpen,setOpen]=useState(false),[province,setProvince]=useState<number>(),[budget,setBudget]=useState('');
 const maxPrice=budget.trim()&&Number.isFinite(Number(budget))&&Number(budget)>=0&&Number(budget)<=1e9?Number(budget):undefined;
 const filters={styleId:chosen?.id,provinceCode:province,maxPrice};
 const recommendation=recommendations.find(r=>resolveStyles(aliasesFor(r.styleKey),catalog?.styles||[]).some(s=>s.id===chosen?.id))||recommendations[0];
 const keywords=recommendation?.serviceQueryKeywords||[];
 const labelFor=(style:ExploreStyle)=>presentationCatalog.find(s=>resolveStyles(aliasesFor(s.key),[style]).length)?.displayName||style.name;
 const enabled=!!chosen||!!recommendation;
 const artistPages=useAdvisorMatches('artists',filters,keywords,enabled),servicePages=useAdvisorMatches('services',filters,keywords,enabled);
 const flatten=(q:typeof artistPages)=>q.data?{items:q.data.pages.flatMap(p=>p.items),weak:q.data.pages[0]?.weak}:undefined;
 const artists={...artistPages,data:flatten(artistPages)},services={...servicePages,data:flatten(servicePages)};
 return <><View style={styles.card}><Text style={styles.heading}>Phong cách trên BBook</Text><View style={ui.chips}>{catalog?.styles.map(s=><TouchableOpacity key={s.id} accessibilityRole="button" accessibilityState={{selected:chosen?.id===s.id}} onPress={()=>onStyle(s)} style={[ui.chip,chosen?.id===s.id&&ui.selected]}><Text style={ui.chipText}>{labelFor(s)}</Text></TouchableOpacity>)}</View>{!catalog?.styles.length&&<Text style={styles.body}>Chưa tải được catalog phong cách. Bạn vẫn có thể xem hướng dẫn makeup trên thiết bị.</Text>}</View>
 {enabled&&<><Text style={styles.heading}>{chosen?labelFor(chosen):recommendation?displayTitle(recommendation):''} · Chuyên gia và dịch vụ</Text><TouchableOpacity accessibilityRole="button" accessibilityState={{expanded:filtersOpen}} style={ui.filter} onPress={()=>setOpen(!filtersOpen)}><Text style={ui.chipText}>Bộ lọc khu vực và giá · tùy chọn {filtersOpen?'−':'+'}</Text></TouchableOpacity>
 {filtersOpen&&<View style={styles.card}><View style={ui.chips}><TouchableOpacity accessibilityRole="button" accessibilityState={{selected:province===undefined}} style={[ui.chip,province===undefined&&ui.selected]} onPress={()=>setProvince(undefined)}><Text style={ui.chipText}>Mọi khu vực</Text></TouchableOpacity>{catalog?.provinces.map(p=><TouchableOpacity key={p.code} accessibilityRole="button" accessibilityState={{selected:province===p.code}} style={[ui.chip,province===p.code&&ui.selected]} onPress={()=>setProvince(p.code)}><Text style={ui.chipText}>{p.name}</Text></TouchableOpacity>)}</View><TextInput style={ui.input} placeholderTextColor={t.body} returnKeyType="done" accessibilityLabel="Ngân sách tối đa" placeholder="Ngân sách tối đa (đ), không bắt buộc" keyboardType="numeric" value={budget} onChangeText={setBudget}/></View>}
 {(artists.isLoading||services.isLoading)&&<ActivityIndicator color="#FF5C9A"/>}
 {(artists.isError||services.isError)&&<View style={styles.card}><Text style={styles.body}>Chưa tải được chuyên gia. Kiểm tra kết nối và thử lại.</Text><AdvisorButton title="Thử tải lại" onPress={()=>{void artists.refetch();void services.refetch();}}/></View>}
 <Text style={styles.heading}>MUA phù hợp</Text>
 {(artists.data?.items as ExploreArtist[]|undefined)?.map(a=><View key={a.id} style={styles.card}><View style={ui.itemRow}><AdvisorImage source={a.avatarUrl||a.coverUrl?{uri:a.avatarUrl||a.coverUrl}:undefined} label={a.name} style={ui.avatar}/><View style={ui.copy}><Text numberOfLines={2} style={ui.name}>{a.name}</Text><Text style={styles.note}>{a.city} · {Number.isFinite(a.rating)&&a.reviewCount>0?`${a.rating} · ${a.reviewCount} đánh giá`:'Chưa có đánh giá'}</Text></View></View><Text style={styles.note}>{artists.data?.weak?'Gợi ý gần phù hợp; hãy trao đổi phong cách với MUA.':'MUA có phong cách này; chưa xác nhận dịch vụ hoặc lịch trống.'}</Text><AdvisorButton title="Xem hồ sơ / đặt lịch" onPress={()=>router.push({pathname:'/mua-detail',params:{id:a.id}})}/></View>)}
 {!artists.isLoading&&!artists.isError&&!artists.data?.items.length&&<Text style={styles.note}>Chưa tìm thấy MUA theo bộ lọc này.</Text>}
 <Text style={styles.heading}>Dịch vụ phù hợp</Text>
 {(services.data?.items as ExploreService[]|undefined)?.map(v=><View key={v.id} style={styles.card}><View style={ui.itemRow}><AdvisorImage source={v.imageUrl||v.imageUrls?.[0]?{uri:v.imageUrl||v.imageUrls[0]}:undefined} label={v.name} style={ui.serviceImage}/><View style={ui.copy}><Text numberOfLines={2} style={ui.name}>{v.name}</Text><Text numberOfLines={1} style={styles.note}>{v.authorName}</Text><Text style={ui.price}>{Number.isFinite(v.price)?`${v.price.toLocaleString('vi-VN')}đ`:'Liên hệ MUA'} · {v.durationMinutes} phút</Text></View></View><Text style={styles.note}>{!services.data?.weak&&chosen&&hasServiceStyleTag(v,chosen)?'Dịch vụ có tag phong cách tương ứng.':'Gợi ý gần phù hợp; hãy trao đổi style dịch vụ với MUA.'}</Text><AdvisorButton title="Xem dịch vụ" onPress={()=>router.push({pathname:'/mua-detail',params:{id:v.muaId,tab:'Dịch vụ',serviceId:v.id}})}/></View>)}
 {!services.isLoading&&!services.isError&&!services.data?.items.length&&<Text style={styles.note}>Chưa tìm thấy dịch vụ theo bộ lọc này.</Text>}
 {!artists.isLoading&&!services.isLoading&&!artists.isError&&!services.isError&&!artists.data?.items.length&&!services.data?.items.length&&<Text style={styles.body}>Chưa có kết quả phù hợp. Hãy thử phong cách hoặc khu vực khác.</Text>}
 <AdvisorButton title="Xem thêm trong Khám phá" onPress={()=>router.push('/(tabs)/explore')}/></>}
 </>;
}

const ui=StyleSheet.create({chips:{flexDirection:'row',flexWrap:'wrap',gap:8},chip:{maxWidth:'100%',minHeight:44,padding:10,borderWidth:1,borderColor:t.border,borderRadius:12,justifyContent:'center'},selected:{backgroundColor:t.accentSoft,borderColor:t.accent},chipText:{fontSize:12,lineHeight:18,color:t.accent},filter:{minHeight:48,padding:12,borderRadius:12,backgroundColor:t.accentSoft,justifyContent:'center'},input:{minHeight:48,padding:12,borderWidth:1,borderColor:t.border,borderRadius:12,color:t.text,fontSize:14,backgroundColor:t.surface},itemRow:{flexDirection:'row',gap:12,alignItems:'flex-start'},copy:{flex:1,minWidth:0,gap:4},name:{fontSize:14,lineHeight:21,fontWeight:'600',color:t.text},price:{fontSize:13,lineHeight:20,fontWeight:'600',color:t.accent},avatar:{width:56,height:68,borderRadius:10},serviceImage:{width:80,height:88,borderRadius:10}});
