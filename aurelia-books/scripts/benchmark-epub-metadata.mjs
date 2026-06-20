import fs from 'node:fs/promises';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import JSZip from 'jszip';
import { DOMParser } from '@xmldom/xmldom';

const root = process.argv[2] || '../data';
const limit = Number(process.argv[3] || 0);
const parser = new DOMParser();

async function collectEpubs(dir) {
  const rows = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) rows.push(...await collectEpubs(full));
    else if (entry.isFile() && entry.name.toLowerCase().endsWith('.epub')) rows.push(full);
  }
  return rows;
}

function textOf(parent, tagName) {
  const rows = parent.getElementsByTagName(tagName);
  return rows?.[0]?.textContent?.trim() || '';
}

function attrOf(parent, tagName, attrName, valueName, value) {
  const rows = Array.from(parent.getElementsByTagName(tagName));
  const found = rows.find(node => node.getAttribute(attrName) === value);
  return found?.getAttribute(valueName) || '';
}

function normalizeSearch(text = '') {
  return text
    .replace(/chÆ°Æ¡ng|chÃ†Â°Ã†Â¡ng/gi, 'chuong')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function chapterTokenCount(text = '') {
  return (normalizeSearch(text).match(/\b(?:chuong|chapter)\s*\d+/g) || []).length;
}

function htmlToText(html = '') {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

function joinPath(baseFile, href) {
  return path.posix.normalize(path.posix.join(path.posix.dirname(baseFile.replaceAll('\\', '/')), href));
}

function percentile(values, p) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
  return sorted[index];
}

async function parseEpub(filePath) {
  const buffer = await fs.readFile(filePath);
  const zip = await JSZip.loadAsync(buffer);
  const containerXml = await zip.file('META-INF/container.xml')?.async('text');
  if (!containerXml) throw new Error('Missing META-INF/container.xml');

  const container = parser.parseFromString(containerXml, 'text/xml');
  const opfPath = container.getElementsByTagName('rootfile')?.[0]?.getAttribute('full-path');
  if (!opfPath) throw new Error('Missing OPF rootfile');

  const opfXml = await zip.file(opfPath)?.async('text');
  if (!opfXml) throw new Error(`Missing OPF ${opfPath}`);
  const opf = parser.parseFromString(opfXml, 'text/xml');
  const metadata = {
    title: textOf(opf, 'dc:title') || path.basename(filePath, '.epub'),
    author: textOf(opf, 'dc:creator'),
    language: textOf(opf, 'dc:language'),
    subject: textOf(opf, 'dc:subject'),
    description: textOf(opf, 'dc:description'),
  };

  const manifestItems = Array.from(opf.getElementsByTagName('item')).map(node => ({
    id: node.getAttribute('id'),
    href: node.getAttribute('href'),
    mediaType: node.getAttribute('media-type'),
    properties: node.getAttribute('properties') || '',
  }));
  const byId = new Map(manifestItems.map(item => [item.id, item]));
  const spineRefs = Array.from(opf.getElementsByTagName('itemref')).map(node => node.getAttribute('idref'));
  const spine = spineRefs.map(id => byId.get(id)).filter(Boolean);

  const navItem = manifestItems.find(item => item.properties.includes('nav'));
  const ncxId = attrOf(opf, 'spine', 'toc', 'toc', 'toc') || opf.getElementsByTagName('spine')?.[0]?.getAttribute('toc');
  const ncxItem = ncxId ? byId.get(ncxId) : null;
  let navText = '';
  if (navItem?.href) {
    navText = htmlToText(await zip.file(joinPath(opfPath, navItem.href))?.async('text') || '');
  } else if (ncxItem?.href) {
    navText = htmlToText(await zip.file(joinPath(opfPath, ncxItem.href))?.async('text') || '');
  }

  let words = 0;
  let preview = '';
  let loadedSections = 0;
  for (const item of spine.slice(0, 6)) {
    const entry = zip.file(joinPath(opfPath, item.href));
    if (!entry) continue;
    const html = await entry.async('text');
    const text = htmlToText(html);
    if (!text) continue;
    loadedSections += 1;
    words += text.split(/\s+/).filter(Boolean).length;
    if (preview.length < 1200 && chapterTokenCount(text) <= 8) preview += ` ${text}`;
  }

  const navChapterCount = chapterTokenCount(navText);
  const previewClean = preview.replace(/\s+/g, ' ').trim().slice(0, 1200);
  return {
    size: buffer.byteLength,
    title: metadata.title,
    author: metadata.author || 'Unknown Author',
    language: metadata.language,
    subject: metadata.subject,
    opfDescriptionChars: metadata.description.length,
    opfDescriptionTocLike: chapterTokenCount(metadata.description) > 8,
    navChapterCount,
    spineCount: spine.length,
    loadedSections,
    estimatedPages: Math.max(0, Math.ceil(words / 280)),
    previewChars: previewClean.length,
    previewTocLike: chapterTokenCount(previewClean) > 8,
  };
}

const files = (await collectEpubs(path.resolve(root))).sort((a, b) => a.localeCompare(b, 'vi'));
const selected = limit > 0 ? files.slice(0, limit) : files;
const results = [];

for (const filePath of selected) {
  const started = performance.now();
  try {
    const parsed = await parseEpub(filePath);
    results.push({
      file: path.basename(filePath),
      elapsedMs: Math.round(performance.now() - started),
      status: 'pass',
      ...parsed,
    });
  } catch (err) {
    const stat = await fs.stat(filePath).catch(() => ({ size: 0 }));
    results.push({
      file: path.basename(filePath),
      size: stat.size,
      elapsedMs: Math.round(performance.now() - started),
      status: 'fail',
      error: err?.message || String(err),
    });
  }
}

const durations = results.filter(row => row.status === 'pass').map(row => row.elapsedMs);
const summary = {
  testedAt: new Date().toISOString(),
  root: path.resolve(root),
  totalFilesFound: files.length,
  totalFilesTested: selected.length,
  passed: results.filter(row => row.status === 'pass').length,
  failed: results.filter(row => row.status === 'fail').length,
  avgMs: durations.length ? Math.round(durations.reduce((sum, item) => sum + item, 0) / durations.length) : 0,
  p50Ms: percentile(durations, 50),
  p90Ms: percentile(durations, 90),
  p95Ms: percentile(durations, 95),
  maxMs: durations.length ? Math.max(...durations) : 0,
  tocLikeDescriptions: results.filter(row => row.opfDescriptionTocLike || row.previewTocLike).length,
  maxSpineCount: Math.max(0, ...results.map(row => row.spineCount || 0)),
  maxNavChapterCount: Math.max(0, ...results.map(row => row.navChapterCount || 0)),
};

console.log(JSON.stringify({ summary, results }, null, 2));
