```typescript
type MyLogger = WrapperHandler;

/**
 * @Wrapper
 */
export function func03(): MyLogger {
  // step 1
  return (ah, fm) => {
    // step 2
    return async (ctx, req) => {
      // step 3

      // before function call

      const result = ah(ctx, req);

      // after  function call

      return result;
    };
  };
}
```
