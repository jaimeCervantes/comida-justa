import { NextRequest, NextResponse } from "next/server";
import { auth } from "~/infra/auth";
import { v4 as uuidv4 } from "uuid";
import { getFirebaseAdmin } from "~/infra/dataAccess/init";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session || !session.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { fileName, contentType, directory = "posts" } = body;

    if (!fileName || !contentType) {
      return NextResponse.json(
        { error: "Nombre de archivo y tipo de contenido son requeridos" },
        { status: 400 },
      );
    }

    const userId =
      session.user.email?.replace(/[.@]/g, "_") || `user_${Date.now()}`;

    const filePath = createFilePath(contentType, fileName, directory);

    const firebaseAdmin = getFirebaseAdmin();
    const bucket = firebaseAdmin.storage().bucket();
    const file = bucket.file(filePath);

    // Generar URL firmada para subida
    const [uploadUrl] = await file.getSignedUrl({
      version: "v4",
      action: "write",
      expires: Date.now() + 15 * 60 * 1000, // 15 minutos
      contentType: contentType,
    });

    return NextResponse.json({
      uploadUrl,
      filePath,
      expiresAt: Date.now() + 15 * 60 * 1000,
    });
  } catch (error) {
    console.error("Error generando URL firmada:", error);
    return NextResponse.json(
      { error: "Error al generar URL de subida" },
      { status: 500 },
    );
  }
}

function createFilePath(
  type: string,
  fileName: string,
  directory = "posts",
): string {
  return `${directory}/${type}/${fileName}`;
}
