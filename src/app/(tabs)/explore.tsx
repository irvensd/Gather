import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { type ReactNode, useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, SectionList, Text, useWindowDimensions, View } from 'react-native';

import { CommunityAvatar } from '@/components/community/CommunityAvatar';
import { AppHeader } from '@/components/ui/AppHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { SearchField } from '@/components/ui/SearchField';
import { readableCommunityName } from '@/constants/communities';
import { COMMUNITY_TOPICS, type CommunityTopic } from '@/constants/communityTopics';
import { useAuth } from '@/features/auth/AuthProvider';
import { getApi } from '@/lib/backend';
import { browseCommunities, groupByTopic, memberLabel, membershipNotice, type TopicSection } from '@/lib/communityBrowse';
import { usePending } from '@/store/pending';
import { useToast } from '@/store/toast';
import { useTheme } from '@/theme/ThemeProvider';
import type { Community } from '@/types';

const SHELF_ROWS = 3;

type ExploreItem = { kind: 'row'; community: Community } | { kind: 'shelf'; columns: Community[][] };
type ExploreSection = {
  topic: CommunityTopic;
  title: string;
  count: number;
  data: ExploreItem[];
};

function toColumns(list: Community[]): Community[][] {
  const columns: Community[][] = [];
  for (let index = 0; index < list.length; index += SHELF_ROWS) columns.push(list.slice(index, index + SHELF_ROWS));
  return columns;
}

