console.log("SCOUT extension active");

const apiCache = new Map();
const termCache = new Map(); 
const processedListUsers = new Set();
let settings = { 
    mainBadgeEnabled: true, 
    listBadgeEnabled: true, 
    termBadgeEnabled: true, 
    groupBadgeEnabled: true, 
    autoPopupEnabled: true 
};

// ---------------- CONTEXT MENU ID EXTRACTOR ----------------
document.addEventListener("mousedown", (e) => {
    if (e.button !== 2) return; 

    let idToCopy = null;
    let type = null;
    const link = e.target.closest('a');
    if (link && link.href) {
        const matchUser = link.href.match(/\/users\/(\d+)/);
        const matchGroup = link.href.match(/\/(?:groups|communities)\/(\d+)/);
        const matchGame = link.href.match(/\/games\/(\d+)/);
        const matchAsset = link.href.match(/\/(?:catalog|library|bundles)\/(\d+)/);

        if (matchUser) { type = 'user'; idToCopy = matchUser[1]; }
        else if (matchGroup) { type = 'group'; idToCopy = matchGroup[1]; }
        else if (matchGame) { type = 'game'; idToCopy = matchGame[1]; }
        else if (matchAsset) { type = 'asset'; idToCopy = matchAsset[1]; }
    }
    if (!idToCopy) {
        const path = window.location.href;
        const matchUser = path.match(/\/users\/(\d+)/);
        const matchGroup = path.match(/\/(?:groups|communities)\/(\d+)/);
        const matchGame = path.match(/\/games\/(\d+)/);
        const matchAsset = path.match(/\/(?:catalog|library|bundles)\/(\d+)/);

        if (matchUser) { type = 'user'; idToCopy = matchUser[1]; }
        else if (matchGroup) { type = 'group'; idToCopy = matchGroup[1]; }
        else if (matchGame) { type = 'game'; idToCopy = matchGame[1]; }
        else if (matchAsset) { type = 'asset'; idToCopy = matchAsset[1]; }
    }
    if (idToCopy && type) {
        chrome.runtime.sendMessage({ action: "updateContextMenu", type: type, idToCopy: idToCopy });
    } else {
        chrome.runtime.sendMessage({ action: "hideContextMenu" });
    }
});

