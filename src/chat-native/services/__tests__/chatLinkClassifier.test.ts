import { classifyChatLink } from '../chatLinkClassifier';

describe('chatLinkClassifier', () => {
  it('classifies safe https urls for WebView fallback', () => {
    expect(classifyChatLink('https://show.now/app')).toEqual({
      kind: 'web-url',
      label: 'show.now',
      url: 'https://show.now/app',
    });
  });

  it('does not depend on React Native URL protocol and host getters', () => {
    const originalUrl = global.URL;

    class ThrowingUrl {
      constructor(public readonly rawUrl: string) {}

      get protocol() {
        throw new Error('URL.protocol is unavailable');
      }

      get host() {
        throw new Error('URL.host is unavailable');
      }
    }

    (global as any).URL = ThrowingUrl;

    try {
      expect(classifyChatLink('https://show.now/app')).toEqual({
        kind: 'web-url',
        label: 'show.now',
        url: 'https://show.now/app',
      });
    } finally {
      global.URL = originalUrl;
    }
  });

  it('marks non-url app links as unsupported app route', () => {
    expect(classifyChatLink('idchat://app/example')).toEqual({
      kind: 'unsupported-app-route',
      label: 'idchat://app/example',
      url: 'idchat://app/example',
    });
  });
});
