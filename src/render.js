import templateHTML from "./src/templates/main.html!text"
import rp from "request-promise"
import Mustache from "mustache"

export async function render() {
    const copy = await rp("https://interactive.guim.co.uk/docsdata-test/1o5QmdR1vPXsmZx1PnTQgV4abfEJ_wPZBndHYxTHpAhc.json",{"json": true});

    const keys = Object.keys(copy);

    keys.forEach(key => {
        if(key.indexOf("Text") > -1) {
            copy[key] = copy[key].replace(/[\r\n]+/g, '\n').split('\n');
        }
    });

    return Mustache.render(templateHTML, copy);
} 