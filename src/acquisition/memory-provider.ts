import type { AcquisitionCursor, AcquisitionProvider, RawRecord } from "./types.js";

export class StaticAcquisitionProvider<TPayload = unknown> implements AcquisitionProvider<TPayload> {
  constructor(readonly name: string, private readonly records: readonly RawRecord<TPayload>[]) {}

  async fetch(cursor: AcquisitionCursor): Promise<readonly RawRecord<TPayload>[]> {
    return this.records.filter((record) => {
      if (record.chainId !== cursor.chainId) return false;
      if (record.blockNumber === undefined) return true;
      return record.blockNumber >= cursor.fromBlock && record.blockNumber <= cursor.toBlock;
    });
  }
}
