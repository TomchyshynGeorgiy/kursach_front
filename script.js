const API_URL = "http://localhost:8080";

document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('userToken');

    if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/') {
        localStorage.removeItem('userToken');
        localStorage.removeItem('userName');
    }

    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const pass1 = document.getElementById('regPassword');
            const pass2 = document.getElementById('regConfirmPassword');
            if (pass1.value !== pass2.value) {
                alert("Паролі не співпадають!");
                return; 
            }
            try {
                const response = await fetch(`${API_URL}/auth/register`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ 
                        name: document.getElementById('regLogin').value, 
                        email: document.getElementById('regEmail').value, 
                        password: pass1.value 
                    })
                });
                if (response.ok) {
                    alert("Реєстрація успішна! 🎉");
                    window.location.href = 'index.html'; 
                } else alert("Помилка реєстрації.");
            } catch (err) { alert("Сервер недоступний!"); }
        });
    }

    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const email = document.getElementById('loginField').value;
            const pass = document.getElementById('passwordField').value;
            try {
                const response = await fetch(`${API_URL}/auth/login`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email, password: pass })
                });
                if (response.ok) {
                    const data = await response.json();
                    localStorage.setItem("userToken", data.token); 
                    localStorage.setItem('userName', email); 
                    window.location.href = 'profile.html';
                } else document.getElementById('loginError').style.display = 'block';
            } catch (err) { alert("Сервер недоступний!"); }
        });
    }

    document.querySelectorAll('.toggle-password-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault(); 
            let input = this.parentElement.querySelector('input');
            const svg = this.querySelector('svg');
            if (input) {
                input.type = input.type === 'password' ? 'text' : 'password';
                if (svg) svg.style.stroke = input.type === 'text' ? '#00ADD8' : '#F1F5F9'; 
            }
        });
    });

    const addCourseForm = document.getElementById('addCourseForm');
    if (addCourseForm) {
        addCourseForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            if (!token) { alert("Немає доступу!"); return; }
            const container = addCourseForm.parentElement;
            
            try {
                
                const resCourse = await fetch(`${API_URL}/api/admin/courses`, {
                    method: 'POST',
                    headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        title: document.getElementById('courseTitle').value, 
                        description: document.getElementById('courseDesc').value
                    })
                });

                if (resCourse.ok || resCourse.status === 201) {
                    const data = await resCourse.json();
                    const courseId = data.course_id || data.id; 
                    
                    container.innerHTML = `
                        <h3 style="color:#00ADD8; margin-bottom: 20px; text-align:center;">Курс створено! Додаємо модуль</h3>
                        <input type="text" id="modTitleUI" placeholder="Назва модуля (напр. Вступ)" style="width: 100%; margin-bottom: 15px; padding: 12px; border-radius: 8px; background: #1e293b; border: 1px solid #334155; color: #F1F5F9;">
                        <button id="saveModBtn" style="background-color: #00ADD8; color: #0f172a; font-weight: bold; width: 100%; padding: 12px; border-radius: 8px; border: none; cursor:pointer;">➕ Створити модуль</button>
                    `;

                    document.getElementById('saveModBtn').addEventListener('click', async () => {
                        const mTitle = document.getElementById('modTitleUI').value;
                        const resMod = await fetch(`${API_URL}/api/admin/courses/${courseId}/modules`, {
                            method: 'POST',
                            headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
                            body: JSON.stringify({ title: mTitle })
                        });
                        
                        if (resMod.ok || resMod.status === 201) {
                            const modData = await resMod.json();
                            const moduleId = modData.module_id || modData.id;

                            container.innerHTML = `
                                <h3 style="color:#10b981; margin-bottom: 20px; text-align:center;">Модуль готовий! Додаємо урок</h3>
                                <input type="text" id="lessonTitleUI" placeholder="Назва уроку" style="width: 100%; margin-bottom: 15px; padding: 12px; border-radius: 8px; background: #1e293b; border: 1px solid #334155; color: #F1F5F9;">
                                <textarea id="lessonContentUI" placeholder="Контент уроку..." rows="4" style="width: 100%; margin-bottom: 15px; padding: 12px; border-radius: 8px; background: #1e293b; border: 1px solid #334155; color: #F1F5F9;"></textarea>
                                <button id="saveLessonBtn" style="background-color: #10b981; color: #fff; font-weight: bold; width: 100%; padding: 12px; border-radius: 8px; border: none; cursor:pointer;">✅ Завершити створення</button>
                            `;

                            document.getElementById('saveLessonBtn').addEventListener('click', async () => {
                                await fetch(`${API_URL}/api/admin/modules/${moduleId}/lessons`, {
                                    method: 'POST',
                                    headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ 
                                        title: document.getElementById('lessonTitleUI').value, 
                                        content: document.getElementById('lessonContentUI').value 
                                    })
                                });
                                container.innerHTML = `<h3 style="color:#10b981; text-align:center;">🎉 Курс повністю зібраний та готовий!</h3><button onclick="window.location.reload()" style="margin-top:20px; width:100%; padding:10px; border-radius:8px; cursor:pointer;">Створити ще один</button>`;
                            });
                        }
                    });
                }
            } catch (err) { alert("Помилка адмінки!"); }
        });
    }

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
                                <p style="color: #94a3b8; font-size: 14px; margin-bottom: 20px;">${course.description}</p>
                                <a href="course-info.html?id=${course.id || course.course_id}" style="background-color: #00ADD8; color: #fff; padding: 8px 16px; border-radius: 6px; text-decoration: none; font-weight: bold;">Детальніше</a>
                            </div>
                        `;
                    });
                }
            } catch (error) {}
        }
        loadCourses();
        
        document.querySelectorAll('.sidebar-nav a').forEach(link => {
            link.addEventListener('click', async (e) => {
                if(link.textContent.includes('Дашборд')) return; 
                e.preventDefault();
                document.querySelectorAll('.sidebar-nav a').forEach(a => a.classList.remove('active'));
                link.classList.add('active');
                const coursesGrid = document.querySelector('.courses-grid');
                
                if (link.textContent.includes('Мої курси')) {
                    document.querySelector('h1').textContent = "Мої курси 📚";
                    try {
                        const res = await fetch(`${API_URL}/api/profile/courses`, { headers: { 'Authorization': 'Bearer ' + token } });
                        if (res.ok) {
                            const myCourses = await res.json();
                            coursesGrid.innerHTML = myCourses.length ? '' : '<p>Немає курсів.</p>';
                            myCourses.forEach(c => {
                                coursesGrid.innerHTML += `<div class="features-box" style="border: 1px solid #10b981;"><h3 style="color: #10b981;">${c.title}</h3><a href="course-info.html?id=${c.id || c.course_id}" style="background: #10b981; color: #fff; padding: 8px; border-radius: 6px; text-decoration: none;">Продовжити</a></div>`;
                            });
                        }
                    } catch (err) {}
                }
                
                if (link.textContent.includes('Налаштування')) {
                    document.querySelector('h1').textContent = "Налаштування ⚙️";
                    coursesGrid.innerHTML = `<div class="features-box" style="max-width: 500px;"><form id="setForm" style="display:flex; flex-direction:column; gap:15px;"><input type="text" id="updName" placeholder="Нове ім'я"><input type="email" id="updEmail" placeholder="Новий Email"><button type="submit" style="background:#00ADD8; padding:10px; font-weight:bold;">Зберегти</button></form></div>`;
                    document.getElementById('setForm').addEventListener('submit', async (ev) => {
                        ev.preventDefault();
                        await fetch(`${API_URL}/api/profile`, {
                            method: 'PUT',
                            headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
                            body: JSON.stringify({ name: document.getElementById('updName').value, email: document.getElementById('updEmail').value })
                        });
                        alert("Оновлено!");
                    });
                }
            });
        });
    }

    if (window.location.pathname.includes('course-info.html')) {
        const urlParams = new URLSearchParams(window.location.search);
        const courseId = urlParams.get('id');
        let currentLessonId = 1; 
        let isEnrolled = false;

        if (courseId) {
            
            fetch(`${API_URL}/api/courses/${courseId}`, { headers: { 'Authorization': 'Bearer ' + token } })
                .then(res => res.json())
                .then(course => {
                    const titleEl = document.querySelector('h1');
                    if(titleEl) titleEl.textContent = course.title;
                    const descEl = document.querySelector('.features-box p');
                    if(descEl) descEl.textContent = course.description;
                });

            fetch(`${API_URL}/api/courses/${courseId}/syllabus`, { headers: { 'Authorization': 'Bearer ' + token } })
                .then(res => res.json())
                .then(modules => {
                    const mainContainer = document.querySelector('main');
                    if(mainContainer && modules.length > 0) {
                        let sylHTML = `<h2 style="font-size: 24px; text-align: center;">Програма курсу</h2>`;
                        modules.forEach(mod => {
                            sylHTML += `<div class="features-box" style="margin: 0 auto 15px auto; padding: 25px; max-width: 650px;"><h3 style="color:#00ADD8;">${mod.title}</h3><ul>`;
                            if(mod.lessons) {
                                mod.lessons.forEach(lesson => {
                                    sylHTML += `<li style="margin-bottom:10px;"><a href="lesson.html?courseId=${courseId}&lessonId=${lesson.id || lesson.lesson_id}" style="color:#94a3b8; text-decoration:none;">▶️ ${lesson.title}</a></li>`;
                                });
                            }
                            sylHTML += `</ul></div>`;
                        });
                        document.querySelectorAll('main > div:nth-of-type(n+2)').forEach(el => el.remove());
                        mainContainer.innerHTML += `<div style="width:100%;">${sylHTML}</div>`;
                    }
                });

            if (token) {
                fetch(`${API_URL}/api/courses/${courseId}/progress`, { headers: { 'Authorization': 'Bearer ' + token } })
                    .then(res => {
                        if(res.ok) {
                            isEnrolled = true;
                            return res.json();
                        }
                    })
                    .then(progData => {
                        const enrollBtn = document.getElementById('enrollBtn');
                        if (progData && progData.lesson_id && enrollBtn) {
                            currentLessonId = progData.lesson_id;
                            enrollBtn.innerHTML = '🔄 Продовжити навчання';
                            enrollBtn.style.backgroundColor = '#10b981';
                        } else if (isEnrolled && enrollBtn) {
                            enrollBtn.innerHTML = '🚀 Почати навчання';
                        }
                    }).catch(e => console.log("Прогресу немає"));
            }
        }

        const enrollBtn = document.getElementById('enrollBtn');
        if (enrollBtn) {
            enrollBtn.addEventListener('click', async function(e) {
                e.preventDefault(); 
                if (!token) { alert("Увійдіть в акаунт!"); return; }

                if (isEnrolled) {
                    
                    window.location.href = `lesson.html?courseId=${courseId}&lessonId=${currentLessonId}`;
                } else {
                    
                    try {
                        const res = await fetch(`${API_URL}/api/courses/${courseId}/enroll`, {
                            method: 'POST',
                            headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' }
                        });
                        if (res.ok || res.status === 201) {
                            window.location.href = `lesson.html?courseId=${courseId}&lessonId=1`;
                        } else alert("Помилка запису!");
                    } catch (error) {}
                }
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
                    if (titleEl) titleEl.textContent = lesson.title;
                    if (contentEl) contentEl.textContent = lesson.content;
                });

            fetch(`${API_URL}/api/courses/${courseId}/syllabus`, { headers: { 'Authorization': 'Bearer ' + token } })
                .then(res => res.json())
                .then(modules => {
                    const sidebarNav = document.querySelector('.sidebar nav');
                    const sidebarTitle = document.querySelector('.sidebar h3');
                    let allLessons = [];
                    
                    if (sidebarNav) {
                        sidebarNav.innerHTML = '';
                        modules.forEach(mod => {
                            if (mod.lessons) {
                                allLessons.push(...mod.lessons);
                                
                                const isCurrentMod = mod.lessons.some(l => l.id == lessonId || l.lesson_id == lessonId);
                                if (isCurrentMod && sidebarTitle) sidebarTitle.textContent = mod.title;

                                mod.lessons.forEach(l => {
                                    const lId = l.id || l.lesson_id;
                                    const isActive = (lId == lessonId);
                                    sidebarNav.innerHTML += `
                                        <a href="lesson.html?courseId=${courseId}&lessonId=${lId}" style="padding: 10px 15px; border-radius: 8px; text-decoration: none; font-size: 14px; display: block; margin-bottom: 5px; ${isActive ? 'background: rgba(0, 173, 216, 0.1); color: #00ADD8; border-left: 3px solid #00ADD8;' : 'color: #94a3b8;'}">
                                            ${isActive ? '▶️' : '📄'} ${l.title}
                                        </a>`;
                                });
                            }
                        });
                        
                        const currentIndex = allLessons.findIndex(l => (l.id == lessonId || l.lesson_id == lessonId));
                        if (currentIndex !== -1 && currentIndex < allLessons.length - 1) {
                            nextLessonId = allLessons[currentIndex + 1].id || allLessons[currentIndex + 1].lesson_id;
                        }
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
                        if (nextLessonId) {
                            window.location.href = `lesson.html?courseId=${courseId}&lessonId=${nextLessonId}`;
                        } else {
                            alert("Вітаємо! Ви пройшли весь курс! 🏆");
                            window.location.href = `profile.html`;
                        }
                    } else alert("Помилка збереження прогресу.");
                } catch (error) { alert("Сервер недоступний."); }
            });
        }
    }
});