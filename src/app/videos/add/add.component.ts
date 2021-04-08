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
  uploadId = '';
  constructor(private router: Router,
    private formBuilder: FormBuilder,
              private videoService: VideoService,
              private toastr: ToastrService) {
  }

  ngOnInit() {
    this.videoForm = this.formBuilder.group({
      video_title: [null, Validators.required],
      video_file: '',
      video: [null, Validators.required],
      uploadId: '',
      parts: [],
      partNumber: '',
      fileName: ''
    });
  }

  get f() { return this.videoForm.controls; }

  onChange(event) {
    this.selectedFiles = event.target.files;
  }

  async uploadMultiPartFile(uploadId) {
    console.log('Inside uploadMultipartFile')
      this.uploadId = uploadId;
      const CHUNK_SIZE = 10000000; // 10MB
      const fileSize = this.selectedFiles[0].size;
      const CHUNKS_COUNT = Math.floor(fileSize / CHUNK_SIZE) + 1;
      let promisesArray = [];
      let start, end, blob
      let uploadPartsArray = [];
      let formData = new FormData();
      for (let index = 1; index < CHUNKS_COUNT + 1; index++) {
          start = (index - 1) * CHUNK_SIZE;
          end = (index) * CHUNK_SIZE;
          blob = (index < CHUNKS_COUNT) ? this.selectedFiles[0].slice(start, end) : this.selectedFiles[0].slice(start);
          formData = new FormData();
          formData.append('fileName', this.selectedFiles[0].name);
          //formData.append('video_title', this.f.video_title.value);
          formData.append('partNumber', index.toString());
          formData.append('uploadId', this.uploadId);
          const getUploadUrlResp = await this.videoService.getUploadUrl(formData); 
          const presignedUrl = getUploadUrlResp.data.data.presignedUrl;
          const uploadResp = await this.videoService.getSignedURL(presignedUrl,
            blob, this.selectedFiles[0].type);
          promisesArray.push(uploadResp);
          if(index === CHUNKS_COUNT) {
            const resolvedArray = await Promise.all(promisesArray);
            resolvedArray.forEach((resolvedPromise, index) => {
                uploadPartsArray.push({
                  ETag: resolvedPromise.headers.etag,
                  PartNumber: index + 1
                });
              });
              formData = new FormData();
              formData.append('fileName', this.selectedFiles[0].name);
              formData.append('parts', JSON.stringify(uploadPartsArray));
              formData.append('uploadId', this.uploadId);
              formData.append('video', this.selectedFiles[0]);
              formData.append('video_file', this.selectedFiles[0].name);
              formData.append('video_title', this.f.video_title.value);
              formData.append('video_type', this.selectedFiles[0].type);
              await this.videoService.completeUpload(formData)
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
  }

  onUpload() {
    this.submitted = true;

    // stop here if form is invalid
    if (this.videoForm.invalid) {
      return;
    }

    this.loading = true;
    const formData = new FormData();
    formData.append('video_file', this.selectedFiles[0].name);
    formData.append('video', this.selectedFiles[0]);
    formData.append('video_type', this.selectedFiles[0].type);
    // upload video
    // this.videoService.upload(formData)
    //   .subscribe(
    //     data => {
    //       this.toastr.success('Video Uploaded.', 'Success');
    //       this.router.navigate(['/videos']);
    //     }, err => {
    //       this.toastr.error('Unable to upload video. Please, try again later.', 'Error');
    //       this.loading = false;
    //     });
    this.videoService.startUpload(formData)
      .subscribe(
        async(data) => {
          //this.toastr.success('Video Uploaded.', 'Success');
          //this.router.navigate(['/videos']);
          await this.uploadMultiPartFile(data.data.uploadId);
        }, err => {
          this.toastr.error('Unable to start Video Upload. Please, try again later.', 'Error');
          this.loading = false;
        });
   }
}
