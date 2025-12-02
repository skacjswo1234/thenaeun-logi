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

// DOM 요소 (안전하게 가져오기)
function getElement(id) {
    const el = document.getElementById(id);
    if (!el) {
        console.warn(`Element with id "${id}" not found`);
    }
    return el;
}

const loadingEl = getElement('loading');
const contactsListEl = getElement('contactsList');
const paginationEl = getElement('pagination');
const statusFilterEl = getElement('statusFilter');
const searchInputEl = getElement('searchInput');
const contactModal = getElement('contactModal');
const closeModalBtn = getElement('closeModal');
const closeModalBtn2 = getElement('closeModalBtn');
const modalBodyEl = getElement('modalBody');
const markAsReadBtn = getElement('markAsReadBtn');
const markAsRepliedBtn = getElement('markAsRepliedBtn');
const deleteContactBtn = getElement('deleteContactBtn');
const toastEl = getElement('toast');
const menuToggleBtn = getElement('menuToggleBtn');
const sideMenu = getElement('sideMenu');
const sideMenuOverlay = getElement('sideMenuOverlay');
const sideMenuClose = getElement('sideMenuClose');
const sideMenuRefresh = getElement('sideMenuRefresh');
const sideMenuChangePassword = getElement('sideMenuChangePassword');
const sideMenuLogout = getElement('sideMenuLogout');

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
        if (status && status.trim() !== '') {
            url += `&status=${encodeURIComponent(status.trim())}`;
        }

        const data = await apiRequest(url);
        
        // API 응답 검증
        if (!data || typeof data !== 'object') {
            throw new Error('잘못된 API 응답입니다.');
        }
        
        // 클라이언트 사이드 검색 필터링
        let filteredContacts = Array.isArray(data.contacts) ? data.contacts : [];
        let pagination = data.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 };
        
        if (search && search.trim() !== '') {
            const searchLower = search.toLowerCase().trim();
            filteredContacts = filteredContacts.filter(contact => {
                if (!contact) return false;
                return (
                    (contact.name && contact.name.toLowerCase().includes(searchLower)) ||
                    (contact.phone && contact.phone.toLowerCase().includes(searchLower)) ||
                    (contact.message && contact.message.toLowerCase().includes(searchLower))
                );
            });
            
            // 검색 필터링이 적용된 경우 페이지네이션 조정
            if (filteredContacts.length === 0 && data.contacts && data.contacts.length > 0) {
                // 검색 결과가 없고 원본 데이터는 있는 경우
                pagination = {
                    ...pagination,
                    total: 0,
                    totalPages: 0
                };
            }
        }

        contactsData = filteredContacts;
        renderContacts(filteredContacts);
        renderPagination(pagination);
        await updateStats();
        
        showLoading(false);
    } catch (error) {
        showLoading(false);
        const errorMessage = error.message || '문의 목록을 불러오는 중 오류가 발생했습니다.';
        showToast(errorMessage, 'error');
        console.error('문의 조회 오류:', error);
        console.error('상태:', status, '검색:', search, '페이지:', page);
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
            <div class="contacts-list-empty">
                <p>문의 내역이 없습니다.</p>
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
    if (!paginationEl) {
        console.warn('페이지네이션 요소를 찾을 수 없습니다.');
        return;
    }
    
    if (!pagination || typeof pagination !== 'object') {
        paginationEl.innerHTML = '';
        return;
    }
    
    const totalPages = parseInt(pagination.totalPages) || 0;
    const page = parseInt(pagination.page) || 1;
    
    if (totalPages <= 1) {
        paginationEl.innerHTML = '';
        return;
    }
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

// 이벤트 리스너는 DOMContentLoaded에서 등록
let searchTimeout;

if (closeModalBtn) {
    closeModalBtn.addEventListener('click', closeContactModal);
}
if (closeModalBtn2) {
    closeModalBtn2.addEventListener('click', closeContactModal);
}

if (contactModal) {
    contactModal.addEventListener('click', (e) => {
        if (e.target === contactModal) {
            closeContactModal();
        }
    });
}

if (markAsReadBtn) {
    markAsReadBtn.addEventListener('click', () => {
        updateContactStatus('read');
    });
}

if (markAsRepliedBtn) {
    markAsRepliedBtn.addEventListener('click', () => {
        updateContactStatus('replied');
    });
}

if (deleteContactBtn) {
    deleteContactBtn.addEventListener('click', deleteContact);
}

// 페이지 전환
function switchPage(pageId) {
    // 모든 페이지 숨기기
    document.querySelectorAll('.page-content').forEach(page => {
        page.classList.remove('active');
    });
    
    // 선택한 페이지 표시
    const targetPage = document.getElementById(`page-${pageId}`);
    if (targetPage) {
        targetPage.classList.add('active');
    }
    
    // 네비게이션 활성화
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelectorAll(`[data-page="${pageId}"]`).forEach(item => {
        item.classList.add('active');
    });
    
    // 페이지 제목 업데이트
    const pageTitles = {
        'contacts': '문의 관리',
        'settings': '설정'
    };
    const pageTitleEl = document.getElementById('pageTitle');
    if (pageTitleEl) {
        pageTitleEl.textContent = pageTitles[pageId] || '관리자';
    }
    
    // 모바일 메뉴 닫기
    closeSideMenu();
    closeMobileSidebar();
}

// 모바일 사이드바 열기/닫기
function openMobileSidebar() {
    const sidebar = document.getElementById('adminSidebar');
    if (sidebar) {
        sidebar.classList.add('active');
    }
}

function closeMobileSidebar() {
    const sidebar = document.getElementById('adminSidebar');
    if (sidebar) {
        sidebar.classList.remove('active');
    }
}

// 사이드 메뉴 열기/닫기 (모바일 슬라이드 메뉴)
function openSideMenu() {
    const menu = document.getElementById('sideMenu');
    const overlay = document.getElementById('sideMenuOverlay');
    if (!menu || !overlay) {
        console.error('사이드 메뉴 요소를 찾을 수 없습니다.');
        return;
    }
    menu.classList.add('active');
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeSideMenu() {
    const menu = document.getElementById('sideMenu');
    const overlay = document.getElementById('sideMenuOverlay');
    if (!menu || !overlay) return;
    menu.classList.remove('active');
    overlay.classList.remove('active');
    document.body.style.overflow = '';
}

// 데스크탑/모바일 구분
function initMenuToggle() {
    const btn = document.getElementById('menuToggleBtn');
    if (!btn) {
        console.error('메뉴 토글 버튼을 찾을 수 없습니다.');
        return;
    }
    
    // 기존 이벤트 리스너 제거를 위해 클론 후 교체
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);
    const menuBtn = document.getElementById('menuToggleBtn');
    
    const isMobile = window.innerWidth <= 768;
    
    if (isMobile) {
        menuBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('모바일 메뉴 열기');
            openSideMenu();
        });
    } else {
        menuBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('데스크탑 사이드바 열기');
            openMobileSidebar();
        });
    }
}

