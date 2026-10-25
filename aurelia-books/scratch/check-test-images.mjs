import fs from 'node:fs';
import path from 'node:path';

const testsDir = 'E:/Personal_pj/Hanbook/aurelia-books/tests';

function scan(p) {
  for (const item of fs.readdirSync(p, { withFileTypes: true })) {
    const full = path.join(p, item.name);
    if (item.isDirectory()) scan(full);
    else if (item.name.endsWith('.js') || item.name.endsWith('.jsx')) {
      const content = fs.readFileSync(full, 'utf8');
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.includes('.png') || line.includes('.jpg') || line.includes('screenshot') || line.includes('toMatchSnapshot')) {
          console.log(`${item.name}:${i + 1}: ${line.trim()}`);
        }
      }
    }
  }
}
scan(testsDir);
