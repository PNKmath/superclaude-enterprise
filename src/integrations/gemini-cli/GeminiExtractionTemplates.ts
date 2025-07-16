/**
 * Gemini Extraction Templates
 * 명확한 정보 추출을 위한 명령어별 템플릿 정의
 */

export interface ExtractionTemplate {
  command: string;
  requiredFields: string[];
  outputFormat: string;
  specificInstructions: string[];
  examples?: string;
}

export class GeminiExtractionTemplates {
  private static templates: Map<string, ExtractionTemplate> = new Map([
    // ANALYZE 명령어 템플릿
    ['/sc:analyze', {
      command: 'analyze',
      requiredFields: [
        'file_path',
        'issues_found',
        'severity_level',
        'line_numbers',
        'recommendations'
      ],
      outputFormat: `
## Analysis Report
### File: [file_path]
### Issues Found:
1. **[Issue Type]** (Severity: [High/Medium/Low])
   - Location: Line [X-Y]
   - Description: [Detailed description]
   - Impact: [Potential impact]
   - Fix: [Specific recommendation]

### Code Quality Metrics:
- Complexity: [score]
- Maintainability: [score]
- Test Coverage: [percentage]

### Summary:
[Overall assessment in 2-3 sentences]
`,
      specificInstructions: [
        'Extract ALL issues with exact line numbers',
        'Categorize by severity (High/Medium/Low)',
        'Include specific fix recommendations',
        'Preserve all technical terms exactly',
        'Report metrics as numbers, not descriptions'
      ],
      examples: `
Example output:
## Analysis Report
### File: auth.js
### Issues Found:
1. **SQL Injection Vulnerability** (Severity: High)
   - Location: Line 45-47
   - Description: Direct string concatenation in SQL query
   - Impact: Database compromise possible
   - Fix: Use parameterized queries with prepared statements
`
    }],

    // ANALYZE --security 템플릿
    ['/sc:analyze --security', {
      command: 'analyze',
      requiredFields: [
        'vulnerability_type',
        'cwe_id',
        'cvss_score',
        'affected_code',
        'exploitation_scenario',
        'mitigation'
      ],
      outputFormat: `
## Security Analysis Report
### Critical Findings:
1. **[Vulnerability Name]** 
   - CWE ID: [CWE-XXX]
   - CVSS Score: [X.X]
   - Location: [file:line]
   - Affected Code: \`\`\`[code snippet]\`\`\`
   - Exploitation: [How it can be exploited]
   - Mitigation: [Specific fix with code example]

### Security Metrics:
- Total Vulnerabilities: [count by severity]
- OWASP Top 10 Coverage: [which categories found]
- Secure Coding Violations: [count]

### Compliance Status:
- [ ] Input Validation
- [ ] Authentication Security
- [ ] Authorization Checks
- [ ] Data Encryption
- [ ] Error Handling
`,
      specificInstructions: [
        'Include CWE-ID for every vulnerability',
        'Calculate or estimate CVSS scores',
        'Show exact code snippets that are vulnerable',
        'Provide exploitation scenarios',
        'Include code examples in mitigation steps',
        'Check against OWASP Top 10'
      ]
    }],

    // ANALYZE --performance 템플릿
    ['/sc:analyze --performance', {
      command: 'analyze',
      requiredFields: [
        'bottleneck_type',
        'performance_impact',
        'measured_time',
        'memory_usage',
        'optimization_suggestion',
        'expected_improvement'
      ],
      outputFormat: `
## Performance Analysis Report
### Performance Bottlenecks:
1. **[Bottleneck Type]**
   - Location: [file:line]
   - Current Performance: [Xms/XMB]
   - Impact: [percentage of total time]
   - Root Cause: [technical explanation]
   - Solution: [specific optimization]
   - Expected Improvement: [X% faster/less memory]

### Metrics:
- Load Time: [current] → [optimized]
- Memory Usage: [current] → [optimized]
- CPU Usage: [percentage]
- Database Queries: [count and time]

### Big-O Analysis:
- Current Complexity: O([complexity])
- Optimized Complexity: O([complexity])
`,
      specificInstructions: [
        'Measure or estimate actual performance numbers',
        'Include time complexity analysis',
        'Quantify improvements in percentages',
        'Identify N+1 queries and inefficient loops',
        'Suggest specific optimization techniques',
        'Include memory profiling data'
      ]
    }],

    // IMPLEMENT 템플릿
    ['/sc:implement', {
      command: 'implement',
      requiredFields: [
        'requirements_understood',
        'implementation_approach',
        'code_structure',
        'error_handling',
        'tests_included',
        'integration_points'
      ],
      outputFormat: `
## Implementation Plan
### Requirements Understanding:
- Main Goal: [what needs to be built]
- Constraints: [technical/business constraints]
- Dependencies: [external dependencies]

### Implementation:
\`\`\`[language]
// Complete implementation with:
// 1. Clear function/class structure
// 2. Error handling
// 3. Input validation
// 4. Comments for complex logic

[Full code implementation]
\`\`\`

### Tests:
\`\`\`[language]
// Unit tests covering:
// - Happy path
// - Edge cases
// - Error scenarios

[Test implementation]
\`\`\`

### Integration Guide:
1. [Step-by-step integration instructions]
2. [Configuration required]
3. [API endpoints or interfaces]
`,
      specificInstructions: [
        'Generate complete, runnable code',
        'Include comprehensive error handling',
        'Add input validation',
        'Write unit tests',
        'Document integration points',
        'Follow project coding standards',
        'Use existing project patterns'
      ]
    }],

    // REVIEW 템플릿
    ['/sc:review', {
      command: 'review',
      requiredFields: [
        'code_quality_score',
        'issues_by_category',
        'best_practices_violations',
        'suggestions',
        'positive_aspects'
      ],
      outputFormat: `
## Code Review Report
### Overall Score: [X/10]

### Issues by Category:
#### 🐛 Bugs (Priority: High)
1. [Issue description] - Line [X]
   - Why it's a problem: [explanation]
   - How to fix: [specific solution]

#### 🏗️ Architecture Issues
[Similar format]

#### 🎨 Code Style
[Similar format]

#### 🔒 Security Concerns
[Similar format]

### Positive Aspects:
- [What's done well]

### Recommendations Priority:
1. **Must Fix**: [Critical issues]
2. **Should Fix**: [Important improvements]
3. **Consider**: [Nice to have]
`,
      specificInstructions: [
        'Categorize all findings',
        'Provide specific line numbers',
        'Include positive feedback',
        'Prioritize recommendations',
        'Explain why each issue matters',
        'Suggest concrete fixes'
      ]
    }],

    // EXPLAIN 템플릿
    ['/sc:explain', {
      command: 'explain',
      requiredFields: [
        'concept_overview',
        'how_it_works',
        'code_walkthrough',
        'use_cases',
        'common_pitfalls'
      ],
      outputFormat: `
## Explanation: [Topic]
### Overview:
[High-level explanation in simple terms]

### How It Works:
1. [Step-by-step breakdown]
2. [With technical details]
3. [But still understandable]

### Code Walkthrough:
\`\`\`[language]
// Annotated code with inline explanations
[code with comments explaining each part]
\`\`\`

### Real-World Use Cases:
1. [Practical example 1]
2. [Practical example 2]

### Common Pitfalls:
- ❌ Don't: [Common mistake]
- ✅ Do: [Correct approach]

### Related Concepts:
- [Concept 1]: [Brief explanation]
- [Concept 2]: [Brief explanation]
`,
      specificInstructions: [
        'Start with simple explanation',
        'Progress to technical details',
        'Include annotated code examples',
        'Provide real-world context',
        'Warn about common mistakes',
        'Link to related concepts'
      ]
    }],

    // IMPROVE 템플릿
    ['/sc:improve', {
      command: 'improve',
      requiredFields: [
        'improvement_areas',
        'current_vs_improved',
        'refactoring_steps',
        'benefits',
        'risks'
      ],
      outputFormat: `
## Improvement Plan
### Identified Improvement Areas:
1. **[Area Name]**
   - Current Issue: [what's wrong]
   - Improvement: [what to change]
   - Benefit: [why it's better]

### Refactoring Plan:
#### Step 1: [Title]
**Current Code:**
\`\`\`[language]
[current code]
\`\`\`

**Improved Code:**
\`\`\`[language]
[improved code]
\`\`\`

**Why This Is Better:**
- [Specific benefit 1]
- [Specific benefit 2]

### Impact Analysis:
- Performance: [+X% improvement]
- Maintainability: [improved/unchanged]
- Test Coverage: [improved/unchanged]
- Breaking Changes: [yes/no, details]

### Migration Guide:
1. [Step-by-step migration]
2. [Handling backwards compatibility]
`,
      specificInstructions: [
        'Show before/after code comparisons',
        'Quantify improvements where possible',
        'Identify potential risks',
        'Provide migration path',
        'Preserve functionality',
        'Follow refactoring best practices'
      ]
    }]
  ]);

