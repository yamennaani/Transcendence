import { HttpClient } from "@angular/common/http";
import { inject, Injectable, signal } from "@angular/core";
import { Observable } from "rxjs";
import { Course } from "../../../tokens";

export interface CreateClassPayload {
  org_id: number;
  created_by: number;
  name: string;
  description: string;
  pass_threshold: number;
}

export interface UpdateClassPayload extends CreateClassPayload {
  id?: number;
}

export interface ClassResponse {
  id: number;
  name: string;
  description: string;
  created_at: string;
  org_id: number;
  created_by?: number;
  pass_threshold?: number;
}

@Injectable({ providedIn: "root" })
export class CourseService {
  private http = inject(HttpClient);
  private base = "/api/class";

  // Signals for state management
  private userCourses = signal<Course[] | null>(null);
  private selectedCourse = signal<Course | null>(null);
  private courses = signal<ClassResponse[]>([]);
  private isLoading = signal<boolean>(false);
  private error = signal<string | null>(null);

  // Readonly accessors
  readonly UserCourses = this.userCourses.asReadonly();
  readonly SelectedCourse = this.selectedCourse.asReadonly();
  readonly Courses = this.courses.asReadonly();
  readonly IsLoading = this.isLoading.asReadonly();
  readonly Error = this.error.asReadonly();

  constructor() {}

  /**
   * Get all classes
   */
  getClasses(): Observable<ClassResponse[]> {
    this.setLoading(true);
    return new Observable((observer) => {
      this.http.get<ClassResponse[]>(`${this.base}/`).subscribe({
        next: (data) => {
          this.courses.set(data);
          this.setLoading(false);
          this.error.set(null);
          observer.next(data);
          observer.complete();
        },
        error: (err) => {
          this.setError("Failed to fetch classes");
          this.setLoading(false);
          observer.error(err);
        },
      });
    });
  }

  /**
   * Get a single class by ID
   */
  getClass(id: number): Observable<ClassResponse> {
    this.setLoading(true);
    return new Observable((observer) => {
      this.http.get<ClassResponse>(`${this.base}/${id}`).subscribe({
        next: (data) => {
          this.selectedCourse.set(data as any);
          this.setLoading(false);
          this.error.set(null);
          observer.next(data);
          observer.complete();
        },
        error: (err) => {
          this.setError("Failed to fetch class");
          this.setLoading(false);
          observer.error(err);
        },
      });
    });
  }

  /**
   * Get classes by organization ID
   */
  getClassByOrgId(orgId: number): Observable<ClassResponse[]> {
    this.setLoading(true);
    return new Observable((observer) => {
      this.http
        .get<ClassResponse[]>(`${this.base}/org/${orgId}`)
        .subscribe({
          next: (data) => {
            this.courses.set(data);
            this.setLoading(false);
            this.error.set(null);
            observer.next(data);
            observer.complete();
          },
          error: (err) => {
            this.setError("Failed to fetch organization classes");
            this.setLoading(false);
            observer.error(err);
          },
        });
    });
  }

  /**
   * Create a new class
   */
  createClass(data: CreateClassPayload): Observable<ClassResponse> {
    this.setLoading(true);
    return new Observable((observer) => {
      this.http.post<ClassResponse>(`${this.base}/`, data).subscribe({
        next: (response) => {
          this.courses.update((courses) => [...courses, response]);
          this.setLoading(false);
          this.error.set(null);
          observer.next(response);
          observer.complete();
        },
        error: (err) => {
          this.setError("Failed to create class");
          this.setLoading(false);
          observer.error(err);
        },
      });
    });
  }

  /**
   * Update an existing class
   */
  updateClass(
    classId: number,
    data: UpdateClassPayload
  ): Observable<ClassResponse> {
    this.setLoading(true);
    return new Observable((observer) => {
      this.http.put<ClassResponse>(`${this.base}/${classId}`, data).subscribe({
        next: (response) => {
          this.courses.update((courses) =>
            courses.map((c) => (c.id === classId ? response : c))
          );
          this.setLoading(false);
          this.error.set(null);
          observer.next(response);
          observer.complete();
        },
        error: (err) => {
          this.setError("Failed to update class");
          this.setLoading(false);
          observer.error(err);
        },
      });
    });
  }

  /**
   * Delete a class
   */
  deleteClass(classId: number): Observable<{ message: string; id: number }> {
    this.setLoading(true);
    return new Observable((observer) => {
      this.http
        .delete<{ message: string; id: number }>(`${this.base}/${classId}`)
        .subscribe({
          next: (response) => {
            this.courses.update((courses) =>
              courses.filter((c) => c.id !== classId)
            );
            this.setLoading(false);
            this.error.set(null);
            observer.next(response);
            observer.complete();
          },
          error: (err) => {
            this.setError("Failed to delete class");
            this.setLoading(false);
            observer.error(err);
          },
        });
    });
  }

  /**
   * Set user courses in signal
   */
  setUserCourses(courses: Course[]): void {
    this.userCourses.set(courses);
  }

  /**
   * Set selected course
   */
  setSelectedCourse(course: Course | null): void {
    this.selectedCourse.set(course);
  }

  /**
   * Private helper methods
   */
  private setLoading(loading: boolean): void {
    this.isLoading.set(loading);
  }

  private setError(error: string | null): void {
    this.error.set(error);
  }

  /**
   * Clear all state
   */
  clearState(): void {
    this.userCourses.set(null);
    this.selectedCourse.set(null);
    this.courses.set([]);
    this.error.set(null);
    this.isLoading.set(false);
  }
}