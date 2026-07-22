export type PipelineStage = "acquisition" | "normalization" | "graph" | "attribution" | "snapshot" | "analytics" | "api" | "frontend";

export interface PipelineMetric {
  readonly stage: PipelineStage;
  readonly name: string;
  readonly value: number;
  readonly recordedAt: string;
}

export class MetricsCollector {
  private readonly metrics: PipelineMetric[] = [];

  record(metric: PipelineMetric): void {
    this.metrics.push(metric);
  }

  all(): readonly PipelineMetric[] {
    return [...this.metrics];
  }

  latest(stage: PipelineStage, name: string): PipelineMetric | undefined {
    for (let index = this.metrics.length - 1; index >= 0; index -= 1) {
      const metric = this.metrics[index];
      if (metric !== undefined && metric.stage === stage && metric.name === name) return metric;
    }
    return undefined;
  }
}
