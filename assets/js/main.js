lucide.createIcons();

/* =========================================
    UTILITÁRIOS E GERENCIAMENTO DE ESTADO
    ========================================= */

let state = { 
    currentTab: 'text', 
    modes: { text: 'encrypt', img: 'encrypt', file: 'encrypt' }, 
    files: { img: null, lock: null, upload: null }, 
    fileInputMode: 'text',
    textCache: { encrypt: '', decrypt: '' },
    passwordCache: {
        text: { encrypt: '', decrypt: '' },
        file: { encrypt: '', decrypt: '' },
        img: { encrypt: '', decrypt: '' }
    },
    imgCache: { 
        encrypt: null, 
        decrypt: null 
    }
};

function setupEnterKeys() {
    const mapping = [
        { inputs: ['text-password', 'text-content'], btn: 'text-action-btn' },
        { inputs: ['file-name', 'file-password', 'file-content-text', 'file-extra-text'], btn: 'file-action-btn' },
        { inputs: ['img-password', 'img-message'], btn: 'img-action-btn' }
    ];
    mapping.forEach(group => {
        group.inputs.forEach(id => {
            const el = document.getElementById(id);
            if(el) {
                el.addEventListener('keydown', (e) => {
                    if (el.tagName === 'TEXTAREA') {
                        if (e.ctrlKey && e.key === 'Enter') { e.preventDefault(); document.getElementById(group.btn).click(); }
                    } else {
                        if (e.key === 'Enter') { e.preventDefault(); document.getElementById(group.btn).click(); }
                    }
                });
            }
        });
    });
}

function escapeHTML(str) {
    if(!str) return '';
    return str.toString().replace(/[&<>'"]/g, tag => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'}[tag] || tag));
}

// Progresso Global Overlay
function startProgress(label) {
    const overlay = document.getElementById('global-progress-overlay');
    if(!overlay) return;
    document.getElementById('g-progress-label').innerText = label || 'Processando...';
    document.getElementById('g-progress-pct').innerText = '0%';
    document.getElementById('g-progress-bar').style.width = '0%';
    overlay.classList.remove('hidden');
}
function updateProgress(pct) {
    const pBar = document.getElementById('g-progress-bar');
    if(!pBar) return;
    document.getElementById('g-progress-pct').innerText = Math.round(pct) + '%';
    pBar.style.width = pct + '%';
}
function endProgress() {
    updateProgress(100);
    setTimeout(() => {
        const overlay = document.getElementById('global-progress-overlay');
        if(overlay) overlay.classList.add('hidden');
    }, 300);
}

// Função para limpar campo especifico
function clearField(id) {
    const el = document.getElementById(id);
    if(el) {
        el.value = '';
        el.focus();
        if(id === 'text-content') handleTextInput('text', true);
        if(id === 'file-content-text') handleTextInput('file', true);
        if(id === 'img-message') handleTextInput('img', true);
    }
}

// Função disparada ao digitar (oninput)
function handleTextInput(type, skipSave = false) {
    let val = '';
    if (type === 'text') val = document.getElementById('text-content').value;
    else if (type === 'file') val = document.getElementById('file-content-text').value; 
    
    if (!val || val.trim() === '') {
        updateResultUI(type, false); 
        if (type === 'text') document.getElementById('text-output').innerText = '';
        if (type === 'file') document.getElementById('file-output-content').innerText = '';
    }
}

function clearFileUpload() {
    document.getElementById('file-content-upload').value = '';
    state.files.upload = null;
    
    document.getElementById('file-upload-info').classList.add('hidden');
    document.getElementById('file-input-upload-wrapper').querySelector('.cv-dropzone').classList.remove('hidden');
    
    document.getElementById('file-input-preview-right').classList.add('hidden');
    document.getElementById('file-placeholder').classList.remove('hidden');
}

