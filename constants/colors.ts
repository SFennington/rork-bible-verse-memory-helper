export type Theme = {
  background: string;
  cardBackground: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  border: string;
  gradient: string[];
  gradientStart: { x: number; y: number };
  gradientEnd: { x: number; y: number };
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
};

export const darkTheme: Theme = {
  background: '#111827',
  cardBackground: 'rgba(31, 41, 55, 0.95)',
  text: '#f9fafb',
  textSecondary: '#d1d5db',
  textTertiary: '#9ca3af',
  border: '#374151',
  gradient: ['#1e293b', '#334155', '#475569'],
  gradientStart: { x: 0, y: 0 },
  gradientEnd: { x: 1, y: 1 },
};
