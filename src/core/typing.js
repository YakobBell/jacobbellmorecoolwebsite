// This module provides a utility function for creating a typing effect on an HTML element.
/**
 * Creates a typing effect for a given message on an HTML element.
 * @param {HTMLElement} element - The HTML element to display the typing effect in.
 * @param {string} message - The message to type out.
 * @param {function} [onComplete] - An optional callback function to execute when the typing is complete.
 */
export function typeMessage(element, message, onComplete) {
    let i = 0;
    const interval = setInterval(() => {
        element.innerHTML += message.charAt(i);
        i++;
        if (i > message.length) {
            clearInterval(interval);
            if (onComplete) {
                onComplete();
            }
        }
    }, 50);
}