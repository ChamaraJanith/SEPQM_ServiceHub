describe('ServiceHub BDD Test', () => {

  it('Given user opens the ServiceHub website When user clicks the Login link in the navbar Then user should be redirected to the Login page', () => {

    // Given
    cy.visit('http://localhost:5173/')

    // When
    cy.contains('Login').click()

    // Then
    cy.url().should('include', '/login')

  })

})