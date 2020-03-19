const { app, BrowserWindow, Menu, ipcMain, Tray } = require("electron");
const { autoUpdater } = require("electron-updater");
let mainWindow, tray;
var pjson = require('./package.json');
autoUpdater.autoDownload = true;

autoUpdater.on('error', function (error) {
  sendUpdateMessage('Error in auto-updater. ' + error)
});
autoUpdater.on('checking-for-update', function () {
  sendUpdateMessage("Checking for update...")
});
autoUpdater.on('update-available', function (info) {
  sendUpdateMessage('Update available.')
});
autoUpdater.on('update-not-available', function (info) {
  sendUpdateMessage('Update not available.')
});

// 更新下载进度事件
autoUpdater.on('download-progress', function (progressObj) {
  let log_message = "Download speed: " + progressObj.bytesPerSecond;
  log_message = log_message + ' - Downloaded ' + progressObj.percent + '%';
  log_message = log_message + ' (' + progressObj.transferred + "/" + progressObj.total + ')';
  mainWindow.webContents.send(log_message);
})
autoUpdater.on('update-downloaded', (info) => {
  sendUpdateMessage('Update downloaded');
});

// 通过main进程发送事件给renderer进程，提示更新信息
function sendUpdateMessage(text) {
  mainWindow.webContents.send('message', text)
}

function createWindow() {
  mainWindow = new BrowserWindow({
    // show: false,
    autoHideMenuBar: true,
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true
    }
  });
  mainWindow.loadURL(`file://${__dirname}/index.html`);
  //mainWindow.webContents.openDevTools();
  mainWindow.on("close", (event) => {
    // event.preventDefault();
    mainWindow.webContents.send("stop-server");
    // mainWindow.hide();
  });
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}
autoUpdater.on('update-downloaded', (info) =>{
  mainWindow.webContents(send('updateReady'));
});
ipcMain.on("quitAndInstall", (event, arg) => {
  autoUpdater.quitAndInstall();
});
app.on("ready", ()=>{
  createWindow();
  autoUpdater.checkForUpdatesAndNotify();
  tray = new Tray(`${__dirname}/images/database.png`);
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Exit', click: function() {app.quit()}}
  ])
  tray.setToolTip(pjson.version);
  tray.setContextMenu(contextMenu);
});
app.on("browser-window-created", function(e, window) {
  window.setMenu(null);
});

app.on("window-all-closed", function() {
  if (process.platform !== "darwin") {
    autoUpdater.quitAndInstall();
    app.quit();
  }
});

app.on("activate", function() {
  if (mainWindow === null) {
    createWindow();
  }
});
