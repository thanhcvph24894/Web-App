/**
 * Hàm định dạng tiền tệ Việt Nam
 * @param amount - Số tiền cần định dạng
 * @returns Chuỗi đã định dạng dạng tiền tệ VND
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Hàm định dạng ngày tháng theo mẫu Việt Nam (DD/MM/YYYY)
 * @param date - Đối tượng Date hoặc chuỗi ngày tháng
 * @returns Chuỗi đã định dạng (DD/MM/YYYY)
 */
export const formatDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();

  return `${day}/${month}/${year}`;
};

/**
 * Hàm rút gọn văn bản nếu quá dài
 * @param text - Văn bản cần rút gọn
 * @param maxLength - Độ dài tối đa (mặc định là 100)
 * @returns Văn bản đã rút gọn
 */
export const truncateText = (text: string, maxLength: number = 100): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

/**
 * Hàm định dạng số điện thoại Việt Nam
 * @param phone - Số điện thoại cần định dạng
 * @returns Chuỗi số điện thoại đã định dạng
 */
export const formatPhoneNumber = (phone: string): string => {
  // Xóa kí tự không phải số
  const cleaned = phone.replace(/\D/g, '');

  // Kiểm tra độ dài và định dạng theo mẫu Việt Nam
  if (cleaned.length === 10) {
    return `${cleaned.substring(0, 4)} ${cleaned.substring(
      4,
      7,
    )} ${cleaned.substring(7, 10)}`;
  } else if (cleaned.length === 11) {
    return `${cleaned.substring(0, 4)} ${cleaned.substring(
      4,
      7,
    )} ${cleaned.substring(7, 11)}`;
  }

  return phone; // Trả về nguyên bản nếu không khớp định dạng
};
