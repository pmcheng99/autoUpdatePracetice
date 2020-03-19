const express = require('express');
const router = express.Router();
const xmlParser = require('fast-xml-parser');
const fs = require('fs');
const fswin = require('fswin');
const config = require('config');
const multer = require('multer');
const deleteEmpty = require('delete-empty');
const { DownloaderHelper } = require('node-downloader-helper');
const md5 = require('md5');
const zlib = require('zlib');
var xmlbuilder = require('xmlbuilder');
const { byteHelper, pauseResumeTimer } = require('../public/javascripts/helpers.js');
const uploader = require('../public/javascripts/fileUploader');
const decoder = require('../public/javascripts/decoder.js');
const walker = require('../public/javascripts/walkFiles.js');
const hidefile = require('hidefile');
var path = require('path');
var tenderInfoObj = require('../public/javascripts/tenderInfoObj');
var workPath = "";
const url = 'http://localhost:8080/tps/TenderManagement/ResumableDownloadFile';
// const url = 'http://localhost:8080/tps/TenderManagement/downloadFile/f.mp4';
// const url = 'http://213.186.33.6/files/100Mio.dat'; // http://www.ovh.net/files/

//================= Java import =====================

//Download Options
const options = {
  method: 'POST', // Request Method Verb
  // Custom HTTP Header ex: Authorization, User-Agent
  retry: { maxRetries: 20, delay: 3000 }, // { maxRetries: number, delay: number in ms } or false to disable (default)
  fileName: filename => filename, // Custom filename when saved
  override: false, // if true it will override the file, otherwise will append '(number)' to the end of file
  forceResume: true, // If the server does not return the "accept-ranges" header, can be force if it does support it
  removeOnStop: false, // remove the file when is stopped (default:true)
  removeOnFail: false, // remove the file when fail (default:true)    
  httpRequestOptions: {}, // Override the http request options  
  httpsRequestOptions: {} // Override the https request options, ex: to add SSL Certs
};

// java.classpath.push(path.join(__dirname, "..", "public", "jar", "CHTTLPKIAdvance.jar"));
// java.classpath.push(path.join(__dirname, "..", "public", "jar", "smart-file-transfer-1.74-client.jar"));
// java.classpath.push(path.join(__dirname, "..", "public", "jar", "slf4j-api-1.5.3.jar"));
// java.classpath.push(path.join(__dirname, "..", "public", "jar", "slf4j-log4j12-1.5.3.jar"));
// java.classpath.push(path.join(__dirname, "..", "public", "jar", "log4j-1.2.15.jar"));
// java.classpath.push(path.join(__dirname, "..", "public", "jar", "commons-httpclient-3.1.jar"));
// java.classpath.push(path.join(__dirname, "..", "public", "jar", "commons-logging-1.0.4.jar"));
// java.classpath.push(path.join(__dirname, "..", "public", "jar", "dom4j-1.6.1.jar"));
// java.classpath.push(path.join(__dirname, "..", "public", "jar", "jaxen-1.1.1.jar"));
// java.classpath.push(path.join(__dirname, "..", "public", "jar", "axis.jar"));
// java.classpath.push(path.join(__dirname, "..", "public", "jar", "commons-codec-1.3.jar"));
// java.classpath.push(path.join(__dirname, "..", "public", "jar", "tpamUploader-2.0.jar"));
// java.classpath.push("commons-lang3-3.1.jar");
// java.classpath.push("commons-io.jar");
// java.classpath.push("vm.jar");

// var Token = java.import("tw.com.chttl.Token");
// var GeneralToken = java.import("tw.com.chttl.GeneralToken");
// var TokenSecureClientImpl = java.import("gov.pcc.geps.common.ccgs.client.impl.TokenSecureClientImpl");
// var CertInfo = java.import("gov.pcc.geps.common.ccgs.common.CertInfo");
// const X509Certificate = java.import("java.security.cert.X509Certificate");


