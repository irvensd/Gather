import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { parseReference } from '@/lib/scripture/parse';
import { passageThisWeek } from '@/lib/weekly';
import { useTheme } from '@/theme/ThemeProvider';

export function WeeklyPassage() {
  const theme = useTheme();
  const passage = passageThisWeek();
  const [text, setText] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const parsed = parseReference(passage.reference);
    if (!parsed) return;
    const query = encodeURIComponent(parsed.raw);
    const base = process.env.EXPO_PUBLIC_BIBLE_API_URL ?? 'https://bible-api.com';
    let active = true;
    void fetch(`${base}/${query}?translation=web`)
      .then(async (response) => {
        if (!response.ok) throw new Error('unavailable');
        const json = (await response.json()) as { text?: string; translation_id?: string };
        if (json.translation_id && json.translation_id !== 'web') throw new Error('unexpected translation');
        if (active) setText(json.text?.trim() || null);
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
    };
  }, [passage.reference]);
  return (
    <View style={{ marginHorizontal: theme.spacing.lg, marginBottom: theme.spacing.md, backgroundColor: theme.colors.surface, borderRadius: theme.radius.lg, paddingHorizontal: theme.spacing.xl, paddingVertical: theme.spacing.xxl, gap: theme.spacing.sm }}>
      <Text style={[theme.type.body, { color: theme.colors.primary, fontWeight: '600' }]}>This week</Text>
      <Text style={[theme.type.postTitle, { color: theme.colors.text }]}>{passage.title}</Text>
      <Pressable
        accessibilityRole="button"
        onPress={() => {
          const parsed = parseReference(passage.reference);
          if (!parsed) return;
          router.push({ pathname: '/scripture', params: { book: parsed.book, chapter: String(parsed.chapter), start: String(parsed.verseStart), end: String(parsed.verseEnd) } });
        }}
      >
        <Text style={[theme.type.body, { color: theme.colors.primary, fontWeight: '600' }]}>{passage.reference}</Text>
      </Pressable>
      {text ? <Text style={[theme.type.body, { color: theme.colors.text }]}>{text}</Text> : <Text style={[theme.type.body, { color: theme.colors.secondary }]}>{failed ? 'The passage text is unavailable right now. The discussion is still open.' : 'The passage is loading.'}</Text>}
      <Text style={[theme.type.caption, { color: theme.colors.secondary }]}>World English Bible. This is not the Sabbath School pamphlet.</Text>
      <Pressable accessibilityRole="button" onPress={() => router.push(`/post/${passage.postId}`)} style={{ minHeight: 44, justifyContent: 'center' }}>
        <Text style={[theme.type.body, { color: theme.colors.primary, fontWeight: '600' }]}>Join the discussion</Text>
      </Pressable>
    </View>
  );
}
