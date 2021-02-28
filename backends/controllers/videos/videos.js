const liveVideos = require("../../models/videos/videos");
const awsFileService = require('./../../utils/awsFileService'); 
const fs = require('fs');
const util = require('util');
const md5File = require('md5-file');
const path = require('path');

exports.getVideo = (req, res, next) => {
  liveVideos.findOne({"_id": req.params.id.toString()}).sort({ "createdOn": -1 }).then((videoData) => {
    if (videoData !== undefined) {
      res.status(200).json({
        data: {
          message: videoData
        }
      });
    } else {
      res.status(400).json({
        data: {
          message: "Unable to retrieve Video. Hence Exiting!"
        }
      });
    }
  }).catch((err) => {
    return res.status(500).json({
      data: {
        message: err.message
      }
    })
  });
}


exports.uploadVideo = async (req, res, next) => {
  /*console.log(req.file);*/

  const readFile = util.promisify(fs.readFile);
  let fileData = undefined;
  await readFile(process.cwd() + "/" + req.file.filename).then((data) => {
    fileData = data;
  }).catch((err) => {
    console.log(err);
  });

  let videoHash = undefined;
  await md5File(process.cwd() + "/" + req.file.filename).then((hash) => {
    videoHash = hash;
    console.log(`The MD5 sum is: ${hash}`)
  }).catch((err) => {
    console.log(err);
  });

  await liveVideos.findOne({ VideoHash: videoHash }).then(async(response) => {
    console.log(response);
    if (response !== undefined && response !== null) {
      res.status(400).json({
        data: {
          message: "Sorry! This Video Already Exists. Please Upload a Different Video"
        }
      });
    } else {

      let videoLink = undefined;
      await awsFileService.upload(req.file.originalname, req.body.video_type, fileData).then(success => {
        console.log(success);
        videoLink = success.Location;
      }).catch(err => {
        console.log(err);
        res.status(500).json({
          data: {
            message: err.message
          }
        });
      });

      let liveVideoData = new liveVideos();
      liveVideoData.VideoTitle = req.body.video_title;
      liveVideoData.VideoType = req.body.video_type;
      liveVideoData.VideoLink = videoLink;
      liveVideoData.VideoHash = videoHash;
      await liveVideoData.save().then(() => {
        res.status(200).json({
          data: {
            message: "Successfully Saved Video"
          }
        });
      }).catch((err) => {
        return res.status(500).json({
          data: {
            message: err.message
          }
        })
      });
    }
  }).catch(err => {
    console.log(err);
    res.status(500).json({
      data: {
        message: err.message
      }
    });
  });
}

exports.downloadVideo = (req, res, next) => {
  liveVideos.findOne({ "_id": req.params.id.toString() }).sort({ "createdOn": -1 }).then(async(videoData) => {
    if (videoData !== undefined) {
      let videoLink = videoData.toObject().VideoLink;
      videoLink = videoLink.toString().split("/");
      const fileName = videoLink[videoLink.length - 1];
      const filePath = path.join(process.cwd(), "/", process.env.VIDEO_PATH, fileName);
      res.sendFile(filePath);
    } else {
      res.status(400).json({
        data: {
          message: "Unable to retrieve Video for Download. Hence Exiting!"
        }
      });
    }
  }).catch((err) => {
    return res.status(500).json({
      data: {
        message: err.message
      }
    })
  });
}

exports.getVideoData = (req, res, next) => {
  liveVideos.findOne({ "_id": req.params.id.toString() }).sort({ "createdOn": -1 }).then(async (videoData) => {
    if (videoData !== undefined) {
      let videoLink = videoData.toObject().VideoLink;
      videoLink = videoLink.toString().split("/");
      const fileName = videoLink[videoLink.length - 1];
      const filePath = path.join(process.cwd(), "/", process.env.VIDEO_PATH, fileName);
      res.sendFile(filePath);
    } else {
      res.status(400).json({
        data: {
          message: "Unable to retrieve Data for Video for Download. Hence Exiting!"
        }
      });
    }
  }).catch((err) => {
    return res.status(500).json({
      data: {
        message: err.message
      }
    })
  });
}

