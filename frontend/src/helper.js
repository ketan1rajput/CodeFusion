export const toggleClass = (element, className) => {
  const matchedElement = document.querySelector(element);

  matchedElement?.classList.toggle(className);
};

export const removeClass = (element, className) => { 
  const matchedElement = document.querySelector(element);

  matchedElement?.classList.remove(className);
};
