import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { AppHeader } from '@/components/ui/AppHeader';
import { IconButton } from '@/components/ui/IconButton';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { SegmentedFilter } from '@/components/ui/SegmentedFilter';
import { useAuth } from '@/features/auth/AuthProvider';
import { FeedList } from '@/features/feed/FeedList';
import { backendMode } from '@/lib/backend';
import { useTheme } from '@/theme/ThemeProvider';
import type { FeedFilter } from '@/types';

export default function HomeScreen() {
  const theme = useTheme();
  const { session } = useAuth();
  const [filter, setFilter] = useState<FeedFilter>('popular');
  return (
    <ScreenContainer>
      <AppHeader
        right={
          <>
            <IconButton label="Search" name="search" onPress={() => router.push('/search')} />
            {session ? null : (
              <Pressable accessibilityRole="button" onPress={() => router.push('/(auth)/sign-in')} style={{ minHeight: 44, justifyContent: 'center', paddingLeft: 4 }}>
                <Text style={[theme.type.body, { color: theme.colors.primary, fontWeight: '600' }]}>Sign in</Text>
              </Pressable>
            )}
          </>
        }
        wordmark
      />
      <View style={{ paddingHorizontal: theme.spacing.lg, paddingBottom: theme.spacing.sm }}>
        <SegmentedFilter
          onChange={setFilter}
          options={[
            { value: 'popular', label: 'Popular' },
            { value: 'new', label: 'New' },
            { value: 'following', label: 'Following' },
          ]}
          value={filter}
        />
      </View>
      <FeedList filter={filter} notice={backendMode() === 'demo' ? 'Preview conversations on this phone.' : null} />
    </ScreenContainer>
  );
}
