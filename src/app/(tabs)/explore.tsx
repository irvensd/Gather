import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { CommunityAvatar } from '@/components/community/CommunityAvatar';
import { FeedList } from '@/features/feed/FeedList';
import { AppHeader } from '@/components/ui/AppHeader';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { SearchField } from '@/components/ui/SearchField';
import { useAuth } from '@/features/auth/AuthProvider';
import { getApi } from '@/lib/backend';
import { usePending } from '@/store/pending';
import { useTheme } from '@/theme/ThemeProvider';

export default function ExploreScreen() {
  const theme = useTheme();
  const { session } = useAuth();
  const communities = useQuery({ queryKey: ['communities'], queryFn: async () => (await getApi()).listCommunities() });
  function startCommunity() {
    if (!session) {
      usePending.getState().setPending('/new-community');
      router.push('/(auth)/sign-in');
      return;
    }
    router.push('/new-community');
  }
  return (
    <ScreenContainer>
      <AppHeader title="Explore" />
      <FeedList
        filter="popular"
        header={
          <View style={{ gap: theme.spacing.lg, paddingBottom: theme.spacing.md }}>
            <View style={{ paddingHorizontal: theme.spacing.lg }}>
              <SearchField onPress={() => router.push('/search')} />
            </View>
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: theme.spacing.lg, marginBottom: theme.spacing.sm }}>
                <Text style={[theme.type.section, { color: theme.colors.text }]}>Communities</Text>
                <Text accessibilityRole="button" onPress={startCommunity} style={[theme.type.body, { color: theme.colors.primary, fontWeight: '600' }]}>New</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: theme.spacing.lg, gap: theme.spacing.sm }}>
                {communities.data?.map((community) => (
                  <Pressable
                    key={community.id}
                    onPress={() => router.push(`/community/${community.slug}`)}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, paddingRight: 14, paddingLeft: 8, borderRadius: theme.radius.pill, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border }}
                  >
                    <CommunityAvatar icon={community.icon} size={28} />
                    <Text style={[theme.type.caption, { color: theme.colors.text, fontWeight: '600' }]}>{community.name}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
            <Text style={[theme.type.section, { color: theme.colors.text, paddingHorizontal: theme.spacing.lg }]}>Conversations</Text>
          </View>
        }
      />
    </ScreenContainer>
  );
}
