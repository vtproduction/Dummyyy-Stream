const API_URL = 'http://localhost:3001/api';
let channels = [];
let currentEditId = null;

// DOM Elements
const loginScreen = document.getElementById('login-screen');
const dashboard = document.getElementById('dashboard');
const pinInput = document.getElementById('pin-input');
const loginBtn = document.getElementById('login-btn');
const loginError = document.getElementById('login-error');
const logoutBtn = document.getElementById('logout-btn');
const channelList = document.getElementById('channel-list');
const searchInput = document.getElementById('search-input');
const channelCount = document.getElementById('channel-count');
const loader = document.getElementById('loader');

// Modal Elements
const editorModal = document.getElementById('editor-modal');
const closeModalBtn = document.getElementById('close-modal');
const cancelBtn = document.getElementById('cancel-btn');
const saveBtn = document.getElementById('save-btn');
const deleteBtn = document.getElementById('delete-btn');
const modalTitle = document.getElementById('modal-title');

// Inputs
const editName = document.getElementById('edit-name');
const editDesc = document.getElementById('edit-desc');
const editLogo = document.getElementById('edit-logo');
const editUrl = document.getElementById('edit-url');
const previewLogo = document.getElementById('preview-logo');

// Upload
const uploadInput = document.getElementById('upload-input');
const addBtn = document.getElementById('add-btn');

// --- Authentication ---

const checkAuth = () => {
    const token = localStorage.getItem('admin_pin');
    if (token) {
        showDashboard();
    } else {
        showLogin();
    }
};

const login = async () => {
    const pin = pinInput.value;
    if (!pin) return;

    try {
        const res = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pin })
        });
        const data = await res.json();

        if (data.success) {
            localStorage.setItem('admin_pin', pin);
            showDashboard();
        } else {
            showError('Invalid PIN');
        }
    } catch (err) {
        showError('Login failed');
    }
};

const logout = () => {
    localStorage.removeItem('admin_pin');
    showLogin();
};

const showLogin = () => {
    loginScreen.classList.remove('hidden');
    dashboard.classList.add('hidden');
    pinInput.value = '';
    loginError.classList.add('hidden');
};

const showDashboard = () => {
    loginScreen.classList.add('hidden');
    dashboard.classList.remove('hidden');
    fetchChannels();
};

const showError = (msg) => {
    loginError.textContent = msg;
    loginError.classList.remove('hidden');
};

// --- Data Operations ---

const getHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('admin_pin')}`
});

const fetchChannels = async () => {
    loader.classList.remove('hidden');
    try {
        const res = await fetch(`${API_URL}/channels`, { headers: getHeaders() });
        if (res.status === 401) return logout();
        channels = await res.json();
        renderChannels(channels);
    } catch (err) {
        console.error('Failed to fetch channels', err);
        alert('Failed to load channels');
    } finally {
        loader.classList.add('hidden');
    }
};

const saveChannels = async (newChannels) => {
    try {
        const res = await fetch(`${API_URL}/channels`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(newChannels)
        });
        if (res.status === 401) return logout();
        if (!res.ok) throw new Error('Failed to save');
        
        await fetchChannels(); // Refresh
        closeModal();
    } catch (err) {
        console.error(err);
        alert('Failed to save changes');
    }
};

const handleUpload = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
        const res = await fetch(`${API_URL}/upload`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('admin_pin')}`
            },
            body: formData
        });
        
        if (res.status === 401) return logout();
        
        const data = await res.json();
        if (msg = data.error) throw new Error(msg);

        alert('Upload successful!');
        fetchChannels();
    } catch (err) {
        alert(err.message || 'Upload failed');
    }
};

// --- UI Rendering ---

const getProxiedUrl = (url) => {
    if (!url) return 'https://via.placeholder.com/50';
    return `${API_URL}/proxy?url=${encodeURIComponent(url)}`;
};

