const API_URL = "http://localhost:8080";

document.addEventListener('DOMContentLoaded', function() {
    
    const isLoginPage = window.location.pathname.endsWith('index.html') || window.location.pathname === '/';
    if (isLoginPage) {
        localStorage.removeItem('userToken');
        localStorage.removeItem('userName');
    }

    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        const emailInput = document.getElementById('regEmail');
        const welcomeTitle = document.querySelector('.auth-box h2');
        
        if (emailInput && welcomeTitle) {
            emailInput.addEventListener('input', function() {
                if (this.value) {
                    welcomeTitle.textContent = "Вітаємо, " + this.value + "! 👋";
                } else {
                    welcomeTitle.textContent = "Створення акаунту";
                }
            });
        }

        registerForm.addEventListener('submit', async function(event) {
            event.preventDefault();
            
            const pass1Input = document.getElementById('regPassword');
            const pass2Input = document.getElementById('regConfirmPassword');
            const errorMsg = document.getElementById('passwordError');
            
            const pass1 = pass1Input.value;
            const pass2 = pass2Input.value;
            
            pass1Input.style.borderColor = '#334155';
            pass2Input.style.borderColor = '#334155';
            if (errorMsg) errorMsg.style.display = 'none';

            if (pass1 !== pass2) {
                pass1Input.style.borderColor = '#ef4444';
                pass2Input.style.borderColor = '#ef4444';
                if (errorMsg) errorMsg.style.display = 'block';
                return; 
            }

            const newLogin = document.getElementById('regLogin').value;
            const newEmail = document.getElementById('regEmail').value;

            try {
                const response = await fetch(`${API_URL}/auth/register`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ 
                        name: newLogin, 
                        email: newEmail, 
                        password: pass1 
                    })
                });

                if (response.ok) {
                    alert("Реєстрація успішна! 🎉 Тепер ви можете увійти.");
                    window.location.href = 'index.html'; 
                } else {
                    alert("Помилка. Можливо, такий email вже існує в базі.");
                }
            } catch (error) {
                console.error("Помилка:", error);
                alert("Сервер недоступний!");
            }
        });
    }

    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        const currentLoginInput = document.getElementById('loginField');
        const currentPassInput = document.getElementById('passwordField');
        const errorMsg = document.getElementById('loginError');

        function hideError() {
            currentLoginInput.style.borderColor = '#334155';
            currentPassInput.style.borderColor = '#334155';
            if (errorMsg) errorMsg.style.display = 'none';
        }

        if (currentLoginInput) currentLoginInput.addEventListener('input', hideError);
        if (currentPassInput) currentPassInput.addEventListener('input', hideError);

        loginForm.addEventListener('submit', async function(event) {
            event.preventDefault();
            
            const enteredEmail = currentLoginInput.value; 
            const enteredPass = currentPassInput.value;
            
            hideError(); 

            try {
                const response = await fetch(`${API_URL}/auth/login`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ 
                        email: enteredEmail, 
                        password: enteredPass 
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    
                    localStorage.setItem("userToken", data.token); 
                    localStorage.setItem('userName', enteredEmail); 
                    
                    window.location.href = 'profile.html';
                } else {
                    currentLoginInput.style.borderColor = '#ef4444';
                    currentPassInput.style.borderColor = '#ef4444';
                    if (errorMsg) errorMsg.style.display = 'block';
                }
            } catch (error) {
                console.error("Помилка:", error);
                alert("Сервер недоступний!");
            }
        });
    }

    const toggleButtons = document.querySelectorAll('.toggle-password-btn');

    toggleButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault(); 
            
            let input = this.previousElementSibling;
            if (!input || input.tagName !== 'INPUT') {
                input = this.parentElement.querySelector('input');
            }

            const svg = this.querySelector('svg');
            
            if (input && input.tagName === 'INPUT') {
                if (input.type === 'password') {
                    input.type = 'text';
                    if (svg) svg.style.stroke = '#00ADD8'; 
                } else {
                    input.type = 'password';
                    if (svg) svg.style.stroke = '#F1F5F9'; 
                }
            } else {
                console.error("Око не знайшло поле пароля. Перевір HTML-структуру.");
            }
        });
    });

    const addCourseForm = document.getElementById('addCourseForm');
    if (addCourseForm) {
        addCourseForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const token = localStorage.getItem('userToken');
            if (!token) {
                alert("Немає доступу. Будь ласка, авторизуйтесь.");
                return;
            }
            
            const courseTitle = document.getElementById('courseTitle').value;
            const courseDesc = document.getElementById('courseDesc').value;

            const courseData = {
                title: courseTitle, 
                description: courseDesc
            };

            try {
                const response = await fetch(`${API_URL}/api/admin/courses`, {
                    method: 'POST',
                    headers: {
                        'Authorization': 'Bearer ' + token,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(courseData)
                });

                if (response.ok || response.status === 201) {
                    alert("Курс успішно створено! 🚀");
                    addCourseForm.reset(); 
                } else {
                    alert("Помилка створення. Перевірте, чи є у вас права Адміна.");
                }
            } catch (error) {
                console.error("Сервер недоступний:", error);
            }
        });
    }

    const enrollBtn = document.getElementById('enrollBtn');
    if (enrollBtn) {
        enrollBtn.addEventListener('click', async function(e) {
            e.preventDefault(); 
            
            const token = localStorage.getItem('userToken');
            if (!token) {
                alert("Будь ласка, увійдіть в акаунт!");
                window.location.href = 'index.html';
                return;
            }

            const courseId = 1; 

            try {
                const response = await fetch(`${API_URL}/api/courses/${courseId}/enroll`, {
                    method: 'POST',
                    headers: {
                        'Authorization': 'Bearer ' + token,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok || response.status === 201) {
                    window.location.href = 'lesson.html';
                } else {
                    alert("Помилка запису на курс. Можливо, ви вже записані.");
                    window.location.href = 'lesson.html';
                }
            } catch (error) {
                console.error("Помилка:", error);
            }
        });
    }

    async function loadCourses() {
        const coursesGrid = document.querySelector('.courses-grid'); 
        if (!coursesGrid) return;

        const token = localStorage.getItem('userToken');

        try {
            const response = await fetch(`${API_URL}/api/courses`, {
                headers: { 'Authorization': 'Bearer ' + token }
            });

            if (response.ok) {
                const courses = await response.json();
                
                coursesGrid.innerHTML = ''; 

                courses.forEach(course => {
                    const cardHTML = `
                        <div class="features-box" style="margin: 0; display: flex; flex-direction: column;">
                            <h3 style="color: #00ADD8; margin-bottom: 10px;">${course.title}</h3>
                            <p style="color: #94a3b8; font-size: 14px; margin-bottom: 20px;">${course.description}</p>
                            <a href="course-info.html" style="background-color: #00ADD8; color: #fff; padding: 8px 16px; border-radius: 6px; text-decoration: none; font-weight: bold;">Детальніше</a>
                        </div>
                    `;
                    coursesGrid.innerHTML += cardHTML;
                });
            }
        } catch (error) {
            console.error("Не вдалося завантажити курси:", error);
        }
    }

    if (window.location.pathname.includes('profile.html')) {
        loadCourses();
    }

}); 