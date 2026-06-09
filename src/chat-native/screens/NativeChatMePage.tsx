import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { nativeChatTheme } from '../ui/chatTheme';

export default function NativeChatMePage() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Me</Text>
        <Text style={styles.subtitle}>IDChat profile and account identity</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: nativeChatTheme.color.surface,
    flex: 1,
  },
  header: {
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  subtitle: {
    color: nativeChatTheme.color.mutedText,
    fontSize: 13,
    marginTop: 4,
  },
  title: {
    color: nativeChatTheme.color.text,
    fontSize: 22,
    fontWeight: '700',
  },
});
