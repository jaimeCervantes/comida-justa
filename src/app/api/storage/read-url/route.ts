import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { auth } from "~/infra/auth";
import { getFirebaseAdmin } from "~/infra/dataAccess/init";

export async function POST(req: Request) {
  const session = await auth();
  if (!session || !session.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { path } = await req.json();
    if (!path)
      return NextResponse.json(
        { error: "Falta el path del archivo" },
        { status: 400 },
      );

    const bucket = getFirebaseAdmin().storage().bucket();
    const file = bucket.file(path);
    const token = uuidv4();

    // Hacer accesible publicamente
    await file.setMetadata({
      metadata: {
        firebaseStorageDownloadTokens: token,
      },
    });

    const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(path)}?alt=media&token=${token}`;
    return NextResponse.json({ publicUrl });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
