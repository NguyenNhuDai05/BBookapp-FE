const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const folders = ['app', 'components', 'hooks', 'services', 'repositories', 'store', 'utils', 'types', 'constants', 'lib'];
const files = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === '__tests__') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.tsx?$/.test(entry.name)) files.push(full);
  }
}
folders.forEach(folder => walk(path.join(root, folder)));
const findings = [];
for (const file of files) {
  const source = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
  const rel = path.relative(root, file).replaceAll('\\', '/');
  function visit(node) {
    const text = node.getText(source);
    if ((ts.isCallExpression(node) && /^(Alert\.alert|window\.(confirm|alert))$/.test(node.expression.getText(source))) ||
        ((ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) && /^(Modal|ConfirmDialog|FeedbackDialog|AdminConfirmDialog|BankDefaultPasswordModal)$/.test(node.tagName.getText(source)))) {
      findings.push({ file: rel, line: source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1, text });
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
}
if (process.argv.includes('--json')) process.stdout.write(JSON.stringify({ files: files.length, findings }, null, 2));
else {
  console.log(`Read ${files.length} frontend source files; ${findings.length} legacy overlay usages.`);
  findings.forEach(x => console.log(`${x.file}:${x.line}\n${x.text}\n`));
}
