import { useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { EmptyState } from '@/components/ui/EmptyState';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { readableCommunityName } from '@/constants/communities';
import { useRequireSignIn } from '@/features/auth/requireSignIn';
import { membershipNotice } from '@/lib/communityBrowse';
import { useToast } from '@/store/toast';
import { getApi } from '@/lib/backend';
import { useTheme } from '@/theme/ThemeProvider';

export default function JoinedCommunitiesScreen() {
  const signedIn = useRequireSignIn('/settings/communities');
  const theme = useTheme();
  const client = useQueryClient();
  const communities = useQuery({ queryKey: ['joined'], enabled: signedIn, queryFn: async () => (await getApi()).listJoinedCommunities() });
  if (!signedIn) return null;
  return (
    <ScreenContainer>
      <ScreenHeader title="Joined communities" />
      {(communities.data ?? []).length === 0 ? (
        <EmptyState
          actionLabel="Explore"
          message="Find your people. Explore communities."
          onAction={() => router.push('/explore')}
          title="No communities yet"
        />
      ) : (
        communities.data?.map((community) => (
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
            }}
          >
            <Pressable onPress={() => router.push(`/community/${community.slug}`)} style={{ flex: 1, justifyContent: 'center', minHeight: 56 }}>
              <Text style={[theme.type.body, { color: theme.colors.text }]}>{readableCommunityName(community.name)}</Text>
            </Pressable>
            <Pressable
              accessibilityLabel={`Leave ${community.name}`}
              onPress={async () => {
                await (await getApi()).setMembership(community.id, false);
                useToast.getState().show(membershipNotice(community.name, false));
                await client.invalidateQueries({ queryKey: ['joined'] });
                await client.invalidateQueries({ queryKey: ['communities'] });
                await client.invalidateQueries({ queryKey: ['community', community.slug] });
                await client.invalidateQueries({ queryKey: ['feed'] });
              }}
            >
              <Text style={[theme.type.body, { color: theme.colors.primary, fontWeight: '600' }]}>Leave</Text>
            </Pressable>
          </View>
        ))
      )}
    </ScreenContainer>
  );
}
