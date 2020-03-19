var tenderInfoObj = {
    deptCharge: -1,
    docCharge: -1,
    docDate: -1,
    docOrgId: "",
    docType: -1,
    eobtain: true,
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
    fkPmsMain: -1,
    fkPmsProctrgCate: -1,
    fkPmsTenderWay: -1,
    opdt: -1,
    pkTpamTenderMain: -1,
    statusCode: "",
    systemCharge: -1,
    targetDate: -1,
    tenderCaseNo: "",
    tenderName: "",
    tenderOrgId: "",
    tenderOrgId2: "",
    tenderOrgName: "",
    tenderSq: "",
    tenderUpdateSq: "",
    certType: "",
    updateKey: -1,
    structurePath : ""
}

module.exports = {
    getTenderInfoObj: function() {
      return tenderInfoObj;
    }
};

