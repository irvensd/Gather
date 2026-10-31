import { Pressable, Text, View } from 'react-native';

import { CommunityAvatar } from '@/components/community/CommunityAvatar';
import { useTheme } from '@/theme/ThemeProvider';
import type { Community } from '@/types';

export function CommunityCard({
  community,
  onOpen,
  onJoin,
  joining,
}: {
  community: Community;
  onOpen: () => void;
  onJoin: () => void;
  joining?: boolean;
}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onOpen}
      style={{
        width: 240,
        minHeight: 148,
        padding: theme.spacing.md,
        borderRadius: theme.radius.md,
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.border,
        gap: theme.spacing.sm,
      }}
      testID="community-card"
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
        <CommunityAvatar icon={community.icon} size={32} />
        <Text numberOfLines={1} style={[theme.type.section, { color: theme.colors.text, flex: 1 }]}>
          {community.name}
        </Text>
      </View>
      <Text numberOfLines={2} style={[theme.type.caption, { color: theme.colors.secondary, flexGrow: 1 }]}>
        {community.description}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={community.joined ? `Open ${community.name}` : `Join ${community.name}`}
        disabled={joining}
        onPress={(event) => {
          event.stopPropagation?.();
          onJoin();
        }}
        style={{
          alignSelf: 'flex-start',
          minHeight: 36,
          paddingHorizontal: 12,
          borderRadius: theme.radius.pill,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: community.joined ? 'transparent' : theme.colors.primary,
          borderWidth: community.joined ? 1 : 0,
          borderColor: theme.colors.border,
        }}
      >
        <Text style={[theme.type.label, { color: community.joined ? theme.colors.text : theme.colors.onPrimary }]}>
          {community.joined ? 'Joined' : 'Join'}
        </Text>
      </Pressable>
    </Pressable>
  );
}
