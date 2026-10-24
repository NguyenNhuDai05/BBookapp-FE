import {extractLipGeometry} from '../lipGeometry';
import {photo,sample} from '../testSupport/fixtures';

test('valid contours without mesh produce outer and inner SVG subpaths from actual points',()=>{
 const a=sample(),g=extractLipGeometry(photo,a);expect(g.supported).toBe(true);
 if(g.supported){expect(g.source).toBe('contours');expect(g.path.match(/M/g)).toHaveLength(2);expect(g.path).toContain('360,565');expect(g.path).toContain('360,615');}
 expect(a).toEqual(sample());
});
test('reversing contour direction is safe; unordered mesh regions are never guessed',()=>{const a=sample();a.contours.forEach(c=>c.points.reverse());a.mesh={points:[],triangles:[],regions:{upperLipTop:[42,12,1]}};expect(extractLipGeometry(photo,a).supported).toBe(true);});
test.each([8,9,10,11])('missing contour %s fails closed, including missing inner mouth',type=>{const a=sample();a.contours=a.contours.filter(c=>c.type!==type);expect(extractLipGeometry(photo,a).supported).toBe(false);});
test('open mouth retains a hole while closed mouth is supported without fabricating points',()=>{const a=sample();expect(extractLipGeometry(photo,a).supported).toBe(true);a.contours[1].points=a.contours[1].points.map(p=>({...p,y:600}));a.contours[2].points=a.contours[2].points.map(p=>({...p,y:600}));expect(extractLipGeometry(photo,a).supported).toBe(true);});
test.each(['bounds','nan','crossed','duplicate','holeOutside','pose','multiple','detached'] as const)('rejects %s',mode=>{
 const a=sample();
 if(mode==='bounds')a.contours[0].points[2].x=-1;
 if(mode==='nan')a.contours[0].points[2].y=NaN;
 if(mode==='crossed')[a.contours[0].points[2],a.contours[0].points[7]]=[a.contours[0].points[7],a.contours[0].points[2]];
 if(mode==='duplicate')a.contours.push(a.contours[0]);
 if(mode==='holeOutside')a.contours[1].points[4].y=520;
 if(mode==='pose')a.faces[0].angles.y=25;
 if(mode==='multiple')a.faceCount=2;
 if(mode==='detached')a.contours[3].points=a.contours[3].points.map(p=>({...p,x:p.x+80}));
 expect(extractLipGeometry(photo,a).supported).toBe(false);
});
test('invalid photo, remote photo, unnormalized EXIF original and mismatched bitmap fail closed',()=>{
 expect(extractLipGeometry(undefined,sample()).supported).toBe(false);
 for(const p of [{...photo,uri:'https://example.invalid/selfie.jpg'},{...photo,uri:'file:///cache/original.jpg'},{...photo,width:960,height:720},{...photo,height:0}])expect(extractLipGeometry(p,sample()).supported).toBe(false);
 expect(extractLipGeometry(photo,undefined).supported).toBe(false);
});
test('mirrored normalized pixels and contours stay aligned without reordering or flipping in UI',()=>{
 const a=sample();a.contours.forEach(c=>{c.points=c.points.map(p=>({...p,x:a.width-p.x}));});
 expect(extractLipGeometry(photo,a).supported).toBe(true);
});
test('mesh alone cannot bypass missing ordered lip contours',()=>{const a=sample();a.contours=[];a.mesh={points:[],triangles:[],regions:{upperLipTop:[12,20,1]}};expect(extractLipGeometry(photo,a).supported).toBe(false);});
