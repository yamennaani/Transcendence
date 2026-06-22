import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { EvalResponse } from "../../../tokens";

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
  evaluatorUser?: { id: number; username: string; email: string };
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

export interface StartEvaluationResponse {
    evalAssignmentId: number;
    assignment: { id: number; name: string; description: string; max_score: number };
    group: { id: number; name: string };
    submission: { id: number; file: { id: number; name: string; url: string; size: number } | null };
    evalSheet: EvalSheet;
}

export interface SubmitEvaluationResponse {
    id: number;
    subId: number;
    userId: number;
    givenMarks: number;
    comment: string;
}

// mirroring enum EvalAssignmentStatus in schema.prisma
export type EvalAssignmentStatus = 'Pending' | 'Submitted' | 'Cancelled';

export type EvalSectionType = 'Toggle' | 'Slider';
export interface EvalSection {
    id: number;
    name: string;
    description: string;
    marks: number;
    sectionType: EvalSectionType;
    evalSheetId: number;

}
export interface EvalSheet {
    id: number;
    assId: number;
    sections: EvalSection[];
}
@Injectable({ providedIn: "root" })
export class EvalService {
    private http = inject(HttpClient)
    private base = '/api/eval'

    // EvalSheet routes
    getEvalSheet(id: number) {
        return this.http.get<EvalSheet>(`${this.base}/sheet/${id}`)
    }

    getEvalSheetByAssignment(assignmentId: number) {
        return this.http.get<EvalSheet>(`${this.base}/sheet/ass/${assignmentId}`)
    }

     createEvalSheet(assId: number) {
        return this.http.post<EvalSheet>(`${this.base}/sheet`, { assId })
    }

    createSection(sheetId: number, data: { name: string, description: string, marks: number, sectionType: EvalSectionType }) {
        return this.http.post<EvalSection>(`${this.base}/sheet/${sheetId}/section`, data)
    }

   updateSection(sheetId: number, data: { secId: number, name?: string, description?: string, marks?: number, sectionType?: EvalSectionType }) {
        return this.http.patch<EvalSection>(`${this.base}/sheet/${sheetId}/section`, data)
    }

    removeSection(sheetId: number, secId: number) {
        return this.http.delete<{ message: string, id: number }>(`${this.base}/sheet/${sheetId}/section`, { body: { secId } })
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

    startEvaluation(data: { evaluatorUserId: number, leaderEmail: string, passkey: string }) {
        return this.http.post<StartEvaluationResponse>(`${this.base}/evaluate/start`, data)
    }

    submitEvaluation(data: { evalAssignmentId: number, evaluatorUserId: number, comment: string, scores: { sectionId: number, score: number }[] }) {
        return this.http.post<SubmitEvaluationResponse>(`${this.base}/evaluate/submit`, data)
    }

    // all eval feedback (EvalResponse rows) left on one submission
    getResponsesForSubmission(subId: number) {
        return this.http.get<EvalResponse[]>(`${this.base}/submission/${subId}/responses`)
    }

    // group leader replies to one piece of eval feedback
    replyToResponse(responseId: number, data: { userId: number, reply: string }) {
        return this.http.patch<EvalResponse>(`${this.base}/responses/${responseId}/reply`, data)
    }
}
