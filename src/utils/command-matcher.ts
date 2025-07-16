/**
 * Intelligent command and persona matcher for natural language input
 */

import { normalizePersonaNames } from './persona-mapping.js';

interface CommandMatch {
  command: string;
  confidence: number;
  suggestedPersonas: string[];
  explanation: string;
  target?: string;
  flags?: string[];
  personas?: string[];
}

interface CommandPattern {
  command: string;
  keywords: string[];
  koreanKeywords: string[];
  personas: string[];
  description: string;
}

// Command patterns database
const commandPatterns: CommandPattern[] = [
  {
    command: 'analyze',
    keywords: ['analyze', 'check', 'review', 'inspect', 'audit', 'examine', 'assess', 'scan', 'vulnerability', 'security'],
    koreanKeywords: ['분석', '검사', '검토', '확인', '점검', '조사', '평가', '스캔', '취약점', '보안'],
    personas: ['analyzer', 'security'],
    description: 'Code analysis and review'
  },
  {
    command: 'implement',
    keywords: ['implement', 'create', 'add', 'feature', 'function', 'build', 'develop', 'make', 'new'],
    koreanKeywords: ['구현', '만들기', '추가', '기능', '개발', '생성', '제작', '신규'],
    personas: ['backend', 'frontend', 'architect'],
    description: 'Implement new features'
  },
  {
    command: 'improve',
    keywords: ['improve', 'optimize', 'enhance', 'refactor', 'performance', 'speed', 'faster', 'better', 'upgrade'],
    koreanKeywords: ['개선', '최적화', '향상', '리팩토링', '성능', '속도', '빠르게', '업그레이드'],
    personas: ['performance', 'refactorer'],
    description: 'Improve existing code'
  },
  {
    command: 'design',
    keywords: ['design', 'architect', 'structure', 'plan', 'blueprint', 'schema', 'model', 'pattern'],
    koreanKeywords: ['설계', '디자인', '구조', '계획', '스키마', '모델', '패턴', '아키텍처'],
    personas: ['architect', 'frontend'],
    description: 'Design system architecture'
  },
  {
    command: 'test',
    keywords: ['test', 'testing', 'unit', 'integration', 'e2e', 'coverage', 'jest', 'mocha', 'cypress'],
    koreanKeywords: ['테스트', '단위테스트', '통합테스트', 'E2E', '커버리지'],
    personas: ['qa', 'backend', 'frontend'],
    description: 'Write or run tests'
  },
  {
    command: 'troubleshoot',
    keywords: ['troubleshoot', 'debug', 'fix', 'bug', 'error', 'issue', 'problem', 'solve', 'crash'],
    koreanKeywords: ['문제해결', '디버그', '수정', '버그', '오류', '에러', '이슈', '문제', '해결'],
    personas: ['analyzer', 'backend', 'frontend'],
    description: 'Debug and fix issues'
  },
  {
    command: 'document',
    keywords: ['document', 'docs', 'readme', 'comment', 'explain', 'describe', 'api', 'guide'],
    koreanKeywords: ['문서', '문서화', '설명', '주석', '가이드', 'API문서'],
    personas: ['scribe', 'architect'],
    description: 'Create documentation'
  },
  {
    command: 'cleanup',
    keywords: ['cleanup', 'clean', 'format', 'lint', 'prettier', 'eslint', 'organize', 'tidy'],
    koreanKeywords: ['정리', '클린업', '포맷', '린트', '정돈'],
    personas: ['refactorer', 'qa'],
    description: 'Clean and format code'
  },
  {
    command: 'git',
    keywords: ['git', 'commit', 'push', 'pull', 'merge', 'branch', 'repository', 'version'],
    koreanKeywords: ['깃', '커밋', '푸시', '풀', '머지', '브랜치', '버전'],
    personas: ['devops'],
    description: 'Git operations'
  },
  {
    command: 'build',
    keywords: ['build', 'compile', 'bundle', 'webpack', 'rollup', 'transpile', 'package'],
    koreanKeywords: ['빌드', '컴파일', '번들', '패키지'],
    personas: ['devops', 'backend'],
    description: 'Build and compile'
  }
];

