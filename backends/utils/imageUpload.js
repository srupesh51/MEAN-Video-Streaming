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
      return cb(null, options.uploadPath + Date.now() + '_' + fileName);
    }

  });

  const imageLocalUpload = multer({
    storage: localImageStorage,
  });

  if(typeof options.noFileUpload !== 'undefined') {
    return imageLocalUpload.none();
  }

  return imageLocalUpload.single(options.fieldName);
};
