import {
  entityTableSelector,
  entityDetailsButtonSelector,
  entityDetailsBackButtonSelector,
  entityCreateButtonSelector,
  entityCreateSaveButtonSelector,
  entityCreateCancelButtonSelector,
  entityEditButtonSelector,
  entityDeleteButtonSelector,
  entityConfirmDeleteButtonSelector,
} from '../../support/entity';

describe('PaymentOption e2e test', () => {
  const paymentOptionPageUrl = '/payment-option';
  const paymentOptionPageUrlPattern = new RegExp('/payment-option(\\?.*)?$');
  const username = Cypress.env('E2E_USERNAME') ?? 'user';
  const password = Cypress.env('E2E_PASSWORD') ?? 'user';
  const paymentOptionSample = {};

  let paymentOption;

  beforeEach(() => {
    cy.login(username, password);
  });

  beforeEach(() => {
    cy.intercept('GET', '/services/patientms/api/payment-options+(?*|)').as('entitiesRequest');
    cy.intercept('POST', '/services/patientms/api/payment-options').as('postEntityRequest');
    cy.intercept('DELETE', '/services/patientms/api/payment-options/*').as('deleteEntityRequest');
  });

  afterEach(() => {
    if (paymentOption) {
      cy.authenticatedRequest({
        method: 'DELETE',
        url: `/services/patientms/api/payment-options/${paymentOption.id}`,
      }).then(() => {
        paymentOption = undefined;
      });
    }
  });

  it('PaymentOptions menu should load PaymentOptions page', () => {
    cy.visit('/');
    cy.clickOnEntityMenuItem('payment-option');
    cy.wait('@entitiesRequest').then(({ response }) => {
      if (response.body.length === 0) {
        cy.get(entityTableSelector).should('not.exist');
      } else {
        cy.get(entityTableSelector).should('exist');
      }
    });
    cy.getEntityHeading('PaymentOption').should('exist');
    cy.url().should('match', paymentOptionPageUrlPattern);
  });

  describe('PaymentOption page', () => {
    describe('create button click', () => {
      beforeEach(() => {
        cy.visit(paymentOptionPageUrl);
        cy.wait('@entitiesRequest');
      });

      it('should load create PaymentOption page', () => {
        cy.get(entityCreateButtonSelector).click();
        cy.url().should('match', new RegExp('/payment-option/new$'));
        cy.getEntityCreateUpdateHeading('PaymentOption');
        cy.get(entityCreateSaveButtonSelector).should('exist');
        cy.get(entityCreateCancelButtonSelector).click();
        cy.wait('@entitiesRequest').then(({ response }) => {
          expect(response.statusCode).to.equal(200);
        });
        cy.url().should('match', paymentOptionPageUrlPattern);
      });
    });

    describe('with existing value', () => {
      beforeEach(() => {
        cy.authenticatedRequest({
          method: 'POST',
          url: '/services/patientms/api/payment-options',
          body: paymentOptionSample,
        }).then(({ body }) => {
          paymentOption = body;

          cy.intercept(
            {
              method: 'GET',
              url: '/services/patientms/api/payment-options+(?*|)',
              times: 1,
            },
            {
              statusCode: 200,
              body: [paymentOption],
            },
          ).as('entitiesRequestInternal');
        });

        cy.visit(paymentOptionPageUrl);

        cy.wait('@entitiesRequestInternal');
      });

      it('detail button click should load details PaymentOption page', () => {
        cy.get(entityDetailsButtonSelector).first().click();
        cy.getEntityDetailsHeading('paymentOption');
        cy.get(entityDetailsBackButtonSelector).click();
        cy.wait('@entitiesRequest').then(({ response }) => {
          expect(response.statusCode).to.equal(200);
        });
        cy.url().should('match', paymentOptionPageUrlPattern);
      });

      it('edit button click should load edit PaymentOption page and go back', () => {
        cy.get(entityEditButtonSelector).first().click();
        cy.getEntityCreateUpdateHeading('PaymentOption');
        cy.get(entityCreateSaveButtonSelector).should('exist');
        cy.get(entityCreateCancelButtonSelector).click();
        cy.wait('@entitiesRequest').then(({ response }) => {
          expect(response.statusCode).to.equal(200);
        });
        cy.url().should('match', paymentOptionPageUrlPattern);
      });

      it('edit button click should load edit PaymentOption page and save', () => {
        cy.get(entityEditButtonSelector).first().click();
        cy.getEntityCreateUpdateHeading('PaymentOption');
        cy.get(entityCreateSaveButtonSelector).click();
        cy.wait('@entitiesRequest').then(({ response }) => {
          expect(response.statusCode).to.equal(200);
        });
        cy.url().should('match', paymentOptionPageUrlPattern);
      });

      it('last delete button click should delete instance of PaymentOption', () => {
        cy.get(entityDeleteButtonSelector).last().click();
        cy.getEntityDeleteDialogHeading('paymentOption').should('exist');
        cy.get(entityConfirmDeleteButtonSelector).click();
        cy.wait('@deleteEntityRequest').then(({ response }) => {
          expect(response.statusCode).to.equal(204);
        });
        cy.wait('@entitiesRequest').then(({ response }) => {
          expect(response.statusCode).to.equal(200);
        });
        cy.url().should('match', paymentOptionPageUrlPattern);

        paymentOption = undefined;
      });
    });
  });

  describe('new PaymentOption page', () => {
    beforeEach(() => {
      cy.visit(`${paymentOptionPageUrl}`);
      cy.get(entityCreateButtonSelector).click();
      cy.getEntityCreateUpdateHeading('PaymentOption');
    });

    it('should create an instance of PaymentOption', () => {
      cy.get(`[data-cy="type"]`).type('winnow');
      cy.get(`[data-cy="type"]`).should('have.value', 'winnow');

      cy.get(`[data-cy="userID"]`).type('meh');
      cy.get(`[data-cy="userID"]`).should('have.value', 'meh');

      cy.get(`[data-cy="metadata"]`).type('dilapidation');
      cy.get(`[data-cy="metadata"]`).should('have.value', 'dilapidation');

      cy.get(entityCreateSaveButtonSelector).click();

      cy.wait('@postEntityRequest').then(({ response }) => {
        expect(response.statusCode).to.equal(201);
        paymentOption = response.body;
      });
      cy.wait('@entitiesRequest').then(({ response }) => {
        expect(response.statusCode).to.equal(200);
      });
      cy.url().should('match', paymentOptionPageUrlPattern);
    });
  });
});
