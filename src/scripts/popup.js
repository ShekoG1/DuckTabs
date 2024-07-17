document.addEventListener('DOMContentLoaded', () => {
  const groupNameInput = document.getElementById('groupName');
  const saveGroupButton = document.getElementById('saveGroup');
  const exportGroupsButton = document.getElementById('exportGroups');
  const importGroupsButton = document.getElementById('importGroups');
  const importGroupsFile = document.getElementById('importGroupsFile');
  const groupList = document.getElementById('groupList');

  saveGroupButton.addEventListener('click', async () => {
    const groupName = groupNameInput.value.trim();
    if (groupName) {
      await chrome.runtime.sendMessage({ type: 'saveGroup', groupName });
      groupNameInput.value = '';
      loadGroups();
    }
  });

  exportGroupsButton.addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'exportGroups' });
  });

  importGroupsButton.addEventListener('click', () => {
    importGroupsFile.click();
  });

  importGroupsFile.addEventListener('change', (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target.result;
      chrome.runtime.sendMessage({ type: 'importGroups', fileContent: content });
      loadGroups();
    };
    reader.readAsText(file);
  });

  groupList.addEventListener('click', (e) => {
    if (e.target.tagName === 'BUTTON') {
      const groupName = e.target.dataset.group;
      if (e.target.classList.contains('open')) {
        chrome.runtime.sendMessage({ type: 'openGroup', groupName });
      }
    }
  });

  function loadGroups() {
    chrome.runtime.sendMessage({ type: 'getGroups' }, (groups) => {
      groupList.innerHTML = '';
      if (groups.length === 0) {
        const div = document.createElement('div');
        div.classList.add('errorCard');
        div.innerHTML = `
          <p id='errorTitle'>What the DUCK!?</p>
          <p id='errorMsg'>You have no saved groups. Please try again later or refresh the list.</p>
          <p id='refreshList--btn'>Refresh</p>
        `;
        groupList.appendChild(div);

        // Handle refresh
        let refreshBtn = document.getElementById('refreshList--btn');
        refreshBtn.addEventListener('click', () => {
          loadGroups();
        });

        return;
      }

      groups.forEach(group => {
        const div = document.createElement('div');
        div.classList.add('group-item');
        div.textContent = group.name;
        const openButton = document.createElement('button');
        openButton.textContent = 'Open';
        openButton.classList.add('open');
        openButton.dataset.group = group.name;
        div.appendChild(openButton);
        groupList.appendChild(div);
      });
    });
  }

  loadGroups();
});
