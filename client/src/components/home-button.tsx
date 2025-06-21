import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

interface HomeButtonProps {
  onHome: () => void;
}

export default function HomeButton({ onHome }: HomeButtonProps) {
  return (
    <Button
      onClick={onHome}
      variant="outline"
      size="sm"
      className="fixed top-4 left-4 bg-white/10 backdrop-blur-sm border-luxe-gold/30 hover:border-luxe-gold hover:bg-luxe-gold/20 text-white z-50"
    >
      <Home className="h-4 w-4 mr-2" />
      Home
    </Button>
  );
}