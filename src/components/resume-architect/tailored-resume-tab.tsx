import { DocumentTab } from "./document-tab";

interface TailoredResumeTabProps {
  content: string;
  candidateName: string;
}

export function TailoredResumeTab({ content, candidateName }: TailoredResumeTabProps) {
  return (
    <DocumentTab
      documentType="resume"
      filename="tailored-resume.pdf"
      candidateName={candidateName}
      content={content}
    />
  );
}
