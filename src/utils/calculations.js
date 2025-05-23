// Financial calculations for the Pro Forma app - Professional Grade

/**
 * Waterfall Distribution Configuration
 */
export const DEFAULT_WATERFALL = {
  enabled: true,
  preferredReturn: 8, // 8% annual preferred return
  catchUpPercent: 50, // 50% catch-up to GP (0-100% configurable)
  promoteTiers: [
    { hurdle: 12, lpSplit: 80, gpSplit: 20 }, // After 12% IRR: 80/20
    { hurdle: 18, lpSplit: 70, gpSplit: 30 }, // After 18% IRR: 70/30
    { hurdle: 25, lpSplit: 60, gpSplit: 40 }, // After 25% IRR: 60/40
  ],
  gpContribution: 10, // GP contributes 10% of equity
};

/**
 * Main calculation function
 */
export function calculateProForma(projectData, selectedType, waterfallConfig = DEFAULT_WATERFALL) {
  // Basic property metrics
  const rentableSF = projectData.grossSquareFeet * (projectData.rentablePercent / 100);
  const useableSF = projectData.grossSquareFeet * (projectData.useablePercent / 100);
  const siteAreaSF = projectData.landAcres * 43560;
  const siteLessBuildingSF = siteAreaSF - projectData.grossSquareFeet;
  
  // Calculate total TI from tenants
  const totalTI = selectedType?.id === 'office' 
    ? projectData.grossSquareFeet * projectData.officeTIPerSF
    : projectData.tenants.reduce((sum, tenant) => sum + (tenant.sqft * tenant.tiPerSF), 0);
  
  // Land cost calculations
  const landCost = projectData.landCostType === 'perAcre' 
    ? projectData.landAcres * projectData.landCostPerAcre
    : projectData.landCostType === 'total' 
    ? projectData.landCostTotal
    : siteAreaSF * projectData.landCostPerSF;
  
  // Construction costs
  const shellCost = projectData.grossSquareFeet * projectData.constructionShellPerSF;
  const siteCost = selectedType?.id === 'office'
    ? projectData.grossSquareFeet * projectData.constructionSitePerSF
    : siteLessBuildingSF * projectData.constructionSitePerSF;
  const hardCosts = shellCost + siteCost + totalTI;
  
  // Soft costs
  const architecturalFee = projectData.architecturalCostType === 'percent' 
    ? hardCosts * (projectData.architecturalPercent / 100)
    : projectData.architecturalDollar;
  
  const contingency = hardCosts * (projectData.contingencyPercent / 100);
  const totalProjectCost = landCost + hardCosts + architecturalFee + contingency + 
                          projectData.softCostsOther + (projectData.developmentFee || 0);
  
  // Construction financing
  const constructionLoanAmount = totalProjectCost * (projectData.constructionLoanLTC / 100);
  const constructionInterest = constructionLoanAmount * (projectData.constructionLoanRate / 100) * 
                               (projectData.constructionLoanTerm / 12) * 0.5;
  const totalProjectCostWithInterest = totalProjectCost + constructionInterest;
  
  // Income calculations
  const annualRent = selectedType?.id === 'office'
    ? rentableSF * projectData.officeRentPerSF
    : projectData.tenants.reduce((sum, tenant) => sum + (tenant.sqft * tenant.rentPerSF), 0);
  
  // Year 1 operations with enhanced expense breakdown
  const vacancyLoss = annualRent * (projectData.vacancyRate / 100);
  const effectiveGrossIncome = annualRent - vacancyLoss;
  
  // Enhanced operating expenses with property tax separate
  const propertyTaxPerSF = projectData.propertyTaxPerSF || 2.50; // Default $2.50/SF
  const propertyTax = rentableSF * propertyTaxPerSF;
  const managementFee = effectiveGrossIncome * (projectData.managementFeePercent / 100);
  const operatingExpenses = rentableSF * projectData.operatingExpensesPerSF;
  const insurance = rentableSF * projectData.insurancePerSF;
  const totalExpenses = managementFee + operatingExpenses + insurance + propertyTax;
  
  const noi = effectiveGrossIncome - totalExpenses;
  
  // Reserves
  const leasingReserve = annualRent * (projectData.leasingReservePercent / 100);
  const capexReserve = annualRent * (projectData.capexReservePercent / 100);
  const totalReserves = leasingReserve + capexReserve;
  
  // Stabilized value & returns
  const stabilizedValue = noi / (projectData.goingInCapRate / 100);
  const valueCreation = stabilizedValue - totalProjectCostWithInterest;
  const developmentMargin = (valueCreation / totalProjectCostWithInterest) * 100;
  
  // Permanent financing
  const maxRefinanceAmount = stabilizedValue * (projectData.permanentLoanLTV / 100);
  const cashOutPotential = maxRefinanceAmount - constructionLoanAmount - constructionInterest;
  const equityReturnAtStabilization = Math.max(0, cashOutPotential);
  const equityRequired = totalProjectCostWithInterest - constructionLoanAmount;
  
  // Debt metrics
  const monthlyRate = projectData.permanentLoanRate / 100 / 12;
  const numPayments = projectData.amortizationYears * 12;
  const monthlyPayment = maxRefinanceAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
                         (Math.pow(1 + monthlyRate, numPayments) - 1);
  const annualDebtService = monthlyPayment * 12;
  
  // Key metrics
  const cashFlowBeforeDebt = noi - totalReserves;
  const cashFlowAfterDebt = cashFlowBeforeDebt - annualDebtService;
  const dscr = cashFlowBeforeDebt / annualDebtService;
  const debtYield = noi / maxRefinanceAmount; // New debt yield metric
  const yieldOnCost = noi / totalProjectCost;
  
  // Calculate detailed projections with waterfall
  const projections = calculateDetailedProjections(
    projectData,
    annualRent,
    totalExpenses,
    propertyTax,
    annualDebtService,
    maxRefinanceAmount,
    monthlyRate
  );
  
  // Calculate IRR/NPV and waterfall distributions
  const cashFlows = prepareCashFlows(projections, equityRequired, equityReturnAtStabilization);
  const irrMetrics = calculateIRR(cashFlows);
  const waterfallResults = waterfallConfig.enabled 
    ? calculateWaterfall(cashFlows, waterfallConfig, equityRequired)
    : null;
  
  // Exit analysis
  const exitAnalysis = calculateExitAnalysis(projections, projectData.exitCapRate);
  
  return {
    // Basic metrics
    rentableSF,
    useableSF,
    siteAreaSF: Math.round(siteAreaSF),
    siteLessBuildingSF: Math.round(siteLessBuildingSF),
    totalTenantSF: projectData.tenants?.reduce((sum, t) => sum + t.sqft, 0) || 0,
    
    // Costs
    landCost: Math.round(landCost),
    shellCost: Math.round(shellCost),
    siteCost: Math.round(siteCost),
    totalTI: Math.round(totalTI),
    hardCosts: Math.round(hardCosts),
    architecturalFee: Math.round(architecturalFee),
    contingency: Math.round(contingency),
    developmentFee: Math.round(projectData.developmentFee || 0),
    totalProjectCost: Math.round(totalProjectCost),
    totalProjectCostWithInterest: Math.round(totalProjectCostWithInterest),
    
    // Financing
    constructionLoanAmount: Math.round(constructionLoanAmount),
    constructionInterest: Math.round(constructionInterest),
    permanentLoanAmount: Math.round(maxRefinanceAmount),
    equityRequired: Math.round(equityRequired),
    equityReturnAtStabilization: Math.round(equityReturnAtStabilization),
    
    // Income & expenses
    annualRent: Math.round(annualRent),
    vacancyLoss: Math.round(vacancyLoss),
    effectiveGrossIncome: Math.round(effectiveGrossIncome),
    totalExpenses: Math.round(totalExpenses),
    propertyTax: Math.round(propertyTax),
    managementFee: Math.round(managementFee),
    operatingExpenses: Math.round(operatingExpenses),
    insurance: Math.round(insurance),
    noi: Math.round(noi),
    
    // Debt & returns
    annualDebtService: Math.round(annualDebtService),
    cashFlowAfterDebt: Math.round(cashFlowAfterDebt),
    dscr: dscr.toFixed(2),
    debtYield: (debtYield * 100).toFixed(2) + '%',
    cashOnCash: ((cashFlowAfterDebt / (equityRequired - equityReturnAtStabilization)) * 100).toFixed(1) + '%',
    yieldOnCost: (yieldOnCost * 100).toFixed(1) + '%',
    goingInCapRate: projectData.goingInCapRate.toFixed(1) + '%',
    
    // Value creation
    stabilizedValue: Math.round(stabilizedValue),
    valueCreation: Math.round(valueCreation),
    developmentMargin: developmentMargin.toFixed(1) + '%',
    
    // IRR/NPV metrics
    projectIRR: irrMetrics.projectIRR,
    equityIRR: irrMetrics.equityIRR,
    equityMultiple: irrMetrics.equityMultiple,
    
    // Waterfall results
    waterfallResults,
    
    // Detailed projections
    projections,
    exitAnalysis,
    
    // Other
    leasingReserve: Math.round(leasingReserve),
    totalReserves: Math.round(totalReserves),
  };
}