// 사이드 메뉴 닫기 이벤트는 DOMContentLoaded에서 등록

// 네비게이션 클릭 이벤트 (DOMContentLoaded 후 실행)
function initNavigation() {
    document.querySelectorAll('.nav-item[data-page]').forEach(item => {
        item.addEventListener('click', () => {
            const pageId = item.dataset.page;
            switchPage(pageId);
        });
    });

    // 모바일 사이드 메뉴 클릭 이벤트
    document.querySelectorAll('.side-menu-item[data-page]').forEach(item => {
        item.addEventListener('click', () => {
            const pageId = item.dataset.page;
            switchPage(pageId);
        });
    });
}

// 사이드 메뉴 항목 클릭 (모바일)
if (sideMenuRefresh) {
    sideMenuRefresh.addEventListener('click', () => {
        fetchContacts(currentPage, currentStatus, currentSearch);
        closeSideMenu();
    });
}

if (sideMenuChangePassword) {
    sideMenuChangePassword.addEventListener('click', () => {
        switchPage('settings');
    });
}

// 로그아웃 함수
function handleLogout() {
    if (confirm('로그아웃 하시겠습니까?')) {
        localStorage.removeItem('adminLoggedIn');
        localStorage.removeItem('adminUsername');
        window.location.href = 'login.html';
    }
}

// ============================================
// 비밀번호 변경 기능
// ============================================

