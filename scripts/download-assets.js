const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { execSync } = require('child_process');

const CHANNELS_PATH = path.join(__dirname, '../packages/channels/data/channels.json');
const LOGOS_DIR = path.join(__dirname, '../apps/web/public/logos');

// Ensure logos directory exists
if (!fs.existsSync(LOGOS_DIR)) {
    fs.mkdirSync(LOGOS_DIR, { recursive: true });
}

const channels = JSON.parse(fs.readFileSync(CHANNELS_PATH, 'utf-8'));

const downloadImage = (url, filepath) => {
    return new Promise((resolve, reject) => {
        const get = (currentUrl) => {
            const client = currentUrl.startsWith('https') ? https : http;
            const request = client.get(currentUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
            }, (res) => {
                if (res.statusCode === 301 || res.statusCode === 302) {
                    return get(res.headers.location);
                }
                if (res.statusCode === 200) {
                    const file = fs.createWriteStream(filepath);
                    res.pipe(file);
                    file.on('finish', () => {
                        file.close();
                        resolve();
                    });
                } else {
                    reject(new Error(`Status code: ${res.statusCode}`));
                }
            }).on('error', (err) => {
                reject(err);
            });
            request.end();
        };
        get(url);
    });
};

const getExtension = (url) => {
    const ext = path.extname(url).split('?')[0].toLowerCase();
    if (ext === '.png' || ext === '.jpg' || ext === '.jpeg' || ext === '.webp') {
        return ext;
    }
    return '.jpg'; // Default
};

const processChannels = async () => {
    console.log(`Processing ${channels.length} channels...`);
    let updatedCount = 0;

    for (let i = 0; i < channels.length; i++) {
        const channel = channels[i];
        if (channel.image_url && channel.image_url.startsWith('http')) {
            const ext = getExtension(channel.image_url);
            const filename = `${channel.item_id}${ext}`;
            const filepath = path.join(LOGOS_DIR, filename);
            const localPath = `/logos/${filename}`;

            try {
                console.log(`[${i + 1}/${channels.length}] Downloading: ${channel.name}`);
                await downloadImage(channel.image_url, filepath);
                channel.image_url = localPath;
                updatedCount++;
            } catch (err) {
                console.error(`Failed to download ${channel.name}: ${err.message}`);
                // Keep original URL on failure? Or placeholder?
                // Keeping original for now.
            }
        }
    }

    if (updatedCount > 0) {
        console.log(`Updated ${updatedCount} channels. Saving channels.json...`);
        fs.writeFileSync(CHANNELS_PATH, JSON.stringify(channels, null, 2));
        
        console.log('Running encode-channels...');
        try {
            execSync('node scripts/encode-channels.js', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
        } catch (e) {
            console.error('Failed to run encode script', e);
        }
    } else {
        console.log('No channels updated.');
    }
};

processChannels();
