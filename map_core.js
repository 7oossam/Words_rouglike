console.log("=== START OF MAP_CORE.JS ===");
// State
const ALL_LETTERS = [
    { char: 'ا', value: 1 }, { char: 'ب', value: 3 }, { char: 'ت', value: 3 },
    { char: 'ث', value: 4 }, { char: 'ج', value: 4 }, { char: 'ح', value: 3 },
    { char: 'خ', value: 5 }, { char: 'د', value: 3 }, { char: 'ذ', value: 5 },
    { char: 'ر', value: 2 }, { char: 'ز', value: 4 }, { char: 'س', value: 3 },
    { char: 'ش', value: 4 }, { char: 'ص', value: 4 }, { char: 'ض', value: 10 },
    { char: 'ط', value: 5 }, { char: 'ظ', value: 10 }, { char: 'ع', value: 3 },
    { char: 'ق', value: 5 }, { char: 'ك', value: 4 }, { char: 'ل', value: 2 },
    { char: 'م', value: 2 }, { char: 'ن', value: 2 }, { char: 'ه', value: 3 },
    { char: 'و', value: 2 }, { char: 'ي', value: 2 },
    // Grammatical Chunks
    { char: 'ال', display: 'الـ', value: 3 },
    { char: 'ات', display: 'ـات', value: 5 },
    { char: 'ون', display: 'ـون', value: 5 },
    { char: 'ين', display: 'ـين', value: 5 },
    { char: 'مست', display: 'مستـ', value: 8 }
];

// Using FULL_DICTIONARY exported from arabic_dictionary.js

// Poker Hand Equivalents mapped to Word Lengths
const HAND_TYPES = {
    2: { name: 'كلمة ثنائية', baseMult: 2, baseChips: 10 },
    3: { name: 'كلمة ثلاثية', baseMult: 3, baseChips: 30 },
    4: { name: 'كلمة رباعية', baseMult: 4, baseChips: 60 },
    5: { name: 'كلمة خماسية', baseMult: 6, baseChips: 120 },
    6: { name: 'كلمة سداسية', baseMult: 8, baseChips: 200 },
    7: { name: 'كلمة سباعية', baseMult: 12, baseChips: 300 }
};

const JOKER_REGISTRY = [
    {
        id: 'j_poet', name: 'الشاعر', desc: '+30 نقطة', cost: 4, type: 'chips',
        calc: (ctx) => 30
    },
    {
        id: 'j_duality', name: 'المثنى', desc: '+4 مضاعف للكلمات الثنائية', cost: 5, type: 'mult',
        calc: (ctx) => ctx.len === 2 ? 4 : 0
    },
    {
        id: 'j_length', name: 'الطويل', desc: '+3 مضاعف لكل حرف بعد الرابع', cost: 6, type: 'mult',
        calc: (ctx) => ctx.len > 4 ? (ctx.len - 4) * 3 : 0
    },
    {
        id: 'j_master', name: 'العلامة', desc: 'x2 للمضاعف النهائي', cost: 8, type: 'x_mult',
        calc: (ctx) => 2
    },
    {
        id: 'j_calligrapher', name: 'الخطاط', desc: '+10 نقاط لكل حرف منقوط', cost: 5, type: 'chips',
        calc: (ctx) => {
            const dotted = ['ب', 'ت', 'ث', 'ج', 'خ', 'ذ', 'ز', 'ش', 'ض', 'ظ', 'غ', 'ف', 'ق', 'ن', 'ي', 'ة'];
            let count = 0;
            for (let char of ctx.word) if (dotted.includes(char)) count++;
            return count * 10;
        }
    },
    {
        id: 'j_purist', name: 'الصافي', desc: 'x3 مضاعف إذا خلت الكلمة من النقاط', cost: 7, type: 'x_mult',
        calc: (ctx) => {
            const dotted = ['ب', 'ت', 'ث', 'ج', 'خ', 'ذ', 'ز', 'ش', 'ض', 'ظ', 'غ', 'ف', 'ق', 'ن', 'ي', 'ة'];
            for (let char of ctx.word) if (dotted.includes(char)) return 1;
            return 3;
        }
    },
    {
        id: 'j_grammarian', name: 'النحوي', desc: '+5 مضاعف إذا بدأت الجملة بـ "ال"', cost: 6, type: 'mult',
        calc: (ctx) => ctx.word.startsWith("ال") ? 5 : 0
    },
    {
        id: 'j_echo', name: 'الصدى', desc: 'x2 مضاعف إذا احتوت الكلمة على حرف متكرر', cost: 6, type: 'x_mult',
        calc: (ctx) => {
            let unique = new Set(ctx.word.split(''));
            return unique.size < ctx.word.length ? 2 : 1;
        }
    },
    {
        id: 'j_hoarder', name: 'المكتنز', desc: '+15 نقطة لكل "تغيير" متبقي', cost: 5, type: 'chips',
        calc: (ctx) => ctx.state.discards * 15
    },
    {
        id: 'j_root', name: 'الجذر', desc: '+5 مضاعف للكلمات الثلاثية', cost: 4, type: 'mult',
        calc: (ctx) => ctx.len === 3 ? 5 : 0
    },
    {
        id: 'j_heavy', name: 'الثقيل', desc: '+40 نقطة للكلمات 5 حروف أو أكثر', cost: 5, type: 'chips',
        calc: (ctx) => ctx.len >= 5 ? 40 : 0
    },
    {
        id: 'j_merchant', name: 'التاجر', desc: '+1 مضاعف لكل 5$ تملكها', cost: 6, type: 'mult',
        calc: (ctx) => Math.floor(ctx.state.gold / 5)
    },
    {
        id: 'j_generous', name: 'الكريم', desc: '+20 نقطة لكل عالم (Scholar) تملكه', cost: 5, type: 'chips',
        calc: (ctx) => ctx.state.jokers.length * 20
    },
    {
        id: 'j_vowel', name: 'العلة', desc: '+15 نقطة لكل حرف علة (ا،و،ي)', cost: 4, type: 'chips',
        calc: (ctx) => {
            let count = 0;
            for (let char of ctx.word) if (['ا', 'و', 'ي'].includes(char)) count++;
            return count * 15;
        }
    },
    {
        id: 'j_void', name: 'الفراغ', desc: 'x3 مضاعف إذا لعبت كلمة من 4 حروف أو أقل', cost: 6, type: 'x_mult',
        calc: (ctx) => ctx.len <= 4 ? 3 : 1
    },
    {
        id: 'j_shipwright', name: 'صانع السفن', desc: '+15 مضاعف إذا كانت المرساة الحرف الأول أو الأخير', cost: 6, type: 'mult',
        calc: (ctx) => {
            let bonus = 0;
            ctx.state.anchors.forEach(a => {
                let idx = ctx.state.played.findIndex(c => c.id === a.id);
                if (idx === 0 || idx === ctx.state.played.length - 1) bonus += 15;
            });
            return bonus;
        }
    },
    {
        id: 'j_smuggler', name: 'المهرب', desc: 'يسمح بلعب الكلمات بدون استخدام المرساة الأساسية', cost: 8, type: 'chips',
        calc: (ctx) => 0
    },
    {
        id: 'j_shifting', name: 'الرمال المتحركة', desc: 'x3 للمضاعف، تتغير المرساة بعد كل رمية', cost: 7, type: 'x_mult',
        calc: (ctx) => 3
    },
    {
        id: 'j_librarian', name: 'المكتبي', desc: '+2 مضاعف لكل حرف فريد في الكلمة', cost: 5, type: 'mult',
        calc: (ctx) => new Set(ctx.word.split('')).size * 2
    },
    {
        id: 'j_compass', name: 'البوصلة', desc: '+25 نقطة إذا بدأت وانتهت الكلمة بنفس الحرف', cost: 4, type: 'chips',
        calc: (ctx) => ctx.word.length >= 2 && ctx.word[0] === ctx.word[ctx.word.length - 1] ? 25 : 0
    },
    {
        id: 'j_alchemist', name: 'الكيميائي', desc: 'يضاعف نقاط المرساة', cost: 6, type: 'chips',
        calc: (ctx) => {
            let bonus = 0;
            ctx.state.anchors.forEach(a => {
                if (ctx.state.played.find(c => c.id === a.id)) bonus += a.value;
            });
            return bonus;
        }
    },
    {
        id: 'j_tide', name: 'المد', desc: 'x1.5 مضاعف إذا كانت النقاط أقل من 50% من الهدف', cost: 5, type: 'x_mult',
        calc: (ctx) => ctx.state.score < ctx.state.target * 0.5 ? 1.5 : 1
    },
    {
        id: 'j_crown', name: 'التاج', desc: '+50 نقطة للكلمات من 6 حروف أو أكثر', cost: 5, type: 'chips',
        calc: (ctx) => ctx.len >= 6 ? 50 : 0
    }
];

