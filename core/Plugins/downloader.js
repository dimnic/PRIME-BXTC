
'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const { spawn } = require('child_process');

/*
 * ============================================================================
 * PRIME BOT - DOWNLOADER
 * ============================================================================
 *
 * Commands:
 *
 *   /play song name
 *   /song song name
 *   /ytmp3 YouTube URL
 *   /ytmp4 YouTube URL
 *   /ytsearch song name
 *
 * Requirements:
 *
 *   python -m pip install -U yt-dlp
 *
 * FFmpeg must be installed and available in PATH.
 *
 * Your direct yt-dlp test already confirmed that yt-dlp + FFmpeg works.
 * ============================================================================
 */


/* ============================================================================
   CONFIG
============================================================================ */

const TEMP_ROOT = path.join(
    os.tmpdir(),
    'PRIME-bot-downloads'
);

const MAX_RETRIES = 3;

const DOWNLOAD_TIMEOUT =
    5 * 60 * 1000;

const SEARCH_TIMEOUT =
    60 * 1000;

if (!fs.existsSync(TEMP_ROOT)) {
    fs.mkdirSync(TEMP_ROOT, {
        recursive: true
    });
}


/* ============================================================================
   PYTHON
============================================================================ */

function getPythonCommand() {
    return process.platform === 'win32'
        ? 'python'
        : 'python3';
}


/* ============================================================================
   YT-DLP COMPATIBILITY
============================================================================ */

/*
 * IMPORTANT:
 *
 * Do NOT force web_safari here.
 *
 * Recent YouTube changes can cause web_safari to expose formats without
 * usable download URLs, resulting in:
 *
 *   Requested format is not available
 *
 * We use the normal yt-dlp client first and android_vr as a fallback.
 *
 * The user's manual test successfully downloaded:
 *
 *   format 251
 *
 * using yt-dlp.
 */

function getYtDlpCompatibilityArgs(
    profile = 'default'
) {
    const args = [
        '--js-runtimes',
        'deno',

        '--no-warnings',
        '--no-playlist'
    ];

    /*
     * Only force android_vr when explicitly requested.
     *
     * Default mode lets the current yt-dlp version select its supported
     * client configuration.
     */

    if (profile === 'android_vr') {
        args.push(
            '--extractor-args',
            'youtube:player_client=android_vr'
        );
    }

    /*
     * Optional PO-token provider.
     *
     * This is only added when the user actually configured one.
     */

    const potUrl =
        String(
            process.env.PRIME_POT_URL || ''
        ).trim();

    if (potUrl) {
        args.push(
            '--extractor-args',
            `youtubepot-bgutilhttp:base_url=${potUrl}`
        );
    }

    const scriptPath =
        getBgutilScriptPath();

    if (scriptPath && !potUrl) {
        args.push(
            '--extractor-args',
            `youtubepot-bgutilscript:script_path=${scriptPath}`
        );
    }

    return args;
}


/* ============================================================================
   BGUTIL SCRIPT
============================================================================ */

function getBgutilScriptPath() {
    const candidates = [];

    if (process.env.PRIME_BGUTIL_SCRIPT) {
        candidates.push(
            process.env.PRIME_BGUTIL_SCRIPT
        );
    }

    if (process.env.USERPROFILE) {
        candidates.push(
            path.join(
                process.env.USERPROFILE,
                'bgutil-ytdlp-pot-provider',
                'server',
                'build',
                'generate_once.js'
            )
        );
    }

    candidates.push(
        path.join(
            process.cwd(),
            'bgutil-ytdlp-pot-provider',
            'server',
            'build',
            'generate_once.js'
        )
    );

    for (const candidate of candidates) {
        if (
            candidate &&
            fs.existsSync(candidate)
        ) {
            return candidate;
        }
    }

    return null;
}


function hasBgutilProvider() {
    return Boolean(
        String(
            process.env.PRIME_POT_URL || ''
        ).trim() ||
        getBgutilScriptPath()
    );
}


/* ============================================================================
   HELPERS
============================================================================ */

function createTempDirectory() {
    const folder = path.join(
        TEMP_ROOT,
        `job-${Date.now()}-${crypto.randomBytes(5).toString('hex')}`
    );

    fs.mkdirSync(
        folder,
        {
            recursive: true
        }
    );

    return folder;
}


