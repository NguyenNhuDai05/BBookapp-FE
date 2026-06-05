// 1. ĐỊNH NGHĨA CÁC INTERFACES KIỂU DỮ LIỆU
export interface PortfolioItem {
  id: string;
  colors: readonly [string, string, ...string[]]; // Để tương thích với UI LinearGradient cũ
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

// 2. URL GỐC CỦA MOCKAPI
const BASE_URL = "https://6a1879181878294b597d355f.mockapi.io/api/v1";

// 3. VIẾT CÁC HÀM CALL API THỰC TẾ BẰNG FETCH
export const muaService = {
  // LẤY TOÀN BỘ DANH SÁCH MUA (Phương thức GET)
  getAllMUAs: async (): Promise<MUA[]> => {
    const response = await fetch(`${BASE_URL}/muas`);

    if (!response.ok) {
      throw new Error("Không thể lấy danh sách MUA từ hệ thống server.");
    }

    // Trả về mảng danh sách dạng JSON cho các màn hình (UI) sử dụng
    return await response.json();
  },

  // LẤY CHI TIẾT 1 MUA THEO ID
  getMUAById: async (id: string): Promise<MUA> => {
    const response = await fetch(`${BASE_URL}/muas/${id}`);

    if (!response.ok) {
      throw new Error(`Không tìm thấy thông tin của MUA có mã số ${id}`);
    }

    return await response.json();
  },

  // LẤY DANH SÁCH PORTFOLIO (Để phục vụ hàm Promise.all ở màn hình Detail)
  getPortfolio: async (muaId: string): Promise<PortfolioItem[]> => {
    try {
      // Thử gọi API nếu bạn có cấu trúc endpoint dạng /muas/:id/portfolio
      const response = await fetch(`${BASE_URL}/muas/${muaId}/portfolio`);
      if (response.ok) {
        return await response.json();
      }
    } catch (e) {
      console.log(
        "Chưa cấu hình endpoint portfolio riêng, sử dụng dữ liệu mock",
      );
    }

    // Trả về dữ liệu Mock chuẩn màu sắc & icon giống hệt UI cũ của bạn để không bị lỗi render
    return [
      { id: "p1", colors: ["#FCE7F3", "#FBCFE8"] as const, icon: "✨" },
      { id: "p2", colors: ["#E0F2FE", "#BAE6FD"] as const, icon: "💄" },
      { id: "p3", colors: ["#FEF3C7", "#FDE68A"] as const, icon: "🎀" },
      { id: "p4", colors: ["#F3E8FF", "#E9D5FF"] as const, icon: "🌸" },
      { id: "p5", colors: ["#ECFDF5", "#A7F3D0"] as const, icon: "👑" },
      { id: "p6", colors: ["#FFF1F2", "#FFE4E6"] as const, icon: "💅" },
    ];
  },

  // LẤY DANH SÁCH DỊCH VỤ CỦA MUA (Để phục vụ hàm Promise.all ở màn hình Detail)
  getServices: async (muaId: string): Promise<ServiceItem[]> => {
    try {
      // Thử gọi API nếu bạn có cấu trúc endpoint dạng /muas/:id/services
      const response = await fetch(`${BASE_URL}/muas/${muaId}/services`);
      if (response.ok) {
        return await response.json();
      }
    } catch (e) {
      console.log(
        "Chưa cấu hình endpoint services riêng, sử dụng dữ liệu mock",
      );
    }

    // Trả về dữ liệu Mock dịch vụ chuẩn format hiển thị cho UI cũ của bạn
    return [
      {
        id: "s1",
        name: "Trang điểm cô dâu ngày cưới",
        time: "90 phút",
        price: "1.500.000đ",
      },
      {
        id: "s2",
        name: "Trang điểm tiệc nhẹ / Kỷ yếu",
        time: "60 phút",
        price: "450.000đ",
      },
      {
        id: "s3",
        name: "Trang điểm Concept chụp ảnh",
        time: "75 phút",
        price: "700.000đ",
      },
    ];
  },

  // GỬI LỊCH ĐẶT HẸN LÊN SERVER (Phương thức POST)
  createBooking: async (bookingData: BookingData) => {
    const response = await fetch(`${BASE_URL}/bookings`, {
      method: "POST", // Phương thức gửi dữ liệu lên
      headers: {
        "Content-Type": "application/json", // Báo cho server biết ta gửi định dạng JSON
      },
      body: JSON.stringify(bookingData), // Chuyển object data thành chuỗi text JSON
    });

    if (!response.ok) {
      throw new Error("Lỗi kết nối mạng, không thể gửi yêu cầu đặt lịch hẹn.");
    }

    // Trả về phản hồi thành công từ MockAPI kèm theo ID lịch hẹn tự sinh
    return await response.json();
  },
};
