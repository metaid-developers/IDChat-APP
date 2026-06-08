import React from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { goBack, navigate } from '@/base/NavigationService';
import { classifyChatLink } from '../services/chatLinkClassifier';

type ChatLinkShellPageProps = {
  route?: {
    params?: {
      url?: string;
    };
  };
};

export default function ChatLinkShellPage({ route }: ChatLinkShellPageProps) {
  const url = route?.params?.url || '';
  const classification = classifyChatLink(url);
  const isWebUrl = classification.kind === 'web-url';

  const openWebUrl = () => {
    if (classification.kind === 'web-url') {
      navigate('OpenWebsPage', { url: classification.url });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>{classification.label || 'Unsupported link'}</Text>
        {isWebUrl ? (
          <Text style={styles.urlText}>{classification.url}</Text>
        ) : (
          <Text style={styles.messageText}>This chat app link is not available natively yet.</Text>
        )}
        <View style={styles.actions}>
          {isWebUrl ? (
            <Pressable style={styles.primaryButton} onPress={openWebUrl}>
              <Text style={styles.primaryButtonText}>Open Web</Text>
            </Pressable>
          ) : null}
          <Pressable style={styles.secondaryButton} onPress={goBack}>
            <Text style={styles.secondaryButtonText}>Back</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  actions: {
    gap: 12,
    marginTop: 32,
  },
  container: {
    backgroundColor: '#ffffff',
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  messageText: {
    color: '#444444',
    fontSize: 15,
    lineHeight: 22,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: '#111111',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    alignItems: 'center',
    borderColor: '#dddddd',
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  secondaryButtonText: {
    color: '#222222',
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    color: '#111111',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
  },
  urlText: {
    color: '#333333',
    fontSize: 15,
    lineHeight: 22,
  },
});
