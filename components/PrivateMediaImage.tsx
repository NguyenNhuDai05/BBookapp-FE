import { Image, type ImageProps } from 'expo-image';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { api } from '../services/api';

type Props = Pick<ImageProps, 'style' | 'contentFit' | 'onLoad' | 'onError' | 'onLoadStart'> & { uri?: string; mediaId?: string | null };
export function PrivateMediaImage(props: Props) {
  return <PrivateMediaImageContent key={`${props.mediaId ?? ''}:${props.uri ?? ''}`} {...props} />;
}
function PrivateMediaImageContent({ uri, mediaId, onError, ...props }: Props) {
  const [source, setSource] = useState(uri);
  const [failed, setFailed] = useState(false);
  const attempts = useRef(0);
  const generation = useRef(0);
  const renew = useCallback(async () => {
    if (!mediaId) { setFailed(false); return; }
    const current = generation.current;
    try {
      const result = await api.get<{ url: string }>(`/verification-media/${mediaId}/access`);
      if (current === generation.current) { setSource(result.data.url); setFailed(false); }
    } catch { if (current === generation.current) { setFailed(true); onError?.({ error: 'Không thể tải ảnh' }); } }
  }, [mediaId, onError]);
  useEffect(() => {
    const timer = !uri && mediaId ? setTimeout(() => { attempts.current++; void renew(); }, 0) : undefined;
    const requestGeneration = generation;
    return () => { if (timer) clearTimeout(timer); requestGeneration.current++; };
  }, [uri, mediaId, renew]);
  if (failed) return <View style={props.style}><TouchableOpacity accessibilityLabel="Tải lại ảnh riêng tư" onPress={() => { attempts.current = 1; void renew(); }}><Text>Không thể tải ảnh. Thử lại</Text></TouchableOpacity></View>;
  return <Image {...props} source={source ? { uri: source } : undefined} cachePolicy="none" onError={event => {
    if (!mediaId || attempts.current++ > 0) { setFailed(true); onError?.(event); } else void renew();
  }} />;
}