// Persona keywords for additional matching
const personaKeywords: Record<string, string[]> = {
  security: ['security', 'secure', 'auth', 'authentication', 'authorization', 'encrypt', 'vulnerability', 'xss', 'sql injection', '보안', '인증', '권한', '암호화', '취약점'],
  performance: ['performance', 'speed', 'fast', 'optimize', 'cache', 'memory', 'cpu', 'latency', '성능', '속도', '최적화', '캐시', '메모리'],
  architect: ['architecture', 'design', 'pattern', 'structure', 'microservice', 'monolith', 'api', '아키텍처', '설계', '패턴', '구조', '마이크로서비스'],
  frontend: ['ui', 'ux', 'frontend', 'react', 'vue', 'angular', 'css', 'html', 'component', '프론트', 'UI', 'UX', '컴포넌트'],
  backend: ['backend', 'api', 'database', 'server', 'endpoint', 'rest', 'graphql', '백엔드', '데이터베이스', '서버', 'API'],
  qa: ['test', 'quality', 'qa', 'bug', 'coverage', 'unit test', 'integration', '테스트', '품질', '버그', '커버리지'],
  devops: ['deploy', 'ci/cd', 'docker', 'kubernetes', 'aws', 'cloud', 'infrastructure', '배포', '도커', '쿠버네티스', '클라우드'],
  refactorer: ['refactor', 'clean code', 'solid', 'dry', 'pattern', 'smell', '리팩토링', '클린코드'],
  analyzer: ['analyze', 'debug', 'investigate', 'trace', 'profile', 'diagnose', '분석', '디버그', '조사', '진단']
};

/**
 * Find best matches for user input
 */
export function findBestMatches(userInput: string): CommandMatch[] {
  const input = userInput.toLowerCase();
  const matches: CommandMatch[] = [];

  // Score each command pattern
  for (const pattern of commandPatterns) {
    let score = 0;
    const matchedKeywords: string[] = [];
    
    // Check English keywords
    for (const keyword of pattern.keywords) {
      if (input.includes(keyword)) {
        score += keyword.length > 5 ? 3 : 2;
        matchedKeywords.push(keyword);
      }
    }
    
    // Check Korean keywords
    for (const keyword of pattern.koreanKeywords) {
      if (input.includes(keyword)) {
        score += 3; // Higher weight for Korean matches
        matchedKeywords.push(keyword);
      }
    }
    
    if (score > 0) {
      // Detect additional personas from input
      const detectedPersonas = detectAdditionalPersonas(input);
      const combinedPersonas = [...new Set([...pattern.personas, ...detectedPersonas])];
      
      // Extract file targets
      const filePattern = /\b[\w\-/]+\.\w+\b/g;
      const files = userInput.match(filePattern) || [];
      
      // Extract flags
      const flagPattern = /--(\w+)/g;
      const flags: string[] = [];
      let flagMatch;
      while ((flagMatch = flagPattern.exec(userInput)) !== null) {
        flags.push(`--${flagMatch[1]}`);
      }
      
      matches.push({
        command: pattern.command,
        confidence: score,
        suggestedPersonas: combinedPersonas,
        explanation: `Matched "${pattern.description}" based on keywords: ${matchedKeywords.join(', ')}`,
        target: files.length > 0 ? files[0] : undefined,
        flags: flags.length > 0 ? flags : undefined,
        personas: combinedPersonas
      });
    }
  }

  // Sort by confidence
  matches.sort((a, b) => b.confidence - a.confidence);

  // Calculate percentage confidence (normalize to 0-100)
  if (matches.length > 0) {
    const maxScore = matches[0].confidence;
    matches.forEach(match => {
      // Convert score to percentage (0-100)
      match.confidence = Math.min(100, Math.round((match.confidence / maxScore) * 100));
    });
  }

  return matches;
}

/**
 * Match user input to appropriate command and personas
 */
