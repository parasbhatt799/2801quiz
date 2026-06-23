const express = require('express');
const cors = require('cors');
const path = require('path');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const fs = require('fs');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Setup MySQL Connection Pool
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'test',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

let useLocalDB = false;
let localDB = {
    users: [],
    payout_requests: []
};
let localQuestions = [];

function loadLocalDB() {
    try {
        const dbPath = path.join(__dirname, 'db.json');
        if (fs.existsSync(dbPath)) {
            localDB = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
        } else {
            saveLocalDB();
        }
    } catch (e) {
        console.error("Failed to load local db.json, using empty:", e.message);
    }

    try {
        const qPath = path.join(__dirname, 'questions.json');
        if (fs.existsSync(qPath)) {
            localQuestions = JSON.parse(fs.readFileSync(qPath, 'utf8'));
        } else {
            console.warn("questions.json not found. Local questions will be empty.");
        }
    } catch (e) {
        console.error("Failed to load questions.json:", e.message);
    }
}

function saveLocalDB() {
    try {
        const dbPath = path.join(__dirname, 'db.json');
        fs.writeFileSync(dbPath, JSON.stringify(localDB, null, 2), 'utf8');
    } catch (e) {
        console.error("Failed to save local db.json:", e.message);
    }
}

async function localQuery(sql, params = []) {
    const cleanSql = sql.replace(/\s+/g, ' ').trim();

    // 1. SELECT coins, diamonds, xp, scratch_cards, username, country FROM users WHERE user_id = ?
    if (cleanSql.startsWith("SELECT coins, diamonds, xp, scratch_cards, username, country FROM users WHERE user_id = ?")) {
        const uid = params[0];
        const user = localDB.users.find(u => u.user_id === uid);
        return [user ? [user] : []];
    }

    // 2. INSERT INTO users (user_id, coins, diamonds, xp, scratch_cards, username, country) VALUES (?, ?, 0, 0, 0, ?, 'Global')
    if (cleanSql.startsWith("INSERT INTO users (user_id, coins, diamonds, xp, scratch_cards, username, country) VALUES (?, ?, 0, 0, 0, ?, 'Global')")) {
        const [uid, coins, username] = params;
        const newUser = {
            user_id: uid,
            coins: coins,
            diamonds: 0,
            xp: 0,
            scratch_cards: 0,
            username: username || uid,
            country: 'Global',
            device_fingerprint: null
        };
        localDB.users.push(newUser);
        saveLocalDB();
        return [{ affectedRows: 1 }];
    }

    // 3. SELECT q, option1, option2, option3, option4, ans, exp FROM questions WHERE category = ? ORDER BY RAND() LIMIT 5
    if (cleanSql.startsWith("SELECT q, option1, option2, option3, option4, ans, exp FROM questions WHERE category = ?")) {
        const cat = params[0];
        let filtered = localQuestions;
        if (cat !== 'all') {
            filtered = localQuestions.filter(q => q.category === cat);
        }
        // Fallback if no questions are found for this specific category
        if (filtered.length === 0) {
            filtered = localQuestions.filter(q => q.category === 'daily');
        }
        if (filtered.length === 0) {
            filtered = localQuestions;
        }
        const shuffled = [...filtered].sort(() => 0.5 - Math.random()).slice(0, 5);
        const rows = shuffled.map(q => ({
            q: q.q,
            option1: q.opt[0],
            option2: q.opt[1],
            option3: q.opt[2],
            option4: q.opt[3],
            ans: q.ans,
            exp: q.exp
        }));
        return [rows];
    }

    // 4. UPDATE users SET coins=?, diamonds=?, xp=?, scratch_cards=?, ...
    if (cleanSql.includes("UPDATE users SET")) {
        let c, d, x, s, username, country, uid;
        if (params.length === 7) {
            [c, d, x, s, username, country, uid] = params;
        } else if (params.length === 6) {
            [c, d, x, s, username, uid] = params;
        } else if (params.length === 5) {
            [c, d, x, s, uid] = params;
        }

        const user = localDB.users.find(u => u.user_id === uid);
        if (user) {
            user.coins = c;
            user.diamonds = d;
            user.xp = x;
            user.scratch_cards = s;
            if (username !== undefined) user.username = username;
            if (country !== undefined) user.country = country;
            saveLocalDB();
        }
        return [{ affectedRows: user ? 1 : 0 }];
    }

    // 5. SELECT user_id, coins, diamonds, xp, scratch_cards, username, country FROM users WHERE device_fingerprint = ?
    if (cleanSql.startsWith("SELECT user_id, coins, diamonds, xp, scratch_cards, username, country FROM users WHERE device_fingerprint = ?")) {
        const fingerprint = params[0];
        const user = localDB.users.find(u => u.device_fingerprint === fingerprint);
        return [user ? [user] : []];
    }

    // 6. INSERT INTO users (user_id, coins, diamonds, xp, scratch_cards, username, country, device_fingerprint) VALUES (?, ?, ?, ?, ?, ?, 'Global', ?)
    if (cleanSql.startsWith("INSERT INTO users (user_id, coins, diamonds, xp, scratch_cards, username, country, device_fingerprint)")) {
        const [uid, coins, diamonds, xp, scratch_cards, username, fingerprint] = params;
        const newUser = {
            user_id: uid,
            coins: coins,
            diamonds: diamonds,
            xp: xp,
            scratch_cards: scratch_cards,
            username: username || uid,
            country: 'Global',
            device_fingerprint: fingerprint
        };
        localDB.users.push(newUser);
        saveLocalDB();
        return [{ affectedRows: 1 }];
    }

    // 7/8. SELECT user_id AS uid, coins AS score, IFNULL(NULLIF(username, ''), user_id) AS name, country FROM users ...
    if (cleanSql.startsWith("SELECT user_id AS uid, coins AS score")) {
        let filtered = [...localDB.users];
        if (cleanSql.includes("WHERE country = ?")) {
            const country = params[0];
            filtered = filtered.filter(u => u.country === country);
        }
        filtered.sort((a, b) => b.coins - a.coins);
        const rows = filtered.slice(0, 50).map(u => ({
            uid: u.user_id,
            score: u.coins,
            name: u.username || u.user_id,
            country: u.country
        }));
        return [rows];
    }

    // 9. INSERT INTO payout_requests (app_uid, player_id, diamonds, status, created_at, scheduled_approval, username)
    if (cleanSql.startsWith("INSERT INTO payout_requests")) {
        const [app_uid, player_id, diamonds, created_at, scheduled_approval, username] = params;
        const newRequest = {
            id: localDB.payout_requests.length + 1,
            app_uid,
            player_id,
            diamonds,
            status: 'pending',
            created_at,
            scheduled_approval,
            username
        };
        localDB.payout_requests.push(newRequest);
        saveLocalDB();
        return [{ affectedRows: 1 }];
    }

    // 10. UPDATE payout_requests SET status = 'approved' WHERE app_uid = ? AND status = 'pending' AND scheduled_approval <= ?
    if (cleanSql.startsWith("UPDATE payout_requests SET status = 'approved'")) {
        const [app_uid, now] = params;
        let count = 0;
        localDB.payout_requests.forEach(r => {
            if (r.app_uid === app_uid && r.status === 'pending' && r.scheduled_approval <= now) {
                r.status = 'approved';
                count++;
            }
        });
        if (count > 0) saveLocalDB();
        return [{ affectedRows: count }];
    }

    // 11. SELECT player_id AS uid, app_uid, diamonds AS diamondAmount, status, created_at AS timestamp, scheduled_approval, username AS userName FROM payout_requests WHERE app_uid = ? ORDER BY id DESC
    if (cleanSql.startsWith("SELECT player_id AS uid, app_uid, diamonds AS diamondAmount")) {
        const app_uid = params[0];
        const filtered = localDB.payout_requests.filter(r => r.app_uid === app_uid);
        filtered.sort((a, b) => b.id - a.id);
        const rows = filtered.map(r => ({
            uid: r.player_id,
            app_uid: r.app_uid,
            diamondAmount: r.diamonds,
            status: r.status,
            timestamp: r.created_at,
            scheduled_approval: r.scheduled_approval,
            userName: r.username
        }));
        return [rows];
    }

    console.warn("Unhandled local query:", sql, params);
    return [[]];
}

