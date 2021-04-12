const express = require("express");
const videoController = require("../../controllers/videos/videos");
const router = express.Router();
const imageUpload = require('./../../utils/imageUpload');
const multer = require("multer");

router.post('/upload', imageUpload({ fieldName: 'video', uploadPath: process.env.VIDEO_PATH}), videoController.uploadVideo);
router.get('/get/:id', videoController.getVideo);
router.get('/video_data/:id', videoController.getVideoData);
router.get('/list', videoController.listVideos);
router.get('/download/:id', videoController.downloadVideo);
router.delete('/delete/:id', videoController.deleteVideo);
router.put('/update/:id', imageUpload({ fieldName: 'video', uploadPath: process.env.VIDEO_PATH }), videoController.updateVideo);
router.post('/start-upload', imageUpload({ fieldName: 'video', uploadPath: process.env.VIDEO_PATH}), videoController.startUpload);
router.put('/get-upload-url', imageUpload({noFileUpload: 'none'}), videoController.getUploadUrl);
router.put('/complete-upload', imageUpload({noFileUpload: 'none'}), videoController.completeUpload);
router.post('/start-update', imageUpload({ fieldName: 'video', uploadPath: process.env.VIDEO_PATH}), videoController.startUpdate);
router.put('/complete-update/:id', imageUpload({noFileUpload: 'none'}), videoController.completeUpdate);

module.exports = router;
