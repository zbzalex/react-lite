define(
    [
        "lib/vdom",
        "hooks",
        "classNames",
    ],
    function (
        {
            createElement,
            createTextElement,
        },
        {
            useState,
            useEffect
        },
        classNames,
    ) {
        function App() {
            const [state, setState] = useState(1)

            useEffect(() => {
                setState(c => c + 10)
            }, [])


            return createElement(
                "div",
                {},
                [
                    createElement("button", {
                        className: "button",
                        onClick: function () {
                            setState(c => c + 1)
                        },
                    }, [
                        createTextElement("add")
                    ]),
                    createTextElement(state)
                ])
        }

        return createElement("div", {}, [
            createElement(App, {}, [])
        ])
    }
)