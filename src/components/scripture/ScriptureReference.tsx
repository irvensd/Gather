import { Pressable, Text, View } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';
import type { ScriptureReference as ScriptureReferenceModel } from '@/types';

export function ScriptureReference({
  reference,
  onPress,
}: {
  reference: ScriptureReferenceModel;
  onPress: (reference: ScriptureReferenceModel) => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open ${reference.raw}`}
      onPress={() => onPress(reference)}
      style={{
        backgroundColor: theme.colors.highlight,
        borderRadius: theme.radius.pill,
        paddingHorizontal: 8,
        paddingVertical: 4,
        minHeight: 28,
        justifyContent: 'center',
      }}
    >
      <Text style={[theme.type.caption, { color: theme.colors.primary, fontWeight: '600' }]}>{reference.raw}</Text>
    </Pressable>
  );
}

export function ScriptureReferenceList({
  references,
  onPress,
  limit,
}: {
  references: ScriptureReferenceModel[];
  onPress: (reference: ScriptureReferenceModel) => void;
  limit?: number;
}) {
  if (references.length === 0) return null;
  const visible = limit ? references.slice(0, limit) : references;
  const extra = references.length - visible.length;
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
      {visible.map((reference) => (
        <ScriptureReference key={`${reference.bookId}-${reference.chapter}-${reference.verseStart}-${reference.verseEnd}`} onPress={onPress} reference={reference} />
      ))}
      {extra > 0 ? <MoreCount count={extra} /> : null}
    </View>
  );
}

function MoreCount({ count }: { count: number }) {
  const theme = useTheme();
  return <Text style={[theme.type.caption, { color: theme.colors.secondary }]}>+{count}</Text>;
}
