// FARM DATA - SUPABASE VERSION
let gold = 0;
let diamond = 0;
let exp = 0;
let level = 1;

// Supabase setup
const SUPABASE_URL = 'https://tsdpylvvhutxgrxpeaza.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_iwHHkOr8GrHnlt1obB5ICQ__WvCqxEA';

// Load Supabase dynamically
const script = document.createElement('script');
script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
document.head.appendChild(script);

script.onload = function() {
    const { createClient } = supabase;
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // Telegram
    const tg = window.Telegram.WebApp;
    tg.ready();
    tg.expand();
    const user = tg.initDataUnsafe?.user || { id: Date.now(), first_name: 'Player' };

    let cells = Array(9).fill({ lv: 0, timer: 0 });
    let playerId = null;

    // Init
    async function init() {
        await loadPlayer();
        document.getElementById("playerName").innerText = user.first_name;
        renderFarm();
        updateUI();
        setInterval(updateFarm, 1000);
    }

    async function loadPlayer() {
        let { data } = await supabase.from('users').select('*').eq('tg_id', user.id).single();
        if (!data) {
            const { data: newPlayer } = await supabase.from('users').insert({
                tg_id: user.id,
                username: user.first_name,
                gold: 0, diamond: 0, exp: 0, level: 1
            }).select().single();
            playerId = newPlayer.id;
            gold = 0; diamond = 0; exp = 0; level = 1;
        } else {
            playerId = data.id;
            gold = data.gold;
            diamond = data.diamond;
            exp = data.exp;
            level = data.level;
            // Load farms
            let { data: farmData } = await supabase.from('farms').select('*').eq('user_id', playerId);
            if (farmData) {
                farmData.forEach(f => {
                    const i = f.slot;
                    cells[i] = { lv: f.lv, timer: f.timer };
                });
            }
        }
        updateUI();
    }

    // Render grid
    function renderFarm() {
        const grid = document.getElementById("grid");
        grid.innerHTML = "";
        cells.forEach((cell, i) => {
            const el = document.createElement("div");
            el.className = "cell";
            if (cell.lv === 0) {
                el.innerHTML = "+";
            } else {
                el.innerHTML = `🌱 Lv${cell.lv}`;
            }
            el.onclick = () => clickCell(i);
            grid.appendChild(el);
        });
    }

    // Click cell
    async function clickCell(i) {
        if (cells[i].lv === 0) {
            cells[i] = { lv: 1, timer: 5 };
        } else {
            gold += cells[i].lv * 10;
            exp += cells[i].lv * 5;
            cells[i].lv++;
            checkLevelUp();
        }
        // Save
        await supabase.from('farms').upsert({
            user_id: playerId,
            slot: i,
            lv: cells[i].lv,
            timer: cells[i].timer
        });
        await supabase.from('users').update({ gold, exp, level }).eq('id', playerId);
        renderFarm();
        updateUI();
    }

    // Update timer
    function updateFarm() {
        cells.forEach(cell => {
            if (cell.lv > 0) {
                cell.timer--;
                if (cell.timer <= 0) {
                    cell.timer = cell.lv * 5; // Reset timer
                }
            }
        });
        renderFarm();
    }

    function checkLevelUp() {
        const need = level * 100;
        if (exp >= need) {
            level++;
            exp = 0;
            tg.showAlert(`Lên Lv.${level}!`);
        }
    }

    function updateUI() {
        document.getElementById("gold").innerText = gold;
        document.getElementById("diamond").innerText = diamond;
        document.getElementById("playerLevel").innerText = `Lv.${level} • ${exp}/${level * 100} exp`;
    }

    // Popup
    function openTab(name) {
        const box = document.getElementById("popupContent");
        if (name === "tasks") {
            box.innerHTML = `
                <h2>Nhiệm vụ</h2>
                • Thu hoạch 10 lần: +50 vàng<br>
                • Nâng cấp 3 cây: +100 vàng
            `;
        }
        if (name === "shop") {
            box.innerHTML = `
                <h2>Cửa hàng</h2>
                • Gói 500 vàng = 1 kim cương<br>
                • Phân bón tăng tốc 2x = 3 kim cương
            `;
        }
        if (name === "plants") {
            box.innerHTML = `
                <h2>Cây trồng</h2>
                • Cải: Lv1–Lv20<br>
                • Cà rốt: Lv5 mở khóa<br>
                • Dâu: Lv15 mở khóa
            `;
        }
        if (name === "bag") {
            box.innerHTML = `
                <h2>Túi đồ</h2>
                • Phân bón: 1<br>
                • Thuốc diệt sâu: 0
            `;
        }
        document.getElementById("popup").classList.remove("hidden");
    }

    function closePopup() {
        document.getElementById("popup").classList.add("hidden");
    }

    // Start
    init();
};
