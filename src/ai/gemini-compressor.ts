/**
 * Gemini-based Output Compressor
 * Replaces --uc flag functionality with AI-powered compression
 */

import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';

export type CompressionLevel = 'minimal' | 'balanced' | 'aggressive';

export class GeminiCompressor {
  private model: GenerativeModel;

  constructor(private gemini: GoogleGenerativeAI) {
    this.model = this.gemini.getGenerativeModel({
      model: "gemini-pro",
      generationConfig: {
        temperature: 0.1, // Low temperature for consistent compression
      }
    });
  }

  async compressOutput(text: string, level: CompressionLevel = 'balanced'): Promise<string> {
    // Skip compression for already short text
    if (text.length < 200) {
      return text;
    }

    const prompt = this.buildCompressionPrompt(text, level);
    
    try {
      const result = await this.model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          maxOutputTokens: this.getTokenLimit(level),
          temperature: 0.1
        }
      });

      const compressed = result.response.text();
      
      // Ensure we actually compressed the text
      if (compressed.length >= text.length * 0.9) {
        // If compression wasn't effective, try more aggressive approach
        return this.fallbackCompression(text, level);
      }

      return compressed;
    } catch (error) {
      console.error('Gemini compression failed:', error);
      // Fallback to simple compression
      return this.fallbackCompression(text, level);
    }
  }

  private buildCompressionPrompt(text: string, level: CompressionLevel): string {
    const levelInstructions = {
      minimal: `
        약간의 압축 (20-30% 감소):
        - 핵심 정보는 모두 유지
        - 중복 제거
        - 간결한 표현 사용
      `,
      balanced: `
        균형잡힌 압축 (40-60% 감소):
        - 핵심 정보와 중요 세부사항 유지
        - 예시는 대표적인 것만
        - 기술적 정확성 유지
      `,
      aggressive: `
        적극적 압축 (70-80% 감소):
        - 핵심 요점만 유지
        - 세부사항은 제거
        - 최대한 간결하게
      `
    };

    return `
다음 기술 문서를 ${level} 수준으로 압축해주세요.

압축 지침:
${levelInstructions[level]}

중요 규칙:
1. 기술적 정확성 절대 유지
2. 코드나 명령어는 그대로 유지
3. 에러 메시지나 경고는 유지
4. 숫자나 측정값은 정확히 유지

원본 텍스트:
"""
${text}
"""

압축된 텍스트:`;
  }

  private getTokenLimit(level: CompressionLevel): number {
    switch (level) {
      case 'minimal': return 1500;
      case 'balanced': return 800;
      case 'aggressive': return 400;
      default: return 800;
    }
  }

  private fallbackCompression(text: string, level: CompressionLevel): string {
    // Simple rule-based compression as fallback
    let compressed = text;

    // Remove extra whitespace
    compressed = compressed.replace(/\s+/g, ' ').trim();

    // Remove common filler words based on level
    if (level !== 'minimal') {
      const fillers = ['그리고', '또한', '하지만', '그러나', 'and', 'also', 'but', 'however'];
      fillers.forEach(filler => {
        compressed = compressed.replace(new RegExp(`\\b${filler}\\b`, 'gi'), '');
      });
    }

    // Truncate based on level
    const maxLength = {
      minimal: Math.floor(text.length * 0.8),
      balanced: Math.floor(text.length * 0.5),
      aggressive: Math.floor(text.length * 0.3)
    };

    if (compressed.length > maxLength[level]) {
      compressed = compressed.substring(0, maxLength[level]) + '...';
    }

    return compressed;
  }

  async compressCode(code: string, language: string): Promise<string> {
    // Special handling for code compression
    const prompt = `
다음 ${language} 코드를 압축해주세요:
- 주석 제거 (중요한 것 제외)
- 불필요한 공백 제거
- 하지만 가독성은 유지
- 기능은 절대 변경하지 않음

원본 코드:
\`\`\`${language}
${code}
\`\`\`

압축된 코드:`;

    try {
      const result = await this.model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      // Fallback: just remove comments and extra whitespace
      return code
        .replace(/\/\*[\s\S]*?\*\//g, '') // Remove block comments
        .replace(/\/\/.*/g, '') // Remove line comments
        .replace(/\n\s*\n/g, '\n') // Remove empty lines
        .trim();
    }
  }

  async summarize(text: string, maxLength: number = 500): Promise<string> {
    // Create a summary instead of compression
    const prompt = `
다음 텍스트를 ${maxLength}자 이내로 요약해주세요:
- 핵심 내용 중심
- 기술적 세부사항 포함
- 중요한 숫자나 지표 유지

원본:
${text}

요약:`;

    try {
      const result = await this.model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          maxOutputTokens: Math.floor(maxLength / 4), // Rough token estimate
          temperature: 0.3
        }
      });

      return result.response.text();
    } catch (error) {
      console.error('Summarization failed:', error);
      // Simple truncation as fallback
      return text.substring(0, maxLength) + '...';
    }
  }

  // Batch compression for multiple texts
  async batchCompress(
    texts: string[], 
    level: CompressionLevel = 'balanced'
  ): Promise<string[]> {
    // Process in parallel with rate limiting
    const batchSize = 3; // Process 3 at a time to avoid rate limits
    const results: string[] = [];

    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      const compressed = await Promise.all(
        batch.map(text => this.compressOutput(text, level))
      );
      results.push(...compressed);
      
      // Small delay to avoid rate limiting
      if (i + batchSize < texts.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return results;
  }
}