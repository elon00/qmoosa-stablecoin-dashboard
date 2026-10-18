export type HealthState = "HEALTHY" | "WARNING" | "DANGER" | "LIQUIDATABLE";

export interface TelemetryEvent {
  id: string;
  timestamp: number;
  type: "DEPOSIT" | "MINT" | "REPAY" | "LIQUIDATE" | "ORACLE_UPDATE";
  vaultId?: string;
  details: Record<string, any>;
}

export class DashboardController {
  private events: TelemetryEvent[] = [];

  public static classifyHealth(ratioBps: bigint, minRatioBps: bigint): HealthState {
    if (ratioBps < minRatioBps) {
      return "LIQUIDATABLE";
    }
    // If within 15% of minimum ratio -> DANGER
    if (ratioBps <= (minRatioBps * 11500n) / 10000n) {
      return "DANGER";
    }
    // If within 30% of minimum ratio -> WARNING
    if (ratioBps <= (minRatioBps * 13000n) / 10000n) {
      return "WARNING";
    }
    return "HEALTHY";
  }

  public static calculateLiquidationPrice(
    collateralAmount: bigint,
    debtAmount: bigint,
    minRatioBps: bigint,
    decimals: number = 18
  ): bigint {
    if (collateralAmount <= 0n) return 0n;
    if (debtAmount <= 0n) return 0n;
    // Liquidation price = (debtAmount * minRatioBps * 10^decimals) / (collateralAmount * 10000)
    return (debtAmount * minRatioBps * (10n ** BigInt(decimals))) / (collateralAmount * 10000n);
  }

  public logEvent(event: Omit<TelemetryEvent, "id" | "timestamp">): TelemetryEvent {
    const fullEvent: TelemetryEvent = {
      ...event,
      id: `ev_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now()
    };
    this.events.unshift(fullEvent);
    if (this.events.length > 100) {
      this.events.pop();
    }
    return fullEvent;
  }

  public getEvents(): TelemetryEvent[] {
    return [...this.events];
  }
}