  /**
   * Get template for a specific command
   */
  static getTemplate(command: string): ExtractionTemplate | undefined {
    // Try exact match first
    let template = this.templates.get(command);
    if (template) return template;

    // Try to match base command
    const baseCommand = command.split(' ')[0];
    template = this.templates.get(baseCommand);
    if (template) return template;

    // Check if it includes flags
    for (const [key, value] of this.templates) {
      if (command.includes(key)) {
        return value;
      }
    }

    return undefined;
  }

  /**
   * Generate extraction prompt for Gemini
   */
  static generateExtractionPrompt(command: string, context: any): string {
    const template = this.getTemplate(command);
    if (!template) {
      return this.generateGenericPrompt(command, context);
    }

    const prompt = [
      `# Task: ${template.command.toUpperCase()} Analysis`,
      '',
      '## Required Information to Extract:',
      ...template.requiredFields.map(field => `- ${field}: [Extract this information]`),
      '',
      '## Output Format:',
      '```',
      template.outputFormat.trim(),
      '```',
      '',
      '## Specific Instructions:',
      ...template.specificInstructions.map((inst, i) => `${i + 1}. ${inst}`),
    ];

    if (template.examples) {
      prompt.push('', '## Example:', template.examples);
    }

    if (context.targetFiles?.length > 0) {
      prompt.push('', '## Files to Analyze:', ...context.targetFiles.map((f: string) => `- ${f}`));
    }

    if (context.personas?.length > 0) {
      prompt.push('', '## Active Personas:', ...context.personas.map((p: string) => `- ${p}`));
      prompt.push(...this.getPersonaSpecificInstructions(context.personas));
    }

    return prompt.join('\n');
  }

