// game.js – BẢN HOÀN CHỈNH 100% (có 9 ô ngay lập tức)
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const SUPABASE_URL = "https://tsdpylvvhutxgrxpeaza.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_iwHHkOr8GrHnlt1obB5ICQ__WvCqxEA";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const tg = window.Telegram.WebApp;
tg.ready(); tg.expand();
const user = tg.initDataUnsafe?.user || { id: 123456, first_name: "Dev" };

let player = { id: null, gold: 0, diamond: 0, exp: 0, level: 1, last_login: new Date() };
let cells = [];

// INIT
async function init() {
    await loadOrCreatePlayer();
    await loadOrCreateFarm();   // ← tạo 9 ô ngay
    document.getElementById("playerName").textContent = user.first_name || "Người chơi";
    updateUI();
    renderFarm();
    startIdleLoop();
    setInterval(saveAll, 10000);
}
init();

// PLAYER
async function loadOrCreatePlayer() {
    let { data } = await supabase.from("users").select("*").eq("tg_id", user.id).single();
    if (!data) {
        const { data: newUser } = await supabase.from("users").insert({
            tg_id: user.id,
            username: user.first_name || "Farmer",
            gold: 0, diamond: 0, exp: 0, level: 1
        }).select().single();
        player = newUser;
    } else {
        player = data;
        // Offline profit
        const offlineSec = Math.floor((new Date() - new Date(player.last_login)) / 1000);
        if (offlineSec > 60) {
            const bonus = Math.floor(offlineSec / 30) * player.level * 2;
            player.gold += bonus;
            tg.showAlert(`Offline kiếm ${bonus.toLocaleString()} vàng!`);
        }
        player.last_login = new Date().toISOString();
        await supabase.from("users").update({ last_login: player.last_login, gold: player.gold }).eq("id", player.id);
    }
}

// TẠO 9 Ô NGAY LẬP TỨC
async function loadOrCreateFarm() {
    let { data } = await supabase.from("farms").select("*").eq("user_id", player.id).order("slot");
    if (!data || data.length === 0) {
        const inserts = [];
        for (let i = 0; i < 9; i++) {
            inserts.push({ user_id: player.id, slot: i, lv: 0, planted_at: null, has_pest: false });
        }
        await supabase.from("farms").insert(inserts);
        data = await supabase.from("farms").select("*").eq("user_id", player.id).order("slot");
    }
    cells = data;
}

// RENDER 9 Ô
function renderFarm() {
    const grid = document.getElementById("grid");
    grid.innerHTML = "";
    cells.forEach((cell, i) => {
        const el = document.createElement("div");
        el.className = "cell";
        if (cell.lv === 0) el.innerHTML = "+";
        else if (cell.has_pest) el.innerHTML = `Lv${cell.lv}`;
        else if (isReady(cell)) el.innerHTML = `Lv${cell.lv}`;
        else el.innerHTML = `Lv${cell.lv}`;
        el.onclick = () => clickCell(i);
        grid.appendChild(el);
    });
}

function isReady(c) {
    if (!c.planted_at) return false;
    return (Date.now() - new Date(c.planted_at)) / 1000 >= c.lv * 30;
}

// CLICK Ô
async function clickCell(i) {
    const c = cells[i];
    if (c.lv === 0) {
        c.lv = 1; c.planted_at = new Date().toISOString(); c.has_pest = false;
    } else if (c.has_pest) {
        c.has_pest = false;
        tg.showAlert("Đã diệt sâu!");
    } else if (isReady(c)) {
        player.gold += c.lv * 15;
        player.exp += c.lv * 5;
        c.lv += 1;
        c.planted_at = new Date().toISOString();
        checkLevelUp();
    } else {
        const remain = Math.ceil(c.lv * 30 - (Date.now() - new Date(c.planted_at)) / 1000);
        tg.showAlert(`Còn ${remain}s nữa mới chín!`);
        return;
    }
    await supabase.from("farms").update(c).eq("id", c.id);
    await supabase.from("users").update(player).eq("id", player.id);
    renderFarm();
    updateUI();
}

// IDLE + SÂU BỆNH
function startIdleLoop() {
    setInterval(async () => {
        let changed = false;
        for (const c of cells) {
            if (c.lv > 0 && !c.has_pest && Math.random() < 0.004) {
                c.has_pest = true;
                changed = true;
            }
        }
        if (changed) {
            await supabase.from("farms").upsert(cells);
            renderFarm();
        }
    }, 3000);
}

function checkLevelUp() {
    const need = player.level * 120;
    if (player.exp >= need) {
        player.level++;
        player.exp -= need;
        tg.showAlert(`Lên cấp ${player.level}!`);
    }
}

async function saveAll() {
    await supabase.from("users").update(player).eq("id", player.id);
}

function updateUI() {
    document.getElementById("gold").textContent = player.gold.toLocaleString();
    document.getElementById("diamond").textContent = player.diamond;
    document.getElementById("playerLevel").textContent = `Lv.${player.level} • ${player.exp}/${player.level*120} exp`;
}

// Giữ nguyên popup cũ
function openTab(name) { /* code cũ của bạn */ }
window.buyDiamond = async () => { /* code cũ */ };
