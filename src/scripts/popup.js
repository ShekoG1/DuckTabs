document.addEventListener('DOMContentLoaded', () => {
  const groupNameInput = document.getElementById('groupName');
  const saveGroupButton = document.getElementById('saveGroup');
  const exportGroupsButton = document.getElementById('exportGroups');
  const importGroupsButton = document.getElementById('importGroups');
  const importGroupsFile = document.getElementById('importGroupsFile');
  const groupList = document.getElementById('groupList');
  const saveGroupOption = document.querySelector('#saveGroupOption');
  const saveGroupOption__btn = document.querySelector('#saveGroupOption--btn');
  const saveGroupInput = document.querySelector('#saveGroupInput');
  const groupList__title = document.querySelector('#groupList--title');
  const saveGroup__cancel = document.querySelector('#saveGroup--cancel');
  const deleteGroup = document.querySelector('.deleteGroup');

  saveGroupOption__btn.addEventListener('click', () => {
    showForm();
  });

  saveGroupButton.addEventListener('click', async () => {
    const groupName = groupNameInput.value.trim();
    if (groupName) {
      await chrome.runtime.sendMessage({ type: 'saveGroup', groupName });
      groupNameInput.value = '';
      hideForm();
      loadGroups();
    }
  });

  exportGroupsButton.addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'getGroups' }, (groups) => {
      if (groups) {
        const blob = new Blob([JSON.stringify(groups)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        chrome.downloads.download({
          url: url,
          filename: 'ducktabs_groups.json'
        });
      } else {
        console.error("Failed to retrieve groups for export.");
      }
    });
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
    }else if (e.target.classList.contains('deleteGroup')) {
      removeGroup(e.target.dataset.group);
    }
  });

  saveGroup__cancel.addEventListener('click', () => {
    hideForm();
  });

  function showForm(){
    saveGroupOption.style.display = 'none';
    saveGroupInput.style.display = 'block';
  }
  function hideForm(){
    saveGroupOption.style.display = 'flex';
    saveGroupInput.style.display = 'none';
  }
  async function removeGroup(groupName) {
    await chrome.runtime.sendMessage({ type: 'removeGroup', groupName });
    loadGroups();
    console.log(`Remove group '${groupName}' message sent.`);
  }
  function loadGroups() {
    chrome.runtime.sendMessage({ type: 'getGroups' }, (groups) => {
      groupList.innerHTML = '';
      // If the tabs are empty, show an error message
      if (groups.length === 0) {
        const div = document.createElement('div');
        div.classList.add('errorCard');
        div.innerHTML = `
          <p id='errorTitle'>What the DUCK!?</p>
          <p id='errorMsg'>You have no saved groups. Please save a new group or try again later. If you already have saved groups, try refreshing the list.</p>
          <p id='refreshList--btn'>Refresh</p>
        `;
        groupList.appendChild(div);

        // Change tab color
        groupList__title.classList.add('error');

        // Handle refresh
        let refreshBtn = document.getElementById('refreshList--btn');
        refreshBtn.addEventListener('click', () => {
          loadGroups();
        });

        return;
      }

      // Remove error from classlist - if possible
      try{
        groupList__title.classList.remove('error');
      }catch(err){
        console.log(err);
      }

      groups.forEach((group,index) => {
        const div = document.createElement('div');
        div.classList.add('group-item');
        div.innerHTML = `
        <div class='group-item_start'>
          <svg class='deleteGroup' data-group='${group.name}' title='Delete this group' xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="red" class="bi bi-trash3-fill" viewBox="0 0 16 16">
            <path d="M11 1.5v1h3.5a.5.5 0 0 1 0 1h-.538l-.853 10.66A2 2 0 0 1 11.115 16h-6.23a2 2 0 0 1-1.994-1.84L2.038 3.5H1.5a.5.5 0 0 1 0-1H5v-1A1.5 1.5 0 0 1 6.5 0h3A1.5 1.5 0 0 1 11 1.5m-5 0v1h4v-1a.5.5 0 0 0-.5-.5h-3a.5.5 0 0 0-.5.5M4.5 5.029l.5 8.5a.5.5 0 1 0 .998-.06l-.5-8.5a.5.5 0 1 0-.998.06m6.53-.528a.5.5 0 0 0-.528.47l-.5 8.5a.5.5 0 0 0 .998.058l.5-8.5a.5.5 0 0 0-.47-.528M8 4.5a.5.5 0 0 0-.5.5v8.5a.5.5 0 0 0 1 0V5a.5.5 0 0 0-.5-.5"/>
          </svg>
          <span class='group-item--close'></span><span>${group.name}</span>
        </div>`;
        const openButton = document.createElement('button');
        openButton.innerHTML = `Open 
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" class="bi bi-box-arrow-up-right" viewBox="0 0 16 16">
          <path fill-rule="evenodd" d="M8.636 3.5a.5.5 0 0 0-.5-.5H1.5A1.5 1.5 0 0 0 0 4.5v10A1.5 1.5 0 0 0 1.5 16h10a1.5 1.5 0 0 0 1.5-1.5V7.864a.5.5 0 0 0-1 0V14.5a.5.5 0 0 1-.5.5h-10a.5.5 0 0 1-.5-.5v-10a.5.5 0 0 1 .5-.5h6.636a.5.5 0 0 0 .5-.5"/>
          <path fill-rule="evenodd" d="M16 .5a.5.5 0 0 0-.5-.5h-5a.5.5 0 0 0 0 1h3.793L6.146 9.146a.5.5 0 1 0 .708.708L15 1.707V5.5a.5.5 0 0 0 1 0z"/>
        </svg>`;
        openButton.classList.add('open');
        openButton.dataset.group = group.name;
        div.appendChild(openButton);
        groupList.appendChild(div);
      });
    });
  }

  loadGroups();
});
