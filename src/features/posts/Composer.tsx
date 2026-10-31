import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useRef, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomSheet } from '@/components/ui/BottomSheet';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { POST_TYPES } from '@/constants/postTypes';
import { PUBLIC_POST_NOTICE } from '@/constants/guidelines';
import { LIMITS } from '@/constants/limits';
import { getApi } from '@/lib/backend';
import { AppError } from '@/lib/backend/errors';
import { persistPostPhoto } from '@/lib/photos';
import { BIBLE_BOOKS } from '@/lib/scripture/books';
import { parseReference } from '@/lib/scripture/parse';
import { postSchema, type PostValues } from '@/lib/validation/schemas';
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
  const [pickedImage, setPickedImage] = useState<string | null | undefined>(undefined);
  const communities = useQuery({ queryKey: ['communities'], queryFn: async () => (await getApi()).listCommunities() });
  const existing = useQuery({
    queryKey: ['post', postId],
    enabled: !!postId,
    queryFn: async () => (await getApi()).getPost(postId!),
  });
  const form = useForm<PostValues>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      communityId: initialCommunityId ?? '',
      type: 'discussion',
      title: '',
      body: '',
      scriptureReferences: [],
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
  const dirty = values.title.trim().length > 0 || values.body.trim().length > 0 || imageUri !== (existing.data?.imageUri ?? null);
  const selected = communities.data?.find((community) => community.id === values.communityId);
  const typeMeta = POST_TYPES.find((item) => item.type === values.type);

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

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View style={{ paddingTop: insets.top, flexDirection: 'row', alignItems: 'center', paddingHorizontal: theme.spacing.sm }}>
        <Pressable accessibilityRole="button" onPress={requestClose} style={{ minHeight: 44, justifyContent: 'center', paddingHorizontal: 12 }}>
          <Text style={[theme.type.body, { color: theme.colors.secondary }]}>Cancel</Text>
        </Pressable>
        <Text style={[theme.type.section, { flex: 1, textAlign: 'center', color: theme.colors.text }]}>{postId ? 'Edit post' : 'New post'}</Text>
        <View style={{ width: 72 }} />
      </View>
      <ScrollView contentContainerStyle={{ padding: theme.spacing.lg, gap: theme.spacing.lg, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        <Pressable accessibilityRole="button" onPress={() => !postId && setCommunityOpen(true)} style={{ minHeight: 48, justifyContent: 'center' }}>
          <Text style={[theme.type.caption, { color: theme.colors.secondary }]}>Community</Text>
          <Text style={[theme.type.body, { color: selected ? theme.colors.text : theme.colors.secondary }]}>{selected ? `c/${selected.name}` : 'Choose a community'}</Text>
        </Pressable>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
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
                  backgroundColor: selectedType ? theme.colors.primary : theme.colors.highlight,
                }}
              >
                <Text style={[theme.type.caption, { color: selectedType ? theme.colors.onPrimary : theme.colors.text, fontWeight: '600' }]}>{item.label}</Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={[theme.type.caption, { color: theme.colors.secondary }]}>
          {typeMeta?.hint} Example: {typeMeta?.example}
        </Text>
        <Controller
          control={form.control}
          name="title"
          render={({ field, fieldState }) => (
            <View>
              <TextInput
                accessibilityLabel="Title"
                maxLength={LIMITS.titleMax}
                onChangeText={field.onChange}
                placeholder="Title"
                placeholderTextColor={theme.colors.secondary}
                style={[theme.type.title, { color: theme.colors.text }]}
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
            <View>
              <TextInput
                accessibilityLabel="Body"
                maxLength={LIMITS.bodyMax}
                multiline
                onChangeText={field.onChange}
                placeholder="Write the post"
                placeholderTextColor={theme.colors.secondary}
                style={[theme.type.body, { color: theme.colors.text, minHeight: 160, textAlignVertical: 'top' }]}
                testID="compose-body"
                value={field.value}
              />
              <Text style={[theme.type.caption, { color: theme.colors.secondary }]}>{field.value.length}/{LIMITS.bodyMax}</Text>
              {fieldState.error ? <Text style={[theme.type.caption, { color: theme.colors.danger }]}>{fieldState.error.message}</Text> : null}
            </View>
          )}
        />
        <View style={{ gap: 8 }}>
          {imageUri ? (
            <View>
              <Image source={{ uri: imageUri }} style={{ width: '100%', height: 220, borderRadius: theme.radius.md }} contentFit="cover" />
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
            >
              <Text style={[theme.type.body, { color: theme.colors.primary, fontWeight: '600' }]}>Add a photo</Text>
            </Pressable>
          )}
          <Pressable onPress={() => setReferenceOpen(true)}>
            <Text style={[theme.type.body, { color: theme.colors.primary, fontWeight: '600' }]}>Add Scripture reference</Text>
          </Pressable>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {values.scriptureReferences.map((reference) => (
              <Pressable key={reference.raw} onPress={() => form.setValue('scriptureReferences', values.scriptureReferences.filter((item) => item.raw !== reference.raw))}>
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
        <PrimaryButton label={postId ? 'Save' : 'Post'} loading={loading} onPress={publish} testID="compose-submit" />
      </ScrollView>
      <BottomSheet onClose={() => setCommunityOpen(false)} visible={communityOpen}>
        <ScrollView>
          {communities.data?.map((community) => (
            <Pressable
              key={community.id}
              onPress={() => {
                form.setValue('communityId', community.id, { shouldValidate: true });
                setCommunityOpen(false);
              }}
              style={{ minHeight: 52, justifyContent: 'center' }}
            >
              <Text style={[theme.type.body, { color: theme.colors.text }]}>c/{community.name}</Text>
              <Text style={[theme.type.caption, { color: theme.colors.secondary }]}>{community.description}</Text>
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
          style={[theme.type.body, { color: theme.colors.text, minHeight: 44 }]}
          value={referenceDraft}
        />
        {referenceError ? <Text style={[theme.type.caption, { color: theme.colors.danger }]}>{referenceError}</Text> : null}
        <PrimaryButton label="Add reference" onPress={() => addReference(referenceDraft)} />
        <ScrollView style={{ maxHeight: 220, marginTop: 12 }}>
          {BIBLE_BOOKS.filter((book) => book.name.toLowerCase().includes(referenceDraft.toLowerCase())).slice(0, 8).map((book) => (
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
          onClose();
        }}
        title="Discard this post?"
        visible={discard}
      />
    </KeyboardAvoidingView>
  );
}

export type { PostType, ScriptureReference };