/**
 * Calculate detailed projections including monthly cash flows
 */
function calculateDetailedProjections(projectData, initialRent, initialExpenses, propertyTax, annualDebtService, loanAmount, monthlyRate) {
  const projections = [];
  let currentRent = initialRent;
  let currentExpenses = initialExpenses - propertyTax; // Separate property tax
  let currentPropertyTax = propertyTax;
  let loanBalance = loanAmount;
  
  // Property tax growth rate (often different from expense growth)
  const propertyTaxGrowthRate = projectData.propertyTaxGrowthRate || 2.0;
  
  // Construction period
  const constructionYears = Math.ceil(projectData.constructionLoanTerm / 12);
  for (let year = 1; year <= constructionYears; year++) {
    projections.push({
      year: `Construction Yr ${year}`,
      revenue: 0,
      vacancy: 0,
      effectiveIncome: 0,
      expenses: 0,
      propertyTax: 0,
      totalExpenses: 0,
      noi: 0,
      leasingReserve: 0,
      capex: 0,
      totalReserves: 0,
      debtService: 0,
      cashFlow: 0,
      principal: 0,
      interest: 0,
      loanBalance: 0,
      isConstruction: true
    });
  }
  
  // Operating years
  for (let year = 1; year <= projectData.holdYears; year++) {
    if (year > 1) {
      currentRent *= (1 + projectData.rentGrowthRate / 100);
      currentExpenses *= (1 + projectData.expenseGrowthRate / 100);
      currentPropertyTax *= (1 + propertyTaxGrowthRate / 100);
    }
    
    const yearVacancy = currentRent * (projectData.vacancyRate / 100);
    const yearEGI = currentRent - yearVacancy;
    const yearTotalExpenses = currentExpenses + currentPropertyTax;
    const yearNOI = yearEGI - yearTotalExpenses;
    
    // Reserves
    const yearLeasingReserve = currentRent * (projectData.leasingReservePercent / 100);
    const yearCapex = currentRent * (projectData.capexReservePercent / 100);
    const yearTotalReserves = yearLeasingReserve + yearCapex;
    
    const yearCashFlowBeforeDebt = yearNOI - yearTotalReserves;
    const yearCashFlow = yearCashFlowBeforeDebt - annualDebtService;
    
    // Calculate principal payment
    let yearInterest = 0;
    let yearPrincipal = 0;
    let tempBalance = loanBalance;
    const monthlyPayment = annualDebtService / 12;
    
    for (let month = 0; month < 12; month++) {
      const monthInterest = tempBalance * monthlyRate;
      const monthPrincipal = monthlyPayment - monthInterest;
      yearInterest += monthInterest;
      yearPrincipal += monthPrincipal;
      tempBalance -= monthPrincipal;
    }
    loanBalance = tempBalance;
    
    projections.push({
      year: `Year ${year}`,
      revenue: Math.round(currentRent),
      vacancy: Math.round(yearVacancy),
      effectiveIncome: Math.round(yearEGI),
      expenses: Math.round(currentExpenses),
      propertyTax: Math.round(currentPropertyTax),
      totalExpenses: Math.round(yearTotalExpenses),
      noi: Math.round(yearNOI),
      leasingReserve: Math.round(yearLeasingReserve),
      capex: Math.round(yearCapex),
      totalReserves: Math.round(yearTotalReserves),
      debtService: Math.round(annualDebtService),
      cashFlow: Math.round(yearCashFlow),
      principal: Math.round(yearPrincipal),
      interest: Math.round(yearInterest),
      loanBalance: Math.round(loanBalance),
      isConstruction: false
    });
  }
  
  return projections;
}

