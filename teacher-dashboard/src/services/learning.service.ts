import type { Course, LearningModule } from "@/domain/types";
import { courses as mockCourses, learningModules as mockModules } from "@/mocks/seed";
import { clone, withDelay } from "./async";

export interface LearningService {
  listModules(): Promise<LearningModule[]>;
  listCourses(): Promise<Course[]>;
}

const moduleStore: LearningModule[] = clone(mockModules);

export const learningService: LearningService = {
  async listModules() {
    return withDelay(clone(moduleStore));
  },
  async listCourses() {
    return withDelay(clone(mockCourses));
  },
};
