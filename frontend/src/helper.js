export const toggleClass = (element, className) => {
    let el = document.querySelector(element);
    el.classList.toggle(className);
}

export const removeClass = (element, className) => { 
    let el = document.querySelector(element);
    el.classList.remove(className);
}
