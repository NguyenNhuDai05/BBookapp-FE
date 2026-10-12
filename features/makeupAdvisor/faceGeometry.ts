import type { Analysis } from './faceAnalysis';

type Point = { x: number; y: number };
export type Geometry =
  | { status: 'blocked' | 'needs_review'; reasons: string[] }
  | { status: 'measured'; ratios: { outlineHeightToWidth: number; eyeCenterDistanceToWidth: number; mouthWidthToWidth: number }; reasons: string[] };

// ML Kit FaceContour constants/counts, verified against Google's reference.
// These are 2D image measurements, not anatomy, face-shape labels or probabilities.
const REQUIRED = [{ type: 1, count: 36 }, { type: 6, count: 16 }, { type: 7, count: 16 },
  { type: 8, count: 11 }, { type: 11, count: 9 }] as const;
export const GEOMETRY_POLICY = { maxYaw: 15, maxPitch: 15, maxRoll: 10, minFacePixels: 200 } as const;
const finite = (value: number) => Number.isFinite(value);
const center = (points: Point[]): Point => ({
  x: points.reduce((sum, p) => sum + p.x, 0) / points.length,
  y: points.reduce((sum, p) => sum + p.y, 0) / points.length,
});
const span = (values: number[]) => Math.max(...values) - Math.min(...values);
const blocked = (reason: string): Geometry => ({ status: 'blocked', reasons: [reason] });

export function extractGeometry(result: Analysis, visuallyChecked: boolean): Geometry {
  if (!Number.isInteger(result.width) || !Number.isInteger(result.height) || result.width <= 0 || result.height <= 0 ||
    !Number.isInteger(result.faceCount) || result.faceCount < 0 || !Array.isArray(result.faces) || !Array.isArray(result.contours) ||
    result.faces.length !== result.faceCount) return blocked('Dữ liệu detector không nhất quán; hãy phân tích lại.');
  if (!result.faceCount) return blocked('Không có mặt: hãy chụp một người, chính diện.');
  if (result.faceCount !== 1) return blocked('Có nhiều mặt: chỉ đo ảnh một người.');
  const { box, angles } = result.faces[0];
  if (!box || !angles || ![box.x, box.y, box.width, box.height, angles.x, angles.y, angles.z].every(finite) ||
    box.width <= 0 || box.height <= 0) return blocked('Tọa độ hoặc góc mặt không hợp lệ.');
  if (Math.abs(angles.y) > GEOMETRY_POLICY.maxYaw || Math.abs(angles.x) > GEOMETRY_POLICY.maxPitch ||
    Math.abs(angles.z) > GEOMETRY_POLICY.maxRoll) return blocked('Hãy nhìn thẳng và giữ đầu ngay; không đo tỷ lệ từ ảnh nghiêng.');
  if (Math.min(box.width, box.height) < GEOMETRY_POLICY.minFacePixels)
    return blocked('Mặt quá nhỏ để đo thử: hãy chụp gần hơn.');
  if (box.x < 0 || box.y < 0 || box.x + box.width > result.width || box.y + box.height > result.height)
    return blocked('Khung mặt bị cắt ở mép ảnh; hãy lấy trọn khuôn mặt.');
  const contours = new Map<number, Point[]>();
  for (const contour of result.contours) {
    if (!contour || !Number.isInteger(contour.type) || !Array.isArray(contour.points) || contours.has(contour.type))
      return blocked('Contours không nhất quán; hãy phân tích lại.');
    if (contour.points.some(p => !p || !finite(p.x) || !finite(p.y) || p.x < 0 || p.y < 0 || p.x > result.width || p.y > result.height))
      return blocked('Điểm contour ngoài ảnh hoặc không hợp lệ.');
    contours.set(contour.type, contour.points);
  }
  if (REQUIRED.some(c => contours.get(c.type)?.length !== c.count))
    return blocked('Thiếu đường viền mặt, hai mắt hoặc môi; hãy chụp lại rõ hơn.');
  if (REQUIRED.some(c => span(contours.get(c.type)!.map(p => p.x)) <= 0 || span(contours.get(c.type)!.map(p => p.y)) <= 0))
    return blocked('Contours suy biến; chưa đủ dữ liệu để đo.');
  const outline = contours.get(1)!;
  if (outline.some(p => p.x <= 2 || p.y <= 2 || p.x >= result.width - 2 || p.y >= result.height - 2))
    return blocked('Đường viền sát mép ảnh; hãy lấy trọn khuôn mặt.');
  // Two detector passes must describe the same face. Allow loose detector bounds.
  if (outline.some(p => p.x < box.x - box.width * 0.25 || p.x > box.x + box.width * 1.25 ||
    p.y < box.y - box.height * 0.25 || p.y > box.y + box.height * 1.25))
    return blocked('Contours không khớp khung mặt; hãy phân tích lại.');
  const eyes = [center(contours.get(6)!), center(contours.get(7)!)].sort((a, b) => a.x - b.x);
  const dx = eyes[1].x - eyes[0].x, dy = eyes[1].y - eyes[0].y;
  const eyeDistance = Math.hypot(dx, dy);
  if (eyeDistance < 1 || Math.abs(Math.atan2(dy, dx) * 180 / Math.PI) > 15)
    return blocked('Trục hai mắt không ổn định; hãy giữ đầu ngay và chụp lại.');
  // Align the measurement axes to the eyes; removes small 2D roll only, not yaw/perspective.
  const horizontal = (p: Point) => (p.x * dx + p.y * dy) / eyeDistance;
  const vertical = (p: Point) => (-p.x * dy + p.y * dx) / eyeDistance;
  const width = span(outline.map(horizontal)), height = span(outline.map(vertical));
  const mouth = [...contours.get(8)!, ...contours.get(11)!];
  const mouthWidth = span(mouth.map(horizontal));
  const outlineX = outline.map(horizontal), outlineY = outline.map(vertical);
  const insideOutlineBounds = (p: Point) => horizontal(p) >= Math.min(...outlineX) && horizontal(p) <= Math.max(...outlineX) &&
    vertical(p) >= Math.min(...outlineY) && vertical(p) <= Math.max(...outlineY);
  if (width < GEOMETRY_POLICY.minFacePixels || height <= 0 || mouthWidth <= 0 || eyeDistance >= width || mouthWidth >= width ||
    ![...eyes, ...mouth].every(insideOutlineBounds))
    return blocked('Hình học thiếu nhất quán hoặc quá nhỏ; chưa đủ dữ liệu để đo.');
  if (!visuallyChecked) return { status: 'needs_review', reasons: [
    'Hãy xác nhận ảnh đủ sáng, rõ và không bị che trước khi dùng tín hiệu hình học thử nghiệm.',
  ] };
  return { status: 'measured', ratios: { outlineHeightToWidth: height / width,
    eyeCenterDistanceToWidth: eyeDistance / width, mouthWidthToWidth: mouthWidth / width }, reasons: [
    'Tỷ lệ 2D của ảnh này, chưa hiệu chuẩn độ chính xác; không phải số đo giải phẫu hay xác suất tin cậy.',
    'Ánh sáng, kính, biểu cảm, góc camera và che mặt có thể làm sai contours dù đủ điểm.',
  ] };
}
