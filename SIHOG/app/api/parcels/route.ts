import { NextRequest, NextResponse } from 'next/server';
import { getParcelsAsGeoJSON, getParcelByULPIN, getParcelById, getParcelBySurveyNumber, searchParcels, getParcelsIntersectingBBox } from '@/lib/parcels/data_access';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q');
  const ulpin = searchParams.get('ulpin');
  const id = searchParams.get('id');
  const surveyNo = searchParams.get('survey_no');
  const bbox = searchParams.get('bbox');

  try {
    if (ulpin) {
      const parcel = await getParcelByULPIN(ulpin);
      return NextResponse.json({ success: true, parcel });
    }

    if (id) {
      const parcel = await getParcelById(id);
      return NextResponse.json({ success: true, parcel });
    }

    if (surveyNo) {
      const parcel = await getParcelBySurveyNumber(surveyNo);
      return NextResponse.json({ success: true, parcel });
    }

    if (q) {
      const results = await searchParcels(q);
      return NextResponse.json({ success: true, count: results.length, results });
    }

    if (bbox) {
      const coords = bbox.split(',').map(Number) as [number, number, number, number];
      if (coords.length === 4) {
        const intersecting = await getParcelsIntersectingBBox(coords);
        return NextResponse.json({ success: true, count: intersecting.length, parcels: intersecting });
      }
    }

    const geojson = await getParcelsAsGeoJSON();
    return NextResponse.json(geojson);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