const INK_POT_REGISTRY = [
    { id: 'i_gold', name: 'قطرة ذهب', desc: '+8$', cost: 3, type: 'consumable', use: () => { state.gold += 8; } },
    { id: 'i_plays', name: 'حبر الهمة', desc: '+2 العب (Plays) هذه الجولة', cost: 4, type: 'consumable', use: () => { state.plays += 2; } },
    { id: 'i_discards', name: 'حبر التغيير', desc: '+2 تغيير (Discards) هذه الجولة', cost: 4, type: 'consumable', use: () => { state.discards += 2; } },
    { id: 'i_wealth', name: 'حبر الثروة', desc: 'مضاعفة الذهب الحالي (الحد الأقصى 20$)', cost: 6, type: 'consumable', use: () => { state.gold += Math.min(state.gold, 20); } },
    { id: 'i_sniper', name: 'حبر القناص', desc: 'يقلل الهدف بنسبة 25%', cost: 5, type: 'consumable', use: () => { state.target = Math.floor(state.target * 0.75); render(); } },
    { id: 'i_eraser', name: 'حبر الممحاة', desc: 'يزيل جميع المراسي المطلوبة هذه الجولة', cost: 5, type: 'consumable', use: () => { state.anchors = []; render(); } },
    {
        id: 'i_shapeshift', name: 'حبر التحول', desc: 'يستبدل المرساة الحالية بحرف عشوائي جديد', cost: 4, type: 'consumable', use: () => {
            if (state.anchors.length > 0) {
                let template = ALL_LETTERS[Math.floor(Math.random() * 28)];
                state.anchors[0] = {
                    id: `c-ink-anchor`, char: template.char, display: template.display, value: Math.floor(template.value / 2) || 1, isAnchor: true, rewardType: null, rewardValue: 0, constraint: 'contains'
                };
            }
            render();
        }
    }
];

const BOSS_REGISTRY = {
    'chain': {
        name: 'الزعيم: السلسلة (The Chain)', effect: 'مطلوب مرساة إضافية (Needs extra anchor)', apply: () => {
            let template = ALL_LETTERS[Math.floor(Math.random() * 28)];
            state.anchors.push({
                id: `c-boss-anchor`, char: template.char, display: template.display, value: Math.floor(template.value / 2) || 1, isAnchor: true, rewardType: null, rewardValue: 0, constraint: 'contains'
            });
        }
    },
    'wall': { name: 'الزعيم: الجدار (The Wall)', effect: 'الهدف x2', apply: () => { state.target *= 2; } },
    'silence': { name: 'الزعيم: الصمت (The Silence)', effect: '0 تغييرات (No Discards)', apply: () => { state.discards = 0; } },
    'cell': { name: 'الزعيم: الزنزانة (The Cell)', effect: '-1 العب (Minus 1 Play)', apply: () => { state.plays = Math.max(1, state.plays - 1); } },
    'drought': { name: 'الزعيم: الجفاف (The Drought)', effect: 'يد من 5 بدل 8', apply: () => { /* handled in generateHand */ } },
    'maze': {
        name: 'الزعيم: المتاهة (The Maze)', effect: 'المرساة يجب أن تكون الحرف الأول', apply: () => {
            state.anchors.forEach(a => { a.constraint = 'start'; });
        }
    }
};

let state = {
    ante: 1,
    blindName: 'الرهان الصغير (Small Blind)',
    score: 0,
    target: 300,
    plays: 4,
    discards: 3,
    gold: 0,
    jokers: [], // active scholars/jokers
    consumables: [], // active ink pots
    shopItems: [], // items in shop currently
    blindIndex: 0, // 0: Small, 1: Big, 2: Boss
    anchors: [], // Required letters on board
    map: {
        currentNodeType: null, // 'battle', 'elite', 'shop', 'boss', etc.
        currentRow: 0,
        nodes: [], // Will store the generated map layout
        edges: []  // Connections between nodes
    },
    hand: [], // Array of objects
    played: [], // Array of objects currently played
    selectedHandIds: [], // Allow multiple selection for discard
    nextId: 1,
    roundOver: false,
    roundWon: false,
    isCheckingWord: false
};

// Map Generation Constants
const MAP_LAYERS = 7;
const MAP_WIDTH = 3;

// Game State Enum-like object to know what screen we're on
const GAME_SCENE = {
    MAP: 'map',
    BATTLE: 'battle',
    SHOP: 'shop',
    EVENT: 'event'
};
let currentScene = GAME_SCENE.BATTLE; // start in battle for ante 1 for now, or map?

// Initialization
function initGame() {
    state.hand = [];
    state.played = [];
    state.selectedHandIds = [];
    state.roundOver = false;
    state.roundWon = false;

    generateHand();
    generateAnchor();

    render();
}

function generateHand() {
    state.hand = [];
    let handSize = (state.activeBoss === 'drought') ? 5 : 8;
    for (let i = 0; i < handSize; i++) {
        state.hand.push(getRandomLetter());
    }
}

function generateAnchor() {
    let aTemplate = ALL_LETTERS[Math.floor(Math.random() * 28)];
    state.anchorCard = { id: 'c-anchor', char: aTemplate.char, display: aTemplate.display, value: Math.floor(aTemplate.value / 2) || 1, isAnchor: true };
}

function getRandomLetter() {
    // Basic weight to draw more common letters could be added here
    const template = ALL_LETTERS[Math.floor(Math.random() * ALL_LETTERS.length)];
    return { id: `c-${state.nextId++}`, char: template.char, display: template.display, value: template.value };
}

