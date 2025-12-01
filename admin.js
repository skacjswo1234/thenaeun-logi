// API 기본 URL
const API_BASE_URL = window.API_BASE_URL || '/api';

// 로그인 체크
if (localStorage.getItem('adminLoggedIn') !== 'true') {
    window.location.href = 'login.html';
}

// 전역 상태
let currentPage = 1;
let currentStatus = '';
let currentSearch = '';
let currentContactId = null;
let contactsData = [];

// DOM 요소
const loadingEl = document.getElementById('loading');
const contactsListEl = document.getElementById('contactsList');
const paginationEl = document.getElementById('pagination');
const statusFilterEl = document.getElementById('statusFilter');
const searchInputEl = document.getElementById('searchInput');
const refreshBtn = document.getElementById('refreshBtn');
const contactModal = document.getElementById('contactModal');
const closeModalBtn = document.getElementById('closeModal');
const closeModalBtn2 = document.getElementById('closeModalBtn');
const modalBodyEl = document.getElementById('modalBody');
const markAsReadBtn = document.getElementById('markAsReadBtn');
const markAsRepliedBtn = document.getElementById('markAsRepliedBtn');
const deleteContactBtn = document.getElementById('deleteContactBtn');
const toastEl = document.getElementById('toast');
const logoutBtn = document.getElementById('logoutBtn');
const changePasswordBtn = document.getElementById('changePasswordBtn');
const passwordModal = document.getElementById('passwordModal');
const menuToggleBtn = document.getElementById('menuToggleBtn');
const sideMenu = document.getElementById('sideMenu');
const sideMenuOverlay = document.getElementById('sideMenuOverlay');
const sideMenuClose = document.getElementById('sideMenuClose');
const sideMenuRefresh = document.getElementById('sideMenuRefresh');
const sideMenuChangePassword = document.getElementById('sideMenuChangePassword');
const sideMenuLogout = document.getElementById('sideMenuLogout');
const closePasswordModal = document.getElementById('closePasswordModal');
const cancelPasswordBtn = document.getElementById('cancelPasswordBtn');
const submitPasswordBtn = document.getElementById('submitPasswordBtn');
const changePasswordForm = document.getElementById('changePasswordForm');
const passwordError = document.getElementById('passwordError');
const currentUsername = document.getElementById('currentUsername');

// 통계 요소
const totalCountEl = document.getElementById('totalCount');
const newCountEl = document.getElementById('newCount');
const readCountEl = document.getElementById('readCount');
const repliedCountEl = document.getElementById('repliedCount');

// API 요청 헬퍼
async function apiRequest(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
            ...options,
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'API 요청 실패');
        }

        return data;
    } catch (error) {
        console.error('API 요청 오류:', error);
        throw error;
    }
}

// 문의 목록 조회
async function fetchContacts(page = 1, status = '', search = '') {
    try {
        showLoading(true);
        
        let url = `/admin/contacts?page=${page}&limit=20`;
        if (status) {
            url += `&status=${status}`;
        }

        const data = await apiRequest(url);
        
        // 클라이언트 사이드 검색 필터링
        let filteredContacts = data.contacts || [];
        if (search) {
            const searchLower = search.toLowerCase();
            filteredContacts = filteredContacts.filter(contact => 
                contact.name?.toLowerCase().includes(searchLower) ||
                contact.phone?.toLowerCase().includes(searchLower) ||
                contact.message?.toLowerCase().includes(searchLower)
            );
        }

        contactsData = filteredContacts;
        renderContacts(filteredContacts);
        renderPagination(data.pagination);
        await updateStats();
        
        showLoading(false);
    } catch (error) {
        showLoading(false);
        showToast('문의 목록을 불러오는 중 오류가 발생했습니다.', 'error');
        console.error('문의 조회 오류:', error);
    }
}

// 통계 업데이트
async function updateStats() {
    try {
        const allData = await apiRequest('/admin/contacts?limit=1000');
        const contacts = allData.contacts || [];
        
        const stats = {
            total: contacts.length,
            new: contacts.filter(c => c.status === 'new').length,
            read: contacts.filter(c => c.status === 'read').length,
            replied: contacts.filter(c => c.status === 'replied').length,
        };

        totalCountEl.textContent = stats.total;
        newCountEl.textContent = stats.new;
        readCountEl.textContent = stats.read;
        repliedCountEl.textContent = stats.replied;
    } catch (error) {
        console.error('통계 업데이트 오류:', error);
    }
}

