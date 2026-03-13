console.log("SCOUT extension active (RoPro Compatible Mode)");

const apiCache = new Map();
const processedListUsers = new Set();
let settings = { mainBadgeEnabled: true, listBadgeEnabled: true };

// --- READ SETTINGS AND CHECK FOR UPDATES ---
chrome.storage.local.get(['mainBadgeEnabled', 'listBadgeEnabled', 'updateAvailable'], (result) => {
    if (result.mainBadgeEnabled !== undefined) settings.mainBadgeEnabled = result.mainBadgeEnabled;
    if (result.listBadgeEnabled !== undefined) settings.listBadgeEnabled = result.listBadgeEnabled;
    if (result.updateAvailable) showInPageUpdateBanner();
});

chrome.storage.onChanged.addListener((changes) => {
    if (changes.mainBadgeEnabled) {
        settings.mainBadgeEnabled = changes.mainBadgeEnabled.newValue;
        if (!settings.mainBadgeEnabled) removeMainBadge();
    }
    if (changes.listBadgeEnabled) {
        settings.listBadgeEnabled = changes.listBadgeEnabled.newValue;
        if (!settings.listBadgeEnabled) removeListBadges();
    }
    if (changes.updateAvailable && changes.updateAvailable.newValue === true) {
        showInPageUpdateBanner();
    }
});

// ---------------- IN-PAGE UPDATE BANNER ----------------
function showInPageUpdateBanner() {
    if (document.getElementById('scout-inpage-update-banner')) return;

    const banner = document.createElement('div');
    banner.id = 'scout-inpage-update-banner';
    banner.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background-color: #e74c3c;
        color: white;
        padding: 16px 20px;
        border-radius: 8px;
        z-index: 9999999; 
        font-family: 'Segoe UI', Tahoma, sans-serif;
        box-shadow: 0 8px 20px rgba(0,0,0,0.4);
        display: flex;
        flex-direction: column;
        gap: 12px;
        width: 280px;
        border: 1px solid #c0392b;
    `;

    banner.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px; font-weight: bold; font-size: 16px;">
            <img src="${chrome.runtime.getURL('scout_logo.png')}" style="width: 20px; height: 20px;">
            S.C.O.U.T. Update Ready!
        </div>
        <div style="font-size: 13px; line-height: 1.4;">
            A new version of S.C.O.U.T. is available. Please download the update to stay protected.
        </div>
        <div style="display: flex; gap: 10px; margin-top: 5px;">
            <button id="scout-update-download" style="background: white; color: #e74c3c; border: none; padding: 8px; border-radius: 6px; font-weight: bold; font-size: 13px; cursor: pointer; flex: 1; transition: 0.2s;">Get Update</button>
            <button id="scout-update-dismiss" style="background: rgba(0,0,0,0.2); color: white; border: none; padding: 8px 12px; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 13px; transition: 0.2s;">Dismiss</button>
        </div>
    `;

    document.body.appendChild(banner);

    // Make the Download button open GitHub AND trigger the zip download
    document.getElementById('scout-update-download').addEventListener('click', () => {
        window.open("https://github.com/MythicalWays5/SCOUT_Extension", "_blank");
        window.location.href = "https://github.com/MythicalWays5/SCOUT_Extension/archive/refs/heads/main.zip";
        banner.remove(); // Auto-dismiss the banner after clicking
    });

    // Make the dismiss button work
    document.getElementById('scout-update-dismiss').addEventListener('click', () => {
        banner.remove();
    });
}

// --- CLEANUP FUNCTIONS ---
function removeMainBadge() {
    const badge = document.querySelector('.scout-dynamic-badge');
    if (badge) badge.remove();
    const usernameEl = document.getElementById("profile-header-title-container-name");
    if (usernameEl) delete usernameEl.dataset.scoutProcessing;
}

function removeListBadges() {
    dynamicStyleTag.innerHTML = "";
    processedListUsers.clear();
}

// --- GLOBAL SETUP ---
document.documentElement.style.setProperty('--scout-logo-url', `url('${chrome.runtime.getURL("scout_logo.png")}')`);

let dynamicStyleTag = document.getElementById("scout-dynamic-styles");
if (!dynamicStyleTag) {
    dynamicStyleTag = document.createElement("style");
    dynamicStyleTag.id = "scout-dynamic-styles";
    document.head.appendChild(dynamicStyleTag);
}

function getUserIdFromUrl() {
    const match = location.pathname.match(/\/users\/(\d+)/);
    return match ? match[1] : null;
}

async function fetchScoutData(userId) {
    if (apiCache.has(userId)) return apiCache.get(userId);

    const fetchPromise = new Promise((resolve) => {
        chrome.runtime.sendMessage({ action: "checkUser", userId: userId }, (response) => {
            if (chrome.runtime.lastError || response.error) {
                console.error(`SCOUT API skipped for ${userId}:`, chrome.runtime.lastError?.message || response.error);
                apiCache.delete(userId); 
                resolve(null);
            } else {
                resolve(response); 
            }
        });
    });

    apiCache.set(userId, fetchPromise);
    return fetchPromise;
}

