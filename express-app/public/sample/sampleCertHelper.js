//interface MakeCredential {
//    tobesign: string;
//}
var certhandler;
var CertCtrHandler = (function () {
    function CertCtrHandler(submitbtn) {
        var _this = this;
        this.enabledebug = false;
        this.funcCode = 0;
        var ua = window.navigator.userAgent;
        this.currentPlugin = PlugIn.Default;
        if (this.getUrlParameter("debug") === "1") {
            this.enabledebug = true;
            alert("ie6:" + isIE(6) + "\nie7:" + isIE(7) + "\nie8:" + isIE(8) + "\nie9:" + isIE(9) + "\nie:" + isIE(null));
        }
        if (this.getUrlParameter("plugintype") !== "")
            this.renderActiveX(PlugIn[this.getUrlParameter("plugintype")], "httpObject");
        else {
            if (this.getUrlParameter("level") === "3") {
                if (ua.indexOf("MSIE") !== -1 || ua.indexOf("Trident") !== -1)
                    this.renderActiveX(PlugIn.HcaActiveX, "httpObject");
                else
                    alert("HCA必須使用IE瀏覽器並設定為相容模式!!");
            }
            else {
                var iever = detectIE();
                if (iever !== 0) {
                    if (isIE(6) || isIE(7) || isIE(9))
                        this.renderActiveX(PlugIn.CAActiveX, "httpObject");
                    else
                        this.renderActiveX(PlugIn.HttpComponent, "httpObject");
                }
                else
                    this.renderActiveX(PlugIn.HttpComponent, "httpObject");
                this.credentialObj = document.getElementById("CredentialObj");
            }
        }
        //20191007 victor
        //原檢測點為偵測到有新增事件時觸發this.receiveMessage, 移至submitbtn事件觸發 
        //if (window.addEventListener) {
        //    console.log(window.addEventListener);
        //    window.addEventListener("message", this.receiveMessage, false);
        //}
        //20200225 調整觸發事件不判斷是否安裝讀卡元件直接驗卡, 不過則視同為沒元件
        //但因為程式使用this. 所以在checkFinish()那一段有問題, 無法正常關閉視窗,
        //且chrome無法彈出alert
        submitbtn.onclick = function () {
            if (ua.indexOf("MSIE") !== -1 || ua.indexOf("Trident") !== -1) {
                _this.receiveMessage;
            }
            else {
                window.addEventListener("message", _this.receiveMessage, false);
                console.log('CertHelper', event);
            }
            _this.makeSignature();
        };
        certhandler = this;
    }
    CertCtrHandler.prototype.getUrlParameter = function (param) {
        var sPageUrl = window.location.search.substring(1);
        var sUrlVariables = sPageUrl.split("&");
        for (var i = 0; i < sUrlVariables.length; i++) {
            var parameterName = sUrlVariables[i].split("=");
            if (parameterName[0] === param) {
                return parameterName[1];
            }
        }
        return "";
    };
    CertCtrHandler.prototype.getToBeSign = function () {
        var name = document.getElementById("txt_Name");
        var uid = document.getElementById("txt_UID");
        return name.value + "," + uid.value;
    };
    CertCtrHandler.prototype.getPin = function () {
        var pin = document.getElementById("txt_Pin");
        if (pin.value === "") {
            window.alert("請輸入憑證密碼");
            return "";
        }
        return pin.value;
    };
    CertCtrHandler.prototype.renderActiveX = function (objtype, tagName) {
        switch (objtype) {
            case PlugIn.HcaActiveX:
                document.getElementById(tagName).innerHTML = '<OBJECT id=CredentialObj style="LEFT: 0px; DISPLAY: none; TOP: 0px" codeBase="/Portal/plugin/HCAAuthClient.cab#version=1,0,0,1" classid=clsid:23A17DFD-1A23-48A7-9247-8E2F2A766F3D viewastext>用戶端元件</OBJECT>';
                break;
            case PlugIn.CAActiveX:
                document.getElementById(tagName).innerHTML = '<OBJECT id=GetCertKeyObj style="LEFT: 0px; DISPLAY: none; TOP: 0px" codeBase="/Portal/plugin/GetICCertHiCOS.cab#version=1,0,0,1" classid=clsid:B262AD61-3462-4A4D-8257-E7B74AB817CA VIEWASTEXT>用戶端元件</OBJECT><OBJECT id=CredentialObj style="LEFT: 0px; DISPLAY: none; TOP: 0px" codeBase="/Portal/plugin/AAAuthClientHiCOS.cab#version=1,0,0,4" classid=clsid:13E6F1F2-24A8-4096-B0D2-5F6620DEF208 VIEWASTEXT>用戶端元件HiCos</OBJECT>';
                break;
            case PlugIn.HttpComponent:
                document.getElementById(tagName).innerHTML = '<object id="CredentialObj" width=1 height=1 style="LEFT: 1px; TOP: 1px" type="application/x-httpcomponent" viewastext></object>';
                break;
        }
        this.currentPlugin = objtype;
        if (this.enabledebug)
            alert(PlugIn[this.currentPlugin] + " Loading...");
    };
    CertCtrHandler.prototype.getbyActiveX = function (tobesign, pin) {
        if (this.enabledebug)
            alert(document.getElementById("CredentialObj").outerHTML);
        this.x509Credential = makeCredential(tobesign, pin);
        //console.log(this.x509Credential);
        if (typeof (this.x509Credential) != "string") {
            //thisForm.submit();
            alert("憑證讀取失敗，請使用IE8或將www.cp.gov.tw網站新增至「相容性檢視」的網站!!");
            pin.value = "";
            return false;
        }
        if (this.x509Credential.substring(0, 4) !== "Fail") {
            document.getElementById("txt_Credential").value = base64.encode(this.x509Credential);
            document.getElementById("btn_Submit").click();
            return true;
        }
        else {
            if (this.x509Credential.substring(0, 9) === "Fail,Make") {
                var x = window.confirm("憑證登入失敗! ActiveX元件未啟用，可能是由於:\n1).您的安全性設定阻止了本站為您安裝ActiveX元件, 請將本站加入信任網站, 並同意系統提示的元件安裝與下載\n2).您的瀏覽器設定將此元件設為 [停用]\n您是否要前往 [帳號/憑證登入問題-->憑證使用常見問題] 檢示相關設定說明?");
                if (x)
                    location.replace("http://www.gsp.gov.tw/egov/faq/FAQ06.html#Q12");
            }
            else if (this.x509Credential.substring(0, 10) === "Fail,錯誤代碼:") {
                var y = window.confirm(String("\u6191\u8B49\u5E33\u865F\u7D81\u5B9A\u5931\u6557! (" + this.x509Credential + ") \n\n\u60A8\u662F\u5426\u8981\u524D\u5F80FAQ\u6191\u8B49\u4F7F\u7528\u5E38\u898B\u554F\u984CQ16\u5354\u52A9\u60A8\u6392\u9664\u554F\u984C\uFF1F"));
                if (y)
                    location.replace("http://www.gsp.gov.tw/egov/faq/FAQ06.html#Q16");
            }
            else {
                alert(this.x509Credential.replace("Fail,", ""));
                pin.focus();
            }
        }
        return false;
    };
    CertCtrHandler.prototype.makeSignature = function () {
        var pin = this.getPin();
        var postTarget;
        if (pin === "")
            return false;
        else {
            this.funcCode = 1;
            var tobesign = this.getToBeSign();
            //console.log(PlugIn[this.currentPlugin]);
            if (this.enabledebug)
                alert("\u5373\u5C07\u547C\u53EB" + PlugIn[this.currentPlugin] + "\u5143\u4EF6");
            var pluginDownload = "https://gcaweb.nat.gov.tw/GCAEE/GCA2Test/commonEXE/%E8%B7%A8%E5%B9%B3%E5%8F%B0%E7%B6%B2%E9%A0%81%E5%85%83%E4%BB%B6.zip";
            switch (this.currentPlugin) {
                case PlugIn.HcaActiveX:
                case PlugIn.CAActiveX:
                    return this.getbyActiveX(tobesign, pin);
                //break;
                case PlugIn.HttpComponent:
                    //var isInstall = checkLocalServer();
                    var isInstall = true;
                    if (isInstall) {
                        var ua = window.navigator.userAgent;
                        var pf = window.navigator.platform;
                        if (pf.indexOf("Mac") != -1 && ua.indexOf("Safari") != -1 && ua.indexOf("Chrome") === -1) {
                            this.postTarget = window.open("http://localhost:61161/waiting.gif", "Signing", "height=200, width=200, left=100, top=20");
                            var tbsPackage = getTbsPackage(tobesign, pin, this.funcCode);
                            var data = this.postData("http://localhost:61161/sign", "tbsPackage=" + tbsPackage);
                            this.postTarget.close();
                            this.postTarget = null;
                            if (data) {
                                return this.setSignature(data);
                            }
                            isInstall = checkcardreader();
                        }
                        if (ua.indexOf("MSIE") != -1 || ua.indexOf("Trident") != -1) {
                            //this.postTarget = window.open("http://localhost:61161/waiting.gif", "Signing", "height=200, width=200, left=100, top=20");
                            var tbsPackage = getTbsPackage(tobesign, pin, this.funcCode);
                            var data = this.postData("http://localhost:61161/sign", "tbsPackage=" + tbsPackage);
                            //this.postTarget.close();
                            //this.postTarget = null;
                            if (data) {
                                return this.setSignature(data);
                            }
                            isInstall = checkcardreader();
                        }
                        else {
                            //console.log(certhandler.getToBeSign());
                            //console.log(this.postTarget)
                            this.postTarget = window.open("http://localhost:61161/popupForm", "簽章中", "height=200, width=200, left=100, top=20");
                            this.timeoutId = setTimeout(this.checkFinish, 3500);
                        }
                    }
                    break;
                case PlugIn.Default:
                    //var isInstall = checkLocalServer();
                    var isInstall = true;
                    if (isInstall) {
                        this.postTarget = window.open("http://localhost:61161/popupForm", "簽章中", "directories=no,titlebar=no,toolbar=no,location=no,status=no,menubar=no,scrollbars=no,resizable=no,width=200,height=200");
                        this.timeoutId = setTimeout(this.checkFinish, 3500);
                    }
                    break;
            }
        }
        return false;
    };
    CertCtrHandler.prototype.postData = function (target, data) {
        var ua = window.navigator.userAgent;
        var pf = window.navigator.platform;
        if (pf.indexOf("Mac") != -1 && ua.indexOf("Safari") != -1) {
            var xhttp = new XMLHttpRequest();
            xhttp.open("POST", target, false);
            xhttp.send(data);
            return xhttp.responseText;
        }
        else {
            if (!this.credentialObj.sendRequest)
                return null;
            this.credentialObj.url = target;
            this.credentialObj.actionMethod = "POST";
            var code = this.credentialObj.sendRequest(data);
            if (code !== 0)
                return null;
            return this.credentialObj.responseText;
        }
    };
    CertCtrHandler.prototype.setSignature = function (signature) {
        var ret = JSON.parse(signature);
        if (ret.ret_code === 0) {
            var hexSignature = base64.ToHexString(base64Java.decode(ret.certb64, null)).toUpperCase();
            var hexCert = base64.ToHexString(base64Java.decode(ret.signature, null)).toUpperCase();
            var hexScap = null;
            if (ret.SCAP != null)
                hexScap = base64.ToHexString(base64Java.decode(ret.SCAP, null)).toUpperCase();
            if (hexScap != null)
                this.x509Credential = "<Credential>\n<Context>" + this.getToBeSign() + "</Context>\n<X509Cert>" + hexSignature + "</X509Cert>\n<DigitalSignature>" + hexCert + "</DigitalSignature>\n<AuthFile>" + hexScap + "</AuthFile>\n</Credential>";
            else
                this.x509Credential = "<Credential>\n<Context>" + this.getToBeSign() + "</Context>\n<X509Cert>" + hexSignature + "</X509Cert>\n<DigitalSignature>" + hexCert + "</DigitalSignature>\n<AuthFile>(null)</AuthFile>\n</Credential>";
            document.getElementById("txt_Credential").value = base64.encode(this.x509Credential);
            document.getElementById("btn_Submit").click();
            return true;
        }
        else {
            alert(majorErrorReason(ret.ret_code));
            if (ret.last_error)
                alert(minorErrorReason(ret.last_error));
            return false;
        }
    };
    CertCtrHandler.prototype.getUserCert = function () {
        var ua = window.navigator.userAgent;
        this.funcCode = 2;
        if (ua.indexOf("MSIE") !== -1 || ua.indexOf("Trident") !== -1) {
            this.postTarget = window.open("http://localhost:61161/waiting.gif", "憑證讀取中", "height=200, width=200, left=100, top=20");
            //renderActiveX("HttpComponent", "httpObject");
            var data = this.postData("http://localhost:61161/pkcs11info?withcert=true", "");
            this.postTarget.close();
            this.postTarget = null;
            if (!data)
                alert("尚未安裝元件(GetUserCert)");
            else
                this.setUserCert(data);
        }
        else {
            this.postTarget = window.open("http://localhost:61161/popupForm", "憑證讀取中", "height=200, width=200, left=100, top=20");
            this.timeoutId = setTimeout(this.checkFinish, 3500);
        }
    };
    CertCtrHandler.prototype.setUserCert = function (certData) {
        var ret = JSON.parse(certData);
        document.getElementById("returnCode").value = ret.ret_code;
        if (ret.ret_code != 0) {
            alert(majorErrorReason(ret.ret_code));
            if (ret.last_error)
                alert(minorErrorReason(ret.last_error));
            return;
        }
        var usage = "keyEncipherment|dataEncipherment";
        var slots = ret.slots;
        for (var index in slots) {
            if (slots[index].token == null || slots[index].token === "unknown token")
                continue;
            var certs = slots[index].token.certs;
            for (var indexCert in certs) {
                if (certs[indexCert].usage == usage) {
                    document.getElementById("certb64").value = certs[indexCert].certb64;
                    return;
                }
            }
        }
        alert("找不到可用來加密的憑證");
    };
    CertCtrHandler.prototype.checkFinish = function () {
        //console.log('checkfinish')
        if (this.postTarget) {
            this.postTarget.close();
            //console.log('close postTarget')
            alert("尚未安裝元件2");
        }
        checkcardreader();
    };
    CertCtrHandler.prototype.receiveMessage = function (event) {
        if (console)
            console.debug(event);
        //安全起見，這邊應填入網站位址檢查
        if (event.origin !== "http://localhost:61161")
            return;
        try {
            var ret = JSON.parse(event.data);
            if (ret.func) {
                switch (ret.func) {
                    case "getTbs":
                        clearTimeout(certhandler.timeoutId);
                        var json = getTbsPackage(certhandler.getToBeSign(), certhandler.getPin(), certhandler.funcCode);
                        certhandler.postTarget.postMessage(json, "*");
                        break;
                    case "sign":
                        certhandler.setSignature(event.data);
                        break;
                    case "pkcs11info":
                        certhandler.setUserCert(event.data);
                        break;
                }
            }
            else {
            }
        }
        catch (e) {
        }
    };
    return CertCtrHandler;
}());
function checkcardreader() {
    console.log('checkcardreader');
    var platform = window.navigator.platform;
    var pluginDownload = "";
    if (platform.indexOf("Win") !== -1)
        pluginDownload = "http://api-hisecurecdn.cdn.hinet.net/HiCOS_Client.zip";
    if (platform.indexOf("Mac") !== -1)
        pluginDownload = "http://api-hisecurecdn.cdn.hinet.net/HiPKILocalSignServer/package/mac/x64/HIPKILocalSerer1.3.1.pkg";
    if (platform.indexOf("Linux") !== -1)
        pluginDownload = "http://api-hisecurecdn.cdn.hinet.net/HiPKILocalSignServer/package/linux/x64/HiPKILocalSignServerApp1.3.1.tar.gz";
    setTimeout(function () {
        window.alert("請安裝或更新跨平臺網頁元件(Signature),並選擇「立刻啟動 跨平臺網頁元件」");
        window.location.href = pluginDownload;
    }, 1000);
    return true;
}
function checkLocalServer() {
    var l_oToken = getICToken();
    if (!l_oToken) {
        alert("讀卡元件不存在");
        return false;
    }
    else {
        //Check local Server 是否存在
        var platform = window.navigator.platform;
        l_oToken.goodDay(function () {
            var l_oToken = getICToken();
            var pluginDownload = "";
            if (platform.indexOf("Win") !== -1)
                pluginDownload = "http://api-hisecurecdn.cdn.hinet.net/HiCOS_Client.zip";
            if (platform.indexOf("Mac") !== -1)
                pluginDownload = "http://api-hisecurecdn.cdn.hinet.net/HiPKILocalSignServer/package/mac/x64/HIPKILocalSerer1.3.1.pkg";
            if (platform.indexOf("Linux") !== -1)
                pluginDownload = "http://api-hisecurecdn.cdn.hinet.net/HiPKILocalSignServer/package/linux/x64/HiPKILocalSignServerApp1.3.1.tar.gz";
            if (l_oToken.RetObj.RCode == 2202 || l_oToken.RetObj.RCode == 3102 || l_oToken.RetObj.RMsg.indexOf("2200") >= 0) {
                alert("請安裝或更新跨平臺網頁元件(Signature),並選擇「立刻啟動 跨平臺網頁元件」.");
                window.location.href = pluginDownload;
            }
        });
        if (l_oToken.RetObj.RCode == 2202 || l_oToken.RetObj.RCode == 3102 || l_oToken.RetObj.RMsg.indexOf("2200") >= 0)
            return false;
        else
            return true;
    }
}
function getTbsPackage(tbs, pin, func) {
    var tbsData, json;
    switch (func) {
        case 1:
            tbsData = {};
            tbsData["tbs"] = tbs;
            tbsData["tbsEncoding"] = "NONE";
            tbsData["hashAlgorithm"] = "SHA256";
            tbsData["pin"] = pin;
            tbsData["func"] = "MakeSignature";
            tbsData["signatureType"] = "PKCS1";
            tbsData["withSCAP"] = "true";
            json = JSON.stringify(tbsData).replace(/\+/g, "%2B");
            ;
            break;
        case 2:
            tbsData = { "func": "GetUserCert" };
            json = JSON.stringify(tbsData);
            break;
    }
    return json;
}
var PlugIn;
(function (PlugIn) {
    PlugIn[PlugIn["Default"] = 0] = "Default";
    PlugIn[PlugIn["HcaActiveX"] = 1] = "HcaActiveX";
    PlugIn[PlugIn["CAActiveX"] = 2] = "CAActiveX";
    PlugIn[PlugIn["HttpComponent"] = 3] = "HttpComponent";
})(PlugIn || (PlugIn = {}));
;
function openWindowWithPost(url, name, keys, values) {
    var newWindow = window.open("", name, "height=700, width=600, toolbar=no, menubar=no, scrollbars=yes, resizable=yes, location=no, status=no");
    if (!newWindow)
        return false;
    var html = "";
    html += "<html><head></head><body><form id='formid' method='post' action='" + url + "'>";
    if (keys && values && (keys.length == values.length))
        for (var i = 0; i < keys.length; i++)
            html += "<input type='hidden' name='" + keys[i] + "' value='" + values[i] + "'/>";
    html += "</form><script type='text/javascript'>document.getElementById(\"formid\").submit()</script></body></html>";
    newWindow.document.write(html);
    return newWindow;
}
/**
 * detect IE
 * returns version of IE or false, if browser is not Internet Explorer
 */
