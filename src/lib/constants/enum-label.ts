import type { CompanySize } from "@/lib/types/company";
import type { Gender } from "@/lib/types/auth";
import type { ApplicationStatus } from "@/lib/types/job-application";
import type { JobLevel, JobType } from "@/lib/types/job";

export const JOB_TYPE_LABEL: Record<JobType, string> = {
  FULL_TIME: "Toàn thời gian",
  PART_TIME: "Bán thời gian",
  CONTRACT: "Hợp đồng",
  INTERNSHIP: "Thực tập",
  REMOTE: "Từ xa",
};

export const JOB_LEVEL_LABEL: Record<JobLevel, string> = {
  INTERN: "Thực tập sinh",
  FRESHER: "Fresher",
  JUNIOR: "Junior",
  MIDDLE: "Middle",
  SENIOR: "Senior",
  MANAGER: "Quản lý",
};

export const GENDER_LABEL: Record<Gender, string> = {
  MALE: "Nam",
  FEMALE: "Nữ",
  OTHER: "Khác",
};

export const APPLICATION_STATUS_LABEL: Record<ApplicationStatus, string> = {
  PENDING: "Đang chờ duyệt",
  ACCEPTED: "Đã chấp nhận",
  REJECTED: "Đã từ chối",
  WITHDRAWN: "Đã rút đơn",
};

export const COMPANY_SIZE_LABEL: Record<CompanySize, string> = {
  SIZE_1_10: "1 - 10 nhân viên",
  SIZE_11_50: "11 - 50 nhân viên",
  SIZE_51_200: "51 - 200 nhân viên",
  SIZE_201_500: "201 - 500 nhân viên",
  SIZE_500_PLUS: "Trên 500 nhân viên",
};
