
// Detect which page we're on
const isLandingPage = window.location.pathname.includes('index.html') || window.location.pathname.endsWith('/');
const isMainPage = window.location.pathname.includes('main.html');

// Landing page logic
if (isLandingPage) {
    // Apply theme on landing page
    const THEME_KEY = "bootstrap-notes-theme";
    const defaultTheme = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    const stored = localStorage.getItem(THEME_KEY);
    const theme = stored === "dark" || stored === "light" ? stored : defaultTheme;
    
    document.body.classList.toggle("dark-theme", theme === "dark");
    document.body.classList.toggle("light-theme", theme === "light");
    const versionBtn = document.getElementById('versionBtn');
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    const aboutModal = document.getElementById('aboutModal');

    const applyTheme = (theme) => {
        document.body.classList.toggle("dark-theme", theme === "dark");
        document.body.classList.toggle("light-theme", theme === "light");
        if (themeToggleBtn) {
            themeToggleBtn.innerHTML = theme === 'dark' ? '<i class="ri-sun-line"></i>' : '<i class="ri-moon-line"></i>';
        }
        localStorage.setItem(THEME_KEY, theme);
    };

    // Initialize theme toggle icon
    applyTheme(theme);

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            const current = localStorage.getItem(THEME_KEY) || theme;
            const next = current === 'dark' ? 'light' : 'dark';
            applyTheme(next);
        });
    }

    // About modal toggle
    if (versionBtn && aboutModal) {
        versionBtn.addEventListener('click', () => {
            aboutModal.classList.add('show');
            aboutModal.setAttribute('aria-hidden', 'false');
        });
        const closeBtn = document.getElementById('closeAboutModal');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                aboutModal.classList.remove('show');
                aboutModal.setAttribute('aria-hidden', 'true');
            });
        }
        // click outside
        aboutModal.addEventListener('click', (e) => {
            if (e.target === aboutModal) {
                aboutModal.classList.remove('show');
                aboutModal.setAttribute('aria-hidden', 'true');
            }
        });
        document.addEventListener('keydown', (e)=>{
            if (e.key === 'Escape' && aboutModal.classList.contains('show')) {
                aboutModal.classList.remove('show');
                aboutModal.setAttribute('aria-hidden', 'true');
            }
        });
    }
    
    const getStartedBtn = document.getElementById("getStartedBtn");
    const heroSeriesGrid = document.getElementById("heroSeriesGrid");
    const searchForm = document.getElementById('seriesSearchForm');
    const searchInput = document.getElementById('seriesSearch');
    const searchSuggestions = document.getElementById('searchSuggestions');
    let landingSeries = [];

    function navigateToApp(series = null) {
        const url = series ? `main.html?series=${series}` : "main.html";
        window.location.href = url;
    }

    // Fetch and display series dynamically
    const loadSeries = async () => {
        try {
            const response = await fetch('./api/series/get_all.php');
            if (!response.ok) {
                throw new Error('Failed to fetch series');
            }
            
            const result = await response.json();
            if (!result.success || !result.data) {
                throw new Error(result.message || 'Failed to load series');
            }
            
            // Clear loading message
            heroSeriesGrid.innerHTML = '';
            
            // Save the full series list for search and other behaviors
            landingSeries = result.data;

            // Limit series shown to the homepage to a maximum of 6
            const displayedSeries = landingSeries.slice(0, 6);

            // Create series cards dynamically
            displayedSeries.forEach(series => {
                const card = document.createElement('button');
                card.className = 'hero-series-card';
                card.dataset.series = series.code;
                card.innerHTML = `
                    <i class="${series.icon}"></i>
                    <span>${series.name}</span>
                `;
                card.addEventListener('click', () => {
                    navigateToApp(series.code);
                });
                heroSeriesGrid.appendChild(card);
            });
            
            // Set up Get Started button with first series displayed or default
            if (getStartedBtn) {
                const defaultSeries = displayedSeries.length > 0 ? displayedSeries[0].code : (result.data.length > 0 ? result.data[0].code : 'BS');
                getStartedBtn.addEventListener("click", () => {
                    navigateToApp(defaultSeries);
                });
            }

                // Initialize search handlers
                if (searchForm && searchInput) {
                    searchForm.addEventListener('submit', (e) => {
                        e.preventDefault();
                        const q = searchInput.value.trim();
                        if (!q) return;
                        handleSeriesSearch(q);
                    });

                    searchInput.addEventListener('input', (e) => {
                        const q = e.target.value.trim();
                        if (!q) {
                            searchSuggestions.hidden = true;
                            searchSuggestions.innerHTML = '';
                            return;
                        }
                        const matches = findSeriesMatches(q, 5);
                        renderSearchSuggestions(matches);
                    });

                    document.addEventListener('click', (ev) => {
                        if (!searchForm.contains(ev.target)) {
                            searchSuggestions.hidden = true;
                        }
                    });
                }
            
        } catch (error) {
            console.error('Error loading series:', error);
            heroSeriesGrid.innerHTML = '<p style="color: rgba(255,255,255,0.7); grid-column: 1/-1; text-align: center;">Error loading series. Please check your connection.</p>';
            
            // Fallback for Get Started button
            if (getStartedBtn) {
                getStartedBtn.addEventListener("click", () => {
                    navigateToApp("BS");
                });
            }
        }
    };

    const findSeriesMatches = (query, limit = 10) => {
        const q = query.trim().toLowerCase();
        if (!q) return [];

        // Prioritize exact code matches
        const exactCode = landingSeries.find(s => s.code.toLowerCase() === q);
        if (exactCode) return [exactCode];

        // Find name or code that contains the query
        const results = landingSeries.filter(s => s.code.toLowerCase().includes(q) || s.name.toLowerCase().includes(q));
        return results.slice(0, limit);
    };

    const renderSearchSuggestions = (matches) => {
        if (!searchSuggestions) return;
        if (!matches || matches.length === 0) {
            searchSuggestions.hidden = true;
            searchSuggestions.innerHTML = '';
            return;
        }
        searchSuggestions.hidden = false;
        searchSuggestions.innerHTML = '';
        matches.forEach(m => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'search-suggestion';
            btn.textContent = `${m.name} (${m.code})`;
            btn.addEventListener('click', () => navigateToApp(m.code));
            searchSuggestions.appendChild(btn);
        });
    };

    const handleSeriesSearch = (q) => {
        const matches = findSeriesMatches(q, 20);
        if (!matches || matches.length === 0) {
            // maybe provide a user friendly message
            searchSuggestions.hidden = false;
            searchSuggestions.innerHTML = `<div class="no-results">No series found</div>`;
            return;
        }

        // If there is a single match or an exact code match, redirect
        if (matches.length === 1 || matches[0].code.toLowerCase() === q.toLowerCase()) {
            navigateToApp(matches[0].code);
            return;
        }

        // Otherwise show suggestions so user can pick
        renderSearchSuggestions(matches.slice(0, 10));
    };

    // Load series on page load
    loadSeries();
}

