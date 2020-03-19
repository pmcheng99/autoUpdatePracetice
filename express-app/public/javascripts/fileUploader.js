var fs = require('fs');
var FormData = require('form-data');
var tenderInfoObj = require('./tenderInfoObj.js');
var pathUtil = require('path');
var config = require('config');
var tusUploader = require('./tusUploader.js').tusUploader;
var HashMap = require('hashmap');
//var http = require('http');

//APServer上傳檔案url
const geps3_test_url = "http://127.0.0.1:8080/tps/tpam/tenderUpload/multipartFile";

const geps3_test_url2 = "http://127.0.0.1:8080/tps/tpam/tenderUpload/upload";

const geps3_test_vm_url = "http://192.168.56.102:8080/tps/tpam/tenderUpload/multipartFile";

//APServer取得憑據url
const geps3_token_url = "http://127.0.0.1:8080/tps/tpam/tenderUpload/getToken";

const statusFilePath = config.get("statusFilePath.step4");

//上傳清單queue
var _tusQueue = [];

//當下處理上傳的物件
var _currTusUpload = null;

//存入被中斷的上傳物件
var _pausedTusMap = new HashMap();

//已完成的量
var _finishedCount = 0;

var _progress = 0;

var _taskCount = 0;

//初始上傳清單array
var initUploader = function(fileList){
    console.log("init uploader");
    
    initGlobal();

     //準備傳至AP server 參數
     let params = tenderInfoObj.getTenderInfoObj(); 
     //要寫到apserver的路徑
     let apPath = getDocInApServerPath(); 
     //客戶端檔案跟目錄 + 標案案號資料夾路徑
     let structurePath = params.structurePath;

     // 建立上傳物件前 先檢查是否有上傳到一半的檔案, 如果有不建立新的取舊的放入array
     fileList.forEach(element =>{
        let filePath = String(element).split(structurePath)[1];
        let targetPath = apPath + filePath;
        let filename = pathUtil.basename(element);
        if(!_pausedTusMap.has(filename)){
            _tusQueue.unshift(new tusUploader(element, targetPath));
        }else{
            //將上次沒上傳完的tusupload放入array
            _tusQueue.unshift(_pausedTusMap.get(filename));
        }
     });
     //取得欲上傳檔案數量
     _taskCount += _tusQueue.length;

}

/**
 * 啟動上傳作業 & 執行下一個檔案上傳
 */
function uploadNext(isStart){
    if(!isStart){
        _finishedCount ++;
        calculateProgress();
    }
    _currTusUpload = null;
    resumeUpload();
}

function pauseUpload(){
    if(_currTusUpload != null){
        console.log("pause upload : + " + _currTusUpload.getFileName());
        _currTusUpload.pauseUpload();
        //存入map 
        _pausedTusMap.set(_currTusUpload.getFileName(), _currTusUpload);
    }
}

function resumeUpload(){
    //先檢查上一次上傳是否有上傳到一半的檔案
    if(_currTusUpload != null){
        console.log("resume upload : + " + _currTusUpload.getFileName());
        _currTusUpload.startUpload();
    }else{
        if(_tusQueue.length > 0){
            _currTusUpload = _tusQueue.pop();
            console.log("prepare to upload :" + _currTusUpload.getFileName());
            _currTusUpload.startUpload();
        }else{
            console.log("上傳完成");
        }
    }
}

function getProgress(){
    return _progress;
}

/**
 * 計算上傳進度 更新全域變數 _progress
 */
function calculateProgress(){
    var percent =((_finishedCount / _taskCount) * 100).toFixed(0);
    console.log("Progress ==>" + percent);
    _progress = percent;
}

