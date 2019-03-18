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
    console.log(data.length)
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

        if(key === "monthYear") {
            (d3.nest().key(d => d["Date"]).entries(data)).forEach(v => {
                headers.push({"name": v.key, "value": v.values[0].monthYear})
            });
        }

        const hierarchyData = d3.stratify()
            .id((d, i) => d.name)
            .parentId((d, i) => (d.value) ? d.value : (key === "monthYear") ? d["Date"] : d[keyToNestBy])(headers.concat(d3.shuffle(data).filter(v => v.Month !== undefined))); 

            // .parentId((d, i) => (d.value) ? d.value : d.Weapon)(headers.concat(data.filter(v => v.Month !== undefined))); 
        const pack = d3.pack()
            .size([width, height])
            .radius(d => d.value * (r+padding))
                (d3.hierarchy(hierarchyData)
                    .count(d => d.value)
                    .sort((a, b) => b.value - a.value ));

        const leaves = pack.leaves();

        if(key === "monthYear") {
            console.log(pack.children);
            labels[key] = [];
            pack.children.forEach((c) => {
                labels[key] = labels[key].concat(c.children)
            }); 
            labels[key] = labels[key].concat(pack.children);
        } else {
            labels[key] = pack.children;
        }
 
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
            // if(keys[z] === "monthYear") {
            //     const splitDate = dataObject[n.data.id].Date.split("/")
            //     dataObject[n.data.id].layout[keys[z]].x = Math.random()*width;
            //     dataObject[n.data.id].layout[keys[z]].y = yScale(new Date(splitDate[1] + "/" + splitDate[0] + "/" + splitDate[2]));
            // } else {
            dataObject[n.data.id].layout[keys[z]].x = n.x;
            dataObject[n.data.id].layout[keys[z]].y = n.y;
            // }
        });
    });

    window.requestAnimationFrame(() => {
        drawNext(keys[0], keys[0]);
    });
    
    window.requestAnimationFrame(checkScroll);
}

