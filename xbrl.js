const xmlParser = require('xml2json');

const FundamentalAccountingConcepts = require('./FundamentalAccountingConcepts.js').FundamentalAccountingConcepts;

'use strict';
exports.xmlbrParser = class xmlbrParser {
	
	constructor(xml = null) {
		this.isLoaded = false;
		this.fields = {};
		this.values = {};
		if (xml) {
			this.fromString(xml);
		}
		this.isLoaded = true;
	}

	static async parseStr(data) {
		let parser = new xmlbrParser(data);
		let parsed = JSON.parse(JSON.stringify(parser.values));
		return parsed;
	}

	static async parse(filePath) {
		// Load xml and parse to json
		try {
			let data = await fs.readFileAsync(filePath, 'utf8');
			data = await xmlbrParser.parseStr(data);
			return data;
		}
		catch (err) {
			throw new Error('Problem with reading file', err);
		}
	}

	fromString(data) {
		let jsonObj = xmlParser.toJson(data);
		jsonObj = JSON.parse(jsonObj);
		this.documentJson = jsonObj[Object.keys(jsonObj)[0]];

		// Calculate and load basic facts from json doc
		this.loadField('EntityRegistrantName');
		this.loadField('CurrentFiscalYearEndDate');
		this.loadField('EntityCentralIndexKey');
		this.loadField('EntityFilerCategory');
		this.loadField('TradingSymbol');
		this.loadField('DocumentPeriodEndDate');
		this.loadField('DocumentFiscalYearFocus');
		this.loadField('DocumentFiscalPeriodFocus');
		this.loadField('DocumentFiscalYearFocus', 'DocumentFiscalYearFocusContext', 'contextRef');
		this.loadField('DocumentFiscalPeriodFocus', 'DocumentFiscalPeriodFocusContext', 'contextRef');
		this.loadField('DocumentType');

		let currentPeriodEnd = this.getPeriodEnd();
		if (!currentPeriodEnd) {
			//throw new Error('No year end found.');
			console.error('No year end found.');
			return false;
		}
		let durations = this.getContextForDurations(currentPeriodEnd);
		let instants = this.getContextForInstants(currentPeriodEnd);

		this.fields.ContextForInstants = instants.default;
		this.fields.ContextForDurations = this.fields.DocumentFiscalPeriodFocusContext;
		this.fields.BalanceSheetDate = currentPeriodEnd;

		this.values.ContextForInstants = instants.default;
		this.values.ContextForDurations = this.values.DocumentFiscalPeriodFocusContext;
		this.values.BalanceSheetDate = currentPeriodEnd;
		this.values.durations = durations;
		this.values.instants = instants.instants;

		// Load the rest of the facts
		FundamentalAccountingConcepts.load(this);

		return this.values;
	}


	// Utility functions
	loadField(conceptToFind, fieldName, key) {
		key = key || '$t';
		fieldName = fieldName || conceptToFind;

		let concept = this.documentJson['dei:' + conceptToFind];
		// console.debug(fieldName + "=> " + JSON.stringify(concept, null, 3));
		if (Array.isArray(concept)) {
			// warn about multliple concepts...
			console.warn('Found ' + concept.length + ' context references')
			concept.forEach( (conceptInstance, idx)=>{
				console.warn('=> ' + conceptInstance.contextRef + (idx === 0 ? ' (selected)' : ''));
			});
			// ... then default to the first available contextRef
			concept = concept.shift();
		}
		if (concept) {
			concept = concept[key];
		}
		else {
			concept = null;
		}
		this.fields[fieldName] = concept;
		this.values[fieldName] = concept;

		//console.debug(`loaded ${fieldName}: ${this.fields[fieldName]}`);
	}


	getFactValue(concept, context) {
		// If the user selected one of the default/placeholder 
		// values, look up the value we set aside.
		let placeholders = {
			"Instant": this.fields.ContextForInstants,
			"Duration": this.fields.ContextForDurations
		};
		if(context in placeholders){
			context = placeholders[context];
		}
		// Check the value to see it was a duration that has been
		// included in our document.
		if(!(context in this.values.durations) && !(context in this.values.instants)){
			console.error('Context Error: ' + contextReference);
			return null;
		}

		let factNode = null;
		let nodes = this.documentJson[concept] || [];
		if(!Array.isArray(nodes)){
			nodes = [nodes];
		}
		nodes.forEach(node => {
			if (node.contextRef === context) {
				factNode = node;
			}
		});

		let factValue = null;
		if (factNode) {
			factValue = factNode['$t'];
			for (var key in factNode) {
				if (key.indexOf('nil') >= 0) {
					factValue = 0;
				}
			}
			factValue = Number(factValue);
		}
		return factValue;
	}


	getNodeList(nodeNamesArr, root) {
		root = root || this.documentJson;

		let allNodes = nodeNamesArr
			.map((key) => {
				key = root[key];
				return key;
			})
			.reduce((a, d) => {
				if (d) {
					a = a.concat(d);
				}
				return a;
			}, [])
			;
		return allNodes;
	}


	getPeriodEnd() {
		var currentEnd = this.fields.DocumentPeriodEndDate;
		try{
			currentEnd = currentEnd.split('-');
			currentEnd[1] = +currentEnd[1] - 1
			currentEnd = Date.UTC(... currentEnd);
		}
		catch(e){
			currentEnd = null;
		}
		if(Number.isNaN(currentEnd)){
			currentEnd = null;
		}
		if(!currentEnd){
			console.warn(this.fields.DocumentPeriodEndDate + ' is not a date');
		}
		return this.formatDate(currentEnd);
	}

	formatDate(date){
		date = new Date(date);
		date = date.toISOString().split('T').shift();
		return date;
	}


	getContextForInstants(endDate) {
		let context = this.documentJson;
		context = JSON.stringify(context);
		context = context.replace(/xbrli:/g, '');
		context = JSON.parse(context);
		context = context.context;

		// Uses the concept ASSETS to find the correct instance context
		let instanceNodesArr = this
			.getNodeList([
				'us-gaap:Assets',
				'us-gaap:AssetsCurrent',
				'us-gaap:LiabilitiesAndStockholdersEquity'
			])
			.map(d=>{return d.contextRef})
			;
		let instants = Object.values(context)
			.filter(period=>{
				let ismatch = instanceNodesArr.includes(period.id);
				return ismatch;
			})
			.reduce((a,period)=>{
				a[period.id] = period.period.instant;
				return a;
			},{});
		
		let contextForInstants = Object.entries(instants).filter((i)=>{ 
			return i[1] === endDate;
		}).pop();
		if (!contextForInstants) {
			contextForInstants = this.lookForAlternativeInstanceContext();
		}
		contextForInstants = contextForInstants.shift();

		return {
			default: contextForInstants,
			instants: instants
		};
	}


	/**
	 * Identifies relevant Range Contexts
	 * 
	 * Generates a list of Range Contexts that are used in the 
	 * dataset, also attempts to identify the *most* relevant one to 
	 * the current document.
	 * 
	 * Key Ranges:
	 *  - Financial Year
	 *  - Focal Period (eg. Q1, Q2)
	 * 
	 * The current need is based on financial statements, so we want to 
	 * know the period of the Current Financial Year, and the start/end of 
	 * the current quarter. All else can be calculated.
	 * 
	 * There will be other cases that are relevant to this function, 
	 * but they have not been explicitly handled.
	 * 
	 * @param {date} endDate 
	 */
	getContextForDurations(endDate) {
		let context = this.documentJson;
		context = JSON.stringify(context);
		context = context.replace(/xbrli:/g, '');
		context = JSON.parse(context);
		context = context.context;

		// sample a couple of relevant nodes for the durations they use
		let durationNodesArr = this
			.getNodeList([
				'us-gaap:CashAndCashEquivalentsPeriodIncreaseDecrease',
				'us-gaap:CashPeriodIncreaseDecrease',
				'us-gaap:NetIncomeLoss',
				'dei:DocumentPeriodEndDate'
			])
			.map(d=>{return d.contextRef})
			;
		// It is possible that there are many different types of contexts 
		// (Instance vs Durations), but also durations that are not relevant 
		// to us. For example, major shareholder events (conferences) could 
		// have a duration specified for them; the release of shares happens 
		// at an instance of time. The problem is that we don't use that 
		// information in our financials that we build, so we need to filter 
		// the data down to items that we are going to use.
		let durations = Object.values(context)
			.filter(period=>{
				let ismatch = durationNodesArr.includes(period.id);
				return ismatch;
			})
			.reduce((a,period)=>{
				a[period.id] = period.period;
				return a;
			},{});
		return durations;
	}


	lookForAlternativeInstanceContext() {
		let altContextId = null;
		let altNodesArr = JSON.stringify(this.documentJson);
		altNodesArr = altNodesArr.replace(/xbrli:/g, '');
		altNodesArr = JSON.parse(altNodesArr);
		altNodesArr = altNodesArr.context.period.instant
			.filter((node) => {
				let ismatch = (node === this.fields['BalanceSheetDate']);
				return ismatch;
			})
			.forEach(alt => {
				this.documentJson['us-gaap:Assets'].forEach((node) => {
					if (node.contextRef === alt.id) {
						altContextId = alt.id;
					}
				});
			})
			;
		return altContextId;
	}

}

