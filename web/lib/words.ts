/** Word count used for the live counter; the server counts the same way. */
export function countWords(text: string): number {
  return (text.match(/[A-Za-z0-9'’-]+/g) ?? []).length;
}
