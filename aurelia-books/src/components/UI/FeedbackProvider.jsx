import { useCallback, useEffect, useRef, useState } from 'react';
import { FeedbackContext } from './feedbackContext';
import { useI18n } from '../../i18n/context';
import Sheet from './Sheet';
import { Action } from './Controls';

export default function FeedbackProvider({ children }) {
  const [message, setMessage] = useState(null);
  const resolver = useRef(null);
  const { t } = useI18n();
  const confirm = useCallback(text => new Promise(resolve => {
    resolver.current?.(false);
    resolver.current = resolve;
    setMessage(text);
  }), []);
  const finish = value => { resolver.current?.(value); resolver.current = null; setMessage(null); };
  useEffect(() => () => resolver.current?.(false), []);
  return <FeedbackContext.Provider value={confirm}>{children}{message && <Sheet title="Confirm" onClose={() => finish(false)} footer={<Action negative onPress={() => finish(true)}>{t('Confirm')}</Action>}><p>{message}</p></Sheet>}</FeedbackContext.Provider>;
}
