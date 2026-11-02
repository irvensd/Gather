import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Text, TextInput, View } from 'react-native';

import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { LIMITS } from '@/constants/limits';
import { useAuth } from '@/features/auth/AuthProvider';
import { getApi } from '@/lib/backend';
import { mapServerError } from '@/lib/backend/errors';
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
        <Controller
          control={form.control}
          name="username"
          render={({ field, fieldState }) => (
            <View style={{ gap: theme.spacing.sm }}>
              <Text style={[theme.type.body, { color: theme.colors.text, fontWeight: '600' }]}>Username</Text>
              <TextInput
                accessibilityLabel="Username"
                autoCapitalize="none"
                onChangeText={(value) => {
                  field.onChange(value);
                  form.clearErrors('username');
                  setError(null);
                }}
                placeholder="miriam"
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
                testID="username-input"
                value={field.value}
              />
              <Text style={[theme.type.body, { color: fieldState.error ? theme.colors.danger : theme.colors.muted }]}>
                {fieldState.error?.message ??
                  `${LIMITS.usernameMin}–${LIMITS.usernameMax} characters. Letters, numbers, and underscores. Start with a letter.`}
              </Text>
            </View>
          )}
        />
        <Controller
          control={form.control}
          name="displayName"
          render={({ field, fieldState }) => (
            <View style={{ gap: theme.spacing.sm }}>
              <Text style={[theme.type.body, { color: theme.colors.text, fontWeight: '600' }]}>Display name</Text>
              <TextInput
                accessibilityLabel="Display name"
                onChangeText={field.onChange}
                placeholder="Miriam"
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
                value={field.value}
              />
              <Text style={[theme.type.body, { color: fieldState.error ? theme.colors.danger : theme.colors.muted }]}>
                {fieldState.error?.message ?? 'Optional. Shown in place of your username.'}
              </Text>
            </View>
          )}
        />
        {error ? <Text style={{ color: theme.colors.danger }}>{error}</Text> : null}
        <PrimaryButton label="Continue" onPress={form.handleSubmit(async (values) => {
          try {
            await (await getApi()).updateProfile({ username: values.username, displayName: values.displayName || null, onboardingStep: 'interests' });
            await refreshProfile();
            router.replace('/(onboarding)/interests');
          } catch (caught) {
            const mapped = mapServerError(caught);
            if (mapped.code === 'conflict' || /username/i.test(mapped.message)) {
              form.setError('username', { message: mapped.message });
              setError(null);
              return;
            }
            setError(mapped.message);
          }
        })} testID="username-continue" />
      </View>
    </ScreenContainer>
  );
}
