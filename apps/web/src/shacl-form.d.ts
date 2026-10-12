import type { DetailedHTMLProps, HTMLAttributes } from 'react';

// Lets TSX use the <shacl-form> custom element with its data-* attributes.
declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'shacl-form': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & Record<`data-${string}`, string>;
    }
  }
}
