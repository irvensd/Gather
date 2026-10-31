import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Text, TextInput, View } from 'react-native';

import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { useAuth } from '@/features/auth/AuthProvider';
import { getApi } from '@/lib/backend';
import { AppError } from '@/lib/backend/errors';
import { usernameSchema, type UsernameValues } from '@/lib/validation/schemas';
import { useTheme } from '@/theme/ThemeProvider';

export default function UsernameScreen() {
  const theme = useTheme();
  const { refreshProfile } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const form = useForm<UsernameValues>({ resolver: zodResolver(usernameSchema), defaultValues: { username: '', displayName: '' } });
  return (
    <ScreenContainer>
      <View style={{ padding: theme.spacing.xl, gap: theme.spacing.lg }}>
        <Text style={[theme.type.title, { color: theme.colors.text }]}>Choose a username</Text>
        <Text style={[theme.type.body, { color: theme.colors.secondary }]}>This is the name people see. A display name is optional.</Text>
        <Controller control={form.control} name="username" render={({ field, fieldState }) => (
          <View>
            <TextInput autoCapitalize="none" onChangeText={field.onChange} placeholder="username" placeholderTextColor={theme.colors.secondary} style={[theme.type.body, { color: theme.colors.text, minHeight: 48, borderBottomWidth: 1, borderBottomColor: theme.colors.border }]} testID="username-input" value={field.value} />
            {fieldState.error ? <Text style={{ color: theme.colors.danger }}>{fieldState.error.message}</Text> : null}
          </View>
        )} />
        <Controller control={form.control} name="displayName" render={({ field }) => (
          <TextInput onChangeText={field.onChange} placeholder="Display name (optional)" placeholderTextColor={theme.colors.secondary} style={[theme.type.body, { color: theme.colors.text, minHeight: 48, borderBottomWidth: 1, borderBottomColor: theme.colors.border }]} value={field.value} />
        )} />
        {error ? <Text style={{ color: theme.colors.danger }}>{error}</Text> : null}
        <PrimaryButton label="Continue" onPress={form.handleSubmit(async (values) => {
          try {
            await (await getApi()).updateProfile({ username: values.username, displayName: values.displayName || null, onboardingStep: 'interests' });
            await refreshProfile();
            router.replace('/(onboarding)/interests');
          } catch (caught) {
            setError(caught instanceof AppError ? caught.message : 'Could not save that username.');
          }
        })} testID="username-continue" />
      </View>
    </ScreenContainer>
  );
}