async function query(sql, params = []) {
    if (useLocalDB) {
        return localQuery(sql, params);
    }
    try {
        return await pool.query(sql, params);
    } catch (err) {
        console.error("Database query failed, falling back to local database:", err.message);
        useLocalDB = true;
        loadLocalDB();
        return localQuery(sql, params);
    }
}

// Database Auto-Migration / Schema Checks
async function runMigrations() {
    try {
        const connection = await pool.getConnection();
        console.log("Connected to MySQL database successfully.");

        // Check columns in users table
        const [usernameCols] = await connection.query("SHOW COLUMNS FROM `users` LIKE 'username'");
        if (usernameCols.length === 0) {
            await connection.query("ALTER TABLE `users` ADD COLUMN `username` VARCHAR(100) DEFAULT NULL");
            console.log("Added column 'username' to 'users' table.");
        }

        const [countryCols] = await connection.query("SHOW COLUMNS FROM `users` LIKE 'country'");
        if (countryCols.length === 0) {
            await connection.query("ALTER TABLE `users` ADD COLUMN `country` VARCHAR(100) DEFAULT 'Global'");
            console.log("Added column 'country' to 'users' table.");
        }

        const [fingerprintCols] = await connection.query("SHOW COLUMNS FROM `users` LIKE 'device_fingerprint'");
        if (fingerprintCols.length === 0) {
            await connection.query("ALTER TABLE `users` ADD COLUMN `device_fingerprint` VARCHAR(150) DEFAULT NULL");
            console.log("Added column 'device_fingerprint' to 'users' table.");
        }

        // Create payout_requests table if it doesn't exist
        await connection.query(`
            CREATE TABLE IF NOT EXISTS \`payout_requests\` (
                \`id\` INT AUTO_INCREMENT PRIMARY KEY,
                \`app_uid\` VARCHAR(100) NOT NULL,
                \`player_id\` VARCHAR(100) NOT NULL,
                \`diamonds\` INT NOT NULL,
                \`status\` VARCHAR(20) DEFAULT 'pending',
                \`created_at\` BIGINT NOT NULL,
                \`scheduled_approval\` BIGINT NOT NULL,
                \`username\` VARCHAR(100) DEFAULT NULL
            )
        `);
        console.log("Database migrations completed successfully.");
        connection.release();
    } catch (err) {
        console.error("Database connection/migration failed:", err.message);
        console.log("Switching to local file database (db.json/questions.json)...");
        useLocalDB = true;
        loadLocalDB();
    }
}

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files and pages manually to handle Vercel's serverless path routing
app.use((req, res, next) => {
    const blocked = ['/server.js', '/package.json', '/package-lock.json', '/.env', '/vercel.json'];
    if (blocked.includes(req.path) || req.path.startsWith('/api/index.js')) {
        return res.status(403).send('Access Denied');
    }
    next();
});

