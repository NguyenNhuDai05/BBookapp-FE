/**
 * Vietnamese UI strings — centralized to avoid hardcoded text in components.
 */

export const Strings = {
  // Home screen
  homeGreeting: (name: string) => `Chào ${name} 👋`,
  homeSubtitle: 'Chúc bạn một ngày thật xinh đẹp ✨',
  homeUpcomingTitle: 'Lịch hẹn sắp tới',
  homeViewAll: 'Tất cả',
  homeViewDetail: 'Xem chi tiết',
  homePopularServices: 'Dịch vụ phổ biến',
  homeFavoriteExperts: 'Chuyên gia yêu thích',
  homeFeaturedWorks: 'Tác phẩm nổi bật tuần này',
  homePromotions: 'Ưu đãi dành cho bạn',
  homeUseNow: 'Sử dụng ngay',
  homeStatusConfirmed: 'Đã xác nhận',
  homeStatusPending: 'Chờ xác nhận',

  // Explore screen
  exploreTitle: 'B-Book',
  exploreGreeting: 'Xin chào 👋',
  exploreSubtitle: 'Hôm nay bạn muốn makeup kiểu gì?',
  exploreSearchPlaceholder: 'Tìm chuyên gia makeup...',
  exploreTrending: '🔥 Xu hướng hôm nay',
  exploreFeaturedExperts: '⭐ Chuyên gia nổi bật',
  exploreNearby: '📍 Gần bạn',
  exploreSuggestions: '✨ Gợi ý cho bạn',
  exploreViewAll: 'Xem tất cả',
  exploreViewProfile: 'Xem hồ sơ',

  // Categories
  catBridal: 'Cô dâu',
  catParty: 'Tiệc',
  catYearbook: 'Kỷ yếu',
  catPhotoshoot: 'Photoshoot',
  catKorean: 'Hàn Quốc',
  catLuxury: 'Luxury',

  // MUA Detail
  muaBookNow: 'Đặt lịch ngay',
  muaMessage: 'Nhắn tin',
  muaTabPortfolio: 'Portfolio',
  muaTabServices: 'Dịch vụ',
  muaTabReviews: 'Đánh giá',
  muaTabInfo: 'Thông tin',
  muaRating: 'Đánh giá',
  muaCompleted: 'Hoàn thành',
  muaPortfolio: 'Portfolio',
  muaFeaturedWorks: 'Tác phẩm nổi bật',
  muaTransformations: 'Biến đổi khách hàng',
  muaChoose: 'Chọn',
  muaTotal: 'Tổng cộng',
  muaContinue: 'Tiếp tục',
  muaHelpful: 'Hữu ích',
  muaReport: 'Báo cáo',
  muaBio: 'Giới thiệu',
  muaSeeMore: 'Xem thêm',
  muaSpecialties: 'Chuyên môn',
  muaServiceArea: 'Khu vực phục vụ',
  muaSchedule: 'Lịch làm việc',
  muaPolicies: 'Chính sách',
  muaSocial: 'Kết nối',
  muaVerified: 'Verified Profile',
  muaTopArtist: 'Top Artist',
  muaNoServices: 'Chưa có dịch vụ nào.',

  // Portfolio Detail
  portfolioDetailTitle: 'Chi tiết tác phẩm',
  portfolioDuration: 'Thời lượng',
  portfolioMainProducts: 'Sản phẩm chính',
  portfolioAllProducts: 'Trọn bộ mỹ phẩm sử dụng',
  portfolioTransformation: 'Sự thay đổi',
  portfolioCloseUp: 'Chi tiết cận cảnh',
  portfolioBookThis: 'Đặt lịch dịch vụ này',
  portfolioBefore: 'Trước',
  portfolioAfter: 'Sau',

  // Chat placeholder
  chatTitle: 'Tin nhắn',
  chatEmpty: 'Chưa có tin nhắn nào',
  chatEmptyDesc: 'Khi bạn nhắn tin với chuyên gia makeup, cuộc trò chuyện sẽ xuất hiện tại đây.',

  // Common
  viewAll: 'Xem tất cả',
  seeMore: 'Xem thêm',
  retry: 'Thử lại',
  loading: 'Đang tải...',
  errorDefault: 'Không thể tải dữ liệu',
  errorRetry: 'Tải lại',
  minutes: 'phút',
  bookings: 'Bookings',
} as const;
