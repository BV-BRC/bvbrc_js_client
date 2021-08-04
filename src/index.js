const fetch = require('node-fetch');
const errors = require("./errors");
const QueryResult = require("./query_result")

class BVBRCAPIService {
	constructor(endpoint, token) {
		this.initialized=false

		if (endpoint) {
			this.initialized=true
			this.endpoint = endpoint
			this.token = token
		}

		this.dataTypes = ["antibiotics", "encyme_class_ref", "feature_sequence", "gene_ontology_ref", "genome", "genome_amr", "genome_feature", "genome_sequence",
			"id_ref", "misc_niaid_sgc", "model_complex_role", "model_compound", "model_reaction", "model_template_biomass", "model_template_reaction",
			"pathway", "pathway_ref", "ppi", "protein_family_ref", "sp_gene", "sp_gene_evidence", "sp_gene_ref", "subsystem", "subsystem_ref", "taxonomy",
			"transcriptomics_experiment", "transcriptomics_gene", "transcriptomics_sample"]
	}

	checkInitialization(){
		if (!this.initialized){
			throw new errors.ClientNotInitialized()
		}
	}

	init(endpoint,token){
		if (!endpoint){
			throw Error("Must provide endpont to initialize client")
		}
		this.endpoint=endpoint
		this.token=token
		this.initialized=true
	}

	async get(data_type, id) {
		// base get for all data types

		this.checkInitialization()
		if (this.dataTypes.indexOf(data_type) < 0) {
			throw new errors.InvalidDataType(`Invalid Data Type: ${data_type}`)
		}

		var req_opts = {
			"headers": {
				accept: "application/json",
				authorization: this.token || ''
			}
		}

		const response = await fetch(`${this.endpoint}/${data_type}/${encodeURIComponent(id)}`, req_opts)

		if (!response.ok) {
			if (response.status === 404) {
				throw new errors.NotFound(`${data_type} ${id} not found`)
			}
			throw Error(`${response.status} ${response.statusText}`);
		}
		return response.json()
	}

	async query(data_type, query, options = {}) {
		// base query function for all data types
		// console.log(`query(${data_type},${query},${options})`);

		this.checkInitialization()

		if (this.dataTypes.indexOf(data_type) < 0) {
			throw Error("Invalid Data Type")
		}
		var req_options = {
			method: "POST",
			headers: {
				"accept": options.accept || "application/json",
				"authorization": this.token || ''
			}
		}
		var body;

		options.query_lang = options.query_lang || "rql"
		if (["rql", "solr"].indexOf(options.query_lang) < 0) {
			throw errors.InvalidQueryLanguage(`${options.query_lang} is not a valid query lang. Must be 'rql' or 'solr'`)
		}

		switch (options.query_lang) {
			case "solr":
				req_options.headers["content-type"] = "application/solrquery+x-www-form-urlencoded"
				body = `q=${query}`
				if (options.limit) {
					body = `${body}&rows=${options.limit}&start=${options.start || 0}`
				}

				if (options.select) {
					bod = `${body}&fl=${options.select.join(',')}`
				}
				break;
			case "rql":
			default:
				req_options.headers["content-type"] = "application/rqlquery+x-www-form-urlencoded"
				body = query
				if (options.limit) {
					body = `${body}&limit(${options.limit},${options.start || 0})`
				}
				if (options.select) {
					bod = `${body}&select(${options.select.join(',')})`
				}
				break;

		}

		req_options.body = body;
		var response = await fetch(`${this.endpoint}/${data_type}/`, req_options)

		if (!response.ok) {
			throw Error(`${response.statusText}`);
		}

		var item_meta = response.headers.get('content-range').split(" ")[1]
		var parts = item_meta.split("/")
		var total = parseInt(parts[1])
		var start = parseInt(parts[0].split("-")[0])
		var meta = { start: start, total_items: total }
		return new QueryResult(await response.json(), meta)
	}

	async getSchema(data_type) {
		//get the solr schema for a data type

		this.checkInitialization()

		if (this.dataTypes.indexOf(data_type) < 0) {
			throw Error("Invalid Data Type")
		}

		var req_opts = {
			"method": "GET",
			"headers": {
				accept: "application/json"
			}
		}
		return fetch(`${this.endpoint}/${data_type}/schema`, req_opts)
			.then((response) => {
				if (!response.ok) {
					throw Error(`${response.statusText}`);
				}
				return response.json()
			})
	}

