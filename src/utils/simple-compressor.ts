/**
 * Simple Rule-based Compressor
 * Gemini API를 사용하지 않고 간단한 규칙으로 텍스트 압축
 */

export class SimpleCompressor {
  
  compress(text: string, level: 'minimal' | 'balanced' | 'aggressive' = 'balanced'): string {
    if (text.length < 200) {
      return text; // 이미 짧은 텍스트는 그대로
    }

    let compressed = text;

    // 1. 중복 공백 제거
    compressed = compressed.replace(/\s+/g, ' ').trim();

    // 2. 불필요한 접속사 제거
    if (level !== 'minimal') {
      const fillers = [
        '그리고', '또한', '하지만', '그러나', '그래서', '따라서',
        'and', 'also', 'but', 'however', 'so', 'therefore',
        'additionally', 'furthermore', 'moreover'
      ];
      fillers.forEach(filler => {
        compressed = compressed.replace(new RegExp(`\\b${filler}\\b`, 'gi'), '');
      });
    }

    // 3. 반복되는 구문 제거
    compressed = this.removeDuplicatePhrases(compressed);

    // 4. 레벨에 따른 추가 압축
    if (level === 'aggressive') {
      // 괄호 안의 부가 설명 제거
      compressed = compressed.replace(/\([^)]*\)/g, '');
      // 예시 제거
      compressed = compressed.replace(/예(를 들어|시로).*?[.!?]/gi, '');
    }

    // 5. 길이 제한
    const maxLength = {
      minimal: Math.floor(text.length * 0.8),
      balanced: Math.floor(text.length * 0.5),
      aggressive: Math.floor(text.length * 0.3)
    };

    if (compressed.length > maxLength[level]) {
      // 문장 단위로 자르기
      const sentences = compressed.match(/[^.!?]+[.!?]+/g) || [compressed];
      compressed = '';
      
      for (const sentence of sentences) {
        if (compressed.length + sentence.length <= maxLength[level]) {
          compressed += sentence + ' ';
        } else {
          break;
        }
      }
      
      if (compressed.length < 50) {
        // 너무 짧으면 그냥 처음부터 자르기
        compressed = text.substring(0, maxLength[level]) + '...';
      }
    }

    return compressed.trim();
  }

  private removeDuplicatePhrases(text: string): string {
    // 5단어 이상의 반복 구문 찾기
    const words = text.split(/\s+/);
    const phraseLength = 5;
    const seen = new Set<string>();
    const result: string[] = [];

    for (let i = 0; i < words.length; i++) {
      if (i + phraseLength <= words.length) {
        const phrase = words.slice(i, i + phraseLength).join(' ');
        if (seen.has(phrase)) {
          // 반복 구문 발견, 건너뛰기
          i += phraseLength - 1;
          continue;
        }
        seen.add(phrase);
      }
      result.push(words[i]);
    }

    return result.join(' ');
  }

  // 코드 압축 (주석 제거)
  compressCode(code: string, language: string): string {
    let compressed = code;

    // 언어별 주석 패턴
    const commentPatterns: Record<string, RegExp[]> = {
      javascript: [
        /\/\*[\s\S]*?\*\//g,  // /* ... */
        /\/\/.*/g,            // // ...
      ],
      python: [
        /"""[\s\S]*?"""/g,    // """ ... """
        /'''[\s\S]*?'''/g,    // ''' ... '''
        /#.*/g,               // # ...
      ],
      default: [
        /\/\*[\s\S]*?\*\//g,
        /\/\/.*/g,
        /#.*/g,
      ]
    };

    const patterns = commentPatterns[language] || commentPatterns.default;
    
    patterns.forEach(pattern => {
      compressed = compressed.replace(pattern, '');
    });

    // 빈 줄 제거
    compressed = compressed.replace(/\n\s*\n/g, '\n');
    
    return compressed.trim();
  }

  // 핵심 요약 생성 (규칙 기반)
  summarize(text: string, maxLength: number = 500): string {
    // 핵심 키워드 우선순위
    const keywords = [
      'error', 'warning', 'success', 'failed', 'completed',
      '에러', '경고', '성공', '실패', '완료',
      'result', 'output', '결과', '출력'
    ];

    // 문장별로 나누기
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    const prioritySentences: Array<{sentence: string, score: number}> = [];

    sentences.forEach(sentence => {
      let score = 0;
      
      // 키워드 포함 여부
      keywords.forEach(keyword => {
        if (sentence.toLowerCase().includes(keyword)) {
          score += 10;
        }
      });

      // 숫자나 코드 포함 여부
      if (/\d+/.test(sentence)) score += 5;
      if (/`[^`]+`/.test(sentence)) score += 5;

      // 문장 위치 (처음과 끝이 중요)
      const position = sentences.indexOf(sentence);
      if (position < 3) score += 3;
      if (position >= sentences.length - 3) score += 3;

      prioritySentences.push({ sentence, score });
    });

    // 점수 높은 순으로 정렬
    prioritySentences.sort((a, b) => b.score - a.score);

    // 요약 생성
    let summary = '';
    for (const { sentence } of prioritySentences) {
      if (summary.length + sentence.length <= maxLength) {
        summary += sentence + ' ';
      }
    }

    return summary.trim() || text.substring(0, maxLength) + '...';
  }
}