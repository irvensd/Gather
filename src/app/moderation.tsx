import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';

import { CommunityAvatar } from '@/components/community/CommunityAvatar';
import { EmptyState } from '@/components/ui/EmptyState';
import { IconButton } from '@/components/ui/IconButton';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { SegmentedFilter } from '@/components/ui/SegmentedFilter';
import { readableCommunityName } from '@/constants/communities';
import { type ModerationAction } from '@/constants/moderationReasons';
import { reportReasonLabel } from '@/constants/reportReasons';
import { useRequireSignIn } from '@/features/auth/requireSignIn';
import { ModerationSheet } from '@/features/moderation/ModerationSheet';
import { getApi } from '@/lib/backend';
import type { ModerationHistoryItem } from '@/lib/backend/api';
import { formatFriendlyTime } from '@/lib/time';
import { useToast } from '@/store/toast';
import { useTheme } from '@/theme/ThemeProvider';
import type { ReportItem } from '@/types';

type Tab = 'reports' | 'history';

const ACTION_TOASTS: Record<ModerationAction, string> = {
  remove: 'Removed. The author can see why in Activity.',
  lock: 'Discussion locked',
  unlock: 'Discussion unlocked',
  dismiss: 'Report dismissed',
};

function historyHeadline(item: ModerationHistoryItem) {
  const thing = item.targetType === 'post' ? 'a post' : 'a comment';
  if (item.action === 'remove') return `Removed ${thing}`;
  if (item.action === 'lock') return 'Locked a discussion';
  if (item.action === 'unlock') return 'Unlocked a discussion';
  if (item.action === 'dismiss') return `Dismissed a report on ${thing}`;
  return item.action;
}

function historyIcon(action: string): keyof typeof Ionicons.glyphMap {
  if (action === 'remove') return 'trash-outline';
  if (action === 'lock') return 'lock-closed-outline';
  if (action === 'unlock') return 'lock-open-outline';
  return 'checkmark-circle-outline';
}

