import { describe, expect, it, jest } from '@jest/globals';
import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import type { NativeChatOnlineBot } from '../../domain/types';
import OnlineBotPanel from '../OnlineBotPanel';

const bot: NativeChatOnlineBot = {
  globalMetaId: 'bot-gm',
  name: 'Helper Bot',
  avatar: 'https://example.test/bot.png',
  bio: 'LLM:gpt',
  chatPublicKey: 'bot-chat-key',
  lastSeenAt: 1000,
  lastSeenAgoSeconds: 7,
  deviceCount: 2,
};

describe('OnlineBotPanel', () => {
  it('renders online bot rows and opens a selected bot', () => {
    const onOpenBot = jest.fn();
    let renderer!: TestRenderer.ReactTestRenderer;

    act(() => {
      renderer = TestRenderer.create(
        <OnlineBotPanel
          bots={[bot]}
          loading={false}
          onClose={jest.fn()}
          onOpenBot={onOpenBot}
          onRefresh={jest.fn()}
          visible
        />,
      );
    });

    act(() => {
      renderer.root.findByProps({ accessibilityLabel: 'Open online bot Helper Bot' }).props.onPress();
    });

    expect(renderer.root.findByProps({ children: 'Online bots' })).toBeTruthy();
    expect(renderer.root.findByProps({ children: 'Helper Bot' })).toBeTruthy();
    expect(
      renderer.root.findAll((node) => typeof node.props.children === 'string' && node.props.children.includes('LLM:gpt')).length,
    ).toBeGreaterThan(0);
    expect(onOpenBot).toHaveBeenCalledWith(bot);
  });

  it('exposes close and refresh actions plus loading and error states', () => {
    const onClose = jest.fn();
    const onRefresh = jest.fn();
    let renderer!: TestRenderer.ReactTestRenderer;

    act(() => {
      renderer = TestRenderer.create(
        <OnlineBotPanel
          bots={[]}
          error="Failed to load bots"
          loading
          onClose={onClose}
          onOpenBot={jest.fn()}
          onRefresh={onRefresh}
          visible
        />,
      );
    });

    act(() => {
      renderer.root.findByProps({ accessibilityLabel: 'Close online bots' }).props.onPress();
      renderer.root.findByProps({ accessibilityLabel: 'Refresh online bots' }).props.onPress();
    });

    expect(renderer.root.findByProps({ children: 'Loading online bots' })).toBeTruthy();
    expect(renderer.root.findByProps({ children: 'Failed to load bots' })).toBeTruthy();
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });
});
