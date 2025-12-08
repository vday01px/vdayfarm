// game.js – PHIÊN BẢN HOÀN CHỈNH SUPABASE + IDLE + OFFLINE
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const SUPABASE_URL = "https://tsdpylvvhutxgrxpeaza.supabase.co";        // ← THAY ĐỔI
const SUPABASE_ANON_KEY = "sb_publishable_iwHHkOr8GrHnlt1obB5ICQ__WvCqxEA"; // ← THAY ĐỔI

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Telegram
const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

const user = tg.initDataUnsafe?.user || { id: 123456789, first_name: "Dev" };

// Biến toàn cục
let player = { gold: 0, diamond: 0, exp: 0, level: 1, last_login: new Date() };
let cells = Array(9).fill(null); // sẽ load từ DB

// ==================== INIT ====================
async function init() {
    await loadOrCreatePlayer();
    await loadFarm();
    document.getElementById("playerName").innerText = user.first_name || "Người chơi";
    startIdleLoop();           // tự lớn + random sâu
    setInterval(saveAll, 10000); // auto save mỗi 10s
}
init();

// ==================== PLAYER ====================
async function loadOrCreatePlayer() {
    let { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("tg_id", user.id)
        .single();

    if (!data) {
        const { data: newUser } = await supabase
            .from("users")
            .insert({
                tg_id: user.id,
                username: user.first_name || "Farmer",
                gold: 0,
                diamond: 0,
                exp: 0,
                level: 1,
                last_login: new Date().toISOString()
            })
            .select()
            .single();
        player = newUser;
    } else {
        player = data;

        // TÍNH OFFLINE PROFIT
        const offlineSeconds = Math.floor((new Date() - new Date(player.last_login)) / 1000);
        if (offlineSeconds > 60) {
            const offlineGold = Math.floor(offlineSeconds / 30) * player.level * 3; // 3s được 1 vàng x level
            player.gold += offlineGold;
            if (offlineGold > 0) {
                tg.showAlert(`Offline kiếm được ${offlineGold.toLocaleString()} vàng!`);
            }
        }
        player.last_login = new Date().toISOString();
        await supabase.from("users").update({ last_login: player.last_login, gold: player.gold }).eq("id", player.id);
    }
    updateUI();
}

// ==================== FARM ====================
async function loadFarm() {
    let { data } = await supabase
        .from("farms")
        .select("*")
        .eq("user_id", player.id)
        .order("slot");

    if (data.length === 0) {
        // tạo 9 ô mới
        const inserts = [];
        for (let i = 0; i < 9; i++) {
            inserts.push({ user_id: player.id, slot: i, lv: 0, planted_at: null, has_pest: false });
        }
        await supabase.from("farms").insert(inserts);
        return loadFarm();
    }

    cells = data;
    renderFarm();
}

// Render lại 9 ô
function renderFarm() {
    const grid = document.getElementById("grid");
    grid.innerHTML = "";

    cells.forEach((cell, i) => {
        const el = document.createElement("div");
        el.className = "cell";

        if (cell.lv === 0) {
            el.innerHTML = "+";
        } else if (cell.has_pest) {
            el.innerHTML = `🐛 Lv${cell.lv}`;
            el.style.background = "#ff9800";
        } else if (isReady(cell)) {
            el.innerHTML = `✨ Lv${cell.lv}`;
            el.style.background = "#ffd700";
            el.classList.add("shine");
        } else {
            el.innerHTML = `🌱 Lv${cell.lv}`;
        }

        el.onclick = () => clickCell(i);
        grid.appendChild(el);
    });
}

// Kiểm tra cây đã chín chưa (30 giây mỗi level)
function isReady(cell) {
    if (!cell.planted_at) return false;
    const seconds = (Date.now() - new Date(cell.planted_at)) / 1000;
    return seconds >= cell.lv * 30;
}

// ==================== CLICK Ô ====================
async function clickCell(i) {
    const cell = cells[i];

    if (cell.lv === 0) {
        // Trồng cây
        cell.lv = 1;
        cell.planted_at = new Date().toISOString();
        cell.has_pest = false;
    } else if (cell.has_pest) {
        // Diệt sâu (cần thuốc, tạm cho miễn phí)
        cell.has_pest = false;
        tg.showAlert("Đã diệt sâu!");
    } else if (isReady(cell)) {
        // Thu hoạch
        const reward = cell.lv * 15;
        player.gold += reward;
        player.exp += cell.lv * 5;
        checkLevelUp();

        // Tăng cấp cây cho lần sau
        cell.lv += 1;
        cell.planted_at = new Date().toISOString(); // reset thời gian
    } else {
        // Chưa chín → thông báo
        tg.showAlert(`Còn ${(cell.lv * 30 - (Date.now() - new Date(cell.planted_at)) / 1000).toFixed(0)} giây nữa!`);
        return;
    }

    await saveCell(i);
    await savePlayer();
    renderFarm();
    updateUI();
}

// ==================== IDLE LOOP (tự lớn + sâu) ====================
function startIdleLoop() {
    setInterval(async () => {
        let changed = false;
        const now = Date.now();

        for (let i = 0; i < cells.length; i++) {
            const cell = cells[i];
            if (cell.lv > 0 && !cell.has_pest && !isReady(cell)) {
                // Random sâu 3%
                if (Math.random() < 0.003) {
                    cell.has_pest = true;
                    changed = true;
                }
            }
        }
        if (changed) {
            renderFarm();
            await saveAllCells();
        }
    }, 2000);
}

// ==================== LEVEL UP ====================
function checkLevelUp() {
    const need = player.level * 120;
    if (player.exp >= need) {
        player.level++;
        player.exp -= need;
        tg.showAlert(`Chúc mừng lên Level ${player.level}!`);
    }
}

// ==================== SAVE ====================
async function savePlayer() {
    await supabase.from("users").update({
        gold: player.gold,
        diamond: player.diamond,
        exp: player.exp,
        level: player.level,
        last_login: player.last_login
    }).eq("id", player.id);
    updateUI();
}

async function saveCell(index) {
    const cell = cells[index];
    await supabase.from("farms").update({
        lv: cell.lv,
        planted_at: cell.planted_at,
        has_pest: cell.has_pest
    }).eq("id", cell.id);
}

async function saveAllCells() {
    const updates = cells.map(c => ({
        id: c.id,
        lv: c.lv,
        planted_at: c.planted_at,
        has_pest: c.has_pest
    }));
    await supabase.from("farms").upsert(updates);
}

async function saveAll() {
    await savePlayer();
    await saveAllCells();
}

// ==================== UI ====================
function updateUI() {
    document.getElementById("gold").innerText = player.gold.toLocaleString();
    document.getElementById("diamond").innerText = player.diamond;
    document.getElementById("playerLevel").innerText = `Lv.${player.level} • ${player.exp}/${player.level * 120} exp`;
}

// Giữ nguyên popup cũ của bạn (chỉ thêm chút xíu)
function openTab(name) {
    const box = document.getElementById("popupContent");

    if (name === "tasks") {
        box.innerHTML = `<h2>Nhiệm vụ</h2>
            • Thu hoạch 10 lần → +50 vàng<br>
            • Diệt 5 con sâu → +2 kim cương`;
    }
    if (name === "shop") {
        box.innerHTML = `<h2>Cửa hàng Kim Cương</h2>
            • 10.000 vàng = 1 kim cương<br>
            <button onclick="buyDiamond()">Mua ngay</button>`;
    }
    if (name === "bag") {
        box.innerHTML = `<h2>Túi đồ</h2>
            • Phân bón: 0 (sắp có)<br>
            • Thuốc trừ sâu: vô hạn (tạm thời)`;
    }

    document.getElementById("popup").classList.remove("hidden");
}

// Thêm nút mua kim cương (sẽ mở rộng sau)
window.buyDiamond = async () => {
    if (player.gold >= 10000) {
        player.gold -= 10000;
        player.diamond += 1;
        await savePlayer();
        tg.showAlert("Mua thành công 1 kim cương!");
        closePopup();
    } else {
        tg.showAlert("Không đủ vàng!");
    }
};