/**
 * Calculate exit/sale analysis
 */
function calculateExitAnalysis(projections, exitCapRate) {
  const operatingYears = projections.filter(p => !p.isConstruction);
  const exitNOI = operatingYears[operatingYears.length - 1].noi;
  const grossSalePrice = exitNOI / (exitCapRate / 100);
  const sellingCosts = grossSalePrice * 0.02; // 2% selling costs
  const netSalePrice = grossSalePrice - sellingCosts;
  const loanPayoff = operatingYears[operatingYears.length - 1].loanBalance;
  const netSaleProceeds = netSalePrice - loanPayoff;
  
  return {
    year: 'Sale',
    exitNOI: Math.round(exitNOI),
    exitCapRate: exitCapRate.toFixed(2) + '%',
    salePrice: Math.round(grossSalePrice),
    sellingCosts: Math.round(sellingCosts),
    loanPayoff: Math.round(loanPayoff),
    netProceeds: Math.round(netSaleProceeds)
  };
}

/**
 * Prepare cash flows for IRR calculation
 */
function prepareCashFlows(projections, initialEquity, equityReturn) {
  const cashFlows = [];
  
  // Initial investment (negative)
  cashFlows.push({
    period: 0,
    amount: -(initialEquity),
    type: 'investment'
  });
  
  // Equity return at stabilization (if any)
  if (equityReturn > 0) {
    cashFlows.push({
      period: Math.ceil(projections.find(p => p.isConstruction)?.year.match(/\d+/)?.[0] || 1),
      amount: equityReturn,
      type: 'refinance'
    });
  }
  
  // Operating cash flows
  let period = 0;
  projections.forEach(proj => {
    if (!proj.isConstruction) {
      period++;
      cashFlows.push({
        period: period + Math.ceil(projections.filter(p => p.isConstruction).length),
        amount: proj.cashFlow,
        type: 'operations'
      });
    }
  });
  
  return cashFlows;
}

