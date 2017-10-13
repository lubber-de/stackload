/**
 * StackLoad - A tiny JS/CSS module loader that simply does its job.
 *
 * @link       https://gitlab.com/lubber/stackload
 * @copyright  Copyright (c) 2017 Marco 'Lubber' Wienkoop
 * @license    GPLv3 https://gitlab.com/lubber/stackload/blob/master/LICENSE

 */
;(function (window,document) {
    var registry = [],
        fullStack = [],
        currentLoadIndex = 0,
        callBacks = [],
        stopAll = false,
        stackLoadError = function(e) {
            if(window.console){
                var isIE = document.documentMode;
                console.log((isIE?'':'%c')+'[StackLoad Error] Missing file: '+(e.target.src? e.target.src : e.target.href),(isIE?'':'background:#800;color:#fff;font-weight:bold;padding:3px;'));
            }
            if(callBacks[0].error(e)===false){
                stopAll = true;
            }
            var eT=e.target;
            eT.parentNode.removeChild(eT);
            stackLoadDone(e);
        },
        stackLoadDone = function(e){
            var eT=e.target;
            eT.removeEventListener("error", stackLoadError);
            eT.removeEventListener("load", stackLoadDone);
            currentLoadIndex++;
            if(!stopAll){
                if(currentLoadIndex===callBacks[0].doneIndex) {
                    callBacks[0].success();
                    callBacks.shift();
                }
                if (currentLoadIndex !== fullStack.length && !stopAll) {
                    loadSingle();
                }
            } else {
                var remainLost = callBacks[0].doneIndex-currentLoadIndex;
                if (remainLost>0){
                    fullStack.splice(currentLoadIndex, remainLost);
                    callBacks.shift();
                    callBacks.forEach(function(el, i, a) {
                        a[i].doneIndex -= remainLost;
                    });
                }
            }
        },
        loadSingle = function() {
            var o=fullStack[currentLoadIndex];
            try {
                if (!o.check || typeof eval(o.check) === 'undefined') {
                    var element;
                    if (o.type && o.type === 'css') {
                        element = document.createElement('link');
                        element.type = "text/css";
                        element.rel = "stylesheet";
                        element.href = o.url;
                    } else {    //js by default
                        element = document.createElement('script');
                        element.type = "text/javascript";
                        element.src = o.url;
                        element.async = false;
                    }
                    document.head.appendChild(element);
                    element.addEventListener("load", stackLoadDone);
                    element.addEventListener("error", stackLoadError);
                }
            }
            catch (e) {}
        },
        setup = function(stack){
            if(typeof stack === 'string' || stack.url){
                stack = {files:[stack]};
            } else if(Array.isArray(stack)){
                stack = {files:stack};
            }
            if (stack.files){
                var cleanedStack=[];
                if(typeof stack.files === 'string' || stack.files.url){
                    stack.files = [stack.files];
                }
                stack.files.forEach(function(o){
                    if(typeof o === 'string'){
                        o = {url: o};
                    }
                    if(o.url && registry.indexOf(o.url)===-1) {
                        if(!o.type){
                            var guessed = o.url.match(/\.([0-9a-zA-Z]+)(?:[?#]|$)/i);
                            if (guessed) {
                                o.type = guessed[1].toLowerCase();
                            }
                        }
                        cleanedStack.push(o);
                        registry.push(o.url);
                    }
                });
                var cL=cleanedStack.length;
                if(cL>0){
                    fullStack = fullStack.concat(cleanedStack);
                    var fL = fullStack.length;
                    if (typeof stack.success !== 'function') {
                        stack.success = function(){};
                    }
                    if (typeof stack.error !== 'function') {
                        stack.error = function(){};
                    }
                    callBacks.push({
                        doneIndex: fL,
                        success: stack.success,
                        error: stack.error
                    });
                    if(currentLoadIndex===fL-cL){
                        loadSingle();
                    }
                }
            }
        }
    ;
    window.stackLoad = function(stack) {
        stopAll=false;
        setup(stack);
        return {
            then: function(stack) {
                setup(stack);
                return this;
            }
        };
    };
})(window,document);