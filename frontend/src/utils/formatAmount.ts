// src/utils/formatAmount.ts

/**
 * REFACTORED: Formats a financial value based on the provided type, locale, and currency.
 * @param value The numeric value to format.
 * @param type The calculation type ('fixed', 'percentage', 'formula').
 * @param locale The locale string for number/currency formatting (e.g., 'fr-MA', 'en-US').
 * @param currency The ISO currency code (e.g., 'MAD', 'USD').
 * @returns A formatted string representation of the value.
 */
const formatFinancialValue = (
  value: number | string | null | undefined,
  type: 'fixed' | 'percentage' | 'formula' | string,
  // ACTION: Default values are now for demonstration; in a real app,
  // these would come from a user/tenant context.
  locale: string = 'fr-MA',
  currency: string = 'MAD'
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
    // ACTION: Use the dynamic locale and currency.
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    }).format(numericValue);
  }

  // Fallback for 'formula' or other types. Use locale-sensitive number formatting.
  return new Intl.NumberFormat(locale).format(numericValue);
};

export default formatFinancialValue;