import type { Batch } from "@/domain/types";
import { batches as mockBatches } from "@/mocks/seed";
import { clone, withDelay } from "./async";

export interface BatchService {
  listBatches(): Promise<Batch[]>;
  getBatch(id: string): Promise<Batch | undefined>;
}

const store: Batch[] = clone(mockBatches);

export const batchService: BatchService = {
  async listBatches() {
    return withDelay(clone(store));
  },
  async getBatch(id) {
    return withDelay(clone(store.find((b) => b.id === id)));
  },
};