export function matchCommand(userInput: string): CommandMatch {
  const input = userInput.toLowerCase();
  const matches: CommandMatch[] = [];

  // Score each command pattern
  for (const pattern of commandPatterns) {
    let score = 0;
    const matchedKeywords: string[] = [];
    
    // Check English keywords
    for (const keyword of pattern.keywords) {
      if (input.includes(keyword)) {
        score += keyword.length > 5 ? 3 : 2;
        matchedKeywords.push(keyword);
      }
    }
    
    // Check Korean keywords
    for (const keyword of pattern.koreanKeywords) {
      if (input.includes(keyword)) {
        score += 3; // Higher weight for Korean matches
        matchedKeywords.push(keyword);
      }
    }
    
    if (score > 0) {
      matches.push({
        command: pattern.command,
        confidence: score,
        suggestedPersonas: pattern.personas,
        explanation: `Matched "${pattern.description}" based on keywords: ${matchedKeywords.join(', ')}`
      });
    }
  }

  // Sort by confidence
  matches.sort((a, b) => b.confidence - a.confidence);

  // Calculate percentage confidence (normalize to 0-100)
  if (matches.length > 0) {
    const maxScore = matches[0].confidence;
    matches.forEach(match => {
      // Convert score to percentage (0-100)
      match.confidence = Math.min(100, Math.round((match.confidence / maxScore) * 100));
    });
  }

  // If no matches, try to infer from general patterns
  if (matches.length === 0) {
    if (input.includes('만들') || input.includes('create') || input.includes('add')) {
      return {
        command: 'implement',
        confidence: 50,
        suggestedPersonas: ['architect', 'backend', 'frontend'],
        explanation: 'Inferred implementation task from general creation keywords'
      };
    }
    
    // Default to analyze
    return {
      command: 'analyze',
      confidence: 30,
      suggestedPersonas: ['analyzer'],
      explanation: 'No specific match found, defaulting to analysis'
    };
  }

  // Enhance personas based on content
  const bestMatch = matches[0];
  const additionalPersonas = detectAdditionalPersonas(input);
  bestMatch.suggestedPersonas = [...new Set([...bestMatch.suggestedPersonas, ...additionalPersonas])];

  return bestMatch;
}

/**
 * Detect additional personas from input content
 */
function detectAdditionalPersonas(input: string): string[] {
  const detectedPersonas: string[] = [];
  const lowerInput = input.toLowerCase();

  for (const [persona, keywords] of Object.entries(personaKeywords)) {
    for (const keyword of keywords) {
      if (lowerInput.includes(keyword)) {
        detectedPersonas.push(persona);
        break;
      }
    }
  }

  return normalizePersonaNames(detectedPersonas);
}

/**
 * Parse natural language input into structured command
 */
export function parseNaturalCommand(userInput: string): {
  originalInput: string;
  detectedCommand: string;
  suggestedPersonas: string[];
  confidence: number;
  explanation: string;
  structuredCommand: string;
} {
  // Remove /sc: prefix if present
  const cleanInput = userInput.replace(/^\/sc:\s*/i, '').trim();
  
  // Match command
  const match = matchCommand(cleanInput);
  
  // Extract file paths from input
  const filePattern = /\b[\w\-/]+\.\w+\b/g;
  const files = cleanInput.match(filePattern) || [];
  
  // Build structured command
  let structuredCommand = `/sc:${match.command}`;
  if (files.length > 0) {
    structuredCommand += ` ${files.join(' ')}`;
  }
  
  // Add remaining text as arguments
  let remainingText = cleanInput;
  for (const file of files) {
    remainingText = remainingText.replace(file, '');
  }
  remainingText = remainingText.trim();
  
  if (remainingText && !files.length) {
    structuredCommand += ` ${remainingText}`;
  }
  
  return {
    originalInput: userInput,
    detectedCommand: match.command,
    suggestedPersonas: match.suggestedPersonas,
    confidence: match.confidence,
    explanation: match.explanation,
    structuredCommand
  };
}

/**
 * Generate command suggestions based on partial input
 */
export function suggestCommands(partialInput: string): string[] {
  const suggestions: string[] = [];
  const input = partialInput.toLowerCase();
  
  for (const pattern of commandPatterns) {
    const allKeywords = [...pattern.keywords, ...pattern.koreanKeywords];
    if (allKeywords.some(keyword => keyword.startsWith(input) || input.includes(keyword))) {
      suggestions.push(`/sc:${pattern.command} - ${pattern.description}`);
    }
  }
  
  return suggestions.slice(0, 5); // Return top 5 suggestions
}

// Export for use in other modules
export const commandMatcher = {
  findBestMatches,
  detectAdditionalPersonas,
  parseNaturalCommand,
  suggestCommands,
  matchCommand
};

export default commandMatcher;