import { NextRequest, NextResponse } from 'next/server';
import { getParcelsIntersectingGeometry, getParcelsIntersectingBBox } from '@/lib/parcels/data_access';
import { Polygon } from 'geojson';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const startTime = performance.now();

    let matchingParcels: any[] = [];
    let queryType = body.type || 'ST_Intersects';

    if (body.geometry) {
      matchingParcels = await getParcelsIntersectingGeometry(body.geometry as Polygon);
    } else if (body.bbox) {
      matchingParcels = await getParcelsIntersectingBBox(body.bbox);
    } else {
      return NextResponse.json({ success: false, error: "Missing 'geometry' or 'bbox' in request body." }, { status: 400 });
    }

    const executionTimeMs = Number((performance.now() - startTime).toFixed(2));

    return NextResponse.json({
      success: true,
      queryType,
      postgisFunction: 'ST_Intersects()',
      count: matchingParcels.length,
      executionTimeMs,
      parcels: matchingParcels
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
