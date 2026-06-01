import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";

@Injectable({ providedIn: "root" })
export class SubmissionService {
    private http = inject(HttpClient)
    private base = '/api/submission'

    createSubmission(data: { groupId: number, assignmentId: number }) {
        return this.http.post(`${this.base}/`, data)
    }

    getGroupSubmissions(groupId: number) {
        return this.http.get(`${this.base}/${groupId}`)
    }

    getSubmissionsForAssignment(assignmentId: number) {
        return this.http.get<any[]>(`${this.base}/assignment/${assignmentId}/`)
    }

    closeSubmission(groupId: number, data: { evaluatorId: number }) {
        return this.http.patch(`${this.base}/${groupId}/close`, data)
    }

    uploadFile(groupId: number, userId: number, file: File) {
        const form = new FormData()
        form.append('file', file)
        form.append('userId', String(userId))
        return this.http.post(`${this.base}/${groupId}/file`, form)
    }

    getDownloadUrl(groupId: number, userId: number) {
        return this.http.get(`${this.base}/${groupId}/file/download`, { params: { userId: String(userId) } })
    }

    removeFile(groupId: number, userId: number) {
        return this.http.delete(`${this.base}/${groupId}/file`, { body: { userId } })
    }
}
