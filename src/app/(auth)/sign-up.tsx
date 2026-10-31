import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Text, TextInput, View } from 'react-native';

import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { backendMode, getApi } from '@/lib/backend';
import { AppError } from '@/lib/backend/errors';
import { signUpSchema, type SignUpValues } from '@/lib/validation/schemas';
import { useTheme } from '@/theme/ThemeProvider';

export default function SignUpScreen() {
  const theme = useTheme();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const form = useForm<SignUpValues>({ resolver: zodResolver(signUpSchema), defaultValues: { email: '', password: '', confirmPassword: '' } });
  return (
    <ScreenContainer>
      <View style={{ padding: theme.spacing.xl, gap: theme.spacing.lg }}>
        <Text style={[theme.type.title, { color: theme.colors.text }]}>Create your account</Text>
        <Text style={[theme.type.body, { color: theme.colors.secondary }]}>You’ll choose a public username next. Your email is not shown on your profile.</Text>
        {(['email', 'password', 'confirmPassword'] as const).map((name) => (
          <Controller key={name} control={form.control} name={name} render={({ field, fieldState }) => (
            <View>
              <TextInput
                autoCapitalize="none"
                onChangeText={field.onChange}
                placeholder={name === 'email' ? 'Email' : name === 'password' ? 'Password' : 'Confirm password'}
                placeholderTextColor={theme.colors.secondary}
                secureTextEntry={name !== 'email'}
                style={[theme.type.body, { borderBottomWidth: 1, borderBottomColor: theme.colors.border, color: theme.colors.text, minHeight: 48 }]}
                testID={`sign-up-${name}`}
                value={field.value}
              />
              {fieldState.error ? <Text style={[theme.type.caption, { color: theme.colors.danger }]}>{fieldState.error.message}</Text> : null}
            </View>
          )} />
        ))}
        {error ? <Text style={[theme.type.caption, { color: theme.colors.danger }]}>{error}</Text> : null}
        {confirm ? <Text style={[theme.type.body, { color: theme.colors.text }]}>Check your email to confirm the account, then sign in.</Text> : null}
        <PrimaryButton label="Continue" loading={loading} onPress={form.handleSubmit(async (values) => {
          setLoading(true);
          setError(null);
          try {
            const result = await (await getApi()).signUp(values.email, values.password);
            if (result.needsEmailConfirmation) setConfirm(true);
            else router.replace('/(onboarding)/username');
          } catch (caught) {
            setError(caught instanceof AppError ? caught.message : 'Could not create the account.');
          } finally {
            setLoading(false);
          }
        })} testID="sign-up-submit" />
        {backendMode() === 'demo' ? <Text style={[theme.type.caption, { color: theme.colors.secondary }]}>Sample accounts: mira@demo.gather or rowan@demo.gather, password gather-demo. Rowan can review reports.</Text> : null}
      </View>
    </ScreenContainer>
  );
}
