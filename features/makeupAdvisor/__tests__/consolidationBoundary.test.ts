import {readFileSync,existsSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import ts from 'typescript';
import {candidates,scoringPolicy} from '../recommendationCore';
import {createHash} from 'node:crypto';
test('one runtime gateway has no legacy regression engine or cloud/native dependency',()=>{
 const seen=new Set<string>();
 function visit(path:string){if(seen.has(path))return;seen.add(path);const text=readFileSync(path,'utf8');expect(text).not.toMatch(/advisorRegression|simulateEngine20|localEngine20Enabled|recommendTwenty/);const source=ts.createSourceFile(path,text,ts.ScriptTarget.Latest,true);const imports:string[]=[];
 source.forEachChild(n=>{if(ts.isImportDeclaration(n)&&!n.importClause?.isTypeOnly&&(!n.importClause?.namedBindings||!ts.isNamedImports(n.importClause.namedBindings)||n.importClause.namedBindings.elements.some(e=>!e.isTypeOnly)))imports.push((n.moduleSpecifier as ts.StringLiteral).text);});
 for(const spec of imports){if(!spec.startsWith('.'))continue;const base=resolve(dirname(path),spec),next=['.ts','.tsx'].map(ext=>base+ext).find(existsSync);if(next){expect(next).not.toMatch(/advisorTransport|advisorRecommendation|faceAnalysis|useAdvisorMatches/);visit(next);}}
 }
 visit(resolve('features/makeupAdvisor/faceScanRecommendations.ts'));
 expect(seen.has(resolve('features/makeupAdvisor/localEngine.ts'))).toBe(true);expect(seen.has(resolve('features/makeupAdvisor/recommendationCore.ts'))).toBe(true);
});
test('20 candidates and reviewed weights remain intact',()=>{expect(candidates).toHaveLength(20);expect(new Set(candidates.map(s=>s.key)).size).toBe(20);expect(scoringPolicy).toEqual({faceBudget:1,occasionBonus:.12,intensityBonus:.08});});
test('scan/native/UI preserve the main baseline; only documented v2 ranking files change',()=>{const hashes=JSON.parse(readFileSync('docs/advisor/APK-MAIN-BASELINE-HASHES.json','utf8')).files;const revised=JSON.parse(readFileSync('docs/advisor/MEASUREMENT-RANKING-V2-HASHES.json','utf8')).files;for(const [path,hash] of Object.entries(hashes)){const content=readFileSync(path,'utf8').replace(/\r\n/g,'\n');expect(createHash('sha256').update(content).digest('hex')).toBe(String(revised[path]??hash).toLowerCase());}});
