import type { HealthScore } from "@/domain/types";
import { healthScore as mockHealthScore } from "@/mocks/seed";
import { clone, withDelay } from "./async";

export interface HealthService {
  getHealthScore(): Promise<HealthScore>;
}

export const healthService: HealthService = {
  async getHealthScore() {
    return withDelay(clone(mockHealthScore));
  },
};
