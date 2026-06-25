// ads-manager.js - Unified Dynamic Ad Management for IQ Master Quiz
// Centralized configuration to switch between Google Ad Manager and AdSense.

const AD_CONFIG = {
    // Flag to toggle between Google Ad Manager (GAM) and Google AdSense
    useAdManager: false,

    // Google AdSense Publisher Client ID (replace with your actual client ID)
    adsenseClient: "ca-pub-1020203735300376",

    // Auto-refresh interval for visible Google Ad Manager ads (in milliseconds)
    refreshInterval: 30000,

    // Mapping of slot element IDs to Ad Manager configurations & AdSense Slot IDs
    // Note: All slots are mapped to the working AdSense Slot ID "8038463613" for maximum reliability.
    slots: {
        // Bottom sticky anchor ad
        "bottom-anchor": {
            gamAdUnit: "/22856454650/2801_Mid_Custom",
            adsenseSlot: "8038463613", // AdSense Anchor slot ID
            size: "anchor"
        },
        // Homepage Slot 1 (Medium Rectangle)
        "div-gpt-ad-17701189157955-1": {
            gamAdUnit: "/22856454650/2801_customRendaring",
            adsenseSlot: "8038463613", // AdSense Homepage Slot 1
            sizes: [[336, 280], [300, 250], [300, 100], [320, 100]]
        },
        // Homepage Slot 2 (Medium Rectangle - Legacy/Reserve)
        "div-gpt-ad-17473701658652-2": {
            gamAdUnit: "/22856454650/2801_customRendaring",
            adsenseSlot: "8038463613",
            sizes: [[336, 280], [300, 250], [300, 100], [320, 100]]
        },
        // App Page Slot (Medium Rectangle)
        "div-gpt-ad-17701189157955-3": {
            gamAdUnit: "/22856454650/2801_app_customtop_rendaring",
            adsenseSlot: "8038463613", // AdSense App Top Slot
            sizes: [[300, 250], [300, 100], [320, 100]]
        },
        // Content Page Slot 1 (Small Banner)
        "div-gpt-ad-177011891579545-7": {
            gamAdUnit: "/22856454650/2801_Small_Custome_topic",
            adsenseSlot: "8038463613", // AdSense Content Top Banner
            sizes: [[320, 100], [300, 100], [300, 75], [300, 50], [320, 50]]
        },
        // Content Page Slot 2 (Medium Rectangle)
        "div-gpt-ad-17473701658621-5": {
            gamAdUnit: "/22856454650/2801_result_custom_rendaring",
            adsenseSlot: "8038463613",
            sizes: [[336, 280], [300, 250], [300, 100], [320, 100]]
        },
        // Topic Page Slot 1 (Small Banner)
        "div-gpt-ad-177011891579589-1": {
            gamAdUnit: "/22856454650/2801_Small_Custome_topic",
            adsenseSlot: "8038463613", // AdSense Topic Top Banner
            sizes: [[320, 100], [300, 100], [300, 75], [300, 50], [320, 50]]
        },
        // Topic Page Slot 2 (Medium Rectangle)
        "div-gpt-ad-17473701658633-2": {
            gamAdUnit: "/22856454650/2801_result_custom_rendaring",
            adsenseSlot: "8038463613",
            sizes: [[336, 280], [300, 250], [300, 100], [320, 100]]
        },
        // Result Page Slot 1 (Medium Rectangle)
        "div-gpt-ad-17701189157955-4": {
            gamAdUnit: "/22856454650/2801_result_custom_rendaring",
            adsenseSlot: "8038463613", // AdSense Result Slot 1
            sizes: [[336, 280], [300, 250], [300, 100], [320, 100]]
        },
        // Result Page Slot 2 (Medium Rectangle)
        "div-gpt-ad-1747370165862-5": {
            gamAdUnit: "/22856454650/2801_result_custom_rendaring",
            adsenseSlot: "8038463613",
            sizes: [[336, 280], [300, 250], [300, 100], [320, 100]]
        },
        // Result Page Slot 3 (Medium Rectangle)
        "div-gpt-ad-1747370165862-6": {
            gamAdUnit: "/22856454650/2801_result_custom_rendaring",
            adsenseSlot: "8038463613",
            sizes: [[336, 280], [300, 250], [300, 100], [320, 100]]
        },
        // Scratch Page Slot (Medium Rectangle)
        "div-gpt-ad-17701189157955-7": {
            gamAdUnit: "/22856454650/2801_sc_custom_rendaring",
            adsenseSlot: "8038463613", // AdSense Scratch Slot
            sizes: [[336, 280], [300, 250], [300, 100], [320, 100]]
        }
    }
};

