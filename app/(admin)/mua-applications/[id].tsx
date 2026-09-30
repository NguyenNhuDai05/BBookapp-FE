import { AppModal } from '../../../components/ui/AppModal';
import React,{useState} from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { AppAlert as appDialog } from '../../../components/ui/dialogStore';

import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams,useRouter } from 'expo-router';
import { ArrowLeft,BriefcaseBusiness,CheckCircle2,CreditCard,FileBadge,ImageIcon,MapPin,ShieldCheck,UserRoundCheck,XCircle } from 'lucide-react-native';
import { useAdminMuaApplication,useReviewMuaApplication } from '../../../hooks/useAdminMuaApplications';
import { AdminErrorState,AdminLoadingState } from '../../../components/admin/AdminStates';
import { getApiError } from '../../../services/api';
import { BrandColors,Radius,Shadows,Spacing,Typography } from '../../../constants/theme';

const reasons=[['IDENTITY_INVALID','CCCD/CMND chưa hợp lệ'],['PORTRAIT_MISMATCH','Ảnh chân dung chưa phù hợp'],['BANK_INVALID','Thông tin ngân hàng sai'],['PORTFOLIO_INSUFFICIENT','Portfolio chưa đạt'],['SERVICE_INVALID','Dịch vụ hoặc giá chưa rõ'],['PERSONAL_INFO_INVALID','Thông tin cá nhân chưa chính xác'],['OTHER','Lý do khác']] as const;