// Interaction Logic
function handleHandLetterClick(id) {
    if (state.roundOver) return;
    const selIndex = state.selectedHandIds.indexOf(id);
    if (selIndex !== -1) {
        state.selectedHandIds.splice(selIndex, 1);
    } else {
        const cardIndex = state.hand.findIndex(c => c.id === id);
        if (cardIndex !== -1) {
            const card = state.hand.splice(cardIndex, 1)[0];
            state.played.push(card);
            const sIdx = state.selectedHandIds.indexOf(id);
            if (sIdx > -1) state.selectedHandIds.splice(sIdx, 1);
        }
    }
    render();
}

function handlePlayedLetterClick(id) {
    if (state.roundOver) return;
    const cardIndex = state.played.findIndex(c => c.id === id);
    if (cardIndex !== -1) {
        const card = state.played.splice(cardIndex, 1)[0];
        if (!card.isAnchor) {
            state.hand.push(card);
        }
    }
    render();
}

function handleAnchorClick(index) {
    if (state.roundOver) return;
    let anchor = state.anchors[index];
    // Move anchor to played if it's not already there
    if (!state.played.find(c => c.id === anchor.id)) {
        state.played.push(anchor);
        render();
    }
}

function handleRecallCards() {
    if (state.roundOver) return;
    if (state.played.length > 0) {
        state.played.forEach(card => {
            if (!card.isAnchor) state.hand.push(card);
        });
        state.played = [];
    }
    state.selectedHandIds = [];
    render();
}

function handleDiscard() {
    if (state.roundOver || state.discards <= 0 || state.hand.length === 0) return;

    // Discard all remaining hand
    state.hand = [];

    // Draw to refill hand + played up to 8
    const needToDraw = 8 - state.played.length;
    for (let i = 0; i < needToDraw; i++) {
        state.hand.push(getRandomLetter());
    }

    state.discards--;

    // Shifting Sands effect
    if (state.jokers.some(j => j.id === 'j_shifting')) {
        randomizeAnchors();
    }

    render();
}

function randomizeAnchors() {
    state.anchors.forEach((a, i) => {
        let template = ALL_LETTERS[Math.floor(Math.random() * 28)];
        state.anchors[i] = {
            id: `c-shift-anchor-${i}`, char: template.char, display: template.display, value: Math.floor(template.value / 2) || 1, isAnchor: true, rewardType: null, rewardValue: 0, constraint: 'contains'
        };
    });
}

// Poker Shapes Engine: Detect structural patterns
function getWordShape(word, len, defaultTypeData) {
    if (len < 3) return defaultTypeData; // Only shape up 3+ length

    let isPalindrome = word === word.split('').reverse().join('');
    let isTwin = word[0] === word[word.length - 1];

    const dotted = ['ب', 'ت', 'ث', 'ج', 'خ', 'ذ', 'ز', 'ش', 'ض', 'ظ', 'غ', 'ف', 'ق', 'ن', 'ي', 'ة'];
    let hasDot = false;
    let hasAllDots = true;
    for (let char of word) {
        if (dotted.includes(char)) hasDot = true;
        else hasAllDots = false;
    }

    let isClean = !hasDot;
    let isAllDots = hasAllDots;

    // Evaluate in order of rarity/priority. Replaces the default length-based rank.
    // BaseMult and BaseChips scale off the original length, plus a huge bonus.
    if (isPalindrome && len >= 3) {
        return { name: 'المتموجة (Palindrome)', baseMult: defaultTypeData.baseMult + 6, baseChips: defaultTypeData.baseChips + 80 };
    }
    if (isClean && len >= 3) {
        return { name: 'الصافية (Clean Word)', baseMult: defaultTypeData.baseMult + 3, baseChips: defaultTypeData.baseChips + 40 };
    }
    if (isAllDots && len >= 3) {
        return { name: 'المنقطة (Solid Dots)', baseMult: defaultTypeData.baseMult + 4, baseChips: defaultTypeData.baseChips + 50 };
    }
    if (isTwin && len >= 4) {
        return { name: 'التوأم (The Twin)', baseMult: defaultTypeData.baseMult + 2, baseChips: defaultTypeData.baseChips + 20 };
    }

    // New Shape: The Storm - all high-value letters (>=4)
    let allHighValue = true;
    for (let char of word) {
        let letterInfo = ALL_LETTERS.find(l => l.char === char);
        if (!letterInfo || letterInfo.value < 4) { allHighValue = false; break; }
    }
    if (allHighValue && len >= 3) {
        return { name: 'العاصفة (The Storm)', baseMult: defaultTypeData.baseMult + 5, baseChips: defaultTypeData.baseChips + 60 };
    }

    return defaultTypeData;
}

function calculateCurrentScore() {
    let word = "";
    let baseChips = 0;

    state.played.forEach(card => {
        word += card.char;
        baseChips += card.value;
    });

    let len = word.length;
    let typeData = HAND_TYPES[len] || { name: 'حروف', baseMult: 1, baseChips: 0 };

    // Upgrade typeData if it fits a Poker Shape
    typeData = getWordShape(word, len, typeData);

    // Total Chips = (Sum of letter chips + Hand Type Base Chips)
    let totalBase = baseChips + typeData.baseChips;
    let mult = typeData.baseMult;

    let ctx = { word, len, state };

    // Anchor Rewards
    state.played.forEach(card => {
        if (card.isAnchor && card.rewardType) {
            if (card.rewardType === 'chips') {
                totalBase += card.rewardValue;
            } else if (card.rewardType === 'mult') {
                mult *= card.rewardValue; // x1.5 mult
            }
        }
    });

    // Pass 1: Add Chips
    state.jokers.forEach(joker => {
        if (joker.type === 'chips') totalBase += joker.calc(ctx);
    });

    // Pass 2: Add Mult
    state.jokers.forEach(joker => {
        if (joker.type === 'mult') mult += joker.calc(ctx);
    });

    // Pass 3: Multiply Mult
    state.jokers.forEach(joker => {
        if (joker.type === 'x_mult') mult *= joker.calc(ctx);
    });

    return { word, totalBase, mult, typeName: typeData.name };
}

