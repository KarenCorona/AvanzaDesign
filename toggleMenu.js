function toggleMenu() {
    console.log("ToggleMenu ejecutado"); // Verifica si la función se llama
    const menu = document.getElementById("mobile-menu");
    console.log(menu); // Confirma que el elemento se selecciona correctamente
    menu.classList.toggle("show");
}
