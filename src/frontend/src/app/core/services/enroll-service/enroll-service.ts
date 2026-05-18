import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { Course } from "../../../tokens";

@Injectable({providedIn: "root"})
export class EnrollService{
    private base = '/api/enroll'
    private http = inject(HttpClient)

    enrollStudent(data:{classId:number, studentId:number}){
        return this.http.post(`${this.base}/`, data)
    }

    dropStudent(data:{classId:number, studentId:number}){
        return this.http.patch(`${this.base}/`, data)
    }

    getStudentEnrollements(studentId:number){
        return this.http.get(`${this.base}/${studentId}`)
    }

    getStudenEnrolledClasses(studentId:number){
        return this.http.get<Course[]>(`${this.base}/classes/${studentId}`)
    }
}