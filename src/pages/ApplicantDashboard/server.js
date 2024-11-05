const express = require('express');
const multer = require('multer');
const path = require('path');
const { exec } = require('child_process');
const admin = require('firebase-admin');
const fs = require('fs');
const cors = require('cors'); //Import CORS

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Firebase Admin SDK with storageBucket
const serviceAccount = require('./rpmauth-1e30e-firebase-adminsdk-av8ne-5cdc7b560e.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'rpmauth-1e30e.appspot.com', // Specify your bucket here
});

const bucket = admin.storage().bucket();
const firestore = admin.firestore();

// Use memory storage for direct upload to Firebase
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });


app.use(cors());
app.use(express.json());

// Route to handle resume upload
app.post('/upload', upload.single('resume'), (req, res) => {
  const userId = req.body.userId;
  const jobTitle = req.body.jobTitle;

  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const uploadedFileBuffer = req.file.buffer;
  const tempFilePath = path.join(__dirname, 'temp', req.file.originalname);

  // Ensure the temp directory exists
  if (!fs.existsSync(path.dirname(tempFilePath))) {
    fs.mkdirSync(path.dirname(tempFilePath), { recursive: true });
  }

  // Write file to temp path
  fs.writeFileSync(tempFilePath, uploadedFileBuffer);

  const pythonScriptPath = path.join(__dirname, 'app.py');
  const command = `python ${pythonScriptPath} ${tempFilePath}`;

  exec(command, (error, stdout, stderr) => {
    fs.unlinkSync(tempFilePath); // Cleanup the temporary file

    if (error) {
      console.error(`Error executing Python script: ${error}`);
      console.error(`stderr: ${stderr}`);
      return res.status(500).json({ error: 'An error occurred while processing the resume' });
    }

    console.log('Python script stdout:', stdout);

    try {
      const data = JSON.parse(stdout);

      // Add a timestamp field to the resume data
      const resumeData = {
        ...data,
        timestamp: admin.firestore.FieldValue.serverTimestamp(), // Add server timestamp
      };

      console.log('Resume Data with Timestamp:', resumeData);

      const userResumesCollection = firestore.collection(`resumes/${jobTitle}/${userId}`);
      const accountResumeCollection = firestore.collection(`users/${userId}/profile`);

      // Add resume data to user-specific resumes collection
      userResumesCollection
        .add(resumeData)
        .then((docRef) => {
          console.log('Resume document written with ID: ', docRef.id);
        })
        .catch((error) => {
          console.error('Error adding resume to resumes collection: ', error);
          return res.status(500).json({ error: 'An error occurred while uploading the resume to resumes collection' });
        });

      // Log to check accountResumeCollection path and data
      console.log(`Attempting to write to users/${userId}/profile`, resumeData);

      // Add resume data to the user's profile collection
      accountResumeCollection
        .add(resumeData)
        .then((docRef) => {
          console.log('Profile document written with ID: ', docRef.id);
          return res.json({
            message: 'Resume successfully uploaded to both collections',
            resumeId: docRef.id,
            ...resumeData,
          });
        })
        .catch((error) => {
          console.error('Error adding resume to profile collection: ', error);
          return res.status(500).json({ error: 'An error occurred while uploading the resume to profile collection' });
        });
      
    } catch (parseError) {
      console.error(`Error parsing JSON: ${parseError}`);
      res.status(500).json({ error: 'An error occurred while parsing the response' });
    }
  });
});


// Route to handle file uploads of various types
app.post('/upload/:type', upload.single('file'), (req, res) => {
  const userId = req.body.userId;
  const fileType = req.params.type;

  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const fileName = `${Date.now()}-${req.file.originalname}`;
  const filePath = `${fileType}/${userId}/${fileName}`;
  const file = bucket.file(filePath);

  const stream = file.createWriteStream({
    metadata: {
      contentType: req.file.mimetype,
    },
  });

  stream.on('error', (error) => {
    console.error('Error uploading file:', error);
    res.status(500).json({ error: 'Error uploading file to Firebase Storage' });
  });

  stream.on('finish', () => {
    console.log('File uploaded successfully:', filePath);
    res.json({ message: 'File uploaded successfully', filePath });
  });

  stream.end(req.file.buffer);
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