// Main page logic
if (isMainPage) {
// API Configuration
const API_BASE = './api';

// Dynamic data storage
let allSeries = [];
let seriesFiles = {};
let seriesNames = {};
let currentSeries = "BS";
let files = [];

// API Functions
const fetchAllSeries = async () => {
    try {
        const response = await fetch(`${API_BASE}/series/get_all.php`);
        if (!response.ok) {
            throw new Error('Failed to fetch series');
        }
        
        const result = await response.json();
        if (!result.success || !result.data) {
            throw new Error(result.message || 'Failed to load series');
        }
        
        allSeries = result.data;
        
        // Build seriesNames object
        result.data.forEach(series => {
            seriesNames[series.code] = series.name;
        });
        
        return result.data;
    } catch (error) {
        console.error('Error fetching series:', error);
        throw error;
    }
};

const fetchFilesBySeries = async (seriesCode) => {
    try {
        const response = await fetch(`${API_BASE}/files/get_by_series.php?series=${seriesCode}`);
        if (!response.ok) {
            throw new Error('Failed to fetch files');
        }
        
        const result = await response.json();
        if (!result.success || !result.data) {
            throw new Error(result.message || 'Failed to load files');
        }
        
        return result.data.files;
    } catch (error) {
        console.error('Error fetching files:', error);
        throw error;
    }
};

const initializeApp = async () => {
    try {
        // Show loading state
        if (content) {
            content.innerHTML = '<p style="text-align: center; padding: 2rem;">Loading application...</p>';
        }
        
        // Fetch all series first
        await fetchAllSeries();
        
        // Populate series dropdown dynamically
        if (seriesOptions) {
            seriesOptions.innerHTML = '';
            allSeries.forEach(series => {
                const button = document.createElement('button');
                button.type = 'button';
                button.dataset.series = series.code;
                button.setAttribute('role', 'menuitem');
                button.innerHTML = `<i class="${series.icon}"></i> ${series.name}`;
                seriesOptions.appendChild(button);
            });
            
            // Re-attach event listeners to new buttons
            const newSeriesButtons = Array.from(seriesOptions.querySelectorAll("button[data-series]"));
            newSeriesButtons.forEach((button) => {
                button.addEventListener("click", (event) => {
                    event.stopPropagation();
                    const series = button.dataset.series;
                    if (series) {
                        changeSeries(series);
                    }
                    closeSeriesMenu();
                    seriesToggle?.focus();
                });
            });
        }
        
        // Get series from URL parameter
        const urlParams = new URLSearchParams(window.location.search);
        const urlSeries = urlParams.get('series');
        const urlPage = urlParams.get('page');
        
        // Determine which series to load
        if (urlSeries && seriesNames[urlSeries]) {
            currentSeries = urlSeries;
        } else if (allSeries.length > 0) {
            currentSeries = allSeries[0].code;
        }
        
        // Fetch files for the current series
        files = await fetchFilesBySeries(currentSeries);
        seriesFiles[currentSeries] = files;
        
        // Update title
        if (seriesTitle) {
            seriesTitle.textContent = `${seriesNames[currentSeries]} Series ✦`;
        }
        document.title = `${seriesNames[currentSeries]} Series`;
        
        // Get page index from URL
        let initialPageIndex = 0;
        if (urlPage !== null) {
            const pageIndex = parseInt(urlPage, 10);
            if (!isNaN(pageIndex) && pageIndex >= 0 && pageIndex < files.length) {
                initialPageIndex = pageIndex;
            }
        }
        
        // Build navigation and load initial file
        buildNav();
        loadTheme();
        loadSidebarWidth();
        setupResize();
        updateHeaderHeight();
        window.addEventListener("resize", updateHeaderHeight);
        
        if (files.length > 0) {
            renderMarkdown(files[initialPageIndex]);
        } else {
            content.innerHTML = '<p>No files available for this series.</p>';
        }
        
    } catch (error) {
        console.error('Error initializing app:', error);
        if (content) {
            content.innerHTML = `<p style="color: red; text-align: center; padding: 2rem;">Error loading application: ${error.message}<br><br>Please make sure the API is properly configured and the database is set up.</p>`;
        }
    }
};

const fileList = document.getElementById("fileList");
const content = document.getElementById("content");
const themeToggle = document.getElementById("themeToggle");
const homeBtn = document.getElementById("homeBtn");
const seriesToggle = document.getElementById("seriesToggle");
const seriesOptions = document.getElementById("seriesOptions");
const seriesTitle = document.getElementById("seriesTitle");
const downloadToggle = document.getElementById("downloadToggle");
const downloadOptions = document.getElementById("downloadOptions");
const downloadMenuWrapper = document.querySelector(".download-menu");
const seriesMenuWrapper = document.querySelector(".series-menu");
const divider = document.getElementById("divider");
const searchInput = document.getElementById("fileSearch");
const prevButton = document.getElementById("prevFile");
const nextButton = document.getElementById("nextFile");
const headerEl = document.querySelector("header");
const highlightThemes = {
    light: document.getElementById("hljsLightTheme"),
    dark: document.getElementById("hljsDarkTheme")
};
const downloadOptionButtons = downloadOptions ? Array.from(downloadOptions.querySelectorAll("button[data-format]")) : [];
const seriesOptionButtons = seriesOptions ? Array.from(seriesOptions.querySelectorAll("button[data-series]")) : [];

const enhanceTables = () => {
    content.querySelectorAll("table").forEach((table) => {
        if (table.parentElement && table.parentElement.classList.contains("table-responsive")) {
            return;
        }
        const wrapper = document.createElement("div");
        wrapper.className = "table-responsive";
        const parent = table.parentElement;
        if (!parent) {
            return;
        }
        parent.insertBefore(wrapper, table);
        wrapper.appendChild(table);
    });
};

const resetScrollPosition = () => {
    // Ensure new content always starts at the top of the viewport
    content.scrollTop = 0;
    window.scrollTo({ top: 0, behavior: "auto" });
};

const THEME_KEY = "bootstrap-notes-theme";
const SIDEBAR_WIDTH_KEY = "bootstrap-notes-sidebar-width";
const mediaQuery = window.matchMedia("(max-width: 768px)");

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const getNumberVar = (name) => {
    const value = Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue(name));
    return Number.isNaN(value) ? 0 : value;
};

