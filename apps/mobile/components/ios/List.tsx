import { Children, cloneElement, isValidElement, type ReactElement, type ReactNode } from 'react';
import { Pressable, StyleSheet, Switch, Text, View, type ViewStyle } from 'react-native';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { ios, iosMetrics, iosType } from '@/theme';
import type { SymbolViewProps } from 'expo-symbols';
import { useRouter, type Href } from 'expo-router';
import { haptics } from './Haptics';

// ── Section ───────────────────────────────────────────────────────────────────

type ListSectionProps = {
  header?: string;
  footer?: string;
  children: ReactNode;
  style?: ViewStyle;
};

/**
 * iOS grouped inset 리스트 섹션 — 헤더/푸터 텍스트 + 둥근 카드에 행들을 묶고
 * 행 사이에 좌측 인셋 hairline 구분선을 그린다.
 */
export function ListSection({ header, footer, children, style }: ListSectionProps) {
  const rows = Children.toArray(children).filter(isValidElement) as ReactElement<{ isLast?: boolean }>[];

  return (
    <View style={[styles.section, style]}>
      {header ? <Text style={styles.header}>{header.toUpperCase()}</Text> : null}
      <View style={styles.card}>
        {rows.map((child, i) => cloneElement(child, { isLast: i === rows.length - 1, key: child.key ?? i }))}
      </View>
      {footer ? <Text style={styles.footer}>{footer}</Text> : null}
    </View>
  );
}

// ── Row ───────────────────────────────────────────────────────────────────────

type Accessory = 'chevron' | 'none';

export type ListRowProps = {
  title: string;
  subtitle?: string;
  /** 우측 detail 텍스트 (예: 값/상태). */
  value?: string;
  /** 좌측 SF Symbol 아이콘 이름. */
  icon?: SymbolViewProps['name'];
  /** 아이콘 배경 틴트 (systemBlue 등). 주면 iOS 설정앱 스타일 라운드 배경. */
  iconBackground?: string;
  accessory?: Accessory;
  /** 우측 스위치 (accessory 대신). */
  switchValue?: boolean;
  onSwitchChange?: (value: boolean) => void;
  onPress?: () => void;
  destructive?: boolean;
  /** ListSection이 주입 — 마지막 행이면 구분선 생략. */
  isLast?: boolean;
};

export function ListRow({
  title,
  subtitle,
  value,
  icon,
  iconBackground,
  accessory,
  switchValue,
  onSwitchChange,
  onPress,
  destructive = false,
  isLast = false,
}: ListRowProps) {
  const hasSwitch = switchValue !== undefined;
  const showChevron = accessory === 'chevron' || (!hasSwitch && accessory !== 'none' && !!onPress);

  const content = (
    <View style={styles.rowInner}>
      {icon ? (
        <View style={[styles.iconWrap, iconBackground ? { backgroundColor: iconBackground } : styles.iconPlain]}>
          <IconSymbol name={icon} size={18} color={iconBackground ? '#FFFFFF' : ios.tint} />
        </View>
      ) : null}
      <View style={styles.textWrap}>
        <Text style={[styles.title, destructive && styles.destructive]} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {value ? (
        <Text style={styles.value} numberOfLines={1}>
          {value}
        </Text>
      ) : null}
      {hasSwitch ? (
        <Switch value={switchValue} onValueChange={onSwitchChange} />
      ) : showChevron ? (
        <IconSymbol name="chevron.right" size={14} color={ios.tertiaryLabel} weight="semibold" />
      ) : null}
    </View>
  );

  return (
    <View>
      {onPress && !hasSwitch ? (
        <Pressable
          onPress={() => {
            haptics.selection();
            onPress();
          }}
          style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
          {content}
        </Pressable>
      ) : (
        <View style={styles.row}>{content}</View>
      )}
      {!isLast ? <View style={styles.separator} /> : null}
    </View>
  );
}

// ── Row (navigation link) ───────────────────────────────────────────────────

type ListRowLinkProps = Omit<ListRowProps, 'onPress' | 'accessory' | 'switchValue' | 'onSwitchChange'> & {
  href: Href;
};

/** expo-router로 이동하는 ListRow (우측 chevron 자동). */
export function ListRowLink({ href, ...rowProps }: ListRowLinkProps) {
  const router = useRouter();
  return <ListRow {...rowProps} accessory="chevron" onPress={() => router.push(href)} />;
}

const styles = StyleSheet.create({
  section: { marginTop: iosMetrics.spacing[6] },
  header: {
    ...iosType.footnote,
    color: ios.secondaryLabel,
    marginBottom: iosMetrics.spacing[2],
    marginHorizontal: iosMetrics.groupedInset + iosMetrics.spacing[1],
  },
  footer: {
    ...iosType.footnote,
    color: ios.secondaryLabel,
    marginTop: iosMetrics.spacing[2],
    marginHorizontal: iosMetrics.groupedInset + iosMetrics.spacing[1],
  },
  card: {
    marginHorizontal: iosMetrics.groupedInset,
    backgroundColor: ios.secondarySystemGroupedBackground,
    borderRadius: iosMetrics.radius.lg,
    overflow: 'hidden',
  },
  row: { minHeight: iosMetrics.rowMinHeight, justifyContent: 'center', paddingHorizontal: iosMetrics.spacing[4] },
  rowPressed: { backgroundColor: ios.systemFill },
  rowInner: { flexDirection: 'row', alignItems: 'center', gap: iosMetrics.spacing[3], paddingVertical: iosMetrics.spacing[2] },
  iconWrap: { width: 29, height: 29, borderRadius: iosMetrics.radius.xs, alignItems: 'center', justifyContent: 'center' },
  iconPlain: { backgroundColor: 'transparent' },
  textWrap: { flex: 1, gap: 2 },
  title: { ...iosType.body, color: ios.label },
  subtitle: { ...iosType.footnote, color: ios.secondaryLabel },
  value: { ...iosType.body, color: ios.secondaryLabel },
  destructive: { color: ios.systemRed },
  separator: { height: iosMetrics.hairline, backgroundColor: ios.separator, marginLeft: iosMetrics.spacing[4] },
});
