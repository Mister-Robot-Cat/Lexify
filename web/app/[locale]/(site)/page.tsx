import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { JsonLd } from "@/components/JsonLd";
import { MockDashboard } from "@/components/marketing/MockDashboard";
import { Pricing } from "@/components/marketing/Pricing";
import { SectionHeading } from "@/components/marketing/Section";
import { SkillIcon } from "@/components/SkillIcon";
import { skillColor } from "@/lib/band";
import { isLocale, pick } from "@/lib/i18n/config";
import { getMessages } from "@/lib/i18n/messages";
import { SITE_URL } from "@/lib/site";
import { SKILLS } from "@/lib/types";
import { getCourses, getLessonList } from "@/server/content";

export const revalidate = 300;

export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const [m, courses, lessons] = await Promise.all([getMessages(locale), getCourses(), getLessonList()]);
  const home = `/${locale}`;

  return (
    <>
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "Lexify",
            url: SITE_URL,
            logo: `${SITE_URL}/icon.svg`,
          },
          ...courses.map((c) => ({
            "@context": "https://schema.org",
            "@type": "Course",
            name: pick(c.title, locale),
            description: pick(c.description, locale),
            inLanguage: "en",
            provider: { "@type": "Organization", name: "Lexify", sameAs: SITE_URL },
          })),
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: m.home.faq.items.map((f) => ({
              "@type": "Question",
              name: f.q,
              acceptedAnswer: { "@type": "Answer", text: f.a },
            })),
          },
        ]}
      />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -top-40 right-[-10%] h-[520px] w-[520px] rounded-full bg-amber/15 blur-3xl" />
        <div className="container-page grid items-center gap-12 pb-16 pt-10 sm:pt-16 lg:grid-cols-[1.05fr_1fr] lg:pb-24 [&>*]:min-w-0">
          <div>
            <p className="eyebrow">{m.home.eyebrow}</p>
            <h1 className="mt-4 font-display text-4xl font-semibold leading-[1.05] tracking-tight text-balance sm:text-5xl lg:text-6xl">
              {m.home.title}
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-muted">{m.home.subtitle}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href={`${home}/welcome/diagnostic`} className="btn-primary btn-lg">
                {m.home.ctaPrimary} <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href={`${home}/preview`} className="btn-ghost btn-lg">
                {m.home.ctaSecondary}
              </Link>
            </div>
            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold text-ink/75">
              {m.home.trust.map((t) => (
                <li key={t} className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-success" /> {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="lg:pl-6">
            <MockDashboard />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="scroll-mt-20 py-16 sm:py-20">
        <div className="container-page">
          <SectionHeading eyebrow={m.home.how.eyebrow} title={m.home.how.title} />
          <ol className="grid gap-5 md:grid-cols-3">
            {m.home.how.steps.map((s, i) => (
              <li key={s.title} className="card p-6">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-ink font-display text-lg font-semibold text-amber">
                  {i + 1}
                </span>
                <h3 className="mt-4 text-lg font-bold">{s.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted">{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Skills */}
      <section className="bg-ink py-16 text-white sm:py-20">
        <div className="container-page">
          <div className="mb-10 max-w-2xl">
            <p className="eyebrow text-amber">{m.home.skills.eyebrow}</p>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">{m.home.skills.title}</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {SKILLS.map((s) => (
              <div key={s} className="rounded-[var(--radius-card)] border border-white/10 bg-white/[0.04] p-6">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl" style={{ background: skillColor[s].soft, color: skillColor[s].fg }}>
                  <SkillIcon skill={s} />
                </span>
                <h3 className="mt-4 text-lg font-bold">{m.common.skills[s]}</h3>
                <p className="mt-2 text-sm leading-6 text-white/70">{m.home.skills.items[s]}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Courses */}
      <section id="courses" className="scroll-mt-20 py-16 sm:py-20">
        <div className="container-page">
          <SectionHeading eyebrow={m.home.courses.eyebrow} title={m.home.courses.title} />
          <div className="grid gap-5 md:grid-cols-2">
            {courses.map((c) => {
              const count = lessons.filter((l) => l.courseId === c.id).length;
              return (
                <article key={c.id} className="card flex flex-col p-6 sm:p-8">
                  <div className="flex flex-wrap gap-2">
                    {c.skills.map((s) => (
                      <span key={s} className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold" style={{ background: skillColor[s].soft, color: skillColor[s].fg }}>
                        <SkillIcon skill={s} className="h-3.5 w-3.5" /> {m.common.skills[s]}
                      </span>
                    ))}
                  </div>
                  <h3 className="mt-5 font-display text-2xl font-semibold">{pick(c.title, locale)}</h3>
                  <p className="mt-2 flex-1 text-muted">{pick(c.description, locale)}</p>
                  <p className="mt-5 text-sm font-semibold text-ink/70">
                    {count} {m.home.courses.lessons} · {c.mockCount} {m.home.courses.mocks}
                  </p>
                  <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                    <Link href={`${home}/buy/${c.id}?plan=month`} className="btn-primary">
                      {m.home.courses.cta}
                    </Link>
                    <Link href={`${home}/preview`} className="btn-ghost">
                      {m.home.courses.demo}
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="scroll-mt-20 bg-sand/50 py-16 sm:py-20">
        <div className="container-page">
          <SectionHeading eyebrow={m.pricing.eyebrow} title={m.pricing.title} text={m.pricing.subtitle} />
          <Pricing />
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="scroll-mt-20 py-16 sm:py-20">
        <div className="container-page max-w-3xl">
          <SectionHeading eyebrow={m.home.faq.eyebrow} title={m.home.faq.title} />
          <div className="space-y-3">
            {m.home.faq.items.map((f) => (
              <details key={f.q} className="card group p-5 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">
                  {f.q}
                  <span className="text-xl text-muted transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-sm leading-6 text-muted">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="pb-4">
        <div className="container-page">
          <div className="relative overflow-hidden rounded-[2rem] bg-ink px-6 py-12 text-center text-white sm:px-12">
            <div className="pointer-events-none absolute -bottom-24 left-1/2 h-64 w-[36rem] -translate-x-1/2 rounded-full bg-amber/25 blur-3xl" />
            <h2 className="relative font-display text-3xl font-semibold sm:text-4xl">{m.home.final.title}</h2>
            <p className="relative mx-auto mt-3 max-w-xl text-white/75">{m.home.final.text}</p>
            <Link href={`${home}/welcome/diagnostic`} className="btn-accent btn-lg relative mt-7">
              {m.home.final.cta} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
