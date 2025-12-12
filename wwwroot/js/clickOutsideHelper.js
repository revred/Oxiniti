let registeredHandlers = {};

window.registerClickOutside = function (elementId, dotNetObjRef, methodName) {
    // If already registered for this element, remove previous handler
    if (registeredHandlers[elementId]) {
        document.removeEventListener("click", registeredHandlers[elementId]);
    }

    const handler = function (event) {
        const menu = document.getElementById(elementId);
        if (menu && !menu.contains(event.target)) {
            dotNetObjRef.invokeMethodAsync(methodName);
        }
    };

    document.addEventListener("click", handler);
    registeredHandlers[elementId] = handler;
};

window.unregisterClickOutside = function (elementId) {
    const handler = registeredHandlers[elementId];
    if (handler) {
        document.removeEventListener("click", handler);
        delete registeredHandlers[elementId];
    }
};