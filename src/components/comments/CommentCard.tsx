import { Pressable, Text, View } from 'react-native';

import { RichText } from '@/components/scripture/RichText';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { VoteControl } from '@/components/ui/VoteControl';
import { formatRelativeTime } from '@/lib/time';
import { useTheme } from '@/theme/ThemeProvider';
import type { Comment, ScriptureReference } from '@/types';

export function CommentCard({
  comment,
  depth,
  hiddenReplyCount,
  onVote,
  onReply,
  onAuthor,
  onMenu,
  onReference,
  onViewReplies,
  replyingTo,
}: {
  comment: Comment;
  depth: number;
  hiddenReplyCount: number;
  onVote: (value: -1 | 1) => void;
  onReply?: () => void;
  onAuthor: () => void;
  onMenu: () => void;
  onReference: (reference: ScriptureReference) => void;
  onViewReplies?: () => void;
  replyingTo?: string | null;
}) {
  const theme = useTheme();
  const withheld = comment.status !== 'published' || comment.concealed || !comment.body;
  const label = comment.concealed ? 'This comment is hidden.' : comment.status === 'deleted' ? 'Deleted comment' : 'Removed comment';
  return (
    <View
      style={{
        marginLeft: Math.min(depth, 2) * 16,
        borderLeftWidth: depth > 0 ? 1 : 0,
        borderLeftColor: theme.colors.border,
        paddingLeft: depth > 0 ? 12 : 0,
        paddingVertical: 10,
        gap: 6,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <UserAvatar name={comment.authorUsername} path={comment.authorAvatarPath} size={28} />
        <Pressable onPress={onAuthor}>
          <Text style={[theme.type.caption, { color: theme.colors.text, fontWeight: '600' }]}>
            {comment.authorUsername ? `@${comment.authorUsername}` : 'Deleted user'}
          </Text>
        </Pressable>
        <Text style={[theme.type.caption, { color: theme.colors.secondary }]}>{formatRelativeTime(comment.createdAt)}</Text>
      </View>
      {replyingTo ? <Text style={[theme.type.caption, { color: theme.colors.secondary }]}>Replying to @{replyingTo}</Text> : null}
      {withheld ? (
        <Text style={[theme.type.body, { color: theme.colors.secondary }]}>{label}</Text>
      ) : (
        <RichText onReference={onReference} text={comment.body} />
      )}
      {!withheld ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <VoteControl downvotes={comment.downvotes ?? 0} onVote={onVote} upvotes={comment.upvotes ?? 0} value={comment.userVote} />
          {onReply ? (
            <Pressable accessibilityRole="button" onPress={onReply}>
              <Text style={[theme.type.caption, { color: theme.colors.primary, fontWeight: '600' }]}>Reply</Text>
            </Pressable>
          ) : null}
          <Pressable accessibilityLabel="Comment actions" onPress={onMenu}>
            <Text style={[theme.type.caption, { color: theme.colors.secondary }]}>More</Text>
          </Pressable>
        </View>
      ) : null}
      {hiddenReplyCount > 0 && onViewReplies ? (
        <Pressable onPress={onViewReplies}>
          <Text style={[theme.type.caption, { color: theme.colors.primary, fontWeight: '600' }]}>View replies ({hiddenReplyCount})</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
