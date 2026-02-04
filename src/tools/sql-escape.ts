export function escapeStringValue(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/'/g, "''");
}

export function quoteStringValue(value: string): string {
  return `'${escapeStringValue(value)}'`;
}
