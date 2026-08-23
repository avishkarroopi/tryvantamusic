import type { StudentProfile } from "@/domain/types";
import { student as mockStudent } from "@/mocks/seed";
import { clone, withDelay } from "./async";

export interface StudentProfileService {
  getProfile(): Promise<StudentProfile>;
  updateProfile(profile: StudentProfile): Promise<StudentProfile>;
}

const store: StudentProfile = clone(mockStudent);

export const studentProfileService: StudentProfileService = {
  async getProfile() {
    return withDelay(clone(store));
  },
  async updateProfile(profile) {
    Object.assign(store, profile);
    return withDelay(clone(store), 220);
  },
};
