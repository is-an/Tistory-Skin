// script.js
// 이 파일은 티스토리 스킨의 동적인 요소들(테마 변경, 스크롤 애니메이션, 챗봇 연동 등)을 제어하는 자바스크립트입니다.

document.addEventListener('DOMContentLoaded', () => {
    // ==========================================
    // 1. 다크/라이트 테마 전환 (Theme Toggle)
    // ==========================================
    // 브라우저의 localStorage를 활용해 방문자가 최근 설정한 테마(어두운/밝은)를 기억합니다.
    const themeToggleBtn = document.getElementById('theme-toggle');
    const body = document.body;

    // Default to dark theme unless previously set
    if (localStorage.getItem('theme') === 'light') {
        body.classList.remove('dark-theme');
        themeToggleBtn.innerHTML = '<i class="fas fa-sun"></i>';
    } else {
        body.classList.add('dark-theme');
        themeToggleBtn.innerHTML = '<i class="fas fa-moon"></i>';
    }

    themeToggleBtn.addEventListener('click', () => {
        body.classList.toggle('dark-theme');
        if (body.classList.contains('dark-theme')) {
            localStorage.setItem('theme', 'dark');
            themeToggleBtn.innerHTML = '<i class="fas fa-moon"></i>';
        } else {
            localStorage.setItem('theme', 'light');
            themeToggleBtn.innerHTML = '<i class="fas fa-sun"></i>';
        }
    });

    // ==========================================
    // 2. 스크롤 애니메이션 관찰자 (Scroll Observer)
    // ==========================================
    // JS의 IntersectionObserver API를 사용해, 화면에서 요소가 보여질 때(isIntersecting)
    // 'visible' 클래스를 추가하여 위로 부드럽게 나타나는 페이드인 효과를 발생시킵니다.
    const observerOptions = {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px"
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    document.querySelectorAll('.scroll-animate').forEach(el => {
        observer.observe(el);
    });

    // ==========================================
    // 3. 클로드 AI 위젯 로직 (Claude Widget Logic)
    // ==========================================
    // Anthropic API (Claude) 모델과 비동기(fetch) 통신하여 챗봇 서비스를 작동시키는 부분입니다.
    const widgetToggle = document.getElementById('widget-toggle');
    const chatWindow = document.getElementById('chat-window');
    const closeChat = document.getElementById('close-chat');
    const chatInput = document.getElementById('chat-input');
    const sendBtn = document.getElementById('send-btn');
    const chatBody = document.getElementById('chat-body');

    // **중요**: 실제 운영시에는 API 키를 프론트엔드 코드에 직접 하드코딩하지 말고 외부 프록시 서버나
    // Cloudflare Worker 등을 이용해 호출하는 것이 안전합니다.
    // 임시 테스트용으로 사용자가 직접 API 키를 입력하도록 설정합니다.
    const ANTHROPIC_API_KEY = "여기에_CLAUDE_API_키를_입력하세요";

    widgetToggle.addEventListener('click', () => {
        chatWindow.classList.toggle('hidden');
        if (!chatWindow.classList.contains('hidden')) {
            chatInput.focus();
        }
    });

    closeChat.addEventListener('click', () => {
        chatWindow.classList.add('hidden');
    });

    const addMessage = (text, isUser = false) => {
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${isUser ? 'user-message' : 'ai-message'}`;
        msgDiv.textContent = text;
        chatBody.appendChild(msgDiv);
        chatBody.scrollTop = chatBody.scrollHeight;
    };

    let chatHistory = [
        {
            role: "user",
            content: "너는 이 IT 포트폴리오 사이트의 주인(IT 개발자)을 돕는 유능한 AI 어시스턴트야. 방문자의 질문에 친절하게 답변해줘."
        },
        {
            role: "assistant",
            content: "네, 알겠습니다. 방문자의 질문에 친절하고 전문적으로 답변하겠습니다."
        }
    ];

    const sendMessageToClaude = async (userText) => {
        if (ANTHROPIC_API_KEY === "여기에_CLAUDE_API_키를_입력하세요") {
            addMessage("시스템: API 키가 설정되지 않았습니다. script.js 파일에서 ANTHROPIC_API_KEY를 여러분의 키로 수정해주세요.");
            return;
        }

        chatHistory.push({ role: "user", content: userText });

        try {
            // Note: 클라이언트 브라우저 직접 호출에는 CORS 제약이 있을 수 있습니다.
            // 개발 테스트 시에는 anthropic-dangerously-allow-browser 설정을 넣을 수 있지만,
            // 프로덕션 배포 시에는 반드시 서버 프록시를 통해 API를 호출해야 합니다.
            const response = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': ANTHROPIC_API_KEY,
                    'anthropic-version': '2023-06-01',
                    'anthropic-dangerously-allow-browser': 'true' // 프로덕션에서는 제거 및 프록시 사용 요망
                },
                body: JSON.stringify({
                    model: "claude-3-haiku-20240307", // 빠르고 가벼운 모델
                    max_tokens: 500,
                    messages: chatHistory
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error?.message || `API Error: ${response.status}`);
            }

            const data = await response.json();
            const aiText = data.content[0].text;

            chatHistory.push({ role: "assistant", content: aiText });
            addMessage(aiText, false);

        } catch (error) {
            console.error('Claude API Error:', error);
            if (error.message.includes("Failed to fetch")) {
                addMessage("시스템 오류가 발생했습니다: 네트워크 연결 문제 또는 CORS 정책에 의해 차단되었습니다. 개발자 콘솔을 확인해 주세요.");
            } else {
                addMessage(`오류가 발생했습니다: ${error.message}`);
            }
        }
    };

    const handleSend = () => {
        const text = chatInput.value.trim();
        if (text) {
            addMessage(text, true);
            chatInput.value = '';

            // 로딩 인디케이터 임시 표시
            const loadingMsg = document.createElement('div');
            loadingMsg.className = 'message ai-message loading-indicator';
            loadingMsg.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> 입력 중...';
            chatBody.appendChild(loadingMsg);
            chatBody.scrollTop = chatBody.scrollHeight;

            sendMessageToClaude(text).then(() => {
                loadingMsg.remove();
            });
        }
    };

    sendBtn.addEventListener('click', handleSend);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleSend();
        }
    });

    // ==========================================
    // 4. 모바일 햄버거 메뉴 토글 로직 (Mobile Menu)
    // ==========================================
    // 모바일 해상도에서 햄버거 아이콘(☰)을 눌렀을 때 네비게이션 창이 열리고 닫히도록 하는 로직입니다.
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const navLinks = document.getElementById('nav-links');

    if (mobileMenuBtn && navLinks) {
        mobileMenuBtn.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            const icon = mobileMenuBtn.querySelector('i');
            if (navLinks.classList.contains('active')) {
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-times');
            } else {
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        });

        // Close menu when clicking a link
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('active');
                if (mobileMenuBtn.querySelector('i')) {
                    mobileMenuBtn.querySelector('i').className = 'fas fa-bars';
                }
            });
        });
    }

});
