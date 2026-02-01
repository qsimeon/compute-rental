# ComputeShare - Institutional Resource Sharing Platform

> Securely rent out unused institutional compute resources and subscriptions with automated ephemeral SSH access

ComputeShare is a web application that enables institutions to maximize their compute infrastructure utilization by allowing users to securely rent out their unused cluster access, ChatGPT subscriptions, and other computational resources. The platform automates secure credential sharing through SSH Certificate Authority and time-limited access tokens, ensuring compliance and auditability while eliminating manual intervention.

## ✨ Features

- **Automated Resource Marketplace** — Browse and rent available compute resources including HPC clusters, GPU nodes, and API subscriptions. Resources are automatically listed when idle and removed when in use by the owner.
- **Ephemeral SSH Access** — Secure, time-limited SSH access using Certificate Authority (CA) signed certificates. No permanent key sharing required - credentials automatically expire after the rental period.
- **OAuth2/OIDC Authentication** — Enterprise-grade authentication with institutional SSO support. Users authenticate once and receive role-based access to resources based on their permissions.
- **Real-time Resource Monitoring** — Track resource utilization, active rentals, and usage statistics in real-time. Owners can see who's using their resources and renters can monitor their consumption.
- **Audit Trail & Compliance** — Complete audit logging of all access events, credential issuance, and resource usage. Meets institutional compliance requirements with detailed reporting capabilities.
- **Automated Billing & Credits** — Internal credit system for tracking resource usage. Automatic billing based on compute time, with configurable pricing models per resource type.

## 📦 Installation

### Prerequisites

- Node.js 18.0+
- TypeScript 5.0+
- PostgreSQL 14+ or compatible database
- SSH Certificate Authority setup (or OpenSSH 7.2+)
- OAuth2/OIDC provider (e.g., Keycloak, Auth0, or institutional SSO)

### Setup

1. git clone https://github.com/your-org/computeshare.git && cd computeshare
   - Clone the repository and navigate to the project directory
2. npm install
   - Install all required dependencies including TypeScript, Express, and security libraries
3. cp .env.example .env
   - Create environment configuration file for secrets and settings
4. Edit .env file with your database URL, OAuth2 credentials, and SSH CA paths
   - Configure database connection, authentication provider, and SSH certificate authority settings
5. npm run db:migrate
   - Run database migrations to create tables for users, resources, reservations, and audit logs
6. npm run setup:ssh-ca
   - Initialize SSH Certificate Authority or configure existing CA integration
7. npm run build
   - Compile TypeScript to JavaScript for production
8. npm run dev
   - Start the development server on http://localhost:3000

## 🚀 Usage

### Register a Compute Resource

Register your institutional cluster or GPU node to make it available for rental when idle

```
import { ResourceManager } from './lib/core';
import { ResourceType } from './types';

const manager = new ResourceManager();

// Register a compute cluster
const resource = await manager.registerResource({
  name: 'HPC Cluster Node 42',
  type: ResourceType.SSH_CLUSTER,
  sshHost: 'cluster.university.edu',
  sshPort: 22,
  maxConcurrentUsers: 3,
  pricePerHour: 10, // internal credits
  metadata: {
    cpuCores: 64,
    ramGB: 256,
    gpus: 4
  }
});

console.log(`Resource registered: ${resource.id}`);
console.log(`Status: ${resource.status}`);
console.log(`Available for rental: ${resource.isAvailable}`);

```

**Output:**

```
Resource registered: res_abc123xyz
Status: available
Available for rental: true
```

### Request Access to a Resource

Browse available resources and request time-limited access with automatic SSH credential provisioning

```
import { AccessManager } from './lib/core';
import { Duration } from './lib/utils';

const accessMgr = new AccessManager();

// Request 4-hour access to a cluster
const reservation = await accessMgr.requestAccess({
  resourceId: 'res_abc123xyz',
  userId: 'user_student123',
  duration: Duration.hours(4),
  purpose: 'Machine learning model training'
});

// Get ephemeral SSH credentials
const credentials = await accessMgr.getCredentials(reservation.id);

console.log('Access granted!');
console.log(`SSH Command: ssh -i ${credentials.privateKeyPath} ${credentials.username}@${credentials.host}`);
console.log(`Valid until: ${credentials.expiresAt}`);
console.log(`Certificate fingerprint: ${credentials.certFingerprint}`);

```

**Output:**

```
Access granted!
SSH Command: ssh -i /tmp/ephemeral_key_xyz ${credentials.username}@cluster.university.edu
Valid until: 2024-01-15T18:30:00Z
Certificate fingerprint: SHA256:abc123def456...
```

### Monitor Active Rentals

View all active rentals for your resources with real-time usage statistics

