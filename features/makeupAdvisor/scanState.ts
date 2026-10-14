import type {AdvisorFailureCode} from './errors';
export type ScanPhase='idle'|'initializing'|'validating'|'analyzing'|'matching'|'success'|'validation_error'|'processing_error'|'cancelled';
export type ValidationCode='FACE_NOT_FOUND'|'MULTIPLE_FACES'|'FACE_TOO_SMALL'|'FACE_NOT_FRONTAL'|'PROCESSING_ERROR';
export type ScanFailure={code:ValidationCode|AdvisorFailureCode|'E_RECOMMENDATIONS'|'E_PROCESSING_TIMEOUT';kind:'validation'|'processing'|'recommendation'|'resource'|'acquisition'|'native'|'input';main:string;secondary:string};
export const phaseCopy:Record<ScanPhase,{main:string;secondary:string}>={
 idle:{main:'',secondary:''},cancelled:{main:'Đã hủy quét',secondary:''},
 initializing:{main:'Đang nhận diện khuôn mặt...',secondary:'Chuẩn bị dữ liệu ảnh'},
 validating:{main:'Đang kiểm tra ảnh...',secondary:'Kiểm tra số khuôn mặt và góc đầu'},
 analyzing:{main:'Đang phân tích đường nét...',secondary:'Đang xử lý đặc điểm khuôn mặt'},
 matching:{main:'Đang tìm phong cách phù hợp...',secondary:'Đang lựa chọn 3 gợi ý makeup'},
 success:{main:'Đã có gợi ý makeup cho bạn!',secondary:''},
 validation_error:{main:'Hãy thử một ảnh khác',secondary:''},processing_error:{main:'Chưa thể phân tích ảnh này',secondary:'Vui lòng thử lại.'}
};
export function validationFailure(code:ValidationCode='PROCESSING_ERROR',reason?:string):ScanFailure{
 const messages:Record<ValidationCode,[string,string]>={FACE_NOT_FOUND:['Chưa tìm thấy khuôn mặt','Hãy thử chụp lại ở nơi đủ sáng.'],MULTIPLE_FACES:['Chỉ để một khuôn mặt trong ảnh nhé','Hãy chụp ảnh chỉ có bạn trong khung hình.'],FACE_TOO_SMALL:['Khuôn mặt đang ở quá xa','Hãy đưa camera lại gần hơn một chút.'],FACE_NOT_FRONTAL:['Hãy nhìn thẳng vào camera','Giữ đầu thẳng và thử lại nhé.'],PROCESSING_ERROR:['Chưa thể phân tích ảnh này',reason||'Vui lòng thử lại.']};
 const [main,secondary]=messages[code];return {code,kind:code==='PROCESSING_ERROR'?'processing':'validation',main,secondary};
}
export const PROCESSING_TIMEOUT_MS=60000;
export const SUCCESS_TRANSITION_MS=400;
