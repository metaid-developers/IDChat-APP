import {
  formatNativeChatClockTime,
  getNativeChatChainLabel,
  getNativeChatTxExplorerUrl,
  shortenNativeChatTxId,
} from '../chatUiFormatters';

describe('chatUiFormatters', () => {
  it('formats second and millisecond timestamps as compact clock time', () => {
    expect(formatNativeChatClockTime(1710000000)).toMatch(/^\d{1,2}:\d{2}$/);
    expect(formatNativeChatClockTime(1710000000000)).toMatch(/^\d{1,2}:\d{2}$/);
  });

  it('shortens txids without hiding short pending ids', () => {
    expect(shortenNativeChatTxId('a8d142e9987b4f21c0fd47322d10d57a65e7d62ab831775ef0da1ff0b76990b')).toBe(
      'a8d1...90b',
    );
    expect(shortenNativeChatTxId('mock-1')).toBe('mock-1');
    expect(shortenNativeChatTxId(undefined)).toBe('');
  });

  it('maps chain labels and explorer urls using IDChat web behavior', () => {
    expect(getNativeChatChainLabel('btc')).toBe('BTC');
    expect(getNativeChatChainLabel('doge')).toBe('DOGE');
    expect(getNativeChatChainLabel('mvc')).toBe('MVC');
    expect(getNativeChatChainLabel(undefined)).toBe('MVC');
    expect(getNativeChatTxExplorerUrl('btc', 'tx1')).toBe('https://mempool.space/tx/tx1');
    expect(getNativeChatTxExplorerUrl('doge', 'tx1')).toBe('https://dogechain.info/tx/tx1');
    expect(getNativeChatTxExplorerUrl('mvc', 'tx1')).toBe('https://mvcscan.com/tx/tx1');
    expect(getNativeChatTxExplorerUrl(undefined, 'tx1')).toBe('https://mvcscan.com/tx/tx1');
  });
});