/**
 * Calculate IRR using Newton's method
 */
function calculateIRR(cashFlows) {
  const amounts = cashFlows.map(cf => cf.amount);
  const periods = cashFlows.map(cf => cf.period);
  
  // Newton's method for IRR
  let rate = 0.1; // Initial guess 10%
  const maxIterations = 100;
  const tolerance = 0.00001;
  
  for (let i = 0; i < maxIterations; i++) {
    let npv = 0;
    let dnpv = 0;
    
    for (let j = 0; j < amounts.length; j++) {
      const pv = amounts[j] / Math.pow(1 + rate, periods[j]);
      npv += pv;
      dnpv -= periods[j] * pv / (1 + rate);
    }
    
    const newRate = rate - npv / dnpv;
    
    if (Math.abs(newRate - rate) < tolerance) {
      rate = newRate;
      break;
    }
    
    rate = newRate;
  }
  
  // Calculate equity multiple
  const totalInflows = cashFlows.filter(cf => cf.amount > 0).reduce((sum, cf) => sum + cf.amount, 0);
  const totalOutflows = Math.abs(cashFlows.filter(cf => cf.amount < 0).reduce((sum, cf) => sum + cf.amount, 0));
  const equityMultiple = totalInflows / totalOutflows;
  
  return {
    equityIRR: (rate * 100).toFixed(2) + '%',
    projectIRR: 'Calculating...', // Would need unlevered cash flows
    equityMultiple: equityMultiple.toFixed(2) + 'x',
    totalInflows: Math.round(totalInflows),
    totalOutflows: Math.round(totalOutflows)
  };
}

/**
 * Calculate waterfall distributions
 */
