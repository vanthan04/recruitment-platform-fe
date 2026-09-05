import type { CompanySize, CompanyType } from "@/lib/types/company";
import type { Gender, UserRole, UserStatus } from "@/lib/types/auth";
import type { InterviewStatus } from "@/lib/types/interview";
import type { ApplicationStatus } from "@/lib/types/job-application";
import type { EmploymentType, JobLevel, JobSortOption, JobStatus, WorkMode } from "@/lib/types/job";
import type { NotificationType } from "@/lib/types/notification";

export const EMPLOYMENT_TYPE_LABEL: Record<EmploymentType, string> = {
  FULL_TIME: "Toàn thời gian",
  PART_TIME: "Bán thời gian",
  CONTRACT: "Hợp đồng",
  INTERNSHIP: "Thực tập",
};

export const WORK_MODE_LABEL: Record<WorkMode, string> = {
  ONSITE: "Tại văn phòng",
  HYBRID: "Kết hợp",
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

export const USER_ROLE_LABEL: Record<UserRole, string> = {
  CANDIDATE: "Người tìm việc",
  RECRUITER: "Nhà tuyển dụng",
  ADMIN: "Quản trị viên",
};

export const USER_STATUS_LABEL: Record<UserStatus, string> = {
  PENDING: "Chưa xác thực",
  ACTIVE: "Đang hoạt động",
  BLOCKED: "Đã khoá",
};

export const APPLICATION_STATUS_LABEL: Record<ApplicationStatus, string> = {
  APPLIED: "Đã ứng tuyển",
  SCREENING: "Đang sàng lọc",
  SHORTLISTED: "Vào danh sách rút gọn",
  INTERVIEW: "Phỏng vấn",
  OFFER: "Đề nghị (Offer)",
  HIRED: "Đã tuyển",
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

export const COMPANY_TYPE_LABEL: Record<CompanyType, string> = {
  PRODUCT: "Product",
  OUTSOURCING: "Outsourcing",
  STARTUP: "Startup",
  CONSULTING: "Consulting",
};

export const JOB_STATUS_LABEL: Record<JobStatus, string> = {
  DRAFT: "Nháp",
  OPEN: "Đang tuyển",
  CLOSED: "Đã đóng",
};

export const JOB_SORT_LABEL: Record<JobSortOption, string> = {
  newest: "Mới nhất",
  salary_desc: "Lương cao → thấp",
  views_desc: "Nhiều lượt xem",
};

export const NOTIFICATION_TYPE_LABEL: Record<NotificationType, string> = {
  NEW_APPLICATION: "Ứng viên mới",
  APPLICATION_STATUS_CHANGED: "Cập nhật đơn ứng tuyển",
  NEW_MESSAGE: "Tin nhắn mới",
};

export const INTERVIEW_STATUS_LABEL: Record<InterviewStatus, string> = {
  SCHEDULED: "Đã lên lịch",
  RESCHEDULED: "Đã dời lịch",
  COMPLETED: "Đã hoàn thành",
  CANCELLED: "Đã huỷ",
  NO_SHOW: "Không đến phỏng vấn",
};
