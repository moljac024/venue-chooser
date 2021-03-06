// Polyfills. Probably not needed but hey, you can view this in IE11. Not
// tested, I'll take facebook's word for it
import "react-app-polyfill/ie11"
import "react-app-polyfill/stable"

import "semantic-ui-css/semantic.min.css"

import React from "react"
import ReactDOM from "react-dom"
import App from "./App"
import * as serviceWorker from "./serviceWorker"

ReactDOM.render(<App />, document.getElementById("root"))

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister()
