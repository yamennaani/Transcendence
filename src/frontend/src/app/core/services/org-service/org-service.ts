import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";

@Injectable({providedIn:"root"})
export class OrgService {
    private http = inject(HttpClient)
    private base = '/api/org'

    getOrgs() {
        return this.http.get<any[]>(`${this.base}/`)
    }

    getOrg(id: number) {
        return this.http.get(`${this.base}/${id}`)
    }

    createOrg(data: { email: string, orgname: string, tag: string }) {
        return this.http.post(`${this.base}/`, data)
    }

    removeOrg(id: number) {
        return this.http.delete(`${this.base}/${id}`)
    }

    addMember(orgId: number, data: { email: string, username: string, role: string }) {
        return this.http.post(`${this.base}/${orgId}/members`, data)
    }

    removeMember(orgId: number, data: { userId: number }) {
        return this.http.delete(`${this.base}/${orgId}/members`, { body: data })
    }

    listOrgMembers(orgId: number) {
        return this.http.get<any[]>(`${this.base}/${orgId}/members`)
    }

    createOrgProfile(orgId: number, data: { name?: string, bio?: string, website?: string }) {
        return this.http.put(`${this.base}/${orgId}/profile`, data)
    }

    getOrgProfile(orgId: number) {
        return this.http.get(`${this.base}/${orgId}/profile`)
    }

    deleteOrgProfile(orgId: number) {
        return this.http.delete(`${this.base}/${orgId}/profile`)
    }

    getOrgCourses(orgId: number) {
        return this.http.get<any[]>(`${this.base}/${orgId}/courses`)
    }
}