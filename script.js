// ============================================
// 모바일 메뉴 관리
// ============================================
const menuToggle = document.querySelector('.menu-toggle');
const menuClose = document.querySelector('.menu-close');
const mobileMenu = document.querySelector('.mobile-menu');
const mobileMenuOverlay = document.querySelector('.mobile-menu-overlay');
const mobileNavLinks = document.querySelectorAll('.mobile-nav-list a');

function openMenu() {
    mobileMenu.classList.add('active');
    mobileMenuOverlay.classList.add('active');
    document.body.classList.add('menu-open');
    document.body.style.overflow = 'hidden';
}

function closeMenu() {
    mobileMenu.classList.remove('active');
    mobileMenuOverlay.classList.remove('active');
    document.body.classList.remove('menu-open');
    document.body.style.overflow = '';
}

if (menuToggle) menuToggle.addEventListener('click', openMenu);
if (menuClose) menuClose.addEventListener('click', closeMenu);
if (mobileMenuOverlay) mobileMenuOverlay.addEventListener('click', closeMenu);
mobileNavLinks.forEach(link => {
    link.addEventListener('click', closeMenu);
});

// ============================================
// 타이핑 효과 유틸리티
// ============================================

/**
 * 텍스트에서 하이라이트할 단어의 위치를 찾습니다
 * @param {string} text - 원본 텍스트
 * @param {string} highlightText - 하이라이트할 텍스트
 * @returns {Object} {start: number, end: number} 또는 null
 */
function findHighlightPosition(text, highlightText) {
    if (!highlightText) return null;
    
    // <br> 태그를 제외한 실제 텍스트
    const textWithoutBr = text.replace(/<br>/g, '');
    
    // 직접 찾기
    let highlightIndex = textWithoutBr.indexOf(highlightText);
    
    // 따옴표로 감싸진 경우 ("노후 불안")
    if (highlightIndex === -1) {
        const quotedText = `"${highlightText}"`;
        const quotedIndex = textWithoutBr.indexOf(quotedText);
        if (quotedIndex !== -1) {
            highlightIndex = quotedIndex + 1; // 따옴표 다음부터
        }
    }
    
    if (highlightIndex === -1) return null;
    
    // 원본 텍스트에서 실제 위치 계산
    let actualStart = 0;
    let textIndex = 0;
    
    // 시작 위치 찾기
    while (actualStart < text.length && textIndex < highlightIndex) {
        if (text.substring(actualStart, actualStart + 4) === '<br>') {
            actualStart += 4;
        } else {
            actualStart++;
            textIndex++;
        }
    }
    
    // 끝 위치 찾기
    let actualEnd = actualStart;
    let endTextIndex = 0;
    while (actualEnd < text.length && endTextIndex < highlightText.length) {
        if (text.substring(actualEnd, actualEnd + 4) === '<br>') {
            actualEnd += 4;
        } else {
            actualEnd++;
            endTextIndex++;
        }
    }
    
    return { start: actualStart, end: actualEnd };
}

/**
 * 타이핑 효과 함수
 * @param {HTMLElement} element - 텍스트를 표시할 요소
 * @param {string} text - 타이핑할 텍스트
 * @param {number} speed - 타이핑 속도 (ms)
 * @param {Function} callback - 완료 콜백
 * @param {string} highlightText - 하이라이트할 텍스트
 * @param {string} highlightClass - 하이라이트 클래스명
 */
function typeWriter(element, text, speed = 50, callback = null, highlightText = null, highlightClass = 'highlight-red') {
    if (!element || !text) return;
    
    let i = 0;
    let inHighlight = false;
    const highlightPos = findHighlightPosition(text, highlightText);
    
    function type() {
        if (i >= text.length) {
            // 텍스트 끝에 하이라이트가 열려있으면 닫기
            if (inHighlight) {
                element.innerHTML += `</span>`;
            }
            if (callback) callback();
            return;
        }
        
        // <br> 태그 처리
        if (text.substring(i, i + 4) === '<br>') {
            element.innerHTML += '<br>';
            i += 4;
        } else {
            // 하이라이트 시작
            if (highlightPos && i === highlightPos.start && !inHighlight) {
                element.innerHTML += `<span class="${highlightClass}">`;
                inHighlight = true;
            }
            
            // 문자 추가
            element.innerHTML += text.charAt(i);
            i++;
            
            // 하이라이트 끝
            if (highlightPos && i === highlightPos.end && inHighlight) {
                element.innerHTML += '</span>';
                inHighlight = false;
            }
        }
        
        setTimeout(type, speed);
    }
    
    type();
}

