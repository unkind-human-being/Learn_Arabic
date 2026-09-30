/** Uses the TypeScript devDependency already installed by create-next-app.
 * Run from your project root: node scripts/test-level1.mjs
 * Tests pure learning logic, not your Next.js build or installed speech voices.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
let ts;
try { ts = require("typescript"); }
catch {
  console.error("TypeScript was not found. Run npm install in your existing Next.js project first.");
  process.exit(1);
}
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = path.join(root, "app", "level-one");
const temp = fs.mkdtempSync(path.join(os.tmpdir(), "madrasa-logic-test-"));
try {
  for (const filename of ["content.ts", "arabic.ts", "model.ts"]) {
    const output = ts.transpileModule(fs.readFileSync(path.join(source, filename), "utf8"), {
      fileName: filename,
      compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, strict: true },
      reportDiagnostics: true,
    });
    const errors = (output.diagnostics ?? []).filter(d => d.category === ts.DiagnosticCategory.Error);
    if (errors.length) throw new Error(ts.formatDiagnosticsWithColorAndContext(errors, {
      getCanonicalFileName: f => f, getCurrentDirectory: () => root, getNewLine: () => "\n",
    }));
    const code = output.outputText.replace(/require\("\.\/(content|arabic|model)"\)/g, 'require("./$1.cjs")');
    fs.writeFileSync(path.join(temp, filename.replace(".ts", ".cjs")), code);
  }


const {ITEMS}=require(path.join(temp,'content.cjs'));const a=require(path.join(temp,'arabic.cjs'));const m=require(path.join(temp,'model.cjs'));let n=0;
function check(condition,label){assert.ok(condition,label);n++;}
for(const item of ITEMS){
 check(a.wordsMatch(item.steps,item.arabic),`${item.id}: complete word`);
 check(!a.wordsMatch(item.steps.filter(c=>!a.isMark(c)),item.arabic),`${item.id}: missing vowels rejected`);
 for(let i=0;i<item.steps.length;i++){
  check(a.nextExpectedToken(item.steps.slice(0,i),item.steps)===item.steps[i],`${item.id}: correct next at ${i}`);
  check(a.inputError(item.steps.slice(0,i),item.steps[i])===null,`${item.id}: can add at ${i}`);
  if(!a.isMark(item.steps[i]))check(a.letterBank(item.steps).includes(item.steps[i]),`${item.id}: letter in bank`);
 }
 let state=m.reducer({...m.INITIAL_STATE,hydrated:true},{type:'select',id:item.id});
 for(const char of item.steps)state=m.reducer(state,{type:'tile',char});
 state=m.reducer(state,{type:'check'});check(state.completed.length===1,`${item.id} earns star`);
 check(state.overlay==='success',`${item.id} shows lesson`);
 state=m.reducer(state,{type:'overlay',overlay:null});state=m.reducer(state,{type:'check'});
 check(state.completed.length===1,`${item.id} no duplicate star`);
}
const cap=ITEMS[0];let swapped=[...cap.steps];[swapped[6],swapped[7]]=[swapped[7],swapped[6]];
check(a.wordsMatch(swapped,cap.arabic),'shadda/vowel order accepted');
check(a.nextExpectedToken(swapped.slice(0,7),cap.steps)==='ّ','shadda remains after vowel first');
check(a.inputError([],'َ')!==null,'leading mark rejected');
check(a.inputError(['ب','َ'],'ِ')!==null,'two short vowels rejected');
check(a.inputError(['ب','َ'],'ْ')!==null,'vowel and sukun rejected');
check(a.inputError(['ب','ْ'],'َ')!==null,'sukun and vowel rejected');
check(a.inputError(['ب','َ'],'َ')!==null,'duplicate mark rejected');
check(!a.wordsMatch(['ا','َ','ح','ْ','ذ','ِ','ي','َ','ة'],ITEMS[4].arabic),'hamza not discarded');
check(m.parseProgress('nope').completed.length===0,'invalid JSON handled');
check(m.parseProgress(JSON.stringify({version:1,completed:['shirt','shirt','bad',5]})).completed.join(',')==='shirt','save sanitized');
let s={...m.INITIAL_STATE,hydrated:true};
for(const item of ITEMS){s=m.reducer(s,{type:'select',id:item.id});for(const char of item.steps)s=m.reducer(s,{type:'tile',char});s=m.reducer(s,{type:'check'});s=m.reducer(s,{type:'continue'});}
check(s.overlay==='complete'&&s.completed.length===6,'all six reach completion');
s=m.reducer(s,{type:'reset'});check(s.completed.length===0&&s.selected===null,'reset works');
console.log(`PASS: ${n} core assertions across all six words.`);

} finally {
  // Only remove the temporary directory created above, never any project file.
  fs.rmSync(temp, { recursive: true, force: true });
}
