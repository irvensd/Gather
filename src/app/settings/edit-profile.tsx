import { zodResolver } from '@hookform/resolvers/zod';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, Text, TextInput, View } from 'react-native';

import { AppHeader } from '@/components/ui/AppHeader';
import { IconButton } from '@/components/ui/IconButton';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { useAuth } from '@/features/auth/AuthProvider';
import { getApi } from '@/lib/backend';
import { AppError } from '@/lib/backend/errors';
import { profileSchema, type ProfileValues } from '@/lib/validation/schemas';
import { useTheme } from '@/theme/ThemeProvider';

const FIELDS: { name: keyof ProfileValues; label: string; placeholder: string; multiline?: boolean }[] = [
  { name: 'displayName', label: 'Display name', placeholder: 'How you want to appear' },
  { name: 'username', label: 'Username', placeholder: 'your_handle' },
  { name: 'bio', label: 'Bio', placeholder: 'A short introduction', multiline: true },
];

export default function EditProfileScreen() {
  const theme = useTheme();
  const { profile, refreshProfile } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [focused, setFocused] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    values: { username: profile?.username ?? '', displayName: profile?.displayName ?? '', bio: profile?.bio ?? '' },
  });
  return (
    <ScreenContainer>
      <AppHeader left={<IconButton label="Back" name="chevron-back" onPress={() => router.back()} />} title="Edit profile" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={{ paddingHorizontal: theme.spacing.lg, paddingBottom: theme.spacing.xl, gap: theme.spacing.md }}>
          <View style={{ alignItems: 'center', gap: theme.spacing.sm, paddingVertical: theme.spacing.sm }}>
            <UserAvatar name={profile?.displayName ?? profile?.username ?? null} path={profile?.avatarPath ?? null} size={72} />
            <PrimaryButton
              label="Change photo"
              onPress={async () => {
                const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.8 });
                if (result.canceled || !result.assets[0]) return;
                await (await getApi()).uploadAvatar(result.assets[0].uri);
                await refreshProfile();
              }}
            />
          </View>
          {FIELDS.map((item) => (
            <Controller
              key={item.name}
              control={form.control}
              name={item.name}
              render={({ field, fieldState }) => (
                <View style={{ gap: 6 }}>
                  <Text style={[theme.type.label, { color: theme.colors.secondary }]}>{item.label}</Text>
                  <TextInput
                    accessibilityLabel={item.label}
                    autoCapitalize={item.name === 'username' ? 'none' : 'sentences'}
                    multiline={item.multiline}
                    onBlur={() => {
                      field.onBlur();
                      setFocused(null);
                    }}
                    onChangeText={field.onChange}
                    onFocus={() => setFocused(item.name)}
                    placeholder={item.placeholder}
                    placeholderTextColor={theme.colors.secondary}
                    style={[
                      theme.type.body,
                      {
                        color: theme.colors.text,
                        minHeight: item.multiline ? 100 : 48,
                        borderWidth: 1,
                        borderColor: focused === item.name ? theme.colors.primary : theme.colors.border,
                        borderRadius: theme.radius.md,
                        backgroundColor: theme.colors.surface,
                        paddingHorizontal: theme.spacing.md,
                        paddingVertical: 12,
                        textAlignVertical: item.multiline ? 'top' : 'center',
                      },
                    ]}
                    value={field.value}
                  />
                  {fieldState.error ? <Text style={[theme.type.caption, { color: theme.colors.danger }]}>{fieldState.error.message}</Text> : null}
                </View>
              )}
            />
          ))}
          {error ? <Text style={[theme.type.body, { color: theme.colors.danger }]}>{error}</Text> : null}
          <PrimaryButton
            label="Save"
            loading={saving}
            onPress={form.handleSubmit(async (values) => {
              setSaving(true);
              setError(null);
              try {
                await (await getApi()).updateProfile({ username: values.username, displayName: values.displayName || null, bio: values.bio || null });
                await refreshProfile();
                router.back();
              } catch (caught) {
                setError(caught instanceof AppError ? caught.message : 'Could not save the profile.');
                setSaving(false);
              }
            })}
          />
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
