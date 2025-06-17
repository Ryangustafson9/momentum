// 🧪 VITEST CONFIGURATION - Comprehensive testing setup
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    // Test environment
    environment: 'jsdom',
    
    // Global setup
    globals: true,
    setupFiles: ['./src/tests/setup.js'],
    
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/tests/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/dist/**',
        '**/build/**',
        '**/*.test.*',
        '**/*.spec.*',
      ],
      thresholds: {
        global: {
          branches: 70,
          functions: 70,
          lines: 70,
          statements: 70,
        },
      },
    },
    
    // Test file patterns
    include: [
      'src/**/*.{test,spec}.{js,jsx,ts,tsx}',
      'src/tests/**/*.{test,spec}.{js,jsx,ts,tsx}',
    ],
    exclude: [
      'node_modules/',
      'dist/',
      'build/',
      '.git/',
    ],
    
    // Test timeout
    testTimeout: 10000,
    hookTimeout: 10000,
    
    // Reporter configuration
    reporter: ['verbose', 'json', 'html'],
    outputFile: {
      json: './test-results/results.json',
      html: './test-results/index.html',
    },
    
    // Mock configuration
    deps: {
      inline: ['@testing-library/jest-dom'],
    },
    
    // Watch mode configuration
    watch: {
      exclude: ['node_modules/**', 'dist/**', 'build/**'],
    },
  },
  
  // Resolve configuration (same as main vite config)
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  
  // Define global variables for tests
  define: {
    'import.meta.vitest': undefined,
  },
});
