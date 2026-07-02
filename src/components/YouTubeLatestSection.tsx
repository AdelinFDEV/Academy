import YouTubeLatest from "@/components/YouTubeLatest";
import { getLatestVideos } from "@/lib/youtube";

// Server Component async: se resuelve dentro de un <Suspense> en la home para
// que las llamadas a youtube.com (lentas y fuera de nuestro control) no
// bloqueen el resto de la página.
export default async function YouTubeLatestSection() {
  const videos = await getLatestVideos(3);
  return <YouTubeLatest videos={videos} />;
}
