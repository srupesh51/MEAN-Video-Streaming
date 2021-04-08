import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Route, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { VideoService } from '../../_services/video.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-update',
  templateUrl: './update.component.html',
  styleUrls: ['./update.component.scss']
})
export class UpdateComponent implements OnInit {
  videoForm: FormGroup;
  loading = false;
  submitted = false;
  selectedFiles: FileList;
  fileName;
  file;
  videoId;
  video;
  constructor(private router: Router,
    private route: ActivatedRoute,
    private formBuilder: FormBuilder,
    private videoService: VideoService,
    private toastr: ToastrService) {
    console.log(route.snapshot.paramMap.get('id'));
    this.videoId = route.snapshot.paramMap.get('id');
  }

  ngOnInit() {
    this.videoForm = this.formBuilder.group({
      video_title: [null, Validators.required],
      video: [null, Validators.required]
    });
    this.videoService.get(this.videoId)
    .subscribe(
      data => {
        this.video = data.data.message;
      }, err => {
        
      });
  }

  get f() { return this.videoForm.controls; }

  onChangeVideo(event) {
    this.selectedFiles = event.target.files;
    this.file = event.target.files !== undefined && event.target.files.length > 0;
  }

  onChangeFile(event) {
    this.fileName = event.target.value != "" ? true : false;
  }

  doUpdate() {
    return this.file && this.fileName;
  }

  onUpdate() {
    this.submitted = true;

    // stop here if form is invalid
    if (this.videoForm.invalid) {
      return;
    }

    let videoType = this.video.VideoType;
    videoType = videoType.toString().split("/");
    const fileName = this.video.VideoFile + "." + videoType[videoType.length - 1];

    this.loading = true;
    const formData = new FormData();
    formData.append('video', this.selectedFiles[0]);
    formData.append('video_file', this.selectedFiles[0].name);
    formData.append('video_title', this.f.video_title.value);
    formData.append('video_type', this.selectedFiles[0].type);
    formData.append("video_link", fileName);

    // update video
    this.videoService.update(this.videoId, formData)
      .subscribe(
        data => {
          this.toastr.success('Video Updated.', 'Success');
          this.router.navigate(['/videos']);
        }, err => {
          this.toastr.error('Unable to update video. Please, try again later.', 'Error');
          this.loading = false;
        });
    }
}
