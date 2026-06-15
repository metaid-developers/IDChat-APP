export type NativeChatChain = 'btc' | 'doge' | 'mvc' | string | undefined;

export function normalizeNativeChatTimestamp(timestamp: number | undefined): number | undefined {
  if (!timestamp) return undefined;
  return timestamp < 10_000_000_000 ? timestamp * 1000 : timestamp;
}

export function formatNativeChatClockTime(timestamp: number | undefined): string {
  const normalized = normalizeNativeChatTimestamp(timestamp);
  if (!normalized) return '';
  const date = new Date(normalized);
  return `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
}

export function formatNativeChatUnreadCount(count: number | undefined): string {
  if (!Number.isFinite(count) || count === undefined || count <= 0) return '';

  const normalizedCount = Math.floor(count);
  if (normalizedCount <= 0) return '';
  if (normalizedCount > 999) return '999+';
  return String(normalizedCount);
}

export function shortenNativeChatTxId(txId: string | undefined): string {
  if (!txId) return '';
  if (txId.length <= 12) return txId;
  return `${txId.slice(0, 4)}...${txId.slice(-3)}`;
}

export function getNativeChatChainLabel(chain: NativeChatChain): string {
  const normalized = String(chain || 'mvc').toLowerCase();
  if (normalized === 'btc') return 'BTC';
  if (normalized === 'doge') return 'DOGE';
  return 'MVC';
}

export function getNativeChatTxExplorerUrl(chain: NativeChatChain, txId: string): string {
  const normalized = String(chain || 'mvc').toLowerCase();
  if (normalized === 'btc') return `https://mempool.space/tx/${txId}`;
  if (normalized === 'doge') return `https://dogechain.info/tx/${txId}`;
  return `https://mvcscan.com/tx/${txId}`;
}
