const md5File = require('md5-file');
const liveVideos = require("./../models/videos/videos");
const fs = require('fs');
const util = require('util');

exports.getMD5 = async(filePath) => {
    let videoHash = undefined;
    await md5File(process.cwd() + "/" + filePath).then((hash) => {
        videoHash = hash;
        console.log(`The MD5 sum is: ${hash}`)
    }).catch((err) => {
        console.log(err);
    });
    return videoHash;
}

exports.checkFilePath = async(fileName, filePath) => {
    const fileExists = util.promisify(fs.access);
    let isFilePresent = false;
    await fileExists(process.cwd() + "/" + filePath + fileName, fs.constants.F_OK).then(() => {
        isFilePresent = true;
        console.log('File Exists');
    }).catch((err) => {
        console.log(err);
    });
    return isFilePresent;
}

exports.getFileData = async(filePath) => {
    const readFile = util.promisify(fs.readFile);
    let fileData = undefined;
    await readFile(process.cwd() + "/" + filePath).then((data) => {
        fileData = data;
    }).catch((err) => {
        console.log(err);    
    });
    return fileData;
}

exports.checkMD5 = async(md5Hash) => {
    let videoResult = false;
    await liveVideos.findOne({ VideoHash: md5Hash }).then(async(response) => {
        console.log(response);
        if (response !== undefined && response !== null) {
            videoResult = true;
        }
    });
    return videoResult;
}

exports.removeFile = async(filePath) => {
    const unlinkFile = util.promisify(fs.unlink);
    await unlinkFile(process.cwd() + "/" + filePath).then(success => {
        console.log(success);
    }).catch(err => {
        console.log(err);
    });
}





