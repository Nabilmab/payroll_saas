// frontend/src/utils/formatAmount.ts

/**
 * Formats a financial value either as a currency amount or as a percentage.
 *
 * @param value The raw value to format (amount or percentage).
 * @param calculationType Determines if the value is 'fixed' (amount) or 'percentage'.
 * @param currency The currency code to use for 'fixed' amounts (e.g., 'USD', 'EUR'). Defaults to 'USD'.
 * @returns A string representing the formatted value, or a default/fallback string if the input is invalid.
 */
const formatFinancialValue = (
  value: string | number | null | undefined,
  calculationType: 'fixed' | 'percentage',
  currency: string = 'USD'
): string => {
  if (calculationType === 'percentage') {
    if (value === null || value === undefined || String(value).trim() === '') {
      return '0.00%'; // Default for empty or nullish percentage
    }
    const numPercentage = parseFloat(String(value));
    if (typeof numPercentage === 'number' && !isNaN(numPercentage)) {
      return `${numPercentage.toFixed(2)}%`;
    }
    return '0.00%'; // Fallback for unparseable percentage
  }

  // Handle 'fixed' (amount) type
  if (value === null || value === undefined || String(value).trim() === '') {
    // Default for empty or nullish amount: format 0 as currency
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(0);
  }
  const numAmount = parseFloat(String(value));
  if (typeof numAmount === 'number' && !isNaN(numAmount)) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(numAmount);
  }

  // Fallback for unparseable amount: format 0 as currency
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(0);
};

export default formatFinancialValue;
