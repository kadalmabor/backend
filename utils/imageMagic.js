const fs = require('fs');

const ALLOWED_MIME = new Set([
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
]);

/**
 * Detect image kind from file header (do not trust mimetype / extension alone).
 * @param {Buffer} buf — first bytes of file
 * @returns {{ kind: 'jpeg'|'png'|'gif'|'webp'|null, ext: string|null }}
 */
function detectImageKind(buf) {
    if (!buf || buf.length < 3) {
        return { kind: null, ext: null };
    }

    // JPEG
    if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
        return { kind: 'jpeg', ext: '.jpg' };
    }

    // PNG
    if (
        buf[0] === 0x89 &&
        buf[1] === 0x50 &&
        buf[2] === 0x4e &&
        buf[3] === 0x47 &&
        buf[4] === 0x0d &&
        buf[5] === 0x0a &&
        buf[6] === 0x1a &&
        buf[7] === 0x0a
    ) {
        return { kind: 'png', ext: '.png' };
    }

    // GIF
    const g = buf.toString('ascii', 0, 6);
    if (g === 'GIF87a' || g === 'GIF89a') {
        return { kind: 'gif', ext: '.gif' };
    }

    // WebP: RIFF....WEBP
    if (
        buf.length >= 12 &&
        buf.toString('ascii', 0, 4) === 'RIFF' &&
        buf.toString('ascii', 8, 12) === 'WEBP'
    ) {
        return { kind: 'webp', ext: '.webp' };
    }

    return { kind: null, ext: null };
}

/**
 * @param {string} filepath
 * @returns {{ ok: boolean, kind?: string, ext?: string, error?: string }}
 */
function validateUploadedImageFile(filepath) {
    let fd;
    try {
        fd = fs.openSync(filepath, 'r');
        const buf = Buffer.alloc(32);
        const read = fs.readSync(fd, buf, 0, 32, 0);
        if (read < 12) {
            return { ok: false, error: 'File too small or empty' };
        }
        const { kind, ext } = detectImageKind(buf);
        if (!kind || !ext) {
            return { ok: false, error: 'File is not a supported image (JPEG, PNG, GIF, or WebP)' };
        }
        return { ok: true, kind, ext };
    } catch (e) {
        return { ok: false, error: e.message || 'Failed to read upload' };
    } finally {
        if (fd !== undefined) {
            try {
                fs.closeSync(fd);
            } catch (_) {
                /* ignore */
            }
        }
    }
}

module.exports = {
    ALLOWED_MIME,
    detectImageKind,
    validateUploadedImageFile,
};
