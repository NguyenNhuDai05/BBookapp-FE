import Constants from 'expo-constants';
// Never surface native messages: they can contain image paths or SDK details.
const messages = {
 E_ADVISOR_LIMIT: 'Bộ phân tích chưa xác nhận đủ bộ nhớ. Bạn có thể thử lại; cần APK mới để xác định nguyên nhân cụ thể.',
 E_SYSTEM_MEMORY_PRESSURE: 'Thiết bị đang thiếu bộ nhớ. Hãy đóng tác vụ không cần thiết rồi thử lại; bộ phân tích sẽ kiểm tra lại trước khi quét.',
 E_MEMORY_BUDGET: 'Chưa đủ bộ nhớ dự phòng để quét ảnh này. Hãy thử lại khi thiết bị đã nhẹ tải.',
 E_CLEANUP_PENDING: 'Bộ phân tích chưa giải phóng tài nguyên đầy đủ. Tạm dừng quét để bảo vệ thiết bị; cần kiểm tra mã lỗi.',
 E_SCAN_CANCELLED: 'Đã hủy phân tích ảnh. Bạn có thể chọn ảnh khác.',
 E_BUSY: 'Bộ phân tích đang bận hoặc chưa được bật trong bản này. Hãy đợi thao tác hiện tại hoàn tất.',
 E_INPUT: 'Không đọc được ảnh đã chuẩn hóa hoặc không khởi tạo được bộ nhận diện. Cần kiểm tra bản APK.',
 E_DETECTION: 'Chưa hoàn tất nhận diện ảnh. Bạn có thể thử lại hoặc chọn ảnh khác.',
 E_NATIVE_UNAVAILABLE: 'Bản APK chưa có đủ module phân tích ảnh. Cần build lại advisor-preview với code native hiện tại.',
 E_PERMISSION: 'Chưa có quyền camera. Hãy cấp quyền camera trong cài đặt ứng dụng.',
 E_NORMALIZATION_INPUT: 'Ảnh hỏng, không hỗ trợ hoặc quá lớn. Hãy chọn JPEG, PNG hoặc WebP tĩnh.',
 E_NORMALIZER_UNAVAILABLE: 'Bộ chuẩn hóa ảnh chưa sẵn sàng hoặc đang bận.',
 E_NORMALIZATION_CANCELLED: 'Đã hủy xử lý ảnh.',
 E_CAMERA_RELEASE_PENDING: 'Android chưa xác nhận camera có thể mở lại. Hãy quay về, đóng camera rồi thử chọn ảnh lại.',
 E_PICKER: 'Chưa mở được thư viện ảnh. Hãy thử lại hoặc kiểm tra quyền truy cập ảnh.',
 E_PICKER_ASSET: 'Thư viện chưa trả về ảnh hợp lệ. Hãy chọn một ảnh khác.',
 E_UNKNOWN: 'Chưa hoàn tất phân tích ảnh. Cần kiểm tra mã lỗi từ bản APK; bạn vẫn có thể khám phá phong cách.',
} as const;
export type AdvisorErrorKind='recoverable'|'resource-pressure'|'unavailable';
export function advisorErrorKind(error:unknown):AdvisorErrorKind {
 const code=error&&typeof error==='object'&&'code' in error?error.code:undefined;
 if(code==='E_SYSTEM_MEMORY_PRESSURE'||code==='E_MEMORY_BUDGET'||code==='E_ADVISOR_LIMIT')return 'resource-pressure';
 if(code==='E_NATIVE_UNAVAILABLE'||code==='E_CLEANUP_PENDING')return 'unavailable';
 return 'recoverable';
}
export type AdvisorFailureCode=keyof typeof messages;
export function advisorFailureCode(error:unknown):AdvisorFailureCode{
 const raw=error&&typeof error==='object'&&'code' in error?error.code:undefined;
 return typeof raw==='string'&&Object.prototype.hasOwnProperty.call(messages,raw)?raw as AdvisorFailureCode:'E_UNKNOWN';
}
export function advisorFailure(error: unknown, stage: 'pick' | 'scan') {
 const code=advisorFailureCode(error);
 // Fixed whitelist only: no error message, image URI, geometry or personal data.
 if(__DEV__||Constants.expoConfig?.extra?.advisorDiagnosticMode===true)console.warn('BBookAdvisorFailure', JSON.stringify({stage, code}));
 return messages[code];
}
