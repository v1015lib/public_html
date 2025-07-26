// js/dashboard_profile.js

document.addEventListener('DOMContentLoaded', () => {

    const profileForm = document.getElementById('profile-form');
    const passwordForm = document.getElementById('password-form');
    const profileFeedback = document.getElementById('profile-feedback');
    const passwordFeedback = document.getElementById('password-feedback');

    /**
     * Muestra un mensaje de feedback en el elemento especificado.
     * @param {HTMLElement} element El elemento donde se mostrará el mensaje.
     * @param {string} message El mensaje a mostrar.
     * @param {string} type 'success' o 'error'.
     */
    const showFeedback = (element, message, type = 'success') => {
        element.textContent = message;
        element.className = `form-message ${type}`; // Usa las clases de tu CSS
        element.style.display = 'block';
    };

    /**
     * Carga los datos del perfil del usuario y los rellena en el formulario.
     */
    const loadProfileData = async () => {
        try {
            const response = await fetch('api/index.php?resource=profile', {
                method: 'GET'
            });

            if (!response.ok) {
                const errorResult = await response.json();
                throw new Error(errorResult.error || 'Error del servidor.');
            }

            const result = await response.json();

            if (result.success) {
                const { nombre, apellido, nombre_usuario, email, telefono } = result.profile;
                document.getElementById('profile-nombre').value = nombre;
                document.getElementById('profile-apellido').value = apellido;
                document.getElementById('profile-nombre-usuario').value = nombre_usuario;
                document.getElementById('profile-email').value = email;
                document.getElementById('profile-telefono').value = telefono || '';
            } else {
                showFeedback(profileFeedback, result.error, 'error');
            }
        } catch (error) {
            showFeedback(profileFeedback, `Error al cargar perfil: ${error.message}`, 'error');
        }
    };

    // --- EVENT LISTENER PARA ACTUALIZAR PERFIL ---
    profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        profileFeedback.style.display = 'none';

        const data = {
            nombre: document.getElementById('profile-nombre').value,
            apellido: document.getElementById('profile-apellido').value,
            email: document.getElementById('profile-email').value,
            telefono: document.getElementById('profile-telefono').value,
        };

        try {
            const response = await fetch('api/index.php?resource=profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            const result = await response.json();
            showFeedback(profileFeedback, result.message || result.error, result.success ? 'success' : 'error');

        } catch (error) {
            showFeedback(profileFeedback, 'Error de conexión al actualizar.', 'error');
        }
    });
    
    // --- EVENT LISTENER PARA CAMBIAR CONTRASEÑA ---
    passwordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        passwordFeedback.style.display = 'none';

        const data = {
            current_password: document.getElementById('current-password').value,
            new_password: document.getElementById('new-password').value,
        };

        try {
            const response = await fetch('api/index.php?resource=password', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            
            const result = await response.json();
            
            if (response.ok && result.success) {
                 showFeedback(passwordFeedback, result.message, 'success');
                 passwordForm.reset(); // Limpiar formulario si fue exitoso
            } else {
                throw new Error(result.error || 'No se pudo actualizar la contraseña.');
            }
           
        } catch (error) {
            showFeedback(passwordFeedback, error.message, 'error');
        }
    });

    // Cargar los datos del perfil al iniciar la página
    loadProfileData();
});