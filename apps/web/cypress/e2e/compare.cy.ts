describe('Comparison page', () => {
  it('runs a question on both models and shows queries, results and timings', () => {
    cy.visit('/compare');
    cy.contains('h1', 'Compare the two models');
    cy.get('input[name=question]').should('have.length', 6);

    // The first question is selected by default.
    cy.get('[data-cy=sql] pre').should('contain.text', 'SELECT').and('contain.text', "m.slug = 'sycamore-fig'");
    cy.get('[data-cy=sparql] pre').should('contain.text', 'crm:P45_consists_of mat:sycamore-fig');
    cy.get('[data-cy=results-match]').should('contain.text', 'Both models returned the same 4 rows');

    // The graph path question: recursive CTE on one side, property path on the other.
    cy.contains('label', 'Place hierarchy, any depth').click();
    cy.location('pathname').should('eq', '/compare/cq5');
    cy.get('[data-cy=verdict]').should('have.text', 'Easier in SPARQL');
    cy.get('[data-cy=sql] pre').should('contain.text', 'WITH RECURSIVE');
    cy.get('[data-cy=sparql] pre').should('contain.text', 'crm:P89_falls_within*');
    cy.get('[data-cy=results-match]').should('contain.text', 'Both models returned the same 6 rows');

    // Both result tables hold the same figures, and both sides report a time.
    for (const side of ['sql', 'sparql']) {
      cy.get(`[data-cy=${side}] tbody tr`).should('have.length', 6);
      cy.get(`[data-cy=${side}] tbody`).should('contain.text', 'Deir el-Bahri').and('contain.text', 'Thebes');
      cy.get(`[data-cy=${side}-time]`).invoke('text').should('match', /^\d+(\.\d+)? ms$/);
    }
  });
});
