import { NextRequest, NextResponse } from 'next/server';
import { getServerApi } from '@/lib/server-api';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ success: false, message: 'Order ID is required' }, { status: 400 });
  }

  const data = await getServerApi(`/api/v1/orders/${id}`);
  const httpStatus = data?.success === false ? (data?.status ?? 400) : 200;

  return NextResponse.json(data, { status: httpStatus });
}
