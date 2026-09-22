import { StudentsService } from '../students/students.service.js';
import { TrainingService } from '../training/training.service.js';

export class ReportsService {
  static async exportClassMatrixCSV(sectionId: string): Promise<string> {
    const data = await StudentsService.getClassTrainingMatrix(sectionId);

    // CSV header: Roll No, Register No, Name, Program 1, Program 2 ..., Avg Attendance %, Completed %
    const headers = [
      'Roll No',
      'Register No',
      'Student Name',
      ...data.programs.map((p) => `"${p.title.replace(/"/g, '""')}"`),
      'Average Attendance %',
      'Completion %',
    ];

    const rows = data.matrix.map((row) => {
      const progCols = data.programs.map((p) => {
        const progStatus = row.programs[p.id];
        if (!progStatus || !progStatus.enrolled) return 'Not Assigned';
        return `${progStatus.status} (${progStatus.attendancePercentage}%)`;
      });

      return [
        `"${row.student.rollNumber}"`,
        `"${row.student.registerNumber}"`,
        `"${row.student.name.replace(/"/g, '""')}"`,
        ...progCols.map((c) => `"${c}"`),
        row.summary.averageAttendance,
        row.summary.completionPercentage,
      ].join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  }

  static async exportAbsenteesCSV(programId: string, departmentId?: string): Promise<string> {
    const result = await TrainingService.getProgramParticipationStatus(programId, departmentId);
    const headers = [
      'Register No',
      'Roll No',
      'Name',
      'Department',
      'Section',
      'Email',
      'Attendance %',
      'Status',
    ];

    const rows = result.cohorts.absent.map((st: any) =>
      [
        `"${st.registerNumber}"`,
        `"${st.rollNumber}"`,
        `"${st.name.replace(/"/g, '""')}"`,
        `"${st.department}"`,
        `"${st.section}"`,
        `"${st.email}"`,
        st.attendancePercentage,
        `"${st.status}"`,
      ].join(',')
    );

    return [headers.join(','), ...rows].join('\n');
  }
}
