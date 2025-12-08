// game.js – BẢN CHẠY NGON 100% TRÊN VERCEL (đã fix import)
const SUPABASE_URL = "https://tsdpylvvhutxgrxpeaza.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_iwHHkOr8GrHnlt1obB5ICQ__WvCqxEA";

// Dùng script tag thay vì import (cách này Vercel cho phép)
const supabaseScript = document.createElement("script");
supabaseScript.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
document.head.appendChild(supabaseScript);

supabaseScript.onload = async () => {
    const { createClient } = supabase;
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    const tg = window.Telegram.WebApp;
    tg.ready(); tg.expand();
    const user = tg.initDataUnsafe?.user || { id: 999999, first_name: "Dev" };

    let player = null;
    let cells = [];

    async function init() {
        await loadOrCreatePlayer();
        await loadOrCreateFarm();
        document.getElementById("playerName").textContent = user.first_name || "Người chơi";
        updateUI();
        renderFarm();
        startIdleLoop();
        setInterval(saveAll, 15000);
    }

    async function loadOrCreatePlayer() {
        let { data } = await supabase.from("users").select("*").eq("tg_id", user.id).single();
        if (!data) {
            const { data: newUser } = await supabase.from("users").insert({
                tg_id: user.id, username: user.first_name || "Farmer",
                gold: 0, diamond: 0, exp: 0, level: 1
            }).select().single();
            player = newUser;
        } else {
            player = data;
            const offlineSec = Math.floor((new Date() - new Date(player.last_login || new Date())) / 1000);
            if (offlineSec > 60) {
                const bonus = Math.floor(offlineSec / 30) * player.level * 3;
                player.gold += bonus;
                if (bonus > 0) tg.showAlert(`Offline +${bonus.toLocaleString()} vàng!`);
            }
            player.last_login = new Date().toISOString();
            await supabase.from("users").update({ last_login: player.last_login, gold: player.gold }).eq("id", player.id);
        }
    }

    async function loadOrCreateFarm() {
        let { data } = await supabase.from("farms").select("*").eq("user_id", player.id).order("slot");
        if (!data || data.length === 0) {
            const inserts = [];
            for (let i = 0; i < 9; i++) inserts.push({ user_id: player.id, slot: i, lv: 0, planted_at: null, has_pest: false });
            await supabase.from("farms").insert(inserts);
            const { data: newData } = await supabase.from("farms").select("*").eq("user_id", player.id).order("slot");
            cells = newData;
        } else {
            cells = data;
        }
    }

    function renderFarm() {
        const grid = document.getElementById("grid");
        grid.innerHTML = "";
        cells.forEach((c, i) => {
            const el = document.createElement("div");
            el.className = "cell";
            el.innerHTML = c.lv === 0 ? "+" : `Lv${c.lv}${c.has_pest ? "" : isReady(c) ? "" : ""}`;
            if (c.has_pest) el.style.background = "#ff5722";
            if (isReady(c)) el.style.background = "#ffd700";
            el.onclick = () => clickCell(i);
            grid.appendChild(el);
        });
    }

    function isReady(c) {
        return c.planted_at && (Date.now() - new Date(c.planted_at)) / 1000 >= c.lv * 30;
    }

    async function clickCell(i) {
        const c = cells[i];
        if (c.lv === 0) {
            c.lv = 1; c.planted_at = new Date().toISOString(); c.has_pest = false;
        } else if (c.has_pest) {
            c.has_pest = false; tg.showAlert("Diệt sâu thành công!");
        } else if (isReady(c)) {
            player.gold += c.lv * 20;
            player.exp += c.lv * 5;
            c.lv += 1; c.planted_at = new Date().toISOString();
            checkLevelUp();
        } else {
            const s = Math.ceil(c.lv * 30 - (Date.now() - new Date(c.planted_at)) / 1000);
            tg.showAlert(`Còn ${s}s nữa chín!`);
            return;
        }
        await supabase.from("farms").update(c).eq("id", c.id);
        await supabase.from("users").update({ gold: player.gold, exp: player.exp }).eq("id", player.id);
        renderFarm(); updateUI();
    }

    function startIdleLoop() {
        setInterval(async () => {
            let changed = false;
            for (const c of cells) {
                if (c.lv > 0 && !c.has_pest && Math.random() < 0.005) { c.has_pest = true; changed = true; }
            }
            if (changed) { await supabase.from("farms").upsert(cells); renderFarm(); }
        }, 3000);
    }

    function checkLevelUp() {
        const need = player.level * 120;
        if (player.exp >= need) { player.level++; player.exp -= need; tg.showAlert(`Lên cấp ${player.level}!`); }
    }

    function updateUI() {
        document.getElementById("gold").textContent = player.gold.toLocaleString();
        document.getElementById("diamond").textContent = player.diamond;
        document.getElementById("playerLevel").textContent = `Lv.${player.level} • ${player.exp}/${player.level*120} exp`;
    }

    async function saveAll() {
        await supabase.from("users").update(player).eq("id", player.id);
    }

    init(); // Bắt đầu game
};
