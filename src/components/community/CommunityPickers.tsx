import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import { CommunityAvatar } from '@/components/community/CommunityAvatar';
import { COMMUNITY_COLORS, communityColorTone, type CommunityColorId } from '@/constants/communityColors';
import { COMMUNITY_TOPICS, type CommunityTopic } from '@/constants/communityTopics';
import { COMMUNITY_ICON_LABELS, COMMUNITY_ICONS, type CommunityIcon } from '@/lib/domain/community';
import { useTheme } from '@/theme/ThemeProvider';

export const DEFAULT_RULES = 'Be respectful. Disagree with ideas, not people. Do not share someone else’s private information.';

export const PICKABLE_TOPICS = COMMUNITY_TOPICS.filter((topic) => topic.id !== 'more');

export function CommunityLookPicker({
  name,
  icon,
  color,
  onIcon,
  onColor,
}: {
  name: string;
  icon: CommunityIcon;
  color: CommunityColorId;
  onIcon: (icon: CommunityIcon) => void;
  onColor: (color: CommunityColorId) => void;
}) {
  const theme = useTheme();
  const tone = communityColorTone(color, theme.scheme);
  return (
    <View style={{ gap: theme.spacing.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md }}>
        <CommunityAvatar color={color} icon={icon} size={56} />
        <View style={{ flex: 1 }}>
          <Text numberOfLines={1} style={[theme.type.body, { color: theme.colors.text, fontWeight: '600' }]}>
            {name}
          </Text>
          <Text style={[theme.type.body, { color: theme.colors.muted }]}>
            {COMMUNITY_ICON_LABELS[icon]}, {COMMUNITY_COLORS.find((item) => item.id === color)?.label.toLowerCase()}
          </Text>
        </View>
      </View>
      <View accessibilityLabel="Color" accessibilityRole="radiogroup" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
        {COMMUNITY_COLORS.map((item) => {
          const selected = item.id === color;
          const swatch = item[theme.scheme];
          return (
            <Pressable
              key={item.id}
              accessibilityLabel={item.label}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              hitSlop={4}
              onPress={() => onColor(item.id)}
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: swatch.foreground,
                borderWidth: 3,
                borderColor: selected ? theme.colors.text : 'transparent',
              }}
            >
              {selected ? <Ionicons color={swatch.background} name="checkmark" size={22} /> : null}
            </Pressable>
          );
        })}
      </View>
      <View accessibilityLabel="Icon" accessibilityRole="radiogroup" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
        {COMMUNITY_ICONS.map((item) => {
          const selected = item === icon;
          return (
            <Pressable
              key={item}
              accessibilityLabel={COMMUNITY_ICON_LABELS[item]}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              onPress={() => onIcon(item)}
              style={{
                width: 52,
                height: 52,
                borderRadius: 26,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: selected ? tone.foreground : tone.background,
              }}
            >
              <Ionicons color={selected ? tone.background : tone.foreground} name={item} size={24} />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function TopicPicker({ value, onChange }: { value: CommunityTopic | null; onChange: (topic: CommunityTopic) => void }) {
  const theme = useTheme();
  return (
    <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
      {PICKABLE_TOPICS.map((item) => {
        const selected = item.id === value;
        return (
          <Pressable
            key={item.id}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            onPress={() => onChange(item.id)}
            style={{
              minHeight: 44,
              paddingHorizontal: 16,
              borderRadius: theme.radius.pill,
              justifyContent: 'center',
              backgroundColor: selected ? theme.colors.primary : theme.colors.surface,
              borderWidth: 1,
              borderColor: selected ? theme.colors.primary : theme.colors.border,
            }}
          >
            <Text style={[theme.type.body, { color: selected ? theme.colors.onPrimary : theme.colors.text, fontWeight: '600' }]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
