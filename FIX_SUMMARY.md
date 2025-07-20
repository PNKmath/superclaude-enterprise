# Fix Summary: --uc Flag and Gemini Conflict Resolution

## Problem
The `--uc` (ultracompressed) flag was causing conflicts when commands were routed to Gemini because:
1. `--uc` is a SuperClaude-specific flag that Gemini doesn't recognize
2. The flag was being passed directly to Gemini CLI, causing execution failures
3. User's compression intent was lost in the process

## Solution Implemented

### 1. Flag Filtering (IntegratedGeminiAdapter.ts)
- Added `SUPERCLAUDE_ONLY_FLAGS` constant listing SuperClaude-specific flags
- Modified `buildGeminiCommand()` to filter out these flags before passing to Gemini
- Added debug logging when flags are filtered

### 2. Compression Intent Preservation
- Modified `buildAdaptivePrompt()` to detect `--uc` flag in context
- When detected, adds compression instructions to the Gemini prompt:
  - Ultra-compressed output format
  - Minimal, concise responses
  - 30-50% token reduction target

### 3. Test Coverage
- Created comprehensive test suite in `uc-flag-filtering.test.ts`
- Tests flag filtering, prompt enhancement, and various edge cases

## Files Modified

1. **src/integrations/gemini-cli/IntegratedGeminiAdapter.ts**
   - Added SUPERCLAUDE_ONLY_FLAGS constant
   - Modified buildGeminiCommand() to filter flags
   - Enhanced buildAdaptivePrompt() for compression instructions

2. **src/integrations/gemini-cli/__tests__/uc-flag-filtering.test.ts** (new)
   - Comprehensive test coverage for the fix

## How It Works

### Before Fix:
```
User: "간단히 분석해줘 main.js"
→ Parser: /sc:analyze --uc main.js
→ Gemini: gemini analyze --uc main.js (FAILS - unknown flag)
```

### After Fix:
```
User: "간단히 분석해줘 main.js"
→ Parser: /sc:analyze --uc main.js
→ Adapter: Filters --uc, adds compression to prompt
→ Gemini: gemini analyze main.js (with compressed output instructions)
```

## Benefits

1. **Compatibility**: Gemini commands no longer fail due to unknown flags
2. **Intent Preservation**: User's request for compressed output is honored
3. **Extensibility**: Easy to add more SuperClaude-specific flags to the filter list
4. **Debugging**: Debug logs help track when flags are filtered

## Testing

Run the new tests:
```bash
npm test -- uc-flag-filtering.test.ts
```

## Future Enhancements

1. Consider creating a flag translation system for more complex mappings
2. Add telemetry to track how often SuperClaude flags are used with Gemini
3. Potentially add user warnings when flags are filtered