import type { Analysis } from '../faceAnalysis';
import { extractGeometry } from '../faceGeometry';

// Synthetic geometry only: validates equations/gates, not ML Kit accuracy.
const ellipse = (x: number, y: number, rx: number, ry: number, count: number) =>
  Array.from({ length: count }, (_, i) => ({ x: x + rx * Math.cos(i * 2 * Math.PI / count),
    y: y + ry * Math.sin(i * 2 * Math.PI / count) }));
function sample(): Analysis {
  return { width: 800, height: 1000, faceCount: 1, faces: [{
    box: { x: 190, y: 240, width: 420, height: 520 }, angles: { x: 0, y: 0, z: 0 },
  }], contours: [{ type: 1, points: ellipse(400, 500, 200, 250, 36) },
    { type: 6, points: ellipse(340, 450, 25, 10, 16) }, { type: 7, points: ellipse(460, 450, 25, 10, 16) },
    { type: 8, points: ellipse(400, 590, 80, 10, 11) }, { type: 11, points: ellipse(400, 610, 80, 10, 9) }],
  latencyMs: 1, nativeHeapBeforeBytes: 1, nativeHeapAfterBytes: 1 };
}
function ratios(result: Analysis) {
  const geometry = extractGeometry(result, true);
  expect(geometry.status).toBe('measured');
  if (geometry.status !== 'measured') throw new Error('Expected measurement');
  return geometry.ratios;
}
test('measurements require per-photo human review even with valid contours', () => {
  const result = extractGeometry(sample(), false);
  expect(result.status).toBe('needs_review'); expect(result).not.toHaveProperty('ratios');
});
test('returns defined image ratios and no confidence score or face-shape label', () => {
  const result = extractGeometry(sample(), true);
  expect(ratios(sample()).outlineHeightToWidth).toBeCloseTo(1.25);
  expect(ratios(sample()).eyeCenterDistanceToWidth).toBeCloseTo(0.3);
  expect(result).not.toHaveProperty('confidence'); expect(result).not.toHaveProperty('faceShape');
});
test('ratios are invariant under image translation and uniform scale', () => {
  const result = sample(), factor = 0.8;
  result.contours.forEach(c => c.points.forEach(p => { p.x = p.x * factor + 30; p.y = p.y * factor + 30; }));
  const box = result.faces[0].box;
  box.x = box.x * factor + 30; box.y = box.y * factor + 30; box.width *= factor; box.height *= factor;
  for (const key of Object.keys(ratios(sample())) as (keyof ReturnType<typeof ratios>)[])
    expect(ratios(result)[key]).toBeCloseTo(ratios(sample())[key], 8);
});
test('small roll is removed using the eye axis', () => {
  const result = sample(), angle = 8 * Math.PI / 180;
  result.faces[0].angles.z = 8;
  result.contours.forEach(c => c.points.forEach(p => {
    const x = p.x - 400, y = p.y - 500;
    p.x = 400 + x * Math.cos(angle) - y * Math.sin(angle);
    p.y = 500 + x * Math.sin(angle) + y * Math.cos(angle);
  }));
  for (const key of Object.keys(ratios(sample())) as (keyof ReturnType<typeof ratios>)[])
    expect(ratios(result)[key]).toBeCloseTo(ratios(sample())[key], 8);
});
test('horizontal mirror does not swap meanings or alter ratios', () => {
  const result = sample(); result.contours.forEach(c => c.points.forEach(p => { p.x = result.width - p.x; }));
  const box = result.faces[0].box; box.x = result.width - box.x - box.width;
  for (const key of Object.keys(ratios(sample())) as (keyof ReturnType<typeof ratios>)[])
    expect(ratios(result)[key]).toBeCloseTo(ratios(sample())[key], 8);
});
test.each(['x', 'y', 'z'] as const)('tilted %s face cannot yield ratios even after manual review', axis => {
  const result = sample(); result.faces[0].angles[axis] = 43.2;
  expect(extractGeometry(result, true).status).toBe('blocked');
});
test.each([0, 2])('%i faces never produce single-face measurements', count => {
  const result = sample(); result.faceCount = count; result.faces = count ? [result.faces[0], result.faces[0]] : [];
  expect(extractGeometry(result, true)).not.toHaveProperty('ratios');
});
test.each(['missing', 'short', 'duplicate', 'nan', 'outside', 'degenerate', 'unmatched'] as const)
('rejects %s contour data instead of inventing features', kind => {
  const result = sample();
  if (kind === 'missing') result.contours = result.contours.filter(c => c.type !== 7);
  if (kind === 'short') result.contours[0].points.pop();
  if (kind === 'duplicate') result.contours.push(result.contours[0]);
  if (kind === 'nan') result.contours[0].points[0].x = NaN;
  if (kind === 'outside') result.contours[0].points[0].x = 801;
  if (kind === 'degenerate') result.contours[1].points = Array(16).fill({ x: 340, y: 450 });
  if (kind === 'unmatched') result.contours[0].points.forEach(p => { p.y -= 230; });
  expect(extractGeometry(result, true).status).toBe('blocked');
});
test.each(['tiny', 'cropped', 'edge', 'invalid-angle', 'inconsistent-count', 'invalid-dimensions', 'mouth-outside'] as const)
('rejects %s input', kind => {
  const result = sample();
  if (kind === 'tiny') result.faces[0].box.width = 199;
  if (kind === 'cropped') result.faces[0].box.x = -1;
  if (kind === 'edge') result.contours[0].points[0].x = 1;
  if (kind === 'invalid-angle') result.faces[0].angles.y = Infinity;
  if (kind === 'inconsistent-count') result.faceCount = 2;
  if (kind === 'invalid-dimensions') result.width = NaN;
  if (kind === 'mouth-outside') result.contours[3].points.forEach(p => { p.y += 250; });
  expect(extractGeometry(result, true).status).toBe('blocked');
});
test('new input requires a fresh review rather than retaining a previous measurement', () => {
  expect(extractGeometry(sample(), true).status).toBe('measured');
  expect(extractGeometry(sample(), false).status).toBe('needs_review');
});
test('overlapping native detections are rejected without silently merging them', () => {
  const result = sample(); result.faceCount = 2;
  result.faces.push({ ...result.faces[0], box: { ...result.faces[0].box, x: 210 } });
  for (const reviewed of [false, true]) {
    const geometry = extractGeometry(result, reviewed);
    expect(geometry.status).toBe('blocked'); expect(geometry).not.toHaveProperty('ratios');
  }
  expect(result.faces).toHaveLength(2); expect(result.faceCount).toBe(2);
});
test.each([{ x: 31.7, y: 0, z: 0 }, { x: 0, y: -39.1, z: 0 }, { x: 0, y: -52.7, z: 0 }])
('manual review cannot bypass observed pose rejection %o', angles => {
  const result = sample(); result.faces[0].angles = angles;
  for (const reviewed of [false, true]) expect(extractGeometry(result, reviewed).status).toBe('blocked');
});
