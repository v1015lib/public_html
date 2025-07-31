import { showNotification } from './notification_handler.js';

document.addEventListener('DOMContentLoaded', () => {
    // --- REFERENCIAS A ELEMENTOS DEL DOM ---
    const prevBtn = document.getElementById('btn-prev');
    const nextBtn = document.getElementById('btn-next');
    const formSteps = document.querySelectorAll('.form-step');
    const registerForm = document.getElementById('register-form');
    const stepIndicator = document.getElementById('current-step-indicator');

    // Referencias para validación en tiempo real
    const usernameInput = document.getElementById('nombre_usuario');
    const usernameAvailabilityDiv = document.getElementById('username-availability');
    const phoneInput = document.getElementById('telefono');
    const phoneAvailabilityDiv = document.getElementById('phone-availability');
    const emailInput = document.getElementById('email');
    const emailAvailabilityDiv = document.getElementById('email-availability');

    const userTypeInput = document.getElementById('id_tipo_cliente');
    const studentChoiceButtons = document.querySelectorAll('.btn-choice');

    let currentStep = 1;
    const totalSteps = 5;

    // --- FUNCIÓN GENÉRICA PARA VERIFICACIÓN EN TIEMPO REAL ---
    const setupRealTimeValidation = (inputElement, availabilityDiv, resourceName, validationRegex, formatMessage, minLength = 1) => {
        let debounceTimer;
        inputElement.addEventListener('input', () => {
            const value = inputElement.value.trim();
            availabilityDiv.textContent = '';
            // Limpiamos las clases para que no se muestre la caja vacía
            availabilityDiv.className = 'form-message'; // <- Usa la clase base
            clearTimeout(debounceTimer);

            if (value.length < minLength || (validationRegex && !validationRegex.test(value))) {
                availabilityDiv.textContent = formatMessage;
                // CORRECCIÓN: Usa la clase 'form-message' para que se vea como alerta
                availabilityDiv.className = 'form-message error';
                return;
            }

            debounceTimer = setTimeout(async () => {
                try {
                    const paramName = resourceName.replace('check-', '');
                    const response = await fetch(`api/index.php?resource=${resourceName}&${paramName}=${encodeURIComponent(value)}`);
                    const data = await response.json();
                    const fieldName = inputElement.labels[0].textContent.replace('*', '').trim();
                    availabilityDiv.textContent = data.is_available ? `${fieldName} disponible ✔` : `${fieldName} ya registrado ✖`;
                    // CORRECCIÓN: Usa la clase 'form-message' para que se vea como alerta
                    availabilityDiv.className = data.is_available ? 'form-message success' : 'form-message error';
                } catch (error) { console.error(`Error al verificar ${resourceName}:`, error); }
            }, 500);
        });
    };

    // Activamos la validación para los tres campos
    setupRealTimeValidation(usernameInput, usernameAvailabilityDiv, 'check-username', null, 'Mínimo 4 caracteres.', 4);
    setupRealTimeValidation(phoneInput, phoneAvailabilityDiv, 'check-phone', /^\d{4}\d{4}$/, 'Formato debe ser xxxx-xxxx.');
    setupRealTimeValidation(emailInput, emailAvailabilityDiv, 'check-email', /^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Formato de correo no válido.');


    const updateWizardUI = () => {
        formSteps.forEach(step => step.classList.toggle('active', parseInt(step.dataset.step) === currentStep));
        stepIndicator.textContent = currentStep;
        prevBtn.style.display = currentStep > 1 ? 'inline-block' : 'none';
        nextBtn.style.display = currentStep === 3 ? 'none' : 'inline-block';
        nextBtn.textContent = (currentStep === totalSteps || (currentStep === 4 && userTypeInput.value === '1')) ? 'Crear Cuenta' : 'Siguiente';
    };

    const validateCurrentStep = () => {
        const activeStep = document.querySelector('.form-step.active');
        if (!activeStep) return false;

        for (const input of activeStep.querySelectorAll('input[required]')) {
            if (!input.value.trim()) {
                showNotification(`Por favor, completa el campo "${input.labels[0].textContent.replace('*', '').trim()}".`, 'error');
                return false;
            }
        }

        if (currentStep === 1 && phoneAvailabilityDiv.classList.contains('error')) {
            return false;
        }
        if (currentStep === 2) {
            if (usernameAvailabilityDiv.classList.contains('error')) {
                return false;
            }
            if (document.getElementById('password').value !== document.getElementById('password_confirm').value) {
                showNotification('Las contraseñas no coinciden.', 'error');
                return false;
            }
        }
        if (currentStep === 5 && emailAvailabilityDiv.classList.contains('error')) {
            return false;
        }
        return true;
    };

    nextBtn.addEventListener('click', () => {
        if (!validateCurrentStep()) return;
        if (currentStep < totalSteps) {
            currentStep++;
            updateWizardUI();
        } else {
            registerForm.dispatchEvent(new Event('submit', { cancelable: true }));
        }
    });

    prevBtn.addEventListener('click', () => {
        if (currentStep > 1) {
            currentStep -= (currentStep === 5 && userTypeInput.value === '1') ? 2 : 1;
            updateWizardUI();
        }
    });

    studentChoiceButtons.forEach(button => {
        button.addEventListener('click', () => {
            const choice = button.dataset.studentChoice;
            document.getElementById('is_student_check').value = (choice === 'yes') ? '1' : '0';
            userTypeInput.value = (choice === 'yes') ? '2' : '1';
            document.getElementById('institucion').required = (choice === 'yes');
            document.getElementById('grado_actual').required = (choice === 'yes');
            studentChoiceButtons.forEach(btn => btn.classList.remove('selected'));
            button.classList.add('selected');
            setTimeout(() => {
                currentStep += (choice === 'yes') ? 1 : 2;
                updateWizardUI();
            }, 300);
        });
    });

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!validateCurrentStep(true)) return;
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
            document.querySelector('.form-container').innerHTML = `<div style="text-align:center; padding: 4rem;"><h2>¡Registro Exitoso!</h2><p>Serás redirigido a la tienda.</p></div>`;
            setTimeout(() => { window.location.href = 'index.php'; }, 2500);
        } catch (error) {
            showNotification(error.message, 'error');
            nextBtn.disabled = false;
            nextBtn.textContent = 'Crear Cuenta';
        }
    });

    updateWizardUI();
});