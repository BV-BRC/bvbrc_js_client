# BV-BRC Javascript Client
bvbrc_js_client is a javascript client library for accessing the BV-BRC Data API

## Setup
```npm install bvbrc_js_client```

## Build
Running a build will create a dist/bvbrc_client.js file that can be loaded independantly in the browser. This createa a 'BVBRCClient' class on the global (window) object when included in browser.

```npm run build```

## Usage

Here are some usage examples.  These are for node, but it works the same in browser except you don't need to require('bvbrc_js_client').  Instead load the built dist module above and then instantiate 
the BVBRCClient the same way as Service below.

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

# API with sugar
# For at least the base data types, there is a wrapper around the base apis. For example svc.get("genome", gid) is available as svc.getGenome(gid)

# Get Genome
const genome = await svc.getGenome("227377.26")

# Queries for Genomes
const result = await svc.queryGenomes("eq(genome_id,227377.26)")
const result = await svc.queryGenomes("keyword(coxiella)",{limit: 10})
const result = await svc.queryGenomes("coxiella",{limit: 10, start:5, query_lang: "solr"})

