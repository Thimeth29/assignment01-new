const express = require('express');
const multer = require('multer');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

const app = express();
const PORT = 8080;

// Static files
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
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>Cloud Assignment</title>

<style>
/* =========================
   GLOBAL
========================= */
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  font-family: 'Segoe UI', Arial, sans-serif;
  color: white;

  /* 🔥 ANIMATED GRADIENT BACKGROUND */
  background: linear-gradient(
    -45deg,
    #020617,
    #0f172a,
    #0ea5e9,
    #22c55e
  );
  background-size: 400% 400%;
  animation: gradientMove 15s ease infinite;
}

@keyframes gradientMove {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

/* =========================
   GLASS CARD
========================= */
.glass {
  width: 380px;
  padding: 45px 50px;
  border-radius: 22px;
  text-align: center;

  background: rgba(255, 255, 255, 0.18);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);

  box-shadow: 0 30px 60px rgba(0,0,0,0.5);

  /* ENTRY ANIMATION */
  animation: fadeUp 1.2s ease forwards;
}

@keyframes fadeUp {
  from {
    opacity: 0;
    transform: translateY(40px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* =========================
   TEXT
========================= */
h1 {
  margin: 0;
  color: #e0f2fe;
  font-size: 32px;
}

h2 {
  margin: 6px 0;
  font-weight: normal;
  font-size: 16px;
  opacity: 0.9;
}

/* =========================
   INPUT & BUTTON
========================= */
input[type="file"] {
  margin-top: 22px;
}

button {
  margin-top: 18px;
  padding: 12px 34px;
  font-size: 15px;
  border-radius: 30px;
  border: none;
  cursor: pointer;
  background: linear-gradient(135deg, #38bdf8, #22c55e);
  color: #020617;
  font-weight: bold;
  transition: transform 0.2s, box-shadow 0.2s;
}

button:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 25px rgba(0,0,0,0.4);
}

/* =========================
   PROGRESS BAR
========================= */
.progress-box {
  margin-top: 22px;
  background: rgba(255,255,255,0.25);
  border-radius: 20px;
  overflow: hidden;
  display: none;
}

.progress-bar {
  height: 12px;
  width: 0%;
  background: linear-gradient(90deg, #22c55e, #38bdf8);
  transition: width 0.3s ease;
}

.status {
  margin-top: 14px;
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

    <div class="progress-box" id="progressBox">
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
  xhr.open('POST', '/upload');

  const progressBox = document.getElementById('progressBox');
  const progressBar = document.getElementById('progressBar');
  const status = document.getElementById('status');

  progressBox.style.display = 'block';

  xhr.upload.onprogress = (e) => {
    if (e.lengthComputable) {
      const percent = (e.loaded / e.total) * 100;
      progressBar.style.width = percent + '%';
      status.innerText = 'Uploading: ' + Math.round(percent) + '%';
    }
  };

  xhr.onload = () => {
    if (xhr.status === 200) {
      status.innerHTML = '<span style="color:#bbf7d0">✔ Upload completed</span>';
    } else {
      status.innerHTML = '<span style="color:#fecaca">Upload failed</span>';
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
        Key: Date.now() + '_' + req.file.originalname,
        Body: req.file.buffer,
        ContentType: req.file.mimetype,
      })
    );
    res.sendStatus(200);
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
  console.log('Server running on port ' + PORT);
});
