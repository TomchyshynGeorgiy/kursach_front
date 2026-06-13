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
                welcomeTitle.textContent = this.value ? `Вітаємо, ${this.value}! 👋` : "Створення акаунту";
            });
        }

        registerForm.addEventListener('submit', async function(event) {
            event.preventDefault();
            const pass1Input = document.getElementById('regPassword');
            const pass2Input = document.getElementById('regConfirmPassword');
            const errorMsg = document.getElementById('passwordError');
            
            pass1Input.style.borderColor = '#334155';
            pass2Input.style.borderColor = '#334155';
            if (errorMsg) errorMsg.style.display = 'none';

            if (pass1Input.value !== pass2Input.value) {
                pass1Input.style.borderColor = '#ef4444';
                pass2Input.style.borderColor = '#ef4444';
                if (errorMsg) errorMsg.style.display = 'block';
                return; 
            }

            try {
                const response = await fetch(`${API_URL}/auth/register`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ 
                        name: document.getElementById('regLogin').value, 
                        email: document.getElementById('regEmail').value, 
                        password: pass1Input.value 
                    })
                });

                if (response.ok) {
                    alert("Реєстрація успішна! 🎉 Тепер ви можете увійти.");
                    window.location.href = 'index.html'; 
                } else {
                    alert("Помилка. Можливо, такий email вже існує в базі.");
                }
            } catch (error) {
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
            hideError(); 

            try {
                const response = await fetch(`${API_URL}/auth/login`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email: currentLoginInput.value, password: currentPassInput.value })
                });

                if (response.ok) {
                    const data = await response.json();
                    localStorage.setItem("userToken", data.token); 
                    localStorage.setItem('userName', currentLoginInput.value); 
                    window.location.href = 'profile.html';
                } else {
                    currentLoginInput.style.borderColor = '#ef4444';
                    currentPassInput.style.borderColor = '#ef4444';
                    if (errorMsg) errorMsg.style.display = 'block';
                }
            } catch (error) {
                alert("Сервер недоступний!");
            }
        });
    }

    document.querySelectorAll('.toggle-password-btn').forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault(); 
            let input = this.previousElementSibling;
            if (!input || input.tagName !== 'INPUT') input = this.parentElement.querySelector('input');
            const svg = this.querySelector('svg');
            
            if (input && input.tagName === 'INPUT') {
                if (input.type === 'password') {
                    input.type = 'text';
                    if (svg) svg.style.stroke = '#00ADD8'; 
                } else {
                    input.type = 'password';
                    if (svg) svg.style.stroke = '#F1F5F9'; 
                }
            }
        });
    });

    const addCourseForm = document.getElementById('addCourseForm');
    if (addCourseForm) {
        addCourseForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const token = localStorage.getItem('userToken');
            if (!token) { alert("Немає доступу!"); return; }
            
            const courseData = {
                title: document.getElementById('courseTitle').value, 
                description: document.getElementById('courseDesc').value
            };

            try {
                const response = await fetch(`${API_URL}/api/admin/courses`, {
                    method: 'POST',
                    headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
                    body: JSON.stringify(courseData)
                });

                if (response.ok || response.status === 201) {
                    const data = await response.json();
                    
                    const courseId = data.course_id || data.id; 
                    
                    alert("Курс створено! Тепер додамо перший модуль.");
                    addCourseForm.reset(); 

                    const moduleTitle = prompt("Введіть назву першого модуля (напр. 'Основи'):");
                    if (moduleTitle) {
                        const modRes = await fetch(`${API_URL}/api/admin/courses/${courseId}/modules`, {
                            method: 'POST',
                            headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
                            body: JSON.stringify({ title: moduleTitle })
                        });
                        
                        if (modRes.ok || modRes.status === 201) {
                            const modData = await modRes.json();
                            
                            const moduleId = modData.module_id || modData.id;
                            
                            const lessonTitle = prompt("Модуль створено! Введіть назву першого уроку:");
                            if (lessonTitle) {
                                await fetch(`${API_URL}/api/admin/modules/${moduleId}/lessons`, {
                                    method: 'POST',
                                    headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ title: lessonTitle, content: "Текст уроку..." })
                                });
                                alert("Успіх! Курс, модуль та урок повністю зібрані! 🚀");
                            }
                        }
                    }
                } else {
                    alert("Помилка створення. Перевірте права Адміна.");
                }
            } catch (error) {
                console.error("Помилка:", error);
            }
        });
    }

    const token = localStorage.getItem('userToken');

    if (window.location.pathname.includes('profile.html')) {
        async function loadCourses() {
            const coursesGrid = document.querySelector('.courses-grid'); 
            if (!coursesGrid) return;
            try {
                const response = await fetch(`${API_URL}/api/courses`, { headers: { 'Authorization': 'Bearer ' + token } });
                if (response.ok) {
                    const courses = await response.json();
                    coursesGrid.innerHTML = ''; 
                    courses.forEach(course => {
                        coursesGrid.innerHTML += `
                            <div class="features-box" style="margin: 0; display: flex; flex-direction: column;">
                                <h3 style="color: #00ADD8; margin-bottom: 10px;">${course.title}</h3>
                                <p style="color: #94a3b8; font-size: 14px; margin-bottom: 20px;">${course.description || "Опис відсутній"}</p>
                                <a href="course-info.html?id=${course.id || course.course_id}" style="background-color: #00ADD8; color: #fff; padding: 8px 16px; border-radius: 6px; text-decoration: none; font-weight: bold;">Детальніше</a>
                            </div>
                        `;
                    });
                }
            } catch (error) { console.error("Помилка:", error); }
        }
        loadCourses();
    }

    if (window.location.pathname.includes('course-info.html')) {
        const urlParams = new URLSearchParams(window.location.search);
        const courseId = urlParams.get('id');

        if (courseId) {
            
            fetch(`${API_URL}/api/courses/${courseId}`, { headers: { 'Authorization': 'Bearer ' + token } })
                .then(res => res.json())
                .then(course => {
                    const titleEl = document.querySelector('.features-box h1');
                    const descEl = document.querySelector('.features-box p');
                    if(titleEl) titleEl.textContent = course.title;
                    if(descEl) descEl.textContent = course.description;
                });

            fetch(`${API_URL}/api/courses/${courseId}/syllabus`, { headers: { 'Authorization': 'Bearer ' + token } })
                .then(res => res.json())
                .then(modules => {
                   
                    const mainContainer = document.querySelector('main');
                    if(mainContainer && modules.length > 0) {
                        let syllabusHTML = `<h2 style="font-size: 24px; margin-bottom: 25px; color: #F1F5F9; text-align: center;">Програма курсу</h2>`;
                        modules.forEach(mod => {
                            syllabusHTML += `<div class="features-box" style="margin: 0 auto 15px auto; padding: 25px; width: 100%; max-width: 650px;">
                                <h3 style="color: #00ADD8; margin-bottom: 15px; font-size: 18px;">${mod.title}</h3>
                                <ul style="list-style-type: none; padding-left: 0; margin: 0; display: flex; flex-direction: column; gap: 12px;">`;
                            if(mod.lessons) {
                                mod.lessons.forEach(lesson => {
                                    syllabusHTML += `<li style="color: #94a3b8; font-size: 15px;">
                                        <a href="lesson.html?courseId=${courseId}&lessonId=${lesson.id || lesson.lesson_id}" style="color: #94a3b8; text-decoration: none;">▶️ ${lesson.title}</a>
                                    </li>`;
                                });
                            }
                            syllabusHTML += `</ul></div>`;
                        });
                        
                        const oldSyllabus = document.querySelectorAll('main > div:nth-of-type(n+2)');
                        oldSyllabus.forEach(el => el.remove());
                        mainContainer.innerHTML += `<div style="width: 100%; display: flex; flex-direction: column; align-items: center; margin-top: 20px;">${syllabusHTML}</div>`;
                    }
                });
        }

        const enrollBtn = document.getElementById('enrollBtn');
        if (enrollBtn) {
            enrollBtn.addEventListener('click', async function(e) {
                e.preventDefault(); 
                if (!token) { alert("Увійдіть в акаунт!"); return; }

                try {
                    const response = await fetch(`${API_URL}/api/courses/${courseId}/enroll`, {
                        method: 'POST',
                        headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' }
                    });

                    if (response.ok || response.status === 201) {
                        alert("Ви успішно приєдналися до курсу!");
                        window.location.reload(); 
                    } else {
                        alert("Помилка запису! Можливо, ви вже записані.");
                        
                    }
                } catch (error) { console.error("Помилка:", error); }
            });
        }
    }

    if (window.location.pathname.includes('lesson.html')) {
        const urlParams = new URLSearchParams(window.location.search);
        const courseId = urlParams.get('courseId');
        const lessonId = urlParams.get('lessonId');
        let nextLessonId = null;

        if (courseId && lessonId) {
            
            fetch(`${API_URL}/api/lessons/${lessonId}`, { headers: { 'Authorization': 'Bearer ' + token } })
                .then(res => res.json())
                .then(lesson => {
                    const titleEl = document.querySelector('h1');
                    const contentEl = document.querySelector('.features-box p');
                    if (titleEl) titleEl.textContent = lesson.title || "Урок";
                    if (contentEl) contentEl.textContent = lesson.content || "Тут має бути теорія...";
                });

            fetch(`${API_URL}/api/courses/${courseId}/syllabus`, { headers: { 'Authorization': 'Bearer ' + token } })
                .then(res => res.json())
                .then(modules => {
                    let allLessons = [];
                    modules.forEach(mod => { if (mod.lessons) allLessons.push(...mod.lessons); });
                    const currentIndex = allLessons.findIndex(l => (l.id == lessonId || l.lesson_id == lessonId));
                    if (currentIndex !== -1 && currentIndex < allLessons.length - 1) {
                        nextLessonId = allLessons[currentIndex + 1].id || allLessons[currentIndex + 1].lesson_id;
                    }
                });
        }

        const completeBtn = document.getElementById('completeLessonBtn');
        if (completeBtn) {
            completeBtn.addEventListener('click', async function(e) {
                e.preventDefault();
                try {
                    const response = await fetch(`${API_URL}/api/lessons/${lessonId}/complete`, {
                        method: 'POST',
                        headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
                        body: JSON.stringify({ completed: true })
                    });

                    if (response.ok || response.status === 200 || response.status === 201) {
                        alert("⚔️ Боса повалено! XP нараховано.");
                        if (nextLessonId) {
                            window.location.href = `lesson.html?courseId=${courseId}&lessonId=${nextLessonId}`;
                        } else {
                            alert("Вітаємо! Ви пройшли весь курс! 🏆");
                            window.location.href = `profile.html`;
                        }
                    } else {
                        alert("Помилка збереження прогресу.");
                    }
                } catch (error) { alert("Сервер недоступний."); }
            });
        }
    }

    const sidebarLinks = document.querySelectorAll('.sidebar-nav a');
    sidebarLinks.forEach(link => {
        if (link.textContent.includes('Мої курси')) {
            link.addEventListener('click', async (e) => {
                e.preventDefault();
                document.querySelectorAll('.sidebar-nav a').forEach(a => a.classList.remove('active'));
                link.classList.add('active');

                const coursesGrid = document.querySelector('.courses-grid');
                if (!coursesGrid) return;
                document.querySelector('h1').textContent = "Мої курси 📚";
                coursesGrid.innerHTML = '<p>Завантаження...</p>';

                try {
                    const response = await fetch(`${API_URL}/api/profile/courses`, { headers: { 'Authorization': 'Bearer ' + token } });
                    if (response.ok) {
                        const myCourses = await response.json();
                        coursesGrid.innerHTML = '';
                        if (myCourses.length === 0) {
                            coursesGrid.innerHTML = '<p style="color: #94a3b8;">Ви ще не записані на жоден курс.</p>';
                            return;
                        }
                        myCourses.forEach(course => {
                            coursesGrid.innerHTML += `
                                <div class="features-box" style="margin: 0; border: 1px solid #10b981;">
                                    <h3 style="color: #10b981; margin-bottom: 10px;">${course.title}</h3>
                                    <p style="color: #94a3b8; font-size: 14px; margin-bottom: 20px;">Ви записані на цей курс.</p>
                                    <a href="course-info.html?id=${course.id || course.course_id}" style="background-color: #10b981; color: #fff; padding: 8px 16px; border-radius: 6px; text-decoration: none;">Продовжити навчання</a>
                                </div>
                            `;
                        });
                    }
                } catch (err) { coursesGrid.innerHTML = '<p style="color: #ef4444;">Помилка завантаження.</p>'; }
            });
        }

        if (link.textContent.includes('Налаштування')) {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                document.querySelectorAll('.sidebar-nav a').forEach(a => a.classList.remove('active'));
                link.classList.add('active');

                const coursesGrid = document.querySelector('.courses-grid');
                if (!coursesGrid) return;
                document.querySelector('h1').textContent = "Налаштування профілю ⚙️";
                
                coursesGrid.innerHTML = `
                    <div class="features-box" style="grid-column: 1 / -1; max-width: 500px;">
                        <form id="settingsForm" style="display: flex; flex-direction: column; gap: 15px;">
                            <input type="text" id="updName" placeholder="Нове ім'я" required style="padding: 10px; border-radius: 6px; background: #1e293b; color: white; border: 1px solid #334155;">
                            <input type="email" id="updEmail" placeholder="Новий Email" required style="padding: 10px; border-radius: 6px; background: #1e293b; color: white; border: 1px solid #334155;">
                            <button type="submit" style="background-color: #00ADD8; color: #0f172a; font-weight: bold; padding: 10px; border-radius: 6px; border: none; cursor: pointer;">Зберегти зміни</button>
                        </form>
                    </div>
                `;

                document.getElementById('settingsForm').addEventListener('submit', async function(ev) {
                    ev.preventDefault();
                    const newName = document.getElementById('updName').value;
                    const newEmail = document.getElementById('updEmail').value;

                    try {
                        const response = await fetch(`${API_URL}/api/profile`, {
                            method: 'PUT',
                            headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
                            body: JSON.stringify({ name: newName, email: newEmail })
                        });

                        if (response.ok) {
                            alert("Профіль успішно оновлено!");
                            document.getElementById('profileName').textContent = newName;
                            document.querySelector('.avatar').textContent = newName.charAt(0).toUpperCase();
                            localStorage.setItem('userName', newEmail);
                        } else {
                            alert("Помилка оновлення профілю.");
                        }
                    } catch (error) { alert("Сервер недоступний."); }
                });
            });
        }
    });

}); 