// Advanced Offline Arabic Stemmer specifically for our 275k Dictionary
// Two-tier suffix system:
//   Tier 1 (Pronoun suffixes): ه, ك, ي, ا — allowed with 2-letter stems (حز+ه = حزه)
//   Tier 2 (Grammatical suffixes): ات, ون, ين, etc. — require 3-letter stems
function validateWordOffline(rawWord) {
    if (typeof FULL_DICTIONARY === 'undefined') {
        console.error("FATAL ERROR: FULL_DICTIONARY is undefined in validateWordOffline!");
        return false;
    }

    if (FULL_DICTIONARY.includes(rawWord)) return true;

    const prefixes = [
        'وبال', 'وفال', 'وكال', 'ولل',
        'وال', 'فال', 'بال', 'كال', 'يست', 'تست', 'مست', 'است',
        'ال', 'لل', 'سي', 'ست', 'سن', 'سأ'
    ];

    // Tier 2: grammatical suffixes (need 3+ letter stem)
    const gramSuffixes = [
        'كما', 'هما', 'كمو', 'همو', 'تين', 'تان',
        'ها', 'هم', 'هن', 'كم', 'كن', 'نا', 'وا', 'ون', 'ين', 'ان', 'ات', 'تم', 'تن', 'ني', 'ته'
    ];

    // Tier 1: pronoun suffixes (safe with 2+ letter stem)
    const pronounSuffixes = ['ه', 'ك', 'ي', 'ا', 'ة'];

    // --- Pronoun suffix pass (stem >= 2) ---
    for (let suf of pronounSuffixes) {
        if (rawWord.endsWith(suf) && rawWord.length > suf.length) {
            let stem = rawWord.slice(0, -suf.length);
            if (stem.length >= 2 && FULL_DICTIONARY.includes(stem)) return true;
            // Ta marbuta swap: if suffix is ي/ك/ه and stem ends with ت, try ة
            if (stem.length >= 2 && stem.endsWith('ت')) {
                let alt = stem.slice(0, -1) + 'ة';
                if (FULL_DICTIONARY.includes(alt)) return true;
            }
        }
    }

    // --- Grammatical suffix pass (stem >= 3) ---
    for (let suf of gramSuffixes) {
        if (rawWord.endsWith(suf)) {
            let stem = rawWord.slice(0, -suf.length);
            if (stem.length >= 3 && FULL_DICTIONARY.includes(stem)) return true;
        }
    }

    // --- Prefix pass (stem >= 3) ---
    for (let pref of prefixes) {
        if (rawWord.startsWith(pref)) {
            let stem = rawWord.slice(pref.length);
            if (stem.length >= 3 && FULL_DICTIONARY.includes(stem)) return true;
        }
    }

    // --- Combined prefix + suffix pass ---
    for (let pref of prefixes) {
        if (rawWord.startsWith(pref)) {
            let cutFront = rawWord.slice(pref.length);
            // Try pronoun suffixes with 2+ stem
            for (let suf of pronounSuffixes) {
                if (cutFront.endsWith(suf) && cutFront.length > suf.length) {
                    let stem = cutFront.slice(0, -suf.length);
                    if (stem.length >= 2 && FULL_DICTIONARY.includes(stem)) return true;
                    if (stem.length >= 2 && stem.endsWith('ت')) {
                        let alt = stem.slice(0, -1) + 'ة';
                        if (FULL_DICTIONARY.includes(alt)) return true;
                    }
                }
            }
            // Try grammatical suffixes with 3+ stem
            for (let suf of gramSuffixes) {
                if (cutFront.endsWith(suf)) {
                    let stem = cutFront.slice(0, -suf.length);
                    if (stem.length >= 3) {
                        if (FULL_DICTIONARY.includes(stem)) return true;
                        if (stem.endsWith('ت')) {
                            let alt = stem.slice(0, -1) + 'ة';
                            if (FULL_DICTIONARY.includes(alt)) return true;
                        }
                    }
                }
            }
        }
    }

    return false;
}

function handlePlayWord() {
    if (state.roundOver || state.plays <= 0) {
        return;
    }

    // Check Anchor Constraints (All active anchors must be played)
    if (state.anchors.length > 0) {
        let missing = [];
        let positionalFailed = false;

        // "The Smuggler" Joker bypasses all anchor checks
        const hasSmuggler = state.jokers.some(j => j.id === 'j_smuggler');

        if (!hasSmuggler) {
            state.anchors.forEach(a => {
                let cardInPlay = state.played.find(c => c.id === a.id);
                // The actual word string formed by the player
                let wordStr = state.played.map(c => c.char).join('');

                if (a.constraint === 'root') {
                    // All characters from the root must be present
                    let rootChars = a.char.split('');
                    let hasAll = rootChars.every(rc => wordStr.includes(rc));
                    if (!hasAll && !cardInPlay) missing.push(a); // Fail if not present or explicitly played
                } else {
                    // Standard / Positional anchors must be physically dragged/clicked into play
                    if (!cardInPlay) {
                        missing.push(a);
                    } else {
                        // Card is in play, check positional constraints
                        let playedIndex = state.played.findIndex(c => c.id === a.id);
                        if (a.constraint === 'start' && playedIndex !== 0) {
                            positionalFailed = true;
                        } else if (a.constraint === 'end' && playedIndex !== state.played.length - 1) {
                            positionalFailed = true;
                        }
                    }
                }
            });

            if (missing.length > 0) {
                showFeedback("يجب استخدام الحرف الأساسي", "Missing Anchor!");
                return;
            }
            if (positionalFailed) {
                showFeedback("موقع الحرف الأساسي خاطئ", "Wrong Position!");
                return;
            }
        }
    }

    const { word, totalBase, mult, typeName } = calculateCurrentScore();

    if (word.length < 2) {
        showFeedback("كلمة قصيرة!", "Too short");
        return;
    }

    // Instant offline 12-million word coverage via Stemming
    if (!validateWordOffline(word)) {
        showFeedback("غير معروفة", "Not Valid");
        return;
    }

    const total = totalBase * mult;
    state.score += total;
    state.plays--;

    showFeedback(`${word}`, `+${total} (${totalBase} x ${mult}) [${typeName}]`);

    // Played cards are consumed
    state.played = [];

    // Refill hand up to 8
    const needToDraw = 8 - state.hand.length;
    for (let i = 0; i < needToDraw; i++) {
        state.hand.push(getRandomLetter());
    }

    checkRoundState();
    render();
}

function checkRoundState() {
    if (state.score >= state.target) {
        state.roundOver = true;
        state.roundWon = true;

        // Base 3$ + 1$ for each unused play
        const earned = 3 + state.plays;
        state.gold += earned;

        showFeedback("انتصار!", `+${earned}$`);

        // Auto-transition back to the map when winning
        setTimeout(() => {
            showMapScene();
        }, 2200);

    } else if (state.plays <= 0) {
        state.roundOver = true;
        state.roundWon = false;
        showFeedback("خسارة", "Game Over");
    }
}

// Blind Selection System
function startGame() {
    try {
        console.log("startGame() called");
        state.score = 0;
        state.gold = 5; // Start with a little gold
        state.ante = 1;
        state.blindName = 'الرهان الصغير'; // Default for first battle
        state.target = 300; // Default for first battle
        state.plays = 4;
        state.discards = 3;
        state.jokers = [];
        state.consumables = [];
        state.hand = [];
        state.played = [];
        state.activeBoss = null; // This was not in the original state, adding for consistency with diff

        console.log("Generating map...");
        generateMap(); // Generate the map for Ante 1

        // Hide battle elements initially
        const mapOverlay = document.getElementById('map-overlay');
        if (mapOverlay) {
            mapOverlay.classList.remove('hidden');
            mapOverlay.style.display = 'flex';
        } else {
            console.error("COULD NOT FIND #map-overlay IN DOM!");
        }

        console.log("Map generated, calling showMapScene()");
        showMapScene(); // Start on the map screen
    } catch (e) {
        console.error("FATAL ERROR IN STARTGAME:", e);
    }
}

console.log("Script loaded.");
console.log("Initializing game...");

