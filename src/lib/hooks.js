define(
    [
        "options",
    ],
    function (options) {
        function useState(initial) {
            const oldHook =
                options.currentComponent.oldCommitRoot &&
                options.currentComponent.oldCommitRoot._hooks &&
                options.currentComponent.oldCommitRoot._hooks[options.hookIndex]

            const hook = {
                tag: "",
                state: oldHook ? oldHook.state : initial,
                queue: [],
            }

            const actions = oldHook ? oldHook.queue : []
            actions.forEach(action => hook.state = action(hook.state))

            const setState = action => {
                console.log("setState()")

                hook.queue.push(action)

                options.currentRoot = {
                    dom: options.oldCommitRoot.dom,
                    props: options.oldCommitRoot.props,
                    oldCommitRoot: options.oldCommitRoot,
                }
                options.deletions = []
                options.nextUnitOfWork = options.currentRoot
            }

            options.currentComponent._hooks.push(hook)
            options.hookIndex++

            return [
                hook.state,
                setState
            ]
        }

        function useEffect(fn, deps) {
            const hook = {
                tag: "EFFECT",
                fn,
                deps,
            }

            options.currentComponent._hooks.push(hook)
            options.hookIndex++
        }

        return {
            useState,
            useEffect,
        }
    }
)