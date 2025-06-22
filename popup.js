document.addEventListener('DOMContentLoaded', function() {
  const startBtn = document.getElementById('startBtn');
  const stopBtn = document.getElementById('stopBtn');
  const status = document.getElementById('status');

  startBtn.addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab.url || !tab.url.includes('app.slack.com')) {
      status.textContent = 'Error: Please use on Slack!';
      return;
    }

    try {
      await chrome.tabs.sendMessage(tab.id, { action: 'startScraping' });
      status.textContent = 'Scraping started...';
      startBtn.disabled = true;
      stopBtn.disabled = false;
    } catch (error) {
      status.textContent = 'Error: ' + error.message;
    }
  });

  stopBtn.addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    try {
      await chrome.tabs.sendMessage(tab.id, { action: 'stopScraping' });
      status.textContent = 'Stopped. Saving file...';
      startBtn.disabled = false;
      stopBtn.disabled = true;
    } catch (error) {
      status.textContent = 'Error: ' + error.message;
    }
  });
}); 
