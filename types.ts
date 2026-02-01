/**
 * Type definitions for the compute resource sharing platform
 * 
 * @module types
 */

/**
 * Supported resource types
 */
export enum ResourceType {
  SSH_CLUSTER = 'ssh_cluster',
  CHATGPT_API = 'chatgpt_api',
  GPU_COMPUTE = 'gpu_compute',
  CLOUD_CREDITS = 'cloud_credits',
}

/**
 * Subscription status
 */
export enum SubscriptionStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  EXHAUSTED = 'exhausted',
  EXPIRED = 'expired',
}

/**
 * User interface
 */
export interface User {
  id: string;
  email: string;
  institutionId?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Subscription interface
 */
export interface Subscription {
  id: string;
  ownerId: string;
  resourceType: ResourceType;
  usageLimit: number;
  currentUsage: number;
  availableCapacity: number;
  status: SubscriptionStatus;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Access grant interface
 */
export interface AccessGrant {
  id: string;
  subscriptionId: string;
  renterId: string;
  encryptedCredentials: string;
  createdAt: Date;
  expiresAt: Date;
  isActive: boolean;
  usageTracking: {
    startTime: Date;
    endTime: Date | null;
    totalUsage: number;
  };
}
