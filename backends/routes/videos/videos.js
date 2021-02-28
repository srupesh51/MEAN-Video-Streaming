const express = require("express");
const videoController = require("../../controllers/videos/videos");
const router = express.Router();
const imageUpload = require('./../../utils/imageUpload');

router.post('/upload', imageUpload({ fieldName: 'video', uploadPath: process.env.VIDEO_PATH}), videoController.uploadVideo);
router.get('/get/:id', videoController.getVideo);
router.get('/video_data/:id', videoController.getVideoData);
router.get('/list', videoController.listVideos);
router.get('/download/:id', videoController.downloadVideo);
router.delete('/delete/:id', videoController.deleteVideo);
router.put('/update/:id', imageUpload({ fieldName: 'video', uploadPath: process.env.VIDEO_PATH }), videoController.updateVideo);

module.exports = router;
