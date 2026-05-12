# Neoma Package Template

Template for creating new Neoma packages with consistent structure, configuration, and testing setup.

## Creating a New Package

### 1. Copy this template

```bash
cd /path/to/wulfstack/packages
cp -r neoma-package-template neoma-<your-package-name>
cd neoma-<your-package-name>
```

### 2. Replace placeholders

Search and replace throughout the project:
- `{{PACKAGE_NAME}}` → Your package name (e.g., "garmr", "validation")
- `{{PACKAGE_DESCRIPTION}}` → Short description
- `{{REPO_URL}}` → GitHub repository URL (e.g., "https://github.com/shipdventures/neoma-garmr")

**Quick find/replace:**
```bash
# macOS/Linux
find . -type f -name "*.json" -o -name "*.md" -o -name "*.ts" | xargs sed -i '' 's/{{PACKAGE_NAME}}/your-package-name/g'
find . -type f -name "*.json" -o -name "*.md" -o -name "*.ts" | xargs sed -i '' 's/{{PACKAGE_DESCRIPTION}}/Your description/g'
find . -type f -name "*.json" -o -name "*.md" -o -name "*.ts" | xargs sed -i '' 's|{{REPO_URL}}|https://github.com/your-org/your-repo|g'
```

### 3. Rename directories

```bash
mv libs/package-template libs/your-package-name
```

### 4. Install dependencies

```bash
npm install
```

### 5. Start building!

```bash
npm test        # Unit tests (TDD)
npm run test:e2e # E2E tests
npm run build   # Build library
npm run lint    # Lint code
```

## Package Structure

```
neoma-<package-name>/
├── libs/
│   └── <package-name>/           # The npm package
│       ├── src/
│       │   ├── modules/          # NestJS modules
│       │   ├── decorators/       # Custom decorators
│       │   ├── middlewares/      # Middleware
│       │   ├── guards/           # Guards
│       │   ├── services/         # Services
│       │   ├── interfaces/       # TypeScript interfaces
│       │   ├── constants/        # Constants
│       │   └── index.ts          # Public API exports
│       ├── package.json          # Published package.json
│       └── tsconfig.lib.json     # Library TypeScript config
├── src/                          # Example/test application
│   ├── app.module.ts
│   └── ...
├── specs/                        # E2E tests
│   ├── jest-e2e.json
│   └── *.e2e-spec.ts
├── fixtures/                     # Test fixtures and utilities
│   ├── app/                      # Test app lifecycle management
│   ├── database/                 # In-memory database setup
│   ├── models/                   # Model factory patterns
│   ├── matchers/                 # Custom Jest matchers
│   └── e2e-setup.js              # E2E build hook
├── package.json                  # Development package.json
├── tsconfig.json                 # Root TypeScript config
├── eslint.config.mjs             # ESLint config
├── .prettierrc                   # Prettier config
├── .gitignore
├── .nvmrc
├── LICENSE
└── README.md                     # Package documentation
```

## Testing Strategy

### E2E Tests (`specs/`)
- One file per major feature or configuration
- Tests full install experience and integration
- Uses real NestJS app, real database
- Proves README instructions work

**Example**: The template includes `specs/app.e2e-spec.ts` demonstrating how to test endpoints using `managedAppInstance()` and supertest.

### Unit Tests (`libs/<package>/src/**/*.spec.ts`)
- TDD: Drive implementation
- Test individual classes/functions
- Fast feedback loop
- Test edge cases and error handling

**Example**: The template includes `libs/package-template/src/modules/example.module.spec.ts` showing how to test NestJS modules.

### Complete Testing Flow

1. **Write library code** in `libs/package-template/src/`
2. **Write unit tests** alongside your code (`*.spec.ts`)
3. **Export from** `libs/package-template/src/index.ts`
4. **Import in** `src/app.module.ts` for E2E testing
5. **Write E2E tests** in `specs/` to validate integration

The template includes working examples of all these steps with `ExampleModule`.

**Don't test the same config twice** - E2E covers integration, unit tests cover logic.

## Testing Infrastructure

The template includes ready-to-use testing utilities in the `fixtures/` directory:

### App Lifecycle (`fixtures/app`)
```typescript
import { managedAppInstance } from "fixtures/app"

describe("My E2E Test", () => {
  it("should work", async () => {
    const app = managedAppInstance()
    // App is automatically initialized before each test
    // and cleaned up after each test
  })
})
```

### Database Setup (`fixtures/database`)
```typescript
import { managedDatasourceInstance } from "fixtures/database"

describe("My Database Test", () => {
  it("should query database", async () => {
    const datasource = managedDatasourceInstance()
    // Fresh in-memory SQLite database for each test
    // Automatically destroyed after each test
  })
})
```

### Model Factories (`fixtures/models`)
See `fixtures/models/README.md` for the pattern and examples.

### Custom Matchers (`fixtures/matchers`)
- `toThrowEquals(error)` - Assert errors match exactly
- `toEqualError(error)` - Assert errors are equal

### E2E Build Hook (`fixtures/e2e-setup.js`)
Automatically builds the library before E2E tests run.

## Scripts

- `npm run build` - Build the library
- `npm run lint` - Lint all code
- `npm test` - Run unit tests in watch mode
- `npm run test:e2e` - Run E2E tests in watch mode

## Configuration Highlights

### TypeScript
- Target: ES2022
- Strict null checks enabled
- Decorators enabled
- No semicolons (enforced)

### ESLint
- Explicit return types required
- Explicit member accessibility required
- No floating promises
- Prettier integration

### Jest
- ts-jest for TypeScript
- jest-extended for additional matchers
- In-memory SQLite for tests
- Module path mapping for clean imports

## Example README Structure

When you publish, your README should include:

1. **Motivation** - Why this package exists
2. **Problem/Solution** - Before/after code examples
3. **Installation** - Step-by-step setup
4. **Basic Usage** - Simple examples
5. **Advanced Usage** - Custom configurations
6. **API Reference** - All public APIs
7. **Links** - npm, GitHub, docs

See `@neoma/route-model-binding` README for a good example.

## Publishing Checklist

Before publishing to npm:

- [ ] All tests passing
- [ ] README is complete
- [ ] LICENSE file included
- [ ] Version bumped in both package.json files
- [ ] Built with `npm run build`
- [ ] Verify exports in `libs/<package>/src/index.ts`
- [ ] Test installation in separate project
- [ ] Verify peer dependencies are correct

```bash
cd libs/<your-package-name>
npm publish --access public
```

## Neoma Package Standards

All Neoma packages should:
- ✅ Be Laravel-inspired but NestJS-native
- ✅ Have minimal boilerplate
- ✅ Include comprehensive tests
- ✅ Have excellent documentation
- ✅ Use TypeScript strictly
- ✅ Follow consistent code style
- ✅ Be production-ready

## Template Improvements (TODO)

Future enhancements to this template:

- [ ] **GitHub Issue & PR Templates** - Add `.github/ISSUE_TEMPLATE/` for bug reports and feature requests, plus `.github/pull_request_template.md`
- [ ] **CONTRIBUTING.md** - Document contribution guidelines, coding standards, and development workflow
- [ ] **CHANGELOG.md Template** - Add template following Keep a Changelog format
- [ ] **README Badges** - Add placeholders for CI status, npm version, and license badges
- [ ] **VSCode Extensions** - Add `.vscode/extensions.json` with recommended extensions for NestJS development
- [ ] **CODE_OF_CONDUCT.md** - Add community standards if accepting external contributions
