import { router } from 'expo-router';
import { Pressable, ScrollView, Switch, Text, View } from 'react-native';

import { IconButton } from '@/components/ui/IconButton';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { formatSabbathTime, SABBATH_PLACES, sabbathPlaceById, sabbathWindow } from '@/lib/sabbath';
import { usePreferences } from '@/store/preferences';
import { useTheme } from '@/theme/ThemeProvider';

export default function SabbathQuietScreen() {
  const theme = useTheme();
  const enabled = usePreferences((state) => state.sabbathQuiet);
  const placeId = usePreferences((state) => state.sabbathPlaceId);
  const setEnabled = usePreferences((state) => state.setSabbathQuiet);
  const setPlaceId = usePreferences((state) => state.setSabbathPlaceId);
  const place = sabbathPlaceById(placeId);
  const window = sabbathWindow(new Date(), place);
  return (
    <ScreenContainer>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <IconButton label="Back" name="chevron-back" onPress={() => router.back()} />
        <Text style={[theme.type.section, { color: theme.colors.text }]}>Sabbath quiet</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: theme.spacing.lg, gap: theme.spacing.lg }}>
        <Text style={[theme.type.body, { color: theme.colors.secondary }]}>
          A preview of how replies would rest from Friday sunset to Saturday sunset. Nothing is sent to a server, and phone alerts are not delivered yet.
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={[theme.type.body, { color: theme.colors.text }]}>Hold notifications</Text>
          <Switch onValueChange={setEnabled} value={enabled} />
        </View>
        <View style={{ gap: theme.spacing.sm }}>
          <Text style={[theme.type.caption, { color: theme.colors.secondary }]}>Preview place</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {SABBATH_PLACES.map((item) => {
              const selected = item.id === place.id;
              return (
                <Pressable
                  key={item.id}
                  onPress={() => setPlaceId(item.id)}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: theme.radius.pill,
                    backgroundColor: selected ? theme.colors.primary : theme.colors.highlight,
                  }}
                >
                  <Text style={[theme.type.caption, { color: selected ? theme.colors.onPrimary : theme.colors.text, fontWeight: '600' }]}>{item.name}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
        <View style={{ backgroundColor: theme.colors.surface, borderRadius: theme.radius.md, padding: theme.spacing.lg, gap: 6, borderWidth: 1, borderColor: theme.colors.border }}>
          <Text style={[theme.type.caption, { color: theme.colors.secondary }]}>{place.name}</Text>
          {window ? (
            <>
              <Text style={[theme.type.body, { color: theme.colors.text }]}>
                {formatSabbathTime(window.start, place.timeZone)}
              </Text>
              <Text style={[theme.type.caption, { color: theme.colors.secondary }]}>until</Text>
              <Text style={[theme.type.body, { color: theme.colors.text }]}>
                {formatSabbathTime(window.end, place.timeZone)}
              </Text>
              <Text style={[theme.type.caption, { color: theme.colors.primary, fontWeight: '600' }]}>
                {window.resting ? 'This window is open now.' : 'Notifications would resume after Saturday sunset.'}
              </Text>
            </>
          ) : (
            <Text style={[theme.type.body, { color: theme.colors.secondary }]}>Sunset could not be calculated for this place.</Text>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
