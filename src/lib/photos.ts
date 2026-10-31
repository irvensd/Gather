import * as Crypto from 'expo-crypto';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImageManipulator from 'expo-image-manipulator';

/** Resize to one JPEG and keep it in the app documents folder so a demo post still has it later. */
export async function persistPostPhoto(uri: string): Promise<string> {
  const image = await ImageManipulator.manipulateAsync(uri, [{ resize: { width: 1200 } }], {
    compress: 0.8,
    format: ImageManipulator.SaveFormat.JPEG,
  });
  const root = FileSystem.documentDirectory;
  if (!root) return image.uri;
  const directory = `${root}post-photos/`;
  await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
  const destination = `${directory}${Crypto.randomUUID()}.jpg`;
  await FileSystem.copyAsync({ from: image.uri, to: destination });
  return destination;
}
