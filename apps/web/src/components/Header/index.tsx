import Image from 'next/image';
import {logo} from 'm-sf.svg'

export default function Header(){
   return(
      <>
      <header className='flex items-center justify-center'>
         <div>
            <Image src={logo} alt=''/>
         </div>
         <div></div>
      </header>
      </>
   )
}