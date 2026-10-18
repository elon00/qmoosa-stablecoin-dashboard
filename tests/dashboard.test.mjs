import { test } from "node:test";
import assert from "node:assert/strict";
import { DashboardController } from "../dist/index.js";

const WAD = 10n ** 18n;

test("1. Dashboard health classification (HEALTHY, WARNING, DANGER, LIQUIDATABLE)", () => {
  const minRatioBps = 15000n; // 150%

  // 200% ratio -> HEALTHY
  assert.equal(DashboardController.classifyHealth(20000n, minRatioBps), "HEALTHY");

  // 180% ratio -> WARNING (<= 1.3 * 15000 = 19500)
  assert.equal(DashboardController.classifyHealth(18000n, minRatioBps), "WARNING");

  // 160% ratio -> DANGER (<= 1.15 * 15000 = 17250)
  assert.equal(DashboardController.classifyHealth(16000n, minRatioBps), "DANGER");

  // 145% ratio -> LIQUIDATABLE (< 15000)
  assert.equal(DashboardController.classifyHealth(14500n, minRatioBps), "LIQUIDATABLE");
});

test("2. Liquidation price calculation", () => {
  // 10 WETH collateral, 10,000 QUSD debt, 150% min ratio
  // Liquidation happens when 10 * Price = 10,000 * 1.5 -> Price = $1,500
  const liqPrice = DashboardController.calculateLiquidationPrice(
    10n * WAD,
    10_000n * WAD,
    15000n,
    18
  );

  assert.equal(liqPrice, 1500n * WAD);

  // Zero collateral or zero debt returns 0
  assert.equal(DashboardController.calculateLiquidationPrice(0n, 1000n * WAD, 15000n), 0n);
  assert.equal(DashboardController.calculateLiquidationPrice(10n * WAD, 0n, 15000n), 0n);
});

test("3. Telemetry event logging and retrieval", () => {
  const controller = new DashboardController();

  controller.logEvent({
    type: "DEPOSIT",
    vaultId: "vault_1",
    details: { amount: "10000000000000000000", token: "WETH" }
  });

  controller.logEvent({
    type: "MINT",
    vaultId: "vault_1",
    details: { amount: "10000000000000000000000" }
  });

  const events = controller.getEvents();
  assert.equal(events.length, 2);
  assert.equal(events[0].type, "MINT"); // latest first
  assert.equal(events[1].type, "DEPOSIT");
});
