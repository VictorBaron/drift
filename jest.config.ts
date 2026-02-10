module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/*.test.ts'],
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/src/$1',
  },
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        tsconfig: {
          target: 'ES2021',
          experimentalDecorators: true,
          emitDecoratorMetadata: true,
        },
      },
    ],
  },
  collectCoverageFrom: [
    'src/core/**/*.ts',
    '!src/**/*.test.ts',
    '!src/**/*.controller.ts',
    '!src/**/*.typeorm.ts',
    '!src/**/infrastructure/**/*.ts',
    '!src/**/dto/**/*.ts',
    '!src/**/dto.ts',
    '!src/**/module.ts',
    '!src/**/index.ts',
    '!src/**/queries/**/*.ts',
  ],
};
