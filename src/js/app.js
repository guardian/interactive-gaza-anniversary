import * as d3 from "d3"
import colours from "./palette"
var commafy = require('commafy');

const container = d3.select(".interactive-wrapper");

const width = 1260;
const height = 800;  

const r = 1.75;
const padding = 0.25;

const keys = ["Extra", "life", "Month", "Weapon", "Sex"];
let labels = {};
 
const render = (data) => {
    // console.log(data);
    const canvasSelect = container.append("canvas")
        .attr("width", width)
        .attr("height", height)
        .style('cursor', 'pointer')
        .style("width", `${width}px`)
        .style("height", `${height}px`)

    const canvas = canvasSelect.node();
    const context = canvas.getContext('2d'); 
    // context.translate(width / 2, height / 2);

    // first layout

    const layouts = keys.map(key => {
        const keyToNestBy = key;

        const headers = [
            {"name": "root", value: ""}
        ];

        (d3.nest().key(d => d[keyToNestBy]).entries(data)).forEach(v => {
            headers.push({"name": v.key, "value": "root"});
        });

        if(key === "Extra") {
            // console.log(headers);
        }
 
        const hierarchyData = d3.stratify()
            .id((d, i) => d.name)
            .parentId((d, i) => (d.value) ? d.value : d[keyToNestBy])(headers.concat(d3.shuffle(data).filter(v => v.Month !== undefined))); 

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

    drawInitial(context, Object.values(dataObject))
}

const drawInitial = (context, data) => {
    context.clearRect(0, 0, width, height);

    for (var i = 0, len = data.length; i < len; i++) {
        context.beginPath();
        context.rect(data[i].layout[keys[0]].x, data[i].layout[keys[0]].y, r, r); 
        
        // console.log(data[i])
        if(data[i].Sex !== "Male") {
            context.fillStyle = colours.guOpinionHeadline;
        } else {
            context.fillStyle = colours.neutral60;
        } 
        context.fill(); 
    }

    setTimeout(() => {
        drawNext(context, data, keys[0], keys[1]);
    }, 3000)

    setTimeout(() => {
        drawNext(context, data, keys[1], keys[2]);
    }, 6000)

    setTimeout(() => {
        drawNext(context, data, keys[2], keys[3]);
    }, 9000)

    setTimeout(() => {
        drawNext(context, data, keys[3], keys[4]);
    }, 12000)
}

function drawNext(context, data, keyFrom, keyTo) {
    context.clearRect(0,0, width, height);

    let startT = null;
    let animationDuration = 3000;

    function draw(p) {
        // context.fillStyle = colours.newsRed;
        const easedP = ease(p);
        context.save();
        context.clearRect(0, 0, width, height);

        for (var i = 0; i < data.length; i++) {
            data[i].x = interp(data[i].layout[keyFrom].x, data[i].layout[keyTo].x, easedP);
            data[i].y = interp(data[i].layout[keyFrom].y, data[i].layout[keyTo].y, easedP);

            if(data[i].Sex !== "Male") {
                context.fillStyle = colours.guOpinionHeadline;
            } else {
                context.fillStyle = colours.neutral60;
            } 

            context.beginPath();
            context.fillRect(data[i].x, data[i].y, r, r);
        }

        for(var i = 0; i < labels[keyTo].length; i++) {
            const label = labels[keyTo][i];
            context.globalAlpha = easedP;
            context.font = "400 14px Guardian Text Sans Web";
            context.strokeStyle = "#f6f6f6";
            context.textAlign = "center";
            context.lineWidth = 3
            context.strokeText(label.data.id, Math.round(label.x), Math.round(label.y + 6));

            context.font = "400 14px Guardian Text Sans Web";
            context.fillStyle = "#333";
            context.textAlign = "center";
            context.fillText(label.data.id, Math.round(label.x), Math.round(label.y + 6));

            if(label.children.length > 1000) {
                context.font = "500 28px Guardian Titlepiece";
                context.strokeStyle = "#f6f6f6";
                context.textAlign = "center";
                context.lineWidth = 3
                context.strokeText(commafy(label.children.length), Math.round(label.x), Math.round(label.y - 16));

                context.font = "500 28px Guardian Titlepiece";
                context.fillStyle = "#000000";
                context.textAlign = "center";
                context.fillText(commafy(label.children.length), Math.round(label.x), Math.round(label.y - 16));
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

function interp(a,b,p) {
    return ((a*(1-p) + (b*(p))))
}

function typeGenerator(d) {
    if(d.Sex.toUpperCase() === "Male".toUpperCase() && d.Child.toUpperCase() === "Yes".toUpperCase()) {
        return "Boy"
    }

    if(d.Sex.toUpperCase() === "Male".toUpperCase() && (d.Child === "Unknown" || d.Child.toUpperCase() === "No".toUpperCase())) {
        return "Man"
    }

    if(d.Sex.toUpperCase() === "Female".toUpperCase() && d.Child.toUpperCase() === "Yes".toUpperCase()) {
        return "Girl"
    }

    if(d.Sex.toUpperCase() === "Female".toUpperCase() && (d.Child === "Unknown" || d.Child.toUpperCase() === "No".toUpperCase())) {
        return "Woman"
    }

    return "NA"
}

d3.csv("<%= path %>/assets/injured.csv").then(function(data) {
    render(data.map(d => Object.assign({}, d, {"name": Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15), "life": typeGenerator(d)})));
});