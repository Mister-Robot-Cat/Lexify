/**
 * Placeholder catalogue. `npm run seed` copies it into Firestore, and the
 * public pages fall back to it when Firebase is not configured yet.
 * Replace it with your own courses and lessons (see README → Content).
 */
import type { Course, Lesson } from "@/lib/types";

export const seedCourses: Course[] = [
  {
    id: "ielts-academic",
    order: 1,
    published: true,
    skills: ["reading", "listening", "writing", "speaking"],
    mockCount: 4,
    title: {
      en: "IELTS Academic Complete",
      az: "IELTS Academic Tam kurs",
      ru: "IELTS Academic: полный курс",
    },
    description: {
      en: "Every skill from first lesson to full mock tests, with AI feedback on Writing and Speaking.",
      az: "İlk dərsdən tam sınaq testlərinə qədər bütün bacarıqlar, Writing və Speaking üzrə süni intellekt rəyi ilə.",
      ru: "Все навыки от первого урока до полных пробных тестов, с проверкой Writing и Speaking от ИИ.",
    },
  },
  {
    id: "writing-speaking",
    order: 2,
    published: true,
    skills: ["writing", "speaking"],
    mockCount: 2,
    title: {
      en: "Writing & Speaking Intensive",
      az: "Writing və Speaking intensivi",
      ru: "Интенсив Writing и Speaking",
    },
    description: {
      en: "For candidates whose productive skills hold the overall band back. Unlimited AI-scored essays and speaking answers.",
      az: "Ümumi balını produktiv bacarıqlar aşağı salan namizədlər üçün. Limitsiz süni intellektlə qiymətləndirilən esse və danışıq cavabları.",
      ru: "Для тех, у кого общий балл тянут вниз продуктивные навыки. Неограниченная проверка эссе и устных ответов ИИ.",
    },
  },
];

const L = (en: string, az: string, ru: string) => ({ en, az, ru });

