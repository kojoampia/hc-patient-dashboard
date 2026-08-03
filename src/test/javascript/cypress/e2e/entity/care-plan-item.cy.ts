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

describe('CarePlanItem e2e test', () => {
  const carePlanItemPageUrl = '/care-plan-item';
  const carePlanItemPageUrlPattern = new RegExp('/care-plan-item(\\?.*)?$');
  const username = Cypress.env('E2E_USERNAME') ?? 'user';
  const password = Cypress.env('E2E_PASSWORD') ?? 'user';
  const carePlanItemSample = {};

  let carePlanItem;

  beforeEach(() => {
    cy.login(username, password);
  });

  beforeEach(() => {
    cy.intercept('GET', '/services/patientms/api/care-plan-items+(?*|)').as('entitiesRequest');
    cy.intercept('POST', '/services/patientms/api/care-plan-items').as('postEntityRequest');
    cy.intercept('DELETE', '/services/patientms/api/care-plan-items/*').as('deleteEntityRequest');
  });

  afterEach(() => {
    if (carePlanItem) {
      cy.authenticatedRequest({
        method: 'DELETE',
        url: `/services/patientms/api/care-plan-items/${carePlanItem.id}`,
      }).then(() => {
        carePlanItem = undefined;
      });
    }
  });

  it('CarePlanItems menu should load CarePlanItems page', () => {
    cy.visit('/');
    cy.clickOnEntityMenuItem('care-plan-item');
    cy.wait('@entitiesRequest').then(({ response }) => {
      if (response.body.length === 0) {
        cy.get(entityTableSelector).should('not.exist');
      } else {
        cy.get(entityTableSelector).should('exist');
      }
    });
    cy.getEntityHeading('CarePlanItem').should('exist');
    cy.url().should('match', carePlanItemPageUrlPattern);
  });

  describe('CarePlanItem page', () => {
    describe('create button click', () => {
      beforeEach(() => {
        cy.visit(carePlanItemPageUrl);
        cy.wait('@entitiesRequest');
      });

      it('should load create CarePlanItem page', () => {
        cy.get(entityCreateButtonSelector).click();
        cy.url().should('match', new RegExp('/care-plan-item/new$'));
        cy.getEntityCreateUpdateHeading('CarePlanItem');
        cy.get(entityCreateSaveButtonSelector).should('exist');
        cy.get(entityCreateCancelButtonSelector).click();
        cy.wait('@entitiesRequest').then(({ response }) => {
          expect(response.statusCode).to.equal(200);
        });
        cy.url().should('match', carePlanItemPageUrlPattern);
      });
    });

    describe('with existing value', () => {
      beforeEach(() => {
        cy.authenticatedRequest({
          method: 'POST',
          url: '/services/patientms/api/care-plan-items',
          body: carePlanItemSample,
        }).then(({ body }) => {
          carePlanItem = body;

          cy.intercept(
            {
              method: 'GET',
              url: '/services/patientms/api/care-plan-items+(?*|)',
              times: 1,
            },
            {
              statusCode: 200,
              body: [carePlanItem],
            },
          ).as('entitiesRequestInternal');
        });

        cy.visit(carePlanItemPageUrl);

        cy.wait('@entitiesRequestInternal');
      });

      it('detail button click should load details CarePlanItem page', () => {
        cy.get(entityDetailsButtonSelector).first().click();
        cy.getEntityDetailsHeading('carePlanItem');
        cy.get(entityDetailsBackButtonSelector).click();
        cy.wait('@entitiesRequest').then(({ response }) => {
          expect(response.statusCode).to.equal(200);
        });
        cy.url().should('match', carePlanItemPageUrlPattern);
      });

      it('edit button click should load edit CarePlanItem page and go back', () => {
        cy.get(entityEditButtonSelector).first().click();
        cy.getEntityCreateUpdateHeading('CarePlanItem');
        cy.get(entityCreateSaveButtonSelector).should('exist');
        cy.get(entityCreateCancelButtonSelector).click();
        cy.wait('@entitiesRequest').then(({ response }) => {
          expect(response.statusCode).to.equal(200);
        });
        cy.url().should('match', carePlanItemPageUrlPattern);
      });

      it('edit button click should load edit CarePlanItem page and save', () => {
        cy.get(entityEditButtonSelector).first().click();
        cy.getEntityCreateUpdateHeading('CarePlanItem');
        cy.get(entityCreateSaveButtonSelector).click();
        cy.wait('@entitiesRequest').then(({ response }) => {
          expect(response.statusCode).to.equal(200);
        });
        cy.url().should('match', carePlanItemPageUrlPattern);
      });

      it('last delete button click should delete instance of CarePlanItem', () => {
        cy.get(entityDeleteButtonSelector).last().click();
        cy.getEntityDeleteDialogHeading('carePlanItem').should('exist');
        cy.get(entityConfirmDeleteButtonSelector).click();
        cy.wait('@deleteEntityRequest').then(({ response }) => {
          expect(response.statusCode).to.equal(204);
        });
        cy.wait('@entitiesRequest').then(({ response }) => {
          expect(response.statusCode).to.equal(200);
        });
        cy.url().should('match', carePlanItemPageUrlPattern);

        carePlanItem = undefined;
      });
    });
  });

  describe('new CarePlanItem page', () => {
    beforeEach(() => {
      cy.visit(`${carePlanItemPageUrl}`);
      cy.get(entityCreateButtonSelector).click();
      cy.getEntityCreateUpdateHeading('CarePlanItem');
    });

    it('should create an instance of CarePlanItem', () => {
      cy.get(`[data-cy="patientId"]`).type('lyre offering');
      cy.get(`[data-cy="patientId"]`).should('have.value', 'lyre offering');

      cy.get(`[data-cy="planType"]`).select('DIET');

      cy.get(`[data-cy="label"]`).type('oh spritz');
      cy.get(`[data-cy="label"]`).should('have.value', 'oh spritz');

      cy.get(`[data-cy="detail"]`).type('bah');
      cy.get(`[data-cy="detail"]`).should('have.value', 'bah');

      cy.get(`[data-cy="cadence"]`).type('innocently whether so');
      cy.get(`[data-cy="cadence"]`).should('have.value', 'innocently whether so');

      cy.get(`[data-cy="completed"]`).should('not.be.checked');
      cy.get(`[data-cy="completed"]`).click();
      cy.get(`[data-cy="completed"]`).should('be.checked');

      cy.get(`[data-cy="sortOrder"]`).type('3804');
      cy.get(`[data-cy="sortOrder"]`).should('have.value', '3804');

      cy.get(`[data-cy="createdDate"]`).type('2026-08-02');
      cy.get(`[data-cy="createdDate"]`).blur();
      cy.get(`[data-cy="createdDate"]`).should('have.value', '2026-08-02');

      cy.get(`[data-cy="modifiedDate"]`).type('2026-08-02');
      cy.get(`[data-cy="modifiedDate"]`).blur();
      cy.get(`[data-cy="modifiedDate"]`).should('have.value', '2026-08-02');

      cy.get(`[data-cy="createdBy"]`).type('accede wherever runaway');
      cy.get(`[data-cy="createdBy"]`).should('have.value', 'accede wherever runaway');

      cy.get(`[data-cy="modifiedBy"]`).type('but');
      cy.get(`[data-cy="modifiedBy"]`).should('have.value', 'but');

      cy.get(entityCreateSaveButtonSelector).click();

      cy.wait('@postEntityRequest').then(({ response }) => {
        expect(response.statusCode).to.equal(201);
        carePlanItem = response.body;
      });
      cy.wait('@entitiesRequest').then(({ response }) => {
        expect(response.statusCode).to.equal(200);
      });
      cy.url().should('match', carePlanItemPageUrlPattern);
    });
  });
});
