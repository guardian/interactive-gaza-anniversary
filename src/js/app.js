import * as d3Array from "d3-array"
import * as d3Select from "d3-selection"
import * as d3Scale from "d3-scale"
import * as d3Shape from "d3-shape"
import * as d3Transition from "d3-transition"
import * as d3Ease from "d3-ease"
import * as d3Fetch from "d3-fetch"
import * as d3Format from "d3-format"
import { event as d3event } from "d3-selection"
import * as d3Collection from "d3-collection"
import * as d3Axis from "d3-axis"

const d3 = Object.assign({}, d3Array, d3Axis, d3Collection, d3Fetch, d3Select, d3Scale, d3Shape, d3Transition, d3Ease, d3Format);

import colours from "./palette"
import labels from "../assets/labels.json"
var commafy = require('commafy');

const container = d3.select(".scroll-inner");

const pixelRatio = window.devicePixelRatio;
const vertical = (window.innerHeight > window.innerWidth);
const scaledWidth = d3.select(".scroll-inner").node().clientWidth * pixelRatio;
const scaledHeight = (vertical) ? scaledWidth*0.80 : d3.select(".scroll-inner").node().clientHeight * pixelRatio;  

const width = scaledWidth/pixelRatio;
const height = scaledHeight/pixelRatio;  

// const verticalPadding = (

const circleScaler = Math.min((width/1300), (height/1008))

let yPadding = (-40)*(circleScaler); 
let xPadding = 0;

if(height > circleScaler*1040) {
    yPadding = Math.round((height - (circleScaler*1040))/2);
}

if(width > circleScaler*1300) {
    xPadding = Math.round((width - (circleScaler*1300))/2);
}

const r = 2 * (circleScaler);
const padding = 0.25 * circleScaler;

