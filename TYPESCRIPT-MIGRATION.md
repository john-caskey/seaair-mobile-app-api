# TypeScript Migration Guide

## Overview

This codebase has been migrated from JavaScript to TypeScript. This guide explains the changes and how to configure the application.

## Key Changes

### 1. TypeScript Migration

All JavaScript files have been converted to TypeScript:
- `server.js` → `server.ts`
- `src/auth.js` → `src/auth.ts`
- `src/messageQueue.js` → `src/messageQueue.ts`
- `src/rateLimiter.js` → `src/rateLimiter.ts`
- `src/routes/*.js` → `src/routes/*.ts`
- `test.js` → `test.ts`

### 2. Centralized Configuration

AWS Cognito configuration has been centralized in `src/config/cognito.ts`. You can now set your configuration values once in the code instead of using environment variables.

**Before (JavaScript with environment variables):**
```javascript
const COGNITO_USER_POOL_ID = process.env.COGNITO_USER_POOL_ID;
const COGNITO_CLIENT_ID = process.env.COGNITO_CLIENT_ID;
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
```

**After (TypeScript with centralized config):**
```typescript
// src/config/cognito.ts
export const cognitoConfig: CognitoConfig = {
  userPoolId: process.env.COGNITO_USER_POOL_ID || 'your-user-pool-id',
  clientId: process.env.COGNITO_CLIENT_ID || 'your-client-id',
  region: process.env.AWS_REGION || 'us-east-1',
};
```

### 3. Type Safety

The codebase now has full TypeScript type definitions:
- `src/types.ts` - Shared type definitions for messages, stats, and responses
- Type-safe request/response handling
- Better IDE support with autocomplete and type checking

## Configuration

### Option 1: Configure in Code (Recommended)

Edit `src/config/cognito.ts` and replace the default values:

```typescript
export const cognitoConfig: CognitoConfig = {
  userPoolId: 'us-east-1_YourPoolId',
  clientId: 'YourClientId12345',
  region: 'us-east-1',
};
```

This allows you to set your configuration once without needing environment variables.

### Option 2: Use Environment Variables (Legacy)

You can still use environment variables if preferred. The configuration falls back to environment variables:

```bash
export COGNITO_USER_POOL_ID="us-east-1_YourPoolId"
export COGNITO_CLIENT_ID="YourClientId12345"
export AWS_REGION="us-east-1"
```

## Building and Running

### Build the Application

The TypeScript code must be compiled to JavaScript before running:

```bash
npm run build
```

This creates JavaScript files in the `dist/` directory.

### Start the Server

```bash
npm start
```

This runs `npm run build` first, then starts the server.

### Development

```bash
npm run dev
```

### Run Tests

```bash
npm test
```

## Project Structure

```
seaair-mobile-app-api/
├── src/
│   ├── config/
│   │   └── cognito.ts          # Centralized AWS Cognito configuration
│   ├── routes/
│   │   ├── controller.ts       # Controller endpoints
│   │   └── mobile.ts           # Mobile app endpoints
│   ├── auth.ts                 # JWT authentication middleware
│   ├── messageQueue.ts         # In-memory message queue
│   ├── rateLimiter.ts          # Rate limiting
│   └── types.ts                # Shared TypeScript types
├── dist/                       # Compiled JavaScript (generated)
├── server.ts                   # Main server file
├── test.ts                     # Test suite
├── tsconfig.json               # TypeScript configuration
└── package.json                # Project dependencies
```

## TypeScript Configuration

The `tsconfig.json` file configures TypeScript compilation:

- **Target**: ES2020
- **Module**: CommonJS
- **Strict mode**: Enabled
- **Output**: `dist/` directory
- **Source maps**: Enabled for debugging

## Benefits of TypeScript

1. **Type Safety**: Catch errors at compile time
2. **Better IDE Support**: Autocomplete, refactoring, and inline documentation
3. **Maintainability**: Self-documenting code with type definitions
4. **Refactoring**: Safer code changes with compile-time checks
5. **Modern JavaScript**: Use latest JavaScript features with backward compatibility

## Backward Compatibility

The compiled JavaScript in `dist/` is fully compatible with Node.js and maintains the same API as before.

## Development Workflow

1. Edit TypeScript files in `src/` or root directory
2. Run `npm run build` to compile
3. Run `npm start` to start the server
4. Test your changes with `npm test`

## Troubleshooting

### Build Errors

If you encounter TypeScript errors during build:

```bash
npm run build
```

Check the error messages and fix any type errors in the TypeScript files.

### Runtime Errors

If the server fails to start:

1. Make sure you ran `npm run build` first
2. Check that all dependencies are installed: `npm install`
3. Verify your Cognito configuration in `src/config/cognito.ts`

## Migration Notes

- The original JavaScript files have been replaced with TypeScript files
- All functionality remains the same
- API endpoints are unchanged
- Environment variables still work as fallbacks
- No changes required to mobile apps or controllers

## Additional Resources

- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Express with TypeScript](https://expressjs.com/en/advanced/best-practice-performance.html)
- [AWS Cognito Documentation](https://docs.aws.amazon.com/cognito/)
