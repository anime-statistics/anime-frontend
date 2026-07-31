export type PluralForms = [string, string, string]

export function pluralize(count: number, forms: PluralForms): string {
  const n = Math.abs(count) % 100
  const n1 = n % 10
  if (n > 10 && n < 20) return `${count} ${forms[2]}`
  if (n1 > 1 && n1 < 5) return `${count} ${forms[1]}`
  if (n1 === 1) return `${count} ${forms[0]}`
  return `${count} ${forms[2]}`
}
