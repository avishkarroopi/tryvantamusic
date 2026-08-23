import type { Enrollment } from "@/domain/types";
import { enrollments as mockEnrollments } from "@/mocks/seed";
import { clone, withDelay } from "./async";

export interface EnrollmentService {
  listEnrollments(): Promise<Enrollment[]>;
  getEnrollment(id: string): Promise<Enrollment | undefined>;
}

const store: Enrollment[] = clone(mockEnrollments);

export const enrollmentService: EnrollmentService = {
  async listEnrollments() {
    return withDelay(clone(store));
  },
  async getEnrollment(id) {
    return withDelay(clone(store.find((e) => e.id === id)));
  },
};
