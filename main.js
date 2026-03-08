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
    5: { name: 'كلمة خماسية', baseMult: 5, baseChips: 100 },
    6: { name: 'كلمة سداسية', baseMult: 6, baseChips: 150 },
    7: { name: 'كلمة سباعية', baseMult: 8, baseChips: 200 }
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
    }
];

const INK_POT_REGISTRY = [
    { id: 'i_gold', name: 'قطرة ذهب', desc: '+8$', cost: 3, type: 'consumable', use: () => { state.gold += 8; } },
    { id: 'i_plays', name: 'حبر الهمة', desc: '+2 العب (Plays) هذه الجولة', cost: 4, type: 'consumable', use: () => { state.plays += 2; } },
    { id: 'i_discards', name: 'حبر التغيير', desc: '+2 تغيير (Discards) هذه الجولة', cost: 4, type: 'consumable', use: () => { state.discards += 2; } },
    { id: 'i_wealth', name: 'حبر الثروة', desc: 'مضاعفة الذهب الحالي (الحد الأقصى 20$)', cost: 6, type: 'consumable', use: () => { state.gold += Math.min(state.gold, 20); } },
    { id: 'i_sniper', name: 'حبر القناص', desc: 'يقلل الهدف بنسبة 25%', cost: 5, type: 'consumable', use: () => { state.target = Math.floor(state.target * 0.75); render(); } }
];

const BOSS_REGISTRY = {
    3: { name: 'الزعيم: الجدار (The Wall)', effect: 'الهدف x2', apply: () => { state.target *= 2; } },
    6: { name: 'الزعيم: الصمت (The Silence)', effect: '0 تغييرات (No Discards)', apply: () => { state.discards = 0; } },
    9: { name: 'الزعيم: الزنزانة (The Cell)', effect: '-1 العب (Minus 1 Play)', apply: () => { state.plays = Math.max(1, state.plays - 1); } }
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
    anchorCard: null, // Required letter on board
    hand: [], // Array of objects
    played: [], // Array of objects currently played
    selectedHandIds: [], // Allow multiple selection for discard
    nextId: 1,
    roundOver: false,
    roundWon: false,
    isCheckingWord: false
};

