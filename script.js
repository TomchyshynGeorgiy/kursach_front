// Знаходимо елементи на сторінці
const loginForm = document.querySelector('form');
const loginInput = document.getElementById('loginField');

// Слухаємо, коли користувач натисне кнопку "Увійти"
loginForm.addEventListener('submit', function(event) {
    event.preventDefault(); 
    
    const name = loginInput.value;
    const password = passwordField.value; // Додаємо отримання пароля

    if (!name) {
        alert("Будь ласка, введіть свій логін!");
    } else if (!password) {
        alert("Ви забули ввести пароль!"); // Перевірка на пустий пароль
    } else {
        localStorage.setItem('userName', name);
        alert("Вітаємо, " + name + "! Переходимо до Вашого кабінету.");
        window.location.href = "profile.html"; 
    }
});

// Твій попередній код для ока (переконайся, що він теж тут)
const passwordField = document.getElementById('passwordField');
const togglePassword = document.getElementById('togglePassword');

// Перевіряємо, чи є кнопка "око" на цій сторінці
if (togglePassword && passwordField) {
    togglePassword.addEventListener('click', function () {
        const type = passwordField.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordField.setAttribute('type', type);
        this.textContent = type === 'password' ? '👁️' : '🙈';
    });
}