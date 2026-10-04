import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BrandColors, Radius, Spacing, Typography } from '../constants/theme';
import { REVIEW_DATA_NOTICE } from '../utils/playReview';

export function ReviewNotice({ message = REVIEW_DATA_NOTICE, title = 'Tài khoản đánh giá' }: { message?: string; title?: string }) {
  return <View style={styles.card}><Text style={styles.title}>{title}</Text><Text style={styles.text}>{message}</Text></View>;
}
const styles = StyleSheet.create({ card: { backgroundColor: BrandColors.bgPinkLight, borderRadius: Radius.md, padding: Spacing.md, margin: Spacing.md }, title: { fontFamily: Typography.semiBold, color: BrandColors.textDark, marginBottom: 4 }, text: { fontFamily: Typography.regular, color: BrandColors.textSecondary, fontSize: 13, lineHeight: 20 } });