// var TenderInfoTo = java.import("gov.pcc.geps.pms.tps.to.TenderInfoTo");
// var TpamConfigTo = java.import("gov.pcc.geps.pms.tps.tpam.to.TpamConfigTo");
// var TpamConstants = java.import("gov.pcc.geps.pms.tps.tpam.common.util.TpamConstants");
// var ServerSetting = java.import("gov.pcc.geps.common.ccf.ServerSetting");
// var InternetUtils = java.import("gov.pcc.geps.common.util.InternetUtils");
// var ProxySetting = java.import("gov.pcc.geps.common.ccf.ProxySetting");
// var SmartDownloader = java.import("gov.pcc.geps.common.ccf.SmartDownloader");

//================= Java import =====================

/**
 * 設定用multer套件接上傳檔案後要儲存的路徑跟檔名
 */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    //將編碼過的路徑解碼，並且用/分開
    let encoded_path = Buffer.from(file.originalname, 'base64').toString().split("%2F");
    //捨棄檔名取得上傳檔案相對路徑
    encoded_path.pop();
    let decoded_path = decodeURIComponent(encoded_path.join("/"));
    //組合設定路徑與上傳檔案路徑
    const dir =workPath + "/" + decoded_path;
    let exist = fs.existsSync(dir);
    if (!exist) {
      fs.mkdirSync(dir, {recursive: true});
      return cb(null, dir)
    } else {
      return cb(null, dir)
    }
    // fs.exists(dir, exist => {
    //   if (!exist) {
    //     console.log(`${dir} is not exist`);
    //     fs.mkdir(dir, function () {
    //       console.log(`${dir} is created`);
    //       return cb(null, dir)
    //     })
    //   } else {
    //     console.log(`${dir} is exist`);
    //     return cb(null, dir)
    //   }
    // })
  },
  
  filename: (req, file, cb) => {
    //將編碼過的路徑解碼
    let encoded_path = Buffer.from(file.originalname, 'base64').toString();
    //取得檔名
    let decoded_name = decodeURIComponent(encoded_path.split("%2F").pop());
    cb(null, decoded_name);
  }
})

const upload = multer({ storage })
/**
 * 文件上傳步驟一
 * 1.解析從tps來的 base64 參數
 * 2.解析出XML 轉成 JSON
 * 3.將畫面需要的參數回傳
 */
router.post('/step1', function (req, res, next) {
  var tenderInfoJsonObj;
  let encodeXml = req.param("tenderInfoXml");
  //解析base64 string
  if (encodeXml) {
    let tenderInfoXml = decoder.decodeBase64(encodeXml);
    console.log(tenderInfoXml);
    //解析xml to json
    if (xmlParser.validate(tenderInfoXml) === true) {
      tenderInfoJsonObj = xmlParser.parse(tenderInfoXml);
      let jsonArray = tenderInfoJsonObj.java.object.void;
      setTenderInfoObj(jsonArray);
      let obj = tenderInfoObj.getTenderInfoObj();
      let total = obj.systemCharge + obj.docCharge + obj.deptCharge;
     workPath = getDocPath();
      res.render('uploadStepOne', { tenderInfo: obj, total: total, path:workPath });
    } else {
      console.log('xml is not valid');
      res.render('uploadStepOne', { tenderInfo: null, total: null });
    }
  }
});

router.get('/step1', function (req, res, next) {
  setTenderInfoObj(null);
  let obj = tenderInfoObj.getTenderInfoObj();
  let total = obj.systemCharge + obj.docCharge + obj.deptCharge;
 workPath = getDocPath();
  res.render('uploadStepOne', { tenderInfo: obj, total: total, path:workPath });
});

/**
 * 文件上傳步驟二
 * 1.選取要上傳的文件ddd
 * 2.允許增加及刪除ddd
 * 3.限制上傳的檔案類型(至少.lnk不允許)ddd
 * 4.選擇要上傳的投標須知檔案ddd
 * 5.圖形化顯示目前已選擇的檔案(包括投標須知資料夾及其他要上傳的文件)
 * 6.沒有選擇投標須知檔案及至少一個要上傳的文件前，不可進入下一個步驟
 */
