import type { Review } from "@/domain/types";
import { reviews as mockReviews } from "@/mocks/seed";
import { clone, withDelay } from "./async";

export interface ReviewSummary {
  avgRating: number;
  totalReviews: number;
  reviews: Review[];
}

export interface ReviewService {
  getReviews(): Promise<ReviewSummary>;
}

const store: Review[] = clone(mockReviews);

export const reviewService: ReviewService = {
  async getReviews() {
    const totalReviews = store.length;
    const avgRating = totalReviews
      ? Number((store.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1))
      : 0;
    return withDelay({ avgRating, totalReviews, reviews: clone(store) });
  },
};
