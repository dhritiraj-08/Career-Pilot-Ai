import { DocumentTab } from "./document-tab";

export function CoverLetterTab({ content }: { content: string }) {
  return <DocumentTab title="Cover Letter" filename="cover-letter.pdf" content={content} />;
}