router.post('/step2', function (req, res, next) {
  //將步驟一設定的工作路徑寫入物件，以便後面取用
  let params = tenderInfoObj.getTenderInfoObj();
  let path = req.body.workPath;
  tenderInfoObj.getTenderInfoObj.certType = req.body.certType;
  params.structurePath = path;
  console.log(tenderInfoObj.getTenderInfoObj.certType);
  //檢查目標資料夾是否存在，如果不存在就遞迴建立
  fs.exists(path, exist => {
    if (!exist) {
      fs.mkdir(path, { recursive: true }, (err) => {
        if (err) {
          console.error(err);
        } else {
          //取得目標資料夾下的檔案結構
          let fileList = walker.walkForView(path, path);
          res.render('uploadStepTwo', { fileList: fileList });
        }
      });
    } else {
      let fileList = walker.walkForView(path, path);
      res.render('uploadStepTwo', { fileList: fileList });
    }
  });

});

router.post('/step3', function (req, res, next) {
  /**
   * 從這裡把需要的檔案清單抓出來做成xml，然後傳到第三頁給簽章用 
   * */
  let obj = tenderInfoObj.getTenderInfoObj();
  let list = walker.walkForXML(obj.structurePath, obj.structurePath);
  let xmlData = genXml(list);
  console.log(xmlData);
  res.render('uploadStepThree', {xmlData: xmlData});
});

/**
 * 簽章資料寫入sig檔 
 * */
router.post('/writeSig',function(req, res, next){
  let signData = req.body.signature
  let obj = tenderInfoObj.getTenderInfoObj();
  let tenderCaseNo = obj.tenderCaseNo;
  let orgId = obj.tenderOrgId;
  console.log(obj);
  if (!fs.existsSync(`${obj.structurePath}/_structure`)) {
    fs.mkdirSync(`${obj.structurePath}/_structure`);
  }
  fswin.setAttributesSync(`${obj.structurePath}/_structure`, {IS_HIDDEN: true});
  let targetPath = `${obj.structurePath}/_structure/${orgId}_${tenderCaseNo}.sig`;
  fs.writeFileSync(targetPath, signData);
  if(!fs.existsSync(targetPath)){
    res.send('N');
  }else{
    res.send('Y');
  }

});

//測試node下載套件
router.get('/downloadTest', function(req, res, next) {
  console.log('Download Test Start');
  let startTime = new Date();
  const dl = new DownloaderHelper(url, __dirname, options);
  dl
    .on('download', downloadInfo => console.log('Download Begins: ',
        {
            name: downloadInfo.fileName,
            total: downloadInfo.totalSize
        }))
    .on('end', downloadInfo => {
      console.log('Download Completed: ', downloadInfo);
      dl.stop();
      res.json({
        code: 1,
        // data : url
      });
    })
    .on('error', err => console.error('Something happend', err))
    .on('retry', (attempt, opts) => {
        console.log(
            'Retry Attempt:', attempt + '/' + opts.maxRetries,
            'Starts on:', opts.delay / 1000, 'secs'
        );
    })
    .on('resume', isResumed => {
        // is resume is not supported, 
        // a new pipe instance needs to be attached
        if (!isResumed) {
            dl.unpipe();
            dl.pipe(zlib.createGzip());
            console.warn("This URL doesn't support resume, it will start from the beginning");
        }
    })
    .on('stateChanged', state => console.log('State: ', state))
    .on('renamed', filePaths => console.log('File Renamed to: ', filePaths.fileName))
    .on('progress', stats => {
        const progress = stats.progress.toFixed(1);
        const speed = byteHelper(stats.speed);
        const downloaded = byteHelper(stats.downloaded);
        const total = byteHelper(stats.total);

        // print every one second
        const currentTime = new Date();
        const elaspsedTime = currentTime - startTime;
        if (elaspsedTime > 1000) {
            startTime = currentTime;
            console.log(`${speed}/s - ${progress}% [${downloaded}/${total}]`);
        }
    });

  console.log('Downloading: ', url);
  dl.start().catch(err => { /* already listening on 'error' event but catch can be used too */ });
});

// //測試java套件
// router.post('/javaTest', function (req, res, next) {
//   console.log("java test start");
//   var client = new TokenSecureClientImpl();
//   console.log("first command done");
//   console.log(client);
//   //var encCert = new X509Certificate();
//   var encCert = client.getTokenCert(1, 0);
//   //console.log(X509Certificate(encCert));
//  // var signCert = new X509Certificate();
//   var signCert = client.getTokenCert(2, 0);
//   var certInfo = new CertInfo(encCert);
//   console.log(certInfo.getCertType());
//   res.json({
//     code: 1,
//     // data : url
//   });
// });

