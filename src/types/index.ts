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
  createdAt: Date;
  updatedAt: Date;
  subject?: Subject;
  attendance?: Attendance[];
  _count?: {
    attendance: number;
  };
}

export interface Attendance {
  id: number;
  lectureId: number;
  studentId: number;
  status: "present" | "absent";
  createdAt: Date;
  updatedAt: Date;
  lecture?: Lecture;
  student?: Student;
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
