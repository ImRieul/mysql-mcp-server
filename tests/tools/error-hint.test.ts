import { describe, it, expect } from 'vitest';
import { formatError } from '../../src/tools/error-hint.js';

describe('formatError', () => {
  it("Table doesn't exist 에러에 list_tables 힌트를 추가한다", () => {
    const result = formatError(new Error("Table 'mydb.nonexistent' doesn't exist"));
    expect(result).toContain('list_tables');
  });

  it('Unknown column 에러에 describe_table 힌트를 추가한다', () => {
    const result = formatError(new Error("Unknown column 'foo' in 'field list'"));
    expect(result).toContain('describe_table');
  });

  it('Unknown database 에러에 list_databases 힌트를 추가한다', () => {
    const result = formatError(new Error("Unknown database 'nonexistent'"));
    expect(result).toContain('list_databases');
  });

  it('Access denied 에러에 permissions 힌트를 추가한다', () => {
    const result = formatError(new Error('Access denied for user'));
    expect(result).toContain('permissions');
  });

  it('ECONNREFUSED 에러에 호스트 설정 힌트를 추가한다', () => {
    const result = formatError(new Error('connect ECONNREFUSED 127.0.0.1:3306'));
    expect(result).toContain('MYSQL_HOST');
  });

  it('매칭되는 힌트가 없으면 에러 메시지만 반환한다', () => {
    const result = formatError(new Error('Some random error'));
    expect(result).toBe('Error: Some random error');
    expect(result).not.toContain('Hint');
  });

  it('문자열 에러도 처리한다', () => {
    const result = formatError('string error');
    expect(result).toBe('Error: string error');
  });

  it('Query timeout 에러에 타임아웃 설정 힌트를 추가한다', () => {
    const result = formatError(new Error('Query timeout after 30000ms'));
    expect(result).toContain('MYSQL_QUERY_TIMEOUT');
  });
});
