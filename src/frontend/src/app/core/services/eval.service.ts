import { inject, Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";

@Injectable({providedIn: 'root'})
export class EvalService{

    private http = inject(HttpClient)
    private base = '/api/eval'

    getAssignment(assId:number){
        return this.http.get<any>(`${this.base}/assignment/${assId}`)
    }

    getSheetByAssignment(assId:number){
        return this.http.get<any>(`${this.base}/sheet/ass/${assId}`)
    }

    createSheet(assId:number){
        return this.http.post<any>(`${this.base}/eval/sheet`,{assId})
    }

    createSection(sheetId:number, data:{
        name:string,
        description:string,
        marks:number,
        sectionType: 'Toggle'|'Slider'
    }){
        return this.http.post<any>(`${this.base}/sheet/${sheetId}/section`, data)
    }
}