import React, { useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { CircleUserRound } from 'lucide-react-native';
import { AccountMenuTokens, BrandColors, Radius } from '../constants/theme';

export function AccountAvatar({ uri }: { uri?: string }) {
  const [failedUri, setFailedUri] = useState<string | null>(null);
  return <View style={styles.avatar}>
    {uri && failedUri !== uri ? <Image accessibilityLabel="Ảnh đại diện tài khoản" source={{ uri }} style={styles.avatar} resizeMode="cover"
      onError={() => setFailedUri(uri)} /> : <CircleUserRound size={27} color={BrandColors.accentPink} />}
  </View>;
}

const styles = StyleSheet.create({
  avatar: { width: AccountMenuTokens.avatarSize, height: AccountMenuTokens.avatarSize, borderRadius: Radius.full,
    backgroundColor: BrandColors.bgCard, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
});
