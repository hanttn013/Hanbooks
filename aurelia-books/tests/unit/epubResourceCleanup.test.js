import { expect, it, vi } from 'vitest';
import { destroyEpubBook } from '../../src/utils/destroyEpubBook';

it('revokes Blob URL values rather than EPUB archive paths before destroy', () => {
  const revoke = vi.fn(); vi.stubGlobal('URL', { revokeObjectURL: revoke });
  const destroy = vi.fn(() => expect(revoke).toHaveBeenCalledWith('blob:owned-cover'));
  destroyEpubBook({ archive: { urlCache: { '/cover.jpg': 'blob:owned-cover', '/style': 'data:text/css,test' } }, destroy });
  expect(revoke).toHaveBeenCalledTimes(1); expect(destroy).toHaveBeenCalledOnce();
  vi.unstubAllGlobals();
});
