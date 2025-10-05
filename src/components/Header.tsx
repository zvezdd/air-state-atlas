import { User } from "@supabase/supabase-js";
import burgerMenuIcon from "@/assets/burger-menu.jpg";

interface HeaderProps {
  user: User | null;
  onMenuClick: () => void;
}

export const Header = ({ user, onMenuClick }: HeaderProps) => {
  if (!user) return null;

  return (
    <header className="fixed top-0 right-0 p-4 z-50">
      <button
        onClick={onMenuClick}
        className="w-12 h-12 rounded-lg overflow-hidden hover:opacity-80 transition-opacity"
        aria-label="Open profile menu"
      >
        <img src={burgerMenuIcon} alt="Menu" className="w-full h-full object-cover" />
      </button>
    </header>
  );
};
