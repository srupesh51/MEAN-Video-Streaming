const multer = require("multer");
const videoHandler = require('./videoHandler');

module.exports = function (options) {

  const MIME_TYPE_MAP = {
    'video/mp4': 'mp4',
    'video/webm': 'webm',
    'video/x-m4v': 'm4v',
    'video/quicktime': 'mov, qt'
  }


  //Upload image to Local machine
  const localImageStorage = multer.diskStorage({

    destination: (req, file, cb) => {
      const isValid = MIME_TYPE_MAP[file.mimetype];
      let error = new Error("Invalid mime type of video");
      const uploadPathLocal = '';
      if (isValid) {
        error = null;
      }
      cb(error, uploadPathLocal);
    },
    filename: async(req, file, cb) => {
      const name = file.originalname.toLowerCase().split(' ').join('-');
      const fileName = name;
      const isFilePresent =  await videoHandler.checkFilePath(fileName, 
        options.uploadPath);  
      if(isFilePresent) {
        return cb(null, ''); 
      }
      const md5Hash = await videoHandler.getMD5(fileName,
        options.uploadPath);  
      if(md5Hash !== undefined) {
          const videoResult = await videoHandler.checkMD5(md5Hash);
          if(videoResult) {
            return cb(null, '');
          }
      } 
      console.log("inside file"); 
      return cb(null, options.uploadPath + fileName);
    }

  });

  const imageLocalUpload = multer({
    storage: localImageStorage,
  });

  if(typeof options.noFileUpload !== 'undefined') {
    console.log("inside");
    return imageLocalUpload.none();
  }

  return imageLocalUpload.single(options.fieldName);
};