// ----------------------------------------------------------------------------
// MAP GENERATION & LOGIC
// ----------------------------------------------------------------------------
function generateMap() {
    state.map.nodes = [];
    state.map.edges = [];
    state.map.currentRow = 0;
    state.map.currentNodeType = null;

    // Build layers from bottom (row 0) to top (layer 6 = boss)
    for (let row = 0; row < MAP_LAYERS; row++) {
        let rowNodes = [];
        let numNodesInRow = (row === 0 || row === MAP_LAYERS - 1) ? 1 : Math.floor(Math.random() * 2) + 2; // 1 at start/end, 2-3 in middle

        for (let col = 0; col < numNodesInRow; col++) {
            let type = 'battle';
            let icon = '⚔️';

            if (row === 0) {
                type = 'battle'; // Start is always battle
            } else if (row === MAP_LAYERS - 1) {
                type = 'boss';
                icon = '👹';
            } else {
                // Randomize type
                let rand = Math.random();
                if (rand < 0.4) { type = 'battle'; icon = '⚔️'; }
                else if (rand < 0.6) { type = 'elite'; icon = '💀'; }
                else if (rand < 0.8) { type = 'shop'; icon = '💰'; }
                else { type = 'treasure'; icon = '🎁'; }
            }

            rowNodes.push({
                id: `node-${row}-${col}`,
                row: row,
                col: col,
                type: type,
                icon: icon,
                completed: false,
                isCurrent: (row === 0 && col === 0),
                parents: [] // indices of parents in row+1
            });
        }
        state.map.nodes.push(rowNodes);
    }

    // Connect nodes
    for (let row = 0; row < MAP_LAYERS - 1; row++) {
        let currentLevel = state.map.nodes[row];
        let nextLevel = state.map.nodes[row + 1];

        // Ensure every node in current level connects to at least one in next level
        currentLevel.forEach((node, idx) => {
            // Simple logic: connect to same index if exists, or last available
            let targetIdx = Math.min(idx, nextLevel.length - 1);
            state.map.edges.push({ from: node.id, to: nextLevel[targetIdx].id });
            node.parents.push(nextLevel[targetIdx].id);

            // Add some cross-connections randomly
            if (nextLevel.length > 1 && Math.random() > 0.5) {
                let otherIdx = targetIdx === 0 ? 1 : targetIdx - 1;
                if (!node.parents.includes(nextLevel[otherIdx].id)) {
                    state.map.edges.push({ from: node.id, to: nextLevel[otherIdx].id });
                    node.parents.push(nextLevel[otherIdx].id);
                }
            }
        });
    }
}

function renderMap() {
    const mapContainer = document.getElementById('map-nodes-container');
    if (!mapContainer) return;
    mapContainer.innerHTML = '';

    // We render an SVG for lines behind the HTML nodes
    let svgHtml = `<svg class="map-edges-svg" style="position:absolute; top:0; left:0; width:100%; height:100%; pointer-events:none; z-index:1;">`;

    const nodeElements = {};

    // Render HTML Nodes first
    state.map.nodes.forEach((rowNodes, rowIdx) => {
        const rowEl = document.createElement('div');
        rowEl.className = 'map-row';
        rowEl.id = `map-row-${rowIdx}`;
        mapContainer.appendChild(rowEl);

        rowNodes.forEach(node => {
            const nEl = document.createElement('div');
            nEl.className = `map-node node-${node.type} ${node.completed ? 'completed' : ''} ${node.isCurrent ? 'current' : ''}`;

            // Lock logic:
            // - If row < state.map.currentRow, it's locked (past)
            // - If row == state.map.currentRow, it's clickable ONLY if it's connected to the last completed node
            let locked = true;
            if (rowIdx === state.map.currentRow) {
                if (rowIdx === 0) {
                    locked = false; // Starting row is always unlocked
                } else {
                    // Check if it's connected to the node we just completed in currentRow - 1
                    // For prototype, we'll allow clicking any node in the currentRow for simplicity
                    // To do proper pathing, we'd need to track EXACTLY which node we are on
                    locked = false;
                }
            }
            if (locked) nEl.classList.add('locked');

            nEl.id = node.id;
            nEl.innerHTML = node.icon;
            nEl.onclick = () => handleNodeClick(node);

            rowEl.appendChild(nEl);
        });
    });

    // We can't draw SVG lines perfectly without knowing absolute positions after layout.
    // For this prototype, we'll just show the HTML structure and worry about fancy lines later if needed,
    // or use CSS drawing.
    // Make sure overlay is visible
    document.getElementById('map-overlay').style.display = 'flex';
}

function handleNodeClick(node) {
    if (node.row !== state.map.currentRow) return; // Prevent skipping rows

    node.completed = true;
    node.isCurrent = false;
    state.map.currentNodeType = node.type;

    // Advance row
    state.map.currentRow++;

    // Transition to the appropriate scene based on node type
    const mapOverlay = document.getElementById('map-overlay');
    if (mapOverlay) {
        mapOverlay.classList.add('hidden');
        mapOverlay.style.display = 'none';
    }

    if (node.type === 'battle' || node.type === 'elite' || node.type === 'boss') {
        state.draftNextAction = () => startMapBattle(node.type, node.row);
        showAnchorDraft();
    } else if (node.type === 'shop') {
        proceedToShop();
    } else if (node.type === 'treasure') {
        // Just give gold and go back to map
        state.gold += 15;
        showFeedback("لقيت كنز! +15$", "Treasure Found!");
        setTimeout(() => {
            showMapScene();
            render(); // Changed from updateUI() to render() for consistency
        }, 2000);
    }
}

function startMapBattle(type, row) {
    currentScene = GAME_SCENE.BATTLE;
    state.plays = 4;
    state.discards = 3;
    state.roundOver = false;
    state.roundWon = false;

    // Show game elements
    document.querySelector('header').style.display = 'flex';
    document.querySelector('main').style.display = 'flex';

    // Row-based difficulty: each row up the map adds 10% to the target
    let rowMultiplier = 1 + (row || 0) * 0.1;

    if (type === 'battle') {
        state.target = Math.round(300 * Math.pow(1.5, state.ante - 1) * rowMultiplier / 50) * 50;
        state.activeBoss = null;
    } else if (type === 'elite') {
        state.target = Math.round(500 * Math.pow(1.5, state.ante - 1) * rowMultiplier / 50) * 50;
        state.activeBoss = null;
    } else if (type === 'boss') {
        state.target = Math.round(800 * Math.pow(1.5, state.ante - 1) * rowMultiplier / 50) * 50;

        let bossKeys = Object.keys(BOSS_REGISTRY);
        state.activeBoss = bossKeys[Math.floor(Math.random() * bossKeys.length)];

        showFeedback(BOSS_REGISTRY[state.activeBoss].name, "الزعيم!");
        if (BOSS_REGISTRY[state.activeBoss].apply) BOSS_REGISTRY[state.activeBoss].apply();
    }

    document.getElementById('target-score').innerText = Math.floor(state.target); // Changed from blindStats.baseTarget to target
    generateHand();
    // generateAnchor(); // Handled by drafting now!
    state.score = 0;
    render(); // Changed from updateUI() to render() for consistency
}

