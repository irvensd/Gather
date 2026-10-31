import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { CommunityAvatar } from '@/components/community/CommunityAvatar';
import { IconButton } from '@/components/ui/IconButton';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { LIMITS } from '@/constants/limits';
import { useAuth } from '@/features/auth/AuthProvider';
import { getApi } from '@/lib/backend';
import { AppError } from '@/lib/backend/errors';
import { COMMUNITY_ICONS, communitySlug, validateCommunityName } from '@/lib/domain/community';
import { usePending } from '@/store/pending';
import { useTheme } from '@/theme/ThemeProvider';

const DEFAULT_RULES = 'Be respectful. Disagree with ideas, not people. Do not share someone else’s private information.';

export default function NewCommunityScreen() {
  const theme = useTheme();
  const { session, ready } = useAuth();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [rules, setRules] = useState('');
  const [icon, setIcon] = useState<(typeof COMMUNITY_ICONS)[number]>(COMMUNITY_ICONS[0]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!ready || session) return;
    usePending.getState().setPending('/new-community');
    router.replace('/(auth)/sign-in');
  }, [ready, session]);

  const slug = communitySlug(name);

  async function submit() {
    const nameError = validateCommunityName(name);
    if (nameError) {
      setError(nameError);
      return;
    }
    if (description.trim().length < LIMITS.communityDescriptionMin) {
      setError(`Describe the community in at least ${LIMITS.communityDescriptionMin} characters.`);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const community = await (await getApi()).createCommunity({
        name: name.trim().replace(/\s+/g, ' '),
        description: description.trim(),
        rules: rules.trim() || DEFAULT_RULES,
        icon,
      });
      router.replace(`/community/${community.slug}`);
    } catch (caught) {
      setError(caught instanceof AppError ? caught.message : 'Could not create the community.');
      setLoading(false);
    }
  }

  if (!session) return null;

  return (
    <ScreenContainer>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <IconButton label="Close" name="close" onPress={() => (router.canGoBack() ? router.back() : router.navigate('/explore'))} />
        <Text style={[theme.type.section, { color: theme.colors.text }]}>New community</Text>
      </View>
      <View style={{ padding: theme.spacing.lg, gap: theme.spacing.lg }}>
        <Text style={[theme.type.body, { color: theme.colors.secondary }]}>
          You will join it, and you can moderate it. The name is public.
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {COMMUNITY_ICONS.map((item) => {
            const selected = item === icon;
            return (
              <Pressable
                key={item}
                accessibilityLabel={item}
                onPress={() => setIcon(item)}
                style={{
                  borderRadius: theme.radius.pill,
                  padding: 4,
                  borderWidth: 1,
                  borderColor: selected ? theme.colors.primary : 'transparent',
                }}
              >
                <CommunityAvatar icon={item} size={36} />
              </Pressable>
            );
          })}
        </View>
        <TextInput
          autoCapitalize="words"
          maxLength={LIMITS.communityNameMax}
          onChangeText={setName}
          placeholder="Name"
          placeholderTextColor={theme.colors.secondary}
          style={[theme.type.body, fieldStyle(theme)]}
          value={name}
        />
        {slug ? <Text style={[theme.type.caption, { color: theme.colors.secondary }]}>c/{name.trim().replace(/\s+/g, ' ')}</Text> : null}
        <TextInput
          maxLength={LIMITS.communityDescriptionMax}
          multiline
          onChangeText={setDescription}
          placeholder="What is this community for?"
          placeholderTextColor={theme.colors.secondary}
          style={[theme.type.body, fieldStyle(theme), { minHeight: 80, textAlignVertical: 'top' }]}
          value={description}
        />
        <TextInput
          maxLength={LIMITS.communityRulesMax}
          multiline
          onChangeText={setRules}
          placeholder="Rules, if you want to add any"
          placeholderTextColor={theme.colors.secondary}
          style={[theme.type.body, fieldStyle(theme), { minHeight: 80, textAlignVertical: 'top' }]}
          value={rules}
        />
        {error ? <Text style={[theme.type.caption, { color: theme.colors.danger }]}>{error}</Text> : null}
        <PrimaryButton label="Create community" loading={loading} onPress={() => void submit()} />
      </View>
    </ScreenContainer>
  );
}

function fieldStyle(theme: ReturnType<typeof useTheme>) {
  return { borderBottomWidth: 1, borderBottomColor: theme.colors.border, color: theme.colors.text, minHeight: 48 };
}
