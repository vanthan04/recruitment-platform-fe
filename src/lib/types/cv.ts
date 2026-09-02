export type CvStatus = "DRAFT" | "PUBLISHED";

export interface Experience {
  id?: string;
  company: string;
  position: string;
  startDate: string;
  endDate?: string;
  isCurrent?: boolean;
  description?: string;
}

export interface Education {
  id?: string;
  school: string;
  degree: string;
  startDate: string;
  endDate?: string;
  fieldOfStudy?: string;
  description?: string;
}

export interface Skill {
  id?: string;
  name: string;
  level?: string;
}

export interface Cv {
  id: string;
  title: string;
  summary: string | null;
  fileUrl: string | null;
  status: CvStatus;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  experiences: Experience[];
  educations: Education[];
  skills: Skill[];
}

export interface CvInput {
  title: string;
  summary?: string;
  experiences?: Experience[];
  educations?: Education[];
  skills?: Skill[];
}
