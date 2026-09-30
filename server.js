require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const twilio = require('twilio');
const multer = require('multer');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Ensure uploads directory exists
const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR);
}

// Multer Storage Configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOADS_DIR);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '.')));
app.use('/uploads', express.static(UPLOADS_DIR)); // Serve uploaded files

// Twilio Config
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhone = process.env.TWILIO_PHONE_NUMBER;
const client = accountSid && authToken ? new twilio(accountSid, authToken) : null;

// In-Memory Data Stores
const otpStore = {};
const userDataStore = {};

// ---- API Routes ----

// 1. Send OTP
app.post('/api/send-otp', async (req, res) => {
    const { mobile } = req.body;
    if (!mobile) return res.status(400).json({ success: false, message: 'Invalid mobile' });

    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    otpStore[mobile] = otp;

    console.log(`[SERVER] generated OTP for ${mobile}: ${otp}`);

    if (client) {
        try {
            await client.messages.create({
                body: `Helora Verification Code: ${otp}`,
                from: twilioPhone,
                to: mobile
            });
            return res.json({ success: true, message: 'SMS Sent' });
        } catch (err) {
            console.error(err);
            return res.json({ success: true, message: `Simulated (Provider Error). Code: ${otp}` });
        }
    } else {
        setTimeout(() => res.json({ success: true, message: `Simulated SMS. Code: ${otp}` }), 1000);
    }
});

// 2. Verify OTP
app.post('/api/verify-otp', (req, res) => {
    const { mobile, otp } = req.body;
    if (otpStore[mobile] === otp) {
        delete otpStore[mobile];
        return res.json({ success: true, message: 'Verified' });
    }
    return res.status(400).json({ success: false, message: 'Invalid OTP' });
});

// 3. User Data
app.get('/api/user-data', (req, res) => {
    const { mobile } = req.query;
    if (!userDataStore[mobile]) userDataStore[mobile] = [];
    res.json({ success: true, data: userDataStore[mobile] });
});

app.post('/api/create-folder', (req, res) => {
    const { mobile, folderName } = req.body;
    if (!userDataStore[mobile]) userDataStore[mobile] = [];
    const newFolder = { id: Date.now(), name: folderName, type: 'folder', items: [] };
    userDataStore[mobile].push(newFolder);
    res.json({ success: true, data: newFolder });
});

app.post('/api/upload-file', upload.single('document'), (req, res) => {
    const { mobile, folderId } = req.body;
    const file = req.file;
    if (!file) return res.status(400).json({ success: false, message: 'No file' });
    if (!userDataStore[mobile]) userDataStore[mobile] = [];

    const newFile = {
        id: Date.now(), name: file.originalname, type: 'file', path: '/uploads/' + file.filename, size: file.size, date: new Date().toLocaleDateString()
    };

    if (folderId) {
        const folder = userDataStore[mobile].find(f => f.id == folderId && f.type === 'folder');
        if (folder) folder.items.push(newFile);
        else userDataStore[mobile].push(newFile);
    } else {
        userDataStore[mobile].push(newFile);
    }
    res.json({ success: true, data: newFile });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
