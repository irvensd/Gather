import { router, useIsFocused } from 'expo-router';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, View } from 'react-native';

import { CommunityLookPicker, DEFAULT_RULES, TopicPicker } from '@/components/community/CommunityPickers';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import { IconButton } from '@/components/ui/IconButton';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { readableCommunityName } from '@/constants/communities';
import { COMMUNITY_COLORS, type CommunityColorId } from '@/constants/communityColors';
import { type CommunityTopic } from '@/constants/communityTopics';
import { LIMITS } from '@/constants/limits';
import { useAuth } from '@/features/auth/AuthProvider';
import { getApi } from '@/lib/backend';
import { AppError } from '@/lib/backend/errors';
import { COMMUNITY_ICONS, type CommunityIcon, validateCommunityName } from '@/lib/domain/community';
import { usePending } from '@/store/pending';
import { useToast } from '@/store/toast';
import { useTheme } from '@/theme/ThemeProvider';

export default function NewCommunityScreen() {
  const theme = useTheme();
  const { session, ready } = useAuth();
  const focused = useIsFocused();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [rules, setRules] = useState('');
  const [icon, setIcon] = useState<CommunityIcon>(COMMUNITY_ICONS[0]);
  const [color, setColor] = useState<CommunityColorId>(COMMUNITY_COLORS[0].id);
  const [topic, setTopic] = useState<CommunityTopic | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);

  useEffect(() => {
    if (!focused || !ready || session) return;
    usePending.getState().setPending('/new-community');
    router.replace('/(auth)/sign-in');
  }, [focused, ready, session]);

  const cleanName = name.trim().replace(/\s+/g, ' ');
  const nameProblem = cleanName ? validateCommunityName(cleanName) : null;
  const descriptionLength = description.trim().length;
  const descriptionShort = descriptionLength > 0 && descriptionLength < LIMITS.communityDescriptionMin;
  const started = !!(name.trim() || description.trim() || rules.trim() || topic);

  function close() {
    if (router.canGoBack()) router.back();
    else router.navigate('/explore');
  }

  function requestClose() {
    if (started && !loading) setConfirmClose(true);
    else close();
  }

  async function submit() {
    const nameError = validateCommunityName(cleanName);
    if (nameError) {
      setError(nameError);
      return;
    }
    if (!topic) {
      setError('Choose a topic so people can find it in Explore.');
      return;
    }
    if (descriptionLength < LIMITS.communityDescriptionMin) {
      setError(`Describe the community in at least ${LIMITS.communityDescriptionMin} characters.`);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const community = await (await getApi()).createCommunity({
        name: cleanName,
        description: description.trim(),
        rules: rules.trim() || DEFAULT_RULES,
        icon,
        topic,
        color,
      });
      useToast.getState().show(`Created ${readableCommunityName(community.name)}`);
      router.replace(`/community/${community.slug}`);
    } catch (caught) {
      setError(caught instanceof AppError ? caught.message : 'Could not create the community.');
      setLoading(false);
    }
  }

  if (!session) return null;

  const label = (text: string) => <Text style={[theme.type.body, { color: theme.colors.text, fontWeight: '600' }]}>{text}</Text>;
  const helper = (text: string, tone: 'muted' | 'danger' = 'muted') => (
    <Text style={[theme.type.body, { color: tone === 'danger' ? theme.colors.danger : theme.colors.muted }]}>{text}</Text>
  );
  const field = { borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.md, backgroundColor: theme.colors.surface, color: theme.colors.text, paddingHorizontal: theme.spacing.md, minHeight: 48 };

  return (
    <ScreenContainer>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <IconButton label="Close" name="close" onPress={requestClose} />
          <Text accessibilityRole="header" style={[theme.type.section, { color: theme.colors.text }]}>New community</Text>
        </View>
        <ScrollView
          contentContainerStyle={{ padding: theme.spacing.lg, gap: theme.spacing.xl, paddingBottom: 48 }}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
        >
          {helper('You will join it and moderate it. The name and description are public.')}

          <View style={{ gap: theme.spacing.sm }}>
            {label('Name')}
            <TextInput
              accessibilityLabel="Name"
              autoCapitalize="words"
              maxLength={LIMITS.communityNameMax}
              onChangeText={setName}
              placeholder="Small Groups"
              placeholderTextColor={theme.colors.secondary}
              returnKeyType="next"
              style={[theme.type.body, field]}
              value={name}
            />
            {nameProblem
              ? helper(nameProblem, 'danger')
              : helper(`${LIMITS.communityNameMin}–${LIMITS.communityNameMax} characters. Letters, numbers, and spaces. Start with a letter.`)}
            {cleanName && !nameProblem ? (
              <Text style={[theme.type.body, { color: theme.colors.primary, fontWeight: '600' }]}>{readableCommunityName(cleanName)}</Text>
            ) : null}
          </View>

          <View style={{ gap: theme.spacing.md }}>
            {label('Icon and color')}
            <CommunityLookPicker
              color={color}
              icon={icon}
              name={cleanName && !nameProblem ? readableCommunityName(cleanName) : 'Your community'}
              onColor={setColor}
              onIcon={setIcon}
            />
          </View>

          <View style={{ gap: theme.spacing.sm }}>
            {label('Topic')}
            {helper('Where it appears in Explore.')}
            <TopicPicker onChange={setTopic} value={topic} />
          </View>

          <View style={{ gap: theme.spacing.sm }}>
            {label('What is it for?')}
            <TextInput
              accessibilityLabel="What is it for?"
              maxLength={LIMITS.communityDescriptionMax}
              multiline
              onChangeText={setDescription}
              placeholder="Living-room studies, who brings the bread, and how a group stays honest."
              placeholderTextColor={theme.colors.secondary}
              style={[theme.type.body, field, { minHeight: 96, paddingTop: theme.spacing.md, textAlignVertical: 'top' }]}
              value={description}
            />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: theme.spacing.md }}>
              <View style={{ flex: 1 }}>
                {descriptionShort
                  ? helper(`${LIMITS.communityDescriptionMin - descriptionLength} more characters needed.`, 'danger')
                  : helper('Shown under the name in Explore.')}
              </View>
              {helper(`${descriptionLength}/${LIMITS.communityDescriptionMax}`)}
            </View>
          </View>

          <View style={{ gap: theme.spacing.sm }}>
            {label('Rules')}
            <TextInput
              accessibilityLabel="Rules"
              maxLength={LIMITS.communityRulesMax}
              multiline
              onChangeText={setRules}
              placeholder="One rule per line"
              placeholderTextColor={theme.colors.secondary}
              style={[theme.type.body, field, { minHeight: 96, paddingTop: theme.spacing.md, textAlignVertical: 'top' }]}
              value={rules}
            />
            {rules.trim() ? (
              helper(`${rules.trim().length}/${LIMITS.communityRulesMax}`)
            ) : (
              <View style={{ gap: 4, backgroundColor: theme.colors.highlight, borderRadius: theme.radius.md, padding: theme.spacing.md }}>
                <Text style={[theme.type.body, { color: theme.colors.text, fontWeight: '600' }]}>If you leave this blank, it starts with:</Text>
                <Text style={[theme.type.body, { color: theme.colors.text }]}>{DEFAULT_RULES}</Text>
              </View>
            )}
          </View>

          {error ? (
            <Text accessibilityLiveRegion="polite" style={[theme.type.body, { color: theme.colors.danger, fontWeight: '600' }]}>
              {error}
            </Text>
          ) : null}
          <PrimaryButton label="Create community" loading={loading} onPress={() => void submit()} />
        </ScrollView>
      </KeyboardAvoidingView>
      <ConfirmationDialog
        confirmLabel="Discard"
        message="What you typed will not be saved."
        onCancel={() => setConfirmClose(false)}
        onConfirm={() => {
          setConfirmClose(false);
          close();
        }}
        title="Discard this community?"
        visible={confirmClose}
      />
    </ScreenContainer>
  );
}
