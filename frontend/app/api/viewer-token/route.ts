import { NextResponse } from 'next/server';
import { AccessToken, type AccessTokenOptions, type VideoGrant } from 'livekit-server-sdk';

// Mints a read-only token so the dashboard can join an existing call's LiveKit
// room as a silent observer (subscribe-only, no publishing, no agent dispatch).
// The room is created by the backend's call dispatch; we only watch it.

const API_KEY = process.env.LIVEKIT_API_KEY;
const API_SECRET = process.env.LIVEKIT_API_SECRET;
const LIVEKIT_URL = process.env.LIVEKIT_URL;

export const revalidate = 0;

type ConnectionDetails = {
  serverUrl: string;
  roomName: string;
  participantName: string;
  participantToken: string;
};

export async function POST(req: Request) {
  try {
    if (!LIVEKIT_URL || !API_KEY || !API_SECRET) {
      throw new Error('LiveKit environment variables are not configured');
    }

    const body = await req.json().catch(() => ({}));
    const roomName: string | undefined = body?.room_name;
    if (!roomName) {
      return new NextResponse('room_name is required', { status: 400 });
    }

    const identity = `dashboard_viewer_${Math.floor(Math.random() * 100_000)}`;
    const participantToken = await createViewerToken(
      { identity, name: 'Dashboard viewer' },
      roomName
    );

    const data: ConnectionDetails = {
      serverUrl: LIVEKIT_URL,
      roomName,
      participantName: 'Dashboard viewer',
      participantToken,
    };
    return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('POST /api/viewer-token error:', message);
    return new NextResponse(message, { status: 500 });
  }
}

function createViewerToken(userInfo: AccessTokenOptions, roomName: string): Promise<string> {
  const at = new AccessToken(API_KEY, API_SECRET, { ...userInfo, ttl: '1h' });
  const grant: VideoGrant = {
    room: roomName,
    roomJoin: true,
    canPublish: false,
    canPublishData: false,
    canSubscribe: true,
  };
  at.addGrant(grant);
  return at.toJwt();
}
