import { LIMITS } from '@/constants/limits';
import type { Comment, CommentSort } from '@/types';

export interface CommentNode {
  comment: Comment;
  replies: CommentNode[];
}

export interface FlatComment {
  comment: Comment;
  depth: number;
  hiddenReplyCount: number;
}

export function buildCommentForest(comments: readonly Comment[]): CommentNode[] {
  const nodes = new Map<string, CommentNode>();
  for (const comment of comments) nodes.set(comment.id, { comment, replies: [] });
  const roots: CommentNode[] = [];
  for (const comment of comments) {
    const node = nodes.get(comment.id);
    if (!node) continue;
    const parent = comment.parentCommentId ? nodes.get(comment.parentCommentId) : undefined;
    if (parent && parent.comment.postId === comment.postId) parent.replies.push(node);
    else roots.push(node);
  }
  return roots;
}

function compare(sort: CommentSort) {
  return (a: CommentNode, b: CommentNode) => {
    if (sort === 'helpful' && a.comment.score !== b.comment.score) return b.comment.score - a.comment.score;
    return b.comment.createdAt.localeCompare(a.comment.createdAt) || b.comment.id.localeCompare(a.comment.id);
  };
}

export function sortCommentForest(nodes: readonly CommentNode[], sort: CommentSort): CommentNode[] {
  return [...nodes].sort(compare(sort)).map((node) => ({
    comment: node.comment,
    replies: sortCommentForest(node.replies, sort),
  }));
}

function countDescendants(node: CommentNode): number {
  return node.replies.reduce((sum, reply) => sum + 1 + countDescendants(reply), 0);
}

export function flattenForDisplay(nodes: readonly CommentNode[], depth = 0): FlatComment[] {
  const rows: FlatComment[] = [];
  for (const node of nodes) {
    const hasReplies = node.replies.length > 0;
    if ((node.comment.status === 'deleted' || node.comment.status === 'removed') && !hasReplies) continue;
    rows.push({
      comment: node.comment,
      depth,
      hiddenReplyCount: depth >= LIMITS.inlineCommentDepth ? countDescendants(node) : 0,
    });
    if (depth < LIMITS.inlineCommentDepth) rows.push(...flattenForDisplay(node.replies, depth + 1));
  }
  return rows;
}

export function subtree(comments: readonly Comment[], rootId: string): Comment[] {
  const children = new Map<string, Comment[]>();
  for (const comment of comments) {
    if (!comment.parentCommentId) continue;
    const list = children.get(comment.parentCommentId) ?? [];
    list.push(comment);
    children.set(comment.parentCommentId, list);
  }
  const root = comments.find((comment) => comment.id === rootId);
  if (!root) return [];
  const collected: Comment[] = [];
  const walk = (comment: Comment, depth: number) => {
    collected.push({ ...comment, depth });
    for (const child of children.get(comment.id) ?? []) walk(child, depth + 1);
  };
  walk({ ...root, depth: 0 }, 0);
  return collected;
}

export function wouldExceedDepth(parentDepth: number | null): boolean {
  const next = parentDepth == null ? 0 : parentDepth + 1;
  return next > LIMITS.maxCommentDepth;
}
