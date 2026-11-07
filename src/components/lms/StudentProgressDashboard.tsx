import React from 'react';

export interface ModuleProgressMetric {
  className: string;
  shortLabel: string;
  lessonId: string;
  isCompleted: boolean;
  completionRate: number; // 0 - 100
  timeSpentMinutes: number;
  materialsReadyCount: number;
  totalMaterialsCount: number;
}

interface StudentProgressDashboardProps {
  courseTitle: string;
  courseId: string;
  currentClass: string;
  moduleMetrics: ModuleProgressMetric[];
  onSelectClass: (className: string) => void;
  onToggleComplete: (className: string, lessonId: string) => void;
  onAddStudyMinutes?: (className: string, minutesToAdd: number) => void;
}

export const StudentProgressDashboard: React.FC<StudentProgressDashboardProps> = () => {
  return (
    <section
      id="student-progress-dashboard"
      aria-label="Student Progress Dashboard"
      className="hidden"
    />
  );
};
