const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const multer = require('multer');

const app = express();
const PORT = 3001;
const PIN = '184216';

const CHANNELS_PATH = path.join(__dirname, '../../packages/channels/data/channels.json');
const ENCODE_SCRIPT_PATH = path.join(__dirname, '../../scripts/encode-channels.js');

app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(express.static('public'));
app.use('/logos', express.static(path.join(__dirname, '../../apps/web/public/logos')));

// Configure Multer for file upload
const upload = multer({ dest: 'uploads/' });

// Authentication Middleware
const authMiddleware = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader || authHeader !== `Bearer ${PIN}`) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
};

// Helper: Run encoding script
const runEncodingScript = () => {
    console.log('Running encoding script...');
    exec(`node ${ENCODE_SCRIPT_PATH}`, (error, stdout, stderr) => {
        if (error) {
            console.error(`Encoding error: ${error.message}`);
            return;
        }
        if (stderr) {
            console.error(`Encoding stderr: ${stderr}`);
            return;
        }
        console.log(`Encoding output: ${stdout}`);
    });
};

// Helper: Read Channels
const readChannels = () => {
    if (!fs.existsSync(CHANNELS_PATH)) {
        return [];
    }
    const data = fs.readFileSync(CHANNELS_PATH, 'utf-8');
    return JSON.parse(data);
};

// Helper: Write Channels
const writeChannels = (channels) => {
    fs.writeFileSync(CHANNELS_PATH, JSON.stringify(channels, null, 2));
    runEncodingScript();
};

// Routes

// Login check
app.post('/api/login', (req, res) => {
    const { pin } = req.body;
    if (pin === PIN) {
        res.json({ success: true });
    } else {
        res.status(401).json({ success: false, error: 'Invalid PIN' });
    }
});

// Get Channels
app.get('/api/channels', authMiddleware, (req, res) => {
    try {
        const channels = readChannels();
        res.json(channels);
    } catch (error) {
        res.status(500).json({ error: 'Failed to read channels' });
    }
});

// Update All Channels (Save entire list)
app.post('/api/channels', authMiddleware, (req, res) => {
    try {
        const channels = req.body;
        if (!Array.isArray(channels)) {
            return res.status(400).json({ error: 'Invalid data format. Expected array.' });
        }
        writeChannels(channels);
        res.json({ success: true, message: 'Channels saved and encoding started.' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to save channels' });
    }
});

// Batch Upload JSON
app.post('/api/upload', authMiddleware, upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    const tempPath = req.file.path;

    try {
        const fileContent = fs.readFileSync(tempPath, 'utf-8');
        const channels = JSON.parse(fileContent);

        if (!Array.isArray(channels)) {
            // Cleanup
            fs.unlinkSync(tempPath);
            return res.status(400).json({ error: 'Invalid JSON format. Expected an array of channels.' });
        }

        writeChannels(channels);
        
        // Cleanup temp file
        fs.unlinkSync(tempPath);

        res.json({ success: true, message: 'File uploaded and channels updated.' });
    } catch (error) {
        // Cleanup
        if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
        res.status(500).json({ error: `Failed to process file: ${error.message}` });
    }
});
// Image Proxy to fix Content-Type
app.get('/api/proxy', (req, res) => {
    const { url } = req.query;
    if (!url) {
        return res.status(400).send('Missing url parameter');
    }

    try {
        const https = require('https');
        const http = require('http');
        const client = url.startsWith('https') ? https : http;

        client.get(url, (proxyRes) => {
            // Force image content type if it's text/plain or missing
            const contentType = proxyRes.headers['content-type'];
            if (!contentType || contentType === 'text/plain') {
                // Try to guess from extension
                const ext = path.extname(url).toLowerCase();
                if (ext === '.png') res.setHeader('Content-Type', 'image/png');
                else if (ext === '.jpg' || ext === '.jpeg') res.setHeader('Content-Type', 'image/jpeg');
                else if (ext === '.webp') res.setHeader('Content-Type', 'image/webp');
                else res.setHeader('Content-Type', 'image/jpeg'); // Default fallback
            } else {
                res.setHeader('Content-Type', contentType);
            }

            // Pipe the stream
            proxyRes.pipe(res);
        }).on('error', (err) => {
            console.error('Proxy error:', err);
            res.status(500).send('Failed to fetch image');
        });
    } catch (err) {
        console.error('Proxy exception:', err);
        res.status(500).send('Proxy error');
    }
});

app.listen(PORT, () => {
    console.log(`Admin server running at http://localhost:${PORT}`);
});
