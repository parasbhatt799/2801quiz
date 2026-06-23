const fs = require('fs');

// Load quizbank.js to get questionsPool
const quizbankContent = fs.readFileSync('quizbank.js', 'utf8').replace('const questionsPool =', 'global.questionsPool =');
eval(quizbankContent);
const pool = global.questionsPool;

// Categories from ALL_CATEGORIES
const categories = [
    { id: 'math', keywords: ['math', 'sum', 'equation', 'calculator', 'fraction', 'algebra', 'geometry', 'multiply', 'divide', 'subtract', 'add ', 'prime number', 'integer', 'ratio', 'percent'] },
    { id: 'tech', keywords: ['ai', 'robot', 'software', 'computer', 'server', 'database', 'cybersecurity', 'hacker', 'programming', 'developer', 'algorithm', 'neural', 'ray-ban meta', '5g', 'optical', 'cpu', 'ram'] },
    { id: 'crypto', keywords: ['bitcoin', 'blockchain', 'cryptocurrency', 'ethereum', 'crypto', 'wallet', 'nft', 'seed phrase', 'rug pull', 'defi', 'halving', 'satoshi', 'nakamoto', 'token', 'ledger'] },
    { id: 'finance', keywords: ['stock', 'forex', 'shares', 'dividend', 'yield', 'bond', 'finance', 'wallet', 'credit card', 'credit score', 'apr', 'cibil', 'loan', 'mortgage', 'refinancing', 'equity', 'escrow', 'fdi', 'ipo', 'amortization', 'net income', 'balance transfer', 'grace period', 'annual fee', 'mdr', 'pci dss', 'statement credit', 'card upgrade', 'cash advance'] },
    { id: 'gk', keywords: ['world', 'global', 'capital of', 'largest country', 'population', 'earth', 'un ', 'president', 'prime minister', 'currency', 'official language'] },
    { id: 'science', keywords: ['science', 'physics', 'biology', 'chemistry', 'quantum', 'molecule', 'atom', 'gene', 'dna', 'cell', 'element', 'gravity', 'einstein', 'microscope', 'evolution'] },
    { id: 'space', keywords: ['planet', 'galaxy', 'nasa', 'space', 'star', 'apollo', 'orbit', 'mars', 'jupiter', 'sun', 'moon', 'telescope', 'astronomy', 'rocket', 'cosmos'] },
    { id: 'geo', keywords: ['map', 'country', 'sea', 'ocean', 'river', 'mountain', 'geography', 'lake', 'continent', 'island', 'desert', 'volcano', 'border', 'capital'] },
    { id: 'history', keywords: ['war', 'ancient', 'history', 'emperor', 'king', 'dynasty', 'century', 'empire', 'rome', 'egypt', 'bc', 'treaty', 'world war'] },
    { id: 'bollywood', keywords: ['movie', 'actor', 'bollywood', 'cinema', 'film', 'song', 'actress', 'director', 'music director', 'khan', 'kapoor', 'blockbuster', 'oscar', 'playback'] },
    { id: 'gaming', keywords: ['game', 'gta', 'pubg', 'fortnite', 'esports', 'xbox', 'playstation', 'nintendo', 'gaming console', 'minecraft', 'roblox', 'free fire', 'dota', 'lol', 'counter-strike', 'gamer'] },
    { id: 'music', keywords: ['music', 'song', 'album', 'pop', 'band', 'guitar', 'singer', 'composer', 'symphony', 'melody', 'grammy', 'instrument'] },
    { id: 'anime', keywords: ['anime', 'manga', 'otaku', 'naruto', 'one piece', 'dragon ball', 'attack on titan', 'death note', 'my hero', 'demon slayer', 'solo leveling', 'ghibli'] },
    { id: 'tv', keywords: ['netflix', 'series', 'tv show', 'streaming', 'episode', 'hbo', 'sitcom', 'friends', 'office', 'breaking bad', 'game of thrones'] },
    { id: 'sports', keywords: ['football', 'cricket', 'soccer', 'tennis', 'wimbledon', 'trophy', 'goal', 'umpire', 'drs', 'ipl', 'fifa', 'world cup', 'olympics', 'athlete', 'coach', 'nba', 'nfl', 'baseball', 'golf', 'boxing', 'wrestling', 'running', 'swimming', 'badminton'] },
    { id: 'fitness', keywords: ['fitness', 'gym', 'workout', 'exercise', 'muscle', 'protein', 'diet', 'calories', 'weight', 'cardio', 'yoga', 'meditation', 'heart rate', 'health'] },
    { id: 'yoga', keywords: ['yoga', 'meditation', 'zen', 'asana', 'pranayama', 'chakra', 'peace', 'mindfulness'] },
    { id: 'f1', keywords: ['formula 1', 'f1', 'grand prix', 'racing', 'driver', 'ferrari', 'hamilton', 'verstappen', 'mclaren', 'monaco gp', 'pit stop'] },
    { id: 'startup', keywords: ['startup', 'business', 'entrepreneur', 'founder', 'unicorn', 'funding', 'venture capital', 'pitch', 'product-market fit', 'angel investor'] },
    { id: 'marketing', keywords: ['marketing', 'branding', 'ads', 'social media', 'advertising', 'seo', 'sem', 'ppc', 'ctr', 'cpm', 'cpc', 'analytics', 'traffic', 'leads', 'bounce rate', 'conversion', 'campaign'] },
    { id: 'realestate', keywords: ['real estate', 'property', 'house', 'apartment', 'rent', 'landlord', 'tenant', 'broker', 'realtor', 'buying a house', 'zoning', 'home value'] },
    { id: 'investing', keywords: ['investing', 'invest', 'portfolio', 'asset allocation', 'stocks', 'bonds', 'mutual fund', 'etf', 'index fund', 'capital gains', 'dividend', 'wealth', 'arbitrage', 'bull market', 'bear market'] },
    { id: 'travel', keywords: ['travel', 'tourism', 'backpack', 'destination', 'flight', 'hotel', 'voyage', 'tourist', 'visa', 'passport', 'luggage', 'journey'] },
    { id: 'fashion', keywords: ['fashion', 'style', 'clothing', 'brand', 'designer', 'vogue', 'trends', 'shoes', 'red sole', 'louboutin', 'jewelry', 'model'] },
    { id: 'auto', keywords: ['car', 'automobile', 'supercar', 'engine', 'vehicle', 'tesla', 'bmw', 'mercedes', 'ford', 'toyota', 'garage', 'transmission'] },
    { id: 'myth', keywords: ['mythology', 'myth', 'greek god', 'zeus', 'hades', 'thor', 'odin', 'pantheon', 'legend', 'folklore'] },
    { id: 'gadgets', keywords: ['gadget', 'device', 'smartphone', 'headphone', 'smartwatch', 'tablet', 'charger', 'soundbar', 'bluetooth', 'noise cancelling'] },
    { id: 'psychology', keywords: ['psychology', 'mindset', 'human behavior', 'cognitive', 'therapy', 'brain', 'mental health', 'personality', 'emotion'] },
    { id: 'robotic', keywords: ['robot', 'automation', 'drone', 'ai', 'sensors', 'mechatronics', 'cyborg'] },
    { id: 'insurance', keywords: ['insurance', 'policy', 'premium', 'deductible', 'liability', 'term life', 'whole life', 'claim', 'beneficiary', 'copay', 'coverage'] },
    { id: 'legal', keywords: ['law', 'legal', 'lawyer', 'attorney', 'court', 'judge', 'lawsuit', 'class action', 'power of attorney', 'malpractice', 'justice', 'plaintiff', 'defendant'] },
    { id: 'energy', keywords: ['energy', 'solar', 'wind power', 'ev', 'green fuel', 'renewable', 'electricity', 'power plant', 'turbine'] },
    { id: 'luxury', keywords: ['luxury', 'elite', 'watch', 'rolex', 'patek', 'yacht', 'champagne', 'caviar', 'expensive', 'diamond', 'designer'] },
    { id: 'astronomy', keywords: ['astronomy', 'planet', 'star', 'telescope', 'nebula', 'supernova', 'constellation', 'hubble'] },
    { id: 'mortgage', keywords: ['mortgage', 'home loan', 'equity', 'escrow', 'pmi', 'amortization', 'interest rate', 'lender'] },
    { id: 'credit', keywords: ['credit card', 'credit score', 'fico', 'cibil', 'apr', 'limit', 'credit limit', 'balance transfer', 'grace period', 'annual fee'] },
    { id: 'tax', keywords: ['tax', 'gst', 'vat', 'irs', 'filing', 'income tax', 'deduction', 'tax return', 'capital gains tax'] },
    { id: 'insurance_auto', keywords: ['auto insurance', 'car insurance', 'vehicle cover', 'collision', 'comprehensive', 'roadside assistance'] },
    { id: 'retirement', keywords: ['retirement', '401k', 'pension', 'ira', 'annuity', 'social security', 'old age'] },
    { id: 'trading', keywords: ['trading', 'day trading', 'options', 'intraday', 'scalping', 'swing trading', 'chart', 'technical indicator', 'rsi', 'macd'] },
    { id: 'mba', keywords: ['mba', 'business management', 'management', 'corporate', 'strategy', 'leadership', 'marketing strategy', 'hr'] },
    { id: 'ielts', keywords: ['ielts', 'toefl', 'english test', 'vocabulary', 'grammar', 'reading', 'writing', 'speaking', 'listening'] },
    { id: 'scholarship', keywords: ['scholarship', 'grant', 'financial aid', 'study abroad', 'university', 'tuition'] },
    { id: 'upsc', keywords: ['upsc', 'ias', 'ips', 'civil services', 'history', 'geography', 'polity', 'prelims', 'mains'] },
    { id: 'law', keywords: ['law', 'legal', 'court', 'constitution', 'justice', 'crime', 'statute', 'jurisprudence'] },
    { id: 'history_war', keywords: ['ww1', 'ww2', 'world war', 'battlefield', 'military', 'army', 'weapons', 'treaty of versailles'] },
    { id: 'mythology_greek', keywords: ['zeus', 'hades', 'poseidon', 'athena', 'apollo', 'hercules', 'olympus', 'greek mythology'] },
    { id: 'luxury_watch', keywords: ['rolex', 'patek', 'audemars', 'omega', 'cartier', 'horology', 'mechanical watch', 'chronograph'] },
    { id: 'world_cup', keywords: ['odi world cup', 'cricket world cup', 'dhoni', 'tendulkar', 'kohli', 'cwc'] },
    { id: 'cricket_rules', keywords: ['cricket rules', 'umpire', 'drs', 'lbw', 'no ball', 'wide', 'powerplay', 'crease'] },
    { id: 'premier_league', keywords: ['premier league', 'manchester united', 'liverpool', 'arsenal', 'chelsea', 'man city', 'epl'] },
    { id: 'champions_league', keywords: ['champions league', 'ucl', 'real madrid', 'barcelona', 'bayern', 'psg', 'juventus'] },
    { id: 'fifa_wc', keywords: ['fifa world cup', 'world cup 2022', 'world cup 2018', 'world cup 2014', 'world cup 2010', 'world cup 2006'] },
    { id: 'laliga', keywords: ['la liga', 'laliga', 'real madrid', 'barcelona', 'atletico', 'spanish league'] },
    { id: 'football_stars', keywords: ['messi', 'ronaldo', 'cr7', 'neymar', 'mbappe', 'haaland', 'pele', 'maradona', 'zidane', 'ronaldinho'] },
    { id: 'wimbledon', keywords: ['wimbledon', 'grass court', 'federer', 'nadal', 'djokovic', 'serena', 'tennis court'] },
    { id: 'table_tennis', keywords: ['table tennis', 'ping pong', 'paddle', 'spin', 'smash', 'serve'] },
    { id: 'boxing', keywords: ['boxing', 'heavyweight', 'knockout', 'ali', 'tyson', 'mayweather', 'punch', 'gloves'] },
    { id: 'wwe', keywords: ['wwe', 'pro wrestling', 'smackdown', 'raw', 'wrestlemania', 'john cena', 'undertaker', 'rock'] },
    { id: 'nba_ball', keywords: ['nba', 'lebron', 'jordan', 'kobe', 'curry', 'basketball', 'dunk', 'lakers'] },
    { id: 'nfl_football', keywords: ['nfl', 'super bowl', 'quarterback', 'rugby', 'touchdown'] },
    { id: 'baseball', keywords: ['baseball', 'mlb', 'homerun', 'yankees', 'pitcher', 'batter'] },
    { id: 'olympics', keywords: ['olympics', 'olympic games', 'gold medal', 'silver medal', 'bronze medal'] },
    { id: 'athletics', keywords: ['athletics', 'track and field', 'usain bolt', 'marathon', 'sprint', 'running'] },
    { id: 'swimming', keywords: ['swimming', 'phelps', 'freestyle', 'stroke', 'laps', 'pool'] },
    { id: 'gymnastics', keywords: ['gymnastics', 'flip', 'vault', 'balance beam', 'simone biles'] },
    { id: 'kabaddi', keywords: ['kabaddi', 'pro kabaddi', 'raid', 'tackle', 'defender', 'raider'] },
    { id: 'hockey', keywords: ['hockey', 'field hockey', 'puck', 'dhyan chand'] },
    { id: 'golf', keywords: ['golf', 'masters tournament', 'tiger woods', 'par', 'birdie', 'hole in one'] },
    { id: 'cycling', keywords: ['cycling', 'tour de france', 'bicycle', 'peloton'] },
    { id: 'volleyball', keywords: ['volleyball', 'spike', 'block', 'serve', 'court'] },
    { id: 'skateboarding', keywords: ['skateboard', 'skateboarding', 'tony hawk', 'halfpipe'] },
    { id: 'snooker', keywords: ['snooker', 'billiards', 'pool table', 'cue ball', 'eight ball'] },
    { id: 'climbing', keywords: ['climbing', 'rock climb', 'mountaineering', 'everest'] },
    { id: 'shooting', keywords: ['shooting', 'precision shooting', 'air rifle', 'target shooting'] },
    { id: 'wrestling', keywords: ['wrestling', 'kushti', 'dangal', 'grappling'] },
    { id: 'polo', keywords: ['polo', 'horse polo', 'mallet'] },
    { id: 'darts', keywords: ['darts', 'bullseye', 'dartboard'] },
    { id: 'bowling', keywords: ['bowling', 'ten pins', 'strike', 'spare'] },
    { id: 'marathon', keywords: ['marathon', 'endurance run', '42km'] },
    { id: 'weightlifting', keywords: ['weightlifting', 'powerlifting', 'snatch', 'jerk', 'barbell'] },
    { id: 'free_fire', keywords: ['free fire', 'ff', 'garena', 'booyah'] },
    { id: 'roblox', keywords: ['roblox', 'robux', 'adopt me'] },
    { id: 'fifa_ea', keywords: ['fc 24', 'fifa 23', 'ea sports fc'] },
    { id: 'pubg_pc', keywords: ['pubg', 'erangel', 'battlegrounds'] },
    { id: 'esports_pro', keywords: ['esports pro', 'esports tournament'] },
    { id: 'chess_game', keywords: ['chess', 'grandmaster', 'checkmate', 'magnus', 'kasparov'] },
    { id: 'india_tour', keywords: ['taj mahal', 'india tour', 'ganges', 'delhi', 'mumbai', 'incredible india'] },
    { id: 'germany_tech', keywords: ['germany', 'berlin', 'munich', 'autobahn'] },
    { id: 'world_wonders', keywords: ['wonders of the world', 'great wall of china', 'chichen itza', 'petra', 'colosseum', 'machu picchu', 'christ the redeemer'] },
    { id: 'cruise_life', keywords: ['cruise', 'ship', 'caribbean cruise', 'sea voyage'] },
    { id: 'backpacker', keywords: ['backpacker', 'budget travel', 'hostel'] },
    { id: 'world_museums', keywords: ['museum', 'louvre', 'art gallery', 'mona lisa'] },
    { id: 'festivals_world', keywords: ['festival', 'carnival', 'oktoberfest', 'mardi gras'] },
    { id: 'south_korea', keywords: ['south korea', 'seoul', 'k-pop', 'bts'] },
    { id: 'vietnam', keywords: ['vietnam', 'hanoi', 'ha long bay', 'saigon'] },
    { id: 'new_zealand', keywords: ['new zealand', 'auckland', 'kiwi', 'maori'] },
    { id: 'south_africa', keywords: ['south africa', 'cape town', 'johannesburg', 'nelson mandela'] },
    { id: 'netherlands', keywords: ['netherlands', 'amsterdam', 'tulip', 'dutch'] },
    { id: 'portugal', keywords: ['portugal', 'lisbon', 'porto'] },
    { id: 'austria', keywords: ['austria', 'vienna', 'mozart'] },
    { id: 'norway', keywords: ['norway', 'oslo', 'fjord'] },
    { id: 'peru_macchu', keywords: ['peru', 'lima', 'machu picchu', 'incas'] },
    { id: 'morocco', keywords: ['morocco', 'marrakesh', 'sahara'] },
    { id: 'israel', keywords: ['israel', 'jerusalem', 'tel aviv'] },
    { id: 'argentina', keywords: ['argentina', 'buenos aires', 'tango'] },
    { id: 'scotland', keywords: ['scotland', 'edinburgh', 'highlands'] },
    { id: 'ireland', keywords: ['ireland', 'dublin', 'clover'] },
    { id: 'nepal_everest', keywords: ['nepal', 'kathmandu', 'everest'] },
    { id: 'malaysia', keywords: ['malaysia', 'kuala lumpur', 'petronas'] }
];

console.log('Total questions in pool:', pool.length);

const categorized = [];
let uncategorizedCount = 0;

for (const q of pool) {
    const text = (q.q + ' ' + q.exp + ' ' + q.opt.join(' ')).toLowerCase();
    let bestCat = null;
    let maxMatches = 0;

    for (const cat of categories) {
        let matches = 0;
        for (const kw of cat.keywords) {
            if (text.includes(kw)) {
                matches++;
            }
        }
        if (matches > maxMatches) {
            maxMatches = matches;
            bestCat = cat.id;
        }
    }

    if (bestCat) {
        q.category = bestCat;
        categorized.push(q);
    } else {
        // Fallback to gk or daily
        q.category = 'gk';
        uncategorizedCount++;
        categorized.push(q);
    }
}

console.log('Categorized:', categorized.length);
console.log('Uncategorized (defaulted to gk):', uncategorizedCount);

const catCounts = {};
categorized.forEach(q => catCounts[q.category] = (catCounts[q.category] || 0) + 1);
console.log('Counts per category:', catCounts);
