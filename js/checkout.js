// js/checkout.js

document.addEventListener('DOMContentLoaded', () => {
    const sendButton = document.getElementById('send-whatsapp-btn');

    if (sendButton) {
        sendButton.addEventListener('click', async (event) => {
            // No prevenimos el comportamiento por defecto (abrir el enlace),
            // pero sí realizamos una acción justo antes.
            
            try {
                const response = await fetch('api/index.php?resource=cart-checkout', {
                    method: 'POST'
                });

                if (!response.ok) {
                    throw new Error('No se pudo finalizar la compra en el sistema.');
                }
                
                const data = await response.json();

                if (data.success) {
                    console.log('El carrito se ha marcado como completado.');
                    // Opcional: limpiar el carrito en el frontend inmediatamente
                    // y redirigir a una página de "gracias".
                    // Por ahora, simplemente dejamos que el enlace de WhatsApp se abra.
                } else {
                    // Si falla, prevenimos la redirección y mostramos un error
                    event.preventDefault();
                    alert('Hubo un problema al finalizar tu compra. Por favor, intenta de nuevo.');
                }

            } catch (error) {
                event.preventDefault();
                console.error("Error en el checkout:", error);
                alert('Error de conexión al finalizar la compra. Por favor, intenta de nuevo.');
            }
        });
    }
});