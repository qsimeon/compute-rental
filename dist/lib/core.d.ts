/**
 * Core library module for compute resource sharing platform
 *
 * This module provides the core functionality for managing compute resource
 * subscriptions, access delegation, and secure credential handling.
 *
 * @module lib/core
 */
import { ResourceType, AccessGrant, Subscription } from '../types';
/**
 * Manages compute resource subscriptions and their availability
 */
export declare class SubscriptionManager {
    private subscriptions;
    private activeGrants;
    constructor();
    /**
     * Register a new subscription for sharing
     *
     * @param userId - The owner's user ID
     * @param resourceType - Type of compute resource (SSH, API, etc.)
     * @param usageLimit - Maximum usage allowed per billing period
     * @param currentUsage - Current usage amount
     * @returns The created subscription object
     */
    registerSubscription(userId: string, resourceType: ResourceType, usageLimit: number, currentUsage?: number): Subscription;
    /**
     * Get available capacity for a subscription
     *
     * @param subscriptionId - The subscription ID to check
     * @returns Available capacity percentage (0-100)
     */
    getAvailableCapacity(subscriptionId: string): number;
    /**
     * Update subscription usage
     *
     * @param subscriptionId - The subscription to update
     * @param usageAmount - Amount of usage to add
     */
    updateUsage(subscriptionId: string, usageAmount: number): void;
    /**
     * Find available subscriptions matching criteria
     *
     * @param resourceType - Type of resource needed
     * @param minCapacity - Minimum available capacity required
     * @returns Array of matching subscriptions
     */
    findAvailableSubscriptions(resourceType: ResourceType, minCapacity?: number): Subscription[];
}
/**
 * Manages secure access grants for delegated resource usage
 */
export declare class AccessGrantManager {
    private grants;
    private encryptionKey;
    constructor(encryptionKey?: string);
    /**
     * Create a new access grant for a renter
     *
     * @param subscriptionId - The subscription being shared
     * @param renterId - The user renting the resource
     * @param duration - Grant duration in milliseconds
     * @param encryptedCredentials - Encrypted credentials for access
     * @returns The created access grant
     */
    createGrant(subscriptionId: string, renterId: string, duration: number, encryptedCredentials: string): AccessGrant;
    /**
     * Validate if an access grant is still valid
     *
     * @param grantId - The grant ID to validate
     * @returns True if grant is valid and active
     */
    validateGrant(grantId: string): boolean;
    /**
     * Revoke an access grant
     *
     * @param grantId - The grant to revoke
     */
    revokeGrant(grantId: string): void;
    /**
     * Get active grants for a subscription
     *
     * @param subscriptionId - The subscription ID
     * @returns Array of active grants
     */
    getActiveGrants(subscriptionId: string): AccessGrant[];
    /**
     * Encrypt sensitive credentials using AES-256-GCM
     *
     * @param credentials - Plain text credentials object
     * @returns Encrypted credentials string
     */
    encryptCredentials(credentials: Record<string, any>): string;
    /**
     * Decrypt credentials
     *
     * @param encryptedData - Encrypted credentials string
     * @returns Decrypted credentials object
     */
    decryptCredentials(encryptedData: string): Record<string, any>;
}
/**
 * Manages SSH key delegation with time-limited access
 */
export declare class SSHKeyManager {
    /**
     * Generate a temporary SSH key pair for delegated access
     *
     * @param duration - How long the key should be valid (in milliseconds)
     * @returns Object containing public and private keys with metadata
     */
    generateTemporaryKeyPair(duration: number): Promise<{
        publicKey: string;
        privateKey: string;
        expiresAt: Date;
        fingerprint: string;
    }>;
    /**
     * Create an SSH proxy configuration for secure access delegation
     *
     * @param targetHost - The host to connect to
     * @param targetPort - SSH port
     * @param temporaryKey - The temporary private key
     * @returns SSH configuration object
     */
    createProxyConfig(targetHost: string, targetPort: number, temporaryKey: string): Record<string, any>;
    /**
     * Generate SSH key fingerprint
     *
     * @param publicKey - The public key in PEM format
     * @returns SHA256 fingerprint
     */
    private _generateFingerprint;
}
/**
 * Manages pricing and billing for resource rentals
 */
export declare class PricingEngine {
    private basePrices;
    constructor();
    /**
     * Calculate rental price based on resource type and usage
     *
     * @param resourceType - Type of resource
     * @param usage - Amount of usage (hours, tokens, etc.)
     * @param demandMultiplier - Dynamic pricing multiplier based on demand
     * @returns Price in dollars
     */
    calculatePrice(resourceType: ResourceType, usage: number, demandMultiplier?: number): number;
    /**
     * Calculate demand multiplier based on available capacity
     *
     * @param availableCapacity - Percentage of available capacity (0-100)
     * @returns Multiplier (higher when capacity is low)
     */
    calculateDemandMultiplier(availableCapacity: number): number;
    /**
     * Set custom pricing for a resource type
     *
     * @param resourceType - The resource type
     * @param price - New base price
     */
    setBasePrice(resourceType: ResourceType, price: number): void;
}
//# sourceMappingURL=core.d.ts.map