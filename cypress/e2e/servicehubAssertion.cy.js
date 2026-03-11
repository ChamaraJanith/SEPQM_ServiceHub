// cypress/e2e/servicehubAssertion.cy.js

describe('ServiceHub E2E - home, register, booking', () => {

  it('home page loads', () => {
    cy.visit('http://localhost:5173/')
    cy.get('nav').contains('ServiceHub').should('be.visible')
    cy.contains('Our Services').should('be.visible')
  })

  it('register button navigates to register page', () => {
    cy.visit('http://localhost:5173/')
    cy.contains('Register').click()
    cy.url().should('include', '/register')
  })

  it('register api returns 201', () => {
    cy.visit('http://localhost:5173/register')
    cy.intercept('POST', '**/api/auth/register').as('registerApi')
    cy.get('input[name="name"]').type('Test User')
    cy.get('input[name="email"]').type('testuser+' + Date.now() + '@example.com')
    cy.get('input[name="password"]').type('Password123!')
    cy.get('button[type="submit"]').click()
    cy.wait('@registerApi').its('response.statusCode').should('eq', 201)
  })

  it('shows validation errors when required fields are missing', () => {
    cy.visit('http://localhost:5173/book?service=ac-repair')
    cy.get('[data-testid="submit-booking"]').click()
    cy.contains('Name must be at least 2 characters.').should('be.visible')
    cy.contains('Valid email is required.').should('be.visible')
  })

  it('user can pick date from calendar and fill booking fields', () => {
    cy.visit('http://localhost:5173/book?service=ac-repair')
    cy.get('[data-testid="input-name"]').type('Booking User')
    cy.get('[data-testid="input-email"]').type('booking@example.com')
    cy.get('.datepicker-input').click()
    cy.contains('.react-datepicker__day', '15').click()
    cy.get('body').click(0,0)
    cy.get('[data-testid="select-timeslot"]').select('Morning')
    
    // Manual Address Set
    cy.window().then(win => {
      const addressInput = win.document.querySelector('input[name="address"]')
      addressInput.value = '123 Test Street, Colombo'
      addressInput.dispatchEvent(new win.Event('input', { bubbles: true }))
    })

    cy.get('[data-testid="submit-booking"]').click()
    cy.contains('Date is required.').should('not.exist')
  })

  it('sets service location when clicking Use My Current Location', () => {
    cy.visit('http://localhost:5173/book?service=ac-repair')
    cy.window().then(win => {
      cy.stub(win.navigator.geolocation, 'getCurrentPosition').callsFake(cb => cb({
        coords: { latitude: 6.864036, longitude: 80.034069 }
      }))
    })
    cy.intercept('GET', 'https://nominatim.openstreetmap.org/reverse*', {
      body: { display_name: 'Test Address' }
    }).as('geo')
    cy.contains('Use My Current Location').click()
    cy.wait('@geo')
    cy.get('input[name="address"]').should('have.value', 'Test Address')
  })

  // --- THE FIXED API TESTS ---

  it('shows error message when booking API fails', () => {
    // 1. Stub the fetch globally so we don't rely on AuthContext logic
    cy.visit('http://localhost:5173/book?service=ac-repair', {
      onBeforeLoad(win) {
        win.localStorage.setItem('token', 'valid-token')
        // Force the app to think a user is logged in
        win.localStorage.setItem('user', JSON.stringify({ name: 'Error User' }))
      }
    })

    cy.intercept('POST', '**/api/bookings', {
      statusCode: 500,
      body: { message: 'Database connection failed' }
    }).as('bookingError')

    cy.get('[data-testid="input-name"]').clear().type('Error User')
    cy.get('[data-testid="input-email"]').clear().type('error@example.com')
    cy.get('.datepicker-input').type('2026-06-20')
    cy.get('body').click(0,0)
    cy.get('[data-testid="select-timeslot"]').select('Afternoon')

    // Ensure Address passes validation (min 5 chars)
    cy.window().then(win => {
      const input = win.document.querySelector('input[name="address"]')
      Object.getOwnPropertyDescriptor(win.HTMLInputElement.prototype, 'value').set.call(input, '123 Error Lane St')
      input.dispatchEvent(new win.Event('input', { bubbles: true }))
    })

    cy.get('[data-testid="submit-booking"]').click()
    cy.wait('@bookingError', { timeout: 10000 })
    cy.get('.error-message').should('be.visible').and('contain', 'Database connection failed')
  })

  it('downloads a PDF confirmation after successful booking', () => {
    cy.visit('http://localhost:5173/book?service=ac-repair', {
      onBeforeLoad(win) {
        win.localStorage.setItem('token', 'valid-token')
        win.localStorage.setItem('user', JSON.stringify({ name: 'PDF User' }))
      }
    })

    // FIX: Provide a valid JSON body {} so res.json() succeeds
    cy.intercept('POST', '**/api/bookings', { 
      statusCode: 200,
      body: { success: true, message: 'Booking saved' } 
    }).as('bookingSuccess')

    cy.get('[data-testid="input-name"]').clear().type('PDF User')
    cy.get('[data-testid="input-email"]').clear().type('pdf@example.com')
    cy.get('.datepicker-input').type('2026-06-20')
    cy.get('body').click(0,0)
    cy.get('[data-testid="select-timeslot"]').select('Morning')

    cy.window().then(win => {
      const input = win.document.querySelector('input[name="address"]')
      Object.getOwnPropertyDescriptor(win.HTMLInputElement.prototype, 'value').set.call(input, 'Valid PDF Address')
      input.dispatchEvent(new win.Event('input', { bubbles: true }))
    })

    cy.get('[data-testid="submit-booking"]').click()
    
    cy.wait('@bookingSuccess')

    // This should now be found because the JS didn't crash!
    cy.get('[data-testid="booking-success"]', { timeout: 10000 }).should('be.visible')
    
    cy.contains('Download Official PDF').click()
    
    // Verify the file exists
    cy.readFile('cypress/downloads/booking-confirmation.pdf').should('exist')
  })
})