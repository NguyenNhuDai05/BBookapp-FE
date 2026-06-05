// ===============================
// TYPES
// ===============================

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phoneNumber: string;
  avatar: string;
}

export interface Review {
  id: string;
  user: string;
  avatar?: string;
  rate: number;
  comment: string;
}

export interface MUA {
  id: string;
  name: string;
  avatar: string;

  rating: number;
  reviewCount: number;
  bookedCount: number;
  distance: number;

  styles: string[];
  specialty: string;

  priceRange: string;
  basePrice: number;

  location: string;
  responseTime: string;

  bio: string;

  portfolio: string[];

  reviews: Review[];
}

export interface Message {
  id: string;
  senderId: "user" | string;
  text: string;
  timestamp: string;
}

export interface Booking {
  id: string;

  muaId: string;
  muaName: string;
  muaAvatar: string;

  date: string;
  time: string;

  service: string;

  totalAmount: number;

  location: string;

  status: "Pending" | "Confirmed" | "Completed" | "Cancelled";
}

// ===============================
// MOCK USER
// ===============================

export const mockUser: UserProfile = {
  id: "USR-8888",
  name: "Nguyễn Hoàng Mỹ Tâm",
  email: "mytam.beauty@gmail.com",
  phoneNumber: "0909123456",
  avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300",
};

// ===============================
// MOCK MUAS
// ===============================

export const mockMUAs: MUA[] = [
  {
    id: "mua_01",

    name: "Linh Nguyễn",

    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500",

    rating: 4.9,
    reviewCount: 124,
    bookedCount: 450,
    distance: 1.2,

    styles: ["Natural", "Editorial"],

    specialty: "Tone Tây sang trọng",

    priceRange: "800k–2tr",

    basePrice: 800000,

    location: "Quận 1, TP.HCM",

    responseTime: "~15 phút",

    bio: "Chuyên makeup beauty và cô dâu cao cấp với hơn 5 năm kinh nghiệm. Phong cách sang trọng, hiện đại và bắt trend Hàn Quốc.",

    portfolio: [
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800",
      "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=800",
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800",
    ],

    reviews: [
      {
        id: "rv_01",
        user: "Hà My",
        avatar:
          "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200",
        rate: 5,
        comment: "Makeup siêu đẹp và lâu trôi. Chị Linh tư vấn rất có tâm.",
      },
      {
        id: "rv_02",
        user: "Kim Anh",
        avatar:
          "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200",
        rate: 4.8,
        comment: "Tone makeup sang cực, chụp hình lên rất ăn ảnh.",
      },
    ],
  },

  {
    id: "mua_02",

    name: "Minh Phương",

    avatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500",

    rating: 4.7,
    reviewCount: 98,
    bookedCount: 310,
    distance: 2.8,

    styles: ["Party", "Beauty", "Glam"],

    specialty: "Clean Girl Makeup",

    priceRange: "600k–1.5tr",

    basePrice: 600000,

    location: "Phú Nhuận, TP.HCM",

    responseTime: "~30 phút",

    bio: "Phong cách makeup nhẹ nhàng chuẩn Hàn Quốc, phù hợp chụp ảnh concept và sự kiện.",

    portfolio: [
      "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800",
      "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=800",
    ],

    reviews: [
      {
        id: "rv_03",
        user: "Khánh Linh",
        avatar:
          "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=200",
        rate: 4.7,
        comment: "Makeup tự nhiên đúng kiểu mình thích.",
      },
    ],
  },

  {
    id: "mua_03",

    name: "Thanh Hà",

    avatar:
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500",

    rating: 4.8,
    reviewCount: 76,
    bookedCount: 250,
    distance: 0.8,

    styles: ["Bridal", "Luxury"],

    specialty: "Makeup cô dâu",

    priceRange: "1tr–3tr",

    basePrice: 1000000,

    location: "Quận 3, TP.HCM",

    responseTime: "~10 phút",

    bio: "Chuyên makeup cô dâu cao cấp với layout sang trọng và lâu trôi cả ngày.",

    portfolio: [
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800",
    ],

    reviews: [
      {
        id: "rv_04",
        user: "Thu Uyên",
        rate: 5,
        comment: "Makeup cô dâu cực kỳ xinh và chuyên nghiệp.",
      },
    ],
  },

  {
    id: "mua_04",

    name: "Vân Anh",

    avatar:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=500",

    rating: 4.6,
    reviewCount: 54,
    bookedCount: 180,
    distance: 1.1,

    styles: ["Art", "Fantasy"],

    specialty: "Creative Makeup",

    priceRange: "900k–2tr",

    basePrice: 900000,

    location: "Bình Thạnh, TP.HCM",

    responseTime: "~20 phút",

    bio: "Phong cách makeup nghệ thuật độc đáo dành cho photoshoot và runway.",

    portfolio: [
      "https://images.unsplash.com/photo-1506869640319-fe1a24fd76dc?w=800",
    ],

    reviews: [
      {
        id: "rv_05",
        user: "Mai Anh",
        rate: 4.6,
        comment: "Concept makeup sáng tạo và rất khác biệt.",
      },
    ],
  },
];

// ===============================
// MOCK BOOKINGS
// ===============================

export const mockBookings: Booking[] = [
  {
    id: "BK_001",

    muaId: "mua_01",
    muaName: "Linh Nguyễn",
    muaAvatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300",

    date: "2026-06-02",
    time: "09:00",

    service: "Makeup dự tiệc",

    totalAmount: 1200000,

    location: "Quận 1, TP.HCM",

    status: "Confirmed",
  },

  {
    id: "BK_002",

    muaId: "mua_03",
    muaName: "Thanh Hà",
    muaAvatar:
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300",

    date: "2026-06-10",
    time: "05:30",

    service: "Makeup cô dâu",

    totalAmount: 2500000,

    location: "Quận 3, TP.HCM",

    status: "Pending",
  },
];

// ===============================
// MOCK CHAT MESSAGES
// ===============================

export const mockMessages: Message[] = [
  {
    id: "msg_01",
    senderId: "user",
    text: "Chị ơi còn slot tối thứ 7 không ạ?",
    timestamp: "09:20",
  },

  {
    id: "msg_02",
    senderId: "mua_01",
    text: "Hi em, tối thứ 7 chị còn nha 💕",
    timestamp: "09:22",
  },

  {
    id: "msg_03",
    senderId: "user",
    text: "Dạ chị gửi giúp em bảng giá với ạ.",
    timestamp: "09:23",
  },
];