function cleanupDirectory(directory) {
    if (!directory) {
        return;
    }

    try {
        if (fs.existsSync(directory)) {
            fs.rmSync(
                directory,
                {
                    recursive: true,
                    force: true
                }
            );
        }
    } catch (error) {
        console.error(
            'Downloader cleanup error:',
            error.message
        );
    }
}


function sanitizeTitle(title) {
    return String(
        title || 'Prime Bot'
    )
        .replace(
            /[<>:"/\\|?*\x00-\x1F]/g,
            ''
        )
        .replace(
            /\s+/g,
            ' '
        )
        .trim()
        .slice(
            0,
            150
        ) ||
        'Prime Bot';
}


function isYouTubeUrl(value) {
    return /^https?:\/\/(?:(?:www|m|music)\.)?(?:youtube\.com|youtu\.be)\//i
        .test(
            String(value || '').trim()
        );
}


function formatDuration(seconds) {
    const value =
        Number(seconds);

    if (
        !Number.isFinite(value) ||
        value < 0
    ) {
        return 'Unknown';
    }

    const total =
        Math.floor(value);

    const hours =
        Math.floor(
            total / 3600
        );

    const minutes =
        Math.floor(
            (total % 3600) / 60
        );

    const secs =
        total % 60;

    if (hours > 0) {
        return (
            `${hours}:` +
            `${String(minutes).padStart(2, '0')}:` +
            `${String(secs).padStart(2, '0')}`
        );
    }

    return (
        `${minutes}:` +
        `${String(secs).padStart(2, '0')}`
    );
}


function sleep(ms) {
    return new Promise(
        resolve => setTimeout(
            resolve,
            ms
        )
    );
}


/* ============================================================================
   RUN PROCESS
============================================================================ */

function runProcess(
    args,
    {
        cwd = process.cwd(),
        timeout = DOWNLOAD_TIMEOUT
    } = {}
) {
    return new Promise(
        (resolve, reject) => {
            const python =
                getPythonCommand();

            let child;

            try {
                child = spawn(
                    python,
                    args,
                    {
                        cwd,
                        windowsHide: true,
                        shell: false
                    }
                );
            } catch (error) {
                reject(error);
                return;
            }

            let stdout = '';
            let stderr = '';
            let finished = false;

            const timer =
                setTimeout(
                    () => {
                        if (finished) {
                            return;
                        }

                        finished = true;

                        try {
                            child.kill();
                        } catch (_) {}

                        reject(
                            new Error(
                                `Process timed out after ${Math.floor(timeout / 1000)} seconds.`
                            )
                        );
                    },
                    timeout
                );

            if (child.stdout) {
                child.stdout.on(
                    'data',
                    data => {
                        stdout +=
                            data.toString();
                    }
                );
            }

            if (child.stderr) {
                child.stderr.on(
                    'data',
                    data => {
                        stderr +=
                            data.toString();
                    }
                );
            }

            child.on(
                'error',
                error => {
                    if (finished) {
                        return;
                    }

                    finished = true;

                    clearTimeout(timer);

                    reject(error);
                }
            );

            child.on(
                'close',
                code => {
                    if (finished) {
                        return;
                    }

                    finished = true;

                    clearTimeout(timer);

                    resolve({
                        code,
                        stdout,
                        stderr
                    });
                }
            );
        }
    );
}


/* ============================================================================
   CHECK YT-DLP
============================================================================ */

async function checkYtDlp() {
    try {
        const result =
            await runProcess(
                [
                    '-m',
                    'yt_dlp',
                    '--version'
                ],
                {
                    timeout: 30000
                }
            );

        return result.code === 0;
    } catch (_) {
        return false;
    }
}


/* ============================================================================
   SEARCH YOUTUBE
============================================================================ */

async function searchYouTube(
    query,
    limit = 5
) {
    const cleanQuery =
        String(
            query || ''
        ).trim();

    if (!cleanQuery) {
        return [];
    }

    /*
     * IMPORTANT:
     *
     * There is NO "-f" here.
     *
     * Search only needs metadata.
     */

    const args = [
        '-m',
        'yt_dlp',

        ...getYtDlpCompatibilityArgs(),

        '--flat-playlist',

        '--ignore-errors',

        '--skip-download',

        '--print',
        '%(id)s\t%(title)s\t%(duration)s\t%(channel)s',

        `ytsearch${limit}:${cleanQuery}`
    ];

    const result =
        await runProcess(
            args,
            {
                timeout:
                    SEARCH_TIMEOUT
            }
        );

    if (result.code !== 0) {
        throw new Error(
            result.stderr.trim() ||
            'YouTube search failed.'
        );
    }

    const results = [];

    for (
        const line
        of result.stdout.split(/\r?\n/)
    ) {
        const trimmed =
            line.trim();

        if (!trimmed) {
            continue;
        }

        const parts =
            trimmed.split('\t');

        const id =
            parts[0];

        if (!id) {
            continue;
        }

        results.push({
            id,
            title:
                parts[1] ||
                'Unknown title',
            duration:
                parts[2] ||
                'Unknown',
            channel:
                parts[3] ||
                'Unknown'
        });
    }

    return results;
}


/* ============================================================================
   VIDEO INFO
============================================================================ */

async function getVideoInfo(url) {
    const args = [
        '-m',
        'yt_dlp',

        ...getYtDlpCompatibilityArgs(),

        '--dump-single-json',

        '--skip-download',

        url
    ];

    const result =
        await runProcess(
            args,
            {
                timeout:
                    SEARCH_TIMEOUT
            }
        );

    if (result.code !== 0) {
        throw new Error(
            result.stderr.trim() ||
            'Unable to retrieve video information.'
        );
    }

    try {
        return JSON.parse(
            result.stdout
        );
    } catch (_) {
        throw new Error(
            'YouTube returned invalid video information.'
        );
    }
}


/* ============================================================================
   DOWNLOAD AUDIO
============================================================================ */

async function downloadAudio(
    url,
    directory,
    profile = 'default'
) {
    const outputTemplate =
        path.join(
            directory,
            '%(title).150s [%(id)s].%(ext)s'
        );

    const args = [
        '-m',
        'yt_dlp',

        ...getYtDlpCompatibilityArgs(
            profile
        ),

        '--no-warnings',
        '--no-playlist',

        '--retries',
        '3',

        '--fragment-retries',
        '3',

        '--file-access-retries',
        '3',

        '--extractor-retries',
        '3',

        '--retry-sleep',
        '2',

        '--socket-timeout',
        '30',

        '--newline',

        /*
         * IMPORTANT:
         *
         * ba = best available audio
         * b  = best available format fallback
         *
         * We do NOT force a specific format such as 251.
         */

        '-f',
        'ba/b',

        '-x',

        '--audio-format',
        'mp3',

        '--audio-quality',
        '192K',

        '--add-metadata',

        '--embed-thumbnail',

        '-o',
        outputTemplate,

        url
    ];

    return await runProcess(
        args,
        {
            cwd: directory,
            timeout:
                DOWNLOAD_TIMEOUT
        }
    );
}


/* ============================================================================
   DOWNLOAD VIDEO
============================================================================ */

async function downloadVideo(
    url,
    directory,
    profile = 'default'
) {
    const outputTemplate =
        path.join(
            directory,
            '%(title).150s [%(id)s].%(ext)s'
        );

    const args = [
        '-m',
        'yt_dlp',

        ...getYtDlpCompatibilityArgs(
            profile
        ),

        '--no-warnings',
        '--no-playlist',

        '--retries',
        '3',

        '--fragment-retries',
        '3',

        '--file-access-retries',
        '3',

        '--extractor-retries',
        '3',

        '--retry-sleep',
        '2',

        '--socket-timeout',
        '30',

        '--newline',

        /*
         * Prefer MP4 streams.
         *
         * If separate video/audio streams are needed,
         * FFmpeg merges them.
         */

        '-f',
        'bv*[ext=mp4]+ba[ext=m4a]/b[ext=mp4]/b',

        '--merge-output-format',
        'mp4',

        '-o',
        outputTemplate,

        url
    ];

    return await runProcess(
        args,
        {
            cwd: directory,
            timeout:
                DOWNLOAD_TIMEOUT
        }
    );
}


/* ============================================================================
   FIND DOWNLOADED FILE
============================================================================ */

function findDownloadedFile(
    directory,
    extensions = []
) {
    if (
        !directory ||
        !fs.existsSync(directory)
    ) {
        return null;
    }

    const files =
        fs.readdirSync(
            directory
        )
        .filter(file => {
            const fullPath =
                path.join(
                    directory,
                    file
                );

            try {
                return fs.statSync(
                    fullPath
                ).isFile();
            } catch (_) {
                return false;
            }
        });

    if (!extensions.length) {
        return files.length
            ? path.join(
                directory,
                files[0]
            )
            : null;
    }

    const matching =
        files.filter(file => {
            const lower =
                file.toLowerCase();

            return extensions.some(
                extension =>
                    lower.endsWith(
                        extension.toLowerCase()
                    )
            );
        });

    if (!matching.length) {
        return null;
    }

    matching.sort(
        (a, b) => {
            const sizeA =
                fs.statSync(
                    path.join(
                        directory,
                        a
                    )
                ).size;

            const sizeB =
                fs.statSync(
                    path.join(
                        directory,
                        b
                    )
                ).size;

            return sizeB - sizeA;
        }
    );

    return path.join(
        directory,
        matching[0]
    );
}


/* ============================================================================
   SEND AUDIO
============================================================================ */

async function sendAudio({
    sock,
    jid,
    file,
    title
}) {
    if (!sock || !jid) {
        throw new Error(
            'WhatsApp socket or JID is unavailable.'
        );
    }

    if (!fs.existsSync(file)) {
        throw new Error(
            'Downloaded audio file does not exist.'
        );
    }

    const stats =
        fs.statSync(file);

    if (stats.size < 1000) {
        throw new Error(
            'Downloaded audio file appears to be invalid.'
        );
    }

    await sock.sendMessage(
        jid,
        {
            audio: {
                stream:
                    fs.createReadStream(
                        file
                    )
            },

            mimetype:
                'audio/mpeg',

            fileName:
                `${sanitizeTitle(title)}.mp3`,

            ptt: false
        }
    );

    return true;
}


/* ============================================================================
   SEND VIDEO
============================================================================ */

async function sendVideo({
    sock,
    jid,
    file,
    title
}) {
    if (!sock || !jid) {
        throw new Error(
            'WhatsApp socket or JID is unavailable.'
        );
    }

    if (!fs.existsSync(file)) {
        throw new Error(
            'Downloaded video file does not exist.'
        );
    }

    const stats =
        fs.statSync(file);

    if (stats.size < 1000) {
        throw new Error(
            'Downloaded video file appears to be invalid.'
        );
    }

    await sock.sendMessage(
        jid,
        {
            video: {
                stream:
                    fs.createReadStream(
                        file
                    )
            },

            mimetype:
                'video/mp4',

            fileName:
                `${sanitizeTitle(title)}.mp4`
        }
    );

    return true;
}


/* ============================================================================
   ERROR DETECTION
============================================================================ */

function isFormatError(message) {
    const value =
        String(
            message || ''
        ).toLowerCase();

    return (
        value.includes(
            'requested format is not available'
        ) ||
        value.includes(
            'requested format'
        )
    );
}


function isAntiBotError(message) {
    const value =
        String(
            message || ''
        ).toLowerCase();

    return (
        value.includes('sign in') ||
        value.includes('confirm you') ||
        value.includes('not a bot') ||
        value.includes('authentication') ||
        value.includes('login_required')
    );
}


/* ============================================================================
   DOWNLOAD WITH RETRIES
============================================================================ */

/*
 * We try:
 *
 *   1. normal yt-dlp client configuration
 *   2. android_vr fallback
 *
 * This is important because YouTube may expose different formats depending
 * on the client yt-dlp uses.
 */

async function downloadWithRetries(
    downloader,
    url,
    directory
) {
    let lastError = null;

    const profiles = [
        'default',
        'android_vr'
    ];

    for (
        const profile
        of profiles
    ) {
        for (
            let attempt = 1;
            attempt <= MAX_RETRIES;
            attempt++
        ) {
            try {
                console.log(
                    `🎵 Downloader profile=${profile} attempt ${attempt}/${MAX_RETRIES}`
                );

                const result =
                    await downloader(
                        url,
                        directory,
                        profile
                    );

                if (
                    result.code === 0
                ) {
                    return result;
                }

                const errorText =
                    (
                        result.stderr ||
                        result.stdout ||
                        ''
                    ).trim();

                lastError =
                    new Error(
                        errorText ||
                        `Download failed with exit code ${result.code}.`
                    );

                console.error(
                    `Downloader profile=${profile} attempt ${attempt} failed:`,
                    lastError.message
                );

                /*
                 * If this profile cannot see a usable format,
                 * immediately move to the next profile.
                 */

                if (
                    isFormatError(
                        errorText
                    )
                ) {
                    break;
                }
            } catch (error) {
                lastError =
                    error;

                console.error(
                    `Downloader profile=${profile} attempt ${attempt} error:`,
                    error.message
                );

                /*
                 * Anti-bot errors may not be fixed by simply retrying.
                 * Continue to the alternate profile.
                 */
            }

            if (
                attempt < MAX_RETRIES
            ) {
                await sleep(
                    1500 * attempt
                );
            }
        }
    }

    throw (
        lastError ||
        new Error(
            'Download failed.'
        )
    );
}


/* ============================================================================
   FRIENDLY ERROR
============================================================================ */

function friendlyDownloadError(
    error
) {
    const original =
        String(
            error?.message ||
            error ||
            ''
        );

    const message =
        original.toLowerCase();

    if (
        message.includes(
            'timed out'
        ) ||
        message.includes(
            'timeout'
        )
    ) {
        return (
            '⏱️ *DOWNLOAD TIMEOUT*\n\n' +
            'The video took too long to download.\n\n' +
            'Try a shorter video or try again.'
        );
    }

    if (
        isAntiBotError(
            message
        )
    ) {
        if (
            !hasBgutilProvider()
        ) {
            return (
                '🔐 *YOUTUBE ANTI-BOT CHECK*\n\n' +
                'YouTube is currently rejecting this download request.\n\n' +
                'The downloader has already tried multiple yt-dlp client configurations.\n\n' +
                'Your direct yt-dlp test works, so try the command again first.\n\n' +
                'If YouTube continues requiring a PO token, a bgutil PO-token provider can be configured later.'
            );
        }

        return (
            '🔐 *YOUTUBE ANTI-BOT CHECK*\n\n' +
            'The configured PO-token provider was detected, but YouTube rejected the request.\n\n' +
            'Try again or update yt-dlp/provider.'
        );
    }

    if (
        isFormatError(
            message
        )
    ) {
        return (
            '⚠️ *YOUTUBE FORMAT ERROR*\n\n' +
            'YouTube did not expose a compatible downloadable audio format for this request.\n\n' +
            'Prime Bot tried multiple yt-dlp client configurations automatically.\n\n' +
            'Try the command again or try another YouTube result.'
        );
    }

    if (
        message.includes(
            '403 forbidden'
        ) ||
        message.includes(
            'http error 403'
        )
    ) {
        return (
            '🚫 *YOUTUBE DOWNLOAD BLOCKED*\n\n' +
            'YouTube returned HTTP 403 for the selected media stream.\n\n' +
            'Prime Bot will retry using another yt-dlp client when possible.\n\n' +
            'Try the command again.'
        );
    }

    if (
        message.includes(
            'private video'
        ) ||
        message.includes(
            'video unavailable'
        )
    ) {
        return (
            '🚫 *VIDEO UNAVAILABLE*\n\n' +
            'The requested YouTube video is unavailable or private.'
        );
    }

    if (
        message.includes(
            'ffmpeg'
        )
    ) {
        return (
            '❌ *FFMPEG ERROR*\n\n' +
            'FFmpeg could not process the downloaded media.\n\n' +
            'Make sure FFmpeg is installed and available in PATH.'
        );
    }

    return (
        '❌ *DOWNLOAD FAILED*\n\n' +
        'The media could not be downloaded.\n\n' +
        'Try the command again or use another YouTube video.'
    );
}


/* ============================================================================
   PLAY
============================================================================ */

async function executePlay(
    context
) {
    const {
        reply,
        text,
        sock,
        jid
    } = context;

    const query =
        String(
            text || ''
        ).trim();

    if (!query) {
        return reply(
            '🎵 *PRIME PLAY*\n\n' +
            'Search and download music.\n\n' +
            'Usage:\n' +
            '/play song name\n\n' +
            'Example:\n' +
            '/play Omah Lay Soso'
        );
    }

    const ready =
        await checkYtDlp();

    if (!ready) {
        return reply(
            '❌ *YT-DLP NOT FOUND*\n\n' +
            'Run:\n\n' +
            'python -m pip install -U yt-dlp\n\n' +
            'Then restart Prime Bot.'
        );
    }

    let directory = null;

    try {
        await reply(
            '🔎 *SEARCHING YOUTUBE...*\n\n' +
            `🎵 ${query}`
        );

        const results =
            await searchYouTube(
                query,
                5
            );

        if (!results.length) {
            return reply(
                '❌ No YouTube results were found.'
            );
        }

        const video =
            results[0];

        const url =
            `https://www.youtube.com/watch?v=${video.id}`;

        await reply(
            '⬇️ *DOWNLOADING MUSIC...*\n\n' +
            `🎵 ${video.title}\n` +
            `👤 ${video.channel}\n` +
            `⏱️ ${formatDuration(video.duration)}\n\n` +
            'Please wait...'
        );

        directory =
            createTempDirectory();

        await downloadWithRetries(
            downloadAudio,
            url,
            directory
        );

        const file =
            findDownloadedFile(
                directory,
                ['.mp3']
            );

        if (!file) {
            throw new Error(
                'MP3 file was not created.'
            );
        }

        await sendAudio({
            sock,
            jid,
            file,
            title:
                video.title
        });

        console.log(
            `✅ MP3 sent: ${video.title}`
        );
    } catch (error) {
        console.error(
            '❌ /play error:',
            error
        );

        await reply(
            friendlyDownloadError(
                error
            )
        );
    } finally {
        cleanupDirectory(
            directory
        );
    }
}


/* ============================================================================
   SONG
============================================================================ */

async function executeSong(
    context
) {
    const query =
        String(
            context.text || ''
        ).trim();

    if (!query) {
        return context.reply(
            '🎵 Usage:\n' +
            '/song song name'
        );
    }

    return executePlay(
        context
    );
}


/* ============================================================================
   YTMP3
============================================================================ */

async function executeYtmp3(
    context
) {
    const {
        reply,
        text,
        sock,
        jid
    } = context;

    const url =
        String(
            text || ''
        ).trim();

    if (!url) {
        return reply(
            '🎵 *YOUTUBE MP3*\n\n' +
            'Usage:\n' +
            '/ytmp3 YouTube URL'
        );
    }

    if (!isYouTubeUrl(url)) {
        return reply(
            '❌ Please provide a valid YouTube URL.'
        );
    }

    const ready =
        await checkYtDlp();

    if (!ready) {
        return reply(
            '❌ yt-dlp is not installed.\n\n' +
            'Run:\n' +
            'python -m pip install -U yt-dlp'
        );
    }

    let directory = null;

    try {
        await reply(
            '🔎 Reading YouTube video...'
        );

        const info =
            await getVideoInfo(
                url
            );

        await reply(
            '⬇️ *DOWNLOADING MP3...*\n\n' +
            `🎵 ${info.title || 'YouTube audio'}\n` +
            `👤 ${info.uploader || 'Unknown'}\n` +
            `⏱️ ${formatDuration(info.duration)}`
        );

        directory =
            createTempDirectory();

        await downloadWithRetries(
            downloadAudio,
            url,
            directory
        );

        const file =
            findDownloadedFile(
                directory,
                ['.mp3']
            );

        if (!file) {
            throw new Error(
                'MP3 file was not created.'
            );
        }

        await sendAudio({
            sock,
            jid,
            file,
            title:
                info.title ||
                'Prime Bot Audio'
        });

        console.log(
            `✅ /ytmp3 completed: ${info.title}`
        );
    } catch (error) {
        console.error(
            '❌ /ytmp3 error:',
            error
        );

        await reply(
            friendlyDownloadError(
                error
            )
        );
    } finally {
        cleanupDirectory(
            directory
        );
    }
}


/* ============================================================================
   YTMP4
============================================================================ */

async function executeYtmp4(
    context
) {
    const {
        reply,
        text,
        sock,
        jid
    } = context;

    const url =
        String(
            text || ''
        ).trim();

    if (!url) {
        return reply(
            '🎥 *YOUTUBE MP4*\n\n' +
            'Usage:\n' +
            '/ytmp4 YouTube URL'
        );
    }

    if (!isYouTubeUrl(url)) {
        return reply(
            '❌ Please provide a valid YouTube URL.'
        );
    }

    const ready =
        await checkYtDlp();

    if (!ready) {
        return reply(
            '❌ yt-dlp is not installed.\n\n' +
            'Run:\n' +
            'python -m pip install -U yt-dlp'
        );
    }

    let directory = null;

    try {
        await reply(
            '🔎 Reading YouTube video...'
        );

        const info =
            await getVideoInfo(
                url
            );

        await reply(
            '🎥 *DOWNLOADING VIDEO...*\n\n' +
            `🎬 ${info.title || 'YouTube video'}\n` +
            `⏱️ ${formatDuration(info.duration)}\n\n` +
            'Please wait...'
        );

        directory =
            createTempDirectory();

        await downloadWithRetries(
            downloadVideo,
            url,
            directory
        );

        const file =
            findDownloadedFile(
                directory,
                ['.mp4']
            );

        if (!file) {
            throw new Error(
                'MP4 file was not created.'
            );
        }

        await sendVideo({
            sock,
            jid,
            file,
            title:
                info.title ||
                'Prime Bot Video'
        });

        console.log(
            `✅ /ytmp4 completed: ${info.title}`
        );
    } catch (error) {
        console.error(
            '❌ /ytmp4 error:',
            error
        );

        await reply(
            friendlyDownloadError(
                error
            )
        );
    } finally {
        cleanupDirectory(
            directory
        );
    }
}


/* ============================================================================
   YTSEARCH
============================================================================ */

async function executeYtSearch(
    context
) {
    const {
        reply,
        text
    } = context;

    const query =
        String(
            text || ''
        ).trim();

    if (!query) {
        return reply(
            '🔎 *YOUTUBE SEARCH*\n\n' +
            'Usage:\n' +
            '/ytsearch song name\n\n' +
            'Example:\n' +
            '/ytsearch Omah Lay Soso'
        );
    }

    const ready =
        await checkYtDlp();

    if (!ready) {
        return reply(
            '❌ yt-dlp is not installed.\n\n' +
            'Run:\n' +
            'python -m pip install -U yt-dlp'
        );
    }

    try {
        await reply(
            '🔎 Searching YouTube...'
        );

        const results =
            await searchYouTube(
                query,
                5
            );

        if (!results.length) {
            return reply(
                '❌ No YouTube results found.'
            );
        }

        let output =
            '╭━━━〔 🔎 YOUTUBE SEARCH 〕━━━╮\n' +
            '┃\n';

        results.forEach(
            (video, index) => {
                output +=
                    `┃ ${index + 1}. *${video.title}*\n` +
                    `┃    👤 ${video.channel}\n` +
                    `┃    ⏱️ ${formatDuration(video.duration)}\n` +
                    `┃    🔗 https://youtu.be/${video.id}\n` +
                    '┃\n';
            }
        );

        output +=
            '╰━━━━━━━━━━━━━━━━━━━━━━╯\n\n' +
            '💎 Prime Bot';

        await reply(
            output
        );
    } catch (error) {
        console.error(
            '❌ /ytsearch error:',
            error
        );

        await reply(
            '❌ *SEARCH FAILED*\n\n' +
            'YouTube search could not be completed.\n' +
            'Try again in a moment.'
        );
    }
}


/* ============================================================================
   PLUGIN EXPORT
============================================================================ */

module.exports = [

    {
        name: 'play',

        alias: [
            'song',
            'music'
        ],

        description:
            'Search YouTube and download music as MP3',

        category:
            'DOWNLOADER',

        execute:
            executePlay
    },

    {
        name: 'song',

        alias: [
            'ytmusic'
        ],

        description:
            'Download a song as MP3',

        category:
            'DOWNLOADER',

        execute:
            executeSong
    },

    {
        name: 'ytmp3',

        alias: [
            'yta',
            'ytaudio'
        ],

        description:
            'Download YouTube URL as MP3',

        category:
            'DOWNLOADER',

        execute:
            executeYtmp3
    },

    {
        name: 'ytmp4',

        alias: [
            'ytvideo'
        ],

        description:
            'Download YouTube URL as MP4',

        category:
            'DOWNLOADER',

        execute:
            executeYtmp4
    },

    {
        name: 'ytsearch',

        alias: [
            'yts',
            'youtubesearch'
        ],

        description:
            'Search YouTube without downloading',

        category:
            'DOWNLOADER',

        execute:
            executeYtSearch
    }

];

