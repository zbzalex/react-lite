define(
    [
        "options",
    ],
    function (options) {
        function useState(initial) {
            const oldHook =
                options.currentComponent.oldVNode &&
                options.currentComponent.oldVNode._hooks &&
                options.currentComponent.oldVNode._hooks[options.hookIndex]

            const hook = {
                tag: "",
                state: oldHook ? oldHook.state : initial,
                queue: [],
            }

            const actions = oldHook ? oldHook.queue : []

            actions.forEach(action => {
                hook.state = action(hook.state)
            })

            options.currentComponent._hooks.push(hook)
            let hookIndex = options.hookIndex
            options.hookIndex++

            const setState = action => {
                options.currentComponent._hooks[hookIndex].queue.push(action)
                options.currentRoot = {
                    dom: options.oldCommitRoot.dom,
                    props: options.oldCommitRoot.props,
                    oldVNode: options.oldCommitRoot,
                }
                options.deletions = []
                options.nextUnitOfWork = options.currentRoot
            }



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