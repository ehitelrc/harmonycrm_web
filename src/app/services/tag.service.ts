import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../enviroment/environment.prod';
import { Tag } from '../models/tag';

@Injectable({
  providedIn: 'root'
})
export class TagService {
  private apiUrl = `${environment.API.BASE}/tags`;

  constructor(private http: HttpClient) { }

  getTags(departmentId?: number): Observable<Tag[]> {
    const url = departmentId ? `${this.apiUrl}?department_id=${departmentId}` : this.apiUrl;
    return this.http.get<Tag[]>(url);
  }

  createTag(tag: Partial<Tag>): Observable<Tag> {
    return this.http.post<Tag>(this.apiUrl, tag);
  }

  updateTag(id: number, tag: Partial<Tag>): Observable<Tag> {
    return this.http.put<Tag>(`${this.apiUrl}/${id}`, tag);
  }

  deleteTag(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  assignToCase(caseId: number, tagId: number): Observable<any> {
    return this.http.post(`${environment.API.BASE}/cases/${caseId}/tags`, { tag_id: tagId });
  }

  removeFromCase(caseId: number, tagId: number): Observable<any> {
    return this.http.delete(`${environment.API.BASE}/cases/${caseId}/tags/${tagId}`);
  }
}
