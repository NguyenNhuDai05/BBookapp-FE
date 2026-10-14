import {Text,View} from 'react-native';
import type {FaceFeatureSummaryV3} from './faceFeatures/extractor';
import {cloudSummary} from './cloudSummary';
import {makeupProfile} from './makeupProfile';
import {styles} from './AdvisorResults';

const labels:Record<string,string>={lower_spacing_projection:'Khoảng cách mắt thuộc nhóm thấp trong phép đo thử nghiệm',higher_spacing_projection:'Khoảng cách mắt thuộc nhóm cao trong phép đo thử nghiệm',lower_eye_opening_projection:'Vùng mắt mở thấp hơn trong ảnh',moderate_eye_opening_projection:'Vùng mắt mở vừa trong ảnh',more_curved_brow_projection:'Đường mày cong rõ hơn trong ảnh',gentler_brow_projection:'Đường mày cong nhẹ hơn trong ảnh',longer_outline_projection:'Đường viền ảnh có chiều dọc dài hơn',wider_outline_projection:'Đường viền ảnh có chiều ngang rộng hơn',balanced_outline_projection:'Tỷ lệ đường viền ảnh ở nhóm giữa',wider_lip_projection:'Vùng môi rộng hơn trong ảnh',compact_lip_projection:'Vùng môi gọn hơn trong ảnh',greater_lip_height_projection:'Vùng môi có chiều cao lớn hơn trong ảnh',lower_lip_height_projection:'Vùng môi có chiều cao thấp hơn trong ảnh'};
export function MakeupProfilePreview({summary}:{summary:FaceFeatureSummaryV3}){
 const profile=makeupProfile(cloudSummary(summary));
 return <View style={styles.card}><Text style={styles.heading}>Dữ liệu tư vấn từ ảnh</Text>
  {Object.entries(profile.regions).map(([key,r])=><Text key={key} style={styles.body}>{({eyes:'Mắt',brows:'Mày',cheeks:'Má',lips:'Môi'} as Record<string,string>)[key]}: {r.signals.length?r.signals.map(s=>labels[s]).join('; '):'Chưa đủ dữ liệu, giữ unknown'}.</Text>)}
  <Text style={styles.note}>Các nhóm mô tả là phép thử từ hình chiếu 2D, chưa hiệu chuẩn. Không xác định dáng mặt, undertone hoặc loại da.</Text>
  <Text style={styles.note}>Nếu được phép và bạn đồng ý, backend nhận summary v3 đã rút gọn gồm tỷ lệ, khung mặt, góc đầu và quality gate. Gemini chỉ nhận các nhóm mô tả trên cùng nguồn đặc trưng; không nhận ảnh, tọa độ, tỷ lệ chi tiết hay định danh.</Text>
 </View>;
}
