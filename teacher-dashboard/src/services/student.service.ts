import type { Student } from "@/domain/types";
import { students as mockStudents } from "@/mocks/seed";
import { clone, withDelay } from "./async";

export interface StudentService {
  listStudents(): Promise<Student[]>;
  getStudent(id: string): Promise<Student | undefined>;
}

const store: Student[] = clone(mockStudents);

export const studentService: StudentService = {
  async listStudents() {
    return withDelay(clone(store));
  },
  async getStudent(id) {
    return withDelay(clone(store.find((s) => s.id === id)));
  },
};
