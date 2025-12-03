import { FacebookIcon, InstagramIcon, TwitterIcon, YoutubeIcon } from 'lucide-react'

import { Separator } from '@/components/ui/separator'

import { AnimatedLogo } from '@/components/ui/animated-logo'

const Footer = () => {
  return (
    <footer>
      <div className='mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2 max-md:flex-col sm:px-6 sm:py-6 md:gap-6 md:py-8'>
        <a href='#'>
          <div className='flex items-center gap-3'>
            <AnimatedLogo />
          </div>
        </a>

   

        <div className='flex items-center gap-4'>
          <a href='#'>
            <FacebookIcon className='size-5' />
          </a>
          <a href='#'>
            <InstagramIcon className='size-5' />
          </a>
          <a href='#'>
            <TwitterIcon className='size-5' />
          </a>
          <a href='#'>
            <YoutubeIcon className='size-5' />
          </a>
        </div>
      </div>

      <Separator />

      <div className='mx-auto flex max-w-7xl justify-center px-4 py-4 sm:px-6'>
        <p className='text-center font-medium text-balance text-xs'>
          {`©${new Date().getFullYear()}`} <a href='#'>MonnieGift B.V.</a> - Alle rechten voorbehouden.
        </p>
      </div>
    </footer>
  )
}

export default Footer
