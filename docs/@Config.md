```typescript
type Request = {
  name: string;
  age: number;
};

type Response = {
  person: Person;
  token: string;
};

type ReturnFunc01 = ActionHandler<Request, Response>;

/**
 * @Action
 */
export function func01(ds: DataSource): ReturnFunc01 {
  // step 1
  return async (ctx, req) => ({
    // step 2
    person: {
      age: 1,
      id: "",
      name: "",
    },
    token: "",
  });
}
```
