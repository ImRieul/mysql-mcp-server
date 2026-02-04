import { describe, it, expect, vi } from 'vitest';
import { resolveDatabase } from '../../src/tools/resolve-database.js';

describe('resolveDatabase', () => {
  it('database 파라미터가 주어지면 쿼리 없이 바로 반환한다', async () => {
    const query = vi.fn();

    const result = await resolveDatabase(query, 'mydb');

    expect(result).toBe('mydb');
    expect(query).not.toHaveBeenCalled();
  });

  it('database 미지정 시 SELECT DATABASE() 결과를 반환한다', async () => {
    const query = vi.fn().mockResolvedValue([[{ db: 'current_db' }]]);

    const result = await resolveDatabase(query);

    expect(query).toHaveBeenCalledWith('SELECT DATABASE() AS db');
    expect(result).toBe('current_db');
  });

  it('DATABASE() 결과가 null이면 null을 반환한다', async () => {
    const query = vi.fn().mockResolvedValue([[{ db: null }]]);

    const result = await resolveDatabase(query);

    expect(result).toBeNull();
  });
});
