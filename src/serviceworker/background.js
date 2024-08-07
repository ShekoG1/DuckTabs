chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ groups: [] });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'saveGroup') {
    saveGroup(message.groupName);
  } else if (message.type === 'openGroup') {
    openGroup(message.groupName);
  } else if (message.type === 'getGroups') {
    chrome.storage.local.get('groups', (data) => {
      sendResponse(data.groups);
    });
    return true; // Keep the message channel open for sendResponse
  } else if (message.type === 'exportGroups') {
    exportGroups();
  } else if (message.type === 'importGroups') {
    importGroups(message.fileContent);
  } else if (message.type === 'removeGroup') {
    removeGroup(message.groupName); // Load groups after removing - done on popup.js
  }
});

async function saveGroup(groupName) {
  const tabs = await chrome.tabs.query({ currentWindow: true });
  const urls = tabs.filter(tab => !tab.pinned).map(tab => tab.url);
  const data = await chrome.storage.local.get('groups');
  const groups = data.groups || [];
  const existingGroupIndex = groups.findIndex(group => group.name === groupName);
  if (existingGroupIndex !== -1) {
    groups[existingGroupIndex].tabs = urls;
  } else {
    groups.push({ name: groupName, tabs: urls });
  }
  return await chrome.storage.local.set({ groups });
}

async function openGroup(groupName) {
  const data = await chrome.storage.local.get('groups');
  const group = data.groups.find(g => g.name === groupName);
  if (group) {
    const urls = group.tabs;
    // Open new tabs first
    await Promise.all(urls.map(url => chrome.tabs.create({ url, active: false })))
    .then(async newTabs => {
      // Get the IDs of the newly created tabs
      const newTabIds = newTabs.map(tab => tab.id);
  
      // Get current window information and remove non-pinned tabs
      const currentWindow = await chrome.windows.getCurrent({ populate: true });
      const nonPinnedTabs = currentWindow.tabs.filter(tab => !tab.pinned);
      
      // Exclude the new tabs from the list of tabs to remove
      const tabIdsToRemove = nonPinnedTabs
        .filter(tab => !newTabIds.includes(tab.id))
        .map(tab => tab.id);
  
      await chrome.tabs.remove(tabIdsToRemove);
    });
  }
}

async function exportGroups() {
  const data = await chrome.storage.local.get('groups')
    
  const blob = new Blob([JSON.stringify(data.groups)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  chrome.downloads.download({
    url: url,
    filename: 'ducktabs_groups.json'
  });
}

async function importGroups(fileContent) {
  const importedGroups = JSON.parse(fileContent);

  // Retrieve existing groups
  const data = await chrome.storage.local.get('groups');
  const existingGroups = data.groups || [];

  // Merge the existing groups with the imported groups
  const mergedGroups = existingGroups.concat(importedGroups);

  // Save the merged groups back to storage
  await chrome.storage.local.set({ groups: mergedGroups });

  console.log('Tab groups imported and appended successfully.');
}

async function removeGroup(groupName) {
  const data = await chrome.storage.local.get('groups');
  const groups = data.groups || [];
  const updatedGroups = groups.filter(group => group.name !== groupName);
  await chrome.storage.local.set({ groups: updatedGroups });
  console.log(`Group '${groupName}' removed successfully.`);
}