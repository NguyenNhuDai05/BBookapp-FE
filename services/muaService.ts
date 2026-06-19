import { api } from "./api";
import { bookingService } from "./bookingService";

export interface PortfolioItem {
  id: string;
  imageUrl?: string;
  description?: string;
  colors: readonly [string, string, ...string[]];
  icon: string;
}

export interface ServiceItem {
  id: string;
  name: string;
  description?: string;
  durationMinutes: number;
  time: string;
  price: string;
  rawPrice: number;
}

export interface MUA {
  id: string;
  name: string;
  avatar: string;
  avatarUrl?: string;
  coverUrl?: string;
  styles: string[];
  rating: number;
  priceRange: string;
  distance: number;
  yearsOfExp: number;
  completedBooks: number;
  responseRate: number;
  bio: string;
  services?: ServiceItem[];
  portfolio?: PortfolioItem[];
}

export interface BookingData {
  muaId: string;
  date: string;
  timeSlot: string;
  serviceId: string;
  address: string;
  note?: string;
}

export interface MakeupStyle {
  styleId: number;
  name?: string;
  description?: string;
}

export interface MuaProfileUpdate {
  bio: string;
  experienceYears: number;
  portfolioCoverUrl?: string;
}

export interface ServiceCreateInput {
  serviceName: string;
  description?: string;
  price: number;
  durationMinutes: number;
}

export interface PortfolioCreateInput {
  imageUrl: string;
  description?: string;
}

interface BackendMuaProfile {
  muaId: string;
  bio?: string;
  experienceYears?: number;
  ratingAverage?: number;
  totalBookings?: number;
  portfolioCoverUrl?: string;
  fullName?: string;
  avatarUrl?: string;
  styles?: string[];
  minPrice?: number | null;
  services?: BackendService[];
  portfolio?: BackendPortfolio[];
}

interface BackendService {
  serviceId: string;
  serviceName?: string;
  description?: string;
  price?: number;
  durationMinutes?: number;
}

interface BackendPortfolio {
  portfolioId: string;
  imageUrl?: string;
  description?: string;
}

const DEFAULT_PORTFOLIO_COLORS = [
  ["#FCE7F3", "#FBCFE8"],
  ["#E0F2FE", "#BAE6FD"],
  ["#FEF3C7", "#FDE68A"],
  ["#F3E8FF", "#E9D5FF"],
  ["#ECFDF5", "#A7F3D0"],
  ["#FFF1F2", "#FFE4E6"],
] as const;

const formatPrice = (price: number) =>
  `${new Intl.NumberFormat("vi-VN").format(price)}đ`;

