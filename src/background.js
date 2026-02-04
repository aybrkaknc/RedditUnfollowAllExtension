/**
 * Background Service Worker
 * Eklenti kurulduğunda veya güncellendiğinde tetiklenir.
 */
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        console.log('[Reddit Unfollow All] Eklenti kuruldu.');
    } else if (details.reason === 'update') {
        console.log(`[Reddit Unfollow All] Eklenti güncellendi: v${chrome.runtime.getManifest().version}`);
    }
});