/**
 * 타이핑 완료 후 특정 단어들에 하이라이트 적용
 * @param {HTMLElement} element - 텍스트 요소
 * @param {Array<string>} words - 하이라이트할 단어 배열
 * @param {string} highlightClass - 하이라이트 클래스명
 */
function applyHighlightAfterTyping(element, words, highlightClass = 'highlight-accent') {
    if (!element || !words || words.length === 0) return;
    
    let html = element.innerHTML;
    words.forEach(word => {
        // 단어를 찾아서 span으로 감싸기 (이미 감싸진 경우 제외)
        const regex = new RegExp(`(${word})(?![^<]*</span>)`, 'g');
        html = html.replace(regex, `<span class="${highlightClass}">$1</span>`);
    });
    element.innerHTML = html;
}

/**
 * 삭제 효과 함수
 * @param {HTMLElement} element - 텍스트를 삭제할 요소
 * @param {number} speed - 삭제 속도 (ms)
 * @param {Function} callback - 완료 콜백
 */
function deleteText(element, speed = 30, callback = null) {
    if (!element) return;
    
    function deleteChar() {
        const currentText = element.innerHTML;
        if (currentText.length === 0) {
            if (callback) callback();
            return;
        }
        
        // HTML 태그 처리
        if (currentText.endsWith('</span>')) {
            element.innerHTML = currentText.slice(0, -7);
        } else if (currentText.endsWith('<span class="highlight-red">') || 
                   currentText.endsWith('<span class="highlight-orange">')) {
            element.innerHTML = currentText.slice(0, -29);
        } else if (currentText.endsWith('<br>')) {
            element.innerHTML = currentText.slice(0, -4);
        } else {
            element.innerHTML = currentText.slice(0, -1);
        }
        
        setTimeout(deleteChar, speed);
    }
    
    deleteChar();
}

// ============================================
// 빨간 텍스트 애니메이션
// ============================================
function startRedTextAnimation() {
    const redTextElement = document.querySelector('.red-typing-text');
    if (!redTextElement) return;
    
    const texts = [
        '월급은 그대로인데 물가는 미쳐 날뛰고',
        '정년은 다가오는데 미래는 깜깜하고',
        '갑자기 해고되는 건 뉴스 속 일이 아니라 당신 일이 될 수도 있습니다.',
        '대한민국 직장인 10명 중 8명은 "노후 불안"'
    ];
    
    let currentIndex = 0;
    
    function animateText() {
        if (currentIndex >= texts.length) return;
        
        const text = texts[currentIndex];
        redTextElement.classList.remove('final-text');
        
        // 첫 번째 줄이 아니면 줄바꿈 추가
        if (currentIndex > 0) {
            redTextElement.innerHTML += '<br>';
        }
        
        // 각 줄을 타이핑하고 완료 후 다음 줄로 진행 (삭제하지 않음)
        typeWriter(redTextElement, text, 40, () => {
            // 마지막 텍스트인 경우 "노후 불안" 하이라이트 적용
            if (currentIndex === texts.length - 1) {
                setTimeout(() => {
                    applyHighlightToText(redTextElement, '노후 불안', 'highlight-orange');
                    redTextElement.classList.add('final-text');
                }, 100);
            }
            
            // 타이핑 완료 후 잠시 대기
            setTimeout(() => {
                currentIndex++;
                if (currentIndex < texts.length) {
                    setTimeout(animateText, 500);
                }
            }, 1000);
        });
    }
    
    // 애니메이션 시작
    animateText();
}

/**
 * 타이핑 완료 후 특정 텍스트에 하이라이트 적용
 * @param {HTMLElement} element - 텍스트 요소
 * @param {string} highlightText - 하이라이트할 텍스트
 * @param {string} highlightClass - 하이라이트 클래스명
 */
