import { fireEvent, render } from '@testing-library/react-native';
import type { ReactElement } from 'react';

import { NotificationRow } from '@/components/activity/NotificationRow';
import { CommunityCard } from '@/components/community/CommunityCard';
import { PostCard } from '@/components/feed/PostCard';
import { SegmentedFilter } from '@/components/ui/SegmentedFilter';
import { GatherThemeProvider } from '@/theme/ThemeProvider';
import type { AppNotification, Community, PostCard as PostCardModel } from '@/types';

async function wrap(ui: ReactElement) {
  return render(<GatherThemeProvider>{ui}</GatherThemeProvider>);
}

const post: PostCardModel = {
  id: 'post-1',
  communityId: 'a1000000-0000-4000-8000-000000000002',
  communitySlug: 'adventist-life',
  communityName: 'AdventistLife',
  communityIcon: 'sunny-outline',
  authorId: 'user-1',
  authorUsername: 'mira_lane',
  authorDisplayName: 'Mira Lane',
  authorAvatarPath: null,
  type: 'discussion',
  title: 'The potluck table is a culture of its own',
  body: 'Someone brought a dish that was mostly haystacks and optimism. I am asking when a church meal starts to feel like the actual point of staying.',
  scriptureReferences: [],
  imageUri: null,
  status: 'published',
  isLocked: false,
  score: 3,
  commentCount: 2,
  userVote: 0,
  saved: false,
  createdAt: '2026-10-31T08:00:00Z',
  updatedAt: '2026-10-31T08:00:00Z',
};

const community: Community = {
  id: 'c1',
  slug: 'young-adults',
  name: 'YoungAdults',
  description: 'Friendships, faith, careers, transitions, and young adult life.',
  icon: 'compass-outline',
  rules: '',
  memberCount: 12,
  joined: false,
  isActive: true,
};

const notification: AppNotification = {
  id: 'n1',
  type: 'post_reply',
  actorId: 'user-2',
  actorUsername: 'jonah_okonkwo',
  actorDisplayName: 'Jonah Okonkwo',
  actorAvatarPath: null,
  postId: 'post-1',
  postType: 'question',
  postTitle: 'Why does God allow suffering?',
  postExcerpt: 'I keep coming back to John 11:35.',
  commentExcerpt: 'The weeping matters to me.',
  commentId: 'comment-1',
  isRead: false,
  createdAt: '2026-10-31T08:00:00Z',
};

describe('PostCard', () => {
  it('shows the community, author, type, and a truncated preview', async () => {
    const view = await wrap(
      <PostCard
        onAuthor={jest.fn()}
        onCommunity={jest.fn()}
        onMenu={jest.fn()}
        onPress={jest.fn()}
        onReference={jest.fn()}
        onSave={jest.fn()}
        onVote={jest.fn()}
        post={post}
      />,
    );
    expect(view.getByText('c/AdventistLife')).toBeTruthy();
    expect(view.getByText('@mira_lane')).toBeTruthy();
    expect(view.getByText('Discussion')).toBeTruthy();
    expect(view.getByText('The potluck table is a culture of its own')).toBeTruthy();
    expect(view.getByText(/haystacks and optimism/)).toBeTruthy();
  });

  it('opens the community from the post header', async () => {
    const onCommunity = jest.fn();
    const view = await wrap(
      <PostCard
        onAuthor={jest.fn()}
        onCommunity={onCommunity}
        onMenu={jest.fn()}
        onPress={jest.fn()}
        onReference={jest.fn()}
        onSave={jest.fn()}
        onVote={jest.fn()}
        post={post}
      />,
    );
    fireEvent.press(view.getAllByLabelText('c/AdventistLife')[0]);
    expect(onCommunity).toHaveBeenCalled();
  });
});

describe('CommunityCard', () => {
  it('shows a join action and the community description', async () => {
    const onJoin = jest.fn();
    const view = await wrap(<CommunityCard community={community} joining={false} onJoin={onJoin} onOpen={jest.fn()} />);
    expect(view.getByText('YoungAdults')).toBeTruthy();
    expect(view.getByText(/Friendships, faith/)).toBeTruthy();
    fireEvent.press(view.getByLabelText('Join YoungAdults'));
    expect(onJoin).toHaveBeenCalled();
  });
});

describe('NotificationRow', () => {
  it('shows the actor, action, and related post', async () => {
    const onPress = jest.fn();
    const view = await wrap(<NotificationRow item={notification} onPress={onPress} />);
    expect(view.getByText('@jonah_okonkwo replied to your question.')).toBeTruthy();
    expect(view.getByText('Why does God allow suffering?')).toBeTruthy();
    expect(view.getByText(/weeping matters/)).toBeTruthy();
    fireEvent.press(view.getByTestId('notification-row'));
    expect(onPress).toHaveBeenCalled();
  });
});

describe('feed filters', () => {
  it('keeps Popular, New, and Following selectable', async () => {
    const onChange = jest.fn();
    const view = await wrap(
      <SegmentedFilter
        onChange={onChange}
        options={[
          { value: 'popular', label: 'Popular' },
          { value: 'new', label: 'New' },
          { value: 'following', label: 'Following' },
        ]}
        value="popular"
      />,
    );
    expect(view.getByText('Popular')).toBeTruthy();
    fireEvent.press(view.getByText('New'));
    expect(onChange).toHaveBeenCalledWith('new');
    fireEvent.press(view.getByText('Following'));
    expect(onChange).toHaveBeenCalledWith('following');
  });
});
