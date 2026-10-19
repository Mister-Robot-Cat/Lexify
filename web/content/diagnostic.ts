/**
 * Placeholder diagnostic pool: one task per section. `npm run seed` writes the
 * tasks to `diagnosticTasks` and the answers to `answerKeys` (server-only).
 * Add more tasks per section and each new user is randomly assigned one.
 */
import type { AnswerKey, DiagnosticTask } from "@/lib/diagnostic/types";

const TFNG = "Do the following statements agree with the information in the passage? Choose TRUE if the statement agrees with the information, FALSE if it contradicts it, and NOT GIVEN if there is no information on this.";

export const seedDiagnosticTasks: DiagnosticTask[] = [
  {
    id: "reading-rooftops",
    section: "reading",
    title: "Farming on the rooftops",
    active: true,
    durations: { light: 15, full: 20 },
    passages: [
      {
        id: "p1",
        title: "Farming on the rooftops",
        text: `**A** For most of the twentieth century, city planners treated food as something that arrived from elsewhere. Farms belonged to the countryside, and the job of the city was to buy, store and sell what they produced. Over the past two decades, however, a growing number of architects and entrepreneurs have begun to look upwards. Flat roofs, which cover a surprisingly large share of many urban areas, are being turned into vegetable gardens, greenhouses and even small fish farms.

**B** The first commercial rooftop farms appeared in North America in the late 2000s. Early projects were small and depended heavily on volunteers, but within ten years several companies were selling salad leaves and herbs to supermarkets all year round. Their main advantage was distance: lettuce picked in the morning could be on a shop shelf the same afternoon, so it needed no refrigerated transport and lasted longer in customers' kitchens.

**C** Supporters also point to benefits for the buildings themselves. A layer of soil and plants absorbs rainwater that would otherwise rush into overloaded drains during storms, and it shields the roof from direct sunlight. In one study of a supermarket in Montreal, the cooling effect of the farm above reduced the store's summer energy bills by around a quarter. Plants also provide a home for bees and birds in areas where green space is scarce.

**D** Yet rooftop farming is far from easy. Most older buildings were never designed to carry the weight of wet soil, so engineers must often strengthen the structure before a single seed is planted. Many growers therefore prefer hydroponic systems, in which plants grow in water enriched with nutrients rather than in earth. These systems are lighter and use less water overall, but they require pumps, sensors and a reliable supply of electricity.

**E** Cost remains the biggest obstacle. Building a commercial greenhouse on a roof can be several times more expensive than building one on the ground, and the area available is limited. As a result, rooftop farms tend to grow high-value crops such as herbs, microgreens and tomatoes rather than staples like wheat or potatoes. Critics argue that, for this reason, such farms will never feed a city; at best they add fresh produce to the diets of people who can already afford it.

**F** Defenders of the idea accept that rooftops will not replace traditional agriculture. Instead, they see them as part of a wider network that includes community gardens, vertical farms inside warehouses and conventional farms on the edge of the city. Some local governments now offer tax reductions to building owners who install green roofs, and new buildings in a few cities must include them by law. Whether these policies spread may depend less on technology than on how much city residents value food they can watch being grown.`,
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
          { id: "r1", number: 1, type: "tfng", prompt: "Flat roofs make up only a very small part of most cities." },
          { id: "r2", number: 2, type: "tfng", prompt: "The earliest commercial rooftop farms relied on unpaid helpers." },
          { id: "r3", number: 3, type: "tfng", prompt: "Rooftop farms in North America now sell more vegetables than rural farms in the same region." },
          { id: "r4", number: 4, type: "tfng", prompt: "Salad grown on roofs stays fresh longer at home than salad transported from far away." },
          { id: "r5", number: 5, type: "tfng", prompt: "Hydroponic systems need more water than growing plants in soil." },
        ],
      },
      {
        id: "g2",
        typeLabel: "Multiple choice",
        instructions: "Choose the correct letter, A, B, C or D.",
        passageId: "p1",
        light: true,
        questions: [
          {
            id: "r6",
            number: 6,
            type: "mcq",
            prompt: "According to paragraph C, the farm on the Montreal supermarket",
            options: [
              { value: "A", label: "produced enough food for the store." },
              { value: "B", label: "lowered the cost of cooling the building." },
              { value: "C", label: "attracted more customers in summer." },
              { value: "D", label: "caused problems with the drains." },
            ],
          },
          {
            id: "r7",
            number: 7,
            type: "mcq",
            prompt: "Why do many rooftop growers choose hydroponic systems?",
            options: [
              { value: "A", label: "They are cheaper to install." },
              { value: "B", label: "They do not need electricity." },
              { value: "C", label: "They put less weight on the building." },
              { value: "D", label: "They produce larger plants." },
            ],
          },
          {
            id: "r8",
            number: 8,
            type: "mcq",
            prompt: "What is the critics' main argument in paragraph E?",
            options: [
              { value: "A", label: "Rooftop farms damage old buildings." },
              { value: "B", label: "Rooftop crops are less healthy than field crops." },
              { value: "C", label: "Rooftop farms cannot grow enough basic food for a whole city." },
              { value: "D", label: "Rooftop farms take land away from parks." },
            ],
          },
          {
            id: "r9",
            number: 9,
            type: "mcq",
            prompt: "What does the writer suggest in the final paragraph?",
            options: [
              { value: "A", label: "Rooftop farms will soon replace conventional farms." },
              { value: "B", label: "Public attitudes may decide the future of rooftop farming." },
              { value: "C", label: "Tax reductions have failed to encourage green roofs." },
              { value: "D", label: "Vertical farms are more efficient than rooftop farms." },
            ],
          },
        ],
      },
      {
        id: "g3",
        typeLabel: "Sentence completion",
        instructions: "Complete the sentences below. Choose NO MORE THAN TWO WORDS from the passage for each answer.",
        passageId: "p1",
        light: false,
        questions: [
          { id: "r10", number: 10, type: "gap", maxWords: 2, prompt: "Plants on roofs soak up ______ that might otherwise flood the drains." },
          { id: "r11", number: 11, type: "gap", maxWords: 2, prompt: "Before planting, engineers may need to ______ the building." },
          { id: "r12", number: 12, type: "gap", maxWords: 2, prompt: "Because space is limited, rooftop farms focus on ______ such as herbs and tomatoes." },
          { id: "r13", number: 13, type: "gap", maxWords: 2, prompt: "In some cities, the law requires ______ to have green roofs." },
        ],
      },
    ],
  },
  {
    id: "listening-sports-centre",
    section: "listening",
    title: "Booking a tennis court",
    active: true,
    durations: { light: 8, full: 10 },
    audio: [
      {
        id: "s1",
        title: "Section 1",
        url: "/audio/diag-listening-1.mp3",
        transcript: `Receptionist: Good morning, Riverside Sports Centre, this is Mark speaking. How can I help you?
Caller: Hi, I'd like to book a tennis court, please.
Receptionist: Of course. Can I take your name first?
Caller: Yes, it's Daniel Harper. That's H, A, R, P, E, R.
Receptionist: Thank you, Mr Harper. And a contact phone number?
Caller: Sure, it's 0775 910 342.
Receptionist: Which day were you thinking of?
Caller: I was hoping for Friday evening, but my sister can't make it then, so let's say Saturday.
Receptionist: Saturday is fine. We have courts free at nine o'clock and at ten thirty in the morning.
Caller: Nine is a bit early for us. Ten thirty, please.
Receptionist: Would you like an outdoor court or an indoor one? The outdoor courts are cheaper.
Caller: The forecast says rain all weekend, so we'd better go for indoor.
Receptionist: Do you need to hire anything? We have balls, rackets and shoes.
Caller: We've got plenty of balls, and everyone has their own shoes, but could we hire rackets?
Receptionist: How many people will be playing? It was just going to be you and your sister, was it?
Caller: At first, yes, but two friends from my course are joining us, so there'll be four of us.
Receptionist: Are any of you members of the centre?
Caller: No, we're not members, but we're all students at the university.
Receptionist: Then you get the student discount, which is twenty percent. The early booking discount only applies on weekdays.
Caller: Will there be a coach? My friends are beginners.
Receptionist: Yes, our coach, Sophie, will meet you. She usually waits at the main entrance, but on Saturdays it's very busy there, so please meet her in the café instead.
Caller: Is there anything we need to bring?
Receptionist: Towels and water are provided in the changing rooms, but each of you must bring your student card, otherwise we can't give you the discount.`,
      },
    ],
    groups: [
      {
        id: "g1",
        typeLabel: "Form completion",
        instructions: "Complete the form below. Write ONE WORD AND/OR A NUMBER for each answer.",
        light: true,
        questions: [
          { id: "l1", number: 1, type: "gap", maxWords: 1, prompt: "Name: Daniel ______" },
          { id: "l2", number: 2, type: "gap", maxWords: 3, prompt: "Phone number: ______" },
          { id: "l3", number: 3, type: "gap", maxWords: 1, prompt: "Day of booking: ______" },
          { id: "l4", number: 4, type: "gap", maxWords: 1, prompt: "Start time: ______ a.m." },
          { id: "l5", number: 5, type: "gap", maxWords: 1, prompt: "Type of court: ______" },
          { id: "l6", number: 6, type: "gap", maxWords: 1, prompt: "Equipment to hire: ______" },
        ],
      },
      {
        id: "g2",
        typeLabel: "Multiple choice",
        instructions: "Choose the correct letter, A, B or C.",
        light: false,
        questions: [
          { id: "l7", number: 7, type: "mcq", prompt: "How many people will play?", options: [{ value: "A", label: "two" }, { value: "B", label: "three" }, { value: "C", label: "four" }] },
          { id: "l8", number: 8, type: "mcq", prompt: "Which discount will the group receive?", options: [{ value: "A", label: "a student discount" }, { value: "B", label: "a members' discount" }, { value: "C", label: "an early booking discount" }] },
          { id: "l9", number: 9, type: "mcq", prompt: "Where will the group meet the coach?", options: [{ value: "A", label: "at the main entrance" }, { value: "B", label: "in the café" }, { value: "C", label: "next to the courts" }] },
          { id: "l10", number: 10, type: "mcq", prompt: "What must each person bring?", options: [{ value: "A", label: "a student card" }, { value: "B", label: "a towel" }, { value: "C", label: "a water bottle" }] },
        ],
      },
    ],
  },
  {
    id: "writing-internet-universities",
    section: "writing",
    title: "Internet access and universities",
    active: true,
    durations: { light: 40, full: 60 },
    writing: [
      {
        id: "task1",
        light: false,
        minWords: 150,
        prompt:
          "The chart below shows the percentage of households with internet access in four countries in 2005 and 2020.\n\nSummarise the information by selecting and reporting the main features, and make comparisons where relevant.",
        chart: {
          title: "Households with internet access",
          unit: "%",
          categories: ["Azerbaijan", "Brazil", "Germany", "Japan"],
          series: [
            { name: "2005", values: [8, 13, 62, 57] },
            { name: "2020", values: [84, 71, 95, 91] },
          ],
        },
      },
      {
        id: "task2",
        light: true,
        minWords: 250,
        prompt:
          "Some people believe that universities should focus on preparing students for specific jobs. Others think that the main purpose of a university is to give students a broad education.\n\nDiscuss both views and give your own opinion.\n\nGive reasons for your answer and include any relevant examples from your own knowledge or experience.",
      },
    ],
  },
  {
    id: "speaking-skills",
    section: "speaking",
    title: "Learning new skills",
    active: true,
    durations: { light: 6, full: 12 },
    speaking: [
      {
        part: 1,
        light: true,
        lightCount: 3,
        answerSeconds: 40,
        questions: [
          "Let's talk about where you live. Do you live in a house or an apartment?",
          "What do you like most about the area where you live?",
          "Do you prefer to study in the morning or in the evening? Why?",
          "How often do you use your phone to learn something new?",
        ],
      },
      {
        part: 2,
        light: true,
        prepSeconds: 60,
        answerSeconds: 120,
        questions: ["Describe a skill that took you a long time to learn."],
        cueCard: {
          topic: "Describe a skill that took you a long time to learn.",
          bullets: ["what the skill is", "when and how you learned it", "why it took a long time", "and explain how you feel about this skill now."],
        },
      },
      {
        part: 3,
        light: false,
        answerSeconds: 60,
        questions: [
          "Why do some people find it easier than others to learn new skills?",
          "Is it better to learn practical skills from a teacher or from the internet?",
          "Which skills do you think will be most important for young people in the future?",
          "Should schools spend more time teaching practical skills such as cooking or managing money?",
        ],
      },
    ],
  },
];

export const seedAnswerKeys: Record<string, AnswerKey> = {
  "reading-rooftops": {
    answers: {
      r1: ["false"],
      r2: ["true"],
      r3: ["not given"],
      r4: ["true"],
      r5: ["false"],
      r6: ["B"],
      r7: ["C"],
      r8: ["C"],
      r9: ["B"],
      r10: ["rainwater"],
      r11: ["strengthen", "strengthen the structure"],
      r12: ["high-value crops", "high value crops"],
      r13: ["new buildings"],
    },
  },
  "listening-sports-centre": {
    answers: {
      l1: ["harper"],
      l2: ["0775 910 342", "0775910342", "07759 10342"],
      l3: ["saturday"],
      l4: ["10.30", "10:30", "ten thirty", "1030"],
      l5: ["indoor"],
      l6: ["rackets", "racket", "racquets"],
      l7: ["C"],
      l8: ["A"],
      l9: ["B"],
      l10: ["A"],
    },
  },
};
