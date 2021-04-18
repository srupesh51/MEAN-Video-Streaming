const liveVideos = require("./../../models/videos/videos");
const cacheHandler = require("./../../cache/cacheHandler");
const awsFileService = require('./../../utils/awsFileService'); 
const fs = require('fs');
const util = require('util');
const md5File = require('md5-file');
const path = require('path');
const videoHandler = require('./../../utils/videoHandler');

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

exports.startUpdate = async(req, res, next) => {

  const videoHash = await videoHandler.getMD5(req.file.originalname,
    process.env.VIDEO_PATH);

  const videoResult = await videoHandler.checkMD5(videoHash);

  if(videoResult) {
      return res.status(400).json({
        data: {
          message: "Sorry! This Video Already Exists. Please Upload a Different Video"
        }
      });
} else {
    await awsFileService.createMultiPartUpload(req.body.video_file,
      req.body.video_type).then((success) => {
        res.status(200).json({
          data: {
            uploadId: success.UploadId
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
}

exports.startUpload = async(req, res, next) => {

  const videoHash = await videoHandler.getMD5(req.file.originalname,
    process.env.VIDEO_PATH);

  const videoResult = await videoHandler.checkMD5(videoHash);
  
  if(videoResult) {
      return res.status(400).json({
        data: {
          message: "Sorry! This Video Already Exists. Please Upload a Different Video"
        }
      });
  } else {
    await awsFileService.createMultiPartUpload(req.body.video_file,
      req.body.video_type).then((success) => {
        res.status(200).json({
          data: {
            uploadId: success.UploadId
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
}

exports.getUploadUrl = (req, res, next) => {
    awsFileService.signedUrl(req.body.fileName, {
      PartNumber: parseInt(req.body.partNumber),
      UploadId: req.body.uploadId
    }).then((success) => {
      res.status(200).json({
        data: {
          presignedUrl: success
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

exports.completeUpdate = async(req, res, next) => {

  const videoHash = await videoHandler.getMD5(req.file.originalname,
    process.env.VIDEO_PATH);

  await awsFileService.delete(req.body.video_link).then(async(success) => {

    let videoLink = undefined;
    await awsFileService.completeMultiPartUpload(req.body.fileName, {
      Parts: JSON.parse(req.body.parts),
      UploadId: req.body.uploadId
    }).then((success) => {
      videoLink = success.Location;
    }).catch((err) => {
      return res.status(500).json({
          data: {
            message: err.message
          }
        })
    });
    
    const fileName = req.body.video_link;

    await videoHandler.removeFile(fileName, process.env.VIDEO_PATH);


    await liveVideos.findOneAndUpdate({ "_id": req.params.id.toString() },
      {
        "VideoTitle": req.body.video_title,
        "VideoType": req.body.video_type,
        "VideoFile": req.body.video_file,
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

  }).catch((err) => {
    return res.status(500).json({
      data: {
        message: err.message
      }
    })
  });
}

exports.completeUpload = async(req, res, next) => {

  const videoHash = await videoHandler.getMD5(req.file.originalname,
    process.env.VIDEO_PATH);

    let videoLink = undefined;
    await awsFileService.completeMultiPartUpload(req.body.fileName, {
      Parts: JSON.parse(req.body.parts),
      UploadId: req.body.uploadId
    }).then((success) => {
      videoLink = success.Location;
    }).catch((err) => {
      return res.status(500).json({
          data: {
            message: err.message
          }
        })
    });
    let liveVideoData = new liveVideos();
    liveVideoData.VideoTitle = req.body.video_title;
    liveVideoData.VideoType = req.body.video_type;
    liveVideoData.VideoFile = req.body.video_file;
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

exports.uploadVideo = async (req, res, next) => {
  /*console.log(req.file);*/

  const readFile = util.promisify(fs.readFile);
  let fileData = undefined;
  await readFile(process.cwd() + "/" + req.file.filename).then((data) => {
    fileData = data;
  }).catch((err) => {
    console.log(err);
  });

  const videoHash = await videoHandler.getMD5(req.file.originalname,
    process.env.VIDEO_PATH);

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
      const options = { partSize: 5 * 1024 * 1024, queueSize: 10 };  
      await awsFileService.upload(req.file.originalname, req.body.video_type, fileData,
        options).then(success => {
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
      if(videoLink !== undefined) {
        
        let liveVideoData = new liveVideos();
        liveVideoData.VideoTitle = req.body.video_title;
        liveVideoData.VideoType = req.body.video_type;
        liveVideoData.VideoFile = req.body.video_file;
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

      } else {
        await videoHandler.removeFile(req.file.originalname,
          process.env.VIDEO_PATH);
          res.status(400).json({
            data: {
              message: "Failed to upload your Video. Please try Later.."
            }
          });
      }
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
      const videoFile = videoData.toObject().VideoFile;
      const fileName = videoFile;
      // const filePath = path.join(process.cwd(), "/", process.env.VIDEO_PATH, fileName);
      // res.sendFile(filePath);
      const response = await awsFileService.download(fileName);
      
      res.status(200).json({
        data: {
          message: {url: response}}
      });
      
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
      const videoFile = videoData.toObject().VideoFile;
      const fileName = videoFile;
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

  const videoHash = await videoHandler.getMD5(req.file.originalname,
    process.env.VIDEO_PATH);

  await liveVideos.findOne({ VideoHash: videoHash }).then(async (response) => {
    console.log(response);
    if (response === undefined || response === null) {
      await awsFileService.delete(req.body.video_link).then(async(success) => {
        console.log(success);
        let videoLink = undefined;
        await videoHandler.removeFile(req.body.video_link,
          process.env.VIDEO_PATH);
        const options = { partSize: 5 * 1024 * 1024, queueSize: 10 };   
        await awsFileService.upload(req.file.originalname, req.body.video_type, fileData,
           options).then(success => {
          console.log(success);
          videoLink = success.Location;
          liveVideos.findOneAndUpdate({ "_id": req.params.id.toString() },
            {
              "VideoTitle": req.body.video_title,
              "VideoType": req.body.video_type,
              "VideoFile": req.body.video_file,
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

      const videoFile = videoData.toObject().VideoFile;
      const fileName = videoFile;
      
      await awsFileService.delete(fileName).then(success => {
        console.log(success);
      }).catch(err => {
        console.log(err);
      });

      await videoHandler.removeFile(fileName, process.env.VIDEO_PATH);

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
      res.status(200).json({
        data: {
          message: []
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
