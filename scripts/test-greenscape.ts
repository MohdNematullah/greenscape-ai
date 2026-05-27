import { runTest } from "./auth";

runTest("Greenscape AI — Smoke Test", async (helper) => {
  const { page } = helper;

  // Should redirect to dashboard after login
  await helper.goto("/dashboard");
  await page.waitForSelector("text=Dashboard", { timeout: 15000 });
  console.log("✅ Dashboard loaded");

  // Check KPI cards
  for (const text of ["Total Leads", "Active Proposals", "Pipeline Value"]) {
    const visible = await page.locator(`text=${text}`).first().isVisible();
    if (!visible) throw new Error(`Missing KPI: ${text}`);
  }
  console.log("✅ KPI cards visible");
  await page.screenshot({ path: "screenshots/dashboard.png", fullPage: true });

  // Navigate to Leads
  await helper.goto("/leads");
  await page.waitForSelector("text=Leads", { timeout: 10000 });
  console.log("✅ Leads page loaded");
  await page.screenshot({ path: "screenshots/leads.png", fullPage: true });

  // Navigate to Pricing
  await helper.goto("/pricing");
  await page.waitForSelector("text=Pricing", { timeout: 10000 });
  console.log("✅ Pricing page loaded");

  // Load sample data
  const loadBtn = page.locator("text=Load Sample Data").first();
  if (await loadBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await loadBtn.click();
    await page.waitForTimeout(3000);
    console.log("✅ Sample pricing data loaded");
  }
  await page.screenshot({ path: "screenshots/pricing.png", fullPage: true });

  console.log("\n🎉 All tests passed!");
}).catch(() => process.exit(1));
