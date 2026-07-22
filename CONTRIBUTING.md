# Contributing to BuildAnything Hackathon

Thank you for contributing to the Monad Liquidity Map! This document provides guidelines for participating in the project.

## Before You Start

- Review the [README.md](README.md) to understand the architecture and build order
- Familiarize yourself with the [Architecture Principles](#architecture-principles) section
- Ensure Node.js 18+ is installed

## Development Workflow

### Setup

```bash
npm install
npm run build  # Verify TypeScript builds
npm run test   # Run full test suite
```

### Committing Code

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** following the architecture layer structure

3. **Verify before committing**
   ```bash
   npm run check  # Runs build, tests, and prototype build
   ```

4. **Commit with descriptive messages**
   ```bash
   git commit -m "Add descriptive message for the change"
   ```

### Pull Requests

1. **Push your branch** and create a pull request against `main`
2. **Complete the PR template** — it guides you through the checklist
3. **Ensure CI passes** — GitHub Actions will run build, tests, and prototype build
4. **Address review feedback** promptly
5. **Ensure at least one approval** before merging (see branch protection rules)

## Code Standards

### TypeScript

- **Strict mode**: All TypeScript must pass `npm run build` with strict settings enabled
- **Type safety**: Avoid `any` types; use branded types from the canonical data layer
- **Exports**: Use explicit export statements; avoid namespace re-exports where possible

### Testing

- **Coverage**: Add unit tests for new modules in the `tests/` directory
- **Fixtures**: Use fixture-based deterministic replay tests where applicable
- **Test naming**: Use descriptive test names that clarify the scenario and expected behavior
- **Framework**: Tests run via `vitest`; see `npm run test`

### Documentation

- **Inline comments**: Document complex logic, assumptions, and non-obvious design choices
- **Function signatures**: Use JSDoc comments for public APIs
- **Architecture decisions**: If introducing a new pattern or significant change, document in a comment or ADR

## Submitting Changes

### For Bug Fixes

1. Create an issue describing the problem
2. Reference the issue in your PR
3. Add a test that reproduces the bug
4. Fix the bug
5. Verify the test now passes

### For New Features

1. Create an issue with the proposal and discussion
2. Align with the team on which architecture layer this belongs to
3. Create your feature branch
4. Add comprehensive tests
5. Update README.md if introducing new public APIs or patterns
6. Submit PR with clear description

### For Documentation

1. Update relevant files (README.md, code comments, etc.)
2. Review for accuracy and clarity
3. Submit PR for review

## Architecture Layers

All work should align with one or more of these layers:

1. **Canonical Data Layer** — branded identifiers, canonical contracts, validation
2. **Data Acquisition** — provider interfaces, raw record contracts, cursors
3. **Data Normalization Engine** — payload contracts, conversions, normalized events
4. **Relationship Graph Engine** — graph contracts, builder, snapshots
5. **Liquidity Attribution Engine** — inflow/outflow attribution, metrics
6. **Snapshot & Historical Data Engine** — immutable snapshots, versioning
7. **Analytics & Calculation Engine** — flow summaries, aggregations
8. **Public API Layer** — versioned response envelopes, contracts
9. **Frontend Application** — view-model projections, animations
10. **Observability & Operations** — metrics, health checks, monitoring
11. **Testing, Validation & Production Hardening** — tests, security, reliability

Include the affected layer(s) in your PR title or description.

## Questions or Issues?

- Review the existing code and tests for examples
- Check closed issues and PRs for similar discussions
- Open a new issue if you encounter problems or have questions

Thank you for contributing!