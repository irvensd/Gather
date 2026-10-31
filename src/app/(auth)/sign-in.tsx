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
        <Controller control={form.control} name="email" render={({ field }) => (
          <TextInput autoCapitalize="none" autoComplete="email" keyboardType="email-address" onChangeText={field.onChange} placeholder="Email" placeholderTextColor={theme.colors.secondary} style={[theme.type.body, inputStyle(theme)]} testID="sign-in-email" value={field.value} />
        )} />
        <Controller control={form.control} name="password" render={({ field }) => (
          <TextInput onChangeText={field.onChange} placeholder="Password" placeholderTextColor={theme.colors.secondary} secureTextEntry style={[theme.type.body, inputStyle(theme)]} testID="sign-in-password" value={field.value} />
        )} />
        {error ? <Text style={[theme.type.caption, { color: theme.colors.danger }]}>{error}</Text> : null}
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

function inputStyle(theme: ReturnType<typeof useTheme>) {
  return { borderBottomWidth: 1, borderBottomColor: theme.colors.border, color: theme.colors.text, minHeight: 48 };
}
