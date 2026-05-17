import * as React from 'react'

import { cn } from '@/lib/utils'

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'border-input placeholder:text-muted-foreground/70 focus-visible:border-ring focus-visible:bg-background focus-visible:ring-ring/35 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content min-h-16 w-full rounded-md border bg-background/70 px-3 py-2 text-base shadow-xs transition-all duration-200 outline-none hover:border-primary/30 hover:bg-background focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:bg-muted/60 disabled:opacity-60 md:text-sm',
        className,
      )}
      {...props}
    />
  )
}

export { Textarea }
