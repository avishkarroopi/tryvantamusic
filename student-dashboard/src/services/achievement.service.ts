import type { Achievement } from "@/domain/types";
import { achievements as mockAchievements } from "@/mocks/seed";
import { clone, withDelay } from "./async";

export interface AchievementService {
  listAchievements(): Promise<Achievement[]>;
}

const store: Achievement[] = clone(mockAchievements);

export const achievementService: AchievementService = {
  async listAchievements() {
    return withDelay(clone(store).sort((a, b) => b.earnedAt.localeCompare(a.earnedAt)));
  },
};
