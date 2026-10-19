import { seedCourses, seedLessons } from "./catalog";
import { seedAnswerKeys, seedDiagnosticTasks } from "./diagnostic";
import { seedPracticeAnswerKeys, seedPracticeTasks } from "./practice";

/** Every starter document as [Firestore path, data]. Used by `npm run seed` and the admin "load starter content" button. */
export function seedDocuments(): [string, Record<string, unknown>][] {
  const docs: [string, Record<string, unknown>][] = [];
  for (const c of seedCourses) docs.push([`courses/${c.id}`, c]);
  for (const l of seedLessons) {
    const { body, ...meta } = l;
    docs.push([`lessons/${l.id}`, meta]);
    docs.push([`lessonBodies/${l.id}`, { body }]);
  }
  for (const t of seedDiagnosticTasks) docs.push([`diagnosticTasks/${t.id}`, t]);
  for (const t of seedPracticeTasks) docs.push([`practiceTasks/${t.id}`, t]);
  for (const [id, key] of Object.entries({ ...seedAnswerKeys, ...seedPracticeAnswerKeys })) docs.push([`answerKeys/${id}`, key]);
  docs.push(["config/diagnostic", { paywall: { reading: false, listening: false, writing: false, speaking: false } }]);
  docs.push(["config/ai", { monthlyLimit: 40 }]);
  return docs;
}
