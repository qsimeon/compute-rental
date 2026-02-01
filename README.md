# ComputeShare - Institutional Resource Sharing Platform

> Securely rent out unused institutional compute resources and subscriptions with automated ephemeral SSH access

ComputeShare is a TypeScript library that enables institutions to maximize their compute infrastructure utilization by allowing users to securely rent out their unused cluster access, ChatGPT subscriptions, and other computational resources. The platform automates secure credential sharing through ephemeral SSH key generation and encrypted access grants, ensuring security and auditability.

## ✨ Features

- **Subscription Management** — Register and track compute resources including HPC clusters, GPU nodes, and API subscriptions. Monitor available capacity and usage in real-time.
- **Ephemeral SSH Access** — Secure, time-limited SSH key pairs generated on-demand. Keys automatically expire after the rental period - no permanent key sharing required.
- **Encrypted Credentials** — AES-256-GCM encryption for all credential storage and transmission. Secure access grants that can be safely stored and transmitted.
- **Dynamic Pricing** — Demand-based pricing engine that adjusts rates based on available capacity. Higher demand = higher prices automatically.
- **Access Grants** — Time-limited access tokens that can be validated and revoked at any time. Complete audit trail of who accessed what and when.
- **Input Validation** — Built-in validation for emails, SSH keys, and resource types to prevent security issues.

## 📦 Installation

### Prerequisites

- Node.js 18.0+
- TypeScript 5.0+

### Setup

```bash
# Clone the repository
git clone https://github.com/your-org/computeshare.git && cd computeshare

# Install dependencies
npm install

# Run the demo
npm run dev

# Or build and run
npm run build
npm start
```

## 🚀 Usage

### Register a Compute Resource

Register your institutional cluster or GPU node to make it available for rental:

```typescript
import { SubscriptionManager } from './lib/core';
import { ResourceType } from './types';

const manager = new SubscriptionManager();

// Register a compute cluster with 100 hours capacity, 10 already used
const subscription = manager.registerSubscription(
  'user-professor123',      // owner ID
  ResourceType.SSH_CLUSTER, // resource type
  100,                      // total usage limit
  10                        // current usage
);

console.log(`Subscription ID: ${subscription.id}`);
console.log(`Status: ${subscription.status}`);
console.log(`Available capacity: ${manager.getAvailableCapacity(subscription.id)}%`);
```

**Output:**

```
Subscription ID: a1b2c3d4-e5f6-7890-abcd-ef1234567890
Status: active
Available capacity: 90%
```

### Find Available Resources

Search for available subscriptions that match your needs:

```typescript
import { SubscriptionManager } from './lib/core';
import { ResourceType } from './types';

const manager = new SubscriptionManager();

// Find SSH clusters with at least 50% capacity available
const available = manager.findAvailableSubscriptions(
  ResourceType.SSH_CLUSTER,
  50 // minimum capacity percentage
);

console.log(`Found ${available.length} available cluster(s)`);
for (const sub of available) {
  console.log(`  - ${sub.id}: ${manager.getAvailableCapacity(sub.id)}% available`);
}
```

### Generate Ephemeral SSH Credentials

Create time-limited SSH key pairs for secure access:

```typescript
import { SSHKeyManager } from './lib/core';
import { parseDuration } from './lib/utils';

const sshManager = new SSHKeyManager();

// Generate a key pair valid for 4 hours
const duration = parseDuration('4h'); // 4 hours in milliseconds
const keyPair = await sshManager.generateTemporaryKeyPair(duration);

console.log(`Fingerprint: ${keyPair.fingerprint}`);
console.log(`Expires at: ${keyPair.expiresAt}`);
console.log(`Private key: ${keyPair.privateKey.substring(0, 50)}...`);
```

**Output:**

```
Fingerprint: a1b2c3d4e5f6789012345678901234567890abcdef...
Expires at: 2024-01-15T18:30:00.000Z
Private key: -----BEGIN PRIVATE KEY-----
MIIJQgIBADANBgkqh...
```

### Create Secure Access Grants

Encrypt credentials and create time-limited access grants:

```typescript
import { AccessGrantManager } from './lib/core';
import { parseDuration } from './lib/utils';

const grantManager = new AccessGrantManager();

// Encrypt sensitive credentials
const credentials = {
  host: 'cluster.university.edu',
  port: 22,
  username: 'rental-user',
  privateKey: '-----BEGIN PRIVATE KEY-----...'
};
const encrypted = grantManager.encryptCredentials(credentials);

// Create a 4-hour access grant
const grant = grantManager.createGrant(
  'subscription-id-123', // subscription being accessed
  'user-renter456',      // renter's user ID
  parseDuration('4h'),   // duration
  encrypted              // encrypted credentials
);

console.log(`Grant ID: ${grant.id}`);
console.log(`Active: ${grant.isActive}`);
console.log(`Expires: ${grant.expiresAt}`);
```

**Output:**

```
Grant ID: b2c3d4e5-f6a7-8901-bcde-f23456789012
Active: true
Expires: 2024-01-15T18:30:00.000Z
```

### Calculate Dynamic Pricing

Use demand-based pricing for fair resource allocation:

