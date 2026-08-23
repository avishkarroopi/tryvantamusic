/**
 * Single point of truth for which service implementation the UI talks to.
 *
 * Today every entry below is the local mock implementation, backed by
 * `src/mocks/seed.ts`. To connect the real Muziclly backend later:
 *
 *   1. Implement the same interface (e.g. `EnrollmentService`) in a new
 *      `services/http/enrollment.service.ts`, calling the real API.
 *   2. Swap the import below.
 *
 * No page or component imports `mocks/seed.ts` or an HTTP client directly —
 * everything goes through these named exports, so the swap is a one-file
 * change and the rest of the app is untouched. Same pattern as the Teacher
 * Dashboard's `services/index.ts`.
 */
export { studentProfileService } from "./student.service";
export { enrollmentService } from "./enrollment.service";
export { sessionService } from "./session.service";
export { teacherService } from "./teacher.service";
export { practiceService } from "./practice.service";
export { achievementService } from "./achievement.service";
export { notificationService } from "./notification.service";
export { messageService } from "./message.service";
export { reviewService } from "./review.service";
export { resourceService } from "./resource.service";
export { eventService } from "./event.service";
