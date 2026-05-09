# Model Factories

Create factory functions here to generate test data for your entities.

## Pattern

Use `@faker-js/faker` to generate realistic test data with sensible defaults that can be overridden.

## Example

```typescript
import { faker } from "@faker-js/faker"
import { User } from "src/user.entity"

export const user = {
  /**
   * Creates a fake user entity.
   *
   * @param [params] - Optional parameters to override default values.
   * @param [params.id] - Unique identifier for the user.
   * @param [params.username] - The User's username.
   *
   * @return A new instance of a User with the provided or default values.
   */
  entity(
    {
      id = crypto.randomUUID(),
      username = faker.internet.email(),
      deletedAt = null,
    }: Partial<User> = {
      id: crypto.randomUUID(),
      username: faker.internet.email(),
      deletedAt: null,
    },
  ): User {
    return Object.assign(new User(), {
      id,
      username,
      deletedAt,
    })
  },
}
```

## Usage in Tests

```typescript
import { user } from "fixtures/models/user"

describe("UserService", () => {
  it("should create a user", async () => {
    // Use defaults
    const defaultUser = user.entity()

    // Override specific fields
    const customUser = user.entity({
      username: "test@example.com"
    })

    // Test your code...
  })
})
```

## Benefits

- **Consistent test data** across all tests
- **Reduce boilerplate** in test files
- **Easy to maintain** when entity structure changes
- **Realistic data** with faker integration

## Reference

See `@neoma/route-model-binding` package for a complete example.
