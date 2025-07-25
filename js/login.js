// js/login.js

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const messageDiv = document.getElementById('form-message');

    if (loginForm) {
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const formData = new FormData(loginForm);
            const data = Object.fromEntries(formData.entries());

            try {
                const response = await fetch('api/index.php?resource=login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                const result = await response.json();

                if (response.ok && result.success) {
                    // Éxito en el login
                    messageDiv.className = 'form-message success';
                    messageDiv.textContent = result.message;

                    // Redirigir a la página principal después de 1 segundo
                    setTimeout(() => {
                        window.location.href = 'index.php';
                    }, 1000);

                } else {
                    // Error en el login
                    throw new Error(result.error || 'Ocurrió un error desconocido.');
                }

            } catch (error) {
                messageDiv.className = 'form-message error';
                messageDiv.textContent = error.message;
            }
        });
    }
});