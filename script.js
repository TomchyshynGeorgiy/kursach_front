(() => {
    const API_URL = "http://localhost:8080";

    const state = {
        adminCourseId: null,
        adminModules: [],
        currentCourseId: null,
        currentLessonId: null,
        syllabus: [],
        lessons: [],
        completedLessonIds: []
    };

    const $ = (selector) => document.querySelector(selector);
    const $$ = (selector) => Array.from(document.querySelectorAll(selector));
    const params = () => new URLSearchParams(window.location.search);

    function getToken() {
        return localStorage.getItem("userToken");
    }

    function setToken(token) {
        if (token) {
            localStorage.setItem("userToken", token);
        }
    }

    function tokenFromResponse(data) {
        return data?.token || data?.jwt || data?.JWT || "";
    }

    function logout() {
        localStorage.removeItem("userToken");
        localStorage.removeItem("userName");
        window.location.href = "index.html";
    }

    function parseJwt(token) {
        try {
            const payload = token.split(".")[1];
            const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
            return JSON.parse(decodeURIComponent(escape(json)));
        } catch {
            return {};
        }
    }

    function checkAuth({ required = false, admin = false } = {}) {
        const token = getToken();
        if (!token) {
            if (required) window.location.href = "index.html";
            return null;
        }

        const user = parseJwt(token);
        if (admin && user.role !== "admin") {
            alert("Доступ дозволено тільки адміністратору.");
            window.location.href = "profile.html";
            return null;
        }

        return { token, user };
    }

    function authHeaders() {
        const token = getToken();
        return token ? { Authorization: `Bearer ${token}` } : {};
    }

    async function api(path, options = {}) {
        const headers = {
            ...(options.body ? { "Content-Type": "application/json" } : {}),
            ...(options.auth ? authHeaders() : {}),
            ...(options.headers || {})
        };

        const response = await fetch(`${API_URL}${path}`, {
            ...options,
            headers
        });

        const contentType = response.headers.get("content-type") || "";
        const data = contentType.includes("application/json") ? await response.json() : null;

        if (!response.ok) {
            const error = new Error(data?.error || `HTTP ${response.status}`);
            error.status = response.status;
            error.data = data;
            throw error;
        }

        return data;
    }

    function idOf(entity, ...keys) {
        for (const key of keys) {
            if (entity?.[key] !== undefined && entity?.[key] !== null) {
                return Number(entity[key]);
            }
        }
        return null;
    }

    function modulesFromSyllabus(data) {
        if (Array.isArray(data)) return data;
        return data?.modules || [];
    }

    function flattenLessons(modules) {
        return modules.flatMap((module) =>
            (module.lessons || []).map((lesson) => ({
                ...lesson,
                id: idOf(lesson, "id", "lesson_id"),
                moduleId: idOf(module, "id", "module_id"),
                moduleTitle: module.title
            }))
        );
    }

    function lessonIndex(lessons, lessonId) {
        return lessons.findIndex((lesson) => Number(lesson.id) === Number(lessonId));
    }

    function previousLessonId(lessons, lessonId) {
        const index = lessonIndex(lessons, lessonId);
        return index > 0 ? lessons[index - 1].id : null;
    }

    function nextLessonId(lessons, lessonId) {
        const index = lessonIndex(lessons, lessonId);
        return index !== -1 && index < lessons.length - 1 ? lessons[index + 1].id : null;
    }

    function firstUnfinishedLessonId(lessons, completedIds) {
        if (!lessons.length) return null;
        const completed = new Set(completedIds.map(Number));
        return (lessons.find((lesson) => !completed.has(Number(lesson.id))) || lessons[0]).id;
    }

    function setText(selector, value) {
        const element = $(selector);
        if (element) element.textContent = value || "";
    }

    function setActiveTab(activeLink) {
        $$(".sidebar-nav a").forEach((link) => link.classList.remove("active"));
        activeLink?.classList.add("active");
    }

    function renderCards(container, courses, { enrolled = false } = {}) {
        if (!courses.length) {
            container.innerHTML = `<p style="color: #94a3b8;">Курсів поки немає.</p>`;
            return;
        }

        container.innerHTML = courses.map((course) => {
            const courseId = idOf(course, "id", "course_id");
            return `
                <div class="features-box" style="margin: 0; display: flex; flex-direction: column; ${enrolled ? "border: 1px solid #10b981;" : ""}">
                    <h3 style="color: ${enrolled ? "#10b981" : "#00ADD8"}; margin-bottom: 10px;">${course.title}</h3>
                    <p style="color: #94a3b8; font-size: 14px; line-height: 1.5; margin-bottom: 20px; flex-grow: 1;">${course.description || "Опис відсутній"}</p>
                    <a href="course-info.html?id=${courseId}" style="background-color: ${enrolled ? "#10b981" : "#00ADD8"}; color: #fff; padding: 8px 16px; border-radius: 6px; text-decoration: none; font-size: 14px; font-weight: bold;">
                        ${enrolled ? "Продовжити навчання" : "Детальніше"}
                    </a>
                </div>
            `;
        }).join("");
    }

    function initGlobalAuthUi() {
        $$("[data-logout]").forEach((button) => {
            button.addEventListener("click", logout);
        });

        const auth = checkAuth();
        const adminLink = $("#adminLink");
        if (adminLink && auth?.user?.role !== "admin") {
            adminLink.style.display = "none";
        }
    }

    function initAuthForms() {
        const loginForm = $("#loginForm");
        loginForm?.addEventListener("submit", async (event) => {
            event.preventDefault();

            try {
                const data = await api("/auth/login", {
                    method: "POST",
                    body: JSON.stringify({
                        email: $("#loginField").value.trim(),
                        password: $("#passwordField").value
                    })
                });

                setToken(tokenFromResponse(data));
                localStorage.setItem("userName", $("#loginField").value.trim());
                window.location.href = "profile.html";
            } catch {
                const error = $("#loginError");
                if (error) error.style.display = "block";
            }
        });

        const registerForm = $("#registerForm");
        registerForm?.addEventListener("submit", async (event) => {
            event.preventDefault();

            const password = $("#regPassword").value;
            const confirmation = $("#regConfirmPassword").value;
            const passwordError = $("#passwordError");

            if (password !== confirmation) {
                if (passwordError) passwordError.style.display = "block";
                return;
            }

            try {
                const data = await api("/auth/register", {
                    method: "POST",
                    body: JSON.stringify({
                        name: $("#regLogin").value.trim(),
                        email: $("#regEmail").value.trim(),
                        password
                    })
                });

                setToken(tokenFromResponse(data));
                localStorage.setItem("userName", $("#regLogin").value.trim());
                window.location.href = "profile.html";
            } catch (error) {
                alert(error.message);
            }
        });

        $$(".toggle-password-btn").forEach((button) => {
            button.addEventListener("click", (event) => {
                event.preventDefault();
                const input = button.parentElement.querySelector("input");
                if (input) input.type = input.type === "password" ? "text" : "password";
            });
        });
    }

    async function loadProfileName() {
        try {
            const profile = await api("/api/profile", { auth: true });
            const displayName = profile.name || localStorage.getItem("userName") || "Студент";
            setText("#profileName", displayName);
            const avatar = $(".avatar");
            if (avatar) avatar.textContent = displayName.charAt(0).toUpperCase();
            return profile;
        } catch {
            return null;
        }
    }

    async function renderAvailableCourses() {
        const container = $("#profileContent");
        if (!container) return;

        setText("#profileHeading", "Доступні курси 🚀");
        container.innerHTML = `<p style="color: #94a3b8;">Завантаження...</p>`;

        try {
            const courses = await api("/api/courses");
            renderCards(container, courses);
        } catch {
            container.innerHTML = `<p style="color: #ef4444;">Не вдалося завантажити курси.</p>`;
        }
    }

    async function renderMyCourses() {
        const container = $("#profileContent");
        if (!container) return;

        setText("#profileHeading", "Мої курси 📚");
        container.innerHTML = `<p style="color: #94a3b8;">Завантаження...</p>`;

        try {
            const courses = await api("/api/profile/courses", { auth: true });
            renderCards(container, courses, { enrolled: true });
        } catch {
            container.innerHTML = `<p style="color: #ef4444;">Не вдалося завантажити ваші курси.</p>`;
        }
    }

    function renderSettingsForm() {
        const container = $("#profileContent");
        if (!container) return;

        setText("#profileHeading", "Налаштування профілю ⚙️");
        const savedEmail = localStorage.getItem("userName") || "";
        const savedName = $("#profileName")?.textContent || "";

        container.innerHTML = `
            <div class="features-box" style="grid-column: 1 / -1; max-width: 520px; margin: 0;">
                <form id="settingsForm" style="display: flex; flex-direction: column; gap: 15px;">
                    <input type="text" id="settingsName" value="${savedName}" placeholder="Ім'я" required>
                    <input type="email" id="settingsEmail" value="${savedEmail}" placeholder="Email" required>
                    <button type="submit">Зберегти зміни</button>
                </form>
            </div>
        `;

        $("#settingsForm").addEventListener("submit", async (event) => {
            event.preventDefault();

            const name = $("#settingsName").value.trim();
            const email = $("#settingsEmail").value.trim();

            try {
                await api("/api/profile", {
                    method: "PUT",
                    auth: true,
                    body: JSON.stringify({ name, email })
                });

                localStorage.setItem("userName", email);
                setText("#profileName", name);
                const avatar = $(".avatar");
                if (avatar) avatar.textContent = name.charAt(0).toUpperCase();
                alert("Профіль оновлено.");
            } catch (error) {
                alert(error.message);
            }
        });
    }

    function initProfilePage() {
        if (!$("#profileContent")) return;
        if (!checkAuth({ required: true })) return;

        loadProfileName();
        renderAvailableCourses();

        $("#dashboardTab")?.addEventListener("click", (event) => {
            event.preventDefault();
            setActiveTab(event.currentTarget);
            renderAvailableCourses();
        });

        $("#myCoursesTab")?.addEventListener("click", (event) => {
            event.preventDefault();
            setActiveTab(event.currentTarget);
            renderMyCourses();
        });

        $("#settingsTab")?.addEventListener("click", (event) => {
            event.preventDefault();
            setActiveTab(event.currentTarget);
            renderSettingsForm();
        });
    }

    function setAdminStep(step) {
        const activeStyles = { background: "#00ADD8", color: "#0f172a" };
        const idleStyles = { background: "#1e293b", color: "#94a3b8" };
        const badges = {
            course: $("#stepCourseBadge"),
            module: $("#stepModuleBadge"),
            lesson: $("#stepLessonBadge")
        };

        Object.entries(badges).forEach(([name, element]) => {
            if (!element) return;
            Object.assign(element.style, name === step ? activeStyles : idleStyles);
        });
    }

    function setAdminStatus(message) {
        setText("#adminStatus", message);
    }

    function showAdminResult(message) {
        const result = $("#adminResult");
        if (!result) return;
        result.hidden = false;
        result.textContent = message;
    }

    function updateModuleSelect() {
        const select = $("#moduleSelect");
        if (!select) return;

        select.innerHTML = state.adminModules.map((module) =>
            `<option value="${module.id}">${module.title}</option>`
        ).join("");
    }

    async function createCourse(payload) {
        const data = await api("/api/admin/courses", {
            method: "POST",
            auth: true,
            body: JSON.stringify(payload)
        });
        return idOf(data, "course_id", "id");
    }

    async function createModule(courseId, payload) {
        const data = await api(`/api/admin/courses/${courseId}/modules`, {
            method: "POST",
            auth: true,
            body: JSON.stringify(payload)
        });
        return idOf(data, "module_id", "id");
    }

    async function createLesson(moduleId, payload) {
        const data = await api(`/api/admin/modules/${moduleId}/lessons`, {
            method: "POST",
            auth: true,
            body: JSON.stringify(payload)
        });
        return idOf(data, "lesson_id", "id");
    }

    function initAdminPage() {
        const courseForm = $("#addCourseForm");
        if (!courseForm) return;
        if (!checkAuth({ required: true, admin: true })) return;

        const moduleForm = $("#addModuleForm");
        const lessonForm = $("#addLessonForm");
        setAdminStep("course");

        courseForm.addEventListener("submit", async (event) => {
            event.preventDefault();

            try {
                const courseId = await createCourse({
                    title: $("#courseTitle").value.trim(),
                    description: $("#courseDesc").value.trim()
                });

                if (!courseId) throw new Error("Сервер не повернув course_id");

                state.adminCourseId = courseId;
                courseForm.hidden = true;
                moduleForm.hidden = false;
                setAdminStep("module");
                setText("#createdCourseInfo", `Курс створено. ID курсу: ${courseId}`);
                setAdminStatus("Додавайте модулі. Після першого модуля можна додавати уроки.");
                showAdminResult("Курс створено. Тепер можна додати перший модуль.");
            } catch (error) {
                alert(error.message);
            }
        });

        moduleForm?.addEventListener("submit", async (event) => {
            event.preventDefault();

            try {
                const title = $("#moduleTitle").value.trim();
                const moduleId = await createModule(state.adminCourseId, {
                    title,
                    order_num: Number($("#moduleOrder").value || 0)
                });

                if (!moduleId) throw new Error("Сервер не повернув module_id");

                state.adminModules.push({ id: moduleId, title });
                updateModuleSelect();
                moduleForm.reset();
                $("#moduleOrder").value = state.adminModules.length + 1;
                lessonForm.hidden = false;
                setAdminStep("lesson");
                setText("#createdModuleInfo", "Оберіть модуль та додавайте уроки. Можна повернутись і додати ще модулі.");
                setAdminStatus("Модуль додано. Можете додавати уроки або створити ще один модуль.");
                showAdminResult(`Модуль "${title}" створено. ID модуля: ${moduleId}`);
            } catch (error) {
                alert(error.message);
            }
        });

        lessonForm?.addEventListener("submit", async (event) => {
            event.preventDefault();

            try {
                const moduleId = Number($("#moduleSelect").value);
                const title = $("#lessonTitle").value.trim();
                const lessonId = await createLesson(moduleId, {
                    title,
                    content: $("#lessonContent").value.trim(),
                    order_num: Number($("#lessonOrder").value || 0)
                });

                if (!lessonId) throw new Error("Сервер не повернув lesson_id");

                lessonForm.reset();
                updateModuleSelect();
                $("#lessonOrder").value = 1;
                showAdminResult(`Урок "${title}" створено. ID уроку: ${lessonId}. Можете додати ще урок у будь-який модуль.`);
            } catch (error) {
                alert(error.message);
            }
        });
    }

    async function loadCourse(courseId) {
        return api(`/api/courses/${courseId}`);
    }

    async function loadSyllabus(courseId) {
        return modulesFromSyllabus(await api(`/api/courses/${courseId}/syllabus`));
    }

    async function loadProgress(courseId) {
        try {
            const data = await api(`/api/courses/${courseId}/progress`, { auth: true });
            return data.completed_lesson_ids || [];
        } catch {
            return [];
        }
    }

    function renderCourse(course) {
        setText("#courseTitleHeading", course.title);
        setText("#courseDescription", course.description);
        document.title = `${course.title} | GO STUDY`;
    }

    function renderSyllabus(courseId, modules, completedIds = []) {
        const container = $("#courseSyllabus");
        if (!container) return;

        if (!modules.length) {
            container.innerHTML = `
                <div class="features-box" style="margin: 0 auto 15px auto; padding: 25px; box-sizing: border-box; width: 100%; max-width: 650px; color: #94a3b8;">
                    У цьому курсі ще немає модулів.
                </div>
            `;
            return;
        }

        const completed = new Set(completedIds.map(Number));
        container.innerHTML = modules.map((module) => `
            <div class="features-box" style="margin: 0 auto 15px auto; padding: 25px; box-sizing: border-box; width: 100%; max-width: 650px;">
                <h3 style="color: #00ADD8; margin-bottom: 15px; font-size: 18px;">${module.title}</h3>
                <ul style="list-style-type: none; padding-left: 0; margin: 0; display: flex; flex-direction: column; gap: 12px;">
                    ${(module.lessons || []).map((lesson) => {
                        const lessonId = idOf(lesson, "id", "lesson_id");
                        const done = completed.has(Number(lessonId));
                        return `
                            <li style="font-size: 15px;">
                                <a href="lesson.html?courseId=${courseId}&lessonId=${lessonId}" style="color: ${done ? "#10b981" : "#94a3b8"}; text-decoration: none;">
                                    ${done ? "✅" : "📄"} ${lesson.order_num || ""}. ${lesson.title}
                                </a>
                            </li>
                        `;
                    }).join("")}
                </ul>
            </div>
        `).join("");
    }

    async function enrollInCourse(courseId) {
        try {
            await api(`/api/courses/${courseId}/enroll`, {
                method: "POST",
                auth: true
            });
        } catch (error) {
            if (error.status !== 409) throw error;
        }
    }

    function wireContinueButton(courseId, lessons, completedIds) {
        const button = $("#continueCourseBtn");
        if (!button) return;

        const lessonId = firstUnfinishedLessonId(lessons, completedIds);
        button.textContent = completedIds.length ? "▶️ Продовжити навчання" : "🚀 Почати навчання";
        button.disabled = !lessonId;
        button.style.opacity = lessonId ? "1" : "0.55";

        button.addEventListener("click", async () => {
            if (!checkAuth({ required: true })) return;

            try {
                await enrollInCourse(courseId);
                window.location.href = `lesson.html?courseId=${courseId}&lessonId=${lessonId}`;
            } catch (error) {
                alert(error.message);
            }
        });
    }

    async function initCourseInfoPage() {
        if (!$("#courseSyllabus")) return;

        const courseId = Number(params().get("id"));
        if (!courseId) {
            setText("#courseTitleHeading", "Курс не знайдено");
            setText("#courseDescription", "В URL немає id курсу.");
            return;
        }

        try {
            const [course, modules, completedIds] = await Promise.all([
                loadCourse(courseId),
                loadSyllabus(courseId),
                getToken() ? loadProgress(courseId) : Promise.resolve([])
            ]);

            state.currentCourseId = courseId;
            state.syllabus = modules;
            state.lessons = flattenLessons(modules);
            state.completedLessonIds = completedIds;

            renderCourse(course);
            renderSyllabus(courseId, modules, completedIds);
            wireContinueButton(courseId, state.lessons, completedIds);
        } catch (error) {
            setText("#courseTitleHeading", "Не вдалося завантажити курс");
            setText("#courseDescription", error.message);
        }
    }

    async function loadLesson(lessonId) {
        return api(`/api/lessons/${lessonId}`, { auth: true });
    }

    function renderLesson(lesson) {
        setText("#lessonTitle", lesson.title || "Урок");
        setText("#lessonContent", lesson.content || "Матеріали уроку ще не додані.");
        document.title = `${lesson.title || "Урок"} | GO STUDY`;
    }

    function renderLessonNavigation(courseId, lessons, currentLessonId, completedIds) {
        const nav = $("#lessonNavigation");
        if (!nav) return;

        const completed = new Set(completedIds.map(Number));
        nav.innerHTML = lessons.map((lesson) => {
            const active = Number(lesson.id) === Number(currentLessonId);
            const done = completed.has(Number(lesson.id));
            return `
                <a href="lesson.html?courseId=${courseId}&lessonId=${lesson.id}"
                   style="background: ${active ? "rgba(0, 173, 216, 0.1)" : "transparent"}; color: ${active ? "#00ADD8" : "#94a3b8"}; padding: 10px 15px; border-radius: 8px; text-decoration: none; font-size: 14px; border-left: ${active ? "3px solid #00ADD8" : "3px solid transparent"};">
                    ${done ? "✅" : active ? "▶️" : "📄"} ${lesson.title}
                </a>
            `;
        }).join("");
    }

    function wireLessonButtons(courseId, lessonId, lessons) {
        const previousId = previousLessonId(lessons, lessonId);
        const nextId = nextLessonId(lessons, lessonId);
        const previousButton = $("#previousLessonBtn");
        const completeButton = $("#completeLessonBtn");

        if (previousButton) {
            previousButton.disabled = !previousId;
            previousButton.style.opacity = previousId ? "1" : "0.45";
            previousButton.addEventListener("click", () => {
                if (previousId) {
                    window.location.href = `lesson.html?courseId=${courseId}&lessonId=${previousId}`;
                }
            });
        }

        if (completeButton) {
            completeButton.textContent = nextId ? "✅ Завершити і перейти далі" : "🏁 Завершити курс";
            completeButton.addEventListener("click", async () => {
                try {
                    await api(`/api/lessons/${lessonId}/complete`, {
                        method: "POST",
                        auth: true,
                        body: JSON.stringify({ completed: true })
                    });

                    window.location.href = nextId
                        ? `lesson.html?courseId=${courseId}&lessonId=${nextId}`
                        : `course-info.html?id=${courseId}`;
                } catch (error) {
                    alert(error.message);
                }
            });
        }
    }

    async function initLessonPage() {
        if (!$("#backToCourseLink") || !$("#completeLessonBtn")) return;
        if (!checkAuth({ required: true })) return;

        const courseId = Number(params().get("courseId"));
        const lessonId = Number(params().get("lessonId"));

        if (!courseId || !lessonId) {
            setText("#lessonTitle", "Урок не знайдено");
            setText("#lessonContent", "В URL немає courseId або lessonId.");
            return;
        }

        const backLink = $("#backToCourseLink");
        if (backLink) backLink.href = `course-info.html?id=${courseId}`;

        try {
            const [lesson, modules, completedIds] = await Promise.all([
                loadLesson(lessonId),
                loadSyllabus(courseId),
                loadProgress(courseId)
            ]);

            const lessons = flattenLessons(modules);
            state.currentCourseId = courseId;
            state.currentLessonId = lessonId;
            state.syllabus = modules;
            state.lessons = lessons;
            state.completedLessonIds = completedIds;

            renderLesson(lesson);
            renderLessonNavigation(courseId, lessons, lessonId, completedIds);
            wireLessonButtons(courseId, lessonId, lessons);
        } catch (error) {
            setText("#lessonTitle", "Не вдалося завантажити урок");
            setText("#lessonContent", error.message);
        }
    }

    document.addEventListener("DOMContentLoaded", () => {
        initGlobalAuthUi();
        initAuthForms();
        initProfilePage();
        initAdminPage();
        initCourseInfoPage();
        initLessonPage();
    });
})();
