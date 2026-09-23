export type BankOption = { name: string; fullName: string; code: string; bin: string; color: string };

export const VIETNAM_BANKS: BankOption[] = [
  { name: 'MoMo', fullName: 'Ví điện tử MoMo', code: 'MOMO', bin: 'MOMO', color: '#A50064' },
  { name: 'MB Bank', fullName: 'Ngân hàng TMCP Quân Đội', code: 'MB', bin: '970422', color: '#1677D2' },
  { name: 'Vietcombank', fullName: 'Ngân hàng TMCP Ngoại thương Việt Nam', code: 'VCB', bin: '970436', color: '#0A8A62' },
  { name: 'Techcombank', fullName: 'Ngân hàng TMCP Kỹ thương Việt Nam', code: 'TCB', bin: '970407', color: '#D9272E' },
  { name: 'ACB', fullName: 'Ngân hàng TMCP Á Châu', code: 'ACB', bin: '970416', color: '#1769AA' },
  { name: 'VPBank', fullName: 'Ngân hàng TMCP Việt Nam Thịnh Vượng', code: 'VPB', bin: '970432', color: '#15864B' },
  { name: 'BIDV', fullName: 'Ngân hàng TMCP Đầu tư và Phát triển Việt Nam', code: 'BIDV', bin: '970418', color: '#006B85' },
  { name: 'VietinBank', fullName: 'Ngân hàng TMCP Công thương Việt Nam', code: 'ICB', bin: '970415', color: '#0B78A7' },
  { name: 'Agribank', fullName: 'Ngân hàng Nông nghiệp và Phát triển Nông thôn', code: 'VBA', bin: '970405', color: '#A3233A' },
  { name: 'Sacombank', fullName: 'Ngân hàng TMCP Sài Gòn Thương Tín', code: 'STB', bin: '970403', color: '#1661A4' },
  { name: 'TPBank', fullName: 'Ngân hàng TMCP Tiên Phong', code: 'TPB', bin: '970423', color: '#6F2C91' },
  { name: 'VIB', fullName: 'Ngân hàng TMCP Quốc tế Việt Nam', code: 'VIB', bin: '970441', color: '#F28B22' },
  { name: 'SHB', fullName: 'Ngân hàng TMCP Sài Gòn - Hà Nội', code: 'SHB', bin: '970443', color: '#F58220' },
  { name: 'HDBank', fullName: 'Ngân hàng TMCP Phát triển Thành phố Hồ Chí Minh', code: 'HDB', bin: '970437', color: '#D71920' },
  { name: 'OCB', fullName: 'Ngân hàng TMCP Phương Đông', code: 'OCB', bin: '970448', color: '#178548' },
];

export const normalizeBankSearch = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
export const normalizeAccountHolder = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/gi, 'D').toUpperCase().replace(/[^A-Z ]/g, '').replace(/\s+/g, ' ').replace(/^\s/, '');
