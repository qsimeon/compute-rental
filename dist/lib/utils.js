"use strict";
/**
 * Utility functions for the compute resource sharing platform
 *
 * This module provides helper functions for validation, formatting,
 * security, and common operations used throughout the application.
 *
 * @module lib/utils
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Cache = exports.RateLimiter = void 0;
exports.validateEmail = validateEmail;
exports.validateSSHPublicKey = validateSSHPublicKey;
exports.validateResourceType = validateResourceType;
exports.generateSecureToken = generateSecureToken;
exports.hashPassword = hashPassword;
exports.verifyPassword = verifyPassword;
exports.formatDuration = formatDuration;
exports.formatBytes = formatBytes;
exports.formatCurrency = formatCurrency;
exports.calculatePercentage = calculatePercentage;
exports.sanitizeInput = sanitizeInput;
exports.deepClone = deepClone;
exports.sleep = sleep;
exports.retryWithBackoff = retryWithBackoff;
exports.isExpired = isExpired;
exports.generateUniqueId = generateUniqueId;
exports.parseDuration = parseDuration;
const crypto_1 = __importDefault(require("crypto"));
const types_1 = require("../types");
/**
 * Validate email address format
 *
 * @param email - Email address to validate
 * @returns True if email is valid
 */
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}
/**
 * Validate SSH public key format
 *
 * @param publicKey - SSH public key string
 * @returns True if key appears to be valid
 */
function validateSSHPublicKey(publicKey) {
    const sshKeyRegex = /^(ssh-rsa|ssh-ed25519|ecdsa-sha2-nistp256|ecdsa-sha2-nistp384|ecdsa-sha2-nistp521)\s+[A-Za-z0-9+/]+[=]{0,3}(\s+.*)?$/;
    return sshKeyRegex.test(publicKey.trim());
}
/**
 * Validate resource type
 *
 * @param resourceType - Resource type string to validate
 * @returns True if resource type is valid
 */
function validateResourceType(resourceType) {
    return Object.values(types_1.ResourceType).includes(resourceType);
}
/**
 * Generate a secure random token
 *
 * @param length - Length of token in bytes (default 32)
 * @returns Hex-encoded random token
 */
function generateSecureToken(length = 32) {
    return crypto_1.default.randomBytes(length).toString('hex');
}
/**
 * Hash a password using PBKDF2
 *
 * @param password - Plain text password
 * @param salt - Salt for hashing (generated if not provided)
 * @returns Object containing hash and salt
 */
function hashPassword(password, salt) {
    const actualSalt = salt || crypto_1.default.randomBytes(16).toString('hex');
    const hash = crypto_1.default
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
function verifyPassword(password, hash, salt) {
    const { hash: computedHash } = hashPassword(password, salt);
    return computedHash === hash;
}
/**
 * Format duration in milliseconds to human-readable string
 *
 * @param milliseconds - Duration in milliseconds
 * @returns Formatted duration string (e.g., "2h 30m")
 */
function formatDuration(milliseconds) {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    if (days > 0) {
        return `${days}d ${hours % 24}h`;
    }
    else if (hours > 0) {
        return `${hours}h ${minutes % 60}m`;
    }
    else if (minutes > 0) {
        return `${minutes}m ${seconds % 60}s`;
    }
    else {
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
function formatBytes(bytes, decimals = 2) {
    if (bytes === 0)
        return '0 Bytes';
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
function formatCurrency(amount, currency = 'USD') {
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
function calculatePercentage(value, total) {
    if (total === 0)
        return 0;
    const percentage = (value / total) * 100;
    return Math.max(0, Math.min(100, percentage));
}
/**
 * Sanitize user input to prevent injection attacks
 *
 * @param input - User input string
 * @returns Sanitized string
 */
function sanitizeInput(input) {
    return input
        .replace(/[<>"'&]/g, (char) => {
        const entities = {
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
function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}
/**
 * Sleep for a specified duration
 *
 * @param milliseconds - Duration to sleep
 * @returns Promise that resolves after the duration
 */
function sleep(milliseconds) {
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
async function retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000) {
    let lastError;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        }
        catch (error) {
            lastError = error;
            if (attempt < maxRetries) {
                const delay = baseDelay * Math.pow(2, attempt);
                await sleep(delay);
            }
        }
    }
    throw lastError;
}
/**
 * Check if a date is expired
 *
 * @param expirationDate - Date to check
 * @returns True if date is in the past
 */
function isExpired(expirationDate) {
    return new Date() > expirationDate;
}
/**
 * Generate a unique identifier based on multiple values
 *
 * @param values - Array of values to hash
 * @returns Unique identifier string
 */
function generateUniqueId(...values) {
    const hash = crypto_1.default.createHash('sha256');
    values.forEach((value) => {
        hash.update(JSON.stringify(value));
    });
    return hash.digest('hex').substring(0, 16);
}
/**
 * Rate limiter helper
 */
class RateLimiter {
    requests;
    maxRequests;
    windowMs;
    /**
     * Create a new rate limiter
     *
     * @param maxRequests - Maximum requests allowed in the window
     * @param windowMs - Time window in milliseconds
     */
    constructor(maxRequests, windowMs) {
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
    isAllowed(identifier) {
        const now = Date.now();
        const userRequests = this.requests.get(identifier) || [];
        // Remove old requests outside the window
        const validRequests = userRequests.filter((timestamp) => now - timestamp < this.windowMs);
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
    reset(identifier) {
        this.requests.delete(identifier);
    }
}
exports.RateLimiter = RateLimiter;
/**
 * Simple in-memory cache
 */
class Cache {
    store;
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
    set(key, value, ttl) {
        const expiresAt = Date.now() + ttl;
        this.store.set(key, { value, expiresAt });
    }
    /**
     * Get a value from the cache
     *
     * @param key - Cache key
     * @returns Cached value or undefined if not found/expired
     */
    get(key) {
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
    delete(key) {
        this.store.delete(key);
    }
    /**
     * Clear all cached values
     */
    clear() {
        this.store.clear();
    }
}
exports.Cache = Cache;
/**
 * Validate and parse duration string (e.g., "1h", "30m", "2d")
 *
 * @param durationStr - Duration string
 * @returns Duration in milliseconds
 */
function parseDuration(durationStr) {
    const regex = /^(\d+)([smhd])$/;
    const match = durationStr.match(regex);
    if (!match) {
        throw new Error(`Invalid duration format: ${durationStr}`);
    }
    const value = parseInt(match[1], 10);
    const unit = match[2];
    const multipliers = {
        s: 1000,
        m: 60 * 1000,
        h: 60 * 60 * 1000,
        d: 24 * 60 * 60 * 1000,
    };
    return value * multipliers[unit];
}
//# sourceMappingURL=utils.js.map