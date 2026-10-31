import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { IconButton } from '@/components/ui/IconButton';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { getApi } from '@/lib/backend';
import { useTheme } from '@/theme/ThemeProvider';

const LINKS = [
  ['Edit profile', '/settings/edit-profile'],
  ['Saved posts', '/settings/saved'],
  ['Joined communities', '/settings/communities'],
  ['Appearance', '/settings/appearance'],
  ['Notifications', '/settings/notifications'],
  ['Sabbath quiet', '/settings/sabbath'],
  ['Blocked accounts', '/settings/blocked'],
  ['Privacy and guidelines', '/settings/guidelines'],
  ['Delete account', '/settings/delete-account'],
] as const;

export default function SettingsScreen() {
  const theme = useTheme();
  return (
    <ScreenContainer>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <IconButton label="Back" name="chevron-back" onPress={() => router.back()} />
        <Text style={[theme.type.section, { color: theme.colors.text }]}>Settings</Text>
      </View>
      <View>
        {LINKS.map(([label, href]) => (
          <Pressable key={href} onPress={() => router.push(href)} style={{ minHeight: 52, paddingHorizontal: theme.spacing.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: theme.colors.border }}>
            <Text style={[theme.type.body, { color: label === 'Delete account' ? theme.colors.danger : theme.colors.text }]}>{label}</Text>
            <Ionicons color={theme.colors.secondary} name="chevron-forward" size={16} />
          </Pressable>
        ))}
        <Pressable onPress={async () => { await (await getApi()).signOut(); router.replace('/'); }} style={{ minHeight: 52, paddingHorizontal: theme.spacing.lg, justifyContent: 'center' }}>
          <Text style={[theme.type.body, { color: theme.colors.text }]}>Sign out</Text>
        </Pressable>
      </View>
    </ScreenContainer>
  );
}
