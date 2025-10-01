import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

const items = [
  {
    title: 'Hoe verstuur ik een MonnieGift?',
    content: 'Het is heel eenvoudig! Kies een bedrag tussen €1 en €50, voeg een persoonlijk bericht toe (optioneel), selecteer een leuke animatie, en betaal veilig met iDEAL. Je ontvangt direct een authenticatiecode en link die je kunt delen met de ontvanger.'
  },
  {
    title: 'Wat zijn de kosten?',
    content:
      'Per MonnieGift betaal je een servicekosten van €0,99. Dit is bovenop het cadeaubedrag dat je wilt versturen. Dus als je €10 cadeau geeft, betaal je in totaal €10,99.'
  },
  {
    title: 'Hoe haalt de ontvanger het cadeau op?',
    content:
      'De ontvanger bezoekt de link die je deelt, voert de authenticatiecode in en het eigen e-mailadres. Het geld wordt automatisch overgemaakt naar de bankrekening van de ontvanger via Stripe Connect en ABN AMRO.'
  },
  {
    title: 'Heb ik een account nodig?',
    content:
      'Nee! Om een MonnieGift te versturen heb je geen account nodig. Alleen de ontvanger heeft een eenmalige verificatie nodig om het geld te ontvangen op de bankrekening.'
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
  const displayedItems = showAll ? items : items.slice(0, 4)

  return (
    <div className='w-full'>
      <Accordion type='single' collapsible className='w-full' defaultValue='item-1'>
        {displayedItems.map((item, index) => (
          <AccordionItem
            key={index}
            value={`item-${index + 1}`}
            className='data-[state=open]:bg-accent rounded-md border-none px-5 transition-colors duration-200'
          >
            <AccordionTrigger>{item.title}</AccordionTrigger>
            <AccordionContent className='text-muted-foreground text-sm'>{item.content}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
      
      {items.length > 4 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className='mt-6 mx-auto flex items-center gap-2 px-6 py-3 text-sm font-semibold text-foreground border border-border rounded-xl bg-muted  transition-all duration-200'
        >
          {showAll ? 'Laad minder vragen' : 'Laad meer vragen'}
          <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${showAll ? 'rotate-180' : ''}`} />
        </button>
      )}
    </div>
  )
}

export default AccordionTabsDemo
