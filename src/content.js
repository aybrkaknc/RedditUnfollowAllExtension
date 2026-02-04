/**
 * Reddit Unfollow All - Content Script
 * Sayfada çalışan ana mantık. Panel enjeksiyonu, beyaz liste ve buton işlemleri.
 */
(function () {
    'use strict';

    // =============================================
    // ÇOKLAMA KONTROLÜ (Extension birden fazla çalışmasın)
    // =============================================
    if (window.__REDDIT_UNFOLLOW_ALL_LOADED__) return;
    window.__REDDIT_UNFOLLOW_ALL_LOADED__ = true;

    // =============================================
    // DİL ÇEVİRİLERİ (i18n)
    // =============================================
    const I18N = {
        tr: {
            title: "Reddit Unfollow All",
            total: "TOPLAM",
            done: "ÇIKILDI",
            kept: "KORUNAN",
            start: "BAŞLAT",
            pause: "DURAKLAT",
            resume: "DEVAM ET",
            whitelist: "BEYAZ LİSTE",
            speed: "Hız Seçimi",
            slow: "Yavaş",
            normal: "Normal",
            fast: "Hızlı",
            turbo: "Turbo",
            ready: "Sistem hazır. Butonlar aranıyor...",
            found: "Sistem: {n} adet abonelik bulundu.",
            notFound: "Hata: Temizlenecek abonelik bulunamadı.",
            started: "İşlem başlatıldı...",
            paused: "İşlem duraklatıldı.",
            resumed: "İşlem devam ediyor...",
            success: "Çıkıldı: {s}",
            skipped: "Korundu: {s}",
            error: "Hata: Bir butona tıklanamadı, atlanıyor.",
            completed: "✅ İşlem tamamlandı!",
            reloadConfirm: "Tüm işlemler bitti. Sayfayı yenileyerek kontrol etmek ister misiniz?",
            noButtons: "Abonelik bulunamadı veya sayfa henüz yüklenmedi.",
            minimize: "Küçült",
            close: "Kapat",
            move: "Taşı",
            searchPlaceholder: "Ara...",
            selectAll: "Tümünü Koru",
            deselectAll: "Hiçbirini Koruma",
            langSwitch: "EN"
        },
        en: {
            title: "Reddit Unfollow All",
            total: "TOTAL",
            done: "DONE",
            kept: "KEPT",
            start: "START",
            pause: "PAUSE",
            resume: "RESUME",
            whitelist: "WHITELIST",
            speed: "Speed Select",
            slow: "Slow",
            normal: "Normal",
            fast: "Fast",
            turbo: "Turbo",
            ready: "System ready. Scanning buttons...",
            found: "System: {n} subscriptions found.",
            notFound: "Error: No subscriptions found to clear.",
            started: "Process started...",
            paused: "Process paused.",
            resumed: "Process resumed...",
            success: "Left: {s}",
            skipped: "Kept: {s}",
            error: "Error: Could not click button, skipping.",
            completed: "✅ Process completed!",
            reloadConfirm: "All processes finished. Would you like to reload the page to check?",
            noButtons: "No subscriptions found or page not loaded yet.",
            minimize: "Minimize",
            close: "Close",
            move: "Move",
            searchPlaceholder: "Search...",
            selectAll: "Keep All",
            deselectAll: "Keep None",
            langSwitch: "TR"
        }
    };

    // Default: English
    let currentLang = 'en';
    let t = I18N[currentLang];

    // =============================================
    // UYGULAMA DURUMU
    // =============================================
    const State = {
        isPaused: true,
        isMinimized: false,
        isListOpen: false,
        currentIndex: 0,
        unsubscribedCount: 0,
        keptCount: 0,
        totalActions: 0,
        delay: 800,
        buttons: [],
        whitelist: new Set()
    };

    // =============================================
    // REDDIT ICON (SVG)
    // =============================================
    const REDDIT_ICON_SVG = `<svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" style="color: #FF4500;"><path d="M16.67 10c0-1.1-.9-2-2-2-.25 0-.48.05-.7.13a7.43 7.43 0 0 0-3.97-1.25l.68-3.04 2.21.47c.05.61.56 1.1 1.18 1.1 1.1 0 2-.9 2-2s-.9-2-2-2c-.88 0-1.61.57-1.89 1.34L9.84 2.1c-.13-.03-.27 0-.38.08-.1.08-.15.21-.13.34l-.79 3.55a7.43 7.43 0 0 0-4.04 1.25c-.22-.08-.45-.13-.7-.13-1.1 0-2 .9-2 2 0 .73.4 1.37 1 1.71v.04c0 2.65 3.36 4.8 7.5 4.8s7.5-2.15 7.5-4.8v-.04c.6-.34 1-.98 1-1.71zM6.5 10.5c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm6.33 3.65c-.56.56-1.54.85-2.83.85s-2.27-.29-2.83-.85a.34.34 0 0 1 0-.48c.13-.13.35-.13.48 0 .44.44 1.27.66 2.35.66s1.91-.22 2.35-.66a.34.34 0 0 1 .48 0c.13.13.13.35 0 .48zm-.83-1.65c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"/></svg>`;

    // =============================================
    // UI PANEL ENJEKSİYONU
    // =============================================
    function injectUI() {
        const panel = document.createElement('div');
        panel.id = 'reddit-unfollow-panel';
        panel.innerHTML = `
            <div class="panel-header">
                <h2>${REDDIT_ICON_SVG} ${t.title}</h2>
                <div class="window-controls">
                    <span id="btn-refresh" class="ctrl-btn refresh-btn" title="Refresh">↻</span>
                    <span class="ctrl-btn move-icon" title="${t.move}">✥</span>
                    <span id="btn-minimize" class="ctrl-btn" title="${t.minimize}">−</span>
                    <span id="btn-close" class="ctrl-btn close-btn" title="${t.close}">×</span>
                </div>
            </div>
            
            <div class="panel-content">
                <div class="stat-grid">
                    <div class="stat-card">
                        <div class="stat-label">${t.total}</div>
                        <div id="stat-total" class="stat-value">0</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">${t.done}</div>
                        <div id="stat-done" class="stat-value">0</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">${t.kept}</div>
                        <div id="stat-kept" class="stat-value">0</div>
                    </div>
                </div>

                <div class="progress-container">
                    <div id="progress-bar"></div>
                </div>

                <div class="controls">
                    <button id="btn-review" class="btn btn-secondary">${t.whitelist}</button>
                    <button id="btn-start" class="btn btn-primary">${t.start}</button>
                    <button id="btn-pause" class="btn btn-secondary" disabled>${t.pause}</button>
                </div>

                <!-- Whitelist Container (Hidden by Default) -->
                <div id="whitelist-container" class="whitelist-container hidden">
                    <div class="whitelist-header">
                        <input type="text" id="whitelist-search" class="whitelist-search" placeholder="${t.searchPlaceholder}" />
                        <div class="whitelist-actions">
                            <button id="btn-select-all" class="btn btn-small">${t.selectAll}</button>
                            <button id="btn-deselect-all" class="btn btn-small">${t.deselectAll}</button>
                        </div>
                    </div>
                    <div id="whitelist-list" class="whitelist-list">
                        <!-- Items will be rendered here -->
                    </div>
                </div>

                <div class="settings">
                    <div style="font-size: 11px; margin-bottom: 5px;">${t.speed}</div>
                    <div class="speed-group">
                        <button class="btn btn-speed" data-speed="1500">${t.slow}</button>
                        <button class="btn btn-speed active" data-speed="800">${t.normal}</button>
                        <button class="btn btn-speed" data-speed="400">${t.fast}</button>
                        <button class="btn btn-speed" data-speed="200">${t.turbo}</button>
                    </div>
                </div>

                <div class="footer-controls" style="display: flex; justify-content: space-between; align-items: flex-end;">
                    <div id="log-area" class="log-area" style="flex: 1;">${t.ready}</div>
                    <span id="btn-lang" class="ctrl-btn lang-btn" title="Language" style="margin-left: 10px; margin-bottom: 5px;">${t.langSwitch}</span>
                </div>
            </div>
        `;
        document.body.appendChild(panel);

        // Event Listeners
        document.getElementById('btn-start').addEventListener('click', startUnfollowing);
        document.getElementById('btn-pause').addEventListener('click', togglePause);
        document.getElementById('btn-close').addEventListener('click', () => panel.remove());
        document.getElementById('btn-minimize').addEventListener('click', toggleMinimize);
        document.getElementById('btn-review').addEventListener('click', toggleWhitelistView);
        document.getElementById('btn-select-all').addEventListener('click', selectAll);
        document.getElementById('btn-deselect-all').addEventListener('click', deselectAll);
        document.getElementById('whitelist-search').addEventListener('input', filterList);
        document.getElementById('btn-lang').addEventListener('click', switchLanguage);
        document.getElementById('btn-refresh').addEventListener('click', () => window.location.reload());

        const speedBtns = panel.querySelectorAll('.btn-speed');
        speedBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                speedBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                State.delay = parseInt(btn.getAttribute('data-speed'));
                log(`Speed: ${State.delay}ms`);
            });
        });

        makeDraggable(panel);
    }

    function switchLanguage() {
        currentLang = currentLang === 'en' ? 'tr' : 'en';
        t = I18N[currentLang];

        // Re-render the panel
        const oldPanel = document.getElementById('reddit-unfollow-panel');
        if (oldPanel) oldPanel.remove();

        injectUI();

        // Restore state to UI
        if (State.totalActions > 0) {
            updateUI();
            if (State.isListOpen) {
                document.getElementById('whitelist-container').classList.remove('hidden');
                renderWhitelist();
            }
        }

        // Re-scan to populate list
        scanButtons();
    }

    function toggleMinimize() {
        State.isMinimized = !State.isMinimized;
        const panel = document.getElementById('reddit-unfollow-panel');
        const btn = document.getElementById('btn-minimize');
        if (State.isMinimized) {
            panel.classList.add('minimized');
            btn.innerText = '+';
        } else {
            panel.classList.remove('minimized');
            btn.innerText = '−';
        }
    }

    function toggleWhitelistView() {
        State.isListOpen = !State.isListOpen;
        const container = document.getElementById('whitelist-container');
        if (State.isListOpen) {
            container.classList.remove('hidden');
            renderWhitelist();
        } else {
            container.classList.add('hidden');
        }
    }

    function renderWhitelist() {
        const listEl = document.getElementById('whitelist-list');
        listEl.innerHTML = '';

        State.buttons.forEach((item, index) => {
            const row = document.createElement('div');
            row.className = 'whitelist-row';
            row.dataset.name = item.name.toLowerCase();

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = `keep-${index}`;
            checkbox.className = 'keep-checkbox';
            checkbox.checked = State.whitelist.has(item.name);
            checkbox.addEventListener('change', () => {
                if (checkbox.checked) {
                    State.whitelist.add(item.name);
                } else {
                    State.whitelist.delete(item.name);
                }
                updateUI();
            });

            const label = document.createElement('label');
            label.htmlFor = `keep-${index}`;
            label.textContent = item.name;

            row.appendChild(checkbox);
            row.appendChild(label);
            listEl.appendChild(row);
        });
    }

    function filterList(e) {
        const query = e.target.value.toLowerCase();
        const rows = document.querySelectorAll('.whitelist-row');
        rows.forEach(row => {
            if (row.dataset.name.includes(query)) {
                row.style.display = 'flex';
            } else {
                row.style.display = 'none';
            }
        });
    }

    function selectAll() {
        State.buttons.forEach(item => State.whitelist.add(item.name));
        renderWhitelist();
        updateUI();
    }

    function deselectAll() {
        State.whitelist.clear();
        renderWhitelist();
        updateUI();
    }

    function makeDraggable(el) {
        let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
        const header = el.querySelector('.panel-header');
        if (header) header.onmousedown = dragMouseDown;

        function dragMouseDown(e) {
            if (e.target.classList.contains('ctrl-btn')) return;
            e.preventDefault();
            pos3 = e.clientX;
            pos4 = e.clientY;
            document.onmouseup = closeDragElement;
            document.onmousemove = elementDrag;
            el.style.transition = 'none';
        }

        function elementDrag(e) {
            e.preventDefault();
            pos1 = pos3 - e.clientX;
            pos2 = pos4 - e.clientY;
            pos3 = e.clientX;
            pos4 = e.clientY;
            el.style.top = (el.offsetTop - pos2) + "px";
            el.style.left = (el.offsetLeft - pos1) + "px";
            el.style.bottom = 'auto';
            el.style.right = 'auto';
        }

        function closeDragElement() {
            document.onmouseup = null;
            document.onmousemove = null;
            el.style.transition = 'opacity 0.3s ease, height 0.3s ease, padding 0.3s ease';
        }
    }

    // =============================================
    // BUTON TARAMA
    // =============================================
    function scanButtons() {
        let found = [];

        // Shreddit Custom Element
        const shredditButtons = document.querySelectorAll('shreddit-join-button');
        shredditButtons.forEach(btn => {
            const isSubscribed = btn.hasAttribute('subscribed');
            const type = btn.getAttribute('button-type');
            let hasJoinedText = false;
            if (btn.shadowRoot) {
                const innerBtn = btn.shadowRoot.querySelector('button');
                if (innerBtn) {
                    const text = (innerBtn.innerText || '').trim().toLowerCase();
                    hasJoinedText = text.includes('katıldı') || text.includes('joined');
                }
            }
            if (isSubscribed || type === 'joined' || type === 'member' || hasJoinedText) {
                const name = btn.getAttribute('name') || 'Unknown';
                const id = btn.getAttribute('subreddit-id') || `idx-${found.length}`;
                found.push({ element: btn, name, id });
            }
        });

        // Old Reddit (Klasik & Sidebar)
        const oldReddit = document.querySelectorAll('a.option.remove');
        oldReddit.forEach((btn, i) => {
            let name = null;
            let id = `old-${i}`;

            // 1. Sidebar/Liste Yapısı (fancy-toggle-button) - EN GÜVENİLİR
            const fancySpan = btn.closest('.fancy-toggle-button');
            if (fancySpan) {
                // data-sr_name attribute'unu doğrudan oku (dataset camelCase sorunu olabilir)
                const srName = fancySpan.getAttribute('data-sr_name');
                if (srName) {
                    name = srName;
                } else {
                    // Option A: En yakın <li> elementine çık ve orada .title ara
                    const listItem = btn.closest('li');
                    if (listItem) {
                        const titleLink = listItem.querySelector('a.title');
                        if (titleLink) {
                            name = titleLink.textContent.trim();
                        }
                    } else if (fancySpan.parentElement) {
                        // Fallback: li bulunamazsa parent'a bak
                        const titleLink = fancySpan.parentElement.querySelector('a.title');
                        if (titleLink) {
                            name = titleLink.textContent.trim();
                        }
                    }
                }
            }

            // 2. ".thing" elementi üzerinden (data-subreddit attribute)
            if (!name) {
                const thing = btn.closest('.thing');
                if (thing) {
                    if (thing.dataset.subreddit) {
                        name = thing.dataset.subreddit;
                    }
                    if (thing.dataset.fullname) {
                        id = thing.dataset.fullname;
                    }

                    // Thing içindeki başlık linki
                    if (!name) {
                        const infoLink = thing.querySelector('a.subreddit-info, a.title');
                        if (infoLink) {
                            const href = infoLink.getAttribute('href') || '';
                            const match = href.match(/\/r\/([^\/]+)/);
                            name = match ? match[1] : infoLink.textContent.trim();
                        }
                    }
                }
            }

            // 3. ".subreddit-info" veya ".entry .subreddit" içinden
            if (!name) {
                const entry = btn.closest('.entry');
                if (entry) {
                    const subredditLink = entry.querySelector('.subreddit');
                    if (subredditLink) {
                        name = subredditLink.textContent.trim();
                    }
                }
            }

            // 4. Sidebar Görünümü (Eski fallback)
            if (!name) {
                const side = btn.closest('.side');
                if (side) {
                    const sideTitle = document.querySelector('.side .redditname a');
                    if (sideTitle) {
                        name = sideTitle.textContent.trim();
                    }
                }
            }

            // 5. Sayfa Başlığı
            if (!name) {
                const headerName = document.querySelector('.pagename a');
                if (headerName) {
                    name = headerName.textContent.trim();
                }
            }

            // 6. Temizleme ve Numaralandırma
            if (!name || name === 'subreddit\'ler' || name.toLowerCase().includes('subreddit')) {
                name = `r/subreddit_${i + 1}`;
            }

            found.push({ element: btn, name, id });
        });

        State.buttons = found;
        State.totalActions = found.length;
        updateUI();
        log(t.found.replace('{n}', State.totalActions));

        if (State.totalActions === 0) {
            log(t.notFound);
        }
    }

    function updateUI() {
        document.getElementById('stat-total').innerText = State.totalActions;
        document.getElementById('stat-done').innerText = State.unsubscribedCount;
        document.getElementById('stat-kept').innerText = State.whitelist.size;

        const processed = State.unsubscribedCount + State.keptCount;
        const progress = State.totalActions > 0 ? (processed / State.totalActions) * 100 : 0;
        document.getElementById('progress-bar').style.width = `${progress}%`;
    }

    function log(message) {
        const logArea = document.getElementById('log-area');
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        logArea.innerHTML = `[${time}] ${message}<br>` + logArea.innerHTML;
    }

    function startUnfollowing() {
        if (State.totalActions === 0) {
            scanButtons();
            if (State.totalActions === 0) {
                alert(t.noButtons);
                return;
            }
        }

        State.isPaused = false;
        State.currentIndex = 0;
        State.unsubscribedCount = 0;
        State.keptCount = 0;
        document.getElementById('btn-start').disabled = true;
        document.getElementById('btn-review').disabled = true;
        document.getElementById('btn-pause').disabled = false;
        document.getElementById('btn-pause').innerText = t.pause;

        log(t.started);
        processNext();
    }

    function togglePause() {
        State.isPaused = !State.isPaused;
        const btn = document.getElementById('btn-pause');
        if (State.isPaused) {
            btn.innerText = t.resume;
            log(t.paused);
        } else {
            btn.innerText = t.pause;
            log(t.resumed);
            processNext();
        }
    }

    function simulateClick(element) {
        ['mousedown', 'mouseup', 'click'].forEach(eventType => {
            element.dispatchEvent(new MouseEvent(eventType, { bubbles: true, cancelable: true, view: window }));
        });
    }

    async function processNext() {
        if (State.isPaused) return;

        if (State.currentIndex < State.totalActions) {
            const item = State.buttons[State.currentIndex];

            // Whitelist Kontrolü
            if (State.whitelist.has(item.name)) {
                log(t.skipped.replace('{s}', item.name.substring(0, 25)));
                State.keptCount++;
                State.currentIndex++;
                updateUI();
                setTimeout(processNext, 100);
                return;
            }

            if (document.body.contains(item.element)) {
                try {
                    if (item.element.tagName.toLowerCase() === 'shreddit-join-button') {
                        if (item.element.shadowRoot) {
                            const innerBtn = item.element.shadowRoot.querySelector('button');
                            if (innerBtn) simulateClick(innerBtn);
                            else simulateClick(item.element);
                        } else {
                            simulateClick(item.element);
                        }
                    } else {
                        simulateClick(item.element);
                    }

                    log(t.success.replace('{s}', item.name.substring(0, 25)));
                    await new Promise(r => setTimeout(r, 300));

                    // Modal kontrolü
                    const modalButtons = document.querySelectorAll('div[role="dialog"] button');
                    for (let modalBtn of modalButtons) {
                        const text = (modalBtn.innerText || '').toLowerCase();
                        if (text.includes('leave') || text.includes('ayrıl') || text.includes('yes') || text.includes('evet')) {
                            simulateClick(modalBtn);
                            break;
                        }
                    }

                    State.unsubscribedCount++;
                } catch (e) {
                    log(t.error);
                    console.error(e);
                }
            }

            State.currentIndex++;
            updateUI();
            setTimeout(processNext, State.delay);
        } else {
            complete();
        }
    }

    function complete() {
        log(t.completed);
        document.getElementById('btn-pause').disabled = true;
        document.getElementById('btn-start').disabled = false;
        document.getElementById('btn-review').disabled = false;

        setTimeout(() => {
            if (confirm(t.reloadConfirm)) {
                window.location.reload();
            }
        }, 1500);
    }

    injectUI();
    setTimeout(scanButtons, 1500);
    setTimeout(scanButtons, 4000);

})();
