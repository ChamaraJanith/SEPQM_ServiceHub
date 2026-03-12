// cypress/e2e/adminDashboardAssertion.cy.js

describe('Admin happy path - assign worker, set price, notify user', () => {
  let bookingData;

  before(() => {
    cy.fixture('bookingData').then((data) => {
      bookingData = data;
    });

    // register admin once
    cy.request({
      method: 'POST',
      url: 'http://localhost:5000/api/auth/register',
      failOnStatusCode: false,
      body: { name: 'Admin', email: 'admin@gmail.com', password: 'admin@123' }
    });
  });

  beforeEach(() => {
    // login before every test so localStorage is fresh
    cy.visit('http://localhost:5173/login');
    cy.intercept('POST', '**/api/auth/login').as('loginRequest');
    cy.get('input[name="email"]').type('admin@gmail.com');
    cy.get('input[name="password"]').type('admin@123');
    cy.get('button[type="submit"]').click();

    // wait for login and grab token from response
    cy.wait('@loginRequest', { timeout: 15000 }).then((interception) => {
      expect(interception.response.statusCode).to.eq(200);
      const token = interception.response.body.token;
      expect(token).to.be.a('string');

      // create a fresh booking via API each time using fixture data
      cy.request({
        method: 'POST',
        url: 'http://localhost:5000/api/bookings',
        headers: { Authorization: `Bearer ${token}` },
        body: {
          serviceSlug: bookingData.bookingUser.serviceSlug,
          serviceName: bookingData.bookingUser.serviceName,
          name: bookingData.bookingUser.name,
          email: `client+${Date.now()}@example.com`,
          date: bookingData.bookingUser.date,
          timeSlot: bookingData.bookingUser.timeSlot,
          address: bookingData.bookingUser.address,
          lat: bookingData.bookingUser.lat,
          lng: bookingData.bookingUser.lng
        }
      });
    });

    // navigate to dashboard and wait for bookings
    cy.contains('Admin Dashboard').click();
    cy.url().should('include', '/admin-dashboard');
    cy.get('h1').contains('Admin Dashboard').should('be.visible');
    cy.intercept('GET', '**/api/bookings/all').as('getBookings');
    cy.reload();
    cy.wait('@getBookings', { timeout: 15000 });
    cy.get('[data-testid="booking-row"]').first().as('firstBooking');
  });

  afterEach(() => {
    cy.clearCookies();
    cy.clearLocalStorage();
  });

  it('has a booking row available', () => {
    cy.get('[data-testid="booking-row"]').should('exist');
  });

  it('assigns a worker', () => {
    cy.get('@firstBooking').find('[data-testid="assign-worker"]').select('Kamal Perera');
    cy.get('@firstBooking').find('[data-testid="assign-worker"]').should('have.value', 'Kamal Perera');
  });

  it('edits the amount', () => {
    cy.get('[data-testid="booking-row"]').first().as('firstBooking');
    cy.get('@firstBooking').find('[data-testid="amount-display"]').click();
    cy.get('@firstBooking').find('[data-testid="input-amount"]').clear().type('7500');
    cy.get('@firstBooking').find('[data-testid="btn-save-amount"]').click();
    cy.get('@firstBooking').find('[data-testid="amount-display"]').should('contain.text', '7,500');
  });

  it('notifies the user', () => {
    cy.intercept('POST', '**/api/bookings/*/notify').as('notifyUser');
    cy.window().then(win => {
      cy.stub(win, 'confirm').returns(true);
      cy.stub(win, 'alert').as('alertStub');
    });
    cy.get('[data-testid="booking-row"]').first().as('firstBooking');
    cy.get('@firstBooking').find('[data-testid="btn-notify"]').click();
    cy.wait('@notifyUser', { timeout: 15000 }).its('response.statusCode').should('eq', 200);
    cy.get('@alertStub').should('have.been.calledWithMatch',
      'Success: Email notification sent to user!'
    );
  });
});