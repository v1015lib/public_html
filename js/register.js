// js/register.js

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
    
    // --- Elementos específicos para validación ---
    const usernameInput = document.getElementById('nombre_usuario');
    const usernameAvailabilityDiv = document.getElementById('username-availability');
    const userTypeInput = document.getElementById('id_tipo_cliente');
    
    let currentStep = 1;
    let debounceTimer;

    // --- FUNCIÓN PARA VALIDACIÓN DE USUARIO (DE TU CÓDIGO ORIGINAL) ---
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

    // --- LÓGICA DEL ASISTENTE (WIZARD) ---
    const updateWizardUI = () => {
        formSteps.forEach(step => {
            step.classList.toggle('active', parseInt(step.dataset.step) === currentStep);
        });

        progressSteps.forEach((step, index) => {
            step.classList.toggle('active', (index + 1) <= currentStep);
        });
        
        prevBtn.style.display = currentStep > 1 ? 'inline-block' : 'none';
        nextBtn.textContent = currentStep === formSteps.length ? 'Finalizar Registro' : 'Siguiente';
    };
    
    // --- LÓGICA DE VALIDACIÓN POR PASO ---
    const validateCurrentStep = () => {
        const activeStep = document.querySelector(`.form-step.active`);
        if (!activeStep) return false;
        
        const requiredInputs = activeStep.querySelectorAll('input[required]');
        for (const input of requiredInputs) {
            if (!input.value.trim()) {
                showNotification(`Por favor, completa el campo "${input.labels[0].textContent.replace('*', '').trim()}".`, 'error');
                input.focus();
                return false;
            }
        }
        
        if (currentStep === 2) { // Paso de Seguridad
            if (usernameAvailabilityDiv.classList.contains('error')) {
                showNotification('Por favor, elige un nombre de usuario disponible.', 'error');
                usernameInput.focus();
                return false;
            }
            const password = document.getElementById('password').value;
            const confirm = document.getElementById('password_confirm').value;
            if (password !== confirm) {
                showNotification('Las contraseñas no coinciden.', 'error');
                return false;
            }
        }
        return true;
    };

    // --- EVENTOS DE LOS BOTONES DE NAVEGACIÓN ---
    nextBtn.addEventListener('click', () => {
        if (!validateCurrentStep()) return;

        if (currentStep < formSteps.length) {
            currentStep++;
            updateWizardUI();
        } else {
            registerForm.dispatchEvent(new Event('submit', { cancelable: true }));
        }
    });
    
    prevBtn.addEventListener('click', () => {
        if (currentStep > 1) {
            currentStep--;
            updateWizardUI();
        }
    });

    // --- LÓGICA PARA DIAPOSITIVA DE ESTUDIANTE ---
    const studentChoiceButtons = document.querySelectorAll('.btn-choice');
    const studentFields = document.getElementById('student-fields');
    const isStudentInputHidden = document.getElementById('is_student_check');

    studentChoiceButtons.forEach(button => {
        button.addEventListener('click', () => {
            const isStudent = button.dataset.student === 'true';
            isStudentInputHidden.value = isStudent ? '1' : '0';
            userTypeInput.value = isStudent ? '2' : '1';

            document.getElementById('institucion').required = isStudent;
            document.getElementById('grado_actual').required = isStudent;
            
            if (isStudent) {
                studentFields.classList.remove('hidden');
            } else {
                studentFields.classList.add('hidden');
                setTimeout(() => {
                    if (currentStep < formSteps.length) {
                       currentStep++;
                       updateWizardUI();
                    }
                }, 200);
            }
        });
    });

    // --- ENVÍO FINAL DEL FORMULARIO ---
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        nextBtn.disabled = true;
        nextBtn.textContent = 'Procesando...';

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
                    <a href="login.php" class="submit-btn" style="text-decoration:none; display:inline-block; margin-top:20px;">Ir a Iniciar Sesión</a>
                </div>`;
            successContainer.style.display = 'block';

        } catch (error) {
            showNotification(error.message, 'error');
            nextBtn.disabled = false;
            nextBtn.textContent = 'Finalizar Registro';
        }
    });
    
    updateWizardUI(); // Inicializa la vista del wizard
});