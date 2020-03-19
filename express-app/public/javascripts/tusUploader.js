var tus = require('tus-js-client');
var fs = require('fs');
var pathUtil = require('path');
var fileUploader = require('./fileUploader.js');
var tenderInfoObj = require('./tenderInfoObj.js');


const geps3_test_url2 = "http://127.0.0.1:8080/tps/tpam/tenderUpload/upload";

//const test_path = "C:/標案製作暫存區/測試機關一andy-test-01-01/1071130_交付文件.7z";

class tusUploader {
  constructor(filepath, targetPath) {
    this._filepath = filepath;
    this._file = fs.createReadStream(filepath);
    this._size = fs.statSync(filepath).size;
    this._filename = pathUtil.basename(filepath);
    let upload = new tus.Upload(this._file, {
      endpoint: geps3_test_url2,
      resume: true,
      retryDelays: [0, 3000, 5000, 10000, 20000],
      metadata: {
        filename: this._filename,
        filetype: "application/octet-stream",
        targetPath:targetPath
      },
      uploadSize: this._size,
      onError: function (error) {
        console.log("tus upload error =>" + error);
      },
      onProgress: function (bytesUploaded, bytesTotal) {
        var percentage = (bytesUploaded / bytesTotal * 100).toFixed(0);
        console.log(bytesUploaded, bytesTotal, percentage + "%");
      },
      onSuccess: function () {
        console.log("Upload finished:", upload.url);
        require('./fileUploader.js').uploadNext(false);
      }
    });
    this._tusUpload = upload;
  }

  startUpload() {
    this._tusUpload.start();
  }

  pauseUpload() {
    this._tusUpload.abort(false, function (error) {
      console.log("pause upload err => " + error);
    });
  }

  getFileName() {
    return this._filename;
  }


}

module.exports = { tusUploader: tusUploader };




