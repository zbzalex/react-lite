define(function () {
    function invokeOrReturn(fn) {
        return typeof fn === "function" ? fn() : fn;
    }

    return {
        invokeOrReturn,
    }
});