import { zodResolver } from '@hookform/resolvers/zod';
import { Link, router } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Text, TextInput, View } from 'react-native';

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
    },
  ];
  return (
    <ScreenContainer>
      <View style={{ padding: theme.spacing.xl, gap: theme.spacing.lg }}>
        <Text style={[theme.type.title, { color: theme.colors.text }]}>Sign in</Text>
        <Text style={[theme.type.body, { color: theme.colors.secondary }]}>An account is only for posting, replying, voting, saving, and reporting. You can keep reading without one.</Text>
        {backendMode() === 'demo' ? (
          <Text style={[theme.type.caption, { color: theme.colors.secondary }]}>
            This phone has sample accounts because Supabase is not connected. Try mira@demo.gather or rowan@demo.gather. Password: gather-demo. Rowan can review reports. Or create your own account. It stays on this device.
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
            if (router.canGoBack()) router.back();
            else router.replace('/');
          } catch (caught) {
            setError(caught instanceof AppError ? caught.message : 'Could not sign in.');
            setLoading(false);
          }
        })} testID="sign-in-submit" />
        <Link href="/(auth)/forgot-password"><Text style={[theme.type.body, { color: theme.colors.primary }]}>Forgot password</Text></Link>
        <Link href="/(auth)/sign-up"><Text style={[theme.type.body, { color: theme.colors.text }]}>Create an account</Text></Link>
        <Text onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} style={[theme.type.body, { color: theme.colors.secondary }]}>Keep browsing</Text>
      </View>
    </ScreenContainer>
  );
}
