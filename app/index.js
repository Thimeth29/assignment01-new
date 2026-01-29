const express = require('express');
const multer = require('multer');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

const app = express();
const PORT = 8080;

// Serve static files (background image etc.)
app.use(express.static('public'));

// AWS S3 configuration
const s3 = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
});

const BUCKET_NAME = process.env.BUCKET_NAME;

// Multer configuration
const upload = multer({ storage: multer.memoryStorage() });

/* =========================
   HOME PAGE
========================= */
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Cloud Assignment</title>

      <style>
        body {
          margin: 0;
          height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;

          background:
            linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)),
            url('/bg.jpg');

          background-size: cover;
          background-position: center;
          font-family: Arial, sans-serif;
          color: white;
        }

        .container {
          text-align: center;
          background: rgba(0, 0, 0, 0.65);
          padding: 45px 55px;
          border-radius: 18px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.7);
        }

        h1 {
          font-size: 38px;
          color: #38bdf8;
          margin-bottom: 8px;
        }

        h2 {
          margin: 5px 0;
          font-weight: normal;
        }

        form {
          margin-top: 30px;
        }

        input[type="file"] {
          margin-bottom: 18px;
        }

        button {
          background-color: #38bdf8;
          color: #020617;
          border: none;
          padding: 12px 32px;
          font-size: 16px;
          border-radius: 8px;
          cursor: pointer;
          transition: 0.3s;
        }

        button:hover {
          background-color: #0ea5e9;
          transform: scale(1.05);
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

/* =========================
   HEALTH CHECK
========================= */
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

/* =========================
   FILE UPLOAD
========================= */
app.post('/upload', upload.single('file'), async (req, res) => {
  if (!req.file || !BUCKET_NAME) {
    return res.status(400).send('Missing file or S3 bucket configuration');
  }

  try {
    await s3.send(
      new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: `${Date.now()}_${req.file.originalname}`,
        Body: req.file.buffer,
        ContentType: req.file.mimetype,
      })
    );

    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Upload Success</title>

        <style>
          body {
            margin: 0;
            height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;

            background:
              linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)),
              url('/bg.jpg');

            background-size: cover;
            background-position: center;
            font-family: Arial, sans-serif;
            color: white;
          }

          .card {
            background: rgba(0, 0, 0, 0.7);
            padding: 45px 55px;
            border-radius: 18px;
            text-align: center;
            box-shadow: 0 20px 40px rgba(0,0,0,0.7);
            max-width: 420px;
          }

          .icon {
            font-size: 60px;
            color: #22c55e;
          }

          h1 {
            margin: 15px 0 10px;
            color: #38bdf8;
          }

          .file-name {
            color: #22c55e;
            font-weight: bold;
          }

          a {
            display: inline-block;
            margin-top: 25px;
            text-decoration: none;
            color: #020617;
            background: #38bdf8;
            padding: 12px 32px;
            border-radius: 8px;
            font-weight: bold;
            transition: 0.3s;
          }

          a:hover {
            background: #0ea5e9;
            transform: scale(1.05);
          }
        </style>
      </head>

      <body>
        <div class="card">
          <div class="icon">✔</div>
          <h1>Upload Successful</h1>
          <p>
            File <span class="file-name">${req.file.originalname}</span>
            <br />successfully uploaded to Amazon S3
          </p>
          <a href="/">Upload Another File</a>
        </div>
      </body>
      </html>
    `);
  } catch (error) {
    console.error(error);
    res.status(500).send('Upload failed: ' + error.message);
  }
});

/* =========================
   START SERVER
========================= */
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
