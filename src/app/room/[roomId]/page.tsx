"use client";

import dynamic from "next/dynamic";
import { useParams } from "next/navigation";

// SECRET TECHNIQUE : On dit à Next.js de charger ce fichier UNIQUEMENT sur le navigateur
const RoomClient = dynamic(() => import("./RoomClient"), { ssr: false });

export default function RoomPage() {
  const params = useParams<{ roomId: string }>();
  return <RoomClient roomId={params.roomId} />;
}
