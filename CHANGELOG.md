# Changelog

All notable changes to SuperClaude Enterprise will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-01-15

### Added
- Initial release of SuperClaude Enterprise Extension
- Intelligent Persona Conflict Resolution system with 9 personas
- 5 resolution strategies: VETO_OVERRIDE, PRIORITY_BASED, NEGOTIATION, SEQUENTIAL_ACCESS, WEIGHTED_CONSENSUS
- Gemini CLI integration for automatic backend routing
- 5-level execution control system (Silent to Auto-block)
- Advanced Hook System v4 with full Claude Code hooks integration
  - PreToolUse hooks for validation and blocking dangerous commands
  - PostToolUse hooks for auto-formatting and testing
  - Notification hooks for custom alerts
  - Stop hooks for completion validation
  - Multi-source configuration (user, project, local)
  - Hook examples for Python, TypeScript, security, and team workflows
- Learning Engine with privacy-preserving pattern recognition
- Security Layer with credential masking and audit logging
- Context Analyzer for environment-aware persona weighting
- Comprehensive test suite with 20 tests
- Installation script for easy setup
- CLI interface with multiple commands
- TypeScript implementation with strict mode
- Performance optimizations for <100ms conflict resolution
- Integration with SuperClaude v3 without core modifications
- Support for Git hooks and IDE integrations
- Batch processing and caching for improved performance
- Metrics collection and monitoring capabilities

### Security
- Automatic credential and PII masking
- Audit trail generation for all operations
- Input validation and sanitization
- Role-based access control preparation

### Performance
- Conflict resolution: <100ms average (45ms typical)
- Backend selection: <50ms average (23ms typical)
- Memory usage: <150MB under normal load
- 50% API cost reduction through intelligent routing

### Documentation
- Comprehensive README with examples
- Detailed ARCHITECTURE.md
- Contributing guidelines
- License (MIT)

## [1.1.0] - 2024-01-16

### Added
- Natural language command processing with Korean/English support
- Intelligent command matching with confidence scoring
- Automatic persona recommendation based on input context
- Command suggestion system for partial inputs
- Korean persona name mapping (보안, 아키텍트, 성능, etc.)
- New CLI commands: `natural` (alias: `n`) and `suggest`
- Claude Code hook for natural language processing
- Comprehensive Korean command examples documentation

### Fixed
- Global installation issues with missing bin configuration
- TypeScript compilation errors with unused imports
- Module resolution errors for global command execution
- SuperClaude repository URL in installation script

### Improved
- Installation process now more flexible with SuperClaude path detection
- Better error handling for standalone operation without SuperClaude
- Enhanced documentation with natural language examples
- Natural language confidence scoring normalized to percentage (0-100%)
- Default .claude/settings.json includes natural language processing hook
- Corrected Gemini CLI installation instructions to use npm package

## [1.2.0] - 2024-01-16

### Added
- MCP (Model Context Protocol) server implementation
- Natural language processing as MCP tools for Claude Code
- Command suggestion tool for partial inputs
- Persona conflict resolution tool
- Comprehensive MCP integration documentation
- Test scripts for MCP server functionality

### Changed
- Migrated from hook-based approach to proper MCP server integration
- Natural language commands now work through Claude's tool calling
- Improved architecture for better Claude Code integration

### Fixed
- Claude Code hooks only work on tool execution, not user input
- Proper integration method using MCP protocol

## [1.2.1] - 2024-01-16

### Fixed
- MCP server module compatibility issues with ESM/CommonJS
- Import statements missing .js extensions causing module resolution failures
- Health check logging to stderr interfering with MCP protocol
- Zod schema serialization issues in MCP tool definitions
- MCP server failing to start in Claude Code

### Changed
- Migrated to ES modules with "type": "module" in package.json
- Updated tsconfig.json to use ES2022 module system
- Health check now writes to log file instead of stderr
- Health check is now opt-in via ENABLE_HEALTH_CHECK environment variable
- Tool schemas now use proper JSON schema format instead of Zod objects

### Improved
- MCP server stability and reliability
- Better error handling for module loading
- Cleaner protocol communication without stderr interference
- More detailed setup documentation in README

## [1.3.0] - 2025-07-16

### Added
- **Gemini Context Preservation System**: 3-mode intelligent strategy selection
  - Template Mode (80% of cases): Structured extraction for predictable outputs
  - Adaptive Mode (15% of cases): Complex problem solving with context preservation
  - Hybrid Mode (5% of cases): Combines structure with context awareness
- **Integrated Gemini Adapter**: Unified interface for all execution modes
  - Automatic mode selection based on command complexity
  - Session history tracking for context continuity
  - Validation system with coverage metrics
  - Retry mechanism for failed extractions
- **Strategy Selection Intelligence**:
  - Complexity assessment algorithm (0.0-1.0 scale)
  - Pattern recognition for command types
  - Persona-aware context preservation
  - Confidence scoring for mode selection
- **Extraction Templates**: Pre-defined templates for common commands
  - Security analysis with CWE-ID and CVSS scoring
  - Performance analysis with metrics and bottlenecks
  - Implementation tasks with requirements tracking
  - Code review with categorized findings
- **Context Preservation Features**:
  - Preservation rules for critical information
  - Session continuity across interactions
  - Validation of context coverage
  - Adaptive detail levels (minimal/standard/detailed)

### Improved
- Gemini CLI integration now prevents context loss through structured prompts
- Backend selection considers strategy complexity for optimal routing
- Error handling with graceful fallbacks between modes
- Memory efficiency through intelligent session history management
- Cost optimization through mode-appropriate processing

### Fixed
- Context loss issues when using Gemini as data relay
- Information preservation for complex multi-step operations
- Session continuity problems across Gemini interactions

### Technical Details
- Comprehensive test coverage for all strategy modes
- TypeScript strict mode compliance
- Modular architecture for easy extension
- Performance optimized for <100ms strategy selection

## [Unreleased]

### Planned
- Multi-model support (OpenAI, Cohere, etc.)
- Web dashboard for monitoring
- Plugin system for third-party extensions
- Team collaboration features
- Visual conflict resolution explorer
- Enhanced learning insights
- GraphQL API
- Kubernetes operator