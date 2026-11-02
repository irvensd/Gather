import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Text } from 'react-native';

import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { readableCommunityName } from '@/constants/communities';
import { useAuth } from '@/features/auth/AuthProvider';
import { getApi } from '@/lib/backend';
import { usePending } from '@/store/pending';
import { useTheme } from '@/theme/ThemeProvider';

export default function InterestsScreen() {
  const theme = useTheme();
  const { refreshProfile } = useAuth();
  const [selected, setSelected] = useState<string[]>([]);
  const communities = useQuery({ queryKey: ['communities'], queryFn: async () => (await getApi()).listCommunities() });
  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ padding: theme.spacing.xl, gap: theme.spacing.md }}>
        <Text style={[theme.type.title, { color: theme.colors.text }]}>Choose a few communities</Text>
        <Text style={[theme.type.body, { color: theme.colors.secondary }]}>This fills your Following feed. You can change it later.</Text>
        {communities.data?.map((community) => {
          const on = selected.includes(community.id);
          return (
            <Pressable key={community.id} onPress={() => setSelected((current) => on ? current.filter((id) => id !== community.id) : [...current, community.id])} style={{ padding: theme.spacing.md, borderRadius: theme.radius.md, backgroundColor: on ? theme.colors.highlight : theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border }}>
              <Text style={[theme.type.section, { color: theme.colors.text }]}>{readableCommunityName(community.name)}</Text>
              <Text style={[theme.type.caption, { color: theme.colors.secondary }]}>{community.description}</Text>
            </Pressable>
          );
        })}
        <PrimaryButton label="Done" onPress={async () => {
          const api = await getApi();
          for (const id of selected) await api.setMembership(id, true);
          usePending.getState().clearPending();
          await api.updateProfile({ onboardingStep: 'done' });
          await refreshProfile();
          router.replace('/');
        }} testID="interests-continue" />
      </ScrollView>
    </ScreenContainer>
  );
}
