export interface Student {
  id: number;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Subject {
  id: number;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  _count?: {
    lectures: number;
  };
}

export interface Lecture {
  id: number;
  subjectId: number;
  lectureNumber: number;
  date: Date;
  isCompleted: boolean;
  createdBy?: string | null;
  closedBy?: string | null;
  closedAt?: Date | null;
  expiresAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  subject?: Subject;
  attendance?: Attendance[];
  auditLogs?: AuditLog[];
  drafts?: DraftSession[];
  _count?: {
    attendance: number;
    auditLogs: number;
  };
}

export interface Attendance {
  id: number;
  lectureId: number;
  studentId: number;
  status: "present" | "absent" | "pending" | "guest";
  lockedBy?: string | null;
  lockedAt?: Date | null;
  lockedBySession?: string | null;
  createdAt: Date;
  updatedAt: Date;
  lecture?: Lecture;
  student?: Student;
  auditLogs?: AuditLog[];
}

export interface AuditLog {
  id: number;
  lectureId: number;
  attendanceId?: number | null;
  action: "create" | "edit" | "delete" | "status_change" | "complete" | "lock" | "unlock";
  oldStatus?: string | null;
  newStatus?: string | null;
  performedBy?: string | null;
  performedAt: Date;
  lecture?: Lecture;
  attendance?: Attendance;
}

export interface DraftSession {
  id: number;
  lectureId: number;
  sessionId: string;
  savedData: Record<string, unknown>;
  studentIndex: number;
  createdAt: Date;
  updatedAt: Date;
  lecture?: Lecture;
}

export interface DashboardStats {
  totalStudents: number;
  totalSubjects: number;
  totalLectures: number;
  latestLecture: Lecture | null;
  recentActivities: Activity[];
}

export interface Activity {
  id: number;
  type: "lecture" | "student" | "subject";
  description: string;
  date: Date;
}

export interface ImportResult {
  added: number;
  duplicates: number;
  total: number;
}

export interface LectureAttendanceResult {
  lectureId: number;
  totalStudents: number;
  presentCount: number;
  absentCount: number;
  subjectId: number;
}

export interface ReportData {
  studentName: string;
  lectures: {
    lectureNumber: number;
    date: string;
    status: "present" | "absent";
  }[];
  attendancePercentage: number;
  presentCount: number;
  absentCount: number;
}
