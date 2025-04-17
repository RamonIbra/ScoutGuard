import { Button } from "@/components/ui/button";
import MainLayout from "@/layouts/MainLayout"; // se till att pathen stämmer

export default function HomePage() {
  return (
    <MainLayout>
      <div>
        <h1 className="text-2xl font-bold mb-4">ScoutGuard Home</h1>
        <Button>Click me</Button>
      </div>
    </MainLayout>
  );
}
