const API_URL = "http://localhost:8080";

document.addEventListener("DOMContentLoaded", () => {
   
    const loginForm = document.getElementById("loginForm");

    if (loginForm) {
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault(); 

            const emailValue = document.getElementById("loginField").value;
            const passwordValue = document.getElementById("passwordField").value;
            const errorText = document.getElementById("loginError");

            try {
     
                const response = await fetch(`${API_URL}/auth/login`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
  
                    body: JSON.stringify({ 
                        email: emailValue, 
                        password: passwordValue 
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    
                    localStorage.setItem("userToken", data.token); 
                    
                    window.location.href = "profile.html";
                } else {
                    errorText.style.display = "block";
                }
            } catch (error) {
                console.error("Помилка підключення:", error);
                alert("Сервер недоступний! Перевірте підключення або скажіть Максиму запустити бекенд.");
            }
        });
    }
  
    const registerForm = document.getElementById("registerForm");

    if (registerForm) {
        registerForm.addEventListener("submit", async (e) => {
            e.preventDefault(); 

            const loginValue = document.getElementById("regLogin").value; 
            const emailValue = document.getElementById("regEmail").value;
            const passwordValue = document.getElementById("regPassword").value;
            const confirmPasswordValue = document.getElementById("regConfirmPassword").value;
            const passwordError = document.getElementById("passwordError");

            if (passwordValue !== confirmPasswordValue) {
                passwordError.style.display = "block";
                return; 
            } else {
                passwordError.style.display = "none"; 
            }

            try {
                
                const response = await fetch(`${API_URL}/auth/register`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ 
                        username: loginValue, 
                        email: emailValue, 
                        password: passwordValue 
                    })
                });

                if (response.ok) {
                    alert("Реєстрація успішна! 🎉 Тепер ви можете увійти.");
                    window.location.href = "index.html"; 
                } else {
                    alert("Помилка реєстрації. Можливо, такий користувач або email вже існує.");
                }
            } catch (error) {
                console.error("Помилка підключення:", error);
                alert("Сервер недоступний!");
            }
        });
    }
});