const AWS = require("aws-sdk");

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

exports.upload = (fileName, fileType, fileData) => {
  const s3Config = getAWSConfig();
  let params = getAWSDefaultParams(fileName);
  params.Body = fileData;
  params.ContentType = fileType;
  params.ACL = 'public-read';
  params.CacheControl = 'max-age=0';
  return s3Config.upload(params).promise().then((res) => {
    // console.log(" Successfully uploaded " + fileName + " with " + filePath + " to AWS ");
    console.log(" Successfully uploaded " + fileName + " to AWS ");
    return res;
  }).catch((err) => {
    console.log(" Error uploading " + fileName + " to AWS ");
    return err;
  });
}

exports.delete = (fileName) => {
  const s3Config = getAWSConfig();
  const params = getAWSDefaultParams(fileName);
  return s3Config.deleteObject(params).promise().then((res) => {
    // console.log(" Successfully uploaded " + fileName + " with " + filePath + " to AWS ");
    console.log(" Successfully removed " + fileName + " to AWS ");
    return res;
  }).catch((err) => {
    console.log(" Error uploading " + fileName + " to AWS ");
    return err;
  });
}