export default function AdminMuaApplicationDetail(){
 const {id=''}=useLocalSearchParams<{id:string}>();const router=useRouter();const {width}=useWindowDimensions();const wide=width>=900;
 const query=useAdminMuaApplication(id);const review=useReviewMuaApplication(id);const [rejecting,setRejecting]=useState(false);const [note,setNote]=useState('');const [codes,setCodes]=useState<string[]>([]);
 if(query.isLoading)return <AdminLoadingState message="Đang tải chi tiết hồ sơ..."/>;
 if(query.isError||!query.data)return <AdminErrorState message="Không thể tải hồ sơ MUA." onRetry={()=>query.refetch()}/>;
 const {profile:publicProfile,verificationDocuments,bankAccount,eligibility}=query.data;const profile={...publicProfile,...verificationDocuments};const pending=eligibility.verificationStatus==='PendingReview';
 const run=(approved:boolean)=>review.mutate({approved,rejection:approved?undefined:{reason:note,reasonCodes:codes,items:codes.map(code=>({section:'application',field:code,message:note}))}},{onSuccess:()=>{setRejecting(false);appDialog.alert('Đã cập nhật',approved?'MUA đã được duyệt, mở lịch 08:00–22:00 cả tuần và có thể nhận booking ngay.':'Đã gửi lý do từ chối cho MUA.');},onError:error=>appDialog.alert('Không thể cập nhật',getApiError(error).message)});
 const approve=()=>appDialog.alert('Duyệt và kích hoạt MUA','Tài khoản sẽ được niêm yết và nhận booking ngay với lịch mặc định cả tuần.',[{text:'Quay lại',style:'cancel'},{text:'Duyệt hồ sơ',onPress:()=>run(true)}]);
 const allPhotos=profile.portfolio.flatMap(item=>item.imageUrls||[]);
 return <SafeAreaView style={s.safe} edges={['top','bottom']}><View style={s.shell}><View style={s.header}><TouchableOpacity style={s.back} onPress={()=>router.back()}><ArrowLeft size={22} color={BrandColors.textDark}/></TouchableOpacity><View style={s.headerCopy}><Text style={s.eyebrow}>CHI TIẾT XÉT DUYỆT</Text><Text style={s.title}>Hồ sơ MUA</Text></View><View style={s.status}><ShieldCheck size={16} color={BrandColors.accentRose}/><Text style={s.statusText}>{eligibility.verificationStatus}</Text></View></View>
 <ScrollView contentContainerStyle={[s.content,wide&&s.contentWide]}><View style={s.main}><View style={s.hero}>{profile.avatarUrl?<Image source={{uri:profile.avatarUrl}} style={s.avatar}/>:<View style={s.avatar}/>}<View style={s.heroCopy}><Text style={s.name}>{profile.fullName||'MUA'}</Text><View style={s.inline}><MapPin size={15} color={BrandColors.textMuted}/><Text style={s.meta}>{profile.city||'Chưa có khu vực'}</Text></View><Text style={s.bio}>{profile.bio||'Chưa có phần giới thiệu.'}</Text></View></View>
 <Section title="Xác minh danh tính" icon={<UserRoundCheck size={19} color={BrandColors.accentRose}/>}><Info label="Địa chỉ" value={profile.address||'—'}/><View style={s.photos}>{profile.identityFrontUrl?<DocumentImage label="Mặt trước" url={profile.identityFrontUrl}/>:null}{profile.identityBackUrl?<DocumentImage label="Mặt sau" url={profile.identityBackUrl}/>:null}{profile.portraitUrl?<DocumentImage label="Chân dung" url={profile.portraitUrl}/>:null}</View></Section>
 <Section title="Dịch vụ & bảng giá" icon={<BriefcaseBusiness size={19} color={BrandColors.accentRose}/>}>{profile.services.length?profile.services.map(item=><View key={item.serviceId} style={s.item}><Text style={s.itemTitle}>{item.serviceName||'Dịch vụ'}</Text><Text style={s.itemMeta}>{Number(item.price||0).toLocaleString('vi-VN')}đ · {item.durationMinutes} phút</Text></View>):<Text style={s.empty}>Chưa có dịch vụ</Text>}</Section>
 <Section title={`Portfolio (${allPhotos.length})`} icon={<ImageIcon size={19} color={BrandColors.accentRose}/>}><View style={s.photos}>{allPhotos.map((url,index)=><Image key={`${url}-${index}`} source={{uri:url}} style={s.photo}/>)}</View></Section></View>
 <View style={s.side}><Section title="Checklist xét duyệt" icon={<CheckCircle2 size={19} color={BrandColors.statusConfirmed}/>}>{eligibility.requirements.map(item=><View key={item.key} style={s.check}><CheckCircle2 size={18} color={item.isMet?BrandColors.statusConfirmed:BrandColors.statusCancelled}/><Text style={[s.checkText,!item.isMet&&s.checkMissing]}>{item.label}</Text></View>)}</Section>
 <Section title="Thông tin hồ sơ" icon={<FileBadge size={19} color={BrandColors.accentRose}/>}><Info label="Kinh nghiệm" value={`${profile.experienceYears||0} năm`}/><Info label="Chuyên môn" value={profile.styles?.join(', ')||profile.specialization||'—'}/><Info label="Điện thoại" value={profile.phoneNumber||'—'}/><Info label="Email" value={profile.email||'—'}/></Section>
 <Section title="Tài khoản thanh toán" icon={<CreditCard size={19} color={BrandColors.accentRose}/>}>{bankAccount?<><Info label="Ngân hàng" value={bankAccount.bankName||bankAccount.bankCode}/><Info label="Số tài khoản" value={bankAccount.accountNumber}/><Info label="Chủ tài khoản" value={bankAccount.accountHolderName}/></>:<Text style={s.empty}>Chưa có tài khoản ngân hàng</Text>}</Section></View></ScrollView>
 {pending?<View style={s.actions}><TouchableOpacity style={s.reject} onPress={()=>setRejecting(true)} disabled={review.isPending}><XCircle size={19} color={BrandColors.statusCancelled}/><Text style={s.rejectText}>Từ chối</Text></TouchableOpacity><TouchableOpacity style={s.approve} onPress={approve} disabled={review.isPending}>{review.isPending?<ActivityIndicator color="#FFF"/>:<><CheckCircle2 size={19} color="#FFF"/><Text style={s.approveText}>Duyệt và kích hoạt</Text></>}</TouchableOpacity></View>:null}</View>
 <AppModal visible={rejecting} title="Lý do từ chối" variant="destructive"
    description="Chọn các mục thiếu hoặc sai để MUA biết chính xác cần sửa gì trước khi gửi lại." loading={review.isPending}
    onClose={()=>setRejecting(false)} primaryAction={{label:'Xác nhận từ chối',onPress:()=>run(false),disabled:!codes.length||note.trim().length<5,loading:review.isPending}}
    secondaryAction={{label:'Quay lại',onPress:()=>setRejecting(false)}}><View style={s.reasonList}>{reasons.map(([code,label])=>{const active=codes.includes(code);return <TouchableOpacity key={code} onPress={()=>setCodes(active?codes.filter(x=>x!==code):[...codes,code])} style={[s.reasonChip,active&&s.reasonActive]}><Text style={[s.reasonText,active&&s.reasonTextActive]}>{label}</Text></TouchableOpacity>;})}</View>
<TextInput value={note} onChangeText={setNote} multiline placeholder="Ghi chú chi tiết cho MUA..." placeholderTextColor={BrandColors.textLight} style={s.input}/></AppModal></SafeAreaView>;
}
function Section({title,icon,children}:{title:string;icon:React.ReactNode;children:React.ReactNode}){return <View style={s.section}><View style={s.sectionHead}>{icon}<Text style={s.sectionTitle}>{title}</Text></View>{children}</View>}
function Info({label,value}:{label:string;value:string}){return <View style={s.info}><Text style={s.infoLabel}>{label}</Text><Text style={s.infoValue}>{value}</Text></View>}
function DocumentImage({label,url}:{label:string;url:string}){return <View><Image source={{uri:url}} style={s.document}/><Text style={s.documentLabel}>{label}</Text></View>}
const s=StyleSheet.create({
safe:{flex:1,backgroundColor:BrandColors.bgPrimary},
shell:{flex:1,width:'100%',maxWidth:1180,alignSelf:'center'},
header:{minHeight:78,paddingHorizontal:Spacing.base,flexDirection:'row',alignItems:'center',gap:12},
back:{width:44,height:44,borderRadius:22,backgroundColor:'#FFF',alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:BrandColors.borderLight},
headerCopy:{flex:1},
eyebrow:{fontFamily:Typography.bold,fontSize:10,letterSpacing:1.1,color:BrandColors.accentRose},
title:{fontFamily:Typography.extraBold,fontSize:22,color:BrandColors.textDark},
status:{flexDirection:'row',alignItems:'center',gap:5,paddingHorizontal:10,paddingVertical:7,borderRadius:Radius.full,backgroundColor:BrandColors.bgPink},
statusText:{fontFamily:Typography.bold,fontSize:11,color:BrandColors.accentRose},
content:{padding:Spacing.base,paddingBottom:100,gap:12},
contentWide:{flexDirection:'row'},
main:{flex:2,gap:12},
side:{flex:1,gap:12},
hero:{flexDirection:'row',backgroundColor:'#FFF',padding:Spacing.lg,borderRadius:Radius.lg,borderWidth:1,borderColor:BrandColors.borderLight,...Shadows.sm},
avatar:{width:86,height:86,borderRadius:26,backgroundColor:BrandColors.bgPink},
heroCopy:{flex:1,marginLeft:16},
name:{fontFamily:Typography.extraBold,fontSize:22,color:BrandColors.textDark},
inline:{flexDirection:'row',alignItems:'center',gap:4,marginTop:5},
meta:{fontFamily:Typography.regular,color:BrandColors.textMuted},
bio:{fontFamily:Typography.regular,lineHeight:20,color:BrandColors.textBody,marginTop:10},
section:{backgroundColor:'#FFF',padding:Spacing.base,borderRadius:Radius.lg,borderWidth:1,borderColor:BrandColors.borderLight,...Shadows.sm},
sectionHead:{flexDirection:'row',alignItems:'center',gap:8,marginBottom:12},
sectionTitle:{fontFamily:Typography.bold,fontSize:16,color:BrandColors.textDark},
item:{paddingVertical:10,borderTopWidth:1,borderTopColor:BrandColors.borderDivider},
itemTitle:{fontFamily:Typography.semiBold,color:BrandColors.textDark},
itemMeta:{fontFamily:Typography.regular,fontSize:12,color:BrandColors.textMuted,marginTop:3},
empty:{fontFamily:Typography.regular,color:BrandColors.textMuted},
photos:{flexDirection:'row',flexWrap:'wrap',gap:10},
photo:{width:112,height:112,borderRadius:Radius.md,backgroundColor:BrandColors.bgPink},
document:{width:150,height:96,borderRadius:Radius.md,backgroundColor:BrandColors.bgPink},
documentLabel:{fontFamily:Typography.semiBold,fontSize:11,color:BrandColors.textMuted,marginTop:4},
check:{flexDirection:'row',alignItems:'center',gap:9,paddingVertical:7},
checkText:{flex:1,fontFamily:Typography.semiBold,fontSize:13,color:BrandColors.textDark},
checkMissing:{color:BrandColors.statusCancelled},
info:{paddingVertical:9,borderTopWidth:1,borderTopColor:BrandColors.borderDivider},
infoLabel:{fontFamily:Typography.regular,fontSize:11,color:BrandColors.textMuted},
infoValue:{fontFamily:Typography.semiBold,color:BrandColors.textDark,marginTop:3},
actions:{position:'absolute',left:0,right:0,bottom:0,padding:12,paddingBottom:16,backgroundColor:'rgba(255,255,255,.96)',borderTopWidth:1,borderTopColor:BrandColors.borderLight,flexDirection:'row',gap:10,justifyContent:'flex-end'},
reject:{minHeight:50,paddingHorizontal:22,borderRadius:Radius.md,borderWidth:1,borderColor:'#F0B9B5',flexDirection:'row',alignItems:'center',justifyContent:'center',gap:7},
rejectText:{fontFamily:Typography.bold,color:BrandColors.statusCancelled},
approve:{minHeight:50,minWidth:190,paddingHorizontal:24,borderRadius:Radius.md,backgroundColor:BrandColors.statusConfirmed,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:7},
approveText:{fontFamily:Typography.bold,color:'#FFF'},
reasonList:{flexDirection:'row',flexWrap:'wrap',gap:7,marginTop:14},
reasonChip:{paddingHorizontal:11,paddingVertical:8,borderRadius:Radius.full,borderWidth:1,borderColor:BrandColors.borderLight},
reasonActive:{backgroundColor:BrandColors.statusCancelledBg,borderColor:BrandColors.statusCancelled},
reasonText:{fontFamily:Typography.medium,fontSize:12,color:BrandColors.textBody},
reasonTextActive:{color:BrandColors.statusCancelled,fontFamily:Typography.bold},
input:{minHeight:110,marginTop:14,borderWidth:1,borderColor:BrandColors.borderSoft,borderRadius:Radius.md,padding:12,textAlignVertical:'top',fontFamily:Typography.regular,color:BrandColors.textDark}
});
