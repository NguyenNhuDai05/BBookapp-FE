import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Star } from "lucide-react-native";
import React from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";
import { MUA } from "../services/muaService";

interface Props {
  mua: MUA;
}

export default function MUACard({ mua }: Props) {
  const router = useRouter();

  const handlePress = () => {
    router.push({
      pathname: "/mua-detail",
      params: { id: mua.id },
    });
  };

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={handlePress}
      className="bg-white w-64 rounded-3xl mr-4 overflow-hidden border border-pink-100 shadow-sm shadow-pink-200/40"
    >
      <View className="relative w-full h-40 bg-slate-100">
        {mua.coverUrl ? (
          <Image
            source={{ uri: mua.coverUrl }}
            className="w-full h-full"
            resizeMode="cover"
          />
        ) : (
          <LinearGradient
            colors={["#F5B1C1", "#D98197"] as const}
            style={{
              width: "100%",
              height: "100%",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text className="text-white text-4xl font-bold">{mua.avatar}</Text>
          </LinearGradient>
        )}

        <View className="absolute top-3 left-3 bg-black/60 px-2.5 py-1 rounded-full">
          <Text className="text-white text-[10px] font-bold">
            {mua.yearsOfExp} năm KN
          </Text>
        </View>
        <View className="absolute bottom-3 right-3 bg-bbook-accent px-2.5 py-1 rounded-lg">
          <Text className="text-white text-[10px] font-black uppercase tracking-wider">
            {mua.completedBooks} đã book
          </Text>
        </View>
      </View>

      <View className="p-4">
        <View className="flex-row items-center mb-2">
          {mua.avatarUrl ? (
            <Image
              source={{ uri: mua.avatarUrl }}
              className="w-8 h-8 rounded-full border border-pink-200 mr-2"
            />
          ) : (
            <View className="w-8 h-8 rounded-full bg-pink-100 mr-2 items-center justify-center">
              <Text className="text-bbook-pinkDark text-[10px] font-black">
                {mua.avatar}
              </Text>
            </View>
          )}
          <View className="flex-1">
            <Text className="text-slate-800 font-black text-sm" numberOfLines={1}>
              {mua.name}
            </Text>
            <View className="flex-row items-center mt-0.5">
              <Star size={12} color="#F59E0B" fill="#F59E0B" />
              <Text className="text-slate-700 font-bold text-xs ml-1">
                {mua.rating.toFixed(1)}
              </Text>
            </View>
          </View>
        </View>

        <View className="flex-row flex-wrap h-6 overflow-hidden mb-3">
          {mua.styles.map((style) => (
            <View
              key={style}
              className="bg-peach-light/50 px-2 py-0.5 rounded-md mr-1.5 mb-1.5"
            >
              <Text className="text-bbook-pinkDark text-[9px] font-bold">
                #{style}
              </Text>
            </View>
          ))}
        </View>

        <View className="border-t border-slate-50 pt-3 flex-row justify-between items-center">
          <View className="flex-1 pr-2">
            <Text className="text-slate-400 text-[9px] font-bold uppercase tracking-wider">
              Giá khởi điểm
            </Text>
            <Text className="text-bbook-pinkDark font-extrabold text-sm">
              {mua.priceRange}
            </Text>
          </View>
          <View className="bg-bbook-pinkMedium/10 px-3 py-2 rounded-xl">
            <Text className="text-bbook-pinkDark font-bold text-[11px]">
              Chi tiết
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}
