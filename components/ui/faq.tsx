import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

const items = [
  {
    title: 'Hoe werkt het',
    content: 'Het is heel eenvoudig! Kies een bedrag tussen €1 en €50, voeg een persoonlijk bericht toe (optioneel), selecteer een leuke animatie en betaal veilig met iDeal. Je ontvangt direct een authenticatiecode en link die je kunt delen met de ontvanger.'
  },
  {
    title: 'Is het veilig',
    content:
      'Ja, absoluut! Alle betalingen worden verwerkt via Stripe, een van de meest betrouwbare betalingsplatformen ter wereld. We slaan geen gevoelige bankgegevens op en gebruiken authenticatiecodes om fraude te voorkomen.'
  },
  {
    title: 'Wat zijn de kosten',
    content:
      'Per MonnieGift betaal je een servicekosten van €0,99. Dit is bovenop het cadeaubedrag dat je wilt versturen. Dus als je €10 cadeau geeft, betaal je in totaal €10,99.'
  },
  {
    title: 'WIe beheert het geld',
    content:
      'Het geld wordt veilig beheerd door Stripe, een gecertificeerd betalingsplatform. MonnieGift fungeert als tussenpersoon en zorgt ervoor dat het geld veilig wordt overgemaakt naar de ontvanger via Stripe Connect.'
  },
  {
    title: 'Hoe lang blijft de link geldig?',
    content:
      'De link en authenticatiecode blijven geldig totdat het cadeau is opgehaald. Er is geen vervaldatum, dus de ontvanger kan het cadeau ophalen wanneer het uitkomt.'
  },
  {
    title: 'Hoe snel ontvangt de ontvanger het geld?',
    content:
      'Zodra de ontvanger de verificatie heeft voltooid en een bankrekening heeft gekoppeld, wordt het geld direct overgemaakt. Dit gebeurt meestal binnen enkele minuten tot een werkdag, afhankelijk van de bank.'
  },
  {
    title: 'Is MonnieGift veilig?',
    content:
      'Ja, absoluut! Alle betalingen worden verwerkt via Stripe, een van de meest betrouwbare betalingsplatformen ter wereld. We slaan geen gevoelige bankgegevens op en gebruiken authenticatiecodes om fraude te voorkomen.'
  },
  {
    title: 'Kan ik een MonnieGift annuleren?',
    content:
      'Zodra de betaling is voltooid, kan het cadeau niet meer worden geannuleerd. De ontvanger kan het cadeau wel laten verlopen door het niet op te halen. Het geld blijft dan gekoppeld aan de authenticatiecode.'
  },
  {
    title: 'Wat gebeurt er als ik de authenticatiecode kwijtraak?',
    content:
      'Bewaar de authenticatiecode altijd goed! Zonder de code kan het cadeau niet worden opgehaald. We raden aan om de code direct te delen met de ontvanger na het aanmaken van het cadeau.'
  },
  {
    title: 'Welke betaalmethoden worden geaccepteerd?',
    content:
      'Op dit moment accepteren we alleen iDEAL betalingen. Dit maakt het proces snel, veilig en specifiek voor Nederlandse gebruikers. Andere betaalmethoden kunnen in de toekomst worden toegevoegd.'
  },
  {
    title: 'Wat is het minimum en maximum bedrag?',
    content:
      'Je kunt een MonnieGift versturen vanaf €1,00 tot maximaal €50,00. Dit zorgt ervoor dat de service betaalbaar en toegankelijk blijft voor iedereen.'
  },
  {
    title: 'Kan ik meerdere cadeaus naar dezelfde persoon sturen?',
    content:
      'Ja, je kunt onbeperkt MonnieGifts versturen naar dezelfde of verschillende personen. Elke gift heeft een unieke authenticatiecode en kan onafhankelijk worden opgehaald.'
  }
]

const AccordionTabsDemo = () => {
  const [showAll, setShowAll] = useState(false)
  const displayedItems = showAll ? items : items

  return (
    <div className='w-full'>
      <Accordion type='single' collapsible className='w-full' defaultValue='item-2'>
        {displayedItems.map((item, index) => (
          <AccordionItem
            key={index}
            value={`item-${index + 1}`}
            className='border-b border-foreground/15 px-3 py-4 transition-colors duration-200'
          >
            <AccordionTrigger className='text-foreground/85 hover:text-foreground text-left text-xl' style={{ fontFamily: 'Rockwell, serif' }}>
              {item.title}
            </AccordionTrigger>
            <AccordionContent className='text-foreground/85 text-lg leading-relaxed pt-2' style={{ fontFamily: 'Inter, sans-serif' }}>
              {item.content}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  )
}

export default AccordionTabsDemo
