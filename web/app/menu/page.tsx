import { Montserrat } from "next/font/google";
import Image from "next/image"
import Button from "../components/Button";

const montserrat = Montserrat({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const Menu = () => {
  return (
    <div className={`bg-brandBackground h-dvh flex flex-col items-center pt-9 ${montserrat.className}`}>
      <Image src="/logo.svg" width="195" height="102" alt="Zaatar Logo" />
      <div className="flex flex-col items-center gap-2 py-6">
        <span className="text-2xl font-semibold">Choose language</span>
        <span className="text-2xl font-semibold">Escolha idioma</span>
        <span className="text-2xl font-semibold">Elegir idioma</span>
      </div>
      <div className="flex flex-col items-center gap-4">
        <Button variant="secondary" className="gap-2">
          <Image src="/us.svg" width="32" height="24" alt="United States Flags" />
          English
        </Button>
        <Button variant="secondary" className="gap-2">
          <Image src="/portuguese.svg" width="32" height="24" alt="United States Flags" />
          Português
        </Button>
        <Button variant="secondary" className="gap-2">
          <Image src="/spanish.svg" width="32" height="24" alt="United States Flags" />
          Español
        </Button>
      </div>
    </div>
  )
}

export default Menu
