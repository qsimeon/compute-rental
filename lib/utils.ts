/**
 * Utility functions for the compute resource sharing platform
 * 
 * This module provides helper functions for validation, formatting,
 * security, and common operations used throughout the application.
 * 
 * @module lib/utils
 */

import crypto from 'crypto';
import { ResourceType } from '../types';

/**
 * Validate email address format
 * 
 * @param email - Email address to validate
 * @returns True if email is valid
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate SSH public key format
 * 
 * @param publicKey - SSH public key string
 * @returns True if key appears to be valid
 */
export function validateSSHPublicKey(publicKey: string): boolean {
  const sshKeyRegex = /^(ssh-rsa|ssh-ed25519|ecdsa-sha2-nistp256|ecdsa-sha2-nistp384|ecdsa-sha2-nistp521)\s+[A-Za-z0-9+/]+[=]{0,3}(\s+.*)?$/;
  return sshKeyRegex.test(publicKey.trim());
}

/**
 * Validate resource type
 * 
 * @param resourceType - Resource type string to validate
 * @returns True if resource type is valid
 */
export function validateResourceType(resourceType: string): boolean {
  return Object.values(ResourceType).includes(resourceType as ResourceType);
}

/**
 * Generate a secure random token
 * 
 * @param length - Length of token in bytes (default 32)
 * @returns Hex-encoded random token
 */
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Hash a password using PBKDF2
 * 
 * @param password - Plain text password
 * @param salt - Salt for hashing (generated if not provided)
 * @returns Object containing hash and salt
 */
export function hashPassword(
  password: string,
  salt?: string
): { hash: string; salt: string } {
  const actualSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto
    .pbkdf2Sync(password, actualSalt, 100000, 64, 'sha512')
    .toString('hex');
  
  return { hash, salt: actualSalt };
}

/**
 * Verify a password against a hash
 * 
 * @param password - Plain text password to verify
 * @param hash - Stored password hash
 * @param salt - Salt used for hashing
 * @returns True if password matches
 */
export function verifyPassword(
  password: string,
  hash: string,
  salt: string
): boolean {
  const { hash: computedHash } = hashPassword(password, salt);
  return computedHash === hash;
}

/**
 * Format duration in milliseconds to human-readable string
 * 
 * @param milliseconds - Duration in milliseconds
 * @returns Formatted duration string (e.g., "2h 30m")
 */
export function formatDuration(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}d ${hours % 24}h`;
  } else if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

/**
 * Format bytes to human-readable size
 * 
 * @param bytes - Number of bytes
 * @param decimals - Number of decimal places (default 2)
 * @returns Formatted size string (e.g., "1.5 GB")
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Format currency amount
 * 
 * @param amount - Amount in dollars
 * @param currency - Currency code (default 'USD')
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

/**
 * Calculate percentage with bounds checking
 * 
 * @param value - Current value
 * @param total - Total value
 * @returns Percentage (0-100)
 */
export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  const percentage = (value / total) * 100;
  return Math.max(0, Math.min(100, percentage));
}

/**
 * Sanitize user input to prevent injection attacks
 * 
 * @param input - User input string
 * @returns Sanitized string
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>"'&]/g, (char) => {
      const entities: Record<string, string> = {
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '&': '&amp;',
      };
      return entities[char] || char;
    })
    .trim();
}

/**
 * Deep clone an object
 * 
 * @param obj - Object to clone
 * @returns Deep cloned object
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Sleep for a specified duration
 * 
 * @param milliseconds - Duration to sleep
 * @returns Promise that resolves after the duration
 */
export function sleep(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

/**
 * Retry a function with exponential backoff
 * 
 * @param fn - Async function to retry
 * @param maxRetries - Maximum number of retries (default 3)
 * @param baseDelay - Base delay in milliseconds (default 1000)
 * @returns Result of the function
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt);
        await sleep(delay);
      }
    }
  }

  throw lastError!;
}

/**
 * Check if a date is expired
 * 
 * @param expirationDate - Date to check
 * @returns True if date is in the past
 */
export function isExpired(expirationDate: Date): boolean {
  return new Date() > expirationDate;
}

/**
 * Generate a unique identifier based on multiple values
 * 
 * @param values - Array of values to hash
 * @returns Unique identifier string
 */
export function generateUniqueId(...values: any[]): string {
  const hash = crypto.createHash('sha256');
  values.forEach((value) => {
    hash.update(JSON.stringify(value));
  });
  return hash.digest('hex').substring(0, 16);
}

/**
 * Rate limiter helper
 */
export class RateLimiter {
  private requests: Map<string, number[]>;
  private maxRequests: number;
  private windowMs: number;

  /**
   * Create a new rate limiter
   * 
   * @param maxRequests - Maximum requests allowed in the window
   * @param windowMs - Time window in milliseconds
   */
  constructor(maxRequests: number, windowMs: number) {
    this.requests = new Map();
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  /**
   * Check if a request is allowed
   * 
   * @param identifier - Unique identifier (e.g., user ID, IP address)
   * @returns True if request is allowed
   */
  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const userRequests = this.requests.get(identifier) || [];

    // Remove old requests outside the window
    const validRequests = userRequests.filter(
      (timestamp) => now - timestamp < this.windowMs
    );

    if (validRequests.length < this.maxRequests) {
      validRequests.push(now);
      this.requests.set(identifier, validRequests);
      return true;
    }

    return false;
  }

  /**
   * Reset rate limit for an identifier
   * 
   * @param identifier - Unique identifier to reset
   */
  reset(identifier: string): void {
    this.requests.delete(identifier);
  }
}

/**
 * Simple in-memory cache
 */
export class Cache<T> {
  private store: Map<string, { value: T; expiresAt: number }>;

  constructor() {
    this.store = new Map();
  }

  /**
   * Set a value in the cache
   * 
   * @param key - Cache key
   * @param value - Value to cache
   * @param ttl - Time to live in milliseconds
   */
  set(key: string, value: T, ttl: number): void {
    const expiresAt = Date.now() + ttl;
    this.store.set(key, { value, expiresAt });
  }

  /**
   * Get a value from the cache
   * 
   * @param key - Cache key
   * @returns Cached value or undefined if not found/expired
   */
  get(key: string): T | undefined {
    const item = this.store.get(key);
    
    if (!item) {
      return undefined;
    }

    if (Date.now() > item.expiresAt) {
      this.store.delete(key);
      return undefined;
    }

    return item.value;
  }

  /**
   * Delete a value from the cache
   * 
   * @param key - Cache key
   */
  delete(key: string): void {
    this.store.delete(key);
  }

  /**
   * Clear all cached values
   */
  clear(): void {
    this.store.clear();
  }
}

/**
 * Validate and parse duration string (e.g., "1h", "30m", "2d")
 * 
 * @param durationStr - Duration string
 * @returns Duration in milliseconds
 */
export function parseDuration(durationStr: string): number {
  const regex = /^(\d+)([smhd])$/;
  const match = durationStr.match(regex);

  if (!match) {
    throw new Error(`Invalid duration format: ${durationStr}`);
  }

  const value = parseInt(match[1], 10);
  const unit = match[2];

  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };

  return value * multipliers[unit];
}
