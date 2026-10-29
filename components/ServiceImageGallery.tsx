import React, { useRef, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { ImageIcon } from 'lucide-react-native';
import type { ServiceDto } from '../types/ServiceDto';

type Props = Pick<ServiceDto, 'imageUrl' | 'imageUrls'>;

export function ServiceImageGallery({ imageUrls, imageUrl }: Props) {
  const urls = [...new Set((imageUrls || []).filter(uri => typeof uri === 'string' && uri.trim()))];
  if (!urls.length && imageUrl?.trim()) urls.push(imageUrl);
  // A different service/gallery starts at the first photo, including scroll position.
  return <Gallery key={JSON.stringify(urls)} urls={urls} />;
}

function Gallery({ urls }: { urls: string[] }) {
  const screen = useWindowDimensions();
  const [width, setWidth] = useState(screen.width);
  const [index, setIndex] = useState(0);
  const pager = useRef<ScrollView>(null);
  const height = Math.min(screen.height * .48, width * 1.25);
  return <View testID="service-image-gallery" onLayout={event => {
    const nextWidth = event.nativeEvent.layout.width;
    if (nextWidth > 0 && nextWidth !== width) {
      setWidth(nextWidth);
    }
  }}>
    {urls.length ? <View>
      <ScrollView ref={pager} horizontal pagingEnabled nestedScrollEnabled bounces={false}
        showsHorizontalScrollIndicator={false} style={{ height }}
        testID="service-image-pager"
        onContentSizeChange={() => pager.current?.scrollTo({ x: index * width, animated: false })}
        onMomentumScrollEnd={event => setIndex(Math.max(0, Math.min(urls.length - 1, Math.round(event.nativeEvent.contentOffset.x / width))))}>
        {urls.map((uri, i) => <Image key={uri} source={{ uri }} resizeMode="contain"
          accessibilityLabel={`Ảnh dịch vụ ${i + 1}/${urls.length}`}
          style={{ width, height, backgroundColor: '#F7F4F5' }} />)}
      </ScrollView>
      {urls.length > 1 && <View pointerEvents="none" style={styles.counter}>
        <Text accessibilityLiveRegion="polite" style={styles.counterText}>{index + 1}/{urls.length}</Text>
      </View>}
    </View> : <View style={[styles.empty, { height: 200 }]} accessibilityLabel="Dịch vụ chưa có ảnh">
      <ImageIcon size={40} color="#CCC" />
    </View>}
    {urls.length > 1 && <View style={styles.navigation}>
      <Text style={styles.hint}>Vuốt để xem tất cả ảnh</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.thumbnails}>
        {urls.map((uri, i) => <TouchableOpacity key={uri} accessibilityRole="button"
          accessibilityLabel={`Xem ảnh dịch vụ ${i + 1}`} accessibilityState={{ selected: i === index }}
          onPress={() => { setIndex(i); pager.current?.scrollTo({ x: i * width, animated: true }); }}
          style={[styles.thumbnail, i === index && styles.selected]}>
          <Image source={{ uri }} resizeMode="contain" style={styles.thumbnailImage} />
        </TouchableOpacity>)}
      </ScrollView>
    </View>}
  </View>;
}

const styles = StyleSheet.create({
  empty: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#F7F4F5' },
  counter: { position: 'absolute', bottom: 12, right: 16, backgroundColor: 'rgba(34,21,43,.7)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14 },
  counterText: { color: '#FFF', fontSize: 12, fontWeight: '600' },
  navigation: { paddingVertical: 10 },
  hint: { color: '#75646d', fontSize: 12, textAlign: 'center', marginBottom: 8 },
  thumbnails: { paddingHorizontal: 16, gap: 8 },
  thumbnail: { width: 54, height: 64, borderRadius: 6, borderWidth: 2, borderColor: 'transparent', overflow: 'hidden', backgroundColor: '#F7F4F5' },
  selected: { borderColor: '#C42A64' },
  thumbnailImage: { width: '100%', height: '100%' },
});
