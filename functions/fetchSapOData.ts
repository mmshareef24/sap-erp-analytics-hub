import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

const SAP_BASE_URL = "http://jasprd.aljazera.com:8000/sap/opu/odata/sap";

// Map of service names to their OData endpoints
const SAP_SERVICES = {
  // Purchase Module
  VendorInvoices: { service: "ZGW_PURCHASE_SRV", entitySet: "VendorInvoicesSet" },
  PurchaseOrders: { service: "ZGW_PURCHASE_SRV", entitySet: "PurchaseOrdersSet" },
  
  // Sales Module
  SalesOrders: { service: "ZGW_SALES_SRV", entitySet: "SalesOrdersSet" },
  SalesInvoices: { service: "ZGW_SALES_SRV", entitySet: "SalesInvoicesSet" },
  SalesOrderItems: { service: "ZGW_SALES_SRV", entitySet: "SalesOrderItemsSet" },
  
  // Inventory Module
  Inventory: { service: "ZGW_INVENTORY_SRV", entitySet: "InventorySet" },
  
  // Finance Module
  FinancialEntries: { service: "ZGW_FINANCE_SRV", entitySet: "FinancialEntriesSet" },
  
  // Production Module
  ProductionOrders: { service: "ZGW_PRODUCTION_SRV", entitySet: "ProductionOrdersSet" },
  
  // Supply Chain / Logistics
  Shipments: { service: "ZGW_LOGISTICS_SRV", entitySet: "ShipmentsSet" },
  Suppliers: { service: "ZGW_LOGISTICS_SRV", entitySet: "SuppliersSet" }
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { module, filters, top, skip } = await req.json();

    if (!module) {
      return Response.json({ error: 'Module parameter is required' }, { status: 400 });
    }

    const serviceConfig = SAP_SERVICES[module];
    if (!serviceConfig) {
      return Response.json({ 
        error: `Unknown module: ${module}. Available modules: ${Object.keys(SAP_SERVICES).join(', ')}` 
      }, { status: 400 });
    }

    // Get SAP credentials from environment
    const username = Deno.env.get("SAP_ODATA_USERNAME");
    const password = Deno.env.get("SAP_ODATA_PASSWORD");

    if (!username || !password) {
      return Response.json({ error: 'SAP credentials not configured' }, { status: 500 });
    }

    // Build OData URL with query options
    let url = `${SAP_BASE_URL}/${serviceConfig.service}/${serviceConfig.entitySet}?$format=json`;

    // Add OData query options
    if (top) url += `&$top=${top}`;
    if (skip) url += `&$skip=${skip}`;
    if (filters) url += `&$filter=${encodeURIComponent(filters)}`;

    // Make request to SAP OData service
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': 'Basic ' + btoa(`${username}:${password}`),
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      return Response.json({ 
        error: `SAP OData request failed: ${response.status} ${response.statusText}`,
        details: errorText
      }, { status: response.status });
    }

    const data = await response.json();
    
    // OData response structure: { d: { results: [...] } }
    const results = data?.d?.results || data?.d || [];

    return Response.json({ 
      success: true,
      module,
      count: Array.isArray(results) ? results.length : 1,
      data: results 
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});