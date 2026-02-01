#!/usr/bin/env ts-node
"use strict";
/**
 * demo.ts
 * ----------------------
 * This demo script implements a proof-of-concept for a web app that allows
 * institutions or individuals to automatically rent out their unused compute
 * resources and subscriptions. It demonstrates secure delegation of SSH keys
 * via a time-limited access mechanism and usage-based pricing.
 *
 * Run with: npx ts-node demo.ts
 */
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("./lib/core");
const utils_1 = require("./lib/utils");
const types_1 = require("./types");
// Create instances of managers and engines
const subscriptionManager = new core_1.SubscriptionManager();
const accessGrantManager = new core_1.AccessGrantManager();
const sshKeyManager = new core_1.SSHKeyManager();
const pricingEngine = new core_1.PricingEngine();
/**
 * Initialize the system with some sample data.
 * Creates demo subscriptions representing underutilized resources.
 */
function initializeDemoData() {
    console.log("🚀 Initializing ComputeShare Demo\n");
    console.log("=".repeat(50));
    // Register an HPC cluster subscription (Alice's resource)
    const clusterSubscription = subscriptionManager.registerSubscription("user-alice", types_1.ResourceType.SSH_CLUSTER, 100, // usage limit (e.g., 100 hours)
    10 // current usage (10 hours already used)
    );
    console.log(`\n📦 Registered HPC Cluster Subscription:`);
    console.log(`   ID: ${clusterSubscription.id}`);
    console.log(`   Owner: user-alice`);
    console.log(`   Available capacity: ${subscriptionManager.getAvailableCapacity(clusterSubscription.id).toFixed(1)}%`);
    // Register a GPU compute subscription (Bob's resource)
    const gpuSubscription = subscriptionManager.registerSubscription("user-bob", types_1.ResourceType.GPU_COMPUTE, 200, // usage limit
    50 // current usage
    );
    console.log(`\n📦 Registered GPU Compute Subscription:`);
    console.log(`   ID: ${gpuSubscription.id}`);
    console.log(`   Owner: user-bob`);
    console.log(`   Available capacity: ${subscriptionManager.getAvailableCapacity(gpuSubscription.id).toFixed(1)}%`);
    // Register a ChatGPT API subscription
    const chatgptSubscription = subscriptionManager.registerSubscription("user-alice", types_1.ResourceType.CHATGPT_API, 1000000, // 1M tokens limit
    100000 // 100K tokens used
    );
    console.log(`\n📦 Registered ChatGPT API Subscription:`);
    console.log(`   ID: ${chatgptSubscription.id}`);
    console.log(`   Owner: user-alice`);
    console.log(`   Available capacity: ${subscriptionManager.getAvailableCapacity(chatgptSubscription.id).toFixed(1)}%`);
    console.log("\n" + "=".repeat(50));
}
/**
 * Demonstrate finding and renting available resources
 */
