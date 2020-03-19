var express = require('express');
var router = express.Router();
const fs = require('fs');
var path = require('path');
var config = require('config');
var tenderInfoObj = require('../public/javascripts/tenderInfoObj');

const statusFilePath = config.get("statusFilePath.step4");

router.post('/touch', function(req, res, next) {
  var tenderInfo = tenderInfoObj.getTenderInfoObj();
  var path =  tenderInfo.structurePath + statusFilePath;
  var status = fs.readFileSync(path,"utf8");
  //如果偵測到動作完成
//   if(status.includes("end;")){
//     res.send("end");
//   }else{
    console.log(status);
    status = status.split(";");
    res.render("statusTemplate",{status: status});
 // }
  //res.send(status);
});

module.exports = router;



/*
●開始上傳檔案
  ●移除：/20200225-1_01/01_TEMP/_structure\20200225-1_01.sig   100%
●檔案上傳完成，共 0 個檔案
●開始上傳清單檔
  ●上傳：  _structure\20200225-1_01.sig   100%
●開始上傳檔案
  ●上傳：geps_config.xml   100%
  ●上傳：_投標須知\匯出.xlsx   100%
  ●移除：/20200225-1_01/01_TEMP\107簡明表.pdf   100%
  ●移除：_投標須知\107簡明表.pdf   100%
●檔案上傳完成，共 2 個檔案
●開始比對 Server 端與 Client 端檔案
  ●Server 端與 Client 端檔案 比對完成
●設定完成文件上傳狀態
 ●設定完成文件上傳狀態完成
●取得文件上傳電子憑據
 ●取得文件上傳電子憑據完成

*/