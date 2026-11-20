import { Component, Input, OnChanges, SecurityContext, inject } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

let diagramSequence = 0;
let mermaidPromise: Promise<(typeof import('mermaid'))['default']> | null = null;

async function loadMermaid(): Promise<(typeof import('mermaid'))['default']> {
  if (!mermaidPromise) {
    mermaidPromise = import('mermaid').then(module => {
      module.default.initialize({
        startOnLoad: false,
        securityLevel: 'strict',
        theme: 'base',
        fontFamily: 'Geist, system-ui, sans-serif',
        themeVariables: {
          background: '#0d0d0d',
          primaryColor: '#2c2c2c',
          primaryTextColor: '#f8f5f0',
          primaryBorderColor: '#e8b053',
          lineColor: '#8f8f8f',
          textColor: '#f8f5f0',
          edgeLabelBackground: '#1f1f1f',
        },
      });
      return module.default;
    });
  }
  return mermaidPromise;
}

@Component({
  selector: 'app-mermaid-diagram',
  standalone: true,
  template: `
    @if (error) { <div class="alert alert--error" role="status"><i class="fa-solid fa-circle-exclamation" aria-hidden="true"></i><p class="diagram-error">Diagrama Mermaid inválido: {{ error }}</p></div> }
    @else if (svg) { <div class="mermaid-box diagram-preview" [innerHTML]="svg"></div> }
  `,
})
export class MermaidDiagramComponent implements OnChanges {
  private readonly sanitizer = inject(DomSanitizer);
  @Input() code: string | null = null;
  svg: SafeHtml | null = null;
  error = '';

  async ngOnChanges(): Promise<void> {
    this.svg = null; this.error = '';
    if (!this.code?.trim()) return;
    try {
      const mermaid = await loadMermaid();
      await mermaid.parse(this.code);
      const result = await mermaid.render(`interproc-diagram-${++diagramSequence}`, this.code);
      const sanitized = this.sanitizer.sanitize(SecurityContext.HTML, result.svg);
      this.svg = this.sanitizer.bypassSecurityTrustHtml(sanitized ?? '');
    } catch (error: unknown) {
      this.error = error instanceof Error
        ? (error.message.split('\n')[0] ?? 'Sintaxis de diagrama inválida.')
        : 'No se pudo renderizar el diagrama.';
    }
  }
}
