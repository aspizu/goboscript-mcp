import {h, render} from "preact"
import "./socket"
import "./stylesheet.css"
import Toolbar from "./Toolbar"

const root = document.createElement("div")
root.id = "tw-bridge-host-toolbar"
document.body.append(root)
render(h(Toolbar, {}, null), root)
