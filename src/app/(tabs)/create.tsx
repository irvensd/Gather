import { Redirect } from 'expo-router';

/** The Create tab never shows its own screen: tapping it opens /compose over the current tab. */
export default function CreateScreen() {
  return <Redirect href="/compose" />;
}
