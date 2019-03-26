import * as d3 from "d3"
import * as d3Beeswarm from "d3-beeswarm"
import fs from "fs";
import csvjson from "csvjson"

const D3Node = require('d3-node')
const d3n = new D3Node()      // initializes D3 with container element

const width = 860;
const height = 860;

const csvData = fs.readFileSync("./src/assets/injured.csv", "utf-8");

const deathsData = csvjson.toObject(csvData).map(d => {
    const splitData = d.Date.split("/");
    console.log(splitData);
    d.formattedDate = new Date("20" + splitData[2], splitData[1] - 1, splitData[0]);
    return d;
});

const radius = 3;
const padding = 3;

const deathsDataXY = d3.packSiblings(d3.range(deathsData.length/12).map(() => ({r: radius + padding + Math.random()})));

const svg = d3n.createSVG(width,height)

// const deathsData = [];

// new Array(365).fill(0).map((d,i) => {
//     for(let v = 0; v < (Math.random()*1500); v++) {
//         deathsData.push({day: i})
//     }
// }); 

// const xScale = d3.scaleLinear().domain([0, 365]).range([0, width]);

const xScale = d3.scaleTime()
    .domain([new Date(2018, 2, 30), new Date(2019, 2, 1)])
    .range([0, width]);

const yScale = d3.scaleLinear().domain([0, 400]).range([height, 0]);

// var swarm = d3Beeswarm.beeswarm()
//   .data(deathsData)  
//   .distributeOn((d, i) => {               
//        return xScale(d.day);            
//   })  
//   .radius(2.5)  
//   .orientation('horizontal')                  
//   .side('symetric')                   
//   .arrange();    

// var simulation = d3.forceSimulation(deathsData)
//       .force("x", d3.forceX(width / 2).strength(1))
//       .force("y", d3.forceY(height / 2).strength(1))
//       .force("collide", d3.forceCollide(2))
//       .stop();

// for (var i = 0; i < 100; ++i) {
//     // if(simulation.alpha() > 0.00009) {
//         simulation.tick();

//         if(i % 10 === 0) {
//             console.log(i);
//             console.log(simulation.alpha())
//         }
//     // }
// };

// console.log(deathsData)

const circles = svg.append("g")
    .attr("transform", `translate(${width/2} ${height/2})`)
    .selectAll("circle")
    .data(deathsDataXY)
    .enter()
        .append("circle")
        .attr("cx", (d,i) => d.x)
        .attr("cy", (d, i) => d.y)
        .attr("r", radius)
        .style("fill", d => {
            if(d.Sex === "Female") {
                return "#c70000"
            } else {
                return "#0084c6"
            }
        });


fs.writeFileSync("./output.svg", d3n.svgString())