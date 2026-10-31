import { Pressable, Text, View } from 'react-native';

import { UserAvatar } from '@/components/ui/UserAvatar';
import { formatNotification, notificationContext } from '@/lib/domain/notifications';
import { bodyPreview } from '@/lib/domain/feed';
import { formatRelativeTime } from '@/lib/time';
import { useTheme } from '@/theme/ThemeProvider';
import type { AppNotification } from '@/types';

export function NotificationRow({
  item,
  onPress,
}: {
  item: AppNotification;
  onPress: () => void;
}) {
  const theme = useTheme();
  const actor = item.actorUsername ? `@${item.actorUsername}` : 'Someone';
  const action = formatNotification({ type: item.type, actorUsername: item.actorUsername, postType: item.postType });
  const context = notificationContext(item);
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={{
        flexDirection: 'row',
        gap: theme.spacing.md,
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
        backgroundColor: item.isRead ? 'transparent' : theme.colors.highlight,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
      }}
      testID="notification-row"
    >
      <UserAvatar name={item.actorDisplayName ?? item.actorUsername} path={item.actorAvatarPath ?? null} size={40} />
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={[theme.type.body, { color: theme.colors.text, fontWeight: item.isRead ? '400' : '600' }]}>{action}</Text>
        {context.title ? (
          <Text numberOfLines={1} style={[theme.type.caption, { color: theme.colors.text, fontWeight: '600' }]}>
            {context.title}
          </Text>
        ) : null}
        {context.excerpt ? (
          <Text numberOfLines={2} style={[theme.type.caption, { color: theme.colors.secondary }]}>
            {bodyPreview(context.excerpt, 120)}
          </Text>
        ) : null}
        <Text style={[theme.type.caption, { color: theme.colors.secondary }]}>
          {actor} · {formatRelativeTime(item.createdAt)}
        </Text>
      </View>
    </Pressable>
  );
}