app.get('/', (req, res, next) => {
    if (req.query.action) {
        return next();
    }
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/index.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get(['/app', '/app.html'], (req, res) => {
    res.sendFile(path.join(__dirname, 'app.html'));
});

app.get(['/topic', '/topic.html'], (req, res) => {
    res.sendFile(path.join(__dirname, 'topic.html'));
});

app.get(['/result', '/result.html'], (req, res) => {
    res.sendFile(path.join(__dirname, 'result.html'));
});

app.get(['/scratch', '/scratch.html'], (req, res) => {
    res.sendFile(path.join(__dirname, 'scratch.html'));
});

app.get('/privacy-policy', (req, res) => {
    res.sendFile(path.join(__dirname, 'privacy-policy'));
});

app.use('/css', express.static(path.join(__dirname, 'css')));
app.use('/webfonts', express.static(path.join(__dirname, 'webfonts')));

app.get('/:file', (req, res, next) => {
    const file = req.params.file;
    const allowedExtensions = ['.js', '.css', '.png', '.json', '.txt', '.ico', '.webmanifest'];
    const ext = path.extname(file);
    if (allowedExtensions.includes(ext)) {
        const filePath = path.join(__dirname, file);
        if (fs.existsSync(filePath)) {
            return res.sendFile(filePath);
        }
    }
    next();
});

// Single Unified API Endpoint mapping to api.php requests
app.all(['/api.php', '/api', '/api/', '/api/index.js', '/'], async (req, res) => {
    const action = req.query.action || req.body.action || '';

    try {
        if (action === 'debug_vercel') {
            return res.json({
                debug_version: "v2-assets-check",
                url: req.url,
                path: req.path,
                cwd: process.cwd(),
                dirname: __dirname,
                filesInCwd: fs.existsSync(process.cwd()) ? fs.readdirSync(process.cwd()) : null,
                filesInDirname: fs.existsSync(__dirname) ? fs.readdirSync(__dirname) : null
            });
        }

        if (action === 'get_keys') {
            return res.json([]);
        }

        if (action === 'get_user') {
            const uid = req.query.uid || req.body.uid || '';
            if (!uid) {
                return res.status(400).json({ error: "UID is required" });
            }

            const [rows] = await query("SELECT coins, diamonds, xp, scratch_cards, username, country FROM users WHERE user_id = ?", [uid]);
            if (rows.length > 0) {
                return res.json(rows[0]);
            } else {
                const initial_coins = 500;
                await query("INSERT INTO users (user_id, coins, diamonds, xp, scratch_cards, username, country) VALUES (?, ?, 0, 0, 0, ?, 'Global')", [uid, initial_coins, uid]);
                return res.json({
                    coins: initial_coins,
                    diamonds: 0,
                    xp: 0,
                    scratch_cards: 0,
                    username: uid,
                    country: "Global"
                });
            }
        }

        if (action === 'get_questions') {
            const cat = req.query.category || req.body.category || 'gk';
            let [rows] = await query("SELECT q, option1, option2, option3, option4, ans, exp FROM questions WHERE category = ? ORDER BY RAND() LIMIT 5", [cat]);

            // Fallback: If no questions found for this category, try querying 'daily'
            if (rows.length === 0) {
                [rows] = await query("SELECT q, option1, option2, option3, option4, ans, exp FROM questions WHERE category = 'daily' ORDER BY RAND() LIMIT 5");
            }
            // Second Fallback: If still no questions, query any available questions
            if (rows.length === 0) {
                [rows] = await query("SELECT q, option1, option2, option3, option4, ans, exp FROM questions ORDER BY RAND() LIMIT 5");
            }

            const questions = rows.map(row => ({
                q: row.q,
                opt: [row.option1, row.option2, row.option3, row.option4],
                ans: parseInt(row.ans),
                exp: row.exp
            }));

            if (questions.length === 0) {
                return res.status(404).json({ error: "No questions found" });
            }
            return res.json(questions);
        }

        if (action === 'update_stats') {
            const data = req.body;
            if (!data || !data.uid) {
                return res.status(400).json({ status: "error", message: "Invalid data" });
            }

            const uid = data.uid;
            const c = parseInt(data.coins) || 0;
            const d = parseInt(data.diamonds) || 0;
            const x = parseInt(data.xp) || 0;
            const s = parseInt(data.scratch_cards) || 0;
            const username = data.username || '';
            const country = data.country || '';

            if (username && country) {
                await query("UPDATE users SET coins=?, diamonds=?, xp=?, scratch_cards=?, username=?, country=? WHERE user_id=?", [c, d, x, s, username, country, uid]);
            } else if (username) {
                await query("UPDATE users SET coins=?, diamonds=?, xp=?, scratch_cards=?, username=? WHERE user_id=?", [c, d, x, s, username, uid]);
            } else {
                await query("UPDATE users SET coins=?, diamonds=?, xp=?, scratch_cards=? WHERE user_id=?", [c, d, x, s, uid]);
            }
            return res.json({ status: "success" });
        }

        if (action === 'get_or_create_user') {
            const fingerprint = req.query.fingerprint || req.body.fingerprint || '';
            if (!fingerprint) {
                return res.status(400).json({ error: "Fingerprint is required" });
            }

            const [rows] = await query("SELECT user_id, coins, diamonds, xp, scratch_cards, username, country FROM users WHERE device_fingerprint = ?", [fingerprint]);
            if (rows.length > 0) {
                return res.json(rows[0]);
            } else {
                const new_uid = 'u' + Math.floor(100000 + Math.random() * 900000);
                const initial_coins = 500;
                const initial_diamonds = 100;
                const initial_xp = 0;
                const initial_scratch = 6;
                await query("INSERT INTO users (user_id, coins, diamonds, xp, scratch_cards, username, country, device_fingerprint) VALUES (?, ?, ?, ?, ?, ?, 'Global', ?)",
                    [new_uid, initial_coins, initial_diamonds, initial_xp, initial_scratch, new_uid, fingerprint]);

                return res.json({
                    user_id: new_uid,
                    coins: initial_coins,
                    diamonds: initial_diamonds,
                    xp: initial_xp,
                    scratch_cards: initial_scratch,
                    username: new_uid,
                    country: "Global"
                });
            }
        }

        if (action === 'get_leaderboard') {
            const filter = req.query.filter || 'global';
            const country = req.query.country || '';

            let rows;
            if (filter === 'local' && country) {
                [rows] = await query("SELECT user_id AS uid, coins AS score, IFNULL(NULLIF(username, ''), user_id) AS name, country FROM users WHERE country = ? ORDER BY coins DESC LIMIT 50", [country]);
            } else {
                [rows] = await query("SELECT user_id AS uid, coins AS score, IFNULL(NULLIF(username, ''), user_id) AS name, country FROM users ORDER BY coins DESC LIMIT 50");
            }
            return res.json(rows);
        }

        if (action === 'submit_payout') {
            const data = req.body;
            if (!data || !data.app_uid || !data.uid || data.diamonds === undefined) {
                return res.status(400).json({ status: "error", message: "Invalid data" });
            }

            const app_uid = data.app_uid;
            const player_id = data.uid;
            const diamonds = parseInt(data.diamonds) || 0;
            const scheduled_approval = data.scheduled_approval;
            const username = data.userName || '';
            const created_at = Date.now();

            await query("INSERT INTO payout_requests (app_uid, player_id, diamonds, status, created_at, scheduled_approval, username) VALUES (?, ?, ?, 'pending', ?, ?, ?)",
                [app_uid, player_id, diamonds, created_at, scheduled_approval, username]);
            return res.json({ status: "success" });
        }

        if (action === 'get_payouts') {
            const app_uid = req.query.app_uid || '';
            if (!app_uid) {
                return res.status(400).json({ error: "app_uid is required" });
            }

            const now = Date.now();
            await query("UPDATE payout_requests SET status = 'approved' WHERE app_uid = ? AND status = 'pending' AND scheduled_approval <= ?", [app_uid, now]);

            const [rows] = await query("SELECT player_id AS uid, app_uid, diamonds AS diamondAmount, status, created_at AS timestamp, scheduled_approval, username AS userName FROM payout_requests WHERE app_uid = ? ORDER BY id DESC", [app_uid]);
            return res.json(rows);
        }

        return res.status(400).json({ error: "Invalid action" });
    } catch (err) {
        console.error("API Error:", err);
        return res.status(500).json({ error: err.message });
    }
});

// Startup Server
app.listen(port, async () => {
    console.log(`Server started on http://localhost:${port}`);
    await runMigrations();
});

module.exports = app;
