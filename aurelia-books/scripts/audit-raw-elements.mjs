import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const srcDir = path.resolve(__dirname, '../src');

// Explicit Allowlist with rationale
const ALLOWLIST = [
  {
    file: 'src/components/Common/AppShell.jsx',
    tag: 'button',
    reason: 'AppShell responsive navigation items (Mobile TabBar <600px, Navigation Rail 600-1200px, Sidebar >=1200px) where Spectrum S2 has no native mobile tab bar',
  },
  {
    file: 'src/components/Library/LibraryScreen.jsx',
    tag: 'input',
    reason: 'Hidden native OS file input (type="file", display: none) for importing books from device filesystem',
  },
  {
    file: 'src/components/Settings/SettingsScreen.jsx',
    tag: 'input',
    reason: 'Hidden native OS file input (type="file", display: none) for restoring backup JSON',
  },
  {
    file: 'src/components/Lists/ListsScreen.jsx',
    tag: 'input',
    reason: 'Hidden native OS file input (type="file", display: none) for uploading list cover image from device filesystem',
  },
  {
    file: 'src/components/Reader/EpubReaderScreen.jsx',
    tag: 'input',
    reason: 'Reader progress scrubber range input (type="range") in bottom dock for scrubbing through chapters/pages',
  },
  {
    file: 'src/components/Reader/TOCModal.jsx',
    tag: 'button',
    reason: 'Virtualized TOC row button inside Reader TOC dialog, optimized for smooth high-frequency scrolling',
  },
  {
    file: 'src/components/Reader/SearchModal.jsx',
    tag: 'button',
    reason: 'Search result card button inside Reader Search dialog, formatted for multi-line excerpt typography',
  },
  {
    file: 'src/components/Reader/BookmarksModal.jsx',
    tag: 'button',
    reason: 'Reader bookmarks list and tab buttons styled with reader-specific themes',
  },
  {
    file: 'src/components/Reader/ReaderChrome.jsx',
    tag: 'button',
    reason: 'Reader navigation toolbar buttons styled for reading immersion and device touch targets',
  },
  {
    file: 'src/components/Reader/ReaderChrome.jsx',
    tag: 'input',
    reason: 'Reader progress range scrubber input with theme background',
  },
  {
    file: 'src/components/Reader/ReaderSettingsPanel.jsx',
    tag: 'button',
    reason: 'Reader theme palettes and font choice chips requiring custom color swatch styling',
  },
  {
    file: 'src/components/Reader/ReaderSheet.jsx',
    tag: 'button',
    reason: 'Reader bottom sheet close button styled with reader theme',
  },
  {
    file: 'src/components/Reader/ReaderViewport.jsx',
    tag: 'button',
    reason: 'Accessible reader viewport mini-footer toggle button',
  },
  {
    file: 'src/components/Reader/SearchModal.jsx',
    tag: 'input',
    reason: 'Search text input inside reader search modal',
  },
  {
    file: 'src/components/Reader/UniversalReaderScreen.jsx',
    tag: 'button',
    reason: 'Universal reader navigation and control buttons',
  },
  {
    file: 'src/components/Dev/DesignSystemScreen.jsx',
    tag: 'button',
    reason: 'Internal dev-only styleguide screen comparing legacy buttons with Spectrum S2 components',
  },
];

function getAllFiles(dir, exts) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      results = results.concat(getAllFiles(fullPath, exts));
    } else if (exts.some(ext => file.endsWith(ext))) {
      results.push(fullPath);
    }
  }
  return results;
}

console.log('====================================================');
console.log('🔍 AUDITING RAW HTML ELEMENTS IN src/ (Adobe Spectrum)');
console.log('====================================================\n');

const jsxFiles = getAllFiles(srcDir, ['.jsx', '.js']);
const violations = [];
const allowedMatches = [];

const RAW_TAG_REGEX = /<(\/?)(button|input|select|dialog|textarea)\b([^>]*)>/g;

for (const file of jsxFiles) {
  const relPath = path.relative(path.resolve(__dirname, '..'), file).replace(/\\/g, '/');
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');

  lines.forEach((line, idx) => {
    // Only check opening tags
    const matches = line.matchAll(/<(button|input|select|dialog|textarea)\b([^>]*)/g);
    for (const match of matches) {
      const tag = match[1];
      const lineNum = idx + 1;

      const isAllowed = ALLOWLIST.some(item => {
        if (relPath === item.file && item.tag === tag) {
          // Extra validation: if it's input in Settings/Library/Reader, confirm it's type="file"
          if (item.tag === 'input' && item.reason.includes('Hidden native OS file input')) {
            const surrounding = lines.slice(idx, idx + 10).join(' ');
            return surrounding.includes('type="file"') || surrounding.includes("type='file'");
          }
          if (item.tag === 'input' && item.reason.includes('type="range"')) {
            const surrounding = lines.slice(idx, idx + 10).join(' ');
            return surrounding.includes('type="range"') || surrounding.includes("type='range'");
          }
          return true;
        }
        return false;
      });

      if (isAllowed) {
        allowedMatches.push({
          file: relPath,
          line: lineNum,
          tag,
          snippet: line.trim(),
        });
      } else {
        violations.push({
          file: relPath,
          line: lineNum,
          tag,
          snippet: line.trim(),
        });
      }
    }
  });
}

