import type { EarningStatement } from "@/domain/types";
import { earnings as mockEarnings } from "@/mocks/seed";
import { clone, withDelay } from "./async";

export interface EarningsService {
  listStatements(): Promise<EarningStatement[]>;
}

export const earningsService: EarningsService = {
  async listStatements() {
    return withDelay(clone(mockEarnings));
  },
};