const updateHeaderHeight = () => {
    if (!headerEl) {
        return;
    }
    document.documentElement.style.setProperty("--header-height", `${headerEl.offsetHeight}px`);
};

const formatLabel = (file) => {
    // For dynamic data, file is an object with properties
    if (typeof file === 'object' && file.title) {
        return file.title;
    }
    // Fallback for old format
    return typeof file === 'string' ? file.replace(/\.md$/i, "") : String(file);
};

let currentSidebarWidth = getNumberVar("--sidebar-width") || 240;
let currentFileIndex = 0;
let isDragging = false;
let isDownloadMenuOpen = false;
let isSeriesMenuOpen = false;
let currentRenderToken = 0;

const getCurrentFilename = () => {
    const fallback = files[0];
    const current = files[currentFileIndex] || fallback;
    // For dynamic data, return the file object
    return current;
};

const getCurrentBasename = () => {
    const current = getCurrentFilename();
    if (typeof current === 'object' && current.title) {
        return current.title;
    }
    return formatLabel(current);
};

const defaultTheme = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";

const toggleHighlightTheme = (theme) => {
    highlightThemes.light.disabled = theme === "dark";
    highlightThemes.dark.disabled = theme !== "dark";
    if (window.hljs) {
        window.hljs.highlightAll();
    }
};

