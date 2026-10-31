import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useRef, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CommunityAvatar } from '@/components/community/CommunityAvatar';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { POST_TYPES } from '@/constants/postTypes';
import { PUBLIC_POST_NOTICE } from '@/constants/guidelines';
import { LIMITS } from '@/constants/limits';
import { getApi } from '@/lib/backend';
import { AppError } from '@/lib/backend/errors';
import { isPostReady } from '@/lib/domain/composer';
import { persistPostPhoto } from '@/lib/photos';
import { BIBLE_BOOKS } from '@/lib/scripture/books';
import { parseReference } from '@/lib/scripture/parse';
import { postSchema, type PostValues } from '@/lib/validation/schemas';
import { useComposerDraft } from '@/store/composerDraft';
import { useTheme } from '@/theme/ThemeProvider';
import type { PostType, ScriptureReference } from '@/types';

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
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [discard, setDiscard] = useState(false);
  const [communityOpen, setCommunityOpen] = useState(false);
  const [referenceOpen, setReferenceOpen] = useState(false);
  const [referenceDraft, setReferenceDraft] = useState('');
  const [referenceError, setReferenceError] = useState<string | null>(null);
  const [titleFocused, setTitleFocused] = useState(false);
  const [bodyFocused, setBodyFocused] = useState(false);
  const [pickedImage, setPickedImage] = useState<string | null | undefined>(undefined);
  const savedDraft = useComposerDraft((state) => state.draft);
  const saveDraft = useComposerDraft((state) => state.save);
  const clearDraft = useComposerDraft((state) => state.clear);
  const communities = useQuery({ queryKey: ['communities'], queryFn: async () => (await getApi()).listCommunities() });
  const existing = useQuery({
    queryKey: ['post', postId],
    enabled: !!postId,
    queryFn: async () => (await getApi()).getPost(postId!),
  });
  const form = useForm<PostValues>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      communityId: initialCommunityId ?? savedDraft?.communityId ?? '',
      type: savedDraft?.type ?? 'discussion',
      title: savedDraft?.title ?? '',
      body: savedDraft?.body ?? '',
      scriptureReferences: savedDraft?.scriptureReferences ?? [],
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

  const imageUri = pickedImage === undefined ? (postId ? (existing.data?.imageUri ?? null) : (savedDraft?.imageUri ?? null)) : pickedImage;
  const values = useWatch({ control: form.control }) as PostValues;
  const dirty =
    values.title.trim().length > 0 ||
    values.body.trim().length > 0 ||
    values.communityId.length > 0 ||
    values.scriptureReferences.length > 0 ||
    imageUri !== (existing.data?.imageUri ?? null);
  const selected = communities.data?.find((community) => community.id === values.communityId);
  const typeMeta = POST_TYPES.find((item) => item.type === values.type);
  const canPublish = isPostReady(values) && !loading;

  useEffect(() => {
    if (postId) return;
    saveDraft({
      communityId: values.communityId ?? '',
      type: values.type ?? 'discussion',
      title: values.title ?? '',
      body: values.body ?? '',
      scriptureReferences: values.scriptureReferences ?? [],
      imageUri,
    });
  }, [imageUri, postId, saveDraft, values.body, values.communityId, values.scriptureReferences, values.title, values.type]);

  function requestClose() {
    if (dirty && !postId) setDiscard(true);
    else onClose();
  }

  function addReference(raw: string) {
    const parsed = parseReference(raw);
    if (!parsed) {
      setReferenceError('That is not a recognized passage.');
      return;
    }
    const current = form.getValues('scriptureReferences');
    if (current.some((item) => item.raw === parsed.raw)) {
      setReferenceOpen(false);
      return;
    }
    form.setValue('scriptureReferences', [...current, parsed], { shouldDirty: true });
    setReferenceDraft('');
    setReferenceError(null);
    setReferenceOpen(false);
  }

  const submitting = useRef(false);
  function publish() {
    if (submitting.current || !canPublish) return;
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
          clearDraft();
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

  const fieldStyle = (focused: boolean) => [
    theme.type.body,
    {
      color: theme.colors.text,
      borderWidth: 1,
      borderColor: focused ? theme.colors.primary : theme.colors.border,
      borderRadius: theme.radius.md,
      backgroundColor: theme.colors.surface,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: 12,
      minHeight: 48,
    },
  ];

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View style={{ paddingTop: insets.top, flexDirection: 'row', alignItems: 'center', paddingHorizontal: theme.spacing.sm, minHeight: theme.layout.touchTarget }}>
        <Pressable accessibilityRole="button" onPress={requestClose} style={{ minHeight: 44, justifyContent: 'center', paddingHorizontal: 12 }}>
          <Text style={[theme.type.body, { color: theme.colors.secondary }]}>Cancel</Text>
        </Pressable>
        <Text style={[theme.type.section, { flex: 1, textAlign: 'center', color: theme.colors.text }]}>{postId ? 'Edit post' : 'New post'}</Text>
        <View style={{ width: 72 }} />
      </View>
      <ScrollView contentContainerStyle={{ padding: theme.spacing.lg, gap: theme.spacing.md, paddingBottom: 24 }} keyboardShouldPersistTaps="handled">
        <Pressable
          accessibilityRole="button"
          onPress={() => !postId && setCommunityOpen(true)}
          style={{
            minHeight: 52,
            flexDirection: 'row',
            alignItems: 'center',
            gap: theme.spacing.sm,
            borderWidth: 1,
            borderColor: theme.colors.border,
            borderRadius: theme.radius.md,
            backgroundColor: theme.colors.surface,
            paddingHorizontal: theme.spacing.md,
          }}
          testID="compose-community"
        >
          {selected ? <CommunityAvatar icon={selected.icon} size={28} /> : null}
          <View style={{ flex: 1 }}>
            <Text style={[theme.type.label, { color: theme.colors.secondary }]}>Community</Text>
            <Text style={[theme.type.body, { color: selected ? theme.colors.text : theme.colors.secondary }]}>{selected ? selected.name : 'Choose a community'}</Text>
          </View>
        </Pressable>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingRight: theme.spacing.lg }}>
          {POST_TYPES.map((item) => {
            const selectedType = values.type === item.type;
            return (
              <Pressable
                key={item.type}
                onPress={() => form.setValue('type', item.type)}
                style={{
                  borderRadius: theme.radius.pill,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  minHeight: 36,
                  justifyContent: 'center',
                  backgroundColor: selectedType ? theme.colors.primary : theme.colors.highlight,
                }}
              >
                <Text style={[theme.type.caption, { color: selectedType ? theme.colors.onPrimary : theme.colors.text, fontWeight: '600' }]}>{item.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
        <Text style={[theme.type.caption, { color: theme.colors.secondary }]}>
          {typeMeta?.hint} Example: {typeMeta?.example}
        </Text>
        <Controller
          control={form.control}
          name="title"
          render={({ field, fieldState }) => (
            <View style={{ gap: 6 }}>
              <Text style={[theme.type.label, { color: theme.colors.secondary }]}>Title</Text>
              <TextInput
                accessibilityLabel="Title"
                maxLength={LIMITS.titleMax}
                onBlur={() => {
                  field.onBlur();
                  setTitleFocused(false);
                }}
                onChangeText={field.onChange}
                onFocus={() => setTitleFocused(true)}
                placeholder="A clear title"
                placeholderTextColor={theme.colors.secondary}
                style={fieldStyle(titleFocused)}
                testID="compose-title"
                value={field.value}
              />
              {fieldState.error ? <Text style={[theme.type.caption, { color: theme.colors.danger }]}>{fieldState.error.message}</Text> : null}
            </View>
          )}
        />
        <Controller
          control={form.control}
          name="body"
          render={({ field, fieldState }) => (
            <View style={{ gap: 6 }}>
              <Text style={[theme.type.label, { color: theme.colors.secondary }]}>Body</Text>
              <TextInput
                accessibilityLabel="Body"
                maxLength={LIMITS.bodyMax}
                multiline
                onBlur={() => {
                  field.onBlur();
                  setBodyFocused(false);
                }}
                onChangeText={field.onChange}
                onFocus={() => setBodyFocused(true)}
                placeholder="Write the post"
                placeholderTextColor={theme.colors.secondary}
                style={[fieldStyle(bodyFocused), { minHeight: 140, textAlignVertical: 'top' }]}
                testID="compose-body"
                value={field.value}
              />
              <Text style={[theme.type.caption, { color: theme.colors.secondary }]}>
                {field.value.length}/{LIMITS.bodyMax}
              </Text>
              {fieldState.error ? <Text style={[theme.type.caption, { color: theme.colors.danger }]}>{fieldState.error.message}</Text> : null}
            </View>
          )}
        />
        <View style={{ gap: 8 }}>
          {imageUri ? (
            <View>
              <Image source={{ uri: imageUri }} style={{ width: '100%', height: 180, borderRadius: theme.radius.md }} contentFit="cover" />
              <Pressable onPress={() => setPickedImage(null)} style={{ minHeight: 44, justifyContent: 'center' }}>
                <Text style={[theme.type.body, { color: theme.colors.danger }]}>Remove photo</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable
              onPress={async () => {
                const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, quality: 0.8 });
                if (result.canceled || !result.assets[0]) return;
                try {
                  setPickedImage(await persistPostPhoto(result.assets[0].uri));
                } catch {
                  setError('That photo could not be added.');
                }
              }}
              style={{ minHeight: 44, justifyContent: 'center' }}
            >
              <Text style={[theme.type.body, { color: theme.colors.primary, fontWeight: '600' }]}>Add a photo</Text>
            </Pressable>
          )}
          <Pressable onPress={() => setReferenceOpen(true)} style={{ minHeight: 44, justifyContent: 'center' }}>
            <Text style={[theme.type.body, { color: theme.colors.primary, fontWeight: '600' }]}>Add Scripture reference</Text>
          </Pressable>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {values.scriptureReferences.map((reference) => (
              <Pressable
                key={reference.raw}
                onPress={() => form.setValue('scriptureReferences', values.scriptureReferences.filter((item) => item.raw !== reference.raw))}
                style={{
                  backgroundColor: theme.colors.highlight,
                  borderRadius: theme.radius.pill,
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                }}
              >
                <Text style={[theme.type.caption, { color: theme.colors.primary }]}>{reference.raw} ×</Text>
              </Pressable>
            ))}
          </View>
        </View>
        <Text style={[theme.type.caption, { color: theme.colors.secondary }]}>{PUBLIC_POST_NOTICE}</Text>
        {values.type === 'prayer_request' ? (
          <Text style={[theme.type.caption, { color: theme.colors.secondary }]}>Nothing private is attached automatically. Write only what you want strangers to read.</Text>
        ) : null}
        {error ? <Text style={[theme.type.body, { color: theme.colors.danger }]}>{error}</Text> : null}
      </ScrollView>
      <View
        style={{
          borderTopWidth: 1,
          borderTopColor: theme.colors.border,
          paddingHorizontal: theme.spacing.lg,
          paddingTop: theme.spacing.sm,
          paddingBottom: Math.max(insets.bottom, 12),
          backgroundColor: theme.colors.background,
        }}
      >
        <PrimaryButton disabled={!canPublish} label={loading ? 'Publishing' : postId ? 'Save' : 'Post'} loading={loading} onPress={publish} testID="compose-submit" />
      </View>
      <BottomSheet onClose={() => setCommunityOpen(false)} visible={communityOpen}>
        <ScrollView>
          {communities.data?.map((community) => (
            <Pressable
              key={community.id}
              onPress={() => {
                form.setValue('communityId', community.id, { shouldValidate: true });
                setCommunityOpen(false);
              }}
              style={{ minHeight: 52, justifyContent: 'center', flexDirection: 'row', alignItems: 'center', gap: 10 }}
            >
              <CommunityAvatar icon={community.icon} size={28} />
              <View style={{ flex: 1 }}>
                <Text style={[theme.type.body, { color: theme.colors.text }]}>{community.name}</Text>
                <Text style={[theme.type.caption, { color: theme.colors.secondary }]}>{community.description}</Text>
              </View>
            </Pressable>
          ))}
        </ScrollView>
      </BottomSheet>
      <BottomSheet onClose={() => setReferenceOpen(false)} visible={referenceOpen}>
        <Text style={[theme.type.section, { color: theme.colors.text }]}>Scripture</Text>
        <TextInput
          autoCapitalize="none"
          onChangeText={setReferenceDraft}
          placeholder="John 3:16"
          placeholderTextColor={theme.colors.secondary}
          style={[theme.type.body, { color: theme.colors.text, minHeight: 44, borderBottomWidth: 1, borderBottomColor: theme.colors.border }]}
          value={referenceDraft}
        />
        {referenceError ? <Text style={[theme.type.caption, { color: theme.colors.danger }]}>{referenceError}</Text> : null}
        <PrimaryButton label="Add reference" onPress={() => addReference(referenceDraft)} />
        <ScrollView style={{ maxHeight: 220, marginTop: 12 }}>
          {BIBLE_BOOKS.filter((book) => book.name.toLowerCase().includes(referenceDraft.toLowerCase()))
            .slice(0, 8)
            .map((book) => (
              <Pressable key={book.id} onPress={() => setReferenceDraft(book.name + ' ')} style={{ minHeight: 40, justifyContent: 'center' }}>
                <Text style={[theme.type.body, { color: theme.colors.text }]}>{book.name}</Text>
              </Pressable>
            ))}
        </ScrollView>
      </BottomSheet>
      <ConfirmationDialog
        confirmLabel="Discard"
        message="Your draft will be discarded."
        onCancel={() => setDiscard(false)}
        onConfirm={() => {
          setDiscard(false);
          clearDraft();
          form.reset({ communityId: initialCommunityId ?? '', type: 'discussion', title: '', body: '', scriptureReferences: [] });
          setPickedImage(null);
          onClose();
        }}
        title="Discard this post?"
        visible={discard}
      />
    </KeyboardAvoidingView>
  );
}

export type { PostType, ScriptureReference };
