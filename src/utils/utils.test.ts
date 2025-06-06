import { describe, it, expect } from 'vitest';
import { formatNumberWithCommas } from './utils';

describe('utils', () => {
  it('数値をカンマ区切りの文字列にフォーマットする', () => {
    expect(formatNumberWithCommas(1000)).toBe('1,000');
    expect(formatNumberWithCommas(1234567)).toBe('1,234,567');
    expect(formatNumberWithCommas(100)).toBe('100');
    expect(formatNumberWithCommas(0)).toBe('0');
    expect(formatNumberWithCommas(-1000)).toBe('-1,000');
  });
});