const openDownloadMenu = () => {
    if (!downloadOptions || !downloadToggle) {
        return;
    }
    isDownloadMenuOpen = true;
    downloadOptions.hidden = false;
    downloadOptions.classList.add("is-open");
    downloadToggle.setAttribute("aria-expanded", "true");
    if (downloadOptionButtons.length > 0) {
        downloadOptionButtons[0].focus();
    }
};

const closeDownloadMenu = () => {
    if (!downloadOptions || !downloadToggle) {
        return;
    }
    isDownloadMenuOpen = false;
    downloadOptions.classList.remove("is-open");
    downloadOptions.hidden = true;
    downloadToggle.setAttribute("aria-expanded", "false");
};

const openSeriesMenu = () => {
    if (!seriesOptions || !seriesToggle) {
        return;
    }
    isSeriesMenuOpen = true;
    seriesOptions.hidden = false;
    seriesOptions.classList.add("is-open");
    seriesToggle.setAttribute("aria-expanded", "true");
    if (seriesOptionButtons.length > 0) {
        seriesOptionButtons[0].focus();
    }
};

const closeSeriesMenu = () => {
    if (!seriesOptions || !seriesToggle) {
        return;
    }
    isSeriesMenuOpen = false;
    seriesOptions.classList.remove("is-open");
    seriesOptions.hidden = true;
    seriesToggle.setAttribute("aria-expanded", "false");
};

const toggleSeriesMenu = () => {
    if (isSeriesMenuOpen) {
        closeSeriesMenu();
    } else {
        openSeriesMenu();
    }
};

const toggleDownloadMenu = () => {
    if (isDownloadMenuOpen) {
        closeDownloadMenu();
    } else {
        openDownloadMenu();
    }
};

