import { createContext, ReactNode, useContext, useMemo, useState } from 'react';
import { useStore } from './store';

// نسخة الويب (للمعاينة فقط): لا يوجد متجر، فالشراء غير متاح
export const PLUS_SKU = 'akhirah_plus';
export const SUPPORT_SKUS = ['support_small', 'support_medium', 'support_large'] as const;
export type SupportSku = (typeof SUPPORT_SKUS)[number];
export type PurchaseStatus = 'idle' | 'busy' | 'pending' | 'thanks-plus' | 'thanks-support' | 'restored' | 'nothing' | 'error' | 'unavailable';

type Ctx = {
  ready: boolean;
  plus: boolean;
  price: (sku: string) => string | null;
  buyPlus: () => void;
  support: (sku: SupportSku) => void;
  restore: () => void;
  status: PurchaseStatus;
  clearStatus: () => void;
};

const PurchasesContext = createContext<Ctx | null>(null);

export function PurchasesProvider({ children }: { children: ReactNode }) {
  const { state } = useStore();
  const [status, setStatus] = useState<PurchaseStatus>('idle');
  const value = useMemo<Ctx>(
    () => ({
      ready: false,
      plus: state.plus,
      price: () => null,
      buyPlus: () => setStatus('unavailable'),
      support: () => setStatus('unavailable'),
      restore: () => setStatus('unavailable'),
      status,
      clearStatus: () => setStatus('idle'),
    }),
    [state.plus, status]
  );
  return <PurchasesContext.Provider value={value}>{children}</PurchasesContext.Provider>;
}

export function usePurchases(): Ctx {
  const ctx = useContext(PurchasesContext);
  if (!ctx) throw new Error('usePurchases must be used inside PurchasesProvider');
  return ctx;
}
