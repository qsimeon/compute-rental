/**
 * Utility functions for the compute resource sharing platform
 *
 * This module provides helper functions for validation, formatting,
 * security, and common operations used throughout the application.
 *
 * @module lib/utils
 */
/**
 * Validate email address format
 *
 * @param email - Email address to validate
 * @returns True if email is valid
 */
export declare function validateEmail(email: string): boolean;
/**
 * Validate SSH public key format
 *
 * @param publicKey - SSH public key string
 * @returns True if key appears to be valid
 */
export declare function validateSSHPublicKey(publicKey: string): boolean;
/**
 * Validate resource type
 *
 * @param resourceType - Resource type string to validate
 * @returns True if resource type is valid
 */
export declare function validateResourceType(resourceType: string): boolean;
/**
 * Generate a secure random token
 *
 * @param length - Length of token in bytes (default 32)
 * @returns Hex-encoded random token
 */
export declare function generateSecureToken(length?: number): string;
/**
 * Hash a password using PBKDF2
 *
 * @param password - Plain text password
 * @param salt - Salt for hashing (generated if not provided)
 * @returns Object containing hash and salt
 */
export declare function hashPassword(password: string, salt?: string): {
    hash: string;
    salt: string;
};
/**
 * Verify a password against a hash
 *
 * @param password - Plain text password to verify
 * @param hash - Stored password hash
 * @param salt - Salt used for hashing
 * @returns True if password matches
 */
export declare function verifyPassword(password: string, hash: string, salt: string): boolean;
/**
 * Format duration in milliseconds to human-readable string
 *
 * @param milliseconds - Duration in milliseconds
 * @returns Formatted duration string (e.g., "2h 30m")
 */
export declare function formatDuration(milliseconds: number): string;
/**
 * Format bytes to human-readable size
 *
 * @param bytes - Number of bytes
 * @param decimals - Number of decimal places (default 2)
 * @returns Formatted size string (e.g., "1.5 GB")
 */
export declare function formatBytes(bytes: number, decimals?: number): string;
/**
 * Format currency amount
 *
 * @param amount - Amount in dollars
 * @param currency - Currency code (default 'USD')
 * @returns Formatted currency string
 */
export declare function formatCurrency(amount: number, currency?: string): string;
/**
 * Calculate percentage with bounds checking
 *
 * @param value - Current value
 * @param total - Total value
 * @returns Percentage (0-100)
 */
export declare function calculatePercentage(value: number, total: number): number;
/**
 * Sanitize user input to prevent injection attacks
 *
 * @param input - User input string
 * @returns Sanitized string
 */
export declare function sanitizeInput(input: string): string;
/**
 * Deep clone an object
 *
 * @param obj - Object to clone
 * @returns Deep cloned object
 */
export declare function deepClone<T>(obj: T): T;
/**
 * Sleep for a specified duration
 *
 * @param milliseconds - Duration to sleep
 * @returns Promise that resolves after the duration
 */
export declare function sleep(milliseconds: number): Promise<void>;
/**
 * Retry a function with exponential backoff
 *
 * @param fn - Async function to retry
 * @param maxRetries - Maximum number of retries (default 3)
 * @param baseDelay - Base delay in milliseconds (default 1000)
 * @returns Result of the function
 */
export declare function retryWithBackoff<T>(fn: () => Promise<T>, maxRetries?: number, baseDelay?: number): Promise<T>;
/**
 * Check if a date is expired
 *
 * @param expirationDate - Date to check
 * @returns True if date is in the past
 */
export declare function isExpired(expirationDate: Date): boolean;
/**
 * Generate a unique identifier based on multiple values
 *
 * @param values - Array of values to hash
 * @returns Unique identifier string
 */
export declare function generateUniqueId(...values: any[]): string;
/**
 * Rate limiter helper
 */
export declare class RateLimiter {
    private requests;
    private maxRequests;
    private windowMs;
    /**
     * Create a new rate limiter
     *
     * @param maxRequests - Maximum requests allowed in the window
     * @param windowMs - Time window in milliseconds
     */
    constructor(maxRequests: number, windowMs: number);
    /**
     * Check if a request is allowed
     *
     * @param identifier - Unique identifier (e.g., user ID, IP address)
     * @returns True if request is allowed
     */
    isAllowed(identifier: string): boolean;
    /**
     * Reset rate limit for an identifier
     *
     * @param identifier - Unique identifier to reset
     */
    reset(identifier: string): void;
}
/**
 * Simple in-memory cache
 */
export declare class Cache<T> {
    private store;
    constructor();
    /**
     * Set a value in the cache
     *
     * @param key - Cache key
     * @param value - Value to cache
     * @param ttl - Time to live in milliseconds
     */
    set(key: string, value: T, ttl: number): void;
    /**
     * Get a value from the cache
     *
     * @param key - Cache key
     * @returns Cached value or undefined if not found/expired
     */
    get(key: string): T | undefined;
    /**
     * Delete a value from the cache
     *
     * @param key - Cache key
     */
    delete(key: string): void;
    /**
     * Clear all cached values
     */
    clear(): void;
}
/**
 * Validate and parse duration string (e.g., "1h", "30m", "2d")
 *
 * @param durationStr - Duration string
 * @returns Duration in milliseconds
 */
export declare function parseDuration(durationStr: string): number;
//# sourceMappingURL=utils.d.ts.map