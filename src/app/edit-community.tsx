import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams, usePreventRemove } from 'expo-router';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { CommunityLookPicker, DEFAULT_RULES, TopicPicker } from '@/components/community/CommunityPickers';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import { IconButton } from '@/components/ui/IconButton';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { readableCommunityName } from '@/constants/communities';
import { communityColorFor, type CommunityColorId } from '@/constants/communityColors';
import { isCommunityTopic, type CommunityTopic } from '@/constants/communityTopics';
import { LIMITS } from '@/constants/limits';
import { useAuth } from '@/features/auth/AuthProvider';
import { getApi } from '@/lib/backend';
import { AppError } from '@/lib/backend/errors';
import { COMMUNITY_ICONS, type CommunityIcon } from '@/lib/domain/community';
import { usePending } from '@/store/pending';
import { useToast } from '@/store/toast';
import { useTheme } from '@/theme/ThemeProvider';
import type { Community, CommunityModerator } from '@/types';

function close(slug: string) {
  if (router.canGoBack()) router.back();
  else router.navigate(`/community/${slug}`);
}

export default function EditCommunityScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const theme = useTheme();
  const { session, ready } = useAuth();
  const community = useQuery({ queryKey: ['community', slug], enabled: !!slug, queryFn: async () => (await getApi()).getCommunity(slug) });
  const capabilities = useQuery({ queryKey: ['capabilities'], enabled: !!session, queryFn: async () => (await getApi()).getCapabilities() });

  useEffect(() => {
    if (!ready || session) return;
    usePending.getState().setPending(`/edit-community?slug=${slug}`);
    router.replace('/(auth)/sign-in');
  }, [ready, session, slug]);

  if (!session) return null;
  const item = community.data;
  const caps = capabilities.data;
  const allowed = !!item && !!caps && (caps.isAdmin || caps.communityIds.includes(item.id));

  if (!item || !caps || !allowed) {
    return (
      <ScreenContainer>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <IconButton label="Close" name="close" onPress={() => close(slug)} />
          <Text accessibilityRole="header" style={[theme.type.section, { color: theme.colors.text }]}>
            Edit community
          </Text>
        </View>
        {community.isLoading || capabilities.isLoading ? (
          <LoadingSkeleton />
        ) : (
          <Text style={[theme.type.body, { color: theme.colors.muted, padding: theme.spacing.lg }]}>Only this community’s moderators can edit it.</Text>
        )}
      </ScreenContainer>
    );
  }
  return <EditCommunityForm community={item} isAdmin={caps.isAdmin} />;
}