const keys = ["injuredKilled", "life", "monthYear", "Weapon"]

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

    //data here

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

    // const offscreenCanvas = document.createElement('canvas');
    // offscreenCanvas.width = r;
    // offscreenCanvas.height = r;

    // const ctx = offscreenCanvas.getContext("2d");
    
    // ctx.fillStyle = colours.neutral60;
    // ctx.fillRect(0, 0, r, r);

    const fatalData = data.filter((d, i) => d.injuredKilled === "Killed");
    const injuredData = data.filter((d, i) => d.injuredKilled === "Injured");

    function draw(p) {
        // context.fillStyle = colours.newsRed;
        const easedP = d3.easeExpOut(p, 0.5);
        const easedPlabels = labelEase(p);
        context.save();
        context.clearRect(0, 0, width, height);

        context.fillStyle = colours.newsRed;
        context.beginPath();
        if(keyFrom === keyTo) {
            context.globalAlpha = easedP;
        }
        for (var i = 0; i < fatalData.length; i++) {
            fatalData[i].x = interp(fatalData[i].layout[keyFrom].x, fatalData[i].layout[keyTo].x, easedP);
            fatalData[i].y = interp(fatalData[i].layout[keyFrom].y, fatalData[i].layout[keyTo].y, easedP);
 
            context.rect((fatalData[i].x * (circleScaler)) + xPadding, (fatalData[i].y * (circleScaler)) + yPadding, r, r);
        }
        context.fill();
        context.closePath();
        

        context.fillStyle = colours.neutral60;

        if(keyFrom === keyTo) {
            context.globalAlpha = easedP;
        }

        context.beginPath();

        for (var i = 0; i < injuredData.length; i++) { 
            // injuredData[i].x = interp(injuredData[i].layout[keyFrom].x, injuredData[i].layout[keyTo].x, easedP);
            // injuredData[i].y = interp(injuredData[i].layout[keyFrom].y, injuredData[i].layout[keyTo].y, easedP);

            const interped = interpXY(injuredData[i].layout[keyFrom], injuredData[i].layout[keyTo], easedP)
            
            context.rect((interped[0]* (circleScaler)) + xPadding, (interped[1]* (circleScaler)) + yPadding, r, r);
        }
        context.fill();
        context.closePath();
        for(var i = 0; i < labels[keyTo].length; i++) {
            const label = labels[keyTo][i];
            const fontScale = (width < 960) ? 0.75 : 1;
            if(label.childrenLength > 50 || keyTo === "monthYear") { 
                if(label.id.split("/").length !== 3) {
                    context.globalAlpha = easedPlabels;
                    context.font = `400 ${14*(fontScale)}px Guardian Text Sans Web`;
                    context.strokeStyle = "#ffffff";
                    context.textAlign = "center";
                    context.lineWidth = 3*fontScale
                    context.strokeText(label.id, Math.round(label.x* (circleScaler)) + xPadding, Math.round(label.y* (circleScaler) + (fontScale*24) + yPadding));

                    // context.globalAlpha = easedPlabels;
                    context.font = `400 ${14*(fontScale)}px Guardian Text Sans Web`;
                    context.fillStyle = "#000"; 
                    context.textAlign = "center";
                    context.fillText(label.id, Math.round(label.x* (circleScaler)) + xPadding, Math.round(label.y* (circleScaler) + (fontScale*24) + yPadding));

                    let childCount;
                    // if(keyTo === "monthYear") {
                    //     // console.log("!!?!?!?!?!?")
                    //     childCount = d3.sum(label.children, bn => bn.children.length);
                    // } else {
                        childCount = label.childrenLength;
                    // }
                
                    context.font = `500 ${26*(fontScale)}px Guardian Titlepiece`;
                    context.strokeStyle = "#ffffff";
                    context.textAlign = "center";
                    context.lineWidth = 3*fontScale
                    context.strokeText(commafy(childCount), Math.round(label.x* (circleScaler)) + xPadding, Math.round(label.y* (circleScaler) + (4*fontScale) + yPadding));

                    context.font = `500 ${26*(fontScale)}px Guardian Titlepiece`;
                    context.fillStyle = "#000";
                    context.textAlign = "center";
                    context.fillText(commafy(childCount), Math.round(label.x* (circleScaler)) + xPadding, Math.round(label.y* (circleScaler) + (4*fontScale) + yPadding));
                } else {
                    if(label.childrenLength > 750 && width > 740) { 
                        context.globalAlpha = easedPlabels;
                        context.font = `400 ${13*(fontScale)}px Guardian Text Sans Web`;
                        context.strokeStyle = "#ffffff";
                        context.textAlign = "center";
                        context.lineWidth = 3*fontScale 
                        context.strokeText(Number(label.id.slice(0,2)) + " " + month(label.id.slice(3,5)), Math.round(label.x* (circleScaler)) + xPadding, Math.round(label.y* (circleScaler) + (fontScale*6) + yPadding));

                        // context.globalAlpha = easedPlabels;
                        context.font = `400 ${13*(fontScale)}px Guardian Text Sans Web`;
                        context.fillStyle = "#000"; 
                        context.textAlign = "center";
                        context.fillText(Number(label.id.slice(0,2)) + " " + month(label.id.slice(3,5)), Math.round(label.x* (circleScaler)) + xPadding, Math.round(label.y* (circleScaler) + (fontScale*6) + yPadding));
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

function interpXY(a,b,p) {
    const ap = 1 - p;
    return [((a.x*(ap) + (b.x*(p)))), ((a.y*(ap) + (b.y*(p))))]
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

d3.json("<%= path %>/assets/civ_data.json").then(function(data) {
    render(data); 

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
            bigNumber: `<div><span>47%</span> on average in 2018</div>`,
            words: `Gaza’s health system has all but collapsed, and the vast influx of casualties from the protests threatens to overwhelm it. The high number and gravity of the injuries have significantly depleted supplies. More than half of drugs are at “zero stock” levels, which means less than a month’s supply remains.`
        },
        {
            name: "Quality of wastewater flows into the sea (Effluent BOD mg/lt)*",
            title: "Quality of wastewater flows into the sea",
            tickFormat: null,
            startAt: 0,
            bigNumber: `<div><span>232</span>mg/litre on average in 2018</div>`,
            words: `Almost all of Gaza’s tap water is undrinkable, either tainted with sewage or salt water from the sea. Authorities have at times said they had to pump raw sewage into the sea.`
        },
        {
            name: "Total number of medical applications submitted to EREZ Crossings",
            title: "Medical applications for exit via Israel",
            tickFormat: null,
            startAt: 0,
            bigNumber: `<div><span>39%</span>of medical applications denied/delayed in 2018</div>`,
            words: `While Gaza’s health system is unable to cope, Israel has prevented patients from entering for medical emergencies. Very few Palestinians in Gaza apply because they know they will be rejected. Those who do, have a high chance of being denied or having their applications delayed.`
        },
        {
            name: "Hours per day (electricity)",
            title: "Hours of electricity supplied per day",
            tickFormat: null,
            startAt: 0,
            bigNumber: `<div><span>6.6</span>hours per day on average in 2018</div>`,
            words: `Gaza receives electricity from Israel and Egypt but it is paid for by the Palestinian Authority (PA) in the West Bank. A rivalry with Hamas has meant the PA has occasionally stopped payments to punish its political foes, leading to blackouts.`
        }, 
        {
            name: "GDP per capita",
            title: "GDP per capita",
            tickFormat: null,
            startAt: 340,
            bigNumber: `<div><span>$X</span> per capita on average in 2018</div>`,
            words: `The economy in Gaza is collapsing, the World Bank has warned. Every second person lives in poverty and economic growth is negative. Foreign aid, recently cut by the Trump administration, is not enough to support life in the strip.`
        },
        {
            name: "Unemployment Rate /Youth",
            title: "Youth unemployment rate",
            tickFormat: formatPercent,
            startAt: 0.40,
            bigNumber: `<div><span>52%</span>on average in 2018</div>`,
            words: `Most young people in Gaza have never left. The Palestinian Central Bureau of Statistics says youth unemployment has reached 50%, but the World Bank puts the figure at around 70%.`
        }
    ]

    const nestedData = d3.nest().key(d => d.Indicator).entries(chartDataRaw);

    const els = [].slice.apply(document.querySelectorAll(".line-wrapper"));

    const chartHeight = 200;
    const chartWidth = els[0].clientWidth;

    charts.forEach((chartObj, i) => {
        const chart = chartObj.name;
        const chartTitle = chartObj.title;
        let chartData = (nestedData.find(d => d.key === chart)).values
            .map(d => Object.assign({}, d, {"formattedDate": new Date(d.date.split("/")[1] + "/" + d.date.split("/")[0] + "/20" + d.date.split("/")[2]), "numValue": Number(d.Value)}))

        if(chart === "Total number of medical applications submitted to EREZ Crossings") {
            const permits = (nestedData.find(d => d.key === "% of denied and delayed permits to cross EREZ")).values;
            chartData = chartData.map((d,i) => Object.assign({}, d, {"% of denied and delayed permits to cross EREZ": Number(permits[i].Value)}))
            // (nestedData.find(d => d.key === "% of denied and delayed permits to cross EREZ")).values;
        }
        
        const el = d3.select(els[i]).select(".inner");

        // el.append("h3").text(chartTitle)
        el.append("div").classed("big-number", true).html(chartObj.bigNumber)

        const svg = el.append("svg")
            .attr("height", chartHeight)
            .attr("width", chartWidth);

        // el.append("p").text(chartObj.words);
 
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
                .text("Denied/delayed applications")
                .style("fill", "#767676")
        }

            
    }); 
    
}