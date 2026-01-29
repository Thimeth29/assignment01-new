const express = require('express');
const multer = require('multer');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

const app = express();
const PORT = 8080;

// Static files (background image)
app.use(express.static('public'));

// AWS S3
const s3 = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
});
const BUCKET_NAME = process.env.BUCKET_NAME;

// Multer
const upload = multer({ storage: multer.memoryStorage() });

/* =========================
   HOME PAGE
========================= */
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Cloud Assignment</title>

<style>
  body {
    margin: 0;
    height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;

    background:
      linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)),
      url('/bg.jpg');

    background-size: cover;
    background-position: center;
    font-family: Arial, sans-serif;
    color: white;
  }

  /* GLASS CARD */
  .glass {
    backdrop-filter: blur(15px);
    -webkit-backdrop-filter: blur(15px);
    background: rgba(255, 255, 255, 0.15);
    border-radius: 20px;
    padding: 45px 55px;
    box-shadow: 0 25px 50px rgba(0,0,0,0.6);
    text-align: center;
    width: 380px;
  }

  h1 {
    color: #38bdf8;
    margin-bottom: 5px;
  }

  h2 {
    margin: 4px 0;
    font-weight: normal;
  }

  input[type="file"] {
    margin-top: 20px;
  }

  button {
    margin-top: 15px;
    padding: 12px 30px;
    border: none;
    border-radius: 8px;
    background: #38bdf8;
    color: #020617;
    font-size: 16px;
    cursor: pointer;
    transition: 0.3s;
  }

  button:hover {
    background: #0ea5e9;
    transform: scale(1.05);
  }

  /* PROGRESS BAR */
  .progress-container {
    margin-top: 20px;
    background: rgba(255,255,255,0.2);
    border-radius: 10px;
    overflow: hidden;
    display: none;
  }

  .progress-bar {
    height: 12px;
    width: 0%;
    background: #22c55e;
    transition: width 0.2s;
  }

  .status {
    margin-top: 15px;
    font-size: 14px;
  }
</style>
</head>

<body>
  <div class="glass">
    <h1>Thimeth Chathnuka</h1>
    <h2>23ug1-0005</h2>
    <h2>Cloud Computing</h2>

    <input type="file" id="fileInput" />
    <br />
    <button onclick="uploadFile()">Upload to S3</button>

    <div class="progress-container" id="progressContainer">
      <div class="progress-bar" id="progressBar"></div>
    </div>

    <div class="status" id="status"></div>
  </div>

<script>
  function uploadFile() {
    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0];
    if (!file) {
      alert('Please select a file');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/upload', true);

    const progressContainer = document.getElementById('progressContainer');
    const progressBar = document.getElementById('progressBar');
    const status = document.getElementById('status');

    progressContainer.style.display = 'block';

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        const percent = (e.loaded / e.total) * 100;
        progressBar.style.width = percent + '%';
        status.innerText = 'Uploading: ' + Math.round(percent) + '%';
      }
    };

    xhr.onload = () => {
      if (xhr.status === 200) {
        status.innerHTML = '<span style="color:#22c55e">✔ Upload Successful</span>';
      } else {
        status.innerHTML = '<span style="color:red">Upload Failed</span>';
      }
    };

    xhr.send(formData);
  }
</script>
</body>
</html>
`);
});

/* =========================
   UPLOAD ENDPOINT
========================= */
app.post('/upload', upload.single('file'), async (req, res) => {
  if (!req.file || !BUCKET_NAME) {
    return res.status(400).send('Missing file or bucket');
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

    res.status(200).send('OK');
  } catch (err) {
    res.status(500).send(err.message);
  }
});

/* =========================
   HEALTH
========================= */
app.get('/health', (req, res) => {
  res.send('OK');
});

/* =========================
   START SERVER
========================= */
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
