import { HttpClient } from "@angular/common/http";
import { inject, Injectable, signal } from "@angular/core";
import { Observable } from "rxjs";
import { Assignment } from "../../../tokens";

export interface CreateAssignmentPayload {
  name: string;
  description: string;
  maxScore: number;
  reqEval: number;
  createdBy: number;
  file?: File;
}

export interface UpdateAssignmentPayload {
  classId: number;
  name: string;
  description: string;
  groupSize?: number;
  reqEval: number;
  maxScore: number;
  passThreshold: number;
  createdBy: number;
  file?: File;
}

export interface AssignmentResponse {
  id: number;
  classid: number;
  name: string;
  description: string;
  max_score: number;
  req_eval: number;
  groupSize?: number;
  pass_threshold?: number;
  created_at: string;
  fileId?: number | null;
  file?: { id: number; name: string; url: string; mimiType: string; size: number } | null;
  groups?: { id: number; name: string; members?: { userId: number }[] }[];
}

@Injectable({ providedIn: "root" })
export class AssignmentService {
  private http = inject(HttpClient);
  private baseAssignments = "/api/class/assignment";
  private baseClasses = "/api/class";

  // Signals for state management
  private assignments = signal<AssignmentResponse[]>([]);
  private selectedAssignment = signal<AssignmentResponse | null>(null);
  private isLoading = signal<boolean>(false);
  private error = signal<string | null>(null);

  // Readonly accessors
  readonly Assignments = this.assignments.asReadonly();
  readonly SelectedAssignment = this.selectedAssignment.asReadonly();
  readonly IsLoading = this.isLoading.asReadonly();
  readonly Error = this.error.asReadonly();

  constructor() {}

  /**
   * Create a new assignment for a specific class
   */
  createAssignment(
    classId: number,
    data: CreateAssignmentPayload
  ): Observable<AssignmentResponse> {
    this.setLoading(true);

    const { file, ...fields } = data;
    const form = new FormData();
    Object.entries(fields).forEach(([key, value]) => form.append(key, String(value)));
    if (file) form.append('file', file);

    return new Observable((observer) => {
      this.http
        .post<AssignmentResponse>(
          `${this.baseClasses}/${classId}/assignment`,
          form
        )
        .subscribe({
          next: (response) => {
            this.assignments.update((assignments) => [
              ...assignments,
              response,
            ]);
            this.setLoading(false);
            this.error.set(null);
            observer.next(response);
            observer.complete();
          },
          error: (err) => {
            this.setError("Failed to create assignment");
            this.setLoading(false);
            observer.error(err);
          },
        });
    });
  }

  /**
   * Get all assignments for a specific class
   */
  getAssignments(classId: number): Observable<AssignmentResponse[]> {
    this.setLoading(true);
    return new Observable((observer) => {
      this.http
        .get<AssignmentResponse[]>(
          `${this.baseClasses}/${classId}/assignments`
        )
        .subscribe({
          next: (data) => {
            this.assignments.set(data);
            this.setLoading(false);
            this.error.set(null);
            observer.next(data);
            observer.complete();
          },
          error: (err) => {
            this.setError("Failed to fetch assignments");
            this.setLoading(false);
            observer.error(err);
          },
        });
    });
  }

  /**
   * Get a single assignment by ID
   */
  getAssignmentById(assignmentId: number): Observable<AssignmentResponse> {
    this.setLoading(true);
    return new Observable((observer) => {
      this.http
        .get<AssignmentResponse>(`${this.baseAssignments}/${assignmentId}`)
        .subscribe({
          next: (data) => {
            this.selectedAssignment.set(data);
            this.setLoading(false);
            this.error.set(null);
            observer.next(data);
            observer.complete();
          },
          error: (err) => {
            this.setError("Failed to fetch assignment");
            this.setLoading(false);
            observer.error(err);
          },
        });
    });
  }

  /**
   * Update an existing assignment
   */
  updateAssignment(
    assignmentId: number,
    data: UpdateAssignmentPayload
  ): Observable<AssignmentResponse> {
    this.setLoading(true);

    const { file, ...fields } = data;
    const form = new FormData();
    Object.entries(fields).forEach(([key, value]) => form.append(key, String(value)));
    if (file) form.append('file', file);

    return new Observable((observer) => {
      this.http
        .put<AssignmentResponse>(`${this.baseAssignments}/${assignmentId}`, form)
        .subscribe({
          next: (response) => {
            this.assignments.update((assignments) =>
              assignments.map((a) => (a.id === assignmentId ? response : a))
            );
            this.setLoading(false);
            this.error.set(null);
            observer.next(response);
            observer.complete();
          },
          error: (err) => {
            this.setError("Failed to update assignment");
            this.setLoading(false);
            observer.error(err);
          },
        });
    });
  }

  /**
   * Delete an assignment
   */
  deleteAssignment(assignmentId: number): Observable<{
    message: string;
    id: number;
  }> {
    this.setLoading(true);
    return new Observable((observer) => {
      this.http
        .delete<{ message: string; id: number }>(
          `${this.baseAssignments}/${assignmentId}`
        )
        .subscribe({
          next: (response) => {
            this.assignments.update((assignments) =>
              assignments.filter((a) => a.id !== assignmentId)
            );
            this.setLoading(false);
            this.error.set(null);
            observer.next(response);
            observer.complete();
          },
          error: (err) => {
            this.setError("Failed to delete assignment");
            this.setLoading(false);
            observer.error(err);
          },
        });
    });
  }

  /**
   * Set selected assignment
   */
  setSelectedAssignment(assignment: AssignmentResponse | null): void {
    this.selectedAssignment.set(assignment);
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
    this.assignments.set([]);
    this.selectedAssignment.set(null);
    this.error.set(null);
    this.isLoading.set(false);
  }
}