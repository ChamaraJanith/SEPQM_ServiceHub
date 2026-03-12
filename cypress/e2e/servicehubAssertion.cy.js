// cypress/e2e/servicehubAssertion.cy.js

describe('ServiceHub E2E - home, register, booking', () => {
  let bookingData;

  before(() => {
    cy.fixture('bookingData').then((data) => {
      bookingData = data;
    });
  });

  beforeEach(() => {
    cy.log('Setting up test environment');
  });

  afterEach(() => {
    cy.clearCookies();
    cy.clearLocalStorage();
  });

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
    cy.get('input[name="name"]').type(bookingData.registerUser.name)
    cy.get('input[name="email"]').type('testuser+' + Date.now() + '@example.com')
    cy.get('input[name="password"]').type(bookingData.registerUser.password)
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
    cy.get('[data-testid="input-name"]').type(bookingData.bookingUser.name)
    cy.get('[data-testid="input-email"]').type(bookingData.bookingUser.email)
    cy.get('.datepicker-input').type(bookingData.bookingUser.date)
    cy.get('body').click(0,0)
    cy.get('[data-testid="select-timeslot"]').select(bookingData.bookingUser.timeSlot)

    cy.window().then(win => {
      const addressInput = win.document.querySelector('input[name="address"]')
      addressInput.value = bookingData.bookingUser.address
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

  it('shows error message when booking API fails', () => {
    cy.visit('http://localhost:5173/book?service=ac-repair', {
      onBeforeLoad(win) {
        win.localStorage.setItem('token', 'valid-token')
        win.localStorage.setItem('user', JSON.stringify({ name: bookingData.errorUser.name }))
      }
    })

    cy.intercept('POST', '**/api/bookings', {
      statusCode: 500,
      body: { message: 'Database connection failed' }
    }).as('bookingError')

    cy.get('[data-testid="input-name"]').clear().type(bookingData.errorUser.name)
    cy.get('[data-testid="input-email"]').clear().type(bookingData.errorUser.email)
    cy.get('.datepicker-input').type(bookingData.errorUser.date)
    cy.get('body').click(0,0)
    cy.get('[data-testid="select-timeslot"]').select(bookingData.errorUser.timeSlot)

    cy.window().then(win => {
      const input = win.document.querySelector('input[name="address"]')
      Object.getOwnPropertyDescriptor(win.HTMLInputElement.prototype, 'value').set.call(
        input,
        bookingData.errorUser.address
      )
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
        win.localStorage.setItem('user', JSON.stringify({ name: bookingData.pdfUser.name }))
      }
    })

    cy.intercept('POST', '**/api/bookings', {
      statusCode: 200,
      body: { success: true, message: 'Booking saved' }
    }).as('bookingSuccess')

    cy.get('[data-testid="input-name"]').clear().type(bookingData.pdfUser.name)
    cy.get('[data-testid="input-email"]').clear().type(bookingData.pdfUser.email)
    cy.get('.datepicker-input').type(bookingData.pdfUser.date)
    cy.get('body').click(0,0)
    cy.get('[data-testid="select-timeslot"]').select(bookingData.pdfUser.timeSlot)

    cy.window().then(win => {
      const input = win.document.querySelector('input[name="address"]')
      Object.getOwnPropertyDescriptor(win.HTMLInputElement.prototype, 'value').set.call(
        input,
        bookingData.pdfUser.address
      )
      input.dispatchEvent(new win.Event('input', { bubbles: true }))
    })

    cy.get('[data-testid="submit-booking"]').click()
    cy.wait('@bookingSuccess')
    cy.get('[data-testid="booking-success"]', { timeout: 10000 }).should('be.visible')
    cy.contains('Download Official PDF').click()
    cy.readFile('cypress/downloads/booking-confirmation.pdf').should('exist')
  })
})