import { put } from '@vercel/blob';
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env.local variables
dotenv.config({ path: join(__dirname, '../.env.local') });

if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error('❌ Error: BLOB_READ_WRITE_TOKEN environment variable is not defined.');
    process.exit(1);
}

async function uploadHQVideos() {
    try {
        console.log('Uploading High-Quality Intro (p2.mp4) to Vercel Blob...');
        const introBuffer = readFileSync(join(__dirname, '../public/p2.mp4'));
        const introBlob = await put('manthan/videos/p2_hq.mp4', introBuffer, {
            access: 'public',
            contentType: 'video/mp4'
        });
        console.log('✅ HQ Intro Uploaded:', introBlob.url);

        console.log('Uploading High-Quality Background (theme 3.mp4) to Vercel Blob...');
        // Note: Filenames with spaces can sometimes cause issues in URLs or code, so we upload it with a clean name
        const bgBuffer = readFileSync(join(__dirname, '../public/theme 3.mp4'));
        const bgBlob = await put('manthan/videos/theme3_hq.mp4', bgBuffer, {
            access: 'public',
            contentType: 'video/mp4'
        });
        console.log('✅ HQ Background Uploaded:', bgBlob.url);

        console.log('\n--- SUCCESS ---');
        console.log(`Intro URL: ${introBlob.url}`);
        console.log(`Background URL: ${bgBlob.url}`);

    } catch (error) {
        console.error('❌ Error uploading videos:', error);
    }
}

uploadHQVideos();
