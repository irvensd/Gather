import * as Haptics from 'expo-haptics';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { DEFAULT_SUPPORT_GIFT, SUPPORT_GIFTS, type SupportGiftId } from '@/lib/support';
import { useTheme } from '@/theme/ThemeProvider';

export function SupportOffers({
  selectedId = DEFAULT_SUPPORT_GIFT,
  onSelect,
  prices,
  action,
  notice,
  onManage,
}: {
  selectedId?: SupportGiftId;
  onSelect?: (id: SupportGiftId) => void;
  prices?: Partial<Record<SupportGiftId, string>>;
  action?: { label: string; onPress: () => void; disabled?: boolean; loading?: boolean };
  notice?: { tone: 'danger' | 'text'; text: string } | null;
  onManage?: () => void;
}) {
  const theme = useTheme();
  return (
    <ScreenContainer>
      <ScreenHeader title="Support Gather" />
      <ScrollView contentContainerStyle={{ padding: theme.spacing.xl, gap: theme.spacing.lg, paddingBottom: theme.spacing.xxxl }}>
        <Text style={[theme.type.body, { color: theme.colors.text }]}>
          Reading, posting, and the communities stay free. A gift helps pay to keep Gather online. Your phone’s app store collects it, and nothing in Gather
          changes after you give.
        </Text>
        <View accessibilityRole="radiogroup" style={{ gap: theme.spacing.sm }}>
          {SUPPORT_GIFTS.map((gift) => {
            const selected = gift.id === selectedId;
            const price = prices?.[gift.id] ?? gift.fallbackPrice;
            return (
              <Pressable
                key={gift.id}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                accessibilityLabel={`${price}, ${gift.cadence}`}
                onPress={() => {
                  void Haptics.selectionAsync().catch(() => undefined);
                  onSelect?.(gift.id);
                }}
                style={({ pressed }) => ({
                  minHeight: 52,
                  borderRadius: theme.radius.md,
                  borderWidth: selected ? 2 : 1,
                  borderColor: selected ? theme.colors.primary : theme.colors.border,
                  backgroundColor: selected ? theme.colors.highlight : theme.colors.surface,
                  paddingHorizontal: theme.spacing.lg,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <Text style={[theme.type.section, { color: theme.colors.text }]}>{price}</Text>
                <Text style={[theme.type.body, { color: theme.colors.muted }]}>{gift.cadence}</Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={[theme.type.body, { color: theme.colors.muted }]}>
          A monthly gift renews until you cancel it in your App Store or Play Store subscriptions.
        </Text>
        {notice ? <Text style={[theme.type.body, { color: notice.tone === 'danger' ? theme.colors.danger : theme.colors.text }]}>{notice.text}</Text> : null}
        {action ? <PrimaryButton disabled={action.disabled} label={action.label} loading={action.loading} onPress={action.onPress} /> : null}
        {onManage ? (
          <Pressable accessibilityRole="button" onPress={onManage} style={{ minHeight: 44, justifyContent: 'center' }}>
            <Text style={[theme.type.body, { color: theme.colors.primary, fontWeight: '600' }]}>Manage monthly gift</Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </ScreenContainer>
  );
}
