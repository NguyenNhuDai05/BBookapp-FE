import { Image, type ImageProps } from 'expo-image';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { api } from '../services/api';

type Props = Pick<ImageProps, 'style' | 'contentFit'> & { uri?: string; mediaId?: string | null };
export function PrivateMediaImage({ uri, mediaId, ...props }: Props) {
  const [source, setSource] = useState(uri);
  const [failed, setFailed] = useState(false);
  const attempts = useRef(0);
  const generation = useRef(0);
  const renew = useCallback(async () => {
    if (!mediaId) { setFailed(true); return; }
    const current = generation.current;
    try {
      const result = await api.get<{ url: string }>(`/verification-media/${mediaId}/access`);
      if (current === generation.current) { setSource(result.data.url); setFailed(false); }
    } catch { if (current === generation.current) setFailed(true); }
  }, [mediaId]);
  useEffect(() => {
    generation.current++; attempts.current = 0; setSource(uri); setFailed(false);
    if (!uri && mediaId) { attempts.current++; void renew(); }
    return () => { generation.current++; };
  }, [uri, mediaId, renew]);
  if (failed) return <View style={props.style}><TouchableOpacity accessibilityLabel="Tải lại ảnh riêng tư" onPress={() => { attempts.current = 1; void renew(); }}><Text>Không thể tải ảnh. Thử lại</Text></TouchableOpacity></View>;
  return <Image {...props} source={source ? { uri: source } : undefined} cachePolicy="none" onError={() => {
    if (attempts.current++ === 0) void renew(); else setFailed(true);
  }} />;
}
