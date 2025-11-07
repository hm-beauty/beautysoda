import { CONFIG } from '../config';
import { PlanType, AddonType } from '../types';

export function calculatePrice(
  selectedPlan: PlanType,
  addons: AddonType[],
  multiStore: boolean,
  additionalStores: number
) {
  const plan = CONFIG.PLANS[selectedPlan];
  const planPrice = plan.price;

  const totalStores = multiStore ? additionalStores + 1 : 1;

  const addonPrice = addons.reduce((sum, addonKey) => {
    return sum + (CONFIG.ADDONS[addonKey].price * totalStores);
  }, 0);

  const multiStorePrice = multiStore
    ? plan.multiStorePrice * additionalStores
    : 0;

  const totalPrice = planPrice + addonPrice + multiStorePrice;

  return {
    planPrice,
    addonPrice,
    multiStorePrice,
    totalPrice
  };
}
