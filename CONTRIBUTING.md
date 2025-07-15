# Contributing to SuperClaude Enterprise

Thank you for your interest in contributing to SuperClaude Enterprise! This document provides guidelines and instructions for contributing.

## 🤝 Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct:

- Be respectful and inclusive
- Welcome newcomers and help them get started
- Focus on constructive criticism
- Respect differing viewpoints and experiences

## 🚀 Getting Started

### 1. Fork and Clone

```bash
# Fork the repository on GitHub, then:
git clone https://github.com/YOUR_USERNAME/superclaude-enterprise.git
cd superclaude-enterprise
git remote add upstream https://github.com/ORIGINAL_OWNER/superclaude-enterprise.git
```

### 2. Setup Development Environment

```bash
# Install dependencies
npm install

# Run tests to ensure everything works
npm test

# Start development mode
npm run dev
```

### 3. Create a Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/issue-number-description
```

## 📝 Development Process

### 1. Code Style

We use TypeScript with strict mode enabled. Follow these guidelines:

```typescript
// ✅ Good
export class ConflictResolver {
  private readonly logger: Logger;
  
  constructor(logger: Logger) {
    this.logger = logger;
  }
  
  async resolve(
    command: string,
    personas: Persona[],
    context: ExecutionContext
  ): Promise<ResolvedContext> {
    // Implementation
  }
}

// ❌ Bad
export class conflict_resolver {
  logger: any;
  
  constructor(logger) {
    this.logger = logger
  }
  
  resolve(command, personas, context) {
    // Implementation
  }
}
```

### 2. Testing

All code must have tests. We aim for >90% coverage.

```typescript
describe('ConflictResolver', () => {
  let resolver: ConflictResolver;
  
  beforeEach(() => {
    resolver = new ConflictResolver(mockLogger);
  });
  
  it('should resolve conflicts between personas', async () => {
    // Arrange
    const personas = [
      { name: 'security' },
      { name: 'performance' }
    ];
    
    // Act
    const result = await resolver.resolve('/sc:analyze', personas, {});
    
    // Assert
    expect(result.conflicts).toBeDefined();
    expect(result.resolutionTime).toBeLessThan(100);
  });
});
```

### 3. Documentation

- Add JSDoc comments to all public APIs
- Update README.md for user-facing changes
- Update ARCHITECTURE.md for structural changes
- Include examples in documentation

```typescript
/**
 * Resolves conflicts between multiple personas
 * @param command - The SuperClaude command to execute
 * @param personas - Array of personas to consider
 * @param context - Execution context including environment
 * @returns Promise resolving to context with conflict resolution
 * @throws {ConflictResolutionError} If resolution fails
 * @example
 * const result = await resolver.resolve(
 *   '/sc:analyze',
 *   [{ name: 'security' }, { name: 'performance' }],
 *   { environment: 'production' }
 * );
 */
async resolve(
  command: string,
  personas: Persona[],
  context: ExecutionContext
): Promise<ResolvedContext> {
  // Implementation
}
```

## 🔄 Pull Request Process

### 1. Before Submitting

- [ ] All tests pass (`npm test`)
- [ ] Code follows style guidelines (`npm run lint`)
- [ ] Coverage remains high (`npm run test:coverage`)
- [ ] Documentation is updated
- [ ] Commit messages follow conventional commits

### 2. Commit Message Format

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

Examples:

```bash
feat(conflict-resolver): add veto override strategy

Implement veto override strategy for critical security concerns.
When security persona has veto condition, it overrides all other personas.

Closes #123

---

fix(gemini-adapter): correct cost calculation for large files

The cost calculation was using KB instead of MB for the multiplier.
This caused incorrect cost estimates for large contexts.

---

docs(readme): add troubleshooting section

Add common issues and solutions to help new users.
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Code style (formatting, semicolons, etc)
- `refactor`: Code change that neither fixes a bug nor adds a feature
- `perf`: Performance improvement
- `test`: Adding missing tests
- `chore`: Changes to build process or auxiliary tools

### 3. Pull Request Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix (non-breaking change)
- [ ] New feature (non-breaking change)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Checklist
- [ ] My code follows the style guidelines
- [ ] I have performed a self-review
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes
```

## 🧪 Testing Guidelines

### 1. Unit Tests

Test individual components in isolation:

```typescript
// src/extensions/conflict-resolver/__tests__/PriorityMatrix.test.ts
describe('PriorityMatrix', () => {
  it('should return correct priority for persona', () => {
    const matrix = new PriorityMatrix();
    expect(matrix.getPriority('security')).toBe(10);
  });
});
```

### 2. Integration Tests

Test component interactions:

```typescript
// tests/integration/conflict-resolution.test.ts
describe('Conflict Resolution Integration', () => {
  it('should handle complete conflict resolution flow', async () => {
    // Test the entire flow from command to resolution
  });
});
```

### 3. E2E Tests

Test complete user scenarios:

```typescript
// tests/e2e/superclaude-commands.test.ts
describe('SuperClaude Commands E2E', () => {
  it('should execute security scan with proper personas', async () => {
    // Test actual command execution
  });
});
```

## 🏗️ Architecture Guidelines

### 1. Module Structure

```
src/
├── extensions/
│   └── your-feature/
│       ├── index.ts           # Public API
│       ├── YourFeature.ts     # Main implementation
│       ├── types.ts           # TypeScript types
│       └── __tests__/         # Unit tests
├── integrations/
│   └── your-integration/
└── utils/
    └── your-util/
```

### 2. Dependency Management

- Keep dependencies minimal
- Use peer dependencies for optional features
- Document why each dependency is needed

### 3. Performance Considerations

- Lazy load heavy dependencies
- Use async/await properly
- Implement caching where appropriate
- Profile performance for critical paths

## 🐛 Reporting Issues

### 1. Bug Reports

Use the bug report template:

```markdown
**Describe the bug**
A clear and concise description

**To Reproduce**
Steps to reproduce:
1. Run command '...'
2. With personas '...'
3. See error

**Expected behavior**
What you expected to happen

**Screenshots**
If applicable

**Environment:**
- OS: [e.g., Ubuntu 22.04]
- Node version: [e.g., 18.0.0]
- SuperClaude version: [e.g., 3.0.0]

**Additional context**
Any other relevant information
```

### 2. Feature Requests

Use the feature request template:

```markdown
**Is your feature request related to a problem?**
A clear description of the problem

**Describe the solution you'd like**
A clear description of what you want

**Describe alternatives you've considered**
Any alternative solutions or features

**Additional context**
Any other context or screenshots
```

## 📚 Learning Resources

### 1. Key Concepts

- [TypeScript Deep Dive](https://basarat.gitbook.io/typescript/)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)
- [Clean Code JavaScript](https://github.com/ryanmcdermott/clean-code-javascript)

### 2. Project-Specific

- Read ARCHITECTURE.md thoroughly
- Study existing code patterns
- Ask questions in discussions

### 3. Tools

- VSCode with recommended extensions
- ESLint for code quality
- Prettier for formatting
- Jest for testing

## 🎉 Recognition

Contributors are recognized in:

- README.md contributors section
- Release notes
- Annual contributor spotlight

## 📞 Getting Help

- **Discord**: Join our Discord server
- **Discussions**: Use GitHub Discussions
- **Issues**: For bugs and features
- **Email**: dev@superclaude-enterprise.com

Thank you for contributing to SuperClaude Enterprise! 🚀