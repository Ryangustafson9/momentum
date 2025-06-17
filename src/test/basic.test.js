// 🧪 BASIC TESTS - Verify testing setup works
import { describe, it, expect, vi } from 'vitest';

describe('Basic Test Setup', () => {
  it('should run basic tests', () => {
    expect(1 + 1).toBe(2);
  });

  it('should handle async operations', async () => {
    const result = await Promise.resolve('test');
    expect(result).toBe('test');
  });

  it('should work with objects', () => {
    const obj = { name: 'test', value: 42 };
    expect(obj).toEqual({ name: 'test', value: 42 });
    expect(obj).toHaveProperty('name');
    expect(obj.name).toBe('test');
  });

  it('should work with arrays', () => {
    const arr = [1, 2, 3];
    expect(arr).toHaveLength(3);
    expect(arr).toContain(2);
    expect(arr[0]).toBe(1);
  });
});

describe('Mock Functions', () => {
  it('should work with vi.fn()', () => {
    const mockFn = vi.fn();
    mockFn('test');
    
    expect(mockFn).toHaveBeenCalled();
    expect(mockFn).toHaveBeenCalledWith('test');
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should work with mock return values', () => {
    const mockFn = vi.fn().mockReturnValue('mocked');
    const result = mockFn();
    
    expect(result).toBe('mocked');
    expect(mockFn).toHaveBeenCalled();
  });
});
