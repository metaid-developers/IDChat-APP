import React from 'react';
import {
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { NativeChatGroupInfo, NativeChatGroupMember } from '../domain/types';
import { nativeChatTheme } from '../ui/chatTheme';
import {
  getGroupInfoIdViewModel,
  getGroupInfoMuteLabel,
  getGroupInfoSummaryTitle,
} from '../ui/groupInfoUi';
import ChatAvatar from './ChatAvatar';

type GroupInfoDrawerProps = {
  visible: boolean;
  groupInfo?: NativeChatGroupInfo;
  fallbackGroupId?: string;
  members: NativeChatGroupMember[];
  searchQuery: string;
  loading?: boolean;
  copyFeedback?: string;
  errorMessage?: string;
  hasMoreMembers?: boolean;
  onChangeSearchQuery: (query: string) => void;
  onClose: () => void;
  onCopyGroupId: () => void;
  onLoadMore?: () => void;
  onRetry?: () => void;
};

function getMemberTitle(member: NativeChatGroupMember): string {
  return member.name || member.globalMetaId || member.metaId || member.memberId;
}

function getMemberSubtitle(member: NativeChatGroupMember): string {
  return [member.role, member.globalMetaId || member.metaId || member.address]
    .filter(Boolean)
    .join(' · ');
}

export default function GroupInfoDrawer({
  visible,
  groupInfo,
  fallbackGroupId,
  members,
  searchQuery,
  loading = false,
  copyFeedback,
  errorMessage,
  hasMoreMembers = false,
  onChangeSearchQuery,
  onClose,
  onCopyGroupId,
  onLoadMore,
  onRetry,
}: GroupInfoDrawerProps) {
  const title = getGroupInfoSummaryTitle(groupInfo);
  const memberCount = groupInfo?.memberCount ?? members.length;
  const groupId = getGroupInfoIdViewModel(groupInfo, fallbackGroupId);

  return (
    <Modal animationType="slide" onRequestClose={onClose} transparent visible={visible}>
      <View style={styles.overlay}>
        <Pressable accessibilityLabel="Dismiss group info" onPress={onClose} style={styles.backdrop} />
        <SafeAreaView style={styles.drawer}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Group info</Text>
            <Pressable accessibilityLabel="Close group info" hitSlop={12} onPress={onClose}>
              <Text style={styles.closeText}>Close</Text>
            </Pressable>
          </View>

          <View style={styles.summary}>
            <ChatAvatar name={title} size={52} uri={groupInfo?.avatar} />
            <View style={styles.summaryText}>
              <Text numberOfLines={1} style={styles.groupName}>
                {title}
              </Text>
              <Text numberOfLines={1} style={styles.groupMeta}>
                {`${memberCount} ${memberCount === 1 ? 'member' : 'members'}`}
              </Text>
            </View>
          </View>

          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Group id</Text>
              <View style={styles.groupIdRow}>
                <Text numberOfLines={1} selectable style={styles.infoValue}>
                  {groupId.displayValue}
                </Text>
                {groupId.copyEnabled ? (
                  <Pressable
                    accessibilityLabel="Copy group id"
                    accessibilityRole="button"
                    hitSlop={10}
                    onPress={onCopyGroupId}
                  >
                    <Text style={styles.linkText}>Copy</Text>
                  </Pressable>
                ) : null}
              </View>
              {copyFeedback ? <Text style={styles.copyFeedback}>{copyFeedback}</Text> : null}
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Mute</Text>
              <Text numberOfLines={1} style={styles.infoValue}>
                {getGroupInfoMuteLabel(groupInfo)}
              </Text>
            </View>
          </View>

          {loading ? (
            <View style={styles.statusPanel}>
              <Text style={styles.statusTitle}>Loading group info</Text>
            </View>
          ) : null}

          {errorMessage ? (
            <View style={[styles.statusPanel, styles.errorPanel]}>
              <Text style={styles.statusTitle}>Group info could not refresh</Text>
              <Text style={styles.statusBody}>{errorMessage}</Text>
              {onRetry ? (
                <Pressable
                  accessibilityLabel="Retry group info"
                  accessibilityRole="button"
                  onPress={onRetry}
                  style={styles.retryButton}
                >
                  <Text style={styles.retryText}>Retry</Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}

          {groupInfo?.announcement ? (
            <View style={styles.announcement}>
              <Text style={styles.infoLabel}>Announcement</Text>
              <Text style={styles.announcementText}>{groupInfo.announcement}</Text>
            </View>
          ) : null}

          <TextInput
            accessibilityLabel="Search group members"
            autoCapitalize="none"
            onChangeText={onChangeSearchQuery}
            placeholder="Search members"
            placeholderTextColor={nativeChatTheme.color.faintText}
            style={styles.searchInput}
            value={searchQuery}
          />

          <View style={styles.membersHeader}>
            <Text style={styles.sectionTitle}>Members</Text>
            {loading ? <Text style={styles.loadingText}>Loading</Text> : null}
          </View>
          <ScrollView keyboardShouldPersistTaps="handled" style={styles.memberList}>
            {members.map((member) => {
              const memberTitle = getMemberTitle(member);

              return (
                <View key={member.memberId} style={styles.memberRow}>
                  <ChatAvatar name={memberTitle} size={34} uri={member.avatar} />
                  <View style={styles.memberText}>
                    <Text numberOfLines={1} style={styles.memberName}>
                      {memberTitle}
                    </Text>
                    <Text numberOfLines={1} style={styles.memberMeta}>
                      {getMemberSubtitle(member)}
                    </Text>
                  </View>
                </View>
              );
            })}
          </ScrollView>
          {hasMoreMembers ? (
            <Pressable
              accessibilityLabel="Load more group members"
              accessibilityRole="button"
              onPress={onLoadMore}
              style={styles.loadMoreButton}
            >
              <Text style={styles.loadMoreText}>Load more</Text>
            </Pressable>
          ) : null}
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  announcement: {
    backgroundColor: nativeChatTheme.color.surface,
    borderColor: nativeChatTheme.color.border,
    borderRadius: nativeChatTheme.radius.compact,
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: 12,
    padding: 12,
  },
  announcementText: {
    color: nativeChatTheme.color.text,
    fontSize: nativeChatTheme.font.body,
    lineHeight: 20,
    marginTop: 4,
  },
  backdrop: {
    flex: 1,
  },
  closeText: {
    color: nativeChatTheme.color.primary,
    fontSize: nativeChatTheme.font.body,
    fontWeight: '700',
  },
  copyFeedback: {
    color: nativeChatTheme.color.success,
    fontSize: nativeChatTheme.font.meta,
    fontWeight: '700',
    marginTop: 6,
  },
  drawer: {
    backgroundColor: nativeChatTheme.color.background,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    maxHeight: '88%',
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  groupIdRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  groupMeta: {
    color: nativeChatTheme.color.mutedText,
    fontSize: nativeChatTheme.font.body,
    lineHeight: 19,
  },
  groupName: {
    color: nativeChatTheme.color.text,
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 25,
  },
  handle: {
    alignSelf: 'center',
    backgroundColor: nativeChatTheme.color.border,
    borderRadius: nativeChatTheme.radius.round,
    height: 4,
    marginBottom: 12,
    width: 42,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  headerTitle: {
    color: nativeChatTheme.color.text,
    fontSize: nativeChatTheme.font.headerTitle,
    fontWeight: '700',
  },
  infoGrid: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  infoItem: {
    backgroundColor: nativeChatTheme.color.surface,
    borderColor: nativeChatTheme.color.border,
    borderRadius: nativeChatTheme.radius.compact,
    borderWidth: StyleSheet.hairlineWidth,
    flex: 1,
    minHeight: 58,
    padding: 10,
  },
  infoLabel: {
    color: nativeChatTheme.color.mutedText,
    fontSize: nativeChatTheme.font.meta,
    fontWeight: '700',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  infoValue: {
    color: nativeChatTheme.color.text,
    flex: 1,
    fontSize: nativeChatTheme.font.body,
    fontWeight: '700',
  },
  errorPanel: {
    borderColor: nativeChatTheme.color.failed,
  },
  linkText: {
    color: nativeChatTheme.color.primary,
    fontSize: nativeChatTheme.font.body,
    fontWeight: '700',
  },
  loadMoreButton: {
    alignItems: 'center',
    backgroundColor: nativeChatTheme.color.surface,
    borderColor: nativeChatTheme.color.border,
    borderRadius: nativeChatTheme.radius.compact,
    borderWidth: StyleSheet.hairlineWidth,
    marginVertical: 12,
    minHeight: 42,
    justifyContent: 'center',
  },
  loadMoreText: {
    color: nativeChatTheme.color.primary,
    fontSize: nativeChatTheme.font.body,
    fontWeight: '700',
  },
  loadingText: {
    color: nativeChatTheme.color.mutedText,
    fontSize: nativeChatTheme.font.meta,
    fontWeight: '700',
  },
  memberList: {
    marginTop: 8,
  },
  memberMeta: {
    color: nativeChatTheme.color.mutedText,
    fontSize: nativeChatTheme.font.meta,
    lineHeight: 16,
    marginTop: 1,
  },
  memberName: {
    color: nativeChatTheme.color.text,
    fontSize: nativeChatTheme.font.body,
    fontWeight: '700',
    lineHeight: 18,
  },
  memberRow: {
    alignItems: 'center',
    backgroundColor: nativeChatTheme.color.surface,
    borderColor: nativeChatTheme.color.border,
    borderRadius: nativeChatTheme.radius.compact,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
    minHeight: 54,
    paddingHorizontal: 10,
  },
  memberText: {
    flex: 1,
    minWidth: 0,
  },
  membersHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
  },
  overlay: {
    backgroundColor: 'rgba(17, 24, 39, 0.36)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  searchInput: {
    backgroundColor: nativeChatTheme.color.surface,
    borderColor: nativeChatTheme.color.border,
    borderRadius: nativeChatTheme.radius.compact,
    borderWidth: StyleSheet.hairlineWidth,
    color: nativeChatTheme.color.text,
    fontSize: nativeChatTheme.font.body,
    marginTop: 12,
    minHeight: 42,
    paddingHorizontal: 12,
  },
  sectionTitle: {
    color: nativeChatTheme.color.text,
    fontSize: nativeChatTheme.font.body,
    fontWeight: '700',
  },
  retryButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: nativeChatTheme.color.primary,
    borderRadius: nativeChatTheme.radius.compact,
    marginTop: 10,
    minHeight: 34,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  retryText: {
    color: nativeChatTheme.color.surface,
    fontSize: nativeChatTheme.font.body,
    fontWeight: '700',
  },
  statusBody: {
    color: nativeChatTheme.color.mutedText,
    fontSize: nativeChatTheme.font.body,
    lineHeight: 20,
    marginTop: 4,
  },
  statusPanel: {
    backgroundColor: nativeChatTheme.color.surface,
    borderColor: nativeChatTheme.color.border,
    borderRadius: nativeChatTheme.radius.compact,
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: 12,
    padding: 12,
  },
  statusTitle: {
    color: nativeChatTheme.color.text,
    fontSize: nativeChatTheme.font.body,
    fontWeight: '800',
  },
  summary: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  summaryText: {
    flex: 1,
    minWidth: 0,
  },
});