// Global object to track registered GAM slots for refresh/dynamic calls
window.gamActiveSlots = window.gamActiveSlots || {};

// Load the appropriate SDK script
function loadAdLibrary() {
    if (AD_CONFIG.useAdManager) {
        // Load Google Ad Manager SDK
        const script = document.createElement('script');
        script.async = true;
        script.src = "https://securepubads.g.doubleclick.net/tag/js/gpt.js";
        document.head.appendChild(script);
        initAdManager();
    } else {
        // Load Google AdSense SDK
        const script = document.createElement('script');
        script.async = true;
        script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${AD_CONFIG.adsenseClient}`;
        script.crossOrigin = "anonymous";
        document.head.appendChild(script);

        // Setup AdSense Anchor if configured
        const anchorConfig = AD_CONFIG.slots["bottom-anchor"];
        if (anchorConfig && anchorConfig.adsenseSlot) {
            setupAdSenseAnchor(anchorConfig.adsenseSlot);
        }
    }
}

// Initialize Google Ad Manager
function initAdManager() {
    window.googletag = window.googletag || { cmd: [] };
    googletag.cmd.push(() => {
        // Setup Anchor Slot
        const anchorConfig = AD_CONFIG.slots["bottom-anchor"];
        if (anchorConfig && anchorConfig.gamAdUnit) {
            const anchorSlot = googletag.defineOutOfPageSlot(
                anchorConfig.gamAdUnit,
                googletag.enums.OutOfPageFormat.BOTTOM_ANCHOR
            );
            if (anchorSlot) {
                anchorSlot.addService(googletag.pubads()).setConfig({
                    targeting: { test: "anchor" }
                });
                window.gamActiveSlots["bottom-anchor"] = anchorSlot;
            }
        }

        // Register Page Slots dynamically based on DOM elements
        for (const [divId, config] of Object.entries(AD_CONFIG.slots)) {
            if (divId === "bottom-anchor") continue;

            const element = document.getElementById(divId);
            if (element) {
                const isMobile = window.innerWidth <= 768;
                const slotSizes = isMobile ? [300, 250] : config.sizes;
                const slot = googletag.defineSlot(
                    config.gamAdUnit,
                    slotSizes,
                    divId
                ).addService(googletag.pubads());
                window.gamActiveSlots[divId] = slot;
            }
        }

        const pubads = googletag.pubads();
        pubads.enableLazyLoad({
            fetchMarginPercent: 200,
            renderMarginPercent: 100,
            mobileScaling: 2.0
        });
        pubads.enableSingleRequest();
        pubads.setCentering(true);
        pubads.collapseEmptyDivs();

        // Pass Publisher Provided ID (PPID) if available
        const deviceId = localStorage.getItem('user_id');
        if (deviceId && deviceId !== 'guest') {
            pubads.setPublisherProvidedId(deviceId);
        }
        googletag.enableServices();
    });

    // Render Bottom Anchor
    googletag.cmd.push(() => {
        if (window.gamActiveSlots["bottom-anchor"]) {
            googletag.display(window.gamActiveSlots["bottom-anchor"]);
        }
    });
}

// Setup AdSense Bottom Anchor
function setupAdSenseAnchor(slotId) {
    if (document.getElementById("adsense-anchor-container")) return;

    const anchorDiv = document.createElement('div');
    anchorDiv.id = "adsense-anchor-container";
    anchorDiv.style.position = "fixed";
    anchorDiv.style.bottom = "0";
    anchorDiv.style.left = "50%";
    anchorDiv.style.transform = "translateX(-50%)";
    anchorDiv.style.width = "100%";
    anchorDiv.style.maxWidth = "480px";
    anchorDiv.style.zIndex = "999";
    anchorDiv.style.textAlign = "center";
    anchorDiv.style.backgroundColor = "transparent";

    const ins = document.createElement('ins');
    ins.className = "adsbygoogle";
    ins.style.display = "inline-block";
    ins.style.width = "320px";
    ins.style.height = "50px";
    ins.setAttribute("data-ad-client", AD_CONFIG.adsenseClient);
    ins.setAttribute("data-ad-slot", slotId);

    anchorDiv.appendChild(ins);
    document.body.appendChild(anchorDiv);

    try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
        console.error("AdSense Anchor Push Error: ", e);
    }
}

// Display or inject ad content inside placeholder div
function displayAd(divId) {
    const config = AD_CONFIG.slots[divId];
    if (!config) return;

    const container = document.getElementById(divId);
    if (!container) return;

    if (AD_CONFIG.useAdManager) {
        // Render Google Ad Manager
        googletag.cmd.push(() => {
            googletag.display(divId);
        });
    } else {
        // Render AdSense
        if (container.querySelector('.adsbygoogle')) return;

        container.innerHTML = ""; // Clear existing tags
        const ins = document.createElement('ins');
        ins.className = "adsbygoogle";
        
        const isMobile = window.innerWidth <= 768;
        if (isMobile) {
            ins.style.display = "inline-block";
            ins.style.width = "300px";
            ins.style.height = "250px";
            ins.setAttribute("data-ad-client", AD_CONFIG.adsenseClient);
            ins.setAttribute("data-ad-slot", config.adsenseSlot);
        } else {
            ins.style.display = "block";
            ins.setAttribute("data-ad-client", AD_CONFIG.adsenseClient);
            ins.setAttribute("data-ad-slot", config.adsenseSlot);

            // Dynamically select ad format based on layout design
            let format = "auto";
            if (config.sizes && config.sizes[0] && config.sizes[0][1] < 250) {
                format = "horizontal";
            }
            ins.setAttribute("data-ad-format", format);
            ins.setAttribute("data-full-width-responsive", "true");
        }
        
        container.appendChild(ins);

        try {
            (window.adsbygoogle = window.adsbygoogle || []).push({});
        } catch (e) {
            console.error("AdSense Push Error: ", e);
        }
    }
}

// Start viewport-based auto-refresh for Google Ad Manager
function startAdRefresh() {
    setInterval(() => {
        if (!AD_CONFIG.useAdManager) return;

        for (const [divId, slot] of Object.entries(window.gamActiveSlots)) {
            if (divId === "bottom-anchor") continue;

            const element = document.getElementById(divId);
            if (element && slot) {
                const rect = element.getBoundingClientRect();
                const isVisible = (
                    rect.top >= 0 &&
                    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight)
                );
                if (isVisible) {
                    googletag.pubads().refresh([slot]);
                    console.log("Refreshed GAM Slot: " + divId);
                }
            }
        }
    }, AD_CONFIG.refreshInterval);
}

// Initialize ad setup
function initializeAds() {
    loadAdLibrary();

    // Auto-display active slot divs present in page DOM immediately
    for (const divId of Object.keys(AD_CONFIG.slots)) {
        if (divId === "bottom-anchor") continue;
        const el = document.getElementById(divId);
        if (el) {
            displayAd(divId);
        }
    }

    startAdRefresh();
}

// Run immediately if DOM is already parsed, otherwise wait for event
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeAds);
} else {
    initializeAds();
}
