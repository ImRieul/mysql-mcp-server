import { describe, it, expect } from 'vitest';
import { formatColumn } from '../../src/tools/format-column.js';

describe('formatColumn', () => {
  it('기본 컬럼 (name + type)', () => {
    expect(
      formatColumn({
        name: 'email',
        type: 'varchar(255)',
        nullable: true,
        key: '',
        defaultValue: null,
        extra: '',
        comment: '',
      }),
    ).toBe('email varchar(255)');
  });

  it('NOT NULL을 포함한다', () => {
    expect(
      formatColumn({ name: 'id', type: 'int', nullable: false, key: '', defaultValue: null, extra: '', comment: '' }),
    ).toBe('id int NOT NULL');
  });

  it('PK를 표시한다', () => {
    expect(
      formatColumn({
        name: 'id',
        type: 'int',
        nullable: false,
        key: 'PRI',
        defaultValue: null,
        extra: '',
        comment: '',
      }),
    ).toBe('id int NOT NULL PK');
  });

  it('UNIQUE를 표시한다', () => {
    expect(
      formatColumn({
        name: 'email',
        type: 'varchar(255)',
        nullable: false,
        key: 'UNI',
        defaultValue: null,
        extra: '',
        comment: '',
      }),
    ).toBe('email varchar(255) NOT NULL UNIQUE');
  });

  it('INDEX를 표시한다', () => {
    expect(
      formatColumn({
        name: 'user_id',
        type: 'int',
        nullable: false,
        key: 'MUL',
        defaultValue: null,
        extra: '',
        comment: '',
      }),
    ).toBe('user_id int NOT NULL INDEX');
  });

  it('DEFAULT 값을 포함한다', () => {
    expect(
      formatColumn({ name: 'status', type: 'int', nullable: true, key: '', defaultValue: '0', extra: '', comment: '' }),
    ).toBe('status int DEFAULT 0');
  });

  it('EXTRA를 포함한다', () => {
    expect(
      formatColumn({
        name: 'id',
        type: 'int',
        nullable: false,
        key: 'PRI',
        defaultValue: null,
        extra: 'auto_increment',
        comment: '',
      }),
    ).toBe('id int NOT NULL PK auto_increment');
  });

  it('주석이 있으면 -- 주석을 추가한다', () => {
    expect(
      formatColumn({
        name: 'id',
        type: 'int',
        nullable: false,
        key: 'PRI',
        defaultValue: null,
        extra: 'auto_increment',
        comment: '사용자 고유 ID',
      }),
    ).toBe('id int NOT NULL PK auto_increment -- 사용자 고유 ID');
  });

  it('주석이 빈 문자열이면 생략한다', () => {
    expect(
      formatColumn({
        name: 'name',
        type: 'varchar(255)',
        nullable: true,
        key: '',
        defaultValue: null,
        extra: '',
        comment: '',
      }),
    ).toBe('name varchar(255)');
  });

  it('모든 속성이 있는 전체 포맷', () => {
    expect(
      formatColumn({
        name: 'score',
        type: 'int',
        nullable: false,
        key: 'MUL',
        defaultValue: '100',
        extra: 'auto_increment',
        comment: '점수',
      }),
    ).toBe('score int NOT NULL INDEX DEFAULT 100 auto_increment -- 점수');
  });
});
