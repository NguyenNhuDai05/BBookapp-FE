// Định nghĩa cấu trúc dữ liệu User đồng bộ từ Server MockAPI
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  joinedDate: string;
  statsCompleted: number;
  statsFavorites: number;
  membershipTier: string;
}

const BASE_URL = "https://6a1879181878294b597d355f.mockapi.io/api/v1";

export const userService = {
  /**
   * 1. LẤY THÔNG TIN HỒ SƠ USER THEO EMAIL (GET)
   * Sử dụng khi user đăng nhập thành công để đổ dữ liệu ra màn hình Profile
   */
  getUserProfile: async (email: string): Promise<UserProfile> => {
    try {
      // Mã hóa email để tránh lỗi ký tự đặc biệt trên URL đường truyền
      const response = await fetch(
        `${BASE_URL}/users?email=${encodeURIComponent(email)}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        throw new Error(`Lỗi kết nối Server (${response.status})`);
      }

      const users: UserProfile[] = await response.json();

      // MockAPI lọc theo query sẽ trả về một mảng. Cần check xem có phần tử nào không.
      if (users && users.length > 0) {
        return users[0]; // Trả về thông tin user tìm thấy đầu tiên
      } else {
        throw new Error("Tài khoản không tồn tại trên hệ thống dữ liệu.");
      }
    } catch (error: any) {
      console.error("Lỗi tại userService.getUserProfile:", error);
      throw error;
    }
  },

  /**
   * 2. CẬP NHẬT THÔNG TIN HỒ SƠ (PUT)
   * Phục vụ cho chức năng "Chỉnh sửa thông tin" sau này khi user thay đổi tên, avatar...
   */
  updateUserProfile: async (
    userId: string,
    updateData: Partial<UserProfile>,
  ): Promise<UserProfile> => {
    try {
      const response = await fetch(`${BASE_URL}/users/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        throw new Error("Không thể cập nhật thông tin lên server.");
      }

      return await response.json();
    } catch (error: any) {
      console.error("Lỗi tại userService.updateUserProfile:", error);
      throw error;
    }
  },
};
