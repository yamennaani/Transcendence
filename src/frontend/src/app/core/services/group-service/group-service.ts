import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";

@Injectable({ providedIn: "root" })
export class GroupService {
    private http = inject(HttpClient)
    private base = '/api/group'

    createGroup(data: { assId: number, userId: number, name: string, size: number }) {
        return this.http.post<any>(`${this.base}/`, data)
    }

    getGroup(id: number) {
        return this.http.get<any>(`${this.base}/${id}`)
    }

    leaveGroup(id: number, data: { userId: number }) {
        return this.http.delete(`${this.base}/${id}`, { body: data })
    }

    inviteMember(groupId: number, data: { leaderId: number, inviteeId: number }) {
        return this.http.post(`${this.base}/${groupId}/invite`, data)
    }

    getMyGroupForAssignment(userId: number, assId: number) {
        return this.http.get<any | null>(`${this.base}/my-group`, { params: { userId, assId } as any })
    }

    getInvites(query: { userId?: number, groupId?: number }) {
        return this.http.get<any[]>(`${this.base}/invite`, { params: query as any })
    }

    respondToInvite(inviteId: number, data: { userId: number, status: 'Accepted' | 'Declined' }) {
        return this.http.patch(`${this.base}/invite/${inviteId}`, data)
    }

    deleteInvite(inviteId: number) {
        return this.http.delete(`${this.base}/invite/${inviteId}`)
    }
}