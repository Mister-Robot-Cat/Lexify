import { SITE_URL } from "@/lib/site";

export const dynamic = "force-static";

export function GET() {
  const body = `# Lexify

> Lexify is an online platform for IELTS Academic self-study. Learners take a free diagnostic test in Reading, Listening, Writing and Speaking, then study with lessons, practice tests and automated feedback on essays and speaking answers. The interface is available in Azerbaijani, English and Russian.

## Main pages
- [Home](${SITE_URL}/en): overview, courses and pricing
- [Demo](${SITE_URL}/en/preview): lesson list, free lessons and sample dashboards, no account needed
- [Free diagnostic](${SITE_URL}/en/welcome/diagnostic): four-skill placement test with a band for each skill

## Free lessons
- [How IELTS Reading works](${SITE_URL}/en/preview/lessons/reading-how-it-works)
- [The four Listening sections](${SITE_URL}/en/preview/lessons/listening-sections)
- [A Task 2 structure that always works](${SITE_URL}/en/preview/lessons/writing-task2-structure)

## Policies
- [Terms of service](${SITE_URL}/en/terms)
- [Privacy policy](${SITE_URL}/en/privacy)
- [Refund policy](${SITE_URL}/en/refund-policy): 7-day money-back guarantee, plans are one-time purchases without automatic renewal

## Languages
Every page is available under /az, /en and /ru.
`;
  return new Response(body, { headers: { "content-type": "text/plain; charset=utf-8" } });
}
