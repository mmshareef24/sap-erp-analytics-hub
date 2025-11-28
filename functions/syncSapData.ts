import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

const SAP_BASE_URL = "http://jasprd.aljazera.com:8000/sap/opu/odata/sap";

// Mapping of Base44 entities to SAP OData services
const ENTITY_MAPPING = {
  SalesOrder: {
    service: "ZGW_SALES_SRV",
    entitySet: "SalesOrdersSet",
    fieldMapping: {
      order_number: "OrderNumber",
      customer_name: "CustomerName",
      customer_code: "CustomerCode",
      order_date: "OrderDate",
      delivery_date: "DeliveryDate",
      net_value: "NetValue",
      currency: "Currency",
      status: "Status",
      sales_org: "SalesOrg",
      material_group: "MaterialGroup",
      salesperson_name: "SalespersonName",
      salesperson_code: "SalespersonCode",
      region: "Region",
      city: "City"
    }
  },
  SalesInvoice: {
    service: "ZGW_SALES_SRV",
    entitySet: "SalesInvoicesSet",
    fieldMapping: {
      invoice_number: "InvoiceNumber",
      order_number: "OrderNumber",
      customer_name: "CustomerName",
      customer_code: "CustomerCode",
      invoice_date: "InvoiceDate",
      due_date: "DueDate",
      gross_amount: "GrossAmount",
      tax_amount: "TaxAmount",
      net_amount: "NetAmount",
      currency: "Currency",
      status: "Status",
      salesperson_name: "SalespersonName",
      region: "Region",
      payment_terms: "PaymentTerms"
    }
  },
  PurchaseOrder: {
    service: "ZGW_PURCHASE_SRV",
    entitySet: "PurchaseOrdersSet",
    fieldMapping: {
      po_number: "PONumber",
      vendor_name: "VendorName",
      vendor_code: "VendorCode",
      po_date: "PODate",
      delivery_date: "DeliveryDate",
      net_value: "NetValue",
      currency: "Currency",
      status: "Status",
      purchasing_org: "PurchasingOrg",
      material_group: "MaterialGroup"
    }
  },
  VendorInvoice: {
    service: "ZGW_PURCHASE_SRV",
    entitySet: "VendorInvoicesSet",
    fieldMapping: {
      invoice_number: "InvoiceNumber",
      vendor_name: "VendorName",
      vendor_code: "VendorCode",
      invoice_date: "InvoiceDate",
      due_date: "DueDate",
      gross_amount: "GrossAmount",
      tax_amount: "TaxAmount",
      net_amount: "NetAmount",
      currency: "Currency",
      status: "Status",
      po_reference: "POReference"
    }
  },
  Inventory: {
    service: "ZGW_INVENTORY_SRV",
    entitySet: "InventorySet",
    fieldMapping: {
      material_number: "MaterialNumber",
      material_description: "MaterialDescription",
      plant: "Plant",
      storage_location: "StorageLocation",
      quantity_on_hand: "QuantityOnHand",
      unit_of_measure: "UnitOfMeasure",
      value: "Value",
      currency: "Currency",
      material_group: "MaterialGroup",
      reorder_point: "ReorderPoint",
      safety_stock: "SafetyStock"
    }
  },
  FinancialEntry: {
    service: "ZGW_FINANCE_SRV",
    entitySet: "FinancialEntriesSet",
    fieldMapping: {
      document_number: "DocumentNumber",
      company_code: "CompanyCode",
      fiscal_year: "FiscalYear",
      posting_date: "PostingDate",
      document_type: "DocumentType",
      gl_account: "GLAccount",
      gl_account_name: "GLAccountName",
      debit_amount: "DebitAmount",
      credit_amount: "CreditAmount",
      currency: "Currency",
      cost_center: "CostCenter",
      profit_center: "ProfitCenter"
    }
  },
  ProductionOrder: {
    service: "ZGW_PRODUCTION_SRV",
    entitySet: "ProductionOrdersSet",
    fieldMapping: {
      order_number: "OrderNumber",
      material_number: "MaterialNumber",
      material_description: "MaterialDescription",
      plant: "Plant",
      order_type: "OrderType",
      planned_quantity: "PlannedQuantity",
      confirmed_quantity: "ConfirmedQuantity",
      unit_of_measure: "UnitOfMeasure",
      start_date: "StartDate",
      end_date: "EndDate",
      status: "Status",
      work_center: "WorkCenter"
    }
  },
  Shipment: {
    service: "ZGW_LOGISTICS_SRV",
    entitySet: "ShipmentsSet",
    fieldMapping: {
      shipment_number: "ShipmentNumber",
      type: "Type",
      origin: "Origin",
      destination: "Destination",
      carrier: "Carrier",
      ship_date: "ShipDate",
      expected_delivery: "ExpectedDelivery",
      actual_delivery: "ActualDelivery",
      status: "Status",
      reference_type: "ReferenceType",
      reference_number: "ReferenceNumber",
      weight: "Weight",
      volume: "Volume",
      freight_cost: "FreightCost",
      currency: "Currency"
    }
  },
  Supplier: {
    service: "ZGW_LOGISTICS_SRV",
    entitySet: "SuppliersSet",
    fieldMapping: {
      supplier_code: "SupplierCode",
      name: "Name",
      category: "Category",
      country: "Country",
      city: "City",
      contact_person: "ContactPerson",
      email: "Email",
      phone: "Phone",
      lead_time_days: "LeadTimeDays",
      rating: "Rating",
      status: "Status",
      payment_terms: "PaymentTerms",
      total_spend: "TotalSpend"
    }
  }
};

