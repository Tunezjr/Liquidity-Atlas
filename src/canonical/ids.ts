import type { Brand, CanonicalIdKind, ChainId, EvmAddress } from "./types.js";

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const ADDRESS_PATTERN = /^0x[a-f0-9]{40}$/;

export function asChainId(value: number): ChainId {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`Invalid chain id: ${value}`);
  }
  return value as ChainId;
}

export function normalizeEvmAddress(value: string): EvmAddress {
  const normalized = value.toLowerCase();
  if (!ADDRESS_PATTERN.test(normalized)) {
    throw new Error(`Invalid EVM address: ${value}`);
  }
  return normalized as EvmAddress;
}

export function makeCanonicalId<T extends Brand<string, string>>(kind: CanonicalIdKind, chainId: ChainId, slug: string): T {
  if (!SLUG_PATTERN.test(slug)) {
    throw new Error(`Invalid canonical ${kind} slug: ${slug}`);
  }
  return `${kind}:monad-${chainId}:${slug}` as T;
}

export function makeAddressScopedSlug(prefix: string, address: EvmAddress): string {
  return `${prefix}-${address.slice(2, 10)}`;
}
