import {Injectable} from '@angular/core';
import { HttpClient, HttpHeaders} from '@angular/common/http';
import {Observable} from 'rxjs';

@Injectable()
export class VideoService {
  // api URL
  private API_URL = 'http://localhost:4000/api/';

  constructor(private http: HttpClient) {
  }

  // list videos
  list(): Observable<any> {
    return this.http.get<any>(this.API_URL + 'videos/list');
  }

  // get video
  get(id: String): Observable<any> {
    return this.http.get<any>(this.API_URL + 'videos/get/' + id);
  }

  // get video data
  getVideoData(id: String): Observable<any> {
    return this.http.get(this.API_URL + 'videos/video_data/' + id, {
      responseType: 'blob'
    });
  }

  // download video
  download(id: String): Observable<any> {
    return this.http.get(this.API_URL + 'videos/download/' + id, {
      responseType: 'blob'
    });
  }

  // delete video
  delete(id: String): Observable<any> {
    return this.http.delete<any>(this.API_URL + 'videos/delete/' + id);
  }

  // update video
  update(id: String, formData: any): Observable<any> {
    return this.http.put<any>(this.API_URL + 'videos/update/' + id, formData);
  }

  upload(formData: any): Observable<any> {
    return this.http.post<any>(this.API_URL + 'videos/upload', formData);
  }
}
