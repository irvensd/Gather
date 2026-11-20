import { zodResolver } from '@hookform/resolvers/zod';
import { Link, router } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ScrollView, Text, TextInput, View } from 'react-native';

import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { backendMode, getApi } from '@/lib/backend';
import { AppError } from '@/lib/backend/errors';
import { signInSchema, type SignInValues } from '@/lib/validation/schemas';
import { useTheme } from '@/theme/ThemeProvider';

export default function SignInScreen() {
  const theme = useTheme();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const form = useForm<SignInValues>({ resolver: zodResolver(signInSchema), defaultValues: { email: '', password: '' } });
  const box = [
    theme.type.body,
    {
      color: theme.colors.text,
      minHeight: 48,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.md,
      backgroundColor: theme.colors.surface,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.md,
    },
  ];
  return (
    <ScreenContainer edges={['top', 'left', 'right', 'bottom']}>
      <ScrollView
        automaticallyAdjustKeyboardInsets
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: theme.spacing.xl, gap: theme.spacing.lg }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <Text style={[theme.type.title, { color: theme.colors.text }]}>Sign in</Text>
        <Text style={[theme.type.body, { color: theme.colors.secondary }]}>Sign in to join the conversation.</Text>
        {backendMode() === 'demo' ? (
          <Text style={[theme.type.caption, { color: theme.colors.secondary }]}>
            Demo accounts: mira@demo.gather or rowan@demo.gather (moderator). Password: gather-demo.
          </Text>
        ) : null}
        <Controller
          control={form.control}
          name="email"
          render={({ field, fieldState }) => (
            <View style={{ gap: theme.spacing.sm }}>
              <Text style={[theme.type.body, { color: theme.colors.text, fontWeight: '600' }]}>Email</Text>
              <TextInput
                accessibilityLabel="Email"
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                onChangeText={field.onChange}
                placeholder="you@email.com"
                placeholderTextColor={theme.colors.secondary}
                style={box}
                testID="sign-in-email"
                value={field.value}
              />
              {fieldState.error ? <Text style={[theme.type.body, { color: theme.colors.danger }]}>{fieldState.error.message}</Text> : null}
            </View>
          )}
        />
        <Controller
          control={form.control}
          name="password"
          render={({ field, fieldState }) => (
            <View style={{ gap: theme.spacing.sm }}>
              <Text style={[theme.type.body, { color: theme.colors.text, fontWeight: '600' }]}>Password</Text>
              <TextInput
                accessibilityLabel="Password"
                autoCapitalize="none"
                autoComplete="current-password"
                onChangeText={field.onChange}
                placeholder="Your password"
                placeholderTextColor={theme.colors.secondary}
                secureTextEntry
                style={box}
                testID="sign-in-password"
                value={field.value}
              />
              {fieldState.error ? <Text style={[theme.type.body, { color: theme.colors.danger }]}>{fieldState.error.message}</Text> : null}
            </View>
          )}
        />
        {error ? <Text style={[theme.type.body, { color: theme.colors.danger }]}>{error}</Text> : null}
        <PrimaryButton label="Sign in" loading={loading} onPress={form.handleSubmit(async (values) => {
          setLoading(true);
          setError(null);
          try {
            await (await getApi()).signIn(values.email, values.password);
            // The auth gate resumes the pending action once the profile has loaded.
          } catch (caught) {
            setError(caught instanceof AppError ? caught.message : 'Could not sign in.');
            setLoading(false);
          }
        })} testID="sign-in-submit" />
        <Link href="/(auth)/forgot-password"><Text style={[theme.type.body, { color: theme.colors.primary }]}>Forgot password</Text></Link>
        <Link href="/(auth)/sign-up"><Text style={[theme.type.body, { color: theme.colors.text }]}>Create an account</Text></Link>
        <Text onPress={() => router.dismissTo('/')} style={[theme.type.body, { color: theme.colors.secondary }]}>Keep browsing</Text>
      </ScrollView>
    </ScreenContainer>
  );
}
