import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

type FeedRecord = Record<string, any>;

interface FavoriteFeedState {
  userId: string | null;
  isHydrated: boolean;
  liked: FeedRecord;
  saved: FeedRecord;
  hydrate: (userId: string) => Promise<void>;
  toggleLiked: (item: any) => Promise<void>;
  toggleSaved: (item: any) => Promise<void>;
}

const storageKey = (userId: string) => `favorite_feed:${userId}`;
const itemId = (item: any) => String(item?.id || item?.portfolioId || '');

async function persist(userId: string, liked: FeedRecord, saved: FeedRecord) {
  await AsyncStorage.setItem(storageKey(userId), JSON.stringify({ liked, saved }));
}

export const useFavoriteFeedStore = create<FavoriteFeedState>((set, get) => ({
  userId: null,
  isHydrated: false,
  liked: {},
  saved: {},

  hydrate: async (userId) => {
    if (get().userId === userId && get().isHydrated) return;

    try {
      const raw = await AsyncStorage.getItem(storageKey(userId));
      const data = raw ? JSON.parse(raw) : {};
      set({
        userId,
        liked: data.liked || {},
        saved: data.saved || {},
        isHydrated: true,
      });
    } catch {
      set({ userId, liked: {}, saved: {}, isHydrated: true });
    }
  },

  toggleLiked: async (item) => {
    const id = itemId(item);
    const { userId, liked, saved } = get();
    if (!userId || !id) return;

    const nextLiked = { ...liked };
    if (nextLiked[id]) delete nextLiked[id];
    else nextLiked[id] = { ...item, isLiked: true };

    set({ liked: nextLiked });
    await persist(userId, nextLiked, saved);
  },

  toggleSaved: async (item) => {
    const id = itemId(item);
    const { userId, liked, saved } = get();
    if (!userId || !id) return;

    const nextSaved = { ...saved };
    if (nextSaved[id]) delete nextSaved[id];
    else nextSaved[id] = { ...item, isSaved: true };

    set({ saved: nextSaved });
    await persist(userId, liked, nextSaved);
  },
}));
