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
        <TextInput onChangeText={setPassword} placeholder="New password" placeholderTextColor={theme.colors.secondary} secureTextEntry style={[theme.type.body, { color: theme.colors.text, minHeight: 48 }]} value={password} />
        {message ? <Text style={[theme.type.body, { color: theme.colors.text }]}>{message}</Text> : null}
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
