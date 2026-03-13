import { describe, it, expect } from 'vitest';
import { validateSql, validateIdentifier } from '../../src/tools/validate-input.js';

describe('validateSql', () => {
  describe('유효한 SQL', () => {
    it('일반 SELECT 쿼리를 통과시킨다', () => {
      expect(validateSql('SELECT * FROM users')).toEqual({ valid: true });
    });

    it('탭이 포함된 SQL을 통과시킨다', () => {
      expect(validateSql('SELECT *\tFROM users')).toEqual({ valid: true });
    });

    it('개행이 포함된 SQL을 통과시킨다', () => {
      expect(validateSql('SELECT *\nFROM users')).toEqual({ valid: true });
    });

    it('캐리지 리턴이 포함된 SQL을 통과시킨다', () => {
      expect(validateSql('SELECT *\r\nFROM users')).toEqual({ valid: true });
    });
  });

  describe('제어문자 포함 SQL', () => {
    it('NULL 바이트를 거부한다', () => {
      const result = validateSql('SELECT * FROM users\x00');
      expect(result.valid).toBe(false);
      expect(result.message).toContain('control characters');
    });

    it('벨 문자를 거부한다', () => {
      const result = validateSql('SELECT \x07 FROM users');
      expect(result.valid).toBe(false);
    });

    it('백스페이스를 거부한다', () => {
      const result = validateSql('SELECT \x08 FROM users');
      expect(result.valid).toBe(false);
    });

    it('수직 탭을 거부한다', () => {
      const result = validateSql('SELECT \x0b FROM users');
      expect(result.valid).toBe(false);
    });

    it('폼 피드를 거부한다', () => {
      const result = validateSql('SELECT \x0c FROM users');
      expect(result.valid).toBe(false);
    });

    it('ESC 문자를 거부한다', () => {
      const result = validateSql('SELECT \x1b FROM users');
      expect(result.valid).toBe(false);
    });

    it('DEL 문자를 거부한다', () => {
      const result = validateSql('SELECT \x7f FROM users');
      expect(result.valid).toBe(false);
    });
  });
});

describe('validateIdentifier', () => {
  describe('유효한 식별자', () => {
    it('일반 테이블명을 통과시킨다', () => {
      expect(validateIdentifier('users', 'Table')).toEqual({ valid: true });
    });

    it('언더스코어가 포함된 이름을 통과시킨다', () => {
      expect(validateIdentifier('user_profiles', 'Table')).toEqual({ valid: true });
    });

    it('숫자가 포함된 이름을 통과시킨다', () => {
      expect(validateIdentifier('users2', 'Table')).toEqual({ valid: true });
    });

    it('한글 이름을 통과시킨다', () => {
      expect(validateIdentifier('사용자', 'Table')).toEqual({ valid: true });
    });
  });

  describe('위험한 식별자', () => {
    it('세미콜론이 포함된 이름을 거부한다', () => {
      const result = validateIdentifier('users; DROP TABLE users', 'Table');
      expect(result.valid).toBe(false);
      expect(result.message).toContain('dangerous characters');
    });

    it('라인 주석이 포함된 이름을 거부한다', () => {
      const result = validateIdentifier('users--comment', 'Table');
      expect(result.valid).toBe(false);
    });

    it('블록 주석 시작이 포함된 이름을 거부한다', () => {
      const result = validateIdentifier('users/*comment', 'Table');
      expect(result.valid).toBe(false);
    });

    it('블록 주석 끝이 포함된 이름을 거부한다', () => {
      const result = validateIdentifier('users*/comment', 'Table');
      expect(result.valid).toBe(false);
    });

    it('백슬래시가 포함된 이름을 거부한다', () => {
      const result = validateIdentifier('users\\test', 'Table');
      expect(result.valid).toBe(false);
    });
  });

  describe('빈 식별자', () => {
    it('빈 문자열을 거부한다', () => {
      const result = validateIdentifier('', 'Table');
      expect(result.valid).toBe(false);
      expect(result.message).toContain('cannot be empty');
    });

    it('공백만 있는 문자열을 거부한다', () => {
      const result = validateIdentifier('   ', 'Table');
      expect(result.valid).toBe(false);
      expect(result.message).toContain('cannot be empty');
    });
  });

  describe('길이 제한', () => {
    it('64자 이하의 이름을 통과시킨다', () => {
      const name = 'a'.repeat(64);
      expect(validateIdentifier(name, 'Table')).toEqual({ valid: true });
    });

    it('65자 이상의 이름을 거부한다', () => {
      const name = 'a'.repeat(65);
      const result = validateIdentifier(name, 'Table');
      expect(result.valid).toBe(false);
      expect(result.message).toContain('64-character');
    });
  });

  describe('제어문자', () => {
    it('NULL 바이트가 포함된 이름을 거부한다', () => {
      const result = validateIdentifier('users\x00', 'Column');
      expect(result.valid).toBe(false);
      expect(result.message).toContain('control characters');
    });
  });

  describe('라벨 표시', () => {
    it('에러 메시지에 Table 라벨이 표시된다', () => {
      const result = validateIdentifier('', 'Table');
      expect(result.message).toContain('Table');
    });

    it('에러 메시지에 Column 라벨이 표시된다', () => {
      const result = validateIdentifier('', 'Column');
      expect(result.message).toContain('Column');
    });

    it('에러 메시지에 Database 라벨이 표시된다', () => {
      const result = validateIdentifier('', 'Database');
      expect(result.message).toContain('Database');
    });
  });
});
