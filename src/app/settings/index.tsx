import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { IconButton } from '@/components/ui/IconButton';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { useAuth } from '@/features/auth/AuthProvider';
import { getApi } from '@/lib/backend';
import { usePending } from '@/store/pending';
import { useTheme } from '@/theme/ThemeProvider';

const ACCOUNT_LINKS = [
  ['Edit profile', '/settings/edit-profile'],
  ['Saved posts', '/settings/saved'],
  ['Joined communities', '/settings/communities'],
  ['Notifications', '/settings/notifications'],
  ['Blocked accounts', '/settings/blocked'],
  ['Delete account', '/settings/delete-account'],
] as const;

const OPEN_LINKS = [
  ['Appearance', '/settings/appearance'],
  ['Privacy and guidelines', '/settings/guidelines'],
] as const;

export default function SettingsScreen() {
  const theme = useTheme();
  const { session } = useAuth();
  const row = (label: string, href: (typeof ACCOUNT_LINKS)[number][1] | (typeof OPEN_LINKS)[number][1]) => (
    <Pressable
      key={href}
      onPress={() => router.push(href)}
      style={{
        minHeight: 52,
        paddingHorizontal: theme.spacing.lg,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
      }}
    >
      <Text style={[theme.type.body, { color: label === 'Delete account' ? theme.colors.danger : theme.colors.text }]}>{label}</Text>
      <Ionicons color={theme.colors.secondary} name="chevron-forward" size={16} />
    </Pressable>
  );
  return (
    <ScreenContainer>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <IconButton label="Back" name="chevron-back" onPress={() => router.back()} />
        <Text style={[theme.type.section, { color: theme.colors.text }]}>Settings</Text>
      </View>
      <View>
        {session ? ACCOUNT_LINKS.map(([label, href]) => row(label, href)) : null}
        {OPEN_LINKS.map(([label, href]) => row(label, href))}
        {session ? (
          <Pressable
            onPress={async () => {
              await (await getApi()).signOut();
              router.replace('/');
            }}
            style={{ minHeight: 52, paddingHorizontal: theme.spacing.lg, justifyContent: 'center' }}
          >
            <Text style={[theme.type.body, { color: theme.colors.text }]}>Sign out</Text>
          </Pressable>
        ) : (
          <Pressable
            onPress={() => {
              usePending.getState().setPending('/settings');
              router.push('/(auth)/sign-in');
            }}
            style={{ minHeight: 52, paddingHorizontal: theme.spacing.lg, justifyContent: 'center' }}
          >
            <Text style={[theme.type.body, { color: theme.colors.primary, fontWeight: '600' }]}>Sign in</Text>
          </Pressable>
        )}
      </View>
    </ScreenContainer>
  );
}
