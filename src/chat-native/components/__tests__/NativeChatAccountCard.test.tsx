import { describe, expect, it, jest } from '@jest/globals';
import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import NativeChatAccountCard from '../NativeChatAccountCard';

function collectText(
  node: TestRenderer.ReactTestRendererJSON | TestRenderer.ReactTestRendererJSON[] | string | null,
): string[] {
  if (!node) {
    return [];
  }

  if (typeof node === 'string') {
    return [node];
  }

  if (Array.isArray(node)) {
    return node.flatMap(collectText);
  }

  return (node.children || []).flatMap(collectText);
}

describe('NativeChatAccountCard', () => {
  it('renders the connected profile identity, status copy, and exact public copy actions', () => {
    const onCopyValue = jest.fn();
    const globalMetaId = 'gm-public-identity-00001111222233334444555566667777';
    const address = 'mvc-address-public-aaaabbbbccccddddeeeeffff11112222';
    const chatPublicKey = 'chat-public-key-aaaabbbbccccddddeeeeffff11112222';
    let renderer!: TestRenderer.ReactTestRenderer;

    act(() => {
      renderer = TestRenderer.create(
        <NativeChatAccountCard
          address={address}
          avatar="https://example.test/avatar.png"
          chatPublicKey={chatPublicKey}
          displayName="Alice Builder"
          globalMetaId={globalMetaId}
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

    const screenText = collectText(renderer.toJSON()).join('\n');
    const selectableValues = renderer.root
      .findAll((node) => node.props.selectable === true)
      .map((node) => node.props.children);
    const uniqueSelectableValues = Array.from(new Set(selectableValues));

    expect(renderer.root.findByProps({ children: 'Alice Builder' })).toBeTruthy();
    expect(renderer.root.findAllByProps({ accessibilityLabel: 'Alice Builder avatar' }).length).toBeGreaterThan(0);
    expect(renderer.root.findByProps({ children: 'Connected account' })).toBeTruthy();
    expect(screenText).toContain('Private chat ready');
    expect(screenText).toContain('Chat sync connected');
    expect(screenText).not.toContain('Chat key active');
    expect(screenText).not.toContain('Socket connected');
    expect(screenText).not.toMatch(/private key/i);
    expect(uniqueSelectableValues).toHaveLength(3);
    expect(uniqueSelectableValues.every((value) => typeof value === 'string' && value.includes('...'))).toBe(true);
    expect(uniqueSelectableValues).not.toContain(globalMetaId);
    expect(uniqueSelectableValues).not.toContain(address);
    expect(uniqueSelectableValues).not.toContain(chatPublicKey);
    expect(onCopyValue).toHaveBeenCalledWith('Global MetaID', globalMetaId);
    expect(onCopyValue).toHaveBeenCalledWith('MVC address', address);
    expect(onCopyValue).toHaveBeenCalledWith('chat public key', chatPublicKey);
  });

  it('renders partial public identity without unavailable copy actions', () => {
    const onCopyValue = jest.fn();
    let renderer!: TestRenderer.ReactTestRenderer;

    act(() => {
      renderer = TestRenderer.create(
        <NativeChatAccountCard
          displayName="Alice"
          globalMetaId="alice-gm"
          onCopyValue={onCopyValue}
          socketConnected={false}
        />,
      );
    });

    act(() => {
      renderer.root.findByProps({ accessibilityLabel: 'Copy Global MetaID' }).props.onPress();
    });

    const screenText = collectText(renderer.toJSON()).join('\n');
    expect(renderer.root.findByProps({ children: 'Alice' })).toBeTruthy();
    expect(renderer.root.findByProps({ children: 'alice-gm' })).toBeTruthy();
    expect(screenText).toContain('Private chat unavailable');
    expect(screenText).toContain('Chat sync disconnected');
    expect(renderer.root.findByProps({ accessibilityLabel: 'Copy Global MetaID' })).toBeTruthy();
    expect(renderer.root.findAllByProps({ accessibilityLabel: 'Copy MVC address' })).toHaveLength(0);
    expect(renderer.root.findAllByProps({ accessibilityLabel: 'Copy chat public key' })).toHaveLength(0);
    expect(onCopyValue).toHaveBeenCalledWith('Global MetaID', 'alice-gm');
  });

  it('renders missing profile data without broken rows or settings placeholders', () => {
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

    const screenText = collectText(renderer.toJSON()).join('\n');
    expect(renderer.root.findByProps({ children: 'IDChat User' })).toBeTruthy();
    expect(renderer.root.findAllByProps({ accessibilityLabel: 'IDChat User avatar' }).length).toBeGreaterThan(0);
    expect(
      renderer.root.findAll((node) => node.props.children === 'Not connected').length,
    ).toBeGreaterThan(0);
    expect(renderer.root.findByProps({ children: 'Address unavailable' })).toBeTruthy();
    expect(renderer.root.findByProps({ children: 'Chat public key unavailable' })).toBeTruthy();
    expect(screenText).toContain('Private chat unavailable');
    expect(screenText).toContain('Chat sync disconnected');
    expect(screenText).not.toContain('undefined');
    expect(screenText).not.toContain('[object Object]');
    expect(screenText).not.toMatch(/private key/i);
    expect(renderer.root.findAll((node) => node.props.children === 'Native settings')).toHaveLength(0);
    expect(
      renderer.root.findAll((node) => node.props.children === 'No native chat settings available yet'),
    ).toHaveLength(0);
    expect(renderer.root.findAllByProps({ accessibilityLabel: 'Copy Global MetaID' })).toHaveLength(0);
    expect(renderer.root.findAllByProps({ accessibilityLabel: 'Copy MVC address' })).toHaveLength(0);
    expect(renderer.root.findAllByProps({ accessibilityLabel: 'Copy chat public key' })).toHaveLength(0);
    expect(renderer.root.findAllByProps({ accessibilityLabel: 'Open unsupported native setting' })).toHaveLength(0);
  });
});
