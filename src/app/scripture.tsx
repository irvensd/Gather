import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

import { IconButton } from '@/components/ui/IconButton';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { parseReference } from '@/lib/scripture/parse';
import { useTheme } from '@/theme/ThemeProvider';

export default function ScriptureScreen() {
  const params = useLocalSearchParams<{ book: string; chapter: string; start: string; end: string }>();
  const theme = useTheme();
  const raw = `${params.book ?? ''} ${params.chapter ?? ''}:${params.start ?? ''}${params.end && params.end !== params.start ? `-${params.end}` : ''}`;
  const reference = parseReference(raw);
  const [text, setText] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const parsed = parseReference(raw);
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
  }, [raw]);
  return (
    <ScreenContainer>
      <IconButton label="Close" name="close" onPress={() => router.back()} />
      <View style={{ padding: theme.spacing.xl, gap: theme.spacing.md }}>
        <Text style={[theme.type.title, { color: theme.colors.text }]}>{reference?.raw ?? 'Reference'}</Text>
        {text ? <Text style={[theme.type.body, { color: theme.colors.text }]}>{text}</Text> : null}
        {failed || !reference ? <Text style={[theme.type.body, { color: theme.colors.secondary }]}>The public-domain text is unavailable right now. The reference is still saved with the post.</Text> : null}
        <Text style={[theme.type.caption, { color: theme.colors.secondary }]}>World English Bible (public domain). Gather does not ship a copyrighted translation.</Text>
      </View>
    </ScreenContainer>
  );
}
