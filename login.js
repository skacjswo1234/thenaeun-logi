// 로그인 처리
const API_BASE_URL = window.API_BASE_URL || '/api';

const loginForm = document.getElementById('loginForm');
const loginBtn = document.getElementById('loginBtn');
const errorMessage = document.getElementById('errorMessage');

// 이미 로그인된 경우 관리자 화면으로 리다이렉트
if (localStorage.getItem('adminLoggedIn') === 'true') {
    window.location.href = 'admin.html';
}

// 로그인 폼 제출
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const password = document.getElementById('password').value;

    // 에러 메시지 숨기기
    hideError();

    // 버튼 비활성화
    loginBtn.disabled = true;
    loginBtn.textContent = '로그인 중...';

    try {
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ password }),
            });

        const data = await response.json();

        if (response.ok) {
            // 로그인 성공
            localStorage.setItem('adminLoggedIn', 'true');
            localStorage.setItem('adminUsername', data.user.username);
            
            // 관리자 화면으로 이동
            window.location.href = 'admin.html';
        } else {
            // 로그인 실패
            showError(data.error || '로그인에 실패했습니다.');
            loginBtn.disabled = false;
            loginBtn.textContent = '로그인';
        }
    } catch (error) {
        console.error('로그인 오류:', error);
        showError('로그인 중 오류가 발생했습니다. 다시 시도해주세요.');
        loginBtn.disabled = false;
        loginBtn.textContent = '로그인';
    }
});

function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.add('show');
}

function hideError() {
    errorMessage.classList.remove('show');
}

