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
        div.textContent = group.name;
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
