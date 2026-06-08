import {
  CHAT_PROTOCOL,
  buildChatProtocolPath,
  getTextProtocolForChannel,
  getImageProtocolForChannel,
  isPrivateChannel,
} from '../protocol';

describe('native chat protocol helpers', () => {
  it('uses exact lowercase protocol values from the current web app', () => {
    expect(CHAT_PROTOCOL.SIMPLE_GROUP_CHAT).toBe('simplegroupchat');
    expect(CHAT_PROTOCOL.SIMPLE_FILE_GROUP_CHAT).toBe('simplefilegroupchat');
    expect(CHAT_PROTOCOL.SIMPLE_MSG).toBe('simplemsg');
    expect(CHAT_PROTOCOL.SIMPLE_FILE_MSG).toBe('simplefilemsg');
  });

  it('uses simplemsg for private text and simplegroupchat for group text', () => {
    expect(getTextProtocolForChannel('private')).toBe('simplemsg');
    expect(getTextProtocolForChannel('group')).toBe('simplegroupchat');
    expect(getTextProtocolForChannel('sub-group')).toBe('simplegroupchat');
  });

  it('uses file protocols for image messages', () => {
    expect(getImageProtocolForChannel('private')).toBe('simplefilemsg');
    expect(getImageProtocolForChannel('group')).toBe('simplefilegroupchat');
  });

  it('identifies private channels', () => {
    expect(isPrivateChannel('private')).toBe(true);
    expect(isPrivateChannel('group')).toBe(false);
    expect(isPrivateChannel('sub-group')).toBe(false);
  });

  it('builds the same protocol path shape as web createShowMsg', () => {
    expect(buildChatProtocolPath('bc1p-host', CHAT_PROTOCOL.SIMPLE_GROUP_CHAT)).toBe(
      'bc1p-host:/protocols/simplegroupchat',
    );
  });
});
