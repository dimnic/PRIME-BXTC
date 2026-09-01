module.exports = [
    {
        name: 'ff',
        alias: ['freefire'],
        description: 'Free Fire commands',
        category: 'FREE FIRE',

        async execute({ reply }) {
            await reply(
                `╭━━━〔 🔥 FREE FIRE CENTER 〕━━━╮
┃
┃  🎯 *PRIME FF SENSITIVITY*
┃
┃  Get a device-customized sensitivity
┃  profile instead of generic settings.
┃
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

📱 *SENSITIVITY*

/ffsens <device>
/sensitivity <device>

Examples:

/ffsens iPhone 15 Pro Max
/ffsens iPhone 11
/ffsens Samsung A15
/ffsens Samsung S24 Ultra
/ffsens Redmi Note 13 Pro
/ffsens Poco X6 Pro
/ffsens Tecno Camon 30
/ffsens Infinix Note 40
/ffsens OnePlus 12
/ffsens Oppo Reno 11

━━━━━━━━━━━━━━━━━━━━━━

🎮 *PROFILE TYPES*

• Low-end
• Mid-range
• High-end
• Gaming devices
• iPhone
• Android

━━━━━━━━━━━━━━━━━━━━━━

💡 *TIP*

For the best result, send your
*exact device model*.

Example:
🔥 /ffsens Redmi Note 13 Pro

╰━━━〔 💎 PRIME BOT 〕━━━╯`
            );
        }
    },

    {
        name: 'ffsens',
        alias: ['sensitivity'],

        description: 'Device-specific Free Fire sensitivity',
        category: 'FREE FIRE',

        async execute({ reply, text }) {

            if (!text) {
                return reply(
                    `╭━━━〔 🎯 FF SENSITIVITY 〕━━━╮
┃
┃ 📱 Send your exact device model.
┃
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

Examples:

🔥 /ffsens iPhone 15 Pro Max
🔥 /ffsens iPhone 11
🔥 /ffsens Samsung A15
🔥 /ffsens Samsung S24 Ultra
🔥 /ffsens Redmi Note 13 Pro
🔥 /ffsens Poco X6 Pro
🔥 /ffsens Tecno Camon 30
🔥 /ffsens Infinix Note 40
🔥 /ffsens OnePlus 12
🔥 /ffsens Oppo Reno 11
🔥 /ffsens Vivo V30

━━━━━━━━━━━━━━━━━━━━━━

⚙️ The profile is adjusted according
to the device class, performance and
touch characteristics.

💡 Exact model = better result.`
                );
            }

            const originalDevice = text.trim();
            const device = originalDevice.toLowerCase();

            let settings;
            let profile;
            let dpi;
            let fps;
            let drag;
            let note;

            /*
             * ==========================================================
             * IPHONE
             * ==========================================================
             */

            if (
                device.includes('iphone 15 pro max') ||
                device.includes('iphone 15 pro') ||
                device.includes('iphone 16 pro max') ||
                device.includes('iphone 16 pro')
            ) {

                settings = {
                    General: 188,
                    RedDot: 178,
                    '2x Scope': 168,
                    '4x Scope': 158,
                    Sniper: 92,
                    'Free Look': 145
                };

                profile = 'HIGH-END iPHONE';
                dpi = 'Default iOS touch scaling';
                fps = '90–120 FPS capable';
                drag = 'Short / controlled drag';
                note = 'High touch response. Avoid excessive drag length.';

            } else if (
                device.includes('iphone 14 pro') ||
                device.includes('iphone 14 pro max')
            ) {

                settings = {
                    General: 184,
                    RedDot: 174,
                    '2x Scope': 164,
                    '4x Scope': 154,
                    Sniper: 90,
                    'Free Look': 142
                };

                profile = 'PRO iPHONE';
                dpi = 'Default iOS touch scaling';
                fps = 'High FPS';
                drag = 'Short drag';
                note = 'Designed around the fast ProMotion touch response.';

            } else if (
                device.includes('iphone 13 pro') ||
                device.includes('iphone 13 pro max')
            ) {

                settings = {
                    General: 181,
                    RedDot: 171,
                    '2x Scope': 161,
                    '4x Scope': 151,
                    Sniper: 88,
                    'Free Look': 140
                };

                profile = 'PRO iPHONE';
                dpi = 'Default iOS touch scaling';
                fps = 'High FPS';
                drag = 'Short / medium drag';
                note = 'Good balance between drag speed and control.';

            } else if (
                device.includes('iphone 11') ||
                device.includes('iphone 12') ||
                device.includes('iphone xr') ||
                device.includes('iphone xs')
            ) {

                settings = {
                    General: 174,
                    RedDot: 164,
                    '2x Scope': 154,
                    '4x Scope': 145,
                    Sniper: 84,
                    'Free Look': 136
                };

                profile = 'STANDARD iPHONE';
                dpi = 'Default iOS touch scaling';
                fps = '60 FPS target';
                drag = 'Medium drag';
                note = 'Balanced profile for older iPhone hardware.';

            } else if (device.includes('iphone')) {

                settings = {
                    General: 178,
                    RedDot: 168,
                    '2x Scope': 158,
                    '4x Scope': 148,
                    Sniper: 86,
                    'Free Look': 138
                };

                profile = 'iPHONE';
                dpi = 'Default iOS touch scaling';
                fps = '60–120 FPS depending on model';
                drag = 'Medium drag';
                note = 'Generic iPhone profile — exact model gives better tuning.';


            /*
             * ==========================================================
             * SAMSUNG
             * ==========================================================
             */

            } else if (
                device.includes('s24 ultra') ||
                device.includes('s23 ultra') ||
                device.includes('s22 ultra')
            ) {

                settings = {
                    General: 194,
                    RedDot: 184,
                    '2x Scope': 174,
                    '4x Scope': 163,
                    Sniper: 94,
                    'Free Look': 148
                };

                profile = 'SAMSUNG FLAGSHIP';
                dpi = 'Recommended: 420–480';
                fps = '90–120 FPS';
                drag = 'Short drag';
                note = 'High-performance profile with strong touch response.';

            } else if (
                device.includes('a55') ||
                device.includes('a54') ||
                device.includes('a35') ||
                device.includes('a34')
            ) {

                settings = {
                    General: 190,
                    RedDot: 180,
                    '2x Scope': 170,
                    '4x Scope': 160,
                    Sniper: 91,
                    'Free Look': 146
                };

                profile = 'SAMSUNG MID/HIGH RANGE';
                dpi = 'Recommended: 400–450';
                fps = '60–90 FPS';
                drag = 'Short / medium drag';
                note = 'Balanced for Samsung A-series performance.';

            } else if (
                device.includes('a15') ||
                device.includes('a14') ||
                device.includes('a13')
            ) {

                settings = {
                    General: 183,
                    RedDot: 173,
                    '2x Scope': 163,
                    '4x Scope': 153,
                    Sniper: 87,
                    'Free Look': 141
                };

                profile = 'SAMSUNG BUDGET';
                dpi = 'Recommended: 360–420';
                fps = '40–60 FPS';
                drag = 'Medium drag';
                note = 'Reduced scope sensitivity for better control on budget hardware.';

            } else if (
                device.includes('samsung') ||
                device.includes('galaxy')
            ) {

                settings = {
                    General: 186,
                    RedDot: 176,
                    '2x Scope': 166,
                    '4x Scope': 156,
                    Sniper: 89,
                    'Free Look': 143
                };

                profile = 'SAMSUNG';
                dpi = 'Recommended: 380–450';
                fps = '60–90 FPS depending on model';
                drag = 'Medium drag';
                note = 'Generic Samsung profile — exact model improves accuracy.';


            /*
             * ==========================================================
             * REDMI / XIAOMI / POCO
             * ==========================================================
             */

            } else if (
                device.includes('poco x6 pro') ||
                device.includes('poco f5') ||
                device.includes('poco f6')
            ) {

                settings = {
                    General: 196,
                    RedDot: 187,
                    '2x Scope': 176,
                    '4x Scope': 165,
                    Sniper: 95,
                    'Free Look': 150
                };

                profile = 'POCO GAMING';
                dpi = 'Recommended: 450–520';
                fps = '90–120 FPS';
                drag = 'Very short drag';
                note = 'Fast profile for high-refresh gaming devices.';

            } else if (
                device.includes('redmi note 13 pro') ||
                device.includes('redmi note 12 pro') ||
                device.includes('redmi note 11 pro')
            ) {

                settings = {
                    General: 193,
                    RedDot: 183,
                    '2x Scope': 173,
                    '4x Scope': 162,
                    Sniper: 93,
                    'Free Look': 147
                };

                profile = 'REDMI NOTE PRO';
                dpi = 'Recommended: 430–500';
                fps = '60–120 FPS depending on model';
                drag = 'Short drag';
                note = 'Optimized for high-touch-response Redmi Note Pro devices.';

            } else if (
                device.includes('redmi') ||
                device.includes('xiaomi') ||
                device.includes('poco')
            ) {

                settings = {
                    General: 189,
                    RedDot: 179,
                    '2x Scope': 169,
                    '4x Scope': 159,
                    Sniper: 90,
                    'Free Look': 145
                };

                profile = 'XIAOMI / REDMI';
                dpi = 'Recommended: 400–480';
                fps = '60–120 FPS depending on model';
                drag = 'Short / medium drag';
                note = 'Balanced Xiaomi profile.';


            /*
             * ==========================================================
             * TECNO
             * ==========================================================
             */

            } else if (
                device.includes('camon 30') ||
                device.includes('camon 20') ||
                device.includes('phantom')
            ) {

                settings = {
                    General: 187,
                    RedDot: 177,
                    '2x Scope': 167,
                    '4x Scope': 157,
                    Sniper: 89,
                    'Free Look': 143
                };

                profile = 'TECNO HIGH/MID RANGE';
                dpi = 'Recommended: 390–450';
                fps = '60–90 FPS';
                drag = 'Medium drag';
                note = 'Balanced profile for Tecno high/mid-range devices.';

            } else if (device.includes('tecno')) {

                settings = {
                    General: 181,
                    RedDot: 171,
                    '2x Scope': 161,
                    '4x Scope': 151,
                    Sniper: 86,
                    'Free Look': 140
                };

                profile = 'TECNO';
                dpi = 'Recommended: 360–430';
                fps = '40–60 FPS';
                drag = 'Medium drag';
                note = 'Designed for controlled drag on Tecno devices.';


            /*
             * ==========================================================
             * INFINIX
             * ==========================================================
             */

            } else if (
                device.includes('gt 20 pro') ||
                device.includes('gt 30 pro') ||
                device.includes('infinix gt')
            ) {

                settings = {
                    General: 194,
                    RedDot: 184,
                    '2x Scope': 174,
                    '4x Scope': 164,
                    Sniper: 94,
                    'Free Look': 149
                };

                profile = 'INFINIX GAMING';
                dpi = 'Recommended: 430–500';
                fps = '90–120 FPS';
                drag = 'Short drag';
                note = 'Fast profile for GT gaming hardware.';

            } else if (device.includes('infinix')) {

                settings = {
                    General: 183,
                    RedDot: 173,
                    '2x Scope': 163,
                    '4x Scope': 153,
                    Sniper: 87,
                    'Free Look': 141
                };

                profile = 'INFINIX';
                dpi = 'Recommended: 360–430';
                fps = '40–90 FPS depending on model';
                drag = 'Medium drag';
                note = 'Balanced Infinix profile.';


            /*
             * ==========================================================
             * ONEPLUS
             * ==========================================================
             */

            } else if (
                device.includes('oneplus 12') ||
                device.includes('oneplus 11') ||
                device.includes('oneplus 10')
            ) {

                settings = {
                    General: 195,
                    RedDot: 185,
                    '2x Scope': 175,
                    '4x Scope': 165,
                    Sniper: 95,
                    'Free Look': 150
                };

                profile = 'ONEPLUS FLAGSHIP';
                dpi = 'Recommended: 420–500';
                fps = '90–120 FPS';
                drag = 'Very short drag';
                note = 'Fast-response profile for high-refresh OnePlus phones.';


            /*
             * ==========================================================
             * OPPO / VIVO / REALME
             * ==========================================================
             */

            } else if (
                device.includes('oppo') ||
                device.includes('reno')
            ) {

                settings = {
                    General: 185,
                    RedDot: 175,
                    '2x Scope': 165,
                    '4x Scope': 155,
                    Sniper: 88,
                    'Free Look': 142
                };

                profile = 'OPPO';
                dpi = 'Recommended: 380–450';
                fps = '60–90 FPS';
                drag = 'Medium drag';
                note = 'Balanced Oppo profile.';

            } else if (
                device.includes('vivo') ||
                device.includes('iqoo')
            ) {

                settings = {
                    General: 191,
                    RedDot: 181,
                    '2x Scope': 171,
                    '4x Scope': 161,
                    Sniper: 92,
                    'Free Look': 146
                };

                profile = 'VIVO / iQOO';
                dpi = 'Recommended: 400–480';
                fps = '60–120 FPS';
                drag = 'Short drag';
                note = 'Faster profile for Vivo/iQOO touch response.';

            } else if (
                device.includes('realme') ||
                device.includes('narzo')
            ) {

                settings = {
                    General: 188,
                    RedDot: 178,
                    '2x Scope': 168,
                    '4x Scope': 158,
                    Sniper: 90,
                    'Free Look': 144
                };

                profile = 'REALME';
                dpi = 'Recommended: 390–460';
                fps = '60–120 FPS';
                drag = 'Short / medium drag';
                note = 'Balanced Realme profile.';


            /*
             * ==========================================================
             * UNKNOWN DEVICE
             * ==========================================================
             */

            } else {

                settings = {
                    General: 185,
                    RedDot: 175,
                    '2x Scope': 165,
                    '4x Scope': 155,
                    Sniper: 88,
                    'Free Look': 143
                };

                profile = 'CUSTOM STARTING PROFILE';
                dpi = 'Use your normal device DPI';
                fps = 'Use your normal stable FPS';
                drag = 'Medium drag';
                note = 'Unknown device. Send the exact model for a more specific profile.';
            }

            /*
             * ==========================================================
             * RESULT
             * ==========================================================
             */

            await reply(
                `╭━━━〔 🔥 PRIME FF 〕━━━╮
┃
┃  🎯 *DEVICE SENSITIVITY*
┃
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

📱 *DEVICE*
${originalDevice}

⚙️ *PROFILE*
${profile}

━━━━━━━━━━━━━━━━━━━━━━

🎯 *SENSITIVITY*

🔵 General     : *${settings.General}*
🔴 Red Dot     : *${settings.RedDot}*
🔭 2x Scope    : *${settings['2x Scope']}*
🔭 4x Scope    : *${settings['4x Scope']}*
🎯 Sniper      : *${settings.Sniper}*
👀 Free Look   : *${settings['Free Look']}*

━━━━━━━━━━━━━━━━━━━━━━

⚙️ *DEVICE TUNING*

📱 DPI
${dpi}

🎮 FPS
${fps}

🖐️ Drag
${drag}

━━━━━━━━━━━━━━━━━━━━━━

💡 *TUNING NOTE*

${note}

━━━━━━━━━━━━━━━━━━━━━━

🔥 *HEADSHOT TUNING*

If aim goes *over the head*:
→ Reduce General by 3–5

If aim stays *on the body*:
→ Increase General by 3–5

If Red Dot feels too fast:
→ Reduce Red Dot by 2–4

If 4x feels unstable:
→ Reduce 4x Scope by 3–5

━━━━━━━━━━━━━━━━━━━━━━

⚠️ These are calibrated starting
profiles, not guaranteed universal
values. Actual performance changes
with FPS, touch response, DPI,
screen size and your drag technique.

💎 *PRIME BOT • FREE FIRE*`
            );
        }
    }
];