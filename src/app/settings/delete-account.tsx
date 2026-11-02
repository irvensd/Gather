import { router } from 'expo-router';
import { useState } from 'react';
import { Text, TextInput, View } from 'react-native';

import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { ACCOUNT_DELETION_POLICY } from '@/constants/guidelines';
import { useAuth } from '@/features/auth/AuthProvider';
import { useRequireSignIn } from '@/features/auth/requireSignIn';
import { getApi } from '@/lib/backend';
import { AppError } from '@/lib/backend/errors';
import { useTheme } from '@/theme/ThemeProvider';

export default function DeleteAccountScreen() {
  const signedIn = useRequireSignIn('/settings/delete-account');
  const theme = useTheme();
  const { profile, session } = useAuth();
  const [confirmation, setConfirmation] = useState('');
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const matches = confirmation.trim().toLowerCase() === (profile?.username ?? '').toLowerCase();
  if (!signedIn) return null;
  return (
    <ScreenContainer>
      <ScreenHeader title="Delete account" />
      <View style={{ padding: theme.spacing.xl, gap: theme.spacing.lg }}>
        <Text style={[theme.type.body, { color: theme.colors.text }]}>{ACCOUNT_DELETION_POLICY}</Text>
        <Text style={[theme.type.caption, { color: theme.colors.secondary }]}>
          Signed in as {session?.email}. Type @{profile?.username} to continue.
        </Text>
        <TextInput
          autoCapitalize="none"
          onChangeText={setConfirmation}
          placeholder={profile?.username}
          placeholderTextColor={theme.colors.secondary}
          style={[theme.type.body, { color: theme.colors.text, minHeight: 48 }]}
          testID="delete-confirm"
          value={confirmation}
        />
        {error ? <Text style={{ color: theme.colors.danger }}>{error}</Text> : null}
        <PrimaryButton disabled={!matches} label="Delete account" onPress={() => setOpen(true)} testID="delete-account" />
      </View>
      <ConfirmationDialog
        confirmLabel="Delete forever"
        message="This removes your sign-in and your name from existing conversations."
        onCancel={() => setOpen(false)}
        onConfirm={async () => {
          setOpen(false);
          try {
            await (await getApi()).deleteAccount();
            router.replace('/');
          } catch (caught) {
            setError(caught instanceof AppError ? caught.message : 'Could not delete the account.');
          }
        }}
        title="Delete your account?"
        visible={open}
      />
    </ScreenContainer>
  );
}
