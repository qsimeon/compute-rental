#!/usr/bin/env ts-node

/*
  demo.ts
  ----------------------
  This demo script implements a proof-of-concept for a web app that allows
  institutions or individuals to automatically rent out their unused compute
  resources and subscriptions. It demonstrates secure delegation of SSH keys
  via a time-limited access mechanism and usage-based pricing.

  Requirements:
    - For demonstration, we simulate resource availability, user requests,
      price calculation, and ephemeral access.
    - We use classes and functions from the following modules:
        1. lib/core.ts: SubscriptionManager, AccessGrantManager, SSHKeyManager, PricingEngine
        2. lib/utils.ts: validateEmail, validateSSHPublicKey, validateResourceType,
                         generateSecureToken, formatCurrency
        3. types.ts: ResourceType, SubscriptionStatus, User, Subscription, AccessGrant

    - We do not re-implement any logic that is already in these modules.
    - This is a single-file demo that you can run with: npx ts-node demo.ts
*/

import {
  SubscriptionManager,
  AccessGrantManager,
  SSHKeyManager,
  PricingEngine
} from "./lib/core";

import {
  validateEmail,
  validateSSHPublicKey,
  validateResourceType,
  generateSecureToken,
  formatCurrency
} from "./lib/utils";

import {
  ResourceType,
  SubscriptionStatus,
  User,
  Subscription,
  AccessGrant
} from "./types";

// A simple in-memory data store for demonstration.
// In a real-world app, these would likely be in a database.
const userStore: User[] = [];
const subscriptionStore: Subscription[] = [];

// Create instances of managers and engines
const subscriptionManager = new SubscriptionManager();
const accessGrantManager = new AccessGrantManager();
const sshKeyManager = new SSHKeyManager();
const pricingEngine = new PricingEngine();

/**
 * Initialize the system with some fixed data.
 * We'll create a few dummy users and subscriptions.
 */
function initializeDemoData(): void {
  // Create some demo users
  const userA: User = {
    id: "user-a",
    email: "alice@example.edu",
    name: "Alice"
  };

  const userB: User = {
    id: "user-b",
    email: "bob@example.edu",
    name: "Bob"
  };

  userStore.push(userA, userB);

  // Create some dummy subscriptions, simulating that
  // these are underutilized resources.
  const subscriptionClusterA: Subscription = {
    id: "sub-clusterA",
    userId: userA.id,
    resourceType: ResourceType.HPC, // Owned HPC cluster
    status: SubscriptionStatus.ACTIVE,
    totalCapacity: 100,
    usedCapacity: 10
  };

  const subscriptionClusterB: Subscription = {
    id: "sub-clusterB",
    userId: userB.id,
    resourceType: ResourceType.HPC,
    status: SubscriptionStatus.ACTIVE,
    totalCapacity: 200,
    usedCapacity: 100
  };

  subscriptionStore.push(subscriptionClusterA, subscriptionClusterB);

  // Register them in the SubscriptionManager
  subscriptionManager.registerSubscription(subscriptionClusterA);
  subscriptionManager.registerSubscription(subscriptionClusterB);
}

/**
 * Rent out a resource from the system.
 *
 * 1. Validate inputs.
 * 2. Find an available subscription.
 * 3. Compute the rental price.
 * 4. Generate ephemeral SSH credentials.
 * 5. Create a secure access grant.
 * 6. Return the result to the caller.
 */
async function rentResource(
  renterEmail: string,
  sshPublicKey: string,
  resourceTypeStr: string,
  capacityNeeded: number
): Promise<AccessGrant | null> {
  try {
    // Step 1: Validate inputs
    if (!validateEmail(renterEmail)) {
      throw new Error("Invalid email address.");
    }

    if (!validateSSHPublicKey(sshPublicKey)) {
      throw new Error("Invalid SSH public key.");
    }

    if (!validateResourceType(resourceTypeStr)) {
      throw new Error("Invalid resource type.");
    }

    // Convert resourceTypeStr to the ResourceType enum
    const resourceType = ResourceType[resourceTypeStr as keyof typeof ResourceType];

    // Step 2: Find an available subscription that can support the capacity needed
    const availableSubscriptions = subscriptionManager.findAvailableSubscriptions(resourceType, capacityNeeded);
    if (availableSubscriptions.length === 0) {
      console.log("No suitable subscription available.");
      return null;
    }

    // For simplicity, pick the first available subscription
    const chosenSubscription = availableSubscriptions[0];

    // Step 3: Compute the price using the PricingEngine
    // We simulate that the base price has already been set
    pricingEngine.setBasePrice(0.05); // e.g., $0.05 per unit of capacity
    const demandMultiplier = pricingEngine.calculateDemandMultiplier();
    const rentalPrice = pricingEngine.calculatePrice(capacityNeeded, demandMultiplier);

    console.log(
      `Renting from subscription ${chosenSubscription.id} with an estimated price of ${formatCurrency(rentalPrice)}`
    );

    // Temporarily update usage (in a real-world scenario, we might do this after some usage is actually performed)
    subscriptionManager.updateUsage(chosenSubscription.id, chosenSubscription.usedCapacity + capacityNeeded);

    // Step 4: Generate ephemeral SSH credentials
    const tempKeyPair = sshKeyManager.generateTemporaryKeyPair();
    // This is a local private key for demonstration. In real usage, it would be stored securely.

    // We create a proxy configuration to route usage to the HPC cluster or subscription resource.
    const proxyConfig = sshKeyManager.createProxyConfig(chosenSubscription.id, renterEmail);

    // Step 5: Create a secure access grant
    // We'll encrypt ephemeral credentials for securely passing them to the user.
    const ephemeralToken = generateSecureToken(16);
    const encryptedCredentials = accessGrantManager.encryptCredentials(ephemeralToken, {
      privateKey: tempKeyPair.privateKey,
      proxyConfig
    });

    const accessGrant: AccessGrant = {
      id: `${chosenSubscription.id}-grant-${Date.now()}`,
      subscriptionId: chosenSubscription.id,
      resourceType: chosenSubscription.resourceType,
      renterEmail,
      capacityAllocated: capacityNeeded,
      encryptedCredentials,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + (60 * 60 * 1000)) // expires in 1 hour
    };

    accessGrantManager.createGrant(accessGrant);
    console.log("Access grant created:", accessGrant);

    // Step 6: Return the grant to the caller
    return accessGrant;
  } catch (error) {
    console.error("Error renting resource:", (error as Error).message);
    return null;
  }
}

/**
 * Main function to demonstrate the entire process
 */
async function main(): Promise<void> {
  // Initialize with some sample data
  initializeDemoData();

  // Renter tries to rent HPC resources
  const renterEmail = "charlie@someinstitution.edu";
  const sshKey = "ssh-rsa AAAAB3Nza... user@machine"; // truncated for brevity
  const resourceTypeStr = "HPC";
  const capacityNeeded = 50;

  const grant = await rentResource(renterEmail, sshKey, resourceTypeStr, capacityNeeded);
  if (!grant) {
    console.log("Could not rent resource.");
    return;
  }

  console.log("\nSuccess! Resource rental completed. AccessGrant information:");
  console.log(grant);

  // For demonstration, decrypt to show ephemeral SSH key (normally, the user would do this client-side)
  const decryptedCredentials = accessGrantManager.decryptCredentials(grant.encryptedCredentials);
  console.log("\nDecrypted ephemeral credentials (for demonstration only):", decryptedCredentials);
}

// Execute main demo
main().catch(console.error);
