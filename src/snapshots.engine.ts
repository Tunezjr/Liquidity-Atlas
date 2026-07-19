import { createHash } from "node:crypto";

export interface ImmutableSnapshot<TData> {
  readonly id: string;
  readonly createdAt: string;
  readonly version: number;
  readonly data: TData;
  readonly previousSnapshotId?: string;
  readonly contentHash: string;
}

export function createSnapshot<TData>(data: TData, options: { createdAt: string; version?: number; previousSnapshotId?: string }): ImmutableSnapshot<TData> {
  const content = JSON.stringify(data, (_, value: unknown) => (typeof value === "bigint" ? value.toString() : value));
  const contentHash = createHash("sha256").update(content).digest("hex");
  const version = options.version ?? 1;
  const snapshot: ImmutableSnapshot<TData> = {
    id: `snapshot:${version}:${contentHash.slice(0, 16)}`,
    createdAt: options.createdAt,
    version,
    data,
    contentHash,
  };
  return options.previousSnapshotId === undefined ? snapshot : { ...snapshot, previousSnapshotId: options.previousSnapshotId };
}
