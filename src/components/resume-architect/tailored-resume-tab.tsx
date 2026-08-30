import { DocumentTab } from "./document-tab";

export function TailoredResumeTab({ content }: { content: string }) {
  return <DocumentTab title="Tailored Resume" filename="tailored-resume.pdf" content={content} />;
}
