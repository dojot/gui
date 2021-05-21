/* eslint-disable */
function localStoragePolyFill() {
    function createCookie(name, value, days) {
        let expires;
        if (days) {
            const date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            expires = `; expires=${date.toGMTString()}`;
        } else {
            expires = '';
        }
        document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}${expires}; path=/`;
    }

    function readCookie(name) {
        const results = document.cookie.match(`(^|;) ?${encodeURIComponent(name)}=([^;]*)(;|$)`);
        return results ? decodeURIComponent(results[2]) : null;
    }

    function Storage(type) {
        function setData(data) {
            data = JSON.stringify(data);
            if (type === 'session') {
                createCookie(getSessionName(), data);
            } else {
                createCookie('localStorage', data, 365);
            }
        }

        function clearData() {
            if (type === 'session') {
                createCookie(getSessionName(), '');
            } else {
                createCookie('localStorage', '', 365);
            }
        }

        function getData() {
            const data = readCookie(type === 'session' ? getSessionName() : 'localStorage');
            return data ? JSON.parse(data) : {};
        }

        function getSessionName() {
            if (!window.name) {
                window.name = `${Math.random()}-${new Date().getTime()}`;
            }
            return `sessionStorage-${window.name}`;
        }

        // Initialize if there's already data.
        let data = getData();

        const obj = {
            POLYFILLED: true,
            length: 0,
            clear() {
                data = {};
                this.length = 0;
                clearData();
            },
            getItem(key) {
                return Object.prototype.hasOwnProperty.call(data, key) ? data[key] : null;
            },
            key(i) {
                let ctr = 0;
                for (const k in data) {
                    if (ctr++ == i) return k;
                }
                return null;
            },
            removeItem(key) {
                if (Object.prototype.hasOwnProperty.call(data, key)) {
                    delete data[key];
                    this.length--;
                    setData(data);
                }
            },
            setItem(key, value) {
                if (!Object.prototype.hasOwnProperty.call(data, key)) {
                    this.length++;
                }
                data[key] = `${value}`;
                setData(data);
            },
        };
        return obj;
    }

    const localStorage = new Storage('local');
    const sessionStorage = new Storage('session');
    try {
        window.localStorage = localStorage;
        window.sessionStorage = sessionStorage;
    } catch (e) { }
    try {
        // For Safari private browsing need to also set the proto value.
        window.localStorage.__proto__ = localStorage;
        window.sessionStorage.__proto__ = sessionStorage;
    } catch (e) { }
}
