// Default property data configurations

export const defaultRetailData = {
  name: 'Retail Center',
  grossSquareFeet: 9000,
  rentablePercent: 100,
  useablePercent: 100,
  developmentFee: 0,
  constructionShellPerSF: 130,
  constructionLoanLTC: 70,
  constructionLoanRate: 9.5,
  permanentLoanLTV: 75,
  permanentLoanRate: 7.5,
  vacancyRate: 5,
  managementFeePercent: 3,
  operatingExpensesPerSF: 5.50,
  insurancePerSF: 0.25,
  leasingReservePercent: 0,
  capexReservePercent: 2,
  goingInCapRate: 7.0,
  exitCapRate: 7.5,
  tenants: [
    { name: 'Suite 1', sqft: 2800, rentPerSF: 47, tiPerSF: 35 },
    { name: 'Suite 2', sqft: 1200, rentPerSF: 47, tiPerSF: 35 },
    { name: 'Suite 3', sqft: 2500, rentPerSF: 45, tiPerSF: 35 },
    { name: 'Suite 4', sqft: 2500, rentPerSF: 45, tiPerSF: 35 }
  ]
};

export const defaultOfficeData = {
  name: 'Office Building',
  grossSquareFeet: 12000,
  rentablePercent: 97.5,
  useablePercent: 90,
  basementSF: 0,
  landAcres: 2.33,
  landCostPerAcre: 367596,
  constructionShellPerSF: 72,
  constructionSitePerSF: 56.245,
  architecturalPercent: 4.5,
  developmentFee: 75000,
  softCostsOther: 200000,
  officeRentPerSF: 18.50,
  officeTIPerSF: 60,
  constructionLoanLTC: 90,
  constructionLoanRate: 6.25,
  permanentLoanLTV: 90,
  permanentLoanRate: 5.25,
  vacancyRate: 3,
  managementFeePercent: 0,
  operatingExpensesPerSF: 0,
  insurancePerSF: 0,
  leasingReservePercent: 3,
  capexReservePercent: 1.5,
  goingInCapRate: 7.5,
  exitCapRate: 7.5
};