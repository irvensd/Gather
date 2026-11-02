import { useState } from 'react';
import { Text, TextInput, View } from 'react-native';

import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { getApi } from '@/lib/backend';
import { AppError } from '@/lib/backend/errors';
import { useTheme } from '@/theme/ThemeProvider';

export default function ForgotPasswordScreen() {
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const sent = message === 'If an account exists for that email, a reset link is on the way.';
  return (
    <ScreenContainer>
      <View style={{ padding: theme.spacing.xl, gap: theme.spacing.lg }}>
        <Text style={[theme.type.title, { color: theme.colors.text }]}>Reset password</Text>
        <Text style={[theme.type.body, { color: theme.colors.secondary }]}>We’ll email you a link to choose a new password.</Text>
        <View style={{ gap: theme.spacing.sm }}>
          <Text style={[theme.type.body, { color: theme.colors.text, fontWeight: '600' }]}>Email</Text>
          <TextInput
            accessibilityLabel="Email"
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            onChangeText={setEmail}
            placeholder="you@email.com"
            placeholderTextColor={theme.colors.secondary}
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
            value={email}
          />
          {message ? <Text style={[theme.type.body, { color: sent ? theme.colors.text : theme.colors.danger }]}>{message}</Text> : null}
        </View>
        <PrimaryButton label="Send reset link" onPress={async () => {
          try {
            await (await getApi()).requestPasswordReset(email);
            setMessage('If an account exists for that email, a reset link is on the way.');
          } catch (error) {
            setMessage(error instanceof AppError ? error.message : 'Could not send a reset link.');
          }
        }} />
      </View>
    </ScreenContainer>
  );
}
