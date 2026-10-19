/**
 * Placeholder practice content: one exercise per skill plus a sample mock
 * test per skill. `npm run seed` writes them to `practiceTasks` and their
 * answers to `answerKeys`. Add your own in the admin panel.
 */
import type { AnswerKey } from "@/lib/diagnostic/types";
import type { PracticeTask } from "@/lib/practice/types";
import { seedAnswerKeys as diagnosticKeys, seedDiagnosticTasks } from "./diagnostic";

const TFNG = "Do the following statements agree with the information in the passage? Choose TRUE if the statement agrees with the information, FALSE if it contradicts it, and NOT GIVEN if there is no information on this.";
const ALL = ["ielts-academic"];
const WS = ["ielts-academic", "writing-speaking"];

const exercises: PracticeTask[] = [
  {
    id: "practice-reading-night-trains",
    section: "reading",
    kind: "exercise",
    order: 1,
    courseIds: ALL,
    free: true,
    title: "The return of the night train",
    active: true,
    durations: { light: 12, full: 12 },
    passages: [
      {
        id: "p1",
        title: "The return of the night train",
        text: `**A** In the 1990s and early 2000s, overnight trains seemed to be disappearing from Europe. Low-cost airlines could carry passengers between capital cities in two hours for less than the price of a sleeping compartment, and many national rail companies decided that their old sleeper carriages were not worth replacing.

**B** Since around 2016, however, the trend has reversed. Austria's national operator bought several routes that a German company had abandoned and ordered new carriages with small private cabins. Other operators followed, and by the early 2020s new overnight services linked cities such as Vienna, Brussels, Amsterdam and Paris.

**C** The main reason for this revival is concern about the climate. A seat on a night train produces a small fraction of the emissions of the same journey by air. Travellers also value the fact that they arrive in the city centre in the morning, without the time spent travelling to and from airports.

**D** The business is still difficult. Sleeper carriages hold far fewer passengers than ordinary ones, and each train is used for only one journey a day. Some operators therefore say that night trains will need public support if ticket prices are to stay competitive with flights.`,
      },
    ],
    groups: [
      {
        id: "g1",
        typeLabel: "True / False / Not Given",
        instructions: TFNG,
        passageId: "p1",
        light: true,
        questions: [
          { id: "q1", number: 1, type: "tfng", prompt: "Cheap flights were one reason why night trains became less common." },
          { id: "q2", number: 2, type: "tfng", prompt: "The Austrian operator designed its routes from the beginning without help." },
          { id: "q3", number: 3, type: "tfng", prompt: "Night trains are now cheaper than flights on most routes." },
          { id: "q4", number: 4, type: "tfng", prompt: "Some travellers like arriving directly in the city centre." },
        ],
      },
      {
        id: "g2",
        typeLabel: "Sentence completion",
        instructions: "Complete the sentences. Choose NO MORE THAN TWO WORDS from the passage for each answer.",
        passageId: "p1",
        light: true,
        questions: [
          { id: "q5", number: 5, type: "gap", prompt: "The new Austrian carriages include small ______.", maxWords: 2 },
          { id: "q6", number: 6, type: "gap", prompt: "Some operators believe night trains will require ______ to keep prices low.", maxWords: 2 },
        ],
      },
    ],
  },
  {
    id: "practice-listening-museum",
    section: "listening",
    kind: "exercise",
    order: 1,
    courseIds: ALL,
    free: false,
    title: "A tour of the Harbour Museum",
    active: true,
    durations: { light: 6, full: 6 },
    audio: [
      {
        id: "a1",
        title: "Section 2",
        url: "/audio/practice-listening-1.mp3",
        transcript:
          "Good afternoon, everyone, and welcome to the Harbour Museum. My name is Claire, and I'll be your guide for the next hour. Before we start, a few practical points. The museum was originally a warehouse, built in 1860, and it opened as a museum much later, in 1992. Bags are not allowed in the galleries, so please leave them in the lockers next to the shop. The lockers are free, but you will need a one manat coin, which you get back at the end. Our tour starts on the ground floor, in the gallery about shipbuilding. The most popular object there is a model of a steam ship, which took two volunteers six years to build. After that, we go up to the first floor, where you can see the map room. Please don't touch the maps, because they are very fragile, and remember that photography is not allowed in that room. We finish on the top floor, in the café, where there is a fantastic view of the harbour. If you show your ticket there, you get ten percent off any drink.",
      },
    ],
    groups: [
      {
        id: "g1",
        typeLabel: "Note completion",
        instructions: "Complete the notes below. Write NO MORE THAN THREE WORDS AND/OR A NUMBER for each answer.",
        light: true,
        questions: [
          { id: "q1", number: 1, type: "gap", prompt: "The building was built in ______.", maxWords: 1 },
          { id: "q2", number: 2, type: "gap", prompt: "To use a locker, visitors need a ______.", maxWords: 3 },
          { id: "q3", number: 3, type: "gap", prompt: "Volunteers spent ______ years making the model ship.", maxWords: 1 },
          { id: "q4", number: 4, type: "gap", prompt: "Photos cannot be taken in the ______.", maxWords: 2 },
          { id: "q5", number: 5, type: "gap", prompt: "Showing a ticket gives a discount in the ______.", maxWords: 1 },
        ],
      },
    ],
  },
  {
    id: "practice-writing-remote-work",
    section: "writing",
    kind: "exercise",
    order: 1,
    courseIds: WS,
    free: false,
    title: "Task 2: working from home",
    active: true,
    durations: { light: 40, full: 40 },
    writing: [
      {
        id: "task2",
        light: true,
        minWords: 250,
        prompt:
          "More and more people now work from home for at least part of the week.\n\nDo the advantages of this trend outweigh the disadvantages?\n\nGive reasons for your answer and include any relevant examples from your own knowledge or experience.",
      },
    ],
  },
  {
    id: "practice-speaking-free-time",
    section: "speaking",
    kind: "exercise",
    order: 1,
    courseIds: WS,
    free: false,
    title: "Part 1: free time",
    active: true,
    durations: { light: 4, full: 4 },
    speaking: [
      {
        part: 1,
        light: true,
        answerSeconds: 40,
        questions: [
          "What do you usually do in your free time?",
          "Do you prefer spending free time alone or with other people?",
          "Is there a hobby you would like to try in the future?",
          "Did you have more free time when you were a child?",
        ],
      },
    ],
  },
];

