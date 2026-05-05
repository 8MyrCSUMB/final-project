document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('form');
    const passwordInput = document.getElementById('passwordInput');

    form.addEventListener('submit', (event) => {
        const password = passwordInput.value;

        if (password.length < 6) {
            event.preventDefault();

            passwordInput.classList.add('is-invalid');

        } else {
            passwordInput.classList.remove('is-invalid');
            passwordInput.classList.add('is-valid');
        }
    });
});