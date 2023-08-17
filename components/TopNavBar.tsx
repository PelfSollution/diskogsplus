import Image from 'next/image';
import { Button } from "@/components/ui/button"

interface TopNavBarProps {
  isLoggedIn: boolean;
  onLogout: () => void;
}

export default function TopNavBar({ isLoggedIn, onLogout }: TopNavBarProps) {
    if (!isLoggedIn) return null;
  
    return (
        <nav className="w-full bg-white shadow-md py-2 px-4 fixed top-0 left-0 z-10">
        <div className="container mx-auto flex justify-between items-center">
          <Image src="/diskogs-logo.gif" alt="Diskogs plus" className="w-24" />
          <ul className="flex space-x-4 items-center">
            <li className="cursor-pointer inline-flex items-center">Opción 1</li>
            <li className="cursor-pointer inline-flex items-center">Opción 2</li>
            <li>
              <Button onClick={onLogout} className="bg-red-500 hover:bg-red-600 text-white">
                Logout
              </Button>
            </li>
          </ul>
        </div>
      </nav>
    )
  }
  
