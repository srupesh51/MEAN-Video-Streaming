const liveVideos = require("./../../models/videos/videos");
const awsFileService = require('./../../utils/awsFileService');
const cacheHandler = require('./../../cache/cacheHandler'); 
const fs = require('fs');
const util = require('util');
const redis = require("redis");
const md5File = require('md5-file');
const path = require('path');
const videoHandler = require('./../../utils/videoHandler');
const client = cacheHandler.getClient();

exports.getVideo = async(req, res, next) => {
  let videos =  await cacheHandler.getEntry(client, req.params.id.toString());
    console.log(videos);
  if(videos !== null && videos !== undefined) {
      videos = JSON.parse(videos);
      console.log(videos);
      videos.VideoID = parseInt(videos.VideoID);
      res.status(200).json({
        data: {
          message: videos
        }
      });
  } else {
      liveVideos.findOne({"_id": req.params.id.toString()}).sort({ "createdOn": -1 }).then(async(videoData) => {
      
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
        await liveVideoData.save().then(async(video) => {
          console.log(video);
          await cacheHandler.addEntry(client, 
            video._id.toString(), {"_id": video._id, "VideoTitle": video.VideoTitle,
            "VideoType": video.VideoType, "VideoFile": 
              video.VideoFile, "VideoLink": video.VideoLink,
              "VideoHash": video.VideoHash, 
            "createdOn": video.createdOn, "VideoID": video.VideoID.toString()});
          const videos = await cacheHandler.getEntry(client, 
            "videos");
          console.log(videos, "L");
          let videoContent = [];
          if(videos !== undefined && videos !== null) {
              videoContent = videos;
          }
          videoContent.push({"_id": video._id, "VideoTitle": video.VideoTitle,
          "VideoType": video.VideoType, "VideoFile": 
            video.VideoFile, "VideoLink": video.VideoLink,
            "VideoHash": video.VideoHash, 
          "createdOn": video.createdOn, "VideoID": video.VideoID.toString()});

          await cacheHandler.addEntry(client, "videos",
          videoContent);


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

exports.downloadVideo = async(req, res, next) => {
  let videos =  await cacheHandler.getEntry(client, req.params.id.toString());
    console.log(videos);
  if(videos !== null && videos !== undefined) {
      videos = JSON.parse(videos);
      console.log(videos);
      videos.VideoID = parseInt(videos.VideoID);
      const videoFile = videos.VideoFile;
      const fileName = videoFile;
      // const filePath = path.join(process.cwd(), "/", process.env.VIDEO_PATH, fileName);
      // res.sendFile(filePath);
      const response = await awsFileService.download(fileName);
      
      res.status(200).json({
        data: {
          message: {url: response}}
      });

  } else {
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
            }).then(async(response) => {
              const updateResponse = response.toObject();
              let videos = await cacheHandler.getEntry(client, 
                "videos");
              if(videos !== null && videos !== undefined) {
                videos = JSON.parse(videos);
                console.log(videos);
                const videoIndex = videos.findIndex(
                  (video) => {
                    return video._id.toString() === req.params.id.toString()
                });
                console.log(videoIndex);
                if(videoIndex !== -1) {
                  videos[videoIndex].VideoFile = updateResponse.VideoFile;
                  videos[videoIndex].VideoType = updateResponse.VideoType;
                  videos[videoIndex].VideoTitle = updateResponse.VideoTitle;
                  videos[videoIndex].VideoLink = updateResponse.VideoLink;
                  videos[videoIndex].VideoHash = updateResponse.VideoHash; 
                  videos[videoIndex]._id = updateResponse._id.toString();
                  videos[videoIndex].VideoID = updateResponse.VideoID.toString();
                  videos[videoIndex].createdOn = updateResponse.createdOn.toString();
                  await cacheHandler.addEntry(client, "videos", videos);
                } 
              }  
              
              await cacheHandler.addEntry(client, req.params.id.toString(), 
              {
                "_id": updateResponse._id.toString(),
                "VideoTitle": req.body.video_title,
                "VideoType": req.body.video_type,
                "VideoFile": req.body.video_file,
                "VideoID": updateResponse.VideoID.toString(),
                "VideoLink": videoLink,
                "VideoHash": videoHash,
                "createdOn": updateResponse.createdOn.toString(),
              });
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
        let videos = await cacheHandler.getEntry(client, 
          "videos");
        if(videos !== undefined && videos !== null) {
            videos = JSON.parse(videos);
            const videoIndex = videos.findIndex(
              (video) => {
                return video._id.toString() === req.params.id.toString()
            });
            console.log(videoIndex);
            if(videoIndex !== -1) {
              if(videos.length <= 1) {
                await cacheHandler.removeEntry(client, "videos");
              } else {
                await cacheHandler.addEntry(client, "videos", videos);
              }
              delete videos[videoIndex];
            }  
        }
        await cacheHandler.removeEntry(client, req.params.id.toString());   
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


exports.listVideos = async(req, res, next) => {
  //  await cacheHandler.removeEntry(client, "60843e2b47e3f001c8cfc0bd");
  //  await cacheHandler.removeEntry(client, 
  //    "videos");
  let videos = await cacheHandler.getEntry(client, 
    "videos");
  console.log(videos, "LK");
  if(videos !== null && videos !== undefined) {
      videos = JSON.parse(videos);
      videos.forEach((video) => {
        video.VideoID = parseInt(video.VideoID);
      });
      res.status(200).json({
          data: {
                message: videos
          }
      });
  } else {
    
    liveVideos.find({}).sort({ "createdOn": -1 }).then(async(videoList) => {
      if (videoList !== undefined && videoList.length > 0) {
        let videoContent = [];
        videoList.forEach((video) => {
          videoContent.push({
            "_id": video._id.toString(),
            "VideoTitle": video.VideoTitle,
            "VideoType": video.VideoType,
            "VideoFile": video.VideoFile,
            "VideoHash": video.VideoHash,
            "VideoLink": video.VideoLink,
            "createdOn": video.createdOn.toString(),
            "VideoID": video.VideoID.toString()
          })
        });
        await cacheHandler.addEntry(client, "videos", videoContent);
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
      console.log(err);
      return res.status(500).json({
        data: {
          message: err.message
        }
      })
    });
  }

}
