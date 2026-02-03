import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logger } from '../logger';

describe('logger', () => {
  const originalEnv = process.env.NODE_ENV;
  let consoleSpy: {
    log: ReturnType<typeof vi.spyOn>;
    warn: ReturnType<typeof vi.spyOn>;
    error: ReturnType<typeof vi.spyOn>;
  };

  beforeEach(() => {
    consoleSpy = {
      log: vi.spyOn(console, 'log').mockImplementation(() => {}),
      warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
      error: vi.spyOn(console, 'error').mockImplementation(() => {}),
    };
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    vi.restoreAllMocks();
  });

  describe('log levels', () => {
    it('logs info messages', () => {
      logger.info('Test message');
      expect(consoleSpy.log).toHaveBeenCalled();
      const output = consoleSpy.log.mock.calls[0][0];
      expect(output).toContain('Test message');
    });

    it('logs warn messages', () => {
      logger.warn('Warning message');
      expect(consoleSpy.warn).toHaveBeenCalled();
      const output = consoleSpy.warn.mock.calls[0][0];
      expect(output).toContain('Warning message');
    });

    it('logs error messages', () => {
      logger.error('Error message');
      expect(consoleSpy.error).toHaveBeenCalled();
      const output = consoleSpy.error.mock.calls[0][0];
      expect(output).toContain('Error message');
    });
  });

  describe('context', () => {
    it('includes context in log output', () => {
      logger.info('Test message', { userId: '123', action: 'login' });
      const output = consoleSpy.log.mock.calls[0][0];
      expect(output).toContain('userId');
      expect(output).toContain('123');
    });
  });

  describe('error handling', () => {
    it('logs error objects with message', () => {
      const error = new Error('Something went wrong');
      logger.error('Operation failed', error);
      const output = consoleSpy.error.mock.calls[0][0];
      expect(output).toContain('Operation failed');
      expect(output).toContain('Something went wrong');
    });

    it('logs string errors', () => {
      logger.error('Operation failed', 'Simple error string');
      const output = consoleSpy.error.mock.calls[0][0];
      expect(output).toContain('Simple error string');
    });

    it('handles null/undefined errors gracefully', () => {
      logger.error('Operation failed', null);
      expect(consoleSpy.error).toHaveBeenCalled();
    });
  });

  describe('child logger', () => {
    it('creates child logger with base context', () => {
      const child = logger.child({ service: 'auth', requestId: 'abc123' });
      child.info('User logged in');
      const output = consoleSpy.log.mock.calls[0][0];
      expect(output).toContain('User logged in');
      expect(output).toContain('service');
      expect(output).toContain('auth');
      expect(output).toContain('requestId');
    });

    it('merges additional context with base context', () => {
      const child = logger.child({ service: 'auth' });
      child.info('Action', { action: 'login' });
      const output = consoleSpy.log.mock.calls[0][0];
      expect(output).toContain('service');
      expect(output).toContain('action');
    });

    it('child logger can log errors', () => {
      const child = logger.child({ service: 'email' });
      child.error('Email failed', new Error('SMTP error'));
      const output = consoleSpy.error.mock.calls[0][0];
      expect(output).toContain('Email failed');
      expect(output).toContain('SMTP error');
    });
  });
});
