# Gemini CLI Integration Guide

Advanced Gemini CLI integration for SuperClaude Enterprise with intelligent context preservation.

## Overview

SuperClaude Enterprise's Gemini integration provides cost-effective processing for large files and complex operations while maintaining context integrity through a sophisticated 3-mode execution system.

## 🎯 Context Preservation System

### The Challenge

When using Gemini as a data relay or "sponge" for processing, there's a risk of context loss. Our integrated solution addresses this through:

1. **Structured Templates**: Pre-defined extraction patterns for common operations
2. **Adaptive Processing**: Dynamic context preservation for complex tasks
3. **Hybrid Approach**: Combines structure with flexibility when needed

### Three Execution Modes

#### 1. Template Mode (80% of cases)
- **Purpose**: Predictable, structured outputs for common commands
- **When Used**: Standard analysis, implementation, review tasks
- **Benefits**: 
  - Consistent output format
  - Fast processing
  - Minimal context loss
  - Easy validation

```bash
# Example: Security analysis with structured output
sc-enterprise run '/sc:analyze --security auth.js' --backend gemini

# Gemini receives a template ensuring it extracts:
# - Vulnerability type
# - CWE ID
# - CVSS score
# - Affected code
# - Mitigation steps
```

#### 2. Adaptive Mode (15% of cases)
- **Purpose**: Complex problem solving requiring context awareness
- **When Used**: 
  - Exploratory analysis
  - Multi-file investigations
  - Unclear requirements
  - High-stakes operations
- **Features**:
  - Context preservation rules
  - Session history tracking
  - Validation with retry
  - Detail level control

```bash
# Example: Complex debugging with full context
sc-enterprise run '/sc:analyze strange performance issue' \
  --backend gemini \
  --personas analyzer,performance,architect

# Adaptive mode preserves:
# - Root cause hypotheses
# - Performance metrics
# - System interactions
# - Historical context
```

#### 3. Hybrid Mode (5% of cases)
- **Purpose**: Pattern-based work requiring both structure and context
- **When Used**:
  - Implementation following patterns
  - Guided refactoring
  - Template + exploration needs
- **Combines**: Template structure + Adaptive preservation

```bash
# Example: Pattern-based implementation
sc-enterprise run '/sc:implement API endpoint following patterns' \
  --backend gemini \
  --target-files 'api/*.js'

# Hybrid mode ensures:
# - Pattern compliance (template)
# - Context understanding (adaptive)
# - Comprehensive output
```

## 🧠 Strategy Selection

### Automatic Mode Selection

The system automatically selects the appropriate mode based on:

1. **Command Analysis**: Keywords, structure, intent
2. **Context Complexity**: Files, personas, flags
3. **Historical Performance**: Previous success rates
4. **Risk Assessment**: Stakes and criticality

### Complexity Assessment

```
Complexity Score = 
  (file_count * 0.2) +
  (persona_count * 0.2) +
  (keyword_complexity * 0.3) +
  (flag_complexity * 0.2) +
  (ambiguity_score * 0.1)
```

- **< 0.3**: Template mode
- **0.3 - 0.7**: Consider adaptive based on patterns
- **> 0.7**: Adaptive or hybrid mode

### Manual Override

```bash
# Force template mode
sc-enterprise run '/sc:analyze' --gemini-mode template

# Force adaptive mode with detailed context
sc-enterprise run '/sc:analyze' --gemini-mode adaptive --context-level detailed

# Force hybrid mode
sc-enterprise run '/sc:analyze' --gemini-mode hybrid
```

## 📋 Template Library

### Security Analysis Template
```yaml
command: /sc:analyze --security
fields:
  - vulnerability_type
  - cwe_id
  - cvss_score
  - affected_code
  - exploitation_scenario
  - mitigation
output_format: structured_report
```

### Performance Analysis Template
```yaml
command: /sc:analyze --performance
fields:
  - bottleneck_type
  - measured_time
  - resource_usage
  - optimization_suggestions
  - impact_assessment
output_format: metrics_report
```

### Implementation Template
```yaml
command: /sc:implement
fields:
  - requirements_understood
  - implementation_approach
  - code_structure
  - test_cases
  - integration_points
output_format: code_with_explanation
```

## 🔄 Session Management

### Context Continuity

The system maintains session history for context preservation:

```javascript
// Session tracking
{
  sessionId: "unique-session-id",
  interactions: [
    {
      command: "/sc:analyze auth.js",
      output: "Found SQL injection vulnerability...",
      timestamp: "2024-01-17T10:00:00Z"
    },
    // Last 5 interactions preserved
  ]
}
```

### Validation System

Each output is validated for context preservation:

```javascript
{
  valid: true,
  coverage: 0.95,  // 95% of required information preserved
  issues: [],
  contextLossScore: 0.05
}
```

## ⚙️ Configuration

