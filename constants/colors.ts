export type Theme = {
  background: string;
  cardBackground: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  border: string;
  gradient: [string, string, ...string[]];
  gradientStart: { x: number; y: number };
  gradientEnd: { x: number; y: number };
  resultSuccess: string;
  resultSuccessText: string;
  resultError: string;
  resultErrorText: string;
};

export const lightTheme: Theme = {
  background: '#ffffff',
  cardBackground: 'rgba(255, 255, 255, 0.95)',
  text: '#1f2937',
  textSecondary: '#6b7280',
  textTertiary: '#9ca3af',
  border: '#e5e7eb',
  gradient: ['#667eea', '#764ba2', '#f093fb'],
  gradientStart: { x: 0, y: 0 },
  gradientEnd: { x: 1, y: 1 },
  resultSuccess: '#d1fae5',
  resultSuccessText: '#1f2937',
  resultError: '#fee2e2',
  resultErrorText: '#1f2937',
};

export const darkTheme: Theme = {
  background: '#0f0f23',
  cardBackground: 'rgba(20, 20, 40, 0.95)',
  text: '#f9fafb',
  textSecondary: '#d1d5db',
  textTertiary: '#9ca3af',
  border: '#374151',
  gradient: ['#0f0f23', '#1a1a3e', '#2d1b69', '#5b21b6', '#7c3aed'],
  gradientStart: { x: 0, y: 0 },
  gradientEnd: { x: 0.5, y: 1 },
  resultSuccess: 'rgba(34, 197, 94, 0.2)',
  resultSuccessText: '#4ade80',
  resultError: 'rgba(239, 68, 68, 0.2)',
  resultErrorText: '#f87171',
};
