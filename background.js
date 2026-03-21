console.log("SCOUT Background Worker Active");

const UPDATE_API_URL = "https://scout-extension-notif.odinseyerblx.workers.dev/"; 
const MASTER_LIST_URL = "https://raw.githubusercontent.com/OdinsEyeRBLX/RobloxSafetyUtilities/main/FLAGGED%20ERP%20GROUPS.txt";

let cachedFlaggedGroups = null;

// ---------------- UPDATE CHECKER ----------------
async function checkForUpdates() {
    const data = await chrome.storage.local.get(['lastUpdateCheck']);
    const now = Date.now();
    const TWELVE_HOURS = 12 * 60 * 60 * 1000;

    if (data.lastUpdateCheck && (now - data.lastUpdateCheck < TWELVE_HOURS)) {
        return; 
    }

    try {
        const res = await fetch(UPDATE_API_URL);
        if (!res.ok) return;
        
        const config = await res.json();
        const currentVersion = chrome.runtime.getManifest().version;
        
        const remoteVer = parseFloat(config.latestVersion);
        const localVer = parseFloat(currentVersion);
        
        if (remoteVer > localVer) {
            chrome.storage.local.set({ updateAvailable: true });
            
            chrome.notifications.create("scout-update", {
                type: "basic",
                iconUrl: "scout_logo.png",
                title: "S.C.O.U.T. Update Available!",
                message: "A new version of S.C.O.U.T. is available. Please click your extension icon to download it.",
                priority: 2
            });
        } else {
            chrome.storage.local.set({ updateAvailable: false });
        }
        chrome.storage.local.set({ lastUpdateCheck: now });

    } catch (e) {
        console.warn("SCOUT: Update check failed silently.");
    }
}

checkForUpdates();
setInterval(checkForUpdates, 12 * 60 * 60 * 1000);

// ---------------- GROUP LIST LOADER ----------------
async function getFlaggedGroups() {
    if (cachedFlaggedGroups) return cachedFlaggedGroups;
    const cacheBusterUrl = `${MASTER_LIST_URL}?t=${Date.now()}`;
    const res = await fetch(cacheBusterUrl);
    if (!res.ok) throw new Error("Failed to fetch list from GitHub");
    
    const text = await res.text();
    cachedFlaggedGroups = new Set(
        text.split(",")
            .map(x => x.trim())
            .filter(x => /^\d+$/.test(x))
            .map(Number)
    );
    
    console.log(`SCOUT: Loaded ${cachedFlaggedGroups.size} groups from GitHub into memory.`);
    return cachedFlaggedGroups;
}

// ---------------- LOCAL SCANNER ----------------
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "checkUser") {
        handleCheckUser(request.userId).then(sendResponse);
        return true; 
    }
    if (request.action === "checkTerminatedFriends") {
        handleTerminatedFriends(request.userId).then(sendResponse);
        return true;
    }
});

async function handleCheckUser(userId) {
    try {
        const flaggedGroups = await getFlaggedGroups();

        const groupRes = await fetch(`https://groups.roblox.com/v1/users/${userId}/groups/roles`);
        if (!groupRes.ok) throw new Error("Roblox Group API Limit");
        
        const groupData = await groupRes.json();
        const userGroups = groupData.data || [];

        let flaggedCount = 0;
        for (const g of userGroups) {
            if (flaggedGroups.has(g.group.id)) {
                flaggedCount++;
            }
        }

        let riskLevel = "safe";
        if (flaggedCount >= 10) riskLevel = "high";
        else if (flaggedCount >= 5) riskLevel = "medium";
        else if (flaggedCount > 0) riskLevel = "low";

        return {
            flaggedGroupCount: flaggedCount,
            risk: riskLevel
        };

    } catch (err) {
        return { error: err.message };
    }
}
// ---------------- TERMINATED FRIENDS SCANNER ----------------
async function handleTerminatedFriends(userId) {
    try {
        const friendsRes = await fetch(`https://friends.roblox.com/v1/users/${userId}/friends`);
        if (!friendsRes.ok) throw new Error("Roblox API Limit");
        
        const friendsData = await friendsRes.json();
        const friends = friendsData.data || [];

        if (friends.length === 0) return { terminatedCount: 0 };

        let terminatedCount = 0;
        const chunkSize = 10;
        for (let i = 0; i < friends.length; i += chunkSize) {
            const chunk = friends.slice(i, i + chunkSize);
            await Promise.all(chunk.map(async (friend) => {
                try {
                    const userRes = await fetch(`https://users.roblox.com/v1/users/${friend.id}`);
                    if (!userRes.ok) return;
                    
                    const userData = await userRes.json();
                    if (userData.isBanned) {
                        terminatedCount++;
                    }
                } catch (e) {
                }
            }));
            await new Promise(resolve => setTimeout(resolve, 150));  //simple wait time for rate limits
        }

        return { terminatedCount };
    } catch (err) {
        console.error("SCOUT Terminated Friends Error:", err);
        return { error: err.message };
    }
}