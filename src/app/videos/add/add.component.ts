import { Component, OnInit} from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import {VideoService} from '../../_services/video.service';
import {ToastrService} from 'ngx-toastr';

@Component({
  templateUrl: './add.component.html'
})
export class AddComponent implements OnInit {
  videoForm: FormGroup;
  loading = false;
  submitted = false;
  selectedFiles: FileList;
  constructor(private router: Router,
    private formBuilder: FormBuilder,
              private videoService: VideoService,
              private toastr: ToastrService) {
  }

  ngOnInit() {
    this.videoForm = this.formBuilder.group({
      video_title: [null, Validators.required],
      video: [null, Validators.required]
    });
  }

  get f() { return this.videoForm.controls; }

  onChange(event) {
    this.selectedFiles = event.target.files;
  }

  onUpload() {
    this.submitted = true;

    // stop here if form is invalid
    if (this.videoForm.invalid) {
      return;
    }

    this.loading = true;
    const formData = new FormData();
    formData.append('video', this.selectedFiles[0]);
    formData.append('video_title', this.f.video_title.value);
    formData.append('video_type', this.selectedFiles[0].type);
    // upload video
    this.videoService.upload(formData)
      .subscribe(
        data => {
          this.toastr.success('Video Uploaded.', 'Success');
          this.router.navigate(['/videos']);
        }, err => {
          this.toastr.error('Unable to upload video. Please, try again later.', 'Error');
          this.loading = false;
        });
  }
}