const renderChannels = (list) => {
    channelList.innerHTML = '';
    channelCount.textContent = `${list.length} Channels`;

    list.forEach(channel => {
        const card = document.createElement('div');
        card.className = 'bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition card';
        
        card.innerHTML = `
            <div class="flex items-center gap-4 mb-3">
                <img src="${getProxiedUrl(channel.image_url)}" class="w-12 h-12 rounded object-cover bg-gray-100" onerror="this.src='https://via.placeholder.com/50'" loading="lazy">
                <div class="overflow-hidden">
                    <h3 class="font-bold text-gray-800 truncate">${channel.name || 'Unnamed'}</h3>
                    <p class="text-xs text-gray-500 truncate">${channel.description || ''}</p>
                </div>
            </div>
            <div class="text-xs text-gray-400 font-mono bg-gray-50 p-2 rounded mb-3 truncate w-full">
                ${channel.m3u8_url || 'No URL'}
            </div>
            <div class="flex justify-end gap-2">
                <button class="text-blue-600 hover:text-blue-800 text-sm font-medium px-2 py-1 rounded hover:bg-blue-50 edit-btn">Edit</button>
            </div>
        `;
        
        card.querySelector('.edit-btn').addEventListener('click', () => openEditModal(channel));
        channelList.appendChild(card);
    });
};

// --- Modal Logic ---

const openEditModal = (channel) => {
    currentEditId = channel.item_id;
    modalTitle.textContent = 'Edit Channel';
    
    editName.value = channel.name || '';
    editDesc.value = channel.description || '';
    editLogo.value = channel.image_url || '';
    editUrl.value = channel.m3u8_url || '';
    
    updatePreview();
    
    deleteBtn.classList.remove('hidden');
    editorModal.classList.remove('hidden');
    setTimeout(() => editorModal.classList.remove('opacity-0'), 10);
};

const openAddModal = () => {
    currentEditId = null;
    modalTitle.textContent = 'Add Channel';
    
    editName.value = '';
    editDesc.value = '';
    editLogo.value = '';
    editUrl.value = '';
    
    updatePreview();
    
    deleteBtn.classList.add('hidden');
    editorModal.classList.remove('hidden');
    setTimeout(() => editorModal.classList.remove('opacity-0'), 10);
};

const closeModal = () => {
    editorModal.classList.add('opacity-0');
    setTimeout(() => editorModal.classList.add('hidden'), 300);
};

const updatePreview = () => {
    const url = editLogo.value;
    if (url) {
        previewLogo.src = getProxiedUrl(url);
        previewLogo.classList.remove('hidden');
    } else {
        previewLogo.classList.add('hidden');
    }
};

// --- Event Listeners ---

loginBtn.addEventListener('click', login);
pinInput.addEventListener('keypress', (e) => e.key === 'Enter' && login());
logoutBtn.addEventListener('click', logout);

searchInput.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    const filtered = channels.filter(c => 
        (c.name && c.name.toLowerCase().includes(term)) || 
        (c.description && c.description.toLowerCase().includes(term))
    );
    renderChannels(filtered);
});

addBtn.addEventListener('click', openAddModal);
closeModalBtn.addEventListener('click', closeModal);
cancelBtn.addEventListener('click', closeModal);

editLogo.addEventListener('input', updatePreview);

saveBtn.addEventListener('click', () => {
    const newChannel = {
        item_id: currentEditId || crypto.randomUUID(),
        name: editName.value,
        description: editDesc.value,
        image_url: editLogo.value,
        m3u8_url: editUrl.value
    };

    let newChannels;
    if (currentEditId) {
        newChannels = channels.map(c => c.item_id === currentEditId ? { ...c, ...newChannel } : c);
    } else {
        newChannels = [...channels, newChannel];
    }
    
    saveChannels(newChannels);
});

deleteBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to delete this channel?')) {
        const newChannels = channels.filter(c => c.item_id !== currentEditId);
        saveChannels(newChannels);
    }
});

uploadInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        handleUpload(e.target.files[0]);
    }
});

// Init
checkAuth();
