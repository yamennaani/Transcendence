import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";

@Injectable({ providedIn: "root" })
export class EvalService {
    private http = inject(HttpClient)
    private base = '/api/eval'

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
}
