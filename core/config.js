const fs = require('fs');
const path = require('path');

/*
|--------------------------------------------------------------------------
| PRIME BOT CONFIGURATION
|--------------------------------------------------------------------------
*/

const BOT_NAME = 'PRIME BOT';
const VERSION = '2.1.0';

/*
|--------------------------------------------------------------------------
| COMMAND PREFIX
|--------------------------------------------------------------------------
*/

const PREFIX = '/';

/*
|--------------------------------------------------------------------------
| BOT MODE
|--------------------------------------------------------------------------
|
| public  = everyone can use commands
| private = only owner/sudo can use commands
|
*/

const MODE = 'public';

/*
|--------------------------------------------------------------------------
| BOT PHONE NUMBER
|--------------------------------------------------------------------------
|
| The WhatsApp number used by the bot.
|
| Example:
| 2347052042544
|
| Do NOT use:
| +2347052042544
| 07052042544
|
*/

let BOT_NUMBER =
    process.env.BOT_NUMBER ||
    '2347052042544';

/*
|--------------------------------------------------------------------------
| OWNER NUMBERS
|--------------------------------------------------------------------------
|
| Put the owner's WhatsApp number here.
|
| You can add more than one owner.
|
*/

const OWNER_NUMBERS = [
    process.env.OWNER_NUMBER || '2349136164617'
];

/*
|--------------------------------------------------------------------------
| SUDO USERS
|--------------------------------------------------------------------------
|
| Sudo users have owner-level access to commands.
|
| Add numbers without +.
|
| Example:
|
| const SUDO_NUMBERS = [
|     '2347052042544',
|     '2348012345678'
| ];
|
*/

const SUDO_NUMBERS = [
    process.env.SUDO_NUMBER || '2347052042544'
];

/*
|--------------------------------------------------------------------------
| DATA DIRECTORY
|--------------------------------------------------------------------------
*/

const DATA_DIR = path.join(__dirname, '..', 'data');

if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, {
        recursive: true
    });
}

/*
|--------------------------------------------------------------------------
| SUDO FILE
|--------------------------------------------------------------------------
*/

const SUDO_FILE = path.join(
    DATA_DIR,
    'sudo.json'
);

/*
|--------------------------------------------------------------------------
| NORMALIZE NUMBER
|--------------------------------------------------------------------------
*/

function normalizeNumber(number) {

    let value = String(number || '')
        .replace(/\D/g, '');

    if (!value) {
        return '';
    }

    /*
    | Nigerian local format
    */

    if (value.startsWith('0')) {
        value =
            '234' +
            value.slice(1);
    }

    return value;
}

/*
|--------------------------------------------------------------------------
| GET BOT PHONE NUMBER
|--------------------------------------------------------------------------
*/

function getPhoneNumber() {

    return normalizeNumber(
        BOT_NUMBER
    );
}

/*
|--------------------------------------------------------------------------
| SET BOT PHONE NUMBER
|--------------------------------------------------------------------------
*/

function setPhoneNumber(number) {

    BOT_NUMBER =
        normalizeNumber(number);

    return BOT_NUMBER;
}

/*
|--------------------------------------------------------------------------
| CONVERT NUMBER TO JID
|--------------------------------------------------------------------------
*/

function numberToJid(number) {

    const normalized =
        normalizeNumber(number);

    if (!normalized) {
        return '';
    }

    return `${normalized}@s.whatsapp.net`;
}

/*
|--------------------------------------------------------------------------
| GET OWNER NUMBERS
|--------------------------------------------------------------------------
*/

function getOwners() {

    return OWNER_NUMBERS
        .map(normalizeNumber)
        .filter(Boolean)
        .map(numberToJid);
}

/*
|--------------------------------------------------------------------------
| GET SUDO NUMBERS
|--------------------------------------------------------------------------
*/

function getSudo() {

    let users = [];

    /*
    | Built-in sudo users
    */

    users.push(
        ...SUDO_NUMBERS
    );

    /*
    | Owner is automatically sudo
    */

    users.push(
        ...OWNER_NUMBERS
    );

    /*
    | Load additional sudo users
    | from data/sudo.json
    */

    try {

        if (fs.existsSync(SUDO_FILE)) {

            const data =
                JSON.parse(
                    fs.readFileSync(
                        SUDO_FILE,
                        'utf8'
                    )
                );

            if (Array.isArray(data)) {

                users.push(
                    ...data
                );

            }

        }

    } catch (error) {

        console.error(
            '⚠️ Could not read sudo.json:',
            error.message
        );

    }

    /*
    | Normalize and convert to JID
    */

    return [
        ...new Set(
            users
                .map(normalizeNumber)
                .filter(Boolean)
                .map(numberToJid)
        )
    ];
}

/*
|--------------------------------------------------------------------------
| ADD SUDO
|--------------------------------------------------------------------------
*/

function addSudo(number) {

    const normalized =
        normalizeNumber(number);

    if (!normalized) {
        return false;
    }

    let users = [];

    try {

        if (fs.existsSync(SUDO_FILE)) {

            const data =
                JSON.parse(
                    fs.readFileSync(
                        SUDO_FILE,
                        'utf8'
                    )
                );

            if (Array.isArray(data)) {
                users = data;
            }

        }

    } catch (_) {
        users = [];
    }

    if (!users.includes(normalized)) {

        users.push(
            normalized
        );

    }

    fs.writeFileSync(
        SUDO_FILE,
        JSON.stringify(
            users,
            null,
            2
        )
    );

    return true;
}

/*
|--------------------------------------------------------------------------
| REMOVE SUDO
|--------------------------------------------------------------------------
*/

function removeSudo(number) {

    const normalized =
        normalizeNumber(number);

    let users = [];

    try {

        if (fs.existsSync(SUDO_FILE)) {

            const data =
                JSON.parse(
                    fs.readFileSync(
                        SUDO_FILE,
                        'utf8'
                    )
                );

            if (Array.isArray(data)) {
                users = data;
            }

        }

    } catch (_) {
        return false;
    }

    users =
        users.filter(
            user =>
                normalizeNumber(user) !==
                normalized
        );

    fs.writeFileSync(
        SUDO_FILE,
        JSON.stringify(
            users,
            null,
            2
        )
    );

    return true;
}

/*
|--------------------------------------------------------------------------
| CHECK OWNER
|--------------------------------------------------------------------------
*/

function isOwner(number) {

    const normalized =
        normalizeNumber(number);

    return OWNER_NUMBERS
        .map(normalizeNumber)
        .includes(normalized);
}

/*
|--------------------------------------------------------------------------
| CHECK SUDO
|--------------------------------------------------------------------------
*/

function isSudo(number) {

    const normalized =
        normalizeNumber(number);

    return getSudo()
        .some(
            jid =>
                jid.split('@')[0] ===
                normalized
        );
}

/*
|--------------------------------------------------------------------------
| EXPORT
|--------------------------------------------------------------------------
*/

module.exports = {

    BOT_NAME,

    VERSION,

    PREFIX,

    MODE,

    DATA_DIR,

    OWNER_NUMBERS,

    normalizeNumber,

    getPhoneNumber,

    setPhoneNumber,

    getOwners,

    getSudo,

    addSudo,

    removeSudo,

    isOwner,

    isSudo,

    numberToJid

};