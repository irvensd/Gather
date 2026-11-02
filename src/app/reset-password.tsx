import { useState } from 'react';
import { Text, TextInput, View } from 'react-native';

import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { getApi } from '@/lib/backend';
import { AppError } from '@/lib/backend/errors';
import { useTheme } from '@/theme/ThemeProvider';

export default function ResetPasswordScreen() {
  const theme = useTheme();
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  return (
    <ScreenContainer>
      <View style={{ padding: theme.spacing.xl, gap: theme.spacing.lg }}>
        <Text style={[theme.type.title, { color: theme.colors.text }]}>Choose a new password</Text>
        <View style={{ gap: theme.spacing.sm }}>
          <Text style={[theme.type.body, { color: theme.colors.text, fontWeight: '600' }]}>New password</Text>
          <TextInput
            accessibilityLabel="New password"
            onChangeText={setPassword}
            placeholder="At least 8 characters"
            placeholderTextColor={theme.colors.secondary}
            secureTextEntry
            style={[
              theme.type.body,
              {
                color: theme.colors.text,
                minHeight: 48,
                borderWidth: 1,
                borderColor: theme.colors.border,
                borderRadius: theme.radius.md,
                backgroundColor: theme.colors.surface,
                paddingHorizontal: theme.spacing.md,
              },
            ]}
            value={password}
          />
          <Text style={[theme.type.body, { color: message && message !== 'Password updated.' ? theme.colors.danger : theme.colors.muted }]}>
            {message ?? 'At least 8 characters.'}
          </Text>
        </View>
        <PrimaryButton label="Update password" onPress={async () => {
          try {
            await (await getApi()).updatePassword(password);
            setMessage('Password updated.');
          } catch (error) {
            setMessage(error instanceof AppError ? error.message : 'Open the link from your email, then try again.');
          }
        }} />
      </View>
    </ScreenContainer>
  );
}