// ----------------------------------------------------------------------------
// ANCHOR DRAFTING LOGIC
// ----------------------------------------------------------------------------
function showAnchorDraft() {
    currentScene = GAME_SCENE.MAP; // UI-wise we are technically outside battle
    document.querySelector('header').style.display = 'none';
    document.querySelector('main').style.display = 'none';

    const mapOverlay = document.getElementById('map-overlay');
    if (mapOverlay) {
        mapOverlay.classList.add('hidden');
        mapOverlay.style.display = 'none';
    }

    const draftOverlay = document.getElementById('anchor-draft-overlay');
    if (draftOverlay) {
        draftOverlay.classList.remove('hidden');
        document.getElementById('draft-ante-display').innerText = state.ante;

        state.draftOptions = generateDraftOptions();
        renderDraftScreen();
    }
}

function generateDraftOptions() {
    let options = [];
    // Generate 3 unique letters with varying difficulty
    let usedIndices = new Set();

    for (let i = 0; i < 3; i++) {
        let idx;
        do {
            idx = Math.floor(Math.random() * ALL_LETTERS.length);
        } while (usedIndices.has(idx));
        usedIndices.add(idx);

        let template = ALL_LETTERS[idx];
        let option = {
            id: `c-draft-${i}`,
            char: template.char,
            display: template.display,
            value: Math.floor(template.value / 2) || 1,
            isAnchor: true,
            rewardType: null,
            rewardValue: 0
        };

        // Risk / Reward logic
        if (template.value >= 4) {
            // Hard letter
            let rand = Math.random();
            if (rand < 0.5) {
                option.rewardType = 'mult';
                option.rewardValue = 1.5; // x1.5 multiplier
                option.bonusName = 'المرساة الذهبية'; // Golden Anchor
            } else {
                option.rewardType = 'chips';
                option.rewardValue = 50 * state.ante;
                option.bonusName = 'المرساة الثقيلة'; // Heavy Anchor
            }
        } else {
            // Common letter
            option.bonusName = 'مرساة قياسية'; // Standard Anchor
        }

        options.push(option);
    }
    return options;
}

function renderDraftScreen() {
    const container = document.getElementById('draft-options-container');
    if (!container) return;
    container.innerHTML = '';

    state.draftOptions.forEach(opt => {
        let cardEl = document.createElement('div');
        cardEl.className = 'draft-card';
        cardEl.style.cssText = `
            background: #1e293b;
            border: 2px solid ${opt.rewardType ? '#f59e0b' : '#334155'};
            border-radius: 12px;
            padding: 20px;
            width: 200px;
            cursor: pointer;
            transition: all 0.2s;
            display: flex;
            flex-direction: column;
            align-items: center;
        `;
        cardEl.onmouseover = () => {
            cardEl.style.transform = 'translateY(-5px)';
            cardEl.style.boxShadow = `0 10px 20px rgba(${opt.rewardType ? '245, 158, 11' : '0, 0, 0'}, 0.3)`;
        };
        cardEl.onmouseout = () => {
            cardEl.style.transform = 'translateY(0)';
            cardEl.style.boxShadow = 'none';
        };
        cardEl.onclick = () => selectDraftAnchor(opt);

        let charDisplay = opt.display || opt.char;
        let fontSize = charDisplay.length > 1 ? "2.5rem" : "3.5rem";

        let rewardText = '';
        if (opt.rewardType === 'mult') {
            rewardText = `<div style="color: #ef4444; font-weight: bold; margin-top: 10px; font-size: 1.2rem;">x${opt.rewardValue} مضاعف</div>`;
        } else if (opt.rewardType === 'chips') {
            rewardText = `<div style="color: #3b82f6; font-weight: bold; margin-top: 10px; font-size: 1.2rem;">+${opt.rewardValue} نقطة</div>`;
        } else {
            rewardText = `<div style="color: #94a3b8; font-style: italic; margin-top: 10px;">بدون مكافأة</div>`;
        }

        cardEl.innerHTML = `
            <div style="font-weight: bold; color: ${opt.rewardType ? '#f59e0b' : '#cbd5e1'}; font-size: 1.1rem; margin-bottom: 15px;">
                ${opt.bonusName}
            </div>
            <div class="card ink-card" style="position: static; transform: none; box-shadow: none;">
                <span class="char" style="font-size: ${fontSize}; color: #f59e0b;">${charDisplay}</span>
                <span class="val">${opt.value}</span>
            </div>
            ${rewardText}
        `;
        container.appendChild(cardEl);
    });
}

function selectDraftAnchor(option) {
    state.anchors = [option];

    // Hide draft overlay
    const draftOverlay = document.getElementById('anchor-draft-overlay');
    if (draftOverlay) draftOverlay.classList.add('hidden');

    if (state.draftNextAction) {
        let action = state.draftNextAction;
        state.draftNextAction = null;
        action();
    } else {
        // Fallback
        showMapScene();
    }
}

// ----------------------------------------------------------------------------
// MAP LOGIC
// ----------------------------------------------------------------------------

function showMapScene() {
    currentScene = GAME_SCENE.MAP;

    // Hide game elements
    document.querySelector('header').style.display = 'none';
    document.querySelector('main').style.display = 'none';

    // If we finished a boss, generate next Map and show Draft first
    if (state.map.currentRow >= MAP_LAYERS) {
        state.ante++; // Changed from blindStats.currentAnte to ante
        generateMap();
    }

    const mapOverlay = document.getElementById('map-overlay');
    if (mapOverlay) {
        mapOverlay.classList.remove('hidden');
        mapOverlay.style.display = 'flex';
    }

    const displayEl = document.getElementById('map-ante-display');
    if (displayEl) displayEl.innerText = state.ante;

    renderMap();

    // Safety check: force render to clear out any old values or states from HTML
    render();
}

// ----------------------------------------------------------------------------
// END MAP LOGIC
// ----------------------------------------------------------------------------

function proceedToBlindSelect() {
    // We are replacing Blind Select with Map!
    // Simply route back to the map scene.
    showMapScene();
}

function renderBlindSelect() {
    // This function is now obsolete as blind selection is replaced by map
    // Keeping it empty to avoid errors if still called
}

function selectBlind(type) {
    // This function is now obsolete as blind selection is replaced by map
}

function skipBlind(type) {
    // This function is now obsolete as blind selection is replaced by map
}

// Shop Logic
function proceedToShop() {
    generateShopItems();
    document.getElementById('shop-overlay').classList.remove('hidden');
    renderShop();
}

function generateShopItems() {
    state.shopItems = [];
    // Shop has 2 Jokers and 1 Consumable usually
    let jPool = [...JOKER_REGISTRY];
    for (let i = 0; i < 2; i++) {
        if (jPool.length === 0) break;
        let rIndex = Math.floor(Math.random() * jPool.length);
        state.shopItems.push({ ...jPool.splice(rIndex, 1)[0], shopId: Math.random() });
    }

    // Add 1 Ink Pot (Consumable)
    let cPool = [...INK_POT_REGISTRY];
    if (cPool.length > 0) {
        let rIndex = Math.floor(Math.random() * cPool.length);
        state.shopItems.push({ ...cPool[rIndex], shopId: Math.random() }); // ink pots don't remove from pool, you can buy many
    }
}

