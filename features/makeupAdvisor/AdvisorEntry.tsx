import React from 'react';
import {Text,TouchableOpacity,StyleSheet} from 'react-native';
import {useRouter} from 'expo-router';
import {advisorEnabled} from './flags';
export function AdvisorEntry(){const router=useRouter();if(!advisorEnabled)return null;
 return <TouchableOpacity accessibilityRole="button" style={styles.card} onPress={()=>router.push('/makeup-advisor' as never)}><Text style={styles.title}>Đẹp theo cách của bạn ✨</Text><Text style={styles.body}>Chọn ảnh để khám phá ý tưởng makeup, rồi tìm MUA và dịch vụ trên BBook.</Text><Text style={styles.link}>Khám phá Makeup Advisor →</Text></TouchableOpacity>;
}
const styles=StyleSheet.create({card:{margin:18,padding:22,borderRadius:24,backgroundColor:'#fff1f6',borderColor:'#f3d4e0',borderWidth:1},title:{fontSize:22,fontWeight:'700',color:'#6c2949'},body:{color:'#74566a',lineHeight:22,marginTop:8},link:{color:'#b72f61',fontWeight:'700',marginTop:14}});
