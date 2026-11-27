import {
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
  } from "@/components/ui/accordion"

import React from 'react'

export const Acc: React.FC<{children: React.JSX.Element, title: string | React.JSX.Element}> = ({children, title}) => {
  return (
    <AccordionItem value={title + ""}>
      <AccordionTrigger className="hover:no-underline pl-2 font-bold">{title}</AccordionTrigger>
      <AccordionContent>
        {children}
      </AccordionContent>
    </AccordionItem>
  )
}