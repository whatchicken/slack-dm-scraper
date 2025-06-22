let isScraping = false;
let scrollLoopTimeout = null;
let allMessages = new Map();

// --- Robust Selector Definitions ---
const SELECTORS = {
    PANE: [
        '.p-workspace__primary_view .c-virtual_list__scroll_container', // Be specific to the main view's scroll container
        '.p-workspace__primary_view_body' // Fallback for the main view body
    ],
    MESSAGE_BLOCK: [
        '.c-message_kit__message', // Main container for a single message from screenshot
        '[data-qa="message_container"]'
    ],
    SENDER: [
        '.c-message__sender_button', // Critical selector from your screenshot!
        '[data-qa="message-sender"]',
        '.c-message__sender_link',
    ],
    TIMESTAMP: [
        '.c-timestamp', // This is reliable for the data-ts attribute
    ],
    CONTENT: [
        '.p-rich_text_section', // From your screenshot!
        '.c-message__content_body', // A common fallback
        '[data-qa="message-text"]',
        '.c-message_kit__blocks--rich_text',
    ],
};

// Generic function to find an element with multiple possible selectors
function findElement(context, selectorKeys) {
    for (const key of selectorKeys) {
        const element = context.querySelector(key);
        if (element) return element;
    }
    return null;
}

// Generic function to find all elements with multiple possible selectors
function findAllElements(context, selectorKeys) {
    for (const key of selectorKeys) {
        const elements = context.querySelectorAll(key);
        if (elements.length > 0) return elements;
    }
    return [];
}

function getMessagePane() {
    return findElement(document, SELECTORS.PANE);
}

function getTopTimestamp() {
    const firstMsg = findAllElements(document, SELECTORS.MESSAGE_BLOCK)[0];
    if (!firstMsg) return null;
    const timeEl = findElement(firstMsg, SELECTORS.TIMESTAMP);
    return timeEl ? timeEl.getAttribute('data-ts') : null;
}

function extractAndStoreMessages() {
    const messageElements = findAllElements(document, SELECTORS.MESSAGE_BLOCK);
    let messagesExtractedInThisRun = 0;
    let lastValidSender = '';

    messageElements.forEach((msgEl) => {
        const senderEl = findElement(msgEl, SELECTORS.SENDER);
        if (senderEl && senderEl.innerText) {
            lastValidSender = senderEl.innerText.trim();
        }

        const timeEl = findElement(msgEl, SELECTORS.TIMESTAMP);
        const timestamp = timeEl ? timeEl.getAttribute('data-ts') : null;

        const contentEl = findElement(msgEl, SELECTORS.CONTENT);
        let text = contentEl ? contentEl.innerText.trim() : '';
        
        if (timestamp && text && lastValidSender) {
            const messageId = `${timestamp}-${lastValidSender}-${text}`;
            if (!allMessages.has(messageId)) {
                allMessages.set(messageId, { sender: lastValidSender, timestamp, text });
                messagesExtractedInThisRun++;
            }
        }
    });
    console.log(`[EXTRACT] Found ${messagesExtractedInThisRun} new messages. Total unique so far: ${allMessages.size}`);
    return messagesExtractedInThisRun;
}

// ** AGGRESSIVE SCROLLING METHODS **
function simulateRealMouseWheel(pane) {
    // Method 1: Real mouse wheel event with proper parameters - SCROLL DOWN for older messages
    const wheelEvent = new WheelEvent('wheel', {
        deltaY: 5000, // Drastically increased from 120 to 5000 for a massive scroll
        deltaMode: WheelEvent.DOM_DELTA_PIXEL, // Use PIXEL mode for more direct control
        bubbles: true,
        cancelable: true,
        view: window
    });
    pane.dispatchEvent(wheelEvent);
}

function simulateKeyboardScroll(pane) {
    // Method 3: Page Down key events - SCROLL DOWN for older messages
    const pageDownEvent = new KeyboardEvent('keydown', {
        key: 'PageDown',
        code: 'PageDown',
        keyCode: 34,
        which: 34,
        bubbles: true,
        cancelable: true,
        view: window
    });
    // Dispatch it multiple times for greater effect
    for (let i = 0; i < 3; i++) {
        setTimeout(() => pane.dispatchEvent(pageDownEvent), i * 50);
    }
}

function simulatePhysicalScroll(pane) {
    // Method 5: Direct scrollTop manipulation with events - SCROLL DOWN by a large amount
    const scrollAmount = pane.clientHeight * 2; // Scroll by 2 viewport heights
    pane.scrollTop += scrollAmount;
    
    // Dispatch scroll event
    pane.dispatchEvent(new Event('scroll', { bubbles: true }));
}