// 문의 목록 렌더링
function renderContacts(contacts) {
    if (contacts.length === 0) {
        contactsListEl.innerHTML = `
            <div style="text-align: center; padding: 60px 20px; background: white; border-radius: 8px;">
                <p style="color: #999; font-size: 16px;">문의 내역이 없습니다.</p>
            </div>
        `;
        return;
    }

    contactsListEl.innerHTML = contacts.map(contact => `
        <div class="contact-item status-${contact.status}" data-id="${contact.id}">
            <div class="contact-header">
                <div>
                    <div class="contact-name">${escapeHtml(contact.name)}</div>
                    <div class="contact-meta">
                        <span>연락처: ${escapeHtml(contact.phone || '-')}</span>
                        <span>나이: ${contact.age || '-'}세</span>
                        <span class="contact-status status-${contact.status}">
                            ${getStatusText(contact.status)}
                        </span>
                    </div>
                </div>
            </div>
            <div class="contact-message">${escapeHtml(contact.message)}</div>
            <div class="contact-date">${formatDate(contact.created_at)}</div>
        </div>
    `).join('');

    // 클릭 이벤트 리스너 추가
    contactsListEl.querySelectorAll('.contact-item').forEach(item => {
        item.addEventListener('click', () => {
            const id = parseInt(item.dataset.id);
            openContactModal(id);
        });
    });
}

// 페이지네이션 렌더링
function renderPagination(pagination) {
    if (!pagination || pagination.totalPages <= 1) {
        paginationEl.innerHTML = '';
        return;
    }

    const { page, totalPages } = pagination;
    let html = '';

    // 이전 버튼
    html += `
        <button class="pagination-btn" ${page === 1 ? 'disabled' : ''} data-page="${page - 1}">
            이전
        </button>
    `;

    // 페이지 번호 버튼
    const startPage = Math.max(1, page - 2);
    const endPage = Math.min(totalPages, page + 2);

    if (startPage > 1) {
        html += `<button class="pagination-btn" data-page="1">1</button>`;
        if (startPage > 2) {
            html += `<span style="padding: 8px;">...</span>`;
        }
    }

    for (let i = startPage; i <= endPage; i++) {
        html += `
            <button class="pagination-btn ${i === page ? 'active' : ''}" data-page="${i}">
                ${i}
            </button>
        `;
    }

    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            html += `<span style="padding: 8px;">...</span>`;
        }
        html += `<button class="pagination-btn" data-page="${totalPages}">${totalPages}</button>`;
    }

    // 다음 버튼
    html += `
        <button class="pagination-btn" ${page === totalPages ? 'disabled' : ''} data-page="${page + 1}">
            다음
        </button>
    `;

    paginationEl.innerHTML = html;

    // 페이지네이션 버튼 이벤트 리스너
    paginationEl.querySelectorAll('.pagination-btn').forEach(btn => {
        if (!btn.disabled) {
            btn.addEventListener('click', () => {
                const page = parseInt(btn.dataset.page);
                currentPage = page;
                fetchContacts(page, currentStatus, currentSearch);
            });
        }
    });
}