export default function ModerationScreen() {
  const signedIn = useRequireSignIn('/moderation');
  const theme = useTheme();
  const client = useQueryClient();
  const params = useLocalSearchParams<{ community?: string }>();
  const [tab, setTab] = useState<Tab>('reports');
  const [communityFilter, setCommunityFilter] = useState<string | null>(params.community ?? null);
  const [acting, setActing] = useState<{ report: ReportItem; action: ModerationAction; key: number } | null>(null);
  const reports = useQuery({ queryKey: ['reports'], enabled: signedIn, queryFn: async () => (await getApi()).listReports() });
  const history = useQuery({ queryKey: ['moderation-history'], enabled: signedIn, queryFn: async () => (await getApi()).listModerationHistory() });

  const open = useMemo(() => (reports.data ?? []).filter((report) => report.status === 'open'), [reports.data]);
  const communities = useMemo(() => {
    const seen = new Map<string, { id: string; name: string; icon?: string | null; color?: string | null; count: number }>();
    for (const report of open) {
      const entry = seen.get(report.communityId);
      if (entry) entry.count += 1;
      else
        seen.set(report.communityId, {
          id: report.communityId,
          name: report.communityName,
          icon: report.communityIcon,
          color: report.communityColor,
          count: 1,
        });
    }
    return [...seen.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }, [open]);
  const filterName =
    communities.find((item) => item.id === communityFilter)?.name ?? (reports.data ?? []).find((item) => item.communityId === communityFilter)?.communityName;
  const visibleReports = communityFilter ? open.filter((report) => report.communityId === communityFilter) : open;
  const visibleHistory = communityFilter && filterName ? (history.data ?? []).filter((item) => item.communityName === filterName) : (history.data ?? []);

  function goBack() {
    if (router.canGoBack()) router.back();
    else router.navigate('/profile');
  }

  async function refresh() {
    await Promise.all([reports.refetch(), history.refetch()]);
  }

  async function act(reason: string) {
    if (!acting) return;
    const { report, action } = acting;
    try {
      await (
        await getApi()
      ).moderate({ reportId: report.id, communityId: report.communityId, targetType: report.targetType, targetId: report.targetId, action, reason });
    } catch (error) {
      setActing(null);
      useToast.getState().show(error instanceof Error ? error.message : 'Something went wrong.');
      return;
    }
    setActing(null);
    useToast.getState().show(ACTION_TOASTS[action]);
    await Promise.all([
      client.invalidateQueries({ queryKey: ['reports'] }),
      client.invalidateQueries({ queryKey: ['moderation-history'] }),
      client.invalidateQueries({ queryKey: ['feed'] }),
      ...(report.postId
        ? [client.invalidateQueries({ queryKey: ['post', report.postId] }), client.invalidateQueries({ queryKey: ['comments', report.postId] })]
        : []),
    ]);
  }

  const loading = tab === 'reports' ? reports.isLoading : history.isLoading;
  const refreshing = (reports.isRefetching || history.isRefetching) && !loading;

  const header = (
    <View style={{ gap: theme.spacing.md, paddingBottom: theme.spacing.md }}>
      <View style={{ paddingHorizontal: theme.spacing.lg }}>
        <SegmentedFilter
          onChange={setTab}
          options={[
            { value: 'reports', label: open.length ? `Reports (${open.length})` : 'Reports' },
            { value: 'history', label: 'History' },
          ]}
          value={tab}
        />
      </View>
      {communities.length > 1 || communityFilter ? (
        <ScrollView contentContainerStyle={{ paddingHorizontal: theme.spacing.lg, gap: theme.spacing.sm }} horizontal showsHorizontalScrollIndicator={false}>
          <FilterChip label="All communities" onPress={() => setCommunityFilter(null)} selected={!communityFilter} />
          {communities.map((item) => (
            <FilterChip
              key={item.id}
              color={item.color}
              icon={item.icon}
              label={`${readableCommunityName(item.name)} · ${item.count}`}
              onPress={() => setCommunityFilter(item.id)}
              selected={communityFilter === item.id}
            />
          ))}
          {communityFilter && !communities.some((item) => item.id === communityFilter) && filterName ? (
            <FilterChip label={readableCommunityName(filterName)} onPress={() => undefined} selected />
          ) : null}
        </ScrollView>
      ) : null}
    </View>
  );

  if (!signedIn) return null;
  return (
    <ScreenContainer>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <IconButton label="Back" name="chevron-back" onPress={goBack} />
        <Text accessibilityRole="header" style={[theme.type.section, { color: theme.colors.text }]}>
          Moderation
        </Text>
      </View>
      {tab === 'reports' ? (
        <FlatList
          contentContainerStyle={{ paddingBottom: 48 }}
          data={visibleReports}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            loading ? (
              <LoadingSkeleton />
            ) : (
              <EmptyState
                icon="shield-checkmark-outline"
                message={
                  communityFilter
                    ? 'Nothing is waiting in this community.'
                    : 'When someone reports a post or comment in a community you moderate, it shows up here.'
                }
                title="All caught up"
              />
            )
          }
          ListHeaderComponent={header}
          refreshControl={<RefreshControl onRefresh={() => void refresh()} refreshing={refreshing} />}
          renderItem={({ item }) => <ReportCard onAct={(action) => setActing({ report: item, action, key: Date.now() })} report={item} />}
        />
      ) : (
        <FlatList
          contentContainerStyle={{ paddingBottom: 48 }}
          data={visibleHistory}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            loading ? (
              <LoadingSkeleton />
            ) : (
              <EmptyState icon="time-outline" message="Removals, locks, and dismissed reports are listed here." title="No actions yet" />
            )
          }
          ListHeaderComponent={header}
          refreshControl={<RefreshControl onRefresh={() => void refresh()} refreshing={refreshing} />}
          renderItem={({ item }) => <HistoryRow item={item} />}
        />
      )}
      <ModerationSheet
        key={acting?.key ?? 'none'}
        onClose={() => setActing(null)}
        onSubmit={act}
        request={acting ? { action: acting.action, targetType: acting.report.targetType } : null}
      />
    </ScreenContainer>
  );
}

function FilterChip({
  label,
  selected,
  onPress,
  icon,
  color,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  icon?: string | null;
  color?: string | null;
}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={{
        minHeight: 44,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 14,
        borderRadius: theme.radius.pill,
        borderWidth: 1,
        borderColor: selected ? theme.colors.primary : theme.colors.border,
        backgroundColor: selected ? theme.colors.highlight : theme.colors.surface,
      }}
    >
      {icon ? <CommunityAvatar color={color} icon={icon} size={24} /> : null}
      <Text style={[theme.type.body, { color: theme.colors.text, fontWeight: selected ? '600' : '400' }]}>{label}</Text>
    </Pressable>
  );
}

