import { describe, it, expect } from 'vitest';
import { escapeStringValue, quoteStringValue } from '../../src/tools/sql-escape.js';

describe('escapeStringValue', () => {
  it('일반 문자열은 그대로 반환한다', () => {
    expect(escapeStringValue('mydb')).toBe('mydb');
  });

  it('작은따옴표를 이스케이프한다', () => {
    expect(escapeStringValue("my'db")).toBe("my''db");
  });

  it('백슬래시를 이스케이프한다', () => {
    expect(escapeStringValue('my\\db')).toBe('my\\\\db');
  });

  it('작은따옴표와 백슬래시가 동시에 있는 경우', () => {
    expect(escapeStringValue("my\\'db")).toBe("my\\\\''db");
  });

  it('빈 문자열을 처리한다', () => {
    expect(escapeStringValue('')).toBe('');
  });
});

describe('quoteStringValue', () => {
  it('값을 작은따옴표로 감싼다', () => {
    expect(quoteStringValue('mydb')).toBe("'mydb'");
  });

  it('이스케이프 후 감싼다', () => {
    expect(quoteStringValue("my'db")).toBe("'my''db'");
  });
});
