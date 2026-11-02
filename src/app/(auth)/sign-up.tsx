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

const FIELDS = [
  { name: 'email', label: 'Email', placeholder: 'you@email.com', hint: 'This is not shown on your profile.', secure: false },
  { name: 'password', label: 'Password', placeholder: 'At least 8 characters', hint: 'At least 8 characters.', secure: true },
  { name: 'confirmPassword', label: 'Confirm password', placeholder: 'Type it again', hint: 'Type the same password again.', secure: true },
] as const;

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
        {FIELDS.map((item) => (
          <Controller
            key={item.name}
            control={form.control}
            name={item.name}
            render={({ field, fieldState }) => (
              <View style={{ gap: theme.spacing.sm }}>
                <Text style={[theme.type.body, { color: theme.colors.text, fontWeight: '600' }]}>{item.label}</Text>
                <TextInput
                  accessibilityLabel={item.label}
                  autoCapitalize="none"
                  autoComplete={item.name === 'email' ? 'email' : 'password'}
                  keyboardType={item.name === 'email' ? 'email-address' : 'default'}
                  onChangeText={field.onChange}
                  placeholder={item.placeholder}
                  placeholderTextColor={theme.colors.secondary}
                  secureTextEntry={item.secure}
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
                  testID={`sign-up-${item.name}`}
                  value={field.value}
                />
                <Text style={[theme.type.body, { color: fieldState.error ? theme.colors.danger : theme.colors.muted }]}>
                  {fieldState.error?.message ?? item.hint}
                </Text>
              </View>
            )}
          />
        ))}
        {error ? <Text style={[theme.type.body, { color: theme.colors.danger }]}>{error}</Text> : null}
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
