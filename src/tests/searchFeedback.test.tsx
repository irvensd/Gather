import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react-native';

import SearchScreen from '@/app/search';
import { getApi } from '@/lib/backend';

jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));
jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));
jest.mock('@/features/posts/actions', () => ({ useContentActions: () => ({ dialogs: null }) }));
jest.mock('@/lib/backend', () => ({ getApi: jest.fn() }));
jest.mock('@/theme/ThemeProvider', () => {
  const { palette, spacing, type, radius } = jest.requireActual('@/theme/tokens');
  return { useTheme: () => ({ colors: palette.light, spacing, type, radius }) };
});
jest.mock('@/components/ui/ScreenContainer', () => ({ ScreenContainer: ({ children }: { children: React.ReactNode }) => children }));
jest.mock('@/components/feed/PostCard', () => ({
  PostCard: ({ post }: { post: { title: string } }) => {
    const { Text } = jest.requireActual('react-native');
    return <Text>{post.title}</Text>;
  },
}));

it('shows guidance, loading and failure, retries and labels both types of results, then shows no matches', async () => {
  let failSearch!: (error: Error) => void;
  const pendingSearch = new Promise((_resolve, reject) => {
    failSearch = reject;
  });
  const search = jest.fn()
    .mockReturnValueOnce(pendingSearch)
    .mockResolvedValueOnce({ communities: [{ id: 'one', slug: 'prayer', name: 'Prayer' }], posts: [{ id: 'two', title: 'A prayer post' }] })
    .mockResolvedValueOnce({ communities: [], posts: [] })
    .mockResolvedValueOnce({ communities: [{ id: 'three', slug: 'faith', name: 'Faith' }], posts: [] });
  jest.mocked(getApi).mockResolvedValue({ search } as unknown as Awaited<ReturnType<typeof getApi>>);

  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
  await render(<QueryClientProvider client={client}><SearchScreen /></QueryClientProvider>);
  expect(screen.getByText('Search Gather')).toBeTruthy();
  const input = screen.getByTestId('search-input');
  await fireEvent.changeText(input, 'p');
  expect(search).not.toHaveBeenCalled();
  await fireEvent.changeText(input, '  prayer ');
  expect(screen.getByText('Searching…')).toBeTruthy();
  failSearch(new Error('Search unavailable'));
  await screen.findByText('Search couldn’t load');
  await fireEvent.press(screen.getByRole('button', { name: 'Try again' }));
  await screen.findByText('A prayer post');
  expect(screen.getByRole('header', { name: 'Communities' })).toBeTruthy();
  expect(screen.getByRole('header', { name: 'Posts' })).toBeTruthy();
  expect(search.mock.calls.slice(0, 2)).toEqual([['prayer'], ['prayer']]);
  await fireEvent.changeText(input, 'unknown');
  await screen.findByText('No results found');
  await fireEvent.changeText(input, 'faith');
  await screen.findByText('c/Faith');
  expect(screen.queryByText('No results found')).toBeNull();
  expect(screen.queryByRole('header', { name: 'Posts' })).toBeNull();
});
