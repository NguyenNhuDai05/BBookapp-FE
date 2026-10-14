import React,{useState} from 'react';
import {ActivityIndicator,Image,Text,TextInput,View} from 'react-native';
import {useAdvisorMatches} from './useAdvisorMatches';
import {useRouter} from 'expo-router';
import type {ExploreArtist,ExploreHome,ExploreService,ExploreStyle} from '../../types/explore';
import type {MakeupRecommendation} from './advisorRecommendation';
import {displayTitle,presentationCatalog} from './presentationCatalog';
import {aliasesFor} from './styleLibrary';
import {resolveStyles,hasServiceStyleTag} from './recommendations';
import {AdvisorButton,styles} from './AdvisorResults';
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
 return <><View style={styles.card}><Text style={styles.heading}>Phong cách trên BBook</Text>{catalog?.styles.map(s=><AdvisorButton key={s.id} title={`${chosen?.id===s.id?'✓ ':''}${labelFor(s)}`} onPress={()=>onStyle(s)}/>)}{!catalog?.styles.length&&<Text style={styles.body}>Chưa tải được catalog phong cách. Bạn vẫn có thể xem hướng dẫn makeup trên thiết bị.</Text>}</View>
 {enabled&&<><Text style={styles.heading}>{chosen?labelFor(chosen):recommendation?displayTitle(recommendation):''} · Chuyên gia và dịch vụ</Text><AdvisorButton title="Bộ lọc khu vực và giá · tùy chọn" onPress={()=>setOpen(!filtersOpen)}/>
 {filtersOpen&&<View style={styles.card}><AdvisorButton title="Mọi khu vực" onPress={()=>setProvince(undefined)}/>{catalog?.provinces.map(p=><AdvisorButton key={p.code} title={`${province===p.code?'✓ ':''}${p.name}`} onPress={()=>setProvince(p.code)}/>)}<TextInput accessibilityLabel="Ngân sách tối đa" placeholder="Ngân sách tối đa (đ), không bắt buộc" keyboardType="numeric" value={budget} onChangeText={setBudget}/></View>}
 {(artists.isLoading||services.isLoading)&&<ActivityIndicator color="#FF5C9A"/>}
 {(artists.isError||services.isError)&&<View style={styles.card}><Text style={styles.body}>Chưa tải được chuyên gia. Kiểm tra kết nối và thử lại.</Text><AdvisorButton title="Thử tải lại" onPress={()=>{void artists.refetch();void services.refetch();}}/></View>}
 <Text style={styles.heading}>MUA phù hợp</Text>
 {(artists.data?.items as ExploreArtist[]|undefined)?.map(a=><View key={a.id} style={styles.card}>{a.avatarUrl&&<Image source={{uri:a.avatarUrl}} style={{width:64,height:64,borderRadius:32}}/>}<Text style={styles.heading}>{a.name}</Text><Text style={styles.body}>{a.city} · {a.reviewCount>0?`${a.rating} · ${a.reviewCount} đánh giá`:'Chưa có đánh giá'}</Text><Text style={styles.note}>{artists.data?.weak?'Gợi ý gần phù hợp; hãy trao đổi phong cách với MUA.':'MUA có phong cách này; chưa xác nhận dịch vụ hoặc lịch trống.'}</Text><AdvisorButton title="Xem hồ sơ / đặt lịch" onPress={()=>router.push({pathname:'/mua-detail',params:{id:a.id}})}/></View>)}
 {!artists.isLoading&&!artists.isError&&!artists.data?.items.length&&<Text style={styles.note}>Chưa tìm thấy MUA theo bộ lọc này.</Text>}
 <Text style={styles.heading}>Dịch vụ phù hợp</Text>
 {(services.data?.items as ExploreService[]|undefined)?.map(v=><View key={v.id} style={styles.card}>{v.imageUrl&&<Image source={{uri:v.imageUrl}} style={styles.cover}/>}<Text style={styles.heading}>{v.name}</Text><Text style={styles.body}>{v.authorName} · {v.price.toLocaleString('vi-VN')}đ · {v.durationMinutes} phút</Text><Text style={styles.note}>{!services.data?.weak&&chosen&&hasServiceStyleTag(v,chosen)?'Dịch vụ có tag phong cách tương ứng.':'Gợi ý gần phù hợp; hãy trao đổi style dịch vụ với MUA.'}</Text><AdvisorButton title="Xem dịch vụ" onPress={()=>router.push({pathname:'/mua-detail',params:{id:v.muaId,tab:'Dịch vụ',serviceId:v.id}})}/></View>)}
 {!services.isLoading&&!services.isError&&!services.data?.items.length&&<Text style={styles.note}>Chưa tìm thấy dịch vụ theo bộ lọc này.</Text>}
 {!artists.isLoading&&!services.isLoading&&!artists.isError&&!services.isError&&!artists.data?.items.length&&!services.data?.items.length&&<Text style={styles.body}>Chưa có kết quả phù hợp. Hãy thử phong cách hoặc khu vực khác.</Text>}
 <AdvisorButton title="Xem thêm trong Khám phá" onPress={()=>router.push('/(tabs)/explore')}/></>}
 </>;
}
