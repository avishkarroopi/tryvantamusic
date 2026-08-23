import type { Review } from "@/domain/types";
import { reviews as mockReviews } from "@/mocks/seed";
import { makeId } from "@/lib/id";
import { nowISO } from "@/lib/date";
import { clone, withDelay } from "./async";

export interface ReviewService {
  listReviews(): Promise<Review[]>;
  submitReview(teacherId: string, teacherName: string, rating: 1 | 2 | 3 | 4 | 5, comment: string): Promise<Review>;
}

const store: Review[] = clone(mockReviews);

export const reviewService: ReviewService = {
  async listReviews() {
    return withDelay(clone(store).sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
  },
  async submitReview(teacherId, teacherName, rating, comment) {
    const review: Review = { id: makeId("rev"), teacherId, teacherName, rating, comment, createdAt: nowISO() };
    store.unshift(review);
    return withDelay(clone(review), 220);
  },
};
