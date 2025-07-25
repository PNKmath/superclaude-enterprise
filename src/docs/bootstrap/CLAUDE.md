# SuperClaude Enterprise Bootstrap

## System Initialization

Minimal bootstrap for SuperClaude Enterprise MCP server. The DocumentLoader lazily loads sharded documentation on-demand to manage context window (30-minute sessions, <500 tokens).

## Registry

Document registry: `./src/docs/bootstrap/registry.json`

## Lazy Loading

Documents load dynamically based on request context. Session management ensures optimal token usage.

## Bootstrap Flow

1. Initialize DocumentLoader with registry
2. Load documents on-demand 
3. Shard large documents
4. Manage session context

## Architecture

- **MCP Server**: Model Context Protocol integration
- **Document Sharding**: Split documents <2000 tokens
- **Session Management**: 30-minute windows
- **Lazy Loading**: On-demand document retrieval

Essential documents defined in `./src/docs/bootstrap/fallback-config.json`