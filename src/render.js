import templateHTML from "./src/templates/main.html!text"
import rp from "request-promise"
import Mustache from "mustache"

const pageTitle = "A year of bloodshed at Gaza border protests"
const pageUrl = 'https://www.theguardian.com/world/ng-interactive/2019/mar/29/a-year-of-bloodshed-at-gaza-border-protests'

const twitterLink = 'https://twitter.com/intent/tweet?text=' + encodeURI(pageTitle) + '&url=' + encodeURIComponent(pageUrl + '?CMP=share_btn_tw');
const facebookLink = 'https://www.facebook.com/dialog/share?app_id=180444840287&href=' + encodeURIComponent(pageUrl + '?CMP=share_btn_fb');
const emailLink = 'mailto:?subject=' + encodeURIComponent(pageTitle) + '&body=' + encodeURIComponent(pageUrl + '?CMP=share_btn_link');


export async function render() {
    const copy = await rp("https://interactive.guim.co.uk/docsdata-test/1o5QmdR1vPXsmZx1PnTQgV4abfEJ_wPZBndHYxTHpAhc.json",{"json": true});

    const keys = Object.keys(copy);

    keys.forEach(key => {
        if(key.indexOf("Text") > -1) {
            copy[key] = copy[key].replace(/[\r\n]+/g, '\n').split('\n');
        }
    });

    return Mustache.render(templateHTML, {copy, twitterLink, facebookLink, emailLink});
} 