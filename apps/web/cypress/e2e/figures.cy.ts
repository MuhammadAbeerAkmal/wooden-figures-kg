describe('Figure browser', () => {
  it('filters the list and shows one figure as a relational record and as Turtle', () => {
    cy.visit('/');
    cy.contains('h1', 'Figures');
    cy.get('[data-cy=result-count]').should('have.text', '25 figures');

    // Filter by two vocabularies; the filters end up in the URL.
    cy.findSelect('Wood species').select('Sycamore fig');
    cy.findSelect('Find site').select('Asyut');
    cy.get('[data-cy=result-count]').should('have.text', '4 figures');
    cy.location('search').should('include', 'material=sycamore-fig').and('include', 'site=asyut');
    cy.get('[data-cy=figure-table] tbody tr').should('have.length', 4);

    // Open the detail page.
    cy.contains('a', 'Servant grinding grain').click();
    cy.location('pathname').should('eq', '/figures/WF-0001');
    cy.contains('h1', 'Servant grinding grain');

    // Left: the row as stored, with a foreign key.
    cy.get('[data-cy=relational-record]').within(() => {
      cy.contains('th', 'inventory_number').siblings('td').should('have.text', 'WF-0001');
      cy.contains('th', 'material_id').siblings('td').should('contain.text', 'material: Sycamore fig');
    });

    // Right: the same object in CIDOC-CRM, read from the triplestore.
    cy.get('pre[data-language=turtle]')
      .should('contain.text', 'fig:WF-0001 a crm:E22_Human-Made_Object')
      .and('contain.text', 'crm:P45_consists_of mat:sycamore-fig')
      .and('contain.text', 'crm:P108i_was_produced_by prod:WF-0001');

    // Responsive: on a phone the page itself must not scroll sideways (wide tables scroll inside their box).
    cy.viewport(390, 800);
    cy.document().then((doc) => {
      expect(doc.documentElement.scrollWidth).to.be.at.most(doc.documentElement.clientWidth);
    });
  });
});

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      /** Finds a <select> by the text of its <label>, as a user would. */
      findSelect(label: string): Chainable<JQuery<HTMLSelectElement>>;
    }
  }
}

Cypress.Commands.add('findSelect', (label: string) =>
  cy
    .contains('label', label)
    .invoke('attr', 'for')
    .then((id) => cy.get<HTMLSelectElement>(`#${id}`)),
);

export {};
