import { describe, expect, it } from '@jest/globals';
import { shouldUploadMuaAvatar, validateMuaOnboarding } from '../muaOnboarding';

const validForm = {
  displayName: 'Linh Makeup',
  phoneNumber: '0901234567',
  city: 'Hồ Chí Minh',
  bio: 'Chuyên trang điểm cô dâu tự nhiên.',
  experienceYears: 3,
  avatarUrl: 'https://cdn.example.com/avatar.jpg',
  styleIds: [1, 2],
  address: '123 Nguyễn Huệ, Quận 1',
  identityFrontUrl: 'https://cdn.example.com/front.jpg',
  identityBackUrl: 'https://cdn.example.com/back.jpg',
  portraitUrl: 'https://cdn.example.com/portrait.jpg',
  certificateUrls: [],
  portfolioUrls: ['https://cdn.example.com/work.jpg'],
  services: [{ name: 'Trang điểm cô dâu', price: 1500000, durationMinutes: 90 }],
  bankAccount: { bankCode: 'VCB', accountNumber: '123456789', accountHolderName: 'NGUYEN THI LINH' },
};

describe('MUA onboarding validation', () => {
  it('accepts a complete application', () => {
    expect(validateMuaOnboarding(validForm)).toEqual({});
  });

  it.each([
    ['displayName', { displayName: ' ' }],
    ['phoneNumber', { phoneNumber: 'abc' }],
    ['city', { city: '' }],
    ['bio', { bio: 'ngắn' }],
    ['avatarUrl', { avatarUrl: '' }],
    ['styleIds', { styleIds: [] }],
    ['address', { address: '' }],
    ['identityFrontUrl', { identityFrontUrl: '' }],
    ['identityBackUrl', { identityBackUrl: '' }],
    ['portraitUrl', { portraitUrl: '' }],
    ['portfolioUrls', { portfolioUrls: [] }],
    ['services', { services: [] }],
    ['accountNumber', { bankAccount: { ...validForm.bankAccount, accountNumber: '1' } }],
  ])('rejects invalid %s', (field, override) => {
    expect(validateMuaOnboarding({ ...validForm, ...override })).toHaveProperty(field);
  });
});

describe('MUA avatar upload URI detection', () => {
  it.each(['blob:https://app.example/id', 'content://media/image/1', 'file:///tmp/avatar.jpg'])
    ('uploads local URI %s', uri => {
      expect(shouldUploadMuaAvatar(uri)).toBe(true);
    });

  it.each(['https://cdn.example.com/avatar.jpg', 'http://localhost/avatar.jpg'])
    ('keeps public URI %s', uri => {
      expect(shouldUploadMuaAvatar(uri)).toBe(false);
    });
});