/** Sample mocks reuse the diagnostic texts at full length until real mock tests are added. */
const mocks: PracticeTask[] = seedDiagnosticTasks.map((t) => ({
  ...t,
  id: `mock-${t.section}-1`,
  kind: "mock",
  order: 1,
  courseIds: t.section === "writing" || t.section === "speaking" ? WS : ALL,
  free: false,
  title: `Mock test 1 · ${t.title}`,
}));

export const seedPracticeTasks: PracticeTask[] = [...exercises, ...mocks];

export const seedPracticeAnswerKeys: Record<string, AnswerKey> = {
  "practice-reading-night-trains": {
    answers: { q1: ["true"], q2: ["false"], q3: ["not given"], q4: ["true"], q5: ["private cabins", "cabins"], q6: ["public support"] },
  },
  "practice-listening-museum": {
    answers: {
      q1: ["1860", "eighteen sixty"],
      q2: ["coin", "one manat coin", "1 manat coin", "manat coin", "1-manat coin", "one-manat coin"],
      q3: ["six", "6"],
      q4: ["map room"],
      q5: ["café", "cafe"],
    },
  },
  ...Object.fromEntries(
    seedDiagnosticTasks.filter((t) => diagnosticKeys[t.id]).map((t) => [`mock-${t.section}-1`, diagnosticKeys[t.id]]),
  ),
};
