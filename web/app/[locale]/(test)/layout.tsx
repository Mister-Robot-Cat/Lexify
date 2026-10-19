export const metadata = { robots: { index: false } };

/** Distraction-free layout for tests: no site header or footer. */
export default function TestLayout({ children }: { children: React.ReactNode }) {
  return children;
}
