import { describe, it, expect, vi } from 'vitest';
import { createAddCommentHandler } from '../../src/tools/add-comment.js';
import type { QueryRunner } from '../../src/query-runner.js';

function createMockRunner(queryMock: ReturnType<typeof vi.fn>): QueryRunner {
  return {
    query: queryMock,
    withConnection: (fn) => fn(queryMock),
  } as unknown as QueryRunner;
}

describe('add_comment tool handler', () => {
  describe('readonly 모드', () => {
    it('readonly 모드에서는 에러를 반환한다', async () => {
      const query = vi.fn();
      const handler = createAddCommentHandler(createMockRunner(query), true);

      const result = await handler({ table: 'users', comment: '사용자' });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('read-only');
      expect(query).not.toHaveBeenCalled();
    });
  });

  describe('테이블 주석', () => {
    it('테이블 주석을 추가한다', async () => {
      const query = vi.fn().mockResolvedValue([{ affectedRows: 0 }]);
      const handler = createAddCommentHandler(createMockRunner(query), false);

      const result = await handler({ table: 'users', comment: '사용자 테이블', database: 'mydb' });

      expect(query).toHaveBeenCalledWith("ALTER TABLE `mydb`.`users` COMMENT = '사용자 테이블'");
      expect(result.content[0].text).toContain('Table comment updated');
    });

    it('주석 내 작은따옴표를 이스케이프한다', async () => {
      const query = vi.fn().mockResolvedValue([{ affectedRows: 0 }]);
      const handler = createAddCommentHandler(createMockRunner(query), false);

      await handler({ table: 'users', comment: "user's table", database: 'mydb' });

      expect(query).toHaveBeenCalledWith("ALTER TABLE `mydb`.`users` COMMENT = 'user''s table'");
    });
  });

  describe('컬럼 주석', () => {
    it('컬럼 주석을 추가한다 (기존 정의 유지)', async () => {
      const colInfo = {
        COLUMN_TYPE: 'varchar(255)',
        IS_NULLABLE: 'YES',
        COLUMN_DEFAULT: null,
        EXTRA: '',
      };
      const query = vi
        .fn()
        .mockResolvedValueOnce([[colInfo]])
        .mockResolvedValueOnce([{ affectedRows: 0 }]);
      const handler = createAddCommentHandler(createMockRunner(query), false);

      const result = await handler({ table: 'users', column: 'name', comment: '이름', database: 'mydb' });

      expect(query).toHaveBeenCalledWith("ALTER TABLE `mydb`.`users` MODIFY COLUMN `name` varchar(255) COMMENT '이름'");
      expect(result.content[0].text).toContain('Column comment updated');
    });

    it('NOT NULL 컬럼의 정의를 유지한다', async () => {
      const colInfo = {
        COLUMN_TYPE: 'int',
        IS_NULLABLE: 'NO',
        COLUMN_DEFAULT: null,
        EXTRA: 'auto_increment',
      };
      const query = vi
        .fn()
        .mockResolvedValueOnce([[colInfo]])
        .mockResolvedValueOnce([{ affectedRows: 0 }]);
      const handler = createAddCommentHandler(createMockRunner(query), false);

      await handler({ table: 'users', column: 'id', comment: 'PK', database: 'mydb' });

      expect(query).toHaveBeenCalledWith(
        "ALTER TABLE `mydb`.`users` MODIFY COLUMN `id` int NOT NULL auto_increment COMMENT 'PK'",
      );
    });

    it('DEFAULT 값이 있는 컬럼의 정의를 유지한다', async () => {
      const colInfo = {
        COLUMN_TYPE: 'int',
        IS_NULLABLE: 'YES',
        COLUMN_DEFAULT: '0',
        EXTRA: '',
      };
      const query = vi
        .fn()
        .mockResolvedValueOnce([[colInfo]])
        .mockResolvedValueOnce([{ affectedRows: 0 }]);
      const handler = createAddCommentHandler(createMockRunner(query), false);

      await handler({ table: 'users', column: 'status', comment: '상태', database: 'mydb' });

      expect(query).toHaveBeenCalledWith(
        "ALTER TABLE `mydb`.`users` MODIFY COLUMN `status` int DEFAULT '0' COMMENT '상태'",
      );
    });

    it('존재하지 않는 컬럼이면 에러를 반환한다', async () => {
      const query = vi.fn().mockResolvedValue([[]]);
      const handler = createAddCommentHandler(createMockRunner(query), false);

      const result = await handler({ table: 'users', column: 'nonexistent', comment: '없음', database: 'mydb' });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("doesn't exist");
    });
  });

  describe('database 처리', () => {
    it('database 미지정 시 SELECT DATABASE()로 조회한다', async () => {
      const query = vi
        .fn()
        .mockResolvedValueOnce([[{ db: 'current_db' }]])
        .mockResolvedValueOnce([{ affectedRows: 0 }]);
      const handler = createAddCommentHandler(createMockRunner(query), false);

      await handler({ table: 'users', comment: '사용자' });

      expect(query).toHaveBeenCalledWith('SELECT DATABASE() AS db');
      expect(query).toHaveBeenCalledWith("ALTER TABLE `current_db`.`users` COMMENT = '사용자'");
    });

    it('database 미지정 + DATABASE() NULL이면 에러를 반환한다', async () => {
      const query = vi.fn().mockResolvedValue([[{ db: null }]]);
      const handler = createAddCommentHandler(createMockRunner(query), false);

      const result = await handler({ table: 'users', comment: '사용자' });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('No database selected');
    });
  });

  describe('에러 처리', () => {
    it('DB 에러 시 에러 메시지를 반환한다', async () => {
      const query = vi.fn().mockRejectedValue(new Error('Access denied'));
      const handler = createAddCommentHandler(createMockRunner(query), false);

      const result = await handler({ table: 'users', comment: '사용자', database: 'mydb' });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Access denied');
    });
  });
});