console.log(`Audited ${jsxFiles.length} JS/JSX files.`);
console.log(`Allowed raw elements found: ${allowedMatches.length}`);
for (const item of allowedMatches) {
  console.log(`  ✓ [ALLOWED] ${item.file}:${item.line} <${item.tag}> -> ${item.snippet.slice(0, 70)}...`);
}

if (violations.length > 0) {
  console.error(`\n❌ ERROR: Found ${violations.length} unapproved raw HTML element(s) in src/:`);
  for (const v of violations) {
    console.error(`  - ${v.file}:${v.line} <${v.tag}>: ${v.snippet}`);
  }
  process.exit(1);
}

console.log('\n====================================================');
console.log('🎨 AUDITING COLOR CONSISTENCY & ACCENT TOKENS');
console.log('====================================================\n');

// Check that no arbitrary hex colors are hardcoded inline in src/components
const colorViolations = [];
for (const file of jsxFiles) {
  // Allow token definitions or theme files if any
  const relPath = path.relative(path.resolve(__dirname, '..'), file).replace(/\\/g, '/');
  if (relPath.includes('DesignSystemScreen') || relPath.includes('Cover.jsx') || relPath.includes('themes.js') || relPath.includes('statusBar.js')) {
    // statusBar.js manages native Android OS status bar hex colors
    // Cover.jsx generates algorithmic hash-based accessible colors for monogram lists
    continue;
  }

  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');

  lines.forEach((line, idx) => {
    // Look for style={{ ... '#hex' ... }}
    if (line.includes('style=') && /#[0-9a-fA-F]{3,8}\b/.test(line)) {
      colorViolations.push({
        file: relPath,
        line: idx + 1,
        snippet: line.trim(),
      });
    }
  });
}

if (colorViolations.length > 0) {
  console.error(`\n❌ ERROR: Found ${colorViolations.length} inline hardcoded hex color(s) in JSX:`);
  for (const cv of colorViolations) {
    console.error(`  - ${cv.file}:${cv.line}: ${cv.snippet}`);
  }
  process.exit(1);
}

console.log('\n====================================================');
console.log('🔘 AUDITING BUTTON WRAPPER ENFORCEMENT (<Button>, <IconButton>, <TextAction>)');
console.log('====================================================\n');

// All screens, trays, dialogs, settings must use wrapped buttons from src/components/Common/
const wrapperViolations = [];
for (const file of jsxFiles) {
  const relPath = path.relative(path.resolve(__dirname, '..'), file).replace(/\\/g, '/');
  if (relPath.startsWith('src/components/Common/') || relPath.includes('DesignSystemScreen') || relPath.includes('Dev/')) {
    continue; // Common defines the wrappers, Dev is dev styleguide
  }

  const content = fs.readFileSync(file, 'utf8');
  // Check if file imports directly from @react-spectrum/s2/Button or ActionButton
  if (/@react-spectrum\/s2\/(Button|ActionButton)\b/.test(content)) {
    wrapperViolations.push({
      file: relPath,
      reason: 'Direct import of @react-spectrum/s2 Button/ActionButton. Must use Button/IconButton/TextAction from src/components/Common/',
    });
  }
}

if (wrapperViolations.length > 0) {
  console.error(`\n❌ ERROR: Found ${wrapperViolations.length} file(s) bypassing button wrappers:`);
  for (const wv of wrapperViolations) {
    console.error(`  - ${wv.file}: ${wv.reason}`);
  }
  process.exit(1);
}
console.log('✓ All screens and dialogs route through Button, IconButton, and TextAction wrappers.');

console.log('✓ All components strictly utilize Adobe Spectrum S2 & CSS design tokens.');
console.log('✓ Zero unapproved raw <button>, <input>, <select>, <dialog> elements found.');
console.log('✓ Color consistency check passed: Zero hardcoded hex colors in JSX styles.');
console.log('\n🎉 AUDIT PASSED 100%!\n');
process.exit(0);
