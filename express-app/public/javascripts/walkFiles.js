var fs = require('fs');
/**
 * 走遍路徑所有檔案 顯示畫面用
 * @param {*} dir 路徑(遞迴用)
 * @param {*} base 路徑
 */
var walkForView = function(dir, base){
    let result = [];
    let list = fs.readdirSync(dir);
    list.forEach(function(file){
        file = dir + "/" + file;
        var stat = fs.statSync(file);
        //如果檔案為資料夾
        if(stat && stat.isDirectory()){
            if(file.includes('.status')) return;
            result = result.concat(walkForView(file, base));
        }else{
            //憑據檔不用取 & 清單檔不用取
            if(file.includes('.tkn') || file.includes('.sig'))
                return;
            else{
                result.push(file.split(base)[1]);
            }
        }
    });
    return result;
}
/**
 * 走遍路徑所有檔案(產生簽章用的檔案清單)
 * @param {*} dir 
 * @param {*} base 
 */
var walkForXML = function(dir, base) {
    let result = [];
    console.log(dir);
    let list = fs.readdirSync(dir);
    list.forEach(function(file){
        console.log(file);
        let singleFile = {};
        let stats = fs.statSync(`${dir}/${file}`);
        if (stats && stats.isDirectory()){
            let sub = walkForXML(`${dir}/${file}`, `${dir}/${file}`);
            sub.forEach(element => {
                result.push(element);
            });
        } else {
            singleFile["filename"] = file;
            singleFile["fileSize"] = stats.size;
            singleFile["path"] = dir;
            result.push(singleFile);
        }
    });
    return result;
}

/**
 * 走遍路徑所有檔案
 * @param {*} dir 路徑(遞迴用)
 * @param {*} base 路徑
 */
var walk = function(dir, base){
    let result = [];
    let list = fs.readdirSync(dir);
    list.forEach(function(file){
        file = dir + "/" + file;
        var stat = fs.statSync(file);
        //如果檔案為資料夾
        if(stat && stat.isDirectory()){
            if(file.includes('.status')) return;
            result = result.concat(walk(file, base));
        }else{
            //憑據檔不用取
            if(file.includes('.tkn'))
                return;
            else{
                result.push(file);
            }
        }
    });
    return result;
}

module.exports = { 
    walk : walk,
    walkForView : walkForView,
    walkForXML : walkForXML
};