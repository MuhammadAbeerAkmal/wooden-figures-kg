import type { Period } from './api';

/** -2055 becomes "2055 BCE", 1923 becomes "1923 CE". */
export const formatYear = (year: number): string => (year < 0 ? `${-year} BCE` : `${year} CE`);

export const formatPeriod = (period: Period): string =>
  `${period.name} (c. ${-period.startYear} to ${-period.endYear} BCE)`;

export const formatCm = (value: number | null): string => (value === null ? 'not recorded' : `${value} cm`);
