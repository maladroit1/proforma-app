// Financial calculations for the Pro Forma app

export function calculateProForma(projectData, selectedType) {
  const rentableSF = projectData.grossSquareFeet * (projectData.rentablePercent / 100);
  const useableSF = projectData.grossSquareFeet * (projectData.useablePercent / 100);
  const siteAreaSF = projectData.landAcres * 43560;
  const siteLessBuildingSF = siteAreaSF - projectData.grossSquareFeet;
  
  // Calculate total TI from tenants
  const totalTI = selectedType?.id === 'office' 
    ? projectData.grossSquareFeet * projectData.officeTIPerSF
    : projectData.tenants.reduce((sum, tenant) => sum + (tenant.sqft * tenant.tiPerSF), 0);
  
  // ... rest of calculations
  // (This would include all the calculation logic from your original code)
  
  return {
    rentableSF,
    useableSF,
    siteAreaSF,
    totalTI,
    // ... all other calculated values
  };
}