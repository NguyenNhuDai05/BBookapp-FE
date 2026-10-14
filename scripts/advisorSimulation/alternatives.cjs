// Research-only alternatives. Not imported by the application.
const {candidates,tieBreakOrder}=require('./engine20.ts');
const effects={
 'flushed-blush':{label:'Má hồng ửng nổi bật',keys:['igari','strawberry'],field:'techniques.cheeks'},
 'bronzed-glow':{label:'Hiệu ứng bronzer/ánh đồng',keys:['sunkissed','thai-glam','latte','clean-girl'],field:'techniques.cheeks',fieldsByKey:{'clean-girl':'techniques.contourHighlight'}},
 'dewy-base':{label:'Nền căng bóng',keys:['soft-korean','clean-girl','glass-skin','bridal-soft-glam'],field:'techniques.base',fieldsByKey:{'clean-girl':'signatureLook'}},
 'matte-base':{label:'Nền lì hoặc bán lì',keys:['douyin','latte','soft-glam','thai-glam','smokey-eyes','classic-glam','western-glam'],field:'techniques.base'},
 'gradient-lips':{label:'Môi chuyển sắc',keys:['soft-korean','ulzzang'],field:'techniques.lips'},
 'soft-natural':{label:'Tự nhiên, nhẹ',keys:['natural','j-beauty','clean-girl'],field:'signatureLook'},
 'smokey-eyes':{label:'Mắt khói',keys:['soft-glam','smokey-eyes'],field:'techniques.eyes'},
 'classic-red-lips':{label:'Môi đỏ cổ điển',keys:['classic-glam'],field:'techniques.lips'},
 'peach-tone':{label:'Phối sắc đào',keys:['peach'],field:'signatureLook'},
};
const byKey=Object.fromEntries(candidates.map(c=>[c.key,c]));
function rank(rows,n=3){const rest=[...rows].sort((a,b)=>b.finalScore-a.finalScore||tieBreakOrder.indexOf(a.styleKey)-tieBreakOrder.indexOf(b.styleKey));const selected=[];while(selected.length<n&&rest.length){const best=rest[0].finalScore,pool=rest.filter(r=>r.finalScore===best);const next=pool.find(r=>!selected.some(s=>byKey[s.styleKey].intensity===byKey[r.styleKey].intensity))||pool[0];selected.push(next);rest.splice(rest.indexOf(next),1);}return selected;}
function reviewUlzzang(base){const scores=base.scores.map(r=>{if(r.styleKey!=='ulzzang')return r;const removed=r.ruleContributions.filter(c=>c.ruleId==='opening-high-gradient');const contributions=r.ruleContributions.filter(c=>c.ruleId!=='opening-high-gradient');const faceScore=r.faceScore-removed.reduce((s,c)=>s+c.contribution,0);return {...r,evidenceStatus:faceScore>0?'experimental':r.preferenceScore>0?'preference-only':'fallback',selectionReason:faceScore>0?'face-technique-match':r.preferenceScore>0?'explicit-preference':'diverse-discovery',faceScore,finalScore:faceScore+r.preferenceScore,ruleContributions:contributions,explanations:[...new Set(contributions.map(c=>c.explanation)),...r.preferenceContributions.map(c=>c.explanation)]};});return {scores,top3:rank(scores)};}
function classify(row,requested,preferenceLane=false){const matched=requested.length>0&&requested.every(e=>effects[e].keys.includes(row.styleKey));const primary=preferenceLane?'preference-based':row.faceScore>0?'face-aware':matched||row.preferenceScore>0?'preference-based':'fallback';return {...row,selected:true,evidenceStatus:primary==='face-aware'?'experimental':primary==='preference-based'?'preference-only':'fallback',faceEvidenceStatus:row.faceScore>0?'experimental':'none',source:primary,selectionBasis:preferenceLane?'explicit-effect-slot':matched?'effect-filter-then-existing-score':row.faceScore>0?'valid-measurements':row.preferenceScore>0?'occasion-intensity':'curated-fallback',matchedEffects:matched?requested:[],faceEvidence:row.ruleContributions,preferenceEvidence:row.preferenceContributions,effectEvidence:matched?requested.map(e=>({effect:e,label:effects[e].label,catalogField:effects[e].fieldsByKey?.[row.styleKey]||effects[e].field})):[],sourceExplanation:preferenceLane?'Theo hiệu ứng bạn chọn; vị trí này không được xếp bằng faceScore':primary==='face-aware'?'Dựa trên số đo qua quality gate; liên hệ thẩm mỹ vẫn experimental':primary==='preference-based'?'Theo lựa chọn chủ động, không suy hiệu ứng từ khuôn mặt':'Không có rule hoặc lựa chọn khớp cho gợi ý này; dùng fallback'};}
function choose(base,requested=[],method='A'){
 if(requested.some(e=>!effects[e])||new Set(requested).size!==requested.length)throw Error('Invalid optional effect selection');
 const reviewed=reviewUlzzang(base);const matches=requested.length?reviewed.scores.filter(r=>requested.every(e=>effects[e].keys.includes(r.styleKey))):[];
 let rows=reviewed.top3,winner;
 if(requested.length&&matches.length){if(method==='A'){const picked=rank(matches);rows=[...picked,...rank(reviewed.scores.filter(r=>!picked.some(p=>p.styleKey===r.styleKey)),3-picked.length)];}else if(method==='B'){
  winner=[...matches].sort((a,b)=>b.preferenceScore-a.preferenceScore||tieBreakOrder.indexOf(a.styleKey)-tieBreakOrder.indexOf(b.styleKey))[0];
  rows=reviewed.top3.some(r=>r.styleKey===winner.styleKey)?reviewed.top3:[...reviewed.top3.slice(0,2),winner];
 }else throw Error('Unknown alternative');}
 return {method,requested,matchCount:matches.length,unmetEffects:requested.length>0&&matches.length===0,top3:rows.map(r=>classify(r,requested,method==='B'&&winner?.styleKey===r.styleKey)),scores:reviewed.scores};
}
module.exports={effects,rank,reviewUlzzang,choose};