### Basic Configuration
```yaml
# ~/.claude/enterprise/config/config.yaml
gemini:
  enabled: true
  autoRouting: true
  costThreshold: 0.10
  strategy:
    autoSelectMode: true
    defaultMode: "template"
    validationThreshold: 0.9
    maxRetries: 2
```

### Advanced Configuration
```yaml
gemini:
  strategy:
    modes:
      template:
        confidence_threshold: 0.8
        validation_required: false
      adaptive:
        context_levels: ["minimal", "standard", "detailed"]
        default_level: "standard"
        preservation_priority: ["errors", "metrics", "suggestions"]
      hybrid:
        template_weight: 0.6
        adaptive_weight: 0.4
```

## 🚀 Usage Examples

### Basic Usage
```bash
# Let the system choose the best mode
sc-enterprise run '/sc:analyze' --backend gemini

# View selected strategy
sc-enterprise run '/sc:analyze' --backend gemini --show-strategy
```

### Advanced Usage
```bash
# Complex multi-file analysis
sc-enterprise run '/sc:analyze performance issues' \
  --backend gemini \
  --target-files 'src/**/*.js' \
  --personas performance,architect \
  --context-level detailed

# Pattern-based implementation
sc-enterprise run '/sc:implement user service' \
  --backend gemini \
  --follow-patterns 'services/*.js' \
  --preserve-style
```

### Debugging Context Loss
```bash
# Enable validation reporting
export SC_GEMINI_VALIDATION=true

# Run with detailed logging
sc-enterprise run '/sc:analyze' \
  --backend gemini \
  --debug \
  --validate-context
```

## 📊 Performance Metrics

### Mode Performance Comparison

| Mode | Avg. Time | Context Preservation | Cost | Use Cases |
|------|-----------|---------------------|------|-----------|
| Template | 2-5s | 95%+ | Low | 80% |
| Adaptive | 5-15s | 90%+ | Medium | 15% |
| Hybrid | 4-10s | 93%+ | Medium | 5% |

### Context Preservation Metrics

- **Template Mode**: 95-99% preservation (structured fields)
- **Adaptive Mode**: 90-95% preservation (complex context)
- **Hybrid Mode**: 93-97% preservation (balanced)

## 🛡️ Best Practices

### 1. Command Clarity
- Use specific flags and options
- Provide clear target files
- Specify personas explicitly

### 2. Template Optimization
- Use templates for repetitive tasks
- Customize templates for your workflow
- Validate template outputs regularly

### 3. Adaptive Mode Guidelines
- Reserve for truly complex tasks
- Monitor context preservation scores
- Use session continuity for multi-step operations

### 4. Cost Management
- Monitor daily usage with `sc-enterprise gemini-stats`
- Set appropriate cost thresholds
- Use file size limits for automatic routing

## 🔧 Troubleshooting

### Common Issues

**1. Low Context Preservation Score**
```bash
# Increase context level
--context-level detailed

# Add preservation rules
--preserve "error_messages,stack_traces,line_numbers"
```

**2. Wrong Mode Selected**
```bash
# Force specific mode
--gemini-mode adaptive

# Adjust complexity threshold
--complexity-threshold 0.5
```

**3. Session Continuity Lost**
```bash
# Explicitly set session ID
--session-id "my-debugging-session"

# Check session history
sc-enterprise session-history "my-debugging-session"
```

### Debug Commands

```bash
# Test strategy selection
sc-enterprise test-gemini-strategy '/sc:analyze complex.js'

# Validate extraction template
sc-enterprise validate-template security

# Check Gemini availability
sc-enterprise gemini-status
```

## 📚 Advanced Topics

### Custom Templates
Create custom extraction templates:

```javascript
// ~/.claude/enterprise/gemini-templates/my-template.js
export default {
  pattern: /custom-analysis/,
  requiredFields: ['custom_metric', 'special_finding'],
  outputFormat: 'custom_report',
  specificInstructions: [
    'Extract custom metrics',
    'Focus on special patterns'
  ]
}
```

### Preservation Rules
Define custom preservation rules:

```yaml
preservation_rules:
  security_critical:
    - vulnerability_details
    - exploit_paths
    - remediation_steps
  performance_critical:
    - bottleneck_locations
    - metric_values
    - optimization_paths
```

### Integration with CI/CD
```yaml
# .github/workflows/analysis.yml
- name: Security Analysis with Gemini
  run: |
    sc-enterprise run '/sc:analyze --security' \
      --backend gemini \
      --gemini-mode template \
      --output-format json > security-report.json
```

## 🔗 Related Documentation

- [README.md](README.md) - General setup and usage
- [MCP_INTEGRATION.md](MCP_INTEGRATION.md) - Claude Code integration
- [ARCHITECTURE.md](ARCHITECTURE.md) - System architecture

---

For more information or to report issues with Gemini integration, please visit our [GitHub repository](https://github.com/your-org/superclaude-enterprise).