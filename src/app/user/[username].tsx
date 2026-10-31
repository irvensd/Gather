import { router, useLocalSearchParams } from 'expo-router';

import { IconButton } from '@/components/ui/IconButton';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { ProfileBody } from '@/features/profile/ProfileBody';

export default function UserScreen() {
  const { username } = useLocalSearchParams<{ username: string }>();
  return (
    <ScreenContainer>
      <IconButton label="Back" name="chevron-back" onPress={() => (router.canGoBack() ? router.back() : router.navigate('/'))} />
      <ProfileBody username={username} />
    </ScreenContainer>
  );
}
