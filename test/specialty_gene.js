const chai = require("chai");
const assert = chai.assert
const Service = require("../src")
const endpoint = "https://patricbrc.org/api"
//const endpoint = "http://localhost:3001"
//const endpoint='https://httpbin.org/post'

describe("Specialty Gene API Tests", function(){
	const svc = new Service(endpoint)
	const test_taxon_id="189542"

	it("querySpecialtyGene-RQL", async function(){
		const result = await svc.queryGenomeFeatures(`eq(taxon_id,${test_taxon_id})`,{"limit": 10})
		const spgenes = result.items
		assert.equal(spgenes[0].taxon_id,test_taxon_id)
		assert.lengthOf(spgenes,10)
	})

	it("queryGenomeFeatures-SOLR", async function(){
		const result = await svc.queryGenomeFeatures(`taxon_id:${test_taxon_id}`,{"query_lang": "solr","limit":10})
		const spgenes = result.items
		assert.equal(spgenes[0].taxon_id,test_taxon_id)
		assert.lengthOf(spgenes,10)
	})
});
