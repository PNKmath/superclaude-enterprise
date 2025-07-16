import { EnhancedCommandParser } from '../enhanced-command-parser.js';

describe('Enhanced NLP Tests', () => {
  const parser = new EnhancedCommandParser();

  describe('Korean Security Analysis with Full Context', () => {
    it('should detect security intent from Korean input', () => {
      const input = "SuperClaude를 사용해서 auth.js의 보안 취약점을 검사해줘";
      const result = parser.parse(input);
      
      expect(result.baseCommand).toBe('analyze');
      expect(result.target).toBe('auth.js');
      expect(result.detectedIntent).toContain('security');
      expect(result.detectedIntent).toContain('vulnerability');
      expect(result.suggestedPersonas).toContain('security');
      expect(result.flags.get('security')).toBe(true);
      expect(result.flags.get('vulnerability')).toBe(true);
    });
  });

  describe('Complex Performance Analysis', () => {
    it('should detect performance persona for memory leak', () => {
      const input = "analyze strange memory leak in production environment";
      const result = parser.parse(input);
      
      expect(result.baseCommand).toBe('analyze');
      expect(result.detectedIntent).toContain('memory leak');
      expect(result.suggestedPersonas).toContain('analyzer');
      expect(result.suggestedPersonas).toContain('performance');
      expect(result.flags.get('performance')).toBe(true);
      expect(result.flags.get('memory-leak')).toBe(true);
    });
  });

  describe('Repository Pattern Implementation', () => {
    it('should detect backend persona for service implementation', () => {
      const input = "implement user service following repository pattern";
      const result = parser.parse(input);
      
      expect(result.baseCommand).toBe('implement');
      expect(result.detectedIntent).toContain('service');
      expect(result.detectedIntent).toContain('repository');
      expect(result.suggestedPersonas).toContain('backend');
      expect(result.suggestedPersonas).toContain('architect');
      expect(result.flags.get('backend')).toBe(true);
      expect(result.flags.get('service')).toBe(true);
      expect(result.flags.get('pattern')).toBe('repository');
    });
  });

  describe('Full Command Building', () => {
    it('should build complete SuperClaude command', () => {
      const input = "SuperClaude를 사용해서 auth.js의 보안 취약점을 검사해줘";
      const result = parser.parse(input);
      const fullCommand = parser.buildFullCommand(result);
      
      expect(fullCommand).toMatch(/^\/sc:analyze/);
      expect(fullCommand).toContain('--security');
      expect(fullCommand).toContain('--vulnerability');
      expect(fullCommand).toContain('auth.js');
    });
  });
});