// Initialization
function initGame() {
    state.hand = [];
    state.played = [];
    state.selectedHandIds = [];
    state.score = 0;
    state.plays = 4;
    state.discards = 3;
    state.roundOver = false;
    state.roundWon = false;

    // Apply specific boss rules if it's the boss blind
    if (state.blindIndex === 2 && BOSS_REGISTRY[state.ante]) {
        BOSS_REGISTRY[state.ante].apply();
    }

    // Generate Scrabble Anchor (only from pure single letters, first 28)
    let aTemplate = ALL_LETTERS[Math.floor(Math.random() * 28)];
    state.anchorCard = { id: 'c-anchor', char: aTemplate.char, display: aTemplate.display, value: Math.floor(aTemplate.value / 2) || 1, isAnchor: true };

    // Draw 8 cards for Hand
    for (let i = 0; i < 8; i++) {
        state.hand.push(getRandomLetter());
    }

    render();
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

window.handleAnchorClick = function () {
    if (state.roundOver) return;
    // Move anchor to played if it's not already there
    if (!state.played.find(c => c.isAnchor)) {
        state.played.push(state.anchorCard);
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
    render();
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
        return { name: 'المتموجة (Palindrome)', baseMult: defaultTypeData.baseMult + 5, baseChips: defaultTypeData.baseChips + 60 };
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
function validateWordOffline(rawWord) {
    if (FULL_DICTIONARY.includes(rawWord)) return true;

    // Ordered by length descending so we match the longest affixes first
    const prefixes = [
        'وبال', 'وفال', 'وكال', 'ولل',
        'وال', 'فال', 'بال', 'كال', 'يست', 'تست', 'مست', 'است',
        'ال', 'لل', 'سي', 'ست', 'سن', 'سأ',
        'و', 'ف', 'ب', 'ك', 'ل', 'س', 'ي', 'ت', 'ن', 'أ', 'م'
    ];

    const suffixes = [
        'كما', 'هما', 'كمو', 'همو', 'تين', 'تان',
        'ها', 'هم', 'هن', 'كم', 'كن', 'نا', 'وا', 'ون', 'ين', 'ان', 'ات', 'تم', 'تن', 'ني', 'ته',
        'ة', 'ه', 'ي', 'ك', 'ت', 'ا'
    ];

    // Try just stripping suffixes
    for (let suf of suffixes) {
        if (rawWord.endsWith(suf)) {
            let stem = rawWord.slice(0, -suf.length);
            if (stem.length >= 2 && FULL_DICTIONARY.includes(stem)) return true;
        }
    }

    // Try just stripping prefixes
    for (let pref of prefixes) {
        if (rawWord.startsWith(pref)) {
            let stem = rawWord.slice(pref.length);
            if (stem.length >= 2 && FULL_DICTIONARY.includes(stem)) return true;
        }
    }

    // Try stripping both (Cartesian product)
    for (let pref of prefixes) {
        if (rawWord.startsWith(pref)) {
            let cutFront = rawWord.slice(pref.length);
            for (let suf of suffixes) {
                if (cutFront.endsWith(suf)) {
                    let stem = cutFront.slice(0, -suf.length);
                    // Sometimes words end with Ta Marbuta 'ة' that turns into 'ت' when a suffix is added e.g (مدرسة -> مدرستي)
                    // If we removed 'ي', and the stem ends with 'ت', try changing 'ت' back to 'ة'
                    if (stem.length >= 2) {
                        if (FULL_DICTIONARY.includes(stem)) return true;
                        if (stem.endsWith('ت')) {
                            let stemTamarbuta = stem.slice(0, -1) + 'ة';
                            if (FULL_DICTIONARY.includes(stemTamarbuta)) return true;
                        }
                    }
                }
            }
        }
    }

    return false;
}

function handlePlayWord() {
    if (state.roundOver || state.plays <= 0) return;

    // Check Anchor Constraint
    if (state.anchorCard && !state.played.find(c => c.isAnchor)) {
        showFeedback("يجب استخدام الحرف الأساسي", "Missing Anchor!");
        return;
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

        // Auto-transition to shop when winning
        setTimeout(() => {
            proceedToShop();
        }, 2200);

    } else if (state.plays <= 0) {
        state.roundOver = true;
        state.roundWon = false;
        showFeedback("خسارة", "Game Over");
    }
}

// Blind Selection System
function proceedToBlindSelect() {
    document.getElementById('blind-select-overlay').classList.remove('hidden');
    renderBlindSelect();
}

function getBlindBaseTarget() {
    // Balatro style exponential scaling
    return Math.floor(300 * Math.pow(1.5, state.ante - 1));
}

function renderBlindSelect() {
    document.getElementById('bs-ante-display').innerText = state.ante;

    let baseTarget = getBlindBaseTarget();
    let smallTarget = baseTarget;
    let bigTarget = Math.floor(baseTarget * 1.5);
    let bossTarget = baseTarget * 2;

    document.getElementById('bc-small-target').innerText = smallTarget;
    document.getElementById('bc-big-target').innerText = bigTarget;
    document.getElementById('bc-boss-target').innerText = bossTarget;

    const bossRuleEl = document.getElementById('bc-boss-rule');
    if (BOSS_REGISTRY[state.ante]) {
        bossRuleEl.innerText = BOSS_REGISTRY[state.ante].effect;
    } else {
        bossRuleEl.innerText = 'قدرة مجهولة...';
    }

    // Handle states (Defeated, Active, Locked)
    const blinds = ['small', 'big', 'boss'];
    blinds.forEach((blind, i) => {
        let el = document.getElementById(`bc-${blind}`);
        let btns = el.querySelectorAll('button');

        if (i < state.blindIndex) {
            // Defeated/Skipped
            el.className = 'blind-card defeated';
            btns.forEach(b => b.disabled = true);
        } else if (i === state.blindIndex) {
            // Active
            el.className = 'blind-card';
            btns[0].disabled = false; // Select
            // Can't skip boss normally
            if (blind === 'boss') btns[1].disabled = true;
            else btns[1].disabled = false;
        } else {
            // Locked (future)
            el.className = 'blind-card';
            btns.forEach(b => b.disabled = true);
            el.style.opacity = '0.8';
        }
    });
}

window.selectBlind = function (type) {
    document.getElementById('blind-select-overlay').classList.add('hidden');

    let base = getBlindBaseTarget();

    if (type === 'small') {
        state.blindName = 'الرهان الصغير';
        state.target = base;
    } else if (type === 'big') {
        state.blindName = 'الرهان الكبير';
        state.target = Math.floor(base * 1.5);
    } else if (type === 'boss') {
        let bossData = BOSS_REGISTRY[state.ante] || { name: 'زعيم مجهول' };
        state.blindName = bossData.name;
        state.target = base * 2;
    }

    initGame();
}

window.skipBlind = function (type) {
    if (type === 'small' || type === 'big') {
        // Prototype generic tag reward
        state.gold += 15; // Give $15 for skipping
        showFeedback("تخطي", "+15$ (وسام)");
        state.blindIndex++;

        setTimeout(() => {
            document.getElementById('blind-select-overlay').classList.add('hidden');
            proceedToShop();
        }, 1500);
    }
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

window.buyShopItem = function (shopId) {
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

window.leaveShop = function () {
    document.getElementById('shop-overlay').classList.add('hidden');

    state.blindIndex++;
    if (state.blindIndex > 2) {
        state.ante++;
        state.blindIndex = 0;
    }
    proceedToBlindSelect();
}

window.useConsumable = function (runtimeId) {
    if (state.roundOver) return;
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

    // Performance optimization: we don't want to loop 270k words on every single click/render
    // For the prototype, we just find the first ~150 words or limit the search
    for (let word of FULL_DICTIONARY) {
        // Enforce Anchor Constraint in Hints
        if (state.anchorCard && !word.includes(state.anchorCard.char)) continue;

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

    let anchorInPlay = state.played.find(c => c.isAnchor);
    if (!anchorInPlay && state.anchorCard) allChars.push(state.anchorCard.char);

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
        if (!anchorInPlay && state.anchorCard) {
            let aEl = document.createElement('div');
            aEl.className = 'card ink-card selectable';
            aEl.style.borderColor = '#f59e0b';
            aEl.style.boxShadow = '0 0 15px rgba(245, 158, 11, 0.4)';
            aEl.onclick = handleAnchorClick;

            let charDisplay = state.anchorCard.display || state.anchorCard.char;
            let fontSize = charDisplay.length > 1 ? "1.8rem" : "2.5rem";
            aEl.innerHTML = `<span class="char" style="font-size:${fontSize}; color:#f59e0b;">${charDisplay}</span><span class="val">${state.anchorCard.value}</span>`;
            anchorZone.appendChild(aEl);
        }
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
            statsHTML += `
            <div class="stat-pill tooltip-container">
                ${stats[len].count} كلمات من ${len} حروف
                <span class="tooltip-text">${examples}...</span>
            </div>`;
        }
    }

    const possibleEl = document.getElementById('possible-words-list');
    if (statsHTML === '') {
        possibleEl.innerHTML = '<div class="no-words">لا توجد كلمات معروفة في هذا الحبر</div>';
    } else {
        possibleEl.innerHTML = statsHTML;
    }

    // Next round button logic (Automated now, always hidden)
    const nextBtn = document.getElementById('btn-next-round');
    nextBtn.classList.add('hidden');
}

// Bind Events
document.getElementById('btn-play').onclick = handlePlayWord;
document.getElementById('btn-clear').onclick = handleRecallCards;
document.getElementById('btn-discard').onclick = handleDiscard;
document.getElementById('btn-leave-shop').onclick = leaveShop;
document.getElementById('btn-test-word').onclick = handleTestWord;
document.getElementById('test-word-input').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        handleTestWord();
    }
});

// Start
initGame();
