import { clearDemoData, seedDemoData } from "../../prisma/seed";

let resetChain = Promise.resolve();

export function resetDatabase() {
  resetChain = resetChain.then(async () => {
    await clearDemoData();
    await seedDemoData({
      logSummary: false,
      reset: false,
    });
  });

  return resetChain;
}
