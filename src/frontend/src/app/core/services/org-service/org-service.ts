import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";

@Injectable({providedIn:"root"})
export class OrgService{
    private http = inject(HttpClient)
    private base = '/api/org'

    getOrgs(){
        return this.http.get<any[]>(`${this.base}/`)
    }

    getOrg(id:number){
        return this.http.get(`${this.base}/${id}`)
    }

    createOrg(data:{email:string, orgname:string, tag:string}){
        return this.http.post(`${this.base}/`, data)
    }

    removeOrg(id:number){
        return this.http.delete(`${this.base}/${id}`)
    }
}