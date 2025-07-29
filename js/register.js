// --- 1. IMPORTAMOS LA FUNCIÓN PARA MOSTRAR NOTIFICACIONES ---
import { showNotification } from './notification_handler.js';

document.addEventListener('DOMContentLoaded', () => {
    // --- REFERENCIAS A ELEMENTOS DEL DOM ---
    const prevBtn = document.getElementById('btn-prev');
    const nextBtn = document.getElementById('btn-next');
    const formSteps = document.querySelectorAll('.form-step');
    const progressSteps = document.querySelectorAll('.progress-step');
    const registerForm = document.getElementById('register-form');
    const wizardContainer = document.querySelector('.wizard-container');
    const successContainer = document.getElementById('success-container');
    const formFooterLink = document.querySelector('.form-footer-link');

    // Elementos del formulario original para validaciones
    const studentCheck = document.getElementById('is_student_check');
    const studentFields = document.getElementById('student-fields');
    const userTypeInput = document.getElementById('id_tipo_cliente');
    const usernameInput = document.getElementById('nombre_usuario');
    const usernameAvailabilityDiv = document.getElementById('username-availability');
    
    let currentStep = 1;
    let debounceTimer;

    // --- CÓDIGO ORIGINAL PARA VALIDACIÓN DE USUARIO EN TIEMPO REAL (FUNCIONA) ---
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

    // --- LÓGICA DEL FORMULARIO INTERACTIVO (CORREGIDA) ---

    const updateWizardUI = () => {
        formSteps.forEach(step => step.classList.toggle('active', parseInt(step.dataset.step) === currentStep));
        progressSteps.forEach((step, index) => step.classList.toggle('active', (index + 1) <= currentStep));
        prevBtn.style.visibility = currentStep === 1 ? 'hidden' : 'visible';
        nextBtn.textContent = currentStep === formSteps.length ? 'Crear Cuenta' : 'Siguiente';
    };

    const validateCurrentStep = () => {
        const activeStep = document.querySelector(`.form-step.active`);
        if (!activeStep) return false;
        
        const requiredInputs = activeStep.querySelectorAll('input[required]');
        for (const input of requiredInputs) {
            if (!input.value.trim()) {
                // --- 2. USAMOS LA NOTIFICACIÓN EN LUGAR DE ALERT ---
                showNotification(`Por favor, completa el campo "${input.labels[0].textContent.replace('*', '').trim()}".`, 'error');
                input.focus();
                return false;
            }
        }
        
        if (currentStep === 1) {
            if (usernameAvailabilityDiv.classList.contains('error')) {
                showNotification('Por favor, elige un nombre de usuario disponible.', 'error');
                usernameInput.focus();
                return false;
            }
        }
        
        if (currentStep === 2) {
             const password = document.getElementById('password').value;
             const confirm = document.getElementById('password_confirm').value;
             if (password !== confirm) {
                 showNotification('Las contraseñas no coinciden.', 'error');
                 return false;
             }
        }
        return true;
    };

    nextBtn.addEventListener('click', async () => {
        if (!validateCurrentStep()) {
            return; // Detiene si la validación falla
        }

        if (currentStep < formSteps.length) {
            currentStep++;
            updateWizardUI();
        } else {
            // Lógica de envío final
            const formData = new FormData(registerForm);
            const data = Object.fromEntries(formData.entries());
            data.preferencias = formData.getAll('preferencias[]');
            
            try {
                const response = await fetch('api/index.php?resource=register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                const result = await response.json();
                if (!response.ok) throw new Error(result.error || 'Error en el servidor.');

                wizardContainer.style.display = 'none';
                formFooterLink.style.display = 'none';
                successContainer.innerHTML = `
                    <div class="wizard-content" style="text-align:center; padding: 4rem;">
                        <h2>¡Registro Exitoso!</h2>
                        <p>Tu cuenta ha sido creada. Ahora puedes iniciar sesión.</p>
                        <a href="login.php" class="submit-btn" style="width: auto; padding: 0.8rem 2rem;">Ir a Iniciar Sesión</a>
                    </div>`;
                successContainer.style.display = 'block';

            } catch (error) {
                showNotification(error.message, 'error');
            }
        }
    });
    
    prevBtn.addEventListener('click', () => {
        if (currentStep > 1) {
            currentStep--;
            updateWizardUI();
        }
    });

    // Lógica para el checkbox de estudiante (de tu script original)
    if (studentCheck && studentFields) {
        studentCheck.addEventListener('change', () => {
            studentFields.classList.toggle('hidden', !studentCheck.checked);
            const studentInstitution = document.getElementById('institucion');
            const studentGrade = document.getElementById('grado_actual');
            studentInstitution.required = studentCheck.checked;
            studentGrade.required = studentCheck.checked;
            userTypeInput.value = studentCheck.checked ? '2' : '1';
        });
    }

    updateWizardUI(); // Para inicializar la vista
});