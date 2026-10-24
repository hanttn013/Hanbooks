import { createContext, useContext } from 'react';
export const FeedbackContext = createContext(async message => window.confirm(message));
export function useConfirm() { return useContext(FeedbackContext); }