async function demonstrateResourceRental() {
    console.log("\n🔍 Finding available SSH Cluster resources...\n");
    // Find available SSH cluster subscriptions with at least 50% capacity
    const availableClusters = subscriptionManager.findAvailableSubscriptions(types_1.ResourceType.SSH_CLUSTER, 50 // minimum 50% capacity available
    );
    if (availableClusters.length === 0) {
        console.log("❌ No SSH cluster resources available with sufficient capacity.");
        return;
    }
    console.log(`✅ Found ${availableClusters.length} available cluster(s)\n`);
    // Pick the first available subscription
    const chosenSubscription = availableClusters[0];
    const capacity = subscriptionManager.getAvailableCapacity(chosenSubscription.id);
    // Calculate pricing
    const usageHours = 4; // Rent for 4 hours
    const demandMultiplier = pricingEngine.calculateDemandMultiplier(capacity);
    const price = pricingEngine.calculatePrice(types_1.ResourceType.SSH_CLUSTER, usageHours, demandMultiplier);
    console.log(`📊 Rental Quote:`);
    console.log(`   Resource: SSH Cluster`);
    console.log(`   Duration: ${usageHours} hours`);
    console.log(`   Demand multiplier: ${demandMultiplier}x`);
    console.log(`   Price: ${(0, utils_1.formatCurrency)(price)}`);
    console.log("");
    // Generate ephemeral SSH credentials
    console.log("🔐 Generating ephemeral SSH credentials...\n");
    const duration = (0, utils_1.parseDuration)("4h"); // 4 hours
    const keyPair = await sshKeyManager.generateTemporaryKeyPair(duration);
    console.log(`   Key fingerprint: ${keyPair.fingerprint.substring(0, 32)}...`);
    console.log(`   Valid until: ${keyPair.expiresAt.toISOString()}`);
    console.log(`   Duration: ${(0, utils_1.formatDuration)(duration)}`);
    // Encrypt credentials for secure storage
    const credentials = {
        host: "cluster.university.edu",
        port: 22,
        username: "rental-user-charlie",
        privateKey: keyPair.privateKey.substring(0, 100) + "... (truncated)",
    };
    const encryptedCreds = accessGrantManager.encryptCredentials(credentials);
    console.log("\n🔒 Credentials encrypted successfully");
    // Create access grant
    const grant = accessGrantManager.createGrant(chosenSubscription.id, "user-charlie", // renter
    duration, encryptedCreds);
    console.log(`\n✅ Access Grant Created:`);
    console.log(`   Grant ID: ${grant.id}`);
    console.log(`   Subscription: ${grant.subscriptionId}`);
    console.log(`   Renter: ${grant.renterId}`);
    console.log(`   Created: ${grant.createdAt.toISOString()}`);
    console.log(`   Expires: ${grant.expiresAt.toISOString()}`);
    console.log(`   Active: ${grant.isActive}`);
    // Update subscription usage
    subscriptionManager.updateUsage(chosenSubscription.id, usageHours);
    const newCapacity = subscriptionManager.getAvailableCapacity(chosenSubscription.id);
    console.log(`\n📉 Subscription capacity updated: ${capacity.toFixed(1)}% → ${newCapacity.toFixed(1)}%`);
    // Validate the grant
    console.log("\n" + "=".repeat(50));
    console.log("\n🔍 Validating access grant...");
    const isValid = accessGrantManager.validateGrant(grant.id);
    console.log(`   Grant valid: ${isValid ? "✅ Yes" : "❌ No"}`);
    // Decrypt credentials (demonstration only - normally done client-side)
    console.log("\n🔓 Decrypting credentials (demo only):");
    const decrypted = accessGrantManager.decryptCredentials(encryptedCreds);
    console.log(`   Host: ${decrypted.host}`);
    console.log(`   Port: ${decrypted.port}`);
    console.log(`   Username: ${decrypted.username}`);
}
/**
 * Demonstrate access revocation
 */
function demonstrateRevocation() {
    console.log("\n" + "=".repeat(50));
    console.log("\n🚫 Demonstrating Access Revocation\n");
    // Create a temporary grant to revoke
    const tempGrant = accessGrantManager.createGrant("temp-subscription", "user-dave", (0, utils_1.parseDuration)("1h"), accessGrantManager.encryptCredentials({ test: "data" }));
    console.log(`   Created temporary grant: ${tempGrant.id}`);
    console.log(`   Is active: ${tempGrant.isActive}`);
    // Revoke the grant
    accessGrantManager.revokeGrant(tempGrant.id);
    const isStillValid = accessGrantManager.validateGrant(tempGrant.id);
    console.log(`   Grant revoked!`);
    console.log(`   Is still valid: ${isStillValid ? "Yes" : "No"}`);
}
/**
 * Demonstrate input validation
 */
function demonstrateValidation() {
    console.log("\n" + "=".repeat(50));
    console.log("\n🧪 Input Validation Examples\n");
    // Email validation
    const validEmail = "alice@university.edu";
    const invalidEmail = "not-an-email";
    console.log(`   Email "${validEmail}": ${(0, utils_1.validateEmail)(validEmail) ? "✅ Valid" : "❌ Invalid"}`);
    console.log(`   Email "${invalidEmail}": ${(0, utils_1.validateEmail)(invalidEmail) ? "✅ Valid" : "❌ Invalid"}`);
    // SSH key validation
    const validSSHKey = "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQDTest user@host";
    const invalidSSHKey = "not-a-valid-key";
    console.log(`   SSH key (valid format): ${(0, utils_1.validateSSHPublicKey)(validSSHKey) ? "✅ Valid" : "❌ Invalid"}`);
    console.log(`   SSH key (invalid format): ${(0, utils_1.validateSSHPublicKey)(invalidSSHKey) ? "✅ Valid" : "❌ Invalid"}`);
}
/**
 * Main function to run the complete demo
 */
async function main() {
    try {
        // Initialize with sample data
        initializeDemoData();
        // Run demonstrations
        await demonstrateResourceRental();
        demonstrateRevocation();
        demonstrateValidation();
        console.log("\n" + "=".repeat(50));
        console.log("\n🎉 Demo completed successfully!\n");
        console.log("This demonstrates the core functionality of ComputeShare:");
        console.log("  • Resource registration and discovery");
        console.log("  • Dynamic pricing based on demand");
        console.log("  • Ephemeral SSH key generation");
        console.log("  • Secure credential encryption");
        console.log("  • Time-limited access grants");
        console.log("  • Access revocation");
        console.log("  • Input validation\n");
    }
    catch (error) {
        console.error("❌ Demo failed:", error.message);
        console.error(error.stack);
        process.exit(1);
    }
}
// Execute main demo
main();
//# sourceMappingURL=demo.js.map