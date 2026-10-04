import { SectionHeading } from "@/components/home/section-heading";
import { LeaderMessageCard, type Leader } from "@/components/home/leader-message-card";

// Replace placeholder names, designations and messages with the official details.
const leaders: Leader[] = [
  {
    name: "राष्ट्रीय अध्यक्ष जी",
    designation: "राष्ट्रीय अध्यक्ष · National President",
    quote: "गौ माता की सेवा ही राष्ट्र की सच्ची सेवा है।",
    message:
      "हर कार्यकर्ता गौ रक्षा के इस पवित्र संकल्प का आधार है। आइए, हम सब मिलकर अपने गाँव, नगर और प्रदेश में गौवंश के संरक्षण और सम्मान के लिए निरंतर कार्य करें। आपका छोटा-सा प्रयास भी समाज में बड़ा परिवर्तन ला सकता है।",
  },
  {
    name: "राष्ट्रीय महामंत्री जी",
    designation: "राष्ट्रीय महामंत्री · General Secretary",
    quote: "संगठन की शक्ति अनुशासन और समर्पण में है।",
    message:
      "पारदर्शिता और अनुशासन हमारे संगठन की पहचान है। यह डिजिटल पोर्टल प्रत्येक कार्यकर्ता को सरल पंजीकरण और प्रामाणिक पहचान प्रदान करता है, ताकि हम अधिक संगठित होकर सेवा कार्य कर सकें।",
  },
  {
    name: "राष्ट्रीय संयोजक जी",
    designation: "राष्ट्रीय संयोजक · National Coordinator",
    quote: "जन जागरण से ही गौ रक्षा का अभियान सफल होगा।",
    message:
      "युवाओं और समाज के हर वर्ग को गौ सेवा से जोड़ना हमारा लक्ष्य है। जागरूकता शिविरों, गौशाला सहायता और सेवा कार्यक्रमों में बढ़-चढ़कर भाग लें और दूसरों को भी प्रेरित करें।",
  },
];

export function SanghSection() {
  return (
    <section id="sangh" aria-labelledby="sangh-title" className="scroll-mt-28 px-4 py-14 sm:px-6 lg:py-20">
      <div className="mx-auto w-full max-w-6xl">
        <SectionHeading
          id="sangh-title"
          eyebrow="संघ · Sangh"
          title="संघ के मुख्य व्यक्ति और उनके संदेश"
          description="इस खंड में संघ के प्रमुख पदाधिकारियों के प्रेरणादायक संदेश प्रस्तुत हैं, जो हमारे कार्य और संकल्प को दिशा देते हैं।"
        />
        <ul className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {leaders.map((leader) => (
            <li key={leader.designation}>
              <LeaderMessageCard leader={leader} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
