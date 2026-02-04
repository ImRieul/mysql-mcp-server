export interface ColumnInfo {
  name: string;
  type: string;
  nullable: boolean;
  key: string;
  defaultValue: unknown;
  extra: string;
  comment: string;
}

export function formatColumn(col: ColumnInfo): string {
  let result = `${col.name} ${col.type}`;
  if (!col.nullable) result += ' NOT NULL';
  if (col.key === 'PRI') result += ' PK';
  else if (col.key === 'UNI') result += ' UNIQUE';
  else if (col.key === 'MUL') result += ' INDEX';
  if (col.defaultValue != null) result += ` DEFAULT ${col.defaultValue}`;
  if (col.extra) result += ` ${col.extra}`;
  if (col.comment) result += ` -- ${col.comment}`;
  return result;
}
