import { createContext, useContext } from 'react';
import { translate } from './messages';
export const I18nContext = createContext({ locale: 'en', t: (key, params) => translate('en', key, params) });
export function useI18n() { return useContext(I18nContext); }
