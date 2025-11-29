import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

const SAP_BASE_URL = "http://jasprd.aljazera.com:8000/sap/opu/odata";

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { service, entitySet, filters, top, skip } = await req.json();

        if (!service || !entitySet) {
            return Response.json({ 
                error: 'Missing required parameters: service and entitySet' 
            }, { status: 400 });
        }

        const username = Deno.env.get("SAP_ODATA_USERNAME");
        const password = Deno.env.get("SAP_ODATA_PASSWORD");

        if (!username || !password) {
            return Response.json({ 
                error: 'SAP credentials not configured' 
            }, { status: 500 });
        }

        // Build OData URL
        let url = `${SAP_BASE_URL}/${service}/${entitySet}?$format=json`;

        if (filters) {
            url += `&$filter=${encodeURIComponent(filters)}`;
        }
        if (top) {
            url += `&$top=${top}`;
        }
        if (skip) {
            url += `&$skip=${skip}`;
        }

        // Create Basic Auth header
        const authHeader = "Basic " + btoa(`${username}:${password}`);

        const response = await fetch(url, {
            method: "GET",
            headers: {
                "Authorization": authHeader,
                "Accept": "application/json",
                "Content-Type": "application/json"
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

        return Response.json({
            success: true,
            data: data.d?.results || data.d || data
        });

    } catch (error) {
        return Response.json({ 
            error: error.message 
        }, { status: 500 });
    }
});