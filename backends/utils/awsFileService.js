const AWS = require("aws-sdk");
const keysConfig = require('./../config/keys');

getAWSConfig = () => {
  return new AWS.S3({
    accessKeyId: process.env.AWS_CUSTOM_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_CUSTOM_ACCESS_SECRET_KEY,
    region: process.env.AWS_CUSTOM_S3_REGION,
  });
}

getAWSDefaultParams = (fileName) => {
  return {
    Bucket: process.env.AWS_CUSTOM_S3_BUCKET,
    Key: process.env.VIDEO_PATH + fileName
  };
}

exports.download = (fileName) => {
  return getFileLink(fileName);
}

getFileLink = (fileName) => {
  return new Promise(function (resolve, reject) {
    
    const privateKey = keysConfig.private_key;

    const signer = new AWS.CloudFront.Signer(process.env.CLOUDFRONT_ACCESS_KEY_ID,
      privateKey);
      const twoDays = 2*24*60*60*1000;
      signer.getSignedUrl({url: process.env.AWS_CLOUDFRONT_URL + "/" + 
     process.env.VIDEO_PATH + fileName, expires: Math.floor((Date.now() + twoDays)/1000)}, 
        (err, url) => {
        console.log(err);  
        err ? reject(err) : resolve(url);
      });
  });
}

exports.createMultiPartUpload = (fileName, fileType) => {
  const s3Config = getAWSConfig();
  let fileParams = getAWSDefaultParams(fileName);
  fileParams.ContentType = fileType;
  fileParams.ACL = 'public-read';
  fileParams.CacheControl = 'max-age=0';
  return s3Config.createMultipartUpload(fileParams).promise().then((res) => {
    console.log(" Successfully created MultiPart Upload for File: " + fileName + " to AWS ");
    return res;
  }).catch((err) => {
    console.log(" Failed to create MultiPart Upload for File: " + fileName + " to AWS ");
    return err;
  });
}

exports.completeMultiPartUpload = (fileName, params) => {
  const s3Config = getAWSConfig();
  let fileParams = getAWSDefaultParams(fileName);
  fileParams.MultipartUpload =   {
      'Parts': params.Parts
  };
  fileParams.UploadId = params.UploadId;
  return s3Config.completeMultipartUpload(fileParams).promise().then((res) => {
    console.log(" Successfully completed MultiPart Upload for File: " + fileName + " to AWS ");
    return res;
  }).catch((err) => {
    console.log(" Failed to complete MultiPart Upload for File: " + fileName + " to AWS ");
    return err;
  });
}

exports.signedUrl = (fileName, params) => {
  const s3Config = getAWSConfig();
  let fileParams = getAWSDefaultParams(fileName);
  fileParams.PartNumber = params.PartNumber;
  fileParams.UploadId = params.UploadId;
  const getSignedUrlPromise = (operation, params) =>
    new Promise((resolve, reject) => {
      s3Config.getSignedUrl(operation, params, (err, url) => {
        err ? reject(err) : resolve(url);
      });
  });
  return getSignedUrlPromise('uploadPart',fileParams).then((res) => {
    console.log(" Retrieved Signed Url for File: " + fileName + " from AWS ");
    return res;
  }).catch((err) => {
    console.log(" Failed to get signed Url for File: " + fileName + " from AWS ");
    return err;
  });
}

exports.upload = (fileName, fileType, fileData, options) => {
  const s3Config = getAWSConfig();
  let params = getAWSDefaultParams(fileName);
  params.Body = fileData;
  params.ContentType = fileType;
  params.ACL = 'public-read';
  params.CacheControl = 'max-age=0';
  return s3Config.upload(params, options).promise().then((res) => {
    // console.log(" Successfully uploaded " + fileName + " with " + filePath + " to AWS ");
    console.log(" Successfully uploaded File: " + fileName + " to AWS ");
    return res;
  }).catch((err) => {
    console.log(" Failed to Upload File: " + fileName + " to AWS ");
    return err;
  });
}

exports.delete = (fileName) => {
  const s3Config = getAWSConfig();
  const params = getAWSDefaultParams(fileName);
  return s3Config.deleteObject(params).promise().then((res) => {
    // console.log(" Successfully uploaded " + fileName + " with " + filePath + " to AWS ");
    console.log(" Successfully removed File: " + fileName + " from AWS ");
    return res;
  }).catch((err) => {
    console.log(" Failed to remove File: " + fileName + " from AWS ");
    return err;
  });
}