function ReportCard({ report, onAct }: { report: ReportItem; onAct: (action: ModerationAction) => void }) {
  const theme = useTheme();
  const kind = report.targetType === 'post' ? 'Post' : 'Comment';
  const button = (label: string, action: ModerationAction, tone: 'danger' | 'plain') => (
    <Pressable
      accessibilityRole="button"
      onPress={() => onAct(action)}
      style={{
        minHeight: 44,
        paddingHorizontal: 16,
        borderRadius: theme.radius.pill,
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: tone === 'danger' ? theme.colors.danger : theme.colors.border,
        backgroundColor: tone === 'danger' ? theme.colors.danger : 'transparent',
      }}
    >
      <Text style={[theme.type.body, { color: tone === 'danger' ? theme.colors.onPrimary : theme.colors.text, fontWeight: '600' }]}>{label}</Text>
    </Pressable>
  );
  return (
    <View
      style={{
        marginHorizontal: theme.spacing.lg,
        marginBottom: theme.spacing.md,
        padding: theme.spacing.lg,
        gap: theme.spacing.sm,
        borderRadius: theme.radius.lg,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.surface,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
        <CommunityAvatar color={report.communityColor} icon={report.communityIcon ?? 'people-outline'} size={28} />
        <Text numberOfLines={1} style={[theme.type.body, { color: theme.colors.muted, flex: 1 }]}>
          {readableCommunityName(report.communityName)} · {formatFriendlyTime(report.createdAt)}
        </Text>
        <View style={{ paddingHorizontal: 10, paddingVertical: 2, borderRadius: theme.radius.pill, backgroundColor: theme.colors.highlight }}>
          <Text style={[theme.type.caption, { color: theme.colors.text, fontWeight: '600' }]}>{kind}</Text>
        </View>
      </View>
      <Text style={[theme.type.body, { color: theme.colors.text, fontWeight: '700' }]}>{reportReasonLabel(report.reason)}</Text>
      {report.details ? <Text style={[theme.type.body, { color: theme.colors.text }]}>“{report.details}”</Text> : null}
      <View style={{ borderLeftWidth: 3, borderLeftColor: theme.colors.border, paddingLeft: theme.spacing.md, paddingVertical: 2 }}>
        <Text numberOfLines={4} style={[theme.type.body, { color: report.excerpt ? theme.colors.text : theme.colors.muted }]}>
          {report.excerpt || `This ${kind.toLowerCase()} has no text left.`}
        </Text>
      </View>
      <Text style={[theme.type.body, { color: theme.colors.muted }]}>
        Reported by {report.reporterUsername ? `@${report.reporterUsername}` : 'a deleted account'}
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm, marginTop: theme.spacing.xs }}>
        {button(`Remove ${kind.toLowerCase()}`, 'remove', 'danger')}
        {report.targetType === 'post' ? button('Lock', 'lock', 'plain') : null}
        {button('Dismiss', 'dismiss', 'plain')}
        {report.postId ? (
          <Pressable
            accessibilityRole="link"
            onPress={() => router.push(`/post/${report.postId}`)}
            style={{ minHeight: 44, paddingHorizontal: 8, justifyContent: 'center' }}
          >
            <Text style={[theme.type.body, { color: theme.colors.primary, fontWeight: '600' }]}>View</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function HistoryRow({ item }: { item: ModerationHistoryItem }) {
  const theme = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        gap: theme.spacing.md,
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
      }}
    >
      <View style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.highlight }}>
        <Ionicons color={item.action === 'remove' ? theme.colors.danger : theme.colors.primary} name={historyIcon(item.action)} size={20} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[theme.type.body, { color: theme.colors.text, fontWeight: '600' }]}>
          {historyHeadline(item)} in {readableCommunityName(item.communityName)}
        </Text>
        <Text style={[theme.type.body, { color: theme.colors.text }]}>{item.reason}</Text>
        <Text style={[theme.type.body, { color: theme.colors.muted }]}>
          {item.moderatorUsername ? `@${item.moderatorUsername} · ` : ''}
          {formatFriendlyTime(item.createdAt)}
        </Text>
      </View>
    </View>
  );
}
