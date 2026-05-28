import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";

@Injectable({providedIn:"root"})
export class UserService {
    private http = inject(HttpClient)
    private base = '/api/user'

    getUsers() {
        return this.http.get<any[]>(`${this.base}/`)
    }

    getUser(id: number) {
        return this.http.get<any>(`${this.base}/${id}`)
    }

    getRole(id: number) {
        return this.http.get<any>(`${this.base}/${id}/role`)
    }

    getProfile(id: number) {
        return this.http.get<any>(`${this.base}/${id}/profile`)
    }

    updateProfile(id: number, bio: string) {
        return this.http.patch(`${this.base}/${id}/profile`, { bio })
    }

    uploadAvatar(id: number, file: File) {
        const form = new FormData()
        form.append('avatar', file)
        return this.http.post(`${this.base}/${id}/avatar`, form)
    }

    loginUser(data: { email: string, username: string, password: string }) {
        return this.http.post(`${this.base}/login`, data)
    }

    registerUser(data: { email: string, username: string, password: string }) {
        return this.http.post(`${this.base}/register`, data)
    }

    deleteUser(id: number) {
        return this.http.delete(`${this.base}/${id}`)
    }
}