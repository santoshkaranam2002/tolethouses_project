export interface Budget { id: string; label: string; min?: string; max?: string; }

export const BUDGETS: Budget[] = [
  { id: '', label: 'Any budget' },
  { id: 'u10', label: 'Under ₹10,000', max: '10000' },
  { id: '10-20', label: '₹10,000 – ₹20,000', min: '10000', max: '20000' },
  { id: '20-40', label: '₹20,000 – ₹40,000', min: '20000', max: '40000' },
  { id: '40-75', label: '₹40,000 – ₹75,000', min: '40000', max: '75000' },
  { id: '75+', label: '₹75,000 & above', min: '75000' },
];

export function budgetOf(min?: string, max?: string): string {
  return BUDGETS.find(b => (b.min ?? '') === (min ?? '') && (b.max ?? '') === (max ?? ''))?.id ?? '';
}

export const SORTS = [
  { id: '', label: 'Featured & newest' },
  { id: 'priceLow', label: 'Rent: low to high' },
  { id: 'priceHigh', label: 'Rent: high to low' },
  { id: 'areaHigh', label: 'Largest first' },
];
