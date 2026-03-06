export function extractNotionPageId(input: string): string {
  const cleaned = input.trim();
  const uuidMatch = cleaned.match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
  if (uuidMatch) return uuidMatch[1];
  const hexMatch = cleaned.match(/([0-9a-f]{32})/i);
  if (hexMatch) return hexMatch[1];
  return cleaned;
}
