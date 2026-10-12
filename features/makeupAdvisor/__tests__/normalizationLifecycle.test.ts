import { normalizeLegacy as normalize } from '../faceAnalysis';
import * as Manipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system/legacy';
jest.mock('expo-modules-core', () => ({ ...jest.requireActual('expo-modules-core'), requireOptionalNativeModule: () => null }));
jest.mock('expo-image-manipulator', () => ({ ImageManipulator: { manipulate: jest.fn() }, SaveFormat: { JPEG: 'jpeg' } }));
jest.mock('expo-file-system/legacy', () => ({ cacheDirectory: 'file:///cache/', getInfoAsync: jest.fn(), deleteAsync: jest.fn() }));

const source = { uri: 'file:///cache/input.jpg', width: 2400, height: 1800 };
const normalized = { uri: 'file:///cache/output.jpg', width: 1280, height: 960 };
let context: { resize: jest.Mock; renderAsync: jest.Mock; release: jest.Mock };
let image: { saveAsync: jest.Mock; release: jest.Mock };
beforeEach(() => {
  jest.clearAllMocks();
  image = { saveAsync: jest.fn().mockResolvedValue(normalized), release: jest.fn() };
  context = { resize: jest.fn(), renderAsync: jest.fn().mockResolvedValue(image), release: jest.fn() };
  (Manipulator.ImageManipulator.manipulate as jest.Mock).mockReturnValue(context);
  (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({ exists: true, size: 500000 });
  (FileSystem.deleteAsync as jest.Mock).mockResolvedValue(undefined);
});
test('same normalization dimensions/format and releases both native objects on success', async () => {
  expect(await normalize(source)).toEqual(normalized);
  expect(context.resize).toHaveBeenCalledWith({ width: 1280, height: 960 });
  expect(image.saveAsync).toHaveBeenCalledWith({ format: 'jpeg', compress: 0.9 });
  expect(context.release).toHaveBeenCalledTimes(1); expect(image.release).toHaveBeenCalledTimes(1);
  expect(FileSystem.deleteAsync).not.toHaveBeenCalled();
});
test('failed render still releases the context', async () => {
  context.renderAsync.mockRejectedValue(new Error('render'));
  await expect(normalize(source)).rejects.toThrow('render');
  expect(context.release).toHaveBeenCalledTimes(1); expect(image.release).not.toHaveBeenCalled();
});
test('failed save releases both objects', async () => {
  image.saveAsync.mockRejectedValue(new Error('save'));
  await expect(normalize(source)).rejects.toThrow('save');
  expect(context.release).toHaveBeenCalledTimes(1); expect(image.release).toHaveBeenCalledTimes(1);
});
test.each(['info-error', 'oversize'])('cleans owned output and releases references on %s', async reason => {
  if (reason === 'info-error') (FileSystem.getInfoAsync as jest.Mock).mockRejectedValue(new Error('info'));
  else (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({ exists: true, size: 6 * 1024 * 1024 });
  await expect(normalize(source)).rejects.toThrow();
  expect(FileSystem.deleteAsync).toHaveBeenCalledWith(normalized.uri, { idempotent: true });
  expect(context.release).toHaveBeenCalledTimes(1); expect(image.release).toHaveBeenCalledTimes(1);
});
test('invalid dimensions never allocate a manipulator context', async () => {
  await expect(normalize({ ...source, width: 10000, height: 10000 })).rejects.toThrow('40 MP');
  expect(Manipulator.ImageManipulator.manipulate).not.toHaveBeenCalled();
});

