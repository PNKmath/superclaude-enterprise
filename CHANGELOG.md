# Changelog

All notable changes to SuperClaude Enterprise will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2025-01-16

### 🎉 Major Release: Enhanced Natural Language Processing

### Added
- **Enhanced Command Parser** with full context preservation
  - Bilingual (Korean/English) unified intent processing
  - Performance caching with 10-minute TTL for 35% faster parsing
  - Expanded keyword dictionaries for better pattern recognition
  
- **Session Management System**
  - 30-minute context windows for multi-turn conversations
  - Session continuity across commands
  - Context inheritance between turns
  - Gemini strategy persistence
  
- **Hybrid Mode Detector**
  - Intelligent pattern-based detection
  - Complexity scoring (0.0-1.0 scale)
  - 5% → 10%+ utilization increase
  - Better balance between Template and Adaptive modes

- **Performance Optimizations**
  - LRU caching for command parsing
  - Strategy selection caching (5-minute TTL)
  - Session context caching (30-minute TTL)
  - Average command processing time reduced by 35%

### Changed
- **Natural Language Processing**
  - Korean intents now map to English for unified processing
  - "memory leak", "메모리 누수" → performance persona
  - "service", "서비스" → backend persona
  - Repository pattern detection improved

- **Claude Code Bridge**
  - Replaced basic bridge with enhanced context-preserving version
  - Backward compatibility maintained
  - Better integration with MCP server

- **Gemini Strategy Selection**
  - High-stakes operations (security vulnerabilities) use adaptive mode
  - Better template matching for common patterns
  - Improved hybrid mode triggers

### Fixed
- Korean security analysis intent detection
- Memory leak keywords not triggering performance persona
- Service keywords not triggering backend persona
- MCP server ESM module compatibility issues

### Performance
- Command parsing: ~150ms → ~97ms (35% improvement)
- Cache hit rate: ~40% on typical usage
- Memory overhead: +7MB with caching (acceptable)

### Testing
- 100% test pass rate (10/10 integration tests)
- Production verification: 8/8 checks passed
- Full Korean/English NLP test coverage

## [1.0.0] - 2025-01-15

### Initial Release
- Core SuperClaude Enterprise functionality
- Natural language command processing
- Persona conflict resolution system
- Gemini CLI integration with 3 modes
- MCP server for Claude Code integration
- 5-level execution system
- Learning engine with pattern recognition
- Claude Code hooks support
- Comprehensive documentation

### Features
- 9 specialized personas (security, backend, frontend, etc.)
- Automatic backend routing (Claude/Gemini)
- Cost optimization (up to 50% savings with Gemini)
- 1M token context support
- Git hooks and CI/CD integration
- VS Code integration support

---

For detailed migration guides and breaking changes, see [MIGRATION.md](MIGRATION.md)
