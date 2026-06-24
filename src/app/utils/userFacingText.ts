/** Strip internal HRMS references from text shown to end users. */
export function sanitizeUserFacingText(text: string | undefined | null): string {
  if (!text) return '';
  return text
    .replace(/\bfull name as per hrms\b/gi, 'Enter your full name')
    .replace(/\bas per hrms\b/gi, 'as per records')
    .replace(/\bhrms staff id\b/gi, 'staff ID')
    .replace(/\bhrms records\b/gi, 'your records')
    .replace(/\bfrom hrms\b/gi, '')
    .replace(/\bin hrms\b/gi, '')
    .replace(/\bagainst hrms\b/gi, '')
    .replace(/\bto hrms\b/gi, '')
    .replace(/\bhrms\b/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}
