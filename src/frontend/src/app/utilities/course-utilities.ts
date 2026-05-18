/**
 * Course & Assignment Utility Functions
 * Safe helpers for calculations with null/undefined checking
 */

import { Course, Assignment } from '../tokens';

/**
 * Get safe assignment count
 */
export function getAssignmentCount(course: Course | undefined | null): number {
  return course?.assignments?.length ?? 0;
}

/**
 * Get safe completed assignment count
 */
export function getCompletedCount(course: Course | undefined | null): number {
  return course?.done ?? 0;
}

/**
 * Calculate progress percentage
 */
export function getProgressPercentage(course: Course | undefined | null): number {
  const total = getAssignmentCount(course);
  if (total === 0) return 0;
  const completed = getCompletedCount(course);
  return Math.round((completed / total) * 100);
}

/**
 * Check if course passed based on threshold
 */
export function hasPassedCourse(course: Course | undefined | null): boolean {
  if (!course) return false;
  const total = getAssignmentCount(course);
  if (total === 0) return false;
  const completed = getCompletedCount(course);
  const requiredPercentage = (course.pass_threshold ?? 100) / 100;
  return (completed / total) >= requiredPercentage;
}

/**
 * Calculate remaining assignments needed to pass
 */
export function getRemainingToPass(course: Course | undefined | null): number {
  if (!course) return 0;
  const total = getAssignmentCount(course);
  if (total === 0) return 0;
  const completed = getCompletedCount(course);
  const threshold = course.pass_threshold ?? 100;
  const required = Math.ceil((total * threshold) / 100);
  return Math.max(0, required - completed);
}

/**
 * Get progress label for display
 */
export function getProgressLabel(course: Course | undefined | null): string {
  if (!course) {
    return 'No course data';
  }

  const total = getAssignmentCount(course);
  const completed = getCompletedCount(course);
  const threshold = course.pass_threshold ?? 100;

  if (total === 0) {
    return 'No assignments yet';
  }

  if (hasPassedCourse(course)) {
    return 'Threshold met — class passed';
  }

  const remaining = getRemainingToPass(course);
  return `${remaining} more assignment(s) to reach ${threshold}% threshold`;
}

/**
 * Validate course object has required fields
 */
export function isValidCourse(course: any): course is Course {
  return (
    course &&
    typeof course.id === 'number' &&
    typeof course.name === 'string' &&
    Array.isArray(course.assignments) &&
    typeof course.done === 'number' &&
    typeof course.pass_threshold === 'number'
  );
}

/**
 * Type-safe course calculations with all safety checks
 */
export const courseCalculations = {
  getTotalAssignments: (course: Course | undefined | null): number => {
    return course?.assignments?.length ?? 0;
  },

  getCompletedAssignments: (course: Course | undefined | null): number => {
    return course?.done ?? 0;
  },

  getPendingAssignments: (course: Course | undefined | null): number => {
    const total = course?.assignments?.length ?? 0;
    const completed = course?.done ?? 0;
    return Math.max(0, total - completed);
  },

  getProgressPercent: (course: Course | undefined | null): number => {
    const total = course?.assignments?.length ?? 0;
    if (total === 0) return 0;
    const completed = course?.done ?? 0;
    return Math.round((completed / total) * 100);
  },

  getThresholdPercent: (course: Course | undefined | null): number => {
    return course?.pass_threshold ?? 100;
  },

  hasPassed: (course: Course | undefined | null): boolean => {
    if (!course) return false;
    const total = course.assignments?.length ?? 0;
    if (total === 0) return false;
    const completed = course.done ?? 0;
    const threshold = (course.pass_threshold ?? 100) / 100;
    return (completed / total) >= threshold;
  },

  getStatus: (
    course: Course | undefined | null
  ): 'not-started' | 'in-progress' | 'completed' | 'passed' => {
    if (!course) return 'not-started';
    const total = course.assignments?.length ?? 0;
    const completed = course.done ?? 0;

    if (completed === 0) return 'not-started';
    if (courseCalculations.hasPassed(course)) return 'passed';
    if (completed < total) return 'in-progress';
    return 'completed';
  },

  getDetailedStatus: (course: Course | undefined | null) => {
    return {
      total: courseCalculations.getTotalAssignments(course),
      completed: courseCalculations.getCompletedAssignments(course),
      pending: courseCalculations.getPendingAssignments(course),
      progressPercent: courseCalculations.getProgressPercent(course),
      thresholdPercent: courseCalculations.getThresholdPercent(course),
      hasPassed: courseCalculations.hasPassed(course),
      status: courseCalculations.getStatus(course),
      remainingToPass: getRemainingToPass(course ?? undefined),
      displayLabel: getProgressLabel(course ?? undefined),
    };
  },
};