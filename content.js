console.log("SCOUT extension active (RoPro Compatible Mode)");

const apiCache = new Map();
const processedListUsers = new Set();
let settings = { mainBadgeEnabled: true, listBadgeEnabled: true };

chrome.storage.local.get(['mainBadgeEnabled', 'listBadgeEnabled'], (result) => {
    if (result.mainBadgeEnabled !== undefined) settings.mainBadgeEnabled = result.mainBadgeEnabled;
    if (result.listBadgeEnabled !== undefined) settings.listBadgeEnabled = result.listBadgeEnabled;
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
});

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

// --- COMMUNICATES WITH LOCAL BACKGROUND.JS INSTEAD OF EXTERNAL API ---
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
            a.avatar-name[href*="/users/${userId}/"]::after, 
            a.friend-name[href*="/users/${userId}/"]::after {
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