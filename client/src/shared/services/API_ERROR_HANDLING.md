# API Error Handling, Timeout & Retry Logic

This document explains the centralized error handling system implemented in the client application.

## Features

### 1. **Centralized Error Handling** 🎯

All API errors are automatically processed and displayed to users with friendly messages.

**Location:** `client/src/shared/utils/errorHandler.ts`

**Key Functions:**
- `parseError(error)` - Parses axios errors into structured format
- `getUserMessage(error)` - Returns user-friendly error message
- `isRetryableError(error)` - Determines if error should trigger retry
- `isAuthError(error)` - Checks if error is authentication related

**Error Codes:**
```typescript
enum ErrorCode {
    NETWORK_ERROR           // No connection
    TIMEOUT_ERROR          // Request timed out
    UNAUTHORIZED           // Invalid credentials
    FORBIDDEN              // No permission
    SESSION_EXPIRED        // Token expired
    VALIDATION_ERROR       // Invalid input
    BAD_REQUEST           // Invalid request
    INTERNAL_SERVER_ERROR // Server error
    SERVICE_UNAVAILABLE   // Server down
    NOT_FOUND             // Resource missing
    CONFLICT              // Resource exists
    TOO_MANY_REQUESTS     // Rate limited
    UNKNOWN_ERROR         // Unexpected error
}
```

### 2. **Request Timeout** ⏱️

All requests automatically timeout after **30 seconds** to prevent hanging.

**Configuration:**
```typescript
const API = axios.create({
    timeout: 30000, // 30 seconds
});
```

**Timeout errors:**
- Automatically detected
- Trigger retry logic
- Display user-friendly message

### 3. **Automatic Retry with Exponential Backoff** 🔄

Failed requests are automatically retried for transient errors.

**Location:** `client/src/shared/utils/retry.ts`

**Configuration:**
```typescript
{
    maxRetries: 3,
    retryDelay: 1000, // Initial delay: 1 second
    retryableStatuses: [408, 429, 500, 502, 503, 504]
}
```

**Retry Logic:**
- **Attempt 1:** Wait ~1 second
- **Attempt 2:** Wait ~2 seconds
- **Attempt 3:** Wait ~4 seconds
- **Max delay:** 30 seconds
- **Jitter:** Random 0-1s added to prevent thundering herd

**Retryable Errors:**
- Network errors (no connection)
- Timeout errors
- Server errors (500, 502, 503, 504)
- Rate limiting (429)
- Request timeout (408)

**Non-Retryable Errors:**
- Authentication errors (401, 403)
- Validation errors (400, 422)
- Not found (404)
- Client errors (4xx except 408, 429)

### 4. **User-Friendly Error Messages** 💬

Generic error codes are mapped to helpful messages.

**Examples:**

| Error Code | User Message |
|------------|-------------|
| `NETWORK_ERROR` | "Unable to connect to the server. Please check your internet connection." |
| `TIMEOUT_ERROR` | "Request timed out. Please try again." |
| `UNAUTHORIZED` | "Invalid credentials. Please check your email and password." |
| `VALIDATION_ERROR` | "Please check your input and try again." |
| `INTERNAL_SERVER_ERROR` | "Something went wrong on our end. Please try again later." |

## How It Works

### Request Flow

```
1. User triggers API request
   ↓
2. Request sent with 30s timeout
   ↓
3. Response received OR error occurs
   ↓
4. Error Interceptor processes error
   ↓
5. Check if 401 (Unauthorized)
   ├─ YES → Try token refresh → Retry request
   └─ NO → Continue
   ↓
6. Parse error (parseError)
   ↓
7. Check if retryable (shouldRetryRequest)
   ├─ YES → Wait with exponential backoff → Retry
   └─ NO → Continue
   ↓
8. Show user-friendly error toast
   ↓
9. Return rejected promise
```

### Token Refresh Flow

```
1. Request receives 401 Unauthorized
   ↓
2. Check if already refreshing
   ├─ YES → Queue request
   └─ NO → Start refresh
   ↓
3. Call /auth/refresh endpoint
   ↓
4. Success?
   ├─ YES → Notify queued requests → Retry all
   └─ NO → Clear session → Redirect to login
```

## Usage Examples

### Basic Usage (Automatic)

All API calls automatically use error handling:

```typescript
import API from '@shared/services/api';

// Error handling is automatic!
const response = await API.get('/users');
// ✅ Automatically retries on failure
// ✅ Shows user-friendly error toast
// ✅ Handles token refresh
```

### Custom Error Handling

Override default behavior when needed:

```typescript
try {
    const response = await API.post('/auth/login', credentials);
    showToast('Login successful!', 'success');
} catch (error) {
    // Error already shown by interceptor
    // Add custom logic if needed
    console.error('Login failed', error);
}
```

### Disable Retry for Specific Request

```typescript
const response = await API.get('/data', {
    // Add custom flag to skip retry
    // (Note: requires custom implementation)
});
```

## Configuration

### Adjust Timeout

Edit `client/src/shared/services/api.ts`:

```typescript
const API = axios.create({
    timeout: 60000, // Change to 60 seconds
});
```

### Adjust Retry Settings

Edit `client/src/shared/utils/retry.ts`:

```typescript
const DEFAULT_RETRY_CONFIG: RetryConfig = {
    maxRetries: 5,      // Increase to 5 retries
    retryDelay: 2000,   // Start with 2 second delay
    retryableStatuses: [408, 429, 500, 502, 503, 504],
};
```

### Customize Error Messages

Edit `client/src/shared/utils/errorHandler.ts`:

```typescript
const ERROR_MESSAGES: Record<ErrorCode, string> = {
    [ErrorCode.NETWORK_ERROR]: 'Your custom message here',
    // ...
};
```

## Monitoring & Debugging

### Console Logs

Retry attempts are logged:
```
Retrying request (attempt 1/3) after 1234ms
Request failed after 3 retries: <error message>
```

### Error Structure

All errors are parsed to this format:

```typescript
{
    code: ErrorCode,
    message: string,        // Server/original message
    userMessage: string,    // User-friendly message
    statusCode?: number,    // HTTP status
    details?: any,          // Validation errors, etc.
}
```

## Best Practices

1. **Don't duplicate error handling** - Interceptor handles it
2. **Add context-specific success messages** - Only success needs manual toasts
3. **Log errors for debugging** - Use console.error in catch blocks
4. **Test with network throttling** - Verify retry logic works
5. **Monitor retry rates** - High retry rates indicate issues

## Testing

### Simulate Network Error
```typescript
// Chrome DevTools → Network → Offline
```

### Simulate Timeout
```typescript
// Chrome DevTools → Network → Slow 3G
// Or reduce timeout to 1000ms temporarily
```

### Simulate Server Error
```typescript
// Backend: throw ApiError.internal('Test error');
```

## Related Files

- `client/src/shared/services/api.ts` - Main API configuration
- `client/src/shared/utils/errorHandler.ts` - Error parsing and mapping
- `client/src/shared/utils/retry.ts` - Retry logic
- `client/src/shared/types/errors.ts` - Type definitions