//處理上傳單檔，以multer套件接name為single的前端input file
router.post('/uploadTemp', upload.single('single'), function (req, res, next) {
  //拼接檔案上傳後的網路路徑，
  // var url = `http://${req.headers.host}/upload/${req.file.originalname}`;
  // var url = 'http://' + req.headers.host + '/upload/' + req.file.originalname;
  //將其發回客戶端
  let path = tenderInfoObj.getTenderInfoObj().structurePath;
  let fileList = walker.walkForView(path, path);
  let listHtml = "<ul>";
  for (let index = 0; index < fileList.length; index++) {
    let file = fileList[index];
    let fileName = file.substring(1, file.length);
    listHtml += `<li>${file}<button class="button" onclick="delFile('${fileName}')">x</button></li>`;
  }
  listHtml += "</ul>";
  res.json({
    code: 1,
    listHtml: listHtml
    // data : url
  });
});

//處理上傳資料夾，以multer套件接name為multiple的前端input files
router.post('/multiUploadTemp', upload.array('multiple'), function (req, res, next) {
  let path = tenderInfoObj.getTenderInfoObj().structurePath;
  let fileList = walker.walkForView(path, path);
  let listHtml = "<ul>";
  for (let index = 0; index < fileList.length; index++) {
    let file = fileList[index];
    let fileName = file.substring(1, file.length);
    listHtml += `<li>${file}<button class="button" onclick="delFile('${fileName}')">x</button></li>`;
  }
  listHtml += "</ul>";
  res.json({
    code: 1,
    listHtml: listHtml
    // data : url
  });
});

//處理上傳投標須知，以multer套件接name為tender的前端input file
router.post('/uploadTenderTemp', upload.any('tender'), function (req, res, next) {
  let path = tenderInfoObj.getTenderInfoObj().structurePath;
  let fileList = walker.walkForView(path, path);
  let listHtml = "<ul>";
  for (let index = 0; index < fileList.length; index++) {
    let file = fileList[index];
    let fileName = file.substring(1, file.length);
    listHtml += `<li>${file}<button class="button" onclick="delFile('${fileName}')">x</button></li>`;
  }
  listHtml += "</ul>";
  res.json({
    code: 1,
    listHtml: listHtml
    // data : url
  });
});

//處理刪除上傳的檔案
router.post('/deleteFile', function (req, res, next) {
  let path = tenderInfoObj.getTenderInfoObj().structurePath;
  let filePath = path + "/" + req.body.fileName;
  //刪檔
  fs.unlink(filePath, function () {
    //刪除空資料夾
    deleteEmpty(path).then(deleted => {
      fs.exists(path, exist => {
        if (!exist) {
          fs.mkdir(path, err => {
            let fileList = walker.walkForView(path, path);
            let listHtml = "<ul>";
            for (let index = 0; index < fileList.length; index++) {
              let file = fileList[index];
              let fileName = file.substring(1, file.length);
              listHtml += `<li>${file}<button class="button" onclick="delFile('${fileName}')">x</button></li>`;
            }
            listHtml += "</ul>";
            res.json({
              code: 1,
              listHtml: listHtml
              // data : url
            });
          });
        } else {
          let fileList = walker.walkForView(path, path);
          let listHtml = "<ul>";
          for (let index = 0; index < fileList.length; index++) {
            let file = fileList[index];
            let fileName = file.substring(1, file.length);
            listHtml += `<li>${file}<button class="button" onclick="delFile('${fileName}')">x</button></li>`;
          }
          listHtml += "</ul>";
          res.json({
            code: 1,
            listHtml: listHtml
            // data : url
          });
        }
      })
    })
  })
});

/**
 * 文件上傳步驟四
 * 1.上傳檔案清單?
 *  抓取檔案路徑
 *  二代招標檔案路徑 C:/標案製作暫存區/{機關名稱}+{標案案號}+{-招標序號}
 *  資料夾:
 *    1._structure 放置簽章檔案.sig
 *    2._temp_outgoing (?)
 *    3.文件 (檔案 資料夾 etc)
 *    4.上傳憑據 {標案案號}+{_招標序號}+{_招標文件上傳憑據}.tkn 
 * 
 * 2.上傳文件檔案
 * 3.比對Client 和 Server 檔案
 * 4.設定文件上傳狀態
 * 5.取得上傳憑據
 */