//清空全域變數
function initGlobal(){
    _tusQueue = [];
    _currTusUpload = null;
    _pausedTusMap = new HashMap();
    _progress = 0;
    _taskCount = 0;
    _finishedCount = 0;
    console.log("Clear global var");
}
/*  AP Server param
		BigDecimal pKey =  null;
		int docType = -1;
		String updateSq = null;
		//文件相對路徑
        String projectPath = null;
        strServerPath=TPAM+"/"+DateUtils.getYear(docate) +"/"+ DateUtils.getMonthStr(docate)+"/"+DateUtils.formatDate(docate, "yyyy-MM-dd") +"/"+
        tpamTenderInfoTo.getDocOrgId()+"/"
        +tpamTenderInfoTo.getTenderCaseNo()+"_"+strTenderSq+"/"+strTenderUpdateSq+"_TEMP";
		//工程類標案
		String projectId = null;
		String projectOrgId = null;
		String projectName = null;
        String projectFilePath = null;	
        
    /**
	 * 文件類別
	 * 0:招標文件暫存
	 * 1:招標文件
	 * 2:GPA政府採購預告
	 * 3:公告
	 * 4:公開徵求暫存
	 * 5:公開徵求
	 * 6:簽約暫存
	 * 7:簽約
	 */
  //向Ap server 取得上傳憑據
  var getToken = function(){
    var tenderInfo = tenderInfoObj.getTenderInfoObj();
    var structurePath = tenderInfo.structurePath;
    console.log("status ==>" + structurePath + statusFilePath);
    fs.appendFileSync(structurePath + statusFilePath, "●取得文件上傳電子憑據;");
    var tenderInfo = tenderInfoObj.getTenderInfoObj();
    var apPath = getDocInApServerPath();
    var params = {
        pkey: tenderInfo.fkPmsMain,
        docType: 0,
        updateSq: tenderInfo.tenderUpdateSq,
        projectPath: apPath,
        projectId:"",
        projectOrgId:"",
        projectName:"",
        projectFilePath:""
    }
    //console.log(params);
    //測試sig path先寫死
    let path = "C:/標案製作暫存區/測試機關一andy-1090207-01-01/_structure/andy-1080927-01_01.sig";
    var sigData = fs.readFileSync(path.replace(/\\/g, pathUtil.sep).replace(/\//g, pathUtil.sep));
   // console.log("sig==>" + sigData);
    var token = "";
    var formData = new FormData();
    formData.append('params', JSON.stringify(params));
    formData.append('sig', sigData);
    formData.submit(geps3_token_url, function (err, res) {
        if (err) throw err;
        console.log(res.statusCode);
        //取得response body
        res.on('data', function(body){
            token +=body;
        });

        res.on('end', function(){
            var tokenPath = structurePath + pathUtil.sep + tenderInfo.tenderOrgId + "_" + tenderInfo.tenderCaseNo + "_" + tenderInfo.tenderSq + "_" + config.get("localTokenName.tpam");
            fs.writeFileSync(tokenPath, token);
            console.log("Write token finished => " + tokenPath);
            fs.appendFileSync(structurePath + statusFilePath, "●取得文件上傳電子憑據完成;");
            //假設所有步驟都完成
            //fs.appendFileSync(structurePath + statusFilePath, "end;");

        });
    });

}

//Example : /gepsFiles/filesUpload/tps/ServerStorage/storage/TPAM/2020/02/2020-02-14/3.87.10.2/109A-039_01/01/
function getDocInApServerPath(){
    var params = tenderInfoObj.getTenderInfoObj();
    var targetDate = new Date(params.targetDate);
    var docType = params.docType;
    var apPath ="/";
    switch(docType){
        case 0:
        case 1:
            apPath += "TPAM";
            break;
    }
    //for linux  FIXME  01 ==>01_TEMP
    apPath = apPath + "/" + targetDate.getFullYear() + "/" + targetDate.toISOString().slice(5,7) + "/" + targetDate.toISOString().slice(0,10) + "/" + params.tenderOrgId + "/" + params.tenderCaseNo + "_" + params.tenderSq + "/" + params.tenderUpdateSq; 
    console.log("apPath:" + apPath);
    return apPath;
}

module.exports = {
    init: initUploader,
    uploadNext: uploadNext,
    resume: resumeUpload,
    pause: pauseUpload,
    getToken: getToken,
    getUploadProgress: getProgress
}




/*
function startUpload(fileList, info) {
    
    fileList.forEach(element => {
        //取得標案案號以後的資料夾目錄
        var filePath = String(element).split(info.clnPath)[1];
        //告訴server 檔案要存到哪
        var targetPath = info.apPath + filePath;
        console.log("targetPath :" + targetPath);
        console.log("Ready to send :" + element);
        var formData = new FormData();
        formData.append('file', fs.createReadStream(element));
        //以標案資訊組好的目標路徑送至ap server
        formData.append('targetPath', targetPath);
        formData.submit(geps3_test_vm_url, function (err, res) {
            if (err) {
                console.log(err);
            } else {
                console.log(res.statusCode);
                //取得response body
                res.on('data', function (body) {
                    console.log("body:" + body);
                });
                res.on('end', function () {
                    console.log("formData end");
                });
            }
        });
    });
}
*/