describe('SHACL form', () => {
  it('builds a form from the shapes and reports server-side validation problems', () => {
    cy.visit('/new');
    cy.contains('h1', 'Data entry form generated from SHACL');

    // The web component renders its fields into a shadow root, from the shapes file.
    cy.get('[data-cy=shacl-form]', { timeout: 20000 })
      .shadow()
      .should('contain.text', 'Title')
      .and('contain.text', 'Inventory number')
      .and('contain.text', 'Wood species');

    // An empty form must not conform; the messages come from sh:message in the shapes.
    cy.get('[data-cy=validate]').click();
    cy.get('[data-cy=validation-report]')
      .should('contain.text', 'problems found')
      .and('contain.text', 'A figure needs exactly one material (wood species).');
  });
});
