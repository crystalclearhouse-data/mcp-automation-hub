import { describe, it, expect } from 'vitest';
import { apiKeyRotation } from './api-key-rotation.js';

describe('API Key Rotation', () => {
  it('should register an API key', () => {
    apiKeyRotation.registerKey('test-key', 'test-value-123');
    const key = apiKeyRotation.getKey('test-key');
    expect(key).toBe('test-value-123');
  });

  it('should list registered keys', () => {
    apiKeyRotation.registerKey('test-key-2', 'test-value-456');
    const keys = apiKeyRotation.listKeys();
    expect(keys.length).toBeGreaterThan(0);
  });

  it('should rotate an API key', () => {
    apiKeyRotation.registerKey('test-key-3', 'old-value');
    apiKeyRotation.rotateKey('test-key-3', 'new-value');
    const key = apiKeyRotation.getKey('test-key-3');
    expect(key).toBe('new-value');
  });

  it('should throw error when rotating non-existent key', () => {
    expect(() => {
      apiKeyRotation.rotateKey('non-existent', 'new-value');
    }).toThrow('API key not found: non-existent');
  });
});