```typescript
import { PricingEngine, SubscriptionManager } from './lib/core';
import { ResourceType } from './types';
import { formatCurrency } from './lib/utils';

const pricing = new PricingEngine();
const manager = new SubscriptionManager();

// Get available capacity
const capacity = manager.getAvailableCapacity('subscription-id');

// Calculate price based on demand
const demandMultiplier = pricing.calculateDemandMultiplier(capacity);
const price = pricing.calculatePrice(
  ResourceType.GPU_COMPUTE,
  8,              // 8 hours of usage
  demandMultiplier
);

console.log(`Capacity: ${capacity}%`);
console.log(`Demand multiplier: ${demandMultiplier}x`);
console.log(`Price for 8 hours: ${formatCurrency(price)}`);
```

**Output:**

```
Capacity: 35%
Demand multiplier: 1.5x
Price for 8 hours: $6.00
```

### Validate and Revoke Access

Validate grants and revoke access when needed:

```typescript
import { AccessGrantManager } from './lib/core';

const grantManager = new AccessGrantManager();

// Check if a grant is still valid
const isValid = grantManager.validateGrant('grant-id-123');
console.log(`Grant valid: ${isValid}`);

// Revoke access immediately
grantManager.revokeGrant('grant-id-123');
console.log('Access revoked');

// Grant is no longer valid
const stillValid = grantManager.validateGrant('grant-id-123');
console.log(`Grant still valid: ${stillValid}`); // false
```

## 🏗️ Architecture

ComputeShare follows a modular architecture with clear separation between subscription management, access control, SSH key generation, and pricing.

### File Structure

```
computeshare/
├── lib/
│   ├── core.ts      # Core managers: Subscription, AccessGrant, SSHKey, Pricing
│   └── utils.ts     # Utilities: validation, formatting, security helpers
├── types.ts         # TypeScript type definitions
├── demo.ts          # Interactive demonstration script
├── package.json     # Dependencies and scripts
├── tsconfig.json    # TypeScript configuration
└── README.md        # This file
```

### Core Components

- **SubscriptionManager** — Manages compute resource subscriptions, tracks capacity and usage, finds available resources
- **AccessGrantManager** — Creates/validates/revokes access grants, encrypts/decrypts credentials using AES-256-GCM
- **SSHKeyManager** — Generates ephemeral RSA key pairs with expiration, creates proxy configurations
- **PricingEngine** — Calculates prices based on resource type and demand, supports dynamic pricing multipliers

### Resource Types

```typescript
enum ResourceType {
  SSH_CLUSTER = 'ssh_cluster',   // HPC clusters with SSH access
  CHATGPT_API = 'chatgpt_api',   // ChatGPT/OpenAI API access
  GPU_COMPUTE = 'gpu_compute',   // GPU compute nodes
  CLOUD_CREDITS = 'cloud_credits' // Cloud provider credits
}
```

## 🔧 Technical Details

### Dependencies

- **typescript** (^5.3.0) — Type-safe language for robust, maintainable code
- **ts-node** (^10.9.2) — Run TypeScript directly without compilation
- **@types/node** (^20.10.0) — Node.js type definitions

### Security Features

- **AES-256-GCM encryption** — All credentials encrypted with authenticated encryption
- **Ephemeral RSA keys** — 4096-bit RSA keys generated on-demand with automatic expiration
- **PBKDF2 password hashing** — 100,000 iterations with SHA-512 for password storage
- **Secure random tokens** — Cryptographically secure random number generation

### Utility Functions

```typescript
// Validation
validateEmail(email: string): boolean
validateSSHPublicKey(key: string): boolean
validateResourceType(type: string): boolean

// Formatting
formatDuration(ms: number): string      // "2h 30m"
formatBytes(bytes: number): string      // "1.5 GB"
formatCurrency(amount: number): string  // "$1.50"

// Security
generateSecureToken(length?: number): string
hashPassword(password: string, salt?: string): { hash, salt }
verifyPassword(password: string, hash: string, salt: string): boolean

// Duration parsing
parseDuration(str: string): number  // "4h" → 14400000ms
```

## ❓ Troubleshooting

### TypeScript compilation errors

**Cause:** Missing dependencies or incorrect TypeScript version

**Solution:** Run `npm install` to ensure all dependencies are installed. Verify you have TypeScript 5.0+.

### "Cannot find module './lib/core'"

**Cause:** Running compiled JavaScript without building first

**Solution:** Run `npm run build` to compile TypeScript, then `npm start`. Or use `npm run dev` to run directly with ts-node.

### SSH key generation hangs

**Cause:** 4096-bit RSA key generation is computationally intensive

**Solution:** This is normal - key generation takes 1-5 seconds depending on system. For faster development, you can temporarily reduce key size in `SSHKeyManager`.

### Grant validation returns false unexpectedly

**Cause:** Grant may have expired or been revoked

**Solution:** Check `grant.expiresAt` to verify the grant hasn't expired. Use `getActiveGrants(subscriptionId)` to see all valid grants for a subscription.

---

This project was generated as a proof-of-concept for institutional resource sharing. Before deploying in production, conduct thorough security audits and add proper database storage, OAuth2 authentication, and an SSH Certificate Authority for true ephemeral certificate signing.
