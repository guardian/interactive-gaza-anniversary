import * as d3 from "d3"
import colours from "./palette"
var commafy = require('commafy');

const container = d3.select(".scroll-inner");

const pixelRatio = window.devicePixelRatio;
const vertical = (window.innerHeight > window.innerWidth);
const scaledWidth = d3.select(".scroll-inner").node().clientWidth * pixelRatio;
const scaledHeight = (vertical) ? scaledWidth : d3.select(".scroll-inner").node().clientHeight * pixelRatio;  

const width = scaledWidth/pixelRatio;
const height = scaledHeight/pixelRatio;  

const r = 2 * (width/1260);
const padding = 0.25 * (width/1260);

const keys = ["injuredKilled", "life", "monthYear", "Weapon"]
let labels = {};

let context;
let data;
 
const render = (d1) => {
    data = d1;
    // console.log(data);
    const canvasSelect = container.append("canvas")
        .attr("width", scaledWidth)
        .attr("height", scaledHeight)
        .style('cursor', 'pointer')
        .style("width", `${width}px`)
        .style("height", `${height}px`)

    const canvas = canvasSelect.node();
    context = canvas.getContext('2d'); 
    context.scale(pixelRatio, pixelRatio);
    // context.translate(width / 2, height / 2);

    const layouts = keys.map(key => {
        const keyToNestBy = key;

        const headers = [
            {"name": "root", value: ""}
        ];

        (d3.nest().key(d => d[keyToNestBy]).entries(data)).forEach(v => {
            headers.push({"name": v.key, "value": "root"});
        });

        const hierarchyData = d3.stratify()
            .id((d, i) => d.name)
            .parentId((d, i) => (d.value) ? d.value : d[keyToNestBy])(headers.concat(d3.shuffle(data).filter(v => v.Month !== undefined && v.Extra !== undefined))); 

            // .parentId((d, i) => (d.value) ? d.value : d.Weapon)(headers.concat(data.filter(v => v.Month !== undefined))); 

        const pack = d3.pack()
            .size([width, height])
            .radius(d => d.value * (r+padding))
                (d3.hierarchy(hierarchyData)
                    .count(d => d.value)
                    .sort((a, b) => b.value - a.value ));

        const leaves = pack.leaves();

        labels[key] = pack.children;

        return leaves;
    });

    let dataObject = {};

    data.forEach(d => {
        dataObject[d.name] = d;
    });

    layouts.forEach((layout, z) => {
        layout.forEach(n => {
            if(!dataObject[n.data.id].layout) {
                dataObject[n.data.id].layout = {}
            }
            if(!dataObject[n.data.id].layout[keys[z]]) {
                dataObject[n.data.id].layout[keys[z]] = {}; 
            }
            dataObject[n.data.id].layout[keys[z]].x = n.x;
            dataObject[n.data.id].layout[keys[z]].y = n.y;
        });
    });

    window.requestAnimationFrame(() => {
        drawNext(keys[0], keys[0]);
    });
    
    window.requestAnimationFrame(checkScroll);
}

const scrollInner = d3.select(".scroll-inner");
const scrollText = d3.select(".scroll-text");
const numPanes = document.querySelectorAll(".scroll-text__div").length;

if(width < 940) {
    scrollText.style("top", height + 12 + "px")
}

let lastScroll = null;
let lastI = 0;

function featureTest(property, value, noPrefixes) {
    var prop = property + ':',
        el = document.createElement('test'),
        mStyle = el.style;

    if (!noPrefixes) {
        mStyle.cssText = prop + ['-webkit-', '-moz-', '-ms-', '-o-', ''].join(value + ';' + prop) + value + ';';
    } else {
        mStyle.cssText = prop + value;
    }
    return mStyle[property];
}

const supportsSticky = (featureTest('position', 'sticky') || featureTest('position', '-webkit-sticky'));

const checkScroll = () => {
    if(lastScroll !== window.pageYOffset) {
        const bbox = scrollText.node().getBoundingClientRect(); 

        if(bbox.top - bbox.height < (window.innerHeight*(2/3)) && bbox.bottom > window.innerHeight) { 
            const i = Math.floor(Math.abs(bbox.top - (window.innerHeight*(2/3)))/bbox.height*numPanes);

            if(i !== lastI && i < 11) {
              console.log(i)
              doScrollAction(i); 
              lastI = i;
            }
        }

        if(!supportsSticky) {
          if(bbox.top <= 0 && bbox.bottom >= window.innerHeight) {
            scrollInner.classed("fixed-top", true);
            scrollInner.classed("absolute-bottom", false);
            scrollInner.classed("absolute-top", false);
          } else if(bbox.top <= 0) {
            scrollInner.classed("fixed-top", false);
            scrollInner.classed("absolute-bottom", true);
            scrollInner.classed("absolute-top", false);
          } else {
            scrollInner.classed("fixed-top", false);
            scrollInner.classed("absolute-bottom", false);
            scrollInner.classed("absolute-top", true);
          }
        }

        lastScroll = window.pageYOffset;
    }
    window.requestAnimationFrame(checkScroll);
  };

// const drawInitial = (context, data) => {
//     context.clearRect(0, 0, width, height);

//     for (var i = 0, len = data.length; i < len; i++) {
//         context.beginPath();
//         context.rect(data[i].layout[keys[0]].x, data[i].layout[keys[0]].y, r, r); 
        
//         // console.log(data[i])
//         if(data[i].Fatal === "Yes") {
//             context.fillStyle = colours.guNews;
//         } else {
//             context.fillStyle = colours.neutral60; 
//         } 
//         context.fill(); 
//     }