export default function ExploreScreen() {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const { session } = useAuth();
  const client = useQueryClient();
  const [query, setQuery] = useState('');
  const [topic, setTopic] = useState<CommunityTopic | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const communities = useQuery({
    queryKey: ['communities'],
    queryFn: async () => (await getApi()).listCommunities(),
  });
  const rooms = useMemo(() => browseCommunities(communities.data ?? [], query), [communities.data, query]);
  const searching = query.trim().length > 0;
  const browsingAll = !searching && !topic;
  const yours = browsingAll ? rooms.filter((community) => community.joined) : [];
  const sections: ExploreSection[] = useMemo(() => {
    const grouped: TopicSection[] = searching
      ? rooms.length > 0
        ? [{ topic: 'more', title: 'Matches', data: rooms }]
        : []
      : groupByTopic(topic ? rooms : rooms.filter((community) => !community.joined), topic);
    return grouped.map((section) => ({
      topic: section.topic,
      title: section.title,
      count: section.data.length,
      data: browsingAll ? [{ kind: 'shelf', columns: toColumns(section.data) }] : section.data.map((community) => ({ kind: 'row', community })),
    }));
  }, [rooms, searching, topic, browsingAll]);
  const topicsInUse = useMemo(() => new Set(groupByTopic(communities.data ?? []).map((section) => section.topic)), [communities.data]);

  const membership = useMutation({
    mutationFn: async (community: Community) => (await getApi()).setMembership(community.id, !community.joined),
    onMutate: async (community) => {
      await client.cancelQueries({ queryKey: ['communities'] });
      const previous = client.getQueryData<Community[]>(['communities']);
      client.setQueryData<Community[]>(['communities'], (list) =>
        list?.map((item) =>
          item.id === community.id
            ? {
                ...item,
                joined: !community.joined,
                memberCount: Math.max(0, item.memberCount + (community.joined ? -1 : 1)),
              }
            : item,
        ),
      );
      return { previous };
    },
    onSuccess: (_result, community) => {
      useToast.getState().show(membershipNotice(community.name, !community.joined));
    },
    onError: (_error, _community, context) => {
      if (context?.previous) client.setQueryData(['communities'], context.previous);
    },
    onSettled: async () => {
      await client.invalidateQueries({ queryKey: ['communities'] });
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
    if (!session) {
      usePending.getState().setPending('/explore', {
        type: 'join',
        communityId: community.id,
        join: true,
      });
      router.push('/(auth)/sign-in');
      return;
    }
    membership.mutate(community);
  }

  const chip = (label: string, selected: boolean, onPress: () => void, key: string) => (
    <Pressable
      key={key}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={{
        minHeight: 44,
        paddingHorizontal: 16,
        borderRadius: theme.radius.pill,
        justifyContent: 'center',
        backgroundColor: selected ? theme.colors.primary : theme.colors.surface,
        borderWidth: 1,
        borderColor: selected ? theme.colors.primary : theme.colors.border,
      }}
    >
      <Text
        style={[
          theme.type.body,
          {
            color: selected ? theme.colors.onPrimary : theme.colors.text,
            fontWeight: '600',
          },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );

  const renderCommunity = (community: Community) => (
    <View
      key={community.id}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingRight: theme.spacing.lg,
        minHeight: 72,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
      }}
    >
      <Pressable
        accessibilityHint="Opens the community"
        accessibilityLabel={`${readableCommunityName(community.name)}. ${community.description}`}
        accessibilityRole="button"
        onPress={() => router.push(`/community/${community.slug}`)}
        style={({ pressed }) => ({
          flex: 1,
          minHeight: 72,
          flexDirection: 'row',
          alignItems: 'center',
          gap: theme.spacing.md,
          paddingHorizontal: theme.spacing.lg,
          paddingVertical: theme.spacing.md,
          backgroundColor: pressed ? theme.colors.highlight : 'transparent',
        })}
      >
        <CommunityAvatar icon={community.icon} color={community.color} size={40} />
        <View style={{ flex: 1, gap: 2 }}>
          <Text numberOfLines={1} style={[theme.type.body, { color: theme.colors.text, fontWeight: '600' }]}>
            {readableCommunityName(community.name)}
          </Text>
          <Text numberOfLines={1} style={[theme.type.body, { color: theme.colors.muted }]}>
            {community.description}
          </Text>
          <Text numberOfLines={1} style={[theme.type.caption, { color: theme.colors.muted }]}>
            {memberLabel(community.memberCount)}
          </Text>
        </View>
      </Pressable>
      {!session ? null : community.joined ? (
        <Text
          style={[
            theme.type.body,
            {
              color: theme.colors.primary,
              fontWeight: '600',
              minWidth: 64,
              textAlign: 'center',
            },
          ]}
        >
          Joined
        </Text>
      ) : (
        <Pressable
          accessibilityLabel={`Join ${readableCommunityName(community.name)}`}
          accessibilityRole="button"
          onPress={() => joinCommunity(community)}
          style={({ pressed }) => ({
            minHeight: 44,
            minWidth: 64,
            paddingHorizontal: 16,
            borderRadius: theme.radius.pill,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: theme.colors.primary,
            opacity: pressed ? 0.72 : 1,
          })}
        >
          <Text style={[theme.type.body, { color: theme.colors.onPrimary, fontWeight: '600' }]}>Join</Text>
        </Pressable>
      )}
    </View>
  );

  return (
    <ScreenContainer>
      <AppHeader
        right={
          session ? (
            <Pressable
              accessibilityRole="button"
              onPress={startCommunity}
              style={{
                minHeight: 44,
                justifyContent: 'center',
                paddingHorizontal: 4,
              }}
            >
              <Text style={[theme.type.body, { color: theme.colors.primary, fontWeight: '600' }]}>New</Text>
            </Pressable>
          ) : undefined
        }
        title="Explore"
      />
      {communities.isLoading ? <LoadingSkeleton /> : null}
      {communities.isError && !communities.data ? (
        <EmptyState
          actionLabel="Try again"
          icon="cloud-offline-outline"
          message="The list did not load."
          onAction={() => void communities.refetch()}
          title="Communities could not be loaded"
        />
      ) : null}
      {communities.data ? (
        <SectionList
          ListEmptyComponent={
            searching ? (
              <EmptyState
                actionLabel={session ? 'New community' : undefined}
                icon="search-outline"
                message={session ? 'Try another word, or start a community of your own.' : 'Try another word.'}
                onAction={session ? startCommunity : undefined}
                title="No communities match"
              />
            ) : rooms.length === 0 ? (
              <EmptyState icon="people-outline" message="Communities that people start will show up here." title="No communities yet" />
            ) : browsingAll ? (
              <EmptyState
                actionLabel={session ? 'New community' : undefined}
                icon="checkmark-circle-outline"
                message={session ? 'You have joined every community. Start a new one.' : 'You can read every community here.'}
                onAction={session ? startCommunity : undefined}
                title="You’re in all of them"
              />
            ) : undefined
          }
          ListHeaderComponent={
            <View style={{ paddingBottom: theme.spacing.sm, gap: theme.spacing.md }}>
              <View style={{ paddingHorizontal: theme.spacing.lg }}>
                <SearchField onChangeText={setQuery} placeholder="Find a community" value={query} />
              </View>
              {!searching ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{
                    paddingHorizontal: theme.spacing.lg,
                    gap: theme.spacing.sm,
                  }}
                >
                  {chip('All', !topic, () => setTopic(null), 'all')}
                  {COMMUNITY_TOPICS.filter((item) => topicsInUse.has(item.id)).map((item) =>
                    chip(item.label, topic === item.id, () => setTopic(topic === item.id ? null : item.id), item.id),
                  )}
                </ScrollView>
              ) : null}
              {yours.length > 0 ? (
                <View style={{ gap: theme.spacing.sm }}>
                  <Text
                    style={[
                      theme.type.section,
                      {
                        color: theme.colors.text,
                        paddingHorizontal: theme.spacing.lg,
                      },
                    ]}
                  >
                    Your communities
                  </Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{
                      paddingHorizontal: theme.spacing.lg,
                      gap: theme.spacing.sm,
                    }}
                  >
                    {yours.map((community) => (
                      <Pressable
                        key={community.id}
                        accessibilityRole="button"
                        onPress={() => router.push(`/community/${community.slug}`)}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 8,
                          minHeight: 44,
                          paddingLeft: 8,
                          paddingRight: 14,
                          borderRadius: theme.radius.pill,
                          backgroundColor: theme.colors.surface,
                          borderWidth: 1,
                          borderColor: theme.colors.border,
                        }}
                      >
                        <CommunityAvatar icon={community.icon} color={community.color} size={28} />
                        <Text
                          numberOfLines={1}
                          style={[
                            theme.type.body,
                            {
                              color: theme.colors.text,
                              fontWeight: '600',
                              maxWidth: 180,
                            },
                          ]}
                        >
                          {readableCommunityName(community.name)}
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>
              ) : null}
            </View>
          }
          contentContainerStyle={{
            paddingBottom: 120,
            flexGrow: sections.length === 0 ? 1 : undefined,
          }}
          keyExtractor={(item, index) => (item.kind === 'row' ? item.community.id : `shelf-${index}`)}
          refreshControl={
            <RefreshControl
              onRefresh={() => {
                setRefreshing(true);
                void communities.refetch().finally(() => setRefreshing(false));
              }}
              refreshing={refreshing}
              tintColor={theme.colors.primary}
            />
          }
          renderItem={({ item }) =>
            item.kind === 'row' ? renderCommunity(item.community) : <Shelf columns={item.columns} renderCommunity={renderCommunity} width={width} />
          }
          renderSectionHeader={({ section }) => (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingLeft: theme.spacing.lg,
                paddingRight: theme.spacing.sm,
                paddingTop: theme.spacing.lg,
                backgroundColor: theme.colors.background,
              }}
            >
              <Text accessibilityRole="header" style={[theme.type.section, { color: theme.colors.text, flex: 1 }]}>
                {section.title}
              </Text>
              {browsingAll && section.count > SHELF_ROWS ? (
                <Pressable
                  accessibilityLabel={`See all ${section.count} in ${section.title}`}
                  accessibilityRole="button"
                  onPress={() => setTopic(section.topic)}
                  style={{
                    minHeight: 44,
                    justifyContent: 'center',
                    paddingHorizontal: theme.spacing.sm,
                  }}
                >
                  <Text style={[theme.type.body, { color: theme.colors.primary, fontWeight: '600' }]}>See all</Text>
                </Pressable>
              ) : (
                <View style={{ minHeight: 44 }} />
              )}
            </View>
          )}
          sections={sections}
          stickySectionHeadersEnabled={false}
        />
      ) : null}
    </ScreenContainer>
  );
}

