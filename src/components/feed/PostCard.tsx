import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, Text, View } from 'react-native';

import { PrayedButton } from '@/components/feed/PrayedButton';
import { ScriptureReferenceList } from '@/components/scripture/ScriptureReference';
import { IconButton } from '@/components/ui/IconButton';
import { SaveButton } from '@/components/ui/SaveButton';
import { VoteControl } from '@/components/ui/VoteControl';
import { readableCommunityName } from '@/constants/communities';
import { postByline, postTypeLabel } from '@/constants/postTypes';
import { useAuth } from '@/features/auth/AuthProvider';
import { bodyPreview } from '@/lib/domain/feed';
import { formatFriendlyTime } from '@/lib/time';
import { useTheme } from '@/theme/ThemeProvider';
import type { PostCard as PostCardModel, ScriptureReference } from '@/types';

function repliesLabel(count: number) {
  if (count === 0) return 'No replies yet';
  if (count === 1) return '1 reply';
  return `${count} replies`;
}

export function PostCard({
  post,
  onPress,
  onAuthor,
  onCommunity,
  onVote,
  onPray,
  onMenu,
  onSave,
  onReference,
  showAuthor = true,
}: {
  post: PostCardModel;
  /** Off on a person's own profile, where every post is theirs. */
  showAuthor?: boolean;
  onPress: () => void;
  onAuthor: () => void;
  onCommunity: () => void;
  onVote: (value: -1 | 1) => void;
  onPray: () => void;
  onMenu: () => void;
  onSave: () => void;
  onReference: (reference: ScriptureReference) => void;
}) {
  const theme = useTheme();
  const { session } = useAuth();
  const isOwn = !!session && post.authorId === session.userId;
  const author = post.authorDisplayName || post.authorUsername || 'Deleted user';
  const community = readableCommunityName(post.communityName);
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      testID="post-card"
      style={({ pressed }) => ({
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
        backgroundColor: pressed ? theme.colors.highlight : 'transparent',
        gap: theme.spacing.sm,
      })}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Pressable accessibilityLabel={community} hitSlop={6} onPress={onCommunity} style={{ flexShrink: 0, maxWidth: '60%' }}>
            <Text numberOfLines={1} style={[theme.type.body, { color: theme.colors.primary, fontWeight: '600' }]}>
              {community}
            </Text>
          </Pressable>
          <Text style={[theme.type.body, { color: theme.colors.muted }]}>·</Text>
          {showAuthor ? (
            <Pressable hitSlop={6} onPress={onAuthor} style={{ flexShrink: 1 }}>
              <Text numberOfLines={1} style={[theme.type.body, { color: theme.colors.muted }]}>
                {postByline(post.type, author)}
              </Text>
            </Pressable>
          ) : (
            <Text numberOfLines={1} style={[theme.type.body, { color: theme.colors.muted, flexShrink: 1 }]}>
              {postTypeLabel(post.type)}
            </Text>
          )}
          <Text style={[theme.type.body, { color: theme.colors.muted }]}>·</Text>
          <Text numberOfLines={1} style={[theme.type.body, { color: theme.colors.muted, flexShrink: 0 }]}>
            {formatFriendlyTime(post.createdAt)}
          </Text>
        </View>
        <View style={{ marginVertical: -10, marginRight: -10 }}>
          <IconButton color={theme.colors.muted} label="More actions" name="ellipsis-horizontal" onPress={onMenu} />
        </View>
      </View>
      <Text style={[theme.type.postTitle, { color: theme.colors.text, fontSize: 20, lineHeight: 26, fontWeight: '700' }]}>{post.title}</Text>
      {post.body ? (
        <Text numberOfLines={2} style={[theme.type.body, { color: theme.colors.muted }]}>
          {bodyPreview(post.body, 140)}
        </Text>
      ) : null}
      {post.imageUri ? (
        <Image
          accessibilityLabel="Post photo"
          contentFit="cover"
          source={{ uri: post.imageUri }}
          style={{ width: '100%', height: 180, borderRadius: theme.radius.md, backgroundColor: theme.colors.highlight }}
        />
      ) : null}
      <ScriptureReferenceList limit={1} onPress={onReference} references={post.scriptureReferences} />
      {post.type === 'prayer_request' && post.status === 'published' ? (
        <PrayedButton count={post.prayedCount ?? 0} onPress={onPray} prayed={!!post.userPrayed} />
      ) : null}
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <VoteControl
          disabled={post.isLocked || post.status !== 'published'}
          downvotes={post.downvotes ?? 0}
          onVote={onVote}
          upvotes={post.upvotes ?? 0}
          value={post.userVote}
        />
        <Pressable
          accessibilityLabel={repliesLabel(post.commentCount)}
          accessibilityRole="button"
          onPress={onPress}
          style={{ minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: theme.spacing.xs }}
        >
          <Ionicons color={theme.colors.muted} name="chatbubble-outline" size={20} />
          <Text style={[theme.type.caption, { color: theme.colors.text, fontWeight: '600', fontVariant: ['tabular-nums'] }]}>{post.commentCount}</Text>
        </Pressable>
        {isOwn ? null : (
          <View style={{ marginLeft: 'auto' }}>
            <SaveButton onPress={onSave} saved={post.saved} />
          </View>
        )}
      </View>
    </Pressable>
  );
}
