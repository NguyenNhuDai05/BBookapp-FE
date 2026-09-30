import { formatFeedCount, formatPostTime, normalizeHashtags } from '../feedDisplay';

it('preserves tag spaces and removes duplicate hashtag prefixes', () => {
  expect(normalizeHashtags(['Makeup tiệc', '#Tone hồng', '##Tone hồng', ' ', '#'])).toEqual(['#Makeup tiệc', '#Tone hồng']);
});

it.each([[328, '328'], [999, '999'], [1000, '1K'], [1200, '1.2K'], [10_000, '10K'], [1_000_000, '1M'], [undefined, '0']])('formats %s as %s', (value, expected) => {
  expect(formatFeedCount(value as number | undefined)).toBe(expected);
});

it('omits absent or invalid metadata and handles relative time', () => {
  expect(formatPostTime()).toBeNull();
  expect(formatPostTime('invalid')).toBeNull();
  expect(formatPostTime('2026-09-30T10:00:00Z', Date.parse('2026-09-30T12:00:00Z'))).toBe('2 giờ trước');
});
