import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import { Workbook } from '@oai/artifact-tool';

const input='C:/Users/Acer/Downloads/data_safety_export.csv';
const output='D:/EXE/bbeauty-app/artifacts/data-safety/data_safety_corrected_DRAFT.csv';
const workbook=await Workbook.fromCSV(await fs.readFile(input,'utf8'),{sheetName:'DataSafety'});
const sheet=workbook.worksheets.getItemAt(0);
const original=sheet.getUsedRange().values.map(row=>row.map(v=>v==null?'':String(v)));
assert.equal(original[0].length,5);
const changes=[];
const matched=new Set();
for(let i=1;i<original.length;i++) {
  const [q,r,old]=original[i];
  let value=old;
  if(q==='PSL_SUPPORT_DATA_DELETION_BY_USER') {
    value=r==='DATA_DELETION_YES'?'true':'';
    matched.add('deletion');
  }
  if(q==='PSL_DATA_DELETION_URL') value='https://bbookmakeup.com/delete-account/';
  if(q.startsWith('PSL_DATA_USAGE_RESPONSES:PSL_CRASH_LOGS:') || (q.startsWith('PSL_DATA_TYPES_')&&r==='PSL_CRASH_LOGS')) {
    value=''; matched.add('crash');
  }
  if(q.startsWith('PSL_DATA_USAGE_RESPONSES:PSL_PERFORMANCE_DIAGNOSTICS:')) {
    value=''; matched.add('diagnostics');
  }
  // Preserve the selected diagnostics category provisionally; blank handling answers
  // deliberately leave it incomplete instead of encoding UNKNOWN as "not collected".
  if(q==='PSL_DATA_USAGE_RESPONSES:PSL_DEVICE_ID:DATA_USAGE_USER_CONTROL') {
    assert.ok(['PSL_DATA_USAGE_USER_CONTROL_REQUIRED','PSL_DATA_USAGE_USER_CONTROL_OPTIONAL'].includes(r),r);
    value=r==='PSL_DATA_USAGE_USER_CONTROL_REQUIRED'?'true':''; matched.add('deviceControl');
  }
  if(q==='PSL_DATA_USAGE_RESPONSES:PSL_DEVICE_ID:DATA_USAGE_COLLECTION_PURPOSE') {
    value=r==='PSL_APP_FUNCTIONALITY'?'true':''; matched.add('devicePurpose');
  }
  if(value!==old) {
    sheet.getCell(i,2).values=[[value]];
    changes.push({row:i+1,question:q,response:r,before:old,after:value,label:original[i][4]});
  }
}
for(const key of ['deletion','crash','diagnostics','deviceControl','devicePurpose']) assert.ok(matched.has(key),key);
workbook.recalculate();
const updated=sheet.getUsedRange().values.map(row=>row.map(v=>v==null?'':String(v)));
assert.equal(updated.length,original.length);
for(let i=0;i<updated.length;i++) for(const col of [0,1,3,4]) assert.equal(updated[i][col],original[i][col]);
const quote=v=>/[",\r\n]/.test(v)?'"'+v.replaceAll('"','""')+'"':v;
await fs.writeFile(output,updated.map(row=>row.map(quote).join(',')).join('\r\n')+'\r\n','utf8');
const reopened=await Workbook.fromCSV(await fs.readFile(output,'utf8'),{sheetName:'Verify'});
assert.deepEqual(reopened.worksheets.getItemAt(0).getUsedRange().values.map(row=>row.map(v=>v==null?'':String(v))),updated);
await fs.writeFile('D:/EXE/bbeauty-app/artifacts/data-safety/changes.json',JSON.stringify(changes,null,2));
console.log(JSON.stringify({output,rows:updated.length,changedCells:changes.length,changes:changes.map(x=>({row:x.row,response:x.response,before:x.before,after:x.after}))},null,2));
