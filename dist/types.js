"use strict";
/**
 * Type definitions for the compute resource sharing platform
 *
 * @module types
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionStatus = exports.ResourceType = void 0;
/**
 * Supported resource types
 */
var ResourceType;
(function (ResourceType) {
    ResourceType["SSH_CLUSTER"] = "ssh_cluster";
    ResourceType["CHATGPT_API"] = "chatgpt_api";
    ResourceType["GPU_COMPUTE"] = "gpu_compute";
    ResourceType["CLOUD_CREDITS"] = "cloud_credits";
})(ResourceType || (exports.ResourceType = ResourceType = {}));
/**
 * Subscription status
 */
var SubscriptionStatus;
(function (SubscriptionStatus) {
    SubscriptionStatus["ACTIVE"] = "active";
    SubscriptionStatus["PAUSED"] = "paused";
    SubscriptionStatus["EXHAUSTED"] = "exhausted";
    SubscriptionStatus["EXPIRED"] = "expired";
})(SubscriptionStatus || (exports.SubscriptionStatus = SubscriptionStatus = {}));
//# sourceMappingURL=types.js.map