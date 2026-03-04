export function parse(selector: string) {
    let x = /^([A-Za-z_0-9]+)\.([A-Za-z_0-9]+\(?\)?)$/.exec(selector)
    if (x) {
        return {
            object: x[1],
            variable: x[2],
        }
    }

    x = /^length\(?\s?([A-Za-z_0-9]+)\.([A-Za-z_0-9]+)\)?$/.exec(selector)
    if (x) {
        return {
            object: x[1],
            variable: x[2],
            length: true,
        }
    }

    x = /^([A-Za-z_0-9]+)\.([A-Za-z_0-9]+)\.([A-Za-z_0-9]+)$/.exec(selector)
    if (x) {
        return {
            object: x[1],
            variable: x[2],
            property: x[3],
        }
    }

    x = /^([A-Za-z_0-9]+)\.([A-Za-z_0-9]+)\[(\d+)\]$/.exec(selector)
    if (x) {
        return {
            object: x[1],
            variable: x[2],
            index: parseInt(x[3]),
        }
    }

    x = /^([A-Za-z_0-9]+)\.([A-Za-z_0-9]+)\[(\d+)\]\.([A-Za-z_0-9]+)$/.exec(selector)
    if (x) {
        return {
            object: x[1],
            variable: x[2],
            index: parseInt(x[3]),
            property: x[4],
        }
    }
}
