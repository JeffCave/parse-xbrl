
exports.FundamentalAccountingConcepts = class FundamentalAccountingConcepts{
	static load(xbrl, debug = true) {
		let origDebugger = console.debug;
		if(!debug){
			console.debug = ()=>{};
		}

		console.debug('');
		console.debug('FUNDAMENTAL ACCOUNTING CONCEPTS:');
		console.debug('Entity registrant name: ' + xbrl.fields['EntityRegistrantName']);
		console.debug('CIK: ' + xbrl.fields['EntityCentralIndexKey']);
		console.debug('Entity filer category: ' + xbrl.fields['EntityFilerCategory']);
		console.debug('Trading symbol: ' + xbrl.fields['TradingSymbol']);
		console.debug('Fiscal year: ' + xbrl.fields['DocumentFiscalYearFocus']);
		console.debug('Fiscal period: ' + xbrl.fields['DocumentFiscalPeriodFocus']);
		console.debug('Document type: ' + xbrl.fields['DocumentType']);
		console.debug('Balance Sheet Date (document period end date): ' + xbrl.fields['DocumentPeriodEndDate']);
		console.debug('Income Statement Period (YTD, current period, period start date): ' + xbrl.fields['IncomeStatementPeriodYTD'] + ' to ' + xbrl.fields['BalanceSheetDate']);
		console.debug('Context ID for document period focus (instants): ' + xbrl.fields['ContextForInstants']);
		console.debug('Context ID for YTD period (durations): ' + xbrl.fields['ContextForDurations']);

		FundamentalAccountingConcepts._loadInstanceValues(xbrl);
		FundamentalAccountingConcepts._loadDurationValues(xbrl);

		// Key ratios
		xbrl.fields['ROA'] = xbrl.fields['NetIncomeLoss'] / xbrl.fields['Assets'];
		xbrl.fields['ROE'] = xbrl.fields['NetIncomeLoss'] / xbrl.fields['Equity'];
		xbrl.fields['ROS'] = xbrl.fields['NetIncomeLoss'] / xbrl.fields['Revenues'];
		let sgr = 
			xbrl.fields['ROS'] * 
			(1 + (xbrl.fields['Assets'] - xbrl.fields['Equity']) / xbrl.fields['Equity'])
			;
		xbrl.fields['SGR'] = sgr / ((1 / (xbrl.fields['Revenues'] / xbrl.fields['Assets'])) - sgr) || null;

		console.debug = origDebugger;
	}


	/**
	 * Load the Point in time values
	 * 
	 * Assets are point-in-time values. 
	 */
	static _loadInstanceValues(xbrl){
		// Assets
		xbrl.fields['Assets'] = 
			xbrl.getFactValue('us-gaap:Assets', 'Instant') || 
			0;

		// Current Assets
		xbrl.fields['CurrentAssets'] = 
			xbrl.getFactValue('us-gaap:AssetsCurrent', 'Instant') || 
			0;

		// Noncurrent Assets
		xbrl.fields.NoncurrentAssets = xbrl.getFactValue('us-gaap:AssetsNoncurrent', 'Instant');
		if (xbrl.fields.NoncurrentAssets === null) {
			if (xbrl.fields.Assets && xbrl.fields.CurrentAssets) {
				xbrl.fields.NoncurrentAssets = xbrl.fields.Assets - xbrl.fields.CurrentAssets;
			} else {
				xbrl.fields.NoncurrentAssets = 0;
			}
		}

		// LiabilitiesAndEquity
		xbrl.fields['LiabilitiesAndEquity'] = xbrl.getFactValue('us-gaap:LiabilitiesAndStockholdersEquity', 'Instant');
		if (xbrl.fields['LiabilitiesAndEquity'] === null) {
			xbrl.fields['LiabilitiesAndEquity'] = xbrl.getFactValue('us-gaap:LiabilitiesAndPartnersCapital', 'Instant');
			if (xbrl.fields['LiabilitiesAndEquity']) {
				xbrl.fields['LiabilitiesAndEquity'] = 0;
			}
		}

		// Liabilities
		xbrl.fields['Liabilities'] = 
			xbrl.getFactValue('us-gaap:Liabilities', 'Instant') || 
			0;

		// CurrentLiabilities
		xbrl.fields['CurrentLiabilities'] = 
			xbrl.getFactValue('us-gaap:LiabilitiesCurrent', 'Instant') || 
			0;

		// Noncurrent Liabilities
		xbrl.fields['NoncurrentLiabilities'] = xbrl.getFactValue('us-gaap:LiabilitiesNoncurrent', 'Instant');
		if (xbrl.fields['NoncurrentLiabilities'] === null) {
			if (xbrl.fields['Liabilities'] && xbrl.fields['CurrentLiabilities']) {
				xbrl.fields['NoncurrentLiabilities'] = xbrl.fields['Liabilities'] - xbrl.fields['CurrentLiabilities']
			} else {
				xbrl.fields['NoncurrentLiabilities'] = 0;
			}
		}

		// CommitmentsAndContingencies
		xbrl.fields['CommitmentsAndContingencies'] = 
			xbrl.getFactValue('us-gaap:CommitmentsAndContingencies', 'Instant') || 
			0;

		// TemporaryEquity
		xbrl.fields['TemporaryEquity'] = 
			xbrl.getFactValue('us-gaap:TemporaryEquityRedemptionValue', 'Instant') ||
			xbrl.getFactValue('us-gaap:RedeemablePreferredStockCarryingAmount', 'Instant') ||
			xbrl.getFactValue('us-gaap:TemporaryEquityCarryingAmount', 'Instant') ||
			xbrl.getFactValue('us-gaap:TemporaryEquityValueExcludingAdditionalPaidInCapital', 'Instant') ||
			xbrl.getFactValue('us-gaap:TemporaryEquityCarryingAmountAttributableToParent', 'Instant') ||
			xbrl.getFactValue('us-gaap:RedeemableNoncontrollingInterestEquityFairValue', 'Instant') || 
			0;
		// RedeemableNoncontrollingInterest (added to temporary equity)
		var redeemableNoncontrollingInterest = 
			xbrl.getFactValue('us-gaap:RedeemableNoncontrollingInterestEquityCarryingAmount', 'Instant') ||
			xbrl.getFactValue('us-gaap:RedeemableNoncontrollingInterestEquityCommonCarryingAmount', 'Instant') || 
			0;
		// This adds redeemable noncontrolling interest and temporary equity which are rare, but can be reported seperately
		if (xbrl.fields['TemporaryEquity']) {
			xbrl.fields['TemporaryEquity'] = Number(xbrl.fields['TemporaryEquity']) + Number(redeemableNoncontrollingInterest);
		}


		// Equity
		xbrl.fields['Equity'] = 
			xbrl.getFactValue('us-gaap:StockholdersEquityIncludingPortionAttributableToNoncontrollingInterest', 'Instant') ||
			xbrl.getFactValue('us-gaap:StockholdersEquity', 'Instant') ||
			xbrl.getFactValue('us-gaap:PartnersCapitalIncludingPortionAttributableToNoncontrollingInterest', 'Instant') ||
			xbrl.getFactValue('us-gaap:PartnersCapital', 'Instant') ||
			xbrl.getFactValue('us-gaap:CommonStockholdersEquity', 'Instant') ||
			xbrl.getFactValue('us-gaap:MemberEquity', 'Instant') ||
			xbrl.getFactValue('us-gaap:AssetsNet', 'Instant') || 
			0;


		// EquityAttributableToNoncontrollingInterest
		xbrl.fields['EquityAttributableToNoncontrollingInterest'] = 
			xbrl.getFactValue('us-gaap:MinorityInterest', 'Instant') ||
			xbrl.getFactValue('us-gaap:PartnersCapitalAttributableToNoncontrollingInterest', 'Instant') || 
			0;

		// EquityAttributableToParent
		xbrl.fields['EquityAttributableToParent'] = 
			xbrl.getFactValue('us-gaap:StockholdersEquity', 'Instant') ||
			xbrl.getFactValue('us-gaap:LiabilitiesAndPartnersCapital', 'Instant') || 
			0;

		// BS Adjustments
		// If total assets is missing, try using current assets
		let logic = 
			xbrl.fields['Assets'] === 0 &&
			xbrl.fields['Assets'] === xbrl.fields['LiabilitiesAndEquity'] &&
			xbrl.fields['CurrentAssets'] === xbrl.fields['LiabilitiesAndEquity']
			;
		if(logic){
			xbrl.fields['Assets'] = xbrl.fields['CurrentAssets'];
		}

		// Added to fix Assets
		logic = 
			xbrl.fields['Assets'] === 0 &&
			xbrl.fields['LiabilitiesAndEquity'] !== 0 &&
			xbrl.fields['CurrentAssets'] === xbrl.fields['LiabilitiesAndEquity']
			;
		if(logic) {
			xbrl.fields['Assets'] = xbrl.fields['CurrentAssets'];
		}

		// Added to fix Assets even more
		logic = 
			xbrl.fields['Assets'] === 0 &&
			xbrl.fields['NoncurrentAssets'] === 0 &&
			xbrl.fields['LiabilitiesAndEquity'] !== 0 &&
			(xbrl.fields['LiabilitiesAndEquity'] === xbrl.fields['Liabilities'] + xbrl.fields['Equity'])
			;
		if(logic) {
			xbrl.fields['Assets'] = xbrl.fields['CurrentAssets'];
		}

		if (xbrl.fields['Assets'] !== 0 && xbrl.fields['CurrentAssets'] !== 0) {
			xbrl.fields['NoncurrentAssets'] = xbrl.fields['Assets'] - xbrl.fields['CurrentAssets'];
		}

		if (xbrl.fields['LiabilitiesAndEquity'] === 0 && xbrl.fields['Assets'] !== 0) {
			xbrl.fields['LiabilitiesAndEquity'] = xbrl.fields['Assets'];
		}

		// Impute: Equity based no parent and noncontrolling interest being present
		if (xbrl.fields['EquityAttributableToNoncontrollingInterest'] !== 0 && xbrl.fields['EquityAttributableToParent'] !== 0) {
			xbrl.fields['Equity'] = xbrl.fields['EquityAttributableToParent'] + xbrl.fields['EquityAttributableToNoncontrollingInterest'];
		}

		if (xbrl.fields['Equity'] === 0 && xbrl.fields['EquityAttributableToNoncontrollingInterest'] === 0 && xbrl.fields['EquityAttributableToParent'] !== 0) {
			xbrl.fields['Equity'] = xbrl.fields['EquityAttributableToParent'];
		}

		if (xbrl.fields['Equity'] === 0) {
			xbrl.fields['Equity'] = xbrl.fields['EquityAttributableToParent'] + xbrl.fields['EquityAttributableToNoncontrollingInterest'];
		}

		// Added: Impute Equity attributable to parent based on existence of equity and noncontrolling interest.
		if (xbrl.fields['Equity'] !== 0 &&
			xbrl.fields['EquityAttributableToNoncontrollingInterest'] !== 0 &&
			xbrl.fields['EquityAttributableToParent'] === 0) {
			xbrl.fields['EquityAttributableToParent'] = xbrl.fields['Equity'] - xbrl.fields['EquityAttributableToNoncontrollingInterest'];
		}

		// Added: Impute Equity attributable to parent based on existence of equity and noncontrolling interest.
		if (xbrl.fields['Equity'] !== 0 &&
			xbrl.fields['EquityAttributableToNoncontrollingInterest'] === 0 &&
			xbrl.fields['EquityAttributableToParent'] === 0) {
			xbrl.fields['EquityAttributableToParent'] = xbrl.fields['Equity'];
		}

		// if total liabilities is missing, figure it out based on liabilities and equity
		if (xbrl.fields['Liabilities'] === 0 && xbrl.fields['Equity'] !== 0) {
			xbrl.fields['Liabilities'] = xbrl.fields['LiabilitiesAndEquity'] - (xbrl.fields['CommitmentsAndContingencies'] + xbrl.fields['TemporaryEquity'] + xbrl.fields['Equity']);
		}

		// This seems incorrect because liabilities might not be reported
		if (xbrl.fields['Liabilities'] !== 0 &&
			xbrl.fields['CurrentLiabilities'] !== 0) {
			xbrl.fields['NoncurrentLiabilities'] = xbrl.fields['Liabilities'] - xbrl.fields['CurrentLiabilities'];
		}

		// Added to fix liabilities based on current liabilities
		if (xbrl.fields['Liabilities'] === 0 &&
			xbrl.fields['CurrentLiabilities'] !== 0 &&
			xbrl.fields['NoncurrentLiabilities'] === 0) {
			xbrl.fields['Liabilities'] = xbrl.fields['CurrentLiabilities'];
		}

		var lngBSCheck1 = xbrl.fields['Equity'] - (xbrl.fields['EquityAttributableToParent'] + xbrl.fields['EquityAttributableToNoncontrollingInterest']);
		var lngBSCheck2 = xbrl.fields['Assets'] - xbrl.fields['LiabilitiesAndEquity'];
		var lngBSCheck3;
		var lngBSCheck4;
		var lngBSCheck5;

		if (xbrl.fields['CurrentAssets'] === 0 &&
			xbrl.fields['NoncurrentAssets'] === 0 &&
			xbrl.fields['CurrentLiabilities'] === 0 &&
			xbrl.fields['NoncurrentLiabilities'] === 0) {

			// If current assets/liabilities are zero and noncurrent assets/liabilities;: don't do this test because the balance sheet is not classified
			lngBSCheck3 = 0;
			lngBSCheck4 = 0;
		} else {
			// Balance sheet IS classified
			lngBSCheck3 = xbrl.fields['Assets'] - (xbrl.fields['CurrentAssets'] + xbrl.fields['NoncurrentAssets']);
			lngBSCheck4 = xbrl.fields['Liabilities'] - (xbrl.fields['CurrentLiabilities'] + xbrl.fields['NoncurrentLiabilities']);
		}
		lngBSCheck5 = xbrl.fields['LiabilitiesAndEquity'] - (xbrl.fields['Liabilities'] + xbrl.fields['CommitmentsAndContingencies'] + xbrl.fields['TemporaryEquity'] + xbrl.fields['Equity']);

		if (lngBSCheck1) {
			console.debug('BS1: Equity(' +
				xbrl.fields['Equity'] +
				') = EquityAttributableToParent(' +
				xbrl.fields['EquityAttributableToParent'] +
				') , EquityAttributableToNoncontrollingInterest(' +
				xbrl.fields['EquityAttributableToNoncontrollingInterest'] +
				'): ' +
				lngBSCheck1);
		}
		if (lngBSCheck2) {
			console.debug('BS2: Assets(' +
				xbrl.fields['Assets'] +
				') = LiabilitiesAndEquity(' +
				xbrl.fields['LiabilitiesAndEquity'] +
				'): ' +
				lngBSCheck2);
		}
		if (lngBSCheck3) {
			console.debug([
				'BS3: Assets(',
				xbrl.fields['Assets'],
				') = CurrentAssets(',
				xbrl.fields['CurrentAssets'],
				') + NoncurrentAssets(',
				xbrl.fields['NoncurrentAssets'],
				'): ',
				lngBSCheck3,
			].join(''));
		}
		if (lngBSCheck4) {
			console.debug('BS4: Liabilities(' +
				xbrl.fields['Liabilities'] +
				')= CurrentLiabilities(' +
				xbrl.fields['CurrentLiabilities'] +
				') + NoncurrentLiabilities(' +
				xbrl.fields['NoncurrentLiabilities'] +
				'): ' +
				lngBSCheck4);
		}
		if (lngBSCheck5) {
			console.debug('BS5: Liabilities and Equity(' +
				xbrl.fields['LiabilitiesAndEquity'] +
				')= Liabilities(' +
				xbrl.fields['Liabilities'] +
				') + CommitmentsAndContingencies(' +
				xbrl.fields['CommitmentsAndContingencies'] +
				')+ TemporaryEquity(' +
				xbrl.fields['TemporaryEquity'] +
				')+ Equity(' +
				xbrl.fields['Equity'] +
				'): ' +
				lngBSCheck5);
		}

		// fill in the values
		xbrl.values.Assets = xbrl.fields['Assets'];
		xbrl.values.CurrentAssets = xbrl.fields['CurrentAssets'];
		xbrl.values.NoncurrentAssets = xbrl.fields['NoncurrentAssets'];
		xbrl.values.LiabilitiesAndEquity = xbrl.fields['LiabilitiesAndEquity'];
		xbrl.values.Liabilities = xbrl.fields['Liabilities'];
		xbrl.values.CurrentLiabilities = xbrl.fields['CurrentLiabilities'];
		xbrl.values.NoncurrentLiabilities = xbrl.fields['NoncurrentLiabilities'];
		xbrl.values.CommitmentsAndContingencies = xbrl.fields['CommitmentsAndContingencies'];
		xbrl.values.TemporaryEquity = xbrl.fields['TemporaryEquity'];
		xbrl.values.Equity = xbrl.fields['Equity'];
		xbrl.values.EquityAttributableToNoncontrollingInterest = xbrl.fields['EquityAttributableToNoncontrollingInterest'];
		xbrl.values.EquityAttributableToParent = xbrl.fields['EquityAttributableToParent'];

	}


	/**
	 * Range values
	 * 
	 * Ranges are interesting because several of them are reported. 
	 * Unfortunatley, we don't know which on the user is going to be 
	 * interested in.
	 * 
	 * Take for example "Profit". I may be interested in the amount 
	 * of profit we have earned over the course of a year.
	 * 
	 * This can be expressed in one of two ways:
	 * 
	 * As cumulative profits accrued YTD
	 * 
	 *         J F M A M J J A S O N D
	 *        +------------------------+
	 *     Q1 |======                  |
	 *     Q2 |============            |
	 *     Q3 |==================      |
	 *     Q4 |========================|
	 *     FY |========================|
	 *        +------------------------+
	 * 
	 * or as the individual segments of time that will accumulate to 
	 * the grand total.
	 * 
	 *         J F M A M J J A S O N D
	 *        +------------------------+
	 *     Q1 |======                  |
	 *     Q2 |      ======            |
	 *     Q3 |            ======      |
	 *     Q4 |                  ======|
	 *     FY |========================|
	 *        +------------------------+
	 * 
	 * Both of these persepctives are acurate, and meaningful, and 
	 * therefore both should be made available.
	 */
	static _loadDurationValues(xbrl, duration = "Duration"){
		// Revenues
		xbrl.fields['Revenues'] = 
			xbrl.getFactValue("us-gaap:Revenues", duration) ||
			xbrl.getFactValue("us-gaap:SalesRevenueNet", duration) ||
			xbrl.getFactValue("us-gaap:SalesRevenueServicesNet", duration) ||
			xbrl.getFactValue("us-gaap:RevenuesNetOfInterestExpense", duration) ||
			xbrl.getFactValue("us-gaap:RegulatedAndUnregulatedOperatingRevenue", duration) ||
			xbrl.getFactValue("us-gaap:HealthCareOrganizationRevenue", duration) ||
			xbrl.getFactValue("us-gaap:InterestAndDividendIncomeOperating", duration) ||
			xbrl.getFactValue("us-gaap:RealEstateRevenueNet", duration) ||
			xbrl.getFactValue("us-gaap:RevenueMineralSales", duration) ||
			xbrl.getFactValue("us-gaap:OilAndGasRevenue", duration) ||
			xbrl.getFactValue("us-gaap:FinancialServicesRevenue", duration) ||
			xbrl.getFactValue("us-gaap:RegulatedAndUnregulatedOperatingRevenue", duration) || 
			0;

		// CostOfRevenue
		xbrl.fields['CostOfRevenue'] = 
			xbrl.getFactValue("us-gaap:CostOfRevenue", duration) ||
			xbrl.getFactValue("us-gaap:CostOfServices", duration) ||
			xbrl.getFactValue("us-gaap:CostOfGoodsSold", duration) ||
			xbrl.getFactValue("us-gaap:CostOfGoodsAndServicesSold", duration) || 
			0;

		// GrossProfit
		xbrl.fields['GrossProfit'] = 
			xbrl.getFactValue("us-gaap:GrossProfit", duration) || 
			0;

		// OperatingExpenses
		xbrl.fields['OperatingExpenses'] = 
			xbrl.getFactValue("us-gaap:OperatingExpenses", duration) ||
			xbrl.getFactValue("us-gaap:OperatingCostsAndExpenses", duration) || 
			0;

		// CostsAndExpenses
		xbrl.fields['CostsAndExpenses'] = 
			xbrl.getFactValue("us-gaap:CostsAndExpenses", duration) || 
			0;

		// OtherOperatingIncome
		xbrl.fields['OtherOperatingIncome'] = 
			xbrl.getFactValue("us-gaap:OtherOperatingIncome", duration) || 
			0;

		// OperatingIncomeLoss
		xbrl.fields['OperatingIncomeLoss'] = 
			xbrl.getFactValue("us-gaap:OperatingIncomeLoss", duration) || 
			0;

		// NonoperatingIncomeLoss
		xbrl.fields['NonoperatingIncomeLoss'] = 
			xbrl.getFactValue("us-gaap:NonoperatingIncomeExpense", duration) || 
			0;

		// InterestAndDebtExpense
		xbrl.fields['InterestAndDebtExpense'] = 
			xbrl.getFactValue("us-gaap:InterestAndDebtExpense", duration) || 
			0;

		// IncomeBeforeEquityMethodInvestments
		xbrl.fields['IncomeBeforeEquityMethodInvestments'] = 
			xbrl.getFactValue("us-gaap:IncomeLossFromContinuingOperationsBeforeIncomeTaxesMinorityInterestAndIncomeLossFromEquityMethodInvestments", duration) || 
			0;

		// IncomeFromEquityMethodInvestments
		xbrl.fields['IncomeFromEquityMethodInvestments'] = 
			xbrl.getFactValue("us-gaap:IncomeLossFromEquityMethodInvestments", duration) || 
			0;

		// IncomeFromContinuingOperationsBeforeTax
		xbrl.fields['IncomeFromContinuingOperationsBeforeTax'] = 
			xbrl.getFactValue("us-gaap:IncomeLossFromContinuingOperationsBeforeIncomeTaxesMinorityInterestAndIncomeLossFromEquityMethodInvestments", duration) ||
			xbrl.getFactValue("us-gaap:IncomeLossFromContinuingOperationsBeforeIncomeTaxesExtraordinaryItemsNoncontrollingInterest", duration) || 
			0;

		// IncomeTaxExpenseBenefit
		xbrl.fields['IncomeTaxExpenseBenefit'] = 
			xbrl.getFactValue("us-gaap:IncomeTaxExpenseBenefit", duration) ||
			xbrl.getFactValue("us-gaap:IncomeTaxExpenseBenefitContinuingOperations", duration) || 
			0;

		// IncomeFromContinuingOperationsAfterTax
		xbrl.fields['IncomeFromContinuingOperationsAfterTax'] = 
			xbrl.getFactValue("us-gaap:IncomeLossBeforeExtraordinaryItemsAndCumulativeEffectOfChangeInAccountingPrinciple", duration) || 
			0;

		// IncomeFromDiscontinuedOperations
		xbrl.fields['IncomeFromDiscontinuedOperations'] = 
			xbrl.getFactValue("us-gaap:IncomeLossFromDiscontinuedOperationsNetOfTax", duration) ||
			xbrl.getFactValue("us-gaap:DiscontinuedOperationGainLossOnDisposalOfDiscontinuedOperationNetOfTax", duration) ||
			xbrl.getFactValue("us-gaap:IncomeLossFromDiscontinuedOperationsNetOfTaxAttributableToReportingEntity", duration) || 
			0;

		// ExtraordaryItemsGainLoss
		xbrl.fields['ExtraordaryItemsGainLoss'] = 
			xbrl.getFactValue("us-gaap:ExtraordinaryItemNetOfTax", duration) || 
			0;

		// NetIncomeLoss
		xbrl.fields['NetIncomeLoss'] = 
			xbrl.getFactValue("us-gaap:ProfitLoss", duration) ||
			xbrl.getFactValue("us-gaap:NetIncomeLoss", duration) ||
			xbrl.getFactValue("us-gaap:NetIncomeLossAvailableToCommonStockholdersBasic", duration) ||
			xbrl.getFactValue("us-gaap:IncomeLossFromContinuingOperations", duration) ||
			xbrl.getFactValue("us-gaap:IncomeLossAttributableToParent", duration) ||
			xbrl.getFactValue("us-gaap:IncomeLossFromContinuingOperationsIncludingPortionAttributableToNoncontrollingInterest", duration) || 
			0;

		// NetIncomeAvailableToCommonStockholdersBasic
		xbrl.fields['NetIncomeAvailableToCommonStockholdersBasic'] = 
			xbrl.getFactValue("us-gaap:NetIncomeLossAvailableToCommonStockholdersBasic", duration) || 
			0;

		// #PreferredStockDividendsAndOtherAdjustments
		xbrl.fields['PreferredStockDividendsAndOtherAdjustments'] = 
			xbrl.getFactValue("us-gaap:PreferredStockDividendsAndOtherAdjustments", duration) || 
			0;

		// #NetIncomeAttributableToNoncontrollingInterest
		xbrl.fields['NetIncomeAttributableToNoncontrollingInterest'] = 
			xbrl.getFactValue("us-gaap:NetIncomeLossAttributableToNoncontrollingInterest", duration) || 
			0;

		// #NetIncomeAttributableToParent
		xbrl.fields['NetIncomeAttributableToParent'] = 
			xbrl.getFactValue("us-gaap:NetIncomeLoss", duration) || 
			0;

		// OtherComprehensiveIncome
		xbrl.fields['OtherComprehensiveIncome'] = 
			xbrl.getFactValue("us-gaap:OtherComprehensiveIncomeLossNetOfTax", duration) || 
			0;

		// ComprehensiveIncome
		xbrl.fields['ComprehensiveIncome'] = 
			xbrl.getFactValue("us-gaap:ComprehensiveIncomeNetOfTaxIncludingPortionAttributableToNoncontrollingInterest", duration) ||
			xbrl.getFactValue("us-gaap:ComprehensiveIncomeNetOfTax", duration) || 
			0;

		// ComprehensiveIncomeAttributableToParent
		xbrl.fields['ComprehensiveIncomeAttributableToParent'] = 
			xbrl.getFactValue("us-gaap:ComprehensiveIncomeNetOfTax", duration) ||
			0;

		// ComprehensiveIncomeAttributableToNoncontrollingInterest
		xbrl.fields['ComprehensiveIncomeAttributableToNoncontrollingInterest'] = 
			xbrl.getFactValue("us-gaap:ComprehensiveIncomeNetOfTaxAttributableToNoncontrollingInterest", duration) || 
			0;

		// 'Adjustments to income statement information
		// Impute: NonoperatingIncomeLossPlusInterestAndDebtExpense
		xbrl.fields['NonoperatingIncomeLossPlusInterestAndDebtExpense'] = xbrl.fields['NonoperatingIncomeLoss'] + xbrl.fields['InterestAndDebtExpense'];

		// Impute: Net income available to common stockholders  (if it does not exist)
		let logic = 
			xbrl.fields['NetIncomeAvailableToCommonStockholdersBasic'] === 0 && 
			xbrl.fields['PreferredStockDividendsAndOtherAdjustments'] === 0 &&
			xbrl.fields['NetIncomeAttributableToParent'] !== 0
			;
		if (logic) {
			xbrl.fields['NetIncomeAvailableToCommonStockholdersBasic'] = xbrl.fields['NetIncomeAttributableToParent'];
		}

		// Impute NetIncomeLoss
		logic = 
			xbrl.fields['NetIncomeLoss'] !== 0 &&
			xbrl.fields['IncomeFromContinuingOperationsAfterTax'] === 0
			;
		if (logic) {
			xbrl.fields['IncomeFromContinuingOperationsAfterTax'] = xbrl.fields['NetIncomeLoss'] - xbrl.fields['IncomeFromDiscontinuedOperations'] - xbrl.fields['ExtraordaryItemsGainLoss'];
		}

		// Impute: Net income attributable to parent if it does not exist
		logic = 
			xbrl.fields['NetIncomeAttributableToParent'] === 0 &&
			xbrl.fields['NetIncomeAttributableToNoncontrollingInterest'] === 0 &&
			xbrl.fields['NetIncomeLoss'] !== 0
			;
		if (logic) {
			xbrl.fields['NetIncomeAttributableToParent'] = xbrl.fields['NetIncomeLoss'];
		}

		// Impute: PreferredStockDividendsAndOtherAdjustments
		logic = 
			xbrl.fields['PreferredStockDividendsAndOtherAdjustments'] === 0 &&
			xbrl.fields['NetIncomeAttributableToParent'] !== 0 &&
			xbrl.fields['NetIncomeAvailableToCommonStockholdersBasic'] !== 0
			;
		if(logic) {
			xbrl.fields['PreferredStockDividendsAndOtherAdjustments'] = xbrl.fields['NetIncomeAttributableToParent'] - xbrl.fields['NetIncomeAvailableToCommonStockholdersBasic'];
		}

		// Impute: comprehensive income
		if (xbrl.fields['ComprehensiveIncomeAttributableToParent'] === 0 &&
			xbrl.fields['ComprehensiveIncomeAttributableToNoncontrollingInterest'] === 0 &&
			xbrl.fields['ComprehensiveIncome'] === 0 && xbrl.fields['OtherComprehensiveIncome'] === 0) {
			xbrl.fields['ComprehensiveIncome'] = xbrl.fields['NetIncomeLoss'];
		}

		// Impute: other comprehensive income
		if (xbrl.fields['ComprehensiveIncome'] !== 0 &&
			xbrl.fields['OtherComprehensiveIncome'] === 0) {
			xbrl.fields['OtherComprehensiveIncome'] = xbrl.fields['ComprehensiveIncome'] - xbrl.fields['NetIncomeLoss'];
		}

		// Impute: comprehensive income attributable to parent if it does not exist
		if (xbrl.fields['ComprehensiveIncomeAttributableToParent'] === 0 &&
			xbrl.fields['ComprehensiveIncomeAttributableToNoncontrollingInterest'] === 0 &&
			xbrl.fields['ComprehensiveIncome'] !== 0) {
			xbrl.fields['ComprehensiveIncomeAttributableToParent'] = xbrl.fields['ComprehensiveIncome'];
		}

		// Impute: IncomeFromContinuingOperations*Before*Tax
		if (xbrl.fields['IncomeBeforeEquityMethodInvestments'] !== 0 &&
			xbrl.fields['IncomeFromEquityMethodInvestments'] !== 0 &&
			xbrl.fields['IncomeFromContinuingOperationsBeforeTax'] === 0) {
			xbrl.fields['IncomeFromContinuingOperationsBeforeTax'] = xbrl.fields['IncomeBeforeEquityMethodInvestments'] + xbrl.fields['IncomeFromEquityMethodInvestments'];
		}

		// Impute: IncomeFromContinuingOperations*Before*Tax2 (if income before tax is missing)
		if (xbrl.fields['IncomeFromContinuingOperationsBeforeTax'] === 0 &&
			xbrl.fields['IncomeFromContinuingOperationsAfterTax'] !== 0) {
			xbrl.fields['IncomeFromContinuingOperationsBeforeTax'] = xbrl.fields['IncomeFromContinuingOperationsAfterTax'] + xbrl.fields['IncomeTaxExpenseBenefit'];
		}

		// Impute: IncomeFromContinuingOperations*After*Tax
		if (xbrl.fields['IncomeFromContinuingOperationsAfterTax'] === 0 &&
			(xbrl.fields['IncomeTaxExpenseBenefit'] !== 0 || xbrl.fields['IncomeTaxExpenseBenefit'] === 0) &&
			xbrl.fields['IncomeFromContinuingOperationsBeforeTax'] !== 0) {
			xbrl.fields['IncomeFromContinuingOperationsAfterTax'] = xbrl.fields['IncomeFromContinuingOperationsBeforeTax'] - xbrl.fields['IncomeTaxExpenseBenefit'];
		}

		// Impute: GrossProfit
		logic = 
			xbrl.fields['GrossProfit'] === 0 &&
			xbrl.fields['Revenues'] !== 0 &&
			xbrl.fields['CostOfRevenue'] !== 0
			;
		if (logic) {
			xbrl.fields['GrossProfit'] = xbrl.fields['Revenues'] - xbrl.fields['CostOfRevenue'];
		}

		// Impute: Revenues
		logic = 
			xbrl.fields['GrossProfit'] !== 0 &&
			xbrl.fields['Revenues'] === 0 &&
			xbrl.fields['CostOfRevenue'] !== 0
			;
		if(logic) {
			xbrl.fields['Revenues'] = xbrl.fields['GrossProfit'] + xbrl.fields['CostOfRevenue'];
		}

		// Impute: CostOfRevenue
		logic = 
			xbrl.fields['GrossProfit'] !== 0 &&
			xbrl.fields['Revenues'] !== 0 &&
			xbrl.fields['CostOfRevenue'] === 0
			;
		if(logic) {
			xbrl.fields['CostOfRevenue'] = xbrl.fields['Revenues'] - xbrl.fields['GrossProfit'];
		}

		// Impute: CostsAndExpenses (would NEVER have costs and expenses if has gross profit, gross profit is multi-step and costs and expenses is single-step)
		logic = 
			xbrl.fields['GrossProfit'] === 0 &&
			xbrl.fields['CostsAndExpenses'] === 0 &&
			xbrl.fields['CostOfRevenue'] !== 0 &&
			xbrl.fields['OperatingExpenses'] !== 0
			;
		if(logic){
			xbrl.fields['CostsAndExpenses'] = xbrl.fields['CostOfRevenue'] + xbrl.fields['OperatingExpenses'];
		}

		// Impute: CostsAndExpenses based on existance of both costs of revenues and operating expenses
		logic = 
			xbrl.fields['CostsAndExpenses'] === 0 &&
			xbrl.fields['OperatingExpenses'] !== 0 &&
			xbrl.fields['CostOfRevenue'] !== 0
			;
		if(logic){
			xbrl.fields['CostsAndExpenses'] = xbrl.fields['CostOfRevenue'] + xbrl.fields['OperatingExpenses'];
		}

		// Impute: CostsAndExpenses
		logic = 
			xbrl.fields['GrossProfit'] === 0 &&
			xbrl.fields['CostsAndExpenses'] === 0 &&
			xbrl.fields['Revenues'] !== 0 &&
			xbrl.fields['OperatingIncomeLoss'] !== 0 &&
			xbrl.fields['OtherOperatingIncome'] !== 0
			;
		if(logic){
			xbrl.fields['CostsAndExpenses'] = xbrl.fields['Revenues'] - xbrl.fields['OperatingIncomeLoss'] - xbrl.fields['OtherOperatingIncome'];
		}

		// Impute: OperatingExpenses based on existance of costs and expenses and cost of revenues
		if (xbrl.fields['CostOfRevenue'] !== 0 &&
			xbrl.fields['CostsAndExpenses'] !== 0 &&
			xbrl.fields['OperatingExpenses'] === 0) {
			xbrl.fields['OperatingExpenses'] = xbrl.fields['CostsAndExpenses'] - xbrl.fields['CostOfRevenue'];
		}

		// Impute: CostOfRevenues single-step method
		if (xbrl.fields['Revenues'] !== 0 &&
			xbrl.fields['GrossProfit'] === 0 &&
			(xbrl.fields['Revenues'] - xbrl.fields['CostsAndExpenses'] == xbrl.fields['OperatingIncomeLoss']) &&
			xbrl.fields['OperatingExpenses'] === 0 &&
			xbrl.fields['OtherOperatingIncome'] === 0) {
			xbrl.fields['CostOfRevenue'] = xbrl.fields['CostsAndExpenses'] - xbrl.fields['OperatingExpenses'];
		}

		// Impute: IncomeBeforeEquityMethodInvestments
		if (xbrl.fields['IncomeBeforeEquityMethodInvestments'] === 0 &&
			xbrl.fields['IncomeFromContinuingOperationsBeforeTax'] !== 0) {
			xbrl.fields['IncomeBeforeEquityMethodInvestments'] = xbrl.fields['IncomeFromContinuingOperationsBeforeTax'] - xbrl.fields['IncomeFromEquityMethodInvestments'];
		}

		// Impute: IncomeBeforeEquityMethodInvestments
		if (xbrl.fields['OperatingIncomeLoss'] !== 0 &&
			xbrl.fields['NonoperatingIncomeLoss'] !== 0 &&
			xbrl.fields['InterestAndDebtExpense'] == 0 &&
			xbrl.fields['IncomeBeforeEquityMethodInvestments'] !== 0) {
			xbrl.fields['InterestAndDebtExpense'] = xbrl.fields['IncomeBeforeEquityMethodInvestments'] - (xbrl.fields['OperatingIncomeLoss'] + xbrl.fields['NonoperatingIncomeLoss']);
		}

		// Impute: OtherOperatingIncome
		if (xbrl.fields['GrossProfit'] !== 0 &&
			xbrl.fields['OperatingExpenses'] !== 0 &&
			xbrl.fields['OperatingIncomeLoss'] !== 0) {
			xbrl.fields['OtherOperatingIncome'] = xbrl.fields['OperatingIncomeLoss'] - (xbrl.fields['GrossProfit'] - xbrl.fields['OperatingExpenses']);
		}

		// Move IncomeFromEquityMethodInvestments
		if (xbrl.fields['IncomeFromEquityMethodInvestments'] !== 0 &&
			xbrl.fields['IncomeBeforeEquityMethodInvestments'] !== 0 &&
			xbrl.fields['IncomeBeforeEquityMethodInvestments'] !== xbrl.fields['IncomeFromContinuingOperationsBeforeTax']) {
			xbrl.fields['IncomeBeforeEquityMethodInvestments'] = xbrl.fields['IncomeFromContinuingOperationsBeforeTax'] - xbrl.fields['IncomeFromEquityMethodInvestments'];
			xbrl.fields['OperatingIncomeLoss'] = xbrl.fields['OperatingIncomeLoss'] - xbrl.fields['IncomeFromEquityMethodInvestments'];
		}

		// DANGEROUS!!  May need to turn off. IS3 had 2085 PASSES WITHOUT this imputing. if it is higher,: keep the test
		// Impute: OperatingIncomeLoss
		if (xbrl.fields['OperatingIncomeLoss'] === 0 && xbrl.fields['IncomeBeforeEquityMethodInvestments'] !== 0) {
			xbrl.fields['OperatingIncomeLoss'] = xbrl.fields['IncomeBeforeEquityMethodInvestments'] + xbrl.fields['NonoperatingIncomeLoss'] - xbrl.fields['InterestAndDebtExpense'];
		}

		xbrl.fields['NonoperatingIncomePlusInterestAndDebtExpensePlusIncomeFromEquityMethodInvestments'] = xbrl.fields['IncomeFromContinuingOperationsBeforeTax'] - xbrl.fields['OperatingIncomeLoss'];

		// NonoperatingIncomeLossPlusInterestAndDebtExpense
		if (xbrl.fields['NonoperatingIncomeLossPlusInterestAndDebtExpense'] === 0 && xbrl.fields['NonoperatingIncomePlusInterestAndDebtExpensePlusIncomeFromEquityMethodInvestments'] !== 0) {
			xbrl.fields['NonoperatingIncomeLossPlusInterestAndDebtExpense'] = xbrl.fields['NonoperatingIncomePlusInterestAndDebtExpensePlusIncomeFromEquityMethodInvestments'] - xbrl.fields['IncomeFromEquityMethodInvestments'];
		}

		var lngIS1 = (xbrl.fields['Revenues'] - xbrl.fields['CostOfRevenue']) - xbrl.fields['GrossProfit'];
		var lngIS2 = (xbrl.fields['GrossProfit'] - xbrl.fields['OperatingExpenses'] + xbrl.fields['OtherOperatingIncome']) - xbrl.fields['OperatingIncomeLoss'];
		var lngIS3 = (xbrl.fields['OperatingIncomeLoss'] + xbrl.fields['NonoperatingIncomeLossPlusInterestAndDebtExpense']) - xbrl.fields['IncomeBeforeEquityMethodInvestments'];
		var lngIS4 = (xbrl.fields['IncomeBeforeEquityMethodInvestments'] + xbrl.fields['IncomeFromEquityMethodInvestments']) - xbrl.fields['IncomeFromContinuingOperationsBeforeTax'];
		var lngIS5 = (xbrl.fields['IncomeFromContinuingOperationsBeforeTax'] - xbrl.fields['IncomeTaxExpenseBenefit']) - xbrl.fields['IncomeFromContinuingOperationsAfterTax'];
		var lngIS6 = (xbrl.fields['IncomeFromContinuingOperationsAfterTax'] + xbrl.fields['IncomeFromDiscontinuedOperations'] + xbrl.fields['ExtraordaryItemsGainLoss']) - xbrl.fields['NetIncomeLoss'];
		var lngIS7 = (xbrl.fields['NetIncomeAttributableToParent'] + xbrl.fields['NetIncomeAttributableToNoncontrollingInterest']) - xbrl.fields['NetIncomeLoss'];
		var lngIS8 = (xbrl.fields['NetIncomeAttributableToParent'] - xbrl.fields['PreferredStockDividendsAndOtherAdjustments']) - xbrl.fields['NetIncomeAvailableToCommonStockholdersBasic'];
		var lngIS9 = (xbrl.fields['ComprehensiveIncomeAttributableToParent'] + xbrl.fields['ComprehensiveIncomeAttributableToNoncontrollingInterest']) - xbrl.fields['ComprehensiveIncome'];
		var lngIS10 = (xbrl.fields['NetIncomeLoss'] + xbrl.fields['OtherComprehensiveIncome']) - xbrl.fields['ComprehensiveIncome'];
		var lngIS11 = xbrl.fields['OperatingIncomeLoss'] - (xbrl.fields['Revenues'] - xbrl.fields['CostsAndExpenses'] + xbrl.fields['OtherOperatingIncome']);

		if (lngIS1) {
			console.debug("IS1: GrossProfit(" + xbrl.fields['GrossProfit'] + ") = Revenues(" + xbrl.fields['Revenues'] + ") - CostOfRevenue(" + xbrl.fields['CostOfRevenue'] + "): " + lngIS1);
		}
		if (lngIS2) {
			console.debug("IS2: OperatingIncomeLoss(" + xbrl.fields['OperatingIncomeLoss'] + ") = GrossProfit(" + xbrl.fields['GrossProfit'] + ") - OperatingExpenses(" + xbrl.fields['OperatingExpenses'] + ") + OtherOperatingIncome(" + xbrl.fields['OtherOperatingIncome'] + "): " + lngIS2);
		}
		if (lngIS3) {
			console.debug("IS3: IncomeBeforeEquityMethodInvestments(" + xbrl.fields['IncomeBeforeEquityMethodInvestments'] + ") = OperatingIncomeLoss(" + xbrl.fields['OperatingIncomeLoss'] + ") - NonoperatingIncomeLoss(" + xbrl.fields['NonoperatingIncomeLoss'] + ")+ InterestAndDebtExpense(" + xbrl.fields['InterestAndDebtExpense'] + "): " + lngIS3);
		}
		if (lngIS4) {
			console.debug("IS4: IncomeFromContinuingOperationsBeforeTax(" + xbrl.fields['IncomeFromContinuingOperationsBeforeTax'] + ") = IncomeBeforeEquityMethodInvestments(" + xbrl.fields['IncomeBeforeEquityMethodInvestments'] + ") + IncomeFromEquityMethodInvestments(" + xbrl.fields['IncomeFromEquityMethodInvestments'] + "): " + lngIS4);
		}
		if (lngIS5) {
			console.debug("IS5: IncomeFromContinuingOperationsAfterTax(" + xbrl.fields['IncomeFromContinuingOperationsAfterTax'] + ") = IncomeFromContinuingOperationsBeforeTax(" + xbrl.fields['IncomeFromContinuingOperationsBeforeTax'] + ") - IncomeTaxExpenseBenefit(" + xbrl.fields['IncomeTaxExpenseBenefit'] + "): " + lngIS5);
		}
		if (lngIS6) {
			console.debug("IS6: NetIncomeLoss(" + xbrl.fields['NetIncomeLoss'] + ") = IncomeFromContinuingOperationsAfterTax(" + xbrl.fields['IncomeFromContinuingOperationsAfterTax'] + ") + IncomeFromDiscontinuedOperations(" + xbrl.fields['IncomeFromDiscontinuedOperations'] + ") + ExtraordaryItemsGainLoss(" + xbrl.fields['ExtraordaryItemsGainLoss'] + "): " + lngIS6);
		}
		if (lngIS7) {
			console.debug("IS7: NetIncomeLoss(" + xbrl.fields['NetIncomeLoss'] + ") = NetIncomeAttributableToParent(" + xbrl.fields['NetIncomeAttributableToParent'] + ") + NetIncomeAttributableToNoncontrollingInterest(" + xbrl.fields['NetIncomeAttributableToNoncontrollingInterest'] + "): " + lngIS7);
		}
		if (lngIS8) {
			console.debug("IS8: NetIncomeAvailableToCommonStockholdersBasic(" + xbrl.fields['NetIncomeAvailableToCommonStockholdersBasic'] + ") = NetIncomeAttributableToParent(" + xbrl.fields['NetIncomeAttributableToParent'] + ") - PreferredStockDividendsAndOtherAdjustments(" + xbrl.fields['PreferredStockDividendsAndOtherAdjustments'] + "): " + lngIS8);
		}
		if (lngIS9) {
			console.debug("IS9: ComprehensiveIncome(" + xbrl.fields['ComprehensiveIncome'] + ") = ComprehensiveIncomeAttributableToParent(" + xbrl.fields['ComprehensiveIncomeAttributableToParent'] + ") + ComprehensiveIncomeAttributableToNoncontrollingInterest(" + xbrl.fields['ComprehensiveIncomeAttributableToNoncontrollingInterest'] + "): " + lngIS9);
		}
		if (lngIS10) {
			console.debug("IS10: ComprehensiveIncome(" + xbrl.fields['ComprehensiveIncome'] + ") = NetIncomeLoss(" + xbrl.fields['NetIncomeLoss'] + ") + OtherComprehensiveIncome(" + xbrl.fields['OtherComprehensiveIncome'] + "): " + lngIS10);
		}
		if (lngIS11) {
			console.debug("IS11: OperatingIncomeLoss(" + xbrl.fields['OperatingIncomeLoss'] + ") = Revenues(" + xbrl.fields['Revenues'] + ") - CostsAndExpenses(" + xbrl.fields['CostsAndExpenses'] + ") + OtherOperatingIncome(" + xbrl.fields['OtherOperatingIncome'] + "): " + lngIS11);
		}

		// Cash flow statement

		// NetCashFlow
		xbrl.fields['NetCashFlow'] = 
			xbrl.getFactValue("us-gaap:CashAndCashEquivalentsPeriodIncreaseDecrease", duration) ||
			xbrl.getFactValue("us-gaap:CashPeriodIncreaseDecrease", duration) ||
			xbrl.getFactValue("us-gaap:NetCashProvidedByUsedInContinuingOperations", duration) || 
			0;
	

		// NetCashFlowsOperating
		xbrl.fields['NetCashFlowsOperating'] = xbrl.getFactValue("us-gaap:NetCashProvidedByUsedInOperatingActivities", duration) || 0;

		// NetCashFlowsInvesting
		xbrl.fields['NetCashFlowsInvesting'] = xbrl.getFactValue("us-gaap:NetCashProvidedByUsedInInvestingActivities", duration) || 0;

		// NetCashFlowsFinancing
		xbrl.fields['NetCashFlowsFinancing'] = xbrl.getFactValue("us-gaap:NetCashProvidedByUsedInFinancingActivities", duration) || 0;

		// NetCashFlowsOperatingContinuing
		xbrl.fields['NetCashFlowsOperatingContinuing'] = xbrl.getFactValue("us-gaap:NetCashProvidedByUsedInOperatingActivitiesContinuingOperations", duration) || 0;

		// NetCashFlowsInvestingContinuing
		xbrl.fields['NetCashFlowsInvestingContinuing'] = xbrl.getFactValue("us-gaap:NetCashProvidedByUsedInInvestingActivitiesContinuingOperations", duration) || 0;
		// NetCashFlowsFinancingContinuing
		xbrl.fields['NetCashFlowsFinancingContinuing'] = xbrl.getFactValue("us-gaap:NetCashProvidedByUsedInFinancingActivitiesContinuingOperations", duration) || 0;

		// NetCashFlowsOperatingDiscontinued
		xbrl.fields['NetCashFlowsOperatingDiscontinued'] = xbrl.getFactValue("us-gaap:CashProvidedByUsedInOperatingActivitiesDiscontinuedOperations", duration) || 0;

		// NetCashFlowsInvestingDiscontinued
		xbrl.fields['NetCashFlowsInvestingDiscontinued'] = xbrl.getFactValue("us-gaap:CashProvidedByUsedInInvestingActivitiesDiscontinuedOperations", duration) || 0;

		// NetCashFlowsFinancingDiscontinued
		xbrl.fields['NetCashFlowsFinancingDiscontinued'] = xbrl.getFactValue("us-gaap:CashProvidedByUsedInFinancingActivitiesDiscontinuedOperations", duration) || 0;

		// NetCashFlowsDiscontinued
		xbrl.fields['NetCashFlowsDiscontinued'] = xbrl.getFactValue("us-gaap:NetCashProvidedByUsedInDiscontinuedOperations", duration) || 0;

		// ExchangeGainsLosses
		xbrl.fields['ExchangeGainsLosses'] = 
			xbrl.getFactValue("us-gaap:EffectOfExchangeRateOnCashAndCashEquivalents", duration) ||
			xbrl.getFactValue("us-gaap:EffectOfExchangeRateOnCashAndCashEquivalentsContinuingOperations", duration) ||
			xbrl.getFactValue("us-gaap:CashProvidedByUsedInFinancingActivitiesDiscontinuedOperations", duration) || 
			0;

		// Adjustments
		// Impute: total net cash flows discontinued if not reported
		if (xbrl.fields['NetCashFlowsDiscontinued'] === 0) {
			xbrl.fields['NetCashFlowsDiscontinued'] = xbrl.fields['NetCashFlowsOperatingDiscontinued'] + xbrl.fields['NetCashFlowsInvestingDiscontinued'] + xbrl.fields['NetCashFlowsFinancingDiscontinued'];
		}

		// Impute: cash flows from continuing
		if (xbrl.fields['NetCashFlowsOperating'] !== 0 && xbrl.fields['NetCashFlowsOperatingContinuing'] === 0) {
			xbrl.fields['NetCashFlowsOperatingContinuing'] = xbrl.fields['NetCashFlowsOperating'] - xbrl.fields['NetCashFlowsOperatingDiscontinued'];
		}

		if (xbrl.fields['NetCashFlowsInvesting'] !== 0 && xbrl.fields['NetCashFlowsInvestingContinuing'] === 0) {
			xbrl.fields['NetCashFlowsInvestingContinuing'] = xbrl.fields['NetCashFlowsInvesting'] - xbrl.fields['NetCashFlowsInvestingDiscontinued'];
		}

		if (xbrl.fields['NetCashFlowsFinancing'] !== 0 && xbrl.fields['NetCashFlowsFinancingContinuing'] === 0) {
			xbrl.fields['NetCashFlowsFinancingContinuing'] = xbrl.fields['NetCashFlowsFinancing'] - xbrl.fields['NetCashFlowsFinancingDiscontinued'];
		}

		if (xbrl.fields['NetCashFlowsOperating'] === 0 && xbrl.fields['NetCashFlowsOperatingContinuing'] !== 0 && xbrl.fields['NetCashFlowsOperatingDiscontinued'] === 0) {
			xbrl.fields['NetCashFlowsOperating'] = xbrl.fields['NetCashFlowsOperatingContinuing'];
		}

		if (xbrl.fields['NetCashFlowsInvesting'] === 0 && xbrl.fields['NetCashFlowsInvestingContinuing'] !== 0 && xbrl.fields['NetCashFlowsInvestingDiscontinued'] === 0) {
			xbrl.fields['NetCashFlowsInvesting'] = xbrl.fields['NetCashFlowsInvestingContinuing'];
		}

		if (xbrl.fields['NetCashFlowsFinancing'] === 0 && xbrl.fields['NetCashFlowsFinancingContinuing'] !== 0 && xbrl.fields['NetCashFlowsFinancingDiscontinued'] === 0) {
			xbrl.fields['NetCashFlowsFinancing'] = xbrl.fields['NetCashFlowsFinancingContinuing'];
		}

		xbrl.fields['NetCashFlowsContinuing'] = xbrl.fields['NetCashFlowsOperatingContinuing'] + xbrl.fields['NetCashFlowsInvestingContinuing'] + xbrl.fields['NetCashFlowsFinancingContinuing'];

		// Impute: if net cash flow is missing,: this tries to figure out the value by adding up the detail
		if (xbrl.fields['NetCashFlow'] === 0 && (xbrl.fields['NetCashFlowsOperating'] !== 0 || xbrl.fields['NetCashFlowsInvesting'] !== 0 || xbrl.fields['NetCashFlowsFinancing'] !== 0)) {
			xbrl.fields['NetCashFlow'] = xbrl.fields['NetCashFlowsOperating'] + xbrl.fields['NetCashFlowsInvesting'] + xbrl.fields['NetCashFlowsFinancing'];
		}

		var lngCF1 = xbrl.fields['NetCashFlow'] - (xbrl.fields['NetCashFlowsOperating'] + xbrl.fields['NetCashFlowsInvesting'] + xbrl.fields['NetCashFlowsFinancing'] + xbrl.fields['ExchangeGainsLosses']);

		if (lngCF1 !== 0 && (xbrl.fields['NetCashFlow'] - (xbrl.fields['NetCashFlowsOperating'] + xbrl.fields['NetCashFlowsInvesting'] + xbrl.fields['NetCashFlowsFinancing'] + xbrl.fields['ExchangeGainsLosses']) === (xbrl.fields['ExchangeGainsLosses'] * -1))) {
			lngCF1 = 888888;
		}

		// What is going on here is that 171 filers compute net cash flow differently than everyone else.
		// What I am doing is marking these by setting the value of the test to a number 888888 which would never occur naturally, so that I can differentiate this from errors.
		var lngCF2 = xbrl.fields['NetCashFlowsContinuing'] - (xbrl.fields['NetCashFlowsOperatingContinuing'] + xbrl.fields['NetCashFlowsInvestingContinuing'] + xbrl.fields['NetCashFlowsFinancingContinuing']);
		var lngCF3 = xbrl.fields['NetCashFlowsDiscontinued'] - (xbrl.fields['NetCashFlowsOperatingDiscontinued'] + xbrl.fields['NetCashFlowsInvestingDiscontinued'] + xbrl.fields['NetCashFlowsFinancingDiscontinued']);
		var lngCF4 = xbrl.fields['NetCashFlowsOperating'] - (xbrl.fields['NetCashFlowsOperatingContinuing'] + xbrl.fields['NetCashFlowsOperatingDiscontinued']);
		var lngCF5 = xbrl.fields['NetCashFlowsInvesting'] - (xbrl.fields['NetCashFlowsInvestingContinuing'] + xbrl.fields['NetCashFlowsInvestingDiscontinued']);
		var lngCF6 = xbrl.fields['NetCashFlowsFinancing'] - (xbrl.fields['NetCashFlowsFinancingContinuing'] + xbrl.fields['NetCashFlowsFinancingDiscontinued']);


		if (lngCF1) {
			console.debug("CF1: NetCashFlow(" + xbrl.fields['NetCashFlow'] + ") = (NetCashFlowsOperating(" + xbrl.fields['NetCashFlowsOperating'] + ") + (NetCashFlowsInvesting(" + xbrl.fields['NetCashFlowsInvesting'] + ") + (NetCashFlowsFinancing(" + xbrl.fields['NetCashFlowsFinancing'] + ") + ExchangeGainsLosses(" + xbrl.fields['ExchangeGainsLosses'] + "): " + lngCF1);
		}
		if (lngCF2) {
			console.debug("CF2: NetCashFlowsContinuing(" + xbrl.fields['NetCashFlowsContinuing'] + ") = NetCashFlowsOperatingContinuing(" + xbrl.fields['NetCashFlowsOperatingContinuing'] + ") + NetCashFlowsInvestingContinuing(" + xbrl.fields['NetCashFlowsInvestingContinuing'] + ") + NetCashFlowsFinancingContinuing(" + xbrl.fields['NetCashFlowsFinancingContinuing'] + "): " + lngCF2);
		}
		if (lngCF3) {
			console.debug("CF3: NetCashFlowsDiscontinued(" + xbrl.fields['NetCashFlowsDiscontinued'] + ") = NetCashFlowsOperatingDiscontinued(" + xbrl.fields['NetCashFlowsOperatingDiscontinued'] + ") + NetCashFlowsInvestingDiscontinued(" + xbrl.fields['NetCashFlowsInvestingDiscontinued'] + ") + NetCashFlowsFinancingDiscontinued(" + xbrl.fields['NetCashFlowsFinancingDiscontinued'] + "): " + lngCF3);
		}
		if (lngCF4) {
			console.debug("CF4: NetCashFlowsOperating(" + xbrl.fields['NetCashFlowsOperating'] + ") = NetCashFlowsOperatingContinuing(" + xbrl.fields['NetCashFlowsOperatingContinuing'] + ") + NetCashFlowsOperatingDiscontinued(" + xbrl.fields['NetCashFlowsOperatingDiscontinued'] + "): " + lngCF4);
		}
		if (lngCF5) {
			console.debug("CF5: NetCashFlowsInvesting(" + xbrl.fields['NetCashFlowsInvesting'] + ") = NetCashFlowsInvestingContinuing(" + xbrl.fields['NetCashFlowsInvestingContinuing'] + ") + NetCashFlowsInvestingDiscontinued(" + xbrl.fields['NetCashFlowsInvestingDiscontinued'] + "): " + lngCF5);
		}
		if (lngCF6) {
			console.debug("CF6: NetCashFlowsFinancing(" + xbrl.fields['NetCashFlowsFinancing'] + ") = NetCashFlowsFinancingContinuing(" + xbrl.fields['NetCashFlowsFinancingContinuing'] + ") + NetCashFlowsFinancingDiscontinued(" + xbrl.fields['NetCashFlowsFinancingDiscontinued'] + "): " + lngCF6);
		}

		xbrl.values.CostOfRevenue = xbrl.fields['CostOfRevenue'];
		xbrl.values.CostsAndExpenses = xbrl.fields['CostsAndExpenses'];
		xbrl.values.ComprehensiveIncome = xbrl.fields['ComprehensiveIncome'];
		xbrl.values.ComprehensiveIncomeAttributableToParent = xbrl.fields['ComprehensiveIncomeAttributableToParent'];
		xbrl.values.ComprehensiveIncomeAttributableToNoncontrollingInterest = xbrl.fields['ComprehensiveIncomeAttributableToNoncontrollingInterest'];
		xbrl.values.ExchangeGainsLosses = xbrl.fields['ExchangeGainsLosses'];
		xbrl.values.ExtraordaryItemsGainLoss = xbrl.fields['ExtraordaryItemsGainLoss'];
		xbrl.values.GrossProfit = xbrl.fields['GrossProfit'];
		xbrl.values.InterestAndDebtExpense = xbrl.fields['InterestAndDebtExpense'];
		xbrl.values.IncomeBeforeEquityMethodInvestments = xbrl.fields['IncomeBeforeEquityMethodInvestments'];
		xbrl.values.IncomeFromEquityMethodInvestments = xbrl.fields['IncomeFromEquityMethodInvestments'];
		xbrl.values.IncomeFromContinuingOperationsBeforeTax = xbrl.fields['IncomeFromContinuingOperationsBeforeTax'];
		xbrl.values.IncomeTaxExpenseBenefit = xbrl.fields['IncomeTaxExpenseBenefit'];
		xbrl.values.IncomeFromContinuingOperationsAfterTax = xbrl.fields['IncomeFromContinuingOperationsAfterTax'];
		xbrl.values.IncomeFromDiscontinuedOperations = xbrl.fields['IncomeFromDiscontinuedOperations'];
		xbrl.values.NetCashFlow = xbrl.fields['NetCashFlow'];
		xbrl.values.NetCashFlowsOperating = xbrl.fields['NetCashFlowsOperating'];
		xbrl.values.NetCashFlowsInvesting = xbrl.fields['NetCashFlowsInvesting'];
		xbrl.values.NetCashFlowsFinancing = xbrl.fields['NetCashFlowsFinancing'];
		xbrl.values.NetCashFlowsOperatingContinuing = xbrl.fields['NetCashFlowsOperatingContinuing'];
		xbrl.values.NetCashFlowsInvestingContinuing = xbrl.fields['NetCashFlowsInvestingContinuing'];
		xbrl.values.NetCashFlowsFinancingContinuing = xbrl.fields['NetCashFlowsFinancingContinuing'];
		xbrl.values.NetCashFlowsOperatingDiscontinued = xbrl.fields['NetCashFlowsOperatingDiscontinued'];
		xbrl.values.NetCashFlowsInvestingDiscontinued = xbrl.fields['NetCashFlowsInvestingDiscontinued'];
		xbrl.values.NetCashFlowsFinancingDiscontinued = xbrl.fields['NetCashFlowsFinancingDiscontinued'];
		xbrl.values.NetCashFlowsDiscontinued = xbrl.fields['NetCashFlowsDiscontinued'];
		xbrl.values.NetIncomeLoss = xbrl.fields['NetIncomeLoss'];
		xbrl.values.NetIncomeAvailableToCommonStockholdersBasic = xbrl.fields['NetIncomeAvailableToCommonStockholdersBasic'];
		xbrl.values.NetIncomeAttributableToNoncontrollingInterest = xbrl.fields['NetIncomeAttributableToNoncontrollingInterest'];
		xbrl.values.NetIncomeAttributableToParent = xbrl.fields['NetIncomeAttributableToParent'];
		xbrl.values.NetCashFlowsContinuing = xbrl.fields['NetCashFlowsContinuing'];
		xbrl.values.NonoperatingIncomeLoss = xbrl.fields['NonoperatingIncomeLoss'];
		xbrl.values.NonoperatingIncomeLossPlusInterestAndDebtExpense = xbrl.fields['NonoperatingIncomeLossPlusInterestAndDebtExpense'];
		xbrl.values.OtherComprehensiveIncome = xbrl.fields['OtherComprehensiveIncome'];
		xbrl.values.OtherOperatingIncome = xbrl.fields['OtherOperatingIncome'];
		xbrl.values.OperatingExpenses = xbrl.fields['OperatingExpenses'];
		xbrl.values.OperatingIncomeLoss = xbrl.fields['OperatingIncomeLoss'];
		xbrl.values.PreferredStockDividendsAndOtherAdjustments = xbrl.fields['PreferredStockDividendsAndOtherAdjustments'];
		xbrl.values.Revenues = xbrl.fields['Revenues'];
	}

}
