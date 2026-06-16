import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";

// EvalAssignment object as returned by the backend (mirroring Prisma EvalAssignment model fields)
export interface EvalAssignment {
  id: number;
  assignmentId: number;
  evalueeGroupId: number;
  evaluatorUserId: number;
  evaluatorGroupId: number | null;
  round: number;
  status: EvalAssignmentStatus;
  submissionId: number | null;
  evalResponseId: number | null;
  createdAt: string;
}

// Request body for manually creating one EvalAssignment
export interface CreateEvalAssignmentPayload {
  assignmentId: number;
  evalueeGroupId: number;
  evaluatorUserId: number;
  evaluatorGroupId?: number | null;
  round: number;
  submissionId?: number | null;
  evalResponseId?: number | null;
}

// Request body for updating an EvalAssignment.
export interface UpdateEvalAssignmentPayload {
  assignmentId?: number;
  evalueeGroupId?: number;
  evaluatorUserId?: number;
  evaluatorGroupId?: number | null;
  round?: number;
  status?: EvalAssignmentStatus;
  submissionId?: number | null;
  evalResponseId?: number | null;
}

// mirroring enum EvalAssignmentStatus in schema.prisma
export type EvalAssignmentStatus = 'Pending' | 'Submitted' | 'Cancelled';



@Injectable({ providedIn: "root" })
export class EvalService {
    private http = inject(HttpClient)
    private base = '/api/eval'

    // EvalSheet routes
    getEvalSheet(id: number) {
        return this.http.get(`${this.base}/sheet/${id}`)
    }

    getEvalSheetByAssignment(assignmentId: number) {
        return this.http.get(`${this.base}/sheet/ass/${assignmentId}`)
    }

    createEvalSheet(data: { assignmentId: number, title?: string }) {
        return this.http.post(`${this.base}/sheet`, data)
    }

    createSection(sheetId: number, data: { title: string, maxScore: number }) {
        return this.http.post(`${this.base}/sheet/${sheetId}/section`, data)
    }

    updateSection(sheetId: number, data: { sectionId: number, title?: string, maxScore?: number }) {
        return this.http.patch(`${this.base}/sheet/${sheetId}/section`, data)
    }

    removeSection(sheetId: number, data: { sectionId: number }) {
        return this.http.delete(`${this.base}/sheet/${sheetId}/section`, { body: data })
    }

    getAssignment(id: number) {
        return this.http.get(`${this.base}/assignment/${id}`)
    }

    // methods/routes pertaining to EvalAssignment

    // creates one EvalAssignment manually (POST /api/eval/eval-assignments) 
    createEvalAssignment(data: CreateEvalAssignmentPayload) {
        return this.http.post<EvalAssignment>(`${this.base}/eval-assignments`, data);
    }
    // get all EvalAssignments for one assignment (GET /api/eval/assignment/:id/eval-assignments)
    getEvalAssignments(assignmentId: number) {
        return this.http.get<EvalAssignment[]>(`${this.base}/assignment/${assignmentId}/eval-assignments`);
    }
    // delete all EvalAssignments for one assignment (DELETE /api/eval/assignment/:id/eval-assignments)
    deleteEvalAssignments(assignmentId: number) {
        return this.http.delete<{message: string; assignmentId: number; count: number; }>(
            `${this.base}/assignment/${assignmentId}/eval-assignments` );
    }
    // get one EvalAssignment by its EvalAssignment-id (GET /api/eval/eval-assignments/:id)
    getEvalAssignmentById(id: number) {
        return this.http.get<EvalAssignment>(`${this.base}/eval-assignments/${id}`);
    }
    // update one EvalAssignment (PUT /api/eval/eval-assignments/:id)
    updateEvalAssignment(id: number, data: UpdateEvalAssignmentPayload) {
        return this.http.put<EvalAssignment>(`${this.base}/eval-assignments/${id}`, data);
    }
    // delete one EvalAssignment (DELETE /api/eval/eval-assignments/:id)
    deleteEvalAssignment(id: number) {
        return this.http.delete<{ message: string; id: number }>(`${this.base}/eval-assignments/${id}`);
    }
    // generate EvalAssignments for one assignment (simple) (POST /api/eval/assignment/:id/generate-simple-pairings)
    generateSimplePairings(assignmentId: number) {
        return this.http.post<EvalAssignment[]>(`${this.base}/assignment/${assignmentId}/generate-simple-pairings`, {});
    }
    //generatePairings(assignmentId)

}
