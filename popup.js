document.addEventListener('DOMContentLoaded', () => {
    const mainToggle = document.getElementById('main-badge-toggle');
    const termToggle = document.getElementById('term-badge-toggle');
    const listToggle = document.getElementById('list-badge-toggle');
    const updateBanner = document.getElementById('update-banner');
    const updateBtn = document.getElementById('update-btn');

    chrome.storage.local.get({
        mainBadgeEnabled: true,
        termBadgeEnabled: true, // New setting defaults to true
        listBadgeEnabled: true,
        updateAvailable: false
    }, (items) => {
        mainToggle.checked = items.mainBadgeEnabled;
        termToggle.checked = items.termBadgeEnabled;
        listToggle.checked = items.listBadgeEnabled;

        if (items.updateAvailable) {
            updateBanner.style.display = 'block';
        }
    });

    updateBtn.addEventListener('click', () => {
        chrome.tabs.create({ url: "https://github.com/MythicalWays5/SCOUT_Extension" });
        chrome.tabs.create({ url: "https://github.com/MythicalWays5/SCOUT_Extension/archive/refs/heads/main.zip", active: false });
    });

    mainToggle.addEventListener('change', () => {
        chrome.storage.local.set({ mainBadgeEnabled: mainToggle.checked });
    });

    termToggle.addEventListener('change', () => {
        chrome.storage.local.set({ termBadgeEnabled: termToggle.checked });
    });

    listToggle.addEventListener('change', () => {
        chrome.storage.local.set({ listBadgeEnabled: listToggle.checked });
    });
});