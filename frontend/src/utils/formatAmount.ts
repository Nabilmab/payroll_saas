// src/utils/formatAmount.ts

const formatFinancialValue = (
  value: number | string | null | undefined,
  type: 'fixed' | 'percentage' | 'formula' | string,
  currency: string = 'MAD' // Default currency to MAD
): string => {
  if (value === null || value === undefined) {
    return 'N/A';
  }

  const numericValue = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(numericValue)) {
    return 'Invalid';
  }

  if (type === 'percentage') {
    return `${numericValue.toFixed(2)} %`;
  }

  if (type === 'fixed') {
    return new Intl.NumberFormat('en-MA', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    }).format(numericValue);
  }

  return String(numericValue); // Fallback for 'formula' or other types
};

export default formatFinancialValue;