const captureContentCanvas = async () => {
    if (typeof window.html2canvas !== "function") {
        throw new Error("Capture library is unavailable.");
    }
    const backgroundColor = getComputedStyle(document.body).getPropertyValue("background-color") || "#ffffff";
    return window.html2canvas(content, {
        backgroundColor: backgroundColor.trim() || undefined,
        scrollY: 0,
        useCORS: true
    });
};

const withBusyState = async (button, task) => {
    if (typeof task !== "function") {
        return;
    }
    if (!button) {
        try {
            await task();
        } catch (error) {
            console.error(error);
            alert("Unable to prepare the download. Please try again.");
        }
        return;
    }
    const originalText = button.textContent;
    button.disabled = true;
    button.textContent = "Preparing...";
    button.setAttribute("aria-busy", "true");
    try {
        await task();
    } catch (error) {
        console.error(error);
        alert("Unable to prepare the download. Please try again.");
    } finally {
        button.disabled = false;
        button.textContent = originalText;
        button.removeAttribute("aria-busy");
    }
};

const downloadAsPng = async () => {
    const canvas = await captureContentCanvas();
    const dataUrl = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `${getCurrentBasename()}.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
};

const downloadAsPdf = async () => {
    if (!window.jspdf || typeof window.jspdf.jsPDF !== "function") {
        throw new Error("PDF library is unavailable.");
    }
    const { jsPDF } = window.jspdf;
    const canvas = await captureContentCanvas();
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ orientation: "p", unit: "pt", format: "a4" });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
        position -= pageHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
    }

    pdf.save(`${getCurrentBasename()}.pdf`);
};

const applyTheme = (theme) => {
    document.body.classList.toggle("dark-theme", theme === "dark");
    document.body.classList.toggle("light-theme", theme === "light");
    themeToggle.innerHTML = theme === "dark" ? "<i class=\"ri-sun-line\"></i>" : "<i class=\"ri-moon-line\"></i>";
    toggleHighlightTheme(theme);
};

const loadTheme = () => {
    const stored = localStorage.getItem(THEME_KEY);
    const theme = stored === "dark" || stored === "light" ? stored : defaultTheme;
    applyTheme(theme);
};

const toggleTheme = () => {
    const nextTheme = document.body.classList.contains("dark-theme") ? "light" : "dark";
    localStorage.setItem(THEME_KEY, nextTheme);
    applyTheme(nextTheme);
    updateHeaderHeight();
};

const setActiveButton = (fileObj) => {
    Array.from(fileList.querySelectorAll("button")).forEach((btn) => {
        const fileId = typeof fileObj === 'object' ? fileObj.id : fileObj;
        btn.classList.toggle("active", btn.dataset.fileId == fileId);
    });
};

const updatePager = () => {
    const prevIndex = currentFileIndex - 1;
    const nextIndex = currentFileIndex + 1;

    if (prevIndex >= 0) {
        prevButton.disabled = false;
        prevButton.dataset.target = files[prevIndex];
        prevButton.textContent = `◀ ${formatLabel(files[prevIndex])}`;
    } else {
        prevButton.disabled = true;
        prevButton.dataset.target = "";
        prevButton.textContent = "◀ Start";
    }

    if (nextIndex < files.length) {
        nextButton.disabled = false;
        nextButton.dataset.target = files[nextIndex];
        nextButton.textContent = `${formatLabel(files[nextIndex])} ▶`;
    } else {
        nextButton.disabled = true;
        nextButton.dataset.target = "";
        nextButton.textContent = "End ▶";
    }
};

const filterNavigation = (term) => {
    const query = term.trim().toLowerCase();
    Array.from(fileList.children).forEach((item) => {
        const value = item.dataset.filterValue || "";
        item.style.display = !query || value.includes(query) ? "" : "none";
    });
};

const runHighlighting = () => {
    if (!window.hljs) {
        return;
    }
    content.querySelectorAll("pre code").forEach((block) => window.hljs.highlightElement(block));
};

const renderMarkdown = async (fileObj) => {
    const index = files.findIndex(f => f.id === fileObj.id);
    if (index !== -1) {
        currentFileIndex = index;
        updatePager();
        
        // Update URL with series and page parameters
        const newUrl = `${window.location.pathname}?series=${currentSeries}&page=${index}`;
        window.history.pushState({ series: currentSeries, page: index }, '', newUrl);
    }
    const requestToken = ++currentRenderToken;
    content.classList.add("is-loading");
    content.setAttribute("aria-busy", "true");
    
    try {
        // Fetch content from API
        const response = await fetch(`${API_BASE}/files/get_single.php?series=${currentSeries}&number=${fileObj.number}`);
        if (!response.ok) {
            throw new Error(`Failed to load file`);
        }
        
        const result = await response.json();
        if (!result.success || !result.data) {
            throw new Error(result.message || 'Failed to load content');
        }
        
        if (requestToken !== currentRenderToken) {
            return;
        }
        
        const text = result.data.content;
        content.innerHTML = marked.parse(text);
        enhanceTables();
        setActiveButton(fileObj);
        runHighlighting();
        requestAnimationFrame(resetScrollPosition);
    } catch (error) {
        console.error('Error loading file:', error);
        if (requestToken === currentRenderToken) {
            content.innerHTML = `<p>Unable to load content. Error: ${error.message}</p>`;
        }
    } finally {
        if (requestToken === currentRenderToken) {
            content.classList.remove("is-loading");
            content.removeAttribute("aria-busy");
        }
    }
};

const buildNav = () => {
    fileList.innerHTML = "";
    files.forEach((file, index) => {
        const item = document.createElement("li");
        const button = document.createElement("button");
        button.type = "button";
        button.dataset.fileId = file.id;
        button.dataset.fileNumber = file.number;
        const label = formatLabel(file);
        button.textContent = label;
        button.addEventListener("click", () => renderMarkdown(file));
        if (index === 0) {
            button.classList.add("active");
        }
        item.dataset.filterValue = label.toLowerCase();
        item.appendChild(button);
        fileList.appendChild(item);
    });
};

const changeSeries = async (series) => {
    // Check if series exists in seriesNames (loaded from database)
    if (!seriesNames[series]) {
        console.error(`Series ${series} not found in available series`);
        return;
    }
    
    currentSeries = series;
    currentFileIndex = 0;
    
    // Update title
    if (seriesTitle) {
        seriesTitle.textContent = `${seriesNames[series]} Series ✦`;
    }
    
    // Update page title
    document.title = `${seriesNames[series]} Series`;
    
    // Update URL with series and page parameters
    const newUrl = `${window.location.pathname}?series=${series}&page=0`;
    window.history.pushState({ series: series, page: 0 }, '', newUrl);
    
    // Show loading state
    content.innerHTML = '<p>Loading files...</p>';
    
    try {
        // Fetch files for this series from API
        const response = await fetch(`${API_BASE}/files/get_by_series.php?series=${series}`);
        if (!response.ok) {
            throw new Error('Failed to fetch files');
        }
        
        const result = await response.json();
        if (!result.success || !result.data) {
            throw new Error(result.message || 'Failed to load files');
        }
        
        files = result.data.files;
        seriesFiles[series] = files;
        
        // Rebuild navigation with new series files
        buildNav();
        
        // Load first file of new series
        if (files.length > 0) {
            renderMarkdown(files[0]);
        } else {
            content.innerHTML = '<p>No files found for this series.</p>';
        }
    } catch (error) {
        console.error('Error changing series:', error);
        content.innerHTML = `<p>Error loading series: ${error.message}</p>`;
    }
};

const applySidebarWidth = (width) => {
    currentSidebarWidth = width;
    document.documentElement.style.setProperty("--sidebar-width", `${width}px`);
};

const loadSidebarWidth = () => {
    const stored = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    if (!stored) {
        return;
    }
    const min = getNumberVar("--sidebar-min-width");
    const max = getNumberVar("--sidebar-max-width");
    const width = clamp(Number.parseFloat(stored), min, max);
    if (!Number.isNaN(width)) {
        applySidebarWidth(width);
    }
};

const stopDragging = () => {
    if (!isDragging) {
        return;
    }
    isDragging = false;
    document.body.classList.remove("resizing");
    divider.classList.remove("dragging");
    localStorage.setItem(SIDEBAR_WIDTH_KEY, String(currentSidebarWidth));
};

const handlePointerMove = (event) => {
    if (!isDragging) {
        return;
    }
    const min = getNumberVar("--sidebar-min-width");
    const max = getNumberVar("--sidebar-max-width");
    const width = clamp(event.clientX, min, max);
    applySidebarWidth(width);
};

const setupResize = () => {
    divider.addEventListener("pointerdown", (event) => {
        if (mediaQuery.matches) {
            return;
        }
        isDragging = true;
        divider.classList.add("dragging");
        document.body.classList.add("resizing");
        divider.setPointerCapture(event.pointerId);
        event.preventDefault();
    });

    divider.addEventListener("pointermove", (event) => {
        if (!divider.hasPointerCapture(event.pointerId)) {
            return;
        }
        handlePointerMove(event);
    });

    divider.addEventListener("pointerup", (event) => {
        if (divider.hasPointerCapture(event.pointerId)) {
            divider.releasePointerCapture(event.pointerId);
        }
        stopDragging();
    });

    divider.addEventListener("lostpointercapture", stopDragging);
    document.addEventListener("pointermove", handlePointerMove);
    document.addEventListener("pointerup", stopDragging);
    window.addEventListener("blur", stopDragging);

    const handleMediaChange = (event) => {
        if (event.matches) {
            stopDragging();
        }
    };
    if (typeof mediaQuery.addEventListener === "function") {
        mediaQuery.addEventListener("change", handleMediaChange);
    } else if (typeof mediaQuery.addListener === "function") {
        mediaQuery.addListener(handleMediaChange);
    }
};

if (downloadToggle && downloadOptions) {
    downloadToggle.addEventListener("click", (event) => {
        event.stopPropagation();
        toggleDownloadMenu();
    });
}

if (seriesToggle && seriesOptions) {
    seriesToggle.addEventListener("click", (event) => {
        event.stopPropagation();
        toggleSeriesMenu();
    });
}

// Series option buttons are now attached dynamically in initializeApp()
// after the buttons are created from the database

downloadOptionButtons.forEach((button) => {
    button.addEventListener("click", (event) => {
        event.stopPropagation();
        const format = button.dataset.format;
        const action = format === "pdf" ? downloadAsPdf : downloadAsPng;
        const promise = withBusyState(button, action);
        if (promise && typeof promise.finally === "function") {
            promise.finally(() => {
                closeDownloadMenu();
                downloadToggle?.focus();
            });
        } else {
            closeDownloadMenu();
            if (downloadToggle) {
                downloadToggle.focus();
            }
        }
    });
});

document.addEventListener("click", (event) => {
    if (isDownloadMenuOpen) {
        if (downloadMenuWrapper && downloadMenuWrapper.contains(event.target)) {
            return;
        }
        closeDownloadMenu();
    }
    if (isSeriesMenuOpen) {
        if (seriesMenuWrapper && seriesMenuWrapper.contains(event.target)) {
            return;
        }
        closeSeriesMenu();
    }
});

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
        if (isDownloadMenuOpen) {
            closeDownloadMenu();
            downloadToggle?.focus();
        }
        if (isSeriesMenuOpen) {
            closeSeriesMenu();
            seriesToggle?.focus();
        }
    }
});
themeToggle.addEventListener("click", toggleTheme);

// Home button - navigate back to landing page
if (homeBtn) {
    homeBtn.addEventListener("click", () => {
        window.location.href = "index.html";
    });
}

prevButton.addEventListener("click", () => {
    const target = prevButton.dataset.target;
    if (target) {
        renderMarkdown(target);
    }
});
nextButton.addEventListener("click", () => {
    const target = nextButton.dataset.target;
    if (target) {
        renderMarkdown(target);
    }
});
if (searchInput) {
    searchInput.addEventListener("input", (event) => {
        filterNavigation(event.target.value);
    });
}

// Initialize the application with dynamic data from API
initializeApp();

} // End of isMainPage
