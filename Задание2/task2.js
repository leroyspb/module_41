const btn = document.querySelector(".jsbtn");

btn.addEventListener("click", () => {
    alert(`Размер экрана равен: Ширина ${document.documentElement.clientWidth}px;  Высота ${document.documentElement.clientHeight}px`)
});