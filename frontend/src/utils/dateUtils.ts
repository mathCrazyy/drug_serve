export const calculateDaysUntilExpiry = (expiryDate: string | null | undefined): number => {
  if (!expiryDate || expiryDate.trim() === '' || expiryDate === 'null') {
    return 999999; // 如果没有有效期，返回一个很大的数字表示正常
  }
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(expiryDate);
    if (isNaN(expiry.getTime())) {
      return 999999;
    }
    expiry.setHours(0, 0, 0, 0);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  } catch {
    return 999999;
  }
};

export type ExpiryStatus = 'normal' | 'expiring' | 'expired';

export const getExpiryStatus = (expiryDate: string | null | undefined): ExpiryStatus => {
  if (!expiryDate || expiryDate.trim() === '' || expiryDate === 'null') {
    return 'normal'; // 如果没有有效期，默认为正常
  }
  const daysUntilExpiry = calculateDaysUntilExpiry(expiryDate);
  if (daysUntilExpiry < 0) {
    return 'expired';
  } else if (daysUntilExpiry <= 30) {
    return 'expiring';
  }
  return 'normal';
};

export const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString || dateString.trim() === '' || dateString === 'null') {
    return '';
  }
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return '';
    }
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  } catch {
    return '';
  }
};