// ---------------- MAIN PROFILE HEADER ----------------
function createMainProfileBadge(data) {
    const count = data.flaggedGroupCount || 0;
    const badge = document.createElement("span");
    badge.className = "scout-badge scout-dynamic-badge";
    
    const logo = document.createElement("img");
    logo.src = chrome.runtime.getURL("scout_logo.png");
    logo.className = "scout-logo";
    badge.appendChild(logo);

    const textSpan = document.createElement("span");

    if (count >= 10 || data.risk === "high") {
        badge.classList.add("scout-high");
        textSpan.textContent = `HIGH RISK (${count})`;
    } else if (count >= 5 || data.risk === "medium") {
        badge.classList.add("scout-medium");
        textSpan.textContent = `MODERATE RISK (${count})`;
    } else if (count > 0 || data.risk === "low") {
        badge.classList.add("scout-low");
        textSpan.textContent = `SUSPICIOUS (${count})`;
    } else {
        badge.classList.add("scout-safe");
        textSpan.textContent = "SAFE";
    }

    badge.appendChild(textSpan);
    return badge;
}

async function processMainProfile() {
    if (!settings.mainBadgeEnabled) return;
    if (!location.pathname.includes('/profile')) return;

    const userId = getUserIdFromUrl();
    if (!userId) return;

    const usernameEl = document.getElementById("profile-header-title-container-name");
    if (!usernameEl) return;

    if (usernameEl.nextElementSibling && usernameEl.nextElementSibling.classList.contains("scout-dynamic-badge")) return;
    
    if (usernameEl.dataset.scoutProcessing) return;
    usernameEl.dataset.scoutProcessing = "true";

    const data = await fetchScoutData(userId);
    if (!data) {
        delete usernameEl.dataset.scoutProcessing; 
        return;
    }

    if (!document.body.contains(usernameEl)) return;
    if (!settings.mainBadgeEnabled) return;
    if (usernameEl.nextElementSibling && usernameEl.nextElementSibling.classList.contains("scout-dynamic-badge")) return;

    const badge = createMainProfileBadge(data);
    usernameEl.insertAdjacentElement("afterend", badge);
    
    if (usernameEl.parentElement) {
        usernameEl.parentElement.style.display = "flex";
        usernameEl.parentElement.style.alignItems = "center";
    }
}

// ---------------- PAGINATED LISTS ----------------
function processListLinks() {
    if (!settings.listBadgeEnabled) return;
    if (!location.pathname.match(/\/(friends|followers|followings?)/)) return;

    const links = Array.from(document.querySelectorAll('.avatar-name[href*="/users/"], .friend-name[href*="/users/"]'))
        .filter(a => a.textContent.trim().length > 0);

    links.forEach(async (link) => {
        const match = link.getAttribute("href").match(/\/users\/(\d+)/);
        if (!match) return;
        const userId = match[1];

        if (userId === getUserIdFromUrl()) return;
        
        if (processedListUsers.has(userId)) return;
        processedListUsers.add(userId); 

        const data = await fetchScoutData(userId);
        if (!data) {
            processedListUsers.delete(userId); 
            return;
        }
        if (!settings.listBadgeEnabled) return;

        const count = data.flaggedGroupCount || 0;
        let bgColor = "#2ecc71"; 
        let textColor = "white";
        
        if (count >= 10 || data.risk === "high") { bgColor = "#e74c3c"; }
        else if (count >= 5 || data.risk === "medium") { bgColor = "#e67e22"; }
        else if (count > 0 || data.risk === "low") { bgColor = "#f1c40f"; textColor = "black"; }

        const cssRule = `
            #content a.avatar-name[href*="/users/${userId}/"]::after, 
            #content a.friend-name[href*="/users/${userId}/"]::after {
                content: "${count}";
                display: inline-block;
                padding: 2px 6px 2px 20px;
                border-radius: 6px;
                margin-left: 6px;
                vertical-align: middle;
                font-size: 12px;
                font-weight: 600;
                color: ${textColor};
                background-color: ${bgColor};
                background-image: var(--scout-logo-url);
                background-size: 12px 12px;
                background-repeat: no-repeat;
                background-position: 4px center;
                line-height: normal;
            }
        `;
        
        dynamicStyleTag.appendChild(document.createTextNode(cssRule));
    });
}

// ---------------- MASTER OBSERVER & FALLBACKS ----------------
let debounceTimer;

const observer = new MutationObserver(() => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        processMainProfile();
        processListLinks();
    }, 500); 
});
observer.observe(document.body, { childList: true, subtree: true });

window.addEventListener("hashchange", () => {
    setTimeout(() => {
        processMainProfile();
        processListLinks();
    }, 100); 
});

setInterval(() => {
    processMainProfile();
    processListLinks();
}, 2000); 

setTimeout(() => {
    processMainProfile();
    processListLinks();
}, 500);