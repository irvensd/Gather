import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { CommunityCard } from '@/components/community/CommunityCard';
import { FeedList } from '@/features/feed/FeedList';
import { AppHeader } from '@/components/ui/AppHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { SearchField } from '@/components/ui/SearchField';
import { useAuth } from '@/features/auth/AuthProvider';
import { getApi } from '@/lib/backend';
import { suggestedCommunities } from '@/lib/domain/explore';
import { usePending } from '@/store/pending';
import { useTheme } from '@/theme/ThemeProvider';
import type { Community } from '@/types';

export default function ExploreScreen() {
  const theme = useTheme();
  const { session } = useAuth();
  const client = useQueryClient();
  const communities = useQuery({ queryKey: ['communities'], queryFn: async () => (await getApi()).listCommunities() });
  const membership = useMutation({
    mutationFn: async ({ id, join }: { id: string; join: boolean }) => (await getApi()).setMembership(id, join),
    onSettled: async () => {
      await client.invalidateQueries({ queryKey: ['communities'] });
      await client.invalidateQueries({ queryKey: ['joined'] });
      await client.invalidateQueries({ queryKey: ['feed'] });
    },
  });

  function startCommunity() {
    if (!session) {
      usePending.getState().setPending('/new-community');
      router.push('/(auth)/sign-in');
      return;
    }
    router.push('/new-community');
  }

  function joinCommunity(community: Community) {
    if (community.joined) {
      router.push(`/community/${community.slug}`);
      return;
    }
    if (!session) {
      usePending.getState().setPending(`/community/${community.slug}`, { type: 'join', communityId: community.id, join: true });
      router.push('/(auth)/sign-in');
      return;
    }
    membership.mutate({ id: community.id, join: true });
  }

  const suggestions = suggestedCommunities(communities.data ?? []);

  return (
    <ScreenContainer>
      <AppHeader title="Explore" />
      <FeedList
        filter="new"
        header={
          <View style={{ gap: theme.spacing.lg, paddingBottom: theme.spacing.md }}>
            <View style={{ paddingHorizontal: theme.spacing.lg }}>
              <SearchField onPress={() => router.push('/search')} />
            </View>
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', paddingHorizontal: theme.spacing.lg, marginBottom: theme.spacing.sm }}>
                <Text style={[theme.type.section, { color: theme.colors.text }]}>Suggested communities</Text>
                <Pressable accessibilityRole="button" hitSlop={8} onPress={startCommunity} style={{ minHeight: 44, justifyContent: 'center' }}>
                  <Text style={[theme.type.caption, { color: theme.colors.primary, fontWeight: '600' }]}>Create community</Text>
                </Pressable>
              </View>
              {communities.isLoading ? <LoadingSkeleton /> : null}
              {communities.isError ? (
                <Text style={[theme.type.body, { color: theme.colors.secondary, paddingHorizontal: theme.spacing.lg }]}>
                  Communities could not be loaded.
                </Text>
              ) : null}
              {!communities.isLoading && !communities.isError && suggestions.length === 0 ? (
                <EmptyState message="When communities are available, they will show up here." title="No communities yet" />
              ) : null}
              {suggestions.length > 0 ? (
                <ScrollView
                  contentContainerStyle={{ paddingHorizontal: theme.spacing.lg, gap: theme.spacing.sm }}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                >
                  {suggestions.map((community) => (
                    <CommunityCard
                      community={community}
                      joining={membership.isPending}
                      key={community.id}
                      onJoin={() => joinCommunity(community)}
                      onOpen={() => router.push(`/community/${community.slug}`)}
                    />
                  ))}
                </ScrollView>
              ) : null}
            </View>
            <Text style={[theme.type.section, { color: theme.colors.text, paddingHorizontal: theme.spacing.lg }]}>Recent conversations</Text>
          </View>
        }
      />
    </ScreenContainer>
  );
}
