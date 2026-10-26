import { useIAP, type Product, type Purchase } from 'expo-iap';
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from './store';

// منتجات المتجر (تُنشأ بنفس الأسماء في Google Play Console و App Store Connect)
export const PLUS_SKU = 'akhirah_plus';
export const SUPPORT_SKUS = ['support_small', 'support_medium', 'support_large'] as const;
export type SupportSku = (typeof SUPPORT_SKUS)[number];
const ALL_SKUS = [PLUS_SKU, ...SUPPORT_SKUS];

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
  const { state, update } = useStore();
  const [status, setStatus] = useState<PurchaseStatus>('idle');
  const restoring = useRef(false);

  const grantPlus = useCallback(() => update((s) => (s.plus ? s : { ...s, plus: true })), [update]);

  const handle = useCallback(
    async (p: Purchase, finish: (a: { purchase: Purchase; isConsumable?: boolean }) => Promise<void>) => {
      if (p.purchaseState === 'pending') {
        setStatus('pending');
        return;
      }
      if (p.purchaseState !== 'purchased') return;
      if (p.productId === PLUS_SKU) {
        grantPlus();
        await finish({ purchase: p, isConsumable: false }).catch(() => {});
        setStatus('thanks-plus');
      } else if ((SUPPORT_SKUS as readonly string[]).includes(p.productId)) {
        await finish({ purchase: p, isConsumable: true }).catch(() => {});
        update((s) => ({ ...s, supportCount: s.supportCount + 1 }));
        setStatus('thanks-support');
      }
    },
    [grantPlus, update]
  );

  const finishRef = useRef<(a: { purchase: Purchase; isConsumable?: boolean }) => Promise<void>>(async () => {});

  const iap = useIAP({
    onPurchaseSuccess: (p) => {
      handle(p, finishRef.current);
    },
    onPurchaseError: (e) => {
      const code = String((e as { code?: string }).code ?? '');
      setStatus(code.includes('cancel') ? 'idle' : 'error');
    },
    onError: () => {},
  });
  finishRef.current = iap.finishTransaction;

  // عند الاتصال بالمتجر: نجلب الأسعار، ونتحقق إن كان المستخدم اشترى بلس سابقاً
  useEffect(() => {
    if (!iap.connected) return;
    iap.fetchProducts({ skus: ALL_SKUS, type: 'in-app' }).catch(() => {});
    iap.getAvailablePurchases().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [iap.connected]);

  useEffect(() => {
    const owned = iap.availablePurchases.find((p) => p.productId === PLUS_SKU && p.purchaseState === 'purchased');
    if (owned) {
      grantPlus();
      if (!(owned as { isAcknowledgedAndroid?: boolean | null }).isAcknowledgedAndroid) iap.finishTransaction({ purchase: owned, isConsumable: false }).catch(() => {});
      if (restoring.current) setStatus('restored');
    } else if (restoring.current) {
      setStatus('nothing');
    }
    // تبرعات لم تكتمل معالجتها سابقاً
    iap.availablePurchases
      .filter((p) => (SUPPORT_SKUS as readonly string[]).includes(p.productId) && p.purchaseState === 'purchased')
      .forEach((p) => iap.finishTransaction({ purchase: p, isConsumable: true }).catch(() => {}));
    restoring.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [iap.availablePurchases]);

  const productMap = useMemo(() => {
    const m = new Map<string, Product>();
    iap.products.forEach((p) => m.set(p.id, p));
    return m;
  }, [iap.products]);

  const buy = useCallback(
    async (sku: string) => {
      if (!iap.connected || !productMap.has(sku)) {
        setStatus('unavailable');
        return;
      }
      setStatus('busy');
      try {
        await iap.requestPurchase({ request: { apple: { sku }, google: { skus: [sku] } }, type: 'in-app' });
      } catch {
        setStatus('error');
      }
    },
    [iap, productMap]
  );

  const value = useMemo<Ctx>(
    () => ({
      ready: iap.connected && productMap.size > 0,
      plus: state.plus,
      price: (sku) => productMap.get(sku)?.displayPrice ?? null,
      buyPlus: () => buy(PLUS_SKU),
      support: (sku) => buy(sku),
      restore: () => {
        if (!iap.connected) return setStatus('unavailable');
        restoring.current = true;
        setStatus('busy');
        iap.restorePurchases().catch(() => setStatus('error'));
      },
      status,
      clearStatus: () => setStatus('idle'),
    }),
    [iap, productMap, state.plus, buy, status]
  );

  return <PurchasesContext.Provider value={value}>{children}</PurchasesContext.Provider>;
}

export function usePurchases(): Ctx {
  const ctx = useContext(PurchasesContext);
  if (!ctx) throw new Error('usePurchases must be used inside PurchasesProvider');
  return ctx;
}
