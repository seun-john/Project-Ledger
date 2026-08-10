const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

let mainWindow;

// Handle Prisma Database copying
function setupDatabase() {
  const userDataPath = app.getPath('userData');
  const dbPath = path.join(userDataPath, 'database.sqlite');
  
  if (!fs.existsSync(dbPath)) {
    // Check if we're packaged and have extraResources, else use dev mode path
    const templateDb = app.isPackaged 
      ? path.join(process.resourcesPath, 'prisma', 'prod.db')
      : path.join(app.getAppPath(), 'prisma', 'prod.db');
      
    if (fs.existsSync(templateDb)) {
      console.log('Copying seed database from', templateDb, 'to', dbPath);
      fs.copyFileSync(templateDb, dbPath);
    } else {
      console.warn('Template database not found at', templateDb);
    }
  } else {
    console.log('Database already exists at', dbPath);
  }
  
  // Set the environment variable for Prisma
  process.env.DATABASE_URL = `file:${dbPath}`;
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    }
  });

  mainWindow.removeMenu(); // Remove default menu for a cleaner look

  // Start the Next.js custom server
  const dev = !app.isPackaged;
  const dir = app.getAppPath();
  const nextApp = next({ dev, dir });
  const handle = nextApp.getRequestHandler();

  try {
    await nextApp.prepare();

    const server = createServer((req, res) => {
      const parsedUrl = parse(req.url, true);
      handle(req, res, parsedUrl);
    });

    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      console.log(`Next.js server listening on http://127.0.0.1:${port}`);
      mainWindow.loadURL(`http://127.0.0.1:${port}`);
    });
  } catch (err) {
    console.error('Error starting Next.js server:', err);
  }

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  setupDatabase();
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});
