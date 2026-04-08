document.addEventListener('DOMContentLoaded', () => {
    const mainToggle = document.getElementById('main-badge-toggle');
    const termToggle = document.getElementById('term-badge-toggle');
    const groupToggle = document.getElementById('group-badge-toggle');
    const listToggle = document.getElementById('list-badge-toggle');
    const autoPopupToggle = document.getElementById('auto-popup-toggle');
    const updateBanner = document.getElementById('update-banner');
    const updateBtn = document.getElementById('update-btn');
    chrome.storage.local.get({
        mainBadgeEnabled: true,
        termBadgeEnabled: true, 
        groupBadgeEnabled: true,
        listBadgeEnabled: true,
        autoPopupEnabled: true,
        updateAvailable: false
    }, (items) => {
        if (mainToggle) mainToggle.checked = items.mainBadgeEnabled;
        if (termToggle) termToggle.checked = items.termBadgeEnabled;
        if (groupToggle) groupToggle.checked = items.groupBadgeEnabled;
        if (listToggle) listToggle.checked = items.listBadgeEnabled;
        if (autoPopupToggle) autoPopupToggle.checked = items.autoPopupEnabled;

        if (items.updateAvailable && updateBanner) {
            updateBanner.style.display = 'block';
        }
    });

    if (updateBtn) {
        updateBtn.addEventListener('click', () => {
            chrome.tabs.create({ url: "https://github.com/MythicalWays5/SCOUT_Extension" });
            chrome.tabs.create({ url: "https://github.com/MythicalWays5/SCOUT_Extension/archive/refs/heads/main.zip", active: false });
        });
    }

    if (mainToggle) {
        mainToggle.addEventListener('change', () => chrome.storage.local.set({ mainBadgeEnabled: mainToggle.checked }));
    }
    if (termToggle) {
        termToggle.addEventListener('change', () => chrome.storage.local.set({ termBadgeEnabled: termToggle.checked }));
    }
    if (groupToggle) {
        groupToggle.addEventListener('change', () => chrome.storage.local.set({ groupBadgeEnabled: groupToggle.checked }));
    }
    if (listToggle) {
        listToggle.addEventListener('change', () => chrome.storage.local.set({ listBadgeEnabled: listToggle.checked }));
    }
    if (autoPopupToggle) {
        autoPopupToggle.addEventListener('change', () => chrome.storage.local.set({ autoPopupEnabled: autoPopupToggle.checked }));
    }
});