// Transform SAP data to Base44 entity format
function transformSapData(sapData, fieldMapping) {
  const reverseMapping = {};
  for (const [base44Field, sapField] of Object.entries(fieldMapping)) {
    reverseMapping[sapField] = base44Field;
  }

  return sapData.map(item => {
    const transformed = {};
    for (const [sapField, value] of Object.entries(item)) {
      const base44Field = reverseMapping[sapField];
      if (base44Field) {
        transformed[base44Field] = value;
      }
    }
    return transformed;
  });
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { entity, clearExisting } = await req.json();

    if (!entity) {
      return Response.json({ 
        error: 'Entity parameter is required',
        availableEntities: Object.keys(ENTITY_MAPPING)
      }, { status: 400 });
    }

    const entityConfig = ENTITY_MAPPING[entity];
    if (!entityConfig) {
      return Response.json({ 
        error: `Unknown entity: ${entity}. Available entities: ${Object.keys(ENTITY_MAPPING).join(', ')}` 
      }, { status: 400 });
    }

    // Get SAP credentials
    const username = Deno.env.get("SAP_ODATA_USERNAME");
    const password = Deno.env.get("SAP_ODATA_PASSWORD");

    if (!username || !password) {
      return Response.json({ error: 'SAP credentials not configured' }, { status: 500 });
    }

    // Fetch data from SAP OData
    const url = `${SAP_BASE_URL}/${entityConfig.service}/${entityConfig.entitySet}?$format=json`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': 'Basic ' + btoa(`${username}:${password}`),
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      return Response.json({ 
        error: `SAP OData request failed: ${response.status}`,
        details: errorText
      }, { status: response.status });
    }

    const data = await response.json();
    const sapResults = data?.d?.results || data?.d || [];

    if (!Array.isArray(sapResults) || sapResults.length === 0) {
      return Response.json({ 
        success: true,
        message: 'No data returned from SAP',
        synced: 0
      });
    }

    // Transform SAP data to Base44 format
    const transformedData = transformSapData(sapResults, entityConfig.fieldMapping);

    // Optionally clear existing data
    if (clearExisting) {
      const existingRecords = await base44.asServiceRole.entities[entity].list();
      for (const record of existingRecords) {
        await base44.asServiceRole.entities[entity].delete(record.id);
      }
    }

    // Bulk create records in Base44
    await base44.asServiceRole.entities[entity].bulkCreate(transformedData);

    return Response.json({ 
      success: true,
      entity,
      synced: transformedData.length,
      message: `Successfully synced ${transformedData.length} ${entity} records from SAP`
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});