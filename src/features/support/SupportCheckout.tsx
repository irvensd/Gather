import { deepLinkToSubscriptions, isUserCancelledError, useIAP, type Product, type ProductSubscription } from 'expo-iap';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

import { SupportOffers } from '@/features/support/SupportOffers';
import { DEFAULT_SUPPORT_GIFT, giveLabel, monthlyProductIds, onceProductIds, supportGift, type SupportGift, type SupportGiftId } from '@/lib/support';

const ANDROID_PACKAGE = 'com.gather.community';
const STORE_UNREACHABLE = 'The store could not be reached. Nothing was charged.';
const GIFT_FAILED = 'The store could not take the gift. Nothing was charged.';
const NOT_IN_STORE = 'This gift is not in the store yet. Nothing was charged.';
const THANK_YOU = 'Thank you. Gather stays free either way.';
const ALREADY_MONTHLY = 'You can change or cancel it in your App Store or Play Store subscriptions.';

export function SupportCheckout() {
  const [selectedId, setSelectedId] = useState<SupportGiftId>(DEFAULT_SUPPORT_GIFT);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [storeFailed, setStoreFailed] = useState(false);
  const [notice, setNotice] = useState<{ tone: 'danger' | 'text'; text: string } | null>(null);
  const { connected, products, subscriptions, activeSubscriptions, fetchProducts, requestPurchase, finishTransaction, getActiveSubscriptions } = useIAP({
    onPurchaseSuccess: (purchase) => {
      const gift = supportGift(purchase.productId);
      if (!gift) return;
      void finishTransaction({ purchase, isConsumable: gift.kind === 'once' })
        .catch(() => undefined)
        .finally(() => {
          setBusy(false);
          setNotice({ tone: 'text', text: THANK_YOU });
          if (gift.kind === 'month') void getActiveSubscriptions(monthlyProductIds());
        });
    },
    onPurchaseError: (error) => {
      setBusy(false);
      if (isUserCancelledError(error)) return;
      setNotice({ tone: 'danger', text: GIFT_FAILED });
    },
  });

  useEffect(() => {
    if (!connected) return;
    let live = true;
    void (async () => {
      try {
        await fetchProducts({ skus: onceProductIds(), type: 'in-app' });
        await fetchProducts({ skus: monthlyProductIds(), type: 'subs' });
        try {
          await getActiveSubscriptions(monthlyProductIds());
        } catch {
          // A missing subscription status still leaves the one-time gifts usable.
        }
        if (live) setLoaded(true);
      } catch {
        if (live) setStoreFailed(true);
      }
    })();
    return () => {
      live = false;
    };
  }, [connected, fetchProducts, getActiveSubscriptions]);

  const selected = supportGift(selectedId) ?? supportGift(DEFAULT_SUPPORT_GIFT)!;
  const product = findGift(selected, products, subscriptions);
  const price = product?.displayPrice || selected.fallbackPrice;
  const monthlyActive = activeSubscriptions.some((subscription) => subscription.productId === 'support_monthly' && subscription.isActive !== false);
  const alreadyMonthly = selected.kind === 'month' && monthlyActive;
  const missing = loaded && !product;
  const shownNotice = storeFailed
    ? { tone: 'danger' as const, text: STORE_UNREACHABLE }
    : notice
      ? notice
      : missing
        ? { tone: 'text' as const, text: NOT_IN_STORE }
        : alreadyMonthly
          ? { tone: 'text' as const, text: ALREADY_MONTHLY }
          : null;

  async function give() {
    if (storeFailed || (!loaded && !connected)) {
      setNotice({ tone: 'danger', text: STORE_UNREACHABLE });
      return;
    }
    if (!product) {
      setNotice({ tone: 'text', text: NOT_IN_STORE });
      return;
    }
    if (alreadyMonthly) return;
    setNotice(null);
    setBusy(true);
    try {
      if (selected.kind === 'once') {
        await requestPurchase({
          type: 'in-app',
          request: {
            apple: { sku: selected.id },
            google: { skus: [selected.id] },
          },
        });
        return;
      }
      const offerToken = product.subscriptionOffers?.find((offer) => offer.offerTokenAndroid)?.offerTokenAndroid;
      if (Platform.OS === 'android' && !offerToken) {
        setBusy(false);
        setNotice({ tone: 'danger', text: GIFT_FAILED });
        return;
      }
      await requestPurchase({
        type: 'subs',
        request: {
          apple: { sku: selected.id },
          google: {
            skus: [selected.id],
            subscriptionOffers: offerToken ? [{ sku: selected.id, offerToken }] : undefined,
          },
        },
      });
    } catch (error) {
      setBusy(false);
      if (!isUserCancelledError(error)) setNotice({ tone: 'danger', text: GIFT_FAILED });
    }
  }

  const checking = !loaded && !storeFailed;
  return (
    <SupportOffers
      action={{
        label: checking ? 'Checking the store…' : alreadyMonthly ? 'You already give each month' : giveLabel(selected, price),
        disabled: busy,
        loading: busy,
        onPress: () => void give(),
      }}
      notice={shownNotice}
      onManage={
        monthlyActive
          ? () => {
              void deepLinkToSubscriptions({ skuAndroid: 'support_monthly', packageNameAndroid: ANDROID_PACKAGE }).catch(() => undefined);
            }
          : undefined
      }
      onSelect={(id) => {
        setSelectedId(id);
        setNotice(null);
      }}
      prices={priceMap(products, subscriptions)}
      selectedId={selected.id}
    />
  );
}

function findGift(gift: SupportGift, products: Product[], subscriptions: ProductSubscription[]): (Product | ProductSubscription) | undefined {
  const list = gift.kind === 'once' ? products : subscriptions;
  return list.find((item) => item.id === gift.id);
}

function priceMap(products: Product[], subscriptions: ProductSubscription[]): Partial<Record<SupportGiftId, string>> {
  const prices: Partial<Record<SupportGiftId, string>> = {};
  for (const item of [...products, ...subscriptions]) {
    const gift = supportGift(item.id);
    if (gift && item.displayPrice) prices[gift.id] = item.displayPrice;
  }
  return prices;
}
