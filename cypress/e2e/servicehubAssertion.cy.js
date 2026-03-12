// cypress/e2e/servicehubAssertion.cy.js

describe('ServiceHub E2E - home, register, booking', () => {
  // load common data once and alias it so each spec can refer via `this.bookingData`
  // no longer alias fixture globally; each test will load it as needed
  before(() => {
    cy.log('loading bookingData fixture');
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
    cy.fixture('bookingData').then((data) => {
      cy.visit('http://localhost:5173/register');
      cy.intercept('POST', '**/api/auth/register').as('registerApi');
      cy.get('input[name="name"]').type(data.registerUser.name);
      cy.get('input[name="email"]').type('testuser+' + Date.now() + '@example.com');
      cy.get('input[name="password"]').type(data.registerUser.password);
      cy.get('button[type="submit"]').click();
      cy.wait('@registerApi').its('response.statusCode').should('eq', 201);
    });
  })

  it('shows validation errors when required fields are missing', () => {
    cy.visit('http://localhost:5173/book?service=ac-repair')
    cy.get('[data-testid="submit-booking"]').click()
    cy.contains('Name must be at least 2 characters.').should('be.visible')
    cy.contains('Valid email is required.').should('be.visible')
  })

  it('user can pick date from calendar and fill booking fields', () => {
    cy.fixture('bookingData').then((data) => {
      const b = data.bookingUser;
      cy.visit('http://localhost:5173/book?service=ac-repair');
      cy.get('[data-testid="input-name"]').type(b.name);
      cy.get('[data-testid="input-email"]').type(b.email);
      cy.get('.datepicker-input').type(b.date);
      cy.get('body').click(0,0);
      cy.get('[data-testid="select-timeslot"]').select(b.timeSlot);

      cy.window().then(win => {
        const addressInput = win.document.querySelector('input[name="address"]');
        addressInput.value = b.address;
        addressInput.dispatchEvent(new win.Event('input', { bubbles: true }));
      });

      cy.get('[data-testid="submit-booking"]').click();
      cy.contains('Date is required.').should('not.exist');
    });
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
    cy.fixture('bookingData').then((data) => {
      const err = data.errorUser;
      cy.visit('http://localhost:5173/book?service=ac-repair', {
        onBeforeLoad(win) {
          win.localStorage.setItem('token', 'valid-token');
          win.localStorage.setItem('user', JSON.stringify({ name: err.name }));
        }
      });

      cy.intercept('POST', '**/api/bookings', {
        statusCode: 500,
        body: { message: 'Database connection failed' }
      }).as('bookingError');

      cy.get('[data-testid="input-name"]').clear().type(err.name);
      cy.get('[data-testid="input-email"]').clear().type(err.email);
      cy.get('.datepicker-input').type(err.date);
      cy.get('body').click(0,0);
      cy.get('[data-testid="select-timeslot"]').select(err.timeSlot);

      cy.window().then(win => {
        const input = win.document.querySelector('input[name="address"]');
        Object.getOwnPropertyDescriptor(win.HTMLInputElement.prototype, 'value').set.call(
          input,
          err.address
        );
        input.dispatchEvent(new win.Event('input', { bubbles: true }));
      });

      cy.get('[data-testid="submit-booking"]').click();
      cy.wait('@bookingError', { timeout: 10000 });
      cy.get('.error-message').should('be.visible').and('contain', 'Database connection failed');
    });
  })

  it('downloads a PDF confirmation after successful booking', () => {
    cy.fixture('bookingData').then((data) => {
      const pdf = data.pdfUser;
      cy.visit('http://localhost:5173/book?service=ac-repair', {
        onBeforeLoad(win) {
          win.localStorage.setItem('token', 'valid-token');
          win.localStorage.setItem('user', JSON.stringify({ name: pdf.name }));
        }
      });

      cy.intercept('POST', '**/api/bookings', {
        statusCode: 200,
        body: { success: true, message: 'Booking saved' }
      }).as('bookingSuccess');

      cy.get('[data-testid="input-name"]').clear().type(pdf.name);
      cy.get('[data-testid="input-email"]').clear().type(pdf.email);
      cy.get('.datepicker-input').type(pdf.date);
      cy.get('body').click(0,0);
      cy.get('[data-testid="select-timeslot"]').select(pdf.timeSlot);

      cy.window().then(win => {
        const input = win.document.querySelector('input[name="address"]');
        Object.getOwnPropertyDescriptor(win.HTMLInputElement.prototype, 'value').set.call(
          input,
          pdf.address
        );
        input.dispatchEvent(new win.Event('input', { bubbles: true }));
      });

      cy.get('[data-testid="submit-booking"]').click();
      cy.wait('@bookingSuccess');
      cy.get('[data-testid="booking-success"]', { timeout: 10000 }).should('be.visible');
      cy.contains('Download Official PDF').click();
      cy.readFile('cypress/downloads/booking-confirmation.pdf').should('exist');
    });
  })
})