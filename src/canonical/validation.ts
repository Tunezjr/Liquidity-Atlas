import type { CanonicalAsset, CanonicalEntity, CanonicalProtocol } from "./types.js";

export interface ValidationResult {
  readonly valid: boolean;
  readonly errors: readonly string[];
}

function result(errors: string[]): ValidationResult {
  return { valid: errors.length === 0, errors };
}

export function validateCanonicalAsset(asset: CanonicalAsset): ValidationResult {
  const errors: string[] = [];
  if (asset.symbol.trim().length === 0) errors.push("Asset symbol is required.");
  if (asset.name.trim().length === 0) errors.push("Asset name is required.");
  if (!Number.isInteger(asset.decimals) || asset.decimals < 0 || asset.decimals > 255) {
    errors.push("Asset decimals must be an integer between 0 and 255.");
  }
  if (asset.nativeAsset && asset.contractAddress !== undefined) {
    errors.push("Native assets must not define a contract address.");
  }
  if (!asset.nativeAsset && asset.contractAddress === undefined && asset.type !== "synthetic" && asset.type !== "unknown") {
    errors.push("Non-native assets must define a contract address unless synthetic or unknown.");
  }
  if (asset.wrappedFromAssetId !== undefined && asset.canonicalUnderlyingAssetId === undefined) {
    errors.push("Wrapped assets must reference a canonical underlying asset.");
  }
  return result(errors);
}

export function validateCanonicalProtocol(protocol: CanonicalProtocol): ValidationResult {
  const errors: string[] = [];
  if (protocol.name.trim().length === 0) errors.push("Protocol name is required.");
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(protocol.slug)) errors.push("Protocol slug must be kebab-case.");
  return result(errors);
}

export function validateCanonicalEntity(entity: CanonicalEntity): ValidationResult {
  const errors: string[] = [];
  if (entity.label.trim().length === 0) errors.push("Entity label is required.");
  if (entity.confidence < 0 || entity.confidence > 1) errors.push("Entity confidence must be between 0 and 1.");
  if ((entity.type === "account" || entity.type === "contract") && entity.address === undefined) {
    errors.push("Account and contract entities must define an address.");
  }
  return result(errors);
}

export function assertValid(validation: ValidationResult): void {
  if (!validation.valid) {
    throw new Error(validation.errors.join(" "));
  }
}
