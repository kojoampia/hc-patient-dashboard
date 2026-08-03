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

describe('Recommendation e2e test', () => {
  const recommendationPageUrl = '/recommendation';
  const recommendationPageUrlPattern = new RegExp('/recommendation(\\?.*)?$');
  const username = Cypress.env('E2E_USERNAME') ?? 'user';
  const password = Cypress.env('E2E_PASSWORD') ?? 'user';
  const recommendationSample = {};

  let recommendation;

  beforeEach(() => {
    cy.login(username, password);
  });

  beforeEach(() => {
    cy.intercept('GET', '/services/patientms/api/recommendations+(?*|)').as('entitiesRequest');
    cy.intercept('POST', '/services/patientms/api/recommendations').as('postEntityRequest');
    cy.intercept('DELETE', '/services/patientms/api/recommendations/*').as('deleteEntityRequest');
  });

  afterEach(() => {
    if (recommendation) {
      cy.authenticatedRequest({
        method: 'DELETE',
        url: `/services/patientms/api/recommendations/${recommendation.id}`,
      }).then(() => {
        recommendation = undefined;
      });
    }
  });

  it('Recommendations menu should load Recommendations page', () => {
    cy.visit('/');
    cy.clickOnEntityMenuItem('recommendation');
    cy.wait('@entitiesRequest').then(({ response }) => {
      if (response.body.length === 0) {
        cy.get(entityTableSelector).should('not.exist');
      } else {
        cy.get(entityTableSelector).should('exist');
      }
    });
    cy.getEntityHeading('Recommendation').should('exist');
    cy.url().should('match', recommendationPageUrlPattern);
  });

  describe('Recommendation page', () => {
    describe('create button click', () => {
      beforeEach(() => {
        cy.visit(recommendationPageUrl);
        cy.wait('@entitiesRequest');
      });

      it('should load create Recommendation page', () => {
        cy.get(entityCreateButtonSelector).click();
        cy.url().should('match', new RegExp('/recommendation/new$'));
        cy.getEntityCreateUpdateHeading('Recommendation');
        cy.get(entityCreateSaveButtonSelector).should('exist');
        cy.get(entityCreateCancelButtonSelector).click();
        cy.wait('@entitiesRequest').then(({ response }) => {
          expect(response.statusCode).to.equal(200);
        });
        cy.url().should('match', recommendationPageUrlPattern);
      });
    });

    describe('with existing value', () => {
      beforeEach(() => {
        cy.authenticatedRequest({
          method: 'POST',
          url: '/services/patientms/api/recommendations',
          body: recommendationSample,
        }).then(({ body }) => {
          recommendation = body;

          cy.intercept(
            {
              method: 'GET',
              url: '/services/patientms/api/recommendations+(?*|)',
              times: 1,
            },
            {
              statusCode: 200,
              body: [recommendation],
            },
          ).as('entitiesRequestInternal');
        });

        cy.visit(recommendationPageUrl);

        cy.wait('@entitiesRequestInternal');
      });

      it('detail button click should load details Recommendation page', () => {
        cy.get(entityDetailsButtonSelector).first().click();
        cy.getEntityDetailsHeading('recommendation');
        cy.get(entityDetailsBackButtonSelector).click();
        cy.wait('@entitiesRequest').then(({ response }) => {
          expect(response.statusCode).to.equal(200);
        });
        cy.url().should('match', recommendationPageUrlPattern);
      });

      it('edit button click should load edit Recommendation page and go back', () => {
        cy.get(entityEditButtonSelector).first().click();
        cy.getEntityCreateUpdateHeading('Recommendation');
        cy.get(entityCreateSaveButtonSelector).should('exist');
        cy.get(entityCreateCancelButtonSelector).click();
        cy.wait('@entitiesRequest').then(({ response }) => {
          expect(response.statusCode).to.equal(200);
        });
        cy.url().should('match', recommendationPageUrlPattern);
      });

      it('edit button click should load edit Recommendation page and save', () => {
        cy.get(entityEditButtonSelector).first().click();
        cy.getEntityCreateUpdateHeading('Recommendation');
        cy.get(entityCreateSaveButtonSelector).click();
        cy.wait('@entitiesRequest').then(({ response }) => {
          expect(response.statusCode).to.equal(200);
        });
        cy.url().should('match', recommendationPageUrlPattern);
      });

      it('last delete button click should delete instance of Recommendation', () => {
        cy.get(entityDeleteButtonSelector).last().click();
        cy.getEntityDeleteDialogHeading('recommendation').should('exist');
        cy.get(entityConfirmDeleteButtonSelector).click();
        cy.wait('@deleteEntityRequest').then(({ response }) => {
          expect(response.statusCode).to.equal(204);
        });
        cy.wait('@entitiesRequest').then(({ response }) => {
          expect(response.statusCode).to.equal(200);
        });
        cy.url().should('match', recommendationPageUrlPattern);

        recommendation = undefined;
      });
    });
  });

  describe('new Recommendation page', () => {
    beforeEach(() => {
      cy.visit(`${recommendationPageUrl}`);
      cy.get(entityCreateButtonSelector).click();
      cy.getEntityCreateUpdateHeading('Recommendation');
    });

    it('should create an instance of Recommendation', () => {
      cy.get(`[data-cy="label"]`).type('absent ugh');
      cy.get(`[data-cy="label"]`).should('have.value', 'absent ugh');

      cy.get(`[data-cy="category"]`).type('assault baggie');
      cy.get(`[data-cy="category"]`).should('have.value', 'assault baggie');

      cy.get(entityCreateSaveButtonSelector).click();

      cy.wait('@postEntityRequest').then(({ response }) => {
        expect(response.statusCode).to.equal(201);
        recommendation = response.body;
      });
      cy.wait('@entitiesRequest').then(({ response }) => {
        expect(response.statusCode).to.equal(200);
      });
      cy.url().should('match', recommendationPageUrlPattern);
    });
  });
});