// 문의 상세 모달 열기
async function openContactModal(id) {
    try {
        showLoading(true);
        const contact = await apiRequest(`/admin/contacts/${id}`);
        currentContactId = id;

        modalBodyEl.innerHTML = `
            <div class="modal-detail">
                <div class="modal-detail-label">이름</div>
                <div class="modal-detail-value">${escapeHtml(contact.name)}</div>
            </div>
            <div class="modal-detail">
                <div class="modal-detail-label">연락처</div>
                <div class="modal-detail-value">${escapeHtml(contact.phone || '-')}</div>
            </div>
            <div class="modal-detail">
                <div class="modal-detail-label">나이</div>
                <div class="modal-detail-value">${contact.age || '-'}세</div>
            </div>
            <div class="modal-detail">
                <div class="modal-detail-label">상태</div>
                <div class="modal-detail-value">
                    <span class="contact-status status-${contact.status}">
                        ${getStatusText(contact.status)}
                    </span>
                </div>
            </div>
            <div class="modal-detail">
                <div class="modal-detail-label">문의내용</div>
                <div class="modal-detail-value message">${escapeHtml(contact.message)}</div>
            </div>
            <div class="modal-detail">
                <div class="modal-detail-label">등록일시</div>
                <div class="modal-detail-value">${formatDate(contact.created_at)}</div>
            </div>
            <div class="modal-detail">
                <div class="modal-detail-label">수정일시</div>
                <div class="modal-detail-value">${formatDate(contact.updated_at)}</div>
            </div>
        `;

        // 상태에 따라 버튼 표시/숨김
        if (contact.status === 'new') {
            markAsReadBtn.style.display = 'inline-block';
            markAsRepliedBtn.style.display = 'inline-block';
        } else if (contact.status === 'read') {
            markAsReadBtn.style.display = 'none';
            markAsRepliedBtn.style.display = 'inline-block';
        } else {
            markAsReadBtn.style.display = 'none';
            markAsRepliedBtn.style.display = 'none';
        }

        contactModal.classList.add('active');
        showLoading(false);
    } catch (error) {
        showLoading(false);
        showToast('문의 정보를 불러오는 중 오류가 발생했습니다.', 'error');
        console.error('문의 조회 오류:', error);
    }
}

// 모달 닫기
function closeContactModal() {
    contactModal.classList.remove('active');
    currentContactId = null;
}

// 상태 업데이트
async function updateContactStatus(status) {
    if (!currentContactId) return;

    try {
        await apiRequest(`/admin/contacts/${currentContactId}`, {
            method: 'PUT',
            body: JSON.stringify({ status }),
        });

        showToast('상태가 업데이트되었습니다.', 'success');
        closeContactModal();
        fetchContacts(currentPage, currentStatus, currentSearch);
        updateStats();
    } catch (error) {
        showToast('상태 업데이트 중 오류가 발생했습니다.', 'error');
        console.error('상태 업데이트 오류:', error);
    }
}

// 문의 삭제
async function deleteContact() {
    if (!currentContactId) return;

    if (!confirm('정말 이 문의를 삭제하시겠습니까?')) {
        return;
    }

    try {
        await apiRequest(`/admin/contacts/${currentContactId}`, {
            method: 'DELETE',
        });

        showToast('문의가 삭제되었습니다.', 'success');
        closeContactModal();
        fetchContacts(currentPage, currentStatus, currentSearch);
        updateStats();
    } catch (error) {
        showToast('문의 삭제 중 오류가 발생했습니다.', 'error');
        console.error('문의 삭제 오류:', error);
    }
}

// 유틸리티 함수
function showLoading(show) {
    loadingEl.classList.toggle('active', show);
    contactsListEl.style.display = show ? 'none' : 'grid';
    paginationEl.style.display = show ? 'none' : 'flex';
}

function showToast(message, type = '') {
    toastEl.textContent = message;
    toastEl.className = `toast ${type} active`;
    
    setTimeout(() => {
        toastEl.classList.remove('active');
    }, 3000);
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function getStatusText(status) {
    const statusMap = {
        'new': '신규',
        'read': '읽음',
        'replied': '답변완료',
    };
    return statusMap[status] || status;
}

// 이벤트 리스너
refreshBtn.addEventListener('click', () => {
    fetchContacts(currentPage, currentStatus, currentSearch);
});

statusFilterEl.addEventListener('change', (e) => {
    currentStatus = e.target.value;
    currentPage = 1;
    fetchContacts(currentPage, currentStatus, currentSearch);
});

let searchTimeout;
searchInputEl.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        currentSearch = e.target.value;
        currentPage = 1;
        fetchContacts(currentPage, currentStatus, currentSearch);
    }, 500);
});

closeModalBtn.addEventListener('click', closeContactModal);
closeModalBtn2.addEventListener('click', closeContactModal);

contactModal.addEventListener('click', (e) => {
    if (e.target === contactModal) {
        closeContactModal();
    }
});