const getInitials = (name?: string) => {
  if (!name) return "Makeup Artist";

  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "Makeup Artist";

  return words
    .slice(-2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
};

const toServiceItem = (service: BackendService): ServiceItem => {
  const price = Number(service.price || 0);
  const durationMinutes = Number(service.durationMinutes || 0);

  return {
    id: service.serviceId,
    name: service.serviceName || "Dịch vụ trang điểm",
    description: service.description,
    durationMinutes,
    time: durationMinutes > 0 ? `${durationMinutes} phút` : "Linh hoạt",
    price: price > 0 ? formatPrice(price) : "Liên hệ",
    rawPrice: price,
  };
};

const getPriceRange = (profile: BackendMuaProfile, services: ServiceItem[]) => {
  const minPrice = Number(profile.minPrice || 0);
  if (minPrice > 0) return `Từ ${formatPrice(minPrice)}`;

  const servicePrices = services
    .map((service) => service.rawPrice)
    .filter((price) => price > 0);

  if (servicePrices.length === 0) return "Chưa có giá";
  return `Từ ${formatPrice(Math.min(...servicePrices))}`;
};

const fallbackPortfolio = (coverUrl?: string): PortfolioItem[] => {
  if (coverUrl) {
    return [
      {
        id: "cover",
        imageUrl: coverUrl,
        description: "Portfolio cover",
        colors: DEFAULT_PORTFOLIO_COLORS[0],
        icon: "*",
      },
    ];
  }

  return DEFAULT_PORTFOLIO_COLORS.map((colors, index) => ({
    id: `placeholder-${index + 1}`,
    colors,
    icon: "*",
  }));
};

const toPortfolioItems = (
  portfolio: BackendPortfolio[] | undefined,
  coverUrl?: string,
): PortfolioItem[] => {
  if (!portfolio || portfolio.length === 0) return fallbackPortfolio(coverUrl);

  return portfolio.map((item, index) => ({
    id: item.portfolioId,
    imageUrl: item.imageUrl,
    description: item.description,
    colors: DEFAULT_PORTFOLIO_COLORS[index % DEFAULT_PORTFOLIO_COLORS.length],
    icon: item.description || "*",
  }));
};

const toMua = (
  profile: BackendMuaProfile,
  services: ServiceItem[] = [],
  portfolio?: PortfolioItem[],
): MUA => {
  const name = profile.fullName || "Makeup Artist";

  return {
    id: profile.muaId,
    name,
    avatar: getInitials(name),
    avatarUrl: profile.avatarUrl,
    coverUrl: profile.portfolioCoverUrl,
    styles:
      profile.styles && profile.styles.length > 0 ? profile.styles : ["Beauty"],
    rating: Number(profile.ratingAverage || 0),
    priceRange: getPriceRange(profile, services),
    distance: 0,
    yearsOfExp: Number(profile.experienceYears || 0),
    completedBooks: Number(profile.totalBookings || 0),
    responseRate: 100,
    bio: profile.bio || "Makeup Artist chưa cập nhật giới thiệu.",
    services,
    portfolio,
  };
};

export const muaService = {
  getAllMUAs: async (): Promise<MUA[]> => {
    const response = await api.get("/Mua");
    const profiles: BackendMuaProfile[] = response.data;

    return profiles.map((profile) => {
      const services = (profile.services || []).map(toServiceItem);
      return toMua(profile, services);
    });
  },

  getMUAById: async (id: string): Promise<MUA> => {
    const profileResponse = await api.get(`/Mua/${id}`);
    const profile: BackendMuaProfile = profileResponse.data;
    const embeddedServices = (profile.services || []).map(toServiceItem);
    const embeddedPortfolio = toPortfolioItems(
      profile.portfolio,
      profile.portfolioCoverUrl,
    );

    return toMua(profile, embeddedServices, embeddedPortfolio);
  },

  getPortfolio: async (muaId: string): Promise<PortfolioItem[]> => {
    const response = await api.get(`/Mua/${muaId}/portfolio`);
    const portfolio: BackendPortfolio[] = response.data;
    return toPortfolioItems(portfolio);
  },

  getServices: async (muaId: string): Promise<ServiceItem[]> => {
    const response = await api.get(`/Service/mua/${muaId}`);
    const services: BackendService[] = response.data;
    return services.map(toServiceItem);
  },

  getStyles: async (): Promise<MakeupStyle[]> => {
    const response = await api.get("/Mua/styles");
    return response.data;
  },

  updateProfile: async (profile: MuaProfileUpdate) => {
    const response = await api.put("/Mua/profile", profile);
    return response.data;
  },

  updateStyles: async (styleIds: number[]) => {
    const response = await api.put("/Mua/styles", styleIds);
    return response.data;
  },

  addService: async (service: ServiceCreateInput) => {
    const response = await api.post("/Service", service);
    return response.data.service || response.data.Service || response.data;
  },

  addPortfolioImage: async (portfolio: PortfolioCreateInput) => {
    const response = await api.post("/Mua/portfolio", portfolio);
    return response.data;
  },

  createBooking: async (bookingData: BookingData) => {
    const bookingDate = new Date(`${bookingData.date}T${bookingData.timeSlot}:00`);

    return bookingService.createBooking({
      muaId: bookingData.muaId,
      serviceId: bookingData.serviceId,
      bookingDate: bookingDate.toISOString(),
      address: bookingData.address,
      note: bookingData.note,
    });
  },};
