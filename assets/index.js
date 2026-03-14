(function() {
    const u = document.createElement("link").relList;
    if (u && u.supports && u.supports("modulepreload"))
        return;
    for (const y of document.querySelectorAll('link[rel="modulepreload"]'))
        o(y);
    new MutationObserver(y => {
        for (const f of y)
            if (f.type === "childList")
                for (const g of f.addedNodes)
                    g.tagName === "LINK" && g.rel === "modulepreload" && o(g)
    }
    ).observe(document, {
        childList: !0,
        subtree: !0
    });
    function d(y) {
        const f = {};
        return y.integrity && (f.integrity = y.integrity),
        y.referrerPolicy && (f.referrerPolicy = y.referrerPolicy),
        y.crossOrigin === "use-credentials" ? f.credentials = "include" : y.crossOrigin === "anonymous" ? f.credentials = "omit" : f.credentials = "same-origin",
        f
    }
    function o(y) {
        if (y.ep)
            return;
        y.ep = !0;
        const f = d(y);
        fetch(y.href, f)
    }
}
)();
function Sh(s) {
    return s && s.__esModule && Object.prototype.hasOwnProperty.call(s, "default") ? s.default : s
}
var _o = {
    exports: {}
}
  , zl = {};
var ef;
function kh() {
    if (ef)
        return zl;
    ef = 1;
    var s = Symbol.for("react.transitional.element")
      , u = Symbol.for("react.fragment");
    function d(o, y, f) {
        var g = null;
        if (f !== void 0 && (g = "" + f),
        y.key !== void 0 && (g = "" + y.key),
        "key"in y) {
            f = {};
            for (var x in y)
                x !== "key" && (f[x] = y[x])
        } else
            f = y;
        return y = f.ref,
        {
            $$typeof: s,
            type: o,
            key: g,
            ref: y !== void 0 ? y : null,
            props: f
        }
    }
    return zl.Fragment = u,
    zl.jsx = d,
    zl.jsxs = d,
    zl
}
var tf;
function wh() {
    return tf || (tf = 1,
    _o.exports = kh()),
    _o.exports
}
var c = wh()
  , Bo = {
    exports: {}
}
  , se = {};
var af;
function Eh() {
    if (af)
        return se;
    af = 1;
    var s = Symbol.for("react.transitional.element")
      , u = Symbol.for("react.portal")
      , d = Symbol.for("react.fragment")
      , o = Symbol.for("react.strict_mode")
      , y = Symbol.for("react.profiler")
      , f = Symbol.for("react.consumer")
      , g = Symbol.for("react.context")
      , x = Symbol.for("react.forward_ref")
      , h = Symbol.for("react.suspense")
      , p = Symbol.for("react.memo")
      , w = Symbol.for("react.lazy")
      , k = Symbol.for("react.activity")
      , A = Symbol.iterator;
    function v(L) {
        return L === null || typeof L != "object" ? null : (L = A && L[A] || L["@@iterator"],
        typeof L == "function" ? L : null)
    }
    var _ = {
        isMounted: function() {
            return !1
        },
        enqueueForceUpdate: function() {},
        enqueueReplaceState: function() {},
        enqueueSetState: function() {}
    }
      , S = Object.assign
      , D = {};
    function z(L, B, I) {
        this.props = L,
        this.context = B,
        this.refs = D,
        this.updater = I || _
    }
    z.prototype.isReactComponent = {},
    z.prototype.setState = function(L, B) {
        if (typeof L != "object" && typeof L != "function" && L != null)
            throw Error("takes an object of state variables to update or a function which returns an object of state variables.");
        this.updater.enqueueSetState(this, L, B, "setState")
    }
    ,
    z.prototype.forceUpdate = function(L) {
        this.updater.enqueueForceUpdate(this, L, "forceUpdate")
    }
    ;
    function V() {}
    V.prototype = z.prototype;
    function G(L, B, I) {
        this.props = L,
        this.context = B,
        this.refs = D,
        this.updater = I || _
    }
    var X = G.prototype = new V;
    X.constructor = G,
    S(X, z.prototype),
    X.isPureReactComponent = !0;
    var Z = Array.isArray;
    function F() {}
    var q = {
        H: null,
        A: null,
        T: null,
        S: null
    }
      , le = Object.prototype.hasOwnProperty;
    function ve(L, B, I) {
        var ee = I.ref;
        return {
            $$typeof: s,
            type: L,
            key: B,
            ref: ee !== void 0 ? ee : null,
            props: I
        }
    }
    function Ne(L, B) {
        return ve(L.type, B, L.props)
    }
    function Q(L) {
        return typeof L == "object" && L !== null && L.$$typeof === s
    }
    function J(L) {
        var B = {
            "=": "=0",
            ":": "=2"
        };
        return "$" + L.replace(/[=:]/g, function(I) {
            return B[I]
        })
    }
    var _e = /\/+/g;
    function je(L, B) {
        return typeof L == "object" && L !== null && L.key != null ? J("" + L.key) : B.toString(36)
    }
    function W(L) {
        switch (L.status) {
        case "fulfilled":
            return L.value;
        case "rejected":
            throw L.reason;
        default:
            switch (typeof L.status == "string" ? L.then(F, F) : (L.status = "pending",
            L.then(function(B) {
                L.status === "pending" && (L.status = "fulfilled",
                L.value = B)
            }, function(B) {
                L.status === "pending" && (L.status = "rejected",
                L.reason = B)
            })),
            L.status) {
            case "fulfilled":
                return L.value;
            case "rejected":
                throw L.reason
            }
        }
        throw L
    }
    function N(L, B, I, ee, ce) {
        var re = typeof L;
        (re === "undefined" || re === "boolean") && (L = null);
        var ke = !1;
        if (L === null)
            ke = !0;
        else
            switch (re) {
            case "bigint":
            case "string":
            case "number":
                ke = !0;
                break;
            case "object":
                switch (L.$$typeof) {
                case s:
                case u:
                    ke = !0;
                    break;
                case w:
                    return ke = L._init,
                    N(ke(L._payload), B, I, ee, ce)
                }
            }
        if (ke)
            return ce = ce(L),
            ke = ee === "" ? "." + je(L, 0) : ee,
            Z(ce) ? (I = "",
            ke != null && (I = ke.replace(_e, "$&/") + "/"),
            N(ce, B, I, "", function(Xn) {
                return Xn
            })) : ce != null && (Q(ce) && (ce = Ne(ce, I + (ce.key == null || L && L.key === ce.key ? "" : ("" + ce.key).replace(_e, "$&/") + "/") + ke)),
            B.push(ce)),
            1;
        ke = 0;
        var tt = ee === "" ? "." : ee + ":";
        if (Z(L))
            for (var ze = 0; ze < L.length; ze++)
                ee = L[ze],
                re = tt + je(ee, ze),
                ke += N(ee, B, I, re, ce);
        else if (ze = v(L),
        typeof ze == "function")
            for (L = ze.call(L),
            ze = 0; !(ee = L.next()).done; )
                ee = ee.value,
                re = tt + je(ee, ze++),
                ke += N(ee, B, I, re, ce);
        else if (re === "object") {
            if (typeof L.then == "function")
                return N(W(L), B, I, ee, ce);
            throw B = String(L),
            Error("Objects are not valid as a React child (found: " + (B === "[object Object]" ? "object with keys {" + Object.keys(L).join(", ") + "}" : B) + "). If you meant to render a collection of children, use an array instead.")
        }
        return ke
    }
    function Y(L, B, I) {
        if (L == null)
            return L;
        var ee = []
          , ce = 0;
        return N(L, ee, "", "", function(re) {
            return B.call(I, re, ce++)
        }),
        ee
    }
    function P(L) {
        if (L._status === -1) {
            var B = L._result;
            B = B(),
            B.then(function(I) {
                (L._status === 0 || L._status === -1) && (L._status = 1,
                L._result = I)
            }, function(I) {
                (L._status === 0 || L._status === -1) && (L._status = 2,
                L._result = I)
            }),
            L._status === -1 && (L._status = 0,
            L._result = B)
        }
        if (L._status === 1)
            return L._result.default;
        throw L._result
    }
    var ae = typeof reportError == "function" ? reportError : function(L) {
        if (typeof window == "object" && typeof window.ErrorEvent == "function") {
            var B = new window.ErrorEvent("error",{
                bubbles: !0,
                cancelable: !0,
                message: typeof L == "object" && L !== null && typeof L.message == "string" ? String(L.message) : String(L),
                error: L
            });
            if (!window.dispatchEvent(B))
                return
        } else if (typeof process == "object" && typeof process.emit == "function") {
            process.emit("uncaughtException", L);
            return
        }
        console.error(L)
    }
      , me = {
        map: Y,
        forEach: function(L, B, I) {
            Y(L, function() {
                B.apply(this, arguments)
            }, I)
        },
        count: function(L) {
            var B = 0;
            return Y(L, function() {
                B++
            }),
            B
        },
        toArray: function(L) {
            return Y(L, function(B) {
                return B
            }) || []
        },
        only: function(L) {
            if (!Q(L))
                throw Error("React.Children.only expected to receive a single React element child.");
            return L
        }
    };
    return se.Activity = k,
    se.Children = me,
    se.Component = z,
    se.Fragment = d,
    se.Profiler = y,
    se.PureComponent = G,
    se.StrictMode = o,
    se.Suspense = h,
    se.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE = q,
    se.__COMPILER_RUNTIME = {
        __proto__: null,
        c: function(L) {
            return q.H.useMemoCache(L)
        }
    },
    se.cache = function(L) {
        return function() {
            return L.apply(null, arguments)
        }
    }
    ,
    se.cacheSignal = function() {
        return null
    }
    ,
    se.cloneElement = function(L, B, I) {
        if (L == null)
            throw Error("The argument must be a React element, but you passed " + L + ".");
        var ee = S({}, L.props)
          , ce = L.key;
        if (B != null)
            for (re in B.key !== void 0 && (ce = "" + B.key),
            B)
                !le.call(B, re) || re === "key" || re === "__self" || re === "__source" || re === "ref" && B.ref === void 0 || (ee[re] = B[re]);
        var re = arguments.length - 2;
        if (re === 1)
            ee.children = I;
        else if (1 < re) {
            for (var ke = Array(re), tt = 0; tt < re; tt++)
                ke[tt] = arguments[tt + 2];
            ee.children = ke
        }
        return ve(L.type, ce, ee)
    }
    ,
    se.createContext = function(L) {
        return L = {
            $$typeof: g,
            _currentValue: L,
            _currentValue2: L,
            _threadCount: 0,
            Provider: null,
            Consumer: null
        },
        L.Provider = L,
        L.Consumer = {
            $$typeof: f,
            _context: L
        },
        L
    }
    ,
    se.createElement = function(L, B, I) {
        var ee, ce = {}, re = null;
        if (B != null)
            for (ee in B.key !== void 0 && (re = "" + B.key),
            B)
                le.call(B, ee) && ee !== "key" && ee !== "__self" && ee !== "__source" && (ce[ee] = B[ee]);
        var ke = arguments.length - 2;
        if (ke === 1)
            ce.children = I;
        else if (1 < ke) {
            for (var tt = Array(ke), ze = 0; ze < ke; ze++)
                tt[ze] = arguments[ze + 2];
            ce.children = tt
        }
        if (L && L.defaultProps)
            for (ee in ke = L.defaultProps,
            ke)
                ce[ee] === void 0 && (ce[ee] = ke[ee]);
        return ve(L, re, ce)
    }
    ,
    se.createRef = function() {
        return {
            current: null
        }
    }
    ,
    se.forwardRef = function(L) {
        return {
            $$typeof: x,
            render: L
        }
    }
    ,
    se.isValidElement = Q,
    se.lazy = function(L) {
        return {
            $$typeof: w,
            _payload: {
                _status: -1,
                _result: L
            },
            _init: P
        }
    }
    ,
    se.memo = function(L, B) {
        return {
            $$typeof: p,
            type: L,
            compare: B === void 0 ? null : B
        }
    }
    ,
    se.startTransition = function(L) {
        var B = q.T
          , I = {};
        q.T = I;
        try {
            var ee = L()
              , ce = q.S;
            ce !== null && ce(I, ee),
            typeof ee == "object" && ee !== null && typeof ee.then == "function" && ee.then(F, ae)
        } catch (re) {
            ae(re)
        } finally {
            B !== null && I.types !== null && (B.types = I.types),
            q.T = B
        }
    }
    ,
    se.unstable_useCacheRefresh = function() {
        return q.H.useCacheRefresh()
    }
    ,
    se.use = function(L) {
        return q.H.use(L)
    }
    ,
    se.useActionState = function(L, B, I) {
        return q.H.useActionState(L, B, I)
    }
    ,
    se.useCallback = function(L, B) {
        return q.H.useCallback(L, B)
    }
    ,
    se.useContext = function(L) {
        return q.H.useContext(L)
    }
    ,
    se.useDebugValue = function() {}
    ,
    se.useDeferredValue = function(L, B) {
        return q.H.useDeferredValue(L, B)
    }
    ,
    se.useEffect = function(L, B) {
        return q.H.useEffect(L, B)
    }
    ,
    se.useEffectEvent = function(L) {
        return q.H.useEffectEvent(L)
    }
    ,
    se.useId = function() {
        return q.H.useId()
    }
    ,
    se.useImperativeHandle = function(L, B, I) {
        return q.H.useImperativeHandle(L, B, I)
    }
    ,
    se.useInsertionEffect = function(L, B) {
        return q.H.useInsertionEffect(L, B)
    }
    ,
    se.useLayoutEffect = function(L, B) {
        return q.H.useLayoutEffect(L, B)
    }
    ,
    se.useMemo = function(L, B) {
        return q.H.useMemo(L, B)
    }
    ,
    se.useOptimistic = function(L, B) {
        return q.H.useOptimistic(L, B)
    }
    ,
    se.useReducer = function(L, B, I) {
        return q.H.useReducer(L, B, I)
    }
    ,
    se.useRef = function(L) {
        return q.H.useRef(L)
    }
    ,
    se.useState = function(L) {
        return q.H.useState(L)
    }
    ,
    se.useSyncExternalStore = function(L, B, I) {
        return q.H.useSyncExternalStore(L, B, I)
    }
    ,
    se.useTransition = function() {
        return q.H.useTransition()
    }
    ,
    se.version = "19.2.4",
    se
}
var nf;
function Qo() {
    return nf || (nf = 1,
    Bo.exports = Eh()),
    Bo.exports
}
var O = Qo();
const Io = Sh(O);
var Oo = {
    exports: {}
}
  , Hl = {}
  , zo = {
    exports: {}
}
  , Ho = {};
var lf;
function Lh() {
    return lf || (lf = 1,
    (function(s) {
        function u(N, Y) {
            var P = N.length;
            N.push(Y);
            e: for (; 0 < P; ) {
                var ae = P - 1 >>> 1
                  , me = N[ae];
                if (0 < y(me, Y))
                    N[ae] = Y,
                    N[P] = me,
                    P = ae;
                else
                    break e
            }
        }
        function d(N) {
            return N.length === 0 ? null : N[0]
        }
        function o(N) {
            if (N.length === 0)
                return null;
            var Y = N[0]
              , P = N.pop();
            if (P !== Y) {
                N[0] = P;
                e: for (var ae = 0, me = N.length, L = me >>> 1; ae < L; ) {
                    var B = 2 * (ae + 1) - 1
                      , I = N[B]
                      , ee = B + 1
                      , ce = N[ee];
                    if (0 > y(I, P))
                        ee < me && 0 > y(ce, I) ? (N[ae] = ce,
                        N[ee] = P,
                        ae = ee) : (N[ae] = I,
                        N[B] = P,
                        ae = B);
                    else if (ee < me && 0 > y(ce, P))
                        N[ae] = ce,
                        N[ee] = P,
                        ae = ee;
                    else
                        break e
                }
            }
            return Y
        }
        function y(N, Y) {
            var P = N.sortIndex - Y.sortIndex;
            return P !== 0 ? P : N.id - Y.id
        }
        if (s.unstable_now = void 0,
        typeof performance == "object" && typeof performance.now == "function") {
            var f = performance;
            s.unstable_now = function() {
                return f.now()
            }
        } else {
            var g = Date
              , x = g.now();
            s.unstable_now = function() {
                return g.now() - x
            }
        }
        var h = []
          , p = []
          , w = 1
          , k = null
          , A = 3
          , v = !1
          , _ = !1
          , S = !1
          , D = !1
          , z = typeof setTimeout == "function" ? setTimeout : null
          , V = typeof clearTimeout == "function" ? clearTimeout : null
          , G = typeof setImmediate < "u" ? setImmediate : null;
        function X(N) {
            for (var Y = d(p); Y !== null; ) {
                if (Y.callback === null)
                    o(p);
                else if (Y.startTime <= N)
                    o(p),
                    Y.sortIndex = Y.expirationTime,
                    u(h, Y);
                else
                    break;
                Y = d(p)
            }
        }
        function Z(N) {
            if (S = !1,
            X(N),
            !_)
                if (d(h) !== null)
                    _ = !0,
                    F || (F = !0,
                    J());
                else {
                    var Y = d(p);
                    Y !== null && W(Z, Y.startTime - N)
                }
        }
        var F = !1
          , q = -1
          , le = 5
          , ve = -1;
        function Ne() {
            return D ? !0 : !(s.unstable_now() - ve < le)
        }
        function Q() {
            if (D = !1,
            F) {
                var N = s.unstable_now();
                ve = N;
                var Y = !0;
                try {
                    e: {
                        _ = !1,
                        S && (S = !1,
                        V(q),
                        q = -1),
                        v = !0;
                        var P = A;
                        try {
                            t: {
                                for (X(N),
                                k = d(h); k !== null && !(k.expirationTime > N && Ne()); ) {
                                    var ae = k.callback;
                                    if (typeof ae == "function") {
                                        k.callback = null,
                                        A = k.priorityLevel;
                                        var me = ae(k.expirationTime <= N);
                                        if (N = s.unstable_now(),
                                        typeof me == "function") {
                                            k.callback = me,
                                            X(N),
                                            Y = !0;
                                            break t
                                        }
                                        k === d(h) && o(h),
                                        X(N)
                                    } else
                                        o(h);
                                    k = d(h)
                                }
                                if (k !== null)
                                    Y = !0;
                                else {
                                    var L = d(p);
                                    L !== null && W(Z, L.startTime - N),
                                    Y = !1
                                }
                            }
                            break e
                        } finally {
                            k = null,
                            A = P,
                            v = !1
                        }
                        Y = void 0
                    }
                } finally {
                    Y ? J() : F = !1
                }
            }
        }
        var J;
        if (typeof G == "function")
            J = function() {
                G(Q)
            }
            ;
        else if (typeof MessageChannel < "u") {
            var _e = new MessageChannel
              , je = _e.port2;
            _e.port1.onmessage = Q,
            J = function() {
                je.postMessage(null)
            }
        } else
            J = function() {
                z(Q, 0)
            }
            ;
        function W(N, Y) {
            q = z(function() {
                N(s.unstable_now())
            }, Y)
        }
        s.unstable_IdlePriority = 5,
        s.unstable_ImmediatePriority = 1,
        s.unstable_LowPriority = 4,
        s.unstable_NormalPriority = 3,
        s.unstable_Profiling = null,
        s.unstable_UserBlockingPriority = 2,
        s.unstable_cancelCallback = function(N) {
            N.callback = null
        }
        ,
        s.unstable_forceFrameRate = function(N) {
            0 > N || 125 < N ? console.error("forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported") : le = 0 < N ? Math.floor(1e3 / N) : 5
        }
        ,
        s.unstable_getCurrentPriorityLevel = function() {
            return A
        }
        ,
        s.unstable_next = function(N) {
            switch (A) {
            case 1:
            case 2:
            case 3:
                var Y = 3;
                break;
            default:
                Y = A
            }
            var P = A;
            A = Y;
            try {
                return N()
            } finally {
                A = P
            }
        }
        ,
        s.unstable_requestPaint = function() {
            D = !0
        }
        ,
        s.unstable_runWithPriority = function(N, Y) {
            switch (N) {
            case 1:
            case 2:
            case 3:
            case 4:
            case 5:
                break;
            default:
                N = 3
            }
            var P = A;
            A = N;
            try {
                return Y()
            } finally {
                A = P
            }
        }
        ,
        s.unstable_scheduleCallback = function(N, Y, P) {
            var ae = s.unstable_now();
            switch (typeof P == "object" && P !== null ? (P = P.delay,
            P = typeof P == "number" && 0 < P ? ae + P : ae) : P = ae,
            N) {
            case 1:
                var me = -1;
                break;
            case 2:
                me = 250;
                break;
            case 5:
                me = 1073741823;
                break;
            case 4:
                me = 1e4;
                break;
            default:
                me = 5e3
            }
            return me = P + me,
            N = {
                id: w++,
                callback: Y,
                priorityLevel: N,
                startTime: P,
                expirationTime: me,
                sortIndex: -1
            },
            P > ae ? (N.sortIndex = P,
            u(p, N),
            d(h) === null && N === d(p) && (S ? (V(q),
            q = -1) : S = !0,
            W(Z, P - ae))) : (N.sortIndex = me,
            u(h, N),
            _ || v || (_ = !0,
            F || (F = !0,
            J()))),
            N
        }
        ,
        s.unstable_shouldYield = Ne,
        s.unstable_wrapCallback = function(N) {
            var Y = A;
            return function() {
                var P = A;
                A = Y;
                try {
                    return N.apply(this, arguments)
                } finally {
                    A = P
                }
            }
        }
    }
    )(Ho)),
    Ho
}
var sf;
function Ah() {
    return sf || (sf = 1,
    zo.exports = Lh()),
    zo.exports
}
var Uo = {
    exports: {}
}
  , et = {};
var cf;
function Th() {
    if (cf)
        return et;
    cf = 1;
    var s = Qo();
    function u(h) {
        var p = "https://react.dev/errors/" + h;
        if (1 < arguments.length) {
            p += "?args[]=" + encodeURIComponent(arguments[1]);
            for (var w = 2; w < arguments.length; w++)
                p += "&args[]=" + encodeURIComponent(arguments[w])
        }
        return "Minified React error #" + h + "; visit " + p + " for the full message or use the non-minified dev environment for full errors and additional helpful warnings."
    }
    function d() {}
    var o = {
        d: {
            f: d,
            r: function() {
                throw Error(u(522))
            },
            D: d,
            C: d,
            L: d,
            m: d,
            X: d,
            S: d,
            M: d
        },
        p: 0,
        findDOMNode: null
    }
      , y = Symbol.for("react.portal");
    function f(h, p, w) {
        var k = 3 < arguments.length && arguments[3] !== void 0 ? arguments[3] : null;
        return {
            $$typeof: y,
            key: k == null ? null : "" + k,
            children: h,
            containerInfo: p,
            implementation: w
        }
    }
    var g = s.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;
    function x(h, p) {
        if (h === "font")
            return "";
        if (typeof p == "string")
            return p === "use-credentials" ? p : ""
    }
    return et.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE = o,
    et.createPortal = function(h, p) {
        var w = 2 < arguments.length && arguments[2] !== void 0 ? arguments[2] : null;
        if (!p || p.nodeType !== 1 && p.nodeType !== 9 && p.nodeType !== 11)
            throw Error(u(299));
        return f(h, p, null, w)
    }
    ,
    et.flushSync = function(h) {
        var p = g.T
          , w = o.p;
        try {
            if (g.T = null,
            o.p = 2,
            h)
                return h()
        } finally {
            g.T = p,
            o.p = w,
            o.d.f()
        }
    }
    ,
    et.preconnect = function(h, p) {
        typeof h == "string" && (p ? (p = p.crossOrigin,
        p = typeof p == "string" ? p === "use-credentials" ? p : "" : void 0) : p = null,
        o.d.C(h, p))
    }
    ,
    et.prefetchDNS = function(h) {
        typeof h == "string" && o.d.D(h)
    }
    ,
    et.preinit = function(h, p) {
        if (typeof h == "string" && p && typeof p.as == "string") {
            var w = p.as
              , k = x(w, p.crossOrigin)
              , A = typeof p.integrity == "string" ? p.integrity : void 0
              , v = typeof p.fetchPriority == "string" ? p.fetchPriority : void 0;
            w === "style" ? o.d.S(h, typeof p.precedence == "string" ? p.precedence : void 0, {
                crossOrigin: k,
                integrity: A,
                fetchPriority: v
            }) : w === "script" && o.d.X(h, {
                crossOrigin: k,
                integrity: A,
                fetchPriority: v,
                nonce: typeof p.nonce == "string" ? p.nonce : void 0
            })
        }
    }
    ,
    et.preinitModule = function(h, p) {
        if (typeof h == "string")
            if (typeof p == "object" && p !== null) {
                if (p.as == null || p.as === "script") {
                    var w = x(p.as, p.crossOrigin);
                    o.d.M(h, {
                        crossOrigin: w,
                        integrity: typeof p.integrity == "string" ? p.integrity : void 0,
                        nonce: typeof p.nonce == "string" ? p.nonce : void 0
                    })
                }
            } else
                p == null && o.d.M(h)
    }
    ,
    et.preload = function(h, p) {
        if (typeof h == "string" && typeof p == "object" && p !== null && typeof p.as == "string") {
            var w = p.as
              , k = x(w, p.crossOrigin);
            o.d.L(h, w, {
                crossOrigin: k,
                integrity: typeof p.integrity == "string" ? p.integrity : void 0,
                nonce: typeof p.nonce == "string" ? p.nonce : void 0,
                type: typeof p.type == "string" ? p.type : void 0,
                fetchPriority: typeof p.fetchPriority == "string" ? p.fetchPriority : void 0,
                referrerPolicy: typeof p.referrerPolicy == "string" ? p.referrerPolicy : void 0,
                imageSrcSet: typeof p.imageSrcSet == "string" ? p.imageSrcSet : void 0,
                imageSizes: typeof p.imageSizes == "string" ? p.imageSizes : void 0,
                media: typeof p.media == "string" ? p.media : void 0
            })
        }
    }
    ,
    et.preloadModule = function(h, p) {
        if (typeof h == "string")
            if (p) {
                var w = x(p.as, p.crossOrigin);
                o.d.m(h, {
                    as: typeof p.as == "string" && p.as !== "script" ? p.as : void 0,
                    crossOrigin: w,
                    integrity: typeof p.integrity == "string" ? p.integrity : void 0
                })
            } else
                o.d.m(h)
    }
    ,
    et.requestFormReset = function(h) {
        o.d.r(h)
    }
    ,
    et.unstable_batchedUpdates = function(h, p) {
        return h(p)
    }
    ,
    et.useFormState = function(h, p, w) {
        return g.H.useFormState(h, p, w)
    }
    ,
    et.useFormStatus = function() {
        return g.H.useHostTransitionStatus()
    }
    ,
    et.version = "19.2.4",
    et
}
var of;
function Df() {
    if (of)
        return Uo.exports;
    of = 1;
    function s() {
        if (!(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ > "u" || typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE != "function"))
            try {
                __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(s)
            } catch (u) {
                console.error(u)
            }
    }
    return s(),
    Uo.exports = Th(),
    Uo.exports
}
var uf;
function Nh() {
    if (uf)
        return Hl;
    uf = 1;
    var s = Ah()
      , u = Qo()
      , d = Df();
    function o(e) {
        var t = "https://react.dev/errors/" + e;
        if (1 < arguments.length) {
            t += "?args[]=" + encodeURIComponent(arguments[1]);
            for (var a = 2; a < arguments.length; a++)
                t += "&args[]=" + encodeURIComponent(arguments[a])
        }
        return "Minified React error #" + e + "; visit " + t + " for the full message or use the non-minified dev environment for full errors and additional helpful warnings."
    }
    function y(e) {
        return !(!e || e.nodeType !== 1 && e.nodeType !== 9 && e.nodeType !== 11)
    }
    function f(e) {
        var t = e
          , a = e;
        if (e.alternate)
            for (; t.return; )
                t = t.return;
        else {
            e = t;
            do
                t = e,
                (t.flags & 4098) !== 0 && (a = t.return),
                e = t.return;
            while (e)
        }
        return t.tag === 3 ? a : null
    }
    function g(e) {
        if (e.tag === 13) {
            var t = e.memoizedState;
            if (t === null && (e = e.alternate,
            e !== null && (t = e.memoizedState)),
            t !== null)
                return t.dehydrated
        }
        return null
    }
    function x(e) {
        if (e.tag === 31) {
            var t = e.memoizedState;
            if (t === null && (e = e.alternate,
            e !== null && (t = e.memoizedState)),
            t !== null)
                return t.dehydrated
        }
        return null
    }
    function h(e) {
        if (f(e) !== e)
            throw Error(o(188))
    }
    function p(e) {
        var t = e.alternate;
        if (!t) {
            if (t = f(e),
            t === null)
                throw Error(o(188));
            return t !== e ? null : e
        }
        for (var a = e, n = t; ; ) {
            var l = a.return;
            if (l === null)
                break;
            var i = l.alternate;
            if (i === null) {
                if (n = l.return,
                n !== null) {
                    a = n;
                    continue
                }
                break
            }
            if (l.child === i.child) {
                for (i = l.child; i; ) {
                    if (i === a)
                        return h(l),
                        e;
                    if (i === n)
                        return h(l),
                        t;
                    i = i.sibling
                }
                throw Error(o(188))
            }
            if (a.return !== n.return)
                a = l,
                n = i;
            else {
                for (var r = !1, m = l.child; m; ) {
                    if (m === a) {
                        r = !0,
                        a = l,
                        n = i;
                        break
                    }
                    if (m === n) {
                        r = !0,
                        n = l,
                        a = i;
                        break
                    }
                    m = m.sibling
                }
                if (!r) {
                    for (m = i.child; m; ) {
                        if (m === a) {
                            r = !0,
                            a = i,
                            n = l;
                            break
                        }
                        if (m === n) {
                            r = !0,
                            n = i,
                            a = l;
                            break
                        }
                        m = m.sibling
                    }
                    if (!r)
                        throw Error(o(189))
                }
            }
            if (a.alternate !== n)
                throw Error(o(190))
        }
        if (a.tag !== 3)
            throw Error(o(188));
        return a.stateNode.current === a ? e : t
    }
    function w(e) {
        var t = e.tag;
        if (t === 5 || t === 26 || t === 27 || t === 6)
            return e;
        for (e = e.child; e !== null; ) {
            if (t = w(e),
            t !== null)
                return t;
            e = e.sibling
        }
        return null
    }
    var k = Object.assign
      , A = Symbol.for("react.element")
      , v = Symbol.for("react.transitional.element")
      , _ = Symbol.for("react.portal")
      , S = Symbol.for("react.fragment")
      , D = Symbol.for("react.strict_mode")
      , z = Symbol.for("react.profiler")
      , V = Symbol.for("react.consumer")
      , G = Symbol.for("react.context")
      , X = Symbol.for("react.forward_ref")
      , Z = Symbol.for("react.suspense")
      , F = Symbol.for("react.suspense_list")
      , q = Symbol.for("react.memo")
      , le = Symbol.for("react.lazy")
      , ve = Symbol.for("react.activity")
      , Ne = Symbol.for("react.memo_cache_sentinel")
      , Q = Symbol.iterator;
    function J(e) {
        return e === null || typeof e != "object" ? null : (e = Q && e[Q] || e["@@iterator"],
        typeof e == "function" ? e : null)
    }
    var _e = Symbol.for("react.client.reference");
    function je(e) {
        if (e == null)
            return null;
        if (typeof e == "function")
            return e.$$typeof === _e ? null : e.displayName || e.name || null;
        if (typeof e == "string")
            return e;
        switch (e) {
        case S:
            return "Fragment";
        case z:
            return "Profiler";
        case D:
            return "StrictMode";
        case Z:
            return "Suspense";
        case F:
            return "SuspenseList";
        case ve:
            return "Activity"
        }
        if (typeof e == "object")
            switch (e.$$typeof) {
            case _:
                return "Portal";
            case G:
                return e.displayName || "Context";
            case V:
                return (e._context.displayName || "Context") + ".Consumer";
            case X:
                var t = e.render;
                return e = e.displayName,
                e || (e = t.displayName || t.name || "",
                e = e !== "" ? "ForwardRef(" + e + ")" : "ForwardRef"),
                e;
            case q:
                return t = e.displayName || null,
                t !== null ? t : je(e.type) || "Memo";
            case le:
                t = e._payload,
                e = e._init;
                try {
                    return je(e(t))
                } catch {}
            }
        return null
    }
    var W = Array.isArray
      , N = u.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE
      , Y = d.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE
      , P = {
        pending: !1,
        data: null,
        method: null,
        action: null
    }
      , ae = []
      , me = -1;
    function L(e) {
        return {
            current: e
        }
    }
    function B(e) {
        0 > me || (e.current = ae[me],
        ae[me] = null,
        me--)
    }
    function I(e, t) {
        me++,
        ae[me] = e.current,
        e.current = t
    }
    var ee = L(null)
      , ce = L(null)
      , re = L(null)
      , ke = L(null);
    function tt(e, t) {
        switch (I(re, t),
        I(ce, e),
        I(ee, null),
        t.nodeType) {
        case 9:
        case 11:
            e = (e = t.documentElement) && (e = e.namespaceURI) ? wp(e) : 0;
            break;
        default:
            if (e = t.tagName,
            t = t.namespaceURI)
                t = wp(t),
                e = Ep(t, e);
            else
                switch (e) {
                case "svg":
                    e = 1;
                    break;
                case "math":
                    e = 2;
                    break;
                default:
                    e = 0
                }
        }
        B(ee),
        I(ee, e)
    }
    function ze() {
        B(ee),
        B(ce),
        B(re)
    }
    function Xn(e) {
        e.memoizedState !== null && I(ke, e);
        var t = ee.current
          , a = Ep(t, e.type);
        t !== a && (I(ce, e),
        I(ee, a))
    }
    function Ql(e) {
        ce.current === e && (B(ee),
        B(ce)),
        ke.current === e && (B(ke),
        Ml._currentValue = P)
    }
    var hs, $o;
    function Da(e) {
        if (hs === void 0)
            try {
                throw Error()
            } catch (a) {
                var t = a.stack.trim().match(/\n( *(at )?)/);
                hs = t && t[1] || "",
                $o = -1 < a.stack.indexOf(`
    at`) ? " (<anonymous>)" : -1 < a.stack.indexOf("@") ? "@unknown:0:0" : ""
            }
        return `
` + hs + e + $o
    }
    var gs = !1;
    function vs(e, t) {
        if (!e || gs)
            return "";
        gs = !0;
        var a = Error.prepareStackTrace;
        Error.prepareStackTrace = void 0;
        try {
            var n = {
                DetermineComponentFrameRoot: function() {
                    try {
                        if (t) {
                            var U = function() {
                                throw Error()
                            };
                            if (Object.defineProperty(U.prototype, "props", {
                                set: function() {
                                    throw Error()
                                }
                            }),
                            typeof Reflect == "object" && Reflect.construct) {
                                try {
                                    Reflect.construct(U, [])
                                } catch (j) {
                                    var K = j
                                }
                                Reflect.construct(e, [], U)
                            } else {
                                try {
                                    U.call()
                                } catch (j) {
                                    K = j
                                }
                                e.call(U.prototype)
                            }
                        } else {
                            try {
                                throw Error()
                            } catch (j) {
                                K = j
                            }
                            (U = e()) && typeof U.catch == "function" && U.catch(function() {})
                        }
                    } catch (j) {
                        if (j && K && typeof j.stack == "string")
                            return [j.stack, K.stack]
                    }
                    return [null, null]
                }
            };
            n.DetermineComponentFrameRoot.displayName = "DetermineComponentFrameRoot";
            var l = Object.getOwnPropertyDescriptor(n.DetermineComponentFrameRoot, "name");
            l && l.configurable && Object.defineProperty(n.DetermineComponentFrameRoot, "name", {
                value: "DetermineComponentFrameRoot"
            });
            var i = n.DetermineComponentFrameRoot()
              , r = i[0]
              , m = i[1];
            if (r && m) {
                var b = r.split(`
`)
                  , R = m.split(`
`);
                for (l = n = 0; n < b.length && !b[n].includes("DetermineComponentFrameRoot"); )
                    n++;
                for (; l < R.length && !R[l].includes("DetermineComponentFrameRoot"); )
                    l++;
                if (n === b.length || l === R.length)
                    for (n = b.length - 1,
                    l = R.length - 1; 1 <= n && 0 <= l && b[n] !== R[l]; )
                        l--;
                for (; 1 <= n && 0 <= l; n--,
                l--)
                    if (b[n] !== R[l]) {
                        if (n !== 1 || l !== 1)
                            do
                                if (n--,
                                l--,
                                0 > l || b[n] !== R[l]) {
                                    var M = `
` + b[n].replace(" at new ", " at ");
                                    return e.displayName && M.includes("<anonymous>") && (M = M.replace("<anonymous>", e.displayName)),
                                    M
                                }
                            while (1 <= n && 0 <= l);
                        break
                    }
            }
        } finally {
            gs = !1,
            Error.prepareStackTrace = a
        }
        return (a = e ? e.displayName || e.name : "") ? Da(a) : ""
    }
    function Wf(e, t) {
        switch (e.tag) {
        case 26:
        case 27:
        case 5:
            return Da(e.type);
        case 16:
            return Da("Lazy");
        case 13:
            return e.child !== t && t !== null ? Da("Suspense Fallback") : Da("Suspense");
        case 19:
            return Da("SuspenseList");
        case 0:
        case 15:
            return vs(e.type, !1);
        case 11:
            return vs(e.type.render, !1);
        case 1:
            return vs(e.type, !0);
        case 31:
            return Da("Activity");
        default:
            return ""
        }
    }
    function eu(e) {
        try {
            var t = ""
              , a = null;
            do
                t += Wf(e, a),
                a = e,
                e = e.return;
            while (e);
            return t
        } catch (n) {
            return `
Error generating stack: ` + n.message + `
` + n.stack
        }
    }
    var bs = Object.prototype.hasOwnProperty
      , xs = s.unstable_scheduleCallback
      , Ss = s.unstable_cancelCallback
      , $f = s.unstable_shouldYield
      , em = s.unstable_requestPaint
      , dt = s.unstable_now
      , tm = s.unstable_getCurrentPriorityLevel
      , tu = s.unstable_ImmediatePriority
      , au = s.unstable_UserBlockingPriority
      , Il = s.unstable_NormalPriority
      , am = s.unstable_LowPriority
      , nu = s.unstable_IdlePriority
      , nm = s.log
      , lm = s.unstable_setDisableYieldValue
      , Vn = null
      , pt = null;
    function ia(e) {
        if (typeof nm == "function" && lm(e),
        pt && typeof pt.setStrictMode == "function")
            try {
                pt.setStrictMode(Vn, e)
            } catch {}
    }
    var ft = Math.clz32 ? Math.clz32 : cm
      , im = Math.log
      , sm = Math.LN2;
    function cm(e) {
        return e >>>= 0,
        e === 0 ? 32 : 31 - (im(e) / sm | 0) | 0
    }
    var Zl = 256
      , Fl = 262144
      , Jl = 4194304;
    function ja(e) {
        var t = e & 42;
        if (t !== 0)
            return t;
        switch (e & -e) {
        case 1:
            return 1;
        case 2:
            return 2;
        case 4:
            return 4;
        case 8:
            return 8;
        case 16:
            return 16;
        case 32:
            return 32;
        case 64:
            return 64;
        case 128:
            return 128;
        case 256:
        case 512:
        case 1024:
        case 2048:
        case 4096:
        case 8192:
        case 16384:
        case 32768:
        case 65536:
        case 131072:
            return e & 261888;
        case 262144:
        case 524288:
        case 1048576:
        case 2097152:
            return e & 3932160;
        case 4194304:
        case 8388608:
        case 16777216:
        case 33554432:
            return e & 62914560;
        case 67108864:
            return 67108864;
        case 134217728:
            return 134217728;
        case 268435456:
            return 268435456;
        case 536870912:
            return 536870912;
        case 1073741824:
            return 0;
        default:
            return e
        }
    }
    function Wl(e, t, a) {
        var n = e.pendingLanes;
        if (n === 0)
            return 0;
        var l = 0
          , i = e.suspendedLanes
          , r = e.pingedLanes;
        e = e.warmLanes;
        var m = n & 134217727;
        return m !== 0 ? (n = m & ~i,
        n !== 0 ? l = ja(n) : (r &= m,
        r !== 0 ? l = ja(r) : a || (a = m & ~e,
        a !== 0 && (l = ja(a))))) : (m = n & ~i,
        m !== 0 ? l = ja(m) : r !== 0 ? l = ja(r) : a || (a = n & ~e,
        a !== 0 && (l = ja(a)))),
        l === 0 ? 0 : t !== 0 && t !== l && (t & i) === 0 && (i = l & -l,
        a = t & -t,
        i >= a || i === 32 && (a & 4194048) !== 0) ? t : l
    }
    function Qn(e, t) {
        return (e.pendingLanes & ~(e.suspendedLanes & ~e.pingedLanes) & t) === 0
    }
    function om(e, t) {
        switch (e) {
        case 1:
        case 2:
        case 4:
        case 8:
        case 64:
            return t + 250;
        case 16:
        case 32:
        case 128:
        case 256:
        case 512:
        case 1024:
        case 2048:
        case 4096:
        case 8192:
        case 16384:
        case 32768:
        case 65536:
        case 131072:
        case 262144:
        case 524288:
        case 1048576:
        case 2097152:
            return t + 5e3;
        case 4194304:
        case 8388608:
        case 16777216:
        case 33554432:
            return -1;
        case 67108864:
        case 134217728:
        case 268435456:
        case 536870912:
        case 1073741824:
            return -1;
        default:
            return -1
        }
    }
    function lu() {
        var e = Jl;
        return Jl <<= 1,
        (Jl & 62914560) === 0 && (Jl = 4194304),
        e
    }
    function ks(e) {
        for (var t = [], a = 0; 31 > a; a++)
            t.push(e);
        return t
    }
    function In(e, t) {
        e.pendingLanes |= t,
        t !== 268435456 && (e.suspendedLanes = 0,
        e.pingedLanes = 0,
        e.warmLanes = 0)
    }
    function um(e, t, a, n, l, i) {
        var r = e.pendingLanes;
        e.pendingLanes = a,
        e.suspendedLanes = 0,
        e.pingedLanes = 0,
        e.warmLanes = 0,
        e.expiredLanes &= a,
        e.entangledLanes &= a,
        e.errorRecoveryDisabledLanes &= a,
        e.shellSuspendCounter = 0;
        var m = e.entanglements
          , b = e.expirationTimes
          , R = e.hiddenUpdates;
        for (a = r & ~a; 0 < a; ) {
            var M = 31 - ft(a)
              , U = 1 << M;
            m[M] = 0,
            b[M] = -1;
            var K = R[M];
            if (K !== null)
                for (R[M] = null,
                M = 0; M < K.length; M++) {
                    var j = K[M];
                    j !== null && (j.lane &= -536870913)
                }
            a &= ~U
        }
        n !== 0 && iu(e, n, 0),
        i !== 0 && l === 0 && e.tag !== 0 && (e.suspendedLanes |= i & ~(r & ~t))
    }
    function iu(e, t, a) {
        e.pendingLanes |= t,
        e.suspendedLanes &= ~t;
        var n = 31 - ft(t);
        e.entangledLanes |= t,
        e.entanglements[n] = e.entanglements[n] | 1073741824 | a & 261930
    }
    function su(e, t) {
        var a = e.entangledLanes |= t;
        for (e = e.entanglements; a; ) {
            var n = 31 - ft(a)
              , l = 1 << n;
            l & t | e[n] & t && (e[n] |= t),
            a &= ~l
        }
    }
    function cu(e, t) {
        var a = t & -t;
        return a = (a & 42) !== 0 ? 1 : ws(a),
        (a & (e.suspendedLanes | t)) !== 0 ? 0 : a
    }
    function ws(e) {
        switch (e) {
        case 2:
            e = 1;
            break;
        case 8:
            e = 4;
            break;
        case 32:
            e = 16;
            break;
        case 256:
        case 512:
        case 1024:
        case 2048:
        case 4096:
        case 8192:
        case 16384:
        case 32768:
        case 65536:
        case 131072:
        case 262144:
        case 524288:
        case 1048576:
        case 2097152:
        case 4194304:
        case 8388608:
        case 16777216:
        case 33554432:
            e = 128;
            break;
        case 268435456:
            e = 134217728;
            break;
        default:
            e = 0
        }
        return e
    }
    function Es(e) {
        return e &= -e,
        2 < e ? 8 < e ? (e & 134217727) !== 0 ? 32 : 268435456 : 8 : 2
    }
    function ou() {
        var e = Y.p;
        return e !== 0 ? e : (e = window.event,
        e === void 0 ? 32 : Qp(e.type))
    }
    function uu(e, t) {
        var a = Y.p;
        try {
            return Y.p = e,
            t()
        } finally {
            Y.p = a
        }
    }
    var sa = Math.random().toString(36).slice(2)
      , Ze = "__reactFiber$" + sa
      , lt = "__reactProps$" + sa
      , $a = "__reactContainer$" + sa
      , Ls = "__reactEvents$" + sa
      , rm = "__reactListeners$" + sa
      , dm = "__reactHandles$" + sa
      , ru = "__reactResources$" + sa
      , Zn = "__reactMarker$" + sa;
    function As(e) {
        delete e[Ze],
        delete e[lt],
        delete e[Ls],
        delete e[rm],
        delete e[dm]
    }
    function en(e) {
        var t = e[Ze];
        if (t)
            return t;
        for (var a = e.parentNode; a; ) {
            if (t = a[$a] || a[Ze]) {
                if (a = t.alternate,
                t.child !== null || a !== null && a.child !== null)
                    for (e = Kp(e); e !== null; ) {
                        if (a = e[Ze])
                            return a;
                        e = Kp(e)
                    }
                return t
            }
            e = a,
            a = e.parentNode
        }
        return null
    }
    function tn(e) {
        if (e = e[Ze] || e[$a]) {
            var t = e.tag;
            if (t === 5 || t === 6 || t === 13 || t === 31 || t === 26 || t === 27 || t === 3)
                return e
        }
        return null
    }
    function Fn(e) {
        var t = e.tag;
        if (t === 5 || t === 26 || t === 27 || t === 6)
            return e.stateNode;
        throw Error(o(33))
    }
    function an(e) {
        var t = e[ru];
        return t || (t = e[ru] = {
            hoistableStyles: new Map,
            hoistableScripts: new Map
        }),
        t
    }
    function Qe(e) {
        e[Zn] = !0
    }
    var du = new Set
      , pu = {};
    function Ma(e, t) {
        nn(e, t),
        nn(e + "Capture", t)
    }
    function nn(e, t) {
        for (pu[e] = t,
        e = 0; e < t.length; e++)
            du.add(t[e])
    }
    var pm = RegExp("^[:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD][:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD\\-.0-9\\u00B7\\u0300-\\u036F\\u203F-\\u2040]*$")
      , fu = {}
      , mu = {};
    function fm(e) {
        return bs.call(mu, e) ? !0 : bs.call(fu, e) ? !1 : pm.test(e) ? mu[e] = !0 : (fu[e] = !0,
        !1)
    }
    function $l(e, t, a) {
        if (fm(t))
            if (a === null)
                e.removeAttribute(t);
            else {
                switch (typeof a) {
                case "undefined":
                case "function":
                case "symbol":
                    e.removeAttribute(t);
                    return;
                case "boolean":
                    var n = t.toLowerCase().slice(0, 5);
                    if (n !== "data-" && n !== "aria-") {
                        e.removeAttribute(t);
                        return
                    }
                }
                e.setAttribute(t, "" + a)
            }
    }
    function ei(e, t, a) {
        if (a === null)
            e.removeAttribute(t);
        else {
            switch (typeof a) {
            case "undefined":
            case "function":
            case "symbol":
            case "boolean":
                e.removeAttribute(t);
                return
            }
            e.setAttribute(t, "" + a)
        }
    }
    function Ut(e, t, a, n) {
        if (n === null)
            e.removeAttribute(a);
        else {
            switch (typeof n) {
            case "undefined":
            case "function":
            case "symbol":
            case "boolean":
                e.removeAttribute(a);
                return
            }
            e.setAttributeNS(t, a, "" + n)
        }
    }
    function St(e) {
        switch (typeof e) {
        case "bigint":
        case "boolean":
        case "number":
        case "string":
        case "undefined":
            return e;
        case "object":
            return e;
        default:
            return ""
        }
    }
    function yu(e) {
        var t = e.type;
        return (e = e.nodeName) && e.toLowerCase() === "input" && (t === "checkbox" || t === "radio")
    }
    function mm(e, t, a) {
        var n = Object.getOwnPropertyDescriptor(e.constructor.prototype, t);
        if (!e.hasOwnProperty(t) && typeof n < "u" && typeof n.get == "function" && typeof n.set == "function") {
            var l = n.get
              , i = n.set;
            return Object.defineProperty(e, t, {
                configurable: !0,
                get: function() {
                    return l.call(this)
                },
                set: function(r) {
                    a = "" + r,
                    i.call(this, r)
                }
            }),
            Object.defineProperty(e, t, {
                enumerable: n.enumerable
            }),
            {
                getValue: function() {
                    return a
                },
                setValue: function(r) {
                    a = "" + r
                },
                stopTracking: function() {
                    e._valueTracker = null,
                    delete e[t]
                }
            }
        }
    }
    function Ts(e) {
        if (!e._valueTracker) {
            var t = yu(e) ? "checked" : "value";
            e._valueTracker = mm(e, t, "" + e[t])
        }
    }
    function hu(e) {
        if (!e)
            return !1;
        var t = e._valueTracker;
        if (!t)
            return !0;
        var a = t.getValue()
          , n = "";
        return e && (n = yu(e) ? e.checked ? "true" : "false" : e.value),
        e = n,
        e !== a ? (t.setValue(e),
        !0) : !1
    }
    function ti(e) {
        if (e = e || (typeof document < "u" ? document : void 0),
        typeof e > "u")
            return null;
        try {
            return e.activeElement || e.body
        } catch {
            return e.body
        }
    }
    var ym = /[\n"\\]/g;
    function kt(e) {
        return e.replace(ym, function(t) {
            return "\\" + t.charCodeAt(0).toString(16) + " "
        })
    }
    function Ns(e, t, a, n, l, i, r, m) {
        e.name = "",
        r != null && typeof r != "function" && typeof r != "symbol" && typeof r != "boolean" ? e.type = r : e.removeAttribute("type"),
        t != null ? r === "number" ? (t === 0 && e.value === "" || e.value != t) && (e.value = "" + St(t)) : e.value !== "" + St(t) && (e.value = "" + St(t)) : r !== "submit" && r !== "reset" || e.removeAttribute("value"),
        t != null ? Cs(e, r, St(t)) : a != null ? Cs(e, r, St(a)) : n != null && e.removeAttribute("value"),
        l == null && i != null && (e.defaultChecked = !!i),
        l != null && (e.checked = l && typeof l != "function" && typeof l != "symbol"),
        m != null && typeof m != "function" && typeof m != "symbol" && typeof m != "boolean" ? e.name = "" + St(m) : e.removeAttribute("name")
    }
    function gu(e, t, a, n, l, i, r, m) {
        if (i != null && typeof i != "function" && typeof i != "symbol" && typeof i != "boolean" && (e.type = i),
        t != null || a != null) {
            if (!(i !== "submit" && i !== "reset" || t != null)) {
                Ts(e);
                return
            }
            a = a != null ? "" + St(a) : "",
            t = t != null ? "" + St(t) : a,
            m || t === e.value || (e.value = t),
            e.defaultValue = t
        }
        n = n ?? l,
        n = typeof n != "function" && typeof n != "symbol" && !!n,
        e.checked = m ? e.checked : !!n,
        e.defaultChecked = !!n,
        r != null && typeof r != "function" && typeof r != "symbol" && typeof r != "boolean" && (e.name = r),
        Ts(e)
    }
    function Cs(e, t, a) {
        t === "number" && ti(e.ownerDocument) === e || e.defaultValue === "" + a || (e.defaultValue = "" + a)
    }
    function ln(e, t, a, n) {
        if (e = e.options,
        t) {
            t = {};
            for (var l = 0; l < a.length; l++)
                t["$" + a[l]] = !0;
            for (a = 0; a < e.length; a++)
                l = t.hasOwnProperty("$" + e[a].value),
                e[a].selected !== l && (e[a].selected = l),
                l && n && (e[a].defaultSelected = !0)
        } else {
            for (a = "" + St(a),
            t = null,
            l = 0; l < e.length; l++) {
                if (e[l].value === a) {
                    e[l].selected = !0,
                    n && (e[l].defaultSelected = !0);
                    return
                }
                t !== null || e[l].disabled || (t = e[l])
            }
            t !== null && (t.selected = !0)
        }
    }
    function vu(e, t, a) {
        if (t != null && (t = "" + St(t),
        t !== e.value && (e.value = t),
        a == null)) {
            e.defaultValue !== t && (e.defaultValue = t);
            return
        }
        e.defaultValue = a != null ? "" + St(a) : ""
    }
    function bu(e, t, a, n) {
        if (t == null) {
            if (n != null) {
                if (a != null)
                    throw Error(o(92));
                if (W(n)) {
                    if (1 < n.length)
                        throw Error(o(93));
                    n = n[0]
                }
                a = n
            }
            a == null && (a = ""),
            t = a
        }
        a = St(t),
        e.defaultValue = a,
        n = e.textContent,
        n === a && n !== "" && n !== null && (e.value = n),
        Ts(e)
    }
    function sn(e, t) {
        if (t) {
            var a = e.firstChild;
            if (a && a === e.lastChild && a.nodeType === 3) {
                a.nodeValue = t;
                return
            }
        }
        e.textContent = t
    }
    var hm = new Set("animationIterationCount aspectRatio borderImageOutset borderImageSlice borderImageWidth boxFlex boxFlexGroup boxOrdinalGroup columnCount columns flex flexGrow flexPositive flexShrink flexNegative flexOrder gridArea gridRow gridRowEnd gridRowSpan gridRowStart gridColumn gridColumnEnd gridColumnSpan gridColumnStart fontWeight lineClamp lineHeight opacity order orphans scale tabSize widows zIndex zoom fillOpacity floodOpacity stopOpacity strokeDasharray strokeDashoffset strokeMiterlimit strokeOpacity strokeWidth MozAnimationIterationCount MozBoxFlex MozBoxFlexGroup MozLineClamp msAnimationIterationCount msFlex msZoom msFlexGrow msFlexNegative msFlexOrder msFlexPositive msFlexShrink msGridColumn msGridColumnSpan msGridRow msGridRowSpan WebkitAnimationIterationCount WebkitBoxFlex WebKitBoxFlexGroup WebkitBoxOrdinalGroup WebkitColumnCount WebkitColumns WebkitFlex WebkitFlexGrow WebkitFlexPositive WebkitFlexShrink WebkitLineClamp".split(" "));
    function xu(e, t, a) {
        var n = t.indexOf("--") === 0;
        a == null || typeof a == "boolean" || a === "" ? n ? e.setProperty(t, "") : t === "float" ? e.cssFloat = "" : e[t] = "" : n ? e.setProperty(t, a) : typeof a != "number" || a === 0 || hm.has(t) ? t === "float" ? e.cssFloat = a : e[t] = ("" + a).trim() : e[t] = a + "px"
    }
    function Su(e, t, a) {
        if (t != null && typeof t != "object")
            throw Error(o(62));
        if (e = e.style,
        a != null) {
            for (var n in a)
                !a.hasOwnProperty(n) || t != null && t.hasOwnProperty(n) || (n.indexOf("--") === 0 ? e.setProperty(n, "") : n === "float" ? e.cssFloat = "" : e[n] = "");
            for (var l in t)
                n = t[l],
                t.hasOwnProperty(l) && a[l] !== n && xu(e, l, n)
        } else
            for (var i in t)
                t.hasOwnProperty(i) && xu(e, i, t[i])
    }
    function Rs(e) {
        if (e.indexOf("-") === -1)
            return !1;
        switch (e) {
        case "annotation-xml":
        case "color-profile":
        case "font-face":
        case "font-face-src":
        case "font-face-uri":
        case "font-face-format":
        case "font-face-name":
        case "missing-glyph":
            return !1;
        default:
            return !0
        }
    }
    var gm = new Map([["acceptCharset", "accept-charset"], ["htmlFor", "for"], ["httpEquiv", "http-equiv"], ["crossOrigin", "crossorigin"], ["accentHeight", "accent-height"], ["alignmentBaseline", "alignment-baseline"], ["arabicForm", "arabic-form"], ["baselineShift", "baseline-shift"], ["capHeight", "cap-height"], ["clipPath", "clip-path"], ["clipRule", "clip-rule"], ["colorInterpolation", "color-interpolation"], ["colorInterpolationFilters", "color-interpolation-filters"], ["colorProfile", "color-profile"], ["colorRendering", "color-rendering"], ["dominantBaseline", "dominant-baseline"], ["enableBackground", "enable-background"], ["fillOpacity", "fill-opacity"], ["fillRule", "fill-rule"], ["floodColor", "flood-color"], ["floodOpacity", "flood-opacity"], ["fontFamily", "font-family"], ["fontSize", "font-size"], ["fontSizeAdjust", "font-size-adjust"], ["fontStretch", "font-stretch"], ["fontStyle", "font-style"], ["fontVariant", "font-variant"], ["fontWeight", "font-weight"], ["glyphName", "glyph-name"], ["glyphOrientationHorizontal", "glyph-orientation-horizontal"], ["glyphOrientationVertical", "glyph-orientation-vertical"], ["horizAdvX", "horiz-adv-x"], ["horizOriginX", "horiz-origin-x"], ["imageRendering", "image-rendering"], ["letterSpacing", "letter-spacing"], ["lightingColor", "lighting-color"], ["markerEnd", "marker-end"], ["markerMid", "marker-mid"], ["markerStart", "marker-start"], ["overlinePosition", "overline-position"], ["overlineThickness", "overline-thickness"], ["paintOrder", "paint-order"], ["panose-1", "panose-1"], ["pointerEvents", "pointer-events"], ["renderingIntent", "rendering-intent"], ["shapeRendering", "shape-rendering"], ["stopColor", "stop-color"], ["stopOpacity", "stop-opacity"], ["strikethroughPosition", "strikethrough-position"], ["strikethroughThickness", "strikethrough-thickness"], ["strokeDasharray", "stroke-dasharray"], ["strokeDashoffset", "stroke-dashoffset"], ["strokeLinecap", "stroke-linecap"], ["strokeLinejoin", "stroke-linejoin"], ["strokeMiterlimit", "stroke-miterlimit"], ["strokeOpacity", "stroke-opacity"], ["strokeWidth", "stroke-width"], ["textAnchor", "text-anchor"], ["textDecoration", "text-decoration"], ["textRendering", "text-rendering"], ["transformOrigin", "transform-origin"], ["underlinePosition", "underline-position"], ["underlineThickness", "underline-thickness"], ["unicodeBidi", "unicode-bidi"], ["unicodeRange", "unicode-range"], ["unitsPerEm", "units-per-em"], ["vAlphabetic", "v-alphabetic"], ["vHanging", "v-hanging"], ["vIdeographic", "v-ideographic"], ["vMathematical", "v-mathematical"], ["vectorEffect", "vector-effect"], ["vertAdvY", "vert-adv-y"], ["vertOriginX", "vert-origin-x"], ["vertOriginY", "vert-origin-y"], ["wordSpacing", "word-spacing"], ["writingMode", "writing-mode"], ["xmlnsXlink", "xmlns:xlink"], ["xHeight", "x-height"]])
      , vm = /^[\u0000-\u001F ]*j[\r\n\t]*a[\r\n\t]*v[\r\n\t]*a[\r\n\t]*s[\r\n\t]*c[\r\n\t]*r[\r\n\t]*i[\r\n\t]*p[\r\n\t]*t[\r\n\t]*:/i;
    function ai(e) {
        return vm.test("" + e) ? "javascript:throw new Error('React has blocked a javascript: URL as a security precaution.')" : e
    }
    function Yt() {}
    var Ks = null;
    function Ds(e) {
        return e = e.target || e.srcElement || window,
        e.correspondingUseElement && (e = e.correspondingUseElement),
        e.nodeType === 3 ? e.parentNode : e
    }
    var cn = null
      , on = null;
    function ku(e) {
        var t = tn(e);
        if (t && (e = t.stateNode)) {
            var a = e[lt] || null;
            e: switch (e = t.stateNode,
            t.type) {
            case "input":
                if (Ns(e, a.value, a.defaultValue, a.defaultValue, a.checked, a.defaultChecked, a.type, a.name),
                t = a.name,
                a.type === "radio" && t != null) {
                    for (a = e; a.parentNode; )
                        a = a.parentNode;
                    for (a = a.querySelectorAll('input[name="' + kt("" + t) + '"][type="radio"]'),
                    t = 0; t < a.length; t++) {
                        var n = a[t];
                        if (n !== e && n.form === e.form) {
                            var l = n[lt] || null;
                            if (!l)
                                throw Error(o(90));
                            Ns(n, l.value, l.defaultValue, l.defaultValue, l.checked, l.defaultChecked, l.type, l.name)
                        }
                    }
                    for (t = 0; t < a.length; t++)
                        n = a[t],
                        n.form === e.form && hu(n)
                }
                break e;
            case "textarea":
                vu(e, a.value, a.defaultValue);
                break e;
            case "select":
                t = a.value,
                t != null && ln(e, !!a.multiple, t, !1)
            }
        }
    }
    var js = !1;
    function wu(e, t, a) {
        if (js)
            return e(t, a);
        js = !0;
        try {
            var n = e(t);
            return n
        } finally {
            if (js = !1,
            (cn !== null || on !== null) && (qi(),
            cn && (t = cn,
            e = on,
            on = cn = null,
            ku(t),
            e)))
                for (t = 0; t < e.length; t++)
                    ku(e[t])
        }
    }
    function Jn(e, t) {
        var a = e.stateNode;
        if (a === null)
            return null;
        var n = a[lt] || null;
        if (n === null)
            return null;
        a = n[t];
        e: switch (t) {
        case "onClick":
        case "onClickCapture":
        case "onDoubleClick":
        case "onDoubleClickCapture":
        case "onMouseDown":
        case "onMouseDownCapture":
        case "onMouseMove":
        case "onMouseMoveCapture":
        case "onMouseUp":
        case "onMouseUpCapture":
        case "onMouseEnter":
            (n = !n.disabled) || (e = e.type,
            n = !(e === "button" || e === "input" || e === "select" || e === "textarea")),
            e = !n;
            break e;
        default:
            e = !1
        }
        if (e)
            return null;
        if (a && typeof a != "function")
            throw Error(o(231, t, typeof a));
        return a
    }
    var Gt = !(typeof window > "u" || typeof window.document > "u" || typeof window.document.createElement > "u")
      , Ms = !1;
    if (Gt)
        try {
            var Wn = {};
            Object.defineProperty(Wn, "passive", {
                get: function() {
                    Ms = !0
                }
            }),
            window.addEventListener("test", Wn, Wn),
            window.removeEventListener("test", Wn, Wn)
        } catch {
            Ms = !1
        }
    var ca = null
      , _s = null
      , ni = null;
    function Eu() {
        if (ni)
            return ni;
        var e, t = _s, a = t.length, n, l = "value"in ca ? ca.value : ca.textContent, i = l.length;
        for (e = 0; e < a && t[e] === l[e]; e++)
            ;
        var r = a - e;
        for (n = 1; n <= r && t[a - n] === l[i - n]; n++)
            ;
        return ni = l.slice(e, 1 < n ? 1 - n : void 0)
    }
    function li(e) {
        var t = e.keyCode;
        return "charCode"in e ? (e = e.charCode,
        e === 0 && t === 13 && (e = 13)) : e = t,
        e === 10 && (e = 13),
        32 <= e || e === 13 ? e : 0
    }
    function ii() {
        return !0
    }
    function Lu() {
        return !1
    }
    function it(e) {
        function t(a, n, l, i, r) {
            this._reactName = a,
            this._targetInst = l,
            this.type = n,
            this.nativeEvent = i,
            this.target = r,
            this.currentTarget = null;
            for (var m in e)
                e.hasOwnProperty(m) && (a = e[m],
                this[m] = a ? a(i) : i[m]);
            return this.isDefaultPrevented = (i.defaultPrevented != null ? i.defaultPrevented : i.returnValue === !1) ? ii : Lu,
            this.isPropagationStopped = Lu,
            this
        }
        return k(t.prototype, {
            preventDefault: function() {
                this.defaultPrevented = !0;
                var a = this.nativeEvent;
                a && (a.preventDefault ? a.preventDefault() : typeof a.returnValue != "unknown" && (a.returnValue = !1),
                this.isDefaultPrevented = ii)
            },
            stopPropagation: function() {
                var a = this.nativeEvent;
                a && (a.stopPropagation ? a.stopPropagation() : typeof a.cancelBubble != "unknown" && (a.cancelBubble = !0),
                this.isPropagationStopped = ii)
            },
            persist: function() {},
            isPersistent: ii
        }),
        t
    }
    var _a = {
        eventPhase: 0,
        bubbles: 0,
        cancelable: 0,
        timeStamp: function(e) {
            return e.timeStamp || Date.now()
        },
        defaultPrevented: 0,
        isTrusted: 0
    }, si = it(_a), $n = k({}, _a, {
        view: 0,
        detail: 0
    }), bm = it($n), Bs, Os, el, ci = k({}, $n, {
        screenX: 0,
        screenY: 0,
        clientX: 0,
        clientY: 0,
        pageX: 0,
        pageY: 0,
        ctrlKey: 0,
        shiftKey: 0,
        altKey: 0,
        metaKey: 0,
        getModifierState: Hs,
        button: 0,
        buttons: 0,
        relatedTarget: function(e) {
            return e.relatedTarget === void 0 ? e.fromElement === e.srcElement ? e.toElement : e.fromElement : e.relatedTarget
        },
        movementX: function(e) {
            return "movementX"in e ? e.movementX : (e !== el && (el && e.type === "mousemove" ? (Bs = e.screenX - el.screenX,
            Os = e.screenY - el.screenY) : Os = Bs = 0,
            el = e),
            Bs)
        },
        movementY: function(e) {
            return "movementY"in e ? e.movementY : Os
        }
    }), Au = it(ci), xm = k({}, ci, {
        dataTransfer: 0
    }), Sm = it(xm), km = k({}, $n, {
        relatedTarget: 0
    }), zs = it(km), wm = k({}, _a, {
        animationName: 0,
        elapsedTime: 0,
        pseudoElement: 0
    }), Em = it(wm), Lm = k({}, _a, {
        clipboardData: function(e) {
            return "clipboardData"in e ? e.clipboardData : window.clipboardData
        }
    }), Am = it(Lm), Tm = k({}, _a, {
        data: 0
    }), Tu = it(Tm), Nm = {
        Esc: "Escape",
        Spacebar: " ",
        Left: "ArrowLeft",
        Up: "ArrowUp",
        Right: "ArrowRight",
        Down: "ArrowDown",
        Del: "Delete",
        Win: "OS",
        Menu: "ContextMenu",
        Apps: "ContextMenu",
        Scroll: "ScrollLock",
        MozPrintableKey: "Unidentified"
    }, Cm = {
        8: "Backspace",
        9: "Tab",
        12: "Clear",
        13: "Enter",
        16: "Shift",
        17: "Control",
        18: "Alt",
        19: "Pause",
        20: "CapsLock",
        27: "Escape",
        32: " ",
        33: "PageUp",
        34: "PageDown",
        35: "End",
        36: "Home",
        37: "ArrowLeft",
        38: "ArrowUp",
        39: "ArrowRight",
        40: "ArrowDown",
        45: "Insert",
        46: "Delete",
        112: "F1",
        113: "F2",
        114: "F3",
        115: "F4",
        116: "F5",
        117: "F6",
        118: "F7",
        119: "F8",
        120: "F9",
        121: "F10",
        122: "F11",
        123: "F12",
        144: "NumLock",
        145: "ScrollLock",
        224: "Meta"
    }, Rm = {
        Alt: "altKey",
        Control: "ctrlKey",
        Meta: "metaKey",
        Shift: "shiftKey"
    };
    function Km(e) {
        var t = this.nativeEvent;
        return t.getModifierState ? t.getModifierState(e) : (e = Rm[e]) ? !!t[e] : !1
    }
    function Hs() {
        return Km
    }
    var Dm = k({}, $n, {
        key: function(e) {
            if (e.key) {
                var t = Nm[e.key] || e.key;
                if (t !== "Unidentified")
                    return t
            }
            return e.type === "keypress" ? (e = li(e),
            e === 13 ? "Enter" : String.fromCharCode(e)) : e.type === "keydown" || e.type === "keyup" ? Cm[e.keyCode] || "Unidentified" : ""
        },
        code: 0,
        location: 0,
        ctrlKey: 0,
        shiftKey: 0,
        altKey: 0,
        metaKey: 0,
        repeat: 0,
        locale: 0,
        getModifierState: Hs,
        charCode: function(e) {
            return e.type === "keypress" ? li(e) : 0
        },
        keyCode: function(e) {
            return e.type === "keydown" || e.type === "keyup" ? e.keyCode : 0
        },
        which: function(e) {
            return e.type === "keypress" ? li(e) : e.type === "keydown" || e.type === "keyup" ? e.keyCode : 0
        }
    })
      , jm = it(Dm)
      , Mm = k({}, ci, {
        pointerId: 0,
        width: 0,
        height: 0,
        pressure: 0,
        tangentialPressure: 0,
        tiltX: 0,
        tiltY: 0,
        twist: 0,
        pointerType: 0,
        isPrimary: 0
    })
      , Nu = it(Mm)
      , _m = k({}, $n, {
        touches: 0,
        targetTouches: 0,
        changedTouches: 0,
        altKey: 0,
        metaKey: 0,
        ctrlKey: 0,
        shiftKey: 0,
        getModifierState: Hs
    })
      , Bm = it(_m)
      , Om = k({}, _a, {
        propertyName: 0,
        elapsedTime: 0,
        pseudoElement: 0
    })
      , zm = it(Om)
      , Hm = k({}, ci, {
        deltaX: function(e) {
            return "deltaX"in e ? e.deltaX : "wheelDeltaX"in e ? -e.wheelDeltaX : 0
        },
        deltaY: function(e) {
            return "deltaY"in e ? e.deltaY : "wheelDeltaY"in e ? -e.wheelDeltaY : "wheelDelta"in e ? -e.wheelDelta : 0
        },
        deltaZ: 0,
        deltaMode: 0
    })
      , Um = it(Hm)
      , Ym = k({}, _a, {
        newState: 0,
        oldState: 0
    })
      , Gm = it(Ym)
      , qm = [9, 13, 27, 32]
      , Us = Gt && "CompositionEvent"in window
      , tl = null;
    Gt && "documentMode"in document && (tl = document.documentMode);
    var Pm = Gt && "TextEvent"in window && !tl
      , Cu = Gt && (!Us || tl && 8 < tl && 11 >= tl)
      , Ru = " "
      , Ku = !1;
    function Du(e, t) {
        switch (e) {
        case "keyup":
            return qm.indexOf(t.keyCode) !== -1;
        case "keydown":
            return t.keyCode !== 229;
        case "keypress":
        case "mousedown":
        case "focusout":
            return !0;
        default:
            return !1
        }
    }
    function ju(e) {
        return e = e.detail,
        typeof e == "object" && "data"in e ? e.data : null
    }
    var un = !1;
    function Xm(e, t) {
        switch (e) {
        case "compositionend":
            return ju(t);
        case "keypress":
            return t.which !== 32 ? null : (Ku = !0,
            Ru);
        case "textInput":
            return e = t.data,
            e === Ru && Ku ? null : e;
        default:
            return null
        }
    }
    function Vm(e, t) {
        if (un)
            return e === "compositionend" || !Us && Du(e, t) ? (e = Eu(),
            ni = _s = ca = null,
            un = !1,
            e) : null;
        switch (e) {
        case "paste":
            return null;
        case "keypress":
            if (!(t.ctrlKey || t.altKey || t.metaKey) || t.ctrlKey && t.altKey) {
                if (t.char && 1 < t.char.length)
                    return t.char;
                if (t.which)
                    return String.fromCharCode(t.which)
            }
            return null;
        case "compositionend":
            return Cu && t.locale !== "ko" ? null : t.data;
        default:
            return null
        }
    }
    var Qm = {
        color: !0,
        date: !0,
        datetime: !0,
        "datetime-local": !0,
        email: !0,
        month: !0,
        number: !0,
        password: !0,
        range: !0,
        search: !0,
        tel: !0,
        text: !0,
        time: !0,
        url: !0,
        week: !0
    };
    function Mu(e) {
        var t = e && e.nodeName && e.nodeName.toLowerCase();
        return t === "input" ? !!Qm[e.type] : t === "textarea"
    }
    function _u(e, t, a, n) {
        cn ? on ? on.push(n) : on = [n] : cn = n,
        t = Fi(t, "onChange"),
        0 < t.length && (a = new si("onChange","change",null,a,n),
        e.push({
            event: a,
            listeners: t
        }))
    }
    var al = null
      , nl = null;
    function Im(e) {
        gp(e, 0)
    }
    function oi(e) {
        var t = Fn(e);
        if (hu(t))
            return e
    }
    function Bu(e, t) {
        if (e === "change")
            return t
    }
    var Ou = !1;
    if (Gt) {
        var Ys;
        if (Gt) {
            var Gs = "oninput"in document;
            if (!Gs) {
                var zu = document.createElement("div");
                zu.setAttribute("oninput", "return;"),
                Gs = typeof zu.oninput == "function"
            }
            Ys = Gs
        } else
            Ys = !1;
        Ou = Ys && (!document.documentMode || 9 < document.documentMode)
    }
    function Hu() {
        al && (al.detachEvent("onpropertychange", Uu),
        nl = al = null)
    }
    function Uu(e) {
        if (e.propertyName === "value" && oi(nl)) {
            var t = [];
            _u(t, nl, e, Ds(e)),
            wu(Im, t)
        }
    }
    function Zm(e, t, a) {
        e === "focusin" ? (Hu(),
        al = t,
        nl = a,
        al.attachEvent("onpropertychange", Uu)) : e === "focusout" && Hu()
    }
    function Fm(e) {
        if (e === "selectionchange" || e === "keyup" || e === "keydown")
            return oi(nl)
    }
    function Jm(e, t) {
        if (e === "click")
            return oi(t)
    }
    function Wm(e, t) {
        if (e === "input" || e === "change")
            return oi(t)
    }
    function $m(e, t) {
        return e === t && (e !== 0 || 1 / e === 1 / t) || e !== e && t !== t
    }
    var mt = typeof Object.is == "function" ? Object.is : $m;
    function ll(e, t) {
        if (mt(e, t))
            return !0;
        if (typeof e != "object" || e === null || typeof t != "object" || t === null)
            return !1;
        var a = Object.keys(e)
          , n = Object.keys(t);
        if (a.length !== n.length)
            return !1;
        for (n = 0; n < a.length; n++) {
            var l = a[n];
            if (!bs.call(t, l) || !mt(e[l], t[l]))
                return !1
        }
        return !0
    }
    function Yu(e) {
        for (; e && e.firstChild; )
            e = e.firstChild;
        return e
    }
    function Gu(e, t) {
        var a = Yu(e);
        e = 0;
        for (var n; a; ) {
            if (a.nodeType === 3) {
                if (n = e + a.textContent.length,
                e <= t && n >= t)
                    return {
                        node: a,
                        offset: t - e
                    };
                e = n
            }
            e: {
                for (; a; ) {
                    if (a.nextSibling) {
                        a = a.nextSibling;
                        break e
                    }
                    a = a.parentNode
                }
                a = void 0
            }
            a = Yu(a)
        }
    }
    function qu(e, t) {
        return e && t ? e === t ? !0 : e && e.nodeType === 3 ? !1 : t && t.nodeType === 3 ? qu(e, t.parentNode) : "contains"in e ? e.contains(t) : e.compareDocumentPosition ? !!(e.compareDocumentPosition(t) & 16) : !1 : !1
    }
    function Pu(e) {
        e = e != null && e.ownerDocument != null && e.ownerDocument.defaultView != null ? e.ownerDocument.defaultView : window;
        for (var t = ti(e.document); t instanceof e.HTMLIFrameElement; ) {
            try {
                var a = typeof t.contentWindow.location.href == "string"
            } catch {
                a = !1
            }
            if (a)
                e = t.contentWindow;
            else
                break;
            t = ti(e.document)
        }
        return t
    }
    function qs(e) {
        var t = e && e.nodeName && e.nodeName.toLowerCase();
        return t && (t === "input" && (e.type === "text" || e.type === "search" || e.type === "tel" || e.type === "url" || e.type === "password") || t === "textarea" || e.contentEditable === "true")
    }
    var ey = Gt && "documentMode"in document && 11 >= document.documentMode
      , rn = null
      , Ps = null
      , il = null
      , Xs = !1;
    function Xu(e, t, a) {
        var n = a.window === a ? a.document : a.nodeType === 9 ? a : a.ownerDocument;
        Xs || rn == null || rn !== ti(n) || (n = rn,
        "selectionStart"in n && qs(n) ? n = {
            start: n.selectionStart,
            end: n.selectionEnd
        } : (n = (n.ownerDocument && n.ownerDocument.defaultView || window).getSelection(),
        n = {
            anchorNode: n.anchorNode,
            anchorOffset: n.anchorOffset,
            focusNode: n.focusNode,
            focusOffset: n.focusOffset
        }),
        il && ll(il, n) || (il = n,
        n = Fi(Ps, "onSelect"),
        0 < n.length && (t = new si("onSelect","select",null,t,a),
        e.push({
            event: t,
            listeners: n
        }),
        t.target = rn)))
    }
    function Ba(e, t) {
        var a = {};
        return a[e.toLowerCase()] = t.toLowerCase(),
        a["Webkit" + e] = "webkit" + t,
        a["Moz" + e] = "moz" + t,
        a
    }
    var dn = {
        animationend: Ba("Animation", "AnimationEnd"),
        animationiteration: Ba("Animation", "AnimationIteration"),
        animationstart: Ba("Animation", "AnimationStart"),
        transitionrun: Ba("Transition", "TransitionRun"),
        transitionstart: Ba("Transition", "TransitionStart"),
        transitioncancel: Ba("Transition", "TransitionCancel"),
        transitionend: Ba("Transition", "TransitionEnd")
    }
      , Vs = {}
      , Vu = {};
    Gt && (Vu = document.createElement("div").style,
    "AnimationEvent"in window || (delete dn.animationend.animation,
    delete dn.animationiteration.animation,
    delete dn.animationstart.animation),
    "TransitionEvent"in window || delete dn.transitionend.transition);
    function Oa(e) {
        if (Vs[e])
            return Vs[e];
        if (!dn[e])
            return e;
        var t = dn[e], a;
        for (a in t)
            if (t.hasOwnProperty(a) && a in Vu)
                return Vs[e] = t[a];
        return e
    }
    var Qu = Oa("animationend")
      , Iu = Oa("animationiteration")
      , Zu = Oa("animationstart")
      , ty = Oa("transitionrun")
      , ay = Oa("transitionstart")
      , ny = Oa("transitioncancel")
      , Fu = Oa("transitionend")
      , Ju = new Map
      , Qs = "abort auxClick beforeToggle cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel".split(" ");
    Qs.push("scrollEnd");
    function Dt(e, t) {
        Ju.set(e, t),
        Ma(t, [e])
    }
    var ui = typeof reportError == "function" ? reportError : function(e) {
        if (typeof window == "object" && typeof window.ErrorEvent == "function") {
            var t = new window.ErrorEvent("error",{
                bubbles: !0,
                cancelable: !0,
                message: typeof e == "object" && e !== null && typeof e.message == "string" ? String(e.message) : String(e),
                error: e
            });
            if (!window.dispatchEvent(t))
                return
        } else if (typeof process == "object" && typeof process.emit == "function") {
            process.emit("uncaughtException", e);
            return
        }
        console.error(e)
    }
      , wt = []
      , pn = 0
      , Is = 0;
    function ri() {
        for (var e = pn, t = Is = pn = 0; t < e; ) {
            var a = wt[t];
            wt[t++] = null;
            var n = wt[t];
            wt[t++] = null;
            var l = wt[t];
            wt[t++] = null;
            var i = wt[t];
            if (wt[t++] = null,
            n !== null && l !== null) {
                var r = n.pending;
                r === null ? l.next = l : (l.next = r.next,
                r.next = l),
                n.pending = l
            }
            i !== 0 && Wu(a, l, i)
        }
    }
    function di(e, t, a, n) {
        wt[pn++] = e,
        wt[pn++] = t,
        wt[pn++] = a,
        wt[pn++] = n,
        Is |= n,
        e.lanes |= n,
        e = e.alternate,
        e !== null && (e.lanes |= n)
    }
    function Zs(e, t, a, n) {
        return di(e, t, a, n),
        pi(e)
    }
    function za(e, t) {
        return di(e, null, null, t),
        pi(e)
    }
    function Wu(e, t, a) {
        e.lanes |= a;
        var n = e.alternate;
        n !== null && (n.lanes |= a);
        for (var l = !1, i = e.return; i !== null; )
            i.childLanes |= a,
            n = i.alternate,
            n !== null && (n.childLanes |= a),
            i.tag === 22 && (e = i.stateNode,
            e === null || e._visibility & 1 || (l = !0)),
            e = i,
            i = i.return;
        return e.tag === 3 ? (i = e.stateNode,
        l && t !== null && (l = 31 - ft(a),
        e = i.hiddenUpdates,
        n = e[l],
        n === null ? e[l] = [t] : n.push(t),
        t.lane = a | 536870912),
        i) : null
    }
    function pi(e) {
        if (50 < Tl)
            throw Tl = 0,
            lo = null,
            Error(o(185));
        for (var t = e.return; t !== null; )
            e = t,
            t = e.return;
        return e.tag === 3 ? e.stateNode : null
    }
    var fn = {};
    function ly(e, t, a, n) {
        this.tag = e,
        this.key = a,
        this.sibling = this.child = this.return = this.stateNode = this.type = this.elementType = null,
        this.index = 0,
        this.refCleanup = this.ref = null,
        this.pendingProps = t,
        this.dependencies = this.memoizedState = this.updateQueue = this.memoizedProps = null,
        this.mode = n,
        this.subtreeFlags = this.flags = 0,
        this.deletions = null,
        this.childLanes = this.lanes = 0,
        this.alternate = null
    }
    function yt(e, t, a, n) {
        return new ly(e,t,a,n)
    }
    function Fs(e) {
        return e = e.prototype,
        !(!e || !e.isReactComponent)
    }
    function qt(e, t) {
        var a = e.alternate;
        return a === null ? (a = yt(e.tag, t, e.key, e.mode),
        a.elementType = e.elementType,
        a.type = e.type,
        a.stateNode = e.stateNode,
        a.alternate = e,
        e.alternate = a) : (a.pendingProps = t,
        a.type = e.type,
        a.flags = 0,
        a.subtreeFlags = 0,
        a.deletions = null),
        a.flags = e.flags & 65011712,
        a.childLanes = e.childLanes,
        a.lanes = e.lanes,
        a.child = e.child,
        a.memoizedProps = e.memoizedProps,
        a.memoizedState = e.memoizedState,
        a.updateQueue = e.updateQueue,
        t = e.dependencies,
        a.dependencies = t === null ? null : {
            lanes: t.lanes,
            firstContext: t.firstContext
        },
        a.sibling = e.sibling,
        a.index = e.index,
        a.ref = e.ref,
        a.refCleanup = e.refCleanup,
        a
    }
    function $u(e, t) {
        e.flags &= 65011714;
        var a = e.alternate;
        return a === null ? (e.childLanes = 0,
        e.lanes = t,
        e.child = null,
        e.subtreeFlags = 0,
        e.memoizedProps = null,
        e.memoizedState = null,
        e.updateQueue = null,
        e.dependencies = null,
        e.stateNode = null) : (e.childLanes = a.childLanes,
        e.lanes = a.lanes,
        e.child = a.child,
        e.subtreeFlags = 0,
        e.deletions = null,
        e.memoizedProps = a.memoizedProps,
        e.memoizedState = a.memoizedState,
        e.updateQueue = a.updateQueue,
        e.type = a.type,
        t = a.dependencies,
        e.dependencies = t === null ? null : {
            lanes: t.lanes,
            firstContext: t.firstContext
        }),
        e
    }
    function fi(e, t, a, n, l, i) {
        var r = 0;
        if (n = e,
        typeof e == "function")
            Fs(e) && (r = 1);
        else if (typeof e == "string")
            r = uh(e, a, ee.current) ? 26 : e === "html" || e === "head" || e === "body" ? 27 : 5;
        else
            e: switch (e) {
            case ve:
                return e = yt(31, a, t, l),
                e.elementType = ve,
                e.lanes = i,
                e;
            case S:
                return Ha(a.children, l, i, t);
            case D:
                r = 8,
                l |= 24;
                break;
            case z:
                return e = yt(12, a, t, l | 2),
                e.elementType = z,
                e.lanes = i,
                e;
            case Z:
                return e = yt(13, a, t, l),
                e.elementType = Z,
                e.lanes = i,
                e;
            case F:
                return e = yt(19, a, t, l),
                e.elementType = F,
                e.lanes = i,
                e;
            default:
                if (typeof e == "object" && e !== null)
                    switch (e.$$typeof) {
                    case G:
                        r = 10;
                        break e;
                    case V:
                        r = 9;
                        break e;
                    case X:
                        r = 11;
                        break e;
                    case q:
                        r = 14;
                        break e;
                    case le:
                        r = 16,
                        n = null;
                        break e
                    }
                r = 29,
                a = Error(o(130, e === null ? "null" : typeof e, "")),
                n = null
            }
        return t = yt(r, a, t, l),
        t.elementType = e,
        t.type = n,
        t.lanes = i,
        t
    }
    function Ha(e, t, a, n) {
        return e = yt(7, e, n, t),
        e.lanes = a,
        e
    }
    function Js(e, t, a) {
        return e = yt(6, e, null, t),
        e.lanes = a,
        e
    }
    function er(e) {
        var t = yt(18, null, null, 0);
        return t.stateNode = e,
        t
    }
    function Ws(e, t, a) {
        return t = yt(4, e.children !== null ? e.children : [], e.key, t),
        t.lanes = a,
        t.stateNode = {
            containerInfo: e.containerInfo,
            pendingChildren: null,
            implementation: e.implementation
        },
        t
    }
    var tr = new WeakMap;
    function Et(e, t) {
        if (typeof e == "object" && e !== null) {
            var a = tr.get(e);
            return a !== void 0 ? a : (t = {
                value: e,
                source: t,
                stack: eu(t)
            },
            tr.set(e, t),
            t)
        }
        return {
            value: e,
            source: t,
            stack: eu(t)
        }
    }
    var mn = []
      , yn = 0
      , mi = null
      , sl = 0
      , Lt = []
      , At = 0
      , oa = null
      , Bt = 1
      , Ot = "";
    function Pt(e, t) {
        mn[yn++] = sl,
        mn[yn++] = mi,
        mi = e,
        sl = t
    }
    function ar(e, t, a) {
        Lt[At++] = Bt,
        Lt[At++] = Ot,
        Lt[At++] = oa,
        oa = e;
        var n = Bt;
        e = Ot;
        var l = 32 - ft(n) - 1;
        n &= ~(1 << l),
        a += 1;
        var i = 32 - ft(t) + l;
        if (30 < i) {
            var r = l - l % 5;
            i = (n & (1 << r) - 1).toString(32),
            n >>= r,
            l -= r,
            Bt = 1 << 32 - ft(t) + l | a << l | n,
            Ot = i + e
        } else
            Bt = 1 << i | a << l | n,
            Ot = e
    }
    function $s(e) {
        e.return !== null && (Pt(e, 1),
        ar(e, 1, 0))
    }
    function ec(e) {
        for (; e === mi; )
            mi = mn[--yn],
            mn[yn] = null,
            sl = mn[--yn],
            mn[yn] = null;
        for (; e === oa; )
            oa = Lt[--At],
            Lt[At] = null,
            Ot = Lt[--At],
            Lt[At] = null,
            Bt = Lt[--At],
            Lt[At] = null
    }
    function nr(e, t) {
        Lt[At++] = Bt,
        Lt[At++] = Ot,
        Lt[At++] = oa,
        Bt = t.id,
        Ot = t.overflow,
        oa = e
    }
    var Fe = null
      , Ke = null
      , ge = !1
      , ua = null
      , Tt = !1
      , tc = Error(o(519));
    function ra(e) {
        var t = Error(o(418, 1 < arguments.length && arguments[1] !== void 0 && arguments[1] ? "text" : "HTML", ""));
        throw cl(Et(t, e)),
        tc
    }
    function lr(e) {
        var t = e.stateNode
          , a = e.type
          , n = e.memoizedProps;
        switch (t[Ze] = e,
        t[lt] = n,
        a) {
        case "dialog":
            pe("cancel", t),
            pe("close", t);
            break;
        case "iframe":
        case "object":
        case "embed":
            pe("load", t);
            break;
        case "video":
        case "audio":
            for (a = 0; a < Cl.length; a++)
                pe(Cl[a], t);
            break;
        case "source":
            pe("error", t);
            break;
        case "img":
        case "image":
        case "link":
            pe("error", t),
            pe("load", t);
            break;
        case "details":
            pe("toggle", t);
            break;
        case "input":
            pe("invalid", t),
            gu(t, n.value, n.defaultValue, n.checked, n.defaultChecked, n.type, n.name, !0);
            break;
        case "select":
            pe("invalid", t);
            break;
        case "textarea":
            pe("invalid", t),
            bu(t, n.value, n.defaultValue, n.children)
        }
        a = n.children,
        typeof a != "string" && typeof a != "number" && typeof a != "bigint" || t.textContent === "" + a || n.suppressHydrationWarning === !0 || Sp(t.textContent, a) ? (n.popover != null && (pe("beforetoggle", t),
        pe("toggle", t)),
        n.onScroll != null && pe("scroll", t),
        n.onScrollEnd != null && pe("scrollend", t),
        n.onClick != null && (t.onclick = Yt),
        t = !0) : t = !1,
        t || ra(e, !0)
    }
    function ir(e) {
        for (Fe = e.return; Fe; )
            switch (Fe.tag) {
            case 5:
            case 31:
            case 13:
                Tt = !1;
                return;
            case 27:
            case 3:
                Tt = !0;
                return;
            default:
                Fe = Fe.return
            }
    }
    function hn(e) {
        if (e !== Fe)
            return !1;
        if (!ge)
            return ir(e),
            ge = !0,
            !1;
        var t = e.tag, a;
        if ((a = t !== 3 && t !== 27) && ((a = t === 5) && (a = e.type,
        a = !(a !== "form" && a !== "button") || xo(e.type, e.memoizedProps)),
        a = !a),
        a && Ke && ra(e),
        ir(e),
        t === 13) {
            if (e = e.memoizedState,
            e = e !== null ? e.dehydrated : null,
            !e)
                throw Error(o(317));
            Ke = Rp(e)
        } else if (t === 31) {
            if (e = e.memoizedState,
            e = e !== null ? e.dehydrated : null,
            !e)
                throw Error(o(317));
            Ke = Rp(e)
        } else
            t === 27 ? (t = Ke,
            Ea(e.type) ? (e = Lo,
            Lo = null,
            Ke = e) : Ke = t) : Ke = Fe ? Ct(e.stateNode.nextSibling) : null;
        return !0
    }
    function Ua() {
        Ke = Fe = null,
        ge = !1
    }
    function ac() {
        var e = ua;
        return e !== null && (ut === null ? ut = e : ut.push.apply(ut, e),
        ua = null),
        e
    }
    function cl(e) {
        ua === null ? ua = [e] : ua.push(e)
    }
    var nc = L(null)
      , Ya = null
      , Xt = null;
    function da(e, t, a) {
        I(nc, t._currentValue),
        t._currentValue = a
    }
    function Vt(e) {
        e._currentValue = nc.current,
        B(nc)
    }
    function lc(e, t, a) {
        for (; e !== null; ) {
            var n = e.alternate;
            if ((e.childLanes & t) !== t ? (e.childLanes |= t,
            n !== null && (n.childLanes |= t)) : n !== null && (n.childLanes & t) !== t && (n.childLanes |= t),
            e === a)
                break;
            e = e.return
        }
    }
    function ic(e, t, a, n) {
        var l = e.child;
        for (l !== null && (l.return = e); l !== null; ) {
            var i = l.dependencies;
            if (i !== null) {
                var r = l.child;
                i = i.firstContext;
                e: for (; i !== null; ) {
                    var m = i;
                    i = l;
                    for (var b = 0; b < t.length; b++)
                        if (m.context === t[b]) {
                            i.lanes |= a,
                            m = i.alternate,
                            m !== null && (m.lanes |= a),
                            lc(i.return, a, e),
                            n || (r = null);
                            break e
                        }
                    i = m.next
                }
            } else if (l.tag === 18) {
                if (r = l.return,
                r === null)
                    throw Error(o(341));
                r.lanes |= a,
                i = r.alternate,
                i !== null && (i.lanes |= a),
                lc(r, a, e),
                r = null
            } else
                r = l.child;
            if (r !== null)
                r.return = l;
            else
                for (r = l; r !== null; ) {
                    if (r === e) {
                        r = null;
                        break
                    }
                    if (l = r.sibling,
                    l !== null) {
                        l.return = r.return,
                        r = l;
                        break
                    }
                    r = r.return
                }
            l = r
        }
    }
    function gn(e, t, a, n) {
        e = null;
        for (var l = t, i = !1; l !== null; ) {
            if (!i) {
                if ((l.flags & 524288) !== 0)
                    i = !0;
                else if ((l.flags & 262144) !== 0)
                    break
            }
            if (l.tag === 10) {
                var r = l.alternate;
                if (r === null)
                    throw Error(o(387));
                if (r = r.memoizedProps,
                r !== null) {
                    var m = l.type;
                    mt(l.pendingProps.value, r.value) || (e !== null ? e.push(m) : e = [m])
                }
            } else if (l === ke.current) {
                if (r = l.alternate,
                r === null)
                    throw Error(o(387));
                r.memoizedState.memoizedState !== l.memoizedState.memoizedState && (e !== null ? e.push(Ml) : e = [Ml])
            }
            l = l.return
        }
        e !== null && ic(t, e, a, n),
        t.flags |= 262144
    }
    function yi(e) {
        for (e = e.firstContext; e !== null; ) {
            if (!mt(e.context._currentValue, e.memoizedValue))
                return !0;
            e = e.next
        }
        return !1
    }
    function Ga(e) {
        Ya = e,
        Xt = null,
        e = e.dependencies,
        e !== null && (e.firstContext = null)
    }
    function Je(e) {
        return sr(Ya, e)
    }
    function hi(e, t) {
        return Ya === null && Ga(e),
        sr(e, t)
    }
    function sr(e, t) {
        var a = t._currentValue;
        if (t = {
            context: t,
            memoizedValue: a,
            next: null
        },
        Xt === null) {
            if (e === null)
                throw Error(o(308));
            Xt = t,
            e.dependencies = {
                lanes: 0,
                firstContext: t
            },
            e.flags |= 524288
        } else
            Xt = Xt.next = t;
        return a
    }
    var iy = typeof AbortController < "u" ? AbortController : function() {
        var e = []
          , t = this.signal = {
            aborted: !1,
            addEventListener: function(a, n) {
                e.push(n)
            }
        };
        this.abort = function() {
            t.aborted = !0,
            e.forEach(function(a) {
                return a()
            })
        }
    }
      , sy = s.unstable_scheduleCallback
      , cy = s.unstable_NormalPriority
      , Ye = {
        $$typeof: G,
        Consumer: null,
        Provider: null,
        _currentValue: null,
        _currentValue2: null,
        _threadCount: 0
    };
    function sc() {
        return {
            controller: new iy,
            data: new Map,
            refCount: 0
        }
    }
    function ol(e) {
        e.refCount--,
        e.refCount === 0 && sy(cy, function() {
            e.controller.abort()
        })
    }
    var ul = null
      , cc = 0
      , vn = 0
      , bn = null;
    function oy(e, t) {
        if (ul === null) {
            var a = ul = [];
            cc = 0,
            vn = ro(),
            bn = {
                status: "pending",
                value: void 0,
                then: function(n) {
                    a.push(n)
                }
            }
        }
        return cc++,
        t.then(cr, cr),
        t
    }
    function cr() {
        if (--cc === 0 && ul !== null) {
            bn !== null && (bn.status = "fulfilled");
            var e = ul;
            ul = null,
            vn = 0,
            bn = null;
            for (var t = 0; t < e.length; t++)
                (0,
                e[t])()
        }
    }
    function uy(e, t) {
        var a = []
          , n = {
            status: "pending",
            value: null,
            reason: null,
            then: function(l) {
                a.push(l)
            }
        };
        return e.then(function() {
            n.status = "fulfilled",
            n.value = t;
            for (var l = 0; l < a.length; l++)
                (0,
                a[l])(t)
        }, function(l) {
            for (n.status = "rejected",
            n.reason = l,
            l = 0; l < a.length; l++)
                (0,
                a[l])(void 0)
        }),
        n
    }
    var or = N.S;
    N.S = function(e, t) {
        Xd = dt(),
        typeof t == "object" && t !== null && typeof t.then == "function" && oy(e, t),
        or !== null && or(e, t)
    }
    ;
    var qa = L(null);
    function oc() {
        var e = qa.current;
        return e !== null ? e : Ce.pooledCache
    }
    function gi(e, t) {
        t === null ? I(qa, qa.current) : I(qa, t.pool)
    }
    function ur() {
        var e = oc();
        return e === null ? null : {
            parent: Ye._currentValue,
            pool: e
        }
    }
    var xn = Error(o(460))
      , uc = Error(o(474))
      , vi = Error(o(542))
      , bi = {
        then: function() {}
    };
    function rr(e) {
        return e = e.status,
        e === "fulfilled" || e === "rejected"
    }
    function dr(e, t, a) {
        switch (a = e[a],
        a === void 0 ? e.push(t) : a !== t && (t.then(Yt, Yt),
        t = a),
        t.status) {
        case "fulfilled":
            return t.value;
        case "rejected":
            throw e = t.reason,
            fr(e),
            e;
        default:
            if (typeof t.status == "string")
                t.then(Yt, Yt);
            else {
                if (e = Ce,
                e !== null && 100 < e.shellSuspendCounter)
                    throw Error(o(482));
                e = t,
                e.status = "pending",
                e.then(function(n) {
                    if (t.status === "pending") {
                        var l = t;
                        l.status = "fulfilled",
                        l.value = n
                    }
                }, function(n) {
                    if (t.status === "pending") {
                        var l = t;
                        l.status = "rejected",
                        l.reason = n
                    }
                })
            }
            switch (t.status) {
            case "fulfilled":
                return t.value;
            case "rejected":
                throw e = t.reason,
                fr(e),
                e
            }
            throw Xa = t,
            xn
        }
    }
    function Pa(e) {
        try {
            var t = e._init;
            return t(e._payload)
        } catch (a) {
            throw a !== null && typeof a == "object" && typeof a.then == "function" ? (Xa = a,
            xn) : a
        }
    }
    var Xa = null;
    function pr() {
        if (Xa === null)
            throw Error(o(459));
        var e = Xa;
        return Xa = null,
        e
    }
    function fr(e) {
        if (e === xn || e === vi)
            throw Error(o(483))
    }
    var Sn = null
      , rl = 0;
    function xi(e) {
        var t = rl;
        return rl += 1,
        Sn === null && (Sn = []),
        dr(Sn, e, t)
    }
    function dl(e, t) {
        t = t.props.ref,
        e.ref = t !== void 0 ? t : null
    }
    function Si(e, t) {
        throw t.$$typeof === A ? Error(o(525)) : (e = Object.prototype.toString.call(t),
        Error(o(31, e === "[object Object]" ? "object with keys {" + Object.keys(t).join(", ") + "}" : e)))
    }
    function mr(e) {
        function t(T, E) {
            if (e) {
                var C = T.deletions;
                C === null ? (T.deletions = [E],
                T.flags |= 16) : C.push(E)
            }
        }
        function a(T, E) {
            if (!e)
                return null;
            for (; E !== null; )
                t(T, E),
                E = E.sibling;
            return null
        }
        function n(T) {
            for (var E = new Map; T !== null; )
                T.key !== null ? E.set(T.key, T) : E.set(T.index, T),
                T = T.sibling;
            return E
        }
        function l(T, E) {
            return T = qt(T, E),
            T.index = 0,
            T.sibling = null,
            T
        }
        function i(T, E, C) {
            return T.index = C,
            e ? (C = T.alternate,
            C !== null ? (C = C.index,
            C < E ? (T.flags |= 67108866,
            E) : C) : (T.flags |= 67108866,
            E)) : (T.flags |= 1048576,
            E)
        }
        function r(T) {
            return e && T.alternate === null && (T.flags |= 67108866),
            T
        }
        function m(T, E, C, H) {
            return E === null || E.tag !== 6 ? (E = Js(C, T.mode, H),
            E.return = T,
            E) : (E = l(E, C),
            E.return = T,
            E)
        }
        function b(T, E, C, H) {
            var ne = C.type;
            return ne === S ? M(T, E, C.props.children, H, C.key) : E !== null && (E.elementType === ne || typeof ne == "object" && ne !== null && ne.$$typeof === le && Pa(ne) === E.type) ? (E = l(E, C.props),
            dl(E, C),
            E.return = T,
            E) : (E = fi(C.type, C.key, C.props, null, T.mode, H),
            dl(E, C),
            E.return = T,
            E)
        }
        function R(T, E, C, H) {
            return E === null || E.tag !== 4 || E.stateNode.containerInfo !== C.containerInfo || E.stateNode.implementation !== C.implementation ? (E = Ws(C, T.mode, H),
            E.return = T,
            E) : (E = l(E, C.children || []),
            E.return = T,
            E)
        }
        function M(T, E, C, H, ne) {
            return E === null || E.tag !== 7 ? (E = Ha(C, T.mode, H, ne),
            E.return = T,
            E) : (E = l(E, C),
            E.return = T,
            E)
        }
        function U(T, E, C) {
            if (typeof E == "string" && E !== "" || typeof E == "number" || typeof E == "bigint")
                return E = Js("" + E, T.mode, C),
                E.return = T,
                E;
            if (typeof E == "object" && E !== null) {
                switch (E.$$typeof) {
                case v:
                    return C = fi(E.type, E.key, E.props, null, T.mode, C),
                    dl(C, E),
                    C.return = T,
                    C;
                case _:
                    return E = Ws(E, T.mode, C),
                    E.return = T,
                    E;
                case le:
                    return E = Pa(E),
                    U(T, E, C)
                }
                if (W(E) || J(E))
                    return E = Ha(E, T.mode, C, null),
                    E.return = T,
                    E;
                if (typeof E.then == "function")
                    return U(T, xi(E), C);
                if (E.$$typeof === G)
                    return U(T, hi(T, E), C);
                Si(T, E)
            }
            return null
        }
        function K(T, E, C, H) {
            var ne = E !== null ? E.key : null;
            if (typeof C == "string" && C !== "" || typeof C == "number" || typeof C == "bigint")
                return ne !== null ? null : m(T, E, "" + C, H);
            if (typeof C == "object" && C !== null) {
                switch (C.$$typeof) {
                case v:
                    return C.key === ne ? b(T, E, C, H) : null;
                case _:
                    return C.key === ne ? R(T, E, C, H) : null;
                case le:
                    return C = Pa(C),
                    K(T, E, C, H)
                }
                if (W(C) || J(C))
                    return ne !== null ? null : M(T, E, C, H, null);
                if (typeof C.then == "function")
                    return K(T, E, xi(C), H);
                if (C.$$typeof === G)
                    return K(T, E, hi(T, C), H);
                Si(T, C)
            }
            return null
        }
        function j(T, E, C, H, ne) {
            if (typeof H == "string" && H !== "" || typeof H == "number" || typeof H == "bigint")
                return T = T.get(C) || null,
                m(E, T, "" + H, ne);
            if (typeof H == "object" && H !== null) {
                switch (H.$$typeof) {
                case v:
                    return T = T.get(H.key === null ? C : H.key) || null,
                    b(E, T, H, ne);
                case _:
                    return T = T.get(H.key === null ? C : H.key) || null,
                    R(E, T, H, ne);
                case le:
                    return H = Pa(H),
                    j(T, E, C, H, ne)
                }
                if (W(H) || J(H))
                    return T = T.get(C) || null,
                    M(E, T, H, ne, null);
                if (typeof H.then == "function")
                    return j(T, E, C, xi(H), ne);
                if (H.$$typeof === G)
                    return j(T, E, C, hi(E, H), ne);
                Si(E, H)
            }
            return null
        }
        function $(T, E, C, H) {
            for (var ne = null, be = null, te = E, ue = E = 0, he = null; te !== null && ue < C.length; ue++) {
                te.index > ue ? (he = te,
                te = null) : he = te.sibling;
                var xe = K(T, te, C[ue], H);
                if (xe === null) {
                    te === null && (te = he);
                    break
                }
                e && te && xe.alternate === null && t(T, te),
                E = i(xe, E, ue),
                be === null ? ne = xe : be.sibling = xe,
                be = xe,
                te = he
            }
            if (ue === C.length)
                return a(T, te),
                ge && Pt(T, ue),
                ne;
            if (te === null) {
                for (; ue < C.length; ue++)
                    te = U(T, C[ue], H),
                    te !== null && (E = i(te, E, ue),
                    be === null ? ne = te : be.sibling = te,
                    be = te);
                return ge && Pt(T, ue),
                ne
            }
            for (te = n(te); ue < C.length; ue++)
                he = j(te, T, ue, C[ue], H),
                he !== null && (e && he.alternate !== null && te.delete(he.key === null ? ue : he.key),
                E = i(he, E, ue),
                be === null ? ne = he : be.sibling = he,
                be = he);
            return e && te.forEach(function(Ca) {
                return t(T, Ca)
            }),
            ge && Pt(T, ue),
            ne
        }
        function ie(T, E, C, H) {
            if (C == null)
                throw Error(o(151));
            for (var ne = null, be = null, te = E, ue = E = 0, he = null, xe = C.next(); te !== null && !xe.done; ue++,
            xe = C.next()) {
                te.index > ue ? (he = te,
                te = null) : he = te.sibling;
                var Ca = K(T, te, xe.value, H);
                if (Ca === null) {
                    te === null && (te = he);
                    break
                }
                e && te && Ca.alternate === null && t(T, te),
                E = i(Ca, E, ue),
                be === null ? ne = Ca : be.sibling = Ca,
                be = Ca,
                te = he
            }
            if (xe.done)
                return a(T, te),
                ge && Pt(T, ue),
                ne;
            if (te === null) {
                for (; !xe.done; ue++,
                xe = C.next())
                    xe = U(T, xe.value, H),
                    xe !== null && (E = i(xe, E, ue),
                    be === null ? ne = xe : be.sibling = xe,
                    be = xe);
                return ge && Pt(T, ue),
                ne
            }
            for (te = n(te); !xe.done; ue++,
            xe = C.next())
                xe = j(te, T, ue, xe.value, H),
                xe !== null && (e && xe.alternate !== null && te.delete(xe.key === null ? ue : xe.key),
                E = i(xe, E, ue),
                be === null ? ne = xe : be.sibling = xe,
                be = xe);
            return e && te.forEach(function(xh) {
                return t(T, xh)
            }),
            ge && Pt(T, ue),
            ne
        }
        function Te(T, E, C, H) {
            if (typeof C == "object" && C !== null && C.type === S && C.key === null && (C = C.props.children),
            typeof C == "object" && C !== null) {
                switch (C.$$typeof) {
                case v:
                    e: {
                        for (var ne = C.key; E !== null; ) {
                            if (E.key === ne) {
                                if (ne = C.type,
                                ne === S) {
                                    if (E.tag === 7) {
                                        a(T, E.sibling),
                                        H = l(E, C.props.children),
                                        H.return = T,
                                        T = H;
                                        break e
                                    }
                                } else if (E.elementType === ne || typeof ne == "object" && ne !== null && ne.$$typeof === le && Pa(ne) === E.type) {
                                    a(T, E.sibling),
                                    H = l(E, C.props),
                                    dl(H, C),
                                    H.return = T,
                                    T = H;
                                    break e
                                }
                                a(T, E);
                                break
                            } else
                                t(T, E);
                            E = E.sibling
                        }
                        C.type === S ? (H = Ha(C.props.children, T.mode, H, C.key),
                        H.return = T,
                        T = H) : (H = fi(C.type, C.key, C.props, null, T.mode, H),
                        dl(H, C),
                        H.return = T,
                        T = H)
                    }
                    return r(T);
                case _:
                    e: {
                        for (ne = C.key; E !== null; ) {
                            if (E.key === ne)
                                if (E.tag === 4 && E.stateNode.containerInfo === C.containerInfo && E.stateNode.implementation === C.implementation) {
                                    a(T, E.sibling),
                                    H = l(E, C.children || []),
                                    H.return = T,
                                    T = H;
                                    break e
                                } else {
                                    a(T, E);
                                    break
                                }
                            else
                                t(T, E);
                            E = E.sibling
                        }
                        H = Ws(C, T.mode, H),
                        H.return = T,
                        T = H
                    }
                    return r(T);
                case le:
                    return C = Pa(C),
                    Te(T, E, C, H)
                }
                if (W(C))
                    return $(T, E, C, H);
                if (J(C)) {
                    if (ne = J(C),
                    typeof ne != "function")
                        throw Error(o(150));
                    return C = ne.call(C),
                    ie(T, E, C, H)
                }
                if (typeof C.then == "function")
                    return Te(T, E, xi(C), H);
                if (C.$$typeof === G)
                    return Te(T, E, hi(T, C), H);
                Si(T, C)
            }
            return typeof C == "string" && C !== "" || typeof C == "number" || typeof C == "bigint" ? (C = "" + C,
            E !== null && E.tag === 6 ? (a(T, E.sibling),
            H = l(E, C),
            H.return = T,
            T = H) : (a(T, E),
            H = Js(C, T.mode, H),
            H.return = T,
            T = H),
            r(T)) : a(T, E)
        }
        return function(T, E, C, H) {
            try {
                rl = 0;
                var ne = Te(T, E, C, H);
                return Sn = null,
                ne
            } catch (te) {
                if (te === xn || te === vi)
                    throw te;
                var be = yt(29, te, null, T.mode);
                return be.lanes = H,
                be.return = T,
                be
            }
        }
    }
    var Va = mr(!0)
      , yr = mr(!1)
      , pa = !1;
    function rc(e) {
        e.updateQueue = {
            baseState: e.memoizedState,
            firstBaseUpdate: null,
            lastBaseUpdate: null,
            shared: {
                pending: null,
                lanes: 0,
                hiddenCallbacks: null
            },
            callbacks: null
        }
    }
    function dc(e, t) {
        e = e.updateQueue,
        t.updateQueue === e && (t.updateQueue = {
            baseState: e.baseState,
            firstBaseUpdate: e.firstBaseUpdate,
            lastBaseUpdate: e.lastBaseUpdate,
            shared: e.shared,
            callbacks: null
        })
    }
    function fa(e) {
        return {
            lane: e,
            tag: 0,
            payload: null,
            callback: null,
            next: null
        }
    }
    function ma(e, t, a) {
        var n = e.updateQueue;
        if (n === null)
            return null;
        if (n = n.shared,
        (Se & 2) !== 0) {
            var l = n.pending;
            return l === null ? t.next = t : (t.next = l.next,
            l.next = t),
            n.pending = t,
            t = pi(e),
            Wu(e, null, a),
            t
        }
        return di(e, n, t, a),
        pi(e)
    }
    function pl(e, t, a) {
        if (t = t.updateQueue,
        t !== null && (t = t.shared,
        (a & 4194048) !== 0)) {
            var n = t.lanes;
            n &= e.pendingLanes,
            a |= n,
            t.lanes = a,
            su(e, a)
        }
    }
    function pc(e, t) {
        var a = e.updateQueue
          , n = e.alternate;
        if (n !== null && (n = n.updateQueue,
        a === n)) {
            var l = null
              , i = null;
            if (a = a.firstBaseUpdate,
            a !== null) {
                do {
                    var r = {
                        lane: a.lane,
                        tag: a.tag,
                        payload: a.payload,
                        callback: null,
                        next: null
                    };
                    i === null ? l = i = r : i = i.next = r,
                    a = a.next
                } while (a !== null);
                i === null ? l = i = t : i = i.next = t
            } else
                l = i = t;
            a = {
                baseState: n.baseState,
                firstBaseUpdate: l,
                lastBaseUpdate: i,
                shared: n.shared,
                callbacks: n.callbacks
            },
            e.updateQueue = a;
            return
        }
        e = a.lastBaseUpdate,
        e === null ? a.firstBaseUpdate = t : e.next = t,
        a.lastBaseUpdate = t
    }
    var fc = !1;
    function fl() {
        if (fc) {
            var e = bn;
            if (e !== null)
                throw e
        }
    }
    function ml(e, t, a, n) {
        fc = !1;
        var l = e.updateQueue;
        pa = !1;
        var i = l.firstBaseUpdate
          , r = l.lastBaseUpdate
          , m = l.shared.pending;
        if (m !== null) {
            l.shared.pending = null;
            var b = m
              , R = b.next;
            b.next = null,
            r === null ? i = R : r.next = R,
            r = b;
            var M = e.alternate;
            M !== null && (M = M.updateQueue,
            m = M.lastBaseUpdate,
            m !== r && (m === null ? M.firstBaseUpdate = R : m.next = R,
            M.lastBaseUpdate = b))
        }
        if (i !== null) {
            var U = l.baseState;
            r = 0,
            M = R = b = null,
            m = i;
            do {
                var K = m.lane & -536870913
                  , j = K !== m.lane;
                if (j ? (ye & K) === K : (n & K) === K) {
                    K !== 0 && K === vn && (fc = !0),
                    M !== null && (M = M.next = {
                        lane: 0,
                        tag: m.tag,
                        payload: m.payload,
                        callback: null,
                        next: null
                    });
                    e: {
                        var $ = e
                          , ie = m;
                        K = t;
                        var Te = a;
                        switch (ie.tag) {
                        case 1:
                            if ($ = ie.payload,
                            typeof $ == "function") {
                                U = $.call(Te, U, K);
                                break e
                            }
                            U = $;
                            break e;
                        case 3:
                            $.flags = $.flags & -65537 | 128;
                        case 0:
                            if ($ = ie.payload,
                            K = typeof $ == "function" ? $.call(Te, U, K) : $,
                            K == null)
                                break e;
                            U = k({}, U, K);
                            break e;
                        case 2:
                            pa = !0
                        }
                    }
                    K = m.callback,
                    K !== null && (e.flags |= 64,
                    j && (e.flags |= 8192),
                    j = l.callbacks,
                    j === null ? l.callbacks = [K] : j.push(K))
                } else
                    j = {
                        lane: K,
                        tag: m.tag,
                        payload: m.payload,
                        callback: m.callback,
                        next: null
                    },
                    M === null ? (R = M = j,
                    b = U) : M = M.next = j,
                    r |= K;
                if (m = m.next,
                m === null) {
                    if (m = l.shared.pending,
                    m === null)
                        break;
                    j = m,
                    m = j.next,
                    j.next = null,
                    l.lastBaseUpdate = j,
                    l.shared.pending = null
                }
            } while (!0);
            M === null && (b = U),
            l.baseState = b,
            l.firstBaseUpdate = R,
            l.lastBaseUpdate = M,
            i === null && (l.shared.lanes = 0),
            ba |= r,
            e.lanes = r,
            e.memoizedState = U
        }
    }
    function hr(e, t) {
        if (typeof e != "function")
            throw Error(o(191, e));
        e.call(t)
    }
    function gr(e, t) {
        var a = e.callbacks;
        if (a !== null)
            for (e.callbacks = null,
            e = 0; e < a.length; e++)
                hr(a[e], t)
    }
    var kn = L(null)
      , ki = L(0);
    function vr(e, t) {
        e = ta,
        I(ki, e),
        I(kn, t),
        ta = e | t.baseLanes
    }
    function mc() {
        I(ki, ta),
        I(kn, kn.current)
    }
    function yc() {
        ta = ki.current,
        B(kn),
        B(ki)
    }
    var ht = L(null)
      , Nt = null;
    function ya(e) {
        var t = e.alternate;
        I(He, He.current & 1),
        I(ht, e),
        Nt === null && (t === null || kn.current !== null || t.memoizedState !== null) && (Nt = e)
    }
    function hc(e) {
        I(He, He.current),
        I(ht, e),
        Nt === null && (Nt = e)
    }
    function br(e) {
        e.tag === 22 ? (I(He, He.current),
        I(ht, e),
        Nt === null && (Nt = e)) : ha()
    }
    function ha() {
        I(He, He.current),
        I(ht, ht.current)
    }
    function gt(e) {
        B(ht),
        Nt === e && (Nt = null),
        B(He)
    }
    var He = L(0);
    function wi(e) {
        for (var t = e; t !== null; ) {
            if (t.tag === 13) {
                var a = t.memoizedState;
                if (a !== null && (a = a.dehydrated,
                a === null || wo(a) || Eo(a)))
                    return t
            } else if (t.tag === 19 && (t.memoizedProps.revealOrder === "forwards" || t.memoizedProps.revealOrder === "backwards" || t.memoizedProps.revealOrder === "unstable_legacy-backwards" || t.memoizedProps.revealOrder === "together")) {
                if ((t.flags & 128) !== 0)
                    return t
            } else if (t.child !== null) {
                t.child.return = t,
                t = t.child;
                continue
            }
            if (t === e)
                break;
            for (; t.sibling === null; ) {
                if (t.return === null || t.return === e)
                    return null;
                t = t.return
            }
            t.sibling.return = t.return,
            t = t.sibling
        }
        return null
    }
    var Qt = 0
      , oe = null
      , Le = null
      , Ge = null
      , Ei = !1
      , wn = !1
      , Qa = !1
      , Li = 0
      , yl = 0
      , En = null
      , ry = 0;
    function Be() {
        throw Error(o(321))
    }
    function gc(e, t) {
        if (t === null)
            return !1;
        for (var a = 0; a < t.length && a < e.length; a++)
            if (!mt(e[a], t[a]))
                return !1;
        return !0
    }
    function vc(e, t, a, n, l, i) {
        return Qt = i,
        oe = t,
        t.memoizedState = null,
        t.updateQueue = null,
        t.lanes = 0,
        N.H = e === null || e.memoizedState === null ? ad : jc,
        Qa = !1,
        i = a(n, l),
        Qa = !1,
        wn && (i = Sr(t, a, n, l)),
        xr(e),
        i
    }
    function xr(e) {
        N.H = vl;
        var t = Le !== null && Le.next !== null;
        if (Qt = 0,
        Ge = Le = oe = null,
        Ei = !1,
        yl = 0,
        En = null,
        t)
            throw Error(o(300));
        e === null || qe || (e = e.dependencies,
        e !== null && yi(e) && (qe = !0))
    }
    function Sr(e, t, a, n) {
        oe = e;
        var l = 0;
        do {
            if (wn && (En = null),
            yl = 0,
            wn = !1,
            25 <= l)
                throw Error(o(301));
            if (l += 1,
            Ge = Le = null,
            e.updateQueue != null) {
                var i = e.updateQueue;
                i.lastEffect = null,
                i.events = null,
                i.stores = null,
                i.memoCache != null && (i.memoCache.index = 0)
            }
            N.H = nd,
            i = t(a, n)
        } while (wn);
        return i
    }
    function dy() {
        var e = N.H
          , t = e.useState()[0];
        return t = typeof t.then == "function" ? hl(t) : t,
        e = e.useState()[0],
        (Le !== null ? Le.memoizedState : null) !== e && (oe.flags |= 1024),
        t
    }
    function bc() {
        var e = Li !== 0;
        return Li = 0,
        e
    }
    function xc(e, t, a) {
        t.updateQueue = e.updateQueue,
        t.flags &= -2053,
        e.lanes &= ~a
    }
    function Sc(e) {
        if (Ei) {
            for (e = e.memoizedState; e !== null; ) {
                var t = e.queue;
                t !== null && (t.pending = null),
                e = e.next
            }
            Ei = !1
        }
        Qt = 0,
        Ge = Le = oe = null,
        wn = !1,
        yl = Li = 0,
        En = null
    }
    function at() {
        var e = {
            memoizedState: null,
            baseState: null,
            baseQueue: null,
            queue: null,
            next: null
        };
        return Ge === null ? oe.memoizedState = Ge = e : Ge = Ge.next = e,
        Ge
    }
    function Ue() {
        if (Le === null) {
            var e = oe.alternate;
            e = e !== null ? e.memoizedState : null
        } else
            e = Le.next;
        var t = Ge === null ? oe.memoizedState : Ge.next;
        if (t !== null)
            Ge = t,
            Le = e;
        else {
            if (e === null)
                throw oe.alternate === null ? Error(o(467)) : Error(o(310));
            Le = e,
            e = {
                memoizedState: Le.memoizedState,
                baseState: Le.baseState,
                baseQueue: Le.baseQueue,
                queue: Le.queue,
                next: null
            },
            Ge === null ? oe.memoizedState = Ge = e : Ge = Ge.next = e
        }
        return Ge
    }
    function Ai() {
        return {
            lastEffect: null,
            events: null,
            stores: null,
            memoCache: null
        }
    }
    function hl(e) {
        var t = yl;
        return yl += 1,
        En === null && (En = []),
        e = dr(En, e, t),
        t = oe,
        (Ge === null ? t.memoizedState : Ge.next) === null && (t = t.alternate,
        N.H = t === null || t.memoizedState === null ? ad : jc),
        e
    }
    function Ti(e) {
        if (e !== null && typeof e == "object") {
            if (typeof e.then == "function")
                return hl(e);
            if (e.$$typeof === G)
                return Je(e)
        }
        throw Error(o(438, String(e)))
    }
    function kc(e) {
        var t = null
          , a = oe.updateQueue;
        if (a !== null && (t = a.memoCache),
        t == null) {
            var n = oe.alternate;
            n !== null && (n = n.updateQueue,
            n !== null && (n = n.memoCache,
            n != null && (t = {
                data: n.data.map(function(l) {
                    return l.slice()
                }),
                index: 0
            })))
        }
        if (t == null && (t = {
            data: [],
            index: 0
        }),
        a === null && (a = Ai(),
        oe.updateQueue = a),
        a.memoCache = t,
        a = t.data[t.index],
        a === void 0)
            for (a = t.data[t.index] = Array(e),
            n = 0; n < e; n++)
                a[n] = Ne;
        return t.index++,
        a
    }
    function It(e, t) {
        return typeof t == "function" ? t(e) : t
    }
    function Ni(e) {
        var t = Ue();
        return wc(t, Le, e)
    }
    function wc(e, t, a) {
        var n = e.queue;
        if (n === null)
            throw Error(o(311));
        n.lastRenderedReducer = a;
        var l = e.baseQueue
          , i = n.pending;
        if (i !== null) {
            if (l !== null) {
                var r = l.next;
                l.next = i.next,
                i.next = r
            }
            t.baseQueue = l = i,
            n.pending = null
        }
        if (i = e.baseState,
        l === null)
            e.memoizedState = i;
        else {
            t = l.next;
            var m = r = null
              , b = null
              , R = t
              , M = !1;
            do {
                var U = R.lane & -536870913;
                if (U !== R.lane ? (ye & U) === U : (Qt & U) === U) {
                    var K = R.revertLane;
                    if (K === 0)
                        b !== null && (b = b.next = {
                            lane: 0,
                            revertLane: 0,
                            gesture: null,
                            action: R.action,
                            hasEagerState: R.hasEagerState,
                            eagerState: R.eagerState,
                            next: null
                        }),
                        U === vn && (M = !0);
                    else if ((Qt & K) === K) {
                        R = R.next,
                        K === vn && (M = !0);
                        continue
                    } else
                        U = {
                            lane: 0,
                            revertLane: R.revertLane,
                            gesture: null,
                            action: R.action,
                            hasEagerState: R.hasEagerState,
                            eagerState: R.eagerState,
                            next: null
                        },
                        b === null ? (m = b = U,
                        r = i) : b = b.next = U,
                        oe.lanes |= K,
                        ba |= K;
                    U = R.action,
                    Qa && a(i, U),
                    i = R.hasEagerState ? R.eagerState : a(i, U)
                } else
                    K = {
                        lane: U,
                        revertLane: R.revertLane,
                        gesture: R.gesture,
                        action: R.action,
                        hasEagerState: R.hasEagerState,
                        eagerState: R.eagerState,
                        next: null
                    },
                    b === null ? (m = b = K,
                    r = i) : b = b.next = K,
                    oe.lanes |= U,
                    ba |= U;
                R = R.next
            } while (R !== null && R !== t);
            if (b === null ? r = i : b.next = m,
            !mt(i, e.memoizedState) && (qe = !0,
            M && (a = bn,
            a !== null)))
                throw a;
            e.memoizedState = i,
            e.baseState = r,
            e.baseQueue = b,
            n.lastRenderedState = i
        }
        return l === null && (n.lanes = 0),
        [e.memoizedState, n.dispatch]
    }
    function Ec(e) {
        var t = Ue()
          , a = t.queue;
        if (a === null)
            throw Error(o(311));
        a.lastRenderedReducer = e;
        var n = a.dispatch
          , l = a.pending
          , i = t.memoizedState;
        if (l !== null) {
            a.pending = null;
            var r = l = l.next;
            do
                i = e(i, r.action),
                r = r.next;
            while (r !== l);
            mt(i, t.memoizedState) || (qe = !0),
            t.memoizedState = i,
            t.baseQueue === null && (t.baseState = i),
            a.lastRenderedState = i
        }
        return [i, n]
    }
    function kr(e, t, a) {
        var n = oe
          , l = Ue()
          , i = ge;
        if (i) {
            if (a === void 0)
                throw Error(o(407));
            a = a()
        } else
            a = t();
        var r = !mt((Le || l).memoizedState, a);
        if (r && (l.memoizedState = a,
        qe = !0),
        l = l.queue,
        Tc(Lr.bind(null, n, l, e), [e]),
        l.getSnapshot !== t || r || Ge !== null && Ge.memoizedState.tag & 1) {
            if (n.flags |= 2048,
            Ln(9, {
                destroy: void 0
            }, Er.bind(null, n, l, a, t), null),
            Ce === null)
                throw Error(o(349));
            i || (Qt & 127) !== 0 || wr(n, t, a)
        }
        return a
    }
    function wr(e, t, a) {
        e.flags |= 16384,
        e = {
            getSnapshot: t,
            value: a
        },
        t = oe.updateQueue,
        t === null ? (t = Ai(),
        oe.updateQueue = t,
        t.stores = [e]) : (a = t.stores,
        a === null ? t.stores = [e] : a.push(e))
    }
    function Er(e, t, a, n) {
        t.value = a,
        t.getSnapshot = n,
        Ar(t) && Tr(e)
    }
    function Lr(e, t, a) {
        return a(function() {
            Ar(t) && Tr(e)
        })
    }
    function Ar(e) {
        var t = e.getSnapshot;
        e = e.value;
        try {
            var a = t();
            return !mt(e, a)
        } catch {
            return !0
        }
    }
    function Tr(e) {
        var t = za(e, 2);
        t !== null && rt(t, e, 2)
    }
    function Lc(e) {
        var t = at();
        if (typeof e == "function") {
            var a = e;
            if (e = a(),
            Qa) {
                ia(!0);
                try {
                    a()
                } finally {
                    ia(!1)
                }
            }
        }
        return t.memoizedState = t.baseState = e,
        t.queue = {
            pending: null,
            lanes: 0,
            dispatch: null,
            lastRenderedReducer: It,
            lastRenderedState: e
        },
        t
    }
    function Nr(e, t, a, n) {
        return e.baseState = a,
        wc(e, Le, typeof n == "function" ? n : It)
    }
    function py(e, t, a, n, l) {
        if (Ki(e))
            throw Error(o(485));
        if (e = t.action,
        e !== null) {
            var i = {
                payload: l,
                action: e,
                next: null,
                isTransition: !0,
                status: "pending",
                value: null,
                reason: null,
                listeners: [],
                then: function(r) {
                    i.listeners.push(r)
                }
            };
            N.T !== null ? a(!0) : i.isTransition = !1,
            n(i),
            a = t.pending,
            a === null ? (i.next = t.pending = i,
            Cr(t, i)) : (i.next = a.next,
            t.pending = a.next = i)
        }
    }
    function Cr(e, t) {
        var a = t.action
          , n = t.payload
          , l = e.state;
        if (t.isTransition) {
            var i = N.T
              , r = {};
            N.T = r;
            try {
                var m = a(l, n)
                  , b = N.S;
                b !== null && b(r, m),
                Rr(e, t, m)
            } catch (R) {
                Ac(e, t, R)
            } finally {
                i !== null && r.types !== null && (i.types = r.types),
                N.T = i
            }
        } else
            try {
                i = a(l, n),
                Rr(e, t, i)
            } catch (R) {
                Ac(e, t, R)
            }
    }
    function Rr(e, t, a) {
        a !== null && typeof a == "object" && typeof a.then == "function" ? a.then(function(n) {
            Kr(e, t, n)
        }, function(n) {
            return Ac(e, t, n)
        }) : Kr(e, t, a)
    }
    function Kr(e, t, a) {
        t.status = "fulfilled",
        t.value = a,
        Dr(t),
        e.state = a,
        t = e.pending,
        t !== null && (a = t.next,
        a === t ? e.pending = null : (a = a.next,
        t.next = a,
        Cr(e, a)))
    }
    function Ac(e, t, a) {
        var n = e.pending;
        if (e.pending = null,
        n !== null) {
            n = n.next;
            do
                t.status = "rejected",
                t.reason = a,
                Dr(t),
                t = t.next;
            while (t !== n)
        }
        e.action = null
    }
    function Dr(e) {
        e = e.listeners;
        for (var t = 0; t < e.length; t++)
            (0,
            e[t])()
    }
    function jr(e, t) {
        return t
    }
    function Mr(e, t) {
        if (ge) {
            var a = Ce.formState;
            if (a !== null) {
                e: {
                    var n = oe;
                    if (ge) {
                        if (Ke) {
                            t: {
                                for (var l = Ke, i = Tt; l.nodeType !== 8; ) {
                                    if (!i) {
                                        l = null;
                                        break t
                                    }
                                    if (l = Ct(l.nextSibling),
                                    l === null) {
                                        l = null;
                                        break t
                                    }
                                }
                                i = l.data,
                                l = i === "F!" || i === "F" ? l : null
                            }
                            if (l) {
                                Ke = Ct(l.nextSibling),
                                n = l.data === "F!";
                                break e
                            }
                        }
                        ra(n)
                    }
                    n = !1
                }
                n && (t = a[0])
            }
        }
        return a = at(),
        a.memoizedState = a.baseState = t,
        n = {
            pending: null,
            lanes: 0,
            dispatch: null,
            lastRenderedReducer: jr,
            lastRenderedState: t
        },
        a.queue = n,
        a = $r.bind(null, oe, n),
        n.dispatch = a,
        n = Lc(!1),
        i = Dc.bind(null, oe, !1, n.queue),
        n = at(),
        l = {
            state: t,
            dispatch: null,
            action: e,
            pending: null
        },
        n.queue = l,
        a = py.bind(null, oe, l, i, a),
        l.dispatch = a,
        n.memoizedState = e,
        [t, a, !1]
    }
    function _r(e) {
        var t = Ue();
        return Br(t, Le, e)
    }
    function Br(e, t, a) {
        if (t = wc(e, t, jr)[0],
        e = Ni(It)[0],
        typeof t == "object" && t !== null && typeof t.then == "function")
            try {
                var n = hl(t)
            } catch (r) {
                throw r === xn ? vi : r
            }
        else
            n = t;
        t = Ue();
        var l = t.queue
          , i = l.dispatch;
        return a !== t.memoizedState && (oe.flags |= 2048,
        Ln(9, {
            destroy: void 0
        }, fy.bind(null, l, a), null)),
        [n, i, e]
    }
    function fy(e, t) {
        e.action = t
    }
    function Or(e) {
        var t = Ue()
          , a = Le;
        if (a !== null)
            return Br(t, a, e);
        Ue(),
        t = t.memoizedState,
        a = Ue();
        var n = a.queue.dispatch;
        return a.memoizedState = e,
        [t, n, !1]
    }
    function Ln(e, t, a, n) {
        return e = {
            tag: e,
            create: a,
            deps: n,
            inst: t,
            next: null
        },
        t = oe.updateQueue,
        t === null && (t = Ai(),
        oe.updateQueue = t),
        a = t.lastEffect,
        a === null ? t.lastEffect = e.next = e : (n = a.next,
        a.next = e,
        e.next = n,
        t.lastEffect = e),
        e
    }
    function zr() {
        return Ue().memoizedState
    }
    function Ci(e, t, a, n) {
        var l = at();
        oe.flags |= e,
        l.memoizedState = Ln(1 | t, {
            destroy: void 0
        }, a, n === void 0 ? null : n)
    }
    function Ri(e, t, a, n) {
        var l = Ue();
        n = n === void 0 ? null : n;
        var i = l.memoizedState.inst;
        Le !== null && n !== null && gc(n, Le.memoizedState.deps) ? l.memoizedState = Ln(t, i, a, n) : (oe.flags |= e,
        l.memoizedState = Ln(1 | t, i, a, n))
    }
    function Hr(e, t) {
        Ci(8390656, 8, e, t)
    }
    function Tc(e, t) {
        Ri(2048, 8, e, t)
    }
    function my(e) {
        oe.flags |= 4;
        var t = oe.updateQueue;
        if (t === null)
            t = Ai(),
            oe.updateQueue = t,
            t.events = [e];
        else {
            var a = t.events;
            a === null ? t.events = [e] : a.push(e)
        }
    }
    function Ur(e) {
        var t = Ue().memoizedState;
        return my({
            ref: t,
            nextImpl: e
        }),
        function() {
            if ((Se & 2) !== 0)
                throw Error(o(440));
            return t.impl.apply(void 0, arguments)
        }
    }
    function Yr(e, t) {
        return Ri(4, 2, e, t)
    }
    function Gr(e, t) {
        return Ri(4, 4, e, t)
    }
    function qr(e, t) {
        if (typeof t == "function") {
            e = e();
            var a = t(e);
            return function() {
                typeof a == "function" ? a() : t(null)
            }
        }
        if (t != null)
            return e = e(),
            t.current = e,
            function() {
                t.current = null
            }
    }
    function Pr(e, t, a) {
        a = a != null ? a.concat([e]) : null,
        Ri(4, 4, qr.bind(null, t, e), a)
    }
    function Nc() {}
    function Xr(e, t) {
        var a = Ue();
        t = t === void 0 ? null : t;
        var n = a.memoizedState;
        return t !== null && gc(t, n[1]) ? n[0] : (a.memoizedState = [e, t],
        e)
    }
    function Vr(e, t) {
        var a = Ue();
        t = t === void 0 ? null : t;
        var n = a.memoizedState;
        if (t !== null && gc(t, n[1]))
            return n[0];
        if (n = e(),
        Qa) {
            ia(!0);
            try {
                e()
            } finally {
                ia(!1)
            }
        }
        return a.memoizedState = [n, t],
        n
    }
    function Cc(e, t, a) {
        return a === void 0 || (Qt & 1073741824) !== 0 && (ye & 261930) === 0 ? e.memoizedState = t : (e.memoizedState = a,
        e = Qd(),
        oe.lanes |= e,
        ba |= e,
        a)
    }
    function Qr(e, t, a, n) {
        return mt(a, t) ? a : kn.current !== null ? (e = Cc(e, a, n),
        mt(e, t) || (qe = !0),
        e) : (Qt & 42) === 0 || (Qt & 1073741824) !== 0 && (ye & 261930) === 0 ? (qe = !0,
        e.memoizedState = a) : (e = Qd(),
        oe.lanes |= e,
        ba |= e,
        t)
    }
    function Ir(e, t, a, n, l) {
        var i = Y.p;
        Y.p = i !== 0 && 8 > i ? i : 8;
        var r = N.T
          , m = {};
        N.T = m,
        Dc(e, !1, t, a);
        try {
            var b = l()
              , R = N.S;
            if (R !== null && R(m, b),
            b !== null && typeof b == "object" && typeof b.then == "function") {
                var M = uy(b, n);
                gl(e, t, M, xt(e))
            } else
                gl(e, t, n, xt(e))
        } catch (U) {
            gl(e, t, {
                then: function() {},
                status: "rejected",
                reason: U
            }, xt())
        } finally {
            Y.p = i,
            r !== null && m.types !== null && (r.types = m.types),
            N.T = r
        }
    }
    function yy() {}
    function Rc(e, t, a, n) {
        if (e.tag !== 5)
            throw Error(o(476));
        var l = Zr(e).queue;
        Ir(e, l, t, P, a === null ? yy : function() {
            return Fr(e),
            a(n)
        }
        )
    }
    function Zr(e) {
        var t = e.memoizedState;
        if (t !== null)
            return t;
        t = {
            memoizedState: P,
            baseState: P,
            baseQueue: null,
            queue: {
                pending: null,
                lanes: 0,
                dispatch: null,
                lastRenderedReducer: It,
                lastRenderedState: P
            },
            next: null
        };
        var a = {};
        return t.next = {
            memoizedState: a,
            baseState: a,
            baseQueue: null,
            queue: {
                pending: null,
                lanes: 0,
                dispatch: null,
                lastRenderedReducer: It,
                lastRenderedState: a
            },
            next: null
        },
        e.memoizedState = t,
        e = e.alternate,
        e !== null && (e.memoizedState = t),
        t
    }
    function Fr(e) {
        var t = Zr(e);
        t.next === null && (t = e.alternate.memoizedState),
        gl(e, t.next.queue, {}, xt())
    }
    function Kc() {
        return Je(Ml)
    }
    function Jr() {
        return Ue().memoizedState
    }
    function Wr() {
        return Ue().memoizedState
    }
    function hy(e) {
        for (var t = e.return; t !== null; ) {
            switch (t.tag) {
            case 24:
            case 3:
                var a = xt();
                e = fa(a);
                var n = ma(t, e, a);
                n !== null && (rt(n, t, a),
                pl(n, t, a)),
                t = {
                    cache: sc()
                },
                e.payload = t;
                return
            }
            t = t.return
        }
    }
    function gy(e, t, a) {
        var n = xt();
        a = {
            lane: n,
            revertLane: 0,
            gesture: null,
            action: a,
            hasEagerState: !1,
            eagerState: null,
            next: null
        },
        Ki(e) ? ed(t, a) : (a = Zs(e, t, a, n),
        a !== null && (rt(a, e, n),
        td(a, t, n)))
    }
    function $r(e, t, a) {
        var n = xt();
        gl(e, t, a, n)
    }
    function gl(e, t, a, n) {
        var l = {
            lane: n,
            revertLane: 0,
            gesture: null,
            action: a,
            hasEagerState: !1,
            eagerState: null,
            next: null
        };
        if (Ki(e))
            ed(t, l);
        else {
            var i = e.alternate;
            if (e.lanes === 0 && (i === null || i.lanes === 0) && (i = t.lastRenderedReducer,
            i !== null))
                try {
                    var r = t.lastRenderedState
                      , m = i(r, a);
                    if (l.hasEagerState = !0,
                    l.eagerState = m,
                    mt(m, r))
                        return di(e, t, l, 0),
                        Ce === null && ri(),
                        !1
                } catch {}
            if (a = Zs(e, t, l, n),
            a !== null)
                return rt(a, e, n),
                td(a, t, n),
                !0
        }
        return !1
    }
    function Dc(e, t, a, n) {
        if (n = {
            lane: 2,
            revertLane: ro(),
            gesture: null,
            action: n,
            hasEagerState: !1,
            eagerState: null,
            next: null
        },
        Ki(e)) {
            if (t)
                throw Error(o(479))
        } else
            t = Zs(e, a, n, 2),
            t !== null && rt(t, e, 2)
    }
    function Ki(e) {
        var t = e.alternate;
        return e === oe || t !== null && t === oe
    }
    function ed(e, t) {
        wn = Ei = !0;
        var a = e.pending;
        a === null ? t.next = t : (t.next = a.next,
        a.next = t),
        e.pending = t
    }
    function td(e, t, a) {
        if ((a & 4194048) !== 0) {
            var n = t.lanes;
            n &= e.pendingLanes,
            a |= n,
            t.lanes = a,
            su(e, a)
        }
    }
    var vl = {
        readContext: Je,
        use: Ti,
        useCallback: Be,
        useContext: Be,
        useEffect: Be,
        useImperativeHandle: Be,
        useLayoutEffect: Be,
        useInsertionEffect: Be,
        useMemo: Be,
        useReducer: Be,
        useRef: Be,
        useState: Be,
        useDebugValue: Be,
        useDeferredValue: Be,
        useTransition: Be,
        useSyncExternalStore: Be,
        useId: Be,
        useHostTransitionStatus: Be,
        useFormState: Be,
        useActionState: Be,
        useOptimistic: Be,
        useMemoCache: Be,
        useCacheRefresh: Be
    };
    vl.useEffectEvent = Be;
    var ad = {
        readContext: Je,
        use: Ti,
        useCallback: function(e, t) {
            return at().memoizedState = [e, t === void 0 ? null : t],
            e
        },
        useContext: Je,
        useEffect: Hr,
        useImperativeHandle: function(e, t, a) {
            a = a != null ? a.concat([e]) : null,
            Ci(4194308, 4, qr.bind(null, t, e), a)
        },
        useLayoutEffect: function(e, t) {
            return Ci(4194308, 4, e, t)
        },
        useInsertionEffect: function(e, t) {
            Ci(4, 2, e, t)
        },
        useMemo: function(e, t) {
            var a = at();
            t = t === void 0 ? null : t;
            var n = e();
            if (Qa) {
                ia(!0);
                try {
                    e()
                } finally {
                    ia(!1)
                }
            }
            return a.memoizedState = [n, t],
            n
        },
        useReducer: function(e, t, a) {
            var n = at();
            if (a !== void 0) {
                var l = a(t);
                if (Qa) {
                    ia(!0);
                    try {
                        a(t)
                    } finally {
                        ia(!1)
                    }
                }
            } else
                l = t;
            return n.memoizedState = n.baseState = l,
            e = {
                pending: null,
                lanes: 0,
                dispatch: null,
                lastRenderedReducer: e,
                lastRenderedState: l
            },
            n.queue = e,
            e = e.dispatch = gy.bind(null, oe, e),
            [n.memoizedState, e]
        },
        useRef: function(e) {
            var t = at();
            return e = {
                current: e
            },
            t.memoizedState = e
        },
        useState: function(e) {
            e = Lc(e);
            var t = e.queue
              , a = $r.bind(null, oe, t);
            return t.dispatch = a,
            [e.memoizedState, a]
        },
        useDebugValue: Nc,
        useDeferredValue: function(e, t) {
            var a = at();
            return Cc(a, e, t)
        },
        useTransition: function() {
            var e = Lc(!1);
            return e = Ir.bind(null, oe, e.queue, !0, !1),
            at().memoizedState = e,
            [!1, e]
        },
        useSyncExternalStore: function(e, t, a) {
            var n = oe
              , l = at();
            if (ge) {
                if (a === void 0)
                    throw Error(o(407));
                a = a()
            } else {
                if (a = t(),
                Ce === null)
                    throw Error(o(349));
                (ye & 127) !== 0 || wr(n, t, a)
            }
            l.memoizedState = a;
            var i = {
                value: a,
                getSnapshot: t
            };
            return l.queue = i,
            Hr(Lr.bind(null, n, i, e), [e]),
            n.flags |= 2048,
            Ln(9, {
                destroy: void 0
            }, Er.bind(null, n, i, a, t), null),
            a
        },
        useId: function() {
            var e = at()
              , t = Ce.identifierPrefix;
            if (ge) {
                var a = Ot
                  , n = Bt;
                a = (n & ~(1 << 32 - ft(n) - 1)).toString(32) + a,
                t = "_" + t + "R_" + a,
                a = Li++,
                0 < a && (t += "H" + a.toString(32)),
                t += "_"
            } else
                a = ry++,
                t = "_" + t + "r_" + a.toString(32) + "_";
            return e.memoizedState = t
        },
        useHostTransitionStatus: Kc,
        useFormState: Mr,
        useActionState: Mr,
        useOptimistic: function(e) {
            var t = at();
            t.memoizedState = t.baseState = e;
            var a = {
                pending: null,
                lanes: 0,
                dispatch: null,
                lastRenderedReducer: null,
                lastRenderedState: null
            };
            return t.queue = a,
            t = Dc.bind(null, oe, !0, a),
            a.dispatch = t,
            [e, t]
        },
        useMemoCache: kc,
        useCacheRefresh: function() {
            return at().memoizedState = hy.bind(null, oe)
        },
        useEffectEvent: function(e) {
            var t = at()
              , a = {
                impl: e
            };
            return t.memoizedState = a,
            function() {
                if ((Se & 2) !== 0)
                    throw Error(o(440));
                return a.impl.apply(void 0, arguments)
            }
        }
    }
      , jc = {
        readContext: Je,
        use: Ti,
        useCallback: Xr,
        useContext: Je,
        useEffect: Tc,
        useImperativeHandle: Pr,
        useInsertionEffect: Yr,
        useLayoutEffect: Gr,
        useMemo: Vr,
        useReducer: Ni,
        useRef: zr,
        useState: function() {
            return Ni(It)
        },
        useDebugValue: Nc,
        useDeferredValue: function(e, t) {
            var a = Ue();
            return Qr(a, Le.memoizedState, e, t)
        },
        useTransition: function() {
            var e = Ni(It)[0]
              , t = Ue().memoizedState;
            return [typeof e == "boolean" ? e : hl(e), t]
        },
        useSyncExternalStore: kr,
        useId: Jr,
        useHostTransitionStatus: Kc,
        useFormState: _r,
        useActionState: _r,
        useOptimistic: function(e, t) {
            var a = Ue();
            return Nr(a, Le, e, t)
        },
        useMemoCache: kc,
        useCacheRefresh: Wr
    };
    jc.useEffectEvent = Ur;
    var nd = {
        readContext: Je,
        use: Ti,
        useCallback: Xr,
        useContext: Je,
        useEffect: Tc,
        useImperativeHandle: Pr,
        useInsertionEffect: Yr,
        useLayoutEffect: Gr,
        useMemo: Vr,
        useReducer: Ec,
        useRef: zr,
        useState: function() {
            return Ec(It)
        },
        useDebugValue: Nc,
        useDeferredValue: function(e, t) {
            var a = Ue();
            return Le === null ? Cc(a, e, t) : Qr(a, Le.memoizedState, e, t)
        },
        useTransition: function() {
            var e = Ec(It)[0]
              , t = Ue().memoizedState;
            return [typeof e == "boolean" ? e : hl(e), t]
        },
        useSyncExternalStore: kr,
        useId: Jr,
        useHostTransitionStatus: Kc,
        useFormState: Or,
        useActionState: Or,
        useOptimistic: function(e, t) {
            var a = Ue();
            return Le !== null ? Nr(a, Le, e, t) : (a.baseState = e,
            [e, a.queue.dispatch])
        },
        useMemoCache: kc,
        useCacheRefresh: Wr
    };
    nd.useEffectEvent = Ur;
    function Mc(e, t, a, n) {
        t = e.memoizedState,
        a = a(n, t),
        a = a == null ? t : k({}, t, a),
        e.memoizedState = a,
        e.lanes === 0 && (e.updateQueue.baseState = a)
    }
    var _c = {
        enqueueSetState: function(e, t, a) {
            e = e._reactInternals;
            var n = xt()
              , l = fa(n);
            l.payload = t,
            a != null && (l.callback = a),
            t = ma(e, l, n),
            t !== null && (rt(t, e, n),
            pl(t, e, n))
        },
        enqueueReplaceState: function(e, t, a) {
            e = e._reactInternals;
            var n = xt()
              , l = fa(n);
            l.tag = 1,
            l.payload = t,
            a != null && (l.callback = a),
            t = ma(e, l, n),
            t !== null && (rt(t, e, n),
            pl(t, e, n))
        },
        enqueueForceUpdate: function(e, t) {
            e = e._reactInternals;
            var a = xt()
              , n = fa(a);
            n.tag = 2,
            t != null && (n.callback = t),
            t = ma(e, n, a),
            t !== null && (rt(t, e, a),
            pl(t, e, a))
        }
    };
    function ld(e, t, a, n, l, i, r) {
        return e = e.stateNode,
        typeof e.shouldComponentUpdate == "function" ? e.shouldComponentUpdate(n, i, r) : t.prototype && t.prototype.isPureReactComponent ? !ll(a, n) || !ll(l, i) : !0
    }
    function id(e, t, a, n) {
        e = t.state,
        typeof t.componentWillReceiveProps == "function" && t.componentWillReceiveProps(a, n),
        typeof t.UNSAFE_componentWillReceiveProps == "function" && t.UNSAFE_componentWillReceiveProps(a, n),
        t.state !== e && _c.enqueueReplaceState(t, t.state, null)
    }
    function Ia(e, t) {
        var a = t;
        if ("ref"in t) {
            a = {};
            for (var n in t)
                n !== "ref" && (a[n] = t[n])
        }
        if (e = e.defaultProps) {
            a === t && (a = k({}, a));
            for (var l in e)
                a[l] === void 0 && (a[l] = e[l])
        }
        return a
    }
    function sd(e) {
        ui(e)
    }
    function cd(e) {
        console.error(e)
    }
    function od(e) {
        ui(e)
    }
    function Di(e, t) {
        try {
            var a = e.onUncaughtError;
            a(t.value, {
                componentStack: t.stack
            })
        } catch (n) {
            setTimeout(function() {
                throw n
            })
        }
    }
    function ud(e, t, a) {
        try {
            var n = e.onCaughtError;
            n(a.value, {
                componentStack: a.stack,
                errorBoundary: t.tag === 1 ? t.stateNode : null
            })
        } catch (l) {
            setTimeout(function() {
                throw l
            })
        }
    }
    function Bc(e, t, a) {
        return a = fa(a),
        a.tag = 3,
        a.payload = {
            element: null
        },
        a.callback = function() {
            Di(e, t)
        }
        ,
        a
    }
    function rd(e) {
        return e = fa(e),
        e.tag = 3,
        e
    }
    function dd(e, t, a, n) {
        var l = a.type.getDerivedStateFromError;
        if (typeof l == "function") {
            var i = n.value;
            e.payload = function() {
                return l(i)
            }
            ,
            e.callback = function() {
                ud(t, a, n)
            }
        }
        var r = a.stateNode;
        r !== null && typeof r.componentDidCatch == "function" && (e.callback = function() {
            ud(t, a, n),
            typeof l != "function" && (xa === null ? xa = new Set([this]) : xa.add(this));
            var m = n.stack;
            this.componentDidCatch(n.value, {
                componentStack: m !== null ? m : ""
            })
        }
        )
    }
    function vy(e, t, a, n, l) {
        if (a.flags |= 32768,
        n !== null && typeof n == "object" && typeof n.then == "function") {
            if (t = a.alternate,
            t !== null && gn(t, a, l, !0),
            a = ht.current,
            a !== null) {
                switch (a.tag) {
                case 31:
                case 13:
                    return Nt === null ? Pi() : a.alternate === null && Oe === 0 && (Oe = 3),
                    a.flags &= -257,
                    a.flags |= 65536,
                    a.lanes = l,
                    n === bi ? a.flags |= 16384 : (t = a.updateQueue,
                    t === null ? a.updateQueue = new Set([n]) : t.add(n),
                    co(e, n, l)),
                    !1;
                case 22:
                    return a.flags |= 65536,
                    n === bi ? a.flags |= 16384 : (t = a.updateQueue,
                    t === null ? (t = {
                        transitions: null,
                        markerInstances: null,
                        retryQueue: new Set([n])
                    },
                    a.updateQueue = t) : (a = t.retryQueue,
                    a === null ? t.retryQueue = new Set([n]) : a.add(n)),
                    co(e, n, l)),
                    !1
                }
                throw Error(o(435, a.tag))
            }
            return co(e, n, l),
            Pi(),
            !1
        }
        if (ge)
            return t = ht.current,
            t !== null ? ((t.flags & 65536) === 0 && (t.flags |= 256),
            t.flags |= 65536,
            t.lanes = l,
            n !== tc && (e = Error(o(422), {
                cause: n
            }),
            cl(Et(e, a)))) : (n !== tc && (t = Error(o(423), {
                cause: n
            }),
            cl(Et(t, a))),
            e = e.current.alternate,
            e.flags |= 65536,
            l &= -l,
            e.lanes |= l,
            n = Et(n, a),
            l = Bc(e.stateNode, n, l),
            pc(e, l),
            Oe !== 4 && (Oe = 2)),
            !1;
        var i = Error(o(520), {
            cause: n
        });
        if (i = Et(i, a),
        Al === null ? Al = [i] : Al.push(i),
        Oe !== 4 && (Oe = 2),
        t === null)
            return !0;
        n = Et(n, a),
        a = t;
        do {
            switch (a.tag) {
            case 3:
                return a.flags |= 65536,
                e = l & -l,
                a.lanes |= e,
                e = Bc(a.stateNode, n, e),
                pc(a, e),
                !1;
            case 1:
                if (t = a.type,
                i = a.stateNode,
                (a.flags & 128) === 0 && (typeof t.getDerivedStateFromError == "function" || i !== null && typeof i.componentDidCatch == "function" && (xa === null || !xa.has(i))))
                    return a.flags |= 65536,
                    l &= -l,
                    a.lanes |= l,
                    l = rd(l),
                    dd(l, e, a, n),
                    pc(a, l),
                    !1
            }
            a = a.return
        } while (a !== null);
        return !1
    }
    var Oc = Error(o(461))
      , qe = !1;
    function We(e, t, a, n) {
        t.child = e === null ? yr(t, null, a, n) : Va(t, e.child, a, n)
    }
    function pd(e, t, a, n, l) {
        a = a.render;
        var i = t.ref;
        if ("ref"in n) {
            var r = {};
            for (var m in n)
                m !== "ref" && (r[m] = n[m])
        } else
            r = n;
        return Ga(t),
        n = vc(e, t, a, r, i, l),
        m = bc(),
        e !== null && !qe ? (xc(e, t, l),
        Zt(e, t, l)) : (ge && m && $s(t),
        t.flags |= 1,
        We(e, t, n, l),
        t.child)
    }
    function fd(e, t, a, n, l) {
        if (e === null) {
            var i = a.type;
            return typeof i == "function" && !Fs(i) && i.defaultProps === void 0 && a.compare === null ? (t.tag = 15,
            t.type = i,
            md(e, t, i, n, l)) : (e = fi(a.type, null, n, t, t.mode, l),
            e.ref = t.ref,
            e.return = t,
            t.child = e)
        }
        if (i = e.child,
        !Xc(e, l)) {
            var r = i.memoizedProps;
            if (a = a.compare,
            a = a !== null ? a : ll,
            a(r, n) && e.ref === t.ref)
                return Zt(e, t, l)
        }
        return t.flags |= 1,
        e = qt(i, n),
        e.ref = t.ref,
        e.return = t,
        t.child = e
    }
    function md(e, t, a, n, l) {
        if (e !== null) {
            var i = e.memoizedProps;
            if (ll(i, n) && e.ref === t.ref)
                if (qe = !1,
                t.pendingProps = n = i,
                Xc(e, l))
                    (e.flags & 131072) !== 0 && (qe = !0);
                else
                    return t.lanes = e.lanes,
                    Zt(e, t, l)
        }
        return zc(e, t, a, n, l)
    }
    function yd(e, t, a, n) {
        var l = n.children
          , i = e !== null ? e.memoizedState : null;
        if (e === null && t.stateNode === null && (t.stateNode = {
            _visibility: 1,
            _pendingMarkers: null,
            _retryCache: null,
            _transitions: null
        }),
        n.mode === "hidden") {
            if ((t.flags & 128) !== 0) {
                if (i = i !== null ? i.baseLanes | a : a,
                e !== null) {
                    for (n = t.child = e.child,
                    l = 0; n !== null; )
                        l = l | n.lanes | n.childLanes,
                        n = n.sibling;
                    n = l & ~i
                } else
                    n = 0,
                    t.child = null;
                return hd(e, t, i, a, n)
            }
            if ((a & 536870912) !== 0)
                t.memoizedState = {
                    baseLanes: 0,
                    cachePool: null
                },
                e !== null && gi(t, i !== null ? i.cachePool : null),
                i !== null ? vr(t, i) : mc(),
                br(t);
            else
                return n = t.lanes = 536870912,
                hd(e, t, i !== null ? i.baseLanes | a : a, a, n)
        } else
            i !== null ? (gi(t, i.cachePool),
            vr(t, i),
            ha(),
            t.memoizedState = null) : (e !== null && gi(t, null),
            mc(),
            ha());
        return We(e, t, l, a),
        t.child
    }
    function bl(e, t) {
        return e !== null && e.tag === 22 || t.stateNode !== null || (t.stateNode = {
            _visibility: 1,
            _pendingMarkers: null,
            _retryCache: null,
            _transitions: null
        }),
        t.sibling
    }
    function hd(e, t, a, n, l) {
        var i = oc();
        return i = i === null ? null : {
            parent: Ye._currentValue,
            pool: i
        },
        t.memoizedState = {
            baseLanes: a,
            cachePool: i
        },
        e !== null && gi(t, null),
        mc(),
        br(t),
        e !== null && gn(e, t, n, !0),
        t.childLanes = l,
        null
    }
    function ji(e, t) {
        return t = _i({
            mode: t.mode,
            children: t.children
        }, e.mode),
        t.ref = e.ref,
        e.child = t,
        t.return = e,
        t
    }
    function gd(e, t, a) {
        return Va(t, e.child, null, a),
        e = ji(t, t.pendingProps),
        e.flags |= 2,
        gt(t),
        t.memoizedState = null,
        e
    }
    function by(e, t, a) {
        var n = t.pendingProps
          , l = (t.flags & 128) !== 0;
        if (t.flags &= -129,
        e === null) {
            if (ge) {
                if (n.mode === "hidden")
                    return e = ji(t, n),
                    t.lanes = 536870912,
                    bl(null, e);
                if (hc(t),
                (e = Ke) ? (e = Cp(e, Tt),
                e = e !== null && e.data === "&" ? e : null,
                e !== null && (t.memoizedState = {
                    dehydrated: e,
                    treeContext: oa !== null ? {
                        id: Bt,
                        overflow: Ot
                    } : null,
                    retryLane: 536870912,
                    hydrationErrors: null
                },
                a = er(e),
                a.return = t,
                t.child = a,
                Fe = t,
                Ke = null)) : e = null,
                e === null)
                    throw ra(t);
                return t.lanes = 536870912,
                null
            }
            return ji(t, n)
        }
        var i = e.memoizedState;
        if (i !== null) {
            var r = i.dehydrated;
            if (hc(t),
            l)
                if (t.flags & 256)
                    t.flags &= -257,
                    t = gd(e, t, a);
                else if (t.memoizedState !== null)
                    t.child = e.child,
                    t.flags |= 128,
                    t = null;
                else
                    throw Error(o(558));
            else if (qe || gn(e, t, a, !1),
            l = (a & e.childLanes) !== 0,
            qe || l) {
                if (n = Ce,
                n !== null && (r = cu(n, a),
                r !== 0 && r !== i.retryLane))
                    throw i.retryLane = r,
                    za(e, r),
                    rt(n, e, r),
                    Oc;
                Pi(),
                t = gd(e, t, a)
            } else
                e = i.treeContext,
                Ke = Ct(r.nextSibling),
                Fe = t,
                ge = !0,
                ua = null,
                Tt = !1,
                e !== null && nr(t, e),
                t = ji(t, n),
                t.flags |= 4096;
            return t
        }
        return e = qt(e.child, {
            mode: n.mode,
            children: n.children
        }),
        e.ref = t.ref,
        t.child = e,
        e.return = t,
        e
    }
    function Mi(e, t) {
        var a = t.ref;
        if (a === null)
            e !== null && e.ref !== null && (t.flags |= 4194816);
        else {
            if (typeof a != "function" && typeof a != "object")
                throw Error(o(284));
            (e === null || e.ref !== a) && (t.flags |= 4194816)
        }
    }
    function zc(e, t, a, n, l) {
        return Ga(t),
        a = vc(e, t, a, n, void 0, l),
        n = bc(),
        e !== null && !qe ? (xc(e, t, l),
        Zt(e, t, l)) : (ge && n && $s(t),
        t.flags |= 1,
        We(e, t, a, l),
        t.child)
    }
    function vd(e, t, a, n, l, i) {
        return Ga(t),
        t.updateQueue = null,
        a = Sr(t, n, a, l),
        xr(e),
        n = bc(),
        e !== null && !qe ? (xc(e, t, i),
        Zt(e, t, i)) : (ge && n && $s(t),
        t.flags |= 1,
        We(e, t, a, i),
        t.child)
    }
    function bd(e, t, a, n, l) {
        if (Ga(t),
        t.stateNode === null) {
            var i = fn
              , r = a.contextType;
            typeof r == "object" && r !== null && (i = Je(r)),
            i = new a(n,i),
            t.memoizedState = i.state !== null && i.state !== void 0 ? i.state : null,
            i.updater = _c,
            t.stateNode = i,
            i._reactInternals = t,
            i = t.stateNode,
            i.props = n,
            i.state = t.memoizedState,
            i.refs = {},
            rc(t),
            r = a.contextType,
            i.context = typeof r == "object" && r !== null ? Je(r) : fn,
            i.state = t.memoizedState,
            r = a.getDerivedStateFromProps,
            typeof r == "function" && (Mc(t, a, r, n),
            i.state = t.memoizedState),
            typeof a.getDerivedStateFromProps == "function" || typeof i.getSnapshotBeforeUpdate == "function" || typeof i.UNSAFE_componentWillMount != "function" && typeof i.componentWillMount != "function" || (r = i.state,
            typeof i.componentWillMount == "function" && i.componentWillMount(),
            typeof i.UNSAFE_componentWillMount == "function" && i.UNSAFE_componentWillMount(),
            r !== i.state && _c.enqueueReplaceState(i, i.state, null),
            ml(t, n, i, l),
            fl(),
            i.state = t.memoizedState),
            typeof i.componentDidMount == "function" && (t.flags |= 4194308),
            n = !0
        } else if (e === null) {
            i = t.stateNode;
            var m = t.memoizedProps
              , b = Ia(a, m);
            i.props = b;
            var R = i.context
              , M = a.contextType;
            r = fn,
            typeof M == "object" && M !== null && (r = Je(M));
            var U = a.getDerivedStateFromProps;
            M = typeof U == "function" || typeof i.getSnapshotBeforeUpdate == "function",
            m = t.pendingProps !== m,
            M || typeof i.UNSAFE_componentWillReceiveProps != "function" && typeof i.componentWillReceiveProps != "function" || (m || R !== r) && id(t, i, n, r),
            pa = !1;
            var K = t.memoizedState;
            i.state = K,
            ml(t, n, i, l),
            fl(),
            R = t.memoizedState,
            m || K !== R || pa ? (typeof U == "function" && (Mc(t, a, U, n),
            R = t.memoizedState),
            (b = pa || ld(t, a, b, n, K, R, r)) ? (M || typeof i.UNSAFE_componentWillMount != "function" && typeof i.componentWillMount != "function" || (typeof i.componentWillMount == "function" && i.componentWillMount(),
            typeof i.UNSAFE_componentWillMount == "function" && i.UNSAFE_componentWillMount()),
            typeof i.componentDidMount == "function" && (t.flags |= 4194308)) : (typeof i.componentDidMount == "function" && (t.flags |= 4194308),
            t.memoizedProps = n,
            t.memoizedState = R),
            i.props = n,
            i.state = R,
            i.context = r,
            n = b) : (typeof i.componentDidMount == "function" && (t.flags |= 4194308),
            n = !1)
        } else {
            i = t.stateNode,
            dc(e, t),
            r = t.memoizedProps,
            M = Ia(a, r),
            i.props = M,
            U = t.pendingProps,
            K = i.context,
            R = a.contextType,
            b = fn,
            typeof R == "object" && R !== null && (b = Je(R)),
            m = a.getDerivedStateFromProps,
            (R = typeof m == "function" || typeof i.getSnapshotBeforeUpdate == "function") || typeof i.UNSAFE_componentWillReceiveProps != "function" && typeof i.componentWillReceiveProps != "function" || (r !== U || K !== b) && id(t, i, n, b),
            pa = !1,
            K = t.memoizedState,
            i.state = K,
            ml(t, n, i, l),
            fl();
            var j = t.memoizedState;
            r !== U || K !== j || pa || e !== null && e.dependencies !== null && yi(e.dependencies) ? (typeof m == "function" && (Mc(t, a, m, n),
            j = t.memoizedState),
            (M = pa || ld(t, a, M, n, K, j, b) || e !== null && e.dependencies !== null && yi(e.dependencies)) ? (R || typeof i.UNSAFE_componentWillUpdate != "function" && typeof i.componentWillUpdate != "function" || (typeof i.componentWillUpdate == "function" && i.componentWillUpdate(n, j, b),
            typeof i.UNSAFE_componentWillUpdate == "function" && i.UNSAFE_componentWillUpdate(n, j, b)),
            typeof i.componentDidUpdate == "function" && (t.flags |= 4),
            typeof i.getSnapshotBeforeUpdate == "function" && (t.flags |= 1024)) : (typeof i.componentDidUpdate != "function" || r === e.memoizedProps && K === e.memoizedState || (t.flags |= 4),
            typeof i.getSnapshotBeforeUpdate != "function" || r === e.memoizedProps && K === e.memoizedState || (t.flags |= 1024),
            t.memoizedProps = n,
            t.memoizedState = j),
            i.props = n,
            i.state = j,
            i.context = b,
            n = M) : (typeof i.componentDidUpdate != "function" || r === e.memoizedProps && K === e.memoizedState || (t.flags |= 4),
            typeof i.getSnapshotBeforeUpdate != "function" || r === e.memoizedProps && K === e.memoizedState || (t.flags |= 1024),
            n = !1)
        }
        return i = n,
        Mi(e, t),
        n = (t.flags & 128) !== 0,
        i || n ? (i = t.stateNode,
        a = n && typeof a.getDerivedStateFromError != "function" ? null : i.render(),
        t.flags |= 1,
        e !== null && n ? (t.child = Va(t, e.child, null, l),
        t.child = Va(t, null, a, l)) : We(e, t, a, l),
        t.memoizedState = i.state,
        e = t.child) : e = Zt(e, t, l),
        e
    }
    function xd(e, t, a, n) {
        return Ua(),
        t.flags |= 256,
        We(e, t, a, n),
        t.child
    }
    var Hc = {
        dehydrated: null,
        treeContext: null,
        retryLane: 0,
        hydrationErrors: null
    };
    function Uc(e) {
        return {
            baseLanes: e,
            cachePool: ur()
        }
    }
    function Yc(e, t, a) {
        return e = e !== null ? e.childLanes & ~a : 0,
        t && (e |= bt),
        e
    }
    function Sd(e, t, a) {
        var n = t.pendingProps, l = !1, i = (t.flags & 128) !== 0, r;
        if ((r = i) || (r = e !== null && e.memoizedState === null ? !1 : (He.current & 2) !== 0),
        r && (l = !0,
        t.flags &= -129),
        r = (t.flags & 32) !== 0,
        t.flags &= -33,
        e === null) {
            if (ge) {
                if (l ? ya(t) : ha(),
                (e = Ke) ? (e = Cp(e, Tt),
                e = e !== null && e.data !== "&" ? e : null,
                e !== null && (t.memoizedState = {
                    dehydrated: e,
                    treeContext: oa !== null ? {
                        id: Bt,
                        overflow: Ot
                    } : null,
                    retryLane: 536870912,
                    hydrationErrors: null
                },
                a = er(e),
                a.return = t,
                t.child = a,
                Fe = t,
                Ke = null)) : e = null,
                e === null)
                    throw ra(t);
                return Eo(e) ? t.lanes = 32 : t.lanes = 536870912,
                null
            }
            var m = n.children;
            return n = n.fallback,
            l ? (ha(),
            l = t.mode,
            m = _i({
                mode: "hidden",
                children: m
            }, l),
            n = Ha(n, l, a, null),
            m.return = t,
            n.return = t,
            m.sibling = n,
            t.child = m,
            n = t.child,
            n.memoizedState = Uc(a),
            n.childLanes = Yc(e, r, a),
            t.memoizedState = Hc,
            bl(null, n)) : (ya(t),
            Gc(t, m))
        }
        var b = e.memoizedState;
        if (b !== null && (m = b.dehydrated,
        m !== null)) {
            if (i)
                t.flags & 256 ? (ya(t),
                t.flags &= -257,
                t = qc(e, t, a)) : t.memoizedState !== null ? (ha(),
                t.child = e.child,
                t.flags |= 128,
                t = null) : (ha(),
                m = n.fallback,
                l = t.mode,
                n = _i({
                    mode: "visible",
                    children: n.children
                }, l),
                m = Ha(m, l, a, null),
                m.flags |= 2,
                n.return = t,
                m.return = t,
                n.sibling = m,
                t.child = n,
                Va(t, e.child, null, a),
                n = t.child,
                n.memoizedState = Uc(a),
                n.childLanes = Yc(e, r, a),
                t.memoizedState = Hc,
                t = bl(null, n));
            else if (ya(t),
            Eo(m)) {
                if (r = m.nextSibling && m.nextSibling.dataset,
                r)
                    var R = r.dgst;
                r = R,
                n = Error(o(419)),
                n.stack = "",
                n.digest = r,
                cl({
                    value: n,
                    source: null,
                    stack: null
                }),
                t = qc(e, t, a)
            } else if (qe || gn(e, t, a, !1),
            r = (a & e.childLanes) !== 0,
            qe || r) {
                if (r = Ce,
                r !== null && (n = cu(r, a),
                n !== 0 && n !== b.retryLane))
                    throw b.retryLane = n,
                    za(e, n),
                    rt(r, e, n),
                    Oc;
                wo(m) || Pi(),
                t = qc(e, t, a)
            } else
                wo(m) ? (t.flags |= 192,
                t.child = e.child,
                t = null) : (e = b.treeContext,
                Ke = Ct(m.nextSibling),
                Fe = t,
                ge = !0,
                ua = null,
                Tt = !1,
                e !== null && nr(t, e),
                t = Gc(t, n.children),
                t.flags |= 4096);
            return t
        }
        return l ? (ha(),
        m = n.fallback,
        l = t.mode,
        b = e.child,
        R = b.sibling,
        n = qt(b, {
            mode: "hidden",
            children: n.children
        }),
        n.subtreeFlags = b.subtreeFlags & 65011712,
        R !== null ? m = qt(R, m) : (m = Ha(m, l, a, null),
        m.flags |= 2),
        m.return = t,
        n.return = t,
        n.sibling = m,
        t.child = n,
        bl(null, n),
        n = t.child,
        m = e.child.memoizedState,
        m === null ? m = Uc(a) : (l = m.cachePool,
        l !== null ? (b = Ye._currentValue,
        l = l.parent !== b ? {
            parent: b,
            pool: b
        } : l) : l = ur(),
        m = {
            baseLanes: m.baseLanes | a,
            cachePool: l
        }),
        n.memoizedState = m,
        n.childLanes = Yc(e, r, a),
        t.memoizedState = Hc,
        bl(e.child, n)) : (ya(t),
        a = e.child,
        e = a.sibling,
        a = qt(a, {
            mode: "visible",
            children: n.children
        }),
        a.return = t,
        a.sibling = null,
        e !== null && (r = t.deletions,
        r === null ? (t.deletions = [e],
        t.flags |= 16) : r.push(e)),
        t.child = a,
        t.memoizedState = null,
        a)
    }
    function Gc(e, t) {
        return t = _i({
            mode: "visible",
            children: t
        }, e.mode),
        t.return = e,
        e.child = t
    }
    function _i(e, t) {
        return e = yt(22, e, null, t),
        e.lanes = 0,
        e
    }
    function qc(e, t, a) {
        return Va(t, e.child, null, a),
        e = Gc(t, t.pendingProps.children),
        e.flags |= 2,
        t.memoizedState = null,
        e
    }
    function kd(e, t, a) {
        e.lanes |= t;
        var n = e.alternate;
        n !== null && (n.lanes |= t),
        lc(e.return, t, a)
    }
    function Pc(e, t, a, n, l, i) {
        var r = e.memoizedState;
        r === null ? e.memoizedState = {
            isBackwards: t,
            rendering: null,
            renderingStartTime: 0,
            last: n,
            tail: a,
            tailMode: l,
            treeForkCount: i
        } : (r.isBackwards = t,
        r.rendering = null,
        r.renderingStartTime = 0,
        r.last = n,
        r.tail = a,
        r.tailMode = l,
        r.treeForkCount = i)
    }
    function wd(e, t, a) {
        var n = t.pendingProps
          , l = n.revealOrder
          , i = n.tail;
        n = n.children;
        var r = He.current
          , m = (r & 2) !== 0;
        if (m ? (r = r & 1 | 2,
        t.flags |= 128) : r &= 1,
        I(He, r),
        We(e, t, n, a),
        n = ge ? sl : 0,
        !m && e !== null && (e.flags & 128) !== 0)
            e: for (e = t.child; e !== null; ) {
                if (e.tag === 13)
                    e.memoizedState !== null && kd(e, a, t);
                else if (e.tag === 19)
                    kd(e, a, t);
                else if (e.child !== null) {
                    e.child.return = e,
                    e = e.child;
                    continue
                }
                if (e === t)
                    break e;
                for (; e.sibling === null; ) {
                    if (e.return === null || e.return === t)
                        break e;
                    e = e.return
                }
                e.sibling.return = e.return,
                e = e.sibling
            }
        switch (l) {
        case "forwards":
            for (a = t.child,
            l = null; a !== null; )
                e = a.alternate,
                e !== null && wi(e) === null && (l = a),
                a = a.sibling;
            a = l,
            a === null ? (l = t.child,
            t.child = null) : (l = a.sibling,
            a.sibling = null),
            Pc(t, !1, l, a, i, n);
            break;
        case "backwards":
        case "unstable_legacy-backwards":
            for (a = null,
            l = t.child,
            t.child = null; l !== null; ) {
                if (e = l.alternate,
                e !== null && wi(e) === null) {
                    t.child = l;
                    break
                }
                e = l.sibling,
                l.sibling = a,
                a = l,
                l = e
            }
            Pc(t, !0, a, null, i, n);
            break;
        case "together":
            Pc(t, !1, null, null, void 0, n);
            break;
        default:
            t.memoizedState = null
        }
        return t.child
    }
    function Zt(e, t, a) {
        if (e !== null && (t.dependencies = e.dependencies),
        ba |= t.lanes,
        (a & t.childLanes) === 0)
            if (e !== null) {
                if (gn(e, t, a, !1),
                (a & t.childLanes) === 0)
                    return null
            } else
                return null;
        if (e !== null && t.child !== e.child)
            throw Error(o(153));
        if (t.child !== null) {
            for (e = t.child,
            a = qt(e, e.pendingProps),
            t.child = a,
            a.return = t; e.sibling !== null; )
                e = e.sibling,
                a = a.sibling = qt(e, e.pendingProps),
                a.return = t;
            a.sibling = null
        }
        return t.child
    }
    function Xc(e, t) {
        return (e.lanes & t) !== 0 ? !0 : (e = e.dependencies,
        !!(e !== null && yi(e)))
    }
    function xy(e, t, a) {
        switch (t.tag) {
        case 3:
            tt(t, t.stateNode.containerInfo),
            da(t, Ye, e.memoizedState.cache),
            Ua();
            break;
        case 27:
        case 5:
            Xn(t);
            break;
        case 4:
            tt(t, t.stateNode.containerInfo);
            break;
        case 10:
            da(t, t.type, t.memoizedProps.value);
            break;
        case 31:
            if (t.memoizedState !== null)
                return t.flags |= 128,
                hc(t),
                null;
            break;
        case 13:
            var n = t.memoizedState;
            if (n !== null)
                return n.dehydrated !== null ? (ya(t),
                t.flags |= 128,
                null) : (a & t.child.childLanes) !== 0 ? Sd(e, t, a) : (ya(t),
                e = Zt(e, t, a),
                e !== null ? e.sibling : null);
            ya(t);
            break;
        case 19:
            var l = (e.flags & 128) !== 0;
            if (n = (a & t.childLanes) !== 0,
            n || (gn(e, t, a, !1),
            n = (a & t.childLanes) !== 0),
            l) {
                if (n)
                    return wd(e, t, a);
                t.flags |= 128
            }
            if (l = t.memoizedState,
            l !== null && (l.rendering = null,
            l.tail = null,
            l.lastEffect = null),
            I(He, He.current),
            n)
                break;
            return null;
        case 22:
            return t.lanes = 0,
            yd(e, t, a, t.pendingProps);
        case 24:
            da(t, Ye, e.memoizedState.cache)
        }
        return Zt(e, t, a)
    }
    function Ed(e, t, a) {
        if (e !== null)
            if (e.memoizedProps !== t.pendingProps)
                qe = !0;
            else {
                if (!Xc(e, a) && (t.flags & 128) === 0)
                    return qe = !1,
                    xy(e, t, a);
                qe = (e.flags & 131072) !== 0
            }
        else
            qe = !1,
            ge && (t.flags & 1048576) !== 0 && ar(t, sl, t.index);
        switch (t.lanes = 0,
        t.tag) {
        case 16:
            e: {
                var n = t.pendingProps;
                if (e = Pa(t.elementType),
                t.type = e,
                typeof e == "function")
                    Fs(e) ? (n = Ia(e, n),
                    t.tag = 1,
                    t = bd(null, t, e, n, a)) : (t.tag = 0,
                    t = zc(null, t, e, n, a));
                else {
                    if (e != null) {
                        var l = e.$$typeof;
                        if (l === X) {
                            t.tag = 11,
                            t = pd(null, t, e, n, a);
                            break e
                        } else if (l === q) {
                            t.tag = 14,
                            t = fd(null, t, e, n, a);
                            break e
                        }
                    }
                    throw t = je(e) || e,
                    Error(o(306, t, ""))
                }
            }
            return t;
        case 0:
            return zc(e, t, t.type, t.pendingProps, a);
        case 1:
            return n = t.type,
            l = Ia(n, t.pendingProps),
            bd(e, t, n, l, a);
        case 3:
            e: {
                if (tt(t, t.stateNode.containerInfo),
                e === null)
                    throw Error(o(387));
                n = t.pendingProps;
                var i = t.memoizedState;
                l = i.element,
                dc(e, t),
                ml(t, n, null, a);
                var r = t.memoizedState;
                if (n = r.cache,
                da(t, Ye, n),
                n !== i.cache && ic(t, [Ye], a, !0),
                fl(),
                n = r.element,
                i.isDehydrated)
                    if (i = {
                        element: n,
                        isDehydrated: !1,
                        cache: r.cache
                    },
                    t.updateQueue.baseState = i,
                    t.memoizedState = i,
                    t.flags & 256) {
                        t = xd(e, t, n, a);
                        break e
                    } else if (n !== l) {
                        l = Et(Error(o(424)), t),
                        cl(l),
                        t = xd(e, t, n, a);
                        break e
                    } else
                        for (e = t.stateNode.containerInfo,
                        e.nodeType === 9 ? e = e.body : e = e.nodeName === "HTML" ? e.ownerDocument.body : e,
                        Ke = Ct(e.firstChild),
                        Fe = t,
                        ge = !0,
                        ua = null,
                        Tt = !0,
                        a = yr(t, null, n, a),
                        t.child = a; a; )
                            a.flags = a.flags & -3 | 4096,
                            a = a.sibling;
                else {
                    if (Ua(),
                    n === l) {
                        t = Zt(e, t, a);
                        break e
                    }
                    We(e, t, n, a)
                }
                t = t.child
            }
            return t;
        case 26:
            return Mi(e, t),
            e === null ? (a = _p(t.type, null, t.pendingProps, null)) ? t.memoizedState = a : ge || (a = t.type,
            e = t.pendingProps,
            n = Ji(re.current).createElement(a),
            n[Ze] = t,
            n[lt] = e,
            $e(n, a, e),
            Qe(n),
            t.stateNode = n) : t.memoizedState = _p(t.type, e.memoizedProps, t.pendingProps, e.memoizedState),
            null;
        case 27:
            return Xn(t),
            e === null && ge && (n = t.stateNode = Dp(t.type, t.pendingProps, re.current),
            Fe = t,
            Tt = !0,
            l = Ke,
            Ea(t.type) ? (Lo = l,
            Ke = Ct(n.firstChild)) : Ke = l),
            We(e, t, t.pendingProps.children, a),
            Mi(e, t),
            e === null && (t.flags |= 4194304),
            t.child;
        case 5:
            return e === null && ge && ((l = n = Ke) && (n = Fy(n, t.type, t.pendingProps, Tt),
            n !== null ? (t.stateNode = n,
            Fe = t,
            Ke = Ct(n.firstChild),
            Tt = !1,
            l = !0) : l = !1),
            l || ra(t)),
            Xn(t),
            l = t.type,
            i = t.pendingProps,
            r = e !== null ? e.memoizedProps : null,
            n = i.children,
            xo(l, i) ? n = null : r !== null && xo(l, r) && (t.flags |= 32),
            t.memoizedState !== null && (l = vc(e, t, dy, null, null, a),
            Ml._currentValue = l),
            Mi(e, t),
            We(e, t, n, a),
            t.child;
        case 6:
            return e === null && ge && ((e = a = Ke) && (a = Jy(a, t.pendingProps, Tt),
            a !== null ? (t.stateNode = a,
            Fe = t,
            Ke = null,
            e = !0) : e = !1),
            e || ra(t)),
            null;
        case 13:
            return Sd(e, t, a);
        case 4:
            return tt(t, t.stateNode.containerInfo),
            n = t.pendingProps,
            e === null ? t.child = Va(t, null, n, a) : We(e, t, n, a),
            t.child;
        case 11:
            return pd(e, t, t.type, t.pendingProps, a);
        case 7:
            return We(e, t, t.pendingProps, a),
            t.child;
        case 8:
            return We(e, t, t.pendingProps.children, a),
            t.child;
        case 12:
            return We(e, t, t.pendingProps.children, a),
            t.child;
        case 10:
            return n = t.pendingProps,
            da(t, t.type, n.value),
            We(e, t, n.children, a),
            t.child;
        case 9:
            return l = t.type._context,
            n = t.pendingProps.children,
            Ga(t),
            l = Je(l),
            n = n(l),
            t.flags |= 1,
            We(e, t, n, a),
            t.child;
        case 14:
            return fd(e, t, t.type, t.pendingProps, a);
        case 15:
            return md(e, t, t.type, t.pendingProps, a);
        case 19:
            return wd(e, t, a);
        case 31:
            return by(e, t, a);
        case 22:
            return yd(e, t, a, t.pendingProps);
        case 24:
            return Ga(t),
            n = Je(Ye),
            e === null ? (l = oc(),
            l === null && (l = Ce,
            i = sc(),
            l.pooledCache = i,
            i.refCount++,
            i !== null && (l.pooledCacheLanes |= a),
            l = i),
            t.memoizedState = {
                parent: n,
                cache: l
            },
            rc(t),
            da(t, Ye, l)) : ((e.lanes & a) !== 0 && (dc(e, t),
            ml(t, null, null, a),
            fl()),
            l = e.memoizedState,
            i = t.memoizedState,
            l.parent !== n ? (l = {
                parent: n,
                cache: n
            },
            t.memoizedState = l,
            t.lanes === 0 && (t.memoizedState = t.updateQueue.baseState = l),
            da(t, Ye, n)) : (n = i.cache,
            da(t, Ye, n),
            n !== l.cache && ic(t, [Ye], a, !0))),
            We(e, t, t.pendingProps.children, a),
            t.child;
        case 29:
            throw t.pendingProps
        }
        throw Error(o(156, t.tag))
    }
    function Ft(e) {
        e.flags |= 4
    }
    function Vc(e, t, a, n, l) {
        if ((t = (e.mode & 32) !== 0) && (t = !1),
        t) {
            if (e.flags |= 16777216,
            (l & 335544128) === l)
                if (e.stateNode.complete)
                    e.flags |= 8192;
                else if (Jd())
                    e.flags |= 8192;
                else
                    throw Xa = bi,
                    uc
        } else
            e.flags &= -16777217
    }
    function Ld(e, t) {
        if (t.type !== "stylesheet" || (t.state.loading & 4) !== 0)
            e.flags &= -16777217;
        else if (e.flags |= 16777216,
        !Up(t))
            if (Jd())
                e.flags |= 8192;
            else
                throw Xa = bi,
                uc
    }
    function Bi(e, t) {
        t !== null && (e.flags |= 4),
        e.flags & 16384 && (t = e.tag !== 22 ? lu() : 536870912,
        e.lanes |= t,
        Cn |= t)
    }
    function xl(e, t) {
        if (!ge)
            switch (e.tailMode) {
            case "hidden":
                t = e.tail;
                for (var a = null; t !== null; )
                    t.alternate !== null && (a = t),
                    t = t.sibling;
                a === null ? e.tail = null : a.sibling = null;
                break;
            case "collapsed":
                a = e.tail;
                for (var n = null; a !== null; )
                    a.alternate !== null && (n = a),
                    a = a.sibling;
                n === null ? t || e.tail === null ? e.tail = null : e.tail.sibling = null : n.sibling = null
            }
    }
    function De(e) {
        var t = e.alternate !== null && e.alternate.child === e.child
          , a = 0
          , n = 0;
        if (t)
            for (var l = e.child; l !== null; )
                a |= l.lanes | l.childLanes,
                n |= l.subtreeFlags & 65011712,
                n |= l.flags & 65011712,
                l.return = e,
                l = l.sibling;
        else
            for (l = e.child; l !== null; )
                a |= l.lanes | l.childLanes,
                n |= l.subtreeFlags,
                n |= l.flags,
                l.return = e,
                l = l.sibling;
        return e.subtreeFlags |= n,
        e.childLanes = a,
        t
    }
    function Sy(e, t, a) {
        var n = t.pendingProps;
        switch (ec(t),
        t.tag) {
        case 16:
        case 15:
        case 0:
        case 11:
        case 7:
        case 8:
        case 12:
        case 9:
        case 14:
            return De(t),
            null;
        case 1:
            return De(t),
            null;
        case 3:
            return a = t.stateNode,
            n = null,
            e !== null && (n = e.memoizedState.cache),
            t.memoizedState.cache !== n && (t.flags |= 2048),
            Vt(Ye),
            ze(),
            a.pendingContext && (a.context = a.pendingContext,
            a.pendingContext = null),
            (e === null || e.child === null) && (hn(t) ? Ft(t) : e === null || e.memoizedState.isDehydrated && (t.flags & 256) === 0 || (t.flags |= 1024,
            ac())),
            De(t),
            null;
        case 26:
            var l = t.type
              , i = t.memoizedState;
            return e === null ? (Ft(t),
            i !== null ? (De(t),
            Ld(t, i)) : (De(t),
            Vc(t, l, null, n, a))) : i ? i !== e.memoizedState ? (Ft(t),
            De(t),
            Ld(t, i)) : (De(t),
            t.flags &= -16777217) : (e = e.memoizedProps,
            e !== n && Ft(t),
            De(t),
            Vc(t, l, e, n, a)),
            null;
        case 27:
            if (Ql(t),
            a = re.current,
            l = t.type,
            e !== null && t.stateNode != null)
                e.memoizedProps !== n && Ft(t);
            else {
                if (!n) {
                    if (t.stateNode === null)
                        throw Error(o(166));
                    return De(t),
                    null
                }
                e = ee.current,
                hn(t) ? lr(t) : (e = Dp(l, n, a),
                t.stateNode = e,
                Ft(t))
            }
            return De(t),
            null;
        case 5:
            if (Ql(t),
            l = t.type,
            e !== null && t.stateNode != null)
                e.memoizedProps !== n && Ft(t);
            else {
                if (!n) {
                    if (t.stateNode === null)
                        throw Error(o(166));
                    return De(t),
                    null
                }
                if (i = ee.current,
                hn(t))
                    lr(t);
                else {
                    var r = Ji(re.current);
                    switch (i) {
                    case 1:
                        i = r.createElementNS("http://www.w3.org/2000/svg", l);
                        break;
                    case 2:
                        i = r.createElementNS("http://www.w3.org/1998/Math/MathML", l);
                        break;
                    default:
                        switch (l) {
                        case "svg":
                            i = r.createElementNS("http://www.w3.org/2000/svg", l);
                            break;
                        case "math":
                            i = r.createElementNS("http://www.w3.org/1998/Math/MathML", l);
                            break;
                        case "script":
                            i = r.createElement("div"),
                            i.innerHTML = "<script><\/script>",
                            i = i.removeChild(i.firstChild);
                            break;
                        case "select":
                            i = typeof n.is == "string" ? r.createElement("select", {
                                is: n.is
                            }) : r.createElement("select"),
                            n.multiple ? i.multiple = !0 : n.size && (i.size = n.size);
                            break;
                        default:
                            i = typeof n.is == "string" ? r.createElement(l, {
                                is: n.is
                            }) : r.createElement(l)
                        }
                    }
                    i[Ze] = t,
                    i[lt] = n;
                    e: for (r = t.child; r !== null; ) {
                        if (r.tag === 5 || r.tag === 6)
                            i.appendChild(r.stateNode);
                        else if (r.tag !== 4 && r.tag !== 27 && r.child !== null) {
                            r.child.return = r,
                            r = r.child;
                            continue
                        }
                        if (r === t)
                            break e;
                        for (; r.sibling === null; ) {
                            if (r.return === null || r.return === t)
                                break e;
                            r = r.return
                        }
                        r.sibling.return = r.return,
                        r = r.sibling
                    }
                    t.stateNode = i;
                    e: switch ($e(i, l, n),
                    l) {
                    case "button":
                    case "input":
                    case "select":
                    case "textarea":
                        n = !!n.autoFocus;
                        break e;
                    case "img":
                        n = !0;
                        break e;
                    default:
                        n = !1
                    }
                    n && Ft(t)
                }
            }
            return De(t),
            Vc(t, t.type, e === null ? null : e.memoizedProps, t.pendingProps, a),
            null;
        case 6:
            if (e && t.stateNode != null)
                e.memoizedProps !== n && Ft(t);
            else {
                if (typeof n != "string" && t.stateNode === null)
                    throw Error(o(166));
                if (e = re.current,
                hn(t)) {
                    if (e = t.stateNode,
                    a = t.memoizedProps,
                    n = null,
                    l = Fe,
                    l !== null)
                        switch (l.tag) {
                        case 27:
                        case 5:
                            n = l.memoizedProps
                        }
                    e[Ze] = t,
                    e = !!(e.nodeValue === a || n !== null && n.suppressHydrationWarning === !0 || Sp(e.nodeValue, a)),
                    e || ra(t, !0)
                } else
                    e = Ji(e).createTextNode(n),
                    e[Ze] = t,
                    t.stateNode = e
            }
            return De(t),
            null;
        case 31:
            if (a = t.memoizedState,
            e === null || e.memoizedState !== null) {
                if (n = hn(t),
                a !== null) {
                    if (e === null) {
                        if (!n)
                            throw Error(o(318));
                        if (e = t.memoizedState,
                        e = e !== null ? e.dehydrated : null,
                        !e)
                            throw Error(o(557));
                        e[Ze] = t
                    } else
                        Ua(),
                        (t.flags & 128) === 0 && (t.memoizedState = null),
                        t.flags |= 4;
                    De(t),
                    e = !1
                } else
                    a = ac(),
                    e !== null && e.memoizedState !== null && (e.memoizedState.hydrationErrors = a),
                    e = !0;
                if (!e)
                    return t.flags & 256 ? (gt(t),
                    t) : (gt(t),
                    null);
                if ((t.flags & 128) !== 0)
                    throw Error(o(558))
            }
            return De(t),
            null;
        case 13:
            if (n = t.memoizedState,
            e === null || e.memoizedState !== null && e.memoizedState.dehydrated !== null) {
                if (l = hn(t),
                n !== null && n.dehydrated !== null) {
                    if (e === null) {
                        if (!l)
                            throw Error(o(318));
                        if (l = t.memoizedState,
                        l = l !== null ? l.dehydrated : null,
                        !l)
                            throw Error(o(317));
                        l[Ze] = t
                    } else
                        Ua(),
                        (t.flags & 128) === 0 && (t.memoizedState = null),
                        t.flags |= 4;
                    De(t),
                    l = !1
                } else
                    l = ac(),
                    e !== null && e.memoizedState !== null && (e.memoizedState.hydrationErrors = l),
                    l = !0;
                if (!l)
                    return t.flags & 256 ? (gt(t),
                    t) : (gt(t),
                    null)
            }
            return gt(t),
            (t.flags & 128) !== 0 ? (t.lanes = a,
            t) : (a = n !== null,
            e = e !== null && e.memoizedState !== null,
            a && (n = t.child,
            l = null,
            n.alternate !== null && n.alternate.memoizedState !== null && n.alternate.memoizedState.cachePool !== null && (l = n.alternate.memoizedState.cachePool.pool),
            i = null,
            n.memoizedState !== null && n.memoizedState.cachePool !== null && (i = n.memoizedState.cachePool.pool),
            i !== l && (n.flags |= 2048)),
            a !== e && a && (t.child.flags |= 8192),
            Bi(t, t.updateQueue),
            De(t),
            null);
        case 4:
            return ze(),
            e === null && yo(t.stateNode.containerInfo),
            De(t),
            null;
        case 10:
            return Vt(t.type),
            De(t),
            null;
        case 19:
            if (B(He),
            n = t.memoizedState,
            n === null)
                return De(t),
                null;
            if (l = (t.flags & 128) !== 0,
            i = n.rendering,
            i === null)
                if (l)
                    xl(n, !1);
                else {
                    if (Oe !== 0 || e !== null && (e.flags & 128) !== 0)
                        for (e = t.child; e !== null; ) {
                            if (i = wi(e),
                            i !== null) {
                                for (t.flags |= 128,
                                xl(n, !1),
                                e = i.updateQueue,
                                t.updateQueue = e,
                                Bi(t, e),
                                t.subtreeFlags = 0,
                                e = a,
                                a = t.child; a !== null; )
                                    $u(a, e),
                                    a = a.sibling;
                                return I(He, He.current & 1 | 2),
                                ge && Pt(t, n.treeForkCount),
                                t.child
                            }
                            e = e.sibling
                        }
                    n.tail !== null && dt() > Yi && (t.flags |= 128,
                    l = !0,
                    xl(n, !1),
                    t.lanes = 4194304)
                }
            else {
                if (!l)
                    if (e = wi(i),
                    e !== null) {
                        if (t.flags |= 128,
                        l = !0,
                        e = e.updateQueue,
                        t.updateQueue = e,
                        Bi(t, e),
                        xl(n, !0),
                        n.tail === null && n.tailMode === "hidden" && !i.alternate && !ge)
                            return De(t),
                            null
                    } else
                        2 * dt() - n.renderingStartTime > Yi && a !== 536870912 && (t.flags |= 128,
                        l = !0,
                        xl(n, !1),
                        t.lanes = 4194304);
                n.isBackwards ? (i.sibling = t.child,
                t.child = i) : (e = n.last,
                e !== null ? e.sibling = i : t.child = i,
                n.last = i)
            }
            return n.tail !== null ? (e = n.tail,
            n.rendering = e,
            n.tail = e.sibling,
            n.renderingStartTime = dt(),
            e.sibling = null,
            a = He.current,
            I(He, l ? a & 1 | 2 : a & 1),
            ge && Pt(t, n.treeForkCount),
            e) : (De(t),
            null);
        case 22:
        case 23:
            return gt(t),
            yc(),
            n = t.memoizedState !== null,
            e !== null ? e.memoizedState !== null !== n && (t.flags |= 8192) : n && (t.flags |= 8192),
            n ? (a & 536870912) !== 0 && (t.flags & 128) === 0 && (De(t),
            t.subtreeFlags & 6 && (t.flags |= 8192)) : De(t),
            a = t.updateQueue,
            a !== null && Bi(t, a.retryQueue),
            a = null,
            e !== null && e.memoizedState !== null && e.memoizedState.cachePool !== null && (a = e.memoizedState.cachePool.pool),
            n = null,
            t.memoizedState !== null && t.memoizedState.cachePool !== null && (n = t.memoizedState.cachePool.pool),
            n !== a && (t.flags |= 2048),
            e !== null && B(qa),
            null;
        case 24:
            return a = null,
            e !== null && (a = e.memoizedState.cache),
            t.memoizedState.cache !== a && (t.flags |= 2048),
            Vt(Ye),
            De(t),
            null;
        case 25:
            return null;
        case 30:
            return null
        }
        throw Error(o(156, t.tag))
    }
    function ky(e, t) {
        switch (ec(t),
        t.tag) {
        case 1:
            return e = t.flags,
            e & 65536 ? (t.flags = e & -65537 | 128,
            t) : null;
        case 3:
            return Vt(Ye),
            ze(),
            e = t.flags,
            (e & 65536) !== 0 && (e & 128) === 0 ? (t.flags = e & -65537 | 128,
            t) : null;
        case 26:
        case 27:
        case 5:
            return Ql(t),
            null;
        case 31:
            if (t.memoizedState !== null) {
                if (gt(t),
                t.alternate === null)
                    throw Error(o(340));
                Ua()
            }
            return e = t.flags,
            e & 65536 ? (t.flags = e & -65537 | 128,
            t) : null;
        case 13:
            if (gt(t),
            e = t.memoizedState,
            e !== null && e.dehydrated !== null) {
                if (t.alternate === null)
                    throw Error(o(340));
                Ua()
            }
            return e = t.flags,
            e & 65536 ? (t.flags = e & -65537 | 128,
            t) : null;
        case 19:
            return B(He),
            null;
        case 4:
            return ze(),
            null;
        case 10:
            return Vt(t.type),
            null;
        case 22:
        case 23:
            return gt(t),
            yc(),
            e !== null && B(qa),
            e = t.flags,
            e & 65536 ? (t.flags = e & -65537 | 128,
            t) : null;
        case 24:
            return Vt(Ye),
            null;
        case 25:
            return null;
        default:
            return null
        }
    }
    function Ad(e, t) {
        switch (ec(t),
        t.tag) {
        case 3:
            Vt(Ye),
            ze();
            break;
        case 26:
        case 27:
        case 5:
            Ql(t);
            break;
        case 4:
            ze();
            break;
        case 31:
            t.memoizedState !== null && gt(t);
            break;
        case 13:
            gt(t);
            break;
        case 19:
            B(He);
            break;
        case 10:
            Vt(t.type);
            break;
        case 22:
        case 23:
            gt(t),
            yc(),
            e !== null && B(qa);
            break;
        case 24:
            Vt(Ye)
        }
    }
    function Sl(e, t) {
        try {
            var a = t.updateQueue
              , n = a !== null ? a.lastEffect : null;
            if (n !== null) {
                var l = n.next;
                a = l;
                do {
                    if ((a.tag & e) === e) {
                        n = void 0;
                        var i = a.create
                          , r = a.inst;
                        n = i(),
                        r.destroy = n
                    }
                    a = a.next
                } while (a !== l)
            }
        } catch (m) {
            Ee(t, t.return, m)
        }
    }
    function ga(e, t, a) {
        try {
            var n = t.updateQueue
              , l = n !== null ? n.lastEffect : null;
            if (l !== null) {
                var i = l.next;
                n = i;
                do {
                    if ((n.tag & e) === e) {
                        var r = n.inst
                          , m = r.destroy;
                        if (m !== void 0) {
                            r.destroy = void 0,
                            l = t;
                            var b = a
                              , R = m;
                            try {
                                R()
                            } catch (M) {
                                Ee(l, b, M)
                            }
                        }
                    }
                    n = n.next
                } while (n !== i)
            }
        } catch (M) {
            Ee(t, t.return, M)
        }
    }
    function Td(e) {
        var t = e.updateQueue;
        if (t !== null) {
            var a = e.stateNode;
            try {
                gr(t, a)
            } catch (n) {
                Ee(e, e.return, n)
            }
        }
    }
    function Nd(e, t, a) {
        a.props = Ia(e.type, e.memoizedProps),
        a.state = e.memoizedState;
        try {
            a.componentWillUnmount()
        } catch (n) {
            Ee(e, t, n)
        }
    }
    function kl(e, t) {
        try {
            var a = e.ref;
            if (a !== null) {
                switch (e.tag) {
                case 26:
                case 27:
                case 5:
                    var n = e.stateNode;
                    break;
                case 30:
                    n = e.stateNode;
                    break;
                default:
                    n = e.stateNode
                }
                typeof a == "function" ? e.refCleanup = a(n) : a.current = n
            }
        } catch (l) {
            Ee(e, t, l)
        }
    }
    function zt(e, t) {
        var a = e.ref
          , n = e.refCleanup;
        if (a !== null)
            if (typeof n == "function")
                try {
                    n()
                } catch (l) {
                    Ee(e, t, l)
                } finally {
                    e.refCleanup = null,
                    e = e.alternate,
                    e != null && (e.refCleanup = null)
                }
            else if (typeof a == "function")
                try {
                    a(null)
                } catch (l) {
                    Ee(e, t, l)
                }
            else
                a.current = null
    }
    function Cd(e) {
        var t = e.type
          , a = e.memoizedProps
          , n = e.stateNode;
        try {
            e: switch (t) {
            case "button":
            case "input":
            case "select":
            case "textarea":
                a.autoFocus && n.focus();
                break e;
            case "img":
                a.src ? n.src = a.src : a.srcSet && (n.srcset = a.srcSet)
            }
        } catch (l) {
            Ee(e, e.return, l)
        }
    }
    function Qc(e, t, a) {
        try {
            var n = e.stateNode;
            Py(n, e.type, a, t),
            n[lt] = t
        } catch (l) {
            Ee(e, e.return, l)
        }
    }
    function Rd(e) {
        return e.tag === 5 || e.tag === 3 || e.tag === 26 || e.tag === 27 && Ea(e.type) || e.tag === 4
    }
    function Ic(e) {
        e: for (; ; ) {
            for (; e.sibling === null; ) {
                if (e.return === null || Rd(e.return))
                    return null;
                e = e.return
            }
            for (e.sibling.return = e.return,
            e = e.sibling; e.tag !== 5 && e.tag !== 6 && e.tag !== 18; ) {
                if (e.tag === 27 && Ea(e.type) || e.flags & 2 || e.child === null || e.tag === 4)
                    continue e;
                e.child.return = e,
                e = e.child
            }
            if (!(e.flags & 2))
                return e.stateNode
        }
    }
    function Zc(e, t, a) {
        var n = e.tag;
        if (n === 5 || n === 6)
            e = e.stateNode,
            t ? (a.nodeType === 9 ? a.body : a.nodeName === "HTML" ? a.ownerDocument.body : a).insertBefore(e, t) : (t = a.nodeType === 9 ? a.body : a.nodeName === "HTML" ? a.ownerDocument.body : a,
            t.appendChild(e),
            a = a._reactRootContainer,
            a != null || t.onclick !== null || (t.onclick = Yt));
        else if (n !== 4 && (n === 27 && Ea(e.type) && (a = e.stateNode,
        t = null),
        e = e.child,
        e !== null))
            for (Zc(e, t, a),
            e = e.sibling; e !== null; )
                Zc(e, t, a),
                e = e.sibling
    }
    function Oi(e, t, a) {
        var n = e.tag;
        if (n === 5 || n === 6)
            e = e.stateNode,
            t ? a.insertBefore(e, t) : a.appendChild(e);
        else if (n !== 4 && (n === 27 && Ea(e.type) && (a = e.stateNode),
        e = e.child,
        e !== null))
            for (Oi(e, t, a),
            e = e.sibling; e !== null; )
                Oi(e, t, a),
                e = e.sibling
    }
    function Kd(e) {
        var t = e.stateNode
          , a = e.memoizedProps;
        try {
            for (var n = e.type, l = t.attributes; l.length; )
                t.removeAttributeNode(l[0]);
            $e(t, n, a),
            t[Ze] = e,
            t[lt] = a
        } catch (i) {
            Ee(e, e.return, i)
        }
    }
    var Jt = !1
      , Pe = !1
      , Fc = !1
      , Dd = typeof WeakSet == "function" ? WeakSet : Set
      , Ie = null;
    function wy(e, t) {
        if (e = e.containerInfo,
        vo = ls,
        e = Pu(e),
        qs(e)) {
            if ("selectionStart"in e)
                var a = {
                    start: e.selectionStart,
                    end: e.selectionEnd
                };
            else
                e: {
                    a = (a = e.ownerDocument) && a.defaultView || window;
                    var n = a.getSelection && a.getSelection();
                    if (n && n.rangeCount !== 0) {
                        a = n.anchorNode;
                        var l = n.anchorOffset
                          , i = n.focusNode;
                        n = n.focusOffset;
                        try {
                            a.nodeType,
                            i.nodeType
                        } catch {
                            a = null;
                            break e
                        }
                        var r = 0
                          , m = -1
                          , b = -1
                          , R = 0
                          , M = 0
                          , U = e
                          , K = null;
                        t: for (; ; ) {
                            for (var j; U !== a || l !== 0 && U.nodeType !== 3 || (m = r + l),
                            U !== i || n !== 0 && U.nodeType !== 3 || (b = r + n),
                            U.nodeType === 3 && (r += U.nodeValue.length),
                            (j = U.firstChild) !== null; )
                                K = U,
                                U = j;
                            for (; ; ) {
                                if (U === e)
                                    break t;
                                if (K === a && ++R === l && (m = r),
                                K === i && ++M === n && (b = r),
                                (j = U.nextSibling) !== null)
                                    break;
                                U = K,
                                K = U.parentNode
                            }
                            U = j
                        }
                        a = m === -1 || b === -1 ? null : {
                            start: m,
                            end: b
                        }
                    } else
                        a = null
                }
            a = a || {
                start: 0,
                end: 0
            }
        } else
            a = null;
        for (bo = {
            focusedElem: e,
            selectionRange: a
        },
        ls = !1,
        Ie = t; Ie !== null; )
            if (t = Ie,
            e = t.child,
            (t.subtreeFlags & 1028) !== 0 && e !== null)
                e.return = t,
                Ie = e;
            else
                for (; Ie !== null; ) {
                    switch (t = Ie,
                    i = t.alternate,
                    e = t.flags,
                    t.tag) {
                    case 0:
                        if ((e & 4) !== 0 && (e = t.updateQueue,
                        e = e !== null ? e.events : null,
                        e !== null))
                            for (a = 0; a < e.length; a++)
                                l = e[a],
                                l.ref.impl = l.nextImpl;
                        break;
                    case 11:
                    case 15:
                        break;
                    case 1:
                        if ((e & 1024) !== 0 && i !== null) {
                            e = void 0,
                            a = t,
                            l = i.memoizedProps,
                            i = i.memoizedState,
                            n = a.stateNode;
                            try {
                                var $ = Ia(a.type, l);
                                e = n.getSnapshotBeforeUpdate($, i),
                                n.__reactInternalSnapshotBeforeUpdate = e
                            } catch (ie) {
                                Ee(a, a.return, ie)
                            }
                        }
                        break;
                    case 3:
                        if ((e & 1024) !== 0) {
                            if (e = t.stateNode.containerInfo,
                            a = e.nodeType,
                            a === 9)
                                ko(e);
                            else if (a === 1)
                                switch (e.nodeName) {
                                case "HEAD":
                                case "HTML":
                                case "BODY":
                                    ko(e);
                                    break;
                                default:
                                    e.textContent = ""
                                }
                        }
                        break;
                    case 5:
                    case 26:
                    case 27:
                    case 6:
                    case 4:
                    case 17:
                        break;
                    default:
                        if ((e & 1024) !== 0)
                            throw Error(o(163))
                    }
                    if (e = t.sibling,
                    e !== null) {
                        e.return = t.return,
                        Ie = e;
                        break
                    }
                    Ie = t.return
                }
    }
    function jd(e, t, a) {
        var n = a.flags;
        switch (a.tag) {
        case 0:
        case 11:
        case 15:
            $t(e, a),
            n & 4 && Sl(5, a);
            break;
        case 1:
            if ($t(e, a),
            n & 4)
                if (e = a.stateNode,
                t === null)
                    try {
                        e.componentDidMount()
                    } catch (r) {
                        Ee(a, a.return, r)
                    }
                else {
                    var l = Ia(a.type, t.memoizedProps);
                    t = t.memoizedState;
                    try {
                        e.componentDidUpdate(l, t, e.__reactInternalSnapshotBeforeUpdate)
                    } catch (r) {
                        Ee(a, a.return, r)
                    }
                }
            n & 64 && Td(a),
            n & 512 && kl(a, a.return);
            break;
        case 3:
            if ($t(e, a),
            n & 64 && (e = a.updateQueue,
            e !== null)) {
                if (t = null,
                a.child !== null)
                    switch (a.child.tag) {
                    case 27:
                    case 5:
                        t = a.child.stateNode;
                        break;
                    case 1:
                        t = a.child.stateNode
                    }
                try {
                    gr(e, t)
                } catch (r) {
                    Ee(a, a.return, r)
                }
            }
            break;
        case 27:
            t === null && n & 4 && Kd(a);
        case 26:
        case 5:
            $t(e, a),
            t === null && n & 4 && Cd(a),
            n & 512 && kl(a, a.return);
            break;
        case 12:
            $t(e, a);
            break;
        case 31:
            $t(e, a),
            n & 4 && Bd(e, a);
            break;
        case 13:
            $t(e, a),
            n & 4 && Od(e, a),
            n & 64 && (e = a.memoizedState,
            e !== null && (e = e.dehydrated,
            e !== null && (a = Dy.bind(null, a),
            Wy(e, a))));
            break;
        case 22:
            if (n = a.memoizedState !== null || Jt,
            !n) {
                t = t !== null && t.memoizedState !== null || Pe,
                l = Jt;
                var i = Pe;
                Jt = n,
                (Pe = t) && !i ? ea(e, a, (a.subtreeFlags & 8772) !== 0) : $t(e, a),
                Jt = l,
                Pe = i
            }
            break;
        case 30:
            break;
        default:
            $t(e, a)
        }
    }
    function Md(e) {
        var t = e.alternate;
        t !== null && (e.alternate = null,
        Md(t)),
        e.child = null,
        e.deletions = null,
        e.sibling = null,
        e.tag === 5 && (t = e.stateNode,
        t !== null && As(t)),
        e.stateNode = null,
        e.return = null,
        e.dependencies = null,
        e.memoizedProps = null,
        e.memoizedState = null,
        e.pendingProps = null,
        e.stateNode = null,
        e.updateQueue = null
    }
    var Me = null
      , st = !1;
    function Wt(e, t, a) {
        for (a = a.child; a !== null; )
            _d(e, t, a),
            a = a.sibling
    }
    function _d(e, t, a) {
        if (pt && typeof pt.onCommitFiberUnmount == "function")
            try {
                pt.onCommitFiberUnmount(Vn, a)
            } catch {}
        switch (a.tag) {
        case 26:
            Pe || zt(a, t),
            Wt(e, t, a),
            a.memoizedState ? a.memoizedState.count-- : a.stateNode && (a = a.stateNode,
            a.parentNode.removeChild(a));
            break;
        case 27:
            Pe || zt(a, t);
            var n = Me
              , l = st;
            Ea(a.type) && (Me = a.stateNode,
            st = !1),
            Wt(e, t, a),
            Kl(a.stateNode),
            Me = n,
            st = l;
            break;
        case 5:
            Pe || zt(a, t);
        case 6:
            if (n = Me,
            l = st,
            Me = null,
            Wt(e, t, a),
            Me = n,
            st = l,
            Me !== null)
                if (st)
                    try {
                        (Me.nodeType === 9 ? Me.body : Me.nodeName === "HTML" ? Me.ownerDocument.body : Me).removeChild(a.stateNode)
                    } catch (i) {
                        Ee(a, t, i)
                    }
                else
                    try {
                        Me.removeChild(a.stateNode)
                    } catch (i) {
                        Ee(a, t, i)
                    }
            break;
        case 18:
            Me !== null && (st ? (e = Me,
            Tp(e.nodeType === 9 ? e.body : e.nodeName === "HTML" ? e.ownerDocument.body : e, a.stateNode),
            On(e)) : Tp(Me, a.stateNode));
            break;
        case 4:
            n = Me,
            l = st,
            Me = a.stateNode.containerInfo,
            st = !0,
            Wt(e, t, a),
            Me = n,
            st = l;
            break;
        case 0:
        case 11:
        case 14:
        case 15:
            ga(2, a, t),
            Pe || ga(4, a, t),
            Wt(e, t, a);
            break;
        case 1:
            Pe || (zt(a, t),
            n = a.stateNode,
            typeof n.componentWillUnmount == "function" && Nd(a, t, n)),
            Wt(e, t, a);
            break;
        case 21:
            Wt(e, t, a);
            break;
        case 22:
            Pe = (n = Pe) || a.memoizedState !== null,
            Wt(e, t, a),
            Pe = n;
            break;
        default:
            Wt(e, t, a)
        }
    }
    function Bd(e, t) {
        if (t.memoizedState === null && (e = t.alternate,
        e !== null && (e = e.memoizedState,
        e !== null))) {
            e = e.dehydrated;
            try {
                On(e)
            } catch (a) {
                Ee(t, t.return, a)
            }
        }
    }
    function Od(e, t) {
        if (t.memoizedState === null && (e = t.alternate,
        e !== null && (e = e.memoizedState,
        e !== null && (e = e.dehydrated,
        e !== null))))
            try {
                On(e)
            } catch (a) {
                Ee(t, t.return, a)
            }
    }
    function Ey(e) {
        switch (e.tag) {
        case 31:
        case 13:
        case 19:
            var t = e.stateNode;
            return t === null && (t = e.stateNode = new Dd),
            t;
        case 22:
            return e = e.stateNode,
            t = e._retryCache,
            t === null && (t = e._retryCache = new Dd),
            t;
        default:
            throw Error(o(435, e.tag))
        }
    }
    function zi(e, t) {
        var a = Ey(e);
        t.forEach(function(n) {
            if (!a.has(n)) {
                a.add(n);
                var l = jy.bind(null, e, n);
                n.then(l, l)
            }
        })
    }
    function ct(e, t) {
        var a = t.deletions;
        if (a !== null)
            for (var n = 0; n < a.length; n++) {
                var l = a[n]
                  , i = e
                  , r = t
                  , m = r;
                e: for (; m !== null; ) {
                    switch (m.tag) {
                    case 27:
                        if (Ea(m.type)) {
                            Me = m.stateNode,
                            st = !1;
                            break e
                        }
                        break;
                    case 5:
                        Me = m.stateNode,
                        st = !1;
                        break e;
                    case 3:
                    case 4:
                        Me = m.stateNode.containerInfo,
                        st = !0;
                        break e
                    }
                    m = m.return
                }
                if (Me === null)
                    throw Error(o(160));
                _d(i, r, l),
                Me = null,
                st = !1,
                i = l.alternate,
                i !== null && (i.return = null),
                l.return = null
            }
        if (t.subtreeFlags & 13886)
            for (t = t.child; t !== null; )
                zd(t, e),
                t = t.sibling
    }
    var jt = null;
    function zd(e, t) {
        var a = e.alternate
          , n = e.flags;
        switch (e.tag) {
        case 0:
        case 11:
        case 14:
        case 15:
            ct(t, e),
            ot(e),
            n & 4 && (ga(3, e, e.return),
            Sl(3, e),
            ga(5, e, e.return));
            break;
        case 1:
            ct(t, e),
            ot(e),
            n & 512 && (Pe || a === null || zt(a, a.return)),
            n & 64 && Jt && (e = e.updateQueue,
            e !== null && (n = e.callbacks,
            n !== null && (a = e.shared.hiddenCallbacks,
            e.shared.hiddenCallbacks = a === null ? n : a.concat(n))));
            break;
        case 26:
            var l = jt;
            if (ct(t, e),
            ot(e),
            n & 512 && (Pe || a === null || zt(a, a.return)),
            n & 4) {
                var i = a !== null ? a.memoizedState : null;
                if (n = e.memoizedState,
                a === null)
                    if (n === null)
                        if (e.stateNode === null) {
                            e: {
                                n = e.type,
                                a = e.memoizedProps,
                                l = l.ownerDocument || l;
                                t: switch (n) {
                                case "title":
                                    i = l.getElementsByTagName("title")[0],
                                    (!i || i[Zn] || i[Ze] || i.namespaceURI === "http://www.w3.org/2000/svg" || i.hasAttribute("itemprop")) && (i = l.createElement(n),
                                    l.head.insertBefore(i, l.querySelector("head > title"))),
                                    $e(i, n, a),
                                    i[Ze] = e,
                                    Qe(i),
                                    n = i;
                                    break e;
                                case "link":
                                    var r = zp("link", "href", l).get(n + (a.href || ""));
                                    if (r) {
                                        for (var m = 0; m < r.length; m++)
                                            if (i = r[m],
                                            i.getAttribute("href") === (a.href == null || a.href === "" ? null : a.href) && i.getAttribute("rel") === (a.rel == null ? null : a.rel) && i.getAttribute("title") === (a.title == null ? null : a.title) && i.getAttribute("crossorigin") === (a.crossOrigin == null ? null : a.crossOrigin)) {
                                                r.splice(m, 1);
                                                break t
                                            }
                                    }
                                    i = l.createElement(n),
                                    $e(i, n, a),
                                    l.head.appendChild(i);
                                    break;
                                case "meta":
                                    if (r = zp("meta", "content", l).get(n + (a.content || ""))) {
                                        for (m = 0; m < r.length; m++)
                                            if (i = r[m],
                                            i.getAttribute("content") === (a.content == null ? null : "" + a.content) && i.getAttribute("name") === (a.name == null ? null : a.name) && i.getAttribute("property") === (a.property == null ? null : a.property) && i.getAttribute("http-equiv") === (a.httpEquiv == null ? null : a.httpEquiv) && i.getAttribute("charset") === (a.charSet == null ? null : a.charSet)) {
                                                r.splice(m, 1);
                                                break t
                                            }
                                    }
                                    i = l.createElement(n),
                                    $e(i, n, a),
                                    l.head.appendChild(i);
                                    break;
                                default:
                                    throw Error(o(468, n))
                                }
                                i[Ze] = e,
                                Qe(i),
                                n = i
                            }
                            e.stateNode = n
                        } else
                            Hp(l, e.type, e.stateNode);
                    else
                        e.stateNode = Op(l, n, e.memoizedProps);
                else
                    i !== n ? (i === null ? a.stateNode !== null && (a = a.stateNode,
                    a.parentNode.removeChild(a)) : i.count--,
                    n === null ? Hp(l, e.type, e.stateNode) : Op(l, n, e.memoizedProps)) : n === null && e.stateNode !== null && Qc(e, e.memoizedProps, a.memoizedProps)
            }
            break;
        case 27:
            ct(t, e),
            ot(e),
            n & 512 && (Pe || a === null || zt(a, a.return)),
            a !== null && n & 4 && Qc(e, e.memoizedProps, a.memoizedProps);
            break;
        case 5:
            if (ct(t, e),
            ot(e),
            n & 512 && (Pe || a === null || zt(a, a.return)),
            e.flags & 32) {
                l = e.stateNode;
                try {
                    sn(l, "")
                } catch ($) {
                    Ee(e, e.return, $)
                }
            }
            n & 4 && e.stateNode != null && (l = e.memoizedProps,
            Qc(e, l, a !== null ? a.memoizedProps : l)),
            n & 1024 && (Fc = !0);
            break;
        case 6:
            if (ct(t, e),
            ot(e),
            n & 4) {
                if (e.stateNode === null)
                    throw Error(o(162));
                n = e.memoizedProps,
                a = e.stateNode;
                try {
                    a.nodeValue = n
                } catch ($) {
                    Ee(e, e.return, $)
                }
            }
            break;
        case 3:
            if (es = null,
            l = jt,
            jt = Wi(t.containerInfo),
            ct(t, e),
            jt = l,
            ot(e),
            n & 4 && a !== null && a.memoizedState.isDehydrated)
                try {
                    On(t.containerInfo)
                } catch ($) {
                    Ee(e, e.return, $)
                }
            Fc && (Fc = !1,
            Hd(e));
            break;
        case 4:
            n = jt,
            jt = Wi(e.stateNode.containerInfo),
            ct(t, e),
            ot(e),
            jt = n;
            break;
        case 12:
            ct(t, e),
            ot(e);
            break;
        case 31:
            ct(t, e),
            ot(e),
            n & 4 && (n = e.updateQueue,
            n !== null && (e.updateQueue = null,
            zi(e, n)));
            break;
        case 13:
            ct(t, e),
            ot(e),
            e.child.flags & 8192 && e.memoizedState !== null != (a !== null && a.memoizedState !== null) && (Ui = dt()),
            n & 4 && (n = e.updateQueue,
            n !== null && (e.updateQueue = null,
            zi(e, n)));
            break;
        case 22:
            l = e.memoizedState !== null;
            var b = a !== null && a.memoizedState !== null
              , R = Jt
              , M = Pe;
            if (Jt = R || l,
            Pe = M || b,
            ct(t, e),
            Pe = M,
            Jt = R,
            ot(e),
            n & 8192)
                e: for (t = e.stateNode,
                t._visibility = l ? t._visibility & -2 : t._visibility | 1,
                l && (a === null || b || Jt || Pe || Za(e)),
                a = null,
                t = e; ; ) {
                    if (t.tag === 5 || t.tag === 26) {
                        if (a === null) {
                            b = a = t;
                            try {
                                if (i = b.stateNode,
                                l)
                                    r = i.style,
                                    typeof r.setProperty == "function" ? r.setProperty("display", "none", "important") : r.display = "none";
                                else {
                                    m = b.stateNode;
                                    var U = b.memoizedProps.style
                                      , K = U != null && U.hasOwnProperty("display") ? U.display : null;
                                    m.style.display = K == null || typeof K == "boolean" ? "" : ("" + K).trim()
                                }
                            } catch ($) {
                                Ee(b, b.return, $)
                            }
                        }
                    } else if (t.tag === 6) {
                        if (a === null) {
                            b = t;
                            try {
                                b.stateNode.nodeValue = l ? "" : b.memoizedProps
                            } catch ($) {
                                Ee(b, b.return, $)
                            }
                        }
                    } else if (t.tag === 18) {
                        if (a === null) {
                            b = t;
                            try {
                                var j = b.stateNode;
                                l ? Np(j, !0) : Np(b.stateNode, !1)
                            } catch ($) {
                                Ee(b, b.return, $)
                            }
                        }
                    } else if ((t.tag !== 22 && t.tag !== 23 || t.memoizedState === null || t === e) && t.child !== null) {
                        t.child.return = t,
                        t = t.child;
                        continue
                    }
                    if (t === e)
                        break e;
                    for (; t.sibling === null; ) {
                        if (t.return === null || t.return === e)
                            break e;
                        a === t && (a = null),
                        t = t.return
                    }
                    a === t && (a = null),
                    t.sibling.return = t.return,
                    t = t.sibling
                }
            n & 4 && (n = e.updateQueue,
            n !== null && (a = n.retryQueue,
            a !== null && (n.retryQueue = null,
            zi(e, a))));
            break;
        case 19:
            ct(t, e),
            ot(e),
            n & 4 && (n = e.updateQueue,
            n !== null && (e.updateQueue = null,
            zi(e, n)));
            break;
        case 30:
            break;
        case 21:
            break;
        default:
            ct(t, e),
            ot(e)
        }
    }
    function ot(e) {
        var t = e.flags;
        if (t & 2) {
            try {
                for (var a, n = e.return; n !== null; ) {
                    if (Rd(n)) {
                        a = n;
                        break
                    }
                    n = n.return
                }
                if (a == null)
                    throw Error(o(160));
                switch (a.tag) {
                case 27:
                    var l = a.stateNode
                      , i = Ic(e);
                    Oi(e, i, l);
                    break;
                case 5:
                    var r = a.stateNode;
                    a.flags & 32 && (sn(r, ""),
                    a.flags &= -33);
                    var m = Ic(e);
                    Oi(e, m, r);
                    break;
                case 3:
                case 4:
                    var b = a.stateNode.containerInfo
                      , R = Ic(e);
                    Zc(e, R, b);
                    break;
                default:
                    throw Error(o(161))
                }
            } catch (M) {
                Ee(e, e.return, M)
            }
            e.flags &= -3
        }
        t & 4096 && (e.flags &= -4097)
    }
    function Hd(e) {
        if (e.subtreeFlags & 1024)
            for (e = e.child; e !== null; ) {
                var t = e;
                Hd(t),
                t.tag === 5 && t.flags & 1024 && t.stateNode.reset(),
                e = e.sibling
            }
    }
    function $t(e, t) {
        if (t.subtreeFlags & 8772)
            for (t = t.child; t !== null; )
                jd(e, t.alternate, t),
                t = t.sibling
    }
    function Za(e) {
        for (e = e.child; e !== null; ) {
            var t = e;
            switch (t.tag) {
            case 0:
            case 11:
            case 14:
            case 15:
                ga(4, t, t.return),
                Za(t);
                break;
            case 1:
                zt(t, t.return);
                var a = t.stateNode;
                typeof a.componentWillUnmount == "function" && Nd(t, t.return, a),
                Za(t);
                break;
            case 27:
                Kl(t.stateNode);
            case 26:
            case 5:
                zt(t, t.return),
                Za(t);
                break;
            case 22:
                t.memoizedState === null && Za(t);
                break;
            case 30:
                Za(t);
                break;
            default:
                Za(t)
            }
            e = e.sibling
        }
    }
    function ea(e, t, a) {
        for (a = a && (t.subtreeFlags & 8772) !== 0,
        t = t.child; t !== null; ) {
            var n = t.alternate
              , l = e
              , i = t
              , r = i.flags;
            switch (i.tag) {
            case 0:
            case 11:
            case 15:
                ea(l, i, a),
                Sl(4, i);
                break;
            case 1:
                if (ea(l, i, a),
                n = i,
                l = n.stateNode,
                typeof l.componentDidMount == "function")
                    try {
                        l.componentDidMount()
                    } catch (R) {
                        Ee(n, n.return, R)
                    }
                if (n = i,
                l = n.updateQueue,
                l !== null) {
                    var m = n.stateNode;
                    try {
                        var b = l.shared.hiddenCallbacks;
                        if (b !== null)
                            for (l.shared.hiddenCallbacks = null,
                            l = 0; l < b.length; l++)
                                hr(b[l], m)
                    } catch (R) {
                        Ee(n, n.return, R)
                    }
                }
                a && r & 64 && Td(i),
                kl(i, i.return);
                break;
            case 27:
                Kd(i);
            case 26:
            case 5:
                ea(l, i, a),
                a && n === null && r & 4 && Cd(i),
                kl(i, i.return);
                break;
            case 12:
                ea(l, i, a);
                break;
            case 31:
                ea(l, i, a),
                a && r & 4 && Bd(l, i);
                break;
            case 13:
                ea(l, i, a),
                a && r & 4 && Od(l, i);
                break;
            case 22:
                i.memoizedState === null && ea(l, i, a),
                kl(i, i.return);
                break;
            case 30:
                break;
            default:
                ea(l, i, a)
            }
            t = t.sibling
        }
    }
    function Jc(e, t) {
        var a = null;
        e !== null && e.memoizedState !== null && e.memoizedState.cachePool !== null && (a = e.memoizedState.cachePool.pool),
        e = null,
        t.memoizedState !== null && t.memoizedState.cachePool !== null && (e = t.memoizedState.cachePool.pool),
        e !== a && (e != null && e.refCount++,
        a != null && ol(a))
    }
    function Wc(e, t) {
        e = null,
        t.alternate !== null && (e = t.alternate.memoizedState.cache),
        t = t.memoizedState.cache,
        t !== e && (t.refCount++,
        e != null && ol(e))
    }
    function Mt(e, t, a, n) {
        if (t.subtreeFlags & 10256)
            for (t = t.child; t !== null; )
                Ud(e, t, a, n),
                t = t.sibling
    }
    function Ud(e, t, a, n) {
        var l = t.flags;
        switch (t.tag) {
        case 0:
        case 11:
        case 15:
            Mt(e, t, a, n),
            l & 2048 && Sl(9, t);
            break;
        case 1:
            Mt(e, t, a, n);
            break;
        case 3:
            Mt(e, t, a, n),
            l & 2048 && (e = null,
            t.alternate !== null && (e = t.alternate.memoizedState.cache),
            t = t.memoizedState.cache,
            t !== e && (t.refCount++,
            e != null && ol(e)));
            break;
        case 12:
            if (l & 2048) {
                Mt(e, t, a, n),
                e = t.stateNode;
                try {
                    var i = t.memoizedProps
                      , r = i.id
                      , m = i.onPostCommit;
                    typeof m == "function" && m(r, t.alternate === null ? "mount" : "update", e.passiveEffectDuration, -0)
                } catch (b) {
                    Ee(t, t.return, b)
                }
            } else
                Mt(e, t, a, n);
            break;
        case 31:
            Mt(e, t, a, n);
            break;
        case 13:
            Mt(e, t, a, n);
            break;
        case 23:
            break;
        case 22:
            i = t.stateNode,
            r = t.alternate,
            t.memoizedState !== null ? i._visibility & 2 ? Mt(e, t, a, n) : wl(e, t) : i._visibility & 2 ? Mt(e, t, a, n) : (i._visibility |= 2,
            An(e, t, a, n, (t.subtreeFlags & 10256) !== 0 || !1)),
            l & 2048 && Jc(r, t);
            break;
        case 24:
            Mt(e, t, a, n),
            l & 2048 && Wc(t.alternate, t);
            break;
        default:
            Mt(e, t, a, n)
        }
    }
    function An(e, t, a, n, l) {
        for (l = l && ((t.subtreeFlags & 10256) !== 0 || !1),
        t = t.child; t !== null; ) {
            var i = e
              , r = t
              , m = a
              , b = n
              , R = r.flags;
            switch (r.tag) {
            case 0:
            case 11:
            case 15:
                An(i, r, m, b, l),
                Sl(8, r);
                break;
            case 23:
                break;
            case 22:
                var M = r.stateNode;
                r.memoizedState !== null ? M._visibility & 2 ? An(i, r, m, b, l) : wl(i, r) : (M._visibility |= 2,
                An(i, r, m, b, l)),
                l && R & 2048 && Jc(r.alternate, r);
                break;
            case 24:
                An(i, r, m, b, l),
                l && R & 2048 && Wc(r.alternate, r);
                break;
            default:
                An(i, r, m, b, l)
            }
            t = t.sibling
        }
    }
    function wl(e, t) {
        if (t.subtreeFlags & 10256)
            for (t = t.child; t !== null; ) {
                var a = e
                  , n = t
                  , l = n.flags;
                switch (n.tag) {
                case 22:
                    wl(a, n),
                    l & 2048 && Jc(n.alternate, n);
                    break;
                case 24:
                    wl(a, n),
                    l & 2048 && Wc(n.alternate, n);
                    break;
                default:
                    wl(a, n)
                }
                t = t.sibling
            }
    }
    var El = 8192;
    function Tn(e, t, a) {
        if (e.subtreeFlags & El)
            for (e = e.child; e !== null; )
                Yd(e, t, a),
                e = e.sibling
    }
    function Yd(e, t, a) {
        switch (e.tag) {
        case 26:
            Tn(e, t, a),
            e.flags & El && e.memoizedState !== null && rh(a, jt, e.memoizedState, e.memoizedProps);
            break;
        case 5:
            Tn(e, t, a);
            break;
        case 3:
        case 4:
            var n = jt;
            jt = Wi(e.stateNode.containerInfo),
            Tn(e, t, a),
            jt = n;
            break;
        case 22:
            e.memoizedState === null && (n = e.alternate,
            n !== null && n.memoizedState !== null ? (n = El,
            El = 16777216,
            Tn(e, t, a),
            El = n) : Tn(e, t, a));
            break;
        default:
            Tn(e, t, a)
        }
    }
    function Gd(e) {
        var t = e.alternate;
        if (t !== null && (e = t.child,
        e !== null)) {
            t.child = null;
            do
                t = e.sibling,
                e.sibling = null,
                e = t;
            while (e !== null)
        }
    }
    function Ll(e) {
        var t = e.deletions;
        if ((e.flags & 16) !== 0) {
            if (t !== null)
                for (var a = 0; a < t.length; a++) {
                    var n = t[a];
                    Ie = n,
                    Pd(n, e)
                }
            Gd(e)
        }
        if (e.subtreeFlags & 10256)
            for (e = e.child; e !== null; )
                qd(e),
                e = e.sibling
    }
    function qd(e) {
        switch (e.tag) {
        case 0:
        case 11:
        case 15:
            Ll(e),
            e.flags & 2048 && ga(9, e, e.return);
            break;
        case 3:
            Ll(e);
            break;
        case 12:
            Ll(e);
            break;
        case 22:
            var t = e.stateNode;
            e.memoizedState !== null && t._visibility & 2 && (e.return === null || e.return.tag !== 13) ? (t._visibility &= -3,
            Hi(e)) : Ll(e);
            break;
        default:
            Ll(e)
        }
    }
    function Hi(e) {
        var t = e.deletions;
        if ((e.flags & 16) !== 0) {
            if (t !== null)
                for (var a = 0; a < t.length; a++) {
                    var n = t[a];
                    Ie = n,
                    Pd(n, e)
                }
            Gd(e)
        }
        for (e = e.child; e !== null; ) {
            switch (t = e,
            t.tag) {
            case 0:
            case 11:
            case 15:
                ga(8, t, t.return),
                Hi(t);
                break;
            case 22:
                a = t.stateNode,
                a._visibility & 2 && (a._visibility &= -3,
                Hi(t));
                break;
            default:
                Hi(t)
            }
            e = e.sibling
        }
    }
    function Pd(e, t) {
        for (; Ie !== null; ) {
            var a = Ie;
            switch (a.tag) {
            case 0:
            case 11:
            case 15:
                ga(8, a, t);
                break;
            case 23:
            case 22:
                if (a.memoizedState !== null && a.memoizedState.cachePool !== null) {
                    var n = a.memoizedState.cachePool.pool;
                    n != null && n.refCount++
                }
                break;
            case 24:
                ol(a.memoizedState.cache)
            }
            if (n = a.child,
            n !== null)
                n.return = a,
                Ie = n;
            else
                e: for (a = e; Ie !== null; ) {
                    n = Ie;
                    var l = n.sibling
                      , i = n.return;
                    if (Md(n),
                    n === a) {
                        Ie = null;
                        break e
                    }
                    if (l !== null) {
                        l.return = i,
                        Ie = l;
                        break e
                    }
                    Ie = i
                }
        }
    }
    var Ly = {
        getCacheForType: function(e) {
            var t = Je(Ye)
              , a = t.data.get(e);
            return a === void 0 && (a = e(),
            t.data.set(e, a)),
            a
        },
        cacheSignal: function() {
            return Je(Ye).controller.signal
        }
    }
      , Ay = typeof WeakMap == "function" ? WeakMap : Map
      , Se = 0
      , Ce = null
      , de = null
      , ye = 0
      , we = 0
      , vt = null
      , va = !1
      , Nn = !1
      , $c = !1
      , ta = 0
      , Oe = 0
      , ba = 0
      , Fa = 0
      , eo = 0
      , bt = 0
      , Cn = 0
      , Al = null
      , ut = null
      , to = !1
      , Ui = 0
      , Xd = 0
      , Yi = 1 / 0
      , Gi = null
      , xa = null
      , Ve = 0
      , Sa = null
      , Rn = null
      , aa = 0
      , ao = 0
      , no = null
      , Vd = null
      , Tl = 0
      , lo = null;
    function xt() {
        return (Se & 2) !== 0 && ye !== 0 ? ye & -ye : N.T !== null ? ro() : ou()
    }
    function Qd() {
        if (bt === 0)
            if ((ye & 536870912) === 0 || ge) {
                var e = Fl;
                Fl <<= 1,
                (Fl & 3932160) === 0 && (Fl = 262144),
                bt = e
            } else
                bt = 536870912;
        return e = ht.current,
        e !== null && (e.flags |= 32),
        bt
    }
    function rt(e, t, a) {
        (e === Ce && (we === 2 || we === 9) || e.cancelPendingCommit !== null) && (Kn(e, 0),
        ka(e, ye, bt, !1)),
        In(e, a),
        ((Se & 2) === 0 || e !== Ce) && (e === Ce && ((Se & 2) === 0 && (Fa |= a),
        Oe === 4 && ka(e, ye, bt, !1)),
        Ht(e))
    }
    function Id(e, t, a) {
        if ((Se & 6) !== 0)
            throw Error(o(327));
        var n = !a && (t & 127) === 0 && (t & e.expiredLanes) === 0 || Qn(e, t)
          , l = n ? Cy(e, t) : so(e, t, !0)
          , i = n;
        do {
            if (l === 0) {
                Nn && !n && ka(e, t, 0, !1);
                break
            } else {
                if (a = e.current.alternate,
                i && !Ty(a)) {
                    l = so(e, t, !1),
                    i = !1;
                    continue
                }
                if (l === 2) {
                    if (i = t,
                    e.errorRecoveryDisabledLanes & i)
                        var r = 0;
                    else
                        r = e.pendingLanes & -536870913,
                        r = r !== 0 ? r : r & 536870912 ? 536870912 : 0;
                    if (r !== 0) {
                        t = r;
                        e: {
                            var m = e;
                            l = Al;
                            var b = m.current.memoizedState.isDehydrated;
                            if (b && (Kn(m, r).flags |= 256),
                            r = so(m, r, !1),
                            r !== 2) {
                                if ($c && !b) {
                                    m.errorRecoveryDisabledLanes |= i,
                                    Fa |= i,
                                    l = 4;
                                    break e
                                }
                                i = ut,
                                ut = l,
                                i !== null && (ut === null ? ut = i : ut.push.apply(ut, i))
                            }
                            l = r
                        }
                        if (i = !1,
                        l !== 2)
                            continue
                    }
                }
                if (l === 1) {
                    Kn(e, 0),
                    ka(e, t, 0, !0);
                    break
                }
                e: {
                    switch (n = e,
                    i = l,
                    i) {
                    case 0:
                    case 1:
                        throw Error(o(345));
                    case 4:
                        if ((t & 4194048) !== t)
                            break;
                    case 6:
                        ka(n, t, bt, !va);
                        break e;
                    case 2:
                        ut = null;
                        break;
                    case 3:
                    case 5:
                        break;
                    default:
                        throw Error(o(329))
                    }
                    if ((t & 62914560) === t && (l = Ui + 300 - dt(),
                    10 < l)) {
                        if (ka(n, t, bt, !va),
                        Wl(n, 0, !0) !== 0)
                            break e;
                        aa = t,
                        n.timeoutHandle = Lp(Zd.bind(null, n, a, ut, Gi, to, t, bt, Fa, Cn, va, i, "Throttled", -0, 0), l);
                        break e
                    }
                    Zd(n, a, ut, Gi, to, t, bt, Fa, Cn, va, i, null, -0, 0)
                }
            }
            break
        } while (!0);
        Ht(e)
    }
    function Zd(e, t, a, n, l, i, r, m, b, R, M, U, K, j) {
        if (e.timeoutHandle = -1,
        U = t.subtreeFlags,
        U & 8192 || (U & 16785408) === 16785408) {
            U = {
                stylesheets: null,
                count: 0,
                imgCount: 0,
                imgBytes: 0,
                suspenseyImages: [],
                waitingForImages: !0,
                waitingForViewTransition: !1,
                unsuspend: Yt
            },
            Yd(t, i, U);
            var $ = (i & 62914560) === i ? Ui - dt() : (i & 4194048) === i ? Xd - dt() : 0;
            if ($ = dh(U, $),
            $ !== null) {
                aa = i,
                e.cancelPendingCommit = $(np.bind(null, e, t, i, a, n, l, r, m, b, M, U, null, K, j)),
                ka(e, i, r, !R);
                return
            }
        }
        np(e, t, i, a, n, l, r, m, b)
    }
    function Ty(e) {
        for (var t = e; ; ) {
            var a = t.tag;
            if ((a === 0 || a === 11 || a === 15) && t.flags & 16384 && (a = t.updateQueue,
            a !== null && (a = a.stores,
            a !== null)))
                for (var n = 0; n < a.length; n++) {
                    var l = a[n]
                      , i = l.getSnapshot;
                    l = l.value;
                    try {
                        if (!mt(i(), l))
                            return !1
                    } catch {
                        return !1
                    }
                }
            if (a = t.child,
            t.subtreeFlags & 16384 && a !== null)
                a.return = t,
                t = a;
            else {
                if (t === e)
                    break;
                for (; t.sibling === null; ) {
                    if (t.return === null || t.return === e)
                        return !0;
                    t = t.return
                }
                t.sibling.return = t.return,
                t = t.sibling
            }
        }
        return !0
    }
    function ka(e, t, a, n) {
        t &= ~eo,
        t &= ~Fa,
        e.suspendedLanes |= t,
        e.pingedLanes &= ~t,
        n && (e.warmLanes |= t),
        n = e.expirationTimes;
        for (var l = t; 0 < l; ) {
            var i = 31 - ft(l)
              , r = 1 << i;
            n[i] = -1,
            l &= ~r
        }
        a !== 0 && iu(e, a, t)
    }
    function qi() {
        return (Se & 6) === 0 ? (Nl(0),
        !1) : !0
    }
    function io() {
        if (de !== null) {
            if (we === 0)
                var e = de.return;
            else
                e = de,
                Xt = Ya = null,
                Sc(e),
                Sn = null,
                rl = 0,
                e = de;
            for (; e !== null; )
                Ad(e.alternate, e),
                e = e.return;
            de = null
        }
    }
    function Kn(e, t) {
        var a = e.timeoutHandle;
        a !== -1 && (e.timeoutHandle = -1,
        Qy(a)),
        a = e.cancelPendingCommit,
        a !== null && (e.cancelPendingCommit = null,
        a()),
        aa = 0,
        io(),
        Ce = e,
        de = a = qt(e.current, null),
        ye = t,
        we = 0,
        vt = null,
        va = !1,
        Nn = Qn(e, t),
        $c = !1,
        Cn = bt = eo = Fa = ba = Oe = 0,
        ut = Al = null,
        to = !1,
        (t & 8) !== 0 && (t |= t & 32);
        var n = e.entangledLanes;
        if (n !== 0)
            for (e = e.entanglements,
            n &= t; 0 < n; ) {
                var l = 31 - ft(n)
                  , i = 1 << l;
                t |= e[l],
                n &= ~i
            }
        return ta = t,
        ri(),
        a
    }
    function Fd(e, t) {
        oe = null,
        N.H = vl,
        t === xn || t === vi ? (t = pr(),
        we = 3) : t === uc ? (t = pr(),
        we = 4) : we = t === Oc ? 8 : t !== null && typeof t == "object" && typeof t.then == "function" ? 6 : 1,
        vt = t,
        de === null && (Oe = 1,
        Di(e, Et(t, e.current)))
    }
    function Jd() {
        var e = ht.current;
        return e === null ? !0 : (ye & 4194048) === ye ? Nt === null : (ye & 62914560) === ye || (ye & 536870912) !== 0 ? e === Nt : !1
    }
    function Wd() {
        var e = N.H;
        return N.H = vl,
        e === null ? vl : e
    }
    function $d() {
        var e = N.A;
        return N.A = Ly,
        e
    }
    function Pi() {
        Oe = 4,
        va || (ye & 4194048) !== ye && ht.current !== null || (Nn = !0),
        (ba & 134217727) === 0 && (Fa & 134217727) === 0 || Ce === null || ka(Ce, ye, bt, !1)
    }
    function so(e, t, a) {
        var n = Se;
        Se |= 2;
        var l = Wd()
          , i = $d();
        (Ce !== e || ye !== t) && (Gi = null,
        Kn(e, t)),
        t = !1;
        var r = Oe;
        e: do
            try {
                if (we !== 0 && de !== null) {
                    var m = de
                      , b = vt;
                    switch (we) {
                    case 8:
                        io(),
                        r = 6;
                        break e;
                    case 3:
                    case 2:
                    case 9:
                    case 6:
                        ht.current === null && (t = !0);
                        var R = we;
                        if (we = 0,
                        vt = null,
                        Dn(e, m, b, R),
                        a && Nn) {
                            r = 0;
                            break e
                        }
                        break;
                    default:
                        R = we,
                        we = 0,
                        vt = null,
                        Dn(e, m, b, R)
                    }
                }
                Ny(),
                r = Oe;
                break
            } catch (M) {
                Fd(e, M)
            }
        while (!0);
        return t && e.shellSuspendCounter++,
        Xt = Ya = null,
        Se = n,
        N.H = l,
        N.A = i,
        de === null && (Ce = null,
        ye = 0,
        ri()),
        r
    }
    function Ny() {
        for (; de !== null; )
            ep(de)
    }
    function Cy(e, t) {
        var a = Se;
        Se |= 2;
        var n = Wd()
          , l = $d();
        Ce !== e || ye !== t ? (Gi = null,
        Yi = dt() + 500,
        Kn(e, t)) : Nn = Qn(e, t);
        e: do
            try {
                if (we !== 0 && de !== null) {
                    t = de;
                    var i = vt;
                    t: switch (we) {
                    case 1:
                        we = 0,
                        vt = null,
                        Dn(e, t, i, 1);
                        break;
                    case 2:
                    case 9:
                        if (rr(i)) {
                            we = 0,
                            vt = null,
                            tp(t);
                            break
                        }
                        t = function() {
                            we !== 2 && we !== 9 || Ce !== e || (we = 7),
                            Ht(e)
                        }
                        ,
                        i.then(t, t);
                        break e;
                    case 3:
                        we = 7;
                        break e;
                    case 4:
                        we = 5;
                        break e;
                    case 7:
                        rr(i) ? (we = 0,
                        vt = null,
                        tp(t)) : (we = 0,
                        vt = null,
                        Dn(e, t, i, 7));
                        break;
                    case 5:
                        var r = null;
                        switch (de.tag) {
                        case 26:
                            r = de.memoizedState;
                        case 5:
                        case 27:
                            var m = de;
                            if (r ? Up(r) : m.stateNode.complete) {
                                we = 0,
                                vt = null;
                                var b = m.sibling;
                                if (b !== null)
                                    de = b;
                                else {
                                    var R = m.return;
                                    R !== null ? (de = R,
                                    Xi(R)) : de = null
                                }
                                break t
                            }
                        }
                        we = 0,
                        vt = null,
                        Dn(e, t, i, 5);
                        break;
                    case 6:
                        we = 0,
                        vt = null,
                        Dn(e, t, i, 6);
                        break;
                    case 8:
                        io(),
                        Oe = 6;
                        break e;
                    default:
                        throw Error(o(462))
                    }
                }
                Ry();
                break
            } catch (M) {
                Fd(e, M)
            }
        while (!0);
        return Xt = Ya = null,
        N.H = n,
        N.A = l,
        Se = a,
        de !== null ? 0 : (Ce = null,
        ye = 0,
        ri(),
        Oe)
    }
    function Ry() {
        for (; de !== null && !$f(); )
            ep(de)
    }
    function ep(e) {
        var t = Ed(e.alternate, e, ta);
        e.memoizedProps = e.pendingProps,
        t === null ? Xi(e) : de = t
    }
    function tp(e) {
        var t = e
          , a = t.alternate;
        switch (t.tag) {
        case 15:
        case 0:
            t = vd(a, t, t.pendingProps, t.type, void 0, ye);
            break;
        case 11:
            t = vd(a, t, t.pendingProps, t.type.render, t.ref, ye);
            break;
        case 5:
            Sc(t);
        default:
            Ad(a, t),
            t = de = $u(t, ta),
            t = Ed(a, t, ta)
        }
        e.memoizedProps = e.pendingProps,
        t === null ? Xi(e) : de = t
    }
    function Dn(e, t, a, n) {
        Xt = Ya = null,
        Sc(t),
        Sn = null,
        rl = 0;
        var l = t.return;
        try {
            if (vy(e, l, t, a, ye)) {
                Oe = 1,
                Di(e, Et(a, e.current)),
                de = null;
                return
            }
        } catch (i) {
            if (l !== null)
                throw de = l,
                i;
            Oe = 1,
            Di(e, Et(a, e.current)),
            de = null;
            return
        }
        t.flags & 32768 ? (ge || n === 1 ? e = !0 : Nn || (ye & 536870912) !== 0 ? e = !1 : (va = e = !0,
        (n === 2 || n === 9 || n === 3 || n === 6) && (n = ht.current,
        n !== null && n.tag === 13 && (n.flags |= 16384))),
        ap(t, e)) : Xi(t)
    }
    function Xi(e) {
        var t = e;
        do {
            if ((t.flags & 32768) !== 0) {
                ap(t, va);
                return
            }
            e = t.return;
            var a = Sy(t.alternate, t, ta);
            if (a !== null) {
                de = a;
                return
            }
            if (t = t.sibling,
            t !== null) {
                de = t;
                return
            }
            de = t = e
        } while (t !== null);
        Oe === 0 && (Oe = 5)
    }
    function ap(e, t) {
        do {
            var a = ky(e.alternate, e);
            if (a !== null) {
                a.flags &= 32767,
                de = a;
                return
            }
            if (a = e.return,
            a !== null && (a.flags |= 32768,
            a.subtreeFlags = 0,
            a.deletions = null),
            !t && (e = e.sibling,
            e !== null)) {
                de = e;
                return
            }
            de = e = a
        } while (e !== null);
        Oe = 6,
        de = null
    }
    function np(e, t, a, n, l, i, r, m, b) {
        e.cancelPendingCommit = null;
        do
            Vi();
        while (Ve !== 0);
        if ((Se & 6) !== 0)
            throw Error(o(327));
        if (t !== null) {
            if (t === e.current)
                throw Error(o(177));
            if (i = t.lanes | t.childLanes,
            i |= Is,
            um(e, a, i, r, m, b),
            e === Ce && (de = Ce = null,
            ye = 0),
            Rn = t,
            Sa = e,
            aa = a,
            ao = i,
            no = l,
            Vd = n,
            (t.subtreeFlags & 10256) !== 0 || (t.flags & 10256) !== 0 ? (e.callbackNode = null,
            e.callbackPriority = 0,
            My(Il, function() {
                return op(),
                null
            })) : (e.callbackNode = null,
            e.callbackPriority = 0),
            n = (t.flags & 13878) !== 0,
            (t.subtreeFlags & 13878) !== 0 || n) {
                n = N.T,
                N.T = null,
                l = Y.p,
                Y.p = 2,
                r = Se,
                Se |= 4;
                try {
                    wy(e, t, a)
                } finally {
                    Se = r,
                    Y.p = l,
                    N.T = n
                }
            }
            Ve = 1,
            lp(),
            ip(),
            sp()
        }
    }
    function lp() {
        if (Ve === 1) {
            Ve = 0;
            var e = Sa
              , t = Rn
              , a = (t.flags & 13878) !== 0;
            if ((t.subtreeFlags & 13878) !== 0 || a) {
                a = N.T,
                N.T = null;
                var n = Y.p;
                Y.p = 2;
                var l = Se;
                Se |= 4;
                try {
                    zd(t, e);
                    var i = bo
                      , r = Pu(e.containerInfo)
                      , m = i.focusedElem
                      , b = i.selectionRange;
                    if (r !== m && m && m.ownerDocument && qu(m.ownerDocument.documentElement, m)) {
                        if (b !== null && qs(m)) {
                            var R = b.start
                              , M = b.end;
                            if (M === void 0 && (M = R),
                            "selectionStart"in m)
                                m.selectionStart = R,
                                m.selectionEnd = Math.min(M, m.value.length);
                            else {
                                var U = m.ownerDocument || document
                                  , K = U && U.defaultView || window;
                                if (K.getSelection) {
                                    var j = K.getSelection()
                                      , $ = m.textContent.length
                                      , ie = Math.min(b.start, $)
                                      , Te = b.end === void 0 ? ie : Math.min(b.end, $);
                                    !j.extend && ie > Te && (r = Te,
                                    Te = ie,
                                    ie = r);
                                    var T = Gu(m, ie)
                                      , E = Gu(m, Te);
                                    if (T && E && (j.rangeCount !== 1 || j.anchorNode !== T.node || j.anchorOffset !== T.offset || j.focusNode !== E.node || j.focusOffset !== E.offset)) {
                                        var C = U.createRange();
                                        C.setStart(T.node, T.offset),
                                        j.removeAllRanges(),
                                        ie > Te ? (j.addRange(C),
                                        j.extend(E.node, E.offset)) : (C.setEnd(E.node, E.offset),
                                        j.addRange(C))
                                    }
                                }
                            }
                        }
                        for (U = [],
                        j = m; j = j.parentNode; )
                            j.nodeType === 1 && U.push({
                                element: j,
                                left: j.scrollLeft,
                                top: j.scrollTop
                            });
                        for (typeof m.focus == "function" && m.focus(),
                        m = 0; m < U.length; m++) {
                            var H = U[m];
                            H.element.scrollLeft = H.left,
                            H.element.scrollTop = H.top
                        }
                    }
                    ls = !!vo,
                    bo = vo = null
                } finally {
                    Se = l,
                    Y.p = n,
                    N.T = a
                }
            }
            e.current = t,
            Ve = 2
        }
    }
    function ip() {
        if (Ve === 2) {
            Ve = 0;
            var e = Sa
              , t = Rn
              , a = (t.flags & 8772) !== 0;
            if ((t.subtreeFlags & 8772) !== 0 || a) {
                a = N.T,
                N.T = null;
                var n = Y.p;
                Y.p = 2;
                var l = Se;
                Se |= 4;
                try {
                    jd(e, t.alternate, t)
                } finally {
                    Se = l,
                    Y.p = n,
                    N.T = a
                }
            }
            Ve = 3
        }
    }
    function sp() {
        if (Ve === 4 || Ve === 3) {
            Ve = 0,
            em();
            var e = Sa
              , t = Rn
              , a = aa
              , n = Vd;
            (t.subtreeFlags & 10256) !== 0 || (t.flags & 10256) !== 0 ? Ve = 5 : (Ve = 0,
            Rn = Sa = null,
            cp(e, e.pendingLanes));
            var l = e.pendingLanes;
            if (l === 0 && (xa = null),
            Es(a),
            t = t.stateNode,
            pt && typeof pt.onCommitFiberRoot == "function")
                try {
                    pt.onCommitFiberRoot(Vn, t, void 0, (t.current.flags & 128) === 128)
                } catch {}
            if (n !== null) {
                t = N.T,
                l = Y.p,
                Y.p = 2,
                N.T = null;
                try {
                    for (var i = e.onRecoverableError, r = 0; r < n.length; r++) {
                        var m = n[r];
                        i(m.value, {
                            componentStack: m.stack
                        })
                    }
                } finally {
                    N.T = t,
                    Y.p = l
                }
            }
            (aa & 3) !== 0 && Vi(),
            Ht(e),
            l = e.pendingLanes,
            (a & 261930) !== 0 && (l & 42) !== 0 ? e === lo ? Tl++ : (Tl = 0,
            lo = e) : Tl = 0,
            Nl(0)
        }
    }
    function cp(e, t) {
        (e.pooledCacheLanes &= t) === 0 && (t = e.pooledCache,
        t != null && (e.pooledCache = null,
        ol(t)))
    }
    function Vi() {
        return lp(),
        ip(),
        sp(),
        op()
    }
    function op() {
        if (Ve !== 5)
            return !1;
        var e = Sa
          , t = ao;
        ao = 0;
        var a = Es(aa)
          , n = N.T
          , l = Y.p;
        try {
            Y.p = 32 > a ? 32 : a,
            N.T = null,
            a = no,
            no = null;
            var i = Sa
              , r = aa;
            if (Ve = 0,
            Rn = Sa = null,
            aa = 0,
            (Se & 6) !== 0)
                throw Error(o(331));
            var m = Se;
            if (Se |= 4,
            qd(i.current),
            Ud(i, i.current, r, a),
            Se = m,
            Nl(0, !1),
            pt && typeof pt.onPostCommitFiberRoot == "function")
                try {
                    pt.onPostCommitFiberRoot(Vn, i)
                } catch {}
            return !0
        } finally {
            Y.p = l,
            N.T = n,
            cp(e, t)
        }
    }
    function up(e, t, a) {
        t = Et(a, t),
        t = Bc(e.stateNode, t, 2),
        e = ma(e, t, 2),
        e !== null && (In(e, 2),
        Ht(e))
    }
    function Ee(e, t, a) {
        if (e.tag === 3)
            up(e, e, a);
        else
            for (; t !== null; ) {
                if (t.tag === 3) {
                    up(t, e, a);
                    break
                } else if (t.tag === 1) {
                    var n = t.stateNode;
                    if (typeof t.type.getDerivedStateFromError == "function" || typeof n.componentDidCatch == "function" && (xa === null || !xa.has(n))) {
                        e = Et(a, e),
                        a = rd(2),
                        n = ma(t, a, 2),
                        n !== null && (dd(a, n, t, e),
                        In(n, 2),
                        Ht(n));
                        break
                    }
                }
                t = t.return
            }
    }
    function co(e, t, a) {
        var n = e.pingCache;
        if (n === null) {
            n = e.pingCache = new Ay;
            var l = new Set;
            n.set(t, l)
        } else
            l = n.get(t),
            l === void 0 && (l = new Set,
            n.set(t, l));
        l.has(a) || ($c = !0,
        l.add(a),
        e = Ky.bind(null, e, t, a),
        t.then(e, e))
    }
    function Ky(e, t, a) {
        var n = e.pingCache;
        n !== null && n.delete(t),
        e.pingedLanes |= e.suspendedLanes & a,
        e.warmLanes &= ~a,
        Ce === e && (ye & a) === a && (Oe === 4 || Oe === 3 && (ye & 62914560) === ye && 300 > dt() - Ui ? (Se & 2) === 0 && Kn(e, 0) : eo |= a,
        Cn === ye && (Cn = 0)),
        Ht(e)
    }
    function rp(e, t) {
        t === 0 && (t = lu()),
        e = za(e, t),
        e !== null && (In(e, t),
        Ht(e))
    }
    function Dy(e) {
        var t = e.memoizedState
          , a = 0;
        t !== null && (a = t.retryLane),
        rp(e, a)
    }
    function jy(e, t) {
        var a = 0;
        switch (e.tag) {
        case 31:
        case 13:
            var n = e.stateNode
              , l = e.memoizedState;
            l !== null && (a = l.retryLane);
            break;
        case 19:
            n = e.stateNode;
            break;
        case 22:
            n = e.stateNode._retryCache;
            break;
        default:
            throw Error(o(314))
        }
        n !== null && n.delete(t),
        rp(e, a)
    }
    function My(e, t) {
        return xs(e, t)
    }
    var Qi = null
      , jn = null
      , oo = !1
      , Ii = !1
      , uo = !1
      , wa = 0;
    function Ht(e) {
        e !== jn && e.next === null && (jn === null ? Qi = jn = e : jn = jn.next = e),
        Ii = !0,
        oo || (oo = !0,
        By())
    }
    function Nl(e, t) {
        if (!uo && Ii) {
            uo = !0;
            do
                for (var a = !1, n = Qi; n !== null; ) {
                    if (e !== 0) {
                        var l = n.pendingLanes;
                        if (l === 0)
                            var i = 0;
                        else {
                            var r = n.suspendedLanes
                              , m = n.pingedLanes;
                            i = (1 << 31 - ft(42 | e) + 1) - 1,
                            i &= l & ~(r & ~m),
                            i = i & 201326741 ? i & 201326741 | 1 : i ? i | 2 : 0
                        }
                        i !== 0 && (a = !0,
                        mp(n, i))
                    } else
                        i = ye,
                        i = Wl(n, n === Ce ? i : 0, n.cancelPendingCommit !== null || n.timeoutHandle !== -1),
                        (i & 3) === 0 || Qn(n, i) || (a = !0,
                        mp(n, i));
                    n = n.next
                }
            while (a);
            uo = !1
        }
    }
    function _y() {
        dp()
    }
    function dp() {
        Ii = oo = !1;
        var e = 0;
        wa !== 0 && Vy() && (e = wa);
        for (var t = dt(), a = null, n = Qi; n !== null; ) {
            var l = n.next
              , i = pp(n, t);
            i === 0 ? (n.next = null,
            a === null ? Qi = l : a.next = l,
            l === null && (jn = a)) : (a = n,
            (e !== 0 || (i & 3) !== 0) && (Ii = !0)),
            n = l
        }
        Ve !== 0 && Ve !== 5 || Nl(e),
        wa !== 0 && (wa = 0)
    }
    function pp(e, t) {
        for (var a = e.suspendedLanes, n = e.pingedLanes, l = e.expirationTimes, i = e.pendingLanes & -62914561; 0 < i; ) {
            var r = 31 - ft(i)
              , m = 1 << r
              , b = l[r];
            b === -1 ? ((m & a) === 0 || (m & n) !== 0) && (l[r] = om(m, t)) : b <= t && (e.expiredLanes |= m),
            i &= ~m
        }
        if (t = Ce,
        a = ye,
        a = Wl(e, e === t ? a : 0, e.cancelPendingCommit !== null || e.timeoutHandle !== -1),
        n = e.callbackNode,
        a === 0 || e === t && (we === 2 || we === 9) || e.cancelPendingCommit !== null)
            return n !== null && n !== null && Ss(n),
            e.callbackNode = null,
            e.callbackPriority = 0;
        if ((a & 3) === 0 || Qn(e, a)) {
            if (t = a & -a,
            t === e.callbackPriority)
                return t;
            switch (n !== null && Ss(n),
            Es(a)) {
            case 2:
            case 8:
                a = au;
                break;
            case 32:
                a = Il;
                break;
            case 268435456:
                a = nu;
                break;
            default:
                a = Il
            }
            return n = fp.bind(null, e),
            a = xs(a, n),
            e.callbackPriority = t,
            e.callbackNode = a,
            t
        }
        return n !== null && n !== null && Ss(n),
        e.callbackPriority = 2,
        e.callbackNode = null,
        2
    }
    function fp(e, t) {
        if (Ve !== 0 && Ve !== 5)
            return e.callbackNode = null,
            e.callbackPriority = 0,
            null;
        var a = e.callbackNode;
        if (Vi() && e.callbackNode !== a)
            return null;
        var n = ye;
        return n = Wl(e, e === Ce ? n : 0, e.cancelPendingCommit !== null || e.timeoutHandle !== -1),
        n === 0 ? null : (Id(e, n, t),
        pp(e, dt()),
        e.callbackNode != null && e.callbackNode === a ? fp.bind(null, e) : null)
    }
    function mp(e, t) {
        if (Vi())
            return null;
        Id(e, t, !0)
    }
    function By() {
        Iy(function() {
            (Se & 6) !== 0 ? xs(tu, _y) : dp()
        })
    }
    function ro() {
        if (wa === 0) {
            var e = vn;
            e === 0 && (e = Zl,
            Zl <<= 1,
            (Zl & 261888) === 0 && (Zl = 256)),
            wa = e
        }
        return wa
    }
    function yp(e) {
        return e == null || typeof e == "symbol" || typeof e == "boolean" ? null : typeof e == "function" ? e : ai("" + e)
    }
    function hp(e, t) {
        var a = t.ownerDocument.createElement("input");
        return a.name = t.name,
        a.value = t.value,
        e.id && a.setAttribute("form", e.id),
        t.parentNode.insertBefore(a, t),
        e = new FormData(e),
        a.parentNode.removeChild(a),
        e
    }
    function Oy(e, t, a, n, l) {
        if (t === "submit" && a && a.stateNode === l) {
            var i = yp((l[lt] || null).action)
              , r = n.submitter;
            r && (t = (t = r[lt] || null) ? yp(t.formAction) : r.getAttribute("formAction"),
            t !== null && (i = t,
            r = null));
            var m = new si("action","action",null,n,l);
            e.push({
                event: m,
                listeners: [{
                    instance: null,
                    listener: function() {
                        if (n.defaultPrevented) {
                            if (wa !== 0) {
                                var b = r ? hp(l, r) : new FormData(l);
                                Rc(a, {
                                    pending: !0,
                                    data: b,
                                    method: l.method,
                                    action: i
                                }, null, b)
                            }
                        } else
                            typeof i == "function" && (m.preventDefault(),
                            b = r ? hp(l, r) : new FormData(l),
                            Rc(a, {
                                pending: !0,
                                data: b,
                                method: l.method,
                                action: i
                            }, i, b))
                    },
                    currentTarget: l
                }]
            })
        }
    }
    for (var po = 0; po < Qs.length; po++) {
        var fo = Qs[po]
          , zy = fo.toLowerCase()
          , Hy = fo[0].toUpperCase() + fo.slice(1);
        Dt(zy, "on" + Hy)
    }
    Dt(Qu, "onAnimationEnd"),
    Dt(Iu, "onAnimationIteration"),
    Dt(Zu, "onAnimationStart"),
    Dt("dblclick", "onDoubleClick"),
    Dt("focusin", "onFocus"),
    Dt("focusout", "onBlur"),
    Dt(ty, "onTransitionRun"),
    Dt(ay, "onTransitionStart"),
    Dt(ny, "onTransitionCancel"),
    Dt(Fu, "onTransitionEnd"),
    nn("onMouseEnter", ["mouseout", "mouseover"]),
    nn("onMouseLeave", ["mouseout", "mouseover"]),
    nn("onPointerEnter", ["pointerout", "pointerover"]),
    nn("onPointerLeave", ["pointerout", "pointerover"]),
    Ma("onChange", "change click focusin focusout input keydown keyup selectionchange".split(" ")),
    Ma("onSelect", "focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange".split(" ")),
    Ma("onBeforeInput", ["compositionend", "keypress", "textInput", "paste"]),
    Ma("onCompositionEnd", "compositionend focusout keydown keypress keyup mousedown".split(" ")),
    Ma("onCompositionStart", "compositionstart focusout keydown keypress keyup mousedown".split(" ")),
    Ma("onCompositionUpdate", "compositionupdate focusout keydown keypress keyup mousedown".split(" "));
    var Cl = "abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting".split(" ")
      , Uy = new Set("beforetoggle cancel close invalid load scroll scrollend toggle".split(" ").concat(Cl));
    function gp(e, t) {
        t = (t & 4) !== 0;
        for (var a = 0; a < e.length; a++) {
            var n = e[a]
              , l = n.event;
            n = n.listeners;
            e: {
                var i = void 0;
                if (t)
                    for (var r = n.length - 1; 0 <= r; r--) {
                        var m = n[r]
                          , b = m.instance
                          , R = m.currentTarget;
                        if (m = m.listener,
                        b !== i && l.isPropagationStopped())
                            break e;
                        i = m,
                        l.currentTarget = R;
                        try {
                            i(l)
                        } catch (M) {
                            ui(M)
                        }
                        l.currentTarget = null,
                        i = b
                    }
                else
                    for (r = 0; r < n.length; r++) {
                        if (m = n[r],
                        b = m.instance,
                        R = m.currentTarget,
                        m = m.listener,
                        b !== i && l.isPropagationStopped())
                            break e;
                        i = m,
                        l.currentTarget = R;
                        try {
                            i(l)
                        } catch (M) {
                            ui(M)
                        }
                        l.currentTarget = null,
                        i = b
                    }
            }
        }
    }
    function pe(e, t) {
        var a = t[Ls];
        a === void 0 && (a = t[Ls] = new Set);
        var n = e + "__bubble";
        a.has(n) || (vp(t, e, 2, !1),
        a.add(n))
    }
    function mo(e, t, a) {
        var n = 0;
        t && (n |= 4),
        vp(a, e, n, t)
    }
    var Zi = "_reactListening" + Math.random().toString(36).slice(2);
    function yo(e) {
        if (!e[Zi]) {
            e[Zi] = !0,
            du.forEach(function(a) {
                a !== "selectionchange" && (Uy.has(a) || mo(a, !1, e),
                mo(a, !0, e))
            });
            var t = e.nodeType === 9 ? e : e.ownerDocument;
            t === null || t[Zi] || (t[Zi] = !0,
            mo("selectionchange", !1, t))
        }
    }
    function vp(e, t, a, n) {
        switch (Qp(t)) {
        case 2:
            var l = mh;
            break;
        case 8:
            l = yh;
            break;
        default:
            l = Ro
        }
        a = l.bind(null, t, a, e),
        l = void 0,
        !Ms || t !== "touchstart" && t !== "touchmove" && t !== "wheel" || (l = !0),
        n ? l !== void 0 ? e.addEventListener(t, a, {
            capture: !0,
            passive: l
        }) : e.addEventListener(t, a, !0) : l !== void 0 ? e.addEventListener(t, a, {
            passive: l
        }) : e.addEventListener(t, a, !1)
    }
    function ho(e, t, a, n, l) {
        var i = n;
        if ((t & 1) === 0 && (t & 2) === 0 && n !== null)
            e: for (; ; ) {
                if (n === null)
                    return;
                var r = n.tag;
                if (r === 3 || r === 4) {
                    var m = n.stateNode.containerInfo;
                    if (m === l)
                        break;
                    if (r === 4)
                        for (r = n.return; r !== null; ) {
                            var b = r.tag;
                            if ((b === 3 || b === 4) && r.stateNode.containerInfo === l)
                                return;
                            r = r.return
                        }
                    for (; m !== null; ) {
                        if (r = en(m),
                        r === null)
                            return;
                        if (b = r.tag,
                        b === 5 || b === 6 || b === 26 || b === 27) {
                            n = i = r;
                            continue e
                        }
                        m = m.parentNode
                    }
                }
                n = n.return
            }
        wu(function() {
            var R = i
              , M = Ds(a)
              , U = [];
            e: {
                var K = Ju.get(e);
                if (K !== void 0) {
                    var j = si
                      , $ = e;
                    switch (e) {
                    case "keypress":
                        if (li(a) === 0)
                            break e;
                    case "keydown":
                    case "keyup":
                        j = jm;
                        break;
                    case "focusin":
                        $ = "focus",
                        j = zs;
                        break;
                    case "focusout":
                        $ = "blur",
                        j = zs;
                        break;
                    case "beforeblur":
                    case "afterblur":
                        j = zs;
                        break;
                    case "click":
                        if (a.button === 2)
                            break e;
                    case "auxclick":
                    case "dblclick":
                    case "mousedown":
                    case "mousemove":
                    case "mouseup":
                    case "mouseout":
                    case "mouseover":
                    case "contextmenu":
                        j = Au;
                        break;
                    case "drag":
                    case "dragend":
                    case "dragenter":
                    case "dragexit":
                    case "dragleave":
                    case "dragover":
                    case "dragstart":
                    case "drop":
                        j = Sm;
                        break;
                    case "touchcancel":
                    case "touchend":
                    case "touchmove":
                    case "touchstart":
                        j = Bm;
                        break;
                    case Qu:
                    case Iu:
                    case Zu:
                        j = Em;
                        break;
                    case Fu:
                        j = zm;
                        break;
                    case "scroll":
                    case "scrollend":
                        j = bm;
                        break;
                    case "wheel":
                        j = Um;
                        break;
                    case "copy":
                    case "cut":
                    case "paste":
                        j = Am;
                        break;
                    case "gotpointercapture":
                    case "lostpointercapture":
                    case "pointercancel":
                    case "pointerdown":
                    case "pointermove":
                    case "pointerout":
                    case "pointerover":
                    case "pointerup":
                        j = Nu;
                        break;
                    case "toggle":
                    case "beforetoggle":
                        j = Gm
                    }
                    var ie = (t & 4) !== 0
                      , Te = !ie && (e === "scroll" || e === "scrollend")
                      , T = ie ? K !== null ? K + "Capture" : null : K;
                    ie = [];
                    for (var E = R, C; E !== null; ) {
                        var H = E;
                        if (C = H.stateNode,
                        H = H.tag,
                        H !== 5 && H !== 26 && H !== 27 || C === null || T === null || (H = Jn(E, T),
                        H != null && ie.push(Rl(E, H, C))),
                        Te)
                            break;
                        E = E.return
                    }
                    0 < ie.length && (K = new j(K,$,null,a,M),
                    U.push({
                        event: K,
                        listeners: ie
                    }))
                }
            }
            if ((t & 7) === 0) {
                e: {
                    if (K = e === "mouseover" || e === "pointerover",
                    j = e === "mouseout" || e === "pointerout",
                    K && a !== Ks && ($ = a.relatedTarget || a.fromElement) && (en($) || $[$a]))
                        break e;
                    if ((j || K) && (K = M.window === M ? M : (K = M.ownerDocument) ? K.defaultView || K.parentWindow : window,
                    j ? ($ = a.relatedTarget || a.toElement,
                    j = R,
                    $ = $ ? en($) : null,
                    $ !== null && (Te = f($),
                    ie = $.tag,
                    $ !== Te || ie !== 5 && ie !== 27 && ie !== 6) && ($ = null)) : (j = null,
                    $ = R),
                    j !== $)) {
                        if (ie = Au,
                        H = "onMouseLeave",
                        T = "onMouseEnter",
                        E = "mouse",
                        (e === "pointerout" || e === "pointerover") && (ie = Nu,
                        H = "onPointerLeave",
                        T = "onPointerEnter",
                        E = "pointer"),
                        Te = j == null ? K : Fn(j),
                        C = $ == null ? K : Fn($),
                        K = new ie(H,E + "leave",j,a,M),
                        K.target = Te,
                        K.relatedTarget = C,
                        H = null,
                        en(M) === R && (ie = new ie(T,E + "enter",$,a,M),
                        ie.target = C,
                        ie.relatedTarget = Te,
                        H = ie),
                        Te = H,
                        j && $)
                            t: {
                                for (ie = Yy,
                                T = j,
                                E = $,
                                C = 0,
                                H = T; H; H = ie(H))
                                    C++;
                                H = 0;
                                for (var ne = E; ne; ne = ie(ne))
                                    H++;
                                for (; 0 < C - H; )
                                    T = ie(T),
                                    C--;
                                for (; 0 < H - C; )
                                    E = ie(E),
                                    H--;
                                for (; C--; ) {
                                    if (T === E || E !== null && T === E.alternate) {
                                        ie = T;
                                        break t
                                    }
                                    T = ie(T),
                                    E = ie(E)
                                }
                                ie = null
                            }
                        else
                            ie = null;
                        j !== null && bp(U, K, j, ie, !1),
                        $ !== null && Te !== null && bp(U, Te, $, ie, !0)
                    }
                }
                e: {
                    if (K = R ? Fn(R) : window,
                    j = K.nodeName && K.nodeName.toLowerCase(),
                    j === "select" || j === "input" && K.type === "file")
                        var be = Bu;
                    else if (Mu(K))
                        if (Ou)
                            be = Wm;
                        else {
                            be = Fm;
                            var te = Zm
                        }
                    else
                        j = K.nodeName,
                        !j || j.toLowerCase() !== "input" || K.type !== "checkbox" && K.type !== "radio" ? R && Rs(R.elementType) && (be = Bu) : be = Jm;
                    if (be && (be = be(e, R))) {
                        _u(U, be, a, M);
                        break e
                    }
                    te && te(e, K, R),
                    e === "focusout" && R && K.type === "number" && R.memoizedProps.value != null && Cs(K, "number", K.value)
                }
                switch (te = R ? Fn(R) : window,
                e) {
                case "focusin":
                    (Mu(te) || te.contentEditable === "true") && (rn = te,
                    Ps = R,
                    il = null);
                    break;
                case "focusout":
                    il = Ps = rn = null;
                    break;
                case "mousedown":
                    Xs = !0;
                    break;
                case "contextmenu":
                case "mouseup":
                case "dragend":
                    Xs = !1,
                    Xu(U, a, M);
                    break;
                case "selectionchange":
                    if (ey)
                        break;
                case "keydown":
                case "keyup":
                    Xu(U, a, M)
                }
                var ue;
                if (Us)
                    e: {
                        switch (e) {
                        case "compositionstart":
                            var he = "onCompositionStart";
                            break e;
                        case "compositionend":
                            he = "onCompositionEnd";
                            break e;
                        case "compositionupdate":
                            he = "onCompositionUpdate";
                            break e
                        }
                        he = void 0
                    }
                else
                    un ? Du(e, a) && (he = "onCompositionEnd") : e === "keydown" && a.keyCode === 229 && (he = "onCompositionStart");
                he && (Cu && a.locale !== "ko" && (un || he !== "onCompositionStart" ? he === "onCompositionEnd" && un && (ue = Eu()) : (ca = M,
                _s = "value"in ca ? ca.value : ca.textContent,
                un = !0)),
                te = Fi(R, he),
                0 < te.length && (he = new Tu(he,e,null,a,M),
                U.push({
                    event: he,
                    listeners: te
                }),
                ue ? he.data = ue : (ue = ju(a),
                ue !== null && (he.data = ue)))),
                (ue = Pm ? Xm(e, a) : Vm(e, a)) && (he = Fi(R, "onBeforeInput"),
                0 < he.length && (te = new Tu("onBeforeInput","beforeinput",null,a,M),
                U.push({
                    event: te,
                    listeners: he
                }),
                te.data = ue)),
                Oy(U, e, R, a, M)
            }
            gp(U, t)
        })
    }
    function Rl(e, t, a) {
        return {
            instance: e,
            listener: t,
            currentTarget: a
        }
    }
    function Fi(e, t) {
        for (var a = t + "Capture", n = []; e !== null; ) {
            var l = e
              , i = l.stateNode;
            if (l = l.tag,
            l !== 5 && l !== 26 && l !== 27 || i === null || (l = Jn(e, a),
            l != null && n.unshift(Rl(e, l, i)),
            l = Jn(e, t),
            l != null && n.push(Rl(e, l, i))),
            e.tag === 3)
                return n;
            e = e.return
        }
        return []
    }
    function Yy(e) {
        if (e === null)
            return null;
        do
            e = e.return;
        while (e && e.tag !== 5 && e.tag !== 27);
        return e || null
    }
    function bp(e, t, a, n, l) {
        for (var i = t._reactName, r = []; a !== null && a !== n; ) {
            var m = a
              , b = m.alternate
              , R = m.stateNode;
            if (m = m.tag,
            b !== null && b === n)
                break;
            m !== 5 && m !== 26 && m !== 27 || R === null || (b = R,
            l ? (R = Jn(a, i),
            R != null && r.unshift(Rl(a, R, b))) : l || (R = Jn(a, i),
            R != null && r.push(Rl(a, R, b)))),
            a = a.return
        }
        r.length !== 0 && e.push({
            event: t,
            listeners: r
        })
    }
    var Gy = /\r\n?/g
      , qy = /\u0000|\uFFFD/g;
    function xp(e) {
        return (typeof e == "string" ? e : "" + e).replace(Gy, `
`).replace(qy, "")
    }
    function Sp(e, t) {
        return t = xp(t),
        xp(e) === t
    }
    function Ae(e, t, a, n, l, i) {
        switch (a) {
        case "children":
            typeof n == "string" ? t === "body" || t === "textarea" && n === "" || sn(e, n) : (typeof n == "number" || typeof n == "bigint") && t !== "body" && sn(e, "" + n);
            break;
        case "className":
            ei(e, "class", n);
            break;
        case "tabIndex":
            ei(e, "tabindex", n);
            break;
        case "dir":
        case "role":
        case "viewBox":
        case "width":
        case "height":
            ei(e, a, n);
            break;
        case "style":
            Su(e, n, i);
            break;
        case "data":
            if (t !== "object") {
                ei(e, "data", n);
                break
            }
        case "src":
        case "href":
            if (n === "" && (t !== "a" || a !== "href")) {
                e.removeAttribute(a);
                break
            }
            if (n == null || typeof n == "function" || typeof n == "symbol" || typeof n == "boolean") {
                e.removeAttribute(a);
                break
            }
            n = ai("" + n),
            e.setAttribute(a, n);
            break;
        case "action":
        case "formAction":
            if (typeof n == "function") {
                e.setAttribute(a, "javascript:throw new Error('A React form was unexpectedly submitted. If you called form.submit() manually, consider using form.requestSubmit() instead. If you\\'re trying to use event.stopPropagation() in a submit event handler, consider also calling event.preventDefault().')");
                break
            } else
                typeof i == "function" && (a === "formAction" ? (t !== "input" && Ae(e, t, "name", l.name, l, null),
                Ae(e, t, "formEncType", l.formEncType, l, null),
                Ae(e, t, "formMethod", l.formMethod, l, null),
                Ae(e, t, "formTarget", l.formTarget, l, null)) : (Ae(e, t, "encType", l.encType, l, null),
                Ae(e, t, "method", l.method, l, null),
                Ae(e, t, "target", l.target, l, null)));
            if (n == null || typeof n == "symbol" || typeof n == "boolean") {
                e.removeAttribute(a);
                break
            }
            n = ai("" + n),
            e.setAttribute(a, n);
            break;
        case "onClick":
            n != null && (e.onclick = Yt);
            break;
        case "onScroll":
            n != null && pe("scroll", e);
            break;
        case "onScrollEnd":
            n != null && pe("scrollend", e);
            break;
        case "dangerouslySetInnerHTML":
            if (n != null) {
                if (typeof n != "object" || !("__html"in n))
                    throw Error(o(61));
                if (a = n.__html,
                a != null) {
                    if (l.children != null)
                        throw Error(o(60));
                    e.innerHTML = a
                }
            }
            break;
        case "multiple":
            e.multiple = n && typeof n != "function" && typeof n != "symbol";
            break;
        case "muted":
            e.muted = n && typeof n != "function" && typeof n != "symbol";
            break;
        case "suppressContentEditableWarning":
        case "suppressHydrationWarning":
        case "defaultValue":
        case "defaultChecked":
        case "innerHTML":
        case "ref":
            break;
        case "autoFocus":
            break;
        case "xlinkHref":
            if (n == null || typeof n == "function" || typeof n == "boolean" || typeof n == "symbol") {
                e.removeAttribute("xlink:href");
                break
            }
            a = ai("" + n),
            e.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", a);
            break;
        case "contentEditable":
        case "spellCheck":
        case "draggable":
        case "value":
        case "autoReverse":
        case "externalResourcesRequired":
        case "focusable":
        case "preserveAlpha":
            n != null && typeof n != "function" && typeof n != "symbol" ? e.setAttribute(a, "" + n) : e.removeAttribute(a);
            break;
        case "inert":
        case "allowFullScreen":
        case "async":
        case "autoPlay":
        case "controls":
        case "default":
        case "defer":
        case "disabled":
        case "disablePictureInPicture":
        case "disableRemotePlayback":
        case "formNoValidate":
        case "hidden":
        case "loop":
        case "noModule":
        case "noValidate":
        case "open":
        case "playsInline":
        case "readOnly":
        case "required":
        case "reversed":
        case "scoped":
        case "seamless":
        case "itemScope":
            n && typeof n != "function" && typeof n != "symbol" ? e.setAttribute(a, "") : e.removeAttribute(a);
            break;
        case "capture":
        case "download":
            n === !0 ? e.setAttribute(a, "") : n !== !1 && n != null && typeof n != "function" && typeof n != "symbol" ? e.setAttribute(a, n) : e.removeAttribute(a);
            break;
        case "cols":
        case "rows":
        case "size":
        case "span":
            n != null && typeof n != "function" && typeof n != "symbol" && !isNaN(n) && 1 <= n ? e.setAttribute(a, n) : e.removeAttribute(a);
            break;
        case "rowSpan":
        case "start":
            n == null || typeof n == "function" || typeof n == "symbol" || isNaN(n) ? e.removeAttribute(a) : e.setAttribute(a, n);
            break;
        case "popover":
            pe("beforetoggle", e),
            pe("toggle", e),
            $l(e, "popover", n);
            break;
        case "xlinkActuate":
            Ut(e, "http://www.w3.org/1999/xlink", "xlink:actuate", n);
            break;
        case "xlinkArcrole":
            Ut(e, "http://www.w3.org/1999/xlink", "xlink:arcrole", n);
            break;
        case "xlinkRole":
            Ut(e, "http://www.w3.org/1999/xlink", "xlink:role", n);
            break;
        case "xlinkShow":
            Ut(e, "http://www.w3.org/1999/xlink", "xlink:show", n);
            break;
        case "xlinkTitle":
            Ut(e, "http://www.w3.org/1999/xlink", "xlink:title", n);
            break;
        case "xlinkType":
            Ut(e, "http://www.w3.org/1999/xlink", "xlink:type", n);
            break;
        case "xmlBase":
            Ut(e, "http://www.w3.org/XML/1998/namespace", "xml:base", n);
            break;
        case "xmlLang":
            Ut(e, "http://www.w3.org/XML/1998/namespace", "xml:lang", n);
            break;
        case "xmlSpace":
            Ut(e, "http://www.w3.org/XML/1998/namespace", "xml:space", n);
            break;
        case "is":
            $l(e, "is", n);
            break;
        case "innerText":
        case "textContent":
            break;
        default:
            (!(2 < a.length) || a[0] !== "o" && a[0] !== "O" || a[1] !== "n" && a[1] !== "N") && (a = gm.get(a) || a,
            $l(e, a, n))
        }
    }
    function go(e, t, a, n, l, i) {
        switch (a) {
        case "style":
            Su(e, n, i);
            break;
        case "dangerouslySetInnerHTML":
            if (n != null) {
                if (typeof n != "object" || !("__html"in n))
                    throw Error(o(61));
                if (a = n.__html,
                a != null) {
                    if (l.children != null)
                        throw Error(o(60));
                    e.innerHTML = a
                }
            }
            break;
        case "children":
            typeof n == "string" ? sn(e, n) : (typeof n == "number" || typeof n == "bigint") && sn(e, "" + n);
            break;
        case "onScroll":
            n != null && pe("scroll", e);
            break;
        case "onScrollEnd":
            n != null && pe("scrollend", e);
            break;
        case "onClick":
            n != null && (e.onclick = Yt);
            break;
        case "suppressContentEditableWarning":
        case "suppressHydrationWarning":
        case "innerHTML":
        case "ref":
            break;
        case "innerText":
        case "textContent":
            break;
        default:
            if (!pu.hasOwnProperty(a))
                e: {
                    if (a[0] === "o" && a[1] === "n" && (l = a.endsWith("Capture"),
                    t = a.slice(2, l ? a.length - 7 : void 0),
                    i = e[lt] || null,
                    i = i != null ? i[a] : null,
                    typeof i == "function" && e.removeEventListener(t, i, l),
                    typeof n == "function")) {
                        typeof i != "function" && i !== null && (a in e ? e[a] = null : e.hasAttribute(a) && e.removeAttribute(a)),
                        e.addEventListener(t, n, l);
                        break e
                    }
                    a in e ? e[a] = n : n === !0 ? e.setAttribute(a, "") : $l(e, a, n)
                }
        }
    }
    function $e(e, t, a) {
        switch (t) {
        case "div":
        case "span":
        case "svg":
        case "path":
        case "a":
        case "g":
        case "p":
        case "li":
            break;
        case "img":
            pe("error", e),
            pe("load", e);
            var n = !1, l = !1, i;
            for (i in a)
                if (a.hasOwnProperty(i)) {
                    var r = a[i];
                    if (r != null)
                        switch (i) {
                        case "src":
                            n = !0;
                            break;
                        case "srcSet":
                            l = !0;
                            break;
                        case "children":
                        case "dangerouslySetInnerHTML":
                            throw Error(o(137, t));
                        default:
                            Ae(e, t, i, r, a, null)
                        }
                }
            l && Ae(e, t, "srcSet", a.srcSet, a, null),
            n && Ae(e, t, "src", a.src, a, null);
            return;
        case "input":
            pe("invalid", e);
            var m = i = r = l = null
              , b = null
              , R = null;
            for (n in a)
                if (a.hasOwnProperty(n)) {
                    var M = a[n];
                    if (M != null)
                        switch (n) {
                        case "name":
                            l = M;
                            break;
                        case "type":
                            r = M;
                            break;
                        case "checked":
                            b = M;
                            break;
                        case "defaultChecked":
                            R = M;
                            break;
                        case "value":
                            i = M;
                            break;
                        case "defaultValue":
                            m = M;
                            break;
                        case "children":
                        case "dangerouslySetInnerHTML":
                            if (M != null)
                                throw Error(o(137, t));
                            break;
                        default:
                            Ae(e, t, n, M, a, null)
                        }
                }
            gu(e, i, m, b, R, r, l, !1);
            return;
        case "select":
            pe("invalid", e),
            n = r = i = null;
            for (l in a)
                if (a.hasOwnProperty(l) && (m = a[l],
                m != null))
                    switch (l) {
                    case "value":
                        i = m;
                        break;
                    case "defaultValue":
                        r = m;
                        break;
                    case "multiple":
                        n = m;
                    default:
                        Ae(e, t, l, m, a, null)
                    }
            t = i,
            a = r,
            e.multiple = !!n,
            t != null ? ln(e, !!n, t, !1) : a != null && ln(e, !!n, a, !0);
            return;
        case "textarea":
            pe("invalid", e),
            i = l = n = null;
            for (r in a)
                if (a.hasOwnProperty(r) && (m = a[r],
                m != null))
                    switch (r) {
                    case "value":
                        n = m;
                        break;
                    case "defaultValue":
                        l = m;
                        break;
                    case "children":
                        i = m;
                        break;
                    case "dangerouslySetInnerHTML":
                        if (m != null)
                            throw Error(o(91));
                        break;
                    default:
                        Ae(e, t, r, m, a, null)
                    }
            bu(e, n, l, i);
            return;
        case "option":
            for (b in a)
                a.hasOwnProperty(b) && (n = a[b],
                n != null) && (b === "selected" ? e.selected = n && typeof n != "function" && typeof n != "symbol" : Ae(e, t, b, n, a, null));
            return;
        case "dialog":
            pe("beforetoggle", e),
            pe("toggle", e),
            pe("cancel", e),
            pe("close", e);
            break;
        case "iframe":
        case "object":
            pe("load", e);
            break;
        case "video":
        case "audio":
            for (n = 0; n < Cl.length; n++)
                pe(Cl[n], e);
            break;
        case "image":
            pe("error", e),
            pe("load", e);
            break;
        case "details":
            pe("toggle", e);
            break;
        case "embed":
        case "source":
        case "link":
            pe("error", e),
            pe("load", e);
        case "area":
        case "base":
        case "br":
        case "col":
        case "hr":
        case "keygen":
        case "meta":
        case "param":
        case "track":
        case "wbr":
        case "menuitem":
            for (R in a)
                if (a.hasOwnProperty(R) && (n = a[R],
                n != null))
                    switch (R) {
                    case "children":
                    case "dangerouslySetInnerHTML":
                        throw Error(o(137, t));
                    default:
                        Ae(e, t, R, n, a, null)
                    }
            return;
        default:
            if (Rs(t)) {
                for (M in a)
                    a.hasOwnProperty(M) && (n = a[M],
                    n !== void 0 && go(e, t, M, n, a, void 0));
                return
            }
        }
        for (m in a)
            a.hasOwnProperty(m) && (n = a[m],
            n != null && Ae(e, t, m, n, a, null))
    }
    function Py(e, t, a, n) {
        switch (t) {
        case "div":
        case "span":
        case "svg":
        case "path":
        case "a":
        case "g":
        case "p":
        case "li":
            break;
        case "input":
            var l = null
              , i = null
              , r = null
              , m = null
              , b = null
              , R = null
              , M = null;
            for (j in a) {
                var U = a[j];
                if (a.hasOwnProperty(j) && U != null)
                    switch (j) {
                    case "checked":
                        break;
                    case "value":
                        break;
                    case "defaultValue":
                        b = U;
                    default:
                        n.hasOwnProperty(j) || Ae(e, t, j, null, n, U)
                    }
            }
            for (var K in n) {
                var j = n[K];
                if (U = a[K],
                n.hasOwnProperty(K) && (j != null || U != null))
                    switch (K) {
                    case "type":
                        i = j;
                        break;
                    case "name":
                        l = j;
                        break;
                    case "checked":
                        R = j;
                        break;
                    case "defaultChecked":
                        M = j;
                        break;
                    case "value":
                        r = j;
                        break;
                    case "defaultValue":
                        m = j;
                        break;
                    case "children":
                    case "dangerouslySetInnerHTML":
                        if (j != null)
                            throw Error(o(137, t));
                        break;
                    default:
                        j !== U && Ae(e, t, K, j, n, U)
                    }
            }
            Ns(e, r, m, b, R, M, i, l);
            return;
        case "select":
            j = r = m = K = null;
            for (i in a)
                if (b = a[i],
                a.hasOwnProperty(i) && b != null)
                    switch (i) {
                    case "value":
                        break;
                    case "multiple":
                        j = b;
                    default:
                        n.hasOwnProperty(i) || Ae(e, t, i, null, n, b)
                    }
            for (l in n)
                if (i = n[l],
                b = a[l],
                n.hasOwnProperty(l) && (i != null || b != null))
                    switch (l) {
                    case "value":
                        K = i;
                        break;
                    case "defaultValue":
                        m = i;
                        break;
                    case "multiple":
                        r = i;
                    default:
                        i !== b && Ae(e, t, l, i, n, b)
                    }
            t = m,
            a = r,
            n = j,
            K != null ? ln(e, !!a, K, !1) : !!n != !!a && (t != null ? ln(e, !!a, t, !0) : ln(e, !!a, a ? [] : "", !1));
            return;
        case "textarea":
            j = K = null;
            for (m in a)
                if (l = a[m],
                a.hasOwnProperty(m) && l != null && !n.hasOwnProperty(m))
                    switch (m) {
                    case "value":
                        break;
                    case "children":
                        break;
                    default:
                        Ae(e, t, m, null, n, l)
                    }
            for (r in n)
                if (l = n[r],
                i = a[r],
                n.hasOwnProperty(r) && (l != null || i != null))
                    switch (r) {
                    case "value":
                        K = l;
                        break;
                    case "defaultValue":
                        j = l;
                        break;
                    case "children":
                        break;
                    case "dangerouslySetInnerHTML":
                        if (l != null)
                            throw Error(o(91));
                        break;
                    default:
                        l !== i && Ae(e, t, r, l, n, i)
                    }
            vu(e, K, j);
            return;
        case "option":
            for (var $ in a)
                K = a[$],
                a.hasOwnProperty($) && K != null && !n.hasOwnProperty($) && ($ === "selected" ? e.selected = !1 : Ae(e, t, $, null, n, K));
            for (b in n)
                K = n[b],
                j = a[b],
                n.hasOwnProperty(b) && K !== j && (K != null || j != null) && (b === "selected" ? e.selected = K && typeof K != "function" && typeof K != "symbol" : Ae(e, t, b, K, n, j));
            return;
        case "img":
        case "link":
        case "area":
        case "base":
        case "br":
        case "col":
        case "embed":
        case "hr":
        case "keygen":
        case "meta":
        case "param":
        case "source":
        case "track":
        case "wbr":
        case "menuitem":
            for (var ie in a)
                K = a[ie],
                a.hasOwnProperty(ie) && K != null && !n.hasOwnProperty(ie) && Ae(e, t, ie, null, n, K);
            for (R in n)
                if (K = n[R],
                j = a[R],
                n.hasOwnProperty(R) && K !== j && (K != null || j != null))
                    switch (R) {
                    case "children":
                    case "dangerouslySetInnerHTML":
                        if (K != null)
                            throw Error(o(137, t));
                        break;
                    default:
                        Ae(e, t, R, K, n, j)
                    }
            return;
        default:
            if (Rs(t)) {
                for (var Te in a)
                    K = a[Te],
                    a.hasOwnProperty(Te) && K !== void 0 && !n.hasOwnProperty(Te) && go(e, t, Te, void 0, n, K);
                for (M in n)
                    K = n[M],
                    j = a[M],
                    !n.hasOwnProperty(M) || K === j || K === void 0 && j === void 0 || go(e, t, M, K, n, j);
                return
            }
        }
        for (var T in a)
            K = a[T],
            a.hasOwnProperty(T) && K != null && !n.hasOwnProperty(T) && Ae(e, t, T, null, n, K);
        for (U in n)
            K = n[U],
            j = a[U],
            !n.hasOwnProperty(U) || K === j || K == null && j == null || Ae(e, t, U, K, n, j)
    }
    function kp(e) {
        switch (e) {
        case "css":
        case "script":
        case "font":
        case "img":
        case "image":
        case "input":
        case "link":
            return !0;
        default:
            return !1
        }
    }
    function Xy() {
        if (typeof performance.getEntriesByType == "function") {
            for (var e = 0, t = 0, a = performance.getEntriesByType("resource"), n = 0; n < a.length; n++) {
                var l = a[n]
                  , i = l.transferSize
                  , r = l.initiatorType
                  , m = l.duration;
                if (i && m && kp(r)) {
                    for (r = 0,
                    m = l.responseEnd,
                    n += 1; n < a.length; n++) {
                        var b = a[n]
                          , R = b.startTime;
                        if (R > m)
                            break;
                        var M = b.transferSize
                          , U = b.initiatorType;
                        M && kp(U) && (b = b.responseEnd,
                        r += M * (b < m ? 1 : (m - R) / (b - R)))
                    }
                    if (--n,
                    t += 8 * (i + r) / (l.duration / 1e3),
                    e++,
                    10 < e)
                        break
                }
            }
            if (0 < e)
                return t / e / 1e6
        }
        return navigator.connection && (e = navigator.connection.downlink,
        typeof e == "number") ? e : 5
    }
    var vo = null
      , bo = null;
    function Ji(e) {
        return e.nodeType === 9 ? e : e.ownerDocument
    }
    function wp(e) {
        switch (e) {
        case "http://www.w3.org/2000/svg":
            return 1;
        case "http://www.w3.org/1998/Math/MathML":
            return 2;
        default:
            return 0
        }
    }
    function Ep(e, t) {
        if (e === 0)
            switch (t) {
            case "svg":
                return 1;
            case "math":
                return 2;
            default:
                return 0
            }
        return e === 1 && t === "foreignObject" ? 0 : e
    }
    function xo(e, t) {
        return e === "textarea" || e === "noscript" || typeof t.children == "string" || typeof t.children == "number" || typeof t.children == "bigint" || typeof t.dangerouslySetInnerHTML == "object" && t.dangerouslySetInnerHTML !== null && t.dangerouslySetInnerHTML.__html != null
    }
    var So = null;
    function Vy() {
        var e = window.event;
        return e && e.type === "popstate" ? e === So ? !1 : (So = e,
        !0) : (So = null,
        !1)
    }
    var Lp = typeof setTimeout == "function" ? setTimeout : void 0
      , Qy = typeof clearTimeout == "function" ? clearTimeout : void 0
      , Ap = typeof Promise == "function" ? Promise : void 0
      , Iy = typeof queueMicrotask == "function" ? queueMicrotask : typeof Ap < "u" ? function(e) {
        return Ap.resolve(null).then(e).catch(Zy)
    }
    : Lp;
    function Zy(e) {
        setTimeout(function() {
            throw e
        })
    }
    function Ea(e) {
        return e === "head"
    }
    function Tp(e, t) {
        var a = t
          , n = 0;
        do {
            var l = a.nextSibling;
            if (e.removeChild(a),
            l && l.nodeType === 8)
                if (a = l.data,
                a === "/$" || a === "/&") {
                    if (n === 0) {
                        e.removeChild(l),
                        On(t);
                        return
                    }
                    n--
                } else if (a === "$" || a === "$?" || a === "$~" || a === "$!" || a === "&")
                    n++;
                else if (a === "html")
                    Kl(e.ownerDocument.documentElement);
                else if (a === "head") {
                    a = e.ownerDocument.head,
                    Kl(a);
                    for (var i = a.firstChild; i; ) {
                        var r = i.nextSibling
                          , m = i.nodeName;
                        i[Zn] || m === "SCRIPT" || m === "STYLE" || m === "LINK" && i.rel.toLowerCase() === "stylesheet" || a.removeChild(i),
                        i = r
                    }
                } else
                    a === "body" && Kl(e.ownerDocument.body);
            a = l
        } while (a);
        On(t)
    }
    function Np(e, t) {
        var a = e;
        e = 0;
        do {
            var n = a.nextSibling;
            if (a.nodeType === 1 ? t ? (a._stashedDisplay = a.style.display,
            a.style.display = "none") : (a.style.display = a._stashedDisplay || "",
            a.getAttribute("style") === "" && a.removeAttribute("style")) : a.nodeType === 3 && (t ? (a._stashedText = a.nodeValue,
            a.nodeValue = "") : a.nodeValue = a._stashedText || ""),
            n && n.nodeType === 8)
                if (a = n.data,
                a === "/$") {
                    if (e === 0)
                        break;
                    e--
                } else
                    a !== "$" && a !== "$?" && a !== "$~" && a !== "$!" || e++;
            a = n
        } while (a)
    }
    function ko(e) {
        var t = e.firstChild;
        for (t && t.nodeType === 10 && (t = t.nextSibling); t; ) {
            var a = t;
            switch (t = t.nextSibling,
            a.nodeName) {
            case "HTML":
            case "HEAD":
            case "BODY":
                ko(a),
                As(a);
                continue;
            case "SCRIPT":
            case "STYLE":
                continue;
            case "LINK":
                if (a.rel.toLowerCase() === "stylesheet")
                    continue
            }
            e.removeChild(a)
        }
    }
    function Fy(e, t, a, n) {
        for (; e.nodeType === 1; ) {
            var l = a;
            if (e.nodeName.toLowerCase() !== t.toLowerCase()) {
                if (!n && (e.nodeName !== "INPUT" || e.type !== "hidden"))
                    break
            } else if (n) {
                if (!e[Zn])
                    switch (t) {
                    case "meta":
                        if (!e.hasAttribute("itemprop"))
                            break;
                        return e;
                    case "link":
                        if (i = e.getAttribute("rel"),
                        i === "stylesheet" && e.hasAttribute("data-precedence"))
                            break;
                        if (i !== l.rel || e.getAttribute("href") !== (l.href == null || l.href === "" ? null : l.href) || e.getAttribute("crossorigin") !== (l.crossOrigin == null ? null : l.crossOrigin) || e.getAttribute("title") !== (l.title == null ? null : l.title))
                            break;
                        return e;
                    case "style":
                        if (e.hasAttribute("data-precedence"))
                            break;
                        return e;
                    case "script":
                        if (i = e.getAttribute("src"),
                        (i !== (l.src == null ? null : l.src) || e.getAttribute("type") !== (l.type == null ? null : l.type) || e.getAttribute("crossorigin") !== (l.crossOrigin == null ? null : l.crossOrigin)) && i && e.hasAttribute("async") && !e.hasAttribute("itemprop"))
                            break;
                        return e;
                    default:
                        return e
                    }
            } else if (t === "input" && e.type === "hidden") {
                var i = l.name == null ? null : "" + l.name;
                if (l.type === "hidden" && e.getAttribute("name") === i)
                    return e
            } else
                return e;
            if (e = Ct(e.nextSibling),
            e === null)
                break
        }
        return null
    }
    function Jy(e, t, a) {
        if (t === "")
            return null;
        for (; e.nodeType !== 3; )
            if ((e.nodeType !== 1 || e.nodeName !== "INPUT" || e.type !== "hidden") && !a || (e = Ct(e.nextSibling),
            e === null))
                return null;
        return e
    }
    function Cp(e, t) {
        for (; e.nodeType !== 8; )
            if ((e.nodeType !== 1 || e.nodeName !== "INPUT" || e.type !== "hidden") && !t || (e = Ct(e.nextSibling),
            e === null))
                return null;
        return e
    }
    function wo(e) {
        return e.data === "$?" || e.data === "$~"
    }
    function Eo(e) {
        return e.data === "$!" || e.data === "$?" && e.ownerDocument.readyState !== "loading"
    }
    function Wy(e, t) {
        var a = e.ownerDocument;
        if (e.data === "$~")
            e._reactRetry = t;
        else if (e.data !== "$?" || a.readyState !== "loading")
            t();
        else {
            var n = function() {
                t(),
                a.removeEventListener("DOMContentLoaded", n)
            };
            a.addEventListener("DOMContentLoaded", n),
            e._reactRetry = n
        }
    }
    function Ct(e) {
        for (; e != null; e = e.nextSibling) {
            var t = e.nodeType;
            if (t === 1 || t === 3)
                break;
            if (t === 8) {
                if (t = e.data,
                t === "$" || t === "$!" || t === "$?" || t === "$~" || t === "&" || t === "F!" || t === "F")
                    break;
                if (t === "/$" || t === "/&")
                    return null
            }
        }
        return e
    }
    var Lo = null;
    function Rp(e) {
        e = e.nextSibling;
        for (var t = 0; e; ) {
            if (e.nodeType === 8) {
                var a = e.data;
                if (a === "/$" || a === "/&") {
                    if (t === 0)
                        return Ct(e.nextSibling);
                    t--
                } else
                    a !== "$" && a !== "$!" && a !== "$?" && a !== "$~" && a !== "&" || t++
            }
            e = e.nextSibling
        }
        return null
    }
    function Kp(e) {
        e = e.previousSibling;
        for (var t = 0; e; ) {
            if (e.nodeType === 8) {
                var a = e.data;
                if (a === "$" || a === "$!" || a === "$?" || a === "$~" || a === "&") {
                    if (t === 0)
                        return e;
                    t--
                } else
                    a !== "/$" && a !== "/&" || t++
            }
            e = e.previousSibling
        }
        return null
    }
    function Dp(e, t, a) {
        switch (t = Ji(a),
        e) {
        case "html":
            if (e = t.documentElement,
            !e)
                throw Error(o(452));
            return e;
        case "head":
            if (e = t.head,
            !e)
                throw Error(o(453));
            return e;
        case "body":
            if (e = t.body,
            !e)
                throw Error(o(454));
            return e;
        default:
            throw Error(o(451))
        }
    }
    function Kl(e) {
        for (var t = e.attributes; t.length; )
            e.removeAttributeNode(t[0]);
        As(e)
    }
    var Rt = new Map
      , jp = new Set;
    function Wi(e) {
        return typeof e.getRootNode == "function" ? e.getRootNode() : e.nodeType === 9 ? e : e.ownerDocument
    }
    var na = Y.d;
    Y.d = {
        f: $y,
        r: eh,
        D: th,
        C: ah,
        L: nh,
        m: lh,
        X: sh,
        S: ih,
        M: ch
    };
    function $y() {
        var e = na.f()
          , t = qi();
        return e || t
    }
    function eh(e) {
        var t = tn(e);
        t !== null && t.tag === 5 && t.type === "form" ? Fr(t) : na.r(e)
    }
    var Mn = typeof document > "u" ? null : document;
    function Mp(e, t, a) {
        var n = Mn;
        if (n && typeof t == "string" && t) {
            var l = kt(t);
            l = 'link[rel="' + e + '"][href="' + l + '"]',
            typeof a == "string" && (l += '[crossorigin="' + a + '"]'),
            jp.has(l) || (jp.add(l),
            e = {
                rel: e,
                crossOrigin: a,
                href: t
            },
            n.querySelector(l) === null && (t = n.createElement("link"),
            $e(t, "link", e),
            Qe(t),
            n.head.appendChild(t)))
        }
    }
    function th(e) {
        na.D(e),
        Mp("dns-prefetch", e, null)
    }
    function ah(e, t) {
        na.C(e, t),
        Mp("preconnect", e, t)
    }
    function nh(e, t, a) {
        na.L(e, t, a);
        var n = Mn;
        if (n && e && t) {
            var l = 'link[rel="preload"][as="' + kt(t) + '"]';
            t === "image" && a && a.imageSrcSet ? (l += '[imagesrcset="' + kt(a.imageSrcSet) + '"]',
            typeof a.imageSizes == "string" && (l += '[imagesizes="' + kt(a.imageSizes) + '"]')) : l += '[href="' + kt(e) + '"]';
            var i = l;
            switch (t) {
            case "style":
                i = _n(e);
                break;
            case "script":
                i = Bn(e)
            }
            Rt.has(i) || (e = k({
                rel: "preload",
                href: t === "image" && a && a.imageSrcSet ? void 0 : e,
                as: t
            }, a),
            Rt.set(i, e),
            n.querySelector(l) !== null || t === "style" && n.querySelector(Dl(i)) || t === "script" && n.querySelector(jl(i)) || (t = n.createElement("link"),
            $e(t, "link", e),
            Qe(t),
            n.head.appendChild(t)))
        }
    }
    function lh(e, t) {
        na.m(e, t);
        var a = Mn;
        if (a && e) {
            var n = t && typeof t.as == "string" ? t.as : "script"
              , l = 'link[rel="modulepreload"][as="' + kt(n) + '"][href="' + kt(e) + '"]'
              , i = l;
            switch (n) {
            case "audioworklet":
            case "paintworklet":
            case "serviceworker":
            case "sharedworker":
            case "worker":
            case "script":
                i = Bn(e)
            }
            if (!Rt.has(i) && (e = k({
                rel: "modulepreload",
                href: e
            }, t),
            Rt.set(i, e),
            a.querySelector(l) === null)) {
                switch (n) {
                case "audioworklet":
                case "paintworklet":
                case "serviceworker":
                case "sharedworker":
                case "worker":
                case "script":
                    if (a.querySelector(jl(i)))
                        return
                }
                n = a.createElement("link"),
                $e(n, "link", e),
                Qe(n),
                a.head.appendChild(n)
            }
        }
    }
    function ih(e, t, a) {
        na.S(e, t, a);
        var n = Mn;
        if (n && e) {
            var l = an(n).hoistableStyles
              , i = _n(e);
            t = t || "default";
            var r = l.get(i);
            if (!r) {
                var m = {
                    loading: 0,
                    preload: null
                };
                if (r = n.querySelector(Dl(i)))
                    m.loading = 5;
                else {
                    e = k({
                        rel: "stylesheet",
                        href: e,
                        "data-precedence": t
                    }, a),
                    (a = Rt.get(i)) && Ao(e, a);
                    var b = r = n.createElement("link");
                    Qe(b),
                    $e(b, "link", e),
                    b._p = new Promise(function(R, M) {
                        b.onload = R,
                        b.onerror = M
                    }
                    ),
                    b.addEventListener("load", function() {
                        m.loading |= 1
                    }),
                    b.addEventListener("error", function() {
                        m.loading |= 2
                    }),
                    m.loading |= 4,
                    $i(r, t, n)
                }
                r = {
                    type: "stylesheet",
                    instance: r,
                    count: 1,
                    state: m
                },
                l.set(i, r)
            }
        }
    }
    function sh(e, t) {
        na.X(e, t);
        var a = Mn;
        if (a && e) {
            var n = an(a).hoistableScripts
              , l = Bn(e)
              , i = n.get(l);
            i || (i = a.querySelector(jl(l)),
            i || (e = k({
                src: e,
                async: !0
            }, t),
            (t = Rt.get(l)) && To(e, t),
            i = a.createElement("script"),
            Qe(i),
            $e(i, "link", e),
            a.head.appendChild(i)),
            i = {
                type: "script",
                instance: i,
                count: 1,
                state: null
            },
            n.set(l, i))
        }
    }
    function ch(e, t) {
        na.M(e, t);
        var a = Mn;
        if (a && e) {
            var n = an(a).hoistableScripts
              , l = Bn(e)
              , i = n.get(l);
            i || (i = a.querySelector(jl(l)),
            i || (e = k({
                src: e,
                async: !0,
                type: "module"
            }, t),
            (t = Rt.get(l)) && To(e, t),
            i = a.createElement("script"),
            Qe(i),
            $e(i, "link", e),
            a.head.appendChild(i)),
            i = {
                type: "script",
                instance: i,
                count: 1,
                state: null
            },
            n.set(l, i))
        }
    }
    function _p(e, t, a, n) {
        var l = (l = re.current) ? Wi(l) : null;
        if (!l)
            throw Error(o(446));
        switch (e) {
        case "meta":
        case "title":
            return null;
        case "style":
            return typeof a.precedence == "string" && typeof a.href == "string" ? (t = _n(a.href),
            a = an(l).hoistableStyles,
            n = a.get(t),
            n || (n = {
                type: "style",
                instance: null,
                count: 0,
                state: null
            },
            a.set(t, n)),
            n) : {
                type: "void",
                instance: null,
                count: 0,
                state: null
            };
        case "link":
            if (a.rel === "stylesheet" && typeof a.href == "string" && typeof a.precedence == "string") {
                e = _n(a.href);
                var i = an(l).hoistableStyles
                  , r = i.get(e);
                if (r || (l = l.ownerDocument || l,
                r = {
                    type: "stylesheet",
                    instance: null,
                    count: 0,
                    state: {
                        loading: 0,
                        preload: null
                    }
                },
                i.set(e, r),
                (i = l.querySelector(Dl(e))) && !i._p && (r.instance = i,
                r.state.loading = 5),
                Rt.has(e) || (a = {
                    rel: "preload",
                    as: "style",
                    href: a.href,
                    crossOrigin: a.crossOrigin,
                    integrity: a.integrity,
                    media: a.media,
                    hrefLang: a.hrefLang,
                    referrerPolicy: a.referrerPolicy
                },
                Rt.set(e, a),
                i || oh(l, e, a, r.state))),
                t && n === null)
                    throw Error(o(528, ""));
                return r
            }
            if (t && n !== null)
                throw Error(o(529, ""));
            return null;
        case "script":
            return t = a.async,
            a = a.src,
            typeof a == "string" && t && typeof t != "function" && typeof t != "symbol" ? (t = Bn(a),
            a = an(l).hoistableScripts,
            n = a.get(t),
            n || (n = {
                type: "script",
                instance: null,
                count: 0,
                state: null
            },
            a.set(t, n)),
            n) : {
                type: "void",
                instance: null,
                count: 0,
                state: null
            };
        default:
            throw Error(o(444, e))
        }
    }
    function _n(e) {
        return 'href="' + kt(e) + '"'
    }
    function Dl(e) {
        return 'link[rel="stylesheet"][' + e + "]"
    }
    function Bp(e) {
        return k({}, e, {
            "data-precedence": e.precedence,
            precedence: null
        })
    }
    function oh(e, t, a, n) {
        e.querySelector('link[rel="preload"][as="style"][' + t + "]") ? n.loading = 1 : (t = e.createElement("link"),
        n.preload = t,
        t.addEventListener("load", function() {
            return n.loading |= 1
        }),
        t.addEventListener("error", function() {
            return n.loading |= 2
        }),
        $e(t, "link", a),
        Qe(t),
        e.head.appendChild(t))
    }
    function Bn(e) {
        return '[src="' + kt(e) + '"]'
    }
    function jl(e) {
        return "script[async]" + e
    }
    function Op(e, t, a) {
        if (t.count++,
        t.instance === null)
            switch (t.type) {
            case "style":
                var n = e.querySelector('style[data-href~="' + kt(a.href) + '"]');
                if (n)
                    return t.instance = n,
                    Qe(n),
                    n;
                var l = k({}, a, {
                    "data-href": a.href,
                    "data-precedence": a.precedence,
                    href: null,
                    precedence: null
                });
                return n = (e.ownerDocument || e).createElement("style"),
                Qe(n),
                $e(n, "style", l),
                $i(n, a.precedence, e),
                t.instance = n;
            case "stylesheet":
                l = _n(a.href);
                var i = e.querySelector(Dl(l));
                if (i)
                    return t.state.loading |= 4,
                    t.instance = i,
                    Qe(i),
                    i;
                n = Bp(a),
                (l = Rt.get(l)) && Ao(n, l),
                i = (e.ownerDocument || e).createElement("link"),
                Qe(i);
                var r = i;
                return r._p = new Promise(function(m, b) {
                    r.onload = m,
                    r.onerror = b
                }
                ),
                $e(i, "link", n),
                t.state.loading |= 4,
                $i(i, a.precedence, e),
                t.instance = i;
            case "script":
                return i = Bn(a.src),
                (l = e.querySelector(jl(i))) ? (t.instance = l,
                Qe(l),
                l) : (n = a,
                (l = Rt.get(i)) && (n = k({}, a),
                To(n, l)),
                e = e.ownerDocument || e,
                l = e.createElement("script"),
                Qe(l),
                $e(l, "link", n),
                e.head.appendChild(l),
                t.instance = l);
            case "void":
                return null;
            default:
                throw Error(o(443, t.type))
            }
        else
            t.type === "stylesheet" && (t.state.loading & 4) === 0 && (n = t.instance,
            t.state.loading |= 4,
            $i(n, a.precedence, e));
        return t.instance
    }
    function $i(e, t, a) {
        for (var n = a.querySelectorAll('link[rel="stylesheet"][data-precedence],style[data-precedence]'), l = n.length ? n[n.length - 1] : null, i = l, r = 0; r < n.length; r++) {
            var m = n[r];
            if (m.dataset.precedence === t)
                i = m;
            else if (i !== l)
                break
        }
        i ? i.parentNode.insertBefore(e, i.nextSibling) : (t = a.nodeType === 9 ? a.head : a,
        t.insertBefore(e, t.firstChild))
    }
    function Ao(e, t) {
        e.crossOrigin == null && (e.crossOrigin = t.crossOrigin),
        e.referrerPolicy == null && (e.referrerPolicy = t.referrerPolicy),
        e.title == null && (e.title = t.title)
    }
    function To(e, t) {
        e.crossOrigin == null && (e.crossOrigin = t.crossOrigin),
        e.referrerPolicy == null && (e.referrerPolicy = t.referrerPolicy),
        e.integrity == null && (e.integrity = t.integrity)
    }
    var es = null;
    function zp(e, t, a) {
        if (es === null) {
            var n = new Map
              , l = es = new Map;
            l.set(a, n)
        } else
            l = es,
            n = l.get(a),
            n || (n = new Map,
            l.set(a, n));
        if (n.has(e))
            return n;
        for (n.set(e, null),
        a = a.getElementsByTagName(e),
        l = 0; l < a.length; l++) {
            var i = a[l];
            if (!(i[Zn] || i[Ze] || e === "link" && i.getAttribute("rel") === "stylesheet") && i.namespaceURI !== "http://www.w3.org/2000/svg") {
                var r = i.getAttribute(t) || "";
                r = e + r;
                var m = n.get(r);
                m ? m.push(i) : n.set(r, [i])
            }
        }
        return n
    }
    function Hp(e, t, a) {
        e = e.ownerDocument || e,
        e.head.insertBefore(a, t === "title" ? e.querySelector("head > title") : null)
    }
    function uh(e, t, a) {
        if (a === 1 || t.itemProp != null)
            return !1;
        switch (e) {
        case "meta":
        case "title":
            return !0;
        case "style":
            if (typeof t.precedence != "string" || typeof t.href != "string" || t.href === "")
                break;
            return !0;
        case "link":
            if (typeof t.rel != "string" || typeof t.href != "string" || t.href === "" || t.onLoad || t.onError)
                break;
            return t.rel === "stylesheet" ? (e = t.disabled,
            typeof t.precedence == "string" && e == null) : !0;
        case "script":
            if (t.async && typeof t.async != "function" && typeof t.async != "symbol" && !t.onLoad && !t.onError && t.src && typeof t.src == "string")
                return !0
        }
        return !1
    }
    function Up(e) {
        return !(e.type === "stylesheet" && (e.state.loading & 3) === 0)
    }
    function rh(e, t, a, n) {
        if (a.type === "stylesheet" && (typeof n.media != "string" || matchMedia(n.media).matches !== !1) && (a.state.loading & 4) === 0) {
            if (a.instance === null) {
                var l = _n(n.href)
                  , i = t.querySelector(Dl(l));
                if (i) {
                    t = i._p,
                    t !== null && typeof t == "object" && typeof t.then == "function" && (e.count++,
                    e = ts.bind(e),
                    t.then(e, e)),
                    a.state.loading |= 4,
                    a.instance = i,
                    Qe(i);
                    return
                }
                i = t.ownerDocument || t,
                n = Bp(n),
                (l = Rt.get(l)) && Ao(n, l),
                i = i.createElement("link"),
                Qe(i);
                var r = i;
                r._p = new Promise(function(m, b) {
                    r.onload = m,
                    r.onerror = b
                }
                ),
                $e(i, "link", n),
                a.instance = i
            }
            e.stylesheets === null && (e.stylesheets = new Map),
            e.stylesheets.set(a, t),
            (t = a.state.preload) && (a.state.loading & 3) === 0 && (e.count++,
            a = ts.bind(e),
            t.addEventListener("load", a),
            t.addEventListener("error", a))
        }
    }
    var No = 0;
    function dh(e, t) {
        return e.stylesheets && e.count === 0 && ns(e, e.stylesheets),
        0 < e.count || 0 < e.imgCount ? function(a) {
            var n = setTimeout(function() {
                if (e.stylesheets && ns(e, e.stylesheets),
                e.unsuspend) {
                    var i = e.unsuspend;
                    e.unsuspend = null,
                    i()
                }
            }, 6e4 + t);
            0 < e.imgBytes && No === 0 && (No = 62500 * Xy());
            var l = setTimeout(function() {
                if (e.waitingForImages = !1,
                e.count === 0 && (e.stylesheets && ns(e, e.stylesheets),
                e.unsuspend)) {
                    var i = e.unsuspend;
                    e.unsuspend = null,
                    i()
                }
            }, (e.imgBytes > No ? 50 : 800) + t);
            return e.unsuspend = a,
            function() {
                e.unsuspend = null,
                clearTimeout(n),
                clearTimeout(l)
            }
        }
        : null
    }
    function ts() {
        if (this.count--,
        this.count === 0 && (this.imgCount === 0 || !this.waitingForImages)) {
            if (this.stylesheets)
                ns(this, this.stylesheets);
            else if (this.unsuspend) {
                var e = this.unsuspend;
                this.unsuspend = null,
                e()
            }
        }
    }
    var as = null;
    function ns(e, t) {
        e.stylesheets = null,
        e.unsuspend !== null && (e.count++,
        as = new Map,
        t.forEach(ph, e),
        as = null,
        ts.call(e))
    }
    function ph(e, t) {
        if (!(t.state.loading & 4)) {
            var a = as.get(e);
            if (a)
                var n = a.get(null);
            else {
                a = new Map,
                as.set(e, a);
                for (var l = e.querySelectorAll("link[data-precedence],style[data-precedence]"), i = 0; i < l.length; i++) {
                    var r = l[i];
                    (r.nodeName === "LINK" || r.getAttribute("media") !== "not all") && (a.set(r.dataset.precedence, r),
                    n = r)
                }
                n && a.set(null, n)
            }
            l = t.instance,
            r = l.getAttribute("data-precedence"),
            i = a.get(r) || n,
            i === n && a.set(null, l),
            a.set(r, l),
            this.count++,
            n = ts.bind(this),
            l.addEventListener("load", n),
            l.addEventListener("error", n),
            i ? i.parentNode.insertBefore(l, i.nextSibling) : (e = e.nodeType === 9 ? e.head : e,
            e.insertBefore(l, e.firstChild)),
            t.state.loading |= 4
        }
    }
    var Ml = {
        $$typeof: G,
        Provider: null,
        Consumer: null,
        _currentValue: P,
        _currentValue2: P,
        _threadCount: 0
    };
    function fh(e, t, a, n, l, i, r, m, b) {
        this.tag = 1,
        this.containerInfo = e,
        this.pingCache = this.current = this.pendingChildren = null,
        this.timeoutHandle = -1,
        this.callbackNode = this.next = this.pendingContext = this.context = this.cancelPendingCommit = null,
        this.callbackPriority = 0,
        this.expirationTimes = ks(-1),
        this.entangledLanes = this.shellSuspendCounter = this.errorRecoveryDisabledLanes = this.expiredLanes = this.warmLanes = this.pingedLanes = this.suspendedLanes = this.pendingLanes = 0,
        this.entanglements = ks(0),
        this.hiddenUpdates = ks(null),
        this.identifierPrefix = n,
        this.onUncaughtError = l,
        this.onCaughtError = i,
        this.onRecoverableError = r,
        this.pooledCache = null,
        this.pooledCacheLanes = 0,
        this.formState = b,
        this.incompleteTransitions = new Map
    }
    function Yp(e, t, a, n, l, i, r, m, b, R, M, U) {
        return e = new fh(e,t,a,r,b,R,M,U,m),
        t = 1,
        i === !0 && (t |= 24),
        i = yt(3, null, null, t),
        e.current = i,
        i.stateNode = e,
        t = sc(),
        t.refCount++,
        e.pooledCache = t,
        t.refCount++,
        i.memoizedState = {
            element: n,
            isDehydrated: a,
            cache: t
        },
        rc(i),
        e
    }
    function Gp(e) {
        return e ? (e = fn,
        e) : fn
    }
    function qp(e, t, a, n, l, i) {
        l = Gp(l),
        n.context === null ? n.context = l : n.pendingContext = l,
        n = fa(t),
        n.payload = {
            element: a
        },
        i = i === void 0 ? null : i,
        i !== null && (n.callback = i),
        a = ma(e, n, t),
        a !== null && (rt(a, e, t),
        pl(a, e, t))
    }
    function Pp(e, t) {
        if (e = e.memoizedState,
        e !== null && e.dehydrated !== null) {
            var a = e.retryLane;
            e.retryLane = a !== 0 && a < t ? a : t
        }
    }
    function Co(e, t) {
        Pp(e, t),
        (e = e.alternate) && Pp(e, t)
    }
    function Xp(e) {
        if (e.tag === 13 || e.tag === 31) {
            var t = za(e, 67108864);
            t !== null && rt(t, e, 67108864),
            Co(e, 67108864)
        }
    }
    function Vp(e) {
        if (e.tag === 13 || e.tag === 31) {
            var t = xt();
            t = ws(t);
            var a = za(e, t);
            a !== null && rt(a, e, t),
            Co(e, t)
        }
    }
    var ls = !0;
    function mh(e, t, a, n) {
        var l = N.T;
        N.T = null;
        var i = Y.p;
        try {
            Y.p = 2,
            Ro(e, t, a, n)
        } finally {
            Y.p = i,
            N.T = l
        }
    }
    function yh(e, t, a, n) {
        var l = N.T;
        N.T = null;
        var i = Y.p;
        try {
            Y.p = 8,
            Ro(e, t, a, n)
        } finally {
            Y.p = i,
            N.T = l
        }
    }
    function Ro(e, t, a, n) {
        if (ls) {
            var l = Ko(n);
            if (l === null)
                ho(e, t, n, is, a),
                Ip(e, n);
            else if (gh(l, e, t, a, n))
                n.stopPropagation();
            else if (Ip(e, n),
            t & 4 && -1 < hh.indexOf(e)) {
                for (; l !== null; ) {
                    var i = tn(l);
                    if (i !== null)
                        switch (i.tag) {
                        case 3:
                            if (i = i.stateNode,
                            i.current.memoizedState.isDehydrated) {
                                var r = ja(i.pendingLanes);
                                if (r !== 0) {
                                    var m = i;
                                    for (m.pendingLanes |= 2,
                                    m.entangledLanes |= 2; r; ) {
                                        var b = 1 << 31 - ft(r);
                                        m.entanglements[1] |= b,
                                        r &= ~b
                                    }
                                    Ht(i),
                                    (Se & 6) === 0 && (Yi = dt() + 500,
                                    Nl(0))
                                }
                            }
                            break;
                        case 31:
                        case 13:
                            m = za(i, 2),
                            m !== null && rt(m, i, 2),
                            qi(),
                            Co(i, 2)
                        }
                    if (i = Ko(n),
                    i === null && ho(e, t, n, is, a),
                    i === l)
                        break;
                    l = i
                }
                l !== null && n.stopPropagation()
            } else
                ho(e, t, n, null, a)
        }
    }
    function Ko(e) {
        return e = Ds(e),
        Do(e)
    }
    var is = null;
    function Do(e) {
        if (is = null,
        e = en(e),
        e !== null) {
            var t = f(e);
            if (t === null)
                e = null;
            else {
                var a = t.tag;
                if (a === 13) {
                    if (e = g(t),
                    e !== null)
                        return e;
                    e = null
                } else if (a === 31) {
                    if (e = x(t),
                    e !== null)
                        return e;
                    e = null
                } else if (a === 3) {
                    if (t.stateNode.current.memoizedState.isDehydrated)
                        return t.tag === 3 ? t.stateNode.containerInfo : null;
                    e = null
                } else
                    t !== e && (e = null)
            }
        }
        return is = e,
        null
    }
    function Qp(e) {
        switch (e) {
        case "beforetoggle":
        case "cancel":
        case "click":
        case "close":
        case "contextmenu":
        case "copy":
        case "cut":
        case "auxclick":
        case "dblclick":
        case "dragend":
        case "dragstart":
        case "drop":
        case "focusin":
        case "focusout":
        case "input":
        case "invalid":
        case "keydown":
        case "keypress":
        case "keyup":
        case "mousedown":
        case "mouseup":
        case "paste":
        case "pause":
        case "play":
        case "pointercancel":
        case "pointerdown":
        case "pointerup":
        case "ratechange":
        case "reset":
        case "resize":
        case "seeked":
        case "submit":
        case "toggle":
        case "touchcancel":
        case "touchend":
        case "touchstart":
        case "volumechange":
        case "change":
        case "selectionchange":
        case "textInput":
        case "compositionstart":
        case "compositionend":
        case "compositionupdate":
        case "beforeblur":
        case "afterblur":
        case "beforeinput":
        case "blur":
        case "fullscreenchange":
        case "focus":
        case "hashchange":
        case "popstate":
        case "select":
        case "selectstart":
            return 2;
        case "drag":
        case "dragenter":
        case "dragexit":
        case "dragleave":
        case "dragover":
        case "mousemove":
        case "mouseout":
        case "mouseover":
        case "pointermove":
        case "pointerout":
        case "pointerover":
        case "scroll":
        case "touchmove":
        case "wheel":
        case "mouseenter":
        case "mouseleave":
        case "pointerenter":
        case "pointerleave":
            return 8;
        case "message":
            switch (tm()) {
            case tu:
                return 2;
            case au:
                return 8;
            case Il:
            case am:
                return 32;
            case nu:
                return 268435456;
            default:
                return 32
            }
        default:
            return 32
        }
    }
    var jo = !1
      , La = null
      , Aa = null
      , Ta = null
      , _l = new Map
      , Bl = new Map
      , Na = []
      , hh = "mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset".split(" ");
    function Ip(e, t) {
        switch (e) {
        case "focusin":
        case "focusout":
            La = null;
            break;
        case "dragenter":
        case "dragleave":
            Aa = null;
            break;
        case "mouseover":
        case "mouseout":
            Ta = null;
            break;
        case "pointerover":
        case "pointerout":
            _l.delete(t.pointerId);
            break;
        case "gotpointercapture":
        case "lostpointercapture":
            Bl.delete(t.pointerId)
        }
    }
    function Ol(e, t, a, n, l, i) {
        return e === null || e.nativeEvent !== i ? (e = {
            blockedOn: t,
            domEventName: a,
            eventSystemFlags: n,
            nativeEvent: i,
            targetContainers: [l]
        },
        t !== null && (t = tn(t),
        t !== null && Xp(t)),
        e) : (e.eventSystemFlags |= n,
        t = e.targetContainers,
        l !== null && t.indexOf(l) === -1 && t.push(l),
        e)
    }
    function gh(e, t, a, n, l) {
        switch (t) {
        case "focusin":
            return La = Ol(La, e, t, a, n, l),
            !0;
        case "dragenter":
            return Aa = Ol(Aa, e, t, a, n, l),
            !0;
        case "mouseover":
            return Ta = Ol(Ta, e, t, a, n, l),
            !0;
        case "pointerover":
            var i = l.pointerId;
            return _l.set(i, Ol(_l.get(i) || null, e, t, a, n, l)),
            !0;
        case "gotpointercapture":
            return i = l.pointerId,
            Bl.set(i, Ol(Bl.get(i) || null, e, t, a, n, l)),
            !0
        }
        return !1
    }
    function Zp(e) {
        var t = en(e.target);
        if (t !== null) {
            var a = f(t);
            if (a !== null) {
                if (t = a.tag,
                t === 13) {
                    if (t = g(a),
                    t !== null) {
                        e.blockedOn = t,
                        uu(e.priority, function() {
                            Vp(a)
                        });
                        return
                    }
                } else if (t === 31) {
                    if (t = x(a),
                    t !== null) {
                        e.blockedOn = t,
                        uu(e.priority, function() {
                            Vp(a)
                        });
                        return
                    }
                } else if (t === 3 && a.stateNode.current.memoizedState.isDehydrated) {
                    e.blockedOn = a.tag === 3 ? a.stateNode.containerInfo : null;
                    return
                }
            }
        }
        e.blockedOn = null
    }
    function ss(e) {
        if (e.blockedOn !== null)
            return !1;
        for (var t = e.targetContainers; 0 < t.length; ) {
            var a = Ko(e.nativeEvent);
            if (a === null) {
                a = e.nativeEvent;
                var n = new a.constructor(a.type,a);
                Ks = n,
                a.target.dispatchEvent(n),
                Ks = null
            } else
                return t = tn(a),
                t !== null && Xp(t),
                e.blockedOn = a,
                !1;
            t.shift()
        }
        return !0
    }
    function Fp(e, t, a) {
        ss(e) && a.delete(t)
    }
    function vh() {
        jo = !1,
        La !== null && ss(La) && (La = null),
        Aa !== null && ss(Aa) && (Aa = null),
        Ta !== null && ss(Ta) && (Ta = null),
        _l.forEach(Fp),
        Bl.forEach(Fp)
    }
    function cs(e, t) {
        e.blockedOn === t && (e.blockedOn = null,
        jo || (jo = !0,
        s.unstable_scheduleCallback(s.unstable_NormalPriority, vh)))
    }
    var os = null;
    function Jp(e) {
        os !== e && (os = e,
        s.unstable_scheduleCallback(s.unstable_NormalPriority, function() {
            os === e && (os = null);
            for (var t = 0; t < e.length; t += 3) {
                var a = e[t]
                  , n = e[t + 1]
                  , l = e[t + 2];
                if (typeof n != "function") {
                    if (Do(n || a) === null)
                        continue;
                    break
                }
                var i = tn(a);
                i !== null && (e.splice(t, 3),
                t -= 3,
                Rc(i, {
                    pending: !0,
                    data: l,
                    method: a.method,
                    action: n
                }, n, l))
            }
        }))
    }
    function On(e) {
        function t(b) {
            return cs(b, e)
        }
        La !== null && cs(La, e),
        Aa !== null && cs(Aa, e),
        Ta !== null && cs(Ta, e),
        _l.forEach(t),
        Bl.forEach(t);
        for (var a = 0; a < Na.length; a++) {
            var n = Na[a];
            n.blockedOn === e && (n.blockedOn = null)
        }
        for (; 0 < Na.length && (a = Na[0],
        a.blockedOn === null); )
            Zp(a),
            a.blockedOn === null && Na.shift();
        if (a = (e.ownerDocument || e).$$reactFormReplay,
        a != null)
            for (n = 0; n < a.length; n += 3) {
                var l = a[n]
                  , i = a[n + 1]
                  , r = l[lt] || null;
                if (typeof i == "function")
                    r || Jp(a);
                else if (r) {
                    var m = null;
                    if (i && i.hasAttribute("formAction")) {
                        if (l = i,
                        r = i[lt] || null)
                            m = r.formAction;
                        else if (Do(l) !== null)
                            continue
                    } else
                        m = r.action;
                    typeof m == "function" ? a[n + 1] = m : (a.splice(n, 3),
                    n -= 3),
                    Jp(a)
                }
            }
    }
    function Wp() {
        function e(i) {
            i.canIntercept && i.info === "react-transition" && i.intercept({
                handler: function() {
                    return new Promise(function(r) {
                        return l = r
                    }
                    )
                },
                focusReset: "manual",
                scroll: "manual"
            })
        }
        function t() {
            l !== null && (l(),
            l = null),
            n || setTimeout(a, 20)
        }
        function a() {
            if (!n && !navigation.transition) {
                var i = navigation.currentEntry;
                i && i.url != null && navigation.navigate(i.url, {
                    state: i.getState(),
                    info: "react-transition",
                    history: "replace"
                })
            }
        }
        if (typeof navigation == "object") {
            var n = !1
              , l = null;
            return navigation.addEventListener("navigate", e),
            navigation.addEventListener("navigatesuccess", t),
            navigation.addEventListener("navigateerror", t),
            setTimeout(a, 100),
            function() {
                n = !0,
                navigation.removeEventListener("navigate", e),
                navigation.removeEventListener("navigatesuccess", t),
                navigation.removeEventListener("navigateerror", t),
                l !== null && (l(),
                l = null)
            }
        }
    }
    function Mo(e) {
        this._internalRoot = e
    }
    us.prototype.render = Mo.prototype.render = function(e) {
        var t = this._internalRoot;
        if (t === null)
            throw Error(o(409));
        var a = t.current
          , n = xt();
        qp(a, n, e, t, null, null)
    }
    ,
    us.prototype.unmount = Mo.prototype.unmount = function() {
        var e = this._internalRoot;
        if (e !== null) {
            this._internalRoot = null;
            var t = e.containerInfo;
            qp(e.current, 2, null, e, null, null),
            qi(),
            t[$a] = null
        }
    }
    ;
    function us(e) {
        this._internalRoot = e
    }
    us.prototype.unstable_scheduleHydration = function(e) {
        if (e) {
            var t = ou();
            e = {
                blockedOn: null,
                target: e,
                priority: t
            };
            for (var a = 0; a < Na.length && t !== 0 && t < Na[a].priority; a++)
                ;
            Na.splice(a, 0, e),
            a === 0 && Zp(e)
        }
    }
    ;
    var $p = u.version;
    if ($p !== "19.2.4")
        throw Error(o(527, $p, "19.2.4"));
    Y.findDOMNode = function(e) {
        var t = e._reactInternals;
        if (t === void 0)
            throw typeof e.render == "function" ? Error(o(188)) : (e = Object.keys(e).join(","),
            Error(o(268, e)));
        return e = p(t),
        e = e !== null ? w(e) : null,
        e = e === null ? null : e.stateNode,
        e
    }
    ;
    var bh = {
        bundleType: 0,
        version: "19.2.4",
        rendererPackageName: "react-dom",
        currentDispatcherRef: N,
        reconcilerVersion: "19.2.4"
    };
    if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ < "u") {
        var rs = __REACT_DEVTOOLS_GLOBAL_HOOK__;
        if (!rs.isDisabled && rs.supportsFiber)
            try {
                Vn = rs.inject(bh),
                pt = rs
            } catch {}
    }
    return Hl.createRoot = function(e, t) {
        if (!y(e))
            throw Error(o(299));
        var a = !1
          , n = ""
          , l = sd
          , i = cd
          , r = od;
        return t != null && (t.unstable_strictMode === !0 && (a = !0),
        t.identifierPrefix !== void 0 && (n = t.identifierPrefix),
        t.onUncaughtError !== void 0 && (l = t.onUncaughtError),
        t.onCaughtError !== void 0 && (i = t.onCaughtError),
        t.onRecoverableError !== void 0 && (r = t.onRecoverableError)),
        t = Yp(e, 1, !1, null, null, a, n, null, l, i, r, Wp),
        e[$a] = t.current,
        yo(e),
        new Mo(t)
    }
    ,
    Hl.hydrateRoot = function(e, t, a) {
        if (!y(e))
            throw Error(o(299));
        var n = !1
          , l = ""
          , i = sd
          , r = cd
          , m = od
          , b = null;
        return a != null && (a.unstable_strictMode === !0 && (n = !0),
        a.identifierPrefix !== void 0 && (l = a.identifierPrefix),
        a.onUncaughtError !== void 0 && (i = a.onUncaughtError),
        a.onCaughtError !== void 0 && (r = a.onCaughtError),
        a.onRecoverableError !== void 0 && (m = a.onRecoverableError),
        a.formState !== void 0 && (b = a.formState)),
        t = Yp(e, 1, !0, t, a ?? null, n, l, b, i, r, m, Wp),
        t.context = Gp(null),
        a = t.current,
        n = xt(),
        n = ws(n),
        l = fa(n),
        l.callback = null,
        ma(a, l, n),
        a = n,
        t.current.lanes = a,
        In(t, a),
        Ht(t),
        e[$a] = t.current,
        yo(e),
        new us(t)
    }
    ,
    Hl.version = "19.2.4",
    Hl
}
var rf;
function Ch() {
    if (rf)
        return Oo.exports;
    rf = 1;
    function s() {
        if (!(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ > "u" || typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE != "function"))
            try {
                __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(s)
            } catch (u) {
                console.error(u)
            }
    }
    return s(),
    Oo.exports = Nh(),
    Oo.exports
}
var Rh = Ch();
let pokemonSpecies = {
    bulbasaur: {
        id: 1,
        name: "Bulbasaur",
        types: ["Grass", "Poison"],
        baseStats: {
            hp: 45,
            attack: 49,
            defense: 49,
            spAttack: 65,
            spDefense: 65,
            speed: 45
        },
        baseExpYield: 64,
        growthRate: "mediumSlow"
    },
    charmander: {
        id: 4,
        name: "Charmander",
        types: ["Fire"],
        baseStats: {
            hp: 39,
            attack: 52,
            defense: 43,
            spAttack: 60,
            spDefense: 50,
            speed: 65
        },
        baseExpYield: 62,
        growthRate: "mediumSlow"
    },
    squirtle: {
        id: 7,
        name: "Squirtle",
        types: ["Water"],
        baseStats: {
            hp: 44,
            attack: 48,
            defense: 65,
            spAttack: 50,
            spDefense: 64,
            speed: 43
        },
        baseExpYield: 63,
        growthRate: "mediumSlow"
    },
    caterpie: {
        id: 10,
        name: "Caterpie",
        types: ["Bug"],
        baseStats: {
            hp: 45,
            attack: 30,
            defense: 35,
            spAttack: 20,
            spDefense: 20,
            speed: 45
        },
        baseExpYield: 39,
        growthRate: "mediumFast"
    },
    weedle: {
        id: 13,
        name: "Weedle",
        types: ["Bug", "Poison"],
        baseStats: {
            hp: 40,
            attack: 35,
            defense: 30,
            spAttack: 20,
            spDefense: 20,
            speed: 50
        },
        baseExpYield: 39,
        growthRate: "mediumFast"
    },
    pidgey: {
        id: 16,
        name: "Pidgey",
        types: ["Normal", "Flying"],
        baseStats: {
            hp: 40,
            attack: 45,
            defense: 40,
            spAttack: 35,
            spDefense: 35,
            speed: 56
        },
        baseExpYield: 50,
        growthRate: "mediumSlow"
    },
    rattata: {
        id: 19,
        name: "Rattata",
        types: ["Normal"],
        baseStats: {
            hp: 30,
            attack: 56,
            defense: 35,
            spAttack: 25,
            spDefense: 35,
            speed: 72
        },
        baseExpYield: 51,
        growthRate: "mediumFast"
    },
    pikachu: {
        id: 25,
        name: "Pikachu",
        types: ["Electric"],
        baseStats: {
            hp: 35,
            attack: 55,
            defense: 40,
            spAttack: 50,
            spDefense: 50,
            speed: 90
        },
        baseExpYield: 112,
        growthRate: "mediumFast"
    },
    metapod: {
        id: 11,
        name: "Metapod",
        types: ["Bug"],
        baseStats: {
            hp: 50,
            attack: 20,
            defense: 55,
            spAttack: 25,
            spDefense: 25,
            speed: 30
        },
        baseExpYield: 72,
        growthRate: "mediumFast"
    },
    kakuna: {
        id: 14,
        name: "Kakuna",
        types: ["Bug", "Poison"],
        baseStats: {
            hp: 45,
            attack: 25,
            defense: 50,
            spAttack: 25,
            spDefense: 25,
            speed: 35
        },
        baseExpYield: 72,
        growthRate: "mediumFast"
    },
    spearow: {
        id: 21,
        name: "Spearow",
        types: ["Normal", "Flying"],
        baseStats: {
            hp: 40,
            attack: 60,
            defense: 30,
            spAttack: 31,
            spDefense: 31,
            speed: 70
        },
        baseExpYield: 58,
        growthRate: "mediumFast"
    },
    nidoranF: {
        id: 29,
        name: "Nidoran♀",
        types: ["Poison"],
        baseStats: {
            hp: 55,
            attack: 47,
            defense: 52,
            spAttack: 40,
            spDefense: 40,
            speed: 41
        },
        baseExpYield: 55,
        growthRate: "mediumSlow"
    },
    nidoranM: {
        id: 32,
        name: "Nidoran♂",
        types: ["Poison"],
        baseStats: {
            hp: 46,
            attack: 57,
            defense: 40,
            spAttack: 40,
            spDefense: 40,
            speed: 50
        },
        baseExpYield: 55,
        growthRate: "mediumSlow"
    },
    jigglypuff: {
        id: 39,
        name: "Jigglypuff",
        types: ["Normal", "Fairy"],
        baseStats: {
            hp: 115,
            attack: 45,
            defense: 20,
            spAttack: 45,
            spDefense: 25,
            speed: 20
        },
        baseExpYield: 95,
        growthRate: "mediumFast"
    },
    zubat: {
        id: 41,
        name: "Zubat",
        types: ["Poison", "Flying"],
        baseStats: {
            hp: 40,
            attack: 45,
            defense: 35,
            spAttack: 30,
            spDefense: 40,
            speed: 55
        },
        baseExpYield: 49,
        growthRate: "mediumFast"
    },
    geodude: {
        id: 74,
        name: "Geodude",
        types: ["Rock", "Ground"],
        baseStats: {
            hp: 40,
            attack: 80,
            defense: 100,
            spAttack: 30,
            spDefense: 30,
            speed: 20
        },
        baseExpYield: 60,
        growthRate: "mediumSlow"
    },
    graveler: {
        id: 75,
        name: "Graveler",
        types: ["Rock", "Ground"],
        baseStats: {
            hp: 55,
            attack: 95,
            defense: 115,
            spAttack: 45,
            spDefense: 45,
            speed: 35
        },
        baseExpYield: 137,
        growthRate: "mediumSlow"
    },
    paras: {
        id: 46,
        name: "Paras",
        types: ["Bug", "Grass"],
        baseStats: {
            hp: 35,
            attack: 70,
            defense: 55,
            spAttack: 45,
            spDefense: 55,
            speed: 25
        },
        baseExpYield: 57,
        growthRate: "mediumFast"
    },
    parasect: {
        id: 47,
        name: "Parasect",
        types: ["Bug", "Grass"],
        baseStats: {
            hp: 60,
            attack: 95,
            defense: 80,
            spAttack: 60,
            spDefense: 80,
            speed: 30
        },
        baseExpYield: 142,
        growthRate: "mediumFast"
    },
    clefairy: {
        id: 35,
        name: "Clefairy",
        types: ["Fairy"],
        baseStats: {
            hp: 70,
            attack: 45,
            defense: 48,
            spAttack: 60,
            spDefense: 65,
            speed: 35
        },
        baseExpYield: 113,
        growthRate: "mediumFast"
    },
    ekans: {
        id: 23,
        name: "Ekans",
        types: ["Poison"],
        baseStats: {
            hp: 35,
            attack: 60,
            defense: 44,
            spAttack: 40,
            spDefense: 54,
            speed: 55
        },
        baseExpYield: 58,
        growthRate: "mediumFast"
    },
    arbok: {
        id: 24,
        name: "Arbok",
        types: ["Poison"],
        baseStats: {
            hp: 60,
            attack: 95,
            defense: 69,
            spAttack: 65,
            spDefense: 79,
            speed: 80
        },
        baseExpYield: 157,
        growthRate: "mediumFast"
    },
    sandshrew: {
        id: 27,
        name: "Sandshrew",
        types: ["Ground"],
        baseStats: {
            hp: 50,
            attack: 75,
            defense: 85,
            spAttack: 20,
            spDefense: 30,
            speed: 40
        },
        baseExpYield: 60,
        growthRate: "mediumFast"
    },
    sandslash: {
        id: 28,
        name: "Sandslash",
        types: ["Ground"],
        baseStats: {
            hp: 75,
            attack: 100,
            defense: 110,
            spAttack: 45,
            spDefense: 55,
            speed: 65
        },
        baseExpYield: 158,
        growthRate: "mediumFast"
    },
    mankey: {
        id: 56,
        name: "Mankey",
        types: ["Fighting"],
        baseStats: {
            hp: 40,
            attack: 80,
            defense: 35,
            spAttack: 35,
            spDefense: 45,
            speed: 70
        },
        baseExpYield: 61,
        growthRate: "mediumFast"
    },
    oddish: {
        id: 43,
        name: "Oddish",
        types: ["Grass", "Poison"],
        baseStats: {
            hp: 45,
            attack: 50,
            defense: 55,
            spAttack: 75,
            spDefense: 65,
            speed: 30
        },
        baseExpYield: 64,
        growthRate: "mediumSlow"
    },
    gloom: {
        id: 44,
        name: "Gloom",
        types: ["Grass", "Poison"],
        baseStats: {
            hp: 60,
            attack: 65,
            defense: 70,
            spAttack: 85,
            spDefense: 75,
            speed: 40
        },
        baseExpYield: 138,
        growthRate: "mediumSlow"
    },
    bellsprout: {
        id: 69,
        name: "Bellsprout",
        types: ["Grass", "Poison"],
        baseStats: {
            hp: 50,
            attack: 75,
            defense: 35,
            spAttack: 70,
            spDefense: 30,
            speed: 40
        },
        baseExpYield: 60,
        growthRate: "mediumSlow"
    },
    abra: {
        id: 63,
        name: "Abra",
        types: ["Psychic"],
        baseStats: {
            hp: 25,
            attack: 20,
            defense: 15,
            spAttack: 105,
            spDefense: 55,
            speed: 90
        },
        baseExpYield: 62,
        growthRate: "mediumSlow"
    },
    kadabra: {
        id: 64,
        name: "Kadabra",
        types: ["Psychic"],
        baseStats: {
            hp: 40,
            attack: 35,
            defense: 30,
            spAttack: 120,
            spDefense: 70,
            speed: 105
        },
        baseExpYield: 140,
        growthRate: "mediumSlow"
    },
    drowzee: {
        id: 96,
        name: "Drowzee",
        types: ["Psychic"],
        baseStats: {
            hp: 60,
            attack: 48,
            defense: 45,
            spAttack: 43,
            spDefense: 90,
            speed: 42
        },
        baseExpYield: 66,
        growthRate: "mediumFast"
    },
    hypno: {
        id: 97,
        name: "Hypno",
        types: ["Psychic"],
        baseStats: {
            hp: 85,
            attack: 73,
            defense: 70,
            spAttack: 73,
            spDefense: 115,
            speed: 67
        },
        baseExpYield: 169,
        growthRate: "mediumFast"
    },
    growlithe: {
        id: 58,
        name: "Growlithe",
        types: ["Fire"],
        baseStats: {
            hp: 55,
            attack: 70,
            defense: 45,
            spAttack: 70,
            spDefense: 50,
            speed: 60
        },
        baseExpYield: 70,
        growthRate: "mediumSlow"
    },
    machop: {
        id: 66,
        name: "Machop",
        types: ["Fighting"],
        baseStats: {
            hp: 70,
            attack: 80,
            defense: 50,
            spAttack: 35,
            spDefense: 35,
            speed: 35
        },
        baseExpYield: 61,
        growthRate: "mediumSlow"
    },
    machoke: {
        id: 67,
        name: "Machoke",
        types: ["Fighting"],
        baseStats: {
            hp: 80,
            attack: 100,
            defense: 70,
            spAttack: 50,
            spDefense: 60,
            speed: 45
        },
        baseExpYield: 142,
        growthRate: "mediumSlow"
    },
    onix: {
        id: 95,
        name: "Onix",
        types: ["Rock", "Ground"],
        baseStats: {
            hp: 35,
            attack: 45,
            defense: 160,
            spAttack: 30,
            spDefense: 45,
            speed: 70
        },
        baseExpYield: 77,
        growthRate: "mediumFast"
    },
    voltorb: {
        id: 100,
        name: "Voltorb",
        types: ["Electric"],
        baseStats: {
            hp: 40,
            attack: 30,
            defense: 50,
            spAttack: 55,
            spDefense: 55,
            speed: 100
        },
        baseExpYield: 66,
        growthRate: "mediumFast"
    },
    electrode: {
        id: 101,
        name: "Electrode",
        types: ["Electric"],
        baseStats: {
            hp: 60,
            attack: 50,
            defense: 70,
            spAttack: 80,
            spDefense: 80,
            speed: 150
        },
        baseExpYield: 172,
        growthRate: "mediumFast"
    },
    magnemite: {
        id: 81,
        name: "Magnemite",
        types: ["Electric", "Steel"],
        baseStats: {
            hp: 25,
            attack: 35,
            defense: 70,
            spAttack: 95,
            spDefense: 55,
            speed: 45
        },
        baseExpYield: 65,
        growthRate: "mediumFast"
    },
    magneton: {
        id: 82,
        name: "Magneton",
        types: ["Electric", "Steel"],
        baseStats: {
            hp: 50,
            attack: 60,
            defense: 95,
            spAttack: 120,
            spDefense: 70,
            speed: 70
        },
        baseExpYield: 163,
        growthRate: "mediumFast"
    },
    gastly: {
        id: 92,
        name: "Gastly",
        types: ["Ghost", "Poison"],
        baseStats: {
            hp: 30,
            attack: 35,
            defense: 30,
            spAttack: 100,
            spDefense: 35,
            speed: 80
        },
        baseExpYield: 62,
        growthRate: "mediumSlow"
    },
    haunter: {
        id: 93,
        name: "Haunter",
        types: ["Ghost", "Poison"],
        baseStats: {
            hp: 45,
            attack: 50,
            defense: 45,
            spAttack: 115,
            spDefense: 55,
            speed: 95
        },
        baseExpYield: 142,
        growthRate: "mediumSlow"
    },
    cubone: {
        id: 104,
        name: "Cubone",
        types: ["Ground"],
        baseStats: {
            hp: 50,
            attack: 50,
            defense: 95,
            spAttack: 40,
            spDefense: 50,
            speed: 35
        },
        baseExpYield: 64,
        growthRate: "mediumFast"
    },
    marowak: {
        id: 105,
        name: "Marowak",
        types: ["Ground"],
        baseStats: {
            hp: 60,
            attack: 80,
            defense: 110,
            spAttack: 50,
            spDefense: 80,
            speed: 45
        },
        baseExpYield: 149,
        growthRate: "mediumFast"
    },
    venonat: {
        id: 48,
        name: "Venonat",
        types: ["Bug", "Poison"],
        baseStats: {
            hp: 60,
            attack: 55,
            defense: 50,
            spAttack: 40,
            spDefense: 55,
            speed: 45
        },
        baseExpYield: 61,
        growthRate: "mediumFast"
    },
    venomoth: {
        id: 49,
        name: "Venomoth",
        types: ["Bug", "Poison"],
        baseStats: {
            hp: 70,
            attack: 65,
            defense: 60,
            spAttack: 90,
            spDefense: 75,
            speed: 90
        },
        baseExpYield: 158,
        growthRate: "mediumFast"
    },
    doduo: {
        id: 84,
        name: "Doduo",
        types: ["Normal", "Flying"],
        baseStats: {
            hp: 35,
            attack: 85,
            defense: 45,
            spAttack: 35,
            spDefense: 35,
            speed: 75
        },
        baseExpYield: 62,
        growthRate: "mediumFast"
    },
    dodrio: {
        id: 85,
        name: "Dodrio",
        types: ["Normal", "Flying"],
        baseStats: {
            hp: 60,
            attack: 110,
            defense: 70,
            spAttack: 60,
            spDefense: 60,
            speed: 110
        },
        baseExpYield: 165,
        growthRate: "mediumFast"
    },
    raticate: {
        id: 20,
        name: "Raticate",
        types: ["Normal"],
        baseStats: {
            hp: 55,
            attack: 81,
            defense: 60,
            spAttack: 50,
            spDefense: 70,
            speed: 97
        },
        baseExpYield: 145,
        growthRate: "mediumFast"
    },
    fearow: {
        id: 22,
        name: "Fearow",
        types: ["Normal", "Flying"],
        baseStats: {
            hp: 65,
            attack: 90,
            defense: 65,
            spAttack: 61,
            spDefense: 61,
            speed: 100
        },
        baseExpYield: 155,
        growthRate: "mediumFast"
    },
    farfetchd: {
        id: 83,
        name: "Farfetch'd",
        types: ["Normal", "Flying"],
        baseStats: {
            hp: 52,
            attack: 90,
            defense: 55,
            spAttack: 58,
            spDefense: 62,
            speed: 60
        },
        baseExpYield: 132,
        growthRate: "mediumFast"
    },
    diglett: {
        id: 50,
        name: "Diglett",
        types: ["Ground"],
        baseStats: {
            hp: 10,
            attack: 55,
            defense: 25,
            spAttack: 35,
            spDefense: 45,
            speed: 95
        },
        baseExpYield: 53,
        growthRate: "mediumFast"
    },
    dugtrio: {
        id: 51,
        name: "Dugtrio",
        types: ["Ground"],
        baseStats: {
            hp: 35,
            attack: 100,
            defense: 50,
            spAttack: 50,
            spDefense: 70,
            speed: 120
        },
        baseExpYield: 149,
        growthRate: "mediumFast"
    },
    koffing: {
        id: 109,
        name: "Koffing",
        types: ["Poison"],
        baseStats: {
            hp: 40,
            attack: 65,
            defense: 95,
            spAttack: 60,
            spDefense: 45,
            speed: 35
        },
        baseExpYield: 68,
        growthRate: "mediumFast"
    },
    grimer: {
        id: 88,
        name: "Grimer",
        types: ["Poison"],
        baseStats: {
            hp: 80,
            attack: 80,
            defense: 50,
            spAttack: 40,
            spDefense: 50,
            speed: 25
        },
        baseExpYield: 65,
        growthRate: "mediumFast"
    },
    ponyta: {
        id: 77,
        name: "Ponyta",
        types: ["Fire"],
        baseStats: {
            hp: 50,
            attack: 85,
            defense: 55,
            spAttack: 65,
            spDefense: 65,
            speed: 90
        },
        baseExpYield: 82,
        growthRate: "mediumFast"
    },
    tentacool: {
        id: 72,
        name: "Tentacool",
        types: ["Water", "Poison"],
        baseStats: {
            hp: 40,
            attack: 40,
            defense: 35,
            spAttack: 50,
            spDefense: 100,
            speed: 70
        },
        baseExpYield: 67,
        growthRate: "mediumSlow"
    },
    shellder: {
        id: 90,
        name: "Shellder",
        types: ["Water"],
        baseStats: {
            hp: 30,
            attack: 65,
            defense: 100,
            spAttack: 45,
            spDefense: 25,
            speed: 40
        },
        baseExpYield: 61,
        growthRate: "mediumSlow"
    },
    magikarp: {
        id: 129,
        name: "Magikarp",
        types: ["Water"],
        baseStats: {
            hp: 20,
            attack: 10,
            defense: 55,
            spAttack: 15,
            spDefense: 20,
            speed: 80
        },
        baseExpYield: 40,
        growthRate: "mediumSlow"
    },
    seel: {
        id: 86,
        name: "Seel",
        types: ["Water"],
        baseStats: {
            hp: 65,
            attack: 45,
            defense: 55,
            spAttack: 45,
            spDefense: 70,
            speed: 45
        },
        baseExpYield: 65,
        growthRate: "mediumFast"
    },
    dewgong: {
        id: 87,
        name: "Dewgong",
        types: ["Water", "Ice"],
        baseStats: {
            hp: 90,
            attack: 70,
            defense: 80,
            spAttack: 70,
            spDefense: 95,
            speed: 70
        },
        baseExpYield: 166,
        growthRate: "mediumFast"
    },
    psyduck: {
        id: 54,
        name: "Psyduck",
        types: ["Water"],
        baseStats: {
            hp: 50,
            attack: 52,
            defense: 48,
            spAttack: 65,
            spDefense: 50,
            speed: 55
        },
        baseExpYield: 64,
        growthRate: "mediumFast"
    },
    golduck: {
        id: 55,
        name: "Golduck",
        types: ["Water"],
        baseStats: {
            hp: 80,
            attack: 82,
            defense: 78,
            spAttack: 95,
            spDefense: 80,
            speed: 85
        },
        baseExpYield: 175,
        growthRate: "mediumFast"
    },
    slowpoke: {
        id: 79,
        name: "Slowpoke",
        types: ["Water", "Psychic"],
        baseStats: {
            hp: 90,
            attack: 65,
            defense: 65,
            spAttack: 40,
            spDefense: 40,
            speed: 15
        },
        baseExpYield: 63,
        growthRate: "mediumFast"
    },
    golbat: {
        id: 42,
        name: "Golbat",
        types: ["Poison", "Flying"],
        baseStats: {
            hp: 75,
            attack: 80,
            defense: 70,
            spAttack: 65,
            spDefense: 75,
            speed: 90
        },
        baseExpYield: 159,
        growthRate: "mediumFast"
    },
    exeggcute: {
        id: 102,
        name: "Exeggcute",
        types: ["Grass", "Psychic"],
        baseStats: {
            hp: 60,
            attack: 40,
            defense: 80,
            spAttack: 60,
            spDefense: 45,
            speed: 40
        },
        baseExpYield: 65,
        growthRate: "mediumSlow"
    },
    rhyhorn: {
        id: 111,
        name: "Rhyhorn",
        types: ["Ground", "Rock"],
        baseStats: {
            hp: 80,
            attack: 85,
            defense: 95,
            spAttack: 30,
            spDefense: 30,
            speed: 25
        },
        baseExpYield: 69,
        growthRate: "mediumSlow"
    },
    rhydon: {
        id: 112,
        name: "Rhydon",
        types: ["Ground", "Rock"],
        baseStats: {
            hp: 105,
            attack: 130,
            defense: 120,
            spAttack: 45,
            spDefense: 45,
            speed: 40
        },
        baseExpYield: 170,
        growthRate: "mediumSlow"
    },
    chansey: {
        id: 113,
        name: "Chansey",
        types: ["Normal"],
        baseStats: {
            hp: 250,
            attack: 5,
            defense: 5,
            spAttack: 35,
            spDefense: 105,
            speed: 50
        },
        baseExpYield: 395,
        growthRate: "mediumFast"
    },
    kangaskhan: {
        id: 115,
        name: "Kangaskhan",
        types: ["Normal"],
        baseStats: {
            hp: 105,
            attack: 95,
            defense: 80,
            spAttack: 40,
            spDefense: 80,
            speed: 90
        },
        baseExpYield: 172,
        growthRate: "mediumFast"
    },
    scyther: {
        id: 123,
        name: "Scyther",
        types: ["Bug", "Flying"],
        baseStats: {
            hp: 70,
            attack: 110,
            defense: 80,
            spAttack: 55,
            spDefense: 80,
            speed: 105
        },
        baseExpYield: 100,
        growthRate: "mediumFast"
    },
    tauros: {
        id: 128,
        name: "Tauros",
        types: ["Normal"],
        baseStats: {
            hp: 75,
            attack: 100,
            defense: 95,
            spAttack: 40,
            spDefense: 70,
            speed: 110
        },
        baseExpYield: 172,
        growthRate: "mediumSlow"
    },
    tangela: {
        id: 114,
        name: "Tangela",
        types: ["Grass"],
        baseStats: {
            hp: 65,
            attack: 55,
            defense: 115,
            spAttack: 100,
            spDefense: 40,
            speed: 60
        },
        baseExpYield: 87,
        growthRate: "mediumFast"
    },
    dratini: {
        id: 147,
        name: "Dratini",
        types: ["Dragon"],
        baseStats: {
            hp: 41,
            attack: 64,
            defense: 45,
            spAttack: 50,
            spDefense: 50,
            speed: 50
        },
        baseExpYield: 60,
        growthRate: "mediumSlow"
    },
    ditto: {
        id: 132,
        name: "Ditto",
        types: ["Normal"],
        baseStats: {
            hp: 48,
            attack: 48,
            defense: 48,
            spAttack: 48,
            spDefense: 48,
            speed: 48
        },
        baseExpYield: 101,
        growthRate: "mediumFast"
    },
    electabuzz: {
        id: 125,
        name: "Electabuzz",
        types: ["Electric"],
        baseStats: {
            hp: 65,
            attack: 83,
            defense: 57,
            spAttack: 95,
            spDefense: 85,
            speed: 105
        },
        baseExpYield: 172,
        growthRate: "mediumFast"
    },
    ivysaur: {
        id: 2,
        name: "Ivysaur",
        types: ["Grass", "Poison"],
        baseStats: {
            hp: 60,
            attack: 62,
            defense: 63,
            spAttack: 80,
            spDefense: 80,
            speed: 60
        },
        baseExpYield: 142,
        growthRate: "mediumSlow"
    },
    venusaur: {
        id: 3,
        name: "Venusaur",
        types: ["Grass", "Poison"],
        baseStats: {
            hp: 80,
            attack: 82,
            defense: 83,
            spAttack: 100,
            spDefense: 100,
            speed: 80
        },
        baseExpYield: 236,
        growthRate: "mediumSlow"
    },
    charmeleon: {
        id: 5,
        name: "Charmeleon",
        types: ["Fire"],
        baseStats: {
            hp: 58,
            attack: 64,
            defense: 58,
            spAttack: 80,
            spDefense: 65,
            speed: 80
        },
        baseExpYield: 142,
        growthRate: "mediumSlow"
    },
    charizard: {
        id: 6,
        name: "Charizard",
        types: ["Fire", "Flying"],
        baseStats: {
            hp: 78,
            attack: 84,
            defense: 78,
            spAttack: 109,
            spDefense: 85,
            speed: 100
        },
        baseExpYield: 240,
        growthRate: "mediumSlow"
    },
    wartortle: {
        id: 8,
        name: "Wartortle",
        types: ["Water"],
        baseStats: {
            hp: 59,
            attack: 63,
            defense: 80,
            spAttack: 65,
            spDefense: 80,
            speed: 58
        },
        baseExpYield: 142,
        growthRate: "mediumSlow"
    },
    blastoise: {
        id: 9,
        name: "Blastoise",
        types: ["Water"],
        baseStats: {
            hp: 79,
            attack: 83,
            defense: 100,
            spAttack: 85,
            spDefense: 105,
            speed: 78
        },
        baseExpYield: 239,
        growthRate: "mediumSlow"
    },
    butterfree: {
        id: 12,
        name: "Butterfree",
        types: ["Bug", "Flying"],
        baseStats: {
            hp: 60,
            attack: 45,
            defense: 50,
            spAttack: 90,
            spDefense: 80,
            speed: 70
        },
        baseExpYield: 178,
        growthRate: "mediumFast"
    },
    beedrill: {
        id: 15,
        name: "Beedrill",
        types: ["Bug", "Poison"],
        baseStats: {
            hp: 65,
            attack: 90,
            defense: 40,
            spAttack: 45,
            spDefense: 80,
            speed: 75
        },
        baseExpYield: 178,
        growthRate: "mediumFast"
    },
    pidgeotto: {
        id: 17,
        name: "Pidgeotto",
        types: ["Normal", "Flying"],
        baseStats: {
            hp: 63,
            attack: 60,
            defense: 55,
            spAttack: 50,
            spDefense: 50,
            speed: 71
        },
        baseExpYield: 122,
        growthRate: "mediumSlow"
    },
    pidgeot: {
        id: 18,
        name: "Pidgeot",
        types: ["Normal", "Flying"],
        baseStats: {
            hp: 83,
            attack: 80,
            defense: 75,
            spAttack: 70,
            spDefense: 70,
            speed: 101
        },
        baseExpYield: 216,
        growthRate: "mediumSlow"
    },
    nidorina: {
        id: 30,
        name: "Nidorina",
        types: ["Poison"],
        baseStats: {
            hp: 70,
            attack: 62,
            defense: 67,
            spAttack: 55,
            spDefense: 55,
            speed: 56
        },
        baseExpYield: 128,
        growthRate: "mediumSlow"
    },
    nidoqueen: {
        id: 31,
        name: "Nidoqueen",
        types: ["Poison", "Ground"],
        baseStats: {
            hp: 90,
            attack: 92,
            defense: 87,
            spAttack: 75,
            spDefense: 85,
            speed: 76
        },
        baseExpYield: 227,
        growthRate: "mediumSlow"
    },
    nidorino: {
        id: 33,
        name: "Nidorino",
        types: ["Poison"],
        baseStats: {
            hp: 61,
            attack: 72,
            defense: 57,
            spAttack: 55,
            spDefense: 55,
            speed: 65
        },
        baseExpYield: 128,
        growthRate: "mediumSlow"
    },
    nidoking: {
        id: 34,
        name: "Nidoking",
        types: ["Poison", "Ground"],
        baseStats: {
            hp: 81,
            attack: 102,
            defense: 77,
            spAttack: 85,
            spDefense: 75,
            speed: 85
        },
        baseExpYield: 227,
        growthRate: "mediumSlow"
    },
    raichu: {
        id: 26,
        name: "Raichu",
        types: ["Electric"],
        baseStats: {
            hp: 60,
            attack: 90,
            defense: 55,
            spAttack: 90,
            spDefense: 80,
            speed: 110
        },
        baseExpYield: 218,
        growthRate: "mediumFast"
    },
    clefable: {
        id: 36,
        name: "Clefable",
        types: ["Fairy"],
        baseStats: {
            hp: 95,
            attack: 70,
            defense: 73,
            spAttack: 95,
            spDefense: 90,
            speed: 60
        },
        baseExpYield: 217,
        growthRate: "mediumFast"
    },
    wigglytuff: {
        id: 40,
        name: "Wigglytuff",
        types: ["Normal", "Fairy"],
        baseStats: {
            hp: 140,
            attack: 70,
            defense: 45,
            spAttack: 85,
            spDefense: 50,
            speed: 45
        },
        baseExpYield: 196,
        growthRate: "mediumFast"
    },
    vileplume: {
        id: 45,
        name: "Vileplume",
        types: ["Grass", "Poison"],
        baseStats: {
            hp: 75,
            attack: 80,
            defense: 85,
            spAttack: 110,
            spDefense: 90,
            speed: 50
        },
        baseExpYield: 221,
        growthRate: "mediumSlow"
    },
    primeape: {
        id: 57,
        name: "Primeape",
        types: ["Fighting"],
        baseStats: {
            hp: 65,
            attack: 105,
            defense: 60,
            spAttack: 60,
            spDefense: 70,
            speed: 95
        },
        baseExpYield: 159,
        growthRate: "mediumFast"
    },
    arcanine: {
        id: 59,
        name: "Arcanine",
        types: ["Fire"],
        baseStats: {
            hp: 90,
            attack: 110,
            defense: 80,
            spAttack: 100,
            spDefense: 80,
            speed: 95
        },
        baseExpYield: 194,
        growthRate: "mediumSlow"
    },
    poliwag: {
        id: 60,
        name: "Poliwag",
        types: ["Water"],
        baseStats: {
            hp: 40,
            attack: 50,
            defense: 40,
            spAttack: 40,
            spDefense: 40,
            speed: 90
        },
        baseExpYield: 60,
        growthRate: "mediumSlow"
    },
    poliwhirl: {
        id: 61,
        name: "Poliwhirl",
        types: ["Water"],
        baseStats: {
            hp: 65,
            attack: 65,
            defense: 65,
            spAttack: 50,
            spDefense: 50,
            speed: 90
        },
        baseExpYield: 135,
        growthRate: "mediumSlow"
    },
    poliwrath: {
        id: 62,
        name: "Poliwrath",
        types: ["Water", "Fighting"],
        baseStats: {
            hp: 90,
            attack: 95,
            defense: 95,
            spAttack: 70,
            spDefense: 90,
            speed: 70
        },
        baseExpYield: 230,
        growthRate: "mediumSlow"
    },
    alakazam: {
        id: 65,
        name: "Alakazam",
        types: ["Psychic"],
        baseStats: {
            hp: 55,
            attack: 50,
            defense: 45,
            spAttack: 135,
            spDefense: 95,
            speed: 120
        },
        baseExpYield: 225,
        growthRate: "mediumSlow"
    },
    machamp: {
        id: 68,
        name: "Machamp",
        types: ["Fighting"],
        baseStats: {
            hp: 90,
            attack: 130,
            defense: 80,
            spAttack: 65,
            spDefense: 85,
            speed: 55
        },
        baseExpYield: 227,
        growthRate: "mediumSlow"
    },
    weepinbell: {
        id: 70,
        name: "Weepinbell",
        types: ["Grass", "Poison"],
        baseStats: {
            hp: 65,
            attack: 90,
            defense: 50,
            spAttack: 85,
            spDefense: 45,
            speed: 55
        },
        baseExpYield: 137,
        growthRate: "mediumSlow"
    },
    victreebel: {
        id: 71,
        name: "Victreebel",
        types: ["Grass", "Poison"],
        baseStats: {
            hp: 80,
            attack: 105,
            defense: 65,
            spAttack: 100,
            spDefense: 70,
            speed: 70
        },
        baseExpYield: 221,
        growthRate: "mediumSlow"
    },
    tentacruel: {
        id: 73,
        name: "Tentacruel",
        types: ["Water", "Poison"],
        baseStats: {
            hp: 80,
            attack: 70,
            defense: 65,
            spAttack: 80,
            spDefense: 120,
            speed: 100
        },
        baseExpYield: 180,
        growthRate: "mediumSlow"
    },
    golem: {
        id: 76,
        name: "Golem",
        types: ["Rock", "Ground"],
        baseStats: {
            hp: 80,
            attack: 120,
            defense: 130,
            spAttack: 55,
            spDefense: 65,
            speed: 45
        },
        baseExpYield: 223,
        growthRate: "mediumSlow"
    },
    rapidash: {
        id: 78,
        name: "Rapidash",
        types: ["Fire"],
        baseStats: {
            hp: 65,
            attack: 100,
            defense: 70,
            spAttack: 80,
            spDefense: 80,
            speed: 105
        },
        baseExpYield: 175,
        growthRate: "mediumFast"
    },
    slowbro: {
        id: 80,
        name: "Slowbro",
        types: ["Water", "Psychic"],
        baseStats: {
            hp: 95,
            attack: 75,
            defense: 110,
            spAttack: 100,
            spDefense: 80,
            speed: 30
        },
        baseExpYield: 172,
        growthRate: "mediumFast"
    },
    muk: {
        id: 89,
        name: "Muk",
        types: ["Poison"],
        baseStats: {
            hp: 105,
            attack: 105,
            defense: 75,
            spAttack: 65,
            spDefense: 100,
            speed: 50
        },
        baseExpYield: 175,
        growthRate: "mediumFast"
    },
    cloyster: {
        id: 91,
        name: "Cloyster",
        types: ["Water", "Ice"],
        baseStats: {
            hp: 50,
            attack: 95,
            defense: 180,
            spAttack: 85,
            spDefense: 45,
            speed: 70
        },
        baseExpYield: 184,
        growthRate: "mediumSlow"
    },
    gengar: {
        id: 94,
        name: "Gengar",
        types: ["Ghost", "Poison"],
        baseStats: {
            hp: 60,
            attack: 65,
            defense: 60,
            spAttack: 130,
            spDefense: 75,
            speed: 110
        },
        baseExpYield: 225,
        growthRate: "mediumSlow"
    },
    weezing: {
        id: 110,
        name: "Weezing",
        types: ["Poison"],
        baseStats: {
            hp: 65,
            attack: 90,
            defense: 120,
            spAttack: 85,
            spDefense: 70,
            speed: 60
        },
        baseExpYield: 172,
        growthRate: "mediumFast"
    },
    gyarados: {
        id: 130,
        name: "Gyarados",
        types: ["Water", "Flying"],
        baseStats: {
            hp: 95,
            attack: 125,
            defense: 79,
            spAttack: 60,
            spDefense: 100,
            speed: 81
        },
        baseExpYield: 189,
        growthRate: "mediumSlow"
    },
    exeggutor: {
        id: 103,
        name: "Exeggutor",
        types: ["Grass", "Psychic"],
        baseStats: {
            hp: 95,
            attack: 95,
            defense: 85,
            spAttack: 125,
            spDefense: 75,
            speed: 55
        },
        baseExpYield: 186,
        growthRate: "mediumSlow"
    },
    starmie: {
        id: 121,
        name: "Starmie",
        types: ["Water", "Psychic"],
        baseStats: {
            hp: 60,
            attack: 75,
            defense: 85,
            spAttack: 100,
            spDefense: 85,
            speed: 115
        },
        baseExpYield: 182,
        growthRate: "mediumSlow"
    },
    dragonair: {
        id: 148,
        name: "Dragonair",
        types: ["Dragon"],
        baseStats: {
            hp: 61,
            attack: 84,
            defense: 65,
            spAttack: 70,
            spDefense: 70,
            speed: 70
        },
        baseExpYield: 147,
        growthRate: "mediumSlow"
    },
    dragonite: {
        id: 149,
        name: "Dragonite",
        types: ["Dragon", "Flying"],
        baseStats: {
            hp: 91,
            attack: 134,
            defense: 95,
            spAttack: 100,
            spDefense: 100,
            speed: 80
        },
        baseExpYield: 270,
        growthRate: "mediumSlow"
    },
    vulpix: {
        id: 37,
        name: "Vulpix",
        types: ["Fire"],
        baseStats: {
            hp: 38,
            attack: 41,
            defense: 40,
            spAttack: 50,
            spDefense: 65,
            speed: 65
        },
        baseExpYield: 60,
        growthRate: "mediumFast"
    },
    ninetales: {
        id: 38,
        name: "Ninetales",
        types: ["Fire"],
        baseStats: {
            hp: 73,
            attack: 76,
            defense: 75,
            spAttack: 81,
            spDefense: 100,
            speed: 100
        },
        baseExpYield: 177,
        growthRate: "mediumFast"
    },
    meowth: {
        id: 52,
        name: "Meowth",
        types: ["Normal"],
        baseStats: {
            hp: 40,
            attack: 45,
            defense: 35,
            spAttack: 40,
            spDefense: 40,
            speed: 90
        },
        baseExpYield: 58,
        growthRate: "mediumFast"
    },
    persian: {
        id: 53,
        name: "Persian",
        types: ["Normal"],
        baseStats: {
            hp: 65,
            attack: 70,
            defense: 60,
            spAttack: 65,
            spDefense: 65,
            speed: 115
        },
        baseExpYield: 154,
        growthRate: "mediumFast"
    },
    horsea: {
        id: 116,
        name: "Horsea",
        types: ["Water"],
        baseStats: {
            hp: 30,
            attack: 40,
            defense: 70,
            spAttack: 70,
            spDefense: 25,
            speed: 60
        },
        baseExpYield: 59,
        growthRate: "mediumFast"
    },
    seadra: {
        id: 117,
        name: "Seadra",
        types: ["Water"],
        baseStats: {
            hp: 55,
            attack: 65,
            defense: 95,
            spAttack: 95,
            spDefense: 45,
            speed: 85
        },
        baseExpYield: 154,
        growthRate: "mediumFast"
    },
    goldeen: {
        id: 118,
        name: "Goldeen",
        types: ["Water"],
        baseStats: {
            hp: 45,
            attack: 67,
            defense: 60,
            spAttack: 35,
            spDefense: 50,
            speed: 63
        },
        baseExpYield: 64,
        growthRate: "mediumFast"
    },
    seaking: {
        id: 119,
        name: "Seaking",
        types: ["Water"],
        baseStats: {
            hp: 80,
            attack: 92,
            defense: 65,
            spAttack: 65,
            spDefense: 80,
            speed: 68
        },
        baseExpYield: 158,
        growthRate: "mediumFast"
    },
    krabby: {
        id: 98,
        name: "Krabby",
        types: ["Water"],
        baseStats: {
            hp: 30,
            attack: 105,
            defense: 90,
            spAttack: 25,
            spDefense: 25,
            speed: 50
        },
        baseExpYield: 65,
        growthRate: "mediumFast"
    },
    kingler: {
        id: 99,
        name: "Kingler",
        types: ["Water"],
        baseStats: {
            hp: 55,
            attack: 130,
            defense: 115,
            spAttack: 50,
            spDefense: 50,
            speed: 75
        },
        baseExpYield: 166,
        growthRate: "mediumFast"
    },
    staryu: {
        id: 120,
        name: "Staryu",
        types: ["Water"],
        baseStats: {
            hp: 30,
            attack: 45,
            defense: 55,
            spAttack: 70,
            spDefense: 55,
            speed: 85
        },
        baseExpYield: 68,
        growthRate: "mediumSlow"
    },
    mrMime: {
        id: 122,
        name: "Mr. Mime",
        types: ["Psychic", "Fairy"],
        baseStats: {
            hp: 40,
            attack: 45,
            defense: 65,
            spAttack: 100,
            spDefense: 120,
            speed: 90
        },
        baseExpYield: 161,
        growthRate: "mediumFast"
    },
    jynx: {
        id: 124,
        name: "Jynx",
        types: ["Ice", "Psychic"],
        baseStats: {
            hp: 65,
            attack: 50,
            defense: 35,
            spAttack: 115,
            spDefense: 95,
            speed: 95
        },
        baseExpYield: 159,
        growthRate: "mediumFast"
    },
    magmar: {
        id: 126,
        name: "Magmar",
        types: ["Fire"],
        baseStats: {
            hp: 65,
            attack: 95,
            defense: 57,
            spAttack: 100,
            spDefense: 85,
            speed: 93
        },
        baseExpYield: 173,
        growthRate: "mediumFast"
    },
    pinsir: {
        id: 127,
        name: "Pinsir",
        types: ["Bug"],
        baseStats: {
            hp: 65,
            attack: 125,
            defense: 100,
            spAttack: 55,
            spDefense: 70,
            speed: 85
        },
        baseExpYield: 175,
        growthRate: "mediumSlow"
    },
    eevee: {
        id: 133,
        name: "Eevee",
        types: ["Normal"],
        baseStats: {
            hp: 55,
            attack: 55,
            defense: 50,
            spAttack: 45,
            spDefense: 65,
            speed: 55
        },
        baseExpYield: 65,
        growthRate: "mediumFast"
    },
    vaporeon: {
        id: 134,
        name: "Vaporeon",
        types: ["Water"],
        baseStats: {
            hp: 130,
            attack: 65,
            defense: 60,
            spAttack: 110,
            spDefense: 95,
            speed: 65
        },
        baseExpYield: 184,
        growthRate: "mediumFast"
    },
    jolteon: {
        id: 135,
        name: "Jolteon",
        types: ["Electric"],
        baseStats: {
            hp: 65,
            attack: 65,
            defense: 60,
            spAttack: 110,
            spDefense: 95,
            speed: 130
        },
        baseExpYield: 184,
        growthRate: "mediumFast"
    },
    flareon: {
        id: 136,
        name: "Flareon",
        types: ["Fire"],
        baseStats: {
            hp: 65,
            attack: 130,
            defense: 60,
            spAttack: 95,
            spDefense: 110,
            speed: 65
        },
        baseExpYield: 184,
        growthRate: "mediumFast"
    },
    porygon: {
        id: 137,
        name: "Porygon",
        types: ["Normal"],
        baseStats: {
            hp: 65,
            attack: 60,
            defense: 70,
            spAttack: 85,
            spDefense: 75,
            speed: 40
        },
        baseExpYield: 79,
        growthRate: "mediumFast"
    },
    omanyte: {
        id: 138,
        name: "Omanyte",
        types: ["Rock", "Water"],
        baseStats: {
            hp: 35,
            attack: 40,
            defense: 100,
            spAttack: 90,
            spDefense: 55,
            speed: 35
        },
        baseExpYield: 71,
        growthRate: "mediumFast"
    },
    omastar: {
        id: 139,
        name: "Omastar",
        types: ["Rock", "Water"],
        baseStats: {
            hp: 70,
            attack: 60,
            defense: 125,
            spAttack: 115,
            spDefense: 70,
            speed: 55
        },
        baseExpYield: 173,
        growthRate: "mediumFast"
    },
    kabuto: {
        id: 140,
        name: "Kabuto",
        types: ["Rock", "Water"],
        baseStats: {
            hp: 30,
            attack: 80,
            defense: 90,
            spAttack: 55,
            spDefense: 45,
            speed: 55
        },
        baseExpYield: 71,
        growthRate: "mediumFast"
    },
    kabutops: {
        id: 141,
        name: "Kabutops",
        types: ["Rock", "Water"],
        baseStats: {
            hp: 60,
            attack: 115,
            defense: 105,
            spAttack: 65,
            spDefense: 70,
            speed: 80
        },
        baseExpYield: 173,
        growthRate: "mediumFast"
    },
    aerodactyl: {
        id: 142,
        name: "Aerodactyl",
        types: ["Rock", "Flying"],
        baseStats: {
            hp: 80,
            attack: 105,
            defense: 65,
            spAttack: 60,
            spDefense: 75,
            speed: 130
        },
        baseExpYield: 180,
        growthRate: "mediumSlow"
    },
    snorlax: {
        id: 143,
        name: "Snorlax",
        types: ["Normal"],
        baseStats: {
            hp: 160,
            attack: 110,
            defense: 65,
            spAttack: 65,
            spDefense: 110,
            speed: 30
        },
        baseExpYield: 189,
        growthRate: "mediumSlow"
    },
    hitmonlee: {
        id: 106,
        name: "Hitmonlee",
        types: ["Fighting"],
        baseStats: {
            hp: 50,
            attack: 120,
            defense: 53,
            spAttack: 35,
            spDefense: 110,
            speed: 87
        },
        baseExpYield: 159,
        growthRate: "mediumFast"
    },
    hitmonchan: {
        id: 107,
        name: "Hitmonchan",
        types: ["Fighting"],
        baseStats: {
            hp: 50,
            attack: 105,
            defense: 79,
            spAttack: 35,
            spDefense: 110,
            speed: 76
        },
        baseExpYield: 159,
        growthRate: "mediumFast"
    },
    lickitung: {
        id: 108,
        name: "Lickitung",
        types: ["Normal"],
        baseStats: {
            hp: 90,
            attack: 55,
            defense: 75,
            spAttack: 60,
            spDefense: 75,
            speed: 30
        },
        baseExpYield: 77,
        growthRate: "mediumFast"
    },
    lapras: {
        id: 131,
        name: "Lapras",
        types: ["Water", "Ice"],
        baseStats: {
            hp: 130,
            attack: 85,
            defense: 80,
            spAttack: 85,
            spDefense: 95,
            speed: 60
        },
        baseExpYield: 187,
        growthRate: "mediumSlow"
    },
    articuno: {
        id: 144,
        name: "Articuno",
        types: ["Ice", "Flying"],
        baseStats: {
            hp: 90,
            attack: 85,
            defense: 100,
            spAttack: 95,
            spDefense: 125,
            speed: 85
        },
        baseExpYield: 261,
        growthRate: "mediumSlow"
    },
    zapdos: {
        id: 145,
        name: "Zapdos",
        types: ["Electric", "Flying"],
        baseStats: {
            hp: 90,
            attack: 90,
            defense: 85,
            spAttack: 125,
            spDefense: 90,
            speed: 100
        },
        baseExpYield: 261,
        growthRate: "mediumSlow"
    },
    moltres: {
        id: 146,
        name: "Moltres",
        types: ["Fire", "Flying"],
        baseStats: {
            hp: 90,
            attack: 100,
            defense: 90,
            spAttack: 125,
            spDefense: 85,
            speed: 90
        },
        baseExpYield: 261,
        growthRate: "mediumSlow"
    },
    mewtwo: {
        id: 150,
        name: "Mewtwo",
        types: ["Psychic"],
        baseStats: {
            hp: 106,
            attack: 110,
            defense: 90,
            spAttack: 154,
            spDefense: 90,
            speed: 130
        },
        baseExpYield: 306,
        growthRate: "mediumSlow"
    },
    mew: {
        id: 151,
        name: "Mew",
        types: ["Psychic"],
        baseStats: {
            hp: 100,
            attack: 100,
            defense: 100,
            spAttack: 100,
            spDefense: 100,
            speed: 100
        },
        baseExpYield: 270,
        growthRate: "mediumSlow"
    }
}
  , evolutionData = {
    bulbasaur: [{
        into: "ivysaur",
        level: 16
    }],
    ivysaur: [{
        into: "venusaur",
        level: 32
    }],
    charmander: [{
        into: "charmeleon",
        level: 16
    }],
    charmeleon: [{
        into: "charizard",
        level: 36
    }],
    squirtle: [{
        into: "wartortle",
        level: 16
    }],
    wartortle: [{
        into: "blastoise",
        level: 36
    }],
    caterpie: [{
        into: "metapod",
        level: 7
    }],
    metapod: [{
        into: "butterfree",
        level: 10
    }],
    weedle: [{
        into: "kakuna",
        level: 7
    }],
    kakuna: [{
        into: "beedrill",
        level: 10
    }],
    pidgey: [{
        into: "pidgeotto",
        level: 18
    }],
    pidgeotto: [{
        into: "pidgeot",
        level: 36
    }],
    spearow: [{
        into: "fearow",
        level: 20
    }],
    doduo: [{
        into: "dodrio",
        level: 31
    }],
    ekans: [{
        into: "arbok",
        level: 22
    }],
    nidoranF: [{
        into: "nidorina",
        level: 16
    }],
    nidoranM: [{
        into: "nidorino",
        level: 16
    }],
    zubat: [{
        into: "golbat",
        level: 22
    }],
    grimer: [{
        into: "muk",
        level: 38
    }],
    koffing: [{
        into: "weezing",
        level: 35
    }],
    oddish: [{
        into: "gloom",
        level: 21
    }],
    bellsprout: [{
        into: "weepinbell",
        level: 21
    }],
    mankey: [{
        into: "primeape",
        level: 28
    }],
    machop: [{
        into: "machoke",
        level: 28
    }],
    abra: [{
        into: "kadabra",
        level: 16
    }],
    drowzee: [{
        into: "hypno",
        level: 26
    }],
    diglett: [{
        into: "dugtrio",
        level: 26
    }],
    cubone: [{
        into: "marowak",
        level: 28
    }],
    sandshrew: [{
        into: "sandslash",
        level: 22
    }],
    geodude: [{
        into: "graveler",
        level: 25
    }],
    rhyhorn: [{
        into: "rhydon",
        level: 42
    }],
    psyduck: [{
        into: "golduck",
        level: 33
    }],
    tentacool: [{
        into: "tentacruel",
        level: 30
    }],
    poliwag: [{
        into: "poliwhirl",
        level: 25
    }],
    horsea: [{
        into: "seadra",
        level: 32
    }],
    goldeen: [{
        into: "seaking",
        level: 33
    }],
    krabby: [{
        into: "kingler",
        level: 28
    }],
    seel: [{
        into: "dewgong",
        level: 34
    }],
    slowpoke: [{
        into: "slowbro",
        level: 37
    }],
    magikarp: [{
        into: "gyarados",
        level: 20
    }],
    rattata: [{
        into: "raticate",
        level: 20
    }],
    meowth: [{
        into: "persian",
        level: 28
    }],
    ponyta: [{
        into: "rapidash",
        level: 40
    }],
    voltorb: [{
        into: "electrode",
        level: 30
    }],
    magnemite: [{
        into: "magneton",
        level: 30
    }],
    gastly: [{
        into: "haunter",
        level: 25
    }],
    paras: [{
        into: "parasect",
        level: 24
    }],
    venonat: [{
        into: "venomoth",
        level: 31
    }],
    omanyte: [{
        into: "omastar",
        level: 40
    }],
    kabuto: [{
        into: "kabutops",
        level: 40
    }],
    dratini: [{
        into: "dragonair",
        level: 30
    }],
    dragonair: [{
        into: "dragonite",
        level: 55
    }],
    pikachu: [{
        into: "raichu",
        item: "thunderStone"
    }],
    nidorina: [{
        into: "nidoqueen",
        item: "moonStone"
    }],
    nidorino: [{
        into: "nidoking",
        item: "moonStone"
    }],
    clefairy: [{
        into: "clefable",
        item: "moonStone"
    }],
    jigglypuff: [{
        into: "wigglytuff",
        item: "moonStone"
    }],
    vulpix: [{
        into: "ninetales",
        item: "fireStone"
    }],
    growlithe: [{
        into: "arcanine",
        item: "fireStone"
    }],
    gloom: [{
        into: "vileplume",
        item: "leafStone"
    }],
    weepinbell: [{
        into: "victreebel",
        item: "leafStone"
    }],
    poliwhirl: [{
        into: "poliwrath",
        item: "waterStone"
    }],
    shellder: [{
        into: "cloyster",
        item: "waterStone"
    }],
    exeggcute: [{
        into: "exeggutor",
        item: "leafStone"
    }],
    staryu: [{
        into: "starmie",
        item: "waterStone"
    }],
    eevee: [{
        into: "vaporeon",
        item: "waterStone"
    }, {
        into: "jolteon",
        item: "thunderStone"
    }, {
        into: "flareon",
        item: "fireStone"
    }],
    kadabra: [{
        into: "alakazam",
        item: "linkCable"
    }],
    machoke: [{
        into: "machamp",
        item: "linkCable"
    }],
    graveler: [{
        into: "golem",
        item: "linkCable"
    }],
    haunter: [{
        into: "gengar",
        item: "linkCable"
    }]
}
  , preEvolutionMap = Object.fromEntries(Object.entries(evolutionData).flatMap( ([s,u]) => u.map(d => [d.into, s])));
function getPokemonSpriteUrl(s, u=!1, d=!1) {
    const o = "/assets/sprites/pokemon/versions/generation-v/black-white/animated";
    return d && u ? `${o}/back/shiny/${s}.gif` : d ? `${o}/shiny/${s}.gif` : u ? `${o}/back/${s}.gif` : `${o}/${s}.gif`
}
const jf = 0;
function Kh(s, u, d) {
    return Math.floor((2 * s + d + Math.floor(jf / 4)) * u / 100) + u + 10
}
function Ul(s, u, d) {
    return Math.floor((Math.floor((2 * s + d + Math.floor(jf / 4)) * u / 100) + 5) * 1)
}
function calculatePokemonStats(s, u, d) {
    return {
        hp: Kh(s.baseStats.hp, u, d.hp),
        attack: Ul(s.baseStats.attack, u, d.attack),
        defense: Ul(s.baseStats.defense, u, d.defense),
        spAttack: Ul(s.baseStats.spAttack, u, d.spAttack),
        spDefense: Ul(s.baseStats.spDefense, u, d.spDefense),
        speed: Ul(s.baseStats.speed, u, d.speed)
    }
}
function generateIVs() {
    return {
        hp: Math.floor(Math.random() * 32),
        attack: Math.floor(Math.random() * 32),
        defense: Math.floor(Math.random() * 32),
        spAttack: Math.floor(Math.random() * 32),
        spDefense: Math.floor(Math.random() * 32),
        speed: Math.floor(Math.random() * 32)
    }
}
function getPerfectIVs() {
    return {
        hp: 31,
        attack: 31,
        defense: 31,
        spAttack: 31,
        spDefense: 31,
        speed: 31
    }
}

let moveLearnsets = {
    bulbasaur: [[1, "tackle"], [1, "growl"], [3, "vineWhip"], [7, "leechSeed"], [9, "poisonPowder"], [13, "razorLeaf"], [15, "sleepPowder"], [20, "sludge"]],
    charmander: [[1, "scratch"], [1, "growl"], [4, "ember"], [8, "metalClaw"], [12, "fireSpin"], [17, "dragonRage"], [24, "flamethrower"]],
    squirtle: [[1, "tackle"], [1, "tailWhip"], [4, "waterGun"], [7, "bubble"], [10, "bite"], [13, "waterPulse"]],
    caterpie: [[1, "tackle"], [1, "stringShot"], [9, "bugBite"]],
    weedle: [[1, "poisonSting"], [1, "stringShot"], [9, "bugBite"]],
    pidgey: [[1, "tackle"], [5, "gust"], [9, "quickAttack"], [13, "wingAttack"]],
    rattata: [[1, "tackle"], [1, "tailWhip"], [4, "quickAttack"], [7, "focusEnergy"], [10, "bite"], [13, "hyperFang"]],
    pikachu: [[1, "thunderShock"], [1, "growl"], [5, "tailWhip"], [10, "quickAttack"], [13, "thunderWave"], [18, "thunderbolt"]],
    metapod: [[1, "tackle"], [1, "stringShot"], [1, "harden"], [9, "bugBite"]],
    kakuna: [[1, "poisonSting"], [1, "stringShot"], [1, "harden"], [9, "bugBite"]],
    spearow: [[1, "peck"], [1, "growl"], [5, "leer"], [9, "furyAttack"], [13, "quickAttack"], [17, "wingAttack"]],
    nidoranF: [[1, "growl"], [1, "poisonSting"], [5, "scratch"], [9, "tailWhip"], [13, "doubleKick"], [17, "bite"]],
    nidoranM: [[1, "leer"], [1, "poisonSting"], [5, "tackle"], [9, "hornAttack"], [13, "doubleKick"], [17, "bite"]],
    jigglypuff: [[1, "sing"], [1, "pound"], [5, "defense_curl"], [9, "disarmingVoice"], [13, "doubleSlap"], [17, "rollout"], [21, "bodySlam"]],
    zubat: [[1, "absorb"], [1, "supersonic"], [5, "bite"], [9, "leechLife"], [13, "confuseRay"], [17, "airCutter"], [21, "wingAttack"]],
    geodude: [[1, "tackle"], [1, "defense_curl"], [6, "rollout"], [11, "rockThrow"], [16, "magnitude"]],
    graveler: [[1, "tackle"], [1, "defense_curl"], [6, "rollout"], [11, "rockThrow"], [16, "magnitude"], [22, "rockSlide"]],
    paras: [[1, "scratch"], [7, "absorb"], [13, "bugBite"], [19, "slash"]],
    parasect: [[1, "scratch"], [1, "absorb"], [13, "bugBite"], [19, "slash"]],
    clefairy: [[1, "pound"], [1, "growl"], [5, "disarmingVoice"], [9, "doubleSlap"], [13, "defense_curl"], [18, "bodySlam"]],
    ekans: [[1, "leer"], [1, "poisonSting"], [6, "bite"], [12, "glare"], [17, "acid"]],
    arbok: [[1, "bite"], [1, "poisonSting"], [6, "glare"], [12, "acid"], [17, "crunch"]],
    sandshrew: [[1, "scratch"], [1, "defense_curl"], [7, "poisonSting"], [11, "rollout"], [14, "slash"]],
    sandslash: [[1, "scratch"], [1, "defense_curl"], [7, "poisonSting"], [11, "rollout"], [14, "slash"], [22, "earthquake"]],
    mankey: [[1, "scratch"], [1, "leer"], [5, "lowKick"], [9, "focusEnergy"], [13, "furyAttack"], [17, "karateChop"]],
    oddish: [[1, "absorb"], [5, "poisonPowder"], [9, "sleepPowder"], [14, "acid"], [19, "razorLeaf"]],
    gloom: [[1, "absorb"], [1, "poisonPowder"], [9, "sleepPowder"], [14, "acid"], [19, "razorLeaf"], [24, "petalDance"]],
    bellsprout: [[1, "vineWhip"], [1, "growl"], [7, "poisonPowder"], [11, "sleepPowder"], [15, "razorLeaf"], [19, "acid"]],
    abra: [[1, "teleport"]],
    kadabra: [[1, "confusion"], [1, "teleport"], [16, "disable"], [21, "psybeam"], [26, "psychic"]],
    drowzee: [[1, "pound"], [1, "hypnosis"], [7, "confusion"], [13, "headbutt"], [19, "psybeam"]],
    hypno: [[1, "confusion"], [1, "hypnosis"], [7, "psybeam"], [13, "headbutt"], [19, "psychic"]],
    growlithe: [[1, "bite"], [1, "growl"], [6, "ember"], [12, "flameWheel"], [19, "fireSpin"], [25, "flamethrower"]],
    machop: [[1, "lowKick"], [1, "leer"], [7, "focusEnergy"], [10, "karateChop"], [13, "doubleKick"], [19, "submission"]],
    machoke: [[1, "lowKick"], [1, "leer"], [7, "focusEnergy"], [10, "karateChop"], [13, "doubleKick"], [19, "submission"], [25, "seismicToss"]],
    onix: [[1, "tackle"], [1, "harden"], [6, "rockThrow"], [10, "bind"], [14, "rockSlide"], [20, "earthquake"]],
    voltorb: [[1, "tackle"], [1, "thunderShock"], [9, "sonicBoom"], [17, "thunderShock"], [22, "thunderbolt"]],
    electrode: [[1, "tackle"], [1, "thunderShock"], [9, "sonicBoom"], [22, "thunderbolt"], [29, "swift"]],
    magnemite: [[1, "tackle"], [1, "thunderShock"], [6, "sonicBoom"], [11, "thunderWave"], [17, "thunderbolt"]],
    magneton: [[1, "tackle"], [1, "thunderShock"], [1, "sonicBoom"], [11, "thunderWave"], [17, "thunderbolt"], [24, "triAttack"]],
    gastly: [[1, "leer"], [1, "confuseRay"], [5, "absorb"], [12, "shadowBall"], [19, "sludge"]],
    haunter: [[1, "confuseRay"], [1, "absorb"], [12, "shadowBall"], [19, "sludge"], [25, "dreamEater"]],
    cubone: [[1, "growl"], [1, "boneClub"], [7, "headbutt"], [11, "leer"], [15, "focusEnergy"], [21, "bonemerang"]],
    marowak: [[1, "boneClub"], [1, "headbutt"], [7, "leer"], [11, "focusEnergy"], [21, "bonemerang"], [28, "earthquake"]],
    venonat: [[1, "tackle"], [1, "disable"], [7, "poisonSting"], [13, "confuseRay"], [17, "leechLife"], [21, "psybeam"]],
    venomoth: [[1, "poisonSting"], [1, "confuseRay"], [13, "leechLife"], [17, "psybeam"], [24, "psychic"]],
    doduo: [[1, "peck"], [1, "growl"], [7, "quickAttack"], [13, "furyAttack"], [21, "drillPeck"]],
    dodrio: [[1, "peck"], [1, "growl"], [7, "quickAttack"], [13, "furyAttack"], [21, "drillPeck"], [30, "triAttack"]],
    raticate: [[1, "tackle"], [1, "tailWhip"], [4, "quickAttack"], [7, "focusEnergy"], [10, "bite"], [13, "hyperFang"], [20, "bodySlam"]],
    fearow: [[1, "peck"], [1, "growl"], [5, "leer"], [9, "furyAttack"], [13, "quickAttack"], [17, "wingAttack"], [25, "drillPeck"]],
    farfetchd: [[1, "peck"], [1, "leer"], [7, "slash"], [13, "swordsDance"], [19, "wingAttack"]],
    diglett: [[1, "scratch"], [1, "growl"], [7, "magnitude"], [15, "dig"], [21, "slash"], [25, "earthquake"]],
    dugtrio: [[1, "scratch"], [1, "growl"], [7, "magnitude"], [15, "dig"], [21, "slash"], [26, "earthquake"]],
    koffing: [[1, "tackle"], [1, "poisonSting"], [6, "sludge"], [12, "smokescreen"], [18, "selfDestruct"]],
    grimer: [[1, "pound"], [1, "poisonSting"], [5, "disable"], [10, "sludge"], [16, "acid"], [22, "bodySlam"]],
    ponyta: [[1, "tackle"], [1, "growl"], [5, "ember"], [9, "fireSpin"], [14, "stomp"], [19, "flameWheel"], [25, "flamethrower"]],
    tentacool: [[1, "poisonSting"], [1, "supersonic"], [6, "absorb"], [12, "acid"], [18, "waterPulse"], [24, "sludge"]],
    shellder: [[1, "tackle"], [1, "leer"], [8, "waterGun"], [15, "icicleCrash"], [22, "clamp"]],
    magikarp: [[1, "splash"], [15, "tackle"]],
    seel: [[1, "headbutt"], [1, "growl"], [7, "waterGun"], [11, "icyWind"], [16, "auroraBeam"]],
    dewgong: [[1, "headbutt"], [1, "growl"], [7, "waterGun"], [11, "icyWind"], [16, "auroraBeam"], [22, "iceBeam"]],
    psyduck: [[1, "scratch"], [1, "tailWhip"], [5, "waterGun"], [10, "confusion"], [15, "disable"], [21, "waterPulse"]],
    golduck: [[1, "scratch"], [1, "waterGun"], [5, "confusion"], [10, "disable"], [15, "waterPulse"], [21, "psychic"]],
    slowpoke: [[1, "tackle"], [1, "growl"], [5, "waterGun"], [9, "confusion"], [14, "headbutt"], [19, "psychic"]],
    golbat: [[1, "absorb"], [1, "supersonic"], [5, "bite"], [9, "leechLife"], [13, "confuseRay"], [17, "airCutter"], [21, "wingAttack"]],
    exeggcute: [[1, "absorb"], [1, "hypnosis"], [7, "confusion"], [13, "leechSeed"], [19, "razorLeaf"]],
    rhyhorn: [[1, "hornAttack"], [1, "tailWhip"], [9, "stomp"], [17, "rockSlide"], [25, "earthquake"]],
    rhydon: [[1, "hornAttack"], [1, "tailWhip"], [9, "stomp"], [17, "rockSlide"], [25, "earthquake"], [33, "megahorn"]],
    chansey: [[1, "pound"], [1, "growl"], [5, "tailWhip"], [9, "doubleSlap"], [13, "bodySlam"]],
    kangaskhan: [[1, "pound"], [1, "leer"], [7, "bite"], [13, "headbutt"], [19, "bodySlam"], [25, "megaPunch"]],
    scyther: [[1, "quickAttack"], [1, "leer"], [5, "wingAttack"], [9, "slash"], [13, "furyAttack"], [17, "bugBite"], [21, "swordsDance"]],
    tauros: [[1, "tackle"], [1, "tailWhip"], [8, "hornAttack"], [13, "bodySlam"], [21, "takeDown"]],
    tangela: [[1, "absorb"], [1, "vineWhip"], [7, "poisonPowder"], [10, "sleepPowder"], [14, "razorLeaf"], [19, "sludge"]],
    dratini: [[1, "leer"], [1, "tackle"], [5, "dragonRage"], [11, "thunderWave"], [15, "slam"], [21, "dragonBreath"]],
    ditto: [[1, "tackle"]],
    electabuzz: [[1, "quickAttack"], [1, "thunderShock"], [5, "leer"], [9, "thunderWave"], [15, "thunderbolt"], [21, "thunderPunch"]],
    ivysaur: [[1, "tackle"], [1, "growl"], [3, "vineWhip"], [7, "leechSeed"], [13, "razorLeaf"], [20, "sludge"], [28, "sleepPowder"]],
    venusaur: [[1, "vineWhip"], [1, "razorLeaf"], [13, "sludge"], [20, "sleepPowder"], [32, "petalDance"], [40, "sludgeBomb"]],
    charmeleon: [[1, "scratch"], [1, "ember"], [8, "metalClaw"], [12, "fireSpin"], [17, "dragonRage"], [24, "flamethrower"], [30, "slash"]],
    charizard: [[1, "scratch"], [1, "ember"], [12, "fireSpin"], [17, "dragonRage"], [24, "flamethrower"], [36, "wingAttack"], [46, "fireBlast"]],
    wartortle: [[1, "tackle"], [1, "waterGun"], [7, "bubble"], [10, "bite"], [13, "waterPulse"], [20, "bubbleBeam"]],
    blastoise: [[1, "tackle"], [1, "waterGun"], [10, "bite"], [13, "waterPulse"], [20, "bubbleBeam"], [36, "surf"], [44, "hydroPump"]],
    butterfree: [[1, "confusion"], [1, "poisonPowder"], [12, "sleepPowder"], [16, "psybeam"], [22, "signalBeam"], [28, "psychic"]],
    beedrill: [[1, "furyAttack"], [1, "poisonSting"], [12, "focusEnergy"], [16, "bugBite"], [20, "pinMissile"], [28, "sludgeBomb"]],
    pidgeotto: [[1, "tackle"], [1, "gust"], [9, "quickAttack"], [13, "wingAttack"], [22, "drillPeck"]],
    pidgeot: [[1, "tackle"], [1, "gust"], [9, "quickAttack"], [13, "wingAttack"], [22, "drillPeck"], [36, "skyAttack"]],
    nidorina: [[1, "poisonSting"], [1, "scratch"], [9, "doubleKick"], [13, "bite"], [20, "sludge"], [28, "bodySlam"]],
    nidoqueen: [[1, "poisonSting"], [1, "scratch"], [9, "doubleKick"], [13, "bodySlam"], [23, "sludgeBomb"], [35, "earthquake"]],
    nidorino: [[1, "poisonSting"], [1, "hornAttack"], [9, "doubleKick"], [13, "bite"], [20, "sludge"], [28, "bodySlam"]],
    nidoking: [[1, "poisonSting"], [1, "hornAttack"], [9, "doubleKick"], [13, "bodySlam"], [23, "sludgeBomb"], [35, "earthquake"]],
    raichu: [[1, "thunderShock"], [1, "quickAttack"], [5, "thunderWave"], [10, "thunderbolt"]],
    clefable: [[1, "pound"], [1, "disarmingVoice"], [9, "doubleSlap"], [18, "bodySlam"], [25, "psychic"]],
    wigglytuff: [[1, "pound"], [1, "sing"], [9, "disarmingVoice"], [13, "doubleSlap"], [17, "bodySlam"], [25, "hyperBeam"]],
    vileplume: [[1, "absorb"], [1, "poisonPowder"], [14, "acid"], [19, "razorLeaf"], [24, "petalDance"], [34, "sludgeBomb"]],
    primeape: [[1, "scratch"], [1, "lowKick"], [9, "focusEnergy"], [13, "furyAttack"], [17, "karateChop"], [28, "crossChop"], [35, "submission"]],
    arcanine: [[1, "bite"], [1, "ember"], [12, "flameWheel"], [19, "fireSpin"], [25, "flamethrower"], [34, "fireBlast"]],
    poliwag: [[1, "waterGun"], [1, "hypnosis"], [7, "bubble"], [13, "doubleSlap"], [19, "bubbleBeam"], [25, "bodySlam"]],
    poliwhirl: [[1, "waterGun"], [1, "hypnosis"], [7, "bubbleBeam"], [13, "doubleSlap"], [19, "bodySlam"], [25, "surf"]],
    poliwrath: [[1, "waterGun"], [1, "hypnosis"], [7, "bubbleBeam"], [13, "submission"], [19, "surf"], [30, "crossChop"]],
    alakazam: [[1, "confusion"], [1, "teleport"], [16, "psybeam"], [21, "psychic"], [30, "reflect"]],
    machamp: [[1, "lowKick"], [1, "karateChop"], [13, "doubleKick"], [19, "submission"], [25, "seismicToss"], [36, "crossChop"]],
    weepinbell: [[1, "vineWhip"], [1, "growl"], [7, "poisonPowder"], [11, "sleepPowder"], [15, "razorLeaf"], [21, "acid"], [27, "slam"]],
    victreebel: [[1, "vineWhip"], [1, "razorLeaf"], [15, "acid"], [21, "sleepPowder"], [27, "slam"], [35, "sludgeBomb"]],
    tentacruel: [[1, "poisonSting"], [1, "supersonic"], [6, "acid"], [12, "waterPulse"], [18, "sludge"], [30, "surf"], [38, "sludgeBomb"]],
    golem: [[1, "tackle"], [1, "rockThrow"], [11, "magnitude"], [22, "rockSlide"], [25, "earthquake"], [36, "selfDestruct"]],
    rapidash: [[1, "tackle"], [1, "ember"], [9, "fireSpin"], [14, "stomp"], [19, "flameWheel"], [25, "flamethrower"], [40, "fireBlast"]],
    slowbro: [[1, "tackle"], [1, "waterGun"], [9, "confusion"], [14, "headbutt"], [19, "psychic"], [37, "surf"], [43, "amnesia"]],
    muk: [[1, "pound"], [1, "poisonSting"], [10, "sludge"], [16, "acid"], [22, "bodySlam"], [38, "sludgeBomb"]],
    cloyster: [[1, "tackle"], [1, "waterGun"], [15, "icicleCrash"], [22, "clamp"], [30, "iceBeam"], [40, "blizzard"]],
    gengar: [[1, "confuseRay"], [1, "shadowBall"], [12, "sludge"], [19, "dreamEater"], [25, "sludgeBomb"], [33, "psychic"]],
    weezing: [[1, "tackle"], [1, "sludge"], [6, "smokescreen"], [12, "sludgeBomb"], [18, "selfDestruct"], [35, "toxic"]],
    gyarados: [[1, "bite"], [1, "rage"], [20, "dragonRage"], [25, "crunch"], [32, "surf"], [40, "hydroPump"], [48, "hyperBeam"]],
    exeggutor: [[1, "confusion"], [1, "absorb"], [7, "hypnosis"], [13, "razorLeaf"], [19, "psychic"], [27, "petalDance"]],
    starmie: [[1, "waterGun"], [1, "confusion"], [15, "bubbleBeam"], [22, "psychic"], [30, "surf"], [40, "hydroPump"]],
    dragonair: [[1, "tackle"], [1, "dragonRage"], [11, "thunderWave"], [15, "slam"], [21, "dragonBreath"], [30, "dragonClaw"]],
    dragonite: [[1, "dragonRage"], [1, "dragonBreath"], [15, "slam"], [21, "dragonClaw"], [30, "wingAttack"], [47, "outrage"], [55, "hyperBeam"]],
    vulpix: [[1, "ember"], [1, "tailWhip"], [7, "quickAttack"], [12, "fireSpin"], [18, "confuseRay"], [24, "flamethrower"]],
    ninetales: [[1, "ember"], [1, "quickAttack"], [12, "confuseRay"], [18, "flamethrower"], [28, "fireBlast"]],
    meowth: [[1, "scratch"], [1, "growl"], [6, "bite"], [11, "furySwipes"], [17, "slash"], [22, "bodySlam"]],
    persian: [[1, "scratch"], [1, "bite"], [11, "furySwipes"], [17, "slash"], [28, "bodySlam"], [35, "hyperBeam"]],
    horsea: [[1, "bubble"], [1, "leer"], [8, "waterGun"], [15, "bubbleBeam"], [22, "dragonRage"], [29, "dragonBreath"]],
    seadra: [[1, "waterGun"], [1, "bubbleBeam"], [15, "dragonRage"], [22, "dragonBreath"], [32, "surf"], [40, "hydroPump"]],
    goldeen: [[1, "peck"], [1, "tailWhip"], [7, "supersonic"], [11, "hornAttack"], [17, "waterPulse"], [24, "furyAttack"]],
    seaking: [[1, "peck"], [1, "hornAttack"], [11, "waterPulse"], [17, "furyAttack"], [33, "surf"], [40, "megahorn"]],
    krabby: [[1, "bubble"], [1, "leer"], [5, "waterGun"], [11, "stomp"], [17, "slash"], [23, "slam"]],
    kingler: [[1, "waterGun"], [1, "stomp"], [11, "slash"], [17, "slam"], [28, "crunch"], [36, "surf"]],
    staryu: [[1, "tackle"], [1, "harden"], [7, "waterGun"], [13, "swift"], [19, "bubbleBeam"], [25, "psychic"]],
    mrMime: [[1, "confusion"], [1, "barrier"], [8, "lightScreen"], [15, "psybeam"], [22, "reflect"], [29, "psychic"]],
    jynx: [[1, "pound"], [1, "icyWind"], [8, "confusion"], [15, "iceBeam"], [22, "psychic"], [30, "blizzard"]],
    magmar: [[1, "ember"], [1, "leer"], [7, "fireSpin"], [13, "flameWheel"], [19, "firePunch"], [25, "flamethrower"], [33, "fireBlast"]],
    pinsir: [[1, "focusEnergy"], [1, "bind"], [7, "bugBite"], [13, "seismicToss"], [19, "slash"], [25, "submission"], [31, "megahorn"]],
    eevee: [[1, "tackle"], [1, "tailWhip"], [8, "sandAttack"], [15, "quickAttack"], [22, "bite"], [29, "takeDown"]],
    vaporeon: [[1, "tackle"], [1, "waterGun"], [8, "sandAttack"], [15, "bubbleBeam"], [22, "auroraBeam"], [29, "surf"], [36, "hydroPump"]],
    jolteon: [[1, "tackle"], [1, "thunderShock"], [8, "sandAttack"], [15, "thunderWave"], [22, "quickAttack"], [29, "thunderbolt"], [36, "thunderPunch"]],
    flareon: [[1, "tackle"], [1, "ember"], [8, "sandAttack"], [15, "quickAttack"], [22, "fireSpin"], [29, "flamethrower"], [36, "fireBlast"]],
    porygon: [[1, "tackle"], [1, "conversion"], [7, "sonicBoom"], [12, "sharpen"], [18, "psybeam"], [24, "triAttack"]],
    omanyte: [[1, "waterGun"], [1, "leer"], [7, "rollout"], [13, "ancientPower"], [19, "bubbleBeam"], [25, "rockSlide"]],
    omastar: [[1, "waterGun"], [1, "ancientPower"], [13, "bubbleBeam"], [19, "rockSlide"], [25, "surf"], [35, "hydroPump"]],
    kabuto: [[1, "scratch"], [1, "harden"], [7, "absorb"], [13, "ancientPower"], [19, "slash"], [25, "rockSlide"]],
    kabutops: [[1, "scratch"], [1, "slash"], [13, "ancientPower"], [19, "rockSlide"], [25, "surf"], [35, "megahorn"]],
    aerodactyl: [[1, "wingAttack"], [1, "bite"], [8, "ancientPower"], [15, "rockSlide"], [22, "crunch"], [29, "skyAttack"], [36, "hyperBeam"]],
    snorlax: [[1, "tackle"], [1, "rest"], [9, "headbutt"], [17, "bodySlam"], [25, "snore"], [33, "earthquake"], [41, "hyperBeam"]],
    hitmonlee: [[1, "doubleKick"], [1, "focusEnergy"], [6, "lowKick"], [11, "highJumpKick"], [16, "megaKick"], [21, "highJumpKick"]],
    hitmonchan: [[1, "cometPunch"], [1, "focusEnergy"], [7, "firePunch"], [13, "icePunch"], [19, "thunderPunch"], [25, "megaPunch"], [31, "counter"]],
    lickitung: [[1, "leer"], [1, "wrap"], [7, "supersonic"], [13, "stomp"], [19, "disable"], [25, "bodySlam"], [31, "slam"]],
    lapras: [[1, "waterGun"], [1, "growl"], [7, "icyWind"], [13, "bodySlam"], [19, "iceBeam"], [25, "surf"], [31, "blizzard"], [37, "hydroPump"]],
    articuno: [[1, "gust"], [1, "icyWind"], [8, "iceBeam"], [15, "auroraBeam"], [22, "blizzard"], [29, "skyAttack"], [36, "hyperBeam"]],
    zapdos: [[1, "peck"], [1, "thunderShock"], [8, "thunderWave"], [15, "thunderbolt"], [22, "drillPeck"], [29, "skyAttack"], [36, "hyperBeam"]],
    moltres: [[1, "wingAttack"], [1, "ember"], [8, "fireSpin"], [15, "flamethrower"], [22, "fireBlast"], [29, "skyAttack"], [36, "hyperBeam"]],
    mewtwo: [[1, "confusion"], [1, "disable"], [8, "barrier"], [15, "psybeam"], [22, "psychic"], [29, "amnesia"], [36, "hyperBeam"]],
    mew: [[1, "pound"], [1, "confusion"], [10, "psychic"], [20, "ancientPower"], [30, "amnesia"], [40, "hyperBeam"]]
};

function calculateRequiredExperience(currentLevel, growthRate) {
    if (currentLevel <= 1)
        return 0;
    const d = currentLevel;
    let value;
    
    switch(growthRate){
        case "fast":
            value = (4 * d * d * d) / 5;
            break;
            case "mediumFast":
                value = d * d * d;
            break;
            case "slow":
            value = (5 * d * d * d) / 4;
            break;
            case "mediumSlow":
            default:
                value = 6 / 5 * d * d * d - 15 * d * d + 100 * d - 140;
                
    }
    return Math.floor(value)
}

function Dh(s, u) {
    return Math.floor(s.baseExpYield * u / 7)
}
function df(s, u, d, o) {
    const y = [];
    let f = d;
    for (; f < 100; ) {
        const g = calculateRequiredExperience(f + 1, u);
        if (o >= g) {
            f++;
            const h = (moveLearnsets[s] || []).filter( ([p]) => p === f).map( ([,p]) => p);
            y.push({
                newLevel: f,
                newMoves: h
            })
        } else
            break
    }
    return y
}
function jh(s) {
    const u = [s];
    let d = s;
    for (; preEvolutionMap[d]; )
        u.unshift(preEvolutionMap[d]),
        d = preEvolutionMap[d];
    return u
}
function Mh(s, u) {
    const d = jh(s)
      , o = new Set
      , y = [];
    for (const f of d) {
        const g = moveLearnsets[f] || [];
        for (const [x,h] of g)
            x <= u && !o.has(h) && (o.add(h),
            y.push({
                moveId: h,
                learnLevel: x,
                fromSpecies: f
            }))
    }
    return y
}
function resolvePokemonMoves(s, u) {
    return (moveLearnsets[s] || []).filter( ([y]) => y <= u).map( ([,y]) => y).slice(-4)
}
const mapData = {
    indigoPlat: {
        id: "indigoPlat",
        name: "Indigo Plateau",
        type: "town",
        description: "Home of the Pokemon League.",
        connections: ["victoryRoad"],
        unlock: {
            battlesAtLocation: [{
                locationId: "victoryRoad",
                count: 30
            }, {
                locationId: "cinnabarIsland",
                count: 15
            }],
            badgesRequired: 8
        },
        unlockOrder: 44,
        position: {
            x: 12,
            y: 8
        }
    },
    victoryRoad: {
        id: "victoryRoad",
        name: "Victory Road",
        type: "route",
        description: "The final challenge before the Elite Four.",
        routeKey: "victoryRoad",
        connections: ["route23", "indigoPlat"],
        unlock: {
            battlesAtLocation: [{
                locationId: "route23",
                count: 28
            }, {
                locationId: "cinnabarIsland",
                count: 14
            }],
            badgesRequired: 8
        },
        unlockOrder: 43,
        position: {
            x: 12,
            y: 16
        }
    },
    route23: {
        id: "route23",
        name: "Route 23",
        type: "route",
        description: "Victory Road approach — badge checkpoints.",
        routeKey: "route23",
        connections: ["route22", "victoryRoad"],
        unlock: {
            battlesAtLocation: [{
                locationId: "route22",
                count: 25
            }, {
                locationId: "fuchsiaCity",
                count: 13
            }],
            badgesRequired: 6
        },
        unlockOrder: 36,
        position: {
            x: 12,
            y: 28
        }
    },
    route22: {
        id: "route22",
        name: "Route 22",
        type: "route",
        description: "The road to the Pokemon League.",
        routeKey: "route22",
        connections: ["viridianCity", "route23"],
        unlock: {
            battlesAtLocation: [{
                locationId: "safariZone",
                count: 22
            }, {
                locationId: "fuchsiaCity",
                count: 11
            }],
            badgesRequired: 5
        },
        unlockOrder: 35,
        position: {
            x: 12,
            y: 40
        }
    },
    pewterCity: {
        id: "pewterCity",
        name: "Pewter City",
        type: "town",
        description: "A city known for its museum and gym.",
        connections: ["viridianForest", "route3"],
        unlock: {
            battlesAtLocation: [{
                locationId: "viridianForest",
                count: 10
            }, {
                locationId: "viridianCity",
                count: 5
            }]
        },
        unlockOrder: 4,
        position: {
            x: 22,
            y: 14
        }
    },
    viridianForest: {
        id: "viridianForest",
        name: "Viridian Forest",
        type: "route",
        description: "A dense forest full of bug Pokemon.",
        routeKey: "viridianForest",
        connections: ["route2", "pewterCity"],
        unlock: {
            battlesAtLocation: [{
                locationId: "route2",
                count: 8
            }, {
                locationId: "viridianCity",
                count: 4
            }]
        },
        unlockOrder: 3,
        position: {
            x: 22,
            y: 22
        }
    },
    route2: {
        id: "route2",
        name: "Route 2",
        type: "route",
        description: "A winding path leading to the forest.",
        routeKey: "route2",
        connections: ["viridianCity", "viridianForest", "diglettsCave"],
        unlock: {
            battlesAtLocation: [{
                locationId: "route1",
                count: 5
            }, {
                locationId: "viridianCity",
                count: 3
            }]
        },
        unlockOrder: 2,
        position: {
            x: 22,
            y: 30
        }
    },
    viridianCity: {
        id: "viridianCity",
        name: "Viridian City",
        type: "town",
        description: "A city with a Pokemon Gym.",
        connections: ["route1", "route2", "route22"],
        unlock: {
            battlesAtLocation: [{
                locationId: "route1",
                count: 3
            }]
        },
        unlockOrder: 1,
        position: {
            x: 22,
            y: 40
        }
    },
    route1: {
        id: "route1",
        name: "Route 1",
        type: "route",
        description: "A short path through tall grass.",
        routeKey: "route1",
        connections: ["palletTown", "viridianCity"],
        unlock: {},
        unlockOrder: 0,
        position: {
            x: 22,
            y: 52
        }
    },
    palletTown: {
        id: "palletTown",
        name: "Pallet Town",
        type: "town",
        description: "A quiet town where your journey begins.",
        connections: ["route1", "route21"],
        unlock: {},
        unlockOrder: 0,
        position: {
            x: 22,
            y: 64
        }
    },
    route21: {
        id: "route21",
        name: "Route 21",
        type: "route",
        description: "A sea route back to Pallet Town.",
        routeKey: "route21",
        connections: ["cinnabarIsland", "palletTown"],
        unlock: {
            battlesAtLocation: [{
                locationId: "pokemonMansion",
                count: 25
            }, {
                locationId: "cinnabarIsland",
                count: 13
            }],
            badgesRequired: 7
        },
        unlockOrder: 42,
        position: {
            x: 22,
            y: 76
        }
    },
    cinnabarIsland: {
        id: "cinnabarIsland",
        name: "Cinnabar Island",
        type: "town",
        description: "A volcanic island with a research lab.",
        connections: ["seafoamIslands", "pokemonMansion", "route21"],
        unlock: {
            battlesAtLocation: [{
                locationId: "seafoamIslands",
                count: 22
            }, {
                locationId: "fuchsiaCity",
                count: 11
            }],
            badgesRequired: 6
        },
        unlockOrder: 40,
        position: {
            x: 22,
            y: 88
        }
    },
    route3: {
        id: "route3",
        name: "Route 3",
        type: "route",
        description: "A rugged path through the mountains.",
        routeKey: "route3",
        connections: ["pewterCity", "mtMoon"],
        unlock: {
            battlesAtLocation: [{
                locationId: "viridianForest",
                count: 10
            }, {
                locationId: "pewterCity",
                count: 5
            }],
            badgesRequired: 1
        },
        unlockOrder: 5,
        position: {
            x: 30,
            y: 14
        }
    },
    mtMoon: {
        id: "mtMoon",
        name: "Mt. Moon",
        type: "route",
        description: "A cavern filled with rare fossils.",
        routeKey: "mtMoon",
        connections: ["route3", "route4"],
        unlock: {
            battlesAtLocation: [{
                locationId: "route3",
                count: 10
            }, {
                locationId: "pewterCity",
                count: 5
            }],
            badgesRequired: 1
        },
        unlockOrder: 6,
        position: {
            x: 38,
            y: 14
        }
    },
    route4: {
        id: "route4",
        name: "Route 4",
        type: "route",
        description: "A mountain trail leading to Cerulean.",
        routeKey: "route4",
        connections: ["mtMoon", "ceruleanCity"],
        unlock: {
            battlesAtLocation: [{
                locationId: "mtMoon",
                count: 10
            }, {
                locationId: "pewterCity",
                count: 5
            }],
            badgesRequired: 1
        },
        unlockOrder: 7,
        position: {
            x: 46,
            y: 14
        }
    },
    ceruleanCity: {
        id: "ceruleanCity",
        name: "Cerulean City",
        type: "town",
        description: "A beautiful city with flowing water.",
        connections: ["route4", "route24", "route5", "route9"],
        unlock: {
            battlesAtLocation: [{
                locationId: "route4",
                count: 10
            }, {
                locationId: "pewterCity",
                count: 5
            }],
            badgesRequired: 1
        },
        unlockOrder: 8,
        position: {
            x: 54,
            y: 14
        }
    },
    route9: {
        id: "route9",
        name: "Route 9",
        type: "route",
        description: "A rocky trail heading east.",
        routeKey: "route9",
        connections: ["ceruleanCity", "rockTunnel"],
        unlock: {
            battlesAtLocation: [{
                locationId: "route5",
                count: 12
            }, {
                locationId: "ceruleanCity",
                count: 6
            }],
            badgesRequired: 2
        },
        unlockOrder: 12,
        position: {
            x: 64,
            y: 14
        }
    },
    rockTunnel: {
        id: "rockTunnel",
        name: "Rock Tunnel",
        type: "route",
        description: "A pitch-black cave you must navigate carefully.",
        routeKey: "rockTunnel",
        connections: ["route9", "route10"],
        unlock: {
            battlesAtLocation: [{
                locationId: "route9",
                count: 12
            }, {
                locationId: "ceruleanCity",
                count: 6
            }],
            badgesRequired: 2
        },
        unlockOrder: 13,
        position: {
            x: 74,
            y: 14
        }
    },
    route24: {
        id: "route24",
        name: "Route 24",
        type: "route",
        description: "Nugget Bridge stretches to the north.",
        routeKey: "route24",
        connections: ["ceruleanCity", "route25"],
        unlock: {
            battlesAtLocation: [{
                locationId: "route4",
                count: 12
            }, {
                locationId: "ceruleanCity",
                count: 5
            }],
            badgesRequired: 2
        },
        unlockOrder: 9,
        position: {
            x: 54,
            y: 8
        }
    },
    route25: {
        id: "route25",
        name: "Route 25",
        type: "route",
        description: "A cape where a famous collector lives.",
        routeKey: "route25",
        connections: ["route24"],
        unlock: {
            battlesAtLocation: [{
                locationId: "route24",
                count: 10
            }, {
                locationId: "ceruleanCity",
                count: 5
            }],
            badgesRequired: 2
        },
        unlockOrder: 10,
        position: {
            x: 64,
            y: 8
        }
    },
    ceruleanCave: {
        id: "ceruleanCave",
        name: "Cerulean Cave",
        type: "route",
        description: "A mysterious cave with immensely powerful Pokemon.",
        routeKey: "ceruleanCave",
        connections: ["ceruleanCity"],
        unlock: {
            battlesAtLocation: [{
                locationId: "victoryRoad",
                count: 30
            }, {
                locationId: "indigoPlat",
                count: 15
            }],
            badgesRequired: 8,
            championDefeated: !0
        },
        unlockOrder: 45,
        position: {
            x: 46,
            y: 8
        }
    },
    route10: {
        id: "route10",
        name: "Route 10",
        type: "route",
        description: "A path near the Power Plant.",
        routeKey: "route10",
        connections: ["rockTunnel", "lavenderTown", "powerPlant"],
        unlock: {
            battlesAtLocation: [{
                locationId: "rockTunnel",
                count: 12
            }, {
                locationId: "ceruleanCity",
                count: 6
            }],
            badgesRequired: 2
        },
        unlockOrder: 14,
        position: {
            x: 74,
            y: 27
        }
    },
    powerPlant: {
        id: "powerPlant",
        name: "Power Plant",
        type: "route",
        description: "An abandoned plant crackling with electricity.",
        routeKey: "powerPlant",
        connections: ["route10"],
        unlock: {
            battlesAtLocation: [{
                locationId: "route10",
                count: 12
            }, {
                locationId: "ceruleanCity",
                count: 6
            }],
            badgesRequired: 2
        },
        unlockOrder: 15,
        position: {
            x: 84,
            y: 27
        }
    },
    route5: {
        id: "route5",
        name: "Route 5",
        type: "route",
        description: "A path south from Cerulean to Saffron.",
        routeKey: "route5",
        connections: ["ceruleanCity", "saffronCity"],
        unlock: {
            battlesAtLocation: [{
                locationId: "route4",
                count: 10
            }, {
                locationId: "ceruleanCity",
                count: 5
            }],
            badgesRequired: 2
        },
        unlockOrder: 11,
        position: {
            x: 54,
            y: 27
        }
    },
    saffronCity: {
        id: "saffronCity",
        name: "Saffron City",
        type: "town",
        description: "The largest city in Kanto, home to Silph Co.",
        connections: ["route5", "route6", "route7", "route8"],
        unlock: {
            battlesAtLocation: [{
                locationId: "route5",
                count: 15
            }, {
                locationId: "ceruleanCity",
                count: 8
            }],
            badgesRequired: 2
        },
        unlockOrder: 16,
        position: {
            x: 54,
            y: 40
        }
    },
    route6: {
        id: "route6",
        name: "Route 6",
        type: "route",
        description: "A path leading south to the harbor city.",
        routeKey: "route6",
        connections: ["saffronCity", "vermilionCity"],
        unlock: {
            battlesAtLocation: [{
                locationId: "route5",
                count: 15
            }, {
                locationId: "saffronCity",
                count: 5
            }],
            badgesRequired: 2
        },
        unlockOrder: 17,
        position: {
            x: 54,
            y: 50
        }
    },
    vermilionCity: {
        id: "vermilionCity",
        name: "Vermilion City",
        type: "town",
        description: "A bustling port city with electric gym.",
        connections: ["route6", "route11"],
        unlock: {
            battlesAtLocation: [{
                locationId: "route6",
                count: 15
            }, {
                locationId: "saffronCity",
                count: 8
            }],
            badgesRequired: 2
        },
        unlockOrder: 18,
        position: {
            x: 54,
            y: 58
        }
    },
    route7: {
        id: "route7",
        name: "Route 7",
        type: "route",
        description: "A short road to Celadon City.",
        routeKey: "route7",
        connections: ["saffronCity", "celadonCity"],
        unlock: {
            battlesAtLocation: [{
                locationId: "route5",
                count: 15
            }, {
                locationId: "saffronCity",
                count: 5
            }],
            badgesRequired: 3
        },
        unlockOrder: 19,
        position: {
            x: 46,
            y: 40
        }
    },
    celadonCity: {
        id: "celadonCity",
        name: "Celadon City",
        type: "town",
        description: "A city of rainbow dreams and a large dept store.",
        connections: ["route7", "route16"],
        unlock: {
            battlesAtLocation: [{
                locationId: "route7",
                count: 12
            }, {
                locationId: "saffronCity",
                count: 6
            }],
            badgesRequired: 3
        },
        unlockOrder: 20,
        position: {
            x: 38,
            y: 40
        }
    },
    route8: {
        id: "route8",
        name: "Route 8",
        type: "route",
        description: "A path connecting Saffron and Lavender.",
        routeKey: "route8",
        connections: ["saffronCity", "lavenderTown"],
        unlock: {
            battlesAtLocation: [{
                locationId: "route6",
                count: 15
            }, {
                locationId: "vermilionCity",
                count: 5
            }],
            badgesRequired: 4
        },
        unlockOrder: 21,
        position: {
            x: 64,
            y: 40
        }
    },
    lavenderTown: {
        id: "lavenderTown",
        name: "Lavender Town",
        type: "town",
        description: "A small town known for Pokemon Tower.",
        connections: ["route8", "route10", "pokemonTower", "route12"],
        unlock: {
            battlesAtLocation: [{
                locationId: "route8",
                count: 15
            }, {
                locationId: "vermilionCity",
                count: 8
            }],
            badgesRequired: 4
        },
        unlockOrder: 22,
        position: {
            x: 74,
            y: 40
        }
    },
    pokemonTower: {
        id: "pokemonTower",
        name: "Pokemon Tower",
        type: "route",
        description: "A memorial tower haunted by ghosts.",
        routeKey: "pokemonTower",
        connections: ["lavenderTown"],
        unlock: {
            battlesAtLocation: [{
                locationId: "route8",
                count: 15
            }, {
                locationId: "lavenderTown",
                count: 5
            }],
            badgesRequired: 4
        },
        unlockOrder: 23,
        position: {
            x: 82,
            y: 40
        }
    },
    route11: {
        id: "route11",
        name: "Route 11",
        type: "route",
        description: "A road east of Vermilion City.",
        routeKey: "route11",
        connections: ["vermilionCity", "diglettsCave", "route12"],
        unlock: {
            battlesAtLocation: [{
                locationId: "pokemonTower",
                count: 15
            }, {
                locationId: "lavenderTown",
                count: 8
            }],
            badgesRequired: 4
        },
        unlockOrder: 24,
        position: {
            x: 64,
            y: 58
        }
    },
    diglettsCave: {
        id: "diglettsCave",
        name: "Diglett's Cave",
        type: "route",
        description: "A tunnel dug by Diglett connecting two routes.",
        routeKey: "diglettsCave",
        connections: ["route2", "route11"],
        unlock: {
            battlesAtLocation: [{
                locationId: "route11",
                count: 15
            }, {
                locationId: "lavenderTown",
                count: 8
            }],
            badgesRequired: 4
        },
        unlockOrder: 25,
        position: {
            x: 44,
            y: 46
        }
    },
    route16: {
        id: "route16",
        name: "Route 16",
        type: "route",
        description: "The start of Cycling Road heading south.",
        routeKey: "route16",
        connections: ["celadonCity", "route17"],
        unlock: {
            battlesAtLocation: [{
                locationId: "diglettsCave",
                count: 15
            }, {
                locationId: "celadonCity",
                count: 8
            }],
            badgesRequired: 4
        },
        unlockOrder: 26,
        position: {
            x: 38,
            y: 48
        }
    },
    route17: {
        id: "route17",
        name: "Route 17",
        type: "route",
        description: "Cycling Road — a long downhill path.",
        routeKey: "route17",
        connections: ["route16", "route18"],
        unlock: {
            battlesAtLocation: [{
                locationId: "route16",
                count: 15
            }, {
                locationId: "celadonCity",
                count: 8
            }],
            badgesRequired: 4
        },
        unlockOrder: 27,
        position: {
            x: 38,
            y: 60
        }
    },
    route18: {
        id: "route18",
        name: "Route 18",
        type: "route",
        description: "The end of Cycling Road near Fuchsia.",
        routeKey: "route18",
        connections: ["route17", "fuchsiaCity"],
        unlock: {
            battlesAtLocation: [{
                locationId: "route17",
                count: 18
            }, {
                locationId: "celadonCity",
                count: 9
            }],
            badgesRequired: 4
        },
        unlockOrder: 28,
        position: {
            x: 38,
            y: 72
        }
    },
    route12: {
        id: "route12",
        name: "Route 12",
        type: "route",
        description: "Silence Bridge — a long fishing route.",
        routeKey: "route12",
        connections: ["lavenderTown", "route11", "route13"],
        unlock: {
            battlesAtLocation: [{
                locationId: "route18",
                count: 18
            }, {
                locationId: "lavenderTown",
                count: 9
            }],
            badgesRequired: 4
        },
        unlockOrder: 29,
        position: {
            x: 74,
            y: 50
        }
    },
    route13: {
        id: "route13",
        name: "Route 13",
        type: "route",
        description: "A maze-like path heading west.",
        routeKey: "route13",
        connections: ["route12", "route14"],
        unlock: {
            battlesAtLocation: [{
                locationId: "route12",
                count: 18
            }, {
                locationId: "lavenderTown",
                count: 9
            }],
            badgesRequired: 4
        },
        unlockOrder: 30,
        position: {
            x: 74,
            y: 60
        }
    },
    route14: {
        id: "route14",
        name: "Route 14",
        type: "route",
        description: "A path through tall grass heading south.",
        routeKey: "route14",
        connections: ["route13", "route15"],
        unlock: {
            battlesAtLocation: [{
                locationId: "route13",
                count: 18
            }, {
                locationId: "lavenderTown",
                count: 9
            }],
            badgesRequired: 4
        },
        unlockOrder: 31,
        position: {
            x: 74,
            y: 72
        }
    },
    route15: {
        id: "route15",
        name: "Route 15",
        type: "route",
        description: "The final stretch to Fuchsia City.",
        routeKey: "route15",
        connections: ["route14", "fuchsiaCity"],
        unlock: {
            battlesAtLocation: [{
                locationId: "route14",
                count: 18
            }, {
                locationId: "lavenderTown",
                count: 9
            }],
            badgesRequired: 4
        },
        unlockOrder: 32,
        position: {
            x: 54,
            y: 72
        }
    },
    fuchsiaCity: {
        id: "fuchsiaCity",
        name: "Fuchsia City",
        type: "town",
        description: "Home to the Safari Zone and a ninja gym.",
        connections: ["route15", "route18", "safariZone", "route19"],
        unlock: {
            battlesAtLocation: [{
                locationId: "route15",
                count: 20
            }, {
                locationId: "lavenderTown",
                count: 10
            }],
            badgesRequired: 4
        },
        unlockOrder: 33,
        position: {
            x: 46,
            y: 72
        }
    },
    safariZone: {
        id: "safariZone",
        name: "Safari Zone",
        type: "route",
        description: "A nature reserve with rare Pokemon.",
        routeKey: "safariZone",
        connections: ["fuchsiaCity"],
        unlock: {
            battlesAtLocation: [{
                locationId: "route15",
                count: 20
            }, {
                locationId: "fuchsiaCity",
                count: 5
            }],
            badgesRequired: 5
        },
        unlockOrder: 34,
        position: {
            x: 46,
            y: 66
        }
    },
    route19: {
        id: "route19",
        name: "Route 19",
        type: "route",
        description: "Ocean waves south of Fuchsia City.",
        routeKey: "route19",
        connections: ["fuchsiaCity", "route20"],
        unlock: {
            battlesAtLocation: [{
                locationId: "route23",
                count: 20
            }, {
                locationId: "fuchsiaCity",
                count: 10
            }],
            badgesRequired: 6
        },
        unlockOrder: 37,
        position: {
            x: 46,
            y: 80
        }
    },
    route20: {
        id: "route20",
        name: "Route 20",
        type: "route",
        description: "A sea route leading to the Seafoam Islands.",
        routeKey: "route20",
        connections: ["route19", "seafoamIslands"],
        unlock: {
            battlesAtLocation: [{
                locationId: "route19",
                count: 22
            }, {
                locationId: "fuchsiaCity",
                count: 11
            }],
            badgesRequired: 6
        },
        unlockOrder: 38,
        position: {
            x: 40,
            y: 88
        }
    },
    seafoamIslands: {
        id: "seafoamIslands",
        name: "Seafoam Islands",
        type: "route",
        description: "Icy caves home to legendary birds.",
        routeKey: "seafoamIslands",
        connections: ["route20", "cinnabarIsland"],
        unlock: {
            battlesAtLocation: [{
                locationId: "route20",
                count: 22
            }, {
                locationId: "fuchsiaCity",
                count: 11
            }],
            badgesRequired: 6
        },
        unlockOrder: 39,
        position: {
            x: 28,
            y: 88
        }
    },
    pokemonMansion: {
        id: "pokemonMansion",
        name: "Pokemon Mansion",
        type: "route",
        description: "A burned-out mansion hiding dark secrets.",
        routeKey: "pokemonMansion",
        connections: ["cinnabarIsland"],
        unlock: {
            battlesAtLocation: [{
                locationId: "seafoamIslands",
                count: 22
            }, {
                locationId: "cinnabarIsland",
                count: 5
            }],
            badgesRequired: 7
        },
        unlockOrder: 41,
        position: {
            x: 16,
            y: 84
        }
    },
    raidIsland: {
        id: "raidIsland",
        name: "Raid Island",
        type: "raid",
        description: "A mysterious floating island where legendary Pokemon dwell.",
        connections: [],
        unlock: {
            championDefeated: !0
        },
        unlockOrder: 99,
        position: {
            x: 90,
            y: 14
        }
    }
}
  , mapEncounterData = {
    route1: {
        name: "Route 1",
        encounters: [{
            speciesKey: "pidgey",
            weight: 30,
            minLevel: 2,
            maxLevel: 5
        }, {
            speciesKey: "rattata",
            weight: 30,
            minLevel: 2,
            maxLevel: 5
        }, {
            speciesKey: "caterpie",
            weight: 15,
            minLevel: 2,
            maxLevel: 4
        }, {
            speciesKey: "weedle",
            weight: 15,
            minLevel: 2,
            maxLevel: 4
        }, {
            speciesKey: "pikachu",
            weight: 5,
            minLevel: 3,
            maxLevel: 5
        }]
    },
    route2: {
        name: "Route 2",
        encounters: [{
            speciesKey: "pidgey",
            weight: 20,
            minLevel: 3,
            maxLevel: 6
        }, {
            speciesKey: "rattata",
            weight: 20,
            minLevel: 3,
            maxLevel: 6
        }, {
            speciesKey: "caterpie",
            weight: 15,
            minLevel: 3,
            maxLevel: 5
        }, {
            speciesKey: "weedle",
            weight: 15,
            minLevel: 3,
            maxLevel: 5
        }, {
            speciesKey: "nidoranM",
            weight: 15,
            minLevel: 4,
            maxLevel: 6
        }, {
            speciesKey: "nidoranF",
            weight: 15,
            minLevel: 4,
            maxLevel: 6
        }]
    },
    viridianForest: {
        name: "Viridian Forest",
        encounters: [{
            speciesKey: "caterpie",
            weight: 25,
            minLevel: 4,
            maxLevel: 7
        }, {
            speciesKey: "metapod",
            weight: 10,
            minLevel: 5,
            maxLevel: 7
        }, {
            speciesKey: "weedle",
            weight: 25,
            minLevel: 4,
            maxLevel: 7
        }, {
            speciesKey: "kakuna",
            weight: 10,
            minLevel: 5,
            maxLevel: 7
        }, {
            speciesKey: "pikachu",
            weight: 5,
            minLevel: 4,
            maxLevel: 7
        }, {
            speciesKey: "pidgey",
            weight: 25,
            minLevel: 4,
            maxLevel: 7
        }]
    },
    route3: {
        name: "Route 3",
        encounters: [{
            speciesKey: "spearow",
            weight: 25,
            minLevel: 6,
            maxLevel: 9
        }, {
            speciesKey: "nidoranM",
            weight: 15,
            minLevel: 6,
            maxLevel: 9
        }, {
            speciesKey: "nidoranF",
            weight: 15,
            minLevel: 6,
            maxLevel: 9
        }, {
            speciesKey: "jigglypuff",
            weight: 15,
            minLevel: 6,
            maxLevel: 9
        }, {
            speciesKey: "zubat",
            weight: 15,
            minLevel: 6,
            maxLevel: 9
        }, {
            speciesKey: "pidgey",
            weight: 15,
            minLevel: 6,
            maxLevel: 9
        }]
    },
    mtMoon: {
        name: "Mt. Moon",
        encounters: [{
            speciesKey: "zubat",
            weight: 40,
            minLevel: 7,
            maxLevel: 11
        }, {
            speciesKey: "geodude",
            weight: 25,
            minLevel: 7,
            maxLevel: 10
        }, {
            speciesKey: "paras",
            weight: 20,
            minLevel: 8,
            maxLevel: 12
        }, {
            speciesKey: "clefairy",
            weight: 15,
            minLevel: 8,
            maxLevel: 12
        }]
    },
    route4: {
        name: "Route 4",
        encounters: [{
            speciesKey: "rattata",
            weight: 25,
            minLevel: 8,
            maxLevel: 12
        }, {
            speciesKey: "spearow",
            weight: 25,
            minLevel: 8,
            maxLevel: 12
        }, {
            speciesKey: "ekans",
            weight: 20,
            minLevel: 8,
            maxLevel: 12
        }, {
            speciesKey: "mankey",
            weight: 15,
            minLevel: 8,
            maxLevel: 12
        }, {
            speciesKey: "sandshrew",
            weight: 15,
            minLevel: 8,
            maxLevel: 12
        }]
    },
    route24: {
        name: "Route 24",
        encounters: [{
            speciesKey: "oddish",
            weight: 25,
            minLevel: 12,
            maxLevel: 14
        }, {
            speciesKey: "pidgey",
            weight: 20,
            minLevel: 12,
            maxLevel: 14
        }, {
            speciesKey: "abra",
            weight: 15,
            minLevel: 12,
            maxLevel: 14
        }, {
            speciesKey: "caterpie",
            weight: 15,
            minLevel: 12,
            maxLevel: 14
        }, {
            speciesKey: "bellsprout",
            weight: 15,
            minLevel: 12,
            maxLevel: 14
        }, {
            speciesKey: "weedle",
            weight: 10,
            minLevel: 12,
            maxLevel: 14
        }]
    },
    route25: {
        name: "Route 25",
        encounters: [{
            speciesKey: "oddish",
            weight: 25,
            minLevel: 12,
            maxLevel: 14
        }, {
            speciesKey: "pidgey",
            weight: 20,
            minLevel: 12,
            maxLevel: 14
        }, {
            speciesKey: "abra",
            weight: 15,
            minLevel: 12,
            maxLevel: 14
        }, {
            speciesKey: "bellsprout",
            weight: 15,
            minLevel: 12,
            maxLevel: 14
        }, {
            speciesKey: "caterpie",
            weight: 15,
            minLevel: 12,
            maxLevel: 14
        }, {
            speciesKey: "weedle",
            weight: 10,
            minLevel: 12,
            maxLevel: 14
        }]
    },
    route5: {
        name: "Route 5",
        encounters: [{
            speciesKey: "oddish",
            weight: 20,
            minLevel: 13,
            maxLevel: 16
        }, {
            speciesKey: "pidgey",
            weight: 20,
            minLevel: 13,
            maxLevel: 16
        }, {
            speciesKey: "mankey",
            weight: 15,
            minLevel: 13,
            maxLevel: 16
        }, {
            speciesKey: "bellsprout",
            weight: 15,
            minLevel: 13,
            maxLevel: 16
        }, {
            speciesKey: "abra",
            weight: 10,
            minLevel: 13,
            maxLevel: 16
        }, {
            speciesKey: "meowth",
            weight: 15,
            minLevel: 13,
            maxLevel: 16
        }, {
            speciesKey: "vulpix",
            weight: 5,
            minLevel: 13,
            maxLevel: 16
        }]
    },
    route6: {
        name: "Route 6",
        encounters: [{
            speciesKey: "oddish",
            weight: 25,
            minLevel: 13,
            maxLevel: 16
        }, {
            speciesKey: "pidgey",
            weight: 20,
            minLevel: 13,
            maxLevel: 16
        }, {
            speciesKey: "mankey",
            weight: 15,
            minLevel: 13,
            maxLevel: 16
        }, {
            speciesKey: "bellsprout",
            weight: 15,
            minLevel: 13,
            maxLevel: 16
        }, {
            speciesKey: "abra",
            weight: 10,
            minLevel: 13,
            maxLevel: 16
        }, {
            speciesKey: "meowth",
            weight: 15,
            minLevel: 13,
            maxLevel: 16
        }]
    },
    route9: {
        name: "Route 9",
        encounters: [{
            speciesKey: "rattata",
            weight: 20,
            minLevel: 14,
            maxLevel: 17
        }, {
            speciesKey: "spearow",
            weight: 25,
            minLevel: 14,
            maxLevel: 17
        }, {
            speciesKey: "ekans",
            weight: 20,
            minLevel: 14,
            maxLevel: 17
        }, {
            speciesKey: "nidoranM",
            weight: 15,
            minLevel: 14,
            maxLevel: 17
        }, {
            speciesKey: "nidoranF",
            weight: 15,
            minLevel: 14,
            maxLevel: 17
        }, {
            speciesKey: "oddish",
            weight: 5,
            minLevel: 14,
            maxLevel: 17
        }]
    },
    route10: {
        name: "Route 10",
        encounters: [{
            speciesKey: "spearow",
            weight: 25,
            minLevel: 14,
            maxLevel: 17
        }, {
            speciesKey: "ekans",
            weight: 20,
            minLevel: 14,
            maxLevel: 17
        }, {
            speciesKey: "voltorb",
            weight: 20,
            minLevel: 14,
            maxLevel: 17
        }, {
            speciesKey: "nidoranM",
            weight: 15,
            minLevel: 14,
            maxLevel: 17
        }, {
            speciesKey: "nidoranF",
            weight: 15,
            minLevel: 14,
            maxLevel: 17
        }, {
            speciesKey: "magnemite",
            weight: 5,
            minLevel: 14,
            maxLevel: 17
        }]
    },
    rockTunnel: {
        name: "Rock Tunnel",
        encounters: [{
            speciesKey: "zubat",
            weight: 25,
            minLevel: 15,
            maxLevel: 18
        }, {
            speciesKey: "geodude",
            weight: 20,
            minLevel: 15,
            maxLevel: 18
        }, {
            speciesKey: "machop",
            weight: 20,
            minLevel: 15,
            maxLevel: 18
        }, {
            speciesKey: "onix",
            weight: 15,
            minLevel: 15,
            maxLevel: 18
        }, {
            speciesKey: "omanyte",
            weight: 5,
            minLevel: 15,
            maxLevel: 18
        }, {
            speciesKey: "kabuto",
            weight: 5,
            minLevel: 15,
            maxLevel: 18
        }, {
            speciesKey: "aerodactyl",
            weight: 3,
            minLevel: 18,
            maxLevel: 22
        }, {
            speciesKey: "hitmonlee",
            weight: 3,
            minLevel: 18,
            maxLevel: 22
        }, {
            speciesKey: "hitmonchan",
            weight: 4,
            minLevel: 18,
            maxLevel: 22
        }]
    },
    pokemonTower: {
        name: "Pokemon Tower",
        encounters: [{
            speciesKey: "gastly",
            weight: 40,
            minLevel: 20,
            maxLevel: 25
        }, {
            speciesKey: "haunter",
            weight: 15,
            minLevel: 23,
            maxLevel: 25
        }, {
            speciesKey: "cubone",
            weight: 30,
            minLevel: 20,
            maxLevel: 24
        }, {
            speciesKey: "mrMime",
            weight: 5,
            minLevel: 22,
            maxLevel: 26
        }, {
            speciesKey: "jynx",
            weight: 5,
            minLevel: 24,
            maxLevel: 28
        }, {
            speciesKey: "porygon",
            weight: 5,
            minLevel: 24,
            maxLevel: 28
        }]
    },
    route7: {
        name: "Route 7",
        encounters: [{
            speciesKey: "pidgey",
            weight: 20,
            minLevel: 18,
            maxLevel: 22
        }, {
            speciesKey: "oddish",
            weight: 20,
            minLevel: 18,
            maxLevel: 22
        }, {
            speciesKey: "mankey",
            weight: 15,
            minLevel: 18,
            maxLevel: 22
        }, {
            speciesKey: "growlithe",
            weight: 15,
            minLevel: 18,
            maxLevel: 22
        }, {
            speciesKey: "bellsprout",
            weight: 10,
            minLevel: 18,
            maxLevel: 22
        }, {
            speciesKey: "meowth",
            weight: 10,
            minLevel: 18,
            maxLevel: 22
        }, {
            speciesKey: "vulpix",
            weight: 10,
            minLevel: 18,
            maxLevel: 22
        }]
    },
    route8: {
        name: "Route 8",
        encounters: [{
            speciesKey: "pidgey",
            weight: 15,
            minLevel: 18,
            maxLevel: 22
        }, {
            speciesKey: "ekans",
            weight: 15,
            minLevel: 18,
            maxLevel: 22
        }, {
            speciesKey: "growlithe",
            weight: 15,
            minLevel: 18,
            maxLevel: 22
        }, {
            speciesKey: "mankey",
            weight: 15,
            minLevel: 18,
            maxLevel: 22
        }, {
            speciesKey: "oddish",
            weight: 15,
            minLevel: 18,
            maxLevel: 22
        }, {
            speciesKey: "meowth",
            weight: 15,
            minLevel: 18,
            maxLevel: 22
        }, {
            speciesKey: "vulpix",
            weight: 10,
            minLevel: 18,
            maxLevel: 22
        }]
    },
    route11: {
        name: "Route 11",
        encounters: [{
            speciesKey: "ekans",
            weight: 25,
            minLevel: 14,
            maxLevel: 17
        }, {
            speciesKey: "drowzee",
            weight: 25,
            minLevel: 14,
            maxLevel: 17
        }, {
            speciesKey: "spearow",
            weight: 20,
            minLevel: 14,
            maxLevel: 17
        }, {
            speciesKey: "rattata",
            weight: 15,
            minLevel: 14,
            maxLevel: 17
        }, {
            speciesKey: "sandshrew",
            weight: 15,
            minLevel: 14,
            maxLevel: 17
        }]
    },
    route12: {
        name: "Route 12",
        encounters: [{
            speciesKey: "oddish",
            weight: 25,
            minLevel: 22,
            maxLevel: 26
        }, {
            speciesKey: "venonat",
            weight: 25,
            minLevel: 22,
            maxLevel: 26
        }, {
            speciesKey: "pidgey",
            weight: 20,
            minLevel: 22,
            maxLevel: 26
        }, {
            speciesKey: "bellsprout",
            weight: 15,
            minLevel: 22,
            maxLevel: 26
        }, {
            speciesKey: "gloom",
            weight: 10,
            minLevel: 24,
            maxLevel: 26
        }, {
            speciesKey: "farfetchd",
            weight: 5,
            minLevel: 24,
            maxLevel: 26
        }]
    },
    route13: {
        name: "Route 13",
        encounters: [{
            speciesKey: "oddish",
            weight: 25,
            minLevel: 22,
            maxLevel: 26
        }, {
            speciesKey: "venonat",
            weight: 25,
            minLevel: 22,
            maxLevel: 26
        }, {
            speciesKey: "pidgey",
            weight: 20,
            minLevel: 22,
            maxLevel: 26
        }, {
            speciesKey: "bellsprout",
            weight: 15,
            minLevel: 22,
            maxLevel: 26
        }, {
            speciesKey: "gloom",
            weight: 10,
            minLevel: 24,
            maxLevel: 26
        }, {
            speciesKey: "ditto",
            weight: 5,
            minLevel: 24,
            maxLevel: 26
        }]
    },
    route14: {
        name: "Route 14",
        encounters: [{
            speciesKey: "oddish",
            weight: 25,
            minLevel: 23,
            maxLevel: 27
        }, {
            speciesKey: "venonat",
            weight: 25,
            minLevel: 23,
            maxLevel: 27
        }, {
            speciesKey: "pidgey",
            weight: 20,
            minLevel: 23,
            maxLevel: 27
        }, {
            speciesKey: "gloom",
            weight: 15,
            minLevel: 25,
            maxLevel: 27
        }, {
            speciesKey: "ditto",
            weight: 10,
            minLevel: 25,
            maxLevel: 27
        }, {
            speciesKey: "bellsprout",
            weight: 5,
            minLevel: 23,
            maxLevel: 27
        }]
    },
    route15: {
        name: "Route 15",
        encounters: [{
            speciesKey: "oddish",
            weight: 25,
            minLevel: 23,
            maxLevel: 27
        }, {
            speciesKey: "venonat",
            weight: 25,
            minLevel: 23,
            maxLevel: 27
        }, {
            speciesKey: "pidgey",
            weight: 20,
            minLevel: 23,
            maxLevel: 27
        }, {
            speciesKey: "gloom",
            weight: 15,
            minLevel: 25,
            maxLevel: 27
        }, {
            speciesKey: "ditto",
            weight: 10,
            minLevel: 25,
            maxLevel: 27
        }, {
            speciesKey: "bellsprout",
            weight: 5,
            minLevel: 23,
            maxLevel: 27
        }]
    },
    route16: {
        name: "Route 16",
        encounters: [{
            speciesKey: "rattata",
            weight: 25,
            minLevel: 18,
            maxLevel: 22
        }, {
            speciesKey: "spearow",
            weight: 25,
            minLevel: 18,
            maxLevel: 22
        }, {
            speciesKey: "doduo",
            weight: 25,
            minLevel: 18,
            maxLevel: 22
        }, {
            speciesKey: "raticate",
            weight: 15,
            minLevel: 20,
            maxLevel: 22
        }, {
            speciesKey: "fearow",
            weight: 10,
            minLevel: 20,
            maxLevel: 22
        }]
    },
    route17: {
        name: "Route 17",
        encounters: [{
            speciesKey: "doduo",
            weight: 25,
            minLevel: 24,
            maxLevel: 28
        }, {
            speciesKey: "rattata",
            weight: 20,
            minLevel: 24,
            maxLevel: 28
        }, {
            speciesKey: "spearow",
            weight: 20,
            minLevel: 24,
            maxLevel: 28
        }, {
            speciesKey: "raticate",
            weight: 15,
            minLevel: 26,
            maxLevel: 28
        }, {
            speciesKey: "fearow",
            weight: 10,
            minLevel: 26,
            maxLevel: 28
        }, {
            speciesKey: "dodrio",
            weight: 10,
            minLevel: 26,
            maxLevel: 28
        }]
    },
    route18: {
        name: "Route 18",
        encounters: [{
            speciesKey: "doduo",
            weight: 25,
            minLevel: 24,
            maxLevel: 28
        }, {
            speciesKey: "rattata",
            weight: 20,
            minLevel: 24,
            maxLevel: 28
        }, {
            speciesKey: "spearow",
            weight: 20,
            minLevel: 24,
            maxLevel: 28
        }, {
            speciesKey: "raticate",
            weight: 15,
            minLevel: 26,
            maxLevel: 28
        }, {
            speciesKey: "fearow",
            weight: 10,
            minLevel: 26,
            maxLevel: 28
        }, {
            speciesKey: "dodrio",
            weight: 10,
            minLevel: 26,
            maxLevel: 28
        }]
    },
    safariZone: {
        name: "Safari Zone",
        encounters: [{
            speciesKey: "nidoranM",
            weight: 30,
            minLevel: 22,
            maxLevel: 28
        }, {
            speciesKey: "nidoranF",
            weight: 30,
            minLevel: 22,
            maxLevel: 28
        }, {
            speciesKey: "paras",
            weight: 24,
            minLevel: 22,
            maxLevel: 28
        }, {
            speciesKey: "venonat",
            weight: 24,
            minLevel: 22,
            maxLevel: 28
        }, {
            speciesKey: "exeggcute",
            weight: 24,
            minLevel: 24,
            maxLevel: 28
        }, {
            speciesKey: "rhyhorn",
            weight: 24,
            minLevel: 25,
            maxLevel: 28
        }, {
            speciesKey: "chansey",
            weight: 12,
            minLevel: 23,
            maxLevel: 28
        }, {
            speciesKey: "scyther",
            weight: 12,
            minLevel: 23,
            maxLevel: 28
        }, {
            speciesKey: "kangaskhan",
            weight: 12,
            minLevel: 25,
            maxLevel: 28
        }, {
            speciesKey: "tauros",
            weight: 12,
            minLevel: 25,
            maxLevel: 28
        }, {
            speciesKey: "dratini",
            weight: 12,
            minLevel: 15,
            maxLevel: 20
        }, {
            speciesKey: "tangela",
            weight: 12,
            minLevel: 22,
            maxLevel: 28
        }, {
            speciesKey: "pinsir",
            weight: 15,
            minLevel: 23,
            maxLevel: 28
        }, {
            speciesKey: "goldeen",
            weight: 15,
            minLevel: 22,
            maxLevel: 28
        }, {
            speciesKey: "poliwag",
            weight: 15,
            minLevel: 22,
            maxLevel: 28
        }, {
            speciesKey: "eevee",
            weight: 9,
            minLevel: 25,
            maxLevel: 25
        }, {
            speciesKey: "lickitung",
            weight: 9,
            minLevel: 25,
            maxLevel: 28
        }, {
            speciesKey: "snorlax",
            weight: 9,
            minLevel: 30,
            maxLevel: 30
        }, {
            speciesKey: "bulbasaur",
            weight: 1,
            minLevel: 25,
            maxLevel: 25
        }, {
            speciesKey: "charmander",
            weight: 1,
            minLevel: 25,
            maxLevel: 25
        }, {
            speciesKey: "squirtle",
            weight: 1,
            minLevel: 25,
            maxLevel: 25
        }]
    },
    diglettsCave: {
        name: "Diglett's Cave",
        encounters: [{
            speciesKey: "diglett",
            weight: 70,
            minLevel: 15,
            maxLevel: 22
        }, {
            speciesKey: "dugtrio",
            weight: 30,
            minLevel: 29,
            maxLevel: 31
        }]
    },
    route19: {
        name: "Route 19",
        encounters: [{
            speciesKey: "tentacool",
            weight: 35,
            minLevel: 5,
            maxLevel: 40
        }, {
            speciesKey: "shellder",
            weight: 15,
            minLevel: 25,
            maxLevel: 30
        }, {
            speciesKey: "magikarp",
            weight: 15,
            minLevel: 5,
            maxLevel: 15
        }, {
            speciesKey: "horsea",
            weight: 15,
            minLevel: 20,
            maxLevel: 30
        }, {
            speciesKey: "goldeen",
            weight: 10,
            minLevel: 20,
            maxLevel: 30
        }, {
            speciesKey: "krabby",
            weight: 10,
            minLevel: 20,
            maxLevel: 30
        }]
    },
    route20: {
        name: "Route 20",
        encounters: [{
            speciesKey: "tentacool",
            weight: 35,
            minLevel: 5,
            maxLevel: 40
        }, {
            speciesKey: "shellder",
            weight: 15,
            minLevel: 25,
            maxLevel: 30
        }, {
            speciesKey: "magikarp",
            weight: 15,
            minLevel: 5,
            maxLevel: 15
        }, {
            speciesKey: "horsea",
            weight: 15,
            minLevel: 20,
            maxLevel: 30
        }, {
            speciesKey: "goldeen",
            weight: 10,
            minLevel: 20,
            maxLevel: 30
        }, {
            speciesKey: "staryu",
            weight: 10,
            minLevel: 20,
            maxLevel: 30
        }]
    },
    seafoamIslands: {
        name: "Seafoam Islands",
        encounters: [{
            speciesKey: "zubat",
            weight: 15,
            minLevel: 26,
            maxLevel: 30
        }, {
            speciesKey: "golbat",
            weight: 10,
            minLevel: 28,
            maxLevel: 32
        }, {
            speciesKey: "seel",
            weight: 20,
            minLevel: 26,
            maxLevel: 32
        }, {
            speciesKey: "dewgong",
            weight: 10,
            minLevel: 30,
            maxLevel: 34
        }, {
            speciesKey: "psyduck",
            weight: 10,
            minLevel: 26,
            maxLevel: 30
        }, {
            speciesKey: "slowpoke",
            weight: 10,
            minLevel: 26,
            maxLevel: 30
        }, {
            speciesKey: "shellder",
            weight: 10,
            minLevel: 26,
            maxLevel: 30
        }, {
            speciesKey: "horsea",
            weight: 10,
            minLevel: 26,
            maxLevel: 30
        }]
    },
    pokemonMansion: {
        name: "Pokemon Mansion",
        encounters: [{
            speciesKey: "koffing",
            weight: 20,
            minLevel: 26,
            maxLevel: 34
        }, {
            speciesKey: "grimer",
            weight: 15,
            minLevel: 26,
            maxLevel: 34
        }, {
            speciesKey: "growlithe",
            weight: 15,
            minLevel: 28,
            maxLevel: 34
        }, {
            speciesKey: "ponyta",
            weight: 12,
            minLevel: 28,
            maxLevel: 34
        }, {
            speciesKey: "rattata",
            weight: 8,
            minLevel: 26,
            maxLevel: 30
        }, {
            speciesKey: "raticate",
            weight: 8,
            minLevel: 30,
            maxLevel: 34
        }, {
            speciesKey: "vulpix",
            weight: 8,
            minLevel: 28,
            maxLevel: 34
        }, {
            speciesKey: "magmar",
            weight: 7,
            minLevel: 32,
            maxLevel: 36
        }, {
            speciesKey: "weezing",
            weight: 7,
            minLevel: 32,
            maxLevel: 36
        }]
    },
    route21: {
        name: "Route 21",
        encounters: [{
            speciesKey: "tentacool",
            weight: 30,
            minLevel: 5,
            maxLevel: 40
        }, {
            speciesKey: "rattata",
            weight: 15,
            minLevel: 21,
            maxLevel: 23
        }, {
            speciesKey: "raticate",
            weight: 10,
            minLevel: 23,
            maxLevel: 25
        }, {
            speciesKey: "tangela",
            weight: 10,
            minLevel: 22,
            maxLevel: 26
        }, {
            speciesKey: "magikarp",
            weight: 10,
            minLevel: 5,
            maxLevel: 15
        }, {
            speciesKey: "staryu",
            weight: 8,
            minLevel: 22,
            maxLevel: 28
        }, {
            speciesKey: "krabby",
            weight: 7,
            minLevel: 22,
            maxLevel: 28
        }, {
            speciesKey: "lapras",
            weight: 5,
            minLevel: 25,
            maxLevel: 30
        }, {
            speciesKey: "seadra",
            weight: 5,
            minLevel: 28,
            maxLevel: 32
        }]
    },
    route22: {
        name: "Route 22",
        encounters: [{
            speciesKey: "rattata",
            weight: 25,
            minLevel: 2,
            maxLevel: 5
        }, {
            speciesKey: "nidoranM",
            weight: 25,
            minLevel: 2,
            maxLevel: 5
        }, {
            speciesKey: "nidoranF",
            weight: 25,
            minLevel: 2,
            maxLevel: 5
        }, {
            speciesKey: "spearow",
            weight: 20,
            minLevel: 3,
            maxLevel: 5
        }, {
            speciesKey: "mankey",
            weight: 5,
            minLevel: 3,
            maxLevel: 5
        }]
    },
    route23: {
        name: "Route 23",
        encounters: [{
            speciesKey: "spearow",
            weight: 20,
            minLevel: 26,
            maxLevel: 30
        }, {
            speciesKey: "fearow",
            weight: 15,
            minLevel: 30,
            maxLevel: 34
        }, {
            speciesKey: "ekans",
            weight: 20,
            minLevel: 26,
            maxLevel: 30
        }, {
            speciesKey: "arbok",
            weight: 10,
            minLevel: 30,
            maxLevel: 34
        }, {
            speciesKey: "sandshrew",
            weight: 20,
            minLevel: 26,
            maxLevel: 30
        }, {
            speciesKey: "sandslash",
            weight: 10,
            minLevel: 30,
            maxLevel: 34
        }, {
            speciesKey: "ditto",
            weight: 5,
            minLevel: 33,
            maxLevel: 36
        }]
    },
    powerPlant: {
        name: "Power Plant",
        encounters: [{
            speciesKey: "voltorb",
            weight: 22,
            minLevel: 21,
            maxLevel: 24
        }, {
            speciesKey: "magnemite",
            weight: 22,
            minLevel: 21,
            maxLevel: 24
        }, {
            speciesKey: "pikachu",
            weight: 13,
            minLevel: 21,
            maxLevel: 24
        }, {
            speciesKey: "magneton",
            weight: 10,
            minLevel: 29,
            maxLevel: 33
        }, {
            speciesKey: "electrode",
            weight: 10,
            minLevel: 29,
            maxLevel: 33
        }, {
            speciesKey: "electabuzz",
            weight: 13,
            minLevel: 33,
            maxLevel: 36
        }, {
            speciesKey: "jolteon",
            weight: 5,
            minLevel: 30,
            maxLevel: 36
        }]
    },
    victoryRoad: {
        name: "Victory Road",
        encounters: [{
            speciesKey: "zubat",
            weight: 10,
            minLevel: 32,
            maxLevel: 36
        }, {
            speciesKey: "golbat",
            weight: 12,
            minLevel: 34,
            maxLevel: 38
        }, {
            speciesKey: "geodude",
            weight: 15,
            minLevel: 32,
            maxLevel: 36
        }, {
            speciesKey: "graveler",
            weight: 10,
            minLevel: 36,
            maxLevel: 40
        }, {
            speciesKey: "onix",
            weight: 12,
            minLevel: 36,
            maxLevel: 42
        }, {
            speciesKey: "machop",
            weight: 8,
            minLevel: 32,
            maxLevel: 36
        }, {
            speciesKey: "machoke",
            weight: 10,
            minLevel: 38,
            maxLevel: 42
        }, {
            speciesKey: "marowak",
            weight: 8,
            minLevel: 38,
            maxLevel: 42
        }, {
            speciesKey: "primeape",
            weight: 5,
            minLevel: 38,
            maxLevel: 42
        }, {
            speciesKey: "rhydon",
            weight: 5,
            minLevel: 40,
            maxLevel: 44
        }]
    },
    ceruleanCave: {
        name: "Cerulean Cave",
        encounters: [{
            speciesKey: "golbat",
            weight: 12,
            minLevel: 46,
            maxLevel: 50
        }, {
            speciesKey: "kadabra",
            weight: 10,
            minLevel: 46,
            maxLevel: 50
        }, {
            speciesKey: "hypno",
            weight: 8,
            minLevel: 46,
            maxLevel: 50
        }, {
            speciesKey: "magneton",
            weight: 8,
            minLevel: 46,
            maxLevel: 50
        }, {
            speciesKey: "dodrio",
            weight: 8,
            minLevel: 46,
            maxLevel: 50
        }, {
            speciesKey: "venomoth",
            weight: 8,
            minLevel: 46,
            maxLevel: 50
        }, {
            speciesKey: "rhydon",
            weight: 8,
            minLevel: 48,
            maxLevel: 52
        }, {
            speciesKey: "chansey",
            weight: 5,
            minLevel: 46,
            maxLevel: 50
        }, {
            speciesKey: "ditto",
            weight: 10,
            minLevel: 46,
            maxLevel: 50
        }, {
            speciesKey: "snorlax",
            weight: 5,
            minLevel: 48,
            maxLevel: 52
        }, {
            speciesKey: "lapras",
            weight: 5,
            minLevel: 48,
            maxLevel: 52
        }, {
            speciesKey: "dragonite",
            weight: 3,
            minLevel: 55,
            maxLevel: 60
        }, {
            speciesKey: "alakazam",
            weight: 5,
            minLevel: 48,
            maxLevel: 52
        }]
    }
}
  , Wa = [{
    speciesKey: "articuno",
    level: 70
}, {
    speciesKey: "zapdos",
    level: 70
}, {
    speciesKey: "moltres",
    level: 70
}, {
    speciesKey: "mewtwo",
    level: 80
}, {
    speciesKey: "mew",
    level: 60
}]
  , _h = 1 * 1e3
  , Bh = {
    enabled: !0,
    mode: "pokedex_new",
    levelThreshold: 1,
    enabledBalls: ["pokeball"]
};
function ql() {
    return {
        statStages: {
            attack: 0,
            defense: 0,
            spAttack: 0,
            spDefense: 0,
            speed: 0
        },
        mustRecharge: !1,
        lockedMove: null,
        lockTurnsRemaining: 0
    }
}
function Ra(s, u, d) {
    return s.catchSettings[u]?.[d] ?? s.globalCatchDefaults
}
const Yn = {
    expShare: {
        id: "expShare",
        name: "Exp. Share",
        description: "Shares 5% EXP with each non-fainted party member for 1000 battles. Active Pokemon gets 50%.",
        duration: 1e3,
        buyPrice: null
    },
    repel: {
        id: "repel",
        name: "Repel",
        description: "Halves a wild Pokemon's encounter weight on the current route for 500 battles.",
        duration: 500,
        buyPrice: 2e3
    },
    honey: {
        id: "honey",
        name: "Honey",
        description: "Doubles a wild Pokemon's encounter weight on the current route for 500 battles.",
        duration: 500,
        buyPrice: 2e3
    }
}
  , Ka = {
    pokeball: {
        id: "pokeball",
        name: "Poke Ball",
        description: "A standard ball for catching Pokemon.",
        buyPrice: 200,
        ballModifier: 1
    },
    greatball: {
        id: "greatball",
        name: "Great Ball",
        description: "A high-performance ball with a better catch rate.",
        buyPrice: 600,
        ballModifier: 1.5
    },
    ultraball: {
        id: "ultraball",
        name: "Ultra Ball",
        description: "An ultra-performance ball with an even better catch rate.",
        buyPrice: 1200,
        ballModifier: 2
    },
    masterball: {
        id: "masterball",
        name: "Master Ball",
        description: "The best ball that catches any Pokemon without fail.",
        buyPrice: null,
        ballModifier: 255
    }
}
  , Fo = ["pokeball", "greatball", "ultraball", "masterball"]
  , ds = [{
    id: "pokeballs",
    label: "Poke Balls"
}, {
    id: "items",
    label: "Items"
}];
function Oh(s) {
    return s in Ka ? "pokeballs" : "items"
}
function Vl(s) {
    return s in Yn
}
const Gn = {
    thunderStone: {
        id: "thunderStone",
        name: "Thunder Stone",
        description: "Evolves certain Electric-type Pokemon."
    },
    fireStone: {
        id: "fireStone",
        name: "Fire Stone",
        description: "Evolves certain Fire-type Pokemon."
    },
    waterStone: {
        id: "waterStone",
        name: "Water Stone",
        description: "Evolves certain Water-type Pokemon."
    },
    leafStone: {
        id: "leafStone",
        name: "Leaf Stone",
        description: "Evolves certain Grass-type Pokemon."
    },
    moonStone: {
        id: "moonStone",
        name: "Moon Stone",
        description: "Evolves certain Pokemon."
    },
    linkCable: {
        id: "linkCable",
        name: "Link Cable",
        description: "Evolves Pokemon that normally evolve by trading."
    }
}
  , zh = [{
    itemId: "expShare",
    tokenCost: 2
}, {
    itemId: "fireStone",
    tokenCost: 1
}, {
    itemId: "waterStone",
    tokenCost: 1
}, {
    itemId: "thunderStone",
    tokenCost: 1
}, {
    itemId: "leafStone",
    tokenCost: 1
}, {
    itemId: "moonStone",
    tokenCost: 2
}, {
    itemId: "linkCable",
    tokenCost: 2
}];
function Xo(s) {
    if (s in Ka) {
        const u = Ka[s];
        return {
            name: u.name,
            description: u.description
        }
    }
    if (s in Gn) {
        const u = Gn[s];
        return {
            name: u.name,
            description: u.description
        }
    }
    if (s in Yn) {
        const u = Yn[s];
        return {
            name: u.name,
            description: u.description
        }
    }
    return {
        name: s,
        description: ""
    }
}
const Hh = {
    phase: "starterSelect",
    playerPokemon: null,
    enemyPokemon: null,
    currentRoute: "route1",
    battleEvents: [],
    pendingEvents: [],
    currentEventIndex: 0,
    speed: 1,
    paused: !1,
    battleLog: [],
    levelUpNotification: null,
    wildBattlesWon: 0,
    trainerBattlesWon: 0,
    battlesWonByLocation: {},
    party: [],
    box: [],
    autoCatch: !0,
    nextPokemonId: 1,
    currentLocation: "palletTown",
    unlockedLocations: ["palletTown", "route1"],
    evolutionState: null,
    catchSettings: {},
    globalCatchDefaults: Bh,
    money: 3e3,
    inventory: {
        pokeball: 20
    },
    trainerBattle: null,
    bossBattle: null,
    bossQueue: [],
    activePlayerPokemonIndex: 0,
    healingState: null,
    pendingBossBattle: null,
    alwaysCatchShinies: !0,
    pokedexSeen: [],
    pokedexCaught: [],
    shinyCaught: [],
    shinySeen: [],
    defeatedGyms: [],
    defeatedEliteFour: [],
    championDefeated: !1,
    victoryTokens: 0,
    autoProceed: !1,
    raidCooldownEnd: null,
    raidLegendary: null,
    inRaid: !1,
    raidLevel: 0,
    preRaidLocation: null,
    playerVolatile: null,
    activeEffects: []
};
function pf(s, u, d, o=!1) {
    const y = pokemonSpecies[s]
      , f = generateIVs()
      , g = calculatePokemonStats(y, u, f)
      , x = resolvePokemonMoves(s, u);
    return {
        id: String(d),
        speciesKey: s,
        name: y.name,
        level: u,
        totalExp: calculateRequiredExperience(u, y.growthRate),
        moves: x,
        currentHp: g.hp,
        maxHp: g.hp,
        attack: g.attack,
        defense: g.defense,
        spAttack: g.spAttack,
        spDefense: g.spDefense,
        speed: g.speed,
        ivs: f,
        isShiny: o
    }
}
function Yl(s) {
    const u = new Set(s.unlockedLocations)
      , d = s.defeatedGyms.length;
    for (const [o,y] of Object.entries(mapData)) {
        if (u.has(o))
            continue;
        const f = y.unlock;
        f.battlesAtLocation && f.battlesAtLocation.some(g => (s.battlesWonByLocation[g.locationId] ?? 0) < g.count) || f.badgesRequired && d < f.badgesRequired || f.championDefeated && !s.championDefeated || u.add(o)
    }
    return Array.from(u)
}
function _f(s) {
    return s.activePlayerPokemonIndex
}
function Hn(s) {
    if (!s.playerPokemon || s.party.length === 0)
        return s;
    const u = _f(s)
      , d = [...s.party];
    if (u >= 0 && u < d.length && d[u].id === s.playerPokemon.id)
        return d[u] = s.playerPokemon,
        {
            ...s,
            party: d
        };
    const o = d.findIndex(y => y.id === s.playerPokemon.id);
    return o >= 0 ? (d[o] = s.playerPokemon,
    {
        ...s,
        party: d,
        activePlayerPokemonIndex: o
    }) : s
}
function Gl(s) {
    if (s.party.length === 0)
        return s;
    const u = _f(s);
    return u >= 0 && u < s.party.length ? {
        ...s,
        playerPokemon: s.party[u]
    } : {
        ...s,
        playerPokemon: s.party[0],
        activePlayerPokemonIndex: 0
    }
}
function Uh() {
    return {
        phase: "idle",
        enemyPokemon: null,
        battleEvents: [],
        pendingEvents: [],
        currentEventIndex: 0,
        trainerBattle: null,
        bossBattle: null,
        bossQueue: [],
        activePlayerPokemonIndex: 0,
        playerVolatile: null
    }
}
function Kt(s) {
    const u = Hn(s)
      , d = u.party.findIndex(y => y.currentHp > 0)
      , o = d >= 0 ? d : 0;
    return {
        ...u,
        ...Uh(),
        activePlayerPokemonIndex: o,
        playerPokemon: u.party[o] || u.playerPokemon
    }
}
function Yo(s) {
    return s.map(u => ({
        ...u,
        battlesRemaining: u.battlesRemaining - 1
    })).filter(u => u.battlesRemaining > 0)
}
function Yh(s, u) {
    switch (u.type) {
    case "SELECT_STARTER":
        {
            const d = pf(u.payload.speciesKey, 5, s.nextPokemonId, u.payload.isShiny)
              , o = u.payload.speciesKey;
            return {
                ...s,
                phase: "idle",
                playerPokemon: d,
                party: [d],
                nextPokemonId: s.nextPokemonId + 1,
                battleLog: [`You chose ${d.name}!`],
                pokedexSeen: s.pokedexSeen.includes(o) ? s.pokedexSeen : [...s.pokedexSeen, o],
                pokedexCaught: s.pokedexCaught.includes(o) ? s.pokedexCaught : [...s.pokedexCaught, o]
            }
        }
    case "START_ENCOUNTER":
        {
            const d = s.party.findIndex(y => y.currentHp > 0)
              , o = d >= 0 ? d : 0;
            return {
                ...s,
                phase: "battling",
                enemyPokemon: u.payload.enemy,
                playerPokemon: s.party[o] || s.playerPokemon,
                activePlayerPokemonIndex: o,
                battleEvents: [],
                pendingEvents: [{
                    type: "encounter",
                    message: u.payload.enemy.isShiny ? `A shiny wild ${u.payload.enemy.name} appeared!` : `Wild ${u.payload.enemy.name} appeared!`
                }],
                currentEventIndex: 0,
                playerVolatile: ql()
            }
        }
    case "EXECUTE_TURN":
        return {
            ...s,
            pendingEvents: [...s.pendingEvents, ...u.payload.events]
        };
    case "CONSUME_EVENT":
        {
            if (s.pendingEvents.length === 0)
                return s;
            const [d,...o] = s.pendingEvents
              , y = [...s.battleLog, d.message].slice(-50);
            let f = s.phase;
            d.type === "victory" && (f = "victory"),
            d.type === "defeat" && (f = "defeat"),
            d.type === "faint" && (d.data?.target === "enemy" ? f = "victory" : d.data?.target === "player" && (f = "defeat"));
            let g = s.playerPokemon
              , x = s.enemyPokemon
              , h = s.wildBattlesWon
              , p = s.battlesWonByLocation;
            (d.type === "damage" || d.type === "recoil") && d.data && (d.data.target === "player" && g ? g = {
                ...g,
                currentHp: d.data.hpAfter ?? g.currentHp
            } : d.data.target === "enemy" && x && (x = {
                ...x,
                currentHp: d.data.hpAfter ?? x.currentHp
            }));
            let w = s.activeEffects;
            if (d.type === "faint" && d.data?.target === "enemy" && !s.trainerBattle && !s.bossBattle) {
                h++;
                const A = p[s.currentLocation] ?? 0;
                p = {
                    ...p,
                    [s.currentLocation]: A + 1
                },
                w = Yo(w)
            }
            const k = Hn({
                ...s,
                phase: f,
                pendingEvents: o,
                battleEvents: [...s.battleEvents, d],
                battleLog: y,
                playerPokemon: g,
                enemyPokemon: x,
                wildBattlesWon: h,
                battlesWonByLocation: p,
                activeEffects: w
            });
            if (d.type === "victory" || d.type === "faint" && d.data?.target === "enemy") {
                const A = Yl(k)
                  , v = A.filter(S => !k.unlockedLocations.includes(S));
                let _ = k.battleLog;
                for (const S of v) {
                    const D = mapData[S];
                    D && (_ = [..._, `${D.name} is now accessible!`].slice(-50))
                }
                return {
                    ...k,
                    unlockedLocations: A,
                    battleLog: _
                }
            }
            return k
        }
    case "APPLY_EXP":
        {
            if (!s.playerPokemon)
                return s;
            const d = s.playerPokemon.totalExp + u.payload.expGained;
            let o = {
                ...s.playerPokemon,
                totalExp: d
            };
            const y = [...s.battleLog, `${o.name} gained ${u.payload.expGained} EXP!`];
            if (u.payload.newLevel && u.payload.newStats) {
                const f = (u.payload.newStats.maxHp ?? o.maxHp) - o.maxHp;
                o = {
                    ...o,
                    level: u.payload.newLevel,
                    maxHp: u.payload.newStats.maxHp ?? o.maxHp,
                    currentHp: Math.min(o.currentHp + f, u.payload.newStats.maxHp ?? o.maxHp),
                    attack: u.payload.newStats.attack ?? o.attack,
                    defense: u.payload.newStats.defense ?? o.defense,
                    spAttack: u.payload.newStats.spAttack ?? o.spAttack,
                    spDefense: u.payload.newStats.spDefense ?? o.spDefense,
                    speed: u.payload.newStats.speed ?? o.speed
                },
                y.push(`${o.name} grew to level ${o.level}!`)
            }
            if (u.payload.newMoves && u.payload.newMoves.length > 0) {
                let f = [...o.moves];
                for (const g of u.payload.newMoves)
                    f.includes(g) || (f.length >= 4 ? f = [...f.slice(1), g] : f = [...f, g],
                    y.push(`${o.name} learned ${g}!`));
                o = {
                    ...o,
                    moves: f
                }
            }
            return Hn({
                ...s,
                playerPokemon: o,
                battleLog: y.slice(-50),
                levelUpNotification: u.payload.newLevel ? `Level ${u.payload.newLevel}!` : null
            })
        }
    case "HEAL":
        return s.playerPokemon ? Hn({
            ...s,
            playerPokemon: {
                ...s.playerPokemon,
                currentHp: s.playerPokemon.maxHp
            },
            battleLog: [...s.battleLog, `${s.playerPokemon.name} was healed to full HP!`].slice(-50)
        }) : s;
    case "SET_SPEED":
        return {
            ...s,
            speed: u.payload.speed
        };
    case "TOGGLE_PAUSE":
        return {
            ...s,
            paused: !s.paused
        };
    case "CLEAR_LEVEL_UP":
        return {
            ...s,
            levelUpNotification: null
        };
    case "PHASE_IDLE":
        {
            const d = Kt(s);
            return s.inRaid ? {
                ...d,
                raidLevel: Math.min(s.raidLevel + 1, 100)
            } : d
        }
    case "ADD_LOG":
        return {
            ...s,
            battleLog: [...s.battleLog, u.payload.message].slice(-50)
        };
    case "SET_MOVES":
        {
            if (!s.playerPokemon)
                return s;
            const d = u.payload.moves;
            return d.length < 1 || d.length > 4 || new Set(d).size !== d.length ? s : Hn({
                ...s,
                playerPokemon: {
                    ...s.playerPokemon,
                    moves: d
                }
            })
        }
    case "CATCH_POKEMON":
        {
            const {speciesKey: d, level: o, pokeballUsed: y, isShiny: f} = u.payload
              , g = s.inRaid ? 60 : o
              , x = pf(d, g, s.nextPokemonId, f)
              , h = pokemonSpecies[d];
            let p = s.inventory;
            if (y) {
                const w = p[y] ?? 0;
                w > 0 && (p = {
                    ...p,
                    [y]: w - 1
                })
            }
            return s.party.length < 6 ? {
                ...s,
                party: [...s.party, x],
                nextPokemonId: s.nextPokemonId + 1,
                inventory: p,
                battleLog: [...s.battleLog, `Caught ${h.name}! Added to party.`].slice(-50)
            } : {
                ...s,
                box: [...s.box, x],
                nextPokemonId: s.nextPokemonId + 1,
                inventory: p,
                battleLog: [...s.battleLog, `Caught ${h.name}! Sent to box.`].slice(-50)
            }
        }
    case "TOGGLE_AUTO_CATCH":
        return {
            ...s,
            autoCatch: !s.autoCatch
        };
    case "REORDER_PARTY":
        {
            const {pokemonId: d, toIndex: o} = u.payload;
            if (o < 0 || o >= s.party.length)
                return s;
            const y = s.party.findIndex(w => w.id === d);
            if (y < 0 || y === o)
                return s;
            const f = s.phase === "battling" ? Kt(s) : s
              , g = f.playerPokemon?.id
              , x = [...f.party]
              , [h] = x.splice(y, 1);
            x.splice(o, 0, h);
            const p = g ? x.findIndex(w => w.id === g) : 0;
            return Gl({
                ...f,
                party: x,
                activePlayerPokemonIndex: Math.max(0, p)
            })
        }
    case "SWAP_PARTY":
        {
            const {indexA: d, indexB: o} = u.payload;
            if (d < 0 || d >= s.party.length || o < 0 || o >= s.party.length)
                return s;
            const y = s.phase === "battling" ? Kt(s) : s
              , f = y.playerPokemon?.id
              , g = [...y.party];
            [g[d],g[o]] = [g[o], g[d]];
            const x = f ? g.findIndex(h => h.id === f) : 0;
            return Gl({
                ...y,
                party: g,
                activePlayerPokemonIndex: Math.max(0, x)
            })
        }
    case "PARTY_TO_BOX":
        {
            if (s.party.length <= 1)
                return s;
            const {partyIndex: d} = u.payload;
            if (d < 0 || d >= s.party.length)
                return s;
            const o = s.phase === "battling" ? Kt(s) : s
              , y = o.party[d]
              , f = o.party.filter( (h, p) => p !== d)
              , g = o.playerPokemon?.id
              , x = g ? f.findIndex(h => h.id === g) : 0;
            return Gl({
                ...o,
                party: f,
                box: [...o.box, y],
                activePlayerPokemonIndex: Math.max(0, x)
            })
        }
    case "BOX_TO_PARTY":
        {
            if (s.party.length >= 6)
                return s;
            const {boxIndex: d} = u.payload;
            if (d < 0 || d >= s.box.length)
                return s;
            const o = s.box[d]
              , y = s.box.filter( (f, g) => g !== d);
            return {
                ...s,
                party: [...s.party, o],
                box: y
            }
        }
    case "SWAP_PARTY_BOX":
        {
            const {partyIndex: d, boxIndex: o} = u.payload;
            if (d < 0 || d >= s.party.length || o < 0 || o >= s.box.length)
                return s;
            const y = s.phase === "battling" ? Kt(s) : s
              , f = [...y.party]
              , g = [...y.box];
            [f[d],g[o]] = [g[o], f[d]];
            const x = y.playerPokemon?.id
              , h = x ? f.findIndex(p => p.id === x) : 0;
            return Gl({
                ...y,
                party: f,
                box: g,
                activePlayerPokemonIndex: Math.max(0, h)
            })
        }
    case "TRAVEL":
        {
            const {locationId: d} = u.payload;
            if (!s.unlockedLocations.includes(d) || d === s.currentLocation)
                return s;
            const o = mapData[d]
              , y = o.routeKey || s.currentRoute
              , f = Yl(s);
            return {
                ...Kt(s),
                currentLocation: d,
                currentRoute: y,
                unlockedLocations: f,
                battleLog: [...s.battleLog, `Traveled to ${o.name}!`].slice(-50),
                inRaid: !1,
                raidLegendary: null,
                raidLevel: 0,
                preRaidLocation: null
            }
        }
    case "START_EVOLUTION":
        {
            const {pokemonId: d, fromSpeciesKey: o, toSpeciesKey: y, consumeItem: f} = u.payload
              , g = pokemonSpecies[o]
              , x = s.party.find(p => p.id === d) || s.box.find(p => p.id === d);
            let h = s.inventory;
            if (f) {
                const p = s.inventory[f] ?? 0;
                if (p <= 0)
                    return s;
                h = {
                    ...s.inventory,
                    [f]: p - 1
                }
            }
            return {
                ...Kt(s),
                phase: "evolving",
                inventory: h,
                evolutionState: {
                    pokemonId: d,
                    fromSpeciesKey: o,
                    toSpeciesKey: y,
                    step: "flash",
                    isShiny: x?.isShiny ?? !1
                },
                battleLog: [...s.battleLog, `What? ${g.name} is evolving!`].slice(-50)
            }
        }
    case "EVOLUTION_STEP":
        return s.evolutionState ? {
            ...s,
            evolutionState: {
                ...s.evolutionState,
                step: u.payload.step
            }
        } : s;
    case "COMPLETE_EVOLUTION":
        {
            if (!s.evolutionState)
                return {
                    ...s,
                    phase: "idle",
                    evolutionState: null
                };
            const {pokemonId: d, fromSpeciesKey: o, toSpeciesKey: y} = s.evolutionState
              , f = pokemonSpecies[y]
              , g = pokemonSpecies[o]
              , x = v => {
                if (v.id !== d)
                    return v;
                const _ = calculatePokemonStats(f, v.level, v.ivs)
                  , S = _.hp - v.maxHp
                  , z = (moveLearnsets[y] || []).filter( ([G]) => G <= v.level).map( ([,G]) => G).filter(G => !v.moves.includes(G));
                let V = [...v.moves];
                for (const G of z)
                    V.length >= 4 ? V = [...V.slice(1), G] : V = [...V, G];
                return {
                    ...v,
                    speciesKey: y,
                    name: f.name,
                    maxHp: _.hp,
                    currentHp: Math.min(v.currentHp + Math.max(0, S), _.hp),
                    attack: _.attack,
                    defense: _.defense,
                    spAttack: _.spAttack,
                    spDefense: _.spDefense,
                    speed: _.speed,
                    moves: V
                }
            }
              , h = s.party.map(x)
              , p = s.box.map(x)
              , w = s.playerPokemon ? x(s.playerPokemon) : s.playerPokemon
              , k = s.pokedexSeen.includes(y) ? s.pokedexSeen : [...s.pokedexSeen, y]
              , A = s.pokedexCaught.includes(y) ? s.pokedexCaught : [...s.pokedexCaught, y];
            return {
                ...s,
                phase: "idle",
                evolutionState: null,
                playerPokemon: w,
                party: h,
                box: p,
                pokedexSeen: k,
                pokedexCaught: A,
                battleLog: [...s.battleLog, `Congratulations! ${g.name} evolved into ${f.name}!`].slice(-50)
            }
        }
    case "SET_CATCH_RULE":
        {
            const {routeKey: d, speciesKey: o, rule: y} = u.payload
              , f = s.catchSettings[d] || {};
            return {
                ...s,
                catchSettings: {
                    ...s.catchSettings,
                    [d]: {
                        ...f,
                        [o]: y
                    }
                },
                globalCatchDefaults: {
                    ...s.globalCatchDefaults,
                    mode: y.mode,
                    levelThreshold: y.levelThreshold,
                    enabledBalls: y.enabledBalls
                }
            }
        }
    case "TOGGLE_ROUTE_CATCH_ALL":
        {
            const {routeKey: d, enabled: o} = u.payload
              , y = mapEncounterData[d];
            if (!y)
                return s;
            const f = {
                ...s.catchSettings[d] || {}
            };
            for (const g of y.encounters) {
                const x = f[g.speciesKey] || s.globalCatchDefaults;
                f[g.speciesKey] = {
                    ...x,
                    enabled: o
                }
            }
            return {
                ...s,
                catchSettings: {
                    ...s.catchSettings,
                    [d]: f
                }
            }
        }
    case "START_TRAINER_BATTLE":
        {
            const {trainerId: d, trainerName: o, trainerClass: y, trainerTeam: f} = u.payload
              , g = f[0];
            return {
                ...s,
                phase: "battling",
                enemyPokemon: g,
                battleEvents: [],
                pendingEvents: [{
                    type: "trainerAppear",
                    message: `${o} wants to battle!`
                }, {
                    type: "trainerSendOut",
                    message: `${o} sent out ${g.name}!`
                }],
                currentEventIndex: 0,
                activePlayerPokemonIndex: 0,
                trainerBattle: {
                    trainerId: d,
                    trainerName: o,
                    trainerClass: y,
                    trainerTeam: f,
                    currentTrainerPokemonIndex: 0
                },
                playerVolatile: ql()
            }
        }
    case "START_BOSS_BATTLE":
        {
            const {bossId: d, bossType: o, trainerName: y, trainerClass: f, trainerTeam: g, bossQueue: x, spriteKey: h} = u.payload
              , p = g[0];
            return {
                ...s,
                phase: "battling",
                enemyPokemon: p,
                battleEvents: [],
                pendingEvents: [{
                    type: "trainerAppear",
                    message: `${y} wants to battle!`
                }, {
                    type: "trainerSendOut",
                    message: `${y} sent out ${p.name}!`
                }],
                currentEventIndex: 0,
                activePlayerPokemonIndex: 0,
                bossBattle: {
                    bossId: d,
                    bossType: o,
                    trainerName: y,
                    trainerClass: f,
                    trainerTeam: g,
                    currentTrainerPokemonIndex: 0,
                    spriteKey: h
                },
                bossQueue: x ?? [],
                playerVolatile: ql()
            }
        }
    case "SWITCH_PLAYER_POKEMON":
        {
            const {newPokemonIndex: d} = u.payload
              , o = [...s.party]
              , y = s.activePlayerPokemonIndex;
            s.playerPokemon && o[y] && (o[y] = {
                ...o[y],
                currentHp: s.playerPokemon.currentHp
            });
            const f = o[d];
            return f ? {
                ...s,
                phase: "battling",
                playerPokemon: f,
                battleEvents: [],
                party: o,
                activePlayerPokemonIndex: d,
                pendingEvents: [...s.pendingEvents, {
                    type: "playerSwitch",
                    message: `Go! ${f.name}!`
                }],
                playerVolatile: ql()
            } : s
        }
    case "TRAINER_SEND_NEXT_POKEMON":
        {
            const {newPokemonIndex: d} = u.payload
              , o = s.bossBattle ?? s.trainerBattle;
            if (!o)
                return s;
            const y = o.trainerTeam[d];
            if (!y)
                return s;
            const f = [...o.trainerTeam]
              , g = o.currentTrainerPokemonIndex;
            s.enemyPokemon && (f[g] = {
                ...f[g],
                currentHp: s.enemyPokemon.currentHp
            });
            const x = {
                ...o,
                trainerTeam: f,
                currentTrainerPokemonIndex: d
            };
            return {
                ...s,
                phase: "battling",
                enemyPokemon: y,
                battleEvents: [],
                trainerBattle: s.trainerBattle ? x : null,
                bossBattle: s.bossBattle ? x : null,
                pendingEvents: [...s.pendingEvents, {
                    type: "trainerAppear",
                    message: `${o.trainerName} is about to send out ${y.name}!`
                }, {
                    type: "trainerSendOut",
                    message: `${o.trainerName} sent out ${y.name}!`
                }]
            }
        }
    case "TRAINER_BATTLE_END":
        {
            const {won: d, moneyDelta: o} = u.payload
              , y = Math.max(0, s.money + o)
              , f = d ? "moneyGain" : "moneyLoss"
              , g = d ? `Got $${o} for winning!` : `Lost $${Math.abs(o)}...`
              , x = d ? s.trainerBattlesWon + 1 : s.trainerBattlesWon
              , h = s.battlesWonByLocation[s.currentLocation] ?? 0
              , p = d ? {
                ...s.battlesWonByLocation,
                [s.currentLocation]: h + 1
            } : s.battlesWonByLocation
              , w = d ? Yo(s.activeEffects) : s.activeEffects
              , k = {
                ...Kt(s),
                money: y,
                trainerBattlesWon: x,
                battlesWonByLocation: p,
                activeEffects: w,
                pendingEvents: [{
                    type: f,
                    message: g
                }]
            };
            return {
                ...k,
                unlockedLocations: Yl(k)
            }
        }
    case "BOSS_BATTLE_END":
        {
            const {won: d, moneyDelta: o} = u.payload
              , y = Math.max(0, s.money + o)
              , f = d ? "moneyGain" : "moneyLoss"
              , g = d ? `Got $${o} for winning!` : `Lost $${Math.abs(o)}...`
              , x = d ? s.trainerBattlesWon + 1 : s.trainerBattlesWon
              , h = s.battlesWonByLocation[s.currentLocation] ?? 0
              , p = d ? {
                ...s.battlesWonByLocation,
                [s.currentLocation]: h + 1
            } : s.battlesWonByLocation
              , w = d ? Yo(s.activeEffects) : s.activeEffects;
            let k = s.defeatedGyms
              , A = s.defeatedEliteFour
              , v = s.championDefeated
              , _ = s.victoryTokens;
            const S = [];
            if (d && s.bossBattle) {
                const {bossType: z, bossId: V} = s.bossBattle;
                z === "gym" && !k.includes(V) ? (k = [...k, V],
                _ += 1,
                S.push("Earned a Victory Token!")) : z === "e4" && !A.includes(V) ? A = [...A, V] : z === "champion" && (v = !0,
                _ += 1,
                S.push("Earned a Victory Token!"))
            }
            if (d && s.bossQueue.length > 0) {
                const [z,...V] = s.bossQueue
                  , G = z.trainerTeam[0]
                  , Z = {
                    ...Hn(s),
                    money: y,
                    trainerBattlesWon: x,
                    battlesWonByLocation: p,
                    activeEffects: w,
                    defeatedGyms: k,
                    defeatedEliteFour: A,
                    championDefeated: v,
                    victoryTokens: _,
                    phase: "battling",
                    enemyPokemon: G,
                    battleEvents: [],
                    pendingEvents: [{
                        type: f,
                        message: g
                    }, ...S.map(F => ({
                        type: "moneyGain",
                        message: F
                    })), {
                        type: "trainerAppear",
                        message: `${z.trainerName} wants to battle!`
                    }, {
                        type: "trainerSendOut",
                        message: `${z.trainerName} sent out ${G.name}!`
                    }],
                    currentEventIndex: 0,
                    bossBattle: {
                        bossId: z.bossId,
                        bossType: z.bossType,
                        trainerName: z.trainerName,
                        trainerClass: z.trainerClass,
                        trainerTeam: z.trainerTeam,
                        currentTrainerPokemonIndex: 0,
                        spriteKey: z.spriteKey
                    },
                    bossQueue: V
                };
                return {
                    ...Z,
                    unlockedLocations: Yl(Z)
                }
            }
            const D = {
                ...Kt(s),
                money: y,
                trainerBattlesWon: x,
                battlesWonByLocation: p,
                activeEffects: w,
                defeatedGyms: k,
                defeatedEliteFour: A,
                championDefeated: v,
                victoryTokens: _,
                pendingEvents: [{
                    type: f,
                    message: g
                }, ...S.map(z => ({
                    type: "moneyGain",
                    message: z
                }))]
            };
            return {
                ...D,
                unlockedLocations: Yl(D)
            }
        }
    case "HEAL_PARTY":
        {
            const d = s.party.map(y => ({
                ...y,
                currentHp: y.maxHp
            }))
              , o = d[0] || s.playerPokemon;
            return {
                ...s,
                party: d,
                playerPokemon: o,
                battleLog: [...s.battleLog, "Your Pokemon were healed!"].slice(-50)
            }
        }
    case "BUY_ITEM":
        {
            const {itemId: d, quantity: o} = u.payload
              , y = Ka[d];
            if (y && y.buyPrice) {
                const f = y.buyPrice * o;
                if (s.money < f)
                    return s;
                const g = s.inventory[d] ?? 0;
                return {
                    ...s,
                    money: s.money - f,
                    inventory: {
                        ...s.inventory,
                        [d]: g + o
                    },
                    battleLog: [...s.battleLog, `Bought ${o}x ${y.name}!`].slice(-50)
                }
            }
            if (Vl(d)) {
                const f = Yn[d];
                if (!f.buyPrice)
                    return s;
                const g = f.buyPrice * o;
                if (s.money < g)
                    return s;
                const x = s.inventory[d] ?? 0;
                return {
                    ...s,
                    money: s.money - g,
                    inventory: {
                        ...s.inventory,
                        [d]: x + o
                    },
                    battleLog: [...s.battleLog, `Bought ${o}x ${f.name}!`].slice(-50)
                }
            }
            return s
        }
    case "USE_POKEBALL":
        {
            const {pokeballId: d} = u.payload
              , o = s.inventory[d] ?? 0;
            return o <= 0 ? s : {
                ...s,
                inventory: {
                    ...s.inventory,
                    [d]: o - 1
                }
            }
        }
    case "MARK_SEEN":
        {
            const {speciesKey: d} = u.payload;
            return s.pokedexSeen.includes(d) ? s : {
                ...s,
                pokedexSeen: [...s.pokedexSeen, d]
            }
        }
    case "MARK_CAUGHT":
        {
            const {speciesKey: d} = u.payload
              , o = s.pokedexSeen.includes(d) ? s.pokedexSeen : [...s.pokedexSeen, d]
              , y = s.pokedexCaught.includes(d) ? s.pokedexCaught : [...s.pokedexCaught, d];
            return o === s.pokedexSeen && y === s.pokedexCaught ? s : {
                ...s,
                pokedexSeen: o,
                pokedexCaught: y
            }
        }
    case "MARK_SHINY_CAUGHT":
        {
            const {speciesKey: d} = u.payload;
            return s.shinyCaught.includes(d) ? s : {
                ...s,
                shinyCaught: [...s.shinyCaught, d]
            }
        }
    case "MARK_SHINY_SEEN":
        {
            const {speciesKey: d} = u.payload;
            return s.shinySeen.includes(d) ? s : {
                ...s,
                shinySeen: [...s.shinySeen, d]
            }
        }
    case "START_HEALING":
        return {
            ...Kt(s),
            phase: "healing",
            healingState: {
                step: "place"
            },
            pendingBossBattle: u.payload?.pendingBossBattle ?? null
        };
    case "HEALING_STEP":
        return s.phase !== "healing" || !s.healingState ? s : {
            ...s,
            healingState: {
                ...s.healingState,
                step: u.payload.step
            }
        };
    case "COMPLETE_HEALING":
        {
            if (s.phase !== "healing" || !s.healingState)
                return s;
            const d = s.party.map(y => ({
                ...y,
                currentHp: y.maxHp
            }))
              , o = d[0] || s.playerPokemon;
            if (s.pendingBossBattle) {
                const y = s.pendingBossBattle
                  , f = y.trainerTeam[0];
                return {
                    ...s,
                    party: d,
                    playerPokemon: o,
                    activePlayerPokemonIndex: 0,
                    healingState: null,
                    pendingBossBattle: null,
                    phase: "battling",
                    enemyPokemon: f,
                    battleEvents: [],
                    pendingEvents: [{
                        type: "trainerAppear",
                        message: `${y.trainerName} wants to battle!`
                    }, {
                        type: "trainerSendOut",
                        message: `${y.trainerName} sent out ${f.name}!`
                    }],
                    currentEventIndex: 0,
                    bossBattle: {
                        bossId: y.bossId,
                        bossType: y.bossType,
                        trainerName: y.trainerName,
                        trainerClass: y.trainerClass,
                        trainerTeam: y.trainerTeam,
                        currentTrainerPokemonIndex: 0,
                        spriteKey: y.spriteKey
                    },
                    bossQueue: y.bossQueue ?? [],
                    battleLog: [...s.battleLog, "Your Pokemon were healed!"].slice(-50)
                }
            }
            if (s.currentLocation === "raidIsland") {
                const y = s.preRaidLocation || "palletTown"
                  , f = mapData[y]?.routeKey || "route1"
                  , g = mapData[y]?.name || "Pallet Town";
                return {
                    ...s,
                    phase: "idle",
                    party: d,
                    playerPokemon: o,
                    activePlayerPokemonIndex: 0,
                    healingState: null,
                    pendingBossBattle: null,
                    currentLocation: y,
                    currentRoute: f,
                    inRaid: !1,
                    raidLegendary: null,
                    raidLevel: 0,
                    preRaidLocation: null,
                    battleLog: [...s.battleLog, "Your Pokemon were healed!", `You returned to ${g}.`].slice(-50)
                }
            }
            return {
                ...s,
                phase: "idle",
                party: d,
                playerPokemon: o,
                activePlayerPokemonIndex: 0,
                healingState: null,
                pendingBossBattle: null,
                battleLog: [...s.battleLog, "Your Pokemon were healed!"].slice(-50)
            }
        }
    case "REORDER_BOX":
        {
            const {pokemonId: d, toIndex: o} = u.payload
              , y = s.box.findIndex(h => h.id === d);
            if (y < 0 || y === o)
                return s;
            const f = Math.max(0, Math.min(o, s.box.length - 1))
              , g = [...s.box]
              , [x] = g.splice(y, 1);
            return g.splice(f, 0, x),
            {
                ...s,
                box: g
            }
        }
    case "SORT_BOX":
        {
            const d = [...s.box].sort( (o, y) => {
                const f = pokemonSpecies[o.speciesKey]?.id ?? 0
                  , g = pokemonSpecies[y.speciesKey]?.id ?? 0;
                return f !== g ? f - g : o.level !== y.level ? y.level - o.level : o.isShiny !== y.isShiny ? o.isShiny ? -1 : 1 : 0
            }
            );
            return {
                ...s,
                box: d
            }
        }
    case "RELEASE_POKEMON":
        {
            const {pokemonId: d, source: o} = u.payload;
            if (o === "box")
                return {
                    ...s,
                    box: s.box.filter(h => h.id !== d)
                };
            if (s.party.length <= 1)
                return s;
            const y = s.phase === "battling" ? Kt(s) : s
              , f = y.party.filter(h => h.id !== d)
              , g = y.playerPokemon?.id;
            let x = g ? f.findIndex(h => h.id === g) : 0;
            return x < 0 && (x = 0),
            Gl({
                ...y,
                party: f,
                activePlayerPokemonIndex: x
            })
        }
    case "SET_ALWAYS_CATCH_SHINIES":
        return {
            ...s,
            alwaysCatchShinies: u.payload.value
        };
    case "RESET_ELITE_FOUR":
        return {
            ...s,
            defeatedEliteFour: []
        };
    case "TOGGLE_AUTO_PROCEED":
        return {
            ...s,
            autoProceed: !s.autoProceed
        };
    case "BUY_REWARD_ITEM":
        {
            const {itemId: d, cost: o} = u.payload;
            if (s.victoryTokens < o)
                return s;
            const y = s.inventory[d] ?? 0;
            return {
                ...s,
                victoryTokens: s.victoryTokens - o,
                inventory: {
                    ...s.inventory,
                    [d]: y + 1
                }
            }
        }
    case "START_RAID":
        {
            const d = s.party.map(g => ({
                ...g,
                currentHp: g.maxHp
            }))
              , o = d[0] || s.playerPokemon
              , f = Wa.find(g => g.speciesKey === u.payload.legendary)?.level ?? 60;
            return {
                ...Kt(s),
                raidCooldownEnd: Date.now() + _h,
                raidLegendary: u.payload.legendary,
                inRaid: !0,
                raidLevel: f,
                preRaidLocation: s.currentLocation,
                currentLocation: "raidIsland",
                currentRoute: "raidIsland",
                party: d,
                playerPokemon: o,
                activePlayerPokemonIndex: 0,
                battleLog: [...s.battleLog, "Arrived at Raid Island! A legendary Pokemon awaits..."].slice(-50)
            }
        }
    case "END_RAID":
        return {
            ...s,
            inRaid: !1,
            raidLegendary: null,
            raidLevel: 0,
            preRaidLocation: null
        };
    case "UPDATE_VOLATILE":
        {
            const {player: d, enemy: o} = u.payload;
            let y = s.enemyPokemon;
            return y && (y = {
                ...y,
                statStages: o.statStages,
                mustRecharge: o.mustRecharge,
                lockedMove: o.lockedMove,
                lockTurnsRemaining: o.lockTurnsRemaining
            }),
            {
                ...s,
                playerVolatile: d,
                enemyPokemon: y
            }
        }
    case "USE_EFFECT_ITEM":
        {
            const {itemId: d, routeKey: o, speciesKey: y} = u.payload
              , f = s.inventory[d] ?? 0;
            if (f <= 0)
                return s;
            const g = Yn[d];
            if (!g)
                return s;
            const x = s.activeEffects.findIndex(p => p.type === d && p.routeKey === o && p.speciesKey === y);
            let h;
            if (x >= 0)
                h = [...s.activeEffects],
                h[x] = {
                    ...h[x],
                    battlesRemaining: h[x].battlesRemaining + g.duration
                };
            else {
                const p = {
                    type: d,
                    battlesRemaining: g.duration,
                    routeKey: o,
                    speciesKey: y
                };
                h = [...s.activeEffects, p]
            }
            return {
                ...s,
                inventory: {
                    ...s.inventory,
                    [d]: f - 1
                },
                activeEffects: h,
                battleLog: [...s.battleLog, `Used ${g.name}!`].slice(-50)
            }
        }
    case "APPLY_SHARED_EXP":
        {
            const {partyExp: d} = u.payload;
            if (d.length === 0)
                return s;
            const o = [...s.party]
              , y = [];
            for (const x of d) {
                if (x.partyIndex < 0 || x.partyIndex >= o.length)
                    continue;
                let h = {
                    ...o[x.partyIndex]
                };
                if (h.totalExp = h.totalExp + x.expGained,
                y.push(`${h.name} gained ${x.expGained} EXP!`),
                x.newLevel && x.newStats) {
                    const p = (x.newStats.maxHp ?? h.maxHp) - h.maxHp;
                    h = {
                        ...h,
                        level: x.newLevel,
                        maxHp: x.newStats.maxHp ?? h.maxHp,
                        currentHp: Math.min(h.currentHp + p, x.newStats.maxHp ?? h.maxHp),
                        attack: x.newStats.attack ?? h.attack,
                        defense: x.newStats.defense ?? h.defense,
                        spAttack: x.newStats.spAttack ?? h.spAttack,
                        spDefense: x.newStats.spDefense ?? h.spDefense,
                        speed: x.newStats.speed ?? h.speed
                    },
                    y.push(`${h.name} grew to level ${h.level}!`)
                }
                if (x.newMoves && x.newMoves.length > 0) {
                    let p = [...h.moves];
                    for (const w of x.newMoves)
                        p.includes(w) || (p.length >= 4 ? p = [...p.slice(1), w] : p = [...p, w]);
                    h = {
                        ...h,
                        moves: p
                    }
                }
                o[x.partyIndex] = h
            }
            const f = s.activePlayerPokemonIndex
              , g = o[f] || s.playerPokemon;
            return {
                ...s,
                party: o,
                playerPokemon: g,
                battleLog: [...s.battleLog, ...y].slice(-50)
            }
        }
    case "LOAD_SAVE":
        return {
            ...s,
            ...u.payload.state
        };
    default:
        return s
    }
}
const ff = "pokemon-idle-save"
  , Bf = O.createContext(null);
function Gh({children: s}) {
    const [u,d] = O.useReducer(Yh, Hh, o => {
        try {
            const y = localStorage.getItem(ff);
            if (y) {
                const f = JSON.parse(y);
                if (f.playerPokemon) {
                    let g = f.nextPokemonId || 1;
                    const x = {
                        ...f.playerPokemon
                    };
                    x.isShiny === void 0 && (x.isShiny = !1),
                    x.id || (x.id = String(g++));
                    let h = f.party || [];
                    h.length === 0 ? h = [x] : h = h.map(S => {
                        const D = S.isShiny === void 0 ? {
                            ...S,
                            isShiny: !1
                        } : S;
                        return D.id ? D : {
                            ...D,
                            id: String(g++)
                        }
                    }
                    );
                    let p = f.box || [];
                    p = p.map(S => {
                        const D = S.isShiny === void 0 ? {
                            ...S,
                            isShiny: !1
                        } : S;
                        return D.id ? D : {
                            ...D,
                            id: String(g++)
                        }
                    }
                    ),
                    x.ivs || (x.ivs = generateIVs()),
                    h = h.map(S => S.ivs ? S : {
                        ...S,
                        ivs: generateIVs()
                    }),
                    p = p.map(S => S.ivs ? S : {
                        ...S,
                        ivs: generateIVs()
                    });
                    const w = f.catchSettings || {};
                    for (const S of Object.keys(w))
                        for (const D of Object.keys(w[S])) {
                            const z = w[S][D];
                            z.enabledBalls || (z.enabledBalls = [z.pokeball || "pokeball"],
                            delete z.pokeball)
                        }
                    let k = f.pokedexSeen || []
                      , A = f.pokedexCaught || [];
                    if (!f.pokedexSeen || !f.pokedexCaught) {
                        const S = new Set;
                        for (const D of [...h, ...p])
                            S.add(D.speciesKey);
                        A = Array.from(S),
                        k = [...A]
                    }
                    const v = new Set(A);
                    for (const S of [...v]) {
                        let D = preEvolutionMap[S];
                        for (; D; )
                            v.add(D),
                            D = preEvolutionMap[D]
                    }
                    const _ = new Set([...k, ...v]);
                    return A = Array.from(v),
                    k = Array.from(_),
                    {
                        ...o,
                        phase: "idle",
                        playerPokemon: h[0] || x,
                        currentRoute: f.currentRoute || o.currentRoute,
                        speed: f.speed || o.speed,
                        wildBattlesWon: f.wildBattlesWon ?? f.battlesWon ?? 0,
                        trainerBattlesWon: f.trainerBattlesWon ?? 0,
                        battlesWonByLocation: f.battlesWonByLocation ?? {},
                        party: h,
                        box: p,
                        autoCatch: f.autoCatch ?? !0,
                        nextPokemonId: g,
                        currentLocation: f.currentLocation || "palletTown",
                        unlockedLocations: f.unlockedLocations || ["palletTown", "route1"],
                        battleLog: ["Game loaded!"],
                        evolutionState: null,
                        catchSettings: w,
                        globalCatchDefaults: f.globalCatchDefaults || {
                            enabled: !0,
                            mode: "always",
                            levelThreshold: 1,
                            enabledBalls: ["pokeball"]
                        },
                        money: f.money ?? 3e3,
                        inventory: f.inventory ?? {
                            pokeball: 20
                        },
                        trainerBattle: null,
                        bossBattle: null,
                        bossQueue: [],
                        activePlayerPokemonIndex: 0,
                        healingState: null,
                        pendingBossBattle: null,
                        pokedexSeen: k,
                        pokedexCaught: A,
                        shinyCaught: f.shinyCaught || [],
                        shinySeen: f.shinySeen || [],
                        alwaysCatchShinies: f.alwaysCatchShinies ?? !0,
                        defeatedGyms: f.defeatedGyms || [],
                        defeatedEliteFour: f.defeatedEliteFour || [],
                        championDefeated: f.championDefeated ?? !1,
                        victoryTokens: f.victoryTokens ?? 0,
                        autoProceed: f.autoProceed ?? !1,
                        raidCooldownEnd: f.raidCooldownEnd ?? null,
                        raidLegendary: f.inRaid ? f.raidLegendary ?? null : null,
                        inRaid: f.inRaid ?? !1,
                        raidLevel: f.inRaid ? f.raidLevel ?? 0 : 0,
                        preRaidLocation: f.inRaid ? f.preRaidLocation ?? null : null,
                        activeEffects: f.activeEffects ?? [],
                        ...f.inRaid ? {
                            currentLocation: "raidIsland"
                        } : {}
                    }
                }
            }
        } catch {}
        return o
    }
    );
    return O.useEffect( () => {
        if (u.playerPokemon && (u.phase === "idle" || u.phase === "victory")) {
            const o = {
                playerPokemon: u.playerPokemon,
                currentRoute: u.currentRoute,
                speed: u.speed,
                wildBattlesWon: u.wildBattlesWon,
                trainerBattlesWon: u.trainerBattlesWon,
                battlesWonByLocation: u.battlesWonByLocation,
                party: u.party,
                box: u.box,
                autoCatch: u.autoCatch,
                nextPokemonId: u.nextPokemonId,
                currentLocation: u.currentLocation,
                unlockedLocations: u.unlockedLocations,
                catchSettings: u.catchSettings,
                globalCatchDefaults: u.globalCatchDefaults,
                alwaysCatchShinies: u.alwaysCatchShinies,
                money: u.money,
                inventory: u.inventory,
                pokedexSeen: u.pokedexSeen,
                pokedexCaught: u.pokedexCaught,
                shinyCaught: u.shinyCaught,
                shinySeen: u.shinySeen,
                defeatedGyms: u.defeatedGyms,
                defeatedEliteFour: u.defeatedEliteFour,
                championDefeated: u.championDefeated,
                victoryTokens: u.victoryTokens,
                autoProceed: u.autoProceed,
                raidCooldownEnd: u.raidCooldownEnd,
                raidLegendary: u.raidLegendary,
                inRaid: u.inRaid,
                raidLevel: u.raidLevel,
                preRaidLocation: u.preRaidLocation,
                activeEffects: u.activeEffects
            };
            localStorage.setItem(ff, JSON.stringify(o))
        }
    }
    , [u.phase, u.playerPokemon?.level, u.playerPokemon?.totalExp, u.party.length, u.box.length, u.catchSettings, u.money, u.inventory, u.pokedexSeen.length, u.pokedexCaught.length, u.shinyCaught.length, u.shinySeen.length, u.alwaysCatchShinies, u.defeatedGyms.length, u.defeatedEliteFour.length, u.championDefeated, u.victoryTokens, u.autoProceed, u.raidCooldownEnd, u.activeEffects]),
    c.jsx(Bf.Provider, {
        value: {
            state: u,
            dispatch: d
        },
        children: s
    })
}
function Re() {
    const s = O.useContext(Bf);
    if (!s)
        throw new Error("useGame must be used within GameProvider");
    return s
}
const shinyFullOddsChance = 8192
  , shinyWithCharmChance = 4096;
function checkShinyOdds(isDexComplete=!1) {
    const odds = isDexComplete ? shinyWithCharmChance : shinyFullOddsChance;
    return Math.floor(Math.random() * odds) === 0
}
function resolveActiveModifiers(s, u) {
    const d = [];
    for (const o of s)
        o.type === "repel" && o.routeKey === u && o.speciesKey ? d.push({
            speciesKey: o.speciesKey,
            multiplier: .5
        }) : o.type === "honey" && o.routeKey === u && o.speciesKey && d.push({
            speciesKey: o.speciesKey,
            multiplier: 2
        });
    return d
}
function resolvePokemonEncounter(s, u, d=!1) {
    const o = s.encounters.map(x => {
        const h = u?.find(p => p.speciesKey === x.speciesKey);
        return h ? {
            ...x,
            weight: x.weight * h.multiplier
        } : x
    }
    )
      , y = o.reduce( (x, h) => x + h.weight, 0);
    let f = Math.random() * y;
    for (const x of o)
        if (f -= x.weight,
        f <= 0) {
            const h = x.minLevel + Math.floor(Math.random() * (x.maxLevel - x.minLevel + 1));
            return {
                species: pokemonSpecies[x.speciesKey],
                speciesKey: x.speciesKey,
                level: h,
                isShiny: checkShinyOdds(d)
            }
        }
    const g = o[o.length - 1];
    return {
        species: pokemonSpecies[g.speciesKey],
        speciesKey: g.speciesKey,
        level: g.minLevel,
        isShiny: checkShinyOdds(d)
    }
}
const Qh = ["bulbasaur", "charmander", "squirtle"];
function Ih() {
    const {dispatch: s} = Re();
    return c.jsxs("div", {
        className: "starter-select",
        children: [c.jsx("h2", {
            className: "starter-title",
            children: "Choose Your Starter!"
        }), c.jsx("div", {
            className: "starter-cards",
            children: Qh.map(u => {
                const d = pokemonSpecies[u]
                  , o = calculatePokemonStats(d, 5, {
                    hp: 15,
                    attack: 15,
                    defense: 15,
                    spAttack: 15,
                    spDefense: 15,
                    speed: 15
                });
                return c.jsxs("div", {
                    className: "starter-card",
                    onClick: () => s({
                        type: "SELECT_STARTER",
                        payload: {
                            speciesKey: u,
                            isShiny: checkShinyOdds()
                        }
                    }),
                    children: [c.jsx("img", {
                        src: getPokemonSpriteUrl(d.id),
                        onError: e => e.target.src = '/assets/sprites/pokemon/0.gif',
                        alt: d.name,
                        className: "starter-sprite"
                    }), c.jsx("h3", {
                        children: d.name
                    }), c.jsx("div", {
                        className: "starter-types",
                        children: d.types.map(y => c.jsx("span", {
                            className: `type-badge type-${y.toLowerCase()}`,
                            children: y
                        }, y))
                    }), c.jsxs("div", {
                        className: "starter-stats",
                        children: [c.jsxs("div", {
                            children: ["HP: ", o.hp]
                        }), c.jsxs("div", {
                            children: ["ATK: ", o.attack]
                        }), c.jsxs("div", {
                            children: ["DEF: ", o.defense]
                        }), c.jsxs("div", {
                            children: ["SP.A: ", o.spAttack]
                        }), c.jsxs("div", {
                            children: ["SP.D: ", o.spDefense]
                        }), c.jsxs("div", {
                            children: ["SPD: ", o.speed]
                        })]
                    }), c.jsx("button", {
                        className: "choose-btn",
                        children: "Choose!"
                    })]
                }, u)
            }
            )
        })]
    })
}
var Zh = Df();
function Jo({current: s, max: u}) {
    const d = Math.max(0, Math.min(100, s / u * 100))
      , o = d > 50 ? "#30c855" : d > 20 ? "#e8c030" : "#e04038";
    return c.jsxs("div", {
        className: "hp-bar",
        children: [c.jsx("span", {
            className: "hp-label",
            children: "HP"
        }), c.jsx("div", {
            className: "hp-track",
            children: c.jsx("div", {
                className: "hp-fill",
                style: {
                    width: `${d}%`,
                    backgroundColor: o,
                    transition: "width 0.5s ease, background-color 0.5s ease"
                }
            })
        })]
    })
}
function Of({speciesKey: s, level: u, totalExp: d}) {
    const o = pokemonSpecies[s];
    if (!o)
        return null;
    const y = calculateRequiredExperience(u, o.growthRate)
      , f = calculateRequiredExperience(u + 1, o.growthRate)
      , g = d - y
      , x = f - y
      , h = x > 0 ? Math.min(100, g / x * 100) : 100;
    return c.jsxs("div", {
        className: "exp-bar",
        children: [c.jsx("span", {
            className: "exp-label",
            children: "EXP"
        }), c.jsx("div", {
            className: "exp-track",
            children: c.jsx("div", {
                className: "exp-fill",
                style: {
                    width: `${h}%`,
                    transition: "width 0.5s ease"
                }
            })
        })]
    })
}
function Fh({pokemon: s}) {
    return c.jsxs("div", {
        className: "info-box",
        children: [c.jsxs("div", {
            className: "info-name-row",
            children: [s.isShiny && c.jsx("span", {
                className: "shiny-star",
                children: "★"
            }), c.jsx("span", {
                className: "info-pokemon-name",
                children: s.name.toUpperCase()
            }), c.jsxs("span", {
                className: "info-pokemon-level",
                children: ["Lv.", s.level]
            })]
        }), c.jsx(Jo, {
            current: s.currentHp,
            max: s.maxHp
        }), c.jsxs("div", {
            className: "info-hp-numbers",
            children: [s.currentHp, "/ ", s.maxHp]
        }), c.jsx(Of, {
            speciesKey: s.speciesKey,
            level: s.level,
            totalExp: s.totalExp
        })]
    })
}
function Jh({pokemon: s}) {
    return c.jsxs("div", {
        className: "info-box",
        children: [c.jsxs("div", {
            className: "info-name-row",
            children: [s.isShiny && c.jsx("span", {
                className: "shiny-star",
                children: "★"
            }), c.jsx("span", {
                className: "info-pokemon-name",
                children: s.name.toUpperCase()
            }), c.jsxs("span", {
                className: "info-pokemon-level",
                children: ["Lv.", s.level]
            })]
        }), c.jsx(Jo, {
            current: s.currentHp,
            max: s.maxHp
        }), c.jsxs("div", {
            className: "info-hp-numbers",
            children: [s.currentHp, "/ ", s.maxHp]
        })]
    })
}
function Wh(s, u=30) {
    const [d,o] = O.useState("")
      , [y,f] = O.useState(!1)
      , g = O.useRef(0);
    return O.useEffect( () => {
        if (o(""),
        f(!1),
        g.current = 0,
        !s) {
            f(!0);
            return
        }
        const x = setInterval( () => {
            g.current++,
            g.current >= s.length ? (o(s),
            f(!0),
            clearInterval(x)) : o(s.slice(0, g.current))
        }
        , u);
        return () => clearInterval(x)
    }
    , [s, u]),
    {
        displayed: d,
        isComplete: y
    }
}
function $h({event: s, speed: u, isAtTown: d}) {
    const o = Math.max(5, 30 / u)
      , y = d ? "Looking for trainers..." : "Searching for wild Pokémon..."
      , f = s?.message ?? y
      , {displayed: g} = Wh(f, o);
    return c.jsx("div", {
        className: "battle-text-box",
        children: c.jsx("div", {
            className: "text-box-inner",
            children: c.jsxs("p", {
                children: [g, c.jsx("span", {
                    className: "text-cursor",
                    children: "▼"
                })]
            })
        })
    })
}
const eg = [1, 2, 5, 25];
function tg() {
    const {state: s, dispatch: u} = Re();
    return c.jsxs("div", {
        className: "speed-controls",
        children: [c.jsx("button", {
            className: `speed-btn pause-btn ${s.paused ? "active" : ""}`,
            onClick: () => u({
                type: "TOGGLE_PAUSE"
            }),
            children: s.paused ? "▶" : "⏸"
        }), eg.map(d => c.jsxs("button", {
            className: `speed-btn ${!s.paused && s.speed === d ? "active" : ""}`,
            onClick: () => {
                s.paused && u({
                    type: "TOGGLE_PAUSE"
                }),
                u({
                    type: "SET_SPEED",
                    payload: {
                        speed: d
                    }
                })
            }
            ,
            children: [d, "x"]
        }, d))]
    })
}
let moveData = {
    tackle: {
        name: "Tackle",
        type: "Normal",
        category: "physical",
        power: 40,
        accuracy: 100,
        pp: 35,
        priority: 0
    },
    scratch: {
        name: "Scratch",
        type: "Normal",
        category: "physical",
        power: 40,
        accuracy: 100,
        pp: 35,
        priority: 0
    },
    pound: {
        name: "Pound",
        type: "Normal",
        category: "physical",
        power: 40,
        accuracy: 100,
        pp: 35,
        priority: 0
    },
    quickAttack: {
        name: "Quick Attack",
        type: "Normal",
        category: "physical",
        power: 40,
        accuracy: 100,
        pp: 30,
        priority: 1
    },
    headbutt: {
        name: "Headbutt",
        type: "Normal",
        category: "physical",
        power: 70,
        accuracy: 100,
        pp: 15,
        priority: 0
    },
    hyperFang: {
        name: "Hyper Fang",
        type: "Normal",
        category: "physical",
        power: 80,
        accuracy: 90,
        pp: 15,
        priority: 0
    },
    tailWhip: {
        name: "Tail Whip",
        type: "Normal",
        category: "status",
        power: 0,
        accuracy: 100,
        pp: 30,
        priority: 0,
        effect: {
            type: "statChange",
            target: "opponent",
            changes: {
                defense: -1
            }
        }
    },
    growl: {
        name: "Growl",
        type: "Normal",
        category: "status",
        power: 0,
        accuracy: 100,
        pp: 40,
        priority: 0,
        effect: {
            type: "statChange",
            target: "opponent",
            changes: {
                attack: -1
            }
        }
    },
    leer: {
        name: "Leer",
        type: "Normal",
        category: "status",
        power: 0,
        accuracy: 100,
        pp: 30,
        priority: 0,
        effect: {
            type: "statChange",
            target: "opponent",
            changes: {
                defense: -1
            }
        }
    },
    focusEnergy: {
        name: "Focus Energy",
        type: "Normal",
        category: "status",
        power: 0,
        accuracy: 100,
        pp: 30,
        priority: 0
    },
    ember: {
        name: "Ember",
        type: "Fire",
        category: "special",
        power: 40,
        accuracy: 100,
        pp: 25,
        priority: 0
    },
    fireSpin: {
        name: "Fire Spin",
        type: "Fire",
        category: "special",
        power: 35,
        accuracy: 85,
        pp: 15,
        priority: 0
    },
    flamethrower: {
        name: "Flamethrower",
        type: "Fire",
        category: "special",
        power: 90,
        accuracy: 100,
        pp: 15,
        priority: 0
    },
    waterGun: {
        name: "Water Gun",
        type: "Water",
        category: "special",
        power: 40,
        accuracy: 100,
        pp: 25,
        priority: 0
    },
    bubble: {
        name: "Bubble",
        type: "Water",
        category: "special",
        power: 40,
        accuracy: 100,
        pp: 30,
        priority: 0
    },
    waterPulse: {
        name: "Water Pulse",
        type: "Water",
        category: "special",
        power: 60,
        accuracy: 100,
        pp: 20,
        priority: 0
    },
    bite: {
        name: "Bite",
        type: "Dark",
        category: "physical",
        power: 60,
        accuracy: 100,
        pp: 25,
        priority: 0
    },
    vineWhip: {
        name: "Vine Whip",
        type: "Grass",
        category: "physical",
        power: 45,
        accuracy: 100,
        pp: 25,
        priority: 0
    },
    razorLeaf: {
        name: "Razor Leaf",
        type: "Grass",
        category: "physical",
        power: 55,
        accuracy: 95,
        pp: 25,
        priority: 0
    },
    leechSeed: {
        name: "Leech Seed",
        type: "Grass",
        category: "status",
        power: 0,
        accuracy: 90,
        pp: 10,
        priority: 0
    },
    sleepPowder: {
        name: "Sleep Powder",
        type: "Grass",
        category: "status",
        power: 0,
        accuracy: 75,
        pp: 15,
        priority: 0
    },
    poisonPowder: {
        name: "Poison Powder",
        type: "Poison",
        category: "status",
        power: 0,
        accuracy: 75,
        pp: 35,
        priority: 0
    },
    thunderShock: {
        name: "Thunder Shock",
        type: "Electric",
        category: "special",
        power: 40,
        accuracy: 100,
        pp: 30,
        priority: 0
    },
    thunderWave: {
        name: "Thunder Wave",
        type: "Electric",
        category: "status",
        power: 0,
        accuracy: 90,
        pp: 20,
        priority: 0
    },
    thunderbolt: {
        name: "Thunderbolt",
        type: "Electric",
        category: "special",
        power: 90,
        accuracy: 100,
        pp: 15,
        priority: 0
    },
    stringShot: {
        name: "String Shot",
        type: "Bug",
        category: "status",
        power: 0,
        accuracy: 95,
        pp: 40,
        priority: 0
    },
    bugBite: {
        name: "Bug Bite",
        type: "Bug",
        category: "physical",
        power: 60,
        accuracy: 100,
        pp: 20,
        priority: 0
    },
    poisonSting: {
        name: "Poison Sting",
        type: "Poison",
        category: "physical",
        power: 15,
        accuracy: 100,
        pp: 35,
        priority: 0
    },
    gust: {
        name: "Gust",
        type: "Flying",
        category: "special",
        power: 40,
        accuracy: 100,
        pp: 35,
        priority: 0
    },
    wingAttack: {
        name: "Wing Attack",
        type: "Flying",
        category: "physical",
        power: 60,
        accuracy: 100,
        pp: 35,
        priority: 0
    },
    sludge: {
        name: "Sludge",
        type: "Poison",
        category: "special",
        power: 65,
        accuracy: 100,
        pp: 20,
        priority: 0
    },
    dragonRage: {
        name: "Dragon Rage",
        type: "Dragon",
        category: "special",
        power: 40,
        accuracy: 100,
        pp: 10,
        priority: 0
    },
    metalClaw: {
        name: "Metal Claw",
        type: "Steel",
        category: "physical",
        power: 50,
        accuracy: 95,
        pp: 35,
        priority: 0
    },
    sing: {
        name: "Sing",
        type: "Normal",
        category: "status",
        power: 0,
        accuracy: 55,
        pp: 15,
        priority: 0
    },
    doubleSlap: {
        name: "Double Slap",
        type: "Normal",
        category: "physical",
        power: 15,
        accuracy: 85,
        pp: 10,
        priority: 0
    },
    defense_curl: {
        name: "Defense Curl",
        type: "Normal",
        category: "status",
        power: 0,
        accuracy: 100,
        pp: 40,
        priority: 0,
        effect: {
            type: "statChange",
            target: "self",
            changes: {
                defense: 1
            }
        }
    },
    disable: {
        name: "Disable",
        type: "Normal",
        category: "status",
        power: 0,
        accuracy: 100,
        pp: 20,
        priority: 0
    },
    furyAttack: {
        name: "Fury Attack",
        type: "Normal",
        category: "physical",
        power: 15,
        accuracy: 85,
        pp: 20,
        priority: 0
    },
    petalDance: {
        name: "Petal Dance",
        type: "Grass",
        category: "special",
        power: 120,
        accuracy: 100,
        pp: 10,
        priority: 0,
        effect: {
            type: "multiTurnLock",
            minTurns: 2,
            maxTurns: 3,
            selfDamage: .125
        }
    },
    peck: {
        name: "Peck",
        type: "Flying",
        category: "physical",
        power: 35,
        accuracy: 100,
        pp: 35,
        priority: 0
    },
    mirrorMove: {
        name: "Mirror Move",
        type: "Flying",
        category: "status",
        power: 0,
        accuracy: 100,
        pp: 20,
        priority: 0
    },
    leechLife: {
        name: "Leech Life",
        type: "Bug",
        category: "physical",
        power: 80,
        accuracy: 100,
        pp: 10,
        priority: 0
    },
    doubleKick: {
        name: "Double Kick",
        type: "Fighting",
        category: "physical",
        power: 30,
        accuracy: 100,
        pp: 30,
        priority: 0
    },
    hornAttack: {
        name: "Horn Attack",
        type: "Normal",
        category: "physical",
        power: 65,
        accuracy: 100,
        pp: 25,
        priority: 0
    },
    disarmingVoice: {
        name: "Disarming Voice",
        type: "Fairy",
        category: "special",
        power: 40,
        accuracy: 100,
        pp: 15,
        priority: 0
    },
    rollout: {
        name: "Rollout",
        type: "Rock",
        category: "physical",
        power: 30,
        accuracy: 90,
        pp: 20,
        priority: 0
    },
    bodySlam: {
        name: "Body Slam",
        type: "Normal",
        category: "physical",
        power: 85,
        accuracy: 100,
        pp: 15,
        priority: 0
    },
    absorb: {
        name: "Absorb",
        type: "Grass",
        category: "special",
        power: 20,
        accuracy: 100,
        pp: 25,
        priority: 0
    },
    supersonic: {
        name: "Supersonic",
        type: "Normal",
        category: "status",
        power: 0,
        accuracy: 55,
        pp: 20,
        priority: 0
    },
    confuseRay: {
        name: "Confuse Ray",
        type: "Ghost",
        category: "status",
        power: 0,
        accuracy: 100,
        pp: 10,
        priority: 0
    },
    airCutter: {
        name: "Air Cutter",
        type: "Flying",
        category: "special",
        power: 60,
        accuracy: 95,
        pp: 25,
        priority: 0
    },
    harden: {
        name: "Harden",
        type: "Normal",
        category: "status",
        power: 0,
        accuracy: 100,
        pp: 30,
        priority: 0,
        effect: {
            type: "statChange",
            target: "self",
            changes: {
                defense: 1
            }
        }
    },
    rockThrow: {
        name: "Rock Throw",
        type: "Rock",
        category: "physical",
        power: 50,
        accuracy: 90,
        pp: 15,
        priority: 0
    },
    rockSlide: {
        name: "Rock Slide",
        type: "Rock",
        category: "physical",
        power: 75,
        accuracy: 90,
        pp: 10,
        priority: 0
    },
    magnitude: {
        name: "Magnitude",
        type: "Ground",
        category: "physical",
        power: 70,
        accuracy: 100,
        pp: 30,
        priority: 0
    },
    earthquake: {
        name: "Earthquake",
        type: "Ground",
        category: "physical",
        power: 100,
        accuracy: 100,
        pp: 10,
        priority: 0
    },
    boneClub: {
        name: "Bone Club",
        type: "Ground",
        category: "physical",
        power: 65,
        accuracy: 85,
        pp: 20,
        priority: 0
    },
    bonemerang: {
        name: "Bonemerang",
        type: "Ground",
        category: "physical",
        power: 50,
        accuracy: 90,
        pp: 10,
        priority: 0
    },
    dig: {
        name: "Dig",
        type: "Ground",
        category: "physical",
        power: 80,
        accuracy: 100,
        pp: 10,
        priority: 0
    },
    slash: {
        name: "Slash",
        type: "Normal",
        category: "physical",
        power: 70,
        accuracy: 100,
        pp: 20,
        priority: 0
    },
    stomp: {
        name: "Stomp",
        type: "Normal",
        category: "physical",
        power: 65,
        accuracy: 100,
        pp: 20,
        priority: 0
    },
    takeDown: {
        name: "Take Down",
        type: "Normal",
        category: "physical",
        power: 90,
        accuracy: 85,
        pp: 20,
        priority: 0,
        effect: {
            type: "recoil",
            fraction: .25
        }
    },
    megaPunch: {
        name: "Mega Punch",
        type: "Normal",
        category: "physical",
        power: 80,
        accuracy: 85,
        pp: 20,
        priority: 0
    },
    slam: {
        name: "Slam",
        type: "Normal",
        category: "physical",
        power: 80,
        accuracy: 75,
        pp: 20,
        priority: 0
    },
    swift: {
        name: "Swift",
        type: "Normal",
        category: "special",
        power: 60,
        accuracy: 100,
        pp: 20,
        priority: 0
    },
    triAttack: {
        name: "Tri Attack",
        type: "Normal",
        category: "special",
        power: 80,
        accuracy: 100,
        pp: 10,
        priority: 0
    },
    bind: {
        name: "Bind",
        type: "Normal",
        category: "physical",
        power: 15,
        accuracy: 85,
        pp: 20,
        priority: 0
    },
    splash: {
        name: "Splash",
        type: "Normal",
        category: "status",
        power: 0,
        accuracy: 100,
        pp: 40,
        priority: 0
    },
    swordsDance: {
        name: "Swords Dance",
        type: "Normal",
        category: "status",
        power: 0,
        accuracy: 100,
        pp: 20,
        priority: 0,
        effect: {
            type: "statChange",
            target: "self",
            changes: {
                attack: 2
            }
        }
    },
    smokescreen: {
        name: "Smokescreen",
        type: "Normal",
        category: "status",
        power: 0,
        accuracy: 100,
        pp: 20,
        priority: 0
    },
    selfDestruct: {
        name: "Self-Destruct",
        type: "Normal",
        category: "physical",
        power: 200,
        accuracy: 100,
        pp: 5,
        priority: 0,
        effect: {
            type: "selfDestruct"
        }
    },
    glare: {
        name: "Glare",
        type: "Normal",
        category: "status",
        power: 0,
        accuracy: 100,
        pp: 30,
        priority: 0
    },
    sonicBoom: {
        name: "Sonic Boom",
        type: "Normal",
        category: "special",
        power: 20,
        accuracy: 90,
        pp: 20,
        priority: 0
    },
    teleport: {
        name: "Teleport",
        type: "Psychic",
        category: "status",
        power: 0,
        accuracy: 100,
        pp: 20,
        priority: 0
    },
    hypnosis: {
        name: "Hypnosis",
        type: "Psychic",
        category: "status",
        power: 0,
        accuracy: 60,
        pp: 20,
        priority: 0
    },
    confusion: {
        name: "Confusion",
        type: "Psychic",
        category: "special",
        power: 50,
        accuracy: 100,
        pp: 25,
        priority: 0
    },
    psybeam: {
        name: "Psybeam",
        type: "Psychic",
        category: "special",
        power: 65,
        accuracy: 100,
        pp: 20,
        priority: 0
    },
    psychic: {
        name: "Psychic",
        type: "Psychic",
        category: "special",
        power: 90,
        accuracy: 100,
        pp: 10,
        priority: 0
    },
    dreamEater: {
        name: "Dream Eater",
        type: "Psychic",
        category: "special",
        power: 100,
        accuracy: 100,
        pp: 15,
        priority: 0
    },
    clamp: {
        name: "Clamp",
        type: "Water",
        category: "physical",
        power: 35,
        accuracy: 85,
        pp: 15,
        priority: 0
    },
    lowKick: {
        name: "Low Kick",
        type: "Fighting",
        category: "physical",
        power: 50,
        accuracy: 100,
        pp: 20,
        priority: 0
    },
    karateChop: {
        name: "Karate Chop",
        type: "Fighting",
        category: "physical",
        power: 50,
        accuracy: 100,
        pp: 25,
        priority: 0
    },
    submission: {
        name: "Submission",
        type: "Fighting",
        category: "physical",
        power: 80,
        accuracy: 80,
        pp: 20,
        priority: 0,
        effect: {
            type: "recoil",
            fraction: .25
        }
    },
    seismicToss: {
        name: "Seismic Toss",
        type: "Fighting",
        category: "physical",
        power: 50,
        accuracy: 100,
        pp: 20,
        priority: 0
    },
    flameWheel: {
        name: "Flame Wheel",
        type: "Fire",
        category: "physical",
        power: 60,
        accuracy: 100,
        pp: 25,
        priority: 0
    },
    shadowBall: {
        name: "Shadow Ball",
        type: "Ghost",
        category: "special",
        power: 80,
        accuracy: 100,
        pp: 15,
        priority: 0
    },
    acid: {
        name: "Acid",
        type: "Poison",
        category: "special",
        power: 40,
        accuracy: 100,
        pp: 30,
        priority: 0
    },
    crunch: {
        name: "Crunch",
        type: "Dark",
        category: "physical",
        power: 80,
        accuracy: 100,
        pp: 15,
        priority: 0
    },
    icyWind: {
        name: "Icy Wind",
        type: "Ice",
        category: "special",
        power: 55,
        accuracy: 95,
        pp: 15,
        priority: 0
    },
    auroraBeam: {
        name: "Aurora Beam",
        type: "Ice",
        category: "special",
        power: 65,
        accuracy: 100,
        pp: 20,
        priority: 0
    },
    iceBeam: {
        name: "Ice Beam",
        type: "Ice",
        category: "special",
        power: 90,
        accuracy: 100,
        pp: 10,
        priority: 0
    },
    icicleCrash: {
        name: "Icicle Crash",
        type: "Ice",
        category: "physical",
        power: 85,
        accuracy: 90,
        pp: 10,
        priority: 0
    },
    thunderPunch: {
        name: "Thunder Punch",
        type: "Electric",
        category: "physical",
        power: 75,
        accuracy: 100,
        pp: 15,
        priority: 0
    },
    drillPeck: {
        name: "Drill Peck",
        type: "Flying",
        category: "physical",
        power: 80,
        accuracy: 100,
        pp: 20,
        priority: 0
    },
    megahorn: {
        name: "Megahorn",
        type: "Bug",
        category: "physical",
        power: 120,
        accuracy: 85,
        pp: 10,
        priority: 0
    },
    dragonBreath: {
        name: "Dragon Breath",
        type: "Dragon",
        category: "special",
        power: 60,
        accuracy: 100,
        pp: 20,
        priority: 0
    },
    fireBlast: {
        name: "Fire Blast",
        type: "Fire",
        category: "special",
        power: 110,
        accuracy: 85,
        pp: 5,
        priority: 0
    },
    firePunch: {
        name: "Fire Punch",
        type: "Fire",
        category: "physical",
        power: 75,
        accuracy: 100,
        pp: 15,
        priority: 0
    },
    surf: {
        name: "Surf",
        type: "Water",
        category: "special",
        power: 90,
        accuracy: 100,
        pp: 15,
        priority: 0
    },
    hydroPump: {
        name: "Hydro Pump",
        type: "Water",
        category: "special",
        power: 110,
        accuracy: 80,
        pp: 5,
        priority: 0
    },
    bubbleBeam: {
        name: "Bubble Beam",
        type: "Water",
        category: "special",
        power: 65,
        accuracy: 100,
        pp: 20,
        priority: 0
    },
    blizzard: {
        name: "Blizzard",
        type: "Ice",
        category: "special",
        power: 110,
        accuracy: 70,
        pp: 5,
        priority: 0
    },
    icePunch: {
        name: "Ice Punch",
        type: "Ice",
        category: "physical",
        power: 75,
        accuracy: 100,
        pp: 15,
        priority: 0
    },
    barrier: {
        name: "Barrier",
        type: "Psychic",
        category: "status",
        power: 0,
        accuracy: 100,
        pp: 20,
        priority: 0,
        effect: {
            type: "statChange",
            target: "self",
            changes: {
                defense: 2
            }
        }
    },
    amnesia: {
        name: "Amnesia",
        type: "Psychic",
        category: "status",
        power: 0,
        accuracy: 100,
        pp: 20,
        priority: 0,
        effect: {
            type: "statChange",
            target: "self",
            changes: {
                spDefense: 2
            }
        }
    },
    crossChop: {
        name: "Cross Chop",
        type: "Fighting",
        category: "physical",
        power: 100,
        accuracy: 80,
        pp: 5,
        priority: 0
    },
    highJumpKick: {
        name: "High Jump Kick",
        type: "Fighting",
        category: "physical",
        power: 100,
        accuracy: 90,
        pp: 10,
        priority: 0,
        effect: {
            type: "crashOnMiss",
            fraction: .5
        }
    },
    cometPunch: {
        name: "Comet Punch",
        type: "Normal",
        category: "physical",
        power: 18,
        accuracy: 85,
        pp: 15,
        priority: 0
    },
    megaKick: {
        name: "Mega Kick",
        type: "Normal",
        category: "physical",
        power: 120,
        accuracy: 75,
        pp: 5,
        priority: 0
    },
    counter: {
        name: "Counter",
        type: "Fighting",
        category: "physical",
        power: 50,
        accuracy: 100,
        pp: 20,
        priority: 0
    },
    furySwipes: {
        name: "Fury Swipes",
        type: "Normal",
        category: "physical",
        power: 18,
        accuracy: 80,
        pp: 15,
        priority: 0
    },
    hyperBeam: {
        name: "Hyper Beam",
        type: "Normal",
        category: "special",
        power: 150,
        accuracy: 90,
        pp: 5,
        priority: 0,
        effect: {
            type: "recharge"
        }
    },
    wrap: {
        name: "Wrap",
        type: "Normal",
        category: "physical",
        power: 15,
        accuracy: 90,
        pp: 20,
        priority: 0
    },
    rage: {
        name: "Rage",
        type: "Normal",
        category: "physical",
        power: 20,
        accuracy: 100,
        pp: 20,
        priority: 0
    },
    skyAttack: {
        name: "Sky Attack",
        type: "Flying",
        category: "physical",
        power: 140,
        accuracy: 90,
        pp: 5,
        priority: 0
    },
    dragonClaw: {
        name: "Dragon Claw",
        type: "Dragon",
        category: "physical",
        power: 80,
        accuracy: 100,
        pp: 15,
        priority: 0
    },
    outrage: {
        name: "Outrage",
        type: "Dragon",
        category: "physical",
        power: 120,
        accuracy: 100,
        pp: 10,
        priority: 0,
        effect: {
            type: "multiTurnLock",
            minTurns: 2,
            maxTurns: 3,
            selfDamage: .125
        }
    },
    pinMissile: {
        name: "Pin Missile",
        type: "Bug",
        category: "physical",
        power: 25,
        accuracy: 95,
        pp: 20,
        priority: 0
    },
    signalBeam: {
        name: "Signal Beam",
        type: "Bug",
        category: "special",
        power: 75,
        accuracy: 100,
        pp: 15,
        priority: 0
    },
    sludgeBomb: {
        name: "Sludge Bomb",
        type: "Poison",
        category: "special",
        power: 90,
        accuracy: 100,
        pp: 10,
        priority: 0
    },
    toxic: {
        name: "Toxic",
        type: "Poison",
        category: "status",
        power: 0,
        accuracy: 90,
        pp: 10,
        priority: 0
    },
    ancientPower: {
        name: "Ancient Power",
        type: "Rock",
        category: "special",
        power: 60,
        accuracy: 100,
        pp: 5,
        priority: 0
    },
    sandAttack: {
        name: "Sand Attack",
        type: "Ground",
        category: "status",
        power: 0,
        accuracy: 100,
        pp: 15,
        priority: 0
    },
    rest: {
        name: "Rest",
        type: "Psychic",
        category: "status",
        power: 0,
        accuracy: 100,
        pp: 10,
        priority: 0
    },
    snore: {
        name: "Snore",
        type: "Normal",
        category: "special",
        power: 50,
        accuracy: 100,
        pp: 15,
        priority: 0
    },
    perishSong: {
        name: "Perish Song",
        type: "Normal",
        category: "status",
        power: 0,
        accuracy: 100,
        pp: 5,
        priority: 0
    },
    conversion: {
        name: "Conversion",
        type: "Normal",
        category: "status",
        power: 0,
        accuracy: 100,
        pp: 30,
        priority: 0
    },
    sharpen: {
        name: "Sharpen",
        type: "Normal",
        category: "status",
        power: 0,
        accuracy: 100,
        pp: 30,
        priority: 0,
        effect: {
            type: "statChange",
            target: "self",
            changes: {
                attack: 1
            }
        }
    },
    lightScreen: {
        name: "Light Screen",
        type: "Psychic",
        category: "status",
        power: 0,
        accuracy: 100,
        pp: 30,
        priority: 0
    },
    reflect: {
        name: "Reflect",
        type: "Psychic",
        category: "status",
        power: 0,
        accuracy: 100,
        pp: 20,
        priority: 0
    },
    sandstorm: {
        name: "Sandstorm",
        type: "Rock",
        category: "status",
        power: 0,
        accuracy: 100,
        pp: 10,
        priority: 0
    }
}
  , mf = {
    physical: "✴",
    special: "◎",
    status: "☯"
};
function ag({onClose: s}) {
    const {state: u, dispatch: d} = Re()
      , o = u.playerPokemon
      , y = o.id
      , [f,g] = O.useState([...o.moves])
      , x = Mh(o.speciesKey, o.level)
      , h = pokemonSpecies[o.speciesKey];
    function p(k) {
        f.includes(k) ? f.length > 1 && g(f.filter(A => A !== k)) : f.length < 4 && g([...f, k])
    }
    function w() {
        if (u.playerPokemon?.id !== y) {
            s();
            return
        }
        d({
            type: "SET_MOVES",
            payload: {
                moves: f
            }
        }),
        s()
    }
    return c.jsx("div", {
        className: "move-panel-overlay",
        onClick: s,
        children: c.jsxs("div", {
            className: "move-panel",
            onClick: k => k.stopPropagation(),
            children: [c.jsxs("div", {
                className: "move-panel-header",
                children: [c.jsx("span", {
                    className: "move-panel-title",
                    children: "Manage Moves"
                }), c.jsxs("span", {
                    className: "move-panel-species",
                    children: [h.name, " Lv.", o.level]
                })]
            }), c.jsxs("div", {
                className: "move-panel-section-label",
                children: ["Current Moves (", f.length, "/4)"]
            }), c.jsx("div", {
                className: "move-panel-slots",
                children: [0, 1, 2, 3].map(k => {
                    const A = f[k]
                      , v = A ? moveData[A] : null;
                    return v ? c.jsxs("div", {
                        className: `move-panel-slot type-bg-${v.type.toLowerCase()}`,
                        onClick: () => p(A),
                        children: [c.jsx("span", {
                            className: "move-panel-slot-icon",
                            children: mf[v.category]
                        }), c.jsx("span", {
                            className: "move-panel-slot-name",
                            children: v.name
                        })]
                    }, k) : c.jsx("div", {
                        className: "move-panel-slot empty",
                        children: "---"
                    }, k)
                }
                )
            }), c.jsx("div", {
                className: "move-panel-section-label",
                children: "Available Moves"
            }), c.jsx("div", {
                className: "move-panel-list",
                children: x.map( ({moveId: k, learnLevel: A}) => {
                    const v = moveData[k];
                    if (!v)
                        return null;
                    const _ = f.includes(k);
                    return c.jsxs("div", {
                        className: `move-panel-item type-bg-${v.type.toLowerCase()} ${_ ? "selected" : ""}`,
                        onClick: () => p(k),
                        children: [c.jsx("span", {
                            className: "move-panel-item-icon",
                            children: mf[v.category]
                        }), c.jsx("span", {
                            className: "move-panel-item-name",
                            children: v.name
                        }), c.jsx("span", {
                            className: "move-panel-item-stats",
                            children: v.power > 0 ? v.power : "---"
                        }), c.jsxs("span", {
                            className: "move-panel-item-stats",
                            children: [v.accuracy, "%"]
                        }), c.jsxs("span", {
                            className: "move-panel-item-level",
                            children: ["Lv.", A]
                        })]
                    }, k)
                }
                )
            }), c.jsxs("div", {
                className: "move-panel-buttons",
                children: [c.jsx("button", {
                    className: "move-panel-btn cancel",
                    onClick: s,
                    children: "Cancel"
                }), c.jsx("button", {
                    className: "move-panel-btn confirm",
                    onClick: w,
                    children: "Confirm"
                })]
            })]
        })
    })
}
function ng() {
    const {state: s, dispatch: u} = Re()
      , d = s.evolutionState;
    if (O.useEffect( () => {
        if (!d)
            return;
        const p = s.speed || 1;
        const h = setTimeout( () => {
            u({
                type: "EVOLUTION_STEP",
                payload: {
                    step: "swap"
                }
            })
        }
        , 2500 / p)
          , f = setTimeout( () => {
            u({
                type: "EVOLUTION_STEP",
                payload: {
                    step: "done"
                }
            })
        }
        , 3500 / p)
          , w = setTimeout( () => {
            u({
                type: "COMPLETE_EVOLUTION"
            })
        }
        , 5500 / p);
        return () => {
            clearTimeout(h),
            clearTimeout(f),
            clearTimeout(w)
        }
    }
    , [u, s.speed]),
    !d)
        return null;
    const o = pokemonSpecies[d.fromSpeciesKey]
      , y = pokemonSpecies[d.toSpeciesKey]
      , f = d.step === "swap" || d.step === "done"
      , g = d.step === "flash" ? "evo-sprite evo-flash" : d.step === "swap" ? "evo-sprite evo-burst" : "evo-sprite evo-glow"
      , x = d.step === "done" ? `${o.name} evolved into ${y.name}!` : `What? ${o.name} is evolving!`;
    return c.jsxs("div", {
        className: "evolution-scene",
        children: [c.jsx("div", {
            className: "evolution-bg"
        }), c.jsx("div", {
            className: "evolution-sprite-container",
            children: c.jsx("img", {
                className: g,
                src: getPokemonSpriteUrl(f ? y.id : o.id, !1, d.isShiny),
                onError: e => e.target.src = '/assets/sprites/pokemon/0.gif',
                alt: f ? y.name : o.name
            })
        }), c.jsx("div", {
            className: "evolution-text",
            children: c.jsx("p", {
                children: x
            })
        })]
    })
}
function lg() {
    const {state: s, dispatch: u} = Re()
      , d = s.healingState
      , o = O.useRef(null);
    if (O.useEffect( () => {
        if (!d)
            return;
        const p = s.speed || 1;
        const f = setTimeout( () => {
            u({
                type: "HEALING_STEP",
                payload: {
                    step: "healing"
                }
            })
        }
        , 250 / p)
          , g = setTimeout( () => {
            u({
                type: "HEALING_STEP",
                payload: {
                    step: "done"
                }
            })
        }
        , 3e3 / p)
          , x = setTimeout( () => {
            u({
                type: "COMPLETE_HEALING"
            })
        }
        , 3750 / p);
        return () => {
            clearTimeout(f),
            clearTimeout(g),
            clearTimeout(x)
        }
    }
    , [u, s.speed]),
    O.useEffect( () => {
        if (!d)
            return;
        const f = o.current;
        if (!f)
            return;
        const g = () => {
            f.currentTime = 0,
            f.playbackRate = 2.5,
            f.play().catch( () => {}
            )
        }
        ;
        if (f.readyState >= 3)
            g();
        else
            return f.addEventListener("canplay", g, {
                once: !0
            }),
            () => f.removeEventListener("canplay", g)
    }
    , [d]),
    !d)
        return null;
    const y = d.step === "done" ? "Your Pokemon are fully healed!" : "Healing your Pokemon...";
    return c.jsxs("div", {
        className: "heal-scene",
        children: [c.jsx("video", {
            ref: o,
            className: "heal-video",
            src: "/heal-animation-web.mp4",
            muted: !0,
            playsInline: !0,
            preload: "auto"
        }), d.step === "healing" && c.jsx("div", {
            className: "heal-flash-overlay"
        }), d.step === "done" && c.jsx("div", {
            className: "heal-done-flash"
        }), c.jsx("div", {
            className: "heal-text",
            children: c.jsx("p", {
                children: y
            })
        })]
    })
}
const ig = "pokemon-idle-save";
function sg({onClose: s}) {
    const [u,d] = O.useState(!1);
    function o() {
        localStorage.removeItem(ig),
        window.location.reload()
    }
    return c.jsx("div", {
        className: "battle-info-overlay",
        onClick: s,
        children: c.jsxs("div", {
            className: "battle-info-modal",
            onClick: y => y.stopPropagation(),
            children: [c.jsxs("div", {
                className: "battle-info-header",
                children: [c.jsx("span", {
                    className: "battle-info-title",
                    children: "Settings"
                }), c.jsx("button", {
                    className: "battle-info-close",
                    onClick: s,
                    children: "X"
                })]
            }), c.jsx("div", {
                className: "battle-info-content",
                children: u ? c.jsxs("div", {
                    className: "settings-confirm",
                    children: [c.jsx("p", {
                        children: "Are you sure? This will permanently delete all save data and restart the game."
                    }), c.jsxs("div", {
                        className: "settings-confirm-buttons",
                        children: [c.jsx("button", {
                            className: "settings-confirm-yes",
                            onClick: o,
                            children: "Yes, Reset"
                        }), c.jsx("button", {
                            className: "settings-confirm-no",
                            onClick: () => d(!1),
                            children: "Cancel"
                        })]
                    })]
                }) : c.jsx("button", {
                    className: "settings-reset-btn",
                    onClick: () => d(!0),
                    children: "Reset Save Data"
                })
            })]
        })
    })
}
const trainerClassMap = {
    youngster: "youngster",
    lass: "lass",
    bugCatcher: "bugcatcher",
    hiker: "hiker",
    swimmer: "swimmer",
    camper: "camper",
    sailor: "sailor",
    gentleman: "gentleman",
    channeler: "psychic",
    beauty: "beauty",
    coolTrainer: "acetrainer",
    psychic: "psychic",
    scientist: "scientist",
    tamer: "blackbelt",
    juggler: "juggler",
    superNerd: "supernerd",
    ace: "acetrainer",
    blackbelt: "blackbelt"
};
function getTrainerSpriteUrl(s) {
    return `/assets/sprites/trainers/${trainerClassMap[s]}.png`
}
const ug = {
    youngster: 16,
    lass: 16,
    bugCatcher: 12,
    hiker: 36,
    swimmer: 20,
    camper: 20,
    sailor: 24,
    gentleman: 56,
    channeler: 20,
    beauty: 56,
    coolTrainer: 36,
    psychic: 24,
    scientist: 48,
    tamer: 24,
    juggler: 28,
    superNerd: 20,
    ace: 36,
    blackbelt: 24
}
  , rg = {
    viridianCity: [{
        id: "viridian_1",
        name: "Youngster Joey",
        trainerClass: "youngster",
        team: [{
            speciesKey: "rattata",
            level: 6
        }, {
            speciesKey: "pidgey",
            level: 5
        }]
    }, {
        id: "viridian_2",
        name: "Lass Sally",
        trainerClass: "lass",
        team: [{
            speciesKey: "nidoranF",
            level: 6
        }, {
            speciesKey: "nidoranM",
            level: 6
        }]
    }, {
        id: "viridian_3",
        name: "Youngster Ben",
        trainerClass: "youngster",
        team: [{
            speciesKey: "rattata",
            level: 7
        }, {
            speciesKey: "spearow",
            level: 7
        }]
    }, {
        id: "viridian_4",
        name: "Lass Robin",
        trainerClass: "lass",
        team: [{
            speciesKey: "pidgey",
            level: 5
        }, {
            speciesKey: "pidgey",
            level: 7
        }, {
            speciesKey: "pidgey",
            level: 9
        }]
    }],
    pewterCity: [{
        id: "pewter_1",
        name: "Hiker Marcos",
        trainerClass: "hiker",
        team: [{
            speciesKey: "geodude",
            level: 10
        }, {
            speciesKey: "onix",
            level: 12
        }]
    }, {
        id: "pewter_2",
        name: "Bug Catcher Rick",
        trainerClass: "bugCatcher",
        team: [{
            speciesKey: "caterpie",
            level: 9
        }, {
            speciesKey: "weedle",
            level: 9
        }, {
            speciesKey: "metapod",
            level: 10
        }, {
            speciesKey: "kakuna",
            level: 10
        }]
    }, {
        id: "pewter_3",
        name: "Hiker Liam",
        trainerClass: "hiker",
        team: [{
            speciesKey: "geodude",
            level: 11
        }, {
            speciesKey: "geodude",
            level: 11
        }, {
            speciesKey: "geodude",
            level: 13
        }]
    }, {
        id: "pewter_4",
        name: "Bug Catcher Doug",
        trainerClass: "bugCatcher",
        team: [{
            speciesKey: "caterpie",
            level: 11
        }, {
            speciesKey: "metapod",
            level: 11
        }, {
            speciesKey: "butterfree",
            level: 14
        }]
    }, {
        id: "pewter_5",
        name: "Hiker Franklin",
        trainerClass: "hiker",
        team: [{
            speciesKey: "geodude",
            level: 12
        }, {
            speciesKey: "onix",
            level: 14
        }]
    }],
    ceruleanCity: [{
        id: "cerulean_1",
        name: "Swimmer Luis",
        trainerClass: "swimmer",
        team: [{
            speciesKey: "staryu",
            level: 16
        }, {
            speciesKey: "goldeen",
            level: 18
        }]
    }, {
        id: "cerulean_2",
        name: "Camper Lola",
        trainerClass: "camper",
        team: [{
            speciesKey: "oddish",
            level: 16
        }, {
            speciesKey: "bellsprout",
            level: 16
        }, {
            speciesKey: "pidgeotto",
            level: 18
        }]
    }, {
        id: "cerulean_3",
        name: "Swimmer Diana",
        trainerClass: "swimmer",
        team: [{
            speciesKey: "poliwag",
            level: 17
        }, {
            speciesKey: "shellder",
            level: 17
        }, {
            speciesKey: "horsea",
            level: 19
        }]
    }, {
        id: "cerulean_4",
        name: "Camper Jeff",
        trainerClass: "camper",
        team: [{
            speciesKey: "sandshrew",
            level: 18
        }, {
            speciesKey: "ekans",
            level: 18
        }, {
            speciesKey: "rattata",
            level: 20
        }]
    }, {
        id: "cerulean_5",
        name: "Swimmer Tara",
        trainerClass: "swimmer",
        team: [{
            speciesKey: "staryu",
            level: 19
        }, {
            speciesKey: "staryu",
            level: 19
        }, {
            speciesKey: "goldeen",
            level: 21
        }]
    }],
    vermilionCity: [{
        id: "vermilion_1",
        name: "Sailor Eddie",
        trainerClass: "sailor",
        team: [{
            speciesKey: "machop",
            level: 20
        }, {
            speciesKey: "tentacool",
            level: 20
        }]
    }, {
        id: "vermilion_2",
        name: "Gentleman Arthur",
        trainerClass: "gentleman",
        team: [{
            speciesKey: "voltorb",
            level: 22
        }, {
            speciesKey: "magnemite",
            level: 22
        }]
    }, {
        id: "vermilion_3",
        name: "Sailor Dylan",
        trainerClass: "sailor",
        team: [{
            speciesKey: "machop",
            level: 19
        }, {
            speciesKey: "machop",
            level: 21
        }, {
            speciesKey: "tentacool",
            level: 22
        }]
    }, {
        id: "vermilion_4",
        name: "Gentleman Brooks",
        trainerClass: "gentleman",
        team: [{
            speciesKey: "pikachu",
            level: 22
        }, {
            speciesKey: "magnemite",
            level: 24
        }]
    }, {
        id: "vermilion_5",
        name: "Sailor Huey",
        trainerClass: "sailor",
        team: [{
            speciesKey: "machop",
            level: 22
        }, {
            speciesKey: "shellder",
            level: 22
        }, {
            speciesKey: "machoke",
            level: 24
        }]
    }],
    lavenderTown: [{
        id: "lavender_1",
        name: "Channeler Hope",
        trainerClass: "channeler",
        team: [{
            speciesKey: "gastly",
            level: 23
        }, {
            speciesKey: "gastly",
            level: 25
        }]
    }, {
        id: "lavender_2",
        name: "Channeler Patricia",
        trainerClass: "channeler",
        team: [{
            speciesKey: "gastly",
            level: 24
        }, {
            speciesKey: "haunter",
            level: 26
        }]
    }, {
        id: "lavender_3",
        name: "Channeler Carly",
        trainerClass: "channeler",
        team: [{
            speciesKey: "gastly",
            level: 22
        }, {
            speciesKey: "cubone",
            level: 24
        }, {
            speciesKey: "haunter",
            level: 26
        }]
    }, {
        id: "lavender_4",
        name: "Channeler Laurel",
        trainerClass: "channeler",
        team: [{
            speciesKey: "cubone",
            level: 25
        }, {
            speciesKey: "gastly",
            level: 25
        }, {
            speciesKey: "haunter",
            level: 28
        }]
    }],
    celadonCity: [{
        id: "celadon_1",
        name: "Beauty Bridget",
        trainerClass: "beauty",
        team: [{
            speciesKey: "clefairy",
            level: 26
        }, {
            speciesKey: "meowth",
            level: 26
        }]
    }, {
        id: "celadon_2",
        name: "CoolTrainer Samuel",
        trainerClass: "coolTrainer",
        team: [{
            speciesKey: "eevee",
            level: 26
        }, {
            speciesKey: "exeggcute",
            level: 28
        }, {
            speciesKey: "pidgeotto",
            level: 28
        }]
    }, {
        id: "celadon_3",
        name: "Beauty Tamia",
        trainerClass: "beauty",
        team: [{
            speciesKey: "oddish",
            level: 26
        }, {
            speciesKey: "clefairy",
            level: 28
        }, {
            speciesKey: "jigglypuff",
            level: 28
        }]
    }, {
        id: "celadon_4",
        name: "CoolTrainer Alexa",
        trainerClass: "coolTrainer",
        team: [{
            speciesKey: "gloom",
            level: 27
        }, {
            speciesKey: "exeggcute",
            level: 27
        }, {
            speciesKey: "weepinbell",
            level: 30
        }]
    }, {
        id: "celadon_5",
        name: "Beauty Lola",
        trainerClass: "beauty",
        team: [{
            speciesKey: "vulpix",
            level: 28
        }, {
            speciesKey: "clefairy",
            level: 28
        }]
    }],
    saffronCity: [{
        id: "saffron_1",
        name: "Psychic Cameron",
        trainerClass: "psychic",
        team: [{
            speciesKey: "kadabra",
            level: 30
        }, {
            speciesKey: "drowzee",
            level: 30
        }]
    }, {
        id: "saffron_2",
        name: "Scientist Taylor",
        trainerClass: "scientist",
        team: [{
            speciesKey: "voltorb",
            level: 29
        }, {
            speciesKey: "magnemite",
            level: 29
        }, {
            speciesKey: "electrode",
            level: 32
        }]
    }, {
        id: "saffron_3",
        name: "Psychic Tyron",
        trainerClass: "psychic",
        team: [{
            speciesKey: "abra",
            level: 28
        }, {
            speciesKey: "kadabra",
            level: 31
        }, {
            speciesKey: "mrMime",
            level: 34
        }]
    }, {
        id: "saffron_4",
        name: "Scientist Ivan",
        trainerClass: "scientist",
        team: [{
            speciesKey: "magnemite",
            level: 30
        }, {
            speciesKey: "voltorb",
            level: 30
        }, {
            speciesKey: "magneton",
            level: 34
        }]
    }, {
        id: "saffron_5",
        name: "Psychic Johan",
        trainerClass: "psychic",
        team: [{
            speciesKey: "drowzee",
            level: 30
        }, {
            speciesKey: "hypno",
            level: 34
        }]
    }],
    fuchsiaCity: [{
        id: "fuchsia_1",
        name: "Tamer Phil",
        trainerClass: "tamer",
        team: [{
            speciesKey: "arbok",
            level: 34
        }, {
            speciesKey: "sandslash",
            level: 34
        }]
    }, {
        id: "fuchsia_2",
        name: "Juggler Dalton",
        trainerClass: "juggler",
        team: [{
            speciesKey: "voltorb",
            level: 31
        }, {
            speciesKey: "voltorb",
            level: 33
        }, {
            speciesKey: "voltorb",
            level: 35
        }, {
            speciesKey: "electrode",
            level: 38
        }]
    }, {
        id: "fuchsia_3",
        name: "Tamer Edgar",
        trainerClass: "tamer",
        team: [{
            speciesKey: "arbok",
            level: 33
        }, {
            speciesKey: "weezing",
            level: 35
        }, {
            speciesKey: "primeape",
            level: 35
        }]
    }, {
        id: "fuchsia_4",
        name: "Juggler Nelson",
        trainerClass: "juggler",
        team: [{
            speciesKey: "drowzee",
            level: 32
        }, {
            speciesKey: "hypno",
            level: 36
        }, {
            speciesKey: "kadabra",
            level: 36
        }]
    }, {
        id: "fuchsia_5",
        name: "Tamer Vincent",
        trainerClass: "tamer",
        team: [{
            speciesKey: "rhyhorn",
            level: 36
        }, {
            speciesKey: "primeape",
            level: 36
        }]
    }],
    cinnabarIsland: [{
        id: "cinnabar_1",
        name: "Scientist Beau",
        trainerClass: "scientist",
        team: [{
            speciesKey: "grimer",
            level: 36
        }, {
            speciesKey: "koffing",
            level: 38
        }, {
            speciesKey: "weezing",
            level: 40
        }]
    }, {
        id: "cinnabar_2",
        name: "Super Nerd Derek",
        trainerClass: "superNerd",
        team: [{
            speciesKey: "magmar",
            level: 38
        }, {
            speciesKey: "ponyta",
            level: 38
        }]
    }, {
        id: "cinnabar_3",
        name: "Scientist Ted",
        trainerClass: "scientist",
        team: [{
            speciesKey: "grimer",
            level: 37
        }, {
            speciesKey: "muk",
            level: 40
        }, {
            speciesKey: "electrode",
            level: 40
        }]
    }, {
        id: "cinnabar_4",
        name: "Super Nerd Zack",
        trainerClass: "superNerd",
        team: [{
            speciesKey: "ponyta",
            level: 36
        }, {
            speciesKey: "rapidash",
            level: 40
        }, {
            speciesKey: "growlithe",
            level: 42
        }]
    }, {
        id: "cinnabar_5",
        name: "Scientist Connor",
        trainerClass: "scientist",
        team: [{
            speciesKey: "voltorb",
            level: 38
        }, {
            speciesKey: "electrode",
            level: 38
        }, {
            speciesKey: "magneton",
            level: 42
        }]
    }],
    indigoPlat: [{
        id: "indigo_1",
        name: "Ace Trainer Chloe",
        trainerClass: "ace",
        team: [{
            speciesKey: "pidgeot",
            level: 48
        }, {
            speciesKey: "alakazam",
            level: 50
        }, {
            speciesKey: "arcanine",
            level: 50
        }]
    }, {
        id: "indigo_2",
        name: "CoolTrainer Naomi",
        trainerClass: "coolTrainer",
        team: [{
            speciesKey: "exeggutor",
            level: 48
        }, {
            speciesKey: "cloyster",
            level: 48
        }, {
            speciesKey: "machamp",
            level: 50
        }, {
            speciesKey: "arcanine",
            level: 52
        }]
    }, {
        id: "indigo_3",
        name: "Ace Trainer Jason",
        trainerClass: "ace",
        team: [{
            speciesKey: "gyarados",
            level: 50
        }, {
            speciesKey: "nidoking",
            level: 50
        }, {
            speciesKey: "dragonair",
            level: 52
        }]
    }, {
        id: "indigo_4",
        name: "CoolTrainer Vincent",
        trainerClass: "coolTrainer",
        team: [{
            speciesKey: "rhydon",
            level: 48
        }, {
            speciesKey: "slowbro",
            level: 50
        }, {
            speciesKey: "gengar",
            level: 52
        }, {
            speciesKey: "starmie",
            level: 55
        }]
    }, {
        id: "indigo_5",
        name: "Ace Trainer Lauren",
        trainerClass: "ace",
        team: [{
            speciesKey: "venusaur",
            level: 50
        }, {
            speciesKey: "charizard",
            level: 50
        }, {
            speciesKey: "blastoise",
            level: 50
        }]
    }, {
        id: "indigo_6",
        name: "CoolTrainer Grayson",
        trainerClass: "coolTrainer",
        team: [{
            speciesKey: "dragonite",
            level: 55
        }, {
            speciesKey: "lapras",
            level: 50
        }, {
            speciesKey: "snorlax",
            level: 52
        }]
    }]
};
function getBossTrainerSpriteUrl(s) {
    return s ? `/assets/sprites/trainers/${s}.png` : "/assets/sprites/trainers/acetrainer.png"
}
const yf = [{
    id: "brock",
    name: "Brock",
    title: "Pewter City Gym Leader",
    locationKey: "pewterCity",
    badgeName: "Boulder Badge",
    badgeColor: "#a0a0a0",
    spriteKey: "brock-gen3",
    team: [{
        speciesKey: "geodude",
        level: 12
    }, {
        speciesKey: "onix",
        level: 14
    }]
}, {
    id: "misty",
    name: "Misty",
    title: "Cerulean City Gym Leader",
    locationKey: "ceruleanCity",
    badgeName: "Cascade Badge",
    badgeColor: "#4a90d9",
    spriteKey: "misty-gen3",
    team: [{
        speciesKey: "staryu",
        level: 18
    }, {
        speciesKey: "starmie",
        level: 21
    }]
}, {
    id: "surge",
    name: "Lt. Surge",
    title: "Vermilion City Gym Leader",
    locationKey: "vermilionCity",
    badgeName: "Thunder Badge",
    badgeColor: "#f0c030",
    spriteKey: "ltsurge-gen3",
    team: [{
        speciesKey: "voltorb",
        level: 21
    }, {
        speciesKey: "pikachu",
        level: 18
    }, {
        speciesKey: "raichu",
        level: 24
    }]
}, {
    id: "erika",
    name: "Erika",
    title: "Celadon City Gym Leader",
    locationKey: "celadonCity",
    badgeName: "Rainbow Badge",
    badgeColor: "#78c850",
    spriteKey: "erika-gen3",
    team: [{
        speciesKey: "victreebel",
        level: 29
    }, {
        speciesKey: "tangela",
        level: 24
    }, {
        speciesKey: "vileplume",
        level: 29
    }]
}, {
    id: "koga",
    name: "Koga",
    title: "Fuchsia City Gym Leader",
    locationKey: "fuchsiaCity",
    badgeName: "Soul Badge",
    badgeColor: "#a040a0",
    spriteKey: "koga-gen3",
    team: [{
        speciesKey: "koffing",
        level: 37
    }, {
        speciesKey: "muk",
        level: 39
    }, {
        speciesKey: "koffing",
        level: 37
    }, {
        speciesKey: "weezing",
        level: 43
    }]
}, {
    id: "sabrina",
    name: "Sabrina",
    title: "Saffron City Gym Leader",
    locationKey: "saffronCity",
    badgeName: "Marsh Badge",
    badgeColor: "#e868a8",
    spriteKey: "sabrina-gen3",
    team: [{
        speciesKey: "kadabra",
        level: 38
    }, {
        speciesKey: "mrMime",
        level: 37
    }, {
        speciesKey: "venomoth",
        level: 38
    }, {
        speciesKey: "alakazam",
        level: 43
    }]
}, {
    id: "blaine",
    name: "Blaine",
    title: "Cinnabar Island Gym Leader",
    locationKey: "cinnabarIsland",
    badgeName: "Volcano Badge",
    badgeColor: "#f08030",
    spriteKey: "blaine-gen3",
    team: [{
        speciesKey: "growlithe",
        level: 42
    }, {
        speciesKey: "ponyta",
        level: 40
    }, {
        speciesKey: "rapidash",
        level: 42
    }, {
        speciesKey: "arcanine",
        level: 47
    }]
}, {
    id: "giovanni",
    name: "Giovanni",
    title: "Viridian City Gym Leader",
    locationKey: "viridianCity",
    badgeName: "Earth Badge",
    badgeColor: "#e0c068",
    spriteKey: "giovanni-gen3",
    team: [{
        speciesKey: "rhyhorn",
        level: 45
    }, {
        speciesKey: "dugtrio",
        level: 42
    }, {
        speciesKey: "nidoqueen",
        level: 44
    }, {
        speciesKey: "nidoking",
        level: 45
    }, {
        speciesKey: "rhydon",
        level: 50
    }]
}]
  , hf = [{
    id: "lorelei",
    name: "Lorelei",
    title: "Elite Four",
    spriteKey: "lorelei-gen3",
    team: [{
        speciesKey: "dewgong",
        level: 54
    }, {
        speciesKey: "cloyster",
        level: 53
    }, {
        speciesKey: "slowbro",
        level: 54
    }, {
        speciesKey: "jynx",
        level: 56
    }, {
        speciesKey: "lapras",
        level: 56
    }]
}, {
    id: "bruno",
    name: "Bruno",
    title: "Elite Four",
    spriteKey: "bruno-gen3",
    team: [{
        speciesKey: "onix",
        level: 53
    }, {
        speciesKey: "hitmonchan",
        level: 55
    }, {
        speciesKey: "hitmonlee",
        level: 55
    }, {
        speciesKey: "onix",
        level: 56
    }, {
        speciesKey: "machamp",
        level: 58
    }]
}, {
    id: "agatha",
    name: "Agatha",
    title: "Elite Four",
    spriteKey: "agatha-gen3",
    team: [{
        speciesKey: "gengar",
        level: 56
    }, {
        speciesKey: "golbat",
        level: 56
    }, {
        speciesKey: "haunter",
        level: 55
    }, {
        speciesKey: "arbok",
        level: 58
    }, {
        speciesKey: "gengar",
        level: 60
    }]
}, {
    id: "lance",
    name: "Lance",
    title: "Elite Four",
    spriteKey: "lance-gen3",
    team: [{
        speciesKey: "gyarados",
        level: 58
    }, {
        speciesKey: "dragonair",
        level: 56
    }, {
        speciesKey: "dragonair",
        level: 56
    }, {
        speciesKey: "aerodactyl",
        level: 60
    }, {
        speciesKey: "dragonite",
        level: 62
    }]
}]
  , zn = {
    id: "blue",
    name: "Blue",
    title: "Pokemon League Champion",
    spriteKey: "blue-gen3",
    team: [{
        speciesKey: "pidgeot",
        level: 61
    }, {
        speciesKey: "alakazam",
        level: 59
    }, {
        speciesKey: "rhydon",
        level: 61
    }, {
        speciesKey: "gyarados",
        level: 63
    }, {
        speciesKey: "arcanine",
        level: 63
    }, {
        speciesKey: "venusaur",
        level: 65
    }]
}
  , pg = {
    physical: "✴",
    special: "◎",
    status: "☯"
}
  , gf = {
    route1: "/backgrounds/grassland.png",
    route2: "/backgrounds/grassland.png",
    route4: "/backgrounds/grassland.png",
    route5: "/backgrounds/grassland.png",
    route6: "/backgrounds/grassland.png",
    route7: "/backgrounds/grassland.png",
    route8: "/backgrounds/grassland.png",
    route9: "/backgrounds/grassland.png",
    route11: "/backgrounds/grassland.png",
    route12: "/backgrounds/grassland.png",
    route13: "/backgrounds/grassland.png",
    route14: "/backgrounds/grassland.png",
    route15: "/backgrounds/grassland.png",
    route16: "/backgrounds/grassland.png",
    route17: "/backgrounds/grassland.png",
    route18: "/backgrounds/grassland.png",
    route22: "/backgrounds/grassland.png",
    route24: "/backgrounds/grassland.png",
    route25: "/backgrounds/grassland.png",
    safariZone: "/backgrounds/grassland.png",
    viridianForest: "/backgrounds/grassland.png",
    route3: "/backgrounds/mountain.png",
    route10: "/backgrounds/mountain.png",
    route23: "/backgrounds/mountain.png",
    mtMoon: "/backgrounds/cave.png",
    rockTunnel: "/backgrounds/cave.png",
    diglettsCave: "/backgrounds/cave.png",
    victoryRoad: "/backgrounds/cave.png",
    ceruleanCave: "/backgrounds/cave.png",
    pokemonTower: "/backgrounds/cave.png",
    pokemonMansion: "/backgrounds/cave.png",
    powerPlant: "/backgrounds/cave.png",
    route19: "/backgrounds/beach.png",
    route20: "/backgrounds/beach.png",
    route21: "/backgrounds/beach.png",
    seafoamIslands: "/backgrounds/cave.png"
};
function vf() {
    const [s,u] = O.useState(!1)
      , [d,o] = O.useState(!1)
      , [y,f] = O.useState(!1)
      , {state: g, dispatch: x} = Re()
      , {playerPokemon: h, enemyPokemon: p, battleEvents: w} = g
      , k = O.useMemo( () => 151, []) //Object.keys(pokemonSpecies).length
      , A = g.pokedexCaught.length >= k;
    if (g.phase === "evolving")
        return c.jsx(ng, {});
    if (g.phase === "healing")
        return c.jsx(lg, {});
    if (!h)
        return null;
    const v = w.length > 0 ? w[w.length - 1] : null
      , _ = pokemonSpecies[h.speciesKey]
      , S = g.bossBattle ?? g.trainerBattle
      , D = w.filter(P => P.type === "damage").pop()
      , z = w.filter(P => P.type === "faint").pop()
      , V = S && w.length === 0 && g.pendingEvents.some(P => P.type === "trainerAppear")
      , G = w.some(P => P.type === "trainerAppear")
      , X = S && (v?.type === "trainerAppear" || v?.type === "trainerSendOut" && G)
      , Z = v?.type === "trainerSendOut" && G
      , F = v?.type === "trainerSendOut"
      , q = v?.type === "playerSwitch"
      , le = v?.type === "trainerAppear" || V
      , ve = D ? w.indexOf(D) === w.length - 1 : !1
      , Ne = D?.data?.target === "player" && ve
      , Q = D?.data?.target === "enemy" && ve
      , J = z?.data?.target === "enemy"
      , _e = z?.data?.target === "player"
      , je = mapData[g.currentLocation]?.type === "town"
      , N = {
        vermilionCity: "/backgrounds/town_port.png",
        cinnabarIsland: "/backgrounds/town_port.png",
        fuchsiaCity: "/backgrounds/town_port.png"
    }[g.currentLocation] || "/backgrounds/town.png"
      , Y = S || je ? N : gf[g.currentRoute] || gf.route1;
    return c.jsxs("div", {
        className: "battle-scene",
        style: {
            backgroundImage: `url('${Y}')`
        },
        children: [c.jsxs("div", {
            className: "battle-top-buttons",
            children: [c.jsx("button", {
                className: "battle-info-btn",
                onClick: () => o(!0),
                children: "?"
            }), c.jsx("button", {
                className: `battle-info-btn auto-proceed-btn${g.autoProceed ? " active" : ""}`,
                onClick: () => x({
                    type: "TOGGLE_AUTO_PROCEED"
                }),
                title: g.autoProceed ? "Auto-proceed: ON" : "Auto-proceed: OFF",
                children: "▶▶"
            }), c.jsx("button", {
                className: "battle-info-btn",
                onClick: () => f(!0),
                children: c.jsx("span", {
                    className: "settings-icon",
                    children: "⚙"
                })
            })]
        }), d && Zh.createPortal(c.jsx("div", {
            className: "battle-info-overlay",
            onClick: () => o(!1),
            children: c.jsxs("div", {
                className: "battle-info-modal",
                onClick: P => P.stopPropagation(),
                children: [c.jsxs("div", {
                    className: "battle-info-header",
                    children: [c.jsx("span", {
                        className: "battle-info-title",
                        children: "Info"
                    }), c.jsx("button", {
                        className: "battle-info-close",
                        onClick: () => o(!1),
                        children: "X"
                    })]
                }), c.jsxs("div", {
                    className: "battle-info-content",
                    children: [c.jsxs("p", {
                        children: ["Hello and welcome to Pokemon Idle! Please be aware that this game is still in the very early stages of development so I welcome any and all feedback. I apologize for the lack of detailed tutorial system but I just haven't had a chance. Feel free to join the ", c.jsx("a", {
                            href: "https://www.reddit.com/r/PkmnIdle/",
                            target: "_blank",
                            rel: "noopener noreferrer",
                            children: "Pokemon Idle subreddit"
                        }), " to ask questions or find answers to questions others have asked."]
                    }), c.jsx("p", {
                        children: "Click on Route 1 to begin your pokemon adventure!"
                    }), c.jsxs("div", {
                        className: "info-shiny-stats",
                        children: [c.jsxs("span", {
                            children: ["Shinies seen: ", g.shinySeen.length]
                        }), c.jsxs("span", {
                            children: ["Shinies caught: ", g.shinyCaught.length]
                        }), c.jsxs("span", {
                            children: ["Shiny odds: 1/", A ? "4096" : "8192", A ? " (Shiny Charm active!)" : ""]
                        }), !A && c.jsxs("span", {
                            className: "info-shiny-hint",
                            children: ["Catch all ", k, " Pokemon to unlock the Shiny Charm (2x shiny rate)"]
                        })]
                    }), c.jsx("button", {
                        className: "patch-notes-link-btn",
                        onClick: () => {
                            window.location.hash = "patchnotes"
                        }
                        ,
                        children: "View Patch Notes"
                    })]
                })]
            })
        }), document.body), S && c.jsx("div", {
            className: "trainer-name-display",
            children: S.trainerName
        }), p && !le && c.jsx("div", {
            className: "enemy-info-anchor",
            children: c.jsx(Jh, {
                pokemon: p
            })
        }), S && c.jsx("div", {
            className: "trainer-team-indicator",
            children: S.trainerTeam.map( (P, ae) => c.jsx("span", {
                className: `team-ball ${P.currentHp <= 0 ? "fainted" : ""} ${ae === S.currentTrainerPokemonIndex ? "active" : ""}`
            }, ae))
        }), (S || g.party.length > 1) && c.jsx("div", {
            className: "player-team-indicator",
            children: g.party.map( (P, ae) => c.jsx("span", {
                className: `team-ball player-ball ${P.currentHp <= 0 ? "fainted" : ""} ${ae === g.activePlayerPokemonIndex ? "active" : ""}`
            }, ae))
        }), X && S && c.jsx("div", {
            className: `trainer-intro-anchor ${Z ? "slide-out" : "slide-in"}`,
            children: c.jsx("img", {
                className: "trainer-intro-img",
                src: g.bossBattle?.spriteKey ? getBossTrainerSpriteUrl(g.bossBattle.spriteKey) : getTrainerSpriteUrl(S.trainerClass),
                alt: S.trainerName
            })
        }), p && !le && c.jsxs("div", {
            className: `sprite-container enemy-sprite ${Q ? "hit-flash" : ""} ${J ? "faint-anim" : ""} ${F ? "pokemon-appear" : ""}${p.isShiny ? " shiny-sparkle" : ""}`,
            children: [c.jsx("div", {
                className: "sprite-shadow"
            }), c.jsx("img", {
                src: getPokemonSpriteUrl(pokemonSpecies[p.speciesKey].id, !1, p.isShiny),
                onError: e => e.target.src = '/assets/sprites/pokemon/0.gif',
                alt: p.name
            })]
        }), c.jsxs("div", {
            className: `sprite-container player-sprite ${Ne ? "hit-flash" : ""} ${_e ? "faint-anim" : ""} ${q ? "pokemon-appear" : ""}${g.playerPokemon?.isShiny ? " shiny-sparkle" : ""}`,
            children: [c.jsx("div", {
                className: "sprite-shadow"
            }), c.jsx("img", {
                src: getPokemonSpriteUrl(_.id, !0, g.playerPokemon?.isShiny),
                onError: e => e.target.src = '/assets/sprites/pokemon/0.gif',
                alt: h.name
            })]
        }), c.jsx("div", {
            className: "player-info-anchor",
            children: c.jsx(Fh, {
                pokemon: h
            })
        }), c.jsx("div", {
            className: "speed-overlay",
            children: c.jsx(tg, {})
        }), c.jsxs("div", {
            className: "bottom-panel",
            children: [c.jsx($h, {
                event: v ?? (g.pendingEvents.length > 0 ? {
                    type: "waiting",
                    message: ""
                } : null),
                speed: g.speed,
                isAtTown: mapData[g.currentLocation]?.type === "town"
            }), c.jsxs("div", {
                className: "bottom-right-panel",
                children: [c.jsx("button", {
                    className: "move-swap-btn",
                    onClick: () => u(!0),
                    children: "MOVES"
                }), c.jsx("div", {
                    className: "move-grid",
                    children: h.moves.map(P => {
                        const ae = moveData[P];
                        return ae ? c.jsxs("div", {
                            className: `move-cell type-bg-${ae.type.toLowerCase()}`,
                            children: [c.jsxs("div", {
                                className: "move-top-row",
                                children: [c.jsx("span", {
                                    className: "move-category-icon",
                                    children: pg[ae.category]
                                }), c.jsx("span", {
                                    className: "move-name",
                                    children: ae.name
                                })]
                            }), c.jsxs("div", {
                                className: "move-stats",
                                children: [c.jsxs("span", {
                                    children: [c.jsx("span", {
                                        className: "move-stat-label",
                                        children: "Pow"
                                    }), " ", ae.power > 0 ? ae.power : "—"]
                                }), c.jsxs("span", {
                                    children: [c.jsx("span", {
                                        className: "move-stat-label",
                                        children: "Acc"
                                    }), " ", ae.accuracy, "%"]
                                })]
                            })]
                        }, P) : null
                    }
                    )
                })]
            })]
        }), s && c.jsx(ag, {
            onClose: () => u(!1)
        }), y && c.jsx(sg, {
            onClose: () => f(!1)
        })]
    })
}
const fg = 30;
function mg() {
    const {state: s} = Re()
      , u = O.useRef(null)
      , d = O.useRef(null)
      , [o,y] = O.useState(!1);
    O.useEffect( () => {
        d.current?.scrollIntoView({
            behavior: "smooth"
        })
    }
    , [s.battleLog.length]),
    O.useEffect( () => {
        const g = u.current;
        if (!g)
            return;
        const x = new ResizeObserver(h => {
            for (const p of h)
                y(p.contentRect.height < fg)
        }
        );
        return x.observe(g),
        () => x.disconnect()
    }
    , []);
    const f = s.activeEffects;
    return c.jsx("div", {
        ref: u,
        className: "battle-log",
        style: o ? {
            padding: 0,
            borderTop: "none"
        } : void 0,
        children: !o && c.jsxs(c.Fragment, {
            children: [c.jsx("h3", {
                className: "log-title",
                children: "Battle Log"
            }), f.length > 0 && c.jsx("div", {
                className: "active-effects-bar",
                children: f.map( (g, x) => {
                    let h = "";
                    return g.type === "expShare" ? h = `Exp Share (${g.battlesRemaining})` : h = `${g.speciesKey ? pokemonSpecies[g.speciesKey]?.name ?? g.speciesKey : ""} (${g.battlesRemaining})`,
                    c.jsx("span", {
                        className: `active-effect-tag effect-${g.type}`,
                        children: h
                    }, x)
                }
                )
            }), c.jsxs("div", {
                className: "log-entries",
                children: [s.battleLog.map( (g, x) => c.jsx("div", {
                    className: "log-entry",
                    children: g
                }, x)), c.jsx("div", {
                    ref: d
                })]
            })]
        })
    })
}
function bf() {
    const {state: s, dispatch: u} = Re();
    return O.useEffect( () => {
        if (s.levelUpNotification) {
            const d = setTimeout( () => {
                u({
                    type: "CLEAR_LEVEL_UP"
                })
            }
            , 2e3);
            return () => clearTimeout(d)
        }
    }
    , [s.levelUpNotification, u]),
    s.levelUpNotification ? c.jsx("div", {
        className: "level-up-notification",
        children: c.jsx("span", {
            children: s.levelUpNotification
        })
    }) : null
}
const typechart = {
    Normal: {
        Rock: .5,
        Ghost: 0,
        Steel: .5
    },
    Fire: {
        Fire: .5,
        Water: .5,
        Grass: 2,
        Ice: 2,
        Bug: 2,
        Rock: .5,
        Dragon: .5,
        Steel: 2
    },
    Water: {
        Fire: 2,
        Water: .5,
        Grass: .5,
        Ground: 2,
        Rock: 2,
        Dragon: .5
    },
    Electric: {
        Water: 2,
        Electric: .5,
        Grass: .5,
        Ground: 0,
        Flying: 2,
        Dragon: .5
    },
    Grass: {
        Fire: .5,
        Water: 2,
        Grass: .5,
        Poison: .5,
        Ground: 2,
        Flying: .5,
        Bug: .5,
        Rock: 2,
        Dragon: .5,
        Steel: .5
    },
    Ice: {
        Fire: .5,
        Water: .5,
        Grass: 2,
        Ice: .5,
        Ground: 2,
        Flying: 2,
        Dragon: 2,
        Steel: .5
    },
    Fighting: {
        Normal: 2,
        Ice: 2,
        Poison: .5,
        Flying: .5,
        Psychic: .5,
        Bug: .5,
        Rock: 2,
        Ghost: 0,
        Dark: 2,
        Steel: 2,
        Fairy: .5
    },
    Poison: {
        Grass: 2,
        Poison: .5,
        Ground: .5,
        Rock: .5,
        Ghost: .5,
        Steel: 0,
        Fairy: 2
    },
    Ground: {
        Fire: 2,
        Electric: 2,
        Grass: .5,
        Poison: 2,
        Flying: 0,
        Bug: .5,
        Rock: 2,
        Steel: 2
    },
    Flying: {
        Electric: .5,
        Grass: 2,
        Fighting: 2,
        Bug: 2,
        Rock: .5,
        Steel: .5
    },
    Psychic: {
        Fighting: 2,
        Poison: 2,
        Psychic: .5,
        Dark: 0,
        Steel: .5
    },
    Bug: {
        Fire: .5,
        Grass: 2,
        Fighting: .5,
        Poison: .5,
        Flying: .5,
        Psychic: 2,
        Ghost: .5,
        Dark: 2,
        Steel: .5,
        Fairy: .5
    },
    Rock: {
        Fire: 2,
        Ice: 2,
        Fighting: .5,
        Ground: .5,
        Flying: 2,
        Bug: 2,
        Steel: .5
    },
    Ghost: {
        Normal: 0,
        Psychic: 2,
        Ghost: 2,
        Dark: .5
    },
    Dragon: {
        Dragon: 2,
        Steel: .5,
        Fairy: 0
    },
    Dark: {
        Fighting: .5,
        Psychic: 2,
        Ghost: 2,
        Dark: .5,
        Fairy: .5
    },
    Steel: {
        Fire: .5,
        Water: .5,
        Electric: .5,
        Ice: 2,
        Rock: 2,
        Steel: .5,
        Fairy: 2
    },
    Fairy: {
        Fire: .5,
        Poison: .5,
        Dragon: 2,
        Dark: 2,
        Steel: .5
    }
};
function hg(s, u) {
    let d = 1;
    for (const o of u)
        d *= typechart[s]?.[o] ?? 1;
    return d
}
function zf(s, u) {
    return hg(s, u)
}
function ms(s) {
    return s >= 0 ? (2 + s) / 2 : 2 / (2 - s)
}
function gg(s, u, d, o, y, f, g=0, x=0) {
    if (o.power === 0)
        return {
            damage: 0,
            isCrit: !1,
            effectiveness: 1,
            effectivenessLabel: null
        };
    if (Math.random() * 100 >= o.accuracy)
        return {
            damage: 0,
            isCrit: !1,
            effectiveness: 1,
            effectivenessLabel: "miss"
        };
    const p = Math.floor(u * ms(g))
      , w = Math.max(1, Math.floor(d * ms(x)))
      , k = Math.floor(Math.floor(2 * s / 5 + 2) * o.power * p / w / 50 + 2)
      , A = Math.random() < 1 / 16
      , v = A ? 2 : 1
      , _ = y.includes(o.type) ? 1.5 : 1
      , S = zf(o.type, f)
      , D = (Math.floor(Math.random() * 16) + 85) / 100
      , z = Math.max(1, Math.floor(k * v * _ * S * D));
    let V = null;
    return S === 0 ? V = "It had no effect!" : S < 1 ? V = "It's not very effective..." : S > 1 && (V = "It's super effective!"),
    {
        damage: S === 0 ? 0 : z,
        isCrit: A,
        effectiveness: S,
        effectivenessLabel: V
    }
}
function vg(s, u, d, o, y, f, g=0, x=0) {
    if (o.power === 0)
        return 0;
    const h = Math.floor(u * ms(g))
      , p = Math.max(1, Math.floor(d * ms(x)))
      , w = Math.floor(Math.floor(2 * s / 5 + 2) * o.power * h / p / 50 + 2)
      , k = y.includes(o.type) ? 1.5 : 1
      , A = zf(o.type, f);
    return Math.floor(w * k * A * .925)
}
function xf(s, u, d, o, y, f, g, x, h, p) {
    let w = s[0]
      , k = -1;
    for (const A of s) {
        const v = moveData[A];
        if (!v || v.power === 0)
            continue;
        const _ = v.category === "physical" ? d : o
          , S = v.category === "physical" ? g : x
          , D = v.category === "physical" ? "attack" : "spAttack"
          , z = v.category === "physical" ? "defense" : "spDefense"
          , V = h?.[D] ?? 0
          , G = p?.[z] ?? 0;
        let X = vg(u, _, S, v, y, f, V, G);
        if (v.effect)
            switch (v.effect.type) {
            case "recoil":
                X *= 1 - v.effect.fraction;
                break;
            case "recharge":
                X *= .5;
                break;
            case "selfDestruct":
                X *= .15;
                break;
            case "multiTurnLock":
                X *= .75;
                break;
            case "crashOnMiss":
                X *= v.accuracy / 100;
                break
            }
        X > k && (k = X,
        w = A)
    }
    return {
        moveId: w,
        move: moveData[w]
    }
}
function bg(s) {
    const u = s.filter(y => {
        const f = moveData[y];
        return f && f.power > 0
    }
    )
      , d = u.length > 0 ? u : s
      , o = d[Math.floor(Math.random() * d.length)];
    return {
        moveId: o,
        move: moveData[o]
    }
}
function Sf(s, u) {
    return s.statStages?.[u] ?? 0
}
function xg(s) {
    return Math.max(-6, Math.min(6, s))
}
function Sg(s, u, d=!1) {
    const o = [];
    s.statStages || (s.statStages = {}),
    u.statStages || (u.statStages = {});
    const y = s.mustRecharge
      , f = u.mustRecharge;
    y && (s.mustRecharge = !1),
    f && (u.mustRecharge = !1);
    let g, x;
    if (y)
        g = s.moves[0],
        x = moveData[g];
    else if (s.lockedMove)
        g = s.lockedMove,
        x = moveData[g];
    else {
        const v = xf(s.moves, s.level, s.attack, s.spAttack, s.types, u.types, u.defense, u.spDefense, s.statStages, u.statStages);
        g = v.moveId,
        x = v.move
    }
    let h, p;
    if (f)
        h = u.moves[0],
        p = moveData[h];
    else if (u.lockedMove)
        h = u.lockedMove,
        p = moveData[h];
    else {
        const v = d ? xf(u.moves, u.level, u.attack, u.spAttack, u.types, s.types, s.defense, s.spDefense, u.statStages, s.statStages) : bg(u.moves);
        h = v.moveId,
        p = v.move
    }
    const w = []
      , k = y ? -10 : x?.priority ?? 0
      , A = f ? -10 : p?.priority ?? 0;
    k > A ? w.push({
        attacker: s,
        defender: u,
        moveId: g,
        isPlayer: !0
    }, {
        attacker: u,
        defender: s,
        moveId: h,
        isPlayer: !1
    }) : A > k ? w.push({
        attacker: u,
        defender: s,
        moveId: h,
        isPlayer: !1
    }, {
        attacker: s,
        defender: u,
        moveId: g,
        isPlayer: !0
    }) : s.speed >= u.speed ? w.push({
        attacker: s,
        defender: u,
        moveId: g,
        isPlayer: !0
    }, {
        attacker: u,
        defender: s,
        moveId: h,
        isPlayer: !1
    }) : w.push({
        attacker: u,
        defender: s,
        moveId: h,
        isPlayer: !1
    }, {
        attacker: s,
        defender: u,
        moveId: g,
        isPlayer: !0
    });
    for (const v of w) {
        if (v.attacker.currentHp <= 0)
            continue;
        if (v.isPlayer ? y : f) {
            o.push({
                type: "recharge",
                message: `${v.attacker.name} must recharge!`
            });
            continue
        }
        const S = moveData[v.moveId];
        if (!S)
            continue;
        if (v.attacker.lockedMove && v.attacker.lockTurnsRemaining !== void 0 && v.attacker.lockTurnsRemaining > 0 && v.attacker.lockTurnsRemaining--,
        o.push({
            type: "attack",
            message: `${v.attacker.name} used ${S.name}!`,
            data: {
                target: v.isPlayer ? "enemy" : "player"
            }
        }),
        S.power === 0) {
            if (S.effect?.type === "statChange") {
                const q = S.effect.target === "self" ? v.attacker : v.defender
                  , le = q === s ? "player" : "enemy";
                q.statStages || (q.statStages = {});
                for (const [ve,Ne] of Object.entries(S.effect.changes)) {
                    const Q = ve
                      , J = q.statStages[Q] ?? 0
                      , _e = xg(J + Ne);
                    q.statStages[Q] = _e;
                    const je = Ne > 0 ? "rose" : "fell"
                      , W = Math.abs(Ne) >= 2 ? "sharply " : "";
                    o.push({
                        type: "statChange",
                        message: `${q.name}'s ${kg(Q)} ${W}${je}!`,
                        data: {
                            target: le
                        }
                    })
                }
            }
            continue
        }
        const D = S.category === "physical" ? v.attacker.attack : v.attacker.spAttack
          , z = S.category === "physical" ? v.defender.defense : v.defender.spDefense
          , V = S.category === "physical" ? "attack" : "spAttack"
          , G = S.category === "physical" ? "defense" : "spDefense"
          , X = Sf(v.attacker, V)
          , Z = Sf(v.defender, G)
          , F = gg(v.attacker.level, D, z, S, v.attacker.types, v.defender.types, X, Z);
        if (F.effectivenessLabel === "miss") {
            if (o.push({
                type: "miss",
                message: `${v.attacker.name}'s attack missed!`
            }),
            S.effect?.type === "crashOnMiss") {
                const q = Math.max(1, Math.floor(v.attacker.maxHp * S.effect.fraction));
                if (v.attacker.currentHp = Math.max(0, v.attacker.currentHp - q),
                o.push({
                    type: "recoil",
                    message: `${v.attacker.name} kept going and crashed! (${q} damage)`,
                    data: {
                        target: v.isPlayer ? "player" : "enemy",
                        damage: q,
                        hpAfter: v.attacker.currentHp,
                        hpMax: v.attacker.maxHp
                    }
                }),
                v.attacker.currentHp <= 0) {
                    o.push({
                        type: "faint",
                        message: `${v.attacker.name} fainted!`,
                        data: {
                            target: v.isPlayer ? "player" : "enemy"
                        }
                    });
                    break
                }
            }
            continue
        }
        if (v.defender.currentHp = Math.max(0, v.defender.currentHp - F.damage),
        o.push({
            type: "damage",
            message: `${v.defender.name} took ${F.damage} damage!`,
            data: {
                target: v.isPlayer ? "enemy" : "player",
                damage: F.damage,
                hpAfter: v.defender.currentHp,
                hpMax: v.defender.maxHp
            }
        }),
        F.isCrit && o.push({
            type: "critical",
            message: "A critical hit!"
        }),
        F.effectivenessLabel && o.push({
            type: "effectiveness",
            message: F.effectivenessLabel
        }),
        S.effect)
            switch (S.effect.type) {
            case "recoil":
                {
                    const q = Math.max(1, Math.floor(F.damage * S.effect.fraction));
                    v.attacker.currentHp = Math.max(0, v.attacker.currentHp - q),
                    o.push({
                        type: "recoil",
                        message: `${v.attacker.name} was hurt by recoil! (${q} damage)`,
                        data: {
                            target: v.isPlayer ? "player" : "enemy",
                            damage: q,
                            hpAfter: v.attacker.currentHp,
                            hpMax: v.attacker.maxHp
                        }
                    }),
                    v.attacker.currentHp <= 0 && o.push({
                        type: "faint",
                        message: `${v.attacker.name} fainted!`,
                        data: {
                            target: v.isPlayer ? "player" : "enemy"
                        }
                    });
                    break
                }
            case "recharge":
                {
                    v.attacker.mustRecharge = !0;
                    break
                }
            case "selfDestruct":
                {
                    v.attacker.currentHp = 0,
                    o.push({
                        type: "faint",
                        message: `${v.attacker.name} fainted!`,
                        data: {
                            target: v.isPlayer ? "player" : "enemy"
                        }
                    });
                    break
                }
            case "multiTurnLock":
                {
                    if (!v.attacker.lockedMove) {
                        const q = S.effect.minTurns + Math.floor(Math.random() * (S.effect.maxTurns - S.effect.minTurns + 1));
                        v.attacker.lockedMove = v.moveId,
                        v.attacker.lockTurnsRemaining = q - 1
                    }
                    if (v.attacker.lockTurnsRemaining !== void 0 && v.attacker.lockTurnsRemaining <= 0 && v.attacker.lockedMove) {
                        v.attacker.lockedMove = null,
                        v.attacker.lockTurnsRemaining = 0;
                        const q = Math.max(1, Math.floor(v.attacker.maxHp * S.effect.selfDamage));
                        v.attacker.currentHp = Math.max(0, v.attacker.currentHp - q),
                        o.push({
                            type: "recoil",
                            message: `${v.attacker.name} became confused and hurt itself! (${q} damage)`,
                            data: {
                                target: v.isPlayer ? "player" : "enemy",
                                damage: q,
                                hpAfter: v.attacker.currentHp,
                                hpMax: v.attacker.maxHp
                            }
                        }),
                        v.attacker.currentHp <= 0 && o.push({
                            type: "faint",
                            message: `${v.attacker.name} fainted!`,
                            data: {
                                target: v.isPlayer ? "player" : "enemy"
                            }
                        })
                    }
                    break
                }
            }
        if (v.defender.currentHp <= 0) {
            o.push({
                type: "faint",
                message: `${v.defender.name} fainted!`,
                data: {
                    target: v.isPlayer ? "enemy" : "player"
                }
            });
            break
        }
        if (v.attacker.currentHp <= 0)
            break
    }
    return o
}
function kg(s) {
    switch (s) {
    case "attack":
        return "Attack";
    case "defense":
        return "Defense";
    case "spAttack":
        return "Sp. Atk";
    case "spDefense":
        return "Sp. Def";
    case "speed":
        return "Speed"
    }
}
const wg = {
    bulbasaur: 45,
    ivysaur: 45,
    venusaur: 45,
    charmander: 45,
    charmeleon: 45,
    charizard: 45,
    squirtle: 45,
    wartortle: 45,
    blastoise: 45,
    caterpie: 255,
    metapod: 120,
    butterfree: 45,
    weedle: 255,
    kakuna: 120,
    beedrill: 45,
    pidgey: 255,
    pidgeotto: 120,
    pidgeot: 45,
    rattata: 255,
    raticate: 127,
    spearow: 255,
    fearow: 90,
    ekans: 255,
    arbok: 90,
    pikachu: 190,
    raichu: 75,
    sandshrew: 255,
    sandslash: 90,
    nidoranF: 235,
    nidorina: 120,
    nidoqueen: 45,
    nidoranM: 235,
    nidorino: 120,
    nidoking: 45,
    clefairy: 150,
    clefable: 25,
    vulpix: 190,
    ninetales: 75,
    jigglypuff: 170,
    wigglytuff: 50,
    zubat: 255,
    golbat: 90,
    oddish: 255,
    gloom: 120,
    vileplume: 45,
    paras: 190,
    parasect: 75,
    venonat: 190,
    venomoth: 75,
    diglett: 255,
    dugtrio: 50,
    meowth: 255,
    persian: 90,
    psyduck: 190,
    golduck: 75,
    mankey: 190,
    primeape: 75,
    growlithe: 190,
    arcanine: 75,
    poliwag: 255,
    poliwhirl: 120,
    poliwrath: 45,
    abra: 200,
    kadabra: 100,
    alakazam: 50,
    machop: 180,
    machoke: 90,
    machamp: 45,
    bellsprout: 255,
    weepinbell: 120,
    victreebel: 45,
    tentacool: 190,
    tentacruel: 60,
    geodude: 255,
    graveler: 120,
    golem: 45,
    ponyta: 190,
    rapidash: 60,
    slowpoke: 190,
    slowbro: 75,
    magnemite: 190,
    magneton: 60,
    farfetchd: 45,
    doduo: 190,
    dodrio: 45,
    seel: 190,
    dewgong: 75,
    grimer: 190,
    muk: 75,
    shellder: 190,
    cloyster: 60,
    gastly: 190,
    haunter: 90,
    gengar: 45,
    onix: 45,
    drowzee: 190,
    hypno: 75,
    krabby: 225,
    kingler: 60,
    voltorb: 190,
    electrode: 60,
    exeggcute: 90,
    exeggutor: 45,
    cubone: 190,
    marowak: 75,
    hitmonlee: 45,
    hitmonchan: 45,
    lickitung: 45,
    koffing: 190,
    weezing: 60,
    rhyhorn: 120,
    rhydon: 60,
    chansey: 30,
    tangela: 45,
    kangaskhan: 45,
    horsea: 225,
    seadra: 75,
    goldeen: 225,
    seaking: 60,
    staryu: 225,
    starmie: 60,
    mrMime: 45,
    scyther: 45,
    jynx: 45,
    electabuzz: 45,
    magmar: 45,
    pinsir: 45,
    tauros: 45,
    magikarp: 255,
    gyarados: 45,
    lapras: 45,
    ditto: 35,
    eevee: 45,
    vaporeon: 45,
    jolteon: 45,
    flareon: 45,
    porygon: 45,
    omanyte: 45,
    omastar: 45,
    kabuto: 45,
    kabutops: 45,
    aerodactyl: 45,
    snorlax: 25,
    articuno: 3,
    zapdos: 3,
    moltres: 3,
    dratini: 45,
    dragonair: 45,
    dragonite: 45,
    mewtwo: 3,
    mew: 45
};
function Hf(s) {
    return wg[s] ?? 255
}
function Eg(s, u) {
    const d = Hf(s)
      , o = Ka[u];
    return o ? Math.min(1, d * o.ballModifier / 255) : 0
}
function Lg(s, u) {
    const d = Eg(s, u);
    return Math.random() < d
}
function Uf(s, u, d) {
    const o = Fo.filter(f => u.includes(f) && (d[f] ?? 0) > 0);
    if (o.length === 0)
        return null;
    const y = Hf(s);
    for (const f of o)
        if (y * Ka[f].ballModifier / 255 >= 1)
            return f;
    return o[o.length - 1]
}
function Ag(s, u, d, o, y) {
    const f = Ra(s, u, d);
    if (!f.enabled || f.enabledBalls.length === 0)
        return !1;
    switch (f.mode) {
    case "always":
        return !0;
    case "shiny_only":
        return y;
    case "level_threshold":
        return o >= f.levelThreshold;
    case "pokedex_new":
        return !s.pokedexCaught.includes(d);
    default:
        return !0
    }
}
function Tg(s, u, d) {
    const o = Ra(s, u, d);
    return Uf(d, o.enabledBalls, s.inventory)
}
function Go(s, u, d, o, y=!1, f=[], g=0) {
    const x = pokemonSpecies[d.speciesKey]
      , h = Dh(x, d.level)
      , p = Math.floor(h * o)
      , w = y ? Math.floor(p * .5) : p
      , k = pokemonSpecies[u.speciesKey]
      , A = u.totalExp + w
      , v = df(u.speciesKey, k.growthRate, u.level, A);
    if (v.length > 0) {
        const _ = v[v.length - 1]
          , S = calculatePokemonStats(k, _.newLevel, u.ivs)
          , D = v.flatMap(z => z.newMoves);
        D.forEach(z => {
            const V = moveData[z];
            V && s({
                type: "ADD_LOG",
                payload: {
                    message: `${u.name} learned ${V.name}!`
                }
            })
        }
        ),
        s({
            type: "APPLY_EXP",
            payload: {
                expGained: w,
                newLevel: _.newLevel,
                newMoves: D,
                newStats: {
                    maxHp: S.hp,
                    attack: S.attack,
                    defense: S.defense,
                    spAttack: S.spAttack,
                    spDefense: S.spDefense,
                    speed: S.speed
                }
            }
        })
    } else
        s({
            type: "APPLY_EXP",
            payload: {
                expGained: w
            }
        });
    if (y && f.length > 1) {
        const _ = Math.floor(p * .05);
        if (_ > 0) {
            const S = [];
            for (let D = 0; D < f.length; D++) {
                if (D === g)
                    continue;
                const z = f[D];
                if (z.currentHp <= 0)
                    continue;
                const V = pokemonSpecies[z.speciesKey]
                  , G = z.totalExp + _
                  , X = df(z.speciesKey, V.growthRate, z.level, G);
                if (X.length > 0) {
                    const Z = X[X.length - 1]
                      , F = calculatePokemonStats(V, Z.newLevel, z.ivs)
                      , q = X.flatMap(le => le.newMoves);
                    q.forEach(le => {
                        const ve = moveData[le];
                        ve && s({
                            type: "ADD_LOG",
                            payload: {
                                message: `${z.name} learned ${ve.name}!`
                            }
                        })
                    }
                    ),
                    S.push({
                        partyIndex: D,
                        expGained: _,
                        newLevel: Z.newLevel,
                        newMoves: q,
                        newStats: {
                            maxHp: F.hp,
                            attack: F.attack,
                            defense: F.defense,
                            spAttack: F.spAttack,
                            spDefense: F.spDefense,
                            speed: F.speed
                        }
                    })
                } else
                    S.push({
                        partyIndex: D,
                        expGained: _
                    })
            }
            S.length > 0 && s({
                type: "APPLY_SHARED_EXP",
                payload: {
                    partyExp: S
                }
            })
        }
    }
}
function Ng() {
    const {state: s, dispatch: u} = Re()
      , d = O.useRef(null)
      , o = O.useRef(s.phase)
      , y = O.useRef(s);
    O.useEffect( () => {
        o.current = s.phase,
        y.current = s
    }
    , [s]);
    const f = O.useCallback( () => {
        const p = y.current.speed;
        return p === 25 ? 40 : p === 5 ? 200 : p === 2 ? 500 : 1e3
    }
    , [])
      , g = O.useCallback( () => {
        const currentGameState = y.current;
        if (currentGameState.pendingEvents.length > 0) {
            u({
                type: "CONSUME_EVENT"
            });
            return
        }
        const totalCatchablePokedex = 151 //Object.keys(pokemonSpecies).length
          , finishedDex = currentGameState.pokedexCaught.length >= totalCatchablePokedex;
        switch (currentGameState.phase) {
        case "idle":
            {
                if (!currentGameState.playerPokemon)
                    return;
                const currentLocationData = mapData[currentGameState.currentLocation];
                if (currentLocationData && currentLocationData.type === "town") {
                    const G = rg[currentGameState.currentLocation];
                    if (!G?.length)
                        return;
                    const X = G[Math.floor(Math.random() * G.length)]
                      , Z = X.team.map(F => {
                        const q = pokemonSpecies[F.speciesKey]
                          , le = calculatePokemonStats(q, F.level, getPerfectIVs())
                          , ve = resolvePokemonMoves(F.speciesKey, F.level);
                        return {
                            speciesKey: F.speciesKey,
                            name: q.name,
                            types: q.types,
                            level: F.level,
                            currentHp: le.hp,
                            maxHp: le.hp,
                            attack: le.attack,
                            defense: le.defense,
                            spAttack: le.spAttack,
                            spDefense: le.spDefense,
                            speed: le.speed,
                            moves: ve,
                            isPlayer: !1,
                            isShiny: checkShinyOdds(finishedDex)
                        }
                    }
                    );
                    u({
                        type: "START_TRAINER_BATTLE",
                        payload: {
                            trainerId: X.id,
                            trainerName: X.name,
                            trainerClass: X.trainerClass,
                            trainerTeam: Z
                        }
                    });
                    return
                }
                if (currentLocationData.type === "raid" && currentGameState.inRaid && currentGameState.raidLegendary) {
                    const G = Wa.find(Ne => Ne.speciesKey === currentGameState.raidLegendary);
                    if (!G)
                        return;
                    const X = pokemonSpecies[G.speciesKey];
                    if (!X)
                        return;
                    const Z = currentGameState.raidLevel
                      , F = generateIVs()
                      , q = calculatePokemonStats(X, Z, F)
                      , le = resolvePokemonMoves(G.speciesKey, Z)
                      , ve = {
                        speciesKey: G.speciesKey,
                        name: X.name,
                        types: X.types,
                        level: Z,
                        currentHp: q.hp,
                        maxHp: q.hp,
                        attack: q.attack,
                        defense: q.defense,
                        spAttack: q.spAttack,
                        spDefense: q.spDefense,
                        speed: q.speed,
                        moves: le,
                        isPlayer: !1,
                        isShiny: checkShinyOdds(finishedDex)
                    };
                    u({
                        type: "START_ENCOUNTER",
                        payload: {
                            enemy: ve
                        }
                    }),
                    u({
                        type: "MARK_SEEN",
                        payload: {
                            speciesKey: G.speciesKey
                        }
                    }),
                    ve.isShiny && (u({
                        type: "MARK_SHINY_SEEN",
                        payload: {
                            speciesKey: G.speciesKey
                        }
                    }),
                    u({
                        type: "ADD_LOG",
                        payload: {
                            message: `✦ A shiny ${X.name} appeared!`
                        }
                    }));
                    return
                }
                const encounterData = mapEncounterData[currentGameState.currentRoute];
                if (!encounterData)
                    return;
                const activeModifierMultipliers = resolveActiveModifiers(currentGameState.activeEffects, currentGameState.currentRoute)
                  , spawningPokemonData = resolvePokemonEncounter(encounterData, activeModifierMultipliers, finishedDex)
                  , pokemonBaseStats = calculatePokemonStats(spawningPokemonData.species, spawningPokemonData.level, generateIVs())
                  , pokemonMoves = resolvePokemonMoves(spawningPokemonData.speciesKey, spawningPokemonData.level)
                  , pokemonData = {
                    speciesKey: spawningPokemonData.speciesKey,
                    name: spawningPokemonData.species.name,
                    types: spawningPokemonData.species.types,
                    level: spawningPokemonData.level,
                    currentHp: pokemonBaseStats.hp,
                    maxHp: pokemonBaseStats.hp,
                    attack: pokemonBaseStats.attack,
                    defense: pokemonBaseStats.defense,
                    spAttack: pokemonBaseStats.spAttack,
                    spDefense: pokemonBaseStats.spDefense,
                    speed: pokemonBaseStats.speed,
                    moves: pokemonMoves,
                    isPlayer: !1,
                    isShiny: spawningPokemonData.isShiny
                };
                u({
                    type: "START_ENCOUNTER",
                    payload: {
                        enemy: pokemonData
                    }
                }),
                u({
                    type: "MARK_SEEN",
                    payload: {
                        speciesKey: spawningPokemonData.speciesKey
                    }
                }),
                spawningPokemonData.isShiny && (u({
                    type: "MARK_SHINY_SEEN",
                    payload: {
                        speciesKey: spawningPokemonData.speciesKey
                    }
                }),
                u({
                    type: "ADD_LOG",
                    payload: {
                        message: `✦ A shiny ${spawningPokemonData.species.name} appeared!`
                    }
                }));
                break
            }
        case "battling":
            {
                if (!currentGameState.playerPokemon || !currentGameState.enemyPokemon)
                    return;
                const A = currentGameState.playerVolatile ?? ql()
                  , v = {
                    speciesKey: currentGameState.playerPokemon.speciesKey,
                    name: currentGameState.playerPokemon.name,
                    types: pokemonSpecies[currentGameState.playerPokemon.speciesKey].types,
                    level: currentGameState.playerPokemon.level,
                    currentHp: currentGameState.playerPokemon.currentHp,
                    maxHp: currentGameState.playerPokemon.maxHp,
                    attack: currentGameState.playerPokemon.attack,
                    defense: currentGameState.playerPokemon.defense,
                    spAttack: currentGameState.playerPokemon.spAttack,
                    spDefense: currentGameState.playerPokemon.spDefense,
                    speed: currentGameState.playerPokemon.speed,
                    moves: currentGameState.playerPokemon.moves,
                    isPlayer: !0,
                    isShiny: currentGameState.playerPokemon.isShiny,
                    statStages: {
                        ...A.statStages
                    },
                    mustRecharge: A.mustRecharge,
                    lockedMove: A.lockedMove,
                    lockTurnsRemaining: A.lockTurnsRemaining
                }
                  , _ = {
                    ...currentGameState.enemyPokemon
                }
                  , S = (currentGameState.trainerBattle ?? currentGameState.bossBattle) !== null
                  , D = Sg(v, _, S);
                u({
                    type: "EXECUTE_TURN",
                    payload: {
                        events: D
                    }
                });
                const z = {
                    statStages: v.statStages,
                    mustRecharge: v.mustRecharge ?? !1,
                    lockedMove: v.lockedMove ?? null,
                    lockTurnsRemaining: v.lockTurnsRemaining ?? 0
                }
                  , V = {
                    statStages: _.statStages,
                    mustRecharge: _.mustRecharge ?? !1,
                    lockedMove: _.lockedMove ?? null,
                    lockTurnsRemaining: _.lockTurnsRemaining ?? 0
                };
                u({
                    type: "UPDATE_VOLATILE",
                    payload: {
                        player: z,
                        enemy: V
                    }
                });
                break
            }
        case "victory":
            {
                if (!currentGameState.playerPokemon || !currentGameState.enemyPokemon) {
                    u({
                        type: "PHASE_IDLE"
                    });
                    return
                }
                const A = currentGameState.activeEffects.some(z => z.type === "expShare");
                if (currentGameState.playerPokemon.currentHp <= 0) {
                    const z = currentGameState.party.findIndex( (V, G) => G !== currentGameState.activePlayerPokemonIndex && V.currentHp > 0);
                    u(z !== -1 ? {
                        type: "SWITCH_PLAYER_POKEMON",
                        payload: {
                            newPokemonIndex: z
                        }
                    } : {
                        type: "START_HEALING"
                    }),
                    Go(u, currentGameState.playerPokemon, currentGameState.enemyPokemon, currentGameState.bossBattle ?? currentGameState.trainerBattle ? 1.5 : 1, A, currentGameState.party, currentGameState.activePlayerPokemonIndex);
                    return
                }
                const v = currentGameState.bossBattle ?? currentGameState.trainerBattle;
                if (v) {
                    Go(u, currentGameState.playerPokemon, currentGameState.enemyPokemon, 1.5, A, currentGameState.party, currentGameState.activePlayerPokemonIndex);
                    const z = v.currentTrainerPokemonIndex + 1;
                    if (z < v.trainerTeam.length)
                        u({
                            type: "TRAINER_SEND_NEXT_POKEMON",
                            payload: {
                                newPokemonIndex: z
                            }
                        });
                    else {
                        const V = Math.max(...v.trainerTeam.map(X => X.level))
                          , G = ug[v.trainerClass] * V;
                        currentGameState.bossBattle ? u({
                            type: "BOSS_BATTLE_END",
                            payload: {
                                won: !0,
                                moneyDelta: G
                            }
                        }) : u({
                            type: "TRAINER_BATTLE_END",
                            payload: {
                                won: !0,
                                moneyDelta: G
                            }
                        })
                    }
                    return
                }
                const _ = currentGameState.enemyPokemon;
                Go(u, currentGameState.playerPokemon, _, 1, A, currentGameState.party, currentGameState.activePlayerPokemonIndex);
                const S = _.isShiny && currentGameState.alwaysCatchShinies;
                if (S || Ag(currentGameState, currentGameState.currentRoute, _.speciesKey, _.level, _.isShiny)) {
                    const z = S ? Uf(_.speciesKey, Fo, currentGameState.inventory) : Tg(currentGameState, currentGameState.currentRoute, _.speciesKey);
                    z ? Lg(_.speciesKey, z) ? (u({
                        type: "CATCH_POKEMON",
                        payload: {
                            speciesKey: _.speciesKey,
                            level: _.level,
                            pokeballUsed: z,
                            isShiny: _.isShiny
                        }
                    }),
                    u({
                        type: "MARK_CAUGHT",
                        payload: {
                            speciesKey: _.speciesKey
                        }
                    }),
                    _.isShiny && u({
                        type: "MARK_SHINY_CAUGHT",
                        payload: {
                            speciesKey: _.speciesKey
                        }
                    })) : (u({
                        type: "USE_POKEBALL",
                        payload: {
                            pokeballId: z
                        }
                    }),
                    u({
                        type: "ADD_LOG",
                        payload: {
                            message: `${_.name} broke free!`
                        }
                    })) : u({
                        type: "ADD_LOG",
                        payload: {
                            message: "No Poke Balls left!"
                        }
                    })
                }
                u({
                    type: "PHASE_IDLE"
                });
                break
            }
        case "defeat":
            {
                const A = currentGameState.activePlayerPokemonIndex
                  , v = currentGameState.party.findIndex( (_, S) => S > A && _.currentHp > 0);
                if (v !== -1)
                    u({
                        type: "SWITCH_PLAYER_POKEMON",
                        payload: {
                            newPokemonIndex: v
                        }
                    });
                else {
                    if (currentGameState.bossBattle ?? currentGameState.trainerBattle) {
                        const S = Math.min(currentGameState.money, Math.max(...currentGameState.party.map(D => D.level)) * 12);
                        currentGameState.bossBattle ? (u({
                            type: "BOSS_BATTLE_END",
                            payload: {
                                won: !1,
                                moneyDelta: -S
                            }
                        }),
                        (currentGameState.bossBattle.bossType === "e4" || currentGameState.bossBattle.bossType === "champion") && u({
                            type: "RESET_ELITE_FOUR"
                        })) : u({
                            type: "TRAINER_BATTLE_END",
                            payload: {
                                won: !1,
                                moneyDelta: -S
                            }
                        })
                    }
                    u({
                        type: "START_HEALING"
                    })
                }
                break
            }
        case "healing":
            return;
        case "evolving":
            return
        }
    }
    , [u]);
    O.useEffect( () => {
        if (s.phase === "starterSelect" || s.paused) {
            d.current && clearInterval(d.current),
            d.current = null;
            return
        }
        return d.current && clearInterval(d.current),
        d.current = setInterval(g, f()),
        () => {
            d.current && clearInterval(d.current)
        }
    }
    , [s.phase, s.speed, s.paused, s.pendingEvents.length, g, f]);
    const x = O.useRef(s.unlockedLocations)
      , h = O.useRef(null);
    O.useEffect( () => {
        if (!s.autoProceed) {
            x.current = s.unlockedLocations;
            return
        }
        const p = x.current;
        x.current = s.unlockedLocations;
        const w = s.unlockedLocations.filter(A => !p.includes(A));
        if (w.length === 0)
            return;
        const k = w.filter(A => A !== "raidIsland").map(A => mapData[A]).filter(Boolean).sort( (A, v) => v.unlockOrder - A.unlockOrder)[0];
        k && (h.current = k.id)
    }
    , [s.unlockedLocations, s.autoProceed]),
    O.useEffect( () => {
        if (s.phase !== "idle" || !s.autoProceed)
            return;
        const p = h.current;
        p && p !== s.currentLocation && (h.current = null,
        u({
            type: "TRAVEL",
            payload: {
                locationId: p
            }
        }))
    }
    , [s.phase, s.autoProceed, s.currentLocation, u])
}
const kf = 768;
function Yf() {
    const [s,u] = O.useState( () => window.innerWidth < kf);
    return O.useEffect( () => {
        const d = window.matchMedia(`(max-width: ${kf - 1}px)`)
          , o = y => u(y.matches);
        return d.addEventListener("change", o),
        () => d.removeEventListener("change", o)
    }
    , []),
    s
}
const wf = 560;
function Ef() {
    const {state: s} = Re()
      , u = Yf()
      , d = O.useRef(null)
      , o = O.useRef(null)
      , [y,f] = O.useState(1)
      , [g,x] = O.useState(480);
    Ng();
    const h = O.useCallback( () => {
        if (!d.current)
            return;
        const p = d.current.clientWidth;
        if (f(Math.min(p / wf, 1)),
        o.current) {
            const w = o.current.querySelector(".battle-scene")
              , k = o.current.scrollHeight
              , A = w ? parseFloat(getComputedStyle(w).marginBottom) : 0;
            x(k + A)
        }
    }
    , []);
    if (O.useEffect( () => {
        if (!u || !d.current)
            return;
        const p = new ResizeObserver( () => h());
        return p.observe(d.current),
        h(),
        () => p.disconnect()
    }
    , [u, h]),
    O.useEffect( () => {
        if (u && o.current) {
            const p = o.current.querySelector(".battle-scene")
              , w = o.current.scrollHeight
              , k = p ? parseFloat(getComputedStyle(p).marginBottom) : 0;
            x(w + k)
        }
    }
    ),
    !s.playerPokemon)
        return null;
    if (u) {
        const p = g * y;
        return c.jsxs("div", {
            className: "battle-screen",
            ref: d,
            style: {
                height: p,
                overflow: "hidden"
            },
            children: [c.jsx("div", {
                ref: o,
                style: {
                    transform: `scale(${y})`,
                    transformOrigin: "top left",
                    width: wf
                },
                children: c.jsx(vf, {})
            }), c.jsx(bf, {})]
        })
    }
    return c.jsxs("div", {
        className: "battle-screen",
        children: [c.jsx(vf, {}), c.jsx(mg, {}), c.jsx(bf, {})]
    })
}
const Cg = {
    physical: "✴",
    special: "◎",
    status: "☯"
}
  , Rg = {
    hp: "#60a040",
    attack: "#c86828",
    defense: "#c8a828",
    spAttack: "#5878c8",
    spDefense: "#60a040",
    speed: "#d04870"
};
function Gf({pokemon: s, source: u, partyLength: d, onAction: o, onClose: y, evolutionInfo: f, onEvolve: g, onRelease: x, canRelease: h}) {
    const p = pokemonSpecies[s.speciesKey];
    if (!p)
        return null;
    const w = [{
        label: "HP",
        key: "hp",
        value: s.currentHp,
        max: s.maxHp
    }, {
        label: "Atk",
        key: "attack",
        value: s.attack,
        max: 999
    }, {
        label: "Def",
        key: "defense",
        value: s.defense,
        max: 999
    }, {
        label: "SpA",
        key: "spAttack",
        value: s.spAttack,
        max: 999
    }, {
        label: "SpD",
        key: "spDefense",
        value: s.spDefense,
        max: 999
    }, {
        label: "Spd",
        key: "speed",
        value: s.speed,
        max: 999
    }]
      , k = 200
      , v = u === "party" && d > 1 || u === "box" && d < 6
      , _ = u === "party" ? "Send to Box" : "Move to Party";
    return c.jsxs("div", {
        className: "stats-panel",
        children: [c.jsx("div", {
            className: "stats-panel-header",
            children: c.jsx("button", {
                className: "stats-panel-close",
                onClick: y,
                children: "X"
            })
        }), f && c.jsx("div", {
            className: "stats-panel-evolve-row",
            children: f.entries.map( (S, D) => c.jsxs("button", {
                className: `stats-panel-evolve-btn${S.canEvolve ? "" : " disabled"}`,
                onClick: () => S.canEvolve && g?.(D),
                disabled: !S.canEvolve,
                children: [c.jsx("span", {
                    className: "evolve-btn-label",
                    children: f.entries.length > 1 ? S.targetName : "EVOLVE"
                }), c.jsx("span", {
                    className: "evolve-btn-req",
                    children: S.requirementLabel
                })]
            }, D))
        }), c.jsxs("div", {
            className: "stats-panel-identity",
            children: [c.jsx("img", {
                className: "stats-panel-sprite",
                src: getPokemonSpriteUrl(p.id, !1, s.isShiny),
                onError: e => e.target.src = '/assets/sprites/pokemon/0.gif',
                alt: s.name
            }), c.jsxs("div", {
                className: "stats-panel-name-block",
                children: [c.jsxs("span", {
                    className: "stats-panel-name",
                    children: [s.isShiny && c.jsx("span", {
                        className: "shiny-star",
                        children: "★"
                    }), s.name]
                }), c.jsxs("span", {
                    className: "stats-panel-level",
                    children: ["Lv", s.level]
                }), c.jsx("div", {
                    className: "stats-panel-types",
                    children: p.types.map(S => c.jsx("span", {
                        className: `type-badge type-${S.toLowerCase()}`,
                        children: S
                    }, S))
                })]
            })]
        }), c.jsx("div", {
            className: "stats-panel-grid",
            children: w.map(S => {
                const D = S.key === "hp" ? S.max > 0 ? S.value / S.max * 100 : 0 : Math.min(S.value / k * 100, 100);
                return c.jsxs("div", {
                    className: "stats-panel-stat-row",
                    children: [c.jsx("span", {
                        className: "stats-panel-stat-label",
                        children: S.label
                    }), c.jsx("div", {
                        className: "stats-panel-stat-bar",
                        children: c.jsx("div", {
                            className: "stats-panel-stat-fill",
                            style: {
                                width: `${D}%`,
                                backgroundColor: Rg[S.key]
                            }
                        })
                    }), c.jsx("span", {
                        className: "stats-panel-stat-value",
                        children: S.key === "hp" ? `${S.value}/${S.max}` : S.value
                    })]
                }, S.key)
            }
            )
        }), c.jsxs("div", {
            className: "stats-panel-moves",
            children: [c.jsx("span", {
                className: "stats-panel-moves-title",
                children: "Moves"
            }), s.moves.map(S => {
                const D = moveData[S];
                return D ? c.jsxs("div", {
                    className: `stats-panel-move type-bg-${D.type.toLowerCase()}`,
                    children: [c.jsx("span", {
                        className: "stats-panel-move-icon",
                        children: Cg[D.category]
                    }), c.jsx("span", {
                        className: "stats-panel-move-name",
                        children: D.name
                    }), c.jsxs("span", {
                        className: "stats-panel-move-stats",
                        children: [D.power > 0 && c.jsxs("span", {
                            children: [D.power, " pw"]
                        }), c.jsxs("span", {
                            children: [D.accuracy, "%"]
                        })]
                    })]
                }, S) : null
            }
            )]
        }), v ? c.jsx("button", {
            className: "stats-panel-btn",
            onClick: o,
            children: _
        }) : null, h && c.jsx("button", {
            className: "stats-panel-release-btn",
            onClick: x,
            children: "Release"
        })]
    })
}
function qf({inspected: s, setInspected: u, releaseConfirm: d, setReleaseConfirm: o, dragSource: y=null, dragFromIndex: f=null, dropTargetIndex: g=null, dropPosition: x=null, onDragStart: h, onDragOver: p, onDrop: w, onDragEnd: k}) {
    const {state: A, dispatch: v} = Re();
    let _ = null
      , S = -1
      , D = null;
    s && (s.source === "party" ? (S = A.party.findIndex(Q => Q.id === s.id),
    S >= 0 && (_ = A.party[S],
    D = "party")) : (S = A.box.findIndex(Q => Q.id === s.id),
    S >= 0 && (_ = A.box[S],
    D = "box")));
    const z = O.useCallback(Q => {
        o(null),
        u(s && s.source === "party" && s.id === Q ? null : {
            source: "party",
            id: Q
        })
    }
    , [s, u, o])
      , V = O.useCallback( () => {
        if (s) {
            if (s.source === "party") {
                const Q = A.party.findIndex(J => J.id === s.id);
                if (Q < 0)
                    return;
                v({
                    type: "PARTY_TO_BOX",
                    payload: {
                        partyIndex: Q
                    }
                })
            } else {
                const Q = A.box.findIndex(J => J.id === s.id);
                if (Q < 0)
                    return;
                v({
                    type: "BOX_TO_PARTY",
                    payload: {
                        boxIndex: Q
                    }
                })
            }
            u(null),
            o(null)
        }
    }
    , [s, A.party, A.box, v, u, o])
      , G = !!(_ && D && (D === "box" || D === "party" && A.party.length > 1))
      , X = O.useCallback( () => {
        _ && o(_.id)
    }
    , [_, o])
      , Z = O.useCallback( () => {
        !d || !D || (v({
            type: "RELEASE_POKEMON",
            payload: {
                pokemonId: d,
                source: D
            }
        }),
        u(null),
        o(null))
    }
    , [d, D, v, u, o])
      , F = O.useCallback( () => {
        o(null)
    }
    , [o])
      , q = O.useMemo( () => {
        if (!_ || A.phase === "evolving")
            return;
        const Q = evolutionData[_.speciesKey];
        if (Q)
            return {
                entries: Q.map(J => {
                    const _e = pokemonSpecies[J.into]
                      , je = !J.level || _.level >= J.level
                      , W = !J.item || (A.inventory[J.item] ?? 0) > 0
                      , N = je && W
                      , Y = [];
                    if (J.level && Y.push(`Lv. ${J.level}`),
                    J.item) {
                        const P = J.item in Gn ? Gn[J.item].name : J.item;
                        Y.push(P)
                    }
                    return {
                        targetName: _e?.name ?? J.into,
                        canEvolve: N,
                        requirementLabel: Y.join(" + ") || "Ready",
                        targetKey: J.into,
                        itemId: J.item
                    }
                }
                )
            }
    }
    , [_, A.phase, A.inventory])
      , le = O.useCallback(Q => {
        if (!_ || !q)
            return;
        const J = q.entries[Q];
        J.canEvolve && (v({
            type: "START_EVOLUTION",
            payload: {
                pokemonId: _.id,
                fromSpeciesKey: _.speciesKey,
                toSpeciesKey: J.targetKey,
                consumeItem: J.itemId
            }
        }),
        u(null))
    }
    , [_, q, v, u])
      , ve = d ? A.party.find(Q => Q.id === d) || A.box.find(Q => Q.id === d) : null
      , Ne = !!h;
    return c.jsxs(c.Fragment, {
        children: [c.jsxs("div", {
            className: "panel-header",
            children: [c.jsx("h2", {
                className: "panel-title",
                children: "Party"
            }), c.jsx("button", {
                className: `heal-btn${(A.phase === "idle" || A.phase === "battling" || A.phase === "victory" || A.phase === "defeat") && A.party.some(Q => Q.currentHp < Q.maxHp) ? "" : " disabled"}`,
                onClick: () => {
                    (A.phase === "idle" || A.phase === "battling" || A.phase === "victory" || A.phase === "defeat") && A.party.some(Q => Q.currentHp < Q.maxHp) && v({
                        type: "START_HEALING"
                    })
                }
                ,
                disabled: !((A.phase === "idle" || A.phase === "battling" || A.phase === "victory" || A.phase === "defeat") && A.party.some(Q => Q.currentHp < Q.maxHp)),
                children: "+ HEAL"
            })]
        }), c.jsxs("div", {
            className: "party-content",
            children: [c.jsx("div", {
                className: "party-list",
                children: A.party.map( (Q, J) => {
                    const _e = pokemonSpecies[Q.speciesKey]
                      , je = J === 0
                      , W = s?.source === "party" && s.id === Q.id
                      , N = y === "party" && f === J
                      , Y = g === J && x === "above" && f !== null && y === "party" && f !== J
                      , P = g === J && x === "below" && f !== null && y === "party" && f !== J
                      , ae = g === J && y === "box";
                    return c.jsxs("div", {
                        children: [Y && c.jsx("div", {
                            className: "party-slot-drop-indicator"
                        }), c.jsxs("div", {
                            className: `party-slot${je ? " active" : ""}${W ? " inspected" : ""}${N ? " dragging" : ""}${ae ? " drop-target" : ""}`,
                            onClick: () => z(Q.id),
                            draggable: Ne,
                            onDragStart: h ? me => h(me, J, Q.id) : void 0,
                            onDragOver: p ? me => p(me, J) : void 0,
                            onDrop: w,
                            onDragEnd: k,
                            children: [c.jsx("img", {
                                className: "party-sprite",
                                src: getPokemonSpriteUrl(_e.id, !1, Q.isShiny),
                                onError: e => e.target.src = '/assets/sprites/pokemon/0.gif',
                                alt: Q.name
                            }), c.jsxs("div", {
                                className: "party-info",
                                children: [c.jsxs("div", {
                                    className: "party-name-row",
                                    children: [c.jsxs("span", {
                                        children: [Q.isShiny && c.jsx("span", {
                                            className: "shiny-star",
                                            children: "★"
                                        }), Q.name]
                                    }), c.jsxs("span", {
                                        children: ["Lv", Q.level]
                                    })]
                                }), c.jsx(Jo, {
                                    current: Q.currentHp,
                                    max: Q.maxHp
                                }), c.jsx(Of, {
                                    speciesKey: Q.speciesKey,
                                    level: Q.level,
                                    totalExp: Q.totalExp
                                })]
                            })]
                        }), P && c.jsx("div", {
                            className: "party-slot-drop-indicator"
                        })]
                    }, Q.id)
                }
                )
            }), c.jsx("div", {
                className: "stats-panel-spacer"
            }), _ && D && c.jsxs(c.Fragment, {
                children: [c.jsx(Gf, {
                    pokemon: _,
                    source: D,
                    partyLength: A.party.length,
                    onAction: V,
                    onClose: () => {
                        u(null),
                        o(null)
                    }
                    ,
                    evolutionInfo: q,
                    onEvolve: le,
                    onRelease: X,
                    canRelease: G && !d
                }), d && ve && c.jsxs("div", {
                    className: "release-confirm",
                    children: [c.jsxs("span", {
                        children: ["Release ", ve.name, "?"]
                    }), c.jsxs("div", {
                        className: "release-confirm-buttons",
                        children: [c.jsx("button", {
                            className: "release-confirm-yes",
                            onClick: Z,
                            children: "Yes"
                        }), c.jsx("button", {
                            className: "release-confirm-no",
                            onClick: F,
                            children: "No"
                        })]
                    })]
                })]
            })]
        })]
    })
}
const Pf = Io.memo(function({speciesKey: u, status: d, rarity: o, isSelected: y, onClick: f, isShinyCaught: g, activeEffect: x, selectorMode: h}) {
    const p = pokemonSpecies[u];
    return p ? c.jsxs("div", {
        className: `pokedex-tile rarity-border-${o}${y ? " selected" : ""}${h && d !== "unseen" ? " selector-target" : ""}`,
        onClick: f,
        children: [g && c.jsx("span", {
            className: "pokedex-shiny-star",
            children: "★"
        }), x?.repel && c.jsx("span", {
            className: "pokedex-effect-indicator repel-indicator",
            children: "R"
        }), x?.honey && c.jsx("span", {
            className: "pokedex-effect-indicator honey-indicator",
            children: "H"
        }), c.jsx("img", {
            className: `pokedex-tile-sprite ${d}`,
            src: getPokemonSpriteUrl(p.id),
            onError: e => e.target.src = '/assets/sprites/pokemon/0.gif',
            alt: d === "unseen" ? "???" : p.name,
            loading: "lazy"
        }), c.jsx("div", {
            className: "pokedex-tile-name",
            children: d === "unseen" ? "???" : p.name
        })]
    }) : null
})
  , Ja = {};
for (const s of Object.values(mapEncounterData))
    for (const u of s.encounters)
        Ja[u.speciesKey] || (Ja[u.speciesKey] = []),
        Ja[u.speciesKey].includes(s.name) || Ja[u.speciesKey].push(s.name);
const Kg = {
    hp: "#60a040",
    attack: "#c86828",
    defense: "#c8a828",
    spAttack: "#5878c8",
    spDefense: "#60a040",
    speed: "#d04870"
}
  , Dg = 200
  , Lf = Object.entries(pokemonSpecies).sort( (s, u) => s[1].id - u[1].id);
function jg({onClose: s}) {
    const {state: u} = Re()
      , [d,o] = O.useState(null)
      , y = k => u.pokedexCaught.includes(k) ? "caught" : u.pokedexSeen.includes(k) ? "seen" : "unseen"
      , f = u.pokedexCaught.length
      , g = new Set([...u.pokedexSeen, ...u.pokedexCaught]).size
      , x = Lf.length
      , h = d ? pokemonSpecies[d] : null
      , p = d ? y(d) : "unseen"
      , w = h ? [{
        label: "HP",
        key: "hp",
        value: h.baseStats.hp
    }, {
        label: "Atk",
        key: "attack",
        value: h.baseStats.attack
    }, {
        label: "Def",
        key: "defense",
        value: h.baseStats.defense
    }, {
        label: "SpA",
        key: "spAttack",
        value: h.baseStats.spAttack
    }, {
        label: "SpD",
        key: "spDefense",
        value: h.baseStats.spDefense
    }, {
        label: "Spd",
        key: "speed",
        value: h.baseStats.speed
    }] : [];
    return c.jsx("div", {
        className: "pokedex-modal-overlay",
        onClick: s,
        children: c.jsxs("div", {
            className: "pokedex-modal",
            onClick: k => k.stopPropagation(),
            children: [c.jsxs("div", {
                className: "pokedex-modal-header",
                children: [c.jsx("span", {
                    className: "pokedex-modal-title",
                    children: "Pokedex"
                }), c.jsxs("span", {
                    className: "pokedex-modal-counts",
                    children: [f, "/", x, " caught · ", g, "/", x, " seen"]
                }), c.jsx("button", {
                    className: "pokedex-modal-close",
                    onClick: s,
                    children: "X"
                })]
            }), c.jsx("div", {
                className: "pokedex-modal-grid-scroll",
                children: c.jsx("div", {
                    className: "pokedex-grid",
                    children: Lf.map( ([k]) => {
                        const A = y(k);
                        return c.jsx(Pf, {
                            speciesKey: k,
                            status: A,
                            rarity: "common",
                            isSelected: d === k,
                            onClick: () => o(v => v === k ? null : k),
                            isShinyCaught: u.shinyCaught.includes(k)
                        }, k)
                    }
                    )
                })
            }), d && h && c.jsxs("div", {
                className: "pokedex-modal-detail",
                children: [c.jsxs("div", {
                    className: "stats-panel-identity",
                    children: [c.jsx("img", {
                        className: `stats-panel-sprite ${p}`,
                        src: getPokemonSpriteUrl(h.id),
                        onError: e => e.target.src = '/assets/sprites/pokemon/0.gif',
                        alt: p === "unseen" ? "???" : h.name
                    }), c.jsxs("div", {
                        className: "stats-panel-name-block",
                        children: [c.jsx("span", {
                            className: "stats-panel-name",
                            children: p === "unseen" ? "???" : h.name
                        }), c.jsxs("span", {
                            className: "stats-panel-level",
                            children: ["#", String(h.id).padStart(3, "0")]
                        }), c.jsx("div", {
                            className: "stats-panel-types",
                            children: p === "unseen" ? c.jsx("span", {
                                className: "type-badge type-unknown",
                                children: "???"
                            }) : h.types.map(k => c.jsx("span", {
                                className: `type-badge type-${k.toLowerCase()}`,
                                children: k
                            }, k))
                        })]
                    })]
                }), p !== "unseen" && Ja[d] && c.jsxs("div", {
                    className: "pokedex-modal-routes",
                    children: [c.jsx("span", {
                        className: "pokedex-modal-routes-label",
                        children: "Routes: "
                    }), Ja[d].map( (k, A) => c.jsxs("span", {
                        style: {
                            whiteSpace: "nowrap"
                        },
                        children: [k, A < Ja[d].length - 1 ? ", " : ""]
                    }, k))]
                }), p !== "unseen" && c.jsx("div", {
                    className: "stats-panel-grid",
                    children: w.map(k => {
                        const A = Math.min(k.value / Dg * 100, 100);
                        return c.jsxs("div", {
                            className: "stats-panel-stat-row",
                            children: [c.jsx("span", {
                                className: "stats-panel-stat-label",
                                children: k.label
                            }), c.jsx("div", {
                                className: "stats-panel-stat-bar",
                                children: c.jsx("div", {
                                    className: "stats-panel-stat-fill",
                                    style: {
                                        width: `${A}%`,
                                        backgroundColor: Kg[k.key]
                                    }
                                })
                            }), c.jsx("span", {
                                className: "stats-panel-stat-value",
                                children: k.value
                            })]
                        }, k.key)
                    }
                    )
                })]
            })]
        })
    })
}
const qo = 30;
function Xf({inspected: s, setInspected: u, setReleaseConfirm: d, dragSource: o=null, boxDragOver: y=!1, boxDragFromIndex: f=null, boxDropTargetIndex: g=null, onBoxDragStart: x, onBoxSlotDragOver: h, onBoxDragOver: p, onBoxDrop: w, onBoxDragLeave: k, onDrop: A, onDragEnd: v}) {
    const {state: _, dispatch: S} = Re()
      , [D,z] = O.useState(0)
      , [V,G] = O.useState(!1)
      , X = Math.max(1, Math.ceil(_.box.length / qo))
      , Z = Math.min(D, X - 1)
      , F = ve => {
        d(null),
        u(s && s.source === "box" && s.id === ve ? null : {
            source: "box",
            id: ve
        })
    }
      , q = () => z((Z - 1 + X) % X)
      , le = () => z((Z + 1) % X);
    return c.jsxs(c.Fragment, {
        children: [c.jsxs("div", {
            className: `box-container${y ? " drag-over" : ""}`,
            onDragOver: p,
            onDrop: w,
            onDragLeave: k,
            children: [c.jsxs("div", {
                className: "box-header",
                children: [c.jsx("button", {
                    className: "box-pokedex-btn",
                    onClick: () => G(!0),
                    children: "Pokedex"
                }), c.jsx("button", {
                    className: "box-header-arrow",
                    onClick: q,
                    children: "<"
                }), c.jsxs("span", {
                    className: "box-header-name",
                    children: ["Box ", Z + 1]
                }), c.jsx("button", {
                    className: "box-header-arrow",
                    onClick: le,
                    children: ">"
                }), c.jsx("button", {
                    className: "box-sort-btn",
                    onClick: () => {
                        S({
                            type: "SORT_BOX"
                        }),
                        z(0)
                    }
                    ,
                    children: "Sort"
                })]
            }), c.jsx("div", {
                className: "box-grid-wrapper",
                children: c.jsx("div", {
                    className: "box-grid",
                    children: Array.from({
                        length: qo
                    }, (ve, Ne) => {
                        const Q = Z * qo + Ne
                          , J = _.box[Q];
                        if (J) {
                            const _e = pokemonSpecies[J.speciesKey]
                              , je = s?.source === "box" && s.id === J.id
                              , W = o === "box" && f === Q
                              , N = g === Q && o !== null
                              , Y = !!x;
                            return c.jsx("div", {
                                className: `box-grid-slot filled${je ? " inspected" : ""}${J.isShiny ? " shiny-slot" : ""}${W ? " dragging" : ""}${N ? " drop-target" : ""}`,
                                onClick: () => F(J.id),
                                title: `${J.name} Lv${J.level}`,
                                draggable: Y,
                                onDragStart: x ? P => x(P, Q, J.id) : void 0,
                                onDragOver: h ? P => h(P, Q) : void 0,
                                onDrop: A,
                                onDragEnd: v,
                                children: c.jsx("img", {
                                    src: getPokemonSpriteUrl(_e.id, !1, J.isShiny),
                                    onError: e => e.target.src = '/assets/sprites/pokemon/0.gif',
                                    alt: J.name,
                                    style: {
                                        imageRendering: "pixelated"
                                    }
                                })
                            }, J.id)
                        }
                        return c.jsx("div", {
                            className: `box-grid-slot${g === Q && o !== null ? " drop-target" : ""}`,
                            onDragOver: h ? _e => h(_e, Math.min(Q, _.box.length > 0 ? _.box.length - 1 : 0)) : void 0,
                            onDrop: A
                        }, `empty-${Ne}`)
                    }
                    )
                })
            })]
        }), V && c.jsx(jg, {
            onClose: () => G(!1)
        })]
    })
}
const ps = {
    source: "party",
    fromIndex: -1,
    pokemonId: null,
    target: null,
    targetIndex: null,
    position: null,
    droppedOnBoxContainer: !1
};
function Mg() {
    const {state: s, dispatch: u} = Re()
      , [d,o] = O.useState(null)
      , [y,f] = O.useState(null)
      , [g,x] = O.useState(null)
      , [h,p] = O.useState(null)
      , [w,k] = O.useState(null)
      , [A,v] = O.useState(null)
      , [_,S] = O.useState(!1)
      , [D,z] = O.useState(null)
      , [V,G] = O.useState(null)
      , X = O.useRef({
        ...ps
    })
      , Z = O.useCallback( () => {
        X.current = {
            ...ps
        },
        x(null),
        p(null),
        k(null),
        v(null),
        S(!1),
        z(null),
        G(null)
    }
    , [])
      , F = O.useCallback( (W, N, Y) => {
        W.dataTransfer.effectAllowed = "move",
        W.dataTransfer.setData("text/plain", String(N)),
        x(N),
        p("party"),
        X.current = {
            ...ps,
            source: "party",
            fromIndex: N,
            pokemonId: Y
        }
    }
    , [])
      , q = O.useCallback( (W, N, Y) => {
        W.dataTransfer.effectAllowed = "move",
        W.dataTransfer.setData("text/plain", String(N)),
        z(N),
        p("box"),
        X.current = {
            ...ps,
            source: "box",
            fromIndex: N,
            pokemonId: Y
        }
    }
    , [])
      , le = O.useCallback( (W, N) => {
        W.preventDefault(),
        W.dataTransfer.dropEffect = "move";
        const Y = W.currentTarget.getBoundingClientRect()
          , P = Y.top + Y.height / 2
          , ae = W.clientY < P ? "above" : "below";
        k(N),
        v(ae),
        S(!1),
        G(null),
        X.current.target = "party",
        X.current.targetIndex = N,
        X.current.position = ae,
        X.current.droppedOnBoxContainer = !1
    }
    , [])
      , ve = O.useCallback( (W, N) => {
        W.preventDefault(),
        W.stopPropagation(),
        W.dataTransfer.dropEffect = "move",
        G(N),
        k(null),
        v(null),
        S(!1),
        X.current.target = "box",
        X.current.targetIndex = N,
        X.current.droppedOnBoxContainer = !1
    }
    , [])
      , Ne = O.useCallback(W => {
        W.preventDefault()
    }
    , [])
      , Q = O.useCallback( () => {
        const {source: W, fromIndex: N, pokemonId: Y, target: P, targetIndex: ae, position: me, droppedOnBoxContainer: L} = X.current;
        if (W === "party")
            if (L && N >= 0)
                u({
                    type: "PARTY_TO_BOX",
                    payload: {
                        partyIndex: N
                    }
                });
            else if (P === "party" && Y && N >= 0 && ae !== null && me !== null) {
                let B = me === "below" ? ae + 1 : ae;
                N < B && (B -= 1),
                B = Math.max(0, Math.min(B, s.party.length - 1)),
                N !== B && u({
                    type: "REORDER_PARTY",
                    payload: {
                        pokemonId: Y,
                        toIndex: B
                    }
                })
            } else
                P === "box" && N >= 0 && u({
                    type: "PARTY_TO_BOX",
                    payload: {
                        partyIndex: N
                    }
                });
        else if (W === "box") {
            if (P === "box" && ae !== null && Y && N !== ae)
                u({
                    type: "REORDER_BOX",
                    payload: {
                        pokemonId: Y,
                        toIndex: ae
                    }
                });
            else if (P === "party" && ae !== null && Y) {
                const B = s.box.findIndex(I => I.id === Y);
                B >= 0 && (s.party.length < 6 ? u({
                    type: "BOX_TO_PARTY",
                    payload: {
                        boxIndex: B
                    }
                }) : u({
                    type: "SWAP_PARTY_BOX",
                    payload: {
                        partyIndex: ae,
                        boxIndex: B
                    }
                }))
            }
        }
        Z()
    }
    , [s.party.length, s.box, u, Z])
      , J = O.useCallback(W => {
        W.preventDefault(),
        W.dataTransfer.dropEffect = "move",
        X.current.source === "party" && (S(!0),
        X.current.droppedOnBoxContainer = !0,
        X.current.target = "box",
        X.current.targetIndex = null)
    }
    , [])
      , _e = O.useCallback(W => {
        W.preventDefault()
    }
    , [])
      , je = O.useCallback( () => {
        S(!1),
        X.current.droppedOnBoxContainer = !1
    }
    , []);
    return c.jsxs("div", {
        className: "side-panel left-panel",
        children: [c.jsx(qf, {
            inspected: d,
            setInspected: o,
            releaseConfirm: y,
            setReleaseConfirm: f,
            dragSource: h,
            dragFromIndex: g,
            dropTargetIndex: w,
            dropPosition: A,
            onDragStart: F,
            onDragOver: le,
            onDrop: Ne,
            onDragEnd: Q
        }), c.jsx(Xf, {
            inspected: d,
            setInspected: o,
            setReleaseConfirm: f,
            dragSource: h,
            boxDragOver: _,
            boxDragFromIndex: D,
            boxDropTargetIndex: V,
            onBoxDragStart: q,
            onBoxSlotDragOver: ve,
            onBoxDragOver: J,
            onBoxDrop: _e,
            onBoxDragLeave: je,
            onDrop: Ne,
            onDragEnd: Q
        })]
    })
}
const martShopItems = {
    viridianCity: {
        name: "Viridian Mart",
        items: [{
            itemId: "pokeball"
        }]
    },
    pewterCity: {
        name: "Pewter Mart",
        items: [{
            itemId: "pokeball"
        }, {
            itemId: "greatball",
            unlockWildBattlesWon: 50
        }]
    },
    ceruleanCity: {
        name: "Cerulean Mart",
        items: [{
            itemId: "pokeball"
        }, {
            itemId: "greatball"
        }, {
            itemId: "ultraball",
            unlockWildBattlesWon: 150
        }, {
            itemId: "repel"
        }, {
            itemId: "honey"
        }]
    },
    vermilionCity: {
        name: "Vermilion Mart",
        items: [{
            itemId: "pokeball"
        }, {
            itemId: "greatball"
        }, {
            itemId: "ultraball"
        }, {
            itemId: "repel"
        }, {
            itemId: "honey"
        }]
    },
    lavenderTown: {
        name: "Lavender Mart",
        items: [{
            itemId: "pokeball"
        }, {
            itemId: "greatball"
        }, {
            itemId: "ultraball"
        }, {
            itemId: "repel"
        }, {
            itemId: "honey"
        }]
    },
    celadonCity: {
        name: "Celadon Dept. Store",
        items: [{
            itemId: "pokeball"
        }, {
            itemId: "greatball"
        }, {
            itemId: "ultraball"
        }, {
            itemId: "repel"
        }, {
            itemId: "honey"
        }]
    },
    saffronCity: {
        name: "Saffron Mart",
        items: [{
            itemId: "pokeball"
        }, {
            itemId: "greatball"
        }, {
            itemId: "ultraball"
        }, {
            itemId: "repel"
        }, {
            itemId: "honey"
        }]
    },
    fuchsiaCity: {
        name: "Fuchsia Mart",
        items: [{
            itemId: "pokeball"
        }, {
            itemId: "greatball"
        }, {
            itemId: "ultraball"
        }, {
            itemId: "repel"
        }, {
            itemId: "honey"
        }]
    },
    cinnabarIsland: {
        name: "Cinnabar Mart",
        items: [{
            itemId: "pokeball"
        }, {
            itemId: "greatball"
        }, {
            itemId: "ultraball"
        }, {
            itemId: "repel"
        }, {
            itemId: "honey"
        }]
    },
    indigoPlat: {
        name: "Indigo Plateau Mart",
        items: [{
            itemId: "pokeball"
        }, {
            itemId: "greatball"
        }, {
            itemId: "ultraball"
        }, {
            itemId: "repel"
        }, {
            itemId: "honey"
        }]
    }
}
  , rarities = {
    common: "Common",
    uncommon: "Uncommon",
    rare: "Rare",
    very_rare: "Very Rare",
    ultra_rare: "Ultra Rare"
}
  , statColours = {
    hp: "#60a040",
    attack: "#c86828",
    defense: "#c8a828",
    spAttack: "#5878c8",
    spDefense: "#60a040",
    speed: "#d04870"
}
  , Og = Io.memo(function({speciesKey: u, encounter: d, rarity: o, rate: y, status: f, onClose: g, routeKey: x}) {
    const {state: h, dispatch: p} = Re()
      , w = pokemonSpecies[u];
    if (!w)
        return null;
    const k = h.inventory.repel ?? 0
      , A = h.inventory.honey ?? 0
      , v = h.activeEffects.find(G => G.type === "repel" && G.routeKey === x && G.speciesKey === u)
      , _ = h.activeEffects.find(G => G.type === "honey" && G.routeKey === x && G.speciesKey === u)
      , S = () => {
        k <= 0 || !x || p({
            type: "USE_EFFECT_ITEM",
            payload: {
                itemId: "repel",
                routeKey: x,
                speciesKey: u
            }
        })
    }
      , D = () => {
        A <= 0 || !x || p({
            type: "USE_EFFECT_ITEM",
            payload: {
                itemId: "honey",
                routeKey: x,
                speciesKey: u
            }
        })
    }
      , z = [{
        label: "HP",
        key: "hp",
        value: w.baseStats.hp
    }, {
        label: "Atk",
        key: "attack",
        value: w.baseStats.attack
    }, {
        label: "Def",
        key: "defense",
        value: w.baseStats.defense
    }, {
        label: "SpA",
        key: "spAttack",
        value: w.baseStats.spAttack
    }, {
        label: "SpD",
        key: "spDefense",
        value: w.baseStats.spDefense
    }, {
        label: "Spd",
        key: "speed",
        value: w.baseStats.speed
    }]
      , V = 200;
    return c.jsxs("div", {
        className: "stats-panel pokedex-detail",
        children: [c.jsx("div", {
            className: "stats-panel-header",
            children: c.jsx("button", {
                className: "stats-panel-close",
                onClick: g,
                children: "X"
            })
        }), c.jsxs("div", {
            className: "stats-panel-identity",
            children: [c.jsx("img", {
                className: `stats-panel-sprite ${f}`,
                src: getPokemonSpriteUrl(w.id),
            onError: e => e.target.src = '/assets/sprites/pokemon/0.gif',
                alt: f === "unseen" ? "???" : w.name
            }), c.jsxs("div", {
                className: "stats-panel-name-block",
                children: [c.jsx("span", {
                    className: "stats-panel-name",
                    children: f === "unseen" ? "???" : w.name
                }), c.jsx("span", {
                    className: "stats-panel-level",
                    children: f === "unseen" ? "Lv ??" : `Lv ${d.minLevel}-${d.maxLevel}`
                }), c.jsx("div", {
                    className: "stats-panel-types",
                    children: f === "unseen" ? c.jsx("span", {
                        className: "type-badge type-unknown",
                        children: "???"
                    }) : w.types.map(G => c.jsx("span", {
                        className: `type-badge type-${G.toLowerCase()}`,
                        children: G
                    }, G))
                })]
            })]
        }), c.jsx("div", {
            className: "pokedex-detail-encounter-info",
            children: c.jsx("span", {
                className: `pokedex-detail-rarity rarity-text-${o}`,
                children: rarities[o]
            })
        }), x && f !== "unseen" && c.jsxs("div", {
            className: "pokedex-detail-effects",
            children: [c.jsx("button", {
                className: `effect-use-btn repel-btn${k <= 0 ? " disabled" : ""}${v ? " active" : ""}`,
                onClick: S,
                disabled: k <= 0,
                title: v ? `Repel active: ${v.battlesRemaining} battles left` : `Use Repel (x${k})`,
                children: v ? `Repel (${v.battlesRemaining})` : `Repel (x${k})`
            }), c.jsx("button", {
                className: `effect-use-btn honey-btn${A <= 0 ? " disabled" : ""}${_ ? " active" : ""}`,
                onClick: D,
                disabled: A <= 0,
                title: _ ? `Honey active: ${_.battlesRemaining} battles left` : `Use Honey (x${A})`,
                children: _ ? `Honey (${_.battlesRemaining})` : `Honey (x${A})`
            })]
        }), f !== "unseen" && c.jsx("div", {
            className: "stats-panel-grid",
            children: z.map(G => {
                const X = Math.min(G.value / V * 100, 100);
                return c.jsxs("div", {
                    className: "stats-panel-stat-row",
                    children: [c.jsx("span", {
                        className: "stats-panel-stat-label",
                        children: G.label
                    }), c.jsx("div", {
                        className: "stats-panel-stat-bar",
                        children: c.jsx("div", {
                            className: "stats-panel-stat-fill",
                            style: {
                                width: `${X}%`,
                                backgroundColor: statColours[G.key]
                            }
                        })
                    }), c.jsx("span", {
                        className: "stats-panel-stat-value",
                        children: G.value
                    })]
                }, G.key)
            }
            )
        })]
    })
})
  , zg = {
    pokeball: {
        top: "#c83030",
        bottom: "#e8dcc0",
        ring: "#e8dcc0",
        dot: "#2a1808"
    },
    greatball: {
        top: "#3060c8",
        bottom: "#e8dcc0",
        ring: "#e8dcc0",
        dot: "#2a1808"
    },
    ultraball: {
        top: "#c8a828",
        bottom: "#e8dcc0",
        ring: "#e8dcc0",
        dot: "#2a1808"
    },
    masterball: {
        top: "#7030a0",
        bottom: "#e8dcc0",
        ring: "#e8dcc0",
        dot: "#f0d060"
    }
};
function Wo({ballId: s, size: u=10, disabled: d}) {
    const o = O.useId()
      , y = zg[s];
    return c.jsxs("svg", {
        className: d ? "pokeball-disabled" : void 0,
        viewBox: "0 0 24 24",
        width: u,
        height: u,
        children: [c.jsx("defs", {
            children: c.jsx("clipPath", {
                id: o,
                children: c.jsx("circle", {
                    cx: "12",
                    cy: "12",
                    r: "11"
                })
            })
        }), c.jsx("circle", {
            cx: "12",
            cy: "12",
            r: "11",
            fill: y.top,
            stroke: "#2a1808",
            strokeWidth: "2"
        }), c.jsx("rect", {
            x: "0",
            y: "12",
            width: "24",
            height: "12",
            fill: y.bottom,
            clipPath: `url(#${o})`
        }), c.jsx("circle", {
            cx: "12",
            cy: "12",
            r: "11",
            fill: "none",
            stroke: "#2a1808",
            strokeWidth: "2"
        }), c.jsx("line", {
            x1: "1",
            y1: "12",
            x2: "8",
            y2: "12",
            stroke: "#2a1808",
            strokeWidth: "2"
        }), c.jsx("line", {
            x1: "16",
            y1: "12",
            x2: "23",
            y2: "12",
            stroke: "#2a1808",
            strokeWidth: "2"
        }), c.jsx("circle", {
            cx: "12",
            cy: "12",
            r: "4",
            fill: y.ring,
            stroke: "#2a1808",
            strokeWidth: "2"
        }), c.jsx("circle", {
            cx: "12",
            cy: "12",
            r: "2",
            fill: y.dot
        })]
    })
}
function Tf(s) {
    return s >= 20 ? "common" : s >= 10 ? "uncommon" : s >= 5 ? "rare" : s >= 1 ? "very_rare" : "ultra_rare"
}
function Nf({routeKey: s, encounters: u, onOpenCatchSettings: d, forceRarity: o}) {
    const {state: y, dispatch: f} = Re()
      , [g,x] = O.useState(null)
      , [h,p] = O.useState(null)
      , w = y.inventory.repel ?? 0
      , k = y.inventory.honey ?? 0
      , A = O.useMemo( () => u.reduce( (Z, F) => Z + F.weight, 0), [u])
      , v = O.useMemo( () => [...u].sort( (Z, F) => F.weight - Z.weight), [u])
      , _ = O.useMemo( () => {
        const Z = {};
        for (const F of y.activeEffects)
            (F.type === "repel" || F.type === "honey") && F.routeKey === s && F.speciesKey && (Z[F.speciesKey] || (Z[F.speciesKey] = {
                repel: !1,
                honey: !1
            }),
            Z[F.speciesKey][F.type] = !0);
        return Z
    }
    , [y.activeEffects, s])
      , S = O.useCallback(Z => y.pokedexCaught.includes(Z) ? "caught" : y.pokedexSeen.includes(Z) ? "seen" : "unseen", [y.pokedexSeen, y.pokedexCaught])
      , D = O.useCallback(Z => {
        if (h) {
            if (S(Z) === "unseen")
                return;
            const q = y.inventory[h] ?? 0;
            if (q <= 0)
                return;
            q <= 1 && p(null),
            f({
                type: "USE_EFFECT_ITEM",
                payload: {
                    itemId: h,
                    routeKey: s,
                    speciesKey: Z
                }
            });
            return
        }
        x(F => F === Z ? null : Z)
    }
    , [h, S, y.inventory, f, s])
      , z = O.useCallback( () => {
        x(null)
    }
    , [])
      , V = g ? u.find(Z => Z.speciesKey === g) : null
      , G = V && A > 0 ? V.weight / A * 100 : 0
      , X = o ?? (G > 0 ? Tf(G) : "common");
    return c.jsxs("div", {
        className: "pokedex-grid-container",
        children: [c.jsxs("div", {
            className: "pokedex-grid-header",
            children: [c.jsx("div", {
                className: "location-section-title",
                children: "Wild Pokemon"
            }), c.jsxs("div", {
                className: "pokedex-header-actions",
                children: [c.jsx("button", {
                    className: `effect-selector-btn repel-btn${h === "repel" ? " active-mode" : ""}${w <= 0 ? " disabled" : ""}`,
                    onClick: () => {
                        p(Z => Z === "repel" ? null : "repel"),
                        x(null)
                    }
                    ,
                    disabled: w <= 0 && h !== "repel",
                    title: "Click then select a pokemon to apply Repel",
                    children: h === "repel" ? "Applying..." : `Repel (${w})`
                }), c.jsx("button", {
                    className: `effect-selector-btn honey-btn${h === "honey" ? " active-mode" : ""}${k <= 0 ? " disabled" : ""}`,
                    onClick: () => {
                        p(Z => Z === "honey" ? null : "honey"),
                        x(null)
                    }
                    ,
                    disabled: k <= 0 && h !== "honey",
                    title: "Click then select a pokemon to apply Honey",
                    children: h === "honey" ? "Applying..." : `Honey (${k})`
                }), c.jsxs("button", {
                    className: "pokedex-settings-btn",
                    onClick: d,
                    title: "Catch Settings",
                    children: [c.jsx(Wo, {
                        ballId: "pokeball",
                        size: 14
                    }), c.jsx("span", {
                        children: "Catch"
                    })]
                })]
            })]
        }), c.jsx("div", {
            className: `pokedex-grid${h ? " selector-mode" : ""}`,
            children: v.map(Z => {
                const F = A > 0 ? Z.weight / A * 100 : 0
                  , q = o ?? Tf(F);
                return c.jsx(Pf, {
                    speciesKey: Z.speciesKey,
                    status: S(Z.speciesKey),
                    rarity: q,
                    isSelected: g === Z.speciesKey,
                    onClick: () => D(Z.speciesKey),
                    isShinyCaught: y.shinyCaught.includes(Z.speciesKey),
                    activeEffect: _[Z.speciesKey] ?? null,
                    selectorMode: h
                }, Z.speciesKey)
            }
            )
        }), g && V && c.jsx(Og, {
            speciesKey: g,
            encounter: V,
            rarity: X,
            rate: G,
            status: S(g),
            onClose: z,
            routeKey: s
        })]
    })
}
function Hg({shopDef: s}) {
    const {state: u, dispatch: d} = Re()
      , [o,y] = O.useState(1);
    return c.jsxs("div", {
        className: "shop-panel",
        children: [c.jsxs("div", {
            className: "shop-header",
            children: [c.jsx("span", {
                className: "shop-name",
                children: s.name
            }), c.jsx("div", {
                className: "shop-qty-selector",
                children: [1, 10, 100, "max"].map(f => c.jsx("button", {
                    className: `shop-qty-btn${o === f ? " active" : ""}`,
                    onClick: () => y(f),
                    children: f === "max" ? "Max" : f
                }, String(f)))
            })]
        }), c.jsx("div", {
            className: "shop-items",
            children: s.items.map(f => {
                if (f.unlockWildBattlesWon && u.wildBattlesWon < f.unlockWildBattlesWon)
                    return null;
                if (Vl(f.itemId)) {
                    const x = Yn[f.itemId];
                    return x.buyPrice ? c.jsx(Yg, {
                        itemId: f.itemId,
                        name: x.name,
                        description: x.description,
                        price: x.buyPrice,
                        owned: u.inventory[f.itemId] ?? 0,
                        money: u.money,
                        qtyMode: o,
                        dispatch: d
                    }, f.itemId) : null
                }
                const g = Ka[f.itemId];
                return !g || !g.buyPrice ? null : c.jsx(Ug, {
                    itemId: f.itemId,
                    ballId: f.itemId,
                    name: g.name,
                    description: g.description,
                    price: g.buyPrice,
                    owned: u.inventory[f.itemId] ?? 0,
                    money: u.money,
                    qtyMode: o,
                    dispatch: d
                }, f.itemId)
            }
            )
        })]
    })
}
function Ug({itemId: s, ballId: u, name: d, description: o, price: y, owned: f, money: g, qtyMode: x, dispatch: h}) {
    const p = x === "max" ? Math.max(1, Math.floor(g / y)) : x
      , w = y * p
      , k = g >= w
      , A = O.useCallback( () => {
        k && h({
            type: "BUY_ITEM",
            payload: {
                itemId: s,
                quantity: p
            }
        })
    }
    , [k, h, s, p]);
    return c.jsxs("div", {
        className: "shop-item-row",
        children: [c.jsx(Wo, {
            ballId: u,
            size: 14
        }), c.jsxs("div", {
            className: "shop-item-info",
            children: [c.jsx("span", {
                className: "shop-item-name",
                children: d
            }), c.jsx("span", {
                className: "shop-item-desc",
                children: o
            })]
        }), c.jsxs("span", {
            className: "shop-owned",
            children: ["x", f]
        }), c.jsxs("button", {
            className: `shop-buy-btn${k ? "" : " disabled"}`,
            onClick: A,
            disabled: !k,
            children: ["Buy ", p, " - $", w.toLocaleString()]
        })]
    })
}
function Yg({itemId: s, name: u, description: d, price: o, owned: y, money: f, qtyMode: g, dispatch: x}) {
    const h = g === "max" ? Math.max(1, Math.floor(f / o)) : g
      , p = o * h
      , w = f >= p
      , k = O.useCallback( () => {
        w && x({
            type: "BUY_ITEM",
            payload: {
                itemId: s,
                quantity: h
            }
        })
    }
    , [w, x, s, h]);
    return c.jsxs("div", {
        className: "shop-item-row",
        children: [c.jsx("div", {
            className: "shop-item-icon-placeholder"
        }), c.jsxs("div", {
            className: "shop-item-info",
            children: [c.jsx("span", {
                className: "shop-item-name",
                children: u
            }), c.jsx("span", {
                className: "shop-item-desc",
                children: d
            })]
        }), c.jsxs("span", {
            className: "shop-owned",
            children: ["x", y]
        }), c.jsxs("button", {
            className: `shop-buy-btn${w ? "" : " disabled"}`,
            onClick: k,
            disabled: !w,
            children: ["Buy ", h, " - $", p.toLocaleString()]
        })]
    })
}
function Vf({onOpenCatchSettings: s}) {
    const {state: u, dispatch: d} = Re()
      , o = mapData[u.currentLocation]
      , y = Object.values(mapData).filter(h => {
        if (u.unlockedLocations.includes(h.id))
            return !1;
        const p = h.unlock;
        return p.battlesAtLocation !== void 0 || p.badgesRequired !== void 0 || p.championDefeated
    }
    ).sort( (h, p) => h.unlockOrder - p.unlockOrder)[0]
      , f = u.defeatedGyms.length
      , g = o?.routeKey
      , x = g ? mapEncounterData[g] : null;
    if (!o)
        return null;
    if (o.type === "raid") {
        const h = u.raidLegendary ? pokemonSpecies[u.raidLegendary] : null;
        return c.jsx("div", {
            className: "location-panel-scroll",
            children: c.jsxs("div", {
                className: "location-info raid-location-panel",
                children: [c.jsxs("div", {
                    className: "location-header",
                    children: [c.jsx("span", {
                        className: "location-type-icon",
                        children: "⚔️"
                    }), c.jsxs("div", {
                        children: [c.jsx("div", {
                            className: "location-name",
                            children: o.name
                        }), c.jsx("div", {
                            className: "location-type-label",
                            children: "Legendary Raid"
                        })]
                    })]
                }), c.jsx("p", {
                    className: "location-description",
                    children: o.description
                }), h && c.jsxs("div", {
                    className: "raid-legendary-info",
                    children: [c.jsx("img", {
                        src: `/assets/sprites/pokemon/${h.id}.png`,
                        alt: h.name,
                        className: "raid-legendary-sprite"
                    }), c.jsx("div", {
                        className: "raid-legendary-name",
                        children: h.name
                    })]
                }), c.jsx(Nf, {
                    routeKey: "raidIsland",
                    encounters: Wa.map(p => ({
                        speciesKey: p.speciesKey,
                        weight: 1,
                        minLevel: p.level,
                        maxLevel: p.level
                    })),
                    onOpenCatchSettings: s ?? ( () => {}
                    ),
                    forceRarity: "very_rare"
                }), c.jsx("button", {
                    className: "raid-leave-btn",
                    onClick: () => d({
                        type: "TRAVEL",
                        payload: {
                            locationId: u.preRaidLocation || "palletTown"
                        }
                    }),
                    children: "Leave Raid"
                })]
            })
        })
    }
    return c.jsx("div", {
        className: "location-panel-scroll",
        children: c.jsxs("div", {
            className: "location-info",
            children: [c.jsxs("div", {
                className: "location-header",
                children: [c.jsx("span", {
                    className: "location-type-icon",
                    children: o.type === "town" ? "🏠" : "🌿"
                }), c.jsxs("div", {
                    children: [c.jsx("div", {
                        className: "location-name",
                        children: o.name
                    }), c.jsx("div", {
                        className: "location-type-label",
                        children: o.type === "town" ? "Town" : "Route"
                    })]
                })]
            }), c.jsx("p", {
                className: "location-description",
                children: o.description
            }), o.type === "town" && c.jsxs(c.Fragment, {
                children: [c.jsx("div", {
                    className: "location-status",
                    children: c.jsx("span", {
                        className: "location-status-label",
                        children: "Trainer battles"
                    })
                }), martShopItems[u.currentLocation] && c.jsx(Hg, {
                    shopDef: martShopItems[u.currentLocation]
                })]
            }), x && g && c.jsx(Nf, {
                routeKey: g,
                encounters: x.encounters,
                onOpenCatchSettings: s ?? ( () => {}
                )
            }), y && ( () => {
                const h = y.unlock
                  , p = [];
                if (h.battlesAtLocation)
                    for (const w of h.battlesAtLocation) {
                        const k = mapData[w.locationId]?.name ?? w.locationId
                          , A = u.battlesWonByLocation[w.locationId] ?? 0;
                        p.push({
                            label: `Battles at ${k}`,
                            current: A,
                            required: w.count,
                            met: A >= w.count
                        })
                    }
                return h.badgesRequired && p.push({
                    label: "Badges",
                    current: f,
                    required: h.badgesRequired,
                    met: f >= h.badgesRequired
                }),
                h.championDefeated && p.push({
                    label: "Beat Champion",
                    current: u.championDefeated ? 1 : 0,
                    required: 1,
                    met: u.championDefeated
                }),
                c.jsxs("div", {
                    className: "location-next-unlock",
                    children: [c.jsx("div", {
                        className: "location-section-title",
                        children: "Next Unlock"
                    }), c.jsx("div", {
                        className: "location-unlock-name",
                        children: y.name
                    }), c.jsx("div", {
                        className: "location-unlock-checklist",
                        children: p.map( (w, k) => c.jsxs("div", {
                            className: `location-unlock-check${w.met ? " met" : ""}`,
                            children: [c.jsx("span", {
                                className: "location-unlock-check-icon",
                                children: w.met ? "✓" : "○"
                            }), c.jsx("span", {
                                className: "location-unlock-check-label",
                                children: w.met || w.label === "Beat Champion" ? w.label : `${w.current}/${w.required} ${w.label.toLowerCase()}`
                            })]
                        }, k))
                    })]
                })
            }
            )()]
        })
    })
}
const Gg = [{
    value: "always",
    label: "Always catch"
}, {
    value: "shiny_only",
    label: "Only if shiny"
}, {
    value: "level_threshold",
    label: "Above level:"
}, {
    value: "pokedex_new",
    label: "Not caught yet"
}]
  , Qf = Io.memo(function({routeKey: u, encounters: d, onClose: o}) {
    const {state: y, dispatch: f} = Re()
      , g = Ra(y, u, d[0]?.speciesKey)
      , x = g.mode
      , h = g.enabledBalls
      , p = g.levelThreshold
      , w = O.useCallback(D => {
        for (const z of d) {
            const V = Ra(y, u, z.speciesKey);
            f({
                type: "SET_CATCH_RULE",
                payload: {
                    routeKey: u,
                    speciesKey: z.speciesKey,
                    rule: {
                        ...V,
                        mode: D
                    }
                }
            })
        }
    }
    , [y, u, d, f])
      , k = O.useCallback(D => {
        const z = Math.max(1, Math.min(100, Number(D.target.value) || 1));
        for (const V of d) {
            const G = Ra(y, u, V.speciesKey);
            f({
                type: "SET_CATCH_RULE",
                payload: {
                    routeKey: u,
                    speciesKey: V.speciesKey,
                    rule: {
                        ...G,
                        levelThreshold: z
                    }
                }
            })
        }
    }
    , [y, u, d, f])
      , A = O.useCallback(D => {
        for (const z of d) {
            const V = Ra(y, u, z.speciesKey)
              , G = V.enabledBalls;
            let X;
            G.includes(D) ? X = G.filter(Z => Z !== D) : X = [...G, D],
            f({
                type: "SET_CATCH_RULE",
                payload: {
                    routeKey: u,
                    speciesKey: z.speciesKey,
                    rule: {
                        ...V,
                        enabledBalls: X
                    }
                }
            })
        }
    }
    , [y, u, d, f])
      , v = O.useCallback(D => {
        const z = Ra(y, u, D);
        f({
            type: "SET_CATCH_RULE",
            payload: {
                routeKey: u,
                speciesKey: D,
                rule: {
                    ...z,
                    enabled: !z.enabled
                }
            }
        })
    }
    , [y, u, f])
      , _ = O.useCallback( () => {
        f({
            type: "TOGGLE_ROUTE_CATCH_ALL",
            payload: {
                routeKey: u,
                enabled: !0
            }
        })
    }
    , [u, f])
      , S = O.useCallback( () => {
        f({
            type: "TOGGLE_ROUTE_CATCH_ALL",
            payload: {
                routeKey: u,
                enabled: !1
            }
        })
    }
    , [u, f]);
    return c.jsx("div", {
        className: "catch-modal-overlay",
        onClick: o,
        children: c.jsxs("div", {
            className: "catch-modal",
            onClick: D => D.stopPropagation(),
            children: [c.jsxs("div", {
                className: "catch-modal-header",
                children: [c.jsx("span", {
                    className: "catch-modal-title",
                    children: "Catch Settings"
                }), c.jsx("button", {
                    className: "catch-modal-close",
                    onClick: o,
                    children: "X"
                })]
            }), c.jsx("button", {
                className: `catch-shiny-toggle${y.alwaysCatchShinies ? " active" : ""}`,
                onClick: () => f({
                    type: "SET_ALWAYS_CATCH_SHINIES",
                    payload: {
                        value: !y.alwaysCatchShinies
                    }
                }),
                children: "★ Always catch shinies"
            }), c.jsxs("div", {
                className: "catch-modal-route-settings",
                children: [c.jsx("div", {
                    className: "catch-modal-section-title",
                    children: "Catch Mode"
                }), Gg.map( ({value: D, label: z}) => c.jsxs("label", {
                    className: "catch-mode-option",
                    children: [c.jsx("input", {
                        type: "radio",
                        name: "modal-catch-mode",
                        checked: x === D,
                        onChange: () => w(D)
                    }), c.jsx("span", {
                        children: z
                    }), D === "level_threshold" && x === "level_threshold" && c.jsx("input", {
                        type: "number",
                        className: "level-threshold-input",
                        value: p,
                        onChange: k,
                        min: 1,
                        max: 100,
                        onClick: V => V.stopPropagation()
                    })]
                }, D)), c.jsxs("div", {
                    className: "catch-ball-selector",
                    children: [c.jsx("span", {
                        className: "catch-ball-label",
                        children: "Ball:"
                    }), Fo.map(D => c.jsx("button", {
                        className: `catch-ball-icon-btn${h.includes(D) ? " active" : ""}`,
                        onClick: () => A(D),
                        title: Ka[D].name,
                        children: c.jsx(Wo, {
                            ballId: D,
                            size: 10,
                            disabled: !h.includes(D)
                        })
                    }, D))]
                })]
            }), c.jsx("div", {
                className: "catch-modal-divider"
            }), c.jsxs("div", {
                className: "catch-modal-species-header",
                children: [c.jsx("span", {
                    className: "catch-modal-section-title",
                    children: "Pokemon"
                }), c.jsxs("div", {
                    className: "catch-modal-bulk-btns",
                    children: [c.jsx("button", {
                        className: "encounter-bulk-btn",
                        onClick: _,
                        children: "All"
                    }), c.jsx("button", {
                        className: "encounter-bulk-btn",
                        onClick: S,
                        children: "None"
                    })]
                })]
            }), c.jsx("div", {
                className: "catch-modal-species-list",
                children: d.map(D => {
                    const z = pokemonSpecies[D.speciesKey];
                    if (!z)
                        return null;
                    const V = Ra(y, u, D.speciesKey);
                    return c.jsxs("div", {
                        className: "catch-modal-species-row",
                        onClick: () => v(D.speciesKey),
                        children: [c.jsx("img", {
                            className: "catch-modal-species-sprite",
                            src: getPokemonSpriteUrl(z.id),
                            onError: e => e.target.src = '/assets/sprites/pokemon/0.gif',
                            alt: z.name
                        }), c.jsx("span", {
                            className: "catch-modal-species-name",
                            children: z.name
                        }), c.jsx("span", {
                            className: `catch-toggle${V.enabled ? " active" : ""}`,
                            children: V.enabled ? "CATCH" : "SKIP"
                        })]
                    }, D.speciesKey)
                }
                )
            })]
        })
    })
});
function If() {
    const {state: s, dispatch: u} = Re()
      , [d,o] = O.useState(0)
      , [y,f] = O.useState(null)
      , g = ds[d]
      , x = Object.entries(s.inventory).filter( ([S,D]) => D > 0 && Oh(S) === g.id)
      , h = () => {
        o((d - 1 + ds.length) % ds.length),
        f(null)
    }
      , p = () => {
        o((d + 1) % ds.length),
        f(null)
    }
      , w = S => {
        f(D => D === S ? null : S)
    }
      , k = S => {
        Vl(S) && S === "expShare" && u({
            type: "USE_EFFECT_ITEM",
            payload: {
                itemId: S
            }
        })
    }
      , A = y ? Xo(y) : null
      , v = y === "expShare" && (s.inventory[y] ?? 0) > 0
      , _ = y && Vl(y) ? s.activeEffects.filter(S => S.type === y) : [];
    return c.jsxs("div", {
        className: "bag-container",
        children: [c.jsxs("div", {
            className: "bag-header",
            children: [c.jsx("span", {
                className: "bag-header-spacer"
            }), c.jsx("button", {
                className: "bag-header-arrow",
                onClick: h,
                children: "<"
            }), c.jsx("span", {
                className: "bag-header-name",
                children: g.label
            }), c.jsx("button", {
                className: "bag-header-arrow",
                onClick: p,
                children: ">"
            }), c.jsxs("span", {
                className: "bag-header-money",
                children: ["₽", s.money.toLocaleString()]
            })]
        }), c.jsx("div", {
            className: "bag-content",
            children: x.length > 0 ? c.jsx("div", {
                className: "bag-item-list",
                children: x.map( ([S,D]) => {
                    const z = Xo(S)
                      , V = Vl(S) && s.activeEffects.some(G => G.type === S);
                    return c.jsxs("div", {
                        className: `bag-item${y === S ? " selected" : ""}${V ? " effect-active" : ""}`,
                        onClick: () => w(S),
                        children: [c.jsx("span", {
                            className: "bag-item-name",
                            children: z.name
                        }), c.jsxs("span", {
                            className: "bag-item-qty",
                            children: ["x", D]
                        })]
                    }, S)
                }
                )
            }) : c.jsx("div", {
                className: "bag-empty",
                children: "No items."
            })
        }), A && c.jsxs("div", {
            className: "bag-description",
            children: [A.description, v && c.jsx("button", {
                className: "bag-use-btn",
                onClick: () => k(y),
                children: "Use"
            }), _.length > 0 && c.jsx("div", {
                className: "bag-active-effects",
                children: _.map( (S, D) => c.jsxs("span", {
                    className: "bag-effect-status",
                    children: ["Active: ", S.battlesRemaining, " battles left"]
                }, D))
            })]
        })]
    })
}
function Po(s) {
    return s.map(u => {
        const d = pokemonSpecies[u.speciesKey]
          , o = calculatePokemonStats(d, u.level, getPerfectIVs())
          , y = resolvePokemonMoves(u.speciesKey, u.level);
        return {
            speciesKey: u.speciesKey,
            name: d.name,
            types: d.types,
            level: u.level,
            currentHp: o.hp,
            maxHp: o.hp,
            attack: o.attack,
            defense: o.defense,
            spAttack: o.spAttack,
            spDefense: o.spDefense,
            speed: o.speed,
            moves: y,
            isPlayer: !1,
            isShiny: checkShinyOdds()
        }
    }
    )
}
function Zf({onOpenShop: s}) {
    const {state: u, dispatch: d} = Re()
      , o = u.party.some(w => w.currentHp > 0)
      , y = u.phase === "evolving" || u.phase === "healing"
      , f = o && !y
      , g = (w, k, A, v) => {
        f && ((u.phase === "battling" || u.phase === "victory" || u.phase === "defeat") && d({
            type: "PHASE_IDLE"
        }),
        d({
            type: "START_HEALING",
            payload: {
                pendingBossBattle: {
                    bossId: w,
                    bossType: "gym",
                    trainerName: k,
                    trainerClass: "ace",
                    trainerTeam: Po(A),
                    spriteKey: v
                }
            }
        }))
    }
      , x = () => {
        if (!f)
            return;
        (u.phase === "battling" || u.phase === "victory" || u.phase === "defeat") && d({
            type: "PHASE_IDLE"
        }),
        d({
            type: "RESET_ELITE_FOUR"
        });
        const w = [...hf.map(v => ({
            bossId: v.id,
            bossType: "e4",
            trainerName: v.name,
            trainerClass: "ace",
            trainerTeam: Po(v.team),
            spriteKey: v.spriteKey
        })), {
            bossId: zn.id,
            bossType: "champion",
            trainerName: zn.name,
            trainerClass: "ace",
            trainerTeam: Po(zn.team),
            spriteKey: zn.spriteKey
        }]
          , [k,...A] = w;
        d({
            type: "START_HEALING",
            payload: {
                pendingBossBattle: {
                    ...k,
                    bossQueue: A
                }
            }
        })
    }
      , h = u.unlockedLocations.includes("indigoPlat")
      , p = u.bossBattle && (u.bossBattle.bossType === "e4" || u.bossBattle.bossType === "champion");
    return c.jsxs("div", {
        className: "gym-panel",
        children: [c.jsx("div", {
            className: "gym-badge-display",
            children: yf.map(w => {
                const k = u.defeatedGyms.includes(w.id);
                return c.jsx("div", {
                    className: `gym-badge-slot${k ? " earned" : ""}`,
                    style: k ? {
                        backgroundColor: w.badgeColor
                    } : void 0,
                    title: k ? w.badgeName : "???"
                }, w.id)
            }
            )
        }), c.jsxs("div", {
            className: "gym-section",
            children: [c.jsx("div", {
                className: "gym-section-title",
                children: "Gym Leaders"
            }), yf.map( (w, k) => {
                const A = u.unlockedLocations.includes(w.locationKey)
                  , v = u.defeatedGyms.includes(w.id)
                  , _ = u.defeatedGyms.length >= k
                  , S = A && _;
                return c.jsxs("div", {
                    className: `gym-row${S ? "" : " locked"}${v ? " defeated" : ""}`,
                    children: [c.jsxs("div", {
                        className: "gym-row-info",
                        children: [c.jsx("span", {
                            className: "gym-leader-name",
                            children: S ? w.name : "???"
                        }), c.jsx("span", {
                            className: "gym-badge-label",
                            children: S ? w.badgeName : "Locked"
                        })]
                    }), c.jsxs("div", {
                        className: "gym-row-status",
                        children: [v && c.jsx("span", {
                            className: "gym-defeated-mark",
                            children: "✓"
                        }), S ? c.jsx("button", {
                            className: "gym-fight-btn",
                            disabled: !f,
                            onClick: () => g(w.id, w.name, w.team, w.spriteKey),
                            children: "FIGHT"
                        }) : c.jsx("span", {
                            className: "gym-locked-label",
                            children: "LOCKED"
                        })]
                    })]
                }, w.id)
            }
            )]
        }), h && c.jsxs("div", {
            className: "gym-section",
            children: [c.jsx("div", {
                className: "gym-section-title",
                children: "Elite Four & Champion"
            }), c.jsx("button", {
                className: "gym-fight-btn champion",
                disabled: !f || !!p,
                onClick: x,
                style: {
                    width: "100%",
                    marginBottom: "6px"
                },
                children: "BEGIN CHALLENGE"
            }), hf.map(w => {
                const k = u.defeatedEliteFour.includes(w.id)
                  , A = u.bossBattle?.bossType === "e4" && u.bossBattle?.bossId === w.id;
                return c.jsxs("div", {
                    className: `gym-row${k ? " defeated" : ""}${A ? " active-gauntlet" : ""}`,
                    children: [c.jsxs("div", {
                        className: "gym-row-info",
                        children: [c.jsx("span", {
                            className: "gym-leader-name",
                            children: w.name
                        }), c.jsx("span", {
                            className: "gym-badge-label",
                            children: w.title
                        })]
                    }), c.jsx("div", {
                        className: "gym-row-status",
                        children: k && c.jsx("span", {
                            className: "gym-defeated-mark",
                            children: "✓"
                        })
                    })]
                }, w.id)
            }
            ), c.jsxs("div", {
                className: `gym-row${u.championDefeated ? " defeated" : ""}${u.bossBattle?.bossType === "champion" ? " active-gauntlet" : ""}`,
                children: [c.jsxs("div", {
                    className: "gym-row-info",
                    children: [c.jsx("span", {
                        className: "gym-leader-name",
                        children: zn.name
                    }), c.jsx("span", {
                        className: "gym-badge-label",
                        children: zn.title
                    })]
                }), c.jsx("div", {
                    className: "gym-row-status",
                    children: u.championDefeated && c.jsx("span", {
                        className: "gym-defeated-mark",
                        children: "✓"
                    })
                })]
            })]
        }), u.defeatedGyms.length > 0 && c.jsxs("div", {
            className: "gym-section",
            children: [c.jsx("div", {
                className: "gym-section-title",
                children: "Victory Tokens"
            }), c.jsxs("div", {
                className: "victory-token-bar",
                children: [c.jsx("span", {
                    className: "victory-token-count",
                    children: u.victoryTokens
                }), c.jsx("button", {
                    className: "reward-shop-open-btn",
                    onClick: s,
                    children: "Reward Shop"
                })]
            })]
        })]
    })
}
function Ff({onClose: s}) {
    const {state: u, dispatch: d} = Re();
    return c.jsx("div", {
        className: "battle-info-overlay",
        onClick: s,
        children: c.jsxs("div", {
            className: "battle-info-modal",
            onClick: o => o.stopPropagation(),
            children: [c.jsxs("div", {
                className: "battle-info-header",
                children: [c.jsx("span", {
                    className: "battle-info-title",
                    children: "Reward Shop"
                }), c.jsx("button", {
                    className: "battle-info-close",
                    onClick: s,
                    children: "X"
                })]
            }), c.jsxs("div", {
                className: "battle-info-content",
                children: [c.jsxs("div", {
                    className: "reward-shop-token-display",
                    children: ["Victory Tokens: ", c.jsx("strong", {
                        children: u.victoryTokens
                    })]
                }), c.jsx("div", {
                    className: "reward-shop-list",
                    children: zh.map(o => {
                        const y = Xo(o.itemId)
                          , f = u.inventory[o.itemId] ?? 0
                          , g = u.victoryTokens >= o.tokenCost;
                        return c.jsxs("div", {
                            className: "reward-shop-row",
                            children: [c.jsxs("div", {
                                className: "reward-shop-item-info",
                                children: [c.jsx("span", {
                                    className: "reward-shop-item-name",
                                    children: y.name
                                }), c.jsx("span", {
                                    className: "reward-shop-item-desc",
                                    children: y.description
                                })]
                            }), c.jsxs("div", {
                                className: "reward-shop-item-right",
                                children: [c.jsxs("span", {
                                    className: "reward-shop-item-owned",
                                    children: ["Owned: ", f]
                                }), c.jsxs("button", {
                                    className: `reward-shop-buy-btn${g ? "" : " disabled"}`,
                                    disabled: !g,
                                    onClick: () => d({
                                        type: "BUY_REWARD_ITEM",
                                        payload: {
                                            itemId: o.itemId,
                                            cost: o.tokenCost
                                        }
                                    }),
                                    children: [c.jsx("span", {
                                        className: "reward-shop-buy-label",
                                        children: "Buy"
                                    }), c.jsxs("span", {
                                        className: "reward-shop-buy-cost",
                                        children: [o.tokenCost, " Token", o.tokenCost > 1 ? "s" : ""]
                                    })]
                                })]
                            })]
                        }, o.itemId)
                    }
                    )
                })]
            })]
        })
    })
}
const qg = [{
    id: "location",
    label: "Location"
}, {
    id: "gym",
    label: "Gyms"
}];
function Pg() {
    const {state: s} = Re()
      , [u,d] = O.useState("location")
      , [o,y] = O.useState(!1)
      , [f,g] = O.useState(!1)
      , x = O.useCallback( () => y(!0), [])
      , h = O.useCallback( () => y(!1), [])
      , p = O.useCallback( () => g(!0), [])
      , w = O.useCallback( () => g(!1), [])
      , k = mapData[s.currentLocation]
      , A = k?.type === "raid"
      , v = A ? "raidIsland" : k?.routeKey
      , _ = A ? Wa.map(z => ({
        speciesKey: z.speciesKey,
        weight: 1,
        minLevel: z.level,
        maxLevel: z.level
    })) : null
      , S = v && !A ? mapEncounterData[v] : null
      , D = A ? _ : S?.encounters;
    return c.jsxs("div", {
        className: "side-panel right-panel",
        children: [c.jsx("div", {
            className: "tab-bar",
            children: qg.map(z => c.jsx("button", {
                className: `tab-btn${u === z.id ? " active" : ""}`,
                onClick: () => d(z.id),
                children: z.label
            }, z.id))
        }), c.jsx("div", {
            className: "panel-content",
            children: u === "location" ? c.jsx(Vf, {
                onOpenCatchSettings: x
            }) : u === "gym" ? c.jsx(Zf, {
                onOpenShop: p
            }) : null
        }), c.jsx(If, {}), o && D && v && c.jsx(Qf, {
            routeKey: v,
            encounters: D,
            onClose: h
        }), f && c.jsx(Ff, {
            onClose: w
        })]
    })
}
function Xg(s) {
    const u = Math.max(0, Math.ceil(s / 1e3))
      , d = Math.floor(u / 60)
      , o = u % 60;
    return `${d}:${String(o).padStart(2, "0")}`
}
function Vg({location: s, isCurrent: u, isUnlocked: d, isClickable: o, onClick: y, cooldownEnd: f}) {
    const [g,x] = O.useState(!1)
      , [,h] = O.useState(0)
      , p = s.type === "town"
      , w = s.type === "raid"
      , k = d ? s.name : "???"
      , A = Date.now()
      , v = w && f != null && A < f;
    O.useEffect( () => {
        if (!v)
            return;
        const D = setInterval( () => h(z => z + 1), 1e3);
        return () => clearInterval(D)
    }
    , [v]);
    const _ = u || g;
    let S = "map-node";
    return w ? S += " raid" : p ? S += " town" : S += " route",
    v && (S += " cooldown"),
    u ? S += " current" : o ? S += " clickable" : d || (S += " locked"),
    c.jsxs("div", {
        className: S,
        style: {
            left: `${s.position.x}%`,
            top: `${s.position.y}%`
        },
        onClick: o ? y : void 0,
        title: d ? s.description : "Unknown location",
        onMouseEnter: () => x(!0),
        onMouseLeave: () => x(!1),
        children: [c.jsx("div", {
            className: "map-node-dot",
            children: u && c.jsx("div", {
                className: "map-node-blink"
            })
        }), _ && c.jsx("span", {
            className: "map-node-label",
            children: k
        }), v && f && c.jsx("span", {
            className: "raid-cooldown-timer",
            children: Xg(f - Date.now())
        })]
    })
}
const Qg = Object.keys(mapData);
function Cf(s, u) {
    const d = mapData[s]
      , o = mapData[u]
      , y = Math.abs(o.position.x - d.position.x)
      , f = Math.abs(o.position.y - d.position.y);
    return y >= f ? [{
        x1: d.position.x,
        y1: d.position.y,
        x2: o.position.x,
        y2: d.position.y
    }, {
        x1: o.position.x,
        y1: d.position.y,
        x2: o.position.x,
        y2: o.position.y
    }] : [{
        x1: d.position.x,
        y1: d.position.y,
        x2: d.position.x,
        y2: o.position.y
    }, {
        x1: d.position.x,
        y1: o.position.y,
        x2: o.position.x,
        y2: o.position.y
    }]
}
function Jf() {
    const {state: s, dispatch: u} = Re()
      , {currentLocation: d, unlockedLocations: o} = s
      , y = mapData[d];
    function f(h) {
        if (h === "raidIsland") {
            if (s.raidCooldownEnd && Date.now() < s.raidCooldownEnd)
                return;
            const p = Wa[Math.floor(Math.random() * Wa.length)];
            u({
                type: "START_RAID",
                payload: {
                    legendary: p.speciesKey
                }
            });
            return
        }
        u({
            type: "TRAVEL",
            payload: {
                locationId: h
            }
        })
    }
    const g = []
      , x = new Set;
    for (const h of Object.values(mapData))
        for (const p of h.connections) {
            const w = [h.id, p].sort().join("-");
            x.has(w) || (x.add(w),
            g.push({
                from: h.id,
                to: p
            }))
        }
    return c.jsxs("div", {
        className: "town-map",
        children: [c.jsxs("div", {
            className: "town-map-header",
            children: [c.jsx("span", {
                className: "town-map-title",
                children: "TOWN MAP"
            }), c.jsx("span", {
                className: "town-map-location-name",
                children: y?.name ?? ""
            }), c.jsxs("span", {
                className: "town-map-battles",
                children: [s.wildBattlesWon, "W ", s.trainerBattlesWon, "T"]
            })]
        }), c.jsxs("div", {
            className: "town-map-canvas",
            children: [c.jsxs("svg", {
                className: "town-map-svg",
                children: [g.map( ({from: h, to: p}) => {
                    const k = `map-road-border${o.includes(h) && o.includes(p) ? " unlocked" : " locked"}`;
                    return Cf(h, p).map( (A, v) => c.jsx("line", {
                        x1: `${A.x1}%`,
                        y1: `${A.y1}%`,
                        x2: `${A.x2}%`,
                        y2: `${A.y2}%`,
                        className: k
                    }, `border-${h}-${p}-${v}`))
                }
                ), g.map( ({from: h, to: p}) => {
                    const k = `map-road-fill${o.includes(h) && o.includes(p) ? " unlocked" : " locked"}`;
                    return Cf(h, p).map( (A, v) => c.jsx("line", {
                        x1: `${A.x1}%`,
                        y1: `${A.y1}%`,
                        x2: `${A.x2}%`,
                        y2: `${A.y2}%`,
                        className: k
                    }, `fill-${h}-${p}-${v}`))
                }
                )]
            }), Qg.map(h => {
                const p = mapData[h]
                  , w = o.includes(h);
                if (p.type === "raid" && !w)
                    return null;
                const k = h === d
                  , A = p.type === "raid" && s.raidCooldownEnd != null && Date.now() < s.raidCooldownEnd
                  , v = w && !k && !A;
                return c.jsx(Vg, {
                    location: p,
                    isCurrent: k,
                    isUnlocked: w,
                    isClickable: v,
                    onClick: () => f(h),
                    cooldownEnd: p.type === "raid" ? s.raidCooldownEnd : void 0
                }, h)
            }
            )]
        })]
    })
}
const Ig = [{
    id: "map",
    label: "Map"
}, {
    id: "party",
    label: "Party"
}, {
    id: "box",
    label: "Box"
}, {
    id: "location",
    label: "Location"
}];
function Zg() {
    const {state: s, dispatch: u} = Re()
      , [d,o] = O.useState("party")
      , [y,f] = O.useState(null)
      , [g,x] = O.useState(null)
      , [h,p] = O.useState(null)
      , [w,k] = O.useState(null)
      , [A,v] = O.useState("location")
      , [_,S] = O.useState(!1)
      , [D,z] = O.useState(!1)
      , V = mapData[s.currentLocation]
      , G = V?.type === "raid"
      , X = G ? "raidIsland" : V?.routeKey
      , Z = G ? Wa.map(W => ({
        speciesKey: W.speciesKey,
        weight: 1,
        minLevel: W.level,
        maxLevel: W.level
    })) : null
      , F = X && !G ? mapEncounterData[X] : null
      , q = G ? Z : F?.encounters
      , le = h ? s.box.find(W => W.id === h.id) ?? null : null
      , ve = O.useCallback( () => {
        if (!h)
            return;
        const W = s.box.findIndex(N => N.id === h.id);
        W < 0 || (u({
            type: "BOX_TO_PARTY",
            payload: {
                boxIndex: W
            }
        }),
        p(null),
        k(null))
    }
    , [h, s.box, u])
      , Ne = O.useMemo( () => {
        if (!le || s.phase === "evolving")
            return;
        const W = evolutionData[le.speciesKey];
        if (W)
            return {
                entries: W.map(N => {
                    const Y = pokemonSpecies[N.into]
                      , P = !N.level || le.level >= N.level
                      , ae = !N.item || (s.inventory[N.item] ?? 0) > 0
                      , me = P && ae
                      , L = [];
                    if (N.level && L.push(`Lv. ${N.level}`),
                    N.item) {
                        const B = N.item in Gn ? Gn[N.item].name : N.item;
                        L.push(B)
                    }
                    return {
                        targetName: Y?.name ?? N.into,
                        canEvolve: me,
                        requirementLabel: L.join(" + ") || "Ready",
                        targetKey: N.into,
                        itemId: N.item
                    }
                }
                )
            }
    }
    , [le, s.phase, s.inventory])
      , Q = O.useCallback(W => {
        if (!le || !Ne)
            return;
        const N = Ne.entries[W];
        N.canEvolve && (u({
            type: "START_EVOLUTION",
            payload: {
                pokemonId: le.id,
                fromSpeciesKey: le.speciesKey,
                toSpeciesKey: N.targetKey,
                consumeItem: N.itemId
            }
        }),
        p(null))
    }
    , [le, Ne, u])
      , J = O.useCallback( () => {
        le && k(le.id)
    }
    , [le])
      , _e = O.useCallback( () => {
        w && (u({
            type: "RELEASE_POKEMON",
            payload: {
                pokemonId: w,
                source: "box"
            }
        }),
        p(null),
        k(null))
    }
    , [w, u])
      , je = w ? s.box.find(W => W.id === w) ?? null : null;
    return c.jsxs("div", {
        className: "mobile-tabs",
        children: [c.jsx("div", {
            className: "tab-bar mobile-tab-bar",
            children: Ig.map(W => c.jsx("button", {
                className: `tab-btn${d === W.id ? " active" : ""}`,
                onClick: () => o(W.id),
                children: W.label
            }, W.id))
        }), c.jsxs("div", {
            className: "mobile-tab-content",
            children: [d === "map" && c.jsx(Jf, {}), d === "party" && c.jsx("div", {
                className: "mobile-party-wrapper",
                children: c.jsx(qf, {
                    inspected: y,
                    setInspected: f,
                    releaseConfirm: g,
                    setReleaseConfirm: x
                })
            }), d === "box" && c.jsxs("div", {
                className: "mobile-box-wrapper",
                children: [c.jsx(Xf, {
                    inspected: h,
                    setInspected: p,
                    setReleaseConfirm: k
                }), h && le && c.jsxs(c.Fragment, {
                    children: [c.jsx(Gf, {
                        pokemon: le,
                        source: "box",
                        partyLength: s.party.length,
                        onAction: ve,
                        onClose: () => {
                            p(null),
                            k(null)
                        }
                        ,
                        evolutionInfo: Ne,
                        onEvolve: Q,
                        onRelease: J,
                        canRelease: !w
                    }), w && je && c.jsxs("div", {
                        className: "release-confirm",
                        children: [c.jsxs("span", {
                            children: ["Release ", je.name, "?"]
                        }), c.jsxs("div", {
                            className: "release-confirm-buttons",
                            children: [c.jsx("button", {
                                className: "release-confirm-yes",
                                onClick: _e,
                                children: "Yes"
                            }), c.jsx("button", {
                                className: "release-confirm-no",
                                onClick: () => k(null),
                                children: "No"
                            })]
                        })]
                    })]
                })]
            }), d === "location" && c.jsxs("div", {
                className: "mobile-location-wrapper",
                children: [c.jsxs("div", {
                    className: "tab-bar",
                    children: [c.jsx("button", {
                        className: `tab-btn${A === "location" ? " active" : ""}`,
                        onClick: () => v("location"),
                        children: "Location"
                    }), c.jsx("button", {
                        className: `tab-btn${A === "gym" ? " active" : ""}`,
                        onClick: () => v("gym"),
                        children: "Gyms"
                    })]
                }), c.jsx("div", {
                    className: "panel-content",
                    children: A === "location" ? c.jsx(Vf, {
                        onOpenCatchSettings: () => S(!0)
                    }) : c.jsx(Zf, {
                        onOpenShop: () => z(!0)
                    })
                }), c.jsx(If, {})]
            })]
        }), _ && q && X && c.jsx(Qf, {
            routeKey: X,
            encounters: q,
            onClose: () => S(!1)
        }), D && c.jsx(Ff, {
            onClose: () => z(!1)
        })]
    })
}
function Fg() {
    return Yf() ? c.jsxs("div", {
        className: "game-layout mobile",
        children: [c.jsx(Ef, {}), c.jsx(Zg, {})]
    }) : c.jsxs("div", {
        className: "game-layout",
        children: [c.jsx(Mg, {}), c.jsxs("div", {
            className: "center-column",
            children: [c.jsx(Ef, {}), c.jsx(Jf, {})]
        }), c.jsx(Pg, {})]
    })
}
const Rf = "0.4.0"
  , Kf = "pokemon-idle-last-seen-version"
  , Vo = [{
    version: "0.4.0",
    subtitle: "Repel & Honey, Exp. Share, Mobile Layout & QoL",
    sections: [{
        heading: "Repel & Honey Items",
        items: ["New consumable items: Repel (halves encounter weight) and Honey (doubles encounter weight) for a specific Pokemon on a route, lasting 500 battles", "Buy them from any Poke Mart for $2,000 each", "Apply from the detail panel by clicking a Pokemon tile, or use the new selector mode buttons in the Wild Pokemon header to batch-apply by clicking tiles directly", 'Active effects show as blue "R" and yellow "H" badges on encounter tiles', "Active effect durations are displayed in the battle log and detail panel", "Re-using on the same species extends the duration instead of stacking"]
    }, {
        heading: "Exp. Share",
        items: ["New item available in the Reward Shop for 2 Victory Tokens", "When active, the battling Pokemon receives 50% EXP and all non-fainted party members receive 5% EXP each", "Lasts 1000 battles — activate from your Bag", "Party members can level up and learn moves from shared EXP"]
    }, {
        heading: "Mobile Layout",
        items: ["Completely new responsive layout for screens under 768px", "Tabbed navigation: Battle, Location, Party, Box, and Map tabs", "Battle scene scales to fit the screen width", "Battle log auto-hides when space is too tight"]
    }, {
        heading: "Shiny Charm",
        items: ["Complete the Pokedex (catch all 151 Pokemon) to unlock the Shiny Charm", "Doubles shiny encounter odds from 1/8192 to 1/4096", "Applies to wild encounters and raid legendaries", "Check your shiny stats and charm status in the ? info menu"]
    }, {
        heading: "New Content",
        items: ["Starters (Bulbasaur, Charmander, Squirtle) can now be found as ultra-rare encounters in the Safari Zone", "Omanyte and Kabuto now evolve into Omastar and Kabutops at level 40", 'Added "Ultra Rare" rarity tier for the rarest encounters']
    }, {
        heading: "Quality of Life",
        items: ['Default catch mode changed from "Always" to "Pokedex New" for less ball waste', "Route 6/Vermilion unlock order swapped with Route 7/Celadon for better progression flow", "Safari Zone encounter weights rebalanced for smoother distribution", "Duplicate move learning is now prevented — Pokemon won't re-learn moves they already know", "Move manage panel now validates the active Pokemon hasn't changed mid-edit", "Bag panel shows active effect status and lets you use Exp. Share directly", "Town map no longer shows a redundant tooltip for the current location"]
    }]
}, {
    version: "0.3.0",
    subtitle: "Legendary Raids, Move Effects & Battle Balance",
    sections: [{
        heading: "IV Assignment",
        items: ["Previously all Pokemon would have full 15 IVs, now they will be randomly assigned just like in the games"]
    }, {
        heading: "Legendary Raid System",
        items: ["Legendary Pokemon (Articuno, Zapdos, Moltres, Mewtwo, Mew) have been removed from wild encounters", "New Raid Island location unlocks after defeating the Champion", "Click Raid Island to heal your party and fight a random legendary repeatedly until you wipe or leave", "Legendaries will grow stronger as you beat them, you'll need a strong team to have the best odds of catching them", "Normal catch logic applies during raids — use your default ball settings", "10-minute cooldown between raids, persists across refreshes"]
    }, {
        heading: "Move Secondary Effects",
        items: ["Recoil moves (Take Down, Submission) now deal damage back to the user", "Hyper Beam now requires a recharge turn after use", "Self-Destruct causes the user to faint after dealing damage", "Multi-turn moves (Outrage, Petal Dance) lock the user in for 2–3 turns, then cause confusion self-damage", "High Jump Kick now damages the user on a miss"]
    }, {
        heading: "Stat Stage Moves",
        items: ["Status moves now actually work! Swords Dance, Amnesia, Barrier, Harden, Sharpen, and Defense Curl boost your stats in battle", "Growl, Leer, and Tail Whip lower the opponent's stats", "Stat changes range from -6 to +6 and reset each battle"]
    }, {
        heading: "Smarter AI",
        items: ["Your Pokemon now considers move drawbacks when picking attacks — it won't blindly spam Hyper Beam over Flamethrower", "Trainer Pokemon also weigh drawbacks when choosing moves", "Stat stages are factored into move selection for both sides"]
    }]
}, {
    version: "0.2.0",
    subtitle: "Gym Leaders, Elite Four, Evolution Items & More",
    sections: [{
        heading: "Gym Leaders, Elite Four & Champion",
        items: ["All 8 Kanto gym leaders are now in the game! Defeat them in order to earn badges and progress", "Each gym leader has their classic team from the original games", "After earning all 8 badges, take on the Elite Four gauntlet — Lorelei, Bruno, Agatha, and Lance back-to-back", "Defeat all four to face Champion Blue and his full team of 6"]
    }, {
        heading: "Victory Tokens & Reward Shop",
        items: ["Earn Victory Tokens by defeating gym leaders for the first time (1 token per gym) and completing the Elite Four gauntlet (1 token per champion defeat)", "Spend tokens in the new Reward Shop (accessible from the Gyms tab) on evolution items:", "Fire Stone, Water Stone, Thunder Stone, Leaf Stone — 1 token each", "Moon Stone, Link Cable — 2 tokens each"]
    }, {
        heading: "Evolution Items & Item-Based Evolution",
        items: ["Pokemon that evolve by stone or trade can now be evolved using these items from the stats panel", "Pokemon with multiple evolution options (e.g. Eevee) show all options side by side"]
    }, {
        heading: "Route & Location Progression Overhaul",
        items: ["Unlock criteria reworked: routes now unlock based on battles fought at specific locations and badges earned, instead of a flat total battle count"]
    }, {
        heading: "Auto-Proceed",
        items: ["New toggle button (▶▶) next to the settings gear in the battle scene", "When enabled, automatically travels to newly unlocked locations so you can idle hands-free"]
    }, {
        heading: "Quality of Life",
        items: ["Evolution button is now always visible and shows requirements, faded when not met", "Evolution items now work from the box, not just the party", "Fixed stretched sprites in the box, party info screen, and catch settings menu", "Trainer name display no longer blocks buttons during trainer battles", "Trainer/boss sprites are larger during battle intros", "Battle win tracking split into wild battles vs trainer battles, tracked per location"]
    }]
}];
function Jg() {
    const [s,u] = O.useState(!1);
    O.useEffect( () => {
        localStorage.getItem(Kf) !== Rf && u(!0)
    }
    , []);
    const d = () => {
        localStorage.setItem(Kf, Rf),
        u(!1)
    }
    ;
    if (!s)
        return null;
    const o = Vo[0];
    return c.jsx("div", {
        className: "battle-info-overlay",
        onClick: d,
        children: c.jsxs("div", {
            className: "patch-notes-modal",
            onClick: y => y.stopPropagation(),
            children: [c.jsxs("div", {
                className: "battle-info-header",
                children: [c.jsxs("span", {
                    className: "battle-info-title",
                    children: ["What's New — v", o.version]
                }), c.jsx("button", {
                    className: "battle-info-close",
                    onClick: d,
                    children: "X"
                })]
            }), c.jsxs("div", {
                className: "patch-notes-content",
                children: [c.jsxs("div", {
                    className: "patch-notes-title",
                    children: ["Pokemon Idle v", o.version, " Patch Notes"]
                }), c.jsx("div", {
                    className: "patch-notes-subtitle",
                    children: o.subtitle
                }), o.sections.map( (y, f) => c.jsxs("div", {
                    className: "patch-notes-section",
                    children: [c.jsx("div", {
                        className: "patch-notes-section-heading",
                        children: y.heading
                    }), c.jsx("ul", {
                        className: "patch-notes-list",
                        children: y.items.map( (g, x) => c.jsx("li", {
                            children: g
                        }, x))
                    })]
                }, f)), c.jsxs("p", {
                    className: "patch-notes-feedback",
                    children: ["As always, feedback is welcome! Join us at", " ", c.jsx("a", {
                        href: "https://www.reddit.com/r/PkmnIdle/",
                        target: "_blank",
                        rel: "noopener noreferrer",
                        children: "r/PkmnIdle"
                    }), " ", "to share your thoughts or report issues."]
                })]
            }), c.jsx("div", {
                className: "patch-notes-footer",
                children: c.jsx("button", {
                    className: "patch-notes-dismiss-btn",
                    onClick: d,
                    children: "Got it!"
                })
            })]
        })
    })
}
function Wg() {
    return c.jsxs("div", {
        className: "patch-notes-page",
        children: [c.jsxs("div", {
            className: "patch-notes-page-header",
            children: [c.jsx("a", {
                href: "#",
                className: "patch-notes-back-btn",
                children: "← Back to Game"
            }), c.jsx("h1", {
                className: "patch-notes-page-title",
                children: "Patch Notes"
            })]
        }), c.jsxs("div", {
            className: "patch-notes-page-content",
            children: [Vo.map( (s, u) => c.jsxs("div", {
                className: "patch-notes-version-block",
                children: [c.jsxs("div", {
                    className: "patch-notes-page-version-header",
                    children: [c.jsxs("span", {
                        className: "patch-notes-page-version",
                        children: ["v", s.version]
                    }), c.jsx("span", {
                        className: "patch-notes-page-subtitle",
                        children: s.subtitle
                    })]
                }), s.sections.map( (d, o) => c.jsxs("div", {
                    className: "patch-notes-section",
                    children: [c.jsx("div", {
                        className: "patch-notes-section-heading",
                        children: d.heading
                    }), c.jsx("ul", {
                        className: "patch-notes-list",
                        children: d.items.map( (y, f) => c.jsx("li", {
                            children: y
                        }, f))
                    })]
                }, o)), u < Vo.length - 1 && c.jsx("hr", {
                    className: "patch-notes-divider"
                })]
            }, u)), c.jsxs("p", {
                className: "patch-notes-feedback",
                children: ["Feedback is welcome! Join us at", " ", c.jsx("a", {
                    href: "https://www.reddit.com/r/PkmnIdle/",
                    target: "_blank",
                    rel: "noopener noreferrer",
                    children: "r/PkmnIdle"
                }), " ", "to share your thoughts or report issues."]
            })]
        })]
    })
}
function $g() {
    const {state: s} = Re();
    return s.phase === "starterSelect" ? c.jsx(Ih, {}) : c.jsx(Fg, {})
}
function e0() {
    const [s,u] = O.useState(window.location.hash);
    return O.useEffect( () => {
        const d = () => u(window.location.hash);
        return window.addEventListener("hashchange", d),
        () => window.removeEventListener("hashchange", d)
    }
    , []),
    s === "#patchnotes" ? c.jsx(Wg, {}) : c.jsx(Gh, {
        children: c.jsxs("div", {
            className: "game-window",
            children: [c.jsx($g, {}), c.jsx(Jg, {})]
        })
    })
}
async function startApp() {
    await window.gameDataReady;
    
    pokemonSpecies = window.gameDataInjector.data.pokemonSpecies;
    evolutionData = window.gameDataInjector.data.evolutionData;
    moveLearnsets = window.gameDataInjector.data.moveLearnsets;
    moveData = window.gameDataInjector.data.moveData;

    Rh.createRoot(document.getElementById("root")).render(c.jsx(O.StrictMode, {
        children: c.jsx(e0, {})
    }));
}
startApp();