/** A topic's communities in pages of three. Pages fill the screen so every Join button lines up; dots show there is more. */
function Shelf({ columns, renderCommunity, width }: { columns: Community[][]; renderCommunity: (community: Community) => ReactNode; width: number }) {
  const theme = useTheme();
  const [page, setPage] = useState(0);
  if (columns.length === 1) return <View>{columns[0]!.map(renderCommunity)}</View>;
  return (
    <View>
      <FlatList
        accessibilityHint="Swipe left or right for more communities"
        data={columns}
        horizontal
        keyExtractor={(column) => column[0]!.id}
        onMomentumScrollEnd={(event) => setPage(Math.round(event.nativeEvent.contentOffset.x / width))}
        pagingEnabled
        renderItem={({ item: column }) => <View style={{ width }}>{column.map(renderCommunity)}</View>}
        showsHorizontalScrollIndicator={false}
      />
      <View
        accessibilityLabel={`Page ${page + 1} of ${columns.length}`}
        style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, paddingTop: theme.spacing.sm }}
      >
        {columns.map((column, index) => (
          <View
            key={column[0]!.id}
            style={{
              width: index === page ? 16 : 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: index === page ? theme.colors.primary : theme.colors.border,
            }}
          />
        ))}
      </View>
    </View>
  );
}
