/**
 * StackLoad - A tiny JS/CSS module loader that simply does its job.
 *
 * @version    1.1.0
 * @link       https://github.com/lubber-de/stackload
 * @copyright  Copyright (c) 2022 Marco 'Lubber' Wienkoop
 * @license    MIT https://github.com/lubber-de/stackload/blob/master/LICENSE
 */
(function (window, document) {
    let fullStack = [],
        currentLoadIndex = 0,
        stopAll = false;
    const registry = [],
        callBacks = [],
        continueStack = function () {
            currentLoadIndex++;
            if (currentLoadIndex === callBacks[0].doneIndex) {
                callBacks[0].success();
                callBacks.shift();
            }
            if (currentLoadIndex !== fullStack.length && !stopAll) {
                loadSingle();
            }
        },
        stackLoadError = function (e) {
            const eT = e.target;
            console.error(`[StackLoad Error] Missing file: ${eT.src ?? eT.href}`);
            if (callBacks[0].error(e) === false) {
                stopAll = true;
            }
            eT.remove();
            stackLoadDone(e);
        },
        stackLoadDone = function (e) {
            const eT = e.target;
            let remainLost;
            eT.removeEventListener('error', stackLoadError);
            eT.removeEventListener('load', stackLoadDone);
            if (eT.jsonp && eT.parentNode) {
                eT.remove();
            }
            if (!stopAll) {
                if (eT.href) {
                    searchCssImport(document.styleSheets[document.styleSheets.length - 1]);
                }
                continueStack();
            } else {
                remainLost = callBacks[0].doneIndex - (++currentLoadIndex);
                if (remainLost > 0) {
                    fullStack.splice(currentLoadIndex, remainLost);
                    callBacks.shift();
                    for (const a of callBacks) {
                        a.doneIndex -= remainLost;
                    }
                }
            }
        },
        loadSingle = function () {
            const o = fullStack[currentLoadIndex];
            let s;
            try {
                if (!o.check || (o.check !== '' && !eval(o.check))) {
                    if (o.type && o.type === 'css') {
                        s = document.createElement('link');
                        s.type = 'text/css';
                        s.rel = 'stylesheet';
                        s.href = o.url;
                    } else { // js by default
                        s = document.createElement('script');
                        s.type = 'text/javascript';
                        s.src = o.url;
                        s.async = false;
                        if (o.type && o.type === 'jsonp') {
                            s.jsonp = true;
                        }
                    }
                    document.head.append(s);
                    s.addEventListener('load', stackLoadDone);
                    s.addEventListener('error', stackLoadError);
                } else {
                    continueStack();
                }
            } catch (error) {
                console.error(error);
                continueStack();
            }
        },
        setup = function (stack) {
            if (stack === undefined) {
                return;
            }
            if (typeof stack === 'string' || stack.url) {
                stack = { files: [stack] };
            } else if (Array.isArray(stack)) {
                stack = { files: stack };
            }
            if (stack.files) {
                const cleanedStack = [];
                if (typeof stack.files === 'string' || stack.files.url) {
                    stack.files = [stack.files];
                }
                for (let o of stack.files) {
                    if (typeof o === 'string') {
                        o = { url: o };
                    }
                    if (/^(@[a-z0-9-]+\/)?[a-z0-9-]+@[0-9]+(\.[0-9]+)?(\.[0-9]+)?(-[0-9a-z-]+(\.[0-9a-z-]+)?)?(\/.*)?/i.test(o.url)) {
                        o.url = `https://cdn.jsdelivr.net/npm/${o.url}`;
                    }
                    if (o.url && !registry.includes(o.url)) {
                        if (!o.type) {
                            const guessed = o.url.match(/\.([0-9a-zA-Z]+)(?:[?#]|$)/i);
                            if (guessed) {
                                o.type = guessed[1].toLowerCase();
                            }
                        }
                        if ((o.type && o.type.toLowerCase() === 'jsonp') || o.noCache) {
                            const dt = Date.now();
                            o.url += /\?/.test(o.url) ? '&' : '?';
                            o.url += `_=${dt}`;
                        }
                        cleanedStack.push(o);
                        registry.push(o.url);
                    }
                }
                const cL = cleanedStack.length;
                if (typeof stack.success !== 'function') {
                    stack.success = function () {};
                }
                if (cL > 0) {
                    fullStack = [...fullStack, ...cleanedStack];
                    const fL = fullStack.length;

                    if (typeof stack.error !== 'function') {
                        stack.error = function () {};
                    }
                    callBacks.push({
                        doneIndex: fL,
                        success: stack.success,
                        error: stack.error,
                    });
                    if (currentLoadIndex === fL - cL) {
                        loadSingle();
                    }
                } else {
                    stack.success();
                }
            }
        },
        searchCssImport = function (styleSheet) {
            try {
                if (styleSheet.cssRules) {
                    for (const j of styleSheet.cssRules) {
                        if (j.href && !registry.includes(j.href)) {
                            registry.push(j.href);
                        }
                    }
                }
            } catch { /* empty */ }
        },
        cssProperties = function (c) {
            const s = document.createElement('div');
            // s.style.display='none';
            s.className = c;
            document.body.append(s);
            const x = JSON.parse(JSON.stringify(window.getComputedStyle(s)));
            s.remove();

            return x;
        };
    window.stackLoad = function (stack) {
        stopAll = false;
        if (registry.length === 0) {
            const elements = document.querySelectorAll('link,script'),
                cssStyles = document.styleSheets;
            for (const el of elements) {
                if (el.src && !registry.includes(el.src)) {
                    registry.push(el.src);
                } else if (el.href && !registry.includes(el.href)) {
                    registry.push(el.href);
                }
            }
            // same for styleSheets, search for @import
            for (let i = 0, il = cssStyles.length; i < il; i++) {
                searchCssImport(cssStyles[i]);
            }
        }
        setup(stack);

        return {
            then: function (s) {
                setup(s);

                return this;
            },
        };
    };
    const currentScript = document.currentScript || document.querySelector('#stackload');
    if (currentScript) {
        const autoload = decodeURIComponent(currentScript.src).split(/[?&]autoload=([^&]*)/);
        if (autoload.length > 1) {
            window.stackLoad(/^[[{].*[\]}]$/.test(autoload[1]) ? JSON.parse(autoload[1], (k, v) => {
                return (k === 'success' || k === 'error' ? eval(v) : v);
            }) : autoload[1]);
        }
    }
})(window, document);
