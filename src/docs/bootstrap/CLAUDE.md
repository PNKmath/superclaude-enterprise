# SuperClaude Enterprise Bootstrap

## Initialization

This is the minimal bootstrap file for SuperClaude Enterprise. To initialize the system, the LazyDocumentLoader will load the necessary documentation on demand.

## Registry

All documentation is organized in a sharded structure. The main registry file `registry.json` contains mappings to all documentation components.

## Lazy Loading

Documentation is loaded only when needed. The system uses lazy loading to minimize context window usage and improve performance.

## Quick Start

1. Initialize the DocumentLoader
2. Load required documentation based on user request
3. Cache loaded documents for session reuse

## Available Documentation

For a complete list of available documentation, refer to `registry.json`. Documentation is organized by:
- Commands
- Flags  
- Personas
- Modes
- Orchestrator components
- Principles
- Rules
- MCP servers

Total tokens in this bootstrap file: approximately 150 tokens.