function applyHighlightToText(element, highlightText, highlightClass = 'highlight-orange') {
    if (!element || !highlightText) return;
    
    let html = element.innerHTML;
    
    // "노후 불안" 찾기 (따옴표 안에 있는 경우)
    const text = html.replace(/<[^>]*>/g, ''); // HTML 태그 제거한 순수 텍스트
    const index = text.indexOf(highlightText);
    
    if (index !== -1) {
        // HTML 태그를 고려하여 실제 위치 찾기
        let textIndex = 0;
        let htmlIndex = 0;
        
        while (htmlIndex < html.length && textIndex < index) {
            if (html.substring(htmlIndex, htmlIndex + 4) === '<br>') {
                htmlIndex += 4;
            } else if (html.substring(htmlIndex, htmlIndex + 1) === '<') {
                // HTML 태그 건너뛰기
                const tagEnd = html.indexOf('>', htmlIndex);
                if (tagEnd !== -1) {
                    htmlIndex = tagEnd + 1;
                } else {
                    htmlIndex++;
                }
            } else {
                htmlIndex++;
                textIndex++;
            }
        }
        
        // highlightText 길이만큼 찾기
        let endHtmlIndex = htmlIndex;
        let endTextIndex = 0;
        
        while (endHtmlIndex < html.length && endTextIndex < highlightText.length) {
            if (html.substring(endHtmlIndex, endHtmlIndex + 4) === '<br>') {
                endHtmlIndex += 4;
            } else if (html.substring(endHtmlIndex, endHtmlIndex + 1) === '<') {
                const tagEnd = html.indexOf('>', endHtmlIndex);
                if (tagEnd !== -1) {
                    endHtmlIndex = tagEnd + 1;
                } else {
                    endHtmlIndex++;
                }
            } else {
                endHtmlIndex++;
                endTextIndex++;
            }
        }
        
        // 하이라이트 적용
        const before = html.substring(0, htmlIndex);
        const highlight = html.substring(htmlIndex, endHtmlIndex);
        const after = html.substring(endHtmlIndex);
        
        element.innerHTML = before + `<span class="${highlightClass}">${highlight}</span>` + after;
    }
}

// ============================================
// 히어로 텍스트 애니메이션 초기화
// ============================================
function initHeroTextAnimation() {
    const mainCopy = document.querySelector('.hero-main-copy .typing-text');
    
    if (!mainCopy) return;
    
    const mainText = mainCopy.getAttribute('data-text');
    
    // 초기 텍스트 비우기
    mainCopy.innerHTML = '';
    
    // 첫 번째 텍스트 타이핑 시작
    typeWriter(mainCopy, mainText, 60, () => {
        // 타이핑 완료 후 강조 단어에 색상 적용
        applyHighlightAfterTyping(mainCopy, ['83세', '은퇴'], 'highlight-accent');
    });
}

// ============================================
// 스크롤 감지로 빨간 텍스트 애니메이션 시작
// ============================================
function initRedTextSectionObserver() {
    const redTextSection = document.querySelector('.red-text-section');
    if (!redTextSection) return;
    
    let animationStarted = false;
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !animationStarted) {
                animationStarted = true;
                startRedTextAnimation();
            }
        });
    }, {
        threshold: 0.3
    });
    
    observer.observe(redTextSection);
}

// ============================================
// 부드러운 스크롤
// ============================================
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// ============================================
// 히어로 배경 영상 제어 (두 번째 섹션까지만 표시)
// ============================================
function initHeroBackgroundControl() {
    const heroBgs = document.querySelectorAll('.hero-bg');
    const servicesSection = document.querySelector('.services-section');
    
    if (!heroBgs.length || !servicesSection) return;
    
    function updateHeroBg() {
        const servicesSectionTop = servicesSection.offsetTop;
        const scrollPosition = window.scrollY;
        
        // 서비스 섹션이 시작되면 히어로 배경 숨기기
        heroBgs.forEach(heroBg => {
            if (scrollPosition >= servicesSectionTop - 100) {
                heroBg.style.opacity = '0';
                heroBg.style.pointerEvents = 'none';
            } else {
                heroBg.style.opacity = '1';
                heroBg.style.pointerEvents = 'none';
            }
        });
    }
    
    // 스크롤 이벤트 리스너
    window.addEventListener('scroll', updateHeroBg);
    window.addEventListener('resize', updateHeroBg);
    
    // 초기 상태 설정
    updateHeroBg();
}

// ============================================
// 헤더 스크롤 효과
// ============================================
function initHeaderScroll() {
    const header = document.querySelector('.header');
    const navList = document.querySelector('.nav-list');
    if (!header) return;
    
    function updateHeader() {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    }
    
    // 네비게이션 항목 호버 시 헤더 배경 변경
    if (navList) {
        const navLinks = navList.querySelectorAll('a');
        navLinks.forEach(link => {
            link.addEventListener('mouseenter', () => {
                header.classList.add('nav-hover');
            });
        });
        
        navList.addEventListener('mouseleave', () => {
            header.classList.remove('nav-hover');
        });
    }
    
    // 스크롤 이벤트 리스너
    window.addEventListener('scroll', updateHeader);
    
    // 초기 상태 설정
    updateHeader();
}

