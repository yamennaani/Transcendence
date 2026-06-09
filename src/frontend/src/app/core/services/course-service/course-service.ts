import { HttpClient } from "@angular/common/http";
import { inject, Injectable, signal } from "@angular/core";
import { Course } from "../../../tokens";

export interface CoursePayload {
  org_id: number;
  created_by: number;
  name: string;
  description: string;
  pass_threshold: number;
}

@Injectable({ providedIn: "root" })
export class CourseService {
  private http = inject(HttpClient);
  private base = "/api/class";

  private _userCourses = signal<Course[] | null>(null);
  readonly UserCourses = this._userCourses.asReadonly();

  setUserCourses(courses: Course[]): void {
    this._userCourses.set(courses);
  }

  getClasses() {
    return this.http.get<Course[]>(`${this.base}/`);
  }

  getClass(id: number) {
    return this.http.get<Course>(`${this.base}/${id}`);
  }

  getClassByOrgId(orgId: number) {
    return this.http.get<Course[]>(`${this.base}/courses/${orgId}`);
  }

  getClassStudents(classId: number) {
    return this.http.get<{ id: number; username: string; email: string; role: string; created_at: string }[]>(
      `${this.base}/${classId}/students`
    );
  }

  createClass(data: CoursePayload) {
    return this.http.post<Course>(`${this.base}/`, data);
  }

  updateClass(classId: number, data: Partial<CoursePayload>) {
    return this.http.put<Course>(`${this.base}/${classId}`, data);
  }

  deleteClass(classId: number) {
    return this.http.delete<{ message: string; id: number }>(`${this.base}/${classId}`);
  }
}
