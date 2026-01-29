const express = require('express');
const multer = require('multer');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

const app = express();
const PORT = 8080;

// Serve static files
app.use(express.static('public'));

// AWS S3
const s3 = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1'
});
const BUCKET_NAME = process.env.BUCKET_NAME;

// Multer
const upload = multer({ storage: multer.memoryStorage() });

// Home page
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Cloud Assignment - Version 2</title>

      <style>
        body {
          margin: 0;
          height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;

          /* 🔥 BACKGROUND IMAGE */
          background: 
            linear-gradient(
              rgba(0,0,0,0.6),
              rgba(0,0,0,0.6)
            ),
            url('/bg.jpg');

          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;

          font-family: Arial, sans-serif;
          color: white;
        }

        .container {
          text-align: center;
          background: rgba(0, 0, 0, 0.6);
          padding: 45px 55px;
          border-radius: 16px;
          box-shadow: 0 15px 35px rgba(0,0,0,0.7);
        }

        h1 {
          font-size: 38px;
          margin-bottom: 10px;
          color: #38bdf8;
        }

        h2 {
          margin: 6px 0;
          font-weight: normal;
        }

        form {
          margin-top: 30px;
        }

        input[type="file"] {
          margin-bottom: 15px;
        }

        button {
          background-color: #38bdf8;
          color: #020617;
          border: none;
          padding: 12px 30px;
          font-size: 16px;
          border-radius: 8px;
          cursor: pointer;
        }

        button:hover {
          background-color: #0ea5e9;
        }
      </style>
    </head>

    <body>
      <div class="container">
        <h1>Thimeth Chathnuka</h1>
        <h2>23ug1-0005</h2>
        <h2>Cloud Computing Assignment</h2>

        <form action="/upload" method="POST" enctype="multipart/form-data">
          <input type="file" name="file" required />
          <br />
          <button type="submit">Upload File to S3</button>
        </form>
      </div>
    </body>
    </html>
  `);
});

// Health check
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Upload
app.post('/upload', upload.single('file'), async (req, res) => {
  if (!req.file || !BUCKET_NAME) {
    return res.status(400).send('Missing file or bucket name');
  }

  try {
    await s3.send(new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: `${Date.now()}_${req.file.originalname}`,
      Body: req.file.buffer,
      ContentType: req.file.mimetype
    }));

    res.send(`
      <body style="
        background:#020617;
        color:white;
        font-family:Arial;
        text-align:center;
        padding-top:80px;">
        <h1 style="color:#38bdf8;">Upload Successful</h1>
        <p>${req.file.originalname} uploaded to S3</p>
        <a href="/" style="
          color:#38bdf8;
          text-decoration:none;
          border:2px solid #38bdf8;
          padding:12px 30px;
          border-radius:8px;">
          Go Back
        </a>
      </body>
    `);
  } catch (err) {
    res.status(500).send('Upload failed: ' + err.message);
  }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