//     window.requestAnimationFrame(checkScroll);

//     // setTimeout(() => {
//     //     drawNext(context, data, keys[0], keys[1]);
//     // }, 3000)

//     // setTimeout(() => {
//     //     drawNext(context, data, keys[1], keys[2]);
//     // }, 6000)

//     // setTimeout(() => {
//     //     drawNext(context, data, keys[2], keys[3]);
//     // }, 9000)

//     // setTimeout(() => {
//     //     drawNext(context, data, keys[3], keys[4]);
//     // }, 12000)
// }

const doScrollAction = (i) => {
    drawNext(keys[lastI], keys[i]);
}

function drawNext(keyFrom, keyTo) {
    // context.clearRect(0,0, width, height);
    let startT = null;
    let animationDuration = 3000;

    function draw(p) {
        // context.fillStyle = colours.newsRed;
        const easedP = ease(p);
        const easedPlabels = labelEase(p);
        context.save();
        context.clearRect(0, 0, width, height);

        for (var i = 0; i < data.length; i++) {
            // if(keyFrom === keyTo) {
            //     data[i].x = interp(width/2, data[i].layout[keyTo].x, easedP);
            //     data[i].y = interp(height/2, data[i].layout[keyTo].y, easedP);
            // } else {
            if(keyFrom === keyTo) {
                context.globalAlpha = easedP;
            }
            data[i].x = interp(data[i].layout[keyFrom].x, data[i].layout[keyTo].x, easedP);
            data[i].y = interp(data[i].layout[keyFrom].y, data[i].layout[keyTo].y, easedP);
            // }

            // if(i === 10 && keyFrom === keyTo) {
            //     console.log(data[i].x);
            //     console.log(data[i].y);
            // } 

            if(data[i].Fatal === "Yes") {
                context.fillStyle = colours.guNewsKicker;
            } else {
                context.fillStyle = colours.neutral60; 
            } 

            context.fillRect(data[i].x, data[i].y, r, r);
            // context.beginPath();
            // context.arc(data[i].x,data[i].y,r/2,0,Math.PI*2)
            // context.fill()
        }

        for(var i = 0; i < labels[keyTo].length; i++) {
            const label = labels[keyTo][i];
            const fontScale = (width < 960) ? 0.75 : 1;
            if(label.children.length > 1) {
                context.globalAlpha = easedPlabels;
                context.font = `400 ${14*(fontScale)}px Guardian Text Sans Web`;
                context.strokeStyle = "#ffffff";
                context.textAlign = "center";
                context.lineWidth = 3*fontScale
                context.strokeText(label.data.id, Math.round(label.x), Math.round(label.y + (fontScale*24)));

                context.globalAlpha = easedPlabels;
                context.font = `400 ${14*(fontScale)}px Guardian Text Sans Web`;
                context.fillStyle = "#000"; 
                context.textAlign = "center";
                context.fillText(label.data.id, Math.round(label.x), Math.round(label.y + (fontScale*24)));

                // context.beginPath();
                // context.globalAlpha = easedP;
                // context.strokeStyle = colours.neutral46;
                // context.lineWidth = 1;
                // context.arc(label.x, label.y, label.r, 0, 2 * Math.PI);
                // // console.log(label.x, label.y, label.r)
                // context.stroke();
            
                context.font = `500 ${26*(fontScale)}px Guardian Text Sans Web`;
                context.strokeStyle = "#ffffff";
                context.textAlign = "center";
                context.lineWidth = 3*fontScale
                context.strokeText(commafy(label.children.length), Math.round(label.x), Math.round(label.y - (0*fontScale)));

                context.font = `500 ${26*(fontScale)}px Guardian Text Sans Web`;
                context.fillStyle = "#000";
                context.textAlign = "center";
                context.fillText(commafy(label.children.length), Math.round(label.x), Math.round(label.y - (0*fontScale)));
            }
        } 

        context.restore();

        if(p < 1) {
            
            window.requestAnimationFrame((t) => {
                if(!startT) {
                    startT = t;
                }
                const diff = t - startT;

                const p = Math.min(1,diff/animationDuration);

                draw(p)
            });
        }
    }

    window.requestAnimationFrame((t) => {
        if(!startT) {
            startT = t;
        }

        const diff = t - startT;

        const p = Math.min(1,diff/animationDuration);

        draw(p)
    });
}

function ease(t) { return 1+(--t)*t*t*t*t }

function labelEase(t) { return Math.min(t*t*t*2, 1) }

function interp(a,b,p) {
    return ((a*(1-p) + (b*(p))))
}

function typeGenerator(d) {
    if(d.Sex.toUpperCase() === "Male".toUpperCase() && d.Child.toUpperCase() === "Yes".toUpperCase()) {
        return "Boys"
    }

    if(d.Sex.toUpperCase() === "Male".toUpperCase() && (d.Child === "Unknown" || d.Child.toUpperCase() === "No".toUpperCase())) {
        return "Men"
    }

    if(d.Sex.toUpperCase() === "Female".toUpperCase() && d.Child.toUpperCase() === "Yes".toUpperCase()) {
        return "Girls"
    }

    if(d.Sex.toUpperCase() === "Female".toUpperCase() && (d.Child === "Unknown" || d.Child.toUpperCase() === "No".toUpperCase())) {
        return "Women"
    }

    return "NA"
}

d3.csv("<%= path %>/assets/injured.csv").then(function(data) {
    render(data.map(d => Object.assign({}, d, {
        "name": Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
        "life": typeGenerator(d),
        "monthYear": d.Month + " " + d.Year,
        "injuredKilled": d.Fatal === "Yes" ? "Killed" : "Injured"
    })));
});