function simulateMouseMovement(pane) {
    // Method 7: Simulate mouse movement over the pane - SCROLL DOWN
    const rect = pane.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    // Mouse enter
    const mouseEnterEvent = new MouseEvent('mouseenter', {
        bubbles: true,
        cancelable: true,
        view: window,
        clientX: centerX,
        clientY: centerY
    });
    pane.dispatchEvent(mouseEnterEvent);
    
    // Mouse move - DOWN direction
    setTimeout(() => {
        const mouseMoveEvent = new MouseEvent('mousemove', {
            bubbles: true,
            cancelable: true,
            view: window,
            clientX: centerX,
            clientY: centerY + 50 // Changed from -50 to +50 (move DOWN)
        });
        pane.dispatchEvent(mouseMoveEvent);
    }, 100);
    
    // Mouse over - DOWN direction
    setTimeout(() => {
        const mouseOverEvent = new MouseEvent('mouseover', {
            bubbles: true,
            cancelable: true,
            view: window,
            clientX: centerX,
            clientY: centerY + 50 // Changed from -50 to +50 (move DOWN)
        });
        pane.dispatchEvent(mouseOverEvent);
    }, 200);
}

function simulateFocusAndClick(pane) {
    // Method 8: Focus the pane and simulate click
    pane.focus();
    
    // Click event
    setTimeout(() => {
        const clickEvent = new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            view: window,
            clientX: 100,
            clientY: 100
        });
        pane.dispatchEvent(clickEvent);
    }, 50);
}

function simulateIntersectionObserver(pane) {
    // Method 9: Simulate intersection observer by scrolling elements into view - SCROLL DOWN
    const messages = findAllElements(document, SELECTORS.MESSAGE_BLOCK);
    if (messages.length > 0) {
        // Scroll the last message into view (scroll DOWN)
        messages[messages.length - 1].scrollIntoView({ behavior: 'smooth', block: 'end' });
        
        // Also scroll the first message to trigger loading
        setTimeout(() => {
            if (messages.length > 1) {
                messages[0].scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 500);
    }
}

function simulateResizeAndScroll(pane) {
    // Method 10: Simulate window resize and scroll events
    const resizeEvent = new Event('resize', { bubbles: true });
    window.dispatchEvent(resizeEvent);
    
    // Dispatch scroll on window as well
    setTimeout(() => {
        const windowScrollEvent = new Event('scroll', { bubbles: true });
        window.dispatchEvent(windowScrollEvent);
    }, 100);
}

async function fetchRemainingMessagesViaAPI() {
    const channelMatch = window.location.pathname.match(/\/client\/[^/]+\/([^/]+)/);
    const channelId = channelMatch ? channelMatch[1] : null;
    const token = window.TS && TS.boot_data && TS.boot_data.api_token;

    if (!channelId || !token) {
        console.warn('[API] Unable to determine channel ID or API token.');
        console.warn('[API] Channel ID:', channelId);
        console.warn('[API] Token available:', !!token);
        return;
    }

    let oldestTs = null;
    if (allMessages.size > 0) {
        oldestTs = Array.from(allMessages.values()).reduce((min, msg) => {
            return min === null || msg.timestamp < min ? msg.timestamp : min;
        }, null);
    }

    let cursor = null;
    let totalFetched = 0;
    let attempts = 0;
    const maxAttempts = 50; // Increased max attempts
    
    console.log('[API] Fetching additional messages via Slack API...');
    console.log('[API] Channel ID:', channelId);
    console.log('[API] Oldest timestamp:', oldestTs);
    
    while (attempts < maxAttempts) {
        attempts++;
        const params = new URLSearchParams({ channel: channelId, limit: '200' });
        if (cursor) params.append('cursor', cursor);
        if (oldestTs) params.append('latest', oldestTs);

        try {
            console.log(`[API] Attempt ${attempts}: Fetching messages...`);
            const resp = await fetch('https://slack.com/api/conversations.history', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
                    'Authorization': `Bearer ${token}`,
                },
                body: params,
            });
            const data = await resp.json();
            
            if (!data.ok) {
                console.error('[API] Error fetching history:', data.error);
                if (data.error === 'ratelimited') {
                    console.log('[API] Rate limited, waiting 2 seconds...');
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    continue;
                }
                break;
            }

            let added = 0;
            data.messages.forEach(msg => {
                const ts = msg.ts;
                const sender = msg.user || msg.username || 'unknown';
                const text = msg.text || '';
                const messageId = `${ts}-${sender}-${text}`;
                if (!allMessages.has(messageId)) {
                    allMessages.set(messageId, { sender, timestamp: ts, text });
                    added++;
                }
            });
            totalFetched += added;
            console.log(`[API] Added ${added} messages from API. Total API fetched: ${totalFetched}`);

            cursor = data.response_metadata && data.response_metadata.next_cursor;
            if (!cursor || cursor.length === 0) {
                console.log('[API] No more messages available (no cursor).');
                break;
            }
            
            if (data.messages.length === 0) {
                console.log('[API] No more messages in response.');
                break;
            }
            
            oldestTs = data.messages[data.messages.length - 1].ts;
            
            // Small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
            console.error('[API] Network error:', error);
            break;
        }
    }
    
    console.log(`[API] API fetching complete. Total messages from API: ${totalFetched}`);
    console.log(`[API] Total unique messages collected: ${allMessages.size}`);
}

