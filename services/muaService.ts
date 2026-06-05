import { api } from "./api";

export interface PortfolioItem {
  id: string;
  colors: readonly [string, string, ...string[]];
  icon: string;
}

export interface ServiceItem {
  id: string;
  name: string;
  time: string;
  price: string;
}

export interface MUA {
  id: string;
  name: string;
  avatar: string;
  styles: string[];
  rating: number;
  priceRange: string;
  distance: number;
  yearsOfExp: number;
  completedBooks: number;
  responseRate: number;
  bio: string;
  portfolio?: PortfolioItem[];
}

export interface BookingData {
  muaId: string;
  date: string;
  timeSlot: string;
  serviceId: string;
}

interface BackendMuaProfile {
  muaId: string;
  bio?: string;
  experienceYears: number;
  ratingAverage: number;
  totalBookings: number;
  portfolioCoverUrl?: string;
  fullName?: string;
  avatarUrl?: string;
  styles?: string[];
}

interface BackendService {
  serviceId: string;
  serviceName?: string;
  description?: string;
  price: number;
  durationMinutes: number;
}

interface BackendPortfolio {
  portfolioId: string;
  imageUrl?: string;
  description?: string;
}

const formatPrice = (price: number) =>
  `${new Intl.NumberFormat("vi-VN").format(price)}d`;

const toServiceItem = (service: BackendService): ServiceItem => ({
  id: service.serviceId,
  name: service.serviceName || "Dich vu trang diem",
  time: `${service.durationMinutes} phut`,
  price: formatPrice(service.price),
});

const getPriceRange = (services: ServiceItem[]) => {
  if (services.length === 0) return "Chua co gia";
  return `Tu ${services[0].price}`;
};

const toMua = (profile: BackendMuaProfile, services: ServiceItem[] = []): MUA => ({
  id: profile.muaId,
  name: profile.fullName || "Makeup Artist",
  avatar: profile.avatarUrl || "MUA",
  styles: profile.styles && profile.styles.length > 0 ? profile.styles : ["Beauty"],
  rating: Number(profile.ratingAverage || 0),
  priceRange: getPriceRange(services),
  distance: 0,
  yearsOfExp: profile.experienceYears || 0,
  completedBooks: profile.totalBookings || 0,
  responseRate: 100,
  bio: profile.bio || "",
});

const fallbackPortfolio = (): PortfolioItem[] => [
  { id: "p1", colors: ["#FCE7F3", "#FBCFE8"] as const, icon: "*" },
  { id: "p2", colors: ["#E0F2FE", "#BAE6FD"] as const, icon: "*" },
  { id: "p3", colors: ["#FEF3C7", "#FDE68A"] as const, icon: "*" },
  { id: "p4", colors: ["#F3E8FF", "#E9D5FF"] as const, icon: "*" },
  { id: "p5", colors: ["#ECFDF5", "#A7F3D0"] as const, icon: "*" },
  { id: "p6", colors: ["#FFF1F2", "#FFE4E6"] as const, icon: "*" },
];

export const muaService = {
  getAllMUAs: async (): Promise<MUA[]> => {
    const response = await api.get("/Mua");
    const profiles: BackendMuaProfile[] = response.data;

    return Promise.all(
      profiles.map(async (profile) => {
        const services = await muaService.getServices(profile.muaId);
        return toMua(profile, services);
      }),
    );
  },

  getMUAById: async (id: string): Promise<MUA> => {
    const [profileResponse, services] = await Promise.all([
      api.get(`/Mua/${id}`),
      muaService.getServices(id),
    ]);

    return toMua(profileResponse.data, services);
  },

  getPortfolio: async (muaId: string): Promise<PortfolioItem[]> => {
    const response = await api.get(`/Mua/${muaId}/portfolio`);
    const portfolio: BackendPortfolio[] = response.data;

    if (!portfolio || portfolio.length === 0) return fallbackPortfolio();

    return portfolio.map((item, index) => ({
      id: item.portfolioId,
      colors: index % 2 === 0
        ? (["#FCE7F3", "#FBCFE8"] as const)
        : (["#E0F2FE", "#BAE6FD"] as const),
      icon: item.description || "*",
    }));
  },

  getServices: async (muaId: string): Promise<ServiceItem[]> => {
    const response = await api.get(`/Service/mua/${muaId}`);
    const services: BackendService[] = response.data;
    return services.map(toServiceItem);
  },

  createBooking: async (bookingData: BookingData) => {
    const bookingDate = new Date(`${bookingData.date}T${bookingData.timeSlot}:00`);

    const response = await api.post("/Booking", {
      muaId: bookingData.muaId,
      serviceId: bookingData.serviceId,
      bookingDate: bookingDate.toISOString(),
      address: "Dia chi se duoc cap nhat sau",
      note: `Khung gio mong muon: ${bookingData.timeSlot}`,
    });

    return response.data.booking || response.data;
  },
};
