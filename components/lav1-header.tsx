// components/Lav1Header.tsx
import Link from "next/link"
import { ChevronDown } from "lucide-react"

export default function Lav1Header() {
  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-4">
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <div className="relative h-12 w-32">
                <div className="flex items-center">
                  <span className="text-3xl font-bold text-[#3b3486]">LAv1</span>
                  <span className="text-xs block ml-1 text-gray-600">STAY AT THE TOP</span>
                </div>
              </div>
            </Link>
          </div>
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="#" className="text-gray-700 hover:text-[#6a5acd] font-medium">
              Digital Marketing
            </Link>
            <div className="relative group">
              <button className="flex items-center text-gray-700 hover:text-[#6a5acd] font-medium">
                SEO Services <ChevronDown className="ml-1 h-4 w-4" />
              </button>
            </div>
            <Link href="#" className="text-gray-700 hover:text-[#6a5acd] font-medium">
              PPC
            </Link>
            <Link href="#" className="text-gray-700 hover:text-[#6a5acd] font-medium">
              Web Design
            </Link>
            <div className="relative group">
              <button className="flex items-center text-gray-700 hover:text-[#6a5acd] font-medium">
                Resources <ChevronDown className="ml-1 h-4 w-4" />
              </button>
            </div>
            <Link href="#" className="text-gray-700 hover:text-[#6a5acd] font-medium">
              Contact
            </Link>
          </nav>
          <div>
            <Link
              href="#"
              className="hidden md:inline-block bg-[#6a5acd] hover:bg-[#5849c0] text-white font-medium py-2 px-4 rounded-md"
            >
              Book A Free Consultation
            </Link>
            <button className="md:hidden text-gray-700">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
