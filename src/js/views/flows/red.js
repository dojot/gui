/* eslint-disable */
/**
 * Copyright JS Foundation and other contributors, http://js.foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/
import { PROXY_URL } from 'Src/config'
var RED = {};

RED.events = (function () {
    var handlers = {};

    function on(evt, func) {
        handlers[evt] = handlers[evt] || [];
        handlers[evt].push(func);
    }
    function off(evt, func) {
        var handler = handlers[evt];
        if (handler) {
            for (var i = 0; i < handler.length; i++) {
                if (handler[i] === func) {
                    handler.splice(i, 1);
                    return;
                }
            }
        }
    }
    function emit(evt, arg) {
        if (handlers[evt]) {
            for (var i = 0; i < handlers[evt].length; i++) {
                try {
                    handlers[evt][i](arg);
                } catch (err) {
                    console.log("RED.events.emit error: [" + evt + "] " + (err.toString()));
                    console.log(err);
                }
            }

        }
    }
    return {
        on: on,
        off: off,
        emit: emit
    }
})();

RED.i18n = (function () {
    return {
        init: function (accessToken, done) {
            i18next
                .use(i18nextXHRBackend)
                .init({
                    fallbackLng: 'en',
                    ns: ["editor", "node-red", "jsonata", "infotips"],
                    defaultNS: 'editor',
                    backend: {
                        loadPath: function (lngs, ns) {
                            return `${PROXY_URL}flows/locales/${ns}`;
                        },
                        withCredentials: true,
                        customHeaders: { 'Authorization': accessToken },
                    },
                    interpolation: {
                        prefix: "__",
                        suffix: "__",
                    }
                }, function (t) {
                    jqueryI18next.init(i18next, $, {
                        tName: 't', // --> appends $.t = i18next.t
                        i18nName: 'i18n', // --> appends $.i18n = i18next
                        handleName: 'i18n', // --> appends $(selector).localize(opts);
                        selectorAttr: 'data-i18n', // selector for translating elements
                        targetAttr: 'i18n-target', // data-() attribute to grab target element to translate (if diffrent then itself)
                        optionsAttr: 'i18n-options', // data-() attribute that contains options, will load/set if useOptionsAttr = true
                        useOptionsAttr: false, // see optionsAttr
                        parseDefaultValueFromContent: true // parses default values from content ele.val or ele.text
                    });
                    RED["_"] = function (key, options) {
                        return i18next.t(key, options);
                    }

                    done();
                });
        },
        loadCatalog: function (namespace, done) {
            i18next.loadNamespaces(namespace, done);
        }
    }
})();

RED.settings = (function () {

    var loadedSettings = {};

    var hasLocalStorage = function () {
        try {
            return 'localStorage' in window && window['localStorage'] !== null;
        } catch (e) {
            return false;
        }
    };

    var set = function (key, value) {
        if (!hasLocalStorage()) {
            return;
        }
        localStorage.setItem(key, JSON.stringify(value));
    };

    /**
     * If the key is not set in the localStorage it returns <i>undefined</i>
     * Else return the JSON parsed value
     * @param key
     * @returns {*}
     */
    var get = function (key) {
        if (!hasLocalStorage()) {
            return undefined;
        }
        return JSON.parse(localStorage.getItem(key));
    };

    var remove = function (key) {
        if (!hasLocalStorage()) {
            return;
        }
        localStorage.removeItem(key);
    };

    var setProperties = function (data) {
        for (var prop in loadedSettings) {
            if (loadedSettings.hasOwnProperty(prop) && RED.settings.hasOwnProperty(prop)) {
                delete RED.settings[prop];
            }
        }
        for (prop in data) {
            if (data.hasOwnProperty(prop)) {
                RED.settings[prop] = data[prop];
            }
        }
        loadedSettings = data;
    };

    var init = function (done) {
        var accessTokenMatch = /[?&]access_token=(.*?)(?:$|&)/.exec(window.location.search);
        if (accessTokenMatch) {
            var accessToken = accessTokenMatch[1];
            RED.settings.set("auth-tokens", { access_token: accessToken });
            window.location.search = "";
        }

        $.ajaxSetup({
            beforeSend: function (jqXHR, settings) {
                // Only attach auth header for requests to relative paths
                if (!/^\s*(https?:|\/|\.)/.test(settings.url)) {
                    var auth_tokens = RED.settings.get("auth-tokens");
                    if (auth_tokens) {
                        jqXHR.setRequestHeader("Authorization", "Bearer " + auth_tokens.access_token);
                    }
                    jqXHR.setRequestHeader("Node-RED-API-Version", "v2");
                }
            }
        });

        load(done);
    }

    var load = function (done) {
        $.ajax({
            headers: {
                "Accept": "application/json"
            },
            dataType: "json",
            cache: false,
            //  url: 'http://localhost:1880/settings',
            url: `${PROXY_URL}flows/settings`,
            success: function (data) {
                setProperties(data);
                if (!RED.settings.user || RED.settings.user.anonymous) {
                    RED.settings.remove("auth-tokens");
                }
                // console.log("Node-RED: " + data.version);
                done();
            },
            error: function (jqXHR, textStatus, errorThrown) {
                if (jqXHR.status === 401) {
                    if (/[?&]access_token=(.*?)(?:$|&)/.test(window.location.search)) {
                        window.location.search = "";
                    }
                    RED.user.login(function () { load(done); });
                } else {
                    console.log("Unexpected error:", jqXHR.status, textStatus);
                }
            }
        });
    };

    function theme(property, defaultValue) {
        if (!RED.settings.editorTheme) {
            return defaultValue;
        }
        var parts = property.split(".");
        var v = RED.settings.editorTheme;
        try {
            for (var i = 0; i < parts.length; i++) {
                v = v[parts[i]];
            }
            if (v === undefined) {
                return defaultValue;
            }
            return v;
        } catch (err) {
            return defaultValue;
        }
    }

    return {
        init: init,
        load: load,
        set: set,
        get: get,
        remove: remove,
        theme: theme
    }
})
    ();

// RED.user is not needed

// Handles asynch events from backend - will be needed for flow debug interface when that is implemented
// TODO: implement flow debug interface
// RED.comms is not needed

RED.text = {};
RED.text.bidi = (function () {
    var textDir = "";
    var LRE = "\u202A",
        RLE = "\u202B",
        PDF = "\u202C";

    function isRTLValue(stringValue) {
        var length = stringValue.length;
        for (var i = 0; i < length; i++) {
            if (isBidiChar(stringValue.charCodeAt(i))) {
                return true;
            }
            else if (isLatinChar(stringValue.charCodeAt(i))) {
                return false;
            }
        }
        return false;
    }

    function isBidiChar(c) {
        return (c >= 0x05d0 && c <= 0x05ff) ||
            (c >= 0x0600 && c <= 0x065f) ||
            (c >= 0x066a && c <= 0x06ef) ||
            (c >= 0x06fa && c <= 0x07ff) ||
            (c >= 0xfb1d && c <= 0xfdff) ||
            (c >= 0xfe70 && c <= 0xfefc);
    }

    function isLatinChar(c) {
        return (c > 64 && c < 91) || (c > 96 && c < 123)
    }

    /**
     * Determines the text direction of a given string.
     * @param value - the string
     */
    function resolveBaseTextDir(value) {
        if (textDir == "auto") {
            if (isRTLValue(value)) {
                return "rtl";
            } else {
                return "ltr";
            }
        }
        else {
            return textDir;
        }
    }

    function onInputChange() {
        $(this).attr("dir", resolveBaseTextDir($(this).val()));
    }

    /**
     * Adds event listeners to the Input to ensure its text-direction attribute
     * is properly set based on its content.
     * @param input - the input field
     */
    function prepareInput(input) {
        input.on("keyup", onInputChange).on("paste", onInputChange).on("cut", onInputChange);
        // Set the initial text direction
        onInputChange.call(input);
    }

    /**
     * Enforces the text direction of a given string by adding
     * UCC (Unicode Control Characters)
     * @param value - the string
     */
    function enforceTextDirectionWithUCC(value) {
        if (value) {
            var dir = resolveBaseTextDir(value);
            if (dir == "ltr") {
                return LRE + value + PDF;
            }
            else if (dir == "rtl") {
                return RLE + value + PDF;
            }
        }
        return value;
    }

    /**
     * Enforces the text direction for all the spans with style bidiAware under
     * workspace or sidebar div
     */
    function enforceTextDirectionOnPage() {
        $("#workspace").find('span.bidiAware').each(function () {
            $(this).attr("dir", resolveBaseTextDir($(this).html()));
        });
        $("#sidebar").find('span.bidiAware').each(function () {
            $(this).attr("dir", resolveBaseTextDir($(this).text()));
        });
    }

    /**
     * Sets the text direction preference
     * @param dir - the text direction preference
     */
    function setTextDirection(dir) {
        textDir = dir;
        RED.nodes.eachNode(function (n) { n.dirty = true; });
        RED.view.redraw();
        RED.palette.refresh();
        enforceTextDirectionOnPage();
    }

    return {
        setTextDirection: setTextDirection,
        enforceTextDirectionWithUCC: enforceTextDirectionWithUCC,
        resolveBaseTextDir: resolveBaseTextDir,
        prepareInput: prepareInput
    }
})();
RED.text.format = (function () {

    var TextSegment = (function () {
        var TextSegment = function (obj) {
            this.content = "";
            this.actual = "";
            this.textDirection = "";
            this.localGui = "";
            this.isVisible = true;
            this.isSeparator = false;
            this.isParsed = false;
            this.keep = false;
            this.inBounds = false;
            this.inPoints = false;
            var prop = "";
            for (prop in obj) {
                if (obj.hasOwnProperty(prop)) {
                    this[prop] = obj[prop];
                }
            }
        };
        return TextSegment;
    })();

    var tools = (function () {
        function initBounds(bounds) {
            if (!bounds) {
                return false;
            }
            if (typeof (bounds.start) === "undefined") {
                bounds.start = "";
            }
            if (typeof (bounds.end) === "undefined") {
                bounds.end = "";
            }
            if (typeof (bounds.startAfter) !== "undefined") {
                bounds.start = bounds.startAfter;
                bounds.after = true;
            } else {
                bounds.after = false;
            }
            if (typeof (bounds.endBefore) !== "undefined") {
                bounds.end = bounds.endBefore;
                bounds.before = true;
            } else {
                bounds.before = false;
            }
            var startPos = parseInt(bounds.startPos, 10);
            if (!isNaN(startPos)) {
                bounds.usePos = true;
            } else {
                bounds.usePos = false;
            }
            var bLength = parseInt(bounds.length, 10);
            if (!isNaN(bLength)) {
                bounds.useLength = true;
            } else {
                bounds.useLength = false;
            }
            bounds.loops = typeof (bounds.loops) !== "undefined" ? !!bounds.loops : true;
            return true;
        }

        function getBounds(segment, src) {
            var bounds = {};
            for (var prop in src) {
                if (src.hasOwnProperty(prop)) {
                    bounds[prop] = src[prop];
                }
            }
            var content = segment.content;
            var usePos = bounds.usePos && bounds.startPos < content.length;
            if (usePos) {
                bounds.start = "";
                bounds.loops = false;
            }
            bounds.bStart = usePos ? bounds.startPos : bounds.start.length > 0 ? content.indexOf(bounds.start) : 0;
            var useLength = bounds.useLength && bounds.length > 0 && bounds.bStart + bounds.length < content.length;
            if (useLength) {
                bounds.end = "";
            }
            bounds.bEnd = useLength ? bounds.bStart + bounds.length : bounds.end.length > 0 ?
                content.indexOf(bounds.end, bounds.bStart + bounds.start.length) + 1 : content.length;
            if (!bounds.after) {
                bounds.start = "";
            }
            if (!bounds.before) {
                bounds.end = "";
            }
            return bounds;
        }

        return {
            handleSubcontents: function (segments, args, subs, origContent, locale) { // jshint unused: false
                if (!subs.content || typeof (subs.content) !== "string" || subs.content.length === 0) {
                    return segments;
                }
                var sLoops = true;
                if (typeof (subs.loops) !== "undefined") {
                    sLoops = !!subs.loops;
                }
                for (var j = 0; true; j++) {
                    if (j >= segments.length) {
                        break;
                    }
                    if (segments[j].isParsed || segments.keep || segments[j].isSeparator) {
                        continue;
                    }
                    var content = segments[j].content;
                    var start = content.indexOf(subs.content);
                    if (start < 0) {
                        continue;
                    }
                    var end;
                    var length = 0;
                    if (subs.continued) {
                        do {
                            length++;
                            end = content.indexOf(subs.content, start + length * subs.content.length);
                        } while (end === 0);
                    } else {
                        length = 1;
                    }
                    end = start + length * subs.content.length;
                    segments.splice(j, 1);
                    if (start > 0) {
                        segments.splice(j, 0, new TextSegment({
                            content: content.substring(0, start),
                            localGui: args.dir,
                            keep: true
                        }));
                        j++;
                    }
                    segments.splice(j, 0, new TextSegment({
                        content: content.substring(start, end),
                        textDirection: subs.subDir,
                        localGui: args.dir
                    }));
                    if (end < content.length) {
                        segments.splice(j + 1, 0, new TextSegment({
                            content: content.substring(end, content.length),
                            localGui: args.dir,
                            keep: true
                        }));
                    }
                    if (!sLoops) {
                        break;
                    }
                }
            },

            handleBounds: function (segments, args, aBounds, origContent, locale) {
                for (var i = 0; i < aBounds.length; i++) {
                    if (!initBounds(aBounds[i])) {
                        continue;
                    }
                    for (var j = 0; true; j++) {
                        if (j >= segments.length) {
                            break;
                        }
                        if (segments[j].isParsed || segments[j].inBounds || segments.keep || segments[j].isSeparator) {
                            continue;
                        }
                        var bounds = getBounds(segments[j], aBounds[i]);
                        var start = bounds.bStart;
                        var end = bounds.bEnd;
                        if (start < 0 || end < 0) {
                            continue;
                        }
                        var content = segments[j].content;

                        segments.splice(j, 1);
                        if (start > 0) {
                            segments.splice(j, 0, new TextSegment({
                                content: content.substring(0, start),
                                localGui: args.dir,
                                keep: true
                            }));
                            j++;
                        }
                        if (bounds.start) {
                            segments.splice(j, 0, new TextSegment({
                                content: bounds.start,
                                localGui: args.dir,
                                isSeparator: true
                            }));
                            j++;
                        }
                        segments.splice(j, 0, new TextSegment({
                            content: content.substring(start + bounds.start.length, end - bounds.end.length),
                            textDirection: bounds.subDir,
                            localGui: args.dir,
                            inBounds: true
                        }));
                        if (bounds.end) {
                            j++;
                            segments.splice(j, 0, new TextSegment({
                                content: bounds.end,
                                localGui: args.dir,
                                isSeparator: true
                            }));
                        }
                        if (end + bounds.end.length < content.length) {
                            segments.splice(j + 1, 0, new TextSegment({
                                content: content.substring(end + bounds.end.length, content.length),
                                localGui: args.dir,
                                keep: true
                            }));
                        }
                        if (!bounds.loops) {
                            break;
                        }
                    }
                }
                for (i = 0; i < segments.length; i++) {
                    segments[i].inBounds = false;
                }
                return segments;
            },

            handleCases: function (segments, args, cases, origContent, locale) {
                if (cases.length === 0) {
                    return segments;
                }
                var hArgs = {};
                for (var prop in args) {
                    if (args.hasOwnProperty(prop)) {
                        hArgs[prop] = args[prop];
                    }
                }
                for (var i = 0; i < cases.length; i++) {
                    if (!cases[i].handler || typeof (cases[i].handler.handle) !== "function") {
                        cases[i].handler = args.commonHandler;
                    }
                    if (cases[i].args) {
                        hArgs.cases = cases[i].args.cases;
                        hArgs.points = cases[i].args.points;
                        hArgs.bounds = cases[i].args.bounds;
                        hArgs.subs = cases[i].args.subs;
                    } else {
                        hArgs.cases = [];
                        hArgs.points = [];
                        hArgs.bounds = [];
                        hArgs.subs = {};
                    }
                    cases[i].handler.handle(origContent, segments, hArgs, locale);
                }
                return segments;
            },

            handlePoints: function (segments, args, points, origContent, locale) { //jshint unused: false
                for (var i = 0; i < points.length; i++) {
                    for (var j = 0; true; j++) {
                        if (j >= segments.length) {
                            break;
                        }
                        if (segments[j].isParsed || segments[j].keep || segments[j].isSeparator) {
                            continue;
                        }
                        var content = segments[j].content;
                        var pos = content.indexOf(points[i]);
                        if (pos >= 0) {
                            segments.splice(j, 1);
                            if (pos > 0) {
                                segments.splice(j, 0, new TextSegment({
                                    content: content.substring(0, pos),
                                    textDirection: args.subDir,
                                    localGui: args.dir,
                                    inPoints: true
                                }));
                                j++;
                            }
                            segments.splice(j, 0, new TextSegment({
                                content: points[i],
                                localGui: args.dir,
                                isSeparator: true
                            }));
                            if (pos + points[i].length + 1 <= content.length) {
                                segments.splice(j + 1, 0, new TextSegment({
                                    content: content.substring(pos + points[i].length),
                                    textDirection: args.subDir,
                                    localGui: args.dir,
                                    inPoints: true
                                }));
                            }
                        }
                    }
                }
                for (i = 0; i < segments.length; i++) {
                    if (segments[i].keep) {
                        segments[i].keep = false;
                    } else if (segments[i].inPoints) {
                        segments[i].isParsed = true;
                        segments[i].inPoints = false;
                    }
                }
                return segments;
            }
        };
    })();

    var common = (function () {
        return {
            handle: function (content, segments, args, locale) {
                var cases = [];
                if (Array.isArray(args.cases)) {
                    cases = args.cases;
                }
                var points = [];
                if (typeof (args.points) !== "undefined") {
                    if (Array.isArray(args.points)) {
                        points = args.points;
                    } else if (typeof (args.points) === "string") {
                        points = args.points.split("");
                    }
                }
                var subs = {};
                if (typeof (args.subs) === "object") {
                    subs = args.subs;
                }
                var aBounds = [];
                if (Array.isArray(args.bounds)) {
                    aBounds = args.bounds;
                }

                tools.handleBounds(segments, args, aBounds, content, locale);
                tools.handleSubcontents(segments, args, subs, content, locale);
                tools.handleCases(segments, args, cases, content, locale);
                tools.handlePoints(segments, args, points, content, locale);
                return segments;
            }
        };
    })();

    var misc = (function () {
        var isBidiLocale = function (locale) {
            var lang = !locale ? "" : locale.split("-")[0];
            if (!lang || lang.length < 2) {
                return false;
            }
            return ["iw", "he", "ar", "fa", "ur"].some(function (bidiLang) {
                return bidiLang === lang;
            });
        };
        var LRE = "\u202A";
        var RLE = "\u202B";
        var PDF = "\u202C";
        var LRM = "\u200E";
        var RLM = "\u200F";
        var LRO = "\u202D";
        var RLO = "\u202E";

        return {
            LRE: LRE,
            RLE: RLE,
            PDF: PDF,
            LRM: LRM,
            RLM: RLM,
            LRO: LRO,
            RLO: RLO,

            getLocaleDetails: function (locale) {
                if (!locale) {
                    locale = typeof navigator === "undefined" ? "" :
                        (navigator.language ||
                            navigator.userLanguage ||
                            "");
                }
                locale = locale.toLowerCase();
                if (isBidiLocale(locale)) {
                    var full = locale.split("-");
                    return { lang: full[0], country: full[1] ? full[1] : "" };
                }
                return { lang: "not-bidi" };
            },

            removeUcc: function (text) {
                if (text) {
                    return text.replace(/[\u200E\u200F\u202A-\u202E]/g, "");
                }
                return text;
            },

            removeTags: function (text) {
                if (text) {
                    return text.replace(/<[^<]*>/g, "");
                }
                return text;
            },

            getDirection: function (text, dir, guiDir, checkEnd) {
                if (dir !== "auto" && (/^(rtl|ltr)$/i).test(dir)) {
                    return dir;
                }
                guiDir = (/^(rtl|ltr)$/i).test(guiDir) ? guiDir : "ltr";
                var txt = !checkEnd ? text : text.split("").reverse().join("");
                var fdc = /[A-Za-z\u05d0-\u065f\u066a-\u06ef\u06fa-\u07ff\ufb1d-\ufdff\ufe70-\ufefc]/.exec(txt);
                return fdc ? (fdc[0] <= "z" ? "ltr" : "rtl") : guiDir;
            },

            hasArabicChar: function (text) {
                var fdc = /[\u0600-\u065f\u066a-\u06ef\u06fa-\u07ff\ufb1d-\ufdff\ufe70-\ufefc]/.exec(text);
                return !!fdc;
            },

            showMarks: function (text, guiDir) {
                var result = "";
                for (var i = 0; i < text.length; i++) {
                    var c = "" + text.charAt(i);
                    switch (c) {
                        case LRM:
                            result += "<LRM>";
                            break;
                        case RLM:
                            result += "<RLM>";
                            break;
                        case LRE:
                            result += "<LRE>";
                            break;
                        case RLE:
                            result += "<RLE>";
                            break;
                        case LRO:
                            result += "<LRO>";
                            break;
                        case RLO:
                            result += "<RLO>";
                            break;
                        case PDF:
                            result += "<PDF>";
                            break;
                        default:
                            result += c;
                    }
                }
                var mark = typeof (guiDir) === "undefined" || !((/^(rtl|ltr)$/i).test(guiDir)) ? "" :
                    guiDir === "rtl" ? RLO : LRO;
                return mark + result + (mark === "" ? "" : PDF);
            },

            hideMarks: function (text) {
                var txt = text.replace(/<LRM>/g, this.LRM).replace(/<RLM>/g, this.RLM).replace(/<LRE>/g, this.LRE);
                return txt.replace(/<RLE>/g, this.RLE).replace(/<LRO>/g, this.LRO).replace(/<RLO>/g, this.RLO).replace(/<PDF>/g, this.PDF);
            },

            showTags: function (text) {
                return "<xmp>" + text + "</xmp>";
            },

            hideTags: function (text) {
                return text.replace(/<xmp>/g, "").replace(/<\/xmp>/g, "");
            }
        };
    })();

    var stext = (function () {
        var stt = {};

        // args
        //   handler: main handler (default - dbidi/stt/handlers/common)
        //   guiDir: GUI direction (default - "ltr")
        //   dir: main stt direction (default - guiDir)
        //   subDir: direction of subsegments
        //   points: array of delimiters (default - [])
        //   bounds: array of definitions of bounds in which handler works
        //   subs: object defines special handling for some substring if found
        //   cases: array of additional modules with their args for handling special cases (default - [])
        function parseAndDisplayStructure(content, fArgs, isHtml, locale) {
            if (!content || !fArgs) {
                return content;
            }
            return displayStructure(parseStructure(content, fArgs, locale), fArgs, isHtml);
        }

        function checkArguments(fArgs, fullCheck) {
            var args = Array.isArray(fArgs) ? fArgs[0] : fArgs;
            if (!args.guiDir) {
                args.guiDir = "ltr";
            }
            if (!args.dir) {
                args.dir = args.guiDir;
            }
            if (!fullCheck) {
                return args;
            }
            if (typeof (args.points) === "undefined") {
                args.points = [];
            }
            if (!args.cases) {
                args.cases = [];
            }
            if (!args.bounds) {
                args.bounds = [];
            }
            args.commonHandler = common;
            return args;
        }

        function parseStructure(content, fArgs, locale) {
            if (!content || !fArgs) {
                return new TextSegment({ content: "" });
            }
            var args = checkArguments(fArgs, true);
            var segments = [new TextSegment(
                {
                    content: content,
                    actual: content,
                    localGui: args.dir
                })];
            var parse = common.handle;
            if (args.handler && typeof (args.handler) === "function") {
                parse = args.handler.handle;
            }
            parse(content, segments, args, locale);
            return segments;
        }

        function displayStructure(segments, fArgs, isHtml) {
            var args = checkArguments(fArgs, false);
            if (isHtml) {
                return getResultWithHtml(segments, args);
            }
            else {
                return getResultWithUcc(segments, args);
            }
        }

        function getResultWithUcc(segments, args, isHtml) {
            var result = "";
            var checkedDir = "";
            var prevDir = "";
            var stop = false;
            for (var i = 0; i < segments.length; i++) {
                if (segments[i].isVisible) {
                    var dir = segments[i].textDirection;
                    var lDir = segments[i].localGui;
                    if (lDir !== "" && prevDir === "") {
                        result += (lDir === "rtl" ? misc.RLE : misc.LRE);
                    }
                    else if (prevDir !== "" && (lDir === "" || lDir !== prevDir || stop)) {
                        result += misc.PDF + (i == segments.length - 1 && lDir !== "" ? "" : args.dir === "rtl" ? misc.RLM : misc.LRM);
                        if (lDir !== "") {
                            result += (lDir === "rtl" ? misc.RLE : misc.LRE);
                        }
                    }
                    if (dir === "auto") {
                        dir = misc.getDirection(segments[i].content, dir, args.guiDir);
                    }
                    if ((/^(rtl|ltr)$/i).test(dir)) {
                        result += (dir === "rtl" ? misc.RLE : misc.LRE) + segments[i].content + misc.PDF;
                        checkedDir = dir;
                    }
                    else {
                        result += segments[i].content;
                        checkedDir = misc.getDirection(segments[i].content, dir, args.guiDir, true);
                    }
                    if (i < segments.length - 1) {
                        var locDir = lDir && segments[i + 1].localGui ? lDir : args.dir;
                        result += locDir === "rtl" ? misc.RLM : misc.LRM;
                    }
                    else if (prevDir !== "") {
                        result += misc.PDF;
                    }
                    prevDir = lDir;
                    stop = false;
                }
                else {
                    stop = true;
                }
            }
            var sttDir = args.dir === "auto" ? misc.getDirection(segments[0].actual, args.dir, args.guiDir) : args.dir;
            if (sttDir !== args.guiDir) {
                result = (sttDir === "rtl" ? misc.RLE : misc.LRE) + result + misc.PDF;
            }
            return result;
        }

        function getResultWithHtml(segments, args, isHtml) {
            var result = "";
            var checkedDir = "";
            var prevDir = "";
            for (var i = 0; i < segments.length; i++) {
                if (segments[i].isVisible) {
                    var dir = segments[i].textDirection;
                    var lDir = segments[i].localGui;
                    if (lDir !== "" && prevDir === "") {
                        result += "<bdi dir='" + (lDir === "rtl" ? "rtl" : "ltr") + "'>";
                    }
                    else if (prevDir !== "" && (lDir === "" || lDir !== prevDir || stop)) {
                        result += "</bdi>" + (i == segments.length - 1 && lDir !== "" ? "" : "<span style='unicode-bidi: embed; direction: " + (args.dir === "rtl" ? "rtl" : "ltr") + ";'></span>");
                        if (lDir !== "") {
                            result += "<bdi dir='" + (lDir === "rtl" ? "rtl" : "ltr") + "'>";
                        }
                    }

                    if (dir === "auto") {
                        dir = misc.getDirection(segments[i].content, dir, args.guiDir);
                    }
                    if ((/^(rtl|ltr)$/i).test(dir)) {
                        //result += "<span style='unicode-bidi: embed; direction: " + (dir === "rtl" ? "rtl" : "ltr") + ";'>" + segments[i].content + "</span>";
                        result += "<bdi dir='" + (dir === "rtl" ? "rtl" : "ltr") + "'>" + segments[i].content + "</bdi>";
                        checkedDir = dir;
                    }
                    else {
                        result += segments[i].content;
                        checkedDir = misc.getDirection(segments[i].content, dir, args.guiDir, true);
                    }
                    if (i < segments.length - 1) {
                        var locDir = lDir && segments[i + 1].localGui ? lDir : args.dir;
                        result += "<span style='unicode-bidi: embed; direction: " + (locDir === "rtl" ? "rtl" : "ltr") + ";'></span>";
                    }
                    else if (prevDir !== "") {
                        result += "</bdi>";
                    }
                    prevDir = lDir;
                    stop = false;
                }
                else {
                    stop = true;
                }
            }
            var sttDir = args.dir === "auto" ? misc.getDirection(segments[0].actual, args.dir, args.guiDir) : args.dir;
            if (sttDir !== args.guiDir) {
                result = "<bdi dir='" + (sttDir === "rtl" ? "rtl" : "ltr") + "'>" + result + "</bdi>";
            }
            return result;
        }

        //TBD ?
        function restore(text, isHtml) {
            return text;
        }

        stt.parseAndDisplayStructure = parseAndDisplayStructure;
        stt.parseStructure = parseStructure;
        stt.displayStructure = displayStructure;
        stt.restore = restore;

        return stt;
    })();

    var breadcrumb = (function () {
        return {
            format: function (text, args, isRtl, isHtml, locale, parseOnly) {
                var fArgs =
                {
                    guiDir: isRtl ? "rtl" : "ltr",
                    dir: args.dir ? args.dir : isRtl ? "rtl" : "ltr",
                    subs: {
                        content: ">",
                        continued: true,
                        subDir: isRtl ? "rtl" : "ltr"
                    },
                    cases: [{
                        args: {
                            subs: {
                                content: "<",
                                continued: true,
                                subDir: isRtl ? "ltr" : "rtl"
                            }
                        }
                    }]
                };

                if (!parseOnly) {
                    return stext.parseAndDisplayStructure(text, fArgs, !!isHtml, locale);
                }
                else {
                    return stext.parseStructure(text, fArgs, !!isHtml, locale);
                }
            }
        };
    })();

    var comma = (function () {
        return {
            format: function (text, args, isRtl, isHtml, locale, parseOnly) {
                var fArgs =
                {
                    guiDir: isRtl ? "rtl" : "ltr",
                    dir: "ltr",
                    points: ","
                };
                if (!parseOnly) {
                    return stext.parseAndDisplayStructure(text, fArgs, !!isHtml, locale);
                }
                else {
                    return stext.parseStructure(text, fArgs, !!isHtml, locale);
                }
            }
        };
    })();

    var email = (function () {
        function getDir(text, locale) {
            if (misc.getLocaleDetails(locale).lang !== "ar") {
                return "ltr";
            }
            var ind = text.indexOf("@");
            if (ind > 0 && ind < text.length - 1) {
                return misc.hasArabicChar(text.substring(ind + 1)) ? "rtl" : "ltr";
            }
            return "ltr";
        }

        return {
            format: function (text, args, isRtl, isHtml, locale, parseOnly) {
                var fArgs =
                {
                    guiDir: isRtl ? "rtl" : "ltr",
                    dir: getDir(text, locale),
                    points: "<>.:,;@",
                    cases: [{
                        handler: common,
                        args: {
                            bounds: [{
                                startAfter: "\"",
                                endBefore: "\""
                            },
                            {
                                startAfter: "(",
                                endBefore: ")"
                            }
                            ],
                            points: ""
                        }
                    }]
                };
                if (!parseOnly) {
                    return stext.parseAndDisplayStructure(text, fArgs, !!isHtml, locale);
                }
                else {
                    return stext.parseStructure(text, fArgs, !!isHtml, locale);
                }
            }
        };
    })();

    var filepath = (function () {
        return {
            format: function (text, args, isRtl, isHtml, locale, parseOnly) {
                var fArgs =
                {
                    guiDir: isRtl ? "rtl" : "ltr",
                    dir: "ltr",
                    points: "/\\:."
                };
                if (!parseOnly) {
                    return stext.parseAndDisplayStructure(text, fArgs, !!isHtml, locale);
                }
                else {
                    return stext.parseStructure(text, fArgs, !!isHtml, locale);
                }
            }
        };
    })();

    var formula = (function () {
        return {
            format: function (text, args, isRtl, isHtml, locale, parseOnly) {
                var fArgs =
                {
                    guiDir: isRtl ? "rtl" : "ltr",
                    dir: "ltr",
                    points: " /%^&[]<>=!?~:.,|()+-*{}",
                };
                if (!parseOnly) {
                    return stext.parseAndDisplayStructure(text, fArgs, !!isHtml, locale);
                }
                else {
                    return stext.parseStructure(text, fArgs, !!isHtml, locale);
                }
            }
        };
    })();

    var sql = (function () {
        return {
            format: function (text, args, isRtl, isHtml, locale, parseOnly) {
                var fArgs =
                {
                    guiDir: isRtl ? "rtl" : "ltr",
                    dir: "ltr",
                    points: "\t!#%&()*+,-./:;<=>?|[]{}",
                    cases: [{
                        handler: common,
                        args: {
                            bounds: [{
                                startAfter: "/*",
                                endBefore: "*/"
                            },
                            {
                                startAfter: "--",
                                end: "\n"
                            },
                            {
                                startAfter: "--"
                            }
                            ]
                        }
                    },
                    {
                        handler: common,
                        args: {
                            subs: {
                                content: " ",
                                continued: true
                            }
                        }
                    },
                    {
                        handler: common,
                        args: {
                            bounds: [{
                                startAfter: "'",
                                endBefore: "'"
                            },
                            {
                                startAfter: "\"",
                                endBefore: "\""
                            }
                            ]
                        }
                    }
                    ]
                };
                if (!parseOnly) {
                    return stext.parseAndDisplayStructure(text, fArgs, !!isHtml, locale);
                }
                else {
                    return stext.parseStructure(text, fArgs, !!isHtml, locale);
                }
            }
        };
    })();

    var underscore = (function () {
        return {
            format: function (text, args, isRtl, isHtml, locale, parseOnly) {
                var fArgs =
                {
                    guiDir: isRtl ? "rtl" : "ltr",
                    dir: "ltr",
                    points: "_"
                };
                if (!parseOnly) {
                    return stext.parseAndDisplayStructure(text, fArgs, !!isHtml, locale);
                }
                else {
                    return stext.parseStructure(text, fArgs, !!isHtml, locale);
                }
            }
        };
    })();

    var url = (function () {
        return {
            format: function (text, args, isRtl, isHtml, locale, parseOnly) {
                var fArgs =
                {
                    guiDir: isRtl ? "rtl" : "ltr",
                    dir: "ltr",
                    points: ":?#/@.[]="
                };
                if (!parseOnly) {
                    return stext.parseAndDisplayStructure(text, fArgs, !!isHtml, locale);
                }
                else {
                    return stext.parseStructure(text, fArgs, !!isHtml, locale);
                }
            }
        };
    })();

    var word = (function () {
        return {
            format: function (text, args, isRtl, isHtml, locale, parseOnly) {
                var fArgs =
                {
                    guiDir: isRtl ? "rtl" : "ltr",
                    dir: args.dir ? args.dir : isRtl ? "rtl" : "ltr",
                    points: " ,.!?;:",
                };
                if (!parseOnly) {
                    return stext.parseAndDisplayStructure(text, fArgs, !!isHtml, locale);
                }
                else {
                    return stext.parseStructure(text, fArgs, !!isHtml, locale);
                }
            }
        };
    })();

    var xpath = (function () {
        return {
            format: function (text, args, isRtl, isHtml, locale, parseOnly) {
                var fArgs =
                {
                    guiDir: isRtl ? "rtl" : "ltr",
                    dir: "ltr",
                    points: " /[]<>=!:@.|()+-*",
                    cases: [{
                        handler: common,
                        args: {
                            bounds: [{
                                startAfter: "\"",
                                endBefore: "\""
                            },
                            {
                                startAfter: "'",
                                endBefore: "'"
                            }
                            ],
                            points: ""
                        }
                    }
                    ]
                };
                if (!parseOnly) {
                    return stext.parseAndDisplayStructure(text, fArgs, !!isHtml, locale);
                }
                else {
                    return stext.parseStructure(text, fArgs, !!isHtml, locale);
                }
            }
        };
    })();

    var custom = (function () {
        return {
            format: function (text, args, isRtl, isHtml, locale, parseOnly) {
                var hArgs = {};
                var prop = "";
                var sArgs = Array.isArray(args) ? args[0] : args;
                for (prop in sArgs) {
                    if (sArgs.hasOwnProperty(prop)) {
                        hArgs[prop] = sArgs[prop];
                    }
                }
                hArgs.guiDir = isRtl ? "rtl" : "ltr";
                hArgs.dir = hArgs.dir ? hArgs.dir : hArgs.guiDir;
                if (!parseOnly) {
                    return stext.parseAndDisplayStructure(text, hArgs, !!isHtml, locale);
                }
                else {
                    return stext.parseStructure(text, hArgs, !!isHtml, locale);
                }
            }
        };
    })();

    var message = (function () {
        var params = { msgLang: "en", msgDir: "", phLang: "", phDir: "", phPacking: ["{", "}"], phStt: { type: "none", args: {} }, guiDir: "" };
        var parametersChecked = false;

        function getDirectionOfLanguage(lang) {
            if (lang === "he" || lang === "iw" || lang === "ar") {
                return "rtl";
            }
            return "ltr";
        }

        function checkParameters(obj) {
            if (obj.msgDir.length === 0) {
                obj.msgDir = getDirectionOfLanguage(obj.msgLang);
            }
            obj.msgDir = obj.msgDir !== "ltr" && obj.msgDir !== "rtl" && obj.msgDir != "auto" ? "ltr" : obj.msgDir;
            if (obj.guiDir.length === 0) {
                obj.guiDir = obj.msgDir;
            }
            obj.guiDir = obj.guiDir !== "rtl" ? "ltr" : "rtl";
            if (obj.phDir.length === 0) {
                obj.phDir = obj.phLang.length === 0 ? obj.msgDir : getDirectionOfLanguage(obj.phLang);
            }
            obj.phDir = obj.phDir !== "ltr" && obj.phDir !== "rtl" && obj.phDir != "auto" ? "ltr" : obj.phDir;
            if (typeof (obj.phPacking) === "string") {
                obj.phPacking = obj.phPacking.split("");
            }
            if (obj.phPacking.length < 2) {
                obj.phPacking = ["{", "}"];
            }
        }

        return {
            setDefaults: function (args) {
                for (var prop in args) {
                    if (params.hasOwnProperty(prop)) {
                        params[prop] = args[prop];
                    }
                }
                checkParameters(params);
                parametersChecked = true;
            },

            format: function (text) {
                if (!parametersChecked) {
                    checkParameters(params);
                    parametersChecked = true;
                }
                var isHtml = false;
                var hasHtmlArg = false;
                var spLength = params.phPacking[0].length;
                var epLength = params.phPacking[1].length;
                if (arguments.length > 0) {
                    var last = arguments[arguments.length - 1];
                    if (typeof (last) === "boolean") {
                        isHtml = last;
                        hasHtmlArg = true;
                    }
                }
                //Message
                var re = new RegExp(params.phPacking[0] + "\\d+" + params.phPacking[1]);
                var m;
                var tSegments = [];
                var offset = 0;
                var txt = text;
                while ((m = re.exec(txt)) != null) {
                    var lastIndex = txt.indexOf(m[0]) + m[0].length;
                    if (lastIndex > m[0].length) {
                        tSegments.push({ text: txt.substring(0, lastIndex - m[0].length), ph: false });
                    }
                    tSegments.push({ text: m[0], ph: true });
                    offset += lastIndex;
                    txt = txt.substring(lastIndex, txt.length);
                }
                if (offset < text.length) {
                    tSegments.push({ text: text.substring(offset, text.length), ph: false });
                }
                //Parameters
                var tArgs = [];
                for (var i = 1; i < arguments.length - (hasHtmlArg ? 1 : 0); i++) {
                    var arg = arguments[i];
                    var checkArr = arg;
                    var inLoop = false;
                    var indArr = 0;
                    if (Array.isArray(checkArr)) {
                        arg = checkArr[0];
                        if (typeof (arg) === "undefined") {
                            continue;
                        }
                        inLoop = true;
                    }
                    do {
                        if (typeof (arg) === "string") {
                            tArgs.push({ text: arg, dir: params.phDir, stt: params.stt });
                        }
                        else if (typeof (arg) === "boolean") {
                            isHtml = arg;
                        }
                        else if (typeof (arg) === "object") {
                            tArgs.push(arg);
                            if (!arg.hasOwnProperty("text")) {
                                tArgs[tArgs.length - 1].text = "{???}";
                            }
                            if (!arg.hasOwnProperty("dir") || arg.dir.length === 0) {
                                tArgs[tArgs.length - 1].dir = params.phDir;
                            }
                            if (!arg.hasOwnProperty("stt") || (typeof (arg.stt) === "string" && arg.stt.length === 0) ||
                                (typeof (arg.stt) === "object" && Object.keys(arg.stt).length === 0)) {
                                tArgs[tArgs.length - 1].stt = params.phStt;
                            }
                        }
                        else {
                            tArgs.push({ text: "" + arg, dir: params.phDir, stt: params.phStt });
                        }
                        if (inLoop) {
                            indArr++;
                            if (indArr == checkArr.length) {
                                inLoop = false;
                            }
                            else {
                                arg = checkArr[indArr];
                            }
                        }
                    } while (inLoop);
                }
                //Indexing
                var segments = [];
                for (i = 0; i < tSegments.length; i++) {
                    var t = tSegments[i];
                    if (!t.ph) {
                        segments.push(new TextSegment({ content: t.text, textDirection: params.msgDir }));
                    }
                    else {
                        var ind = parseInt(t.text.substring(spLength, t.text.length - epLength));
                        if (isNaN(ind) || ind >= tArgs.length) {
                            segments.push(new TextSegment({ content: t.text, textDirection: params.msgDir }));
                            continue;
                        }
                        var sttType = "none";
                        if (!tArgs[ind].stt) {
                            tArgs[ind].stt = params.phStt;
                        }
                        if (tArgs[ind].stt) {
                            if (typeof (tArgs[ind].stt) === "string") {
                                sttType = tArgs[ind].stt;
                            }
                            else if (tArgs[ind].stt.hasOwnProperty("type")) {
                                sttType = tArgs[ind].stt.type;
                            }
                        }
                        if (sttType.toLowerCase() !== "none") {
                            var sttSegs = getHandler(sttType).format(tArgs[ind].text, tArgs[ind].stt.args || {},
                                params.msgDir === "rtl", false, params.msgLang, true);
                            for (var j = 0; j < sttSegs.length; j++) {
                                segments.push(sttSegs[j]);
                            }
                            segments.push(new TextSegment({ isVisible: false }));
                        }
                        else {
                            segments.push(new TextSegment({ content: tArgs[ind].text, textDirection: (tArgs[ind].dir ? tArgs[ind].dir : params.phDir) }));
                        }
                    }
                }
                var result = stext.displayStructure(segments, { guiDir: params.guiDir, dir: params.msgDir }, isHtml);
                return result;
            }
        };
    })();

    var event = null;

    function getHandler(type) {
        switch (type) {
            case "breadcrumb":
                return breadcrumb;
            case "comma":
                return comma;
            case "email":
                return email;
            case "filepath":
                return filepath;
            case "formula":
                return formula;
            case "sql":
                return sql;
            case "underscore":
                return underscore;
            case "url":
                return url;
            case "word":
                return word;
            case "xpath":
                return xpath;
            default:
                return custom;
        }
    }

    function isInputEventSupported(element) {
        var agent = window.navigator.userAgent;
        if (agent.indexOf("MSIE") >= 0 || agent.indexOf("Trident") >= 0 || agent.indexOf("Edge") >= 0) {
            return false;
        }
        var checked = document.createElement(element.tagName);
        checked.contentEditable = true;
        var isSupported = ("oninput" in checked);
        if (!isSupported) {
            checked.setAttribute('oninput', 'return;');
            isSupported = typeof checked['oninput'] == 'function';
        }
        checked = null;
        return isSupported;
    }

    function attachElement(element, type, args, isRtl, locale) {
        //if (!element || element.nodeType != 1 || !element.isContentEditable)
        if (!element || element.nodeType != 1) {
            return false;
        }
        if (!event) {
            event = document.createEvent('Event');
            event.initEvent('TF', true, true);
        }
        element.setAttribute("data-tf-type", type);
        var sArgs = args === "undefined" ? "{}" : JSON.stringify(Array.isArray(args) ? args[0] : args);
        element.setAttribute("data-tf-args", sArgs);
        var dir = "ltr";
        if (isRtl === "undefined") {
            if (element.dir) {
                dir = element.dir;
            }
            else if (element.style && element.style.direction) {
                dir = element.style.direction;
            }
            isRtl = dir.toLowerCase() === "rtl";
        }
        element.setAttribute("data-tf-dir", isRtl);
        element.setAttribute("data-tf-locale", misc.getLocaleDetails(locale).lang);
        if (isInputEventSupported(element)) {
            var ehandler = element.oninput;
            element.oninput = function (event) {
                displayWithStructure(event.target);
            };
        }
        else {
            element.onkeyup = function (e) {
                displayWithStructure(e.target);
                element.dispatchEvent(event);
            };
            element.onmouseup = function (e) {
                displayWithStructure(e.target);
                element.dispatchEvent(event);
            };
        }
        displayWithStructure(element);

        return true;
    }

    function detachElement(element) {
        if (!element || element.nodeType != 1) {
            return;
        }
        element.removeAttribute("data-tf-type");
        element.removeAttribute("data-tf-args");
        element.removeAttribute("data-tf-dir");
        element.removeAttribute("data-tf-locale");
        element.innerHTML = element.textContent || "";
    }

    function displayWithStructure(element) {
        var txt = element.textContent || "";
        var selection = document.getSelection();
        if (txt.length === 0 || !selection || selection.rangeCount <= 0) {
            element.dispatchEvent(event);
            return;
        }

        var range = selection.getRangeAt(0);
        var tempRange = range.cloneRange(), startNode, startOffset;
        startNode = range.startContainer;
        startOffset = range.startOffset;
        var textOffset = 0;
        if (startNode.nodeType === 3) {
            textOffset += startOffset;
        }
        tempRange.setStart(element, 0);
        tempRange.setEndBefore(startNode);
        var div = document.createElement('div');
        div.appendChild(tempRange.cloneContents());
        textOffset += div.textContent.length;

        element.innerHTML = getHandler(element.getAttribute("data-tf-type")).
            format(txt, JSON.parse(element.getAttribute("data-tf-args")), (element.getAttribute("data-tf-dir") === "true" ? true : false),
                true, element.getAttribute("data-tf-locale"));
        var parent = element;
        var node = element;
        var newOffset = 0;
        var inEnd = false;
        selection.removeAllRanges();
        range.setStart(element, 0);
        range.setEnd(element, 0);
        while (node) {
            if (node.nodeType === 3) {
                if (newOffset + node.nodeValue.length >= textOffset) {
                    range.setStart(node, textOffset - newOffset);
                    break;
                }
                else {
                    newOffset += node.nodeValue.length;
                    node = node.nextSibling;
                }
            }
            else if (node.hasChildNodes()) {
                parent = node;
                node = parent.firstChild;
                continue;
            }
            else {
                node = node.nextSibling;
            }
            while (!node) {
                if (parent === element) {
                    inEnd = true;
                    break;
                }
                node = parent.nextSibling;
                parent = parent.parentNode;
            }
            if (inEnd) {
                break;
            }
        }

        selection.addRange(range);
        element.dispatchEvent(event);
    }

    return {
        /**
         * Returns the HTML representation of a given structured text
         * @param text - the structured text
         * @param type - could be one of filepath, url, email
         * @param args - pass additional arguments to the handler. generally null.
         * @param isRtl - indicates if the GUI is mirrored
         * @param locale - the browser locale
         */
        getHtml: function (text, type, args, isRtl, locale) {
            return getHandler(type).format(text, args, isRtl, true, locale);
        },
        /**
         * Handle Structured text correct display for a given HTML element.
         * @param element - the element  : should be of type div contenteditable=true
         * @param type - could be one of filepath, url, email
         * @param args - pass additional arguments to the handler. generally null.
         * @param isRtl - indicates if the GUI is mirrored
         * @param locale - the browser locale
         */
        attach: function (element, type, args, isRtl, locale) {
            return attachElement(element, type, args, isRtl, locale);
        }
    };
})();
RED.state = {
    DEFAULT: 0,
    MOVING: 1,
    JOINING: 2,
    MOVING_ACTIVE: 3,
    ADDING: 4,
    EDITING: 5,
    EXPORT: 6,
    IMPORT: 7,
    IMPORT_DRAGGING: 8,
    QUICK_JOINING: 9
}
RED.nodes = (function () {

    var node_defs = {};
    var nodes = [];
    var configNodes = {};
    var links = [];
    var defaultWorkspace;
    var workspaces = {};
    var workspacesOrder = [];
    var subflows = {};
    var loadedFlowVersion = null;

    var initialLoad;

    var dirty = false;

    function setDirty(d) {
        dirty = d;
        RED.events.emit("nodes:change", { dirty: dirty });
    }

    var registry = (function () {
        var moduleList = {};
        var nodeList = [];
        var nodeSets = {};
        var typeToId = {};
        var nodeDefinitions = {};

        var exports = {
            getModule: function (module) {
                return moduleList[module];
            },
            getNodeSetForType: function (nodeType) {
                return exports.getNodeSet(typeToId[nodeType]);
            },
            getModuleList: function () {
                return moduleList;
            },
            getNodeList: function () {
                return nodeList;
            },
            getNodeTypes: function () {
                return Object.keys(nodeDefinitions);
            },
            setNodeList: function (list) {
                nodeList = [];
                for (var i = 0; i < list.length; i++) {
                    var ns = list[i];
                    exports.addNodeSet(ns);
                }
            },
            addNodeSet: function (ns) {
                ns.added = false;
                nodeSets[ns.id] = ns;
                for (var j = 0; j < ns.types.length; j++) {
                    typeToId[ns.types[j]] = ns.id;
                }
                nodeList.push(ns);

                moduleList[ns.module] = moduleList[ns.module] || {
                    name: ns.module,
                    version: ns.version,
                    local: ns.local,
                    sets: {}
                };
                moduleList[ns.module].sets[ns.name] = ns;
                RED.events.emit("registry:node-set-added", ns);
            },
            removeNodeSet: function (id) {
                var ns = nodeSets[id];
                for (var j = 0; j < ns.types.length; j++) {
                    delete typeToId[ns.types[j]];
                }
                delete nodeSets[id];
                for (var i = 0; i < nodeList.length; i++) {
                    if (nodeList[i].id === id) {
                        nodeList.splice(i, 1);
                        break;
                    }
                }
                delete moduleList[ns.module].sets[ns.name];
                if (Object.keys(moduleList[ns.module].sets).length === 0) {
                    delete moduleList[ns.module];
                }
                RED.events.emit("registry:node-set-removed", ns);
                return ns;
            },
            getNodeSet: function (id) {
                return nodeSets[id];
            },
            enableNodeSet: function (id) {
                var ns = nodeSets[id];
                ns.enabled = true;
                RED.events.emit("registry:node-set-enabled", ns);
            },
            disableNodeSet: function (id) {
                var ns = nodeSets[id];
                ns.enabled = false;
                RED.events.emit("registry:node-set-disabled", ns);
            },
            registerNodeType: function (nt, def) {
                nodeDefinitions[nt] = def;
                if (def.category != "subflows") {
                    def.set = nodeSets[typeToId[nt]];
                    nodeSets[typeToId[nt]].added = true;
                    nodeSets[typeToId[nt]].enabled = true;

                    var ns;
                    if (def.set.module === "node-red") {
                        ns = "node-red";
                    } else {
                        ns = def.set.id;
                    }
                    def["_"] = function () {
                        var args = Array.prototype.slice.call(arguments, 0);
                        if (args[0].indexOf(":") === -1) {
                            args[0] = ns + ":" + args[0];
                        }
                        return RED._.apply(null, args);
                    }

                    // TODO: too tightly coupled into palette UI
                }
                RED.events.emit("registry:node-type-added", nt);
            },
            removeNodeType: function (nt) {
                if (nt.substring(0, 8) != "subflow:") {
                    // NON-NLS - internal debug message
                    throw new Error("this api is subflow only. called with:", nt);
                }
                delete nodeDefinitions[nt];
                RED.events.emit("registry:node-type-removed", nt);
            },
            getNodeType: function (nt) {
                return nodeDefinitions[nt];
            }
        };
        return exports;
    })();

    function getID() {
        return ('A' + (1 + Math.random() * 4294967295).toString(16)).replace('.', '');
    }

    function addNode(n) {
        if (n.type.indexOf("subflow") !== 0) {
            n["_"] = n._def._;
        }
        if (n._def.category == "config") {
            configNodes[n.id] = n;
        } else {
            n.ports = [];
            if (n.wires && (n.wires.length > n.outputs)) { n.outputs = n.wires.length; }
            if (n.outputs) {
                for (var i = 0; i < n.outputs; i++) {
                    n.ports.push(i);
                }
            }
            n.dirty = true;
            updateConfigNodeUsers(n);
            if (n._def.category == "subflows" && typeof n.i === "undefined") {
                var nextId = 0;
                RED.nodes.eachNode(function (node) {
                    nextId = Math.max(nextId, node.i || 0);
                });
                n.i = nextId + 1;
            }
            nodes.push(n);
        }
        RED.events.emit('nodes:add', n);
    }
    function addLink(l) {
        links.push(l);
    }

    function getNode(id) {
        if (id in configNodes) {
            return configNodes[id];
        } else {
            for (var n in nodes) {
                if (nodes[n].id == id) {
                    return nodes[n];
                }
            }
        }
        return null;
    }

    function removeNode(id) {
        var removedLinks = [];
        var removedNodes = [];
        var node;
        if (id in configNodes) {
            node = configNodes[id];
            delete configNodes[id];
            RED.events.emit('nodes:remove', node);
            RED.workspaces.refresh();
        } else {
            node = getNode(id);
            if (node) {
                nodes.splice(nodes.indexOf(node), 1);
                removedLinks = links.filter(function (l) { return (l.source === node) || (l.target === node); });
                removedLinks.forEach(function (l) { links.splice(links.indexOf(l), 1); });
                var updatedConfigNode = false;
                for (var d in node._def.defaults) {
                    if (node._def.defaults.hasOwnProperty(d)) {
                        var property = node._def.defaults[d];
                        if (property.type) {
                            var type = registry.getNodeType(property.type);
                            if (type && type.category == "config") {
                                var configNode = configNodes[node[d]];
                                if (configNode) {
                                    updatedConfigNode = true;
                                    if (configNode._def.exclusive) {
                                        removeNode(node[d]);
                                        removedNodes.push(configNode);
                                    } else {
                                        var users = configNode.users;
                                        users.splice(users.indexOf(node), 1);
                                    }
                                }
                            }
                        }
                    }
                }
                if (updatedConfigNode) {
                    RED.workspaces.refresh();
                }
                RED.events.emit('nodes:remove', node);
            }
        }
        if (node && node._def.onremove) {
            node._def.onremove.call(n);
        }
        return { links: removedLinks, nodes: removedNodes };
    }

    function removeLink(l) {
        var index = links.indexOf(l);
        if (index != -1) {
            links.splice(index, 1);
        }
    }

    function addWorkspace(ws) {
        workspaces[ws.id] = ws;
        ws._def = {
            defaults: {
                label: { value: "" }
            }
        };

        workspacesOrder.push(ws.id);
    }
    function getWorkspace(id) {
        return workspaces[id];
    }
    function removeWorkspace(id) {
        delete workspaces[id];
        workspacesOrder.splice(workspacesOrder.indexOf(id), 1);

        var removedNodes = [];
        var removedLinks = [];
        var n;
        var node;
        for (n = 0; n < nodes.length; n++) {
            node = nodes[n];
            if (node.z == id) {
                removedNodes.push(node);
            }
        }
        for (n in configNodes) {
            if (configNodes.hasOwnProperty(n)) {
                node = configNodes[n];
                if (node.z == id) {
                    removedNodes.push(node);
                }
            }
        }
        for (n = 0; n < removedNodes.length; n++) {
            var result = removeNode(removedNodes[n].id);
            removedLinks = removedLinks.concat(result.links);
        }
        return { nodes: removedNodes, links: removedLinks };
    }

    function addSubflow(sf, createNewIds) {
        if (createNewIds) {
            var subflowNames = Object.keys(subflows).map(function (sfid) {
                return subflows[sfid].name;
            });

            subflowNames.sort();
            var copyNumber = 1;
            var subflowName = sf.name;
            subflowNames.forEach(function (name) {
                if (subflowName == name) {
                    copyNumber++;
                    subflowName = sf.name + " (" + copyNumber + ")";
                }
            });
            sf.name = subflowName;
        }
        sf._def = {
            defaults: {},
            icon: "subflow.png",
            category: "subflows",
            color: "#da9",
            inputs: sf.in.length,
            outputs: sf.out.length
        }
        subflows[sf.id] = sf;
        RED.nodes.registerType("subflow:" + sf.id, {
            defaults: { name: { value: "" } },
            info: sf.info,
            icon: "subflow.png",
            category: "subflows",
            inputs: sf.in.length,
            outputs: sf.out.length,
            color: "#da9",
            label: function () { return this.name || RED.nodes.subflow(sf.id).name },
            labelStyle: function () { return this.name ? "node_label_italic" : ""; },
            paletteLabel: function () { return RED.nodes.subflow(sf.id).name },
            set: {
                module: "node-red"
            }
        });


    }
    function getSubflow(id) {
        return subflows[id];
    }
    function removeSubflow(sf) {
        delete subflows[sf.id];
        registry.removeNodeType("subflow:" + sf.id);
    }

    function subflowContains(sfid, nodeid) {
        for (var i = 0; i < nodes.length; i++) {
            var node = nodes[i];
            if (node.z === sfid) {
                var m = /^subflow:(.+)$/.exec(node.type);
                if (m) {
                    if (m[1] === nodeid) {
                        return true;
                    } else {
                        var result = subflowContains(m[1], nodeid);
                        if (result) {
                            return true;
                        }
                    }
                }
            }
        }
        return false;
    }

    function getAllFlowNodes(node) {
        var visited = {};
        visited[node.id] = true;
        var nns = [node];
        var stack = [node];
        while (stack.length !== 0) {
            var n = stack.shift();
            var childLinks = links.filter(function (d) { return (d.source === n) || (d.target === n); });
            for (var i = 0; i < childLinks.length; i++) {
                var child = (childLinks[i].source === n) ? childLinks[i].target : childLinks[i].source;
                var id = child.id;
                if (!id) {
                    id = child.direction + ":" + child.i;
                }
                if (!visited[id]) {
                    visited[id] = true;
                    nns.push(child);
                    stack.push(child);
                }
            }
        }
        return nns;
    }

    function convertWorkspace(n) {
        var node = {};
        node.id = n.id;
        node.type = n.type;
        for (var d in n._def.defaults) {
            if (n._def.defaults.hasOwnProperty(d)) {
                node[d] = n[d];
            }
        }
        return node;
    }
    /**
     * Converts a node to an exportable JSON Object
     **/
    function convertNode(n, exportCreds) {
        if (n.type === 'tab') {
            return convertWorkspace(n);
        }
        exportCreds = exportCreds || false;
        var node = {};
        node.id = n.id;
        node.type = n.type;
        node.z = n.z;
        if (node.type == "unknown") {
            for (var p in n._orig) {
                if (n._orig.hasOwnProperty(p)) {
                    node[p] = n._orig[p];
                }
            }
        } else {
            for (var d in n._def.defaults) {
                if (n._def.defaults.hasOwnProperty(d)) {
                    node[d] = n[d];
                }
            }
            if (exportCreds && n.credentials) {
                var credentialSet = {};
                node.credentials = {};
                for (var cred in n._def.credentials) {
                    if (n._def.credentials.hasOwnProperty(cred)) {
                        if (n._def.credentials[cred].type == 'password') {
                            if (!n.credentials._ ||
                                n.credentials["has_" + cred] != n.credentials._["has_" + cred] ||
                                (n.credentials["has_" + cred] && n.credentials[cred])) {
                                credentialSet[cred] = n.credentials[cred];
                            }
                        } else if (n.credentials[cred] != null && (!n.credentials._ || n.credentials[cred] != n.credentials._[cred])) {
                            credentialSet[cred] = n.credentials[cred];
                        }
                    }
                }
                if (Object.keys(credentialSet).length > 0) {
                    node.credentials = credentialSet;
                }
            }
        }
        if (n._def.category != "config") {
            node.x = n.x;
            node.y = n.y;
            node.wires = [];
            for (var i = 0; i < n.outputs; i++) {
                node.wires.push([]);
            }
            var wires = links.filter(function (d) { return d.source === n; });
            for (var j = 0; j < wires.length; j++) {
                var w = wires[j];
                if (w.target.type != "subflow") {
                    node.wires[w.sourcePort].push(w.target.id);
                }
            }
        }
        return node;
    }

    function convertSubflow(n) {
        var node = {};
        node.id = n.id;
        node.type = n.type;
        node.name = n.name;
        node.info = n.info;
        node.in = [];
        node.out = [];

        n.in.forEach(function (p) {
            var nIn = { x: p.x, y: p.y, wires: [] };
            var wires = links.filter(function (d) { return d.source === p });
            for (var i = 0; i < wires.length; i++) {
                var w = wires[i];
                if (w.target.type != "subflow") {
                    nIn.wires.push({ id: w.target.id })
                }
            }
            node.in.push(nIn);
        });
        n.out.forEach(function (p, c) {
            var nOut = { x: p.x, y: p.y, wires: [] };
            var wires = links.filter(function (d) { return d.target === p });
            for (i = 0; i < wires.length; i++) {
                if (wires[i].source.type != "subflow") {
                    nOut.wires.push({ id: wires[i].source.id, port: wires[i].sourcePort })
                } else {
                    nOut.wires.push({ id: n.id, port: 0 })
                }
            }
            node.out.push(nOut);
        });


        return node;
    }
    /**
     * Converts the current node selection to an exportable JSON Object
     **/
    function createExportableNodeSet(set) {
        var nns = [];
        var exportedConfigNodes = {};
        var exportedSubflows = {};
        for (var n = 0; n < set.length; n++) {
            var node = set[n];
            if (node.type.substring(0, 8) == "subflow:") {
                var subflowId = node.type.substring(8);
                if (!exportedSubflows[subflowId]) {
                    exportedSubflows[subflowId] = true;
                    var subflow = getSubflow(subflowId);
                    var subflowSet = [subflow];
                    RED.nodes.eachNode(function (n) {
                        if (n.z == subflowId) {
                            subflowSet.push(n);
                        }
                    });
                    var exportableSubflow = createExportableNodeSet(subflowSet);
                    nns = exportableSubflow.concat(nns);
                }
            }
            if (node.type != "subflow") {
                var convertedNode = RED.nodes.convertNode(node);
                for (var d in node._def.defaults) {
                    if (node._def.defaults[d].type && node[d] in configNodes) {
                        var confNode = configNodes[node[d]];
                        var exportable = registry.getNodeType(node._def.defaults[d].type).exportable;
                        if ((exportable == null || exportable)) {
                            if (!(node[d] in exportedConfigNodes)) {
                                exportedConfigNodes[node[d]] = true;
                                set.push(confNode);
                            }
                        } else {
                            convertedNode[d] = "";
                        }
                    }
                }
                nns.push(convertedNode);
            } else {
                var convertedSubflow = convertSubflow(node);
                nns.push(convertedSubflow);
            }
        }
        return nns;
    }

    //TODO: rename this (createCompleteNodeSet)
    function createCompleteNodeSet(exportCredentials) {
        if (exportCredentials === undefined) {
            exportCredentials = true;
        }
        var nns = [];
        var i;
        for (i = 0; i < workspacesOrder.length; i++) {
            if (workspaces[workspacesOrder[i]].type == "tab") {
                nns.push(convertWorkspace(workspaces[workspacesOrder[i]]));
            }
        }
        for (i in subflows) {
            if (subflows.hasOwnProperty(i)) {
                nns.push(convertSubflow(subflows[i]));
            }
        }
        for (i in configNodes) {
            if (configNodes.hasOwnProperty(i)) {
                nns.push(convertNode(configNodes[i], exportCredentials));
            }
        }
        for (i = 0; i < nodes.length; i++) {
            var node = nodes[i];
            nns.push(convertNode(node, exportCredentials));
        }
        return nns;
    }

    function checkForMatchingSubflow(subflow, subflowNodes) {
        var i;
        var match = null;
        try {
            RED.nodes.eachSubflow(function (sf) {
                if (sf.name != subflow.name ||
                    sf.info != subflow.info ||
                    sf.in.length != subflow.in.length ||
                    sf.out.length != subflow.out.length) {
                    return;
                }
                var sfNodes = RED.nodes.filterNodes({ z: sf.id });
                if (sfNodes.length != subflowNodes.length) {
                    return;
                }

                var subflowNodeSet = [subflow].concat(subflowNodes);
                var sfNodeSet = [sf].concat(sfNodes);

                var exportableSubflowNodes = JSON.stringify(subflowNodeSet);
                var exportableSFNodes = JSON.stringify(createExportableNodeSet(sfNodeSet));
                var nodeMap = {};
                for (i = 0; i < sfNodes.length; i++) {
                    exportableSubflowNodes = exportableSubflowNodes.replace(new RegExp("\"" + subflowNodes[i].id + "\"", "g"), '"' + sfNodes[i].id + '"');
                }
                exportableSubflowNodes = exportableSubflowNodes.replace(new RegExp("\"" + subflow.id + "\"", "g"), '"' + sf.id + '"');

                if (exportableSubflowNodes !== exportableSFNodes) {
                    return;
                }

                match = sf;
                throw new Error();
            });
        } catch (err) {
            console.log(err.stack);
        }
        return match;
    }
    function compareNodes(nodeA, nodeB, idMustMatch) {
        if (idMustMatch && nodeA.id != nodeB.id) {
            return false;
        }
        if (nodeA.type != nodeB.type) {
            return false;
        }
        var def = nodeA._def;
        for (var d in def.defaults) {
            if (def.defaults.hasOwnProperty(d)) {
                var vA = nodeA[d];
                var vB = nodeB[d];
                if (typeof vA !== typeof vB) {
                    return false;
                }
                if (vA === null || typeof vA === "string" || typeof vA === "number") {
                    if (vA !== vB) {
                        return false;
                    }
                } else {
                    if (JSON.stringify(vA) !== JSON.stringify(vB)) {
                        return false;
                    }
                }
            }
        }
        return true;
    }

    function importNodes(newNodesObj, createNewIds, createMissingWorkspace) {
        var i;
        var n;
        var newNodes;
        var nodeZmap = {};
        if (typeof newNodesObj === "string") {
            if (newNodesObj === "") {
                return;
            }
            try {
                newNodes = JSON.parse(newNodesObj);
            } catch (err) {
                var e = new Error(RED._("clipboard.invalidFlow", { message: err.message }));
                e.code = "NODE_RED";
                throw e;
            }
        } else {
            newNodes = newNodesObj;
        }

        if (!$.isArray(newNodes)) {
            newNodes = [newNodes];
        }
        if (!initialLoad) {
            initialLoad = JSON.parse(JSON.stringify(newNodes));
        }
        var unknownTypes = [];
        for (i = 0; i < newNodes.length; i++) {
            n = newNodes[i];
            // TODO: remove workspace in next release+1
            if (n.type != "workspace" &&
                n.type != "tab" &&
                n.type != "subflow" &&
                !registry.getNodeType(n.type) &&
                n.type.substring(0, 8) != "subflow:" &&
                unknownTypes.indexOf(n.type) == -1) {
                unknownTypes.push(n.type);
                console.log("found unknownTypes: " + n.type);
            }
            if (n.z) {
                nodeZmap[n.z] = nodeZmap[n.z] || [];
                nodeZmap[n.z].push(n);
            }

        }
        if (unknownTypes.length > 0) {
            var typeList = "<ul><li>" + unknownTypes.join("</li><li>") + "</li></ul>";
            var type = "type" + (unknownTypes.length > 1 ? "s" : "");
            RED.notify("<strong>" + RED._("clipboard.importUnrecognised", { count: unknownTypes.length }) + "</strong>" + typeList, "error", false, 10000);
        }

        var activeWorkspace = RED.workspaces.active();
        //TODO: check the z of the subflow instance and check _that_ if it exists
        var activeSubflow = getSubflow(activeWorkspace);
        for (i = 0; i < newNodes.length; i++) {
            var m = /^subflow:(.+)$/.exec(newNodes[i].type);
            if (m) {
                var subflowId = m[1];
                var parent = getSubflow(newNodes[i].z || activeWorkspace);
                if (parent) {
                    var err;
                    if (subflowId === parent.id) {
                        err = new Error(RED._("notification.errors.cannotAddSubflowToItself"));
                    }
                    if (subflowContains(subflowId, parent.id)) {
                        err = new Error(RED._("notification.errors.cannotAddCircularReference"));
                    }
                    if (err) {
                        // TODO: standardise error codes
                        err.code = "NODE_RED";
                        throw err;
                    }
                }
            }
        }

        var new_workspaces = [];
        var workspace_map = {};
        var new_subflows = [];
        var subflow_map = {};
        var subflow_blacklist = {};
        var node_map = {};
        var new_nodes = [];
        var new_links = [];
        var nid;
        var def;
        var configNode;
        var missingWorkspace = null;
        var d;

        // Find all tabs and subflow templates
        for (i = 0; i < newNodes.length; i++) {
            n = newNodes[i];
            // TODO: remove workspace in next release+1
            if (n.type === "workspace" || n.type === "tab") {
                if (n.type === "workspace") {
                    n.type = "tab";
                }
                if (defaultWorkspace == null) {
                    defaultWorkspace = n;
                }
                if (createNewIds) {
                    nid = getID();
                    workspace_map[n.id] = nid;
                    n.id = nid;
                }

                addWorkspace(n);
                RED.workspaces.add(n);
                new_workspaces.push(n);
            } else if (n.type === "subflow") {
                var matchingSubflow = checkForMatchingSubflow(n, nodeZmap[n.id]);
                if (matchingSubflow) {
                    subflow_blacklist[n.id] = matchingSubflow;
                } else {
                    subflow_map[n.id] = n;
                    if (createNewIds) {
                        nid = getID();
                        n.id = nid;
                    }
                    // TODO: handle createNewIds - map old to new subflow ids
                    n.in.forEach(function (input, i) {
                        input.type = "subflow";
                        input.direction = "in";
                        input.z = n.id;
                        input.i = i;
                        input.id = getID();
                    });
                    n.out.forEach(function (output, i) {
                        output.type = "subflow";
                        output.direction = "out";
                        output.z = n.id;
                        output.i = i;
                        output.id = getID();
                    });
                    new_subflows.push(n);
                    addSubflow(n, createNewIds);
                }
            }
        }

        // Add a tab if there isn't one there already
        if (defaultWorkspace == null) {
            defaultWorkspace = { type: "tab", id: getID(), label: RED._('workspace.defaultName', { number: 1 }) };
            addWorkspace(defaultWorkspace);
            RED.workspaces.add(defaultWorkspace);
            new_workspaces.push(defaultWorkspace);
            activeWorkspace = RED.workspaces.active();
        }

        // Find all config nodes and add them
        for (i = 0; i < newNodes.length; i++) {
            n = newNodes[i];
            def = registry.getNodeType(n.type);
            if (def && def.category == "config") {
                var existingConfigNode = null;
                if (createNewIds) {
                    if (n.z) {
                        if (subflow_blacklist[n.z]) {
                            continue;
                        } else if (subflow_map[n.z]) {
                            n.z = subflow_map[n.z].id;
                        } else {
                            n.z = workspace_map[n.z];
                            if (!workspaces[n.z]) {
                                if (createMissingWorkspace) {
                                    if (missingWorkspace === null) {
                                        missingWorkspace = RED.workspaces.add(null, true);
                                        new_workspaces.push(missingWorkspace);
                                    }
                                    n.z = missingWorkspace.id;
                                } else {
                                    n.z = activeWorkspace;
                                }
                            }
                        }
                    }
                    existingConfigNode = RED.nodes.node(n.id);
                    if (existingConfigNode) {
                        if (n.z && existingConfigNode.z !== n.z) {
                            existingConfigNode = null;
                            // Check the config nodes on n.z
                            for (var cn in configNodes) {
                                if (configNodes.hasOwnProperty(cn)) {
                                    if (configNodes[cn].z === n.z && compareNodes(configNodes[cn], n, false)) {
                                        existingConfigNode = configNodes[cn];
                                        node_map[n.id] = configNodes[cn];
                                        break;
                                    }
                                }
                            }
                        }
                    }

                }

                if (!existingConfigNode) { //} || !compareNodes(existingConfigNode,n,true) || existingConfigNode._def.exclusive || existingConfigNode.z !== n.z) {
                    configNode = { id: n.id, z: n.z, type: n.type, users: [], _config: {} };
                    for (d in def.defaults) {
                        if (def.defaults.hasOwnProperty(d)) {
                            configNode[d] = n[d];
                            configNode._config[d] = JSON.stringify(n[d]);
                        }
                    }
                    if (def.hasOwnProperty('credentials') && n.hasOwnProperty('credentials')) {
                        configNode.credentials = {};
                        for (d in def.credentials) {
                            if (def.credentials.hasOwnProperty(d) && n.credentials.hasOwnProperty(d)) {
                                configNode.credentials[d] = n.credentials[d];
                            }
                        }
                    }
                    configNode.label = def.label;
                    configNode._def = def;
                    if (createNewIds) {
                        configNode.id = getID();
                    }
                    node_map[n.id] = configNode;
                    new_nodes.push(configNode);
                    RED.nodes.add(configNode);
                }
            }
        }

        // Find regular flow nodes and subflow instances
        for (i = 0; i < newNodes.length; i++) {
            n = newNodes[i];
            // TODO: remove workspace in next release+1
            if (n.type !== "workspace" && n.type !== "tab" && n.type !== "subflow") {
                def = registry.getNodeType(n.type);
                if (!def || def.category != "config") {
                    var node = { x: n.x, y: n.y, z: n.z, type: 0, wires: n.wires, changed: false, _config: {} };
                    if (createNewIds) {
                        if (subflow_blacklist[n.z]) {
                            continue;
                        } else if (subflow_map[node.z]) {
                            node.z = subflow_map[node.z].id;
                        } else {
                            node.z = workspace_map[node.z];
                            if (!workspaces[node.z]) {
                                if (createMissingWorkspace) {
                                    if (missingWorkspace === null) {
                                        missingWorkspace = RED.workspaces.add(null, true);
                                        new_workspaces.push(missingWorkspace);
                                    }
                                    node.z = missingWorkspace.id;
                                } else {
                                    node.z = activeWorkspace;
                                }
                            }
                        }
                        node.id = getID();
                    } else {
                        node.id = n.id;
                        if (node.z == null || (!workspaces[node.z] && !subflow_map[node.z])) {
                            if (createMissingWorkspace) {
                                if (missingWorkspace === null) {
                                    missingWorkspace = RED.workspaces.add(null, true);
                                    new_workspaces.push(missingWorkspace);
                                }
                                node.z = missingWorkspace.id;
                            } else {
                                node.z = activeWorkspace;
                            }
                        }
                    }
                    node.type = n.type;
                    node._def = def;
                    if (n.type.substring(0, 7) === "subflow") {
                        var parentId = n.type.split(":")[1];
                        var subflow = subflow_blacklist[parentId] || subflow_map[parentId] || getSubflow(parentId);
                        if (createNewIds) {
                            parentId = subflow.id;
                            node.type = "subflow:" + parentId;
                            node._def = registry.getNodeType(node.type);
                            delete node.i;
                        }
                        node.name = n.name;
                        node.outputs = subflow.out.length;
                        node.inputs = subflow.in.length;
                    } else {
                        if (!node._def) {
                            if (node.x && node.y) {
                                node._def = {
                                    color: "#fee",
                                    defaults: {},
                                    label: "unknown: " + n.type,
                                    labelStyle: "node_label_italic",
                                    outputs: n.outputs || n.wires.length,
                                    set: registry.getNodeSet("node-red/unknown")
                                }
                            } else {
                                node._def = {
                                    category: "config",
                                    set: registry.getNodeSet("node-red/unknown")
                                };
                                node.users = [];
                            }
                            var orig = {};
                            for (var p in n) {
                                if (n.hasOwnProperty(p) && p != "x" && p != "y" && p != "z" && p != "id" && p != "wires") {
                                    orig[p] = n[p];
                                }
                            }
                            node._orig = orig;
                            node.name = n.type;
                            node.type = "unknown";
                        }
                        if (node._def.category != "config") {
                            node.inputs = n.inputs || node._def.inputs;
                            node.outputs = n.outputs || node._def.outputs;
                            for (d in node._def.defaults) {
                                if (node._def.defaults.hasOwnProperty(d)) {
                                    node[d] = n[d];
                                    node._config[d] = JSON.stringify(n[d]);
                                }
                            }
                            node._config.x = node.x;
                            node._config.y = node.y;
                            if (node._def.hasOwnProperty('credentials') && n.hasOwnProperty('credentials')) {
                                node.credentials = {};
                                for (d in node._def.credentials) {
                                    if (node._def.credentials.hasOwnProperty(d) && n.credentials.hasOwnProperty(d)) {
                                        node.credentials[d] = n.credentials[d];
                                    }
                                }
                            }
                        }
                    }
                    addNode(node);
                    RED.editor.validateNode(node);
                    node_map[n.id] = node;
                    if (node._def.category != "config") {
                        new_nodes.push(node);
                    }
                }
            }
        }
        // TODO: make this a part of the node definition so it doesn't have to
        //       be hardcoded here
        var nodeTypeArrayReferences = {
            "catch": "scope",
            "status": "scope",
            "link in": "links",
            "link out": "links"
        }

        // Remap all wires and config node references
        for (i = 0; i < new_nodes.length; i++) {
            n = new_nodes[i];
            if (n.wires) {
                for (var w1 = 0; w1 < n.wires.length; w1++) {
                    var wires = (n.wires[w1] instanceof Array) ? n.wires[w1] : [n.wires[w1]];
                    for (var w2 = 0; w2 < wires.length; w2++) {
                        if (node_map.hasOwnProperty(wires[w2])) {
                            if (n.z === node_map[wires[w2]].z) {
                                var link = { source: n, sourcePort: w1, target: node_map[wires[w2]] };
                                addLink(link);
                                new_links.push(link);
                            } else {
                                console.log("Warning: dropping link that crosses tabs:", n.id, "->", node_map[wires[w2]].id);
                            }
                        }
                    }
                }
                delete n.wires;
            }
            for (var d3 in n._def.defaults) {
                if (n._def.defaults.hasOwnProperty(d3)) {
                    if (n._def.defaults[d3].type && node_map[n[d3]]) {
                        n[d3] = node_map[n[d3]].id;
                        configNode = RED.nodes.node(n[d3]);
                        if (configNode && configNode.users.indexOf(n) === -1) {
                            configNode.users.push(n);
                        }
                    } else if (nodeTypeArrayReferences.hasOwnProperty(n.type) && nodeTypeArrayReferences[n.type] === d3 && n[d3] !== undefined && n[d3] !== null) {
                        for (var j = 0; j < n[d3].length; j++) {
                            if (node_map[n[d3][j]]) {
                                n[d3][j] = node_map[n[d3][j]].id;
                            }
                        }

                    }
                }
            }
            // If importing into a subflow, ensure an outbound-link doesn't
            // get added
            if (activeSubflow && /^link /.test(n.type) && n.links) {
                n.links = n.links.filter(function (id) {
                    var otherNode = RED.nodes.node(id);
                    return (otherNode && otherNode.z === activeWorkspace)
                });
            }

            // With all properties now remapped to point at valid nodes,
            // we can validate the node
            RED.editor.validateNode(n);
        }
        for (i = 0; i < new_subflows.length; i++) {
            n = new_subflows[i];
            n.in.forEach(function (input) {
                input.wires.forEach(function (wire) {
                    var link = { source: input, sourcePort: 0, target: node_map[wire.id] };
                    addLink(link);
                    new_links.push(link);
                });
                delete input.wires;
            });
            n.out.forEach(function (output) {
                output.wires.forEach(function (wire) {
                    var link;
                    if (subflow_map[wire.id] && subflow_map[wire.id].id == n.id) {
                        link = { source: n.in[wire.port], sourcePort: wire.port, target: output };
                    } else {
                        link = { source: node_map[wire.id] || subflow_map[wire.id], sourcePort: wire.port, target: output };
                    }
                    addLink(link);
                    new_links.push(link);
                });
                delete output.wires;
            });
        }

        RED.workspaces.refresh();
        return [new_nodes, new_links, new_workspaces, new_subflows, missingWorkspace];
    }

    // TODO: supports filter.z|type
    function filterNodes(filter) {
        var result = [];

        for (var n = 0; n < nodes.length; n++) {
            var node = nodes[n];
            if (filter.hasOwnProperty("z") && node.z !== filter.z) {
                continue;
            }
            if (filter.hasOwnProperty("type") && node.type !== filter.type) {
                continue;
            }
            result.push(node);
        }
        return result;
    }
    function filterLinks(filter) {
        var result = [];

        for (var n = 0; n < links.length; n++) {
            var link = links[n];
            if (filter.source) {
                if (filter.source.hasOwnProperty("id") && link.source.id !== filter.source.id) {
                    continue;
                }
                if (filter.source.hasOwnProperty("z") && link.source.z !== filter.source.z) {
                    continue;
                }
            }
            if (filter.target) {
                if (filter.target.hasOwnProperty("id") && link.target.id !== filter.target.id) {
                    continue;
                }
                if (filter.target.hasOwnProperty("z") && link.target.z !== filter.target.z) {
                    continue;
                }
            }
            if (filter.hasOwnProperty("sourcePort") && link.sourcePort !== filter.sourcePort) {
                continue;
            }
            result.push(link);
        }
        return result;
    }

    // Update any config nodes referenced by the provided node to ensure their 'users' list is correct
    function updateConfigNodeUsers(n) {
        for (var d in n._def.defaults) {
            if (n._def.defaults.hasOwnProperty(d)) {
                var property = n._def.defaults[d];
                if (property.type) {
                    var type = registry.getNodeType(property.type);
                    if (type && type.category == "config") {
                        var configNode = configNodes[n[d]];
                        if (configNode) {
                            if (configNode.users.indexOf(n) === -1) {
                                configNode.users.push(n);
                            }
                        }
                    }
                }
            }
        }
    }

    function flowVersion(version) {
        if (version !== undefined) {
            loadedFlowVersion = version;
        } else {
            return loadedFlowVersion;
        }
    }

    function clear() {
        nodes = [];
        links = [];
        configNodes = {};
        workspacesOrder = [];
        var subflowIds = Object.keys(subflows);
        subflowIds.forEach(function (id) {
            RED.subflow.removeSubflow(id)
        });
        var workspaceIds = Object.keys(workspaces);
        workspaceIds.forEach(function (id) {
            RED.workspaces.remove(workspaces[id]);
        });
        defaultWorkspace = null;

        RED.nodes.dirty(true);
        RED.view.redraw(true);
        RED.palette.refresh();
        RED.workspaces.refresh();
        // RED.sidebar.config.refresh();

        // var node_defs = {};
        // var nodes = [];
        // var configNodes = {};
        // var links = [];
        // var defaultWorkspace;
        // var workspaces = {};
        // var workspacesOrder =[];
        // var subflows = {};
        // var loadedFlowVersion = null;
    }

    return {
        registry: registry,
        setNodeList: registry.setNodeList,

        getNodeSet: registry.getNodeSet,
        addNodeSet: registry.addNodeSet,
        removeNodeSet: registry.removeNodeSet,
        enableNodeSet: registry.enableNodeSet,
        disableNodeSet: registry.disableNodeSet,

        registerType: registry.registerNodeType,
        getType: registry.getNodeType,
        convertNode: convertNode,

        add: addNode,
        remove: removeNode,
        clear: clear,

        addLink: addLink,
        removeLink: removeLink,

        addWorkspace: addWorkspace,
        removeWorkspace: removeWorkspace,
        getWorkspaceOrder: function () { return workspacesOrder },
        setWorkspaceOrder: function (order) { workspacesOrder = order; },
        workspace: getWorkspace,

        addSubflow: addSubflow,
        removeSubflow: removeSubflow,
        subflow: getSubflow,
        subflowContains: subflowContains,

        eachNode: function (cb) {
            for (var n = 0; n < nodes.length; n++) {
                cb(nodes[n]);
            }
        },
        eachLink: function (cb) {
            for (var l = 0; l < links.length; l++) {
                cb(links[l]);
            }
        },
        eachConfig: function (cb) {
            for (var id in configNodes) {
                if (configNodes.hasOwnProperty(id)) {
                    cb(configNodes[id]);
                }
            }
        },
        eachSubflow: function (cb) {
            for (var id in subflows) {
                if (subflows.hasOwnProperty(id)) {
                    cb(subflows[id]);
                }
            }
        },
        eachWorkspace: function (cb) {
            for (var i = 0; i < workspacesOrder.length; i++) {
                cb(workspaces[workspacesOrder[i]]);
            }
        },

        node: getNode,

        version: flowVersion,
        originalFlow: function (flow) {
            if (flow === undefined) {
                return initialLoad;
            } else {
                initialLoad = flow;
            }
        },

        filterNodes: filterNodes,
        filterLinks: filterLinks,

        import: importNodes,

        getAllFlowNodes: getAllFlowNodes,
        createExportableNodeSet: createExportableNodeSet,
        createCompleteNodeSet: createCompleteNodeSet,
        updateConfigNodeUsers: updateConfigNodeUsers,
        id: getID,
        dirty: function (d) {
            if (d == null) {
                return dirty;
            } else {
                setDirty(d);
            }
        }
    };
})();
RED.history = (function () {
    var undo_history = [];

    function undoEvent(ev) {
        var i;
        var len;
        var node;
        var subflow;
        var modifiedTabs = {};
        if (ev) {
            if (ev.t == 'multi') {
                len = ev.events.length;
                for (i = len - 1; i >= 0; i--) {
                    undoEvent(ev.events[i]);
                }
            } else if (ev.t == 'replace') {
                RED.nodes.clear();
                var imported = RED.nodes.import(ev.config);
                imported[0].forEach(function (n) {
                    if (ev.changed[n.id]) {
                        n.changed = true;
                    }
                })

                RED.nodes.version(ev.rev);
            } else if (ev.t == 'add') {
                if (ev.nodes) {
                    for (i = 0; i < ev.nodes.length; i++) {
                        node = RED.nodes.node(ev.nodes[i]);
                        if (node.z) {
                            modifiedTabs[node.z] = true;
                        }
                        RED.nodes.remove(ev.nodes[i]);
                    }
                }
                if (ev.links) {
                    for (i = 0; i < ev.links.length; i++) {
                        RED.nodes.removeLink(ev.links[i]);
                    }
                }
                if (ev.workspaces) {
                    for (i = 0; i < ev.workspaces.length; i++) {
                        RED.nodes.removeWorkspace(ev.workspaces[i].id);
                        RED.workspaces.remove(ev.workspaces[i]);
                    }
                }
                if (ev.subflows) {
                    for (i = 0; i < ev.subflows.length; i++) {
                        RED.nodes.removeSubflow(ev.subflows[i]);
                        RED.workspaces.remove(ev.subflows[i]);
                    }
                }
                if (ev.subflow) {
                    if (ev.subflow.instances) {
                        ev.subflow.instances.forEach(function (n) {
                            var node = RED.nodes.node(n.id);
                            if (node) {
                                node.changed = n.changed;
                                node.dirty = true;
                            }
                        });
                    }
                    if (ev.subflow.hasOwnProperty('changed')) {
                        subflow = RED.nodes.subflow(ev.subflow.id);
                        if (subflow) {
                            subflow.changed = ev.subflow.changed;
                        }
                    }
                }
                if (ev.removedLinks) {
                    for (i = 0; i < ev.removedLinks.length; i++) {
                        RED.nodes.addLink(ev.removedLinks[i]);
                    }
                }

            } else if (ev.t == "delete") {
                if (ev.workspaces) {
                    for (i = 0; i < ev.workspaces.length; i++) {
                        RED.nodes.addWorkspace(ev.workspaces[i]);
                        RED.workspaces.add(ev.workspaces[i]);
                    }
                }
                if (ev.subflow && ev.subflow.subflow) {
                    RED.nodes.addSubflow(ev.subflow.subflow);
                }
                if (ev.subflowInputs && ev.subflowInputs.length > 0) {
                    subflow = RED.nodes.subflow(ev.subflowInputs[0].z);
                    subflow.in.push(ev.subflowInputs[0]);
                    subflow.in[0].dirty = true;
                }
                if (ev.subflowOutputs && ev.subflowOutputs.length > 0) {
                    subflow = RED.nodes.subflow(ev.subflowOutputs[0].z);
                    ev.subflowOutputs.sort(function (a, b) { return a.i - b.i });
                    for (i = 0; i < ev.subflowOutputs.length; i++) {
                        var output = ev.subflowOutputs[i];
                        subflow.out.splice(output.i, 0, output);
                        for (var j = output.i + 1; j < subflow.out.length; j++) {
                            subflow.out[j].i++;
                            subflow.out[j].dirty = true;
                        }
                        RED.nodes.eachLink(function (l) {
                            if (l.source.type == "subflow:" + subflow.id) {
                                if (l.sourcePort >= output.i) {
                                    l.sourcePort++;
                                }
                            }
                        });
                    }
                }
                if (ev.subflow && ev.subflow.hasOwnProperty('instances')) {
                    ev.subflow.instances.forEach(function (n) {
                        var node = RED.nodes.node(n.id);
                        if (node) {
                            node.changed = n.changed;
                            node.dirty = true;
                        }
                    });
                }
                if (subflow) {
                    RED.nodes.filterNodes({ type: "subflow:" + subflow.id }).forEach(function (n) {
                        n.inputs = subflow.in.length;
                        n.outputs = subflow.out.length;
                        while (n.outputs > n.ports.length) {
                            n.ports.push(n.ports.length);
                        }
                        n.resize = true;
                        n.dirty = true;
                    });
                }
                if (ev.nodes) {
                    for (i = 0; i < ev.nodes.length; i++) {
                        RED.nodes.add(ev.nodes[i]);
                        modifiedTabs[ev.nodes[i].z] = true;
                    }
                }
                if (ev.links) {
                    for (i = 0; i < ev.links.length; i++) {
                        RED.nodes.addLink(ev.links[i]);
                    }
                }
                if (ev.changes) {
                    for (i in ev.changes) {
                        if (ev.changes.hasOwnProperty(i)) {
                            node = RED.nodes.node(i);
                            if (node) {
                                for (var d in ev.changes[i]) {
                                    if (ev.changes[i].hasOwnProperty(d)) {
                                        node[d] = ev.changes[i][d];
                                    }
                                }
                                node.dirty = true;
                            }
                        }
                    }

                }
            } else if (ev.t == "move") {
                for (i = 0; i < ev.nodes.length; i++) {
                    var n = ev.nodes[i];
                    n.n.x = n.ox;
                    n.n.y = n.oy;
                    n.n.dirty = true;
                    n.n.changed = n.changed;
                }
                // A move could have caused a link splice
                if (ev.links) {
                    for (i = 0; i < ev.links.length; i++) {
                        RED.nodes.removeLink(ev.links[i]);
                    }
                }
                if (ev.removedLinks) {
                    for (i = 0; i < ev.removedLinks.length; i++) {
                        RED.nodes.addLink(ev.removedLinks[i]);
                    }
                }
            } else if (ev.t == "edit") {
                for (i in ev.changes) {
                    if (ev.changes.hasOwnProperty(i)) {
                        if (ev.node._def.defaults[i].type) {
                            // This is a config node property
                            var currentConfigNode = RED.nodes.node(ev.node[i]);
                            if (currentConfigNode) {
                                currentConfigNode.users.splice(currentConfigNode.users.indexOf(ev.node), 1);
                            }
                            var newConfigNode = RED.nodes.node(ev.changes[i]);
                            if (newConfigNode) {
                                newConfigNode.users.push(ev.node);
                            }
                        }
                        ev.node[i] = ev.changes[i];
                    }
                }
                if (ev.subflow) {
                    if (ev.subflow.hasOwnProperty('inputCount')) {
                        if (ev.node.in.length > ev.subflow.inputCount) {
                            ev.node.in.splice(ev.subflow.inputCount);
                        } else if (ev.subflow.inputs.length > 0) {
                            ev.node.in = ev.node.in.concat(ev.subflow.inputs);
                        }
                    }
                    if (ev.subflow.hasOwnProperty('outputCount')) {
                        if (ev.node.out.length > ev.subflow.outputCount) {
                            ev.node.out.splice(ev.subflow.outputCount);
                        } else if (ev.subflow.outputs.length > 0) {
                            ev.node.out = ev.node.out.concat(ev.subflow.outputs);
                        }
                    }
                    if (ev.subflow.hasOwnProperty('instances')) {
                        ev.subflow.instances.forEach(function (n) {
                            var node = RED.nodes.node(n.id);
                            if (node) {
                                node.changed = n.changed;
                                node.dirty = true;
                            }
                        });
                    }
                    RED.nodes.filterNodes({ type: "subflow:" + ev.node.id }).forEach(function (n) {
                        n.inputs = ev.node.in.length;
                        n.outputs = ev.node.out.length;
                        RED.editor.updateNodeProperties(n);
                    });
                } else {
                    var outputMap;
                    if (ev.outputMap) {
                        outputMap = {};
                        for (var port in ev.outputMap) {
                            if (ev.outputMap.hasOwnProperty(port) && ev.outputMap[port] !== -1) {
                                outputMap[ev.outputMap[port]] = port;
                            }
                        }
                    }
                    RED.editor.updateNodeProperties(ev.node, outputMap);
                    RED.editor.validateNode(ev.node);
                }
                if (ev.links) {
                    for (i = 0; i < ev.links.length; i++) {
                        RED.nodes.addLink(ev.links[i]);
                    }
                }
                ev.node.dirty = true;
                ev.node.changed = ev.changed;
            } else if (ev.t == "createSubflow") {
                if (ev.nodes) {
                    RED.nodes.filterNodes({ z: ev.subflow.subflow.id }).forEach(function (n) {
                        n.z = ev.activeWorkspace;
                        n.dirty = true;
                    });
                    for (i = 0; i < ev.nodes.length; i++) {
                        RED.nodes.remove(ev.nodes[i]);
                    }
                }
                if (ev.links) {
                    for (i = 0; i < ev.links.length; i++) {
                        RED.nodes.removeLink(ev.links[i]);
                    }
                }

                RED.nodes.removeSubflow(ev.subflow.subflow);
                RED.workspaces.remove(ev.subflow.subflow);

                if (ev.removedLinks) {
                    for (i = 0; i < ev.removedLinks.length; i++) {
                        RED.nodes.addLink(ev.removedLinks[i]);
                    }
                }
            } else if (ev.t == "reorder") {
                if (ev.order) {
                    RED.workspaces.order(ev.order);
                }
            }
            Object.keys(modifiedTabs).forEach(function (id) {
                var subflow = RED.nodes.subflow(id);
                if (subflow) {
                    RED.editor.validateNode(subflow);
                }
            });

            RED.nodes.dirty(ev.dirty);
            RED.view.redraw(true);
            RED.palette.refresh();
            RED.workspaces.refresh();
            // RED.sidebar.config.refresh();
        }

    }

    return {
        //TODO: this function is a placeholder until there is a 'save' event that can be listened to
        markAllDirty: function () {
            for (var i = 0; i < undo_history.length; i++) {
                undo_history[i].dirty = true;
            }
        },
        list: function () {
            return undo_history
        },
        depth: function () {
            return undo_history.length;
        },
        push: function (ev) {
            undo_history.push(ev);
        },
        pop: function () {
            var ev = undo_history.pop();
            undoEvent(ev);
        },
        peek: function () {
            return undo_history[undo_history.length - 1];
        }
    }

})();
RED.validators = {
    number: function () { return function (v) { return v !== '' && !isNaN(v); } },
    regex: function (re) { return function (v) { return re.test(v); } },
    typedInput: function (ptypeName, isConfig) {
        return function (v) {
            var ptype = $("#node-" + (isConfig ? "config-" : "") + "input-" + ptypeName).val() || this[ptypeName];
            if (ptype === 'json') {
                try {
                    JSON.parse(v);
                    return true;
                } catch (err) {
                    return false;
                }
            } else if (ptype === 'msg' || ptype === 'flow' || ptype === 'global') {
                return RED.utils.validatePropertyExpression(v);
            } else if (ptype === 'num') {
                return /^[+-]?[0-9]*\.?[0-9]*([eE][-+]?[0-9]+)?$/.test(v);
            }
            return true;
        }
    }
};
RED.utils = (function () {

    function formatString(str) {
        return str.replace(/\r?\n/g, "&crarr;").replace(/\t/g, "&rarr;");
    }
    function sanitize(m) {
        return m.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }

    function buildMessageSummaryValue(value) {
        var result;
        if (Array.isArray(value)) {
            result = $('<span class="debug-message-object-value debug-message-type-meta"></span>').html('array[' + value.length + ']');
        } else if (value === null) {
            result = $('<span class="debug-message-object-value debug-message-type-null">null</span>');
        } else if (typeof value === 'object') {
            if (value.hasOwnProperty('type') && value.type === 'Buffer' && value.hasOwnProperty('data')) {
                result = $('<span class="debug-message-object-value debug-message-type-meta"></span>').html('buffer[' + value.data.length + ']');
            } else if (value.hasOwnProperty('type') && value.type === 'array' && value.hasOwnProperty('data')) {
                result = $('<span class="debug-message-object-value debug-message-type-meta"></span>').html('array[' + value.length + ']');
            } else {
                result = $('<span class="debug-message-object-value debug-message-type-meta">object</span>');
            }
        } else if (typeof value === 'string') {
            var subvalue;
            if (value.length > 30) {
                subvalue = sanitize(value.substring(0, 30)) + "&hellip;";
            } else {
                subvalue = sanitize(value);
            }
            result = $('<span class="debug-message-object-value debug-message-type-string"></span>').html('"' + formatString(subvalue) + '"');
        } else {
            result = $('<span class="debug-message-object-value debug-message-type-other"></span>').text("" + value);
        }
        return result;
    }
    function makeExpandable(el, onexpand) {
        el.addClass("debug-message-expandable");
        el.click(function (e) {
            var parent = $(this).parent();
            if (parent.hasClass('collapsed')) {
                if (onexpand && !parent.hasClass('built')) {
                    onexpand();
                    parent.addClass('built');
                }
                parent.removeClass('collapsed');
            } else {
                parent.addClass('collapsed');
            }
            e.preventDefault();
        });
    }

    function buildMessageElement(obj, key, typeHint, hideKey) {
        var i;
        var e;
        var entryObj;
        var header;
        var headerHead;
        var value;
        var element = $('<span class="debug-message-element"></span>');
        if (!key) {
            element.addClass("debug-message-top-level");
        }

        header = $('<span></span>').appendTo(element);

        if (key && !hideKey) {
            $('<span class="debug-message-object-key"></span>').text(key).appendTo(header);
            $('<span>: </span>').appendTo(header);
        }
        entryObj = $('<span class="debug-message-object-value"></span>').appendTo(header);

        var isArray = Array.isArray(obj);
        var isArrayObject = false;
        if (obj && typeof obj === 'object' && obj.hasOwnProperty('type') && obj.hasOwnProperty('data') && ((obj.__encoded__ && obj.type === 'array') || obj.type === 'Buffer')) {
            isArray = true;
            isArrayObject = true;
        }

        if (obj === null || obj === undefined) {
            $('<span class="debug-message-type-null">' + obj + '</span>').appendTo(entryObj);
        } else if (typeof obj === 'string') {
            if (/[\t\n\r]/.test(obj)) {
                element.addClass('collapsed');
                $('<i class="fa fa-caret-right debug-message-object-handle"></i> ').prependTo(header);
                makeExpandable(header, function () {
                    $('<span class="debug-message-type-meta debug-message-object-type-header"></span>').html(typeHint || 'string').appendTo(header);
                    var row = $('<div class="debug-message-object-entry collapsed"></div>').appendTo(element);
                    $('<pre class="debug-message-type-string"></pre>').text(obj).appendTo(row);
                });
            }
            e = $('<span class="debug-message-type-string debug-message-object-header"></span>').html('"' + formatString(sanitize(obj)) + '"').appendTo(entryObj);
            if (/^#[0-9a-f]{6}$/i.test(obj)) {
                $('<span class="debug-message-type-string-swatch"></span>').css('backgroundColor', obj).appendTo(e);
            }

        } else if (typeof obj === 'number') {
            e = $('<span class="debug-message-type-number"></span>').text("" + obj).appendTo(entryObj);
            if (Number.isInteger(obj) && (obj >= 0)) { // if it's a +ve integer
                e.addClass("debug-message-type-number-toggle");
                e.click(function (evt) {
                    var format = $(this).data('format') || "date";
                    if (format === 'dec') {
                        $(this).text("" + obj).data('format', 'date');
                    } else if ((format === 'date') && (obj.toString().length === 13) && (obj <= 2147483647000)) {
                        $(this).text((new Date(obj)).toISOString()).data('format', 'hex');
                    } else if ((format === 'date') && (obj.toString().length === 10) && (obj <= 2147483647)) {
                        $(this).text((new Date(obj * 1000)).toISOString()).data('format', 'hex');
                    } else {
                        $(this).text("0x" + (obj).toString(16)).data('format', 'dec');
                    }
                    evt.preventDefault();
                });
            }
        } else if (isArray) {
            element.addClass('collapsed');

            var originalLength = obj.length;
            if (typeHint) {
                var m = /\[(\d+)\]/.exec(typeHint);
                if (m) {
                    originalLength = parseInt(m[1]);
                }
            }
            var data = obj;
            var type = 'array';
            if (isArrayObject) {
                data = obj.data;
                if (originalLength === undefined) {
                    originalLength = data.length;
                }
                if (data.__encoded__) {
                    data = data.data;
                }
                type = obj.type.toLowerCase();
            } else if (/buffer/.test(typeHint)) {
                type = 'buffer';
            }
            var fullLength = data.length;

            if (originalLength > 0) {
                $('<i class="fa fa-caret-right debug-message-object-handle"></i> ').prependTo(header);
                var arrayRows = $('<div class="debug-message-array-rows"></div>').appendTo(element);
                element.addClass('debug-message-buffer-raw');
                makeExpandable(header, function () {
                    if (!key) {
                        headerHead = $('<span class="debug-message-type-meta debug-message-object-type-header"></span>').html(typeHint || (type + '[' + originalLength + ']')).appendTo(header);
                    }
                    if (type === 'buffer') {
                        var stringRow = $('<div class="debug-message-string-rows"></div>').appendTo(element);
                        var sr = $('<div class="debug-message-object-entry collapsed"></div>').appendTo(stringRow);
                        var stringEncoding = "";
                        try {
                            stringEncoding = String.fromCharCode.apply(null, new Uint16Array(data))
                        } catch (err) {
                            console.log(err);
                        }
                        $('<pre class="debug-message-type-string"></pre>').text(stringEncoding).appendTo(sr);
                        var bufferOpts = $('<span class="debug-message-buffer-opts"></span>').appendTo(headerHead);
                        $('<a href="#"></a>').addClass('selected').html('raw').appendTo(bufferOpts).click(function (e) {
                            if ($(this).text() === 'raw') {
                                $(this).text('string');
                                element.addClass('debug-message-buffer-string').removeClass('debug-message-buffer-raw');
                            } else {
                                $(this).text('raw');
                                element.removeClass('debug-message-buffer-string').addClass('debug-message-buffer-raw');
                            }
                            e.preventDefault();
                            e.stopPropagation();
                        })
                    }
                    var row;
                    if (fullLength <= 10) {
                        for (i = 0; i < fullLength; i++) {
                            row = $('<div class="debug-message-object-entry collapsed"></div>').appendTo(arrayRows);
                            buildMessageElement(data[i], "" + i, false).appendTo(row);
                        }
                    } else {
                        for (i = 0; i < fullLength; i += 10) {
                            var minRange = i;
                            row = $('<div class="debug-message-object-entry collapsed"></div>').appendTo(arrayRows);
                            header = $('<span></span>').appendTo(row);
                            $('<i class="fa fa-caret-right debug-message-object-handle"></i> ').appendTo(header);
                            makeExpandable(header, (function () {
                                var min = minRange;
                                var max = Math.min(fullLength - 1, (minRange + 9));
                                var parent = row;
                                return function () {
                                    for (var i = min; i <= max; i++) {
                                        var row = $('<div class="debug-message-object-entry collapsed"></div>').appendTo(parent);
                                        buildMessageElement(data[i], "" + i, false).appendTo(row);
                                    }
                                }
                            })());
                            $('<span class="debug-message-object-key"></span>').html("[" + minRange + " &hellip; " + Math.min(fullLength - 1, (minRange + 9)) + "]").appendTo(header);
                        }
                        if (fullLength < originalLength) {
                            $('<div class="debug-message-object-entry collapsed"><span class="debug-message-object-key">[' + fullLength + ' &hellip; ' + originalLength + ']</span></div>').appendTo(arrayRows);
                        }
                    }
                });
            }
            if (key) {
                headerHead = $('<span class="debug-message-type-meta f"></span>').html(typeHint || (type + '[' + originalLength + ']')).appendTo(entryObj);
            } else {
                headerHead = $('<span class="debug-message-object-header"></span>').appendTo(entryObj);
                $('<span>[ </span>').appendTo(headerHead);
                var arrayLength = Math.min(originalLength, 10);
                for (i = 0; i < arrayLength; i++) {
                    buildMessageSummaryValue(data[i]).appendTo(headerHead);
                    if (i < arrayLength - 1) {
                        $('<span>, </span>').appendTo(headerHead);
                    }
                }
                if (originalLength > arrayLength) {
                    $('<span> &hellip;</span>').appendTo(headerHead);
                }
                if (arrayLength === 0) {
                    $('<span class="debug-message-type-meta">empty</span>').appendTo(headerHead);
                }
                $('<span> ]</span>').appendTo(headerHead);
            }

        } else if (typeof obj === 'object') {
            element.addClass('collapsed');
            var keys = Object.keys(obj);
            if (key || keys.length > 0) {
                $('<i class="fa fa-caret-right debug-message-object-handle"></i> ').prependTo(header);
                makeExpandable(header, function () {
                    if (!key) {
                        $('<span class="debug-message-type-meta debug-message-object-type-header"></span>').html('object').appendTo(header);
                    }
                    for (i = 0; i < keys.length; i++) {
                        var row = $('<div class="debug-message-object-entry collapsed"></div>').appendTo(element);
                        buildMessageElement(obj[keys[i]], keys[i], false).appendTo(row);
                    }
                    if (keys.length === 0) {
                        $('<div class="debug-message-object-entry debug-message-type-meta collapsed"></div>').text("empty").appendTo(element);
                    }
                });
            }
            if (key) {
                $('<span class="debug-message-type-meta"></span>').html('object').appendTo(entryObj);
            } else {
                headerHead = $('<span class="debug-message-object-header"></span>').appendTo(entryObj);
                $('<span>{ </span>').appendTo(headerHead);
                var keysLength = Math.min(keys.length, 5);
                for (i = 0; i < keysLength; i++) {
                    $('<span class="debug-message-object-key"></span>').text(keys[i]).appendTo(headerHead);
                    $('<span>: </span>').appendTo(headerHead);
                    buildMessageSummaryValue(obj[keys[i]]).appendTo(headerHead);
                    if (i < keysLength - 1) {
                        $('<span>, </span>').appendTo(headerHead);
                    }
                }
                if (keys.length > keysLength) {
                    $('<span> &hellip;</span>').appendTo(headerHead);
                }
                if (keysLength === 0) {
                    $('<span class="debug-message-type-meta">empty</span>').appendTo(headerHead);
                }
                $('<span> }</span>').appendTo(headerHead);
            }
        } else {
            $('<span class="debug-message-type-other"></span>').text("" + obj).appendTo(entryObj);
        }
        return element;
    }

    function validatePropertyExpression(str) {
        // This must be kept in sync with normalisePropertyExpression
        // in red/runtime/util.js

        var length = str.length;
        if (length === 0) {
            return false;
        }
        var start = 0;
        var inString = false;
        var inBox = false;
        var quoteChar;
        var v;
        for (var i = 0; i < length; i++) {
            var c = str[i];
            if (!inString) {
                if (c === "'" || c === '"') {
                    if (i != start) {
                        return false;
                    }
                    inString = true;
                    quoteChar = c;
                    start = i + 1;
                } else if (c === '.') {
                    if (i === 0 || i === length - 1) {
                        return false;
                    }
                    // Next char is first char of an identifier: a-z 0-9 $ _
                    if (!/[a-z0-9\$\_]/i.test(str[i + 1])) {
                        return false;
                    }
                    start = i + 1;
                } else if (c === '[') {
                    if (i === 0) {
                        return false;
                    }
                    if (i === length - 1) {
                        return false;
                    }
                    // Next char is either a quote or a number
                    if (!/["'\d]/.test(str[i + 1])) {
                        return false;
                    }
                    start = i + 1;
                    inBox = true;
                } else if (c === ']') {
                    if (!inBox) {
                        return false;
                    }
                    if (start != i) {
                        v = str.substring(start, i);
                        if (!/^\d+$/.test(v)) {
                            return false;
                        }
                    }
                    start = i + 1;
                    inBox = false;
                } else if (c === ' ') {
                    return false;
                }
            } else {
                if (c === quoteChar) {
                    if (i - start === 0) {
                        return false;
                    }
                    // Next char must be a ]
                    if (inBox && !/\]/.test(str[i + 1])) {
                        return false;
                    } else if (!inBox && i + 1 !== length && !/[\[\.]/.test(str[i + 1])) {
                        return false;
                    }
                    start = i + 1;
                    inString = false;
                }
            }

        }
        if (inBox || inString) {
            return false;
        }
        return true;
    }

    return {
        createObjectElement: buildMessageElement,
        validatePropertyExpression: validatePropertyExpression
    }
})();
(function ($) {

    /**
     * options:
     *   - addButton : boolean|string - text for add label, default 'add'
     *   - height : number|'auto'
     *   - resize : function - called when list as a whole is resized
     *   - resizeItem : function(item) - called to resize individual item
     *   - sortable : boolean|string - string is the css selector for handle
     *   - sortItems : function(items) - when order of items changes
     *   - connectWith : css selector of other sortables
     *   - removable : boolean - whether to display delete button on items
     *   - addItem : function(row,index,itemData) - when an item is added
     *   - removeItem : function(itemData) - called when an item is removed
     *   - filter : function(itemData) - called for each item to determine if it should be shown
     *   - sort : function(itemDataA,itemDataB) - called to sort items
     *   - scrollOnAdd : boolean - whether to scroll to newly added items
     * methods:
     *   - addItem(itemData)
     *   - removeItem(itemData)
     *   - width(width)
     *   - height(height)
     *   - items()
     *   - empty()
     *   - filter(filter)
     *   - sort(sort)
     *   - length()
     */
    $.widget("nodered.editableList", {
        _create: function () {
            var that = this;

            this.element.addClass('red-ui-editableList-list');
            this.uiWidth = this.element.width();
            this.uiContainer = this.element
                .wrap("<div>")
                .parent();
            this.topContainer = this.uiContainer.wrap("<div>").parent();

            this.topContainer.addClass('red-ui-editableList');

            if (this.options.addButton !== false) {
                var addLabel;
                if (typeof this.options.addButton === 'string') {
                    addLabel = this.options.addButton
                } else {
                    if (RED && RED._) {
                        addLabel = RED._("editableList.add");
                    } else {
                        addLabel = 'add';
                    }
                }
                $('<a href="#" class="editor-button editor-button-small" style="margin-top: 4px;"><i class="fa fa-plus"></i> ' + addLabel + '</a>')
                    .appendTo(this.topContainer)
                    .click(function (evt) {
                        evt.preventDefault();
                        that.addItem({});
                    });
            }
            if (this.element.css("position") === "absolute") {
                ["top", "left", "bottom", "right"].forEach(function (s) {
                    var v = that.element.css(s);
                    if (s !== "auto" && s !== "") {
                        that.topContainer.css(s, v);
                        that.uiContainer.css(s, "0");
                        that.element.css(s, 'auto');
                    }
                })
                this.element.css("position", "static");
                this.topContainer.css("position", "absolute");
                this.uiContainer.css("position", "absolute");

            }
            this.uiContainer.addClass("red-ui-editableList-container");

            this.uiHeight = this.element.height();

            this.activeFilter = this.options.filter || null;
            this.activeSort = this.options.sort || null;
            this.scrollOnAdd = this.options.scrollOnAdd;
            if (this.scrollOnAdd === undefined) {
                this.scrollOnAdd = true;
            }
            var minHeight = this.element.css("minHeight");
            if (minHeight !== '0px') {
                this.uiContainer.css("minHeight", minHeight);
                this.element.css("minHeight", 0);
            }
            if (this.options.height !== 'auto') {
                this.uiContainer.css("overflow-y", "scroll");
                if (!isNaN(this.options.height)) {
                    this.uiHeight = this.options.height;
                }
            }
            this.element.height('auto');

            var attrStyle = this.element.attr('style');
            var m;
            if ((m = /width\s*:\s*(\d+%)/i.exec(attrStyle)) !== null) {
                this.element.width('100%');
                this.uiContainer.width(m[1]);
            }
            if (this.options.sortable) {
                var handle = (typeof this.options.sortable === 'string') ?
                    this.options.sortable :
                    ".red-ui-editableList-item-handle";
                var sortOptions = {
                    axis: "y",
                    update: function (event, ui) {
                        if (that.options.sortItems) {
                            that.options.sortItems(that.items());
                        }
                    },
                    handle: handle,
                    cursor: "move",
                    tolerance: "pointer",
                    forcePlaceholderSize: true,
                    placeholder: "red-ui-editabelList-item-placeholder",
                    start: function (e, ui) {
                        ui.placeholder.height(ui.item.height() - 4);
                    }
                };
                if (this.options.connectWith) {
                    sortOptions.connectWith = this.options.connectWith;
                }

                this.element.sortable(sortOptions);
            }

            this._resize();

            // this.menu = this._createMenu(this.types, function(v) { that.type(v) });
            // this.type(this.options.default||this.types[0].value);
        },
        _resize: function () {
            var currentFullHeight = this.topContainer.height();
            var innerHeight = this.uiContainer.height();
            var delta = currentFullHeight - innerHeight;
            if (this.uiHeight !== 0) {
                this.uiContainer.height(this.uiHeight - delta);
            }
            if (this.options.resize) {
                this.options.resize();
            }
            if (this.options.resizeItem) {
                var that = this;
                this.element.children().each(function (i) {
                    that.options.resizeItem($(this).find(".red-ui-editableList-item-content"), i);
                });
            }
        },
        _destroy: function () {
        },
        _refreshFilter: function () {
            var that = this;
            var count = 0;
            if (!this.activeFilter) {
                this.element.children().attr("style", "display: block !important");
            }
            var items = this.items();
            items.each(function (i, el) {
                var data = el.data('data');
                try {
                    if (that.activeFilter(data)) {
                        el.parent().attr("style", "display: block !important");
                        count++;
                    } else {
                        el.parent().hide();
                    }
                } catch (err) {
                    console.log(err);
                    el.parent().attr("style", "display: block !important");
                    count++;
                }
            });
            return count;
        },
        _refreshSort: function () {
            if (this.activeSort) {
                var items = this.element.children();
                var that = this;
                items.sort(function (A, B) {
                    return that.activeSort($(A).find(".red-ui-editableList-item-content").data('data'), $(B).find(".red-ui-editableList-item-content").data('data'));
                });
                $.each(items, function (idx, li) {
                    that.element.append(li);
                })
            }
        },
        width: function (desiredWidth) {
            this.uiWidth = desiredWidth;
            this._resize();
        },
        height: function (desiredHeight) {
            this.uiHeight = desiredHeight;
            this._resize();
        },
        addItem: function (data) {
            var that = this;
            data = data || {};
            var li = $('<li>');
            var added = false;
            if (this.activeSort) {
                var items = this.items();
                var skip = false;
                items.each(function (i, el) {
                    if (added) { return }
                    var itemData = el.data('data');
                    if (that.activeSort(data, itemData) < 0) {
                        li.insertBefore(el.closest("li"));
                        added = true;
                    }
                });
            }
            if (!added) {
                li.appendTo(this.element);
            }
            var row = $('<div/>').addClass("red-ui-editableList-item-content").appendTo(li);
            row.data('data', data);
            if (this.options.sortable === true) {
                $('<i class="red-ui-editableList-item-handle fa fa-bars"></i>').appendTo(li);
                li.addClass("red-ui-editableList-item-sortable");
            }
            if (this.options.removable) {
                var deleteButton = $('<a/>', { href: "#", class: "red-ui-editableList-item-remove editor-button editor-button-small" }).appendTo(li);
                $('<i/>', { class: "fa fa-remove" }).appendTo(deleteButton);
                li.addClass("red-ui-editableList-item-removable");
                deleteButton.click(function (evt) {
                    evt.preventDefault();
                    var data = row.data('data');
                    li.addClass("red-ui-editableList-item-deleting")
                    li.fadeOut(300, function () {
                        $(this).remove();
                        if (that.options.removeItem) {
                            that.options.removeItem(data);
                        }
                    });
                });
            }
            if (this.options.addItem) {
                var index = that.element.children().length - 1;
                setTimeout(function () {
                    that.options.addItem(row, index, data);
                    if (that.activeFilter) {
                        try {
                            if (!that.activeFilter(data)) {
                                li.hide();
                            }
                        } catch (err) {
                        }
                    }

                    if (!that.activeSort && that.scrollOnAdd) {
                        setTimeout(function () {
                            that.uiContainer.scrollTop(that.element.height());
                        }, 0);
                    }
                }, 0);
            }
        },
        removeItem: function (data) {
            var items = this.element.children().filter(function (f) {
                return data === $(this).find(".red-ui-editableList-item-content").data('data');
            });
            items.remove();
            if (this.options.removeItem) {
                this.options.removeItem(data);
            }
        },
        items: function () {
            return this.element.children().map(function (i) { return $(this).find(".red-ui-editableList-item-content"); });
        },
        empty: function () {
            this.element.empty();
        },
        filter: function (filter) {
            if (filter !== undefined) {
                this.activeFilter = filter;
            }
            return this._refreshFilter();
        },
        sort: function (sort) {
            if (sort !== undefined) {
                this.activeSort = sort;
            }
            return this._refreshSort();
        },
        length: function () {
            return this.element.children().length;
        }
    });
})(jQuery);

// Handles display of user-friendly alert boxes
// RED.popover is not needed


(function ($) {

    $.widget("nodered.searchBox", {
        _create: function () {
            var that = this;

            this.currentTimeout = null;
            this.lastSent = "";
            this.element.val("");
            this.uiContainer = this.element.wrap("<div>").parent();
            this.uiContainer.addClass("red-ui-searchBox-container");

            $('<i class="fa fa-search"></i>').prependTo(this.uiContainer);
            this.clearButton = $('<a href="#"><i class="fa fa-times"></i></a>').appendTo(this.uiContainer);
            this.clearButton.on("click", function (e) {
                e.preventDefault();
                that.element.val("");
                that._change("", true);
                that.element.focus();
            });

            this.resultCount = $('<span>', { class: "red-ui-searchBox-resultCount hide" }).appendTo(this.uiContainer);

            this.element.val("");
            this.element.on("keydown", function (evt) {
                if (evt.keyCode === 27) {
                    that.element.val("");
                }
            })
            this.element.on("keyup", function (evt) {
                that._change($(this).val());
            });

            this.element.on("focus", function () {
                $("body").one("mousedown", function () {
                    that.element.blur();
                });
            });

        },
        _change: function (val, instant) {
            var fireEvent = false;
            if (val === "") {
                this.clearButton.hide();
                fireEvent = true;
            } else {
                this.clearButton.attr("style", "display: block !important");
                fireEvent = (val.length >= (this.options.minimumLength || 0));
            }
            var current = this.element.val();
            fireEvent = fireEvent && current !== this.lastSent;
            if (fireEvent) {
                if (!instant && this.options.delay > 0) {
                    clearTimeout(this.currentTimeout);
                    var that = this;
                    this.currentTimeout = setTimeout(function () {
                        that.lastSent = that.element.val();
                        that._trigger("change");
                    }, this.options.delay);
                } else {
                    this._trigger("change");
                }
            }
        },
        value: function (val) {
            if (val === undefined) {
                return this.element.val();
            } else {
                this.element.val(val);
                this._change(val);
            }
        },
        count: function (val) {
            if (val === undefined || val === null || val === "") {
                this.resultCount.text("").hide();
            } else {
                this.resultCount.text(val).attr("style", "display: block !important");
            }
        }
    });
})(jQuery);
RED.tabs = (function () {
    function createTabs(options) {
        var tabs = {};
        var currentTabWidth;
        var currentActiveTabWidth = 0;

        return {
            addTab: function (tab) {
                tabs[tab.id] = tab;
                if (options.onadd) {
                    options.onadd(tab);
                }
            },
            clear: function () { tabs = {}; },
            removeTab: function () { },
            activateTab: function (link) {
                if (options.onchange) {
                    options.onchange({ id: link });
                }
            },
            nextTab: function () { },
            previousTab: function () { },
            resize: function () { },
            count: function () {
                return 1;
            },
            contains: function (id) {
                return id == RED.__currentFlow;
            },
            renameTab: function (id, label) {
                tabs[id].label = label;
            },
            order: function (order) { }

        }
    }

    return {
        create: createTabs
    }
})();
(function ($) {
    var allOptions = {
        msg: { value: "msg", label: "msg.", validate: RED.utils.validatePropertyExpression },
        flow: { value: "flow", label: "flow.", validate: RED.utils.validatePropertyExpression },
        global: { value: "global", label: "global.", validate: RED.utils.validatePropertyExpression },
        str: { value: "str", label: "string", icon: `${PROXY_URL}flows/red/images/typedInput/az.png` },
        num: { value: "num", label: "number", icon: `${PROXY_URL}flows/red/images/typedInput/09.png`, validate: /^[+-]?[0-9]*\.?[0-9]*([eE][-+]?[0-9]+)?$/ },
        bool: { value: "bool", label: "boolean", icon: `${PROXY_URL}flows/red/images/typedInput/bool.png`, options: ["true", "false"] },
        json: { value: "json", label: "JSON", icon: `${PROXY_URL}flows/red/images/typedInput/json.png`, validate: function (v) { try { JSON.parse(v); return true; } catch (e) { return false; } } },
        re: { value: "re", label: "regular expression", icon: `${PROXY_URL}flows/red/images/typedInput/re.png` },
        date: { value: "date", label: "timestamp", hasValue: false },
        jsonata: {
            value: "jsonata",
            label: "expression",
            icon: `${PROXY_URL}flows/red/images/typedInput/expr.png`,
            validate: function (v) { try { jsonata(v); return true; } catch (e) { return false; } },
            expand: function () {
                var that = this;
                RED.editor.editExpression({
                    value: this.value().replace(/\t/g, "\n"),
                    complete: function (v) {
                        that.value(v.replace(/\n/g, "\t"));
                    }
                })
            }
        }
    };
    var nlsd = false;

    $.widget("nodered.typedInput", {
        _create: function () {
            if (!nlsd && RED && RED._) {
                for (var i in allOptions) {
                    if (allOptions.hasOwnProperty(i)) {
                        allOptions[i].label = RED._("typedInput.type." + i, { defaultValue: allOptions[i].label });
                    }
                }
            }
            nlsd = true;
            var that = this;

            this.disarmClick = false;
            this.element.addClass('red-ui-typedInput');
            this.uiWidth = this.element.outerWidth();
            this.elementDiv = this.element.wrap("<div>").parent().addClass('red-ui-typedInput-input');
            this.uiSelect = this.elementDiv.wrap("<div>").parent();
            var attrStyle = this.element.attr('style');
            var m;
            if ((m = /width\s*:\s*(\d+(%|px))/i.exec(attrStyle)) !== null) {
                this.element.css('width', '100%');
                this.uiSelect.width(m[1]);
                this.uiWidth = null;
            } else {
                if (this.uiWidth > 70) {
                    this.uiSelect.width(this.uiWidth);
                }
                else {
                    this.uiSelect.width(this.uiWidth + '%');
                }
            }
            ["Right", "Left"].forEach(function (d) {
                var m = that.element.css("margin" + d);
                that.uiSelect.css("margin" + d, m);
                that.element.css("margin" + d, 0);
            });
            this.uiSelect.addClass("red-ui-typedInput-container");

            this.options.types = this.options.types || Object.keys(allOptions);

            this.selectTrigger = $('<button tabindex="0"></button>').prependTo(this.uiSelect);
            $('<i class="fa fa-sort-desc"></i>').appendTo(this.selectTrigger);
            this.selectLabel = $('<span></span>').appendTo(this.selectTrigger);

            this.types(this.options.types);

            if (this.options.typeField) {
                this.typeField = $(this.options.typeField).hide();
                var t = this.typeField.val();
                if (t && this.typeMap[t]) {
                    this.options.default = t;
                }
            } else {
                this.typeField = $("<input>", { type: 'hidden' }).appendTo(this.uiSelect);
            }

            this.element.on('focus', function () {
                that.uiSelect.addClass('red-ui-typedInput-focus');
            });
            this.element.on('blur', function () {
                that.uiSelect.removeClass('red-ui-typedInput-focus');
            });
            this.element.on('change', function () {
                that.validate();
            })
            this.selectTrigger.click(function (event) {
                event.preventDefault();
                that._showTypeMenu();
            });
            this.selectTrigger.on('keydown', function (evt) {
                if (evt.keyCode === 40) {
                    // Down
                    that._showTypeMenu();
                }
            }).on('focus', function () {
                that.uiSelect.addClass('red-ui-typedInput-focus');
            })

            // explicitly set optionSelectTrigger display to inline-block otherwise jQ sets it to 'inline'
            this.optionSelectTrigger = $('<button tabindex="0" class="red-ui-typedInput-option-trigger" style="display:inline-block"><span class="red-ui-typedInput-option-caret"><i class="fa fa-sort-desc"></i></span></button>').appendTo(this.uiSelect);
            this.optionSelectLabel = $('<span class="red-ui-typedInput-option-label"></span>').prependTo(this.optionSelectTrigger);
            this.optionSelectTrigger.click(function (event) {
                event.preventDefault();
                that._showOptionSelectMenu();
            }).on('keydown', function (evt) {
                if (evt.keyCode === 40) {
                    // Down
                    that._showOptionSelectMenu();
                }
            }).on('blur', function () {
                that.uiSelect.removeClass('red-ui-typedInput-focus');
            }).on('focus', function () {
                that.uiSelect.addClass('red-ui-typedInput-focus');
            });

            this.optionExpandButton = $('<button tabindex="0" class="red-ui-typedInput-option-expand" style="display:inline-block"><i class="fa fa-ellipsis-h"></i></button>').appendTo(this.uiSelect);


            this.type(this.options.default || this.typeList[0].value);
        },
        _showTypeMenu: function () {
            if (this.typeList.length > 1) {
                this._showMenu(this.menu, this.selectTrigger);
                this.menu.find("[value='" + this.propertyType + "']").focus();
            } else {
                this.element.focus();
            }
        },
        _showOptionSelectMenu: function () {
            if (this.optionMenu) {
                this.optionMenu.css({
                    minWidth: this.optionSelectLabel.width()
                });

                this._showMenu(this.optionMenu, this.optionSelectLabel);
                var selectedOption = this.optionMenu.find("[value='" + this.value() + "']");
                if (selectedOption.length === 0) {
                    selectedOption = this.optionMenu.children(":first");
                }
                selectedOption.focus();

            }
        },
        _hideMenu: function (menu) {
            $(document).off("mousedown.close-property-select");
            menu.hide();
            if (this.elementDiv.is(":visible")) {
                this.element.focus();
            } else if (this.optionSelectTrigger.is(":visible")) {
                this.optionSelectTrigger.focus();
            } else {
                this.selectTrigger.focus();
            }
        },
        _createMenu: function (opts, callback) {
            var that = this;
            var menu = $("<div>").addClass("red-ui-typedInput-options");
            opts.forEach(function (opt) {
                if (typeof opt === 'string') {
                    opt = { value: opt, label: opt };
                }
                var op = $('<a href="#"></a>').attr("value", opt.value).appendTo(menu);
                if (opt.label) {
                    op.text(opt.label);
                }
                if (opt.icon) {
                    $('<img>', { src: opt.icon, style: "margin-right: 4px; height: 18px;" }).prependTo(op);
                } else {
                    op.css({ paddingLeft: "18px" });
                }

                op.click(function (event) {
                    event.preventDefault();
                    callback(opt.value);
                    that._hideMenu(menu);
                });
            });
            menu.css({ display: "none", });
            menu.appendTo($('.flows-wrapper'));

            menu.on('keydown', function (evt) {
                if (evt.keyCode === 40) {
                    // DOWN
                    $(this).children(":focus").next().focus();
                } else if (evt.keyCode === 38) {
                    // UP
                    $(this).children(":focus").prev().focus();
                } else if (evt.keyCode === 27) {
                    that._hideMenu(menu);
                }
            })

            return menu;
        },
        _showMenu: function (menu, relativeTo) {
            if (this.disarmClick) {
                this.disarmClick = false;
                return
            }
            var that = this;
            var pos = relativeTo.offset();
            var height = relativeTo.height();
            var menuHeight = menu.height();
            var top = (height + pos.top - 3);
            if (top + menuHeight > $(window).height()) {
                top -= (top + menuHeight) - $(window).height() + 5;
            }
            menu.css({
                top: top + "px",
                left: (2 + pos.left) + "px",
            });
            menu.slideDown(100);
            this._delay(function () {
                that.uiSelect.addClass('red-ui-typedInput-focus');
                $(document).on("mousedown.close-property-select", function (event) {
                    if (!$(event.target).closest(menu).length) {
                        that._hideMenu(menu);
                    }
                    if ($(event.target).closest(relativeTo).length) {
                        that.disarmClick = true;
                        event.preventDefault();
                    }
                })
            });
        },
        _getLabelWidth: function (label) {
            var labelWidth = label.outerWidth();
            if (labelWidth === 0) {
                var container = $('<div class="red-ui-typedInput-container"></div>').css({
                    position: "absolute",
                    top: 0,
                    left: -1000
                }).appendTo($('.flows-wrapper'));
                var newTrigger = label.clone().appendTo(container);
                labelWidth = newTrigger.outerWidth();
                container.remove();
            }
            return labelWidth;
        },
        _resize: function () {
            if (this.typeMap[this.propertyType] && this.typeMap[this.propertyType].hasValue === false) {
                this.selectTrigger.addClass("red-ui-typedInput-full-width");
            } else {
                this.selectTrigger.removeClass("red-ui-typedInput-full-width");
                var labelWidth = this._getLabelWidth(this.selectTrigger);
                this.elementDiv.css('left', labelWidth + "px");
                if (this.optionExpandButton.is(":visible")) {
                    this.elementDiv.css('right', "22px");
                } else {
                    this.elementDiv.css('right', '0');
                }
                if (this.optionSelectTrigger) {
                    this.optionSelectTrigger.css({ 'left': (labelWidth) + "px", 'width': 'calc( 100% - ' + labelWidth + 'px )' });
                }
            }
        },
        _destroy: function () {
            this.menu.remove();
        },
        types: function (types) {
            var that = this;
            var currentType = this.type();
            this.typeMap = {};
            this.typeList = types.map(function (opt) {
                var result;
                if (typeof opt === 'string') {
                    result = allOptions[opt];
                } else {
                    result = opt;
                }
                that.typeMap[result.value] = result;
                return result;
            });
            this.selectTrigger.toggleClass("disabled", this.typeList.length === 1);
            if (this.menu) {
                this.menu.remove();
            }
            this.menu = this._createMenu(this.typeList, function (v) { that.type(v) });
            if (currentType && !this.typeMap.hasOwnProperty(currentType)) {
                this.type(this.typeList[0].value);
            }
        },
        width: function (desiredWidth) {
            this.uiWidth = desiredWidth;
            this._resize();
        },
        value: function (value) {
            if (!arguments.length) {
                return this.element.val();
            } else {
                if (this.typeMap[this.propertyType].options) {
                    if (this.typeMap[this.propertyType].options.indexOf(value) === -1) {
                        value = "";
                    }
                    this.optionSelectLabel.text(value);
                }
                this.element.val(value);
                this.element.trigger('change', this.type(), value);
            }
        },
        type: function (type) {
            if (!arguments.length) {
                return this.propertyType;
            } else {
                var that = this;
                var opt = this.typeMap[type];
                if (opt && this.propertyType !== type) {
                    this.propertyType = type;
                    this.typeField.val(type);
                    this.selectLabel.empty();
                    var image;
                    if (opt.icon) {
                        image = new Image();
                        image.name = opt.icon;
                        image.src = opt.icon;
                        $('<img>', { src: opt.icon, style: "margin-right: 4px;height: 18px;" }).prependTo(this.selectLabel);
                    } else {
                        this.selectLabel.text(opt.label);
                    }
                    if (opt.options) {
                        if (this.optionExpandButton) {
                            this.optionExpandButton.hide();
                        }
                        if (this.optionSelectTrigger) {
                            this.optionSelectTrigger.attr("style", "display: block !important");
                            this.elementDiv.hide();
                            this.optionMenu = this._createMenu(opt.options, function (v) {
                                that.optionSelectLabel.text(v);
                                that.value(v);
                            });
                            var currentVal = this.element.val();
                            if (opt.options.indexOf(currentVal) !== -1) {
                                this.optionSelectLabel.text(currentVal);
                            } else {
                                this.value(opt.options[0]);
                            }
                        }
                    } else {
                        if (this.optionMenu) {
                            this.optionMenu.remove();
                            this.optionMenu = null;
                        }
                        if (this.optionSelectTrigger) {
                            this.optionSelectTrigger.hide();
                        }
                        if (opt.hasValue === false) {
                            this.oldValue = this.element.val();
                            this.element.val("");
                            this.elementDiv.hide();
                        } else {
                            if (this.oldValue !== undefined) {
                                this.element.val(this.oldValue);
                                delete this.oldValue;
                            }
                            this.elementDiv.attr("style", "display: block !important");
                        }
                        if (opt.expand && typeof opt.expand === 'function') {
                            this.optionExpandButton.attr("style", "display: block !important");
                            this.optionExpandButton.off('click');
                            this.optionExpandButton.on('click', function (evt) {
                                evt.preventDefault();
                                opt.expand.call(that);
                            })
                        } else {
                            this.optionExpandButton.hide();
                        }
                        this.element.trigger('change', this.propertyType, this.value());
                    }
                    if (image) {
                        image.onload = function () { that._resize(); }
                        image.onerror = function () { that._resize(); }
                    } else {
                        this._resize();
                    }
                }
            }
        },
        validate: function () {
            var result;
            var value = this.value();
            var type = this.type();
            if (this.typeMap[type] && this.typeMap[type].validate) {
                var val = this.typeMap[type].validate;
                if (typeof val === 'function') {
                    result = val(value);
                } else {
                    result = val.test(value);
                }
            } else {
                result = true;
            }
            if (result) {
                this.uiSelect.removeClass('input-error');
            } else {
                this.uiSelect.addClass('input-error');
            }
            return result;
        },
        show: function () {
            this.uiSelect.show();
            this._resize();
        },
        hide: function () {
            this.uiSelect.hide();
        }
    });
})(jQuery);
RED.actions = (function () {
    var actions = {

    }

    function addAction(name, handler) {
        actions[name] = handler;
    }
    function removeAction(name) {
        delete actions[name];
    }
    function getAction(name) {
        return actions[name];
    }
    function invokeAction(name) {
        if (actions.hasOwnProperty(name)) {
            actions[name]();
        }
    }
    function listActions() {
        var result = [];
        Object.keys(actions).forEach(function (action) {
            var shortcut = RED.keyboard.getShortcut(action);
            result.push({ id: action, scope: shortcut ? shortcut.scope : undefined, key: shortcut ? shortcut.key : undefined })
        })
        return result;
    }
    return {
        add: addAction,
        remove: removeAction,
        get: getAction,
        invoke: invokeAction,
        list: listActions
    }
})();

// handles deployment to node-red backend
// RED.deploy is not needed | TODO: implement save button

// handles conflict resolution with backend version of the flow
// RED.diff is not needed | TODO: implement concurrent usage interface (multi-tenancy)

RED.keyboard = (function () {

    var isMac = /Mac/i.test(window.navigator.platform);

    var handlers = {};
    var partialState;

    var keyMap = {
        "left": 37,
        "up": 38,
        "right": 39,
        "down": 40,
        "escape": 27,
        "enter": 13,
        "backspace": 8,
        "delete": 46,
        "space": 32,
        ";": 186,
        "=": 187,
        ",": 188,
        "-": 189,
        ".": 190,
        "/": 191,
        "\\": 220,
        "'": 222,
        "?": 191 // <- QWERTY specific
    }
    var metaKeyCodes = {
        16: true,
        17: true,
        18: true,
        91: true,
        93: true
    }
    var actionToKeyMap = {}

    // FF generates some different keycodes because reasons.
    var firefoxKeyCodeMap = {
        59: 186,
        61: 187,
        173: 189
    }

    function init() {

        $.getJSON({
            url: `${PROXY_URL}flows/red/keymap.json`,
            type: 'GET',
            headers: {
                "authorization": `Bearer ${util.getToken()}`,
            },
            success: function (data) {
                for (var scope in data) {
                    if (data.hasOwnProperty(scope)) {
                        var keys = data[scope];
                        for (var key in keys) {
                            if (keys.hasOwnProperty(key)) {
                                addHandler(scope, key, keys[key]);
                            }
                        }
                    }
                }
            },
        });

        RED.actions.add("core:show-help", showKeyboardHelp);

    }
    function parseKeySpecifier(key) {
        var parts = key.toLowerCase().split("-");
        var modifiers = {};
        var keycode;
        var blank = 0;
        for (var i = 0; i < parts.length; i++) {
            switch (parts[i]) {
                case "ctrl":
                case "cmd":
                    modifiers.ctrl = true;
                    modifiers.meta = true;
                    break;
                case "alt":
                    modifiers.alt = true;
                    break;
                case "shift":
                    modifiers.shift = true;
                    break;
                case "":
                    blank++;
                    keycode = keyMap["-"];
                    break;
                default:
                    if (keyMap.hasOwnProperty(parts[i])) {
                        keycode = keyMap[parts[i]];
                    } else if (parts[i].length > 1) {
                        return null;
                    } else {
                        keycode = parts[i].toUpperCase().charCodeAt(0);
                    }
                    break;
            }
        }
        return [keycode, modifiers];
    }

    function resolveKeyEvent(evt) {
        var slot = partialState || handlers;
        if (evt.ctrlKey || evt.metaKey) {
            slot = slot.ctrl;
        }
        if (slot && evt.shiftKey) {
            slot = slot.shift;
        }
        if (slot && evt.altKey) {
            slot = slot.alt;
        }
        var keyCode = firefoxKeyCodeMap[evt.keyCode] || evt.keyCode;
        if (slot && slot[keyCode]) {
            var handler = slot[keyCode];
            if (!handler.scope) {
                if (partialState) {
                    partialState = null;
                    return resolveKeyEvent(evt);
                } else {
                    partialState = handler;
                    evt.preventDefault();
                    return null;
                }
            } else if (handler.scope && handler.scope !== "*") {
                var target = evt.target;
                while (target.nodeName !== 'BODY' && target.id !== handler.scope) {
                    target = target.parentElement;
                }
                if (target.nodeName === 'BODY') {
                    handler = null;
                }
            }
            partialState = null;
            return handler;
        } else if (partialState) {
            partialState = null;
            return resolveKeyEvent(evt);
        }
    }
    d3.select(window).on("keydown", function () {
        if (metaKeyCodes[d3.event.keyCode]) {
            return;
        }
        var handler = resolveKeyEvent(d3.event);
        if (handler && handler.ondown) {
            if (typeof handler.ondown === "string") {
                RED.actions.invoke(handler.ondown);
            } else {
                handler.ondown();
            }
            d3.event.preventDefault();
        }
    });

    function addHandler(scope, key, modifiers, ondown) {
        var mod = modifiers;
        var cbdown = ondown;
        if (typeof modifiers == "function" || typeof modifiers === "string") {
            mod = {};
            cbdown = modifiers;
        }
        var keys = [];
        var i = 0;
        if (typeof key === 'string') {
            if (typeof cbdown === 'string') {
                actionToKeyMap[cbdown] = { scope: scope, key: key };
            }
            var parts = key.split(" ");
            for (i = 0; i < parts.length; i++) {
                var parsedKey = parseKeySpecifier(parts[i]);
                if (parsedKey) {
                    keys.push(parsedKey);
                } else {
                    console.log("Unrecognised key specifier:", key)
                    return;
                }
            }
        } else {
            keys.push([key, mod])
        }
        var slot = handlers;
        for (i = 0; i < keys.length; i++) {
            key = keys[i][0];
            mod = keys[i][1];
            if (mod.ctrl) {
                slot.ctrl = slot.ctrl || {};
                slot = slot.ctrl;
            }
            if (mod.shift) {
                slot.shift = slot.shift || {};
                slot = slot.shift;
            }
            if (mod.alt) {
                slot.alt = slot.alt || {};
                slot = slot.alt;
            }
            slot[key] = slot[key] || {};
            slot = slot[key];
            //slot[key] = {scope: scope, ondown:cbdown};
        }
        slot.scope = scope;
        slot.ondown = cbdown;
    }

    function removeHandler(key, modifiers) {
        var mod = modifiers || {};
        var keys = [];
        var i = 0;
        if (typeof key === 'string') {
            delete actionToKeyMap[key];
            var parts = key.split(" ");
            for (i = 0; i < parts.length; i++) {
                var parsedKey = parseKeySpecifier(parts[i]);
                if (parsedKey) {
                    keys.push(parsedKey);
                } else {
                    console.log("Unrecognised key specifier:", key)
                    return;
                }
            }
        } else {
            keys.push([key, mod])
        }
        var slot = handlers;
        for (i = 0; i < keys.length; i++) {
            key = keys[i][0];
            mod = keys[i][1];
            if (mod.ctrl) {
                slot = slot.ctrl;
            }
            if (slot && mod.shift) {
                slot = slot.shift;
            }
            if (slot && mod.alt) {
                slot = slot.alt;
            }
            if (!slot[key]) {
                return;
            }
            slot = slot[key];
        }
        delete slot.scope;
        delete slot.ondown;
    }

    var shortcutDialog = null;

    var cmdCtrlKey = '<span class="help-key">' + (isMac ? '&#8984;' : 'Ctrl') + '</span>';

    function showKeyboardHelp() {
        if (!RED.settings.theme("menu.menu-item-keyboard-shortcuts", true)) {
            return;
        }
        if (!shortcutDialog) {
            shortcutDialog = $('<div id="keyboard-help-dialog" class="hide">' +
                '<div class="keyboard-shortcut-entry keyboard-shortcut-list-header">' +
                '<div class="keyboard-shortcut-entry-key">shortcut</div>' +
                '<div class="keyboard-shortcut-entry-key">action</div>' +
                '<div class="keyboard-shortcut-entry-scope">scope</div>' +
                '</div>' +
                '<ol id="keyboard-shortcut-list"></ol>' +
                '</div>')
                .appendTo("body");

            var shortcutList = $('#keyboard-shortcut-list').editableList({
                addButton: false,
                scrollOnAdd: false,
                addItem: function (container, i, object) {
                    var item = $('<div class="keyboard-shortcut-entry">').appendTo(container);

                    var key = $('<div class="keyboard-shortcut-entry-key">').appendTo(item);
                    if (object.key) {
                        key.append(formatKey(object.key));
                    } else {
                        item.addClass("keyboard-shortcut-entry-unassigned");
                        key.html(RED._('keyboard.unassigned'));
                    }

                    var text = object.id.replace(/(^.+:([a-z]))|(-([a-z]))/g, function () {
                        if (arguments[5] === 0) {
                            return arguments[2].toUpperCase();
                        } else {
                            return " " + arguments[4].toUpperCase();
                        }
                    });
                    var label = $('<div>').html(text).appendTo(item);
                    if (object.scope) {
                        $('<div class="keyboard-shortcut-entry-scope">').html(object.scope).appendTo(item);
                    }


                },
            });
            var shortcuts = RED.actions.list();
            shortcuts.sort(function (A, B) {
                return A.id.localeCompare(B.id);
            });
            shortcuts.forEach(function (s) {
                shortcutList.editableList('addItem', s);
            })

            shortcutDialog.dialog({
                modal: true,
                autoOpen: false,
                width: "800",
                height: "400",
                title: RED._("keyboard.title"),
                resizable: false
            });
        }

        shortcutDialog.dialog("open");
    }
    function formatKey(key) {
        var formattedKey = isMac ? key.replace(/ctrl-?/, "&#8984;") : key;
        formattedKey = isMac ? formattedKey.replace(/alt-?/, "&#8997;") : key;
        formattedKey = formattedKey.replace(/shift-?/, "&#8679;")
        formattedKey = formattedKey.replace(/left/, "&#x2190;")
        formattedKey = formattedKey.replace(/up/, "&#x2191;")
        formattedKey = formattedKey.replace(/right/, "&#x2192;")
        formattedKey = formattedKey.replace(/down/, "&#x2193;")
        return '<span class="help-key-block"><span class="help-key">' + formattedKey.split(" ").join('</span> <span class="help-key">') + '</span></span>';
    }

    return {
        init: init,
        add: addHandler,
        remove: removeHandler,
        getShortcut: function (actionName) {
            return actionToKeyMap[actionName];
        },
        formatKey: formatKey
    }

})();
RED.workspaces = (function () {

    var activeWorkspace = 0;
    var workspaceIndex = 0;

    function addWorkspace(ws, skipHistoryEntry) {
        if (ws) {
            workspace_tabs.addTab(ws);
            workspace_tabs.resize();
        } else {
            var tabId = RED.nodes.id();
            do {
                workspaceIndex += 1;
            } while ($("#workspace-tabs a[title='" + RED._('workspace.defaultName', { number: workspaceIndex }) + "']").size() !== 0);

            ws = { type: "tab", id: tabId, label: RED._('workspace.defaultName', { number: workspaceIndex }) };
            RED.nodes.addWorkspace(ws);
            workspace_tabs.addTab(ws);
            workspace_tabs.activateTab(tabId);
            if (!skipHistoryEntry) {
                RED.history.push({ t: 'add', workspaces: [ws], dirty: RED.nodes.dirty() });
                RED.nodes.dirty(true);
            }
        }
        RED.__currentFlow = ws.id;
        return ws;
    }
    function deleteWorkspace(ws) {
        if (workspace_tabs.count() == 1) {
            return;
        }
        removeWorkspace(ws);
        var historyEvent = RED.nodes.removeWorkspace(ws.id);
        historyEvent.t = 'delete';
        historyEvent.dirty = RED.nodes.dirty();
        historyEvent.workspaces = [ws];
        RED.history.push(historyEvent);
        RED.nodes.dirty(true);
        // RED.sidebar.config.refresh();
    }

    function showRenameWorkspaceDialog(id) {
        var workspace = RED.nodes.workspace(id);
        RED.view.state(RED.state.EDITING);
        var trayOptions = {
            title: RED._("workspace.editFlow", { name: workspace.label }),
            buttons: [
                {
                    id: "node-dialog-delete",
                    class: 'leftButton' + ((workspace_tabs.count() == 1) ? " disabled" : ""),
                    text: RED._("common.label.delete"), //'<i class="fa fa-trash"></i>',
                    click: function () {
                        deleteWorkspace(workspace);
                        RED.tray.close();
                    }
                },
                {
                    id: "node-dialog-cancel",
                    text: RED._("common.label.cancel"),
                    click: function () {
                        RED.tray.close();
                    }
                },
                {
                    id: "node-dialog-ok",
                    class: "primary",
                    text: RED._("common.label.done"),
                    click: function () {
                        var label = $("#node-input-name").val();
                        if (workspace.label != label) {
                            var changes = {
                                label: workspace.label
                            }
                            var historyEvent = {
                                t: "edit",
                                changes: changes,
                                node: workspace,
                                dirty: RED.nodes.dirty()
                            }
                            workspace.changed = true;
                            RED.history.push(historyEvent);
                            workspace_tabs.renameTab(workspace.id, label);
                            RED.nodes.dirty(true);
                            // RED.sidebar.config.refresh();
                        }
                        RED.tray.close();
                    }
                }
            ],
            open: function (tray) {
                var trayBody = tray.find('.editor-tray-body');
                var dialogForm = $('<form id="dialog-form" class="form-horizontal"></form>').appendTo(trayBody);
                $('<div class="form-row">' +
                    '<label for="node-input-name" data-i18n="[append]editor:common.label.name"><i class="fa fa-tag"></i> </label>' +
                    '<input type="text" id="node-input-name">' +
                    '</div>').appendTo(dialogForm);
                $('<input type="text" style="display: none;" />').prependTo(dialogForm);
                dialogForm.submit(function (e) { e.preventDefault(); });
                $("#node-input-name").val(workspace.label);
                RED.text.bidi.prepareInput($("#node-input-name"))
                dialogForm.i18n();
            },
            close: function () {
                if (RED.view.state() != RED.state.IMPORT_DRAGGING) {
                    RED.view.state(RED.state.DEFAULT);
                }
            }
        }
        RED.tray.show(trayOptions);
    }


    var workspace_tabs;
    function createWorkspaceTabs() {
        workspace_tabs = RED.tabs.create({
            id: "workspace-tabs",
            onchange: function (tab) {
                var event = {
                    old: activeWorkspace
                }
                activeWorkspace = tab.id;
                event.workspace = activeWorkspace;
                RED.events.emit("workspace:change", event);
                RED.__currentFlow = 'flow/' + tab.id;
            },
            ondblclick: function (tab) {
                if (tab.type != "subflow") {
                    showRenameWorkspaceDialog(tab.id);
                } else {
                    RED.editor.editSubflow(RED.nodes.subflow(tab.id));
                }
            },
            onadd: function (tab) {
                // RED.menu.setDisabled("menu-item-workspace-delete",workspace_tabs.count() == 1);
            },
            onremove: function (tab) {
                // RED.menu.setDisabled("menu-item-workspace-delete",workspace_tabs.count() == 1);
            },
            onreorder: function (oldOrder, newOrder) {
                RED.history.push({ t: 'reorder', order: oldOrder, dirty: RED.nodes.dirty() });
                RED.nodes.dirty(true);
                setWorkspaceOrder(newOrder);
            },
            minimumActiveTabWidth: 150,
            scrollable: true,
            addButton: function () {
                addWorkspace();
            }
        });
    }
    function init() {
        createWorkspaceTabs();
        RED.events.on("sidebar:resize", workspace_tabs.resize);
        // RED.actions.add("core:show-next-tab",workspace_tabs.nextTab);
        // RED.actions.add("core:show-previous-tab",workspace_tabs.previousTab);

        // RED.menu.setAction('menu-item-workspace-delete',function() {
        //     deleteWorkspace(RED.nodes.workspace(activeWorkspace));
        // });

        $(window).resize(function () {
            workspace_tabs.resize();
        });

        // RED.actions.add("core:add-flow",addWorkspace);
        // RED.actions.add("core:edit-flow",editWorkspace);
        // RED.actions.add("core:remove-flow",removeWorkspace);

    }

    function editWorkspace(id) {
        showRenameWorkspaceDialog(id || activeWorkspace);
    }

    function removeWorkspace(ws) {
        if (!ws) {
            deleteWorkspace(RED.nodes.workspace(activeWorkspace));
        } else {
            if (workspace_tabs.contains(ws.id)) {
                workspace_tabs.removeTab(ws.id);
            }
        }
    }

    function setWorkspaceOrder(order) {
        RED.nodes.setWorkspaceOrder(order.filter(function (id) {
            return RED.nodes.workspace(id) !== undefined;
        }));
        workspace_tabs.order(order);
    }

    return {
        init: init,
        add: addWorkspace,
        remove: removeWorkspace,
        order: setWorkspaceOrder,
        edit: editWorkspace,
        contains: function (id) {
            return workspace_tabs.contains(id);
        },
        count: function () {
            return workspace_tabs.count();
        },
        active: function () {
            return activeWorkspace
        },
        show: function (id) {
            if (!workspace_tabs.contains(id)) {
                var sf = RED.nodes.subflow(id);
                if (sf) {
                    addWorkspace({ type: "subflow", id: id, icon: `${PROXY_URL}flows/red/images/subflow_tab.png`, label: sf.name, closeable: true });
                } else {
                    console.error("Invalid wk id: " + id);
                    return;
                }
            }

            workspace_tabs.activateTab(id);
        },
        refresh: function () {
            RED.nodes.eachWorkspace(function (ws) {
                workspace_tabs.renameTab(ws.id, ws.label);

            })
            RED.nodes.eachSubflow(function (sf) {
                if (workspace_tabs.contains(sf.id)) {
                    workspace_tabs.renameTab(sf.id, sf.name);
                }
            });
            // RED.sidebar.config.refresh();
        },
        resize: function () {
            workspace_tabs.resize();
        }
    }
})();
RED.view = (function () {
    var space_width = 5000,
        space_height = 5000,
        lineCurveScale = 0.75,
        scaleFactor = 1,
        node_width = 100,
        node_height = 30;

    var touchLongPressTimeout = 1000,
        startTouchDistance = 0,
        startTouchCenter = [],
        moveTouchCenter = [],
        touchStartTime = 0;

    var workspaceScrollPositions = {};

    var gridSize = 20;
    var snapGrid = false;

    var activeSpliceLink;
    var spliceActive = false;
    var spliceTimer;

    var activeSubflow = null;
    var activeNodes = [];
    var activeLinks = [];
    var activeFlowLinks = [];

    var selected_link = null,
        mousedown_link = null,
        mousedown_node = null,
        mousedown_port_type = null,
        mousedown_port_index = 0,
        mouseup_node = null,
        mouse_offset = [0, 0],
        mouse_position = null,
        mouse_mode = 0,
        moving_set = [],
        lasso = null,
        showStatus = false,
        lastClickNode = null,
        dblClickPrimed = null,
        clickTime = 0,
        clickElapsed = 0;

    var clipboard = "";

    var status_colours = {
        "red": "#c00",
        "green": "#5a8",
        "yellow": "#F9DF31",
        "blue": "#53A3F3",
        "grey": "#d3d3d3"
    }

    var outer = null,
        vis = null,
        outer_background = null,
        grid = null,
        dragGroup = null;


    /**
     *
     * @param cannotEdit When this param is true, the flow is just for viewer
     */
    function domInit(cannotEdit = false) {
        outer = d3.select("#chart")
            .append("svg:svg")
            .attr("width", space_width)
            .attr("height", space_height)
            .attr("pointer-events", cannotEdit ? "none" : "all")
            .style("cursor", "crosshair")
            .on("mousedown", function () {
                focusView();
            });
        vis = outer
            .append("svg:g")
            .on("dblclick.zoom", null)
            .append("svg:g")
            .on("mousemove", canvasMouseMove)
            .on("mousedown", canvasMouseDown)
            .on("mouseup", canvasMouseUp)
            .on("touchend", function () {
                clearTimeout(touchStartTime);
                touchStartTime = null;
                if (RED.touch.radialMenu.active()) {
                    return;
                }
                if (lasso) {
                    outer_background.attr("fill", "#fff");
                }
                canvasMouseUp.call(this);
            })
            .on("touchcancel", canvasMouseUp)
            .on("touchstart", function () {
                var touch0;
                if (d3.event.touches.length > 1) {
                    clearTimeout(touchStartTime);
                    touchStartTime = null;
                    d3.event.preventDefault();
                    touch0 = d3.event.touches.item(0);
                    var touch1 = d3.event.touches.item(1);
                    var a = touch0["pageY"] - touch1["pageY"];
                    var b = touch0["pageX"] - touch1["pageX"];

                    var offset = $("#chart").offset();
                    var scrollPos = [$("#chart").scrollLeft(), $("#chart").scrollTop()];
                    startTouchCenter = [
                        (touch1["pageX"] + (b / 2) - offset.left + scrollPos[0]) / scaleFactor,
                        (touch1["pageY"] + (a / 2) - offset.top + scrollPos[1]) / scaleFactor
                    ];
                    moveTouchCenter = [
                        touch1["pageX"] + (b / 2),
                        touch1["pageY"] + (a / 2)
                    ]
                    startTouchDistance = Math.sqrt((a * a) + (b * b));
                } else {
                    var obj = d3.select(document.body);
                    touch0 = d3.event.touches.item(0);
                    var pos = [touch0.pageX, touch0.pageY];
                    startTouchCenter = [touch0.pageX, touch0.pageY];
                    startTouchDistance = 0;
                    var point = d3.touches(this)[0];
                    touchStartTime = setTimeout(function () {
                        touchStartTime = null;
                        showTouchMenu(obj, pos);
                        //lasso = vis.append("rect")
                        //    .attr("ox",point[0])
                        //    .attr("oy",point[1])
                        //    .attr("rx",2)
                        //    .attr("ry",2)
                        //    .attr("x",point[0])
                        //    .attr("y",point[1])
                        //    .attr("width",0)
                        //    .attr("height",0)
                        //    .attr("class","lasso");
                        //outer_background.attr("fill","#e3e3f3");
                    }, touchLongPressTimeout);
                }
            })
            .on("touchmove", function () {
                if (RED.touch.radialMenu.active()) {
                    d3.event.preventDefault();
                    return;
                }
                var touch0;
                if (d3.event.touches.length < 2) {
                    if (touchStartTime) {
                        touch0 = d3.event.touches.item(0);
                        var dx = (touch0.pageX - startTouchCenter[0]);
                        var dy = (touch0.pageY - startTouchCenter[1]);
                        var d = Math.abs(dx * dx + dy * dy);
                        if (d > 64) {
                            clearTimeout(touchStartTime);
                            touchStartTime = null;
                        }
                    } else if (lasso) {
                        d3.event.preventDefault();
                    }
                    canvasMouseMove.call(this);
                } else {
                    touch0 = d3.event.touches.item(0);
                    var touch1 = d3.event.touches.item(1);
                    var a = touch0["pageY"] - touch1["pageY"];
                    var b = touch0["pageX"] - touch1["pageX"];
                    var offset = $("#chart").offset();
                    var scrollPos = [$("#chart").scrollLeft(), $("#chart").scrollTop()];
                    var moveTouchDistance = Math.sqrt((a * a) + (b * b));
                    var touchCenter = [
                        touch1["pageX"] + (b / 2),
                        touch1["pageY"] + (a / 2)
                    ];

                    if (!isNaN(moveTouchDistance)) {
                        oldScaleFactor = scaleFactor;
                        scaleFactor = Math.min(2, Math.max(0.3, scaleFactor + (Math.floor(((moveTouchDistance * 100) - (startTouchDistance * 100))) / 10000)));

                        var deltaTouchCenter = [                             // Try to pan whilst zooming - not 100%
                            startTouchCenter[0] * (scaleFactor - oldScaleFactor),//-(touchCenter[0]-moveTouchCenter[0]),
                            startTouchCenter[1] * (scaleFactor - oldScaleFactor) //-(touchCenter[1]-moveTouchCenter[1])
                        ];

                        startTouchDistance = moveTouchDistance;
                        moveTouchCenter = touchCenter;

                        $("#chart").scrollLeft(scrollPos[0] + deltaTouchCenter[0]);
                        $("#chart").scrollTop(scrollPos[1] + deltaTouchCenter[1]);
                        redraw();
                    }
                }
            });
        outer_background = vis.append("svg:rect")
            .attr("width", space_width)
            .attr("height", space_height)
            .attr("fill", "#fff");

        grid = vis.append("g");
        grid.selectAll("line.horizontal").data(gridScale.ticks(space_width / gridSize)).enter()
            .append("line")
            .attr(
                {
                    "class": "horizontal",
                    "x1": 0,
                    "x2": space_width,
                    "y1": function (d) { return gridScale(d); },
                    "y2": function (d) { return gridScale(d); },
                    "fill": "none",
                    "shape-rendering": "crispEdges",
                    "stroke": "#eee",
                    "stroke-width": "1px"
                });
        grid.selectAll("line.vertical").data(gridScale.ticks(space_width / gridSize)).enter()
            .append("line")
            .attr(
                {
                    "class": "vertical",
                    "y1": 0,
                    "y2": space_width,
                    "x1": function (d) { return gridScale(d); },
                    "x2": function (d) { return gridScale(d); },
                    "fill": "none",
                    "shape-rendering": "crispEdges",
                    "stroke": "#eee",
                    "stroke-width": "1px"
                });
        grid.style("visibility", "hidden");

        dragGroup = vis.append("g");
    }

    var gridScale = d3.scale.linear().range([0, space_width]).domain([0, space_width]);
    var drag_lines = [];

    function showDragLines(nodes) {
        for (var i = 0; i < nodes.length; i++) {
            var node = nodes[i];
            node.el = dragGroup.append("svg:path").attr("class", "drag_line");
            drag_lines.push(node);
        }

    }
    function hideDragLines() {
        while (drag_lines.length) {
            var line = drag_lines.pop();
            if (line.el) {
                line.el.remove();
            }
        }
    }

    function updateActiveNodes() {
        var activeWorkspace = RED.workspaces.active();

        activeNodes = RED.nodes.filterNodes({ z: activeWorkspace });

        activeLinks = RED.nodes.filterLinks({
            source: { z: activeWorkspace },
            target: { z: activeWorkspace }
        });
    }

    /**
     *
     * @param cannotEdit When this param is true, the flow is just for viewer
     */
    function init(cannotEdit = false) {
        domInit(cannotEdit);
        RED.events.on("workspace:change", function (event) {
            var chart = $("#chart");
            if (event.old !== 0) {
                workspaceScrollPositions[event.old] = {
                    left: chart.scrollLeft(),
                    top: chart.scrollTop()
                };
            }
            var scrollStartLeft = chart.scrollLeft();
            var scrollStartTop = chart.scrollTop();

            activeSubflow = RED.nodes.subflow(event.workspace);

            if (workspaceScrollPositions[event.workspace]) {
                chart.scrollLeft(workspaceScrollPositions[event.workspace].left);
                chart.scrollTop(workspaceScrollPositions[event.workspace].top);
            } else {
                chart.scrollLeft(0);
                chart.scrollTop(0);
            }
            var scrollDeltaLeft = chart.scrollLeft() - scrollStartLeft;
            var scrollDeltaTop = chart.scrollTop() - scrollStartTop;
            if (mouse_position != null) {
                mouse_position[0] += scrollDeltaLeft;
                mouse_position[1] += scrollDeltaTop;
            }
            clearSelection();
            RED.nodes.eachNode(function (n) {
                n.dirty = true;
            });
            updateSelection();
            updateActiveNodes();
            redraw();
        });

        $("#btn-zoom-out").click(function () { zoomOut(); });
        $("#btn-zoom-zero").click(function () { zoomZero(); });
        $("#btn-zoom-in").click(function () { zoomIn(); });
        $("#chart").on("DOMMouseScroll mousewheel", function (evt) {
            if (evt.altKey) {
                evt.preventDefault();
                evt.stopPropagation();
                var move = -(evt.originalEvent.detail) || evt.originalEvent.wheelDelta;
                if (move <= 0) { zoomOut(); }
                else { zoomIn(); }
            }
        });

        // Handle nodes dragged from the palette
        $("#chart").droppable({
            accept: ".palette_node",
            drop: function (event, ui) {
                d3.event = event;
                var selected_tool = ui.draggable[0].type;
                var result = addNode(selected_tool);
                if (!result) {
                    return;
                }
                var historyEvent = result.historyEvent;
                var nn = result.node;

                var helperOffset = d3.touches(ui.helper.get(0))[0] || d3.mouse(ui.helper.get(0));
                var mousePos = d3.touches(this)[0] || d3.mouse(this);

                mousePos[1] += this.scrollTop + ((nn.h / 2) - helperOffset[1]);
                mousePos[0] += this.scrollLeft + ((nn.w / 2) - helperOffset[0]);
                mousePos[1] /= scaleFactor;
                mousePos[0] /= scaleFactor;

                if (snapGrid) {
                    mousePos[0] = gridSize * (Math.ceil(mousePos[0] / gridSize));
                    mousePos[1] = gridSize * (Math.ceil(mousePos[1] / gridSize));
                }
                nn.x = mousePos[0];
                nn.y = mousePos[1];

                var spliceLink = $(ui.helper).data("splice");
                if (spliceLink) {
                    // TODO: DRY - droppable/nodeMouseDown/canvasMouseUp
                    RED.nodes.removeLink(spliceLink);
                    var link1 = {
                        source: spliceLink.source,
                        sourcePort: spliceLink.sourcePort,
                        target: nn
                    };
                    var link2 = {
                        source: nn,
                        sourcePort: 0,
                        target: spliceLink.target
                    };
                    RED.nodes.addLink(link1);
                    RED.nodes.addLink(link2);
                    historyEvent.links = [link1, link2];
                    historyEvent.removedLinks = [spliceLink];
                }

                RED.history.push(historyEvent);
                RED.nodes.add(nn);
                RED.editor.validateNode(nn);
                RED.nodes.dirty(true);
                // auto select dropped node - so info shows (if visible)
                clearSelection();
                nn.selected = true;
                moving_set.push({ n: nn });
                updateActiveNodes();
                updateSelection();
                redraw();

                if (nn._def.autoedit) {
                    RED.editor.edit(nn);
                }
            }
        });

        RED.actions.add("core:copy-selection-to-internal-clipboard", copySelection);
        RED.actions.add("core:cut-selection-to-internal-clipboard", function () { copySelection(); deleteSelection(); });
        RED.actions.add("core:paste-from-internal-clipboard", function () { importNodes(clipboard); });
        RED.actions.add("core:delete-selection", deleteSelection);
        RED.actions.add("core:edit-selected-node", editSelection);
        RED.actions.add("core:undo", RED.history.pop);
        RED.actions.add("core:select-all-nodes", selectAll);
        RED.actions.add("core:zoom-in", zoomIn);
        RED.actions.add("core:zoom-out", zoomOut);
        RED.actions.add("core:zoom-reset", zoomZero);

        RED.actions.add("core:toggle-show-grid", function (state) {
            if (state === undefined) {
                RED.menu.toggleSelected("menu-item-view-show-grid");
            } else {
                toggleShowGrid(state);
            }
        });
        RED.actions.add("core:toggle-snap-grid", function (state) {
            if (state === undefined) {
                RED.menu.toggleSelected("menu-item-view-snap-grid");
            } else {
                toggleSnapGrid(state);
            }
        });
        RED.actions.add("core:toggle-status", function (state) {
            if (state === undefined) {
                RED.menu.toggleSelected("menu-item-status");
            } else {
                toggleStatus(state);
            }
        });

        RED.actions.add("core:move-selection-up", function () { moveSelection(0, -1); });
        RED.actions.add("core:step-selection-up", function () { moveSelection(0, -20); });
        RED.actions.add("core:move-selection-right", function () { moveSelection(1, 0); });
        RED.actions.add("core:step-selection-right", function () { moveSelection(20, 0); });
        RED.actions.add("core:move-selection-down", function () { moveSelection(0, 1); });
        RED.actions.add("core:step-selection-down", function () { moveSelection(0, 20); });
        RED.actions.add("core:move-selection-left", function () { moveSelection(-1, 0); });
        RED.actions.add("core:step-selection-left", function () { moveSelection(-20, 0); });
    }


    function addNode(type, x, y) {
        var m = /^subflow:(.+)$/.exec(type);

        if (activeSubflow && m) {
            var subflowId = m[1];
            if (subflowId === activeSubflow.id) {
                RED.notify(RED._("notification.error", { message: RED._("notification.errors.cannotAddSubflowToItself") }), "error");
                return;
            }
            if (RED.nodes.subflowContains(m[1], activeSubflow.id)) {
                RED.notify(RED._("notification.error", { message: RED._("notification.errors.cannotAddCircularReference") }), "error");
                return;
            }
        }

        var nn = { id: RED.nodes.id(), z: RED.workspaces.active() };

        nn.type = type;
        nn._def = RED.nodes.getType(nn.type);

        if (!m) {
            nn.inputs = nn._def.inputs || 0;
            nn.outputs = nn._def.outputs;

            for (var d in nn._def.defaults) {
                if (nn._def.defaults.hasOwnProperty(d)) {
                    if (nn._def.defaults[d].value !== undefined) {
                        nn[d] = JSON.parse(JSON.stringify(nn._def.defaults[d].value));
                    }
                }
            }

            if (nn._def.onadd) {
                try {
                    nn._def.onadd.call(nn);
                } catch (err) {
                    console.log("onadd:", err);
                }
            }
        } else {
            var subflow = RED.nodes.subflow(m[1]);
            nn.inputs = subflow.in.length;
            nn.outputs = subflow.out.length;
        }

        nn.changed = true;

        nn.w = node_width;
        nn.h = Math.max(node_height, (nn.outputs || 0) * 15);

        var historyEvent = {
            t: "add",
            nodes: [nn.id],
            dirty: RED.nodes.dirty()
        }
        if (activeSubflow) {
            var subflowRefresh = RED.subflow.refresh(true);
            if (subflowRefresh) {
                historyEvent.subflow = {
                    id: activeSubflow.id,
                    changed: activeSubflow.changed,
                    instances: subflowRefresh.instances
                }
            }
        }
        return {
            node: nn,
            historyEvent: historyEvent
        }

    }

    function canvasMouseDown() {
        var point;

        if (!mousedown_node && !mousedown_link) {
            selected_link = null;
            updateSelection();
        }
        if (mouse_mode === 0) {
            if (lasso) {
                lasso.remove();
                lasso = null;
            }
        }
        if (mouse_mode === 0 || mouse_mode === RED.state.QUICK_JOINING) {
            if (d3.event.metaKey || d3.event.ctrlKey) {
                point = d3.mouse(this);
                d3.event.stopPropagation();
                var mainPos = $("#main-container").position();

                if (mouse_mode !== RED.state.QUICK_JOINING) {
                    mouse_mode = RED.state.QUICK_JOINING;
                    $(window).on('keyup', disableQuickJoinEventHandler);
                }

                RED.typeSearch.show({
                    x: d3.event.clientX - mainPos.left - node_width / 2,
                    y: d3.event.clientY - mainPos.top - node_height / 2,
                    add: function (type) {
                        var result = addNode(type);
                        if (!result) {
                            return;
                        }
                        var nn = result.node;
                        var historyEvent = result.historyEvent;
                        nn.x = point[0];
                        nn.y = point[1];
                        if (mouse_mode === RED.state.QUICK_JOINING) {
                            if (drag_lines.length > 0) {
                                var drag_line = drag_lines[0];
                                var src = null, dst, src_port;

                                if (drag_line.portType === 0 && nn.inputs > 0) {
                                    src = drag_line.node;
                                    src_port = drag_line.port;
                                    dst = nn;
                                } else if (drag_line.portType === 1 && nn.outputs > 0) {
                                    src = nn;
                                    dst = drag_line.node;
                                    src_port = 0;
                                }
                                if (src !== null) {
                                    var link = { source: src, sourcePort: src_port, target: dst };
                                    RED.nodes.addLink(link);
                                    historyEvent.links = [link];
                                    hideDragLines();
                                    if (drag_line.portType === 0 && nn.outputs > 0) {
                                        showDragLines([{ node: nn, port: 0, portType: 0 }]);
                                    } else if (drag_line.portType === 1 && nn.inputs > 0) {
                                        showDragLines([{ node: nn, port: 0, portType: 1 }]);
                                    } else {
                                        resetMouseVars();
                                    }
                                } else {
                                    hideDragLines();
                                    resetMouseVars();
                                }
                            } else {
                                if (nn.outputs > 0) {
                                    showDragLines([{ node: nn, port: 0, portType: 0 }]);
                                } else if (nn.inputs > 0) {
                                    showDragLines([{ node: nn, port: 0, portType: 1 }]);
                                } else {
                                    resetMouseVars();
                                }
                            }
                        }


                        RED.history.push(historyEvent);
                        RED.nodes.add(nn);
                        RED.editor.validateNode(nn);
                        RED.nodes.dirty(true);
                        // auto select dropped node - so info shows (if visible)
                        clearSelection();
                        nn.selected = true;
                        moving_set.push({ n: nn });
                        updateActiveNodes();
                        updateSelection();
                        redraw();
                    }
                });

                updateActiveNodes();
                updateSelection();
                redraw();
            }
        }
        if (mouse_mode === 0 && !(d3.event.metaKey || d3.event.ctrlKey)) {
            if (!touchStartTime) {
                point = d3.mouse(this);
                lasso = vis.append("rect")
                    .attr("ox", point[0])
                    .attr("oy", point[1])
                    .attr("rx", 1)
                    .attr("ry", 1)
                    .attr("x", point[0])
                    .attr("y", point[1])
                    .attr("width", 0)
                    .attr("height", 0)
                    .attr("class", "lasso");
                d3.event.preventDefault();
            }
        }
    }

    function canvasMouseMove() {
        var i;
        var node;
        mouse_position = d3.touches(this)[0] || d3.mouse(this);
        // Prevent touch scrolling...
        //if (d3.touches(this)[0]) {
        //    d3.event.preventDefault();
        //}

        // TODO: auto scroll the container
        //var point = d3.mouse(this);
        //if (point[0]-container.scrollLeft < 30 && container.scrollLeft > 0) { container.scrollLeft -= 15; }
        //console.log(d3.mouse(this),container.offsetWidth,container.offsetHeight,container.scrollLeft,container.scrollTop);

        if (lasso) {
            var ox = parseInt(lasso.attr("ox"));
            var oy = parseInt(lasso.attr("oy"));
            var x = parseInt(lasso.attr("x"));
            var y = parseInt(lasso.attr("y"));
            var w;
            var h;
            if (mouse_position[0] < ox) {
                x = mouse_position[0];
                w = ox - x;
            } else {
                w = mouse_position[0] - x;
            }
            if (mouse_position[1] < oy) {
                y = mouse_position[1];
                h = oy - y;
            } else {
                h = mouse_position[1] - y;
            }
            lasso
                .attr("x", x)
                .attr("y", y)
                .attr("width", w)
                .attr("height", h)
                ;
            return;
        }

        if (mouse_mode != RED.state.QUICK_JOINING && mouse_mode != RED.state.IMPORT_DRAGGING && !mousedown_node && selected_link == null) {
            return;
        }

        var mousePos;
        if (mouse_mode == RED.state.JOINING || mouse_mode === RED.state.QUICK_JOINING) {
            // update drag line
            if (drag_lines.length === 0) {
                if (d3.event.shiftKey) {
                    // Get all the wires we need to detach.
                    var links = [];
                    var existingLinks = [];
                    if (selected_link &&
                        ((mousedown_port_type === 0 &&
                            selected_link.source === mousedown_node &&
                            selected_link.sourcePort === mousedown_port_index
                        ) ||
                            (mousedown_port_type === 1 &&
                                selected_link.target === mousedown_node
                            ))
                    ) {
                        existingLinks = [selected_link];
                    } else {
                        var filter;
                        if (mousedown_port_type === 0) {
                            filter = {
                                source: mousedown_node,
                                sourcePort: mousedown_port_index
                            }
                        } else {
                            filter = {
                                target: mousedown_node
                            }
                        }
                        existingLinks = RED.nodes.filterLinks(filter);
                    }
                    for (i = 0; i < existingLinks.length; i++) {
                        var link = existingLinks[i];
                        RED.nodes.removeLink(link);
                        links.push({
                            link: link,
                            node: (mousedown_port_type === 0) ? link.target : link.source,
                            port: (mousedown_port_type === 0) ? 0 : link.sourcePort,
                            portType: (mousedown_port_type === 0) ? 1 : 0
                        })
                    }
                    if (links.length === 0) {
                        resetMouseVars();
                        redraw();
                    } else {
                        showDragLines(links);
                        mouse_mode = 0;
                        updateActiveNodes();
                        redraw();
                        mouse_mode = RED.state.JOINING;
                    }
                } else if (mousedown_node) {
                    showDragLines([{ node: mousedown_node, port: mousedown_port_index, portType: mousedown_port_type }]);
                }
                selected_link = null;
            }
            mousePos = mouse_position;
            for (i = 0; i < drag_lines.length; i++) {
                var drag_line = drag_lines[i];
                var numOutputs = (drag_line.portType === 0) ? (drag_line.node.outputs || 1) : 1;
                var sourcePort = drag_line.port;
                var portY = -((numOutputs - 1) / 2) * 13 + 13 * sourcePort;

                var sc = (drag_line.portType === 0) ? 1 : -1;

                var dy = mousePos[1] - (drag_line.node.y + portY);
                var dx = mousePos[0] - (drag_line.node.x + sc * drag_line.node.w / 2);
                var delta = Math.sqrt(dy * dy + dx * dx);
                var scale = lineCurveScale;
                var scaleY = 0;

                if (delta < node_width) {
                    scale = 0.75 - 0.75 * ((node_width - delta) / node_width);
                }
                if (dx * sc < 0) {
                    scale += 2 * (Math.min(5 * node_width, Math.abs(dx)) / (5 * node_width));
                    if (Math.abs(dy) < 3 * node_height) {
                        scaleY = ((dy > 0) ? 0.5 : -0.5) * (((3 * node_height) - Math.abs(dy)) / (3 * node_height)) * (Math.min(node_width, Math.abs(dx)) / (node_width));
                    }
                }

                drag_line.el.attr("d",
                    "M " + (drag_line.node.x + sc * drag_line.node.w / 2) + " " + (drag_line.node.y + portY) +
                    " C " + (drag_line.node.x + sc * (drag_line.node.w / 2 + node_width * scale)) + " " + (drag_line.node.y + portY + scaleY * node_height) + " " +
                    (mousePos[0] - sc * (scale) * node_width) + " " + (mousePos[1] - scaleY * node_height) + " " +
                    mousePos[0] + " " + mousePos[1]
                );
            }
            d3.event.preventDefault();
        } else if (mouse_mode == RED.state.MOVING) {
            mousePos = d3.mouse(document.body);
            if (isNaN(mousePos[0])) {
                mousePos = d3.touches(document.body)[0];
            }
            var d = (mouse_offset[0] - mousePos[0]) * (mouse_offset[0] - mousePos[0]) + (mouse_offset[1] - mousePos[1]) * (mouse_offset[1] - mousePos[1]);
            if (d > 3) {
                mouse_mode = RED.state.MOVING_ACTIVE;
                clickElapsed = 0;
                spliceActive = false;
                if (moving_set.length === 1) {
                    node = moving_set[0];
                    spliceActive = node.n.hasOwnProperty("_def") &&
                        node.n._def.inputs > 0 &&
                        node.n._def.outputs > 0 &&
                        RED.nodes.filterLinks({ source: node.n }).length === 0 &&
                        RED.nodes.filterLinks({ target: node.n }).length === 0;
                }
            }
        } else if (mouse_mode == RED.state.MOVING_ACTIVE || mouse_mode == RED.state.IMPORT_DRAGGING) {
            mousePos = mouse_position;
            var minX = 0;
            var minY = 0;
            var maxX = space_width;
            var maxY = space_height;
            for (var n = 0; n < moving_set.length; n++) {
                node = moving_set[n];
                if (d3.event.shiftKey) {
                    node.n.ox = node.n.x;
                    node.n.oy = node.n.y;
                }
                node.n.x = mousePos[0] + node.dx;
                node.n.y = mousePos[1] + node.dy;
                node.n.dirty = true;
                minX = Math.min(node.n.x - node.n.w / 2 - 5, minX);
                minY = Math.min(node.n.y - node.n.h / 2 - 5, minY);
                maxX = Math.max(node.n.x + node.n.w / 2 + 5, maxX);
                maxY = Math.max(node.n.y + node.n.h / 2 + 5, maxY);
            }
            if (minX !== 0 || minY !== 0) {
                for (i = 0; i < moving_set.length; i++) {
                    node = moving_set[i];
                    node.n.x -= minX;
                    node.n.y -= minY;
                }
            }
            if (maxX !== space_width || maxY !== space_height) {
                for (i = 0; i < moving_set.length; i++) {
                    node = moving_set[i];
                    node.n.x -= (maxX - space_width);
                    node.n.y -= (maxY - space_height);
                }
            }
            if (snapGrid != d3.event.shiftKey && moving_set.length > 0) {
                var gridOffset = [0, 0];
                node = moving_set[0];
                gridOffset[0] = node.n.x - (gridSize * Math.floor((node.n.x - node.n.w / 2) / gridSize) + node.n.w / 2);
                gridOffset[1] = node.n.y - (gridSize * Math.floor(node.n.y / gridSize));
                if (gridOffset[0] !== 0 || gridOffset[1] !== 0) {
                    for (i = 0; i < moving_set.length; i++) {
                        node = moving_set[i];
                        node.n.x -= gridOffset[0];
                        node.n.y -= gridOffset[1];
                        if (node.n.x == node.n.ox && node.n.y == node.n.oy) {
                            node.dirty = false;
                        }
                    }
                }
            }
            if ((mouse_mode == RED.state.MOVING_ACTIVE || mouse_mode == RED.state.IMPORT_DRAGGING) && moving_set.length === 1) {
                node = moving_set[0];
                if (spliceActive) {
                    if (!spliceTimer) {
                        spliceTimer = setTimeout(function () {
                            var nodes = [];
                            var bestDistance = Infinity;
                            var bestLink = null;
                            var mouseX = node.n.x;
                            var mouseY = node.n.y;
                            if (outer[0][0].getIntersectionList) {
                                var svgRect = outer[0][0].createSVGRect();
                                svgRect.x = mouseX;
                                svgRect.y = mouseY;
                                svgRect.width = 1;
                                svgRect.height = 1;
                                nodes = outer[0][0].getIntersectionList(svgRect, outer[0][0]);
                            } else {
                                // Firefox doesn"t do getIntersectionList and that
                                // makes us sad
                                nodes = RED.view.getLinksAtPoint(mouseX, mouseY);
                            }
                            for (var i = 0; i < nodes.length; i++) {
                                if (d3.select(nodes[i]).classed("link_background")) {
                                    var length = nodes[i].getTotalLength();
                                    for (var j = 0; j < length; j += 10) {
                                        var p = nodes[i].getPointAtLength(j);
                                        var d2 = ((p.x - mouseX) * (p.x - mouseX)) + ((p.y - mouseY) * (p.y - mouseY));
                                        if (d2 < 200 && d2 < bestDistance) {
                                            bestDistance = d2;
                                            bestLink = nodes[i];
                                        }
                                    }
                                }
                            }
                            if (activeSpliceLink && activeSpliceLink !== bestLink) {
                                d3.select(activeSpliceLink.parentNode).classed("link_splice", false);
                            }
                            if (bestLink) {
                                d3.select(bestLink.parentNode).classed("link_splice", true)
                            } else {
                                d3.select(".link_splice").classed("link_splice", false);
                            }
                            activeSpliceLink = bestLink;
                            spliceTimer = null;
                        }, 100);
                    }
                }
            }


        }
        if (mouse_mode !== 0) {
            redraw();
        }
    }

    function canvasMouseUp() {
        var i;
        var historyEvent;
        if (mouse_mode === RED.state.QUICK_JOINING) {
            return;
        }
        if (mousedown_node && mouse_mode == RED.state.JOINING) {
            var removedLinks = [];
            for (i = 0; i < drag_lines.length; i++) {
                if (drag_lines[i].link) {
                    removedLinks.push(drag_lines[i].link)
                }
            }
            historyEvent = {
                t: "delete",
                links: removedLinks,
                dirty: RED.nodes.dirty()
            };
            RED.history.push(historyEvent);
            hideDragLines();
        }
        if (lasso) {
            var x = parseInt(lasso.attr("x"));
            var y = parseInt(lasso.attr("y"));
            var x2 = x + parseInt(lasso.attr("width"));
            var y2 = y + parseInt(lasso.attr("height"));
            if (!d3.event.ctrlKey) {
                clearSelection();
            }
            RED.nodes.eachNode(function (n) {
                if (n.z == RED.workspaces.active() && !n.selected) {
                    n.selected = (n.x > x && n.x < x2 && n.y > y && n.y < y2);
                    if (n.selected) {
                        n.dirty = true;
                        moving_set.push({ n: n });
                    }
                }
            });
            if (activeSubflow) {
                activeSubflow.in.forEach(function (n) {
                    n.selected = (n.x > x && n.x < x2 && n.y > y && n.y < y2);
                    if (n.selected) {
                        n.dirty = true;
                        moving_set.push({ n: n });
                    }
                });
                activeSubflow.out.forEach(function (n) {
                    n.selected = (n.x > x && n.x < x2 && n.y > y && n.y < y2);
                    if (n.selected) {
                        n.dirty = true;
                        moving_set.push({ n: n });
                    }
                });
            }
            updateSelection();
            lasso.remove();
            lasso = null;
        } else if (mouse_mode == RED.state.DEFAULT && mousedown_link == null && !d3.event.ctrlKey && !d3.event.metaKey) {
            clearSelection();
            updateSelection();
        }
        if (mouse_mode == RED.state.MOVING_ACTIVE) {
            if (moving_set.length > 0) {
                var ns = [];
                for (var j = 0; j < moving_set.length; j++) {
                    ns.push({ n: moving_set[j].n, ox: moving_set[j].ox, oy: moving_set[j].oy, changed: moving_set[j].n.changed });
                    moving_set[j].n.dirty = true;
                    moving_set[j].n.changed = true;
                }
                historyEvent = { t: "move", nodes: ns, dirty: RED.nodes.dirty() };
                if (activeSpliceLink) {
                    // TODO: DRY - droppable/nodeMouseDown/canvasMouseUp
                    var spliceLink = d3.select(activeSpliceLink).data()[0];
                    RED.nodes.removeLink(spliceLink);
                    var link1 = {
                        source: spliceLink.source,
                        sourcePort: spliceLink.sourcePort,
                        target: moving_set[0].n
                    };
                    var link2 = {
                        source: moving_set[0].n,
                        sourcePort: 0,
                        target: spliceLink.target
                    };
                    RED.nodes.addLink(link1);
                    RED.nodes.addLink(link2);
                    historyEvent.links = [link1, link2];
                    historyEvent.removedLinks = [spliceLink];
                    updateActiveNodes();
                }
                RED.nodes.dirty(true);
                RED.history.push(historyEvent);
            }
        }
        if (mouse_mode == RED.state.MOVING || mouse_mode == RED.state.MOVING_ACTIVE) {
            for (i = 0; i < moving_set.length; i++) {
                delete moving_set[i].ox;
                delete moving_set[i].oy;
            }
        }
        if (mouse_mode == RED.state.IMPORT_DRAGGING) {
            RED.keyboard.remove("escape");
            updateActiveNodes();
            RED.nodes.dirty(true);
        }
        resetMouseVars();
        redraw();
    }

    function zoomIn() {
        if (scaleFactor < 2) {
            scaleFactor += 0.1;
            redraw();
        }
    }
    function zoomOut() {
        if (scaleFactor > 0.3) {
            scaleFactor -= 0.1;
            redraw();
        }
    }
    function zoomZero() {
        scaleFactor = 1;
        redraw();
    }

    function selectAll() {
        RED.nodes.eachNode(function (n) {
            if (n.z == RED.workspaces.active()) {
                if (!n.selected) {
                    n.selected = true;
                    n.dirty = true;
                    moving_set.push({ n: n });
                }
            }
        });
        if (activeSubflow) {
            activeSubflow.in.forEach(function (n) {
                if (!n.selected) {
                    n.selected = true;
                    n.dirty = true;
                    moving_set.push({ n: n });
                }
            });
            activeSubflow.out.forEach(function (n) {
                if (!n.selected) {
                    n.selected = true;
                    n.dirty = true;
                    moving_set.push({ n: n });
                }
            });
        }

        selected_link = null;
        updateSelection();
        redraw();
    }

    function clearSelection() {
        for (var i = 0; i < moving_set.length; i++) {
            var n = moving_set[i];
            n.n.dirty = true;
            n.n.selected = false;
        }
        moving_set = [];
        selected_link = null;
    }

    function updateSelection() {
        var selection = {};

        if (moving_set.length > 0) {
            selection.nodes = moving_set.map(function (n) { return n.n; });
        }
        if (selected_link != null) {
            selection.link = selected_link;
        }
        var activeWorkspace = RED.workspaces.active();
        activeLinks = RED.nodes.filterLinks({
            source: { z: activeWorkspace },
            target: { z: activeWorkspace }
        });
        var tabOrder = RED.nodes.getWorkspaceOrder();
        var currentLinks = activeLinks;
        var addedLinkLinks = {};
        activeFlowLinks = [];
        for (var i = 0; i < moving_set.length; i++) {
            if (moving_set[i].n.type === "link out" || moving_set[i].n.type === "link in") {
                var linkNode = moving_set[i].n;
                var offFlowLinks = {};
                linkNode.links.forEach(function (id) {
                    var target = RED.nodes.node(id);
                    if (target) {
                        if (linkNode.type === "link out") {
                            if (target.z === linkNode.z) {
                                if (!addedLinkLinks[linkNode.id + ":" + target.id]) {
                                    activeLinks.push({
                                        source: linkNode,
                                        sourcePort: 0,
                                        target: target,
                                        link: true
                                    });
                                    addedLinkLinks[linkNode.id + ":" + target.id] = true;
                                }
                            } else {
                                offFlowLinks[target.z] = offFlowLinks[target.z] || [];
                                offFlowLinks[target.z].push(target);
                            }
                        } else {
                            if (target.z === linkNode.z) {
                                if (!addedLinkLinks[target.id + ":" + linkNode.id]) {
                                    activeLinks.push({
                                        source: target,
                                        sourcePort: 0,
                                        target: linkNode,
                                        link: true
                                    });
                                    addedLinkLinks[target.id + ":" + linkNode.id] = true;
                                }
                            } else {
                                offFlowLinks[target.z] = offFlowLinks[target.z] || [];
                                offFlowLinks[target.z].push(target);
                            }
                        }
                    }
                });
                var offFlows = Object.keys(offFlowLinks);
                // offFlows.sort(function(A,B) {
                //     return tabOrder.indexOf(A) - tabOrder.indexOf(B);
                // });
                if (offFlows.length > 0) {
                    activeFlowLinks.push({
                        refresh: Math.floor(Math.random() * 10000),
                        node: linkNode,
                        links: offFlowLinks//offFlows.map(function(i) { return {id:i,links:offFlowLinks[i]};})
                    });
                }
            }
        }


        RED.events.emit("view:selection-changed", selection);
    }

    function endKeyboardMove() {
        endMoveSet = false;
        if (moving_set.length > 0) {
            var ns = [];
            for (var i = 0; i < moving_set.length; i++) {
                ns.push({ n: moving_set[i].n, ox: moving_set[i].ox, oy: moving_set[i].oy, changed: moving_set[i].n.changed });
                moving_set[i].n.changed = true;
                moving_set[i].n.dirty = true;
                delete moving_set[i].ox;
                delete moving_set[i].oy;
            }
            redraw();
            RED.history.push({ t: "move", nodes: ns, dirty: RED.nodes.dirty() });
            RED.nodes.dirty(true);
        }
    }
    var endMoveSet = false;
    function moveSelection(dx, dy) {
        if (moving_set.length > 0) {
            if (!endMoveSet) {
                $(document).one('keyup', endKeyboardMove);
                endMoveSet = true;
            }
            var minX = 0;
            var minY = 0;
            var node;

            for (var i = 0; i < moving_set.length; i++) {
                node = moving_set[i];
                node.n.changed = true;
                node.n.dirty = true;
                if (node.ox == null && node.oy == null) {
                    node.ox = node.n.x;
                    node.oy = node.n.y;
                }
                node.n.x += dx;
                node.n.y += dy;
                node.n.dirty = true;
                minX = Math.min(node.n.x - node.n.w / 2 - 5, minX);
                minY = Math.min(node.n.y - node.n.h / 2 - 5, minY);
            }

            if (minX !== 0 || minY !== 0) {
                for (var n = 0; n < moving_set.length; n++) {
                    node = moving_set[n];
                    node.n.x -= minX;
                    node.n.y -= minY;
                }
            }

            redraw();
        }
    }
    function editSelection() {
        console.log('editSelection');
        if (moving_set.length > 0) {
            var node = moving_set[0].n;
            if (node.type === "subflow") {
                RED.editor.editSubflow(activeSubflow);
            } else {
                RED.editor.edit(node);
            }
        }
    }
    function deleteSelection() {
        if (moving_set.length > 0 || selected_link != null) {
            var result;
            var removedNodes = [];
            var removedLinks = [];
            var removedSubflowOutputs = [];
            var removedSubflowInputs = [];
            var subflowInstances = [];

            var startDirty = RED.nodes.dirty();
            var startChanged = false;
            if (moving_set.length > 0) {
                for (var i = 0; i < moving_set.length; i++) {
                    var node = moving_set[i].n;
                    node.selected = false;
                    if (node.type != "subflow") {
                        if (node.x < 0) {
                            node.x = 25
                        }
                        var removedEntities = RED.nodes.remove(node.id);
                        removedNodes.push(node);
                        removedNodes = removedNodes.concat(removedEntities.nodes);
                        removedLinks = removedLinks.concat(removedEntities.links);
                    } else {
                        if (node.direction === "out") {
                            removedSubflowOutputs.push(node);
                        } else if (node.direction === "in") {
                            removedSubflowInputs.push(node);
                        }
                        node.dirty = true;
                    }
                }
                if (removedSubflowOutputs.length > 0) {
                    result = RED.subflow.removeOutput(removedSubflowOutputs);
                    if (result) {
                        removedLinks = removedLinks.concat(result.links);
                    }
                }
                // Assume 0/1 inputs
                if (removedSubflowInputs.length == 1) {
                    result = RED.subflow.removeInput();
                    if (result) {
                        removedLinks = removedLinks.concat(result.links);
                    }
                }
                // var instances = RED.subflow.refresh(true);
                // if (instances) {
                //     subflowInstances = instances.instances;
                // }
                moving_set = [];
                if (removedNodes.length > 0 || removedSubflowOutputs.length > 0 || removedSubflowInputs.length > 0) {
                    RED.nodes.dirty(true);
                }
            }
            if (selected_link) {
                RED.nodes.removeLink(selected_link);
                removedLinks.push(selected_link);
                RED.nodes.dirty(true);
            }
            var historyEvent = {
                t: "delete",
                nodes: removedNodes,
                links: removedLinks,
                subflowOutputs: removedSubflowOutputs,
                subflowInputs: removedSubflowInputs,
                subflow: {
                    instances: null
                },
                dirty: startDirty
            };
            RED.history.push(historyEvent);

            selected_link = null;
            updateActiveNodes();
            updateSelection();
            redraw();
        }
    }

    function copySelection() {
        if (moving_set.length > 0) {
            var nns = [];
            for (var n = 0; n < moving_set.length; n++) {
                var node = moving_set[n].n;
                // The only time a node.type == subflow can be selected is the
                // input/output "proxy" nodes. They cannot be copied.
                if (node.type != "subflow") {
                    for (var d in node._def.defaults) {
                        if (node._def.defaults.hasOwnProperty(d)) {
                            if (node._def.defaults[d].type) {
                                var configNode = RED.nodes.node(node[d]);
                                if (configNode && configNode._def.exclusive) {
                                    nns.push(RED.nodes.convertNode(configNode));
                                }
                            }
                        }
                    }
                    nns.push(RED.nodes.convertNode(node));
                    //TODO: if the node has an exclusive config node, it should also be copied, to ensure it remains exclusive...
                }
            }
            clipboard = JSON.stringify(nns);
            RED.notify(RED._("clipboard.nodeCopied", { count: nns.length }));
        }
    }


    function calculateTextWidth(str, className, offset) {
        var sp = document.createElement("span");
        sp.className = className;
        sp.style.position = "absolute";
        sp.style.top = "-1000px";
        sp.textContent = (str || "");
        document.body.appendChild(sp);
        var w = sp.offsetWidth;
        document.body.removeChild(sp);
        return offset + w;
    }

    function resetMouseVars() {
        mousedown_node = null;
        mouseup_node = null;
        mousedown_link = null;
        mouse_mode = 0;
        mousedown_port_type = 0;
        activeSpliceLink = null;
        spliceActive = false;
        d3.select(".link_splice").classed("link_splice", false);
        if (spliceTimer) {
            clearTimeout(spliceTimer);
            spliceTimer = null;
        }
    }

    function disableQuickJoinEventHandler(evt) {
        // Check for ctrl (all browsers), "Meta" (Chrome/FF), keyCode 91 (Safari)
        if (evt.keyCode === 17 || evt.key === "Meta" || evt.keyCode === 91) {
            resetMouseVars();
            hideDragLines();
            redraw();
            $(window).off('keyup', disableQuickJoinEventHandler);
        }
    }

    function portMouseDown(d, portType, portIndex) {
        //console.log(d,portType,portIndex);
        // disable zoom
        //vis.call(d3.behavior.zoom().on("zoom"), null);
        mousedown_node = d;
        mousedown_port_type = portType;
        mousedown_port_index = portIndex || 0;
        if (mouse_mode !== RED.state.QUICK_JOINING) {
            mouse_mode = RED.state.JOINING;
            document.body.style.cursor = "crosshair";
            if (d3.event.ctrlKey || d3.event.metaKey) {
                mouse_mode = RED.state.QUICK_JOINING;
                showDragLines([{ node: mousedown_node, port: mousedown_port_index, portType: mousedown_port_type }]);
                $(window).on('keyup', disableQuickJoinEventHandler);
            }
        }
        d3.event.stopPropagation();
        d3.event.preventDefault();
    }

    function portMouseUp(d, portType, portIndex) {
        var i;
        if (mouse_mode === RED.state.QUICK_JOINING) {
            if (drag_lines[0].node === d) {
                return
            }
        }
        document.body.style.cursor = "";
        if (mouse_mode == RED.state.JOINING || mouse_mode == RED.state.QUICK_JOINING) {
            if (typeof TouchEvent != "undefined" && d3.event instanceof TouchEvent) {
                RED.nodes.eachNode(function (n) {
                    if (n.z == RED.workspaces.active()) {
                        var hw = n.w / 2;
                        var hh = n.h / 2;
                        if (n.x - hw < mouse_position[0] && n.x + hw > mouse_position[0] &&
                            n.y - hh < mouse_position[1] && n.y + hh > mouse_position[1]) {
                            mouseup_node = n;
                            portType = mouseup_node.inputs > 0 ? 1 : 0;
                            portIndex = 0;
                        }
                    }
                });
            } else {
                mouseup_node = d;
            }
            var addedLinks = [];
            var removedLinks = [];

            for (i = 0; i < drag_lines.length; i++) {
                if (drag_lines[i].link) {
                    removedLinks.push(drag_lines[i].link)
                }
            }
            for (i = 0; i < drag_lines.length; i++) {
                if (portType != drag_lines[i].portType && mouseup_node !== drag_lines[i].node) {
                    var drag_line = drag_lines[i];
                    var src, dst, src_port;
                    if (drag_line.portType === 0) {
                        src = drag_line.node;
                        src_port = drag_line.port;
                        dst = mouseup_node;
                    } else if (drag_line.portType == 1) {
                        src = mouseup_node;
                        dst = drag_line.node;
                        src_port = portIndex;
                    }
                    var existingLink = RED.nodes.filterLinks({ source: src, target: dst, sourcePort: src_port }).length !== 0;
                    if (!existingLink) {
                        var link = { source: src, sourcePort: src_port, target: dst };
                        RED.nodes.addLink(link);
                        addedLinks.push(link);
                    }
                }
            }
            if (addedLinks.length > 0 || removedLinks.length > 0) {
                var historyEvent = {
                    t: "add",
                    links: addedLinks,
                    removedLinks: removedLinks,
                    dirty: RED.nodes.dirty()
                };
                if (activeSubflow) {
                    var subflowRefresh = RED.subflow.refresh(true);
                    if (subflowRefresh) {
                        historyEvent.subflow = {
                            id: activeSubflow.id,
                            changed: activeSubflow.changed,
                            instances: subflowRefresh.instances
                        }
                    }
                }
                RED.history.push(historyEvent);
                updateActiveNodes();
                RED.nodes.dirty(true);
            }
            if (mouse_mode === RED.state.QUICK_JOINING) {
                if (addedLinks.length > 0) {
                    hideDragLines();
                    if (portType === 1 && d.outputs > 0) {
                        showDragLines([{ node: d, port: 0, portType: 0 }]);
                    } else if (portType === 0 && d.inputs > 0) {
                        showDragLines([{ node: d, port: 0, portType: 1 }]);
                    } else {
                        resetMouseVars();
                    }
                }
                redraw();
                return;
            }

            resetMouseVars();
            hideDragLines();
            selected_link = null;
            redraw();
        }
    }

    function nodeMouseUp(d) {
        if (dblClickPrimed && mousedown_node == d && clickElapsed > 0 && clickElapsed < 750) {
            mouse_mode = RED.state.DEFAULT;
            if (d.type != "subflow") {
                RED.editor.edit(d);
            } else {
                RED.editor.editSubflow(activeSubflow);
            }
            clickElapsed = 0;
            d3.event.stopPropagation();
            return;
        }
        var direction = d._def ? (d.inputs > 0 ? 1 : 0) : (d.direction == "in" ? 0 : 1)
        portMouseUp(d, direction, 0);
    }

    function nodeMouseDown(d) {
        focusView();
        //var touch0 = d3.event;
        //var pos = [touch0.pageX,touch0.pageY];
        //RED.touch.radialMenu.show(d3.select(this),pos);
        if (mouse_mode == RED.state.IMPORT_DRAGGING) {
            RED.keyboard.remove("escape");

            if (activeSpliceLink) {
                // TODO: DRY - droppable/nodeMouseDown/canvasMouseUp
                var spliceLink = d3.select(activeSpliceLink).data()[0];
                RED.nodes.removeLink(spliceLink);
                var link1 = {
                    source: spliceLink.source,
                    sourcePort: spliceLink.sourcePort,
                    target: moving_set[0].n
                };
                var link2 = {
                    source: moving_set[0].n,
                    sourcePort: 0,
                    target: spliceLink.target
                };
                RED.nodes.addLink(link1);
                RED.nodes.addLink(link2);
                var historyEvent = RED.history.peek();
                historyEvent.links = [link1, link2];
                historyEvent.removedLinks = [spliceLink];
                updateActiveNodes();
            }

            updateSelection();
            RED.nodes.dirty(true);
            redraw();
            resetMouseVars();
            d3.event.stopPropagation();
            return;
        } else if (mouse_mode == RED.state.QUICK_JOINING) {
            d3.event.stopPropagation();
            return;
        }
        mousedown_node = d;
        var now = Date.now();
        clickElapsed = now - clickTime;
        clickTime = now;

        dblClickPrimed = (lastClickNode == mousedown_node);
        lastClickNode = mousedown_node;

        var i;

        if (d.selected && (d3.event.ctrlKey || d3.event.metaKey)) {
            mousedown_node.selected = false;
            for (i = 0; i < moving_set.length; i += 1) {
                if (moving_set[i].n === mousedown_node) {
                    moving_set.splice(i, 1);
                    break;
                }
            }
        } else {
            if (d3.event.shiftKey) {
                clearSelection();
                var cnodes = RED.nodes.getAllFlowNodes(mousedown_node);
                for (var n = 0; n < cnodes.length; n++) {
                    cnodes[n].selected = true;
                    cnodes[n].dirty = true;
                    moving_set.push({ n: cnodes[n] });
                }
            } else if (!d.selected) {
                if (!d3.event.ctrlKey && !d3.event.metaKey) {
                    clearSelection();
                }
                mousedown_node.selected = true;
                moving_set.push({ n: mousedown_node });
            }
            selected_link = null;
            if (d3.event.button != 2) {
                mouse_mode = RED.state.MOVING;
                var mouse = d3.touches(this)[0] || d3.mouse(this);
                mouse[0] += d.x - d.w / 2;
                mouse[1] += d.y - d.h / 2;
                for (i = 0; i < moving_set.length; i++) {
                    moving_set[i].ox = moving_set[i].n.x;
                    moving_set[i].oy = moving_set[i].n.y;
                    moving_set[i].dx = moving_set[i].n.x - mouse[0];
                    moving_set[i].dy = moving_set[i].n.y - mouse[1];
                }
                mouse_offset = d3.mouse(document.body);
                if (isNaN(mouse_offset[0])) {
                    mouse_offset = d3.touches(document.body)[0];
                }
            }
        }
        d.dirty = true;
        updateSelection();
        redraw();
        d3.event.stopPropagation();
    }

    function nodeButtonClicked(d) {
        console.log('nodeButtonClicked');
        if (!activeSubflow && !d.changed) {
            if (d._def.button.toggle) {
                d[d._def.button.toggle] = !d[d._def.button.toggle];
                d.dirty = true;
            }
            if (d._def.button.onclick) {
                try {
                    d._def.button.onclick.call(d);
                } catch (err) {
                    console.log("Definition error: " + d.type + ".onclick", err);
                }
            }
            if (d.dirty) {
                redraw();
            }
        } else if (d.changed) {
            RED.notify(RED._("notification.warning", { message: RED._("notification.warnings.undeployedChanges") }), "warning");
        } else {
            RED.notify(RED._("notification.warning", { message: RED._("notification.warnings.nodeActionDisabled") }), "warning");
        }
        d3.event.preventDefault();
    }

    function showTouchMenu(obj, pos) {
        var mdn = mousedown_node;
        var options = [];
        options.push({ name: "delete", disabled: (moving_set.length === 0 && selected_link === null), onselect: function () { deleteSelection(); } });
        options.push({ name: "cut", disabled: (moving_set.length === 0), onselect: function () { copySelection(); deleteSelection(); } });
        options.push({ name: "copy", disabled: (moving_set.length === 0), onselect: function () { copySelection(); } });
        options.push({ name: "paste", disabled: (clipboard.length === 0), onselect: function () { importNodes(clipboard, false, true); } });
        options.push({ name: "edit", disabled: (moving_set.length != 1), onselect: function () { RED.editor.edit(mdn); } });
        options.push({ name: "select", onselect: function () { selectAll(); } });
        options.push({ name: "undo", disabled: (RED.history.depth() === 0), onselect: function () { RED.history.pop(); } });

        RED.touch.radialMenu.show(obj, pos, options);
        resetMouseVars();
    }
    function redraw() {
        vis.attr("transform", "scale(" + scaleFactor + ")");
        outer.attr("width", space_width * scaleFactor).attr("height", space_height * scaleFactor);

        // Don't bother redrawing nodes if we're drawing links
        if (mouse_mode != RED.state.JOINING) {

            var dirtyNodes = {};

            if (activeSubflow) {
                var subflowOutputs = vis.selectAll(".subflowoutput").data(activeSubflow.out, function (d, i) { return d.id; });
                subflowOutputs.exit().remove();
                var outGroup = subflowOutputs.enter().insert("svg:g").attr("class", "node subflowoutput").attr("transform", function (d) { return "translate(" + (d.x - 20) + "," + (d.y - 20) + ")" });
                outGroup.each(function (d, i) {
                    d.w = 40;
                    d.h = 40;
                });
                outGroup.append("rect").attr("class", "subflowport").attr("rx", 8).attr("ry", 8).attr("width", 40).attr("height", 40)
                    // TODO: This is exactly the same set of handlers used for regular nodes - DRY
                    .on("mouseup", nodeMouseUp)
                    .on("mousedown", nodeMouseDown)
                    .on("touchstart", function (d) {
                        var obj = d3.select(this);
                        var touch0 = d3.event.touches.item(0);
                        var pos = [touch0.pageX, touch0.pageY];
                        startTouchCenter = [touch0.pageX, touch0.pageY];
                        startTouchDistance = 0;
                        touchStartTime = setTimeout(function () {
                            showTouchMenu(obj, pos);
                        }, touchLongPressTimeout);
                        nodeMouseDown.call(this, d)
                    })
                    .on("touchend", function (d) {
                        clearTimeout(touchStartTime);
                        touchStartTime = null;
                        if (RED.touch.radialMenu.active()) {
                            d3.event.stopPropagation();
                            return;
                        }
                        nodeMouseUp.call(this, d);
                    });

                outGroup.append("rect").attr("class", "port").attr("rx", 3).attr("ry", 3).attr("width", 10).attr("height", 10).attr("x", -5).attr("y", 15)
                    .on("mousedown", function (d, i) { portMouseDown(d, 1, 0); })
                    .on("touchstart", function (d, i) { portMouseDown(d, 1, 0); })
                    .on("mouseup", function (d, i) { portMouseUp(d, 1, 0); })
                    .on("touchend", function (d, i) { portMouseUp(d, 1, 0); })
                    .on("mouseover", function (d, i) { var port = d3.select(this); port.classed("port_hovered", (mouse_mode != RED.state.JOINING || (drag_lines.length > 0 && drag_lines[0].portType !== 1))); })
                    .on("mouseout", function (d, i) { var port = d3.select(this); port.classed("port_hovered", false); });

                outGroup.append("svg:text").attr("class", "port_label").attr("x", 20).attr("y", 8).style("font-size", "10px").text("output");
                outGroup.append("svg:text").attr("class", "port_label port_index").attr("x", 20).attr("y", 24).text(function (d, i) { return i + 1 });

                var subflowInputs = vis.selectAll(".subflowinput").data(activeSubflow.in, function (d, i) { return d.id; });
                subflowInputs.exit().remove();
                var inGroup = subflowInputs.enter().insert("svg:g").attr("class", "node subflowinput").attr("transform", function (d) { return "translate(" + (d.x - 20) + "," + (d.y - 20) + ")" });
                inGroup.each(function (d, i) {
                    d.w = 40;
                    d.h = 40;
                });
                inGroup.append("rect").attr("class", "subflowport").attr("rx", 8).attr("ry", 8).attr("width", 40).attr("height", 40)
                    // TODO: This is exactly the same set of handlers used for regular nodes - DRY
                    .on("mouseup", nodeMouseUp)
                    .on("mousedown", nodeMouseDown)
                    .on("touchstart", function (d) {
                        var obj = d3.select(this);
                        var touch0 = d3.event.touches.item(0);
                        var pos = [touch0.pageX, touch0.pageY];
                        startTouchCenter = [touch0.pageX, touch0.pageY];
                        startTouchDistance = 0;
                        touchStartTime = setTimeout(function () {
                            showTouchMenu(obj, pos);
                        }, touchLongPressTimeout);
                        nodeMouseDown.call(this, d)
                    })
                    .on("touchend", function (d) {
                        clearTimeout(touchStartTime);
                        touchStartTime = null;
                        if (RED.touch.radialMenu.active()) {
                            d3.event.stopPropagation();
                            return;
                        }
                        nodeMouseUp.call(this, d);
                    });

                inGroup.append("rect").attr("class", "port").attr("rx", 3).attr("ry", 3).attr("width", 10).attr("height", 10).attr("x", 35).attr("y", 15)
                    .on("mousedown", function (d, i) { portMouseDown(d, 0, i); })
                    .on("touchstart", function (d, i) { portMouseDown(d, 0, i); })
                    .on("mouseup", function (d, i) { portMouseUp(d, 0, i); })
                    .on("touchend", function (d, i) { portMouseUp(d, 0, i); })
                    .on("mouseover", function (d, i) { var port = d3.select(this); port.classed("port_hovered", (mouse_mode != RED.state.JOINING || (drag_lines.length > 0 && drag_lines[0].portType !== 0))); })
                    .on("mouseout", function (d, i) { var port = d3.select(this); port.classed("port_hovered", false); });
                inGroup.append("svg:text").attr("class", "port_label").attr("x", 18).attr("y", 20).style("font-size", "10px").text("input");



                subflowOutputs.each(function (d, i) {
                    if (d.dirty) {
                        var output = d3.select(this);
                        output.selectAll(".subflowport").classed("node_selected", function (d) { return d.selected; })
                        output.selectAll(".port_index").text(function (d) { return d.i + 1 });
                        output.attr("transform", function (d) { return "translate(" + (d.x - d.w / 2) + "," + (d.y - d.h / 2) + ")"; });
                        dirtyNodes[d.id] = d;
                        d.dirty = false;
                    }
                });
                subflowInputs.each(function (d, i) {
                    if (d.dirty) {
                        var input = d3.select(this);
                        input.selectAll(".subflowport").classed("node_selected", function (d) { return d.selected; })
                        input.attr("transform", function (d) { return "translate(" + (d.x - d.w / 2) + "," + (d.y - d.h / 2) + ")"; });
                        dirtyNodes[d.id] = d;
                        d.dirty = false;
                    }
                });
            } else {
                vis.selectAll(".subflowoutput").remove();
                vis.selectAll(".subflowinput").remove();
            }

            var node = vis.selectAll(".nodegroup").data(activeNodes, function (d) { return d.id });
            node.exit().remove();

            var nodeEnter = node.enter().insert("svg:g")
                .attr("class", "node nodegroup")
                .classed("node_subflow", function (d) { return activeSubflow != null; })
                .classed("node_link", function (d) { return d.type === "link in" || d.type === "link out" });

            nodeEnter.each(function (d, i) {
                var node = d3.select(this);
                var isLink = d.type === "link in" || d.type === "link out";
                node.attr("id", d.id);
                var l = d._def.label;
                try {
                    l = (typeof l === "function" ? l.call(d) : l) || "";
                } catch (err) {
                    console.log("Definition error: " + d.type + ".label", err);
                    l = d.type;
                }

                if (isLink) {
                    d.w = node_height;
                } else {
                    d.w = Math.max(node_width, gridSize * (Math.ceil((calculateTextWidth(l, "node_label", 50) + (d._def.inputs > 0 ? 7 : 0)) / gridSize)));
                }
                d.h = Math.max(node_height, (d.outputs || 0) * 15);

                if (d._def.badge) {
                    var badge = node.append("svg:g").attr("class", "node_badge_group");
                    var badgeRect = badge.append("rect").attr("class", "node_badge").attr("rx", 5).attr("ry", 5).attr("width", 40).attr("height", 15);
                    badge.append("svg:text").attr("class", "node_badge_label").attr("x", 35).attr("y", 11).attr("text-anchor", "end").text(d._def.badge());
                    if (d._def.onbadgeclick) {
                        badgeRect.attr("cursor", "pointer")
                            .on("click", function (d) { d._def.onbadgeclick.call(d); d3.event.preventDefault(); });
                    }
                }

                if (d._def.button) {
                    var nodeButtonGroup = node.append("svg:g")
                        .attr("transform", function (d) { return "translate(" + ((d._def.align == "right") ? 94 : -25) + ",2)"; })
                        .attr("class", function (d) { return "node_button " + ((d._def.align == "right") ? "node_right_button" : "node_left_button"); });
                    nodeButtonGroup.append("rect")
                        .attr("rx", 5)
                        .attr("ry", 5)
                        .attr("width", 32)
                        .attr("height", node_height - 4)
                        .attr("fill", "#eee");//function(d) { return d._def.color;})
                    nodeButtonGroup.append("rect")
                        .attr("class", "node_button_button")
                        .attr("x", function (d) { return d._def.align == "right" ? 11 : 5 })
                        .attr("y", 4)
                        .attr("rx", 4)
                        .attr("ry", 4)
                        .attr("width", 16)
                        .attr("height", node_height - 12)
                        .attr("fill", function (d) { return d._def.color; })
                        .attr("cursor", "pointer")
                        .on("mousedown", function (d) { if (!lasso && !d.changed) { focusView(); d3.select(this).attr("fill-opacity", 0.2); d3.event.preventDefault(); d3.event.stopPropagation(); } })
                        .on("mouseup", function (d) { if (!lasso && !d.changed) { d3.select(this).attr("fill-opacity", 0.4); d3.event.preventDefault(); d3.event.stopPropagation(); } })
                        .on("mouseover", function (d) { if (!lasso && !d.changed) { d3.select(this).attr("fill-opacity", 0.4); } })
                        .on("mouseout", function (d) {
                            if (!lasso && !d.changed) {
                                var op = 1;
                                if (d._def.button.toggle) {
                                    op = d[d._def.button.toggle] ? 1 : 0.2;
                                }
                                d3.select(this).attr("fill-opacity", op);
                            }
                        })
                        .on("click", nodeButtonClicked)
                        .on("touchstart", nodeButtonClicked)
                }

                var mainRect = node.append("rect")
                    .attr("class", "node")
                    .classed("node_unknown", function (d) { return d.type == "unknown"; })
                    .attr("rx", 5)
                    .attr("ry", 5)
                    .attr("fill", function (d) { return d._def.color; })
                    .on("mouseup", nodeMouseUp)
                    .on("mousedown", nodeMouseDown)
                    .on("touchstart", function (d) {
                        var obj = d3.select(this);
                        var touch0 = d3.event.touches.item(0);
                        var pos = [touch0.pageX, touch0.pageY];
                        startTouchCenter = [touch0.pageX, touch0.pageY];
                        startTouchDistance = 0;
                        touchStartTime = setTimeout(function () {
                            showTouchMenu(obj, pos);
                        }, touchLongPressTimeout);
                        nodeMouseDown.call(this, d)
                    })
                    .on("touchend", function (d) {
                        clearTimeout(touchStartTime);
                        touchStartTime = null;
                        if (RED.touch.radialMenu.active()) {
                            d3.event.stopPropagation();
                            return;
                        }
                        nodeMouseUp.call(this, d);
                    })
                    .on("mouseover", function (d) {
                        if (mouse_mode === 0) {
                            var node = d3.select(this);
                            node.classed("node_hovered", true);
                        }
                    })
                    .on("mouseout", function (d) {
                        var node = d3.select(this);
                        node.classed("node_hovered", false);
                    });

                //node.append("rect").attr("class", "node-gradient-top").attr("rx", 6).attr("ry", 6).attr("height",30).attr("stroke","none").attr("fill","url(#gradient-top)").style("pointer-events","none");
                //node.append("rect").attr("class", "node-gradient-bottom").attr("rx", 6).attr("ry", 6).attr("height",30).attr("stroke","none").attr("fill","url(#gradient-bottom)").style("pointer-events","none");

                if (d._def.icon) {

                    var icon_group = node.append("g")
                        .attr("class", "node_icon_group")
                        .attr("x", 0).attr("y", 0);

                    var icon_shade = icon_group.append("rect")
                        .attr("x", 0).attr("y", 0)
                        .attr("class", "node_icon_shade")
                        .attr("width", "30")
                        .attr("stroke", "none")
                        .attr("fill", "#000")
                        .attr("fill-opacity", "0.05")
                        .attr("height", function (d) { return Math.min(50, d.h - 4); });

                    var icon = icon_group.append("image")
                        .attr("xlink:href", `${PROXY_URL}flows/icons/${+d._def.icon}`)
                        .attr("class", "node_icon")
                        .attr("x", 0)
                        .attr("width", "30")
                        .attr("height", "30");

                    var icon_shade_border = icon_group.append("path")
                        .attr("d", function (d) { return "M 30 1 l 0 " + (d.h - 2) })
                        .attr("class", "node_icon_shade_border")
                        .attr("stroke-opacity", "0.1")
                        .attr("stroke", "#000")
                        .attr("stroke-width", "1");

                    if ("right" == d._def.align) {
                        icon_group.attr("class", "node_icon_group node_icon_group_" + d._def.align);
                        icon_shade_border.attr("d", function (d) { return "M 0 1 l 0 " + (d.h - 2) })
                        //icon.attr("class","node_icon node_icon_"+d._def.align);
                        //icon.attr("class","node_icon_shade node_icon_shade_"+d._def.align);
                        //icon.attr("class","node_icon_shade_border node_icon_shade_border_"+d._def.align);
                    }

                    //if (d.inputs > 0 && d._def.align == null) {
                    //    icon_shade.attr("width",35);
                    //    icon.attr("transform","translate(5,0)");
                    //    icon_shade_border.attr("transform","translate(5,0)");
                    //}
                    //if (d._def.outputs > 0 && "right" == d._def.align) {
                    //    icon_shade.attr("width",35); //icon.attr("x",5);
                    //}

                    var img = new Image();
                    img.src = `${PROXY_URL}flows/icons/${d._def.icon}`;
                    img.onload = function () {
                        icon.attr("width", Math.min(img.width, 30));
                        icon.attr("height", Math.min(img.height, 30));
                        icon.attr("x", 15 - Math.min(img.width, 30) / 2);
                        //if ("right" == d._def.align) {
                        //    icon.attr("x",function(d){return d.w-img.width-1-(d.outputs>0?5:0);});
                        //    icon_shade.attr("x",function(d){return d.w-30});
                        //    icon_shade_border.attr("d",function(d){return "M "+(d.w-30)+" 1 l 0 "+(d.h-2);});
                        //}
                    }

                    //icon.style("pointer-events","none");
                    icon_group.style("pointer-events", "none");
                }
                if (!isLink) {
                    var text = node.append("svg:text").attr("class", "node_label").attr("x", 38).attr("dy", ".35em").attr("text-anchor", "start");
                    if (d._def.align) {
                        text.attr("class", "node_label node_label_" + d._def.align);
                        if (d._def.align === "right") {
                            text.attr("text-anchor", "end");
                        }
                    }

                    var status = node.append("svg:g").attr("class", "node_status_group").style("display", "none");

                    var statusRect = status.append("rect").attr("class", "node_status")
                        .attr("x", 6).attr("y", 1).attr("width", 9).attr("height", 9)
                        .attr("rx", 2).attr("ry", 2).attr("stroke-width", "3");

                    var statusLabel = status.append("svg:text")
                        .attr("class", "node_status_label")
                        .attr("x", 20).attr("y", 9);
                }
                //node.append("circle").attr({"class":"centerDot","cx":0,"cy":0,"r":5});

                //node.append("path").attr("class","node_error").attr("d","M 3,-3 l 10,0 l -5,-8 z");
                node.append("image").attr("class", "node_error hidden").attr("xlink:href", `${PROXY_URL}flows/icons/node-error.png`).attr("x", 0).attr("y", -6).attr("width", 10).attr("height", 9);
                node.append("image").attr("class", "node_changed hidden").attr("xlink:href", `${PROXY_URL}flows/icons/node-changed.png`).attr("x", 12).attr("y", -6).attr("width", 10).attr("height", 10);
            });

            node.each(function (d, i) {
                if (d.dirty) {
                    var isLink = d.type === "link in" || d.type === "link out";
                    dirtyNodes[d.id] = d;
                    //if (d.x < -50) deleteSelection();  // Delete nodes if dragged back to palette
                    if (!isLink && d.resize) {
                        var l = d._def.label;
                        try {
                            l = (typeof l === "function" ? l.call(d) : l) || "";
                        } catch (err) {
                            console.log("Definition error: " + d.type + ".label", err);
                            l = d.type;
                        }
                        var ow = d.w;
                        d.w = Math.max(node_width, gridSize * (Math.ceil((calculateTextWidth(l, "node_label", 50) + (d._def.inputs > 0 ? 7 : 0)) / gridSize)));
                        d.h = Math.max(node_height, (d.outputs || 0) * 15);
                        d.x += (d.w - ow) / 2;
                        d.resize = false;
                    }
                    var thisNode = d3.select(this);
                    //thisNode.selectAll(".centerDot").attr({"cx":function(d) { return d.w/2;},"cy":function(d){return d.h/2}});
                    thisNode.attr("transform", function (d) { return "translate(" + (d.x - d.w / 2) + "," + (d.y - d.h / 2) + ")"; });

                    if (mouse_mode != RED.state.MOVING_ACTIVE) {
                        thisNode.selectAll(".node")
                            .attr("width", function (d) { return d.w })
                            .attr("height", function (d) { return d.h })
                            .classed("node_selected", function (d) { return d.selected; })
                            .classed("node_highlighted", function (d) { return d.highlighted; })
                            ;
                        //thisNode.selectAll(".node-gradient-top").attr("width",function(d){return d.w});
                        //thisNode.selectAll(".node-gradient-bottom").attr("width",function(d){return d.w}).attr("y",function(d){return d.h-30});

                        thisNode.selectAll(".node_icon_group_right").attr("transform", function (d) { return "translate(" + (d.w - 30) + ",0)" });
                        thisNode.selectAll(".node_label_right").attr("x", function (d) { return d.w - 38 });
                        //thisNode.selectAll(".node_icon_right").attr("x",function(d){return d.w-d3.select(this).attr("width")-1-(d.outputs>0?5:0);});
                        //thisNode.selectAll(".node_icon_shade_right").attr("x",function(d){return d.w-30;});
                        //thisNode.selectAll(".node_icon_shade_border_right").attr("d",function(d){return "M "+(d.w-30)+" 1 l 0 "+(d.h-2)});

                        var inputPorts = thisNode.selectAll(".port_input");
                        if (d.inputs === 0 && !inputPorts.empty()) {
                            inputPorts.remove();
                            //nodeLabel.attr("x",30);
                        } else if (d.inputs === 1 && inputPorts.empty()) {
                            var inputGroup = thisNode.append("g").attr("class", "port_input");
                            inputGroup.append("rect").attr("class", "port").attr("rx", 3).attr("ry", 3).attr("width", 10).attr("height", 10)
                                .on("mousedown", function (d) { portMouseDown(d, 1, 0); })
                                .on("touchstart", function (d) { portMouseDown(d, 1, 0); })
                                .on("mouseup", function (d) { portMouseUp(d, 1, 0); })
                                .on("touchend", function (d) { portMouseUp(d, 1, 0); })
                                .on("mouseover", function (d) { var port = d3.select(this); port.classed("port_hovered", (mouse_mode != RED.state.JOINING || (drag_lines.length > 0 && drag_lines[0].portType !== 1))); })
                                .on("mouseout", function (d) { var port = d3.select(this); port.classed("port_hovered", false); })
                        }

                        var numOutputs = d.outputs;
                        var y = (d.h / 2) - ((numOutputs - 1) / 2) * 13;
                        d.ports = d.ports || d3.range(numOutputs);
                        d._ports = thisNode.selectAll(".port_output").data(d.ports);
                        var output_group = d._ports.enter().append("g").attr("class", "port_output");

                        output_group.append("rect").attr("class", "port").attr("rx", 3).attr("ry", 3).attr("width", 10).attr("height", 10)
                            .on("mousedown", (function () { var node = d; return function (d, i) { portMouseDown(node, 0, i); } })())
                            .on("touchstart", (function () { var node = d; return function (d, i) { portMouseDown(node, 0, i); } })())
                            .on("mouseup", (function () { var node = d; return function (d, i) { portMouseUp(node, 0, i); } })())
                            .on("touchend", (function () { var node = d; return function (d, i) { portMouseUp(node, 0, i); } })())
                            .on("mouseover", function (d, i) { var port = d3.select(this); port.classed("port_hovered", (mouse_mode != RED.state.JOINING || (drag_lines.length > 0 && drag_lines[0].portType !== 0))); })
                            .on("mouseout", function (d, i) { var port = d3.select(this); port.classed("port_hovered", false); });

                        d._ports.exit().remove();
                        if (d._ports) {
                            numOutputs = d.outputs || 1;
                            y = (d.h / 2) - ((numOutputs - 1) / 2) * 13;
                            var x = d.w - 5;
                            d._ports.each(function (d, i) {
                                var port = d3.select(this);
                                //port.attr("y",(y+13*i)-5).attr("x",x);
                                port.attr("transform", function (d) { return "translate(" + x + "," + ((y + 13 * i) - 5) + ")"; });
                            });
                        }
                        thisNode.selectAll("text.node_label").text(function (d, i) {
                            var l = "";
                            if (d._def.label) {
                                l = d._def.label;
                                try {
                                    l = (typeof l === "function" ? l.call(d) : l) || "";
                                    l = RED.text.bidi.enforceTextDirectionWithUCC(l);
                                } catch (err) {
                                    console.log("Definition error: " + d.type + ".label", err);
                                    l = d.type;
                                }
                            }
                            return l;
                        })
                            .attr("y", function (d) { return (d.h / 2) - 1; })
                            .attr("class", function (d) {
                                var s = "";
                                if (d._def.labelStyle) {
                                    s = d._def.labelStyle;
                                    try {
                                        s = (typeof s === "function" ? s.call(d) : s) || "";
                                    } catch (err) {
                                        console.log("Definition error: " + d.type + ".labelStyle", err);
                                        s = "";
                                    }
                                    s = " " + s;
                                }
                                return "node_label" +
                                    (d._def.align ? " node_label_" + d._def.align : "") + s;
                            });

                        if (d._def.icon) {
                            var icon = thisNode.select(".node_icon");
                            var current_url = icon.attr("xlink:href");
                            var icon_url;
                            if (typeof d._def.icon == "function") {
                                try {
                                    icon_url = d._def.icon.call(d);
                                } catch (err) {
                                    console.log("icon", err);
                                    icon_url = "arrow-in.png";
                                }
                            } else {
                                icon_url = d._def.icon;
                            }
                            if (`${PROXY_URL}flows/icons/${icon_url}` !== current_url) {
                                icon.attr("xlink:href", `${PROXY_URL}flows/icons/${icon_url}`);
                                var img = new Image();
                                img.src = `${PROXY_URL}flows/icons/${d._def.icon}`;
                                img.onload = function () {
                                    icon.attr("width", Math.min(img.width, 30));
                                    icon.attr("height", Math.min(img.height, 30));
                                    icon.attr("x", 15 - Math.min(img.width, 30) / 2);
                                }
                            }
                        }


                        thisNode.selectAll(".node_tools").attr("x", function (d) { return d.w - 35; }).attr("y", function (d) { return d.h - 20; });

                        thisNode.selectAll(".node_changed")
                            .attr("x", function (d) { return d.w - 10 })
                            .classed("hidden", function (d) { return !d.changed; });

                        thisNode.selectAll(".node_error")
                            .attr("x", function (d) { return d.w - 10 - (d.changed ? 13 : 0) })
                            .classed("hidden", function (d) { return d.valid; });

                        thisNode.selectAll(".port_input").each(function (d, i) {
                            var port = d3.select(this);
                            port.attr("transform", function (d) { return "translate(-5," + ((d.h / 2) - 5) + ")"; })
                        });

                        thisNode.selectAll(".node_icon").attr("y", function (d) { return (d.h - d3.select(this).attr("height")) / 2; });
                        thisNode.selectAll(".node_icon_shade").attr("height", function (d) { return d.h; });
                        thisNode.selectAll(".node_icon_shade_border").attr("d", function (d) { return "M " + (("right" == d._def.align) ? 0 : 30) + " 1 l 0 " + (d.h - 2) });

                        thisNode.selectAll(".node_button").attr("opacity", function (d) {
                            return (activeSubflow || d.changed) ? 0.4 : 1
                        });
                        thisNode.selectAll(".node_button_button").attr("cursor", function (d) {
                            return (activeSubflow || d.changed) ? "" : "pointer";
                        });
                        thisNode.selectAll(".node_right_button").attr("transform", function (d) {
                            var x = d.w - 6;
                            if (d._def.button.toggle && !d[d._def.button.toggle]) {
                                x = x - 8;
                            }
                            return "translate(" + x + ",2)";
                        });
                        thisNode.selectAll(".node_right_button rect").attr("fill-opacity", function (d) {
                            if (d._def.button.toggle) {
                                return d[d._def.button.toggle] ? 1 : 0.2;
                            }
                            return 1;
                        });

                        //thisNode.selectAll(".node_right_button").attr("transform",function(d){return "translate("+(d.w - d._def.button.width.call(d))+","+0+")";}).attr("fill",function(d) {
                        //         return typeof d._def.button.color  === "function" ? d._def.button.color.call(d):(d._def.button.color != null ? d._def.button.color : d._def.color)
                        //});

                        thisNode.selectAll(".node_badge_group").attr("transform", function (d) { return "translate(" + (d.w - 40) + "," + (d.h + 3) + ")"; });
                        thisNode.selectAll("text.node_badge_label").text(function (d, i) {
                            if (d._def.badge) {
                                if (typeof d._def.badge == "function") {
                                    try {
                                        return d._def.badge.call(d);
                                    } catch (err) {
                                        console.log("Definition error: " + d.type + ".badge", err);
                                        return "";
                                    }
                                } else {
                                    return d._def.badge;
                                }
                            }
                            return "";
                        });
                    }

                    if (!showStatus || !d.status) {
                        thisNode.selectAll(".node_status_group").style("display", "none");
                    } else {
                        thisNode.selectAll(".node_status_group").style("display", "inline").attr("transform", "translate(3," + (d.h + 3) + ")");
                        var fill = status_colours[d.status.fill]; // Only allow our colours for now
                        if (d.status.shape == null && fill == null) {
                            thisNode.selectAll(".node_status").style("display", "none");
                        } else {
                            var style;
                            if (d.status.shape == null || d.status.shape == "dot") {
                                style = {
                                    display: "inline",
                                    fill: fill,
                                    stroke: fill
                                };
                            } else if (d.status.shape == "ring") {
                                style = {
                                    display: "inline",
                                    fill: "#fff",
                                    stroke: fill
                                }
                            }
                            thisNode.selectAll(".node_status").style(style);
                        }
                        if (d.status.text) {
                            thisNode.selectAll(".node_status_label").text(d.status.text);
                        } else {
                            thisNode.selectAll(".node_status_label").text("");
                        }
                    }

                    d.dirty = false;
                }
            });

            var link = vis.selectAll(".link").data(
                activeLinks,
                function (d) {
                    return d.source.id + ":" + d.sourcePort + ":" + d.target.id + ":" + d.target.i;
                }
            );
            var linkEnter = link.enter().insert("g", ".node").attr("class", "link");

            linkEnter.each(function (d, i) {
                var l = d3.select(this);
                d.added = true;
                l.append("svg:path").attr("class", "link_background link_path")
                    .on("mousedown", function (d) {
                        mousedown_link = d;
                        clearSelection();
                        selected_link = mousedown_link;
                        updateSelection();
                        redraw();
                        focusView();
                        d3.event.stopPropagation();
                    })
                    .on("touchstart", function (d) {
                        mousedown_link = d;
                        clearSelection();
                        selected_link = mousedown_link;
                        updateSelection();
                        redraw();
                        focusView();
                        d3.event.stopPropagation();

                        var obj = d3.select(document.body);
                        var touch0 = d3.event.touches.item(0);
                        var pos = [touch0.pageX, touch0.pageY];
                        touchStartTime = setTimeout(function () {
                            touchStartTime = null;
                            showTouchMenu(obj, pos);
                        }, touchLongPressTimeout);
                    })
                l.append("svg:path").attr("class", "link_outline link_path");
                l.append("svg:path").attr("class", "link_line link_path")
                    .classed("link_link", function (d) { return d.link })
                    .classed("link_subflow", function (d) { return !d.link && activeSubflow });
            });

            link.exit().remove();
            var links = vis.selectAll(".link_path");
            links.each(function (d) {
                var link = d3.select(this);
                if (d.added || d === selected_link || d.selected || dirtyNodes[d.source.id] || dirtyNodes[d.target.id]) {
                    link.attr("d", function (d) {
                        var numOutputs = d.source.outputs || 1;
                        var sourcePort = d.sourcePort || 0;
                        var y = -((numOutputs - 1) / 2) * 13 + 13 * sourcePort;

                        var dy = d.target.y - (d.source.y + y);
                        var dx = (d.target.x - d.target.w / 2) - (d.source.x + d.source.w / 2);
                        var delta = Math.sqrt(dy * dy + dx * dx);
                        var scale = lineCurveScale;
                        var scaleY = 0;
                        if (delta < node_width) {
                            scale = 0.75 - 0.75 * ((node_width - delta) / node_width);
                        }

                        if (dx < 0) {
                            scale += 2 * (Math.min(5 * node_width, Math.abs(dx)) / (5 * node_width));
                            if (Math.abs(dy) < 3 * node_height) {
                                scaleY = ((dy > 0) ? 0.5 : -0.5) * (((3 * node_height) - Math.abs(dy)) / (3 * node_height)) * (Math.min(node_width, Math.abs(dx)) / (node_width));
                            }
                        }

                        d.x1 = d.source.x + d.source.w / 2;
                        d.y1 = d.source.y + y;
                        d.x2 = d.target.x - d.target.w / 2;
                        d.y2 = d.target.y;

                        return "M " + (d.source.x + d.source.w / 2) + " " + (d.source.y + y) +
                            " C " + (d.source.x + d.source.w / 2 + scale * node_width) + " " + (d.source.y + y + scaleY * node_height) + " " +
                            (d.target.x - d.target.w / 2 - scale * node_width) + " " + (d.target.y - scaleY * node_height) + " " +
                            (d.target.x - d.target.w / 2) + " " + d.target.y;
                    });
                }
            })

            link.classed("link_selected", function (d) { return d === selected_link || d.selected; });
            link.classed("link_unknown", function (d) {
                delete d.added;
                return d.target.type == "unknown" || d.source.type == "unknown"
            });
            var offLinks = vis.selectAll(".link_flow_link_g").data(
                activeFlowLinks,
                function (d) {
                    return d.node.id + ":" + d.refresh
                }
            );

            var offLinksEnter = offLinks.enter().insert("g", ".node").attr("class", "link_flow_link_g");
            offLinksEnter.each(function (d, i) {
                var g = d3.select(this);
                var s = 1;
                var labelAnchor = "start";
                if (d.node.type === "link in") {
                    s = -1;
                    labelAnchor = "end";
                }
                var stemLength = s * 30;
                var branchLength = s * 20;
                var l = g.append("svg:path").attr("class", "link_flow_link")
                    .attr("class", "link_link").attr("d", "M 0 0 h " + stemLength);
                var links = d.links;
                var flows = Object.keys(links);
                var tabOrder = RED.nodes.getWorkspaceOrder();
                flows.sort(function (A, B) {
                    return tabOrder.indexOf(A) - tabOrder.indexOf(B);
                });
                var linkWidth = 10;
                var h = node_height;
                var y = -(flows.length - 1) * h / 2;
                var linkGroups = g.selectAll(".link_group").data(flows);
                var enterLinkGroups = linkGroups.enter().append("g").attr("class", "link_group")
                    .on('mouseover', function () { d3.select(this).classed('link_group_active', true) })
                    .on('mouseout', function () { d3.select(this).classed('link_group_active', false) })
                    .on('mousedown', function () { d3.event.preventDefault(); d3.event.stopPropagation(); })
                    .on('mouseup', function (f) {
                        d3.event.stopPropagation();
                        var targets = d.links[f];
                        RED.workspaces.show(f);
                        targets.forEach(function (n) {
                            n.selected = true;
                            n.dirty = true;
                            moving_set.push({ n: n });
                        });
                        updateSelection();
                        redraw();
                    });
                enterLinkGroups.each(function (f) {
                    var linkG = d3.select(this);
                    linkG.append("svg:path").attr("class", "link_flow_link")
                        .attr("class", "link_link")
                        .attr("d",
                            "M " + stemLength + " 0 " +
                            "C " + (stemLength + (1.7 * branchLength)) + " " + 0 +
                            " " + (stemLength + (0.1 * branchLength)) + " " + y + " " +
                            (stemLength + branchLength * 1.5) + " " + y + " "
                        );
                    linkG.append("svg:path")
                        .attr("class", "link_port")
                        .attr("d",
                            "M " + (stemLength + branchLength * 1.5 + s * (linkWidth + 7)) + " " + (y - 12) + " " +
                            "h " + (-s * linkWidth) + " " +
                            "a 3 3 45 0 " + (s === 1 ? "0" : "1") + " " + (s * -3) + " 3 " +
                            "v 18 " +
                            "a 3 3 45 0 " + (s === 1 ? "0" : "1") + " " + (s * 3) + " 3 " +
                            "h " + (s * linkWidth)
                        );
                    linkG.append("svg:path")
                        .attr("class", "link_port")
                        .attr("d",
                            "M " + (stemLength + branchLength * 1.5 + s * (linkWidth + 10)) + " " + (y - 12) + " " +
                            "h " + (s * (linkWidth * 3)) + " " +
                            "M " + (stemLength + branchLength * 1.5 + s * (linkWidth + 10)) + " " + (y + 12) + " " +
                            "h " + (s * (linkWidth * 3))
                        ).style("stroke-dasharray", "12 3 8 4 3");
                    linkG.append("rect").attr("class", "port link_port")
                        .attr("x", stemLength + branchLength * 1.5 - 4 + (s * 4))
                        .attr("y", y - 4)
                        .attr("rx", 2)
                        .attr("ry", 2)
                        .attr("width", 8)
                        .attr("height", 8);
                    linkG.append("rect")
                        .attr("x", stemLength + branchLength * 1.5 - (s === -1 ? node_width : 0))
                        .attr("y", y - 12)
                        .attr("width", node_width)
                        .attr("height", 24)
                        .style("stroke", "none")
                        .style("fill", "transparent")
                    var tab = RED.nodes.workspace(f);
                    var label;
                    if (tab) {
                        label = tab.label || tab.id;
                    }
                    linkG.append("svg:text")
                        .attr("class", "port_label")
                        .attr("x", stemLength + branchLength * 1.5 + (s * 15))
                        .attr("y", y + 1)
                        .style("font-size", "10px")
                        .style("text-anchor", labelAnchor)
                        .text(label);

                    y += h;
                });
                linkGroups.exit().remove();
            });
            offLinks.exit().remove();
            offLinks = vis.selectAll(".link_flow_link_g");
            offLinks.each(function (d) {
                var s = 1;
                if (d.node.type === "link in") {
                    s = -1;
                }
                var link = d3.select(this);
                link.attr("transform", function (d) { return "translate(" + (d.node.x + (s * d.node.w / 2)) + "," + (d.node.y) + ")"; });

            })

        } else {
            // JOINING - unselect any selected links
            vis.selectAll(".link_selected").data(
                activeLinks,
                function (d) {
                    return d.source.id + ":" + d.sourcePort + ":" + d.target.id + ":" + d.target.i;
                }
            ).classed("link_selected", false);
        }

        if (d3.event) {
            d3.event.preventDefault();
        }

    }

    function focusView() {
        try {
            // Workaround for browser unexpectedly scrolling iframe into full
            // view - record the parent scroll position and restore it after
            // setting the focus
            var scrollX = window.parent.window.scrollX;
            var scrollY = window.parent.window.scrollY;
            $("#chart").focus();
            window.parent.window.scrollTo(scrollX, scrollY);
        } catch (err) {
            // In case we're iframed into a page of a different origin, just focus
            // the view following the inevitable DOMException
            $("#chart").focus();
        }
    }

    /**
     * Imports a new collection of nodes from a JSON String.
     *  - all get new IDs assigned
     *  - all "selected"
     *  - attached to mouse for placing - "IMPORT_DRAGGING"
     */
    function importNodes(newNodesStr, addNewFlow, touchImport) {
        try {
            var activeSubflowChanged;
            if (activeSubflow) {
                activeSubflowChanged = activeSubflow.changed;
            }
            var result = RED.nodes.import(newNodesStr, true, addNewFlow);
            if (result) {
                var new_nodes = result[0];
                var new_links = result[1];
                var new_workspaces = result[2];
                var new_subflows = result[3];
                var new_default_workspace = result[4];
                if (addNewFlow && new_default_workspace) {
                    RED.workspaces.show(new_default_workspace.id);
                }
                var new_ms = new_nodes.filter(function (n) { return n.hasOwnProperty("x") && n.hasOwnProperty("y") && n.z == RED.workspaces.active() }).map(function (n) { return { n: n }; });
                var new_node_ids = new_nodes.map(function (n) { return n.id; });

                // TODO: pick a more sensible root node
                if (new_ms.length > 0) {
                    var root_node = new_ms[0].n;
                    var dx = root_node.x;
                    var dy = root_node.y;

                    if (mouse_position == null) {
                        mouse_position = [0, 0];
                    }

                    var minX = 0;
                    var minY = 0;
                    var i;
                    var node;

                    for (i = 0; i < new_ms.length; i++) {
                        node = new_ms[i];
                        node.n.selected = true;
                        node.n.changed = true;
                        node.n.x -= dx - mouse_position[0];
                        node.n.y -= dy - mouse_position[1];
                        node.dx = node.n.x - mouse_position[0];
                        node.dy = node.n.y - mouse_position[1];
                        minX = Math.min(node.n.x - node_width / 2 - 5, minX);
                        minY = Math.min(node.n.y - node_height / 2 - 5, minY);
                    }
                    for (i = 0; i < new_ms.length; i++) {
                        node = new_ms[i];
                        node.n.x -= minX;
                        node.n.y -= minY;
                        node.dx -= minX;
                        node.dy -= minY;
                        if (node.n._def.onadd) {
                            try {
                                node.n._def.onadd.call(node.n);
                            } catch (err) {
                                console.log("onadd:", err);
                            }
                        }

                    }
                    if (!touchImport) {
                        mouse_mode = RED.state.IMPORT_DRAGGING;
                        spliceActive = false;
                        if (new_ms.length === 1) {
                            node = new_ms[0];
                            spliceActive = node.n.hasOwnProperty("_def") &&
                                node.n._def.inputs > 0 &&
                                node.n._def.outputs > 0;
                        }
                    }
                    RED.keyboard.add("*", "escape", function () {
                        RED.keyboard.remove("escape");
                        clearSelection();
                        RED.history.pop();
                        mouse_mode = 0;
                    });
                    clearSelection();
                    moving_set = new_ms;
                }

                var historyEvent = {
                    t: "add",
                    nodes: new_node_ids,
                    links: new_links,
                    workspaces: new_workspaces,
                    subflows: new_subflows,
                    dirty: RED.nodes.dirty()
                };
                if (new_ms.length === 0) {
                    RED.nodes.dirty(true);
                }
                if (activeSubflow) {
                    var subflowRefresh = RED.subflow.refresh(true);
                    if (subflowRefresh) {
                        historyEvent.subflow = {
                            id: activeSubflow.id,
                            changed: activeSubflowChanged,
                            instances: subflowRefresh.instances
                        }
                    }
                }
                RED.history.push(historyEvent);

                updateActiveNodes();
                redraw();
            }
        } catch (error) {
            if (error.code != "NODE_RED") {
                console.log(error.stack);
                RED.notify(RED._("notification.error", { message: error.toString() }), "error");
            } else {
                RED.notify(RED._("notification.error", { message: error.message }), "error");
            }
        }
    }

    function toggleShowGrid(state) {
        if (state) {
            grid.style("visibility", "visible");
        } else {
            grid.style("visibility", "hidden");
        }
    }
    function toggleSnapGrid(state) {
        snapGrid = state;
        redraw();
    }
    function toggleStatus(s) {
        showStatus = s;
        RED.nodes.eachNode(function (n) { n.dirty = true; });
        //TODO: subscribe/unsubscribe here
        redraw();
    }

    return {
        init: init,
        state: function (state) {
            if (state == null) {
                return mouse_mode
            } else {
                mouse_mode = state;
            }
        },

        redraw: function (updateActive) {
            if (updateActive) {
                updateActiveNodes();
                updateSelection();
            }
            redraw();
        },
        focus: focusView,
        importNodes: importNodes,
        calculateTextWidth: calculateTextWidth,
        select: function (selection) {
            if (typeof selection !== "undefined") {
                clearSelection();
                if (typeof selection == "string") {
                    var selectedNode = RED.nodes.node(selection);
                    if (selectedNode) {
                        selectedNode.selected = true;
                        selectedNode.dirty = true;
                        moving_set = [{ n: selectedNode }];
                    }
                }
            }
            updateSelection();
            redraw();
        },
        selection: function () {
            var selection = {};
            if (moving_set.length > 0) {
                selection.nodes = moving_set.map(function (n) { return n.n; });
            }
            if (selected_link != null) {
                selection.link = selected_link;
            }
            return selection;
        },
        scale: function () {
            return scaleFactor;
        },
        getLinksAtPoint: function (x, y) {
            var result = [];
            var links = outer.selectAll(".link_background")[0];
            for (var i = 0; i < links.length; i++) {
                var bb = links[i].getBBox();
                if (x >= bb.x && y >= bb.y && x <= bb.x + bb.width && y <= bb.y + bb.height) {
                    result.push(links[i])
                }
            }
            return result;
        },
        reveal: function (id) {
            if (RED.nodes.workspace(id) || RED.nodes.subflow(id)) {
                RED.workspaces.show(id);
            } else {
                var node = RED.nodes.node(id);
                if (node._def.category !== 'config' && node.z) {
                    node.highlighted = true;
                    node.dirty = true;
                    RED.workspaces.show(node.z);

                    var screenSize = [$("#chart").width(), $("#chart").height()];
                    var scrollPos = [$("#chart").scrollLeft(), $("#chart").scrollTop()];

                    if (node.x < scrollPos[0] || node.y < scrollPos[1] || node.x > screenSize[0] + scrollPos[0] || node.y > screenSize[1] + scrollPos[1]) {
                        var deltaX = '-=' + ((scrollPos[0] - node.x) + screenSize[0] / 2);
                        var deltaY = '-=' + ((scrollPos[1] - node.y) + screenSize[1] / 2);
                        $("#chart").animate({
                            scrollLeft: deltaX,
                            scrollTop: deltaY
                        }, 200);
                    }

                    if (!node._flashing) {
                        node._flashing = true;
                        var flash = 22;
                        var flashFunc = function () {
                            flash--;
                            node.dirty = true;
                            if (flash >= 0) {
                                node.highlighted = !node.highlighted;
                                setTimeout(flashFunc, 100);
                            } else {
                                node.highlighted = false;
                                delete node._flashing;
                            }
                            RED.view.redraw();
                        }
                        flashFunc();
                    }
                } else if (node._def.category === 'config') {
                    // RED.sidebar.config.show(id);
                }
            }
        }

    };
})();

// Handles the static sidebar used to display, node help, debug and general node-red options
// RED.sidebar is not needed

RED.palette = (function () {

    var exclusion = ['config', 'unknown', 'deprecated'];
    var coreCategories = ['subflows', 'input', 'output', 'function', 'social', 'mobile', 'storage', 'analysis', 'advanced'];

    var categoryContainers = {};

    function createCategoryContainer(category, label) {
        label = label || category.replace("_", " ");
        var catDiv = $('<div id="palette-container-' + category + '" class="palette-category palette-close hide">' +
            '<div id="palette-header-' + category + '" class="palette-header"><i class="expanded fa fa-angle-down"></i><span>' + label + '</span></div>' +
            '<div class="palette-content" id="palette-base-category-' + category + '">' +
            '<div id="palette-' + category + '-input"></div>' +
            '<div id="palette-' + category + '-output"></div>' +
            '<div id="palette-' + category + '-function"></div>' +
            '</div>' +
            '</div>').appendTo("#palette-container");

        categoryContainers[category] = {
            container: catDiv,
            close: function () {
                catDiv.removeClass("palette-open");
                catDiv.addClass("palette-closed");
                $("#palette-base-category-" + category).slideUp();
                $("#palette-header-" + category + " i").removeClass("expanded");
            },
            open: function () {
                catDiv.addClass("palette-open");
                catDiv.removeClass("palette-closed");
                $("#palette-base-category-" + category).slideDown();
                $("#palette-header-" + category + " i").addClass("expanded");
            },
            toggle: function () {
                if (catDiv.hasClass("palette-open")) {
                    categoryContainers[category].close();
                } else {
                    categoryContainers[category].open();
                }
            }
        };

        $("#palette-header-" + category).on('click', function (e) {
            categoryContainers[category].toggle();
        });
    }

    function setLabel(type, el, label, info) {
        var nodeWidth = 82;
        var nodeHeight = 25;
        var lineHeight = 20;
        var portHeight = 10;

        var words = label.split(/[ -]/);

        var displayLines = [];

        var currentLine = words[0];
        var currentLineWidth = RED.view.calculateTextWidth(currentLine, "palette_label", 0);

        for (var i = 1; i < words.length; i++) {
            var newWidth = RED.view.calculateTextWidth(currentLine + " " + words[i], "palette_label", 0);
            if (newWidth < nodeWidth) {
                currentLine += " " + words[i];
                currentLineWidth = newWidth;
            } else {
                displayLines.push(currentLine);
                currentLine = words[i];
                currentLineWidth = RED.view.calculateTextWidth(currentLine, "palette_label", 0);
            }
        }
        displayLines.push(currentLine);

        var lines = displayLines.join("<br/>");
        var multiLineNodeHeight = 8 + (lineHeight * displayLines.length);
        el.css({ height: multiLineNodeHeight + "px" });

        var labelElement = el.find(".palette_label");
        labelElement.html(lines).attr('dir', RED.text.bidi.resolveBaseTextDir(lines));

        el.find(".palette_port").css({ top: (multiLineNodeHeight / 2 - 5) + "px" });

        var popOverContent;
        try {
            var l = "<p><b>" + RED.text.bidi.enforceTextDirectionWithUCC(label) + "</b></p>";
            if (label != type) {
                l = "<p><b>" + RED.text.bidi.enforceTextDirectionWithUCC(label) + "</b><br/><i>" + type + "</i></p>";
            }
            popOverContent = $(l + (info ? info : $("script[data-help-name$='" + type + "']").html() || "<p>" + RED._("palette.noInfo") + "</p>").trim())
                .filter(function (n) {
                    return (this.nodeType == 1 && this.nodeName == "P") || (this.nodeType == 3 && this.textContent.trim().length > 0)
                }).slice(0, 2);
        } catch (err) {
            // Malformed HTML may cause errors. TODO: need to understand what can break
            // NON-NLS: internal debug
            console.log("Error generating pop-over label for ", type);
            console.log(err.toString());
            popOverContent = "<p><b>" + label + "</b></p><p>" + RED._("palette.noInfo") + "</p>";
        }

        // el.data('popover').setContent(popOverContent);
    }

    function escapeNodeType(nt) {
        return nt.replace(/ /g, "_").replace(/\./g, "_").replace(/:/g, "_");
    }

    function addNodeType(nt, def) {
        var nodeTypeId = escapeNodeType(nt);
        if ($("#palette_node_" + nodeTypeId).length) {
            return;
        }
        if (exclusion.indexOf(def.category) === -1) {

            var category = def.category.replace(" ", "_");
            var rootCategory = category.split("-")[0];

            var d = document.createElement("div");
            d.id = "palette_node_" + nodeTypeId;
            d.type = nt;

            var label = /^(.*?)([ -]in|[ -]out)?$/.exec(nt)[1];
            if (typeof def.paletteLabel !== "undefined") {
                try {
                    label = (typeof def.paletteLabel === "function" ? def.paletteLabel.call(def) : def.paletteLabel) || "";
                } catch (err) {
                    console.log("Definition error: " + nt + ".paletteLabel", err);
                }
            }

            $('<div/>', { class: "palette_label" + (def.align === "right" ? " palette_label_right" : "") }).appendTo(d);

            d.className = "palette_node";


            if (def.icon) {
                var icon_url = "arrow-in.png";
                try {
                    icon_url = (typeof def.icon === "function" ? def.icon.call({}) : def.icon);
                } catch (err) {
                    console.log("Definition error: " + nt + ".icon", err);
                }
                var iconContainer = $('<div/>', { class: "palette_icon_container" + (def.align === "right" ? " palette_icon_container_right" : "") }).appendTo(d);
                $('<div/>', { class: "palette_icon", style: `background-image: url(${PROXY_URL}flows/icons/${icon_url})` }).appendTo(iconContainer);
            }

            d.style.backgroundColor = def.color;

            if (def.outputs > 0) {
                var portOut = document.createElement("div");
                portOut.className = "palette_port palette_port_output";
                d.appendChild(portOut);
            }

            if (def.inputs > 0) {
                var portIn = document.createElement("div");
                portIn.className = "palette_port palette_port_input";
                d.appendChild(portIn);
            }

            if ($("#palette-base-category-" + rootCategory).length === 0) {
                if (coreCategories.indexOf(rootCategory) !== -1) {
                    createCategoryContainer(rootCategory, RED._("node-red:palette.label." + rootCategory, { defaultValue: rootCategory }));
                } else {
                    var ns = def.set.id;
                    createCategoryContainer(rootCategory, RED._(ns + ":palette.label." + rootCategory, { defaultValue: rootCategory }));
                }
            }
            $("#palette-container-" + rootCategory).attr("style", "display: block !important");

            if ($("#palette-" + category).length === 0) {
                $("#palette-base-category-" + rootCategory).append('<div id="palette-' + category + '"></div>');
            }

            $("#palette-" + category).append(d);
            d.onmousedown = function (e) { e.preventDefault(); };

            // $(d).popover({
            //     title:d.type,
            //     placement:"right",
            //     trigger: "hover",
            //     delay: { show: 750, hide: 50 },
            //     html: true,
            //     container:'body'
            // });

            $(d).click(function () {
                RED.view.focus();
                var helpText;
                if (nt.indexOf("subflow:") === 0) {
                    helpText = marked(RED.nodes.subflow(nt.substring(8)).info || "");
                } else {
                    helpText = $("script[data-help-name$='" + d.type + "']").html() || "";
                }
                var help = '<div class="node-help">' + helpText + "</div>";
                // RED.sidebar.info.set(help);
            });
            var chart = $("#chart");
            var chartOffset = chart.offset();
            var chartSVG = $("#chart>svg").get(0);
            var activeSpliceLink;
            var mouseX;
            var mouseY;
            var spliceTimer;
            $(d).draggable({
                helper: 'clone',
                appendTo: $('.flows-wrapper'),
                revert: true,
                revertDuration: 50,
                containment: '#main-container',
                start: function () { RED.view.focus(); },
                stop: function () { d3.select('.link_splice').classed('link_splice', false); if (spliceTimer) { clearTimeout(spliceTimer); spliceTimer = null; } },
                drag: function (e, ui) {

                    // TODO: this is the margin-left of palette node. Hard coding
                    // it here makes me sad
                    //console.log(ui.helper.position());
                    ui.position.left += 17.5;

                    if (def.inputs > 0 && def.outputs > 0) {
                        mouseX = ui.position.left + (ui.helper.width() / 2) - chartOffset.left + chart.scrollLeft();
                        mouseY = ui.position.top + (ui.helper.height() / 2) - chartOffset.top + chart.scrollTop();

                        if (!spliceTimer) {
                            spliceTimer = setTimeout(function () {
                                var nodes = [];
                                var bestDistance = Infinity;
                                var bestLink = null;
                                if (chartSVG.getIntersectionList) {
                                    var svgRect = chartSVG.createSVGRect();
                                    svgRect.x = mouseX;
                                    svgRect.y = mouseY;
                                    svgRect.width = 1;
                                    svgRect.height = 1;
                                    nodes = chartSVG.getIntersectionList(svgRect, chartSVG);
                                    mouseX /= RED.view.scale();
                                    mouseY /= RED.view.scale();
                                } else {
                                    // Firefox doesn't do getIntersectionList and that
                                    // makes us sad
                                    mouseX /= RED.view.scale();
                                    mouseY /= RED.view.scale();
                                    nodes = RED.view.getLinksAtPoint(mouseX, mouseY);
                                }
                                for (var i = 0; i < nodes.length; i++) {
                                    if (d3.select(nodes[i]).classed('link_background')) {
                                        var length = nodes[i].getTotalLength();
                                        for (var j = 0; j < length; j += 10) {
                                            var p = nodes[i].getPointAtLength(j);
                                            var d2 = ((p.x - mouseX) * (p.x - mouseX)) + ((p.y - mouseY) * (p.y - mouseY));
                                            if (d2 < 200 && d2 < bestDistance) {
                                                bestDistance = d2;
                                                bestLink = nodes[i];
                                            }
                                        }
                                    }
                                }
                                if (activeSpliceLink && activeSpliceLink !== bestLink) {
                                    d3.select(activeSpliceLink.parentNode).classed('link_splice', false);
                                }
                                if (bestLink) {
                                    d3.select(bestLink.parentNode).classed('link_splice', true)
                                } else {
                                    d3.select('.link_splice').classed('link_splice', false);
                                }
                                if (activeSpliceLink !== bestLink) {
                                    if (bestLink) {
                                        $(ui.helper).data('splice', d3.select(bestLink).data()[0]);
                                    } else {
                                        $(ui.helper).removeData('splice');
                                    }
                                }
                                activeSpliceLink = bestLink;
                                spliceTimer = null;
                            }, 200);
                        }
                    }
                }
            });

            var nodeInfo = null;
            if (def.category == "subflows") {
                $(d).dblclick(function (e) {
                    RED.workspaces.show(nt.substring(8));
                    e.preventDefault();
                });
                nodeInfo = marked(def.info || "");
            }
            setLabel(nt, $(d), label, nodeInfo);

            var categoryNode = $("#palette-container-" + category);
            if (categoryNode.find(".palette_node").length === 1) {
                categoryContainers[category].open();
            }

        }
    }

    function removeNodeType(nt) {
        var nodeTypeId = escapeNodeType(nt);
        var paletteNode = $("#palette_node_" + nodeTypeId);
        var categoryNode = paletteNode.closest(".palette-category");
        paletteNode.remove();
        if (categoryNode.find(".palette_node").length === 0) {
            if (categoryNode.find("i").hasClass("expanded")) {
                categoryNode.find(".palette-content").slideToggle();
                categoryNode.find("i").toggleClass("expanded");
            }
        }
    }

    function hideNodeType(nt) {
        var nodeTypeId = escapeNodeType(nt);
        $("#palette_node_" + nodeTypeId).hide();
    }

    function showNodeType(nt) {
        var nodeTypeId = escapeNodeType(nt);
        $("#palette_node_" + nodeTypeId).attr("style", "display: block !important");
    }

    function refreshNodeTypes() {
        RED.nodes.eachSubflow(function (sf) {
            var paletteNode = $("#palette_node_subflow_" + sf.id.replace(".", "_"));
            var portInput = paletteNode.find(".palette_port_input");
            var portOutput = paletteNode.find(".palette_port_output");

            if (portInput.length === 0 && sf.in.length > 0) {
                var portIn = document.createElement("div");
                portIn.className = "palette_port palette_port_input";
                paletteNode.append(portIn);
            } else if (portInput.length !== 0 && sf.in.length === 0) {
                portInput.remove();
            }

            if (portOutput.length === 0 && sf.out.length > 0) {
                var portOut = document.createElement("div");
                portOut.className = "palette_port palette_port_output";
                paletteNode.append(portOut);
            } else if (portOutput.length !== 0 && sf.out.length === 0) {
                portOutput.remove();
            }
            setLabel(sf.type + ":" + sf.id, paletteNode, sf.name, marked(sf.info || ""));
        });
    }

    function filterChange(val) {
        var re = new RegExp(val.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'i');
        $("#palette-container .palette_node").each(function (i, el) {
            var currentLabel = $(el).find(".palette_label").text();
            if (val === "" || re.test(el.id) || re.test(currentLabel)) {
                $(this).attr("style", "display: block !important");
            } else {
                $(this).hide();
            }
        });

        for (var category in categoryContainers) {
            if (categoryContainers.hasOwnProperty(category)) {
                if (categoryContainers[category].container
                    .find(".palette_node")
                    .filter(function () { return $(this).css('display') !== 'none' }).length === 0) {
                    categoryContainers[category].close();
                } else {
                    categoryContainers[category].open();
                }
            }
        }
    }

    function init() {

        RED.events.on('registry:node-type-added', function (nodeType) {
            var def = RED.nodes.getType(nodeType);
            addNodeType(nodeType, def);
            if (def.onpaletteadd && typeof def.onpaletteadd === "function") {
                def.onpaletteadd.call(def);
            }
        });
        RED.events.on('registry:node-type-removed', function (nodeType) {
            removeNodeType(nodeType);
        });

        RED.events.on('registry:node-set-enabled', function (nodeSet) {
            for (var j = 0; j < nodeSet.types.length; j++) {
                showNodeType(nodeSet.types[j]);
                var def = RED.nodes.getType(nodeSet.types[j]);
                if (def.onpaletteadd && typeof def.onpaletteadd === "function") {
                    def.onpaletteadd.call(def);
                }
            }
        });
        RED.events.on('registry:node-set-disabled', function (nodeSet) {
            for (var j = 0; j < nodeSet.types.length; j++) {
                hideNodeType(nodeSet.types[j]);
                var def = RED.nodes.getType(nodeSet.types[j]);
                if (def.onpaletteremove && typeof def.onpaletteremove === "function") {
                    def.onpaletteremove.call(def);
                }
            }
        });
        RED.events.on('registry:node-set-removed', function (nodeSet) {
            if (nodeSet.added) {
                for (var j = 0; j < nodeSet.types.length; j++) {
                    removeNodeType(nodeSet.types[j]);
                    var def = RED.nodes.getType(nodeSet.types[j]);
                    if (def.onpaletteremove && typeof def.onpaletteremove === "function") {
                        def.onpaletteremove.call(def);
                    }
                }
            }
        });

        // $("#palette > .palette-spinner").attr("style", "display: block !important");
        // $("#palette-search input").searchBox({
        //     delay: 100,
        //     change: function() {
        //         filterChange($(this).val());
        //     }
        // })

        var categoryList = coreCategories;
        if (RED.settings.paletteCategories) {
            categoryList = RED.settings.paletteCategories;
        } else if (RED.settings.theme('palette.categories')) {
            categoryList = RED.settings.theme('palette.categories');
        }
        if (!Array.isArray(categoryList)) {
            categoryList = coreCategories
        }
        categoryList.forEach(function (category) {
            createCategoryContainer(category, RED._("palette.label." + category, { defaultValue: category }));
        });


        // matheusr @TODO dom manip here makes me sad
        $("#palette-collapse-all").on("click", function (e) {
            e.preventDefault();
            for (var cat in categoryContainers) {
                if (categoryContainers.hasOwnProperty(cat)) {
                    categoryContainers[cat].close();
                }
            }
        });
        $("#palette-expand-all").on("click", function (e) {
            e.preventDefault();
            for (var cat in categoryContainers) {
                if (categoryContainers.hasOwnProperty(cat)) {
                    categoryContainers[cat].open();
                }
            }
        });
    }

    return {
        init: init,
        add: addNodeType,
        remove: removeNodeType,
        hide: hideNodeType,
        show: showNodeType,
        refresh: refreshNodeTypes
    };
})();
RED.palette.editor = (function () {

    var disabled = false;

    var editorTabs;
    var filterInput;
    var searchInput;
    var nodeList;
    var packageList;
    var loadedList = [];
    var filteredList = [];
    var loadedIndex = {};

    var typesInUse = {};
    var nodeEntries = {};
    var eventTimers = {};
    var activeFilter = "";

    function delayCallback(start, callback) {
        var delta = Date.now() - start;
        if (delta < 300) {
            delta = 300;
        } else {
            delta = 0;
        }
        setTimeout(function () {
            callback();
        }, delta);
    }
    function changeNodeState(id, state, shade, callback) {
        shade.attr("style", "display: block !important");
        var start = Date.now();
        $.ajax({
            url: "nodes/" + id,
            type: "PUT",
            data: JSON.stringify({
                enabled: state
            }),
            contentType: "application/json; charset=utf-8"
        }).done(function (data, textStatus, xhr) {
            delayCallback(start, function () {
                shade.hide();
                callback();
            });
        }).fail(function (xhr, textStatus, err) {
            delayCallback(start, function () {
                shade.hide();
                callback(xhr);
            });
        })
    }
    function installNodeModule(id, shade, callback) {
        shade.attr("style", "display: block !important");
        $.ajax({
            url: "nodes",
            type: "POST",
            data: JSON.stringify({
                module: id
            }),
            contentType: "application/json; charset=utf-8"
        }).done(function (data, textStatus, xhr) {
            shade.hide();
            callback();
        }).fail(function (xhr, textStatus, err) {
            shade.hide();
            callback(xhr);
        });
    }
    function removeNodeModule(id, callback) {
        $.ajax({
            url: "nodes/" + id,
            type: "DELETE"
        }).done(function (data, textStatus, xhr) {
            callback();
        }).fail(function (xhr, textStatus, err) {
            callback(xhr);
        })
    }

    function refreshNodeModuleList() {
        for (var id in nodeEntries) {
            if (nodeEntries.hasOwnProperty(id)) {
                _refreshNodeModule(id);
            }
        }
    }

    function refreshNodeModule(module) {
        if (!eventTimers.hasOwnProperty(module)) {
            eventTimers[module] = setTimeout(function () {
                delete eventTimers[module];
                _refreshNodeModule(module);
            }, 100);
        }
    }


    function getContrastingBorder(rgbColor) {
        var parts = /^rgba?\(\s*(\d+),\s*(\d+),\s*(\d+)[,)]/.exec(rgbColor);
        if (parts) {
            var r = parseInt(parts[1]);
            var g = parseInt(parts[2]);
            var b = parseInt(parts[3]);
            var yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
            if (yiq > 160) {
                r = Math.floor(r * 0.8);
                g = Math.floor(g * 0.8);
                b = Math.floor(b * 0.8);
                return "rgb(" + r + "," + g + "," + b + ")";
            }
        }
        return rgbColor;
    }

    function formatUpdatedAt(dateString) {
        var now = new Date();
        var d = new Date(dateString);
        var delta = (Date.now() - new Date(dateString).getTime()) / 1000;

        if (delta < 60) {
            return RED._('palette.editor.times.seconds');
        }
        delta = Math.floor(delta / 60);
        if (delta < 10) {
            return RED._('palette.editor.times.minutes');
        }
        if (delta < 60) {
            return RED._('palette.editor.times.minutesV', { count: delta });
        }

        delta = Math.floor(delta / 60);

        if (delta < 24) {
            return RED._('palette.editor.times.hoursV', { count: delta });
        }

        delta = Math.floor(delta / 24);

        if (delta < 7) {
            return RED._('palette.editor.times.daysV', { count: delta })
        }
        var weeks = Math.floor(delta / 7);
        var days = delta % 7;

        if (weeks < 4) {
            return RED._('palette.editor.times.weeksV', { count: weeks })
        }

        var months = Math.floor(weeks / 4);
        weeks = weeks % 4;

        if (months < 12) {
            return RED._('palette.editor.times.monthsV', { count: months })
        }
        var years = Math.floor(months / 12);
        months = months % 12;

        if (months === 0) {
            return RED._('palette.editor.times.yearsV', { count: years })
        } else {
            return RED._('palette.editor.times.year' + (years > 1 ? 's' : '') + 'MonthsV', { y: years, count: months })
        }
    }


    function _refreshNodeModule(module) {
        if (!nodeEntries.hasOwnProperty(module)) {
            nodeEntries[module] = { info: RED.nodes.registry.getModule(module) };
            var index = [module];
            for (var s in nodeEntries[module].info.sets) {
                if (nodeEntries[module].info.sets.hasOwnProperty(s)) {
                    index.push(s);
                    index = index.concat(nodeEntries[module].info.sets[s].types)
                }
            }
            nodeEntries[module].index = index.join(",").toLowerCase();

            nodeList.editableList('addItem', nodeEntries[module]);

        } else {
            var moduleInfo = nodeEntries[module].info;
            var nodeEntry = nodeEntries[module].elements;
            if (nodeEntry) {
                var activeTypeCount = 0;
                var typeCount = 0;
                nodeEntries[module].totalUseCount = 0;
                nodeEntries[module].setUseCount = {};

                for (var setName in moduleInfo.sets) {
                    if (moduleInfo.sets.hasOwnProperty(setName)) {
                        var inUseCount = 0;
                        var set = moduleInfo.sets[setName];
                        var setElements = nodeEntry.sets[setName];

                        if (set.enabled) {
                            activeTypeCount += set.types.length;
                        }
                        typeCount += set.types.length;
                        for (var i = 0; i < moduleInfo.sets[setName].types.length; i++) {
                            var t = moduleInfo.sets[setName].types[i];
                            inUseCount += (typesInUse[t] || 0);
                            var swatch = setElements.swatches[t];
                            if (set.enabled) {
                                var def = RED.nodes.getType(t);
                                if (def && def.color) {
                                    swatch.css({ background: def.color });
                                    swatch.css({ border: "1px solid " + getContrastingBorder(swatch.css('backgroundColor')) })

                                } else {
                                    swatch.css({ background: "#eee", border: "1px dashed #999" })
                                }
                            } else {
                                swatch.css({ background: "#eee", border: "1px dashed #999" })
                            }
                        }
                        nodeEntries[module].setUseCount[setName] = inUseCount;
                        nodeEntries[module].totalUseCount += inUseCount;

                        if (inUseCount > 0) {
                            setElements.enableButton.html(RED._('palette.editor.inuse'));
                            setElements.enableButton.addClass('disabled');
                        } else {
                            setElements.enableButton.removeClass('disabled');
                            if (set.enabled) {
                                setElements.enableButton.html(RED._('palette.editor.disable'));
                            } else {
                                setElements.enableButton.html(RED._('palette.editor.enable'));
                            }
                        }
                        setElements.setRow.toggleClass("palette-module-set-disabled", !set.enabled);
                    }
                }
                var nodeCount = (activeTypeCount === typeCount) ? typeCount : activeTypeCount + " / " + typeCount;
                nodeEntry.setCount.html(RED._('palette.editor.nodeCount', { count: typeCount, label: nodeCount }));

                if (nodeEntries[module].totalUseCount > 0) {
                    nodeEntry.enableButton.html(RED._('palette.editor.inuse'));
                    nodeEntry.enableButton.addClass('disabled');
                    nodeEntry.removeButton.hide();
                } else {
                    nodeEntry.enableButton.removeClass('disabled');
                    if (moduleInfo.local) {
                        nodeEntry.removeButton.attr("style", "display: block !important");
                    }
                    if (activeTypeCount === 0) {
                        nodeEntry.enableButton.html(RED._('palette.editor.enableall'));
                    } else {
                        nodeEntry.enableButton.html(RED._('palette.editor.disableall'));
                    }
                    nodeEntry.container.toggleClass("disabled", (activeTypeCount === 0));
                }
            }

            nodeEntry.updateButton.hide();
        }

    }
    function showPaletteEditor() {
        if (RED.settings.theme('palette.editable') === false) {
            return;
        }
        if (disabled) {
            return;
        }

        initInstallTab();
        $("#header-shade").attr("style", "display: block !important");
        $("#editor-shade").attr("style", "display: block !important");
        $("#sidebar-shade").attr("style", "display: block !important");
        $("#sidebar-separator").hide();

        editorTabs.activateTab('nodes');

        $("#main-container").addClass("palette-expanded");
        setTimeout(function () {
            editorTabs.resize();
            filterInput.focus();
        }, 250);
        RED.events.emit("palette-editor:open");
        RED.keyboard.add("*", "escape", function () { hidePaletteEditor() });
    }
    function hidePaletteEditor() {
        RED.keyboard.remove("escape");
        $("#main-container").removeClass("palette-expanded");
        $("#header-shade").hide();
        $("#editor-shade").hide();
        $("#sidebar-shade").hide();
        $("#sidebar-separator").attr("style", "display: block !important");
        $("#palette-editor").find('.expanded').each(function (i, el) {
            $(el).find(".palette-module-content").slideUp();
            $(el).removeClass('expanded');
        });
        filterInput.searchBox('value', "");
        searchInput.searchBox('value', "");
        RED.events.emit("palette-editor:close");

    }

    function filterChange(val) {
        activeFilter = val.toLowerCase();
        var visible = nodeList.editableList('filter');
        var size = nodeList.editableList('length');
        if (val === "") {
            filterInput.searchBox('count');
        } else {
            filterInput.searchBox('count', visible + " / " + size);
        }
    }


    var catalogueCount;
    var catalogueLoadStatus = [];
    var catalogueLoadStart;
    var catalogueLoadErrors = false;

    var activeSort = sortModulesAZ;

    function handleCatalogResponse(err, catalog, index, v) {
        catalogueLoadStatus.push(err || v);
        if (!err) {
            if (v.modules) {
                v.modules.forEach(function (m) {
                    loadedIndex[m.id] = m;
                    m.index = [m.id];
                    if (m.keywords) {
                        m.index = m.index.concat(m.keywords);
                    }
                    if (m.updated_at) {
                        m.timestamp = new Date(m.updated_at).getTime();
                    } else {
                        m.timestamp = 0;
                    }
                    m.index = m.index.join(",").toLowerCase();
                })
                loadedList = loadedList.concat(v.modules);
            }
            searchInput.searchBox('count', loadedList.length);
        } else {
            catalogueLoadErrors = true;
        }
        if (catalogueCount > 1) {
            $(".palette-module-shade-status").html(RED._('palette.editor.loading') + "<br>" + catalogueLoadStatus.length + "/" + catalogueCount);
        }
        if (catalogueLoadStatus.length === catalogueCount) {
            if (catalogueLoadErrors) {
                RED.notify(RED._('palette.editor.errors.catalogLoadFailed', { url: catalog }), "error", false, 8000);
            }
            var delta = 250 - (Date.now() - catalogueLoadStart);
            setTimeout(function () {
                $("#palette-module-install-shade").hide();
            }, Math.max(delta, 0));

        }
    }

    function initInstallTab() {
        if (loadedList.length === 0) {
            loadedList = [];
            loadedIndex = {};
            packageList.editableList('empty');
            $(".palette-module-shade-status").html(RED._('palette.editor.loading'));
            var catalogues = RED.settings.theme('palette.catalogues') || ['https://catalogue.nodered.org/catalogue.json'];
            catalogueLoadStatus = [];
            catalogueLoadErrors = false;
            catalogueCount = catalogues.length;
            if (catalogues.length > 1) {
                $(".palette-module-shade-status").html(RED._('palette.editor.loading') + "<br>0/" + catalogues.length);
            }
            $("#palette-module-install-shade").attr("style", "display: block !important");
            catalogueLoadStart = Date.now();
            catalogues.forEach(function (catalog, index) {
                $.getJSON(catalog, { _: new Date().getTime() }, function (v) {
                    handleCatalogResponse(null, catalog, index, v);
                    refreshNodeModuleList();
                }).fail(function (jqxhr, textStatus, error) {
                    handleCatalogResponse(jqxhr, catalog, index);
                })
            });
        }
    }

    function refreshFilteredItems() {
        packageList.editableList('empty');
        filteredList.sort(activeSort);
        for (var i = 0; i < Math.min(10, filteredList.length); i++) {
            packageList.editableList('addItem', filteredList[i]);
        }
        if (filteredList.length === 0) {
            packageList.editableList('addItem', {});
        }

        if (filteredList.length > 10) {
            packageList.editableList('addItem', { start: 10, more: filteredList.length - 10 })
        }
    }
    function sortModulesAZ(A, B) {
        return A.info.id.localeCompare(B.info.id);
    }
    function sortModulesRecent(A, B) {
        return -1 * (A.info.timestamp - B.info.timestamp);
    }

    function init() {
        if (RED.settings.theme('palette.editable') === false) {
            return;
        }

        RED.events.on("editor:open", function () { disabled = true; });
        RED.events.on("editor:close", function () { disabled = false; });
        RED.events.on("search:open", function () { disabled = true; });
        RED.events.on("search:close", function () { disabled = false; });
        RED.events.on("type-search:open", function () { disabled = true; });
        RED.events.on("type-search:close", function () { disabled = false; });

        RED.actions.add("core:manage-palette", RED.palette.editor.show);

        editorTabs = RED.tabs.create({
            id: "palette-editor-tabs",
            onchange: function (tab) {
                $("#palette-editor .palette-editor-tab").hide();
                tab.content.attr("style", "display: block !important");
                if (filterInput) {
                    filterInput.searchBox('value', "");
                }
                if (searchInput) {
                    searchInput.searchBox('value', "");
                }
                if (tab.id === 'install') {
                    if (searchInput) {
                        searchInput.focus();
                    }
                } else {
                    if (filterInput) {
                        filterInput.focus();
                    }
                }
            },
            minimumActiveTabWidth: 110
        });


        $("#editor-shade").click(function () {
            if ($("#main-container").hasClass("palette-expanded")) {
                hidePaletteEditor();
            }
        });

        $("#palette-editor-close").on("click", function (e) {
            hidePaletteEditor();
        })

        var modulesTab = $('<div>', { class: "palette-editor-tab" }).appendTo("#palette-editor");

        editorTabs.addTab({
            id: 'nodes',
            label: RED._('palette.editor.tab-nodes'),
            content: modulesTab
        })

        var filterDiv = $('<div>', { class: "palette-search" }).appendTo(modulesTab);
        filterInput = $('<input type="text" data-i18n="[placeholder]palette.filter"></input>')
            .appendTo(filterDiv)
            .searchBox({
                delay: 200,
                change: function () {
                    filterChange($(this).val());
                }
            });


        nodeList = $('<ol>', { id: "palette-module-list", style: "position: absolute;top: 35px;bottom: 0;left: 0;right: 0px;" }).appendTo(modulesTab).editableList({
            addButton: false,
            scrollOnAdd: false,
            sort: function (A, B) {
                return A.info.name.localeCompare(B.info.name);
            },
            filter: function (data) {
                if (activeFilter === "") {
                    return true;
                }

                return (activeFilter === "") || (data.index.indexOf(activeFilter) > -1);
            },
            addItem: function (container, i, object) {
                var entry = object.info;
                if (entry) {
                    var headerRow = $('<div>', { class: "palette-module-header" }).appendTo(container);
                    var titleRow = $('<div class="palette-module-meta palette-module-name"><i class="fa fa-cube"></i></div>').appendTo(headerRow);
                    $('<span>').html(entry.name).appendTo(titleRow);
                    var metaRow = $('<div class="palette-module-meta palette-module-version"><i class="fa fa-tag"></i></div>').appendTo(headerRow);
                    $('<span>').html(entry.version).appendTo(metaRow);
                    var buttonRow = $('<div>', { class: "palette-module-meta" }).appendTo(headerRow);
                    var setButton = $('<a href="#" class="editor-button editor-button-small palette-module-set-button"><i class="fa fa-angle-right palette-module-node-chevron"></i> </a>').appendTo(buttonRow);
                    var setCount = $('<span>').appendTo(setButton);
                    var buttonGroup = $('<div>', { class: "palette-module-button-group" }).appendTo(buttonRow);

                    var updateButton = $('<a href="#" class="editor-button editor-button-small"></a>').html(RED._('palette.editor.update')).appendTo(buttonGroup);
                    updateButton.click(function (evt) {
                        evt.preventDefault();
                    })


                    var removeButton = $('<a href="#" class="editor-button editor-button-small"></a>').html(RED._('palette.editor.remove')).appendTo(buttonGroup);
                    removeButton.click(function (evt) {
                        evt.preventDefault();

                        $("#palette-module-install-confirm").data('module', entry.name);
                        $("#palette-module-install-confirm").data('shade', shade);
                        $("#palette-module-install-confirm-body").html(RED._("palette.editor.confirm.remove.body"));
                        $(".palette-module-install-confirm-button-install").hide();
                        $(".palette-module-install-confirm-button-remove").attr("style", "display: block !important");
                        $("#palette-module-install-confirm")
                            .dialog('option', 'title', RED._("palette.editor.confirm.remove.title"))
                            .dialog('open');
                    })
                    if (!entry.local) {
                        removeButton.hide();
                    }
                    var enableButton = $('<a href="#" class="editor-button editor-button-small"></a>').html(RED._('palette.editor.disableall')).appendTo(buttonGroup);

                    var contentRow = $('<div>', { class: "palette-module-content" }).appendTo(container);
                    var shade = $('<div class="palette-module-shade hide"><img src="mashupflows/red/images/spin.svg" class="palette-spinner"/></div>').appendTo(container);

                    object.elements = {
                        updateButton: updateButton,
                        removeButton: removeButton,
                        enableButton: enableButton,
                        setCount: setCount,
                        container: container,
                        shade: shade,
                        sets: {}
                    }
                    setButton.click(function (evt) {
                        evt.preventDefault();
                        if (container.hasClass('expanded')) {
                            container.removeClass('expanded');
                            contentRow.slideUp();
                        } else {
                            container.addClass('expanded');
                            contentRow.slideDown();
                        }
                    })

                    var setList = Object.keys(entry.sets)
                    setList.sort(function (A, B) {
                        return A.toLowerCase().localeCompare(B.toLowerCase());
                    });
                    setList.forEach(function (setName) {
                        var set = entry.sets[setName];
                        var setRow = $('<div>', { class: "palette-module-set" }).appendTo(contentRow);
                        var buttonGroup = $('<div>', { class: "palette-module-set-button-group" }).appendTo(setRow);
                        var typeSwatches = {};
                        set.types.forEach(function (t) {
                            var typeDiv = $('<div>', { class: "palette-module-type" }).appendTo(setRow);
                            typeSwatches[t] = $('<span>', { class: "palette-module-type-swatch" }).appendTo(typeDiv);
                            $('<span>', { class: "palette-module-type-node" }).html(t).appendTo(typeDiv);
                        })

                        var enableButton = $('<a href="#" class="editor-button editor-button-small"></a>').appendTo(buttonGroup);
                        enableButton.click(function (evt) {
                            evt.preventDefault();
                            if (object.setUseCount[setName] === 0) {
                                var currentSet = RED.nodes.registry.getNodeSet(set.id);
                                shade.attr("style", "display: block !important");
                                changeNodeState(set.id, !currentSet.enabled, shade, function (xhr) {
                                    console.log(xhr)
                                });
                            }
                        })

                        object.elements.sets[set.name] = {
                            setRow: setRow,
                            enableButton: enableButton,
                            swatches: typeSwatches
                        };
                    });
                    enableButton.click(function (evt) {
                        evt.preventDefault();
                        if (object.totalUseCount === 0) {
                            changeNodeState(entry.name, (container.hasClass('disabled')), shade, function (xhr) {
                                console.log(xhr)
                            });
                        }
                    })
                    refreshNodeModule(entry.name);
                } else {
                    $('<div>', { class: "red-ui-search-empty" }).html(RED._('search.empty')).appendTo(container);
                }
            }
        });



        var installTab = $('<div>', { class: "palette-editor-tab hide" }).appendTo("#palette-editor");

        editorTabs.addTab({
            id: 'install',
            label: RED._('palette.editor.tab-install'),
            content: installTab
        })

        var toolBar = $('<div>', { class: "palette-editor-toolbar" }).appendTo(installTab);

        var searchDiv = $('<div>', { class: "palette-search" }).appendTo(installTab);
        searchInput = $('<input type="text" data-i18n="[placeholder]palette.search"></input>')
            .appendTo(searchDiv)
            .searchBox({
                delay: 300,
                change: function () {
                    var searchTerm = $(this).val().toLowerCase();
                    if (searchTerm.length > 0) {
                        filteredList = loadedList.filter(function (m) {
                            return (m.index.indexOf(searchTerm) > -1);
                        }).map(function (f) { return { info: f } });
                        refreshFilteredItems();
                        searchInput.searchBox('count', filteredList.length + " / " + loadedList.length);
                    } else {
                        searchInput.searchBox('count', loadedList.length);
                        packageList.editableList('empty');
                    }
                }
            });


        $('<span>').html(RED._("palette.editor.sort") + ' ').appendTo(toolBar);
        var sortGroup = $('<span class="button-group"></span>').appendTo(toolBar);
        var sortAZ = $('<a href="#" class="sidebar-header-button-toggle selected" data-i18n="palette.editor.sortAZ"></a>').appendTo(sortGroup);
        var sortRecent = $('<a href="#" class="sidebar-header-button-toggle" data-i18n="palette.editor.sortRecent"></a>').appendTo(sortGroup);

        sortAZ.click(function (e) {
            e.preventDefault();
            if ($(this).hasClass("selected")) {
                return;
            }
            $(this).addClass("selected");
            sortRecent.removeClass("selected");
            activeSort = sortModulesAZ;
            refreshFilteredItems();
        });

        sortRecent.click(function (e) {
            e.preventDefault();
            if ($(this).hasClass("selected")) {
                return;
            }
            $(this).addClass("selected");
            sortAZ.removeClass("selected");
            activeSort = sortModulesRecent;
            refreshFilteredItems();
        });


        var refreshSpan = $('<span>').appendTo(toolBar);
        var refreshButton = $('<a href="#" class="sidebar-header-button"><i class="fa fa-refresh"></i></a>').appendTo(refreshSpan);
        refreshButton.click(function (e) {
            e.preventDefault();
            loadedList = [];
            loadedIndex = {};
            initInstallTab();
        })

        packageList = $('<ol>', { style: "position: absolute;top: 78px;bottom: 0;left: 0;right: 0px;" }).appendTo(installTab).editableList({
            addButton: false,
            scrollOnAdd: false,
            addItem: function (container, i, object) {

                if (object.more) {
                    container.addClass('palette-module-more');
                    var moreRow = $('<div>', { class: "palette-module-header palette-module" }).appendTo(container);
                    var moreLink = $('<a href="#"></a>').html(RED._('palette.editor.more', { count: object.more })).appendTo(moreRow);
                    moreLink.click(function (e) {
                        e.preventDefault();
                        packageList.editableList('removeItem', object);
                        for (var i = object.start; i < Math.min(object.start + 10, object.start + object.more); i++) {
                            packageList.editableList('addItem', filteredList[i]);
                        }
                        if (object.more > 10) {
                            packageList.editableList('addItem', { start: object.start + 10, more: object.more - 10 })
                        }
                    })
                    return;
                }
                if (object.info) {
                    var entry = object.info;
                    var headerRow = $('<div>', { class: "palette-module-header" }).appendTo(container);
                    var titleRow = $('<div class="palette-module-meta"><i class="fa fa-cube"></i></div>').appendTo(headerRow);
                    $('<span>', { class: "palette-module-name" }).html(entry.name || entry.id).appendTo(titleRow);
                    $('<a target="_blank" class="palette-module-link"><i class="fa fa-external-link"></i></a>').attr('href', entry.url).appendTo(titleRow);
                    var descRow = $('<div class="palette-module-meta"></div>').appendTo(headerRow);
                    $('<div>', { class: "palette-module-description" }).html(entry.description).appendTo(descRow);

                    var metaRow = $('<div class="palette-module-meta"></div>').appendTo(headerRow);
                    $('<span class="palette-module-version"><i class="fa fa-tag"></i> ' + entry.version + '</span>').appendTo(metaRow);
                    $('<span class="palette-module-updated"><i class="fa fa-calendar"></i> ' + formatUpdatedAt(entry.updated_at) + '</span>').appendTo(metaRow);
                    var buttonRow = $('<div>', { class: "palette-module-meta" }).appendTo(headerRow);
                    var buttonGroup = $('<div>', { class: "palette-module-button-group" }).appendTo(buttonRow);
                    var shade = $('<div class="palette-module-shade hide"><img src="mashupflows/red/images/spin.svg" class="palette-spinner"/></div>').appendTo(container);
                    var installButton = $('<a href="#" class="editor-button editor-button-small"></a>').html(RED._('palette.editor.install')).appendTo(buttonGroup);
                    installButton.click(function (e) {
                        e.preventDefault();
                        if (!$(this).hasClass('disabled')) {
                            $("#palette-module-install-confirm").data('module', entry.id);
                            $("#palette-module-install-confirm").data('url', entry.url);
                            $("#palette-module-install-confirm").data('shade', shade);
                            $("#palette-module-install-confirm-body").html(RED._("palette.editor.confirm.install.body"));
                            $(".palette-module-install-confirm-button-install").attr("style", "display: block !important");
                            $(".palette-module-install-confirm-button-remove").hide();
                            $("#palette-module-install-confirm")
                                .dialog('option', 'title', RED._("palette.editor.confirm.install.title"))
                                .dialog('open');
                        }
                    })
                    if (nodeEntries.hasOwnProperty(entry.id)) {
                        installButton.addClass('disabled');
                        installButton.html(RED._('palette.editor.installed'));
                    }

                    object.elements = {
                        installButton: installButton
                    }
                } else {
                    $('<div>', { class: "red-ui-search-empty" }).html(RED._('search.empty')).appendTo(container);
                }
            }
        });

        $('<div id="palette-module-install-shade" class="palette-module-shade hide"><div class="palette-module-shade-status"></div><img src="mashupmashup/red/images/spin.svg" class="palette-spinner"/></div>').appendTo(installTab);

        $('<div id="palette-module-install-confirm" class="hide"><form class="form-horizontal"><div id="palette-module-install-confirm-body" class="node-dialog-confirm-row"></div></form></div>').appendTo(document.body);
        $("#palette-module-install-confirm").dialog({
            title: RED._('palette.editor.confirm.title'),
            modal: true,
            autoOpen: false,
            width: 550,
            height: "auto",
            buttons: [
                {
                    text: RED._("common.label.cancel"),
                    click: function () {
                        $(this).dialog("close");
                    }
                },
                {
                    text: RED._("palette.editor.confirm.button.review"),
                    class: "primary palette-module-install-confirm-button-install",
                    click: function () {
                        var url = $(this).data('url');
                        window.open(url);
                    }
                },
                {
                    text: RED._("palette.editor.confirm.button.install"),
                    class: "primary palette-module-install-confirm-button-install",
                    click: function () {
                        var id = $(this).data('module');
                        var shade = $(this).data('shade');
                        installNodeModule(id, shade, function (xhr) {
                            if (xhr) {
                                if (xhr.responseJSON) {
                                    RED.notify(RED._('palette.editor.errors.installFailed', { module: id, message: xhr.responseJSON.message }));
                                }
                            }
                        });
                        $(this).dialog("close");
                    }
                },
                {
                    text: RED._("palette.editor.confirm.button.remove"),
                    class: "primary palette-module-install-confirm-button-remove",
                    click: function () {
                        var id = $(this).data('module');
                        var shade = $(this).data('shade');
                        shade.attr("style", "display: block !important");
                        removeNodeModule(id, function (xhr) {
                            shade.hide();
                            if (xhr) {
                                if (xhr.responseJSON) {
                                    RED.notify(RED._('palette.editor.errors.removeFailed', { module: id, message: xhr.responseJSON.message }));
                                }
                            }
                        })

                        $(this).dialog("close");
                    }
                }
            ]
        })

        RED.events.on('registry:node-set-enabled', function (ns) {
            refreshNodeModule(ns.module);
        });
        RED.events.on('registry:node-set-disabled', function (ns) {
            refreshNodeModule(ns.module);
        });
        RED.events.on('registry:node-type-added', function (nodeType) {
            if (!/^subflow:/.test(nodeType)) {
                var ns = RED.nodes.registry.getNodeSetForType(nodeType);
                refreshNodeModule(ns.module);
            }
        });
        RED.events.on('registry:node-type-removed', function (nodeType) {
            if (!/^subflow:/.test(nodeType)) {
                var ns = RED.nodes.registry.getNodeSetForType(nodeType);
                refreshNodeModule(ns.module);
            }
        });
        RED.events.on('registry:node-set-added', function (ns) {
            refreshNodeModule(ns.module);
            for (var i = 0; i < filteredList.length; i++) {
                if (filteredList[i].info.id === ns.module) {
                    var installButton = filteredList[i].elements.installButton;
                    installButton.addClass('disabled');
                    installButton.html(RED._('palette.editor.installed'));
                    break;
                }
            }
        });
        RED.events.on('registry:node-set-removed', function (ns) {
            var module = RED.nodes.registry.getModule(ns.module);
            if (!module) {
                var entry = nodeEntries[ns.module];
                if (entry) {
                    nodeList.editableList('removeItem', entry);
                    delete nodeEntries[ns.module];
                    for (var i = 0; i < filteredList.length; i++) {
                        if (filteredList[i].info.id === ns.module) {
                            var installButton = filteredList[i].elements.installButton;
                            installButton.removeClass('disabled');
                            installButton.html(RED._('palette.editor.install'));
                            break;
                        }
                    }
                }
            }
        });
        RED.events.on('nodes:add', function (n) {
            if (!/^subflow:/.test(n.type)) {
                typesInUse[n.type] = (typesInUse[n.type] || 0) + 1;
                if (typesInUse[n.type] === 1) {
                    var ns = RED.nodes.registry.getNodeSetForType(n.type);
                    refreshNodeModule(ns.module);
                }
            }
        })
        RED.events.on('nodes:remove', function (n) {
            if (typesInUse.hasOwnProperty(n.type)) {
                typesInUse[n.type]--;
                if (typesInUse[n.type] === 0) {
                    delete typesInUse[n.type];
                    var ns = RED.nodes.registry.getNodeSetForType(n.type);
                    refreshNodeModule(ns.module);
                }
            }
        })


    }

    return {
        init: init,
        show: showPaletteEditor
    }
})();


RED.editor = (function () {

    var editStack = [];
    var editing_node = null;
    var editing_config_node = null;
    var subflowEditor;

    var editTrayWidthCache = {};

    function getCredentialsURL(nodeType, nodeID) {
        var dashedType = nodeType.replace(/\s+/g, '-');
        return 'credentials/' + dashedType + "/" + nodeID;
    }

    /**
     * Validate a node
     * @param node - the node being validated
     * @returns {boolean} whether the node is valid. Sets node.dirty if needed
     */
    function validateNode(node) {
        var oldValue = node.valid;
        var oldChanged = node.changed;
        node.valid = true;
        var subflow;
        var isValid;
        var hasChanged;
        if (node.type.indexOf("subflow:") === 0) {
            subflow = RED.nodes.subflow(node.type.substring(8));
            isValid = subflow.valid;
            hasChanged = subflow.changed;
            if (isValid === undefined) {
                isValid = validateNode(subflow);
                hasChanged = subflow.changed;
            }
            node.valid = isValid;
            node.changed = node.changed || hasChanged;
        } else if (node._def) {
            node.valid = validateNodeProperties(node, node._def.defaults, node);
            if (node._def._creds) {
                node.valid = node.valid && validateNodeProperties(node, node._def.credentials, node._def._creds);
            }
        } else if (node.type == "subflow") {
            var subflowNodes = RED.nodes.filterNodes({ z: node.id });
            for (var i = 0; i < subflowNodes.length; i++) {
                isValid = subflowNodes[i].valid;
                hasChanged = subflowNodes[i].changed;
                if (isValid === undefined) {
                    isValid = validateNode(subflowNodes[i]);
                    hasChanged = subflowNodes[i].changed;
                }
                node.valid = node.valid && isValid;
                node.changed = node.changed || hasChanged;
            }
            var subflowInstances = RED.nodes.filterNodes({ type: "subflow:" + node.id });
            var modifiedTabs = {};
            for (i = 0; i < subflowInstances.length; i++) {
                subflowInstances[i].valid = node.valid;
                subflowInstances[i].changed = subflowInstances[i].changed || node.changed;
                subflowInstances[i].dirty = true;
                modifiedTabs[subflowInstances[i].z] = true;
            }
            Object.keys(modifiedTabs).forEach(function (id) {
                var subflow = RED.nodes.subflow(id);
                if (subflow) {
                    validateNode(subflow);
                }
            });
        }
        if (oldValue !== node.valid || oldChanged !== node.changed) {
            node.dirty = true;
            subflow = RED.nodes.subflow(node.z);
            if (subflow) {
                validateNode(subflow);
            }
        }
        return node.valid;
    }

    /**
     * Validate a node's properties for the given set of property definitions
     * @param node - the node being validated
     * @param definition - the node property definitions (either def.defaults or def.creds)
     * @param properties - the node property values to validate
     * @returns {boolean} whether the node's properties are valid
     */
    function validateNodeProperties(node, definition, properties) {
        var isValid = true;
        for (var prop in definition) {
            if (definition.hasOwnProperty(prop)) {
                if (!validateNodeProperty(node, definition, prop, properties[prop])) {
                    isValid = false;
                }
            }
        }
        return isValid;
    }

    /**
     * Validate a individual node property
     * @param node - the node being validated
     * @param definition - the node property definitions (either def.defaults or def.creds)
     * @param property - the property name being validated
     * @param value - the property value being validated
     * @returns {boolean} whether the node proprty is valid
     */
    function validateNodeProperty(node, definition, property, value) {
        var valid = true;
        if (/^\$\([a-zA-Z_][a-zA-Z0-9_]*\)$/.test(value)) {
            return true;
        }
        if ("required" in definition[property] && definition[property].required) {
            valid = value !== "";
        }
        if (valid && "validate" in definition[property]) {
            try {
                valid = definition[property].validate.call(node, value);
            } catch (err) {
                console.log("Validation error:", node.type, node.id, "property: " + property, "value:", value, err);
            }
        }
        if (valid && definition[property].type && RED.nodes.getType(definition[property].type) && !("validate" in definition[property])) {
            if (!value || value == "_ADD_") {
                valid = definition[property].hasOwnProperty("required") && !definition[property].required;
            } else {
                var configNode = RED.nodes.node(value);
                valid = (configNode !== null && (configNode.valid == null || configNode.valid));
            }
        }
        return valid;
    }


    function validateNodeEditor(node, prefix) {
        for (var prop in node._def.defaults) {
            if (node._def.defaults.hasOwnProperty(prop)) {
                validateNodeEditorProperty(node, node._def.defaults, prop, prefix);
            }
        }
        if (node._def.credentials) {
            for (prop in node._def.credentials) {
                if (node._def.credentials.hasOwnProperty(prop)) {
                    validateNodeEditorProperty(node, node._def.credentials, prop, prefix);
                }
            }
        }
    }
    function validateNodeEditorProperty(node, defaults, property, prefix) {
        var input = $("#" + prefix + "-" + property);
        if (input.length > 0) {
            var value = input.val();
            if (defaults[property].hasOwnProperty("format") && defaults[property].format !== "" && input[0].nodeName === "DIV") {
                value = input.text();
            }
            if (!validateNodeProperty(node, defaults, property, value)) {
                input.addClass("input-error");
            } else {
                input.removeClass("input-error");
            }
        }
    }

    /**
     * Called when the node's properties have changed.
     * Marks the node as dirty and needing a size check.
     * Removes any links to non-existant outputs.
     * @param node - the node that has been updated
     * @param outputMap - (optional) a map of old->new port numbers if wires should be moved
     * @returns {array} the links that were removed due to this update
     */
    function updateNodeProperties(node, outputMap) {
        node.resize = true;
        node.dirty = true;
        var removedLinks = [];
        if (node.ports) {
            if (outputMap) {
                RED.nodes.eachLink(function (l) {
                    if (l.source === node && outputMap.hasOwnProperty(l.sourcePort)) {
                        if (outputMap[l.sourcePort] === -1) {
                            removedLinks.push(l);
                        } else {
                            l.sourcePort = outputMap[l.sourcePort];
                        }
                    }
                });
            }
            if (node.outputs < node.ports.length) {
                while (node.outputs < node.ports.length) {
                    node.ports.pop();
                }
                RED.nodes.eachLink(function (l) {
                    if (l.source === node && l.sourcePort >= node.outputs && removedLinks.indexOf(l) === -1) {
                        removedLinks.push(l);
                    }
                });
            } else if (node.outputs > node.ports.length) {
                while (node.outputs > node.ports.length) {
                    node.ports.push(node.ports.length);
                }
            }
        }
        if (node.inputs === 0) {
            removedLinks.concat(RED.nodes.filterLinks({ target: node }));
        }
        for (var l = 0; l < removedLinks.length; l++) {
            RED.nodes.removeLink(removedLinks[l]);
        }
        return removedLinks;
    }

    /**
     * Create a config-node select box for this property
     * @param node - the node being edited
     * @param property - the name of the field
     * @param type - the type of the config-node
     */
    function prepareConfigNodeSelect(node, property, type, prefix) {
        var input = $("#" + prefix + "-" + property);
        if (input.length === 0) {
            return;
        }
        var newWidth = input.width();
        var attrStyle = input.attr('style');
        var m;
        if ((m = /width\s*:\s*(\d+(%|[a-z]+))/i.exec(attrStyle)) !== null) {
            newWidth = m[1];
        } else {
            newWidth = "70%";
        }
        var outerWrap = $("<div></div>").css({ display: 'inline-block', position: 'relative' });
        var selectWrap = $("<div></div>").css({ position: 'absolute', left: 0, right: '40px' }).appendTo(outerWrap);
        var select = $('<select id="' + prefix + '-' + property + '"></select>').appendTo(selectWrap);

        outerWrap.width(newWidth).height(input.height());
        if (outerWrap.width() === 0) {
            outerWrap.width("70%");
        }
        input.replaceWith(outerWrap);
        // set the style attr directly - using width() on FF causes a value of 114%...
        select.attr('style', "width:100%");
        updateConfigNodeSelect(property, type, node[property], prefix);
        $('<a id="' + prefix + '-lookup-' + property + '" class="editor-button"><i class="fa fa-pencil"></i></a>')
            .css({ position: 'absolute', right: 0, top: 0 })
            .appendTo(outerWrap);
        $('#' + prefix + '-lookup-' + property).click(function (e) {
            showEditConfigNodeDialog(property, type, select.find(":selected").val(), prefix);
            e.preventDefault();
        });
        var label = "";
        var configNode = RED.nodes.node(node[property]);
        var node_def = RED.nodes.getType(type);

        if (configNode && node_def.label) {
            if (typeof node_def.label == "function") {
                try {
                    label = node_def.label.call(configNode);
                } catch (err) {
                    console.log("Definition error: " + node_def.type + ".label", err);
                    label = node_def.type;
                }
            } else {
                label = node_def.label;
            }
        }
        input.val(label);
    }

    /**
     * Create a config-node button for this property
     * @param node - the node being edited
     * @param property - the name of the field
     * @param type - the type of the config-node
     */
    function prepareConfigNodeButton(node, property, type, prefix) {
        var input = $("#" + prefix + "-" + property);
        input.val(node[property]);
        input.attr("type", "hidden");

        var button = $("<a>", { id: prefix + "-edit-" + property, class: "editor-button" });
        input.after(button);

        if (node[property]) {
            button.text(RED._("editor.configEdit"));
        } else {
            button.text(RED._("editor.configAdd"));
        }

        button.click(function (e) {
            showEditConfigNodeDialog(property, type, input.val() || "_ADD_", prefix);
            e.preventDefault();
        });
    }

    /**
     * Populate the editor dialog input field for this property
     * @param node - the node being edited
     * @param property - the name of the field
     * @param prefix - the prefix to use in the input element ids (node-input|node-config-input)
     * @param definition - the definition of the field
     */
    function preparePropertyEditor(node, property, prefix, definition) {
        var input = $("#" + prefix + "-" + property);
        if (input.length === 0) {
            return;
        }
        if (input.attr('type') === "checkbox") {
            input.prop('checked', node[property]);
        }
        else {
            var val = node[property];
            if (val == null) {
                val = "";
            }
            if (definition !== undefined && definition[property].hasOwnProperty("format") && definition[property].format !== "" && input[0].nodeName === "DIV") {
                input.html(RED.text.format.getHtml(val, definition[property].format, {}, false, "en"));
                RED.text.format.attach(input[0], definition[property].format, {}, false, "en");
            } else {
                input.val(val);
                if (input[0].nodeName === 'INPUT' || input[0].nodeName === 'TEXTAREA') {
                    RED.text.bidi.prepareInput(input);
                }
            }
        }
    }

    /**
     * Add an on-change handler to revalidate a node field
     * @param node - the node being edited
     * @param definition - the definition of the node
     * @param property - the name of the field
     * @param prefix - the prefix to use in the input element ids (node-input|node-config-input)
     */
    function attachPropertyChangeHandler(node, definition, property, prefix) {
        var input = $("#" + prefix + "-" + property);
        if (definition !== undefined && "format" in definition[property] && definition[property].format !== "" && input[0].nodeName === "DIV") {
            $("#" + prefix + "-" + property).on('change keyup', function (event, skipValidation) {
                if (!skipValidation) {
                    validateNodeEditor(node, prefix);
                }
            });
        } else {
            $("#" + prefix + "-" + property).change(function (event, skipValidation) {
                if (!skipValidation) {
                    validateNodeEditor(node, prefix);
                }
            });
        }
    }

    /**
     * Assign the value to each credential field
     * @param node
     * @param credDef
     * @param credData
     * @param prefix
     */
    function populateCredentialsInputs(node, credDef, credData, prefix) {
        var cred;
        for (cred in credDef) {
            if (credDef.hasOwnProperty(cred)) {
                if (credDef[cred].type == 'password') {
                    if (credData[cred]) {
                        $('#' + prefix + '-' + cred).val(credData[cred]);
                    } else if (credData['has_' + cred]) {
                        $('#' + prefix + '-' + cred).val('__PWRD__');
                    }
                    else {
                        $('#' + prefix + '-' + cred).val('');
                    }
                } else {
                    preparePropertyEditor(credData, cred, prefix, credDef);
                }
                attachPropertyChangeHandler(node, credDef, cred, prefix);
            }
        }
    }

    /**
     * Update the node credentials from the edit form
     * @param node - the node containing the credentials
     * @param credDefinition - definition of the credentials
     * @param prefix - prefix of the input fields
     * @return {boolean} whether anything has changed
     */
    function updateNodeCredentials(node, credDefinition, prefix) {
        var changed = false;
        if (!node.credentials) {
            node.credentials = { _: {} };
        }

        for (var cred in credDefinition) {
            if (credDefinition.hasOwnProperty(cred)) {
                var input = $("#" + prefix + '-' + cred);
                var value = input.val();
                if (credDefinition[cred].type == 'password') {
                    node.credentials['has_' + cred] = (value !== "");
                    if (value == '__PWRD__') {
                        continue;
                    }
                    changed = true;

                }
                node.credentials[cred] = value;
                if (value != node.credentials._[cred]) {
                    changed = true;
                }
            }
        }
        return changed;
    }

    /**
     * Prepare all of the editor dialog fields
     * @param node - the node being edited
     * @param definition - the node definition
     * @param prefix - the prefix to use in the input element ids (node-input|node-config-input)
     */
    function prepareEditDialog(node, definition, prefix, done) {
        for (var d in definition.defaults) {
            if (definition.defaults.hasOwnProperty(d)) {
                if (definition.defaults[d].type) {
                    var configTypeDef = RED.nodes.getType(definition.defaults[d].type);
                    if (configTypeDef) {
                        if (configTypeDef.exclusive) {
                            prepareConfigNodeButton(node, d, definition.defaults[d].type, prefix);
                        } else {
                            prepareConfigNodeSelect(node, d, definition.defaults[d].type, prefix);
                        }
                    } else {
                        console.log("Unknown type:", definition.defaults[d].type);
                        preparePropertyEditor(node, d, prefix, definition.defaults);
                    }
                } else {
                    preparePropertyEditor(node, d, prefix, definition.defaults);
                }
                attachPropertyChangeHandler(node, definition.defaults, d, prefix);
            }
        }
        var completePrepare = function () {
            if (definition.oneditprepare) {
                try {
                    definition.oneditprepare.call(node);
                } catch (err) {
                    console.log("oneditprepare", node.id, node.type, err.toString());
                }
            }
            // Now invoke any change handlers added to the fields - passing true
            // to prevent full node validation from being triggered each time
            for (var d in definition.defaults) {
                if (definition.defaults.hasOwnProperty(d)) {
                    $("#" + prefix + "-" + d).trigger("change", [true]);
                }
            }
            if (definition.credentials) {
                for (d in definition.credentials) {
                    if (definition.credentials.hasOwnProperty(d)) {
                        $("#" + prefix + "-" + d).trigger("change", [true]);
                    }
                }
            }
            validateNodeEditor(node, prefix);
            if (done) {
                done();
            }
        }

        if (definition.credentials) {
            if (node.credentials) {
                populateCredentialsInputs(node, definition.credentials, node.credentials, prefix);
                completePrepare();
            } else {
                $.getJSON(getCredentialsURL(node.type, node.id), function (data) {
                    node.credentials = data;
                    node.credentials._ = $.extend(true, {}, data);
                    populateCredentialsInputs(node, definition.credentials, node.credentials, prefix);
                    completePrepare();
                });
            }
        } else {
            completePrepare();
        }
    }

    function getEditStackTitle() {
        var title = '<ul class="editor-tray-breadcrumbs">';
        for (var i = 0; i < editStack.length; i++) {
            var node = editStack[i];
            var label = node.type;
            if (node.type === '_expression') {
                label = "Expression editor";
            } else if (node.type === 'subflow') {
                label = RED._("subflow.editSubflow", { name: node.name })
            } else if (node.type.indexOf("subflow:") === 0) {
                var subflow = RED.nodes.subflow(node.type.substring(8));
                label = RED._("subflow.editSubflow", { name: subflow.name })
            } else {
                if (typeof node._def.paletteLabel !== "undefined") {
                    try {
                        label = (typeof node._def.paletteLabel === "function" ? node._def.paletteLabel.call(node._def) : node._def.paletteLabel) || "";
                    } catch (err) {
                        console.log("Definition error: " + node.type + ".paletteLabel", err);
                    }
                }
                if (i === editStack.length - 1) {
                    if (RED.nodes.node(node.id)) {
                        label = RED._("editor.editNode", { type: label });
                    } else {
                        label = RED._("editor.addNewConfig", { type: label });
                    }
                }
            }
            title += '<li>' + label + '</li>';
        }
        title += '</ul>';
        return title;
    }

    function buildEditForm(tray, formId, type, ns) {
        var trayBody = tray.find('.editor-tray-body');
        var dialogForm = $('<form id="' + formId + '" class="form-horizontal" autocomplete="off"></form>').appendTo(trayBody);
        dialogForm.html($("script[data-template-name='" + type + "']").html());
        ns = ns || "node-red";
        dialogForm.find('[data-i18n]').each(function () {
            var current = $(this).attr("data-i18n");
            var keys = current.split(";");
            for (var i = 0; i < keys.length; i++) {
                var key = keys[i];
                if (key.indexOf(":") === -1) {
                    var prefix = "";
                    if (key.indexOf("[") === 0) {
                        var parts = key.split("]");
                        prefix = parts[0] + "]";
                        key = parts[1];
                    }
                    keys[i] = prefix + ns + ":" + key;
                }
            }
            $(this).attr("data-i18n", keys.join(";"));
        });
        // Add dummy fields to prevent 'Enter' submitting the form in some
        // cases, and also prevent browser auto-fill of password
        // Add in reverse order as they are prepended...
        $('<input type="password" style="display: none;" />').prependTo(dialogForm);
        $('<input type="text" style="display: none;" />').prependTo(dialogForm);
        dialogForm.submit(function (e) { e.preventDefault(); });
        return dialogForm;
    }

    function showEditDialog(node) {
        var editing_node = node;
        editStack.push(node);
        RED.view.state(RED.state.EDITING);
        var type = node.type;
        if (node.type.substring(0, 8) == "subflow:") {
            type = "subflow";
        }
        var trayOptions = {
            title: getEditStackTitle(),
            buttons: [
                {
                    id: "node-dialog-delete",
                    class: 'leftButton',
                    text: RED._("common.label.delete"),
                    click: function () {
                        var startDirty = RED.nodes.dirty();
                        var removedNodes = [];
                        var removedLinks = [];
                        var removedEntities = RED.nodes.remove(editing_node.id);
                        removedNodes.push(editing_node);
                        removedNodes = removedNodes.concat(removedEntities.nodes);
                        removedLinks = removedLinks.concat(removedEntities.links);

                        var historyEvent = {
                            t: 'delete',
                            nodes: removedNodes,
                            links: removedLinks,
                            changes: {},
                            dirty: startDirty
                        }

                        RED.nodes.dirty(true);
                        RED.view.redraw(true);
                        RED.history.push(historyEvent);
                        RED.tray.close();
                    }
                },
                {
                    id: "node-dialog-cancel",
                    text: RED._("common.label.cancel"),
                    click: function () {
                        if (editing_node._def) {
                            if (editing_node._def.oneditcancel) {
                                try {
                                    editing_node._def.oneditcancel.call(editing_node);
                                } catch (err) {
                                    console.log("oneditcancel", editing_node.id, editing_node.type, err.toString());
                                }
                            }

                            for (var d in editing_node._def.defaults) {
                                if (editing_node._def.defaults.hasOwnProperty(d)) {
                                    var def = editing_node._def.defaults[d];
                                    if (def.type) {
                                        var configTypeDef = RED.nodes.getType(def.type);
                                        if (configTypeDef && configTypeDef.exclusive) {
                                            var input = $("#node-input-" + d).val() || "";
                                            if (input !== "" && !editing_node[d]) {
                                                // This node has an exclusive config node that
                                                // has just been added. As the user is cancelling
                                                // the edit, need to delete the just-added config
                                                // node so that it doesn't get orphaned.
                                                RED.nodes.remove(input);
                                            }
                                        }
                                    }
                                }

                            }
                        }
                        RED.tray.close();
                    }
                },
                {
                    id: "node-dialog-ok",
                    text: RED._("common.label.done"),
                    class: "primary",
                    click: function () {
                        var changes = {};
                        var changed = false;
                        var wasDirty = RED.nodes.dirty();
                        var d;
                        var outputMap;

                        if (editing_node._def.oneditsave) {
                            var oldValues = {};
                            for (d in editing_node._def.defaults) {
                                if (editing_node._def.defaults.hasOwnProperty(d)) {
                                    if (typeof editing_node[d] === "string" || typeof editing_node[d] === "number") {
                                        oldValues[d] = editing_node[d];
                                    } else {
                                        oldValues[d] = $.extend(true, {}, { v: editing_node[d] }).v;
                                    }
                                }
                            }
                            try {
                                var rc = editing_node._def.oneditsave.call(editing_node);
                                if (rc === true) {
                                    changed = true;
                                }
                            } catch (err) {
                                console.log("oneditsave", editing_node.id, editing_node.type, err.toString());
                            }

                            for (d in editing_node._def.defaults) {
                                if (editing_node._def.defaults.hasOwnProperty(d)) {
                                    if (oldValues[d] === null || typeof oldValues[d] === "string" || typeof oldValues[d] === "number") {
                                        if (oldValues[d] !== editing_node[d]) {
                                            changes[d] = oldValues[d];
                                            changed = true;
                                        }
                                    } else {
                                        if (JSON.stringify(oldValues[d]) !== JSON.stringify(editing_node[d])) {
                                            changes[d] = oldValues[d];
                                            changed = true;
                                        }
                                    }
                                }
                            }
                        }

                        if (editing_node._def.defaults) {
                            for (d in editing_node._def.defaults) {
                                if (editing_node._def.defaults.hasOwnProperty(d)) {
                                    var input = $("#node-input-" + d);
                                    var newValue;
                                    if (input.attr('type') === "checkbox") {
                                        newValue = input.prop('checked');
                                    } else if ("format" in editing_node._def.defaults[d] && editing_node._def.defaults[d].format !== "" && input[0].nodeName === "DIV") {
                                        newValue = input.text();
                                    } else {
                                        newValue = input.val();
                                    }
                                    if (newValue != null) {
                                        if (d === "outputs" && (newValue.trim() === "" || isNaN(newValue))) {
                                            continue;
                                        }
                                        if (editing_node[d] != newValue) {
                                            if (editing_node._def.defaults[d].type) {
                                                if (newValue == "_ADD_") {
                                                    newValue = "";
                                                }
                                                // Change to a related config node
                                                var configNode = RED.nodes.node(editing_node[d]);
                                                if (configNode) {
                                                    var users = configNode.users;
                                                    users.splice(users.indexOf(editing_node), 1);
                                                }
                                                configNode = RED.nodes.node(newValue);
                                                if (configNode) {
                                                    configNode.users.push(editing_node);
                                                }
                                            }
                                            changes[d] = editing_node[d];
                                            editing_node[d] = newValue;
                                            changed = true;
                                        }
                                    }
                                }
                            }
                        }
                        if (editing_node._def.credentials) {
                            var prefix = 'node-input';
                            var credDefinition = editing_node._def.credentials;
                            var credsChanged = updateNodeCredentials(editing_node, credDefinition, prefix);
                            changed = changed || credsChanged;
                        }
                        if (editing_node.hasOwnProperty("_outputs")) {
                            outputMap = editing_node._outputs;
                            delete editing_node._outputs;
                            if (Object.keys(outputMap).length > 0) {
                                changed = true;
                            }
                        }
                        var removedLinks = updateNodeProperties(editing_node, outputMap);
                        if (changed) {
                            var wasChanged = editing_node.changed;
                            editing_node.changed = true;
                            RED.nodes.dirty(true);

                            var activeSubflow = RED.nodes.subflow(RED.workspaces.active());
                            var subflowInstances = null;
                            if (activeSubflow) {
                                subflowInstances = [];
                                RED.nodes.eachNode(function (n) {
                                    if (n.type == "subflow:" + RED.workspaces.active()) {
                                        subflowInstances.push({
                                            id: n.id,
                                            changed: n.changed
                                        });
                                        n.changed = true;
                                        n.dirty = true;
                                        updateNodeProperties(n);
                                    }
                                });
                            }
                            var historyEvent = {
                                t: 'edit',
                                node: editing_node,
                                changes: changes,
                                links: removedLinks,
                                dirty: wasDirty,
                                changed: wasChanged
                            };
                            if (outputMap) {
                                historyEvent.outputMap = outputMap;
                            }
                            if (subflowInstances) {
                                historyEvent.subflow = {
                                    instances: subflowInstances
                                }
                            }
                            RED.history.push(historyEvent);
                        }
                        editing_node.dirty = true;
                        validateNode(editing_node);
                        RED.events.emit("editor:save", editing_node);
                        RED.tray.close();
                    }
                }
            ],
            resize: function (dimensions) {
                editTrayWidthCache[type] = dimensions.width;
                if (editing_node && editing_node._def.oneditresize) {
                    var form = $("#dialog-form");
                    try {
                        editing_node._def.oneditresize.call(editing_node, { width: form.width(), height: form.height() });
                    } catch (err) {
                        console.log("oneditresize", editing_node.id, editing_node.type, err.toString());
                    }
                }
            },
            open: function (tray, done) {
                if (editing_node) {
                    // RED.sidebar.info.refresh(editing_node);
                }
                var ns;
                if (node._def.set.module === "node-red") {
                    ns = "node-red";
                } else {
                    ns = node._def.set.id;
                }
                var dialogForm = buildEditForm(tray, "dialog-form", type, ns);
                prepareEditDialog(node, node._def, "node-input", function () {
                    dialogForm.i18n();
                    done();
                });

            },
            close: function () {
                if (RED.view.state() != RED.state.IMPORT_DRAGGING) {
                    RED.view.state(RED.state.DEFAULT);
                }
                if (editing_node) {
                    // RED.sidebar.info.refresh(editing_node);
                }
                RED.workspaces.refresh();
                RED.view.redraw(true);
                editStack.pop();
            },
            show: function () {
                if (editing_node) {
                    // RED.sidebar.info.refresh(editing_node);
                }
            }
        }
        if (editTrayWidthCache.hasOwnProperty(type)) {
            trayOptions.width = editTrayWidthCache[type];
        }

        if (type === 'subflow') {
            var id = editing_node.type.substring(8);
            trayOptions.buttons.unshift({
                class: 'leftButton',
                text: RED._("subflow.edit"),
                click: function () {
                    RED.workspaces.show(id);
                    $("#node-dialog-ok").click();
                }
            });
        }

        RED.tray.show(trayOptions);
    }
    /**
     * name - name of the property that holds this config node
     * type - type of config node
     * id - id of config node to edit. _ADD_ for a new one
     * prefix - the input prefix of the parent property
     */
    function showEditConfigNodeDialog(name, type, id, prefix) {
        var adding = (id == "_ADD_");
        var node_def = RED.nodes.getType(type);
        var editing_config_node = RED.nodes.node(id);

        var ns;
        if (node_def.set.module === "node-red") {
            ns = "node-red";
        } else {
            ns = node_def.set.id;
        }
        var configNodeScope = ""; // default to global
        var activeSubflow = RED.nodes.subflow(RED.workspaces.active());
        if (activeSubflow) {
            configNodeScope = activeSubflow.id;
        }
        if (editing_config_node == null) {
            editing_config_node = {
                id: RED.nodes.id(),
                _def: node_def,
                type: type,
                z: configNodeScope,
                users: []
            }
            for (var d in node_def.defaults) {
                if (node_def.defaults[d].value) {
                    editing_config_node[d] = JSON.parse(JSON.stringify(node_def.defaults[d].value));
                }
            }
            editing_config_node["_"] = node_def._;
        }
        editStack.push(editing_config_node);

        RED.view.state(RED.state.EDITING);
        var trayOptions = {
            title: getEditStackTitle(), //(adding?RED._("editor.addNewConfig", {type:type}):RED._("editor.editConfig", {type:type})),
            resize: function () {
                if (editing_config_node && editing_config_node._def.oneditresize) {
                    var form = $("#node-config-dialog-edit-form");
                    try {
                        editing_config_node._def.oneditresize.call(editing_config_node, { width: form.width(), height: form.height() });
                    } catch (err) {
                        console.log("oneditresize", editing_config_node.id, editing_config_node.type, err.toString());
                    }
                }
            },
            open: function (tray, done) {
                var trayHeader = tray.find(".editor-tray-header");
                var trayFooter = tray.find(".editor-tray-footer");

                if (node_def.hasUsers !== false) {
                    trayFooter.prepend('<div id="node-config-dialog-user-count"><i class="fa fa-info-circle"></i> <span></span></div>');
                }
                trayFooter.append('<span id="node-config-dialog-scope-container"><span id="node-config-dialog-scope-warning" data-i18n="[title]editor.errors.scopeChange"><i class="fa fa-warning"></i></span><select id="node-config-dialog-scope"></select></span>');

                var dialogForm = buildEditForm(tray, "node-config-dialog-edit-form", type, ns);

                prepareEditDialog(editing_config_node, node_def, "node-config-input", function () {
                    if (editing_config_node._def.exclusive) {
                        $("#node-config-dialog-scope").hide();
                    } else {
                        $("#node-config-dialog-scope").attr("style", "display: block !important");
                    }
                    $("#node-config-dialog-scope-warning").hide();

                    var nodeUserFlows = {};
                    editing_config_node.users.forEach(function (n) {
                        nodeUserFlows[n.z] = true;
                    });
                    var flowCount = Object.keys(nodeUserFlows).length;
                    var tabSelect = $("#node-config-dialog-scope").empty();
                    tabSelect.off("change");
                    tabSelect.append('<option value=""' + (!editing_config_node.z ? " selected" : "") + ' data-i18n="sidebar.config.global"></option>');
                    tabSelect.append('<option disabled data-i18n="sidebar.config.flows"></option>');
                    RED.nodes.eachWorkspace(function (ws) {
                        var workspaceLabel = ws.label;
                        if (nodeUserFlows[ws.id]) {
                            workspaceLabel = "* " + workspaceLabel;
                        }
                        tabSelect.append('<option value="' + ws.id + '"' + (ws.id == editing_config_node.z ? " selected" : "") + '>' + workspaceLabel + '</option>');
                    });
                    tabSelect.append('<option disabled data-i18n="sidebar.config.subflows"></option>');
                    RED.nodes.eachSubflow(function (ws) {
                        var workspaceLabel = ws.name;
                        if (nodeUserFlows[ws.id]) {
                            workspaceLabel = "* " + workspaceLabel;
                        }
                        tabSelect.append('<option value="' + ws.id + '"' + (ws.id == editing_config_node.z ? " selected" : "") + '>' + workspaceLabel + '</option>');
                    });
                    if (flowCount > 0) {
                        tabSelect.on('change', function () {
                            var newScope = $(this).val();
                            if (newScope === '') {
                                // global scope - everyone can use it
                                $("#node-config-dialog-scope-warning").hide();
                            } else if (!nodeUserFlows[newScope] || flowCount > 1) {
                                // a user will loose access to it
                                $("#node-config-dialog-scope-warning").attr("style", "display: block !important");
                            } else {
                                $("#node-config-dialog-scope-warning").hide();
                            }
                        });
                    }
                    tabSelect.i18n();

                    dialogForm.i18n();
                    if (node_def.hasUsers !== false) {
                        $("#node-config-dialog-user-count").find("span").html(RED._("editor.nodesUse", { count: editing_config_node.users.length })).parent().attr("style", "display: block !important");
                    }
                    done();
                });
            },
            close: function () {
                RED.workspaces.refresh();
                editStack.pop();
            },
            show: function () {
                if (editing_config_node) {
                    // RED.sidebar.info.refresh(editing_config_node);
                }
            }
        }
        trayOptions.buttons = [
            {
                id: "node-config-dialog-cancel",
                text: RED._("common.label.cancel"),
                click: function () {
                    var configType = type;
                    var configId = editing_config_node.id;
                    var configAdding = adding;
                    var configTypeDef = RED.nodes.getType(configType);

                    if (configTypeDef.oneditcancel) {
                        // TODO: what to pass as this to call
                        if (configTypeDef.oneditcancel) {
                            var cn = RED.nodes.node(configId);
                            if (cn) {
                                try {
                                    configTypeDef.oneditcancel.call(cn, false);
                                } catch (err) {
                                    console.log("oneditcancel", cn.id, cn.type, err.toString());
                                }
                            } else {
                                try {
                                    configTypeDef.oneditcancel.call({ id: configId }, true);
                                } catch (err) {
                                    console.log("oneditcancel", configId, configType, err.toString());
                                }
                            }
                        }
                    }
                    RED.tray.close();
                }
            },
            {
                id: "node-config-dialog-ok",
                text: adding ? RED._("editor.configAdd") : RED._("editor.configUpdate"),
                class: "primary",
                click: function () {
                    var configProperty = name;
                    var configId = editing_config_node.id;
                    var configType = type;
                    var configAdding = adding;
                    var configTypeDef = RED.nodes.getType(configType);
                    var d;
                    var input;
                    var scope = $("#node-config-dialog-scope").val();

                    if (configTypeDef.oneditsave) {
                        try {
                            configTypeDef.oneditsave.call(editing_config_node);
                        } catch (err) {
                            console.log("oneditsave", editing_config_node.id, editing_config_node.type, err.toString());
                        }
                    }

                    for (d in configTypeDef.defaults) {
                        if (configTypeDef.defaults.hasOwnProperty(d)) {
                            var newValue;
                            input = $("#node-config-input-" + d);
                            if (input.attr('type') === "checkbox") {
                                newValue = input.prop('checked');
                            } else if ("format" in configTypeDef.defaults[d] && configTypeDef.defaults[d].format !== "" && input[0].nodeName === "DIV") {
                                newValue = input.text();
                            } else {
                                newValue = input.val();
                            }
                            if (newValue != null && newValue !== editing_config_node[d]) {
                                if (editing_config_node._def.defaults[d].type) {
                                    if (newValue == "_ADD_") {
                                        newValue = "";
                                    }
                                    // Change to a related config node
                                    var configNode = RED.nodes.node(editing_config_node[d]);
                                    if (configNode) {
                                        var users = configNode.users;
                                        users.splice(users.indexOf(editing_config_node), 1);
                                    }
                                    configNode = RED.nodes.node(newValue);
                                    if (configNode) {
                                        configNode.users.push(editing_config_node);
                                    }
                                }
                                editing_config_node[d] = newValue;
                            }
                        }
                    }
                    editing_config_node.label = configTypeDef.label;
                    editing_config_node.z = scope;

                    if (scope) {
                        // Search for nodes that use this one that are no longer
                        // in scope, so must be removed
                        editing_config_node.users = editing_config_node.users.filter(function (n) {
                            var keep = true;
                            for (var d in n._def.defaults) {
                                if (n._def.defaults.hasOwnProperty(d)) {
                                    if (n._def.defaults[d].type === editing_config_node.type &&
                                        n[d] === editing_config_node.id &&
                                        n.z !== scope) {
                                        keep = false;
                                        // Remove the reference to this node
                                        // and revalidate
                                        n[d] = null;
                                        n.dirty = true;
                                        n.changed = true;
                                        validateNode(n);
                                    }
                                }
                            }
                            return keep;
                        });
                    }

                    if (configAdding) {
                        RED.nodes.add(editing_config_node);
                    }

                    if (configTypeDef.credentials) {
                        updateNodeCredentials(editing_config_node, configTypeDef.credentials, "node-config-input");
                    }
                    validateNode(editing_config_node);
                    var validatedNodes = {};
                    validatedNodes[editing_config_node.id] = true;

                    var userStack = editing_config_node.users.slice();
                    while (userStack.length > 0) {
                        var user = userStack.pop();
                        if (!validatedNodes[user.id]) {
                            validatedNodes[user.id] = true;
                            if (user.users) {
                                userStack = userStack.concat(user.users);
                            }
                            validateNode(user);
                        }
                    }
                    RED.nodes.dirty(true);
                    RED.view.redraw(true);
                    if (!configAdding) {
                        RED.events.emit("editor:save", editing_config_node);
                    }
                    RED.tray.close(function () {
                        updateConfigNodeSelect(configProperty, configType, editing_config_node.id, prefix);
                    });
                }
            }
        ];

        if (!adding) {
            trayOptions.buttons.unshift({
                class: 'leftButton',
                text: RED._("editor.configDelete"), //'<i class="fa fa-trash"></i>',
                click: function () {
                    var configProperty = name;
                    var configId = editing_config_node.id;
                    var configType = type;
                    var configTypeDef = RED.nodes.getType(configType);

                    try {

                        if (configTypeDef.ondelete) {
                            // Deprecated: never documented but used by some early nodes
                            console.log("Deprecated API warning: config node type ", configType, " has an ondelete function - should be oneditdelete");
                            configTypeDef.ondelete.call(editing_config_node);
                        }
                        if (configTypeDef.oneditdelete) {
                            configTypeDef.oneditdelete.call(editing_config_node);
                        }
                    } catch (err) {
                        console.log("oneditdelete", editing_config_node.id, editing_config_node.type, err.toString());
                    }

                    var historyEvent = {
                        t: 'delete',
                        nodes: [editing_config_node],
                        changes: {},
                        dirty: RED.nodes.dirty()
                    }
                    for (var i = 0; i < editing_config_node.users.length; i++) {
                        var user = editing_config_node.users[i];
                        historyEvent.changes[user.id] = {
                            changed: user.changed,
                            valid: user.valid
                        };
                        for (var d in user._def.defaults) {
                            if (user._def.defaults.hasOwnProperty(d) && user[d] == configId) {
                                historyEvent.changes[user.id][d] = configId
                                user[d] = "";
                                user.changed = true;
                                user.dirty = true;
                            }
                        }
                        validateNode(user);
                    }
                    RED.nodes.remove(configId);
                    RED.nodes.dirty(true);
                    RED.view.redraw(true);
                    RED.history.push(historyEvent);
                    RED.tray.close(function () {
                        updateConfigNodeSelect(configProperty, configType, "", prefix);
                    });
                }
            });
        }

        RED.tray.show(trayOptions);
    }

    function defaultConfigNodeSort(A, B) {
        if (A.__label__ < B.__label__) {
            return -1;
        } else if (A.__label__ > B.__label__) {
            return 1;
        }
        return 0;
    }

    function updateConfigNodeSelect(name, type, value, prefix) {
        // if prefix is null, there is no config select to update
        if (prefix) {
            var button = $("#" + prefix + "-edit-" + name);
            if (button.length) {
                if (value) {
                    button.text(RED._("editor.configEdit"));
                } else {
                    button.text(RED._("editor.configAdd"));
                }
                $("#" + prefix + "-" + name).val(value);
            } else {

                var select = $("#" + prefix + "-" + name);
                var node_def = RED.nodes.getType(type);
                select.children().remove();

                var activeWorkspace = RED.nodes.workspace(RED.workspaces.active());
                if (!activeWorkspace) {
                    activeWorkspace = RED.nodes.subflow(RED.workspaces.active());
                }

                var configNodes = [];

                RED.nodes.eachConfig(function (config) {
                    if (config.type == type && (!config.z || config.z === activeWorkspace.id)) {
                        var label = "";
                        if (typeof node_def.label == "function") {
                            try {
                                label = node_def.label.call(config);
                            } catch (err) {
                                console.log("Definition error: " + node_def.type + ".label", err);
                                label = node_def.type;
                            }
                        } else {
                            label = node_def.label;
                        }
                        config.__label__ = label;
                        configNodes.push(config);
                    }
                });
                var configSortFn = defaultConfigNodeSort;
                if (typeof node_def.sort == "function") {
                    configSortFn = node_def.sort;
                }
                try {
                    configNodes.sort(configSortFn);
                } catch (err) {
                    console.log("Definition error: " + node_def.type + ".sort", err);
                }

                configNodes.forEach(function (cn) {
                    select.append('<option value="' + cn.id + '"' + (value == cn.id ? " selected" : "") + '>' + RED.text.bidi.enforceTextDirectionWithUCC(cn.__label__) + '</option>');
                    delete cn.__label__;
                });

                select.append('<option value="_ADD_"' + (value === "" ? " selected" : "") + '>' + RED._("editor.addNewType", { type: type }) + '</option>');
                window.setTimeout(function () { select.change(); }, 50);
            }
        }
    }

    function showEditSubflowDialog(subflow) {
        var editing_node = subflow;
        editStack.push(subflow);
        RED.view.state(RED.state.EDITING);
        var subflowEditor;

        var trayOptions = {
            title: getEditStackTitle(),
            buttons: [
                {
                    id: "node-dialog-cancel",
                    text: RED._("common.label.cancel"),
                    click: function () {
                        RED.tray.close();
                    }
                },
                {
                    id: "node-dialog-ok",
                    class: "primary",
                    text: RED._("common.label.done"),
                    click: function () {
                        var i;
                        var changes = {};
                        var changed = false;
                        var wasDirty = RED.nodes.dirty();

                        var newName = $("#subflow-input-name").val();

                        if (newName != editing_node.name) {
                            changes['name'] = editing_node.name;
                            editing_node.name = newName;
                            changed = true;
                        }

                        var newDescription = subflowEditor.getValue();

                        if (newDescription != editing_node.info) {
                            changes['info'] = editing_node.info;
                            editing_node.info = newDescription;
                            changed = true;
                        }

                        RED.palette.refresh();

                        if (changed) {
                            var subflowInstances = [];
                            RED.nodes.eachNode(function (n) {
                                if (n.type == "subflow:" + editing_node.id) {
                                    subflowInstances.push({
                                        id: n.id,
                                        changed: n.changed
                                    })
                                    n.changed = true;
                                    n.dirty = true;
                                    updateNodeProperties(n);
                                }
                            });
                            var wasChanged = editing_node.changed;
                            editing_node.changed = true;
                            RED.nodes.dirty(true);
                            var historyEvent = {
                                t: 'edit',
                                node: editing_node,
                                changes: changes,
                                dirty: wasDirty,
                                changed: wasChanged,
                                subflow: {
                                    instances: subflowInstances
                                }
                            };

                            RED.history.push(historyEvent);
                        }
                        editing_node.dirty = true;
                        RED.tray.close();
                    }
                }
            ],
            resize: function () {
                var rows = $("#dialog-form>div:not(.node-text-editor-row)");
                var editorRow = $("#dialog-form>div.node-text-editor-row");
                var height = $("#dialog-form").height();
                for (var i = 0; i < rows.size(); i++) {
                    height -= $(rows[i]).outerHeight(true);
                }
                height -= (parseInt($("#dialog-form").css("marginTop")) + parseInt($("#dialog-form").css("marginBottom")));
                $(".node-text-editor").css("height", height + "px");
                subflowEditor.resize();
            },
            open: function (tray) {
                if (editing_node) {
                    // RED.sidebar.info.refresh(editing_node);
                }
                var dialogForm = buildEditForm(tray, "dialog-form", "subflow-template");
                subflowEditor = RED.editor.createEditor({
                    id: 'subflow-input-info-editor',
                    mode: 'ace/mode/markdown',
                    value: ""
                });

                $("#subflow-input-name").val(subflow.name);
                RED.text.bidi.prepareInput($("#subflow-input-name"));
                subflowEditor.getSession().setValue(subflow.info || "", -1);
                var userCount = 0;
                var subflowType = "subflow:" + editing_node.id;

                RED.nodes.eachNode(function (n) {
                    if (n.type === subflowType) {
                        userCount++;
                    }
                });
                $("#subflow-dialog-user-count").html(RED._("subflow.subflowInstances", { count: userCount })).attr("style", "display: block !important");
                dialogForm.i18n();
            },
            close: function () {
                if (RED.view.state() != RED.state.IMPORT_DRAGGING) {
                    RED.view.state(RED.state.DEFAULT);
                }
                // RED.sidebar.info.refresh(editing_node);
                RED.workspaces.refresh();
                editStack.pop();
                editing_node = null;
            },
            show: function () {
            }
        }
        RED.tray.show(trayOptions);
    }


    function editExpression(options) {
        var value = options.value;
        var onComplete = options.complete;
        var type = "_expression"
        editStack.push({ type: type });
        RED.view.state(RED.state.EDITING);
        var expressionEditor;

        var trayOptions = {
            title: getEditStackTitle(),
            buttons: [
                {
                    id: "node-dialog-cancel",
                    text: RED._("common.label.cancel"),
                    click: function () {
                        RED.tray.close();
                    }
                },
                {
                    id: "node-dialog-ok",
                    text: RED._("common.label.done"),
                    class: "primary",
                    click: function () {
                        $("#node-input-expression-help").html("");
                        onComplete(expressionEditor.getValue());
                        RED.tray.close();
                    }
                }
            ],
            resize: function (dimensions) {
                editTrayWidthCache[type] = dimensions.width;

                var rows = $("#dialog-form>div:not(.node-text-editor-row)");
                var editorRow = $("#dialog-form>div.node-text-editor-row");
                var height = $("#dialog-form").height();
                for (var i = 0; i < rows.size(); i++) {
                    height -= $(rows[i]).outerHeight(true);
                }
                height -= (parseInt($("#dialog-form").css("marginTop")) + parseInt($("#dialog-form").css("marginBottom")));
                $(".node-text-editor").css("height", height + "px");
                expressionEditor.resize();
            },
            open: function (tray) {
                var trayBody = tray.find('.editor-tray-body');
                var dialogForm = buildEditForm(tray, 'dialog-form', '_expression', 'editor');
                var funcSelect = $("#node-input-expression-func");
                Object.keys(jsonata.functions).forEach(function (f) {
                    funcSelect.append($("<option></option>").val(f).text(f));
                })
                funcSelect.change(function (e) {
                    var f = $(this).val();
                    var args = RED._('jsonata:' + f + ".args", { defaultValue: '' });
                    var title = "<h5>" + f + "(" + args + ")</h5>";
                    var body = marked(RED._('jsonata:' + f + '.desc', { defaultValue: '' }));
                    $("#node-input-expression-help").html(title + "<p>" + body + "</p>");

                })
                expressionEditor = RED.editor.createEditor({
                    id: 'node-input-expression',
                    value: "",
                    mode: "ace/mode/jsonata",
                    options: {
                        enableBasicAutocompletion: true,
                        enableSnippets: true,
                        enableLiveAutocompletion: true
                    }
                });
                var currentToken = null;
                var currentTokenPos = -1;
                var currentFunctionMarker = null;

                expressionEditor.getSession().setValue(value || "", -1);
                expressionEditor.on("changeSelection", function () {
                    var c = expressionEditor.getCursorPosition();
                    var token = expressionEditor.getSession().getTokenAt(c.row, c.column);
                    if (token !== currentToken || (token && /paren/.test(token.type) && c.column !== currentTokenPos)) {
                        currentToken = token;
                        var r, p;
                        var scopedFunction = null;
                        if (token && token.type === 'keyword') {
                            r = c.row;
                            scopedFunction = token;
                        } else {
                            var depth = 0;
                            var next = false;
                            if (token) {
                                if (token.type === 'paren.rparen') {
                                    // If this is a block of parens ')))', set
                                    // depth to offset against the cursor position
                                    // within the block
                                    currentTokenPos = c.column;
                                    depth = c.column - (token.start + token.value.length);
                                }
                                r = c.row;
                                p = token.index;
                            } else {
                                r = c.row - 1;
                                p = -1;
                            }
                            while (scopedFunction === null && r > -1) {
                                var rowTokens = expressionEditor.getSession().getTokens(r);
                                if (p === -1) {
                                    p = rowTokens.length - 1;
                                }
                                while (p > -1) {
                                    var type = rowTokens[p].type;
                                    if (next) {
                                        if (type === 'keyword') {
                                            scopedFunction = rowTokens[p];
                                            // console.log("HIT",scopedFunction);
                                            break;
                                        }
                                        next = false;
                                    }
                                    if (type === 'paren.lparen') {
                                        depth -= rowTokens[p].value.length;
                                    } else if (type === 'paren.rparen') {
                                        depth += rowTokens[p].value.length;
                                    }
                                    if (depth < 0) {
                                        next = true;
                                        depth = 0;
                                    }
                                    // console.log(r,p,depth,next,rowTokens[p]);
                                    p--;
                                }
                                if (!scopedFunction) {
                                    r--;
                                }
                            }
                        }
                        expressionEditor.session.removeMarker(currentFunctionMarker);
                        if (scopedFunction) {
                            //console.log(token,.map(function(t) { return t.type}));
                            funcSelect.val(scopedFunction.value).change();
                        }
                    }
                });

                dialogForm.i18n();
                $("#node-input-expression-func-insert").click(function (e) {
                    e.preventDefault();
                    var pos = expressionEditor.getCursorPosition();
                    var f = funcSelect.val();
                    var snippet = jsonata.getFunctionSnippet(f);
                    expressionEditor.insertSnippet(snippet);
                    expressionEditor.focus();
                })
            },
            close: function () {
                editStack.pop();
            },
            show: function () { }
        }
        if (editTrayWidthCache.hasOwnProperty(type)) {
            trayOptions.width = editTrayWidthCache[type];
        }
        RED.tray.show(trayOptions);
    }

    return {
        init: function () {
            RED.tray.init();
            RED.actions.add("core:confirm-edit-tray", function () {
                $("#node-dialog-ok").click();
                $("#node-config-dialog-ok").click();
            });
            RED.actions.add("core:cancel-edit-tray", function () {
                $("#node-dialog-cancel").click();
                $("#node-config-dialog-cancel").click();
            });
        },
        edit: showEditDialog,
        editConfig: showEditConfigNodeDialog,
        editSubflow: showEditSubflowDialog,
        editExpression: editExpression,
        validateNode: validateNode,
        updateNodeProperties: updateNodeProperties, // TODO: only exposed for edit-undo

        createEditor: function (options) {
            var editor = ace.edit(options.id);
            editor.setTheme("ace/theme/tomorrow");
            var session = editor.getSession();
            if (options.mode) {
                session.setMode(options.mode);
            }
            if (options.foldStyle) {
                session.setFoldStyle(options.foldStyle);
            } else {
                session.setFoldStyle('markbeginend');
            }
            if (options.options) {
                editor.setOptions(options.options);
            } else {
                editor.setOptions({
                    enableBasicAutocompletion: true,
                    enableSnippets: true
                });
            }
            editor.$blockScrolling = Infinity;
            if (options.value) {
                session.setValue(options.value, -1);
            }
            if (options.globals) {
                setTimeout(function () {
                    if (!!session.$worker) {
                        session.$worker.send("setOptions", [{ globals: options.globals, esversion: 6 }]);
                    }
                }, 100);
            }
            return editor;
        }
    }
})();

// Handles node's configuration right-handed sidebar
RED.tray = (function () {

    var stack = [];
    var editorStack = null;
    var openingTray = false;

    function resize() { }

    function showTray(options) {
        var el = $('<div class="editor-tray"></div>');
        var header = $('<div class="editor-tray-header"></div>').appendTo(el);
        var bodyWrapper = $('<div class="editor-tray-body-wrapper"></div>').appendTo(el);
        var body = $('<div class="editor-tray-body"></div>').appendTo(bodyWrapper);
        var footer = $('<div class="editor-tray-footer"></div>').appendTo(el);
        var resizer = $('<div class="editor-tray-resize-handle"></div>').appendTo(el);
        if (options.title) {
            $('<div class="editor-tray-titlebar">' + options.title + '</div>').appendTo(header);
        }
        var buttonBar = $('<div class="editor-tray-toolbar"></div>').appendTo(header);
        var primaryButton;
        if (options.buttons) {
            for (var i = 0; i < options.buttons.length; i++) {
                var button = options.buttons[i];
                var b = $('<button>').button().appendTo(buttonBar);
                if (button.id) {
                    b.attr('id', button.id);
                }
                if (button.text) {
                    b.html(button.text);
                }
                if (button.click) {
                    b.click((function (action) {
                        return function (evt) {
                            if (!$(this).hasClass('disabled')) {
                                action(evt);
                            }
                        };
                    })(button.click));
                }
                if (button.class) {
                    b.addClass(button.class);
                    if (button.class === "primary") {
                        primaryButton = button;
                    }
                }
            }
        }

        el.appendTo(editorStack);
        var tray = {
            tray: el,
            header: header,
            body: body,
            footer: footer,
            options: options,
            primaryButton: primaryButton
        };
        stack.push(tray);

        el.draggable({
            handle: resizer,
            axis: "x",
            start: function (event, ui) {
                el.width('auto');
            },
            drag: function (event, ui) {
                var absolutePosition = editorStack.position().left + ui.position.left
                if (absolutePosition < 7) {
                    ui.position.left += 7 - absolutePosition;
                }
                if (tray.options.resize) {
                    setTimeout(function () {
                        tray.options.resize({ width: -ui.position.left });
                    }, 0);
                }
                tray.width = -ui.position.left;
            },
            stop: function (event, ui) {
                let size = (ui.position.left <= 255) ? 255 : ui.position.left
                el.width(-size);
                el.css({ left: size });
                if (tray.options.resize) {
                    tray.options.resize({ width: -size });
                };
                tray.width = -size;
            }
        });

        function finishBuild() {
            $("#header-shade").attr("style", "display: block !important");
            $("#editor-shade").attr("style", "display: block !important");
            $("#palette-shade").attr("style", "display: block !important");
            $(".sidebar-shade").attr("style", "display: block !important");

            tray.preferredWidth = Math.max(el.width(), 500);
            body.css({ "minWidth": tray.preferredWidth - 40 });

            if (options.width) {
                if (options.width > $("#editor-stack").position().left - 8) {
                    options.width = $("#editor-stack").position().left - 8;
                }
                el.width(options.width);
            } else {
                el.width(tray.preferredWidth);
            }

            tray.width = el.width();
            if (tray.width > $("#editor-stack").position().left - 8) {
                tray.width = Math.max(0/*tray.preferredWidth*/, $("#editor-stack").position().left - 8);
                el.width(tray.width);
            }

            el.css({
                right: -(el.width() + 10) + "px",
                transition: "right 0.15s ease"
            });
            $("#workspace").scrollLeft(0);
            handleWindowResize();
            openingTray = true;
            setTimeout(function () {
                setTimeout(function () {
                    if (!options.width) {
                        el.width(Math.min(tray.preferredWidth, $("#editor-stack").position().left - 8));
                    }
                    if (options.resize) {
                        options.resize({ width: el.width() });
                    }
                    if (options.show) {
                        // options.attr("style", "display: block !important");
                    }
                    setTimeout(function () {
                        // Delay resetting the flag, so we don't close prematurely
                        openingTray = false;
                    }, 200);
                    body.find(":focusable:first").focus();

                }, 150);
                el.css({ right: 0 });
            }, 0);
        }
        if (options.open) {
            if (options.open.length === 1) {
                options.open(el);
                finishBuild();
            } else {
                options.open(el, finishBuild);
            }
        } else {
            finishBuild();
        }
    }

    function handleWindowResize() {
        if (stack.length > 0) {
            var tray = stack[stack.length - 1];
            var trayHeight = tray.tray.height() - tray.header.outerHeight() - tray.footer.outerHeight();
            tray.body.height(trayHeight - 40);
            if (tray.width > $("#editor-stack").position().left - 8) {
                tray.width = $("#editor-stack").position().left - 8;
                tray.tray.width(tray.width);
                // tray.body.parent().width(tray.width);
            } else if (tray.width < tray.preferredWidth) {
                tray.width = Math.min($("#editor-stack").position().left - 8, tray.preferredWidth);
                tray.tray.width(tray.width);
                // tray.body.parent().width(tray.width);
            }
            if (tray.options.resize) {
                tray.options.resize({ width: tray.width });
            }
        }
    }

    return {
        init: function init() {
            // hot fix for navigational init
            editorStack = $("#editor-stack");
            $(window).resize(handleWindowResize);
            RED.events.on("sidebar:resize", handleWindowResize);
            $("#editor-shade").click(function () {
                if (!openingTray) {
                    var tray = stack[stack.length - 1];
                    if (tray && tray.primaryButton) {
                        tray.primaryButton.click();
                    }
                }
            });
        },
        show: function show(options) {
            if (stack.length > 0) {
                var oldTray = stack[stack.length - 1];
                oldTray.tray.css({
                    right: -(oldTray.tray.width() + 10) + "px"
                });
                setTimeout(function () {
                    oldTray.tray.detach();
                    showTray(options);
                }, 250)
            } else {
                RED.events.emit("editor:open");
                showTray(options);
            }
        },
        close: function close(done) {
            let stackLenght = stack.length;
            for (stackLenght; stackLenght > 0; stack.pop()) {
                let tray = stack[stack.length - 1];
                tray.tray.css({
                    right: -(tray.tray.width() + 10) + "px"
                });
                setTimeout(function () {
                    if (tray.options.close) {
                        tray.options.close();
                    }
                    tray.tray.remove();
                    if (done) {
                        done();
                    }
                    if (stack.length === 0) {
                        $("#header-shade").hide();
                        $("#editor-shade").hide();
                        $("#palette-shade").hide();
                        $(".sidebar-shade").hide();
                        RED.events.emit("editor:close");
                        RED.view.focus();
                    }
                }, 250)
            }
        }
    }
})();

// Handles the import/export of flow configuration to clipboard
// RED.clipboard is not needed | TODO: this should be done via a file download/upload to the middleware

// RED.library is not needed

// handles toaster notifications
// RED.notify is not needed | TODO: implement this as a plugin for the outer system
RED.notify = function () { };

// RED.search is not needed

// Handles ctrl+click context menu for quick node insertion
RED.typeSearch = (function () {
    var shade;
    var disabled = false;
    var dialog = null;
    var searchInput;
    var searchResults;
    var searchResultsDiv;
    var selected = -1;
    var visible = false;

    var activeFilter = "";
    var addCallback;

    var typesUsed = {};

    function search(val) {
        activeFilter = val.toLowerCase();
        var visible = searchResults.editableList('filter');
        setTimeout(function () {
            selected = 0;
            searchResults.children().removeClass('selected');
            searchResults.children(":visible:first").addClass('selected');
        }, 100);

    }

    function ensureSelectedIsVisible() {
        var selectedEntry = searchResults.find("li.selected");
        if (selectedEntry.length === 1) {
            var scrollWindow = searchResults.parent();
            var scrollHeight = scrollWindow.height();
            var scrollOffset = scrollWindow.scrollTop();
            var y = selectedEntry.position().top;
            var h = selectedEntry.height();
            if (y + h > scrollHeight) {
                scrollWindow.animate({ scrollTop: '-=' + (scrollHeight - (y + h) - 10) }, 50);
            } else if (y < 0) {
                scrollWindow.animate({ scrollTop: '+=' + (y - 10) }, 50);
            }
        }
    }

    function createDialog() {
        //shade = $('<div>',{class:"red-ui-type-search-shade"}).appendTo("#main-container");
        dialog = $("<div>", { id: "red-ui-type-search", class: "red-ui-search red-ui-type-search" }).appendTo("#main-container");
        var searchDiv = $("<div>", { class: "red-ui-search-container" }).appendTo(dialog);
        searchInput = $('<input type="text">').attr("placeholder", RED._("search.addNode")).appendTo(searchDiv).searchBox({
            delay: 50,
            change: function () {
                search($(this).val());
            }
        });
        searchInput.on('keydown', function (evt) {
            var children = searchResults.children(":visible");
            if (children.length > 0) {
                if (evt.keyCode === 40) {
                    // Down
                    if (selected < children.length - 1) {
                        if (selected > -1) {
                            $(children[selected]).removeClass('selected');
                        }
                        selected++;
                    }
                    $(children[selected]).addClass('selected');
                    ensureSelectedIsVisible();
                    evt.preventDefault();
                } else if (evt.keyCode === 38) {
                    // Up
                    if (selected > 0) {
                        if (selected < children.length) {
                            $(children[selected]).removeClass('selected');
                        }
                        selected--;
                    }
                    $(children[selected]).addClass('selected');
                    ensureSelectedIsVisible();
                    evt.preventDefault();
                } else if (evt.keyCode === 13) {
                    // Enter
                    var index = Math.max(0, selected);
                    if (index < children.length) {
                        // TODO: dips into editableList impl details
                        confirm($(children[index]).find(".red-ui-editableList-item-content").data('data'));
                    }
                }
            }
        });

        searchResultsDiv = $("<div>", { class: "red-ui-search-results-container" }).appendTo(dialog);
        searchResults = $('<ol>', { id: "search-result-list", style: "position: absolute;top: 0;bottom: 0;left: 0;right: 0;" }).appendTo(searchResultsDiv).editableList({
            addButton: false,
            filter: function (data) {
                if (activeFilter === "") {
                    return true;
                }
                if (data.recent || data.common) {
                    return false;
                }
                return (activeFilter === "") || (data.index.indexOf(activeFilter) > -1);
            },
            addItem: function (container, i, object) {
                var def = object.def;
                object.index = object.type.toLowerCase();
                if (object.separator) {
                    container.addClass("red-ui-search-result-separator")
                }
                var div = $('<a>', { href: '#', class: "red-ui-search-result" }).appendTo(container);

                var nodeDiv = $('<div>', { class: "red-ui-search-result-node" }).appendTo(div);
                var colour = def.color;
                var icon_url = "arrow-in.png";
                if (def.category === 'config') {
                    icon_url = "cog.png";
                } else {
                    try {
                        icon_url = (typeof def.icon === "function" ? def.icon.call({}) : def.icon);
                    } catch (err) {
                        console.log("Definition error: " + object.type + ".icon", err);
                    }
                }
                nodeDiv.css('backgroundColor', colour);

                var iconContainer = $('<div/>', { class: "palette_icon_container" }).appendTo(nodeDiv);
                $('<div/>', { class: "palette_icon", style: `background-image: url(${PROXY_URL}flows/icons/${icon_url})` }).appendTo(iconContainer);

                if (def.inputs > 0) {
                    $('<div/>', { class: "red-ui-search-result-node-port" }).appendTo(nodeDiv);
                }
                if (def.outputs > 0) {
                    $('<div/>', { class: "red-ui-search-result-node-port red-ui-search-result-node-output" }).appendTo(nodeDiv);
                }

                var contentDiv = $('<div>', { class: "red-ui-search-result-description" }).appendTo(div);

                var label = object.label;
                object.index += "|" + label.toLowerCase();

                $('<div>', { class: "red-ui-search-result-node-label" }).html(label).appendTo(contentDiv);

                div.click(function (evt) {
                    evt.preventDefault();
                    confirm(object);
                });
            },
            scrollOnAdd: false
        });

    }
    function confirm(def) {
        hide();
        typesUsed[def.type] = Date.now();
        addCallback(def.type);
    }

    function handleMouseActivity(evt) {
        if (visible) {
            var t = $(evt.target);
            while (t.prop('nodeName').toLowerCase() !== 'body') {
                if (t.attr('id') === 'red-ui-type-search') {
                    return;
                }
                t = t.parent();
            }
            hide(true);
        }
    }
    function show(opts) {
        if (!visible) {
            RED.keyboard.add("*", "escape", function () { hide() });
            if (dialog === null) {
                createDialog();
            }
            visible = true;
            setTimeout(function () {
                $(document).on('mousedown.type-search', handleMouseActivity);
                $(document).on('mouseup.type-search', handleMouseActivity);
                $(document).on('click.type-search', handleMouseActivity);
            }, 200);
        } else {
            dialog.hide();
            searchResultsDiv.hide();
        }
        refreshTypeList();
        addCallback = opts.add;
        RED.events.emit("type-search:open");
        //shade.attr("style", "display: block !important");
        dialog.css({ left: opts.x + "px", top: opts.y + "px" }).attr("style", "display: block !important");
        searchResultsDiv.slideDown(300);
        setTimeout(function () {
            searchResultsDiv.find(".red-ui-editableList-container").scrollTop(0);
            searchInput.focus();
        }, 100);
    }
    function hide(fast) {
        if (visible) {
            RED.keyboard.remove("escape");
            visible = false;
            if (dialog !== null) {
                searchResultsDiv.slideUp(fast ? 50 : 200, function () {
                    dialog.hide();
                    searchInput.searchBox('value', '');
                });
                //shade.hide();
            }
            RED.events.emit("type-search:close");
            RED.view.focus();
            $(document).off('mousedown.type-search');
            $(document).off('mouseup.type-search');
            $(document).off('click.type-search');
        }
    }

    function getTypeLabel(type, def) {
        var label = type;
        if (typeof def.paletteLabel !== "undefined") {
            try {
                label = (typeof def.paletteLabel === "function" ? def.paletteLabel.call(def) : def.paletteLabel) || "";
                label += " (" + type + ")";
            } catch (err) {
                console.log("Definition error: " + type + ".paletteLabel", err);
            }
        }
        return label;
    }

    function refreshTypeList() {
        var i;
        searchResults.editableList('empty');
        searchInput.searchBox('value', '');
        selected = -1;
        var common = [
            'inject', 'function', 'change', 'switch'
        ];

        var recentlyUsed = Object.keys(typesUsed);
        recentlyUsed.sort(function (a, b) {
            return typesUsed[b] - typesUsed[a];
        });
        recentlyUsed = recentlyUsed.filter(function (t) {
            return common.indexOf(t) === -1;
        });

        var items = [];
        RED.nodes.registry.getNodeTypes().forEach(function (t) {
            var def = RED.nodes.getType(t);
            if (def.category !== 'config' && t !== 'unknown') {
                items.push({ type: t, def: def, label: getTypeLabel(t, def) });
            }
        });
        items.sort(function (a, b) {
            var al = a.label.toLowerCase();
            var bl = b.label.toLowerCase();
            if (al < bl) {
                return -1;
            } else if (al === bl) {
                return 0;
            } else {
                return 1;
            }
        })

        var commonCount = 0;
        var item;
        for (i = 0; i < common.length; i++) {
            item = {
                type: common[i],
                common: true,
                def: RED.nodes.getType(common[i])
            };
            item.label = getTypeLabel(item.type, item.def);
            if (i === common.length - 1) {
                item.separator = true;
            }
            searchResults.editableList('addItem', item);
        }
        for (i = 0; i < Math.min(5, recentlyUsed.length); i++) {
            item = {
                type: recentlyUsed[i],
                def: RED.nodes.getType(recentlyUsed[i]),
                recent: true
            };
            item.label = getTypeLabel(item.type, item.def);
            if (i === recentlyUsed.length - 1) {
                item.separator = true;
            }
            searchResults.editableList('addItem', item);
        }
        for (i = 0; i < items.length; i++) {
            searchResults.editableList('addItem', items[i]);
        }
        setTimeout(function () {
            selected = 0;
            searchResults.children(":first").addClass('selected');
        }, 100);
    }

    return {
        show: show,
        hide: hide,
        init: function () { dialog = null; }
    };

})();

// RED.subflow is not needed | TODO: implement flow reuse scheme
// RED.touch is not needed | TODO:check viability for touch based devices (tablets)


module.exports = { RED };
