```typescript
type DataSource = {
  name: "postgres" | "mysql";
};

/**
 * @Config
 */
export function func02(): DataSource {
  // step 1
  return {
    name: "mysql",
  };
}
```
