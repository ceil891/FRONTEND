import { describe, test, expect, vi, beforeEach } from 'vitest';
import apiClient from '../client';
import { sizeAPI, colorAPI, unitAPI } from '../client';

// Mock apiClient
vi.mock('../client', async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
    default: {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
    },
  };
});

describe('Inventory APIs (Size, Color, Unit)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ===== TEST API COLOR =====
  test('colorAPI.getAll gọi đúng endpoint', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: { success: true, data: [] } });
    await colorAPI.getAll();
    expect(apiClient.get).toHaveBeenCalledWith('/api/inventory/colors');
  });

  test('colorAPI.create gọi đúng endpoint với payload', async () => {
    const payload = { name: 'Đỏ', hexCode: '#FF0000', status: 'ACTIVE' };
    vi.mocked(apiClient.post).mockResolvedValueOnce({ data: { success: true } });
    await colorAPI.create(payload);
    expect(apiClient.post).toHaveBeenCalledWith('/api/inventory/colors', payload);
  });

  // ===== TEST API SIZE =====
  test('sizeAPI.update gọi đúng endpoint với ID', async () => {
    const id = 5;
    const payload = { name: 'XXL', description: 'Size ngoại cỡ', status: 'ACTIVE' };
    vi.mocked(apiClient.put).mockResolvedValueOnce({ data: { success: true } });
    await sizeAPI.update(id, payload);
    expect(apiClient.put).toHaveBeenCalledWith(`/api/inventory/sizes/${id}`, payload);
  });

  // ===== TEST API UNIT =====
  test('unitAPI.delete gọi đúng endpoint với ID', async () => {
    const id = 10;
    vi.mocked(apiClient.delete).mockResolvedValueOnce({ data: { success: true } });
    await unitAPI.delete(id);
    expect(apiClient.delete).toHaveBeenCalledWith(`/api/inventory/units/${id}`);
  });
});