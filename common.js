var uniqueIDs = {};
/**
** Basic **/
/**
** Avoid `console` errors in browsers that lack a console. **/
;(function() {
    var method;
    var noop = function () {};
    var methods = [
        'assert', 'clear', 'count', 'debug', 'dir', 'dirxml', 'error',
        'exception', 'group', 'groupCollapsed', 'groupEnd', 'info', 'log',
        'markTimeline', 'profile', 'profileEnd', 'table', 'time', 'timeEnd',
        'timeStamp', 'trace', 'warn'
    ];
    var length = methods.length;
    var console = (window.console = window.console || {});

    while (length--) {
        method = methods[length];

        // Only stub undefined methods.
        if (!console[method]) {
            console[method] = noop;
        }
    }
}());
/**
** Extend Javascript **/
;(function(){
    /**
    ** Polyfilling indexOf for old browsers **/
    if (!Array.prototype.indexOf) {
        Array.prototype.indexOf = function (searchElement) {
            var t = Object(this);
            var len = t.length >>> 0;
            if (len === 0) {
                return -1;
            }
            var n = 0;
            if (arguments.length > 0) {
                n = Number(arguments[1]);
                if (n != n) { // shortcut for verifying if it's NaN
                    n = 0;
                } else if (n !== 0 && n != Infinity && n != -Infinity) {
                    n = (n > 0 || -1) * Math.floor(Math.abs(n));
                }
            }
            if (n >= len) {
                return -1;
            }
            var k = n >= 0 ? n : Math.max(len - Math.abs(n), 0);
            for (; k < len; k++) {
                if (k in t && t[k] === searchElement) {
                    return k;
                }
            }
            return -1;
        };
    }
    /**
    ** Polyfilling forEach for old browsers **/
    /*if (!Array.prototype.forEach) {
        Array.prototype.forEach = function (method, thisArg) {
            if (!this || !(method instanceof Function))
                throw new TypeError();
            for (var i = 0; i < this.length; i++)
                method.call(thisArg, this[i], i, this);
        }
    }*/
    /**
    ** Polyfilling trim for old browsers **/
    if (!String.prototype.trim) {
        String.prototype.trim = function () {
            return this.replace(/^\s+|\s+$/, '');
        };
    }
    /**
    ** toCapitalize **/
    if(!String.prototype.toCapitalize){
        String.prototype.toCapitalize = function(){
            return this.toUpperCase().substring(0, 1) + this.toLowerCase().substring(1, this.length);
        };
    }
    /**
    ** Array Max **/
    if(!Array.prototype.max) {
        Array.prototype.max = function(){
            var result = 0;
            for(var i = 0; i < this.length; i++){
                result = Math.max(result, this[i]);
            }
            return result;
        };
    }
    /**
    ** Array Min **/
    if(!Array.prototype.min) {
        Array.prototype.min = function(){
            var result = 0;
            for(var i = 0; i < this.length; i++){
                result = Math.min(result, this[i]);
            }
            return result;
        };
    }
    /**
    ** Array Unique **/
    if(!Array.prototype.unique) {
        Array.prototype.unique = function(){
            var n = [];
            for (var i = 0; i < this.length; i++){
                if (n.indexOf(this[i]) == -1) n.push(this[i]);
            }
            return n;
        };
    }
    /**
    ** toNumberic **/
    if(!String.prototype.toNumberic || !Number.prototype.toNumberic){
        String.prototype.toNumberic = Number.prototype.toNumberic = function(length){
            return this.toFixed(length) * 1;
        };
    }
}());
/**
** Extend jQuery get width and height method **/
;(function($, undefined){
    $.fn.extend({
        getNumericValueOfProperty: function(string){
            number = this.css(string);
            if(typeof number === 'number') return number;
            if(typeof number === 'string'){
                var temp = parseInt(number, 0);
                return isNaN(temp) ? 0 : temp;
            }
            return 0;
        },
        hasAttr: function(name){
            return this.attr(name) !== undefined;
        },
        visible: function(){
            var element = this[0];
            return $.expr.filters.visible(element) &&
                !$(element).parents().addBack().filter(function() {
                    return $.css(this, "visibility") === "hidden";
                }).length;
        },
        focusable: function(){
            var element = this[0];
            var isTabIndexNotNaN = !isNaN($.attr(element, "tabindex"));

            var map, mapName, img,
                nodeName = element.nodeName.toLowerCase();
            if(nodeName === "area"){
                map = element.parentNode;
                mapName = map.name;
                if(!element.href || !mapName || map.nodeName.toLowerCase() !== "map"){
                    return false;
                }
                img = $("img[usemap='#" + mapName + "']");
                return !!img[0] && img.visible();
            }
            return ((/input|select|textarea|button|object/).test(nodeName) ? !element.disabled : "a" === nodeName ? element.href || isTabIndexNotNaN : isTabIndexNotNaN) && this.visible();
        },
        isDisabled: function(){
            return this.prop('disabled') || !!this.hasAttr('disabled') || this.hasClass('disabled');
        },
        isReadonly: function(){
            return this.prop('readonly') || !!this.hasAttr('readonly') || this.hasClass('readonly');
        },
        removeStyleCss: function(css){
            if(this.hasAttr('style')){
                var style = this.attr('style'),
                    reg = new RegExp(css + ':\\s*[\\w\\d\\-\\(\\)\\.\\s%,:=\\\\!"\\\'?\\/#]+;', 'g');
                style = style.replace(reg, '');
                style = style.replace(/^\s+|\s+$/g, '');
                this.attr('style', style);
            }
            return this;
        },
        removeClassesByRegExp: function(re){
            if(this.hasAttr('class')){
                var classNames = this.attr('class'),
                    reg = new RegExp(re, 'g');
                classNames = classNames.replace(reg, '');
                classNames = classNames.replace(/^\s+|\s+$/g, '');
                this.attr('class', classNames);
            }
            return this;
        },
        tabIndexFocus: function(){
            this.attr('tabindex', 1)
                .focus()
                .data('focused', true);
            return this;
        },
        tabIndexBlur: function(){
            this.blur()
                .removeAttr('tabindex')
                .data('focused', false);
            return this;
        },
        toggleTabIndexFocus: function(){
            if(this.data('focused') === true){
                this.tabIndexBlur();
            }else{
                this.tabIndexFocus();
            }
            return this;
        },
        toggleTabIndexBlur: function(){
            if(this.data('focused') === false){
                this.tabIndexBlur();
            }else{
                this.tabIndexFocus();
            }
            return this;
        }
    });
}(jQuery));
/**
** Class **/
    var Class = (function(){
        function argumentNames(){
            var names = this.toString().match(/^[\s\(]*function[^\(]*\(([^\)]*)\)/)[1]
                .replace(/\/\/.*?[\r\n]|\/\*(?:.|[\r\n])*?\*\//g, '')
                .replace(/\s+/g, '')
                .split(',');
            return names.length == 1 && !names[0] ? [] : names;
        }
        function Class(baseClass, prop){
            if(typeof baseClass === 'object'){
                prop = baseClass;
                baseClass = null;
            }
            function F(){
                if(baseClass){
                    this.base = baseClass.prototype;
                }
                this.init.apply(this, arguments);
            }
            if(baseClass){
                var middleClass = function(){};
                middleClass.prototype = baseClass.prototype;
                F.prototype = new middleClass();
                F.prototype.constructor = F;
            }

            function _super(name, fn){
                return function(){
                    var that = this,
                        $super = function(){
                            return baseClass.prototype[name].apply(that, arguments);
                        };
                    return fn.apply(this, Array.prototype.concat.apply($super, arguments));
                };
            }
            for(var name in prop){
                if(prop.hasOwnProperty(name)){
                    if(baseClass && typeof prop[name] === 'function' && argumentNames.call(prop[name])[0] === '$super'){
                        F.prototype[name] = _super(name, prop[name]);
                    }else{
                        F.prototype[name] = prop[name];
                    }
                }
            }
            return F;
        }
        return Class;
    }());
/**
** Device **/
    myBrowser = (function(window, undefined){
        var
        ua = window.navigator.userAgent.toLowerCase(),
        html = window.document.documentElement,
        maxIEVersion = 11,
        browserInfo = function(){
            var
            name, version;
            if((/(msie|trident)/).test(ua)){
                name = 'msie';
            }else if((/firefox/).test(ua)){
                name = 'firefox';
            }else if((/safari/).test(ua) && !(/(chrome|opr|opera)/).test(ua)){
                name = 'safari';
            }else if((/chrome/).test(ua) && !(/(opr|opera)/).test(ua)){
                name = 'chrome';
            }else if((/(opr|opera)/).test(ua)){
                name = 'opera';
            }else{
                name = 'unknown';
            }
            version = (ua.match(/.+(?:rv|it|ra|ie)[\/:\s]([\d.]+)/) || [])[1];
            return {
                name: name,
                version: version
            };
        }(),
        deviceType = function(){
            return (/(ipod|ipad|tablet)/).test(ua) ? 'tablet' : ((/(iphone|ios|android|mini|mobile|mobi|nokia|symbian|windows\s+phone|mqqbrowser|wp7|wp8|ucbrowser7|ucweb|360\s+aphone\s+browser)/).test(ua) ? 'mobile' : 'pc');
        }();

        //set html className
        if(browserInfo.name === 'msie'){
            var
            v = browserInfo.version.split('.')[0] * 1,
            vClass = 'msie ie' + v + ' ';
            if(v < maxIEVersion){
                for(i = maxIEVersion; i > v; i--){
                    vClass += 'lt-ie' + i + ' ';
                }
            }
            html.className = vClass + html.className;
        }else{
            html.className = browserInfo.name + ' ' + html.className;
        }

        html.className = deviceType + ' ' + html.className;

        html.className = html.className.replace(/\s{2,}/, ' ');

        return {
            name: browserInfo.name, //browser name: msie, firefox, opera, chrome, safari
            version: browserInfo.version, //browser version
            device: deviceType //mobile, pc
        };
    }(window));
