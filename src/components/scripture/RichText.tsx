import { Text } from 'react-native';

import { splitScriptureSegments } from '@/lib/scripture/parse';
import { useTheme } from '@/theme/ThemeProvider';
import type { ScriptureReference } from '@/types';

export function RichText({
  text,
  onReference,
}: {
  text: string;
  onReference: (reference: ScriptureReference) => void;
}) {
  const theme = useTheme();
  const segments = splitScriptureSegments(text);
  return (
    <Text style={[theme.type.body, { color: theme.colors.text }]}>
      {segments.map((segment, index) =>
        segment.type === 'text' ? (
          <Text key={index}>{segment.text}</Text>
        ) : (
          <Text
            key={index}
            accessibilityRole="link"
            onPress={() => onReference(segment.reference)}
            style={{ color: theme.colors.primary, fontWeight: '600' }}
          >
            {segment.text}
          </Text>
        ),
      )}
    </Text>
  );
}
