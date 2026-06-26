# NestJS Backend API Project

This is a NestJS backend API project template with TypeScript, ESLint, Prettier, and Jest testing.

## Project Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- npm

### Installation

1. Install dependencies:
```bash
npm install
```

### Development

1. Start the development server:
```bash
npm run start
```

2. Start in watch mode for development:
```bash
npm run start:dev
```

### Building

Build the project for production:
```bash
npm run build
```

### Testing

Run unit tests:
```bash
npm run test
```

Run end-to-end tests:
```bash
npm run test:e2e
```

Watch mode for tests:
```bash
npm run test:watch
```

### Code Quality

Lint the code:
```bash
npm run lint
```

Fix linting issues:
```bash
npm run lint:fix
```

Format code with Prettier:
```bash
npm run format
```

## Project Structure

```
src/
├── app.controller.ts       # Main application controller
├── app.service.ts          # Main application service
├── app.module.ts           # Root application module
└── main.ts                 # Application entry point
test/                       # E2E tests
dist/                       # Compiled output (generated)
node_modules/              # Dependencies (generated)
```

## Key Configuration Files

- `tsconfig.json` - TypeScript configuration
- `nest-cli.json` - NestJS CLI configuration
- `.eslintrc.json` - ESLint configuration
- `.prettierrc` - Prettier formatting configuration
- `package.json` - Project dependencies and scripts

## Next Steps

1. Customize the `src/app.module.ts` to add your features
2. Create new controllers, services, and modules as needed
3. Add environment configuration files (.env, .env.example)
4. Implement database connections if needed
5. Add API documentation with Swagger
6. Create business logic and validation rules
