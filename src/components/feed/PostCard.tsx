import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, Text, View } from 'react-native';

import { CommunityAvatar } from '@/components/community/CommunityAvatar';
import { ScriptureReferenceList } from '@/components/scripture/ScriptureReference';
import { IconButton } from '@/components/ui/IconButton';
import { VoteControl } from '@/components/ui/VoteControl';
import { communityLabel } from '@/constants/communities';
import { postTypeLabel } from '@/constants/postTypes';
import { bodyPreview } from '@/lib/domain/feed';
import { formatRelativeTime } from '@/lib/time';
import { layout } from '@/theme/tokens';
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
  const preview = post.body ? bodyPreview(post.body, 180) : '';
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      testID="post-card"
      style={{
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
        gap: theme.spacing.sm,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: theme.spacing.sm }}>
        <Pressable accessibilityLabel={communityLabel(post.communityName)} hitSlop={6} onPress={onCommunity}>
          <CommunityAvatar icon={post.communityIcon} size={32} />
        </Pressable>
        <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Pressable accessibilityLabel={communityLabel(post.communityName)} hitSlop={6} onPress={onCommunity} style={{ flexShrink: 1 }}>
              <Text numberOfLines={1} style={[theme.type.section, { color: theme.colors.text }]}>
                {communityLabel(post.communityName)}
              </Text>
            </Pressable>
            <Text style={[theme.type.label, { color: theme.colors.secondary }]}>{postTypeLabel(post.type)}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Pressable hitSlop={6} onPress={onAuthor} style={{ flexShrink: 1 }}>
              <Text numberOfLines={1} style={[theme.type.caption, { color: theme.colors.secondary }]}>
                {author}
              </Text>
            </Pressable>
            <Text style={[theme.type.caption, { color: theme.colors.secondary }]}>·</Text>
            <Text style={[theme.type.caption, { color: theme.colors.secondary }]}>{formatRelativeTime(post.createdAt)}</Text>
          </View>
        </View>
      </View>
      <Text style={[theme.type.postTitle, { color: theme.colors.text, marginTop: 2 }]}>{post.title}</Text>
      {preview ? (
        <Text numberOfLines={layout.previewLines} style={[theme.type.body, { color: theme.colors.secondary }]}>
          {preview}
        </Text>
      ) : null}
      {post.imageUri ? (
        <Image
          accessibilityLabel="Post photo"
          contentFit="cover"
          source={{ uri: post.imageUri }}
          style={{ width: '100%', height: 168, borderRadius: theme.radius.md, backgroundColor: theme.colors.highlight }}
        />
      ) : null}
      <ScriptureReferenceList limit={layout.scriptureChipLimit} onPress={onReference} references={post.scriptureReferences} />
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          minHeight: theme.layout.touchTarget,
          marginTop: 2,
        }}
      >
        <VoteControl disabled={post.isLocked || post.status !== 'published'} onVote={onVote} score={post.score} value={post.userVote} />
        <View style={{ width: theme.spacing.lg }} />
        <View style={{ flexDirection: 'row', alignItems: 'center', minWidth: 48, gap: 4 }}>
          <Ionicons color={theme.colors.secondary} name="chatbubble-outline" size={16} />
          <Text style={[theme.type.caption, { color: theme.colors.secondary }]}>{post.commentCount}</Text>
        </View>
        <View style={{ marginLeft: 'auto', flexDirection: 'row', alignItems: 'center' }}>
          <IconButton color={post.saved ? theme.colors.primary : theme.colors.secondary} label={post.saved ? 'Unsave' : 'Save'} name={post.saved ? 'bookmark' : 'bookmark-outline'} onPress={onSave} />
          <IconButton color={theme.colors.secondary} label="More actions" name="ellipsis-horizontal" onPress={onMenu} />
        </View>
      </View>
    </Pressable>
  );
}
