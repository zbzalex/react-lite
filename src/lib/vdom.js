/**
 * @author zbzalex
 */
define(
    [
        "options"
    ],
    function (options) {
        function createElement(type, props, children) {
            return {
                type,
                props: {
                    ...props || {},
                    children: children
                        ? children.map(child => typeof child === "string" ? createTextElement(child) : child)
                        : []
                }
            }
        }

        function createTextElement(text) {
            return {
                type: "TEXT_ELEMENT",
                props: {
                    nodeValue: text,
                    children: [],
                }
            }
        }

        function View(children, props) {
            return createElement("div", props, children)
        }

        function Text(text) {
            return createTextElement(text)
        }

        function Button(label, props) {
            return createElement("button", props, [
                Text(label)
            ])
        }

        function Input(props) {
            return createElement("input", props)
        }

        function render(element, container) {
            options.currentRoot = {
                dom: container,
                props: {
                    children: [
                        element
                    ],
                },
                oldVNode: options.oldCommitRoot,
            };

            options.deletions = [];
            options.nextUnitOfWork = options.currentRoot;
        }

        function createDom(vnode) {
            const dom = vnode.type === "TEXT_ELEMENT"
                ? document.createTextNode("")
                : document.createElement(vnode.type)

            updateDom(dom, {}, vnode.props)

            return dom;
        }

        const isEvent = key => key.startsWith("on")
        const isProperty = key => key !== "children" && !isEvent(key);
        const isNew = (prev, next) => key => prev[key] !== next[key]
        const isGone = (prev, next) => key => !(key in next)

        function updateDom(dom, prevProps, nextProps) {
            Object.keys(prevProps)
                .filter(isEvent)
                .filter(key => !(key in nextProps) || isNew(prevProps, nextProps)(key))
                .forEach(key => {
                    const eventType = key.toLowerCase().substring(2)
                    dom.removeEventListener(eventType, prevProps[key])
                })

            Object.keys(prevProps)
                .filter(isProperty)
                .filter(isGone(prevProps, nextProps))
                .forEach(key => {
                    dom[key] = "";
                })

            Object
                .keys(nextProps)
                .filter(isProperty)
                .filter(isNew(prevProps, nextProps))
                .forEach(key => {
                    if (key === "style") {
                        Object
                            .keys(nextProps.style)
                            .forEach(k => {
                                dom.style[k] = nextProps.style[k];
                            })
                    } else {
                        dom[key] = nextProps[key]
                    }
                })

            Object.keys(nextProps)
                .filter(isEvent)
                .filter(isNew(prevProps, nextProps))
                .forEach(key => {
                    const eventType = key.toLowerCase().substring(2)
                    dom.addEventListener(eventType, nextProps[key])
                })
        }

        function workLoop() {
            while (options.nextUnitOfWork && options.currentRoot) {
                options.nextUnitOfWork = performUnitOfWork(options.nextUnitOfWork)
            }

            if (!options.nextUnitOfWork && options.currentRoot) {
                commitRoot()
            }

            requestIdleCallback(workLoop)
        }

        // выполняем работу
        function performUnitOfWork(vnode) {
            console.log("performUnitOfWork()")

            const isFunctionComponent =
                typeof vnode.type === "function";

            let children = []
            if (isFunctionComponent) {
                options.currentComponent = vnode

                vnode._hooks = vnode._hooks || []

                const child = vnode.type(vnode.props)

                Object
                    .keys(vnode._hooks)
                    .filter(hookIndex => vnode._hooks[hookIndex].tag === "EFFECT")
                    .forEach(hookIndex => {
                        const oldHook =
                            vnode.oldVNode &&
                            vnode.oldVNode._hooks &&
                            vnode.oldVNode._hooks[hookIndex]

                        const hook = vnode._hooks[hookIndex]
                        const depsChanged = (prev, next) => (_, index) => prev[index] !== next[index];
                        if (hook.deps.length === 0 && !oldHook
                            || oldHook && (oldHook.deps.length !== hook.deps.length
                                || oldHook && hook.deps.filter(depsChanged(oldHook.deps, hook.deps)).length !== 0)) {
                            options.pendingEffects.push(hook.fn)
                        }
                    })

                children = [
                    child
                ]
            } else {
                if (!vnode.dom) {
                    vnode.dom = createDom(vnode)
                }

                children = vnode.props.children;
            }

            let index = 0

            let oldVNode =
                vnode.oldVNode
                && vnode.oldVNode.child

            let prevSibling = null

            while (
                index < children.length ||
                oldVNode != null
                ) {
                const child = children[index]
                let newVNode = null

                const sameType =
                    oldVNode &&
                    child &&
                    child.type === oldVNode.type

                if (sameType) {
                    newVNode = {
                        type: oldVNode.type,
                        props: child.props,
                        dom: oldVNode.dom,
                        parent: vnode,
                        oldVNode: oldVNode,
                        effectTag: "UPDATE",
                    }
                }

                if (child && !sameType) {
                    newVNode = {
                        type: child.type,
                        props: child.props,
                        dom: null,
                        parent: vnode,
                        oldVNode: null,
                        effectTag: "PLACEMENT",
                    }
                }

                if (oldVNode && !sameType) {
                    oldVNode.effectTag = "DELETION"

                    options.deletions.push(oldVNode)
                }

                if (oldVNode) {
                    oldVNode = oldVNode.sibling
                }

                if (index === 0) {
                    vnode.child = newVNode
                } else if (child) {
                    prevSibling.sibling = newVNode
                }

                prevSibling = newVNode
                index++
            }

            // ||
            // child
            // ||
            // ||
            // child
            // ||
            if (vnode.child) {
                return vnode.child
            }

            let nextVNode = vnode
            while (nextVNode) {
                // ||
                // child -> sibling
                // ||
                if (nextVNode.sibling) {
                    return nextVNode.sibling;
                }

                // child
                // ||x
                // || \
                // ||  \
                // ||   \
                // ||    \
                // ||     o
                // child -> sibling
                nextVNode = nextVNode.parent;
            }
        }

        function commitRoot() {
            console.log("commitRoot()")

            options.deletions.forEach(commitWork)

            commitWork(options.currentRoot.child)

            options.oldCommitRoot = options.currentRoot;
            options.currentRoot = null
            options.pendingEffects.forEach(it => it())
            options.pendingEffects = []
            options.hookIndex = 0
        }

        function commitWork(vnode) {
            if (!vnode) {
                return
            }

            let domParentHost = vnode.parent
            while (!domParentHost.dom) {
                domParentHost = domParentHost.parent
            }

            const domParent = domParentHost.dom

            if (
                vnode.effectTag === "PLACEMENT" &&
                vnode.dom != null
            ) {
                domParent.appendChild(vnode.dom)
            } else if (
                vnode.effectTag === "UPDATE" &&
                vnode.dom != null
            ) {
                updateDom(
                    vnode.dom,
                    vnode.oldVNode.props,
                    vnode.props
                )
            } else if (vnode.effectTag === "DELETION") {
                commitDeletion(vnode, domParent)
                return
            }

            commitWork(vnode.child)
            commitWork(vnode.sibling)
        }

        function commitDeletion(vnode, domParent) {
            if (vnode.dom) {
                domParent.removeChild(vnode.dom)
            } else {
                commitDeletion(vnode.child, domParent)
            }
        }

        requestIdleCallback(workLoop)

        return {
            createElement,
            createTextElement,
            render,
            View,
            Text,
            Button,
            Input,
        }
    }
);