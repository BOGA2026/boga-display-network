import { MessageCircle } from "lucide-react";

const WHATSAPP_NUMBER = "573163265696";
const DEFAULT_MSG = "Hola, quiero saber más sobre Visualia para mi negocio.";

interface Props {
  number?: string;
  message?: string;
}

const WhatsAppFloatingButton = ({ number = WHATSAPP_NUMBER, message = DEFAULT_MSG }: Props) => {
  const href = `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chatear por WhatsApp"
      className="fixed bottom-5 left-5 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform duration-200 hover:scale-105 hover:shadow-xl"
      style={{ boxShadow: "0 4px 20px hsl(142 70% 40% / 0.35)" }}
    >
      <MessageCircle className="h-5 w-5" strokeWidth={2.2} />
      <span className="sr-only">WhatsApp</span>
    </a>
  );
};

export default WhatsAppFloatingButton;