// ============================================
// TOP 버튼 스크롤 표시/숨김
// ============================================
function initTopButton() {
    const topBtn = document.querySelector('.top-btn');
    if (!topBtn) return;
    
    function handleScroll() {
        if (window.scrollY > 300) {
            topBtn.classList.add('show');
        } else {
            topBtn.classList.remove('show');
        }
    }
    
    window.addEventListener('scroll', handleScroll);
    // 초기 로드 시 상태 확인
    handleScroll();
}

// ============================================
// 모바일 이미지 교체
// ============================================
function initMobileImages() {
    const sectionImages = document.querySelectorAll('.section-image[data-mobile]');
    
    // 각 이미지의 원본 src 저장
    sectionImages.forEach(img => {
        if (!img.dataset.originalSrc) {
            img.dataset.originalSrc = img.getAttribute('src');
        }
    });
    
    function updateImages() {
        const isMobileNow = window.innerWidth <= 768;
        sectionImages.forEach(img => {
            const originalSrc = img.dataset.originalSrc;
            const mobileSrc = img.getAttribute('data-mobile');
            const currentSrc = img.getAttribute('src');
            
            if (isMobileNow) {
                // 모바일일 때 모바일 이미지로 변경
                if (mobileSrc && currentSrc !== mobileSrc) {
                    img.src = mobileSrc;
                }
            } else {
                // 데스크톱일 때 원본 이미지로 변경
                if (originalSrc && currentSrc !== originalSrc) {
                    img.src = originalSrc;
                }
            }
        });
    }
    
    // 초기 설정
    updateImages();
    
    // 리사이즈 이벤트 리스너 (디바운스 적용)
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(updateImages, 100);
    });
}

// ============================================
// 히어로 배경 영상 모바일 처리
// ============================================
function initHeroVideoSequence() {
    const heroBg1 = document.getElementById('hero-bg-1');
    const heroBg1Source = document.getElementById('hero-bg-1-source');
    const heroPlaceholder = document.getElementById('hero-bg-placeholder');
    
    if (!heroBg1 || !heroBg1Source) return;
    
    const isMobile = window.innerWidth <= 768;
    
    // 모바일 여부 확인 및 비디오 소스 설정
    function setHeroVideoSource() {
        const isMobileNow = window.innerWidth <= 768;
        if (isMobileNow) {
            heroBg1Source.src = 'images/h-1-m.mp4';
            heroBg1.preload = 'none';
            
            // 모바일에서는 플레이스홀더에 첫 프레임 이미지 표시
            if (heroPlaceholder) {
                heroPlaceholder.style.backgroundImage = "url('images/section/h-1-m.png')";
                heroPlaceholder.style.display = 'block';
            }
        } else {
            heroBg1Source.src = 'images/h-1.mp4';
            heroBg1.preload = 'auto';
            if (heroPlaceholder) {
                heroPlaceholder.style.display = 'none';
            }
        }
    }
    
    // 초기 설정
    setHeroVideoSource();
    
    // 모바일에서 비디오 로딩 전략
    if (isMobile) {
        // 플레이스홀더를 먼저 표시하고, 비디오는 백그라운드에서 점진적으로 로드
        let videoLoadStarted = false;
        
        const startVideoLoad = () => {
            if (videoLoadStarted) return;
            videoLoadStarted = true;
            
            // 비디오 메타데이터만 먼저 로드
            heroBg1.preload = 'metadata';
            heroBg1.load();
            
            // canplay 이벤트로 재생 가능할 때 재생 시작
            const handleCanPlay = () => {
                heroBg1.play().then(() => {
                    // 비디오가 재생되면 플레이스홀더 숨기기
                    if (heroPlaceholder) {
                        heroPlaceholder.style.opacity = '0';
                        setTimeout(() => {
                            heroPlaceholder.style.display = 'none';
                        }, 500);
                    }
                }).catch(e => {
                    console.log('비디오 자동 재생 차단됨:', e);
                });
                heroBg1.removeEventListener('canplay', handleCanPlay);
            };
            
            heroBg1.addEventListener('canplay', handleCanPlay, { once: true });
            
            // 타임아웃: 3초 후에도 로드되지 않으면 플레이스홀더 유지
            setTimeout(() => {
                if (heroBg1.readyState < 2) {
                    console.log('비디오 로딩이 느려서 플레이스홀더 유지');
                }
            }, 3000);
        };
        
        // 페이지 로드 후 약간의 지연을 두고 비디오 로드 시작
        // 이렇게 하면 초기 페이지 로딩은 빠르게 유지됨
        setTimeout(startVideoLoad, 1000);
        
        // 사용자가 상호작용하면 즉시 로드 시작
        document.addEventListener('touchstart', startVideoLoad, { once: true });
        document.addEventListener('scroll', startVideoLoad, { once: true });
    } else {
        // 데스크톱에서는 즉시 로드
        heroBg1.load();
        heroBg1.play().catch(e => {
            console.log('비디오 자동 재생 차단됨:', e);
        });
    }
    
    // 리사이즈 이벤트 리스너
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            const wasPlaying = !heroBg1.paused;
            setHeroVideoSource();
            if (wasPlaying) {
                heroBg1.play();
            }
        }, 100);
    });
}

