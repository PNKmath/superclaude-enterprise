/**
 * Persona name mapping for Korean support
 */

export const personaMapping: Record<string, string> = {
  // Korean to English mapping
  '보안': 'security',
  '아키텍트': 'architect',
  '설계자': 'architect',
  '성능': 'performance',
  '품질보증': 'qa',
  'QA': 'qa',
  '백엔드': 'backend',
  '프론트엔드': 'frontend',
  '프론트': 'frontend',
  '데브옵스': 'devops',
  '운영': 'devops',
  '리팩토러': 'refactorer',
  '리팩토링': 'refactorer',
  '분석가': 'analyzer',
  '분석': 'analyzer',
  
  // Keep English names as-is
  'security': 'security',
  'architect': 'architect',
  'performance': 'performance',
  'qa': 'qa',
  'backend': 'backend',
  'frontend': 'frontend',
  'devops': 'devops',
  'refactorer': 'refactorer',
  'analyzer': 'analyzer'
};

/**
 * Normalize persona name to English
 */
export function normalizePersonaName(name: string): string {
  const normalized = name.toLowerCase().trim();
  return personaMapping[normalized] || normalized;
}

/**
 * Normalize array of persona names
 */
export function normalizePersonaNames(names: string[]): string[] {
  return names.map(name => normalizePersonaName(name));
}