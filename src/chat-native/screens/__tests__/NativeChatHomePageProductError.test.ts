import { describe, expect, it, jest } from '@jest/globals';

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    expoConfig: {
      extra: {},
    },
  },
}));

jest.mock('expo-clipboard', () => ({
  setStringAsync: jest.fn(),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

jest.mock('../../services/chatWalletAdapter', () => ({
  createNativeChatWalletAdapter: jest.fn(),
}));

jest.mock('../../storage/chatDatabase', () => ({
  openNativeChatDatabase: jest.fn(),
}));

import { getNativeChatHomeProductError } from '../NativeChatHomePage';

describe('getNativeChatHomeProductError', () => {
  it('maps Unknown point format to the discovery fallback', () => {
    expect(
      getNativeChatHomeProductError(new Error('Unknown point format'), 'Search failed. Try again.'),
    ).toBe('Search failed. Try again.');
  });

  it('maps invalid public key point errors to the chat-start fallback', () => {
    expect(
      getNativeChatHomeProductError(new Error('Invalid public key point111'), 'Unable to start chat. Try again.'),
    ).toBe('Unable to start chat. Try again.');
  });

  it('keeps arbitrary network errors product-safe by returning the supplied fallback', () => {
    expect(
      getNativeChatHomeProductError(new Error('Network request failed'), 'Search failed. Try again.'),
    ).toBe('Search failed. Try again.');
  });
});