// ============================================
// 페이지 로드 시 초기화
// ============================================
// ============================================
// 문의폼 제출 처리 (Cloudflare Workers API 연동)
// ============================================
function initContactForm() {
    const contactForm = document.getElementById('contactForm');
    if (!contactForm) return;
    
    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const submitBtn = contactForm.querySelector('.submit-btn');
        const originalText = submitBtn.textContent;
        
        // 버튼 비활성화 및 로딩 상태
        submitBtn.disabled = true;
        submitBtn.textContent = '전송 중...';
        
        const formData = {
            name: document.getElementById('name').value,
            phone: document.getElementById('phone').value,
            email: document.getElementById('email').value,
            message: document.getElementById('message').value
        };
        
        try {
            // API_BASE_URL이 설정되어 있는지 확인
            const API_BASE_URL = window.API_BASE_URL || 'https://your-worker-name.your-subdomain.workers.dev/api';
            
            const response = await fetch(`${API_BASE_URL}/contact`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });
            
            const result = await response.json();
            
            if (response.ok) {
                alert('문의가 접수되었습니다. 빠른 시일 내에 연락드리겠습니다.');
                contactForm.reset();
            } else {
                throw new Error(result.error || '전송 실패');
            }
        } catch (error) {
            console.error('문의 제출 오류:', error);
            alert(`문의 전송 중 오류가 발생했습니다: ${error.message}\n\nAPI 서버가 설정되지 않았을 수 있습니다.`);
        } finally {
            // 버튼 복원
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    });
}

// ============================================
// 유튜브 프로모션 비디오 재생 제어
// ============================================
function initYoutubePromoVideo() {
    const video = document.querySelector('.youtube-promo-video');
    const playBtn = document.querySelector('.youtube-play-btn');
    const videoWrapper = document.querySelector('.youtube-video-wrapper');
    
    if (!video || !playBtn || !videoWrapper) return;
    
    // Intersection Observer로 뷰포트에 진입할 때만 비디오 로드
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // 뷰포트에 진입하면 비디오 로드
                video.load();
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1
    });
    
    observer.observe(videoWrapper);
    
    playBtn.addEventListener('click', () => {
        video.play();
        videoWrapper.classList.add('playing');
    });
    
    // 비디오가 끝나면 재생 버튼 다시 표시
    video.addEventListener('ended', () => {
        videoWrapper.classList.remove('playing');
    });
    
    // 비디오가 일시정지되면 재생 버튼 다시 표시
    video.addEventListener('pause', () => {
        if (video.currentTime > 0 && !video.ended) {
            videoWrapper.classList.remove('playing');
        }
    });
}

// ============================================
// 문의하기 섹션 비디오 지연 로딩
// ============================================
function initContactVideoLazyLoad() {
    const contactSection = document.querySelector('.contact-section');
    const contactVideo = document.querySelector('.contact-bg');
    
    if (!contactSection || !contactVideo) return;
    
    // Intersection Observer로 뷰포트에 진입할 때만 비디오 로드
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // 뷰포트에 진입하면 비디오 로드 및 재생
                contactVideo.load();
                contactVideo.play().catch(e => {
                    // 자동 재생이 차단된 경우 무시
                    console.log('비디오 자동 재생 차단됨:', e);
                });
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '100px' // 섹션에 100px 전에 미리 로드
    });
    
    observer.observe(contactSection);
}

// ============================================
// 페이지 로드 시 초기화
// ============================================
window.addEventListener('DOMContentLoaded', () => {
    initSmoothScroll();
    initHeroBackgroundControl();
    initHeaderScroll();
    initTopButton();
    initMobileImages();
    initHeroVideoSequence();
    initYoutubePromoVideo();
    initContactForm();
    initContactVideoLazyLoad();
});
