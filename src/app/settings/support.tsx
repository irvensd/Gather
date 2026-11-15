import { useEffect, useState, type ComponentType } from 'react';

import { SupportOffers } from '@/features/support/SupportOffers';
import { DEFAULT_SUPPORT_GIFT, giveLabel, supportGift, type SupportGiftId } from '@/lib/support';
import { hasSupportStore } from '@/lib/supportStore';

const UNAVAILABLE = 'Gifts are collected by the App Store or Play Store. This copy of Gather cannot reach the store, so a gift cannot be taken here.';

export default function SupportScreen() {
  if (!hasSupportStore()) return <PreviewSupport />;
  return <StoreSupport />;
}

function PreviewSupport() {
  const [selectedId, setSelectedId] = useState<SupportGiftId>(DEFAULT_SUPPORT_GIFT);
  const [notice, setNotice] = useState<{ tone: 'danger' | 'text'; text: string } | null>(null);
  const gift = supportGift(selectedId) ?? supportGift(DEFAULT_SUPPORT_GIFT)!;
  return (
    <SupportOffers
      action={{
        label: giveLabel(gift),
        onPress: () => setNotice({ tone: 'text', text: UNAVAILABLE }),
      }}
      notice={notice}
      onSelect={(id) => {
        setSelectedId(id);
        setNotice(null);
      }}
      selectedId={selectedId}
    />
  );
}

function StoreSupport() {
  const [Checkout, setCheckout] = useState<ComponentType | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let live = true;
    void import('@/features/support/SupportCheckout')
      .then((mod) => {
        if (live) setCheckout(() => mod.SupportCheckout);
      })
      .catch(() => {
        if (live) setFailed(true);
      });
    return () => {
      live = false;
    };
  }, []);
  if (failed) return <PreviewSupport />;
  if (!Checkout) return <PreviewSupport />;
  return <Checkout />;
}
