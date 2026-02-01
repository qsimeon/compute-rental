"use strict";
/**
 * Core library module for compute resource sharing platform
 *
 * This module provides the core functionality for managing compute resource
 * subscriptions, access delegation, and secure credential handling.
 *
 * @module lib/core
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PricingEngine = exports.SSHKeyManager = exports.AccessGrantManager = exports.SubscriptionManager = void 0;
const crypto_1 = __importDefault(require("crypto"));
const types_1 = require("../types");
/**
 * Manages compute resource subscriptions and their availability
 */
class SubscriptionManager {
    subscriptions;
    activeGrants;
    constructor() {
        this.subscriptions = new Map();
        this.activeGrants = new Map();
    }
    /**
     * Register a new subscription for sharing
     *
     * @param userId - The owner's user ID
     * @param resourceType - Type of compute resource (SSH, API, etc.)
     * @param usageLimit - Maximum usage allowed per billing period
     * @param currentUsage - Current usage amount
     * @returns The created subscription object
     */
    registerSubscription(userId, resourceType, usageLimit, currentUsage = 0) {
        const subscriptionId = crypto_1.default.randomUUID();
        const subscription = {
            id: subscriptionId,
            ownerId: userId,
            resourceType,
            usageLimit,
            currentUsage,
            availableCapacity: usageLimit - currentUsage,
            status: types_1.SubscriptionStatus.ACTIVE,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        this.subscriptions.set(subscriptionId, subscription);
        return subscription;
    }
    /**
     * Get available capacity for a subscription
     *
     * @param subscriptionId - The subscription ID to check
     * @returns Available capacity percentage (0-100)
     */
    getAvailableCapacity(subscriptionId) {
        const subscription = this.subscriptions.get(subscriptionId);
        if (!subscription) {
            throw new Error(`Subscription ${subscriptionId} not found`);
        }
        const capacity = ((subscription.usageLimit - subscription.currentUsage) / subscription.usageLimit) * 100;
        return Math.max(0, Math.min(100, capacity));
    }
    /**
     * Update subscription usage
     *
     * @param subscriptionId - The subscription to update
     * @param usageAmount - Amount of usage to add
     */
    updateUsage(subscriptionId, usageAmount) {
        const subscription = this.subscriptions.get(subscriptionId);
        if (!subscription) {
            throw new Error(`Subscription ${subscriptionId} not found`);
        }
        subscription.currentUsage += usageAmount;
        subscription.availableCapacity = subscription.usageLimit - subscription.currentUsage;
        subscription.updatedAt = new Date();
        if (subscription.currentUsage >= subscription.usageLimit) {
            subscription.status = types_1.SubscriptionStatus.EXHAUSTED;
        }
    }
    /**
     * Find available subscriptions matching criteria
     *
     * @param resourceType - Type of resource needed
     * @param minCapacity - Minimum available capacity required
     * @returns Array of matching subscriptions
     */
    findAvailableSubscriptions(resourceType, minCapacity = 10) {
        return Array.from(this.subscriptions.values()).filter((sub) => sub.resourceType === resourceType &&
            sub.status === types_1.SubscriptionStatus.ACTIVE &&
            this.getAvailableCapacity(sub.id) >= minCapacity);
    }
}
exports.SubscriptionManager = SubscriptionManager;
/**
 * Manages secure access grants for delegated resource usage
 */
class AccessGrantManager {
    grants;
    encryptionKey;
    constructor(encryptionKey) {
        this.grants = new Map();
        // Use provided key or generate a new one
        this.encryptionKey = encryptionKey
            ? Buffer.from(encryptionKey, 'hex')
            : crypto_1.default.randomBytes(32);
    }
    /**
     * Create a new access grant for a renter
     *
     * @param subscriptionId - The subscription being shared
     * @param renterId - The user renting the resource
     * @param duration - Grant duration in milliseconds
     * @param encryptedCredentials - Encrypted credentials for access
     * @returns The created access grant
     */
    createGrant(subscriptionId, renterId, duration, encryptedCredentials) {
        const grantId = crypto_1.default.randomUUID();
        const now = new Date();
        const expiresAt = new Date(now.getTime() + duration);
        const grant = {
            id: grantId,
            subscriptionId,
            renterId,
            encryptedCredentials,
            createdAt: now,
            expiresAt,
            isActive: true,
            usageTracking: {
                startTime: now,
                endTime: null,
                totalUsage: 0,
            },
        };
        this.grants.set(grantId, grant);
        return grant;
    }
    /**
     * Validate if an access grant is still valid
     *
     * @param grantId - The grant ID to validate
     * @returns True if grant is valid and active
     */
    validateGrant(grantId) {
        const grant = this.grants.get(grantId);
        if (!grant) {
            return false;
        }
        const now = new Date();
        return grant.isActive && grant.expiresAt > now;
    }
    /**
     * Revoke an access grant
     *
     * @param grantId - The grant to revoke
     */
    revokeGrant(grantId) {
        const grant = this.grants.get(grantId);
        if (grant) {
            grant.isActive = false;
            grant.usageTracking.endTime = new Date();
        }
    }
    /**
     * Get active grants for a subscription
     *
     * @param subscriptionId - The subscription ID
     * @returns Array of active grants
     */
    getActiveGrants(subscriptionId) {
        return Array.from(this.grants.values()).filter((grant) => grant.subscriptionId === subscriptionId && this.validateGrant(grant.id));
    }
    /**
     * Encrypt sensitive credentials using AES-256-GCM
     *
     * @param credentials - Plain text credentials object
     * @returns Encrypted credentials string
     */
    encryptCredentials(credentials) {
        const iv = crypto_1.default.randomBytes(16);
        const cipher = crypto_1.default.createCipheriv('aes-256-gcm', this.encryptionKey, iv);
        const credentialsJson = JSON.stringify(credentials);
        let encrypted = cipher.update(credentialsJson, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        const authTag = cipher.getAuthTag();
        // Combine IV, auth tag, and encrypted data
        return JSON.stringify({
            iv: iv.toString('hex'),
            authTag: authTag.toString('hex'),
            encrypted,
        });
    }
    /**
     * Decrypt credentials
     *
     * @param encryptedData - Encrypted credentials string
     * @returns Decrypted credentials object
     */
    decryptCredentials(encryptedData) {
        const { iv, authTag, encrypted } = JSON.parse(encryptedData);
        const decipher = crypto_1.default.createDecipheriv('aes-256-gcm', this.encryptionKey, Buffer.from(iv, 'hex'));
        decipher.setAuthTag(Buffer.from(authTag, 'hex'));
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return JSON.parse(decrypted);
    }
}
exports.AccessGrantManager = AccessGrantManager;
/**
 * Manages SSH key delegation with time-limited access
 */
class SSHKeyManager {
    /**
     * Generate a temporary SSH key pair for delegated access
     *
     * @param duration - How long the key should be valid (in milliseconds)
     * @returns Object containing public and private keys with metadata
     */
    async generateTemporaryKeyPair(duration) {
        return new Promise((resolve, reject) => {
            crypto_1.default.generateKeyPair('rsa', {
                modulusLength: 4096,
                publicKeyEncoding: {
                    type: 'spki',
                    format: 'pem',
                },
                privateKeyEncoding: {
                    type: 'pkcs8',
                    format: 'pem',
                },
            }, (err, publicKey, privateKey) => {
                if (err) {
                    reject(err);
                    return;
                }
                const fingerprint = this._generateFingerprint(publicKey);
                const expiresAt = new Date(Date.now() + duration);
                resolve({
                    publicKey,
                    privateKey,
                    expiresAt,
                    fingerprint,
                });
            });
        });
    }
    /**
     * Create an SSH proxy configuration for secure access delegation
     *
     * @param targetHost - The host to connect to
     * @param targetPort - SSH port
     * @param temporaryKey - The temporary private key
     * @returns SSH configuration object
     */
    createProxyConfig(targetHost, targetPort, temporaryKey) {
        return {
            host: targetHost,
            port: targetPort,
            privateKey: temporaryKey,
            strictHostKeyChecking: false,
            keepaliveInterval: 30000,
            readyTimeout: 20000,
        };
    }
    /**
     * Generate SSH key fingerprint
     *
     * @param publicKey - The public key in PEM format
     * @returns SHA256 fingerprint
     */
    _generateFingerprint(publicKey) {
        const hash = crypto_1.default.createHash('sha256');
        hash.update(publicKey);
        return hash.digest('hex');
    }
}
exports.SSHKeyManager = SSHKeyManager;
/**
 * Manages pricing and billing for resource rentals
 */
class PricingEngine {
    basePrices;
    constructor() {
        this.basePrices = new Map([
            [types_1.ResourceType.SSH_CLUSTER, 0.05], // per hour
            [types_1.ResourceType.CHATGPT_API, 0.02], // per 1k tokens
            [types_1.ResourceType.GPU_COMPUTE, 0.50], // per hour
            [types_1.ResourceType.CLOUD_CREDITS, 0.80], // per dollar of credits
        ]);
    }
    /**
     * Calculate rental price based on resource type and usage
     *
     * @param resourceType - Type of resource
     * @param usage - Amount of usage (hours, tokens, etc.)
     * @param demandMultiplier - Dynamic pricing multiplier based on demand
     * @returns Price in dollars
     */
    calculatePrice(resourceType, usage, demandMultiplier = 1.0) {
        const basePrice = this.basePrices.get(resourceType) || 0.10;
        return basePrice * usage * demandMultiplier;
    }
    /**
     * Calculate demand multiplier based on available capacity
     *
     * @param availableCapacity - Percentage of available capacity (0-100)
     * @returns Multiplier (higher when capacity is low)
     */
    calculateDemandMultiplier(availableCapacity) {
        if (availableCapacity > 70)
            return 1.0;
        if (availableCapacity > 50)
            return 1.2;
        if (availableCapacity > 30)
            return 1.5;
        if (availableCapacity > 10)
            return 2.0;
        return 3.0;
    }
    /**
     * Set custom pricing for a resource type
     *
     * @param resourceType - The resource type
     * @param price - New base price
     */
    setBasePrice(resourceType, price) {
        this.basePrices.set(resourceType, price);
    }
}
exports.PricingEngine = PricingEngine;
//# sourceMappingURL=core.js.map