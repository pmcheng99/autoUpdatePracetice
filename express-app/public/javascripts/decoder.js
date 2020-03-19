module.exports = {
    //解密base64
    decodeBase64 : function(encode){
        let buff = new Buffer.from(encode, 'base64');
        let text = buff.toString();
        return text;
    }
};