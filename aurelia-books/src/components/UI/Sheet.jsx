import { useLayoutEffect, useRef } from 'react';
import { Dialog, DialogContainer, Heading, Content, Footer } from '@react-spectrum/s2/Dialog';
import { useI18n } from '../../i18n/context';
import { Action } from './Controls';
import { registerOverlay } from './overlayNavigation';

export default function Sheet({ title, children, onClose, footer, busy = false, historyManaged = false }) {
  const { t } = useI18n();
  const owner = useRef({ onClose, busy });
  useLayoutEffect(() => { owner.current = { onClose, busy }; }, [onClose, busy]);
  useLayoutEffect(() => {
    if (historyManaged) return;
    let disposed = false;
    let unregister = () => {};
    // Wait for the owner's navigation effect and StrictMode replay to settle.
    queueMicrotask(() => {
      if (disposed) return;
      const snapshot = window.history.state;
      const close = () => { if (!owner.current.busy) owner.current.onClose(); };
      const pop = () => {
        // Dialogs are transient UI, not additional app destinations. Restore the
        // consumed page entry so Back closes only the top dialog, never Reader.
        window.history.pushState(snapshot, '');
        close();
        return true;
      };
      unregister = registerOverlay(crypto.randomUUID(), close, pop);
    });
    return () => { disposed = true; unregister(); };
  }, [historyManaged]);
  const close = () => { if (!busy) onClose(); };
  return <DialogContainer onDismiss={close}>
    <Dialog size="L" aria-label={t(title)} isDismissible={!busy} isKeyboardDismissDisabled={busy}>
      <Heading slot="title">{t(title)}</Heading>
      <Content><div className="sheet-content">{children}</div></Content>
      <Footer><div className="action-row">{footer}<Action onPress={close} disabled={busy}>{t('Close')}</Action></div></Footer>
    </Dialog>
  </DialogContainer>;
}
