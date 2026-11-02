import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Text, TextInput, View } from 'react-native';

import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { LIMITS } from '@/constants/limits';
import { useAuth } from '@/features/auth/AuthProvider';
import { useRequireSignIn } from '@/features/auth/requireSignIn';
import { getApi } from '@/lib/backend';
import { mapServerError } from '@/lib/backend/errors';
import { profileSchema, type ProfileValues } from '@/lib/validation/schemas';
import { useTheme } from '@/theme/ThemeProvider';

export default function EditProfileScreen() {
  const theme = useTheme();
  const signedIn = useRequireSignIn('/settings/edit-profile');
  const client = useQueryClient();
  const { profile, refreshProfile } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    values: { username: profile?.username ?? '', displayName: profile?.displayName ?? '', bio: profile?.bio ?? '' },
  });
  if (!signedIn) return null;
  return (
    <ScreenContainer>
      <View style={{ padding: theme.spacing.xl, gap: theme.spacing.md }}>
        <Text onPress={() => router.back()} style={{ color: theme.colors.primary }}>
          Close
        </Text>
        <Text accessibilityRole="header" style={[theme.type.title, { color: theme.colors.text }]}>
          Edit profile
        </Text>
        {(
          [
            {
              name: 'username',
              label: 'Username',
              placeholder: 'miriam',
              hint: `${LIMITS.usernameMin}–${LIMITS.usernameMax} characters. Letters, numbers, and underscores. Start with a letter.`,
            },
            { name: 'displayName', label: 'Display name', placeholder: 'Miriam', hint: 'Optional. Shown in place of your username.' },
            { name: 'bio', label: 'Bio', placeholder: 'A sentence about you', hint: `Optional. Up to ${LIMITS.bio} characters.` },
          ] as const
        ).map((item) => (
          <Controller
            key={item.name}
            control={form.control}
            name={item.name}
            render={({ field, fieldState }) => (
              <View style={{ gap: theme.spacing.sm }}>
                <Text style={[theme.type.body, { color: theme.colors.text, fontWeight: '600' }]}>{item.label}</Text>
                <TextInput
                  accessibilityLabel={item.label}
                  autoCapitalize={item.name === 'username' ? 'none' : 'sentences'}
                  multiline={item.name === 'bio'}
                  onChangeText={(value) => {
                    field.onChange(value);
                    if (item.name === 'username') {
                      form.clearErrors('username');
                      setError(null);
                    }
                  }}
                  placeholder={item.placeholder}
                  placeholderTextColor={theme.colors.secondary}
                  style={[
                    theme.type.body,
                    {
                      color: theme.colors.text,
                      minHeight: item.name === 'bio' ? 100 : 48,
                      borderWidth: 1,
                      borderColor: theme.colors.border,
                      borderRadius: theme.radius.md,
                      backgroundColor: theme.colors.surface,
                      paddingHorizontal: theme.spacing.md,
                      paddingVertical: theme.spacing.sm,
                      textAlignVertical: item.name === 'bio' ? 'top' : 'center',
                    },
                  ]}
                  value={field.value}
                />
                <Text style={[theme.type.body, { color: fieldState.error ? theme.colors.danger : theme.colors.muted }]}>
                  {fieldState.error?.message ?? item.hint}
                </Text>
              </View>
            )}
          />
        ))}
        {error ? <Text style={{ color: theme.colors.danger }}>{error}</Text> : null}
        <PrimaryButton
          label="Change photo"
          onPress={async () => {
            const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.8 });
            if (result.canceled || !result.assets[0]) return;
            const updated = await (await getApi()).uploadAvatar(result.assets[0].uri);
            client.setQueryData(['profile', updated.username], updated);
            await refreshProfile();
          }}
        />
        <PrimaryButton
          label="Save"
          onPress={form.handleSubmit(async (values) => {
            try {
              const updated = await (
                await getApi()
              ).updateProfile({
                username: values.username,
                displayName: values.displayName || null,
                bio: values.bio.trim() || null,
              });
              client.setQueryData(['profile', updated.username], updated);
              if (profile?.username && profile.username !== updated.username) client.removeQueries({ queryKey: ['profile', profile.username] });
              await Promise.all([refreshProfile(), client.invalidateQueries({ queryKey: ['profile', updated.username] })]);
              router.back();
            } catch (caught) {
              const mapped = mapServerError(caught);
              if (mapped.code === 'conflict' || /username/i.test(mapped.message)) {
                form.setError('username', { message: mapped.message });
                setError(null);
                return;
              }
              setError(mapped.message);
            }
          })}
        />
      </View>
    </ScreenContainer>
  );
}
