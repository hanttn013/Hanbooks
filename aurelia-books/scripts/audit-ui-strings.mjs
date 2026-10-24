import fs from 'node:fs';
import path from 'node:path';
import { parse } from '@babel/parser';
import { vi } from '../src/i18n/messages.js';

const failures = [];
const allowed = new Set(['ShanBooks', 'Aa', 'Book', 'PDF', 'EPUB', 'DOCX', 'PPTX']);
function visit(node, file) {
  if (!node || typeof node !== 'object') return;
  if (node.type === 'JSXText') {
    const value = node.value.replace(/\s+/g, ' ').trim();
    if (/[a-zA-ZÀ-ỹ]/.test(value) && !allowed.has(value)) failures.push(`${file}:${node.loc.start.line} hardcoded text: ${value}`);
  }
  if (node.type === 'CallExpression' && node.callee?.name === 't' && node.arguments[0]?.type === 'StringLiteral') {
    const key = node.arguments[0].value;
    if (!(key in vi)) failures.push(`${file}:${node.loc.start.line} missing Vietnamese key: ${key}`);
  }
  for (const [key, child] of Object.entries(node)) {
    if (key === 'loc' || key === 'tokens' || key === 'comments') continue;
    if (Array.isArray(child)) child.forEach(value => visit(value, file));
    else if (child && typeof child === 'object') visit(child, file);
  }
}
function scan(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) scan(file);
    else if (file.endsWith('.jsx')) visit(parse(fs.readFileSync(file, 'utf8'), { sourceType: 'module', plugins: ['jsx'] }), file);
  }
}
scan('src/components');
visit(parse(fs.readFileSync('src/App.jsx', 'utf8'), { sourceType: 'module', plugins: ['jsx'] }), 'src/App.jsx');
if (failures.length) { console.error(failures.join('\n')); process.exitCode = 1; }
else console.log('UI static strings and literal translation keys: passed');