function EditCommunityForm({ community, isAdmin }: { community: Community; isAdmin: boolean }) {
  const theme = useTheme();
  const client = useQueryClient();
  const { session } = useAuth();
  const [initial] = useState(() => ({
    description: community.description,
    rules: community.rules,
    icon: (COMMUNITY_ICONS as readonly string[]).includes(community.icon) ? (community.icon as CommunityIcon) : COMMUNITY_ICONS[0],
    color: communityColorFor(community.id, community.color),
    topic: isCommunityTopic(community.topic) && community.topic !== 'more' ? community.topic : null,
  }));
  const [description, setDescription] = useState(initial.description);
  const [rules, setRules] = useState(initial.rules);
  const [icon, setIcon] = useState<CommunityIcon>(initial.icon);
  const [color, setColor] = useState<CommunityColorId>(initial.color);
  const [topic, setTopic] = useState<CommunityTopic | null>(initial.topic);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [leaving, setLeaving] = useState<(() => void) | null>(null);

  const changed = description !== initial.description || rules !== initial.rules || icon !== initial.icon || color !== initial.color || topic !== initial.topic;
  const descriptionLength = description.trim().length;
  const descriptionShort = descriptionLength < LIMITS.communityDescriptionMin;

  const disablePrevention = usePreventRemove(changed && !saving, ({ repeat }) => setLeaving(() => repeat));

  async function save() {
    if (!topic) {
      setError('Choose a topic so people can find it in Explore.');
      return;
    }
    if (descriptionShort) {
      setError(`Describe the community in at least ${LIMITS.communityDescriptionMin} characters.`);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const updated = await (await getApi()).updateCommunity(community.id, { description, rules: rules.trim() || DEFAULT_RULES, icon, color, topic });
      client.setQueryData(['community', community.slug], updated);
      await Promise.all([
        client.invalidateQueries({ queryKey: ['communities'] }),
        client.invalidateQueries({ queryKey: ['feed'] }),
        client.invalidateQueries({ queryKey: ['search'] }),
      ]);
      useToast.getState().show('Community updated');
      disablePrevention();
      close(community.slug);
    } catch (caught) {
      setError(caught instanceof AppError ? caught.message : 'Could not save your changes.');
      setSaving(false);
    }
  }

  const label = (text: string) => <Text style={[theme.type.body, { color: theme.colors.text, fontWeight: '600' }]}>{text}</Text>;
  const helper = (text: string, tone: 'muted' | 'danger' = 'muted') => (
    <Text style={[theme.type.body, { color: tone === 'danger' ? theme.colors.danger : theme.colors.muted }]}>{text}</Text>
  );
  const field = {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface,
    color: theme.colors.text,
    paddingHorizontal: theme.spacing.md,
    minHeight: 96,
    paddingTop: theme.spacing.md,
    textAlignVertical: 'top' as const,
  };

  return (
    <ScreenContainer>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingRight: theme.spacing.lg }}>
          <IconButton label="Close" name="close" onPress={() => close(community.slug)} />
          <Text accessibilityRole="header" numberOfLines={1} style={[theme.type.section, { color: theme.colors.text, flex: 1 }]}>
            Edit {readableCommunityName(community.name)}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: !changed || saving }}
            disabled={!changed || saving}
            hitSlop={8}
            onPress={() => void save()}
            style={{ minHeight: 44, justifyContent: 'center', opacity: changed && !saving ? 1 : 0.4 }}
            testID="edit-community-save"
          >
            <Text style={[theme.type.body, { color: theme.colors.primary, fontWeight: '700' }]}>{saving ? 'Saving…' : 'Save'}</Text>
          </Pressable>
        </View>
        <ScrollView
          contentContainerStyle={{ padding: theme.spacing.lg, gap: theme.spacing.xl, paddingBottom: 48 }}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
        >
          {helper('The name stays the same so links keep working.')}

          <View style={{ gap: theme.spacing.md }}>
            {label('Icon and color')}
            <CommunityLookPicker color={color} icon={icon} name={readableCommunityName(community.name)} onColor={setColor} onIcon={setIcon} />
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
              style={[theme.type.body, field]}
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
              style={[theme.type.body, field, { minHeight: 120 }]}
              value={rules}
            />
            {helper(rules.trim() ? `${rules.trim().length}/${LIMITS.communityRulesMax}` : 'Leave blank to use the default rules.')}
          </View>

          {error ? (
            <Text accessibilityLiveRegion="polite" style={[theme.type.body, { color: theme.colors.danger, fontWeight: '600' }]}>
              {error}
            </Text>
          ) : null}
          <PrimaryButton disabled={!changed} label="Save changes" loading={saving} onPress={() => void save()} />

          <ModeratorsSection
            community={community}
            isAdmin={isAdmin}
            onSteppedDown={() => {
              disablePrevention();
              close(community.slug);
            }}
            userId={session?.userId ?? null}
          />
        </ScrollView>
      </KeyboardAvoidingView>
      <ConfirmationDialog
        confirmLabel="Discard"
        message="Your edits to this community will not be saved."
        onCancel={() => setLeaving(null)}
        onConfirm={() => {
          const go = leaving;
          setLeaving(null);
          go?.();
        }}
        title="Discard your changes?"
        visible={!!leaving}
      />
    </ScreenContainer>
  );
}

