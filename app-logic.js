const params = new URLSearchParams(window.location.search);
let mode = params.get('mode');
let qIdx = parseInt(params.get('q')) || 0;
let roomId = params.get('room');
let myRole = params.get('role');
let startTime = 0;
const API_URL = "api.php";
let score = parseInt(localStorage.getItem('qz_score')) || 0;
let sessionData = [];
let isBotMatch = false;
let botScore = 0;
let botIndex = 0;
let botTimer = null;
let wakeLock = null;
let spinning = false;
let deferredPrompt;
let currentPage = 1;
const itemsPerPage = 10;
const buzzAudioSource = new Audio("https://codeskulptor-demos.commondatastorage.googleapis.com/GalaxyInvaders/alien_shoot.wav");
buzzAudioSource.preload = "auto";
let isRedirecting = false;

function showDialog(title, message, isConfirm = false) {
    return new Promise((resolve) => {
        document.body.style.overflow = 'hidden';

        const oldModal = document.getElementById('custom-dialog');
        if (oldModal) oldModal.remove();

        const modal = document.createElement('div');
        modal.id = 'custom-dialog';
        modal.className = 'fixed inset-0 z-[20000] flex items-center justify-center p-4 bg-black/20 animate-in fade-in duration-200';

        modal.innerHTML = `
            <div class="bg-white dark:bg-[#0f172a] w-full max-w-[280px] rounded-[2.5rem] p-6 text-center shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-white/50 dark:border-slate-800 relative overflow-hidden scale-90 animate-in zoom-in duration-300">
                <div class="absolute -top-5 -right-5 w-20 h-20 bg-blue-500/10 rounded-full blur-2xl"></div>
                <div class="relative w-14 h-14 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/20">
                    <i class="fa-solid fa-brain text-white text-xl animate-pulse"></i>
                </div>
                <h3 class="font-black text-lg dark:text-white text-slate-800 uppercase italic tracking-tighter mb-2 leading-none">${title}</h3>
                <p class="text-slate-500 dark:text-slate-400 text-[11px] font-bold leading-tight mb-6 px-1">${message}</p>
                <div class="flex gap-2">
                    ${isConfirm ? `
                        <button id="dialog-cancel" class="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-xl font-black uppercase text-[9px] tracking-widest active:scale-95 transition-all">No</button>
                    ` : ''}
                    <button id="dialog-ok" class="flex-1 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-black uppercase text-[9px] tracking-widest shadow-lg shadow-blue-500/20 active:scale-95 transition-all">${isConfirm ? 'Yes' : 'OK'}</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        const closeAndResolve = (value) => {
            document.body.style.overflow = '';
            modal.classList.add('opacity-0');
            setTimeout(() => { modal.remove(); resolve(value); }, 150);
        };

        document.getElementById('dialog-ok').onclick = () => closeAndResolve(true);
        if (isConfirm) {
            document.getElementById('dialog-cancel').onclick = () => closeAndResolve(false);
        }
    });
}

const ALL_CATEGORIES = [
    { id: 'math', name: 'Mathematics', sub: 'Logic Matrix', reward: '50 💰', extra: '10 Qs', live: '1.2k', icon: 'fa-calculator', color: 'from-blue-600 to-indigo-600' },
    { id: 'tech', name: 'Neural Link', sub: 'AI & Robotics', reward: '55 💰', extra: '10 Qs', live: '900', icon: 'fa-robot', color: 'from-cyan-500 to-blue-500' },
    { id: 'crypto', name: 'Blockchain', sub: 'Web3 & Bitcoin', reward: '80 💰', extra: '12 Qs', live: '2.5k', icon: 'fa-bitcoin-sign', color: 'from-orange-400 to-yellow-600' },
    { id: 'finance', name: 'Wall Street', sub: 'Stocks & Forex', reward: '90 💰', extra: '10 Qs', live: '1.8k', icon: 'fa-chart-line', color: 'from-green-600 to-emerald-700' },
    { id: 'gk', name: 'Global Info', sub: 'Earth Nodes', reward: '40 💰', extra: '15 Qs', live: '850', icon: 'fa-earth-asia', color: 'from-violet-600 to-purple-600' },
    { id: 'science', name: 'Quantum Lab', sub: 'Physics & Bio', reward: '60 💰', extra: '10 Qs', live: '2.1k', icon: 'fa-microscope', color: 'from-emerald-500 to-teal-600' },
    { id: 'space', name: 'Cosmos', sub: 'Galaxies & NASA', reward: '75 💰', extra: '10 Qs', live: '1.1k', icon: 'fa-rocket', color: 'from-indigo-900 to-purple-800' },
    { id: 'geo', name: 'Cartography', sub: 'Land & Seas', reward: '35 💰', extra: '15 Qs', live: '600', icon: 'fa-compass', color: 'from-green-600 to-emerald-800' },
    { id: 'history', name: 'Chronicles', sub: 'Ancient Wars', reward: '70 💰', extra: '10 Qs', live: '400', icon: 'fa-scroll', color: 'from-amber-700 to-yellow-800' },
    { id: 'bollywood', name: 'Cinema', sub: 'Stars & Movies', reward: '30 💰', extra: '20 Qs', live: '3.4k', icon: 'fa-clapperboard', color: 'from-rose-500 to-orange-500' },
    { id: 'gaming', name: 'Esports', sub: 'GTA & Pubg', reward: '50 💰', extra: '15 Qs', live: '5.2k', icon: 'fa-gamepad', color: 'from-purple-500 to-pink-500' },
    { id: 'music', name: 'Melody', sub: 'Pop & Classical', reward: '35 💰', extra: '12 Qs', live: '2.2k', icon: 'fa-music', color: 'from-pink-500 to-rose-600' },
    { id: 'anime', name: 'Otaku', sub: 'Naruto & Solo', reward: '45 💰', extra: '15 Qs', live: '4.8k', icon: 'fa-mask', color: 'from-blue-400 to-cyan-600' },
    { id: 'tv', name: 'Streaming', sub: 'Netflix Series', reward: '40 💰', extra: '10 Qs', live: '1.5k', icon: 'fa-tv', color: 'from-red-600 to-black' },
    { id: 'sports', name: 'Athletics', sub: 'Cricket & Football', reward: '45 💰', extra: '12 Qs', live: '1.5k', icon: 'fa-medal', color: 'from-orange-500 to-red-600' },
    { id: 'fitness', name: 'Gym Bro', sub: 'Health & Diet', reward: '55 💰', extra: '10 Qs', live: '900', icon: 'fa-dumbbell', color: 'from-cyan-600 to-blue-700' },
    { id: 'yoga', name: 'Zen Mind', sub: 'Peace & Yoga', reward: '40 💰', extra: '10 Qs', live: '450', icon: 'fa-leaf', color: 'from-green-400 to-teal-500' },
    { id: 'f1', name: 'Formula 1', sub: 'Speed & Racing', reward: '65 💰', extra: '10 Qs', live: '1.2k', icon: 'fa-car-side', color: 'from-red-700 to-gray-900' },
    { id: 'startup', name: 'Unicorn', sub: 'Business Ideas', reward: '100 💰', extra: '10 Qs', live: '1.1k', icon: 'fa-lightbulb', color: 'from-yellow-500 to-orange-600' },
    { id: 'marketing', name: 'Branding', sub: 'Ads & Social', reward: '75 💰', extra: '12 Qs', live: '950', icon: 'fa-bullhorn', color: 'from-indigo-500 to-blue-800' },
    { id: 'realestate', name: 'Property', sub: 'Luxury Living', reward: '95 💰', extra: '10 Qs', live: '600', icon: 'fa-building', color: 'from-amber-600 to-brown-800' },
    { id: 'investing', name: 'Assets', sub: 'Gold & Bonds', reward: '90 💰', extra: '12 Qs', live: '750', icon: 'fa-vault', color: 'from-yellow-600 to-yellow-800' },
    { id: 'travel', name: 'Voyage', sub: 'World Tour', reward: '45 💰', extra: '15 Qs', live: '1.9k', icon: 'fa-plane', color: 'from-sky-400 to-blue-600' },
    { id: 'fashion', name: 'Vogue', sub: 'Trends & Style', reward: '50 💰', extra: '10 Qs', live: '1.4k', icon: 'fa-shirt', color: 'from-pink-400 to-purple-600' },
    { id: 'auto', name: 'Garage', sub: 'Supercars', reward: '60 💰', extra: '10 Qs', live: '1.1k', icon: 'fa-car', color: 'from-gray-700 to-black' },
    { id: 'myth', name: 'Mythology', sub: 'Gods & Heroes', reward: '55 💰', extra: '12 Qs', live: '1.2k', icon: 'fa-bolt', color: 'from-yellow-400 to-amber-600' },
    { id: 'gadgets', name: 'Gizmos', sub: 'Latest Tech', reward: '55 💰', extra: '10 Qs', live: '1.4k', icon: 'fa-mobile-screen', color: 'from-gray-500 to-slate-700' },
    { id: 'psychology', name: 'Mindset', sub: 'Human Behavior', reward: '60 💰', extra: '10 Qs', live: '850', icon: 'fa-brain', color: 'from-purple-400 to-indigo-600' },
    { id: 'robotic', name: 'Automaton', sub: 'Future Tech', reward: '75 💰', extra: '10 Qs', live: '500', icon: 'fa-gears', color: 'from-blue-400 to-cyan-500' },
    { id: 'insurance', name: 'Policy', sub: 'Life & Health', reward: '100 💰', extra: '10 Qs', live: '300', icon: 'fa-house-chimney-medical', color: 'from-blue-700 to-indigo-800' },
    { id: 'legal', name: 'Justice', sub: 'Law & Rights', reward: '90 💰', extra: '12 Qs', live: '250', icon: 'fa-gavel', color: 'from-stone-700 to-black' },
    { id: 'energy', name: 'Green Fuel', sub: 'Solar & EV', reward: '70 💰', extra: '10 Qs', live: '650', icon: 'fa-solar-panel', color: 'from-yellow-400 to-green-600' },
    { id: 'luxury', name: 'Elite', sub: 'Watches & Cars', reward: '95 💰', extra: '10 Qs', live: '700', icon: 'fa-gem', color: 'from-yellow-700 to-amber-900' },
    { id: 'astronomy', name: 'Stargaze', sub: 'Planets & Sun', reward: '50 💰', extra: '10 Qs', live: '600', icon: 'fa-moon', color: 'from-indigo-950 to-purple-900' },
    { id: 'mortgage', name: 'Home Loans', sub: 'Equity & Rates', reward: '110 💰', extra: '10 Qs', live: '450', icon: 'fa-house-circle-check', color: 'from-emerald-700 to-teal-900' },
    { id: 'credit', name: 'Credit Cards', sub: 'Score & Limit', reward: '95 💰', extra: '12 Qs', live: '800', icon: 'fa-credit-card', color: 'from-blue-600 to-indigo-900' },
    { id: 'tax', name: 'Tax Planning', sub: 'GST & Filing', reward: '120 💰', extra: '10 Qs', live: '300', icon: 'fa-file-invoice-dollar', color: 'from-rose-700 to-red-900' },
    { id: 'insurance_auto', name: 'Auto Policy', sub: 'Vehicle Cover', reward: '85 💰', extra: '10 Qs', live: '550', icon: 'fa-car-burst', color: 'from-slate-600 to-slate-800' },
    { id: 'retirement', name: '401k / Pension', sub: 'Old Age Fund', reward: '100 💰', extra: '10 Qs', live: '200', icon: 'fa-couch', color: 'from-amber-500 to-orange-700' },
    { id: 'trading', name: 'Day Trading', sub: 'Options & Intraday', reward: '130 💰', extra: '15 Qs', live: '2.1k', icon: 'fa-arrow-trend-up', color: 'from-green-500 to-emerald-600' },
    { id: 'mba', name: 'Business Mgmt', sub: 'MBA & HR', reward: '75 💰', extra: '12 Qs', live: '1.2k', icon: 'fa-user-tie', color: 'from-blue-500 to-indigo-700' },
    { id: 'ielts', name: 'English Test', sub: 'IELTS & TOEFL', reward: '60 💰', extra: '15 Qs', live: '3.4k', icon: 'fa-language', color: 'from-violet-500 to-purple-700' },
    { id: 'scholarship', name: 'Grant Finder', sub: 'Study Abroad', reward: '80 💰', extra: '10 Qs', live: '900', icon: 'fa-graduation-cap', color: 'from-cyan-600 to-blue-800' },
    { id: 'upsc', name: 'Civil Service', sub: 'IAS & IPS Prep', reward: '70 💰', extra: '20 Qs', live: '5.5k', icon: 'fa-building-columns', color: 'from-orange-600 to-amber-800' },
    { id: 'law', name: 'Legal Eagle', sub: 'Court & Justice', reward: '100 💰', extra: '10 Qs', live: '500', icon: 'fa-gavel', color: 'from-stone-600 to-stone-900' },
    { id: 'history_war', name: 'Battlefield', sub: 'WW1 & WW2', reward: '55 💰', extra: '10 Qs', live: '1.5k', icon: 'fa-solid fa-person-rifle', color: 'from-olive-600 to-stone-800' },
    { id: 'mythology_greek', name: 'Olympus', sub: 'Zeus & Hades', reward: '50 💰', extra: '12 Qs', live: '2.2k', icon: 'fa-bolt-lightning', color: 'from-sky-600 to-blue-800' },
    { id: 'luxury_watch', name: 'Horology', sub: 'Rolex & Patek', reward: '110 💰', extra: '10 Qs', live: '400', icon: 'fa-clock', color: 'from-yellow-600 to-amber-900' },
    { id: 'world_cup', name: 'ODI World Cup', sub: 'Global Glory', reward: '70 💰', extra: '12 Qs', live: '8.5k', icon: 'fa-trophy', color: 'from-yellow-500 to-amber-700' },
    { id: 'cricket_rules', name: 'Umpire Call', sub: 'Rules & DRS', reward: '40 💰', extra: '10 Qs', live: '1.2k', icon: 'fa-circle-exclamation', color: 'from-slate-600 to-slate-800' },
    { id: 'premier_league', name: 'PL English', sub: 'Manchester & Pool', reward: '45 💰', extra: '15 Qs', live: '9.2k', icon: 'fa-futbol', color: 'from-purple-600 to-indigo-800' },
    { id: 'champions_league', name: 'UCL Nights', sub: 'European Kings', reward: '80 💰', extra: '10 Qs', live: '15k', icon: 'fa-star', color: 'from-blue-900 to-black' },
    { id: 'fifa_wc', name: 'FIFA World Cup', sub: 'National Pride', reward: '100 💰', extra: '20 Qs', live: '20k', icon: 'fa-earth-americas', color: 'from-teal-600 to-emerald-800' },
    { id: 'laliga', name: 'La Liga', sub: 'Spanish Flair', reward: '40 💰', extra: '12 Qs', live: '5.4k', icon: 'fa-bullseye', color: 'from-orange-600 to-red-600' },
    { id: 'football_stars', name: 'GOAT Quiz', sub: 'Messi vs CR7', reward: '50 💰', extra: '15 Qs', live: '18k', icon: 'fa-crown', color: 'from-yellow-400 to-orange-500' },
    { id: 'wimbledon', name: 'Wimbledon', sub: 'The Grass Court', reward: '65 💰', extra: '10 Qs', live: '1.8k', icon: 'fa-seedling', color: 'from-green-700 to-green-900' },
    { id: 'table_tennis', name: 'Ping Pong', sub: 'Rapid Spin', reward: '35 💰', extra: '15 Qs', live: '1.1k', icon: 'fa-table-tennis-paddle-ball', color: 'from-rose-500 to-pink-600' },
    { id: 'boxing', name: 'Boxing HW', sub: 'Knockout Punch', reward: '70 💰', extra: '10 Qs', live: '3.4k', icon: 'fa-mitten', color: 'from-red-800 to-red-950' },
    { id: 'wwe', name: 'Pro Wrestling', sub: 'Raw & SD', reward: '40 💰', extra: '15 Qs', live: '10k', icon: 'fa-mask', color: 'from-red-600 to-blue-800' },
    { id: 'nba_ball', name: 'NBA Stars', sub: 'Dunk & Triple', reward: '65 💰', extra: '12 Qs', live: '8.1k', icon: 'fa-basketball', color: 'from-orange-600 to-orange-800' },
    { id: 'nfl_football', name: 'NFL / Rugby', sub: 'Super Bowl', reward: '75 💰', extra: '10 Qs', live: '5.2k', icon: 'fa-football', color: 'from-blue-800 to-indigo-950' },
    { id: 'baseball', name: 'MLB HomeRun', sub: 'Diamond Field', reward: '50 💰', extra: '10 Qs', live: '2.2k', icon: 'fa-baseball-bat-ball', color: 'from-slate-400 to-slate-600' },
    { id: 'olympics', name: 'Olympics', sub: 'Summer Games', reward: '100 💰', extra: '20 Qs', live: '4.5k', icon: 'fa-circle-nodes', color: 'from-blue-500 via-red-500 to-green-500' },
    { id: 'athletics', name: 'Track & Field', sub: 'Bolt Speed', reward: '55 💰', extra: '12 Qs', live: '1.5k', icon: 'fa-person-running', color: 'from-emerald-500 to-teal-700' },
    { id: 'swimming', name: 'Aquatics', sub: 'Laps & Strokes', reward: '45 💰', extra: '10 Qs', live: '900', icon: 'fa-person-swimming', color: 'from-cyan-400 to-blue-600' },
    { id: 'gymnastics', name: 'Gymnastics', sub: 'Balance & Flip', reward: '60 💰', extra: '10 Qs', live: '1.1k', icon: 'fa-child-reaching', color: 'from-pink-500 to-purple-500' },
    { id: 'kabaddi', name: 'Pro Kabaddi', sub: 'Raid & Tackle', reward: '45 💰', extra: '12 Qs', live: '7.8k', icon: 'fa-people-group', color: 'from-orange-500 to-amber-600' },
    { id: 'hockey', name: 'Field Hockey', sub: 'National Game', reward: '50 💰', extra: '10 Qs', live: '2.5k', icon: 'fa-hockey-puck', color: 'from-blue-600 to-cyan-800' },
    { id: 'golf', name: 'Golf Tour', sub: 'Hole in One', reward: '95 💰', extra: '10 Qs', live: '800', icon: 'fa-golf-ball-tee', color: 'from-green-500 to-emerald-700' },
    { id: 'cycling', name: 'Tour de Fra', sub: 'Cycling Road', reward: '50 💰', extra: '12 Qs', live: '1.4k', icon: 'fa-bicycle', color: 'from-yellow-400 to-orange-500' },
    { id: 'volleyball', name: 'Volleyball', sub: 'Spike & Block', reward: '40 💰', extra: '12 Qs', live: '2.2k', icon: 'fa-volleyball', color: 'from-orange-400 to-amber-500' },
    { id: 'skateboarding', name: 'Skate Park', sub: 'Tricks & Rails', reward: '45 💰', extra: '10 Qs', live: '900', icon: 'fa-skateboard', color: 'from-gray-500 to-zinc-700' },
    { id: 'snooker', name: 'Cue Sports', sub: 'Pool & Snooker', reward: '55 💰', extra: '10 Qs', live: '1.6k', icon: 'fa-circle-dot', color: 'from-green-800 to-black' },
    { id: 'climbing', name: 'Rock Climb', sub: 'Summit Reach', reward: '75 💰', extra: '10 Qs', live: '500', icon: 'fa-mountain', color: 'from-stone-600 to-stone-900' },
    { id: 'shooting', name: 'Gun Sport', sub: 'Precision', reward: '60 💰', extra: '12 Qs', live: '800', icon: 'fa-crosshairs', color: 'from-red-900 to-black' },
    { id: 'wrestling', name: 'Kushti', sub: 'Dangal Mode', reward: '45 💰', extra: '10 Qs', live: '3.1k', icon: 'fa-user-ninja', color: 'from-orange-700 to-red-800' },
    { id: 'polo', name: 'Horse Polo', sub: 'Elite Sport', reward: '110 💰', extra: '10 Qs', live: '200', icon: 'fa-horse', color: 'from-amber-800 to-stone-900' },
    { id: 'darts', name: 'Darts', sub: 'Bullseye', reward: '35 💰', extra: '15 Qs', live: '1.2k', icon: 'fa-bullseye', color: 'from-indigo-600 to-purple-800' },
    { id: 'bowling', name: 'Bowling', sub: 'Ten Pins', reward: '40 💰', extra: '12 Qs', live: '1.5k', icon: 'fa-bowling-ball', color: 'from-slate-700 to-blue-800' },
    { id: 'marathon', name: 'Endurance', sub: '42.2km Run', reward: '65 💰', extra: '10 Qs', live: '2.4k', icon: 'fa-person-walking-arrow-right', color: 'from-lime-500 to-green-700' },
    { id: 'weightlifting', name: 'Powerlift', sub: 'Snatch & Jerk', reward: '70 💰', extra: '10 Qs', live: '1.1k', icon: 'fa-dumbbell', color: 'from-blue-900 to-black' },
    { id: 'free_fire', name: 'Free Fire', sub: 'Booyah Challenge', reward: '50 💰', extra: '12 Qs', live: '18k', icon: 'fa-fire', color: 'from-orange-500 to-red-600' },
    { id: 'roblox', name: 'Roblox', sub: 'User Worlds', reward: '35 💰', extra: '15 Qs', live: '25k', icon: 'fa-square-full', color: 'from-red-600 to-red-800' },
    { id: 'fifa_ea', name: 'FC 24 / FIFA', sub: 'Football Sim', reward: '55 💰', extra: '12 Qs', live: '10k', icon: 'fa-futbol', color: 'from-blue-600 to-indigo-800' },
    { id: 'pubg_pc', name: 'PUBG Steam', sub: 'Erangel Map', reward: '65 💰', extra: '12 Qs', live: '5.5k', icon: 'fa-parachute-box', color: 'from-orange-700 to-stone-900' },
    { id: 'esports_pro', name: 'Pro Scene', sub: 'Tournaments', reward: '80 💰', extra: '12 Qs', live: '6.8k', icon: 'fa-trophy', color: 'from-yellow-500 to-orange-600' },
    { id: 'chess_game', name: 'Chess', sub: 'Grandmaster', reward: '50 💰', extra: '10 Qs', live: '12k', icon: 'fa-chess-queen', color: 'from-gray-800 to-black' },
    { id: 'india_tour', name: 'Incredible India', sub: 'Taj & Culture', reward: '50 💰', extra: '15 Qs', live: '12k', icon: 'fa-om', color: 'from-orange-500 via-white to-green-500' },
    { id: 'germany_tech', name: 'Germany Hub', sub: 'Berlin & Cars', reward: '60 💰', extra: '10 Qs', live: '1.9k', icon: 'fa-car-side', color: 'from-gray-700 to-black' },
    { id: 'world_wonders', name: '7 Wonders', sub: 'Global Pride', reward: '110 💰', extra: '14 Qs', live: '10k', icon: 'fa-earth-americas', color: 'from-amber-600 to-yellow-800' },
    { id: 'cruise_life', name: 'Cruise Ship', sub: 'Luxury at Sea', reward: '95 💰', extra: '10 Qs', live: '1.5k', icon: 'fa-ship', color: 'from-indigo-500 to-blue-800' },
    { id: 'backpacker', name: 'Backpacker', sub: 'Budget Travel', reward: '30 💰', extra: '20 Qs', live: '15k', icon: 'fa-person-hiking', color: 'from-lime-600 to-green-800' },
    { id: 'world_museums', name: 'Art Gallery', sub: 'History Hub', reward: '50 💰', extra: '12 Qs', live: '3.1k', icon: 'fa-palette', color: 'from-stone-500 to-stone-800' },
    { id: 'festivals_world', name: 'Festivals', sub: 'Carnivals', reward: '55 💰', extra: '10 Qs', live: '8.2k', icon: 'fa-mask', color: 'from-purple-500 to-pink-500' },
    { id: 'south_korea', name: 'South Korea', sub: 'K-Pop & Tech', reward: '60 💰', extra: '12 Qs', live: '7.4k', icon: 'fa-music', color: 'from-blue-400 to-rose-400' },
    { id: 'vietnam', name: 'Vietnam', sub: 'Ha Long Bay', reward: '40 💰', extra: '15 Qs', live: '3.2k', icon: 'fa-leaf', color: 'from-yellow-500 to-red-600' },
    { id: 'new_zealand', name: 'New Zealand', sub: 'Kiwi Land', reward: '70 💰', extra: '10 Qs', live: '1.8k', icon: 'fa-kiwi-bird', color: 'from-green-800 to-emerald-900' },
    { id: 'south_africa', name: 'S. Africa', sub: 'Cape Town', reward: '55 💰', extra: '12 Qs', live: '2.5k', icon: 'fa-mountain', color: 'from-yellow-600 via-green-600 to-blue-600' },
    { id: 'netherlands', name: 'Netherlands', sub: 'Tulips & Canal', reward: '60 💰', extra: '10 Qs', live: '2.1k', icon: 'fa-wind', color: 'from-orange-500 to-blue-600' },
    { id: 'portugal', name: 'Portugal', sub: 'Lisbon Coast', reward: '50 💰', extra: '12 Qs', live: '1.7k', icon: 'fa-anchor', color: 'from-red-700 to-green-700' },
    { id: 'austria', name: 'Austria', sub: 'Vienna Music', reward: '65 💰', extra: '10 Qs', live: '900', icon: 'fa-music', color: 'from-red-400 to-red-800' },
    { id: 'norway', name: 'Norway', sub: 'Fjords & Sea', reward: '80 💰', extra: '10 Qs', live: '1.3k', icon: 'fa-bridge-water', color: 'from-blue-800 to-sky-600' },
    { id: 'peru_macchu', name: 'Peru', sub: 'Inca Trail', reward: '75 💰', extra: '10 Qs', live: '800', icon: 'fa-mountain-city', color: 'from-amber-700 to-orange-900' },
    { id: 'morocco', name: 'Morocco', sub: 'Sahara Magic', reward: '50 💰', extra: '12 Qs', live: '1.9k', icon: 'fa-sun', color: 'from-orange-600 to-red-800' },
    { id: 'israel', name: 'Israel', sub: 'Holy Lands', reward: '70 💰', extra: '10 Qs', live: '2.3k', icon: 'fa-star-of-david', color: 'from-blue-500 to-blue-900' },
    { id: 'argentina', name: 'Argentina', sub: 'Tango & Messi', reward: '55 💰', extra: '12 Qs', live: '4.6k', icon: 'fa-futbol', color: 'from-sky-400 to-white' },
    { id: 'scotland', name: 'Scotland', sub: 'Highlands', reward: '60 💰', extra: '10 Qs', live: '1.4k', icon: 'fa-whiskey-glass', color: 'from-blue-900 to-slate-500' },
    { id: 'ireland', name: 'Ireland', sub: 'Green Isle', reward: '50 💰', extra: '12 Qs', live: '2.2k', icon: 'fa-clover', color: 'from-green-500 to-green-900' },
    { id: 'nepal_everest', name: 'Nepal', sub: 'Mt. Everest', reward: '80 💰', extra: '10 Qs', live: '3.5k', icon: 'fa-mountain', color: 'from-red-600 to-blue-800' },
    { id: 'malaysia', name: 'Malaysia', sub: 'KL Towers', reward: '45 💰', extra: '15 Qs', live: '4.9k', icon: 'fa-hotel', color: 'from-blue-600 to-yellow-500' },
];

let filteredData = shuffleArray(ALL_CATEGORIES);

const ACHIEVEMENT_CONFIG = [
    { id: 'first_win', name: 'First Blood', desc: 'Win your first quiz', target: 1, type: 'quizzes_played', reward: 100 },
    { id: 'quiz_master', name: 'Quiz Master', desc: 'Play 50 quizzes', target: 50, type: 'quizzes_played', reward: 1000 },
    { id: 'pvp_king', name: 'PVP King', desc: 'Win 20 PvP Matches', target: 20, type: 'pvp_wins', reward: 2000 },
    { id: 'richie', name: 'Billionaire', desc: 'Earn 10,000 Total Coins', target: 10000, type: 'total_coins_earned', reward: 5000 }
];

const DAILY_REWARDS = [100, 150, 200, 250, 300, 400, 1000];
const avatars = [
    { id: 'default', name: 'Standard', price: 0, icon: 'fa-brain', color: 'text-blue-500' },
    { id: 'neon', name: 'Neon Brain', price: 500, icon: 'fa-microchip', color: 'text-cyan-400', glow: 'shadow-[0_0_15px_rgba(34,211,238,0.5)]' },
    { id: 'robot', name: 'Cyborg', price: 1000, icon: 'fa-robot', color: 'text-indigo-500', glow: 'shadow-[0_0_15px_rgba(99,102,241,0.5)]' },
    { id: 'god', name: 'IQ God', price: 5000, icon: 'fa-bolt-lightning', color: 'text-yellow-400', glow: 'shadow-[0_0_20px_rgba(250,204,21,0.6)]' }
];
function shuffleArray(array) {
    let shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}




function triggerAdAndNavigate(url) {
    lockUI();
    document.body.style.transition = 'opacity 0.15s ease-in-out';
    document.body.style.opacity = '0';
    setTimeout(() => {
        window.location.href = url;
    }, 150);
}




function lockUI() {
    if (isRedirecting) return true;
    isRedirecting = true;
    let loader = document.getElementById('global-app-loader');
    if (!loader) {
        loader = document.createElement('div');
        loader.id = 'global-app-loader';
        loader.className = 'fixed inset-0 z-[10000] flex items-center justify-center bg-black/10 pointer-events-auto';
        loader.innerHTML = `
            <div class="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm p-5 rounded-[2rem] shadow-2xl border border-blue-500/20 flex flex-col items-center scale-90 animate-in zoom-in duration-200">
                <div class="relative flex items-center justify-center">
                    <div class="w-12 h-12 border-4 border-blue-500/10 border-t-blue-600 rounded-full animate-spin"></div>
                    <i class="fa-solid fa-brain text-blue-600 text-sm absolute"></i>
                </div>
                <p class="mt-3 text-[9px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-[0.2em]">Please Wait...</p>
            </div>
        `;
        document.body.appendChild(loader);
    }
    document.body.style.pointerEvents = 'none';


    setTimeout(() => {
        if (isRedirecting) {
            console.log("Redirect taking too long... Unlocking UI.");
            unlockUI();
        }
    }, 8000);


    return false;
}

function unlockUI() {
    isRedirecting = false;
    document.body.style.pointerEvents = 'auto';
    const loader = document.getElementById('global-app-loader');
    if (loader) {
        loader.remove();
    }
}


function safeRedirect(url) {
    if (lockUI()) return;
    triggerAdAndNavigate(url);

}

function safeNav(url) {
    if (isRedirecting) return;
    lockUI();

    let targetUrl = url;
    if (targetUrl === '/' || targetUrl === 'index.html' || targetUrl.endsWith('/index.html')) {
        targetUrl = 'index.html?finished=true';
    }
    triggerAdAndNavigate(targetUrl);
}
function generateDeviceFingerprint() {
    const info = [
        navigator.userAgent,
        navigator.language,
        screen.colorDepth,
        screen.width + 'x' + screen.height,
        new Date().getTimezoneOffset(),
        navigator.hardwareConcurrency || 'unk'
    ].join('|');

    let hash = 0;
    for (let i = 0; i < info.length; i++) {
        hash = ((hash << 5) - hash) + info.charCodeAt(i);
        hash |= 0;
    }
    return 'dev_' + Math.abs(hash);
}

async function saveToServer() {
    const uid = localStorage.getItem('user_id');
    const data = {
        uid: uid,
        coins: parseInt(localStorage.getItem('total_wallet')) || 0,
        diamonds: parseInt(localStorage.getItem('total_diamonds')) || 0,
        xp: parseInt(localStorage.getItem('user_xp')) || 0,
        scratch_cards: parseInt(localStorage.getItem('scratch_cards')) || 0,
        username: localStorage.getItem('user_name') || uid,
        country: localStorage.getItem('user_country') || 'Global'
    };
    try {
        await fetch(`${API_URL}?action=update_stats`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
    } catch (e) { console.error("Sync Error"); }
}


async function loadFromServer() {
    const uid = localStorage.getItem('user_id');
    const isNewUser = !localStorage.getItem('user_already_joined');
    if (!uid) return;

    try {
        const res = await fetch(`${API_URL}?action=get_user&uid=${uid}`);
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const data = await res.json();
        if (!isNewUser && data) {
            localStorage.setItem('total_wallet', data.coins || 0);
            localStorage.setItem('total_diamonds', data.diamonds || 0);
            localStorage.setItem('user_xp', data.xp || 0);
            localStorage.setItem('scratch_cards', data.scratch_cards || 0);
            if (data.username) localStorage.setItem('user_name', data.username);
            if (data.country) localStorage.setItem('user_country', data.country);
        }
        updateDashboard();
    } catch (e) {
        console.error("Detailed Load Error:", e);
    }
}

async function detectUserCountry() {
    if (localStorage.getItem('user_country')) return;
    try {
        const res = await fetch('https://ipapi.co/json/');
        const data = await res.json();
        localStorage.setItem('user_country', data.country_name || 'Global');
    } catch (e) {
        localStorage.setItem('user_country', 'Global');
    }
}


async function loadWithdrawalHistory() {
    const container = document.getElementById('withdrawal-list');
    const myId = localStorage.getItem('user_id');

    let playMoreBtnHtml = `
        <div class="mb-6">
            <button onclick="safeNav('app.html?mode=categories')" 
                class="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-[2rem] font-black uppercase text-[11px] tracking-widest shadow-lg shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-2">
                <i class="fa-solid fa-circle-play text-lg"></i>
                Play More & Earn Point
            </button>
        </div>
        <h3 class="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 px-2">Transaction History</h3>
    `;

    try {
        const res = await fetch(`${API_URL}?action=get_payouts&app_uid=${myId}`);
        const allData = await res.json();

        if (!allData || allData.length === 0) {
            container.innerHTML = playMoreBtnHtml + `<p class="text-center text-gray-400 py-10">No history found!</p>`;
            return;
        }

        let listHtml = "";
        for (let req of allData) {
            const date = new Date(req.timestamp).toLocaleDateString('en-GB');
            let statusStyle = "text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20";
            if (req.status === 'approved') statusStyle = "text-green-500 bg-green-50 dark:bg-green-900/20";

            listHtml += `
            <div class="bg-white dark:bg-gray-900 p-4 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm flex items-center justify-between mb-3">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600">
                        <i class="fa-solid fa-gem"></i>
                    </div>
                    <div>
                        <h4 class="text-xs font-black dark:text-white">${req.diamondAmount} Rewards Point</h4>
                        <p class="text-[8px] font-bold text-gray-400">${date}</p>
                    </div>
                </div>
                <div class="text-right">
                    <span class="px-3 py-1 rounded-full text-[8px] font-black uppercase ${statusStyle}">
                        ${req.status}
                    </span>
                    <p class="text-[7px] text-gray-400 mt-1">UID: ${req.uid}</p>
                </div>
            </div>`;
        }

        container.innerHTML = playMoreBtnHtml + listHtml;
    } catch (e) {
        console.error("Load Payouts Error:", e);
        container.innerHTML = playMoreBtnHtml + `<p class="text-center text-gray-400 py-10">Failed to load history!</p>`;
    }
}
async function redeemDiamonds() {
    let diamonds = parseInt(localStorage.getItem('total_diamonds')) || 0;
    const uid = document.getElementById('ff-uid-input').value.trim();
    const app_uid = localStorage.getItem('user_id');
    const randomDelay = Math.floor(Math.random() * (172800000 - 86400000 + 1)) + 86400000;
    const autoApproveAt = Date.now() + randomDelay;
    if (!uid || uid.length < 5) {
        await showDialog("Invalid Player ID", "Please enter a valid Player ID.");
        return;
    }
    if (diamonds < 5000) {
        await showDialog("Minimum Limit", "You need at least 5,000 to redeem!");
        return;
    }
    try {
        const reqData = {
            app_uid: app_uid,
            uid: uid,
            diamonds: diamonds,
            scheduled_approval: autoApproveAt,
            userName: localStorage.getItem('user_name') || 'Player'
        };
        const res = await fetch(`${API_URL}?action=submit_payout`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(reqData)
        });
        const status = await res.json();
        if (status.status !== 'success') throw new Error(status.message);

        window.trackGA('withdrawal_request', { 'points': diamonds });
        localStorage.setItem('total_diamonds', 0);
        saveToServer();
        await showDialog("Request Sent", "Request sent successfully! It will be processed within 48 hours. ✅");
        updateDashboard();
    } catch (e) {
        console.error("Redeem Error:", e);
        await showDialog("Network Error", "Connection failed. Please try again later.");
    }
}


async function init() {
    const deviceFingerprint = generateDeviceFingerprint();
    let userId = localStorage.getItem('user_id');
    if (!userId) {
        try {
            const res = await fetch(`${API_URL}?action=get_or_create_user&fingerprint=${deviceFingerprint}`);
            const data = await res.json();
            if (data && data.user_id) {
                userId = data.user_id;
                localStorage.setItem('user_id', userId);
                localStorage.setItem('user_name', data.username || userId);
                localStorage.setItem('total_diamonds', data.diamonds !== undefined ? data.diamonds : '100');
                localStorage.setItem('total_wallet', data.coins !== undefined ? data.coins : '500');
                localStorage.setItem('user_xp', data.xp !== undefined ? data.xp : '0');
                localStorage.setItem('scratch_cards', data.scratch_cards !== undefined ? data.scratch_cards : '6');
                localStorage.setItem('user_already_joined', 'true');
                if (data.country) localStorage.setItem('user_country', data.country);
            }
        } catch (e) {
            userId = 'u' + Math.floor(100000 + Math.random() * 900000);
            localStorage.setItem('user_id', userId);
        }
    }

    if (!localStorage.getItem('user_name')) localStorage.setItem('user_name', userId);
    await loadFromServer();
    detectUserCountry();
    loadSavedTheme();
    updateDashboard();
    const path = window.location.pathname.toLowerCase().replace(/\/$/, "");
    const isIndex = path === "" || path.endsWith('index.html') || path.endsWith('/index') || path.endsWith('index');
    const isApp = path.endsWith('app.html') || path.endsWith('/app') || path.endsWith('app');
    const isResult = path.endsWith('result.html') || path.endsWith('/result') || path.endsWith('result');

    if (isResult) {
        loadLeaderboard(false);
        const needsVault = localStorage.getItem('show_vault_on_result');
        if (needsVault === 'true') {
            localStorage.removeItem('show_vault_on_result');
            setTimeout(() => {
                if (typeof openVaultModal === "function") {
                    openVaultModal(true);
                }
            }, 1000);
        }
        const finalScore = parseInt(localStorage.getItem('qz_score')) || 0;
        const totalQs = parseInt(localStorage.getItem('qz_total_qs')) || 0;
        const accuracy = localStorage.getItem('last_acc') || "0%";
        const timeTaken = localStorage.getItem('last_speed') || "0s";
        const modeName = localStorage.getItem('last_mode_name') || "Quiz";
        safeSet('f-score', `${finalScore}/${totalQs}`);
        safeSet('f-acc', accuracy);
        safeSet('f-speed-res', timeTaken);
        safeSet('res-category-name', modeName.toUpperCase());
        setTimeout(() => {
            const accValue = parseInt(accuracy) || 0;
            const circle = document.getElementById('score-circle');
            const logicBar = document.getElementById('logic-bar');
            if (circle) circle.style.strokeDashoffset = 264 - (264 * accValue) / 100;
            if (logicBar) logicBar.style.width = accuracy;
        }, 300);
        return;
    }
    if (isIndex) {
        console.log("Home Page: Initializing");
        initDailyMissions();
        loadLeaderboard(true);
        checkInstallAvailability();
        releaseWakeLock();
        
        if (params.get('finished') !== 'true') {
            sessionStorage.setItem('is_initial_quiz', 'true');
            const randomCat = ALL_CATEGORIES[Math.floor(Math.random() * ALL_CATEGORIES.length)];
            startMode(randomCat.id);
            return;
        }
        return;
    }
    if (isApp) {
        const currentMode = params.get('mode');
        const screens = [
            'quiz-ui', 'spin-screen', 'shop-screen', 'diamond-screen',
            'category-screen', 'profile-screen', 'referral-screen',
            'achievements-screen', 'review-screen', 'withdrawal-history-screen',
            'how-to-play-screen'
        ];

        screens.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.classList.add('hidden');
        });

        if (currentMode === 'categories') {
            const screen = document.getElementById('category-screen');
            window.trackGA('screen_view', { screen_name: 'categories', page_title: 'Quiz Categories' });

            if (screen) { screen.classList.remove('hidden'); renderAllCategories(); }
        } else if (currentMode === 'profile') {
            const screen = document.getElementById('profile-screen');
            window.trackGA('screen_view', { screen_name: 'profile', page_title: 'User Profile' });
            if (screen) { screen.classList.remove('hidden'); loadProfileData(); }
        } else if (currentMode === 'spin') {
            const screen = document.getElementById('spin-screen');
            window.trackGA('screen_view', { screen_name: 'spin', page_title: 'Spin Screen' });
            if (screen) { screen.classList.remove('hidden'); checkSpinAvailability(); }
        } else if (currentMode === 'points') {
            document.getElementById('diamond-screen')?.classList.remove('hidden');
            window.trackGA('screen_view', { screen_name: 'point', page_title: 'point Screen' });
        } else if (currentMode === 'shop') {
            const screen = document.getElementById('shop-screen');
            window.trackGA('screen_view', { screen_name: 'shop', page_title: 'shop Screen' });
            if (screen) { screen.classList.remove('hidden'); initShop(); }
        } else if (currentMode === 'withdrawals') {
            const screen = document.getElementById('withdrawal-history-screen');
            window.trackGA('screen_view', { screen_name: 'withdrawals', page_title: 'withdrawals Screen' });
            if (screen) { screen.classList.remove('hidden'); loadWithdrawalHistory(); }
        } else if (currentMode === 'referral') {
            document.getElementById('referral-screen')?.classList.remove('hidden');
            window.trackGA('screen_view', { screen_name: 'referral', page_title: 'referral Screen' });
            initReferral();
        } else if (currentMode === 'achievements') {
            const screen = document.getElementById('achievements-screen');
            window.trackGA('screen_view', { screen_name: 'achievements', page_title: 'achievements Screen' });
            if (screen) { screen.classList.remove('hidden'); renderAchievements(); }
        } else if (currentMode === 'Howtoplay') {
            document.getElementById('how-to-play-screen')?.classList.remove('hidden');
        } else if (currentMode === 'review') {
            const screen = document.getElementById('review-screen');
            if (screen) { screen.classList.remove('hidden'); renderReviewPage(); }
        } else if (currentMode) {
            requestWakeLock();
            const quizUI = document.getElementById('quiz-ui');
            window.trackGA('screen_view', { screen_name: 'quiz', page_title: 'quiz Screen' });
            if (quizUI) {
                quizUI.classList.remove('hidden');
                startTime = Date.now();
                localStorage.setItem('qz_start_time', startTime);
                loadQuiz();
            }
        }
    }
    if (window.googletag && typeof googletag.cmd !== 'undefined') {
        googletag.cmd.push(() => {
            if (typeof anchorSlot !== 'undefined') googletag.display(anchorSlot);
        });
    }
}







document.addEventListener('visibilitychange', async () => {
    if (wakeLock !== null && document.visibilityState === 'visible') {
        await requestWakeLock();
    }
});

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    checkInstallAvailability();
});
const pNameInput = document.getElementById('p-name-input');
if (pNameInput) {
    pNameInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            toggleNameEdit();
        }
    });
}
function renderPaginationControls() {
    const paginationContainer = document.getElementById('pagination-controls');
    if (!paginationContainer) return;

    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    if (totalPages <= 1) {
        paginationContainer.innerHTML = '';
        return;
    }

    paginationContainer.innerHTML = `
        <div class="flex justify-center items-center gap-4 mt-8 mb-4">
            <button onclick="changePage(-1)" ${currentPage === 1 ? 'disabled' : ''} 
                class="px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-[10px] font-black uppercase tracking-widest disabled:opacity-30 transition-all active:scale-90">
                <i class="fa-solid fa-chevron-left mr-2"></i> Prev
            </button>
            
            <span class="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Page <span class="text-blue-500">${currentPage}</span> of ${totalPages}
            </span>

            <button onclick="changePage(1)" ${currentPage === totalPages ? 'disabled' : ''} 
                class="px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-[10px] font-black uppercase tracking-widest disabled:opacity-30 transition-all active:scale-90">
                Next <i class="fa-solid fa-chevron-right ml-2"></i>
            </button>
        </div>
    `;
}



function triggerImageUpload() {
    const input = document.getElementById('p-image-input');
    if (input) input.click();
}


function checkSpinAvailability() {
    const today = new Date().toDateString();
    const lastSpinDate = localStorage.getItem('last_spin_date');
    let spinCount = parseInt(localStorage.getItem('daily_spin_count')) || 0;
    if (lastSpinDate !== today) {
        spinCount = 0;
        localStorage.setItem('daily_spin_count', 0);
        localStorage.setItem('last_spin_date', today);
    }
    const btn = document.getElementById('spin-btn');
    const msg = document.getElementById('spin-msg');
    const spinsLeft = 10 - spinCount;
    if (spinCount >= 10) {
        btn.disabled = true;
        btn.classList.add('opacity-40', 'grayscale');
        msg.innerText = "All 10 Spins Used Today! 🎁";
        return true;
    } else {
        btn.disabled = false;
        btn.classList.remove('opacity-40', 'grayscale', 'hidden');
        msg.innerText = `You have ${spinsLeft}/10 Free Spins Left Today!`;
        return false;
    }
}


function runSpin() {
    if (spinning) return;
    let spinCount = parseInt(localStorage.getItem('daily_spin_count')) || 0;
    if (spinCount >= 10) {
        alert("Daily limit reached!");
        return;
    }
    spinning = true;
    const wheel = document.getElementById('wheel');
    const btn = document.getElementById('spin-btn');
    const winBox = document.getElementById('win-box');
    const winAmount = document.getElementById('win-amount');
    const extraDeg = Math.floor(Math.random() * 360);
    const totalDeg = 1800 + extraDeg;
    wheel.style.transition = "transform 5s cubic-bezier(0.15, 0, 0.15, 1)";
    wheel.style.transform = `rotate(${totalDeg}deg)`;
    btn.classList.add('hidden');
    setTimeout(() => {
        spinning = false;
        const actualDeg = extraDeg % 360;
        let prize = 0;
        if (actualDeg >= 0 && actualDeg < 60) prize = 250;
        else if (actualDeg >= 60 && actualDeg < 120) prize = 10;
        else if (actualDeg >= 120 && actualDeg < 180) prize = 100;
        else if (actualDeg >= 180 && actualDeg < 240) prize = 20;
        else if (actualDeg >= 240 && actualDeg < 300) prize = 500;
        else prize = 50;
        let wallet = parseInt(localStorage.getItem('total_wallet')) || 0;
        wallet += prize;
        localStorage.setItem('total_wallet', wallet);
        spinCount++;
        localStorage.setItem('daily_spin_count', spinCount);
        localStorage.setItem('last_spin_date', new Date().toDateString());
        saveToServer();
        winAmount.innerText = `${prize} COINS!`;
        window.trackGA('lucky_spin_win', { 'prize_amount': prize, 'spin_no': spinCount });
        winBox.classList.remove('hidden');
        updateDashboard();
    }, 5500);
}


function collectSpin() {
    document.getElementById('win-box').classList.add('hidden');
    const wheel = document.getElementById('wheel');
    const spinBtn = document.getElementById('spin-btn');
    wheel.style.transition = "none";
    wheel.style.transform = "rotate(0deg)";
    let isFinished = checkSpinAvailability();
    if (isFinished) {
        setTimeout(() => {
            safeNav('/');
        }, 1000);
    } else {
        spinBtn.classList.remove('hidden');
    }
}

function getPlayerStats(xp) {
    const level = Math.floor(xp / 100) + 1;
    const progress = xp % 100;
    let title = "Novice";
    let colorClass = "text-gray-400";
    if (level >= 50) { title = "IQ God"; colorClass = "text-red-500 font-black italic"; }
    else if (level >= 30) { title = "Grandmaster"; colorClass = "text-purple-500 font-black"; }
    else if (level >= 15) { title = "Master"; colorClass = "text-blue-500 font-black"; }
    else if (level >= 5) { title = "Scholar"; colorClass = "text-green-500 font-black"; }
    return { level, title, progress, colorClass };
}

document.getElementById('p-bio-input')?.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        toggleBioEdit();
    }
});

function updateWallet(newBalance) {
    localStorage.setItem('total_wallet', newBalance);
    document.getElementById('wallet-balance').innerText = newBalance;
}

function renderReviewPage() {
    const responses = JSON.parse(localStorage.getItem('qz_responses')) || [];
    const container = document.getElementById('review-list');
    if (!container) { console.error("Error: review-list container not found!"); return; }
    console.log("Review Data Found:", responses.length);
    if (responses.length === 0) {
        container.innerHTML = `
                    <div class="text-center py-20">
                        <i class="fa-solid fa-folder-open text-4xl text-gray-200 mb-4"></i>
                        <p class="text-gray-400 font-bold">No review data found!</p>
                        <button onclick="location.href='?'" class="mt-4 text-blue-500 font-black uppercase text-[10px]">Go Home</button>
                    </div>`;
        return;
    }
    container.innerHTML = '';
    responses.forEach((res, i) => {
        const correctText = res.options[res.correctIdx];
        container.innerHTML += `
                    <div class="bg-white dark:bg-gray-900 p-5 rounded-[2rem] border ${res.isCorrect ? 'border-green-100 dark:border-green-900/30' : 'border-red-100 dark:border-red-900/30'} shadow-sm animate-in slide-in-from-bottom duration-300" style="animation-delay: ${i * 0.1}s">
                        <div class="flex items-center gap-2 mb-3">
                            <span class="w-6 h-6 rounded-full ${res.isCorrect ? 'bg-green-500' : 'bg-red-500'} text-white text-[10px] flex items-center justify-center font-black flex-shrink-0">
                                ${i + 1}
                        </span>
                        <h4 class="text-[13px] font-bold dark:text-gray-200 leading-tight">${res.question}</h4>
                    </div>
    
                    <div class="space-y-2 mb-3">
                        <div class="p-3 rounded-xl text-xs font-bold ${res.isCorrect ? 'bg-green-50 dark:bg-green-900/20 text-green-600' : 'bg-red-50 dark:bg-red-900/20 text-red-600 border border-red-100 dark:border-red-900/40'}">
                            <span class="text-[9px] uppercase opacity-60 block">Your Answer</span>
                            ${res.selectedText} ${res.isCorrect ? '✓' : '✗'}
                        </div>
                        
                        ${!res.isCorrect ? `
                        <div class="p-3 rounded-xl text-xs font-bold bg-blue-50 dark:bg-blue-900/20 text-blue-600">
                            <span class="text-[9px] uppercase opacity-60 block">Correct Answer</span>
                            ${correctText}
                        </div>
                        ` : ''}
                    </div>
    
                    <div class="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800">
                        <p class="text-[10px] leading-relaxed text-gray-500 dark:text-gray-400 italic">
                            <i class="fa-solid fa-lightbulb text-yellow-500 mr-1"></i> ${res.explanation}
                        </p>
                    </div>
                </div>
            `;
    });
}

function closeReview() {
    location.href = '?';
}

async function loadLeaderboard(isMini, filterType = 'global') {
    try {
        const country = localStorage.getItem('user_country') || 'Global';
        const res = await fetch(`${API_URL}?action=get_leaderboard&filter=${filterType}&country=${encodeURIComponent(country)}`);
        const sorted = await res.json();
        const container = isMini ? document.getElementById('mini-leaderboard') : document.getElementById('leaderboard-list');
        if (container) {
            if (sorted && sorted.length > 0) {
                container.innerHTML = sorted.map((u, i) => `
                                    <div class="rank-item ${i === 0 && !isMini ? 'rank-1 shadow-lg' : ''}">
                                        <div class="flex items-center gap-3">
                                            <span class="font-black opacity-40 text-xs">#${i + 1}</span>
                                            <span class="font-bold text-sm truncate w-32 uppercase">${u.name} ${u.country === 'India' ? '🇮🇳' : ''}</span>
                                        </div>
                                        <span class="font-black text-xs">${u.score} 💰</span>
                                    </div>
                                `).slice(0, isMini ? 3 : 10).join('');
            } else {
                container.innerHTML = `<p class="text-center text-gray-400 py-4 text-xs">No users on leaderboard yet!</p>`;
            }
        }
    } catch (e) {
        console.error("Leaderboard Load Error:", e);
    }
    if (!isMini) {
        document.getElementById('btn-lb-global').className = filterType === 'global' ? 'text-[9px] font-black px-3 py-1 rounded-lg bg-blue-600 text-white uppercase' : 'text-[9px] font-black px-3 py-1 rounded-lg bg-gray-200 dark:bg-gray-800 dark:text-white uppercase';
        document.getElementById('btn-lb-local').className = filterType === 'local' ? 'text-[9px] font-black px-3 py-1 rounded-lg bg-blue-600 text-white uppercase' : 'text-[9px] font-black px-3 py-1 rounded-lg bg-gray-200 dark:bg-gray-800 dark:text-white uppercase';
        document.getElementById('btn-lb-local').innerText = localStorage.getItem('user_country') || 'National';
    }
}

async function findMatch() {
    await showDialog("Info", "PvP Battle Arena is currently disabled.");
}
function simulateBotProgress() {
    botTimer = setInterval(() => {
        if (botIndex < 5) {
            botIndex++;
            if (Math.random() < 0.7) botScore++;
            const oppDisplay = document.getElementById('opp-score-display');
            if (oppDisplay) oppDisplay.innerText = botScore;
        } else {
            clearInterval(botTimer);
        }
    }, Math.floor(Math.random() * 3000) + 4000);
}
function sendEmoji(emoji) {
    if (!roomId) return;
    const upd = {};
    upd['chat'] = {
        emoji: emoji,
        sender: myRole,
        time: Date.now()
    };
    window.dbUtils.update(window.dbUtils.ref(window.db, `pvp_rooms/${roomId}`), upd);
    triggerBuzz(emoji);

}
function listenForChat() {
    const sessionStartTime = Date.now();
    window.dbUtils.onValue(window.dbUtils.ref(window.db, `pvp_rooms/${roomId}/chat`), snap => {
        if (snap.exists()) {
            const data = snap.val();
            if (data.sender !== myRole && data.time > sessionStartTime) {
                triggerBuzz(data.emoji);
            }
        }
    });
}
function sideScroll(elementId, direction) {
    const container = document.getElementById(elementId);
    const scrollAmount = 150;
    if (direction === 'left') {
        container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    } else {
        container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
}

function triggerBuzz(emoji) {
    const popup = document.getElementById('emoji-popup');
    const display = document.getElementById('emoji-display');
    const body = document.getElementById('main-body');
    display.innerText = emoji;
    const soundClone = buzzAudioSource.cloneNode();
    soundClone.volume = 0.8;
    soundClone.play().catch(e => console.log("Sound error"));
    popup.classList.remove('scale-0');
    popup.classList.add('scale-100');
    body.classList.add('buzzing');
    setTimeout(() => {
        popup.classList.remove('scale-100');
        popup.classList.add('scale-0');
        body.classList.remove('buzzing');
    }, 1000);
}


async function startMode(m) {
    if (isRedirecting) return;
    lockUI();
    localStorage.removeItem('qz_responses');
    localStorage.removeItem('current_qs');
    localStorage.setItem('qz_score', '0');
    localStorage.setItem('qz_total_qs', '0');
    score = 0;
    try {
        const res = await fetch(`${API_URL}?action=get_questions&category=${m}`);
        const data = await res.json();
        if (data && data.length > 0) {
            localStorage.setItem('current_qs', JSON.stringify(data));
            triggerAdAndNavigate(`app.html?mode=${m}&q=0`);
        } else {
            isRedirecting = false;
            document.body.style.pointerEvents = 'auto';
            document.body.style.opacity = '1';
            unlockUI();
            await showDialog("Under Maintenance", "No questions found for this topic yet. Please try another one.");
        }
    } catch (e) {
        unlockUI();
        isRedirecting = false;
        document.body.style.pointerEvents = 'auto';
        document.body.style.opacity = '1';
        console.error("Error fetching questions");
        await showDialog("Error", "Could not load quiz. Check your internet connection.");
    }
}
function getLocalQuestions(cat) {
    if (cat === 'all') return questionsPool;
    let filtered = questionsPool.filter(q => q.category === cat);
    if (filtered.length === 0) filtered = questionsPool.filter(q => q.category === 'daily');
    if (filtered.length === 0) filtered = questionsPool;
    return filtered;
}
async function loadQuiz() {
    const isBot = params.get('bot') === 'true';
    const isWait = params.get('wait') === 'true';
    if (mode === 'pvp') {
        document.getElementById('opp-score-box').classList.remove('hidden');
        if (isBot) {
            isBotMatch = true;
            simulateBotProgress();

            sessionData = JSON.parse(localStorage.getItem('current_qs')) || getLocalQuestions('pvp').sort(() => 0.5 - Math.random()).slice(0, 5);
            renderQuestion();
            return;
        }
        if (isWait && roomId) {
            document.getElementById('q-title').innerText = "📡 Waiting for Opponent...";
            document.getElementById('options-container').innerHTML = '<div class="text-center animate-pulse mt-10 text-gray-500 font-bold">Searching for player...<br>Please wait...</div>';
            const roomRef = window.dbUtils.ref(window.db, `pvp_rooms/${roomId}`);

            const waitTimer = setTimeout(() => {
                window.dbUtils.remove(roomRef);
                window.location.href = `?mode=pvp&role=p1&q=0&bot=true`;
            }, 1500);
            window.dbUtils.onValue(roomRef, (snap) => {
                const data = snap.val();
                if (data && data.status === 'playing') {
                    clearTimeout(waitTimer);
                    window.location.href = `?mode=pvp&room=${roomId}&role=p1&q=0`;
                }
            });
            return;
        }
        document.getElementById('q-title').innerText = "⚔️ Connecting to Battle...";
        const roomRef = window.dbUtils.ref(window.db, `pvp_rooms/${roomId}`);
        const connectionTimeout = setTimeout(() => {
            console.log("Room Connection Timeout");
            window.location.href = '?';
        }, 1000);
        window.dbUtils.onValue(roomRef, (snap) => {
            if (snap.exists()) {
                clearTimeout(connectionTimeout);
                const data = snap.val();
                if (data.questions && sessionData.length === 0) {
                    sessionData = data.questions;
                    renderQuestion();
                    const opp = myRole === 'p1' ? data.p2 : data.p1;
                    if (opp) document.getElementById('opp-score-display').innerText = opp.score || 0;
                } else {
                    const opp = myRole === 'p1' ? snap.val().p2 : snap.val().p1;
                    if (opp) document.getElementById('opp-score-display').innerText = opp.score || 0;
                }
            }
        });
    } else {
        const savedQs = localStorage.getItem('current_qs');
        if (savedQs && savedQs !== "[]") {
            sessionData = JSON.parse(savedQs);
        } else {
            try {

                let fetchCat = mode || 'gk';
                if (mode === 'daily' || mode === 'brain' || mode === 'fifa_wc' || mode === 'luxury' || mode === 'premier_league') {
                    fetchCat = 'all';
                }

                const res = await fetch(`${API_URL}?action=get_questions&category=${fetchCat}`);
                const data = await res.json();
                if (data.length > 0) {
                    sessionData = data;
                } else {
                    sessionData = getLocalQuestions(fetchCat).sort(() => 0.5 - Math.random()).slice(0, 5);
                }
            } catch (e) {
                sessionData = getLocalQuestions(fetchCat).sort(() => 0.5 - Math.random()).slice(0, 5);
            }
        }
        renderQuestion();
    }
}
function renderQuestion() {
    if (sessionStorage.getItem('is_initial_quiz') === 'true') {
        if (sessionData && sessionData.length > 3) {
            sessionData = sessionData.slice(0, 3);
        }
    }
    if (qIdx >= sessionData.length) {
        document.getElementById('quiz-ui').classList.add('hidden');
        finalizeAndShowResult();
        return;
    }
    document.getElementById('quiz-ui').classList.remove('quiz-pushed');
    const b50 = document.getElementById('btn-5050');
    const bSkip = document.getElementById('btn-skip');
    if (b50) { b50.disabled = false; b50.classList.remove('opacity-50'); }
    if (bSkip) { bSkip.disabled = false; bSkip.classList.remove('opacity-50'); }
    document.getElementById('q-counter').innerText = (qIdx + 1) + "/" + sessionData.length;
    document.getElementById('progress-bar').style.width = `${((qIdx + 1) / sessionData.length) * 100}%`;
    const data = sessionData[qIdx];
    let mappedOptions = data.opt
        .map((text, index) => {
            return { text: text, isCorrect: index === data.ans };
        })
        .filter(optObj => optObj.text !== null && optObj.text !== undefined && String(optObj.text).trim() !== "" && String(optObj.text).trim() !== "null" && String(optObj.text).trim() !== "undefined");
    mappedOptions.sort(() => Math.random() - 0.5);
    document.getElementById('q-title').innerText = data.q;
    const container = document.getElementById('options-container');
    container.innerHTML = '';
    mappedOptions.forEach((optObj) => {
        const btn = document.createElement('button');
        btn.className = "option-btn";
        btn.innerText = optObj.text;
        btn.onclick = () => {
            document.querySelectorAll('.option-btn').forEach(b => b.disabled = true);
            document.getElementById('quiz-ui').classList.add('quiz-pushed');

            const isCorrect = optObj.isCorrect;
            const statusIcon = document.getElementById('status-icon');

            if (isCorrect) {
                btn.classList.add('correct');
                score++;
            } else {
                btn.classList.add('wrong');
                document.querySelectorAll('.option-btn').forEach(b => {
                    if (b.innerText === data.opt[data.ans]) b.classList.add('correct');
                });
            }
            let responses = JSON.parse(localStorage.getItem('qz_responses')) || [];
            responses[qIdx] = {
                question: data.q,
                options: data.opt,
                correctIdx: data.ans,
                selectedText: optObj.text,
                isCorrect: isCorrect,
                explanation: data.exp
            };
            localStorage.setItem('qz_responses', JSON.stringify(responses));
            localStorage.setItem('qz_score', score);
            if (mode === 'pvp' && roomId) {
                const upd = {};
                upd[`${myRole}/score`] = score;
                upd[`${myRole}/idx`] = qIdx + 1;
                window.dbUtils.update(window.dbUtils.ref(window.db, `pvp_rooms/${roomId}`), upd);
            }
            const isLastQuestion = (qIdx + 1 >= sessionData.length);
            if (isLastQuestion) {
                setTimeout(() => {
                    document.getElementById('quiz-ui').classList.add('hidden');
                    finalizeAndShowResult();
                }, 500);
            } else {
                setTimeout(() => {
                    qIdx++;
                    renderQuestion();
                }, 500);
            }
        };
        container.appendChild(btn);
    });
}
async function usePowerUp(type) {
    let currentBalance = parseInt(localStorage.getItem('total_wallet')) || 0;
    if (type === '5050') {
        if (currentBalance < 100) {
            await showDialog("Low Balance", "Not enough coins! 💰");
            return;
        }
        currentBalance -= 100;
        updateWallet(currentBalance);
        document.getElementById('btn-5050').disabled = true;
        document.getElementById('btn-5050').classList.add('opacity-50');
        const buttons = Array.from(document.querySelectorAll('.option-btn'));
        const correctText = sessionData[qIdx].opt[sessionData[qIdx].ans];
        let hiddenCount = 0;
        buttons.forEach(btn => {
            if (btn.innerText !== correctText && hiddenCount < 2) {
                btn.style.visibility = 'hidden';
                hiddenCount++;
            }
        });
        saveToServer();
    }
    else if (type === 'skip') {
        if (currentBalance < 200) {
            await showDialog("Low Balance", "Not enough coins! 💰");
            return;
        }
        currentBalance -= 200;
        updateWallet(currentBalance);
        score++;
        localStorage.setItem('qz_score', score);
        if (mode === 'pvp') {
            const upd = {}; upd[`${myRole}/score`] = score; upd[`${myRole}/idx`] = qIdx + 1;
            window.dbUtils.update(window.dbUtils.ref(window.db, `pvp_rooms/${roomId}`), upd);
        }
        saveToServer();
        handleNextClick();
    }
}

function handleNextClick() {
    let nextUrl = `app.html?mode=${mode}&q=${qIdx + 1}`;
    if (mode === 'pvp') {
        nextUrl += `&room=${roomId || ''}&role=${myRole || ''}`;
    }
    window.location.href = nextUrl;
}


async function finalizeAndShowResult() {
    if (isRedirecting) return;
    lockUI();
    try {
        const endTime = Date.now();
        const timeTaken = Math.floor((endTime - startTime) / 1000);
        const totalQs = sessionData.length;
        const accuracy = Math.round((score / totalQs) * 100);
        if (score >= 4) {
            let currentCards = parseInt(localStorage.getItem('scratch_cards')) || 0;
            localStorage.setItem('scratch_cards', (currentCards + 1).toString());
            localStorage.setItem('show_vault_on_result', 'true');
            console.log("Reward Earned: 1 Card + Vault Access");
        }
        updateMissionProgress('play');
        if (score === totalQs && totalQs >= 5) {
            updateMissionProgress('perfect');
        }
        let userId = localStorage.getItem('user_id');
        let finalName = localStorage.getItem('user_name') || userId;
        if (mode && mode !== 'null') {
            let stats = JSON.parse(localStorage.getItem('category_stats')) || {};
            if (!stats[mode]) {
                stats[mode] = { right: 0, wrong: 0, pts: 0, played: 0 };
            }
            stats[mode].right += score;
            stats[mode].wrong += (totalQs - score);
            stats[mode].pts += (score * 10);
            stats[mode].played += 1;
            localStorage.setItem('category_stats', JSON.stringify(stats));
        }
        const gainedXP = score * 10;
        let currentXP = parseInt(localStorage.getItem('user_xp')) || 0;
        localStorage.setItem('user_xp', currentXP + gainedXP);
        let earned = score * 10;
        const isBot = params.get('bot') === 'true';
        if (mode === 'pvp') {
            let opponentScore = 0;
            if (isBot) {
                opponentScore = botScore;
            }
            if (score > opponentScore) {
                earned += 500;
                updateMissionProgress('win');
                updateAchievementStats('pvp_wins', 1);
            }
        }

        let totalWallet = parseInt(localStorage.getItem('total_wallet')) || 0;
        totalWallet += earned;
        localStorage.setItem('total_wallet', totalWallet);
        localStorage.setItem('qz_score', score.toString());
        localStorage.setItem('qz_total_qs', totalQs.toString());
        localStorage.setItem('last_acc', accuracy + "%");
        localStorage.setItem('last_speed', timeTaken + "s");
        localStorage.setItem('last_mode_name', mode || 'General Quiz');
        updateAchievementStats('quizzes_played', 1);
        updateAchievementStats('total_coins_earned', earned);
        await saveToServer();
        window.trackGA('quiz_complete', { 'score': score, 'accuracy': accuracy, 'category': mode });
        if (botTimer) clearInterval(botTimer);
        releaseWakeLock();
        
        if (sessionStorage.getItem('is_initial_quiz') === 'true') {
            sessionStorage.removeItem('is_initial_quiz');
            window.location.href = "index.html?finished=true";
        } else {
            window.location.href = "result.html";
        }
    } catch (error) {
        console.error("Error in finalizeAndShowResult:", error);
        if (sessionStorage.getItem('is_initial_quiz') === 'true') {
            sessionStorage.removeItem('is_initial_quiz');
            window.location.href = "index.html?finished=true";
        } else {
            window.location.href = "result.html";
        }
    }
}

function openBonusModal() {
    const lastLogin = localStorage.getItem('last_login_date');
    const today = new Date().toDateString();
    let streak = parseInt(localStorage.getItem('login_streak')) || 0;
    if (lastLogin !== today) {
        const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
        streak = (lastLogin === yesterday.toDateString()) ? (streak % 7) + 1 : 1;
        localStorage.setItem('login_streak', streak);
    }
    document.getElementById('streak-num').innerText = streak;
    renderBonusGrid(streak, lastLogin === today);
    document.getElementById('login-bonus-modal').classList.remove('hidden');
    const btn = document.getElementById('claim-bonus-btn');
    if (lastLogin === today) { btn.innerText = "Already Claimed"; btn.disabled = true; btn.classList.add('opacity-50'); }
    else { btn.innerText = "Claim Now 💰"; btn.disabled = false; btn.classList.remove('opacity-50'); }
    checkTreasureChest();
}
async function claimDailyBonus() {
    const streak = parseInt(localStorage.getItem('login_streak'));
    let wallet = parseInt(localStorage.getItem('total_wallet')) || 0;
    let prize = DAILY_REWARDS[streak - 1];
    wallet += prize;
    window.trackGA('bonus_claim', { 'day': streak });
    localStorage.setItem('total_wallet', wallet);
    localStorage.setItem('last_login_date', new Date().toDateString());
    saveToServer();
    updateDashboard(); closeBonusModal();
    await showDialog("Reward Claimed", `Success! ${prize} Coins added to your wallet. 💰`);
    // Streak reminders removed
}
function initDailyMissions() {
    const today = new Date().toDateString();
    let data = JSON.parse(localStorage.getItem('daily_missions'));
    if (!data || data.date !== today) {
        data = {
            date: today,
            m1_played: 0,
            m2_wins: 0,
            m3_perfect: 0,
            claimed: []
        };
        localStorage.setItem('daily_missions', JSON.stringify(data));
    }
    const missionDateEl = document.getElementById('mission-date');
    if (missionDateEl) {
        missionDateEl.innerText = today;
    }

    renderMissions();
}

function updateMissionProgress(taskKey) {
    let data = JSON.parse(localStorage.getItem('daily_missions'));
    if (!data) return;
    if (taskKey === 'play') data.m1_played++;
    if (taskKey === 'win') data.m2_wins++;
    if (taskKey === 'perfect') data.m3_perfect = 1;
    localStorage.setItem('daily_missions', JSON.stringify(data));
    renderMissions();
}

function updateMissionUI(id, current, target, type) {
    if (isRedirecting) return;
    const data = JSON.parse(localStorage.getItem('daily_missions'));
    const progText = document.getElementById(`m${id}-progress`);
    const claimBtn = document.getElementById(`m${id}-claim`);
    const card = document.getElementById(`m${id}-card`);
    if (!progText || !card) return;
    if (data.claimed.includes(id)) {
        progText.innerText = "✅ DONE";
        progText.className = "text-[8px] font-black text-green-500";
        if (claimBtn) claimBtn.classList.add('hidden');
        card.classList.add('opacity-50', 'grayscale');
        card.onclick = null;
    } else if (current >= target) {
        progText.innerText = "READY!";
        progText.className = "text-[9px] font-black text-blue-500 animate-pulse";
        if (claimBtn) claimBtn.classList.remove('hidden');
        card.classList.add('border-blue-500/50', 'bg-blue-50/50', 'dark:bg-blue-900/20');
        card.classList.remove('bg-gray-50/50', 'dark:bg-gray-800/30');
    } else {
        progText.innerText = `${current}/${target}`;
        if (claimBtn) claimBtn.classList.add('hidden');
    }
}

async function claimMission(id) {
    if (isRedirecting) return;
    let data = JSON.parse(localStorage.getItem('daily_missions'));
    if (!data) return;
    let current = 0; let target = 0;
    let rewardName = ""; let missionName = "";
    if (id === 1) { current = data.m1_played; target = 5; rewardName = "50 Coins 💰"; missionName = "Play 5 Quizzes"; }
    if (id === 2) { current = data.m2_wins; target = 3; rewardName = "100 Coins 💰"; missionName = "Win 3 PvP Battles"; }
    if (id === 3) { current = data.m3_perfect; target = 1; rewardName = "500 Rewards points"; missionName = "Score Perfect 5/5"; }

    if (current < target) {
        let playNow = await showDialog("Mission Pending", `Mission: ${missionName}\nProgress: ${current}/${target}\n\nPlay now to finish it?`, true);
        if (playNow) {
            if (id === 2) findMatch();
            else safeNav('app.html?mode=categories');
        }
        return;
    }

    if (data.claimed.includes(id)) {
        await showDialog("Already Claimed", "Reward already collected! ✅");
        return;
    }
    let wallet = parseInt(localStorage.getItem('total_wallet')) || 0;
    if (id === 1) wallet += 50;
    if (id === 2) wallet += 100;
    if (id === 3) {
        let dia = parseInt(localStorage.getItem('total_diamonds')) || 0;
        localStorage.setItem('total_diamonds', dia + 500);
    }
    data.claimed.push(id);
    localStorage.setItem('total_wallet', wallet);
    localStorage.setItem('daily_missions', JSON.stringify(data));
    saveToServer(); updateDashboard(); renderMissions();
    await showDialog("Success", `🎉 You claimed ${rewardName}`);
}
function renderAchievements() {
    const stats = JSON.parse(localStorage.getItem('ach_stats')) || { quizzes_played: 0, pvp_wins: 0, total_coins_earned: 0 };
    const claimed = JSON.parse(localStorage.getItem('claimed_achievements')) || [];
    const container = document.getElementById('achievements-list');
    container.innerHTML = '';
    ACHIEVEMENT_CONFIG.forEach(ach => {
        const progress = Math.min(100, (stats[ach.type] / ach.target) * 100);
        const isClaimed = claimed.includes(ach.id);
        const canClaim = !isClaimed && stats[ach.type] >= ach.target;
        container.innerHTML += `
                                <div class="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                                    <div class="flex justify-between items-start mb-2">
                                        <div>
                                            <h4 class="font-black text-sm dark:text-white uppercase">${ach.name}</h4>
                                            <p class="text-[10px] text-gray-400 font-bold">${ach.desc}</p>
                                        </div>
                                        <span class="text-xs font-black text-blue-600">${ach.reward} 💰</span>
                                    </div>
                                    <div class="w-full h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden mb-3">
                                        <div class="h-full bg-blue-500 transition-all" style="width: ${progress}%"></div>
                                    </div>
                                    <button onclick="claimAchievement('${ach.id}', ${ach.reward})" 
                                        class="w-full py-2 rounded-xl text-[10px] font-black uppercase transition-all
                                        ${canClaim ? 'bg-blue-600 text-white animate-bounce' : isClaimed ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}"
                                        ${!canClaim ? 'disabled' : ''}>
                                        ${isClaimed ? '✅ Claimed' : canClaim ? 'Claim Reward' : `${stats[ach.type]}/${ach.target} Completed`}
                                    </button>
                                </div>
                            `;
    });

}
async function claimAchievement(id, reward) {
    let claimed = JSON.parse(localStorage.getItem('claimed_achievements')) || [];
    if (claimed.includes(id)) return;
    claimed.push(id);
    localStorage.setItem('claimed_achievements', JSON.stringify(claimed));
    let wallet = parseInt(localStorage.getItem('total_wallet')) || 0;
    wallet += reward;
    localStorage.setItem('total_wallet', wallet);
    saveToServer();
    await showDialog("Achievement Unlocked", `🎉 Success! You claimed ${reward} coins!`);
    updateDashboard();
    renderAchievements();
}
// function runSpin() {
//     if (spinning) return;
//     spinning = true;
//     const wheel = document.getElementById('wheel');
//     const btn = document.getElementById('spin-btn');
//     const winBox = document.getElementById('win-box');
//     const winAmount = document.getElementById('win-amount');
//     const extraDeg = Math.floor(Math.random() * 360);
//     const totalDeg = 1800 + extraDeg;
//     wheel.style.transform = `rotate(${totalDeg}deg)`;
//     btn.classList.add('hidden');
//     setTimeout(() => {
//         spinning = false;
//         const actualDeg = extraDeg % 360;
//         let prize = 0;
//         if (actualDeg >= 0 && actualDeg < 60) prize = 250;
//         else if (actualDeg >= 60 && actualDeg < 120) prize = 10;
//         else if (actualDeg >= 120 && actualDeg < 180) prize = 100;
//         else if (actualDeg >= 180 && actualDeg < 240) prize = 20;
//         else if (actualDeg >= 240 && actualDeg < 300) prize = 500;
//         else prize = 50;
//         let wallet = parseInt(localStorage.getItem('total_wallet')) || 0;
//         wallet += prize;
//         localStorage.setItem('total_wallet', wallet);
//         localStorage.setItem('last_spin_date', new Date().toDateString());
//         saveToServer(); 
//         winAmount.innerText = `${prize} COINS!`;
//         window.trackGA('lucky_spin_win', { 'prize_amount': prize });
//         winBox.classList.remove('hidden');
//         updateDashboard();
//     }, 5500);
// }

// function runSpin() {
//     if (spinning) return;

//     // સ્પિન કરતા પહેલા ચેક કરો કે 10 પૂરા તો નથી થઈ ગયા ને?
//     let spinCount = parseInt(localStorage.getItem('daily_spin_count')) || 0;
//     if (spinCount >= 10) {
//         alert("તમારા આજના 10 સ્પિન પૂરા થઈ ગયા છે!");
//         return;
//     }

//     spinning = true;
//     const wheel = document.getElementById('wheel');
//     const btn = document.getElementById('spin-btn');
//     const winBox = document.getElementById('win-box');
//     const winAmount = document.getElementById('win-amount');
//     const extraDeg = Math.floor(Math.random() * 360);
//     const totalDeg = 1800 + extraDeg;
//     wheel.style.transform = `rotate(${totalDeg}deg)`;
//     btn.classList.add('hidden');

//     setTimeout(() => {
//         spinning = false;
//         const actualDeg = extraDeg % 360;
//         let prize = 0;
//         if (actualDeg >= 0 && actualDeg < 60) prize = 250;
//         else if (actualDeg >= 60 && actualDeg < 120) prize = 10;
//         else if (actualDeg >= 120 && actualDeg < 180) prize = 100;
//         else if (actualDeg >= 180 && actualDeg < 240) prize = 20;
//         else if (actualDeg >= 240 && actualDeg < 300) prize = 500;
//         else prize = 50;

//         let wallet = parseInt(localStorage.getItem('total_wallet')) || 0;
//         wallet += prize;
//         localStorage.setItem('total_wallet', wallet);

//         // --- અહીં કાઉન્ટર અપડેટ થશે ---
//         spinCount++;
//         localStorage.setItem('daily_spin_count', spinCount);
//         localStorage.setItem('last_spin_date', new Date().toDateString());
//         // ----------------------------

//         saveToServer(); 
//         winAmount.innerText = `${prize} COINS!`;
//         window.trackGA('lucky_spin_win', { 'prize_amount': prize, 'spin_number': spinCount });
//         winBox.classList.remove('hidden');
//         updateDashboard();
//         checkSpinAvailability(); // મેસેજ અપડેટ કરવા માટે
//     }, 5500);
// }


function openVaultModal(isBonus = false) {
    if (isRedirecting) return;
    const data = getVaultData();
    const modal = document.getElementById('vault-modal');
    const mainView = document.getElementById('vault-main-view');
    const resultView = document.getElementById('vault-result');
    const container = document.getElementById('vault-chest-container');
    const orb = document.getElementById('main-chest');
    const hint = document.getElementById('vault-hint');
    const cooldown = document.getElementById('vault-cooldown-msg');
    if (!modal || !mainView || !resultView || !orb) {
        console.warn("Vault elements missing on this page!");
        return;
    }

    modal.classList.remove('hidden');
    mainView.classList.remove('hidden');
    resultView.classList.add('hidden');
    orb.classList.remove('animate-decrypt', 'opacity-20', 'grayscale', 'scale-0');

    if (isBonus) {
        if (hint) hint.innerText = "BONUS CORE DETECTED";
        if (hint) hint.className = "absolute -bottom-10 left-1/2 -translate-x-1/2 text-cyan-400 text-[9px] font-black uppercase tracking-widest animate-pulse";
        if (cooldown) cooldown.classList.add('hidden');
        if (container) container.onclick = () => startVaultOpening(true);
    } else {
        if (data.count >= 2) {
            if (hint) hint.classList.add('hidden');
            if (cooldown) cooldown.classList.remove('hidden');
            orb.classList.add('opacity-20', 'grayscale');
            if (container) container.onclick = null;
        } else {
            if (hint) hint.innerText = "Tap to Decrypt";
            if (hint) hint.className = "absolute -bottom-10 left-1/2 -translate-x-1/2 text-white/40 text-[9px] font-black uppercase tracking-widest animate-pulse";
            if (cooldown) cooldown.classList.add('hidden');
            if (container) container.onclick = () => startVaultOpening(false);
        }
    }
    updateVaultUI();
}

function updateVaultUI() {
    const data = getVaultData();
    const limitText = document.getElementById('vault-limit-text');
    if (limitText) limitText.innerText = `${2 - data.count}/2 Left`;
}

function processScratch() {
    let cards = parseInt(localStorage.getItem('scratch_cards')) || 0;
    if (cards <= 0) return;

    const btn = document.getElementById('scratch-btn');
    if (btn) {
        btn.disabled = true;
        btn.innerText = "Revealing...";
    }

    const isDiamond = Math.random() > 0.8;
    const amount = isDiamond ? Math.floor(Math.random() * 50) + 10 : Math.floor(Math.random() * 200) + 20;

    safeSet('scratch-prize-icon', isDiamond ? "💎" : "💰");
    safeSet('scratch-prize-amount', amount);

    const cover = document.getElementById('scratch-cover');
    if (cover) cover.style.opacity = "0";

    localStorage.setItem('scratch_cards', cards - 1);
    if (isDiamond) {
        let dia = parseInt(localStorage.getItem('total_diamonds')) || 0;
        localStorage.setItem('total_diamonds', dia + amount);
    } else {
        let wal = parseInt(localStorage.getItem('total_wallet')) || 0;
        localStorage.setItem('total_wallet', wal + amount);
    }

    saveToServer().then(() => {
        updateDashboard();
        setTimeout(() => safeSet('scratch-count', cards - 1), 500);

        if (btn) {
            btn.innerText = "Claimed!";
            btn.disabled = false;
            btn.onclick = () => {
                closeScratchModal();
            };
        }
    });
}


function closeScratchModal() {
    const modal = document.getElementById('scratch-modal');
    if (modal) modal.classList.add('hidden');
    const btn = document.getElementById('scratch-btn');
    if (btn) {
        btn.innerText = "Tap to Reveal";
        btn.onclick = processScratch;
    }
}

async function claimTreasure() {
    const amount = 500;
    let wallet = parseInt(localStorage.getItem('total_wallet')) || 0;
    localStorage.setItem('total_wallet', wallet + amount);
    localStorage.setItem('last_chest_claimed', new Date().toDateString());
    saveToServer();

    document.getElementById('chest-container').classList.add('hidden');
    updateDashboard();
    await showDialog("MEGA WIN! 🎊", `You found ${amount} Coins in the Treasure Chest!`);
}
function renderMissions() {
    const data = JSON.parse(localStorage.getItem('daily_missions'));
    if (!data) return;
    if (!document.getElementById('m1-progress')) return;
    updateMissionUI(1, data.m1_played, 5, 'quizzes');
    updateMissionUI(2, data.m2_wins, 3, 'wins');
    updateMissionUI(3, data.m3_perfect, 1, 'perfect');
}



function updateAchievementStats(type, amount = 1) {
    let stats = JSON.parse(localStorage.getItem('ach_stats')) || { quizzes_played: 0, pvp_wins: 0, total_coins_earned: 0 };
    stats[type] += amount;
    localStorage.setItem('ach_stats', JSON.stringify(stats));
    checkAchievements(stats);
}

function checkAchievements(stats) {
    let claimed = JSON.parse(localStorage.getItem('claimed_achievements')) || [];
    ACHIEVEMENT_CONFIG.forEach(ach => {
        if (!claimed.includes(ach.id) && stats[ach.type] >= ach.target) {
            console.log("Unlocked: " + ach.name);
        }
    });
}
function renderBonusGrid(streak, isClaimed) {
    const grid = document.getElementById('login-days-grid'); grid.innerHTML = '';
    for (let i = 1; i <= 7; i++) {
        const active = i === streak && !isClaimed;
        const past = i < streak || (i === streak && isClaimed);
        grid.innerHTML += `<div class="p-2 rounded-xl border-2 ${active ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20' : 'border-gray-50 dark:border-gray-800'}">
            <span class="text-[7px] font-black text-gray-400 block uppercase">Day ${i}</span>
            <i class="fa-solid ${past ? 'fa-circle-check text-green-500' : 'fa-coins text-yellow-500'} my-1 text-xs"></i>
            <span class="text-[8px] font-black dark:text-white block">${DAILY_REWARDS[i - 1]}</span>
        </div>`;
    }
}

function closeBonusModal() { document.getElementById('login-bonus-modal').classList.add('hidden'); }
async function openScratchModal() {
    let cards = parseInt(localStorage.getItem('scratch_cards')) || 0;
    if (cards <= 0) {
        await showDialog("No Cards", "You don't have any scratch cards! Win quizzes to earn them. 🏆");
        return;
    }
    document.getElementById('scratch-count').innerText = cards;
    document.getElementById('scratch-cover').style.opacity = "1";
    document.getElementById('scratch-btn').innerText = "Tap to Reveal";
    document.getElementById('scratch-modal').classList.remove('hidden');
}



function checkTreasureChest() {
    const streak = parseInt(localStorage.getItem('login_streak')) || 0;
    const lastChest = localStorage.getItem('last_chest_claimed');
    const today = new Date().toDateString();
    if (streak >= 3 && lastChest !== today) {
        document.getElementById('chest-container').classList.remove('hidden');
    } else {
        document.getElementById('chest-container').classList.add('hidden');
    }
}

function getVaultData() {
    const today = new Date().toDateString();
    let data = JSON.parse(localStorage.getItem('vault_limit_data')) || { date: today, count: 0 };
    if (data.date !== today) { data = { date: today, count: 0 }; localStorage.setItem('vault_limit_data', JSON.stringify(data)); }
    return data;
}

function startVaultOpening(isBonus = false) {
    const orb = document.getElementById('main-chest');
    const ring = document.getElementById('orb-ring');
    orb.classList.add('animate-decrypt');
    ring.classList.add('hidden');
    if (!isBonus) {
        let data = getVaultData();
        data.count += 1;
        localStorage.setItem('vault_limit_data', JSON.stringify(data));
        updateVaultUI();
    }
    setTimeout(() => { calculateVaultPrize(); }, 1500);
}

function calculateVaultPrize() {
    const rand = Math.random() * 100;
    let prize = {};
    if (rand < 7) {
        prize = { name: "20 Rewards", icon: "💎", rarity: "LEGENDARY NODE", color: "bg-red-500", action: () => { let d = parseInt(localStorage.getItem('total_diamonds')) || 0; localStorage.setItem('total_diamonds', d + 20); } };
    } else if (rand < 30) {
        prize = { name: "500 Coins + Card", icon: "🎁", rarity: "RARE ASSET", color: "bg-purple-600", action: () => { let w = parseInt(localStorage.getItem('total_wallet')) || 0; let c = parseInt(localStorage.getItem('scratch_cards')) || 0; localStorage.setItem('total_wallet', w + 500); localStorage.setItem('scratch_cards', c + 1); } };
    } else {
        prize = { name: "100 Coins", icon: "💰", rarity: "STANDARD UNIT", color: "bg-blue-600", action: () => { let w = parseInt(localStorage.getItem('total_wallet')) || 0; localStorage.setItem('total_wallet', w + 100); } };
    }
    document.getElementById('vault-prize-icon').innerText = prize.icon;
    document.getElementById('vault-prize-name').innerText = prize.name;
    const badge = document.getElementById('rarity-badge');
    badge.innerText = prize.rarity;
    badge.className = `text-white text-[7px] font-black px-3 py-1 rounded-full uppercase tracking-widest inline-block mb-4 ${prize.color}`;
    prize.action();
    saveToServer();
    if (typeof updateDashboard === "function") updateDashboard();
    document.getElementById('vault-main-view').classList.add('hidden');
    const result = document.getElementById('vault-result');
    result.classList.remove('hidden');
    setTimeout(() => result.classList.replace('scale-0', 'scale-100'), 50);
}

function closeVault() {
    document.getElementById('vault-modal').classList.add('hidden');
    document.getElementById('orb-ring').classList.remove('hidden');
}

function initShop() {
    const grid = document.getElementById('avatar-grid');
    const owned = JSON.parse(localStorage.getItem('owned_avatars')) || ['default'];
    const selected = localStorage.getItem('selected_avatar') || 'default';
    const wallet = parseInt(localStorage.getItem('total_wallet')) || 0;
    document.getElementById('shop-wallet').innerText = wallet;
    grid.innerHTML = '';
    avatars.forEach(av => {
        const isOwned = owned.includes(av.id);
        const isSelected = selected === av.id;
        const card = document.createElement('div');
        card.className = `bg-white dark:bg-gray-900 p-5 rounded-[2.5rem] border ${isSelected ? 'border-blue-500' : 'border-gray-100 dark:border-gray-800'} text-center flex flex-col items-center shadow-sm relative overflow-hidden`;
        card.innerHTML = `
                            <div class="w-16 h-16 rounded-2xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center mb-4 ${av.color} ${av.glow || ''}">
                                <i class="fa-solid ${av.icon} text-2xl"></i>
                            </div>
                            <h4 class="font-black text-xs uppercase dark:text-white mb-1">${av.name}</h4>
                            <p class="text-[10px] font-bold text-gray-400 mb-4">${isOwned ? 'OWNED' : av.price + ' 💰'}</p>
                            <button onclick="${isOwned ? `selectAv('${av.id}')` : `buyAv('${av.id}', ${av.price})`}" 
                                    class="w-full py-2 rounded-xl text-[10px] font-black uppercase transition-all
                                    ${isSelected ? 'bg-green-500 text-white' : isOwned ? 'bg-gray-200 dark:bg-gray-800 dark:text-white' : 'bg-blue-600 text-white active:scale-95'}">
                                ${isSelected ? 'Selected' : isOwned ? 'Use' : 'Buy Now'}
                            </button>
                        `;
        grid.appendChild(card);
    });
}

async function buyAv(id, price) {
    let wallet = parseInt(localStorage.getItem('total_wallet')) || 0;
    if (wallet < price) {
        await showDialog("No Balance", "You don't have enough coins! 💰");
        return;
    }

    let confirmBuy = await showDialog("Confirm Purchase", `Buy ${id} avatar for ${price} coins?`, true);
    if (confirmBuy) {
        wallet -= price;
        localStorage.setItem('total_wallet', wallet);
        let owned = JSON.parse(localStorage.getItem('owned_avatars')) || ['default'];
        owned.push(id);
        localStorage.setItem('owned_avatars', JSON.stringify(owned));
        saveToServer();
        window.trackGA('purchase_avatar', { 'avatar_id': id, 'price': price });
        initShop();
        updateDashboard();
        await showDialog("Success", "Avatar unlocked! You can now use it in your profile.");
    }
}
function selectAv(id) {
    localStorage.setItem('selected_avatar', id);
    initShop();
    updateDashboard();
}

async function exchangeDiamonds(coinCost) {
    let coins = parseInt(localStorage.getItem('total_wallet')) || 0;

    if (coins < coinCost) {
        let goPlay = await showDialog(
            "Not Enough Coins",
            `💰 You need ${coinCost} coins for this exchange. Would you like to play more quizzes?`,
            true
        );

        if (goPlay) safeNav('app.html?mode=categories');
        return;
    }

    let diamondsGained = (coinCost / 1000) * 100;
    let confirmEx = await showDialog(
        "Confirm Exchange",
        `Do you want to exchange ${coinCost} coins for ${diamondsGained} Rewards?`,
        true
    );

    if (confirmEx) {
        coins -= coinCost;
        localStorage.setItem('total_wallet', coins);
        let currentDiamonds = parseInt(localStorage.getItem('total_diamonds')) || 0;
        localStorage.setItem('total_diamonds', currentDiamonds + diamondsGained);
        saveToServer();
        updateDashboard();
        await showDialog("Success", `Received ${diamondsGained} Rewards successfully!`);
    }
}

async function showAssetHint() {
    if (isRedirecting) return;
    let goPlay = await showDialog(
        "Insufficient Balance",
        "⚠️ You need more coins to get Rewards! Would you like to play a quiz now to earn coins? 💰",
        true
    );
    if (goPlay) {
        safeNav('app.html?mode=categories');
    }
}

function safeSet(id, value, type = 'innerText') {
    const el = document.getElementById(id);
    if (!el) return;
    if (type === 'innerText') el.innerText = value;
    else if (type === 'innerHTML') el.innerHTML = value;
    else if (type === 'styleWidth') el.style.width = value;
    else if (type === 'className') el.className = value;
}

function updateDashboard() {
    const walletBalance = localStorage.getItem('total_wallet') || 0;
    const diamonds = parseInt(localStorage.getItem('total_diamonds')) || 0;
    const scratchCards = localStorage.getItem('scratch_cards') || 0;
    const userXP = parseInt(localStorage.getItem('user_xp')) || 0;
    const stats = getPlayerStats(userXP);
    safeSet('wallet-balance', walletBalance);
    safeSet('card-diamond-count', diamonds);
    safeSet('scratch-count', scratchCards);
    safeSet('display-level', stats.level);
    safeSet('vault-coin-balance', walletBalance);
    safeSet('screen-diamond-balance', diamonds);
    safeSet('display-xp-val', stats.progress);
    safeSet('display-xp-bar', stats.progress + "%", 'styleWidth');
    const titleEl = document.getElementById('display-title');
    if (titleEl) {
        titleEl.innerText = stats.title;
        titleEl.className = `text-[10px] font-black uppercase tracking-[0.2em] leading-none mb-1 ${stats.colorClass}`;
    }
    const pBar = document.getElementById('payout-bar');
    if (pBar) {
        const progressPercent = Math.min(100, (diamonds / 5000) * 100);
        pBar.style.width = progressPercent + "%";
        safeSet('payout-percent', Math.floor(progressPercent) + "%");
    }
}
function renderAllCategories() {
    const container = document.getElementById('category-list-container');
    const paginationContainer = document.getElementById('pagination-controls');
    if (!container) return;
    if (filteredData.length === 0) {
        container.innerHTML = `
            <div class="col-span-2 text-center py-10">
                <i class="fa-solid fa-face-frown text-4xl text-gray-300 mb-3"></i>
                <p class="text-gray-400 font-bold uppercase text-[10px]">No matching category found!</p>
            </div>`;
        if (paginationContainer) paginationContainer.innerHTML = '';
        return;
    }
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedItems = filteredData.slice(startIndex, endIndex);
    container.innerHTML = paginatedItems.map(cat => `
        <div onclick="startMode('${cat.id}')" 
             class="group relative h-48 rounded-[2.5rem] cursor-pointer transition-all duration-500 active:scale-95">
            <div class="absolute inset-4 bg-gradient-to-br ${cat.color} blur-2xl opacity-0 group-hover:opacity-40 transition-opacity duration-500"></div>
            <div class="relative h-full w-full bg-white dark:bg-gray-900 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 overflow-hidden flex flex-col p-5 shadow-sm group-hover:-translate-y-3 group-hover:shadow-xl group-hover:border-blue-500/20 transition-all duration-500">
                <div class="flex justify-between items-center mb-3 relative z-10">
                    <div class="flex items-center gap-1.5 bg-green-500/10 px-2 py-0.5 rounded-full">
                        <span class="relative flex h-1.5 w-1.5">
                            <span class="animate-ping absolute h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span class="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
                        </span>
                        <span class="text-[7px] font-black text-green-600 uppercase tracking-widest">${cat.live}</span>
                    </div>
                    <span class="text-[8px] font-black text-gray-400 uppercase tracking-tighter">${cat.extra}</span>
                </div>
                <div class="flex-1 flex flex-col items-center justify-center relative z-10">
                    <div class="w-14 h-14 bg-gradient-to-tr ${cat.color} rounded-2xl flex items-center justify-center shadow-lg group-hover:rotate-6 transition-transform duration-500">
                        <i class="fa-solid ${cat.icon} text-white text-2xl"></i>
                    </div>
                    <h3 class="text-[14px] font-black text-gray-800 dark:text-white uppercase italic tracking-tighter mt-3 leading-none group-hover:text-blue-600 transition-colors">${cat.name}</h3>
                    <p class="text-[8px] font-bold text-gray-400 uppercase mt-1 tracking-widest opacity-80">${cat.sub}</p>
                </div>
                <div class="mt-4 relative z-10">
                    <div class="bg-gray-50 dark:bg-gray-800/50 py-2 px-4 rounded-2xl flex items-center justify-between border border-gray-100 dark:border-gray-700">
                        <span class="text-[8px] font-black text-gray-400 uppercase">Prize</span>
                        <span class="text-[10px] font-black text-yellow-500 italic">${cat.reward}</span>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
    renderPaginationControls();
}
function changePage(direction) {
    currentPage += direction;
    renderAllCategories();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function filterCategories() {
    const searchInput = document.getElementById('cat-search-input');
    const query = searchInput.value.toLowerCase().trim();
    const result = ALL_CATEGORIES.filter(cat =>
        cat.name.toLowerCase().includes(query) ||
        cat.sub.toLowerCase().includes(query)
    );
    filteredData = shuffleArray(result);
    currentPage = 1;
    renderAllCategories();
}
function loadProfileData() {
    renderBadges();
    const xp = parseInt(localStorage.getItem('user_xp')) || 0;
    const wallet = localStorage.getItem('total_wallet') || 0;
    const diamonds = localStorage.getItem('total_diamonds') || 0;
    const pvpWins = JSON.parse(localStorage.getItem('ach_stats'))?.pvp_wins || 0;
    const streak = localStorage.getItem('login_streak') || 0;
    const stats = getPlayerStats(xp);
    const name = localStorage.getItem('user_name') || localStorage.getItem('user_id') || "User";
    const selectedAv = localStorage.getItem('selected_avatar') || 'default';
    const customPhoto = localStorage.getItem('user_custom_avatar');
    if (document.getElementById('p-name')) document.getElementById('p-name').innerText = name;
    if (document.getElementById('p-xp')) document.getElementById('p-xp').innerText = xp;
    if (document.getElementById('p-xp-detail')) document.getElementById('p-xp-detail').innerText = `${stats.progress}/100`;
    if (document.getElementById('p-wallet')) document.getElementById('p-wallet').innerText = wallet + " 💰";
    if (document.getElementById('p-diamonds')) document.getElementById('p-diamonds').innerText = diamonds + " 💎";
    if (document.getElementById('stat-pvp-wins')) document.getElementById('stat-pvp-wins').innerText = pvpWins;
    if (document.getElementById('p-streak')) document.getElementById('p-streak').innerText = streak + " Days";
    if (document.getElementById('p-rank')) document.getElementById('p-rank').innerText = stats.title;
    if (document.getElementById('display-level')) document.getElementById('display-level').innerText = stats.level;
    const avatarMap = {
        'default': { icon: 'fa-brain', bg: 'from-blue-600 to-indigo-600', shadow: 'shadow-blue-500/30' },
        'neon': { icon: 'fa-microchip', bg: 'from-cyan-400 to-blue-500', shadow: 'shadow-cyan-400/30' },
        'robot': { icon: 'fa-robot', bg: 'from-indigo-500 to-purple-600', shadow: 'shadow-indigo-500/30' },
        'god': { icon: 'fa-bolt-lightning', bg: 'from-yellow-400 to-orange-500', shadow: 'shadow-yellow-500/30' }
    };
    const picBg = document.getElementById('profile-pic-bg');
    const picIcon = document.getElementById('profile-pic-icon');
    const customImg = document.getElementById('p-custom-img');
    if (selectedAv === 'custom' && customPhoto) {
        if (picIcon) picIcon.classList.add('hidden');
        if (customImg) {
            customImg.src = customPhoto;
            customImg.classList.remove('hidden');
        }
        if (picBg) {
            picBg.classList.remove('bg-gradient-to-tr', 'from-blue-600', 'to-indigo-600');
            picBg.classList.add('bg-gray-200', 'dark:bg-gray-800');
        }
    } else {
        if (customImg) customImg.classList.add('hidden');
        if (picIcon) picIcon.classList.remove('hidden');
        const avData = avatarMap[selectedAv] || avatarMap['default'];
        if (picBg && picIcon) {
            picBg.className = `cursor-pointer group w-20 h-20 bg-gradient-to-tr ${avData.bg} rounded-[2rem] flex items-center justify-center shadow-lg ${avData.shadow} relative transition-all duration-500 overflow-hidden`;
            picIcon.className = `fa-solid ${avData.icon} text-white text-3xl`;
        }
    }

    const savedBio = localStorage.getItem('user_bio') || "I'm an IQ Master! 🧠";
    if (document.getElementById('p-bio')) document.getElementById('p-bio').innerText = savedBio;
    if (typeof renderEconomyOverview === "function") renderEconomyOverview();
    const catStats = JSON.parse(localStorage.getItem('category_stats')) || {};
    const container = document.getElementById('category-stats-list');
    if (container) {
        container.className = "grid grid-cols-2 gap-2 w-full items-start text-left";
        container.innerHTML = '';
        const playedModes = Object.keys(catStats);
        if (playedModes.length === 0) {
            container.className = "text-center w-full";
            container.innerHTML = `<div class="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-2 mx-auto animate-pulse"><i class="fa-solid fa-chart-simple text-gray-300 text-xs"></i></div><p class="text-[9px] font-bold text-gray-400 uppercase tracking-wide">Play quizzes to unlock stats!</p>`;
            return;
        }
        const autoColors = ['blue', 'purple', 'emerald', 'orange', 'indigo', 'rose', 'cyan', 'teal'];
        const autoIcons = ['fa-book', 'fa-star', 'fa-bolt', 'fa-brain', 'fa-lightbulb', 'fa-puzzle-piece', 'fa-layer-group', 'fa-microchip'];
        playedModes.forEach(modeKey => {
            const data = catStats[modeKey];
            const displayName = modeKey.charAt(0).toUpperCase() + modeKey.slice(1);
            let hash = 0;
            for (let i = 0; i < modeKey.length; i++) hash = modeKey.charCodeAt(i) + ((hash << 5) - hash);
            const index = Math.abs(hash);
            const colorName = autoColors[index % autoColors.length];
            const iconName = autoIcons[index % autoIcons.length];
            let finalIcon = iconName;
            let finalColor = colorName;
            if (modeKey === 'pvp') { finalIcon = 'fa-trophy'; finalColor = 'indigo'; }
            if (modeKey === 'daily') { finalIcon = 'fa-calendar-check'; finalColor = 'orange'; }
            const totalPlayed = data.right + data.wrong;
            const accuracy = totalPlayed > 0 ? Math.round((data.right / totalPlayed) * 100) : 0;
            let rankTitle = "Rookie";
            if (data.pts > 500) rankTitle = "Legend";
            else if (data.pts > 200) rankTitle = "Master";
            else if (data.pts > 50) rankTitle = "Pro";
            else if (data.pts > 10) rankTitle = "Learner";
            const html = `
            <div class="w-full bg-white dark:bg-gray-800 p-2.5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm relative overflow-hidden active:scale-95 transition-all group">
                <div class="absolute -right-3 -top-3 w-10 h-10 bg-${finalColor}-500/10 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
                <div class="flex items-start gap-2 mb-1.5 relative z-10">
                    <div class="w-8 h-8 bg-${finalColor}-500 bg-opacity-10 rounded-xl flex items-center justify-center flex-shrink-0">
                        <i class="fa-solid ${finalIcon} text-${finalColor}-500 text-[10px]"></i>
                    </div>
                    <div class="overflow-hidden">
                        <h5 class="text-[9px] font-black uppercase dark:text-white tracking-wider leading-tight truncate w-20">${displayName}</h5>
                        <p class="text-[7px] font-bold text-${finalColor}-500 bg-${finalColor}-50 dark:bg-gray-700 px-1.5 rounded-md inline-block mt-0.5">${rankTitle}</p>
                    </div>
                </div>
                <div class="flex items-end justify-between border-t border-gray-50 dark:border-gray-700 pt-1.5">
                    <div>
                        <p class="text-[7px] font-bold text-gray-400 uppercase leading-none">Score</p>
                        <p class="text-xs font-black text-gray-800 dark:text-gray-200 leading-tight mt-0.5">${data.pts}</p>
                    </div>
                    <div class="text-right">
                        <p class="text-[7px] font-bold text-gray-400 uppercase leading-none">Acc.</p>
                        <p class="text-xs font-black ${accuracy > 50 ? 'text-green-500' : 'text-orange-500'} leading-tight mt-0.5">${accuracy}%</p>
                    </div>
                </div>
                <div class="w-full h-1 bg-gray-100 dark:bg-gray-700 rounded-full mt-1.5 overflow-hidden">
                    <div class="h-full bg-${finalColor}-500" style="width: ${accuracy}%"></div>
                </div>
            </div>`;
            container.innerHTML += html;
        });
    }
}
function toggleNameEdit() {
    const nameText = document.getElementById('p-name');
    const nameInput = document.getElementById('p-name-input');
    const editIcon = document.getElementById('edit-icon');
    if (nameInput.classList.contains('hidden')) {
        nameText.classList.add('hidden');
        nameInput.classList.remove('hidden');
        nameInput.value = nameText.innerText;
        nameInput.focus();
        editIcon.classList.remove('fa-pen', 'text-gray-400');
        editIcon.classList.add('fa-check', 'text-green-500');
    }

    else {
        const newName = nameInput.value.trim();
        if (newName) {
            localStorage.setItem('user_name', newName);
            nameText.innerText = newName;
            if (document.getElementById('display-title')) {
                updateDashboard();
            }
        }
        nameInput.classList.add('hidden');
        nameText.classList.remove('hidden');
        editIcon.classList.add('fa-pen', 'text-gray-400');
        editIcon.classList.remove('fa-check', 'text-green-500');
    }
}
function toggleBioEdit() {
    const bioText = document.getElementById('p-bio');
    const bioInput = document.getElementById('p-bio-input');
    const editIcon = document.getElementById('bio-edit-icon');
    if (bioInput.classList.contains('hidden')) {
        bioInput.classList.remove('hidden');
        bioText.classList.add('hidden');
        bioInput.value = bioText.innerText;
        bioInput.focus();
        editIcon.classList.replace('fa-pen', 'fa-check');
        editIcon.classList.replace('text-gray-400', 'text-green-500');
    }
    else {
        const newBio = bioInput.value.trim();
        if (newBio) {
            localStorage.setItem('user_bio', newBio);
            bioText.innerText = newBio;
        }
        bioInput.classList.add('hidden');
        bioText.classList.remove('hidden');
        editIcon.classList.replace('fa-check', 'fa-pen');
        editIcon.classList.replace('text-green-500', 'text-gray-400');
    }
}
function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
        alert("Image is too large! Please select an image under 2MB.");
        return;
    }
    const reader = new FileReader();
    reader.onload = function (e) {
        const base64Image = e.target.result;
        localStorage.setItem('user_custom_avatar', base64Image);
        localStorage.setItem('selected_avatar', 'custom');
        loadProfileData();
        updateDashboard();
        saveToServer();
    };
    reader.readAsDataURL(file);
}
function renderBadges() {
    const container = document.getElementById('badge-container');
    if (!container) return;
    const badges = updateAndGetBadges();
    const badgeData = {
        'math_king': { icon: 'fa-crown', color: 'text-yellow-500', bg: 'bg-yellow-100', name: 'Math King' },
        'fast_finger': { icon: 'fa-bolt', color: 'text-blue-500', bg: 'bg-blue-100', name: 'Fast Finger' },
        'night_owl': { icon: 'fa-moon', color: 'text-purple-500', bg: 'bg-purple-100', name: 'Night Owl' }
    };
    container.innerHTML = badges.map(b => `
        <div class="flex flex-col items-center gap-1 group">
            <div class="${badgeData[b].bg} ${badgeData[b].color} w-12 h-12 rounded-full flex items-center justify-center shadow-sm border-2 border-white dark:border-gray-700 animate-in zoom-in duration-300">
                <i class="fa-solid ${badgeData[b].icon} text-lg"></i>
            </div>
            <span class="text-[7px] font-black uppercase tracking-tighter dark:text-gray-400">${badgeData[b].name}</span>
        </div>
    `).join('');
    if (badges.length === 0) {
        container.innerHTML = `<p class="text-[9px] font-bold text-gray-400 uppercase">No badges earned yet</p>`;
    }
}
function updateAndGetBadges() {
    let badges = JSON.parse(localStorage.getItem('user_badges')) || [];
    const stats = JSON.parse(localStorage.getItem('category_stats')) || {};
    const lastSpeed = parseFloat(localStorage.getItem('last_speed')) || 10;
    const hour = new Date().getHours();
    if (stats.math && stats.math.pts >= 500 && !badges.includes('math_king')) {
        badges.push('math_king');
    }
    if (lastSpeed > 0 && lastSpeed <= 3 && !badges.includes('fast_finger')) {
        badges.push('fast_finger');
    }
    if ((hour >= 23 || hour <= 5) && !badges.includes('night_owl')) {
        badges.push('night_owl');
    }
    localStorage.setItem('user_badges', JSON.stringify(badges));
    return badges;
}

async function requestWakeLock() {
    try {
        if ('wakeLock' in navigator) {
            wakeLock = await navigator.wakeLock.request('screen');
            console.log('Wake Lock is active: Screen will not sleep');
            wakeLock.addEventListener('release', () => {
                console.log('Wake Lock was released');
            });
        }
    } catch (err) {
        console.error(`${err.name}, ${err.message}`);
    }
}
function releaseWakeLock() {
    if (wakeLock !== null) {
        wakeLock.release();
        wakeLock = null;
    }
}
function toggleDarkMode() {
    document.documentElement.classList.toggle('dark');
    const isDark = document.documentElement.classList.contains('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    document.getElementById('theme-icon').className = isDark ? 'fa-solid fa-sun text-yellow-400' : 'fa-solid fa-moon';
}

function loadSavedTheme() {
    if (localStorage.getItem('theme') === 'dark') {
        document.documentElement.classList.add('dark');
        const themeIcon = document.getElementById('theme-icon');
        if (themeIcon) themeIcon.className = 'fa-solid fa-sun text-yellow-400';
    }
}
function checkInstallAvailability() {
    const homeCard = document.getElementById('home-install-card');
    const resultCard = document.getElementById('install-card');
    if (deferredPrompt) {
        if (homeCard) homeCard.classList.remove('hidden');
        if (resultCard) resultCard.classList.remove('hidden');
    }
}
async function triggerInstall(source) {
    window.trackGA('install_button_click', { 'source': source });
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
        let wallet = parseInt(localStorage.getItem('total_wallet')) || 0;
        wallet += 50;
        localStorage.setItem('total_wallet', wallet);
        saveToServer();
        if (typeof updateDashboard === "function") updateDashboard();
        if (document.getElementById('home-install-card')) document.getElementById('home-install-card').classList.add('hidden');
        if (document.getElementById('install-card')) document.getElementById('install-card').classList.add('hidden');
        await showDialog("Success!", "50 Coins added for installing IQ Master! 💰");
    }
    deferredPrompt = null;
}
function initReferral() {
    let userId = localStorage.getItem('user_id');
    if (!userId) {
        userId = 'u' + Date.now();
        localStorage.setItem('user_id', userId);
    }
    const refLink = window.location.origin + window.location.pathname + "?ref=" + userId;
    document.getElementById('ref-link-text').innerText = refLink;
}

function shareReferral() {
    window.trackGA('share_referral_click');
    const link = document.getElementById('ref-link-text').innerText;
    const text = `Hey! I am earning Rewards and coins 💰 by playing IQ Master Quiz. Use my link to join and we both get rewards: ${link}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
}
async function checkReferralOnLoad() {
    const urlParams = new URLSearchParams(window.location.search);
    const refBy = urlParams.get('ref');
    const isNewUser = !localStorage.getItem('user_already_joined');
    if (refBy && isNewUser) {
        localStorage.setItem('referred_by', refBy);
    }
}

document.addEventListener('click', function (e) {
    if (isRedirecting) {
        e.preventDefault();
        e.stopPropagation();
        console.log("Navigation in progress... block click.");
        return false;
    }
}, true);

window.onpageshow = function (event) {
    isRedirecting = false;
    document.body.style.pointerEvents = 'auto';
    document.body.style.opacity = '1';
    document.body.style.cursor = 'default';
    document.body.style.overflow = '';
    const loader = document.getElementById('global-app-loader');
    if (loader) {
        loader.remove();
    }
    const dialog = document.getElementById('custom-dialog');
    if (dialog) dialog.remove();

    document.body.classList.remove('locked-screen');
    console.log("Page restored: UI Unlocked, Scroll restored and Dialog removed.");
};

document.addEventListener('DOMContentLoaded', () => {
    init();
});