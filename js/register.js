// js/register.js

document.addEventListener('DOMContentLoaded', () => {
    // --- REFERENCIAS A ELEMENTOS DEL DOM ---
    const registerForm = document.getElementById('register-form');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const submitBtn = document.getElementById('submit-btn');
    const progressBarFill = document.getElementById('progress-bar-fill');
    const formSteps = [...document.querySelectorAll('.form-step')];
    
    const studentCheck = document.getElementById('is_student_check');
    const studentFields = document.getElementById('student-fields');
    const userTypeInput = document.getElementById('id_tipo_cliente');
    const usernameInput = document.getElementById('nombre_usuario');
    const usernameAvailabilityDiv = document.getElementById('username-availability');
    
    let currentStep = 1;
    const totalSteps = formSteps.length;

    // --- MANEJADORES DE EVENTOS ---
    nextBtn.addEventListener('click', () => {
        if (validateStep(currentStep)) {
            goToStep(currentStep + 1);
        }
    });

    prevBtn.addEventListener('click', () => {
        goToStep(currentStep - 1);
    });

    // --- LÓGICA CORREGIDA PARA EL CHECKBOX DE ESTUDIANTE ---
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

    // Lógica de validación de usuario en tiempo real
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
    
    registerForm.addEventListener('submit', handleFormSubmit);

    // --- FUNCIONES ---
    function goToStep(stepNumber) {
        const currentStepElement = formSteps[currentStep - 1];
        const nextStepElement = formSteps[stepNumber - 1];
        
        if (currentStepElement) {
            currentStepElement.classList.add('to-left');
            setTimeout(() => {
                currentStepElement.classList.remove('active', 'to-left');
                if (nextStepElement) {
                    nextStepElement.classList.add('active');
                }
                currentStep = stepNumber;
                updateUI();
            }, 200);
        }
    }

    function updateUI() {
        progressBarFill.style.width = `${((currentStep - 1) / (totalSteps - 1)) * 100}%`;
        prevBtn.style.display = currentStep > 1 ? 'inline-flex' : 'none';
        nextBtn.style.display = currentStep < totalSteps ? 'inline-flex' : 'none';
        submitBtn.style.display = currentStep === totalSteps ? 'inline-flex' : 'none';
    }

    function validateStep(stepNumber) {
        const stepElement = formSteps[stepNumber - 1];
        if (!stepElement) return false;

        const inputs = [...stepElement.querySelectorAll('input[required]')];
        let isValid = true;
        
        inputs.forEach(input => {
            if (!input.value.trim()) {
                isValid = false;
                input.style.borderColor = 'red';
            } else {
                input.style.borderColor = '';
            }
        });
        
        if (!isValid) alert('Por favor, completa todos los campos obligatorios.');

        if (isValid && stepNumber === 2) {
            const password = document.getElementById('password').value;
            const passwordConfirm = document.getElementById('password_confirm').value;
            if (password !== passwordConfirm) {
                alert('Las contraseñas no coinciden.');
                return false;
            }
        }
        return isValid;
    }

    async function handleFormSubmit(event) {
        event.preventDefault();
        if (!validateStep(currentStep)) return;

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

            registerForm.style.display = 'none';
            document.getElementById('register-title-container').style.display = 'none';
            document.querySelector('.progress-bar').style.display = 'none';
            document.querySelector('.form-navigation-btns').style.display = 'none';
            document.getElementById('success-container').style.display = 'block';
        } catch (error) {
            const messageDiv = document.getElementById('form-message');
            messageDiv.className = 'form-message error';
            messageDiv.textContent = error.message;
        }
    }
});