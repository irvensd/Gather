import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { CommunityAvatar } from '@/components/community/CommunityAvatar';
import { FeedList } from '@/features/feed/FeedList';
import { IconButton } from '@/components/ui/IconButton';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { SegmentedFilter } from '@/components/ui/SegmentedFilter';
import { useAuth } from '@/features/auth/AuthProvider';
import { getApi } from '@/lib/backend';
import { usePending } from '@/store/pending';
import { useTheme } from '@/theme/ThemeProvider';
import type { Community, FeedFilter } from '@/types';

export default function CommunityScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const theme = useTheme();
  const { session } = useAuth();
  const [sort, setSort] = useState<FeedFilter>('new');
  const [rules, setRules] = useState(false);
  const client = useQueryClient();
  const community = useQuery({ queryKey: ['community', slug], queryFn: async () => (await getApi()).getCommunity(slug) });
  const membership = useMutation({
    mutationFn: async (join: boolean) => {
      const current = community.data;
      if (!current) return;
      await (await getApi()).setMembership(current.id, join);
    },
    onMutate: async (join) => {
      await client.cancelQueries({ queryKey: ['community', slug] });
      const previous = client.getQueryData<Community>(['community', slug]);
      if (previous) {
        client.setQueryData<Community>(['community', slug], {
          ...previous,
          joined: join,
          memberCount: Math.max(0, previous.memberCount + (join ? 1 : -1)),
        });
      }
      return { previous };
    },
    onError: (_error, _join, context) => {
      if (context?.previous) client.setQueryData(['community', slug], context.previous);
    },
    onSettled: async () => {
      await client.invalidateQueries({ queryKey: ['community', slug] });
      await client.invalidateQueries({ queryKey: ['communities'] });
      await client.invalidateQueries({ queryKey: ['joined'] });
      await client.invalidateQueries({ queryKey: ['feed'] });
    },
  });
  function goBack() {
    if (router.canGoBack()) router.back();
    else router.navigate('/explore');
  }
  if (!community.data) {
    return (
      <ScreenContainer>
        <IconButton label="Back" name="chevron-back" onPress={goBack} />
        {community.isLoading ? <LoadingSkeleton /> : null}
      </ScreenContainer>
    );
  }
  const item = community.data;

  return (
    <ScreenContainer>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingRight: theme.spacing.lg }}>
        <IconButton label="Back" name="chevron-back" onPress={goBack} />
        <CommunityAvatar icon={item.icon} size={28} />
        <Text numberOfLines={1} style={[theme.type.section, { color: theme.colors.text, flex: 1, marginLeft: 8 }]}>c/{item.name}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={item.joined ? 'Leave community' : 'Join community'}
          disabled={membership.isPending}
          onPress={() => {
            if (!session) {
              usePending.getState().setPending(`/community/${slug}`, { type: 'join', communityId: item.id, join: true });
              router.push('/(auth)/sign-in');
              return;
            }
            membership.mutate(!item.joined);
          }}
          style={{
            minHeight: 36,
            paddingHorizontal: 14,
            borderRadius: theme.radius.pill,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: item.joined ? 'transparent' : theme.colors.primary,
            borderWidth: item.joined ? 1 : 0,
            borderColor: theme.colors.border,
          }}
          testID="community-join"
        >
          <Text style={[theme.type.caption, { color: item.joined ? theme.colors.text : theme.colors.onPrimary, fontWeight: '600' }]}>
            {item.joined ? 'Leave' : 'Join'}
          </Text>
        </Pressable>
      </View>
      <FeedList
        communityId={item.id}
        filter={sort === 'following' ? 'new' : sort}
        header={
          <View style={{ paddingHorizontal: theme.spacing.lg, paddingBottom: theme.spacing.md, gap: theme.spacing.md }}>
            <Text style={[theme.type.body, { color: theme.colors.secondary }]}>{item.description}</Text>
            <Text style={[theme.type.caption, { color: theme.colors.secondary }]}>
              {item.memberCount} {item.memberCount === 1 ? 'member' : 'members'}
              {'  ·  '}
              <Text onPress={() => setRules((value) => !value)} style={{ color: theme.colors.primary, fontWeight: '600' }}>
                {rules ? 'Hide rules' : 'Rules'}
              </Text>
            </Text>
            {rules ? <Text style={[theme.type.body, { color: theme.colors.text }]}>{item.rules}</Text> : null}
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
              <SegmentedFilter onChange={(value) => setSort(value)} options={[{ value: 'new', label: 'New' }, { value: 'popular', label: 'Popular' }]} value={sort === 'following' ? 'new' : sort} />
              <Text onPress={() => router.push(`/compose?communityId=${item.id}`)} style={[theme.type.body, { color: theme.colors.primary, fontWeight: '600', paddingBottom: 8 }]}>Post</Text>
            </View>
          </View>
        }
      />
    </ScreenContainer>
  );
}