function clearImageUpload(e) {
    if (e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    state.imgCache[state.modes.img] = null;
    document.getElementById('file-input').value = '';
    state.files.img = null;
    
    document.getElementById('upload-placeholder-content').innerHTML = `
        <i id="img-icon-left" data-lucide="image" style="width:32px; height:32px; margin-bottom:10px; color:var(--cv-text-muted);"></i>
        <p id="img-label-left" style="font-size:0.9rem; color:var(--cv-text-muted);">Selecionar ou arrastar PNG</p>
    `;
    lucide.createIcons();
    
    document.getElementById('btn-clear-img').classList.add('hidden');
    if(document.getElementById('img-preview-right')) document.getElementById('img-preview-right').src = '';
    document.getElementById('img-visual-area').classList.add('hidden');
    document.getElementById('img-placeholder').classList.remove('hidden');
}

window.onload = () => {
    document.querySelectorAll('input, textarea').forEach(el => el.value = '');
    setupEnterKeys();
    updateUI('text');
    updateUI('file');
    updateUI('img');
};

/* =========================================
    LÓGICA DE UI E NAVEGAÇÃO
    ========================================= */

function updateResultUI(type, hasResult) {
    const placeholder = document.getElementById(`${type}-placeholder`);
    let resultContainer;
    if (type === 'text') resultContainer = document.getElementById('text-result-container');
    else if (type === 'file') resultContainer = (state.modes.file === 'encrypt') ? document.getElementById('file-download-container') : document.getElementById('file-result-area');
    
    if (type !== 'img') {
        if (hasResult) {
            if(placeholder) placeholder.classList.add('hidden');
            if(resultContainer) resultContainer.classList.remove('hidden');
            if(type === 'file') document.getElementById('file-input-preview-right').classList.add('hidden');
        } else {
            const inputPreview = document.getElementById('file-input-preview-right');
            if (type === 'file' && !inputPreview.classList.contains('hidden')) {
                    if(placeholder) placeholder.classList.add('hidden');
            } else {
                    if(placeholder) placeholder.classList.remove('hidden');
            }
            if(resultContainer) {
                resultContainer.classList.add('hidden');
                if (resultContainer.id === 'file-download-container') {
                    const link = document.getElementById('file-download-link');
                    if (link) {
                        link.removeAttribute('href');
                        link.removeAttribute('download');
                    }
                }
            }
        }
    }
}

function navigate(tab) {
    if (tab === state.currentTab) return;
    state.currentTab = tab;
    
    document.querySelectorAll('.cv-nav-item').forEach(el => { el.classList.remove('active'); });
    
    document.getElementById('nav-btn-text')?.classList.toggle('active', tab === 'text');
    document.getElementById('nav-btn-file')?.classList.toggle('active', tab === 'file');
    document.getElementById('nav-btn-image')?.classList.toggle('active', tab === 'image');
    document.getElementById('nav-btn-about')?.classList.toggle('active', tab === 'about');
    
    document.getElementById('page-text')?.classList.toggle('hidden', tab !== 'text');
    document.getElementById('page-file')?.classList.toggle('hidden', tab !== 'file');
    document.getElementById('page-image')?.classList.toggle('hidden', tab !== 'image');
    document.getElementById('page-about')?.classList.toggle('hidden', tab !== 'about');

    // Limpar preview lateral ao trocar de aba
    document.getElementById('text-output').innerText = '';
    document.getElementById('text-result-container').classList.add('hidden');
    updateResultUI('text', false);

    if (document.getElementById('file-input-preview-right')) document.getElementById('file-input-preview-right').classList.add('hidden');
    if (document.getElementById('file-result-area')) document.getElementById('file-result-area').classList.add('hidden');
    if (document.getElementById('file-display-top')) document.getElementById('file-display-top').classList.add('hidden');
    if (document.getElementById('file-output-content')) document.getElementById('file-output-content').innerText = '';
    if (document.getElementById('file-download-container')) document.getElementById('file-download-container').classList.add('hidden');
    updateResultUI('file', false);
    
    if (state.modes.img === 'decrypt') {
        document.getElementById('img-message').value = '';
        document.getElementById('img-msg-container').classList.add('hidden');
    }
    document.getElementById('img-download-overlay')?.classList.add('hidden');
    if(document.getElementById('img-preview-right')) document.getElementById('img-preview-right').src = '';
    document.getElementById('img-visual-area')?.classList.add('hidden');
    document.getElementById('img-placeholder')?.classList.remove('hidden');
    
    ['text', 'file', 'img'].forEach(t => {
        const chk = document.getElementById(`${t}-use-password`);
        if(chk) chk.disabled = false;
    });
}

function setMode(type, mode) {
    if (state.modes[type] === mode) return;

    if (type === 'text') {
        state.textCache[state.modes.text] = document.getElementById('text-content').value;
    }
    if (type === 'img') {
        const currentFile = state.files.img;
        const currentSrc = document.getElementById('img-preview-right').src;
        if (currentFile) {
                state.imgCache[state.modes.img] = { file: currentFile, src: currentSrc };
        } else {
                state.imgCache[state.modes.img] = null;
        }
    }

    const pwdInput = document.getElementById(`${type}-password`);
    if (pwdInput) {
        state.passwordCache[type][state.modes[type]] = pwdInput.value;
    }

    state.modes[type] = mode;
    updateResultUI(type, false);
    
    updateUI(type);
    const chk = document.getElementById(`${type}-use-password`);
    if(chk) {
        chk.disabled = false; 
        togglePasswordInput(type);
    }

    if (pwdInput) {
        pwdInput.value = state.passwordCache[type][mode] || '';
    }

    if (type === 'text') {
        document.getElementById('text-output').innerText = '';
        document.getElementById('text-content').value = state.textCache[mode] || '';
        handleTextInput('text');
    }

    if (type === 'file') {
        document.getElementById('file-output-content').innerText = '';
        
        const topDisplay = document.getElementById('file-display-top');
        topDisplay.classList.add('hidden');
        const prev = document.getElementById('file-result-preview');
        prev.src = '';
        const dlOverlay = document.getElementById('file-download-overlay');
        dlOverlay.removeAttribute('href');
        dlOverlay.removeAttribute('download');
        
        document.getElementById('file-input-preview-right').classList.add('hidden');
        const dlContainer = document.getElementById('file-download-container');
        dlContainer.classList.add('hidden');
        const link = document.getElementById('file-download-link');
        if(link) {
            link.removeAttribute('href');
            link.removeAttribute('download');
        }
    }

    if (type === 'img') {
        const cached = state.imgCache[mode];
        if (cached && cached.file) {
            state.files.img = cached.file;
            document.getElementById('img-preview-right').src = cached.src;
            
            document.getElementById('img-placeholder').classList.add('hidden');
            document.getElementById('img-visual-area').classList.remove('hidden');
            document.getElementById('btn-clear-img').classList.remove('hidden');
            
            document.getElementById('upload-placeholder-content').innerHTML = `
                <i id="img-icon-left" data-lucide="check" style="width:32px; height:32px; margin-bottom:10px; color:var(--cv-accent);"></i>
                <p id="img-label-left" style="font-size:0.9rem; color:var(--cv-text-main);">${escapeHTML(cached.file.name)}</p>
            `;
            lucide.createIcons();

            if (mode === 'decrypt') {
                const blk = document.getElementById('img-password-block');
                const chk = document.getElementById('img-use-password');
                if (blk) blk.style.display = 'block';
                if (chk) { chk.checked = true; chk.disabled = true; }
                togglePasswordInput('img');
                detectImagePassword(cached.src);
            }
        } else {
            state.files.img = null;
            document.getElementById('file-input').value = '';
            if(document.getElementById('img-preview-right')) document.getElementById('img-preview-right').src = '';
            document.getElementById('img-visual-area').classList.add('hidden');
            document.getElementById('img-placeholder').classList.remove('hidden');
            document.getElementById('btn-clear-img').classList.add('hidden');
            
            document.getElementById('upload-placeholder-content').innerHTML = `
                <i id="img-icon-left" data-lucide="image" style="width:32px; height:32px; margin-bottom:10px; color:var(--cv-text-muted);"></i>
                <p id="img-label-left" style="font-size:0.9rem; color:var(--cv-text-muted);">Selecionar ou arrastar PNG</p>
            `;
            lucide.createIcons();
        }
    }
    
}

function toggleFileType(mode) {
    state.fileInputMode = mode;
    const btnText = document.getElementById('type-btn-text');
    const btnUpload = document.getElementById('type-btn-upload');
    if (mode === 'text') {
        btnText.classList.add('active'); btnText.style.background = 'var(--cv-border)'; btnText.style.color = 'white';
        btnUpload.classList.remove('active'); btnUpload.style.background = 'transparent'; btnUpload.style.color = 'var(--cv-text-muted)';
        document.getElementById('file-input-text-wrapper').classList.remove('hidden');
        document.getElementById('file-input-upload-wrapper').classList.add('hidden');
        document.getElementById('file-input-preview-right').classList.add('hidden');
        updateResultUI('file', false);
    } else {
        btnUpload.classList.add('active'); btnUpload.style.background = 'var(--cv-border)'; btnUpload.style.color = 'white';
        btnText.classList.remove('active'); btnText.style.background = 'transparent'; btnText.style.color = 'var(--cv-text-muted)';
        document.getElementById('file-input-text-wrapper').classList.add('hidden');
        document.getElementById('file-input-upload-wrapper').classList.remove('hidden');
    }
}

function updateUI(type) {
    const isEnc = state.modes[type] === 'encrypt';
    const btnEnc = document.getElementById(`btn-${type}-enc`);
    const btnDec = document.getElementById(`btn-${type}-dec`);
    if (isEnc) { btnEnc.classList.add('active'); btnDec.classList.remove('active'); }
    else { btnDec.classList.add('active'); btnEnc.classList.remove('active'); }

    const switchWrap = document.getElementById(`${type}-switch-wrapper`);
    if (switchWrap) switchWrap.style.display = isEnc ? '' : 'none'; 

    const pwdBlock = document.getElementById(`${type}-password-block`);
    if (type === 'text') {
        const btn = document.getElementById('text-action-btn');
        const area = document.getElementById('text-content');
        const label = document.getElementById('text-content-label');
        
        if (isEnc) { 
            btn.innerText = 'PROCESSAR'; 
            area.placeholder = 'Escreva ou cole aqui para proteger...'; 
            label.innerText = 'CONTEÚDO PARA CRIPTOGRAFAR'; 
            pwdBlock.style.display = 'block'; 
        } else { 
            btn.innerText = 'DESCRIPTOGRAFAR'; 
            area.placeholder = 'Cole o código aqui: vac-...-lock'; 
            label.innerText = 'CÓDIGO CRIPTOGRAFADO'; 
            pwdBlock.style.display = 'none'; 
        }
    } else if (type === 'file') {
        const createArea = document.getElementById('file-create-area');
        const uploadArea = document.getElementById('file-upload-area');
        const btn = document.getElementById('file-action-btn');
        const saveAsBlock = document.getElementById('file-save-as-block');
        
        createArea.classList.toggle('hidden', !isEnc);
        uploadArea.classList.toggle('hidden', isEnc);
        btn.innerText = isEnc ? 'GERAR ARQUIVO' : 'ABRIR ARQUIVO';
        pwdBlock.style.display = isEnc ? 'block' : 'none';
        
        if (saveAsBlock) saveAsBlock.style.display = isEnc ? 'block' : 'none';
        
    } else if (type === 'img') {
        const msgBox = document.getElementById('img-msg-container');
        const btn = document.getElementById('img-action-btn');
        const label = document.getElementById('img-msg-label');
        const warning = document.getElementById('warning-stego');
        
        if (isEnc) { 
            msgBox.classList.remove('hidden'); 
            btn.innerText = 'PROCESSAR IMAGEM'; 
            label.innerText = 'MENSAGEM PARA ESCONDER'; 
            pwdBlock.style.display = 'block'; 
            if (warning) warning.classList.remove('hidden');
        } else { 
            msgBox.classList.add('hidden'); 
            btn.innerText = 'LER IMAGEM'; 
            pwdBlock.style.display = 'none'; 
            if (warning) warning.classList.add('hidden');
        }
    }
}

function togglePasswordInput(type) {
    const chk = document.getElementById(`${type}-use-password`);
    const wrap = document.getElementById(`${type}-password-wrapper`);
    const inp = document.getElementById(`${type}-password`);
    if (wrap) {
        if (chk && chk.checked) { wrap.style.opacity = '1'; wrap.style.pointerEvents = 'auto'; inp.disabled = false; }
        else { wrap.style.opacity = '0.4'; wrap.style.pointerEvents = 'none'; inp.disabled = true; inp.value = ''; }
    } else {
        if (chk && chk.checked) { inp.disabled = false; inp.parentElement.style.opacity = '1'; }
        else { inp.disabled = true; inp.value = ''; inp.parentElement.style.opacity = '0.5'; }
    }
}

/* =========================================
    CRYPTO CORE
    ========================================= */
const CRYPTO_CONFIG = {
    ALGO: { name: "AES-GCM", length: 256, tagLength: 128 },
    KDF: { name: "PBKDF2", hash: "SHA-512", iterations: 2000000 },
    SALT_LEN: 32, IV_LEN: 12, VERSION: 0x01,
    PUBLIC_CONSTANT: "CRYPTOVAULT_HARDENED_PUBLIC_CONST_V5_SHA512"
};

const CryptoCore = {
    getRandomBytes(len) { const buf = new Uint8Array(len); window.crypto.getRandomValues(buf); return buf; },
    peekHeaderFlag(buffer) {
        if (buffer.byteLength < 2) return null;
        const view = new Uint8Array(buffer);
        if (view[0] !== CRYPTO_CONFIG.VERSION) return null;
        return view[1];
    },
    async deriveKey(passwordRaw, salt) {
        const enc = new TextEncoder();
        const keyMaterial = await window.crypto.subtle.importKey("raw", enc.encode(passwordRaw), "PBKDF2", false, ["deriveKey"]);
        return await window.crypto.subtle.deriveKey({ ...CRYPTO_CONFIG.KDF, salt: salt }, keyMaterial, CRYPTO_CONFIG.ALGO, false, ["encrypt", "decrypt"]);
    },
    async encrypt(dataBuffer, userPassword, useUserPassword) {
        const passwordToUse = useUserPassword ? userPassword : CRYPTO_CONFIG.PUBLIC_CONSTANT;
        const salt = this.getRandomBytes(CRYPTO_CONFIG.SALT_LEN);
        const iv = this.getRandomBytes(CRYPTO_CONFIG.IV_LEN);
        const key = await this.deriveKey(passwordToUse, salt);
        const ciphertext = await window.crypto.subtle.encrypt({ name: "AES-GCM", iv: iv, tagLength: 128 }, key, dataBuffer);
        const payload = new Uint8Array(1 + 1 + CRYPTO_CONFIG.SALT_LEN + CRYPTO_CONFIG.IV_LEN + ciphertext.byteLength);
        let offset = 0;
        payload.set([CRYPTO_CONFIG.VERSION], offset++); payload.set([useUserPassword ? 0x01 : 0x00], offset++);
        payload.set(salt, offset); offset += CRYPTO_CONFIG.SALT_LEN;
        payload.set(iv, offset); offset += CRYPTO_CONFIG.IV_LEN;
        payload.set(new Uint8Array(ciphertext), offset);
        return payload;
    },
    async decrypt(payloadBuffer, userPasswordInput) {
        const payload = new Uint8Array(payloadBuffer);
        if (payload.length < (2 + CRYPTO_CONFIG.SALT_LEN + CRYPTO_CONFIG.IV_LEN)) throw new Error("Dados inválidos.");
        const hasUserPwd = payload[1] === 0x01;
        const passwordToUse = hasUserPwd ? userPasswordInput : CRYPTO_CONFIG.PUBLIC_CONSTANT;
        if (hasUserPwd && !userPasswordInput) throw new Error("Senha necessária.");
        let offset = 2;
        const salt = payload.slice(offset, offset + CRYPTO_CONFIG.SALT_LEN); offset += CRYPTO_CONFIG.SALT_LEN;
        const iv = payload.slice(offset, offset + CRYPTO_CONFIG.IV_LEN); offset += CRYPTO_CONFIG.IV_LEN;
        const ciphertext = payload.slice(offset);
        const key = await this.deriveKey(passwordToUse, salt);
        const plaintext = await window.crypto.subtle.decrypt({ name: "AES-GCM", iv: iv, tagLength: 128 }, key, ciphertext);
        return new Uint8Array(plaintext);
    }
};

const Utils = {
    bufToBase64: (buffer) => {
        let binary = ''; const bytes = new Uint8Array(buffer); const len = bytes.byteLength;
        for (let i = 0; i < len; i += 0x8000) binary += String.fromCharCode.apply(null, bytes.subarray(i, Math.min(i + 0x8000, len)));
        return window.btoa(binary);
    },
    base64ToBuf: (str) => {
        const binary = window.atob(str); const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        return bytes;
    },
    strToBuf: (str) => new TextEncoder().encode(str),
    bufToStr: (buf) => new TextDecoder().decode(buf)
};

// --- EVENTOS DE ARQUIVO ---

document.getElementById('file-content-upload').onchange = (e) => {
    const f = e.target.files[0];
    if (f) {
        document.getElementById('upload-label').innerText = "Arquivo Selecionado";
        state.files.upload = f;
        
        const infoBox = document.getElementById('file-upload-info');
        const infoName = document.getElementById('file-info-name');
        const infoDetails = document.getElementById('file-info-details');
        const infoIcon = document.getElementById('file-info-icon');

        infoName.innerText = f.name;
        const size = (f.size / 1024).toFixed(2) + ' KB';
        infoDetails.innerText = `${f.type || 'Desconhecido'} • ${size}`;
        
        if (f.type.startsWith('image/')) {
            infoIcon.setAttribute('data-lucide', 'image');
        } else {
            infoIcon.setAttribute('data-lucide', 'file');
        }
        lucide.createIcons();
        infoBox.classList.remove('hidden');
        document.getElementById('file-input-upload-wrapper').querySelector('.cv-dropzone').classList.add('hidden');

        const placeholder = document.getElementById('file-placeholder');
        const previewContainer = document.getElementById('file-input-preview-right');
        const imgPrev = document.getElementById('file-input-image-preview');
        const genPrev = document.getElementById('file-input-generic-preview');
        const fileName = document.getElementById('file-input-name');

        placeholder.classList.add('hidden');
        previewContainer.classList.remove('hidden');
        previewContainer.classList.add('flex');

        if (f.type.startsWith('image/')) {
            startProgress("Lendo Imagem...");
            const r = new FileReader();
            r.onprogress = (ev) => { if(ev.lengthComputable) updateProgress((ev.loaded / ev.total) * 100); };
            r.onload = (ev) => { 
                endProgress();
                imgPrev.src = ev.target.result;
                imgPrev.classList.remove('hidden');
                genPrev.classList.add('hidden');
            };
            r.readAsDataURL(f);
        } else { 
            imgPrev.classList.add('hidden');
            genPrev.classList.remove('hidden');
            fileName.innerText = f.name;
        }
    }
};

document.getElementById('lock-file-input').onchange = (e) => {
    const f = e.target.files[0];
    if (f) {
        if (!f.name.toLowerCase().endsWith('.lock')) { showToast("Arquivo deve ser .lock", "error"); e.target.value = ''; return; }
        state.files.lock = f; document.getElementById('lock-file-label').innerText = f.name;
        
        if (state.modes.file === 'decrypt') {
            const blk = document.getElementById('file-password-block');
            const chk = document.getElementById('file-use-password');
            if (blk) blk.style.display = 'block';
            if (chk) { chk.checked = true; chk.disabled = true; }
            togglePasswordInput('file');
        }
        
        document.getElementById('file-result-area').classList.add('hidden');
        document.getElementById('file-output-content').innerText = '';
        const topArea = document.getElementById('file-display-top');
        if (topArea) topArea.classList.add('hidden');

        const placeholder = document.getElementById('file-placeholder');
        const previewContainer = document.getElementById('file-input-preview-right');
        const imgPrev = document.getElementById('file-input-image-preview');
        const genPrev = document.getElementById('file-input-generic-preview');
        const fileName = document.getElementById('file-input-name');

        if (placeholder) placeholder.classList.add('hidden');
        if (previewContainer) {
            previewContainer.classList.remove('hidden');
            previewContainer.classList.add('flex');
        }
        if (imgPrev) imgPrev.classList.add('hidden');
        if (genPrev) genPrev.classList.remove('hidden');
        if (fileName) fileName.innerText = f.name;
        
        const reader = new FileReader();
        reader.onload = function (evt) {
            const flag = CryptoCore.peekHeaderFlag(evt.target.result);
            const chk = document.getElementById('file-use-password');
            const blk = document.getElementById('file-password-block');
            
            if (state.modes.file === 'decrypt') {
                if (flag === 0x01 || flag === null) { 
                    if(chk) { chk.checked = true; chk.disabled = true; }
                    if(blk) blk.style.display = 'block';
                    if(flag === 0x01) showToast("Arquivo protegido por senha."); 
                } else if (flag === 0x00) { 
                    if(chk) { chk.checked = false; chk.disabled = true; }
                    if(blk) blk.style.display = 'none';
                    showToast("Arquivo sem senha."); 
                }
                togglePasswordInput('file');
                if ((flag === 0x01 || flag === null) && chk && chk.checked) {
                    const inp = document.getElementById('file-password');
                    if(inp) inp.focus();
                }
            }
        };
        reader.readAsArrayBuffer(f.slice(0, 2));
    }
};

document.getElementById('file-input').onchange = (e) => {
    const f = e.target.files[0];
    if (f) {
        state.files.img = f;
        
        document.getElementById('img-message').value = '';
        
        if (state.modes.img === 'decrypt') {
            document.getElementById('img-msg-container').classList.add('hidden');
            const blk = document.getElementById('img-password-block');
            const chk = document.getElementById('img-use-password');
            if (blk) blk.style.display = 'block';
            if (chk) { chk.checked = true; chk.disabled = true; }
            togglePasswordInput('img');
        }

        document.getElementById('upload-placeholder-content').innerHTML = `
            <i id="img-icon-left" data-lucide="check" style="width:32px; height:32px; margin-bottom:10px; color:var(--cv-accent);"></i>
            <p id="img-label-left" style="font-size:0.9rem; color:var(--cv-text-main);">${escapeHTML(f.name)}</p>
        `;
        lucide.createIcons();
        
        document.getElementById('btn-clear-img').classList.remove('hidden');

        startProgress("Analisando Imagem...");
        const r = new FileReader();
        r.onprogress = (ev) => { if(ev.lengthComputable) updateProgress((ev.loaded / ev.total) * 100); };
        r.onload = (ev) => {
            endProgress();
            const imgPreview = document.getElementById('img-preview-right');
            imgPreview.src = ev.target.result;
            document.getElementById('img-placeholder').classList.add('hidden');
            document.getElementById('img-visual-area').classList.remove('hidden');
            
            const dlLink = document.getElementById('img-download-overlay');
            if (dlLink) {
                dlLink.href = ev.target.result;
                dlLink.download = f.name;
                dlLink.classList.remove('hidden');
            }
            
            if (state.modes.img === 'decrypt') detectImagePassword(ev.target.result);
        };
        r.readAsDataURL(f);
    }
};

function detectImagePassword(dataUrl) {
    const overlay = document.getElementById('img-analyzing');
    if(overlay) overlay.classList.remove('hidden');
    
    const img = new Image();
    img.onload = function () {
        const cvs = document.createElement('canvas'); const ctx = cvs.getContext('2d');
        cvs.width = this.width; cvs.height = this.height;
        ctx.drawImage(this, 0, 0);
        const pixels = ctx.getImageData(0, 0, this.width, this.height).data;
        let pIdx = 0;
        const readByte = () => { let b = 0; for (let i = 0; i < 8; i++) { if ((pIdx + 1) % 4 === 0) pIdx++; b = (b << 1) | (pixels[pIdx] & 1); pIdx++; } return b; };
        
        const blk = document.getElementById('img-password-block');
        const chk = document.getElementById('img-use-password');
        
        let requiresPassword = false;

        try {
            for (let i = 0; i < 4; i++) readByte();
            const ver = readByte(); const flag = readByte();
            if (ver === CRYPTO_CONFIG.VERSION) {
                requiresPassword = (flag === 0x01);
                if (requiresPassword) { 
                    showToast("Imagem protegida por senha."); 
                } else {
                    showToast("Imagem sem senha."); 
                }
            } else {
                requiresPassword = true;
            }
        } catch (e) { 
            requiresPassword = true;
        }
        
        if (state.modes.img === 'decrypt') {
            if (requiresPassword) {
                if(blk) blk.style.display = 'block';
                if(chk) { chk.checked = true; chk.disabled = true; }
            } else {
                if(blk) blk.style.display = 'none';
                if(chk) { chk.checked = false; chk.disabled = true; }
            }
            togglePasswordInput('img');
            if (requiresPassword && chk && chk.checked) {
                const inp = document.getElementById('img-password');
                if(inp) inp.focus();
            }
        }

        if(overlay) overlay.classList.add('hidden');
    };
    img.src = dataUrl;
}

// --- PROCESSAMENTO ---

async function processText() {
    const usePwd = document.getElementById('text-use-password').checked;
    const pwdInput = document.getElementById('text-password').value;
    const content = document.getElementById('text-content').value.trim();
    const output = document.getElementById('text-output');
    try {
        if (state.modes.text === 'encrypt') {
            if (!content) return showToast("Digite uma mensagem.", "error");
            if (usePwd && !pwdInput) return showToast("Defina uma senha.", "error");
            
            startProgress("Criptografando...");
            updateProgress(30);
            
            setTimeout(async () => {
                try {
                    const buffer = Utils.strToBuf(content);
                    const encrypted = await CryptoCore.encrypt(buffer, pwdInput, usePwd);
                    output.innerText = `vac-${Utils.bufToBase64(encrypted)}-lock`;
                    
                    updateResultUI('text', true);
                    showToast("Criptografado com sucesso!"); 
                    addToHistory('Criptografou um texto', 'Texto', 'Sucesso');
                    endProgress();
                } catch(e) {
                    endProgress();
                    showToast("Erro de criptografia.", "error"); 
                }
            }, 50);
            
        } else {
            if (!content) return showToast("Cole o código.", "error");
            let clean = content;
            const match = content.match(/^vac-(.*)-lock$/s);
            if (match) clean = match[1]; else if (!content.startsWith('vac-')) return showToast("Formato inválido.", "error");
            let payload; try { payload = Utils.base64ToBuf(clean); } catch { return showToast("Código corrompido.", "error"); }
            
            if (payload && payload.length > 2) {
                const flag = payload[1];
                const chk = document.getElementById('text-use-password');
                const blk = document.getElementById('text-password-block');
                if (flag === 0x01) {
                    if (blk.style.display === 'none' || !pwdInput) {
                        blk.style.display = 'block';
                        if(chk) { chk.checked = true; chk.disabled = true; }
                        togglePasswordInput('text');
                        document.getElementById('text-password').focus();
                        return showToast("Senha necessária para este conteúdo.", "error");
                    }
                } else if (flag === 0x00) {
                    if(chk) { chk.checked = false; chk.disabled = true; }
                    togglePasswordInput('text');
                }
            }

            startProgress("Descriptografando...");
            updateProgress(50);
            setTimeout(async () => {
                try {
                    const decryptedBuf = await CryptoCore.decrypt(payload, pwdInput);
                    output.innerText = Utils.bufToStr(decryptedBuf);
                    updateResultUI('text', true);
                    showToast("Texto revelado!"); 
                    addToHistory('Descriptografou um texto', 'Texto', 'Sucesso');
                    endProgress();
                } catch (e) {
                    endProgress();
                    console.error(e); 
                    showToast("Falha: Senha ou dados incorretos.", "error"); 
                    addToHistory('Falha ao descriptografar texto', 'Texto', 'Falha'); 
                }
            }, 50);
        }
    } catch (e) { 
        console.error(e); 
        showToast("Falha geral.", "error"); 
    }
}

async function processFileLock() {
    const usePwd = document.getElementById('file-use-password').checked;
    const pwdInput = document.getElementById('file-password').value;
    try {
        if (state.modes.file === 'encrypt') {
            const fname = document.getElementById('file-name').value || 'arquivo';
            if (usePwd && !pwdInput) return showToast("Defina a senha.", "error");
            let metaData = {};
            
            if (state.fileInputMode === 'upload') {
                if (!state.files.upload) return showToast("Selecione um arquivo.", "error");
                
                startProgress("Lendo arquivo original...");
                const file = state.files.upload; 
                const r = new FileReader();
                r.onprogress = (ev) => { if(ev.lengthComputable) updateProgress((ev.loaded/ev.total)*40); };
                r.onload = async (ev) => {
                    try {
                        const buf = ev.target.result;
                        const extraText = document.getElementById('file-extra-text').value;
                        
                        if (extraText && extraText.trim() !== '') {
                            metaData = { 
                                type: 'hybrid', 
                                text: extraText,
                                file: { name: file.name, mime: file.type, data: Utils.bufToBase64(buf) }
                            };
                        } else {
                            metaData = { type: 'file', name: file.name, mime: file.type, data: Utils.bufToBase64(buf) };
                        }
                        
                        updateProgress(60);
                        document.getElementById('g-progress-label').innerText = 'Criptografando (Pode demorar)...';
                        
                        setTimeout(async () => {
                            const jsonBuffer = Utils.strToBuf(JSON.stringify(metaData));
                            const encrypted = await CryptoCore.encrypt(jsonBuffer, pwdInput, usePwd);
                            
                            const blob = new Blob([encrypted], { type: "application/octet-stream" });
                            const url = URL.createObjectURL(blob);
                            const link = document.getElementById('file-download-link');
                            link.href = url; link.download = `${fname}.lock`;
                            
                            updateResultUI('file', true);
                            showToast("Arquivo .lock criado!"); 
                            addToHistory('Criou um novo arquivo .lock', 'Arquivo', 'Sucesso');
                            endProgress();
                        }, 50);

                    } catch(err) {
                        endProgress();
                        showToast("Erro ao processar arquivo", "error");
                    }
                };
                r.readAsArrayBuffer(file);

            } else {
                const txt = document.getElementById('file-content-text').value;
                if (!txt) return showToast("Digite o conteúdo.", "error");
                metaData = { type: 'text', data: txt };
                
                startProgress("Criptografando...");
                setTimeout(async () => {
                    const jsonBuffer = Utils.strToBuf(JSON.stringify(metaData));
                    const encrypted = await CryptoCore.encrypt(jsonBuffer, pwdInput, usePwd);
                    
                    const blob = new Blob([encrypted], { type: "application/octet-stream" });
                    const url = URL.createObjectURL(blob);
                    const link = document.getElementById('file-download-link');
                    link.href = url; link.download = `${fname}.lock`;
                    updateResultUI('file', true);
                    showToast("Arquivo .lock criado!"); 
                    addToHistory('Criou um arquivo .lock', 'Arquivo', 'Sucesso');
                    endProgress();
                }, 50);
            }

        } else {
            if (!state.files.lock) return showToast("Selecione o arquivo .lock", "error");
            
            startProgress("Lendo arquivo .lock...");
            const r = new FileReader();
            r.onprogress = (ev) => { if(ev.lengthComputable) updateProgress((ev.loaded/ev.total)*40); };
            r.onload = async (ev) => {
                updateProgress(50);
                document.getElementById('g-progress-label').innerText = 'Descriptografando...';
                
                setTimeout(async () => {
                    try {
                        const buf = ev.target.result;
                        const decrypted = await CryptoCore.decrypt(buf, pwdInput);
                        const jsonStr = Utils.bufToStr(decrypted);
                        let content; try { content = JSON.parse(jsonStr); } catch { throw new Error("Formato interno inválido."); }
                        
                        const disp = document.getElementById('file-output-content');
                        const dlBtnOverlay = document.getElementById('file-download-overlay');
                        const prev = document.getElementById('file-result-preview');
                        const topArea = document.getElementById('file-display-top');
                        const genFileArea = document.getElementById('file-result-generic');
                        
                        topArea.classList.add('hidden');
                        dlBtnOverlay.classList.add('hidden');
                        prev.classList.add('hidden');
                        if(genFileArea) genFileArea.classList.add('hidden');
                        disp.innerText = '';

                        if (content.type === 'file' || content.type === 'hybrid') {
                            const fData = (content.type === 'hybrid') ? content.file : content;
                            topArea.classList.remove('hidden');
                            
                            const fileBytes = Utils.base64ToBuf(fData.data);
                            const fileBlob = new Blob([fileBytes], { type: fData.mime });
                            const url = URL.createObjectURL(fileBlob);
                            
                            if (fData.mime.startsWith('image/')) { 
                                prev.src = url; 
                                prev.classList.remove('hidden'); 
                                dlBtnOverlay.classList.remove('hidden');
                                dlBtnOverlay.href = url;
                                dlBtnOverlay.download = fData.name;
                            } else {
                                if (genFileArea) {
                                    genFileArea.classList.remove('hidden');
                                    genFileArea.classList.add('flex');
                                    document.getElementById('file-result-generic-name').innerText = fData.name;
                                    document.getElementById('file-result-generic-dl').href = url;
                                    document.getElementById('file-result-generic-dl').download = fData.name;
                                }
                            }

                            if (content.type === 'hybrid') {
                                disp.innerText = content.text;
                            } else {
                                disp.innerText = "Este arquivo não contém texto adicional.";
                                disp.style.fontStyle = "italic";
                                disp.style.opacity = "0.5";
                            }
                        } else {
                            disp.innerText = content.data;
                            disp.style.fontStyle = "normal";
                            disp.style.opacity = "1";
                        }
                        
                        lucide.createIcons();
                        updateResultUI('file', true);
                        showToast("Arquivo aberto!"); 
                        addToHistory('Abriu um arquivo .lock', 'Arquivo', 'Sucesso');
                        endProgress();
                    } catch(err) {
                        console.error(err);
                        endProgress();
                        showToast("Falha: Senha ou dados incorretos.", "error"); 
                        addToHistory('Falha ao abrir arquivo .lock', 'Arquivo', 'Falha');
                    }
                }, 50);
            };
            r.readAsArrayBuffer(state.files.lock);
        }
    } catch (e) { 
        console.error(e); 
        showToast("Erro inesperado.", "error"); 
    }
}

async function processImage() {
    const usePwd = document.getElementById('img-use-password').checked;
    const pwdInput = document.getElementById('img-password').value;
    const msg = document.getElementById('img-message').value;
    if (!state.files.img) return showToast("Selecione uma imagem.", "error");
    
    startProgress(state.modes.img === 'encrypt' ? 'Escondendo Texto...' : 'Lendo Imagem...');
    
    setTimeout(async () => {
        const img = document.getElementById('img-preview-right');
        const cvs = document.createElement('canvas'); const ctx = cvs.getContext('2d');
        cvs.width = img.naturalWidth; cvs.height = img.naturalHeight;
        ctx.drawImage(img, 0, 0);
        const imgData = ctx.getImageData(0, 0, cvs.width, cvs.height); const pixels = imgData.data;
        
        try {
            if (state.modes.img === 'encrypt') {
                if (!msg) throw new Error("DIGITEMSG");
                if (usePwd && !pwdInput) throw new Error("DIGITEPWD");
                
                updateProgress(40);
                const msgBuf = Utils.strToBuf(msg);
                const encrypted = await CryptoCore.encrypt(msgBuf, pwdInput, usePwd);
                const lenBuf = new Uint8Array(4); new DataView(lenBuf.buffer).setUint32(0, encrypted.byteLength);
                const totalBits = (lenBuf.length + encrypted.byteLength) * 8;
                const maxCapacity = Math.floor(pixels.length / 4) * 3;
                
                if (totalBits > maxCapacity) throw new Error("CAPACITY");
                
                updateProgress(60);
                let pIdx = 0;
                const writeByte = (byte) => {
                    for (let i = 0; i < 8; i++) {
                        const bit = (byte >> (7 - i)) & 1; if ((pIdx + 1) % 4 === 0) pIdx++;
                        pixels[pIdx] = (pixels[pIdx] & 0xFE) | bit; pIdx++;
                    }
                };
                for (let b of lenBuf) writeByte(b);
                for (let b of encrypted) writeByte(b);
                ctx.putImageData(imgData, 0, 0);
                
                updateProgress(90);
                const link = document.getElementById('img-download-overlay');
                const uniqueCode = Math.floor(Math.random() * 9000000000) + 1000000000;
                const finalDataUrl = cvs.toDataURL('image/png');
                
                link.href = finalDataUrl; 
                link.download = `lock-${uniqueCode}.png`;
                link.classList.remove('hidden');
                
                showToast("Esteganografia concluída!"); 
                addToHistory('Criptografou texto em imagem', 'Imagem', 'Sucesso');
                endProgress();
                
            } else {
                updateProgress(50);
                let pIdx = 0;
                const readByte = () => { let b = 0; for (let i = 0; i < 8; i++) { if ((pIdx + 1) % 4 === 0) pIdx++; b = (b << 1) | (pixels[pIdx] & 1); pIdx++; } return b; };
                const lenBytes = new Uint8Array(4); for (let i = 0; i < 4; i++) lenBytes[i] = readByte();
                const dataLen = new DataView(lenBytes.buffer).getUint32(0);
                if (dataLen <= 0 || dataLen * 8 > pixels.length) throw new Error("NODATA");
                const payload = new Uint8Array(dataLen); for (let i = 0; i < dataLen; i++) payload[i] = readByte();
                const decrypted = await CryptoCore.decrypt(payload, pwdInput);
                const txt = Utils.bufToStr(decrypted);
                
                document.getElementById('img-message').value = txt;
                document.getElementById('img-msg-container').classList.remove('hidden');
                showToast("Revelado com sucesso!"); 
                addToHistory('Revelou texto de uma imagem', 'Imagem', 'Sucesso');
                endProgress();
            }
        } catch (e) { 
            endProgress();
            console.error(e);
            if(e.message === "DIGITEMSG") showToast("Digite a mensagem.", "error");
            else if(e.message === "DIGITEPWD") showToast("Defina a senha.", "error");
            else if(e.message === "CAPACITY") showToast("Imagem pequena demais para o texto.", "error");
            else {
                showToast("Falha: Senha ou dados incorretos.", "error"); 
                addToHistory(state.modes.img === 'encrypt' ? 'Falha ao esconder texto na imagem' : 'Falha ao revelar texto da imagem', 'Imagem', 'Falha');
            }
        }
    }, 50);
}

// --- UTILITÁRIOS FINAIS ---
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    const icon = type === 'success' ? 'check-circle' : 'alert-triangle';
    const color = type === 'success' ? 'text-[#10b981]' : 'text-red-500';
    toast.className = `toast-custom ${type}`;
    toast.innerHTML = `<i data-lucide="${icon}" class="${color} w-5 h-5" style="color: ${type === 'success' ? 'var(--cv-accent)' : 'var(--cv-danger)'}; width:20px;"></i><span style="font-size: 0.9rem; font-weight: 500;">${escapeHTML(message)}</span>`;
    container.appendChild(toast);
    lucide.createIcons();
    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 300); }, 3000);
}

