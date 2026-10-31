import { useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { CommunityAvatar } from '@/components/community/CommunityAvatar';
import { AppHeader } from '@/components/ui/AppHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { IconButton } from '@/components/ui/IconButton';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { getApi } from '@/lib/backend';
import { useTheme } from '@/theme/ThemeProvider';

export default function JoinedCommunitiesScreen() {
  const theme = useTheme();
  const client = useQueryClient();
  const communities = useQuery({ queryKey: ['joined'], queryFn: async () => (await getApi()).listJoinedCommunities() });
  return (
    <ScreenContainer>
      <AppHeader left={<IconButton label="Back" name="chevron-back" onPress={() => router.back()} />} title="Joined communities" />
      {communities.isLoading ? <LoadingSkeleton /> : null}
      {communities.isError ? (
        <EmptyState actionLabel="Try again" message="Joined communities could not be loaded." onAction={() => void communities.refetch()} title="Something went wrong" />
      ) : null}
      {!communities.isLoading && !communities.isError && (communities.data ?? []).length === 0 ? (
        <EmptyState actionLabel="Explore" message="Find your people. Explore communities." onAction={() => router.push('/explore')} title="No communities yet" />
      ) : null}
      {communities.data?.map((community) => (
        <View
          key={community.id}
          style={{
            paddingHorizontal: theme.spacing.lg,
            minHeight: 56,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.border,
            gap: theme.spacing.sm,
          }}
        >
          <Pressable onPress={() => router.push(`/community/${community.slug}`)} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 56 }}>
            <CommunityAvatar icon={community.icon} size={28} />
            <Text style={[theme.type.body, { color: theme.colors.text }]}>{community.name}</Text>
          </Pressable>
          <Pressable
            accessibilityLabel={`Leave ${community.name}`}
            onPress={async () => {
              await (await getApi()).setMembership(community.id, false);
              await client.invalidateQueries({ queryKey: ['joined'] });
              await client.invalidateQueries({ queryKey: ['communities'] });
              await client.invalidateQueries({ queryKey: ['community', community.slug] });
              await client.invalidateQueries({ queryKey: ['feed'] });
            }}
            style={{ minHeight: 44, justifyContent: 'center' }}
          >
            <Text style={[theme.type.body, { color: theme.colors.primary, fontWeight: '600' }]}>Leave</Text>
          </Pressable>
        </View>
      ))}
    </ScreenContainer>
  );
}
