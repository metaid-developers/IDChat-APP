import { describe, expect, it, jest } from '@jest/globals';
import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import NativeChatAccountCard from '../NativeChatAccountCard';

describe('NativeChatAccountCard', () => {
  it('renders profile, address, chat key status, and copy actions', () => {
    const onCopyValue = jest.fn();
    let renderer!: TestRenderer.ReactTestRenderer;

    act(() => {
      renderer = TestRenderer.create(
        <NativeChatAccountCard
          address="mvc-address"
          avatar="https://example.test/avatar.png"
          chatPublicKey="chat-key"
          displayName="Alice"
          globalMetaId="alice-gm"
          onCopyValue={onCopyValue}
          socketConnected
        />,
      );
    });

    act(() => {
      renderer.root.findByProps({ accessibilityLabel: 'Copy Global MetaID' }).props.onPress();
      renderer.root.findByProps({ accessibilityLabel: 'Copy MVC address' }).props.onPress();
      renderer.root.findByProps({ accessibilityLabel: 'Copy chat public key' }).props.onPress();
    });

    expect(renderer.root.findByProps({ children: 'Alice' })).toBeTruthy();
    expect(renderer.root.findByProps({ children: 'alice-gm' })).toBeTruthy();
    expect(renderer.root.findByProps({ children: 'mvc-address' })).toBeTruthy();
    expect(renderer.root.findByProps({ children: 'Chat key active' })).toBeTruthy();
    expect(renderer.root.findByProps({ children: 'Socket connected' })).toBeTruthy();
    expect(onCopyValue).toHaveBeenCalledWith('Global MetaID', 'alice-gm');
    expect(onCopyValue).toHaveBeenCalledWith('MVC address', 'mvc-address');
    expect(onCopyValue).toHaveBeenCalledWith('Chat public key', 'chat-key');
  });

  it('renders missing profile data without unsupported settings links', () => {
    let renderer!: TestRenderer.ReactTestRenderer;

    act(() => {
      renderer = TestRenderer.create(
        <NativeChatAccountCard
          displayName="IDChat User"
          globalMetaId=""
          onCopyValue={jest.fn()}
          socketConnected={false}
        />,
      );
    });

    expect(renderer.root.findByProps({ children: 'IDChat User' })).toBeTruthy();
    expect(
      renderer.root.findAll((node) => node.props.children === 'Not connected').length,
    ).toBeGreaterThan(0);
    expect(renderer.root.findByProps({ children: 'Address unavailable' })).toBeTruthy();
    expect(
      renderer.root.findAll((node) => node.props.children === 'Chat key unavailable').length,
    ).toBeGreaterThan(0);
    expect(renderer.root.findByProps({ children: 'No native chat settings available yet' })).toBeTruthy();
    expect(renderer.root.findAllByProps({ accessibilityLabel: 'Open unsupported native setting' })).toHaveLength(0);
  });
});
