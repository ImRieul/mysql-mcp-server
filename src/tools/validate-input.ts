/**
 * 에이전트 환각 대비 입력 검증 모듈
 * - 제어문자 거부 (탭/개행/캐리지리턴 제외)
 * - 식별자(테이블/컬럼명) 위험 패턴 거부
 */

function hasControlChars(str: string): boolean {
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    // 허용: \t(9), \n(10), \r(13)
    if (code === 9 || code === 10 || code === 13) continue;
    // 제어문자: 0x00-0x1f, 0x7f
    if (code <= 0x1f || code === 0x7f) return true;
  }
  return false;
}

const DANGEROUS_IDENTIFIER_PATTERNS = [
  /;/, // SQL statement separator
  /--/, // SQL line comment
  /\/\*/, // SQL block comment start
  /\*\//, // SQL block comment end
  /\\/, // backslash escape
];

export interface ValidationResult {
  valid: boolean;
  message?: string;
}

export function validateSql(sql: string): ValidationResult {
  if (hasControlChars(sql)) {
    return {
      valid: false,
      message: 'Error: SQL contains control characters. Remove non-printable characters (tab and newline are allowed).',
    };
  }
  return { valid: true };
}

export function validateIdentifier(name: string, label: string): ValidationResult {
  if (!name || name.trim().length === 0) {
    return { valid: false, message: `Error: ${label} name cannot be empty.` };
  }

  if (hasControlChars(name)) {
    return {
      valid: false,
      message: `Error: ${label} name contains control characters.`,
    };
  }

  for (const pattern of DANGEROUS_IDENTIFIER_PATTERNS) {
    if (pattern.test(name)) {
      return {
        valid: false,
        message: `Error: ${label} name contains dangerous characters (${pattern.source}). Use only valid MySQL identifier characters.`,
      };
    }
  }

  if (name.length > 64) {
    return {
      valid: false,
      message: `Error: ${label} name exceeds MySQL's 64-character limit.`,
    };
  }

  return { valid: true };
}