router.post('/step4', function (req, res, next) {
  let tenderInfo = tenderInfoObj.getTenderInfoObj();
  //path 改為抓 tenderInfoObj.structurePath;
  let path = tenderInfo.structurePath;
  console.log("step4 :" + path);
  // console.log(fs.readdirSync(path));
  let fileListForView = walker.walkForView(path, path);
  let fileList = walker.walk(path, path);
  uploader.init(fileList);
  res.render('uploadStepFour', { fileList: fileListForView, tenderInfo: tenderInfo });
});


/**
 * 畫面按鈕按下文件上傳觸發的事件
 * 1. 取得文件上傳憑據
 * 2. 憑據寫成.tkn檔
 * 3. 上傳清單檔sig
 * 4. 上傳文件 (比對檔案, 續傳)
 */
router.post('/step4/upload', function(req, res, next){
  let tenderInfo = tenderInfoObj.getTenderInfoObj();
  
  //開始上傳 (tus續傳)
  uploader.uploadNext(true);
  res.send('OK');
});

router.post('/step4/uploadProgress' ,function(req, res){
  let progress = uploader.getUploadProgress();
  res.send({progress: progress});
});
/**
 * 暫停當前上傳檔案
 */
router.post('/step4/pause', function(req, res){
  console.log("request pause");
  uploader.pause();
  res.send("OK");
});

/**
 * 繼續上傳檔案
 */
router.post('/step4/resume', function(req, res){
  console.log('request resume');
  uploader.resume();
  res.send('OK');
});

//建立xml檔
function genXml(fileList){
  var xmlroot = xmlbuilder.create('root');
  xmlroot.ele('PK','50009527');
  xmlroot.ele('CountOfDocuments', fileList.length);
  var xmldoc;
  fileList.forEach(element => {
    let hash = md5(fs.readFileSync(`${element.path}/${element.filename}`));
    xmldoc = xmlroot.ele('Docunemt');
    xmldoc.ele('Path',element.path);
    xmldoc.ele('FileName',element.filename);
    xmldoc.ele('FileSize',element.fileSize);
    xmldoc.ele('MD5',hash);
  });
  xmlroot.ele('DocType','TPAM').end({pretty:true});
  //console.log(xmlroot);
  return xmlroot.toString();  
}

/**
 * 取得標案案號資料夾路徑 ex: C:/標案製作暫存區/測試機關一andy-1090207-01-01
 */
function getDocPath() {
  var params = tenderInfoObj.getTenderInfoObj();
  var basePath = config.get("tpam.basePath");
  var strTenderSq = String(params.tenderSq);
  var subPath = params.tenderOrgName + params.tenderCaseNo + "-" + strTenderSq;
  //set值 給後面功能使用
  params.structurePath = basePath + subPath;
  return basePath + subPath;
}

/**
 * 將解析後的bean json 轉成參數 更改 tenderInfoObj值
 * TODO 有沒有更好的做法??
 * @param {} source 
 */
