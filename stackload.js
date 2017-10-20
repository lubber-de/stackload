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
        continueStack = function(){
            currentLoadIndex++;
            if(currentLoadIndex===callBacks[0].doneIndex) {
                callBacks[0].success();
                callBacks.shift();
            }
            if (currentLoadIndex !== fullStack.length && !stopAll) {
                loadSingle();
            }
        },
        stackLoadError = function(e) {
            var eT=e.target;
            console.error('[StackLoad Error] Missing file: '+(eT.src? eT.src : eT.href));
            if(callBacks[0].error(e)===false){
                stopAll = true;
            }
            eT.parentNode.removeChild(eT);
            stackLoadDone(e);
        },
        stackLoadDone = function(e){
            var eT=e.target,remainLost;
            eT.removeEventListener("error", stackLoadError);
            eT.removeEventListener("load", stackLoadDone);
            if(eT.jsonp && eT.parentNode) {
                eT.parentNode.removeChild(eT);
            }
            if(!stopAll){
                if(eT.href) {
                    searchCssImport(document.styleSheets[document.styleSheets.length-1]);
                }
                continueStack();
            } else {
                remainLost = callBacks[0].doneIndex-(++currentLoadIndex);
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
            var o=fullStack[currentLoadIndex],s;
            try {
                if (!o.check || (o.check!=='' && !eval(o.check))) {
                    if (o.type && o.type === 'css') {
                        s = document.createElement('link');
                        s.type = "text/css";
                        s.rel = "stylesheet";
                        s.href = o.url;
                    } else {    //js by default
                        s = document.createElement('script');
                        s.type = "text/javascript";
                        s.src = o.url;
                        s.async = false;
                        if(o.type && o.type === 'jsonp') {
                            s.jsonp = true;
                        }
                    }
                    document.head.appendChild(s);
                    s.addEventListener("load", stackLoadDone);
                    s.addEventListener("error", stackLoadError);
                } else {
                    continueStack();
                }
            }
            catch (e) {
                console.error(e);
                continueStack();
            }
        },
        setup = function(stack){
            if(typeof stack === 'undefined') {
                return;
            }
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
                        if(o.type.toLowerCase()==='jsonp') {
                            var dt= new Date().getTime();
                            if (o.url.match(/\?/)) {
                                o.url += "&_="+dt;
                            }
                            else {
                                o.url += "?_="+dt;
                            }
                        }
                        cleanedStack.push(o);
                        registry.push(o.url);
                    }
                });
                var cL=cleanedStack.length;
                if (typeof stack.success !== 'function') {
                    stack.success = function(){};
                }
                if(cL>0){
                    fullStack = fullStack.concat(cleanedStack);
                    var fL = fullStack.length;

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
                } else {
                    stack.success();
                }
            }
        },
        searchCssImport = function(styleSheet) {
            try {
                if (styleSheet.cssRules) {
                    for (var j = 0, jl = styleSheet.cssRules.length; j < jl; j++) {
                        if (styleSheet.cssRules[j].href && registry.indexOf(styleSheet.cssRules[j].href)===-1) {
                            registry.push(styleSheet.cssRules[j].href);
                        }
                    }
                }
            }
            catch(e){}
        },
        cssProperties = function(c) {
            var s=document.createElement("div"),x;
//            s.style.display="none";
            s.className=c;
            document.body.appendChild(s);
            x=window.getComputedStyle(s);
            s.parentNode.removeChild(s);
            return x;
        }
    ;
    window.stackLoad = function(stack) {
        stopAll=false;
        if(registry.length===0){
            var elements = document.querySelectorAll('link,script'),i,il,cssStyles = document.styleSheets;
//forEach on querySelectorAll not supported in IE/Edge, thus usual for loop
            for (i=0,il=elements.length;i<il;i++) {
                if(elements[i].src && registry.indexOf(elements[i].src)===-1) {
                    registry.push(elements[i].src);
                } else if (elements[i].href && registry.indexOf(elements[i].href)===-1) {
                    registry.push(elements[i].href);
                }
            }
//same for styleSheets, search for @import
            for (i=0,il=cssStyles.length;i<il;i++) {
                searchCssImport(cssStyles[i]);
            }
        }
        setup(stack);
        return {
            then: function(stack) {
                setup(stack);
                return this;
            }
        };
    };
})(window,document);