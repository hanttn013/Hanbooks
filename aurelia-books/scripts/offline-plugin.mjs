import { createHash } from 'node:crypto';

// Precache emitted lazy readers and workers as well as the application shell.
// Original books remain in IndexedDB; they are never copied into this cache.
export function offlinePlugin() {
  return {
    name: 'shanbooks-offline',
    generateBundle(_options, bundle) {
      const urls = [...new Set(['index.html', ...Object.keys(bundle).filter(name => !name.endsWith('.map'))])];
      const version = createHash('sha256').update(JSON.stringify(bundle)).digest('hex').slice(0, 16);
      const source = `const CACHE='shanbooks-shell-${version}';
const URLS=${JSON.stringify(urls)};
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(URLS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('shanbooks-shell-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{const url=new URL(event.request.url);if(event.request.method!=='GET'||url.origin!==self.location.origin)return;event.respondWith(caches.match(event.request,{ignoreVary:true}).then(cached=>cached||fetch(event.request).catch(error=>{if(event.request.mode==='navigate')return caches.match(new URL('index.html',self.registration.scope),{ignoreVary:true});throw error})));});`;
      this.emitFile({ type: 'asset', fileName: 'sw.js', source });
    },
  };
}
