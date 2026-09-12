import { librusGet } from '../client';
import type { LibrusGrade, LibrusGradeCategory, LibrusSubject } from '../types';

interface GradesResponse {
  Grades: LibrusGrade[];
}

interface SubjectsResponse {
  Subjects: LibrusSubject[];
}

interface GradeCategoriesResponse {
  Categories: LibrusGradeCategory[];
}

export function getLibrusGrades(accessToken: string): Promise<LibrusGrade[]> {
  return librusGet<GradesResponse>(accessToken, '/Grades').then((r) => r.Grades);
}

export function getLibrusSubjects(accessToken: string): Promise<LibrusSubject[]> {
  return librusGet<SubjectsResponse>(accessToken, '/Subjects').then((r) => r.Subjects);
}

export function getLibrusGradeCategories(accessToken: string): Promise<LibrusGradeCategory[]> {
  return librusGet<GradeCategoriesResponse>(accessToken, '/Grades/Categories').then((r) => r.Categories);
}
