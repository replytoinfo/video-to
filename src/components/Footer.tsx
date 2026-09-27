
import { ExternalLink } from "lucide-react";

const Footer = () => {
  return (
    <div className="py-4 flex justify-center">
      <div className="inline-flex items-center gap-2 px-6 py-3 border-[3px] border-foreground shadow-[4px_4px_0_hsl(var(--foreground))] bg-card text-foreground font-bold text-sm uppercase tracking-wide">
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