  /**
   * Generate generic prompt for commands without templates
   */
  private static generateGenericPrompt(command: string, context: any): string {
    return [
      `# Task: Execute "${command}"`,
      '',
      '## General Requirements:',
      '- Provide comprehensive analysis',
      '- Include specific details and examples',
      '- Use structured output format',
      '- Preserve all technical accuracy',
      '',
      '## Expected Output Sections:',
      '1. Summary of findings',
      '2. Detailed analysis with examples',
      '3. Recommendations or next steps',
      '4. Any warnings or concerns',
      '',
      `## Context:`,
      `- Files: ${context.targetFiles?.join(', ') || 'N/A'}`,
      `- Personas: ${context.personas?.join(', ') || 'N/A'}`,
      `- Flags: ${JSON.stringify(context.flags || {})}`,
    ].join('\n');
  }

  /**
   * Get persona-specific extraction instructions
   */
  private static getPersonaSpecificInstructions(personas: string[]): string[] {
    const instructions: string[] = ['', '## Persona-Specific Requirements:'];

    if (personas.includes('security')) {
      instructions.push(
        '### Security Persona:',
        '- Include ALL security vulnerabilities, even minor ones',
        '- Add CWE/CVE identifiers where applicable',
        '- Assess risk levels (Critical/High/Medium/Low)',
        '- Provide specific remediation code'
      );
    }

    if (personas.includes('performance')) {
      instructions.push(
        '### Performance Persona:',
        '- Include actual performance metrics (ms, MB, %)',
        '- Identify Big-O complexity',
        '- Quantify improvements (X% faster)',
        '- Show memory and CPU usage'
      );
    }

    if (personas.includes('architect')) {
      instructions.push(
        '### Architect Persona:',
        '- Analyze design patterns used',
        '- Identify architectural issues',
        '- Map component dependencies',
        '- Suggest structural improvements'
      );
    }

    if (personas.includes('qa')) {
      instructions.push(
        '### QA Persona:',
        '- Identify missing tests',
        '- Check edge cases coverage',
        '- Validate error handling',
        '- Suggest test scenarios'
      );
    }

    return instructions;
  }

  /**
   * Validate extraction output against template
   */
  static validateExtraction(output: string, command: string): {
    valid: boolean;
    missingFields: string[];
    coverage: number;
  } {
    const template = this.getTemplate(command);
    if (!template) {
      return { valid: true, missingFields: [], coverage: 1.0 };
    }

    const missingFields: string[] = [];
    let foundFields = 0;

    for (const field of template.requiredFields) {
      // Simple keyword-based validation
      const fieldKeywords = field.split('_').join(' ');
      if (!output.toLowerCase().includes(fieldKeywords.toLowerCase())) {
        missingFields.push(field);
      } else {
        foundFields++;
      }
    }

    const coverage = foundFields / template.requiredFields.length;

    return {
      valid: missingFields.length === 0,
      missingFields,
      coverage
    };
  }
}