const yScale = d3.scaleTime().domain([new Date("03/30/2018"), new Date("03/30/2019")]).range([0, height])

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
    let currentColour = null;
    function draw(p) {
        // context.fillStyle = colours.newsRed;
        const easedP = ease(p);
        const easedPlabels = labelEase(p);
        context.save();
        context.clearRect(0, 0, width, height);
        context.fillStyle = colours.neutral60; 
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
                if(currentColour !== colours.newsRed) {
                    context.fillStyle = colours.newsRed;
                    currentColour = colours.newsRed;
                }
            } else {
                if(currentColour !== colours.neutral60) {
                    context.fillStyle = colours.neutral60;
                    currentColour = colours.neutral60;
                }
            } 
 
            context.fillRect(data[i].x, data[i].y, r, r);
            // context.beginPath();
            // context.arc(data[i].x,data[i].y,r/2,0,Math.PI*2)
            // context.fill()
        }

        for(var i = 0; i < labels[keyTo].length; i++) {
            const label = labels[keyTo][i];
            const fontScale = (width < 960) ? 0.75 : 1;
            if(label.children.length > 50 || keyTo === "monthYear") { 
                if(label.data.id.split("/").length !== 3) {
                    context.globalAlpha = easedPlabels;
                    context.font = `400 ${14*(fontScale)}px Guardian Text Sans Web`;
                    context.strokeStyle = "#ffffff";
                    context.textAlign = "center";
                    context.lineWidth = 3*fontScale
                    context.strokeText(label.data.id, Math.round(label.x), Math.round(label.y + (fontScale*24)));

                    // context.globalAlpha = easedPlabels;
                    context.font = `400 ${14*(fontScale)}px Guardian Text Sans Web`;
                    context.fillStyle = "#000"; 
                    context.textAlign = "center";
                    context.fillText(label.data.id, Math.round(label.x), Math.round(label.y + (fontScale*24)));
    
                    // context.beginPath();
                    // context.globalAlpha = easedPlabels;
                    // context.strokeStyle = colours.neutral86;
                    // context.lineWidth = 1; 
                    // context.arc(label.x, label.y, label.r, 0, 2 * Math.PI);
                    // // console.log(label.x, label.y, label.r)
                    // context.stroke();

                    let childCount;
                    if(keyTo === "monthYear") {
                        // console.log("!!?!?!?!?!?")
                        childCount = d3.sum(label.children, bn => bn.children.length);
                    } else {
                        childCount = label.children.length;
                    }
                
                    context.font = `500 ${26*(fontScale)}px Guardian Titlepiece`;
                    context.strokeStyle = "#ffffff";
                    context.textAlign = "center";
                    context.lineWidth = 3*fontScale
                    context.strokeText(commafy(childCount), Math.round(label.x), Math.round(label.y + (4*fontScale)));

                    context.font = `500 ${26*(fontScale)}px Guardian Titlepiece`;
                    context.fillStyle = "#000";
                    context.textAlign = "center";
                    context.fillText(commafy(childCount), Math.round(label.x), Math.round(label.y + (4*fontScale)));
                } else {
                    if(label.children.length > 750 && width > 740) { 
                        context.globalAlpha = easedPlabels;
                        context.font = `400 ${13*(fontScale)}px Guardian Text Sans Web`;
                        context.strokeStyle = "#ffffff";
                        context.textAlign = "center";
                        context.lineWidth = 3*fontScale
                        context.strokeText(Number(label.data.id.slice(0,2)) + " " + month(label.data.id.slice(3,5)), Math.round(label.x), Math.round(label.y + (fontScale*6)));

                        // context.globalAlpha = easedPlabels;
                        context.font = `400 ${13*(fontScale)}px Guardian Text Sans Web`;
                        context.fillStyle = "#000"; 
                        context.textAlign = "center";
                        context.fillText(Number(label.data.id.slice(0,2)) + " " + month(label.data.id.slice(3,5)), Math.round(label.x), Math.round(label.y + (fontScale*6)));
                    }
                }
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

const month = (date) => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return months[Number(date) - 1];
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

d3.csv("<%= path %>/assets/data_1803_2.csv").then(function(data) {
    render(data.filter(d => d.Year !== undefined).map(d => Object.assign({}, d, {
        "name": Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
        "life": typeGenerator(d),
        "monthYear": d.Month + " " + d.Year,
        "injuredKilled": d.Fatal === "Yes" ? "Killed" : "Injured"
    }))); 

    d3.csv("<%= path %>/assets/out.csv").then((chartData) => {
        renderCharts(chartData);
    });
});

var formatPercent = d3.format(".0%");

const renderCharts = (chartDataRaw) => {
    // const charts = ["Percentage of drugs at Zero Stock",
    // "# of days of fuel availability - HEALTH",
    // "Total number of medical applications submitted to EREZ Crossings",
    // "Hours per day (electricity)",
    // "GDP per capita",
    // "Unemployment Rate /Youth"];

    const charts = [
        {
            name: "Percentage of drugs at Zero Stock",
            title: "Percentage of drugs at zero stock levels",
            tickFormat: formatPercent,
            startAt: 0.25,
            bigNumber: `<div><span>47%</span> on average in 2018</div>`
        },
        {
            name: "Quality of wastewater flows into the sea (Effluent BOD mg/lt)*",
            title: "Quality of wastewater flows into the sea",
            tickFormat: null,
            startAt: 0,
            bigNumber: `<div><span>232</span>mg/litre on average in 2018</div>`
        },
        {
            name: "Total number of medical applications submitted to EREZ Crossings",
            title: "Medical applications for exit via Israel",
            tickFormat: null,
            startAt: 0,
            bigNumber: `<div><span>39%</span>of medical applications denied in 2018</div>`
        },
        {
            name: "Hours per day (electricity)",
            title: "Hours of electricity supplied per day",
            tickFormat: null,
            startAt: 0,
            bigNumber: `<div><span>6.6</span>hours per day on average in 2018</div>`
        }, 
        {
            name: "GDP per capita",
            title: "GDP per capita",
            tickFormat: null,
            startAt: 340,
            bigNumber: `<div><span>$X</span> per capita on average in 2018</div>`
        },
        {
            name: "Unemployment Rate /Youth",
            title: "Youth unemployment rate",
            tickFormat: formatPercent,
            startAt: 0.40,
            bigNumber: `<div><span>52%</span>on average in 2018</div>`
        }
    ]

    const nestedData = d3.nest().key(d => d.Indicator).entries(chartDataRaw);

    const chartHeight = 200;
    const chartWidth = 400;

    charts.forEach(chartObj => {
        const chart = chartObj.name;
        const chartTitle = chartObj.title;
        let chartData = (nestedData.find(d => d.key === chart)).values
            .map(d => Object.assign({}, d, {"formattedDate": new Date(d.date.split("/")[1] + "/" + d.date.split("/")[0] + "/20" + d.date.split("/")[2]), "numValue": Number(d.Value)}))

        if(chart === "Total number of medical applications submitted to EREZ Crossings") {
            const permits = (nestedData.find(d => d.key === "% of denied and delayed permits to cross EREZ")).values;
            chartData = chartData.map((d,i) => Object.assign({}, d, {"% of denied and delayed permits to cross EREZ": Number(permits[i].Value)}))
            // (nestedData.find(d => d.key === "% of denied and delayed permits to cross EREZ")).values;
        }
        
        const el = d3.select(".line-charts").append("div").classed("line-wrapper", true);

        el.append("h3").text(chartTitle)
        el.append("div").classed("big-number", true).html(chartObj.bigNumber)

        const svg = el.append("svg")
            .attr("height", chartHeight)
            .attr("width", chartWidth);

        el.append("p").text("Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean eget dui nunc. Sed et odio at lorem blandit sagittis nec id ex. Proin nunc purus, vehicula finibus felis scelerisque, pellentesque malesuada mi. Aenean a neque id turpis hendrerit tincidunt et a sem. ");
 
        const defs = svg.append("defs");

        defs.html(`<linearGradient id="myGradient" gradientTransform="rotate(90)">
        <stop offset="10%"  stop-color="#ff4e36" stop-opacity="0.25"/>
        <stop offset="70%" stop-color="#fff" stop-opacity="0" />
      </linearGradient><linearGradient id="myGradient2" gradientTransform="rotate(90)">
      <stop offset="50%"  stop-color="#bdbdbd" stop-opacity="0.25"/>
      <stop offset="90%" stop-color="#fff" stop-opacity="0" />
    </linearGradient><filter id="f3" x="0" y="0" width="200%" height="200%">
      <feOffset result="offOut" in="SourceAlpha" dx="0" dy="0" />
      <feGaussianBlur result="blurOut" in="offOut" stdDeviation="3" />
      <feBlend in="SourceGraphic" in2="blurOut" mode="normal" />
    </filter><pattern id="psfll" patternUnits="userSpaceOnUse" width="4" height="4"><rect width="4" height="4" fill="none"></rect><path d="M 0,4 l 4,-4 M -1,1 l 2,-2
    M 3,5 l 2,-2" stroke-width="1" shape-rendering="auto" stroke="#dcdcdc" stroke-linecap="square"></path></pattern>`); 
 
        const xScale = d3.scaleTime()
            .domain([chartData[0].formattedDate, chartData[chartData.length - 1].formattedDate])
            .range([40, chartWidth])
            // .nice();

        const yScale = d3.scaleLinear()
            .domain([chartObj.startAt, d3.extent(chartData, d => d.numValue)[1]])
            .range([chartHeight, 0])
            // .nice();

        const line = d3.area()
            .x(d => xScale(d.formattedDate))
            .y(d => yScale(d.Value))
            // .curve(d3.curveStepAfter)

        const areaHashed = d3.area()
            .x(d => xScale(d.formattedDate))
            .y1(d => {
                return yScale(d.Value*Number(d["% of denied and delayed permits to cross EREZ"]))
            })
            .y0(d => yScale(0))

        const lineHashed = d3.line()
            .x(d => xScale(d.formattedDate))
            .y(d => {
                return yScale(d.Value*Number(d["% of denied and delayed permits to cross EREZ"]))
            }) 

        const area = d3.area()
            .x(d => xScale(d.formattedDate))
            .y1(d => yScale(d.Value))
            .y0(d => yScale(0))
            // .curve(d3.curveStepAfter)

        svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + chartHeight + ")")
            .call(d3.axisBottom(xScale));

        svg.append("g")
            .attr("class", "y axis")
            .call(d3.axisLeft(yScale).ticks(6).tickFormat(chartObj.tickFormat)); 

        svg.append("path")
            .datum(chartData) 
            .attr("class", "area") 
            .attr("d", area); 
        
        if(chart === "Total number of medical applications submitted to EREZ Crossings") {
            svg.append("path")
                .datum(chartData) 
                .attr("class", "area-hashed") 
                .attr("d", areaHashed); 

            svg.append("path")
                .datum(chartData) 
                .attr("class", "line-hashed") 
                .attr("d", lineHashed); 

            svg.selectAll("circle.foo")
                .data(chartData)
                .enter()
                .append("circle")
                .attr("cx", d => xScale(d.formattedDate))
                .attr("cy", d => yScale(d.Value*Number(d["% of denied and delayed permits to cross EREZ"])))
                .attr("r", 3)
                .classed("circle-hashed", true);
        }

        if(chart === "Quality of wastewater flows into the sea (Effluent BOD mg/lt)*") {
            svg.append("line")
                .attr('x1', 40)
                .attr('x2', chartWidth)
                .attr("y1", yScale(60))
                .attr("y2", yScale(60))
                .style("stroke", "#dcdcdc")
                .style("stroke-width", "2px")

            svg.append("text")
                .attr("y", yScale(60) - 6)
                .attr("x", 40)
                .text("International standard, 60 mg/litre")
                .style("fill", "#767676");
        }

        svg.append("path")
            .datum(chartData) 
            .attr("class", "line") 
            .attr("d", line); 

        svg.selectAll("circle.foo")
            .data(chartData)
            .enter()
            .append("circle")
            .attr("cx", d => xScale(d.formattedDate))
            .attr("cy", d => yScale(d.Value))
            .attr("r", 3);

        svg.selectAll(".y .tick line")
            .attr("x1", 0)
            .attr("x2", chartWidth)
        
        svg.selectAll(".y .tick text")
            .attr("x", 0)
            .attr("dy", -6)
            .style("text-anchor", "start")

        if(chart === "Total number of medical applications submitted to EREZ Crossings") {
            svg.append("text")
                .attr("x", 50)
                .attr("y", yScale(1500) + 12)
                .text("Rejected applications")
                .style("fill", "#767676")
        }

            
    }); 
    
}