function ModeratorsSection({
  community,
  isAdmin,
  userId,
  onSteppedDown,
}: {
  community: Community;
  isAdmin: boolean;
  userId: string | null;
  onSteppedDown: () => void;
}) {
  const theme = useTheme();
  const client = useQueryClient();
  const [username, setUsername] = useState('');
  const [addError, setAddError] = useState<string | null>(null);
  const [removing, setRemoving] = useState<CommunityModerator | null>(null);
  const queryKey = ['community-moderators', community.id];
  const moderators = useQuery({ queryKey, queryFn: async () => (await getApi()).listCommunityModerators(community.id) });
  const me = moderators.data?.find((moderator) => moderator.userId === userId);
  const canManage = isAdmin || !!me?.isStarter;

  const add = useMutation({
    mutationFn: async (name: string) => (await getApi()).addCommunityModerator(community.id, name),
    onSuccess: async (added) => {
      setUsername('');
      setAddError(null);
      useToast.getState().show(`@${added.username} is now a moderator`);
      await client.invalidateQueries({ queryKey });
    },
    onError: (error) => setAddError(error instanceof AppError ? error.message : 'Could not add that moderator.'),
  });

  const remove = useMutation({
    mutationFn: async (moderator: CommunityModerator) => (await getApi()).removeCommunityModerator(community.id, moderator.userId),
    onSuccess: async (_result, moderator) => {
      const self = moderator.userId === userId;
      useToast.getState().show(self ? 'You stepped down as a moderator' : `@${moderator.username} is no longer a moderator`);
      await Promise.all([client.invalidateQueries({ queryKey }), client.invalidateQueries({ queryKey: ['capabilities'] })]);
      if (self && !isAdmin) onSteppedDown();
    },
    onError: (error) => useToast.getState().show(error instanceof AppError ? error.message : 'Could not change moderators.'),
  });

  return (
    <View style={{ gap: theme.spacing.md, borderTopWidth: 1, borderTopColor: theme.colors.border, paddingTop: theme.spacing.xl }}>
      <Text accessibilityRole="header" style={[theme.type.section, { color: theme.colors.text }]}>
        Moderators
      </Text>
      <Text style={[theme.type.body, { color: theme.colors.muted }]}>
        Moderators can edit this page, remove posts and comments, lock discussions, and review reports.
        {canManage ? '' : ' Only the person who started the community can add or remove moderators.'}
      </Text>
      {moderators.isLoading ? <LoadingSkeleton /> : null}
      {moderators.data?.map((moderator) => {
        const self = moderator.userId === userId;
        const action = moderator.isStarter ? null : self ? 'Step down' : canManage ? 'Remove' : null;
        return (
          <View key={moderator.userId} style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md, minHeight: 56 }}>
            <Pressable
              accessibilityRole="link"
              onPress={() => router.push(`/user/${moderator.username}`)}
              style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md }}
            >
              <UserAvatar name={moderator.displayName || moderator.username} path={moderator.avatarPath} size={40} />
              <View style={{ flex: 1 }}>
                <Text numberOfLines={1} style={[theme.type.body, { color: theme.colors.text, fontWeight: '600' }]}>
                  {moderator.displayName || moderator.username}
                  {self ? ' (you)' : ''}
                </Text>
                <Text numberOfLines={1} style={[theme.type.body, { color: theme.colors.muted }]}>
                  @{moderator.username}
                  {moderator.isStarter ? ' · Started it' : ''}
                </Text>
              </View>
            </Pressable>
            {action ? (
              <Pressable
                accessibilityLabel={self ? 'Step down as moderator' : `Remove @${moderator.username} as moderator`}
                accessibilityRole="button"
                hitSlop={6}
                onPress={() => setRemoving(moderator)}
                style={{ minHeight: 44, justifyContent: 'center', paddingHorizontal: theme.spacing.sm }}
              >
                <Text style={[theme.type.body, { color: theme.colors.danger, fontWeight: '600' }]}>{action}</Text>
              </Pressable>
            ) : null}
          </View>
        );
      })}
      {canManage ? (
        <View style={{ gap: theme.spacing.sm }}>
          <Text style={[theme.type.body, { color: theme.colors.text, fontWeight: '600' }]}>Add a moderator</Text>
          <View style={{ flexDirection: 'row', gap: theme.spacing.sm, alignItems: 'center' }}>
            <View
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                minHeight: 48,
                borderWidth: 1,
                borderColor: theme.colors.border,
                borderRadius: theme.radius.md,
                backgroundColor: theme.colors.surface,
                paddingHorizontal: theme.spacing.md,
              }}
            >
              <Ionicons color={theme.colors.muted} name="at" size={18} />
              <TextInput
                accessibilityLabel="Username"
                autoCapitalize="none"
                autoCorrect={false}
                onChangeText={(value) => {
                  setUsername(value);
                  setAddError(null);
                }}
                onSubmitEditing={() => username.trim() && add.mutate(username)}
                placeholder="username"
                placeholderTextColor={theme.colors.secondary}
                returnKeyType="done"
                style={[theme.type.body, { flex: 1, color: theme.colors.text, marginLeft: 4, minHeight: 46 }]}
                value={username}
              />
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: !username.trim() || add.isPending }}
              disabled={!username.trim() || add.isPending}
              onPress={() => add.mutate(username)}
              style={{
                minHeight: 48,
                paddingHorizontal: 18,
                borderRadius: theme.radius.md,
                justifyContent: 'center',
                backgroundColor: theme.colors.primary,
                opacity: username.trim() && !add.isPending ? 1 : 0.4,
              }}
            >
              <Text style={[theme.type.body, { color: theme.colors.onPrimary, fontWeight: '600' }]}>Add</Text>
            </Pressable>
          </View>
          {addError ? (
            <Text accessibilityLiveRegion="polite" style={[theme.type.body, { color: theme.colors.danger }]}>
              {addError}
            </Text>
          ) : (
            <Text style={[theme.type.body, { color: theme.colors.muted }]}>They need to be a member of the community first.</Text>
          )}
        </View>
      ) : null}
      <ConfirmationDialog
        confirmLabel={removing?.userId === userId ? 'Step down' : 'Remove'}
        message={
          removing?.userId === userId
            ? 'You will no longer be able to moderate this community.'
            : 'They will no longer be able to moderate this community. They stay a member.'
        }
        onCancel={() => setRemoving(null)}
        onConfirm={() => {
          const target = removing;
          setRemoving(null);
          if (target) remove.mutate(target);
        }}
        title={removing?.userId === userId ? 'Step down as moderator?' : `Remove @${removing?.username ?? ''}?`}
        visible={!!removing}
      />
    </View>
  );
}