markAsReadBtn.addEventListener('click', () => {
    updateContactStatus('read');
});

markAsRepliedBtn.addEventListener('click', () => {
    updateContactStatus('replied');
});

deleteContactBtn.addEventListener('click', deleteContact);

// 사이드 메뉴 열기/닫기
function openSideMenu() {
    sideMenu.classList.add('active');
    sideMenuOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeSideMenu() {
    sideMenu.classList.remove('active');
    sideMenuOverlay.classList.remove('active');
    document.body.style.overflow = '';
}

menuToggleBtn.addEventListener('click', openSideMenu);
sideMenuClose.addEventListener('click', closeSideMenu);
sideMenuOverlay.addEventListener('click', closeSideMenu);

// 사이드 메뉴 항목 클릭
sideMenuRefresh.addEventListener('click', () => {
    fetchContacts(currentPage, currentStatus, currentSearch);
    closeSideMenu();
});

sideMenuChangePassword.addEventListener('click', () => {
    const username = localStorage.getItem('adminUsername') || 'admin';
    currentUsername.value = username;
    passwordError.classList.remove('show');
    changePasswordForm.reset();
    passwordModal.classList.add('active');
    closeSideMenu();
});

sideMenuLogout.addEventListener('click', () => {
    closeSideMenu();
    if (confirm('로그아웃 하시겠습니까?')) {
        localStorage.removeItem('adminLoggedIn');
        localStorage.removeItem('adminUsername');
        window.location.href = 'login.html';
    }
});

// 로그아웃
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        if (confirm('로그아웃 하시겠습니까?')) {
            localStorage.removeItem('adminLoggedIn');
            localStorage.removeItem('adminUsername');
            window.location.href = 'login.html';
        }
    });
}

// 비밀번호 변경 모달 열기
function openPasswordModal() {
    const username = localStorage.getItem('adminUsername') || 'admin';
    currentUsername.value = username;
    passwordError.classList.remove('show');
    changePasswordForm.reset();
    passwordModal.classList.add('active');
}

if (changePasswordBtn) {
    changePasswordBtn.addEventListener('click', openPasswordModal);
}

// 비밀번호 변경 모달 닫기
closePasswordModal.addEventListener('click', closePasswordModalFunc);
cancelPasswordBtn.addEventListener('click', closePasswordModalFunc);

passwordModal.addEventListener('click', (e) => {
    if (e.target === passwordModal) {
        closePasswordModalFunc();
    }
});

function closePasswordModalFunc() {
    passwordModal.classList.remove('active');
    passwordError.classList.remove('show');
    changePasswordForm.reset();
}

// 비밀번호 변경 폼 제출
changePasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = currentUsername.value;
    const oldPassword = document.getElementById('oldPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    passwordError.classList.remove('show');

    // 비밀번호 확인 검증
    if (newPassword !== confirmPassword) {
        passwordError.textContent = '새 비밀번호가 일치하지 않습니다.';
        passwordError.classList.add('show');
        return;
    }

    if (newPassword.length < 4) {
        passwordError.textContent = '새 비밀번호는 최소 4자 이상이어야 합니다.';
        passwordError.classList.add('show');
        return;
    }

    submitPasswordBtn.disabled = true;
    submitPasswordBtn.textContent = '변경 중...';

    try {
        const data = await apiRequest('/auth/change-password', {
            method: 'POST',
            body: JSON.stringify({
                username,
                oldPassword,
                newPassword,
            }),
        });

        showToast('비밀번호가 변경되었습니다.', 'success');
        closePasswordModalFunc();
    } catch (error) {
        passwordError.textContent = error.message || '비밀번호 변경 중 오류가 발생했습니다.';
        passwordError.classList.add('show');
    } finally {
        submitPasswordBtn.disabled = false;
        submitPasswordBtn.textContent = '변경';
    }
});

// 키보드 이벤트 (ESC로 모달 닫기)
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if (passwordModal.classList.contains('active')) {
            closePasswordModalFunc();
        }
        if (contactModal.classList.contains('active')) {
            closeContactModal();
        }
    }
});

// 초기 로드
document.addEventListener('DOMContentLoaded', () => {
    fetchContacts(currentPage, currentStatus, currentSearch);
});

