export type ChatLinkClassification =
  | { kind: 'web-url'; label: string; url: string }
  | { kind: 'unsupported-app-route'; label: string; url: string };

const WEB_URL_PATTERN = /^(https?):\/\/([^/?#]+)/i;

export function classifyChatLink(url: string): ChatLinkClassification {
  const webUrlMatch = WEB_URL_PATTERN.exec(url);

  if (webUrlMatch) {
    return { kind: 'web-url', label: webUrlMatch[2], url };
  }

  return { kind: 'unsupported-app-route', label: url, url };
}
