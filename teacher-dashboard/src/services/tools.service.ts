import type { MusicTool } from "@/domain/types";
import { musicTools as mockTools } from "@/mocks/seed";
import { clone, withDelay } from "./async";

export interface ToolsService {
  listTools(): Promise<MusicTool[]>;
}

export const toolsService: ToolsService = {
  async listTools() {
    return withDelay(clone(mockTools), 220);
  },
};
