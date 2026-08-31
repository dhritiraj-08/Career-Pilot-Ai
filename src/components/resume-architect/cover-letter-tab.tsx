import { DocumentTab } from "./document-tab";

interface CoverLetterTabProps {
  content: string;
  candidateName: string;
}

export function CoverLetterTab({ content, candidateName }: CoverLetterTabProps) {
  return (
    <DocumentTab
      documentType="coverLetter"
      filename="cover-letter.pdf"
      candidateName={candidateName}
      content={content}
    />
  );
}