// ** ULTRA-AGGRESSIVE SCROLLING LOOP **
function scrollLoop(consecutiveFails = 0) {
    if (!isScraping) {
        console.log('[STOP] Scraping was manually stopped.');
        return;
    }

    // Stop if we fail to find new content multiple times in a row.
    if (consecutiveFails >= 5) {
        console.log('[STOP] No new content loaded for 5 consecutive attempts. Falling back to API.');
        extractAndStoreMessages();
        fetchRemainingMessagesViaAPI().then(stopScraping);
        return;
    }

    const pane = getMessagePane();
    if (!pane) {
        console.error('[STOP] CRITICAL: Message pane not found! Aborting.');
        stopScraping();
        return;
    }
    
    const beforeTopTs = getTopTimestamp();
    const beforeScrollTop = pane.scrollTop;
    const beforeMessageCount = allMessages.size;

    console.log(`[SCROLL] Attempt ${consecutiveFails + 1}/5 - Applying MASSIVE scroll methods...`);

    // Apply a few, very strong scrolling methods
    simulateRealMouseWheel(pane);
    
    setTimeout(() => {
        simulateKeyboardScroll(pane);
    }, 250);
    
    setTimeout(() => {
        simulatePhysicalScroll(pane);
    }, 500);

    // Wait for content to load
    scrollLoopTimeout = setTimeout(() => {
        const afterTopTs = getTopTimestamp();
        const newMessages = extractAndStoreMessages();
        const afterMessageCount = allMessages.size;

        if (afterTopTs !== beforeTopTs || newMessages > 0 || afterMessageCount > beforeMessageCount) {
            console.log('[SCROLL] SUCCESS: New content loaded!');
            scrollLoop(0); // Reset consecutive fails
        } else {
            console.log('[SCROLL] NO CHANGE: No additional content detected.');
            scrollLoop(consecutiveFails + 1);
        }
    }, 4000);
}

function startScraping() {
    if (isScraping) return;
    isScraping = true;
    allMessages.clear();
    console.log('--- Slack Scraper Started (v6 - MASSIVE SCROLLING) ---');
    console.log('[INIT] Performing initial extraction of visible messages...');
    const initiallyExtracted = extractAndStoreMessages();
    console.log(`[INIT] Saved ${initiallyExtracted} messages from the initial view.`);

    // Start the ultra-aggressive scrolling loop
    scrollLoop(0);
}

function formatAndSave() {
    if (allMessages.size === 0) {
        console.warn("[FINAL] No messages were collected. Cannot save an empty file. Please check the [DEBUG] logs above to see why extraction failed.");
        alert("메시지를 수집하지 못했습니다. Slack의 UI 구조가 변경되었을 수 있습니다. 개발자 콘솔의 [DEBUG] 로그를 개발자에게 보내주세요.");
        return;
    }

    console.log(`Formatting and saving ${allMessages.size} messages...`);
    const sortedMessages = Array.from(allMessages.values()).sort((a, b) => a.timestamp - b.timestamp);

    let output = '';
    let lastDateStr = '';

    sortedMessages.forEach(msg => {
        const date = new Date(parseFloat(msg.timestamp) * 1000);
        
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        const dayOfWeek = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'][date.getDay()];
        
        const currentDateStr = `${year}년 ${month}월 ${day}일`;
        if (currentDateStr !== lastDateStr) {
            if (output !== '') output += '----------\n';
            output += `\n- - - - - - - - - - ${currentDateStr} ${dayOfWeek} - - - - - - - - - -\n\n`;
            lastDateStr = currentDateStr;
        }

        let hours = date.getHours();
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const ampm = hours >= 12 ? '오후' : '오전';
        hours = hours % 12;
        hours = hours ? hours : 12;
        
        const timeStr = `${year}. ${month}. ${day}. ${ampm} ${hours}:${minutes}`;
        output += `${timeStr}, ${msg.sender} : ${msg.text}\n`;
    });

    const dataBlob = new Blob([output], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'slack_dms_export.txt';
    link.click();
    URL.revokeObjectURL(url);
}

function stopScraping() {
    isScraping = false;
    if (scrollLoopTimeout) {
        clearTimeout(scrollLoopTimeout);
    }
    console.log('--- Slack Scraper Stopped ---');
    console.log(`[FINAL] Collected a total of ${allMessages.size} unique messages.`);
    formatAndSave();
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'startScraping') {
        startScraping();
        sendResponse({ status: 'started' });
    } else if (request.action === 'stopScraping') {
        stopScraping();
        sendResponse({ status: 'stopped' });
    }
    return true;
}); 
