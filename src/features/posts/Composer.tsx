import { Ionicons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { usePreventRemove } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CommunityAvatar } from '@/components/community/CommunityAvatar';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SearchField } from '@/components/ui/SearchField';
import { readableCommunityName } from '@/constants/communities';
import { PRAYER_POST_NOTICE, PUBLIC_POST_NOTICE } from '@/constants/guidelines';
import { LIMITS } from '@/constants/limits';
import { POST_TYPES } from '@/constants/postTypes';
import { getApi } from '@/lib/backend';
import { AppError } from '@/lib/backend/errors';
import { browseCommunities } from '@/lib/communityBrowse';
import { persistPostPhoto } from '@/lib/photos';
import { BIBLE_BOOKS } from '@/lib/scripture/books';
import { parseReference } from '@/lib/scripture/parse';
import { postSchema, type PostValues } from '@/lib/validation/schemas';
import { isEmptyDraft, useDraft } from '@/store/draft';
import { useToast } from '@/store/toast';
import { useTheme } from '@/theme/ThemeProvider';
import type { PostType, ScriptureReference } from '@/types';

const TITLE_COUNT_FROM = LIMITS.titleMax - 40;
const BODY_COUNT_FROM = LIMITS.bodyMax - 500;

export function Composer({
  initialCommunityId,
  postId,
  onClose,
  onCreated,
}: {
  initialCommunityId?: string;
  postId?: string;
  onClose: () => void;
  onCreated: (id: string) => void;
}) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const client = useQueryClient();
  const editing = !!postId;
  const [startingDraft] = useState(() => (editing ? null : useDraft.getState().draft));
  const [restored, setRestored] = useState(!!startingDraft);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [communityOpen, setCommunityOpen] = useState(false);
  const [communityQuery, setCommunityQuery] = useState('');
  const [referenceOpen, setReferenceOpen] = useState(false);
  const [referenceDraft, setReferenceDraft] = useState('');
  const [referenceError, setReferenceError] = useState<string | null>(null);
  const [pickedImage, setPickedImage] = useState<string | null | undefined>(startingDraft ? startingDraft.imageUri : undefined);
  const finished = useRef(false);
  const communities = useQuery({ queryKey: ['communities'], queryFn: async () => (await getApi()).listCommunities() });
  const existing = useQuery({
    queryKey: ['post', postId],
    enabled: editing,
    queryFn: async () => (await getApi()).getPost(postId!),
  });
  const form = useForm<PostValues>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      communityId: initialCommunityId ?? startingDraft?.communityId ?? (editing ? '' : (useDraft.getState().lastCommunityId ?? '')),
      type: startingDraft?.type ?? 'discussion',
      title: startingDraft?.title ?? '',
      body: startingDraft?.body ?? '',
      scriptureReferences: startingDraft?.scriptureReferences ?? [],
    },
  });
  useEffect(() => {
    if (existing.data) {
      form.reset({
        communityId: existing.data.communityId,
        type: existing.data.type,
        title: existing.data.title,
        body: existing.data.body,
        scriptureReferences: existing.data.scriptureReferences,
      });
    }
  }, [existing.data, form]);

  const imageUri = pickedImage === undefined ? (existing.data?.imageUri ?? null) : pickedImage;
  const values = useWatch({ control: form.control }) as PostValues;
  const selected = communities.data?.find((community) => community.id === values.communityId);
  const typeMeta = POST_TYPES.find((item) => item.type === values.type);
  const empty = isEmptyDraft({ ...values, imageUri });
  const changed = editing
    ? !!existing.data &&
      (values.title !== existing.data.title ||
        values.body !== existing.data.body ||
        imageUri !== (existing.data.imageUri ?? null) ||
        JSON.stringify(values.scriptureReferences) !== JSON.stringify(existing.data.scriptureReferences))
    : !empty;
  const ready = !!selected && values.title.trim().length >= LIMITS.titleMin && values.body.trim().length > 0;
  const pickerRooms = useMemo(() => browseCommunities(communities.data ?? [], communityQuery), [communities.data, communityQuery]);

  useEffect(() => {
    if (communities.data && values.communityId && !selected && !editing) form.setValue('communityId', '');
  }, [communities.data, values.communityId, selected, editing, form]);

  const snapshot = JSON.stringify({ ...values, imageUri });
  useEffect(() => {
    if (editing) return;
    const timer = setTimeout(() => {
      if (finished.current) return;
      const next = JSON.parse(snapshot) as PostValues & { imageUri: string | null };
      if (isEmptyDraft(next)) useDraft.getState().clearDraft();
      else useDraft.getState().saveDraft(next);
    }, 400);
    return () => clearTimeout(timer);
  }, [snapshot, editing]);

  const [released, setReleased] = useState(false);
  const blockedLeave = useRef<(() => void) | null>(null);
  const disablePrevention = usePreventRemove(changed && !released && !loading, ({ repeat }) => {
    blockedLeave.current = repeat;
    setLeaving(true);
  });

  function release() {
    finished.current = true;
    setReleased(true);
    disablePrevention();
  }

  function leave() {
    release();
    const repeat = blockedLeave.current;
    blockedLeave.current = null;
    if (repeat) repeat();
    else onClose();
  }

  function stay() {
    blockedLeave.current = null;
    setLeaving(false);
  }

  function requestClose() {
    if (changed && !loading) setLeaving(true);
    else leave();
  }

  function discardDraft() {
    useDraft.getState().clearDraft();
    setLeaving(false);
    leave();
  }

  function keepDraft() {
    useDraft.getState().saveDraft({ ...values, imageUri });
    setLeaving(false);
    useToast.getState().show('Draft saved');
    leave();
  }

  function startOver() {
    useDraft.getState().clearDraft();
    form.reset({ communityId: values.communityId, type: 'discussion', title: '', body: '', scriptureReferences: [] });
    setPickedImage(null);
    setRestored(false);
  }

  function addReference(raw: string) {
    const parsed = parseReference(raw);
    if (!parsed) {
      setReferenceError('That is not a recognized passage. Try “John 3:16”.');
      return;
    }
    const current = form.getValues('scriptureReferences');
    if (!current.some((item) => item.raw === parsed.raw)) {
      form.setValue('scriptureReferences', [...current, parsed], { shouldDirty: true });
    }
    setReferenceDraft('');
    setReferenceError(null);
    setReferenceOpen(false);
  }

  async function pickPhoto() {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, quality: 0.8 });
    if (result.canceled || !result.assets[0]) return;
    try {
      setPickedImage(await persistPostPhoto(result.assets[0].uri));
    } catch {
      setError('That photo could not be added.');
    }
  }

  const submitting = useRef(false);
  function publish() {
    if (submitting.current) return;
    submitting.current = true;
    setLoading(true);
    setError(null);
    void form.handleSubmit(
      async (input) => {
        try {
          const api = await getApi();
          const post = postId
            ? await api.updatePost(postId, { title: input.title, body: input.body, scriptureReferences: input.scriptureReferences, imageUri })
            : await api.createPost({ ...input, imageUri });
          release();
          if (!editing) {
            useDraft.getState().clearDraft();
            useDraft.getState().setLastCommunityId(input.communityId);
          }
          await Promise.all([
            client.invalidateQueries({ queryKey: ['feed'] }),
            client.invalidateQueries({ queryKey: ['post', post.id] }),
            client.invalidateQueries({ queryKey: ['community'] }),
            client.invalidateQueries({ queryKey: ['profile-posts'] }),
            client.invalidateQueries({ queryKey: ['search'] }),
          ]);
          useToast.getState().show(editing ? 'Post updated' : `Posted to ${readableCommunityName(selected?.name ?? post.communityName)}`);
          onCreated(post.id);
        } catch (caught) {
          setError(caught instanceof AppError ? caught.message : 'The post could not be published.');
          submitting.current = false;
          setLoading(false);
        }
      },
      () => {
        submitting.current = false;
        setLoading(false);
      },
    )();
  }

  const fieldBox = {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.md,
    color: theme.colors.text,
  };
  const errorText = (message?: string) =>
    message ? <Text style={[theme.type.body, { color: theme.colors.danger }]}>{message}</Text> : null;
  const toolButton = (label: string, icon: keyof typeof Ionicons.glyphMap, onPress: () => void, disabled = false) => (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        minHeight: 44,
        paddingHorizontal: 14,
        borderRadius: theme.radius.pill,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: pressed ? theme.colors.highlight : theme.colors.surface,
        opacity: disabled ? 0.45 : 1,
      })}
    >
      <Ionicons color={theme.colors.primary} name={icon} size={20} />
      <Text style={[theme.type.body, { color: theme.colors.text, fontWeight: '600' }]}>{label}</Text>
    </Pressable>
  );

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View
        style={{
          paddingTop: insets.top,
          paddingHorizontal: theme.spacing.sm,
          flexDirection: 'row',
          alignItems: 'center',
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border,
        }}
      >
        <Pressable accessibilityRole="button" onPress={requestClose} style={{ minHeight: 44, minWidth: 72, justifyContent: 'center', paddingHorizontal: 8 }}>
          <Text style={[theme.type.body, { color: theme.colors.text }]}>Cancel</Text>
        </Pressable>
        <Text accessibilityRole="header" style={[theme.type.section, { flex: 1, textAlign: 'center', color: theme.colors.text }]}>
          {editing ? 'Edit post' : 'New post'}
        </Text>
        <View style={{ minWidth: 72, alignItems: 'flex-end', paddingRight: 4 }}>
          <Pressable
            accessibilityHint={ready ? undefined : 'Add a community, a title, and some text first'}
            accessibilityRole="button"
            accessibilityState={{ disabled: !ready, busy: loading }}
            onPress={publish}
            style={({ pressed }) => ({
              minHeight: 36,
              minWidth: 64,
              marginVertical: 4,
              paddingHorizontal: 16,
              borderRadius: theme.radius.pill,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: theme.colors.primary,
              opacity: !ready ? 0.4 : pressed ? 0.75 : 1,
            })}
            testID="compose-submit"
          >
            {loading ? (
              <ActivityIndicator color={theme.colors.onPrimary} />
            ) : (
              <Text style={[theme.type.body, { color: theme.colors.onPrimary, fontWeight: '700' }]}>{editing ? 'Save' : 'Post'}</Text>
            )}
          </Pressable>
        </View>
      </View>
      <ScrollView
        contentContainerStyle={{ padding: theme.spacing.lg, gap: theme.spacing.lg, paddingBottom: 48 }}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
      >
        {restored ? (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: theme.spacing.sm,
              paddingLeft: theme.spacing.md,
              borderRadius: theme.radius.md,
              backgroundColor: theme.colors.highlight,
            }}
          >
            <Ionicons color={theme.colors.primary} name="document-text-outline" size={20} />
            <Text style={[theme.type.body, { color: theme.colors.text, flex: 1 }]}>Picking up your draft</Text>
            <Pressable accessibilityRole="button" onPress={startOver} style={{ minHeight: 44, justifyContent: 'center', paddingHorizontal: theme.spacing.md }}>
              <Text style={[theme.type.body, { color: theme.colors.primary, fontWeight: '600' }]}>Start over</Text>
            </Pressable>
          </View>
        ) : null}

        <Controller
          control={form.control}
          name="communityId"
          render={({ fieldState }) => (
            <View style={{ gap: 6 }}>
              <Pressable
                accessibilityHint={editing ? 'The community cannot be changed after posting' : 'Opens the list of communities'}
                accessibilityLabel={selected ? `Community, ${readableCommunityName(selected.name)}` : 'Choose a community'}
                accessibilityRole="button"
                disabled={editing}
                onPress={() => setCommunityOpen(true)}
                style={({ pressed }) => ({
                  ...fieldBox,
                  minHeight: 56,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: theme.spacing.md,
                  backgroundColor: pressed ? theme.colors.highlight : theme.colors.surface,
                  borderColor: fieldState.error ? theme.colors.danger : theme.colors.border,
                })}
              >
                {selected ? (
                  <CommunityAvatar color={selected.color} icon={selected.icon} size={32} />
                ) : (
                  <Ionicons color={theme.colors.muted} name="people-outline" size={24} />
                )}
                <Text numberOfLines={1} style={[theme.type.body, { flex: 1, color: theme.colors.text, fontWeight: selected ? '600' : '400' }]}>
                  {selected ? readableCommunityName(selected.name) : 'Choose a community'}
                </Text>
                {editing ? null : <Ionicons color={theme.colors.muted} name="chevron-down" size={20} />}
              </Pressable>
              {errorText(fieldState.error ? 'Choose a community.' : undefined)}
            </View>
          )}
        />

        <View style={{ gap: theme.spacing.sm }}>
          <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
            {POST_TYPES.map((item) => {
              const selectedType = values.type === item.type;
              return (
                <Pressable
                  key={item.type}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: selectedType }}
                  onPress={() => form.setValue('type', item.type)}
                  style={{
                    minHeight: 44,
                    paddingHorizontal: 16,
                    borderRadius: theme.radius.pill,
                    justifyContent: 'center',
                    borderWidth: 1,
                    borderColor: selectedType ? theme.colors.primary : theme.colors.border,
                    backgroundColor: selectedType ? theme.colors.primary : theme.colors.surface,
                  }}
                >
                  <Text style={[theme.type.body, { color: selectedType ? theme.colors.onPrimary : theme.colors.text, fontWeight: '600' }]}>{item.label}</Text>
                </Pressable>
              );
            })}
          </View>
          {typeMeta ? <Text style={[theme.type.body, { color: theme.colors.muted }]}>{typeMeta.hint}</Text> : null}
        </View>

        <Controller
          control={form.control}
          name="title"
          render={({ field, fieldState }) => (
            <View style={{ gap: 6 }}>
              <TextInput
                accessibilityLabel="Title"
                maxLength={LIMITS.titleMax}
                multiline
                onChangeText={field.onChange}
                placeholder={typeMeta?.example ?? 'Title'}
                placeholderTextColor={theme.colors.secondary}
                style={[
                  theme.type.title,
                  fieldBox,
                  { fontSize: 20, lineHeight: 26, fontWeight: '700', minHeight: 56, paddingTop: 14, paddingBottom: 14 },
                  fieldState.error ? { borderColor: theme.colors.danger } : null,
                ]}
                submitBehavior="blurAndSubmit"
                testID="compose-title"
                value={field.value}
              />
              {errorText(fieldState.error?.message)}
              {field.value.length >= TITLE_COUNT_FROM ? (
                <Text style={[theme.type.caption, { color: theme.colors.muted, textAlign: 'right' }]}>{field.value.length}/{LIMITS.titleMax}</Text>
              ) : null}
            </View>
          )}
        />

        <Controller
          control={form.control}
          name="body"
          render={({ field, fieldState }) => (
            <View style={{ gap: 6 }}>
              <TextInput
                accessibilityLabel="Body"
                maxLength={LIMITS.bodyMax}
                multiline
                onChangeText={field.onChange}
                placeholder="Say more. Add the context people need to answer well."
                placeholderTextColor={theme.colors.secondary}
                style={[
                  theme.type.body,
                  fieldBox,
                  { minHeight: 180, paddingTop: theme.spacing.md, paddingBottom: theme.spacing.md, textAlignVertical: 'top' },
                  fieldState.error ? { borderColor: theme.colors.danger } : null,
                ]}
                testID="compose-body"
                value={field.value}
              />
              {errorText(fieldState.error?.message)}
              {field.value.length >= BODY_COUNT_FROM ? (
                <Text style={[theme.type.caption, { color: theme.colors.muted, textAlign: 'right' }]}>{field.value.length}/{LIMITS.bodyMax}</Text>
              ) : null}
            </View>
          )}
        />

        {imageUri ? (
          <View>
            <Image accessibilityLabel="Attached photo" contentFit="cover" source={{ uri: imageUri }} style={{ width: '100%', height: 220, borderRadius: theme.radius.md }} />
            <Pressable
              accessibilityLabel="Remove photo"
              accessibilityRole="button"
              onPress={() => setPickedImage(null)}
              style={{
                position: 'absolute',
                top: 8,
                right: 8,
                width: 44,
                height: 44,
                borderRadius: 22,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(0,0,0,0.6)',
              }}
            >
              <Ionicons color="#FFFFFF" name="close" size={22} />
            </Pressable>
          </View>
        ) : null}

        {values.scriptureReferences.length > 0 ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
            {values.scriptureReferences.map((reference) => (
              <View
                key={reference.raw}
                style={{ flexDirection: 'row', alignItems: 'center', paddingLeft: 14, borderRadius: theme.radius.pill, backgroundColor: theme.colors.highlight }}
              >
                <Ionicons color={theme.colors.primary} name="book-outline" size={18} />
                <Text style={[theme.type.body, { color: theme.colors.text, fontWeight: '600', marginLeft: 6 }]}>{reference.raw}</Text>
                <Pressable
                  accessibilityLabel={`Remove ${reference.raw}`}
                  accessibilityRole="button"
                  onPress={() =>
                    form.setValue(
                      'scriptureReferences',
                      values.scriptureReferences.filter((item) => item.raw !== reference.raw),
                    )
                  }
                  style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}
                >
                  <Ionicons color={theme.colors.muted} name="close-circle" size={20} />
                </Pressable>
              </View>
            ))}
          </View>
        ) : null}

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
          {toolButton(imageUri ? 'Change photo' : 'Photo', 'image-outline', () => void pickPhoto())}
          {toolButton('Scripture', 'book-outline', () => setReferenceOpen(true), values.scriptureReferences.length >= LIMITS.scripturePerPost)}
        </View>

        <View style={{ gap: theme.spacing.sm }}>
          <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
            <Ionicons color={theme.colors.muted} name="globe-outline" size={18} style={{ marginTop: 2 }} />
            <Text style={[theme.type.body, { color: theme.colors.muted, flex: 1 }]}>{PUBLIC_POST_NOTICE}</Text>
          </View>
          {values.type === 'prayer_request' ? (
            <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
              <Ionicons color={theme.colors.muted} name="shield-checkmark-outline" size={18} style={{ marginTop: 2 }} />
              <Text style={[theme.type.body, { color: theme.colors.muted, flex: 1 }]}>{PRAYER_POST_NOTICE}</Text>
            </View>
          ) : null}
        </View>

        {error ? (
          <Text accessibilityLiveRegion="polite" style={[theme.type.body, { color: theme.colors.danger, fontWeight: '600' }]}>
            {error}
          </Text>
        ) : null}
      </ScrollView>

      <BottomSheet
        onClose={() => {
          setCommunityOpen(false);
          setCommunityQuery('');
        }}
        visible={communityOpen}
      >
        <View style={{ gap: theme.spacing.md }}>
          <Text accessibilityRole="header" style={[theme.type.section, { color: theme.colors.text }]}>
            Post to
          </Text>
          <SearchField onChangeText={setCommunityQuery} placeholder="Find a community" value={communityQuery} />
          <ScrollView keyboardShouldPersistTaps="handled" style={{ maxHeight: 420 }}>
            {pickerRooms.length === 0 ? (
              <Text style={[theme.type.body, { color: theme.colors.muted, paddingVertical: theme.spacing.lg }]}>No communities match.</Text>
            ) : null}
            {pickerRooms.map((community) => {
              const current = community.id === values.communityId;
              return (
                <Pressable
                  key={community.id}
                  accessibilityRole="button"
                  accessibilityState={{ selected: current }}
                  onPress={() => {
                    form.setValue('communityId', community.id, { shouldValidate: true });
                    setCommunityOpen(false);
                    setCommunityQuery('');
                  }}
                  style={({ pressed }) => ({
                    minHeight: 60,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: theme.spacing.md,
                    paddingVertical: theme.spacing.sm,
                    backgroundColor: pressed ? theme.colors.highlight : 'transparent',
                  })}
                >
                  <CommunityAvatar color={community.color} icon={community.icon} size={36} />
                  <View style={{ flex: 1 }}>
                    <Text numberOfLines={1} style={[theme.type.body, { color: theme.colors.text, fontWeight: '600' }]}>
                      {readableCommunityName(community.name)}
                    </Text>
                    <Text numberOfLines={1} style={[theme.type.caption, { color: theme.colors.muted }]}>
                      {community.joined ? 'Joined' : community.description}
                    </Text>
                  </View>
                  {current ? <Ionicons color={theme.colors.primary} name="checkmark" size={22} /> : null}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </BottomSheet>

      <BottomSheet onClose={() => setReferenceOpen(false)} visible={referenceOpen}>
        <View style={{ gap: theme.spacing.md }}>
          <Text accessibilityRole="header" style={[theme.type.section, { color: theme.colors.text }]}>
            Add Scripture
          </Text>
          <TextInput
            accessibilityLabel="Passage"
            autoCapitalize="words"
            autoCorrect={false}
            onChangeText={(text) => {
              setReferenceDraft(text);
              setReferenceError(null);
            }}
            onSubmitEditing={() => addReference(referenceDraft)}
            placeholder="John 3:16"
            placeholderTextColor={theme.colors.secondary}
            returnKeyType="done"
            style={[theme.type.body, fieldBox, { minHeight: 48 }]}
            value={referenceDraft}
          />
          {errorText(referenceError ?? undefined)}
          <PrimaryButton label="Add passage" onPress={() => addReference(referenceDraft)} />
          <ScrollView keyboardShouldPersistTaps="handled" style={{ maxHeight: 220 }}>
            {BIBLE_BOOKS.filter((book) => book.name.toLowerCase().includes(referenceDraft.trim().toLowerCase()))
              .slice(0, 8)
              .map((book) => (
                <Pressable
                  key={book.id}
                  accessibilityRole="button"
                  onPress={() => setReferenceDraft(book.name + ' ')}
                  style={({ pressed }) => ({ minHeight: 44, justifyContent: 'center', backgroundColor: pressed ? theme.colors.highlight : 'transparent' })}
                >
                  <Text style={[theme.type.body, { color: theme.colors.text }]}>{book.name}</Text>
                </Pressable>
              ))}
          </ScrollView>
        </View>
      </BottomSheet>

      {editing ? (
        <ConfirmationDialog
          confirmLabel="Discard changes"
          message="Your edits to this post will be lost."
          onCancel={stay}
          onConfirm={() => {
            setLeaving(false);
            leave();
          }}
          title="Discard your changes?"
          visible={leaving}
        />
      ) : (
        <ConfirmationDialog
          confirmLabel="Save draft"
          message="Keep it on this phone and finish it later from Create."
          onCancel={stay}
          onConfirm={keepDraft}
          onSecondary={discardDraft}
          secondaryLabel="Discard"
          title="Save this post as a draft?"
          visible={leaving}
        />
      )}
    </KeyboardAvoidingView>
  );
}

export type { PostType, ScriptureReference };
