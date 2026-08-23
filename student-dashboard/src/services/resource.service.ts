import type { Resource } from "@/domain/types";
import { resources as mockResources } from "@/mocks/seed";
import { clone, withDelay } from "./async";

export interface ResourceService {
  listResources(): Promise<Resource[]>;
}

const store: Resource[] = clone(mockResources);

export const resourceService: ResourceService = {
  async listResources() {
    return withDelay(clone(store));
  },
};
