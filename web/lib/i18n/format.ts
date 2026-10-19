/** Replaces {name} placeholders in a message. */
export function fmt(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) =>
    key in values ? String(values[key]) : `{${key}}`,
  );
}

/** Picks a plural form: forms are [one, few, many] (Russian) or [one, other]. */
export function plural(locale: string, n: number, forms: readonly string[]): string {
  const rule = new Intl.PluralRules(locale).select(n);
  if (forms.length === 2) return rule === "one" ? forms[0] : forms[1];
  if (rule === "one") return forms[0];
  if (rule === "few") return forms[1];
  return forms[2] ?? forms[1];
}
