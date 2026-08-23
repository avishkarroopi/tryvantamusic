import type { Teacher } from "@/domain/types";
import { teacher as mockTeacher } from "@/mocks/seed";
import { clone, withDelay } from "./async";

export interface TeacherService {
  getProfile(): Promise<Teacher>;
  updateProfile(patch: Partial<Teacher>): Promise<Teacher>;
}

let current: Teacher = clone(mockTeacher);

/**
 * Mock implementation. Swap for an HTTP-backed implementation (e.g.
 * `services/http/teacher.service.ts` calling the future Muziclly API) by
 * changing the export wired up in `services/index.ts` — nothing else in the
 * app needs to change, since callers only depend on the `TeacherService`
 * interface above.
 */
export const teacherService: TeacherService = {
  async getProfile() {
    return withDelay(clone(current));
  },
  async updateProfile(patch) {
    current = { ...current, ...patch };
    return withDelay(clone(current));
  },
};
