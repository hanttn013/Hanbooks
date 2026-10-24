import { useMemo } from 'react';
import { I18nContext } from './context';
import { translate } from './messages';
export default function I18nProvider({ locale, children }) {
  const value = useMemo(() => ({ locale, t: (key, params) => translate(locale, key, params) }), [locale]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
