import React, { memo, useState } from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BrandColors } from '../../constants/theme';

/** Measure the full caption so truncation follows rendered lines, not character count. */
export const PostCaption = memo(function PostCaption({ text, title, compact = false }: { text: string; title?: string; compact?: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const [canExpand, setCanExpand] = useState(false);
  if (!text && !title) return null;
  return <View style={[styles.container, compact && styles.compactContainer]} testID="post-caption">
    {title ? <Text style={styles.title}>{title}</Text> : null}
    <Text style={[styles.text, compact && styles.compactText, styles.measure]} pointerEvents="none" accessible={false}
      accessibilityElementsHidden importantForAccessibility="no-hide-descendants" testID="caption-measure"
      onTextLayout={Platform.OS === 'web' ? undefined : event => setCanExpand(event.nativeEvent.lines.length > 3)}
      onLayout={Platform.OS === 'web' ? event => setCanExpand(event.nativeEvent.layout.height > 3 * (compact ? 20 : 23) + 1) : undefined}>{text}</Text>
    <View style={compact && styles.inlineRow}>
    <Text style={[styles.text, compact && styles.compactText, compact && styles.inlineText]} numberOfLines={expanded ? undefined : 3} testID="caption-visible">{text}</Text>
    {canExpand ? <TouchableOpacity onPress={() => setExpanded(current => !current)} style={[styles.expand, compact && styles.compactExpand]}
      accessibilityRole="button" accessibilityLabel={expanded ? 'Thu gọn mô tả' : 'Xem thêm mô tả'} accessibilityState={{ expanded }}>
      <Text style={styles.expandText}>{expanded ? 'Thu gọn' : '… Xem thêm'}</Text>
    </TouchableOpacity> : null}
    </View>
  </View>;
});

const styles = StyleSheet.create({
  container: { marginBottom: 12 },
  compactContainer: { marginBottom: 8 },
  title: { color: BrandColors.textDark, fontSize: 15, lineHeight: 20, fontWeight: '700', marginBottom: 4 },
  compactText: { fontSize: 14, lineHeight: 20 },
  inlineRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 4 },
  inlineText: { flex: 1, minWidth: 0 },
  compactExpand: { alignSelf: 'flex-end', minHeight: 20, paddingVertical: 0 },
  text: { fontSize: 15, lineHeight: 23, color: BrandColors.textDark },
  measure: { position: 'absolute', left: 0, right: 0, top: 0, opacity: 0 },
  expand: { alignSelf: 'flex-start', minHeight: 44, justifyContent: 'center' },
  expandText: { color: BrandColors.primaryPink, fontSize: 14, fontWeight: '600' },
});
