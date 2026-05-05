const pwd = document.querySelector("#pwd");
const toggleBtn = document.querySelector("#togglePassword");
const eyeIcon = document.querySelector("#eyeIcon");

toggleBtn.addEventListener("click", () => {
    // Toggle the type attribute
    const type = pwd.getAttribute("type") === "password" ? "text" : "password";
    pwd.setAttribute("type", type);

    // Toggle the icon class
    eyeIcon.classList.toggle("bi-eye");
    eyeIcon.classList.toggle("bi-eye-slash");
});