```
import { ResourceManager, AuditLogger } from './lib/core';

const manager = new ResourceManager();
const logger = new AuditLogger();

// Get active rentals for your resources
const myResources = await manager.getResourcesByOwner('user_professor456');

for (const resource of myResources) {
  const activeRentals = await manager.getActiveRentals(resource.id);
  
  console.log(`\nResource: ${resource.name}`);
  console.log(`Active rentals: ${activeRentals.length}`);
  
  for (const rental of activeRentals) {
    const usage = await logger.getUsageStats(rental.id);
    console.log(`  - User: ${rental.userId}`);
    console.log(`    Time remaining: ${rental.timeRemaining}`);
    console.log(`    CPU usage: ${usage.cpuPercent}%`);
  }
}

```

**Output:**

```

Resource: HPC Cluster Node 42
Active rentals: 2
  - User: user_student123
    Time remaining: 2h 15m
    CPU usage: 87%
  - User: user_researcher789
    Time remaining: 45m
    CPU usage: 62%
```

### Revoke Access Early

Immediately revoke access to a resource and invalidate all associated SSH certificates

```
import { AccessManager, CertificateAuthority } from './lib/core';

const accessMgr = new AccessManager();
const ca = new CertificateAuthority();

// Revoke access to a specific reservation
const reservationId = 'rsv_xyz789';

try {
  await accessMgr.revokeAccess(reservationId, {
    reason: 'Owner needs resource urgently',
    notifyUser: true
  });
  
  // Verify certificate is revoked
  const cert = await ca.getCertificateStatus(reservationId);
  
  console.log('Access revoked successfully');
  console.log(`Certificate status: ${cert.status}`);
  console.log(`Revocation time: ${cert.revokedAt}`);
  console.log('User has been notified via email');
} catch (error) {
  console.error('Revocation failed:', error.message);
}

```

**Output:**

```
Access revoked successfully
Certificate status: revoked
Revocation time: 2024-01-15T14:22:33Z
User has been notified via email
```

### Generate Audit Report

Generate compliance reports showing all access events and resource usage for a time period

```
import { AuditLogger } from './lib/core';
import { DateRange } from './lib/utils';

const logger = new AuditLogger();

// Generate monthly audit report
const report = await logger.generateReport({
  dateRange: DateRange.lastMonth(),
  resourceIds: ['res_abc123xyz'],
  includeMetrics: true
});

console.log('=== Audit Report ===');
console.log(`Period: ${report.startDate} to ${report.endDate}`);
console.log(`Total rentals: ${report.totalRentals}`);
console.log(`Unique users: ${report.uniqueUsers}`);
console.log(`Total compute hours: ${report.totalHours}`);
console.log(`Revenue (credits): ${report.totalCredits}`);
console.log(`\nSecurity events: ${report.securityEvents.length}`);
console.log(`Failed access attempts: ${report.failedAttempts}`);

```

**Output:**

```
=== Audit Report ===
Period: 2023-12-01 to 2023-12-31
Total rentals: 47
Unique users: 23
Total compute hours: 312.5
Revenue (credits): 3125

Security events: 2
Failed access attempts: 5
```

## 🏗️ Architecture

ComputeShare follows a modular architecture with clear separation between authentication, resource management, SSH credential provisioning, and audit logging. The system uses an SSH Certificate Authority (CA) pattern to issue time-limited certificates instead of sharing permanent keys. A central API server handles OAuth2 authentication, resource catalog management, and reservation logic, while a separate SSH proxy enforces access policies and certificate validation. All sensitive operations are logged to an immutable audit trail.

### File Structure

```
┌─────────────────┐         ┌──────────────────┐
│   Web Frontend  │◄────────┤  OAuth2 Provider │
│   (React/Vue)   │         │  (Institutional) │
└────────┬────────┘         └──────────────────┘
         │ HTTPS
         ▼
┌─────────────────────────────────────────────┐
│          API Server (Express/TS)            │
│  ┌─────────────┐  ┌──────────────────────┐ │
│  │   Auth      │  │  Resource Manager    │ │
│  │  Middleware │  │  - Catalog           │ │
│  └─────────────┘  │  - Reservations      │ │
│                   │  - Availability      │ │
│  ┌─────────────┐  └──────────────────────┘ │
│  │   Access    │  ┌──────────────────────┐ │
│  │  Manager    │  │   Audit Logger       │ │
│  └─────────────┘  └──────────────────────┘ │
└──────────┬──────────────────┬───────────────┘
           │                  │
           ▼                  ▼
┌──────────────────┐   ┌─────────────────┐
│  SSH Certificate │   │   PostgreSQL    │
│    Authority     │   │   Database      │
│  (OpenSSH CA)    │   │  - Users        │
└────────┬─────────┘   │  - Resources    │
         │             │  - Reservations │
         │             │  - Audit Logs   │
         ▼             └─────────────────┘
┌──────────────────┐
│   SSH Proxy/     │
│   Jump Host      │
│  - Policy Check  │
│  - Cert Validate │
└────────┬─────────┘
         │
         ▼
┌──────────────────────────────────┐
│   Compute Resources              │
│  ┌────────┐  ┌────────┐         │
│  │Cluster │  │  GPU   │  ...    │
│  │ Nodes  │  │ Nodes  │         │
│  └────────┘  └────────┘         │
└──────────────────────────────────┘
```

