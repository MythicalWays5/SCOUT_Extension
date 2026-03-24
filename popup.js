document.addEventListener('DOMContentLoaded', () => {
    const mainToggle = document.getElementById('main-badge-toggle');
    const termToggle = document.getElementById('term-badge-toggle');
    const groupToggle = document.getElementById('group-badge-toggle');
    const listToggle = document.getElementById('list-badge-toggle');
    
    const updateBanner = document.getElementById('update-banner');
    const updateBtn = document.getElementById('update-btn');

    // Fetch saved settings or default them to true
    chrome.storage.local.get({
        mainBadgeEnabled: true,
        termBadgeEnabled: true, 
        groupBadgeEnabled: true,
        listBadgeEnabled: true,
        updateAvailable: false
    }, (items) => {
        mainToggle.checked = items.mainBadgeEnabled;
        termToggle.checked = items.termBadgeEnabled;
        groupToggle.checked = items.groupBadgeEnabled;
        listToggle.checked = items.listBadgeEnabled;

        if (items.updateAvailable) {
            updateBanner.style.display = 'block';
        }
    });

    updateBtn.addEventListener('click', () => {
        chrome.tabs.create({ url: "https://github.com/MythicalWays5/SCOUT_Extension" });
        chrome.tabs.create({ url: "https://github.com/MythicalWays5/SCOUT_Extension/archive/refs/heads/main.zip", active: false });
    });

    // Save settings when toggled
    mainToggle.addEventListener('change', () => {
        chrome.storage.local.set({ mainBadgeEnabled: mainToggle.checked });
    });

    termToggle.addEventListener('change', () => {
        chrome.storage.local.set({ termBadgeEnabled: termToggle.checked });
    });

    groupToggle.addEventListener('change', () => {
        chrome.storage.local.set({ groupBadgeEnabled: groupToggle.checked });
    });

    listToggle.addEventListener('change', () => {
        chrome.storage.local.set({ listBadgeEnabled: listToggle.checked });
    });
});