# BV-BRC Javascript Client
bvbrc_js_client is a javascript client library for accessing the BV-BRC Data API

## Setup
```npm install bvbrc_js_client```

## Usage
```
const Service = require('bvbrc_js_client')
const svc = new Service("https://patricbrc.org/api")

# BASE API
# GET using async/await
var genome = await svc.get("genome","227377.26")

# GET using promises
svc.get("genome","227377.26").then((genome)=>{
    console.log(`Genome: ${genome}`)
})

# QUERY with RQL using async/await
var result = await svc.query("genome","eq(genome_id,227377.26)")
console.log(`Query Metadata -  Total Items: ${result.meta.total_items} Start: ${result.meta.start}`)
console.log("Genomes: ", result.items)

# QUERY with RQL using promises
svc.query("genome","eq(genome_id,227377.26)").then((result)=>{
    console.log(`Query Metadata -  Total Items: ${result.meta.total_items} Start: ${result.meta.start}`)
    console.log("Genomes: ", result.items)
})

# QUERY with SOLR queries 
var result = await svc.query("genome","genome_id:227377.26")
console.log(`Query Metadata -  Total Items: ${result.meta.total_items} Start: ${result.meta.start}`)
console.log("Genomes: ", result.items)