import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, Text, View } from 'react-native';

import { ScriptureReferenceList } from '@/components/scripture/ScriptureReference';
import { IconButton } from '@/components/ui/IconButton';
import { VoteControl } from '@/components/ui/VoteControl';
import { communityLabel } from '@/constants/communities';
import { postTypeLabel } from '@/constants/postTypes';
import { bodyPreview } from '@/lib/domain/feed';
import { formatRelativeTime } from '@/lib/time';
import { useTheme } from '@/theme/ThemeProvider';
import type { PostCard as PostCardModel, ScriptureReference } from '@/types';

export function PostCard({
  post,
  onPress,
  onAuthor,
  onCommunity,
  onVote,
  onSave,
  onMenu,
  onReference,
}: {
  post: PostCardModel;
  onPress: () => void;
  onAuthor: () => void;
  onCommunity: () => void;
  onVote: (value: -1 | 1) => void;
  onSave: () => void;
  onMenu: () => void;
  onReference: (reference: ScriptureReference) => void;
}) {
  const theme = useTheme();
  const author = post.authorUsername ? `@${post.authorUsername}` : 'Deleted user';
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      testID="post-card"
      style={{ paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.md, borderBottomWidth: 1, borderBottomColor: theme.colors.border, gap: theme.spacing.sm }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Text style={[theme.type.caption, { color: theme.colors.primary, fontWeight: '600' }]}>{postTypeLabel(post.type)}</Text>
        <Text style={[theme.type.caption, { color: theme.colors.secondary }]}>·</Text>
        <Pressable accessibilityLabel={communityLabel(post.communityName)} hitSlop={6} onPress={onCommunity} style={{ flexShrink: 1 }}>
          <Text numberOfLines={1} style={[theme.type.caption, { color: theme.colors.text, fontWeight: '600' }]}>{communityLabel(post.communityName)}</Text>
        </Pressable>
        <Text style={[theme.type.caption, { color: theme.colors.secondary }]}>·</Text>
        <Pressable hitSlop={6} onPress={onAuthor} style={{ flexShrink: 1 }}>
          <Text numberOfLines={1} style={[theme.type.caption, { color: theme.colors.secondary }]}>{author}</Text>
        </Pressable>
        <Text style={[theme.type.caption, { color: theme.colors.secondary, marginLeft: 'auto' }]}>{formatRelativeTime(post.createdAt)}</Text>
      </View>
      <Text style={[theme.type.postTitle, { color: theme.colors.text }]}>{post.title}</Text>
      {post.body ? (
        <Text numberOfLines={2} style={[theme.type.body, { color: theme.colors.secondary }]}>
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
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.lg }}>
        <VoteControl disabled={post.isLocked || post.status !== 'published'} onVote={onVote} score={post.score} value={post.userVote} />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Ionicons color={theme.colors.secondary} name="chatbubble-outline" size={16} />
          <Text style={[theme.type.caption, { color: theme.colors.secondary }]}>{post.commentCount}</Text>
        </View>
        <View style={{ marginLeft: 'auto', flexDirection: 'row' }}>
          <IconButton color={post.saved ? theme.colors.primary : theme.colors.secondary} label={post.saved ? 'Unsave' : 'Save'} name={post.saved ? 'bookmark' : 'bookmark-outline'} onPress={onSave} />
          <IconButton color={theme.colors.secondary} label="More actions" name="ellipsis-horizontal" onPress={onMenu} />
        </View>
      </View>
    </Pressable>
  );
}