export const seedLessons: Lesson[] = [
  {
    id: "reading-how-it-works",
    courseId: "ielts-academic",
    skill: "reading",
    order: 1,
    minutes: 8,
    free: true,
    published: true,
    title: L("How IELTS Reading works", "IELTS Reading necə qurulub", "Как устроен IELTS Reading"),
    summary: L(
      "Three passages, 40 questions, 60 minutes: how to split your time.",
      "Üç mətn, 40 sual, 60 dəqiqə: vaxtı necə bölmək lazımdır.",
      "Три текста, 40 вопросов, 60 минут: как распределить время.",
    ),
    body: `## The format in one minute

IELTS Academic Reading has **three passages** and **40 questions**, and you have **60 minutes** in total. There is no extra time to transfer answers, so write them in the answer sheet as you go.

The passages get harder, so give yourself less time on the first one:

- Passage 1: about 17 minutes
- Passage 2: about 20 minutes
- Passage 3: about 23 minutes

## Read the questions first

Skim the passage title and headings for 30 seconds, then read the questions. Underline the **key words** that are unlikely to be paraphrased: names, dates, numbers and technical terms. These are your anchors for scanning.

> The answers to most question types appear **in the same order** as the text. Matching headings and matching information are the main exceptions.

## Your raw score and your band

Every correct answer is one mark. A raw score of 30 out of 40 is roughly band 7.0 in Academic Reading, and 23 is roughly band 6.0. Spelling counts, so check every word you copy.

### Try it

Open the Reading practice and do one passage with a 17-minute timer. Afterwards, look at which question type cost you the most marks.`,
  },
  {
    id: "reading-tfng",
    courseId: "ielts-academic",
    skill: "reading",
    order: 2,
    minutes: 12,
    free: false,
    published: true,
    title: L("True / False / Not Given without guesswork", "Təxminsiz True / False / Not Given", "True / False / Not Given без угадывания"),
    summary: L(
      "A three-question test that tells False and Not Given apart.",
      "False və Not Given-i ayırd edən üç sual.",
      "Три вопроса, которые отличают False от Not Given.",
    ),
    body: `## Placeholder lesson

Replace this text with your own lesson on True / False / Not Given.`,
  },
  {
    id: "reading-headings",
    courseId: "ielts-academic",
    skill: "reading",
    order: 3,
    minutes: 10,
    free: false,
    published: true,
    title: L("Matching headings", "Başlıqların uyğunlaşdırılması", "Подбор заголовков"),
    summary: L(
      "Find the main idea of a paragraph in under a minute.",
      "Abzasın əsas fikrini bir dəqiqədən az müddətdə tap.",
      "Находим главную мысль абзаца меньше чем за минуту.",
    ),
    body: `## Placeholder lesson

Replace this text with your own lesson on matching headings.`,
  },
  {
    id: "listening-sections",
    courseId: "ielts-academic",
    skill: "listening",
    order: 1,
    minutes: 7,
    free: true,
    published: true,
    title: L("The four Listening sections", "Listening-in dörd bölməsi", "Четыре секции Listening"),
    summary: L(
      "What each section sounds like and where candidates lose marks.",
      "Hər bölmə necə səslənir və namizədlər harada bal itirir.",
      "Как звучит каждая секция и где теряют баллы.",
    ),
    body: `## Four recordings, heard once

The test has **four sections** and **40 questions**. Each recording is played **once**, and the whole test takes about 30 minutes plus time to check answers.

1. **Section 1:** an everyday conversation, for example booking a room. Expect names, numbers and dates.
2. **Section 2:** a monologue on an everyday topic, such as a tour guide's talk.
3. **Section 3:** a conversation between students and a tutor about an assignment.
4. **Section 4:** an academic lecture with no break in the middle. This is usually the hardest part.

## Use the reading time

Before each section you get time to read the questions. Predict the **type of answer**: a number, a name, a noun or an adjective. When you know what you're listening for, you hear it faster.

## Spelling traps

Names are often spelled out letter by letter. Practise the letters that sound alike in English: **A, E, I** and **G, J**. Numbers such as **fifteen** and **fifty** are another classic trap.

> Write exactly what you hear, and check the word limit: "NO MORE THAN TWO WORDS" means a three-word answer is wrong even if the words are right.`,
  },
  {
    id: "listening-maps",
    courseId: "ielts-academic",
    skill: "listening",
    order: 2,
    minutes: 9,
    free: false,
    published: true,
    title: L("Maps and plans", "Xəritələr və planlar", "Карты и планы"),
    summary: L(
      "Directions vocabulary you need for Section 2.",
      "Section 2 üçün istiqamət lüğəti.",
      "Лексика направлений для Section 2.",
    ),
    body: `## Placeholder lesson

Replace this text with your own lesson on maps and plans.`,
  },
  {
    id: "listening-lectures",
    courseId: "ielts-academic",
    skill: "listening",
    order: 3,
    minutes: 11,
    free: false,
    published: true,
    title: L("Following a lecture", "Mühazirəni izləmək", "Как не потеряться в лекции"),
    summary: L(
      "Signposting language that tells you a new answer is coming.",
      "Yeni cavabın gəldiyini bildirən keçid ifadələri.",
      "Слова-сигналы, которые подсказывают, что сейчас прозвучит ответ.",
    ),
    body: `## Placeholder lesson

Replace this text with your own lesson on lectures.`,
  },
  {
    id: "writing-task2-structure",
    courseId: "ielts-academic",
    skill: "writing",
    order: 1,
    minutes: 10,
    free: true,
    published: true,
    title: L("A Task 2 structure that always works", "Həmişə işləyən Task 2 strukturu", "Структура Task 2, которая работает всегда"),
    summary: L(
      "Four paragraphs, 260–290 words, 40 minutes.",
      "Dörd abzas, 260–290 söz, 40 dəqiqə.",
      "Четыре абзаца, 260–290 слов, 40 минут.",
    ),
    body: `## What the examiner scores

Task 2 is marked on four criteria, each worth a quarter of the score:

- **Task Response:** do you answer every part of the question and keep a clear position?
- **Coherence and Cohesion:** is the essay logically organised, with one main idea per paragraph?
- **Lexical Resource:** range and accuracy of vocabulary.
- **Grammatical Range and Accuracy:** variety and accuracy of sentence structures.

## Four paragraphs

1. **Introduction (2 sentences):** paraphrase the question, then state your position.
2. **Body 1 (5–6 sentences):** your first main reason, explained and supported with an example.
3. **Body 2 (5–6 sentences):** your second reason, or the other side if the question asks for both views.
4. **Conclusion (1–2 sentences):** restate your position in new words.

Aim for **260–290 words**. Fewer than 250 words is penalised, and much longer essays usually contain more mistakes.

## Spend five minutes planning

Write down your position and one idea per body paragraph before you start. Essays that are planned score higher on Coherence almost every time.

> Try it now: the diagnostic Writing task gives you an AI score on all four criteria.`,
  },
  {
    id: "writing-task1-overview",
    courseId: "ielts-academic",
    skill: "writing",
    order: 2,
    minutes: 9,
    free: false,
    published: true,
    title: L("Task 1: writing the overview", "Task 1: icmalın yazılması", "Task 1: как писать overview"),
    summary: L(
      "The single sentence that decides your Task Achievement score.",
      "Task Achievement balını həll edən bir cümlə.",
      "Одно предложение, от которого зависит Task Achievement.",
    ),
    body: `## Placeholder lesson

Replace this text with your own lesson on Task 1 overviews.`,
  },
  {
    id: "writing-cohesion",
    courseId: "ielts-academic",
    skill: "writing",
    order: 3,
    minutes: 8,
    free: false,
    published: true,
    title: L("Linking ideas naturally", "Fikirləri təbii əlaqələndirmək", "Естественные связки между идеями"),
    summary: L(
      "Why fewer linking words often score higher.",
      "Niyə daha az bağlayıcı söz çox vaxt daha yüksək bal gətirir.",
      "Почему меньше связок часто даёт более высокий балл.",
    ),
    body: `## Placeholder lesson

Replace this text with your own lesson on cohesion.`,
  },
  {
    id: "speaking-part2",
    courseId: "ielts-academic",
    skill: "speaking",
    order: 1,
    minutes: 9,
    free: false,
    published: true,
    title: L("Two minutes on any Part 2 topic", "İstənilən Part 2 mövzusunda iki dəqiqə", "Две минуты на любую тему Part 2"),
    summary: L(
      "Use the one minute of preparation to plan a story.",
      "Bir dəqiqəlik hazırlıqdan hekayə planlamaq üçün istifadə et.",
      "Используйте минуту подготовки, чтобы спланировать историю.",
    ),
    body: `## Placeholder lesson

Replace this text with your own lesson on Speaking Part 2.`,
  },
  {
    id: "speaking-fluency",
    courseId: "ielts-academic",
    skill: "speaking",
    order: 2,
    minutes: 7,
    free: false,
    published: true,
    title: L("Fluency without memorised answers", "Əzbərlənmiş cavablarsız axıcılıq", "Беглость без заученных ответов"),
    summary: L(
      "Fillers, self-correction and how examiners hear them.",
      "Doldurucu sözlər, özünü düzəltmə və imtahançılar bunları necə qəbul edir.",
      "Слова-паразиты, самоисправление и как их слышит экзаменатор.",
    ),
    body: `## Placeholder lesson

Replace this text with your own lesson on fluency.`,
  },
  {
    id: "speaking-part3",
    courseId: "ielts-academic",
    skill: "speaking",
    order: 3,
    minutes: 10,
    free: false,
    published: true,
    title: L("Part 3: answering abstract questions", "Part 3: mücərrəd suallara cavab", "Part 3: ответы на абстрактные вопросы"),
    summary: L(
      "Give an opinion, a reason and an example every time.",
      "Hər dəfə fikir, səbəb və nümunə ver.",
      "Каждый раз: мнение, причина и пример.",
    ),
    body: `## Placeholder lesson

Replace this text with your own lesson on Speaking Part 3.`,
  },
  {
    id: "ws-task2-ideas",
    courseId: "writing-speaking",
    skill: "writing",
    order: 1,
    minutes: 8,
    free: false,
    published: true,
    title: L("Generating ideas fast", "Fikirləri tez tapmaq", "Как быстро находить идеи"),
    summary: L(
      "A two-minute brainstorm for any Task 2 topic.",
      "İstənilən Task 2 mövzusu üçün iki dəqiqəlik beyin həmləsi.",
      "Двухминутный мозговой штурм для любой темы Task 2.",
    ),
    body: `## Placeholder lesson

Replace this text with your own lesson.`,
  },
  {
    id: "ws-pronunciation",
    courseId: "writing-speaking",
    skill: "speaking",
    order: 1,
    minutes: 8,
    free: false,
    published: true,
    title: L("Word stress and intonation", "Söz vurğusu və intonasiya", "Ударение и интонация"),
    summary: L(
      "The pronunciation features that move your score most.",
      "Balına ən çox təsir edən tələffüz xüsusiyyətləri.",
      "Особенности произношения, которые сильнее всего влияют на балл.",
    ),
    body: `## Placeholder lesson

Replace this text with your own lesson.`,
  },
];
