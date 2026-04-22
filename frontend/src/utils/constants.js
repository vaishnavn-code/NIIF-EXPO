/** Navigation pages — remove or add entries here to change the sidebar. */
export const NAV_PAGES = [
  { id: 'overview',     label: 'Overview',         section: 'Navigation' },
  { id: 'exposure',     label: 'Exposure Analysis',          section: 'Navigation' },
  // { id: 'loans', label: 'Loan Portfolio',      section: 'Data Views' },
  { id: 'rates',        label: 'Interest & Rates',  section: 'Data Views' },
  { id: 'borrowers',    label: 'Borrower Views',         section: 'Data Views' },
  { id: 'transactions', label: 'Transactions',      section: '' },

]

/** Recharts color palette */
export const COLORS = {
  blue:    '#1565c0',
  blueMid: '#1e88e5',
  blueLt:  '#90caf9',
  teal:    '#00acc1',
  tealLt:  '#4dd0e1',
  green:   '#2e7d32',
  greenLt: '#43a047',
  orange:  '#fb8c00',
  red:     '#e53935',
  purple:  '#7b1fa2',
}

export const CHART_PALETTE = [
  COLORS.blue, COLORS.teal, COLORS.orange, COLORS.purple,
  COLORS.green, COLORS.blueLt, COLORS.tealLt, '#ff7043',
]

/** TopN options reused by multiple charts */
export const TOP_N_OPTIONS = [5, 10, 15, 20]

/** Product type labels — must match backend */
export const PRODUCT_TYPES = [
  { value: '',                    label: 'All Products' },
  { value: 'TL - Disbursements',  label: 'TL – Disbursements' },
  { value: 'DEB - Disbursements', label: 'DEB – Disbursements' },
]