function renderShop() {
    document.getElementById('shop-gold-balance').innerText = `$${state.gold}`;
    const itemsEl = document.getElementById('shop-items');
    itemsEl.innerHTML = '';

    state.shopItems.forEach(item => {
        const canAfford = state.gold >= item.cost;
        const isConsumable = item.type === 'consumable';
        const noRoom = isConsumable ? state.consumables.length >= 2 : state.jokers.length >= 5;
        const disabled = (!canAfford || noRoom) ? 'disabled' : '';
        const btnText = noRoom ? 'ممتلئ' : (canAfford ? 'شراء' : 'لا يكفي');

        let cardClass = isConsumable ? 'consumable-card' : 'shop-item-card';

        const cardHTML = `
            <div class="${cardClass}" style="width: 140px; height: auto; min-height: 150px;">
                <div class="j-name">${item.name}</div>
                <div class="j-desc">${item.desc}</div>
                <div style="color:var(--gold); font-weight:bold; margin-top: 10px;">$${item.cost}</div>
                <button class="btn-buy" ${disabled} onclick="buyShopItem(${item.shopId})" style="margin-top:auto;">${btnText}</button>
            </div>
        `;
        itemsEl.innerHTML += cardHTML;
    });

    // Sync main UI gold
    document.getElementById('gold-display').innerText = `$${state.gold}`;
}

function buyShopItem(shopId) {
    const i = state.shopItems.findIndex(x => x.shopId === shopId);
    if (i > -1) {
        const item = state.shopItems[i];

        const isConsumable = item.type === 'consumable';
        const hasRoom = isConsumable ? state.consumables.length < 2 : state.jokers.length < 5;

        if (state.gold >= item.cost && hasRoom) {
            state.gold -= item.cost;
            if (isConsumable) {
                state.consumables.push({ ...item, runtimeId: Math.random() });
            } else {
                state.jokers.push({ ...item, runtimeId: Math.random() });
            }
            state.shopItems.splice(i, 1);
            renderShop();
            renderJokers();
        }
    }
}

function leaveShop() {
    document.getElementById('shop-overlay').classList.add('hidden');
    // Return to Map!
    showMapScene();
}

function useConsumable(runtimeId) {
    const i = state.consumables.findIndex(c => c.runtimeId === runtimeId);
    if (i > -1) {
        const item = state.consumables[i];
        item.use();
        showFeedback("تم استخدام استهلاك", item.name);
        state.consumables.splice(i, 1);
        renderJokers();
        render();
    }
}

function renderJokers() {
    const rackEl = document.getElementById('joker-rack');
    rackEl.innerHTML = '';

    // Render owned jokers
    state.jokers.forEach(j => {
        rackEl.innerHTML += `
            <div class="joker-card tooltip-container">
                <div class="j-name">${j.name}</div>
                <div class="j-desc">${j.desc}</div>
                <span class="tooltip-text">${j.desc}</span>
            </div>
        `;
    });

    // Render empty jokers
    for (let i = state.jokers.length; i < 5; i++) {
        rackEl.innerHTML += `<div class="empty-joker-slot"></div>`;
    }

    const cRackEl = document.getElementById('consumable-rack');
    if (cRackEl) {
        cRackEl.innerHTML = '';
        state.consumables.forEach(c => {
            cRackEl.innerHTML += `
                <div class="consumable-card tooltip-container" onclick="useConsumable(${c.runtimeId})">
                    <div class="j-name">${c.name}</div>
                    <div class="j-desc">${c.desc}</div>
                    <span class="tooltip-text">انقر للاستخدام (Click to Use): ${c.desc}</span>
                </div>
            `;
        });

        for (let i = state.consumables.length; i < 2; i++) {
            cRackEl.innerHTML += `<div class="empty-consumable-slot"></div>`;
        }
    }
}

// Dictionary Tester
function handleTestWord() {
    const inputEl = document.getElementById('test-word-input');
    const resultEl = document.getElementById('test-result');
    const word = inputEl.value.trim();

    if (word.length === 0) {
        resultEl.innerText = "";
        return;
    }

    // Strip diacritics / tashkeel automatically if user types them
    let cleanWord = word.replace(/[\u064B-\u065F\u0670]/g, '');

    if (validateWordOffline(cleanWord)) {
        resultEl.innerText = `الكلمة "${cleanWord}" صحيحة! (Valid)`;
        resultEl.className = "test-result valid";
    } else {
        resultEl.innerText = `الكلمة "${cleanWord}" غير معروفة! (Invalid)`;
        resultEl.className = "test-result invalid";
    }
}

// Logic to find possible words and analysis
function getWordCounts(handLetters) {
    let counts = { 2: { count: 0, words: [] }, 3: { count: 0, words: [] }, 4: { count: 0, words: [] }, 5: { count: 0, words: [] }, 6: { count: 0, words: [] } };
    let totalFound = 0;

    let startCharFreqs = {};
    let endCharFreqs = {};

    if (typeof FULL_DICTIONARY === 'undefined') {
        console.error("FATAL ERROR: FULL_DICTIONARY is undefined!");
        return { counts, bestStart: null, bestEnd: null };
    }

    // Performance optimization: we don't want to loop 270k words on every single click/render
    // For the prototype, we just find the first ~150 words or limit the search
    for (let word of FULL_DICTIONARY) {
        // Enforce Anchor Constraint in Hints
        if (state.anchors.length > 0 && state.anchors.some(a => !word.includes(a.char))) continue;

        if (canFormWord(word, handLetters)) {
            let len = word.length;
            if (len > 6) len = 6;
            if (counts[len] !== undefined) {
                counts[len].count++;
                // keep up to 15 examples per length to show the user
                if (counts[len].words.length < 15) counts[len].words.push(word);
                totalFound++;

                // Track start and end frequencies, heavily weighted towards longer words
                let firstChar = word[0];
                let lastChar = word[word.length - 1];
                let weight = Math.pow(len, 3); // 2-letter=8, 3=27, 4=64, 5=125, 6=216

                startCharFreqs[firstChar] = (startCharFreqs[firstChar] || 0) + weight;
                endCharFreqs[lastChar] = (endCharFreqs[lastChar] || 0) + weight;
            }
        }
        // Artificial cap for prototype speed
        if (totalFound > 150) break;
    }

    // Find the absolute highest frequency start and end chars
    let bestStart = null;
    let maxStart = 0;
    for (let char in startCharFreqs) {
        if (startCharFreqs[char] > maxStart) {
            maxStart = startCharFreqs[char];
            bestStart = char;
        }
    }

    let bestEnd = null;
    let maxEnd = 0;
    for (let char in endCharFreqs) {
        // Don't mark the same char as both the best start and best end if possible
        if (char === bestStart && Object.keys(endCharFreqs).length > 1) continue;

        if (endCharFreqs[char] > maxEnd) {
            maxEnd = endCharFreqs[char];
            bestEnd = char;
        }
    }

    return { counts, bestStart, bestEnd };
}

function canFormWord(word, availableLetters) {
    let avail = [...availableLetters];
    for (let char of word) {
        let idx = avail.indexOf(char);
        if (idx !== -1) {
            avail.splice(idx, 1);
        } else {
            return false;
        }
    }
    return true;
}

