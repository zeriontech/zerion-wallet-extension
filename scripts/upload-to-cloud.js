/* eslint-disable no-console */
/* eslint-env node */
const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const DIST_FOLDER = path.resolve(__dirname, '../dist');
const SCOPES = ['https://www.googleapis.com/auth/drive'];
const FOLDER_ID = process.env.GDRIVE_SHARED_FOLDER_ID;
const ENCODED_CREDENTIALS = process.env.GDRIVE_SHARED_FOLDER_CREDENTIALS;
const GIT_BRANCH_NAME = process.env.GIT_BRANCH_NAME;

const apikeys = JSON.parse(
  Buffer.from(ENCODED_CREDENTIALS, 'base64').toString()
);

async function createOrFindFolder(auth, folderName, parent = FOLDER_ID) {
  const drive = google.drive({ version: 'v3', auth });

  const existingFolders = await drive.files.list({
    q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false and '${parent}' in parents`,
    fields: 'files(id, name, parents)',
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
    spaces: 'drive',
  });

  if (existingFolders.data.files.length > 0) {
    return existingFolders.data.files[0].id;
  }

  const fileMetadata = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder',
    parents: [parent],
  };

  try {
    const response = await drive.files.create({
      requestBody: fileMetadata,
      fields: 'id',
      supportsAllDrives: true,
    });
    console.log(`Created folder ${folderName} with ID: ${response.data.id}`);
    return response.data.id;
  } catch (error) {
    console.error(`Failed to create folder ${folderName}:`, error.message);
    throw error;
  }
}

async function createOrUpdateFile(auth, folderId, filePath) {
  const drive = google.drive({ version: 'v3', auth });
  const fileName = path.basename(filePath);

  const media = {
    mimeType: 'application/octet-stream',
    body: fs.createReadStream(filePath),
  };

  const existingFiles = await drive.files.list({
    q: `name='${fileName}' and '${folderId}' in parents and trashed=false`,
    fields: 'files(id, name)',
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
    spaces: 'drive',
  });

  if (existingFiles.data.files.length > 0) {
    const existingFileId = existingFiles.data.files[0].id;

    try {
      await drive.files.update({
        fileId: existingFileId,
        media: media,
        supportsAllDrives: true,
      });
      console.log(`Updated ${fileName} with ID: ${existingFileId}`);
      return;
    } catch (error) {
      console.error(`Failed to update ${fileName}:`, error.message);
      throw error;
    }
  }

  try {
    const fileMetadata = {
      name: fileName,
      parents: [folderId],
    };

    const response = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id',
      supportsAllDrives: true,
    });
    console.log(`Uploaded ${fileName} with ID: ${response.data.id}`);
  } catch (error) {
    console.error(`Failed to upload ${fileName}:`, error.message);
  }
}

async function authorize() {
  const auth = new google.auth.JWT(
    apikeys.client_email,
    null,
    apikeys.private_key,
    SCOPES
  );

  try {
    await auth.authorize();
    return auth;
  } catch (error) {
    throw new Error(`Error authorizing Google Drive API: ${error.message}`);
  }
}

async function uploadDirectory(
  auth,
  parentFolderId,
  directory,
  uploadDirectoryName
) {
  const folderId = await createOrFindFolder(
    auth,
    uploadDirectoryName,
    parentFolderId
  );
  const filesInDirectory = fs.readdirSync(directory);
  await Promise.all(
    filesInDirectory.map((file) =>
      (async () => {
        const absolute = path.join(directory, file);
        if (fs.statSync(absolute).isDirectory()) {
          await uploadDirectory(
            auth,
            folderId,
            absolute,
            path.basename(absolute)
          );
        } else {
          await createOrUpdateFile(auth, folderId, absolute);
        }
      })()
    )
  );
}

async function uploadToGoogleDrive() {
  const auth = await authorize();
  console.log('Authorized');
  const folderName = GIT_BRANCH_NAME.split('/')[1];
  await uploadDirectory(auth, FOLDER_ID, DIST_FOLDER, folderName);
  console.log('Done!');
}

uploadToGoogleDrive();
