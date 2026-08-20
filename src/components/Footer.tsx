
import { ExternalLink } from "lucide-react";

const Footer = () => {
  return (
    <div className="fixed bottom-4 left-0 right-0 z-40 flex justify-center pointer-events-none">
      <div className="inline-flex items-center gap-2 px-6 py-3 border-[3px] border-foreground shadow-[4px_4px_0_hsl(var(--foreground))] bg-card text-foreground font-bold text-sm uppercase tracking-wide pointer-events-auto">
        <span>Made by:</span>
        <a
          href="https://t.me/onlypleasurrr"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-primary hover:text-accent"
        >
          @onlypleasurrr
          <ExternalLink size={14} />
        </a>
      </div>
    </div>
  );
};

export default Footer;
