const API_URL = "http://localhost:8080";

const registerForm = document.getElementById('registerForm');
if (registerForm) {
    registerForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        
        const pass1Input = document.getElementById('regPassword');
        const pass2Input = document.getElementById('regConfirmPassword');
        const errorMsg = document.getElementById('passwordError');
        
        const pass1 = pass1Input.value;
        const pass2 = pass2Input.value;
        
        pass1Input.style.borderColor = '#334155';
        pass2Input.style.borderColor = '#334155';
        errorMsg.style.display = 'none';

        if (pass1 !== pass2) {
            pass1Input.style.borderColor = '#ef4444';
            pass2Input.style.borderColor = '#ef4444';
            errorMsg.style.display = 'block';
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
                alert("Помилка. Можливо, такий користувач або email вже існує в базі.");
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
        errorMsg.style.display = 'none';
    }

    currentLoginInput.addEventListener('input', hideError);
    currentPassInput.addEventListener('input', hideError);

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
                errorMsg.style.display = 'block';
            }
        } catch (error) {
            console.error("Помилка:", error);
            alert("Сервер недоступний!");
        }
    });
}

const toggleButtons = document.querySelectorAll('.toggle-password-btn');

toggleButtons.forEach(button => {
    button.addEventListener('click', function() {
        
        const container = this.parentNode; 
        const input = container.querySelector('input');
        const svg = this.querySelector('svg');
        
        if (input && input.type === 'password') {
            input.type = 'text';
            if (svg) svg.style.stroke = '#00ADD8'; 
        } else if (input) {
            input.type = 'password';
            if (svg) svg.style.stroke = '#F1F5F9'; 
        }
    });
});

const courseGrid = document.getElementById('courseGrid');

if (courseGrid) {
    const courses = [
        { title: 'Основи HTML/CSS', progress: 80, color: '#00ADD8' },
        { title: 'JS для початківців', progress: 30, color: '#00ADD8' },
        { title: 'Робота з Git та GitHub', progress: 100, color: '#28a745' },
        { title: 'Основи баз даних', progress: 15, color: '#00ADD8' } 
    ];

    courseGrid.innerHTML = '';

    courses.forEach(course => {
        let statusText;
        if (course.progress === 100) {
            statusText = 'Виконано! ✅';
        } else {
            statusText = `Прогрес: ${course.progress}%`;
        }

        const cardHTML = `
            <div class="course-card">
                <h3>${course.title}</h3>
                <div class="progress-container">
                    <div class="progress-bar" style="width: ${course.progress}%; background: ${course.color};"></div>
                </div>
                <p>${statusText}</p>
            </div>
        `;
        
        courseGrid.innerHTML += cardHTML;
    });
}