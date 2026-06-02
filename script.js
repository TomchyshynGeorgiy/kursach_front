const registerForm = document.getElementById('registerForm');
if (registerForm) {
    registerForm.addEventListener('submit', function(event) {
        event.preventDefault();
        const newLogin = document.getElementById('regLogin').value;
        localStorage.setItem('userName', newLogin);
        window.location.href = 'index.html'; 
    });
}

const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', function(event) {
        event.preventDefault();
        const currentLogin = document.getElementById('loginField').value;
        localStorage.setItem('userName', currentLogin);
        window.location.href = 'profile.html';
    });
}

const toggleButtons = document.querySelectorAll('.toggle-password-btn');

toggleButtons.forEach(button => {
    button.addEventListener('click', function() {
        const input = this.previousElementSibling;
        const svg = this.querySelector('svg');
        
        if (input.type === 'password') {
            input.type = 'text';
            svg.style.stroke = '#00ADD8'; 
        } else {
            input.type = 'password';
            svg.style.stroke = '#F1F5F9'; 
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