// 비밀번호 변경 모달 열기
function openPasswordModal() {
    const modal = document.getElementById('passwordModal');
    const usernameInput = document.getElementById('currentUsername');
    const errorEl = document.getElementById('passwordError');
    
    if (!modal) {
        console.error('비밀번호 변경 모달을 찾을 수 없습니다.');
        return;
    }
    
    // 사용자명 설정
    const username = localStorage.getItem('adminUsername') || 'admin';
    if (usernameInput) {
        usernameInput.value = username;
    }
    
    // 에러 메시지 숨기기
    if (errorEl) {
        errorEl.classList.remove('show');
        errorEl.textContent = '';
    }
    
    // 입력 필드 초기화
    const oldPasswordInput = document.getElementById('oldPassword');
    const newPasswordInput = document.getElementById('newPassword');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    
    if (oldPasswordInput) oldPasswordInput.value = '';
    if (newPasswordInput) newPasswordInput.value = '';
    if (confirmPasswordInput) confirmPasswordInput.value = '';
    
    // 모달 표시
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// 비밀번호 변경 모달 닫기
function closePasswordModal() {
    const modal = document.getElementById('passwordModal');
    const errorEl = document.getElementById('passwordError');
    
    if (modal) {
        modal.classList.remove('active');
    }
    
    if (errorEl) {
        errorEl.classList.remove('show');
        errorEl.textContent = '';
    }
    
    // 입력 필드 초기화
    const oldPasswordInput = document.getElementById('oldPassword');
    const newPasswordInput = document.getElementById('newPassword');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    
    if (oldPasswordInput) oldPasswordInput.value = '';
    if (newPasswordInput) newPasswordInput.value = '';
    if (confirmPasswordInput) confirmPasswordInput.value = '';
    
    document.body.style.overflow = '';
}

// 에러 메시지 표시
function showPasswordError(message) {
    const errorEl = document.getElementById('passwordError');
    if (errorEl) {
        errorEl.textContent = message;
        errorEl.classList.add('show');
    }
}

// 에러 메시지 숨기기
function hidePasswordError() {
    const errorEl = document.getElementById('passwordError');
    if (errorEl) {
        errorEl.classList.remove('show');
        errorEl.textContent = '';
    }
}

// 비밀번호 변경 실행
async function changePassword() {
    // 요소 가져오기
    const usernameInput = document.getElementById('currentUsername');
    const oldPasswordInput = document.getElementById('oldPassword');
    const newPasswordInput = document.getElementById('newPassword');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const submitBtn = document.getElementById('submitPasswordBtn');
    
    // 요소 확인
    if (!usernameInput || !oldPasswordInput || !newPasswordInput || !confirmPasswordInput) {
        console.error('비밀번호 변경 폼 요소를 찾을 수 없습니다.');
        return;
    }
    
    // 값 가져오기
    const username = usernameInput.value.trim();
    const oldPassword = oldPasswordInput.value.trim();
    const newPassword = newPasswordInput.value.trim();
    const confirmPassword = confirmPasswordInput.value.trim();
    
    // 에러 메시지 초기화
    hidePasswordError();
    
    // 입력 검증
    if (!oldPassword || !newPassword || !confirmPassword) {
        showPasswordError('모든 필드를 입력해주세요.');
        return;
    }
    
    if (newPassword.length < 4) {
        showPasswordError('새 비밀번호는 최소 4자 이상이어야 합니다.');
        return;
    }
    
    if (newPassword !== confirmPassword) {
        showPasswordError('새 비밀번호가 일치하지 않습니다.');
        return;
    }
    
    if (oldPassword === newPassword) {
        showPasswordError('새 비밀번호는 현재 비밀번호와 달라야 합니다.');
        return;
    }
    
    // 버튼 비활성화
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = '변경 중...';
    }
    
    try {
        const response = await apiRequest('/auth/change-password', {
            method: 'POST',
            body: JSON.stringify({
                username,
                oldPassword,
                newPassword,
            }),
        });
        
        showToast('비밀번호가 성공적으로 변경되었습니다.', 'success');
        closePasswordModal();
    } catch (error) {
        // 에러 메시지 표시 (API에서 오는 에러 메시지 사용)
        const errorMessage = error.message || '비밀번호 변경 중 오류가 발생했습니다.';
        showPasswordError(errorMessage);
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = '변경';
        }
    }
}

