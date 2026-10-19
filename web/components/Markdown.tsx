import ReactMarkdown from "react-markdown";

/** Lesson text renderer. react-markdown ignores raw HTML, so admin content can't inject scripts. */
export function Markdown({ children }: { children: string }) {
  return (
    <div className="prose-lx">
      <ReactMarkdown>{children}</ReactMarkdown>
    </div>
  );
}