function addToHistory(action, type, status) {
    const history = JSON.parse(localStorage.getItem('cv_logs') || '[]');
    const entry = { ts: new Date().toISOString(), act: action, typ: type, st: status };
    history.unshift(entry); if (history.length > 50) history.pop();
    localStorage.setItem('cv_logs', JSON.stringify(history)); 
    renderHistory();
}

function renderHistory() {
    const list = document.getElementById('history-list');
    const history = JSON.parse(localStorage.getItem('cv_logs') || '[]');
    if (history.length === 0) { list.innerHTML = '<p style="font-size:0.85rem; color:var(--cv-text-muted); text-align:center; padding:1rem 0;">Nenhuma atividade recente.</p>'; return; }
    list.innerHTML = history.map(item => {
        const time = new Date(item.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const color = item.st === 'Sucesso' ? 'color:#10b981;' : 'color:#f87171;';
        return `<div style="display:flex; flex-direction:column; gap:6px; border-left:2px solid var(--cv-border); padding-left:14px; margin-bottom:12px;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <span style="font-size:11px; font-weight:bold; color:var(--cv-text-muted); text-transform:uppercase;">${escapeHTML(item.typ)} • ${time}</span>
                <span style="font-size:10px; background:var(--cv-bg-input); padding:4px 8px; border-radius:4px; color:var(--cv-text-muted); border:1px solid var(--cv-border);">${escapeHTML(item.act)}</span>
            </div>
            <span style="font-size:0.85rem; font-family:var(--cv-font-code); ${color}">${escapeHTML(item.st)}</span>
        </div>`;
    }).join('');
}

function clearHistory() { localStorage.removeItem('cv_logs'); renderHistory(); showToast("Histórico limpo."); }

function toggleHistory() {
    const modal = document.getElementById('history-modal'); 
    if (modal.classList.contains('hidden')) { 
        modal.classList.remove('hidden'); 
        setTimeout(() => modal.classList.add('modal-active'), 10);
        renderHistory(); 
    } else { 
        modal.classList.remove('modal-active');
        setTimeout(() => modal.classList.add('hidden'), 300);
    }
}

function robustCopyToClipboard(text) {
    if (!text) return;
    const ta = document.createElement("textarea"); ta.value = text;
    ta.style.cssText = "position:fixed;top:0;left:0;opacity:0;";
    document.body.appendChild(ta); ta.focus(); ta.select();
    try { document.execCommand('copy'); showToast("Copiado com sucesso!"); }
    catch { if (navigator.clipboard) navigator.clipboard.writeText(text).then(() => showToast("Copiado!"), () => showToast("Erro ao copiar.", "error")); else showToast("Erro ao copiar.", "error"); }
    document.body.removeChild(ta);
}
window.copyToClipboard = (id) => robustCopyToClipboard(document.getElementById(id).innerText);

// --- TEMA (DARK/LIGHT) ---
function toggleTheme() {
    const html = document.documentElement;
    const themeIcon = document.getElementById('theme-icon');
    
    if (html.classList.contains('dark')) {
        html.classList.remove('dark');
        localStorage.setItem('theme', 'light');
        themeIcon.setAttribute('data-lucide', 'moon');
    } else {
        html.classList.add('dark');
        localStorage.setItem('theme', 'dark');
        themeIcon.setAttribute('data-lucide', 'sun');
    }
    lucide.createIcons();
}

document.addEventListener('DOMContentLoaded', () => {
    const themeIcon = document.getElementById('theme-icon');
    if (themeIcon) {
        if (document.documentElement.classList.contains('dark')) {
            themeIcon.setAttribute('data-lucide', 'sun');
        } else {
            themeIcon.setAttribute('data-lucide', 'moon');
        }
        lucide.createIcons();
    }
});