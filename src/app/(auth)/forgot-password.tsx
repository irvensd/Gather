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
  return (
    <ScreenContainer>
      <View style={{ padding: theme.spacing.xl, gap: theme.spacing.lg }}>
        <Text style={[theme.type.title, { color: theme.colors.text }]}>Reset password</Text>
        <TextInput autoCapitalize="none" keyboardType="email-address" onChangeText={setEmail} placeholder="Email" placeholderTextColor={theme.colors.secondary} style={[theme.type.body, { color: theme.colors.text, borderBottomWidth: 1, borderBottomColor: theme.colors.border, minHeight: 48 }]} value={email} />
        {message ? <Text style={[theme.type.body, { color: theme.colors.text }]}>{message}</Text> : null}
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
