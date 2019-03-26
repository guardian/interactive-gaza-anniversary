import * as d3 from "d3"
import * as d3Beeswarm from "d3-beeswarm"
import fs from "fs";
import csvjson from "csvjson"

const D3Node = require('d3-node')
const d3n = new D3Node()      // initializes D3 with container element

const width = 1300;
const height = 1040;

const r = 2;
const padding = 0.25;

let labels = {};

const csvData = fs.readFileSync("./src/assets/data_1803_2.csv", "utf-8");

const keys = ["injuredKilled", "life", "monthYear", "Weapon"]

const data = csvjson.toObject(csvData).filter(d => d.Year !== undefined).map(d => Object.assign({}, d, {
    "name": Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
    "life": typeGenerator(d),
    "monthYear": d.Month + " " + d.Year,
    "injuredKilled": d.Fatal === "Yes" ? "Killed" : "Injured"
}))

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
        labels[key] = [];
        pack.children.forEach((c) => {
            labels[key] = labels[key].concat(c.children)
        }); 
        labels[key] = labels[key].concat(pack.children);
    } else {
        labels[key] = pack.children;
    }

    labels[key].forEach(d => {
        // console.log(d.data);
        d.id = d.data.id;

        if(key === "monthYear") {
            d.childrenLength = d3.sum(d.children, bn => bn.value);
        } else {
            d.childrenLength = d.children.length;
        }

        // d.childrenLength = d.children.length;

        d.data = null;
        d.parent = null;
        d.children = null;
    });

    return leaves;
});

let dataObject = {};

data.forEach(d => {
    dataObject[d.name] = d;
});

layouts.forEach((layout, z) => {
    layout.forEach(n => {
        if(!dataObject[n.data.id].layout) {
            const injuredKilled = dataObject[n.data.id].injuredKilled
            dataObject[n.data.id] = {}
            dataObject[n.data.id].injuredKilled = injuredKilled;
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
        dataObject[n.data.id].layout[keys[z]].x = (n.x).toFixed(2);
        dataObject[n.data.id].layout[keys[z]].y = (n.y).toFixed(2);
        // }
    });
});

fs.writeFileSync("./src/assets/civ_data.json", JSON.stringify(Object.values(dataObject)));
fs.writeFileSync("./src/assets/labels.json", JSON.stringify(labels));