function setTenderInfoObj(source) {
  let tenderInfo = tenderInfoObj.getTenderInfoObj();
  console.log(source);
  if (source) {
    tenderInfo.deptCharge = source[0].long;
    tenderInfo.docCharge = source[1].long;
    tenderInfo.docDate = source[2].object.long;
    tenderInfo.docOrgId = source[3].string;
    tenderInfo.docType = source[4].long;
    tenderInfo.eobtain = source[5].boolean;
    tenderInfo.fkPmsMain = source[6].long;
    tenderInfo.fkPmsProctrgCate = source[7].long;
    tenderInfo.fkPmsTenderWay = source[8].long;
    tenderInfo.opdt = source[9].object.long;
    tenderInfo.pkTpamTenderMain = source[10].long;
    tenderInfo.statusCode = source[11].string;
    tenderInfo.systemCharge = source[12].long;
    tenderInfo.targetDate = source[13].object.long;
    tenderInfo.tenderCaseNo = source[14].string;
    tenderInfo.tenderName = source[15].string;
    tenderInfo.tenderOrgId = source[16].string;
    tenderInfo.tenderOrgId2 = source[17].string;
    tenderInfo.tenderOrgName = source[18].string;
    
    if(String(source[19].string).length == 1)
      tenderInfoObj.getTenderInfoObj().tenderSq = "0" + source[19].string;
    else
      tenderInfoObj.getTenderInfoObj().tenderSq = source[19].string;
    if(String(source[20].string).length == 1)
      tenderInfoObj.getTenderInfoObj().tenderUpdateSq = "0" + source[20].string;
    else
      tenderInfoObj.getTenderInfoObj().tenderUpdateSq = source[20].string;
    tenderInfo.updateKey = source[21].long;

    console.log(tenderInfoObj.getTenderInfoObj());
  } else {
    tenderInfo.deptCharge = 1;
    tenderInfo.docCharge = 2;
    tenderInfo.docDate = 3;
    tenderInfo.docOrgId = 4;
    tenderInfo.docType = 5;
    tenderInfo.eobtain = 6;
    tenderInfo.fkPmsMain = 7;
    tenderInfo.fkPmsProctrgCate = 8;
    tenderInfo.fkPmsTenderWay = 9;
    tenderInfo.opdt = 10;
    tenderInfo.pkTpamTenderMain = 11;
    tenderInfo.statusCode = "12";
    tenderInfo.systemCharge = 13;
    tenderInfo.targetDate = 14;
    tenderInfo.tenderCaseNo = "15";
    tenderInfo.tenderName = "16";
    tenderInfo.tenderOrgId = "17";
    tenderInfo.tenderOrgId2 = "18";
    tenderInfo.tenderOrgName = "19";
    tenderInfo.tenderSq = "20";
    tenderInfo.tenderUpdateSq = "21";
    tenderInfo.updateKey = 22;
  }
}


module.exports = router;



//
  /*
  var tenderInfo = tenderInfoObj.getTenderInfoObj();
  var statusFolder = tenderInfo.structurePath + path.sep + ".status";
  //*建立狀態檔
  fs.exists(statusFolder, function(exists){
    if(!exists){
      fs.mkdirSync(statusFolder);
      //隱藏資料夾
      hidefile.hideSync(statusFolder);
    }
    fs.writeFileSync(statusFolder + path.sep + "step4","",{flag: 'w'});
    console.log("建立狀態檔完成");
    uploader.getToken();
    //doUpload();
  });
  */



  // var tenderInfo = tenderInfoObj.getTenderInfoObj();
  // var serverSetting = java.callStaticMethodSync("gov.pcc.geps.common.util.TpsUtils", "getServerSetting", "http://61.57.42.201:80/tps","http://61.57.42.201/tps/main/tps/tpam/status.txt", false, 10);
  // //console.log(serverSetting);
  // var projectPath = tenderInfo.tenderCaseNo + path.sep  + tenderInfo.tenderSq + path.sep  + tenderInfo.tenderUpdateSq + path.sep  + "_TEMP" + path.sep + "_structure";
  // console.log("projectPath ==>" + projectPath);
  // var clientPath = tenderInfo.structurePath;
  // console.log("clientPath ==>" + clientPath);
  // var serverRootPath = getServerRootPath();
  // console.log("serverRootPath ==>" + serverRootPath);
  // var incomingPath = java.callStaticMethodSync("java.lang.System", "getProperty", "java.io.tmpdir");
  // incomingPath += "incoming";
  // console.log("incomingPath ==>" + incomingPath);
  // var userHome = java.callStaticMethodSync("java.lang.System", "getProperty", "user.home");
  // java.callStaticMethodSync("java.lang.System", "setProperty", "FT_HOME", userHome + path.sep + "TpamUploader");
  // var downloader = new SmartDownloader(serverSetting, incomingPath, serverRootPath, projectPath, clientPath, 5, "1", "token");
  // var fileEntry = java.callMethodSync(downloader, "queryAllFilesByPath", null);
  // var lstEntry = java.callMethodSync(fileEntry, "getFileEntry");
  // var lstSize = java.callMethodSync(lstEntry, "size");
  // console.log("size:" + lstSize);
  // for(let i=0; i<lstSize; i++ ){
  //   let entry = java.callMethodSync(lstEntry,"get",i);
  //   console.log("===>" + entry);
  // }