exports.updateVideo = async (req, res, next) => {
  const readFile = util.promisify(fs.readFile);
  let fileData = undefined;
  await readFile(process.cwd() + "/" + req.file.filename).then((data) => {
    fileData = data;
  }).catch((err) => {
    console.log(err);
  });

  let videoHash = undefined;
  await md5File(process.cwd() + "/" + req.file.filename).then((hash) => {
    videoHash = hash;
    console.log(`The MD5 sum is: ${hash}`)
  }).catch((err) => {
    console.log(err);
  });

  await liveVideos.findOne({ VideoHash: videoHash }).then(async (response) => {
    console.log(response);
    if (response === undefined || response === null) {
      await awsFileService.delete(req.body.video_link).then(async(success) => {
        console.log(success);
        let videoLink = undefined;
        await awsFileService.upload(req.file.originalname, req.body.video_type, fileData).then(success => {
          console.log(success);
          videoLink = success.Location;
          liveVideos.findOneAndUpdate({ "_id": req.params.id.toString() },
            {
              "VideoTitle": req.body.video_title,
              "VideoType": req.body.video_type,
              "VideoLink": videoLink,
              "VideoHash": videoHash
            },
            {
              new: true
            }).then(() => {
              res.status(200).json({
                data: {
                  message: "Successfully Updated Video"
                }
              });
            }).catch((err) => {
              return res.status(500).json({
                data: {
                  message: err.message
                }
              })
            });
        }).catch(err => {
          console.log(err);
          res.status(500).json({
            data: {
              message: err.message
            }
          });
        });
      }).catch(err => {
        console.log(err);
        res.status(500).json({
          data: {
            message: err.message
          }
        });
      });
    } else {
      res.status(400).json({
        data: {
          message: "Sorry! This Video Already Exists. Please Upload a Different Video"
        }
      });
    }
  }).catch(err => {
    console.log(err);
    res.status(500).json({
      data: {
        message: err.message
      }
    });
  });
}

exports.deleteVideo = async (req, res, next) => {
  liveVideos.findOne({ "_id": req.params.id.toString() }).sort({ "createdOn": -1 }).then(async (videoData) => {
    if (videoData !== undefined) {

      let videoLink = videoData.toObject().VideoLink;
      videoLink = videoLink.toString().split("/");
      const fileName = videoLink[videoLink.length - 1];

      await awsFileService.delete(fileName).then(success => {
        console.log(success);
      }).catch(err => {
        console.log(err);
      });

      const unlinkFile = util.promisify(fs.unlink);
      const filePath = process.cwd() + "/" + process.env.VIDEO_PATH + fileName;

      await unlinkFile(filePath).then(success => {
        console.log(success);
      }).catch(err => {
        console.log(err);
      });

      await liveVideos.deleteOne({ "_id": req.params.id.toString() }).sort({ "createdOn": -1 }).then(async () => {
        res.status(200).json({
          data: {
            message: "Successfully Deleted Video"
          }
        });
      }).catch (err => {
        console.log(err);
        res.status(500).json({
          data: {
            message: err.message
          }
        });
      });

    } else {
      res.status(400).json({
        data: {
          message: "Unable to retrieve Video for Deletion. Hence Exiting!"
        }
      });
    }
  }).catch((err) => {
    return res.status(500).json({
      data: {
        message: err.message
      }
    })
  }); 
}


exports.listVideos = (req, res, next) => {
  liveVideos.find({}).sort({ "createdOn": -1 }).then((videoList) => {
    if (videoList !== undefined && videoList.length > 0) {
      res.status(200).json({
        data: {
          message: videoList
        }
      });
    } else {
      res.status(400).json({
        data: {
          message: "Unable to retrieve Videos. Hence Exiting!"
        }
      });
    }
  }).catch((err) => {
    return res.status(500).json({
      data: {
        message: err.message
      }
    })
  });
}
