import { useRouter } from "expo-router";
import React from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";
import { MUA } from "../mock/mockData";

interface Props {
  mua: MUA;
}

export default function MUACard({ mua }: Props) {
  const router = useRouter();

  // Hàm điều hướng sang trang cá nhân chi tiết của MUA đè lên thanh tab
  const handlePress = () => {
    router.push({
      pathname: "/mua-detail" as any,
      params: { id: mua.id },
    });
  };

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={handlePress}
      className="bg-white w-64 rounded-3xl mr-4 overflow-hidden border border-pink-100 shadow-sm shadow-pink-200/40"
    >
      {/* Ảnh Portfolio làm Banner thế mạnh */}
      <View className="relative w-full h-40 bg-slate-100">
        <Image
          source={{ uri: mua.portfolio[0] }}
          className="w-full h-full object-cover"
        />
        {/* Badge khoảng cách thực tế (Dựa trên định vị) */}
        <View className="absolute top-3 left-3 bg-black/60 px-2.5 py-1 rounded-full flex-row items-center">
          <Text className="color-white text-[10px] font-bold">
            📍 {mua.distance} km
          </Text>
        </View>
        {/* Badge số lượng khách hàng đã đặt lịch thành công */}
        <View className="absolute bottom-3 right-3 bg-bbook-accent px-2.5 py-1 rounded-lg">
          <Text className="color-white text-[10px] font-black uppercase tracking-wider">
            {mua.bookedCount} Đã Book
          </Text>
        </View>
      </View>

      {/* Thông tin chi tiết của Make Up Artist */}
      <View className="p-4">
        <View className="flex-row items-center mb-2">
          <Image
            source={{ uri: mua.avatar }}
            className="w-8 h-8 rounded-full border border-pink-200 mr-2"
          />
          <View className="flex-1">
            <Text
              className="text-slate-800 font-black text-sm"
              numberOfLines={1}
            >
              {mua.name}
            </Text>
            <View className="flex-row items-center mt-0.5">
              <Text className="color-amber-500 text-xs mr-1">⭐</Text>
              <Text className="text-slate-700 font-bold text-xs">
                {mua.rating}
              </Text>
              <Text className="text-slate-400 text-[10px] font-medium ml-1">
                ({mua.reviewCount} đánh giá)
              </Text>
            </View>
          </View>
        </View>

        {/* Khung hiển thị Tag layout phong cách thế mạnh */}
        <View className="flex-row flex-wrap h-6 overflow-hidden mb-3">
          {mua.styles.map((style, index) => (
            <View
              key={index}
              className="bg-peach-light/50 px-2 py-0.5 rounded-md mr-1.5 mb-1.5"
            >
              <Text className="color-bbook-pinkDark text-[9px] font-bold">
                #{style.split(" ")[1] || style}{" "}
                {/* Cắt chữ lấy keyword cho gọn tag */}
              </Text>
            </View>
          ))}
        </View>

        <View className="border-t border-slate-50 pt-3 flex-row justify-between items-center">
          <View>
            <Text className="text-slate-400 text-[9px] font-bold uppercase tracking-wider">
              Giá khởi điểm
            </Text>
            <Text className="color-bbook-pinkDark font-extrabold text-sm">
              {mua.priceRange.split(" ")[0]}
            </Text>
          </View>
          <View className="bg-bbook-pinkMedium/10 px-3 py-2 rounded-xl">
            <Text className="color-bbook-pinkDark font-bold text-[11px]">
              Xem Chi Tiết
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}