// ============================================
// 키보드 이벤트 (ESC로 모달 닫기)
// ============================================
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const passwordModal = document.getElementById('passwordModal');
        const contactModal = document.getElementById('contactModal');
        
        if (passwordModal && passwordModal.classList.contains('active')) {
            closePasswordModal();
        }
        if (contactModal && contactModal.classList.contains('active')) {
            closeContactModal();
        }
    }
});

// ============================================
// 초기화
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    // 메뉴 토글 초기화
    initMenuToggle();
    
    // 네비게이션 초기화
    initNavigation();
    
    // 사이드 메뉴 닫기 이벤트
    const sideMenuCloseEl = document.getElementById('sideMenuClose');
    const sideMenuOverlayEl = document.getElementById('sideMenuOverlay');
    if (sideMenuCloseEl) {
        sideMenuCloseEl.addEventListener('click', closeSideMenu);
    }
    if (sideMenuOverlayEl) {
        sideMenuOverlayEl.addEventListener('click', closeSideMenu);
    }
    
    // 로그아웃 이벤트
    const sideMenuLogoutEl = document.getElementById('sideMenuLogout');
    const sidebarLogoutEl = document.getElementById('sidebarLogout');
    
    if (sideMenuLogoutEl) {
        sideMenuLogoutEl.addEventListener('click', () => {
            closeSideMenu();
            handleLogout();
        });
    }
    
    if (sidebarLogoutEl) {
        sidebarLogoutEl.addEventListener('click', handleLogout);
    }
    
    // 비밀번호 변경 관련 이벤트 리스너
    const passwordModal = document.getElementById('passwordModal');
    const closePasswordModalBtn = document.getElementById('closePasswordModal');
    const cancelPasswordBtn = document.getElementById('cancelPasswordBtn');
    const submitPasswordBtn = document.getElementById('submitPasswordBtn');
    const settingsChangePasswordBtn = document.getElementById('settingsChangePassword');
    
    // 모달 닫기 버튼
    if (closePasswordModalBtn) {
        closePasswordModalBtn.addEventListener('click', closePasswordModal);
    }
    
    if (cancelPasswordBtn) {
        cancelPasswordBtn.addEventListener('click', closePasswordModal);
    }
    
    // 모달 외부 클릭 시 닫기
    if (passwordModal) {
        passwordModal.addEventListener('click', (e) => {
            if (e.target === passwordModal) {
                closePasswordModal();
            }
        });
    }
    
    // 변경 버튼 클릭 이벤트
    if (submitPasswordBtn) {
        submitPasswordBtn.addEventListener('click', changePassword);
    }
    
    // Enter 키로 비밀번호 변경 (비밀번호 입력 필드에서)
    const oldPasswordInput = document.getElementById('oldPassword');
    const newPasswordInput = document.getElementById('newPassword');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    
    if (oldPasswordInput) {
        oldPasswordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                changePassword();
            }
        });
    }
    
    if (newPasswordInput) {
        newPasswordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                changePassword();
            }
        });
    }
    
    if (confirmPasswordInput) {
        confirmPasswordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                changePassword();
            }
        });
    }
    
    // 설정 페이지의 비밀번호 변경 버튼
    if (settingsChangePasswordBtn) {
        settingsChangePasswordBtn.addEventListener('click', openPasswordModal);
    }
    
    // 사이드 메뉴의 비밀번호 변경 버튼
    if (sideMenuChangePassword) {
        sideMenuChangePassword.addEventListener('click', () => {
            switchPage('settings');
            setTimeout(() => {
                openPasswordModal();
            }, 100);
        });
    }
    
    
    // 상태 필터 이벤트 리스너
    const statusFilterEl = document.getElementById('statusFilter');
    if (statusFilterEl) {
        statusFilterEl.addEventListener('change', (e) => {
            currentStatus = e.target.value;
            currentPage = 1;
            fetchContacts(currentPage, currentStatus, currentSearch);
        });
    }
    
    // 검색 필터 이벤트 리스너
    const searchInputEl = document.getElementById('searchInput');
    if (searchInputEl) {
        searchInputEl.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                currentSearch = e.target.value;
                currentPage = 1;
                fetchContacts(currentPage, currentStatus, currentSearch);
            }, 500);
        });
    }
    
    // 문의 목록 로드
    fetchContacts(currentPage, currentStatus, currentSearch);
    
    // 윈도우 리사이즈 이벤트 (모바일/데스크탑 전환 시)
    window.addEventListener('resize', () => {
        initMenuToggle();
    });
});

