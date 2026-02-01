/**
 * Core library module for compute resource sharing platform
 * 
 * This module provides the core functionality for managing compute resource
 * subscriptions, access delegation, and secure credential handling.
 * 
 * @module lib/core
 */

import crypto from 'crypto';
import { ResourceType, SubscriptionStatus, AccessGrant, Subscription, User } from '../types';

/**
 * Manages compute resource subscriptions and their availability
 */
export class SubscriptionManager {
  private subscriptions: Map<string, Subscription>;
  private activeGrants: Map<string, AccessGrant>;

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
  registerSubscription(
    userId: string,
    resourceType: ResourceType,
    usageLimit: number,
    currentUsage: number = 0
  ): Subscription {
    const subscriptionId = crypto.randomUUID();
    const subscription: Subscription = {
      id: subscriptionId,
      ownerId: userId,
      resourceType,
      usageLimit,
      currentUsage,
      availableCapacity: usageLimit - currentUsage,
      status: SubscriptionStatus.ACTIVE,
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
  getAvailableCapacity(subscriptionId: string): number {
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
  updateUsage(subscriptionId: string, usageAmount: number): void {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) {
      throw new Error(`Subscription ${subscriptionId} not found`);
    }

    subscription.currentUsage += usageAmount;
    subscription.availableCapacity = subscription.usageLimit - subscription.currentUsage;
    subscription.updatedAt = new Date();

    if (subscription.currentUsage >= subscription.usageLimit) {
      subscription.status = SubscriptionStatus.EXHAUSTED;
    }
  }

  /**
   * Find available subscriptions matching criteria
   * 
   * @param resourceType - Type of resource needed
   * @param minCapacity - Minimum available capacity required
   * @returns Array of matching subscriptions
   */
  findAvailableSubscriptions(resourceType: ResourceType, minCapacity: number = 10): Subscription[] {
    return Array.from(this.subscriptions.values()).filter(
      (sub) =>
        sub.resourceType === resourceType &&
        sub.status === SubscriptionStatus.ACTIVE &&
        this.getAvailableCapacity(sub.id) >= minCapacity
    );
  }
}

/**
 * Manages secure access grants for delegated resource usage
 */
export class AccessGrantManager {
  private grants: Map<string, AccessGrant>;
  private encryptionKey: Buffer;

  constructor(encryptionKey?: string) {
    this.grants = new Map();
    // Use provided key or generate a new one
    this.encryptionKey = encryptionKey
      ? Buffer.from(encryptionKey, 'hex')
      : crypto.randomBytes(32);
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
  createGrant(
    subscriptionId: string,
    renterId: string,
    duration: number,
    encryptedCredentials: string
  ): AccessGrant {
    const grantId = crypto.randomUUID();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + duration);

    const grant: AccessGrant = {
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
  validateGrant(grantId: string): boolean {
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
  revokeGrant(grantId: string): void {
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
  getActiveGrants(subscriptionId: string): AccessGrant[] {
    return Array.from(this.grants.values()).filter(
      (grant) => grant.subscriptionId === subscriptionId && this.validateGrant(grant.id)
    );
  }

  /**
   * Encrypt sensitive credentials using AES-256-GCM
   * 
   * @param credentials - Plain text credentials object
   * @returns Encrypted credentials string
   */
  encryptCredentials(credentials: Record<string, any>): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', this.encryptionKey, iv);
    
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
  decryptCredentials(encryptedData: string): Record<string, any> {
    const { iv, authTag, encrypted } = JSON.parse(encryptedData);
    
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      this.encryptionKey,
      Buffer.from(iv, 'hex')
    );
    
    decipher.setAuthTag(Buffer.from(authTag, 'hex'));
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return JSON.parse(decrypted);
  }
}

/**
 * Manages SSH key delegation with time-limited access
 */
export class SSHKeyManager {
  /**
   * Generate a temporary SSH key pair for delegated access
   * 
   * @param duration - How long the key should be valid (in milliseconds)
   * @returns Object containing public and private keys with metadata
   */
  async generateTemporaryKeyPair(duration: number): Promise<{
    publicKey: string;
    privateKey: string;
    expiresAt: Date;
    fingerprint: string;
  }> {
    return new Promise((resolve, reject) => {
      crypto.generateKeyPair(
        'rsa',
        {
          modulusLength: 4096,
          publicKeyEncoding: {
            type: 'spki',
            format: 'pem',
          },
          privateKeyEncoding: {
            type: 'pkcs8',
            format: 'pem',
          },
        },
        (err, publicKey, privateKey) => {
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
        }
      );
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
  createProxyConfig(
    targetHost: string,
    targetPort: number,
    temporaryKey: string
  ): Record<string, any> {
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
  private _generateFingerprint(publicKey: string): string {
    const hash = crypto.createHash('sha256');
    hash.update(publicKey);
    return hash.digest('hex');
  }
}

/**
 * Manages pricing and billing for resource rentals
 */
export class PricingEngine {
  private basePrices: Map<ResourceType, number>;

  constructor() {
    this.basePrices = new Map([
      [ResourceType.SSH_CLUSTER, 0.05], // per hour
      [ResourceType.CHATGPT_API, 0.02], // per 1k tokens
      [ResourceType.GPU_COMPUTE, 0.50], // per hour
      [ResourceType.CLOUD_CREDITS, 0.80], // per dollar of credits
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
  calculatePrice(
    resourceType: ResourceType,
    usage: number,
    demandMultiplier: number = 1.0
  ): number {
    const basePrice = this.basePrices.get(resourceType) || 0.10;
    return basePrice * usage * demandMultiplier;
  }

  /**
   * Calculate demand multiplier based on available capacity
   * 
   * @param availableCapacity - Percentage of available capacity (0-100)
   * @returns Multiplier (higher when capacity is low)
   */
  calculateDemandMultiplier(availableCapacity: number): number {
    if (availableCapacity > 70) return 1.0;
    if (availableCapacity > 50) return 1.2;
    if (availableCapacity > 30) return 1.5;
    if (availableCapacity > 10) return 2.0;
    return 3.0;
  }

  /**
   * Set custom pricing for a resource type
   * 
   * @param resourceType - The resource type
   * @param price - New base price
   */
  setBasePrice(resourceType: ResourceType, price: number): void {
    this.basePrices.set(resourceType, price);
  }
}