// --- READ SETTINGS AND CHECK FOR UPDATES ---
chrome.storage.local.get([
    'mainBadgeEnabled', 
    'listBadgeEnabled', 
    'termBadgeEnabled', 
    'groupBadgeEnabled', 
    'autoPopupEnabled', 
    'updateAvailable'
], (result) => {
    if (result.mainBadgeEnabled !== undefined) settings.mainBadgeEnabled = result.mainBadgeEnabled;
    if (result.listBadgeEnabled !== undefined) settings.listBadgeEnabled = result.listBadgeEnabled;
    if (result.termBadgeEnabled !== undefined) settings.termBadgeEnabled = result.termBadgeEnabled;
    if (result.groupBadgeEnabled !== undefined) settings.groupBadgeEnabled = result.groupBadgeEnabled;
    if (result.autoPopupEnabled !== undefined) settings.autoPopupEnabled = result.autoPopupEnabled;
    
    if (result.updateAvailable) showInPageUpdateBanner();
    setTimeout(() => {
        processMainProfile();
        processGroupPage(); 
        processCommunitySearch();
        processListLinks();
    }, 100);
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
    if (changes.termBadgeEnabled) {
        settings.termBadgeEnabled = changes.termBadgeEnabled.newValue;
        if (!settings.termBadgeEnabled) removeTermBadge();
    }
    if (changes.groupBadgeEnabled) {
        settings.groupBadgeEnabled = changes.groupBadgeEnabled.newValue;
        if (!settings.groupBadgeEnabled) removeGroupBadge();
    }
    if (changes.autoPopupEnabled) {
        settings.autoPopupEnabled = changes.autoPopupEnabled.newValue;
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

    document.getElementById('scout-update-download').addEventListener('click', () => {
        window.open("https://github.com/MythicalWays5/SCOUT_Extension", "_blank");
        window.location.href = "https://github.com/MythicalWays5/SCOUT_Extension/archive/refs/heads/main.zip";
        banner.remove(); 
    });

    document.getElementById('scout-update-dismiss').addEventListener('click', () => {
        banner.remove();
    });
}

// --- CLEANUP FUNCTIONS ---
function removeMainBadge() {
    const badge = document.querySelector('.scout-dynamic-badge');
    if (badge) badge.remove();
}

function removeListBadges() {
    dynamicStyleTag.innerHTML = "";
    processedListUsers.clear();
    document.querySelectorAll('.scout-list-warning').forEach(icon => icon.remove());
    document.querySelectorAll('[data-scout-warning-processed]').forEach(el => {
        el.removeAttribute('data-scout-warning-processed');
    });
}

function removeTermBadge() {
    const badge = document.getElementById("scout-term-badge");
    if (badge) badge.remove();
}

function removeGroupBadge() {
    const badge = document.querySelector('.scout-group-badge');
    if (badge) badge.remove();
    const groupNameEl = document.querySelector(".profile-header-details-community-name");
    if (groupNameEl) delete groupNameEl.dataset.scoutProcessing;
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

function getGroupIdFromUrl() {
    const match = location.pathname.match(/\/(communities|groups)\/(\d+)/);
    return match ? match[2] : null;
}

// Fetchers
async function fetchScoutData(userId) {
    if (apiCache.has(userId)) return apiCache.get(userId);
    const fetchPromise = new Promise((resolve) => {
        chrome.runtime.sendMessage({ action: "checkUser", userId: userId }, (response) => {
            if (chrome.runtime.lastError || response.error) {
                apiCache.delete(userId); resolve(null);
            } else { resolve(response); }
        });
    });
    apiCache.set(userId, fetchPromise);
    return fetchPromise;
}

async function fetchDatabaseData(userId) {
    const cacheKey = `db_${userId}`;
    if (apiCache.has(cacheKey)) return apiCache.get(cacheKey);
    const fetchPromise = new Promise((resolve) => {
        chrome.runtime.sendMessage({ action: "checkDatabase", userId: userId }, (response) => {
            if (chrome.runtime.lastError || !response) {
                apiCache.delete(cacheKey); resolve({ isFlagged: false });
            } else { resolve(response); }
        });
    });
    apiCache.set(cacheKey, fetchPromise);
    return fetchPromise;
}

async function fetchTerminatedData(userId) {
    if (termCache.has(userId)) return termCache.get(userId);
    const fetchPromise = new Promise((resolve) => {
        chrome.runtime.sendMessage({ action: "checkTerminatedFriends", userId: userId }, (response) => {
            if (chrome.runtime.lastError || !response || response.error) {
                termCache.delete(userId); resolve(null);
            } else { resolve(response); }
        });
    });
    termCache.set(userId, fetchPromise);
    return fetchPromise;
}

async function fetchGroupData(groupId) {
    const cacheKey = `group_${groupId}`;
    if (apiCache.has(cacheKey)) return apiCache.get(cacheKey);
    const fetchPromise = new Promise((resolve) => {
        chrome.runtime.sendMessage({ action: "checkGroup", groupId: groupId }, (response) => {
            if (chrome.runtime.lastError || !response || response.error) {
                apiCache.delete(cacheKey); resolve(null);
            } else { resolve(response); }
        });
    });
    apiCache.set(cacheKey, fetchPromise);
    return fetchPromise;
}

async function showScoutIntelligenceModal(userId, status, risk) {
    if (document.getElementById('scout-intel-modal')) return;

    const statusDefs = {
        "SHADOW_SCAN": "<b>This user very likely is or was a part of the inappropriate/NSFW Roblox account network.</b><br>Flagged instantly by SCOUT's automated security grid. This detection is highly reliable, calculated using a strict mathematical formula that analyzes the user's active networks and group intersections.<br><b>Exercise extreme caution around this profile.</b>",
        "PULSE_CRAWL": "<b>This user very likely is or was a part of the inappropriate/NSFW Roblox account network.</b><br>Flagged by SCOUT's background pulse scans. This is a highly accurate detection driven by a mathematical risk formula that constantly monitors and cross-references known dangerous networks.<br><b>Exercise extreme caution around this profile.</b>",
        "DEEP_CRAWL": "<b>This user very likely is or was a part of the inappropriate/NSFW Roblox account network.</b><br>Flagged by SCOUT's heavy Deep Crawler. This system mathematically spider-webs through the connections of known threats to uncover hidden networks, making this a highly reliable detection.<br><b>Exercise extreme caution around this profile.</b>",
        "MANUAL": "Manually investigated and flagged by a S.C.O.U.T. Administrator using verified evidence.<br><b>Exercise extreme caution around this profile.</b>"
    };

    const riskDefs = {
        "CLOTHING": "User was involved with creating inappropriate fetish/kink clothing.",
        "ACTIVITY": "User was witnessed involving themselves fully with inappropriate networks and conduct.",
        "BIO": "User was found having an extremely inappropriate description, linking themselves to inappropriate networks.",
        "ASSETS": "User was found to be the owner/creator of inappropriate/NSFW assets on Roblox (audio, meshes, images, etc)."
    };

    const displayStatus = status || "UNKNOWN";
    const statusDesc = statusDefs[displayStatus] || "Detected through legacy or unknown S.C.O.U.T. protocols.";

    const overlay = document.createElement("div");
    overlay.id = "scout-intel-modal";
    overlay.className = "scout-modal-overlay";

    let riskHtml = "";
    if (displayStatus === "MANUAL") {
        const isModernTag = risk && riskDefs[risk];
        const displayRisk = isModernTag ? risk : "LEGACY";
        const displayRiskDesc = isModernTag 
            ? riskDefs[risk] 
            : "User was manually flagged in an older version of S.C.O.U.T. before structured violation tags were introduced. Threat remains verified.";

        riskHtml = `
            <div class="scout-modal-section">
                <div class="scout-modal-label">Violation Keyword</div>
                <div class="scout-modal-value" style="color: #e67e22;">${displayRisk}</div>
                <div class="scout-modal-desc">${displayRiskDesc}</div>
            </div>
        `;
    }

    overlay.innerHTML = `
        <div class="scout-modal-box" onclick="event.stopPropagation()">
            <div class="scout-modal-header">
                <img src="${chrome.runtime.getURL('scout_logo.png')}" style="width: 24px; height: 24px;">
                <h3 class="scout-modal-title">Threat Intelligence Report</h3>
            </div>
            <div class="scout-modal-section">
                <div class="scout-modal-label">Target Profile</div>
                <div class="scout-modal-value" id="scout-modal-target-username">Loading Username...</div>
            </div>
            <div class="scout-modal-section">
                <div class="scout-modal-label">Detection Vector</div>
                <div class="scout-modal-value" style="color: #e74c3c;">${displayStatus}</div>
                <div class="scout-modal-desc">${statusDesc}</div>
            </div>
            ${riskHtml}
            <button class="scout-modal-close" id="scout-modal-close-btn">Acknowledge</button>
        </div>
    `;

    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add("scout-visible"));
    try {
        const uRes = await fetch(`https://users.roblox.com/v1/users/${userId}`);
        if (uRes.ok) {
            const uData = await uRes.json();
            const nameEl = document.getElementById("scout-modal-target-username");
            if (nameEl) nameEl.textContent = `@${uData.name}`;
        }
    } catch(e) {
        const nameEl = document.getElementById("scout-modal-target-username");
        if (nameEl) nameEl.textContent = "Unknown User";
    }

    const closeModal = () => {
        overlay.classList.remove("scout-visible");
        setTimeout(() => overlay.remove(), 200);
    };

    document.getElementById("scout-modal-close-btn").addEventListener("click", closeModal);
    overlay.addEventListener("click", closeModal);
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
    if (!location.pathname.includes('/profile')) return;

    const userId = getUserIdFromUrl();
    if (!userId) return;
    
    processTerminatedFriendsBadge(userId);

    const usernameEl = document.getElementById("profile-header-title-container-name");
    if (!usernameEl) return;

    if (usernameEl.dataset.scoutProcessing) return;
    usernameEl.dataset.scoutProcessing = "true";
    
    const [data, dbData] = await Promise.all([
        fetchScoutData(userId),
        fetchDatabaseData(userId)
    ]);

    if (!document.body.contains(usernameEl)) return;
    let finalBadgeNode = usernameEl; 
    if (settings.mainBadgeEnabled && data && !usernameEl.nextElementSibling?.classList.contains("scout-dynamic-badge")) {
        const badge = createMainProfileBadge(data);
        usernameEl.insertAdjacentElement("afterend", badge);
        finalBadgeNode = badge;

        if (usernameEl.parentElement) {
            usernameEl.parentElement.style.display = "flex";
            usernameEl.parentElement.style.alignItems = "center";
        }
    }
    if (dbData && dbData.isFlagged) {
        const parentContainer = usernameEl.parentElement;
        if (parentContainer && !parentContainer.querySelector(".scout-db-warning-wrapper")) {
            const warningIcon = document.createElement("span");
            warningIcon.className = "scout-db-warning-wrapper";
            warningIcon.textContent = "!";
            warningIcon.setAttribute("data-tooltip", "This user has been flagged dangerous by the SCOUT Autonomous System. Click for details.");
            
            warningIcon.addEventListener("click", (e) => {
                e.preventDefault();
                e.stopPropagation();
                showScoutIntelligenceModal(userId, dbData.status, dbData.risk); 
            });

            finalBadgeNode.insertAdjacentElement("afterend", warningIcon);
        }
        if (settings.autoPopupEnabled && !window.scoutAutoPopupShown) {
            window.scoutAutoPopupShown = true;
            showScoutIntelligenceModal(userId, dbData.status, dbData.risk);
        }
    }
}

// ---------------- TERMINATED FRIENDS UI ----------------
async function processTerminatedFriendsBadge(userId) {
    if (!settings.termBadgeEnabled) return;

    const connectionsBtn = document.querySelector(`a[href*="/users/${userId}/friends"]`);
    if (!connectionsBtn || !connectionsBtn.parentElement) return;
    if (document.getElementById("scout-term-badge")) return;

    const badge = document.createElement("div");
    badge.id = "scout-term-badge";
    badge.style.cssText = `
        display: inline-flex;
        align-items: center;
        justify-content: center;
        margin-left: 12px;
        padding: 0 12px;
        height: 32px; 
        font-size: 14px;
        font-weight: 600;
        border-radius: 100px; 
        background-color: rgba(231, 76, 60, 0.1);
        color: #e74c3c;
        border: 1px solid rgba(231, 76, 60, 0.3);
        white-space: nowrap;
        font-family: 'Builder Sans', 'Segoe UI', Tahoma, sans-serif;
    `;
    badge.textContent = "Scanning...";
    connectionsBtn.parentElement.appendChild(badge);

    const response = await fetchTerminatedData(userId);
    const liveBadge = document.getElementById("scout-term-badge");
    if (!liveBadge) return;

    if (!response) {
        liveBadge.remove();
        return;
    }

    if (response.terminatedCount > 0) {
        liveBadge.textContent = `${response.terminatedCount} Terminated`;
        liveBadge.style.backgroundColor = "rgba(231, 76, 60, 0.15)";
        liveBadge.style.border = "1px solid #e74c3c";
    } else {
        liveBadge.textContent = "0 Terminated";
        liveBadge.style.color = "#2ecc71";
        liveBadge.style.backgroundColor = "rgba(46, 204, 113, 0.1)";
        liveBadge.style.border = "1px solid rgba(46, 204, 113, 0.3)";
    }
}

// ---------------- GROUP PAGE UI ----------------
async function processGroupPage() {
    if (!settings.groupBadgeEnabled) return;
    if (!location.pathname.match(/\/(communities|groups)\//)) return;

    const groupId = getGroupIdFromUrl();
    if (!groupId) return;

    const groupNameEl = document.querySelector(".profile-header-details-community-name");
    if (!groupNameEl) return;

    if (groupNameEl.querySelector(".scout-group-badge")) return;
    if (groupNameEl.dataset.scoutProcessing) return;
    groupNameEl.dataset.scoutProcessing = "true";

    const data = await fetchGroupData(groupId);
    if (!data || !data.isFlagged) {
        delete groupNameEl.dataset.scoutProcessing;
        return;
    }

    if (!document.body.contains(groupNameEl)) return;
    if (!settings.groupBadgeEnabled) return;
    if (groupNameEl.querySelector(".scout-group-badge")) return;

    const badge = document.createElement("span");
    badge.className = "scout-badge scout-group-badge scout-high"; 

    badge.style.cssText = `
        display: inline-flex;
        align-items: center;
        justify-content: center;
        height: 24px; 
        line-height: 24px;
        padding: 0 10px; 
        border-radius: 6px; 
        margin-left: 10px; 
        font-size: 13px;
        font-weight: 700;
        vertical-align: middle;
        box-sizing: border-box; 
    `;

    const logo = document.createElement("img");
    logo.src = chrome.runtime.getURL("scout_logo.png");
    logo.style.cssText = "width: 14px; height: 14px; margin-right: 6px; flex-shrink: 0;";
    badge.appendChild(logo);

    const textSpan = document.createElement("span");
    textSpan.textContent = "DANGEROUS GROUP";
    badge.title = "This group has been manually flagged by a SCOUT administrator due to safety concerns. Be extremely cautious with this group's activities.";
    
    badge.appendChild(textSpan);

    groupNameEl.style.display = "inline-flex";
    groupNameEl.style.alignItems = "center";

    groupNameEl.appendChild(badge);
}

// ---------------- SEARCH PAGE UI ----------------
function processCommunitySearch() {
    if (!settings.groupBadgeEnabled) return;
    if (!location.pathname.includes('/search/communities') && !location.pathname.includes('/search/groups')) return;

    const groupLinks = document.querySelectorAll('a[href*="/communities/"], a[href*="/groups/"]');

    groupLinks.forEach(async (link) => {

        const match = link.getAttribute("href").match(/\/(communities|groups)\/(\d+)/);
        if (!match) return;
        const groupId = match[2];

        const nameEl = link.querySelector('.font-header-2.text-overflow');
        if (!nameEl) return;

        if (nameEl.querySelector('.scout-search-badge')) return;
        if (nameEl.dataset.scoutProcessing) return;
        nameEl.dataset.scoutProcessing = "true";

        const data = await fetchGroupData(groupId);
        if (!data) {
            delete nameEl.dataset.scoutProcessing;
            return;
        }

        if (!document.body.contains(nameEl)) return;
        if (!settings.groupBadgeEnabled) return;
        if (nameEl.querySelector('.scout-search-badge')) return;
        if (data.isFlagged) {
            const badge = document.createElement("span");
            badge.className = "scout-badge scout-search-badge scout-high"; 

            badge.style.cssText = `
                display: inline-flex;
                align-items: center;
                justify-content: center;
                height: 20px; 
                line-height: 20px;
                padding: 0 6px; 
                border-radius: 4px; 
                margin-left: 8px; 
                font-size: 11px;
                font-weight: 700;
                vertical-align: middle;
                box-sizing: border-box;
                color: white;
                background-color: #e74c3c;
            `;
            
            const logo = document.createElement("img");
            logo.src = chrome.runtime.getURL("scout_logo.png");
            logo.style.cssText = "width: 12px; height: 12px; margin-right: 4px; flex-shrink: 0;";
            badge.appendChild(logo);

            const textSpan = document.createElement("span");
            textSpan.textContent = "DANGEROUS";
            badge.appendChild(textSpan);

            badge.title = "This group has been manually flagged by a SCOUT administrator due to safety concerns.";
            nameEl.style.display = "inline-flex";
            nameEl.style.alignItems = "center";
            nameEl.appendChild(badge);
        }
    });
}

// ---------------- PAGINATED LISTS ----------------
function processListLinks() {
    if (!settings.listBadgeEnabled) return;
    if (!location.pathname.match(/\/(friends|followers|followings?)/)) return;
    document.querySelectorAll('.scout-db-warning-wrapper').forEach(badge => {
        if (badge.parentElement && badge.parentElement.closest('.avatar-card-content, .friend-item')) {
            const prev = badge.previousElementSibling;
            if (!prev || prev.tagName !== 'A' || !prev.getAttribute("href")?.includes("/users/")) {
                badge.remove();
            }
        }
    });

    const links = Array.from(document.querySelectorAll('.avatar-name[href*="/users/"], .friend-name[href*="/users/"]'))
        .filter(a => a.textContent.trim().length > 0);

    links.forEach(async (link) => {
        const match = link.getAttribute("href").match(/\/users\/(\d+)/);
        if (!match) return;
        const userId = match[1];

        if (userId === getUserIdFromUrl()) return;
        if (link.dataset.scoutUserId !== userId) {
            const nextEl = link.nextElementSibling;
            if (nextEl && nextEl.classList.contains("scout-db-warning-wrapper")) {
                nextEl.remove();
            }
            link.removeAttribute("data-scout-warning-processed");
            link.dataset.scoutUserId = userId;
        }
        if (!link.dataset.scoutWarningProcessed) {
            link.dataset.scoutWarningProcessed = "true";
            
            const dbData = await fetchDatabaseData(userId);
            if (document.body.contains(link) && link.dataset.scoutUserId === userId) {
                if (dbData && dbData.isFlagged && settings.listBadgeEnabled) {
                    if (!link.nextElementSibling || !link.nextElementSibling.classList.contains("scout-db-warning-wrapper")) {
                        const warningIcon = document.createElement("span");
                        warningIcon.className = "scout-db-warning-wrapper";
                        warningIcon.textContent = "!";
                        warningIcon.setAttribute("data-tooltip", "This user has been flagged dangerous by the SCOUT Autonomous System. Click for details.");
                        
                        warningIcon.style.transform = "scale(0.85)"; 
                        warningIcon.style.marginLeft = "6px";
                        
                        warningIcon.addEventListener("click", (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            showScoutIntelligenceModal(userId, dbData.status, dbData.risk);
                        });

                        link.insertAdjacentElement("afterend", warningIcon);
                    }
                }
            }
        }
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
        processGroupPage(); 
        processCommunitySearch();
        processListLinks();
    }, 500); 
});
observer.observe(document.body, { childList: true, subtree: true });

window.addEventListener("hashchange", () => {
    setTimeout(() => {
        processMainProfile();
        processGroupPage(); 
        processCommunitySearch();
        processListLinks();
    }, 100); 
});

setInterval(() => {
    processMainProfile();
    processGroupPage(); 
    processCommunitySearch();
    processListLinks();
}, 2000); 

setTimeout(() => {
    processMainProfile();
    processGroupPage(); 
    processCommunitySearch();
    processListLinks();
}, 500);

// ---------------- CLIPBOARD LISTENER ----------------
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "copyToClipboard") {
        const textArea = document.createElement("textarea");
        textArea.value = request.text;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
            document.execCommand('copy');
            console.log(`SCOUT: Copied ${request.text} to clipboard!`);
        } catch (err) {
            console.error('SCOUT: Failed to copy ID', err);
        }
        document.body.removeChild(textArea);
        sendResponse({ success: true });
    }
});