	async getGenome(id) {
		// Get Genome by Id
		return await this.get("genome", id);
	}

	async queryGenomes(query, opts = {}) {
		// Query for Genomes using a query string (rql or solr)
		return await this.query("genome", query, opts)
	}

	async getGenomeFeature(id) {
		// Get a Genome feature by ID
		return await this.get("genome_feature", id);
	}

	async getGenomeFeatures(genomes, opts = {}) {
		// Get features for a genome or an array of genomes
		if (!(genomes instanceof Array)) {
			genomes = [genomes]
		}
		return this.queryGenomeFeatures(`in(genome_id,(${genomes.join(',')}))`, opts)
	}

	async getGenomeFeaturesByQuery(genome_query, feature_filter = "", opts = {}) {
		// query genomes with 'genome_query' and with the resulting genome_ids, query genome_features.
		// optionally limit the feature query further with the feature_filter query.  
		// Only works with RQL at the moment

		if (opts.query_lang && opts.query_lang != "rql") {
			throw errors.InvalidQueryLanguage("getGenomeFeaturesByQuery currently only works with RQL queries and filters")
		}
		const result = await this.queryGenomes(genome_query, { select: ["genome_id"], limit: opts.genome_limit || 500 })
		const genome_ids = result.items.map(g => { return g.genome_id })
		var query = `in(genome_id,(${genome_ids}))`
		if (feature_filter) {
			query = `${query}&${feature_filter}`
		}
		return this.queryGenomeFeatures(query, opts)
	}

	async queryGenomeFeatures(query, opts = {}) {
		// query for genome_features
		return await this.query("genome_feature", query, opts)
	}

	async getGenomeSequence(id) {
		// get a genome sequence by id
		return await this.get("genome_sequence", id);
	}

	async getGenomeSequences(genomes, opts = {}) {
		// Get sequences for a genome id or an array of genome ids
		if (!(genomes instanceof Array)) {
			genomes = [genomes]
		}
		return this.queryGenomeSequences(`in(genome_id,(${genomes.join(',')}))`, opts)
	}

	async queryGenomeSequences(query, opts = {}) {
		// query for genome sequences
		return await this.query("genome_sequence", query, opts)
	}

	async getSpecialtyGene(id) {
		// get a specialty gene by id
		return await this.get("sp_gene", id);
	}

	async querySpecialtyGene(query, opts = {}) {
		//query for specialty genes
		return await this.query("sp_gene", query, opts)
	}

	async setGenomePermissions(ids, perms) {
		this.checkInitialization()

		if (!this.token) {
			throw new Error("Missing token.  Authorization required for setGenomePermissions")
		}
		if (!ids || !perms) {
			throw new Error('setGenomePermission expects id and permissions');
		}

		var data = perms.map(function (p) {
			return {
				user: p.user,
				permission: this.permMapping(p.permission)
			};
		}, this);

		var ids = Array.isArray(ids) ? ids : [ids];
		const params = { data: JSON.stringify(data) }

		const req_opts = {
			method: "POST",
			headers: {
				'content-type': 'application/json',
				"accept": "application/json",
				'Authorization': this.token
			},
			body: data
		}

		var response = await fetch(`${this.endpoint}/permissions/genome/${ids.join(',')}`, req_options)

		if (!response.ok) {
			throw Error(`${response.statusText}`);
		}

		return await response.json()
	}

	permMapping(perm) {
		const mapping = {
			'Can view': 'read',
			'Can edit': 'write',
			'Varies': 'unchanged',
			'r': 'read',
			'w': 'write'
		};

		return mapping[perm];
	}

	solrPermsToObjs(selection) {
		var permSets = [];
		// var allPermissions = {};

		selection.forEach(function (sel) {
			// var id = sel.genome_id;

			var readList = sel.user_read || [],
				writeList = sel.user_write || [];

			var writeObjs = writeList.map(function (user) {
				var obj = {
					user: user,
					perm: 'Can edit'
				};

				return obj;
			});

			var readObjs = readList.filter(function (user) {
				// if user has write permission, only list that
				return writeList.indexOf(user) == -1;
			}).map(function (user) {
				var obj = {
					user: user,
					perm: 'Can view'
				};

				return obj;
			});

			var permObjs = readObjs.concat(writeObjs);
			permSets.push(permObjs);
		});

		var permissions = permSets.reduce(
			function (a, b) { return a.concat(b); },
			[]
		);

		return permissions;
	}

}

module.exports = BVBRCAPIService
