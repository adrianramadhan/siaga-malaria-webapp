import { Header } from "@/components/header";
import { ImageUploader } from "@/components/image-uploader";
import { Footer } from "@/components/footer";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-1 container mx-auto px-4 py-8">
        <ImageUploader />
      </div>
      <Footer />
    </main>
  );
}
