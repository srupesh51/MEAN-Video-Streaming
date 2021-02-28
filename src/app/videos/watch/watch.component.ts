import {Component, OnInit, Type, ViewChild} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {VideoService} from '../../_services/video.service';
import {ToastrService} from 'ngx-toastr';
import { saveAs } from 'file-saver';
import { HttpClient } from '@angular/common/http';

@Component({
  templateUrl: './watch.component.html'
})
export class WatchComponent implements OnInit {
  video: any;
  loaded: boolean;

  constructor(private router: Router,
              private route: ActivatedRoute,
              private videoService: VideoService,
              private toastr: ToastrService,
              private http: HttpClient) {
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.videoService.get(params.id)
        .subscribe(
          data => {
            this.video = data.data.message;
            this.loaded = true;
          }, err => {
            this.loaded = true;
          });
    });
  }

  downloadVideo(): void {
    this.videoService.download(this.video._id)
      .subscribe(
        data => {
          console.log(data);
          let videoLink = this.video.VideoLink;
          videoLink = videoLink.toString().split("/");
          const fileName = videoLink[videoLink.length - 1];
          saveAs(data, fileName);
          this.toastr.success('Successfully Downloaded Video.', 'Success');
          this.router.navigate(['/videos']);
        }, err => {
          console.log(err);
      });
  }

  updateVideo(): void {
    let videoLink = this.video.VideoLink;
    videoLink = videoLink.toString().split("/");
    let fileName = videoLink[videoLink.length - 1];
    fileName = fileName.toString().split(".")[0];
    this.router.navigate(['/videos/update', this.video._id]);
  }

  deleteVideo(): void {
    this.videoService.delete(this.video._id)
     .subscribe(
      data => {
         console.log(data);
         this.toastr.success(data.data.message, 'Success');
         this.router.navigate(['/videos']);
      }, err => {
        console.log(err);
      });
  }

}
