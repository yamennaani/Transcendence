import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";

@Injectable({providedIn:"root"})
export class UserService {
    private http = inject(HttpClient)
    private base = '/api/user'

    getusers(){
        return this.http.get<any[]>(`${this.base}/`)
    }

    getUser(id:number){
        return this.http.get<any>(`${this.base}/${id}`)
    }

    loginUser(data:{email:string, username:string, password:string}){
        return this.http.post(`${this.base}/login`, data)
    }

    registerUser(data:{email:string, username:string, password:string}){
        return this.http.post(`${this.base}/register`, data)
    }
}