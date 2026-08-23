/**
 * Single point of truth for which service implementation the UI talks to.
 *
 * Today every entry below is the local mock implementation, backed by
 * `src/mocks/seed.ts`. To connect the real Muziclly backend later:
 *
 *   1. Implement the same interface (e.g. `TeacherService`) in a new
 *      `services/http/teacher.service.ts`, calling the real API.
 *   2. Swap the import below.
 *
 * No page or component imports `mocks/seed.ts` or an HTTP client directly —
 * everything goes through these named exports, so the swap is a one-file
 * change and the rest of the app is untouched.
 */
export { teacherService } from "./teacher.service";
export { sessionService } from "./session.service";
export { batchService } from "./batch.service";
export { studentService } from "./student.service";
export { trialService } from "./trial.service";
export { availabilityService } from "./availability.service";
export { leaveService } from "./leave.service";
export { reviewService } from "./review.service";
export { contactService } from "./contact.service";
export { notificationService } from "./notification.service";
export { healthService } from "./health.service";
export { earningsService } from "./earnings.service";
export { learningService } from "./learning.service";
export { messageService } from "./message.service";
export { resourceService } from "./resource.service";
export { eventService } from "./event.service";
export { toolsService } from "./tools.service";