function showFeedback(text, scoreText) {
    const overlay = document.getElementById('feedback-overlay');
    document.getElementById('feedback-text').innerText = text;
    document.getElementById('feedback-score').innerText = scoreText;

    overlay.classList.remove('hidden');
    overlay.classList.add('visible');

    setTimeout(() => {
        overlay.classList.remove('visible');
        overlay.classList.add('hidden');
    }, 2000);
}

// Rendering
function render() {
    try {
        console.log("Render called. State:", JSON.parse(JSON.stringify(state)));
        document.getElementById('score').innerText = state.score;
        document.getElementById('target-score').innerText = state.target;
        document.getElementById('plays-left').innerText = state.plays;
        document.getElementById('discards-left').innerText = state.discards;
        document.getElementById('ante-display').innerText = state.ante;
        document.getElementById('blind-name-display').innerText = state.blindName;
        document.getElementById('gold-display').innerText = `$${state.gold}`;

        renderJokers();

        // Math panel
        const { word, totalBase, mult, typeName } = calculateCurrentScore();
        const chipsEl = document.getElementById('current-chips');
        const multEl = document.getElementById('current-mult');
        const statusEl = document.getElementById('word-status');

        if (word.length > 0) {
            chipsEl.innerText = totalBase;
            multEl.innerText = mult;

            // We use the offline stemmer to verify in real-time before clicking
            if (validateWordOffline(word)) {
                statusEl.innerText = `كلمة صحيحة (${typeName})`;
                statusEl.className = "word-status valid";
            } else {
                statusEl.innerText = `غير معروفة (${typeName})`;
                statusEl.className = "word-status invalid";
            }
        } else {
            chipsEl.innerText = 0;
            multEl.innerText = 0;
            statusEl.innerText = "كلمة فارغة (Empty)";
            statusEl.className = "word-status";
        }

        // Played word area
        const playedEl = document.getElementById('played-word');
        playedEl.innerHTML = '';
        state.played.forEach((card, index) => {
            const cEl = document.createElement('div');
            cEl.className = 'card consonant-card';
            // Allow removing from played to hand
            cEl.onclick = () => handlePlayedLetterClick(card.id);

            let charDisplay = card.display || card.char;
            let fontSize = charDisplay.length > 1 ? "1.8rem" : "2.5rem";
            cEl.innerHTML = `<span class="char" style="font-size:${fontSize}">${charDisplay}</span><span class="val">${card.value}</span>`;
            playedEl.appendChild(cEl);
        });

        // Substats (Possible words & Analysis)
        // Gather all available letters (hand + played + unused anchor)
        let allChars = [];
        state.hand.forEach(c => allChars.push(c.char));
        state.played.forEach(c => allChars.push(c.char));

        state.anchors.forEach(a => {
            if (!state.played.find(c => c.id === a.id)) {
                allChars.push(a.char);
            }
        });

        let analysis = getWordCounts(allChars);
        let stats = analysis.counts;
        let bestStart = analysis.bestStart;
        let bestEnd = analysis.bestEnd;

        // Hand area (Re-render hand with analysis markers)
        const handEl = document.getElementById('player-hand');
        handEl.innerHTML = '';

        // Anchor area
        const anchorZone = document.getElementById('anchor-zone');
        if (anchorZone) {
            anchorZone.innerHTML = '';
            state.anchors.forEach((anchor, index) => {
                let isPlayed = state.played.find(c => c.id === anchor.id);
                if (!isPlayed) {
                    let aEl = document.createElement('div');
                    aEl.className = 'card ink-card selectable';
                    aEl.style.borderColor = '#f59e0b';
                    aEl.style.boxShadow = '0 0 15px rgba(245, 158, 11, 0.4)';
                    aEl.onclick = () => handleAnchorClick(index);

                    let charDisplay = anchor.display || anchor.char;
                    let fontSize = charDisplay.length > 1 ? "1.8rem" : "2.5rem";
                    aEl.innerHTML = `<span class="char" style="font-size:${fontSize}; color:#f59e0b;">${charDisplay}</span><span class="val">${anchor.value}</span>`;
                    anchorZone.appendChild(aEl);
                }
            });
        }

        let markedStart = false; // Only mark one instance of a letter
        let markedEnd = false;

        state.hand.forEach(card => {
            let hEl = document.createElement('div');
            let classes = ['card', 'ink-card', 'selectable'];
            let indicatorHTML = '';

            // Apply smart visual markers
            if (card.char === bestStart && !markedStart) {
                classes.push('likely-start');
                indicatorHTML = `<div class="card-marker start-marker tooltip-container">بداية<span class="tooltip-text" style="bottom: 150%;">بداية محتملة لكمة طويلة</span></div>`;
                markedStart = true;
            } else if (card.char === bestEnd && !markedEnd) {
                classes.push('likely-end');
                indicatorHTML = `<div class="card-marker end-marker tooltip-container">نهاية<span class="tooltip-text" style="bottom: 150%;">نهاية محتملة لكمة طويلة</span></div>`;
                markedEnd = true;
            }

            let charDisplay = card.display || card.char;
            let fontSize = charDisplay.length > 1 ? "1.8rem" : "2.5rem";

            hEl.className = classes.join(' ');
            hEl.onclick = () => handleHandLetterClick(card.id);
            hEl.innerHTML = `
            ${indicatorHTML}
            <span class="char" style="font-size:${fontSize}">${charDisplay}</span>
            <span class="val">${card.value}</span>
        `;
            handEl.appendChild(hEl);
        });

        let statsHTML = '';
        for (let len = 2; len <= 6; len++) {
            if (stats[len].count > 0) {
                const examples = stats[len].words.join("، ");
                let dotString = '•'.repeat(len);
                statsHTML += `
            <div class="stat-minimal tooltip-container">
                <span class="count">${stats[len].count}</span> <span class="dots">${dotString}</span>
                <span class="tooltip-text">${examples}...</span>
            </div>`;
            }
        }

        const possibleEl = document.getElementById('possible-words-list');
        if (statsHTML === '') {
            possibleEl.innerHTML = '<div class="no-words-minimal">-</div>';
        } else {
            possibleEl.innerHTML = statsHTML;
        }

        // Next round button logic (Automated now, always hidden)
        const nextBtn = document.getElementById('btn-next-round');
        nextBtn.classList.add('hidden');
        console.log("Render completed successfully");
    } catch (e) {
        console.error("FATAL ERROR IN RENDER:", e);
    }
}

// Start
document.addEventListener('DOMContentLoaded', () => {
    // Bind Events
    const playBtn = document.getElementById('btn-play');
    if (playBtn) playBtn.onclick = handlePlayWord;

    const clearBtn = document.getElementById('btn-clear');
    if (clearBtn) clearBtn.onclick = handleRecallCards;

    const discardBtn = document.getElementById('btn-discard');
    if (discardBtn) discardBtn.onclick = handleDiscard;

    const leaveShopBtn = document.getElementById('btn-leave-shop');
    if (leaveShopBtn) leaveShopBtn.onclick = leaveShop;

    console.log("DOM loaded. Starting Game...");
    startGame();
});
