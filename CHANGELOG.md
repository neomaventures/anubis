# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.4.2] - 2026-04-12

### Added
- Husky + lint-staged pre-commit hook — runs `eslint --fix` on staged `.ts` and `.mjs` files

## [0.4.1] - 2026-04-12

### Added
- Six stricter TypeScript-ESLint rules: `consistent-type-imports`, `no-misused-promises`, `switch-exhaustiveness-check`, `return-await`, `prefer-nullish-coalescing`, `prefer-optional-chain`
- `@lib` pathGroups config for `import-x/order` to sort alias imports as internal
- `prefer-inline` option on `import-x/no-duplicates` to pair with inline type imports

## [0.4.0] - 2026-04-12

### Changed
- Bump TypeScript from 5.x to 6.x
- Replace individual strict flags with `strict: true` in tsconfig
- Migrate tsconfig paths to use `${configDir}` instead of `baseUrl`
- Add `esModuleInterop`, `noFallthroughCasesInSwitch`, and `types` to tsconfig
- Add `rootDir` and empty `paths` override to lib tsconfig to prevent alias leakage in published builds
- Add `*.tsbuildinfo` to `.gitignore`
- Bump ESLint from 9.x to 10.x, `@eslint/js` to 10.x, `typescript-eslint` to 8.58, `globals` to 17.x
- Bump `eslint-plugin-prettier` to ^5.5.5 for ESLint 10 peer compatibility
- Add `eslint-plugin-import-x` with `import-x/order`, `import-x/no-cycle`, `import-x/no-duplicates` rules
- Add `**/*.d.ts` to ESLint ignores
- Fix import ordering across source files to match enforced conventions
- Bump Jest from 29.x to 30.x, `@types/jest` to 30.x, `jest-extended` to 7.x
- Bump `ts-jest` to ^29.4.9 (supports Jest 30 peer range)
- Bump NestJS packages (`common`, `core`, `platform-express`, `testing`) to ^11.1.18
- Bump `@neoma/managed-app` to ^0.5.0
- Bump `@types/node` to ^25.5.2
- Fix dependabot lib directory path from `{{PACKAGE_NAME}}` to `package-template`

## [0.3.3] - 2025-11-13

### Fixed
- Update setup script to replace literal `package-template` path references
- Fix broken path mappings in tsconfig.json and Jest configs after setup
- Remove circular dependency by replacing npm package import with @lib path alias

## [0.3.2] - 2025-11-13

### Added
- `@neoma/managed-app` dependency for better error handling and debugging support

### Changed
- Updated test:e2e script to use NEOMA_MANAGED_APP_MODULE_PATH environment variable
- Simplified Jest setup by removing build-module.js dependency
- Added @lib path alias for cleaner imports to package template source

## [0.3.1] - 2025-11-12

### Fixed
- Prevent template repository from publishing to npm when tagged
- Publish job now only runs for packages created from template, not template itself

## [0.3.0] - 2025-11-12

### Fixed
- Replace `{{PACKAGE_NAME}}` placeholder with buildable `package-template` name
- Update setup script to rename `libs/package-template` instead of `libs/PACKAGE_NAME`
- Template now builds, tests, lints, and validates successfully

### Added
- Publish dry-run test in CI workflow to validate package structure
- Complete package-lock.json for reproducible builds

### Changed
- Directory structure uses `libs/package-template` instead of `libs/PACKAGE_NAME`
- All imports and references updated to use `@neoma/package-template`

## [0.2.0] - 2025-11-12

### Added
- Build module on test functionality
- Comprehensive testing infrastructure with fixtures
- Example module with unit tests

### Fixed
- INestApplication typing issues
- Application specialisation improvements

## [0.1.0] - Initial Release

### Added
- Initial Neoma package template structure
- NestJS module scaffolding
- Testing setup with Jest
- ESLint and Prettier configuration
- TypeScript configuration
- Setup script for placeholder replacement
- Comprehensive README documentation

[Unreleased]: https://github.com/shipdventures/neoma-package-template/compare/v0.4.2...HEAD
[0.4.2]: https://github.com/shipdventures/neoma-package-template/compare/v0.4.1...v0.4.2
[0.4.1]: https://github.com/shipdventures/neoma-package-template/compare/v0.4.0...v0.4.1
[0.4.0]: https://github.com/shipdventures/neoma-package-template/compare/v0.3.3...v0.4.0
[0.3.3]: https://github.com/shipdventures/neoma-package-template/compare/v0.3.2...v0.3.3
[0.3.2]: https://github.com/shipdventures/neoma-package-template/compare/v0.3.1...v0.3.2
[0.3.1]: https://github.com/shipdventures/neoma-package-template/compare/v0.3.0...v0.3.1
[0.3.0]: https://github.com/shipdventures/neoma-package-template/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/shipdventures/neoma-package-template/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/shipdventures/neoma-package-template/releases/tag/v0.1.0