function calculateWaterfall(cashFlows, config, totalEquity) {
  const lpShare = (100 - config.gpContribution) / 100;
  const gpShare = config.gpContribution / 100;
  const lpInvestment = totalEquity * lpShare;
  const gpInvestment = totalEquity * gpShare;
  
  let lpCapitalReturned = 0;
  let gpCapitalReturned = 0;
  let lpPrefAccrued = 0;
  let gpPrefAccrued = 0;
  let lpDistributions = [];
  let gpDistributions = [];
  
  // Process each cash flow
  cashFlows.forEach((cf, index) => {
    if (cf.amount > 0) {
      let remainingCash = cf.amount;
      let lpAmount = 0;
      let gpAmount = 0;
      
      // Step 1: Return of capital
      if (lpCapitalReturned < lpInvestment) {
        const lpReturn = Math.min(remainingCash * lpShare, lpInvestment - lpCapitalReturned);
        lpCapitalReturned += lpReturn;
        lpAmount += lpReturn;
        remainingCash -= lpReturn;
      }
      
      if (gpCapitalReturned < gpInvestment && remainingCash > 0) {
        const gpReturn = Math.min(remainingCash * gpShare, gpInvestment - gpCapitalReturned);
        gpCapitalReturned += gpReturn;
        gpAmount += gpReturn;
        remainingCash -= gpReturn;
      }
      
      // Step 2: Preferred return
      if (remainingCash > 0) {
        // Calculate accrued preferred return
        lpPrefAccrued = lpInvestment * config.preferredReturn / 100 * cf.period;
        gpPrefAccrued = gpInvestment * config.preferredReturn / 100 * cf.period;
        
        const lpPref = Math.min(remainingCash * lpShare, lpPrefAccrued);
        lpAmount += lpPref;
        remainingCash -= lpPref;
        
        if (remainingCash > 0) {
          const gpPref = Math.min(remainingCash * gpShare, gpPrefAccrued);
          gpAmount += gpPref;
          remainingCash -= gpPref;
        }
      }
      
      // Step 3: GP Catch-up
      if (remainingCash > 0 && config.catchUpPercent > 0) {
        const catchUpAmount = remainingCash * (config.catchUpPercent / 100);
        gpAmount += catchUpAmount;
        remainingCash -= catchUpAmount;
      }
      
      // Step 4: Promote splits
      if (remainingCash > 0) {
        // Determine which tier we're in based on IRR
        // This is simplified - would need iterative IRR calc in practice
        const currentTier = config.promoteTiers[0]; // Use first tier for now
        
        lpAmount += remainingCash * (currentTier.lpSplit / 100);
        gpAmount += remainingCash * (currentTier.gpSplit / 100);
      }
      
      lpDistributions.push({
        period: cf.period,
        amount: Math.round(lpAmount),
        cumulative: lpDistributions.reduce((sum, d) => sum + d.amount, 0) + lpAmount
      });
      
      gpDistributions.push({
        period: cf.period,
        amount: Math.round(gpAmount),
        cumulative: gpDistributions.reduce((sum, d) => sum + d.amount, 0) + gpAmount
      });
    }
  });
  
  // Calculate final metrics
  const lpTotalDistributions = lpDistributions.reduce((sum, d) => sum + d.amount, 0);
  const gpTotalDistributions = gpDistributions.reduce((sum, d) => sum + d.amount, 0);
  
  return {
    lpInvestment: Math.round(lpInvestment),
    gpInvestment: Math.round(gpInvestment),
    lpDistributions,
    gpDistributions,
    lpTotalReturn: Math.round(lpTotalDistributions),
    gpTotalReturn: Math.round(gpTotalDistributions),
    lpMultiple: (lpTotalDistributions / lpInvestment).toFixed(2) + 'x',
    gpMultiple: (gpTotalDistributions / gpInvestment).toFixed(2) + 'x',
    totalDistributions: Math.round(lpTotalDistributions + gpTotalDistributions)
  };
}

/**
 * Validation functions
 */
export function validateInputs(projectData, selectedType) {
  const warnings = [];
  
  // DSCR check
  const calc = calculateProForma(projectData, selectedType);
  if (parseFloat(calc.dscr) < 1.25) {
    warnings.push({
      type: 'warning',
      field: 'dscr',
      message: `DSCR of ${calc.dscr} is below typical lender requirement of 1.25x`
    });
  }
  
  // Debt yield check
  const debtYield = parseFloat(calc.debtYield);
  if (debtYield < 8.0) {
    warnings.push({
      type: 'warning',
      field: 'debtYield',
      message: `Debt yield of ${calc.debtYield} is below typical lender requirement of 8.0%`
    });
  }
  
  // Development margin check
  if (parseFloat(calc.developmentMargin) < 15) {
    warnings.push({
      type: 'info',
      field: 'developmentMargin',
      message: `Development margin of ${calc.developmentMargin} is below typical target of 15-25%`
    });
  }
  
  return warnings;
}

/**
 * Sensitivity analysis functions
 */
export function runSensitivityAnalysis(baseProjectData, selectedType, variables) {
  const results = [];
  const baseCalc = calculateProForma(baseProjectData, selectedType);
  
  variables.forEach(variable => {
    const sensitivityResults = [];
    
    variable.ranges.forEach(adjustment => {
      const adjustedData = { ...baseProjectData };
      adjustedData[variable.field] = baseProjectData[variable.field] * (1 + adjustment / 100);
      
      const calc = calculateProForma(adjustedData, selectedType);
      
      sensitivityResults.push({
        adjustment: adjustment + '%',
        value: adjustedData[variable.field],
        equityIRR: calc.equityIRR,
        developmentMargin: calc.developmentMargin,
        dscr: calc.dscr
      });
    });
    
    results.push({
      variable: variable.name,
      field: variable.field,
      results: sensitivityResults
    });
  });
  
  return results;
}