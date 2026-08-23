import type { Teacher } from "@/domain/types";
import { teachers as mockTeachers } from "@/mocks/seed";
import { clone, withDelay } from "./async";

export interface TeacherService {
  listTeachers(): Promise<Teacher[]>;
  getTeacher(id: string): Promise<Teacher | undefined>;
}

const store: Teacher[] = clone(mockTeachers);

export const teacherService: TeacherService = {
  async listTeachers() {
    return withDelay(clone(store));
  },
  async getTeacher(id) {
    return withDelay(clone(store.find((t) => t.id === id)));
  },
};