### Files

- **lib/core.ts** — Core business logic including ResourceManager, AccessManager, CertificateAuthority, and AuditLogger classes
- **lib/utils.ts** — Utility functions for duration parsing, date ranges, SSH key generation, and certificate validation
- **types.ts** — TypeScript type definitions for resources, reservations, credentials, and audit events
- **demo.js** — Demonstration script showing end-to-end workflow of registering resources, requesting access, and auditing

### Design Decisions

- SSH Certificate Authority pattern chosen over key sharing to enable automatic expiration and revocation without modifying authorized_keys files on target servers
- OAuth2/OIDC for authentication allows integration with existing institutional SSO systems and provides standardized token-based access
- Ephemeral credentials with short TTLs (hours, not days) minimize security risk if credentials are compromised
- Immutable audit logging to PostgreSQL ensures compliance and enables forensic analysis of all access events
- SSH proxy/jump host architecture enforces centralized policy checks and certificate validation before allowing access to actual resources
- Resource availability is determined automatically by monitoring owner activity rather than requiring manual toggling
- Internal credit system avoids real money transactions while still providing usage tracking and fair resource allocation

## 🔧 Technical Details

### Dependencies

- **express** (^4.18.0) — Web server framework for handling HTTP requests and routing API endpoints
- **typescript** (^5.0.0) — Type-safe language for building robust, maintainable code with compile-time error checking
- **jsonwebtoken** — JWT token generation and validation for OAuth2 access tokens and internal session management
- **ssh2** — SSH protocol implementation for generating keys, signing certificates, and managing SSH connections
- **pg** — PostgreSQL client for database operations including resource catalog, reservations, and audit logs
- **bcrypt** — Secure password hashing for local user accounts and API key storage
- **node-cron** — Scheduled tasks for automatic credential expiration, resource cleanup, and usage monitoring
- **winston** — Structured logging framework for application logs, security events, and debugging
- **zod** — Runtime type validation for API requests and configuration to prevent injection attacks

### Key Algorithms / Patterns

- SSH Certificate Authority (CA) signing: Uses OpenSSH certificate format with time-limited validity periods and principal restrictions
- Role-Based Access Control (RBAC): Hierarchical permission model with resource owners, renters, and administrators
- Time-window reservation algorithm: Prevents double-booking by checking overlapping time ranges in database with row-level locking
- Automatic certificate revocation: Certificate serial numbers added to revocation list (CRL) and distributed to all SSH proxies
- Resource availability detection: Monitors SSH connection activity and system load to automatically mark resources as available/busy

### Important Notes

- SSH CA must be properly secured with hardware security module (HSM) or encrypted key storage in production environments
- All compute resources must be configured to trust the SSH CA by adding CA public key to /etc/ssh/sshd_config
- Database connection pool should be tuned based on expected concurrent users to prevent connection exhaustion
- OAuth2 tokens should be validated on every request and refreshed before expiration to maintain security
- Audit logs must be write-only and stored in append-only tables to prevent tampering and ensure compliance

## ❓ Troubleshooting

### SSH connection fails with 'Certificate invalid: expired'

**Cause:** The ephemeral SSH certificate has passed its validity period, which is time-limited for security

**Solution:** Request new access credentials through the web interface. Check that your system clock is synchronized with NTP to avoid time skew issues.

### Resource registration fails with 'SSH connection test failed'

**Cause:** The platform cannot connect to the resource host to verify it exists and is accessible

**Solution:** Verify the SSH host and port are correct, ensure the resource server is online, and check that firewall rules allow connections from the ComputeShare server IP.

### OAuth2 authentication redirects to error page

**Cause:** OAuth2 provider configuration is incorrect or the callback URL is not whitelisted

**Solution:** Verify CLIENT_ID, CLIENT_SECRET, and REDIRECT_URI in .env match your OAuth2 provider settings. Add http://localhost:3000/auth/callback to allowed redirect URIs.

### Database migration fails with 'relation already exists'

**Cause:** Previous migration was partially completed or database schema is out of sync with migration files

**Solution:** Run 'npm run db:reset' to drop and recreate the database (WARNING: destroys all data), or manually check migration status with 'npm run db:status' and fix conflicts.

### Certificate Authority initialization fails

**Cause:** SSH CA keys are missing, have incorrect permissions, or the CA directory is not writable

**Solution:** Ensure the CA_KEY_PATH directory exists and is writable. Run 'ssh-keygen -t rsa -b 4096 -f /path/to/ca_key' to generate CA keys. Set permissions to 600 on private key.

---

This project was generated as a proof-of-concept for institutional resource sharing. Before deploying in production, conduct thorough security audits, penetration testing, and legal review to ensure compliance with institutional policies and data protection regulations. The SSH Certificate Authority implementation requires careful key management and should use hardware security modules (HSMs) in production. Always consult with your institution's IT security team before deploying systems that handle SSH credentials and access control.