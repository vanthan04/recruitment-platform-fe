export type CvStatus = "DRAFT" | "PUBLISHED";
export type CvFileType = "PDF" | "DOC" | "DOCX";

export interface Cv {
  id: string;
  title: string;
  originalName: string;
  fileType: CvFileType;
  mimeType: string;
  fileSize: number | null;
  status: CvStatus;
  createdAt: string;
  updatedAt: string;
  userId: string;
}

export interface CvDownload {
  url: string;
  expiresAt: string;
}