function detectIE() {
    var ua = window.navigator.userAgent;
    // Test values; Uncomment to check result …
    // IE 10
    // ua = 'Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.2; Trident/6.0)';
    // IE 11
    // ua = 'Mozilla/5.0 (Windows NT 6.3; Trident/7.0; rv:11.0) like Gecko';
    // IE 12 / Spartan
    // ua = 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.71 Safari/537.36 Edge/12.0';
    // Edge (IE 12+)
    // ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/46.0.2486.0 Safari/537.36 Edge/13.10586';
    var msie = ua.indexOf("MSIE ");
    if (msie > 0) {
        // IE 10 or older => return version number
        return parseInt(ua.substring(msie + 5, ua.indexOf(".", msie)), 10);
    }
    var trident = ua.indexOf("Trident/");
    if (trident > 0) {
        // IE 11 => return version number
        var rv = ua.indexOf("rv:");
        return parseInt(ua.substring(rv + 3, ua.indexOf(".", rv)), 10);
    }
    var edge = ua.indexOf("Edge/");
    if (edge > 0) {
        // Edge (IE 12+) => return version number
        return parseInt(ua.substring(edge + 5, ua.indexOf(".", edge)), 10);
    }
    // other browser
    return 0;
}
var base64 = {
    _keyStr: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
    encode: function (e) {
        var t = "";
        var n, r, i, s, o, u, a;
        var f = 0;
        e = base64._utf8_encode(e);
        while (f < e.length) {
            n = e.charCodeAt(f++);
            r = e.charCodeAt(f++);
            i = e.charCodeAt(f++);
            s = n >> 2;
            o = (n & 3) << 4 | r >> 4;
            u = (r & 15) << 2 | i >> 6;
            a = i & 63;
            if (isNaN(r)) {
                u = a = 64;
            }
            else if (isNaN(i)) {
                a = 64;
            }
            t = t + this._keyStr.charAt(s) + this._keyStr.charAt(o) + this._keyStr.charAt(u) + this._keyStr.charAt(a);
        }
        return t;
    },
    decode: function (e) {
        var t = "";
        var n, r, i;
        var s, o, u, a;
        var f = 0;
        e = e.replace(/[^A-Za-z0-9\+\/\=]/g, "");
        while (f < e.length) {
            s = this._keyStr.indexOf(e.charAt(f++));
            o = this._keyStr.indexOf(e.charAt(f++));
            u = this._keyStr.indexOf(e.charAt(f++));
            a = this._keyStr.indexOf(e.charAt(f++));
            n = s << 2 | o >> 4;
            r = (o & 15) << 4 | u >> 2;
            i = (u & 3) << 6 | a;
            t = t + String.fromCharCode(n);
            if (u !== 64) {
                t = t + String.fromCharCode(r);
            }
            if (a !== 64) {
                t = t + String.fromCharCode(i);
            }
        }
        t = base64._utf8_decode(t);
        return t;
    },
    _utf8_encode: function (e) {
        e = e.replace(/\r\n/g, "\n");
        var t = "";
        for (var n = 0; n < e.length; n++) {
            var r = e.charCodeAt(n);
            if (r < 128) {
                t += String.fromCharCode(r);
            }
            else if (r > 127 && r < 2048) {
                t += String.fromCharCode(r >> 6 | 192);
                t += String.fromCharCode(r & 63 | 128);
            }
            else {
                t += String.fromCharCode(r >> 12 | 224);
                t += String.fromCharCode(r >> 6 & 63 | 128);
                t += String.fromCharCode(r & 63 | 128);
            }
        }
        return t;
    },
    _utf8_decode: function (e) {
        var t = "";
        var n = 0;
        var c1;
        var c2;
        var c3;
        var r = c1 = c2 = 0;
        while (n < e.length) {
            r = e.charCodeAt(n);
            if (r < 128) {
                t += String.fromCharCode(r);
                n++;
            }
            else if (r > 191 && r < 224) {
                c2 = e.charCodeAt(n + 1);
                t += String.fromCharCode((r & 31) << 6 | c2 & 63);
                n += 2;
            }
            else {
                c2 = e.charCodeAt(n + 1);
                c3 = e.charCodeAt(n + 2);
                t += String.fromCharCode((r & 15) << 12 | (c2 & 63) << 6 | c3 & 63);
                n += 3;
            }
        }
        return t;
    },
    ToHexString: function (arr) {
        var str = '';
        for (var i = 0; i < arr.length; i++) {
            str += ((arr[i] < 16) ? "0" : "") + arr[i].toString(16);
        }
        return str;
    }
};
var base64Java = {
    _keyStr: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
    /* will return a  Uint8Array type */
    decodeArrayBuffer: function (input) {
        var bytes = (input.length / 4) * 3;
        var ab = new ArrayBuffer(bytes);
        this.decode(input, ab);
        return ab;
    },
    removePaddingChars: function (input) {
        var lkey = this._keyStr.indexOf(input.charAt(input.length - 1));
        if (lkey === 64) {
            return input.substring(0, input.length - 1);
        }
        return input;
    },
    decode: function (input, arrayBuffer) {
        //get last chars to see if are valid
        input = this.removePaddingChars(input);
        input = this.removePaddingChars(input);
        var bytes = parseInt(((input.length / 4) * 3).toString(), 10);
        var uarray;
        var chr1, chr2, chr3;
        var enc1, enc2, enc3, enc4;
        var i = 0;
        var j = 0;
        if (arrayBuffer)
            uarray = new Uint8Array(arrayBuffer);
        else
            uarray = new Uint8Array(bytes);
        input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");
        for (i = 0; i < bytes; i += 3) {
            //get the 3 octects in 4 ascii chars
            enc1 = this._keyStr.indexOf(input.charAt(j++));
            enc2 = this._keyStr.indexOf(input.charAt(j++));
            enc3 = this._keyStr.indexOf(input.charAt(j++));
            enc4 = this._keyStr.indexOf(input.charAt(j++));
            chr1 = (enc1 << 2) | (enc2 >> 4);
            chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
            chr3 = ((enc3 & 3) << 6) | enc4;
            uarray[i] = chr1;
            if (enc3 !== 64)
                uarray[i + 1] = chr2;
            if (enc4 !== 64)
                uarray[i + 2] = chr3;
        }
        return uarray;
    }
};
var isIE = function (ver) {
    var b = document.createElement("b");
    b.innerHTML = "<!--[if IE " + ver + "]><i></i><![endif]-->";
    return b.getElementsByTagName("i").length === 1;
};
//# sourceMappingURL=CertHelper.js.map