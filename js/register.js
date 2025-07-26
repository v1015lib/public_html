// js/register.js

document.addEventListener('DOMContentLoaded', () => {
    // --- REFERENCIAS A ELEMENTOS DEL DOM ---
    const registerForm = document.getElementById('register-form');
    const studentCheck = document.getElementById('is_student_check');
    const studentFields = document.getElementById('student-fields');
    const userTypeInput = document.getElementById('id_tipo_cliente');
    const usernameInput = document.getElementById('nombre_usuario');
    const usernameAvailabilityDiv = document.getElementById('username-availability');
    
    // --- LÓGICA PARA EL CHECKBOX DE ESTUDIANTE ---
    if (studentCheck && studentFields) {
        studentCheck.addEventListener('change', () => {
            const studentInstitution = document.getElementById('institucion');
            const studentGrade = document.getElementById('grado_actual');

            if (studentCheck.checked) {
                studentFields.classList.remove('hidden');
                userTypeInput.value = '2'; // Asume que el ID de estudiante es 2
                studentInstitution.required = true;
                studentGrade.required = true;
            } else {
                studentFields.classList.add('hidden');
                userTypeInput.value = '1'; // Asume que el ID de cliente común es 1
                studentInstitution.required = false;
                studentGrade.required = false;
            }
        });
    }

    // --- LÓGICA PARA VALIDACIÓN DE USUARIO EN TIEMPO REAL ---
    let debounceTimer;
    usernameInput.addEventListener('input', () => {
        const username = usernameInput.value.trim();
        usernameAvailabilityDiv.textContent = '';
        clearTimeout(debounceTimer);

        if (username.length < 4) {
            usernameAvailabilityDiv.textContent = 'Mínimo 4 caracteres.';
            usernameAvailabilityDiv.className = 'availability-message error';
            return;
        }

        debounceTimer = setTimeout(async () => {
            try {
                const response = await fetch(`api/index.php?resource=check-username&username=${encodeURIComponent(username)}`);
                const data = await response.json();
                if (data.is_available) {
                    usernameAvailabilityDiv.textContent = 'Usuario disponible ✔';
                    usernameAvailabilityDiv.className = 'availability-message success';
                } else {
                    usernameAvailabilityDiv.textContent = 'Usuario no disponible ✖';
                    usernameAvailabilityDiv.className = 'availability-message error';
                }
            } catch (error) { console.error("Error al verificar usuario:", error); }
        }, 500);
    });

    // --- LÓGICA PARA EL ENVÍO DEL FORMULARIO ---
    registerForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        
        const password = document.getElementById('password').value;
        const passwordConfirm = document.getElementById('password_confirm').value;
        const messageDiv = document.getElementById('form-message');

        if (password !== passwordConfirm) {
            messageDiv.className = 'form-message error';
            messageDiv.textContent = 'Las contraseñas no coinciden.';
            return;
        }

        const formData = new FormData(registerForm);
        const data = Object.fromEntries(formData.entries());

        try {
            const response = await fetch('api/index.php?resource=register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Error en el servidor.');

            // Lógica de éxito: ocultar formulario y mostrar mensaje
            registerForm.style.display = 'none';
            document.getElementById('register-title-container').style.display = 'none';
            document.getElementById('form-footer-link').style.display = 'none';
            document.getElementById('success-container').style.display = 'block';

        } catch (error) {
            messageDiv.className = 'form-message error';
            messageDiv.textContent = error.message;
        }
    });
});