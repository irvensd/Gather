import { zodResolver } from '@hookform/resolvers/zod';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Text, TextInput, View } from 'react-native';

import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { useAuth } from '@/features/auth/AuthProvider';
import { getApi } from '@/lib/backend';
import { AppError } from '@/lib/backend/errors';
import { profileSchema, type ProfileValues } from '@/lib/validation/schemas';
import { useTheme } from '@/theme/ThemeProvider';

export default function EditProfileScreen() {
  const theme = useTheme();
  const { profile, refreshProfile } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    values: { username: profile?.username ?? '', displayName: profile?.displayName ?? '', bio: profile?.bio ?? '' },
  });
  return (
    <ScreenContainer>
      <View style={{ padding: theme.spacing.xl, gap: theme.spacing.md }}>
        <Text onPress={() => router.back()} style={{ color: theme.colors.primary }}>Close</Text>
        <Text style={[theme.type.title, { color: theme.colors.text }]}>Edit profile</Text>
        {(['username', 'displayName', 'bio'] as const).map((name) => (
          <Controller key={name} control={form.control} name={name} render={({ field, fieldState }) => (
            <View>
              <TextInput multiline={name === 'bio'} onChangeText={field.onChange} placeholder={name} placeholderTextColor={theme.colors.secondary} style={[theme.type.body, { color: theme.colors.text, minHeight: name === 'bio' ? 100 : 48 }]} value={field.value} />
              {fieldState.error ? <Text style={{ color: theme.colors.danger }}>{fieldState.error.message}</Text> : null}
            </View>
          )} />
        ))}
        {error ? <Text style={{ color: theme.colors.danger }}>{error}</Text> : null}
        <PrimaryButton label="Change photo" onPress={async () => {
          const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.8 });
          if (result.canceled || !result.assets[0]) return;
          await (await getApi()).uploadAvatar(result.assets[0].uri);
          await refreshProfile();
        }} />
        <PrimaryButton label="Save" onPress={form.handleSubmit(async (values) => {
          try {
            await (await getApi()).updateProfile({ username: values.username, displayName: values.displayName || null, bio: values.bio || null });
            await refreshProfile();
            router.back();
          } catch (caught) {
            setError(caught instanceof AppError ? caught.message : 'Could not save the profile.');
          }
        })} />
      </View>
    </ScreenContainer>
  );
}
